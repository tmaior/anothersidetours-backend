import { Injectable, BadRequestException } from '@nestjs/common';
import { Stripe } from 'stripe';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class RefundService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion,
    });
  }

  async createRefund(paymentIntentId: string, amount?: number, chargeId?: string, connectedAccountId?: string) {
    try {
      if (!paymentIntentId && !chargeId) {
        throw new BadRequestException('Either Payment Intent ID or Charge ID is required');
      }

      if (!chargeId) {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(
          paymentIntentId!,
          connectedAccountId ? { stripeAccount: connectedAccountId } : undefined
        );
        const chargeList = await this.stripe.charges.list(
          {
            payment_intent: paymentIntent.id,
            limit: 1
          },
          connectedAccountId ? { stripeAccount: connectedAccountId } : undefined
        );
        if (!chargeList.data.length) {
          throw new BadRequestException(`No charge found for payment intent ${paymentIntent.id}`);
        }
        chargeId = chargeList.data[0].id;
      }

      const charge = await this.stripe.charges.retrieve(
        chargeId,
        connectedAccountId ? { stripeAccount: connectedAccountId } : undefined
      );
      const refunds = await this.stripe.refunds.list(
        { charge: charge.id },
        connectedAccountId ? { stripeAccount: connectedAccountId } : undefined
      );
      const totalRefunded = refunds.data.reduce((sum, r) => sum + r.amount, 0);
      const availableForRefund = charge.amount - totalRefunded;

      if (amount) {
        const requested = Math.round(amount * 100);
        if (requested > availableForRefund) {
          throw new BadRequestException(
            `Cannot refund $${amount.toFixed(2)}. Only $${(availableForRefund/100).toFixed(2)} available.`
          );
        }
      }

      let reservation;

      if (paymentIntentId) {
        reservation = await this.prisma.reservation.findFirst({
          where: {
            paymentIntentId,
          },
          include: {
            Refund: true
          }
        });
      } 
      
      if (!reservation) {
        const transaction = await this.prisma.paymentTransaction.findFirst({
          where: {
            OR: [
              { paymentIntentId },
              { stripe_payment_id: paymentIntentId }
            ]
          }
        });

        if (transaction) {
          reservation = await this.prisma.reservation.findUnique({
            where: { id: transaction.reservation_id },
            include: {
              Refund: true
            }
          });
        }
      }

      if (!reservation) {
        throw new BadRequestException('Reservation not found for this payment');
      }

      const refundParams: Stripe.RefundCreateParams = {
        charge: chargeId,
        amount: amount ? Math.round(amount * 100) : undefined,
      };

      const refundOptions = connectedAccountId ? { stripeAccount: connectedAccountId } : undefined;

      const refund = await this.stripe.refunds.create(refundParams, refundOptions);

      const refundRecord = await this.prisma.refund.create({
        data: {
          reservationId: reservation.id,
          paymentIntentId: paymentIntentId || (refund.payment_intent as string),
          amount: refund.amount / 100,
          status: refund.status,
          connectedAccountId
        }
      });

      await this.prisma.reservation.update({
        where: { id: refundRecord.reservationId },
        data: { 
          total_price: { decrement: refund.amount / 100 } 
        }
      });

      return refundRecord;
    } catch (error) {
      console.error('Error during refund:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      if (error.type === 'StripeInvalidRequestError') {
        throw new BadRequestException(error.message);
      }
      throw new Error('Failed to process refund');
    }
  }
}

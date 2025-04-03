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

  async createRefund(paymentIntentId: string, amount?: number) {
    try {

      if (!paymentIntentId) {
        throw new BadRequestException('Payment Intent ID is required');
      }

      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      const reservation = await this.prisma.reservation.findFirst({
        where: {
          paymentIntentId,
        },
        include: {
          Refund: true
        }
      });

      if (!reservation) {
        throw new BadRequestException('Reservation not found for this payment intent');
      }

      const existingRefund = await this.prisma.refund.findFirst({
        where: {
          paymentIntentId,
        },
      });

      const refunds = await this.stripe.refunds.list({
        payment_intent: paymentIntentId,
      });

      const totalRefunded = refunds.data.reduce((sum, refund) => sum + refund.amount, 0);
      const availableForRefund = paymentIntent.amount - totalRefunded;

      if (amount) {
        const requestedAmountInCents = Math.round(amount * 100);
        if (requestedAmountInCents > availableForRefund) {
          throw new BadRequestException(
            `Cannot refund $${amount.toFixed(2)}. Only $${(availableForRefund / 100).toFixed(2)} is available for refund.`
          );
        }
      }

      let refundAmount: number;
      let refundRecord;

      if (existingRefund) {
        if (amount && amount < existingRefund.amount) {
          const refund = await this.stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: Math.round(amount * 100),
          });
          refundAmount = refund.amount / 100;
          refundRecord = await this.prisma.refund.update({
            where: { id: existingRefund.id },
            data: {
              amount: refundAmount,
              status: refund.status,
            },
          });
        } else {
          throw new BadRequestException('A refund already exists for this payment intent');
        }
      } else {
        const refund = await this.stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined,
        });

        refundAmount = refund.amount / 100;
        refundRecord = await this.prisma.refund.create({
          data: {
            reservationId: reservation.id,
            paymentIntentId,
            amount: refundAmount,
            status: refund.status,
          },
        });
      }
      const newTotalPrice = reservation.total_price - refundAmount;
      await this.prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          total_price: newTotalPrice
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

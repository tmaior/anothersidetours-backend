import { Injectable } from '@nestjs/common';
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
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
      });

      const reservation = await this.prisma.reservation.findFirst({
        where: {
          paymentIntentId,
        },
      });

      return await this.prisma.refund.create({
        data: {
          reservationId: reservation.id,
          paymentIntentId,
          amount: refund.amount / 100,
          status: refund.status,
        },
      });
    } catch (error) {
      console.error('Error during refund:', error);
      throw new Error('Failed to process refund');
    }
  }
}

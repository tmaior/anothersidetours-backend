import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Controller('payment-transactions')
export class PaymentTransactionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('by-payment-intent/:paymentIntentId')
  async getTransactionsByPaymentIntent(@Param('paymentIntentId') paymentIntentId: string) {
    if (!paymentIntentId) {
      throw new BadRequestException('Payment Intent ID is required');
    }

    try {
      const transactions = await this.prisma.paymentTransaction.findMany({
        where: {
          OR: [
            { paymentIntentId: paymentIntentId },
            { stripe_payment_id: paymentIntentId }
          ]
        },
        include: {
          child_transactions: true
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return transactions;
    } catch (error) {
      console.error('Error fetching transactions by payment intent:', error);
      throw new Error('Failed to fetch payment transactions');
    }
  }
} 
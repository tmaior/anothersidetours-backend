import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { RefundService } from '../services/refund.service';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Controller('refund')
export class RefundController {
  constructor(
    private readonly refundService: RefundService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  async refundPayment(
    @Body() body: { 
      paymentIntentId: string; 
      paymentMethodId: string; 
      amount?: number;
      originalTransactionId?: string;
      chargeId?: string;
    },
  ) {
    try {
      if (body.originalTransactionId) {
        const originalTransaction = await this.prisma.paymentTransaction.findUnique({
          where: { id: body.originalTransactionId },
          include: {
            child_transactions: {
              where: {
                transaction_direction: 'refund',
                payment_status: 'completed'
              }
            }
          }
        });

        if (!originalTransaction) {
          throw new BadRequestException('Original transaction not found');
        }

        const refundedAmount = originalTransaction.refunded_amount || 
                              originalTransaction.child_transactions.reduce(
                                (sum, child) => sum + child.amount, 0
                              );
        const availableAmount = 
          originalTransaction.available_refund_amount !== null && 
          originalTransaction.available_refund_amount !== undefined ? 
          originalTransaction.available_refund_amount : 
          Math.max(0, originalTransaction.amount - refundedAmount);

        if (body.amount && body.amount > availableAmount) {
          throw new BadRequestException(
            `Cannot refund $${body.amount.toFixed(2)}. Only $${availableAmount.toFixed(2)} is available for refund.`
          );
        }
        if (!body.paymentIntentId && originalTransaction.paymentIntentId) {
          body.paymentIntentId = originalTransaction.paymentIntentId;
        } else if (!body.paymentIntentId && originalTransaction.stripe_payment_id) {
          body.paymentIntentId = originalTransaction.stripe_payment_id;
        }

        if (!body.paymentIntentId && !body.chargeId) {
          throw new BadRequestException('The transaction does not have a valid payment ID or charge ID for refund');
        }
        
        if (!body.chargeId && body.paymentIntentId && body.paymentIntentId.startsWith('seti_')) {
          throw new BadRequestException('The transaction does not have a valid payment ID for refund');
        }
      }
      const refund = await this.refundService.createRefund(
        body.paymentIntentId,
        body.amount,
        body.chargeId
      );

      if (body.originalTransactionId && refund) {
        const originalTransaction = await this.prisma.paymentTransaction.findUnique({
          where: { id: body.originalTransactionId }
        });

        if (originalTransaction) {
          const currentRefundedAmount = originalTransaction.refunded_amount || 0;
          const newRefundedAmount = currentRefundedAmount + (refund.amount || 0);
          const newAvailableAmount = Math.max(0, originalTransaction.amount - newRefundedAmount);

          await this.prisma.paymentTransaction.update({
            where: { id: body.originalTransactionId },
            data: {
              refunded_amount: newRefundedAmount,
              available_refund_amount: newAvailableAmount,
              is_refundable: newAvailableAmount > 0,
              last_refund_date: new Date()
            }
          });
        }
      }

      return { success: true, message: 'Refund processed', refund, id: refund.id };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new BadRequestException(error.message || 'Failed to process refund');
    }
  }
}
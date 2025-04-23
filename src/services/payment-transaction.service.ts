import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Prisma, PaymentTransaction } from '@prisma/client';
import { MailService } from './mail.service';
import { format } from 'date-fns';
import { CreatePaymentTransactionDto } from '../types/payment-transaction.types';

type PaymentTransactionMetadata = {
  guestQuantity?: number;
  addons?: any[];
  customItems?: any[];
  tourDetails?: any;
  userDetails?: any;
  originalStatus?: string;
  groupId?: string;
  modifiedAt?: string;
};

type ExtendedPaymentTransactionCreateInput = Omit<Prisma.PaymentTransactionCreateInput, 'metadata'> & {
  metadata?: PaymentTransactionMetadata;
};

type RefundabilityResult = {
  isRefundable: boolean;
  availableAmount: number;
  refundedAmount: number;
  originalAmount: number;
  transaction?: PaymentTransaction;
  refundHistory?: PaymentTransaction[];
  message?: string;
  status: string;
};

@Injectable()
export class PaymentTransactionService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async getTransactionsByTenantId(tenantId: string): Promise<PaymentTransaction[]> {
    return this.prisma.paymentTransaction.findMany({
      where: { tenant_id: tenantId },
      include: {
        tenant: true,
        reservation: {
          include: {
            tour: true,
            user: true,
            reservationAddons: {
              include: {
                addon: true,
              },
            },
          },
        },
      },
    });
  }

  async getAllTransactions(): Promise<PaymentTransaction[]> {
    return this.prisma.paymentTransaction.findMany({
      include: {
        tenant: true,
        reservation: {
          include: {
            tour: true,
            user: true,
            reservationAddons: {
              include: {
                addon: true,
              },
            },
          },
        },
      },
    });
  }

  async getTransactionById(tenantId: string, id: string): Promise<PaymentTransaction | null> {
    return this.prisma.paymentTransaction.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        tenant: true,
        reservation: {
          include: {
            tour: true,
            user: true,
            reservationAddons: {
              include: {
                addon: true,
              },
            },
          },
        },
        child_transactions: {
          where: {
            transaction_direction: 'refund',
            payment_status: 'completed',
          },
        },
      },
    });
  }

  async createTransaction(data: CreatePaymentTransactionDto): Promise<PaymentTransaction> {
    const { metadata, ...transactionData } = data;
    
    let availableRefundAmount = 0;
    if (
      transactionData.transaction_direction === 'charge' && 
      (transactionData.payment_status === 'completed' || transactionData.payment_status === 'paid') &&
      transactionData.payment_method?.toLowerCase().includes('card')
    ) {
      availableRefundAmount = transactionData.amount;
    }

    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        ...transactionData,
        metadata: metadata ? JSON.stringify(metadata) : null,
        created_at: new Date(),
        available_refund_amount: availableRefundAmount,
        is_refundable: availableRefundAmount > 0
      },
      include: {
        tenant: true,
        reservation: {
          include: {
            tour: true,
            user: true,
            reservationAddons: {
              include: {
                addon: true,
              },
            },
          },
        },
      },
    });

    if (data.payment_method === 'invoice') {
      await this.sendInvoiceEmail(transaction.id);
    }
    return transaction;
  }

  async updateTransaction(
    id: string,
    data: Prisma.PaymentTransactionUpdateInput,
  ): Promise<PaymentTransaction> {
    let updateData = { ...data };
    
    if (data.payment_status === 'completed' || data.payment_status === 'paid') {
      const currentTransaction = await this.prisma.paymentTransaction.findUnique({
        where: { id },
        select: { 
          amount: true, 
          payment_method: true, 
          transaction_direction: true,
          parent_transaction_id: true
        }
      });
      
      if (
        currentTransaction && 
        currentTransaction.transaction_direction === 'charge' && 
        currentTransaction.payment_method?.toLowerCase().includes('card')
      ) {
        updateData.available_refund_amount = currentTransaction.amount;
        updateData.is_refundable = true;
      }
      
      if (
        currentTransaction && 
        currentTransaction.transaction_direction === 'refund' && 
        currentTransaction.parent_transaction_id
      ) {
        const parentTransaction = await this.prisma.paymentTransaction.findUnique({
          where: { id: currentTransaction.parent_transaction_id },
          select: { 
            id: true, 
            amount: true, 
            available_refund_amount: true,
            refunded_amount: true
          }
        });
        
        if (parentTransaction) {
          const newRefundedAmount = (parentTransaction.refunded_amount || 0) + currentTransaction.amount;
          const newAvailableAmount = Math.max(0, parentTransaction.amount - newRefundedAmount);
          
          await this.prisma.paymentTransaction.update({
            where: { id: parentTransaction.id },
            data: {
              refunded_amount: newRefundedAmount,
              available_refund_amount: newAvailableAmount,
              is_refundable: newAvailableAmount > 0,
              last_refund_date: new Date()
            }
          });
        }
      }
    }
    
    const transaction = await this.prisma.paymentTransaction.update({
      where: { id },
      data: updateData,
    });

    if (data.payment_status === 'pending' && transaction.payment_method === 'invoice') {
      await this.sendInvoiceEmail(transaction.id);
    }
    return transaction;
  }

  async deleteTransaction(tenantId: string, id: string) {
    return this.prisma.paymentTransaction.deleteMany({
      where: { id, tenant_id: tenantId },
    });
  }

  private async sendInvoiceEmail(transactionId: string) {
    try {
      const transaction = await this.prisma.paymentTransaction.findUnique({
        where: { id: transactionId },
        include: {
          reservation: {
            include: {
              tour: true,
              user: true,
              reservationAddons: {
                include: {
                  addon: true,
                },
              },
            },
          },
          tenant: true,
        },
      });

      if (!transaction) {
        console.error(`Transaction ${transactionId} not found`);
        return;
      }

      const { reservation } = transaction;
      
      if (!reservation || !reservation.user) {
        console.error(`Reservation or user not found for transaction ${transactionId}`);
        return;
      }

      if (!reservation.user.email || !reservation.user.email.includes('@')) {
        console.error(`Invalid email address for reservation ${reservation.id}:`, reservation.user.email);
        return;
      }

      const reservationDate = new Date(reservation.reservation_date);
      const formattedDate = format(reservationDate, 'yyyy-MM-dd');
      const dueDate = transaction.due_date ? format(new Date(transaction.due_date), 'MMM dd, yyyy') : 'N/A';

      const time = '12:00 PM';
      const duration = reservation.tour?.duration?.toString() || '1';

      const addons = reservation.reservationAddons.map(addon => ({
        label: addon.addon.label || 'Add-on',
        amount: `$${Number(addon.addon.price).toFixed(2)}`
      }));

      const totalAddonsPrice = addons.length > 0 
        ? addons.reduce((sum, item) => sum + parseFloat(item.amount.substring(1)), 0) 
        : 0;
        
      const totals = [
        { label: `Guests x ${reservation.guestQuantity}`, amount: `$${(reservation.total_price - totalAddonsPrice).toFixed(2)}` },
        { label: 'Total', amount: `$${reservation.total_price.toFixed(2)}` }
      ];
      const bookingFeePercentage = 6;
      totals.splice(1, 0, { 
        label: `${bookingFeePercentage}% Booking Fee`, 
        amount: `$${(reservation.total_price * (bookingFeePercentage / 100)).toFixed(2)}` 
      });
      const paymentLink = `${process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_API_URL}/invoicepayment/${reservation.id}`;

      const emailData = {
        title: 'Invoice for Upcoming Reservation',
        date: formattedDate,
        time: time,
        duration: duration,
        name: reservation.user.name,
        email: reservation.user.email,
        phone: reservation.user.phone || 'N/A',
        tourTitle: reservation.tour?.name || 'Tour',
        reservationImageUrl: reservation.tour?.imageUrl || 'https://another-images.s3.us-east-1.amazonaws.com/tours/logo.png',
        quantity: reservation.guestQuantity,
        description: transaction.invoice_message || 'Your invoice is ready for payment',
        totals: totals,
        addons: addons,
        amountDue: `$${transaction.amount.toFixed(2)}`,
        dueDate: dueDate,
        status: 'pending',
        reservationCode: reservation.id.substring(0, 6).toUpperCase(),
        paymentLink: paymentLink,
        tenantName: transaction.tenant?.name || 'Our Company',
        reservationId: reservation.id,
        transactionId: transactionId
      };

      await this.mailService.sendInvoiceEmail(reservation.user.email, emailData);

      await this.prisma.notification.create({
        data: {
          tenant: { connect: { id: transaction.tenant_id } },
          reservation: { connect: { id: reservation.id } },
          method: 'email',
          status: 'sent',
          created_at: new Date(),
        },
      });
      
    } catch (error) {
      console.error('Error sending invoice email:', error);
    }
  }

  async getTransactionsByReservation(
    reservationId: string,
    paymentMethod?: string,
    paymentStatus?: string,
  ): Promise<PaymentTransaction[]> {
    const whereClause: any = { reservation_id: reservationId };
    if (paymentMethod) {
      whereClause.payment_method = paymentMethod;
    }
    
    if (paymentStatus) {
      whereClause.payment_status = paymentStatus;
    }
    
    return this.prisma.paymentTransaction.findMany({
      where: whereClause,
      include: {
        tenant: true,
        reservation: {
          include: {
            tour: true,
            user: true
          }
        },
        child_transactions: {
          where: {
            transaction_direction: 'refund',
            payment_status: 'completed'
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }

  async getRefundableTransactions(reservationId: string): Promise<any[]> {
    const transactions = await this.prisma.paymentTransaction.findMany({
      where: {
        reservation_id: reservationId,
        transaction_direction: 'charge',
        OR: [
          { payment_status: 'completed' },
          { payment_status: 'paid' }
        ],
        payment_method: {
          contains: 'card',
          mode: 'insensitive'
        },
        is_refundable: true,
        available_refund_amount: {
          gt: 0
        }
      },
      include: {
        child_transactions: {
          where: {
            transaction_direction: 'refund',
            payment_status: 'completed'
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return transactions.map(tx => {
      const refundedAmount = tx.refunded_amount || 
                            tx.child_transactions.reduce((sum, child) => sum + child.amount, 0);
      
      const availableAmount = tx.available_refund_amount !== null ? 
                             tx.available_refund_amount : 
                             Math.max(0, tx.amount - refundedAmount);
      
      return {
        id: tx.id,
        amount: tx.amount,
        paymentMethod: tx.payment_method,
        paymentStatus: tx.payment_status,
        createdAt: tx.created_at,
        paymentIntentId: tx.paymentIntentId,
        paymentMethodId: tx.paymentMethodId,
        stripePaymentId: tx.stripe_payment_id,
        refundedAmount: refundedAmount,
        availableAmount: availableAmount,
        isRefundable: availableAmount > 0,
        lastRefundDate: tx.last_refund_date,
        refundHistory: tx.child_transactions
      };
    });
  }

  async validateRefundability(transactionId: string, amount?: number | null): Promise<RefundabilityResult> {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        child_transactions: {
          where: {
            transaction_direction: 'refund',
            payment_status: 'completed'
          },
          orderBy: {
            created_at: 'desc'
          }
        }
      }
    });

    if (!transaction) {
      return {
        isRefundable: false,
        availableAmount: 0,
        refundedAmount: 0,
        originalAmount: 0,
        status: 'error',
        message: 'Transaction not found'
      };
    }

    const isCardPayment = transaction.payment_method?.toLowerCase().includes('card');
    if (!isCardPayment) {
      return {
        isRefundable: false,
        availableAmount: 0,
        refundedAmount: 0,
        originalAmount: transaction.amount,
        transaction,
        status: 'error',
        message: 'Only card payments can be refunded via Stripe'
      };
    }

    if (transaction.transaction_direction !== 'charge') {
      return {
        isRefundable: false,
        availableAmount: 0,
        refundedAmount: 0,
        originalAmount: transaction.amount,
        transaction,
        status: 'error',
        message: 'Only charge transactions can be refunded'
      };
    }

    const hasValidPaymentId = transaction.paymentIntentId && 
                             !transaction.paymentIntentId.startsWith('seti_');
    
    if (!hasValidPaymentId) {
      return {
        isRefundable: false,
        availableAmount: 0,
        refundedAmount: 0,
        originalAmount: transaction.amount,
        transaction,
        status: 'error',
        message: 'Transaction does not have a valid payment ID for refund'
      };
    }

    const refundedAmount = transaction.refunded_amount || 
                          transaction.child_transactions.reduce((sum, child) => sum + child.amount, 0);
    
    const availableAmount = transaction.available_refund_amount !== null ? 
                           transaction.available_refund_amount : 
                           Math.max(0, transaction.amount - refundedAmount);

    if (availableAmount <= 0) {
      return {
        isRefundable: false,
        availableAmount: 0,
        refundedAmount,
        originalAmount: transaction.amount,
        transaction,
        refundHistory: transaction.child_transactions,
        status: 'error',
        message: 'No refundable amount available'
      };
    }

    if (amount !== null && amount !== undefined) {
      if (amount <= 0) {
        return {
          isRefundable: false,
          availableAmount,
          refundedAmount,
          originalAmount: transaction.amount,
          transaction,
          refundHistory: transaction.child_transactions,
          status: 'error',
          message: 'Refund amount must be greater than zero'
        };
      }

      if (amount > availableAmount) {
        return {
          isRefundable: false,
          availableAmount,
          refundedAmount,
          originalAmount: transaction.amount,
          transaction,
          refundHistory: transaction.child_transactions,
          status: 'error',
          message: `Requested amount (${amount}) exceeds available amount (${availableAmount})`
        };
      }
    }

    return {
      isRefundable: true,
      availableAmount,
      refundedAmount,
      originalAmount: transaction.amount,
      transaction,
      refundHistory: transaction.child_transactions,
      status: 'success',
      message: 'Transaction is eligible for refund'
    };
  }
}
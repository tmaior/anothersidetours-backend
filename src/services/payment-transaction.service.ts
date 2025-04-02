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
      },
    });
  }

  async createTransaction(data: CreatePaymentTransactionDto): Promise<PaymentTransaction> {
    const { metadata, ...transactionData } = data;
    
    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        ...transactionData,
        metadata: metadata ? JSON.stringify(metadata) : null,
        created_at: new Date(),
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
    const transaction = await this.prisma.paymentTransaction.update({
      where: { id },
      data,
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
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }
}
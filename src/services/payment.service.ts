import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Request, Response } from 'express';
import { MailService } from './mail.service';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion,
    });
  }

  async savePaymentMethod(paymentMethodId: string, reservationId: string) {
    await this.prisma.paymentTransaction.update({
      where: { id: reservationId },
      data: { paymentMethodId },
    });

    // await this.sendNotificationEmails(reservationId);

    return { message: 'Payment method saved and notification sent' };
  }

  async getPaymentMethodDetails(paymentMethodId: string) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

      if (paymentMethod.type !== 'card') {
        throw new Error('Payment method is not a card');
      }

      return {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        paymentDate: new Date(paymentMethod.created * 1000),
      };
    } catch (error) {
      console.error('Error retrieving payment method:', error);
      return null;
    }
  }

  async createSetupIntent(reservationId: string) {
    const setupIntent = await this.stripe.setupIntents.create({
      payment_method_types: ['card'],
      metadata: { reservationId },
    });
    const existingTransaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: reservationId },
    });

    if (existingTransaction) {
      await this.prisma.paymentTransaction.update({
        where: { id: reservationId },
        data: { setupIntentId: setupIntent.id },
      });
    } else {
      const reservation = await this.prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { tour: true }
      });
      
      if (!reservation) {
        throw new Error('Reservation not found');
      }
      await this.prisma.paymentTransaction.create({
        data: {
          id: reservationId,
          setupIntentId: setupIntent.id,
          amount: reservation.total_price || 0,
          payment_status: 'pending',
          payment_method: 'card',
          tenant: {
            connect: {
              id: reservation.tour.tenantId
            }
          },
          reservation: {
            connect: {
              id: reservationId
            }
          }
        },
      });
    }

    return { clientSecret: setupIntent.client_secret };
  }

  async createSetupIntentForTransaction(transactionId: string) {
    const setupIntent = await this.stripe.setupIntents.create({
      payment_method_types: ['card'],
      metadata: { transactionId },
    });
    const existingTransaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });
    if (existingTransaction) {
      await this.prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: { setupIntentId: setupIntent.id },
      });
    } else {
      throw new Error('Transaction not found. Must create a transaction record before calling this method.');
    }

    return { clientSecret: setupIntent.client_secret };
  }

  async savePaymentMethodForTransaction(paymentMethodId: string, transactionId: string) {
    await this.prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: { 
        paymentMethodId,
        payment_status: 'processing'
      },
    });

    return { message: 'Payment method saved for transaction' };
  }

  async processTransactionPayment(transactionId: string) {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        reservation: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (!transaction.paymentMethodId) {
      throw new Error('No payment method attached to this transaction');
    }

    const email = transaction.reservation?.user?.email || 'customer@example.com';
    const name = transaction.reservation?.user?.name || 'Customer';
    
    const customers = await this.stripe.customers.list({
      email: email,
      limit: 1,
    });
    
    let customerId: string;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const newCustomer = await this.stripe.customers.create({
        email: email,
        name: name,
      });
      customerId = newCustomer.id;
    }

    try {
      await this.stripe.paymentMethods.attach(transaction.paymentMethodId, {
        customer: customerId,
      });

      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: transaction.paymentMethodId,
        },
      });
    } catch (error) {
      console.log('Payment method may already be attached:', error.message);
    }

    const amountInCents = Math.round(transaction.amount * 100);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: customerId,
      payment_method: transaction.paymentMethodId,
      description: `Payment for reservation ${transaction.reservation_id}`,
      confirm: true,
      metadata: {
        transactionId: transaction.id,
        reservationId: transaction.reservation_id,
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    await Promise.all([
      this.prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          payment_status: paymentIntent.status === 'succeeded' ? 'paid' : 'failed',
          stripe_payment_id: paymentIntent.id,
          paymentIntentId: paymentIntent.id
        },
      }),
      this.prisma.reservation.update({
        where: { id: transaction.reservation_id },
        data: {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status === 'succeeded' ? 'ACCEPTED' : 'PENDING'
        },
      })
    ]);

    return {
      success: paymentIntent.status === 'succeeded',
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
    };
  }

  async processReservationPayment(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        user: true,
      },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (!reservation.paymentMethodId) {
      throw new Error('No payment method attached to this reservation');
    }
    const email = reservation.user?.email || 'customer@example.com';
    const name = reservation.user?.name || 'Customer';
    
    const customers = await this.stripe.customers.list({
      email: email,
      limit: 1,
    });
    
    let customerId: string;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const newCustomer = await this.stripe.customers.create({
        email: email,
        name: name,
      });
      customerId = newCustomer.id;
    }

    try {
      await this.stripe.paymentMethods.attach(reservation.paymentMethodId, {
        customer: customerId,
      });

      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: reservation.paymentMethodId,
        },
      });
    } catch (error) {
      console.log('Payment method may already be attached:', error.message);
    }

    const amountInCents = Math.round(reservation.total_price * 100);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: customerId,
      payment_method: reservation.paymentMethodId,
      description: `Payment for reservation ${reservation.id}`,
      confirm: true,
      metadata: {
        reservationId: reservation.id,
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'ACCEPTED' : 'PENDING'
      },
    });

    return {
      success: paymentIntent.status === 'succeeded',
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
    };
  }

  async confirmPayment(
    email: string,
    paymentMethodId: string,
    amount: number,
    currency: string,
  ) {
    const newCustomer = await this.stripe.customers.create({
      email: email,
    });
    const customerId = newCustomer.id;

    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    await this.prisma.reservation.update({
      where: { paymentMethodId: paymentMethodId },
      data: { paymentIntentId: paymentIntent.id },
    });

    return {
      message: 'Payment confirmed',
      paymentIntentId: paymentIntent.id,
    };
  }

  async rejectReservation(reservationId: string, reason: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        user: true,
        tour: true,
      },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.paymentMethodId) {
      try {
        await this.stripe.paymentMethods.detach(reservation.paymentMethodId);
      } catch (error) {
        console.error('Error detaching payment method:', error);
        throw new Error('Failed to detach payment method.');
      }
    }

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'rejected' },
    });

    const { email, name, phone } = reservation.user;
    const duration = reservation.tour?.duration
      ? `${reservation.tour.duration} minutes`
      : 'N/A';

    const formattedDate = new Date(reservation.reservation_date).toLocaleString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );

    await this.mailService.sendReservationEmail(email, {
      status: 'declined',
      name,
      email,
      phone: phone || 'None',
      date: formattedDate,
      time: '',
      duration,
      quantity: reservation.guestQuantity || 0,
      totals: [
        {
          label: 'Total Price',
          amount: `$${reservation.total_price.toFixed(2)}`,
        },
      ],
      reason,
    });

    return { message: 'Reservation rejected and email sent to the user.' };
  }

  async invalidatePaymentMethod(paymentMethodId: string) {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);

      return { message: 'Payment method invalidated successfully.' };
    } catch (error) {
      console.error('Error invalidating payment method:', error);
      throw new Error('Failed to invalidate payment method.');
    }
  }

  async getPaymentStatus(paymentIntentId: string) {
    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return { status: paymentIntent.status, id: paymentIntent.id };
  }

  async handleWebhook(req: Request, res: Response) {
    let event: Stripe.Event;
    const signature = req.headers['stripe-signature'];

    try {
      event = this.stripe.webhooks.constructEvent(
        req.body as Buffer,
        signature,
        this.endpointSecret,
      );
    } catch (err) {
      console.log(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge;
        console.log(`Pagamento de ${charge.amount} foi bem-sucedido!`);
        break;
      }
      case 'charge.failed': {
        const charge = event.data.object as Stripe.Charge;
        console.log(`Pagamento de ${charge.amount} falhou.`);
        break;
      }
      default:
        console.log(`Evento não tratado: ${event.type}`);
    }
    return res.status(200).send({ received: true });
  }
}
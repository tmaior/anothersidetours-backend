import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Request, Response } from 'express';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion,
    });
  }

  async savePaymentMethod(paymentMethodId: string, reservationId: string) {
    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { paymentMethodId },
    });

    // await this.sendNotificationEmails(reservationId);

    return { message: 'Método de pagamento salvo e notificação enviada' };
  }

  async createSetupIntent(reservationId: string) {
    const setupIntent = await this.stripe.setupIntents.create({
      payment_method_types: ['card'],
      metadata: { reservationId },
    });
    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { setupIntentId: setupIntent.id },
    });

    return { clientSecret: setupIntent.client_secret };
  }

  async confirmPayment(
    paymentMethodId: string,
    amount: number,
    currency: string,
    email: string,
  ) {

    const newCustomer = await this.stripe.customers.create({
      email: email,
    });
    const customerId = newCustomer.id;

    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return await this.stripe.paymentIntents.create({
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
      console.log(
        `Webhook signature verification failed: ${err.message}`,
      );
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
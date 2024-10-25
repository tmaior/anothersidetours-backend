import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Request, Response } from 'express';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private endpointSecret = 'secret';

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-09-30.acacia',
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    reservationId: string,
  ) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { reservationId },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { paymentIntentId: paymentIntent.id },
    });

    return { clientSecret: paymentIntent.client_secret };
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
        `⚠️  Falha na verificação da assinatura do webhook: ${err.message}`,
      );
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Pagamento de ${paymentIntent.amount} foi bem-sucedido!`);
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }
    return res.status(200).send({ received: true });
  }
}

import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Request, Response } from 'express';
import { MailService } from './mail.service';
import { GoogleCalendarService } from './google-calendar.service';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private googleCalendarService: GoogleCalendarService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion,
    });
  }

  async createConnectAccount(
    businessName: string, 
    email: string, 
    businessProfile: {
      support_email?: string;
      support_phone?: string;
      support_url?: string;
      website?: string;
    } = {},
    country = 'BR' // TODO change to 'US'
  ) {
    try {
      const account = await this.stripe.accounts.create({
        type: 'custom',
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        company: {
          name: businessName,
        },
        business_profile: {
          name: businessName,
          support_email: businessProfile.support_email,
          support_phone: businessProfile.support_phone,
          support_url: businessProfile.support_url,
          url: businessProfile.website,
          mcc: '7999',
        },
        settings: {
          payments: {
            statement_descriptor: businessName.substring(0, 22), // Stripe limits to 22 chars
            // statement_descriptor_kana: businessName.substring(0, 22),
            // statement_descriptor_kanji: businessName.substring(0, 22),
          },
          payouts: {
            statement_descriptor: businessName.substring(0, 22),
            schedule: {
              delay_days: 30,
              interval: 'daily'
            }
          },
          card_payments: {
            statement_descriptor_prefix: businessName.substring(0, 10),
          },
          branding: {
            primary_color: '#000000',
            secondary_color: '#ffffff',
          },
        },
      });

      return account;
    } catch (error) {
      console.error('Error creating Connect account:', error);
      throw error;
    }
  }

  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      console.error('Error creating account link:', error);
      throw error;
    }
  }

  async updateConnectAccount(accountId: string, updates: Partial<Stripe.AccountUpdateParams>) {
    try {
      const account = await this.stripe.accounts.update(accountId, updates);
      return account;
    } catch (error) {
      console.error('Error updating Connect account:', error);
      throw error;
    }
  }

  async getConnectAccount(accountId: string) {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      return account;
    } catch (error) {
      console.error('Error retrieving Connect account:', error);
      throw error;
    }
  }

  async savePaymentMethod(paymentMethodId: string, reservationId: string, stripeAccountId?: string) {
    const existingTransaction = await this.prisma.paymentTransaction.findFirst({
      where: { 
        reservation_id: reservationId,
        transaction_type: 'CREATE'
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (existingTransaction) {
      await this.prisma.paymentTransaction.update({
        where: { id: existingTransaction.id },
        data: { 
          paymentMethodId,
          payment_status: 'processing'
        },
      });
    } else {
      await this.prisma.paymentTransaction.update({
        where: { id: reservationId },
        data: { paymentMethodId },
      });
    }

    return { message: 'Payment method saved' };
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

  async createSetupIntent(reservationId: string, stripeAccountId?: string) {
    const setupIntentParams: Stripe.SetupIntentCreateParams = {
      payment_method_types: ['card'],
      metadata: { reservationId },
    };

    const setupIntent = await this.stripe.setupIntents.create(
      setupIntentParams,
      stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
    );

    const existingTransaction = await this.prisma.paymentTransaction.findFirst({
      where: { 
        reservation_id: reservationId,
        transaction_type: 'CREATE'
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (existingTransaction) {
      await this.prisma.paymentTransaction.update({
        where: { id: existingTransaction.id },
        data: { 
          setupIntentId: setupIntent.id,
          payment_method: 'card'
        },
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

  async createSetupIntentForTransaction(transactionId: string, stripeAccountId?: string) {
    const setupIntent = await this.stripe.setupIntents.create(
      {
        payment_method_types: ['card'],
        metadata: { transactionId },
      },
      stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
    );

    await this.prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: { setupIntentId: setupIntent.id },
    });

    return { clientSecret: setupIntent.client_secret };
  }

  async savePaymentMethodForTransaction(paymentMethodId: string, transactionId: string, stripeAccountId?: string) {
    await this.prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: { 
        paymentMethodId,
        payment_status: 'processing'
      },
    });

    return { message: 'Payment method saved for transaction' };
  }

  async syncReservationWithCalendar(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        tour: true,
        user: true,
        tenant: true,
      },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    const reservationGuides = await this.prisma.reservationGuide.findMany({
      where: { reservationId },
      include: {
        guide: true,
      },
    });

    const purchaseNotes = await this.prisma.purchase_Notes.findMany({
      where: { reservationId },
    });

    const additionalInfo = await this.prisma.additionalInformation.findMany({
      where: { tourId: reservation.tourId },
    });

    const customerResponses = await this.prisma.customerAdditionalInformation.findMany({
      where: { reservationId },
    });

    let additionalInfoText = '';
    if (additionalInfo.length > 0 && customerResponses.length > 0) {
      additionalInfoText = '\n\nQuestionnaire:';
      for (const info of additionalInfo) {
        const response = customerResponses.find(
          resp => resp.additionalInformationId === info.id
        );
        additionalInfoText += `\n${info.title}: ${response?.value || 'No response'}`;
      }
    }

    let guidesText = '';
    if (reservationGuides.length > 0) {
      guidesText = '\nGuides: ';
      guidesText += reservationGuides
        .map(rg => rg.guide?.name || 'Unknown Guide')
        .join(', ');
    }

    let notesText = '';
    if (purchaseNotes.length > 0) {
      notesText = '\n\nPurchase Notes:';
      for (const note of purchaseNotes) {
        notesText += `\n- ${note.description}`;
      }
    }

    const startTime = new Date(reservation.reservation_date);
    const endTime = new Date(startTime.getTime() + (reservation.tour.duration || 60) * 60000);

    const adminEmployees = await this.prisma.employee.findMany({
      where: {
        employeeRoles: {
          some: {
            role: {
              name: 'ADMIN',
            },
          },
        },
      },
    });

    for (const admin of adminEmployees) {
      try {
        const isAuthorized = await this.googleCalendarService.checkAuthStatus(admin.id);
        
        if (!isAuthorized) {
          continue;
        }
        const tenantName = reservation.tenant.name;
        const reservationData = {
          id: reservation.id,
          title: `${reservation.tour.name} - ${reservation.user.name}`,
          description: `Guest: ${reservation.user.name}
Email: ${reservation.user.email}
Phone: ${reservation.user.phone || 'N/A'}
Guests: ${reservation.guestQuantity}
Status: ${reservation.status}${guidesText}${additionalInfoText}${notesText}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          tenantId: reservation.tenantId
        };

        const result = await this.googleCalendarService.syncReservationsByTenant(
          admin.id,
          { [tenantName]: [reservationData] }
        );

        if (result.success) {
          return { 
            success: true, 
            message: `Reservation synced with Google Calendar in '${tenantName}' calendar` 
          };
        }
      } catch (error) {
        continue;
      }
    }
    return { 
      success: false, 
      message: 'No admin with Google Calendar authorization found' 
    };
  }
  async processTransactionPayment(transactionId: string, stripeAccountId?: string) {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        tenant: true,
        reservation: {
          include: {
            user: true,
            tour: true
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

    const connectedAccountId = stripeAccountId || transaction.tenant?.stripeAccountId;
    if (!connectedAccountId) {
      throw new Error('No Stripe Connected Account ID found for this tenant');
    }

    const email = transaction.reservation?.user?.email || 'customer@example.com';
    const name = transaction.reservation?.user?.name || 'Customer';

    const amountInCents = Math.round(transaction.amount * 100);
    const platformFeePercent = 0.10;
    const applicationFeeAmount = Math.round(amountInCents * platformFeePercent);

    console.log('Processing payment with connected account:', {
      tenantId: transaction.tenant_id,
      connectedAccountId,
      amount: transaction.amount,
      platformFee: applicationFeeAmount / 100
    });

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
      await this.stripe.paymentMethods.attach(
        transaction.paymentMethodId,
        { customer: customerId }
      );

      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: transaction.paymentMethodId,
        },
      });
    } catch (error) {
      console.log('Payment method may already be attached:', error.message);
    }

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: 'usd',
      customer: customerId,
      payment_method: transaction.paymentMethodId,
      description: `Payment for reservation ${transaction.reservation_id}`,
      metadata: {
        transactionId: transaction.id,
        reservationId: transaction.reservation_id,
      },
      transfer_data: {
        destination: connectedAccountId,
      },
      application_fee_amount: applicationFeeAmount,
      confirm: true,
      off_session: true
    };

    console.log('Creating PaymentIntent with params:', {
      ...paymentIntentParams,
      payment_method: 'REDACTED'
    });

    try {
      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);

      console.log('PaymentIntent created:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        application_fee_amount: paymentIntent.application_fee_amount,
        customer: paymentIntent.customer
      });

      await Promise.all([
        this.prisma.paymentTransaction.update({
          where: { id: transactionId },
          data: {
            payment_status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
            stripe_payment_id: paymentIntent.id,
            paymentIntentId: paymentIntent.id,
            stripeCustomerId: customerId
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

      if (paymentIntent.status === 'succeeded') {
        await this.syncReservationWithCalendar(transaction.reservation_id);
      }

      return {
        success: paymentIntent.status === 'succeeded',
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Error creating PaymentIntent:', {
        error: error.message,
        type: error.type,
        code: error.code
      });
      throw error;
    }
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
    if (paymentIntent.status === 'succeeded') {
      await this.syncReservationWithCalendar(reservationId);
    }

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

  async processPayment(
    amount: number, 
    paymentMethodId: string, 
    connectedAccountId?: string,
    transferAmount?: number
  ) {
    try {
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount,
        currency: 'usd',
        payment_method: paymentMethodId,
        confirmation_method: 'automatic',
        confirm: true,
      };

      if (connectedAccountId && transferAmount) {
        paymentIntentParams.transfer_data = {
          destination: connectedAccountId,
          amount: transferAmount,
        };
        paymentIntentParams.application_fee_amount = amount - transferAmount;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(
        paymentIntentParams,
        connectedAccountId ? { stripeAccount: connectedAccountId } : undefined
      );

      return paymentIntent;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  async updateAccountBranding(
    accountId: string,
    settings: {
      businessName?: string;
      primaryColor?: string;
      secondaryColor?: string;
      supportEmail?: string;
      supportPhone?: string;
      supportUrl?: string;
      website?: string;
    }
  ) {
    try {
      const updateParams: Stripe.AccountUpdateParams = {
        settings: {},
        business_profile: {}
      };

      if (settings.businessName) {
        updateParams.settings.payouts = {
          statement_descriptor: settings.businessName.substring(0, 22)
        };
        updateParams.settings.payments = {
          statement_descriptor: settings.businessName.substring(0, 22)
        };
        updateParams.business_profile.name = settings.businessName;
      }

      if (settings.primaryColor || settings.secondaryColor) {
        updateParams.settings.branding = {
          primary_color: settings.primaryColor,
          secondary_color: settings.secondaryColor
        };
      }

      if (settings.supportEmail || settings.supportPhone || settings.supportUrl || settings.website) {
        updateParams.business_profile = {
          ...updateParams.business_profile,
          support_email: settings.supportEmail,
          support_phone: settings.supportPhone,
          support_url: settings.supportUrl,
          url: settings.website
        };
      }

      const account = await this.stripe.accounts.update(accountId, updateParams);
      return account;
    } catch (error) {
      console.error('Error updating account branding:', error);
      throw error;
    }
  }
}
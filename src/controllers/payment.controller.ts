import { Controller, Post, Get, Param, Body, Res, Req, NotFoundException, Patch } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { Request, Response } from 'express';
import { Public } from '../decorators/public.decorator';
import { Stripe } from 'stripe';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create-setup-intent')
  async createSetupIntent(@Body('reservationId') reservationId: string) {
    return this.paymentService.createSetupIntent(reservationId);
  }

  @Post('create-setup-intent-for-transaction')
  async createSetupIntentForTransaction(@Body('transactionId') transactionId: string) {
    return this.paymentService.createSetupIntentForTransaction(transactionId);
  }

  @Post('save-payment-method')
  async savePaymentMethod(
    @Body('paymentMethodId') paymentMethodId: string,
    @Body('reservationId') reservationId: string,
  ) {
    return this.paymentService.savePaymentMethod(paymentMethodId, reservationId);
  }

  @Post('save-payment-method-for-transaction')
  async savePaymentMethodForTransaction(
    @Body('paymentMethodId') paymentMethodId: string,
    @Body('transactionId') transactionId: string,
  ) {
    return this.paymentService.savePaymentMethodForTransaction(paymentMethodId, transactionId);
  }

  @Post('process-transaction-payment')
  async processTransactionPayment(
    @Body('transactionId') transactionId: string,
  ) {
    return this.paymentService.processTransactionPayment(transactionId);
  }

  @Post('process-reservation-payment')
  async processReservationPayment(
    @Body('reservationId') reservationId: string,
  ) {
    return this.paymentService.processReservationPayment(reservationId);
  }

  @Post('confirm-payment')
  async confirmPayment(
    @Body('email') email: string,
    @Body('paymentMethodId') paymentMethodId: string,
    @Body('amount') amount: number,
    @Body('currency') currency: string,
  ) {
    return this.paymentService.confirmPayment(
      email,
      paymentMethodId,
      amount,
      currency,
    );
  }

  @Get('payment-method/:paymentMethodId')
  async getPaymentMethodDetails(@Param('paymentMethodId') paymentMethodId: string) {
    const paymentDetails = await this.paymentService.getPaymentMethodDetails(paymentMethodId);

    if (!paymentDetails) {
      throw new NotFoundException('Payment method not found');
    }

    return paymentDetails;
  }

  @Post('reject-reservation')
  async rejectReservation(
    @Body('reservationId') reservationId: string,
    @Body('reason') reason: string,
  ) {
    return await this.paymentService.rejectReservation(reservationId, reason);
  }

  @Post('invalidate-payment-method')
  async invalidatePaymentMethod(
    @Body('paymentMethodId') paymentMethodId: string,
  ) {
    return this.paymentService.invalidatePaymentMethod(paymentMethodId);
  }

  @Get('status/:paymentIntentId')
  async getPaymentStatus(@Param('paymentIntentId') paymentIntentId: string) {
    return this.paymentService.getPaymentStatus(paymentIntentId);
  }

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    return this.paymentService.handleWebhook(req, res);
  }

  @Public()
  @Post('create-connected-account')
  async createConnectedAccount(
    @Body('businessName') businessName: string,
    @Body('email') email: string,
    @Body('support_email') supportEmail?: string,
    @Body('support_phone') supportPhone?: string,
    @Body('support_url') supportUrl?: string,
    @Body('website') website?: string,
  ) {
    const account = await this.paymentService.createConnectAccount(
      businessName,
      email,
      {
        support_email: supportEmail,
        support_phone: supportPhone,
        support_url: supportUrl,
        website: website
      }
    );

    return {
      accountId: account.id,
    };
  }

  @Public()
  @Post('create-account-link')
  async createAccountLink(
    @Body('accountId') accountId: string,
  ) {
    const accountLink = await this.paymentService.createAccountLink(
      accountId,
      'http://localhost:9000/payments/reauth',   // TODO: trocar pela URL
      'http://localhost:9000/payments/return'    // TODO: trocar pela URL
    );

    return {
      onboardingUrl: accountLink.url,
    };
  }

  @Public()
  @Get('return')
  async handleReturn(@Res() res: Response) {
    return res.send('Onboarding completed successfully! You can close this window.');
  }

  @Public()
  @Get('reauth')
  async handleReauth(@Res() res: Response) {
    return res.send('Onboarding failed or was canceled. Please try again.');
  }

  @Get('connect-account/:accountId')
  async getConnectAccount(@Param('accountId') accountId: string) {
    const account = await this.paymentService.getConnectAccount(accountId);

    if (!account) {
      throw new NotFoundException('Connect account not found');
    }

    return account;
  }

  @Patch('connect-account/:accountId')
  async updateConnectAccount(
    @Param('accountId') accountId: string,
    @Body() updates: Partial<Stripe.AccountUpdateParams>
  ) {
    const updatedAccount = await this.paymentService.updateConnectAccount(accountId, updates);

    return updatedAccount;
  }

  @Public()
  @Post('update-stripe-settings')
  async updateStripeSettings(@Body() data: { businessName: string, connectedAccountId: string }) {
    try {
      await this.paymentService.updateAccountStatementDescriptor(
        data.connectedAccountId,
        data.businessName
      );

      return { success: true, message: 'Stripe settings updated successfully' };
    } catch (error) {
      return { 
        success: false, 
        message: 'Failed to update Stripe settings',
        error: error.message 
      };
    }
  }
}
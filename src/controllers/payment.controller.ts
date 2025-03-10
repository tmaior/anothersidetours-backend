import { Controller, Post, Get, Param, Body, Res, Req, NotFoundException } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { Request, Response } from 'express';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create-setup-intent')
  async createSetupIntent(@Body('reservationId') reservationId: string) {
    return this.paymentService.createSetupIntent(reservationId);
  }

  @Post('save-payment-method')
  async savePaymentMethod(
    @Body('paymentMethodId') paymentMethodId: string,
    @Body('reservationId') reservationId: string,
  ) {
    return this.paymentService.savePaymentMethod(paymentMethodId, reservationId);
  }

  @Post('confirm-payment')
  async confirmPayment(
    @Body('paymentMethodId') paymentMethodId: string,
    @Body('amount') amount: number,
    @Body('currency') currency: string,
    @Body('email') email: string,
  ) {
    return this.paymentService.confirmPayment(paymentMethodId, amount, currency,email);
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
}
import { Controller, Post, Get, Param, Body, Res, Req } from '@nestjs/common';
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
  ) {
    return this.paymentService.confirmPayment(paymentMethodId, amount, currency);
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
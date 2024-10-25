import { Controller, Post, Get, Param, Body, Res, Req } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { Request, Response } from 'express';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create-intent')
  async createPaymentIntent(
    @Body('amount') amount: number,
    @Body('currency') currency: string,
    @Body('reservationId') reservationId: string,
  ) {
    return this.paymentService.createPaymentIntent(amount, currency, reservationId);
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
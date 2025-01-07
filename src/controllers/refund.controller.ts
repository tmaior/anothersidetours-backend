import { Controller, Post, Body } from '@nestjs/common';
import { RefundService } from '../services/refund.service';

@Controller('refund')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post()
  async refundPayment(
    @Body() body: { paymentIntentId: string; paymentMethodId: string; amount?: number },
  ) {
    const refund = await this.refundService.createRefund(
      body.paymentIntentId,
      body.amount,
    );
    return { message: 'Refund processed', refund };
  }
}
import { Body, Controller, Post } from '@nestjs/common';
import { VoucherService } from '../services/voucher.service';

@Controller('voucher')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post('generate')
  async generateVoucher(
    @Body() body: { amount: number; originReservationId: string },
  ) {
    const voucher = await this.voucherService.generateVoucher(
      body.amount,
      body.originReservationId,
    );
    return { message: 'Voucher generated successfully', voucher };
  }

  @Post('redeem')
  async redeemVoucher(@Body() body: { code: string; reservationId: string }) {
    const value = await this.voucherService.redeemVoucher(
      body.code,
      body.reservationId,
    );
    return { message: 'Voucher redeemed successfully', value };
  }

  @Post('validate')
  async validateVoucher(@Body() body: { code: string }) {
    return await this.voucherService.validateVoucher(body.code);
  }
}

import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class VoucherService {
  constructor(private readonly prisma: PrismaService) {}

  async generateVoucher(
    amount: number,
    originReservationId: string,
  ): Promise<{
    code: string;
    amount: number;
    originReservationId: string;
  }> {
    const code = nanoid(10);

    const voucher = await this.prisma.voucher.create({
      data: {
        code,
        amount,
        originReservationId,
      },
    });

    return {
      code: voucher.code,
      amount: voucher.amount,
      originReservationId: voucher.originReservationId,
    };
  }

  async redeemVoucher(code: string, reservationId: string): Promise<number> {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
    });

    if (!voucher || voucher.isRedeemed) {
      throw new Error('Invalid or already used voucher');
    }

    const updatedVoucher = await this.prisma.voucher.update({
      where: { code },
      data: {
        isRedeemed: true,
        reservationId: reservationId,
      },
    });
    return updatedVoucher.amount;
  }

  async validateVoucher(
    code: string,
  ): Promise<{ isValid: boolean; amount?: number; message?: string }> {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
    });

    if (!voucher) {
      return {
        isValid: false,
        message: 'Voucher not found',
      };
    }

    if (voucher.isRedeemed) {
      return {
        isValid: false,
        message: 'Voucher already redeemed',
      };
    }

    return {
      isValid: true,
      amount: voucher.amount,
      message: 'Voucher is valid',
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Prisma, PaymentTransaction } from '@prisma/client';

@Injectable()
export class PaymentTransactionService {
  constructor(private prisma: PrismaService) {}

  async getTransactionsByTenantId(tenantId: string): Promise<PaymentTransaction[]> {
    return this.prisma.paymentTransaction.findMany({
      where: { tenant_id: tenantId },
      include: {
        tenant: true,
        reservation: true,
      },
    });
  }

  async getAllTransactions(): Promise<PaymentTransaction[]> {
    return this.prisma.paymentTransaction.findMany({
      include: {
        tenant: true,
        reservation: true,
      },
    });
  }

  async getTransactionById(tenantId: string, id: string): Promise<PaymentTransaction | null> {
    return this.prisma.paymentTransaction.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        tenant: true,
        reservation: true,
      },
    });
  }

  async createTransaction(
    data: Prisma.PaymentTransactionCreateInput,
  ): Promise<PaymentTransaction> {
    return this.prisma.paymentTransaction.create({
      data,
    });
  }

  async updateTransaction(
    id: string,
    data: Prisma.PaymentTransactionUpdateInput,
  ): Promise<PaymentTransaction> {
    return this.prisma.paymentTransaction.update({
      where: { id },
      data,
    });
  }

  async deleteTransaction(tenantId: string, id: string) {
    return this.prisma.paymentTransaction.deleteMany({
      where: { id, tenant_id: tenantId },
    });
  }
}
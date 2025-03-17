import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { PaymentTransactionService } from '../services/payment-transaction.service';
import { Prisma } from '@prisma/client';

@Controller('payment-transactions')
export class PaymentTransactionController {
  constructor(
    private readonly paymentTransactionService: PaymentTransactionService,
  ) {}

  @Get('/byTenantId/:tenantId')
  async getTransactionsByTenantId(@Param('tenantId') tenantId: string) {
    return this.paymentTransactionService.getTransactionsByTenantId(tenantId);
  }

  @Get()
  async getAllTransactions() {
    return this.paymentTransactionService.getAllTransactions();
  }

  @Get(':id')
  async getTransactionById(
    @Param('id') id: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.paymentTransactionService.getTransactionById(tenantId, id);
  }

  @Post()
  async createTransaction(
    @Body()
    data: Prisma.PaymentTransactionCreateInput,
  ) {
    return this.paymentTransactionService.createTransaction(data);
  }

  @Put(':id')
  async updateTransaction(
    @Param('id') id: string,
    @Body() data: Prisma.PaymentTransactionUpdateInput,
  ) {
    return this.paymentTransactionService.updateTransaction(id, data);
  }

  @Delete(':id')
  async deleteTransaction(
    @Param('id') id: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.paymentTransactionService.deleteTransaction(tenantId, id);
  }
}
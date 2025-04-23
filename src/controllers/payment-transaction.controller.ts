import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PaymentTransactionService } from '../services/payment-transaction.service';
import { Prisma } from '@prisma/client';
import { CreatePaymentTransactionDto } from '../types/payment-transaction.types';

@Controller('payment-transactions')
export class PaymentTransactionController {
  constructor(
    private readonly paymentTransactionService: PaymentTransactionService,
  ) {}

  @Get('/byTenantId/:tenantId')
  async getTransactionsByTenantId(@Param('tenantId') tenantId: string) {
    return this.paymentTransactionService.getTransactionsByTenantId(tenantId);
  }

  @Get('/by-reservation/:reservationId')
  async getTransactionsByReservation(
    @Param('reservationId') reservationId: string,
    @Query('payment_method') paymentMethod?: string,
    @Query('payment_status') paymentStatus?: string,
  ) {
    return this.paymentTransactionService.getTransactionsByReservation(
      reservationId,
      paymentMethod,
      paymentStatus,
    );
  }

  @Get('/refundable/:reservationId')
  async getRefundableTransactions(
    @Param('reservationId') reservationId: string,
  ) {
    return this.paymentTransactionService.getRefundableTransactions(reservationId);
  }

  @Get('/validate-refund/:transactionId')
  async validateRefundability(
    @Param('transactionId') transactionId: string,
    @Query('amount') amount?: string,
  ) {
    const refundAmount = amount ? parseFloat(amount) : null;
    return this.paymentTransactionService.validateRefundability(
      transactionId,
      refundAmount,
    );
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
  async createTransaction(@Body() data: CreatePaymentTransactionDto) {
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
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ReservationService } from '../services/reservation.service';
import { Prisma } from '@prisma/client';

@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get('/byTenantId/:tenantId')
  async getReservations(@Param('tenantId') tenantId: string,) {
    return this.reservationService.getReservations(tenantId);
  }

  @Get()
  async getAllReservations() {
    return this.reservationService.getAllReservations();
  }

  @Post()
  async createReservation(
    @Body() data: Prisma.ReservationCreateInput & {tourId: string; userId: string; addons: { addonId: string; quantity: number }[] },
  ) {
    return this.reservationService.createReservation(data);
  }

  @Get(':id')
  async getReservationById(@Param('id') id: string, @Body('tenantId') tenantId: string) {
    return this.reservationService.getReservationById(tenantId, id);
  }

  @Put(':id')
  async updateReservation(
    @Param('id') id: string,
    @Body() data: Prisma.ReservationUpdateInput,
  ) {
    return this.reservationService.updateReservation(id, data);
  }

  @Delete(':id')
  async deleteReservation(@Param('id') id: string, @Body('tenantId') tenantId: string) {
    return this.reservationService.deleteReservation(tenantId, id);
  }
}

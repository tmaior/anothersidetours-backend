import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ReservationService } from '../services/reservation.service';
import { Prisma } from '@prisma/client';

@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get()
  async getReservations(@Body('tenantId') tenantId: string) {
    return this.reservationService.getReservations(tenantId);
  }

  @Post()
  async createReservation(
    @Body() data: Prisma.ReservationCreateInput & { tenantId: string; tourId: string; userId: string; addons: { addonId: string; quantity: number }[] },
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
    @Body('tenantId') tenantId: string,
    @Body() data: Prisma.ReservationUpdateInput,
  ) {
    return this.reservationService.updateReservation(tenantId, id, data);
  }

  @Delete(':id')
  async deleteReservation(@Param('id') id: string, @Body('tenantId') tenantId: string) {
    return this.reservationService.deleteReservation(tenantId, id);
  }
}
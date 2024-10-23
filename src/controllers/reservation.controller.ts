import {
  Body,
  Controller,
  Delete,
  Get, HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ReservationService } from '../services/reservation.service';
import { Prisma } from '@prisma/client';

@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get()
  getAllReservations(@Body('tenantId') tenantId: string) {
    return this.reservationService.getAllReservations(tenantId);
  }

  @Post()
  createReservation(
    @Body() data: { tenantId: string; tourId: string; userId: string; reservation_date: string; total_price: number; status: string },
  ) {
    return this.reservationService.createReservation(data);
  }

  @Get(':reservation_id')
  getReservation(
    @Param('reservation_id') reservationId: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.reservationService.getReservationById(reservationId, tenantId);
  }

  @Put(':reservation_id')
  updateReservation(
    @Param('reservation_id') reservationId: string,
    @Body('tenantId') tenantId: string,
    @Body() data: Prisma.ReservationUpdateInput,
  ) {
    return this.reservationService.updateReservation(
      reservationId,
      tenantId,
      data,
    );
  }

  @Delete(':reservation_id')
  @HttpCode(204)
  deleteReservation(
    @Param('reservation_id') reservationId: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.reservationService.deleteReservation(reservationId, tenantId);
  }
}

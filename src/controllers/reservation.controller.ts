import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ReservationService } from '../services/reservation.service';
import { Prisma } from '@prisma/client';

@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get('/byTenantId/:tenantId')
  async getReservations(@Param('tenantId') tenantId: string) {
    return this.reservationService.getReservations(tenantId);
  }

  @Get('/with-users/byTenantId/:tenantId')
  async getReservationsWithUsers(@Param('tenantId') tenantId: string) {
    return this.reservationService.getReservationsWithUsers(tenantId);
  }

  @Get()
  async getAllReservations() {
    return this.reservationService.getAllReservations();
  }

  @Post("booking-details")
  async createReservationByBookingDetails(
    @Body()
    data: Prisma.ReservationCreateInput & {
      tourId: string;
      userId: string;
      addons: { addonId: string; quantity: number }[];
    },
  ) {
    return this.reservationService.createReservationByBookingDetails(data);
  }

  @Post()
  async createReservation(
    @Body()
    data: {
      cart: Array<{
        tourId: string;
        reservationData: Prisma.ReservationCreateInput;
        addons?: { addonId: string; quantity: number }[];
        total_price: number;
        guestQuantity: number;
        createdBy: string;
        purchaseTags: string;
        purchaseNote: string;
      }>;
      userId: string;
      createdBy?: string;
    },
  ) {
    return this.reservationService.createReservations(data);
  }

  @Get(':id')
  async getReservationById(
    @Param('id') id: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.reservationService.getReservationById(tenantId, id);
  }

  @Put(':id')
  async updateReservation(
    @Param('id') id: string,
    @Body() data: Prisma.ReservationUpdateInput,
  ) {
    return this.reservationService.updateReservation(id, data);
  }

  @Post('/incomplete')
  async createOrUpdateIncompleteReservation(
    @Body()
    data: {
      tourId: string;
      name: string;
      email: string;
      phone?: string;
      guestQuantity: number;
      selectedDate: string | null;
      selectedTime: string | null;
      statusCheckout: string;
    },
  ) {
    return this.reservationService.createOrUpdateIncompleteReservation(data);
  }

  @Get('incomplete/byId/:id')
  async getReservationIncomplete(@Param('id') id: string) {
    return this.reservationService.getReservationIncomplete(id);
  }

  @Delete(':id')
  async deleteReservation(
    @Param('id') id: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.reservationService.deleteReservation(tenantId, id);
  }
}

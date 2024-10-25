import { Controller, Post, Get, Delete, Param, Body, Put } from '@nestjs/common';
import { ReservationAddonService } from '../services/reservationaddon.service';

@Controller('reservation-addons')
export class ReservationAddonController {
  constructor(private reservationAddonService: ReservationAddonService) {}

  @Post()
  createReservationAddon(
    @Body('tenantId') tenantId: string,
    @Body('reservationId') reservationId: string,
    @Body('addonId') addonId: string,
    @Body('value') value: string,
  ) {
    return this.reservationAddonService.createReservationAddon(tenantId, reservationId, addonId, value);
  }

  @Get(':reservationId')
  getReservationAddons(@Param('reservationId') reservationId: string) {
    return this.reservationAddonService.getReservationAddons(reservationId);
  }

  @Put(':id')
  updateReservationAddon(
    @Param('id') id: string,
    @Body('tenantId') tenantId: string,
    @Body('value') value: string,
  ) {
    return this.reservationAddonService.updateReservationAddon(id, tenantId, value);
  }

  @Delete(':id')
  deleteReservationAddon(@Param('id') id: string, @Body('tenantId') tenantId: string) {
    return this.reservationAddonService.deleteReservationAddon(id, tenantId);
  }
}

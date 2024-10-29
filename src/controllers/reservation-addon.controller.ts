import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ReservationAddonService } from '../services/reservation-addon.service';
import { Prisma } from '@prisma/client';

@Controller('reservation-addons')
export class ReservationAddonController {
  constructor(private readonly reservationAddonService: ReservationAddonService) {}

  @Get()
  async getReservationAddons(@Body('tenantId') tenantId: string) {
    return this.reservationAddonService.getReservationAddons(tenantId);
  }

  @Post()
  async createReservationAddon(
    @Body('tenantId') tenantId: string,
    @Body('reservationId') reservationId: string,
    @Body('addonId') addonId: string,
    @Body('value') value: string,
  ) {
    return this.reservationAddonService.createReservationAddon(tenantId, reservationId, addonId, value);
  }

  @Get(':id')
  async getReservationAddonById(@Param('id') id: string, @Body('tenantId') tenantId: string) {
    return this.reservationAddonService.getReservationAddonById(tenantId, id);
  }

  @Put(':id')
  async updateReservationAddon(
    @Param('id') id: string,
    @Body('tenantId') tenantId: string,
    @Body() data: Prisma.ReservationAddonUpdateInput,
  ) {
    return this.reservationAddonService.updateReservationAddon(tenantId, id, data);
  }

  @Delete(':id')
  async deleteReservationAddon(@Param('id') id: string, @Body('tenantId') tenantId: string) {
    return this.reservationAddonService.deleteReservationAddon(tenantId, id);
  }
}

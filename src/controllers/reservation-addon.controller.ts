import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ReservationAddonService } from '../services/reservation-addon.service';

@Controller('reservation-addons')
export class ReservationAddonController {
  constructor(
    private readonly reservationAddonService: ReservationAddonService,
  ) {}

  @Get('reservation-by/:reservationId')
  async getReservationAddons(@Param('reservationId') reservationId: string) {
    return this.reservationAddonService.getReservationAddons(reservationId);
  }

  @Post()
  async createReservationAddon(
    @Body('tenantId') tenantId: string,
    @Body('reservationId') reservationId: string,
    @Body('addonId') addonId: string,
    @Body('value') value?: string,
  ) {
    return this.reservationAddonService.createReservationAddon(
      tenantId,
      reservationId,
      addonId,
      value,
    );
  }

  @Get(':id')
  async getReservationAddonById(
    @Param('id') id: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.reservationAddonService.getReservationAddonById(tenantId, id);
  }

  @Put(':id')
  async updateReservationAddon(
    @Param('id') id: string,
    @Body('tenantId') tenantId: string,
    @Body('value') value?: string,
  ) {
    if (value === '0' || value === null || value === undefined) {
      return this.reservationAddonService.deleteReservationAddon(tenantId, id);
    }
    return this.reservationAddonService.updateReservationAddon(tenantId, id, {
      value,
    });
  }

  @Delete(':id')
  async deleteReservationAddon(
    @Param('id') id: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.reservationAddonService.deleteReservationAddon(tenantId, id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AddonService } from '../services/addon.service';
import { Prisma } from '@prisma/client';

@Controller('addons')
export class AddonController {
  constructor(private readonly addonService: AddonService) {}

  @Post()
  async createAddon(
    @Body('tenantId') tenantId: string,
    @Body('tourId') tourId: string,
    @Body() data: Prisma.AddonCreateInput,
  ) {
    return this.addonService.createAddon(tenantId, tourId, data);
  }

  @Get()
  async getAddons(@Body('tenantId') tenantId: string) {
    return this.addonService.getAddons(tenantId);
  }

  @Get(':id')
  async getAddonById(
    @Param('id') addonId: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.addonService.getAddonById(tenantId, addonId);
  }

  @Put(':id')
  async updateAddon(
    @Param('id') addonId: string,
    @Body('tenantId') tenantId: string,
    @Body() data: Prisma.AddonUpdateInput,
  ) {
    return this.addonService.updateAddon(tenantId, addonId, data);
  }

  @Delete(':id')
  async deleteAddon(
    @Param('id') addonId: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.addonService.deleteAddon(tenantId, addonId);
  }
}
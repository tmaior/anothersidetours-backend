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
    @Body('tourId') tourId: string,
    @Body() data: Prisma.AddonCreateInput,
  ) {
    return this.addonService.createAddon(tourId, data);
  }

  @Get()
  async getAddons() {
    return this.addonService.getAddons();
  }

  @Get(':id')
  async getAddonById(
    @Param('id') addonId: string,
  ) {
    return this.addonService.getAddonById(addonId);
  }

  @Put(':id')
  async updateAddon(
    @Param('id') addonId: string,
    @Body() data: Prisma.AddonUpdateInput,
  ) {
    return this.addonService.updateAddon(addonId, data);
  }

  @Delete(':id')
  async deleteAddon(
    @Param('id') addonId: string,
  ) {
    return this.addonService.deleteAddon(addonId);
  }
}

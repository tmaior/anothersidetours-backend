import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AddonService } from '../services/addon.service';
import { AddonType, OptionType, Prisma } from '@prisma/client';

@Controller('addons')
export class AddonController {
  constructor(private readonly addonService: AddonService) {}

  @Get()
  getAllAddons(@Body('tenantId') tenantId: string) {
    return this.addonService.getAllAddons(tenantId);
  }

  @Post()
  createAddon(
    @Body('tenantId') tenantId: string,
    @Body('tourId') tourId: string,
    @Body() data: {
      type: AddonType,
      label: string,
      options: { type: OptionType; value: string }[]
    },
  ) {
    return this.addonService.createAddon(tenantId, tourId, data);
  }

  @Get(':addon_id')
  getAddon(
    @Param('addon_id') addonId: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.addonService.getAddonById(addonId, tenantId);
  }

  @Put(':addon_id')
  updateAddon(
    @Param('addon_id') addonId: string,
    @Body('tenantId') tenantId: string,
    @Body() data: Prisma.AddonUpdateInput,
  ) {
    return this.addonService.updateAddon(addonId, tenantId, data);
  }

  @Delete(':addon_id')
  @HttpCode(204)
  deleteAddon(
    @Param('addon_id') addonId: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.addonService.deleteAddon(addonId, tenantId);
  }
}

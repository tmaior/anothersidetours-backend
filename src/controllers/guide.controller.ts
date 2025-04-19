import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { GuideService } from '../services/guide.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { PermissionGuard } from '../guards/permission.guard';

@Controller('guides')
export class GuideController {
  constructor(private guideService: GuideService) {}

  @Get()
  getAllGuides() {
    return this.guideService.getAllGuides();
  }

  @Get(':id')
  getGuideById(@Param('id') id: string) {
    return this.guideService.getGuideById(id);
  }

  @Get('byTenant/:tenantId')
  getGuidesByTenantId(@Param('tenantId') tenantId: string) {
    return this.guideService.getGuidesByTenantId(tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('manage_guides')
  createGuide(
    @Body()
    data: {
      name: string;
      email: string;
      phone: string;
      imageUrl: string;
      bio: string;
      status: string;
      available: boolean;
      tenantId: string;
    },
  ) {
    return this.guideService.createGuide(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('manage_guides')
  updateGuide(
    @Param('id') id: string,
    @Body() data: { 
      name?: string; 
      email?: string; 
      phone?: string;
      bio?: string;
      imageUrl?: string;
      available?: boolean;
    },
  ) {
    return this.guideService.updateGuide(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('manage_guides')
  deleteGuide(@Param('id') id: string) {
    return this.guideService.deleteGuide(id);
  }

  @Put('assign-guides/:reservationId')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('assign_guides')
  async assignMultipleGuides(
    @Param('reservationId') reservationId: string,
    @Body('guideIds') guideIds: string[],
  ) {
    return this.guideService.assignGuidesToReservation(guideIds, reservationId);
  }

  @Get('reservations/:reservationId/guides')
  getGuidesByReservation(
    @Param('reservationId') reservationId: string,
  ) {
    return this.guideService.getGuidesByReservation(reservationId);
  }

  @Put('remove-tour/:tourId')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('assign_guides')
  removeGuideFromTour(
    @Param('tourId') tourId: string,
    @Body('guideIds') guideIds: string[],
  ) {
    return this.guideService.removeGuideFromTour(tourId, guideIds);
  }
}
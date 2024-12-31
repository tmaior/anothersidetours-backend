import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { GuideService } from '../services/guide.service';

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

  @Post()
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
    },
  ) {
    return this.guideService.createGuide(data);
  }

  @Put(':id')
  updateGuide(
    @Param('id') id: string,
    @Body() data: { name?: string; email?: string; phone?: string },
  ) {
    return this.guideService.updateGuide(id, data);
  }

  @Delete(':id')
  deleteGuide(@Param('id') id: string) {
    return this.guideService.deleteGuide(id);
  }

  @Put('assign-guides/:reservationId')
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
  removeGuideFromTour(
    @Param('tourId') tourId: string,
    @Body('guideIds') guideIds: string[],
  ) {
    return this.guideService.removeGuideFromTour(tourId, guideIds);
  }
}
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
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
  createGuide(@Body() data: { name: string; email: string; phone: string }) {
    return this.guideService.createGuide(data);
  }

  @Put(':id')
  updateGuide(@Param('id') id: string, @Body() data: { name?: string; email?: string; phone?: string }) {
    return this.guideService.updateGuide(id, data);
  }

  @Delete(':id')
  deleteGuide(@Param('id') id: string) {
    return this.guideService.deleteGuide(id);
  }

  @Put(':guideId/assign-tour/:tourId')
  assignGuideToTour(@Param('guideId') guideId: string, @Param('tourId') tourId: string) {
    return this.guideService.assignGuideToTour(guideId, tourId);
  }

  @Put('remove-tour/:tourId')
  removeGuideFromTour(@Param('tourId') tourId: string) {
    return this.guideService.removeGuideFromTour(tourId);
  }
}
import {
  Body,
  Controller,
  Delete,
  Get, HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TourService } from '../services/tour.service';
import { Prisma } from '@prisma/client';

@Controller('tours')
export class TourController {
  constructor(private readonly tourService: TourService) {}

  @Get()
  getAllTours(@Body('tenantId') tenantId: string) {
    return this.tourService.getAllTours(tenantId);
  }

  @Post()
  createTour(
    @Body('tenantId') tenantId: string,
    @Body() data: Prisma.TourCreateInput,
  ) {
    return this.tourService.createTour(tenantId, data);
  }

  @Get(':tour_id')
  getTour(
    @Param('tour_id') tourId: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.tourService.getTourById(tourId, tenantId);
  }

  @Put(':tour_id')
  updateTour(
    @Param('tour_id') tourId: string,
    @Body('tenantId') tenantId: string,
    @Body() data: Prisma.TourUpdateInput,
  ) {
    return this.tourService.updateTour(tourId, tenantId, data);
  }

  @Delete(':tour_id')
  @HttpCode(204)
  deleteTour(
    @Param('tour_id') tourId: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.tourService.deleteTour(tourId, tenantId);
  }
}

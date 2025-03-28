import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TourService } from '../services/tour.service';

@Controller('tours')
export class TourController {
  constructor(private readonly tourService: TourService) {}

  @Post()
  createTour(
    @Body('tenantId') tenantId: string,
    @Body() data: Prisma.TourCreateInput,
  ) {
    return this.tourService.createTour(tenantId, data);
  }

  @Get()
  getAllTours() {
    return this.tourService.getAllTours();
  }

  @Get('allBytenant/:tenantId')
  async getTours(@Param('tenantId') tenantId: string) {
    return this.tourService.getTours(tenantId);
  }

  @Get(':id')
  async getTourById(
    @Param('id') id: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.tourService.getTourById(tenantId, id);
  }

  @Put(':tourId')
  async updateTour(
    @Param('tourId') tourId: string,
    @Body()
    data: Partial<{
      name: string;
      description?: string;
      duration?: number;
      categoryId?: string | null;
      isDeleted?: boolean;
    }>,
  ) {
    return this.tourService.updateTour(tourId, data);
  }

  @Get(':tourId/blackouts')
  async getTourBlackouts(@Param('tourId') tourId: string) {
    return this.tourService.getTourWithCategoryAndBlackouts(tourId);
  }

  @Delete(':id')
  async deleteTour(
    @Param('id') id: string,
  ) {
    return this.tourService.deleteTour(id);
  }
}
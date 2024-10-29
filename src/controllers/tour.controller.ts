import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
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

  @Get('allBytenant/:tenantId')
  async getTours(@Param('tenantId') tenantId: string) {
    return this.tourService.getTours(tenantId);
  }

  @Get(':id')
  async getTourById(@Param('id') id: string, @Body('tenantId') tenantId: string) {
    return this.tourService.getTourById(tenantId, id);
  }

  @Put(':id')
  async updateTour(
    @Param('id') id: string,
    @Body('tenantId') tenantId: string,
    @Body() data: Prisma.TourUpdateInput
  ) {
    return this.tourService.updateTour(tenantId, id, data);
  }

  @Delete(':id')
  async deleteTour(@Param('id') id: string, @Body('tenantId') tenantId: string) {
    return this.tourService.deleteTour(tenantId, id);
  }
}
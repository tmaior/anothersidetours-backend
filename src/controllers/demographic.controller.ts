import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DemographicService } from '../services/demographic.service';

@Controller('demographics')
export class DemographicController {
  constructor(private readonly demographicService: DemographicService) {}

  @Post()
  async create(@Body() data: any) {
    return this.demographicService.create(data);
  }

  @Get()
  async findAll() {
    return this.demographicService.findAll();
  }

  @Get('tenant/:tenantId')
  async findByTenant(@Param('tenantId') tenantId: string) {
    return this.demographicService.findByTenant(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.demographicService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.demographicService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.demographicService.delete(id);
  }

  @Post('assign-to-tour')
  async assignToTour(@Body() data: { tourId: string; demographicId: string }) {
    return this.demographicService.assignToTour(data);
  }

  @Get('demographicByTourId/:tourId')
  async findDemographicsByTourId(@Param('tourId') tourId: string) {
    return this.demographicService.findDemographicsByTourId(tourId);
  }

  @Post(':tourId/:demographicId')
  async assignDemographicToTour(
    @Param('tourId') tourId: string,
    @Param('demographicId') demographicId: string,
  ) {
    return this.demographicService.assignDemographicToTour(tourId, demographicId);
  }

  @Delete(':tourId/:demographicId')
  async removeDemographicFromTour(
    @Param('tourId') tourId: string,
    @Param('demographicId') demographicId: string,
  ) {
    return this.demographicService.removeDemographicFromTour(tourId, demographicId);
  }
}
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
import { AdditionalInformationService } from '../services/additional-information.service';

@Controller('additional-information')
export class AdditionalInformationController {
  constructor(
    private readonly additionalInformationService: AdditionalInformationService,
  ) {}

  @Post()
  async create(
    @Body() body: {tourId: string; title: string;},
  ) {
    const { tourId, title } = body;
    return this.additionalInformationService.create({
      tourId,
      title
    });
  }

  @Get(':tourId')
  async findAllbyTour(@Param('tourId') tourId: string) {
    return this.additionalInformationService.findAllbyTour(tourId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.additionalInformationService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.AdditionalInformationUpdateInput,
  ) {
    return this.additionalInformationService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.additionalInformationService.remove(id);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { WhatToBringService } from '../services/what-to-bring.service';

@Controller('tours/what-to-bring')
export class WhatToBringController {
  constructor(private readonly service: WhatToBringService) {}

  @Post()
  async create(@Body('tourId') tourId: string, @Body('item') item: string) {
    return this.service.createWhatToBring(tourId, item);
  }

  @Get(':tourId')
  async findByTour(@Param('tourId') tourId: string) {
    return this.service.getWhatToBringByTour(tourId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body('item') item: string) {
    return this.service.updateWhatToBring(id, item);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.deleteWhatToBring(id);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { WhatsIncludedService } from '../services/whats-included.service';

@Controller('tours/whats-included')
export class WhatsIncludedController {
  constructor(private readonly service: WhatsIncludedService) {}

  @Post()
  async create(@Body('tourId') tourId: string, @Body('item') item: string) {
    return this.service.createWhatsIncluded(tourId, item);
  }

  @Get(':tourId')
  async findByTour(@Param('tourId') tourId: string) {
    return this.service.getWhatsIncludedByTour(tourId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body('item') item: string) {
    return this.service.updateWhatsIncluded(id, item);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.deleteWhatsIncluded(id);
  }
}

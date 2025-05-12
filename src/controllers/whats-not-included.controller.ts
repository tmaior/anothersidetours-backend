import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { WhatsNotIncludedService } from '../services/whats-not-included.service';

@Controller('whats-not-included')
export class WhatsNotIncludedController {
  constructor(private readonly service: WhatsNotIncludedService) {}

  @Post()
  async create(@Body('tourId') tourId: string, @Body('item') item: string) {
    return this.service.createWhatsNotIncluded(tourId, item);
  }

  @Get(':tourId')
  async findByTour(@Param('tourId') tourId: string) {
    return this.service.getWhatsNotIncludedByTour(tourId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body('item') item: string) {
    return this.service.updateWhatsNotIncluded(id, item);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.deleteWhatsNotIncluded(id);
  }
}

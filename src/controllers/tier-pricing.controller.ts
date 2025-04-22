import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TierPricingService } from '../services/tier-pricing.service';
import { Public } from '../decorators/public.decorator';

@Controller('tier-pricing')
export class TierPricingController {
  constructor(private readonly tierPricingService: TierPricingService) {}

  @Post()
  async create(@Body() data: any) {
    return this.tierPricingService.create(data);
  }

  @Get()
  async findAll() {
    return this.tierPricingService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tierPricingService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    const { pricingType, basePrice, tiers } = data;
    return this.tierPricingService.update(id, { 
      pricingType, 
      basePrice, 
      tiers 
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.tierPricingService.delete(id);
  }

  @Public()
  @Get('tour/:tourId')
  async findByTourId(@Param('tourId') tourId: string) {
    return this.tierPricingService.findByTourId(tourId);
  }
}

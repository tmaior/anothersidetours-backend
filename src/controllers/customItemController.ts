import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CustomItemService } from '../services/customItemService';

@Controller('custom-items')
export class CustomItemController {
  constructor(private readonly customItemService: CustomItemService) {}

  @Post()
  async create(
    @Body()
    data: {
      items: {
        tenantId: string;
        tourId: string;
        label: string;
        description: string;
        amount: number;
        quantity: number;
        reservationId: string;
      }[];
      reservationId: string;
    },
  ) {
    return this.customItemService.createCustomItems(data);
  }

  @Get()
  async findAll() {
    return this.customItemService.findAll();
  }

  @Get('tenant/:tenantId')
  async findByTenant(@Param('tenantId') tenantId: string) {
    return this.customItemService.getCustomItemsByTenant(tenantId);
  }

  @Get('tour/:tourId')
  async findByTour(@Param('tourId') tourId: string) {
    return this.customItemService.getCustomItemsByTour(tourId);
  }

  @Get('reservation/:reservationId')
  async findByReservation(@Param('reservationId') reservationId: string) {
    return this.customItemService.getCustomItemsByReservation(reservationId);
  }

  @Delete('reservation/:reservationId')
  async deleteByReservation(@Param('reservationId') reservationId: string) {
    return this.customItemService.deleteAllByReservation(reservationId);
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.customItemService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    data: Partial<{
      label: string;
      description: string;
      amount: number;
      quantity: number;
    }>,
  ) {
    return this.customItemService.updateCustomItem(id, data);
  }

  @Delete('item/:itemId')
  async deleteItemById(@Param('itemId') itemId: string) {
    return this.customItemService.deleteCustomItemById(itemId);
  }
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.customItemService.deleteCustomItem(id);
  }

  @Post('assign-to-tour')
  async assignToTour(@Body() data: { tourId: string; customItemId: string }) {
    return this.customItemService.assignToTour(data);
  }

  @Get('demographicByTourId/:tourId')
  async findCustomItemsByTourId(@Param('tourId') tourId: string) {
    return this.customItemService.findCustomItemsByTourId(tourId);
  }

  @Post(':tourId/:customItemId')
  async assignCustomItemToTour(
    @Param('tourId') tourId: string,
    @Param('customItemId') customItemId: string,
  ) {
    return this.customItemService.assignCustomItemToTour(tourId, customItemId);
  }

  @Delete(':tourId/:customItemId')
  async removeCustomItemFromTour(
    @Param('tourId') tourId: string,
    @Param('customItemId') customItemId: string,
  ) {
    return this.customItemService.removeCustomItemFromTour(
      tourId,
      customItemId,
    );
  }
}
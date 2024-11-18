import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CustomerAdditionalInformationService } from '../services/customer-additional-information.service';


@Controller('customer-additional-information')
export class CustomerAdditionalInformationController{
  constructor(
    private readonly service: CustomerAdditionalInformationService,
  ) {}

  @Get()
  async findAllByReservation(@Query('reservationId') reservationId: string) {
    return this.service.findAllByReservation(reservationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(
    @Body()
    data: {
      additionalInformationId: string;
      reservationId: string;
      value: string;
    },
  ) {
    return this.service.create({
      additionalInformation: { connect: { id: data.additionalInformationId } },
      reservation: { connect: { id: data.reservationId } },
      value: data.value,
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: { value: string },
  ) {
    return this.service.update(id, data.value);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
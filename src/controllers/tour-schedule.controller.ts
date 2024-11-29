import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Prisma, TourSchedule } from '@prisma/client';
import { TourScheduleService } from '../services/tour-schedule.service';

@Controller('tour-schedules')
export class TourScheduleController {
  constructor(private readonly tourScheduleService: TourScheduleService) {}

  @Post(':tourId')
  async create(
    @Param('tourId') tourId: string,
    @Body('timeSlots') timeSlots?: string[],
  ): Promise<Prisma.BatchPayload> {
    if (!tourId) {
      throw new HttpException('Tour ID is required', HttpStatus.BAD_REQUEST);
    }

    return this.tourScheduleService.createTourSchedules(
      tourId,
      timeSlots || [],
    );
  }

  @Get('all')
  async findAll(): Promise<TourSchedule[]> {
    return this.tourScheduleService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TourSchedule | null> {
    const schedule = await this.tourScheduleService.findOne(id);
    if (!schedule) {
      throw new HttpException('Schedule not found', HttpStatus.NOT_FOUND);
    }
    return schedule;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<TourSchedule>,
  ): Promise<TourSchedule> {
    try {
      return this.tourScheduleService.update(id, data);
    } catch (error) {
      console.error(`Error updating schedule with ID ${id}:`, error.message);
      throw new HttpException(
        `Failed to update schedule: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('listScheduleByTourId/:tourId')
  async getAvailableTimes(
    @Param('tourId') tourId: string
  ): Promise<string[]> {
    try {
      return await this.tourScheduleService.getAvailableTimes(tourId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<TourSchedule> {
    try {
      return this.tourScheduleService.remove(id);
    } catch (error) {
      console.error(`Error deleting schedule with ID ${id}:`, error.message);
      throw new HttpException(
        `Failed to delete schedule: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

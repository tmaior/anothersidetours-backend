import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BlackoutDateService } from '../services/blackout.service';

@Controller('blackout-dates')
export class BlackoutDateController {
  constructor(private blackoutDateService: BlackoutDateService) {}

  @Post()
  createBlackoutDate(
    @Body('isGlobal') isGlobal: boolean,
    @Body('startDate') startDate: Date,
    @Body('endDate') endDate: Date,
    @Body('tourId') tourId?: string,
    @Body('categoryId') categoryId?: string,
    @Body('startTime') startTime?: string,
    @Body('endTime') endTime?: string,
    @Body('reason') reason?: string,
  ) {
    return this.blackoutDateService.createBlackoutDate(
      isGlobal,
      startDate,
      endDate,
      tourId,
      categoryId,
      startTime,
      endTime,
      reason,
    );
  }

  @Post('filter')
  getBlackoutDates(
    @Body('tourId') tourId?: string,
    @Body('categoryId') categoryId?: string,
  ) {
    return this.blackoutDateService.getBlackoutDates(tourId, categoryId);
  }

  @Get('global')
  getBlackoutDatesGlobal() {
    return this.blackoutDateService.getBlackoutDatesGlobal();
  }

  @Get()
  getAllBlackoutDates() {
    return this.blackoutDateService.getAllBlackoutDates();
  }

  @Delete(':id')
  deleteBlackoutDate(@Param('id') id: string) {
    return this.blackoutDateService.deleteBlackoutDate(id);
  }
}

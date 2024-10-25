import { Controller, Post, Get, Delete, Param, Body } from '@nestjs/common';
import { BlackoutDateService } from '../services/blackout.service';

@Controller('blackout-dates')
export class BlackoutDateController {
  constructor(private blackoutDateService: BlackoutDateService) {}

  @Post()
  createBlackoutDate(
    @Body('tenantId') tenantId: string,
    @Body('date') date: Date,
    @Body('reason') reason?: string,
  ) {
    return this.blackoutDateService.createBlackoutDate(tenantId, date, reason);
  }

  @Get(':tenantId')
  getBlackoutDates(@Param('tenantId') tenantId: string) {
    return this.blackoutDateService.getBlackoutDates(tenantId);
  }

  @Delete(':id')
  deleteBlackoutDate(@Param('id') id: string, @Body('tenantId') tenantId: string) {
    return this.blackoutDateService.deleteBlackoutDate(id, tenantId);
  }
}
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { HistoryService } from '../services/history.service';

@Controller('history')
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Post()
  createHistoryEvent(
    @Body()
    data: {
      tenantId: string;
      reservationId?: string;
      eventType: string;
      eventTitle: string;
      eventDescription?: string;
      createdBy?: string;
    },
  ) {
    return this.historyService.createHistoryEvent(data);
  }

  @Get('byReservation/:reservationId')
  getHistoryEvents(@Param('reservationId') reservationId?: string) {
    return this.historyService.getHistoryEvents(reservationId);
  }

  @Get(':id')
  getHistoryEventById(@Param('id') id: string) {
    return this.historyService.getHistoryEventById(id);
  }

  @Delete(':id')
  deleteHistoryEvent(@Param('id') id: string) {
    return this.historyService.deleteHistoryEvent(id);
  }
}

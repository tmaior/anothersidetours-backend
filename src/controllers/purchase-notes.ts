import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { PurchaseNotesService } from '../services/purchase-notes';

@Controller('purchase-notes')
export class PurchaseNotesController {
  constructor(private notesService: PurchaseNotesService) {}

  @Get(':reservationId')
  getAllNotesByReservation(@Param('reservationId') reservationId: string) {
    return this.notesService.getAllNotesByReservation(reservationId);
  }

  @Post()
  createNote(@Body() data: { reservationId: string; description: string }) {
    return this.notesService.createNote(data);
  }

  @Put(':id')
  updateNote(@Param('id') id: string, @Body() data: { description: string }) {
    return this.notesService.updateNote(id, data);
  }

  @Delete(':id')
  deleteNote(@Param('id') id: string) {
    return this.notesService.deleteNote(id);
  }
}

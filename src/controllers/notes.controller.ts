import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { NotesService } from '../services/notes.service';

@Controller('notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

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

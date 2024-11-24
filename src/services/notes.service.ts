import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async getAllNotesByReservation(reservationId: string) {
    return this.prisma.notes.findMany({ where: { reservationId } });
  }

  async createNote(data: { reservationId: string; description: string }) {
    return this.prisma.notes.create({ data });
  }

  async updateNote(id: string, data: { description: string }) {
    return this.prisma.notes.update({ where: { id }, data });
  }

  async deleteNote(id: string) {
    return this.prisma.notes.delete({ where: { id } });
  }
}

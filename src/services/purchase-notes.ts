import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class PurchaseNotesService {
  constructor(private prisma: PrismaService) {}

  async getAllNotesByReservation(reservationId: string) {
    return this.prisma.purchase_Notes.findMany({ where: { reservationId } });
  }

  async createNote(data: { reservationId: string; description: string }) {
    return this.prisma.purchase_Notes.create({ data });
  }

  async updateNote(id: string, data: { description: string }) {
    return this.prisma.purchase_Notes.update({ where: { id }, data });
  }

  async deleteNote(id: string) {
    return this.prisma.purchase_Notes.delete({ where: { id } });
  }
}

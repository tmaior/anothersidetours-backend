import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) {}

  async createHistoryEvent(data: {
    tenantId: string;
    reservationId?: string;
    eventType: string;
    eventTitle: string;
    eventDescription?: string;
    createdBy?: string;
  }) {
    return this.prisma.historyEvent.create({
      data: {
        tenantId: data.tenantId,
        reservationId: data.reservationId,
        eventType: data.eventType,
        eventTitle: data.eventTitle,
        eventDescription: data.eventDescription,
        createdBy: data.createdBy ?? 'System',
      },
    });
  }

  async getHistoryEvents(reservationId?: string) {
    return this.prisma.historyEvent.findMany({
      where: {
        ...(reservationId ? { reservationId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHistoryEventById(id: string) {
    return this.prisma.historyEvent.findUnique({
      where: { id },
    });
  }

  async deleteHistoryEvent(id: string) {
    return this.prisma.historyEvent.delete({
      where: { id },
    });
  }
}
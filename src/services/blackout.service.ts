import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class BlackoutDateService {
  constructor(private prisma: PrismaService) {}

  async createBlackoutDate(
    isGlobal: boolean,
    date: Date,
    tenantId?: string,
    categoryId?: string,
    startTime?: string,
    endTime?: string,
    reason?: string,
  ) {
    return this.prisma.blackoutDate.create({
      data: {
        isGlobal,
        tenant: tenantId ? { connect: { id: tenantId } } : undefined,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        date,
        startTime,
        endTime,
        reason,
      },
    });
  }

  async getBlackoutDates(tenantId?: string, categoryId?: string) {
    return this.prisma.blackoutDate.findMany({
      where: {
        OR: [
          { isGlobal: true },
          { tenantId },
          { categoryId },
        ],
      },
    });
  }

  async getBlackoutDatesGlobal() {
    return this.prisma.blackoutDate.findMany({
      where: {
        OR: [
          { isGlobal: true },
        ],
      },
    });
  }

  async deleteBlackoutDate(id: string) {
    return this.prisma.blackoutDate.delete({
      where: { id },
    });
  }
}

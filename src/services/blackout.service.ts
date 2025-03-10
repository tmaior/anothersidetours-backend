import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Prisma } from '@prisma/client';

// type BlackoutDateCreateInput = {
//   isGlobal: boolean;
//   date: Date;
//   startTime?: string;
//   endTime?: string;
//   reason?: string;
//   tour?: { connect: { id: string } };
//   category?: { connect: { id: string } };
// };

@Injectable()
export class BlackoutDateService {
  constructor(private prisma: PrismaService) {}

  async createBlackoutDate(
    isGlobal: boolean,
    startDate: Date,
    endDate: Date,
    tourId?: string,
    categoryId?: string,
    startTime?: string,
    endTime?: string,
    reason?: string,
    tenantId?: string,
  ) {
    const data: Prisma.BlackoutDateCreateInput = {
      isGlobal,
      startDate,
      endDate,
      startTime,
      endTime,
      reason,
      tenant: {
        connect: { id: tenantId },
      },
    };

    if (tourId) {
      data.tour = { connect: { id: tourId } };
    }

    if (categoryId) {
      data.category = { connect: { id: categoryId } };
    }

    return this.prisma.blackoutDate.create({ data });
  }

  async getBlackoutDates(tourId?: string, categoryId?: string) {
    const filters: Prisma.BlackoutDateWhereInput[] = [{ isGlobal: true }];

    if (tourId) {
      filters.push({
        tourId,
      });
    }

    if (categoryId) {
      filters.push({
        categoryId,
      });
    }

    return this.prisma.blackoutDate.findMany({
      where: { OR: filters },
      include: {
        tour: true,
        category: true,
      },
    });
  }

  async getBlackoutDatesGlobal() {
    return this.prisma.blackoutDate.findMany({
      where: { isGlobal: true },
    });
  }

  async getAllBlackoutDates() {
    return this.prisma.blackoutDate.findMany({
      include: {
        tour: true,
        category: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async getAllBlackoutDatesByTenantId(tenantId: string) {
    return this.prisma.blackoutDate.findMany({
      where: { tenantId },
    });
  }

  async deleteBlackoutDate(id: string) {
    const blackoutDate = await this.prisma.blackoutDate.findUnique({
      where: { id },
    });

    if (!blackoutDate) {
      throw new Error(`Blackout date with ID ${id} does not exist.`);
    }

    return this.prisma.blackoutDate.delete({ where: { id } });
  }
}

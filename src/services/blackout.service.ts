import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
@Injectable()
export class BlackoutDateService {
  constructor(private prisma: PrismaService) {}

  async createBlackoutDate(
    tenantId: string,
    date: Date,
    reason?: string,
  ) {
    return this.prisma.blackoutDate.create({
      data: {
        tenant: {
          connect: { id: tenantId },
        },
        date,
        reason,
      },
    });
  }

  async getBlackoutDates(tenantId: string) {
    return this.prisma.blackoutDate.findMany({
      where: {
        tenant_id: tenantId,
      },
    });
  }


  async deleteBlackoutDate(id: string, tenantId: string) {
    return this.prisma.blackoutDate.deleteMany({
      where: {
        id,
        tenant_id: tenantId,
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class WhatsNotIncludedService {
  constructor(private prisma: PrismaService) {}

  async createWhatsNotIncluded(tourId: string, item: string) {
    return this.prisma.whatsNotIncluded.create({
      data: { tourId, item },
    });
  }

  async getWhatsNotIncludedByTour(tourId: string) {
    return this.prisma.whatsNotIncluded.findMany({
      where: { tourId },
    });
  }

  async updateWhatsNotIncluded(id: string, item: string) {
    return this.prisma.whatsNotIncluded.update({
      where: { id },
      data: { item },
    });
  }

  async deleteWhatsNotIncluded(id: string) {
    return this.prisma.whatsNotIncluded.delete({
      where: { id },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class WhatsIncludedService {
  constructor(private prisma: PrismaService) {}

  async createWhatsIncluded(tourId: string, item: string) {
    return this.prisma.whatsIncluded.create({
      data: { tourId, item },
    });
  }

  async getWhatsIncludedByTour(tourId: string) {
    return this.prisma.whatsIncluded.findMany({
      where: { tourId },
    });
  }

  async updateWhatsIncluded(id: string, item: string) {
    return this.prisma.whatsIncluded.update({
      where: { id },
      data: { item },
    });
  }

  async deleteWhatsIncluded(id: string) {
    return this.prisma.whatsIncluded.delete({
      where: { id },
    });
  }
}

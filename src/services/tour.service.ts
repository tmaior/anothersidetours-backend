import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class TourService {
  constructor(private prisma: PrismaService) {}

  async getAllTours(tenantId: string) {
    return this.prisma.tour.findMany({
      where: { tenant_id: tenantId },
    });
  }

  async createTour(tenantId: string, data: Prisma.TourCreateInput) {
    return this.prisma.tour.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration,
        tenant: {
          connect: {
            id: tenantId,
          },
        },
      },
    });
  }

  async getTourById(tourId: string, tenantId: string) {
    return this.prisma.tour.findFirst({
      where: { id: tourId, tenant_id: tenantId },
    });
  }

  async updateTour(
    tourId: string,
    tenantId: string,
    data: Prisma.TourUpdateInput,
  ) {
    return this.prisma.tour.update({
      where: {
        id: tourId,
        tenant_id: tenantId,
      },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration,
        updated_at: new Date(),
      },
    });
  }

  async deleteTour(tourId: string, tenantId: string) {
    return this.prisma.tour.deleteMany({
      where: { id: tourId, tenant_id: tenantId },
    });
  }
}

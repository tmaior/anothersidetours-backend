import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import {
  TenantNotFoundException,
  TourNotFoundException,
} from '../exceptions/custom-exceptions';

@Injectable()
export class TourService {
  constructor(private prisma: PrismaService) {}

  async getTours(tenantId: string) {
    return this.prisma.tour.findMany({
      where: { tenantId },
      include: {
        addons: true,
      },
    });
  }

  async createTour(tenantId: string, data: Prisma.TourCreateInput) {
    const tenantExists = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenantExists) {
      throw new TenantNotFoundException(tenantId);
    }

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

  async getTourById(tenantId: string, id: string) {
    const tourExists = await this.prisma.tour.findFirst({
      where: { id, tenantId },
      include: {
        addons: true,
      },
    });

    if (!tourExists) {
      throw new TourNotFoundException(id);
    }

    return tourExists;
  }

  async updateTour(tenantId: string, id: string, data: Prisma.TourUpdateInput) {
    const tourExists = await this.prisma.tour.update({
      where: { id, tenantId },
      data,
    });

    if (!tourExists) {
      throw new TourNotFoundException(id);
    }

    return tourExists;
  }

  async deleteTour(tenantId: string, id: string) {
    return this.prisma.tour.delete({
      where: { id, tenantId },
    });
  }
}

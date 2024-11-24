import { Injectable } from '@nestjs/common';
import { Prisma, Tour } from '@prisma/client';
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
        Category: true,
        addons: true,
      },
    });

    if (!tourExists) {
      throw new TourNotFoundException(id);
    }

    return tourExists;
  }

  async updateTour(
    tourId: string,
    data: Partial<{
      name: string;
      price: number;
      description?: string;
      duration?: number;
      categoryId?: string | null;
    }>,
  ): Promise<Tour> {
    const tourExists = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tourExists) {
      throw new Error(`Tour with id ${tourId} not found.`);
    }
    if (data.name && typeof data.name !== 'string') {
      throw new Error('Invalid name. It must be a string.');
    }
    if (data.price && (typeof data.price !== 'number' || data.price <= 0)) {
      throw new Error('Invalid price. It must be a positive number.');
    }
    if (
      data.duration &&
      (typeof data.duration !== 'number' || data.duration <= 0)
    ) {
      throw new Error('Invalid duration. It must be a positive number.');
    }
    let categoryUpdate = {};
    if (data.categoryId === null) {
      categoryUpdate = { Category: { disconnect: true } };
    } else if (data.categoryId) {
      categoryUpdate = { Category: { connect: { id: data.categoryId } } };
    }
    return this.prisma.tour.update({
      where: { id: tourId },
      data: {
        name: data.name,
        price: data.price,
        description: data.description,
        duration: data.duration,
        ...categoryUpdate,
      },
    });
  }

  async deleteTour(tenantId: string, id: string) {
    return this.prisma.tour.delete({
      where: { id, tenantId },
    });
  }
}

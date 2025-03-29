import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class DemographicService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    const existing = await this.prisma.demographic.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new BadRequestException(
        'A demographic with this name already exists.',
      );
    }

    return this.prisma.demographic.create({
      data: {
        name: data.name,
        tenantId: data.tenantId,
        caption: data.caption || "Default Caption",
      },
    });
  }

  async findDemographicsByTourId(tourId: string) {
    const tourDemographics = await this.prisma.tourDemographic.findMany({
      where: { tourId },
      include: {
        demographic: true,
      },
    });
    
    return tourDemographics.map(td => td.demographic);
  }

  async findAll() {
    return this.prisma.demographic.findMany({
      include: {
        tours: {
          include: {
            tour: true,
          },
        },
      },
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.demographic.findMany({
      where: { tenantId },
      include: {
        tours: {
          include: {
            tour: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const demographic = await this.prisma.demographic.findUnique({
      where: { id },
      include: {
        tours: {
          include: {
            tour: true,
          },
        },
      },
    });

    if (!demographic) {
      throw new NotFoundException('Demographic not found.');
    }
    return demographic;
  }

  async update(id: string, data: any) {
    if (data.name) {
      const existing = await this.prisma.demographic.findUnique({
        where: { name: data.name },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException(
          'A demographic with this name already exists.',
        );
      }
    }

    return this.prisma.demographic.update({
      where: { id },
      data: {
        name: data.name,
      },
    });
  }

  async delete(id: string) {
    const demographic = await this.prisma.demographic.findUnique({
      where: { id },
    });

    if (!demographic) {
      throw new NotFoundException('Demographic not found.');
    }

    await this.prisma.tourDemographic.deleteMany({
      where: { demographicId: id },
    });

    return this.prisma.demographic.delete({
      where: { id },
    });
  }

  async assignDemographicToTour(tourId: string, demographicId: string) {
    const existing = await this.prisma.tourDemographic.findFirst({
      where: { tourId, demographicId },
    });

    if (existing) {
      throw new BadRequestException(
        'This demographic is already assigned to the tour.',
      );
    }

    return this.prisma.tourDemographic.create({
      data: {
        tourId,
        demographicId,
      },
    });
  }

  async removeDemographicFromTour(tourId: string, demographicId: string) {
    const existing = await this.prisma.tourDemographic.findFirst({
      where: { tourId, demographicId },
    });

    if (!existing) {
      throw new NotFoundException('Demographic not found for this tour.');
    }

    return this.prisma.tourDemographic.delete({
      where: { id: existing.id },
    });
  }

  async assignToTour(data: { tourId: string; demographicId: string }) {
    const existing = await this.prisma.tourDemographic.findFirst({
      where: {
        tourId: data.tourId,
        demographicId: data.demographicId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'This demographic is already assigned to the tour.',
      );
    }

    return this.prisma.tourDemographic.create({
      data: {
        tourId: data.tourId,
        demographicId: data.demographicId,
      },
    });
  }
}

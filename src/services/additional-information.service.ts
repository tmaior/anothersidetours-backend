import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdditionalInformationService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    tenantId: string;
    tourId: string;
    title: string;
    description: string;
  }) {
    const { tenantId, tourId, title, description } = data;

    return this.prisma.additionalInformation.create({
      data: {
        title,
        description,
        tenant: {
          connect: { id: tenantId },
        },
        tour: {
          connect: { id: tourId },
        },
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.additionalInformation.findMany({
      where: { tenantId },
    });
  }

  async findOne(id: string) {
    return this.prisma.additionalInformation.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.AdditionalInformationUpdateInput) {
    return this.prisma.additionalInformation.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.additionalInformation.delete({
      where: { id },
    });
  }

}

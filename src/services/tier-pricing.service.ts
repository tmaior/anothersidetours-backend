import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class TierPricingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    const { tourId, demographicId, tiers } = data;

    const existing = await this.prisma.tierPricing.findFirst({
      where: { tourId, demographicId },
    });

    if (existing) {
      throw new BadRequestException('Tier Pricing for this Tour and Demographic already exists.');
    }

    return this.prisma.tierPricing.create({
      data: {
        tourId,
        demographicId,
        tierEntries: {
          create: tiers.map((tier: any) => ({
            quantity: tier.quantity,
            price: tier.price,
          })),
        },
      },
      include: {
        tierEntries: true,
      },
    });
  }

  async findAll() {
    return this.prisma.tierPricing.findMany({
      include: {
        tour: true,
        demographic: true,
        tierEntries: true,
      },
    });
  }

  async findOne(id: string) {
    const tierPricing = await this.prisma.tierPricing.findUnique({
      where: { id },
      include: {
        tour: true,
        demographic: true,
        tierEntries: true,
      },
    });

    if (!tierPricing) {
      throw new NotFoundException('Tier Pricing not found.');
    }
    return tierPricing;
  }

  async update(id: string, data: any) {
    const { tiers } = data;

    const tierPricing = await this.prisma.tierPricing.findUnique({
      where: { id },
    });

    if (!tierPricing) {
      throw new NotFoundException('Tier Pricing not found.');
    }

    await this.prisma.tierPriceEntry.deleteMany({
      where: { tierPricingId: id },
    });

    return this.prisma.tierPricing.update({
      where: { id },
      data: {
        tierEntries: {
          create: tiers.map((tier: any) => ({
            quantity: tier.quantity,
            price: tier.price,
          })),
        },
      },
      include: { tierEntries: true },
    });
  }

  async delete(id: string) {
    const tierPricing = await this.prisma.tierPricing.findUnique({
      where: { id },
    });

    if (!tierPricing) {
      throw new NotFoundException('Tier Pricing not found.');
    }

    return this.prisma.tierPricing.delete({
      where: { id },
    });
  }
}

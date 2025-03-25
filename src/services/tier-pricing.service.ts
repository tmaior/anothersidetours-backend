import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class TierPricingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    const { tourId, demographicId, pricingType, basePrice, tiers } = data;

    const existing = await this.prisma.tierPricing.findFirst({
      where: { tourId, demographicId },
    });

    if (existing) {
      throw new BadRequestException(
        'Tier Pricing for this Tour and Demographic already exists.',
      );
    }

    if (pricingType === 'flat') {
      return this.prisma.tierPricing.create({
        data: {
          tourId,
          demographicId,
          pricingType: 'flat',
          basePrice: basePrice || 0,
        },
      });
    }

    if (pricingType === 'tiered' && Array.isArray(tiers) && tiers.length > 0) {
      return this.prisma.tierPricing.create({
        data: {
          tourId,
          demographicId,
          pricingType: 'tiered',
          basePrice: basePrice || 0,
          tierEntries: {
            create: tiers.map((tier: any) => ({
              quantity: tier.quantity,
              price: tier.price,
              adjustmentType: tier.adjustmentType,
              operation: tier.operation,
              adjustment: tier.adjustment
            })),
          },
        },
        include: {
          tierEntries: true,
        },
      });
    }

    throw new BadRequestException('Invalid pricing type or missing data.');
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

  async findByTourId(tourId: string) {
    const tierPricing = await this.prisma.tierPricing.findMany({
      where: { tourId },
      include: {
        demographic: true,
        tierEntries: true,
      },
    });

    if (!tierPricing || tierPricing.length === 0) {
      throw new NotFoundException(`No tier pricing found for tour ${tourId}`);
    }

    return tierPricing;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { AddonType, Prisma } from '@prisma/client';
import { TypeAddonNotValid } from '../exceptions/custom-exceptions';

@Injectable()
export class AddonService {
  constructor(private prisma: PrismaService) {}

  async createAddon(
    data: Prisma.AddonCreateInput,
    tenantId: string,
    tourId: string
  ) {
    if (!Object.values(AddonType).includes(data.type)) {
      throw new TypeAddonNotValid(data.type);
    }

    let connectTour = undefined;
    if (tourId) {
      const existingTour = await this.prisma.tour.findUnique({
        where: { id: tourId },
      });

      if (!existingTour) {
        throw new NotFoundException(`Tour with ID ${tourId} not found`);
      }

      connectTour = { connect: { id: tourId } };
    }

    return this.prisma.addon.create({
      data: {
        label: data.label,
        type: data.type,
        description: data.description,
        price: parseFloat(data.price.toString()),
        tour: connectTour,
        tenant: { connect: { id: tenantId } },
      },
    });
  }


  async getAddons() {
    return this.prisma.addon.findMany({
      select: {
        id: true,
        label: true,
        type: true,
        description: true,
        price: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getAllAddons(tourId: string) {
    return this.prisma.addon.findMany({
      where: { tourId },
      select: {
        id: true,
        label: true,
        type: true,
        description: true,
        price: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getAddonById(addonId: string) {
    return this.prisma.addon.findUnique({
      where: { id: addonId },
      select: {
        id: true,
        label: true,
        description: true,
        type: true,
      },
    });
  }

  async updateAddon(
    addonId: string,
    data: Prisma.AddonUpdateInput,
  ) {
    return this.prisma.addon.update({
      where: { id: addonId },
      data,
    });
  }

  async deleteAddon(addonId: string) {
    return this.prisma.addon.delete({
      where: { id: addonId },
    });
  }
}

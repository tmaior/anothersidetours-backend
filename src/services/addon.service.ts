import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { AddonType, Prisma } from '@prisma/client';
import { TypeAddonNotValid } from '../exceptions/custom-exceptions';

@Injectable()
export class AddonService {
  constructor(private prisma: PrismaService) {}

  async createAddon(
    tourId: string,
    data: Prisma.AddonCreateInput,
  ) {
    if (!Object.values(AddonType).includes(data.type)) {
      throw new TypeAddonNotValid(data.type);
    }

    return this.prisma.addon.create({
      data: {
        label: data.label,
        type: data.type,
        description: data.description,
        price: data.price,
        tour: tourId ? { connect: { id: tourId } } : undefined,
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

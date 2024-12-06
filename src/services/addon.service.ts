import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { AddonType, Prisma } from '@prisma/client';
import { TypeAddonNotValid } from '../exceptions/custom-exceptions';

@Injectable()
export class AddonService {
  constructor(private prisma: PrismaService) {}

  async createAddon(
    tenantId: string,
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
        tenant: {
          connect: { id: tenantId },
        },
        tour: {
          connect: { id: tourId },
        },
      },
    });
  }

  async getAddons(tenantId: string) {
    return this.prisma.addon.findMany({
      where: { tenantId },
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

  async deleteAddon(tenantId: string, addonId: string) {
    return this.prisma.addon.delete({
      where: { id: addonId, tenantId },
    });
  }
}

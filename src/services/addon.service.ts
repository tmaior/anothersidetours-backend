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
        ...data,
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
    });
  }

  async getAddonById(tenantId: string, addonId: string) {
    return this.prisma.addon.findUnique({
      where: { id: addonId, tenantId },
    });
  }

  async updateAddon(
    tenantId: string,
    addonId: string,
    data: Prisma.AddonUpdateInput,
  ) {
    return this.prisma.addon.update({
      where: { id: addonId, tenantId },
      data,
    });
  }

  async deleteAddon(tenantId: string, addonId: string) {
    return this.prisma.addon.delete({
      where: { id: addonId, tenantId },
    });
  }
}

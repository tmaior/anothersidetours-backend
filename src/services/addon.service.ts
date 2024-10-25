import { Injectable } from '@nestjs/common';
import { AddonType, OptionType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class AddonService {
  constructor(private prisma: PrismaService) {}

  async getAllAddons(tenantId: string) {
    return this.prisma.addon.findMany({
      where: { tenant_id: tenantId },
    });
  }

  async createAddon(
    tenantId: string,
    tourId: string,
    data: {
      type: AddonType,
      label: string,
      options: { type: OptionType; value: string }[]
    },
  ) {
    return this.prisma.addon.create({
      data: {
        tenant: {
          connect: { id: tenantId },
        },
        tour: {
          connect: { id: tourId },
        },
        type: data.type,
        label: data.label,
        options: {
          create: data.options.map((option) => ({
            type: option.type,
            value: option.value,
          })),
        },
      },
      include: {
        options: true,
      },
    });
  }

  async getAddonById(addonId: string, tenantId: string) {
    return this.prisma.addon.findFirst({
      where: { id: addonId, tenant_id: tenantId },
    });
  }

  async updateAddon(
    addonId: string,
    tenantId: string,
    data: Prisma.AddonUpdateInput,
  ) {
    return this.prisma.addon.update({
      where: { id: addonId, tenant_id: tenantId },
      data,
    });
  }

  async deleteAddon(addonId: string, tenantId: string) {
    return this.prisma.addon.delete({
      where: { id: addonId, tenant_id: tenantId },
    });
  }
}

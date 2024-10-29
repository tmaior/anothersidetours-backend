import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReservationAddonService {
  constructor(private prisma: PrismaService) {}

  async getReservationAddons(tenantId: string) {
    return this.prisma.reservationAddon.findMany({
      where: { tenantId },
    });
  }

  async createReservationAddon(
    tenantId: string,
    reservationId: string,
    addonId: string,
    value: string,
  ) {
    return this.prisma.reservationAddon.create({
      data: {
        tenant: { connect: { id: tenantId } },
        reservation: { connect: { id: reservationId } },
        addon: { connect: { id: addonId } },
        value,
      },
    });
  }

  async getReservationAddonById(tenantId: string, id: string) {
    return this.prisma.reservationAddon.findFirst({
      where: { id, tenantId },
    });
  }

  async updateReservationAddon(
    tenantId: string,
    id: string,
    data: Prisma.ReservationAddonUpdateInput,
  ) {
    return this.prisma.reservationAddon.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async deleteReservationAddon(tenantId: string, id: string) {
    return this.prisma.reservationAddon.deleteMany({
      where: { id, tenantId },
    });
  }
}

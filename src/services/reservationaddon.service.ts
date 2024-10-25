import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class ReservationAddonService {
  constructor(private prisma: PrismaService) {}

  async createReservationAddon(
    tenantId: string,
    reservationId: string,
    addonId: string,
    value: string,
  ) {
    return this.prisma.reservationAddon.create({
      data: {
        tenant: {
          connect: { id: tenantId },
        },
        reservation: {
          connect: { id: reservationId },
        },
        addon: {
          connect: { id: addonId },
        },
        value,
      },
    });
  }

  async updateReservationAddon(
    id: string,
    tenantId: string,
    value: string,
  ) {
    return this.prisma.reservationAddon.updateMany({
      where: {
        id,
        tenant_id: tenantId,
      },
      data: {
        value,
      },
    });
  }

  async getReservationAddons(reservationId: string) {
    return this.prisma.reservationAddon.findMany({
      where: {
        reservation_id: reservationId,
      },
      include: {
        addon: true,
      },
    });
  }

  async deleteReservationAddon(id: string, tenantId: string) {
    return this.prisma.reservationAddon.deleteMany({
      where: {
        id,
        tenant_id: tenantId,
      },
    });
  }
}
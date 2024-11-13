import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReservationService {
  constructor(private prisma: PrismaService) {}

  async getReservations(tenantId: string) {
    return this.prisma.reservation.findMany({
      where: { tenantId },
      include: {
        reservationAddons: {
          include: {
            addon: true,
          },
        },
      },
    });
  }

  async createReservation(
    data: Prisma.ReservationCreateInput & {
      tenantId: string;
      tourId: string;
      userId: string;
      addons?: { addonId: string; quantity: number }[];
    },
  ) {
    const { tenantId, tourId, userId, addons = [], ...reservationData } = data;

    return this.prisma.reservation.create({
      data: {
        ...reservationData,
        tenant: { connect: { id: tenantId } },
        tour: { connect: { id: tourId } },
        user: { connect: { id: userId } },
        reservationAddons: {
          create: addons.map((addon) => ({
            tenant: { connect: { id: tenantId } },
            addon: { connect: { id: addon.addonId } },
            value: `${addon.quantity}`,
          })),
        },
      },
    });
  }

  async getReservationById(tenantId: string, id: string) {
    return this.prisma.reservation.findFirst({
      where: { id, tenantId },
      include: {
        reservationAddons: {
          include: {
            addon: true,
          },
        },
      },
    });
  }

  async updateReservation(
    tenantId: string,
    id: string,
    data: Prisma.ReservationUpdateInput,
  ) {
    return this.prisma.reservation.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async deleteReservation(tenantId: string, id: string) {
    return this.prisma.reservation.deleteMany({
      where: { id, tenantId },
    });
  }
}

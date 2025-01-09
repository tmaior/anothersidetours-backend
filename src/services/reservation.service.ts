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
        notes:true,
        tour: true,
        reservationAddons: {
          include: {
            addon: true,
          },
        },
      },
    });
  }

  async getReservationsWithUsers(tenantId: string) {
    const reservations = await this.prisma.reservation.findMany({
      where: { tenantId },
      include: {
        notes: true,
        tour: true,
        reservationAddons: {
          include: {
            addon: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            selectedDate: true,
            selectedTime: true,
            guestQuantity: true,
            statusCheckout: true,
          },
        },
      },
    });

    return reservations.map((reservation) => ({
      ...reservation,
      user: {
        id: reservation.user?.id || null,
        name: reservation.user?.name || 'Unknown User',
        email: reservation.user?.email || 'No Email',
        phone: reservation.user?.phone || 'None',
        guestQuantity: reservation.user?.guestQuantity || 'Unknown',
        statusCheckout: reservation.user?.statusCheckout || 'Unknown',
        selectedDate: reservation.user?.selectedDate || 'Unknown',
        selectedTime: reservation.user?.selectedTime || 'Unknown',
      },
    }));
  }

  async createReservation(
    data: Prisma.ReservationCreateInput & {
      tourId: string;
      userId: string;
      addons?: { addonId: string; quantity: number }[];
    },
  ) {
    const { tourId, userId, addons = [], ...reservationData } = data;
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      select: { tenantId: true },
    });
    if (!tour || !tour.tenantId) {
      throw new Error(`Tenant not found for tour ID ${tourId}`);
    }
    const tenantId = tour.tenantId;

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
        notes:true,
        tour: true,
        reservationAddons: {
          include: {
            addon: true,
          },
        },
      },
    });
  }

  async getAllReservations() {
    return this.prisma.reservation.findMany({
      include: {
        notes: true,
        tour: true,
        reservationAddons: {
          include: {
            addon: true,
          },
        },
      },
    });
  }

  async updateReservation(
    id: string,
    data: Prisma.ReservationUpdateInput,
  ) {
    return this.prisma.reservation.update({
      where: { id },
      data: {
        ...data,
      },
    });
  }

  async deleteReservation(tenantId: string, id: string) {
    return this.prisma.reservation.deleteMany({
      where: { id, tenantId },
    });
  }
}

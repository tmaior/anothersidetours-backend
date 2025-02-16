import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Prisma } from '@prisma/client';
import { HistoryService } from './history.service';

@Injectable()
export class ReservationService {
  constructor(
    private prisma: PrismaService,
    private history: HistoryService,
  ) {}

  async getReservations(tenantId: string) {
    return this.prisma.reservation.findMany({
      where: { tenantId },
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
      createdBy?: string;
    },
  ) {
    const { tourId, userId, addons = [], createdBy, ...reservationData } = data;
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      select: { tenantId: true },
    });
    if (!tour || !tour.tenantId) {
      throw new Error(`Tenant not found for tour ID ${tourId}`);
    }
    const tenantId = tour.tenantId;

    const newReservation = await this.prisma.reservation.create({
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

    await this.history.createHistoryEvent({
      tenantId,
      reservationId: newReservation.id,
      eventType: 'Reservation',
      eventTitle: 'Reservation Created',
      status: newReservation.status,
      value: newReservation.total_price,
      eventDescription: `Reservation created for user ${userId} on tour ${tourId}.`,
      createdBy: createdBy || 'System',
    });

    return newReservation;
  }

  async getReservationById(tenantId: string, id: string) {
    return this.prisma.reservation.findFirst({
      where: { id, tenantId },
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

  private convertToISO8601(datetimeStr: string): string {
    return datetimeStr.replace(' ', 'T') + 'Z';
  }

  async updateReservation(id: string, data: Prisma.ReservationUpdateInput) {
    if (
      typeof data.reservation_date === 'string' &&
      data.reservation_date.includes(' ')
    ) {
      data.reservation_date = this.convertToISO8601(data.reservation_date);
    }

    const updatedReservation = await this.prisma.reservation.update({
      where: { id },
      data: {
        ...data,
      },
    });

    await this.history.createHistoryEvent({
      tenantId: updatedReservation.tenantId,
      reservationId: updatedReservation.id,
      eventType: 'Reservation',
      eventTitle: 'Reservation Updated',
      status: updatedReservation.status,
      value: updatedReservation.total_price,
      eventDescription: `Reservation status updated to ${updatedReservation.status}.`,
      createdBy: 'System',
    });

    if (updatedReservation.status === 'ACCEPTED') {
      await this.history.createHistoryEvent({
        tenantId: updatedReservation.tenantId,
        reservationId: updatedReservation.id,
        eventType: 'Reservation',
        eventTitle: 'Reservation Paid',
        status: 'PAYMENT',
        value: updatedReservation.total_price,
        eventDescription: `Reservation marked as paid.`,
        createdBy: 'System',
      });
    }

    return updatedReservation;
  }

  async deleteReservation(tenantId: string, id: string) {
    return this.prisma.reservation.deleteMany({
      where: { id, tenantId },
    });
  }
}

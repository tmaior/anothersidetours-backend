import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Prisma, ReservationIncomplete } from '@prisma/client';
import { HistoryService } from './history.service';
import { MailService } from './mail.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReservationService {
  constructor(
    private prisma: PrismaService,
    private history: HistoryService,
    private mailService: MailService,
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

  async createReservations(data: {
    cart: Array<{
      tourId: string;
      reservationData: Prisma.ReservationCreateInput;
      addons?: { addonId: string; quantity: number }[];
      total_price: number;
      guestQuantity: number;
      createdBy: string;
      purchaseTags: string;
      purchaseNote: string;
    }>;
    userId: string;
    createdBy?: string;
  }) {
    const reservations = [];

    const groupId = data.cart.length > 1 ? uuidv4() : null;

    for (const item of data.cart) {
      const { tourId, reservationData, addons = [] } = item;

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
          total_price: item.total_price,
          groupId: groupId,
          tenant: { connect: { id: tenantId } },
          tour: { connect: { id: tourId } },
          user: { connect: { id: data.userId } },
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
        eventDescription: `Reservation created for user ${data.userId} on tour ${tourId}.`,
        createdBy: data.createdBy || 'System',
      });

      reservations.push(newReservation);
    }
    return reservations;
  }

  async getReservationById(tenantId: string, id: string) {
    return this.prisma.reservation.findFirst({
      where: { id, tenantId },
      include: {
        notes: true,
        tour: true,
        user: true,
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

    const reservation = await this.prisma.reservation.findFirst({
      where: { id },
      include: {
        notes: true,
        tour: true,
        user: true,
        reservationAddons: {
          include: {
            addon: true,
          },
        },
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

    if (data.status == 'CANCELED') {
      function convertReservationDate(dateStr: string): {
        date: string;
        time: string;
      } {
        const dateObj = new Date(dateStr);

        dateObj.setHours(dateObj.getHours() - 17);

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        let hours = dateObj.getHours();
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const formattedTime = `${hours}:${minutes} ${ampm}`;

        return { date: formattedDate, time: formattedTime };
      }

      const { date, time } = convertReservationDate(
        reservation.reservation_date.toISOString(),
      );

      const totalPrice = reservation.total_price;
      const formattedTotalPrice = totalPrice.toFixed(2);

      const guestRow = {
        label: `Guest ($${reservation.tour.price} x ${reservation.guestQuantity})`,
        amount: `$${(reservation.tour.price * reservation.guestQuantity).toFixed(2)}`,
      };

      const addonsRows = reservation.reservationAddons.map((item) => {
        const price = item.addon.price;
        const quantity = Number(item.value);
        const total = price * quantity;
        return {
          label: `${item.addon.label} ($${price} x ${quantity})`,
          amount: `$${total.toFixed(2)}`,
        };
      });

      const guestAddons = [guestRow, ...addonsRows];

      const emailData = {
        title: 'Reservation Cancelled',
        description: 'Reservation Cancelled',
        date: date,
        time: time,
        duration: reservation.tour.duration,
        name: reservation.user.name,
        email: reservation.user.email,
        phone: reservation.user.phone,
        tourTitle: reservation.tour.name,
        reservationImageUrl: reservation.tour.imageUrl,
        quantity: reservation.guestQuantity,
        addons: guestAddons,
        totals: [
          { label: 'Paid', amount: formattedTotalPrice },
          { label: 'Total', amount: formattedTotalPrice },
        ],
      };

      await this.mailService.sendReservationCancelEmail(
        reservation.user.email,
        emailData,
      );
    }
    return updatedReservation;
  }

  async createOrUpdateIncompleteReservation(data: {
    tourId: string;
    name: string;
    email: string;
    phone?: string;
    guestQuantity: number;
    selectedDate: string | null;
    selectedTime: string | null;
    statusCheckout: string;
  }): Promise<ReservationIncomplete> {
    function parseDateTime(value: string | null): Date | null {
      if (!value) return null;
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    try {
      const parsedSelectedDate = data.selectedDate
        ? new Date(data.selectedDate)
        : null;
      const parsedSelectedTime = parseDateTime(data.selectedTime);

      const result = await this.prisma.reservationIncomplete.upsert({
        where: { email: data.email },
        update: {
          tourId: data.tourId,
          name: data.name,
          phone: data.phone,
          guestQuantity: data.guestQuantity,
          selectedDate: parsedSelectedDate,
          selectedTime: parsedSelectedTime,
          statusCheckout: data.statusCheckout,
          updatedAt: new Date(),
        },
        create: {
          tourId: data.tourId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          guestQuantity: data.guestQuantity,
          selectedDate: parsedSelectedDate,
          selectedTime: parsedSelectedTime,
          statusCheckout: data.statusCheckout,
        },
      });
      console.log('Upsert performed successfully:', result);
      return result;
    } catch (error) {
      console.error('ReservationIncomplete upsert error:', error);
      throw error;
    }
  }

  async getReservationIncomplete(id: string) {
    return this.prisma.reservationIncomplete.findUnique({
      where: { id },
      include: {
        tour: true,
      },
    });
  }

  async deleteReservation(tenantId: string, id: string) {
    return this.prisma.reservation.deleteMany({
      where: { id, tenantId },
    });
  }
}

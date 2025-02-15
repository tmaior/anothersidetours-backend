import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { MailService } from './mail.service';
import { EmailReminderService } from './email-reminder.service';

@Injectable()
export class GuideService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private emailReminderService: EmailReminderService,
  ) {}

  async getAllGuides() {
    return this.prisma.guide.findMany();
  }

  async getGuideById(id: string) {
    return this.prisma.guide.findUnique({
      where: { id },
      include: { reservation: true },
    });
  }

  async getGuidesByTenantId(tenantId: string) {
    return this.prisma.guide.findMany({
      where: {
        tenantId,
      },
    });
  }

  async createGuide(data: {
    name: string;
    email: string;
    phone: string;
    imageUrl: string;
    bio: string;
    status: string;
    available: boolean;
    tenantId: string;
  }) {
    return this.prisma.guide.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: 'Confirmed',
        imageUrl: data.imageUrl,
        bio: data.bio,
        available: data.available ?? true,
      },
    });
  }

  async updateGuide(
    id: string,
    data: { name?: string; email?: string; phone?: string; reservation?: any },
  ) {
    const { reservation, ...dataWithoutReservation } = data;

    if (!reservation || reservation.length === 0) {
      return this.prisma.guide.update({
        where: { id },
        data: dataWithoutReservation,
      });
    }

    return this.prisma.guide.update({
      where: { id },
      data,
    });
  }

  async deleteGuide(id: string) {
    return this.prisma.guide.delete({ where: { id } });
  }

  async assignGuidesToReservation(guideIds: string[], reservationId: string) {
    const reservationExists = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
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

    if (!reservationExists) {
      throw new Error(`Reservation with ID ${reservationId} not found`);
    }

    await this.prisma.reservationGuide.deleteMany({
      where: { reservationId },
    });

    await this.emailReminderService.deleteRemindersByReservation(reservationId);

    const data = guideIds.map((guideId) => ({
      guideId,
      reservationId,
    }));

    for (const guideId of guideIds) {
      const guide = await this.prisma.guide.findUnique({
        where: { id: guideId },
      });

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
        reservationExists.reservation_date.toISOString(),
      );

      if (guide && guide.email) {
        const totalPrice = reservationExists.total_price;
        const formattedTotalPrice = totalPrice.toFixed(2);

        const emailData = {
          title: 'Reservation Assigned',
          description: 'Reservation Assigned',
          date: date,
          time: time,
          duration: reservationExists.tour.duration,
          name: reservationExists.user.name,
          email: reservationExists.user.email,
          phone: reservationExists.user.phone,
          tourTitle: reservationExists.tour.name,
          reservationImageUrl: reservationExists.tour.imageUrl,
          quantity: reservationExists.guestQuantity,
          totals: [
            { label: 'Paid', amount: formattedTotalPrice },
            { label: 'Total', amount: formattedTotalPrice },
          ],
        };
        await this.mailService.sendGuideReservationEmail(
          guide.email,
          emailData,
        );
        await this.emailReminderService.createRemindersForReservation(
          reservationId,
        );
      }
    }

    return this.prisma.reservationGuide.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async getGuidesByReservation(reservationId: string) {
    return this.prisma.reservationGuide.findMany({
      where: { reservationId },
      select: { guideId: true, guide: { select: { name: true } } },
    });
  }

  async removeGuideFromTour(tourId: string, guideIds: string[] = []) {
    const tourExists = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tourExists) {
      throw new Error(`Tour with ID ${tourId} not found`);
    }

    if (guideIds.length === 0) {
      return this.prisma.reservationGuide.deleteMany({
        where: {
          reservationId: tourId,
        },
      });
    }

    return this.prisma.reservationGuide.deleteMany({
      where: {
        reservationId: tourId,
        guideId: { in: guideIds },
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class GuideService {
  constructor(private prisma: PrismaService) {}

  async getAllGuides() {
    return this.prisma.guide.findMany();
  }

  async getGuideById(id: string) {
    return this.prisma.guide.findUnique({
      where: { id },
      include: { reservation: true },
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
  }) {
    return this.prisma.guide.create({
      data: {
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
    data: { name?: string; email?: string; phone?: string },
  ) {
    return this.prisma.guide.update({ where: { id }, data });
  }

  async deleteGuide(id: string) {
    return this.prisma.guide.delete({ where: { id } });
  }

  async assignGuidesToReservation(guideIds: string[], reservationId: string) {
    const reservationExists = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservationExists) {
      throw new Error(`Reservation with ID ${reservationId} not found`);
    }

    await this.prisma.reservationGuide.deleteMany({
      where: { reservationId },
    });

    const data = guideIds.map((guideId) => ({
      guideId,
      reservationId,
    }));

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
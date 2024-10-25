import { Injectable } from '@nestjs/common';
import { Prisma, Reservation } from '@prisma/client';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class ReservationService {
  constructor(private prisma: PrismaService) {}

  async getAllReservations(tenantId: string) {
    return this.prisma.reservation.findMany({
      where: { tenant_id: tenantId },
    });
  }

  async createReservation(
    data: { tenantId: string; tourId: string; userId: string; reservation_date: string; total_price: number; status: string },
  ): Promise<Reservation> {
    return this.prisma.reservation.create({
      data: {
        reservation_date: new Date(data.reservation_date),
        total_price: data.total_price,
        status: data.status,
        tenant: {
          connect: { id: data.tenantId },
        },
        tour: {
          connect: { id: data.tourId },
        },
        user: {
          connect: { id: data.userId },
        },
      },
    });
  }


  async getReservationById(reservationId: string, tenantId: string) {
    return this.prisma.reservation.findFirst({
      where: { id: reservationId, tenant_id: tenantId },
    });
  }

  async updateReservation(
    reservationId: string,
    tenantId: string,
    data: Prisma.ReservationUpdateInput,
  ) {
    return this.prisma.reservation.update({
      where: { id: reservationId, tenant_id: tenantId },
      data,
    });
  }

  async deleteReservation(reservationId: string, tenantId: string) {
    return this.prisma.reservation.deleteMany({
      where: { id: reservationId, tenant_id: tenantId },
    });
  }
}

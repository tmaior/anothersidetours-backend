import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Prisma, TourSchedule } from '@prisma/client'; // Importar os modelos gerados pelo Prisma

@Injectable()
export class TourScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  private generateDefaultTimeSlots(start: string, end: string, interval: number): string[] {
    const slots: string[] = [];
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    const current = new Date(Date.UTC(1970, 0, 1, startHour, startMinute, 0));
    const endTime = new Date(Date.UTC(1970, 0, 1, endHour, endMinute, 0));

    while (current <= endTime) {
      slots.push(current.toISOString());
      current.setUTCMinutes(current.getUTCMinutes() + interval);
    }
    return slots;
  }


  async createTourSchedules(
    tourId: string,
    timeSlots: string[] = [],
  ): Promise<Prisma.BatchPayload> {
    const defaultTimeSlots = this.
    generateDefaultTimeSlots('08:00', '18:00', 60);
    const finalTimeSlots = timeSlots.length > 0
      ? timeSlots.map((slot) => new Date(slot).toISOString())
      : defaultTimeSlots;

    return this.prisma.tourSchedule.createMany({
      data: finalTimeSlots.map((timeSlot) => ({
        tourId,
        timeSlot,
      })),
    });
  }


  async findAll(): Promise<TourSchedule[]> {
    return this.prisma.tourSchedule.findMany({
      include: { tour: true },
    });
  }

  async findOne(id: string): Promise<TourSchedule | null> {
    return this.prisma.tourSchedule.findUnique({
      where: { id },
      include: { tour: true },
    });
  }

  async update(id: string, data: Partial<TourSchedule>): Promise<TourSchedule> {
    return this.prisma.tourSchedule.update({
      where: { id },
      data,
    });
  }

  async getAvailableTimes(tourId: string): Promise<string[]> {
    const schedules = await this.prisma.tourSchedule.findMany({
      where: {
        tourId,
      },
      select: { timeSlot: true },
    });
    if (!schedules || schedules.length === 0) {
      throw new Error('Schedule not found');
    }
    return schedules.map((schedule) => new Date(schedule.timeSlot).toISOString());
  }

  async remove(id: string): Promise<TourSchedule> {
    return this.prisma.tourSchedule.delete({
      where: { id },
    });
  }
}

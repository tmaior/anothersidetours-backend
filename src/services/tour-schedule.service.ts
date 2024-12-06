import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Prisma, TourSchedule } from '@prisma/client';
import { formatInTimeZone } from "date-fns-tz";

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

  private parseTimeSlot(timeSlot: string): string {
    try {
      const [hours, minutes] = timeSlot.split(':');
      const period = timeSlot.split(' ')[1];
      const date = new Date();
      date.setHours(
        period === 'PM' ? parseInt(hours) + 12 : parseInt(hours),
        parseInt(minutes),
        0,
        0
      );

      if (isNaN(date.getTime())) {
        throw new Error(`Invalid time slot: ${timeSlot}`);
      }

      return date.toISOString();
    } catch {
      throw new Error(`Invalid time slot format: ${timeSlot}`);
    }
  }

  async createTourSchedules(
    tourId: string,
    timeSlots: string[] = [],
  ): Promise<Prisma.BatchPayload> {
    const defaultTimeSlots = this.generateDefaultTimeSlots('08:00', '18:00', 60);

    const finalTimeSlots = timeSlots.length > 0
      ? timeSlots.map((slot) => this.parseTimeSlot(slot))
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
      where: { tourId },
      select: { timeSlot: true },
    });

    if (!schedules || schedules.length === 0) {
      throw new Error("No available schedules found");
    }

    return schedules.map((schedule) => {
      return formatInTimeZone(schedule.timeSlot, "UTC", "hh:mm a");
    });
  }

  async remove(id: string): Promise<TourSchedule> {
    return this.prisma.tourSchedule.delete({
      where: { id },
    });
  }
}

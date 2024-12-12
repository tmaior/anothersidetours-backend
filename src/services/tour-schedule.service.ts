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

    const current = new Date();
    current.setUTCHours(startHour, startMinute, 0, 0);

    const endTime = new Date();
    endTime.setUTCHours(endHour, endMinute, 0, 0);

    while (current <= endTime) {
      slots.push(current.toISOString());
      current.setUTCMinutes(current.getUTCMinutes() + interval);
    }
    return slots;
  }

  private parseTimeSlot(timeSlot: string): string {
    try {
      const [time, period] = timeSlot.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      let hours24 = hours;
      if (period === 'PM' && hours !== 12) {
        hours24 += 12;
      } else if (period === 'AM' && hours === 12) {
        hours24 = 0;
      }
      date.setUTCHours(hours24, minutes, 0, 0);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid time slot: ${timeSlot}`);
      }
      return date.toISOString();
    } catch (error) {
      console.error(`Error parsing time slot: ${timeSlot}`, error);
      throw new Error(`Invalid time slot format: ${timeSlot}`);
    }
  }

  async createTourSchedules(
    tourId: string,
    timeSlots: string[] = [],
  ): Promise<Prisma.BatchPayload> {
    const finalTimeSlots =
      timeSlots.length > 0
        ? timeSlots.map((slot) => this.parseTimeSlot(slot))
        : this.generateDefaultTimeSlots('08:00', '18:00', 60);

    const uniqueTimeSlots = Array.from(new Set(finalTimeSlots));

    return this.prisma.tourSchedule.createMany({
      data: uniqueTimeSlots.map((timeSlot) => ({
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

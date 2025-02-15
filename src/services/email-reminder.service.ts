import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { MailService } from './mail.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class EmailReminderService implements OnModuleInit {
  private readonly logger = new Logger(EmailReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit() {
    this.logger.log(
      'EmailReminderService initialized! Everything running in UTC.',
    );
  }

  async getRemindersByReservation(reservationId: string) {
    return this.prisma.email_Reminder.findMany({
      where: { reservationId },
    });
  }

  async createRemindersForReservation(reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new Error('Reservation not found.');
    }

    const reminders = [
      {
        reservationId,
        reminderType: '24h',
        scheduledAt: new Date(
          new Date(reservation.reservation_date).getTime() -
            24 * 60 * 60 * 1000,
        ).toISOString(),
        sent: false,
      },
      {
        reservationId,
        reminderType: '12h',
        scheduledAt: new Date(
          new Date(reservation.reservation_date).getTime() -
            12 * 60 * 60 * 1000,
        ).toISOString(),
        sent: false,
      },
      {
        reservationId,
        reminderType: '6h',
        scheduledAt: new Date(
          new Date(reservation.reservation_date).getTime() - 6 * 60 * 60 * 1000,
        ).toISOString(),
        sent: false,
      },
    ];

    return this.prisma.email_Reminder.createMany({ data: reminders });
  }

  async deleteRemindersByReservation(reservationId: string): Promise<void> {
    try {
      await this.prisma.email_Reminder.deleteMany({
        where: { reservationId },
      });

      this.logger.log(
        `All reservation reminders ${reservationId} were deleted.`,
      );
    } catch (error) {
      this.logger.error(
        `Error when deleting reservation reminders ${reservationId}: ${error.message}`,
      );
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAndSendReminders() {
    this.logger.log('Cron job started: Checking for pending reminders...');

    const nowLocal = new Date();

    const nowUTC = new Date(
      nowLocal.getTime() - nowLocal.getTimezoneOffset() * 60000,
    );

    this.logger.log(
      `Now (Local): ${nowLocal.toString()} -> ${nowLocal.getTime()}`,
    );
    this.logger.log(
      `Now (UTC): ${nowUTC.toISOString()} -> ${nowUTC.getTime()}`,
    );

    const reminders = await this.prisma.email_Reminder.findMany({
      where: {
        scheduledAt: { lte: nowUTC },
        sent: false,
      },
    });

    if (reminders.length === 0) {
      this.logger.log('No pending reminders found.');
      return;
    }

    this.logger.log(`🔹 Found ${reminders.length} pending reminders.`);

    for (const reminder of reminders) {
      try {
        const reservationDetails = await this.getReservationDetails(
          reminder.reservationId,
        );

        const scheduledUTC = new Date(reminder.scheduledAt.toISOString());

        const timeDifferenceInMinutes =
          (nowUTC.getTime() - scheduledUTC.getTime()) / (1000 * 60);

        this.logger.log(
          `Now (UTC): ${nowUTC.toISOString()} -> ${nowUTC.getTime()}`,
        );
        this.logger.log(
          `Reminder scheduled (UTC): ${scheduledUTC.toISOString()} -> ${scheduledUTC.getTime()}`,
        );
        this.logger.log(
          `Time difference: ${timeDifferenceInMinutes.toFixed(2)} minutes`,
        );

        if (Math.abs(timeDifferenceInMinutes) < -5) {
          this.logger.warn(
            `Reminder for reservation ${reminder.reservationId} is too early. Skipping.`,
          );
          continue;
        }

        if (Math.abs(timeDifferenceInMinutes) > 5) {
          this.logger.warn(
            `Reminder for reservation ${reminder.reservationId} is too old. Skipping.`,
          );
          continue;
        }

        const emailData = {
          title: `Reservation Reminder - ${reminder.reminderType}`,
          userType: 'customer',
          isReminder: true,
          reminderType: reminder.reminderType,
          status: reservationDetails.status,
          name: reservationDetails.user.name,
          email: reservationDetails.user.email,
          phone: reservationDetails.user.phone,
          date: reservationDetails.reservation_date.toISOString().split('T')[0],
          time: this.formatTime(reservationDetails.reservation_date),
          duration: '2 hours',
          quantity: reservationDetails.guestQuantity,
          tourTitle: reservationDetails.tour.name,
          description: reminder.reminderType,
          totals: [
            {
              label: 'Total',
              amount: `$${reservationDetails.total_price.toFixed(2)}`,
            },
            {
              label: 'Paid',
              amount: `$${reservationDetails.total_price.toFixed(2)}`,
            },
          ],
          reservationImageUrl: reservationDetails.tour.imageUrl,
          dashboardUrl: 'https://dashboard',
        };

        await this.mailService.sendReservationEmail(
          reservationDetails.user.email,
          emailData,
        );
        await this.prisma.email_Reminder.update({
          where: { id: reminder.id },
          data: { sent: true },
        });

        this.logger.log(
          `Reminder sent for reservation ${reminder.reservationId} (${reminder.reminderType})`,
        );
      } catch (error) {
        this.logger.error(
          `Error sending reminder for reservation ${reminder.reservationId}: ${error.message}`,
        );
      }
    }
  }

  private async getReservationDetails(reservationId: string) {
    return this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        user: true,
        tour: true,
        reservationAddons: {
          include: {
            addon: true,
          },
        },
      },
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
}

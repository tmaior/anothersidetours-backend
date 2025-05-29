import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { MailService } from './mail.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { formatInTimeZone, } from 'date-fns-tz';

interface Tenant {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  stripeAccountId?: string;
  timezone?: string;
}

@Injectable()
export class EmailReminderService implements OnModuleInit {
  private readonly logger = new Logger(EmailReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit() {
    this.logger.log(
      'EmailReminderService initialized! Reminders will respect tenant timezones.',
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
      include: {
        tenant: true,
      },
    });

    if (!reservation) {
      throw new Error('Reservation not found.');
    }

    const tenant = reservation.tenant as unknown as Tenant;
    const tenantTimezone = tenant.timezone || 'America/Los_Angeles';

    const reservationDate = reservation.reservation_date;

    const reminderTimes = [
      {
        reservationId,
        reminderType: '24h',
        scheduledAt: this.calculateReminderTime(reservationDate, 24),
        sent: false,
      },
      {
        reservationId,
        reminderType: '12h',
        scheduledAt: this.calculateReminderTime(reservationDate, 12),
        sent: false,
      },
      {
        reservationId,
        reminderType: '6h',
        scheduledAt: this.calculateReminderTime(reservationDate, 6),
        sent: false,
      },
    ];

    this.logger.log(
      `Creating reminders for reservation ${reservationId} in timezone ${tenantTimezone}`,
    );

    return this.prisma.email_Reminder.createMany({ data: reminderTimes });
  }

  private calculateReminderTime(
    reservationDate: Date,
    hoursBeforeEvent: number,
  ): Date {
    const reminderDate = new Date(reservationDate);
    reminderDate.setHours(reminderDate.getHours() - hoursBeforeEvent);
    
    return reminderDate;
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

    const nowUTC = new Date();

    this.logger.log(
      `Now (UTC): ${nowUTC.toISOString()} -> ${nowUTC.getTime()}`,
    );

    const reminders = await this.prisma.email_Reminder.findMany({
      where: {
        scheduledAt: { lte: nowUTC },
        sent: false,
      },
      include: {
        reservation: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (reminders.length === 0) {
      this.logger.log('No pending reminders found.');
      return;
    }

    this.logger.log(`🔹 Found ${reminders.length} pending reminders.`);

    for (const reminder of reminders) {
      try {
        const tenant = reminder.reservation.tenant as unknown as Tenant;
        const tenantTimezone = tenant.timezone || 'America/Los_Angeles';
        
        const reservationDetails = await this.getReservationDetails(
          reminder.reservationId,
        );

        const scheduledUTC = new Date(reminder.scheduledAt);

        const nowInTenantTz = formatInTimeZone(
          nowUTC,
          tenantTimezone,
          'MM/dd/yyyy hh:mm:ss a'
        );

        const scheduledInTenantTz = formatInTimeZone(
          scheduledUTC,
          tenantTimezone,
          'MM/dd/yyyy hh:mm:ss a'
        );

        const timeDifferenceInMinutes =
          (nowUTC.getTime() - scheduledUTC.getTime()) / (1000 * 60);

        this.logger.log(
          `Now (UTC): ${nowUTC.toISOString()} -> ${nowUTC.getTime()}`,
        );
        this.logger.log(
          `Now in tenant timezone (${tenantTimezone}): ${nowInTenantTz}`,
        );
        this.logger.log(
          `Reminder scheduled (UTC): ${scheduledUTC.toISOString()} -> ${scheduledUTC.getTime()}`,
        );
        this.logger.log(
          `Reminder scheduled in tenant timezone (${tenantTimezone}): ${scheduledInTenantTz}`,
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
            `Reminder for reservation ${reminder.reservationId} is too old (${timeDifferenceInMinutes.toFixed(2)} minutes). Marking as sent.`,
          );
          await this.prisma.email_Reminder.update({
            where: { id: reminder.id },
            data: { sent: true },
          });
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
          `Reminder sent for reservation ${reminder.reservationId} (${reminder.reminderType}) in timezone ${tenantTimezone}`,
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
        tenant: true,
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

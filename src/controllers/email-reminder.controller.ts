import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EmailReminderService } from '../services/email-reminder.service';

@Controller('email-reminders')
export class EmailReminderController {
  constructor(private readonly emailReminderService: EmailReminderService) {}

  @Get(':reservationId')
  async getRemindersByReservation(
    @Param('reservationId') reservationId: string,
  ) {
    return this.emailReminderService.getRemindersByReservation(reservationId);
  }

  @Post('trigger-reminders')
  async triggerReminders() {
    await this.emailReminderService.checkAndSendReminders();
    return 'Reminders processed manually.';
  }

  @Post()
  async createReminder(@Body() data: { reservationId: string }) {
    return this.emailReminderService.createRemindersForReservation(
      data.reservationId,
    );
  }
}

import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Post('send')
  async sendSmsNotification(
    @Body('to') to: string,
    @Body('message') message: string,
  ) {
    return this.notificationService.sendSmsNotification(to, message);
  }

  @Get('sms/:notificationId')
  async getSmsNotificationStatus(@Param('notificationId') notificationId: string) {
    return this.notificationService.getSmsNotificationStatus(notificationId);
  }
}
import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from '../services/mail.service';

interface EmailRequest {
  toEmail: string;
  emailData: {
    status: 'approved' | 'declined' | 'pending';
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    duration: string;
    quantity:number;
    reason?: string;
    totals: { label: string; amount: string }[];
  };
}

@Controller('mail')
export class MailController {
  constructor(private mailService: MailService) {}

  @Post('send')
  async sendEmail(
    @Body('to') to: string,
    @Body('subject') subject: string,
    @Body('text') text: string,
    @Body('html') html: string,
    @Body('from') from?: string,
  ) {
    return this.mailService.sendEmail(to, subject, text, html, from);
  }

  @Post('send-reservation-email')
  async sendReservationEmail(@Body() emailRequest: EmailRequest) {
    const { toEmail, emailData } = emailRequest;
    return await this.mailService.sendReservationEmail(toEmail, emailData);
  }
}

import { Body, Controller, Post } from '@nestjs/common';
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
    quantity: number;
    reason?: string;
    totals: { label: string; amount: string }[];
  };
}

interface InvoiceEmailRequest {
  toEmail: string;
  emailData: {
    title: string;
    date: string;
    time: string;
    duration: string;
    name: string;
    email: string;
    phone: string;
    tourTitle: string;
    reservationImageUrl: string;
    quantity: number;
    description: string;
    totals: { label: string; amount: string }[];
    addons?: { label: string; amount: string }[];
    amountDue: string;
    dueDate: string;
    status: string;
    reservationCode: string;
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
    return this.mailService.sendEmail(to, subject, html, from);
  }

  @Post('send-reservation-email')
  async sendReservationEmail(@Body() emailRequest: EmailRequest) {
    const { toEmail, emailData } = emailRequest;
    return await this.mailService.sendReservationEmail(toEmail, emailData);
  }

  @Post('send-invoice-email')
  async sendInvoiceEmail(@Body() emailRequest: InvoiceEmailRequest) {
    const { toEmail, emailData } = emailRequest;
    return await this.mailService.sendInvoiceEmail(toEmail, emailData);
  }
}

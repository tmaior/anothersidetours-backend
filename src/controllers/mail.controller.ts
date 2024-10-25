import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from '../services/mail.service';

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
}

import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendEmail(to: string, subject: string, text: string, html: string, from?: string) {
    const msg = {
      to,
      from: from || process.env.SENDGRID_FROM_EMAIL,
      subject,
      text,
      html,
    };

    try {
      const response = await sgMail.send(msg);
      console.log(response[0].statusCode);
      console.log(response[0].headers);
      return response[0];
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

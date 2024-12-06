import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import * as ejs from 'ejs';
import { join } from 'path';
import { addMinutes, format, parse } from 'date-fns';


interface EmailData {
  status: 'approved' | 'declined' | 'pending';
  time: string;
  duration: string;
  date: string;
  totals: { label: string; amount: string }[];
  name: string;
  email: string;
  phone: string;
  quantity: number;
  reason?: string;
}

@Injectable()
export class MailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendReservationEmail(toEmail: string, emailData: EmailData) {
    const parsedDate = parse(emailData.date, 'yyyy-MM-dd', new Date());
    const formattedDate = format(parsedDate, 'EEEE dd MMM, yyyy');

    const [hours, minutes] = emailData.duration.split(' ')[0].split(':').map(Number);
    const parsedTime = parse(emailData.time, 'hh:mm a', new Date());
    const endTime = format(addMinutes(parsedTime, hours * 60 + (minutes || 0)), 'hh:mm a');

    const updatedEmailData = {
      ...emailData,
      formattedDate,
      endTime,
    };

    const templatePath = join(__dirname, '..', 'templates', 'email-admin-template.ejs');
    const emailHtml = await ejs.renderFile(templatePath, updatedEmailData);

    const msg = {
      to: toEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `Reservation Status: ${emailData.status}`,
      html: emailHtml,
    };

    try {
      await sgMail.send(msg);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
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

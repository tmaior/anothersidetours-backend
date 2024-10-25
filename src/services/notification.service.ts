import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class NotificationService {
  private twilioClient: Twilio;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioClient = new Twilio(accountSid, authToken);
  }

  async sendSmsNotification(to: string, message: string) {
    try {
      const response = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to,
      });
      return {
        success: true,
        message: 'SMS enviado com sucesso!',
        sid: response.sid,
      };
    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      return {
        success: false,
        message: 'Falha ao enviar SMS',
        error: error.message,
      };
    }
  }

  async getSmsNotificationStatus(notificationId: string) {
    try {
      const message = await this.twilioClient.messages(notificationId).fetch();
      return {
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        dateSent: message.dateSent,
      };
    } catch (error) {
      console.error(error);
      throw new Error(`Error fetching SMS notification status: ${error.message}`);
    }
  }
}

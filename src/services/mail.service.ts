import { Injectable } from '@nestjs/common';
import * as Mailjet from 'node-mailjet';
import { addHours, format, parse, parseISO } from 'date-fns';

@Injectable()
export class MailService {
  private mailjetClient: Mailjet.Client;

  constructor() {
    this.mailjetClient = new Mailjet.Client({
      apiKey: process.env.MAILJET_API_KEY as string,
      apiSecret: process.env.MAILJET_API_SECRET as string,
    });
  }

  private formatDate(dateString: string): string {
    try {
      if (!dateString) {
        return format(new Date(), 'EEEE • dd MMM, yyyy');
      }
      const date = parseISO(dateString);
      return format(date, 'EEEE • dd MMM, yyyy');
    } catch (error) {
      console.warn(`Error formatting date: ${dateString}`, error);
      return format(new Date(), 'EEEE • dd MMM, yyyy');
    }
  }

  private addDurationToTime(time: string, duration: string): string {
    try {
      if (!time) time = '12:00 PM';
      const timeDate = parse(time, 'hh:mm a', new Date());
      const hoursToAdd = parseInt(duration, 10) || 2;
      const newTimeDate = addHours(timeDate, hoursToAdd);
      return format(newTimeDate, 'hh:mm a');
    } catch (error) {
      console.warn(`Error processing time: ${time} with duration: ${duration}`, error);
      return '02:00 PM';
    }
  }

  private formatDateReservation(dateString: string): string {
    try {
      if (!dateString) {
        return format(new Date(), 'EEE dd MMM, yyyy');
      }
      const date = parseISO(dateString);
      return format(date, 'EEE dd MMM, yyyy');
    } catch (error) {
      console.warn(`Error formatting reservation date: ${dateString}`, error);
      return format(new Date(), 'EEE dd MMM, yyyy');
    }
  }

  async sendEmail(to: string, subject: string, html: string, from?: string) {
    const msg = {
      Messages: [
        {
          From: {
            Email: from || process.env.MAILJET_FROM_EMAIL,
            Name: process.env.COMPANY_NAME,
          },
          To: [{ Email: to }],
          Subject: subject,
          HTMLPart: html,
        },
      ],
    };

    try {
      const response = await this.mailjetClient
        .post('send', { version: 'v3.1' })
        .request(msg);
      console.log('Email sent successfully:', response.body);
      return response.body;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendReservationEmail(toEmail: string, emailData: any) {
    const formattedDate = this.formatDate(emailData.date);

    const endTime = this.addDurationToTime(emailData.time, emailData.duration);

    const formatDateReservation = this.formatDateReservation(emailData.date);

    let htmlContent: string;

    if (emailData.userType === 'admin') {
      htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; display: flex; justify-content: center; padding: 20px; background-color: #f3f3f3;">
      <div style="width: 600px; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/logo.png" alt="Logo" style="width: 350px; height: auto;">
        </div>

<!--        <div style="text-align: center; font-size: 18px; font-weight: bold;">${emailData.status}</div>-->
        <div style="text-align: center; font-size: 16px; margin: 5px 0;">${emailData.description}</div>

        <div style="text-align: center; margin: 20px 0;">
          ${
            emailData.status === 'approved'
              ? `
            <span style="background-color: green; color: black; font-weight: bold; padding: 10px 20px; border-radius: 5px;">
              ✓ Approved
            </span>
          `
              : emailData.status === 'declined'
                ? `
            <span style="background-color: red; color: black; font-weight: bold; padding: 10px 20px; border-radius: 5px;">
              ✕ Declined
            </span>
          `
                : `
            <span style="background-color: orange; color: black; font-weight: bold; padding: 10px 20px; border-radius: 5px;">
              ⏸ Pending
            </span>
          `
          }
        </div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <table role="presentation" style="width: 100%; padding: 0 20px; border-collapse: collapse;">
          <tr>
            <td style="font-weight: bold; text-align: left; width: 50%; padding-right: 10px;">
              ${formattedDate}
            </td>
            <td style="text-align: right; width: 50%; padding-left: 10px;">
              <div style="font-weight: bold;">Starts: ${emailData.time}</div>
              <div>Duration: ${emailData.duration}, Ends: ${endTime}</div>
            </td>
          </tr>
        </table>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <div style="display: flex; justify-content: space-between; padding: 0 20px;">
          <div style="width: 45%;">
            <div style="font-weight: bold; margin-bottom: 8px;">Contact Information</div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/user.png" alt="Pessoa" style="width: 15px; height: 15px; margin-right: 8px;">
              <span>${emailData.name}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/envelope.png" alt="Email" style="width: 15px; height: 15px; margin-right: 8px;">
              <span>${emailData.email}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/phone.png" alt="Telefone" style="width: 17px; height: 17px; margin-right: 8px; margin-left: 2px;">
              <span>${emailData.phone}</span>
            </div>
          </div>

          <div style="width: 45%; text-align: right;">
            <div style="font-weight: bold; margin-bottom: 8px;">Payment Summary</div>
            <table style="width: 100%; text-align: right; border-collapse: collapse;">
              ${emailData.totals
                .map(
                  (total) => `
                <tr>
                  <td style="text-align: left; padding: 5px 0;">${total.label}</td>
                  <td style="padding: 5px 0;">${total.amount}</td>
                </tr>
              `,
                )
                .join('')}
            </table>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <div style="display: flex; padding: 0 20px;">
          <div style="flex: 1; text-align: left;">
            <img src="${emailData.reservationImageUrl}" alt="Reservation Image" style="width: 100px; height: auto;">
          </div>
          <div style="flex: 2; text-align: left;">
            <div style="font-weight: bold; margin-bottom: 5px;">${emailData.tourTitle}</div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/calendar-blank.png" alt="Calendário" style="width: 22px; height: 22px; margin-right: 8px;">
              <span>${formatDateReservation}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/clock.png" alt="Relógio" style="width: 16px; height: 16px; margin-right: 8px; margin-left: 3px;">
              <span>${emailData.time}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/user.png" alt="Pessoa" style="width: 22px; height: 22px; margin-right: 8px;">
              <span>guests : ${emailData.quantity}</span>
            </div>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />
        <div style="text-align: center; margin: 20px 0;">
          <a href="${emailData.dashboardUrl}" style="text-decoration: none;">
            <button style="background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
              Dashboard
            </button>
          </a>
        </div>
      </div>
    </div>
  `;
    } else {
      htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; display: flex; justify-content: center; padding: 20px; background-color: #f3f3f3;">
      <div style="width: 600px; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/logo.png" alt="Logo" style="width: 350px; height: auto;">
        </div>

<!--        <div style="text-align: center; font-size: 18px; font-weight: bold;">${emailData.status}</div>-->
        <div style="text-align: center; font-size: 16px; margin: 5px 0;">
  ${
    emailData.isReminder
      ? `Reminder: Your reservation is in ${emailData.reminderType}`
      : emailData.description
  }
</div>

${
  !emailData.isReminder
    ? `
        <div style="text-align: center; margin: 20px 0;">
          ${
            emailData.status === 'approved'
              ? `<span style="background-color: green; color: black; font-weight: bold; padding: 10px 20px; border-radius: 5px;">
                ✓ Approved
              </span>`
              : emailData.status === 'declined'
                ? `<span style="background-color: red; color: black; font-weight: bold; padding: 10px 20px; border-radius: 5px;">
                  ✕ Declined
                </span>`
                : `<span style="background-color: orange; color: black; font-weight: bold; padding: 10px 20px; border-radius: 5px;">
                  ⏸ Pending
                </span>`
          }
        </div>
      `
    : ''
}

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <table role="presentation" style="width: 100%; padding: 0 20px; border-collapse: collapse;">
          <tr>
            <td style="font-weight: bold; text-align: left; width: 50%; padding-right: 10px;">
              ${formattedDate}
            </td>
            <td style="text-align: right; width: 50%; padding-left: 10px;">
              <div style="font-weight: bold;">Starts: ${emailData.time}</div>
              <div>Duration: ${emailData.duration}, Ends: ${endTime}</div>
            </td>
          </tr>
        </table>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <div style="display: flex; justify-content: space-between; padding: 0 20px;">
          <div style="width: 45%;">
            <div style="font-weight: bold; margin-bottom: 8px;">Contact Information</div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/user.png" alt="Pessoa" style="width: 15px; height: 15px; margin-right: 8px;">
              <span>${emailData.name}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/envelope.png" alt="Email" style="width: 15px; height: 15px; margin-right: 8px;">
              <span>${emailData.email}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/phone.png" alt="Telefone" style="width: 17px; height: 17px; margin-right: 8px; margin-left: 2px;">
              <span>${emailData.phone}</span>
            </div>
          </div>

          <div style="width: 45%; text-align: right;">
            <div style="font-weight: bold; margin-bottom: 8px;">Payment Summary</div>
            <table style="width: 100%; text-align: right; border-collapse: collapse;">
              ${emailData.totals
                .map(
                  (total) => `
                <tr>
                  <td style="text-align: left; padding: 5px 0;">${total.label}</td>
                  <td style="padding: 5px 0;">${total.amount}</td>
                </tr>
              `,
                )
                .join('')}
            </table>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <div style="display: flex; padding: 0 20px;">
          <div style="flex: 1; text-align: left;">
            <img src="${emailData.reservationImageUrl}" alt="Reservation Image" style="width: 100px; height: auto;">
          </div>
          <div style="flex: 2; text-align: left;">
            <div style="font-weight: bold; margin-bottom: 5px;">${emailData.tourTitle}</div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/calendar-blank.png" alt="Calendário" style="width: 22px; height: 22px; margin-right: 8px;">
              <span>${formatDateReservation}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/clock.png" alt="Relógio" style="width: 16px; height: 16px; margin-right: 8px; margin-left: 3px;">
              <span>${emailData.time}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/user.png" alt="Pessoa" style="width: 22px; height: 22px; margin-right: 8px;">
              <span>guests : ${emailData.quantity}</span>
            </div>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />
      </div>
    </div>
  `;
    }

    await this.sendEmail(
      toEmail,
      emailData.title,
      htmlContent,
      process.env.MAILJET_FROM_EMAIL,
    );
  }

  async sendGuideReservationEmail(toEmail: string, emailData: any) {
    const formattedDate = this.formatDate(emailData.date);

    const endTime = this.addDurationToTime(emailData.time, emailData.duration);

    const formatDateReservation = this.formatDateReservation(emailData.date);

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; display: flex; justify-content: center; padding: 20px; background-color: #f3f3f3;">
      <div style="width: 600px; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/logo.png" alt="Logo" style="width: 350px; height: auto;">
        </div>

        <div style="text-align: center; font-size: 16px; margin: 5px 0;">${emailData.description}</div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <table role="presentation" style="width: 100%; padding: 0 20px; border-collapse: collapse;">
          <tr>
            <td style="font-weight: bold; text-align: left; width: 50%; padding-right: 10px;">
              ${formattedDate}
            </td>
            <td style="text-align: right; width: 50%; padding-left: 10px;">
              <div style="font-weight: bold;">Starts: ${emailData.time}</div>
              <div>Duration: ${emailData.duration}, Ends: ${endTime}</div>
            </td>
          </tr>
        </table>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <div style="display: flex; justify-content: space-between; padding: 0 20px;">
          <div style="width: 45%;">
            <div style="font-weight: bold; margin-bottom: 8px;">Contact Information</div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/user.png" alt="Pessoa" style="width: 15px; height: 15px; margin-right: 8px;">
              <span>${emailData.name}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/envelope.png" alt="Email" style="width: 15px; height: 15px; margin-right: 8px;">
              <span>${emailData.email}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/phone.png" alt="Telefone" style="width: 17px; height: 17px; margin-right: 8px; margin-left: 2px;">
              <span>${emailData.phone}</span>
            </div>
          </div>

          <div style="width: 45%; text-align: right;">
            <div style="font-weight: bold; margin-bottom: 8px;">Payment Summary</div>
            <table style="width: 100%; text-align: right; border-collapse: collapse;">
            ${emailData.addons}
              ${emailData.totals
                .map(
                  (total) => `
                <tr>
                  <td style="text-align: left; padding: 5px 0;">${total.label}</td>
                  <td style="padding: 5px 0;">${total.amount}</td>
                </tr>
              `,
                )
                .join('')}
            </table>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <div style="display: flex; padding: 0 20px;">
          <div style="flex: 1; text-align: left;">
            <img src="${emailData.reservationImageUrl}" alt="Reservation Image" style="width: 100px; height: auto;">
          </div>
          <div style="flex: 2; text-align: left;">
            <div style="font-weight: bold; margin-bottom: 5px;">${emailData.tourTitle}</div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/calendar-blank.png" alt="Calendário" style="width: 22px; height: 22px; margin-right: 8px;">
              <span>${formatDateReservation}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/clock.png" alt="Relógio" style="width: 16px; height: 16px; margin-right: 8px; margin-left: 3px;">
              <span>${emailData.time}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/user.png" alt="Pessoa" style="width: 22px; height: 22px; margin-right: 8px;">
              <span>guests : ${emailData.quantity}</span>
            </div>
          </div>
        </div>
        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />
      </div>
    </div>
  `;

    await this.sendEmail(
      toEmail,
      emailData.title,
      htmlContent,
      process.env.MAILJET_FROM_EMAIL,
    );
  }

  async sendReservationCancelEmail(toEmail: string, emailData: any) {
    const formattedDate = this.formatDate(emailData.date);

    const endTime = this.addDurationToTime(emailData.time, emailData.duration);

    const formatDateReservation = this.formatDateReservation(emailData.date);

    const htmlContent = `
   <div style="font-family: Arial, sans-serif; color: #333; display: flex; justify-content: center; padding: 20px; background-color: #f3f3f3;">
      <div style="width: 600px; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/logo.png" alt="Logo" style="width: 350px; height: auto;">
        </div>

        <div style="text-align: center; font-size: 16px; margin: 5px 0;">${emailData.description}</div>
        
        <div style="text-align: center; margin: 20px 0;">
        <span style="background-color: red; color: black; font-weight: bold; padding: 10px 20px; border-radius: 5px;">
                  ✕ Cancelled
        </span>  
        </div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <table role="presentation" style="width: 100%; padding: 0 20px; border-collapse: collapse;">
          <tr>
            <td style="font-weight: bold; text-align: left; width: 50%; padding-right: 10px;">
              ${formattedDate}
            </td>
            <td style="text-align: right; width: 50%; padding-left: 10px;">
              <div style="font-weight: bold;">Starts: ${emailData.time}</div>
              <div>Duration: ${emailData.duration}, Ends: ${endTime}</div>
            </td>
          </tr>
        </table>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <div style="display: flex; justify-content: space-between; padding: 0 20px;">
          <div style="width: 45%;">
            <div style="font-weight: bold; margin-bottom: 8px;">Contact Information</div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/user.png" alt="Pessoa" style="width: 15px; height: 15px; margin-right: 8px;">
              <span>${emailData.name}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/envelope.png" alt="Email" style="width: 15px; height: 15px; margin-right: 8px;">
              <span>${emailData.email}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/phone.png" alt="Telefone" style="width: 17px; height: 17px; margin-right: 8px; margin-left: 2px;">
              <span>${emailData.phone}</span>
            </div>
          </div>

          <div style="width: 45%; text-align: right;">
            <div style="font-weight: bold; margin-bottom: 8px;">Payment Summary</div>

            <table style="width: 100%; text-align: right; border-collapse: collapse;">
  ${emailData.addons
      .map(
        (item) => `
        <tr>
          <td style="text-align: left; padding: 5px 0;">${item.label}</td>
          <td style="padding: 5px 0;">${item.amount}</td>
        </tr>
      `
      )
      .join('')}
  ${emailData.totals
      .map(
        (total) => `
        <tr>
          <td style="text-align: left; padding: 5px 0;">${total.label}</td>
          <td style="padding: 5px 0;">${total.amount}</td>
        </tr>
      `
      )
      .join('')}
</table>


          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <div style="display: flex; padding: 0 20px;">
          <div style="flex: 1; text-align: left;">
            <img src="${emailData.reservationImageUrl}" alt="Reservation Image" style="width: 100px; height: auto;">
          </div>
          <div style="flex: 2; text-align: left;">
            <div style="font-weight: bold; margin-bottom: 5px;">${emailData.tourTitle}</div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/calendar-blank.png" alt="Calendário" style="width: 22px; height: 22px; margin-right: 8px;">
              <span>${formatDateReservation}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/clock.png" alt="Relógio" style="width: 16px; height: 16px; margin-right: 8px; margin-left: 3px;">
              <span>${emailData.time}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/user.png" alt="Pessoa" style="width: 22px; height: 22px; margin-right: 8px;">
              <span>guests : ${emailData.quantity}</span>
            </div>
          </div>
        </div>
        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />
      </div>
    </div>
  `;

    await this.sendEmail(
      toEmail,
      emailData.title,
      htmlContent,
      process.env.MAILJET_FROM_EMAIL,
    );
  }


  async sendRecoverClientBookingEmail(toEmail: string, emailData: any) {
    const formattedDate = this.formatDate(emailData.date);

    const endTime = this.addDurationToTime(emailData.time, emailData.duration);

    const formatDateReservation = this.formatDateReservation(emailData.date);

    const htmlContent = `
   <div style="font-family: Arial, sans-serif; color: #333; display: flex; justify-content: center; padding: 20px; background-color: #f3f3f3;">
      <div style="width: 600px; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/logo.png" alt="Logo" style="width: 350px; height: auto;">
        </div>

        <div style="text-align: center; font-size: 16px; margin: 5px 0;">${emailData.description}</div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <table role="presentation" style="width: 100%; padding: 0 20px; border-collapse: collapse;">
          <tr>
            <td style="font-weight: bold; text-align: left; width: 50%; padding-right: 10px;">
              ${formattedDate}
            </td>
            <td style="text-align: right; width: 50%; padding-left: 10px;">
              <div style="font-weight: bold;">Starts: ${emailData.time}</div>
              <div>Duration: ${emailData.duration}, Ends: ${endTime}</div>
            </td>
          </tr>
        </table>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <div style="display: flex; justify-content: space-between; padding: 0 20px;">
          <div style="width: 45%;">
            <div style="font-weight: bold; margin-bottom: 8px;">Contact Information</div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/user.png" alt="Pessoa" style="width: 15px; height: 15px; margin-right: 8px;">
              <span>${emailData.name}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/envelope.png" alt="Email" style="width: 15px; height: 15px; margin-right: 8px;">
              <span>${emailData.email}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/phone.png" alt="Telefone" style="width: 17px; height: 17px; margin-right: 8px; margin-left: 2px;">
              <span>${emailData.phone}</span>
            </div>
          </div>

          <div style="width: 45%; text-align: right;">
            <div style="font-weight: bold; margin-bottom: 8px;">Payment Summary</div>
            <table style="width: 100%; text-align: right; border-collapse: collapse;">
              ${emailData.totals
      .map(
        (total) => `
                <tr>
                  <td style="text-align: left; padding: 5px 0;">${total.label}</td>
                  <td style="padding: 5px 0;">${total.amount}</td>
                </tr>
              `,
      )
      .join('')}
            </table>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <div style="display: flex; padding: 0 20px;">
          <div style="flex: 1; text-align: left;">
            <img src="${emailData.reservationImageUrl}" alt="Reservation Image" style="width: 100px; height: auto;">
          </div>
          <div style="flex: 2; text-align: left;">
            <div style="font-weight: bold; margin-bottom: 5px;">${emailData.tourTitle}</div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/calendar-blank.png" alt="Calendário" style="width: 22px; height: 22px; margin-right: 8px;">
              <span>${formatDateReservation}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/clock.png" alt="Relógio" style="width: 16px; height: 16px; margin-right: 8px; margin-left: 3px;">
              <span>${emailData.time}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/user.png" alt="Pessoa" style="width: 22px; height: 22px; margin-right: 8px;">
              <span>guests : ${emailData.quantity}</span>
            </div>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />
        <div style="text-align: center; margin: 20px 0;">
          <a href="${
      process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_API_URL
    }/payment-success?reservation=${emailData.reservationIncompleteId}">
            <button style="background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
              Continue Booking
            </button>
          </a>
        </div>
      </div>
    </div>
  `;

    await this.sendEmail(
      toEmail,
      emailData.title,
      htmlContent,
      process.env.MAILJET_FROM_EMAIL,
    );
  }


  async sendMessageClientEmail(toEmail: string, emailData: any) {
    const formattedDate = this.formatDate(emailData.date);

    const endTime = this.addDurationToTime(emailData.time, emailData.duration);

    const formatDateReservation = this.formatDateReservation(emailData.date);

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; display: flex; justify-content: center; padding: 20px; background-color: #f3f3f3;">
      <div style="width: 600px; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/logo.png" alt="Logo" style="width: 350px; height: auto;">
        </div>

        <div style="text-align: center; font-size: 16px; margin: 5px 0;">${emailData.description}</div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <table role="presentation" style="width: 100%; padding: 0 20px; border-collapse: collapse;">
          <tr>
            <td style="font-weight: bold; text-align: left; width: 50%; padding-right: 10px;">
              ${formattedDate}
            </td>
            <td style="text-align: right; width: 50%; padding-left: 10px;">
              <div style="font-weight: bold;">Starts: ${emailData.time}</div>
              <div>Duration: ${emailData.duration}, Ends: ${endTime}</div>
            </td>
          </tr>
        </table>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <div style="display: flex; justify-content: space-between; padding: 0 20px;">
          <div style="width: 45%;">
            <div style="font-weight: bold; margin-bottom: 8px;">Contact Information</div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/user.png" alt="Pessoa" style="width: 15px; height: 15px; margin-right: 8px;">
              <span>${emailData.name}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/envelope.png" alt="Email" style="width: 15px; height: 15px; margin-right: 8px;">
              <span>${emailData.email}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/phone.png" alt="Telefone" style="width: 17px; height: 17px; margin-right: 8px; margin-left: 2px;">
              <span>${emailData.phone}</span>
            </div>
          </div>

          <div style="width: 45%; text-align: right;">
            <div style="font-weight: bold; margin-bottom: 8px;">Payment Summary</div>
            <table style="width: 100%; text-align: right; border-collapse: collapse;">
            ${emailData.addons}
              ${emailData.totals
      .map(
        (total) => `
                <tr>
                  <td style="text-align: left; padding: 5px 0;">${total.label}</td>
                  <td style="padding: 5px 0;">${total.amount}</td>
                </tr>
              `,
      )
      .join('')}
            </table>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />

        <div style="display: flex; padding: 0 20px;">
          <div style="flex: 1; text-align: left;">
            <img src="${emailData.reservationImageUrl}" alt="Reservation Image" style="width: 100px; height: auto;">
          </div>
          <div style="flex: 2; text-align: left;">
            <div style="font-weight: bold; margin-bottom: 5px;">${emailData.tourTitle}</div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/calendar-blank.png" alt="Calendário" style="width: 22px; height: 22px; margin-right: 8px;">
              <span>${formatDateReservation}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/clock.png" alt="Relógio" style="width: 16px; height: 16px; margin-right: 8px; margin-left: 3px;">
              <span>${emailData.time}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/user.png" alt="Pessoa" style="width: 22px; height: 22px; margin-right: 8px;">
              <span>guests : ${emailData.quantity}</span>
            </div>
          </div>
        </div>
        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />
      </div>
    </div>
  `;

    await this.sendEmail(
      toEmail,
      emailData.title,
      htmlContent,
      process.env.MAILJET_FROM_EMAIL,
    );
  }

  async sendInvoiceEmail(toEmail: string, emailData: any) {
    const formattedDate = this.formatDate(emailData.date);
    const endTime = this.addDurationToTime(emailData.time, emailData.duration);
    const formatDateReservation = this.formatDateReservation(emailData.date);

    const checkoutLink = `${process.env.FRONTEND_URL_INVOICE || process.env.FRONTEND_URL_INVOICE}/invoicepayment/${emailData.reservationId}`;

    const htmlContent = `
    <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Invoice Details</title>
    <style>
      .center-button {
        display: flex;
        justify-content: center;
        margin-top: 20px;
      }
      .pay-button {
        background-color: #28a745;
        color: #fff;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        text-decoration: none;
        display: inline-block;
      }
      .center-text {
        text-align: center;
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f3f3f3; font-family: Arial, sans-serif;">
    <div style="width: 100%; background-color: #f3f3f3; padding: 20px; display: flex; justify-content: center;">
      <div style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); padding: 20px;">

        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://another-images.s3.us-east-1.amazonaws.com/tours/logo.png" alt="Logo" style="width: 350px; height: auto;">
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 20px; font-weight: bold; color: #333;">Invoice Details</div>
          <div style="font-size: 14px; color: #555;">${emailData.amountDue} due on ${emailData.dueDate}</div>
        </div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin-bottom: 20px;">

        <div style="margin-bottom: 20px;">
          <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
            <img
              src="${emailData.reservationImageUrl}"
              alt="${emailData.tourTitle}"
              style="width: 80px; height: auto; margin-right: 10px;"
            />
            <div>
              <div style="font-weight: bold; color: #333; margin-bottom: 5px;">${emailData.tourTitle}</div>
              <div style="font-size: 14px; color: #555;">${formatDateReservation}</div>
              <div style="font-size: 14px; color: #555;">${emailData.time}</div>
              <div style="font-size: 14px; color: #555;">${emailData.quantity} Guests</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <div>
              <strong>Due Date:</strong> ${emailData.dueDate}
            </div>
            <div>
              <strong>Amount Due:</strong> ${emailData.amountDue}
            </div>
          </div>

          <div class="center-text" style="color: #555;">
            ${emailData.description || 'We will send a confirmation once payment is made.'}
          </div>
        </div>

        <div class="center-button">
          <a href="${process.env.FRONTEND_URL_INVOICE ||process.env.FRONTEND_URL_INVOICE}/invoicepayment/${emailData.reservationId}" class="pay-button" style="color: #fff; text-decoration: none;">
            Pay Invoice
          </a>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-size: 14px; color: #333; margin-top: 20px;">
          <div>
            <strong>${formattedDate}</strong>
          </div>
          <div style="text-align: right;">
            Starts: ${emailData.time}&nbsp;|&nbsp;Ends: ${endTime}
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #ccc; margin-bottom: 20px;">

        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div style="width: 45%;">
            <div style="font-weight: bold; color: #333; margin-bottom: 8px;">Purchase Confirmation</div>
            <div style="font-size: 14px; margin-bottom: 20px; color: #555;">
              Confirmation Code ${emailData.reservationCode}
            </div>

            <div style="font-weight: bold; color: #333; margin-bottom: 8px;">Contact Information</div>
            <div style="font-size: 14px; color: #555; margin-bottom: 4px;">${emailData.name}</div>
            <div style="font-size: 14px; color: #555; margin-bottom: 4px;">${emailData.email}</div>
            <div style="font-size: 14px; color: #555;">${emailData.phone}</div>
          </div>

          <div style="width: 45%;">
            <div style="font-weight: bold; color: #333; margin-bottom: 8px; text-align: right;">Payment Summary</div>
            ${emailData.totals.map(total => `
            <div style="display: flex; justify-content: space-between; font-size: 14px; color: #555; margin-bottom: 4px;">
              <span>${total.label}</span>
              <span>${total.amount}</span>
            </div>
            `).join('')}
            <div style="font-size: 16px; color: red; margin-top: 10px; text-align: right;">
              Total Pending
              <span style="margin-left: 10px;">${emailData.amountDue}</span>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; font-size: 12px; color: #999; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
          This invoice was sent by ${emailData.tenantName || 'Another Side Tours'} for reservation #${emailData.reservationCode}
        </div>
      </div>
    </div>
  </body>
</html>
  `;
    await this.sendEmail(
      toEmail,
      emailData.title,
      htmlContent,
      process.env.MAILJET_FROM_EMAIL,
    );
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private SCOPES = ['https://www.googleapis.com/auth/calendar'];

  constructor(private prisma: PrismaService) {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async getAuthUrl(): Promise<string> {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
      prompt: 'consent',
    });
  }

  async handleAuthCallback(code: string, userId: string): Promise<void> {
    const { tokens } = await this.oauth2Client.getToken(code);

    await this.prisma.googleCalendarAuth.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });

    this.oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const existingCalendarData = await this.prisma.googleCalendarData.findUnique({
      where: { userId },
    });

    if (!existingCalendarData) {
      const newCalendar = await calendar.calendars.insert({
        requestBody: {
          summary: 'Anotherside Tours Reservations',
          description: 'All your tour reservations synced from Anotherside Tours',
          timeZone: 'UTC',
        },
      });

      if (newCalendar.data.id) {
        await this.prisma.googleCalendarData.create({
          data: {
            userId,
            calendarId: newCalendar.data.id,
          },
        });
      }
    }
  }

  async checkAuthStatus(userId: string): Promise<boolean> {
    const authData = await this.prisma.googleCalendarAuth.findUnique({
      where: { userId },
    });

    return !!authData;
  }

  async syncReservationsToCalendar(userId: string, reservations: any[]): Promise<{ success: boolean; syncedCount: number }> {
    const authData = await this.prisma.googleCalendarAuth.findUnique({
      where: { userId },
    });

    if (!authData) {
      throw new Error('User not authorized with Google Calendar');
    }

    const calendarData = await this.prisma.googleCalendarData.findUnique({
      where: { userId },
    });

    if (!calendarData) {
      throw new Error('No calendar found for this user');
    }

    this.oauth2Client.setCredentials({
      access_token: authData.accessToken,
      refresh_token: authData.refreshToken || undefined,
      expiry_date: authData.expiryDate?.getTime() || undefined,
    });

    this.oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        await this.prisma.googleCalendarAuth.update({
          where: { userId },
          data: {
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token,
            expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          },
        });
      } else if (tokens.access_token) {
        await this.prisma.googleCalendarAuth.update({
          where: { userId },
          data: {
            accessToken: tokens.access_token,
            expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          },
        });
      }
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    let syncedCount = 0;

    for (const reservation of reservations) {
      const existingEvents = await calendar.events.list({
        calendarId: calendarData.calendarId,
        q: `Reservation ID: ${reservation.id}`,
      });

      if (existingEvents.data.items && existingEvents.data.items.length > 0) {
        const eventId = existingEvents.data.items[0].id;
        await calendar.events.update({
          calendarId: calendarData.calendarId,
          eventId: eventId!,
          requestBody: {
            summary: reservation.title,
            description: reservation.description,
            start: {
              dateTime: reservation.startTime,
              timeZone: 'UTC',
            },
            end: {
              dateTime: reservation.endTime,
              timeZone: 'UTC',
            },
          },
        });
      } else {
        await calendar.events.insert({
          calendarId: calendarData.calendarId,
          requestBody: {
            summary: reservation.title,
            description: reservation.description,
            start: {
              dateTime: reservation.startTime,
              timeZone: 'UTC',
            },
            end: {
              dateTime: reservation.endTime,
              timeZone: 'UTC',
            },
          },
        });
      }
      syncedCount++;
    }

    return {
      success: true,
      syncedCount,
    };
  }
} 
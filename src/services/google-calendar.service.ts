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

    if (existingCalendarData) {
      try {
        await calendar.calendars.get({
          calendarId: existingCalendarData.calendarId
        });

        try {
          await calendar.calendarList.get({
            calendarId: existingCalendarData.calendarId
          });
        } catch (error) {
          try {
            await calendar.calendarList.insert({
              requestBody: {
                id: existingCalendarData.calendarId
              }
            });
          } catch (insertError) {
            console.error('Error adding calendar to list:', insertError);
          }
        }
      } catch (error) {
        console.log('Calendar not found, creating a new one during auth callback');
        
        try {
          const newCalendar = await calendar.calendars.insert({
            requestBody: {
              summary: 'Anotherside Tours Reservations',
              description: 'All your tour reservations synced from Anotherside Tours',
              timeZone: 'UTC',
            },
          });

          await this.prisma.googleCalendarData.update({
            where: { userId },
            data: {
              calendarId: newCalendar.data.id,
            },
          });
        } catch (createError) {
          console.error('Error creating new calendar:', createError);
        }
      }
    } else {
      try {
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
      } catch (error) {
        console.error('Error creating calendar during auth:', error);
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

    let calendarId;
    
    if (calendarData) {
      try {
        await calendar.calendars.get({
          calendarId: calendarData.calendarId
        });
        calendarId = calendarData.calendarId;
      } catch (error) {
        const newCalendar = await calendar.calendars.insert({
          requestBody: {
            summary: 'Anotherside Tours Reservations',
            description: 'All your tour reservations synced from Anotherside Tours',
            timeZone: 'UTC',
          },
        });
        
        calendarId = newCalendar.data.id;
        await this.prisma.googleCalendarData.update({
          where: { userId },
          data: {
            calendarId: calendarId,
          },
        });
      }
    } else {
      const newCalendar = await calendar.calendars.insert({
        requestBody: {
          summary: 'Anotherside Tours Reservations',
          description: 'All your tour reservations synced from Anotherside Tours',
          timeZone: 'UTC',
        },
      });
      
      calendarId = newCalendar.data.id;

      await this.prisma.googleCalendarData.create({
        data: {
          userId,
          calendarId: calendarId,
        },
      });
    }

    for (const reservation of reservations) {
      const existingEvents = await calendar.events.list({
        calendarId: calendarId,
        q: `Reservation ID: ${reservation.id}`,
      });

      const eventBody = {
        summary: reservation.title,
        description: `Reservation ID: ${reservation.id}\n${reservation.description}`,
        start: {
          dateTime: reservation.startTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: reservation.endTime,
          timeZone: 'UTC',
        },
      };

      if (existingEvents.data.items && existingEvents.data.items.length > 0) {
        const eventId = existingEvents.data.items[0].id;
        await calendar.events.update({
          calendarId: calendarId,
          eventId: eventId!,
          requestBody: eventBody,
        });
      } else {
        await calendar.events.insert({
          calendarId: calendarId,
          requestBody: eventBody,
        });
      }
      syncedCount++;
    }

    return {
      success: true,
      syncedCount,
    };
  }

  async syncReservationsByTenant(userId: string, reservationsByTenant: Record<string, any[]>): Promise<{ success: boolean; syncedByTenant: Record<string, number> }> {
    const authData = await this.prisma.googleCalendarAuth.findUnique({
      where: { userId },
    });

    if (!authData) {
      throw new Error('User not authorized with Google Calendar');
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
    const syncedByTenant: Record<string, number> = {};

    const tenantCalendars = {};

    for (const [tenantName, reservations] of Object.entries(reservationsByTenant)) {
      if (!reservations || reservations.length === 0) continue;
      
      const calendarName = `Anotherside Tours - ${tenantName}`;

      try {
        const calendarsResponse = await calendar.calendarList.list();

        let tenantCalendarId = null;
        
        if (calendarsResponse.data.items) {
          const tenantCalendar = calendarsResponse.data.items.find(
            cal => cal.summary === calendarName
          );
          
          if (tenantCalendar) {
            tenantCalendarId = tenantCalendar.id;
          }
        }

        if (!tenantCalendarId) {
          try {
            const newCalendar = await calendar.calendars.insert({
              requestBody: {
                summary: calendarName,
                description: `Tour reservations for ${tenantName}`,
                timeZone: 'UTC',
              },
            });
            
            tenantCalendarId = newCalendar.data.id;

            await calendar.calendarList.insert({
              requestBody: {
                id: tenantCalendarId
              }
            });
          } catch (error) {
            console.error(`Error creating calendar for tenant ${tenantName}:`, error);
            continue;
          }
        }
        
        tenantCalendars[tenantName] = tenantCalendarId;
        syncedByTenant[tenantName] = 0;

        for (const reservation of reservations) {
          try {
            const existingEvents = await calendar.events.list({
              calendarId: tenantCalendarId,
              q: `Reservation ID: ${reservation.id}`,
            });
            
            const eventBody = {
              summary: reservation.title,
              description: `Reservation ID: ${reservation.id}\n${reservation.description}`,
              start: {
                dateTime: reservation.startTime,
                timeZone: 'UTC',
              },
              end: {
                dateTime: reservation.endTime,
                timeZone: 'UTC',
              },
              colorId: this.getColorIdForTenant(tenantName),
            };
            
            if (existingEvents.data.items && existingEvents.data.items.length > 0) {
              const eventId = existingEvents.data.items[0].id;
              await calendar.events.update({
                calendarId: tenantCalendarId,
                eventId: eventId!,
                requestBody: eventBody,
              });
            } else {
              await calendar.events.insert({
                calendarId: tenantCalendarId,
                requestBody: eventBody,
              });
            }
            
            syncedByTenant[tenantName]++;
          } catch (error) {
            console.error(`Error syncing reservation ${reservation.id} for tenant ${tenantName}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing tenant ${tenantName}:`, error);
      }
    }
    
    return {
      success: Object.keys(syncedByTenant).length > 0,
      syncedByTenant,
    };
  }
  private getColorIdForTenant(tenantName: string): string {
    const colorIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
    const hash = tenantName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colorIds[hash % colorIds.length];
  }
}
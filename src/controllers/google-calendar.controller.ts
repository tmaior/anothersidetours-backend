import { Controller, Get, Post, Req, Res, Query, Body, Param, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('google-calendar')
@UseGuards(JwtAuthGuard)
export class GoogleCalendarController {
  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  @Get('auth-url')
  async getAuthUrl(@Res() res: Response) {
    try {
      const authUrl = await this.googleCalendarService.getAuthUrl();
      return res.status(200).json({ authUrl });
    } catch (error) {
      console.error('Error generating auth URL:', error);
      return res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  }

  @Get('auth-callback')
  async handleAuthCallback(
    @Query('code') code: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.sub;
      
      if (!code || !userId) {
        return res.status(400).json({ error: 'Missing code or user ID' });
      }

      await this.googleCalendarService.handleAuthCallback(code, userId);

      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/reservation?calendarConnected=true`);
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/reservation?calendarConnected=false&error=true`);
    }
  }

  @Get('auth-status/:userId')
  async checkAuthStatus(
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    try {
      if (!userId) {
        return res.status(400).json({ error: 'Missing user ID' });
      }

      const isAuthorized = await this.googleCalendarService.checkAuthStatus(userId);
      
      return res.status(200).json({
        isAuthorized,
      });
    } catch (error) {
      console.error('Error checking auth status:', error);
      return res.status(500).json({ error: 'Failed to check authorization status' });
    }
  }

  @Post('sync')
  async syncReservationsToCalendar(
    @Body() body: { userId: string; reservations: any[] },
    @Res() res: Response,
  ) {
    try {
      const { userId, reservations } = body;

      if (!userId || !reservations || !Array.isArray(reservations)) {
        return res.status(400).json({ error: 'Missing user ID or invalid reservations data' });
      }

      const result = await this.googleCalendarService.syncReservationsToCalendar(userId, reservations);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error syncing reservations to calendar:', error);
      return res.status(500).json({ error: 'Failed to sync reservations to calendar' });
    }
  }

  @Post('sync-by-tenant')
  async syncReservationsByTenant(
    @Body() body: { userId: string; reservationsByTenant: Record<string, any[]> },
    @Res() res: Response,
  ) {
    try {
      const { userId, reservationsByTenant } = body;

      if (!userId || !reservationsByTenant || typeof reservationsByTenant !== 'object') {
        return res.status(400).json({ error: 'Missing user ID or invalid reservations data' });
      }

      const result = await this.googleCalendarService.syncReservationsByTenant(userId, reservationsByTenant);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error syncing reservations to calendar by tenant:', error);
      return res.status(500).json({ error: 'Failed to sync reservations to calendar by tenant' });
    }
  }
}
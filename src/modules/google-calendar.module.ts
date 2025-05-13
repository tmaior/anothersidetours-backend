import { Module } from '@nestjs/common';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { GoogleCalendarController } from '../controllers/google-calendar.controller';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule],
  controllers: [GoogleCalendarController],
  providers: [GoogleCalendarService, PrismaService],
  exports: [GoogleCalendarService]
})
export class GoogleCalendarModule {} 
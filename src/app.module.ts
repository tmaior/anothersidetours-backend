import { Module } from '@nestjs/common';

import { ReservationController } from './controllers/reservation.controller';
import { TourController } from './controllers/tour.controller';
import { ReservationService } from './services/reservation.service';
import { TenantService } from './services/tenant.service';
import { TourService } from './services/tour.service';
import { TenantController } from './controllers/tenant.controller';
import { PrismaService } from '../prisma/migrations/prisma.service';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';

@Module({
  imports: [],
  controllers: [
    ReservationController,
    TourController,
    TenantController,
    UserController,
  ],
  providers: [
    ReservationService,
    TenantService,
    TourService,
    PrismaService,
    UserService,
  ],
})
export class AppModule {}

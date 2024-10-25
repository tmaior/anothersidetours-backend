import { Module } from '@nestjs/common';

import { AddonController } from './controllers/addon.controller';
import { ReservationController } from './controllers/reservation.controller';
import { TourController } from './controllers/tour.controller';
import { AddonService } from './services/addon.service';
import { ReservationService } from './services/reservation.service';
import { TenantService } from './services/tenant.service';
import { TourService } from './services/tour.service';
import { TenantController } from './controllers/tenant.controller';
import { PrismaService } from '../prisma/migrations/prisma.service';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { ReservationAddonController } from './controllers/reservationaddon.controller';
import { ReservationAddonService } from './services/reservationaddon.service';
import { BlackoutDateController } from './controllers/blackout.controller';
import { BlackoutDateService } from './services/blackout.service';
import { PaymentController } from './controllers/payment.controller';
import { PaymentService } from './services/payment.service';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { MailService } from './services/mail.service';
import { MailController } from './controllers/mail.controller';

@Module({
  imports: [],
  controllers: [
    AddonController,
    ReservationController,
    TourController,
    TenantController,
    UserController,
    ReservationAddonController,
    BlackoutDateController,
    PaymentController,
    NotificationController,
    MailController,
  ],
  providers: [
    AddonService,
    ReservationService,
    TenantService,
    TourService,
    PrismaService,
    UserService,
    ReservationAddonService,
    BlackoutDateService,
    PaymentService,
    NotificationService,
    MailService,
  ],
})
export class AppModule {}

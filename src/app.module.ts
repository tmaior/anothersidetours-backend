import { Module } from '@nestjs/common';

import { PaymentController } from './controllers/payment.controller';
import { PaymentService } from './services/payment.service';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { MailService } from './services/mail.service';
import { MailController } from './controllers/mail.controller';
import { PrismaService } from '../prisma/migrations/prisma.service';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { TenantController } from './controllers/tenant.controller';
import { TenantService } from './services/tenant.service';
import { TourService } from './services/tour.service';
import { TourController } from './controllers/tour.controller';
import { ReservationController } from './controllers/reservation.controller';
import { ReservationService } from './services/reservation.service';
import { ReservationAddonController } from './controllers/reservation-addon.controller';
import { ReservationAddonService } from './services/reservation-addon.service';
import { AddonController } from './controllers/addon.controller';
import { AddonService } from './services/addon.service';
import { BlackoutDateController } from './controllers/blackout.controller';
import { BlackoutDateService } from './services/blackout.service';
import { AdditionalInformationController } from './controllers/additional-information';
import { AdditionalInformationService } from './services/additional-information.service';

@Module({
  imports: [],
  controllers: [
    PaymentController,
    NotificationController,
    MailController,
    UserController,
    TenantController,
    TourController,
    ReservationController,
    ReservationAddonController,
    AddonController,
    BlackoutDateController,
    AdditionalInformationController,
  ],
  providers: [
    PrismaService,
    PaymentService,
    NotificationService,
    MailService,
    UserService,
    TenantService,
    TourService,
    ReservationService,
    ReservationAddonService,
    AddonService,
    BlackoutDateService,
    AdditionalInformationService,
  ],
})
export class AppModule {}

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthService } from './services/auth.service';

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
import { AdditionalInformationController } from './controllers/additional-information.controller';
import { AdditionalInformationService } from './services/additional-information.service';
import { CustomerAdditionalInformationController } from './controllers/customer-additional-information.controller';
import { CustomerAdditionalInformationService } from './services/customer-additional-information.service';
import { CategoryService } from './services/category.service';
import { GuideService } from './services/guide.service';
import { NotesService } from './services/notes.service';
import { CategoryController } from './controllers/category.controller';
import { GuideController } from './controllers/guide.controller';
import { NotesController } from './controllers/notes.controller';
import { TourScheduleService } from './services/tour-schedule.service';
import { TourScheduleController } from './controllers/tour-schedule.controller';
import { UploadController } from './controllers/upload-controller';
import { S3Service } from './services/S3Service';
import { WhatToBringController } from './controllers/what-to-bring.controller';
import { WhatsIncludedController } from './controllers/whats-included.controller';
import { WhatsIncludedService } from './services/whats-included.service';
import { WhatToBringService } from './services/what-to-bring.service';
import { EmployeeController } from './controllers/employee.controller';
import { EmployeeService } from './services/employee.service';
import { RefundController } from './controllers/refund.controller';
import { VoucherController } from './controllers/voucher.controller';
import { RefundService } from './services/refund.service';
import { VoucherService } from './services/voucher.service';
import { HistoryService } from './services/history.service';
import { HistoryController } from './controllers/history.controller';
import { DemographicController } from './controllers/demographic.controller';
import { TierPricingController } from './controllers/tier-pricing.controller';
import { DemographicService } from './services/demographic.service';
import { TierPricingService } from './services/tier-pricing.service';
import { CustomItemController } from './controllers/customItemController';
import { CustomItemService } from './services/customItemService';
import { EmailReminderController } from './controllers/email-reminder.controller';
import { EmailReminderService } from './services/email-reminder.service';
import { ScheduleModule } from '@nestjs/schedule';
import { PurchaseNotesController } from './controllers/purchase-notes';
import { PurchaseNotesService } from './services/purchase-notes';
import { PaymentTransactionController } from './controllers/payment-transaction.controller';
import { PaymentTransactionService } from './services/payment-transaction.service';
import { CompanyProfileController } from './controllers/companyProfileController';
import { CompanyProfileService } from './services/companyProfileService';
import { AuthModule } from './modules/auth.module';
import { AdminGuard } from './guards/admin.guard';
import { WhatsNotIncludedService } from './services/whats-not-included.service';
import { WhatsNotIncludedController } from './controllers/whats-not-included.controller';
import { GoogleCalendarModule } from './modules/google-calendar.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    GoogleCalendarModule,
  ],
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
    CustomerAdditionalInformationController,
    CategoryController,
    GuideController,
    NotesController,
    TourScheduleController,
    UploadController,
    WhatsIncludedController,
    WhatToBringController,
    EmployeeController,
    RefundController,
    VoucherController,
    HistoryController,
    DemographicController,
    TierPricingController,
    CustomItemController,
    EmailReminderController,
    PurchaseNotesController,
    PaymentTransactionController,
    CompanyProfileController,
    WhatsNotIncludedController,
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
    CustomerAdditionalInformationService,
    CategoryService,
    GuideService,
    NotesService,
    TourScheduleService,
    S3Service,
    WhatsIncludedService,
    WhatToBringService,
    EmployeeService,
    RefundService,
    VoucherService,
    HistoryService,
    DemographicService,
    TierPricingService,
    CustomItemService,
    EmailReminderService,
    PurchaseNotesService,
    PaymentTransactionService,
    CompanyProfileService,
    JwtService,
    Reflector,
    AuthService,
    WhatsNotIncludedService,
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector, jwtService: JwtService, authService: AuthService) => {
        return new JwtAuthGuard(jwtService, authService, reflector);
      },
      inject: [Reflector, JwtService, AuthService],
    },
    AdminGuard,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*');
  }
}

-- CreateEnum
CREATE TYPE "AddonType" AS ENUM ('CHECKBOX', 'SELECT');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationIncomplete" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "guestQuantity" INTEGER NOT NULL,
    "selectedDate" TIMESTAMP(3),
    "selectedTime" TIMESTAMP(3),
    "statusCheckout" TEXT NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationIncomplete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tour" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT,
    "guideId" TEXT,
    "imageUrl" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "StandardOperation" TEXT,
    "minPerEventLimit" INTEGER NOT NULL,
    "maxPerEventLimit" INTEGER NOT NULL,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demographic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,

    CONSTRAINT "Demographic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourDemographic" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "demographicId" TEXT NOT NULL,

    CONSTRAINT "TourDemographic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierPricing" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "demographicId" TEXT NOT NULL,
    "pricingType" TEXT NOT NULL DEFAULT 'tiered',
    "basePrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TierPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierPriceEntry" (
    "id" TEXT NOT NULL,
    "tierPricingId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TierPriceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "selectedDate" TIMESTAMP(3) NOT NULL,
    "selectedTime" TEXT NOT NULL,
    "guestQuantity" INTEGER NOT NULL,
    "statusCheckout" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tour_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reservation_date" TIMESTAMP(3) NOT NULL,
    "guestQuantity" INTEGER NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "setupIntentId" TEXT,
    "paymentMethodId" TEXT,
    "purchaseTags" TEXT,
    "purchaseNote" TEXT,
    "paymentIntentId" TEXT,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Email_Reminder" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "reminder_type" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Email_Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomItem" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tour_id" TEXT,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationGuide" (
    "reservationId" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,

    CONSTRAINT "ReservationGuide_pkey" PRIMARY KEY ("reservationId","guideId")
);

-- CreateTable
CREATE TABLE "Addon" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tour_id" TEXT,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "AddonType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationAddon" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "addon_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ReservationAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlackoutDate" (
    "id" TEXT NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "category_id" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "tour_id" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "BlackoutDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "stripe_payment_id" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoryEvent" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "reservation_id" TEXT,
    "eventType" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "status" TEXT,
    "creditCardInfo" TEXT,
    "value" DOUBLE PRECISION,
    "to" TEXT,
    "eventDescription" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdditionalInformation" (
    "id" TEXT NOT NULL,
    "tour_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "AdditionalInformation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAdditionalInformation" (
    "id" TEXT NOT NULL,
    "additional_information_id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "CustomerAdditionalInformation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isRedeemed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reservationId" TEXT,
    "originReservationId" TEXT,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "imageUrl" TEXT,
    "available" BOOLEAN NOT NULL,
    "phone" TEXT NOT NULL,
    "bio" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourSchedule" (
    "id" TEXT NOT NULL,
    "tour_id" TEXT NOT NULL,
    "timeSlot" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsIncluded" (
    "id" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "tour_id" TEXT NOT NULL,

    CONSTRAINT "WhatsIncluded_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatToBring" (
    "id" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "tour_id" TEXT NOT NULL,

    CONSTRAINT "WhatToBring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GuideToReservation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GuideToReservation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReservationIncomplete_email_key" ON "ReservationIncomplete"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Demographic_name_key" ON "Demographic"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TierPricing_tourId_demographicId_key" ON "TierPricing"("tourId", "demographicId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_paymentMethodId_key" ON "Reservation"("paymentMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_paymentIntentId_key" ON "Reservation"("paymentIntentId");

-- CreateIndex
CREATE INDEX "HistoryEvent_tenant_id_reservation_id_idx" ON "HistoryEvent"("tenant_id", "reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_paymentIntentId_key" ON "Refund"("paymentIntentId");

-- CreateIndex
CREATE INDEX "_GuideToReservation_B_index" ON "_GuideToReservation"("B");

-- AddForeignKey
ALTER TABLE "Tour" ADD CONSTRAINT "Tour_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tour" ADD CONSTRAINT "Tour_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourDemographic" ADD CONSTRAINT "TourDemographic_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourDemographic" ADD CONSTRAINT "TourDemographic_demographicId_fkey" FOREIGN KEY ("demographicId") REFERENCES "Demographic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierPricing" ADD CONSTRAINT "TierPricing_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierPricing" ADD CONSTRAINT "TierPricing_demographicId_fkey" FOREIGN KEY ("demographicId") REFERENCES "Demographic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierPriceEntry" ADD CONSTRAINT "TierPriceEntry_tierPricingId_fkey" FOREIGN KEY ("tierPricingId") REFERENCES "TierPricing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "Tour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email_Reminder" ADD CONSTRAINT "Email_Reminder_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomItem" ADD CONSTRAINT "CustomItem_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomItem" ADD CONSTRAINT "CustomItem_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationGuide" ADD CONSTRAINT "ReservationGuide_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationGuide" ADD CONSTRAINT "ReservationGuide_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Addon" ADD CONSTRAINT "Addon_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Addon" ADD CONSTRAINT "Addon_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationAddon" ADD CONSTRAINT "ReservationAddon_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationAddon" ADD CONSTRAINT "ReservationAddon_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationAddon" ADD CONSTRAINT "ReservationAddon_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "Addon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlackoutDate" ADD CONSTRAINT "BlackoutDate_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlackoutDate" ADD CONSTRAINT "BlackoutDate_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "Tour"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlackoutDate" ADD CONSTRAINT "BlackoutDate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEvent" ADD CONSTRAINT "HistoryEvent_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEvent" ADD CONSTRAINT "HistoryEvent_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalInformation" ADD CONSTRAINT "AdditionalInformation_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAdditionalInformation" ADD CONSTRAINT "CustomerAdditionalInformation_additional_information_id_fkey" FOREIGN KEY ("additional_information_id") REFERENCES "AdditionalInformation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAdditionalInformation" ADD CONSTRAINT "CustomerAdditionalInformation_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourSchedule" ADD CONSTRAINT "TourSchedule_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsIncluded" ADD CONSTRAINT "WhatsIncluded_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatToBring" ADD CONSTRAINT "WhatToBring_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GuideToReservation" ADD CONSTRAINT "_GuideToReservation_A_fkey" FOREIGN KEY ("A") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GuideToReservation" ADD CONSTRAINT "_GuideToReservation_B_fkey" FOREIGN KEY ("B") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

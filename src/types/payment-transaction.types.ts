import { Prisma } from '@prisma/client';

export type PaymentTransactionMetadata = {
    guestQuantity?: number;
    addons?: any[];
    customItems?: any[];
    tourDetails?: any;
    userDetails?: any;
    originalStatus?: string;
    groupId?: string;
    modifiedAt?: string;
    notifyCustomer?: boolean;
    comment?: string;
    refundDate?: string;
    paymentMethod?: string;
    refundReason?: string;
    isPartial?: boolean;
    originalTransactionId?: string;
    cardId?: string;
    originalAmount?: number;
    refundTotal?: number;
    refundPortion?: number;
    remaining?: number;
};

export interface CreatePaymentTransactionDto extends Omit<Prisma.PaymentTransactionUncheckedCreateInput, 'metadata'> {
    metadata?: PaymentTransactionMetadata;
} 
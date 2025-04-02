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
};

export type CreatePaymentTransactionDto = Omit<
    Prisma.PaymentTransactionCreateInput,
    'metadata'
> & {
    metadata?: PaymentTransactionMetadata;
}; 
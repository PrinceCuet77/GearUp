import { z } from 'zod';
import { PaymentStatus } from '../../../generated/prisma/enums';

export const createPaymentSchema = z.object({
  rentalOrderId: z.string().min(1, 'Rental Order ID is required'),
});

export const getPaymentHistoryQuerySchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sortBy: z
    .enum(['createdAt', 'amount', 'paidAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const getPaymentByIdParamsSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
});

export const confirmPaymentQuerySchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  tranId: z.string().min(1, 'Transaction ID is required'),
  status: z.enum(['success', 'fail', 'cancel']),
});

export const confirmPaymentBodySchema = z.object({
  val_id: z.string().min(1, 'Validation ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
});

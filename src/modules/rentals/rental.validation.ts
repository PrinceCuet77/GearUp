import { z } from 'zod';
import { RentalStatus } from '../../../generated/prisma/enums';

const rentalItemSchema = z.object({
  gearItemId: z.string().min(1, 'Gear item ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

export const createRentalSchema = z
  .object({
    startDate: z
      .string()
      .min(1, 'Start date is required')
      .refine((val) => !isNaN(Date.parse(val)), 'Invalid start date format'),
    endDate: z
      .string()
      .min(1, 'End date is required')
      .refine((val) => !isNaN(Date.parse(val)), 'Invalid end date format'),
    items: z
      .array(rentalItemSchema)
      .min(1, 'At least one gear item is required'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    },
  );

export const getCustomerRentalsQuerySchema = z.object({
  status: z.nativeEnum(RentalStatus).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sortBy: z
    .enum(['createdAt', 'startDate', 'endDate', 'amount'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

import { z } from 'zod';
import { RentalStatus } from '../../../generated/prisma/enums';

export const createGearSchema = z.object({
  name: z.string().min(1, 'Gear name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be a positive number'),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  images: z.string().min(1, 'Images URL is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
});

export const updateGearSchema = z.object({
  name: z.string().min(1, 'Gear name is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  price: z.number().positive('Price must be a positive number').optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  images: z.string().min(1, 'Images URL is required').optional(),
  categoryId: z.string().min(1, 'Category ID is required').optional(),
  isActive: z.boolean().optional(),
});

export const getProviderOrdersQuerySchema = z.object({
  status: z
    .nativeEnum(RentalStatus, {
      error: 'Invalid rental status',
    })
    .optional(),
  page: z
    .string()
    .optional()
    .refine(
      (val) => !val || (Number(val) >= 1 && Number.isInteger(Number(val))),
      {
        message: 'Page must be a positive integer',
      },
    ),
  limit: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        (Number(val) >= 1 &&
          Number(val) <= 100 &&
          Number.isInteger(Number(val))),
      {
        message: 'Limit must be an integer between 1 and 100',
      },
    ),
});

export const getProviderOrderByIdParamSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

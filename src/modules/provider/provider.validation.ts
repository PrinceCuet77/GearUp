import { z } from 'zod';
import { RentalStatus } from '../../../generated/prisma/enums';

export const createGearSchema = z.object({
  name: z
    .string()
    .min(1, 'Gear name is required')
    .max(100, 'Gear name must be at most 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(255, 'Description must be at most 255 characters'),
  price: z.number().positive('Price must be a positive number'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  images: z
    .string()
    .min(1, 'Images URL is required')
    .max(255, 'Images URL must be at most 255 characters'),
  categoryId: z.string().min(1, 'Category ID is required'),
});

export const updateGearSchema = z.object({
  name: z
    .string()
    .min(1, 'Gear name is required')
    .max(100, 'Gear name must be at most 100 characters')
    .optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(255, 'Description must be at most 255 characters')
    .optional(),
  price: z.number().positive('Price must be a positive number').optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  images: z
    .string()
    .min(1, 'Images URL is required')
    .max(255, 'Images URL must be at most 255 characters')
    .optional(),
  categoryId: z.string().min(1, 'Category ID is required'),
  isActive: z.boolean().optional(),
});

export const deleteGearParamSchema = z.object({
  gearId: z.string().min(1, 'Gear ID is required'),
});

export const getGearByIdParamSchema = z.object({
  gearId: z.string().min(1, 'Gear ID is required'),
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

export const updateOrderStatusParamSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

export const updateOrderStatusBodySchema = z.object({
  status: z.enum(['CONFIRMED', 'PICKED_UP'], {
    error: 'Invalid status. Allowed: CONFIRMED, PICKED_UP',
  }),
});

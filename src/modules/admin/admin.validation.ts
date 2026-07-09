import { z } from 'zod';
import { UserStatus } from '../../../generated/prisma/enums';

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').optional(),
  description: z.string().optional(),
});

export const getAllGearsQuerySchema = z.object({
  category: z.string().optional(),
  minPrice: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), {
      message: 'minPrice must be a number',
    }),
  maxPrice: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), {
      message: 'maxPrice must be a number',
    }),
  search: z.string().optional(),
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
      { message: 'Limit must be an integer between 1 and 100' },
    ),
  sortBy: z.enum(['name', 'price', 'createdAt', 'stock']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

import { z } from 'zod';
import {
  UserStatus,
  UserRole,
  RentalStatus,
} from '../../../generated/prisma/enums';

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must not exceed 100 characters'),
  description: z
    .string()
    .max(100, 'Description must not exceed 100 characters')
    .optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must not exceed 100 characters')
    .optional(),
  description: z
    .string()
    .max(100, 'Description must not exceed 100 characters')
    .optional(),
});

export const getAllUsersQuerySchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
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
  sortBy: z
    .enum(['name', 'email', 'createdAt', 'updatedAt', 'status'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
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

export const getAllRentalsQuerySchema = z.object({
  status: z.nativeEnum(RentalStatus).optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
  startDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'startDate must be a valid date',
    }),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'endDate must be a valid date',
    }),
  minAmount: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), {
      message: 'minAmount must be a number',
    }),
  maxAmount: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), {
      message: 'maxAmount must be a number',
    }),
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
  sortBy: z
    .enum(['createdAt', 'startDate', 'endDate', 'amount', 'status'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

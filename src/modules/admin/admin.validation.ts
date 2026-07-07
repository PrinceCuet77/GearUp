import { z } from 'zod';
import { UserStatus } from '../../../generated/prisma/enums';

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

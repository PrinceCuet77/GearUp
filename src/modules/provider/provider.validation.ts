import { z } from 'zod';

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

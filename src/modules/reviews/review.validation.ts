import { z } from 'zod';

export const createReviewSchema = z.object({
  rentalOrderId: z.string().min(1, 'Rental order ID is required'),
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z
    .string()
    .min(1, 'Comment is required')
    .max(1000, 'Comment cannot exceed 1000 characters'),
});

export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .optional(),
  comment: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment cannot exceed 1000 characters')
    .optional(),
});

export const reviewParamsSchema = z.object({
  reviewId: z.string().min(1, 'Review ID is required'),
});

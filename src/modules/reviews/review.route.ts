import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/enums';
import { reviewController } from './review.controller';
import { validate } from '../../middleware/validate';
import {
  createReviewSchema,
  updateReviewSchema,
  reviewParamsSchema,
} from './review.validation';

const router = Router();

router.get(
  '/:reviewId',
  auth(UserRole.CUSTOMER),
  validate(reviewParamsSchema, 'params'),
  reviewController.getReviewById,
);

router.post(
  '/',
  auth(UserRole.CUSTOMER),
  validate(createReviewSchema),
  reviewController.createReview,
);

router.patch(
  '/:reviewId',
  auth(UserRole.CUSTOMER),
  validate(reviewParamsSchema, 'params'),
  validate(updateReviewSchema),
  reviewController.updateReview,
);

router.delete(
  '/:reviewId',
  auth(UserRole.CUSTOMER),
  validate(reviewParamsSchema, 'params'),
  reviewController.deleteReview,
);

export const reviewRoutes = router;

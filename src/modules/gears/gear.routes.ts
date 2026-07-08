import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/enums';
import { gearController } from './gear.controller';
import { validate } from '../../middleware/validate';
import {
  getAllGearsSchema,
  getGearByIdSchema,
  getGearReviewsSchema,
  getGearReviewsQuerySchema,
} from './gear.validation';

const router = Router();

router.get(
  '/',
  auth(UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.ADMIN),
  validate(getAllGearsSchema, 'query'),
  gearController.getAllGears,
);

router.get(
  '/:gearId',
  auth(UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.ADMIN),
  validate(getGearByIdSchema, 'params'),
  gearController.getGearById,
);

router.get(
  '/:gearId/reviews',
  auth(UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.ADMIN),
  validate(getGearReviewsSchema, 'params'),
  validate(getGearReviewsQuerySchema, 'query'),
  gearController.getGearReviews,
);

export const gearRoutes = router;

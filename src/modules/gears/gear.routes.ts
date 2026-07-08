import { Router } from 'express';
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
  validate(getAllGearsSchema, 'query'),
  gearController.getAllGears,
);

router.get(
  '/:gearId',
  validate(getGearByIdSchema, 'params'),
  gearController.getGearById,
);

router.get(
  '/:gearId/reviews',
  validate(getGearReviewsSchema, 'params'),
  validate(getGearReviewsQuerySchema, 'query'),
  gearController.getGearReviews,
);

export const gearRoutes = router;

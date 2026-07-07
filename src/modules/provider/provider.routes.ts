import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/enums';
import { providerController } from './provider.controller';
import { validate } from '../../middleware/validate';
import { createGearSchema } from './provider.validation';

const router = Router();

router.post(
  '/gear',
  auth(UserRole.PROVIDER),
  validate(createGearSchema),
  providerController.createGear,
);

export const providerRoutes = router;

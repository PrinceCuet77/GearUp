import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/enums';
import { providerController } from './provider.controller';
import { validate } from '../../middleware/validate';
import { createGearSchema, updateGearSchema } from './provider.validation';

const router = Router();

router.get(
  '/gears',
  auth(UserRole.PROVIDER, UserRole.ADMIN),
  providerController.getUserSpecificProviderGear,
);

router.post(
  '/gear',
  auth(UserRole.PROVIDER),
  validate(createGearSchema),
  providerController.createGear,
);

router.patch(
  '/gear/:gearId',
  auth(UserRole.PROVIDER),
  validate(updateGearSchema),
  providerController.updateGear,
);

router.get(
  '/orders',
  auth(UserRole.PROVIDER),
  providerController.getProviderOrders,
);

export const providerRoutes = router;

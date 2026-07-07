import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/enums';
import { providerController } from './provider.controller';
import { validate } from '../../middleware/validate';
import {
  createGearSchema,
  updateGearSchema,
  getProviderOrdersQuerySchema,
  getProviderOrderByIdParamSchema,
  updateOrderStatusParamSchema,
  updateOrderStatusBodySchema,
} from './provider.validation';

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
  validate(getProviderOrdersQuerySchema, 'query'),
  providerController.getProviderOrders,
);

router.get(
  '/orders/:orderId',
  auth(UserRole.PROVIDER, UserRole.ADMIN),
  validate(getProviderOrderByIdParamSchema, 'params'),
  providerController.getProviderOrderById,
);

router.patch(
  '/orders/:orderId',
  auth(UserRole.PROVIDER),
  validate(updateOrderStatusParamSchema, 'params'),
  validate(updateOrderStatusBodySchema, 'body'),
  providerController.updateOrderStatus,
);

export const providerRoutes = router;

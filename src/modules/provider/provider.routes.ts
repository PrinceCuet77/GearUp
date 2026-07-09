import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/enums';
import { providerController } from './provider.controller';
import { validate } from '../../middleware/validate';
import {
  createGearSchema,
  updateGearSchema,
  deleteGearParamSchema,
  getProviderOrdersQuerySchema,
  getProviderOrderByIdParamSchema,
  updateOrderStatusParamSchema,
  updateOrderStatusBodySchema,
  getGearByIdParamSchema,
} from './provider.validation';

const router = Router();

router.get(
  '/gears',
  auth(UserRole.PROVIDER),
  providerController.getUserSpecificProviderGear,
);

router.post(
  '/gears',
  auth(UserRole.PROVIDER),
  validate(createGearSchema),
  providerController.createGear,
);

router.get(
  '/gears/:gearId',
  auth(UserRole.PROVIDER),
  validate(getGearByIdParamSchema, 'params'),
  providerController.getGearById,
);

router.patch(
  '/gears/:gearId',
  auth(UserRole.PROVIDER),
  validate(updateGearSchema),
  providerController.updateGear,
);

router.delete(
  '/gears/:gearId',
  auth(UserRole.PROVIDER),
  validate(deleteGearParamSchema, 'params'),
  providerController.deleteGear,
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

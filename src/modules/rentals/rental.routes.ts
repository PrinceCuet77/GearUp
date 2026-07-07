import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/enums';
import { rentalController } from './rental.controller';
import { validate } from '../../middleware/validate';
import {
  createRentalSchema,
  cancelRentalParamsSchema,
  getCustomerRentalsQuerySchema,
} from './rental.validation';

const router = Router();

router.post(
  '/',
  auth(UserRole.CUSTOMER),
  validate(createRentalSchema),
  rentalController.createRental,
);

router.get(
  '/',
  auth(UserRole.CUSTOMER, UserRole.ADMIN),
  validate(getCustomerRentalsQuerySchema, 'query'),
  rentalController.getCustomerRentals,
);

router.get(
  '/:rentalId',
  auth(UserRole.CUSTOMER, UserRole.ADMIN),
  rentalController.getRentalById,
);

router.patch(
  '/:rentId/cancel',
  auth(UserRole.CUSTOMER),
  validate(cancelRentalParamsSchema),
  rentalController.cancelRental,
);

export const rentalRoutes = router;

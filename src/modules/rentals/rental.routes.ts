import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/enums';
import { rentalController } from './rental.controller';
import { validate } from '../../middleware/validate';
import {
  createRentalSchema,
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

export const rentalRoutes = router;

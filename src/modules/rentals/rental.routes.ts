import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/enums';
import { rentalController } from './rental.controller';
import { validate } from '../../middleware/validate';
import { createRentalSchema } from './rental.validation';

const router = Router();

router.post(
  '/',
  auth(UserRole.CUSTOMER),
  validate(createRentalSchema),
  rentalController.createRental,
);

export const rentalRoutes = router;

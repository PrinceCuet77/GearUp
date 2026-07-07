import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/enums';
import { gearController } from './gear.controller';
import { validate } from '../../middleware/validate';
import { getAllGearsSchema } from './gear.validation';

const router = Router();

router.get(
  '/',
  auth(UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.ADMIN),
  validate(getAllGearsSchema, 'query'),
  gearController.getAllGears,
);

export const gearRoutes = router;

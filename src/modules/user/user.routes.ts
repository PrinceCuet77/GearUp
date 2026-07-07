import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { userController } from './user.controller';
import { UserRole } from '../../../generated/prisma/enums';

const router = Router();

router.get(
  '/me',
  auth(UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.ADMIN),
  userController.getUserDetails,
);

export const userRoutes = router;

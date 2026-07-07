import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { userController } from './user.controller';
import { userValidation } from './user.validation';
import { UserRole } from '../../../generated/prisma/enums';

const router = Router();

router.get(
  '/me',
  auth(UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.ADMIN),
  userController.getUserDetails,
);

router.patch(
  '/me',
  auth(UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.ADMIN),
  validate(userValidation.updateMyProfile),
  userController.updateMyProfile,
);

router.patch(
  '/me/password',
  auth(UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.ADMIN),
  validate(userValidation.changePassword),
  userController.changeMyPassword,
);

export const userRoutes = router;

import { Router } from 'express';
import { authV1Controllers } from './authV1.controller';
import { validate } from '../../middleware/validate';
import {
  loginUserSchema,
  refreshTokenSchema,
  registerUserSchema,
} from './authV1.validation';
import { UserRole } from '../../../generated/prisma/enums';

const router = Router();

router.post(
  '/register',
  validate(registerUserSchema),
  authV1Controllers.registerUser,
);

router.post(
  '/login',
  validate(loginUserSchema),
  authV1Controllers.credentialLoginUser,
);

router.post(
  '/refresh',
  validate(refreshTokenSchema, 'cookies'),
  authV1Controllers.refreshToken,
);

router.post('/logout', authV1Controllers.logout);

// Role-specific entry points: the role tile the user clicked decides which one
// the frontend navigates to, and it travels through Google in a signed `state`
// param. `/google` (no role) is kept for the existing frontend and defaults new
// accounts to CUSTOMER. ADMIN is deliberately not offered.
router.get('/google', authV1Controllers.startGoogleAuth());
router.get(
  '/google/customer',
  authV1Controllers.startGoogleAuth(UserRole.CUSTOMER),
);
router.get(
  '/google/provider',
  authV1Controllers.startGoogleAuth(UserRole.PROVIDER),
);

router.get('/google/callback', authV1Controllers.googleCallback);

export const authV1Routes = router;

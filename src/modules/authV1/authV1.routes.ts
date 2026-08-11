import { Router } from 'express';
import { authV1Controller } from './authV1.controller';
import { validate } from '../../middleware/validate';
import {
  googleAuthQuerySchema,
  loginUserSchema,
  refreshTokenSchema,
  registerUserSchema,
} from './authV1.validation';

const router = Router();

router.post(
  '/register',
  validate(registerUserSchema),
  authV1Controller.registerUser,
);

router.post('/login', validate(loginUserSchema), authV1Controller.loginUser);

router.post(
  '/refresh',
  validate(refreshTokenSchema, 'cookies'),
  authV1Controller.refreshToken,
);

router.post('/logout', authV1Controller.logout);

// Browser-navigated (not fetch): the frontend sends the user here with the role
// picked on the registration screen, e.g. /google?role=PROVIDER&redirect=/dashboard
router.get(
  '/google',
  validate(googleAuthQuerySchema, 'query'),
  authV1Controller.googleAuth,
);

// Public gateway-style callback — Google calls this, so no auth middleware.
// The URL must match GOOGLE_REDIRECT_URI and the Google Console entry exactly.
router.get('/google/callback', authV1Controller.googleCallback);

export const authV1Routes = router;

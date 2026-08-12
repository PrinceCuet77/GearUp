import { Router } from 'express';
import { authV1Controller } from './authV1.controller';
import { validate } from '../../middleware/validate';
import {
  googleAuthRedirectQuerySchema,
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

// Role-dedicated entry points: the customer frontend hits /google/customer and
// the provider frontend hits /google/provider, so neither has to pass `role`
// on the query string — the route itself fixes it server-side.
router.get(
  '/google/customer',
  validate(googleAuthRedirectQuerySchema, 'query'),
  authV1Controller.googleAuthCustomer,
);

router.get(
  '/google/provider',
  validate(googleAuthRedirectQuerySchema, 'query'),
  authV1Controller.googleAuthProvider,
);

// Public gateway-style callback — Google calls this, so no auth middleware.
// The URL must match GOOGLE_REDIRECT_URI and the Google Console entry exactly.
router.get('/google/callback', authV1Controller.googleCallback);

export const authV1Routes = router;

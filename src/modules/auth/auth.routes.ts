import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { loginUserSchema, refreshTokenSchema, registerUserSchema } from './auth.validation';

const router = Router();

router.post(
  '/register',
  validate(registerUserSchema),
  authController.registerUser,
);

router.post('/login', validate(loginUserSchema), authController.loginUser);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken,
);

router.post('/logout', authController.logout);

export const authRoutes = router;

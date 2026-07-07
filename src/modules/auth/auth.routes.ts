import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { loginUserSchema, registerUserSchema } from './auth.validation';

const router = Router();

router.post(
  '/register',
  validate(registerUserSchema),
  authController.registerUser,
);

router.post('/login', validate(loginUserSchema), authController.loginUser);

export const authRoutes = router;

import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import {
  registerUserSchema,
} from './auth.validation';

const router = Router();

router.post(
  '/register',
  validate(registerUserSchema),
  authController.registerUser,
);

export const authRoutes = router;

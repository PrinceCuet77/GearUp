import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/enums';
import { categoryController } from './category.controller';

const router = Router();

router.get(
  '/',
  auth(UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.ADMIN),
  categoryController.getAllCategories,
);

export const categoryRoutes = router;

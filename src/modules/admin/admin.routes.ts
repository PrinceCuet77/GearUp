import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/enums';
import { adminController } from './admin.controller';
import { validate } from '../../middleware/validate';
import {
  updateUserStatusSchema,
  createCategorySchema,
  updateCategorySchema,
  getAllGearsQuerySchema,
} from './admin.validation';

const router = Router();

router.get('/users', auth(UserRole.ADMIN), adminController.getAllUserDetails);

router.get(
  '/user/:userId',
  auth(UserRole.ADMIN),
  adminController.getUserDetailsById,
);

router.patch(
  '/user/:userId/status',
  auth(UserRole.ADMIN),
  validate(updateUserStatusSchema),
  adminController.updateUserStatus,
);

router.post(
  '/categories',
  auth(UserRole.ADMIN),
  validate(createCategorySchema),
  adminController.createCategory,
);

router.patch(
  '/categories/:categoryId',
  auth(UserRole.ADMIN),
  validate(updateCategorySchema),
  adminController.updateCategory,
);

router.get(
  '/categories/:categoryId',
  auth(UserRole.ADMIN),
  adminController.getCategoryById,
);

router.get(
  '/gears',
  auth(UserRole.ADMIN),
  validate(getAllGearsQuerySchema, 'query'),
  adminController.getAllGears,
);

export const adminRoutes = router;

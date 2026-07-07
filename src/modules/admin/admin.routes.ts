import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/enums';
import { adminController } from './admin.controller';

const router = Router();

router.get('/users', auth(UserRole.ADMIN), adminController.getAllUserDetails);

router.get(
  '/user/:userId',
  auth(UserRole.ADMIN),
  adminController.getUserDetailsById,
);

export const adminRoutes = router;

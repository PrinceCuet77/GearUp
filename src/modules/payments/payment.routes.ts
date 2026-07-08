import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/enums';
import { validate } from '../../middleware/validate';
import {
  createPaymentSchema,
  confirmPaymentQuerySchema,
  confirmPaymentBodySchema,
  getPaymentHistoryQuerySchema,
  getPaymentByIdParamsSchema,
} from './payment.validation';
import { paymentController } from './payment.controller';

const router = Router();

router.post(
  '/create',
  auth(UserRole.CUSTOMER),
  validate(createPaymentSchema),
  paymentController.createPayment,
);

router.post(
  '/confirm',
  validate(confirmPaymentQuerySchema, 'query'),
  validate(confirmPaymentBodySchema, 'body'),
  paymentController.confirmPayment,
);

router.get(
  '/',
  auth(UserRole.CUSTOMER),
  validate(getPaymentHistoryQuerySchema, 'query'),
  paymentController.getPaymentHistory,
);

router.get(
  '/:paymentId',
  auth(UserRole.CUSTOMER),
  validate(getPaymentByIdParamsSchema, 'params'),
  paymentController.getPaymentById,
);


export const paymentRoutes = router;

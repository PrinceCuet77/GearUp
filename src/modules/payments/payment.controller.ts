import { Request, Response } from 'express';
import httpStatus from 'http-status';
import config from '../../config';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { paymentService } from './payment.service';
import { IGetPaymentHistoryQuery } from './payment.interface';

const createPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.createPaymentInDB(
    req.user!.userId,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Payment initiated successfully',
    data: result,
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const { orderId, tranId, status } = req.query;
  const payload = req.body;

  const response = await paymentService.confirmPayment(
    orderId as string,
    tranId as string,
    status as string,
    payload,
  );

  const base_url =
    config.app_url === 'development' ? config.app_url : config.prod_url;

  if (response === 'success') {
    res.redirect(`${base_url}/dashboard/payments?status=success`);
  } else if (response === 'fail') {
    res.redirect(`${base_url}/dashboard/payments?status=failed`);
  } else if (response === 'cancel') {
    res.redirect(`${base_url}/dashboard/payments?status=cancelled`);
  }
});

const getPaymentHistory = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId as string;
  const result = await paymentService.getPaymentHistory(
    customerId,
    req.query as IGetPaymentHistoryQuery,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Payment history retrieved successfully',
    data: result.payments,
    meta: result.meta,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId as string;
  const paymentId = req.params.paymentId as string;
  const payment = await paymentService.getPaymentById(paymentId, customerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Payment details retrieved successfully',
    data: payment,
  });
});

export const paymentController = {
  createPayment,
  confirmPayment,
  getPaymentHistory,
  getPaymentById,
};

import axios from 'axios';
import config from '../../config';
import { prisma } from '../../lib/prisma';
import { NotFoundError, BadRequestError } from '../../errors/ApiError';
import { Prisma } from '../../../generated/prisma/client';
import { RentalStatus, PaymentStatus } from '../../../generated/prisma/enums';
import {
  IConfirmPaymentBody,
  ICreatePaymentPayload,
  IGetPaymentHistoryQuery,
} from './payment.interface';

const createPaymentInDB = async (
  customerId: string,
  payload: ICreatePaymentPayload,
) => {
  const { rentalOrderId } = payload;

  // Fetch the rental order with customer info
  const rentalOrder = await prisma.rentalOrder.findUnique({
    where: { id: rentalOrderId },
    include: { customer: true },
  });

  if (!rentalOrder) {
    throw new NotFoundError('Rental order not found');
  }

  // Ensure the order belongs to the authenticated customer
  if (rentalOrder.customerId !== customerId) {
    throw new BadRequestError(
      'You are not authorized to make a payment for this order',
    );
  }

  // only CONFIRMED status order can be paid
  if (rentalOrder.status !== RentalStatus.CONFIRMED) {
    throw new BadRequestError(
      `Cannot pay for an order with status '${rentalOrder.status}'`,
    );
  }

  // Check if a successful payment already exists
  const existingPayment = await prisma.payment.findFirst({
    where: {
      rentalOrderId,
      status: PaymentStatus.COMPLETED,
    },
  });

  if (existingPayment) {
    throw new BadRequestError('Payment has already been made for this order');
  }

  const transactionId = `TRNX_ID_${Date.now()}`;

  const customer = rentalOrder.customer;
  const base_url =
    config.app_url === 'development' ? config.app_url : config.prod_url;

  const sslPayload = {
    store_id: config.ssl_commerz_store_id,
    store_passwd: config.ssl_commerz_store_passwd,
    total_amount: Number(rentalOrder.amount),
    currency: 'BDT',
    tran_id: transactionId,
    success_url: `${base_url}/api/payments/confirm?orderId=${rentalOrder.id}&tranId=${transactionId}&status=success`,
    fail_url: `${base_url}/api/payments/confirm?orderId=${rentalOrder.id}&tranId=${transactionId}&status=fail`,
    cancel_url: `${base_url}/api/payments/confirm?orderId=${rentalOrder.id}&tranId=${transactionId}&status=cancel`,
    cus_name: customer.name ?? 'Customer',
    cus_email: customer.email,
    cus_add1: 'N/A',
    cus_add2: 'N/A',
    cus_city: 'N/A',
    cus_state: 'N/A',
    cus_postcode: 1000,
    cus_country: 'Bangladesh',
    cus_phone: '017xxxxxxxx',
    cus_fax: '017xxxxxxxx',
  };

  const response = await axios.post(
    'https://sandbox.sslcommerz.com/gwprocess/v4/api.php',
    sslPayload,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );

  const data = response.data;

  if (!data.GatewayPageURL) {
    throw new BadRequestError(
      'Failed to initiate payment gateway. Please try again.',
    );
  }

  await prisma.payment.create({
    data: {
      transactionId,
      rentalOrderId: rentalOrder.id,
      amount: rentalOrder.amount,
    },
  });

  return {
    gatewayPageURL: data.GatewayPageURL,
    transactionId,
  };
};

const confirmPayment = async (
  orderId: string,
  tranId: string,
  status: string,
  payload: Record<string, unknown>,
) => {
  // Find the payment record by transactionId
  const payment = await prisma.payment.findUnique({
    where: { transactionId: tranId },
    include: { rentalOrder: true },
  });

  if (!payment) {
    throw new NotFoundError('Payment record not found for this transaction');
  }

  // If already completed, return early
  if (payment.status === PaymentStatus.COMPLETED) {
    return 'success';
  }

  // If the redirect status is cancel, mark as failed and return
  if (status === 'cancel') {
    await prisma.payment.update({
      where: { transactionId: tranId },
      data: {
        status: PaymentStatus.FAILED,
        gatewayResponse: JSON.parse(JSON.stringify(payload)),
      },
    });
    return status;
  }

  const validationUrl = `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${payload.val_id}&store_id=${config.ssl_commerz_store_id}&store_passwd=${config.ssl_commerz_store_passwd}&format=json`;

  const response = await axios.get(validationUrl);
  const validationData = response.data;

  // Process based on SSLCommerz validation status
  if (validationData.status === 'VALID') {
    await prisma.$transaction([
      prisma.payment.update({
        where: { transactionId: tranId },
        data: {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
          gatewayResponse: JSON.parse(JSON.stringify(payload)),
        },
      }),
      prisma.rentalOrder.update({
        where: { id: payment.rentalOrderId },
        data: {
          status: RentalStatus.PAID,
        },
      }),
    ]);

    return status;
  }

  // FAILED or INVALID_TRANSACTION
  await prisma.payment.update({
    where: { transactionId: tranId },
    data: {
      status: PaymentStatus.FAILED,
      gatewayResponse: JSON.parse(JSON.stringify(payload)),
    },
  });

  return status;
};

const getPaymentHistory = async (
  customerId: string,
  query: IGetPaymentHistoryQuery,
) => {
  const {
    status,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const where: Prisma.PaymentWhereInput = {
    rentalOrder: {
      customerId,
    },
  };

  if (status) {
    where.status = status as PaymentStatus;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        rentalOrder: {
          select: {
            id: true,
            amount: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
      omit: {
        gatewayResponse: true,
        rentalOrderId: true,
      },
      orderBy: {
        [sortBy as string]: sortOrder,
      },
      skip,
      take: Number(limit),
    }),
    prisma.payment.count({ where }),
  ]);

  const totalPages = Math.ceil(total / Number(limit));

  return {
    payments,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
    },
  };
};

const getPaymentById = async (paymentId: string, customerId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      rentalOrder: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              gearItem: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                },
              },
            },
          },
        },
      },
    },
    omit: {
      gatewayResponse: true,
      rentalOrderId: true,
    },
  });

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  // Ensure the payment belongs to the authenticated customer
  if (payment.rentalOrder.customerId !== customerId) {
    throw new BadRequestError('You are not authorized to view this payment');
  }

  return payment;
};

export const paymentService = {
  createPaymentInDB,
  confirmPayment,
  getPaymentHistory,
  getPaymentById,
};

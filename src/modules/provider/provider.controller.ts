import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { providerService } from './provider.service';
import {
  IGetProviderGearQuery,
  IGetProviderOrdersQuery,
} from './provider.interface';

const createGear = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user?.userId as string;
  const gear = await providerService.createGear(providerId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Gear item created successfully',
    data: gear,
  });
});

const getUserSpecificProviderGear = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId as string;
    const result = await providerService.getUserSpecificProviderGear(
      userId,
      req.query as IGetProviderGearQuery,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'User specific gear retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  },
);

const updateGear = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user?.userId as string;
  const gearId = req.params.gearId as string;
  const gear = await providerService.updateGear(providerId, gearId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Gear item updated successfully',
    data: gear,
  });
});

const getProviderOrderById = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user?.userId as string;
  const role = req.user?.role as string;
  const orderId = req.params.orderId as string;

  const order = await providerService.getProviderOrderById(
    providerId,
    orderId,
    role,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Rental order retrieved successfully',
    data: order,
  });
});

const getProviderOrders = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user?.userId as string;
  const result = await providerService.getProviderOrders(
    providerId,
    req.query as IGetProviderOrdersQuery,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Provider orders retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user?.userId as string;
  const orderId = req.params.orderId as string;
  const { status } = req.body;

  const order = await providerService.updateOrderStatus(
    providerId,
    orderId,
    status,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `Order status updated to '${status}' successfully`,
    data: order,
  });
});

export const providerController = {
  createGear,
  getUserSpecificProviderGear,
  updateGear,
  getProviderOrders,
  getProviderOrderById,
  updateOrderStatus,
};

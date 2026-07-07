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

export const providerController = {
  createGear,
  getUserSpecificProviderGear,
  updateGear,
  getProviderOrders,
};

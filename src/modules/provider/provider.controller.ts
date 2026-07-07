import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { providerService } from './provider.service';
import { IGetProviderGearQuery } from './provider.interface';

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

export const providerController = {
  createGear,
  getUserSpecificProviderGear,
};

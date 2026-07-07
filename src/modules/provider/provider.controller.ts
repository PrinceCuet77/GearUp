import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { providerService } from './provider.service';

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

export const providerController = {
  createGear,
};

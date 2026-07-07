import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { gearService } from './gear.service';
import { NotFoundError } from '../../errors/ApiError';

const getGearById = catchAsync(async (req: Request, res: Response) => {
  const { gearId } = req.params;

  const gear = await gearService.getGearById(gearId as string);

  if (!gear) {
    throw new NotFoundError('Gear item not found');
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Gear retrieved successfully',
    data: gear,
  });
});

const getAllGears = catchAsync(async (req: Request, res: Response) => {
  const result = await gearService.getAllGears(req.query as any);

  console.log(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Gears retrieved successfully',
    data: result.gears,
    meta: result.meta,
  });
});

const getGearReviews = catchAsync(async (req: Request, res: Response) => {
  const { gearId } = req.params;
  const gear = await gearService.getGearById(gearId as string);

  if (!gear) {
    throw new NotFoundError('Gear item not found');
  }

  const result = await gearService.getGearReviews(
    gearId as string,
    req.query as any,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Reviews retrieved successfully',
    data: result.reviews,
    meta: result.meta,
  });
});

export const gearController = {
  getGearById,
  getAllGears,
  getGearReviews,
};

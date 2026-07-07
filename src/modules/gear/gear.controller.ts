import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { gearService } from './gear.service';

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

export const gearController = {
  getAllGears,
};

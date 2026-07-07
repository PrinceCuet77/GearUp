import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { authService } from './auth.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

const registerUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await authService.registerUserIntoDB(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: 'User registered successfully',
      data: { user },
    });
  },
);

export const authController = {
  registerUser,
};

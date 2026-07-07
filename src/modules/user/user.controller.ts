import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { userService } from './user.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

const getUserDetails = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserDetailsFromDB(req.user?.userId!);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'User profile retrieved successfully',
    data: user,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateMyProfileInDB(req.user?.userId!, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Profile updated successfully',
    data: user,
  });
});

export const userController = {
  getUserDetails,
  updateMyProfile,
};

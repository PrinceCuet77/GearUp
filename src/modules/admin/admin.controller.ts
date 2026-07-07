import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { adminService } from './admin.service';

const getAllUserDetails = catchAsync(async (req: Request, res: Response) => {
  const users = await adminService.getAllUsers();

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Users retrieved successfully',
    data: users,
  });
});

const getUserDetailsById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const user = await adminService.getUserDetailsById(userId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'User details retrieved successfully',
    data: user,
  });
});

export const adminController = {
  getAllUserDetails,
  getUserDetailsById,
};

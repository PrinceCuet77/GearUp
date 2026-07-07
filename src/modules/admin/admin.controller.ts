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

export const adminController = {
  getAllUserDetails,
};

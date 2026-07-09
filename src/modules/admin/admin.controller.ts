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

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const { status } = req.body;

  const user = await adminService.updateUserStatus(userId, status);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'User status updated successfully',
    data: user,
  });
});

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await adminService.createCategory(req.body);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: 'Category created successfully',
    data: category,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const categoryId = req.params.categoryId as string;
  const category = await adminService.updateCategory(categoryId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Category updated successfully',
    data: category,
  });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const categoryId = req.params.categoryId as string;
  const category = await adminService.getCategoryById(categoryId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Category details retrieved successfully',
    data: category,
  });
});

const getAllGears = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  };
  const result = await adminService.getAllGears(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'All gear items retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

export const adminController = {
  getAllUserDetails,
  getUserDetailsById,
  updateUserStatus,
  createCategory,
  updateCategory,
  getCategoryById,
  getAllGears,
};

import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { categoryService } from './category.service';

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await categoryService.getAllCategories();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Categories retrieved successfully',
    data: categories,
  });
});

export const categoryController = {
  getAllCategories,
};

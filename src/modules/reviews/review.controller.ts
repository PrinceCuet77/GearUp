import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { reviewService } from './review.service';

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId as string;
  const reviewId = req.params.reviewId as string;
  const review = await reviewService.getReviewById(customerId, reviewId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Review retrieved successfully',
    data: review,
  });
});

const createReview = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId as string;
  const review = await reviewService.createReview(customerId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Review created successfully',
    data: review,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId as string;
  const reviewId = req.params.reviewId as string;
  const review = await reviewService.updateReview(
    customerId,
    reviewId,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Review updated successfully',
    data: review,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId as string;
  const reviewId = req.params.reviewId as string;
  await reviewService.deleteReview(customerId, reviewId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Review deleted successfully',
    data: null,
  });
});

export const reviewController = {
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
};

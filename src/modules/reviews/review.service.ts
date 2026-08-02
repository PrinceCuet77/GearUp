import { prisma } from '../../lib/prisma';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../../errors/ApiError';
import { ICreateReviewPayload, IUpdateReviewPayload } from './review.interface';

const createReview = async (
  customerId: string,
  payload: ICreateReviewPayload,
) => {
  const { rentalOrderId, rating, comment } = payload;

  // Verify the rental order exists and belongs to this customer
  const rentalOrder = await prisma.rentalOrder.findUnique({
    where: { id: rentalOrderId },
    include: {
      items: {
        select: {
          gearItemId: true,
        },
      },
    },
  });

  if (!rentalOrder) {
    throw new NotFoundError('Rental order not found');
  }

  if (rentalOrder.customerId !== customerId) {
    throw new ForbiddenError(
      'You are not authorized to review this rental order',
    );
  }

  // Verify the order status is RETURNED
  if (rentalOrder.status !== 'RETURNED') {
    throw new BadRequestError(
      'You can only review after the order has been returned',
    );
  }

  if (!rentalOrder.items.length) {
    throw new BadRequestError('This rental order has no gear items to review');
  }

  // Check if the customer already reviewed this rental order
  const existingReview = await prisma.review.findFirst({
    where: {
      customerId,
      rentalOrderId,
    },
  });

  if (existingReview) {
    throw new BadRequestError('You have already reviewed this rental order');
  }

  // Create a review for EVERY gear item in the rental order (same rating & comment)
  const reviewData = rentalOrder.items.map((item) => ({
    customerId,
    rentalOrderId,
    gearItemId: item.gearItemId,
    rating,
    comment,
  }));

  await prisma.review.createMany({ data: reviewData });

  // Return one representative review with full relations
  const createdReview = await prisma.review.findFirst({
    where: {
      customerId,
      rentalOrderId,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      gearItem: {
        select: {
          id: true,
          name: true,
        },
      },
      rentalOrder: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  return createdReview;
};

const getReviewById = async (customerId: string, reviewId: string) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      gearItem: {
        select: {
          id: true,
          name: true,
        },
      },
      rentalOrder: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  if (review.customerId !== customerId) {
    throw new ForbiddenError('You are not authorized to view this review');
  }

  return review;
};

const updateReview = async (
  customerId: string,
  reviewId: string,
  payload: IUpdateReviewPayload,
) => {
  // Find the review to get the rental order ID
  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!existingReview) {
    throw new NotFoundError('Review not found');
  }

  // Check ownership
  if (existingReview.customerId !== customerId) {
    throw new ForbiddenError('You are not authorized to update this review');
  }

  // Update ALL reviews for this rental order
  await prisma.review.updateMany({
    where: {
      rentalOrderId: existingReview.rentalOrderId,
      customerId,
    },
    data: payload,
  });

  // Return one representative updated review with full relations
  const updatedReview = await prisma.review.findFirst({
    where: {
      rentalOrderId: existingReview.rentalOrderId,
      customerId,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      gearItem: {
        select: {
          id: true,
          name: true,
        },
      },
      rentalOrder: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  return updatedReview;
};

const deleteReview = async (customerId: string, reviewId: string) => {
  // Find the review to get the rental order ID
  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!existingReview) {
    throw new NotFoundError('Review not found');
  }

  // Check ownership
  if (existingReview.customerId !== customerId) {
    throw new ForbiddenError('You are not authorized to delete this review');
  }

  // Delete ALL reviews for this rental order
  await prisma.review.deleteMany({
    where: {
      rentalOrderId: existingReview.rentalOrderId,
      customerId,
    },
  });

  return existingReview;
};

const getMyReviews = async (
  customerId: string,
  query: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  },
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder || 'desc';

  const skip = (page - 1) * limit;

  // Find distinct rental order IDs reviewed by this customer
  const reviewedRentals = await prisma.review.findMany({
    where: { customerId },
    select: { rentalOrderId: true },
    distinct: ['rentalOrderId'],
  });

  const rentalOrderIds = reviewedRentals.map((r) => r.rentalOrderId);

  const total = rentalOrderIds.length;

  // Get one review per rental order
  const reviews = await prisma.review.findMany({
    where: {
      customerId,
      rentalOrderId: { in: rentalOrderIds },
    },
    distinct: ['rentalOrderId'],
    include: {
      gearItem: {
        select: {
          id: true,
          name: true,
        },
      },
      rentalOrder: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip,
    take: limit,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    reviews,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const reviewService = {
  getReviewById,
  getMyReviews,
  createReview,
  updateReview,
  deleteReview,
};

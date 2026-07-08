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
  const { rentalOrderId, gearItemId, rating, comment } = payload;

  // Verify the rental order exists and belongs to this customer
  const rentalOrder = await prisma.rentalOrder.findUnique({
    where: { id: rentalOrderId },
    include: {
      items: {
        where: { gearItemId },
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

  // Verify the gear item is part of this rental order
  if (rentalOrder.items.length === 0) {
    throw new BadRequestError(
      'The specified gear item is not part of this rental order',
    );
  }

  // Check if the customer already reviewed this gear item for this order
  const existingReview = await prisma.review.findFirst({
    where: {
      customerId,
      rentalOrderId,
      gearItemId,
    },
  });

  if (existingReview) {
    throw new BadRequestError(
      'You have already reviewed this gear item for this rental order',
    );
  }

  // Create the review
  const review = await prisma.review.create({
    data: {
      customerId,
      rentalOrderId,
      gearItemId,
      rating,
      comment,
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

  return review;
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
  // Check if the review exists
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

  // Update the review
  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: payload,
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
  // Check if the review exists
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

  // Delete the review
  await prisma.review.delete({
    where: { id: reviewId },
  });

  return existingReview;
};

export const reviewService = {
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
};

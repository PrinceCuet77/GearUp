import bcrypt from 'bcryptjs';
import { RentalStatus } from '../../../generated/prisma/enums';
import { prisma } from '../../lib/prisma';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../../errors/ApiError';

const getUserDetailsFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: {
      password: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

const updateMyProfileInDB = async (
  userId: string,
  payload: { name?: string; avatarUrl?: string },
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: payload,
    omit: { password: true },
  });

  return updatedUser;
};

const changeMyPasswordInDB = async (
  userId: string,
  payload: { oldPassword: string; newPassword: string },
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Google-only accounts have no password to change.
  if (!user.password) {
    throw new BadRequestError(
      'This account signs in with Google and has no password to change.',
    );
  }

  const isPasswordValid = await bcrypt.compare(
    payload.oldPassword,
    user.password,
  );

  if (!isPasswordValid) {
    throw new UnauthorizedError('Old password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

const getCustomerDashboard = async (customerId: string) => {
  const [totalOrders, activeRentals, paymentsMade, reviewsGiven, recentOrders] =
    await Promise.all([
      prisma.rentalOrder.count({ where: { customerId } }),
      prisma.rentalOrder.count({
        where: {
          customerId,
          status: { in: [RentalStatus.PAID, RentalStatus.PICKED_UP] },
        },
      }),
      prisma.payment.count({
        where: { rentalOrder: { customerId } },
      }),
      prisma.review.count({ where: { customerId } }),
      prisma.rentalOrder.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

  return {
    stats: {
      totalOrders,
      activeRentals,
      paymentsMade,
      reviewsGiven,
    },
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      status: order.status,
      startDate: order.startDate,
      endDate: order.endDate,
      amount: order.amount.toString(),
      customerId: order.customerId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    })),
  };
};

export const userService = {
  getUserDetailsFromDB,
  updateMyProfileInDB,
  changeMyPasswordInDB,
  getCustomerDashboard,
};

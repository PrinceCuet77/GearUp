import { prisma } from '../../lib/prisma';
import { ApiError } from '../../errors/ApiError';
import { UserStatus } from '../../../generated/prisma/enums';

const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    omit: {
      password: true,
    },
  });

  return users;
};

const getUserDetailsById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: {
      password: true,
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
};

const updateUserStatus = async (userId: string, status: UserStatus) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status },
    omit: {
      password: true,
    },
  });

  return updatedUser;
};

const createCategory = async (data: { name: string; description?: string }) => {
  const existingCategory = await prisma.category.findUnique({
    where: { name: data.name },
  });

  if (existingCategory) {
    throw new ApiError(409, 'Category with this name already exists');
  }

  const category = await prisma.category.create({
    data,
  });

  return category;
};

export const adminService = {
  getAllUsers,
  getUserDetailsById,
  updateUserStatus,
  createCategory,
};

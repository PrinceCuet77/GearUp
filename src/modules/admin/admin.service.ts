import { prisma } from '../../lib/prisma';
import { ApiError, ConflictError, NotFoundError } from '../../errors/ApiError';
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
    include: {
      gearItems: true,
    },
  });

  if (existingCategory) {
    throw new ConflictError('Category with this name already exists');
  }

  const category = await prisma.category.create({
    data,
  });

  return category;
};

const updateCategory = async (
  categoryId: string,
  data: { name?: string; description?: string },
) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      gearItems: true,
    },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  if (data.name) {
    const existingCategory = await prisma.category.findUnique({
      where: { name: data.name },
    });

    if (existingCategory && existingCategory.id !== categoryId) {
      throw new ConflictError('Category with this name already exists');
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id: categoryId },
    data,
  });

  return updatedCategory;
};

const getCategoryById = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      gearItems: true,
    },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  return category;
};

export const adminService = {
  getAllUsers,
  getUserDetailsById,
  updateUserStatus,
  createCategory,
  updateCategory,
  getCategoryById,
};

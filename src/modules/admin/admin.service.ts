import { Prisma } from '../../../generated/prisma/client';
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
    include: {
      gearItems: true,
    },
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

const getAllGears = async (query: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const {
    category,
    minPrice,
    maxPrice,
    search,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const where: Prisma.GearItemWhereInput = {};

  if (category) {
    where.category = {
      name: { contains: String(category), mode: 'insensitive' },
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};

    if (minPrice !== undefined) {
      where.price.gte = Number(minPrice);
    }

    if (maxPrice !== undefined) {
      where.price.lte = Number(maxPrice);
    }
  }

  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    prisma.gearItem.findMany({
      where,
      include: {
        category: true,
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        [sortBy as string]: sortOrder,
      },
      skip,
      take: Number(limit),
    }),
    prisma.gearItem.count({ where }),
  ]);

  const totalPages = Math.ceil(total / Number(limit));

  return {
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
    },
  };
};

export const adminService = {
  getAllUsers,
  getUserDetailsById,
  updateUserStatus,
  createCategory,
  updateCategory,
  getCategoryById,
  getAllGears,
};

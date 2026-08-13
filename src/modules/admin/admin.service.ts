import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError, ConflictError, NotFoundError } from '../../errors/ApiError';
import { UserStatus } from '../../../generated/prisma/enums';

const getAllUsers = async (query: {
  search?: string;
  role?: string;
  status?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const {
    search,
    role,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { email: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role as any;
  }

  if (status) {
    where.status = status as any;
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      omit: {
        password: true,
      },
      orderBy: {
        [sortBy as string]: sortOrder,
      },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
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
  minPrice?: string | number;
  maxPrice?: string | number;
  search?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const { category, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  const minPrice =
    query.minPrice !== undefined ? Number(query.minPrice) : undefined;
  const maxPrice =
    query.maxPrice !== undefined ? Number(query.maxPrice) : undefined;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const where: Prisma.GearItemWhereInput = {};

  if (category) {
    where.categoryId = String(category);
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};

    if (minPrice !== undefined) {
      where.price.gte = minPrice;
    }

    if (maxPrice !== undefined) {
      where.price.lte = maxPrice;
    }
  }

  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

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
      take: limit,
    }),
    prisma.gearItem.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

const getAllRentals = async (query: {
  status?: string;
  customerId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string | number;
  maxAmount?: string | number;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const {
    status,
    customerId,
    search,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const minAmount =
    query.minAmount !== undefined ? Number(query.minAmount) : undefined;
  const maxAmount =
    query.maxAmount !== undefined ? Number(query.maxAmount) : undefined;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const where: Prisma.RentalOrderWhereInput = {};

  if (status) {
    where.status = status as any;
  }

  if (customerId) {
    where.customerId = String(customerId);
  }

  if (search) {
    where.customer = {
      OR: [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ],
    };
  }

  if (startDate || endDate) {
    where.startDate = {};

    if (startDate) {
      where.startDate.gte = new Date(startDate);
    }

    if (endDate) {
      where.startDate.lte = new Date(endDate);
    }
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    where.amount = {};

    if (minAmount !== undefined) {
      where.amount.gte = minAmount;
    }

    if (maxAmount !== undefined) {
      where.amount.lte = maxAmount;
    }
  }

  const skip = (page - 1) * limit;

  const [data, total, statusCounts] = await Promise.all([
    prisma.rentalOrder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            gearItem: {
              select: {
                id: true,
                name: true,
                images: true,
                provider: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            transactionId: true,
            amount: true,
            status: true,
            paidAt: true,
          },
        },
      },
      orderBy: {
        [sortBy as string]: sortOrder,
      },
      skip,
      take: limit,
    }),
    prisma.rentalOrder.count({ where }),
    prisma.rentalOrder.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const totalRentals = statusCounts.reduce(
    (sum, entry) => sum + entry._count,
    0,
  );

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      totalRentals,
      statusCounts: statusCounts.reduce(
        (acc, entry) => {
          acc[entry.status] = entry._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    },
  };
};

const getAdminDashboard = async () => {
  const [totalUsers, activeGears, totalRentals, totalCategories] =
    await Promise.all([
      prisma.user.count(),
      prisma.gearItem.count({ where: { isActive: true } }),
      prisma.rentalOrder.count(),
      prisma.category.count(),
    ]);

  return {
    stats: {
      totalUsers,
      activeGears,
      totalRentals,
      totalCategories,
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
  getAllRentals,
  getAdminDashboard,
};

import { Prisma, RentalStatus } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../errors/ApiError';
import {
  ICreateGearPayload,
  IUpdateGearPayload,
  IGetProviderGearQuery,
  IGetProviderOrdersQuery,
} from './provider.interface';

const createGear = async (providerId: string, payload: ICreateGearPayload) => {
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  const gear = await prisma.gearItem.create({
    data: {
      name: payload.name,
      description: payload.description,
      price: payload.price,
      stock: payload.stock ?? 1,
      images: payload.images,
      providerId,
      categoryId: payload.categoryId,
    },
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
  });

  return gear;
};

const getUserSpecificProviderGear = async (
  userId: string,
  query: IGetProviderGearQuery,
) => {
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

  const where: Prisma.GearItemWhereInput = {
    providerId: userId,
  };

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

const updateGear = async (
  providerId: string,
  gearId: string,
  payload: IUpdateGearPayload,
) => {
  const gear = await prisma.gearItem.findUnique({
    where: { id: gearId },
  });

  if (!gear) {
    throw new NotFoundError('Gear item not found');
  }

  if (gear.providerId !== providerId) {
    throw new ForbiddenError('You are not authorized to update this gear item');
  }

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }
  }

  const updated = await prisma.gearItem.update({
    where: { id: gearId },
    data: payload,
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
  });

  return updated;
};

const getProviderOrders = async (
  providerId: string,
  query: IGetProviderOrdersQuery,
) => {
  const { status, page = 1, limit = 10 } = query;

  const where: Prisma.RentalOrderWhereInput = {
    items: {
      some: {
        gearItem: {
          providerId,
        },
      },
    },
  };

  if (status) {
    where.status = status as RentalStatus;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    prisma.rentalOrder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          where: {
            gearItem: {
              providerId,
            },
          },
          include: {
            gearItem: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            paidAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: Number(limit),
    }),
    prisma.rentalOrder.count({ where }),
  ]);

  const totalPages = Math.ceil(total / Number(limit));

  return {
    data: orders,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
    },
  };
};

export const providerService = {
  createGear,
  getUserSpecificProviderGear,
  updateGear,
  getProviderOrders,
};

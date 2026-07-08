import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { IGetAllGearsQuery, IGetGearReviewsQuery } from './gear.interface';

const getAllGears = async (query: IGetAllGearsQuery) => {
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
    isActive: true,
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

  const [gears, total] = await Promise.all([
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
        rentalOrderItems: {
          omit: {
            rentalOrderId: true,
            gearItemId: true,
          },
        },
        reviews: {
          omit: {
            customerId: true,
            gearItemId: true,
            rentalOrderId: true,
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
    gears,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
    },
  };
};

const getGearById = async (gearId: string) => {
  const gear = await prisma.gearItem.findUnique({
    where: {
      id: gearId,
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
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  return gear;
};

const getGearReviews = async (gearId: string, query: IGetGearReviewsQuery) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: {
        gearItemId: gearId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: Number(limit),
    }),
    prisma.review.count({
      where: {
        gearItemId: gearId,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / Number(limit));

  return {
    reviews,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
    },
  };
};

export const gearService = {
  getAllGears,
  getGearById,
  getGearReviews,
};

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

const getProviderOrderById = async (
  providerId: string,
  orderId: string,
  role: string,
) => {
  const where: Prisma.RentalOrderWhereInput = {
    id: orderId,
  };

  // If the user is a provider (not admin), ensure the order contains their gear
  if (role !== 'ADMIN') {
    where.items = {
      some: {
        gearItem: {
          providerId,
        },
      },
    };
  }

  const order = await prisma.rentalOrder.findFirst({
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
        where: role !== 'ADMIN' ? { gearItem: { providerId } } : undefined,
        include: {
          gearItem: {
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
              stock: true,
              isActive: true,
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
  });

  if (!order) {
    throw new NotFoundError('Rental order not found');
  }

  return order;
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

// Valid status transitions for providers
const PROVIDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PAID', 'CANCELLED'],
  PAID: ['PICKED_UP'],
  PICKED_UP: ['RETURNED'],
};

const updateOrderStatus = async (
  providerId: string,
  orderId: string,
  newStatus: string,
) => {
  // Find the order with its items
  const order = await prisma.rentalOrder.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          gearItem: {
            select: {
              id: true,
              providerId: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Rental order not found');
  }

  // Verify the provider owns at least one gear item in this order
  const hasProviderGear = order.items.some(
    (item) => item.gearItem.providerId === providerId,
  );

  if (!hasProviderGear) {
    throw new ForbiddenError(
      'You are not authorized to update this order. This order does not contain your gear items.',
    );
  }

  // Validate the status transition
  const allowedTransitions = PROVIDER_STATUS_TRANSITIONS[order.status];

  if (!allowedTransitions) {
    throw new ConflictError(
      `Order cannot be updated from '${order.status}' status`,
    );
  }

  if (!allowedTransitions.includes(newStatus)) {
    throw new ConflictError(
      `Cannot transition order from '${order.status}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.join(', ')}`,
    );
  }

  // Update the order status
  const updatedOrder = await prisma.rentalOrder.update({
    where: { id: orderId },
    data: { status: newStatus as any },
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
              price: true,
            },
          },
        },
      },
    },
  });

  return updatedOrder;
};

export const providerService = {
  createGear,
  getUserSpecificProviderGear,
  updateGear,
  getProviderOrders,
  getProviderOrderById,
  updateOrderStatus,
};

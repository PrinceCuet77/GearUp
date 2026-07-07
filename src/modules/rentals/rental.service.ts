import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../../errors/ApiError';
import {
  ICreateRentalPayload,
  IGetCustomerRentalsQuery,
} from './rental.interface';

const createRental = async (
  customerId: string,
  payload: ICreateRentalPayload,
) => {
  const { startDate, endDate, items } = payload;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start < new Date()) {
    throw new BadRequestError('Start date cannot be in the past');
  }

  // Calculate rental days (minimum 1 day)
  const timeDiff = end.getTime() - start.getTime();
  const rentalDays = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

  const rentalOrder = await prisma.$transaction(async (tx) => {
    // Fetch all gear items and validate availability
    const gearItemIds = items.map((item) => item.gearItemId);
    const gearItems = await tx.gearItem.findMany({
      where: {
        id: { in: gearItemIds },
        isActive: true,
      },
    });

    // Check if all requested gear items exist
    if (gearItems.length !== gearItemIds.length) {
      const foundIds = gearItems.map((item) => item.id);
      const missingIds = gearItemIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(
        `Gear items not found or inactive: ${missingIds.join(', ')}`,
      );
    }

    // Check stock availability for each item
    for (const item of items) {
      const gearItem = gearItems.find((g) => g.id === item.gearItemId);
      if (gearItem && gearItem.stock < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for "${gearItem.name}". Available: ${gearItem.stock}, requested: ${item.quantity}`,
        );
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItemsData: {
      gearItemId: string;
      quantity: number;
      price: Prisma.Decimal;
    }[] = [];

    for (const item of items) {
      const gearItem = gearItems.find((g) => g.id === item.gearItemId)!;
      const itemPrice = new Prisma.Decimal(gearItem.price)
        .mul(rentalDays)
        .mul(item.quantity);
      totalAmount += Number(itemPrice);

      orderItemsData.push({
        gearItemId: item.gearItemId,
        quantity: item.quantity,
        price: itemPrice,
      });
    }

    // Create the order
    const order = await tx.rentalOrder.create({
      data: {
        customerId,
        startDate: start,
        endDate: end,
        amount: totalAmount,
        status: 'PLACED',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
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
      },
    });

    // Reduce stock for each item
    for (const item of items) {
      await tx.gearItem.update({
        where: { id: item.gearItemId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return order;
  });

  return rentalOrder;
};

const getCustomerRentals = async (
  customerId: string,
  query: IGetCustomerRentalsQuery,
) => {
  const {
    status,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const where: Prisma.RentalOrderWhereInput = {
    customerId,
  };

  if (status) {
    where.status = status as any;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [rentals, total] = await Promise.all([
    prisma.rentalOrder.findMany({
      where,
      include: {
        items: {
          include: {
            gearItem: {
              select: {
                id: true,
                name: true,
                images: true,
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
      take: Number(limit),
    }),
    prisma.rentalOrder.count({ where }),
  ]);

  const totalPages = Math.ceil(total / Number(limit));

  return {
    rentals,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
    },
  };
};

export const rentalService = {
  createRental,
  getCustomerRentals,
};

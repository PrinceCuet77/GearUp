import { prisma } from '../../lib/prisma';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../errors/ApiError';
import { ICreateGearPayload, IUpdateGearPayload } from './provider.interface';

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

export const providerService = {
  createGear,
};

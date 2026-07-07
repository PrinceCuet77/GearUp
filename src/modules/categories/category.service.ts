import { prisma } from '../../lib/prisma';

const getAllCategories = async () => {
  return prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  });
};

export const categoryService = {
  getAllCategories,
};

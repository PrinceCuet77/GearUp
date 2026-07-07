import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../errors/ApiError';

const getUserDetailsFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: {
      password: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

export const userService = {
  getUserDetailsFromDB,
};

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

const updateMyProfileInDB = async (
  userId: string,
  payload: { name?: string; avatarUrl?: string },
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: payload,
    omit: { password: true },
  });

  return updatedUser;
};

export const userService = {
  getUserDetailsFromDB,
  updateMyProfileInDB,
};

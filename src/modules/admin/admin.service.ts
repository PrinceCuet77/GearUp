import { prisma } from '../../lib/prisma';
import { ApiError } from '../../errors/ApiError';

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

export const adminService = {
  getAllUsers,
  getUserDetailsById,
};

import { prisma } from '../../lib/prisma';

const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    omit: {
      password: true,
    },
  });

  return users;
};

export const adminService = {
  getAllUsers,
};

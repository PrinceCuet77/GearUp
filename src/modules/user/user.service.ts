import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { NotFoundError, UnauthorizedError } from '../../errors/ApiError';

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

const changeMyPasswordInDB = async (
  userId: string,
  payload: { oldPassword: string; newPassword: string },
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const isPasswordValid = await bcrypt.compare(
    payload.oldPassword,
    user.password,
  );

  if (!isPasswordValid) {
    throw new UnauthorizedError('Old password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

export const userService = {
  getUserDetailsFromDB,
  updateMyProfileInDB,
  changeMyPasswordInDB,
};

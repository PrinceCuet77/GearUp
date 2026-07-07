import bcrypt from 'bcryptjs';
import config from '../../config';
import { prisma } from '../../lib/prisma';
import { IRegistrationUserPayload } from './auth.interface';
import { ConflictError } from '../../errors/ApiError';

const registerUserIntoDB = async (payload: IRegistrationUserPayload) => {
  const { email, password, role } = payload;
  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist) {
    throw new ConflictError('A user with this email already exists!');
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  const createdUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role,
    },
  });

  const user = await prisma.user.findUnique({
    where: {
      id: createdUser.id,
    },
    omit: {
      password: true,
    },
  });

  return user;
};

export const authService = {
  registerUserIntoDB,
};

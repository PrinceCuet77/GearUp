import bcrypt from 'bcryptjs';
import config from '../../config';
import { prisma } from '../../lib/prisma';
import { ILoginUserPayload, IRegistrationUserPayload } from './auth.interface';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../errors/ApiError';
import { jwtUtils } from '../../utils/jwt';
import { SignOptions } from 'jsonwebtoken';
import { UserRole, UserStatus } from '../../../generated/prisma/enums';

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

const loginUser = async (payload: ILoginUserPayload) => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new ForbiddenError(
      'Your account has been suspended. Please contact support.',
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid password');
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (refreshToken: string) => {
  const verifiedRefreshToken = jwtUtils.verifyToken(
    refreshToken,
    config.jwt_refresh_secret,
  );

  if (!verifiedRefreshToken.success) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const { userId, email, role } = verifiedRefreshToken.data as {
    userId: string;
    email: string;
    role: UserRole;
  };

  const jwtPayload = {
    userId,
    email,
    role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  return {
    accessToken,
  };
};

export const authService = {
  registerUserIntoDB,
  loginUser,
  refreshToken,
};

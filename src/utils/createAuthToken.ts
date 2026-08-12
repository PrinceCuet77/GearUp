import { type SignOptions } from 'jsonwebtoken';
import { UserRole } from '../../generated/prisma/enums';
import config from '../config';
import { jwtUtils } from './jwt';

export const createAuthTokens = (jwtPayload: {
  userId: string;
  email: string;
  role: UserRole;
}) => {
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

  return { accessToken, refreshToken };
};

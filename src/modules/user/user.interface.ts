import { UserRole, UserStatus } from '../../../generated/prisma/enums';

export interface IUserResponse {
  userId: string;
  name?: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

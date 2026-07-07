import { UserRole } from '../../../generated/prisma/enums';

export interface IRegistrationUserPayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface ILoginUserPayload {
  email: string;
  password: string;
}

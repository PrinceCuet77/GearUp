import { z } from 'zod';

export const registerUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(20, 'Password cannot exceed 20 characters'),
  role: z.enum(['CUSTOMER', 'PROVIDER', 'ADMIN']).optional(), // Or required based on logic
});

export const loginUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Used by the role-dedicated /google/customer and /google/provider entry
// points — the role is fixed by the route, so clients only ever pass `redirect`.
export const googleAuthRedirectQuerySchema = z.object({
  redirect: z
    .string()
    .startsWith('/', 'redirect must be a relative path')
    .optional(),
});

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  })
  .passthrough();

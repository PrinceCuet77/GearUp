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

export const googleAuthQuerySchema = z.object({
  // ADMIN is deliberately absent — roles must never be self-grantable.
  role: z.enum(['CUSTOMER', 'PROVIDER']).optional(),
  // Where to send the browser once the callback finishes. Relative paths only;
  // enforced again in resolveFrontendRedirect.
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

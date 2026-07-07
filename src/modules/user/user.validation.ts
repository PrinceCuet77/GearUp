import { z } from 'zod';

const updateMyProfile = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL').optional(),
});

const changePassword = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .max(20, 'New password cannot exceed 20 characters'),
});

export const userValidation = {
  updateMyProfile,
  changePassword,
};

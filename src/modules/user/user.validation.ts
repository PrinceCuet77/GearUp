import { z } from 'zod';

const updateMyProfile = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  avatarUrl: z
    .string()
    .url('Avatar URL must be a valid URL')
    .max(255, 'Avatar URL cannot exceed 255 characters')
    .optional(),
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

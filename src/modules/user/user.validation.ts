import { z } from 'zod';

const updateMyProfile = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL').optional(),
});

export const userValidation = {
  updateMyProfile,
};

import { z } from 'zod';

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(50).optional(),
});

export type SignIn = z.infer<typeof SignInSchema>;
export type SignUp = z.infer<typeof SignUpSchema>;

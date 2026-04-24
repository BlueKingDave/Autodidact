import { z } from 'zod';

export const SendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  sessionId: z.string().uuid(),
});

export const CreateSessionSchema = z.object({
  moduleId: z.string().uuid(),
  courseId: z.string().uuid(),
});

export type SendMessage = z.infer<typeof SendMessageSchema>;
export type CreateSession = z.infer<typeof CreateSessionSchema>;

import { z } from 'zod';

export const SendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

export const CreateChatSessionSchema = z.object({
  moduleId: z.string().uuid(),
});

export type SendMessage = z.infer<typeof SendMessageSchema>;
export type CreateChatSession = z.infer<typeof CreateChatSessionSchema>;

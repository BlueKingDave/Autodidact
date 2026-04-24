import { describe, it, expect } from 'vitest';
import { SendMessageSchema, CreateChatSessionSchema } from '../chat.js';

describe('SendMessageSchema', () => {
  it('accepts content of 1 character', () => {
    expect(() => SendMessageSchema.parse({ content: 'a' })).not.toThrow();
  });

  it('accepts content of 4000 characters', () => {
    expect(() => SendMessageSchema.parse({ content: 'a'.repeat(4000) })).not.toThrow();
  });

  it('rejects empty string', () => {
    const result = SendMessageSchema.safeParse({ content: '' });
    expect(result.success).toBe(false);
  });

  it('rejects content exceeding 4000 characters', () => {
    const result = SendMessageSchema.safeParse({ content: 'a'.repeat(4001) });
    expect(result.success).toBe(false);
  });

  it('rejects missing content field', () => {
    const result = SendMessageSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('CreateChatSessionSchema', () => {
  it('accepts a valid UUID for moduleId', () => {
    expect(() =>
      CreateChatSessionSchema.parse({ moduleId: '123e4567-e89b-12d3-a456-426614174000' }),
    ).not.toThrow();
  });

  it('rejects a non-UUID string', () => {
    const result = CreateChatSessionSchema.safeParse({ moduleId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects missing moduleId', () => {
    const result = CreateChatSessionSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

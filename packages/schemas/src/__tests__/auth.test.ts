import { describe, it, expect } from 'vitest';
import { SignInSchema, SignUpSchema } from '../auth.js';

describe('SignInSchema', () => {
  it('accepts valid email and password', () => {
    expect(() => SignInSchema.parse({ email: 'user@example.com', password: 'password123' })).not.toThrow();
  });

  it('rejects invalid email format', () => {
    const result = SignInSchema.safeParse({ email: 'not-an-email', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = SignInSchema.safeParse({ email: 'user@example.com', password: 'short' });
    expect(result.success).toBe(false);
  });

  it('accepts password of exactly 8 characters', () => {
    expect(() => SignInSchema.parse({ email: 'user@example.com', password: '12345678' })).not.toThrow();
  });

  it('rejects missing email', () => {
    const result = SignInSchema.safeParse({ password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = SignInSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(false);
  });
});

describe('SignUpSchema', () => {
  it('accepts email, password without displayName', () => {
    expect(() => SignUpSchema.parse({ email: 'user@example.com', password: 'password123' })).not.toThrow();
  });

  it('accepts email, password, and displayName within 2–50 chars', () => {
    expect(() =>
      SignUpSchema.parse({ email: 'user@example.com', password: 'password123', displayName: 'Alice' }),
    ).not.toThrow();
  });

  it('rejects displayName shorter than 2 characters', () => {
    const result = SignUpSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      displayName: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('rejects displayName longer than 50 characters', () => {
    const result = SignUpSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      displayName: 'A'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('accepts displayName of exactly 2 characters', () => {
    expect(() =>
      SignUpSchema.parse({ email: 'user@example.com', password: 'password123', displayName: 'Al' }),
    ).not.toThrow();
  });

  it('accepts displayName of exactly 50 characters', () => {
    expect(() =>
      SignUpSchema.parse({ email: 'user@example.com', password: 'password123', displayName: 'A'.repeat(50) }),
    ).not.toThrow();
  });
});

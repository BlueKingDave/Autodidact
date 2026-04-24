import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

const UserSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
  email: z.string().email(),
});

const WithDefaultSchema = z.object({
  topic: z.string(),
  moduleCount: z.number().default(5),
});

describe('ZodValidationPipe.transform()', () => {
  describe('valid input', () => {
    it('returns the parsed value unchanged for a valid object', () => {
      const pipe = new ZodValidationPipe(UserSchema);
      const result = pipe.transform({ name: 'Alice', age: 30, email: 'alice@example.com' });
      expect(result).toEqual({ name: 'Alice', age: 30, email: 'alice@example.com' });
    });

    it('applies schema defaults when optional fields are omitted', () => {
      const pipe = new ZodValidationPipe(WithDefaultSchema);
      const result = pipe.transform({ topic: 'Python' });
      expect(result).toEqual({ topic: 'Python', moduleCount: 5 });
    });
  });

  describe('invalid input throws BadRequestException', () => {
    it('throws BadRequestException on validation failure', () => {
      const pipe = new ZodValidationPipe(UserSchema);
      expect(() => pipe.transform({ name: '', age: -1, email: 'not-an-email' })).toThrow(
        BadRequestException,
      );
    });

    it('exception response contains message: "Validation failed"', () => {
      const pipe = new ZodValidationPipe(UserSchema);
      try {
        pipe.transform({ age: 'not-a-number' });
      } catch (e) {
        const err = e as BadRequestException;
        const response = err.getResponse() as Record<string, unknown>;
        expect(response['message']).toBe('Validation failed');
      }
    });

    it('exception response contains errors array with path and message', () => {
      const pipe = new ZodValidationPipe(UserSchema);
      try {
        pipe.transform({ name: 'Alice', age: -5, email: 'bad' });
      } catch (e) {
        const err = e as BadRequestException;
        const response = err.getResponse() as Record<string, unknown>;
        const errors = response['errors'] as Array<{ path: string; message: string }>;
        expect(Array.isArray(errors)).toBe(true);
        expect(errors.length).toBeGreaterThan(0);
        errors.forEach((error) => {
          expect(typeof error.path).toBe('string');
          expect(typeof error.message).toBe('string');
        });
      }
    });

    it('error path is dot-joined for nested fields', () => {
      const NestedSchema = z.object({
        user: z.object({ name: z.string().min(1) }),
      });
      const pipe = new ZodValidationPipe(NestedSchema);
      try {
        pipe.transform({ user: { name: '' } });
      } catch (e) {
        const err = e as BadRequestException;
        const response = err.getResponse() as Record<string, unknown>;
        const errors = response['errors'] as Array<{ path: string; message: string }>;
        expect(errors[0]?.path).toBe('user.name');
      }
    });

    it('throws for missing required fields', () => {
      const pipe = new ZodValidationPipe(UserSchema);
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });

    it('throws for completely wrong type (null)', () => {
      const pipe = new ZodValidationPipe(UserSchema);
      expect(() => pipe.transform(null)).toThrow(BadRequestException);
    });
  });
});

import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '../modules/auth/auth.guard.js';

function makeContext(headers: Record<string, string | undefined>) {
  const request = { headers, user: undefined as unknown };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    __request: request,
  } as unknown as ExecutionContext & { __request: typeof request };
}

function makeMockAuthProvider() {
  return {
    verifyToken: vi.fn(),
  };
}

describe('AuthGuard.canActivate()', () => {
  describe('missing / malformed header', () => {
    it('throws UnauthorizedException("Missing authorization header") when no Authorization header', async () => {
      const provider = makeMockAuthProvider();
      const guard = new AuthGuard(provider as never);
      const ctx = makeContext({});
      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(ctx)).rejects.toThrow('Missing authorization header');
    });

    it('throws when Authorization header does not start with "Bearer "', async () => {
      const provider = makeMockAuthProvider();
      const guard = new AuthGuard(provider as never);
      const ctx = makeContext({ authorization: 'Basic some-token' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(ctx)).rejects.toThrow('Missing authorization header');
    });

    it('throws when authorization header is "Bearer" (no space/token)', async () => {
      const provider = makeMockAuthProvider();
      const guard = new AuthGuard(provider as never);
      const ctx = makeContext({ authorization: 'Bearer' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyToken failure', () => {
    it('throws UnauthorizedException("Invalid token") when verifyToken throws', async () => {
      const provider = makeMockAuthProvider();
      provider.verifyToken.mockRejectedValue(new Error('Token expired'));
      const guard = new AuthGuard(provider as never);
      const ctx = makeContext({ authorization: 'Bearer bad-token' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(ctx)).rejects.toThrow('Invalid token');
    });
  });

  describe('successful authentication', () => {
    const mockUser = { id: 'user-1', supabaseId: 'user-1', email: 'alice@example.com' };

    it('returns true when verifyToken succeeds', async () => {
      const provider = makeMockAuthProvider();
      provider.verifyToken.mockResolvedValue(mockUser);
      const guard = new AuthGuard(provider as never);
      const ctx = makeContext({ authorization: 'Bearer valid-token' });
      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('attaches the resolved user to request.user', async () => {
      const provider = makeMockAuthProvider();
      provider.verifyToken.mockResolvedValue(mockUser);
      const guard = new AuthGuard(provider as never);
      const ctx = makeContext({ authorization: 'Bearer valid-token' });
      await guard.canActivate(ctx);
      expect((ctx as any).__request.user).toEqual(mockUser);
    });

    it('passes the extracted token (after "Bearer ") to verifyToken', async () => {
      const provider = makeMockAuthProvider();
      provider.verifyToken.mockResolvedValue(mockUser);
      const guard = new AuthGuard(provider as never);
      const ctx = makeContext({ authorization: 'Bearer my-secret-token' });
      await guard.canActivate(ctx);
      expect(provider.verifyToken).toHaveBeenCalledWith('my-secret-token');
    });
  });
});

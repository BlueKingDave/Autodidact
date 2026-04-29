import { describe, it, expect, vi } from 'vitest';
import { SupabaseAuthProvider } from '../implementations/auth/supabase-auth.provider.js';

// ────────────────────────────────────────────────────────────────────────────
// Mock @supabase/supabase-js
// ────────────────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    auth: { getUser: mockGetUser },
  }),
}));

// ────────────────────────────────────────────────────────────────────────────

function makeProvider() {
  return new SupabaseAuthProvider({
    supabaseUrl: 'https://test.supabase.co',
    serviceRoleKey: 'service-key',
  });
}

describe('SupabaseAuthProvider.verifyToken()', () => {
  it('returns { id, supabaseId, email } on successful token verification', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-uuid-1', email: 'alice@example.com' } },
      error: null,
    });
    const provider = makeProvider();
    const result = await provider.verifyToken('valid-token');
    expect(result).toEqual({
      id: 'user-uuid-1',
      supabaseId: 'user-uuid-1',
      email: 'alice@example.com',
    });
  });

  it('uses the same value for id and supabaseId', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-uuid-2', email: 'bob@example.com' } },
      error: null,
    });
    const provider = makeProvider();
    const result = await provider.verifyToken('token');
    expect(result.id).toBe(result.supabaseId);
  });

  it('returns email="" when user.email is null', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-uuid-3', email: null } },
      error: null,
    });
    const provider = makeProvider();
    const result = await provider.verifyToken('token');
    expect(result.email).toBe('');
  });

  it('throws when Supabase returns an error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Token expired' },
    });
    const provider = makeProvider();
    await expect(provider.verifyToken('bad-token')).rejects.toThrow('Invalid token');
  });

  it('throws when data.user is null (no error but no user)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const provider = makeProvider();
    await expect(provider.verifyToken('orphan-token')).rejects.toThrow('Invalid token');
  });

  it('calls getUser with the provided token', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u', email: 'u@u.com' } },
      error: null,
    });
    const provider = makeProvider();
    await provider.verifyToken('my-token-abc');
    expect(mockGetUser).toHaveBeenCalledWith('my-token-abc');
  });
});

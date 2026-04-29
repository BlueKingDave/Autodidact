import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseAuthProvider } from '../implementations/auth/supabase-auth.provider.js';

// ── Mock jose ────────────────────────────────────────────────────────────────
// vi.hoisted ensures these variables are initialised before the vi.mock factory
// runs (which is hoisted to the top of the file by vitest's transform).

const { mockJwtVerify, mockJwkSet } = vi.hoisted(() => ({
  mockJwtVerify: vi.fn(),
  mockJwkSet: {},
}));

vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => mockJwkSet),
  jwtVerify: mockJwtVerify,
}));

// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://test.supabase.co';

function makeProvider() {
  return new SupabaseAuthProvider({ supabaseUrl: SUPABASE_URL });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SupabaseAuthProvider construction', () => {
  it('creates the JWKS set from the correct endpoint URL', async () => {
    const { createRemoteJWKSet } = await import('jose');
    makeProvider();
    expect(createRemoteJWKSet).toHaveBeenCalledWith(
      new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
    );
  });
});

describe('SupabaseAuthProvider.verifyToken()', () => {
  it('returns { id, supabaseId, email, role } mapped from JWT claims', async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { sub: 'user-uuid-1', email: 'alice@example.com', role: 'authenticated' },
    });
    const result = await makeProvider().verifyToken('valid-token');
    expect(result).toEqual({
      id: 'user-uuid-1',
      supabaseId: 'user-uuid-1',
      email: 'alice@example.com',
      role: 'authenticated',
    });
  });

  it('id and supabaseId are both equal to the sub claim', async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { sub: 'user-uuid-2', email: 'bob@example.com' },
    });
    const result = await makeProvider().verifyToken('token');
    expect(result.id).toBe(result.supabaseId);
    expect(result.id).toBe('user-uuid-2');
  });

  it('email defaults to "" when the claim is absent', async () => {
    mockJwtVerify.mockResolvedValue({ payload: { sub: 'user-uuid-3' } });
    const result = await makeProvider().verifyToken('token');
    expect(result.email).toBe('');
  });

  it('role is undefined when the claim is absent', async () => {
    mockJwtVerify.mockResolvedValue({ payload: { sub: 'u', email: 'u@u.com' } });
    const result = await makeProvider().verifyToken('token');
    expect(result.role).toBeUndefined();
  });

  it('passes issuer and audience: "authenticated" to jwtVerify', async () => {
    mockJwtVerify.mockResolvedValue({ payload: { sub: 'u', email: 'u@u.com' } });
    await makeProvider().verifyToken('some-token');
    expect(mockJwtVerify).toHaveBeenCalledWith(
      'some-token',
      mockJwkSet,
      { issuer: `${SUPABASE_URL}/auth/v1`, audience: 'authenticated' },
    );
  });

  it('throws "Invalid token" when jwtVerify rejects (expired, bad sig, wrong issuer, etc.)', async () => {
    mockJwtVerify.mockRejectedValue(new Error('JWTExpired'));
    await expect(makeProvider().verifyToken('bad-token')).rejects.toThrow('Invalid token');
  });

  it('throws "Invalid token" when payload has no sub claim', async () => {
    mockJwtVerify.mockResolvedValue({ payload: { email: 'x@y.com' } });
    await expect(makeProvider().verifyToken('no-sub-token')).rejects.toThrow('Invalid token');
  });

  it('passes the raw token string to jwtVerify', async () => {
    mockJwtVerify.mockResolvedValue({ payload: { sub: 'u', email: 'u@u.com' } });
    await makeProvider().verifyToken('my-token-abc');
    expect(mockJwtVerify).toHaveBeenCalledWith('my-token-abc', mockJwkSet, expect.any(Object));
  });
});

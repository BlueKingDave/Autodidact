import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { IAuthProvider } from '../../interfaces/auth.js';
import type { AuthUser } from '@autodidact/types';

export class SupabaseAuthProvider implements IAuthProvider {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;

  constructor(config: { supabaseUrl: string }) {
    this.issuer = `${config.supabaseUrl}/auth/v1`;
    this.jwks = createRemoteJWKSet(
      new URL(`${config.supabaseUrl}/auth/v1/.well-known/jwks.json`),
    );
  }

  async verifyToken(token: string): Promise<AuthUser> {
    let payload: Awaited<ReturnType<typeof jwtVerify>>['payload'];
    try {
      ({ payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: 'authenticated',
      }));
    } catch {
      throw new Error('Invalid token');
    }
    const sub = payload.sub;
    if (!sub) throw new Error('Invalid token');
    return {
      id: sub,
      supabaseId: sub,
      email: typeof payload['email'] === 'string' ? payload['email'] : '',
      role: typeof payload['role'] === 'string' ? payload['role'] : undefined,
    };
  }
}

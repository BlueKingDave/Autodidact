import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import type { IAuthProvider } from '../../interfaces/auth.js';
import type { AuthUser, UserProfile } from '@autodidact/types';

export class SupabaseAuthProvider implements IAuthProvider {
  private readonly jwtSecret: string;
  private readonly supabase: ReturnType<typeof createClient>;

  constructor(supabaseUrl: string, serviceRoleKey: string, jwtSecret: string) {
    this.jwtSecret = jwtSecret;
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  async verifyToken(token: string): Promise<AuthUser> {
    const payload = jwt.verify(token, this.jwtSecret) as {
      sub: string;
      email: string;
    };
    return {
      id: payload.sub,
      supabaseId: payload.sub,
      email: payload.email,
    };
  }

  async getUser(supabaseId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase.auth.admin.getUserById(supabaseId);
    if (error || !data.user) return null;
    return {
      id: supabaseId,
      supabaseId,
      email: data.user.email ?? '',
      displayName: (data.user.user_metadata as Record<string, unknown>)?.['display_name'] as string ?? null,
      avatarUrl: null,
      createdAt: data.user.created_at,
    };
  }
}

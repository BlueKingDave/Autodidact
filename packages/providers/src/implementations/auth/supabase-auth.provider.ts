import { createClient } from '@supabase/supabase-js';
import type { IAuthProvider } from '../../interfaces/auth.js';
import type { AuthUser } from '@autodidact/types';

export class SupabaseAuthProvider implements IAuthProvider {
  private readonly client;

  constructor(config: { supabaseUrl: string; serviceRoleKey: string }) {
    this.client = createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async verifyToken(token: string): Promise<AuthUser> {
    const { data, error } = await this.client.auth.getUser(token);
    if (error || !data.user) {
      throw new Error('Invalid token');
    }
    return {
      id: data.user.id,
      supabaseId: data.user.id,
      email: data.user.email ?? '',
    };
  }
}

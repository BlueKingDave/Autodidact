import type { AuthUser, UserProfile } from '@autodidact/types';

export interface IAuthProvider {
  verifyToken(token: string): Promise<AuthUser>;
  getUser(supabaseId: string): Promise<UserProfile | null>;
}

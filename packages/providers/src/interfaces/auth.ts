import type { AuthUser } from '@autodidact/types';

export interface IAuthProvider {
  verifyToken(token: string): Promise<AuthUser>;
}

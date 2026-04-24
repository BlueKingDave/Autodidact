import type { AuthUser } from '@autodidact/types';
export interface IAuthProvider {
    verifyToken(token: string): Promise<AuthUser>;
}
//# sourceMappingURL=auth.d.ts.map
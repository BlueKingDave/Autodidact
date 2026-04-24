import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { IAuthProvider } from '@autodidact/providers';
import type { AuthUser } from '@autodidact/types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authProvider: IAuthProvider) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authHeader.slice(7);
    try {
      request.user = await this.authProvider.verifyToken(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

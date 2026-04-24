import { Module, Global } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { createAuthProvider } from '@autodidact/providers';
import { AUTH_PROVIDER_TOKEN } from '../../providers.token.js';

@Global()
@Module({
  providers: [
    {
      provide: AUTH_PROVIDER_TOKEN,
      useFactory: async () => createAuthProvider(),
    },
    {
      provide: AuthGuard,
      useFactory: (authProvider: ConstructorParameters<typeof AuthGuard>[0]) =>
        new AuthGuard(authProvider),
      inject: [AUTH_PROVIDER_TOKEN],
    },
  ],
  exports: [AUTH_PROVIDER_TOKEN, AuthGuard],
})
export class AuthModule {}

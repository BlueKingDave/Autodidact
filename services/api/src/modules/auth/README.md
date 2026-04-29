# Module: Auth

## Responsibility

Provides JWT authentication for all protected API routes via the `AuthGuard`.

This module does not expose any HTTP endpoints. It contributes a guard (used globally via `@UseGuards(AuthGuard)`) and a parameter decorator (`@CurrentUser()`).

## Files

| File | Description |
|------|-------------|
| `auth.guard.ts` | `CanActivate` guard. Extracts Bearer token, calls `IAuthProvider.verifyToken()`, attaches `AuthUser` to `req.user`. |
| `auth.module.ts` | NestJS module. Instantiates the concrete `IAuthProvider` (via `createAuthProvider()` factory) and provides `AuthGuard`. |

## Flow

```
Incoming request
  │
  ▼
AuthGuard.canActivate()
  1. Read Authorization header → expect "Bearer <token>"
  2. IAuthProvider.verifyToken(token)
       └── SupabaseAuthProvider → supabase.auth.getUser(token)
           Success → AuthUser { id, supabaseId, email }
           Failure → throw UnauthorizedException
  3. req.user = AuthUser
  4. return true (continue to controller)
```

## @CurrentUser Decorator

Located in `src/common/decorators/current-user.decorator.ts`. Extracts `req.user` from the execution context into a controller parameter:

```typescript
@Get()
list(@CurrentUser() user: AuthUser) {
  return this.coursesService.getUserCourses(user.id);
}
```

## Extension Points

To swap authentication providers (e.g., to Auth0 or Clerk), implement `IAuthProvider` in `packages/providers/src/implementations/auth/` and set `AUTH_PROVIDER=<new>` in the environment. No changes to this module are required.

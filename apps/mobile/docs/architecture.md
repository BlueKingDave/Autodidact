# Architecture

## Position in the monorepo

```
monorepo
├── apps/mobile         ← this app
├── services/api        ← REST + SSE backend (NestJS)
├── services/agent      ← AI graph (LangGraph, internal only)
└── packages/           ← shared types, schemas, config
```

The mobile app has **no direct database access**. All reads and writes go through `services/api`. The agent service is internal to the backend and is never called from the mobile client.

## Runtime dependencies

```
Mobile  →  services/api  →  Supabase (DB)
                         →  services/agent (AI, internal)
        →  Supabase Auth (JWT exchange only)
```

- **Supabase Auth** is used only to obtain a JWT. The client never queries Supabase tables directly.
- **services/api** validates that JWT on every request and owns all business logic.
- **services/agent** handles LLM orchestration; the mobile client never reaches it directly.

## Auth flow

1. User signs in via Supabase Auth (email/password).
2. Supabase returns an `access_token` (JWT).
3. The token is stored in `auth.store` (persisted to device SecureStore).
4. Every `apiFetch` call attaches it as `Authorization: Bearer <token>`.
5. A 401 response from `services/api` calls `clearSession()`, which triggers the auth guard to redirect to sign-in.

## Key decisions

- **No direct Supabase queries.** All data access is mediated by `services/api` so auth, validation, and business rules live in one place.
- **SSE over WebSockets.** The AI chat stream uses Server-Sent Events. Simpler to implement on both ends, sufficient for one-directional token streaming.
- **React Query for all server state.** No custom fetch state management; React Query handles caching, deduplication, and background refresh.

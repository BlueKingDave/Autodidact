# Subtree Instructions — services/api/

> These rules apply only within `services/api/`. They extend the root `CLAUDE.md`.

## Purpose of this subtree

`services/api` is the only public-facing HTTP service. It owns:
- JWT verification (via AuthGuard on every controller except /health)
- Course lifecycle: similarity check, enrollment, job enqueueing, status polling
- Chat session management and SSE proxying to the Agent service
- Message persistence (user and assistant messages to `chat_sessions`)
- Module progress tracking and sequential unlock logic

It does NOT run AI models. All AI logic lives in `services/agent`.

---

## Invariants (must not be broken)

- All controllers apply `@UseGuards(AuthGuard)` — the only unguarded route is `GET /health`
- No AI logic belongs in this service; AI calls go through `ApiAgentClient` to `services/agent`
- `QUEUE_PROVIDER_TOKEN` and `AUTH_PROVIDER_TOKEN` are injected via DI tokens — never import concrete provider classes directly from `@autodidact/providers`
- `ApiAgentClient` (`src/services/agent.client.ts`) is the only component that calls the Agent service HTTP API
- All controller inputs are validated with `ZodValidationPipe` and schemas from `@autodidact/schemas`
- The global prefix is `v1` (set in `main.ts`) — all routes are under `/v1/`

---

## Library / tooling rules

- Use:
  - NestJS (modules, guards, controllers, DI)
  - Drizzle ORM via `@autodidact/db` (never raw `pg` or direct `postgres` imports)
  - `@autodidact/schemas` for input/output validation schemas
  - `ZodValidationPipe` for all controller inputs
  - `@CurrentUser()` decorator to extract the authenticated `AuthUser` from the request
  - `@autodidact/observability` for logging (never `console.log`)
- Do not use:
  - Direct imports of concrete auth or queue provider classes
  - LLM SDKs (OpenAI, Anthropic, etc.)
  - Express APIs directly — NestJS wraps Express; do not bypass it

---

## Source of truth

- HTTP contract (routes, payloads): this service's controllers
- Auth user shape: `AuthUser` in `src/modules/auth/` (via `@autodidact/types`)
- Agent HTTP contract: `src/services/agent.client.ts`
- Queue job shapes: `src/queues/definitions.ts`

---

## Key patterns to follow

- **Module-per-feature**: each feature (`auth`, `courses`, `chat`, `progress`) is a NestJS module. Cross-module dependencies are explicit imports (e.g., `ChatModule` imports `ProgressModule`).
- **Provider token injection**: external dependencies (auth backend, queue) are injected using string tokens (`AUTH_PROVIDER_TOKEN`, `QUEUE_PROVIDER_TOKEN`) defined in `src/providers.token.ts`. Factories call `createAuthProvider()` / `createQueueProvider()` from `@autodidact/providers`.
- **Global auth module**: `AuthModule` is decorated `@Global()` — `AuthGuard` is available everywhere without re-importing `AuthModule`.

---

## Anti-patterns to avoid

- Adding AI or LLM logic to any file in this service
- Calling the Agent service HTTP API from anywhere other than `ApiAgentClient`
- Bypassing `AuthGuard` on a new controller route
- Using `APP_GUARD` to register a global guard — the current pattern is `@UseGuards(AuthGuard)` per-controller
- Importing `IQueueProvider` implementation classes directly; always inject via `QUEUE_PROVIDER_TOKEN`

---

## Commands / workflows

```bash
# From monorepo root
pnpm dev                                    # start all services (requires build first)
pnpm --filter @autodidact/api dev           # api only (watches dist/main.js — build first)
pnpm --filter @autodidact/api build         # compile TypeScript to dist/
pnpm --filter @autodidact/api test          # run tests (vitest)
pnpm --filter @autodidact/api test:coverage # test with coverage report
pnpm --filter @autodidact/api typecheck     # type-check without emitting
```

---

## Key Decisions

- [ADR-004 — REST API framework](../../docs/architecture/ADRs/services/api/ADR-004-rest-api-framework.md) (NestJS)
- [ADR-009 — External vendor abstraction](../../docs/architecture/ADRs/packages/providers/ADR-009-external-vendor-abstraction.md) (auth/queue providers consumed via NestJS DI)
- [ADR-011 — Real-time streaming transport](../../docs/architecture/ADRs/services/agent/ADR-011-realtime-streaming-transport.md) (SSE — API proxies the agent stream)
- [ADR-016 — Runtime schema validation](../../docs/architecture/ADRs/packages/schemas/ADR-016-runtime-schema-validation.md) (Zod via NestJS pipes)
- [ADR-020 — Authentication strategy](../../docs/architecture/ADRs/cross-cutting/ADR-020-authentication-strategy.md) (Supabase Auth — 🚩)

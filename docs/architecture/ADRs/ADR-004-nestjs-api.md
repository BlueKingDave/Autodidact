# ADR-004: NestJS for the REST API Service

## Status

Accepted — 2026-05-05

## Context

`services/api` is the only public-facing HTTP service in the Autodidact monorepo. It handles JWT verification on every route, course lifecycle orchestration (similarity check, enqueueing, enrollment), SSE proxying from the Agent service to mobile clients, message persistence, and per-user progress tracking.

Several cross-cutting concerns apply uniformly across all routes: every endpoint except `/health` must verify a Bearer token before the handler runs, every request body must be validated against a Zod schema, and provider dependencies (auth backend, queue backend) must be swappable without touching feature code. The codebase is team-built and benefits from opinionated, consistent structure over flexibility.

A framework decision was needed that could satisfy these constraints without requiring the team to reinvent guard, pipe, and module patterns from scratch.

## Decision

We use NestJS for the `services/api` REST API service.

## Consequences

### Positive

- Decorator-based guards (`@UseGuards`), pipes (`ZodValidationPipe`), and filters (`AllExceptionsFilter`) reduce boilerplate and make cross-cutting concerns declarative
- The module system (`@Module`, `@Global`) enforces feature boundaries by construction — cross-module dependencies are explicit imports rather than implicit requires
- The DI container makes provider swapping (e.g., replacing the auth backend) testable and explicit via injection tokens (`AUTH_PROVIDER_TOKEN`, `QUEUE_PROVIDER_TOKEN`)
- `@Sse` decorator and RxJS `Observable` integration makes the SSE proxy pattern straightforward without manual response header management

### Negative

- Heavier startup time compared to raw Express or Fastify — noticeable in test environments and cold starts
- Class-based patterns (providers, modules, guards) require more boilerplate than functional equivalents
- Larger bundle size than a minimal Fastify server; acceptable for this service's role but worth noting

### Neutral

- Requires TypeScript; this is already a project-wide requirement
- Runs on Express under the hood (`@nestjs/platform-express`); switching the adapter to Fastify is possible but not planned for this service

## Alternatives considered

- **Express**: Rejected — no built-in structure for guards, pipes, or modules. We would have had to implement token verification middleware, validation middleware, and a module-like organisation manually, and consistency would have eroded over time.
- **Fastify**: Rejected for this service — Fastify is intentionally used in `services/agent` (see ADR-005) where raw streaming reply access and minimal overhead matter for LLM token streaming. NestJS's richer abstractions are a better fit for `services/api`'s guard-heavy, validation-heavy, DI-dependent needs.
- **Hono**: Not evaluated at decision time; NestJS had broader team familiarity and a proven pattern for the guard/pipe/module structure we needed.

## References

- See ADR-005 for why the Agent service uses Fastify instead
- `services/api/README.md`
- `services/api/CLAUDE.md`

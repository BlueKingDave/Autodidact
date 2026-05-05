# ADR-005: Fastify for the Agent Service

## Status

Accepted — 2026-05-05

## Context

The agent service (`services/agent/`) is an internal HTTP server that streams AI responses via Server-Sent Events (SSE). A key requirement is fine-grained control over the raw HTTP response: SSE requires writing to `reply.raw` directly, keeping the connection open while LangGraph `graph.stream()` yields tokens, and flushing headers before the first token arrives.

The service has no need for the structured guard/pipe/module system that the API service uses (see ADR-004). Its only responsibilities are: validate an incoming request body, invoke a LangGraph graph, and pipe the streaming output to the client.

## Decision

We use Fastify for the `services/agent/` HTTP server.

## Consequences

### Positive

- Direct access to `reply.raw` enables clean SSE streaming (`reply.raw.write()`, `reply.raw.end()`) without adapter layers or RxJS indirection.
- Lower overhead than NestJS for a service that does no request transformation, DI container wiring, or middleware pipelines.
- Fast startup and minimal bootstrap code; the entire server is wired in `main.ts` without decorators or module classes.
- TypeScript support is first-class; no additional configuration difference from NestJS.

### Negative

- No shared patterns with `services/api` (which uses NestJS per ADR-004); engineers switching between services encounter different idioms.
- No built-in DI container or lifecycle hooks; provider initialization and shutdown must be wired manually.
- Error handling is not automatic — uncaught errors in routes must be caught explicitly to emit a well-formed SSE error event before closing the connection.

### Neutral

- Zod is used for request body validation in place of Fastify's built-in JSON schema validation; this is consistent with the rest of the monorepo.

## Alternatives considered

- **NestJS:** Rejected. NestJS's response abstraction sits between the handler and the raw socket. Streaming SSE in NestJS requires using `@Sse()` with RxJS `Observable`, which adds an indirection layer that complicates per-token error handling. Fine for the API service (ADR-004); wrong for a streaming AI backend where individual token errors must close the connection cleanly.
- **Express:** Rejected. Slightly lower performance than Fastify; no meaningful advantage for this use case. `reply.raw` access is equivalent, but Fastify's typed route API and plugin system are preferable.
- **Pure Node.js `http` module:** Rejected. Too much boilerplate for routing, body parsing, and schema validation with no framework benefit.

## References

- ADR-004: NestJS for the API service
- `services/agent/README.md`
- `services/agent/CLAUDE.md`

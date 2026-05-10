# ADR-005: AI agent server framework

## Status

Accepted
Date: 2026-05-10

## Context

`services/agent` is the internal AI runtime: it runs LangGraph graphs for
course generation and module-chat, handles all LLM/embedding calls, and
streams tokens to callers via SSE. It is **internal only** — port 3001 is
not exposed publicly. The only callers are `services/api` (chat streams,
embeddings, course generation) and `services/worker` (course generation).

The agent's HTTP surface is small: 4 routes (`POST /course/generate`,
`POST /module-chat/stream`, `POST /embeddings/text`, `GET /health`). It
has no auth (internal-only), no Swagger/OpenAPI to publish, no DI-heavy
module structure to organize. The hot path is **streaming** — keep an
SSE connection open while LangGraph yields tokens — and **time-to-first-byte**
on cold start, because this service is invoked synchronously from the API
during user-facing chat.

This ADR is independent of [ADR-004](../api/ADR-004-rest-api-framework.md)
(API framework). The agent and API can use different frameworks; that's
exactly the situation we're in. The decision sits inside the
[Cloud Run hosting](../../infra/ADR-012-cloud-hosting-platform.md) context.

## Non-goals

- The orchestration framework inside the agent (LangGraph) — that's [ADR-006](./ADR-006-ai-orchestration-framework.md).
- The streaming protocol on the wire — that's [ADR-011](./ADR-011-realtime-streaming-transport.md).
- The API service framework — separate decision in [ADR-004](../api/ADR-004-rest-api-framework.md).
- Provider abstraction shape — [ADR-009](../../packages/providers/ADR-009-external-vendor-abstraction.md).

## Decision Drivers

- **Streaming-first** — SSE is the primary use case. The framework must let us write `reply.raw.write(...)` (or equivalent) without buffering responses or fighting middleware that breaks streaming.
- **Cold-start latency** — the agent service is on a user-facing critical path during chat. Cold starts add to first-token latency.
- **Small surface area** — 4 routes, no auth, no DI-rich modules. Heavyweight framework features are dead weight here.
- **TypeScript ergonomics** — Zod request validation, typed handlers.
- **LangGraph integration** — the agent's actual work is inside graphs; the HTTP framework should stay out of the way.
- **No need for OpenAPI** — internal service, no external consumer reading a spec.
- **Onboarding cost** — solo team. The framework's mental model should be simple.

## Options Considered

### Option A: Fastify (current)
**What it is:** Lightweight, plug-in-based HTTP framework. Plain JS/TS handlers; built-in JSON-Schema validation (we don't use it — we use Zod separately); response stream APIs (`reply.raw`) work cleanly with SSE.

**Pros**
- SSE works trivially: `reply.raw.write('data: ...\n\n')` and `reply.raw.end()` in a `finally`. No stream-related ceremony.
- Cold start is fast (~150 ms order of magnitude on Cloud Run for our service shape).
- Minimal abstraction over Node's HTTP — when something goes wrong, the stack trace is short.
- Plugin ecosystem covers what we need (`@fastify/cors` for CORS).
- Zod validation via `safeParse()` directly in handlers; no plugin needed.
- Strong TypeScript story (Fastify 4+ ships with built-in TS types).

**Cons**
- No built-in DI; we wire `llmProvider`, `checkpointer`, etc. manually at startup.
- No structural primitives like NestJS modules — for a 4-route service this is the right tradeoff, but as the agent grows, we may grow conventions ourselves.
- Fastify's plugin lifecycle (encapsulation, decorators) is conceptually different from Express middleware; new devs occasionally trip on it.
- 2026 state: Fastify's "we're faster than Express" pitch is much less differentiating than five years ago. The performance argument has narrowed.

### Option B: NestJS (consistency with the API)
**What it is:** Same framework as `services/api`. Decorator-based, DI-heavy, structured.

**Pros**
- Consistency: one framework across both services. Devs learn NestJS once, apply twice.
- DI registers `llmProvider`, `checkpointer`, etc. as providers; controller methods `@Inject()` them. Cleaner than manual wiring at startup.
- Built-in `@Sse()` decorator returning `Observable<MessageEvent>`.
- All the structural primitives (Modules, Guards, Pipes) — though we don't need most of them here.

**Cons**
- Cold-start tax (~300–600 ms vs Fastify's ~150 ms) on a service that's on the chat critical path. Every cold start is felt as added time-to-first-token.
- Decorators + `reflect-metadata` are overhead for a service that has 4 endpoints.
- The structural primitives that justify NestJS in [ADR-004](../api/ADR-004-rest-api-framework.md) (modules, guards, validation pipes, exception filters) are not features the agent service needs. We'd be paying NestJS's cost without using its strengths.
- `@Sse()`'s `Observable<MessageEvent>` model is more complex than Fastify's "write strings to a raw stream" — we'd convert LangGraph's stream into RxJS Observables. Real friction.

### Option C: Hono
**What it is:** Web-Standards-aligned, edge-first, very small (~14 KB), very fast cold start.

**Pros**
- Smallest cold start of credible options (under 50 ms).
- `c.streamSSE()` helper is purpose-built for SSE.
- Edge-runtime compatible if we ever want to deploy this elsewhere.
- TypeScript-first; Zod integration via `@hono/zod-validator`.

**Cons**
- Younger ecosystem; community plug-ins are smaller.
- No built-in DI (same as Fastify).
- Adopting Hono in the agent while keeping NestJS in the API means *three* HTTP framework idioms in the codebase (Hono in agent, NestJS in API, plus Fastify references in dev tooling). Mental tax.
- The cold-start advantage over Fastify is real (50 ms vs 150 ms) but doesn't move the needle dramatically — both are acceptable; both are dwarfed by the LLM call's own latency.

### Option D: Express
**What it is:** The original Node HTTP framework. Stable, ubiquitous, minimal.

**Pros**
- Familiar to every Node engineer.
- SSE works fine via `res.write` + `res.end`.
- Minimum cognitive load.

**Cons**
- TypeScript types are community-maintained; quality is variable.
- Express middleware stack imposes some response-writing patterns that need care for SSE (buffering middleware can break streaming).
- No active feature development; choosing Express in 2026 is a "we know it works" choice, not a forward-looking one.
- We'd lose Fastify's perf improvement and gain nothing structural.

### Option E: Raw Node http module — no framework
**What it is:** Use `node:http` directly; route requests by URL.

**Pros**
- Smallest possible footprint and fastest cold start.
- Zero framework dependency.
- Total control over response streaming.

**Cons**
- We re-implement parsing JSON bodies, routing, error handling, CORS. ~200 lines of glue code that every framework gives free.
- No structure as the service grows past 4 routes.
- Saves <100 ms on cold start vs Fastify; not worth the carrying cost.

## Decision

**We use Fastify for the agent service.**

## Rationale

Lining up the drivers:

- **Streaming-first (#1)**: A and C are the cleanest. Fastify's `reply.raw.write()` plus a `finally { reply.raw.end() }` is the smallest amount of code that satisfies our SSE invariants. NestJS's `@Sse()` adds RxJS conversion. Express works but requires care around middleware that buffers.
- **Cold-start latency (#2)**: Hono < Fastify < Express ≪ NestJS. NestJS's cold-start tax is meaningful on the chat critical path; Fastify is comfortably below the threshold where it's user-noticeable.
- **Small surface area (#3)**: Fastify and Hono are the right scale. NestJS is over-equipped for 4 routes and no auth.
- **TypeScript ergonomics (#4)**: All credible options score well; Fastify's first-class TS support is mature.
- **LangGraph integration (#5)**: Fastify gets out of the way — we call `await graph.stream(...)` inside a handler and pipe to `reply.raw`. NestJS's Observable model is an extra translation layer. Hono is similarly clean to Fastify.
- **No OpenAPI need (#6)**: We don't pay for what we don't use. NestJS's Swagger story is wasted here.
- **Onboarding (#7)**: Fastify is simple — 30 minutes to ramp on the basic patterns. NestJS demands learning DI conventions and decorators for a service that doesn't use them.

What we are sacrificing by picking Fastify over NestJS:

- Cross-service framework consistency. Devs work in NestJS in `services/api` and Fastify in `services/agent`. The cost is real but the services have very different shapes — the API is a structured REST surface; the agent is a thin streaming wrapper around LangGraph. One framework would be too heavy for the agent or too thin for the API.

What we are sacrificing by picking Fastify over Hono:

- A modest cold-start improvement (~100 ms). Not a hot driver. Hono's edge-runtime portability is a feature we don't use.

No reconsideration flag is raised. Fastify is the first-principles choice
for a small streaming service on Cloud Run with no auth or rich structural
needs.

## Consequences

### Positive
- SSE handlers are short, obvious, debuggable.
- Cold start stays inside our latency budget for chat.
- LangGraph integration is direct — no framework abstraction between us and the graph.
- Plug-in ecosystem covers the small surface (CORS, optional rate limiting if needed).
- Bundle size is small — Cloud Run image is meaningfully lighter than the API service.

### Negative
- Different framework than the API service. A new dev learns two frameworks across the monorepo.
- No built-in DI — we wire providers manually at startup. Currently a small file; could grow.
- Less convention-driven structure. As the agent grows, we'll grow conventions ourselves rather than inheriting them.
- Fastify v4 → v5 migration is on the horizon (v5 is GA as of 2025); timing the upgrade is a small future commitment.

### Follow-up decisions
- Specific route conventions, error-handling patterns — owned by `services/agent/CLAUDE.md`.
- The streaming protocol details — see [ADR-011](./ADR-011-realtime-streaming-transport.md).
- Reconsider this ADR if: the agent service grows past ~10 routes with cross-cutting concerns (DI, auth between services, complex error handling) — at that point the consistency argument for NestJS gets stronger; or cold start ceases to matter (e.g., we move off Cloud Run to an always-warm runtime).

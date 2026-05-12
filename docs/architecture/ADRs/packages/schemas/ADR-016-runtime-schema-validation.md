# ADR-016: Runtime schema validation

## Status

Accepted
Date: 2026-05-10

## Context

Two boundaries in Autodidact need runtime validation:

1. **HTTP request bodies** entering `services/api`. Even with TypeScript on
   both ends, the wire is untyped — without runtime validation, a malformed
   payload becomes a `TypeError` deep in the call stack instead of a 400.
2. **LLM-generated structured output** in `services/agent`. The agent asks
   the LLM for a `CourseBlueprint`; the LLM returns text that *should* be
   valid JSON matching our schema, but sometimes isn't.

`packages/schemas` centralizes both. The same Zod schema describes the
request body (used by NestJS validation pipes) and the LLM output shape
(used in `safeParse()` calls in the agent's graph). One source of truth,
two enforcement points.

This decision sits independently of the API framework choice
([ADR-004](../../services/api/ADR-004-rest-api-framework.md)) and the
orchestration framework ([ADR-006](../../services/agent/ADR-006-ai-orchestration-framework.md)),
but composes with both.

## Non-goals

- Specific schema shapes — owned by `packages/schemas/src/` and the relevant feature CLAUDE.md files.
- Static type generation — the chosen library must produce TS types from schemas, but the inference *style* (inferred via `z.infer<>`, separate types, etc.) is implementation detail.
- OpenAPI / Swagger generation strategy — consumed by [ADR-004](../../services/api/ADR-004-rest-api-framework.md); whatever validator we pick must integrate cleanly with that decision's needs.

## Decision Drivers

- **Single source of truth between HTTP and LLM validation** — same schema, two enforcement points. The validator must export schemas as values that can be reused across services.
- **TypeScript inference quality** — type produced by inference must accurately reflect the runtime check.
- **Ecosystem integration** — NestJS pipes, OpenAPI generators, Drizzle integration, LangChain output parsers. The picked library must have plug-ins or first-class adapters for these.
- **Server-side use only** — `packages/schemas` is consumed by `services/api` and `services/agent`. Mobile bundle size is not a driver here (mobile validates client-side via the same Zod *types* but the runtime parser doesn't ship in the mobile bundle).
- **DX / mental load** — solo team. Schema authoring should not require a DSL or ramp-up.
- **Performance at request scale** — API request rate is modest pre-revenue; per-request validation must be fast enough not to dominate latency, but raw-throughput records are not a hot driver.
- **Stability / API maturity** — schemas are committed to source. Breaking-change cadence in the validator translates to refactor work.

## Options Considered

### Option A: Zod (current)
**What it is:** TypeScript-first schema library with chainable API (`z.object({...}).strict()`). v4 (2025) added a JIT compiler that closed much of the perf gap with newer libraries. ~14 KB tree-shaken in v4 (smaller `zod/mini` build available). De-facto standard in the TypeScript ecosystem.

**Pros**
- Largest ecosystem in 2026: NestJS validation pipes, `zod-to-openapi`, `drizzle-zod`, LangChain `StructuredOutputParser`, tRPC, React Hook Form — all first-class.
- Method-chaining API is the most intuitive for new developers — almost no documentation needed for the basics.
- Schema is a runtime value; `z.infer<typeof S>` produces an accurate static type.
- v4 perf is meaningfully better than v3 with the JIT compiler; "Zod is slow" is largely a 2023 critique.
- API has been stable through several minor versions; refactor risk is low.

**Cons**
- Bundle size still meaningful (~14 KB) — would matter if shipped to clients, doesn't for our server-side use.
- Method chaining can produce hard-to-read schemas at the edges (deeply nested unions, recursive types).
- Performance, while improved, still trails ArkType by ~15× on heavy schemas (180ms vs 12ms on 100k complex objects per published benchmarks). At our request rates, this is invisible.
- `superRefine` and similar advanced features are needed for some non-trivial validations and add complexity.

### Option B: Valibot
**What it is:** TypeScript-first schema library with a *functional, modular* API (`object({ name: string() })` rather than chained methods). Tree-shakable — unused validators are eliminated by the bundler.

**Pros**
- Bundle size is dramatically smaller (1.4 KB tree-shaken for a typical schema vs Zod's 14 KB). Real value if we shipped schemas to the mobile client; less relevant for server-side.
- Modular functional API forces explicit imports, which is cleaner once you adapt and lighter on cold-start initialization.
- Initialization performance is the best among the three (best TTI for cold-start scenarios).
- Conceptually simple: each validation is a function; composition is function composition.

**Cons**
- Smaller ecosystem in 2026: NestJS, Drizzle, OpenAPI generators have Zod plug-ins; Valibot adapters exist but are younger and less polished.
- LangChain's structured output parsing has a Zod-first integration story; using Valibot means hand-converting or maintaining a parallel layer.
- Functional style is meaningfully different from Zod — for a team familiar with Zod, switching is a real onboarding tax (small, but real).
- Runtime perf is comparable to Zod v4, slower than ArkType. Not a differentiator for us.

### Option C: ArkType
**What it is:** Schema library using a TypeScript-like type-literal syntax (`type({ name: "string", age: "number > 0" })`). JIT-compiles schemas into optimized validators.

**Pros**
- Fastest runtime by a large margin — ~15× faster than Zod v4 on heavy schemas in published benchmarks.
- TypeScript-literal syntax is genuinely elegant for engineers who like type-level programming.
- Single source of truth: the validator and the type literal are the same expression.

**Cons**
- Bundle size is the largest of the three (~40 KB), which doesn't bite us server-side but is a tradeoff to note.
- Custom error messages and complex refinements are more verbose than Zod's chainable `.refine()` / `.transform()`.
- Smallest community / ecosystem of the three. Plug-ins for NestJS, OpenAPI, Drizzle are sparser; some have to be hand-written or kept up by the team.
- The type-literal syntax is unfamiliar to most TS developers — onboarding cost is real.
- Magnitude of perf advantage is overkill for our request-rate profile.

### Option D: Yup
**What it is:** Older validation library (predates Zod). Mature, used heavily in form libraries (Formik) for years.

**Pros**
- Battle-tested in the form-library world.
- API is similar enough to Zod that migration is feasible.

**Cons**
- TypeScript inference is meaningfully weaker than Zod / Valibot / ArkType — the produced types are looser than the runtime validation.
- Has lost the new-project-default position to Zod; ecosystem momentum is on Zod's side.
- For LLM output parsing or NestJS integration, Zod is the de-facto integration point in 2026.

### Option E: Effect Schema
**What it is:** Part of the Effect ecosystem. Composable schema with Effect's full runtime power available.

**Pros**
- Outstanding type-level expressiveness.
- Integrates with Effect's other primitives (Layers, services, error channels).

**Cons**
- Effect is a paradigm shift, not a library. Adopting Effect Schema in isolation in a non-Effect codebase is the worst of both worlds (we get the API surface without the surrounding ecosystem benefits).
- Onboarding cost for anyone not already steeped in Effect is in weeks.
- Severe over-abstraction for "validate request body and LLM output."

### Option F: TypeBox
**What it is:** JSON-Schema-aligned TypeScript schemas; emits standard JSON Schema natively.

**Pros**
- Native JSON Schema output is great for OpenAPI / AJV pipelines.
- Fast (uses AJV under the hood for compiled validators).

**Cons**
- API ergonomics trail Zod and Valibot.
- Aligning to JSON Schema constrains expressiveness for TypeScript-native concepts (branded types, tagged unions, transforms).
- Less ecosystem traction in our specific stack (NestJS, LangChain, Drizzle).

## Decision

**We use Zod.**

## Rationale

Lining up the drivers:

- **Single SoT (#1)**: All options produce reusable runtime schemas. Not differentiating.
- **TypeScript inference (#2)**: Zod, Valibot, ArkType all excellent. Yup is meaningfully weaker.
- **Ecosystem integration (#3)**: This is where Zod wins decisively. NestJS validation pipes, Drizzle (`drizzle-zod`), OpenAPI generators, LangChain's `StructuredOutputParser` all have first-class Zod support. Picking Valibot or ArkType means either using their adapter packages (which lag) or maintaining the integrations ourselves. For a solo team, "use the thing the rest of the ecosystem builds for" is the right tradeoff.
- **Server-side only (#4)**: Bundle size (Valibot's main pitch) doesn't help us. ArkType's bundle penalty doesn't hurt us either. The server-side scoping neutralizes both libraries' bundle-size differentiators.
- **DX / mental load (#5)**: Zod's chainable API is the most familiar TypeScript developers find on first contact. Valibot's functional style is cleaner once internalized but a real onboarding tax.
- **Performance at our scale (#6)**: Zod v4's JIT is fast enough. ArkType's perf advantage is real but irrelevant for our request rates.
- **API maturity (#7)**: Zod's API has been stable across versions; the v3 → v4 migration was incremental. Valibot is younger, ArkType is younger still — both have a meaningful chance of v2/v3 churn we'd absorb.

What we are sacrificing by picking Zod over Valibot: a substantial bundle-size advantage (~10× smaller). That advantage doesn't help us because we don't ship schemas to a bundle-sensitive client.

What we are sacrificing by picking Zod over ArkType: peak validation throughput. Irrelevant at our scale.

No reconsideration flag is raised. Zod is the first-principles choice for
our specific intersection (server-side, ecosystem-heavy, solo team, ergonomics-
first). The bundle-size and perf arguments for the alternatives don't
translate into our context.

## Consequences

### Positive
- Single schema in `packages/schemas` powers NestJS request validation, LLM output parsing, and (via inference) static types in any consumer.
- Ecosystem integrations (Drizzle, NestJS pipes, LangChain output parsers, OpenAPI) work without us maintaining adapters.
- New developer can author or modify schemas without ramp-up.
- Stable API; refactors are rare.

### Negative
- Schemas use method chaining; deeply nested unions and recursive types get verbose.
- Larger bundle than Valibot — irrelevant today but worth noting if we ever ship schemas to the mobile client.
- Validation perf is fine but not best-in-class. If a future hot path becomes validation-bound, we may need to compile a subset of schemas to a faster validator.

### Follow-up decisions
- Where Zod schemas live (`packages/schemas` SoT vs colocated in feature folders) — owned by `packages/schemas/CLAUDE.md`.
- Conventions for LLM output validation (retry on parse failure? log the bad output?) — owned by the relevant graph CLAUDE.md files in `services/agent`.
- Reconsider this ADR if: we start shipping schemas to the mobile client at scale (Valibot's tree-shaking starts paying), Zod's maintenance slows materially, or a hot path emerges where validation throughput dominates latency.

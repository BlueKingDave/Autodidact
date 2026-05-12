# ADR-002: Database platform

## Status

Accepted
Date: 2026-05-10

## Context

Autodidact stores users, courses, modules, chat sessions, progress, and topic
embeddings. The data is relational with one machine-learning twist: course
topic embeddings need vector similarity search (cosine distance) so a new
course request can be matched against previously generated courses (the
"course reuse" feature, see [ADR-010](../packages/db/ADR-010-vector-search-strategy.md)).
All three backend services (`api`, `agent`, `worker`) share the same
database. The mobile app talks only to the API, never the database directly.

The DB platform decision sits early in the dependency chain: it bounds the
ORM (must support whatever flavor of Postgres / SQL we pick), the vector
search strategy (a database-native vector search vs an external service),
and the migration tooling. It is also tightly entangled with auth — many
managed Postgres platforms also bundle auth, and bundled vs unbundled is a
real architectural choice.

This ADR scopes only the **database platform**. Authentication is a separate
decision in [ADR-020](./ADR-020-authentication-strategy.md), even though
Supabase happens to provide both. We considered the DB choice in isolation
to surface whether the bundle is genuinely better or merely convenient.

## Non-goals

- ORM choice — see [ADR-008](../packages/db/ADR-008-orm-data-access.md).
- Vector search strategy — see [ADR-010](../packages/db/ADR-010-vector-search-strategy.md).
- Authentication strategy — see [ADR-020](./ADR-020-authentication-strategy.md).
- Connection pooling configuration, migration cadence, RLS policies — operational details, owned by `packages/db/README.md`.

## Decision Drivers

In rough priority order:

- **PostgreSQL compatibility** — relational + ACID is a near-mandatory fit for our domain (courses → modules → progress, chat sessions, foreign keys everywhere). MySQL or document stores would force impedance-mismatch work.
- **pgvector available** — vector similarity search at the database layer keeps the architecture simple (one query joins course rows with their embeddings). External vector DBs add a moving part, see [ADR-010](../packages/db/ADR-010-vector-search-strategy.md).
- **Managed (low ops)** — solo / small team. We do not run our own DB.
- **Cost at MVP** — pre-revenue, traffic is bursty. Free tier quality and the cost of growing past it both matter.
- **Migration / branching workflow** — schema changes happen weekly. Branching for preview environments is nice-to-have.
- **Cloud Run compatibility** — Postgres connection pooling has to behave under serverless containers that scale to zero. PgBouncer / equivalent matters.
- **Future portability** — locking in to a vendor's auth / RLS / functions ties our hands. We want SQL-level access to keep migration to plain Postgres viable.

## Options Considered

### Option A: Supabase Postgres (current)
**What it is:** Managed Postgres with pgvector, RLS, PgBouncer, point-in-time recovery, and bundled auth/storage/edge-functions on top. We connect via `DATABASE_URL` directly with Drizzle, treating Supabase as "Postgres + auth," not as a BaaS. Postgres 15+, pgvector + HNSW index out of the box.

**Pros**
- Postgres-flavored: any Drizzle / `pg` workflow works unchanged.
- pgvector and HNSW index are present by default, no extension toggling.
- RLS is well-supported and idiomatic in Supabase; their docs and community examples assume RLS on.
- Bundles auth (see [ADR-020](./ADR-020-authentication-strategy.md)). The `users` table integration with `auth.users` is conventional and cheap to maintain.
- Free tier is meaningful for an MVP: 500 MB DB, 100k MAUs auth, plus storage. Pro tier $25/project/month bumps the DB to 8 GB and adds dedicated compute hour buckets.
- PgBouncer (Supavisor pooler) handles Cloud Run's bursty connection pattern.
- Public Postgres connection string — there's no Supabase-only client SDK we're forced through. We always have an exit path.

**Cons**
- Connection cap on free / low tiers can bite under unexpected load. Direct connections are limited; pooler is for transactional workloads only.
- Free tier projects pause after 7 days of inactivity (annoying for early-stage MVPs that go quiet between dev sessions).
- Pricing cliff: traffic that exceeds Pro-tier compute hours triggers add-on dedicated compute, which can ratchet up quickly.
- Vendor concentration: if [ADR-020](./ADR-020-authentication-strategy.md) also picks Supabase Auth (it does), one vendor outage takes both DB and login down.
- Some Supabase-isms (RLS conventions, the `auth.users` table, the storage schema) leak into our migrations. Replacing Supabase later is feasible but requires unwinding RLS and the auth schema, not just `pg_dump`/restore.

### Option B: Neon (serverless Postgres)
**What it is:** Postgres-compatible, separation of compute and storage, scale-to-zero compute, branchable databases (real branching, not just snapshots). Acquired by Databricks in 2025; pricing/compute reportedly improved 15–25% post-acquisition. pgvector supported on every tier.

**Pros**
- Scale-to-zero compute saves money on bursty workloads (idle MVP between dev sessions, weekend lulls). Realistic for pre-revenue product.
- Database branching maps cleanly to feature branches / preview environments — a real workflow improvement vs Supabase's snapshot model.
- Free tier (0.5 GiB storage) plus per-project compute budget is competitive with Supabase free tier for pure-DB use.
- Pure Postgres, no platform-isms in the schema. Easier to migrate off later than Supabase.
- pgvector + HNSW supported at every tier.

**Cons**
- No bundled auth. We'd pair Neon with a separate auth provider (Clerk / Auth0 / Lucia / custom JWT), which is its own ADR scope.
- Cold starts when scaling from zero: typically 0.5–1 s per first request after idle. Acceptable for a mobile app, painful for some SSR patterns.
- Branching is excellent but requires discipline; without a workflow it adds noise.
- Databricks acquisition is recent — long-term roadmap and pricing under Databricks ownership is not yet a several-year track record.
- For our case specifically: removing Supabase from the DB role would not save us the auth ADR — and if we keep Supabase Auth anyway (a separate decision), we'd be running Supabase Auth against a non-Supabase DB, which is technically possible but unusual and gives up the `auth.users` ergonomics.

### Option C: Self-hosted Postgres on Google Cloud SQL
**What it is:** Plain Postgres on Cloud SQL, with `pgvector` enabled (Cloud SQL supports it). Fully under our control: connection pooling, backups, replicas, tuning. Sits inside our existing GCP footprint.

**Pros**
- Maximum control: no third-party platform constraints, no auth/RLS opinions, no surprise pauses.
- Lives inside GCP — same VPC as Cloud Run, lower latency, no egress fees, security perimeter unified with the rest of our infra ([ADR-012](../infra/ADR-012-cloud-hosting-platform.md)).
- Predictable pricing as scale grows; Cloud SQL pricing is well-understood and forecastable.
- Plain Postgres — zero vendor lock-in.

**Cons**
- We do the ops: backup verification, version upgrades, connection-pool tuning, IAM, replica failover. For a solo team, this is real time.
- Cloud SQL has no scale-to-zero — even idle MVP burns ~$10/month on the smallest instance plus storage. More expensive than Supabase / Neon free tiers at pre-revenue stage.
- No bundled auth. Auth is a separate problem (same as Neon).
- pgvector is available but has to be enabled per-instance; not a default.
- Connection pooling against Cloud Run requires either Cloud SQL Auth Proxy with the connector library, or a self-managed PgBouncer — meaningful infra work.

### Option D: PlanetScale (Postgres)
**What it is:** PlanetScale launched a Postgres GA product in late 2025 (built on a fork of Postgres with their Vitess-derived sharding underneath in time). Aimed at horizontal scale for growing apps.

**Pros**
- Strong scale story if we ever needed it (multi-region, sharding).
- Mature platform from years of MySQL operation.
- Good DX; CLI and branching workflows are well-developed.

**Cons**
- Postgres offering is new (months of GA at the time of writing). Less production track record than Supabase or Neon for Postgres specifically.
- pgvector availability and HNSW behavior on the PlanetScale-flavored Postgres is less battle-tested than on plain Postgres or Supabase. Documented Postgres-extension support is more limited than vanilla Postgres.
- PlanetScale removed their free tier in 2024; entry point is $39/mo. Not a great fit for MVP economics.
- We'd be early adopters on a relatively unproven product for our stack's most load-bearing component.

### Option E: Convex (reactive backend)
**What it is:** A reactive backend / database hybrid. Documents + queries that re-run automatically when underlying data changes. TypeScript-native function model. No SQL.

**Pros**
- Excellent DX for reactive / real-time UI patterns.
- TypeScript end-to-end including queries.
- Good free tier; scale path is simple.

**Cons**
- Not Postgres. Our domain is heavily relational (foreign keys across courses → modules → enrollments → progress) and we'd be fighting the model.
- No pgvector or comparable mature vector index; vector search would have to be bolted on with an external service.
- The reactive query model is wonderful for live UIs but we don't have live UIs that need it — chat is SSE, not Convex's reactivity model.
- Adopting Convex changes the ORM ([ADR-008](../packages/db/ADR-008-orm-data-access.md)) and the API style. Far-reaching change for a benefit we don't need.

## Decision

**We use Supabase Postgres as the database platform.**

## Rationale

Lining up the drivers against the options:

- **Postgres compatibility (#1)**: A, B, C all yes. D yes-with-asterisks (newer Postgres, PlanetScale-flavored). E no.
- **pgvector available (#2)**: A, B, C yes (with varying setup cost — A by default, B by default, C requires enabling). D maturity is unclear. E no.
- **Managed / low ops (#3)**: A, B, D yes. C no (we own the ops). E yes.
- **Cost at MVP (#4)**: A's free tier is generous (DB + auth + storage). B's free tier is competitive but doesn't bundle auth. C is meaningfully more expensive at idle. D has no free tier. E free tier is fine.
- **Migration / branching workflow (#5)**: B is the clear winner with real branching. A snapshot-based; C manual; D good; E different paradigm.
- **Cloud Run connection behavior (#6)**: A's PgBouncer (Supavisor) is well-documented for serverless. B handles connections via its own pooler with serverless in mind. C requires meaningful pooling infrastructure on our side.
- **Future portability (#7)**: B and C are the cleanest exit (plain Postgres, no platform-isms). A has Supabase-specific schema (auth.users, RLS conventions) that need unwinding — non-trivial but not impossible.

The honest first-principles result: **for a database in isolation**, Neon (Option B) is at least as strong as Supabase, with better branching and scale-to-zero economics. Supabase wins decisively on **(a)** the pgvector integration is the most idiomatic and best-documented, **(b)** the auth bundle ([ADR-020](./ADR-020-authentication-strategy.md) chooses Supabase Auth), and **(c)** RLS is a first-class concern in Supabase's design rather than a feature you operate yourself.

What we are sacrificing by choosing Supabase over Neon:

- Scale-to-zero compute economics (matters most pre-revenue).
- Real database branching for preview envs.
- Cleaner long-term portability — Supabase-isms accumulate over time.

What we are sacrificing by choosing Supabase over self-hosted Cloud SQL:

- Maximum control and predictable per-vCPU pricing.
- Zero platform lock-in.

We accept these because the auth + DB bundle ergonomics dominate at our
scale and the team-of-one ops budget is the binding constraint.

No reconsideration flag is raised. Supabase is the right tool for our
specific intersection of constraints (small team, pgvector-first, bundled
auth desired, RLS native). However: if [ADR-020](./ADR-020-authentication-strategy.md)
is ever superseded to drop Supabase Auth, this ADR should be revisited —
without auth bundling, Neon's economics likely win.

## Consequences

### Positive
- Single connection string powers all three backend services.
- pgvector + HNSW work out of the box; the course-reuse similarity search is straightforward to implement.
- Free tier is enough to ship and validate the product without cost ceremony.
- RLS provides defense-in-depth; even if application-level auth bypassed, users cannot read each other's data via direct DB access.
- Connection pooling for Cloud Run is a documented Supabase pattern, not a custom infrastructure project.

### Negative
- Free-tier projects pause after 7 days of inactivity — needs a manual unpause when picking up the project after a gap.
- Pricing cliff at heavy compute use; need to monitor compute-hour usage on Pro tier to avoid surprises.
- Vendor concentration with Supabase Auth ([ADR-020](./ADR-020-authentication-strategy.md)) means a Supabase incident takes both login and DB down at once. No active mitigation; logged risk.
- Schema accumulates Supabase-specific patterns (auth.users join, RLS policies). Migration off Supabase later is a real project, not a dump-and-restore.

### Follow-up decisions
- ORM choice consumes this ADR's Postgres assumption — see [ADR-008](../packages/db/ADR-008-orm-data-access.md).
- Vector search builds on pgvector — see [ADR-010](../packages/db/ADR-010-vector-search-strategy.md).
- Auth strategy lives in [ADR-020](./ADR-020-authentication-strategy.md); if that decision changes, this ADR should be revisited.
- Reconsider this ADR if: monthly Supabase costs exceed ~3× equivalent Neon + Clerk costs, [ADR-020](./ADR-020-authentication-strategy.md) drops Supabase Auth, traffic patterns become predictable enough that scale-to-zero loses its appeal, or we need real DB branching for preview environments and find Supabase's snapshot model insufficient.

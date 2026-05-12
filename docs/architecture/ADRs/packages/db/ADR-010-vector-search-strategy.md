# ADR-010: Vector search strategy

## Status

Accepted
Date: 2026-05-10

## Context

Autodidact's "course reuse" feature embeds a course topic (1536-dimension
vector via OpenAI `text-embedding-3-small`) and looks for previously
generated courses with cosine similarity ≥ 0.92. A hit returns the existing
course; a miss enqueues a new generation job. Without this, users requesting
nearly-identical courses (e.g., "Python basics" and "Intro to Python") would
each pay the full LLM-generation cost — both in cents and in latency.

The decision is whether vector storage and similarity search live in our
existing Postgres ([ADR-002](../../cross-cutting/ADR-002-database-platform.md))
via the `pgvector` extension, or in a dedicated vector database.

This is a tractable, single-feature workload at MVP scale: we expect the
embeddings table to hold thousands to low tens of thousands of vectors
in the first year. A single similarity query is a transactional check at
course-creation time, not a hot path serving billions of RAG retrievals.

## Non-goals

- The embedding model itself (`text-embedding-3-small`) — that's a vendor choice tied to [ADR-009](../providers/ADR-009-external-vendor-abstraction.md).
- The 0.92 threshold — operational tuning, owned by `services/api/src/modules/courses/CLAUDE.md`.
- Future RAG retrieval over course content (different scale and access pattern; would deserve its own ADR if it ships).
- Database platform choice — see [ADR-002](../../cross-cutting/ADR-002-database-platform.md).

## Decision Drivers

- **Single-source-of-truth gravity** — courses, modules, embeddings are all relational facts. Joining the similarity result with course metadata in one query is meaningfully simpler than two-system orchestration.
- **Workload scale** — thousands to tens of thousands of vectors. We are nowhere near "vector DB scale."
- **Operational footprint** — adding a second data store doubles the operational surface (backups, monitoring, version drift, network).
- **Cost** — pre-revenue MVP; recurring vendor cost for a side feature is hard to justify.
- **Latency budget** — course creation can tolerate 100s of ms for the similarity check (it sits behind a job queue anyway). This is not a low-latency RAG path.
- **Filter + relational compose** — the similarity query needs to filter by `status = 'ready'` and `embedding IS NOT NULL`. Postgres does this trivially in one statement.
- **Future RAG path** — if we add module-content retrieval later, the calculus could shift; whatever we pick should not box us in.

## Options Considered

### Option A: pgvector inside Supabase Postgres (current)
**What it is:** Vectors stored as a `vector(1536)` column on the `courses` table. HNSW index for ANN. Queries use the `<=>` (cosine distance) operator with a `WHERE 1 - (embedding <=> $1) > 0.92` filter, joined with the rest of the row in one SQL statement.

**Pros**
- Zero additional infra — same DB, same connection pool, same migration system.
- Single-query similarity + filter + join. The course-reuse query is one statement.
- HNSW index (pgvector ≥ 0.5.0) gives sub-25ms p99 at our scale on Supabase's standard compute, well within budget.
- Backups, monitoring, RLS, IAM all inherit from the DB platform we already operate.
- pgvector is genuinely production-grade in 2026 — Supabase, Neon, Instacart and others run it at significant scale. The known production ceiling is single-node Postgres limits (~50M vectors on well-provisioned hardware), not pgvector itself.
- Drizzle's custom column types ([ADR-008](./ADR-008-orm-data-access.md)) make the column type a 20-line file.

**Cons**
- Not the lowest-latency option at high QPS. Dedicated vector DBs win on raw p99 latency under sustained load (irrelevant at our scale, but real).
- HNSW index build time grows with vector count; rebuilding a large index briefly degrades query performance.
- pgvector UPDATE values require an explicit `::vector` cast and `db.execute(sql\`...\`)` rather than Drizzle's `.set()` — documented quirk in `packages/db/CLAUDE.md`, but a small footgun.
- Migration to a dedicated vector DB later, if ever needed, requires a backfill step (export embeddings, import to new system).

### Option B: Pinecone (managed)
**What it is:** Hosted managed vector DB. Serverless tier scales by usage. Industry default for many RAG-heavy products.

**Pros**
- Mature operational track record. The "default" reference architecture in lots of LLM tutorials.
- Serverless tier cost scales with usage; reasonable for low-volume.
- Strong p99 latency under sustained QPS.
- Hybrid search (sparse + dense) is well-supported.

**Cons**
- Adds a vendor relationship and operational concern for what is currently one feature.
- Two-system orchestration: course-reuse query becomes "query Pinecone → join with Postgres rows." The atomicity and transactional consistency story gets harder.
- Filter expressions are a Pinecone-specific DSL, not SQL. Joining with Postgres-side filters (e.g., `status = 'ready'`) is awkward.
- ~$70/month at 10M vectors (way past our scale); free tier exists but with sharp limits. Cost compounds with traffic.
- No RLS — access control is API-key-based, separate from our DB's policies. We'd be enforcing two access models.

### Option C: Qdrant (self-hosted or Qdrant Cloud)
**What it is:** Open-source vector DB written in Rust. Self-hostable on a small VPS or used via Qdrant Cloud.

**Pros**
- Best raw query performance among the dedicated vector DBs (low-single-digit ms p50 at 1M vectors).
- Open source — no vendor lock-in if self-hosted; same self-hosting option as escape hatch.
- Excellent filter + payload story; supports rich filter expressions natively.
- Qdrant Cloud is reasonably priced (~$30–$65/month for our likely scale).

**Cons**
- Same two-system problem as Pinecone — two stores, two consistency models, no transactional join.
- Self-hosting adds the ops we explicitly want to avoid (per [ADR-002](../../cross-cutting/ADR-002-database-platform.md) drivers). Qdrant Cloud removes that but at $30+/month for what pgvector does for free in our existing DB.
- We'd add a new connection pool, a new client library, a new dashboard. All for one feature.

### Option D: Weaviate (managed or self-hosted)
**What it is:** Open-source vector DB with hybrid search and a class/object data model.

**Pros**
- First-class hybrid search (BM25 + dense).
- Managed cloud option, large community.
- GraphQL query interface (some teams love it).

**Cons**
- The class-and-property data model is its own world. Adopting it for a single course-reuse query is like buying a server to play one song.
- Managed pricing trends higher than Qdrant Cloud at our scale.
- All the same two-system tradeoffs.

### Option E: Chroma (lightweight embedded / standalone)
**What it is:** Lightweight vector DB often used in dev / prototyping. Has a Cloud offering as of 2025.

**Pros**
- Minimal setup; SDK ergonomics for Python/JS are pleasant.
- Good for prototypes.

**Cons**
- Production-grade story is less established than Pinecone or Qdrant for serious workloads in 2026.
- Same orchestration overhead as any external store.
- Not where the long-term industry weight is.

### Option F: OpenAI vector store (via OpenAI's File Search / Assistants API)
**What it is:** Hosted vector store managed by OpenAI; embeddings + similarity baked into one product.

**Pros**
- Zero embedding-model coupling work; OpenAI manages the embedding step.
- Tight integration with OpenAI's tooling.

**Cons**
- Vendor lock-in to OpenAI for embeddings *and* search at once. Strongly conflicts with [ADR-009](../providers/ADR-009-external-vendor-abstraction.md) (we want LLM/embedding providers swappable).
- Filtering and joining with our relational data is awkward and partial.
- Pricing model is per-storage + per-query in a way that's harder to forecast than pgvector or Qdrant.

## Decision

**We use pgvector inside our Supabase Postgres.**

## Rationale

Lining up the drivers:

- **Single source of truth (#1)**: A is the only option that lets the similarity check run as one SQL statement joined to the rest of the course row. Every other option splits the workload across two systems.
- **Workload scale (#2)**: A handles our scale comfortably (thousands to low tens of thousands of vectors). The dedicated vector DBs only start materially winning past ~10M vectors per Supabase, vendor, and independent benchmarks — far above where we operate.
- **Operational footprint (#3)**: A adds nothing; B/C/D/E/F all add a vendor or a self-hosted system. For one feature, the math doesn't work.
- **Cost (#4)**: A is $0 marginal; managed alternatives are $30–$70+/month. Self-hosting Qdrant on a VPS is $20+/month and operational time we don't have.
- **Latency budget (#5)**: A's 15–25 ms p99 with HNSW is well inside our budget (course creation is queued, so the similarity check has effectively unbounded budget).
- **Filter + join (#6)**: SQL wins. The course-reuse query needs `WHERE status = 'ready' AND embedding IS NOT NULL ORDER BY embedding <=> $1 LIMIT 1` with a similarity threshold check, joined to the courses table. Two-system orchestrations make this multi-step and lose transactional clarity.
- **Future RAG path (#7)**: pgvector's known production ceiling is ~50M vectors per node. We are five orders of magnitude below that. If RAG over course *content* materializes and reaches the ceiling, we revisit then with real numbers.

What we are sacrificing by picking pgvector:

- Best-in-class raw vector-DB latency at scale (irrelevant at our size).
- The "RAG-first architecture" cleanliness of having a dedicated vector store (irrelevant for our actual workload — one similarity check at course creation, not a retrieval-heavy chat history).

No reconsideration flag is raised. pgvector is the first-principles choice
for our actual scale and access pattern. The "should we use a real vector
DB?" question is a 2027+ decision when the workload changes shape.

## Consequences

### Positive
- Course reuse implementation is a single SQL query against our existing DB.
- Backups, monitoring, RLS, IAM all inherit from the DB.
- $0 marginal cost for vector storage; one fewer vendor to monitor.
- Drizzle custom column type makes the developer experience clean.
- HNSW index gives latency well within our budget.

### Negative
- Embedding INSERTs and UPDATEs require explicit `::vector` casts via `db.execute(sql\`...\`)` — a documented Drizzle quirk.
- HNSW index build time grows with vector count; rebuilding briefly degrades performance.
- Postgres CPU is shared between vector and relational queries; a heavy ANN workload could affect the rest of the DB. At our scale, not a current concern.

### Follow-up decisions
- The 0.92 similarity threshold and the embedding model choice are operational; they live in `services/api/src/modules/courses/CLAUDE.md` and may evolve independently of this ADR.
- Reconsider this ADR if: vector count grows past ~5M (single-node Postgres ceiling becomes visible), latency budget tightens (e.g., a real-time RAG retrieval path emerges), or we add multi-vector / hybrid-search features pgvector handles awkwardly compared to dedicated stores.

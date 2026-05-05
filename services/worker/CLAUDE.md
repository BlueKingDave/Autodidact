# Subtree Instructions — services/worker/

> These rules apply only within `services/worker/`. They extend the root `CLAUDE.md`.

## Purpose of this subtree

Background job processor. Consumes BullMQ jobs from two Redis queues:

- `course-generation` — calls the Agent service to generate a full course blueprint, writes it and all module rows to PostgreSQL, then enqueues a follow-up embedding job.
- `embedding` — calls the Agent service to generate a topic embedding vector, stores it in `courses.topic_embedding` via raw pgvector SQL.

No HTTP server. No public interface. Runs as an always-on daemon.

---

## Invariants (must not be broken)

- **No HTTP routes** — this is a pure background worker. Do not add Express, Fastify, or NestJS.
- **Call Agent via `AgentClient`** — do not import LLM SDKs (OpenAI, Anthropic, LangChain) directly. All AI calls go through `src/services/agent.client.ts` to `AGENT_SERVICE_URL`.
- **Course status must be updated at each transition** — set `status = 'generating'` when the job starts; set `status = 'ready'` (inside the transaction) on success. A stuck `pending` or `generating` course is never recoverable by the user without manual intervention.
- **Module rows are inserted inside the same DB transaction as the course `status = 'ready'` update** — if either write fails, both roll back. Never split them.
- **The Worker is the only service that writes `status = 'ready'`** — the API service only writes `status = 'pending'`. Do not write `ready` from any other service.
- **Enqueue the embedding job after a successful course generation** — without the `GENERATE_EMBEDDING` job, `courses.topic_embedding` remains null and the course is never eligible for similarity reuse.

---

## Library / tooling rules

- Use:
  - `bullmq` (`Worker`) for job consumption
  - `@autodidact/db` (`getDb`, Drizzle ORM) for all database writes
  - `@autodidact/types` for job payload types (`CourseGenerationJobData`, `EmbeddingJobData`, `ModuleBlueprint`)
  - `@autodidact/providers` (`IQueueProvider`) for enqueuing follow-up jobs
  - `@autodidact/observability` for logging (never `console.log`)
- Do not use:
  - LLM SDKs directly (`@langchain/openai`, `@anthropic-ai/sdk`, etc.)
  - Express, Fastify, NestJS, or any HTTP framework
  - Raw `pg` or direct `postgres` imports — use `@autodidact/db`

---

## Source of truth

- Job payload types: `@autodidact/types` (`CourseGenerationJobData`, `EmbeddingJobData`)
- Queue and job name constants: `src/queues/definitions.ts`
- Agent HTTP contract: `src/services/agent.client.ts` and `services/agent/README.md`
- Database schema: `packages/db/src/schema/`

---

## Key patterns to follow

- **Retry config**: both workers use `{ attempts: 3, backoff: { type: 'exponential', delay: 5000 } }` — 5 s → 25 s → 125 s. Do not reduce attempts or disable backoff.
- **Raw SQL for pgvector**: the embedding processor uses `db.execute(sql\`UPDATE courses SET topic_embedding = ${literal}::vector ...\`)`. Drizzle's `.update().set()` does not cleanly handle the `::vector` cast. Keep this as raw SQL.
- **Graceful shutdown**: `main.ts` registers `SIGTERM`/`SIGINT` handlers that call `worker.close()` on each BullMQ Worker and `queueProvider.close()`. Preserve this pattern on any new workers.

---

## Anti-patterns to avoid

- Do not add an HTTP endpoint to this service.
- Do not call LLM providers directly — always go through `AgentClient`.
- Do not write `status = 'ready'` or `status = 'failed'` outside of the processors in this service.
- Do not insert module rows outside of the course-generation DB transaction.

---

## Commands / workflows

```bash
# From monorepo root
pnpm dev                                    # start all services including worker

# Worker only
pnpm --filter @autodidact/worker dev

# Tests
pnpm --filter @autodidact/worker test
```

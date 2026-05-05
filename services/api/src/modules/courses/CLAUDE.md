# Subtree Instructions — services/api/src/modules/courses/

> These rules apply only within `services/api/src/modules/courses/`. They extend `services/api/CLAUDE.md`.

## Purpose of this subtree

The courses module owns the course lifecycle from creation to enrollment:
- Semantic similarity check before creating a new course (deduplication)
- Course row creation and BullMQ job enqueueing for async generation
- Enrollment upsert and per-user `module_progress` row initialisation
- Course and module retrieval, and job status polling

---

## Invariants (must not be broken)

- **Always run the similarity check first**: `createOrReuse()` MUST call `agentClient.generateEmbedding()` and run the pgvector cosine similarity query before inserting a new course row. Never skip this step to force new course creation — it creates duplicates and wastes LLM calls.
- **Similarity threshold is 0.92**: a cosine similarity `>= 0.92` (i.e., `1 - (topic_embedding <=> vector) > 0.92`) reuses the existing ready, public course. Do not lower this threshold without measuring duplicate rate on production data.
- **Raw SQL for the similarity query**: the similarity search uses `db.execute(sql\`...\`)` with a raw SQL template rather than Drizzle's query builder. This is intentional — Drizzle's query builder does not handle the `::vector` cast for the pgvector `<=>` operator cleanly. Do not convert this to a Drizzle fluent query.
- **Course status lifecycle**: `'pending'` (inserted, job enqueued) → `'ready'` (Worker wrote the blueprint) or `'failed'`. The API service only writes `'pending'`; only the Worker writes `'ready'` or `'failed'`.
- **Enrollment initialisation**: when a user enrolls, `module_progress` rows are created for every module. Position 0 gets `status = 'available'`; all others get `status = 'locked'`. This is the only place these rows are created — do not create them elsewhere.

---

## Source of truth

- Embedding API contract: `src/services/agent.client.ts` (`generateEmbedding`)
- Queue job shape: `src/queues/definitions.ts` + `@autodidact/types` (`CourseGenerationJobData`)
- Schema tables: `courses`, `modules`, `enrollments`, `moduleProgress` in `@autodidact/db`

---

## Anti-patterns to avoid

- Bypassing `createOrReuse()` to insert a course directly (skips similarity check)
- Writing `'ready'` or `'failed'` status from the API service (Worker owns those transitions)
- Using Drizzle fluent query builder for the pgvector `<=>` expression (breaks the cast)

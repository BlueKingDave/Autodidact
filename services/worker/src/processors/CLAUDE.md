# Subtree Instructions — services/worker/src/processors/

> These rules apply only within `services/worker/src/processors/`. They extend `services/worker/CLAUDE.md`.

## Purpose of this subtree

BullMQ processor factory functions. Each file exports a `create*Worker()` function that instantiates a `Worker` for one queue. Both are registered in `main.ts` at startup.

| File | Queue | Job name | Concurrency |
|------|-------|----------|-------------|
| `course-generation.processor.ts` | `course-generation` | `generate-course` | 3 |
| `embedding.processor.ts` | `embedding` | `generate-embedding` | 5 |

---

## Course generation processor

### Job payload

```typescript
CourseGenerationJobData {
  courseId:    string   // UUID of the pre-created courses row
  userId:      string   // UUID of the requesting user
  topic:       string   // raw topic string from the user
  difficulty:  string   // e.g. 'beginner' | 'intermediate' | 'advanced'
  moduleCount: number   // number of modules to generate
}
```

### Processor steps

```
1. UPDATE courses SET status='generating'             (outside transaction)
2. agentClient.generateCourse(data) → CourseBlueprint (HTTP POST to Agent /course/generate)
3. DB transaction:
     a. UPDATE courses SET title, description, difficulty, estimatedHours,
                           status='ready', blueprint
     b. INSERT modules (one row per ModuleBlueprint from blueprint.modules)
4. queueProvider.enqueue(QUEUES.EMBEDDING, JOB_NAMES.GENERATE_EMBEDDING,
                          { courseId, topic },
                          { attempts: 3, backoff: { type: 'exponential', delay: 5000 } })
```

### Status lifecycle

```
pending     (API inserted the course row)
  │ job picked up
  ▼
generating  (step 1 — Worker marks it in-flight)
  │ steps 2–3 succeed
  ▼
ready       (step 3a — set inside the DB transaction)
  │ step 4 enqueues embedding job
  ▼
  [topic_embedding populated by EmbeddingProcessor]
```

### Idempotency on retry

BullMQ retries the job on any thrown error (up to 3 times, exponential backoff: 5 s → 25 s → 125 s). The processor does NOT delete existing modules before re-inserting. If a retry is triggered after step 3b has partially committed (unlikely given transaction semantics, but possible if the connection drops between steps), duplicate module rows can result.

Current approach: the transaction is atomic — if `INSERT modules` succeeds, so does `UPDATE courses ... status='ready'`. If BullMQ sees the job as failed, the course is in `generating` (not `ready`), meaning modules were not committed. Re-running step 3 on retry is safe.

If idempotency concerns grow (e.g., non-transactional failures mid-job), add a `DELETE FROM modules WHERE course_id = $courseId` before the `INSERT` inside the transaction.

### Error handling

Any throw propagates to BullMQ, which retries up to 3 times. After 3 failures the job moves to the Redis `failed` set. The course row is left in `generating` status — there is no automatic reset to `pending` or `failed`. A future cleanup job should handle this.

The `failed` event handler in `main.ts` logs the error at `logger.error` level.

---

## Embedding processor

### Job payload

```typescript
EmbeddingJobData {
  courseId: string  // UUID of the courses row (must be status='ready')
  topic:    string  // topic string to embed
}
```

### Processor steps

```
1. agentClient.generateEmbedding(topic) → number[] (1536 floats)
2. vectorLiteral = `[${vector.join(',')}]`
3. db.execute(sql`
     UPDATE courses
     SET topic_embedding = ${vectorLiteral}::vector,
         updated_at = NOW()
     WHERE id = ${courseId}::uuid
   `)
```

### Why raw SQL

Drizzle's `.update().set()` does not cleanly handle the `::vector` cast for parameterised pgvector values. The `sql` tagged template with `db.execute()` passes the vector as a literal string, bypassing this limitation. Do not convert this to a Drizzle fluent query.

### Invariants

- The `courses` row must already exist with `status = 'ready'` before this runs (guaranteed by job chaining: embedding is only enqueued after the course generation transaction commits).
- Do not write any other course columns from this processor — it sets only `topic_embedding` and `updated_at`.

---

## Retry configuration (both processors)

```typescript
{ attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
```

BullMQ delays: 5 s → 25 s → 125 s. After 3 failures the job moves to the `failed` set in Redis. No further retries occur automatically.

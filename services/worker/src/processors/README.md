# Processors

BullMQ worker processors. Each processor is a factory function that creates a `Worker` instance for one queue. Both are registered in `main.ts` at startup.

## Files

| File | Queue | Job name | Concurrency |
|------|-------|----------|-------------|
| `course-generation.processor.ts` | `course-generation` | `GENERATE_COURSE` | 3 |
| `embedding.processor.ts` | `embedding` | `GENERATE_EMBEDDING` | 5 |

---

## Course Generation Processor

**Queue**: `course-generation`  
**Job payload**: `CourseGenerationJobData { courseId, userId, topic, difficulty, moduleCount }`

### Status lifecycle

```
courses.status transitions:
  pending
    │ (job picked up)
    ▼
  generating
    │ (Agent call + DB write succeed)
    ▼
  ready
    │ (embedding job enqueued automatically)
    ▼
  [topic_embedding set by embedding processor]
```

If the Agent call throws, BullMQ retries (up to 3×, exponential backoff). The course remains in `generating` status. There is currently no automatic reset to `pending` on final failure — a stale `generating` course must be cleaned up manually.

### DB transaction

Course and module rows are written atomically:

```typescript
await db.transaction(async (tx) => {
  await tx.update(courses).set({
    title, description, difficulty,
    estimatedHours, status: 'ready', blueprint,
  }).where(eq(courses.id, courseId));

  await tx.insert(modules).values(moduleRows);
});
```

If either operation fails, neither is committed and the transaction rolls back.

### Job chaining

After a successful transaction, the processor enqueues an `EMBEDDING` job:

```typescript
await queueProvider.enqueue(QUEUES.EMBEDDING, JOB_NAMES.GENERATE_EMBEDDING, { courseId, topic }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
```

---

## Embedding Processor

**Queue**: `embedding`  
**Job payload**: `EmbeddingJobData { courseId, topic }`

### What it does

```typescript
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

Drizzle's `.update().set()` does not cleanly handle the `::vector` cast on parameterised values. The `sql` tagged template literal with `db.execute()` bypasses this limitation by passing the vector as a literal string.

The `courses` row must already exist and have `status = 'ready'` before this runs (guaranteed by job chaining order).

---

## Retry Configuration

Both processors use:
```typescript
{ attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
```

BullMQ delays: 5 s → 25 s → 125 s. After 3 failures the job moves to the `failed` set in Redis and no further retries occur.

# ADR-007: BullMQ + Redis for Background Job Processing

## Status

Accepted — 2026-05-05

## Context

Course generation is an LLM-heavy operation that takes 10–30 seconds. Running it synchronously in the API request/response cycle would: (a) block the HTTP connection for the entire duration, (b) lose work silently if the client disconnects before completion, and (c) provide no retry mechanism on LLM or network failure.

A background job queue decouples the API response from the generation work. The API can return a `jobId` immediately, and the client polls for status. The worker retries automatically on transient failures.

Redis was already in the stack (used for session caching and general caching). A queue technology that runs on Redis avoids adding a new infrastructure dependency.

## Decision

We use BullMQ with Redis as the background job queue. The API service enqueues `GENERATE_COURSE` jobs into the `course-generation` queue. The Worker service consumes them. After successful course generation, the Worker enqueues a follow-up `GENERATE_EMBEDDING` job into the `embedding` queue, also consumed by the Worker.

Both queues use `{ attempts: 3, backoff: { type: 'exponential', delay: 5000 } }` — retries at 5 s, 25 s, and 125 s.

## Consequences

### Positive

- API returns immediately with a `jobId`; clients poll `GET /v1/courses/status/:jobId` for completion
- Automatic retry on failure with exponential backoff; transient LLM or Agent service errors recover without user action
- Redis is already provisioned; no new infrastructure component
- BullMQ has a mature TypeScript API and ecosystem tooling (BullBoard for queue visibility)
- Worker is stateless and horizontally scalable — multiple instances can consume from the same queues

### Negative

- Redis is now a hard availability dependency for course creation, not just a performance cache; Redis downtime blocks all new course requests
- Job idempotency on retry must be handled in application code — BullMQ does not prevent duplicate module inserts if a job is partially committed before a retry
- After 3 failures, the course row is left in `generating` status with no automatic reset to `pending` or `failed`; stale `generating` courses require a future cleanup job

### Neutral

- BullMQ supports delayed jobs and cron scheduling; these features are not currently used but add surface area to the dependency

## Alternatives considered

- **PostgreSQL-based queue (pg-boss, pg-queue)**: Would eliminate the Redis dependency entirely by using the existing Supabase PostgreSQL instance. Rejected because Redis was already in the stack and BullMQ has a more complete TypeScript API with better backoff and retry semantics than pg-boss at the time of decision.
- **Temporal**: Offers durable workflow guarantees, built-in retry and compensation, and long-running process support. Rejected for MVP because it requires a dedicated Temporal server and cluster, adding operational complexity disproportionate to our current job graph (two sequential queue steps: generate course, then generate embedding).
- **Direct async (setTimeout / process.nextTick)**: No durability — jobs are lost on process restart. Rejected.

## References

- services/worker/README.md
- services/worker/src/processors/README.md
- ADR-002: Supabase (Redis is a separate component; Supabase handles the PostgreSQL DB)

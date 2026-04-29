# Worker Service

## Purpose

Background job processor for Autodidact. Handles the two async workloads that are too slow or expensive to run in the request/response cycle: course generation and embedding computation.

## Role in System

```
Redis (BullMQ queues)
      │
      ▼ dequeue
Worker Service ──▶ Agent Service (:3001)   [generate course, generate embedding]
               ──▶ PostgreSQL              [save course, modules, embedding vector]
               ──▶ Redis                   [enqueue embedding job after course gen]
```

The Worker has no HTTP server and no public interface. It runs as an always-on daemon, polling Redis queues. It is the only service that writes the full course blueprint and module rows to the database.

## Responsibilities

- Dequeue and process `COURSE_GENERATION` jobs
- Update course status through `pending → generating → ready` lifecycle
- Save course blueprint and all module rows in a single DB transaction
- Enqueue the follow-up `EMBEDDING` job after successful course generation
- Dequeue and process `EMBEDDING` jobs
- Call the Agent service to generate topic embedding vectors
- Store vectors in PostgreSQL via pgvector raw SQL

## Inputs / Outputs

**Inputs** (from Redis queues)

| Queue | Job name | Payload |
|-------|----------|---------|
| `course-generation` | `GENERATE_COURSE` | `{ courseId, userId, topic, difficulty, moduleCount }` |
| `embedding` | `GENERATE_EMBEDDING` | `{ courseId, topic }` |

Jobs are enqueued by the API service (`CoursesService`) when a new course request arrives without a similarity match.

**Outputs**

| Target | What |
|--------|------|
| PostgreSQL | `courses` status update (generating → ready), `modules` rows inserted |
| PostgreSQL | `courses.topic_embedding` set via raw SQL |
| Redis | `GENERATE_EMBEDDING` job enqueued after successful course generation |

## Internal Components

| Component | Path | Description |
|-----------|------|-------------|
| **CourseGenerationProcessor** | `src/processors/course-generation.processor.ts` | BullMQ Worker for `COURSE_GENERATION` queue. Concurrency: 3. |
| **EmbeddingProcessor** | `src/processors/embedding.processor.ts` | BullMQ Worker for `EMBEDDING` queue. Concurrency: 5. |
| **AgentClient** | `src/services/agent.client.ts` | HTTP client for Agent service. Methods: `generateCourse()`, `generateEmbedding()`. |

## Key Flows

### Course generation job

```
GENERATE_COURSE job { courseId, userId, topic, difficulty, moduleCount }
  1. UPDATE courses SET status='generating'
  2. agentClient.generateCourse(data) → CourseBlueprint
  3. DB transaction:
       a. UPDATE courses SET title, description, difficulty, estimatedHours,
                             status='ready', blueprint
       b. INSERT modules (one row per ModuleBlueprint)
  4. queueProvider.enqueue(EMBEDDING, { courseId, topic })
```

If the Agent call throws, BullMQ retries up to 3 times with exponential backoff (5 s base). After 3 failures, the job moves to the `failed` state and the course status remains `generating` (stale — needs a cleanup job in the future).

### Embedding job

```
GENERATE_EMBEDDING job { courseId, topic }
  1. agentClient.generateEmbedding(topic) → number[]
  2. db.execute(sql`
       UPDATE courses
       SET topic_embedding = ${vectorLiteral}::vector, updated_at = NOW()
       WHERE id = ${courseId}::uuid
     `)
```

Raw `execute()` is used instead of Drizzle's `.update().set()` because Drizzle's custom vector column type does not handle the `::vector` cast cleanly in parameterised queries.

### Job chaining

```
GENERATE_COURSE completes
      └──▶ enqueue GENERATE_EMBEDDING
                   └──▶ topic_embedding stored on courses row
                              └──▶ course becomes eligible for reuse (similarity search)
```

The embedding must be stored for course reuse to work. The two-job chain ensures the vector is always computed after a successful course generation.

## Run / Dev Notes

```bash
# From monorepo root
pnpm dev                              # starts all services including worker

# Worker only
pnpm --filter @autodidact/worker dev

# Tests
pnpm --filter @autodidact/worker test
```

**Environment variables**:

| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Redis connection string (default: `redis://localhost:6379`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `AGENT_SERVICE_URL` | Internal URL of Agent service (default: `http://localhost:3001`) |
| `QUEUE_PROVIDER` | `bullmq` (default) |

**Deployment note**: The Worker service must have min 1 instance on Cloud Run to prevent a cold-start queue backlog. Set `min-instances = 1` in the Terraform module (already configured).

See also:
- [Processors](src/processors/README.md)

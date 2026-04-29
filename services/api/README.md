# API Service

## Purpose

The public-facing HTTP API for Autodidact. It is the only service that the mobile app communicates with directly.

## Role in System

```
Mobile App
    │
    ▼ HTTPS REST + SSE
API Service (:3000)
    ├──▶ Agent Service (:3001)   [internal HTTP — embeddings, chat stream]
    ├──▶ Redis                   [BullMQ job enqueue]
    └──▶ PostgreSQL              [course data, enrollments, progress, sessions]
```

The API owns the authentication boundary. Every request is verified against a Supabase JWT before reaching business logic. The API does not run AI models — it orchestrates work to the Agent and Worker services.

## Responsibilities

- Verify Supabase JWT tokens on every protected endpoint
- Manage the course lifecycle: semantic similarity check → enroll or enqueue generation
- Proxy Server-Sent Events from the Agent service to the mobile app
- Persist chat session messages to the database
- Track per-user module progress (started, completed, unlock next)
- Expose a job status polling endpoint for in-progress course generation

## Inputs / Outputs

**HTTP API** (port 3000, public)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Liveness check |
| POST | `/courses` | JWT | Create or reuse a course |
| GET | `/courses` | JWT | List enrolled courses |
| GET | `/courses/:id` | JWT | Course + module list |
| POST | `/courses/:id/enroll` | JWT | Enroll in a course |
| GET | `/courses/status/:jobId` | JWT | Poll background job |
| POST | `/chat/sessions` | JWT | Create chat session |
| POST | `/chat/sessions/:id/stream` | JWT | Stream chat (SSE) |
| GET | `/progress/:courseId` | JWT | Module progress list |
| POST | `/progress/:moduleId/start` | JWT | Mark module started |

**Outbound calls**

| Target | Call | When |
|--------|------|------|
| Agent service | `POST /embeddings/text` | Every `POST /courses` request |
| Agent service | `POST /module-chat/stream` | Every chat stream request |
| Redis (BullMQ) | Enqueue `GENERATE_COURSE` | New course (no similarity match) |
| PostgreSQL | Read/write | All business logic |

## Internal Components

| Module | Path | Responsibility |
|--------|------|----------------|
| **AuthModule** | `src/modules/auth/` | `AuthGuard` — verifies JWT, injects `AuthUser` into request |
| **CoursesModule** | `src/modules/courses/` | Course creation, enrollment, listing, job polling |
| **ChatModule** | `src/modules/chat/` | Session creation, SSE streaming proxy, message persistence |
| **ProgressModule** | `src/modules/progress/` | Module status tracking and sequential unlock |
| **AgentClient** | `src/services/agent.client.ts` | HTTP wrapper for Agent service calls |
| **QueueProvider** | injected via `QUEUE_PROVIDER_TOKEN` | BullMQ job enqueue |
| **Common** | `src/common/` | `ZodValidationPipe`, `AllExceptionsFilter`, `@CurrentUser()` |

## Key Flows

### Course creation

```
POST /courses { topic, difficulty, moduleCount }
  1. Call Agent /embeddings/text → float[]
  2. Cosine similarity query (pgvector <=> operator, threshold 0.92)
  3a. Match found → enrollUser(userId, existingCourseId) → return { courseId, status: 'ready', reused: true }
  3b. No match   → INSERT courses (status: 'pending')
                 → BullMQ.enqueue(COURSE_GENERATION, { courseId, topic, ... })
                 → return { courseId, jobId, status: 'pending', reused: false }
```

### Chat streaming

```
POST /chat/sessions/:id/stream { content }
  1. Load session → load module blueprint
  2. Append user ChatMessage to JSONB
  3. fetch(Agent /module-chat/stream) → ReadableStream
  4. Forward SSE tokens to client via RxJS Subject → @Sse observable
  5. Accumulate assistant content
  6. On 'complete' event: persist assistant ChatMessage
  7. If completionScore >= 60: ProgressService.completeModule()
```

### Module completion

```
ProgressService.completeModule(userId, moduleId, courseId, score)
  1. UPDATE module_progress SET status='completed', score=N
  2. UPDATE module_progress SET status='available' WHERE position = completedPosition + 1
  3. If all modules completed → UPDATE enrollments SET completed_at = NOW()
```

## Run / Dev Notes

```bash
# From monorepo root
pnpm dev                          # starts all services including api

# API only
pnpm --filter @autodidact/api dev

# Tests
pnpm --filter @autodidact/api test
```

**Environment variables** (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `API_PORT` | HTTP port (default 3000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_JWT_SECRET` | JWT verification key |
| `SUPABASE_SECRET_KEY` | Admin access key |
| `REDIS_URL` | Redis connection string |
| `AGENT_SERVICE_URL` | Internal URL of Agent service |
| `AUTH_PROVIDER` | `supabase` (default) |
| `QUEUE_PROVIDER` | `bullmq` (default) |

See also:
- [Module: Auth](src/modules/auth/README.md)
- [Module: Courses](src/modules/courses/README.md)
- [Module: Chat](src/modules/chat/README.md)
- [Module: Progress](src/modules/progress/README.md)

# C4 Level 2 — Containers

This diagram zooms into the Autodidact system and shows each deployable unit (container), its technology, and how containers communicate.

```mermaid
C4Container
    title Container Diagram — Autodidact

    Person(learner, "Learner", "Uses the mobile app")

    System_Boundary(autodidact, "Autodidact") {
        Container(mobile, "Mobile App", "Expo / React Native", "UI for course creation, module learning, and progress tracking. Runs on iOS and Android.")
        Container(api, "API Service", "NestJS / Node.js :3000", "Public REST API. Handles auth, course orchestration, SSE chat proxy, and progress tracking.")
        Container(agent, "Agent Service", "Fastify / LangGraph :3001", "Internal AI service. Runs LangGraph graphs for course generation and module chat. Streams SSE.")
        Container(worker, "Worker Service", "BullMQ / Node.js (no HTTP)", "Background job processor. Runs course generation and embedding jobs from the queue.")
        ContainerDb(postgres, "PostgreSQL", "Supabase / pgvector", "Primary data store. Courses, modules, enrollments, progress, chat sessions, user profiles.")
        ContainerDb(redis, "Redis", "Redis 7 / BullMQ", "Job queue backend. Stores BullMQ job state for COURSE_GENERATION and EMBEDDING queues.")
    }

    System_Ext(llm, "LLM Provider", "OpenAI or Anthropic (configured via env)")
    System_Ext(supabase_auth, "Supabase Auth", "JWT verification service")

    Rel(learner, mobile, "Uses", "Touch / UI")
    Rel(mobile, api, "REST + SSE", "HTTPS")
    Rel(api, agent, "Course gen + embeddings + chat stream", "HTTP (internal)")
    Rel(api, redis, "Enqueues background jobs", "Redis protocol")
    Rel(api, postgres, "Reads/writes course, enrollment, progress, session data", "PostgreSQL")
    Rel(api, supabase_auth, "Verifies JWT tokens", "HTTPS")
    Rel(worker, redis, "Dequeues and acks jobs", "Redis protocol")
    Rel(worker, agent, "Calls generate-course and embeddings routes", "HTTP (internal)")
    Rel(worker, postgres, "Updates course status, inserts modules, stores embeddings", "PostgreSQL")
    Rel(agent, llm, "Invokes LLM for generation and teaching", "HTTPS")
    Rel(agent, postgres, "Reads/writes LangGraph checkpoints (prod)", "PostgreSQL")
```

## Container Descriptions

### Mobile App
| | |
|---|---|
| **Technology** | Expo + React Native + TypeScript |
| **Routing** | Expo Router (file-based) |
| **State** | TanStack Query (server state), Zustand (auth session + streaming chat) |
| **Auth token** | Stored in Expo SecureStore via Zustand persist |
| **SSE** | `@microsoft/fetch-event-source` for streaming chat |
| **Network** | Talks only to API Service (never directly to Agent or Worker) |

### API Service
| | |
|---|---|
| **Technology** | NestJS + TypeScript |
| **Port** | 3000 (public, behind Cloud Run ingress) |
| **Auth** | `AuthGuard` verifies Supabase JWT on every protected route |
| **DI** | 4 feature modules: Auth, Courses, Chat, Progress. Queue provider injected by token. |
| **SSE proxy** | Chat stream: proxies Agent SSE via native `fetch` → RxJS `Subject` → NestJS `@Sse` |
| **Queue** | Enqueues `COURSE_GENERATION` jobs via `IQueueProvider` |

### Agent Service
| | |
|---|---|
| **Technology** | Fastify + LangGraph TypeScript |
| **Port** | 3001 (**internal only** — not publicly accessible) |
| **Graphs** | `CourseGenerationGraph` and `ModuleChatGraph` (see C4 Level 3) |
| **Checkpointer** | `MemorySaver` in dev, `PostgresSaver` in prod (controlled by `CHECKPOINTER` env) |
| **Streaming** | Raw SSE via `reply.raw.write()` with `streamMode: 'messages'` |

### Worker Service
| | |
|---|---|
| **Technology** | Node.js + BullMQ (no HTTP server) |
| **Queues** | `COURSE_GENERATION` (concurrency 3), `EMBEDDING` (concurrency 5) |
| **Job chaining** | After course generation completes, enqueues `EMBEDDING` job automatically |
| **Retries** | 3 attempts, exponential backoff (5 s base delay) |
| **Deployment** | Cloud Run with min 1 instance (always-on daemon) |

### PostgreSQL (Supabase)
| | |
|---|---|
| **Extension** | `pgvector` for 1536-dimensional topic embeddings |
| **RLS** | Row Level Security applied in migration 0003 |
| **Access** | API and Worker via `DATABASE_URL` (Drizzle ORM). Agent in prod for checkpointer. |
| **Schema** | 6 tables: `users`, `courses`, `modules`, `enrollments`, `module_progress`, `chat_sessions` |

### Redis
| | |
|---|---|
| **Version** | Redis 7 |
| **Deployment** | GCP Memorystore (prod), Docker (local dev) |
| **Usage** | BullMQ queue backend only (no session storage or caching) |
| **Queues** | `course-generation`, `embedding` |

## Communication Map

| From | To | Protocol | Description |
|------|----|----------|-------------|
| Mobile | API | HTTPS REST | Course creation, listing, enrollment, progress |
| Mobile | API | HTTPS SSE | Chat message streaming |
| API | Agent | HTTP POST | Embedding generation, SSE chat proxying |
| API | Agent | HTTP POST | (via Worker) Course blueprint generation |
| API | Redis | Redis | Enqueue `COURSE_GENERATION` job |
| Worker | Redis | Redis | Dequeue and ack jobs |
| Worker | Agent | HTTP POST | `/generate-course`, `/embeddings/text` |
| Worker | PostgreSQL | SQL | Update course status, insert modules, store embeddings |
| Agent | LLM Provider | HTTPS | Course generation, teaching, evaluation |
| Agent | PostgreSQL | SQL | LangGraph checkpoint reads/writes (prod only) |

## Network Boundaries

```
Internet
  └── Cloud Run (public ingress)
        └── API Service (:3000)
              ├── → Agent Service (:3001)  [Cloud Run internal]
              ├── → Redis                  [VPC private]
              └── → Supabase PostgreSQL    [external managed]
Worker Service  [Cloud Run internal, no inbound]
              ├── → Agent Service
              ├── → Redis
              └── → Supabase PostgreSQL
```

---

_Previous: [C4 Level 1 — Context](c4-context.md) | Next: [C4 Level 3 — Components](c4-components.md)_

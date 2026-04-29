# C4 Level 1 — System Context

This diagram shows Autodidact as a single system box and maps out every external actor and dependency it communicates with.

```mermaid
C4Context
    title System Context — Autodidact

    Person(learner, "Learner", "Creates courses, completes modules through AI chat on their mobile device.")

    System(autodidact, "Autodidact", "AI-native learning platform. Generates structured courses and teaches them through module-based conversations.")

    System_Ext(supabase, "Supabase", "Managed PostgreSQL database with pgvector extension. Also provides JWT-based authentication.")
    System_Ext(openai, "OpenAI", "LLM (GPT-4o) for course generation and teaching. Embeddings (text-embedding-3-small) for topic similarity.")
    System_Ext(anthropic, "Anthropic (optional)", "Alternative LLM provider (Claude). Activated via LLM_PROVIDER=anthropic env var.")
    System_Ext(redis, "Redis", "Queue backend for BullMQ background jobs. Also stores BullMQ job state.")
    System_Ext(gcp, "Google Cloud Platform", "Cloud Run (compute), Artifact Registry (Docker images), Secret Manager (credentials), Memorystore (Redis).")
    System_Ext(otel, "OpenTelemetry Collector (optional)", "Receives distributed traces from all backend services via OTLP HTTP.")

    Rel(learner, autodidact, "Uses", "HTTPS / mobile app")
    Rel(autodidact, supabase, "Reads/writes data, verifies JWTs", "PostgreSQL / REST")
    Rel(autodidact, openai, "Generates courses, embeddings, teaches modules", "HTTPS / OpenAI API")
    Rel(autodidact, anthropic, "Generates courses, teaches modules (if configured)", "HTTPS / Anthropic API")
    Rel(autodidact, redis, "Enqueues and processes background jobs", "Redis protocol")
    Rel(autodidact, gcp, "Runs on, stores secrets, pushes images", "GCP APIs")
    Rel(autodidact, otel, "Sends traces", "OTLP HTTP")
```

## Actors

| Actor | Type | Description |
|-------|------|-------------|
| Learner | Person | The end user. Creates courses by entering a topic, then works through sequential module chats on a mobile device. |

## External Systems

| System | Role |
|--------|------|
| **Supabase** | PostgreSQL database (primary data store), JWT auth (user sign-up/sign-in), pgvector extension (course similarity search), Row Level Security policies. |
| **OpenAI** | Default LLM for course generation and AI teaching. Default embedding model for topic similarity. |
| **Anthropic** | Optional alternative LLM. Activated with a single env var (`LLM_PROVIDER=anthropic`), no code changes needed. |
| **Redis** | Backing store for BullMQ background job queues. Holds job state, retries, and delays. In production: GCP Memorystore. |
| **Google Cloud Platform** | Compute (Cloud Run), container registry (Artifact Registry), secret storage (Secret Manager), managed Redis (Memorystore). |
| **OpenTelemetry Collector** | Optional trace aggregation. All services are instrumented but the exporter is a no-op unless `OTEL_EXPORTER_OTLP_ENDPOINT` is set. |

## What crosses the system boundary

- **Inbound**: Mobile app sends HTTPS requests and consumes Server-Sent Events.
- **Outbound (data)**: Course blueprints, embeddings, and conversation history are persisted in Supabase PostgreSQL.
- **Outbound (AI)**: Every course generation and every chat message turn calls the configured LLM provider.
- **Outbound (async)**: Course generation jobs are enqueued to Redis; workers pull and process them independently.

## What stays inside

The API, Agent, and Worker services are all internal. The mobile app only talks to the API service directly. The Agent service is never exposed publicly.

---

_Next: [C4 Level 2 — Containers](c4-containers.md)_

# Autodidact

AI-native learning platform that generates structured courses and teaches them through module-based conversations.

## Features

- Generate courses from any subject request
- Learn one module at a time through AI chat
- Track module completion and progress
- Reuse cached course blueprints via semantic similarity
- Mobile-first experience
- Provider-agnostic architecture (swap LLM/embedding/queue/auth via env vars)

## Tech Stack

### Frontend
- Expo + React Native + TypeScript
- Expo Router
- TanStack Query
- Zustand

### Backend
- NestJS (API)
- LangGraph TS (Agent)
- BullMQ (Worker)

### Data
- Supabase PostgreSQL
- Drizzle ORM
- Redis
- pgvector

### Infra
- Google Cloud Run
- GitHub Actions
- Artifact Registry
- Terraform

## Project Structure

```
autodidact/
├── apps/
│   └── mobile/
├── services/
│   ├── api/
│   ├── agent/
│   └── worker/
├── packages/
│   ├── providers/     ← provider interfaces + factory (no vendor lock-in)
│   ├── db/
│   ├── schemas/
│   ├── prompts/
│   ├── types/
│   ├── config/
│   └── observability/
├── infra/
└── docs/
```

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Copy and fill env vars
cp .env.example .env

# 3. Start local infrastructure
docker compose up -d

# 4. Run database migrations
pnpm --filter @autodidact/db db:migrate

# 5. Start all services in dev mode
pnpm dev
```

## Provider Configuration

Provider selection is driven by environment variables — no code changes needed to swap:

| Variable | Options | Default |
|----------|---------|---------|
| `LLM_PROVIDER` | `openai`, `anthropic` | `openai` |
| `EMBEDDING_PROVIDER` | `openai`, `cohere` | `openai` |
| `QUEUE_PROVIDER` | `bullmq` | `bullmq` |
| `AUTH_PROVIDER` | `supabase` | `supabase` |
| `CHECKPOINTER` | `memory`, `postgres` | `memory` |

## Documentation

- [Architecture](docs/architecture.md)
- [Stack decisions](docs/stack.md)
- [Product vision](docs/product.md)
- [Roadmap](docs/roadmap.md)

## Status

MVP build complete. Production-first architecture.

## License

Private project.

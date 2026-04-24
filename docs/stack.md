# Stack Decisions

## Monorepo
- **pnpm** — workspace management
- **Turborepo** — task orchestration and caching

## Mobile
- **Expo + React Native** — fast iteration and native delivery
- **Expo Router** — file-based routing
- **TanStack Query v5** — server state management
- **Zustand v5** — client state (auth session, chat messages)

## API
- **NestJS** — structured TypeScript backend with DI container
- Auth via `IAuthProvider` interface (default: Supabase JWT)

## Agent Runtime
- **LangGraph TypeScript** — stateful AI workflows and graph orchestration
- **Fastify** — lightweight HTTP server for service-to-service calls
- **MemorySaver** (dev) / **PostgresSaver** (prod) — conversation memory checkpointing

## Background Jobs
- **BullMQ** — reliable async processing via `IQueueProvider` interface
- **Redis** — queue backend and BullMQ state store

## Database
- **Supabase PostgreSQL** — relational data + managed infrastructure
- **Drizzle ORM** — SQL-first, type-safe schema management
- **pgvector** — course topic embeddings for semantic similarity search (course reuse)

## Provider Abstraction
- All LLM, embedding, queue, auth, and checkpointer dependencies go through interfaces
- `packages/providers` contains interfaces + implementations + a factory driven by env vars
- Current defaults: OpenAI (LLM + embeddings), BullMQ (queue), Supabase (auth), Memory (checkpointer)

## Hosting
- **Google Cloud Run** — containerized serverless deployment, autoscaling

## CI/CD
- **GitHub Actions** — lint/typecheck, Docker build+push, migration run, Cloud Run deploy
- **Workload Identity Federation** — keyless GCP auth from GitHub Actions (no service account keys)

## Mobile Distribution
- **EAS Build** — managed Expo build service for iOS + Android

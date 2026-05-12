# Superseded ADRs

Historical originals of ADRs that have been replaced. Kept for audit / archaeology.
Do not edit; do not link from current docs.

## Why these are here

In May 2026 the ADR system was reframed from "one ADR per dependency" to
"one ADR per architectural decision area," with a new template requiring
≥3 neutrally-compared options, first-principles reasoning, and reconsideration
flags where warranted. The originals below were superseded under that change:

| Original | Superseded by |
|---|---|
| ADR-001-monorepo.md | `cross-cutting/ADR-001-monorepo-build-orchestration.md` |
| ADR-002-supabase.md | `cross-cutting/ADR-002-database-platform.md` + `cross-cutting/ADR-020-authentication-strategy.md` |
| ADR-003-expo-mobile.md | `apps/mobile/ADR-003-mobile-application-platform.md` |
| ADR-004-nestjs-api.md | `services/api/ADR-004-rest-api-framework.md` |
| ADR-005-fastify-agent.md | `services/agent/ADR-005-ai-agent-server-framework.md` |
| ADR-006-langgraph-conversations.md | `services/agent/ADR-006-ai-orchestration-framework.md` |
| ADR-007-bullmq-redis.md | `services/worker/ADR-007-background-job-queue.md` |
| ADR-008-drizzle-orm.md | `packages/db/ADR-008-orm-data-access.md` |
| ADR-009-provider-abstraction.md | `packages/providers/ADR-009-external-vendor-abstraction.md` |
| ADR-010-pgvector-course-reuse.md | `packages/db/ADR-010-vector-search-strategy.md` |
| ADR-011-sse-streaming.md | `services/agent/ADR-011-realtime-streaming-transport.md` |
| ADR-012-gcp-cloud-run-terraform.md | `infra/ADR-012-cloud-hosting-platform.md` + `infra/ADR-021-infrastructure-as-code.md` |

# Roadmap

## Phase 1 — MVP (current)
- [x] Monorepo scaffold
- [x] Shared packages (types, schemas, db, providers, prompts, observability)
- [x] Database schema + migrations + RLS
- [x] Agent service (course generation graph, module chat graph)
- [x] Worker service (async course generation, embeddings)
- [x] API service (auth, courses, chat SSE, progress)
- [x] Mobile app (home, course list, course detail, module chat)
- [x] Infrastructure (Terraform, Cloud Run, Memorystore)
- [x] CI/CD (GitHub Actions)

## Phase 2 — Polish
- [ ] Course generation progress indicator (WebSocket or SSE to mobile during generation)
- [ ] Module completion animations
- [ ] Course search / browse public courses
- [ ] Push notifications for completion streaks
- [ ] Offline support for previously loaded modules

## Phase 3 — Scale
- [ ] Swap `MemorySaver` to `PostgresSaver` for production conversation persistence
- [ ] Add Anthropic as alternative LLM provider (one env var change)
- [ ] Add Cohere embeddings provider
- [ ] Web app (`apps/web`) using same API
- [ ] Admin panel for course moderation
- [ ] RAG integration for domain-specific knowledge via pgvector

## Phase 4 — Community
- [ ] User-created courses
- [ ] Course ratings and reviews
- [ ] Learning streaks and leaderboards
- [ ] Course sharing via deep links

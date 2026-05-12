# ADR-010: pgvector Semantic Similarity for Course Reuse

## Status

Accepted — 2026-05-05

## Context

When a user requests a course on a topic, generating a new course via LLM every time is slow (~10–30 s) and expensive. Many topic requests are semantically similar — "Python for beginners" and "Getting started with Python" have near-identical intent but different strings, so exact or fuzzy text matching would treat them as distinct.

pgvector is available as a Supabase-managed PostgreSQL extension. Topic embeddings are generated at course creation time and stored in `courses.topic_embedding` as a 1536-dimension float vector (using OpenAI `text-embedding-3-small`).

The constraint is that we need sub-second response time for the similarity check — the check must be cheap enough to run on every course creation request, even when it does not find a match.

## Decision

When a user requests a new course, `CoursesService.createOrReuse()` does the following before inserting a new course row:

1. Generate an embedding for the requested topic via the Agent `/embeddings/text` endpoint.
2. Run a cosine similarity query using the pgvector `<=>` operator against `courses.topic_embedding`.
3. If the closest match has cosine similarity `> 0.92` (i.e., `1 - (topic_embedding <=> vector) > 0.92`), reuse that course and enroll the user.
4. Otherwise, insert a new course row and enqueue a `GENERATE_COURSE` job.

The 0.92 threshold was chosen empirically: it accepts "Python for beginners" ≈ "Learn Python from scratch" but rejects semantically distinct topics that happen to share vocabulary.

The similarity query uses raw `db.execute(sql\`...\`)` because Drizzle's query builder does not cleanly handle the `::vector` cast for the pgvector `<=>` operator in parameterised queries.

## Consequences

### Positive

- Typical course request responds in ~200 ms (embedding + vector query) instead of 10–30 s when a match is found
- LLM generation costs are amortized across all users who request similar topics
- No separate vector database — pgvector runs inside the existing Supabase PostgreSQL instance, avoiding a new infrastructure component and cross-service consistency issues

### Negative

- Reused courses reflect the quality of the original generation; an early low-quality course for a topic gets reused until the course is manually corrected or deleted
- The 0.92 threshold is a heuristic — edge cases exist in both directions (similar topics that fall outside threshold, distinct topics that fall inside)
- pgvector cosine similarity queries on large `courses` tables require an HNSW or IVFFlat index to remain performant; this index must be created and maintained (see `packages/db/migrations/0002_indexes.sql`)
- Raw SQL is required in `CoursesService` and `EmbeddingProcessor` due to the `::vector` cast limitation in Drizzle; this pattern must be preserved and not converted to fluent query builder calls

### Neutral

- Embedding dimensions are tied to the embedding model (1536 for `text-embedding-3-small`); changing models requires re-embedding all courses
- Only `status = 'ready'` and `is_public = TRUE` courses are candidates for reuse; courses still generating are excluded from the similarity search

## Alternatives considered

- **Exact or fuzzy string match (e.g., Levenshtein distance, trigram similarity)**: Rejected — "Python basics" would not match "Getting started with Python" despite identical learning intent. String similarity cannot capture semantic equivalence.
- **LLM-based deduplication** (ask the LLM "are these the same topic?"): Rejected — adds LLM latency and cost to every course creation request, including those that will not find a match. Embedding similarity is faster and cheaper.
- **Separate vector database (Pinecone, Weaviate, Qdrant)**: Rejected — adds infrastructure complexity and a new operational dependency. pgvector inside Supabase is sufficient at current scale and avoids cross-service data consistency issues.

## References

- services/api/src/modules/courses/courses.service.ts (similarity query implementation)
- services/api/src/modules/courses/CLAUDE.md (invariants: do not lower the 0.92 threshold)
- packages/db/src/schema/courses.ts (`topic_embedding` column)
- packages/db/migrations/0002_indexes.sql (pgvector index)
- ADR-002: Supabase (pgvector runs as a Supabase-managed PostgreSQL extension)
- ADR-007: BullMQ + Redis (course generation is async; similarity check determines whether to enqueue)

# Migrations

SQL migration files managed by Drizzle Kit. Applied sequentially against the database.

## Files

| File | Description |
|------|-------------|
| `0001_initial.sql` | Creates all tables, enum types, and enables the `vector` extension |
| `0002_indexes.sql` | Adds performance indexes (FK columns, status columns, HNSW vector index) |
| `0003_rls.sql` | Row Level Security policies restricting user data access |

---

## Migration 0001 — Initial Schema

Creates:
- `CREATE EXTENSION IF NOT EXISTS vector` — pgvector extension for `topic_embedding`
- Enum types: `course_status_enum`, `module_status_enum`, `difficulty_enum`
- All six tables: `users`, `courses`, `modules`, `enrollments`, `module_progress`, `chat_sessions`

---

## Migration 0002 — Indexes

Performance indexes added after the schema was stable:
- Foreign key columns (standard `btree` indexes for join performance)
- Status filter columns (`courses.status`, `module_progress.status`)
- Vector HNSW index on `courses.topic_embedding` for fast similarity queries

The HNSW index is the most important: without it, pgvector performs a sequential scan on all embeddings for every `POST /courses` request.

---

## Migration 0003 — Row Level Security

Enables RLS on tables that store user-owned data (`enrollments`, `module_progress`, `chat_sessions`). Policies restrict SELECT, INSERT, UPDATE, and DELETE to rows owned by the authenticated user.

The API and Worker services connect with the **service role key**, which bypasses RLS. RLS protects against direct database access (e.g., via the Supabase dashboard or a client connecting with the anon key).

---

## Workflow

### Generate a new migration after schema changes

```bash
# Edit the relevant table file in packages/db/src/schema/
pnpm --filter @autodidact/db db:generate
# Review the generated SQL in migrations/
git add packages/db/migrations/
```

### Apply migrations

```bash
# Development (runs against DATABASE_URL in .env)
pnpm --filter @autodidact/db db:migrate

# CI/CD applies migrations before deploying new service images
```

### Configuration

`drizzle.config.ts` in the package root:
```typescript
{
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  dbCredentials: { url: process.env.DATABASE_URL }
}
```

---

## Safety Notes

- **Never edit existing migration files.** If you need to fix a previous migration, create a new one.
- **Always review generated SQL.** `db:generate` compares the current schema against the database snapshot. If the snapshot is stale, it may generate unexpected changes.
- **Run in CI before deploying.** The GitHub Actions workflow runs `db:migrate` before rolling out new service images. If a migration fails, the deploy stops.

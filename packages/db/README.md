# @autodidact/db

## Purpose

Drizzle ORM client, schema definitions, database migrations, and pgvector type support. This is the single source of truth for database structure.

## Consumers

| Consumer | Usage |
|----------|-------|
| `services/api` | Course queries, enrollment, progress, chat sessions |
| `services/worker` | Course status updates, module inserts, embedding storage |
| `services/agent` | LangGraph PostgresSaver checkpointer (prod only) |

## Public API

```typescript
import {
  getDb,             // singleton Drizzle instance
  getPool,           // raw pg Pool (for migrations, raw queries)

  // Tables (Drizzle query builders)
  users,
  courses,
  modules,
  enrollments,
  moduleProgress,
  chatSessions,

  // Re-exported query helpers
  eq, and, or, sql, inArray,

  // Type
  type DB,
} from '@autodidact/db';
```

> **Pattern**: Call `getDb()` at query time, not at module initialisation. The client is a lazy singleton keyed on `DATABASE_URL`.

## Internal Structure

```
packages/db/
├── src/
│   ├── client.ts        # pg Pool + Drizzle instance, getDb() / getPool()
│   ├── supabase.ts      # Supabase admin client (service role, server-side only)
│   ├── vector.ts        # Custom Drizzle column type for pgvector
│   ├── index.ts         # Re-exports everything above + schema
│   └── schema/
│       ├── index.ts     # Re-exports all tables
│       ├── enums.ts     # courseStatusEnum, moduleStatusEnum, difficultyEnum
│       ├── users.ts
│       ├── courses.ts
│       ├── modules.ts
│       ├── enrollments.ts
│       ├── module_progress.ts
│       └── chat_sessions.ts
├── migrations/
│   ├── 0001_initial.sql      # Tables + pgvector extension
│   ├── 0002_indexes.sql      # Performance indexes
│   └── 0003_rls.sql          # Row Level Security policies
└── drizzle.config.ts         # Points drizzle-kit at DATABASE_URL
```

## Usage Example

```typescript
import { getDb, courses, modules, eq } from '@autodidact/db';

// Basic query
const db = getDb();
const course = await db
  .select()
  .from(courses)
  .where(eq(courses.id, courseId))
  .limit(1);

// Raw SQL (required for pgvector operations)
import { sql } from '@autodidact/db';

await db.execute(
  sql`UPDATE courses
      SET topic_embedding = ${vectorStr}::vector
      WHERE id = ${courseId}::uuid`
);
```

## Custom pgvector Type

`src/vector.ts` defines a custom Drizzle column type that serialises `number[]` to and from the pgvector string format `[x,y,z,...]`.

```typescript
// In schema definition
topicEmbedding: vector('topic_embedding', { dimensions: 1536 })
```

**Note**: For `UPDATE` statements with vector values, always use `db.execute(sql`...`)` with a raw `::vector` cast. Drizzle's `.set()` does not handle the cast cleanly in parameterised queries.

## Change Safety Notes

- **Schema changes require a migration**: Never edit schema files without a corresponding migration file. Generate with `pnpm --filter @autodidact/db db:generate`, review the output, then commit.
- **Run migrations before deploying**: CI runs `pnpm --filter @autodidact/db db:migrate` against the production database before deploying new service images.
- **`moduleProgress.chatSessionId` is reserved**: This column exists but is not populated by current application code. It is reserved for Phase 2 (linking sessions to progress entries). Do not use it until the feature is built.
- **`modules.status` vs `moduleProgress.status`**: The `status` on the `modules` table is a blueprint default, not a user-specific value. Per-user progress lives in `module_progress.status`.

See also:
- [Schema reference](src/schema/README.md)
- [Migrations](migrations/README.md)
- [Data model diagram](../../docs/architecture/data-model.md)

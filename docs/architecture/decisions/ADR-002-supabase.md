# ADR-002: Supabase for Database and Authentication

**Status**: Accepted  
**Date**: 2024

---

## Context

The MVP needs:

1. **Managed PostgreSQL** — no ops overhead for provisioning, backups, or upgrades
2. **pgvector extension** — for course topic similarity search (cosine distance on embeddings)
3. **Authentication** — sign-up, sign-in, JWT issuance without building auth from scratch
4. **Row Level Security** — so database-level access control can be applied without application-layer enforcement for every query

Options considered:

1. **Raw PostgreSQL on Cloud SQL** + a separate auth service (Auth0, Firebase Auth)
2. **Supabase** — managed PostgreSQL with built-in auth, pgvector, and RLS
3. **PlanetScale** — MySQL-based, no pgvector support

---

## Decision

Use **Supabase** for both the database and authentication layer.

- The database connection (`DATABASE_URL`) is consumed via **Drizzle ORM** — not the Supabase JS client — so the application has full SQL control.
- Authentication is accessed through the **`IAuthProvider` interface** in `packages/providers`. The concrete `SupabaseAuthProvider` calls `supabase.auth.getUser(token)` to verify JWTs. This interface can be swapped without changing any application code.
- The **Supabase service role key** is used server-side only (never sent to clients) for admin operations (creating users, bypassing RLS).
- The **Supabase anon key** is used in the mobile app for `signInWithPassword` calls.

---

## Consequences

**Benefits**

- **pgvector bundled**: The `vector` extension is available in Supabase with no extra configuration. This enables the course reuse similarity search (cosine distance threshold 0.92) at the database level.
- **Auth abstraction preserved**: Because auth goes through `IAuthProvider`, the entire auth layer can be replaced by changing one factory function and one env var (`AUTH_PROVIDER`). The remaining codebase is unchanged.
- **RLS at the database layer**: Migration `0003_rls.sql` applies row-level security policies. Even if application-level auth were bypassed, users cannot access other users' data via direct DB access.
- **Managed infrastructure**: No DBA work needed for MVP. Supabase handles backups, connection pooling (PgBouncer), and upgrades.
- **Single connection string**: All three backend services connect to the same PostgreSQL database via `DATABASE_URL`. No additional middleware.

**Trade-offs**

- **Supabase pricing cliff**: Supabase free tier has limits on connections and storage. Scaling beyond MVP will incur costs and may require connection pool tuning.
- **Vendor coupling (mitigated)**: Supabase-specific behaviour (e.g., the `supabaseId` column in `users`, the JWT structure) is encapsulated in `SupabaseAuthProvider` and `packages/db/src/supabase.ts`. Replacing Supabase requires changes only in those two files plus a migration.
- **Auth flow constraint**: The mobile app uses Supabase JS client directly for sign-in. If auth is replaced, the mobile sign-in screen also changes.

# Scripts

All scripts are run from the **monorepo root**:

```bash
./scripts/<name>.sh [options]
```

---

## Quick start

```bash
./scripts/setup.sh   # one-time: install deps, create .env, migrate DB
./scripts/dev.sh     # every time: start Docker + build + all backend services
./scripts/mobile.sh  # in a separate terminal: start the Expo dev server
```

---

## Script reference

### `setup.sh`
**First-time project setup.** Run once after cloning.

Checks prerequisites (Node ≥ 20, pnpm ≥ 9, Docker), installs all dependencies, creates `.env` from `.env.example`, starts Docker infra, waits for Postgres, runs migrations, and builds all packages.

Does **not** start the dev servers — run `dev.sh` after completing `.env`.

---

### `dev.sh`
**Start the full local backend stack.** The main script you'll use every day.

Verifies `.env` exists and Docker is running, starts Postgres + Redis via `docker compose up -d`, waits for Postgres readiness, builds all packages (API and Worker require compiled output), runs pending migrations, then launches all backend services with `pnpm dev` (API on `:3000`, Agent on `:3001`, Worker in background).

Press `Ctrl+C` to stop all services. Start mobile separately with `mobile.sh`.

---

### `mobile.sh`
**Start the Expo mobile dev server.** Run in a separate terminal alongside `dev.sh`.

Warns if `apps/mobile/app.json` extra fields are empty. Opens the Expo CLI — scan the QR code with Expo Go, or press `i`/`a` for iOS Simulator / Android Emulator.

Requires the backend to be running (`dev.sh`) for API calls to work.

---

### `stop.sh`
**Stop local Docker infrastructure** (Postgres + Redis).

Backend service processes (started by `dev.sh`) are stopped with `Ctrl+C` in that terminal. Data volumes are preserved between stops. To also wipe all local data: `docker compose down -v`.

---

### `migrate.sh`
**Run pending database migrations** against `DATABASE_URL`.

Works for both local Docker Postgres (default) and production Supabase (if `DATABASE_URL` is set to the Supabase connection string). Reads `DATABASE_URL` from `.env` if not set in the environment.

---

### `db-reset.sh`
**DESTRUCTIVE — wipe and recreate the local database.**

Drops and recreates the `autodidact` database in local Docker Postgres, re-installs extensions (`vector`, `uuid-ossp`), and re-runs all migrations from scratch. Safety check prevents running against non-localhost URLs. Requires confirmation before proceeding.

Use this when migrations are in an inconsistent state or you want a clean slate.

---

### `db-studio.sh`
**Open Drizzle Studio** — a browser-based GUI for the local database.

Launches the Drizzle ORM visual editor at `https://local.drizzle.studio`. Useful for inspecting table contents, running ad-hoc queries, and checking migration results without needing a SQL client. Requires local Docker Postgres to be running.

---

### `gen-migration.sh`
**Generate a new Drizzle migration** after editing schema files.

Run this after modifying any file in `packages/db/src/schema/`. Drizzle Kit diffs the current schema against the last migration snapshot and generates a new `.sql` file in `packages/db/migrations/`. Always review the generated SQL before committing — then apply it with `migrate.sh`.

---

### `test.sh`
**Run the test suite.**

With no arguments: builds all packages, then runs all 215 tests across all packages and services.

With a filter: runs tests only for matching packages (e.g. `./scripts/test.sh api`).

Extra flags are passed to vitest (e.g. `./scripts/test.sh --coverage`, `./scripts/test.sh api --watch`).

---

### `typecheck.sh`
**Run TypeScript type-checking** across all packages and services.

Builds packages first (required because some packages depend on compiled output from others), then runs `tsc --noEmit` via Turborepo across the entire workspace. No files are emitted — this is a pure validation pass. Useful before opening a PR.

---

### `lint.sh`
**Run ESLint** across all packages and services.

Pass `--fix` to auto-fix violations: `./scripts/lint.sh --fix`.

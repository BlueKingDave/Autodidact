#!/usr/bin/env bash
# Run pending database migrations against the database in DATABASE_URL.
# For local Docker databases, applies docker/dev-db-init.sql first (extensions + auth stubs).
# Works for both local (Docker Postgres) and production (Supabase) if DATABASE_URL is set.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

CYAN='\033[0;36m'; BOLD='\033[1m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

step() { echo -e "\n${CYAN}${BOLD}▶ $*${NC}"; }
ok()   { echo -e "${GREEN}✓ $*${NC}"; }
die()  { echo -e "${RED}✗ $*${NC}"; exit 1; }

[[ -n "${DATABASE_URL:-}" ]] || die "DATABASE_URL is not set in the environment"

# Local Docker Postgres does not have Supabase's auth schema.
# Apply dev-db-init.sql (extensions + auth stubs) so RLS migrations compile.
if [[ "${DATABASE_URL}" == *"localhost"* ]] || [[ "${DATABASE_URL}" == *"127.0.0.1"* ]]; then
  step "Applying dev DB setup (local only)"
  docker compose exec -T postgres psql -U postgres -d autodidact \
    < "$ROOT/docker/dev-db-init.sql"
  ok "Dev setup applied"
fi

step "Running migrations against: ${DATABASE_URL%%@*}@***"
pnpm --filter @autodidact/db db:migrate
ok "All migrations applied"

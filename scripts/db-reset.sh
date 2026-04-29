#!/usr/bin/env bash
# DESTRUCTIVE: wipes the local Docker Postgres database and re-runs all migrations from scratch.
# Only works against the local Docker database. Will NOT run against a Supabase URL.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

BOLD='\033[1m'; CYAN='\033[0;36m'; GREEN='\033[0;32m'
YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

step()  { echo -e "\n${CYAN}${BOLD}▶ $*${NC}"; }
ok()    { echo -e "${GREEN}✓ $*${NC}"; }
die()   { echo -e "${RED}✗ $*${NC}"; exit 1; }

# Safety: only allow against the local Docker DB
DB_URL=$(grep '^DATABASE_URL=' .env 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" || echo "")
if [[ "$DB_URL" != *"localhost"* ]] && [[ "$DB_URL" != *"127.0.0.1"* ]]; then
  die "db-reset only works against localhost databases.\nDetected: $DB_URL\nAborting to protect production data."
fi

echo -e "${RED}${BOLD}WARNING: This will delete ALL local database data.${NC}"
echo -e "Database: ${YELLOW}$DB_URL${NC}"
read -rp "Type 'yes' to confirm: " CONFIRM
[[ "$CONFIRM" == "yes" ]] || { echo "Aborted."; exit 0; }

step "Ensuring Docker is running"
docker info &>/dev/null 2>&1 || die "Docker is not running."
docker compose up -d postgres
ok "Postgres container is up"

# Wait for Postgres to be ready
for i in $(seq 1 15); do
  docker compose exec -T postgres pg_isready -U postgres &>/dev/null && break
  [[ $i -eq 15 ]] && die "Postgres did not become ready"
  sleep 1
done

step "Dropping and recreating database"
docker compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS autodidact;" &>/dev/null
docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE autodidact;" &>/dev/null
ok "Database recreated"

step "Restoring extensions via init script"
docker compose exec -T postgres psql -U postgres -d autodidact \
  -c "CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" &>/dev/null
ok "Extensions installed"

step "Running all migrations"
pnpm --filter @autodidact/db db:migrate
ok "Migrations applied"

echo -e "\n${GREEN}${BOLD}Local database reset complete.${NC}"
echo "Remember to re-run the Supabase user-sync trigger in Supabase SQL Editor"
echo "(it was not affected — it lives in Supabase, not in local Docker)."

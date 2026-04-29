#!/usr/bin/env bash
# Generate a new Drizzle migration after editing schema files.
# Usage: ./scripts/gen-migration.sh
# After running: review the generated SQL in packages/db/migrations/ before committing.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

CYAN='\033[0;36m'; BOLD='\033[1m'; GREEN='\033[0;32m'
YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

step() { echo -e "\n${CYAN}${BOLD}▶ $*${NC}"; }
ok()   { echo -e "${GREEN}✓ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠ $*${NC}"; }
die()  { echo -e "${RED}✗ $*${NC}"; exit 1; }

[[ -f .env ]] || die ".env not found."

step "Generating migration from schema changes"
pnpm --filter @autodidact/db db:generate

echo
ok "Migration generated in packages/db/migrations/"
warn "Review the generated SQL carefully before applying or committing."
echo
echo "Next steps:"
echo "  1. Inspect the new .sql file in packages/db/migrations/"
echo "  2. Run ./scripts/migrate.sh to apply it locally"
echo "  3. Commit both the schema change and the migration file together"

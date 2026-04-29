#!/usr/bin/env bash
# Run TypeScript type-checking across all packages and services.
# No compilation output is produced — this is a pure type validation pass.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

CYAN='\033[0;36m'; BOLD='\033[1m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

step() { echo -e "\n${CYAN}${BOLD}▶ $*${NC}"; }
ok()   { echo -e "${GREEN}✓ $*${NC}"; }

# typecheck depends on ^build (see turbo.json), so we build first
step "Building packages (required before typecheck)"
"$ROOT/node_modules/.bin/turbo" run build

step "Running typecheck across all packages"
"$ROOT/node_modules/.bin/turbo" run typecheck

ok "All type checks passed"

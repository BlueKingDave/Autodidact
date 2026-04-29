#!/usr/bin/env bash
# Run ESLint across all packages and services.
# Pass --fix to auto-fix violations: ./scripts/lint.sh --fix
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

CYAN='\033[0;36m'; BOLD='\033[1m'; GREEN='\033[0;32m'; NC='\033[0m'

step() { echo -e "${CYAN}${BOLD}▶ $*${NC}"; }
ok()   { echo -e "${GREEN}✓ $*${NC}"; }

step "Running lint across all packages"
if [[ "${1:-}" == "--fix" ]]; then
  exec "$ROOT/node_modules/.bin/turbo" run lint -- --fix
else
  exec "$ROOT/node_modules/.bin/turbo" run lint
fi

ok "Lint complete"

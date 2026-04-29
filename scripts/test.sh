#!/usr/bin/env bash
# Run the full test suite across all packages and services.
# Accepts an optional filter: ./scripts/test.sh api
# Flags are passed through to vitest (e.g. --coverage, --watch).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

CYAN='\033[0;36m'; BOLD='\033[1m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

step() { echo -e "\n${CYAN}${BOLD}▶ $*${NC}"; }
ok()   { echo -e "${GREEN}✓ $*${NC}"; }
die()  { echo -e "${RED}✗ $*${NC}"; exit 1; }

FILTER="${1:-}"
shift 2>/dev/null || true   # remaining args passed to test runner

if [[ -n "$FILTER" && ! "$FILTER" == --* ]]; then
  # Run tests for a specific package (e.g. "api", "agent", "worker", "db", "schemas")
  step "Running tests for packages matching: $FILTER"
  exec pnpm --filter "*$FILTER*" test "$@"
else
  # Run all tests
  step "Building packages (some tests depend on compiled output)"
  "$ROOT/node_modules/.bin/turbo" run build

  step "Running all tests"
  exec "$ROOT/node_modules/.bin/turbo" run test "$@"
fi

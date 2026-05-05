#!/usr/bin/env bash
# scripts/graphs.sh
set -euo pipefail
OUT="docs/architecture/graphs"
ARCHIVE="$OUT/archive"
mkdir -p "$OUT" "$ARCHIVE"

if compgen -G "$OUT/*.svg" > /dev/null 2>&1; then
  TS=$(date +%d-%m-%Y_%H%M%S)
  for f in "$OUT"/*.svg; do
    base=$(basename "$f" .svg)
    mv "$f" "$ARCHIVE/${TS}_${base}.svg"
  done
  echo "Archived previous graphs → $ARCHIVE (prefix: ${TS}_)"
fi

for pkg in packages/* services/* apps/*; do
  name=$(basename "$pkg")
  if [ -d "$pkg/src" ] && [ -f "$pkg/tsconfig.json" ]; then
    echo "→ $name"
    npx madge --extensions ts,tsx \
      --exclude '\.d\.ts$|/dist/|node_modules' \
      --ts-config "$pkg/tsconfig.json" \
      --image "$OUT/$name.svg" \
      "$pkg/src"
  fi
done

echo "Done. Output in $OUT"
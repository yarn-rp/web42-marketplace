#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$CLI_ROOT/dist"

mkdir -p "$DIST_DIR"

TARGETS=(
  "bun-linux-x64:web42-linux-x64"
  "bun-darwin-x64:web42-darwin-x64"
  "bun-darwin-arm64:web42-darwin-arm64"
  "bun-windows-x64:web42-windows-x64.exe"
)

for entry in "${TARGETS[@]}"; do
  target="${entry%%:*}"
  outfile="${entry#*:}"
  echo "Building $outfile ($target)..."
  bun build --compile --target="$target" "$CLI_ROOT/src/index.ts" --outfile "$DIST_DIR/$outfile"
done

# Create w42-* aliases (same binary, shorter name)
for entry in "${TARGETS[@]}"; do
  outfile="${entry#*:}"
  w42file="${outfile/web42/w42}"
  echo "Creating alias $w42file -> $outfile"
  cp "$DIST_DIR/$outfile" "$DIST_DIR/$w42file"
done

echo ""
echo "All binaries built in $DIST_DIR:"
ls -lh "$DIST_DIR"/web42-* "$DIST_DIR"/w42-*

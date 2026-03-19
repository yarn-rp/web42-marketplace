#!/bin/bash
# Analyze Next.js bundle size and flag large chunks
# Usage: ./scripts/analyze-bundle.sh [threshold_kb]

THRESHOLD=${1:-100}  # Default: flag chunks > 100KB

echo "Analyzing Next.js bundle..."

BUILD_DIR=".next"
if [ ! -d "$BUILD_DIR" ]; then
  echo "No .next directory found. Run 'next build' first."
  exit 1
fi

echo ""
echo "Chunks exceeding ${THRESHOLD}KB:"
echo "---"

find "$BUILD_DIR/static/chunks" -name "*.js" -size "+${THRESHOLD}k" 2>/dev/null | while read -r file; do
  size=$(du -k "$file" | cut -f1)
  basename=$(basename "$file")
  echo "  ${basename}: ${size}KB"
done

echo ""
echo "Total bundle size:"
du -sh "$BUILD_DIR/static/" 2>/dev/null | awk '{print "  " $1}'

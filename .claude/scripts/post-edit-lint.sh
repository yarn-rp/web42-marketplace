#!/bin/bash
# PostToolUse hook: runs after Edit/Write operations
# Performs a quick lint check on modified files

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only lint TypeScript/JavaScript files
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx)
    if command -v npx &> /dev/null; then
      npx --no-install eslint --fix "$FILE_PATH" 2>/dev/null || true
    fi
    ;;
esac

exit 0

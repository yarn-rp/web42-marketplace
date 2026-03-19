#!/bin/bash
# PreToolUse hook: validates Bash commands are safe
# Blocks destructive operations like rm -rf, drop table, force push

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Block destructive file operations
if echo "$COMMAND" | grep -iE 'rm\s+-rf\s+/' > /dev/null; then
  echo "Blocked: Cannot rm -rf root paths" >&2
  exit 2
fi

# Block force push
if echo "$COMMAND" | grep -iE 'git\s+push\s+.*--force' > /dev/null; then
  echo "Blocked: Force push not allowed from this agent" >&2
  exit 2
fi

# Block database destructive operations
if echo "$COMMAND" | grep -iE '\b(DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE)\b' > /dev/null; then
  echo "Blocked: Destructive database operations not allowed" >&2
  exit 2
fi

exit 0

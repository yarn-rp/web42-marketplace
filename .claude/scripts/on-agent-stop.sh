#!/bin/bash
# Stop hook: runs when the agent finishes
# Logs completion time for tracking

echo "[fullstack-guardian] Agent completed at $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /tmp/web42-agent-log.txt
exit 0

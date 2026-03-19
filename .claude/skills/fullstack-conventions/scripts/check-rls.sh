#!/bin/bash
# Check if all tables have RLS policies defined
# Usage: ./scripts/check-rls.sh

echo "Checking RLS policies in migration files..."

MIGRATION_DIR="supabase/migrations"
if [ ! -d "$MIGRATION_DIR" ]; then
  echo "No migrations directory found at $MIGRATION_DIR"
  exit 0
fi

# Find tables without RLS
tables_with_rls=$(grep -rh "ENABLE ROW LEVEL SECURITY" "$MIGRATION_DIR" | grep -oP 'ON\s+\K\w+' | sort -u)
all_tables=$(grep -rh "CREATE TABLE" "$MIGRATION_DIR" | grep -oP 'TABLE\s+(IF NOT EXISTS\s+)?\K\w+' | sort -u)

echo "Tables with RLS: $(echo "$tables_with_rls" | wc -l | tr -d ' ')"
echo "Total tables: $(echo "$all_tables" | wc -l | tr -d ' ')"

missing=$(comm -23 <(echo "$all_tables") <(echo "$tables_with_rls"))
if [ -n "$missing" ]; then
  echo ""
  echo "WARNING: Tables missing RLS policies:"
  echo "$missing" | while read -r table; do
    echo "  - $table"
  done
  exit 1
fi

echo "All tables have RLS policies."

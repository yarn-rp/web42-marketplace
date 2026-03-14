#!/usr/bin/env bash
#
# Reads version from package.json and writes it into src/version.ts
# so the value is embedded at compile time.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

VERSION="$(node -p "require('${CLI_ROOT}/package.json').version")"

cat > "${CLI_ROOT}/src/version.ts" <<EOF
export const CLI_VERSION = "${VERSION}"
EOF

echo "Synced version ${VERSION} → src/version.ts"

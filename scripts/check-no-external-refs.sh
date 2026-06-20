#!/usr/bin/env bash
# Fails if forbidden external source references appear outside agent rules.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PATTERN='projectoption|project-option|project option'

EXCLUDES=(
  --glob '!.cursor/rules/**'
  --glob '!.git/**'
  --glob '!node_modules/**'
  --glob '!dist/**'
  --glob '!coverage/**'
  --glob '!package-lock.json'
  --glob '!scripts/check-no-external-refs.sh'
)

if rg -i "${EXCLUDES[@]}" "$PATTERN" "$ROOT" 2>/dev/null; then
  echo ""
  echo "ERROR: External source reference found outside .cursor/rules/"
  echo "Remove all references to external calculator sites from app code and docs."
  exit 1
fi

echo "OK: No forbidden external references found."

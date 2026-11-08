#!/usr/bin/env bash
# Restore a backup produced by backup-db.sh. DESTRUCTIVE — ask before
# running this against anything but a throwaway/staging database; it will
# overwrite existing rows that collide with the dump's primary keys.
#
# Usage:
#   ./scripts/restore-db.sh backups/nusahr-20261108T120000Z.dump
set -euo pipefail

cd "$(dirname "$0")/.."
if [ -f .env.local ]; then
  set -a; source .env.local; set +a
fi

DUMP_FILE="${1:-}"
if [ -z "$DUMP_FILE" ] || [ ! -f "$DUMP_FILE" ]; then
  echo "usage: $0 <path-to-dump-file>" >&2
  exit 1
fi

CONN="${DIRECT_URL:-${DATABASE_URL:-}}"
if [ -z "$CONN" ]; then
  echo "error: set DIRECT_URL or DATABASE_URL (check .env.local)" >&2
  exit 1
fi
if ! command -v pg_restore >/dev/null 2>&1; then
  echo "error: pg_restore not found on PATH — install the postgresql-client package" >&2
  exit 1
fi

echo "About to restore $DUMP_FILE into:"
echo "  $CONN" | sed -E 's/:[^:@]+@/:***@/' # mask the password before printing
read -r -p "Type the database name shown above's project ref to confirm, or anything else to abort: " CONFIRM
echo "$CONN" | grep -qF "$CONFIRM" || { echo "Aborted — confirmation did not match."; exit 1; }

pg_restore --dbname="$CONN" --clean --if-exists --no-owner --no-privileges \
  --schema=public --schema=drizzle "$DUMP_FILE"
echo "Restore complete."

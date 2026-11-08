#!/usr/bin/env bash
# Manual/cron database backup. Prefer DIRECT_URL (session-mode) over
# DATABASE_URL (transaction-mode pgbouncer) — pg_dump needs catalog
# queries that transaction-mode pooling doesn't support reliably.
#
# Usage:
#   ./scripts/backup-db.sh                 # dump to ./backups/
#   BACKUP_DIR=/mnt/offsite ./scripts/backup-db.sh
#
# Requires pg_dump on PATH (postgresql-client package) and DIRECT_URL or
# DATABASE_URL set (.env.local, or exported in the shell/CI runner).
set -euo pipefail

cd "$(dirname "$0")/.."
if [ -f .env.local ]; then
  set -a; source .env.local; set +a
fi

CONN="${DIRECT_URL:-${DATABASE_URL:-}}"
if [ -z "$CONN" ]; then
  echo "error: set DIRECT_URL or DATABASE_URL (check .env.local)" >&2
  exit 1
fi
if ! command -v pg_dump >/dev/null 2>&1; then
  echo "error: pg_dump not found on PATH — install the postgresql-client package" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/nusahr-$STAMP.dump"

echo "Dumping database to $OUT ..."
# Scoped to the schemas this app actually owns. Supabase's own internal
# schemas (auth, storage, realtime, vault, graphql, pgbouncer, extensions)
# are platform-managed — Supabase backs those up as part of the managed
# service, and restoring them from an app-level dump risks clobbering
# platform state this app doesn't control. `public` holds every Drizzle
# table; `drizzle` holds migration history.
pg_dump "$CONN" --format=custom --no-owner --no-privileges \
  --schema=public --schema=drizzle --file="$OUT"
echo "Done: $(du -h "$OUT" | cut -f1)"

# Keep the most recent KEEP_COUNT backups in this directory; older ones are
# pruned. This directory is a convenience local copy, NOT the actual backup
# store — see docs/BACKUP_DR_RUNBOOK.md for where backups must actually be
# shipped to (off this machine, off Supabase) to be worth anything in a
# real disaster.
KEEP_COUNT="${KEEP_COUNT:-14}"
ls -1t "$BACKUP_DIR"/nusahr-*.dump 2>/dev/null | tail -n +$((KEEP_COUNT + 1)) | xargs -r rm -v

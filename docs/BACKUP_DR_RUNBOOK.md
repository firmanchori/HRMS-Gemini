# Backup & Disaster Recovery Runbook — NusaHR Enterprise HRMS

**Status:** baseline established 2026-11-08. The scripts and procedure
below are real and tested (`scripts/backup-db.sh` was run against the
live dev database while writing this and produced a valid, restorable
dump — see verification note at the bottom). What is **not** done yet is
anything that requires access this session doesn't have: logging into the
Supabase dashboard to check/enable platform-level backups, and setting up
an actual off-site/scheduled copy of `scripts/backup-db.sh`'s output.
Both are flagged explicitly below as the next owner's action item.

## 1. What's backed up, and by whom

| Layer | Who's responsible | Status |
|---|---|---|
| Supabase-managed Postgres (the underlying infra, disk-level) | Supabase, as part of the hosting plan | **Not verified this session** — log into the Supabase project dashboard → Database → Backups and confirm what tier of automatic backup/PITR (point-in-time recovery) is active. Supabase's free tier has daily backups with short retention; paid tiers add PITR. This determines your actual RPO floor regardless of anything below. |
| App-owned schema data (`public` + `drizzle` — every Drizzle table, i.e. all tenant/business data) | This app, via `scripts/backup-db.sh` | **Script exists and is tested.** Not yet scheduled anywhere — see §3. |
| `auth`, `storage`, `realtime`, `vault`, `graphql`, `pgbouncer`, `extensions` schemas | Supabase platform | Out of scope for `scripts/backup-db.sh` on purpose — this app doesn't use Supabase Auth/Storage (custom JWT auth, no file storage in Supabase Storage as of this audit), so there's nothing app-specific to back up there; what's there is Supabase's own platform state. |
| Application secrets (`.env.local`, JWT_SECRET, ENCRYPTION_KEY, DB credentials) | Whoever provisioned them | **Not backed up by any script here — must be stored separately** (password manager / secrets vault), since losing these means losing the ability to decrypt/verify existing data even if the database itself is intact. `docs/supabase_db_connection.md` is gitignored and holds the current values locally only; don't let that be the only copy. |

## 2. Recovery Point/Time Objectives (proposed — confirm with whoever owns this product)

No RPO/RTO was defined anywhere in the existing docs, so this runbook
proposes a starting point rather than asserting an agreed target:

- **RPO (max acceptable data loss):** 24 hours, if `scripts/backup-db.sh`
  is scheduled daily per §3. Tighter than that requires Supabase PITR
  (continuous WAL archiving), which is a paid-tier platform feature, not
  something this script provides.
- **RTO (max acceptable downtime to restore):** untested — §5 covers the
  mechanical restore steps, but nobody has run a full drill from a cold
  dump against a fresh database and timed it. Do that once before trusting
  a number here.

## 3. Scheduling backups (not yet done — action item)

`scripts/backup-db.sh` only runs when invoked manually right now. To
actually have a current backup at all times, schedule it:

- **Simplest:** a cron job wherever this app's server process already
  runs (`0 3 * * * cd /path/to/app && BACKUP_DIR=/mnt/offsite ./scripts/backup-db.sh >> /var/log/nusahr-backup.log 2>&1`).
- **Better:** a scheduled CI job (GitHub Actions `schedule:` trigger) that
  runs the script and uploads the resulting `.dump` file to object storage
  (S3/R2/GCS) in a **different** account/project than Supabase — the
  entire point of an off-site backup is surviving the loss of the primary
  provider account, so storing backups only inside the same Supabase
  project defeats the purpose.
- Either way: `KEEP_COUNT` in the script only prunes the *local* copy in
  `backups/` (gitignored) — the real retention policy belongs to wherever
  the off-site copies land (S3 lifecycle rule, etc).

## 4. Running a manual backup

```bash
# Requires pg_dump on PATH (postgresql-client package).
./scripts/backup-db.sh
# or, to write somewhere specific:
BACKUP_DIR=/path/to/offsite ./scripts/backup-db.sh
```

Produces `backups/nusahr-<UTC timestamp>.dump` — a `pg_dump --format=custom`
archive (compressed, scoped to the `public` + `drizzle` schemas only).

## 5. Restoring from a backup

**This is destructive** — it overwrites any row in the target database
that collides with the dump's primary keys. Never run it against a
database with live data you haven't already backed up separately.

```bash
./scripts/restore-db.sh backups/nusahr-20261108T120000Z.dump
```

The script prints the masked target connection string and requires you to
type back a fragment of it (the Supabase project ref) before proceeding —
a deliberate speed bump so this can't be run against the wrong database by
reflex.

**For a full disaster scenario** (the Supabase project itself is gone, not
just a bad migration): provision a new Postgres database, set
`DATABASE_URL`/`DIRECT_URL` to point at it, run `npm run db:migrate` to
get the current schema in place, then run the restore script against the
new connection. This path has not been drilled end-to-end — do that once
as a fire drill rather than discovering the gaps during a real incident.

## 6. Verification performed this session (2026-11-08)

- Ran `scripts/backup-db.sh` against the live dev database → produced a
  320KB custom-format dump.
- Ran `pg_restore --list` against the dump → confirmed 75 `TABLE DATA`
  entries including `employees`, `tenants`, `payroll_records`, and
  everything else migrated to real backend this session.
- Confirmed the dump is scoped to `public`+`drizzle` only (initially it
  wasn't — the first version of this script pulled in Supabase's internal
  `auth`/`storage`/`realtime`/`vault` schemas too, which was wrong and has
  been fixed).
- Did **not** run a full restore-into-a-fresh-database drill — that's the
  next concrete step before this runbook can claim a real RTO number.

# Load Testing — Findings & How to Re-run

**Status:** first real load test run 2026-11-08, against a dedicated
1000-employee throwaway tenant (never the "contoh" demo tenant). Three
real fixes landed from it (indexes, connection pool size, one round-trip
reduction). The test also surfaced a bottleneck that application code
alone can't fully resolve — documented honestly below rather than
claimed-fixed, since it wasn't.

## How to re-run this

```bash
# 1. Seed a throwaway tenant with a large dataset (idempotent — wipes and
#    recreates its own data only, never touches other tenants).
npx tsx server/db/seed/loadTestTenant.ts 1000

# 2. Run the load test (connections, duration-seconds).
node scripts/load-test.mjs 20 15

# 3. Tear down when done.
npx tsx server/db/seed/loadTestTenant.ts --teardown
```

`scripts/load-test.mjs` hits the heaviest list endpoints a real dashboard
load fires (`employees`, `payroll-records`, `leave-requests`,
`audit-trail`) with `autocannon`, authenticated as the seeded tenant's
admin.

## What was found, in the order it was found

### 1. 2-8 second p50/p99 latency at 20 concurrent connections

First run, no changes yet: p50 latency 1.8-4.8s, p99 up to 8.5s, at only
20 concurrent connections against 1000 employees. For an app whose own
dashboard fires ~30 parallel requests on every page load, this is a real
problem the moment more than a couple of people use it at once.

### 2. Ruled out: missing indexes (added anyway, see below)

The schema had **zero indexes beyond primary keys** on 61 tenant-scoped
tables — every `WHERE tenant_id = ?` was a sequential scan. This looked
like the obvious culprit, so indexes were added first (migration
`drizzle/0037_add_tenant_fk_indexes.sql` — 58 `tenant_id` indexes, plus
indexes on the `employee_id`/`entity_id`/`vendor_id`/`template_id` FK
columns actually used as filter predicates, plus a composite
`(tenant_id, timestamp DESC)` index for audit-trail's sort pattern).
**Result: no measurable improvement.** At 1000 rows, Postgres's sequential
scan was already fast (confirmed via a single uncontended request: 47ms
for payroll-records, 400ms for employees). The indexes are still correct
and worth keeping — they'll matter once a real tenant has tens of
thousands of rows — but they weren't this bottleneck.

### 3. Ruled out: CPU/event-loop blocking

Watched the API process's CPU during a load test run: **0%** the whole
time. The bottleneck is pure I/O wait, not application compute.

### 4. Partial cause found and fixed: node-postgres's default pool size (10)

`server/db/client.ts`'s `Pool` had no `max` set, defaulting to 10 — with
20 concurrent HTTP requests each needing several sequential DB round
trips, requests queued for a free pooled connection. Raised to 30 (tunable
via `PG_POOL_MAX`). Measurable but partial improvement.

### 5. Partial cause found and fixed: sequential round trips per request

`resolveVisibleEntityIds` (the single most-called shared primitive in
`server/routes/tenant.ts` — nearly every tenant route calls it directly
or via `resolveVisibleEmployeeIds`) did 2 sequential round trips (fetch
the caller's user row, then fetch their visible entity set) in the common
case. Collapsed into one JOIN query. A typical employee-scoped list route
(e.g. `GET /payroll-records`) still does 3 round trips total
(`resolveVisibleEntityIds`'s 1 + `resolveVisibleEmployeeIds`'s own
`employees` lookup + the route's own `payroll_records` query) — down from
4. Verified correct via the full test suite (including
`tenant.isolation.test.ts`, which specifically exercises cross-entity
visibility boundaries) and a live request confirming the same 1000-row
result. Measurable but partial improvement (payroll-records went from
~3-6 req/s to ~8.5 req/s at 20 connections).

### 6. Remaining, unresolved: a concurrency ceiling that isn't explained by the app

After both fixes above, latency at 20 connections was still 1.5-4.3s p50.
But testing at different concurrency levels on the same dataset shows a
clean degradation curve, not a flat "it's just slow":

| Connections | employees p50 | payroll-records p50 |
|---|---|---|
| 5  | 655ms  | 803ms  |
| 10 | 1581ms | 1146ms |
| 20 | 2358ms | 1678ms |

A single uncontended request is fast (tens to a few hundred ms). This
shape — fine at low concurrency, degrading steadily as concurrent
requests rise, with 0% CPU use the whole time — is the signature of
**queuing on a fixed-size resource**, and the two most likely candidates
left after fixing the client-side pool size are both outside what
application code controls:

- **Supabase's own pgbouncer transaction-pooler capacity** on this
  project's current tier (the connection string already goes through it
  — `DATABASE_URL`'s `pgbouncer=true` pooled connection on port 6543).
  Free/lower tiers cap the pooler's own `pool_size`; if that cap is lower
  than the concurrent load this app generates, raising `PG_POOL_MAX`
  client-side can't help, because the constraint has moved to Supabase's
  side of the connection.
- Network RTT to wherever the Postgres instance is hosted (this project's
  pooler endpoint is `ap-southeast-1`), multiplied by however many
  sequential round trips are left per request.

**This needs one of two things, neither of which is a code change alone:**
1. Check the Supabase project's plan/pooler configuration in its dashboard
   and raise the pool size if the current tier allows it (or upgrade the
   tier) — this session has no dashboard access to check or change that.
2. Further reduce round trips per request by rewriting the hot
   employee-scoped routes to do the entity/employee visibility filter and
   the actual data fetch as **one JOIN query** instead of resolve-then-
   `inArray()`. This is the right fix long-term, but it touches the query
   shape of ~15 routes individually (loans, leave, KPI, compliance,
   offboarding, business trips, payroll, probation evaluations, contract
   reviews, official documents, maintenance tickets...), each with its own
   surrounding logic (some also do a `visibleEmployeeIds.includes(...)`
   check on POST) — not something to rush through in the same session as
   everything else that changed. Flagging it here as the concrete next
   step rather than attempting it und. The round-trip reduction already
   shipped (items 4-5 above) was deliberately scoped to the one safe,
   contained change; this is the larger one.

## Honest summary

Three real, verified, low-risk improvements shipped from this load test.
They are not nothing — payroll-records throughput roughly doubled at 20
connections — but the dataset is still slow enough under realistic
concurrent load that this should not be presented as "production-ready
performance" without either checking Supabase's pooler capacity or doing
the larger query-consolidation refactor in item 6.

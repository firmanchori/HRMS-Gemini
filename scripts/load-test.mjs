#!/usr/bin/env node
/**
 * Load test against the "loadtest" tenant (server/db/seed/loadTestTenant.ts)
 * — a dedicated throwaway tenant with a large dataset, never the "contoh"
 * demo tenant. Seed it first:
 *   npx tsx server/db/seed/loadTestTenant.ts 1000
 *
 * Usage:
 *   node scripts/load-test.mjs [connections] [durationSeconds]
 *   node scripts/load-test.mjs 20 20
 *
 * Tear down afterwards:
 *   npx tsx server/db/seed/loadTestTenant.ts --teardown
 */
import autocannon from "autocannon";

const API_BASE = process.env.LOAD_TEST_API_BASE || "http://localhost:4000";
const ORIGIN = "http://loadtest.localhost:3000";
const EMAIL = "admin@loadtest.local";
const PASSWORD = "ChangeMe123!";

const connections = Number(process.argv[2]) || 20;
const duration = Number(process.argv[3]) || 20;

async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Login failed (${res.status}) — did you run: npx tsx server/db/seed/loadTestTenant.ts 1000 ?`);
  }
  const setCookie = res.headers.get("set-cookie");
  const cookie = setCookie?.split(";")[0];
  if (!cookie) throw new Error("No session cookie returned from login");
  return cookie;
}

// The real dashboard load (HrmsContext's loadTenantOrgData) fires ~30
// parallel GETs on every page open. These are the heaviest/most-hit ones
// under the seeded 1000-employee dataset — list endpoints that scan the
// whole table with no pagination, which is exactly where a naive query
// degrades first as row counts grow.
const ENDPOINTS = [
  "/api/tenant/employees",
  "/api/tenant/payroll-records",
  "/api/tenant/leave-requests",
  "/api/tenant/audit-trail",
];

async function run() {
  console.log(`Logging in as ${EMAIL}...`);
  const cookie = await login();
  console.log(`Running: ${connections} connections, ${duration}s, against ${ENDPOINTS.length} endpoints (round-robin)\n`);

  for (const path of ENDPOINTS) {
    const result = await autocannon({
      url: `${API_BASE}${path}`,
      connections,
      duration,
      headers: { Origin: ORIGIN, Cookie: cookie },
    });
    console.log(`--- ${path} ---`);
    console.log(
      `  requests/sec: ${result.requests.average.toFixed(1)}  |  latency p50/p99: ${result.latency.p50}ms / ${result.latency.p99}ms  |  errors: ${result.errors}  |  non-2xx: ${result.non2xx}  |  timeouts: ${result.timeouts}`
    );
  }
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

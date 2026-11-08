import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.ts";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — check .env.local");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
  // node-postgres defaults `max` to 10, which was the real bottleneck found
  // by load testing (2026-11-08): a single request was fast in isolation
  // (~50-400ms), but requests queued for a free pool connection once
  // concurrency rose, producing multi-second p50/p99 latency that looked
  // like a slow-query problem but wasn't. DATABASE_URL already goes through
  // Supabase's transaction-mode pgbouncer pooler (pgbouncer=true), which
  // exists precisely to let a client hold more logical connections than the
  // Postgres server's own connection limit would allow — raising this is
  // safe and is what that pooler is for. Tune PG_POOL_MAX via env if the
  // deployed instance's pooler is sized differently.
  max: Number(process.env.PG_POOL_MAX) || 30,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

export const db = drizzle(pool, { schema });

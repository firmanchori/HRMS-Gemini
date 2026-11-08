/**
 * One-time backfill (2026-11-09): seedDefaultDocumentTemplatesForTenant
 * only runs automatically for a tenant's root entity going forward
 * (server/routes/tenant.ts's POST /entities). Tenants that already existed
 * before that hook was added never got their copy of the 45-template
 * default catalog. Run once per environment after deploying that change:
 *
 *   npx tsx server/db/seed/backfillDocumentTemplates.ts
 *
 * Safe to re-run — skips any tenant that already has at least one
 * template (same guard as the real seed function), except it first
 * reports what it's skipping so a stray test row doesn't silently block
 * a tenant that actually needs the real catalog.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { and, isNull, eq } from "drizzle-orm";
import { db, pool } from "../client.ts";
import { tenants, companyEntities, documentTemplates } from "../schema.ts";
import { seedDefaultDocumentTemplatesForTenant } from "../../lib/defaultDocumentTemplates.ts";

async function main() {
  const allTenants = await db.select().from(tenants);
  for (const tenant of allTenants) {
    const [root] = await db
      .select()
      .from(companyEntities)
      .where(and(eq(companyEntities.tenantId, tenant.id), isNull(companyEntities.parentEntityId)))
      .limit(1);
    if (!root) {
      console.log(`SKIP ${tenant.subdomain}: no root entity yet (tenant not fully set up)`);
      continue;
    }
    const existingCount = (await db.select({ id: documentTemplates.id }).from(documentTemplates).where(eq(documentTemplates.tenantId, tenant.id))).length;
    if (existingCount > 0) {
      console.log(`SKIP ${tenant.subdomain}: already has ${existingCount} template row(s) — not touching it (could be real data or a prior partial seed; inspect manually if it looks wrong)`);
      continue;
    }
    const inserted = await seedDefaultDocumentTemplatesForTenant(tenant.id, { name: root.name, address: root.address });
    console.log(`SEEDED ${tenant.subdomain}: ${inserted} default templates`);
  }
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

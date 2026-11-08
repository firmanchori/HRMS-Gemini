/**
 * Creates (or wipes and recreates) a dedicated throwaway tenant with a
 * large, realistic dataset, purely for load testing — never used by the
 * app's own demo/sales flow ("contoh" tenant stays untouched). Safe to
 * re-run: it deletes any prior run's tenant by subdomain first.
 *
 * Usage:
 *   npx tsx server/db/seed/loadTestTenant.ts [employeeCount]
 *   npx tsx server/db/seed/loadTestTenant.ts --teardown   # delete it, nothing else
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool } from "../client.ts";
import {
  tenants,
  companyEntities,
  entityClosure,
  users,
  employees,
  payrollRecords,
  leaveRequests,
  auditTrailEntries,
} from "../schema.ts";

const SUBDOMAIN = "loadtest";
const ADMIN_EMAIL = "admin@loadtest.local";
const ADMIN_PASSWORD = "ChangeMe123!";

async function teardown() {
  const [existing] = await db.select().from(tenants).where(eq(tenants.subdomain, SUBDOMAIN)).limit(1);
  if (!existing) {
    console.log("No existing load-test tenant to remove.");
    return;
  }
  // Every table this script inserts into is removed explicitly — relying
  // on cascade isn't set up tenant-wide in this schema, so this mirrors
  // exactly what was inserted, in FK-safe order.
  await db.delete(auditTrailEntries).where(eq(auditTrailEntries.tenantId, existing.id));
  await db.delete(leaveRequests).where(eq(leaveRequests.tenantId, existing.id));
  await db.delete(payrollRecords).where(eq(payrollRecords.tenantId, existing.id));
  await db.delete(employees).where(eq(employees.tenantId, existing.id));
  await db.delete(users).where(eq(users.tenantId, existing.id));
  const entityRows = await db.select().from(companyEntities).where(eq(companyEntities.tenantId, existing.id));
  for (const e of entityRows) {
    await db.delete(entityClosure).where(eq(entityClosure.ancestorEntityId, e.id));
  }
  await db.delete(companyEntities).where(eq(companyEntities.tenantId, existing.id));
  await db.delete(tenants).where(eq(tenants.id, existing.id));
  console.log(`Removed load-test tenant '${SUBDOMAIN}' and all its rows.`);
}

async function seed(employeeCount: number) {
  await teardown(); // start clean every time

  const [tenant] = await db
    .insert(tenants)
    .values({ name: "Load Test Co", subdomain: SUBDOMAIN, status: "Active" })
    .returning();

  const [entity] = await db
    .insert(companyEntities)
    .values({
      tenantId: tenant.id,
      name: "Load Test Co",
      code: "LTC",
      relationType: "resmi",
      status: "Aktif",
      isGovernanceLocked: false,
    })
    .returning();

  await db.insert(entityClosure).values({ ancestorEntityId: entity.id, descendantEntityId: entity.id, depth: 0 });

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await db.insert(users).values({
    tenantId: tenant.id,
    entityId: entity.id,
    role: "tenant_admin",
    name: "Load Test Admin",
    email: ADMIN_EMAIL,
    passwordHash,
  });

  console.log(`Seeding ${employeeCount} employees...`);
  // positionId/departmentId deliberately left null — this is a throughput
  // fixture, not a realistic org chart, and those FKs are nullable in the
  // real schema (the same nullability that caused the .toLowerCase() crash
  // bugs fixed earlier this session, so leaving them null here also
  // exercises that code path under load).
  const BATCH = 500;
  const employeeIds: string[] = [];
  for (let offset = 0; offset < employeeCount; offset += BATCH) {
    const batchSize = Math.min(BATCH, employeeCount - offset);
    const rows = Array.from({ length: batchSize }, (_, i) => {
      const n = offset + i + 1;
      return {
        tenantId: tenant.id,
        entityId: entity.id,
        nik: `LTC-${String(n).padStart(5, "0")}`,
        fullName: `Load Test Employee ${n}`,
        email: `employee${n}@loadtest.local`,
        employmentType: "Tetap",
        joinDate: new Date("2024-01-01"),
        status: "Aktif",
        basicSalary: 6000000 + (n % 20) * 500000,
      };
    });
    const inserted = await db.insert(employees).values(rows).returning({ id: employees.id });
    employeeIds.push(...inserted.map((r) => r.id));
  }

  console.log(`Seeding payroll records, leave requests, documents, audit log for ${employeeIds.length} employees...`);
  for (let offset = 0; offset < employeeIds.length; offset += BATCH) {
    const batch = employeeIds.slice(offset, offset + BATCH);
    await db.insert(payrollRecords).values(
      batch.map((employeeId) => ({
        tenantId: tenant.id,
        employeeId,
        period: "2026-10",
        basicSalary: 6000000,
        grossPay: 7500000,
        netPay: 6800000,
        status: "Dibayar",
      }))
    );
    await db.insert(leaveRequests).values(
      batch.map((employeeId) => ({
        tenantId: tenant.id,
        employeeId,
        leaveType: "Cuti Tahunan",
        startDate: "2026-11-10",
        endDate: "2026-11-11",
        totalDays: 2,
        reason: "Load test fixture",
        status: "Disetujui",
      }))
    );
    await db.insert(auditTrailEntries).values(
      batch.map((employeeId) => ({
        tenantId: tenant.id,
        actorId: employeeId,
        actorName: "Load Test Admin",
        actorRole: "tenant_admin",
        module: "Load Test",
        action: "SEED",
        recordId: employeeId,
        changesSummary: "Load test fixture row",
      }))
    );
  }

  console.log(`Done. Tenant subdomain: ${SUBDOMAIN} | admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} | employees: ${employeeIds.length}`);
}

const args = process.argv.slice(2);
if (args.includes("--teardown")) {
  await teardown();
} else {
  const count = Number(args[0]) || 500;
  await seed(count);
}
await pool.end();

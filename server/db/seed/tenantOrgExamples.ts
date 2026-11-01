import { eq, and, isNull } from "drizzle-orm";
import { db } from "../client.ts";
import {
  tenants,
  companyEntities,
  entityClosure,
  companyDivisions,
  companyDepartments,
  masterJobPositions,
  orgStructureNodes,
  gradeSalaryRanges,
  officeLocations,
  users,
} from "../schema.ts";
import { computeNewEntityClosureRows } from "../../lib/orgStructure.ts";

/**
 * Real example company structure for a demo tenant — a holding with two anak
 * entities, divisions/departments/positions/org chart for the holding, grade
 * bands, and office locations. Exists so the Struktur Organisasi and Lokasi
 * Kantor menus show real seeded data instead of an empty state the first
 * time someone opens them ("tidak mau mock, ganti dengan data seed sebagai
 * contoh"). Seeded for every demo tenant below so each one has a working
 * example, not just "contoh-aktif".
 */
const DEMO_TENANT_SUBDOMAINS = ["contoh-aktif", "contoh"];

export async function seedTenantOrgExamples() {
  for (const subdomain of DEMO_TENANT_SUBDOMAINS) {
    await seedForTenant(subdomain);
  }
}

async function seedForTenant(subdomain: string) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain)).limit(1);
  if (!tenant) return console.log(`Tenant '${subdomain}' belum ada, skip contoh struktur organisasi.`);

  const [existingHolding] = await db.select().from(companyEntities).where(and(eq(companyEntities.tenantId, tenant.id), eq(companyEntities.code, "HOLD"))).limit(1);
  if (existingHolding) return console.log(`Contoh struktur organisasi untuk '${subdomain}' sudah ada, skip.`);

  async function createEntity(name: string, code: string, parent?: typeof companyEntities.$inferSelect) {
    const [created] = await db
      .insert(companyEntities)
      .values({
        tenantId: tenant.id,
        parentEntityId: parent?.id ?? null,
        name,
        code,
        nikPattern: parent?.nikPattern ?? "{TAHUN}{BULAN}.{URUT4}",
        nikPatternFollowsParent: !!parent,
        docPrefix: parent?.docPrefix ?? code,
        relationType: "resmi",
        city: "Jakarta",
        createdByEntityId: parent?.id ?? null,
      })
      .returning();
    const parentAncestorRows = parent ? await db.select().from(entityClosure).where(eq(entityClosure.descendantEntityId, parent.id)) : [];
    await db.insert(entityClosure).values(computeNewEntityClosureRows(created.id, parentAncestorRows));
    return created;
  }

  const holding = await createEntity("PT Contoh Sejahtera", "HOLD");
  const anakTeknologi = await createEntity("PT Contoh Teknologi", "TECH", holding);
  await createEntity("PT Contoh Retail", "RETAIL", holding);

  // The tenant's registration admin was seeded before entity-scoping existed — link it to
  // the holding now, matching what a real signup does automatically on first entity creation.
  await db.update(users).set({ entityId: holding.id }).where(and(eq(users.tenantId, tenant.id), eq(users.role, "tenant_admin"), isNull(users.entityId)));

  const divisions = await db
    .insert(companyDivisions)
    .values([
      { tenantId: tenant.id, entityId: holding.id, code: "HR", name: "Human Resources", headTitle: "HR Director" },
      { tenantId: tenant.id, entityId: holding.id, code: "FIN", name: "Finance & Accounting", headTitle: "Finance Director" },
      { tenantId: tenant.id, entityId: holding.id, code: "OPS", name: "Operations", headTitle: "Operations Director" },
    ])
    .returning();
  const [hrDivision, finDivision, opsDivision] = divisions;

  const departments = await db
    .insert(companyDepartments)
    .values([
      { tenantId: tenant.id, entityId: holding.id, divisionId: hrDivision.id, code: "RECRUIT", name: "Recruitment" },
      { tenantId: tenant.id, entityId: holding.id, divisionId: hrDivision.id, code: "PEOPLEDEV", name: "People Development" },
      { tenantId: tenant.id, entityId: holding.id, divisionId: finDivision.id, code: "ACCTG", name: "Accounting" },
    ])
    .returning();
  const [recruitDept] = departments;

  const positions = await db
    .insert(masterJobPositions)
    .values([
      { tenantId: tenant.id, entityId: holding.id, code: "CEO", title: "Chief Executive Officer", defaultLevel: 1 },
      { tenantId: tenant.id, entityId: holding.id, code: "HRD", title: "HR Director", defaultLevel: 1, divisionId: hrDivision.id },
      { tenantId: tenant.id, entityId: holding.id, code: "HRM", title: "HR Manager", defaultLevel: 2, divisionId: hrDivision.id, departmentId: recruitDept.id },
      { tenantId: tenant.id, entityId: holding.id, code: "HRS", title: "HR Staff", defaultLevel: 5, divisionId: hrDivision.id, departmentId: recruitDept.id },
      { tenantId: tenant.id, entityId: holding.id, code: "FIND", title: "Finance Director", defaultLevel: 1, divisionId: finDivision.id },
      { tenantId: tenant.id, entityId: holding.id, code: "OPSD", title: "Operations Director", defaultLevel: 1, divisionId: opsDivision.id },
    ])
    .returning();
  const [ceoPos, hrdPos, hrmPos, hrsPos, findPos, opsdPos] = positions;

  const ceoNode = (
    await db
      .insert(orgStructureNodes)
      .values({ tenantId: tenant.id, entityId: holding.id, title: "Chief Executive Officer", code: "CEO", level: 1, masterJobPositionId: ceoPos.id, isVacant: true })
      .returning()
  )[0];
  const hrdNode = (
    await db
      .insert(orgStructureNodes)
      .values({ tenantId: tenant.id, entityId: holding.id, title: "HR Director", divisionId: hrDivision.id, code: "HRD", level: 2, reportsToId: ceoNode.id, masterJobPositionId: hrdPos.id, isVacant: true })
      .returning()
  )[0];
  const hrmNode = (
    await db
      .insert(orgStructureNodes)
      .values({ tenantId: tenant.id, entityId: holding.id, title: "HR Manager", divisionId: hrDivision.id, departmentId: recruitDept.id, code: "HRM", level: 3, reportsToId: hrdNode.id, masterJobPositionId: hrmPos.id, isVacant: true })
      .returning()
  )[0];
  await db.insert(orgStructureNodes).values([
    { tenantId: tenant.id, entityId: holding.id, title: "HR Staff", divisionId: hrDivision.id, departmentId: recruitDept.id, code: "HRS", level: 4, reportsToId: hrmNode.id, masterJobPositionId: hrsPos.id, isVacant: true },
    { tenantId: tenant.id, entityId: holding.id, title: "Finance Director", divisionId: finDivision.id, code: "FIND", level: 2, reportsToId: ceoNode.id, masterJobPositionId: findPos.id, isVacant: true },
    { tenantId: tenant.id, entityId: holding.id, title: "Operations Director", divisionId: opsDivision.id, code: "OPSD", level: 2, reportsToId: ceoNode.id, masterJobPositionId: opsdPos.id, isVacant: true },
  ]);

  await db.insert(gradeSalaryRanges).values([
    { tenantId: tenant.id, gradeCode: "G1", gradeName: "Direksi", minSalary: 25_000_000, midSalary: 32_000_000, maxSalary: 40_000_000 },
    { tenantId: tenant.id, gradeCode: "G2", gradeName: "Manager", minSalary: 12_000_000, midSalary: 15_000_000, maxSalary: 18_000_000 },
    { tenantId: tenant.id, gradeCode: "G5", gradeName: "Staff", minSalary: 5_000_000, midSalary: 6_500_000, maxSalary: 8_000_000 },
  ]);

  await db.insert(officeLocations).values([
    { tenantId: tenant.id, entityId: holding.id, code: "HQ", name: "Kantor Pusat Jakarta", type: "Kantor Pusat", address: "Jl. Sudirman Kav. 1", city: "Jakarta", latitude: -6.2088, longitude: 106.8456, radiusMeters: 150 },
    { tenantId: tenant.id, entityId: anakTeknologi.id, code: "BDG01", name: "Kantor Cabang Bandung", type: "Kantor Cabang", address: "Jl. Asia Afrika No. 10", city: "Bandung", latitude: -6.9175, longitude: 107.6191, radiusMeters: 100 },
  ]);

  console.log(`Contoh struktur organisasi & lokasi kantor untuk tenant '${subdomain}' dibuat (holding: ${holding.id}).`);
}

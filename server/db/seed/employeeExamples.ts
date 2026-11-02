import { eq, and } from "drizzle-orm";
import { db } from "../client.ts";
import { tenants, employees, probationEvaluations, contractRenewalReviews, tenantModuleSettings } from "../schema.ts";

/** Default "Pengaturan" (Manajemen Karyawan) every tenant gets if it hasn't customized them yet. */
async function seedEmployeeModuleSettingsDefaults() {
  const allTenants = await db.select().from(tenants);
  for (const tenant of allTenants) {
    const [existing] = await db
      .select()
      .from(tenantModuleSettings)
      .where(and(eq(tenantModuleSettings.tenantId, tenant.id), eq(tenantModuleSettings.moduleKey, "employee")))
      .limit(1);
    if (existing) continue;
    await db.insert(tenantModuleSettings).values({
      tenantId: tenant.id,
      moduleKey: "employee",
      settings: { nikPrefix: tenant.subdomain.toUpperCase(), probationDurationMonths: 3, defaultRetirementAge: 56, mandatoryDocs: ["KTP", "NPWP", "KK", "Ijazah"] },
    });
  }
  console.log(`Pengaturan default Manajemen Karyawan disiapkan untuk ${allTenants.length} tenant.`);
}

/** Sample probation evaluation + contract renewal review for PT Contoh, using the already-seeded "Siti Rahma" employee. */
async function seedEmployeeSamplesForContoh() {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.subdomain, "contoh")).limit(1);
  if (!tenant) return console.log("Tenant 'contoh' belum ada, skip contoh data karyawan.");

  const [emp] = await db.select().from(employees).where(and(eq(employees.tenantId, tenant.id), eq(employees.fullName, "Siti Rahma"))).limit(1);
  if (!emp) return console.log("Karyawan contoh 'Siti Rahma' belum ada, skip contoh evaluasi/kontrak.");

  const [existingEval] = await db.select().from(probationEvaluations).where(eq(probationEvaluations.employeeId, emp.id)).limit(1);
  if (!existingEval) {
    await db.insert(probationEvaluations).values({
      tenantId: tenant.id,
      employeeId: emp.id,
      evaluationDate: new Date("2026-10-15"),
      technicalSkillScore: 82,
      disciplineScore: 90,
      teamworkScore: 88,
      initiativeScore: 80,
      overallScore: 85,
      recommendation: "Lulus",
      notes: "Menunjukkan performa baik selama masa percobaan 3 bulan, siap diangkat sebagai karyawan tetap.",
      status: "Menunggu Approval",
    });
  }

  const [existingReview] = await db.select().from(contractRenewalReviews).where(eq(contractRenewalReviews.employeeId, emp.id)).limit(1);
  if (!existingReview) {
    await db.insert(contractRenewalReviews).values({
      tenantId: tenant.id,
      employeeId: emp.id,
      currentContractEnd: new Date("2026-12-31"),
      recommendation: "Alih Status PKWTT (Tetap)",
      notes: "Direkomendasikan untuk diangkat menjadi karyawan tetap setelah masa kontrak pertama selesai.",
      status: "Menunggu Approval",
    });
  }

  console.log("Contoh evaluasi probation & review kontrak untuk tenant 'contoh' disiapkan.");
}

export async function seedEmployeeExamples() {
  await seedEmployeeModuleSettingsDefaults();
  await seedEmployeeSamplesForContoh();
}

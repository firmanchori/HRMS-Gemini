import { eq, and } from "drizzle-orm";
import { db } from "../client.ts";
import {
  tenants,
  companyEntities,
  companyDivisions,
  companyDepartments,
  masterJobPositions,
  educationLevels,
  fieldsOfStudy,
  employees,
  jobRequisitions,
  documentSignatoryConfigs,
  users,
} from "../schema.ts";

/** Minimum standard set the user asked for ("Tingkat/Strata Pendidikan ... minimalnya"). */
const EDUCATION_LEVEL_NAMES = ["SD", "SMP", "SMA/SMK", "D1", "D2", "D3", "D4", "S1", "S2", "S3"];

/** A representative starter catalog — tenants can add more via the master-data admin UI. */
const FIELD_OF_STUDY_SEED: { name: string; category: string }[] = [
  { name: "Teknik Informatika", category: "Teknik" },
  { name: "Sistem Informasi", category: "Teknik" },
  { name: "Teknik Industri", category: "Teknik" },
  { name: "Teknik Elektro", category: "Teknik" },
  { name: "Manajemen", category: "Ekonomi & Bisnis" },
  { name: "Akuntansi", category: "Ekonomi & Bisnis" },
  { name: "Ekonomi Pembangunan", category: "Ekonomi & Bisnis" },
  { name: "Hukum", category: "Sosial Humaniora" },
  { name: "Psikologi", category: "Sosial Humaniora" },
  { name: "Ilmu Komunikasi", category: "Sosial Humaniora" },
  { name: "Administrasi Bisnis", category: "Ekonomi & Bisnis" },
  { name: "Sastra Inggris", category: "Sosial Humaniora" },
];

const FPTK_SIGNATORY_SEED = [
  { roleLabel: "HR Manager", isRequired: true, sortOrder: 1 },
  { roleLabel: "Direktur/Kepala Entitas", isRequired: true, sortOrder: 2 },
  { roleLabel: "Direktur Keuangan", isRequired: false, sortOrder: 3 },
];

/** Master data every tenant needs, plus the default signatory config for FPTK — seeded once per tenant, never a hardcoded frontend list. */
export async function seedRecruitmentMasterData() {
  const allTenants = await db.select().from(tenants);
  for (const tenant of allTenants) {
    const [existingLevel] = await db.select().from(educationLevels).where(eq(educationLevels.tenantId, tenant.id)).limit(1);
    if (!existingLevel) {
      await db.insert(educationLevels).values(
        EDUCATION_LEVEL_NAMES.map((name, idx) => ({ tenantId: tenant.id, name, sortOrder: idx }))
      );
    }

    const [existingField] = await db.select().from(fieldsOfStudy).where(eq(fieldsOfStudy.tenantId, tenant.id)).limit(1);
    if (!existingField) {
      await db.insert(fieldsOfStudy).values(FIELD_OF_STUDY_SEED.map((f) => ({ tenantId: tenant.id, ...f })));
    }

    const [existingSignatory] = await db
      .select()
      .from(documentSignatoryConfigs)
      .where(and(eq(documentSignatoryConfigs.tenantId, tenant.id), eq(documentSignatoryConfigs.documentType, "FPTK")))
      .limit(1);
    if (!existingSignatory) {
      await db.insert(documentSignatoryConfigs).values(FPTK_SIGNATORY_SEED.map((s) => ({ tenantId: tenant.id, documentType: "FPTK", ...s })));
    }
  }
  console.log(`Master data pendidikan/jurusan & konfigurasi penandatangan FPTK disiapkan untuk ${allTenants.length} tenant.`);
}

/** Sample employees + one FPTK for the "contoh" demo tenant (PT Contoh) — real seeded rows, not frontend mock arrays. */
export async function seedRecruitmentSamplesForContoh() {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.subdomain, "contoh")).limit(1);
  if (!tenant) return console.log("Tenant 'contoh' belum ada, skip contoh data rekrutmen.");

  const [holding] = await db.select().from(companyEntities).where(and(eq(companyEntities.tenantId, tenant.id), eq(companyEntities.code, "HOLD"))).limit(1);
  if (!holding) return console.log("Entitas holding 'contoh' belum ada, skip contoh data rekrutmen.");

  const [existingEmployee] = await db.select().from(employees).where(eq(employees.tenantId, tenant.id)).limit(1);
  if (existingEmployee) return console.log("Contoh data karyawan/FPTK untuk tenant 'contoh' sudah ada, skip.");

  const [hrDivision] = await db.select().from(companyDivisions).where(and(eq(companyDivisions.tenantId, tenant.id), eq(companyDivisions.code, "HR"))).limit(1);
  const [recruitDept] = await db.select().from(companyDepartments).where(and(eq(companyDepartments.tenantId, tenant.id), eq(companyDepartments.code, "RECRUIT"))).limit(1);
  const [hrmPosition] = await db.select().from(masterJobPositions).where(and(eq(masterJobPositions.tenantId, tenant.id), eq(masterJobPositions.code, "HRM"))).limit(1);
  const [hrsPosition] = await db.select().from(masterJobPositions).where(and(eq(masterJobPositions.tenantId, tenant.id), eq(masterJobPositions.code, "HRS"))).limit(1);

  const seededEmployees = await db
    .insert(employees)
    .values([
      {
        tenantId: tenant.id,
        entityId: holding.id,
        nik: "202601.0001",
        name: "Siti Rahma",
        email: "siti.rahma@contoh.local",
        positionId: hrmPosition?.id,
        divisionId: hrDivision?.id,
        departmentId: recruitDept?.id,
        employmentStatus: "Aktif",
        joinDate: new Date("2023-02-01"),
      },
      {
        tenantId: tenant.id,
        entityId: holding.id,
        nik: "202401.0002",
        name: "Budi Santoso",
        email: "budi.santoso@contoh.local",
        positionId: hrsPosition?.id,
        divisionId: hrDivision?.id,
        departmentId: recruitDept?.id,
        employmentStatus: "Resign",
        joinDate: new Date("2022-05-01"),
        resignDate: new Date("2026-09-15"),
        resignReason: "Mengundurkan diri — melanjutkan studi",
      },
      {
        tenantId: tenant.id,
        entityId: holding.id,
        nik: "202401.0003",
        name: "Dewi Kartika",
        email: "dewi.kartika@contoh.local",
        positionId: hrsPosition?.id,
        divisionId: hrDivision?.id,
        departmentId: recruitDept?.id,
        employmentStatus: "Diberhentikan",
        joinDate: new Date("2021-08-01"),
        resignDate: new Date("2026-06-30"),
        resignReason: "Pemutusan hubungan kerja — restrukturisasi",
      },
    ])
    .returning();

  const replacementCandidate = seededEmployees.find((e) => e.name === "Budi Santoso")!;

  const [levelS1] = await db.select().from(educationLevels).where(and(eq(educationLevels.tenantId, tenant.id), eq(educationLevels.name, "S1"))).limit(1);
  const studyFields = await db.select().from(fieldsOfStudy).where(and(eq(fieldsOfStudy.tenantId, tenant.id))).limit(2);
  const [adminUser] = await db.select().from(users).where(and(eq(users.tenantId, tenant.id), eq(users.role, "tenant_admin"))).limit(1);

  if (adminUser) {
    await db.insert(jobRequisitions).values({
      tenantId: tenant.id,
      entityId: holding.id,
      divisionId: hrDivision?.id,
      departmentId: recruitDept?.id,
      positionId: hrsPosition?.id,
      requestedByUserId: adminUser.id,
      requisitionType: "Penggantian",
      replacementEmployeeId: replacementCandidate.id,
      headcount: 1,
      educationLevelId: levelS1?.id,
      fieldsOfStudyIds: studyFields.map((f) => f.id),
      minExperienceYears: 1,
      knockoutCriteria: [{ category: "Pendidikan", label: "Minimal S1 segala jurusan", matchMode: "contains" }],
      scoredCriteria: [{ label: "Pengalaman rekrutmen", weight: 40 }, { label: "Kemampuan komunikasi", weight: 30 }],
      status: "PendingApproval",
    });
  }

  console.log(`Contoh data karyawan & FPTK untuk tenant 'contoh' dibuat (${seededEmployees.length} karyawan).`);
}

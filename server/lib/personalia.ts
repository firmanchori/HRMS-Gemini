import { and, eq, isNull, ne, sql, desc, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.ts";
import {
  personaliaActions,
  employees,
  orgStructureNodes,
  companyDepartments,
  companyEntities,
  gradeSalaryRanges,
  complianceRecords,
  approvalItems,
} from "../db/schema.ts";
import { buildApprovalSteps, currentBlockingStep, finalizeHooks, ApprovalError } from "./approvalEngine.ts";
import { createOfficialDocumentRecord } from "./documents.ts";
import { logAudit } from "./audit.ts";
import { addMonths, todayWib } from "./dates.ts";
import { logError } from "./logger.ts";

export const PERSONALIA_CATEGORY = "Promosi/Personalia";

export const PERSONALIA_TYPES = [
  "Promosi",
  "Demosi",
  "Mutasi",
  "Mutasi Departemen",
  "Rotasi Cabang",
  "Penyesuaian Gaji",
  "Pengangkatan Tetap",
  "Perpanjangan Kontrak",
  "Penetapan Plt",
  "Penetapan Plt/Pjs",
  "Sanksi Disiplin SP",
  "Koreksi & Update Data Pribadi",
  "Tambah Data Baru",
] as const;

/** Types that move the person to another seat in the org chart. */
const ORG_MOVE_TYPES = new Set<string>(["Promosi", "Demosi", "Mutasi", "Mutasi Departemen"]);
/** Keys of personalDataUpdates that must never be changed through a data-correction SK (identity/ownership/money are changed by their own action types). */
const PROTECTED_DATA_KEYS = new Set(["id", "tenantId", "entityId", "basicSalary", "orgNodeId", "managerId", "status", "details", "createdAt", "candidateId"]);
const COLUMN_DATA_KEYS = new Set(["fullName", "email", "phone", "avatar"]);

const signatorySchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1).max(100),
  employeeId: z.string().optional(),
  nik: z.string().optional(),
  name: z.string().trim().min(1).max(200),
  role: z.string().optional(),
  date: z.string().optional(),
});

const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");

export const personaliaActionSchema = z.object({
  employeeId: z.string().uuid(),
  type: z.enum(PERSONALIA_TYPES),
  /** Draf stays editable & inert; Menunggu Approval submits through the Approval Engine. Never "Disetujui" from the client. */
  status: z.enum(["Draf", "Menunggu Approval"]).default("Menunggu Approval"),
  newOrgNodeId: z.string().uuid().optional().nullable(),
  newGrade: z.string().trim().max(50).optional().nullable(),
  newSalary: z.number().int().min(0).optional().nullable(),
  newPositionAllowance: z.number().int().min(0).optional().nullable(),
  newFixedAllowance: z.number().int().min(0).optional().nullable(),
  newBranchLocation: z.string().trim().max(200).optional().nullable(),
  newEntityId: z.string().uuid().optional().nullable(),
  mutationType: z.enum(["internal_departemen", "lintas_entitas_resmi", "lintas_entitas_administratif"]).optional().nullable(),
  personalDataUpdates: z.record(z.string(), z.unknown()).optional().nullable(),
  contractDurationMonths: z.number().int().min(1).max(120).optional().nullable(),
  contractEndDate: dateText.optional().nullable(),
  actingRoleExpiryDate: dateText.optional().nullable(),
  permanentAppointmentDate: dateText.optional().nullable(),
  disciplinaryLevel: z.enum(["SP 1", "SP 2", "SP 3", "Skorsing"]).optional().nullable(),
  effectiveDate: dateText,
  letterNumber: z.string().trim().max(100).optional().nullable(),
  reason: z.string().trim().min(3, "Alasan wajib diisi").max(2000),
  notes: z.string().trim().max(2000).optional().nullable(),
  signatories: z.array(signatorySchema).max(10).optional().nullable(),
  systemicImpact: z.record(z.string(), z.unknown()).optional().nullable(),
});
export type PersonaliaActionInput = z.infer<typeof personaliaActionSchema>;

const digits = (n: number | number[], label: string) => {
  const lens = Array.isArray(n) ? n : [n];
  return z.string().trim().refine((v) => lens.includes(v.replace(/\D/g, "").length) && /^[\d.\-\s]+$/.test(v), `${label} harus berupa ${lens.join(" atau ")} digit angka`);
};
const text = (label: string, max = 200) => z.string().trim().min(1, `${label} tidak boleh kosong`).max(max, `${label} maksimal ${max} karakter`);
const optionalList = z.array(z.record(z.string(), z.unknown())).max(50);

/** Allow-list of the personal-data fields a "Koreksi"/"Tambah Data" SK may change, each validated by its real format. Anything else (identity keys, salary, org links) is rejected, not silently dropped. */
export const personalDataUpdatesSchema = z
  .object({
    fullName: text("Nama lengkap"),
    email: z.string().trim().email("Email tidak valid").max(200),
    personalEmail: z.string().trim().email("Email pribadi tidak valid").max(200),
    phone: z.string().trim().regex(/^\+?[\d\s\-]{8,20}$/, "Nomor telepon tidak valid"),
    whatsApp: z.string().trim().regex(/^\+?[\d\s\-]{8,20}$/, "Nomor WhatsApp tidak valid"),
    avatar: z.string().max(2000),
    nikKtp: digits(16, "NIK KTP"),
    noKk: digits(16, "No. KK"),
    birthPlace: text("Tempat lahir", 100),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal lahir harus YYYY-MM-DD").refine((v) => v < new Date().toISOString().slice(0, 10), "Tanggal lahir tidak boleh di masa depan"),
    gender: z.enum(["Laki-laki", "Perempuan"]),
    religion: z.enum(["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Lainnya"]),
    maritalStatus: z.enum(["Lajang", "Menikah", "Cerai Hidup", "Cerai Mati"]),
    bloodType: z.enum(["A", "B", "AB", "O"]),
    ktpAddress: text("Alamat KTP", 500),
    currentAddress: text("Alamat domisili", 500),
    postalCode: z.string().trim().regex(/^\d{5}$/, "Kode pos harus 5 digit"),
    npwp: digits([15, 16], "NPWP"),
    npwp16: digits(16, "NPWP 16 digit"),
    ptkp: text("Status PTKP", 10),
    kppPratama: text("KPP Pratama", 200),
    bpjsTkNo: text("No. BPJS Ketenagakerjaan", 30),
    bpjsKesNo: text("No. BPJS Kesehatan", 30),
    faskes1Bpjs: text("Faskes 1 BPJS", 200),
    bankName: text("Nama bank", 100),
    bankAccount: z.string().trim().regex(/^\d{5,30}$/, "Nomor rekening harus 5–30 digit angka"),
    bankAccountHolder: text("Nama pemilik rekening", 200),
    lastEducationDegree: z.enum(["SMA/SMK", "D3", "S1", "S2", "S3"]),
    institution: text("Institusi"),
    major: text("Jurusan"),
    graduationYear: z.number().int().min(1950).max(new Date().getFullYear() + 1),
    educationGpa: z.union([z.number().min(0).max(4.5), z.string().trim().max(10)]),
    titlePrefix: z.string().trim().max(50),
    titleSuffix: z.string().trim().max(50),
    formalEducations: optionalList,
    nonFormalEducations: optionalList,
    familyMembers: optionalList,
    emergencyContacts: optionalList,
  })
  .partial()
  .strict()
  .refine((o) => Object.keys(o).length > 0, "Tidak ada data yang diubah");

export class PersonaliaError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

type EmployeeRow = typeof employees.$inferSelect;
const detailStr = (e: EmployeeRow, key: string): string | null => {
  const v = (e.details as Record<string, unknown>)?.[key];
  return typeof v === "string" ? v : null;
};
const detailNum = (e: EmployeeRow, key: string): number | null => {
  const v = (e.details as Record<string, unknown>)?.[key];
  return typeof v === "number" ? v : null;
};

async function nextLetterNumber(tenantId: string, year: number): Promise<string> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(personaliaActions).where(eq(personaliaActions.tenantId, tenantId));
  let n = count + 1;
  for (;;) {
    const candidate = `SK-PRS/${String(n).padStart(3, "0")}/${year}`;
    const [clash] = await db.select({ id: personaliaActions.id }).from(personaliaActions).where(and(eq(personaliaActions.tenantId, tenantId), eq(personaliaActions.letterNumber, candidate))).limit(1);
    if (!clash) return candidate;
    n += 1;
  }
}

/** A new salary must sit inside the grade's configured band when the tenant has defined one for that grade. */
async function assertSalaryWithinGrade(tenantId: string, grade: string | null | undefined, salary: number | null | undefined) {
  if (!grade || salary == null) return;
  const ranges = await db.select().from(gradeSalaryRanges).where(and(eq(gradeSalaryRanges.tenantId, tenantId), eq(gradeSalaryRanges.gradeCode, grade)));
  if (ranges.length === 0) return;
  const fits = ranges.some((r) => (r.minSalary == null || salary >= r.minSalary) && (r.maxSalary == null || salary <= r.maxSalary));
  if (!fits) {
    const r = ranges[0];
    throw new PersonaliaError(`Gaji ${salary.toLocaleString("id-ID")} berada di luar rentang grade ${grade} (${(r.minSalary ?? 0).toLocaleString("id-ID")} – ${(r.maxSalary ?? 0).toLocaleString("id-ID")}).`);
  }
}

/** Completeness required before an action may enter approval (a Draf may be saved half-filled). */
function assertComplete(a: { type: string; newOrgNodeId?: string | null; disciplinaryLevel?: string | null; contractEndDate?: string | null; contractDurationMonths?: number | null; actingRoleExpiryDate?: string | null; newSalary?: number | null }) {
  if (ORG_MOVE_TYPES.has(a.type) && !a.newOrgNodeId) throw new PersonaliaError(`${a.type} wajib memilih posisi tujuan dari struktur organisasi.`);
  if (a.type === "Sanksi Disiplin SP" && !a.disciplinaryLevel) throw new PersonaliaError("Tingkat sanksi (SP 1/2/3/Skorsing) wajib dipilih.");
  if (a.type === "Perpanjangan Kontrak" && !a.contractEndDate && !a.contractDurationMonths) throw new PersonaliaError("Perpanjangan kontrak wajib mengisi durasi atau tanggal berakhir baru.");
  if ((a.type === "Penetapan Plt" || a.type === "Penetapan Plt/Pjs") && !a.actingRoleExpiryDate) throw new PersonaliaError("Tanggal berakhir Plt/Pjs wajib diisi.");
  if (a.type === "Penyesuaian Gaji" && a.newSalary == null) throw new PersonaliaError("Gaji baru wajib diisi.");
}

/** Create a personalia action. The "previous*" snapshot is captured here from the employee's CURRENT record — never trusted from the client. */
export async function createPersonaliaAction(params: { tenantId: string; actorUserId: string | null; input: PersonaliaActionInput }) {
  const { tenantId, input } = params;
  const [emp] = await db.select().from(employees).where(and(eq(employees.id, input.employeeId), eq(employees.tenantId, tenantId))).limit(1);
  if (!emp) throw new PersonaliaError("Karyawan tidak ditemukan", 404);
  if (emp.status !== "Aktif") throw new PersonaliaError("Tindakan personalia hanya dapat dibuat untuk karyawan berstatus Aktif.");

  let node: typeof orgStructureNodes.$inferSelect | undefined;
  if (input.newOrgNodeId) {
    [node] = await db.select().from(orgStructureNodes).where(and(eq(orgStructureNodes.id, input.newOrgNodeId), eq(orgStructureNodes.tenantId, tenantId))).limit(1);
    if (!node) throw new PersonaliaError("Posisi tujuan tidak ditemukan di struktur organisasi.");
    if (node.id === emp.orgNodeId) throw new PersonaliaError("Posisi tujuan sama dengan posisi saat ini.");
    if (!node.isVacant && ORG_MOVE_TYPES.has(input.type)) throw new PersonaliaError("Posisi tujuan sudah terisi. Kosongkan posisi tersebut terlebih dahulu.");
  }
  if (input.newEntityId) {
    const [ent] = await db.select({ id: companyEntities.id }).from(companyEntities).where(and(eq(companyEntities.id, input.newEntityId), eq(companyEntities.tenantId, tenantId))).limit(1);
    if (!ent) throw new PersonaliaError("Entitas tujuan tidak ditemukan.");
  }
  if (input.status === "Menunggu Approval") assertComplete(input);
  await assertSalaryWithinGrade(tenantId, input.newGrade ?? detailStr(emp, "grade"), input.newSalary);

  let personalData: Record<string, unknown> | null = input.personalDataUpdates ?? null;
  if (input.type === "Koreksi & Update Data Pribadi" || input.type === "Tambah Data Baru") {
    const parsed = personalDataUpdatesSchema.safeParse(personalData ?? {});
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue.code === "unrecognized_keys") throw new PersonaliaError(`Kolom tidak boleh diubah lewat SK data pribadi: ${issue.keys.join(", ")}`);
      const field = issue.path.length ? `${issue.path.join(".")}: ` : "";
      throw new PersonaliaError(`Data pribadi tidak valid — ${field}${issue.message}`);
    }
    personalData = parsed.data;
  } else {
    personalData = null; // other action types never carry personal-data changes
  }

  const letterNumber = input.letterNumber?.trim() || (await nextLetterNumber(tenantId, new Date().getFullYear()));
  const [dup] = await db.select({ id: personaliaActions.id }).from(personaliaActions).where(and(eq(personaliaActions.tenantId, tenantId), eq(personaliaActions.letterNumber, letterNumber))).limit(1);
  if (dup) throw new PersonaliaError(`Nomor surat ${letterNumber} sudah digunakan.`);

  const [created] = await db
    .insert(personaliaActions)
    .values({
      tenantId,
      employeeId: emp.id,
      type: input.type,
      status: "Draf",
      previousPosition: detailStr(emp, "position"),
      previousDepartment: detailStr(emp, "department"),
      previousGrade: detailStr(emp, "grade"),
      previousSalary: emp.basicSalary,
      previousAllowance: detailNum(emp, "positionAllowance"),
      previousOrgNodeId: emp.orgNodeId,
      previousEntityId: emp.entityId,
      newOrgNodeId: node?.id ?? null,
      newGrade: input.newGrade ?? null,
      newSalary: input.newSalary ?? null,
      newPositionAllowance: input.newPositionAllowance ?? null,
      newFixedAllowance: input.newFixedAllowance ?? null,
      newBranchLocation: input.newBranchLocation ?? null,
      newEntityId: input.newEntityId ?? null,
      mutationType: input.mutationType ?? null,
      personalDataUpdates: personalData,
      contractDurationMonths: input.contractDurationMonths ?? null,
      contractEndDate: input.contractEndDate ?? null,
      actingRoleExpiryDate: input.actingRoleExpiryDate ?? null,
      permanentAppointmentDate: input.permanentAppointmentDate ?? null,
      disciplinaryLevel: input.disciplinaryLevel ?? null,
      effectiveDate: input.effectiveDate,
      letterNumber,
      reason: input.reason,
      notes: input.notes ?? null,
      signatories: input.signatories ?? null,
      systemicImpact: input.systemicImpact ?? null,
      createdByUserId: params.actorUserId,
    })
    .returning();
  await logAudit({ actorUserId: params.actorUserId, tenantId, action: "personalia.created", details: { personaliaActionId: created.id, type: created.type, employeeId: emp.id } });
  return input.status === "Menunggu Approval" ? submitPersonaliaAction({ tenantId, actionId: created.id, actorUserId: params.actorUserId }) : created;
}

/** Draf → Menunggu Approval: opens an Approval Engine item whose steps are resolved from the employee's real reporting line. */
export async function submitPersonaliaAction(params: { tenantId: string; actionId: string; actorUserId: string | null }) {
  const { tenantId, actionId } = params;
  const [action] = await db.select().from(personaliaActions).where(and(eq(personaliaActions.id, actionId), eq(personaliaActions.tenantId, tenantId))).limit(1);
  if (!action) throw new PersonaliaError("Tindakan personalia tidak ditemukan", 404);
  if (action.status !== "Draf") throw new PersonaliaError("Hanya draf yang dapat diajukan.");
  assertComplete(action);
  const [emp] = await db.select().from(employees).where(eq(employees.id, action.employeeId)).limit(1);
  const steps = await buildApprovalSteps(tenantId, PERSONALIA_CATEGORY, action.employeeId);
  const first = currentBlockingStep(steps);
  const [item] = await db
    .insert(approvalItems)
    .values({
      tenantId,
      category: PERSONALIA_CATEGORY,
      referenceId: action.id,
      title: `Personalia: ${action.type} - ${emp?.fullName ?? "Karyawan"}`,
      requesterId: action.employeeId,
      department: action.previousDepartment ?? "Operasional",
      steps,
      level: first?.level ?? 1,
      totalLevels: steps.length,
      assignedApproverRole: "manager",
      assignedApproverId: first?.approverEmployeeId ?? null,
      deadlineAt: first?.deadlineAt ? new Date(first.deadlineAt) : null,
      status: "Menunggu",
      notes: action.reason,
    })
    .returning();
  const [updated] = await db.update(personaliaActions).set({ status: "Menunggu Approval", approvalItemId: item.id }).where(eq(personaliaActions.id, action.id)).returning();
  await logAudit({ actorUserId: params.actorUserId, tenantId, action: "personalia.submitted", details: { personaliaActionId: action.id, approvalItemId: item.id } });
  return updated;
}

export async function deletePersonaliaDraft(tenantId: string, actionId: string) {
  const [action] = await db.select().from(personaliaActions).where(and(eq(personaliaActions.id, actionId), eq(personaliaActions.tenantId, tenantId))).limit(1);
  if (!action) throw new PersonaliaError("Tindakan personalia tidak ditemukan", 404);
  if (action.status !== "Draf") throw new PersonaliaError("Hanya draf yang dapat dihapus.");
  await db.delete(personaliaActions).where(eq(personaliaActions.id, action.id));
}

export async function listPersonaliaActions(tenantId: string, employeeId?: string) {
  const where = employeeId ? and(eq(personaliaActions.tenantId, tenantId), eq(personaliaActions.employeeId, employeeId)) : eq(personaliaActions.tenantId, tenantId);
  return db.select().from(personaliaActions).where(where).orderBy(desc(personaliaActions.createdAt));
}


function documentTypeFor(type: string): string {
  if (type === "Promosi" || type === "Demosi") return "Surat Promosi";
  if (type === "Mutasi" || type === "Mutasi Departemen" || type === "Rotasi Cabang") return "Surat Mutasi";
  if (type === "Pengangkatan Tetap") return "SK Pengangkatan";
  return "Surat Promosi";
}

/**
 * The single place an approved action changes real data: employee columns +
 * details, org-chart seat (vacate old / fill new), reporting line, entity,
 * contract, compliance (SP) and the official SK document — all server-side.
 * Idempotent: claimed atomically via appliedAt, so a double decision can
 * never apply twice.
 */
export async function applyPersonaliaAction(actionId: string, approvedBy: string) {
  const [claimed] = await db
    .update(personaliaActions)
    .set({ status: "Disetujui", approvedBy, appliedAt: new Date() })
    .where(and(eq(personaliaActions.id, actionId), isNull(personaliaActions.appliedAt)))
    .returning();
  if (!claimed) return;
  try {
    const a = claimed;
    const tenantId = a.tenantId;
    const [emp] = await db.select().from(employees).where(eq(employees.id, a.employeeId)).limit(1);
    if (!emp) throw new PersonaliaError("Karyawan tidak ditemukan", 404);

    const details: Record<string, unknown> = { ...(emp.details as Record<string, unknown>) };
    const columns: Partial<typeof employees.$inferInsert> = {};

    // --- Position / org chart ---
    if (a.newOrgNodeId && ORG_MOVE_TYPES.has(a.type)) {
      const [node] = await db.select().from(orgStructureNodes).where(eq(orgStructureNodes.id, a.newOrgNodeId)).limit(1);
      if (!node) throw new PersonaliaError("Posisi tujuan sudah tidak ada.");
      if (!node.isVacant) throw new PersonaliaError("Posisi tujuan sudah terisi sejak pengajuan dibuat.");
      const [dept] = node.departmentId ? await db.select().from(companyDepartments).where(eq(companyDepartments.id, node.departmentId)).limit(1) : [];
      const oldNodeId = emp.orgNodeId;
      columns.orgNodeId = node.id;
      columns.entityId = node.entityId;
      columns.divisionId = node.divisionId;
      columns.departmentId = node.departmentId;
      columns.positionId = node.masterJobPositionId;
      details.position = node.title;
      if (dept) details.department = dept.name;
      if (node.jobGrade && !a.newGrade) details.grade = node.jobGrade;
      // Reporting line follows the chart: manager = whoever holds the node this seat reports to.
      if (node.reportsToId) {
        const [boss] = await db.select({ id: employees.id }).from(employees).where(and(eq(employees.orgNodeId, node.reportsToId), eq(employees.tenantId, tenantId), eq(employees.status, "Aktif"))).limit(1);
        columns.managerId = boss?.id ?? null;
      } else {
        columns.managerId = null;
      }
      if (oldNodeId && oldNodeId !== node.id) {
        const [stillHeld] = await db.select({ id: employees.id }).from(employees).where(and(eq(employees.orgNodeId, oldNodeId), ne(employees.id, emp.id))).limit(1);
        if (!stillHeld) {
          await db.update(orgStructureNodes).set({ isVacant: true }).where(eq(orgStructureNodes.id, oldNodeId));
          await db.update(employees).set({ managerId: null }).where(and(eq(employees.managerId, emp.id), eq(employees.tenantId, tenantId)));
        }
      }
      await db.update(orgStructureNodes).set({ isVacant: false }).where(eq(orgStructureNodes.id, node.id));
      // Whoever reports to this seat now reports to this person.
      const reports = await db.select({ id: employees.id }).from(employees).innerJoin(orgStructureNodes, eq(employees.orgNodeId, orgStructureNodes.id)).where(and(eq(orgStructureNodes.reportsToId, node.id), eq(employees.tenantId, tenantId)));
      for (const r of reports) await db.update(employees).set({ managerId: emp.id }).where(eq(employees.id, r.id));
    }

    // --- Entity move without an org seat (mutasi lintas entitas) ---
    if (a.newEntityId && a.newEntityId !== emp.entityId) {
      columns.entityId = a.newEntityId;
      if (!a.newOrgNodeId) {
        columns.orgNodeId = null;
        columns.divisionId = null;
        columns.departmentId = null;
        columns.positionId = null;
        columns.managerId = null;
        if (emp.orgNodeId) {
          const [stillHeld] = await db.select({ id: employees.id }).from(employees).where(and(eq(employees.orgNodeId, emp.orgNodeId), ne(employees.id, emp.id))).limit(1);
          if (!stillHeld) await db.update(orgStructureNodes).set({ isVacant: true }).where(eq(orgStructureNodes.id, emp.orgNodeId));
        }
      }
    }

    // --- Compensation ---
    if (a.newSalary != null) columns.basicSalary = a.newSalary;
    if (a.newGrade) details.grade = a.newGrade;
    if (a.newPositionAllowance != null) details.positionAllowance = a.newPositionAllowance;
    if (a.newFixedAllowance != null) details.fixedAllowance = a.newFixedAllowance;
    if (a.newBranchLocation) details.branchLocation = a.newBranchLocation;

    // --- Type-specific ---
    if (a.type === "Pengangkatan Tetap") {
      columns.employmentType = "Tetap";
      details.probationStatus = "Lolos";
      details.permanentAppointmentDate = a.permanentAppointmentDate || a.effectiveDate;
      details.contractDocNumber = a.letterNumber;
    } else if (a.type === "Perpanjangan Kontrak") {
      const base = typeof details.contractEndDate === "string" && details.contractEndDate > a.effectiveDate ? (details.contractEndDate as string) : a.effectiveDate;
      details.contractEndDate = a.contractEndDate || addMonths(base, a.contractDurationMonths!);
      details.contractDocNumber = a.letterNumber;
    } else if (a.type === "Penetapan Plt" || a.type === "Penetapan Plt/Pjs") {
      details.actingRole = { orgNodeId: a.newOrgNodeId, expiresOn: a.actingRoleExpiryDate, letterNumber: a.letterNumber };
    } else if (a.type === "Sanksi Disiplin SP" && a.disciplinaryLevel) {
      await db.insert(complianceRecords).values({
        tenantId,
        employeeId: emp.id,
        level: a.disciplinaryLevel,
        violationReason: a.reason,
        letterNumber: a.letterNumber,
        issueDate: a.effectiveDate,
        validUntil: addMonths(a.effectiveDate, 6),
        signedBy: approvedBy,
        status: "Aktif",
      });
    } else if ((a.type === "Koreksi & Update Data Pribadi" || a.type === "Tambah Data Baru") && a.personalDataUpdates) {
      for (const [k, v] of Object.entries(a.personalDataUpdates)) {
        if (PROTECTED_DATA_KEYS.has(k)) continue;
        if (COLUMN_DATA_KEYS.has(k) && typeof v === "string") (columns as Record<string, unknown>)[k === "fullName" ? "fullName" : k] = v;
        details[k] = v;
      }
    }

    await db.update(employees).set({ ...columns, details }).where(eq(employees.id, emp.id));

    // --- Official SK: signatories come from the document type's config; QR only appears once all sign ---
    const doc = await createOfficialDocumentRecord({
      tenantId,
      data: {
        documentNumber: a.letterNumber,
        type: documentTypeFor(a.type),
        title: `Surat Keputusan (${a.type}): ${emp.fullName}`,
        targetEmployeeId: emp.id,
        issueDate: a.effectiveDate,
        signeeName: approvedBy,
        signeeRole: "VP Human Resources",
        contentPreview: `Menetapkan keputusan personalia (${a.type}) atas nama ${emp.fullName} (NIK: ${emp.nik}). Berlaku efektif terhitung tanggal ${a.effectiveDate}. Alasan: ${a.reason}`,
      },
    });
    await db.update(personaliaActions).set({ documentId: doc.id }).where(eq(personaliaActions.id, a.id));
    await logAudit({ actorUserId: null, tenantId, action: "personalia.applied", details: { personaliaActionId: a.id, type: a.type, employeeId: emp.id, documentId: doc.id } });
  } catch (err) {
    // Release the claim so a retry (or a corrected position) can apply it; the approval stays decided.
    // Stays "Disetujui" (the approval is final) but unapplied, so the scheduled sweep retries it.
    await db.update(personaliaActions).set({ status: "Disetujui", appliedAt: null }).where(eq(personaliaActions.id, actionId));
    throw err;
  }
}

finalizeHooks[PERSONALIA_CATEGORY] = async (item, decidedByName) => {
  if (item.status === "Disetujui") {
    try {
      const [action] = await db.select().from(personaliaActions).where(eq(personaliaActions.id, item.referenceId)).limit(1);
      if (action && action.effectiveDate > todayWib()) {
        // Approved ahead of its effective date: recorded now, applied by applyDuePersonaliaActions() on that date.
        await db.update(personaliaActions).set({ status: "Disetujui", approvedBy: decidedByName }).where(eq(personaliaActions.id, action.id));
        return;
      }
      await applyPersonaliaAction(item.referenceId, decidedByName);
    } catch (err) {
      // Surface to the approver instead of silently leaving approved-but-unapplied.
      throw new ApprovalError(`Persetujuan tercatat, tetapi penerapan perubahan gagal: ${err instanceof Error ? err.message : "kesalahan tidak diketahui"}`, 409);
    }
  } else if (item.status === "Ditolak") {
    await db.update(personaliaActions).set({ status: "Ditolak", approvedBy: decidedByName }).where(eq(personaliaActions.id, item.referenceId));
  }
};

/** Applies every approved action whose effective date has arrived. Safe to run repeatedly (apply is claimed atomically). Returns how many were applied. */
export async function applyDuePersonaliaActions(): Promise<number> {
  const due = await db
    .select()
    .from(personaliaActions)
    .where(and(eq(personaliaActions.status, "Disetujui"), isNull(personaliaActions.appliedAt), lte(personaliaActions.effectiveDate, todayWib())));
  let applied = 0;
  for (const a of due) {
    try {
      await applyPersonaliaAction(a.id, a.approvedBy ?? "Sistem");
      applied += 1;
    } catch (err) {
      logError(`Personalia: gagal menerapkan ${a.id} saat tanggal efektif`, err);
    }
  }
  return applied;
}

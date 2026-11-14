import { Router, type Request } from "express";
import { z } from "zod";

/**
 * An ISO datetime string that gets transformed into a real Date before it
 * reaches drizzle — a bare `zDateTime()` validates the string's
 * shape but still hands drizzle a string for a `timestamp` column, and
 * drizzle's own serialization always calls `.toISOString()` on the value,
 * which only exists on Date. Every notNull/explicit timestamp field hit
 * this once a request actually supplied the field (several hadn't been
 * exercised yet, which is how this stayed latent) — user, 2026-11-02 bug
 * audit, found while live-testing approval-delegations.
 */
const zDateTime = () => z.string().datetime().transform((s) => new Date(s));
import bcrypt from "bcryptjs";
import { eq, inArray, and, isNull, desc } from "drizzle-orm";
import { db } from "../db/client.ts";
import {
  companyEntities,
  entityClosure,
  companyDivisions,
  companyDepartments,
  masterJobPositions,
  gradeSalaryRanges,
  orgStructureNodes,
  orgChangeProposals,
  orgStructureSnapshots,
  officeLocations,
  users,
  educationLevels,
  fieldsOfStudy,
  employees,
  jobRequisitions,
  documentSignatoryConfigs,
  jobVacancies,
  candidates,
  onboardingProcesses,
  competencyTestTypeSettings,
  interviewTypeSettings,
  onboardingChecklistTemplates,
  probationEvaluations,
  probationEvaluationTemplates,
  contractRenewalReviews,
  tenantModuleSettings,
  approvalItems,
  approvalWorkflowConfigs,
  approvalDelegations,
  workShifts,
  employeeSchedules,
  shiftSwapRequests,
  attendanceRecords,
  attendanceCorrectionRequests,
  overtimeRequests,
  salaryComponents,
  employeeSalaryComponentAssignments,
  payrollRecords,
  employeeLoans,
  leaveRequests,
  employeeKpis,
  complianceRecords,
  offboardingRecords,
  businessTrips,
  vendors,
  gaAssets,
  assetMaintenanceTickets,
  assetRelocationLogs,
  procurementOrders,
  roleDefinitions,
  rolePermissionEntries,
  employeeAccounts,
  companyCalendarEvents,
  auditTrailEntries,
  documentTemplates,
  officialDocuments,
  enpsSurveys,
  vendorInvoices,
} from "../db/schema.ts";
import { requireTenantAdmin } from "../middleware/auth.ts";
import { generateAssetsFromReceivedOrder, isReceivedStatus, deriveUsageStatus, isPostApprovalProcurementStatus, hasPendingProcurementApproval } from "../lib/assetLifecycle.ts";
import { createOfficialDocumentRecord, isFullySigned, buildVerificationUrl } from "../lib/documents.ts";
import { personaliaActionSchema, createPersonaliaAction, submitPersonaliaAction, deletePersonaliaDraft, listPersonaliaActions, PersonaliaError } from "../lib/personalia.ts";
import { buildApprovalSteps, currentBlockingStep, decideApproval, withDerivedStatus, ApprovalError } from "../lib/approvalEngine.ts";
import { validateBody, validateParams, uuidParam } from "../lib/validate.ts";
import { rejectBreachedPassword } from "../middleware/passwordCheck.ts";
import { computeNewEntityClosureRows, buildEntityTree, applyChangeSet, resolveNikPattern } from "../lib/orgStructure.ts";
import { logAudit } from "../lib/audit.ts";
import { seedDefaultDocumentTemplatesForTenant } from "../lib/defaultDocumentTemplates.ts";
import { ensureDefaultEmployeeRbac } from "../lib/permissions.ts";
import { checkClockIn, checkClockOut, performClockIn, performClockOut, ClockError } from "../lib/attendanceClock.ts";

export const tenantRouter = Router();
tenantRouter.use(requireTenantAdmin);

/**
 * Which entity a tenant_admin is personally scoped to — the entity whose own
 * roster they manage, and the only entity under which they're allowed to
 * create a direct child. `users.entityId` is null for a tenant's very first
 * (registration) admin until its holding entity exists; it's ALSO still
 * null forever for tenants seeded before this scoping existed, so we fall
 * back to "the tenant's own root/holding entity" in that case rather than
 * treating them as scope-less.
 */
async function resolveCallerEntityId(callerUser: { entityId: string | null } | undefined, tenantId: string): Promise<string | null> {
  if (callerUser?.entityId) return callerUser.entityId;
  const [rootEntity] = await db.select().from(companyEntities).where(and(eq(companyEntities.tenantId, tenantId), isNull(companyEntities.parentEntityId))).limit(1);
  return rootEntity?.id ?? null;
}

/**
 * The caller's full visible entity set (self + all descendants) — the same
 * set every GET endpoint in this file already filters reads by. Every
 * create/update that accepts an entityId (directly, or indirectly via a
 * referenced row like a vacancy or employee) MUST check the target entity
 * is in this set too, not just reads: without it, any tenant_admin could
 * write into a sibling entity's data by passing a different entityId —
 * a real authorization gap found across job-requisitions, job-vacancies,
 * candidates, onboarding-processes and employees (user, 2026-11-02 bug
 * audit).
 */
async function resolveVisibleEntityIds(req: Request, tenantId: string): Promise<string[]> {
  // Common path: one JOIN round trip instead of two sequential ones (fetch
  // user, then fetch entity_closure). This is the single most-called shared
  // primitive in this file — load testing (2026-11-08, docs/LOAD_TESTING.md)
  // found that under real concurrency, requests weren't slow because of any
  // one query but because each request held a pooled DB connection open
  // across several SEQUENTIAL round trips, so connections queued up behind
  // each other. Halving this function's round trips directly shortens that.
  const joined = await db
    .select({ id: entityClosure.descendantEntityId })
    .from(users)
    .innerJoin(entityClosure, eq(entityClosure.ancestorEntityId, users.entityId))
    .where(eq(users.id, req.session!.userId));
  if (joined.length > 0) return joined.map((r) => r.id);

  // Rare fallback: entityId is null (a brand-new tenant's registration
  // admin before its holding entity exists yet) — not the hot path, so the
  // extra round trip here doesn't matter the way it did above.
  const [callerUser] = await db.select().from(users).where(eq(users.id, req.session!.userId)).limit(1);
  const callerEntityId = await resolveCallerEntityId(callerUser, tenantId);
  if (!callerEntityId) return [];
  const visibleRows = await db.select({ id: entityClosure.descendantEntityId }).from(entityClosure).where(eq(entityClosure.ancestorEntityId, callerEntityId));
  return visibleRows.map((r) => r.id);
}

// ---------------------------------------------------------------------------
// Entities — unlimited-depth tree, entity_closure maintained on create.
// "Bawa pengaturan dari parent" = a one-time dead copy of the parent's
// CURRENT column values at creation, never a live link (user correction).
//
// Provisioning rule: an entity's admin may create a DIRECT child entity, but
// their responsibility for that child stops at creating its one admin user
// — everything else for the child (its own structure, its own further
// users) is the child admin's job, never the parent's. Applies recursively:
// anak -> cucu -> cicit, each level only ever touches its immediate child.
// ---------------------------------------------------------------------------

const createEntityAdminSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});

const createEntitySchema = z.object({
  parentEntityId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(200),
  code: z.string().trim().min(1).max(50),
  emailDomain: z.string().trim().max(200).optional(),
  relationType: z.enum(["resmi", "administratif"]).optional(),
  useDepartmentLevel: z.boolean().optional(),
  npwp: z.string().trim().max(50).optional(),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  nikPattern: z.string().trim().max(100).optional(),
  // Explicit, not implicit — defaults to true (follow) only when a parent exists; see resolveNikPattern.
  followParentNikPattern: z.boolean().optional(),
  docPrefix: z.string().trim().max(50).optional(),
  isGovernanceLocked: z.boolean().optional(),
  documentLogoUrl: z.string().trim().max(2000).optional(),
  appFaviconUrl: z.string().trim().max(2000).optional(),
  // Required when parentEntityId is set — the one admin account the creating entity provisions for its new child.
  admin: createEntityAdminSchema.optional(),
});

tenantRouter.post("/entities", validateBody(createEntitySchema), rejectBreachedPassword((req) => req.body.admin?.password), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const body = req.body as z.infer<typeof createEntitySchema>;

  let parent: typeof companyEntities.$inferSelect | undefined;
  if (body.parentEntityId) {
    [parent] = await db.select().from(companyEntities).where(and(eq(companyEntities.id, body.parentEntityId), eq(companyEntities.tenantId, tenantId))).limit(1);
    if (!parent) return res.status(400).json({ error: "Entitas induk tidak ditemukan" });
  }

  const [callerUser] = await db.select().from(users).where(eq(users.id, req.session!.userId)).limit(1);
  const callerEntityId = await resolveCallerEntityId(callerUser, tenantId);

  if (!body.parentEntityId) {
    if (callerEntityId !== null) {
      return res.status(403).json({ error: "Entitas utama (holding) untuk tenant ini sudah ada. Entitas baru harus dibuat sebagai anak dari entitas yang sudah ada." });
    }
  } else {
    if (callerEntityId !== body.parentEntityId) {
      return res.status(403).json({ error: "Hanya admin dari entitas induk langsung yang berwenang membuat entitas anak di bawahnya." });
    }
    if (!body.admin) {
      return res.status(400).json({ error: "Wajib membuat satu akun admin untuk entitas baru ini." });
    }
    const [existingEmail] = await db.select().from(users).where(and(eq(users.tenantId, tenantId), eq(users.email, body.admin.email))).limit(1);
    if (existingEmail) return res.status(400).json({ error: "Email admin tersebut sudah digunakan di tenant ini." });
  }

  const nikResolution = resolveNikPattern(!!parent, body.followParentNikPattern ?? true, parent?.nikPattern ?? null, body.nikPattern ?? null);

  // Dead copy from the parent's CURRENT values — only for fields the request didn't explicitly set.
  const values = {
    tenantId,
    parentEntityId: body.parentEntityId ?? null,
    name: body.name,
    code: body.code,
    emailDomain: body.emailDomain ?? parent?.emailDomain ?? null,
    relationType: body.relationType ?? parent?.relationType ?? "resmi",
    useDepartmentLevel: body.useDepartmentLevel ?? parent?.useDepartmentLevel ?? true,
    npwp: body.npwp ?? null,
    address: body.address ?? null,
    city: body.city ?? null,
    nikPattern: nikResolution.nikPattern,
    nikPatternFollowsParent: nikResolution.nikPatternFollowsParent,
    docPrefix: body.docPrefix ?? parent?.docPrefix ?? null,
    isGovernanceLocked: body.isGovernanceLocked ?? false,
    createdByEntityId: parent?.id ?? null,
  };

  const [created] = await db.insert(companyEntities).values(values).returning();

  const parentAncestorRows = parent
    ? await db.select().from(entityClosure).where(eq(entityClosure.descendantEntityId, parent.id))
    : [];
  const closureRows = computeNewEntityClosureRows(created.id, parentAncestorRows);
  await db.insert(entityClosure).values(closureRows);

  // The tenant's very first (registration) admin becomes permanently scoped to the holding entity it just created.
  if (!body.parentEntityId && callerUser && callerUser.entityId === null) {
    await db.update(users).set({ entityId: created.id }).where(eq(users.id, callerUser.id));
    // This is the tenant's holding/root entity being created for the first
    // time — the one moment a brand-new tenant actually exists in a usable
    // sense. Give it its own independent copy of the app's default document
    // catalog (45 templates) right here, same moment as the other one-time
    // setup above. No-ops if the tenant somehow already has templates.
    await seedDefaultDocumentTemplatesForTenant(tenantId, { name: created.name, address: created.address });
  }

  let createdAdmin: { id: string; name: string; email: string } | null = null;
  if (body.admin) {
    const passwordHash = await bcrypt.hash(body.admin.password, 10);
    const [adminUser] = await db
      .insert(users)
      .values({ tenantId, entityId: created.id, role: "tenant_admin", name: body.admin.name, email: body.admin.email, passwordHash })
      .returning();
    createdAdmin = { id: adminUser.id, name: adminUser.name, email: adminUser.email };
  }

  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "entity.create", details: { entityId: created.id, parentEntityId: body.parentEntityId ?? null, adminUserId: createdAdmin?.id ?? null } });
  res.status(201).json({ ...created, admin: createdAdmin });
});

/** Lists entities visible from `viewAsEntityId` (itself + all descendants, never a sibling or ancestor) — or every entity in the tenant when omitted. */
/**
 * Default (no viewAsEntityId) used to return every entity in the whole
 * tenant, ignoring the caller's own scope entirely — a sibling admin would
 * see every other sibling's full entity record. And viewAsEntityId, when
 * given, was used as the closure ancestor with no check that it was even
 * within the CALLER's own visible scope, letting anyone "view as" an
 * entity they don't actually have access to. Fixed: default to the
 * caller's own visible scope, and viewAsEntityId must itself be inside
 * that scope (user, 2026-11-02 bug audit).
 */
tenantRouter.get("/entities", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const callerVisibleIds = await resolveVisibleEntityIds(req, tenantId);
  if (callerVisibleIds.length === 0) return res.json([]);

  const viewAsEntityId = typeof req.query.viewAsEntityId === "string" ? req.query.viewAsEntityId : undefined;
  if (!viewAsEntityId) {
    const rows = await db.select().from(companyEntities).where(and(eq(companyEntities.tenantId, tenantId), inArray(companyEntities.id, callerVisibleIds)));
    return res.json(rows);
  }
  if (!callerVisibleIds.includes(viewAsEntityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });

  const visibleRows = await db.select({ id: entityClosure.descendantEntityId }).from(entityClosure).where(eq(entityClosure.ancestorEntityId, viewAsEntityId));
  const visibleIds = visibleRows.map((r) => r.id);
  if (visibleIds.length === 0) return res.json([]);
  const rows = await db.select().from(companyEntities).where(and(eq(companyEntities.tenantId, tenantId), inArray(companyEntities.id, visibleIds)));
  res.json(rows);
});

/** Same visibility rule as above, nested into a nested tree for the "lihat bertingkat" view. */
tenantRouter.get("/entities/tree", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const callerVisibleIds = await resolveVisibleEntityIds(req, tenantId);
  if (callerVisibleIds.length === 0) return res.json([]);
  const rows = await db.select().from(companyEntities).where(and(eq(companyEntities.tenantId, tenantId), inArray(companyEntities.id, callerVisibleIds)));
  res.json(buildEntityTree(rows));
});

tenantRouter.get("/entities/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [entity] = await db
    .select()
    .from(companyEntities)
    .where(and(eq(companyEntities.id, req.params.id), eq(companyEntities.tenantId, tenantId)))
    .limit(1);
  if (!entity) return res.status(404).json({ error: "Entitas tidak ditemukan" });
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIds.includes(entity.id)) return res.status(404).json({ error: "Entitas tidak ditemukan" });
  res.json(entity);
});

const updateEntitySchema = createEntitySchema.omit({ parentEntityId: true }).partial();

/** Reparenting is deliberately not supported here — moving a subtree would require rewriting its entire closure, left for a dedicated endpoint if ever needed. */
tenantRouter.put("/entities/:id", validateParams(uuidParam("id")), validateBody(updateEntitySchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const body = req.body as z.infer<typeof updateEntitySchema>;

  const [existing] = await db.select().from(companyEntities).where(and(eq(companyEntities.id, req.params.id), eq(companyEntities.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Entitas tidak ditemukan" });

  const updateValues: Record<string, unknown> = { ...body };
  delete updateValues.followParentNikPattern; // not a real column — resolved below

  // Re-resolve NIK format whenever the flag is flipped or the pattern is hand-edited — see resolveNikPattern.
  if (body.followParentNikPattern !== undefined || body.nikPattern !== undefined) {
    let parentNikPattern: string | null = null;
    if (existing.parentEntityId) {
      const [parent] = await db.select().from(companyEntities).where(eq(companyEntities.id, existing.parentEntityId)).limit(1);
      parentNikPattern = parent?.nikPattern ?? null;
    }
    const resolved = resolveNikPattern(!!existing.parentEntityId, body.followParentNikPattern ?? false, parentNikPattern, body.nikPattern ?? existing.nikPattern);
    updateValues.nikPattern = resolved.nikPattern;
    updateValues.nikPatternFollowsParent = resolved.nikPatternFollowsParent;
  }

  const [updated] = await db.update(companyEntities).set(updateValues).where(eq(companyEntities.id, existing.id)).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "entity.update", details: { entityId: updated.id } });
  res.json(updated);
});

/** Current structure snapshot (not historical) for one entity — divisions/departments/positions/org chart as they stand right now. */
tenantRouter.get("/entities/:id/org-structure", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const entityId = req.params.id;
  // This previously queried by entityId alone, with no tenantId filter at
  // all — any tenant_admin on any tenant could read any other tenant's
  // (and any sibling entity's) org structure just by guessing a UUID. Real
  // cross-tenant data leak, not just cross-entity (user, 2026-11-02 bug audit).
  const [entity] = await db.select().from(companyEntities).where(and(eq(companyEntities.id, entityId), eq(companyEntities.tenantId, tenantId))).limit(1);
  if (!entity) return res.status(404).json({ error: "Entitas tidak ditemukan" });
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIds.includes(entityId)) return res.status(404).json({ error: "Entitas tidak ditemukan" });
  const [divisions, departments, positions, orgNodes] = await Promise.all([
    db.select().from(companyDivisions).where(eq(companyDivisions.entityId, entityId)),
    db.select().from(companyDepartments).where(eq(companyDepartments.entityId, entityId)),
    db.select().from(masterJobPositions).where(eq(masterJobPositions.entityId, entityId)),
    db.select().from(orgStructureNodes).where(eq(orgStructureNodes.entityId, entityId)),
  ]);
  res.json({ divisions, departments, positions, orgNodes });
});

// ---------------------------------------------------------------------------
// Users — each tenant_admin manages only their OWN entity's roster. Viewing
// follows the same vertical rule as entities (self + descendants, never a
// sibling or ancestor); creating/removing is scoped to the caller's own
// entity only — adding staff to a descendant is that descendant's own
// admin's job (see entity provisioning rule above).
// ---------------------------------------------------------------------------

const PUBLIC_USER_COLUMNS = { id: users.id, tenantId: users.tenantId, entityId: users.entityId, role: users.role, name: users.name, email: users.email, createdAt: users.createdAt };

tenantRouter.get("/users", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [callerUser] = await db.select().from(users).where(eq(users.id, req.session!.userId)).limit(1);
  const callerEntityId = await resolveCallerEntityId(callerUser, tenantId);
  if (!callerEntityId) return res.json([]);

  const visibleRows = await db.select({ id: entityClosure.descendantEntityId }).from(entityClosure).where(eq(entityClosure.ancestorEntityId, callerEntityId));
  const visibleEntityIds = visibleRows.map((r) => r.id);
  if (visibleEntityIds.length === 0) return res.json([]);

  const rows = await db.select(PUBLIC_USER_COLUMNS).from(users).where(and(eq(users.tenantId, tenantId), inArray(users.entityId, visibleEntityIds)));
  res.json(rows);
});

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});

tenantRouter.post("/users", validateBody(createUserSchema), rejectBreachedPassword((req) => req.body.password), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const body = req.body as z.infer<typeof createUserSchema>;

  const [callerUser] = await db.select().from(users).where(eq(users.id, req.session!.userId)).limit(1);
  const callerEntityId = await resolveCallerEntityId(callerUser, tenantId);
  if (!callerEntityId) return res.status(403).json({ error: "Entitas Anda belum ditentukan" });

  const [existingEmail] = await db.select().from(users).where(and(eq(users.tenantId, tenantId), eq(users.email, body.email))).limit(1);
  if (existingEmail) return res.status(400).json({ error: "Email tersebut sudah digunakan di tenant ini." });

  const passwordHash = await bcrypt.hash(body.password, 10);
  const [created] = await db
    .insert(users)
    .values({ tenantId, entityId: callerEntityId, role: "tenant_admin", name: body.name, email: body.email, passwordHash })
    .returning(PUBLIC_USER_COLUMNS);

  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "user.create", details: { userId: created.id, entityId: callerEntityId } });
  res.status(201).json(created);
});

tenantRouter.delete("/users/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [callerUser] = await db.select().from(users).where(eq(users.id, req.session!.userId)).limit(1);
  const callerEntityId = await resolveCallerEntityId(callerUser, tenantId);

  const [existing] = await db.select().from(users).where(and(eq(users.id, req.params.id), eq(users.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "User tidak ditemukan" });
  if (existing.id === req.session!.userId) return res.status(400).json({ error: "Tidak bisa menghapus akun Anda sendiri" });
  if (existing.entityId !== callerEntityId) return res.status(403).json({ error: "Hanya admin entitas ini yang bisa menghapus user ini" });

  await db.delete(users).where(eq(users.id, existing.id));
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "user.delete", details: { userId: existing.id } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Direct CRUD for divisions/departments/positions/org-nodes — allowed ONLY
// while the entity is in baseline setup mode (isGovernanceLocked = false),
// mirroring the existing frontend concept. Once locked, the SAME kinds of
// edits must go through org_change_proposals above (officialLetterNumber
// required to approve) instead of this direct path — enforced here
// server-side, not just hidden in the UI.
// ---------------------------------------------------------------------------

type UnlockCheck = { ok: true; entity: typeof companyEntities.$inferSelect } | { ok: false; status: 404 | 403; error: string };

/**
 * Also verifies the entity is within the CALLER's visible scope (self +
 * descendants) — this was missing entirely before (user, 2026-11-02 bug
 * audit): any tenant_admin could create/edit a sibling entity's division/
 * department/position/org-node/grade just by passing its entityId, since
 * this only ever checked tenantId + governance lock, never who the caller
 * actually is.
 */
async function requireUnlockedEntity(entityId: string, tenantId: string, req: Request): Promise<UnlockCheck> {
  const [entity] = await db.select().from(companyEntities).where(and(eq(companyEntities.id, entityId), eq(companyEntities.tenantId, tenantId))).limit(1);
  if (!entity) return { ok: false, status: 404, error: "Entitas tidak ditemukan" };
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIds.includes(entityId)) return { ok: false, status: 403, error: "Entitas di luar ruang lingkup Anda" };
  if (entity.isGovernanceLocked) return { ok: false, status: 403, error: "Entitas ini sudah terkunci — ajukan perubahan lewat proposal restrukturisasi resmi" };
  return { ok: true, entity };
}

const divisionSchema = z.object({
  entityId: z.string().uuid(),
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(2).max(200),
  headTitle: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
});

/** Tenant-wide listing (every entity's divisions) — the frontend filters by entity client-side, same pattern as grades/office-locations below. */
tenantRouter.get("/divisions", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (visibleEntityIds.length === 0) return res.json([]);
  res.json(await db.select().from(companyDivisions).where(and(eq(companyDivisions.tenantId, tenantId), inArray(companyDivisions.entityId, visibleEntityIds))));
});

tenantRouter.post("/divisions", validateBody(divisionSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const check = await requireUnlockedEntity(req.body.entityId, tenantId, req);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [created] = await db.insert(companyDivisions).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "division.create", details: { divisionId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/divisions/:id", validateParams(uuidParam("id")), validateBody(divisionSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(companyDivisions).where(and(eq(companyDivisions.id, req.params.id), eq(companyDivisions.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Divisi tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId, req);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [updated] = await db.update(companyDivisions).set(req.body).where(eq(companyDivisions.id, existing.id)).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "division.update", details: { divisionId: updated.id } });
  res.json(updated);
});

tenantRouter.delete("/divisions/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(companyDivisions).where(and(eq(companyDivisions.id, req.params.id), eq(companyDivisions.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Divisi tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId, req);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  // Same reasoning as deleting a position/org-node — unlink karyawan/FPTK
  // still pointing at this division, don't block or cascade onto them.
  await db.update(employees).set({ divisionId: null }).where(eq(employees.divisionId, existing.id));
  await db.update(jobRequisitions).set({ divisionId: null }).where(eq(jobRequisitions.divisionId, existing.id));
  await db.delete(companyDivisions).where(eq(companyDivisions.id, existing.id));
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "division.delete", details: { divisionId: existing.id } });
  res.json({ ok: true });
});

const departmentSchema = z.object({
  entityId: z.string().uuid(),
  divisionId: z.string().uuid().optional().nullable(),
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(2).max(200),
  headTitle: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
});

tenantRouter.get("/departments", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (visibleEntityIds.length === 0) return res.json([]);
  res.json(await db.select().from(companyDepartments).where(and(eq(companyDepartments.tenantId, tenantId), inArray(companyDepartments.entityId, visibleEntityIds))));
});

tenantRouter.post("/departments", validateBody(departmentSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const check = await requireUnlockedEntity(req.body.entityId, tenantId, req);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [created] = await db.insert(companyDepartments).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "department.create", details: { departmentId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/departments/:id", validateParams(uuidParam("id")), validateBody(departmentSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(companyDepartments).where(and(eq(companyDepartments.id, req.params.id), eq(companyDepartments.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Departemen tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId, req);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [updated] = await db.update(companyDepartments).set(req.body).where(eq(companyDepartments.id, existing.id)).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "department.update", details: { departmentId: updated.id } });
  res.json(updated);
});

tenantRouter.delete("/departments/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(companyDepartments).where(and(eq(companyDepartments.id, req.params.id), eq(companyDepartments.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Departemen tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId, req);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  // Same reasoning as deleting a position/org-node — unlink karyawan/FPTK/
  // onboarding still pointing at this department, don't block/cascade.
  await db.update(employees).set({ departmentId: null }).where(eq(employees.departmentId, existing.id));
  await db.update(jobRequisitions).set({ departmentId: null }).where(eq(jobRequisitions.departmentId, existing.id));
  await db.update(onboardingProcesses).set({ departmentId: null }).where(eq(onboardingProcesses.departmentId, existing.id));
  await db.delete(companyDepartments).where(eq(companyDepartments.id, existing.id));
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "department.delete", details: { departmentId: existing.id } });
  res.json({ ok: true });
});

const positionSchema = z.object({
  entityId: z.string().uuid(),
  code: z.string().trim().min(1).max(50),
  title: z.string().trim().min(2).max(200),
  defaultLevel: z.number().int().min(1).max(5).optional().nullable(),
  divisionId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  jobFamily: z.string().trim().max(100).optional().nullable(),
  jobGrade: z.string().trim().max(50).optional().nullable(),
  minGrade: z.string().trim().max(50).optional().nullable(),
  maxGrade: z.string().trim().max(50).optional().nullable(),
  gradingScheme: z.enum(["single", "broadbanding"]).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
  requirements: z.string().trim().max(1000).optional().nullable(),
});

tenantRouter.get("/positions", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (visibleEntityIds.length === 0) return res.json([]);
  res.json(await db.select().from(masterJobPositions).where(and(eq(masterJobPositions.tenantId, tenantId), inArray(masterJobPositions.entityId, visibleEntityIds))));
});

tenantRouter.post("/positions", validateBody(positionSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const check = await requireUnlockedEntity(req.body.entityId, tenantId, req);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [created] = await db.insert(masterJobPositions).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "position.create", details: { positionId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/positions/:id", validateParams(uuidParam("id")), validateBody(positionSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(masterJobPositions).where(and(eq(masterJobPositions.id, req.params.id), eq(masterJobPositions.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Posisi tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId, req);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [updated] = await db.update(masterJobPositions).set(req.body).where(eq(masterJobPositions.id, existing.id)).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "position.update", details: { positionId: updated.id } });
  res.json(updated);
});

tenantRouter.delete("/positions/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(masterJobPositions).where(and(eq(masterJobPositions.id, req.params.id), eq(masterJobPositions.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Posisi tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId, req);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  // Deleting a position a karyawan is still assigned to must not fail or
  // silently drop the employee — unlink the reference (karyawan keeps
  // existing, just needs re-assigning to a position afterwards), not block
  // the delete or cascade onto the employee row.
  await db.update(employees).set({ positionId: null }).where(eq(employees.positionId, existing.id));
  await db.update(jobRequisitions).set({ positionId: null }).where(eq(jobRequisitions.positionId, existing.id));
  await db.delete(masterJobPositions).where(eq(masterJobPositions.id, existing.id));
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "position.delete", details: { positionId: existing.id } });
  res.json({ ok: true });
});

const orgNodeSchema = z.object({
  entityId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  divisionId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  code: z.string().trim().max(50).optional().nullable(),
  jobGrade: z.string().trim().max(50).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
  reportsToId: z.string().uuid().optional().nullable(),
  relationType: z.enum(["struktural", "administratif"]).optional(),
  isVacant: z.boolean().optional(),
  level: z.number().int().min(1).optional(),
  masterJobPositionId: z.string().uuid().optional().nullable(),
});

tenantRouter.get("/org-nodes", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (visibleEntityIds.length === 0) return res.json([]);
  res.json(await db.select().from(orgStructureNodes).where(and(eq(orgStructureNodes.tenantId, tenantId), inArray(orgStructureNodes.entityId, visibleEntityIds))));
});

tenantRouter.post("/org-nodes", validateBody(orgNodeSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const check = await requireUnlockedEntity(req.body.entityId, tenantId, req);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [created] = await db.insert(orgStructureNodes).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "org_node.create", details: { orgNodeId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/org-nodes/:id", validateParams(uuidParam("id")), validateBody(orgNodeSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(orgStructureNodes).where(and(eq(orgStructureNodes.id, req.params.id), eq(orgStructureNodes.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Posisi struktur tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId, req);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [updated] = await db.update(orgStructureNodes).set(req.body).where(eq(orgStructureNodes.id, existing.id)).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "org_node.update", details: { orgNodeId: updated.id } });
  res.json(updated);
});

tenantRouter.delete("/org-nodes/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(orgStructureNodes).where(and(eq(orgStructureNodes.id, req.params.id), eq(orgStructureNodes.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Posisi struktur tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId, req);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  // Same reasoning as deleting a position — unlink, don't block/cascade.
  await db.update(employees).set({ orgNodeId: null }).where(eq(employees.orgNodeId, existing.id));
  await db.delete(orgStructureNodes).where(eq(orgStructureNodes.id, existing.id));
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "org_node.delete", details: { orgNodeId: existing.id } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Grade & salary ranges — compensation reference data, not part of the
// organizational skeleton, so plain CRUD (not gated by the proposal
// workflow below).
// ---------------------------------------------------------------------------

const gradeSchema = z.object({
  entityId: z.string().uuid().optional().nullable(),
  gradeCode: z.string().trim().min(1).max(50),
  gradeName: z.string().trim().min(1).max(200),
  minSalary: z.number().int().min(0).optional().nullable(),
  midSalary: z.number().int().min(0).optional().nullable(),
  maxSalary: z.number().int().min(0).optional().nullable(),
  singleValueSalary: z.number().int().min(0).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

tenantRouter.post("/grades", validateBody(gradeSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  // entityId is optional (null = tenant-wide shared grade, open to any
  // entity's admin by design); when an entity-specific grade IS requested,
  // it must be within the caller's own visible scope.
  if (req.body.entityId) {
    const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
    if (!visibleEntityIds.includes(req.body.entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });
  }
  const [created] = await db.insert(gradeSalaryRanges).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "grade.create", details: { gradeId: created.id } });
  res.status(201).json(created);
});

/** Tenant-wide grades (entityId null) stay visible to everyone by design; entity-specific grades are scoped to the caller's visible entities. */
tenantRouter.get("/grades", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  const rows = await db.select().from(gradeSalaryRanges).where(eq(gradeSalaryRanges.tenantId, tenantId));
  res.json(rows.filter((r) => !r.entityId || visibleEntityIds.includes(r.entityId)));
});

tenantRouter.put("/grades/:id", validateParams(uuidParam("id")), validateBody(gradeSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(gradeSalaryRanges).where(and(eq(gradeSalaryRanges.id, req.params.id), eq(gradeSalaryRanges.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Grade tidak ditemukan" });
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (existing.entityId && !visibleEntityIds.includes(existing.entityId)) return res.status(404).json({ error: "Grade tidak ditemukan" });
  if (req.body.entityId && !visibleEntityIds.includes(req.body.entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });
  const [updated] = await db
    .update(gradeSalaryRanges)
    .set(req.body)
    .where(eq(gradeSalaryRanges.id, req.params.id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Grade tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "grade.update", details: { gradeId: updated.id } });
  res.json(updated);
});

tenantRouter.delete("/grades/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(gradeSalaryRanges).where(and(eq(gradeSalaryRanges.id, req.params.id), eq(gradeSalaryRanges.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Grade tidak ditemukan" });
  if (existing.entityId) {
    const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
    if (!visibleEntityIds.includes(existing.entityId)) return res.status(404).json({ error: "Grade tidak ditemukan" });
  }
  await db.delete(gradeSalaryRanges).where(eq(gradeSalaryRanges.id, existing.id));
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "grade.delete", details: { gradeId: existing.id } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Org change proposals — the ONLY way divisions/departments/positions/org
// nodes may change. Struktur (the skeleton) is distinct from personalia
// (who occupies it) — this workflow never touches employee assignment.
// Draft -> PendingApproval -> Approved (applies the diff + snapshots the
// prior state) or Rejected. Approval requires officialLetterNumber set
// ("surat resmi"), not just a click.
// ---------------------------------------------------------------------------

const changeSetSchema = z.object({
  create: z.array(z.record(z.string(), z.unknown())).optional(),
  update: z.array(z.object({ id: z.string().uuid(), data: z.record(z.string(), z.unknown()) })).optional(),
  delete: z.array(z.string().uuid()).optional(),
});

const changesSchema = z.object({
  divisions: changeSetSchema.optional(),
  departments: changeSetSchema.optional(),
  positions: changeSetSchema.optional(),
  orgNodes: changeSetSchema.optional(),
});

const createProposalSchema = z.object({
  entityId: z.string().uuid(),
  title: z.string().trim().min(2).max(300),
  description: z.string().trim().max(2000).optional(),
  officialLetterNumber: z.string().trim().max(200).optional(),
  changes: changesSchema,
});

tenantRouter.post("/org-change-proposals", validateBody(createProposalSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIds.includes(req.body.entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });
  const [created] = await db
    .insert(orgChangeProposals)
    .values({ ...req.body, tenantId, proposedByUserId: req.session!.userId, status: "Draft" })
    .returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "org_change_proposal.create", details: { proposalId: created.id, entityId: created.entityId } });
  res.status(201).json(created);
});

/** Riwayat perubahan struktur (history) — list, optionally filtered by entity, always scoped to the caller's visible entities. */
tenantRouter.get("/org-change-proposals", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (visibleEntityIds.length === 0) return res.json([]);
  const entityId = typeof req.query.entityId === "string" ? req.query.entityId : undefined;
  if (entityId && !visibleEntityIds.includes(entityId)) return res.json([]);
  const rows = await db
    .select()
    .from(orgChangeProposals)
    .where(and(eq(orgChangeProposals.tenantId, tenantId), inArray(orgChangeProposals.entityId, entityId ? [entityId] : visibleEntityIds)));
  res.json(rows);
});

tenantRouter.get("/org-change-proposals/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [proposal] = await db
    .select()
    .from(orgChangeProposals)
    .where(and(eq(orgChangeProposals.id, req.params.id), eq(orgChangeProposals.tenantId, tenantId)))
    .limit(1);
  if (!proposal) return res.status(404).json({ error: "Proposal tidak ditemukan" });
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIds.includes(proposal.entityId)) return res.status(404).json({ error: "Proposal tidak ditemukan" });
  res.json(proposal);
});

const updateProposalSchema = z.object({
  title: z.string().trim().min(2).max(300).optional(),
  description: z.string().trim().max(2000).optional(),
  officialLetterNumber: z.string().trim().max(200).optional(),
  changes: changesSchema.optional(),
});

tenantRouter.put("/org-change-proposals/:id", validateParams(uuidParam("id")), validateBody(updateProposalSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(orgChangeProposals).where(and(eq(orgChangeProposals.id, req.params.id), eq(orgChangeProposals.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Proposal tidak ditemukan" });
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIds.includes(existing.entityId)) return res.status(404).json({ error: "Proposal tidak ditemukan" });
  if (existing.status !== "Draft") return res.status(400).json({ error: "Hanya proposal berstatus Draft yang bisa diubah" });

  const [updated] = await db.update(orgChangeProposals).set(req.body).where(eq(orgChangeProposals.id, existing.id)).returning();
  res.json(updated);
});

tenantRouter.post("/org-change-proposals/:id/submit", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(orgChangeProposals).where(and(eq(orgChangeProposals.id, req.params.id), eq(orgChangeProposals.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Proposal tidak ditemukan" });
  const visibleEntityIdsSubmit = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIdsSubmit.includes(existing.entityId)) return res.status(404).json({ error: "Proposal tidak ditemukan" });
  if (existing.status !== "Draft") return res.status(400).json({ error: "Hanya proposal berstatus Draft yang bisa diajukan" });

  const [updated] = await db.update(orgChangeProposals).set({ status: "PendingApproval" }).where(eq(orgChangeProposals.id, existing.id)).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "org_change_proposal.submit", details: { proposalId: updated.id } });
  res.json(updated);
});

tenantRouter.post("/org-change-proposals/:id/approve", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [proposal] = await db.select().from(orgChangeProposals).where(and(eq(orgChangeProposals.id, req.params.id), eq(orgChangeProposals.tenantId, tenantId))).limit(1);
  if (!proposal) return res.status(404).json({ error: "Proposal tidak ditemukan" });
  const visibleEntityIdsApprove = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIdsApprove.includes(proposal.entityId)) return res.status(404).json({ error: "Proposal tidak ditemukan" });
  if (proposal.status !== "PendingApproval") return res.status(400).json({ error: "Hanya proposal berstatus PendingApproval yang bisa disetujui" });
  if (!proposal.officialLetterNumber) return res.status(400).json({ error: "Nomor surat resmi wajib diisi sebelum proposal disetujui" });

  const entityId = proposal.entityId;
  const [currentDivisions, currentDepartments, currentPositions, currentOrgNodes] = await Promise.all([
    db.select().from(companyDivisions).where(eq(companyDivisions.entityId, entityId)),
    db.select().from(companyDepartments).where(eq(companyDepartments.entityId, entityId)),
    db.select().from(masterJobPositions).where(eq(masterJobPositions.entityId, entityId)),
    db.select().from(orgStructureNodes).where(eq(orgStructureNodes.entityId, entityId)),
  ]);

  // Snapshot BEFORE applying — this is the "riwayat" an HR can roll back to reading.
  await db.insert(orgStructureSnapshots).values({
    tenantId,
    entityId,
    proposalId: proposal.id,
    divisions: currentDivisions,
    departments: currentDepartments,
    positions: currentPositions,
    orgNodes: currentOrgNodes,
  });

  const changes = proposal.changes as {
    divisions?: Parameters<typeof applyChangeSet>[1];
    departments?: Parameters<typeof applyChangeSet>[1];
    positions?: Parameters<typeof applyChangeSet>[1];
    orgNodes?: Parameters<typeof applyChangeSet>[1];
  };

  async function reconcile<T extends { id: string }>(
    table: typeof companyDivisions | typeof companyDepartments | typeof masterJobPositions | typeof orgStructureNodes,
    current: T[],
    changeSet: Parameters<typeof applyChangeSet>[1]
  ) {
    if (!changeSet) return;
    for (const id of changeSet.delete ?? []) await db.delete(table).where(eq(table.id, id));
    for (const u of changeSet.update ?? []) await db.update(table).set(u.data).where(eq(table.id, u.id));
    for (const c of changeSet.create ?? []) await db.insert(table).values({ ...c, tenantId, entityId } as never);
  }

  await reconcile(companyDivisions, currentDivisions, changes.divisions);
  await reconcile(companyDepartments, currentDepartments, changes.departments);
  await reconcile(masterJobPositions, currentPositions, changes.positions);
  await reconcile(orgStructureNodes, currentOrgNodes, changes.orgNodes);

  const [updated] = await db
    .update(orgChangeProposals)
    .set({ status: "Approved", approvedByUserId: req.session!.userId, approvedAt: new Date() })
    .where(eq(orgChangeProposals.id, proposal.id))
    .returning();

  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "org_change_proposal.approve", details: { proposalId: updated.id, entityId, officialLetterNumber: proposal.officialLetterNumber } });
  res.json(updated);
});

const rejectProposalSchema = z.object({ rejectionReason: z.string().trim().min(2).max(1000) });

tenantRouter.post("/org-change-proposals/:id/reject", validateParams(uuidParam("id")), validateBody(rejectProposalSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(orgChangeProposals).where(and(eq(orgChangeProposals.id, req.params.id), eq(orgChangeProposals.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Proposal tidak ditemukan" });
  const visibleEntityIdsReject = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIdsReject.includes(existing.entityId)) return res.status(404).json({ error: "Proposal tidak ditemukan" });
  if (existing.status !== "PendingApproval") return res.status(400).json({ error: "Hanya proposal berstatus PendingApproval yang bisa ditolak" });

  const [updated] = await db
    .update(orgChangeProposals)
    .set({ status: "Rejected", rejectionReason: req.body.rejectionReason })
    .where(eq(orgChangeProposals.id, existing.id))
    .returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "org_change_proposal.reject", details: { proposalId: updated.id } });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Org structure snapshots & "Ajukan Restrukturisasi" direct-edit flow — the
// lighter alternative to the proposal/approval workflow above. Unlocking a
// LOCKED entity this way always snapshots its current structure first (the
// "riwayat" browsable by effective date), then either leaves the live rows
// as the draft to keep editing (startMode "copy") or clears them to a blank
// slate (startMode "blank"). Reverting restores the latest snapshot and
// re-locks. Both run as one DB transaction so a failure partway never
// leaves the entity half-cleared or half-restored.
// ---------------------------------------------------------------------------

tenantRouter.get("/org-snapshots", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (visibleEntityIds.length === 0) return res.json([]);
  res.json(
    await db
      .select()
      .from(orgStructureSnapshots)
      .where(and(eq(orgStructureSnapshots.tenantId, tenantId), inArray(orgStructureSnapshots.entityId, visibleEntityIds)))
      .orderBy(desc(orgStructureSnapshots.takenAt))
  );
});

const createSnapshotSchema = z.object({
  entityId: z.string().uuid(),
  divisions: z.array(z.unknown()),
  departments: z.array(z.unknown()),
  positions: z.array(z.unknown()).optional(),
  orgNodes: z.array(z.unknown()),
  skDocNumber: z.string().trim().max(200).optional().nullable(),
  effectiveDate: z.string().trim().max(20).optional().nullable(),
  skDocFileName: z.string().trim().max(300).optional().nullable(),
  changeType: z.enum(["restrukturisasi", "modifikasi"]).optional().nullable(),
  reason: z.string().trim().max(2000).optional().nullable(),
});

/** Standalone snapshot insert — used by the full-modal "Perancang & Pengajuan Restrukturisasi" wizard (button #1) when it finishes replacing an entity's structure, as opposed to /org-restructure/start's own automatic snapshot (button #2). */
tenantRouter.post("/org-snapshots", validateBody(createSnapshotSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIds.includes(req.body.entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });
  const [created] = await db
    .insert(orgStructureSnapshots)
    .values({ ...req.body, positions: req.body.positions ?? [], tenantId, createdByUserId: req.session!.userId })
    .returning();
  res.status(201).json(created);
});

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Deletes an entity's org-nodes/positions/departments/divisions inside an
 * open transaction — nodes' reportsToId is cleared first since nodes
 * self-reference and a parallel/unordered delete can hit that FK. Karyawan/
 * FPTK/onboarding still pointing at any of these are unlinked (not
 * cascaded/blocked) before the delete, so they survive; returns each
 * employee's old links so a caller that's about to recreate equivalent rows
 * (the revert flow) can re-link them afterwards instead of leaving every
 * employee's assignment permanently blank.
 */
async function clearEntityStructureTx(tx: DbTx, entityId: string) {
  const nodes = await tx.select().from(orgStructureNodes).where(eq(orgStructureNodes.entityId, entityId));
  for (const n of nodes) {
    if (n.reportsToId) await tx.update(orgStructureNodes).set({ reportsToId: null }).where(eq(orgStructureNodes.id, n.id));
  }
  const employeeLinks = (await tx.select().from(employees).where(eq(employees.entityId, entityId))).map((e) => ({
    id: e.id,
    positionId: e.positionId,
    orgNodeId: e.orgNodeId,
    divisionId: e.divisionId,
    departmentId: e.departmentId,
  }));
  await tx.update(employees).set({ positionId: null, orgNodeId: null, divisionId: null, departmentId: null }).where(eq(employees.entityId, entityId));
  await tx.update(jobRequisitions).set({ positionId: null, divisionId: null, departmentId: null }).where(eq(jobRequisitions.entityId, entityId));
  await tx.update(onboardingProcesses).set({ departmentId: null }).where(eq(onboardingProcesses.entityId, entityId));
  await tx.delete(orgStructureNodes).where(eq(orgStructureNodes.entityId, entityId));
  await tx.delete(masterJobPositions).where(eq(masterJobPositions.entityId, entityId));
  await tx.delete(companyDepartments).where(eq(companyDepartments.entityId, entityId));
  await tx.delete(companyDivisions).where(eq(companyDivisions.entityId, entityId));
  return { employeeLinks };
}

const startRestructureSchema = z.object({
  entityId: z.string().uuid(),
  skDocNumber: z.string().trim().min(1).max(200),
  effectiveDate: z.string().trim().min(1).max(20),
  skDocFileName: z.string().trim().max(300).optional().nullable(),
  changeType: z.enum(["restrukturisasi", "modifikasi"]),
  reason: z.string().trim().min(1).max(2000),
  startMode: z.enum(["copy", "blank"]),
});

tenantRouter.post("/org-restructure/start", validateBody(startRestructureSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const { entityId, skDocNumber, effectiveDate, skDocFileName, changeType, reason, startMode } = req.body;

  const [entity] = await db.select().from(companyEntities).where(and(eq(companyEntities.id, entityId), eq(companyEntities.tenantId, tenantId))).limit(1);
  if (!entity) return res.status(404).json({ error: "Entitas tidak ditemukan" });
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIds.includes(entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });
  if (!entity.isGovernanceLocked) return res.status(400).json({ error: "Entitas ini belum terkunci — gunakan mode setup baseline, bukan pengajuan restrukturisasi" });

  const result = await db.transaction(async (tx) => {
    const [currentDivisions, currentDepartments, currentPositions, currentOrgNodes] = await Promise.all([
      tx.select().from(companyDivisions).where(eq(companyDivisions.entityId, entityId)),
      tx.select().from(companyDepartments).where(eq(companyDepartments.entityId, entityId)),
      tx.select().from(masterJobPositions).where(eq(masterJobPositions.entityId, entityId)),
      tx.select().from(orgStructureNodes).where(eq(orgStructureNodes.entityId, entityId)),
    ]);

    const [snapshot] = await tx
      .insert(orgStructureSnapshots)
      .values({
        tenantId,
        entityId,
        divisions: currentDivisions,
        departments: currentDepartments,
        positions: currentPositions,
        orgNodes: currentOrgNodes,
        skDocNumber,
        effectiveDate,
        skDocFileName: skDocFileName ?? null,
        changeType,
        reason,
        createdByUserId: req.session!.userId,
      })
      .returning();

    if (startMode === "blank") await clearEntityStructureTx(tx, entityId);

    const [updatedEntity] = await tx
      .update(companyEntities)
      .set({ isGovernanceLocked: false })
      .where(eq(companyEntities.id, entityId))
      .returning();

    return { snapshot, entity: updatedEntity };
  });

  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "org_restructure.start", details: { entityId, changeType, startMode, snapshotId: result.snapshot.id } });
  res.status(201).json(result);
});

const revertRestructureSchema = z.object({ entityId: z.string().uuid() });

tenantRouter.post("/org-restructure/revert", validateBody(revertRestructureSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const { entityId } = req.body;

  const [entity] = await db.select().from(companyEntities).where(and(eq(companyEntities.id, entityId), eq(companyEntities.tenantId, tenantId))).limit(1);
  if (!entity) return res.status(404).json({ error: "Entitas tidak ditemukan" });
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIds.includes(entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });
  if (entity.isGovernanceLocked) return res.status(400).json({ error: "Entitas ini sudah terkunci — tidak ada draft restrukturisasi untuk dibatalkan" });

  const [latestSnapshot] = await db
    .select()
    .from(orgStructureSnapshots)
    .where(and(eq(orgStructureSnapshots.tenantId, tenantId), eq(orgStructureSnapshots.entityId, entityId)))
    .orderBy(desc(orgStructureSnapshots.takenAt))
    .limit(1);
  if (!latestSnapshot) return res.status(400).json({ error: "Tidak ada riwayat struktur untuk dipulihkan" });

  const updatedEntity = await db.transaction(async (tx) => {
    const { employeeLinks } = await clearEntityStructureTx(tx, entityId);

    const divisionIdByOldId = new Map<string, string>();
    for (const d of latestSnapshot.divisions as Array<Record<string, unknown>>) {
      const [created] = await tx
        .insert(companyDivisions)
        .values({ tenantId, entityId, code: d.code as string, name: d.name as string, headTitle: (d.headTitle as string) ?? null, description: (d.description as string) ?? null })
        .returning();
      divisionIdByOldId.set(d.id as string, created.id);
    }

    const departmentIdByOldId = new Map<string, string>();
    for (const d of latestSnapshot.departments as Array<Record<string, unknown>>) {
      const [created] = await tx
        .insert(companyDepartments)
        .values({
          tenantId,
          entityId,
          divisionId: d.divisionId ? divisionIdByOldId.get(d.divisionId as string) ?? null : null,
          code: d.code as string,
          name: d.name as string,
          headTitle: (d.headTitle as string) ?? null,
          description: (d.description as string) ?? null,
        })
        .returning();
      departmentIdByOldId.set(d.id as string, created.id);
    }

    const positionIdByOldId = new Map<string, string>();
    for (const p of latestSnapshot.positions as Array<Record<string, unknown>>) {
      const [created] = await tx
        .insert(masterJobPositions)
        .values({
          tenantId,
          entityId,
          code: p.code as string,
          title: p.title as string,
          defaultLevel: p.defaultLevel as number,
          divisionId: p.divisionId ? divisionIdByOldId.get(p.divisionId as string) ?? null : null,
          departmentId: p.departmentId ? departmentIdByOldId.get(p.departmentId as string) ?? null : null,
          jobFamily: (p.jobFamily as string) ?? null,
          jobGrade: (p.jobGrade as string) ?? null,
          minGrade: (p.minGrade as string) ?? null,
          maxGrade: (p.maxGrade as string) ?? null,
          gradingScheme: (p.gradingScheme as "single" | "broadbanding") ?? "single",
          description: (p.description as string) ?? null,
          requirements: (p.requirements as string) ?? null,
        })
        .returning();
      positionIdByOldId.set(p.id as string, created.id);
    }

    const nodeIdByOldId = new Map<string, string>();
    const createdNodes: Array<{ id: string; oldReportsToId: string | null }> = [];
    for (const n of latestSnapshot.orgNodes as Array<Record<string, unknown>>) {
      const [created] = await tx
        .insert(orgStructureNodes)
        .values({
          tenantId,
          entityId,
          title: n.title as string,
          divisionId: n.divisionId ? divisionIdByOldId.get(n.divisionId as string) ?? null : null,
          departmentId: n.departmentId ? departmentIdByOldId.get(n.departmentId as string) ?? null : null,
          reportsToId: null, // relinked below, once every node has a real id
          code: (n.code as string) ?? null,
          jobGrade: (n.jobGrade as string) ?? null,
          description: (n.description as string) ?? null,
          relationType: (n.relationType as "struktural" | "administratif") ?? "struktural",
          isVacant: (n.isVacant as boolean) ?? true,
          level: n.level as number,
          masterJobPositionId: n.masterJobPositionId ? positionIdByOldId.get(n.masterJobPositionId as string) ?? null : null,
        })
        .returning();
      nodeIdByOldId.set(n.id as string, created.id);
      createdNodes.push({ id: created.id, oldReportsToId: (n.reportsToId as string) ?? null });
    }
    for (const n of createdNodes) {
      if (n.oldReportsToId && nodeIdByOldId.has(n.oldReportsToId)) {
        await tx.update(orgStructureNodes).set({ reportsToId: nodeIdByOldId.get(n.oldReportsToId) }).where(eq(orgStructureNodes.id, n.id));
      }
    }

    // Re-link every employee to the freshly-recreated row equivalent to the
    // one it pointed at before the revert (same old id -> new id maps as
    // above), so reverting really does restore the old state instead of
    // leaving every employee's assignment permanently blank.
    for (const link of employeeLinks) {
      if (!link.positionId && !link.orgNodeId && !link.divisionId && !link.departmentId) continue;
      await tx
        .update(employees)
        .set({
          positionId: link.positionId ? positionIdByOldId.get(link.positionId) ?? null : null,
          orgNodeId: link.orgNodeId ? nodeIdByOldId.get(link.orgNodeId) ?? null : null,
          divisionId: link.divisionId ? divisionIdByOldId.get(link.divisionId) ?? null : null,
          departmentId: link.departmentId ? departmentIdByOldId.get(link.departmentId) ?? null : null,
        })
        .where(eq(employees.id, link.id));
    }

    const [relocked] = await tx.update(companyEntities).set({ isGovernanceLocked: true }).where(eq(companyEntities.id, entityId)).returning();
    return relocked;
  });

  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "org_restructure.revert", details: { entityId, snapshotId: latestSnapshot.id } });
  res.json({ entity: updatedEntity, restoredFromSnapshotId: latestSnapshot.id });
});

// ---------------------------------------------------------------------------
// Office locations — used for GPS-radius attendance check-in, not part of
// the org-chart skeleton, so plain CRUD (no proposal/approval workflow).
// ---------------------------------------------------------------------------

const officeLocationSchema = z.object({
  entityId: z.string().uuid().optional(),
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(2).max(200),
  type: z.enum(["Kantor Pusat", "Kantor Cabang", "Gudang", "Workshop", "Site Operasional"]).optional(),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().int().min(10).max(5000).optional(),
  shapeType: z.enum(["circle", "polygon"]).optional(),
  polygonPoints: z.array(z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })).min(3).max(50).optional(),
  notes: z.string().trim().max(1000).optional(),
});

tenantRouter.post("/office-locations", validateBody(officeLocationSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  if (req.body.entityId) {
    const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
    if (!visibleEntityIds.includes(req.body.entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });
  }
  const [created] = await db.insert(officeLocations).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "office_location.create", details: { officeLocationId: created.id } });
  res.status(201).json(created);
});

/** Tenant-wide locations (entityId null) stay visible to everyone by design; entity-specific ones are scoped to the caller's visible entities. */
tenantRouter.get("/office-locations", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  const rows = await db.select().from(officeLocations).where(eq(officeLocations.tenantId, tenantId));
  res.json(rows.filter((r) => !r.entityId || visibleEntityIds.includes(r.entityId)));
});

const updateOfficeLocationSchema = officeLocationSchema.partial().extend({ isActive: z.boolean().optional() });

tenantRouter.put("/office-locations/:id", validateParams(uuidParam("id")), validateBody(updateOfficeLocationSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(officeLocations).where(and(eq(officeLocations.id, req.params.id), eq(officeLocations.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Lokasi kantor tidak ditemukan" });
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (existing.entityId && !visibleEntityIds.includes(existing.entityId)) return res.status(404).json({ error: "Lokasi kantor tidak ditemukan" });
  if (req.body.entityId && !visibleEntityIds.includes(req.body.entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });
  const [updated] = await db
    .update(officeLocations)
    .set(req.body)
    .where(eq(officeLocations.id, req.params.id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Lokasi kantor tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "office_location.update", details: { officeLocationId: updated.id } });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Master data: Tingkat/Strata Pendidikan & Jurusan/Bidang Studi — tenant-wide
// reference data, not a hardcoded frontend list (user, 2026-11-02).
// ---------------------------------------------------------------------------

tenantRouter.get("/education-levels", async (req, res) => {
  res.json(await db.select().from(educationLevels).where(eq(educationLevels.tenantId, req.session!.tenantId!)).orderBy(educationLevels.sortOrder));
});

const educationLevelSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

tenantRouter.post("/education-levels", validateBody(educationLevelSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(educationLevels).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/education-levels/:id", validateParams(uuidParam("id")), validateBody(educationLevelSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(educationLevels)
    .set(req.body)
    .where(and(eq(educationLevels.id, req.params.id), eq(educationLevels.tenantId, tenantId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Tingkat pendidikan tidak ditemukan" });
  res.json(updated);
});

tenantRouter.delete("/education-levels/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [deleted] = await db.delete(educationLevels).where(and(eq(educationLevels.id, req.params.id), eq(educationLevels.tenantId, tenantId))).returning();
  if (!deleted) return res.status(404).json({ error: "Tingkat pendidikan tidak ditemukan" });
  res.json({ ok: true });
});

tenantRouter.get("/fields-of-study", async (req, res) => {
  res.json(await db.select().from(fieldsOfStudy).where(eq(fieldsOfStudy.tenantId, req.session!.tenantId!)));
});

const fieldOfStudySchema = z.object({
  name: z.string().trim().min(1).max(150),
  category: z.string().trim().max(100).optional(),
  isActive: z.boolean().optional(),
});

tenantRouter.post("/fields-of-study", validateBody(fieldOfStudySchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(fieldsOfStudy).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/fields-of-study/:id", validateParams(uuidParam("id")), validateBody(fieldOfStudySchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(fieldsOfStudy)
    .set(req.body)
    .where(and(eq(fieldsOfStudy.id, req.params.id), eq(fieldsOfStudy.tenantId, tenantId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Jurusan/bidang studi tidak ditemukan" });
  res.json(updated);
});

tenantRouter.delete("/fields-of-study/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [deleted] = await db.delete(fieldsOfStudy).where(and(eq(fieldsOfStudy.id, req.params.id), eq(fieldsOfStudy.tenantId, tenantId))).returning();
  if (!deleted) return res.status(404).json({ error: "Jurusan/bidang studi tidak ditemukan" });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Employees — real headcount, vertically scoped like /users (self +
// descendant entities only, never tenant-wide).
// ---------------------------------------------------------------------------

tenantRouter.get("/employees", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [callerUser] = await db.select().from(users).where(eq(users.id, req.session!.userId)).limit(1);
  const callerEntityId = await resolveCallerEntityId(callerUser, tenantId);
  if (!callerEntityId) return res.json([]);
  const visibleRows = await db.select({ id: entityClosure.descendantEntityId }).from(entityClosure).where(eq(entityClosure.ancestorEntityId, callerEntityId));
  const visibleEntityIds = visibleRows.map((r) => r.id);
  if (visibleEntityIds.length === 0) return res.json([]);
  res.json(await db.select().from(employees).where(and(eq(employees.tenantId, tenantId), inArray(employees.entityId, visibleEntityIds))));
});

/** Only employees whose status is NOT "Aktif" — the FPTK "Nama Karyawan Sebelumnya (Jika Penggantian)" dropdown (user, 2026-11-02). */
tenantRouter.get("/employees/inactive", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [callerUser] = await db.select().from(users).where(eq(users.id, req.session!.userId)).limit(1);
  const callerEntityId = await resolveCallerEntityId(callerUser, tenantId);
  if (!callerEntityId) return res.json([]);
  const visibleRows = await db.select({ id: entityClosure.descendantEntityId }).from(entityClosure).where(eq(entityClosure.ancestorEntityId, callerEntityId));
  const visibleEntityIds = visibleRows.map((r) => r.id);
  if (visibleEntityIds.length === 0) return res.json([]);
  const rows = await db.select().from(employees).where(and(eq(employees.tenantId, tenantId), inArray(employees.entityId, visibleEntityIds)));
  res.json(rows.filter((e) => e.status !== "Aktif"));
});

/**
 * The full employee record (src/types/hrms.ts Employee, ~90 fields). Only
 * the columns this route/other modules actually query or join on are
 * first-class (see schema.ts); every other field (identity docs, BPJS,
 * bank, allowances, education, family, emergency contacts, ...) rides in
 * `details`, same pattern as candidates/jobVacancies/onboardingProcesses.
 */
// Every .optional() field below maps to a nullable DB column — also
// .nullable(), not just .optional(): mergeRowIntoMock() (HrmsContext.tsx)
// round-trips a real DB row's `null`s straight back into the mock
// Employee object's fields, and buildEmployeeApiPayload sends them as
// explicit `null`, not `undefined`, on the next save. .optional() alone
// accepts a MISSING key but rejects an explicit `null` value, so any
// employee with an empty avatar/candidateId/etc. 400'd on every edit
// through this screen — found live while verifying an unrelated change
// (user, 2026-11-09), confirmed as pre-existing by reproducing it against
// the office-location-assignment checkboxes too, which this commit never
// touched.
const employeeSchema = z.object({
  entityId: z.string().uuid(),
  nik: z.string().trim().min(1).max(50),
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  avatar: z.string().trim().max(2000).optional().nullable(),
  employmentType: z.string().trim().max(50).optional().nullable(),
  positionId: z.string().uuid().optional().nullable(),
  divisionId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  orgNodeId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  candidateId: z.string().uuid().optional().nullable(),
  status: z.string().trim().max(50).optional().nullable(),
  basicSalary: z.number().int().min(0).optional().nullable(),
  joinDate: zDateTime().optional().nullable(),
  resignDate: zDateTime().optional().nullable(),
  resignReason: z.string().trim().max(500).optional().nullable(),
  details: z.record(z.string(), z.unknown()).optional(),
});

tenantRouter.post("/employees", validateBody(employeeSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIds.includes(req.body.entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });
  const [created] = await db.insert(employees).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "employee.create", details: { employeeId: created.id } });
  res.status(201).json(created);
});

const geoCheckBodySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

tenantRouter.put("/employees/:id", validateParams(uuidParam("id")), validateBody(employeeSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  const [existing] = await db.select().from(employees).where(and(eq(employees.id, req.params.id), eq(employees.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEntityIds.includes(existing.entityId)) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  if (req.body.entityId && !visibleEntityIds.includes(req.body.entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });
  const [updated] = await db
    .update(employees)
    .set(req.body)
    .where(eq(employees.id, req.params.id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "employee.update", details: { employeeId: updated.id } });
  res.json(updated);
});

tenantRouter.delete("/employees/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  const [existing] = await db.select().from(employees).where(and(eq(employees.id, req.params.id), eq(employees.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEntityIds.includes(existing.entityId)) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  const [deleted] = await db.delete(employees).where(eq(employees.id, req.params.id)).returning();
  if (!deleted) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "employee.delete", details: { employeeId: deleted.id } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Admin-context Clock-In/Out — EssPortal.tsx's "view as employee"
// simulation still runs under the tenant_admin's own session (user,
// 2026-11-09 ESS redesign scope: the real employee-session app from the
// RBAC phase is a separate, minimal surface most users haven't switched
// to yet), so it needs its OWN route into the exact same rules a real
// employee session gets — an explicit :employeeId, checked against this
// admin's visibility scope, instead of session.employeeId. All the actual
// logic lives in lib/attendanceClock.ts so both callers can never drift
// apart on what counts as "inside radius" or "within the time window".
// ---------------------------------------------------------------------------

tenantRouter.post("/employees/:id/attendance/clock-in/check", validateParams(uuidParam("id")), validateBody(geoCheckBodySchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.params.id)) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  try {
    res.json(await checkClockIn(tenantId, req.params.id, req.body.lat, req.body.lng));
  } catch (err) {
    if (err instanceof ClockError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

tenantRouter.post("/employees/:id/attendance/clock-out/check", validateParams(uuidParam("id")), validateBody(geoCheckBodySchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.params.id)) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  res.json(await checkClockOut(tenantId, req.params.id, req.body.lat, req.body.lng));
});

const adminClockInBodySchema = geoCheckBodySchema.extend({ workType: z.enum(["WFO", "WFA", "Perjalanan Dinas"]) });

tenantRouter.post("/employees/:id/attendance/clock-in", validateParams(uuidParam("id")), validateBody(adminClockInBodySchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.params.id)) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  try {
    const result = await performClockIn(tenantId, req.params.id, req.body.lat, req.body.lng, req.body.workType);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof ClockError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

tenantRouter.post("/employees/:id/attendance/clock-out", validateParams(uuidParam("id")), validateBody(geoCheckBodySchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.params.id)) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  try {
    res.json(await performClockOut(tenantId, req.params.id, req.body.lat, req.body.lng));
  } catch (err) {
    if (err instanceof ClockError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

// ---------------------------------------------------------------------------
// Document signatory config — per document type, read by every
// document-generating flow (FPTK first) instead of each form hardcoding its
// own signatory list (user, 2026-11-02; project_signatory_config_via_document_management).
// ---------------------------------------------------------------------------

tenantRouter.get("/document-signatory-configs", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const documentType = typeof req.query.documentType === "string" ? req.query.documentType : undefined;
  const conditions = documentType ? and(eq(documentSignatoryConfigs.tenantId, tenantId), eq(documentSignatoryConfigs.documentType, documentType)) : eq(documentSignatoryConfigs.tenantId, tenantId);
  res.json(await db.select().from(documentSignatoryConfigs).where(conditions).orderBy(documentSignatoryConfigs.sortOrder));
});

const signatoryConfigSchema = z.object({
  documentType: z.string().trim().min(1).max(100),
  roleLabel: z.string().trim().min(1).max(200),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

tenantRouter.post("/document-signatory-configs", validateBody(signatoryConfigSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(documentSignatoryConfigs).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/document-signatory-configs/:id", validateParams(uuidParam("id")), validateBody(signatoryConfigSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(documentSignatoryConfigs)
    .set(req.body)
    .where(and(eq(documentSignatoryConfigs.id, req.params.id), eq(documentSignatoryConfigs.tenantId, tenantId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Konfigurasi penandatangan tidak ditemukan" });
  res.json(updated);
});

tenantRouter.delete("/document-signatory-configs/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [deleted] = await db.delete(documentSignatoryConfigs).where(and(eq(documentSignatoryConfigs.id, req.params.id), eq(documentSignatoryConfigs.tenantId, tenantId))).returning();
  if (!deleted) return res.status(404).json({ error: "Konfigurasi penandatangan tidak ditemukan" });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Job Requisitions (FPTK) — real backend, replacing the mock-only form in
// RecruitmentManagement.tsx (user, 2026-11-02).
// ---------------------------------------------------------------------------

tenantRouter.get("/job-requisitions", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [callerUser] = await db.select().from(users).where(eq(users.id, req.session!.userId)).limit(1);
  const callerEntityId = await resolveCallerEntityId(callerUser, tenantId);
  if (!callerEntityId) return res.json([]);
  const visibleRows = await db.select({ id: entityClosure.descendantEntityId }).from(entityClosure).where(eq(entityClosure.ancestorEntityId, callerEntityId));
  const visibleEntityIds = visibleRows.map((r) => r.id);
  if (visibleEntityIds.length === 0) return res.json([]);
  res.json(await db.select().from(jobRequisitions).where(and(eq(jobRequisitions.tenantId, tenantId), inArray(jobRequisitions.entityId, visibleEntityIds))));
});

const jobRequisitionSchema = z.object({
  entityId: z.string().uuid(),
  officeLocationId: z.string().uuid().optional(),
  divisionId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  requisitionType: z.enum(["Baru", "Penggantian"]).optional(),
  replacementEmployeeId: z.string().uuid().optional(),
  headcount: z.number().int().min(1).optional(),
  educationLevelId: z.string().uuid().optional(),
  fieldsOfStudyIds: z.array(z.string().uuid()).optional(),
  minExperienceYears: z.number().int().min(0).optional(),
  knockoutCriteria: z.array(z.unknown()).optional(),
  scoredCriteria: z.array(z.unknown()).optional(),
  signatories: z.array(z.unknown()).optional(),
  status: z.enum(["Draft", "Menunggu Approval", "Disetujui", "Ditolak", "Dibatalkan", "Dicabut (Retracted)"]).optional(),
  // Descriptive/free-text fields the frontend's rich FPTK form captures
  // (reqNumber, position title, grade labels, justification, reporting
  // line, skills, requester/approver names, retraction info, ...) — see
  // server/db/schema.ts jobRequisitions.details.
  details: z.record(z.string(), z.unknown()).optional(),
});

tenantRouter.post("/job-requisitions", validateBody(jobRequisitionSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const userId = req.session!.userId;

  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIds.includes(req.body.entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });

  // "Nama Karyawan Sebelumnya (Jika Penggantian)" must be someone who has
  // actually left — never an Aktif employee (user, 2026-11-02).
  if (req.body.requisitionType === "Penggantian" && req.body.replacementEmployeeId) {
    const [replacement] = await db.select().from(employees).where(eq(employees.id, req.body.replacementEmployeeId)).limit(1);
    if (!replacement || replacement.tenantId !== tenantId) return res.status(404).json({ error: "Karyawan pengganti tidak ditemukan" });
    if (replacement.status === "Aktif") {
      return res.status(400).json({ error: "Karyawan yang dipilih sebagai 'Nama Karyawan Sebelumnya' masih berstatus Aktif" });
    }
  }

  const [created] = await db.insert(jobRequisitions).values({ ...req.body, tenantId, requestedByUserId: userId }).returning();
  await logAudit({ actorUserId: userId, tenantId, action: "job_requisition.create", details: { jobRequisitionId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/job-requisitions/:id", validateParams(uuidParam("id")), validateBody(jobRequisitionSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  const [existing] = await db.select().from(jobRequisitions).where(and(eq(jobRequisitions.id, req.params.id), eq(jobRequisitions.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEntityIds.includes(existing.entityId)) return res.status(404).json({ error: "FPTK tidak ditemukan" });
  if (req.body.entityId && !visibleEntityIds.includes(req.body.entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });

  const [updated] = await db
    .update(jobRequisitions)
    .set(req.body)
    .where(eq(jobRequisitions.id, req.params.id))
    .returning();
  if (!updated) return res.status(404).json({ error: "FPTK tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "job_requisition.update", details: { jobRequisitionId: updated.id } });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Job Vacancies — real backend, vertically scoped like employees/job-requisitions.
// ---------------------------------------------------------------------------

tenantRouter.get("/job-vacancies", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [callerUser] = await db.select().from(users).where(eq(users.id, req.session!.userId)).limit(1);
  const callerEntityId = await resolveCallerEntityId(callerUser, tenantId);
  if (!callerEntityId) return res.json([]);
  const visibleRows = await db.select({ id: entityClosure.descendantEntityId }).from(entityClosure).where(eq(entityClosure.ancestorEntityId, callerEntityId));
  const visibleEntityIds = visibleRows.map((r) => r.id);
  if (visibleEntityIds.length === 0) return res.json([]);
  res.json(await db.select().from(jobVacancies).where(and(eq(jobVacancies.tenantId, tenantId), inArray(jobVacancies.entityId, visibleEntityIds))));
});

const jobVacancySchema = z.object({
  entityId: z.string().uuid(),
  jobRequisitionId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  openings: z.number().int().min(1).optional(),
  status: z.enum(["Buka", "Ditutup"]).optional(),
  targetCloseDate: zDateTime().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

tenantRouter.post("/job-vacancies", validateBody(jobVacancySchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIds.includes(req.body.entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });
  const [created] = await db.insert(jobVacancies).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "job_vacancy.create", details: { jobVacancyId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/job-vacancies/:id", validateParams(uuidParam("id")), validateBody(jobVacancySchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  const [existing] = await db.select().from(jobVacancies).where(and(eq(jobVacancies.id, req.params.id), eq(jobVacancies.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEntityIds.includes(existing.entityId)) return res.status(404).json({ error: "Lowongan tidak ditemukan" });
  if (req.body.entityId && !visibleEntityIds.includes(req.body.entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });
  const [updated] = await db
    .update(jobVacancies)
    .set(req.body)
    .where(eq(jobVacancies.id, req.params.id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Lowongan tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "job_vacancy.update", details: { jobVacancyId: updated.id } });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Candidates — scoped via their vacancy's entity (no direct entityId column).
// ---------------------------------------------------------------------------

tenantRouter.get("/candidates", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [callerUser] = await db.select().from(users).where(eq(users.id, req.session!.userId)).limit(1);
  const callerEntityId = await resolveCallerEntityId(callerUser, tenantId);
  if (!callerEntityId) return res.json([]);
  const visibleRows = await db.select({ id: entityClosure.descendantEntityId }).from(entityClosure).where(eq(entityClosure.ancestorEntityId, callerEntityId));
  const visibleEntityIds = visibleRows.map((r) => r.id);
  if (visibleEntityIds.length === 0) return res.json([]);
  const visibleVacancyIds = (await db.select({ id: jobVacancies.id }).from(jobVacancies).where(and(eq(jobVacancies.tenantId, tenantId), inArray(jobVacancies.entityId, visibleEntityIds)))).map((v) => v.id);
  if (visibleVacancyIds.length === 0) return res.json([]);
  res.json(await db.select().from(candidates).where(and(eq(candidates.tenantId, tenantId), inArray(candidates.jobVacancyId, visibleVacancyIds))));
});

const candidateSchema = z.object({
  jobVacancyId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  phone: z.string().trim().max(50).optional(),
  stage: z.string().trim().min(1).max(100).optional(),
  aiMatchScore: z.number().int().min(0).max(100).optional(),
  testScore: z.number().int().min(0).max(100).optional(),
  interviewScore: z.number().int().min(0).max(100).optional(),
  offeredSalary: z.number().int().min(0).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

tenantRouter.post("/candidates", validateBody(candidateSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  const [vacancy] = await db.select().from(jobVacancies).where(and(eq(jobVacancies.id, req.body.jobVacancyId), eq(jobVacancies.tenantId, tenantId))).limit(1);
  if (!vacancy || !visibleEntityIds.includes(vacancy.entityId)) return res.status(404).json({ error: "Lowongan tidak ditemukan" });
  const [created] = await db.insert(candidates).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "candidate.create", details: { candidateId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/candidates/:id", validateParams(uuidParam("id")), validateBody(candidateSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  const [existing] = await db
    .select({ id: candidates.id, entityId: jobVacancies.entityId })
    .from(candidates)
    .innerJoin(jobVacancies, eq(jobVacancies.id, candidates.jobVacancyId))
    .where(and(eq(candidates.id, req.params.id), eq(candidates.tenantId, tenantId)))
    .limit(1);
  if (!existing || !visibleEntityIds.includes(existing.entityId)) return res.status(404).json({ error: "Kandidat tidak ditemukan" });
  const [updated] = await db
    .update(candidates)
    .set(req.body)
    .where(eq(candidates.id, req.params.id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Kandidat tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "candidate.update", details: { candidateId: updated.id } });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Onboarding Processes — real backend.
// ---------------------------------------------------------------------------

tenantRouter.get("/onboarding-processes", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [callerUser] = await db.select().from(users).where(eq(users.id, req.session!.userId)).limit(1);
  const callerEntityId = await resolveCallerEntityId(callerUser, tenantId);
  if (!callerEntityId) return res.json([]);
  const visibleRows = await db.select({ id: entityClosure.descendantEntityId }).from(entityClosure).where(eq(entityClosure.ancestorEntityId, callerEntityId));
  const visibleEntityIds = visibleRows.map((r) => r.id);
  if (visibleEntityIds.length === 0) return res.json([]);
  res.json(await db.select().from(onboardingProcesses).where(and(eq(onboardingProcesses.tenantId, tenantId), inArray(onboardingProcesses.entityId, visibleEntityIds))));
});

const onboardingProcessSchema = z.object({
  entityId: z.string().uuid(),
  type: z.enum(["via_recruitment", "direct"]).optional(),
  candidateId: z.string().uuid().optional(),
  employeeName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().max(50).optional(),
  position: z.string().trim().max(200).optional(),
  departmentId: z.string().uuid().optional(),
  joinDate: zDateTime().optional(),
  basicSalary: z.number().int().min(0).optional(),
  contractDocNumber: z.string().trim().max(100).optional(),
  status: z.enum(["In Progress", "Completed", "Cancelled"]).optional(),
  createdEmployeeId: z.string().uuid().optional(),
  tasks: z.array(z.unknown()).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

tenantRouter.post("/onboarding-processes", validateBody(onboardingProcessSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (!visibleEntityIds.includes(req.body.entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });
  const [created] = await db.insert(onboardingProcesses).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "onboarding_process.create", details: { onboardingProcessId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/onboarding-processes/:id", validateParams(uuidParam("id")), validateBody(onboardingProcessSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  const [existing] = await db.select().from(onboardingProcesses).where(and(eq(onboardingProcesses.id, req.params.id), eq(onboardingProcesses.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEntityIds.includes(existing.entityId)) return res.status(404).json({ error: "Proses onboarding tidak ditemukan" });
  if (req.body.entityId && !visibleEntityIds.includes(req.body.entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });
  const [updated] = await db
    .update(onboardingProcesses)
    .set(req.body)
    .where(eq(onboardingProcesses.id, req.params.id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Proses onboarding tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "onboarding_process.update", details: { onboardingProcessId: updated.id } });
  res.json(updated);
});

tenantRouter.delete("/onboarding-processes/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  const [existing] = await db.select().from(onboardingProcesses).where(and(eq(onboardingProcesses.id, req.params.id), eq(onboardingProcesses.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEntityIds.includes(existing.entityId)) return res.status(404).json({ error: "Proses onboarding tidak ditemukan" });
  const [deleted] = await db.delete(onboardingProcesses).where(eq(onboardingProcesses.id, req.params.id)).returning();
  if (!deleted) return res.status(404).json({ error: "Proses onboarding tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "onboarding_process.delete", details: { onboardingProcessId: deleted.id } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Competency Test Type Settings & Interview Type Settings — tenant-wide
// master config for the assessment/interview pipeline (not entity-scoped,
// same pattern as education-levels/fields-of-study).
// ---------------------------------------------------------------------------

tenantRouter.get("/competency-test-types", async (req, res) => {
  res.json(await db.select().from(competencyTestTypeSettings).where(eq(competencyTestTypeSettings.tenantId, req.session!.tenantId!)));
});

const competencyTestTypeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.enum(["Hard Skill", "Soft Skill", "Kognitif & Logika", "Bahasa", "Studi Kasus", "Praktik Kerja"]),
  passingGrade: z.number().int().min(0).max(100).optional(),
  durationMinutes: z.number().int().min(1).optional(),
  method: z.enum(["Online Test", "Live Coding", "Presentasi", "Tatap Muka", "Studi Kasus Mandiri"]),
  description: z.string().trim().max(1000).optional(),
  weightPercent: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

tenantRouter.post("/competency-test-types", validateBody(competencyTestTypeSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(competencyTestTypeSettings).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/competency-test-types/:id", validateParams(uuidParam("id")), validateBody(competencyTestTypeSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(competencyTestTypeSettings)
    .set(req.body)
    .where(and(eq(competencyTestTypeSettings.id, req.params.id), eq(competencyTestTypeSettings.tenantId, tenantId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Jenis tes kompetensi tidak ditemukan" });
  res.json(updated);
});

tenantRouter.delete("/competency-test-types/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [deleted] = await db.delete(competencyTestTypeSettings).where(and(eq(competencyTestTypeSettings.id, req.params.id), eq(competencyTestTypeSettings.tenantId, tenantId))).returning();
  if (!deleted) return res.status(404).json({ error: "Jenis tes kompetensi tidak ditemukan" });
  res.json({ ok: true });
});

tenantRouter.get("/interview-types", async (req, res) => {
  res.json(await db.select().from(interviewTypeSettings).where(eq(interviewTypeSettings.tenantId, req.session!.tenantId!)));
});

const interviewTypeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  targetRole: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  interviewerRoles: z.string().trim().max(500).optional(),
  criteria: z.array(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

tenantRouter.post("/interview-types", validateBody(interviewTypeSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(interviewTypeSettings).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/interview-types/:id", validateParams(uuidParam("id")), validateBody(interviewTypeSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(interviewTypeSettings)
    .set(req.body)
    .where(and(eq(interviewTypeSettings.id, req.params.id), eq(interviewTypeSettings.tenantId, tenantId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Jenis interview tidak ditemukan" });
  res.json(updated);
});

tenantRouter.delete("/interview-types/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [deleted] = await db.delete(interviewTypeSettings).where(and(eq(interviewTypeSettings.id, req.params.id), eq(interviewTypeSettings.tenantId, tenantId))).returning();
  if (!deleted) return res.status(404).json({ error: "Jenis interview tidak ditemukan" });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Onboarding checklist templates — tenant-wide, copied onto every new onboarding process's tasks.
// ---------------------------------------------------------------------------

tenantRouter.get("/onboarding-checklist-templates", async (req, res) => {
  res.json(await db.select().from(onboardingChecklistTemplates).where(eq(onboardingChecklistTemplates.tenantId, req.session!.tenantId!)));
});

const onboardingChecklistTemplateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  targetDepartment: z.string().trim().min(1).max(50),
  verificationType: z.string().trim().min(1).max(50),
  actionType: z.string().trim().max(50).optional(),
  isMandatory: z.boolean().optional(),
  description: z.string().trim().max(1000).optional(),
  subItems: z.array(z.string()).optional(),
});

tenantRouter.post("/onboarding-checklist-templates", validateBody(onboardingChecklistTemplateSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(onboardingChecklistTemplates).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/onboarding-checklist-templates/:id", validateParams(uuidParam("id")), validateBody(onboardingChecklistTemplateSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(onboardingChecklistTemplates)
    .set(req.body)
    .where(and(eq(onboardingChecklistTemplates.id, req.params.id), eq(onboardingChecklistTemplates.tenantId, tenantId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Template checklist tidak ditemukan" });
  res.json(updated);
});

tenantRouter.delete("/onboarding-checklist-templates/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [deleted] = await db.delete(onboardingChecklistTemplates).where(and(eq(onboardingChecklistTemplates.id, req.params.id), eq(onboardingChecklistTemplates.tenantId, tenantId))).returning();
  if (!deleted) return res.status(404).json({ error: "Template checklist tidak ditemukan" });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Probation Evaluations & Contract Renewal Reviews — Manajemen Karyawan sub-menus.
// ---------------------------------------------------------------------------

/**
 * Resolves the set of employee ids visible to the caller (self + descendant
 * entities), same vertical-scoping rule as everywhere else. Returns null
 * when the caller has no resolvable entity (caller should then return []).
 */
async function resolveVisibleEmployeeIds(req: Request, tenantId: string): Promise<string[]> {
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  if (visibleEntityIds.length === 0) return [];
  const visibleEmployees = await db.select({ id: employees.id }).from(employees).where(and(eq(employees.tenantId, tenantId), inArray(employees.entityId, visibleEntityIds)));
  return visibleEmployees.map((e) => e.id);
}

/**
 * Probation/contract review rows reference an employee but carry no
 * entityId column of their own — visibility must go through the
 * employee's own entity scope (same vertical rule as employees itself),
 * never tenant-wide. Missing this was a real cross-sibling-entity leak:
 * one entity's admin could see and create records against another
 * sibling entity's employees.
 */
// ---------------------------------------------------------------------------
// Probation Evaluation Templates — custom categories/questions with a
// validity window (user, 2026-11-09). Append-only by design: no PUT/DELETE,
// a tenant just keeps creating new versions ("bisa di tambah terus"), so
// past evaluations stay tied to the exact template they were filled out
// against even once a newer one becomes current.
// ---------------------------------------------------------------------------

tenantRouter.get("/probation-evaluation-templates", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const rows = await db.select().from(probationEvaluationTemplates).where(eq(probationEvaluationTemplates.tenantId, tenantId));
  res.json(rows);
});

const probationEvaluationTemplateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  categories: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(100),
        label: z.string().trim().min(1).max(300),
        questions: z.array(z.object({ id: z.string().trim().min(1).max(100), text: z.string().trim().min(1).max(1000) })).min(1).max(100).optional(),
      })
    )
    .min(1)
    .max(30),
  divisionId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  positionId: z.string().uuid().optional().nullable(),
  validFrom: z.string().trim().min(1).max(20),
  validUntil: z.string().trim().max(20).optional(),
  isActive: z.boolean().optional(),
});

tenantRouter.post("/probation-evaluation-templates", validateBody(probationEvaluationTemplateSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(probationEvaluationTemplates).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "probation_evaluation_template.create", details: { templateId: created.id } });
  res.status(201).json(created);
});

tenantRouter.get("/probation-evaluations", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds || visibleEmployeeIds.length === 0) return res.json([]);
  res.json(await db.select().from(probationEvaluations).where(and(eq(probationEvaluations.tenantId, tenantId), inArray(probationEvaluations.employeeId, visibleEmployeeIds))));
});

const probationEvaluationSchema = z.object({
  employeeId: z.string().uuid(),
  supervisorId: z.string().uuid().optional(),
  evaluationDate: zDateTime().optional(),
  // Legacy fixed categories — optional now; a custom-template evaluation
  // (templateId + categoryScores) doesn't populate these at all.
  technicalSkillScore: z.number().int().min(0).max(100).optional(),
  disciplineScore: z.number().int().min(0).max(100).optional(),
  teamworkScore: z.number().int().min(0).max(100).optional(),
  initiativeScore: z.number().int().min(0).max(100).optional(),
  templateId: z.string().uuid().optional(),
  categoryScores: z
    .array(
      z.object({
        categoryId: z.string(),
        label: z.string(),
        score: z.number().int().min(0).max(100),
        questions: z.array(z.object({ questionId: z.string(), text: z.string(), score: z.number().int().min(0).max(100) })).optional(),
      })
    )
    .optional(),
  overallScore: z.number().int().min(0).max(100),
  recommendation: z.enum(["Lulus", "Perpanjang Probation", "Tidak Lulus"]),
  extensionDurationMonths: z.number().int().min(0).optional(),
  notes: z.string().trim().max(2000).optional(),
  status: z.enum(["Draft", "Menunggu Approval", "Disetujui", "Ditolak"]).optional(),
  approvedBy: z.string().trim().max(200).optional(),
  skDocNumber: z.string().trim().max(100).optional(),
});

tenantRouter.post("/probation-evaluations", validateBody(probationEvaluationSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds || !visibleEmployeeIds.includes(req.body.employeeId)) {
    return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  }
  const [created] = await db.insert(probationEvaluations).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "probation_evaluation.create", details: { probationEvaluationId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/probation-evaluations/:id", validateParams(uuidParam("id")), validateBody(probationEvaluationSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const [existing] = await db.select().from(probationEvaluations).where(and(eq(probationEvaluations.id, req.params.id), eq(probationEvaluations.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEmployeeIds || !visibleEmployeeIds.includes(existing.employeeId)) {
    return res.status(404).json({ error: "Evaluasi probation tidak ditemukan" });
  }
  const [updated] = await db
    .update(probationEvaluations)
    .set(req.body)
    .where(eq(probationEvaluations.id, req.params.id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Evaluasi probation tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "probation_evaluation.update", details: { probationEvaluationId: updated.id } });
  res.json(updated);
});

tenantRouter.get("/contract-renewal-reviews", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds || visibleEmployeeIds.length === 0) return res.json([]);
  res.json(await db.select().from(contractRenewalReviews).where(and(eq(contractRenewalReviews.tenantId, tenantId), inArray(contractRenewalReviews.employeeId, visibleEmployeeIds))));
});

const contractRenewalReviewSchema = z.object({
  employeeId: z.string().uuid(),
  currentContractEnd: zDateTime(),
  recommendation: z.enum(["Perpanjang PKWT", "Alih Status PKWTT (Tetap)", "Tidak Diperpanjang"]),
  newDurationMonths: z.number().int().min(0).optional(),
  notes: z.string().trim().max(2000).optional(),
  status: z.enum(["Menunggu Approval", "Disetujui", "Ditolak"]).optional(),
  approvedBy: z.string().trim().max(200).optional(),
  newContractDocNumber: z.string().trim().max(100).optional(),
});

tenantRouter.post("/contract-renewal-reviews", validateBody(contractRenewalReviewSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds || !visibleEmployeeIds.includes(req.body.employeeId)) {
    return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  }
  const [created] = await db.insert(contractRenewalReviews).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "contract_renewal_review.create", details: { contractRenewalReviewId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/contract-renewal-reviews/:id", validateParams(uuidParam("id")), validateBody(contractRenewalReviewSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const [existing] = await db.select().from(contractRenewalReviews).where(and(eq(contractRenewalReviews.id, req.params.id), eq(contractRenewalReviews.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEmployeeIds || !visibleEmployeeIds.includes(existing.employeeId)) {
    return res.status(404).json({ error: "Review kontrak tidak ditemukan" });
  }
  const [updated] = await db
    .update(contractRenewalReviews)
    .set(req.body)
    .where(eq(contractRenewalReviews.id, req.params.id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Review kontrak tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "contract_renewal_review.update", details: { contractRenewalReviewId: updated.id } });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Generic per-module settings blob — every module's "Pengaturan" tab.
// ---------------------------------------------------------------------------

tenantRouter.get("/module-settings", async (req, res) => {
  const rows = await db.select().from(tenantModuleSettings).where(eq(tenantModuleSettings.tenantId, req.session!.tenantId!));
  const map: Record<string, Record<string, unknown>> = {};
  for (const row of rows) map[row.moduleKey] = row.settings;
  res.json(map);
});

const moduleSettingsSchema = z.object({ settings: z.record(z.string(), z.unknown()) });

tenantRouter.put("/module-settings/:moduleKey", validateBody(moduleSettingsSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const moduleKey = req.params.moduleKey;
  const [existing] = await db
    .select()
    .from(tenantModuleSettings)
    .where(and(eq(tenantModuleSettings.tenantId, tenantId), eq(tenantModuleSettings.moduleKey, moduleKey)))
    .limit(1);
  if (existing) {
    const [updated] = await db
      .update(tenantModuleSettings)
      .set({ settings: req.body.settings, updatedAt: new Date() })
      .where(and(eq(tenantModuleSettings.tenantId, tenantId), eq(tenantModuleSettings.moduleKey, moduleKey)))
      .returning();
    return res.json(updated);
  }
  const [created] = await db.insert(tenantModuleSettings).values({ tenantId, moduleKey, settings: req.body.settings }).returning();
  res.status(201).json(created);
});

// ---------------------------------------------------------------------------
// Approval Engine — the central cross-module queue. Tenant-wide for now
// (not entity-scoped): requesterId/assignedApproverId are plain text
// because several source modules (Leave, Attendance, Loans, ...) aren't
// migrated to real tables yet, so there's no real employee->entity lookup
// to scope through yet. Tighten this once those modules land.
// ---------------------------------------------------------------------------

tenantRouter.get("/approval-items", async (req, res) => {
  const rows = await db.select().from(approvalItems).where(eq(approvalItems.tenantId, req.session!.tenantId!));
  res.json(rows.map((r) => withDerivedStatus(r)));
});

const approvalItemSchema = z.object({
  category: z.string().trim().min(1).max(100),
  referenceId: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(300),
  requesterId: z.string().trim().min(1).max(100),
  department: z.string().trim().max(200).optional(),
  submittedAt: zDateTime().optional(),
  deadlineAt: zDateTime().optional(),
  level: z.number().int().min(1).optional(),
  totalLevels: z.number().int().min(1).optional(),
  assignedApproverRole: z.string().trim().min(1).max(50),
  assignedApproverId: z.string().trim().max(100).optional(),
  substituteApproverId: z.string().trim().max(100).optional(),
  status: z.enum(["Menunggu", "Disetujui", "Ditolak", "Eskalasi Terlambat"]).optional(),
  amount: z.number().int().optional(),
  notes: z.string().trim().max(2000).optional(),
});

/**
 * Approval Engine (user, 2026-11-10: "Approval Engine ... harus benar benar
 * di implementasikan"): steps/approver/SLA are resolved HERE from the
 * category's configured workflow and the requester's real reporting line —
 * the client no longer picks its own level, approver or status (those body
 * fields are ignored), so a request can't be created pre-approved or routed
 * to a convenient approver.
 */
tenantRouter.post("/approval-items", validateBody(approvalItemSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const { level: _l, totalLevels: _t, status: _s, assignedApproverId: _a, substituteApproverId: _sa, deadlineAt: _d, ...rest } = req.body;
  const steps = await buildApprovalSteps(tenantId, rest.category, rest.requesterId);
  const first = currentBlockingStep(steps);
  const [created] = await db
    .insert(approvalItems)
    .values({
      ...rest,
      tenantId,
      steps,
      level: first?.level ?? 1,
      totalLevels: steps.length,
      assignedApproverId: first?.approverEmployeeId ?? null,
      deadlineAt: first?.deadlineAt ? new Date(first.deadlineAt) : null,
      status: "Menunggu",
    })
    .returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "approval_item.create", details: { approvalItemId: created.id, category: created.category, levels: steps.length } });
  res.status(201).json(created);
});

/** Every decision goes through the engine: the current step's real approver (or active delegate) only, no skipping levels, reject needs a reason. A tenant_admin decides as the owner-level override (audited). */
const approvalDecisionSchema = z.object({
  decision: z.enum(["Disetujui", "Ditolak", "Diketahui"]),
  reason: z.string().trim().max(2000).optional().nullable(),
});
tenantRouter.post("/approval-items/:id/decision", validateParams(uuidParam("id")), validateBody(approvalDecisionSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [admin] = await db.select({ name: users.name }).from(users).where(eq(users.id, req.session!.userId)).limit(1);
  try {
    const updated = await decideApproval({
      tenantId,
      itemId: req.params.id,
      actor: { kind: "admin", userId: req.session!.userId, name: admin?.name ?? "Admin Tenant" },
      decision: req.body.decision,
      reason: req.body.reason,
    });
    await logAudit({ actorUserId: req.session!.userId, tenantId, action: "approval_item.decision", details: { approvalItemId: updated.id, decision: req.body.decision, status: updated.status, level: updated.level } });
    res.json(withDerivedStatus(updated));
  } catch (err) {
    if (err instanceof ApprovalError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

// --- Personalia (SK Promosi/Mutasi/Gaji/Kontrak/SP/Data) — real backend. Applying happens only server-side when the Approval Engine item is fully approved (see lib/personalia.ts). ---
tenantRouter.get("/personalia-actions", async (req, res) => {
  res.json(await listPersonaliaActions(req.session!.tenantId!, typeof req.query.employeeId === "string" ? req.query.employeeId : undefined));
});
tenantRouter.post("/personalia-actions", validateBody(personaliaActionSchema), async (req, res) => {
  try {
    res.status(201).json(await createPersonaliaAction({ tenantId: req.session!.tenantId!, actorUserId: req.session!.userId, input: req.body }));
  } catch (err) {
    if (err instanceof PersonaliaError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});
tenantRouter.post("/personalia-actions/:id/submit", validateParams(uuidParam("id")), async (req, res) => {
  try {
    res.json(await submitPersonaliaAction({ tenantId: req.session!.tenantId!, actionId: req.params.id, actorUserId: req.session!.userId }));
  } catch (err) {
    if (err instanceof PersonaliaError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});
tenantRouter.delete("/personalia-actions/:id", validateParams(uuidParam("id")), async (req, res) => {
  try {
    await deletePersonaliaDraft(req.session!.tenantId!, req.params.id);
    res.status(204).end();
  } catch (err) {
    if (err instanceof PersonaliaError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

const approvalWorkflowConfigSchema = z.object({
  steps: z
    .array(
      z.object({
        mode: z.enum(["approve", "acknowledge"]),
        label: z.string().trim().min(1).max(200),
        approverType: z.enum(["direct_manager", "manager_of_manager", "role", "employee"]),
        approverRoleKey: z.string().trim().max(100).optional().nullable(),
        approverEmployeeId: z.string().uuid().optional().nullable(),
        slaHours: z.number().int().min(1).max(24 * 30),
      })
    )
    .min(1)
    .max(10)
    .refine((steps) => steps.some((s) => s.mode === "approve"), { message: "Minimal satu langkah harus bermode persetujuan." }),
});
tenantRouter.get("/approval-workflow-configs", async (req, res) => {
  res.json(await db.select().from(approvalWorkflowConfigs).where(eq(approvalWorkflowConfigs.tenantId, req.session!.tenantId!)));
});
tenantRouter.put("/approval-workflow-configs/:category", validateBody(approvalWorkflowConfigSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const category = decodeURIComponent(req.params.category);
  const [existing] = await db.select().from(approvalWorkflowConfigs).where(and(eq(approvalWorkflowConfigs.tenantId, tenantId), eq(approvalWorkflowConfigs.category, category))).limit(1);
  const row = existing
    ? (await db.update(approvalWorkflowConfigs).set({ steps: req.body.steps, updatedAt: new Date() }).where(eq(approvalWorkflowConfigs.id, existing.id)).returning())[0]
    : (await db.insert(approvalWorkflowConfigs).values({ tenantId, category, steps: req.body.steps }).returning())[0];
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "approval_workflow.config_saved", details: { category, levels: req.body.steps.length } });
  res.json(row);
});

/** Generic update — can no longer touch level/approver (only the engine route above moves a request forward); a status sync from a source module is an audited admin override recorded in history. */
tenantRouter.put(
  "/approval-items/:id",
  validateParams(uuidParam("id")),
  validateBody(approvalItemSchema.partial().omit({ level: true, totalLevels: true, assignedApproverId: true, substituteApproverId: true, assignedApproverRole: true })),
  async (req, res) => {
    const tenantId = req.session!.tenantId!;
    const [existing] = await db.select().from(approvalItems).where(and(eq(approvalItems.id, req.params.id), eq(approvalItems.tenantId, tenantId))).limit(1);
    if (!existing) return res.status(404).json({ error: "Item approval tidak ditemukan" });
    const history = req.body.status && req.body.status !== existing.status
      ? [...existing.history, { at: new Date().toISOString(), level: existing.level, action: `Sinkron status → ${req.body.status} (override admin dari modul sumber)`, byEmployeeId: null, byName: "Admin Tenant" }]
      : existing.history;
    const [updated] = await db.update(approvalItems).set({ ...req.body, history }).where(eq(approvalItems.id, existing.id)).returning();
    await logAudit({ actorUserId: req.session!.userId, tenantId, action: "approval_item.update", details: { approvalItemId: updated.id, status: updated.status } });
    res.json(updated);
  }
);

tenantRouter.get("/approval-delegations", async (req, res) => {
  res.json(await db.select().from(approvalDelegations).where(eq(approvalDelegations.tenantId, req.session!.tenantId!)));
});

const approvalDelegationSchema = z.object({
  principalId: z.string().trim().min(1).max(100),
  substituteId: z.string().trim().min(1).max(100),
  startDate: zDateTime(),
  endDate: zDateTime(),
  reason: z.string().trim().max(1000).optional(),
  isActive: z.boolean().optional(),
});

tenantRouter.post("/approval-delegations", validateBody(approvalDelegationSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(approvalDelegations).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "approval_delegation.create", details: { approvalDelegationId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/approval-delegations/:id", validateParams(uuidParam("id")), validateBody(approvalDelegationSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(approvalDelegations)
    .set(req.body)
    .where(and(eq(approvalDelegations.id, req.params.id), eq(approvalDelegations.tenantId, tenantId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Delegasi tidak ditemukan" });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Attendance (Presensi) module. work_shifts is tenant-wide master data
// (same as grades/office-locations); everything else carries an
// employeeId and is scoped through resolveVisibleEmployeeIds — applying
// the vertical-entity-scope lesson from the earlier authorization audit
// from the start this time, not bolted on after the fact.
// ---------------------------------------------------------------------------

tenantRouter.get("/work-shifts", async (req, res) => {
  res.json(await db.select().from(workShifts).where(eq(workShifts.tenantId, req.session!.tenantId!)));
});

const workShiftSchema = z.object({
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().min(1).max(20),
  startTime: z.string().trim().min(1).max(10),
  endTime: z.string().trim().min(1).max(10),
  color: z.string().trim().max(20).optional(),
  isNightShift: z.boolean().optional(),
  lateToleranceMins: z.number().int().min(0).optional(),
  breakMins: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

tenantRouter.post("/work-shifts", validateBody(workShiftSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(workShifts).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "work_shift.create", details: { workShiftId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/work-shifts/:id", validateParams(uuidParam("id")), validateBody(workShiftSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(workShifts)
    .set(req.body)
    .where(and(eq(workShifts.id, req.params.id), eq(workShifts.tenantId, tenantId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Shift tidak ditemukan" });
  res.json(updated);
});

tenantRouter.delete("/work-shifts/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [deleted] = await db.delete(workShifts).where(and(eq(workShifts.id, req.params.id), eq(workShifts.tenantId, tenantId))).returning();
  if (!deleted) return res.status(404).json({ error: "Shift tidak ditemukan" });
  res.json({ ok: true });
});

// --- Employee Schedules (roster) ---

tenantRouter.get("/employee-schedules", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (visibleEmployeeIds.length === 0) return res.json([]);
  res.json(await db.select().from(employeeSchedules).where(and(eq(employeeSchedules.tenantId, tenantId), inArray(employeeSchedules.employeeId, visibleEmployeeIds))));
});

const employeeScheduleSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().trim().min(1).max(20),
  shiftId: z.string().trim().min(1).max(50),
});

tenantRouter.post("/employee-schedules", validateBody(employeeScheduleSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.body.employeeId)) return res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });
  const [created] = await db.insert(employeeSchedules).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/employee-schedules/:id", validateParams(uuidParam("id")), validateBody(employeeScheduleSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const [existing] = await db.select().from(employeeSchedules).where(and(eq(employeeSchedules.id, req.params.id), eq(employeeSchedules.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEmployeeIds.includes(existing.employeeId)) return res.status(404).json({ error: "Roster tidak ditemukan" });
  const [updated] = await db.update(employeeSchedules).set(req.body).where(eq(employeeSchedules.id, req.params.id)).returning();
  res.json(updated);
});

tenantRouter.delete("/employee-schedules/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const [existing] = await db.select().from(employeeSchedules).where(and(eq(employeeSchedules.id, req.params.id), eq(employeeSchedules.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEmployeeIds.includes(existing.employeeId)) return res.status(404).json({ error: "Roster tidak ditemukan" });
  await db.delete(employeeSchedules).where(eq(employeeSchedules.id, req.params.id));
  res.json({ ok: true });
});

tenantRouter.post("/employee-schedules/bulk", validateBody(z.object({ entries: z.array(employeeScheduleSchema) })), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const entries = req.body.entries as z.infer<typeof employeeScheduleSchema>[];
  if (entries.some((e) => !visibleEmployeeIds.includes(e.employeeId))) {
    return res.status(403).json({ error: "Salah satu karyawan di luar ruang lingkup Anda" });
  }
  if (entries.length === 0) return res.json([]);
  const created = await db.insert(employeeSchedules).values(entries.map((e) => ({ ...e, tenantId }))).returning();
  res.status(201).json(created);
});

// --- Shift Swap Requests ---

tenantRouter.get("/shift-swap-requests", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (visibleEmployeeIds.length === 0) return res.json([]);
  res.json(await db.select().from(shiftSwapRequests).where(and(eq(shiftSwapRequests.tenantId, tenantId), inArray(shiftSwapRequests.requesterId, visibleEmployeeIds))));
});

const shiftSwapRequestSchema = z.object({
  requesterId: z.string().uuid(),
  targetEmployeeId: z.string().uuid(),
  requestDate: z.string().trim().min(1).max(20),
  targetDate: z.string().trim().min(1).max(20),
  requestShiftId: z.string().trim().max(50).optional(),
  targetShiftId: z.string().trim().max(50).optional(),
  reason: z.string().trim().max(1000).optional(),
  status: z.enum(["Menunggu", "Disetujui", "Ditolak"]).optional(),
  approvedBy: z.string().trim().max(200).optional(),
});

tenantRouter.post("/shift-swap-requests", validateBody(shiftSwapRequestSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.body.requesterId)) return res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });
  const [created] = await db.insert(shiftSwapRequests).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/shift-swap-requests/:id", validateParams(uuidParam("id")), validateBody(shiftSwapRequestSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const [existing] = await db.select().from(shiftSwapRequests).where(and(eq(shiftSwapRequests.id, req.params.id), eq(shiftSwapRequests.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEmployeeIds.includes(existing.requesterId)) return res.status(404).json({ error: "Pengajuan tukar shift tidak ditemukan" });
  const [updated] = await db.update(shiftSwapRequests).set(req.body).where(eq(shiftSwapRequests.id, req.params.id)).returning();
  res.json(updated);
});

// --- Attendance Records ---

tenantRouter.get("/attendance-records", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (visibleEmployeeIds.length === 0) return res.json([]);
  res.json(await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.tenantId, tenantId), inArray(attendanceRecords.employeeId, visibleEmployeeIds))));
});

const attendanceRecordSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().trim().min(1).max(20),
  clockIn: z.string().trim().max(10).optional(),
  clockOut: z.string().trim().max(10).optional(),
  status: z.string().trim().min(1).max(50).optional(),
  overtimeHours: z.number().min(0).optional(),
  lateMinutes: z.number().int().min(0).optional(),
  notes: z.string().trim().max(1000).optional(),
  shiftId: z.string().trim().max(50).optional(),
  workType: z.enum(["WFO", "WFH", "WFA"]).optional(),
});

tenantRouter.post("/attendance-records", validateBody(attendanceRecordSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.body.employeeId)) return res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });
  const [created] = await db.insert(attendanceRecords).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/attendance-records/:id", validateParams(uuidParam("id")), validateBody(attendanceRecordSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const [existing] = await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.id, req.params.id), eq(attendanceRecords.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEmployeeIds.includes(existing.employeeId)) return res.status(404).json({ error: "Data presensi tidak ditemukan" });
  const [updated] = await db.update(attendanceRecords).set(req.body).where(eq(attendanceRecords.id, req.params.id)).returning();
  res.json(updated);
});

/** Upsert by (employeeId, date) — attendance is usually "find today's row for this employee, or create it". */
tenantRouter.post("/attendance-records/upsert", validateBody(attendanceRecordSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.body.employeeId)) return res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });
  const [existing] = await db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.tenantId, tenantId), eq(attendanceRecords.employeeId, req.body.employeeId), eq(attendanceRecords.date, req.body.date)))
    .limit(1);
  if (existing) {
    const [updated] = await db.update(attendanceRecords).set(req.body).where(eq(attendanceRecords.id, existing.id)).returning();
    return res.json(updated);
  }
  const [created] = await db.insert(attendanceRecords).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

// --- Attendance Correction Requests ---

tenantRouter.get("/attendance-corrections", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (visibleEmployeeIds.length === 0) return res.json([]);
  res.json(await db.select().from(attendanceCorrectionRequests).where(and(eq(attendanceCorrectionRequests.tenantId, tenantId), inArray(attendanceCorrectionRequests.employeeId, visibleEmployeeIds))));
});

const attendanceCorrectionSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().trim().min(1).max(20),
  type: z.string().trim().min(1).max(100),
  proposedClockIn: z.string().trim().max(10).optional(),
  proposedClockOut: z.string().trim().max(10).optional(),
  reason: z.string().trim().max(1000).optional(),
  status: z.enum(["Menunggu", "Disetujui", "Ditolak"]).optional(),
  approvedBy: z.string().trim().max(200).optional(),
  attachmentUrl: z.string().trim().max(2000).optional(),
});

tenantRouter.post("/attendance-corrections", validateBody(attendanceCorrectionSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.body.employeeId)) return res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });
  const [created] = await db.insert(attendanceCorrectionRequests).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/attendance-corrections/:id", validateParams(uuidParam("id")), validateBody(attendanceCorrectionSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const [existing] = await db.select().from(attendanceCorrectionRequests).where(and(eq(attendanceCorrectionRequests.id, req.params.id), eq(attendanceCorrectionRequests.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEmployeeIds.includes(existing.employeeId)) return res.status(404).json({ error: "Pengajuan koreksi tidak ditemukan" });
  const [updated] = await db.update(attendanceCorrectionRequests).set(req.body).where(eq(attendanceCorrectionRequests.id, req.params.id)).returning();
  res.json(updated);
});

// --- Overtime Requests ---

tenantRouter.get("/overtime-requests", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (visibleEmployeeIds.length === 0) return res.json([]);
  res.json(await db.select().from(overtimeRequests).where(and(eq(overtimeRequests.tenantId, tenantId), inArray(overtimeRequests.employeeId, visibleEmployeeIds))));
});

const overtimeRequestSchema = z.object({
  entityId: z.string().uuid().optional(),
  employeeId: z.string().uuid(),
  date: z.string().trim().min(1).max(20),
  startTime: z.string().trim().min(1).max(10),
  endTime: z.string().trim().min(1).max(10),
  hours: z.number().min(0),
  reason: z.string().trim().max(1000).optional(),
  type: z.enum(["Pengajuan Karyawan", "Perintah Atasan"]).optional(),
  status: z.enum(["Menunggu", "Disetujui", "Ditolak"]).optional(),
  approvedBy: z.string().trim().max(200).optional(),
  approvedHours: z.number().min(0).optional(),
  compensationType: z.enum(["Lembur Berbayar", "Cuti Pengganti"]).optional(),
  notes: z.string().trim().max(1000).optional(),
});

tenantRouter.post("/overtime-requests", validateBody(overtimeRequestSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.body.employeeId)) return res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });
  const [created] = await db.insert(overtimeRequests).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/overtime-requests/:id", validateParams(uuidParam("id")), validateBody(overtimeRequestSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const [existing] = await db.select().from(overtimeRequests).where(and(eq(overtimeRequests.id, req.params.id), eq(overtimeRequests.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEmployeeIds.includes(existing.employeeId)) return res.status(404).json({ error: "Pengajuan lembur tidak ditemukan" });
  const [updated] = await db.update(overtimeRequests).set(req.body).where(eq(overtimeRequests.id, req.params.id)).returning();
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Payroll — salary component master/assignments + payroll records. The
// run-generation calculation itself happens client-side (HrmsContext
// already has real attendance/overtime/reimbursement/loan data to compute
// from); these endpoints just persist its master data and output.
// ---------------------------------------------------------------------------

const salaryComponentSchema = z.object({
  entityId: z.string().uuid().optional().nullable(),
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(200),
  category: z.enum(["Tunjangan Tetap", "Tunjangan Tidak Tetap", "Asuransi Pemerintah", "Asuransi Swasta", "Potongan"]),
  calculationBasis: z.enum(["Nominal Tetap", "Persen Gaji Pokok"]),
  defaultValue: z.number().int().min(0).optional(),
  isTaxable: z.boolean().optional(),
  isBpjsBase: z.boolean().optional(),
  description: z.string().trim().max(500).optional().nullable(),
});

tenantRouter.get("/salary-components", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(salaryComponents).where(eq(salaryComponents.tenantId, tenantId)));
});

tenantRouter.post("/salary-components", validateBody(salaryComponentSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(salaryComponents).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/salary-components/:id", validateParams(uuidParam("id")), validateBody(salaryComponentSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(salaryComponents).where(and(eq(salaryComponents.id, req.params.id), eq(salaryComponents.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Komponen gaji tidak ditemukan" });
  const [updated] = await db.update(salaryComponents).set(req.body).where(eq(salaryComponents.id, req.params.id)).returning();
  res.json(updated);
});

tenantRouter.delete("/salary-components/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(salaryComponents).where(and(eq(salaryComponents.id, req.params.id), eq(salaryComponents.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Komponen gaji tidak ditemukan" });
  await db.delete(employeeSalaryComponentAssignments).where(eq(employeeSalaryComponentAssignments.componentId, existing.id));
  await db.delete(salaryComponents).where(eq(salaryComponents.id, req.params.id));
  res.json({ ok: true });
});

const salaryAssignmentSchema = z.object({
  employeeId: z.string().uuid(),
  componentId: z.string().uuid(),
  amount: z.number().int().min(0).optional(),
  effectiveDate: z.string().trim().min(1).max(20),
  isActive: z.boolean().optional(),
});

tenantRouter.get("/employee-salary-assignments", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (visibleEmployeeIds.length === 0) return res.json([]);
  res.json(
    await db
      .select()
      .from(employeeSalaryComponentAssignments)
      .where(and(eq(employeeSalaryComponentAssignments.tenantId, tenantId), inArray(employeeSalaryComponentAssignments.employeeId, visibleEmployeeIds)))
  );
});

tenantRouter.post("/employee-salary-assignments", validateBody(salaryAssignmentSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.body.employeeId)) return res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });
  const [created] = await db.insert(employeeSalaryComponentAssignments).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.delete("/employee-salary-assignments/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(employeeSalaryComponentAssignments).where(and(eq(employeeSalaryComponentAssignments.id, req.params.id), eq(employeeSalaryComponentAssignments.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Penetapan komponen tidak ditemukan" });
  await db.delete(employeeSalaryComponentAssignments).where(eq(employeeSalaryComponentAssignments.id, req.params.id));
  res.json({ ok: true });
});

const payrollRecordSchema = z.object({
  employeeId: z.string().uuid(),
  period: z.string().trim().min(1).max(100),
  basicSalary: z.number().int().min(0).optional(),
  allowances: z.number().int().min(0).optional(),
  overtimePay: z.number().int().min(0).optional(),
  reimbursement: z.number().int().min(0).optional(),
  thrBonus: z.number().int().min(0).optional(),
  grossPay: z.number().int().min(0).optional(),
  bpjsKesCompany: z.number().int().min(0).optional(),
  bpjsKesEmployee: z.number().int().min(0).optional(),
  bpjsTkCompany: z.number().int().min(0).optional(),
  bpjsTkEmployee: z.number().int().min(0).optional(),
  pph21TERCategory: z.enum(["TER A", "TER B", "TER C"]).optional(),
  pph21RatePercent: z.number().min(0).optional(),
  pph21Amount: z.number().int().min(0).optional(),
  loanDeduction: z.number().int().min(0).optional(),
  lateDeduction: z.number().int().min(0).optional(),
  unpaidLeaveDeduction: z.number().int().min(0).optional().nullable(),
  severancePay: z.number().int().min(0).optional().nullable(),
  totalDeductions: z.number().int().min(0).optional(),
  netPay: z.number().int().min(0).optional(),
  status: z.enum(["Draft", "Approved", "Disbursed"]).optional(),
  paidDate: z.string().trim().max(20).optional().nullable(),
});

tenantRouter.get("/payroll-records", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (visibleEmployeeIds.length === 0) return res.json([]);
  res.json(
    await db
      .select()
      .from(payrollRecords)
      .where(and(eq(payrollRecords.tenantId, tenantId), inArray(payrollRecords.employeeId, visibleEmployeeIds)))
  );
});

/** Upsert by (employeeId, period) — re-generating a draft run for the same period must replace that employee's row, not duplicate it. */
tenantRouter.post("/payroll-records/upsert", validateBody(payrollRecordSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.body.employeeId)) return res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });
  const [existing] = await db
    .select()
    .from(payrollRecords)
    .where(and(eq(payrollRecords.tenantId, tenantId), eq(payrollRecords.employeeId, req.body.employeeId), eq(payrollRecords.period, req.body.period)))
    .limit(1);
  if (existing) {
    const [updated] = await db.update(payrollRecords).set(req.body).where(eq(payrollRecords.id, existing.id)).returning();
    return res.json(updated);
  }
  const [created] = await db.insert(payrollRecords).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/payroll-records/:id", validateParams(uuidParam("id")), validateBody(payrollRecordSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const [existing] = await db.select().from(payrollRecords).where(and(eq(payrollRecords.id, req.params.id), eq(payrollRecords.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEmployeeIds.includes(existing.employeeId)) return res.status(404).json({ error: "Data payroll tidak ditemukan" });
  const [updated] = await db.update(payrollRecords).set(req.body).where(eq(payrollRecords.id, req.params.id)).returning();
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Employee Loans & Kasbon
// ---------------------------------------------------------------------------

const employeeLoanSchema = z.object({
  employeeId: z.string().uuid(),
  loanType: z.string().trim().min(1).max(100),
  totalAmount: z.number().int().min(0),
  tenorMonths: z.number().int().min(1),
  monthlyInstallment: z.number().int().min(0),
  remainingAmount: z.number().int().min(0).optional(),
  startDate: z.string().trim().min(1).max(20),
  reason: z.string().trim().max(1000).optional().nullable(),
  status: z.enum(["Aktif", "Lunas", "Menunggu Approval", "Ditolak"]).optional(),
  adminFee: z.number().int().min(0).optional().nullable(),
  interestMethod: z.string().trim().max(100).optional().nullable(),
  interestRatePercent: z.number().min(0).optional().nullable(),
});

tenantRouter.get("/loans", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (visibleEmployeeIds.length === 0) return res.json([]);
  res.json(await db.select().from(employeeLoans).where(and(eq(employeeLoans.tenantId, tenantId), inArray(employeeLoans.employeeId, visibleEmployeeIds))));
});

tenantRouter.post("/loans", validateBody(employeeLoanSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.body.employeeId)) return res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });
  const [created] = await db
    .insert(employeeLoans)
    .values({ ...req.body, remainingAmount: req.body.remainingAmount ?? req.body.totalAmount, tenantId })
    .returning();
  res.status(201).json(created);
});

tenantRouter.put("/loans/:id", validateParams(uuidParam("id")), validateBody(employeeLoanSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const [existing] = await db.select().from(employeeLoans).where(and(eq(employeeLoans.id, req.params.id), eq(employeeLoans.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEmployeeIds.includes(existing.employeeId)) return res.status(404).json({ error: "Data pinjaman tidak ditemukan" });
  const [updated] = await db.update(employeeLoans).set(req.body).where(eq(employeeLoans.id, req.params.id)).returning();
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Leave Requests (Cuti)
// ---------------------------------------------------------------------------

const leaveRequestSchema = z.object({
  employeeId: z.string().uuid(),
  leaveType: z.enum(["Cuti Tahunan", "Sakit Tanpa Surat Dokter", "Sakit dengan Surat Dokter", "Cuti Menikah", "Cuti Melahirkan", "Izin Urusan Pribadi"]),
  startDate: z.string().trim().min(1).max(20),
  endDate: z.string().trim().min(1).max(20),
  totalDays: z.number().int().min(1),
  reason: z.string().trim().max(1000).optional().nullable(),
  status: z.enum(["Menunggu", "Disetujui", "Ditolak"]).optional(),
  approvedBy: z.string().trim().max(200).optional().nullable(),
});

tenantRouter.get("/leave-requests", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (visibleEmployeeIds.length === 0) return res.json([]);
  res.json(await db.select().from(leaveRequests).where(and(eq(leaveRequests.tenantId, tenantId), inArray(leaveRequests.employeeId, visibleEmployeeIds))));
});

tenantRouter.post("/leave-requests", validateBody(leaveRequestSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.body.employeeId)) return res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });
  const [created] = await db.insert(leaveRequests).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/leave-requests/:id", validateParams(uuidParam("id")), validateBody(leaveRequestSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const [existing] = await db.select().from(leaveRequests).where(and(eq(leaveRequests.id, req.params.id), eq(leaveRequests.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEmployeeIds.includes(existing.employeeId)) return res.status(404).json({ error: "Pengajuan cuti tidak ditemukan" });
  const [updated] = await db.update(leaveRequests).set(req.body).where(eq(leaveRequests.id, req.params.id)).returning();
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Employee KPI reviews
// ---------------------------------------------------------------------------

const employeeKpiSchema = z.object({
  employeeId: z.string().uuid(),
  period: z.string().trim().min(1).max(100),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  metrics: z.array(z.unknown()).optional(),
  finalScore: z.number().optional(),
  feedback: z.string().trim().max(2000).optional().nullable(),
  reviewer: z.string().trim().max(200).optional().nullable(),
  evaluatedAt: z.string().trim().min(1).max(20),
});

tenantRouter.get("/employee-kpis", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (visibleEmployeeIds.length === 0) return res.json([]);
  res.json(await db.select().from(employeeKpis).where(and(eq(employeeKpis.tenantId, tenantId), inArray(employeeKpis.employeeId, visibleEmployeeIds))));
});

/** Upsert by (employeeId, quarter, period) — re-saving a review for the same quarter replaces it instead of duplicating. */
tenantRouter.post("/employee-kpis/upsert", validateBody(employeeKpiSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.body.employeeId)) return res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });
  const [existing] = await db
    .select()
    .from(employeeKpis)
    .where(
      and(
        eq(employeeKpis.tenantId, tenantId),
        eq(employeeKpis.employeeId, req.body.employeeId),
        eq(employeeKpis.quarter, req.body.quarter),
        eq(employeeKpis.period, req.body.period)
      )
    )
    .limit(1);
  if (existing) {
    const [updated] = await db.update(employeeKpis).set(req.body).where(eq(employeeKpis.id, existing.id)).returning();
    return res.json(updated);
  }
  const [created] = await db.insert(employeeKpis).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

// ---------------------------------------------------------------------------
// Compliance (SP/PHK)
// ---------------------------------------------------------------------------

const complianceRecordSchema = z.object({
  employeeId: z.string().uuid(),
  level: z.enum(["SP 1", "SP 2", "SP 3", "Skorsing", "PHK"]),
  violationReason: z.string().trim().min(1).max(2000),
  letterNumber: z.string().trim().min(1).max(200),
  issueDate: z.string().trim().min(1).max(20),
  validUntil: z.string().trim().min(1).max(20),
  signedBy: z.string().trim().max(200).optional().nullable(),
  status: z.enum(["Aktif", "Kedaluwarsa", "Dibatalkan"]).optional(),
});

tenantRouter.get("/compliance-records", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (visibleEmployeeIds.length === 0) return res.json([]);
  res.json(await db.select().from(complianceRecords).where(and(eq(complianceRecords.tenantId, tenantId), inArray(complianceRecords.employeeId, visibleEmployeeIds))));
});

tenantRouter.post("/compliance-records", validateBody(complianceRecordSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.body.employeeId)) return res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });
  const [created] = await db.insert(complianceRecords).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "compliance.issued", details: { complianceRecordId: created.id, employeeId: created.employeeId, level: created.level, letterNumber: created.letterNumber } });
  res.status(201).json(created);
});

tenantRouter.put("/compliance-records/:id", validateParams(uuidParam("id")), validateBody(complianceRecordSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const [existing] = await db.select().from(complianceRecords).where(and(eq(complianceRecords.id, req.params.id), eq(complianceRecords.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEmployeeIds.includes(existing.employeeId)) return res.status(404).json({ error: "Data kepatuhan tidak ditemukan" });
  const [updated] = await db.update(complianceRecords).set(req.body).where(eq(complianceRecords.id, req.params.id)).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "compliance.updated", details: { complianceRecordId: updated.id, employeeId: updated.employeeId, level: updated.level, status: updated.status, changedFields: Object.keys(req.body) } });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Offboarding
// ---------------------------------------------------------------------------

const offboardingRecordSchema = z.object({
  employeeId: z.string().uuid(),
  separationType: z.enum(["Resign Sukarela", "Habis Kontrak", "PHK Efisiensi", "PHK Indisipliner"]),
  requestDate: z.string().trim().min(1).max(20),
  effectiveDate: z.string().trim().min(1).max(20),
  handoverCompleted: z.boolean().optional(),
  assetReturned: z.boolean().optional(),
  financeCleared: z.boolean().optional(),
  severancePay: z.number().int().min(0).optional(),
  parklaringIssued: z.boolean().optional(),
  parklaringNumber: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

tenantRouter.get("/offboarding-records", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (visibleEmployeeIds.length === 0) return res.json([]);
  res.json(await db.select().from(offboardingRecords).where(and(eq(offboardingRecords.tenantId, tenantId), inArray(offboardingRecords.employeeId, visibleEmployeeIds))));
});

tenantRouter.post("/offboarding-records", validateBody(offboardingRecordSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.body.employeeId)) return res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });
  const [created] = await db.insert(offboardingRecords).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/offboarding-records/:id", validateParams(uuidParam("id")), validateBody(offboardingRecordSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const [existing] = await db.select().from(offboardingRecords).where(and(eq(offboardingRecords.id, req.params.id), eq(offboardingRecords.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEmployeeIds.includes(existing.employeeId)) return res.status(404).json({ error: "Data offboarding tidak ditemukan" });
  // Clearance is verified against the real asset register, not a self-reported checkbox.
  if (req.body.assetReturned === true) {
    const held = await db.select({ code: gaAssets.assetCode, name: gaAssets.name }).from(gaAssets).where(and(eq(gaAssets.tenantId, tenantId), eq(gaAssets.assignedToEmployeeId, existing.employeeId)));
    if (held.length > 0) {
      return res.status(409).json({ error: `Karyawan masih memegang ${held.length} aset: ${held.map((a) => a.code).join(", ")}. Kembalikan ke GA terlebih dahulu.` });
    }
  }
  const [updated] = await db.update(offboardingRecords).set(req.body).where(eq(offboardingRecords.id, req.params.id)).returning();
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Business Trips (SPPD)
// ---------------------------------------------------------------------------

const businessTripSchema = z.object({
  tripNumber: z.string().trim().min(1).max(100),
  employeeId: z.string().uuid(),
  destinationCity: z.string().trim().min(1).max(200),
  startDate: z.string().trim().min(1).max(20),
  endDate: z.string().trim().min(1).max(20),
  totalDays: z.number().int().min(1),
  purpose: z.string().trim().min(1).max(2000),
  transportType: z.enum(["Pesawat", "Kereta Api", "Mobil Operasional", "Travel"]),
  estimatedCost: z.number().int().min(0),
  perDiemDaily: z.number().int().min(0),
  accommodationCost: z.number().int().min(0),
  status: z.enum(["Menunggu Approval", "Disetujui Atasan", "Disetujui Finance", "Selesai", "Ditolak"]).optional(),
  approvedBy: z.string().trim().max(200).optional().nullable(),
});

tenantRouter.get("/business-trips", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (visibleEmployeeIds.length === 0) return res.json([]);
  res.json(await db.select().from(businessTrips).where(and(eq(businessTrips.tenantId, tenantId), inArray(businessTrips.employeeId, visibleEmployeeIds))));
});

tenantRouter.post("/business-trips", validateBody(businessTripSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.body.employeeId)) return res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });
  const [created] = await db.insert(businessTrips).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/business-trips/:id", validateParams(uuidParam("id")), validateBody(businessTripSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const [existing] = await db.select().from(businessTrips).where(and(eq(businessTrips.id, req.params.id), eq(businessTrips.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEmployeeIds.includes(existing.employeeId)) return res.status(404).json({ error: "Data perjalanan dinas tidak ditemukan" });
  const [updated] = await db.update(businessTrips).set(req.body).where(eq(businessTrips.id, req.params.id)).returning();
  res.json(updated);
});

// ---------------------------------------------------------------------------
// GA Asset & Procurement — Vendors
// ---------------------------------------------------------------------------

const vendorSchema = z.object({
  name: z.string().trim().min(1).max(200),
  code: z.string().trim().min(1).max(50),
  category: z.enum(["Hardware & IT", "Konstruksi & Fasilitas", "ATK & Cetak", "Jasa Konsultan / Project", "Event & Logistik"]),
  contactPerson: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(50),
  email: z.string().trim().email().max(200),
  npwp: z.string().trim().max(50),
  rating: z.number().int().min(1).max(5).optional(),
  address: z.string().trim().max(500),
  isVerified: z.boolean().optional(),
});

tenantRouter.get("/vendors", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(vendors).where(eq(vendors.tenantId, tenantId)));
});

tenantRouter.post("/vendors", validateBody(vendorSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(vendors).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/vendors/:id", validateParams(uuidParam("id")), validateBody(vendorSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(vendors).where(and(eq(vendors.id, req.params.id), eq(vendors.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Vendor tidak ditemukan" });
  const [updated] = await db.update(vendors).set(req.body).where(eq(vendors.id, req.params.id)).returning();
  res.json(updated);
});

// ---------------------------------------------------------------------------
// GA Asset & Procurement — GA Assets
// ---------------------------------------------------------------------------

const gaAssetSchema = z.object({
  assetCode: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  category: z.enum(["Laptop & Komputer", "Kendaraan Operasional", "Fasilitas Gedung", "Furniture", "Perangkat Jaringan"]),
  building: z.string().trim().min(1).max(200),
  room: z.string().trim().min(1).max(200),
  purchaseDate: z.string().trim().min(1).max(20),
  purchasePrice: z.number().int().min(0),
  condition: z.enum(["Baik", "Perlu Perbaikan", "Rusak", "Dipinjam", "Hilang"]).optional(),
  assignedToEmployeeId: z.string().uuid().optional().nullable(),
  lastStockOpname: z.string().trim().min(1).max(20),
  qrPayload: z.string().trim().min(1).max(2000),
  usageStatus: z.enum(["Tersedia", "Digunakan", "Dalam Perbaikan"]).optional().nullable(),
  warrantyExpiryDate: z.string().trim().max(20).optional().nullable(),
  warrantyProvider: z.string().trim().max(200).optional().nullable(),
  officeLocationId: z.string().uuid().optional().nullable(),
});

tenantRouter.get("/ga-assets", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(gaAssets).where(eq(gaAssets.tenantId, tenantId)));
});

tenantRouter.post("/ga-assets", validateBody(gaAssetSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db
    .insert(gaAssets)
    .values({ ...req.body, tenantId, usageStatus: deriveUsageStatus({ assignedToEmployeeId: req.body.assignedToEmployeeId ?? null, condition: req.body.condition ?? "Baik" }) })
    .returning();
  res.status(201).json(created);
});

tenantRouter.put("/ga-assets/:id", validateParams(uuidParam("id")), validateBody(gaAssetSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(gaAssets).where(and(eq(gaAssets.id, req.params.id), eq(gaAssets.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Aset tidak ditemukan" });
  // usageStatus is derived, never trusted from the client (single source of truth).
  const { usageStatus: _u, ...patch } = req.body;
  const next = { ...existing, ...patch };
  const [updated] = await db
    .update(gaAssets)
    .set({ ...patch, usageStatus: deriveUsageStatus({ assignedToEmployeeId: next.assignedToEmployeeId, condition: next.condition }) })
    .where(eq(gaAssets.id, req.params.id))
    .returning();
  res.json(updated);
});

/** "Kembalikan ke GA" — releases the holder and makes the asset available again (was missing entirely: once assigned, an asset could only move to another employee). */
tenantRouter.post("/ga-assets/:id/return", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(gaAssets).where(and(eq(gaAssets.id, req.params.id), eq(gaAssets.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Aset tidak ditemukan" });
  if (!existing.assignedToEmployeeId) return res.status(400).json({ error: "Aset ini tidak sedang dipegang karyawan." });
  const [updated] = await db
    .update(gaAssets)
    .set({ assignedToEmployeeId: null, returnedToGaAt: new Date(), usageStatus: deriveUsageStatus({ assignedToEmployeeId: null, condition: existing.condition }) })
    .where(eq(gaAssets.id, existing.id))
    .returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "ga_asset.returned_to_ga", details: { assetId: existing.id, fromEmployeeId: existing.assignedToEmployeeId } });
  res.json(updated);
});

/** Back-link Employee -> assets currently held (used by profile and the offboarding clearance check). */
tenantRouter.get("/employees/:id/assets", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(gaAssets).where(and(eq(gaAssets.tenantId, tenantId), eq(gaAssets.assignedToEmployeeId, req.params.id))));
});

// ---------------------------------------------------------------------------
// GA Asset & Procurement — Maintenance Tickets
// ---------------------------------------------------------------------------

const maintenanceTicketSchema = z.object({
  ticketNumber: z.string().trim().min(1).max(100),
  assetCode: z.string().trim().min(1).max(100),
  assetName: z.string().trim().min(1).max(200),
  reporterEmployeeId: z.string().uuid(),
  issueType: z.enum(["Kerusakan Hardware", "Perawatan Rutin", "Perbaikan Fasilitas / Gedung", "Permintaan Penggantian"]),
  priority: z.enum(["Rendah", "Sedang", "Tinggi", "Darurat"]),
  description: z.string().trim().min(1).max(2000),
  reportedAt: z.string().trim().min(1).max(40),
  status: z.enum(["Tiket Dibuka", "Sedang Dikerjakan GA", "Menunggu Sparepart", "Selesai Diperbaiki", "Aset Diganti Baru"]).optional(),
  assignedTechnician: z.string().trim().max(200).optional().nullable(),
  cost: z.number().int().min(0).optional().nullable(),
  resolutionNotes: z.string().trim().max(2000).optional().nullable(),
});

tenantRouter.get("/asset-maintenance-tickets", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(assetMaintenanceTickets).where(eq(assetMaintenanceTickets.tenantId, tenantId)));
});

tenantRouter.post("/asset-maintenance-tickets", validateBody(maintenanceTicketSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(assetMaintenanceTickets).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/asset-maintenance-tickets/:id", validateParams(uuidParam("id")), validateBody(maintenanceTicketSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(assetMaintenanceTickets).where(and(eq(assetMaintenanceTickets.id, req.params.id), eq(assetMaintenanceTickets.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Tiket maintenance tidak ditemukan" });
  const [updated] = await db.update(assetMaintenanceTickets).set(req.body).where(eq(assetMaintenanceTickets.id, req.params.id)).returning();
  res.json(updated);
});

// ---------------------------------------------------------------------------
// GA Asset & Procurement — Asset Relocation Logs
// ---------------------------------------------------------------------------

const assetRelocationSchema = z.object({
  assetCode: z.string().trim().min(1).max(100),
  assetName: z.string().trim().min(1).max(200),
  fromBuilding: z.string().trim().min(1).max(200),
  fromRoom: z.string().trim().min(1).max(200),
  fromEmployeeId: z.string().uuid().optional().nullable(),
  toBuilding: z.string().trim().min(1).max(200),
  toRoom: z.string().trim().min(1).max(200),
  toEmployeeId: z.string().uuid().optional().nullable(),
  relocationDate: z.string().trim().min(1).max(20),
  approvedBy: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(2000).optional(),
});

tenantRouter.get("/asset-relocations", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(assetRelocationLogs).where(eq(assetRelocationLogs.tenantId, tenantId)));
});

tenantRouter.post("/asset-relocations", validateBody(assetRelocationSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(assetRelocationLogs).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

// ---------------------------------------------------------------------------
// GA Asset & Procurement — Procurement Orders
// ---------------------------------------------------------------------------

const procurementOrderSchema = z.object({
  type: z.enum(["Pengadaan Barang", "Project / Jasa", "Barang", "Proyek / Jasa Kontrak"]).optional().nullable(),
  prNumber: z.string().trim().min(1).max(100),
  poNumber: z.string().trim().max(100).optional(),
  quotationNumber: z.string().trim().max(100).optional().nullable(),
  contractNumber: z.string().trim().max(100).optional().nullable(),
  vendorId: z.string().uuid().optional().nullable(),
  vendorName: z.string().trim().min(1).max(200),
  itemName: z.string().trim().min(1).max(500),
  quantity: z.number().int().min(1),
  estimatedCost: z.number().int().min(0),
  requestor: z.string().trim().min(1).max(200),
  department: z.string().trim().min(1).max(200),
  status: z.enum(["Pengajuan PR", "Quotation Diterima", "Disetujui HR/Finance", "PO Terbit", "Kontrak Berjalan", "Barang Diterima / Project Selesai", "Barang Diterima"]).optional(),
  requestedDate: z.string().trim().min(1).max(20),
  warrantyMonths: z.number().int().min(0).max(240).optional().nullable(),
  receivedDate: z.string().trim().max(20).optional().nullable(),
  // Transient hints used only when status flips to received (not stored on the order).
  receivingCategory: z.enum(["Laptop & Komputer", "Kendaraan Operasional", "Fasilitas Gedung", "Furniture", "Perangkat Jaringan"]).optional(),
  receivingBuilding: z.string().trim().max(200).optional(),
  receivingRoom: z.string().trim().max(200).optional(),
});

tenantRouter.get("/procurement-orders", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(procurementOrders).where(eq(procurementOrders.tenantId, tenantId)));
});

tenantRouter.post("/procurement-orders", validateBody(procurementOrderSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(procurementOrders).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/procurement-orders/:id", validateParams(uuidParam("id")), validateBody(procurementOrderSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(procurementOrders).where(and(eq(procurementOrders.id, req.params.id), eq(procurementOrders.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Procurement order tidak ditemukan" });
  const { receivingCategory, receivingBuilding, receivingRoom, ...orderPatch } = req.body;
  if (orderPatch.status && orderPatch.status !== existing.status && isPostApprovalProcurementStatus(orderPatch.status) && (await hasPendingProcurementApproval(tenantId, existing.id))) {
    return res.status(409).json({ error: "PR ini masih menunggu persetujuan di Approval Center dan belum bisa dilanjutkan." });
  }
  const [updated] = await db.update(procurementOrders).set(orderPatch).where(eq(procurementOrders.id, req.params.id)).returning();
  // Marking goods received now creates the asset records (vendor/PO/warranty carried over) instead of leaving GA to retype them.
  let generatedAssets: unknown[] = [];
  if (isReceivedStatus(updated.status)) {
    generatedAssets = await generateAssetsFromReceivedOrder({ tenantId, orderId: updated.id, category: receivingCategory, building: receivingBuilding, room: receivingRoom });
    if (generatedAssets.length) await logAudit({ actorUserId: req.session!.userId, tenantId, action: "procurement.assets_generated", details: { orderId: updated.id, count: generatedAssets.length } });
  }
  res.json({ ...updated, generatedAssetCount: generatedAssets.length });
});

// ---------------------------------------------------------------------------
// RBAC — Role Definitions & Permission Matrix
// ---------------------------------------------------------------------------

const roleDefinitionSchema = z.object({
  id: z.string().trim().min(1).max(100).regex(/^[a-z0-9_]+$/, "Kode role hanya boleh huruf kecil, angka, underscore"),
  label: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000),
  badgeClass: z.string().trim().max(200).optional().nullable(),
  isSystem: z.boolean().optional(),
});

tenantRouter.get("/rbac-roles", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(roleDefinitions).where(eq(roleDefinitions.tenantId, tenantId)));
});

tenantRouter.post("/rbac-roles", validateBody(roleDefinitionSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(roleDefinitions).where(and(eq(roleDefinitions.tenantId, tenantId), eq(roleDefinitions.id, req.body.id))).limit(1);
  if (existing) return res.status(409).json({ error: `Role dengan kode '${req.body.id}' sudah terdaftar` });
  const [created] = await db.insert(roleDefinitions).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.delete("/rbac-roles/:roleKey", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(roleDefinitions).where(and(eq(roleDefinitions.tenantId, tenantId), eq(roleDefinitions.id, req.params.roleKey))).limit(1);
  if (!existing) return res.status(404).json({ error: "Role tidak ditemukan" });
  await db.delete(rolePermissionEntries).where(and(eq(rolePermissionEntries.tenantId, tenantId), eq(rolePermissionEntries.roleKey, req.params.roleKey)));
  await db.delete(roleDefinitions).where(and(eq(roleDefinitions.tenantId, tenantId), eq(roleDefinitions.id, req.params.roleKey)));
  res.json({ ok: true });
});

const rolePermissionSchema = z.object({
  view: z.boolean(),
  create: z.boolean(),
  edit: z.boolean(),
  delete: z.boolean(),
  approve: z.boolean(),
  export: z.boolean(),
});

tenantRouter.get("/rbac-permissions", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const rows = await db.select().from(rolePermissionEntries).where(eq(rolePermissionEntries.tenantId, tenantId));
  const map: Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean; export: boolean }> = {};
  for (const row of rows) {
    map[`${row.moduleKey}__${row.roleKey}`] = { view: row.view, create: row.create, edit: row.edit, delete: row.delete, approve: row.approve, export: row.export };
  }
  res.json(map);
});

tenantRouter.put("/rbac-permissions/:moduleKey/:roleKey", validateBody(rolePermissionSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const { moduleKey, roleKey } = req.params;
  const [existing] = await db
    .select()
    .from(rolePermissionEntries)
    .where(and(eq(rolePermissionEntries.tenantId, tenantId), eq(rolePermissionEntries.moduleKey, moduleKey), eq(rolePermissionEntries.roleKey, roleKey)))
    .limit(1);
  if (existing) {
    const [updated] = await db
      .update(rolePermissionEntries)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(rolePermissionEntries.tenantId, tenantId), eq(rolePermissionEntries.moduleKey, moduleKey), eq(rolePermissionEntries.roleKey, roleKey)))
      .returning();
    return res.json(updated);
  }
  const [created] = await db.insert(rolePermissionEntries).values({ ...req.body, tenantId, moduleKey, roleKey }).returning();
  res.status(201).json(created);
});

// ---------------------------------------------------------------------------
// Employee Accounts — real ESS/MSS logins (user, 2026-11-09: "RBAC granular
// tidak ditegakkan / tidak ada role karyawan sungguhan"). An admin enables
// login for an employee here, which is deliberately a separate step from
// the employee existing as an HR record — see server/db/schema.ts's
// employeeAccounts comment for why these are two different tables.
// ---------------------------------------------------------------------------

tenantRouter.get("/employee-accounts", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (visibleEmployeeIds.length === 0) return res.json([]);
  const rows = await db
    .select({ id: employeeAccounts.id, employeeId: employeeAccounts.employeeId, email: employeeAccounts.email, roleKey: employeeAccounts.roleKey, isActive: employeeAccounts.isActive, createdAt: employeeAccounts.createdAt })
    .from(employeeAccounts)
    .where(and(eq(employeeAccounts.tenantId, tenantId), inArray(employeeAccounts.employeeId, visibleEmployeeIds)));
  res.json(rows);
});

const createEmployeeAccountSchema = z.object({
  employeeId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  roleKey: z.string().trim().min(1).max(100).default("employee"),
});

tenantRouter.post("/employee-accounts", validateBody(createEmployeeAccountSchema), rejectBreachedPassword((req) => req.body.password), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  if (!visibleEmployeeIds.includes(req.body.employeeId)) return res.status(403).json({ error: "Karyawan di luar ruang lingkup Anda" });

  const [existing] = await db.select().from(employeeAccounts).where(eq(employeeAccounts.employeeId, req.body.employeeId)).limit(1);
  if (existing) return res.status(400).json({ error: "Karyawan ini sudah memiliki akun login" });
  const [existingEmail] = await db.select().from(employeeAccounts).where(and(eq(employeeAccounts.tenantId, tenantId), eq(employeeAccounts.email, req.body.email))).limit(1);
  if (existingEmail) return res.status(400).json({ error: "Email tersebut sudah digunakan untuk akun karyawan lain" });

  await ensureDefaultEmployeeRbac(tenantId);
  const passwordHash = await bcrypt.hash(req.body.password, 10);
  const [created] = await db
    .insert(employeeAccounts)
    .values({ tenantId, employeeId: req.body.employeeId, email: req.body.email, passwordHash, roleKey: req.body.roleKey })
    .returning({ id: employeeAccounts.id, employeeId: employeeAccounts.employeeId, email: employeeAccounts.email, roleKey: employeeAccounts.roleKey, isActive: employeeAccounts.isActive, createdAt: employeeAccounts.createdAt });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "employee_account.created", details: { employeeId: req.body.employeeId, email: req.body.email } });
  res.status(201).json(created);
});

const updateEmployeeAccountSchema = z.object({
  roleKey: z.string().trim().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(200).optional(),
});

tenantRouter.put("/employee-accounts/:id", validateParams(uuidParam("id")), validateBody(updateEmployeeAccountSchema), rejectBreachedPassword((req) => req.body.password), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEmployeeIds = await resolveVisibleEmployeeIds(req, tenantId);
  const [existing] = await db.select().from(employeeAccounts).where(and(eq(employeeAccounts.id, req.params.id), eq(employeeAccounts.tenantId, tenantId))).limit(1);
  if (!existing || !visibleEmployeeIds.includes(existing.employeeId)) return res.status(404).json({ error: "Akun karyawan tidak ditemukan" });

  const { password, ...rest } = req.body as z.infer<typeof updateEmployeeAccountSchema>;
  const patch: Partial<typeof employeeAccounts.$inferInsert> = { ...rest };
  if (password) patch.passwordHash = await bcrypt.hash(password, 10);

  const [updated] = await db
    .update(employeeAccounts)
    .set(patch)
    .where(eq(employeeAccounts.id, existing.id))
    .returning({ id: employeeAccounts.id, employeeId: employeeAccounts.employeeId, email: employeeAccounts.email, roleKey: employeeAccounts.roleKey, isActive: employeeAccounts.isActive, createdAt: employeeAccounts.createdAt });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "employee_account.updated", details: { employeeAccountId: existing.id, passwordChanged: Boolean(password) } });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Company Calendar
// ---------------------------------------------------------------------------

const calendarEventSchema = z.object({
  entityId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(200),
  date: z.string().trim().min(1).max(20),
  type: z.enum(["Cuti Bersama", "Libur Nasional", "Event", "Libur Perusahaan", "Cuti Bersama Perusahaan"]),
  deductsLeaveBucket: z.boolean().optional(),
  description: z.string().trim().max(1000).optional().nullable(),
});

tenantRouter.get("/calendar-events", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  const rows = await db.select().from(companyCalendarEvents).where(eq(companyCalendarEvents.tenantId, tenantId));
  res.json(rows.filter((r) => !r.entityId || visibleEntityIds.includes(r.entityId)));
});

tenantRouter.post("/calendar-events", validateBody(calendarEventSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  if (req.body.entityId) {
    const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
    if (!visibleEntityIds.includes(req.body.entityId)) return res.status(403).json({ error: "Entitas di luar ruang lingkup Anda" });
  }
  const [created] = await db.insert(companyCalendarEvents).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

// ---------------------------------------------------------------------------
// Audit Trail — tenant-facing business activity log
// ---------------------------------------------------------------------------

const auditTrailEntrySchema = z.object({
  entityId: z.string().uuid().optional().nullable(),
  actorId: z.string().trim().min(1).max(100),
  actorName: z.string().trim().min(1).max(200),
  actorRole: z.string().trim().min(1).max(100),
  module: z.string().trim().min(1).max(200),
  action: z.string().trim().min(1).max(200),
  recordId: z.string().trim().min(1).max(200),
  changesSummary: z.string().trim().min(1).max(2000),
  details: z.array(z.unknown()).optional().nullable(),
});

tenantRouter.get("/audit-trail", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const visibleEntityIds = await resolveVisibleEntityIds(req, tenantId);
  const rows = await db
    .select()
    .from(auditTrailEntries)
    .where(eq(auditTrailEntries.tenantId, tenantId))
    .orderBy(desc(auditTrailEntries.timestamp))
    .limit(2000);
  res.json(rows.filter((r) => !r.entityId || visibleEntityIds.includes(r.entityId)));
});

tenantRouter.post("/audit-trail", validateBody(auditTrailEntrySchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(auditTrailEntries).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

// ---------------------------------------------------------------------------
// Document Management — Templates
// ---------------------------------------------------------------------------

const documentTemplateSchema = z.object({
  type: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(300),
  numberingPattern: z.string().trim().min(1).max(300),
  paperSize: z.enum(["A4", "F4", "A5"]).optional().nullable(),
  letterHeadTitle: z.string().trim().min(1).max(300),
  letterHeadAddress: z.string().trim().min(1).max(1000),
  letterHeadNpwp: z.string().trim().max(100).optional().nullable(),
  letterHeadPhone: z.string().trim().max(100).optional().nullable(),
  letterHeadEmail: z.string().trim().max(200).optional().nullable(),
  defaultBody: z.string().max(200000),
  showQrSignature: z.boolean().optional(),
  signeeTitle: z.string().trim().min(1).max(200),
  signeeRole: z.string().trim().min(1).max(200),
  sourceType: z.enum(["system", "uploaded_docx"]).optional().nullable(),
  fileName: z.string().trim().max(300).optional().nullable(),
  fileSize: z.string().trim().max(50).optional().nullable(),
  uploadedAt: z.string().trim().max(40).optional().nullable(),
  rawHtmlTemplate: z.string().max(2000000).optional().nullable(),
  extractedPlaceholders: z.array(z.string()).optional().nullable(),
  kopPosition: z.enum(["top", "none", "embedded"]).optional().nullable(),
  qrPosition: z.enum(["bottom-right", "bottom-left", "inline", "none"]).optional().nullable(),
  footerText: z.string().trim().max(1000).optional().nullable(),
});

tenantRouter.get("/document-templates", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(documentTemplates).where(eq(documentTemplates.tenantId, tenantId)));
});

tenantRouter.post("/document-templates", validateBody(documentTemplateSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(documentTemplates).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/document-templates/:id", validateParams(uuidParam("id")), validateBody(documentTemplateSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(documentTemplates).where(and(eq(documentTemplates.id, req.params.id), eq(documentTemplates.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Template dokumen tidak ditemukan" });
  const [updated] = await db.update(documentTemplates).set(req.body).where(eq(documentTemplates.id, req.params.id)).returning();
  res.json(updated);
});

tenantRouter.delete("/document-templates/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(documentTemplates).where(and(eq(documentTemplates.id, req.params.id), eq(documentTemplates.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Template dokumen tidak ditemukan" });
  await db.update(officialDocuments).set({ templateId: null }).where(eq(officialDocuments.templateId, req.params.id));
  await db.delete(documentTemplates).where(eq(documentTemplates.id, req.params.id));
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Document Management — Official Documents
// ---------------------------------------------------------------------------

/**
 * Business-process fix (user, 2026-11-10: "QR muncul saat sudah approve
 * dan kosong jika belum approve sesuai dengan template dokumen") — a
 * document used to be created already "Resmi Diterbitkan" with a QR the
 * FRONTEND invented (`Math.random()`-based hash, no server involvement),
 * because this schema let the client supply both `status` and
 * `qrVerificationUrl` directly. Neither field is client-settable anymore;
 * see POST /documents and /documents/:id/signatories/:index/confirm below,
 * the only two places that ever write them.
 */
const officialDocumentSchema = z.object({
  documentNumber: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(200),
  templateId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(400),
  targetEmployeeId: z.string().uuid().optional().nullable(),
  issueDate: z.string().trim().min(1).max(20),
  signeeName: z.string().trim().min(1).max(200),
  signeeRole: z.string().trim().min(1).max(200),
  contentPreview: z.string().max(500000),
  renderedHtml: z.string().max(2000000).optional().nullable(),
  isFromDocxTemplate: z.boolean().optional(),
});

tenantRouter.get("/documents", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(officialDocuments).where(eq(officialDocuments.tenantId, tenantId)));
});

tenantRouter.post("/documents", validateBody(officialDocumentSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  if (req.body.templateId) {
    const [tmpl] = await db.select().from(documentTemplates).where(and(eq(documentTemplates.id, req.body.templateId), eq(documentTemplates.tenantId, tenantId))).limit(1);
    if (!tmpl) return res.status(404).json({ error: "Template dokumen tidak ditemukan" });
  }

  const created = await createOfficialDocumentRecord({ tenantId, data: req.body });
  const signatories = created.signatories;
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "document.created", details: { documentId: created.id, type: created.type, signatoryCount: signatories.length } });
  res.status(201).json(created);
});

const confirmDocumentSignatorySchema = z.object({
  confirmedByName: z.string().trim().min(1).max(200).optional(),
});

/**
 * The actual "approve" action this whole redesign is for — confirms ONE
 * signatory slot on ONE document. Only once every `isRequired` slot has a
 * confirmedAt does the document flip to "Resmi Diterbitkan" and get a real,
 * server-generated QR; every confirmation before that leaves it
 * "Menunggu Tanda Tangan" with qrVerificationUrl staying null, which is
 * exactly the empty-until-approved behavior that was missing.
 */
tenantRouter.post(
  "/documents/:id/signatories/:index/confirm",
  validateParams(z.object({ id: z.string().uuid(), index: z.coerce.number().int().min(0) })),
  validateBody(confirmDocumentSignatorySchema),
  async (req, res) => {
    const tenantId = req.session!.tenantId!;
    const index = Number(req.params.index);
    const [doc] = await db.select().from(officialDocuments).where(and(eq(officialDocuments.id, req.params.id), eq(officialDocuments.tenantId, tenantId))).limit(1);
    if (!doc) return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    if (doc.status === "Dicabut" || doc.status === "Digantikan") return res.status(400).json({ error: `Dokumen ini berstatus ${doc.status} dan tidak dapat ditandatangani.` });
    if (doc.status === "Resmi Diterbitkan") return res.status(400).json({ error: "Dokumen ini sudah resmi diterbitkan, seluruh tanda tangan sudah lengkap." });

    const signatories = [...doc.signatories];
    if (!signatories[index]) return res.status(404).json({ error: "Slot penandatangan tidak ditemukan" });
    if (signatories[index].confirmedAt) return res.status(400).json({ error: "Slot penandatangan ini sudah dikonfirmasi sebelumnya." });

    signatories[index] = {
      ...signatories[index],
      confirmedByEmployeeId: req.session!.employeeId ?? null,
      confirmedByName: req.body.confirmedByName?.trim() || doc.signeeName,
      confirmedAt: new Date().toISOString(),
    };

    const nowComplete = isFullySigned(signatories);
    const [updated] = await db
      .update(officialDocuments)
      .set({
        signatories,
        status: nowComplete ? "Resmi Diterbitkan" : doc.status,
        qrVerificationUrl: nowComplete ? buildVerificationUrl(doc.documentNumber) : doc.qrVerificationUrl,
      })
      .where(eq(officialDocuments.id, doc.id))
      .returning();

    await logAudit({
      actorUserId: req.session!.role === "tenant_admin" ? req.session!.userId : null,
      tenantId,
      action: nowComplete ? "document.fully_signed_issued" : "document.signatory_confirmed",
      details: { documentId: doc.id, signatoryIndex: index, roleLabel: signatories[index].roleLabel },
    });
    res.json(updated);
  }
);

/**
 * A document that is no longer valid (a revised SP, a superseded SK, a
 * withdrawn letter) is marked "Dicabut" or "Digantikan" with a mandatory
 * reason, never deleted — the number and QR history stay auditable. Only an
 * already-issued document can be revoked/superseded.
 */
const revokeDocumentSchema = z.object({
  mode: z.enum(["Dicabut", "Digantikan"]),
  reason: z.string().trim().min(3, "Alasan wajib diisi").max(1000),
  replacedByDocumentId: z.string().uuid().optional().nullable(),
});
tenantRouter.post("/documents/:id/revoke", validateParams(uuidParam("id")), validateBody(revokeDocumentSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [doc] = await db.select().from(officialDocuments).where(and(eq(officialDocuments.id, req.params.id), eq(officialDocuments.tenantId, tenantId))).limit(1);
  if (!doc) return res.status(404).json({ error: "Dokumen tidak ditemukan" });
  if (doc.status !== "Resmi Diterbitkan") return res.status(400).json({ error: "Hanya dokumen yang sudah resmi diterbitkan yang dapat dicabut atau digantikan." });
  if (req.body.mode === "Digantikan") {
    if (!req.body.replacedByDocumentId) return res.status(400).json({ error: "Dokumen pengganti wajib dipilih." });
    const [replacement] = await db.select({ id: officialDocuments.id }).from(officialDocuments).where(and(eq(officialDocuments.id, req.body.replacedByDocumentId), eq(officialDocuments.tenantId, tenantId))).limit(1);
    if (!replacement || replacement.id === doc.id) return res.status(400).json({ error: "Dokumen pengganti tidak valid." });
  }
  const [updated] = await db.update(officialDocuments).set({ status: req.body.mode }).where(eq(officialDocuments.id, doc.id)).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "document.revoked", details: { documentId: doc.id, documentNumber: doc.documentNumber, mode: req.body.mode, reason: req.body.reason, replacedByDocumentId: req.body.replacedByDocumentId ?? null } });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// eNPS Engagement Survey
// ---------------------------------------------------------------------------

tenantRouter.get("/enps-survey", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [row] = await db
    .select()
    .from(enpsSurveys)
    .where(eq(enpsSurveys.tenantId, tenantId))
    .orderBy(desc(enpsSurveys.createdAt))
    .limit(1);
  res.json(row ?? null);
});

const enpsResponseSchema = z.object({
  score: z.number().int().min(0).max(10),
  department: z.string().trim().min(1).max(200),
  feedback: z.string().trim().max(2000).optional().nullable(),
});

tenantRouter.post("/enps-survey/responses", validateBody(enpsResponseSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  let [survey] = await db
    .select()
    .from(enpsSurveys)
    .where(eq(enpsSurveys.tenantId, tenantId))
    .orderBy(desc(enpsSurveys.createdAt))
    .limit(1);

  if (!survey) {
    const now = new Date();
    [survey] = await db
      .insert(enpsSurveys)
      .values({
        tenantId,
        period: `${now.getFullYear()}`,
        title: "Survei Kepuasan & Employee Net Promoter Score",
        isActive: true,
      })
      .returning();
  }

  const newResponse = {
    id: crypto.randomUUID(),
    score: req.body.score,
    department: req.body.department,
    feedback: req.body.feedback ?? undefined,
    submittedAt: new Date().toISOString().split("T")[0],
  };
  const responses = [...(survey.responses as any[]), newResponse];
  const promoters = responses.filter((r) => r.score >= 9).length;
  const passives = responses.filter((r) => r.score >= 7 && r.score <= 8).length;
  const detractors = responses.filter((r) => r.score <= 6).length;
  const total = responses.length;
  const score = Math.round(((promoters - detractors) / total) * 100);

  const [updated] = await db
    .update(enpsSurveys)
    .set({ responses, totalResponses: total, promoters, passives, detractors, score })
    .where(eq(enpsSurveys.id, survey.id))
    .returning();
  res.status(201).json(updated);
});

// ---------------------------------------------------------------------------
// Vendor Invoices (AP)
// ---------------------------------------------------------------------------

const vendorInvoiceSchema = z.object({
  vendorId: z.string().uuid(),
  vendorName: z.string().trim().min(1).max(200),
  poNumber: z.string().trim().max(200).optional(),
  invoiceNumber: z.string().trim().min(1).max(200),
  invoiceDate: z.string().trim().min(1).max(20),
  dueDate: z.string().trim().min(1).max(20),
  amount: z.number().int().min(0),
  status: z.enum(["Belum Bill", "Sudah Bill"]).optional(),
  paidDate: z.string().trim().max(20).optional().nullable(),
  paymentMethod: z.string().trim().max(100).optional().nullable(),
  taxInvoiceNumber: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

tenantRouter.get("/vendor-invoices", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  res.json(await db.select().from(vendorInvoices).where(eq(vendorInvoices.tenantId, tenantId)));
});

tenantRouter.post("/vendor-invoices", validateBody(vendorInvoiceSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(vendorInvoices).values({ ...req.body, tenantId }).returning();
  res.status(201).json(created);
});

tenantRouter.put("/vendor-invoices/:id", validateParams(uuidParam("id")), validateBody(vendorInvoiceSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(vendorInvoices).where(and(eq(vendorInvoices.id, req.params.id), eq(vendorInvoices.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Invoice vendor tidak ditemukan" });
  const [updated] = await db.update(vendorInvoices).set(req.body).where(eq(vendorInvoices.id, req.params.id)).returning();
  res.json(updated);
});

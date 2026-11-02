import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq, inArray, and, isNull } from "drizzle-orm";
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
} from "../db/schema.ts";
import { requireTenantAdmin } from "../middleware/auth.ts";
import { validateBody, validateParams, uuidParam } from "../lib/validate.ts";
import { computeNewEntityClosureRows, buildEntityTree, applyChangeSet, resolveNikPattern } from "../lib/orgStructure.ts";
import { logAudit } from "../lib/audit.ts";

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

tenantRouter.post("/entities", validateBody(createEntitySchema), async (req, res) => {
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
tenantRouter.get("/entities", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const viewAsEntityId = typeof req.query.viewAsEntityId === "string" ? req.query.viewAsEntityId : undefined;

  if (!viewAsEntityId) {
    const rows = await db.select().from(companyEntities).where(eq(companyEntities.tenantId, tenantId));
    return res.json(rows);
  }

  const visibleRows = await db.select({ id: entityClosure.descendantEntityId }).from(entityClosure).where(eq(entityClosure.ancestorEntityId, viewAsEntityId));
  const visibleIds = visibleRows.map((r) => r.id);
  if (visibleIds.length === 0) return res.json([]);
  const rows = await db.select().from(companyEntities).where(and(eq(companyEntities.tenantId, tenantId), inArray(companyEntities.id, visibleIds)));
  res.json(rows);
});

/** Same visibility rule as above, nested into a nested tree for the "lihat bertingkat" view. */
tenantRouter.get("/entities/tree", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const rows = await db.select().from(companyEntities).where(eq(companyEntities.tenantId, tenantId));
  res.json(buildEntityTree(rows));
});

tenantRouter.get("/entities/:id", validateParams(uuidParam("id")), async (req, res) => {
  const [entity] = await db
    .select()
    .from(companyEntities)
    .where(and(eq(companyEntities.id, req.params.id), eq(companyEntities.tenantId, req.session!.tenantId!)))
    .limit(1);
  if (!entity) return res.status(404).json({ error: "Entitas tidak ditemukan" });
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
  const entityId = req.params.id;
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

tenantRouter.post("/users", validateBody(createUserSchema), async (req, res) => {
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

async function requireUnlockedEntity(entityId: string, tenantId: string): Promise<UnlockCheck> {
  const [entity] = await db.select().from(companyEntities).where(and(eq(companyEntities.id, entityId), eq(companyEntities.tenantId, tenantId))).limit(1);
  if (!entity) return { ok: false, status: 404, error: "Entitas tidak ditemukan" };
  if (entity.isGovernanceLocked) return { ok: false, status: 403, error: "Entitas ini sudah terkunci — ajukan perubahan lewat proposal restrukturisasi resmi" };
  return { ok: true, entity };
}

const divisionSchema = z.object({
  entityId: z.string().uuid(),
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(2).max(200),
  headTitle: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
});

/** Tenant-wide listing (every entity's divisions) — the frontend filters by entity client-side, same pattern as grades/office-locations below. */
tenantRouter.get("/divisions", async (req, res) => {
  res.json(await db.select().from(companyDivisions).where(eq(companyDivisions.tenantId, req.session!.tenantId!)));
});

tenantRouter.post("/divisions", validateBody(divisionSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const check = await requireUnlockedEntity(req.body.entityId, tenantId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [created] = await db.insert(companyDivisions).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "division.create", details: { divisionId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/divisions/:id", validateParams(uuidParam("id")), validateBody(divisionSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(companyDivisions).where(and(eq(companyDivisions.id, req.params.id), eq(companyDivisions.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Divisi tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [updated] = await db.update(companyDivisions).set(req.body).where(eq(companyDivisions.id, existing.id)).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "division.update", details: { divisionId: updated.id } });
  res.json(updated);
});

tenantRouter.delete("/divisions/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(companyDivisions).where(and(eq(companyDivisions.id, req.params.id), eq(companyDivisions.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Divisi tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  await db.delete(companyDivisions).where(eq(companyDivisions.id, existing.id));
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "division.delete", details: { divisionId: existing.id } });
  res.json({ ok: true });
});

const departmentSchema = z.object({
  entityId: z.string().uuid(),
  divisionId: z.string().uuid().optional(),
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(2).max(200),
  headTitle: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
});

tenantRouter.get("/departments", async (req, res) => {
  res.json(await db.select().from(companyDepartments).where(eq(companyDepartments.tenantId, req.session!.tenantId!)));
});

tenantRouter.post("/departments", validateBody(departmentSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const check = await requireUnlockedEntity(req.body.entityId, tenantId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [created] = await db.insert(companyDepartments).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "department.create", details: { departmentId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/departments/:id", validateParams(uuidParam("id")), validateBody(departmentSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(companyDepartments).where(and(eq(companyDepartments.id, req.params.id), eq(companyDepartments.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Departemen tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [updated] = await db.update(companyDepartments).set(req.body).where(eq(companyDepartments.id, existing.id)).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "department.update", details: { departmentId: updated.id } });
  res.json(updated);
});

tenantRouter.delete("/departments/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(companyDepartments).where(and(eq(companyDepartments.id, req.params.id), eq(companyDepartments.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Departemen tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  await db.delete(companyDepartments).where(eq(companyDepartments.id, existing.id));
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "department.delete", details: { departmentId: existing.id } });
  res.json({ ok: true });
});

const positionSchema = z.object({
  entityId: z.string().uuid(),
  code: z.string().trim().min(1).max(50),
  title: z.string().trim().min(2).max(200),
  defaultLevel: z.number().int().min(1).max(5).optional(),
  divisionId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  jobFamily: z.string().trim().max(100).optional(),
  jobGrade: z.string().trim().max(50).optional(),
  minGrade: z.string().trim().max(50).optional(),
  maxGrade: z.string().trim().max(50).optional(),
  gradingScheme: z.enum(["single", "broadbanding"]).optional(),
  description: z.string().trim().max(1000).optional(),
  requirements: z.string().trim().max(1000).optional(),
});

tenantRouter.get("/positions", async (req, res) => {
  res.json(await db.select().from(masterJobPositions).where(eq(masterJobPositions.tenantId, req.session!.tenantId!)));
});

tenantRouter.post("/positions", validateBody(positionSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const check = await requireUnlockedEntity(req.body.entityId, tenantId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [created] = await db.insert(masterJobPositions).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "position.create", details: { positionId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/positions/:id", validateParams(uuidParam("id")), validateBody(positionSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(masterJobPositions).where(and(eq(masterJobPositions.id, req.params.id), eq(masterJobPositions.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Posisi tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [updated] = await db.update(masterJobPositions).set(req.body).where(eq(masterJobPositions.id, existing.id)).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "position.update", details: { positionId: updated.id } });
  res.json(updated);
});

tenantRouter.delete("/positions/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(masterJobPositions).where(and(eq(masterJobPositions.id, req.params.id), eq(masterJobPositions.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Posisi tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  await db.delete(masterJobPositions).where(eq(masterJobPositions.id, existing.id));
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "position.delete", details: { positionId: existing.id } });
  res.json({ ok: true });
});

const orgNodeSchema = z.object({
  entityId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  divisionId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  code: z.string().trim().max(50).optional(),
  jobGrade: z.string().trim().max(50).optional(),
  description: z.string().trim().max(1000).optional(),
  reportsToId: z.string().uuid().optional(),
  relationType: z.enum(["struktural", "administratif"]).optional(),
  isVacant: z.boolean().optional(),
  level: z.number().int().min(1).optional(),
  masterJobPositionId: z.string().uuid().optional(),
});

tenantRouter.get("/org-nodes", async (req, res) => {
  res.json(await db.select().from(orgStructureNodes).where(eq(orgStructureNodes.tenantId, req.session!.tenantId!)));
});

tenantRouter.post("/org-nodes", validateBody(orgNodeSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const check = await requireUnlockedEntity(req.body.entityId, tenantId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [created] = await db.insert(orgStructureNodes).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "org_node.create", details: { orgNodeId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/org-nodes/:id", validateParams(uuidParam("id")), validateBody(orgNodeSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(orgStructureNodes).where(and(eq(orgStructureNodes.id, req.params.id), eq(orgStructureNodes.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Posisi struktur tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
  const [updated] = await db.update(orgStructureNodes).set(req.body).where(eq(orgStructureNodes.id, existing.id)).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "org_node.update", details: { orgNodeId: updated.id } });
  res.json(updated);
});

tenantRouter.delete("/org-nodes/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(orgStructureNodes).where(and(eq(orgStructureNodes.id, req.params.id), eq(orgStructureNodes.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Posisi struktur tidak ditemukan" });
  const check = await requireUnlockedEntity(existing.entityId, tenantId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });
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
  entityId: z.string().uuid().optional(),
  gradeCode: z.string().trim().min(1).max(50),
  gradeName: z.string().trim().min(1).max(200),
  minSalary: z.number().int().min(0).optional(),
  midSalary: z.number().int().min(0).optional(),
  maxSalary: z.number().int().min(0).optional(),
  singleValueSalary: z.number().int().min(0).optional(),
  notes: z.string().trim().max(1000).optional(),
});

tenantRouter.post("/grades", validateBody(gradeSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(gradeSalaryRanges).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "grade.create", details: { gradeId: created.id } });
  res.status(201).json(created);
});

tenantRouter.get("/grades", async (req, res) => {
  res.json(await db.select().from(gradeSalaryRanges).where(eq(gradeSalaryRanges.tenantId, req.session!.tenantId!)));
});

tenantRouter.put("/grades/:id", validateParams(uuidParam("id")), validateBody(gradeSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(gradeSalaryRanges)
    .set(req.body)
    .where(and(eq(gradeSalaryRanges.id, req.params.id), eq(gradeSalaryRanges.tenantId, tenantId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Grade tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "grade.update", details: { gradeId: updated.id } });
  res.json(updated);
});

tenantRouter.delete("/grades/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(gradeSalaryRanges).where(and(eq(gradeSalaryRanges.id, req.params.id), eq(gradeSalaryRanges.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Grade tidak ditemukan" });
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
  const [created] = await db
    .insert(orgChangeProposals)
    .values({ ...req.body, tenantId, proposedByUserId: req.session!.userId, status: "Draft" })
    .returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "org_change_proposal.create", details: { proposalId: created.id, entityId: created.entityId } });
  res.status(201).json(created);
});

/** Riwayat perubahan struktur (history) — list, optionally filtered by entity. */
tenantRouter.get("/org-change-proposals", async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const entityId = typeof req.query.entityId === "string" ? req.query.entityId : undefined;
  const rows = await db
    .select()
    .from(orgChangeProposals)
    .where(entityId ? and(eq(orgChangeProposals.tenantId, tenantId), eq(orgChangeProposals.entityId, entityId)) : eq(orgChangeProposals.tenantId, tenantId));
  res.json(rows);
});

tenantRouter.get("/org-change-proposals/:id", validateParams(uuidParam("id")), async (req, res) => {
  const [proposal] = await db
    .select()
    .from(orgChangeProposals)
    .where(and(eq(orgChangeProposals.id, req.params.id), eq(orgChangeProposals.tenantId, req.session!.tenantId!)))
    .limit(1);
  if (!proposal) return res.status(404).json({ error: "Proposal tidak ditemukan" });
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
  if (existing.status !== "Draft") return res.status(400).json({ error: "Hanya proposal berstatus Draft yang bisa diubah" });

  const [updated] = await db.update(orgChangeProposals).set(req.body).where(eq(orgChangeProposals.id, existing.id)).returning();
  res.json(updated);
});

tenantRouter.post("/org-change-proposals/:id/submit", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [existing] = await db.select().from(orgChangeProposals).where(and(eq(orgChangeProposals.id, req.params.id), eq(orgChangeProposals.tenantId, tenantId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Proposal tidak ditemukan" });
  if (existing.status !== "Draft") return res.status(400).json({ error: "Hanya proposal berstatus Draft yang bisa diajukan" });

  const [updated] = await db.update(orgChangeProposals).set({ status: "PendingApproval" }).where(eq(orgChangeProposals.id, existing.id)).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "org_change_proposal.submit", details: { proposalId: updated.id } });
  res.json(updated);
});

tenantRouter.post("/org-change-proposals/:id/approve", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [proposal] = await db.select().from(orgChangeProposals).where(and(eq(orgChangeProposals.id, req.params.id), eq(orgChangeProposals.tenantId, tenantId))).limit(1);
  if (!proposal) return res.status(404).json({ error: "Proposal tidak ditemukan" });
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
  notes: z.string().trim().max(1000).optional(),
});

tenantRouter.post("/office-locations", validateBody(officeLocationSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(officeLocations).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "office_location.create", details: { officeLocationId: created.id } });
  res.status(201).json(created);
});

tenantRouter.get("/office-locations", async (req, res) => {
  res.json(await db.select().from(officeLocations).where(eq(officeLocations.tenantId, req.session!.tenantId!)));
});

const updateOfficeLocationSchema = officeLocationSchema.partial().extend({ isActive: z.boolean().optional() });

tenantRouter.put("/office-locations/:id", validateParams(uuidParam("id")), validateBody(updateOfficeLocationSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(officeLocations)
    .set(req.body)
    .where(and(eq(officeLocations.id, req.params.id), eq(officeLocations.tenantId, tenantId)))
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
  res.json(rows.filter((e) => e.employmentStatus !== "Aktif"));
});

const employeeSchema = z.object({
  entityId: z.string().uuid(),
  nik: z.string().trim().min(1).max(50),
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().max(50).optional(),
  photoUrl: z.string().trim().max(2000).optional(),
  positionId: z.string().uuid().optional(),
  divisionId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  orgNodeId: z.string().uuid().optional(),
  employmentStatus: z.enum(["Aktif", "Cuti Panjang", "Resign", "Diberhentikan", "Pensiun"]).optional(),
  joinDate: z.string().datetime().optional(),
  resignDate: z.string().datetime().optional(),
  resignReason: z.string().trim().max(500).optional(),
});

tenantRouter.post("/employees", validateBody(employeeSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(employees).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "employee.create", details: { employeeId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/employees/:id", validateParams(uuidParam("id")), validateBody(employeeSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(employees)
    .set(req.body)
    .where(and(eq(employees.id, req.params.id), eq(employees.tenantId, tenantId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "employee.update", details: { employeeId: updated.id } });
  res.json(updated);
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

  // "Nama Karyawan Sebelumnya (Jika Penggantian)" must be someone who has
  // actually left — never an Aktif employee (user, 2026-11-02).
  if (req.body.requisitionType === "Penggantian" && req.body.replacementEmployeeId) {
    const [replacement] = await db.select().from(employees).where(eq(employees.id, req.body.replacementEmployeeId)).limit(1);
    if (!replacement || replacement.tenantId !== tenantId) return res.status(404).json({ error: "Karyawan pengganti tidak ditemukan" });
    if (replacement.employmentStatus === "Aktif") {
      return res.status(400).json({ error: "Karyawan yang dipilih sebagai 'Nama Karyawan Sebelumnya' masih berstatus Aktif" });
    }
  }

  const [created] = await db.insert(jobRequisitions).values({ ...req.body, tenantId, requestedByUserId: userId }).returning();
  await logAudit({ actorUserId: userId, tenantId, action: "job_requisition.create", details: { jobRequisitionId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/job-requisitions/:id", validateParams(uuidParam("id")), validateBody(jobRequisitionSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(jobRequisitions)
    .set(req.body)
    .where(and(eq(jobRequisitions.id, req.params.id), eq(jobRequisitions.tenantId, tenantId)))
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
  targetCloseDate: z.string().datetime().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

tenantRouter.post("/job-vacancies", validateBody(jobVacancySchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(jobVacancies).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "job_vacancy.create", details: { jobVacancyId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/job-vacancies/:id", validateParams(uuidParam("id")), validateBody(jobVacancySchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(jobVacancies)
    .set(req.body)
    .where(and(eq(jobVacancies.id, req.params.id), eq(jobVacancies.tenantId, tenantId)))
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
  const [created] = await db.insert(candidates).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "candidate.create", details: { candidateId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/candidates/:id", validateParams(uuidParam("id")), validateBody(candidateSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(candidates)
    .set(req.body)
    .where(and(eq(candidates.id, req.params.id), eq(candidates.tenantId, tenantId)))
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
  joinDate: z.string().datetime().optional(),
  basicSalary: z.number().int().min(0).optional(),
  contractDocNumber: z.string().trim().max(100).optional(),
  status: z.enum(["In Progress", "Completed", "Cancelled"]).optional(),
  createdEmployeeId: z.string().uuid().optional(),
  tasks: z.array(z.unknown()).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

tenantRouter.post("/onboarding-processes", validateBody(onboardingProcessSchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [created] = await db.insert(onboardingProcesses).values({ ...req.body, tenantId }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "onboarding_process.create", details: { onboardingProcessId: created.id } });
  res.status(201).json(created);
});

tenantRouter.put("/onboarding-processes/:id", validateParams(uuidParam("id")), validateBody(onboardingProcessSchema.partial()), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [updated] = await db
    .update(onboardingProcesses)
    .set(req.body)
    .where(and(eq(onboardingProcesses.id, req.params.id), eq(onboardingProcesses.tenantId, tenantId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Proses onboarding tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "onboarding_process.update", details: { onboardingProcessId: updated.id } });
  res.json(updated);
});

tenantRouter.delete("/onboarding-processes/:id", validateParams(uuidParam("id")), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const [deleted] = await db.delete(onboardingProcesses).where(and(eq(onboardingProcesses.id, req.params.id), eq(onboardingProcesses.tenantId, tenantId))).returning();
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

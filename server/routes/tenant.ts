import { Router } from "express";
import { z } from "zod";
import { eq, inArray, and } from "drizzle-orm";
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
} from "../db/schema.ts";
import { requireTenantAdmin } from "../middleware/auth.ts";
import { validateBody, validateParams, uuidParam } from "../lib/validate.ts";
import { computeNewEntityClosureRows, buildEntityTree, applyChangeSet } from "../lib/orgStructure.ts";
import { logAudit } from "../lib/audit.ts";

export const tenantRouter = Router();
tenantRouter.use(requireTenantAdmin);

// ---------------------------------------------------------------------------
// Entities — unlimited-depth tree, entity_closure maintained on create.
// "Bawa pengaturan dari parent" = a one-time dead copy of the parent's
// CURRENT column values at creation, never a live link (user correction).
// ---------------------------------------------------------------------------

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
  docPrefix: z.string().trim().max(50).optional(),
});

tenantRouter.post("/entities", validateBody(createEntitySchema), async (req, res) => {
  const tenantId = req.session!.tenantId!;
  const body = req.body as z.infer<typeof createEntitySchema>;

  let parent: typeof companyEntities.$inferSelect | undefined;
  if (body.parentEntityId) {
    [parent] = await db.select().from(companyEntities).where(and(eq(companyEntities.id, body.parentEntityId), eq(companyEntities.tenantId, tenantId))).limit(1);
    if (!parent) return res.status(400).json({ error: "Entitas induk tidak ditemukan" });
  }

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
    nikPattern: body.nikPattern ?? parent?.nikPattern ?? null,
    docPrefix: body.docPrefix ?? parent?.docPrefix ?? null,
    createdByEntityId: parent?.id ?? null,
  };

  const [created] = await db.insert(companyEntities).values(values).returning();

  const parentAncestorRows = parent
    ? await db.select().from(entityClosure).where(eq(entityClosure.descendantEntityId, parent.id))
    : [];
  const closureRows = computeNewEntityClosureRows(created.id, parentAncestorRows);
  await db.insert(entityClosure).values(closureRows);

  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "entity.create", details: { entityId: created.id, parentEntityId: body.parentEntityId ?? null } });
  res.status(201).json(created);
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
  const [updated] = await db
    .update(companyEntities)
    .set(req.body)
    .where(and(eq(companyEntities.id, req.params.id), eq(companyEntities.tenantId, tenantId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Entitas tidak ditemukan" });
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

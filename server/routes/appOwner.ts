import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq, sql, isNull, and, or, ilike } from "drizzle-orm";
import { db } from "../db/client.ts";
import {
  tenants,
  tenantSubscriptions,
  subscriptionPlans,
  users,
  contactInquiries,
  contactReplies,
  passwordResetTokens,
  auditLogEntries,
  modules,
  paymentVerifications,
  promotions,
  emailConfigs,
  discountSchemes,
  affiliates,
  affiliateUsages,
  bankAccounts,
  subscriptionUsageEvents,
  accountCredits,
} from "../db/schema.ts";
import { requireAppOwner } from "../middleware/auth.ts";
import { logAudit } from "../lib/audit.ts";
import { generateToken } from "../lib/token.ts";
import { sendTenantActivatedEmail, sendPasswordResetEmail, sendContactReplyEmail, sendSafe } from "../lib/email.ts";
import { createEmailChangeRequest } from "./auth.ts";
import { resolveEffectiveMonthlyPrice } from "./public.ts";
import { validateBody, validateParams, validateQuery, uuidParam } from "../lib/validate.ts";
import { calculatePricing, computeMonthlyReference, computeDisplayReference, type ModulePricing } from "../lib/pricing.ts";
import { proratedAddonCharge } from "../lib/proration.ts";
import { getModuleCatalog } from "../lib/moduleCatalog.ts";
import { encryptSecret } from "../lib/crypto.ts";

export const appOwnerRouter = Router();
appOwnerRouter.use(requireAppOwner);

const tenantIdParams = validateParams(uuidParam("id"));
const inquiryIdParams = validateParams(uuidParam("id"));
const moduleIdParams = validateParams(uuidParam("id"));
const verificationIdParams = validateParams(uuidParam("id"));

async function getPrimaryAdmin(tenantId: string) {
  const [admin] = await db.select().from(users).where(eq(users.tenantId, tenantId)).limit(1);
  return admin;
}

/** Shared by the direct "Activate" button and payment-verification approval — one place that actually flips a tenant to Active. */
async function activateTenant(tenantId: string, actorUserId: string, auditAction: string) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!tenant) throw Object.assign(new Error("Tenant tidak ditemukan"), { status: 404 });
  if (!tenant.planId) throw Object.assign(new Error("Tenant belum memiliki paket"), { status: 400 });

  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, tenant.planId)).limit(1);
  const [sub] = await db.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, tenantId)).limit(1);
  const startedAt = new Date();
  // Prefer what the customer actually committed to at signup (totalMonths);
  // fall back to the plan's durationDays only when that's absent (e.g. an
  // App-Owner-direct "preset" creation that didn't set committedMonths).
  const termDays = sub?.committedMonths ? sub.committedMonths * 30 : plan.durationDays;
  const expiresAt = new Date(startedAt.getTime() + termDays * 24 * 60 * 60 * 1000);

  await db.update(tenants).set({ status: "Active" }).where(eq(tenants.id, tenantId));
  await db
    .update(tenantSubscriptions)
    .set({ status: "Active", startedAt, expiresAt })
    .where(eq(tenantSubscriptions.tenantId, tenantId));

  const admin = await getPrimaryAdmin(tenantId);
  if (admin) await sendTenantActivatedEmail(admin.email, tenant.name, tenant.subdomain);

  await logAudit({ actorUserId, tenantId, action: auditAction });
  return { tenant, expiresAt };
}

/**
 * App Owner may only see aggregate counts per tenant (user count, plan,
 * subscription window) — never a tenant's internal entity structure, per
 * docs/PRD.md §1.1 poin 10 and docs/SYSTEM_DESIGN.md §2.4.
 */
appOwnerRouter.get("/tenants", async (_req, res) => {
  const rows = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      subdomain: tenants.subdomain,
      status: tenants.status,
      planName: subscriptionPlans.name,
      expiresAt: tenantSubscriptions.expiresAt,
      userCount: sql<number>`(select count(*) from ${users} where ${users.tenantId} = ${tenants.id})`,
    })
    .from(tenants)
    .leftJoin(subscriptionPlans, eq(tenants.planId, subscriptionPlans.id))
    .leftJoin(tenantSubscriptions, eq(tenantSubscriptions.tenantId, tenants.id));

  res.json(rows);
});

/** Dashboard summary — counts an App Owner actually needs at a glance for a SaaS platform. */
appOwnerRouter.get("/dashboard", async (_req, res) => {
  const [tenantCounts] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${tenants.status} = 'Active')`,
      pendingPayment: sql<number>`count(*) filter (where ${tenants.status} = 'PendingPayment')`,
      suspended: sql<number>`count(*) filter (where ${tenants.status} = 'Suspended')`,
    })
    .from(tenants);

  const [userCount] = await db.select({ total: sql<number>`count(*)` }).from(users).where(eq(users.role, "tenant_admin"));
  const [pendingVerifications] = await db
    .select({ total: sql<number>`count(*)` })
    .from(paymentVerifications)
    .where(eq(paymentVerifications.status, "Pending"));
  const [newInquiries] = await db
    .select({ total: sql<number>`count(*)` })
    .from(contactInquiries)
    .where(eq(contactInquiries.status, "New"));
  const [monthlyRevenue] = await db
    .select({
      total: sql<number>`coalesce(sum(${subscriptionPlans.priceIdr} * 30.0 / greatest(${subscriptionPlans.durationDays}, 1)), 0)`,
    })
    .from(tenants)
    .leftJoin(subscriptionPlans, eq(tenants.planId, subscriptionPlans.id))
    .where(eq(tenants.status, "Active"));

  res.json({
    tenants: tenantCounts,
    tenantAdminUsers: userCount.total,
    pendingPaymentVerifications: pendingVerifications.total,
    newContactInquiries: newInquiries.total,
    estimatedMonthlyRevenueIdr: Math.round(Number(monthlyRevenue.total)),
  });
});

appOwnerRouter.post("/tenants/:id/activate", tenantIdParams, async (req, res) => {
  try {
    const { expiresAt } = await activateTenant(req.params.id, req.session!.userId, "tenant.activate");
    res.json({ ok: true, expiresAt });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

const extendSchema = z.object({ days: z.number().int().positive().max(3650) });

appOwnerRouter.post("/tenants/:id/extend", tenantIdParams, validateBody(extendSchema), async (req, res) => {
  const tenantId = req.params.id;
  const { days } = req.body;

  const [sub] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);
  if (!sub) return res.status(404).json({ error: "Subscription tidak ditemukan" });

  const base = sub.expiresAt && sub.expiresAt > new Date() ? sub.expiresAt : new Date();
  const newExpiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  await db.update(tenantSubscriptions).set({ expiresAt: newExpiresAt }).where(eq(tenantSubscriptions.id, sub.id));
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "tenant.extend", details: { days } });
  res.json({ ok: true, expiresAt: newExpiresAt });
});

appOwnerRouter.post("/tenants/:id/suspend", tenantIdParams, async (req, res) => {
  const tenantId = req.params.id;
  await db.update(tenants).set({ status: "Suspended" }).where(eq(tenants.id, tenantId));
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "tenant.suspend" });
  res.json({ ok: true });
});

appOwnerRouter.post("/tenants/:id/reactivate", tenantIdParams, async (req, res) => {
  const tenantId = req.params.id;
  await db.update(tenants).set({ status: "Active" }).where(eq(tenants.id, tenantId));
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "tenant.reactivate" });
  res.json({ ok: true });
});

appOwnerRouter.post("/tenants/:id/reset-admin-password", tenantIdParams, async (req, res) => {
  const tenantId = req.params.id;
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  const admin = await getPrimaryAdmin(tenantId);
  if (!tenant || !admin) return res.status(404).json({ error: "Tenant atau admin tidak ditemukan" });

  const { token, tokenHash } = generateToken();
  await db.insert(passwordResetTokens).values({
    userId: admin.id,
    tokenHash,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  await sendPasswordResetEmail(admin.email, token, tenant.subdomain);
  await logAudit({ actorUserId: req.session!.userId, tenantId, action: "tenant.reset_admin_password" });
  res.json({ ok: true });
});

const changeAdminEmailSchema = z.object({ newEmail: z.string().trim().toLowerCase().email() });

appOwnerRouter.post(
  "/tenants/:id/change-admin-email",
  tenantIdParams,
  validateBody(changeAdminEmailSchema),
  async (req, res) => {
    const tenantId = req.params.id;
    const { newEmail } = req.body;

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    const admin = await getPrimaryAdmin(tenantId);
    if (!tenant || !admin) return res.status(404).json({ error: "Tenant atau admin tidak ditemukan" });

    await createEmailChangeRequest(admin.id, newEmail, tenant.subdomain);
    await logAudit({
      actorUserId: req.session!.userId,
      tenantId,
      action: "tenant.change_admin_email",
      details: { newEmail },
    });
    res.json({ ok: true });
  }
);

// ---------------------------------------------------------------------------
// Plan change (upgrade/downgrade) — there is no automated invoicing system
// yet (only the one-shot bank-transfer verification used at signup), so:
//   - Downgrade: access drops immediately; the unused prorated value becomes
//     an account_credits row the App Owner nets off the tenant's NEXT
//     payment verification by hand.
//   - Upgrade: access unlocks immediately; since there's nothing to attach
//     a deferred charge to yet, the App Owner records the top-up payment
//     the same way signup does (bank transfer proof), submitted as already
//     Approved since App Owner is the one asserting it happened.
// Both directions log subscriptionUsageEvents so a future real billing
// engine can still reconstruct exact active-day history.
// ---------------------------------------------------------------------------

const BILLING_CYCLE_DAYS = 30;

function daysRemainingInCycle(startedAt: Date | null): number {
  if (!startedAt) return BILLING_CYCLE_DAYS;
  const daysSinceStart = Math.floor((Date.now() - startedAt.getTime()) / (24 * 60 * 60 * 1000));
  const dayInCycle = ((daysSinceStart % BILLING_CYCLE_DAYS) + BILLING_CYCLE_DAYS) % BILLING_CYCLE_DAYS;
  return BILLING_CYCLE_DAYS - dayInCycle;
}

const changePlanPreviewSchema = z.object({
  planId: z.string().uuid(),
  actualUsers: z.number().int().min(1),
  actualEntities: z.number().int().min(1),
});

async function computePlanChange(tenantId: string, newPlanId: string, newActualUsers: number, newActualEntities: number) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!tenant || !tenant.planId) throw Object.assign(new Error("Tenant atau paket saat ini tidak ditemukan"), { status: 404 });
  const [sub] = await db.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, tenantId)).limit(1);
  if (!sub) throw Object.assign(new Error("Subscription tidak ditemukan"), { status: 404 });

  const [oldPlan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, tenant.planId)).limit(1);
  const [newPlan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, newPlanId)).limit(1);
  if (!newPlan) throw Object.assign(new Error("Paket baru tidak ditemukan"), { status: 400 });
  if (newActualUsers > newPlan.maxEmployees) throw Object.assign(new Error(`Maksimal ${newPlan.maxEmployees} karyawan untuk paket ini`), { status: 400 });
  if (newActualEntities > newPlan.maxEntities) throw Object.assign(new Error(`Maksimal ${newPlan.maxEntities} entitas untuk paket ini`), { status: 400 });

  const { monthlyPriceIdr: oldMonthlyPriceIdr } = await resolveEffectiveMonthlyPrice(oldPlan, sub.actualUsers ?? oldPlan.maxEmployees, sub.actualEntities ?? oldPlan.maxEntities);
  const { monthlyPriceIdr: newMonthlyPriceIdr, error } = await resolveEffectiveMonthlyPrice(newPlan, newActualUsers, newActualEntities);
  if (error) throw Object.assign(new Error(error), { status: 400 });

  const remainingDays = daysRemainingInCycle(sub.startedAt);
  const deltaPerMonth = newMonthlyPriceIdr - oldMonthlyPriceIdr;
  const proratedAmountIdr = proratedAddonCharge(Math.abs(deltaPerMonth), remainingDays, BILLING_CYCLE_DAYS);
  const direction: "upgrade" | "downgrade" | "same" = deltaPerMonth > 0 ? "upgrade" : deltaPerMonth < 0 ? "downgrade" : "same";

  return { tenant, sub, oldPlan, newPlan, oldMonthlyPriceIdr, newMonthlyPriceIdr, remainingDays, proratedAmountIdr, direction };
}

/** Live preview before committing — shows the App Owner exactly what will be charged/credited and in which direction. */
appOwnerRouter.post("/tenants/:id/change-plan/preview", tenantIdParams, validateBody(changePlanPreviewSchema), async (req, res) => {
  try {
    const { planId, actualUsers, actualEntities } = req.body;
    const result = await computePlanChange(req.params.id, planId, actualUsers, actualEntities);
    res.json({
      direction: result.direction,
      oldMonthlyPriceIdr: result.oldMonthlyPriceIdr,
      newMonthlyPriceIdr: result.newMonthlyPriceIdr,
      remainingDays: result.remainingDays,
      proratedAmountIdr: result.proratedAmountIdr,
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

const changePlanSchema = z.object({
  planId: z.string().uuid(),
  actualUsers: z.number().int().min(1),
  actualEntities: z.number().int().min(1),
  // Only required when the change turns out to be an upgrade — proof of the
  // prorated top-up payment, same shape as the signup bank-transfer form.
  bankAccountId: z.string().uuid().optional(),
  referenceNumber: z.string().trim().min(2).max(100).optional(),
  note: z.string().trim().max(1000).optional(),
});

appOwnerRouter.post("/tenants/:id/change-plan", tenantIdParams, validateBody(changePlanSchema), async (req, res) => {
  const tenantId = req.params.id;
  const { planId, actualUsers, actualEntities, bankAccountId, referenceNumber, note } = req.body;

  let result;
  try {
    result = await computePlanChange(tenantId, planId, actualUsers, actualEntities);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return res.status(status).json({ error: (err as Error).message });
  }
  const { sub, newPlan, direction, proratedAmountIdr, remainingDays, oldPlan } = result;

  if (direction === "upgrade") {
    if (!bankAccountId || !referenceNumber) {
      return res.status(400).json({ error: "Upgrade butuh bukti transfer (rekening tujuan & nomor referensi) karena ada biaya tambahan" });
    }
    const [destinationAccount] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, bankAccountId)).limit(1);
    if (!destinationAccount) return res.status(400).json({ error: "Rekening tujuan transfer tidak valid" });

    await db.insert(paymentVerifications).values({
      tenantId,
      amountIdr: proratedAmountIdr,
      bankAccountId: destinationAccount.id,
      bankName: destinationAccount.bankName,
      referenceNumber,
      note: note ?? `Prorata upgrade dari paket ${oldPlan.name} ke ${newPlan.name}, sisa ${remainingDays} hari siklus bulan ini.`,
      status: "Approved",
      reviewedByUserId: req.session!.userId,
      reviewedAt: new Date(),
    });
  } else if (direction === "downgrade") {
    await db.insert(accountCredits).values({
      tenantId,
      amountIdr: proratedAmountIdr,
      reason: `Downgrade dari paket ${oldPlan.name} ke ${newPlan.name}, sisa ${remainingDays} hari tidak terpakai. Kurangi dari tagihan/verifikasi berikutnya.`,
    });
  }

  // Reconcile the usage-event ledger: activate the delta of newly added
  // seats, deactivate the delta of removed ones (oldest-active-first), so a
  // future real billing engine can still walk exact active-day history.
  const oldUsers = sub.actualUsers ?? 0;
  const oldEntities = sub.actualEntities ?? 0;
  if (actualUsers > oldUsers) {
    await db.insert(subscriptionUsageEvents).values(Array.from({ length: actualUsers - oldUsers }, () => ({ tenantSubscriptionId: sub.id, resourceType: "user" as const })));
  } else if (actualUsers < oldUsers) {
    const toDeactivate = await db
      .select({ id: subscriptionUsageEvents.id })
      .from(subscriptionUsageEvents)
      .where(and(eq(subscriptionUsageEvents.tenantSubscriptionId, sub.id), eq(subscriptionUsageEvents.resourceType, "user"), isNull(subscriptionUsageEvents.deactivatedAt)))
      .orderBy(subscriptionUsageEvents.createdAt)
      .limit(oldUsers - actualUsers);
    for (const row of toDeactivate) await db.update(subscriptionUsageEvents).set({ deactivatedAt: new Date() }).where(eq(subscriptionUsageEvents.id, row.id));
  }
  if (actualEntities > oldEntities) {
    await db.insert(subscriptionUsageEvents).values(Array.from({ length: actualEntities - oldEntities }, () => ({ tenantSubscriptionId: sub.id, resourceType: "entity" as const })));
  } else if (actualEntities < oldEntities) {
    const toDeactivate = await db
      .select({ id: subscriptionUsageEvents.id })
      .from(subscriptionUsageEvents)
      .where(and(eq(subscriptionUsageEvents.tenantSubscriptionId, sub.id), eq(subscriptionUsageEvents.resourceType, "entity"), isNull(subscriptionUsageEvents.deactivatedAt)))
      .orderBy(subscriptionUsageEvents.createdAt)
      .limit(oldEntities - actualEntities);
    for (const row of toDeactivate) await db.update(subscriptionUsageEvents).set({ deactivatedAt: new Date() }).where(eq(subscriptionUsageEvents.id, row.id));
  }

  await db.update(tenants).set({ planId }).where(eq(tenants.id, tenantId));
  await db.update(tenantSubscriptions).set({ planId, actualUsers, actualEntities }).where(eq(tenantSubscriptions.id, sub.id));

  await logAudit({
    actorUserId: req.session!.userId,
    tenantId,
    action: direction === "upgrade" ? "tenant.plan_upgrade" : direction === "downgrade" ? "tenant.plan_downgrade" : "tenant.plan_change",
    details: { newPlanId: planId, actualUsers, actualEntities, proratedAmountIdr, direction },
  });

  res.json({ ok: true, direction, proratedAmountIdr });
});

/** Credit ledger for a tenant — the running balance App Owner manually nets off their next payment verification until real invoicing exists. */
appOwnerRouter.get("/tenants/:id/credits", tenantIdParams, async (req, res) => {
  const rows = await db.select().from(accountCredits).where(eq(accountCredits.tenantId, req.params.id)).orderBy(accountCredits.createdAt);
  res.json(rows);
});

// ---------------------------------------------------------------------------
// Payment verification — review the bank-transfer proof a tenant submitted
// at signup before activating them, instead of a blind "Activate" click.
// ---------------------------------------------------------------------------

appOwnerRouter.get("/payment-verifications", async (_req, res) => {
  const rows = await db
    .select({
      id: paymentVerifications.id,
      tenantId: paymentVerifications.tenantId,
      tenantName: tenants.name,
      subdomain: tenants.subdomain,
      planName: subscriptionPlans.name,
      amountIdr: paymentVerifications.amountIdr,
      bankName: paymentVerifications.bankName,
      referenceNumber: paymentVerifications.referenceNumber,
      note: paymentVerifications.note,
      status: paymentVerifications.status,
      rejectionReason: paymentVerifications.rejectionReason,
      createdAt: paymentVerifications.createdAt,
    })
    .from(paymentVerifications)
    .innerJoin(tenants, eq(paymentVerifications.tenantId, tenants.id))
    .leftJoin(subscriptionPlans, eq(tenants.planId, subscriptionPlans.id))
    .orderBy(sql`${paymentVerifications.status} = 'Pending' desc, ${paymentVerifications.createdAt} desc`);

  res.json(rows);
});

appOwnerRouter.post("/payment-verifications/:id/approve", verificationIdParams, async (req, res) => {
  const [verification] = await db
    .select()
    .from(paymentVerifications)
    .where(eq(paymentVerifications.id, req.params.id))
    .limit(1);
  if (!verification) return res.status(404).json({ error: "Verifikasi pembayaran tidak ditemukan" });
  if (verification.status !== "Pending") {
    return res.status(409).json({ error: "Verifikasi ini sudah diproses sebelumnya" });
  }

  await db
    .update(paymentVerifications)
    .set({ status: "Approved", reviewedByUserId: req.session!.userId, reviewedAt: new Date() })
    .where(eq(paymentVerifications.id, verification.id));

  try {
    const { expiresAt } = await activateTenant(verification.tenantId, req.session!.userId, "payment.approve");
    res.json({ ok: true, expiresAt });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

const rejectSchema = z.object({ reason: z.string().trim().min(2).max(1000) });

appOwnerRouter.post(
  "/payment-verifications/:id/reject",
  verificationIdParams,
  validateBody(rejectSchema),
  async (req, res) => {
    const { reason } = req.body;
    const [verification] = await db
      .select()
      .from(paymentVerifications)
      .where(eq(paymentVerifications.id, req.params.id))
      .limit(1);
    if (!verification) return res.status(404).json({ error: "Verifikasi pembayaran tidak ditemukan" });
    if (verification.status !== "Pending") {
      return res.status(409).json({ error: "Verifikasi ini sudah diproses sebelumnya" });
    }

    await db
      .update(paymentVerifications)
      .set({
        status: "Rejected",
        rejectionReason: reason,
        reviewedByUserId: req.session!.userId,
        reviewedAt: new Date(),
      })
      .where(eq(paymentVerifications.id, verification.id));

    const admin = await getPrimaryAdmin(verification.tenantId);
    if (admin) {
      await sendSafe(
        admin.email,
        "Verifikasi Pembayaran Ditolak",
        `<p>Bukti pembayaran Anda belum dapat kami verifikasi.</p><p><strong>Alasan:</strong> ${reason}</p><p>Silakan hubungi tim kami untuk mengirimkan bukti yang benar.</p>`
      );
    }

    await logAudit({
      actorUserId: req.session!.userId,
      tenantId: verification.tenantId,
      action: "payment.reject",
      details: { reason },
    });
    res.json({ ok: true });
  }
);

// ---------------------------------------------------------------------------
// Module pricing catalog — base price, price per user, price per entity,
// used to compute a custom plan's price (server/lib/pricing.ts).
// ---------------------------------------------------------------------------

appOwnerRouter.get("/modules", async (_req, res) => {
  res.json(await db.select().from(modules).orderBy(modules.name));
});

/**
 * The real, fixed module list (from the actual app's Sidebar — never a
 * free-typed code) cross-checked against what's already in the pricing
 * catalog, each with a size-based price recommendation. Powers "Modul
 * Baru": pick a module, code/name/suggested prices fill in automatically.
 */
appOwnerRouter.get("/modules/catalog", async (_req, res) => {
  const existing = await db.select().from(modules);
  const existingCodes = new Set(existing.map((m) => m.code));
  const catalog = getModuleCatalog().map((entry) => ({ ...entry, isAdded: existingCodes.has(entry.code) }));
  res.json(catalog);
});

const moduleSchema = z.object({
  code: z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_]{1,50}$/, "Kode modul: huruf kecil/angka/underscore"),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(500).optional(),
  basePriceIdr: z.number().int().min(0),
  pricePerUserIdr: z.number().int().min(0),
  pricePerEntityIdr: z.number().int().min(0),
  isActive: z.boolean().optional(),
});

appOwnerRouter.post("/modules", validateBody(moduleSchema), async (req, res) => {
  const [existing] = await db.select().from(modules).where(eq(modules.code, req.body.code)).limit(1);
  if (existing) return res.status(409).json({ error: "Kode modul sudah dipakai" });

  const [created] = await db.insert(modules).values(req.body).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId: null, action: "module.create", details: req.body });
  res.status(201).json(created);
});

const moduleUpdateSchema = moduleSchema.partial();

appOwnerRouter.put("/modules/:id", moduleIdParams, validateBody(moduleUpdateSchema), async (req, res) => {
  const [updated] = await db.update(modules).set(req.body).where(eq(modules.id, req.params.id)).returning();
  if (!updated) return res.status(404).json({ error: "Modul tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId: null, action: "module.update", details: req.body });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Preset package management ("Kelola Paket") — reusable named plans a
// customer picks off the shelf, distinct from a one-off custom plan.
// ---------------------------------------------------------------------------

appOwnerRouter.get("/plans", async (_req, res) => {
  const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.priceIdr);
  const allModuleCodes = (await db.select({ code: modules.code }).from(modules)).map((m) => m.code);
  // "*" ("semua modul") is internal shorthand — expand it so the UI always
  // has real module codes to look names up by, not a literal "*".
  res.json(plans.map((p) => ({ ...p, enabledModules: p.enabledModules.includes("*") ? allModuleCodes : p.enabledModules })));
});

/** Full module breakdown for a plan — "lihat detail modulnya apa saja" — plus its discount schemes. */
appOwnerRouter.get("/plans/:id/detail", validateParams(uuidParam("id")), async (req, res) => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, req.params.id)).limit(1);
  if (!plan) return res.status(404).json({ error: "Paket tidak ditemukan" });

  const allModules = await db.select().from(modules);
  const planModules = plan.enabledModules.includes("*") ? allModules : allModules.filter((m) => plan.enabledModules.includes(m.code));
  const breakdown = calculatePricing({
    selectedModules: planModules,
    maxEntities: plan.maxEntities,
    maxUsers: plan.maxEmployees,
    durationDays: 30,
    discountPercent: 0,
  });
  const schemes = await db.select().from(discountSchemes).where(eq(discountSchemes.planId, plan.id));

  res.json({ plan, modules: planModules, perModule: breakdown.perModule, schemes });
});

/**
 * Body never includes priceIdr or referenceMonthlyPriceIdr directly — both
 * are always computed server-side from the selected modules' catalog
 * pricing (.claude rule: "harga paket harus otomatis sesuai referensi
 * harga yang di-setting, bukan ngasal"). The only price lever exposed here
 * is the permanent markdown (% + mandatory reason).
 */
const planSchema = z.object({
  name: z.string().trim().min(2).max(200),
  allowsMultiEntity: z.boolean(),
  maxEmployees: z.number().int().min(1),
  maxEntities: z.number().int().min(1),
  enabledModules: z.array(z.string()).min(1),
  durationDays: z.number().int().min(1).max(3650),
  permanentDiscountPercent: z.number().int().min(0).max(100).default(0),
  permanentDiscountReason: z.string().trim().max(1000).optional(),
  // "Harga yang ditampilkan ke user adalah harga paket tanpa hitungan user
  // dan entitas" — off by default; App Owner opts each component back into
  // the public headline price per plan.
  displayIncludesUserPricing: z.boolean().default(false),
  displayIncludesEntityPricing: z.boolean().default(false),
});

async function resolvePlanPricing(body: z.infer<typeof planSchema>) {
  const allModules = await db.select().from(modules);
  const selected = body.enabledModules.includes("*") ? allModules : allModules.filter((m) => body.enabledModules.includes(m.code));
  const referenceMonthlyPriceIdr = computeMonthlyReference(selected, body.maxEmployees, body.maxEntities);
  const priceIdr = Math.round(referenceMonthlyPriceIdr * (1 - body.permanentDiscountPercent / 100));
  const markdownRatio = referenceMonthlyPriceIdr > 0 ? priceIdr / referenceMonthlyPriceIdr : 1;
  const displayReference = computeDisplayReference(
    selected,
    body.maxEmployees,
    body.maxEntities,
    body.displayIncludesUserPricing,
    body.displayIncludesEntityPricing
  );
  const displayPriceIdr = Math.round(displayReference * markdownRatio);
  return { referenceMonthlyPriceIdr, priceIdr, displayPriceIdr };
}

appOwnerRouter.post("/plans", validateBody(planSchema), async (req, res) => {
  if (req.body.permanentDiscountPercent > 0 && !req.body.permanentDiscountReason) {
    return res.status(400).json({ error: "Alasan diskon permanen wajib diisi jika persentase > 0" });
  }
  const { referenceMonthlyPriceIdr, priceIdr, displayPriceIdr } = await resolvePlanPricing(req.body);
  const [created] = await db
    .insert(subscriptionPlans)
    .values({ ...req.body, referenceMonthlyPriceIdr, priceIdr, displayPriceIdr, isCustom: false })
    .returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId: null, action: "plan.create", details: req.body });
  res.status(201).json(created);
});

appOwnerRouter.put("/plans/:id", validateParams(uuidParam("id")), validateBody(planSchema.partial()), async (req, res) => {
  const [existing] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, req.params.id)).limit(1);
  if (!existing) return res.status(404).json({ error: "Paket tidak ditemukan" });

  const merged = { ...existing, ...req.body } as z.infer<typeof planSchema>;
  if (merged.permanentDiscountPercent > 0 && !merged.permanentDiscountReason) {
    return res.status(400).json({ error: "Alasan diskon permanen wajib diisi jika persentase > 0" });
  }
  const { referenceMonthlyPriceIdr, priceIdr, displayPriceIdr } = await resolvePlanPricing(merged);

  const [updated] = await db
    .update(subscriptionPlans)
    .set({ ...req.body, referenceMonthlyPriceIdr, priceIdr, displayPriceIdr })
    .where(eq(subscriptionPlans.id, req.params.id))
    .returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId: null, action: "plan.update", details: req.body });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Discount schemes ("skema diskon tahunan/2 tahun/5 tahun", volume tiers by
// user/entity count) — tiered, per plan. See schema.ts for the "best tier
// wins" rule this plugs into (server/lib/pricing.ts bestTierDiscount).
// ---------------------------------------------------------------------------

appOwnerRouter.get("/plans/:id/schemes", validateParams(uuidParam("id")), async (req, res) => {
  res.json(await db.select().from(discountSchemes).where(eq(discountSchemes.planId, req.params.id)));
});

const schemeSchema = z.object({
  schemeType: z.enum(["duration_months", "user_count", "entity_count"]),
  label: z.string().trim().min(2).max(200),
  tiers: z.array(z.object({ minValue: z.number().int().min(1), discountPercent: z.number().int().min(0).max(100) })).min(1),
  isActive: z.boolean().optional(),
});

appOwnerRouter.post("/plans/:id/schemes", validateParams(uuidParam("id")), validateBody(schemeSchema), async (req, res) => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, req.params.id)).limit(1);
  if (!plan) return res.status(404).json({ error: "Paket tidak ditemukan" });
  const [created] = await db.insert(discountSchemes).values({ planId: plan.id, ...req.body }).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId: null, action: "discount_scheme.create", details: { planId: plan.id, ...req.body } });
  res.status(201).json(created);
});

appOwnerRouter.put("/schemes/:id", validateParams(uuidParam("id")), validateBody(schemeSchema.partial()), async (req, res) => {
  const [updated] = await db.update(discountSchemes).set(req.body).where(eq(discountSchemes.id, req.params.id)).returning();
  if (!updated) return res.status(404).json({ error: "Skema tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId: null, action: "discount_scheme.update", details: req.body });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Promo / discount codes — each tied to exactly one plan ("promo itu
// berlaku ke paket mana" is never ambiguous). Several codes can target the
// same plan (that's how one promo "jenis" covers many "skema").
// ---------------------------------------------------------------------------

appOwnerRouter.get("/promotions", async (_req, res) => {
  res.json(await db.select().from(promotions).orderBy(sql`${promotions.createdAt} desc`));
});

const promotionSchema = z.object({
  planId: z.string().uuid(),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Kode: 3-30 huruf besar/angka/strip"),
  name: z.string().trim().min(2).max(200),
  discountPercent: z.number().int().min(1).max(100),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  maxUses: z.number().int().min(1).nullable().optional(),
});

appOwnerRouter.post("/promotions", validateBody(promotionSchema), async (req, res) => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, req.body.planId)).limit(1);
  if (!plan) return res.status(400).json({ error: "Paket tidak ditemukan" });
  const [existing] = await db.select().from(promotions).where(eq(promotions.code, req.body.code)).limit(1);
  if (existing) return res.status(409).json({ error: "Kode promo sudah dipakai" });
  const [created] = await db.insert(promotions).values(req.body).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId: null, action: "promotion.create", details: req.body });
  res.status(201).json(created);
});

const promotionUpdateSchema = z.object({ isActive: z.boolean().optional(), maxUses: z.number().int().min(1).nullable().optional() });

appOwnerRouter.put("/promotions/:id", validateParams(uuidParam("id")), validateBody(promotionUpdateSchema), async (req, res) => {
  const [updated] = await db.update(promotions).set(req.body).where(eq(promotions.id, req.params.id)).returning();
  if (!updated) return res.status(404).json({ error: "Promo tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId: null, action: "promotion.update", details: req.body });
  res.json(updated);
});

// ---------------------------------------------------------------------------
// Affiliates — like a promotion but two-sided: the referred customer gets
// customerDiscountPercent off, the affiliate earns commissionPercent of
// what was actually paid (logged per use in affiliate_usages for payout).
// ---------------------------------------------------------------------------

appOwnerRouter.get("/affiliates", async (_req, res) => {
  res.json(await db.select().from(affiliates).orderBy(sql`${affiliates.createdAt} desc`));
});

const affiliateSchema = z.object({
  planId: z.string().uuid(),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Kode: 3-30 huruf besar/angka/strip"),
  affiliateName: z.string().trim().min(2).max(200),
  customerDiscountPercent: z.number().int().min(0).max(100),
  commissionPercent: z.number().int().min(0).max(100),
});

appOwnerRouter.post("/affiliates", validateBody(affiliateSchema), async (req, res) => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, req.body.planId)).limit(1);
  if (!plan) return res.status(400).json({ error: "Paket tidak ditemukan" });
  const [existing] = await db.select().from(affiliates).where(eq(affiliates.code, req.body.code)).limit(1);
  if (existing) return res.status(409).json({ error: "Kode affiliate sudah dipakai" });
  const [created] = await db.insert(affiliates).values(req.body).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId: null, action: "affiliate.create", details: req.body });
  res.status(201).json(created);
});

const affiliateUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  customerDiscountPercent: z.number().int().min(0).max(100).optional(),
  commissionPercent: z.number().int().min(0).max(100).optional(),
});

appOwnerRouter.put("/affiliates/:id", validateParams(uuidParam("id")), validateBody(affiliateUpdateSchema), async (req, res) => {
  const [updated] = await db.update(affiliates).set(req.body).where(eq(affiliates.id, req.params.id)).returning();
  if (!updated) return res.status(404).json({ error: "Affiliate tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId: null, action: "affiliate.update", details: req.body });
  res.json(updated);
});

appOwnerRouter.get("/affiliates/:id/usages", validateParams(uuidParam("id")), async (req, res) => {
  res.json(await db.select().from(affiliateUsages).where(eq(affiliateUsages.affiliateId, req.params.id)).orderBy(sql`${affiliateUsages.createdAt} desc`));
});

// ---------------------------------------------------------------------------
// Pricing calculator — pure preview, no writes. Used by both the module
// price editor (sanity-check) and the "Daftarkan Tenant" custom plan form.
// ---------------------------------------------------------------------------

// Promo/affiliate codes are plan-scoped and don't apply to a not-yet-created custom plan — see note at the "/tenants" custom branch below.
const pricingCalcSchema = z.object({
  moduleCodes: z.array(z.string()).min(1),
  maxEntities: z.number().int().min(1).max(1000),
  maxUsers: z.number().int().min(1).max(100000),
  durationDays: z.number().int().min(1).max(3650),
  discountPercent: z.number().int().min(0).max(100).default(0),
});

appOwnerRouter.post("/pricing/calculate", validateBody(pricingCalcSchema), async (req, res) => {
  const { moduleCodes, maxEntities, maxUsers, durationDays, discountPercent } = req.body;
  const rows = await db.select().from(modules);
  const selected: ModulePricing[] = rows.filter((m) => moduleCodes.includes(m.code));
  if (selected.length !== moduleCodes.length) {
    return res.status(400).json({ error: "Salah satu kode modul tidak dikenali" });
  }
  const breakdown = calculatePricing({ selectedModules: selected, maxEntities, maxUsers, durationDays, discountPercent });
  res.json(breakdown);
});

// ---------------------------------------------------------------------------
// App Owner registers a tenant directly — preset plan, or a custom one
// built from the module catalog (priced automatically, then activated
// immediately since the App Owner is the one creating it).
// ---------------------------------------------------------------------------

const baseTenantFields = {
  tenantName: z.string().trim().min(2).max(200),
  subdomain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z][a-z0-9-]{2,30}$/, "Subdomain harus 3-31 karakter huruf kecil/angka/strip, diawali huruf"),
  adminName: z.string().trim().min(2).max(200),
  adminEmail: z.string().trim().toLowerCase().email(),
  adminPassword: z.string().min(8).max(200),
};

const createTenantSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("preset"), planId: z.string().uuid(), totalMonths: z.number().int().min(1).max(120).optional(), ...baseTenantFields }),
  z.object({
    mode: z.literal("custom"),
    moduleCodes: z.array(z.string()).min(1),
    maxEntities: z.number().int().min(1).max(1000),
    maxUsers: z.number().int().min(1).max(100000),
    durationDays: z.number().int().min(1).max(3650),
    discountPercent: z.number().int().min(0).max(100).default(0),
    ...baseTenantFields,
  }),
]);

appOwnerRouter.post("/tenants", validateBody(createTenantSchema), async (req, res) => {
  const { tenantName, subdomain, adminName, adminEmail, adminPassword } = req.body;

  const [existing] = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain)).limit(1);
  if (existing) return res.status(409).json({ error: "Subdomain sudah digunakan tenant lain" });

  let planId: string;
  if (req.body.mode === "preset") {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, req.body.planId)).limit(1);
    if (!plan) return res.status(400).json({ error: "Paket tidak ditemukan" });
    planId = plan.id;
  } else {
    // Promo/affiliate codes are plan-scoped (promotions.planId) and this
    // custom plan doesn't exist until the insert below — a brand-new
    // custom deal can only use the manual discountPercent field, not a
    // promo code (which by definition targets an already-existing plan).
    const { moduleCodes, maxEntities, maxUsers, durationDays, discountPercent } = req.body;
    const rows = await db.select().from(modules);
    const selected: ModulePricing[] = rows.filter((m) => moduleCodes.includes(m.code));
    if (selected.length !== moduleCodes.length) {
      return res.status(400).json({ error: "Salah satu kode modul tidak dikenali" });
    }
    const breakdown = calculatePricing({ selectedModules: selected, maxEntities, maxUsers, durationDays, discountPercent });
    const [customPlan] = await db
      .insert(subscriptionPlans)
      .values({
        name: `Custom — ${tenantName}`,
        allowsMultiEntity: maxEntities > 1,
        maxEmployees: maxUsers,
        enabledModules: moduleCodes,
        durationDays,
        // Custom plans are a one-off negotiated total for a fixed term
        // (unlike preset plans, where priceIdr is a recurring monthly
        // rate) — priceIdr here is the full contracted amount for
        // durationDays, breakdown.subtotalPerCycle is kept only as the
        // monthly-equivalent reference for the plan-detail view.
        referenceMonthlyPriceIdr: breakdown.subtotalPerCycle,
        priceIdr: breakdown.finalPriceIdr,
        isCustom: true,
        maxEntities,
        discountPercent,
      })
      .returning();
    planId = customPlan.id;
  }

  const [tenant] = await db.insert(tenants).values({ name: tenantName, subdomain, planId, status: "Active" }).returning();
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await db.insert(users).values({ tenantId: tenant.id, role: "tenant_admin", name: adminName, email: adminEmail, passwordHash });

  const startedAt = new Date();
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
  const committedMonths = req.body.mode === "preset" ? req.body.totalMonths ?? null : null;
  const termDays = committedMonths ? committedMonths * 30 : plan.durationDays;
  const expiresAt = new Date(startedAt.getTime() + termDays * 24 * 60 * 60 * 1000);
  await db.insert(tenantSubscriptions).values({ tenantId: tenant.id, planId, committedMonths, status: "Active", startedAt, expiresAt });

  await sendSafe(adminEmail, "Akun NusaHR Anda Dibuat", `<p>Akun <strong>${tenantName}</strong> telah dibuat dan aktif oleh tim NusaHR.</p>`);
  await logAudit({ actorUserId: req.session!.userId, tenantId: tenant.id, action: "tenant.create_by_owner", details: { mode: req.body.mode } });

  res.status(201).json({ tenantId: tenant.id, subdomain: tenant.subdomain, status: tenant.status, expiresAt });
});

// ---------------------------------------------------------------------------
// Email config ("Pengaturan Email") — actually editable: pick Resend or
// generic SMTP, set the sender address, and the real credential (API key,
// or SMTP username/app-password). Secrets are encrypted at rest
// (server/lib/crypto.ts) and never echoed back in plaintext — the GET
// response only says whether one is set. This is the platform-wide
// (tenantId IS NULL) config; the same `email_configs` table is designed to
// later hold a per-tenant row so a client can use their own company email
// to message their employees (not built yet — tracked here deliberately).
// ---------------------------------------------------------------------------

appOwnerRouter.get("/email-config", async (_req, res) => {
  const [row] = await db.select().from(emailConfigs).where(isNull(emailConfigs.tenantId)).limit(1);
  if (!row) {
    return res.json({
      provider: "resend",
      fromName: "NusaHR",
      fromEmail: "",
      hasResendKey: Boolean(process.env.RESEND_API_KEY),
      smtpHost: "",
      smtpPort: 587,
      smtpUsername: "",
      hasSmtpPassword: false,
      smtpSecure: true,
      isActive: false,
      usingEnvFallback: Boolean(process.env.RESEND_API_KEY),
    });
  }
  res.json({
    provider: row.provider,
    fromName: row.fromName,
    fromEmail: row.fromEmail,
    hasResendKey: Boolean(row.resendApiKeyEncrypted),
    smtpHost: row.smtpHost ?? "",
    smtpPort: row.smtpPort ?? 587,
    smtpUsername: row.smtpUsername ?? "",
    hasSmtpPassword: Boolean(row.smtpPasswordEncrypted),
    smtpSecure: row.smtpSecure,
    isActive: row.isActive,
    usingEnvFallback: false,
  });
});

const emailConfigSchema = z.object({
  provider: z.enum(["resend", "smtp"]),
  fromName: z.string().trim().min(1).max(200),
  fromEmail: z.string().trim().toLowerCase().email(),
  isActive: z.boolean(),
  resendApiKey: z.string().trim().max(500).optional(), // omitted/blank = keep existing stored key
  smtpHost: z.string().trim().max(255).optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpUsername: z.string().trim().max(255).optional(),
  smtpPassword: z.string().trim().max(500).optional(), // omitted/blank = keep existing stored password
  smtpSecure: z.boolean().optional(),
});

appOwnerRouter.put("/email-config", validateBody(emailConfigSchema), async (req, res) => {
  const body = req.body;
  const [existing] = await db.select().from(emailConfigs).where(isNull(emailConfigs.tenantId)).limit(1);

  const values = {
    provider: body.provider,
    fromName: body.fromName,
    fromEmail: body.fromEmail,
    isActive: body.isActive,
    smtpHost: body.smtpHost ?? null,
    smtpPort: body.smtpPort ?? null,
    smtpUsername: body.smtpUsername ?? null,
    smtpSecure: body.smtpSecure ?? true,
    resendApiKeyEncrypted: body.resendApiKey ? encryptSecret(body.resendApiKey) : existing?.resendApiKeyEncrypted ?? null,
    smtpPasswordEncrypted: body.smtpPassword ? encryptSecret(body.smtpPassword) : existing?.smtpPasswordEncrypted ?? null,
    updatedAt: new Date(),
  };

  if (body.provider === "resend" && !values.resendApiKeyEncrypted) {
    return res.status(400).json({ error: "API Key Resend wajib diisi" });
  }
  if (body.provider === "smtp" && (!values.smtpHost || !values.smtpPort || !values.smtpUsername || !values.smtpPasswordEncrypted)) {
    return res.status(400).json({ error: "Host, port, username, dan password SMTP wajib diisi" });
  }

  if (existing) {
    await db.update(emailConfigs).set(values).where(eq(emailConfigs.id, existing.id));
  } else {
    await db.insert(emailConfigs).values({ tenantId: null, ...values });
  }

  await logAudit({ actorUserId: req.session!.userId, tenantId: null, action: "email_config.update", details: { provider: body.provider } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Destination bank accounts — shown to a registrant at signup so they know
// where to transfer. More than one can be active ("bisa ditambah jenis bank
// bukan cuman 1 pilihan").
// ---------------------------------------------------------------------------

appOwnerRouter.get("/bank-accounts", async (_req, res) => {
  res.json(await db.select().from(bankAccounts).orderBy(bankAccounts.createdAt));
});

const bankAccountSchema = z.object({
  bankName: z.string().trim().min(2).max(100),
  accountNumber: z.string().trim().min(2).max(50),
  accountHolderName: z.string().trim().min(2).max(200),
  isActive: z.boolean().default(true),
});

appOwnerRouter.post("/bank-accounts", validateBody(bankAccountSchema), async (req, res) => {
  const [created] = await db.insert(bankAccounts).values(req.body).returning();
  await logAudit({ actorUserId: req.session!.userId, tenantId: null, action: "bank_account.create", details: req.body });
  res.status(201).json(created);
});

appOwnerRouter.put("/bank-accounts/:id", validateParams(uuidParam("id")), validateBody(bankAccountSchema.partial()), async (req, res) => {
  const [updated] = await db.update(bankAccounts).set(req.body).where(eq(bankAccounts.id, req.params.id)).returning();
  if (!updated) return res.status(404).json({ error: "Rekening tidak ditemukan" });
  await logAudit({ actorUserId: req.session!.userId, tenantId: null, action: "bank_account.update", details: req.body });
  res.json(updated);
});

const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(25),
  search: z.string().trim().max(200).optional(),
  action: z.string().trim().max(200).optional(),
});

appOwnerRouter.get("/audit-log", validateQuery(auditLogQuerySchema), async (req, res) => {
  const { page, pageSize, search, action } = req.query as unknown as z.infer<typeof auditLogQuerySchema>;

  const conditions = [
    action ? eq(auditLogEntries.action, action) : undefined,
    search ? or(ilike(auditLogEntries.action, `%${search}%`), ilike(tenants.name, `%${search}%`), ilike(users.name, `%${search}%`)) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const baseQuery = db
    .select({
      id: auditLogEntries.id,
      action: auditLogEntries.action,
      details: auditLogEntries.details,
      createdAt: auditLogEntries.createdAt,
      tenantName: tenants.name,
      actorName: users.name,
    })
    .from(auditLogEntries)
    .leftJoin(tenants, eq(auditLogEntries.tenantId, tenants.id))
    .leftJoin(users, eq(auditLogEntries.actorUserId, users.id));

  const rows = await (where ? baseQuery.where(where) : baseQuery)
    .orderBy(sql`${auditLogEntries.createdAt} desc`)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const countQuery = db
    .select({ total: sql<number>`count(*)` })
    .from(auditLogEntries)
    .leftJoin(tenants, eq(auditLogEntries.tenantId, tenants.id))
    .leftJoin(users, eq(auditLogEntries.actorUserId, users.id));
  const [{ total }] = await (where ? countQuery.where(where) : countQuery);

  res.json({ rows, total: Number(total), page, pageSize });
});

/** Distinct action values seen so far — powers the audit log's "Filter" dropdown without hardcoding the list. */
appOwnerRouter.get("/audit-log/actions", async (_req, res) => {
  const rows = await db.selectDistinct({ action: auditLogEntries.action }).from(auditLogEntries).orderBy(auditLogEntries.action);
  res.json(rows.map((r) => r.action));
});

appOwnerRouter.get("/inbox", async (_req, res) => {
  const inquiries = await db.select().from(contactInquiries).orderBy(sql`${contactInquiries.createdAt} desc`);
  res.json(inquiries);
});

appOwnerRouter.get("/inbox/:id", inquiryIdParams, async (req, res) => {
  const [inquiry] = await db.select().from(contactInquiries).where(eq(contactInquiries.id, req.params.id)).limit(1);
  if (!inquiry) return res.status(404).json({ error: "Pertanyaan tidak ditemukan" });
  const replies = await db
    .select()
    .from(contactReplies)
    .where(eq(contactReplies.inquiryId, inquiry.id))
    .orderBy(contactReplies.createdAt);
  res.json({ ...inquiry, replies });
});

const replySchema = z.object({ body: z.string().trim().min(1).max(5000) });

appOwnerRouter.post("/inbox/:id/reply", inquiryIdParams, validateBody(replySchema), async (req, res) => {
  const { body } = req.body;

  const [inquiry] = await db.select().from(contactInquiries).where(eq(contactInquiries.id, req.params.id)).limit(1);
  if (!inquiry) return res.status(404).json({ error: "Pertanyaan tidak ditemukan" });

  await db.insert(contactReplies).values({ inquiryId: inquiry.id, body, sentByUserId: req.session!.userId });
  await db.update(contactInquiries).set({ status: "Replied" }).where(eq(contactInquiries.id, inquiry.id));
  await sendContactReplyEmail(inquiry.email, inquiry.subject, body);

  res.json({ ok: true });
});

import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import {
  tenants,
  tenantSubscriptions,
  users,
  contactInquiries,
  subscriptionPlans,
  paymentVerifications,
  discountSchemes,
  modules,
  subscriptionUsageEvents,
  bankAccounts,
} from "../db/schema.ts";
import { sendSignupPendingEmail } from "../lib/email.ts";
import { logAudit } from "../lib/audit.ts";
import { validateBody } from "../lib/validate.ts";
import { publicWriteLimiter } from "../lib/rateLimit.ts";
import { rejectBreachedPassword } from "../middleware/passwordCheck.ts";
import {
  resolvePromoDiscount,
  recordPromoUsage,
  InvalidPromoError,
  resolveAffiliateDiscount,
  recordAffiliateUsage,
  InvalidAffiliateError,
} from "../lib/promotions.ts";
import { bestTierDiscount, computeSubscriptionTotal, computeMonthlyReference, expandModuleCodes, expandModuleRows } from "../lib/pricing.ts";
import { getModuleFeatures } from "../lib/moduleCatalog.ts";

export const publicRouter = Router();

/**
 * The price is never fixed at the plan level ("Harga bukan harga final" —
 * a registrant with 50 employees on the Professional plan pays for 50, not
 * for the plan's maxEmployees ceiling). When the registrant supplies real
 * actualUsers/actualEntities (bounded by the plan's max as a hard ceiling),
 * recompute the monthly reference from the plan's actual module catalog
 * prices against THOSE counts, then re-apply the plan's own permanent
 * markdown ratio. Falls back to the plan's stored priceIdr when no actual
 * count is supplied (e.g. the App-Owner direct-creation path).
 */
export async function resolveEffectiveMonthlyPrice(
  plan: typeof subscriptionPlans.$inferSelect,
  actualUsers?: number,
  actualEntities?: number
): Promise<{ monthlyPriceIdr: number; error?: string }> {
  if (actualUsers === undefined && actualEntities === undefined) {
    return { monthlyPriceIdr: plan.priceIdr };
  }
  const users_ = actualUsers ?? plan.maxEmployees;
  const entities_ = actualEntities ?? plan.maxEntities;
  if (users_ > plan.maxEmployees) return { monthlyPriceIdr: 0, error: `Jumlah karyawan melebihi batas paket ini (maks ${plan.maxEmployees})` };
  if (entities_ > plan.maxEntities) return { monthlyPriceIdr: 0, error: `Jumlah entitas melebihi batas paket ini (maks ${plan.maxEntities})` };
  if (users_ < 1 || entities_ < 1) return { monthlyPriceIdr: 0, error: "Jumlah karyawan dan entitas minimal 1" };

  const allModules = await db.select().from(modules);
  const moduleRows = expandModuleRows(plan.enabledModules, allModules);
  const reference = computeMonthlyReference(moduleRows, users_, entities_);
  const markdownRatio = plan.referenceMonthlyPriceIdr > 0 ? plan.priceIdr / plan.referenceMonthlyPriceIdr : 1;
  return { monthlyPriceIdr: Math.round(reference * markdownRatio) };
}

/** Only reusable preset packages — a custom plan (isCustom=true) is a one-off built for a specific tenant and must never leak to the public signup page. */
publicRouter.get("/plans", async (_req, res) => {
  const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isCustom, false));
  const allModuleCodes = (await db.select({ code: modules.code }).from(modules)).map((m) => m.code);
  // A prospective tenant has no idea what "*" means, so expand it to the real module list before it ever reaches the UI.
  res.json(plans.map((p) => ({ ...p, enabledModules: expandModuleCodes(p.enabledModules, allModuleCodes) })));
});

/** A plan's duration/volume discount tiers — shown on the signup page so "diskon 12 bulan: 10%" is visible before checkout, not a surprise. */
publicRouter.get("/plans/:id/schemes", async (req, res) => {
  res.json(await db.select().from(discountSchemes).where(eq(discountSchemes.planId, req.params.id)));
});

/**
 * Full module+feature breakdown for a plan ("lihat detail, turunan modul
 * nya apa saja, ada deskripsinya jelas untuk marketing") — the feature list
 * is always derived live from each module's own tab navigation (never
 * hand-typed), while `description` is the one sentence App Owner wrote for
 * marketing, merged in from the pricing catalog's own module row.
 */
publicRouter.get("/plans/:id/features", async (req, res) => {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, req.params.id)).limit(1);
  if (!plan) return res.status(400).json({ error: "Paket tidak ditemukan" });
  const descriptions = await db.select({ code: modules.code, description: modules.description }).from(modules);
  const descByCode = new Map(descriptions.map((d) => [d.code, d.description]));
  const features = getModuleFeatures(plan.enabledModules).map((m) => ({ ...m, description: descByCode.get(m.code) ?? null }));
  res.json(features);
});

/** Module names + marketing descriptions (no pricing) — lets the signup page show "paket ini termasuk: Payroll, Absensi, ..." without exposing the pricing catalog. */
publicRouter.get("/modules", async (_req, res) => {
  const rows = await db.select({ code: modules.code, name: modules.name, description: modules.description }).from(modules).where(eq(modules.isActive, true));
  res.json(rows);
});

/** Destination accounts a registrant can transfer to — "ga tau harus transfer kemana" without this. */
publicRouter.get("/bank-accounts", async (_req, res) => {
  const rows = await db.select().from(bankAccounts).where(eq(bankAccounts.isActive, true));
  res.json(rows);
});

const calcSchema = z.object({
  planId: z.string().uuid(),
  totalMonths: z.number().int().min(1).max(120),
  promoCode: z.string().trim().max(50).optional(),
  affiliateCode: z.string().trim().max(50).optional(),
  actualUsers: z.number().int().min(1).optional(),
  actualEntities: z.number().int().min(1).optional(),
});

/**
 * Live price preview for the signup page: monthly rate × chosen months,
 * with the single HIGHEST discount among the plan's own duration scheme,
 * a matching promo code, and a matching affiliate code (never stacked —
 * see server/lib/pricing.ts computeSubscriptionTotal). The duration scheme
 * discount always applies automatically when the chosen term qualifies —
 * there is no manual on/off toggle for it; a term that doesn't qualify for
 * any tier simply gets 0 from this, same as any other discount source.
 */
publicRouter.post("/subscription/calculate", validateBody(calcSchema), async (req, res) => {
  const { planId, totalMonths, promoCode, affiliateCode, actualUsers, actualEntities } = req.body;
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
  if (!plan) return res.status(400).json({ error: "Paket tidak ditemukan" });

  const { monthlyPriceIdr, error: priceError } = await resolveEffectiveMonthlyPrice(plan, actualUsers, actualEntities);
  if (priceError) return res.status(400).json({ error: priceError });

  const schemes = await db.select().from(discountSchemes).where(eq(discountSchemes.planId, planId));
  const schemeDiscount = schemes
    .filter((s) => s.isActive && s.schemeType === "duration_months")
    .reduce((best, s) => Math.max(best, bestTierDiscount(s.tiers, totalMonths)), 0);

  let promoDiscount = 0;
  try {
    promoDiscount = await resolvePromoDiscount(promoCode, planId);
  } catch (err) {
    if (err instanceof InvalidPromoError) return res.status(400).json({ error: err.message });
    throw err;
  }

  let affiliateDiscount = 0;
  try {
    const aff = await resolveAffiliateDiscount(affiliateCode, planId);
    affiliateDiscount = aff.customerDiscountPercent;
  } catch (err) {
    if (err instanceof InvalidAffiliateError) return res.status(400).json({ error: err.message });
    throw err;
  }

  const total = computeSubscriptionTotal(monthlyPriceIdr, totalMonths, [schemeDiscount, promoDiscount, affiliateDiscount]);
  res.json({ ...total, enabledModules: plan.enabledModules, discountSources: { schemeDiscount, promoDiscount, affiliateDiscount } });
});

const RESERVED_SUBDOMAINS = new Set(["www", "api", "app", "admin", "mail", "static"]);
const SUBDOMAIN_PATTERN = /^[a-z][a-z0-9-]{2,30}$/;

const signupSchema = z.object({
  tenantName: z.string().trim().min(2).max(200),
  subdomain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(SUBDOMAIN_PATTERN, "Subdomain harus 3-31 karakter huruf kecil/angka/strip, diawali huruf")
    .refine((s) => !RESERVED_SUBDOMAINS.has(s), "Subdomain ini dipakai sistem"),
  adminName: z.string().trim().min(2).max(200),
  adminEmail: z.string().trim().toLowerCase().email(),
  adminPassword: z.string().min(8).max(200),
  planId: z.string().uuid(),
  totalMonths: z.number().int().min(1).max(120),
  bankAccountId: z.string().uuid(),
  referenceNumber: z.string().trim().min(2).max(100),
  note: z.string().trim().max(1000).optional(),
  promoCode: z.string().trim().max(50).optional(),
  affiliateCode: z.string().trim().max(50).optional(),
  actualUsers: z.number().int().min(1).optional(),
  actualEntities: z.number().int().min(1).optional(),
});

/**
 * Self-service tenant signup — creates the tenant as PendingPayment AND a
 * Pending payment_verifications row from the transfer proof the signer
 * reports. App Owner reviews it (approve activates, reject stays pending)
 * instead of blindly trusting an "Activate" click with no evidence.
 */
publicRouter.post("/signup", publicWriteLimiter, validateBody(signupSchema), rejectBreachedPassword((req) => req.body.adminPassword), async (req, res) => {
  const {
    tenantName,
    subdomain,
    adminName,
    adminEmail,
    adminPassword,
    planId,
    totalMonths,
    bankAccountId,
    referenceNumber,
    note,
    promoCode,
    affiliateCode,
    actualUsers,
    actualEntities,
  } = req.body;

  const [existing] = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain)).limit(1);
  if (existing) return res.status(409).json({ error: "Subdomain sudah digunakan tenant lain" });

  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
  if (!plan) return res.status(400).json({ error: "Paket tidak ditemukan" });

  const [destinationAccount] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, bankAccountId)).limit(1);
  if (!destinationAccount || !destinationAccount.isActive) return res.status(400).json({ error: "Rekening tujuan transfer tidak valid" });

  const { monthlyPriceIdr, error: priceError } = await resolveEffectiveMonthlyPrice(plan, actualUsers, actualEntities);
  if (priceError) return res.status(400).json({ error: priceError });

  const schemes = await db.select().from(discountSchemes).where(eq(discountSchemes.planId, planId));
  const schemeDiscount = schemes
    .filter((s) => s.isActive && s.schemeType === "duration_months")
    .reduce((best, s) => Math.max(best, bestTierDiscount(s.tiers, totalMonths)), 0);

  let promoDiscount = 0;
  try {
    promoDiscount = await resolvePromoDiscount(promoCode, planId);
  } catch (err) {
    if (err instanceof InvalidPromoError) return res.status(400).json({ error: err.message });
    throw err;
  }

  let affiliateInfo = { affiliateId: null as string | null, customerDiscountPercent: 0, commissionPercent: 0 };
  try {
    affiliateInfo = await resolveAffiliateDiscount(affiliateCode, planId);
  } catch (err) {
    if (err instanceof InvalidAffiliateError) return res.status(400).json({ error: err.message });
    throw err;
  }

  const total = computeSubscriptionTotal(monthlyPriceIdr, totalMonths, [schemeDiscount, promoDiscount, affiliateInfo.customerDiscountPercent]);

  const [tenant] = await db
    .insert(tenants)
    .values({ name: tenantName, subdomain, planId, status: "PendingPayment" })
    .returning();

  const [subscription] = await db
    .insert(tenantSubscriptions)
    .values({ tenantId: tenant.id, planId, committedMonths: totalMonths, status: "PendingPayment", actualUsers, actualEntities })
    .returning();

  const openingEvents = [
    ...Array.from({ length: actualUsers ?? 0 }, () => ({ tenantSubscriptionId: subscription.id, resourceType: "user" as const })),
    ...Array.from({ length: actualEntities ?? 0 }, () => ({ tenantSubscriptionId: subscription.id, resourceType: "entity" as const })),
  ];
  if (openingEvents.length > 0) await db.insert(subscriptionUsageEvents).values(openingEvents);

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await db.insert(users).values({
    tenantId: tenant.id,
    role: "tenant_admin",
    name: adminName,
    email: adminEmail,
    passwordHash,
  });

  await db.insert(paymentVerifications).values({
    tenantId: tenant.id,
    amountIdr: total.finalTotalIdr,
    bankAccountId: destinationAccount.id,
    bankName: destinationAccount.bankName,
    referenceNumber,
    note,
  });
  await recordPromoUsage(promoCode);
  await recordAffiliateUsage(affiliateInfo.affiliateId, tenant.id, total.finalTotalIdr, affiliateInfo.commissionPercent);

  await logAudit({
    actorUserId: null,
    tenantId: tenant.id,
    action: "tenant.signup",
    details: { totalMonths, promoCode, affiliateCode, appliedDiscountPercent: total.appliedDiscountPercent, finalTotalIdr: total.finalTotalIdr },
  });
  await sendSignupPendingEmail(adminEmail, tenantName);

  res.status(201).json({ tenantId: tenant.id, subdomain: tenant.subdomain, status: tenant.status });
});

const contactSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().toLowerCase().email(),
  subject: z.string().trim().min(2).max(300),
  message: z.string().trim().min(2).max(5000),
});

publicRouter.post("/contact", publicWriteLimiter, validateBody(contactSchema), async (req, res) => {
  const { name, email, subject, message } = req.body;
  const [inquiry] = await db.insert(contactInquiries).values({ name, email, subject, message }).returning();
  res.status(201).json({ id: inquiry.id });
});

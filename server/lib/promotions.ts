import { eq, sql } from "drizzle-orm";
import { db } from "../db/client.ts";
import { promotions, affiliates, affiliateUsages } from "../db/schema.ts";

export class InvalidPromoError extends Error {}

/**
 * Looks up a promo code and validates it's usable right now (active,
 * within date window, under its use cap, AND belongs to the plan it's
 * being applied to — "promo itu berlaku ke paket mana" is enforced here,
 * not left to the caller). Shared by public signup and App Owner's
 * custom-tenant creation so the rule can't drift between entry points.
 */
export async function resolvePromoDiscount(code: string | undefined | null, planId?: string): Promise<number> {
  if (!code) return 0;
  const [promo] = await db.select().from(promotions).where(eq(promotions.code, code.trim().toUpperCase())).limit(1);
  if (!promo) throw new InvalidPromoError("Kode promo tidak ditemukan");
  if (planId && promo.planId !== planId) throw new InvalidPromoError("Kode promo ini tidak berlaku untuk paket yang dipilih");
  if (!promo.isActive) throw new InvalidPromoError("Kode promo sudah tidak aktif");
  const now = new Date();
  if (now < promo.validFrom || now > promo.validUntil) throw new InvalidPromoError("Kode promo sudah tidak berlaku");
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) throw new InvalidPromoError("Kode promo sudah mencapai batas pemakaian");
  return promo.discountPercent;
}

export async function recordPromoUsage(code: string | undefined | null) {
  if (!code) return;
  await db
    .update(promotions)
    .set({ usedCount: sql`${promotions.usedCount} + 1` })
    .where(eq(promotions.code, code.trim().toUpperCase()));
}

export class InvalidAffiliateError extends Error {}

export async function resolveAffiliateDiscount(code: string | undefined | null, planId?: string) {
  if (!code) return { affiliateId: null as string | null, customerDiscountPercent: 0, commissionPercent: 0 };
  const [aff] = await db.select().from(affiliates).where(eq(affiliates.code, code.trim().toUpperCase())).limit(1);
  if (!aff) throw new InvalidAffiliateError("Kode affiliate tidak ditemukan");
  if (planId && aff.planId !== planId) throw new InvalidAffiliateError("Kode affiliate ini tidak berlaku untuk paket yang dipilih");
  if (!aff.isActive) throw new InvalidAffiliateError("Kode affiliate sudah tidak aktif");
  return { affiliateId: aff.id, customerDiscountPercent: aff.customerDiscountPercent, commissionPercent: aff.commissionPercent };
}

/** Logs one usage for payout reporting and bumps the affiliate's counter — called after the tenant/payment record is actually created, with the FINAL amount paid. */
export async function recordAffiliateUsage(affiliateId: string | null, tenantId: string, amountPaidIdr: number, commissionPercent: number) {
  if (!affiliateId) return;
  const commissionIdr = Math.round(amountPaidIdr * (commissionPercent / 100));
  await db.insert(affiliateUsages).values({ affiliateId, tenantId, amountPaidIdr, commissionIdr });
  await db.update(affiliates).set({ usedCount: sql`${affiliates.usedCount} + 1` }).where(eq(affiliates.id, affiliateId));
}

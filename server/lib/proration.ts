/**
 * Prorated/metered billing math — mid-month seat/entity changes are billed
 * by days-active, not as a flat add/remove. Pure functions only; the
 * subscriptionUsageEvents ledger (server/db/schema.ts) supplies the dates,
 * a monthly invoice-generation job (not yet wired to a scheduler — no cron
 * runner exists in this stack) would call these per billing period.
 *
 * Formula: Biaya Add-on = Harga per Unit × (Hari Aktif / Total Hari Bulan)
 */

export interface UsageEvent {
  activatedAt: Date;
  deactivatedAt: Date | null;
}

/** Days an event was active within [periodStart, periodEnd) — clipped to the period. */
export function activeDaysInPeriod(event: UsageEvent, periodStart: Date, periodEnd: Date): number {
  const start = event.activatedAt > periodStart ? event.activatedAt : periodStart;
  const endRaw = event.deactivatedAt && event.deactivatedAt < periodEnd ? event.deactivatedAt : periodEnd;
  const end = endRaw < start ? start : endRaw;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
}

/** Biaya Add-on = Harga per Unit × (Hari Aktif / Total Hari Bulan). */
export function proratedAddonCharge(pricePerUnitIdr: number, activeDays: number, daysInMonth: number): number {
  return Math.round(pricePerUnitIdr * (activeDays / daysInMonth));
}

/** Unused-day value of a removed unit, turned into account credit — same formula, applied to the remaining days. */
export function proratedDowngradeCredit(pricePerUnitIdr: number, unusedDays: number, daysInMonth: number): number {
  return Math.round(pricePerUnitIdr * (unusedDays / daysInMonth));
}

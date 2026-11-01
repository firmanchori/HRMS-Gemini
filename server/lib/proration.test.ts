import { describe, it, expect } from "vitest";
import { activeDaysInPeriod, proratedAddonCharge, proratedDowngradeCredit } from "./proration.ts";

const monthStart = new Date("2026-01-01T00:00:00Z");
const monthEnd = new Date("2026-01-31T00:00:00Z"); // 30-day month basis per the pricing spec

describe("activeDaysInPeriod — PRO plan case study from the pricing spec", () => {
  it("a user added on day 11 is active 20 of the 30 days", () => {
    const event = { activatedAt: new Date("2026-01-11T00:00:00Z"), deactivatedAt: null };
    expect(activeDaysInPeriod(event, monthStart, monthEnd)).toBe(20);
  });

  it("an entity added on day 16 is active 15 of the 30 days", () => {
    const event = { activatedAt: new Date("2026-01-16T00:00:00Z"), deactivatedAt: null };
    expect(activeDaysInPeriod(event, monthStart, monthEnd)).toBe(15);
  });

  it("clips activation to the period start when it happened before the period", () => {
    const event = { activatedAt: new Date("2025-12-01T00:00:00Z"), deactivatedAt: null };
    expect(activeDaysInPeriod(event, monthStart, monthEnd)).toBe(30);
  });

  it("clips deactivation to the period end when it happens after the period", () => {
    const event = { activatedAt: monthStart, deactivatedAt: new Date("2026-02-15T00:00:00Z") };
    expect(activeDaysInPeriod(event, monthStart, monthEnd)).toBe(30);
  });
});

describe("proratedAddonCharge — Biaya Add-on = Harga per Unit x (Hari Aktif / Total Hari Bulan)", () => {
  it("prorates an upgrade charge for the remaining days in the cycle", () => {
    expect(proratedAddonCharge(75_000, 20, 30)).toBe(50_000);
  });
});

describe("proratedDowngradeCredit — downgrade case study from the pricing spec", () => {
  it("removing 1 PRO user on day 20 (10 unused days) credits 1 x Rp75.000 x (10/30) = Rp25.000", () => {
    expect(proratedDowngradeCredit(75_000, 10, 30)).toBe(25_000);
  });
});

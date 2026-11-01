import { describe, it, expect } from "vitest";
import {
  calculatePricing,
  computeMonthlyReference,
  computeDisplayReference,
  bestTierDiscount,
  computeSubscriptionTotal,
  expandModuleCodes,
  expandModuleRows,
  type ModulePricing,
} from "./pricing.ts";

const approvalModule: ModulePricing = { code: "approvals", basePriceIdr: 100_000, pricePerUserIdr: 3_000, pricePerEntityIdr: 15_000 };

describe("calculatePricing", () => {
  it("matches the Starter/Approval example from the pricing spec: Rp100.000 + Rp3.000/user + Rp15.000/entitas", () => {
    const result = calculatePricing({
      selectedModules: [approvalModule],
      maxUsers: 10,
      maxEntities: 2,
      durationDays: 30,
      discountPercent: 0,
    });
    // 100.000 + (3.000*10) + (15.000*2) = 160.000 per cycle
    expect(result.subtotalPerCycle).toBe(160_000);
    expect(result.cycles).toBe(1);
    expect(result.finalPriceIdr).toBe(160_000);
  });

  it("scales across multiple 30-day cycles and applies a flat discount", () => {
    const result = calculatePricing({
      selectedModules: [approvalModule],
      maxUsers: 10,
      maxEntities: 2,
      durationDays: 90, // 3 cycles
      discountPercent: 10,
    });
    expect(result.cycles).toBe(3);
    expect(result.subtotal).toBe(160_000 * 3);
    expect(result.discountAmount).toBe(Math.round(160_000 * 3 * 0.1));
    expect(result.finalPriceIdr).toBe(result.subtotal - result.discountAmount);
  });
});

describe("computeDisplayReference", () => {
  it("excludes per-user/per-entity components by default (headline price is base-only)", () => {
    const base = computeDisplayReference([approvalModule], 50, 5, false, false);
    expect(base).toBe(100_000);
  });

  it("includes only the components the App Owner opted into", () => {
    const withUserOnly = computeDisplayReference([approvalModule], 50, 5, true, false);
    expect(withUserOnly).toBe(100_000 + 3_000 * 50);

    const withBoth = computeDisplayReference([approvalModule], 50, 5, true, true);
    expect(withBoth).toBe(100_000 + 3_000 * 50 + 15_000 * 5);
  });
});

describe("expandModuleCodes / expandModuleRows — regression for the Enterprise '*' pricing bug", () => {
  const allCodes = ["ess", "payroll", "approvals"];
  const allRows: ModulePricing[] = [
    { code: "ess", basePriceIdr: 1, pricePerUserIdr: 0, pricePerEntityIdr: 0 },
    { code: "payroll", basePriceIdr: 2, pricePerUserIdr: 0, pricePerEntityIdr: 0 },
    approvalModule,
  ];

  it("expands '*' to every real module code instead of matching nothing", () => {
    expect(expandModuleCodes(["*"], allCodes)).toEqual(allCodes);
    expect(expandModuleRows(["*"], allRows)).toEqual(allRows);
  });

  it("leaves an explicit module list untouched", () => {
    expect(expandModuleCodes(["ess"], allCodes)).toEqual(["ess"]);
    expect(expandModuleRows(["ess"], allRows)).toEqual([allRows[0]]);
  });
});

describe("bestTierDiscount", () => {
  const tiers = [
    { minValue: 12, discountPercent: 10 },
    { minValue: 24, discountPercent: 20 },
    { minValue: 60, discountPercent: 35 },
  ];

  it("picks the highest tier whose threshold is met", () => {
    expect(bestTierDiscount(tiers, 14)).toBe(10);
    expect(bestTierDiscount(tiers, 24)).toBe(20);
    expect(bestTierDiscount(tiers, 60)).toBe(35);
    expect(bestTierDiscount(tiers, 100)).toBe(35);
  });

  it("returns 0 when no tier is met", () => {
    expect(bestTierDiscount(tiers, 6)).toBe(0);
    expect(bestTierDiscount([], 100)).toBe(0);
  });
});

describe("computeSubscriptionTotal — 'best discount wins, never stacked' rule", () => {
  it("applies only the single highest discount among scheme/promo/affiliate candidates", () => {
    // scheme=10%, promo=15%, affiliate=5% -> only 15% applies, not 30%
    const result = computeSubscriptionTotal(1_000_000, 12, [10, 15, 5]);
    expect(result.baseTotalIdr).toBe(12_000_000);
    expect(result.appliedDiscountPercent).toBe(15);
    expect(result.discountAmountIdr).toBe(Math.round(12_000_000 * 0.15));
    expect(result.finalTotalIdr).toBe(result.baseTotalIdr - result.discountAmountIdr);
  });

  it("falls back to 0% when every candidate is 0 (no discount configured)", () => {
    const result = computeSubscriptionTotal(500_000, 1, [0, 0, 0]);
    expect(result.appliedDiscountPercent).toBe(0);
    expect(result.finalTotalIdr).toBe(500_000);
  });
});

describe("computeMonthlyReference", () => {
  it("is the one-cycle, no-discount subtotal", () => {
    expect(computeMonthlyReference([approvalModule], 10, 2)).toBe(160_000);
  });
});

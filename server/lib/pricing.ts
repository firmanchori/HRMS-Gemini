export interface ModulePricing {
  code: string;
  basePriceIdr: number;
  pricePerUserIdr: number;
  pricePerEntityIdr: number;
}

export interface PricingInput {
  selectedModules: ModulePricing[];
  maxEntities: number;
  maxUsers: number;
  durationDays: number;
  discountPercent: number;
}

export interface PricingBreakdown {
  perModule: { code: string; baseTotal: number; perUserTotal: number; perEntityTotal: number; moduleTotal: number }[];
  subtotalPerCycle: number;
  cycles: number;
  subtotal: number;
  discountAmount: number;
  finalPriceIdr: number;
}

const BILLING_CYCLE_DAYS = 30;

/**
 * Pure pricing calculation — a custom plan's price is the sum, across its
 * selected modules, of (base + perUser*maxUsers + perEntity*maxEntities),
 * scaled by how many 30-day billing cycles the chosen duration covers, then
 * reduced by discountPercent. No DB access — kept pure so it's directly
 * unit-testable per .claude/testing-standards.md.
 */
export function calculatePricing(input: PricingInput): PricingBreakdown {
  const cycles = Math.max(1, Math.ceil(input.durationDays / BILLING_CYCLE_DAYS));

  const perModule = input.selectedModules.map((m) => {
    const baseTotal = m.basePriceIdr;
    const perUserTotal = m.pricePerUserIdr * input.maxUsers;
    const perEntityTotal = m.pricePerEntityIdr * input.maxEntities;
    return { code: m.code, baseTotal, perUserTotal, perEntityTotal, moduleTotal: baseTotal + perUserTotal + perEntityTotal };
  });

  const subtotalPerCycle = perModule.reduce((sum, m) => sum + m.moduleTotal, 0);
  const subtotal = subtotalPerCycle * cycles;
  const discountPercent = Math.min(100, Math.max(0, input.discountPercent));
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const finalPriceIdr = subtotal - discountAmount;

  return { perModule, subtotalPerCycle, cycles, subtotal, discountAmount, finalPriceIdr };
}

/**
 * The monthly "list price" (reference price) for a set of modules at a
 * given seat/entity count — exactly one 30-day cycle's worth, no term
 * discount applied. This is what `subscription_plans.referenceMonthlyPriceIdr`
 * is always computed from (never typed freely — see appOwner.ts plan routes).
 */
export function computeMonthlyReference(selectedModules: ModulePricing[], maxUsers: number, maxEntities: number): number {
  return calculatePricing({ selectedModules, maxEntities, maxUsers, durationDays: 30, discountPercent: 0 }).subtotalPerCycle;
}

/**
 * The headline "package price" shown to a prospective tenant BEFORE they
 * enter their real employee/entity count — base module price only by
 * default, excluding the per-user and per-entity components so the number
 * isn't inflated by the plan's maxEmployees/maxEntities ceiling. App Owner
 * can opt each component back in per plan (includeUser/includeEntity).
 */
export function computeDisplayReference(
  selectedModules: ModulePricing[],
  maxUsers: number,
  maxEntities: number,
  includeUser: boolean,
  includeEntity: boolean
): number {
  const { perModule } = calculatePricing({ selectedModules, maxEntities, maxUsers, durationDays: 30, discountPercent: 0 });
  return perModule.reduce((sum, m) => sum + m.baseTotal + (includeUser ? m.perUserTotal : 0) + (includeEntity ? m.perEntityTotal : 0), 0);
}

export interface DiscountTier {
  minValue: number;
  discountPercent: number;
}

/** Highest-tier discount whose threshold `value` meets or exceeds — e.g. 14 months against [12→10%,24→20%] gives 10%. 0 if no tier matches or the scheme has no tiers. */
export function bestTierDiscount(tiers: DiscountTier[], value: number): number {
  const matching = tiers.filter((t) => value >= t.minValue);
  if (matching.length === 0) return 0;
  return Math.max(...matching.map((t) => t.discountPercent));
}

export interface SubscriptionTotal {
  monthlyPriceIdr: number;
  totalMonths: number;
  baseTotalIdr: number;
  appliedDiscountPercent: number;
  discountAmountIdr: number;
  finalTotalIdr: number;
}

/**
 * The actual amount a tenant pays for `totalMonths` of a plan whose
 * effective monthly price (already net of the plan's own permanent
 * markdown) is `monthlyPriceIdr`. `candidateDiscountPercents` collects
 * every discount that could apply — the plan's own duration/user/entity
 * schemes, a matching promo code, a matching affiliate code — and the
 * SINGLE HIGHEST one wins. Discounts are deliberately never stacked/summed;
 * see the "best discount wins" rule in docs this turn's chat response and
 * server/db/schema.ts's discountSchemes comment.
 */
export function computeSubscriptionTotal(monthlyPriceIdr: number, totalMonths: number, candidateDiscountPercents: number[]): SubscriptionTotal {
  const baseTotalIdr = monthlyPriceIdr * totalMonths;
  const appliedDiscountPercent = Math.min(100, Math.max(0, ...candidateDiscountPercents, 0));
  const discountAmountIdr = Math.round(baseTotalIdr * (appliedDiscountPercent / 100));
  return {
    monthlyPriceIdr,
    totalMonths,
    baseTotalIdr,
    appliedDiscountPercent,
    discountAmountIdr,
    finalTotalIdr: baseTotalIdr - discountAmountIdr,
  };
}

import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

export const tenantStatusEnum = pgEnum("tenant_status", [
  "PendingPayment",
  "Active",
  "Suspended",
  "Expired",
  "Cancelled",
]);

export const userRoleEnum = pgEnum("user_role", ["app_owner", "tenant_admin"]);

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "New",
  "Replied",
  "Closed",
]);

export const paymentVerificationStatusEnum = pgEnum("payment_verification_status", [
  "Pending",
  "Approved",
  "Rejected",
]);

/**
 * All prices here are MONTHLY rates (per 30-day cycle) — a plan's
 * `priceIdr` is "per bulan", never a lump sum for a fixed term. Term length
 * is chosen at signup time (`totalMonths`), not baked into the plan; the
 * discount for committing to a longer term lives in `discountSchemes`
 * (schemeType = 'duration_months'), not in this row.
 */
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  allowsMultiEntity: boolean("allows_multi_entity").notNull().default(false),
  maxEmployees: integer("max_employees").notNull(),
  enabledModules: jsonb("enabled_modules").notNull().$type<string[]>(),
  // Suggested/default term shown on the pricing card — signup can override
  // with any totalMonths; this is not a hard constraint.
  durationDays: integer("duration_days").notNull(),
  // Computed automatically from the selected modules' catalog pricing
  // (server/lib/pricing.ts) — never typed freely. This is the reference
  // "list price" per month, before the permanent markdown below.
  referenceMonthlyPriceIdr: integer("reference_monthly_price_idr").notNull().default(0),
  // Permanent markdown ("harusnya 1 milyar jadi 500jt sesuai instruksi
  // marketing") — distinct from promo codes and duration/quantity discount
  // schemes. Requires a reason for audit purposes. priceIdr below is
  // ALWAYS referenceMonthlyPriceIdr * (1 - permanentDiscountPercent/100),
  // recomputed server-side on every create/update — never set directly.
  permanentDiscountPercent: integer("permanent_discount_percent").notNull().default(0),
  permanentDiscountReason: text("permanent_discount_reason"),
  priceIdr: integer("price_idr").notNull(), // = effective monthly sale price, server-computed
  // What prospective tenants see as "the price" (public site, signup plan
  // picker) BEFORE they enter their real employee/entity count — by default
  // this is the package/module price ONLY, excluding the per-user and
  // per-entity components, so the headline number isn't inflated by
  // maxEmployees/maxEntities. App Owner can opt each component back into
  // the displayed price via the two checkboxes below. Server-computed from
  // the same module catalog + permanent markdown as priceIdr — never typed
  // freely (see resolvePlanPricing in appOwner.ts).
  displayIncludesUserPricing: boolean("display_includes_user_pricing").notNull().default(false),
  displayIncludesEntityPricing: boolean("display_includes_entity_pricing").notNull().default(false),
  displayPriceIdr: integer("display_price_idr").notNull().default(0),
  // Custom plans (one-off, built per tenant via the App Owner "Daftarkan
  // Tenant" > Custom flow) vs reusable named packages (Starter/Enterprise).
  isCustom: boolean("is_custom").notNull().default(false),
  maxEntities: integer("max_entities").notNull().default(1),
  discountPercent: integer("discount_percent").notNull().default(0), // one-off manual discount, custom plans only
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const discountSchemeTypeEnum = pgEnum("discount_scheme_type", ["duration_months", "user_count", "entity_count"]);

/**
 * Per-plan discount tiers — e.g. "Diskon Tahunan": duration_months tiers
 * [{minValue:12,discountPercent:10},{minValue:24,discountPercent:20},
 * {minValue:60,discountPercent:35}], or a user_count/entity_count scheme
 * for volume discounts. A plan can have several schemes (one per type, or
 * several of the same type for different campaigns); at checkout the
 * single HIGHEST-matching discount across all of a plan's active schemes,
 * active promotions, and active affiliate codes is applied — discounts are
 * never stacked/summed (documented business rule, see server/lib/pricing.ts).
 */
export const discountSchemes = pgTable("discount_schemes", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").references(() => subscriptionPlans.id).notNull(),
  schemeType: discountSchemeTypeEnum("scheme_type").notNull(),
  label: text("label").notNull(),
  tiers: jsonb("tiers").notNull().$type<{ minValue: number; discountPercent: number }[]>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Per-module pricing catalog — App Owner sets, per module: a base price per
 * billing cycle, an additional price per user, and an additional price per
 * entity/tenant-seat. A custom plan's price is computed by summing these
 * across the modules selected for it (server/lib/pricing.ts), then applying
 * the plan's discountPercent.
 */
export const modules = pgTable("modules", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  // Marketing copy — one clear sentence on what this module does, edited
  // by App Owner for the public site/signup/Daftarkan Tenant detail view.
  // Distinct from the module's feature list (server/lib/moduleCatalog.ts
  // extractFeatures), which is always derived automatically from the
  // module's own code and never hand-typed.
  description: text("description"),
  basePriceIdr: integer("base_price_idr").notNull().default(0),
  pricePerUserIdr: integer("price_per_user_idr").notNull().default(0),
  pricePerEntityIdr: integer("price_per_entity_idr").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  status: tenantStatusEnum("status").notNull().default("PendingPayment"),
  planId: uuid("plan_id").references(() => subscriptionPlans.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tenantSubscriptions = pgTable("tenant_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  planId: uuid("plan_id").references(() => subscriptionPlans.id).notNull(),
  // What the customer actually chose/paid for at signup ("jumlah bulan" —
  // point 2) — decoupled from the plan's own durationDays, which for a
  // reusable preset plan is just a display default, not a commitment.
  // Activation (server/routes/appOwner.ts activateTenant) computes expiresAt
  // from THIS, falling back to the plan's durationDays only if absent
  // (e.g. for the App-Owner-direct "preset" creation path).
  committedMonths: integer("committed_months"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  status: text("status").notNull().default("PendingPayment"),
  // What the registrant actually declared at signup/registration — the
  // basis billing is computed from, NOT the plan's maxEmployees/maxEntities
  // ceiling ("Harga bukan harga final"). Mirrored into subscriptionUsageEvents
  // as the opening active-seat rows so prorated billing has a starting ledger.
  actualUsers: integer("actual_users"),
  actualEntities: integer("actual_entities"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usageResourceTypeEnum = pgEnum("usage_resource_type", ["user", "entity"]);

/**
 * Event log of seat/entity activation & deactivation — required because a
 * mid-month add/remove must be billed prorated by days-active, so a single
 * "current total" column is not enough ("database Anda tidak boleh hanya
 * menyimpan jumlah total saat ini... harus mencatat log setiap aktivitas").
 * deactivatedAt IS NULL means the seat is still active through month-end.
 * Monthly invoice generation (server/lib/proration.ts) walks this table for
 * the billing period to compute prorated add-on charges and downgrade credits.
 */
export const subscriptionUsageEvents = pgTable("subscription_usage_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantSubscriptionId: uuid("tenant_subscription_id").references(() => tenantSubscriptions.id).notNull(),
  resourceType: usageResourceTypeEnum("resource_type").notNull(),
  activatedAt: timestamp("activated_at", { withTimezone: true }).notNull().defaultNow(),
  deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Running account-credit ledger — a downgrade's unused prorated value is
 * never refunded in cash, it becomes a credit that auto-deducts from the
 * tenant's next invoice ("Saldo Rp25.000 ini akan otomatis memotong invoice
 * bulan depan"). Positive amountIdr = credit owed to the tenant; consumedAt
 * set once an invoice has applied it.
 */
export const accountCredits = pgTable("account_credits", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  amountIdr: integer("amount_idr").notNull(),
  reason: text("reason").notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const invoiceStatusEnum = pgEnum("invoice_status", ["Pending", "Paid", "Cancelled"]);

/**
 * A real billing-period invoice — base subscription cost for the period
 * minus any unconsumed account_credits, as a proper document instead of
 * the ad-hoc payment_verifications row used for signup/upgrade top-ups.
 * `lineItems` is the readable breakdown (base charge, each credit applied);
 * marking Paid is still a manual App Owner action (no payment gateway),
 * but it's now its own trackable record per billing period per tenant.
 */
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  lineItems: jsonb("line_items").notNull().$type<{ description: string; amountIdr: number }[]>(),
  totalAmountIdr: integer("total_amount_idr").notNull(),
  status: invoiceStatusEnum("status").notNull().default("Pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  role: userRoleEnum("role").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailChangeRequests = pgTable("email_change_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  newEmail: text("new_email").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogEntries = pgTable("audit_log_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  action: text("action").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mailerProviderEnum = pgEnum("mailer_provider", ["resend", "smtp"]);

/**
 * Editable mailer configuration — replaces the env-var-only Resend setup.
 * `tenantId = NULL` is the platform-wide (App Owner) config; a non-null
 * `tenantId` row is a tenant's own override (the "pakai email perusahaan
 * sendiri" requirement) — server/lib/email.ts resolves tenant row first,
 * falls back to the platform row, falls back to env vars if neither exists
 * yet. Secrets are AES-256-GCM encrypted (server/lib/crypto.ts), never
 * stored or returned in plaintext.
 */
export const emailConfigs = pgTable("email_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id), // NULL = platform-wide
  provider: mailerProviderEnum("provider").notNull().default("resend"),
  fromName: text("from_name").notNull(),
  fromEmail: text("from_email").notNull(),
  resendApiKeyEncrypted: text("resend_api_key_encrypted"),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUsername: text("smtp_username"),
  smtpPasswordEncrypted: text("smtp_password_encrypted"),
  smtpSecure: boolean("smtp_secure").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Reusable promo/discount codes — each code belongs to exactly ONE plan
 * (planId required) so "promo ini berlaku ke paket mana" is never
 * ambiguous; a promo for a different plan simply won't validate. Several
 * promo codes (several "skema") can point at the same plan — that's how
 * "1 jenis promo bisa banyak skema" is modeled: as multiple rows, each a
 * single flat discount, rather than one row with multiple tiers (kept
 * simple to match discountSchemes' tiered model instead of duplicating it).
 */
export const promotions = pgTable("promotions", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").references(() => subscriptionPlans.id).notNull(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  discountPercent: integer("discount_percent").notNull(),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Affiliate referral codes — like a promotion but two-sided: the referred
 * customer gets `customerDiscountPercent` off, and the affiliate earns
 * `commissionPercent` of what the customer actually paid (recorded per use
 * in `affiliateUsages` for payout reporting). Also tied to one plan.
 */
export const affiliates = pgTable("affiliates", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").references(() => subscriptionPlans.id).notNull(),
  code: text("code").notNull().unique(),
  affiliateName: text("affiliate_name").notNull(),
  customerDiscountPercent: integer("customer_discount_percent").notNull(),
  commissionPercent: integer("commission_percent").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  usedCount: integer("used_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const affiliateUsages = pgTable("affiliate_usages", {
  id: uuid("id").defaultRandom().primaryKey(),
  affiliateId: uuid("affiliate_id").references(() => affiliates.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  amountPaidIdr: integer("amount_paid_idr").notNull(),
  commissionIdr: integer("commission_idr").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * The platform's own destination bank accounts — shown to a registrant on
 * the signup payment step so they actually know where to transfer ("ga tau
 * harus transfer kemana"). App Owner manages the list; more than one bank
 * can be active at a time so a registrant can pick whichever they hold an
 * account with.
 */
export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountHolderName: text("account_holder_name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** A tenant's self-reported bank-transfer proof at signup, reviewed by App Owner before activation. */
export const paymentVerifications = pgTable("payment_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  amountIdr: integer("amount_idr").notNull(),
  bankAccountId: uuid("bank_account_id").references(() => bankAccounts.id),
  bankName: text("bank_name").notNull(), // snapshot of the destination bank's name at signup time, kept even if the account is later edited/removed
  referenceNumber: text("reference_number").notNull(),
  note: text("note"),
  status: paymentVerificationStatusEnum("status").notNull().default("Pending"),
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contactInquiries = pgTable("contact_inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: inquiryStatusEnum("status").notNull().default("New"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contactReplies = pgTable("contact_replies", {
  id: uuid("id").defaultRandom().primaryKey(),
  inquiryId: uuid("inquiry_id").references(() => contactInquiries.id).notNull(),
  body: text("body").notNull(),
  sentByUserId: uuid("sent_by_user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

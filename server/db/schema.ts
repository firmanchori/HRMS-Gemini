import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  pgEnum,
  primaryKey,
  doublePrecision,
  uniqueIndex,
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
  // Which company entity this tenant_admin is scoped to (null for app_owner,
  // and briefly null for a brand-new tenant's registration admin until its
  // holding entity is created). A tenant_admin can only manage THIS entity's
  // own user roster and create the one admin for an entity it directly
  // parents — never a sibling's or an ancestor's (see tenant.ts entities/users
  // routes). Visibility of entities themselves still follows the separate
  // vertical entity_closure rule.
  entityId: uuid("entity_id").references((): any => companyEntities.id),
  role: userRoleEnum("role").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),
  // TOTP 2FA (RFC 6238) — opt-in, added 2026-11-09 after a security review
  // found the app's UI claiming "2FA aktif" when no such mechanism existed
  // anywhere. totpSecretEncrypted holds an AES-256-GCM-encrypted base32
  // secret (never plaintext at rest — see server/lib/crypto.ts), set as
  // soon as enrollment starts but totpEnabled stays false until the user
  // confirms a real code, so a half-finished enrollment never locks anyone
  // out. totpBackupCodesHash stores only SHA-256 hashes of one-time
  // recovery codes (same non-reversible pattern as password reset tokens)
  // — the plaintext codes are shown to the user exactly once at
  // confirmation time and never stored.
  totpSecretEncrypted: text("totp_secret_encrypted"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  totpBackupCodesHash: jsonb("totp_backup_codes_hash").$type<string[]>(),
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

// ---------------------------------------------------------------------------
// Tenant-side company structure (docs/ERD.md §4.4a/§4.4) — entities form an
// UNLIMITED-DEPTH tree (not the old fixed holding/anak/cucu 3-level enum),
// with visibility and settings-delegation rules that are asymmetric and
// hierarchical, not just tenant-scoped:
//   - An ancestor entity sees ALL of its descendants' data.
//   - A child entity sees only itself + its own descendants.
//   - Sibling entities (two children of the same parent) NEVER see each
//     other, even though their shared parent sees both.
// entity_closure makes "which entities can X see" an O(1) indexed lookup
// instead of a recursive query, and is maintained by server/lib/orgStructure.ts
// whenever a new entity is created (copy the parent's own closure rows,
// each one depth+1, plus a self row at depth 0).
// ---------------------------------------------------------------------------

export const entityRelationTypeEnum = pgEnum("entity_relation_type", ["resmi", "administratif"]);
export const entityStatusEnum = pgEnum("entity_status", ["Aktif", "Nonaktif"]);

export const companyEntities = pgTable("company_entities", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  // NULL = this tenant's root entity. A tenant may have more than one root
  // only in edge cases (e.g. migrating two formerly-separate companies into
  // one tenant) — the common case is exactly one root per tenant.
  parentEntityId: uuid("parent_entity_id").references((): any => companyEntities.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
  // Deliberately NOT globally unique — sibling/child entities are allowed to
  // reuse their parent's email domain (see docs/PRD.md §1.1 poin 4).
  emailDomain: text("email_domain"),
  relationType: entityRelationTypeEnum("relation_type").notNull().default("resmi"),
  // Lean entities can skip the Department layer and go straight Divisi -> Jabatan.
  useDepartmentLevel: boolean("use_department_level").notNull().default(true),
  npwp: text("npwp"),
  address: text("address"),
  city: text("city"),
  nikPattern: text("nik_pattern"),
  // Explicit toggle (user correction, 2026-11-01): unlike the other copied
  // fields, NIK format needs a visible, persistent choice — not just "was it
  // omitted at creation". true = this entity's nikPattern was copied from
  // its parent's CURRENT value (dead copy, re-copied whenever this flag is
  // (re)set to true); false = someone deliberately set a custom pattern.
  // Always false for a root entity (nothing to follow).
  nikPatternFollowsParent: boolean("nik_pattern_follows_parent").notNull().default(true),
  docPrefix: text("doc_prefix"),
  status: entityStatusEnum("status").notNull().default("Aktif"),
  // Mirrors the existing frontend concept (isEntityGovernanceLocked):
  // false = baseline setup mode, HR can edit divisions/departments/
  // positions/org nodes directly; true = formal governance is in force and
  // the SAME edits must go through org_change_proposals with an official
  // letter number instead. Enforced server-side in server/routes/tenant.ts,
  // not just hidden in the UI.
  isGovernanceLocked: boolean("is_governance_locked").notNull().default(false),
  // Branding is per-entity, not per-tenant — a holding's anak/cucu perusahaan can have its
  // own kop-surat logo and browser favicon distinct from the parent's (user correction).
  documentLogoUrl: text("document_logo_url"),
  appFaviconUrl: text("app_favicon_url"),
  createdByEntityId: uuid("created_by_entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const entityClosure = pgTable(
  "entity_closure",
  {
    ancestorEntityId: uuid("ancestor_entity_id").references(() => companyEntities.id).notNull(),
    descendantEntityId: uuid("descendant_entity_id").references(() => companyEntities.id).notNull(),
    // 0 = self row (every entity is its own descendant at depth 0).
    depth: integer("depth").notNull(),
  },
  (table) => [primaryKey({ columns: [table.ancestorEntityId, table.descendantEntityId] })]
);

/**
 * Settings inheritance (user correction, 2026-11-01): a child entity "membawa
 * pengaturan dari parent" as a ONE-TIME DEAD COPY at creation time — never a
 * live link. Changing the parent's settings later must NOT retroactively
 * change a child that already copied them. For company_entities itself this
 * just means: when creating a child with a parentEntityId, any of
 * nikPattern/docPrefix/useDepartmentLevel/relationType the request omits are
 * copied from the parent's CURRENT column values at that instant (plain
 * column defaults set once on INSERT — see resolveEntityDefaults in
 * server/routes/tenant.ts), not a separate overrides/delegation table.
 * Covers every module's settings going forward ("semua modul", not a fixed
 * list) the same way: copy the current value once, store it as the child's
 * own independent value.
 */

export const companyDivisions = pgTable("company_divisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id).notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  headTitle: text("head_title"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const companyDepartments = pgTable("company_departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id).notNull(),
  divisionId: uuid("division_id").references(() => companyDivisions.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  headTitle: text("head_title"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const gradingSchemeEnum = pgEnum("grading_scheme", ["single", "broadbanding"]);

/** Jabatan catalog/dictionary per entity — not itself an org-chart node (see orgStructureNodes below, which references this). */
export const masterJobPositions = pgTable("master_job_positions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id).notNull(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  defaultLevel: integer("default_level").notNull().default(5), // 1 Direksi .. 5 Staff
  divisionId: uuid("division_id").references(() => companyDivisions.id),
  departmentId: uuid("department_id").references(() => companyDepartments.id),
  jobFamily: text("job_family"),
  jobGrade: text("job_grade"),
  minGrade: text("min_grade"),
  maxGrade: text("max_grade"),
  gradingScheme: gradingSchemeEnum("grading_scheme").notNull().default("single"),
  description: text("description"),
  requirements: text("requirements"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const gradeSalaryRanges = pgTable("grade_salary_ranges", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id), // NULL = tenant-wide grade (shared across entities)
  gradeCode: text("grade_code").notNull(),
  gradeName: text("grade_name").notNull(),
  minSalary: integer("min_salary"),
  midSalary: integer("mid_salary"),
  maxSalary: integer("max_salary"),
  singleValueSalary: integer("single_value_salary"),
  effectiveDate: timestamp("effective_date", { withTimezone: true }).defaultNow().notNull(),
  version: integer("version").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orgNodeRelationTypeEnum = pgEnum("org_node_relation_type", ["struktural", "administratif"]);

/**
 * Formal structure-change workflow (user correction, 2026-11-01): editing
 * divisions/departments/positions/org-nodes is NEVER a direct silent edit —
 * HR drafts a proposal, it only becomes real once approved AND carries an
 * official letter reference ("surat resmi"), matching the existing frontend
 * concept (OrgChangeProposal / "restructure draft" in OrganizationManagement.tsx).
 * This is deliberately separate from personnel mutation (promosi/demosi/
 * mutasi of a specific employee) — struktur is the skeleton (who reports to
 * whom, what positions exist); personalia is who currently occupies it.
 * Personnel-mutation history is out of scope until the employees table
 * exists (next phase) and must never be logged in this table.
 */
export const orgChangeProposalStatusEnum = pgEnum("org_change_proposal_status", ["Draft", "PendingApproval", "Approved", "Rejected"]);

export const orgChangeProposals = pgTable("org_change_proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  // Required before a proposal may move to Approved — "bukan hanya sekedar
  // asal ubah". Validated in server/routes/tenant.ts, not just a UI hint.
  officialLetterNumber: text("official_letter_number"),
  // The proposed diff: { divisions: {create:[], update:[], delete:[]}, departments: {...}, positions: {...}, orgNodes: {...} }
  changes: jsonb("changes").notNull().$type<Record<string, unknown>>(),
  status: orgChangeProposalStatusEnum("status").notNull().default("Draft"),
  proposedByUserId: uuid("proposed_by_user_id").references(() => users.id).notNull(),
  approvedByUserId: uuid("approved_by_user_id").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orgSnapshotChangeTypeEnum = pgEnum("org_snapshot_change_type", ["restrukturisasi", "modifikasi"]);

/**
 * A full snapshot of one entity's structure, taken automatically right
 * before a proposal is applied, OR right before "Ajukan Restrukturisasi"
 * (re)opens a locked entity for direct editing — the "riwayat perubahan
 * struktur", browsable by effective date even while a new draft is being
 * edited live on top of the (now-unlocked) division/department/position/
 * org-node rows. proposalId stays null for the direct-edit restructuring
 * flow; the metadata fields below (skDocNumber..reason) are null for a
 * proposal-triggered snapshot, which already carries that detail on the
 * proposal itself.
 */
export const orgStructureSnapshots = pgTable("org_structure_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id).notNull(),
  proposalId: uuid("proposal_id").references(() => orgChangeProposals.id),
  divisions: jsonb("divisions").notNull().$type<unknown[]>(),
  departments: jsonb("departments").notNull().$type<unknown[]>(),
  positions: jsonb("positions").notNull().default([]).$type<unknown[]>(),
  orgNodes: jsonb("org_nodes").notNull().$type<unknown[]>(),
  skDocNumber: text("sk_doc_number"),
  effectiveDate: text("effective_date"),
  skDocFileName: text("sk_doc_file_name"),
  changeType: orgSnapshotChangeTypeEnum("change_type"),
  reason: text("reason"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  takenAt: timestamp("taken_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * The actual org chart node (self-referencing via reportsToId) — distinct
 * from masterJobPositions, which is just the position catalog/dictionary.
 * currentEmployeeId is deliberately NOT a column yet: there is no employees
 * table in this phase (struktur organisasi first, data karyawan next) — it
 * will be added as a real FK once that table exists, per docs/ERD.md §4.4
 * ("setiap aksi Personalia WAJIB meng-update org_structure_nodes.current_employee_id
 * ... dalam satu transaksi").
 */
export const orgStructureNodes = pgTable("org_structure_nodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id).notNull(),
  title: text("title").notNull(),
  divisionId: uuid("division_id").references(() => companyDivisions.id),
  departmentId: uuid("department_id").references(() => companyDepartments.id),
  code: text("code"),
  jobGrade: text("job_grade"),
  description: text("description"),
  reportsToId: uuid("reports_to_id").references((): any => orgStructureNodes.id),
  relationType: orgNodeRelationTypeEnum("relation_type").notNull().default("struktural"),
  isVacant: boolean("is_vacant").notNull().default(true),
  level: integer("level").notNull().default(1),
  masterJobPositionId: uuid("master_job_position_id").references(() => masterJobPositions.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const officeLocationTypeEnum = pgEnum("office_location_type", ["Kantor Pusat", "Kantor Cabang", "Gudang", "Workshop", "Site Operasional"]);

/** entityId is nullable — a tenant-wide location (e.g. a shared warehouse) doesn't have to belong to one specific entity. */
export const officeLocations = pgTable("office_locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  type: officeLocationTypeEnum("type").notNull().default("Kantor Cabang"),
  address: text("address"),
  city: text("city"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  radiusMeters: integer("radius_meters").notNull().default(100),
  // "circle" (default, existing behavior — radiusMeters around lat/lng) or
  // "polygon" (user, 2026-11-09: "bisa di custom... kotak bulat, ataupun
  // menandai titik polygon") for an irregular-shaped compound where a
  // single-point radius either misses corners or spills onto public
  // roads. polygonPoints is only read when shapeType is "polygon".
  shapeType: text("shape_type").notNull().default("circle"),
  polygonPoints: jsonb("polygon_points").$type<{ lat: number; lng: number }[]>(),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Master data, not a hardcoded dropdown list — "Tingkat/Strata Pendidikan
 * seharusnya ada data masternya sehingga bisa terus di update dan
 * diperbaharui" (user, 2026-11-02). Tenant-scoped (not global) because a
 * tenant may add a level the standard set doesn't cover; seeded with the
 * standard Indonesian minimum set for every new tenant (see
 * server/db/seed/masterDataDefaults.ts), never baked into the enum.
 */
export const educationLevels = pgTable("education_levels", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Master data for "Jurusan/Bidang Studi" — same rationale as educationLevels, picked via checklist (multi-select) on a requisition. */
export const fieldsOfStudy = pgTable("fields_of_study", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  category: text("category"), // e.g. "Teknik", "Ekonomi & Bisnis", "Sosial Humaniora" — grouping for a long checklist
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * The actual headcount — distinct from orgStructureNodes (the skeleton
 * position/slot) and masterJobPositions (the position dictionary). An
 * active employee optionally occupies one orgStructureNodes row
 * (currentEmployeeId there is out of scope for this migration — kept as a
 * separate lookup for now to avoid a cross-cutting change to the org
 * module's own transactions).
 */
/**
 * The full employee record — core queryable/joinable columns here, every
 * other field (identity docs, BPJS, bank, allowances, education, family,
 * emergency contacts, ...) in `details` jsonb, same pattern as
 * candidates/jobVacancies/onboardingProcesses. `status` is plain text, not
 * an enum: it must accept the frontend's own value set (user-facing
 * 'Aktif'/'Cuti Panjang'/'Resign'/'PHK'), which doesn't fully overlap with
 * what this table originally shipped with for the recruitment-only
 * "replacement employee" dropdown (Resign/Diberhentikan/Pensiun) — a rigid
 * enum would just force another migration the next time these drift.
 */
export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id).notNull(),
  nik: text("nik").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  avatar: text("avatar"),
  employmentType: text("employment_type").notNull().default("Kontrak"),
  positionId: uuid("position_id").references(() => masterJobPositions.id),
  divisionId: uuid("division_id").references(() => companyDivisions.id),
  departmentId: uuid("department_id").references(() => companyDepartments.id),
  orgNodeId: uuid("org_node_id").references(() => orgStructureNodes.id),
  managerId: uuid("manager_id").references((): any => employees.id),
  candidateId: uuid("candidate_id").references((): any => candidates.id),
  status: text("status").notNull().default("Aktif"),
  basicSalary: integer("basic_salary").notNull().default(0),
  joinDate: timestamp("join_date", { withTimezone: true }),
  resignDate: timestamp("resign_date", { withTimezone: true }),
  resignReason: text("resign_reason"),
  details: jsonb("details").notNull().default({}).$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Matches the frontend's own status labels (src/types/hrms.ts JobRequisition)
// verbatim — kept as one enum instead of a second English enum + translation
// layer, since this status is filtered/displayed directly by the FPTK UI.
export const jobRequisitionStatusEnum = pgEnum("job_requisition_status", [
  "Draft",
  "Menunggu Approval",
  "Disetujui",
  "Ditolak",
  "Dibatalkan",
  "Dicabut (Retracted)",
]);
export const jobRequisitionTypeEnum = pgEnum("job_requisition_type", ["Baru", "Penggantian"]);

/**
 * FPTK (Formulir Permintaan Tenaga Kerja) — real backend, replacing the
 * pure-mock form in RecruitmentManagement.tsx (user, 2026-11-02: "kenapa
 * semua masih mockup form nya bukan real dari database"). knockoutCriteria/
 * scoredCriteria/signatories stay jsonb (variable-shape checklist data, not
 * normalized tables) matching the existing frontend draft shapes; the
 * requisition process itself (one row, mutable until Approved) is what
 * needed a real table.
 */
export const jobRequisitions = pgTable("job_requisitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id).notNull(),
  officeLocationId: uuid("office_location_id").references(() => officeLocations.id),
  divisionId: uuid("division_id").references(() => companyDivisions.id),
  departmentId: uuid("department_id").references(() => companyDepartments.id),
  positionId: uuid("position_id").references(() => masterJobPositions.id),
  requestedByUserId: uuid("requested_by_user_id").references(() => users.id).notNull(),
  requisitionType: jobRequisitionTypeEnum("requisition_type").notNull().default("Baru"),
  // Only set when requisitionType = "Penggantian" — must reference an
  // employee whose employmentStatus is NOT "Aktif" (enforced in the route,
  // not the schema: "dropdown nama karyawan ... status yang sudah keluar /
  // resign / non-aktif").
  replacementEmployeeId: uuid("replacement_employee_id").references(() => employees.id),
  headcount: integer("headcount").notNull().default(1),
  educationLevelId: uuid("education_level_id").references(() => educationLevels.id),
  fieldsOfStudyIds: jsonb("fields_of_study_ids").notNull().default([]).$type<string[]>(),
  // Flexible "minimum N years", not a fixed preset list (user, 2026-11-02:
  // "Saat ini masih fix opsinya tidak fleksibel misal pengalaman minimal 1
  // tahun, atau minimal 7 tahun").
  minExperienceYears: integer("min_experience_years").notNull().default(0),
  knockoutCriteria: jsonb("knockout_criteria").notNull().default([]).$type<unknown[]>(),
  scoredCriteria: jsonb("scored_criteria").notNull().default([]).$type<unknown[]>(),
  // [{ role, userId, isRequired, order }] — defaults come from
  // documentSignatoryConfigs for documentType "FPTK"; a requester may add
  // more up to that config's maxSignatories (enforced in the route).
  signatories: jsonb("signatories").notNull().default([]).$type<unknown[]>(),
  status: jobRequisitionStatusEnum("status").notNull().default("Draft"),
  // The rest of the FPTK form's descriptive/free-text fields (reqNumber,
  // position title, grade labels, justification, reporting-line labels,
  // skills, requester/approver display names, retraction info, ...) —
  // real persisted data, just not worth a dedicated column each since
  // they're display/document text, not queried or joined on. See
  // server/lib/jobRequisitionMapping.ts for the exact shape.
  details: jsonb("details").notNull().default({}).$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Signatory config lives in Document Management, per document type — not
 * hardcoded inside each form (user, 2026-11-02; see also the
 * project_signatory_config_via_document_management memory). Every
 * document-generating flow (FPTK first, offer letters/SK/contracts later)
 * reads this instead of inventing its own signatory list.
 */
export const documentSignatoryConfigs = pgTable("document_signatory_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  documentType: text("document_type").notNull(), // "FPTK", "OfferLetter", "SK", "Kontrak", ...
  roleLabel: text("role_label").notNull(), // e.g. "HR Manager", "Direktur Utama"
  isRequired: boolean("is_required").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const jobVacancyStatusEnum = pgEnum("job_vacancy_status", ["Buka", "Ditutup"]);

/**
 * A posted vacancy — usually created from an Approved job requisition
 * (jobRequisitionId), but can stand alone. Only the columns the UI
 * actually filters/sorts on are first-class; everything else (SLA
 * history, channel broadcast status, salary display flags, ...) lives in
 * `details`, same pattern as jobRequisitions.
 */
export const jobVacancies = pgTable("job_vacancies", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id).notNull(),
  jobRequisitionId: uuid("job_requisition_id").references(() => jobRequisitions.id),
  title: text("title").notNull(),
  openings: integer("openings").notNull().default(1),
  status: jobVacancyStatusEnum("status").notNull().default("Buka"),
  postedDate: timestamp("posted_date", { withTimezone: true }).defaultNow().notNull(),
  targetCloseDate: timestamp("target_close_date", { withTimezone: true }),
  details: jsonb("details").notNull().default({}).$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * One applicant against one vacancy. The Candidate concept in this app
 * spans the entire pipeline (sourcing -> screening -> test -> interview ->
 * MCU -> offering), with dozens of mostly-optional, deeply-nested fields
 * per stage. Only the columns that are actually queried/filtered
 * (stage, scores, status) or referenced by FK are first-class; the rest
 * rides in `details`, exactly like jobRequisitions/jobVacancies.
 */
export const candidates = pgTable("candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  jobVacancyId: uuid("job_vacancy_id").references(() => jobVacancies.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  // Plain text, not an enum — the recruitment pipeline's own stage set has
  // drifted inconsistently across the frontend (e.g. 'Disqualified' used in
  // some flows, not others) and a rigid DB enum would reject real data an
  // enum migration can't realistically chase.
  stage: text("stage").notNull().default("Lamaran Masuk"),
  appliedDate: timestamp("applied_date", { withTimezone: true }).defaultNow().notNull(),
  aiMatchScore: integer("ai_match_score"),
  testScore: integer("test_score"),
  interviewScore: integer("interview_score"),
  offeredSalary: integer("offered_salary"),
  details: jsonb("details").notNull().default({}).$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const onboardingStatusEnum = pgEnum("onboarding_status", ["In Progress", "Completed", "Cancelled"]);
export const onboardingTypeEnum = pgEnum("onboarding_type", ["via_recruitment", "direct"]);

export const onboardingProcesses = pgTable("onboarding_processes", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id).notNull(),
  type: onboardingTypeEnum("type").notNull().default("direct"),
  candidateId: uuid("candidate_id").references(() => candidates.id),
  employeeName: text("employee_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  position: text("position"),
  departmentId: uuid("department_id").references(() => companyDepartments.id),
  joinDate: timestamp("join_date", { withTimezone: true }),
  basicSalary: integer("basic_salary"),
  contractDocNumber: text("contract_doc_number"),
  status: onboardingStatusEnum("status").notNull().default("In Progress"),
  createdEmployeeId: uuid("created_employee_id").references(() => employees.id),
  tasks: jsonb("tasks").notNull().default([]).$type<unknown[]>(),
  details: jsonb("details").notNull().default({}).$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Master data for assessment methods offered to candidates — tenant-scoped admin config, not hardcoded. */
export const competencyTestTypeSettings = pgTable("competency_test_type_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  passingGrade: integer("passing_grade").notNull().default(70),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  method: text("method").notNull(),
  description: text("description"),
  weightPercent: integer("weight_percent"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Master data for interview types/scorecards — tenant-scoped admin config. criteria is a small nested array ([{id,name,description?,weightPercent?}]), not worth its own table. */
export const interviewTypeSettings = pgTable("interview_type_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  targetRole: text("target_role"),
  description: text("description"),
  interviewerRoles: text("interviewer_roles"),
  criteria: jsonb("criteria").notNull().default([]).$type<unknown[]>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Template tasks auto-copied onto every new onboarding_processes.tasks — tenant-scoped admin config. */
export const onboardingChecklistTemplates = pgTable("onboarding_checklist_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  targetDepartment: text("target_department").notNull(),
  verificationType: text("verification_type").notNull(),
  actionType: text("action_type"),
  isMandatory: boolean("is_mandatory").notNull().default(true),
  description: text("description"),
  subItems: jsonb("sub_items").notNull().default([]).$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const probationRecommendationEnum = pgEnum("probation_recommendation", ["Lulus", "Perpanjang Probation", "Tidak Lulus"]);
export const probationStatusEnum = pgEnum("probation_status", ["Draft", "Menunggu Approval", "Disetujui", "Ditolak"]);

/**
 * Custom probation evaluation form (user, 2026-11-09: "Form Penilaian
 * Evaluasi Akhir Probation bisa custum untuk daftar kategori dan
 * pertanyaannya. Ada masa berlaku dan bisa di tambah terus.") —
 * categories is the full custom question/category list (jsonb, no fixed
 * shape: {id, label}[]), validFrom/validUntil give it a validity window,
 * and nothing here is ever updated in place after creation — a tenant
 * just keeps adding new template versions over time ("ditambah terus"),
 * so every evaluation stays tied to the exact form it was actually
 * filled out against (templateId on probationEvaluations below), even
 * after a newer template becomes current.
 */
export const probationEvaluationTemplates = pgTable("probation_evaluation_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  categories: jsonb("categories").notNull().$type<{ id: string; label: string }[]>(),
  validFrom: text("valid_from").notNull(),
  validUntil: text("valid_until"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Probation (masa percobaan) evaluation — Manajemen Karyawan sub-menu. */
export const probationEvaluations = pgTable("probation_evaluations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  supervisorId: uuid("supervisor_id").references(() => employees.id),
  evaluationDate: timestamp("evaluation_date", { withTimezone: true }).defaultNow().notNull(),
  // Legacy fixed categories — nullable now that scoring comes from a
  // custom template's categoryScores instead; kept only so pre-existing
  // rows (filled out before this feature existed) still render.
  technicalSkillScore: integer("technical_skill_score"),
  disciplineScore: integer("discipline_score"),
  teamworkScore: integer("teamwork_score"),
  initiativeScore: integer("initiative_score"),
  // Which template this evaluation was actually filled out against, and
  // its per-category scores ({categoryId, label, score}[]) — the custom
  // replacement for the 4 fixed columns above.
  templateId: uuid("template_id").references(() => probationEvaluationTemplates.id),
  categoryScores: jsonb("category_scores").$type<{ categoryId: string; label: string; score: number }[]>(),
  overallScore: integer("overall_score").notNull(),
  recommendation: probationRecommendationEnum("recommendation").notNull(),
  extensionDurationMonths: integer("extension_duration_months"),
  notes: text("notes"),
  status: probationStatusEnum("status").notNull().default("Draft"),
  approvedBy: text("approved_by"),
  skDocNumber: text("sk_doc_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contractRecommendationEnum = pgEnum("contract_recommendation", ["Perpanjang PKWT", "Alih Status PKWTT (Tetap)", "Tidak Diperpanjang"]);
export const contractReviewStatusEnum = pgEnum("contract_review_status", ["Menunggu Approval", "Disetujui", "Ditolak"]);

/** Contract renewal (PKWT) review — Manajemen Karyawan sub-menu. */
export const contractRenewalReviews = pgTable("contract_renewal_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  currentContractEnd: timestamp("current_contract_end", { withTimezone: true }).notNull(),
  recommendation: contractRecommendationEnum("recommendation").notNull(),
  newDurationMonths: integer("new_duration_months"),
  notes: text("notes"),
  status: contractReviewStatusEnum("status").notNull().default("Menunggu Approval"),
  approvedBy: text("approved_by"),
  newContractDocNumber: text("new_contract_doc_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Generic per-module settings blob (src/types/hrms.ts ModuleSettingsConfig)
 * — one jsonb row per tenant per module key (employee/attendance/payroll/
 * ...). Lets each module's "Pengaturan" tab persist for real without a
 * dedicated table per module; moduleKey values are whatever the frontend
 * already uses (not enumerated here).
 */
export const tenantModuleSettings = pgTable(
  "tenant_module_settings",
  {
    tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
    moduleKey: text("module_key").notNull(),
    settings: jsonb("settings").notNull().default({}).$type<Record<string, unknown>>(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.moduleKey] })]
);

/**
 * Approval Engine — the central cross-module queue (src/types/hrms.ts
 * ApprovalWorkflowItem). Every other module (Cuti, Perbaikan Presensi,
 * Tukar Shift, Lembur, Pinjaman, Reimbursement, Promosi/Personalia,
 * Perjalanan Dinas, Procurement PR, Offboarding) creates one row here as a
 * side effect of its own submit action and keeps it in sync when reviewed
 * from that module's own screen — this table is the single source of
 * truth either way reads from. referenceId/requesterId/assignedApproverId/
 * substituteApproverId are deliberately plain text, not FKs: several of
 * the modules that create these rows aren't migrated to real tables yet,
 * so a strict FK would reject rows referencing a still-mock id.
 */
export const approvalItems = pgTable("approval_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  category: text("category").notNull(),
  referenceId: text("reference_id").notNull(),
  title: text("title").notNull(),
  requesterId: text("requester_id").notNull(),
  department: text("department"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  deadlineAt: timestamp("deadline_at", { withTimezone: true }),
  level: integer("level").notNull().default(1),
  totalLevels: integer("total_levels").notNull().default(1),
  assignedApproverRole: text("assigned_approver_role").notNull(),
  assignedApproverId: text("assigned_approver_id"),
  substituteApproverId: text("substitute_approver_id"),
  status: text("status").notNull().default("Menunggu"),
  amount: integer("amount"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Who can approve on behalf of whom, for a date range — same plain-text-id rationale as approvalItems. */
export const approvalDelegations = pgTable("approval_delegations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  principalId: text("principal_id").notNull(),
  substituteId: text("substitute_id").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  reason: text("reason"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Attendance (Presensi) module — real headcount already exists (employees);
// date/time fields here are plain text ("2026-11-02" / "08:00"), not
// `timestamp`, since they're date-only or time-only strings the frontend
// already treats as such — using `timestamp` for these caused the exact
// zDateTime bug class fixed earlier this session, so plain text sidesteps
// that entirely for values that never need timezone math server-side.
// ---------------------------------------------------------------------------

/** Master shift catalog (Pagi/Siang/Malam, etc.) — tenant-wide, like grades/office-locations. */
export const workShifts = pgTable("work_shifts", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  color: text("color").notNull().default("#64748b"),
  isNightShift: boolean("is_night_shift").notNull().default(false),
  lateToleranceMins: integer("late_tolerance_mins").notNull().default(15),
  breakMins: integer("break_mins"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** One roster entry: one employee, one date. shiftId is a work_shifts.id OR the literal 'OFF' sentinel, so it's plain text, not an FK. */
export const employeeSchedules = pgTable("employee_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  date: text("date").notNull(),
  shiftId: text("shift_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const shiftSwapRequests = pgTable("shift_swap_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  requesterId: uuid("requester_id").references(() => employees.id).notNull(),
  targetEmployeeId: uuid("target_employee_id").references(() => employees.id).notNull(),
  requestDate: text("request_date").notNull(),
  targetDate: text("target_date").notNull(),
  requestShiftId: text("request_shift_id"),
  targetShiftId: text("target_shift_id"),
  reason: text("reason"),
  status: text("status").notNull().default("Menunggu"),
  approvedBy: text("approved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  date: text("date").notNull(),
  clockIn: text("clock_in"),
  clockOut: text("clock_out"),
  status: text("status").notNull().default("Hadir"),
  overtimeHours: integer("overtime_hours").notNull().default(0),
  lateMinutes: integer("late_minutes").notNull().default(0),
  notes: text("notes"),
  shiftId: text("shift_id"),
  // WFO/WFA/Perjalanan Dinas — dipilih wajib sebelum clock-in di ESS
  // (user, 2026-11-03, redesigned 2026-11-09). Radius geofencing GPS
  // hanya ditegakkan (wajib di dalam radius) untuk WFO; WFA & Perjalanan
  // Dinas boleh di luar radius — statusnya tetap direkam (lihat kolom
  // *InsideRadius di bawah), hanya tidak memblokir clock-in/out.
  workType: text("work_type"),
  // Setiap clock-in & clock-out merekam titik GPS-nya sendiri (bisa beda
  // tempat) dan apakah titik itu berada di dalam radius/area salah satu
  // lokasi kantor yang ditugaskan ke karyawan ini — user, 2026-11-09:
  // "informasi didalam radius ataupun diluar baik clock in dan clock out
  // tercatat status beserta lat long nya".
  clockInLat: doublePrecision("clock_in_lat"),
  clockInLng: doublePrecision("clock_in_lng"),
  clockInInsideRadius: boolean("clock_in_inside_radius"),
  clockOutLat: doublePrecision("clock_out_lat"),
  clockOutLng: doublePrecision("clock_out_lng"),
  clockOutInsideRadius: boolean("clock_out_inside_radius"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const attendanceCorrectionRequests = pgTable("attendance_correction_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  date: text("date").notNull(),
  type: text("type").notNull(),
  proposedClockIn: text("proposed_clock_in"),
  proposedClockOut: text("proposed_clock_out"),
  reason: text("reason"),
  status: text("status").notNull().default("Menunggu"),
  approvedBy: text("approved_by"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const overtimeRequests = pgTable("overtime_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  hours: integer("hours").notNull(),
  reason: text("reason"),
  type: text("type").notNull().default("Pengajuan Karyawan"),
  status: text("status").notNull().default("Menunggu"),
  approvedBy: text("approved_by"),
  approvedHours: integer("approved_hours"),
  compensationType: text("compensation_type").notNull().default("Lembur Berbayar"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Payroll — real backend (user, 2026-11-04: "lanjut full module payroll").
// generatePayrollRun's calculation itself stays client-side (it already
// reads real attendance/overtime/reimbursement/loan data), these tables
// just persist its output and the salary-component master data instead of
// localStorage.
// ---------------------------------------------------------------------------

export const salaryComponents = pgTable("salary_components", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  calculationBasis: text("calculation_basis").notNull(),
  defaultValue: integer("default_value").notNull().default(0),
  isTaxable: boolean("is_taxable").notNull().default(true),
  isBpjsBase: boolean("is_bpjs_base").notNull().default(false),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const employeeSalaryComponentAssignments = pgTable("employee_salary_component_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  componentId: uuid("component_id").references(() => salaryComponents.id).notNull(),
  amount: integer("amount").notNull().default(0),
  effectiveDate: text("effective_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payrollRecords = pgTable("payroll_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  period: text("period").notNull(),
  basicSalary: integer("basic_salary").notNull().default(0),
  allowances: integer("allowances").notNull().default(0),
  overtimePay: integer("overtime_pay").notNull().default(0),
  reimbursement: integer("reimbursement").notNull().default(0),
  thrBonus: integer("thr_bonus").notNull().default(0),
  grossPay: integer("gross_pay").notNull().default(0),
  bpjsKesCompany: integer("bpjs_kes_company").notNull().default(0),
  bpjsKesEmployee: integer("bpjs_kes_employee").notNull().default(0),
  bpjsTkCompany: integer("bpjs_tk_company").notNull().default(0),
  bpjsTkEmployee: integer("bpjs_tk_employee").notNull().default(0),
  pph21TERCategory: text("pph21_ter_category").notNull().default("TER A"),
  pph21RatePercent: doublePrecision("pph21_rate_percent").notNull().default(0),
  pph21Amount: integer("pph21_amount").notNull().default(0),
  loanDeduction: integer("loan_deduction").notNull().default(0),
  lateDeduction: integer("late_deduction").notNull().default(0),
  unpaidLeaveDeduction: integer("unpaid_leave_deduction"),
  severancePay: integer("severance_pay"),
  totalDeductions: integer("total_deductions").notNull().default(0),
  netPay: integer("net_pay").notNull().default(0),
  status: text("status").notNull().default("Draft"),
  paidDate: text("paid_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Employee Loans & Kasbon — real backend (user, 2026-11-05: disbursePayrollRun
// was deducting installments against mock loan state since Loans itself
// hadn't been migrated yet; this table is that migration). loanSchemes
// (the scheme/plan master config in LoanManagement.tsx) stays local —
// only the loan RECORDS themselves (applications HR approves and payroll
// deducts against) needed a real table.
// ---------------------------------------------------------------------------

export const employeeLoans = pgTable("employee_loans", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  loanType: text("loan_type").notNull(),
  totalAmount: integer("total_amount").notNull().default(0),
  tenorMonths: integer("tenor_months").notNull().default(1),
  monthlyInstallment: integer("monthly_installment").notNull().default(0),
  remainingAmount: integer("remaining_amount").notNull().default(0),
  startDate: text("start_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("Menunggu Approval"),
  adminFee: integer("admin_fee"),
  interestMethod: text("interest_method"),
  interestRatePercent: doublePrecision("interest_rate_percent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Leave requests, KPI reviews, Compliance (SP/PHK) — real backend
// (user, 2026-11-05: "Selesaikan 1, 2, dan 3").
// ---------------------------------------------------------------------------

export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  leaveType: text("leave_type").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalDays: integer("total_days").notNull().default(1),
  reason: text("reason"),
  status: text("status").notNull().default("Menunggu"),
  approvedBy: text("approved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** metrics stays jsonb (a variable-length array of {id,name,target,actual,weight,unit,score} rows the mock type already defines) — same "details jsonb" reasoning as everywhere else this session, just scoped to one field instead of the whole row since everything else here is flat/queryable. */
export const employeeKpis = pgTable("employee_kpis", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  period: text("period").notNull(),
  quarter: text("quarter").notNull(),
  metrics: jsonb("metrics").notNull().default([]).$type<unknown[]>(),
  finalScore: doublePrecision("final_score").notNull().default(0),
  feedback: text("feedback"),
  reviewer: text("reviewer"),
  evaluatedAt: text("evaluated_at").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const complianceRecords = pgTable("compliance_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  level: text("level").notNull(),
  violationReason: text("violation_reason").notNull(),
  letterNumber: text("letter_number").notNull(),
  issueDate: text("issue_date").notNull(),
  validUntil: text("valid_until").notNull(),
  signedBy: text("signed_by"),
  status: text("status").notNull().default("Aktif"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Offboarding — real backend (user, 2026-11-05: "lanjut 4").
// ---------------------------------------------------------------------------

export const offboardingRecords = pgTable("offboarding_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  separationType: text("separation_type").notNull(),
  requestDate: text("request_date").notNull(),
  effectiveDate: text("effective_date").notNull(),
  handoverCompleted: boolean("handover_completed").notNull().default(false),
  assetReturned: boolean("asset_returned").notNull().default(false),
  financeCleared: boolean("finance_cleared").notNull().default(false),
  severancePay: integer("severance_pay").notNull().default(0),
  parklaringIssued: boolean("parklaring_issued").notNull().default(false),
  parklaringNumber: text("parklaring_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Business Trips (SPPD) — real backend (user, 2026-11-05: "lanjut" item 1).
// ---------------------------------------------------------------------------

export const businessTrips = pgTable("business_trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  tripNumber: text("trip_number").notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  destinationCity: text("destination_city").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalDays: integer("total_days").notNull(),
  purpose: text("purpose").notNull(),
  transportType: text("transport_type").notNull(),
  estimatedCost: integer("estimated_cost").notNull().default(0),
  perDiemDaily: integer("per_diem_daily").notNull().default(0),
  accommodationCost: integer("accommodation_cost").notNull().default(0),
  status: text("status").notNull().default("Menunggu Approval"),
  approvedBy: text("approved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// GA Asset & Procurement — real backend (user, 2026-11-05: "lanjut" item 2).
// ---------------------------------------------------------------------------

export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  category: text("category").notNull(),
  contactPerson: text("contact_person").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  npwp: text("npwp").notNull(),
  rating: integer("rating").notNull().default(3),
  address: text("address").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const gaAssets = pgTable("ga_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  assetCode: text("asset_code").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  building: text("building").notNull(),
  room: text("room").notNull(),
  purchaseDate: text("purchase_date").notNull(),
  purchasePrice: integer("purchase_price").notNull().default(0),
  condition: text("condition").notNull().default("Baik"),
  assignedToEmployeeId: uuid("assigned_to_employee_id").references(() => employees.id),
  lastStockOpname: text("last_stock_opname").notNull(),
  qrPayload: text("qr_payload").notNull(),
  usageStatus: text("usage_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const assetMaintenanceTickets = pgTable("asset_maintenance_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  ticketNumber: text("ticket_number").notNull(),
  assetCode: text("asset_code").notNull(),
  assetName: text("asset_name").notNull(),
  reporterEmployeeId: uuid("reporter_employee_id").references(() => employees.id).notNull(),
  issueType: text("issue_type").notNull(),
  priority: text("priority").notNull(),
  description: text("description").notNull(),
  reportedAt: text("reported_at").notNull(),
  status: text("status").notNull().default("Tiket Dibuka"),
  assignedTechnician: text("assigned_technician"),
  cost: integer("cost"),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const assetRelocationLogs = pgTable("asset_relocation_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  assetCode: text("asset_code").notNull(),
  assetName: text("asset_name").notNull(),
  fromBuilding: text("from_building").notNull(),
  fromRoom: text("from_room").notNull(),
  fromEmployeeId: uuid("from_employee_id").references(() => employees.id),
  toBuilding: text("to_building").notNull(),
  toRoom: text("to_room").notNull(),
  toEmployeeId: uuid("to_employee_id").references(() => employees.id),
  relocationDate: text("relocation_date").notNull(),
  approvedBy: text("approved_by").notNull(),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const procurementOrders = pgTable("procurement_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  type: text("type"),
  prNumber: text("pr_number").notNull(),
  poNumber: text("po_number").notNull(),
  quotationNumber: text("quotation_number"),
  contractNumber: text("contract_number"),
  vendorId: uuid("vendor_id").references(() => vendors.id),
  vendorName: text("vendor_name").notNull(),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  estimatedCost: integer("estimated_cost").notNull().default(0),
  requestor: text("requestor").notNull(),
  department: text("department").notNull(),
  status: text("status").notNull().default("Pengajuan PR"),
  requestedDate: text("requested_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// RBAC — role definitions & permission matrix (user, 2026-11-05: "lanjut"
// item 4). role id is a human-chosen slug (e.g. "hr_admin"), not a uuid —
// it's used as a dictionary key throughout the frontend, so the table key
// is (tenantId, id) rather than a surrogate uuid.
// ---------------------------------------------------------------------------

export const roleDefinitions = pgTable(
  "role_definitions",
  {
    tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
    id: text("id").notNull(),
    label: text("label").notNull(),
    description: text("description").notNull(),
    badgeClass: text("badge_class"),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.id] })]
);

export const rolePermissionEntries = pgTable(
  "role_permission_entries",
  {
    tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
    moduleKey: text("module_key").notNull(),
    roleKey: text("role_key").notNull(),
    view: boolean("view").notNull().default(false),
    create: boolean("create").notNull().default(false),
    edit: boolean("edit").notNull().default(false),
    delete: boolean("delete").notNull().default(false),
    approve: boolean("approve").notNull().default(false),
    export: boolean("export").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.moduleKey, table.roleKey] })]
);

/**
 * Real employee login accounts — closing the "RBAC granular tidak
 * ditegakkan / tidak ada role karyawan sungguhan" finding from the
 * security review (user, 2026-11-09). Until now `employees` was pure HR
 * record data with no credentials at all; ESS/MSS only ever worked by
 * reusing the tenant_admin's own session and swapping a client-side
 * "currentUser" persona — meaning the server never actually distinguished
 * an employee from the admin. This table is a deliberately separate
 * record from `employees` (same pattern as `users` vs `employees`): the
 * HR record and its login credentials have different lifecycles — an
 * employee can exist for months before anyone enables ESS login for them.
 * roleKey is NOT a DB foreign key into role_definitions (whose own PK is
 * the composite (tenantId, id), and a tenant may reference a system role
 * like "employee"/"manager" that only exists as a frontend fallback and
 * was never actually inserted as a row) — it's resolved against
 * role_permission_entries at permission-check time, defaulting to
 * deny-all when no matching row exists (see server/lib/permissions.ts).
 */
export const employeeAccounts = pgTable(
  "employee_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
    employeeId: uuid("employee_id").references(() => employees.id).notNull().unique(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    roleKey: text("role_key").notNull().default("employee"),
    isActive: boolean("is_active").notNull().default(true),
    // TOTP 2FA (RFC 6238) for employee (ESS/MSS) logins — same mechanism and
    // storage pattern as users.totpSecretEncrypted/totpEnabled/
    // totpBackupCodesHash (security review, user 2026-11-10: "MFA untuk
    // karyawan"); previously MFA only existed for app_owner/tenant_admin
    // accounts, never for employee_accounts at all.
    totpSecretEncrypted: text("totp_secret_encrypted"),
    totpEnabled: boolean("totp_enabled").notNull().default(false),
    totpBackupCodesHash: jsonb("totp_backup_codes_hash").$type<string[]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("employee_accounts_tenant_email_idx").on(table.tenantId, table.email)]
);

// ---------------------------------------------------------------------------
// Company Calendar — real backend (user, 2026-11-05: "lanjut" item 5).
// ---------------------------------------------------------------------------

export const companyCalendarEvents = pgTable("company_calendar_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id),
  title: text("title").notNull(),
  date: text("date").notNull(),
  type: text("type").notNull(),
  deductsLeaveBucket: boolean("deducts_leave_bucket").notNull().default(false),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Audit Trail — tenant-facing business activity log (user, 2026-11-05:
// "lanjut 7. Audit Log"). Distinct from auditLogEntries above, which is the
// App Owner's platform-wide security log keyed to the `users` (App Owner)
// table; this one is per-tenant business activity, logged from nearly every
// mutating action across the tenant app via HrmsContext's logAuditAction.
// ---------------------------------------------------------------------------

export const auditTrailEntries = pgTable("audit_trail_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: uuid("entity_id").references(() => companyEntities.id),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  actorId: text("actor_id").notNull(),
  actorName: text("actor_name").notNull(),
  actorRole: text("actor_role").notNull(),
  module: text("module").notNull(),
  action: text("action").notNull(),
  recordId: text("record_id").notNull(),
  changesSummary: text("changes_summary").notNull(),
  details: jsonb("details").$type<unknown[]>(),
});

// ---------------------------------------------------------------------------
// Document Management — template studio & official documents (user,
// 2026-11-08: "lanjut 3. Document Management").
// ---------------------------------------------------------------------------

export const documentTemplates = pgTable("document_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  numberingPattern: text("numbering_pattern").notNull(),
  paperSize: text("paper_size"),
  letterHeadTitle: text("letter_head_title").notNull(),
  letterHeadAddress: text("letter_head_address").notNull(),
  letterHeadNpwp: text("letter_head_npwp"),
  letterHeadPhone: text("letter_head_phone"),
  letterHeadEmail: text("letter_head_email"),
  defaultBody: text("default_body").notNull(),
  showQrSignature: boolean("show_qr_signature").notNull().default(true),
  signeeTitle: text("signee_title").notNull(),
  signeeRole: text("signee_role").notNull(),
  sourceType: text("source_type"),
  fileName: text("file_name"),
  fileSize: text("file_size"),
  uploadedAt: text("uploaded_at"),
  rawHtmlTemplate: text("raw_html_template"),
  extractedPlaceholders: jsonb("extracted_placeholders").$type<string[]>(),
  kopPosition: text("kop_position"),
  qrPosition: text("qr_position"),
  footerText: text("footer_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const officialDocuments = pgTable("official_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  documentNumber: text("document_number").notNull(),
  type: text("type").notNull(),
  templateId: uuid("template_id").references(() => documentTemplates.id),
  title: text("title").notNull(),
  // Nullable: a handover/BAST document can target a room rather than a
  // specific employee (e.g. asset relocation with no assignee) — found
  // during migration, the old mock code fell back to a fake 'emp-3' id
  // here, which would violate this FK against the real employees table.
  targetEmployeeId: uuid("target_employee_id").references(() => employees.id),
  issueDate: text("issue_date").notNull(),
  signeeName: text("signee_name").notNull(),
  signeeRole: text("signee_role").notNull(),
  qrVerificationUrl: text("qr_verification_url").notNull(),
  status: text("status").notNull().default("Resmi Diterbitkan"),
  contentPreview: text("content_preview").notNull(),
  renderedHtml: text("rendered_html"),
  isFromDocxTemplate: boolean("is_from_docx_template").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// eNPS Engagement Survey (user, 2026-11-08: "lanjut 6. eNPS"). Note: as of
// this migration there is no UI screen wired to this feature anywhere in
// src/components — the type/context plumbing pre-existed with no consumer.
// Migrated for consistency with the "no mock data" mandate; verified via
// API only, not live UI (there is nothing to click).
// ---------------------------------------------------------------------------

export const enpsSurveys = pgTable("enps_surveys", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  period: text("period").notNull(),
  title: text("title").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  responses: jsonb("responses").notNull().default([]).$type<unknown[]>(),
  totalResponses: integer("total_responses").notNull().default(0),
  promoters: integer("promoters").notNull().default(0),
  passives: integer("passives").notNull().default(0),
  detractors: integer("detractors").notNull().default(0),
  score: integer("score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Vendor Invoices (AP) — real backend (user, 2026-11-08: "lanjut 8").
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sessions — server-side revocable session store (security review, user
// 2026-11-10: "Session Hijacking"). The JWT in the nusahr_session cookie is
// still what the browser carries, but it is now just a bearer reference to
// this row (its `jti` claim = this row's id) — readSession() checks the row
// hasn't been revoked on every request, so a stolen/copied cookie can be
// killed immediately (logout, "logout other devices", an admin revoking a
// compromised account) instead of staying valid for the rest of its 8h
// lifetime regardless of what the legitimate user does. userAgent/ipAddress
// are captured at mint time and refreshed on each use so a session that
// suddenly starts being used from a very different device/network can be
// flagged (see server/lib/sessionSecurity.ts) without hard-blocking
// legitimate roaming (new wifi, mobile data, VPN toggle).
// ---------------------------------------------------------------------------

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  role: text("role").notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const vendorInvoices = pgTable("vendor_invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  vendorId: uuid("vendor_id").references(() => vendors.id).notNull(),
  vendorName: text("vendor_name").notNull(),
  poNumber: text("po_number").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  invoiceDate: text("invoice_date").notNull(),
  dueDate: text("due_date").notNull(),
  amount: integer("amount").notNull().default(0),
  status: text("status").notNull().default("Belum Bill"),
  paidDate: text("paid_date"),
  paymentMethod: text("payment_method"),
  taxInvoiceNumber: text("tax_invoice_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

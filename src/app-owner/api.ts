const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export class ApiError extends Error {
  constructor(message: string, public status: number, public details?: unknown) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include", // sends/receives the httpOnly session cookie
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error || `Request failed (${res.status})`, res.status, body.details);
  }
  return body as T;
}

export interface Me {
  id: string;
  name: string;
  email: string;
  role: "app_owner" | "tenant_admin";
}

export interface TenantRow {
  id: string;
  name: string;
  subdomain: string;
  status: "PendingPayment" | "Active" | "Suspended" | "Expired" | "Cancelled";
  planName: string | null;
  expiresAt: string | null;
  userCount: string;
}

export type PlanChangeDirection = "upgrade" | "downgrade" | "same";

export interface PlanChangePreview {
  direction: PlanChangeDirection;
  oldMonthlyPriceIdr: number;
  newMonthlyPriceIdr: number;
  remainingDays: number;
  proratedAmountIdr: number;
}

export interface AccountCredit {
  id: string;
  tenantId: string;
  amountIdr: number;
  reason: string;
  consumedAt: string | null;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "New" | "Replied" | "Closed";
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  allowsMultiEntity: boolean;
  maxEmployees: number;
  maxEntities: number;
  enabledModules: string[];
  durationDays: number;
  referenceMonthlyPriceIdr: number;
  permanentDiscountPercent: number;
  permanentDiscountReason: string | null;
  priceIdr: number; // effective monthly sale price (base + user + entity), server-computed — used for actual billing
  displayPriceIdr: number; // headline price shown to prospective tenants — base only unless the two flags below opt components in
  displayIncludesUserPricing: boolean;
  displayIncludesEntityPricing: boolean;
  isCustom: boolean;
  discountPercent: number;
}

export interface PlanInput {
  name: string;
  allowsMultiEntity: boolean;
  maxEmployees: number;
  maxEntities: number;
  enabledModules: string[];
  durationDays: number;
  permanentDiscountPercent: number;
  permanentDiscountReason?: string;
  displayIncludesUserPricing: boolean;
  displayIncludesEntityPricing: boolean;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isActive: boolean;
}

export interface DiscountTier {
  minValue: number;
  discountPercent: number;
}

export interface DiscountScheme {
  id: string;
  planId: string;
  schemeType: "duration_months" | "user_count" | "entity_count";
  label: string;
  tiers: DiscountTier[];
  isActive: boolean;
}

export interface PlanDetail {
  plan: Plan;
  modules: ModuleRow[];
  perModule: { code: string; baseTotal: number; perUserTotal: number; perEntityTotal: number; moduleTotal: number }[];
  schemes: DiscountScheme[];
}

export interface Affiliate {
  id: string;
  planId: string;
  code: string;
  affiliateName: string;
  customerDiscountPercent: number;
  commissionPercent: number;
  isActive: boolean;
  usedCount: number;
}

export interface AffiliateUsage {
  id: string;
  affiliateId: string;
  tenantId: string;
  amountPaidIdr: number;
  commissionIdr: number;
  createdAt: string;
}

export interface SubscriptionTotal {
  monthlyPriceIdr: number;
  totalMonths: number;
  baseTotalIdr: number;
  appliedDiscountPercent: number;
  discountAmountIdr: number;
  finalTotalIdr: number;
  discountSources: { schemeDiscount: number; promoDiscount: number; affiliateDiscount: number };
  enabledModules: string[];
}

export interface AuditLogRow {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  tenantName: string | null;
  actorName: string | null;
}

export interface AuditLogPage {
  rows: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EmailConfig {
  provider: "resend" | "smtp";
  fromName: string;
  fromEmail: string;
  hasResendKey: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  hasSmtpPassword: boolean;
  smtpSecure: boolean;
  isActive: boolean;
  usingEnvFallback: boolean;
}

export interface EmailConfigInput {
  provider: "resend" | "smtp";
  fromName: string;
  fromEmail: string;
  isActive: boolean;
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
}

export interface ModuleCatalogEntry {
  code: string;
  label: string;
  lineCount: number;
  recommended: { basePriceIdr: number; pricePerUserIdr: number; pricePerEntityIdr: number };
  features: string[];
  isAdded: boolean;
}

export interface ModuleFeatureEntry {
  code: string;
  label: string;
  features: string[];
  description: string | null;
}

export interface Promotion {
  id: string;
  planId: string;
  code: string;
  name: string;
  discountPercent: number;
  validFrom: string;
  validUntil: string;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
}

export interface ModuleRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  basePriceIdr: number;
  pricePerUserIdr: number;
  pricePerEntityIdr: number;
  isActive: boolean;
}

export interface PaymentVerificationRow {
  id: string;
  tenantId: string;
  tenantName: string;
  subdomain: string;
  planName: string | null;
  amountIdr: number;
  bankName: string;
  referenceNumber: string;
  note: string | null;
  status: "Pending" | "Approved" | "Rejected";
  rejectionReason: string | null;
  createdAt: string;
}

export interface PricingBreakdown {
  perModule: { code: string; baseTotal: number; perUserTotal: number; perEntityTotal: number; moduleTotal: number }[];
  subtotalPerCycle: number;
  cycles: number;
  subtotal: number;
  discountAmount: number;
  finalPriceIdr: number;
}

export interface DashboardSummary {
  tenants: { total: string; active: string; pendingPayment: string; suspended: string };
  tenantAdminUsers: string;
  pendingPaymentVerifications: string;
  newContactInquiries: string;
  estimatedMonthlyRevenueIdr: number;
}

export const api = {
  login: (email: string, password: string) =>
    request<Me>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  forgotPassword: (email: string) =>
    request<{ ok: true }>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token: string, newPassword: string) =>
    request<{ ok: true }>(`/api/auth/reset-password/${token}`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    }),
  confirmEmail: (token: string) => request<{ ok: true }>(`/api/auth/confirm-email/${token}`, { method: "POST" }),

  getPlans: () => request<Plan[]>("/api/plans"),
  getPublicModules: () => request<{ code: string; name: string; description: string | null }[]>("/api/modules"),
  getPublicBankAccounts: () => request<BankAccount[]>("/api/bank-accounts"),
  getPlanSchemes: (planId: string) => request<DiscountScheme[]>(`/api/plans/${planId}/schemes`),
  getPlanFeatures: (planId: string) => request<ModuleFeatureEntry[]>(`/api/plans/${planId}/features`),
  calculateSubscription: (data: {
    planId: string;
    totalMonths: number;
    promoCode?: string;
    affiliateCode?: string;
    actualUsers?: number;
    actualEntities?: number;
  }) => request<SubscriptionTotal>("/api/subscription/calculate", { method: "POST", body: JSON.stringify(data) }),
  signup: (data: {
    tenantName: string;
    subdomain: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    planId: string;
    totalMonths: number;
    bankAccountId: string;
    referenceNumber: string;
    note?: string;
    promoCode?: string;
    affiliateCode?: string;
    actualUsers?: number;
    actualEntities?: number;
  }) => request<{ tenantId: string; subdomain: string; status: string }>("/api/signup", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  submitContact: (data: { name: string; email: string; subject: string; message: string }) =>
    request<{ id: string }>("/api/contact", { method: "POST", body: JSON.stringify(data) }),

  listTenants: () => request<TenantRow[]>("/api/app-owner/tenants"),
  activateTenant: (id: string) =>
    request<{ ok: true; expiresAt: string }>(`/api/app-owner/tenants/${id}/activate`, { method: "POST" }),
  extendTenant: (id: string, days: number) =>
    request<{ ok: true; expiresAt: string }>(`/api/app-owner/tenants/${id}/extend`, {
      method: "POST",
      body: JSON.stringify({ days }),
    }),
  suspendTenant: (id: string) => request<{ ok: true }>(`/api/app-owner/tenants/${id}/suspend`, { method: "POST" }),
  reactivateTenant: (id: string) => request<{ ok: true }>(`/api/app-owner/tenants/${id}/reactivate`, { method: "POST" }),
  resetAdminPassword: (id: string) =>
    request<{ ok: true }>(`/api/app-owner/tenants/${id}/reset-admin-password`, { method: "POST" }),
  changeAdminEmail: (id: string, newEmail: string) =>
    request<{ ok: true }>(`/api/app-owner/tenants/${id}/change-admin-email`, {
      method: "POST",
      body: JSON.stringify({ newEmail }),
    }),

  previewPlanChange: (id: string, data: { planId: string; actualUsers: number; actualEntities: number }) =>
    request<PlanChangePreview>(`/api/app-owner/tenants/${id}/change-plan/preview`, { method: "POST", body: JSON.stringify(data) }),
  changeTenantPlan: (
    id: string,
    data: { planId: string; actualUsers: number; actualEntities: number; bankAccountId?: string; referenceNumber?: string; note?: string }
  ) => request<{ ok: true; direction: PlanChangeDirection; proratedAmountIdr: number }>(`/api/app-owner/tenants/${id}/change-plan`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getTenantCredits: (id: string) => request<AccountCredit[]>(`/api/app-owner/tenants/${id}/credits`),

  listInbox: () => request<Inquiry[]>("/api/app-owner/inbox"),
  getInquiry: (id: string) =>
    request<Inquiry & { replies: { id: string; body: string; createdAt: string }[] }>(`/api/app-owner/inbox/${id}`),
  replyInquiry: (id: string, body: string) =>
    request<{ ok: true }>(`/api/app-owner/inbox/${id}/reply`, { method: "POST", body: JSON.stringify({ body }) }),

  getAuditLog: (params: { page: number; pageSize: number; search?: string; action?: string }) => {
    const qs = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
    if (params.search) qs.set("search", params.search);
    if (params.action) qs.set("action", params.action);
    return request<AuditLogPage>(`/api/app-owner/audit-log?${qs.toString()}`);
  },
  getAuditLogActions: () => request<string[]>("/api/app-owner/audit-log/actions"),

  getDashboard: () => request<DashboardSummary>("/api/app-owner/dashboard"),

  listPaymentVerifications: () => request<PaymentVerificationRow[]>("/api/app-owner/payment-verifications"),
  approvePaymentVerification: (id: string) =>
    request<{ ok: true; expiresAt: string }>(`/api/app-owner/payment-verifications/${id}/approve`, { method: "POST" }),
  rejectPaymentVerification: (id: string, reason: string) =>
    request<{ ok: true }>(`/api/app-owner/payment-verifications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  listModules: () => request<ModuleRow[]>("/api/app-owner/modules"),
  getModuleCatalog: () => request<ModuleCatalogEntry[]>("/api/app-owner/modules/catalog"),
  createModule: (data: Omit<ModuleRow, "id" | "isActive">) =>
    request<ModuleRow>("/api/app-owner/modules", { method: "POST", body: JSON.stringify(data) }),
  updateModule: (id: string, data: Partial<Omit<ModuleRow, "id">>) =>
    request<ModuleRow>(`/api/app-owner/modules/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listPlansAppOwner: () => request<Plan[]>("/api/app-owner/plans"),
  getPlanDetail: (id: string) => request<PlanDetail>(`/api/app-owner/plans/${id}/detail`),
  createPlan: (data: PlanInput) => request<Plan>("/api/app-owner/plans", { method: "POST", body: JSON.stringify(data) }),
  updatePlan: (id: string, data: Partial<PlanInput>) =>
    request<Plan>(`/api/app-owner/plans/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  createScheme: (planId: string, data: { schemeType: DiscountScheme["schemeType"]; label: string; tiers: DiscountTier[] }) =>
    request<DiscountScheme>(`/api/app-owner/plans/${planId}/schemes`, { method: "POST", body: JSON.stringify(data) }),
  updateScheme: (id: string, data: Partial<{ label: string; tiers: DiscountTier[]; isActive: boolean }>) =>
    request<DiscountScheme>(`/api/app-owner/schemes/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listPromotions: () => request<Promotion[]>("/api/app-owner/promotions"),
  createPromotion: (data: { planId: string; code: string; name: string; discountPercent: number; validFrom: string; validUntil: string; maxUses: number | null }) =>
    request<Promotion>("/api/app-owner/promotions", { method: "POST", body: JSON.stringify(data) }),
  updatePromotion: (id: string, data: { isActive?: boolean; maxUses?: number | null }) =>
    request<Promotion>(`/api/app-owner/promotions/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listAffiliates: () => request<Affiliate[]>("/api/app-owner/affiliates"),
  createAffiliate: (data: { planId: string; code: string; affiliateName: string; customerDiscountPercent: number; commissionPercent: number }) =>
    request<Affiliate>("/api/app-owner/affiliates", { method: "POST", body: JSON.stringify(data) }),
  updateAffiliate: (id: string, data: Partial<{ isActive: boolean; customerDiscountPercent: number; commissionPercent: number }>) =>
    request<Affiliate>(`/api/app-owner/affiliates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getAffiliateUsages: (id: string) => request<AffiliateUsage[]>(`/api/app-owner/affiliates/${id}/usages`),

  getEmailConfig: () => request<EmailConfig>("/api/app-owner/email-config"),
  updateEmailConfig: (data: EmailConfigInput) =>
    request<{ ok: true }>("/api/app-owner/email-config", { method: "PUT", body: JSON.stringify(data) }),

  listBankAccounts: () => request<BankAccount[]>("/api/app-owner/bank-accounts"),
  createBankAccount: (data: { bankName: string; accountNumber: string; accountHolderName: string; isActive: boolean }) =>
    request<BankAccount>("/api/app-owner/bank-accounts", { method: "POST", body: JSON.stringify(data) }),
  updateBankAccount: (id: string, data: Partial<{ bankName: string; accountNumber: string; accountHolderName: string; isActive: boolean }>) =>
    request<BankAccount>(`/api/app-owner/bank-accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  calculatePricing: (data: { moduleCodes: string[]; maxEntities: number; maxUsers: number; durationDays: number; discountPercent: number }) =>
    request<PricingBreakdown>("/api/app-owner/pricing/calculate", { method: "POST", body: JSON.stringify(data) }),

  createTenantPreset: (data: {
    mode: "preset";
    planId: string;
    totalMonths?: number;
    tenantName: string;
    subdomain: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) =>
    request<{ tenantId: string; subdomain: string; status: string; expiresAt: string }>("/api/app-owner/tenants", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createTenantCustom: (data: {
    mode: "custom";
    moduleCodes: string[];
    maxEntities: number;
    maxUsers: number;
    durationDays: number;
    discountPercent: number;
    tenantName: string;
    subdomain: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) =>
    request<{ tenantId: string; subdomain: string; status: string; expiresAt: string }>("/api/app-owner/tenants", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

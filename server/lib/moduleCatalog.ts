import fs from "node:fs";
import path from "node:path";

/**
 * The REAL, fixed list of billable feature modules in this app (mirrors
 * src/components/layout/Sidebar.tsx's menu — same ids/labels, so "Modul
 * Baru" always matches an actual module, never a free-typed made-up code).
 * `tenants` (App Owner's own multi-tenant admin tool) and `dashboard`
 * (bundled free in every plan) are intentionally excluded — not sellable.
 */
const REGISTRY: { code: string; label: string; file: string }[] = [
  { code: "ess", label: "ESS (Employee Self-Service)", file: "EssPortal.tsx" },
  { code: "mss", label: "MSS (Manager Self-Service)", file: "MssPortal.tsx" },
  { code: "organization", label: "Struktur Organisasi", file: "OrganizationManagement.tsx" },
  { code: "office_locations", label: "Lokasi Kantor", file: "OfficeLocationManagement.tsx" },
  { code: "recruitment", label: "Rekrutmen & Onboarding", file: "RecruitmentManagement.tsx" },
  { code: "employees", label: "Management Karyawan", file: "EmployeeManagement.tsx" },
  { code: "personalia", label: "Personalia", file: "PersonaliaManagement.tsx" },
  { code: "attendance", label: "Presensi", file: "AttendanceManagement.tsx" },
  { code: "trips", label: "Perjalanan Dinas", file: "BusinessTripManagement.tsx" },
  { code: "approvals", label: "Approval", file: "ApprovalCenter.tsx" },
  { code: "reports", label: "Laporan & Analisis", file: "ReportsManagement.tsx" },
  { code: "payroll", label: "Payroll", file: "PayrollManagement.tsx" },
  { code: "loans", label: "Pinjaman", file: "LoanManagement.tsx" },
  { code: "kpi", label: "Penilaian (KPI & OKR)", file: "PerformanceKpi.tsx" },
  { code: "compliance", label: "Kepatuhan & Sanksi SP/PHK", file: "ComplianceManagement.tsx" },
  { code: "offboarding", label: "Offboarding", file: "OffboardingManagement.tsx" },
  { code: "assets", label: "General Affair", file: "GaAssetManagement.tsx" },
  { code: "procurement", label: "Procurement", file: "ProcurementManagement.tsx" },
  { code: "documents", label: "Manajemen Dokumen", file: "DocumentManagement.tsx" },
  { code: "rbac", label: "Management User", file: "RbacManagement.tsx" },
  { code: "audit", label: "Audit Trail & Log Aktivitas", file: "AuditTrailManagement.tsx" },
];

function readModuleFile(file: string): string {
  try {
    return fs.readFileSync(path.resolve(process.cwd(), "src/components/modules", file), "utf8");
  } catch {
    return ""; // file moved/renamed — recommendation/features just fall back to empty, doesn't crash the catalog
  }
}

function countLines(content: string): number {
  return content ? content.split("\n").length : 0;
}

/**
 * "Turunan modul" — the sub-features actually inside a module, extracted
 * straight from its own tab navigation ("Ini harus otomatis sesuai yang ada
 * di modul", never hand-typed marketing copy that can drift from the real
 * code). Every module component renders its tabs the same way: a
 * `<ScrollableTabNav>...</ScrollableTabNav>` block whose buttons each hold
 * one plain-text `<span>Label</span>`. Pulling labels straight from that
 * markup means the public pricing page always matches what the module
 * actually does, with zero manual upkeep.
 */
function extractFeatures(content: string): string[] {
  if (!content) return [];
  const navBlocks = content.match(/<ScrollableTabNav[^>]*>[\s\S]*?<\/ScrollableTabNav>/g) ?? [];
  const labels = new Set<string>();
  for (const block of navBlocks) {
    for (const m of block.matchAll(/<span>([^<{}]+)<\/span>/g)) {
      const label = m[1].trim();
      if (label.length >= 3 && /[a-zA-Z]/.test(label)) labels.add(label);
    }
  }
  return Array.from(labels);
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Price recommendation heuristic: base price scales with sqrt(line count)
 * — a proxy for module complexity/size — so a 23,000-line module isn't
 * literally 60x a 400-line one (unreadably skewed), but still clearly
 * priced higher. Per-user/per-entity recommendations are a fixed fraction
 * of the recommended base. All of it is an editable *suggestion* — App
 * Owner can override every field before saving.
 */
export function recommendPricing(lineCount: number) {
  const basePriceIdr = Math.min(600_000, Math.max(50_000, roundTo(3000 * Math.sqrt(lineCount), 10_000)));
  const pricePerUserIdr = roundTo(basePriceIdr * 0.03, 500);
  const pricePerEntityIdr = roundTo(basePriceIdr * 0.15, 5_000);
  return { basePriceIdr, pricePerUserIdr, pricePerEntityIdr };
}

export function getModuleCatalog() {
  return REGISTRY.map((entry) => {
    const content = readModuleFile(entry.file);
    const lineCount = countLines(content);
    return { ...entry, lineCount, recommended: recommendPricing(lineCount), features: extractFeatures(content) };
  });
}

/** Feature list (only) for a set of module codes, in REGISTRY order — used to render "turunan modul" on the public plan detail without the pricing catalog. */
export function getModuleFeatures(codes: string[]): { code: string; label: string; features: string[] }[] {
  const wantAll = codes.includes("*");
  return REGISTRY.filter((entry) => wantAll || codes.includes(entry.code)).map((entry) => {
    const content = readModuleFile(entry.file);
    return { code: entry.code, label: entry.label, features: extractFeatures(content) };
  });
}

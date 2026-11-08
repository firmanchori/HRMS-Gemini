import { PTKPStatus } from '../types/hrms';

export function getTERCategory(ptkp: PTKPStatus): 'TER A' | 'TER B' | 'TER C' {
  if (ptkp === 'TK/0' || ptkp === 'TK/1' || ptkp === 'K/0') {
    return 'TER A';
  }
  if (ptkp === 'TK/2' || ptkp === 'TK/3' || ptkp === 'K/1' || ptkp === 'K/2') {
    return 'TER B';
  }
  return 'TER C'; // K/3
}

/**
 * TER monthly bracket tables — transcribed verbatim from the official
 * Lampiran of PMK 168/2023 (pajak.go.id), cross-checked against the live
 * regulation status on 2026-11-08: still in force, no superseding PMK as
 * of that date. The previous version of this file had these tables
 * fabricated/approximated rather than sourced, and was wrong in two ways:
 * TER B and TER C used incorrect bracket boundaries from roughly the
 * 7th bracket onward (not just rounded — genuinely different thresholds),
 * and all three categories were truncated to a flat top rate (25%/15%/9%)
 * instead of continuing on to the real 34% ceiling above ~Rp1.4 miliar/bulan
 * — meaning every high earner was under-withheld. If DJP revises these
 * brackets, update the three arrays below from the new Lampiran — don't
 * hand-derive replacement thresholds.
 * Each tuple is [upperBound (Rp, inclusive) | null for the open-ended top
 * bracket, ratePercent].
 */
const TER_A_BRACKETS: [number | null, number][] = [
  [5400000, 0], [5650000, 0.25], [5950000, 0.5], [6300000, 0.75], [6750000, 1.0],
  [7500000, 1.25], [8550000, 1.5], [9650000, 1.75], [10050000, 2.0], [10350000, 2.25],
  [10700000, 2.5], [11050000, 3.0], [11600000, 3.5], [12500000, 4.0], [13750000, 5.0],
  [15100000, 6.0], [16950000, 7.0], [19750000, 8.0], [24150000, 9.0], [26450000, 10.0],
  [28000000, 11.0], [30050000, 12.0], [32400000, 13.0], [35400000, 14.0], [39100000, 15.0],
  [43850000, 16.0], [47800000, 17.0], [51400000, 18.0], [56300000, 19.0], [62200000, 20.0],
  [68600000, 21.0], [77500000, 22.0], [89000000, 23.0], [103000000, 24.0], [125000000, 25.0],
  [157000000, 26.0], [206000000, 27.0], [337000000, 28.0], [454000000, 29.0], [550000000, 30.0],
  [695000000, 31.0], [910000000, 32.0], [1400000000, 33.0], [null, 34.0],
];

const TER_B_BRACKETS: [number | null, number][] = [
  [6200000, 0], [6500000, 0.25], [6850000, 0.5], [7300000, 0.75], [9200000, 1.0],
  [10750000, 1.5], [11250000, 2.0], [11600000, 2.5], [12600000, 3.0], [13600000, 4.0],
  [14950000, 5.0], [16400000, 6.0], [18450000, 7.0], [21850000, 8.0], [26000000, 9.0],
  [27700000, 10.0], [29350000, 11.0], [31450000, 12.0], [33950000, 13.0], [37100000, 14.0],
  [41100000, 15.0], [45800000, 16.0], [49500000, 17.0], [53800000, 18.0], [58500000, 19.0],
  [64000000, 20.0], [71000000, 21.0], [80000000, 22.0], [93000000, 23.0], [109000000, 24.0],
  [129000000, 25.0], [163000000, 26.0], [211000000, 27.0], [374000000, 28.0], [459000000, 29.0],
  [555000000, 30.0], [704000000, 31.0], [957000000, 32.0], [1405000000, 33.0], [null, 34.0],
];

const TER_C_BRACKETS: [number | null, number][] = [
  [6600000, 0], [6950000, 0.25], [7350000, 0.5], [7800000, 0.75], [8850000, 1.0],
  [9800000, 1.25], [10950000, 1.5], [11200000, 1.75], [12050000, 2.0], [12950000, 3.0],
  [14150000, 4.0], [15550000, 5.0], [17050000, 6.0], [19500000, 7.0], [22700000, 8.0],
  [26600000, 9.0], [28100000, 10.0], [30100000, 11.0], [32600000, 12.0], [35400000, 13.0],
  [38900000, 14.0], [43000000, 15.0], [47400000, 16.0], [51200000, 17.0], [55800000, 18.0],
  [60400000, 19.0], [66700000, 20.0], [74500000, 21.0], [83200000, 22.0], [95600000, 23.0],
  [110000000, 24.0], [134000000, 25.0], [169000000, 26.0], [221000000, 27.0], [390000000, 28.0],
  [463000000, 29.0], [561000000, 30.0], [709000000, 31.0], [965000000, 32.0], [1419000000, 33.0],
  [null, 34.0],
];

function lookupTERRate(grossIncome: number, brackets: [number | null, number][]): number {
  for (const [upperBound, rate] of brackets) {
    if (upperBound === null || grossIncome <= upperBound) return rate;
  }
  return brackets[brackets.length - 1][1];
}

export function calculatePPh21TER(grossIncome: number, ptkp: PTKPStatus): {
  category: 'TER A' | 'TER B' | 'TER C';
  ratePercent: number;
  taxAmount: number;
} {
  const category = getTERCategory(ptkp);
  const brackets = category === 'TER A' ? TER_A_BRACKETS : category === 'TER B' ? TER_B_BRACKETS : TER_C_BRACKETS;
  const rate = lookupTERRate(grossIncome, brackets);
  const taxAmount = Math.round((grossIncome * rate) / 100);
  return { category, ratePercent: rate, taxAmount };
}

export function calculateBPJS(wage: number) {
  // Batas plafon upah BPJS Kesehatan: Rp 12.000.000 (Pasal 32 Perpres
  // 59/2024) — confirmed still current as of 2026-11-08, no revision found.
  const maxWageKes = 12000000;
  const wageForKes = Math.min(wage, maxWageKes);
  const bpjsKesCompany = Math.round(wageForKes * 0.04);
  const bpjsKesEmployee = Math.round(wageForKes * 0.01);

  // Batas plafon upah BPJS TK Jaminan Pensiun: Rp 10.547.400, effective
  // March 2025 per BPJS Ketenagakerjaan surat B/91/022025 (PP 45/2015
  // Pasal 29(3): adjusted yearly by 1 + prior-year GDP growth). The
  // previous figure here (Rp10.042.300) was the stale 2024 value —
  // re-verify this against BPJS Ketenagakerjaan's annual announcement
  // each year, since it changes on its own schedule independent of PMK
  // tax regulations.
  const maxWageJP = 10547400;
  const wageForJP = Math.min(wage, maxWageJP);

  // BPJS Ketenagakerjaan:
  // JHT: Perusahaan 3.7%, Pekerja 2% (PP 46/2015, unchanged)
  const jhtCompany = Math.round(wage * 0.037);
  const jhtEmployee = Math.round(wage * 0.02);

  // JKK dibayar Perusahaan — rate varies by business risk category (5
  // tiers: 0.24% / 0.54% / 0.89% / 1.27% / 1.74% per PP 82/2019); this
  // hardcodes Tingkat Risiko Sangat Rendah (tier I), appropriate for an
  // office/desk-work tenant but understates the real liability for a
  // tenant in a higher-risk business (construction, heavy manufacturing,
  // logistics with vehicle fleets, etc) — that risk tier should become a
  // per-tenant setting rather than a hardcoded constant if NusaHR is sold
  // into those industries.
  const jkkCompany = Math.round(wage * 0.0024);
  // JKM (0.3%) dibayar Perusahaan — fixed regardless of risk category.
  const jkmCompany = Math.round(wage * 0.003);

  // JP (Jaminan Pensiun): Perusahaan 2%, Pekerja 1%
  const jpCompany = Math.round(wageForJP * 0.02);
  const jpEmployee = Math.round(wageForJP * 0.01);

  const bpjsTkCompany = jhtCompany + jkkCompany + jkmCompany + jpCompany;
  const bpjsTkEmployee = jhtEmployee + jpEmployee;

  return {
    bpjsKesCompany,
    bpjsKesEmployee,
    bpjsTkCompany,
    bpjsTkEmployee,
    breakdown: {
      jhtCompany,
      jhtEmployee,
      jkkCompany,
      jkmCompany,
      jpCompany,
      jpEmployee,
    },
  };
}

export function calculateOvertimePay(monthlyWage: number, overtimeHours: number): number {
  if (overtimeHours <= 0) return 0;
  const hourlyRate = monthlyWage / 173;
  // Jam pertama 1.5x, jam berikutnya 2x
  if (overtimeHours <= 1) {
    return Math.round(overtimeHours * 1.5 * hourlyRate);
  }
  const firstHour = 1 * 1.5 * hourlyRate;
  const remainingHours = (overtimeHours - 1) * 2 * hourlyRate;
  return Math.round(firstHour + remainingHours);
}

export function calculateSeverancePay(monthlyWage: number, yearsOfService: number): {
  pesangonMonths: number;
  upmkMonths: number;
  totalSeverance: number;
} {
  // PP 35/2021 Pasal 40
  let pesangonMonths = 1;
  if (yearsOfService < 1) pesangonMonths = 1;
  else if (yearsOfService < 2) pesangonMonths = 2;
  else if (yearsOfService < 3) pesangonMonths = 3;
  else if (yearsOfService < 4) pesangonMonths = 4;
  else if (yearsOfService < 5) pesangonMonths = 5;
  else if (yearsOfService < 6) pesangonMonths = 6;
  else if (yearsOfService < 7) pesangonMonths = 7;
  else if (yearsOfService < 8) pesangonMonths = 8;
  else pesangonMonths = 9;

  // Uang Penghargaan Masa Kerja (UPMK)
  let upmkMonths = 0;
  if (yearsOfService >= 3 && yearsOfService < 6) upmkMonths = 2;
  else if (yearsOfService >= 6 && yearsOfService < 9) upmkMonths = 3;
  else if (yearsOfService >= 9 && yearsOfService < 12) upmkMonths = 4;
  else if (yearsOfService >= 12 && yearsOfService < 15) upmkMonths = 5;
  else if (yearsOfService >= 15 && yearsOfService < 18) upmkMonths = 6;
  else if (yearsOfService >= 18 && yearsOfService < 21) upmkMonths = 7;
  else if (yearsOfService >= 21 && yearsOfService < 24) upmkMonths = 8;
  else if (yearsOfService >= 24) upmkMonths = 10;

  const totalSeverance = Math.round((pesangonMonths + upmkMonths) * monthlyWage);
  return { pesangonMonths, upmkMonths, totalSeverance };
}

export const PTKP_VALUES: Record<PTKPStatus, number> = {
  'TK/0': 54000000,
  'TK/1': 58500000,
  'TK/2': 63000000,
  'TK/3': 67500000,
  'K/0': 58500000,
  'K/1': 63000000,
  'K/2': 67500000,
  'K/3': 72000000,
};

export function getPTKPAmount(ptkp: PTKPStatus): number {
  return PTKP_VALUES[ptkp] || 54000000;
}

export function calculateAnnualPPh21Pasal17(taxableIncome: number): {
  tax: number;
  tiers: { tier: string; rate: number; taxableInTier: number; taxInTier: number }[];
} {
  let remaining = Math.max(0, taxableIncome);
  let totalTax = 0;
  const tiers: { tier: string; rate: number; taxableInTier: number; taxInTier: number }[] = [];

  // Lapisan 1: 0 - 60jt (5%)
  const tier1Amount = Math.min(remaining, 60000000);
  const tier1Tax = tier1Amount * 0.05;
  totalTax += tier1Tax;
  remaining -= tier1Amount;
  tiers.push({ tier: 's/d Rp 60 Juta', rate: 5, taxableInTier: tier1Amount, taxInTier: tier1Tax });

  // Lapisan 2: 60jt - 250jt (15%)
  if (remaining > 0) {
    const tier2Amount = Math.min(remaining, 190000000);
    const tier2Tax = tier2Amount * 0.15;
    totalTax += tier2Tax;
    remaining -= tier2Amount;
    tiers.push({ tier: '> Rp 60 Jt s/d 250 Jt', rate: 15, taxableInTier: tier2Amount, taxInTier: tier2Tax });
  }

  // Lapisan 3: 250jt - 500jt (25%)
  if (remaining > 0) {
    const tier3Amount = Math.min(remaining, 250000000);
    const tier3Tax = tier3Amount * 0.25;
    totalTax += tier3Tax;
    remaining -= tier3Amount;
    tiers.push({ tier: '> Rp 250 Jt s/d 500 Jt', rate: 25, taxableInTier: tier3Amount, taxInTier: tier3Tax });
  }

  // Lapisan 4: 500jt - 5 Milyar (30%)
  if (remaining > 0) {
    const tier4Amount = Math.min(remaining, 4500000000);
    const tier4Tax = tier4Amount * 0.30;
    totalTax += tier4Tax;
    remaining -= tier4Amount;
    tiers.push({ tier: '> Rp 500 Jt s/d 5 Milyar', rate: 30, taxableInTier: tier4Amount, taxInTier: tier4Tax });
  }

  // Lapisan 5: > 5 Milyar (35%)
  if (remaining > 0) {
    const tier5Tax = remaining * 0.35;
    totalTax += tier5Tax;
    tiers.push({ tier: 'Diatas Rp 5 Milyar', rate: 35, taxableInTier: remaining, taxInTier: tier5Tax });
  }

  return { tax: Math.round(totalTax), tiers };
}

/**
 * PPh Pasal 21 Final atas Pesangon Dibayar Sekaligus (PP 68/2009)
 */
export function calculatePesangonTax(severanceGross: number): {
  tax: number;
  tiers: { tier: string; rate: number; taxableInTier: number; taxInTier: number }[];
} {
  let remaining = Math.max(0, severanceGross);
  let totalTax = 0;
  const tiers: { tier: string; rate: number; taxableInTier: number; taxInTier: number }[] = [];

  // Lapisan 1: 0 - 50jt (0%)
  const tier1Amount = Math.min(remaining, 50000000);
  const tier1Tax = 0;
  totalTax += tier1Tax;
  remaining -= tier1Amount;
  tiers.push({ tier: 's/d Rp 50 Juta (Bebas Pajak)', rate: 0, taxableInTier: tier1Amount, taxInTier: tier1Tax });

  // Lapisan 2: > 50jt s/d 100jt (5%)
  if (remaining > 0) {
    const tier2Amount = Math.min(remaining, 50000000);
    const tier2Tax = tier2Amount * 0.05;
    totalTax += tier2Tax;
    remaining -= tier2Amount;
    tiers.push({ tier: '> Rp 50 Jt s/d 100 Jt', rate: 5, taxableInTier: tier2Amount, taxInTier: tier2Tax });
  }

  // Lapisan 3: > 100jt s/d 500jt (15%)
  if (remaining > 0) {
    const tier3Amount = Math.min(remaining, 400000000);
    const tier3Tax = tier3Amount * 0.15;
    totalTax += tier3Tax;
    remaining -= tier3Amount;
    tiers.push({ tier: '> Rp 100 Jt s/d 500 Jt', rate: 15, taxableInTier: tier3Amount, taxInTier: tier3Tax });
  }

  // Lapisan 4: > 500jt (25%)
  if (remaining > 0) {
    const tier4Tax = remaining * 0.25;
    totalTax += tier4Tax;
    tiers.push({ tier: '> Rp 500 Juta', rate: 25, taxableInTier: remaining, taxInTier: tier4Tax });
  }

  return { tax: Math.round(totalTax), tiers };
}

/**
 * PPh 21 Bukan Pegawai (Tenaga Ahli / Imbalan)
 * DPP = 50% x Penghasilan Bruto
 */
export function calculateNonEmployeeTax(grossAmount: number): {
  dpp: number;
  ratePercent: number;
  tax: number;
} {
  const dpp = Math.round(grossAmount * 0.5);
  // Tarif Pasal 17 untuk Bukan Pegawai (Lapisan 1: 5%, selanjutnya jika kumulatif)
  let rate = 5;
  if (dpp > 60000000 && dpp <= 250000000) rate = 15;
  else if (dpp > 250000000 && dpp <= 500000000) rate = 25;
  else if (dpp > 500000000) rate = 30;

  const tax = Math.round((dpp * rate) / 100);
  return { dpp, ratePercent: rate, tax };
}

/**
 * PPh 21 Pegawai Tidak Tetap / Tenaga Kerja Lepas Harian
 */
export function calculateDailyWorkerTax(dailyWage: number, workDays: number): {
  dailyRatePercent: number;
  dailyTax: number;
  totalGross: number;
  totalTax: number;
} {
  let dailyRatePercent = 0;
  if (dailyWage <= 450000) {
    dailyRatePercent = 0;
  } else if (dailyWage <= 2500000) {
    dailyRatePercent = 0.5; // TER Harian
  } else {
    dailyRatePercent = 1.0;
  }

  const dailyTax = Math.round((dailyWage * dailyRatePercent) / 100);
  const totalGross = dailyWage * workDays;
  const totalTax = dailyTax * workDays;

  return { dailyRatePercent, dailyTax, totalGross, totalTax };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}


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

export function calculatePPh21TER(grossIncome: number, ptkp: PTKPStatus): {
  category: 'TER A' | 'TER B' | 'TER C';
  ratePercent: number;
  taxAmount: number;
} {
  const category = getTERCategory(ptkp);
  let rate = 0;

  if (category === 'TER A') {
    if (grossIncome <= 5400000) rate = 0;
    else if (grossIncome <= 5650000) rate = 0.25;
    else if (grossIncome <= 5950000) rate = 0.5;
    else if (grossIncome <= 6300000) rate = 0.75;
    else if (grossIncome <= 6750000) rate = 1.0;
    else if (grossIncome <= 7500000) rate = 1.25;
    else if (grossIncome <= 8550000) rate = 1.5;
    else if (grossIncome <= 9650000) rate = 1.75;
    else if (grossIncome <= 10050000) rate = 2.0;
    else if (grossIncome <= 10350000) rate = 2.25;
    else if (grossIncome <= 10700000) rate = 2.5;
    else if (grossIncome <= 11050000) rate = 3.0;
    else if (grossIncome <= 11600000) rate = 3.5;
    else if (grossIncome <= 12500000) rate = 4.0;
    else if (grossIncome <= 13750000) rate = 5.0;
    else if (grossIncome <= 15100000) rate = 6.0;
    else if (grossIncome <= 16950000) rate = 7.0;
    else if (grossIncome <= 19750000) rate = 8.0;
    else if (grossIncome <= 24150000) rate = 9.0;
    else if (grossIncome <= 26450000) rate = 10.0;
    else if (grossIncome <= 28000000) rate = 11.0;
    else if (grossIncome <= 30050000) rate = 12.0;
    else if (grossIncome <= 32400000) rate = 13.0;
    else if (grossIncome <= 35400000) rate = 14.0;
    else if (grossIncome <= 39100000) rate = 15.0;
    else if (grossIncome <= 43850000) rate = 16.0;
    else if (grossIncome <= 47800000) rate = 17.0;
    else if (grossIncome <= 51400000) rate = 18.0;
    else if (grossIncome <= 56300000) rate = 19.0;
    else if (grossIncome <= 62200000) rate = 20.0;
    else if (grossIncome <= 68600000) rate = 21.0;
    else if (grossIncome <= 77500000) rate = 22.0;
    else if (grossIncome <= 89000000) rate = 23.0;
    else if (grossIncome <= 103000000) rate = 24.0;
    else rate = 25.0;
  } else if (category === 'TER B') {
    if (grossIncome <= 6200000) rate = 0;
    else if (grossIncome <= 6500000) rate = 0.25;
    else if (grossIncome <= 6850000) rate = 0.5;
    else if (grossIncome <= 7300000) rate = 0.75;
    else if (grossIncome <= 9200000) rate = 1.0;
    else if (grossIncome <= 10750000) rate = 1.5;
    else if (grossIncome <= 12550000) rate = 2.0;
    else if (grossIncome <= 14900000) rate = 3.0;
    else if (grossIncome <= 16500000) rate = 4.0;
    else if (grossIncome <= 18600000) rate = 5.0;
    else if (grossIncome <= 20850000) rate = 6.0;
    else if (grossIncome <= 24500000) rate = 7.0;
    else if (grossIncome <= 27000000) rate = 8.0;
    else if (grossIncome <= 30000000) rate = 9.0;
    else if (grossIncome <= 33500000) rate = 10.0;
    else if (grossIncome <= 37500000) rate = 11.0;
    else if (grossIncome <= 42000000) rate = 12.0;
    else if (grossIncome <= 47000000) rate = 13.0;
    else if (grossIncome <= 53000000) rate = 14.0;
    else rate = 15.0;
  } else {
    // TER C
    if (grossIncome <= 6600000) rate = 0;
    else if (grossIncome <= 6950000) rate = 0.25;
    else if (grossIncome <= 7350000) rate = 0.5;
    else if (grossIncome <= 7800000) rate = 0.75;
    else if (grossIncome <= 8850000) rate = 1.0;
    else if (grossIncome <= 10600000) rate = 1.5;
    else if (grossIncome <= 12700000) rate = 2.0;
    else if (grossIncome <= 15200000) rate = 3.0;
    else if (grossIncome <= 17000000) rate = 4.0;
    else if (grossIncome <= 19300000) rate = 5.0;
    else if (grossIncome <= 21850000) rate = 6.0;
    else if (grossIncome <= 25600000) rate = 7.0;
    else if (grossIncome <= 28500000) rate = 8.0;
    else rate = 9.0;
  }

  const taxAmount = Math.round((grossIncome * rate) / 100);
  return { category, ratePercent: rate, taxAmount };
}

export function calculateBPJS(wage: number) {
  // Batas plafon upah BPJS Kesehatan: Rp 12.000.000
  const maxWageKes = 12000000;
  const wageForKes = Math.min(wage, maxWageKes);
  const bpjsKesCompany = Math.round(wageForKes * 0.04);
  const bpjsKesEmployee = Math.round(wageForKes * 0.01);

  // Batas plafon upah BPJS TK Jaminan Pensiun: Rp 10.042.300
  const maxWageJP = 10042300;
  const wageForJP = Math.min(wage, maxWageJP);

  // BPJS Ketenagakerjaan:
  // JHT: Perusahaan 3.7%, Pekerja 2%
  const jhtCompany = Math.round(wage * 0.037);
  const jhtEmployee = Math.round(wage * 0.02);

  // JKK (Tingkat Risiko Sangat Rendah 0.24%) + JKM (0.3%) dibayar Perusahaan
  const jkkCompany = Math.round(wage * 0.0024);
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


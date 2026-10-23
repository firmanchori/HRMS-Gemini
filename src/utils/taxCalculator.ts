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

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

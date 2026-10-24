import { FlexibleNikSettings, NikPatternConfig } from '../types/hrms';
import { toRomanNumeral } from './documentNumbering';

export interface NikTokenDefinition {
  token: string;
  label: string;
  example: string;
  description: string;
}

export const NIK_TOKEN_CATALOG: NikTokenDefinition[] = [
  {
    token: '{ENTITY}',
    label: 'Kode Entitas',
    example: 'NTM',
    description: 'Kode perusahaan / anak perusahaan aktif (contoh: NTM, NSD, NCI)',
  },
  {
    token: '{TYPE_CODE}',
    label: 'Kode Status Kerja',
    example: 'TTP',
    description: 'TTP (Tetap), KTR (Kontrak), MGN (Magang), FL (Freelance)',
  },
  {
    token: '{YYYY}',
    label: 'Tahun 4 Digit',
    example: '2026',
    description: 'Tahun berjalan 4 angka penuh (YYYY)',
  },
  {
    token: '{YY}',
    label: 'Tahun 2 Digit',
    example: '26',
    description: '2 digit akhir tahun berjalan (YY)',
  },
  {
    token: '{MM}',
    label: 'Bulan 2 Digit',
    example: '10',
    description: 'Bulan berjalan dengan 2 digit angka (01-12)',
  },
  {
    token: '{ROMAN_MONTH}',
    label: 'Bulan Romawi',
    example: 'X',
    description: 'Bulan dalam format angka Romawi resmi (I s/d XII)',
  },
  {
    token: '{SEQ:3}',
    label: 'Nomor Urut 3 Digit',
    example: '001',
    description: 'Nomor sequence urut padding 3 digit (001 - 999)',
  },
  {
    token: '{SEQ:4}',
    label: 'Nomor Urut 4 Digit',
    example: '0001',
    description: 'Nomor sequence urut padding 4 digit (0001 - 9999)',
  },
  {
    token: '{SEQ:5}',
    label: 'Nomor Urut 5 Digit',
    example: '00001',
    description: 'Nomor sequence urut padding 5 digit (00001 - 99999)',
  },
  {
    token: '{DEPT}',
    label: 'Kode Departemen',
    example: 'ENG',
    description: 'Singkatan departemen karyawan jika diisi (contoh: HC, ENG, FIN)',
  },
];

export const DEFAULT_FLEXIBLE_NIK_SETTINGS: FlexibleNikSettings = {
  permanent: {
    pattern: '{ENTITY}-TTP/{YYYY}/{SEQ:4}',
    counter: 1,
    digitPadding: 4,
    resetCycle: 'yearly',
    description: 'Format Baku Karyawan Tetap (PKWTT) - Reset Nomor Urut Tahunan',
  },
  contract: {
    pattern: '{ENTITY}-KTR/{YYYY}/{SEQ:4}',
    counter: 1,
    digitPadding: 4,
    resetCycle: 'yearly',
    description: 'Format Baku Karyawan Kontrak (PKWT) - Reset Nomor Urut Tahunan',
  },
  internship: {
    pattern: '{ENTITY}-MGN/{YYYY}/{SEQ:3}',
    counter: 1,
    digitPadding: 3,
    resetCycle: 'yearly',
    description: 'Format Mahasiswa / Siswa Magang (Internship) - 3 Digit Nomor Urut',
  },
  freelance: {
    pattern: '{ENTITY}-FL/{YYYY}/{SEQ:3}',
    counter: 1,
    digitPadding: 3,
    resetCycle: 'yearly',
    description: 'Format Tenaga Lepas / Mitra Konsultan Kontrak Khusus',
  },
};

/**
 * Normalizes employment type to key: 'permanent' | 'contract' | 'internship' | 'freelance'
 */
export function normalizeEmploymentType(type?: string): 'permanent' | 'contract' | 'internship' | 'freelance' {
  const lower = (type || '').toLowerCase();
  if (lower.includes('tetap') || lower.includes('permanent') || lower.includes('pkwtt')) {
    return 'permanent';
  }
  if (lower.includes('magang') || lower.includes('intern')) {
    return 'internship';
  }
  if (lower.includes('freelance') || lower.includes('mitra') || lower.includes('lepas') || lower.includes('konsultan')) {
    return 'freelance';
  }
  return 'contract';
}

/**
 * Returns type code prefix for token {TYPE_CODE}
 */
export function getEmploymentTypeCode(typeKey: 'permanent' | 'contract' | 'internship' | 'freelance'): string {
  switch (typeKey) {
    case 'permanent':
      return 'TTP';
    case 'contract':
      return 'KTR';
    case 'internship':
      return 'MGN';
    case 'freelance':
      return 'FL';
    default:
      return 'EMP';
  }
}

interface GenerateNikParams {
  pattern?: string;
  employmentType?: string;
  entityCode?: string;
  departmentCode?: string;
  counter?: number;
  digitPadding?: number;
  date?: Date;
  customPrefix?: string;
  customSuffix?: string;
}

/**
 * Generate formatted NIK based on flexible formula pattern
 */
export function generateFlexibleNik(params: GenerateNikParams): string {
  const {
    pattern = '{ENTITY}-{TYPE_CODE}/{YYYY}/{SEQ:4}',
    employmentType = 'Tetap',
    entityCode = 'NTM',
    departmentCode = 'GEN',
    counter = 1,
    digitPadding = 4,
    date = new Date(),
    customPrefix = '',
    customSuffix = '',
  } = params;

  const typeKey = normalizeEmploymentType(employmentType);
  const typeCode = getEmploymentTypeCode(typeKey);

  const year4 = date.getFullYear().toString();
  const year2 = year4.slice(-2);
  const monthNum = date.getMonth() + 1;
  const month2 = String(monthNum).padStart(2, '0');
  const romanMonth = toRomanNumeral(monthNum);

  let result = pattern;

  // Replace ENTITY
  result = result.replace(/\{ENTITY\}/gi, entityCode.toUpperCase());

  // Replace TYPE_CODE & TYPE
  result = result.replace(/\{TYPE_CODE\}/gi, typeCode);
  result = result.replace(/\{TYPE\}/gi, typeCode);

  // Replace Date tokens
  result = result.replace(/\{YYYY\}/gi, year4);
  result = result.replace(/\{YY\}/gi, year2);
  result = result.replace(/\{MM\}/gi, month2);
  result = result.replace(/\{ROMAN_MONTH\}/gi, romanMonth);

  // Replace Department token
  result = result.replace(/\{DEPT\}/gi, (departmentCode || 'GEN').toUpperCase().slice(0, 4));
  result = result.replace(/\{DEPT_CODE\}/gi, (departmentCode || 'GEN').toUpperCase().slice(0, 4));

  // Sequence with explicit padding: {SEQ:3}, {SEQ:4}, {SEQ:5}, or {0001}
  result = result.replace(/\{SEQ:(\d+)\}/gi, (_, p1) => {
    const pad = parseInt(p1, 10) || digitPadding;
    return String(counter).padStart(pad, '0');
  });

  result = result.replace(/\{(0+1)\}/gi, (match) => {
    const pad = match.length - 2; // subtract { and }
    return String(counter).padStart(pad, '0');
  });

  // Default SEQ or COUNTER without specified pad
  result = result.replace(/\{SEQ\}/gi, String(counter).padStart(digitPadding, '0'));
  result = result.replace(/\{COUNTER\}/gi, String(counter).padStart(digitPadding, '0'));

  if (customPrefix) {
    result = `${customPrefix}${result}`;
  }
  if (customSuffix) {
    result = `${result}${customSuffix}`;
  }

  return result.trim();
}

/**
 * Live preview simulator for testing a pattern
 */
export function previewNikPattern(
  pattern: string,
  typeKey: 'permanent' | 'contract' | 'internship' | 'freelance',
  entityCode: string = 'NTM',
  counter: number = 1,
  digitPadding: number = 4
): string {
  const typeLabelMap = {
    permanent: 'Tetap',
    contract: 'Kontrak',
    internship: 'Magang',
    freelance: 'Freelance',
  };

  return generateFlexibleNik({
    pattern,
    employmentType: typeLabelMap[typeKey],
    entityCode,
    departmentCode: 'ENG',
    counter,
    digitPadding,
    date: new Date(),
  });
}

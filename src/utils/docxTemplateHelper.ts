import mammoth from 'mammoth';
import { Employee, Tenant } from '../types/hrms';
import { formatRupiah, getTERCategory } from './taxCalculator';

export interface ParsedDocxResult {
  html: string;
  rawText: string;
  placeholders: string[];
  fileName: string;
  fileSize: string;
}

export const KNOWN_VARIABLE_DESCRIPTIONS: Record<string, { label: string; example: string }> = {
  nama: { label: 'Nama Lengkap Karyawan', example: 'Raditya Pratama, S.T.' },
  nik: { label: 'Nomor Induk Karyawan', example: 'NTM-2024-001' },
  nik_ktp: { label: 'Nomor KTP (16 Digit)', example: '3174081205930002' },
  no_kk: { label: 'Nomor Kartu Keluarga', example: '3174080101150006' },
  jabatan: { label: 'Jabatan / Posisi Kerja', example: 'Lead Cloud Architect' },
  departemen: { label: 'Departemen / Divisi', example: 'Engineering & Technology' },
  grade: { label: 'Grade Golongan', example: 'L3' },
  gaji_pokok: { label: 'Gaji Pokok Bulanan (IDR)', example: 'Rp 15.000.000' },
  gaji_terbilang: { label: 'Gaji Terbilang Rupiah', example: 'Lima Belas Juta Rupiah' },
  status_kerja: { label: 'Status Ketenagakerjaan', example: 'Tetap (PKWTT) / Kontrak (PKWT)' },
  tanggal_mulai: { label: 'Tanggal Mulai Bertugas', example: '01 Januari 2026' },
  tanggal_berakhir: { label: 'Tanggal Berakhir Kontrak', example: '31 Desember 2026' },
  alamat_karyawan: { label: 'Alamat Domisili Karyawan', example: 'Jl. Sudirman No. 10, Jakarta' },
  ptkp: { label: 'Status Pajak PTKP & TER', example: 'TK/0 (TER Kategori A)' },
  npwp: { label: 'NPWP Karyawan', example: '12.345.678.9-012.000' },
  nomor_surat: { label: 'Nomor Surat Keputusan Resmi', example: '042/HRD-PKWT/NTM/X/2026' },
  nama_perusahaan: { label: 'Nama Perusahaan / Tenant', example: 'PT Nusantara Teknologi Mandiri' },
  alamat_perusahaan: { label: 'Alamat Kantor Perusahaan', example: 'Menara Palma Lt. 18, Jakarta Selatan' },
  telepon_perusahaan: { label: 'Telepon Perusahaan', example: '+62 21 5566 7788' },
  email_perusahaan: { label: 'Email Resmi Legal Perusahaan', example: 'legal.hr@nusantara.id' },
  penandatangan: { label: 'Nama Pejabat Penanda Tangan', example: 'Aditya Pratama, S.Psi' },
  jabatan_penandatangan: { label: 'Jabatan Penanda Tangan', example: 'VP of Human Capital' },
  tanggal_terbit: { label: 'Tanggal Surat Diterbitkan', example: '22 Oktober 2026' },
  qr_code: { label: 'Stempel Tanda Tangan QR Digital UU ITE', example: '[QR Code Verifikasi]' },
};

/**
 * Format bytes into human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Parses a .docx File object in the browser using mammoth
 */
export const parseDocxFile = async (file: File): Promise<ParsedDocxResult> => {
  const arrayBuffer = await file.arrayBuffer();

  // Convert to HTML
  const htmlResult = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1.text-lg.font-bold.text-slate-900.mb-2",
        "p[style-name='Heading 2'] => h2.text-base.font-bold.text-slate-800.mb-1.5",
        "p[style-name='Heading 3'] => h3.text-sm.font-semibold.text-slate-800.mb-1",
      ],
    }
  );

  // Extract raw text for clean processing and variable analysis
  const textResult = await mammoth.extractRawText({ arrayBuffer });

  const rawHtml = htmlResult.value || '';
  const rawText = textResult.value || '';

  // Extract all placeholders matching {{variable}} or {VARIABLE}
  const placeholderSet = new Set<string>();

  // Match {{var_name}}
  const doubleBraceRegex = /\{\{([a-zA-Z0-9_\-\s]+)\}\}/g;
  let match;
  while ((match = doubleBraceRegex.exec(rawText)) !== null) {
    placeholderSet.add(match[1].trim().toLowerCase());
  }

  // Match {VARIABLE}
  const singleBraceRegex = /\{([A-Z0-9_]+)\}/g;
  while ((match = singleBraceRegex.exec(rawText)) !== null) {
    placeholderSet.add(match[1].trim().toLowerCase());
  }

  return {
    html: rawHtml,
    rawText,
    placeholders: Array.from(placeholderSet),
    fileName: file.name,
    fileSize: formatFileSize(file.size),
  };
};

/**
 * Helper to convert number to Indonesian words (terbilang)
 */
export const angkaKeTerbilang = (angka: number): string => {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  if (angka < 12) return bilangan[angka];
  if (angka < 20) return `${angkaKeTerbilang(angka - 10)} Belas`;
  if (angka < 100) return `${angkaKeTerbilang(Math.floor(angka / 10))} Puluh ${bilangan[angka % 10]}`.trim();
  if (angka < 200) return `Seratus ${angkaKeTerbilang(angka - 100)}`.trim();
  if (angka < 1000) return `${angkaKeTerbilang(Math.floor(angka / 100))} Ratus ${angkaKeTerbilang(angka % 100)}`.trim();
  if (angka < 2000) return `Seribu ${angkaKeTerbilang(angka - 1000)}`.trim();
  if (angka < 1000000) return `${angkaKeTerbilang(Math.floor(angka / 1000))} Ribu ${angkaKeTerbilang(angka % 1000)}`.trim();
  if (angka < 1000000000) return `${angkaKeTerbilang(Math.floor(angka / 1000000))} Juta ${angkaKeTerbilang(angka % 1000000)}`.trim();
  if (angka < 1000000000000) return `${angkaKeTerbilang(Math.floor(angka / 1000000000))} Miliar ${angkaKeTerbilang(angka % 1000000000)}`.trim();
  return `${angka}`;
};

export interface NumberingTokenInfo {
  token: string;
  category: 'Waktu & Kalender' | 'Nomor & Urutan' | 'Organisasi & Entitas' | 'Klasifikasi Dokumen';
  label: string;
  description: string;
  example: string;
}

export const NUMBERING_TOKEN_REGISTRY: NumberingTokenInfo[] = [
  {
    token: '{ROMAN_MONTH}',
    category: 'Waktu & Kalender',
    label: 'Bulan Romawi',
    description: 'Format baku penomoran surat resmi Indonesia (I s/d XII)',
    example: 'X',
  },
  {
    token: '{MONTH}',
    category: 'Waktu & Kalender',
    label: 'Bulan Angka (2 Digit)',
    description: 'Bulan berjalan dengan awalan nol (01 - 12)',
    example: '10',
  },
  {
    token: '{MONTH_NAME}',
    category: 'Waktu & Kalender',
    label: 'Nama Bulan',
    description: 'Nama bulan penuh dalam bahasa Indonesia (Januari - Desember)',
    example: 'Oktober',
  },
  {
    token: '{YEAR}',
    category: 'Waktu & Kalender',
    label: 'Tahun Penuh (4 Digit)',
    description: 'Tahun kalender 4 digit penuh',
    example: '2026',
  },
  {
    token: '{YEAR_2}',
    category: 'Waktu & Kalender',
    label: 'Tahun 2 Digit (YY)',
    description: 'Dua digit akhir dari tahun penerbitan',
    example: '26',
  },
  {
    token: '{DAY}',
    category: 'Waktu & Kalender',
    label: 'Hari / Tanggal (2 Digit)',
    description: 'Tanggal hari penerbitan dengan awalan nol (01 - 31)',
    example: '23',
  },
  {
    token: '{QUARTER}',
    category: 'Waktu & Kalender',
    label: 'Kuartal Kalender',
    description: 'Kuartal tahun berjalan (Q1, Q2, Q3, Q4)',
    example: 'Q4',
  },
  {
    token: '{SEQ}',
    category: 'Nomor & Urutan',
    label: 'Nomor Urut 3 Digit (Sequence)',
    description: 'Nomor urut otomatis 3 digit (001, 002, 042, dst)',
    example: '001',
  },
  {
    token: '{SEQ:4}',
    category: 'Nomor & Urutan',
    label: 'Nomor Urut 4 Digit (Sequence)',
    description: 'Nomor urut otomatis 4 digit (0001, 0042, dst)',
    example: '0001',
  },
  {
    token: '{TENANT_CODE}',
    category: 'Organisasi & Entitas',
    label: 'Kode Singkatan Tenant / Perusahaan',
    description: 'Kode entitas perusahaan dari konfigurasi multi-tenant',
    example: 'NTM',
  },
  {
    token: '{COMPANY_NAME}',
    category: 'Organisasi & Entitas',
    label: 'Nama Perusahaan',
    description: 'Nama lengkap perusahaan / tenant aktif',
    example: 'PT Nusantara Jaya',
  },
  {
    token: '{DEPT_CODE}',
    category: 'Organisasi & Entitas',
    label: 'Kode Departemen / Divisi',
    description: 'Kode divisi penerbit (HRD, HC, GA, FIN, LEGAL)',
    example: 'HRD',
  },
  {
    token: '{DOC_TYPE}',
    category: 'Klasifikasi Dokumen',
    label: 'Kode Singkatan Jenis Dokumen',
    description: 'Singkatan tipe surat resmi (PKWT, PKWTT, SP, SK, BAST)',
    example: 'PKWT',
  },
];

/**
 * Generate Roman Numeral for Month
 */
export const getRomanMonth = (monthIndex: number): string => {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romans[monthIndex] || 'X';
};

/**
 * Evaluates document numbering formula
 */
export const evaluateNumberingFormula = (
  formula: string,
  seq: number,
  tenantCode: string,
  date: Date = new Date(),
  extraOptions?: {
    deptCode?: string;
    docType?: string;
    companyName?: string;
  }
): string => {
  const year = date.getFullYear().toString();
  const year2 = year.slice(-2);
  const monthIdx = date.getMonth();
  const monthNum = String(monthIdx + 1).padStart(2, '0');
  const dayNum = String(date.getDate()).padStart(2, '0');
  const romanMonth = getRomanMonth(monthIdx);
  const seq3 = String(seq).padStart(3, '0');
  const seq4 = String(seq).padStart(4, '0');

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = monthNames[monthIdx] || 'Januari';
  const quarter = `Q${Math.floor(monthIdx / 3) + 1}`;

  const deptCode = extraOptions?.deptCode || 'HRD';
  const docType = extraOptions?.docType || 'SK';
  const companyName = extraOptions?.companyName || tenantCode;

  return formula
    .replace(/\{SEQ:4\}/g, seq4)
    .replace(/\{SEQ\}/g, seq3)
    .replace(/\{TENANT_CODE\}/g, tenantCode)
    .replace(/\{TENANT\}/g, tenantCode)
    .replace(/\{ROMAN_MONTH\}/g, romanMonth)
    .replace(/\{MONTH_NAME\}/g, monthName)
    .replace(/\{MONTH\}/g, monthNum)
    .replace(/\{YEAR_2\}/g, year2)
    .replace(/\{YY\}/g, year2)
    .replace(/\{YEAR\}/g, year)
    .replace(/\{DAY\}/g, dayNum)
    .replace(/\{QUARTER\}/g, quarter)
    .replace(/\{DEPT_CODE\}/g, deptCode)
    .replace(/\{DEPT\}/g, deptCode)
    .replace(/\{DOC_TYPE\}/g, docType)
    .replace(/\{TYPE\}/g, docType)
    .replace(/\{COMPANY_NAME\}/g, companyName);
};

/**
 * Replaces all placeholders in template content with real employee & company data
 */
export const interpolateDocxTemplate = (
  content: string,
  context: {
    employee: Employee;
    tenant: Tenant;
    documentNumber: string;
    signeeName: string;
    signeeRole: string;
    issueDate?: string;
  }
): string => {
  const { employee, tenant, documentNumber, signeeName, signeeRole } = context;

  const dateObj = context.issueDate ? new Date(context.issueDate) : new Date();
  const dateFormatted = dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const salaryNum = employee.basicSalary || 0;
  const salaryRupiah = formatRupiah(salaryNum);
  const salaryWords = `${angkaKeTerbilang(salaryNum)} Rupiah`;

  const map: Record<string, string> = {
    // Employee
    nama: employee.fullName,
    nama_karyawan: employee.fullName,
    karyawan: employee.fullName,
    nik: employee.nik,
    nik_karyawan: employee.nik,
    nik_ktp: employee.nikKtp,
    ktp: employee.nikKtp,
    no_kk: employee.noKk || '-',
    jabatan: employee.position,
    posisi: employee.position,
    departemen: employee.department,
    divisi: employee.department,
    grade: employee.grade || 'L3',
    gaji_pokok: salaryRupiah,
    gaji: salaryRupiah,
    gaji_terbilang: salaryWords,
    status_kerja: employee.employmentType,
    tipe_kontrak: employee.employmentType,
    tanggal_mulai: employee.contractStartDate || employee.joinDate,
    tgl_mulai: employee.contractStartDate || employee.joinDate,
    tanggal_berakhir: employee.contractEndDate || 'Sampai Penetapan Selanjutnya',
    tgl_berakhir: employee.contractEndDate || 'Sampai Penetapan Selanjutnya',
    alamat_karyawan: employee.ktpAddress || employee.currentAddress || 'DKI Jakarta',
    ptkp: `${employee.ptkp} (${getTERCategory(employee.ptkp)})`,
    npwp: employee.npwp || '00.000.000.0-000.000',
    rekening: `${employee.bankName} - ${employee.bankAccount}`,

    // Company & Document
    nomor_surat: documentNumber,
    nomor_dokumen: documentNumber,
    nama_perusahaan: tenant.name,
    perusahaan: tenant.name,
    alamat_perusahaan: tenant.address || 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan',
    telepon_perusahaan: '+62 21 5566 7788',
    email_perusahaan: 'legal.hr@nusantara.id',
    npwp_perusahaan: tenant.npwp || '01.999.888.7-011.000',

    // Signee
    penandatangan: signeeName,
    nama_pejabat: signeeName,
    pejabat: signeeName,
    jabatan_penandatangan: signeeRole,
    peran_penandatangan: signeeRole,

    // Date
    tanggal_terbit: dateFormatted,
    tanggal: dateFormatted,
  };

  let interpolated = content;

  // Replace {{var}} (case insensitive)
  for (const [key, val] of Object.entries(map)) {
    const doubleRegex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    interpolated = interpolated.replace(doubleRegex, val);

    const singleRegex = new RegExp(`\\{\\s*${key.toUpperCase()}\\s*\\}`, 'g');
    interpolated = interpolated.replace(singleRegex, val);
  }

  return interpolated;
};

/**
 * Pre-packaged Sample Indonesian Legal DOCX Templates that can be loaded instantly
 */
export const SAMPLE_DOCX_PRESETS = [
  {
    id: 'sample-pkwt-pp35',
    title: 'Perjanjian Kerja Waktu Tertentu (PKWT) Standar PP 35/2021',
    fileName: 'Template_PKWT_Standard_PP35_2021.docx',
    fileSize: '32.4 KB',
    type: 'PKWT',
    numberingPattern: '{SEQ}/HRD-PKWT/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    letterHeadNpwp: '01.999.888.7-011.000',
    letterHeadPhone: '+62 21 5566 7788',
    letterHeadEmail: 'legal.hr@nusantara.id',
    kopPosition: 'top' as const,
    qrPosition: 'bottom-right' as const,
    rawText: `PERJANJIAN KERJA WAKTU TERTENTU (PKWT)
Nomor: {{nomor_surat}}

Pada hari ini, tanggal {{tanggal_terbit}}, bertempat di Jakarta, telah dibuat dan ditandatangani Perjanjian Kerja Waktu Tertentu (PKWT) oleh dan antara:

I. PIHAK PERTAMA (PENGUSAHA):
Nama Badan Usaha: {{nama_perusahaan}}
Alamat Kantor: {{alamat_perusahaan}}
NPWP: {{npwp_perusahaan}}
Dalam hal ini diwakili oleh {{penandatangan}}, bertindak dalam kedudukannya selaku {{jabatan_penandatangan}} dari dan oleh karenanya sah mewakili Perusahaan.

II. PIHAK KEDUA (PEKERJA):
Nama Lengkap: {{nama}}
Nomor Induk Kependudukan (KTP): {{nik_ktp}}
Nomor Induk Karyawan (NIK): {{nik}}
Alamat Sesuai KTP: {{alamat_karyawan}}
Status Pajak PTKP: {{ptkp}}

Kedua belah pihak telah sepakat mengikatkan diri dalam Perjanjian Kerja Waktu Tertentu dengan ketentuan sebagai berikut:

PASAL 1: JABATAN & LINGKUP PEKERJAAN
1. Pihak Pertama mempekerjakan Pihak Kedua sebagai {{jabatan}} pada unit/departemen {{departemen}} (Grade: {{grade}}).
2. Pihak Kedua bersedia menjalankan tugas, tanggung jawab, dan mematuhi seluruh Standard Operating Procedure (SOP) yang berlaku di Perusahaan.

PASAL 2: JANGKA WAKTU PERJANJIAN
1. Perjanjian kerja ini berlaku untuk jangka waktu tertentu, dimulai sejak tanggal {{tanggal_mulai}} sampai dengan tanggal {{tanggal_berakhir}}.
2. Perjanjian ini tunduk pada ketentuan Pasal 51-61 Undang-Undang Ketenagakerjaan jo Peraturan Pemerintah No. 35 Tahun 2021.

PASAL 3: UPAH & REMUNERASI
1. Pihak Pertama memberikan imbalan upah pokok kepada Pihak Kedua sebesar {{gaji_pokok}} ({{gaji_terbilang}}) per bulan.
2. Pembayaran upah dilakukan setiap tanggal 25 bulan berjalan melalui transfer ke rekening bank terdaftar ({{rekening}}).
3. Pihak Pertama mengikutsertakan Pihak Kedua dalam program jaminan sosial BPJS Ketenagakerjaan dan BPJS Kesehatan sesuai tarif statutory.

PASAL 4: KOMPENSASI AKHIR KONTRAK
Sesuai Pasal 61A PP 35/2021, Pihak Pertama wajib memberikan uang kompensasi kepada Pihak Kedua saat berakhirnya jangka waktu PKWT yang dihitung secara prorata masa kerja.

PASAL 5: PENGESAHAN DOKUMEN ELEKTRONIK
Perjanjian ini dibuat dan ditandatangani secara elektronik dengan stempel QR Hash Verification terenkripsi yang memiliki kekuatan pembuktian hukum sah menurut UU ITE No. 11/2008.`,
  },
  {
    id: 'sample-sk-tetap',
    title: 'Surat Keputusan Pengangkatan Karyawan Tetap (PKWTT)',
    fileName: 'Template_SK_Pengangkatan_Tetap_PKWTT.docx',
    fileSize: '28.1 KB',
    type: 'PKWTT',
    numberingPattern: '{SEQ}/HRD-SK-TETAP/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    letterHeadNpwp: '01.999.888.7-011.000',
    letterHeadPhone: '+62 21 5566 7788',
    letterHeadEmail: 'legal.hr@nusantara.id',
    kopPosition: 'top' as const,
    qrPosition: 'bottom-right' as const,
    rawText: `SURAT KEPUTUSAN DIREKSI
TENTANG PENGANGKATAN KARYAWAN TETAP (PKWTT)
Nomor: {{nomor_surat}}

MENIMBANG:
a. Bahwa Saudara/i {{nama}} (NIK: {{nik}}) telah menyelesaikan masa percobaan (probation) dan menunjukkan performa kerja serta integritas yang memenuhi standar evaluasi Perusahaan.
b. Bahwa untuk mendukung kesinambungan operasional divisi {{departemen}}, dipandang perlu menetapkan status kepegawaian yang bersangkutan menjadi Karyawan Tetap.

MENGINGAT:
1. Undang-Undang Ketenagakerjaan No. 13 Tahun 2003 jo UU No. 6 Tahun 2023.
2. Peraturan Perusahaan {{nama_perusahaan}} Bab Kepegawaian & Pengangkatan.

MEMUTUSKAN
MENETAPKAN:
PERTAMA: Mengangkat Saudara/i {{nama}} (NIK KTP: {{nik_ktp}}) menjadi KARYAWAN TETAP (PKWTT) pada {{nama_perusahaan}}.
KEDUA: Menempatkan yang bersangkutan pada posisi {{jabatan}}, Departemen {{departemen}}, dengan jenjang Grade {{grade}}.
KETIGA: Terhitung sejak tanggal {{tanggal_mulai}}, yang bersangkutan berhak atas upah pokok sebesar {{gaji_pokok}} ({{gaji_terbilang}}) per bulan serta hak cuti tahunan penuh dan benefit asuransi kesehatan keluarga.
KEEMPAT: Surat Keputusan ini berlaku mengikat kedua belah pihak sejak tanggal ditetapkan.

Ditetapkan di: Jakarta
Pada tanggal: {{tanggal_terbit}}

{{nama_perusahaan}}`,
  },
  {
    id: 'sample-parklaring',
    title: 'Surat Keterangan Pengalaman Kerja (Parklaring)',
    fileName: 'Template_Surat_Pengalaman_Kerja_Parklaring.docx',
    fileSize: '24.6 KB',
    type: 'Parklaring',
    numberingPattern: '{SEQ}/HRD-PARKLARING/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    letterHeadNpwp: '01.999.888.7-011.000',
    letterHeadPhone: '+62 21 5566 7788',
    letterHeadEmail: 'legal.hr@nusantara.id',
    kopPosition: 'top' as const,
    qrPosition: 'bottom-right' as const,
    rawText: `SURAT KETERANGAN PENGALAMAN KERJA (PARKLARING)
Nomor: {{nomor_surat}}

Yang bertanda tangan di bawah ini:
Nama: {{penandatangan}}
Jabatan: {{jabatan_penandatangan}}
Perusahaan: {{nama_perusahaan}}
Alamat: {{alamat_perusahaan}}

Dengan ini menerangkan dengan sebenarnya bahwa:
Nama Lengkap: {{nama}}
Nomor Induk Karyawan: {{nik}}
Nomor KTP: {{nik_ktp}}
Departemen: {{departemen}}
Jabatan Terakhir: {{jabatan}}

Benar telah bekerja di {{nama_perusahaan}} terhitung sejak tanggal {{tanggal_mulai}} sampai dengan tanggal {{tanggal_berakhir}}.

Selama masa kerjanya, Saudara/i {{nama}} telah menunjukkan dedikasi, loyalitas, dan tanggung jawab yang sangat baik terhadap seluruh penugasan perusahaan. Hubungan kerja berakhir dengan baik atas dasar kepatuhan regulasi ketenagakerjaan.

Demikian Surat Keterangan Pengalaman Kerja ini diterbitkan dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.

Jakarta, {{tanggal_terbit}}
{{nama_perusahaan}}`,
  },
  {
    id: 'sample-sp-disiplin',
    title: 'Surat Peringatan Kedisiplinan Kerja (SP Kepatuhan)',
    fileName: 'Template_Surat_Peringatan_Kedisiplinan_SP.docx',
    fileSize: '26.8 KB',
    type: 'Surat Peringatan',
    numberingPattern: '{SEQ}/HRD-SP/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    letterHeadNpwp: '01.999.888.7-011.000',
    letterHeadPhone: '+62 21 5566 7788',
    letterHeadEmail: 'legal.hr@nusantara.id',
    kopPosition: 'top' as const,
    qrPosition: 'bottom-right' as const,
    rawText: `SURAT PERINGATAN KEDISIPLINAN KERJA (SP)
Nomor: {{nomor_surat}}

Surat Peringatan ini diberikan kepada:
Nama: {{nama}}
NIK: {{nik}}
Jabatan: {{jabatan}}
Departemen: {{departemen}}

Berdasarkan hasil pemeriksaan kehadiran dan evaluasi kedisiplinan kerja, dengan ini Manajemen {{nama_perusahaan}} menerbitkan Surat Peringatan atas pelanggaran ketentuan tata tertib Peraturan Perusahaan.

DASAR PENERBITAN & KETENTUAN HUKUM:
1. Pasal 161 UU No. 13 Tahun 2003 jo Peraturan Pemerintah No. 35 Tahun 2021.
2. Peraturan Perusahaan Bab Pembinaan & Sanksi Disiplin Karyawan.

MASA BERLAKU SANKSI:
Surat Peringatan ini memiliki masa berlaku selama 6 (enam) bulan terhitung sejak tanggal diterbitkan ({{tanggal_terbit}}). Apabila dalam kurun waktu tersebut karyawan kembali melakukan pelanggaran disiplin, maka perusahaan berhak menaikkan tingkat sanksi ke jenjang berikutnya sesuai regulasi.

Diharapkan Saudara/i {{nama}} dapat segera memperbaiki kinerja dan mematuhi seluruh norma kedisiplinan perusahaan.

Diterbitkan di: Jakarta
Tanggal: {{tanggal_terbit}}

Manajemen {{nama_perusahaan}}`,
  },
  {
    id: 'sample-bast-aset',
    title: 'Berita Acara Serah Terima Aset & Inventaris (BAST)',
    fileName: 'Template_BAST_Serah_Terima_Aset.docx',
    fileSize: '29.3 KB',
    type: 'BAST Aset',
    numberingPattern: '{SEQ}/BAST-GA/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    letterHeadNpwp: '01.999.888.7-011.000',
    letterHeadPhone: '+62 21 5566 7788',
    letterHeadEmail: 'legal.hr@nusantara.id',
    kopPosition: 'top' as const,
    qrPosition: 'bottom-right' as const,
    rawText: `BERITA ACARA SERAH TERIMA (BAST) FASILITAS & ASET KERJA
Nomor: {{nomor_surat}}

Pada hari ini, {{tanggal_terbit}}, telah dilakukan serah terima fasilitas operasional kerja antara:

PIHAK I (YANG MENYERAHKAN):
Nama: {{penandatangan}}
Jabatan: General Affairs & Asset Management
Perusahaan: {{nama_perusahaan}}

PIHAK II (YANG MENERIMA):
Nama Karyawan: {{nama}}
NIK: {{nik}}
Jabatan: {{jabatan}}
Departemen: {{departemen}}

Dengan ini Pihak I menyerahkan perangkat kerja perusahaan kepada Pihak II untuk dipergunakan sebagai sarana penunjang tugas resmi. Pihak II bertanggung jawab penuh atas pemeliharaan dan keamanan aset tersebut.

Demikian Berita Acara Serah Terima ini dibuat dengan sebenar-benarnya dalam rangkap elektronik ber-QR Code untuk dipergunakan sebagaimana mestinya.

Jakarta, {{tanggal_terbit}}`,
  },
];

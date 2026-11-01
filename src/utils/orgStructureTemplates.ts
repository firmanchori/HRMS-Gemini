/**
 * Built-in starter templates for a brand-new entity's divisions/departments/
 * master jabatan/grade gaji — so setting up a new company doesn't always
 * start from a completely blank slate. Codes here are only used to wire
 * department->division and position->division/department references
 * together while applying the template; they aren't shown to the user.
 */
export interface OrgStructureTemplate {
  key: string;
  label: string;
  /** Broad sector this template fits — shown as a filter/badge in the picker. */
  industry: 'Teknologi / IT' | 'Retail' | 'Manufaktur' | 'Jasa Umum' | 'F&B / Restoran' | 'Konstruksi & Properti' | 'Kesehatan' | 'Jasa Keuangan' | 'Pendidikan' | 'Logistik & Transportasi';
  /** Company maturity this shape fits best. */
  stage: 'Rintisan (Startup)' | 'Berkembang' | 'Matang (Sustain)';
  description: string;
  divisions: { code: string; name: string; headTitle?: string }[];
  departments: { divisionCode: string; code: string; name: string }[];
  positions: { code: string; title: string; defaultLevel: number; divisionCode?: string; departmentCode?: string }[];
  grades: { gradeCode: string; gradeName: string; minSalary?: number; midSalary?: number; maxSalary?: number }[];
}

export const ORG_STRUCTURE_TEMPLATES: OrgStructureTemplate[] = [
  {
    key: 'it-startup',
    label: 'IT Startup (Rintisan)',
    industry: 'Teknologi / IT',
    stage: 'Rintisan (Startup)',
    description: 'Struktur ramping untuk startup teknologi baru: Product & Engineering jadi satu, Growth (marketing+sales), tanpa banyak jenjang.',
    divisions: [
      { code: 'PRODENG', name: 'Product & Engineering', headTitle: 'Head of Product & Engineering' },
      { code: 'GROWTH', name: 'Growth', headTitle: 'Head of Growth' },
    ],
    departments: [],
    positions: [
      { code: 'CEO', title: 'Chief Executive Officer', defaultLevel: 1 },
      { code: 'CTO', title: 'Chief Technology Officer', defaultLevel: 1, divisionCode: 'PRODENG' },
      { code: 'ENG', title: 'Software Engineer', defaultLevel: 4, divisionCode: 'PRODENG' },
      { code: 'PRODMGR', title: 'Product Manager', defaultLevel: 3, divisionCode: 'PRODENG' },
      { code: 'GROWTHLEAD', title: 'Growth Lead', defaultLevel: 2, divisionCode: 'GROWTH' },
      { code: 'GROWTHSTAFF', title: 'Growth Associate', defaultLevel: 5, divisionCode: 'GROWTH' },
    ],
    grades: [
      { gradeCode: 'G1', gradeName: 'Founder/C-Level', minSalary: 15_000_000, midSalary: 20_000_000, maxSalary: 30_000_000 },
      { gradeCode: 'G3', gradeName: 'Lead/Senior', minSalary: 10_000_000, midSalary: 13_000_000, maxSalary: 16_000_000 },
      { gradeCode: 'G5', gradeName: 'Staff/Associate', minSalary: 6_000_000, midSalary: 7_500_000, maxSalary: 9_000_000 },
    ],
  },
  {
    key: 'it-enterprise',
    label: 'IT Enterprise (Sustain)',
    industry: 'Teknologi / IT',
    stage: 'Matang (Sustain)',
    description: 'Struktur lengkap untuk perusahaan teknologi yang sudah mapan: Engineering, Product, Sales, Customer Success, dan fungsi pendukung terpisah.',
    divisions: [
      { code: 'ENG', name: 'Engineering', headTitle: 'VP of Engineering' },
      { code: 'PRODUCT', name: 'Product', headTitle: 'VP of Product' },
      { code: 'SALES', name: 'Sales & Partnership', headTitle: 'VP of Sales' },
      { code: 'CS', name: 'Customer Success', headTitle: 'Head of Customer Success' },
      { code: 'CORP', name: 'Corporate Services (HR & Finance)', headTitle: 'Head of Corporate Services' },
    ],
    departments: [
      { divisionCode: 'ENG', code: 'BACKEND', name: 'Backend Engineering' },
      { divisionCode: 'ENG', code: 'FRONTEND', name: 'Frontend Engineering' },
      { divisionCode: 'ENG', code: 'INFRA', name: 'Infrastructure & DevOps' },
      { divisionCode: 'CORP', code: 'HR', name: 'Human Resources' },
      { divisionCode: 'CORP', code: 'FIN', name: 'Finance & Accounting' },
    ],
    positions: [
      { code: 'CEO', title: 'Chief Executive Officer', defaultLevel: 1 },
      { code: 'VPENG', title: 'VP of Engineering', defaultLevel: 1, divisionCode: 'ENG' },
      { code: 'ENGMGR', title: 'Engineering Manager', defaultLevel: 2, divisionCode: 'ENG', departmentCode: 'BACKEND' },
      { code: 'SENGR', title: 'Senior Software Engineer', defaultLevel: 3, divisionCode: 'ENG', departmentCode: 'BACKEND' },
      { code: 'VPPROD', title: 'VP of Product', defaultLevel: 1, divisionCode: 'PRODUCT' },
      { code: 'VPSALES', title: 'VP of Sales', defaultLevel: 1, divisionCode: 'SALES' },
      { code: 'AE', title: 'Account Executive', defaultLevel: 3, divisionCode: 'SALES' },
      { code: 'CSMGR', title: 'Customer Success Manager', defaultLevel: 2, divisionCode: 'CS' },
      { code: 'HRM', title: 'HR Manager', defaultLevel: 2, divisionCode: 'CORP', departmentCode: 'HR' },
      { code: 'FINM', title: 'Finance Manager', defaultLevel: 2, divisionCode: 'CORP', departmentCode: 'FIN' },
    ],
    grades: [
      { gradeCode: 'G1', gradeName: 'C-Level/VP', minSalary: 35_000_000, midSalary: 45_000_000, maxSalary: 60_000_000 },
      { gradeCode: 'G2', gradeName: 'Manager/Lead', minSalary: 18_000_000, midSalary: 22_000_000, maxSalary: 28_000_000 },
      { gradeCode: 'G3', gradeName: 'Senior', minSalary: 12_000_000, midSalary: 15_000_000, maxSalary: 18_000_000 },
      { gradeCode: 'G5', gradeName: 'Staff', minSalary: 6_500_000, midSalary: 8_000_000, maxSalary: 10_000_000 },
    ],
  },
  {
    key: 'standard',
    label: 'Standar Operasional',
    industry: 'Jasa Umum',
    stage: 'Berkembang',
    description: 'Divisi HR, Finance & Accounting, Operations — cocok untuk kantor pusat/holding dengan fungsi pendukung umum, lintas industri.',
    divisions: [
      { code: 'HR', name: 'Human Resources', headTitle: 'HR Director' },
      { code: 'FIN', name: 'Finance & Accounting', headTitle: 'Finance Director' },
      { code: 'OPS', name: 'Operations', headTitle: 'Operations Director' },
    ],
    departments: [
      { divisionCode: 'HR', code: 'RECRUIT', name: 'Recruitment' },
      { divisionCode: 'HR', code: 'PEOPLEDEV', name: 'People Development' },
      { divisionCode: 'FIN', code: 'ACCTG', name: 'Accounting' },
    ],
    positions: [
      { code: 'CEO', title: 'Chief Executive Officer', defaultLevel: 1 },
      { code: 'HRD', title: 'HR Director', defaultLevel: 1, divisionCode: 'HR' },
      { code: 'HRM', title: 'HR Manager', defaultLevel: 2, divisionCode: 'HR', departmentCode: 'RECRUIT' },
      { code: 'HRS', title: 'HR Staff', defaultLevel: 5, divisionCode: 'HR', departmentCode: 'RECRUIT' },
      { code: 'FIND', title: 'Finance Director', defaultLevel: 1, divisionCode: 'FIN' },
      { code: 'ACCS', title: 'Accounting Staff', defaultLevel: 5, divisionCode: 'FIN', departmentCode: 'ACCTG' },
      { code: 'OPSD', title: 'Operations Director', defaultLevel: 1, divisionCode: 'OPS' },
    ],
    grades: [
      { gradeCode: 'G1', gradeName: 'Direksi', minSalary: 25_000_000, midSalary: 32_000_000, maxSalary: 40_000_000 },
      { gradeCode: 'G2', gradeName: 'Manager', minSalary: 12_000_000, midSalary: 15_000_000, maxSalary: 18_000_000 },
      { gradeCode: 'G5', gradeName: 'Staff', minSalary: 5_000_000, midSalary: 6_500_000, maxSalary: 8_000_000 },
    ],
  },
  {
    key: 'retail',
    label: 'Retail / Toko',
    industry: 'Retail',
    stage: 'Berkembang',
    description: 'Divisi Sales, Store Operations, dan Support — cocok untuk entitas yang menjalankan jaringan toko/cabang ritel.',
    divisions: [
      { code: 'SALES', name: 'Sales', headTitle: 'Sales Director' },
      { code: 'STORE', name: 'Store Operations', headTitle: 'Store Operations Manager' },
      { code: 'SUPPORT', name: 'Support', headTitle: 'Support Manager' },
    ],
    departments: [
      { divisionCode: 'STORE', code: 'INVENTORY', name: 'Inventory & Gudang' },
      { divisionCode: 'SUPPORT', code: 'FINANCE', name: 'Finance' },
    ],
    positions: [
      { code: 'SALESD', title: 'Sales Director', defaultLevel: 1, divisionCode: 'SALES' },
      { code: 'STOREMGR', title: 'Store Manager', defaultLevel: 2, divisionCode: 'STORE' },
      { code: 'CASHIER', title: 'Kasir', defaultLevel: 5, divisionCode: 'STORE' },
      { code: 'SPG', title: 'Sales Promotion', defaultLevel: 5, divisionCode: 'SALES' },
      { code: 'WHSTAFF', title: 'Staff Gudang', defaultLevel: 5, divisionCode: 'STORE', departmentCode: 'INVENTORY' },
    ],
    grades: [
      { gradeCode: 'G2', gradeName: 'Manager', minSalary: 10_000_000, midSalary: 12_500_000, maxSalary: 15_000_000 },
      { gradeCode: 'G5', gradeName: 'Staff Toko', minSalary: 3_500_000, midSalary: 4_200_000, maxSalary: 5_000_000 },
    ],
  },
  {
    key: 'manufacturing',
    label: 'Manufaktur / Pabrik',
    industry: 'Manufaktur',
    stage: 'Matang (Sustain)',
    description: 'Divisi Produksi, Quality Assurance, Supply Chain, dan fungsi pendukung — cocok untuk entitas pabrik/manufaktur yang sudah mapan.',
    divisions: [
      { code: 'PROD', name: 'Produksi', headTitle: 'Plant Manager' },
      { code: 'QA', name: 'Quality Assurance', headTitle: 'QA Manager' },
      { code: 'SCM', name: 'Supply Chain & Gudang', headTitle: 'Supply Chain Manager' },
      { code: 'CORP', name: 'HR & Finance', headTitle: 'Head of Corporate' },
    ],
    departments: [
      { divisionCode: 'PROD', code: 'LINE1', name: 'Lini Produksi 1' },
      { divisionCode: 'SCM', code: 'WAREHOUSE', name: 'Gudang' },
      { divisionCode: 'CORP', code: 'HR', name: 'Human Resources' },
    ],
    positions: [
      { code: 'PLANTMGR', title: 'Plant Manager', defaultLevel: 1, divisionCode: 'PROD' },
      { code: 'LINESPV', title: 'Supervisor Produksi', defaultLevel: 3, divisionCode: 'PROD', departmentCode: 'LINE1' },
      { code: 'OPERATOR', title: 'Operator Produksi', defaultLevel: 5, divisionCode: 'PROD', departmentCode: 'LINE1' },
      { code: 'QAMGR', title: 'QA Manager', defaultLevel: 2, divisionCode: 'QA' },
      { code: 'SCMMGR', title: 'Supply Chain Manager', defaultLevel: 2, divisionCode: 'SCM' },
      { code: 'WHSTAFF', title: 'Staff Gudang', defaultLevel: 5, divisionCode: 'SCM', departmentCode: 'WAREHOUSE' },
      { code: 'HRM', title: 'HR Manager', defaultLevel: 2, divisionCode: 'CORP', departmentCode: 'HR' },
    ],
    grades: [
      { gradeCode: 'G1', gradeName: 'Manager/Plant Head', minSalary: 15_000_000, midSalary: 18_000_000, maxSalary: 22_000_000 },
      { gradeCode: 'G3', gradeName: 'Supervisor', minSalary: 7_000_000, midSalary: 8_500_000, maxSalary: 10_000_000 },
      { gradeCode: 'G5', gradeName: 'Operator/Staff', minSalary: 4_000_000, midSalary: 4_700_000, maxSalary: 5_500_000 },
    ],
  },
  {
    key: 'fnb',
    label: 'F&B / Restoran',
    industry: 'F&B / Restoran',
    stage: 'Berkembang',
    description: 'Divisi Kitchen (dapur), Service (pelayanan), dan Support — cocok untuk restoran/kafe dengan satu atau beberapa cabang.',
    divisions: [
      { code: 'KITCHEN', name: 'Kitchen', headTitle: 'Head Chef' },
      { code: 'SERVICE', name: 'Service & Front Office', headTitle: 'Restaurant Manager' },
      { code: 'SUPPORT', name: 'Support', headTitle: 'Support Manager' },
    ],
    departments: [],
    positions: [
      { code: 'HEADCHEF', title: 'Head Chef', defaultLevel: 1, divisionCode: 'KITCHEN' },
      { code: 'COOK', title: 'Cook / Juru Masak', defaultLevel: 5, divisionCode: 'KITCHEN' },
      { code: 'RESTOMGR', title: 'Restaurant Manager', defaultLevel: 2, divisionCode: 'SERVICE' },
      { code: 'WAITER', title: 'Waiter/Waitress', defaultLevel: 5, divisionCode: 'SERVICE' },
      { code: 'CASHIER', title: 'Kasir', defaultLevel: 5, divisionCode: 'SUPPORT' },
    ],
    grades: [
      { gradeCode: 'G2', gradeName: 'Manager/Head Chef', minSalary: 8_000_000, midSalary: 10_000_000, maxSalary: 13_000_000 },
      { gradeCode: 'G5', gradeName: 'Staff', minSalary: 3_000_000, midSalary: 3_700_000, maxSalary: 4_500_000 },
    ],
  },
  {
    key: 'construction',
    label: 'Konstruksi & Properti',
    industry: 'Konstruksi & Properti',
    stage: 'Matang (Sustain)',
    description: 'Divisi Proyek, Engineering, dan Procurement — cocok untuk kontraktor atau pengembang properti yang mengelola beberapa proyek sekaligus.',
    divisions: [
      { code: 'PROJECT', name: 'Project Management', headTitle: 'Project Director' },
      { code: 'ENG', name: 'Engineering & Design', headTitle: 'Chief Engineer' },
      { code: 'PROC', name: 'Procurement & Logistik', headTitle: 'Procurement Manager' },
    ],
    departments: [
      { divisionCode: 'PROJECT', code: 'SITE', name: 'Site Operations' },
    ],
    positions: [
      { code: 'PROJDIR', title: 'Project Director', defaultLevel: 1, divisionCode: 'PROJECT' },
      { code: 'SITEMGR', title: 'Site Manager', defaultLevel: 2, divisionCode: 'PROJECT', departmentCode: 'SITE' },
      { code: 'ENGR', title: 'Civil Engineer', defaultLevel: 3, divisionCode: 'ENG' },
      { code: 'DRAFTER', title: 'Drafter / Estimator', defaultLevel: 4, divisionCode: 'ENG' },
      { code: 'PROCMGR', title: 'Procurement Manager', defaultLevel: 2, divisionCode: 'PROC' },
      { code: 'WORKER', title: 'Pekerja Lapangan', defaultLevel: 5, divisionCode: 'PROJECT', departmentCode: 'SITE' },
    ],
    grades: [
      { gradeCode: 'G1', gradeName: 'Direktur/Manager', minSalary: 15_000_000, midSalary: 20_000_000, maxSalary: 28_000_000 },
      { gradeCode: 'G3', gradeName: 'Engineer/Site Manager', minSalary: 8_000_000, midSalary: 10_000_000, maxSalary: 13_000_000 },
      { gradeCode: 'G5', gradeName: 'Pekerja Lapangan', minSalary: 3_500_000, midSalary: 4_200_000, maxSalary: 5_000_000 },
    ],
  },
  {
    key: 'healthcare',
    label: 'Klinik / Kesehatan',
    industry: 'Kesehatan',
    stage: 'Berkembang',
    description: 'Divisi Pelayanan Medis dan Penunjang — cocok untuk klinik, apotek, atau penyedia layanan kesehatan skala kecil-menengah.',
    divisions: [
      { code: 'MEDIS', name: 'Pelayanan Medis', headTitle: 'Kepala Klinik / Dokter Penanggung Jawab' },
      { code: 'PENUNJANG', name: 'Penunjang Medis & Admin', headTitle: 'Manajer Operasional' },
    ],
    departments: [
      { divisionCode: 'PENUNJANG', code: 'FARMASI', name: 'Farmasi' },
    ],
    positions: [
      { code: 'DOKTER', title: 'Dokter Penanggung Jawab', defaultLevel: 1, divisionCode: 'MEDIS' },
      { code: 'PERAWAT', title: 'Perawat', defaultLevel: 4, divisionCode: 'MEDIS' },
      { code: 'OPSMGR', title: 'Manajer Operasional', defaultLevel: 2, divisionCode: 'PENUNJANG' },
      { code: 'APOTEKER', title: 'Apoteker', defaultLevel: 3, divisionCode: 'PENUNJANG', departmentCode: 'FARMASI' },
      { code: 'ADMIN', title: 'Staff Admin & Pendaftaran', defaultLevel: 5, divisionCode: 'PENUNJANG' },
    ],
    grades: [
      { gradeCode: 'G1', gradeName: 'Dokter/Kepala Klinik', minSalary: 15_000_000, midSalary: 22_000_000, maxSalary: 35_000_000 },
      { gradeCode: 'G3', gradeName: 'Perawat/Apoteker', minSalary: 6_000_000, midSalary: 7_500_000, maxSalary: 9_000_000 },
      { gradeCode: 'G5', gradeName: 'Staff Admin', minSalary: 3_500_000, midSalary: 4_200_000, maxSalary: 5_000_000 },
    ],
  },
  {
    key: 'fintech',
    label: 'Jasa Keuangan / Fintech',
    industry: 'Jasa Keuangan',
    stage: 'Matang (Sustain)',
    description: 'Divisi Risk & Compliance, Operations, dan Technology — cocok untuk perusahaan jasa keuangan, pembiayaan, atau fintech yang diawasi regulator.',
    divisions: [
      { code: 'RISK', name: 'Risk & Compliance', headTitle: 'Chief Risk Officer' },
      { code: 'OPS', name: 'Operations', headTitle: 'Head of Operations' },
      { code: 'TECH', name: 'Technology', headTitle: 'Chief Technology Officer' },
      { code: 'BIZ', name: 'Business & Partnership', headTitle: 'Head of Business' },
    ],
    departments: [
      { divisionCode: 'RISK', code: 'COMPLIANCE', name: 'Compliance & Legal' },
    ],
    positions: [
      { code: 'CRO', title: 'Chief Risk Officer', defaultLevel: 1, divisionCode: 'RISK' },
      { code: 'COMPOFF', title: 'Compliance Officer', defaultLevel: 3, divisionCode: 'RISK', departmentCode: 'COMPLIANCE' },
      { code: 'OPSHEAD', title: 'Head of Operations', defaultLevel: 1, divisionCode: 'OPS' },
      { code: 'CTO', title: 'Chief Technology Officer', defaultLevel: 1, divisionCode: 'TECH' },
      { code: 'BIZHEAD', title: 'Head of Business', defaultLevel: 1, divisionCode: 'BIZ' },
    ],
    grades: [
      { gradeCode: 'G1', gradeName: 'C-Level/Head', minSalary: 30_000_000, midSalary: 40_000_000, maxSalary: 55_000_000 },
      { gradeCode: 'G3', gradeName: 'Officer/Senior', minSalary: 12_000_000, midSalary: 15_000_000, maxSalary: 18_000_000 },
      { gradeCode: 'G5', gradeName: 'Staff', minSalary: 7_000_000, midSalary: 8_500_000, maxSalary: 10_000_000 },
    ],
  },
  {
    key: 'education',
    label: 'Pendidikan / Lembaga Kursus',
    industry: 'Pendidikan',
    stage: 'Berkembang',
    description: 'Divisi Akademik dan Operasional — cocok untuk sekolah swasta, lembaga kursus, atau pusat pelatihan.',
    divisions: [
      { code: 'AKADEMIK', name: 'Akademik', headTitle: 'Kepala Sekolah / Direktur Akademik' },
      { code: 'OPS', name: 'Operasional & Administrasi', headTitle: 'Manajer Operasional' },
    ],
    departments: [],
    positions: [
      { code: 'KEPSEK', title: 'Kepala Sekolah / Direktur Akademik', defaultLevel: 1, divisionCode: 'AKADEMIK' },
      { code: 'GURU', title: 'Guru / Pengajar', defaultLevel: 4, divisionCode: 'AKADEMIK' },
      { code: 'OPSMGR', title: 'Manajer Operasional', defaultLevel: 2, divisionCode: 'OPS' },
      { code: 'ADMIN', title: 'Staff Administrasi', defaultLevel: 5, divisionCode: 'OPS' },
    ],
    grades: [
      { gradeCode: 'G1', gradeName: 'Kepala Sekolah/Direktur', minSalary: 12_000_000, midSalary: 16_000_000, maxSalary: 22_000_000 },
      { gradeCode: 'G3', gradeName: 'Guru Senior', minSalary: 6_000_000, midSalary: 7_500_000, maxSalary: 9_000_000 },
      { gradeCode: 'G5', gradeName: 'Staff/Guru Junior', minSalary: 4_000_000, midSalary: 4_700_000, maxSalary: 5_500_000 },
    ],
  },
  {
    key: 'logistics',
    label: 'Logistik & Transportasi',
    industry: 'Logistik & Transportasi',
    stage: 'Matang (Sustain)',
    description: 'Divisi Operasional Armada, Gudang, dan Customer Service — cocok untuk perusahaan ekspedisi, pergudangan, atau transportasi.',
    divisions: [
      { code: 'FLEET', name: 'Operasional Armada', headTitle: 'Fleet Manager' },
      { code: 'WAREHOUSE', name: 'Gudang & Distribusi', headTitle: 'Warehouse Manager' },
      { code: 'CS', name: 'Customer Service', headTitle: 'CS Manager' },
    ],
    departments: [],
    positions: [
      { code: 'FLEETMGR', title: 'Fleet Manager', defaultLevel: 1, divisionCode: 'FLEET' },
      { code: 'DRIVER', title: 'Driver / Pengemudi', defaultLevel: 5, divisionCode: 'FLEET' },
      { code: 'WHMGR', title: 'Warehouse Manager', defaultLevel: 2, divisionCode: 'WAREHOUSE' },
      { code: 'WHSTAFF', title: 'Staff Gudang', defaultLevel: 5, divisionCode: 'WAREHOUSE' },
      { code: 'CSMGR', title: 'CS Manager', defaultLevel: 2, divisionCode: 'CS' },
    ],
    grades: [
      { gradeCode: 'G1', gradeName: 'Manager', minSalary: 10_000_000, midSalary: 13_000_000, maxSalary: 16_000_000 },
      { gradeCode: 'G5', gradeName: 'Driver/Staff', minSalary: 3_800_000, midSalary: 4_500_000, maxSalary: 5_200_000 },
    ],
  },
];

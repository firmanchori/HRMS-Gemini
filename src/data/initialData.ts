import {
  Tenant,
  UserAccount,
  Employee,
  PersonaliaLog,
  AttendanceRecord,
  LeaveRequest,
  PayrollRecord,
  EmployeeLoan,
  EmployeeKPI,
  ComplianceRecord,
  JobVacancy,
  JobRequisition,
  Candidate,
  CandidateCompetencyScore,
  CompetencyTestTypeSetting,
  InterviewTypeSetting,
  InterviewScorecardCriterion,
  OffboardingRecord,
  GAAsset,
  ProcurementOrder,
  OfficialDocument,
  WorkShift,
  ShiftSwapRequest,
  AttendanceCorrectionRequest,
  BusinessTripRequest,
  ApprovalWorkflowItem,
  ApprovalDelegation,
  Vendor,
  AssetMaintenanceTicket,
  AssetRelocationLog,
  DocumentTemplateConfig,
  OnboardingProcess,
  OnboardingChecklistTemplateItem,
  ModuleSettingsConfig,
  CompanyEntity,
  EmployeeStaging,
  OvertimeRequest,
  ReimbursementClaim,
  PersonaliaRequest,
  OrgStructureNode,
  OrgChangeProposal,
  ProbationEvaluation,
  ContractRenewalReview,
  CompanyCalendarEvent,
  GradeSalaryRange,
  SalaryComponentMaster,
  EmployeeSalaryComponentAssignment,
  GARoomBooking,
  GAVehicleBooking,
  GAOfficeSupply,
  GAOfficeSupplyRequest,
  GATicket,
  VendorInvoice,
  AuditLogEntry,
  ENpsSurvey,
  OperationPermissions,
  CompanyDivision,
  CompanyDepartment,
  MasterJobPosition,
} from '../types/hrms';
import { DEFAULT_FLEXIBLE_NIK_SETTINGS } from '../utils/nikGenerator';

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-ntm',
    name: 'PT Nusantara Teknologi Mandiri',
    code: 'NTM',
    logoText: 'NTM Tech',
    documentLogoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop',
    appFaviconUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=64&h=64&fit=crop',
    npwp: '01.234.567.8-012.000',
    city: 'Jakarta Selatan',
    umr: 5067381,
    workDaysPerWeek: 5,
    standardWorkHours: 8,
    planTier: 'Enterprise',
  },
  {
    id: 'tenant-mln',
    name: 'PT Mega Logistik Nusantara',
    code: 'MLN',
    logoText: 'MegaLogistik',
    documentLogoUrl: 'https://images.unsplash.com/photo-1516876437184-593fda40c7ce?w=200&h=200&fit=crop',
    appFaviconUrl: 'https://images.unsplash.com/photo-1516876437184-593fda40c7ce?w=64&h=64&fit=crop',
    npwp: '02.345.678.9-023.000',
    city: 'Surabaya',
    umr: 4725479,
    workDaysPerWeek: 6,
    standardWorkHours: 7,
    planTier: 'Scale',
  },
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    tenantId: 'tenant-ntm',
    name: 'Aditya Pratama, S.Psi',
    email: 'aditya.hr@nusantara.id',
    role: 'super_admin',
    employeeId: 'emp-1',
  },
  {
    id: 'usr-2',
    tenantId: 'tenant-ntm',
    name: 'Jessica Tanujaya, SE',
    email: 'jessica.payroll@nusantara.id',
    role: 'payroll_admin',
    employeeId: 'emp-2',
  },
  {
    id: 'usr-3',
    tenantId: 'tenant-ntm',
    name: 'Bambang Sudiro',
    email: 'bambang.ga@nusantara.id',
    role: 'ga_admin',
    employeeId: 'emp-3',
  },
  {
    id: 'usr-4',
    tenantId: 'tenant-ntm',
    name: 'Dimas Wicaksono',
    email: 'dimas.w@nusantara.id',
    role: 'employee',
    employeeId: 'emp-4',
  },
  {
    id: 'usr-5',
    tenantId: 'tenant-ntm',
    name: 'Aditya Pratama, S.Psi',
    email: 'aditya.hr@nusantara.id',
    role: 'hr_admin',
    employeeId: 'emp-1',
  },
  {
    id: 'usr-6',
    tenantId: 'tenant-ntm',
    name: 'Ir. Budi Santoso, MBA',
    email: 'budi.santoso@nusantara.id',
    role: 'manager',
    employeeId: 'emp-10',
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    tenantId: 'tenant-ntm',
    nik: 'NTM-2022-014',
    fullName: 'Aditya Pratama, S.Psi',
    email: 'aditya.hr@nusantara.id',
    personalEmail: 'aditya.pratama90@gmail.com',
    phone: '08119876543',

    // 1. Status Kerja & Dokumen Kontrak
    employmentType: 'Tetap',
    contractDocNumber: '012/HRD-SK-TETAP/NTM/V/2022',
    contractStartDate: '2022-01-10',
    permanentAppointmentDate: '2022-04-10',
    probationStatus: 'Lolos',
    probationEndDate: '2022-04-09',

    // 2. Organisasi & Posisi
    department: 'People & Culture',
    position: 'VP of Human Capital',
    grade: 'M2',
    joinDate: '2022-01-10',
    status: 'Aktif',
    remainingLeaveDays: 14,

    // 3. Identitas Kependudukan & Pribadi
    nikKtp: '3174051508900003',
    noKk: '3174052002150009',
    birthPlace: 'Jakarta',
    birthDate: '1990-08-15',
    gender: 'Laki-laki',
    religion: 'Islam',
    maritalStatus: 'Menikah',
    ktpAddress: 'Jl. Tebet Barat Raya No. 42, RT 004/RW 02, Tebet Barat, Jakarta Selatan, 12810',
    currentAddress: 'Jl. Tebet Barat Raya No. 42, RT 004/RW 02, Tebet Barat, Jakarta Selatan, 12810',

    // 4. Pajak & Jaminan Sosial
    npwp: '12.876.543.2-011.000',
    ptkp: 'K/2',
    kppPratama: 'KPP Pratama Jakarta Tebet',
    bpjsTkNo: '220198765432',
    bpjsKesNo: '000123987654',
    faskes1Bpjs: 'Puskesmas Kecamatan Tebet',

    // 5. Finansial & Payroll
    bankName: 'BCA',
    bankAccount: '8820192831',
    bankAccountHolder: 'Aditya Pratama',
    basicSalary: 28000000,
    fixedAllowance: 4500000,
    transportAllowance: 1500000,
    mealAllowance: 1000000,
    positionAllowance: 2500000,

    // 6. Pendidikan
    lastEducationDegree: 'S1',
    institution: 'Universitas Indonesia',
    major: 'Psikologi Industri & Organisasi',
    graduationYear: 2012,

    // 7. Keluarga & Kontak Darurat
    familyMembers: [
      {
        id: 'fam-1-1',
        relation: 'Pasangan',
        fullName: 'Ratna Kusuma Dewi, S.E.',
        nikKtp: '3174055204920002',
        birthDate: '1992-04-12',
        gender: 'Perempuan',
        occupation: 'Dosen Perguruan Tinggi Swasta',
        isBpjsCovered: true,
        education: 'S2 Manajemen',
      },
      {
        id: 'fam-1-2',
        relation: 'Anak',
        fullName: 'Arkan Danendra Pratama',
        birthDate: '2019-06-20',
        gender: 'Laki-laki',
        isBpjsCovered: true,
        education: 'TK A',
      },
      {
        id: 'fam-1-3',
        relation: 'Anak',
        fullName: 'Aira Danisha Pratama',
        birthDate: '2022-11-05',
        gender: 'Perempuan',
        isBpjsCovered: true,
      },
    ],
    emergencyContacts: [
      {
        id: 'emg-1-1',
        fullName: 'Ratna Kusuma Dewi',
        relation: 'Suami/Istri',
        phone: '081298761122',
        address: 'Jl. Tebet Barat Raya No. 42, Jakarta Selatan',
      },
      {
        id: 'emg-1-2',
        fullName: 'H. Bambang Soeprapto',
        relation: 'Orang Tua',
        phone: '081611223344',
        address: 'Jl. Rawamangun Muka No. 12, Jakarta Timur',
      },
    ],
  },
  {
    id: 'emp-2',
    tenantId: 'tenant-ntm',
    nik: 'NTM-2023-045',
    fullName: 'Jessica Tanujaya, SE',
    email: 'jessica.payroll@nusantara.id',
    personalEmail: 'jessica.tan93@yahoo.com',
    phone: '081234567891',

    // 1. Status Kerja & Dokumen Kontrak
    employmentType: 'Tetap',
    contractDocNumber: '028/HRD-SK-TETAP/NTM/VI/2023',
    contractStartDate: '2023-03-01',
    permanentAppointmentDate: '2023-06-01',
    probationStatus: 'Lolos',
    probationEndDate: '2023-05-31',

    // 2. Organisasi & Posisi
    department: 'Finance & Payroll',
    position: 'Lead Payroll & Tax Specialist',
    grade: 'L3',
    joinDate: '2023-03-01',
    status: 'Aktif',
    remainingLeaveDays: 11,

    // 3. Identitas Kependudukan & Pribadi
    nikKtp: '3171036811930005',
    noKk: '3171030101180012',
    birthPlace: 'Bandung',
    birthDate: '1993-11-28',
    gender: 'Perempuan',
    religion: 'Kristen',
    maritalStatus: 'Lajang',
    ktpAddress: 'Apartemen Green Pramuka Tower F Lantai 12 Unit 08, Cempaka Putih, Jakarta Pusat',
    currentAddress: 'Apartemen Green Pramuka Tower F Lantai 12 Unit 08, Cempaka Putih, Jakarta Pusat',

    // 4. Pajak & Jaminan Sosial
    npwp: '23.456.789.0-123.000',
    ptkp: 'TK/1',
    kppPratama: 'KPP Pratama Jakarta Cempaka Putih',
    bpjsTkNo: '230198765433',
    bpjsKesNo: '000123987655',
    faskes1Bpjs: 'Klinik Pratama Cempaka Husada',

    // 5. Finansial & Payroll
    bankName: 'Mandiri',
    bankAccount: '137001928374',
    bankAccountHolder: 'Jessica Tanujaya',
    basicSalary: 15500000,
    fixedAllowance: 2000000,
    transportAllowance: 1000000,
    mealAllowance: 800000,
    positionAllowance: 1200000,

    // 6. Pendidikan
    lastEducationDegree: 'S1',
    institution: 'Universitas Katolik Parahyangan',
    major: 'Akuntansi Perpajakan (Brevet AB)',
    graduationYear: 2015,

    // 7. Keluarga & Kontak Darurat
    familyMembers: [
      {
        id: 'fam-2-1',
        relation: 'Orang Tua',
        fullName: 'Hendra Tanujaya',
        birthDate: '1965-02-14',
        gender: 'Laki-laki',
        occupation: 'Pensiunan Swasta',
        isBpjsCovered: true,
      },
    ],
    emergencyContacts: [
      {
        id: 'emg-2-1',
        fullName: 'Hendra Tanujaya',
        relation: 'Orang Tua',
        phone: '081122334455',
        address: 'Jl. Riau No. 88, Bandung',
      },
    ],
  },
  {
    id: 'emp-3',
    tenantId: 'tenant-ntm',
    nik: 'NTM-2023-088',
    fullName: 'Bambang Sudiro',
    email: 'bambang.ga@nusantara.id',
    personalEmail: 'bambang.sudiro78@gmail.com',
    phone: '081398765123',

    // 1. Status Kerja & Dokumen Kontrak
    employmentType: 'Tetap',
    contractDocNumber: '045/HRD-SK-TETAP/NTM/IX/2023',
    contractStartDate: '2023-06-15',
    permanentAppointmentDate: '2023-09-15',
    probationStatus: 'Lolos',
    probationEndDate: '2023-09-14',

    // 2. Organisasi & Posisi
    department: 'General Affairs',
    position: 'GA & Facility Manager',
    grade: 'L3',
    joinDate: '2023-06-15',
    status: 'Aktif',
    remainingLeaveDays: 9,

    // 3. Identitas Kependudukan & Pribadi
    nikKtp: '3275081203780007',
    noKk: '3275080509040003',
    birthPlace: 'Solo',
    birthDate: '1978-03-12',
    gender: 'Laki-laki',
    religion: 'Islam',
    maritalStatus: 'Menikah',
    ktpAddress: 'Komplek Harapan Indah Blok DB No. 15, RT 002/RW 018, Pejuang, Medan Satria, Kota Bekasi',
    currentAddress: 'Komplek Harapan Indah Blok DB No. 15, Kota Bekasi',

    // 4. Pajak & Jaminan Sosial
    npwp: '34.567.890.1-234.000',
    ptkp: 'K/1',
    kppPratama: 'KPP Pratama Bekasi Barat',
    bpjsTkNo: '230198765434',
    bpjsKesNo: '000123987656',
    faskes1Bpjs: 'Puskesmas Pejuang Bekasi',

    // 5. Finansial & Payroll
    bankName: 'BRI',
    bankAccount: '034101002345',
    bankAccountHolder: 'Bambang Sudiro',
    basicSalary: 13500000,
    fixedAllowance: 1800000,
    transportAllowance: 800000,
    mealAllowance: 800000,
    positionAllowance: 1000000,

    // 6. Pendidikan
    lastEducationDegree: 'S1',
    institution: 'Universitas Sebelas Maret (UNS)',
    major: 'Teknik Sipil & Manajemen Properti',
    graduationYear: 2001,

    // 7. Keluarga & Kontak Darurat
    familyMembers: [
      {
        id: 'fam-3-1',
        relation: 'Pasangan',
        fullName: 'Sri Handayani, S.Pd',
        nikKtp: '3275085408800004',
        birthDate: '1980-08-14',
        gender: 'Perempuan',
        occupation: 'Guru Sekolah Dasar Negeri',
        isBpjsCovered: true,
      },
      {
        id: 'fam-3-2',
        relation: 'Anak',
        fullName: 'Bagas Aditya Sudiro',
        birthDate: '2008-01-22',
        gender: 'Laki-laki',
        isBpjsCovered: true,
        education: 'SMA Kelas 2',
      },
    ],
    emergencyContacts: [
      {
        id: 'emg-3-1',
        fullName: 'Sri Handayani',
        relation: 'Suami/Istri',
        phone: '081311229988',
        address: 'Komplek Harapan Indah Blok DB No. 15, Kota Bekasi',
      },
    ],
  },
  {
    id: 'emp-4',
    tenantId: 'tenant-ntm',
    nik: 'NTM-2024-102',
    fullName: 'Dimas Wicaksono',
    email: 'dimas.w@nusantara.id',
    personalEmail: 'dimas.wicaksono97@gmail.com',
    phone: '085712349876',

    // 1. Status Kerja & Dokumen Kontrak
    employmentType: 'Kontrak',
    contractDocNumber: '042/HRD-PKWT/NTM/I/2024',
    contractStartDate: '2024-01-08',
    contractEndDate: '2025-01-07',
    probationStatus: 'Tanpa Percobaan',

    // 2. Organisasi & Posisi
    department: 'Software Engineering',
    position: 'Full-Stack Developer',
    grade: 'L2',
    joinDate: '2024-01-08',
    status: 'Aktif',
    remainingLeaveDays: 10,

    // 3. Identitas Kependudukan & Pribadi
    nikKtp: '3175062409970002',
    noKk: '3175061012190001',
    birthPlace: 'Jakarta',
    birthDate: '1997-09-24',
    gender: 'Laki-laki',
    religion: 'Islam',
    maritalStatus: 'Lajang',
    ktpAddress: 'Jl. Duren Sawit Indah Blok K No. 7, Duren Sawit, Jakarta Timur, 13440',
    currentAddress: 'Kost Eksklusif Kuningan Suites, Jl. Karet Pedurenan No. 18, Jakarta Selatan',

    // 4. Pajak & Jaminan Sosial
    npwp: '45.678.901.2-345.000',
    ptkp: 'TK/0',
    kppPratama: 'KPP Pratama Jakarta Duren Sawit',
    bpjsTkNo: '240198765435',
    bpjsKesNo: '000123987657',
    faskes1Bpjs: 'Klinik Medika Pratama Setiabudi',

    // 5. Finansial & Payroll
    bankName: 'BCA',
    bankAccount: '7730192844',
    bankAccountHolder: 'Dimas Wicaksono',
    basicSalary: 11000000,
    fixedAllowance: 1200000,
    transportAllowance: 800000,
    mealAllowance: 700000,
    positionAllowance: 500000,

    // 6. Pendidikan
    lastEducationDegree: 'S1',
    institution: 'Institut Teknologi Bandung (ITB)',
    major: 'Teknik Informatika',
    graduationYear: 2020,

    // 7. Keluarga & Kontak Darurat
    familyMembers: [
      {
        id: 'fam-4-1',
        relation: 'Orang Tua',
        fullName: 'Ir. Agus Wicaksono',
        birthDate: '1968-05-10',
        gender: 'Laki-laki',
        occupation: 'Wiraswasta',
        isBpjsCovered: false,
      },
    ],
    emergencyContacts: [
      {
        id: 'emg-4-1',
        fullName: 'Ir. Agus Wicaksono',
        relation: 'Orang Tua',
        phone: '081288990011',
        address: 'Jl. Duren Sawit Indah Blok K No. 7, Jakarta Timur',
      },
    ],
  },
  {
    id: 'emp-5',
    tenantId: 'tenant-ntm',
    nik: 'NTM-2024-118',
    fullName: 'Rini Anggraini',
    email: 'rini.outsource@mitraprima.co.id',
    personalEmail: 'rini.anggraini99@gmail.com',
    phone: '081912345678',

    // 1. Status Kerja & Dokumen Kontrak
    employmentType: 'Outsource',
    contractDocNumber: '089/HRD-SPK-OUT/NTM/IV/2024',
    contractStartDate: '2024-04-01',
    contractEndDate: '2025-03-31',
    probationStatus: 'Tanpa Percobaan',
    outsourceVendor: 'PT Mitra Prima Solusindo Mandiri',

    // 2. Organisasi & Posisi
    department: 'General Affairs',
    position: 'Office Operations & Inventory Clerk',
    grade: 'L1',
    joinDate: '2024-04-01',
    status: 'Aktif',
    remainingLeaveDays: 8,

    // 3. Identitas Kependudukan & Pribadi
    nikKtp: '3201026006990008',
    noKk: '3201021405170004',
    birthPlace: 'Bogor',
    birthDate: '1999-06-20',
    gender: 'Perempuan',
    religion: 'Islam',
    maritalStatus: 'Lajang',
    ktpAddress: 'Kp. Bojong Gede RT 03/RW 05, Bojonggede, Kabupaten Bogor, 16922',
    currentAddress: 'Kp. Bojong Gede RT 03/RW 05, Bojonggede, Kabupaten Bogor',

    // 4. Pajak & Jaminan Sosial
    npwp: '56.789.012.3-456.000',
    ptkp: 'TK/0',
    kppPratama: 'KPP Pratama Cibinong',
    bpjsTkNo: '240198765436',
    bpjsKesNo: '000123987658',
    faskes1Bpjs: 'Puskesmas Bojonggede',

    // 5. Finansial & Payroll
    bankName: 'BNI',
    bankAccount: '0981234567',
    bankAccountHolder: 'Rini Anggraini',
    basicSalary: 5500000,
    fixedAllowance: 500000,
    transportAllowance: 500000,
    mealAllowance: 500000,
    positionAllowance: 0,

    // 6. Pendidikan
    lastEducationDegree: 'D3',
    institution: 'Politeknik Negeri Jakarta',
    major: 'Administrasi Bisnis Perkantoran',
    graduationYear: 2021,

    // 7. Keluarga & Kontak Darurat
    familyMembers: [],
    emergencyContacts: [
      {
        id: 'emg-5-1',
        fullName: 'Dedi Mulyadi',
        relation: 'Orang Tua',
        phone: '081377889900',
        address: 'Kp. Bojong Gede RT 03/RW 05, Bogor',
      },
    ],
  },
  {
    id: 'emp-6',
    tenantId: 'tenant-ntm',
    nik: 'NTM-2024-130',
    fullName: 'Farhan Kurnia',
    email: 'farhan.k@nusantara.id',
    personalEmail: 'farhan.kurnia02@gmail.com',
    phone: '082145678901',

    // 1. Status Kerja & Dokumen Kontrak
    employmentType: 'Magang',
    contractDocNumber: '112/HRD-MAGANG/NTM/VII/2024',
    contractStartDate: '2024-07-01',
    contractEndDate: '2024-12-31',
    probationStatus: 'Tanpa Percobaan',

    // 2. Organisasi & Posisi
    department: 'Product Management',
    position: 'Associate Product Analyst Intern',
    grade: 'Intern',
    joinDate: '2024-07-01',
    status: 'Aktif',
    remainingLeaveDays: 4,

    // 3. Identitas Kependudukan & Pribadi
    nikKtp: '3173041001020001',
    noKk: '3173042809200005',
    birthPlace: 'Jakarta',
    birthDate: '2002-01-10',
    gender: 'Laki-laki',
    religion: 'Islam',
    maritalStatus: 'Lajang',
    ktpAddress: 'Jl. Palmerah Barat No. 29, Palmerah, Jakarta Barat, 11480',
    currentAddress: 'Jl. Palmerah Barat No. 29, Palmerah, Jakarta Barat',

    // 4. Pajak & Jaminan Sosial
    npwp: '67.890.123.4-567.000',
    ptkp: 'TK/0',
    kppPratama: 'KPP Pratama Jakarta Palmerah',
    bpjsTkNo: '240198765437',
    bpjsKesNo: '000123987659',
    faskes1Bpjs: 'Puskesmas Palmerah',

    // 5. Finansial & Payroll
    bankName: 'BCA',
    bankAccount: '6120491823',
    bankAccountHolder: 'Farhan Kurnia',
    basicSalary: 3500000,
    fixedAllowance: 0,
    transportAllowance: 500000,
    mealAllowance: 500000,
    positionAllowance: 0,

    // 6. Pendidikan
    lastEducationDegree: 'S1',
    institution: 'Universitas Bina Nusantara (BINUS)',
    major: 'Sistem Informasi (Semester Akhir)',
    graduationYear: 2025,

    // 7. Keluarga & Kontak Darurat
    familyMembers: [],
    emergencyContacts: [
      {
        id: 'emg-6-1',
        fullName: 'Kurnia Wahyudi',
        relation: 'Orang Tua',
        phone: '081211335577',
        address: 'Jl. Palmerah Barat No. 29, Jakarta Barat',
      },
    ],
  },
  {
    id: 'emp-7',
    tenantId: 'tenant-ntm',
    nik: 'NTM-2023-088',
    fullName: 'Dewi Sartika, S.Kom',
    email: 'dewi.sartika@nusantara.id',
    personalEmail: 'dewi.sartika.design@gmail.com',
    phone: '081298112233',

    // 1. Status Kerja & Dokumen Kontrak
    employmentType: 'Kontrak',
    contractDocNumber: '045/HRD-PKWT/NTM/XI/2023',
    contractStartDate: '2023-11-15',
    contractEndDate: '2026-11-15',
    probationStatus: 'Lolos',

    // 2. Organisasi & Posisi
    department: 'Marketing & Communication',
    position: 'Senior UI/UX & Digital Brand Specialist',
    grade: 'L3',
    joinDate: '2023-11-15',
    status: 'Aktif',
    remainingLeaveDays: 9,

    // 3. Identitas Kependudukan & Pribadi
    nikKtp: '3275015509950004',
    noKk: '3275011002160008',
    birthPlace: 'Bekasi',
    birthDate: '1995-09-15',
    gender: 'Perempuan',
    religion: 'Islam',
    maritalStatus: 'Lajang',
    ktpAddress: 'Jl. Kemang Pratama Raya Blok AL No. 15, Bekasi Barat, 17116',
    currentAddress: 'Jl. Kemang Pratama Raya Blok AL No. 15, Bekasi Barat',

    // 4. Pajak & Jaminan Sosial
    npwp: '45.678.901.2-401.000',
    ptkp: 'TK/0',
    kppPratama: 'KPP Pratama Bekasi Barat',
    bpjsTkNo: '230198765438',
    bpjsKesNo: '000123987660',
    faskes1Bpjs: 'Klinik Pratama Mitra Medika Bekasi',

    // 5. Finansial & Payroll
    bankName: 'Mandiri',
    bankAccount: '1560019283741',
    bankAccountHolder: 'Dewi Sartika',
    basicSalary: 8500000,
    fixedAllowance: 1000000,
    transportAllowance: 500000,
    mealAllowance: 500000,
    positionAllowance: 0,

    // 6. Pendidikan
    lastEducationDegree: 'S1',
    institution: 'Institut Teknologi Bandung (ITB)',
    major: 'Desain Komunikasi Visual',
    graduationYear: 2017,

    // 7. Keluarga & Kontak Darurat
    familyMembers: [],
    emergencyContacts: [
      {
        id: 'emg-7-1',
        fullName: 'H. Sudarsono',
        relation: 'Orang Tua',
        phone: '081288771122',
        address: 'Jl. Kemang Pratama Raya Blok AL No. 15, Bekasi Barat',
      },
    ],
  },
  {
    id: 'emp-8',
    tenantId: 'tenant-ntm',
    nik: 'NTM-2022-031',
    fullName: 'Eko Prasetyo, S.T.',
    email: 'eko.prasetyo@nusantara.id',
    personalEmail: 'eko.devops91@gmail.com',
    phone: '081399887744',

    // 1. Status Kerja & Dokumen Kontrak
    employmentType: 'Tetap',
    contractDocNumber: '019/HRD-SK-TETAP/NTM/VIII/2022',
    contractStartDate: '2022-08-01',
    permanentAppointmentDate: '2022-11-01',
    probationStatus: 'Lolos',

    // 2. Organisasi & Posisi
    department: 'Engineering',
    position: 'Lead Cloud Infrastructure & DevOps',
    grade: 'L4',
    joinDate: '2022-08-01',
    status: 'Resign',
    remainingLeaveDays: 6,

    // 3. Identitas Kependudukan & Pribadi
    nikKtp: '3175061203910007',
    noKk: '3175061508180003',
    birthPlace: 'Semarang',
    birthDate: '1991-03-12',
    gender: 'Laki-laki',
    religion: 'Islam',
    maritalStatus: 'Menikah',
    ktpAddress: 'Jl. Kalimalang Indah No. 8, Duren Sawit, Jakarta Timur, 13440',
    currentAddress: 'Jl. Kalimalang Indah No. 8, Duren Sawit, Jakarta Timur',

    // 4. Pajak & Jaminan Sosial
    npwp: '23.456.789.0-008.000',
    ptkp: 'K/1',
    kppPratama: 'KPP Pratama Jakarta Duren Sawit',
    bpjsTkNo: '220198765439',
    bpjsKesNo: '000123987661',
    faskes1Bpjs: 'Puskesmas Duren Sawit',

    // 5. Finansial & Payroll
    bankName: 'BCA',
    bankAccount: '5220194821',
    bankAccountHolder: 'Eko Prasetyo',
    basicSalary: 18000000,
    fixedAllowance: 2000000,
    transportAllowance: 1000000,
    mealAllowance: 1000000,
    positionAllowance: 2000000,

    // 6. Pendidikan
    lastEducationDegree: 'S1',
    institution: 'Institut Teknologi Sepuluh Nopember (ITS)',
    major: 'Teknik Informatika',
    graduationYear: 2013,

    // 7. Keluarga & Kontak Darurat
    familyMembers: [
      {
        id: 'fam-8-1',
        relation: 'Pasangan',
        fullName: 'Novi Indriyani, S.Pd',
        nikKtp: '3175065005930002',
        birthDate: '1993-05-10',
        gender: 'Perempuan',
        occupation: 'Guru Sekolah Dasar',
        isBpjsCovered: true,
      },
    ],
    emergencyContacts: [
      {
        id: 'emg-8-1',
        fullName: 'Novi Indriyani',
        relation: 'Suami/Istri',
        phone: '081277665544',
        address: 'Jl. Kalimalang Indah No. 8, Jakarta Timur',
      },
    ],
  },
  {
    id: 'emp-9',
    tenantId: 'tenant-ntm',
    nik: 'NTM-2023-062',
    fullName: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@nusantara.id',
    personalEmail: 'ahmad.fauzi88@gmail.com',
    phone: '085712349988',

    // 1. Status Kerja & Dokumen Kontrak
    employmentType: 'Tetap',
    contractDocNumber: '034/HRD-SK-TETAP/NTM/IX/2023',
    contractStartDate: '2023-05-01',
    permanentAppointmentDate: '2023-08-01',
    probationStatus: 'Lolos',

    // 2. Organisasi & Posisi
    department: 'General Affairs',
    position: 'Building Technician & Operational Driver',
    grade: 'L1',
    joinDate: '2023-05-01',
    status: 'Aktif',
    remainingLeaveDays: 8,

    // 3. Identitas Kependudukan & Pribadi
    nikKtp: '3174081406880009',
    noKk: '3174080101150006',
    birthPlace: 'Jakarta',
    birthDate: '1988-06-14',
    gender: 'Laki-laki',
    religion: 'Islam',
    maritalStatus: 'Menikah',
    ktpAddress: 'Jl. Kebagusan Raya No. 45, Pasar Minggu, Jakarta Selatan, 12520',
    currentAddress: 'Jl. Kebagusan Raya No. 45, Pasar Minggu, Jakarta Selatan',

    // 4. Pajak & Jaminan Sosial
    npwp: '78.901.234.5-014.000',
    ptkp: 'K/1',
    kppPratama: 'KPP Pratama Jakarta Pasar Minggu',
    bpjsTkNo: '230198765440',
    bpjsKesNo: '000123987662',
    faskes1Bpjs: 'Puskesmas Kebagusan',

    // 5. Finansial & Payroll
    bankName: 'BRI',
    bankAccount: '034101002938501',
    bankAccountHolder: 'Ahmad Fauzi',
    basicSalary: 5200000,
    fixedAllowance: 600000,
    transportAllowance: 500000,
    mealAllowance: 500000,
    positionAllowance: 0,

    // 6. Pendidikan
    lastEducationDegree: 'SMA/SMK',
    institution: 'SMK Negeri 29 Jakarta (Penerbangan)',
    major: 'Teknik Ketenagalistrikan & Otomotif',
    graduationYear: 2006,

    // 7. Keluarga & Kontak Darurat
    familyMembers: [
      {
        id: 'fam-9-1',
        relation: 'Pasangan',
        fullName: 'Siti Maryam',
        nikKtp: '3174085507900003',
        birthDate: '1990-07-15',
        gender: 'Perempuan',
        occupation: 'Ibu Rumah Tangga',
        isBpjsCovered: true,
      },
    ],
    emergencyContacts: [
      {
        id: 'emg-9-1',
        fullName: 'Siti Maryam',
        relation: 'Suami/Istri',
        phone: '085811223344',
        address: 'Jl. Kebagusan Raya No. 45, Jakarta Selatan',
      },
    ],
  },
  {
    id: 'emp-10',
    tenantId: 'tenant-ntm',
    nik: 'NTM-2021-001',
    fullName: 'Ir. Budi Santoso, MBA',
    email: 'budi.santoso@nusantara.id',
    personalEmail: 'budi.santoso.exec@gmail.com',
    phone: '08111223344',

    // 1. Status Kerja & Dokumen Kontrak
    employmentType: 'Tetap',
    contractDocNumber: '001/BOD-SK/NTM/I/2021',
    contractStartDate: '2021-01-01',
    permanentAppointmentDate: '2021-01-01',
    probationStatus: 'Lolos',

    // 2. Organisasi & Posisi
    department: 'Board of Directors',
    position: 'Direktur Utama & CEO',
    grade: 'Executive',
    joinDate: '2021-01-01',
    status: 'Aktif',
    remainingLeaveDays: 20,

    // 3. Identitas Kependudukan & Pribadi
    nikKtp: '3174011802750002',
    noKk: '3174012001050001',
    birthPlace: 'Surabaya',
    birthDate: '1975-02-18',
    gender: 'Laki-laki',
    religion: 'Islam',
    maritalStatus: 'Menikah',
    ktpAddress: 'Jl. Patra Kuningan VII No. 12, Setiabudi, Jakarta Selatan, 12950',
    currentAddress: 'Jl. Patra Kuningan VII No. 12, Setiabudi, Jakarta Selatan',

    // 4. Pajak & Jaminan Sosial
    npwp: '01.999.888.7-011.000',
    ptkp: 'K/2',
    kppPratama: 'KPP Wajib Pajak Besar Dua',
    bpjsTkNo: '210198765401',
    bpjsKesNo: '000123987601',
    faskes1Bpjs: 'RS Siloam Semanggi',

    // 5. Finansial & Payroll
    bankName: 'BCA',
    bankAccount: '0010992831',
    bankAccountHolder: 'Budi Santoso',
    basicSalary: 45000000,
    fixedAllowance: 5000000,
    transportAllowance: 2500000,
    mealAllowance: 1500000,
    positionAllowance: 1000000,

    // 6. Pendidikan
    lastEducationDegree: 'S2',
    institution: 'Institut Teknologi Bandung & NUS Singapore',
    major: 'Master of Business Administration (MBA)',
    graduationYear: 2002,

    // 7. Keluarga & Kontak Darurat
    familyMembers: [
      {
        id: 'fam-10-1',
        relation: 'Pasangan',
        fullName: 'Dr. Anita Handayani, Sp.A',
        nikKtp: '3174016004780005',
        birthDate: '1978-04-20',
        gender: 'Perempuan',
        occupation: 'Dokter Spesialis Anak',
        isBpjsCovered: true,
      },
    ],
    emergencyContacts: [
      {
        id: 'emg-10-1',
        fullName: 'Dr. Anita Handayani',
        relation: 'Suami/Istri',
        phone: '081299881122',
        address: 'Jl. Patra Kuningan VII No. 12, Jakarta Selatan',
      },
    ],
  },
];

export const INITIAL_PERSONALIA_LOGS: PersonaliaLog[] = [
  {
    id: 'pers-1',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-2',
    type: 'Promosi',
    previousPosition: 'Senior Payroll Officer',
    newPosition: 'Lead Payroll & Tax Specialist',
    previousDepartment: 'Finance & Tax',
    newDepartment: 'Finance & Tax',
    previousGrade: 'L2',
    newGrade: 'L3',
    previousSalary: 13000000,
    newSalary: 15500000,
    previousAllowance: 1000000,
    newAllowance: 2000000,
    effectiveDate: '2024-06-01',
    letterNumber: '018/HRD-SK-PROM/NTM/VI/2024',
    reason: 'Kinerja konsisten melampaui target implementasi regulasi PPh 21 TER 2024 tepat waktu',
    approvedBy: 'Ir. Budi Santoso, MBA',
    status: 'Disetujui',
    notes: 'Kenaikan tunjangan jabatan struktural dan tanggung jawab audit PPh 21 TER.',
  },
  {
    id: 'pers-2',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-4',
    type: 'Penyesuaian Gaji',
    previousPosition: 'Principal Fullstack Software Engineer',
    newPosition: 'Principal Fullstack Software Engineer',
    previousDepartment: 'Engineering & Technology',
    newDepartment: 'Engineering & Technology',
    previousGrade: 'L3',
    newGrade: 'L3',
    previousSalary: 12500000,
    newSalary: 14000000,
    effectiveDate: '2024-07-01',
    letterNumber: '025/HRD-SK-ADJ/NTM/VII/2024',
    reason: 'Review performa semester I dan sertifikasi arsitektur cloud enterprise',
    approvedBy: 'Aditya Pratama, S.Psi',
    status: 'Disetujui',
    notes: 'Merit rating tahunan dengan capaian KPI 92.2% (Grade A).',
  },
  {
    id: 'pers-3',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-3',
    type: 'Pengangkatan Tetap',
    previousPosition: 'General Affairs Officer',
    newPosition: 'General Affairs, Asset & Procurement Manager',
    previousDepartment: 'General Affairs',
    newDepartment: 'General Affairs',
    previousGrade: 'L2',
    newGrade: 'L3',
    previousSalary: 9000000,
    newSalary: 11000000,
    effectiveDate: '2023-06-01',
    letterNumber: '032/HRD-SK-TETAP/NTM/VI/2023',
    permanentAppointmentDate: '2023-06-01',
    reason: 'Pengangkatan status dari PKWT kontrak menjadi Karyawan Tetap (PKWTT)',
    approvedBy: 'Ir. Budi Santoso, MBA',
    status: 'Disetujui',
    notes: 'Masa kerja evaluasi memuaskan, hak cuti tahunan penuh 12 hari aktif.',
  },
  {
    id: 'pers-4',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-5',
    type: 'Mutasi Departemen',
    previousPosition: 'Customer Care Support',
    newPosition: 'Office Operations & Inventory Specialist',
    previousDepartment: 'Operations Support',
    newDepartment: 'General Affairs',
    previousGrade: 'L1',
    newGrade: 'L1',
    previousSalary: 5000000,
    newSalary: 5500000,
    effectiveDate: '2024-04-01',
    letterNumber: '041/HRD-SK-MUT/NTM/IV/2024',
    reason: 'Rotasi internal dan penguatan tata kelola logistik perlengkapan kantor',
    approvedBy: 'Aditya Pratama, S.Psi',
    status: 'Disetujui',
    notes: 'Handover SOP inventaris kantor berjalan lancar.',
  },
  {
    id: 'pers-5',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-7',
    type: 'Perpanjangan Kontrak',
    previousPosition: 'Senior UI/UX & Digital Brand Specialist',
    newPosition: 'Senior UI/UX & Digital Brand Specialist',
    previousDepartment: 'Product & Design',
    newDepartment: 'Product & Design',
    previousGrade: 'L3',
    newGrade: 'L3',
    previousSalary: 8500000,
    newSalary: 8500000,
    contractDurationMonths: 12,
    contractEndDate: '2026-11-15',
    effectiveDate: '2025-11-15',
    letterNumber: '055/HRD-ADD-PKWT/NTM/XI/2025',
    reason: 'Addendum perpanjangan perjanjian kerja waktu tertentu (PKWT) tahun ke-2',
    approvedBy: 'Aditya Pratama, S.Psi',
    status: 'Disetujui',
    notes: 'Klausul kompensasi akhir kontrak sesuai PP 35/2021 Pasal 61A.',
  },
  {
    id: 'pers-6',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-4',
    type: 'Penetapan Plt',
    previousPosition: 'Principal Fullstack Software Engineer',
    newPosition: 'Plt. Head of Engineering & Cloud Architecture',
    previousDepartment: 'Engineering',
    newDepartment: 'Engineering',
    previousGrade: 'L3',
    newGrade: 'L4',
    previousSalary: 14000000,
    newSalary: 16500000,
    previousAllowance: 1500000,
    newAllowance: 3500000,
    actingRoleExpiryDate: '2027-04-30',
    effectiveDate: '2026-10-01',
    letterNumber: '089/HRD-SK-PLT/NTM/X/2026',
    reason: 'Penetapan Pelaksana Tugas (Plt) Kepala Divisi Engineering mengisi transisi kepemimpinan teknis',
    approvedBy: 'Ir. Budi Santoso, MBA',
    status: 'Disetujui',
    notes: 'Masa penugasan sementara maksimal 6 bulan kalender.',
  },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-1',
    date: '2026-10-17',
    clockIn: '08:14',
    clockOut: '17:30',
    status: 'Hadir',
    overtimeHours: 0,
    lateMinutes: 0,
    notes: 'Presensi kantor pusat Lantai 18',
  },
  {
    id: 'att-2',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-2',
    date: '2026-10-17',
    clockIn: '08:25',
    clockOut: '18:35',
    status: 'Hadir',
    overtimeHours: 1.5,
    lateMinutes: 0,
    notes: 'Lembur closing perhitungan slip gaji tengah bulan',
  },
  {
    id: 'att-3',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-3',
    date: '2026-10-17',
    clockIn: '08:42',
    clockOut: '17:45',
    status: 'Terlambat',
    overtimeHours: 0,
    lateMinutes: 12,
    notes: 'Kendala kemacetan inspeksi gedung Cilandak',
  },
  {
    id: 'att-4',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-4',
    date: '2026-10-17',
    clockIn: '08:10',
    clockOut: '19:15',
    status: 'Hadir',
    overtimeHours: 2,
    lateMinutes: 0,
    notes: 'Deployment hotfix modul payroll',
  },
  {
    id: 'att-5',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-5',
    date: '2026-10-17',
    clockIn: '07:55',
    clockOut: '17:05',
    status: 'Hadir',
    overtimeHours: 0,
    lateMinutes: 0,
    notes: 'Stock opname perlengkapan kantor',
  },
  {
    id: 'att-6',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-6',
    date: '2026-10-17',
    status: 'Izin',
    overtimeHours: 0,
    lateMinutes: 0,
    notes: 'Sidang seminar proposal skripsi',
  },
  // Records for Today: 2026-10-22
  {
    id: 'att-22-1',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-1',
    date: '2026-10-22',
    clockIn: '08:08',
    clockOut: '17:30',
    status: 'Hadir',
    overtimeHours: 0,
    lateMinutes: 0,
    notes: 'Presensi kantor pusat Lantai 18 - On-time',
  },
  {
    id: 'att-22-2',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-2',
    date: '2026-10-22',
    clockIn: '08:15',
    clockOut: '17:45',
    status: 'Hadir',
    overtimeHours: 0,
    lateMinutes: 0,
    notes: 'Rekonsiliasi PPh 21 TER dan transfer gaji',
  },
  {
    id: 'att-22-3',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-3',
    date: '2026-10-22',
    clockIn: '08:42',
    clockOut: '17:45',
    status: 'Terlambat',
    overtimeHours: 0,
    lateMinutes: 12,
    notes: 'Kemacetan inspeksi gedung Cilandak (Terlambat 12 menit)',
  },
  {
    id: 'att-22-4',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-4',
    date: '2026-10-22',
    clockIn: '08:10',
    clockOut: '19:15',
    status: 'Hadir',
    overtimeHours: 2,
    lateMinutes: 0,
    notes: 'Deployment hotfix arsitektur & lembur 2 jam',
  },
  {
    id: 'att-22-5',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-5',
    date: '2026-10-22',
    clockIn: '07:55',
    clockOut: '17:05',
    status: 'Hadir',
    overtimeHours: 0,
    lateMinutes: 0,
    notes: 'Stock opname ATK dan operasional kantor',
  },
  {
    id: 'att-22-6',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-6',
    date: '2026-10-22',
    status: 'Izin',
    overtimeHours: 0,
    lateMinutes: 0,
    notes: 'Sidang seminar skripsi universitas',
  },
  {
    id: 'att-22-7',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-7',
    date: '2026-10-22',
    clockIn: '08:44',
    clockOut: '17:40',
    status: 'Terlambat',
    overtimeHours: 0,
    lateMinutes: 14,
    notes: 'Kendala commuter line Bekasi (Terlambat 14 menit)',
  },
  {
    id: 'att-22-9',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-9',
    date: '2026-10-22',
    status: 'Cuti',
    overtimeHours: 0,
    lateMinutes: 0,
    notes: 'Cuti Tahunan terencana',
  },
  {
    id: 'att-22-10',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-10',
    date: '2026-10-22',
    clockIn: '08:30',
    clockOut: '18:00',
    status: 'Hadir',
    overtimeHours: 0,
    lateMinutes: 0,
    notes: 'Executive Board Meeting Lantai 20',
  },
];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-1',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-4',
    leaveType: 'Cuti Tahunan',
    startDate: '2026-10-24',
    endDate: '2026-10-25',
    totalDays: 2,
    reason: 'Keperluan keluarga di luar kota',
    status: 'Disetujui',
    approvedBy: 'Aditya Pratama, S.Psi',
  },
  {
    id: 'leave-2',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-3',
    leaveType: 'Cuti Tahunan',
    startDate: '2026-11-03',
    endDate: '2026-11-05',
    totalDays: 3,
    reason: 'Rencana mudik tahunan',
    status: 'Menunggu',
  },
];

export const INITIAL_LOANS: EmployeeLoan[] = [
  {
    id: 'loan-1',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-4',
    loanType: 'Pinjaman Fleksibel',
    totalAmount: 12000000,
    tenorMonths: 12,
    monthlyInstallment: 1000000,
    remainingAmount: 7000000,
    startDate: '2024-03-01',
    reason: 'Renovasi tempat tinggal darurat',
    status: 'Aktif',
  },
  {
    id: 'loan-2',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-5',
    loanType: 'Kasbon Darurat',
    totalAmount: 2000000,
    tenorMonths: 4,
    monthlyInstallment: 500000,
    remainingAmount: 1000000,
    startDate: '2024-08-01',
    reason: 'Biaya pengobatan anggota keluarga',
    status: 'Aktif',
  },
];

export const INITIAL_KPIS: EmployeeKPI[] = [
  {
    id: 'kpi-1',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-4',
    period: '2026',
    quarter: 'Q3',
    metrics: [
      { id: 'm1', name: 'Sprint Velocity & Delivery On-time', target: 95, actual: 98, weight: 35, unit: '%', score: 36.1 },
      { id: 'm2', name: 'Code Quality & Low Bug Rate', target: 90, actual: 92, weight: 30, unit: '%', score: 30.6 },
      { id: 'm3', name: 'Compliance & Security Best Practices', target: 100, actual: 100, weight: 20, unit: '%', score: 20.0 },
      { id: 'm4', name: 'Cross-functional Collaboration', target: 85, actual: 88, weight: 15, unit: 'Point', score: 15.5 },
    ],
    finalScore: 92.2,
    feedback: 'Performa sangat memuaskan, proaktif menyelesaikan arsitektur modul migrasi dan integrasi PPh 21 TER.',
    reviewer: 'Aditya Pratama, S.Psi',
    evaluatedAt: '2026-10-05',
  },
  {
    id: 'kpi-2',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-2',
    period: '2026',
    quarter: 'Q3',
    metrics: [
      { id: 'm1', name: 'Akurasi Penggajian & PPh 21 TER', target: 100, actual: 100, weight: 40, unit: '%', score: 40.0 },
      { id: 'm2', name: 'Ketepatan Waktu Rilis Slip Gaji', target: 100, actual: 99, weight: 30, unit: '%', score: 29.7 },
      { id: 'm3', name: 'Kepatuhan Pelaporan BPJS TK & Kes', target: 100, actual: 100, weight: 30, unit: '%', score: 30.0 },
    ],
    finalScore: 99.7,
    feedback: 'Sangat teliti dan tidak ada kesalahan rekonsiliasi selama kuartal ini.',
    reviewer: 'Aditya Pratama, S.Psi',
    evaluatedAt: '2026-10-06',
  },
];

export const INITIAL_COMPLIANCE: ComplianceRecord[] = [
  {
    id: 'comp-1',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-9',
    level: 'SP 1',
    violationReason: 'Keterlambatan berturut-turut lebih dari 5 kali dalam sebulan dan kelalaian SOP pemeriksaan berkala armada operasional kantor',
    letterNumber: '007/HRD-SP/NTM/VIII/2026',
    issueDate: '2026-08-12',
    validUntil: '2027-02-12',
    signedBy: 'Aditya Pratama, S.Psi',
    status: 'Aktif',
  },
];

export const INITIAL_JOB_REQUISITIONS: JobRequisition[] = [
  {
    id: 'req-1',
    tenantId: 'tenant-ntm',
    reqNumber: 'FPTK/ENG/2026/001',
    position: 'Senior DevOps & Site Reliability Engineer',
    grade: 'Grade 3 s/d Grade 4',
    gradeMin: 'Grade 3 - Lead / Supervisor',
    gradeMax: 'Grade 4 - Manager / Specialist',
    department: 'Engineering',
    headcount: 2,
    reason: 'Ekspansi Bisnis',
    isBudgeted: true,
    justification: 'Kebutuhan migrasi multi-cloud infrastruktur microservices dan peningkatan SLA uptime sistem perbankan ke 99.99%. Beban deployment sprint naik 200%.',
    reportingToDepartment: 'Technology & Product Division',
    reportingToTitle: 'VP of Technology & Architecture',
    supervisedStaffCount: 2,
    mainResponsibilities: 'Memimpin implementasi Kubernetes cluster, mengelola CI/CD pipeline GitLab/ArgoCD, monitoring Prometheus & Grafana, serta audit Disaster Recovery.',
    requirements: 'Min. S1 Teknik Informatika/Ilmu Komputer. Pengalaman min. 4 tahun Kubernetes, Docker, Terraform IaC, AWS/GCP, dan otomasi CI/CD pipeline.',
    targetJoinDate: '2026-11-01',
    status: 'Disetujui',
    requesterName: 'Bambang Sudirja',
    requesterTitle: 'VP Technology',
    approvedBy: 'Aditya Pratama',
    approverTitle: 'Head of People & Culture',
    approvalDate: '2026-09-12',
    approvalNotes: 'Disetujui sesuai RKAP kuartal 4 tahun anggaran berjalan.',
    createdAt: '2026-09-10',
    minExperience: '4+ Tahun',
    educationMin: 'S1 Teknik Informatika / Sistem Informasi',
    skills: 'Kubernetes, Terraform, AWS, Docker, CI/CD, Linux Server, Shell Scripting',
  },
  {
    id: 'req-2',
    tenantId: 'tenant-ntm',
    reqNumber: 'FPTK/HRD/2026/002',
    position: 'People Partner / HR Operations Specialist',
    grade: 'Grade 2 s/d Grade 3',
    gradeMin: 'Grade 2 - Officer / Senior Staff',
    gradeMax: 'Grade 3 - Lead / Supervisor',
    department: 'People & Culture',
    headcount: 1,
    reason: 'Posisi Baru (New Position)',
    isBudgeted: true,
    justification: 'Peningkatan jumlah karyawan dari 150 menjadi 350 orang memerlukan dedicated HR Operations untuk menangani compliance PP 35, klaim BPJS, dan otomasi HRIS.',
    reportingToDepartment: 'People & Culture Department',
    reportingToTitle: 'Head of People & Operations',
    supervisedStaffCount: 1,
    mainResponsibilities: 'Operasional payroll bulanan, pelaporan ketenagakerjaan Disnaker, onboarding karyawan baru, evaluasi masa probation, dan mediasi hubungan industrial.',
    requirements: 'Min. S1 Psikologi/Hukum/Manajemen SDM. Pengalaman min. 2 tahun pengelolaan HRIS, payroll & BPJS, kepatuhan UU Ketenagakerjaan/PP 35.',
    targetJoinDate: '2026-11-15',
    status: 'Disetujui',
    requesterName: 'Aditya Pratama',
    requesterTitle: 'Head of People',
    approvedBy: 'Farhan Maulana',
    approverTitle: 'Chief Operating Officer (COO)',
    approvalDate: '2026-09-27',
    approvalNotes: 'Alokasi headcount disetujui untuk mendukung program skalasi perusahaan.',
    createdAt: '2026-09-25',
    minExperience: '2+ Tahun',
    educationMin: 'S1 Psikologi / Manajemen SDM / Hukum',
    skills: 'UU Ketenagakerjaan, HRIS, Payroll, BPJS Kesehatan & Ketenagakerjaan, Hubungan Industrial',
  },
  {
    id: 'req-3',
    tenantId: 'tenant-ntm',
    reqNumber: 'FPTK/FIN/2026/003',
    position: 'Senior Tax & Corporate Finance Analyst',
    grade: 'Grade 3 - Lead / Supervisor',
    gradeMin: 'Grade 2 - Officer / Senior Staff',
    gradeMax: 'Grade 3 - Lead / Supervisor',
    department: 'Finance & Accounting',
    headcount: 1,
    reason: 'Penggantian Karyawan Resign',
    replacementFor: 'Siti Rahmawati (Resign per 31 Oktober 2026)',
    isBudgeted: true,
    justification: 'Menggantikan posisi Senior Tax Officer yang mengundurkan diri agar pelaporan SPT Tahunan Badan dan compliance withholding tax PPh 21 TER tidak terlambat.',
    reportingToDepartment: 'Finance, Tax & Audit Division',
    reportingToTitle: 'Finance & Accounting Manager',
    supervisedStaffCount: 0,
    mainResponsibilities: 'Rekonsiliasi fiskal dan komersial bulanan, pengelolaan e-Faktur dan e-Bupot Unifikasi, penyusunan tax planning, dan koordinasi dengan auditor eksternal Big 4.',
    requirements: 'Min. S1 Akuntansi/Perpajakan dengan Brevet A & B. Menguasai e-Faktur, PPh 21 TER, PPh 23/26, pelaporan SPT Tahunan Badan & PSAK audit.',
    targetJoinDate: '2026-12-01',
    status: 'Menunggu Approval',
    requesterName: 'Maya Indriani',
    requesterTitle: 'Finance Manager',
    approvedBy: 'Dewi Lestari',
    approverTitle: 'Chief Financial Officer (CFO)',
    createdAt: '2026-10-15',
    minExperience: '3+ Tahun',
    educationMin: 'S1 Akuntansi / Perpajakan',
    skills: 'Brevet A&B, e-Faktur, PPh 21 TER 2024, Tax Audit, PSAK Akuntansi, SAP/ERP',
  },
  {
    id: 'req-4',
    tenantId: 'tenant-ntm',
    reqNumber: 'FPTK/MKT/2026/004',
    position: 'Performance Marketing Specialist',
    grade: 'Grade 2 s/d Grade 3',
    gradeMin: 'Grade 2 - Officer / Senior Staff',
    gradeMax: 'Grade 3 - Lead / Supervisor',
    department: 'Marketing',
    headcount: 1,
    reason: 'Ekspansi Bisnis',
    isBudgeted: true,
    justification: 'Dibutuhkan untuk akselerasi campaign promosi akhir tahun.',
    targetJoinDate: '2026-11-15',
    status: 'Dicabut (Retracted)',
    requesterName: 'Siti Rahmawati',
    requesterTitle: 'VP Marketing',
    approvedBy: 'Aditya Pratama',
    approverTitle: 'Head of People & Culture',
    approvalDate: '2026-09-20',
    retractedAt: '2026-09-28',
    retractedBy: 'Direksi / BOD',
    retractedReason: 'Pembekuan Headcount kuartal 4 akibat penyesuaian target pertumbuhan korporasi.',
    createdAt: '2026-09-15',
    requirements: 'S1 Marketing / Komunikasi, min. 3 tahun Google Ads & Meta Ads.',
  },
];

export const INITIAL_JOB_VACANCIES: JobVacancy[] = [
  {
    id: 'job-1',
    tenantId: 'tenant-ntm',
    jobRequisitionId: 'req-1',
    title: 'Senior DevOps & Site Reliability Engineer',
    department: 'Engineering',
    employmentType: 'Tetap',
    grade: 'Grade 4 - Manager / Specialist',
    openings: 2,
    minExperience: '4+ Tahun',
    salaryRange: 'Rp 18.000.000 - Rp 25.000.000',
    status: 'Buka',
    postedDate: '2026-09-15',
    requirements: 'S1 Teknik Informatika/Sistem Informasi, Min. 4 Tahun pengalaman Kubernetes, Docker, CI/CD, AWS/GCP, Sertifikasi CKA/CKS diutamakan.',
    description: 'Bertanggung jawab atas ketersediaan infrastruktur cloud high-availability 99.99%, arsitektur container Kubernetes, dan otomasi pipeline CI/CD.',
    activeChannels: ['Jobstreet', 'LinkedIn', 'Glints', 'Website Karir'],
    channelBroadcastStatus: {
      Jobstreet: 'Aktif',
      LinkedIn: 'Aktif',
      Glints: 'Aktif',
      'Website Karir': 'Aktif',
      Kalibrr: 'Nonaktif',
    },
    applicantsCount: 18,
  },
  {
    id: 'job-2',
    tenantId: 'tenant-ntm',
    jobRequisitionId: 'req-2',
    title: 'People Partner / HR Operations Specialist',
    department: 'People & Culture',
    employmentType: 'Kontrak',
    grade: 'Grade 2 - Officer / Senior Staff',
    openings: 1,
    minExperience: '2+ Tahun',
    salaryRange: 'Rp 9.000.000 - Rp 13.000.000',
    status: 'Buka',
    postedDate: '2026-10-01',
    requirements: 'S1 Psikologi/Hukum/Manajemen, Min. 2 Tahun pengalaman HR Generalist, Payroll, BPJS & Hubungan Industrial PP 35/2021.',
    description: 'Mendukung operasional people operations, penanganan perselisihan industrial, integrasi BPJS Ketenagakerjaan & Kesehatan, dan onboarding talenta baru.',
    activeChannels: ['Jobstreet', 'LinkedIn', 'Kalibrr', 'Website Karir'],
    channelBroadcastStatus: {
      Jobstreet: 'Aktif',
      LinkedIn: 'Aktif',
      Kalibrr: 'Aktif',
      'Website Karir': 'Aktif',
      Glints: 'Nonaktif',
    },
    applicantsCount: 12,
  },
];

export const INITIAL_COMPETENCY_TEST_TYPES: CompetencyTestTypeSetting[] = [
  {
    id: 'test-tech',
    name: 'Tes Teknis / Coding & Arsitektur',
    category: 'Hard Skill',
    passingGrade: 75,
    durationMinutes: 90,
    method: 'Live Coding',
    description: 'Evaluasi algoritma, arsitektur kode, problem solving, optimasi query, dan hands-on debugging.',
    weightPercent: 35,
    isActive: true,
  },
  {
    id: 'test-psych',
    name: 'Psikotes (DISC / MBTI / Karakter)',
    category: 'Soft Skill',
    passingGrade: 70,
    durationMinutes: 60,
    method: 'Online Test',
    description: 'Analisis profil kepribadian kerja, stabilitas emosi, daya tahan terhadap stres, dan gaya kepemimpinan.',
    weightPercent: 20,
    isActive: true,
  },
  {
    id: 'test-cognitive',
    name: 'Tes Logika & Numerik (GMA / TPA)',
    category: 'Kognitif & Logika',
    passingGrade: 75,
    durationMinutes: 45,
    method: 'Online Test',
    description: 'Uji penalaran logis abstrak, analisis data grafik/numerik, dan ketepatan pemecahan masalah cepat.',
    weightPercent: 15,
    isActive: true,
  },
  {
    id: 'test-lang',
    name: 'Kemahiran Bahasa Inggris Bisnis',
    category: 'Bahasa',
    passingGrade: 70,
    durationMinutes: 60,
    method: 'Online Test',
    description: 'Pengujian listening comprehension, reading bisnis, korespondensi profesional, dan kelancaran berbicara.',
    weightPercent: 15,
    isActive: true,
  },
  {
    id: 'test-case',
    name: 'Case Study & Presentasi Bisnis',
    category: 'Studi Kasus',
    passingGrade: 80,
    durationMinutes: 120,
    method: 'Presentasi',
    description: 'Simulasi penyelesaian masalah riil perusahaan, formulasi strategi implementasi, dan presentasi dewan penguji.',
    weightPercent: 15,
    isActive: true,
  },
  {
    id: 'test-work',
    name: 'Tes Praktik Kerja Langsung (Work Sample)',
    category: 'Praktik Kerja',
    passingGrade: 75,
    durationMinutes: 90,
    method: 'Tatap Muka',
    description: 'Uji coba penanganan tugas langsung sesuai SOP keselamatan, kualitas teknis, dan ketelitian kerja lapangan.',
    weightPercent: 15,
    isActive: true,
  },
];

export const INITIAL_INTERVIEW_TYPES: InterviewTypeSetting[] = [
  {
    id: 'int-tech',
    name: 'Wawancara Teknis & User (Technical Deep-Dive)',
    targetRole: 'Engineering & Product Teams',
    description: 'Evaluasi mendalam kompetensi keahlian teknis, pemahaman arsitektur sistem, problem solving, dan best practice coding.',
    interviewerRoles: 'Tech Lead / Principal Engineer / User Manager',
    isActive: true,
    criteria: [
      {
        id: 'crit-tech-1',
        name: 'Arsitektur Sistem & Perancangan Solusi',
        description: 'Pemahaman mendalam skalabilitas, high-availability, pemodelan database, dan clean architecture.',
        weightPercent: 30,
      },
      {
        id: 'crit-tech-2',
        name: 'Problem Solving & Analisis Akar Masalah (RCA)',
        description: 'Metodologi sistematis saat menangani incident, debugging, dan bottleneck performa sistem.',
        weightPercent: 30,
      },
      {
        id: 'crit-tech-3',
        name: 'Kualitas Kode, Testing & Security Standards',
        description: 'Kepatuhan standar clean code, unit/integration testing, CI/CD, dan prinsip keamanan aplikasi OWASP.',
        weightPercent: 20,
      },
      {
        id: 'crit-tech-4',
        name: 'Penguasaan Tech Stack & Framework Terkini',
        description: 'Kefasihan menggunakan tools utama posisi (TypeScript, Node/Go, Docker, Kubernetes, Cloud GCP/AWS).',
        weightPercent: 20,
      },
    ],
  },
  {
    id: 'int-hr',
    name: 'Wawancara HR & Budaya Kerja (Culture Fit & Values)',
    targetRole: 'Semua Posisi Karyawan',
    description: 'Evaluasi keselarasan nilai budaya perusahaan (Nusantara Values), etika, motivasi kerja, dan integritas pribadi.',
    interviewerRoles: 'HRBP / Head of People & Talent Acquisition',
    isActive: true,
    criteria: [
      {
        id: 'crit-hr-1',
        name: 'Kesesuaian Nilai Budaya Perusahaan & Integritas',
        description: 'Karakter jujur, akuntabel, saling menghargai, dan komitmen terhadap kode etik korporat.',
        weightPercent: 30,
      },
      {
        id: 'crit-hr-2',
        name: 'Motivasi Karir, Loyalitas & Stabilitas',
        description: 'Kejelasan alasan melamar, orientasi jangka panjang, dan rekam jejak retensi kerja yang wajar.',
        weightPercent: 25,
      },
      {
        id: 'crit-hr-3',
        name: 'Komunikasi Interpersonal & Kolaborasi Tim',
        description: 'Artikulasi gagasan jelas, empati, pendengar aktif, dan bebas dari ego sentris (team player).',
        weightPercent: 25,
      },
      {
        id: 'crit-hr-4',
        name: 'Ketahanan Menghadapi Tekanan & Penerimaan Masukan',
        description: 'Kedewasaan emosional saat menghadapi tenggat waktu ketat atau umpan balik kritis (constructive feedback).',
        weightPercent: 20,
      },
    ],
  },
  {
    id: 'int-mgmt',
    name: 'Wawancara Manajerial & Kepemimpinan (Leadership)',
    targetRole: 'Team Lead, Manager, Senior Specialist',
    description: 'Penilaian kapabilitas kepemimpinan orang (people management), eksekusi strategi bisnis, dan pengambilan keputusan.',
    interviewerRoles: 'Department Head / VP of Department',
    isActive: true,
    criteria: [
      {
        id: 'crit-mgmt-1',
        name: 'Visi Strategis & Penyelarasan OKR / Sasaran Bisnis',
        description: 'Kemampuan menerjemahkan strategi makro perusahaan ke dalam prioritas target kerja tim bawahan.',
        weightPercent: 30,
      },
      {
        id: 'crit-mgmt-2',
        name: 'People Development, Coaching & Delegasi',
        description: 'Keahlian membimbing anggota tim, mendelegasikan tugas secara adil, dan mengembangkan suksesi talenta.',
        weightPercent: 30,
      },
      {
        id: 'crit-mgmt-3',
        name: 'Ketegasan Pengambilan Keputusan & Manajemen Risiko',
        description: 'Keberanian membuat keputusan krusial di situasi ambigu dengan perhitungan mitigasi risiko terukur.',
        weightPercent: 20,
      },
      {
        id: 'crit-mgmt-4',
        name: 'Negosiasi, Pengaruh & Sinergi Lintas Divisi',
        description: 'Kemampuan merangkul pemangku kepentingan (stakeholder management) untuk mencapai konsensus produktif.',
        weightPercent: 20,
      },
    ],
  },
  {
    id: 'int-board',
    name: 'Wawancara Direksi & Eksekutif (Final Board Review)',
    targetRole: 'Level Manager ke Atas & Strategic Hires',
    description: 'Validasi akhir oleh jajaran Direksi mengenai kesesuaian visi korporasi, penciptaan nilai bisnis, dan komitmen jangka panjang.',
    interviewerRoles: 'Chief Executive Officer (CEO) / Board of Directors',
    isActive: true,
    criteria: [
      {
        id: 'crit-board-1',
        name: 'Visi Bisnis Korporat & Nilai Tambah (Value Creation)',
        description: 'Pemahaman arah industri, pertumbuhan bisnis perusahaan, dan potensi penciptaan revenue/efisiensi.',
        weightPercent: 35,
      },
      {
        id: 'crit-board-2',
        name: 'Kredibilitas Profesional & Tata Kelola Perusahaan (GCG)',
        description: 'Reputasi rekam jejak bersih, integritas hukum/etika bisnis, dan komitmen kepatuhan regulasi.',
        weightPercent: 35,
      },
      {
        id: 'crit-board-3',
        name: 'Ketahanan Mental Eksekutif & Resiliensi Krisis',
        description: 'Kesiapan memikul tanggung jawab besar korporasi dalam situasi krisis atau disrupsi pasar.',
        weightPercent: 30,
      },
    ],
  },
];

export const INITIAL_CANDIDATES: Candidate[] = [
  // 3. Incoming (Lamaran Masuk Otomatis + Resume Parsing)
  {
    id: 'cand-4',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-1',
    name: 'Farhan Ramadhani',
    email: 'farhan.r@devops.id',
    phone: '081211223344',
    lastCompany: 'Tech Corp Asia',
    expectedSalary: 21000000,
    stage: 'Applied',
    appliedDate: '2026-10-18',
    sourcePortal: 'LinkedIn',
    resumeParsed: true,
    cvFileName: 'CV_Farhan_Ramadhani_DevOps.pdf',
    cvFileSize: '1.4 MB',
    aiMatchScore: 92,
    matchedKeywords: ['Kubernetes', 'Docker', 'Terraform', 'AWS', '4+ thn exp'],
    missingKeywords: ['ArgoCD'],
    isShortlisted: true,
    screeningNotes: 'Ekstraksi 100% valid. Rekomendasi kualifikasi sangat tinggi untuk lowongan Cloud Engineer.',
    parsedData: {
      fullName: 'Farhan Ramadhani',
      email: 'farhan.r@devops.id',
      phone: '081211223344',
      currentTitle: 'Cloud Infrastructure Engineer',
      currentCompany: 'Tech Corp Asia',
      totalExperienceYears: 4,
      education: 'S1 Teknik Informatika',
      university: 'Institut Teknologi Bandung (ITB)',
      topSkills: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'CI/CD', 'Prometheus'],
      extractionScore: 100,
      parsedAt: '2026-10-18 11:24',
    },
  },
  {
    id: 'cand-5',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-2',
    name: 'Siti Rahmawati',
    email: 'siti.rahma@workmail.id',
    phone: '081399887711',
    lastCompany: 'Retail Sejahtera Group',
    expectedSalary: 11500000,
    stage: 'Applied',
    appliedDate: '2026-10-19',
    sourcePortal: 'Jobstreet',
    resumeParsed: true,
    cvFileName: 'Resume_Siti_Rahmawati_HR.pdf',
    cvFileSize: '880 KB',
    aiMatchScore: 84,
    matchedKeywords: ['People Operations', 'BPJS Kesehatan/TK', 'Payroll HRIS', 'S1 Psikologi'],
    missingKeywords: ['Hubungan Industrial (Bipartit)'],
    isShortlisted: true,
    screeningNotes: 'Ekstraksi 85% valid. Sesuai spesifikasi posisi HR Operations Officer.',
    parsedData: {
      fullName: 'Siti Rahmawati',
      email: 'siti.rahma@workmail.id',
      phone: '081399887711',
      currentTitle: 'HR Operations Officer',
      currentCompany: 'Retail Sejahtera Group',
      totalExperienceYears: 3,
      education: 'S1 Psikologi',
      university: 'Universitas Indonesia (UI)',
      topSkills: ['People Operations', 'BPJS Kesehatan/TK', 'Payroll HRIS', 'Talent Acquisition'],
      extractionScore: 85,
      parsedAt: '2026-10-19 14:10',
    },
  },
  {
    id: 'cand-8-scan',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-1',
    name: 'Budi Darmawan (Dokumen Scan)',
    email: 'budi.darmawan@email.id',
    phone: '081299001122',
    lastCompany: 'Pelamar Baru',
    expectedSalary: 18000000,
    stage: 'Applied',
    appliedDate: '2026-10-20',
    sourcePortal: 'Offline / Walk-In',
    resumeParsed: false,
    cvFileName: 'Scan_Dokumen_CV_Budi.pdf',
    cvFileSize: '3.2 MB',
    aiMatchScore: 28,
    matchedKeywords: [],
    missingKeywords: ['Kualifikasi Teknis Cloud', 'Sertifikasi AWS/GCP', 'Pengalaman 4+ Thn'],
    isShortlisted: false,
    screeningNotes: 'Parsing gagal (10%) karena berkas scan buram/tanpa teks OCR. Sistem ragu melakukan screening otomatis — wajib screening & input manual oleh HR.',
    parsedData: {
      fullName: 'Budi Darmawan',
      email: 'budi.darmawan@email.id',
      phone: '081299001122',
      currentTitle: 'Tidak Terdeteksi (Scan Dokumen)',
      currentCompany: 'Belum Terbaca',
      totalExperienceYears: 0,
      education: 'Tidak Terdeteksi',
      university: 'Tidak Terbaca',
      topSkills: ['Teks dokumen minim terbaca', 'Perlu verifikasi data'],
      extractionScore: 10,
      parsedAt: '2026-10-20 09:15',
    },
  },

  // 4. Applied (Pelamar dengan Data Screening Lengkap)
  {
    id: 'cand-3',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-2',
    name: 'Nadia Salsabila',
    email: 'nadia.salsa@example.com',
    phone: '081577665544',
    lastCompany: 'BUMN Logistik',
    expectedSalary: 11000000,
    stage: 'Applied',
    appliedDate: '2026-10-12',
    sourcePortal: 'Jobstreet',
    resumeParsed: true,
    cvFileName: 'CV_Nadia_Salsabila.pdf',
    cvFileSize: '1.1 MB',
    aiMatchScore: 91,
    matchedKeywords: ['People Partner', 'HR Operations', 'BPJS', '2+ thn exp', 'S1 Psikologi'],
    missingKeywords: ['Penyelesaian PHK Bipartit'],
    isShortlisted: true,
    screeningNotes: 'Kualifikasi sangat cocok dengan kebutuhan People Operations NTM.',
    parsedData: {
      fullName: 'Nadia Salsabila',
      email: 'nadia.salsa@example.com',
      phone: '081577665544',
      currentTitle: 'People Operations Specialist',
      currentCompany: 'BUMN Logistik',
      totalExperienceYears: 3,
      education: 'S1 Psikologi',
      university: 'Universitas Indonesia (UI)',
      topSkills: ['People Partner', 'HR Operations', 'BPJS', 'Talent Management'],
      extractionScore: 94,
      parsedAt: '2026-10-12 10:15',
    },
  },
  {
    id: 'cand-6',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-1',
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@cloud.com',
    phone: '081988223311',
    lastCompany: 'SaaS Startup Pte Ltd',
    expectedSalary: 23000000,
    stage: 'Applied',
    appliedDate: '2026-10-13',
    sourcePortal: 'LinkedIn',
    resumeParsed: true,
    cvFileName: 'Ahmad_Fauzi_Resume_2026.pdf',
    cvFileSize: '1.2 MB',
    aiMatchScore: 94,
    matchedKeywords: ['Kubernetes', 'Terraform', 'CI/CD', 'AWS', '4+ thn exp', 'Linux Kernel'],
    missingKeywords: ['ArgoCD GitOps'],
    isShortlisted: true,
    screeningNotes: 'Shortlisted! Sangat direkomendasikan untuk tahap Tes Kompetensi Arsitektur Cloud.',
    parsedData: {
      fullName: 'Ahmad Fauzi',
      email: 'ahmad.fauzi@cloud.com',
      phone: '081988223311',
      currentTitle: 'Senior Cloud Engineer',
      currentCompany: 'SaaS Startup Pte Ltd',
      totalExperienceYears: 5,
      education: 'S1 Ilmu Komputer',
      university: 'Universitas Gadjah Mada (UGM)',
      topSkills: ['Kubernetes', 'Terraform', 'CI/CD', 'AWS', 'Linux Kernel'],
      extractionScore: 98,
      parsedAt: '2026-10-13 14:30',
    },
  },

  // 5. Assessment / Test (Tes Kompetensi & Skoring)
  {
    id: 'cand-7',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-1',
    name: 'Budi Santoso',
    email: 'budi.santoso@engineer.net',
    phone: '081766554433',
    lastCompany: 'Fintech Payment Gateway',
    expectedSalary: 20000000,
    stage: 'Assessment',
    appliedDate: '2026-10-10',
    sourcePortal: 'Glints',
    resumeParsed: true,
    testType: 'Tes Teknis / Coding',
    testScore: 88,
    testPassingGrade: 75,
    testStatus: 'Lulus',
    testAssignedDate: '2026-10-14',
    testNotes: 'Skor 88/100 (Passing Grade 75). Berhasil mengonfigurasi multi-node k8s cluster dan zero-downtime rolling update.',
    competencyScores: [
      {
        id: 'c-score-1',
        testTypeId: 'test-tech',
        testTypeName: 'Tes Teknis / Coding & Arsitektur',
        category: 'Hard Skill',
        score: 88,
        passingGrade: 75,
        status: 'Lulus',
        evaluatedAt: '2026-10-14 14:30',
        evaluator: 'Fahri Hidayat (Lead DevOps)',
        notes: 'Sangat menguasai containerization dan zero-downtime rolling update.',
        details: {
          codeQuality: 90,
          problemSolving: 88,
          executionSpeedMinutes: 55,
        },
      },
    ],
  },

  // 6. Interview (Wawancara Terjadwal, Kalender & Scorecard)
  {
    id: 'cand-1',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-1',
    name: 'Gilang Ramadhan',
    email: 'gilang.r@example.com',
    phone: '081299887766',
    lastCompany: 'Fintech Unicorn Indonesia',
    expectedSalary: 22000000,
    stage: 'Interview',
    appliedDate: '2026-09-20',
    sourcePortal: 'LinkedIn',
    testScore: 88,
    interviewDate: '2026-10-24 14:00',
    interviewTimeEnd: '15:30',
    interviewFormat: 'Offline',
    interviewFacilityRoom: 'Ruang Meeting VIP - Lantai 18',
    interviewFacilityRoomBookingId: 'BKG-ROOM-2026-003',
    interviewNotificationsSent: true,
    interviewNotificationsSentAt: '2026-10-22 11:30',
    interviewScheduleStatus: 'Terkonfirmasi (Siap Hari-H)',
    interviewer: 'Aditya Pratama, M.Psi., Budi Santoso, S.Kom.',
    interviewers: [
      {
        id: 'inv-1',
        name: 'Aditya Pratama, M.Psi.',
        title: 'Head of People & Organization',
        department: 'Human Resources',
        email: 'aditya.pratama@nusantara.id',
        role: 'Lead Interviewer / HRBP',
        status: 'Terkonfirmasi',
        scorecardRatings: { 'crit-tech-arch': 5, 'crit-tech-code': 4, 'crit-tech-scale': 5, 'crit-tech-team': 5 },
        averageStars: 4.75,
        calculatedScore: 95,
        recommendation: 'Sangat cocok',
        evaluationNotes: 'Pemahaman mendalam mengenai arsitektur distributed systems dan AWS cost optimization. Sangat komunikatif dan selaras dengan budaya Nusantara.',
        evaluatedAt: '2026-10-24 15:30',
      },
      {
        id: 'inv-2',
        name: 'Budi Santoso, S.Kom.',
        title: 'Lead Software Architect',
        department: 'Engineering & Technology',
        email: 'budi.santoso@nusantara.id',
        role: 'User Interviewer (Departemen)',
        status: 'Terkonfirmasi',
        scorecardRatings: { 'crit-tech-arch': 5, 'crit-tech-code': 4, 'crit-tech-scale': 4, 'crit-tech-team': 4 },
        averageStars: 4.25,
        calculatedScore: 85,
        recommendation: 'Sangat cocok',
        evaluationNotes: 'Sangat menguasai design pattern, scalability microservices, dan observability. Layak memimpin tim engineering.',
        evaluatedAt: '2026-10-24 15:45',
      },
    ],
    meetingPlatform: 'Ruang Interview Kantor',
    meetingLink: 'Ruang Meeting VIP - Lantai 18',
    interviewScore: 90,
    interviewScorecard: {
      technical: 5,
      culturalFit: 4,
      communication: 5,
      ratings: { 'crit-tech-arch': 5, 'crit-tech-code': 4, 'crit-tech-scale': 5, 'crit-tech-team': 5 },
      recommendation: 'Direkomendasikan Lolos',
    },
    userRecommendation: 'Sangat Cocok / Direkomendasikan (Strong Hire)',
    interviewNotes: 'Sangat kuat di mitigasi disaster recovery dan cost-optimization AWS. Rekomendasi lolos ke tahap Offering Letter atau Medical Check-Up.',
  },
  {
    id: 'cand-1b',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-1',
    name: 'Bayu Saputra',
    email: 'bayu.saputra@example.com',
    phone: '081233445566',
    lastCompany: 'Software House Bandung',
    expectedSalary: 18000000,
    stage: 'Interview',
    appliedDate: '2026-09-22',
    sourcePortal: 'JobStreet',
    testScore: 82,
    interviewDate: '2026-10-26 10:00',
    interviewTimeEnd: '11:30',
    interviewFormat: 'Online',
    meetingPlatform: 'Google Meet',
    meetingLink: 'https://meet.google.com/bayu-interview',
    interviewer: 'Aditya Pratama, M.Psi.',
    interviewers: [
      {
        id: 'inv-1b-1',
        name: 'Aditya Pratama, M.Psi.',
        title: 'Head of People & Organization',
        department: 'Human Resources',
        email: 'aditya.pratama@nusantara.id',
        role: 'Lead Interviewer / HRBP',
        status: 'Terkonfirmasi',
      },
    ],
    interviewScheduleStatus: 'Dijadwalkan',
    interviewNotes: 'Sesi wawancara terjadwal. Menunggu pelaksanaan dan pengisian nilai evaluasi per panelis.',
  },
  {
    id: 'cand-mcu-1',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-1',
    name: 'Dimas Wicaksono, S.T.',
    email: 'dimas.w@example.com',
    phone: '081277665544',
    lastCompany: 'Digital Solutions Corp',
    expectedSalary: 19500000,
    stage: 'Medical Check-Up',
    appliedDate: '2026-09-15',
    sourcePortal: 'LinkedIn',
    testScore: 88,
    interviewScore: 92,
    userRecommendation: 'Sangat Cocok / Direkomendasikan (Strong Hire)',
    interviewFormat: 'Offline',
    interviewFacilityRoom: 'Ruang Kolaborasi B - Lantai 18',
    mcuStatus: 'Fit (Lolos)',
    mcuDate: '2026-10-25',
    mcuClinicOrHospital: 'RS Siloam Semanggi / Prodia Lab',
    mcuPackage: 'Paket Standar Pra-Kerja (Darah Lengkap, Rontgen Thorax, Urin, Fisik)',
    mcuNotes: 'Hasil lab lengkap terbit: Tekanan darah 120/80 mmHg, rontgen thorax normal, bebas narkotika, dinyatakan Fit for Work.',
    mcuDecision: 'Lolos ke Offering',
  },

  // 7. Offering (Kalkulator THP / PPh 21 TER & Dokumen Resmi)
  {
    id: 'cand-2',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-1',
    name: 'Kevin Wijaya',
    email: 'kevin.w@example.com',
    phone: '081388776655',
    lastCompany: 'E-Commerce Marketplace',
    expectedSalary: 20000000,
    stage: 'Offered',
    appliedDate: '2026-09-18',
    sourcePortal: 'LinkedIn',
    interviewDate: '2026-10-10 10:00',
    interviewer: 'Aditya Pratama',
    interviewScore: 92,
    interviewNotes: 'Direkomendasikan menerima offering letter level L4.',
    offeredSalary: 21000000,
    offeringDocNumber: '001/OL-HRD/NTM/X/2026',
    offeringSentDate: '2026-10-11',
    offeringStatus: 'Terkirim',
    // Menunggu respon kandidat: Cocok, Nego, atau Tidak Cocok
  },
  {
    id: 'cand-offer-cocok',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-1',
    name: 'Anisa Rahmawati',
    email: 'anisa.rahma@techcorp.id',
    phone: '081299887766',
    lastCompany: 'Fintech Solutions Indonesia',
    expectedSalary: 18000000,
    stage: 'Offered',
    appliedDate: '2026-09-20',
    sourcePortal: 'LinkedIn',
    interviewDate: '2026-10-12 14:00',
    interviewer: 'Aditya Pratama',
    interviewScore: 95,
    interviewNotes: 'Kandidat sangat kompeten dan memiliki pemahaman domain yang kuat.',
    offeredSalary: 19500000,
    offeringDocNumber: '002/OL-HRD/NTM/X/2026',
    offeringSentDate: '2026-10-13',
    offeringStatus: 'Diterima',
    offeringCandidateResponse: 'Cocok',
    offeringResponseDate: '2026-10-14',
    offeringResponseNotes: 'Kandidat menyetujui seluruh paket penawaran kerja (Cocok) dan siap bergabung.',
  },
  {
    id: 'cand-offer-nego',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-3',
    name: 'Bramantyo Wicaksono',
    email: 'bram.wicaksono@multimedia.com',
    phone: '081765432109',
    lastCompany: 'Digital Agency Asia',
    expectedSalary: 15000000,
    stage: 'Offered',
    appliedDate: '2026-09-22',
    sourcePortal: 'Jobstreet',
    interviewDate: '2026-10-14 11:00',
    interviewer: 'Maya Santoso',
    interviewScore: 89,
    interviewNotes: 'Kandidat kreatif dengan portofolio visual kelas atas.',
    offeredSalary: 15500000,
    offeringDocNumber: '003/OL-HRD/NTM/X/2026',
    offeringSentDate: '2026-10-15',
    offeringStatus: 'Negosiasi',
    offeringCandidateResponse: 'Nego',
    offeringResponseDate: '2026-10-16',
    offeringResponseNotes: 'Kandidat mengajukan negosiasi: meminta tambahan tunjangan komunikasi dan opsi kerja hybrid.',
  },

  // 8a. Hired (Diterima & Transisi ke Onboarding)
  {
    id: 'cand-8',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-1',
    name: 'Dimas Anggara',
    email: 'dimas.anggara@corp.id',
    phone: '081822334455',
    lastCompany: 'Digital Bank Nasional',
    expectedSalary: 23000000,
    stage: 'Hired',
    appliedDate: '2026-09-01',
    sourcePortal: 'Website Karir',
    offeredSalary: 23500000,
    offeringDocNumber: '002/OL-HRD/NTM/IX/2026',
    joinedDate: '2026-10-01',
  },

  // 8b. Disqualified / Talent Pool (Basis Data Cadangan)
  {
    id: 'cand-9',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-1',
    name: 'Rizky Kurniawan, S.Kom.',
    email: 'rizky.kurnia@tech.com',
    phone: '081677889900',
    lastCompany: 'PT Global Teknologi Konsultindo',
    expectedSalary: 28000000,
    stage: 'TalentPool',
    appliedDate: '2026-09-12',
    sourcePortal: 'LinkedIn',
    disqualificationReason: 'Ekspektasi gaji (Rp 28jt) di atas plafon budget lowongan DevOps L3 saat ini (Max Rp 25jt). Kandidat sangat kompeten dan di-pool untuk prioritas formasi Principal Cloud Architect Q1 2027.',
    talentPoolCategory: 'Cloud Architecture & Infrastructure',
    talentPoolTags: ['AWS Solutions Architect', 'Kubernetes', 'Enterprise Security', 'Terraform', 'CI/CD Pipelines'],
    lastStageName: 'Tahap 3: Wawancara User (Tech Lead & Architecture)',
    lastStageScore: 92,
    lastStageDate: '2026-10-22 14:00 WIB',
    lastStageLocation: 'Google Meet (meet.google.com/xyz-infra-tech)',
    lastStageInterviewer: 'Budi Pratama (Head of Engineering) & Maya Safitri (HR Lead)',
    lastStageNotes: 'Pemahaman arsitektur multi-region AWS dan k8s cluster hardening luar biasa. Komunikasi sangat matang. Direkomendasikan simpan di Talent Pool untuk diundang langsung saat posisi Lead/Principal dibuka.',
    aiMatchScore: 95,
    // Riwayat Tes & Hasil Nilai
    testType: 'Assessment Kemampuan Teknis & Psikotes Kognitif',
    testScore: 94,
    testPassingGrade: 75,
    testStatus: 'Lulus',
    testAssignedDate: '2026-10-15',
    testNotes: 'Skor tes kompetensi teknis luar biasa (94/100). Logika algoritma cloud & security hardening berada di persentil ke-95.',
    competencyScores: [
      { competencyName: 'Cloud Infrastructure & High Availability', score: 96, passingGrade: 75, status: 'Lulus' },
      { competencyName: 'Kubernetes Container Orchestration', score: 95, passingGrade: 75, status: 'Lulus' },
      { competencyName: 'Otomasi CI/CD & Security Hardening', score: 91, passingGrade: 75, status: 'Lulus' },
    ],
    // Riwayat Wawancara & Hasil Nilai
    interviewDate: '2026-10-22',
    interviewStartTime: '14:00 - 15:30 WIB',
    meetingPlatform: 'Google Meet (meet.google.com/xyz-infra-tech)',
    interviewFormat: 'Online',
    interviewer: 'Budi Pratama (Head of Engineering) & Maya Safitri (HR Lead)',
    interviewScore: 92,
    interviewScorecard: {
      technical: 95,
      culturalFit: 90,
      communication: 91,
      recommendation: 'Direkomendasikan Lolos',
    },
    interviewNotes: 'Problem solving sangat terstruktur. Sangat menguasai mitigasi downtime dan k8s cluster recovery.',
    // Riwayat Medical Check Up (MCU) & Hasil Nilai
    mcuStatus: 'Fit (Lolos)',
    mcuDate: '2026-10-24',
    mcuClinicOrHospital: 'RS Siloam Semanggi / Prodia Lab',
    mcuPackage: 'Paket Pra-Kerja Standar NusaHR (Darah Lengkap, Rontgen Thorax, Urin, Fisik)',
    mcuNotes: 'Kondisi fisik prima, tensi darah 120/80 mmHg, fungsi paru dan jantung normal, bebas zat narkotika. Layak dan memenuhi standar kesehatan kerja penuh.',
    mcuDecision: 'Lolos ke Offering',
    parsedData: {
      candidateName: 'Rizky Kurniawan, S.Kom.',
      email: 'rizky.kurnia@tech.com',
      phone: '081677889900',
      education: 'S1 Teknik Informatika - Institut Teknologi Bandung (IPK 3.82)',
      experienceYears: '6 Tahun',
      topSkills: ['AWS Certified Solutions Architect Professional', 'Kubernetes CKA', 'Terraform', 'Golang', 'Docker', 'Prometheus & Grafana'],
      summary: 'Senior Cloud & DevOps Engineer dengan 6+ tahun pengalaman mengelola infrastruktur 99.99% SLA untuk fintech dan enterprise retail.',
      linkedinUrl: 'https://linkedin.com/in/rizky-kurniawan-cloud',
      portfolioUrl: 'https://github.com/rizkykurnia-devops',
    },
  },
  {
    id: 'cand-10',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-2',
    name: 'Nadia Priscillia, S.Psi., M.M.',
    email: 'nadia.priscillia@hrconnect.id',
    phone: '081299887711',
    lastCompany: 'Unilever Indonesia FMCG',
    expectedSalary: 14000000,
    stage: 'TalentPool',
    appliedDate: '2026-09-18',
    sourcePortal: 'Jobstreet',
    disqualificationReason: 'Kandidat membutuhkan notice period 2 bulan di perusahaan asal sehingga tidak dapat bergabung sesuai target join date segera. Disepakati masuk Talent Pool prioritas batch berikutnya.',
    talentPoolCategory: 'Human Capital & People Analytics',
    talentPoolTags: ['People Analytics', 'Compensation & Benefits', 'HR Generalist', 'Industrial Relations', 'PowerBI'],
    lastStageName: 'Tahap 5: Offering & Negosiasi Kompensasi',
    lastStageScore: 88,
    lastStageDate: '2026-10-18 10:00 WIB',
    lastStageLocation: 'Menara Nusantara Kuningan, Ruang Eksekutif Lt. 18',
    lastStageInterviewer: 'Sandra Dewi (VP Human Capital) & Anton Subagyo (HR Operations Manager)',
    lastStageNotes: 'Sangat menguasai formulasi KPI OKR, data turnover analytics, serta kepatuhan hukum ketenagakerjaan PP 35/2021. Sangat potensial untuk rekrutmen Q1 mendatang.',
    aiMatchScore: 91,
    // Riwayat Tes & Hasil Nilai
    testType: 'Psikotes & Case Study People Analytics',
    testScore: 89,
    testPassingGrade: 75,
    testStatus: 'Lulus',
    testAssignedDate: '2026-10-10',
    testNotes: 'Skor case study HR analytics 89/100. Analisis churn model dan perancangan salary grading sangat komprehensif.',
    competencyScores: [
      { competencyName: 'People Analytics & Dashboarding', score: 92, passingGrade: 75, status: 'Lulus' },
      { competencyName: 'Regulasi Ketenagakerjaan PP 35/2021', score: 88, passingGrade: 75, status: 'Lulus' },
      { competencyName: 'Struktur Kompensasi & Benefit', score: 87, passingGrade: 75, status: 'Lulus' },
    ],
    // Riwayat Wawancara & Hasil Nilai
    interviewDate: '2026-10-18',
    interviewStartTime: '10:00 - 11:30 WIB',
    meetingPlatform: 'Menara Nusantara Kuningan, Ruang Eksekutif Lt. 18',
    interviewFormat: 'Offline',
    interviewer: 'Sandra Dewi (VP Human Capital) & Anton Subagyo (HR Operations Manager)',
    interviewScore: 88,
    interviewScorecard: {
      technical: 90,
      culturalFit: 88,
      communication: 86,
      recommendation: 'Direkomendasikan Lolos',
    },
    interviewNotes: 'Komunikasi sangat persuasif, pemahaman bisnis mendalam, leadership matang.',
    // Riwayat Medical Check Up (MCU) & Hasil Nilai
    mcuStatus: 'Fit (Lolos)',
    mcuDate: '2026-10-20',
    mcuClinicOrHospital: 'Prodia Occupational Health Clinic',
    mcuPackage: 'Paket Pra-Kerja Komprehensif NusaHR',
    mcuNotes: 'Hasil tes darah rutin, glukosa, dan kimia darah dalam rentang ideal. Rontgen thorax bersih, fungsi pendengaran & penglihatan baik. Dinyatakan fit bekerja.',
    mcuDecision: 'Lolos ke Offering',
    parsedData: {
      candidateName: 'Nadia Priscillia, S.Psi., M.M.',
      email: 'nadia.priscillia@hrconnect.id',
      phone: '081299887711',
      education: 'S2 Magister Manajemen SDM - Universitas Indonesia (IPK 3.78)',
      experienceYears: '4 Tahun',
      topSkills: ['People Analytics', 'PowerBI Dashboard', 'Compensation & Benefits', 'Hubungan Industrial', 'Employee Engagement'],
      summary: 'HR Business Partner berpengalaman dalam perancangan kompensasi & benefit dan analytics retensi karyawan.',
      linkedinUrl: 'https://linkedin.com/in/nadiapriscillia-hc',
      portfolioUrl: 'https://nadiapriscillia.notion.site/portfolio',
    },
  },
  {
    id: 'cand-11',
    tenantId: 'tenant-ntm',
    jobVacancyId: 'job-1',
    name: 'Fajar Ramadhan, S.T.',
    email: 'fajar.ramadhan@codelab.net',
    phone: '081344556677',
    lastCompany: 'Bukalapak E-Commerce',
    expectedSalary: 21000000,
    stage: 'TalentPool',
    appliedDate: '2026-09-25',
    sourcePortal: 'Glints',
    disqualificationReason: 'Kuota kebutuhan 2 formasi telah terisi oleh kandidat lain dengan skor lebih tinggi. Kandidat disimpan dalam basis data cadangan Talent Pool siap panggil.',
    talentPoolCategory: 'Engineering & Technology',
    talentPoolTags: ['Docker', 'CI/CD Pipelines', 'Linux Kernel', 'Bash & Python Scripting', 'Monitoring Alerting'],
    lastStageName: 'Tahap 2: Technical Assessment & Coding Test',
    lastStageScore: 86,
    lastStageDate: '2026-10-14 09:30 WIB',
    lastStageLocation: 'NusaHR Online Assessment Platform & HackerRank',
    lastStageInterviewer: 'Aditya Pratama, M.Psi. (Lead Assessor) & Tim Tech Examiner',
    lastStageNotes: 'Skor tes kompetensi teknis Docker dan otomasi Linux 86/100 (Melampaui passing grade 75). Disimpan untuk ekspansi divisi platform di kuartal berikutnya.',
    aiMatchScore: 88,
    // Riwayat Tes & Hasil Nilai
    testType: 'Technical Coding Assessment & Docker Lab',
    testScore: 86,
    testPassingGrade: 75,
    testStatus: 'Lulus',
    testAssignedDate: '2026-10-14',
    testNotes: 'Skor coding test 86/100. Pengerjaan skrip otomasi Bash & deployment container berhasil diselesaikan dalam 45 menit.',
    competencyScores: [
      { competencyName: 'Docker Containerization', score: 88, passingGrade: 75, status: 'Lulus' },
      { competencyName: 'Linux Shell & Bash Scripting', score: 86, passingGrade: 75, status: 'Lulus' },
      { competencyName: 'Monitoring Grafana & Alerting', score: 84, passingGrade: 75, status: 'Lulus' },
    ],
    // Riwayat Wawancara & Hasil Nilai
    interviewDate: '2026-10-16',
    interviewStartTime: '13:00 - 14:00 WIB',
    meetingPlatform: 'Google Meet Online',
    interviewFormat: 'Online',
    interviewer: 'Aditya Pratama, M.Psi. & Tim Tech Lead',
    interviewScore: 84,
    interviewScorecard: {
      technical: 86,
      culturalFit: 82,
      communication: 84,
      recommendation: 'Dipertimbangkan',
    },
    interviewNotes: 'Kemampuan teknis solid, antusiasme belajar tinggi, adaptif terhadap arsitektur baru.',
    // Riwayat Medical Check Up (MCU) & Hasil Nilai
    mcuStatus: 'Fit with Note',
    mcuDate: '2026-10-17',
    mcuClinicOrHospital: 'RS Siloam Semanggi',
    mcuPackage: 'Paket Standar Pra-Kerja',
    mcuNotes: 'Kondisi fisik baik secara umum, disarankan menjaga pola makan rendah lemak (kolesterol borderline). Fisik fit dan layak menjalankan tugas kerja.',
    mcuDecision: 'Lolos ke Offering',
    parsedData: {
      candidateName: 'Fajar Ramadhan, S.T.',
      email: 'fajar.ramadhan@codelab.net',
      phone: '081344556677',
      education: 'S1 Teknik Elektro - Institut Teknologi Sepuluh Nopember (IPK 3.65)',
      experienceYears: '3.5 Tahun',
      topSkills: ['Docker Swarm', 'GitLab CI', 'Python', 'Linux Administration', 'Grafana', 'ELK Stack'],
      summary: 'DevOps Specialist fokus pada otomasi deployment, container orchestration, dan pipeline reliability.',
      linkedinUrl: 'https://linkedin.com/in/fajar-ramadhan-devops',
    },
  },
];

export const INITIAL_OFFBOARDING: OffboardingRecord[] = [
  {
    id: 'off-1',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-8',
    separationType: 'Resign Sukarela',
    requestDate: '2026-10-01',
    effectiveDate: '2026-10-31',
    handoverCompleted: true,
    assetReturned: false,
    financeCleared: false,
    severancePay: 46200000,
    parklaringIssued: false,
    notes: 'Resign inisiatif sendiri setelah masa kerja 4 tahun 2 bulan (Dasar Upah: Rp 20.000.000). Mengacu regulasi PP 35/2021 Pasal 50: UPMK 2 bulan upah + UPH 15% hak sisa cuti & relokasi.',
  },
];

export const INITIAL_ASSETS: GAAsset[] = [
  {
    id: 'ast-1',
    tenantId: 'tenant-ntm',
    assetCode: 'AST-LTP-001',
    name: 'MacBook Pro 16" M3 Max 36GB / 1TB',
    category: 'Laptop & Komputer',
    building: 'Menara Palma Kuningan',
    room: 'Lantai 18 - Engineering Pod Alpha',
    purchaseDate: '2024-01-15',
    purchasePrice: 48999000,
    condition: 'Baik',
    assignedToEmployeeId: 'emp-4',
    lastStockOpname: '2026-10-10',
    qrPayload: '{"assetCode":"AST-LTP-001","type":"GA_ASSET","tenant":"NTM","serial":"MBPM3-98214"}',
  },
  {
    id: 'ast-2',
    tenantId: 'tenant-ntm',
    assetCode: 'AST-LTP-002',
    name: 'ThinkPad X1 Carbon Gen 11 16GB / 512GB',
    category: 'Laptop & Komputer',
    building: 'Menara Palma Kuningan',
    room: 'Lantai 18 - HR & Finance Room',
    purchaseDate: '2023-03-20',
    purchasePrice: 28500000,
    condition: 'Baik',
    assignedToEmployeeId: 'emp-2',
    lastStockOpname: '2026-10-10',
    qrPayload: '{"assetCode":"AST-LTP-002","type":"GA_ASSET","tenant":"NTM","serial":"TPX1-88120"}',
  },
  {
    id: 'ast-3',
    tenantId: 'tenant-ntm',
    assetCode: 'AST-KND-001',
    name: 'Toyota Innova Zenix Hybrid V 2.0 (B 1928 NTM)',
    category: 'Kendaraan Operasional',
    building: 'Menara Palma Kuningan',
    room: 'Basement 2 - Slot Parkir Eksekutif B2-14',
    purchaseDate: '2023-05-10',
    purchasePrice: 535000000,
    condition: 'Baik',
    assignedToEmployeeId: 'emp-1',
    lastStockOpname: '2026-10-12',
    qrPayload: '{"assetCode":"AST-KND-001","type":"GA_ASSET","tenant":"NTM","plat":"B1928NTM"}',
  },
  {
    id: 'ast-4',
    tenantId: 'tenant-ntm',
    assetCode: 'AST-SRV-001',
    name: 'Cisco Catalyst 9300 48-Port PoE+ Switch',
    category: 'Perangkat Jaringan',
    building: 'Menara Palma Kuningan',
    room: 'Server Room 18A',
    purchaseDate: '2022-08-11',
    purchasePrice: 65000000,
    condition: 'Baik',
    assignedToEmployeeId: 'emp-3',
    lastStockOpname: '2026-10-10',
    qrPayload: '{"assetCode":"AST-SRV-001","type":"GA_ASSET","tenant":"NTM","serial":"CS-CAT9300-88"}',
  },
  {
    id: 'ast-5',
    tenantId: 'tenant-ntm',
    assetCode: 'AST-FAS-001',
    name: 'Ergonomic Mesh Chair Herman Miller Aeron Remastered',
    category: 'Furniture',
    building: 'Menara Palma Kuningan',
    room: 'Lantai 18 - Executive Office',
    purchaseDate: '2022-01-20',
    purchasePrice: 24000000,
    condition: 'Baik',
    assignedToEmployeeId: 'emp-1',
    lastStockOpname: '2026-10-10',
    qrPayload: '{"assetCode":"AST-FAS-001","type":"GA_ASSET","tenant":"NTM","serial":"HM-AER-01"}',
  },
];

export const INITIAL_PROCUREMENT: ProcurementOrder[] = [
  {
    id: 'pr-1',
    tenantId: 'tenant-ntm',
    prNumber: 'PR-2026-089',
    poNumber: 'PO-2026-074',
    vendorName: 'PT Mitra Solusi Infotama',
    itemName: 'Dell UltraSharp 27" 4K USB-C Hub Monitor (U2723QE) - 5 Unit',
    quantity: 5,
    estimatedCost: 47500000,
    requestor: 'Dimas Wicaksono',
    department: 'Engineering',
    status: 'PO Terbit',
    requestedDate: '2026-10-02',
  },
  {
    id: 'pr-2',
    tenantId: 'tenant-ntm',
    prNumber: 'PR-2026-092',
    poNumber: '',
    vendorName: 'PT Surya Stationery Mandiri',
    itemName: 'Kertas A4 PaperOne 80gr, Tinta Printer Epson EcoTank & ATK Kuartal IV',
    quantity: 20,
    estimatedCost: 6800000,
    requestor: 'Rini Anggraini',
    department: 'General Affairs',
    status: 'Pengajuan PR',
    requestedDate: '2026-10-15',
  },
];

export const INITIAL_DOCUMENTS: OfficialDocument[] = [
  {
    id: 'doc-1',
    tenantId: 'tenant-ntm',
    documentNumber: '042/HRD-PKWT/NTM/I/2024',
    type: 'PKWT',
    title: 'Perjanjian Kerja Waktu Tertentu (PKWT) Software Engineer',
    targetEmployeeId: 'emp-4',
    issueDate: '2024-01-08',
    signeeName: 'Aditya Pratama, S.Psi',
    signeeRole: 'VP of Human Capital',
    qrVerificationUrl: 'https://nusahr.enterprise/verify?doc=042-HRD-PKWT-NTM-I-2024&hash=7a9f2bc3',
    status: 'Resmi Diterbitkan',
    contentPreview: 'Pasal 1: Hubungan kerja ini diikat berdasarkan status Waktu Tertentu (PKWT) selama jangka waktu 12 bulan...',
  },
  {
    id: 'doc-2',
    tenantId: 'tenant-ntm',
    documentNumber: '018/HRD-SK-PROM/NTM/VI/2024',
    type: 'Surat Promosi',
    title: 'Surat Keputusan Direksi tentang Promosi Jabatan & Grading',
    targetEmployeeId: 'emp-2',
    issueDate: '2024-06-01',
    signeeName: 'Aditya Pratama, S.Psi',
    signeeRole: 'VP of Human Capital',
    qrVerificationUrl: 'https://nusahr.enterprise/verify?doc=018-HRD-SK-PROM-NTM-VI-2024&hash=9c1e4f20',
    status: 'Resmi Diterbitkan',
    contentPreview: 'Menimbang: Prestasi dan dedikasi Saudari Jessica Tanujaya, SE. Memutuskan: Menetapkan promosi sebagai Lead Payroll & Tax Specialist...',
  },
  {
    id: 'doc-3',
    tenantId: 'tenant-ntm',
    documentNumber: '007/HRD-SP/NTM/VIII/2026',
    type: 'Surat Peringatan',
    title: 'Surat Peringatan Pertama (SP 1) Pelanggaran Disiplin Kehadiran',
    targetEmployeeId: 'emp-5',
    issueDate: '2026-08-12',
    signeeName: 'Aditya Pratama, S.Psi',
    signeeRole: 'VP of Human Capital',
    qrVerificationUrl: 'https://nusahr.enterprise/verify?doc=007-HRD-SP-NTM-VIII-2026&hash=3e8b11c9',
    status: 'Resmi Diterbitkan',
    contentPreview: 'Berdasarkan Peraturan Perusahaan Pasal 14 mengenai Kedisiplinan Kerja, pihak manajemen memberikan Surat Peringatan Tingkat 1...',
  },
  {
    id: 'doc-4',
    tenantId: 'tenant-ntm',
    documentNumber: '089/HRD-BAST-GA/NTM/I/2024',
    type: 'BAST Aset',
    templateId: 'tmpl-10',
    title: 'Berita Acara Serah Terima Aset Kerja Perusahaan (Laptop)',
    targetEmployeeId: 'emp-4',
    issueDate: '2024-01-15',
    signeeName: 'Bambang Sudiro',
    signeeRole: 'GA & Facility Manager',
    qrVerificationUrl: 'https://nusahr.enterprise/verify?doc=089-HRD-BAST-GA-NTM-I-2024&hash=1d4a82ff',
    status: 'Resmi Diterbitkan',
    contentPreview: 'Pihak Pertama telah menyerahkan 1 unit MacBook Pro 16" M3 Max (AST-LTP-001) kepada Pihak Kedua dalam kondisi prima dan teruji...',
  },
  {
    id: 'doc-5',
    tenantId: 'tenant-ntm',
    documentNumber: '014/HRD-SPPD/NTM/X/2026',
    type: 'Surat Tugas Dinas',
    templateId: 'tmpl-14',
    title: 'Surat Perintah Perjalanan Dinas (SPPD) Implementasi Cloud Surabaya',
    targetEmployeeId: 'emp-1',
    issueDate: '2026-10-18',
    signeeName: 'Aditya Pratama, S.Psi',
    signeeRole: 'VP of Human Capital',
    qrVerificationUrl: 'https://nusahr.enterprise/verify?doc=014-HRD-SPPD-NTM-X-2026&hash=44ba22c1',
    status: 'Resmi Diterbitkan',
    contentPreview: 'Memerintahkan Saudara/i untuk melaksanakan tugas dinas asistensi teknis implementasi datacenter di Surabaya selama 4 hari kalender...',
  },
  {
    id: 'doc-6',
    tenantId: 'tenant-ntm',
    documentNumber: '025/LEG-NDA/NTM/II/2024',
    type: 'Non-Disclosure Agreement (NDA)',
    templateId: 'tmpl-21',
    title: 'Perjanjian Kerahasiaan Data & Rahasia Dagang (NDA Resmi)',
    targetEmployeeId: 'emp-3',
    issueDate: '2024-02-01',
    signeeName: 'Aditya Pratama, S.Psi',
    signeeRole: 'VP of Human Capital & Legal',
    qrVerificationUrl: 'https://nusahr.enterprise/verify?doc=025-LEG-NDA-NTM-II-2024&hash=99ef8120',
    status: 'Resmi Diterbitkan',
    contentPreview: 'Pihak Kedua berkomitmen menjaga kerahasiaan seluruh source code, proprietary algorithms, dan data finansial perusahaan...',
  },
  {
    id: 'doc-7',
    tenantId: 'tenant-ntm',
    documentNumber: '003/INT-CERT/NTM/VIII/2026',
    type: 'Sertifikat Magang',
    templateId: 'tmpl-23',
    title: 'Sertifikat Kelulusan Program Magang Industri (UI/UX Engineering)',
    targetEmployeeId: 'emp-5',
    issueDate: '2026-08-31',
    signeeName: 'Aditya Pratama, S.Psi',
    signeeRole: 'VP of Human Capital',
    qrVerificationUrl: 'https://nusahr.enterprise/verify?doc=003-INT-CERT-NTM-VIII-2026&hash=ee12bc88',
    status: 'Resmi Diterbitkan',
    contentPreview: 'Diberikan sebagai penghargaan atas keberhasilan menyelesaikan program Magang Industri selama 6 bulan dengan predikat Sangat Baik...',
  },
  {
    id: 'doc-8',
    tenantId: 'tenant-ntm',
    documentNumber: '102/PAY-SLIP/NTM/IX/2026',
    type: 'Slip Gaji Resmi',
    templateId: 'tmpl-17',
    title: 'Slip Gaji Resmi & Bukti Potong TER 2024 (Bulan September 2026)',
    targetEmployeeId: 'emp-2',
    issueDate: '2026-09-25',
    signeeName: 'Jessica Tanujaya, SE',
    signeeRole: 'Lead Payroll & Tax Specialist',
    qrVerificationUrl: 'https://nusahr.enterprise/verify?doc=102-PAY-SLIP-NTM-IX-2026&hash=3381aacc',
    status: 'Resmi Diterbitkan',
    contentPreview: 'Penghasilan Bruto: Rp 16.500.000 | Potongan PPh 21 TER: Rp 495.000 | BPJS Ketenagakerjaan: Rp 495.000 | THP Bersih: Rp 15.510.000...',
  },
  {
    id: 'doc-9',
    tenantId: 'tenant-ntm',
    documentNumber: '011/HRD-SK-PLT/NTM/V/2026',
    type: 'Surat Penetapan Plt',
    templateId: 'tmpl-6',
    title: 'Surat Keputusan Penetapan Pelaksana Tugas (Plt) Head of QA',
    targetEmployeeId: 'emp-4',
    issueDate: '2026-05-10',
    signeeName: 'Aditya Pratama, S.Psi',
    signeeRole: 'VP of Human Capital',
    qrVerificationUrl: 'https://nusahr.enterprise/verify?doc=011-HRD-SK-PLT-NTM-V-2026&hash=8812dd99',
    status: 'Resmi Diterbitkan',
    contentPreview: 'Menunjuk Saudara untuk menjalankan tugas struktural Pelaksana Tugas (Plt) Kepala Divisi Quality Assurance selama masa transisi...',
  },
  {
    id: 'doc-10',
    tenantId: 'tenant-ntm',
    documentNumber: '005/HRD-PARK/NTM/X/2026',
    type: 'Parklaring',
    templateId: 'tmpl-8',
    title: 'Surat Keterangan Pengalaman Kerja (Parklaring) Senior DevOps',
    targetEmployeeId: 'emp-1',
    issueDate: '2026-10-01',
    signeeName: 'Aditya Pratama, S.Psi',
    signeeRole: 'VP of Human Capital',
    qrVerificationUrl: 'https://nusahr.enterprise/verify?doc=005-HRD-PARK-NTM-X-2026&hash=77ca3100',
    status: 'Resmi Diterbitkan',
    contentPreview: 'Menerangkan dengan sebenarnya bahwa yang bersangkutan telah bekerja dengan dedikasi tinggi dan kontribusi prima selama masa baktinya...',
  },
  {
    id: 'doc-11',
    tenantId: 'tenant-ntm',
    documentNumber: '033/PO-PROC/NTM/X/2026',
    type: 'Purchase Order (PO)',
    templateId: 'tmpl-39',
    title: 'Surat Pesanan Pembelian Resmi (Purchase Order) Server & Perangkat Jaringan',
    targetEmployeeId: 'emp-4',
    issueDate: '2026-10-20',
    signeeName: 'Bambang Sudiro',
    signeeRole: 'Head of Procurement & GA',
    qrVerificationUrl: 'https://nusahr.enterprise/verify?doc=033-PO-PROC-NTM-X-2026&hash=5522aa44',
    status: 'Resmi Diterbitkan',
    contentPreview: 'Kepada PT Sinergi Solusi IT: Pemesanan 2 Unit Switch Cisco Enterprise & Rack Server dengan termin Net 30 hari kalender...',
  },
];

export const INITIAL_SHIFTS: WorkShift[] = [
  {
    id: 'shift-1',
    tenantId: 'tenant-ntm',
    name: 'Shift Normal Office',
    code: 'SH-NOR',
    startTime: '08:00',
    endTime: '17:00',
    color: 'indigo',
    isNightShift: false,
    lateToleranceMins: 15,
  },
  {
    id: 'shift-2',
    tenantId: 'tenant-ntm',
    name: 'Shift Pagi (Early)',
    code: 'SH-PAGI',
    startTime: '07:00',
    endTime: '16:00',
    color: 'emerald',
    isNightShift: false,
    lateToleranceMins: 10,
  },
  {
    id: 'shift-3',
    tenantId: 'tenant-ntm',
    name: 'Shift Siang / Support',
    code: 'SH-SIANG',
    startTime: '13:00',
    endTime: '22:00',
    color: 'amber',
    isNightShift: false,
    lateToleranceMins: 15,
  },
  {
    id: 'shift-4',
    tenantId: 'tenant-ntm',
    name: 'Shift Malam (Ops & Sec)',
    code: 'SH-MALAM',
    startTime: '21:00',
    endTime: '06:00',
    color: 'purple',
    isNightShift: true,
    lateToleranceMins: 10,
  },
];

export const INITIAL_SHIFT_SWAPS: ShiftSwapRequest[] = [
  {
    id: 'swap-1',
    tenantId: 'tenant-ntm',
    requesterId: 'emp-4',
    targetEmployeeId: 'emp-5',
    requestDate: '2026-10-22',
    targetDate: '2026-10-23',
    reason: 'Ada urusan administrasi perbankan mendesak di pagi hari',
    status: 'Menunggu',
  },
];

export const INITIAL_ATTENDANCE_CORRECTIONS: AttendanceCorrectionRequest[] = [
  {
    id: 'cor-1',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-3',
    date: '2026-10-16',
    type: 'Lupa Absen Pulang',
    proposedClockIn: '08:00',
    proposedClockOut: '17:30',
    reason: 'Terburu-buru meeting darurat dengan vendor perbaikan AC lantai 18',
    status: 'Menunggu',
  },
  {
    id: 'cor-2',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-5',
    date: '2026-10-15',
    type: 'Izin Datang Terlambat',
    proposedClockIn: '09:15',
    proposedClockOut: '17:00',
    reason: 'Pohon tumbang menutup jalur KRL Commuter Line',
    status: 'Disetujui',
    approvedBy: 'Aditya Pratama, S.Psi',
  },
];

export const INITIAL_BUSINESS_TRIPS: BusinessTripRequest[] = [
  {
    id: 'trip-1',
    tenantId: 'tenant-ntm',
    tripNumber: '012/SPPD-HC/NTM/X/2026',
    employeeId: 'emp-1',
    destinationCity: 'Surabaya & Sidoarjo',
    startDate: '2026-10-26',
    endDate: '2026-10-28',
    totalDays: 3,
    purpose: 'Audit tahunan operasional cabang dan serah terima fasilitas kantor baru',
    transportType: 'Pesawat',
    estimatedCost: 6500000,
    perDiemDaily: 500000,
    accommodationCost: 2200000,
    status: 'Disetujui Atasan',
    approvedBy: 'Direksi Utama',
  },
  {
    id: 'trip-2',
    tenantId: 'tenant-ntm',
    tripNumber: '013/SPPD-ENG/NTM/X/2026',
    employeeId: 'emp-4',
    destinationCity: 'Bandung',
    startDate: '2026-11-02',
    endDate: '2026-11-03',
    totalDays: 2,
    purpose: 'Instalasi server on-premise klien enterprise sektor keuangan',
    transportType: 'Kereta Api',
    estimatedCost: 2800000,
    perDiemDaily: 400000,
    accommodationCost: 950000,
    status: 'Menunggu Approval',
  },
  {
    id: 'trip-3',
    tenantId: 'tenant-ntm',
    tripNumber: '014/SPPD-FIN/NTM/X/2026',
    employeeId: 'emp-2',
    destinationCity: 'Denpasar & Nusa Dua (Bali)',
    startDate: '2026-11-10',
    endDate: '2026-11-13',
    totalDays: 4,
    purpose: 'National Tax Summit & Pelatihan Pemotongan PPh 21 TER Terpadu',
    transportType: 'Pesawat',
    estimatedCost: 8200000,
    perDiemDaily: 600000,
    accommodationCost: 3200000,
    status: 'Disetujui Finance',
    approvedBy: 'VP Finance',
  },
  {
    id: 'trip-4',
    tenantId: 'tenant-ntm',
    tripNumber: '010/SPPD-REC/NTM/X/2026',
    employeeId: 'emp-3',
    destinationCity: 'Yogyakarta',
    startDate: '2026-10-12',
    endDate: '2026-10-15',
    totalDays: 4,
    purpose: 'Campus Career Fair UGM & Seleksi Wawancara Tech Management Trainee',
    transportType: 'Kereta Api',
    estimatedCost: 4500000,
    perDiemDaily: 450000,
    accommodationCost: 1600000,
    status: 'Selesai',
    approvedBy: 'Head of HC',
  },
  {
    id: 'trip-5',
    tenantId: 'tenant-ntm',
    tripNumber: '015/SPPD-GA/NTM/X/2026',
    employeeId: 'emp-5',
    destinationCity: 'Medan',
    startDate: '2026-11-17',
    endDate: '2026-11-19',
    totalDays: 3,
    purpose: 'Inspeksi kesiapan operasional kantor satelit & pengadaan inventaris aset IT',
    transportType: 'Pesawat',
    estimatedCost: 5900000,
    perDiemDaily: 450000,
    accommodationCost: 1800000,
    status: 'Menunggu Approval',
  },
  {
    id: 'trip-6',
    tenantId: 'tenant-ntm',
    tripNumber: '016/SPPD-ENG/NTM/X/2026',
    employeeId: 'emp-7',
    destinationCity: 'Semarang',
    startDate: '2026-11-23',
    endDate: '2026-11-25',
    totalDays: 3,
    purpose: 'Kick-off implementasi Cloud ERP di fasilitas logistik regional',
    transportType: 'Kereta Api',
    estimatedCost: 3400000,
    perDiemDaily: 400000,
    accommodationCost: 1200000,
    status: 'Disetujui Atasan',
    approvedBy: 'Head of Cloud & Engineering',
  },
];

export const INITIAL_APPROVALS: ApprovalWorkflowItem[] = [
  {
    id: 'appr-1',
    tenantId: 'tenant-ntm',
    category: 'Perjalanan Dinas',
    referenceId: 'trip-2',
    title: 'SPPD Instalasi Server Enterprise - Bandung (Dimas Wicaksono)',
    requesterId: 'emp-4',
    department: 'Engineering',
    submittedAt: '2026-10-17 09:30',
    deadlineAt: '2026-10-20 17:00',
    level: 1,
    totalLevels: 2,
    assignedApproverRole: 'manager',
    status: 'Menunggu',
    amount: 2800000,
    notes: 'Estimasi tiket Whoosh & akomodasi 1 malam',
  },
  {
    id: 'appr-2',
    tenantId: 'tenant-ntm',
    category: 'Pinjaman',
    referenceId: 'loan-2',
    title: 'Permohonan Kasbon Darurat Pengobatan (Siti Rahmawati)',
    requesterId: 'emp-5',
    department: 'General Affairs',
    submittedAt: '2026-10-16 11:20',
    deadlineAt: '2026-10-19 12:00',
    level: 1,
    totalLevels: 2,
    assignedApproverRole: 'payroll_admin',
    status: 'Menunggu',
    amount: 2000000,
    notes: 'Tenor 4 bulan, potongan Rp 500.000/bln',
  },
  {
    id: 'appr-3',
    tenantId: 'tenant-ntm',
    category: 'Cuti',
    referenceId: 'leave-2',
    title: 'Pengajuan Cuti Tahunan 3 Hari (Bambang Sudiro)',
    requesterId: 'emp-3',
    department: 'People & Culture',
    submittedAt: '2026-10-17 14:00',
    deadlineAt: '2026-10-21 17:00',
    level: 1,
    totalLevels: 1,
    assignedApproverRole: 'hr_admin',
    status: 'Menunggu',
    notes: 'Sisa kuota cuti masih 10 hari',
  },
  {
    id: 'appr-4',
    tenantId: 'tenant-ntm',
    category: 'Procurement PR',
    referenceId: 'pr-2',
    title: 'PR Pengadaan ATK & Kertas Kuartal IV (Rini Anggraini)',
    requesterId: 'emp-5',
    department: 'General Affairs',
    submittedAt: '2026-10-15 16:00',
    deadlineAt: '2026-10-18 17:00',
    level: 1,
    totalLevels: 2,
    assignedApproverRole: 'ga_admin',
    status: 'Menunggu',
    amount: 6800000,
  },
];

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vnd-1',
    tenantId: 'tenant-ntm',
    name: 'PT Mitra Solusi Infotama',
    code: 'VND-IT-001',
    category: 'Hardware & IT',
    contactPerson: 'Hendra Gunawan',
    phone: '08118822331',
    email: 'sales@mitrasolusi.co.id',
    npwp: '01.998.877.6-012.000',
    rating: 5,
    address: 'Kawasan Niaga Roxy Mas Blok E No. 12, Jakarta Pusat',
    isVerified: true,
  },
  {
    id: 'vnd-2',
    tenantId: 'tenant-ntm',
    name: 'PT Surya Stationery Mandiri',
    code: 'VND-ATK-002',
    category: 'ATK & Cetak',
    contactPerson: 'Dewi Lestari',
    phone: '08123344556',
    email: 'order@suryastationery.id',
    npwp: '02.443.221.9-015.000',
    rating: 4,
    address: 'Jl. Mangga Dua Raya No. 45, Jakarta Barat',
    isVerified: true,
  },
  {
    id: 'vnd-3',
    tenantId: 'tenant-ntm',
    name: 'PT Cipta Sarana Bangun Perkasa',
    code: 'VND-KNS-003',
    category: 'Konstruksi & Fasilitas',
    contactPerson: 'Ir. Ahmad Zulkarnain',
    phone: '08139900112',
    email: 'ahmad@ciptasarana.com',
    npwp: '03.112.334.5-018.000',
    rating: 5,
    address: 'Gedung Graha Perkasa Lt. 5, Jl. Gatot Subroto, Jakarta Selatan',
    isVerified: true,
  },
  {
    id: 'vnd-4',
    tenantId: 'tenant-ntm',
    name: 'PT Solusi Konsultan Nusantara',
    code: 'VND-JSA-004',
    category: 'Jasa Konsultan / Project',
    contactPerson: 'Dr. Raymond Tan',
    phone: '08176655443',
    email: 'info@solusikonsultan.id',
    npwp: '04.556.778.9-021.000',
    rating: 4,
    address: 'Cyber 2 Tower Lt. 14, HR Rasuna Said, Jakarta Selatan',
    isVerified: true,
  },
];

export const DEFAULT_ONBOARDING_CHECKLIST_TEMPLATES: OnboardingChecklistTemplateItem[] = [
  {
    id: 'tmpl-dokumen',
    title: 'Pemeriksaan Dokumen',
    category: 'Legalitas & Dokumen',
    targetDepartment: 'HR',
    verificationType: 'manual',
    isMandatory: true,
    description: 'Pemeriksaan dan verifikasi kelengkapan berkas fisik & digital dokumen persyaratan karyawan.',
    subItems: [
      'KTP Elektronik Asli / Salinan Terverifikasi',
      'Kartu NPWP Terverifikasi DJP',
      'Kartu Keluarga (KK) Terbaru',
      'Ijazah Asli & Transkrip Nilai Akademik',
      'Buku Rekening Bank untuk Payroll Gaji',
      'Surat Keterangan Catatan Kepolisian (SKCK)',
      'Surat Keterangan Sehat / Hasil Medical Check-Up (MCU)',
    ],
  },
  {
    id: 'tmpl-kelengkapan-data',
    title: 'Kelengkapan Data Di System',
    category: 'Legalitas & Dokumen',
    targetDepartment: 'HR',
    verificationType: 'manual',
    isMandatory: true,
    description: 'Perekaman dan validasi data profil karyawan ke dalam database Sistem Informasi SDM NusaHR.',
    subItems: [
      'Input NIK KTP 16-Digit & Nomor Kartu Keluarga ke Sistem',
      'Pendaftaran Nomor NPWP & Status PTKP TER Pajak',
      'Pendaftaran Nomor Kepesertaan BPJS Ketenagakerjaan (KPJ)',
      'Pendaftaran Nomor Kartu BPJS Kesehatan',
      'Input Nomor Rekening Bank Payroll & Nama Pemilik Rekening',
      'Input Kontak Darurat (Nama, Nomor Telepon & Hubungan Keluarga)',
      'Alamat Domisili Karyawan & Nomor Kontak WhatsApp Aktif',
    ],
  },
  {
    id: 'tmpl-kontrak',
    title: 'Tanda Tangan Kontrak Digital QR (PKWT/PKWTT) & NDA',
    category: 'Legalitas & Dokumen',
    targetDepartment: 'HR',
    verificationType: 'manual',
    isMandatory: true,
    description: 'Penandatanganan digital kontrak kerja resmi dan Non-Disclosure Agreement (NDA).',
    subItems: [
      'Review Draf Surat Perjanjian Kerja Waktu Tertentu/Tidak Tertentu',
      'Penandatanganan Digital Dokumen Kontrak via QR Code Validasi',
      'Penandatanganan Non-Disclosure Agreement (NDA)',
      'Penandatanganan Pakta Integritas & Kode Etik Perusahaan',
      'Pengarsipan Salinan Dokumen Kontrak Kerja Karyawan',
    ],
  },
  {
    id: 'tmpl-idcard',
    title: 'Pengajuan ID Card & Akses Fasilitas',
    category: 'Fasilitas & GA',
    targetDepartment: 'GA',
    verificationType: 'manual',
    isMandatory: true,
    description: 'Pembuatan ID Card resmi dan aktivasi hak akses gedung kantor oleh General Affairs (GA).',
    subItems: [
      'Pengambilan / Upload Pas Foto Formal untuk ID Card',
      'Pencetakan Kartu ID Card Fisik & Lanyard NusaHR',
      'Aktivasi Sensor RFID Turnstile Gate Lobby Gedung',
      'Registrasi Hak Akses Pintu Ruang Kerja Departemen',
      'Penyerahan Fisik ID Card & Tanda Terima Fasilitas ke Karyawan',
    ],
  },
  {
    id: 'tmpl-perangkat',
    title: 'Pengajuan/Permintaan Perangkat',
    category: 'Inventaris & IT',
    targetDepartment: 'IT',
    verificationType: 'manual',
    isMandatory: true,
    description: 'Penyediaan unit laptop kerja dan kelengkapan perangkat penunjang oleh IT Support.',
    subItems: [
      'Penyiapan Unit Laptop Kerja Sesuai Standar Formasi Jabatan',
      'Pemasangan Stiker Label Aset (IT Asset Tag & Barcode)',
      'Penyiapan Kelengkapan (Charger Adaptor, Mouse & Tas Laptop)',
      'Pemeriksaan Kelayakan Fisik & Uji Performa Perangkat',
      'Penandatanganan Berita Acara Serah Terima (BAST) Perangkat',
    ],
  },
  {
    id: 'tmpl-akun',
    title: 'Penyediaan Akun-Akun Sistem & Email Korporat',
    category: 'Inventaris & IT',
    targetDepartment: 'IT',
    verificationType: 'manual',
    isMandatory: true,
    description: 'Penerbitan akun email perusahaan dan hak akses sistem kerja oleh IT Support.',
    subItems: [
      'Pembuatan Akun Email Korporat Resmi (@nusantara.id)',
      'Pembuatan Akun NusaHR Employee Portal & Absensi Mobile',
      'Provisioning Akses Workspace Komunikasi (Slack / Discord / Teams)',
      'Pemberian Hak Akses Sistem Kerja Departemen (Jira, GitHub, ERP, dsb.)',
      'Pengiriman Kredensial & Panduan Setup Password Pertama Kali',
    ],
  },
  {
    id: 'tmpl-orientasi',
    title: 'Orientasi Budaya Perusahaan & Office Tour',
    category: 'Pengenalan & HR',
    targetDepartment: 'HR',
    verificationType: 'manual',
    isMandatory: false,
    description: 'Sesi perkenalan nilai-nilai perusahaan, tur kantor, dan penunjukan buddy kerja.',
    subItems: [
      'Office Tour & Pengenalan Denah Fasilitas Gedung Kantor',
      'Perkenalan dengan Rekan Tim Kerja, Manager & Head of Dept',
      'Penjelasan Jam Kerja, Presensi Mobile & Peraturan Perusahaan',
      'Sosialisasi Benefit Karyawan, Asuransi & Kebijakan HR',
      'Penunjukan Mentor / Buddy Kerja Selama Masa Orientasi',
    ],
  },
];

export const INITIAL_ONBOARDING: OnboardingProcess[] = [
  {
    id: 'onb-1',
    tenantId: 'tenant-ntm',
    type: 'via_recruitment',
    candidateId: 'cand-2',
    createdEmployeeId: 'emp-6',
    employeeName: 'Farhan Kurnia',
    email: 'farhan.k@nusantara.id',
    phone: '081211335577',
    position: 'Associate Product & HC Analytics Specialist',
    department: 'Human Capital',
    employmentType: 'Kontrak',
    joinDate: '2024-07-01',
    basicSalary: 8500000,
    contractDocNumber: '088/HRD-PKWT/NTM/VII/2024',
    status: 'In Progress',
    tasks: [
      {
        id: 't-dokumen',
        title: 'Pemeriksaan Dokumen',
        category: 'Legalitas & Dokumen',
        targetDepartment: 'HR',
        verificationType: 'manual',
        isMandatory: true,
        isCompleted: true,
        completedAt: '2024-07-01',
        assignedRole: 'hr_admin',
        subItems: [
          { id: 's-dok-1', title: 'KTP Elektronik Asli / Salinan Terverifikasi', isCompleted: true },
          { id: 's-dok-2', title: 'Kartu NPWP Terverifikasi DJP', isCompleted: true },
          { id: 's-dok-3', title: 'Kartu Keluarga (KK) Terbaru', isCompleted: true },
          { id: 's-dok-4', title: 'Ijazah Asli & Transkrip Nilai Akademik', isCompleted: true },
          { id: 's-dok-5', title: 'Buku Rekening Bank untuk Payroll Gaji', isCompleted: true },
          { id: 's-dok-6', title: 'Surat Keterangan Catatan Kepolisian (SKCK)', isCompleted: true },
          { id: 's-dok-7', title: 'Surat Keterangan Sehat / Hasil MCU', isCompleted: true },
        ],
      },
      {
        id: 't-kelengkapan-data',
        title: 'Kelengkapan Data Di System',
        category: 'Legalitas & Dokumen',
        targetDepartment: 'HR',
        verificationType: 'manual',
        isMandatory: true,
        isCompleted: true,
        completedAt: '2024-07-01',
        assignedRole: 'hr_admin',
        subItems: [
          { id: 's-dat-1', title: 'Input NIK KTP 16-Digit & Nomor Kartu Keluarga ke Sistem', isCompleted: true },
          { id: 's-dat-2', title: 'Pendaftaran Nomor NPWP & Status PTKP TER Pajak', isCompleted: true },
          { id: 's-dat-3', title: 'Pendaftaran Nomor Kepesertaan BPJS Ketenagakerjaan (KPJ)', isCompleted: true },
          { id: 's-dat-4', title: 'Pendaftaran Nomor Kartu BPJS Kesehatan', isCompleted: true },
          { id: 's-dat-5', title: 'Input Nomor Rekening Bank Payroll & Nama Pemilik Rekening', isCompleted: true },
          { id: 's-dat-6', title: 'Input Kontak Darurat (Nama, Nomor Telepon & Hubungan Keluarga)', isCompleted: true },
          { id: 's-dat-7', title: 'Alamat Domisili Karyawan & Nomor Kontak WhatsApp Aktif', isCompleted: true },
        ],
      },
      {
        id: 't-kontrak',
        title: 'Tanda Tangan Kontrak Digital QR (PKWT/PKWTT) & NDA',
        category: 'Legalitas & Dokumen',
        targetDepartment: 'HR',
        verificationType: 'manual',
        isMandatory: true,
        isCompleted: true,
        completedAt: '2024-07-01',
        assignedRole: 'hr_admin',
        subItems: [
          { id: 's-kon-1', title: 'Review Draf Surat Perjanjian Kerja (PKWT/PKWTT)', isCompleted: true },
          { id: 's-kon-2', title: 'Penandatanganan Digital Dokumen Kontrak via QR Code', isCompleted: true },
          { id: 's-kon-3', title: 'Penandatanganan Non-Disclosure Agreement (NDA)', isCompleted: true },
          { id: 's-kon-4', title: 'Penandatanganan Pakta Integritas & Kode Etik Perusahaan', isCompleted: true },
          { id: 's-kon-5', title: 'Pengarsipan Salinan Dokumen Kontrak Kerja Karyawan', isCompleted: true },
        ],
      },
      {
        id: 't-idcard',
        title: 'Pengajuan ID Card & Akses Fasilitas',
        category: 'Fasilitas & GA',
        targetDepartment: 'GA',
        verificationType: 'manual',
        isMandatory: true,
        isCompleted: true,
        completedAt: '2024-07-01',
        assignedRole: 'ga_admin',
        subItems: [
          { id: 's-idc-1', title: 'Pengambilan / Upload Pas Foto Formal untuk ID Card', isCompleted: true },
          { id: 's-idc-2', title: 'Pencetakan Kartu ID Card Fisik & Lanyard NusaHR', isCompleted: true },
          { id: 's-idc-3', title: 'Aktivasi Sensor RFID Turnstile Gate Lobby Gedung', isCompleted: true },
          { id: 's-idc-4', title: 'Registrasi Hak Akses Pintu Ruang Kerja Departemen', isCompleted: true },
          { id: 's-idc-5', title: 'Penyerahan Fisik ID Card & Tanda Terima Fasilitas ke Karyawan', isCompleted: true },
        ],
      },
      {
        id: 't-perangkat',
        title: 'Pengajuan/Permintaan Perangkat',
        category: 'Inventaris & IT',
        targetDepartment: 'IT',
        verificationType: 'manual',
        isMandatory: true,
        isCompleted: false,
        assignedRole: 'it_admin',
        subItems: [
          { id: 's-prk-1', title: 'Penyiapan Unit Laptop Kerja Sesuai Standar Formasi Jabatan', isCompleted: true },
          { id: 's-prk-2', title: 'Pemasangan Stiker Label Aset (IT Asset Tag & Barcode)', isCompleted: true },
          { id: 's-prk-3', title: 'Penyiapan Kelengkapan (Charger Adaptor, Mouse & Tas Laptop)', isCompleted: false },
          { id: 's-prk-4', title: 'Pemeriksaan Kelayakan Fisik & Uji Performa Perangkat', isCompleted: false },
          { id: 's-prk-5', title: 'Penandatanganan Berita Acara Serah Terima (BAST) Perangkat', isCompleted: false },
        ],
      },
      {
        id: 't-akun',
        title: 'Penyediaan Akun-Akun Sistem & Email Korporat',
        category: 'Inventaris & IT',
        targetDepartment: 'IT',
        verificationType: 'manual',
        isMandatory: true,
        isCompleted: false,
        assignedRole: 'it_admin',
        subItems: [
          { id: 's-akn-1', title: 'Pembuatan Akun Email Korporat Resmi (@nusantara.id)', isCompleted: true },
          { id: 's-akn-2', title: 'Pembuatan Akun NusaHR Employee Portal & Absensi Mobile', isCompleted: true },
          { id: 's-akn-3', title: 'Provisioning Akses Workspace Komunikasi (Slack / Discord / Teams)', isCompleted: false },
          { id: 's-akn-4', title: 'Pemberian Hak Akses Sistem Kerja Departemen (Jira, GitHub, ERP, dsb.)', isCompleted: false },
          { id: 's-akn-5', title: 'Pengiriman Kredensial & Panduan Setup Password Pertama Kali', isCompleted: false },
        ],
      },
      {
        id: 't-orientasi',
        title: 'Orientasi Budaya Perusahaan & Office Tour',
        category: 'Pengenalan & HR',
        targetDepartment: 'HR',
        verificationType: 'manual',
        isMandatory: false,
        isCompleted: false,
        assignedRole: 'hr_admin',
        subItems: [
          { id: 's-ori-1', title: 'Office Tour & Pengenalan Denah Fasilitas Gedung Kantor', isCompleted: true },
          { id: 's-ori-2', title: 'Perkenalan dengan Rekan Tim Kerja, Manager & Head of Dept', isCompleted: true },
          { id: 's-ori-3', title: 'Penjelasan Jam Kerja, Presensi Mobile & Peraturan Perusahaan', isCompleted: false },
          { id: 's-ori-4', title: 'Sosialisasi Benefit Karyawan, Asuransi & Kebijakan HR', isCompleted: false },
          { id: 's-ori-5', title: 'Penunjukan Mentor / Buddy Kerja Selama Masa Orientasi', isCompleted: false },
        ],
      },
    ],
  },
  {
    id: 'onb-2',
    tenantId: 'tenant-ntm',
    type: 'direct',
    createdEmployeeId: 'emp-7',
    employeeName: 'Dewi Sartika',
    email: 'dewi.s@nusantara.id',
    phone: '081234567807',
    position: 'Senior UI/UX & Digital Brand Specialist',
    department: 'Engineering & Design',
    employmentType: 'Tetap',
    joinDate: '2024-03-01',
    basicSalary: 14500000,
    contractDocNumber: '034/HRD-PKWTT/NTM/III/2024',
    status: 'Completed',
    tasks: [
      { id: 't1', title: 'Verifikasi KTP 16-Digit, NPWP & Form PTKP TER 2024', category: 'Legalitas & Dokumen', isCompleted: true, completedAt: '2024-03-01', assignedRole: 'hr_admin' },
      { id: 't2', title: 'Penandatanganan SK Pengangkatan & NDA Digital QR', category: 'Legalitas & Dokumen', isCompleted: true, completedAt: '2024-03-01', assignedRole: 'hr_admin' },
      { id: 't3', title: 'Alokasi MacBook Pro 16" & Monitor 4K 27"', category: 'Fasilitas & IT', isCompleted: true, completedAt: '2024-03-02', assignedRole: 'ga_admin' },
      { id: 't4', title: 'Registrasi Payroll Rekening BCA & Kepesertaan Jaminan', category: 'Payroll & Rekening', isCompleted: true, completedAt: '2024-03-02', assignedRole: 'payroll_admin' },
      { id: 't5', title: 'Onboarding Desain Sistem & Pengenalan Tim Engineering', category: 'Pengenalan & HR', isCompleted: true, completedAt: '2024-03-03', assignedRole: 'hr_admin' },
    ],
  },
  {
    id: 'onb-3',
    tenantId: 'tenant-ntm',
    type: 'direct',
    createdEmployeeId: 'emp-9',
    employeeName: 'Ahmad Fauzi',
    email: 'ahmad.f@nusantara.id',
    phone: '081234567809',
    position: 'Building Maintenance & Fleet Driver',
    department: 'General Affairs',
    employmentType: 'Kontrak',
    joinDate: '2024-06-01',
    basicSalary: 5200000,
    contractDocNumber: '071/HRD-PKWT/NTM/VI/2024',
    status: 'Completed',
    tasks: [
      { id: 't1', title: 'Verifikasi KTP, SIM A/C & Surat Keterangan Sehat', category: 'Legalitas & Dokumen', isCompleted: true, completedAt: '2024-06-01', assignedRole: 'hr_admin' },
      { id: 't2', title: 'Tanda Tangan Kontrak Kerja PKWT 12 Bulan', category: 'Legalitas & Dokumen', isCompleted: true, completedAt: '2024-06-01', assignedRole: 'hr_admin' },
      { id: 't3', title: 'Penyerahan Kunci Armada Mobil Operasional & Kartu Tol', category: 'Fasilitas & IT', isCompleted: true, completedAt: '2024-06-01', assignedRole: 'ga_admin' },
      { id: 't4', title: 'Pendaftaran BPJS Ketenagakerjaan & Rekening Mandiri', category: 'Payroll & Rekening', isCompleted: true, completedAt: '2024-06-02', assignedRole: 'payroll_admin' },
    ],
  },
  {
    id: 'onb-4',
    tenantId: 'tenant-ntm',
    type: 'via_recruitment',
    candidateId: 'cand-2',
    employeeName: 'Kevin Wijaya',
    email: 'kevin.w@example.com',
    phone: '081388776655',
    position: 'Senior DevOps & Site Reliability Engineer',
    department: 'Engineering',
    employmentType: 'Tetap',
    joinDate: '2026-11-01',
    basicSalary: 21000000,
    contractDocNumber: '028/HRD-PKWTT/NTM/XI/2026',
    status: 'In Progress',
    tasks: [
      { id: 't1', title: 'Verifikasi KTP, NPWP & Dokumen Portofolio Asli', category: 'Legalitas & Dokumen', isCompleted: true, completedAt: '2026-10-15', assignedRole: 'hr_admin' },
      { id: 't2', title: 'Tanda Tangan Kontrak Kerja PKWTT Digital QR', category: 'Legalitas & Dokumen', isCompleted: true, completedAt: '2026-10-16', assignedRole: 'hr_admin' },
      { id: 't3', title: 'Penyediaan Laptop MacBook Pro M3 Max & ID Card Akses', category: 'Fasilitas & IT', isCompleted: false, assignedRole: 'ga_admin' },
      { id: 't4', title: 'Pembuatan Akun Email Perusahaan & Akses Server Cloud', category: 'Fasilitas & IT', isCompleted: false, assignedRole: 'ga_admin' },
      { id: 't5', title: 'Orientasi Budaya Perusahaan & Pengenalan Buddy', category: 'Pengenalan & HR', isCompleted: false, assignedRole: 'hr_admin' },
      { id: 't6', title: 'Pendaftaran Nomor Rekening Bank & Pajak TER 2024', category: 'Payroll & Rekening', isCompleted: false, assignedRole: 'payroll_admin' },
    ],
  },
];

export const INITIAL_DOCUMENT_TEMPLATES: DocumentTemplateConfig[] = [
  {
    id: 'tmpl-1',
    tenantId: 'tenant-ntm',
    type: 'PKWT',
    name: 'Perjanjian Kerja Waktu Tertentu (PKWT)',
    numberingPattern: '{SEQ}/HRD-PKWT/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `PERJANJIAN KERJA WAKTU TERTENTU (PKWT)
Nomor: {{nomor_surat}}

Pada hari ini, bertempat di kantor {{nama_perusahaan}}, para pihak yang bertanda tangan di bawah ini secara sadar dan sukarela bersepakat:
1. {{penandatangan}}, bertindak selaku {{jabatan_penandatangan}} yang sah mewakili Manajemen {{nama_perusahaan}}, berkedudukan hukum di {{alamat_perusahaan}}, selanjutnya disebut sebagai PIHAK PERTAMA.
2. {{nama}}, Pemegang KTP NIK: {{nik_ktp}}, bertempat tinggal di {{alamat_karyawan}}, selanjutnya disebut sebagai PIHAK KEDUA.

Kedua belah pihak telah bersepakat mengikatkan diri dalam Perjanjian Kerja Waktu Tertentu (PKWT) dengan syarat-syarat dan ketentuan hukum sebagai berikut:

PASAL 1: TUGAS, JABATAN & LOKASI KERJA
1. PIHAK PERTAMA mempekerjakan PIHAK KEDUA dan PIHAK KEDUA menyatakan bersedia bekerja pada posisi {{jabatan}} di Departemen {{departemen}} (Grade Golongan: {{grade}}).
2. Lokasi kerja utama bertempat di kantor {{nama_perusahaan}} di {{alamat_perusahaan}}, dengan kesediaan menjalankan penugasan dinas ke unit kerja atau rekanan perusahaan apabila dibutuhkan operasional.

PASAL 2: JANGKA WAKTU PERJANJIAN
1. Perjanjian kerja ini berlaku untuk jangka waktu tertentu terhitung mulai {{tanggal_mulai}} sampai dengan {{tanggal_berakhir}}.
2. Apabila dipandang perlu oleh PIHAK PERTAMA berdasarkan evaluasi kinerja, perpanjangan perjanjian kerja dapat diajukan sesuai koridor regulasi PP No. 35 Tahun 2021 selambat-lambatnya 14 (empat belas) hari kalender sebelum masa kontrak berakhir.

PASAL 3: WAKTU KERJA & ISTIRAHAT
1. Waktu kerja reguler adalah 8 (delapan) jam per hari atau 40 (empat puluh) jam per minggu, dari hari Senin sampai dengan Jumat pukul 08.30 WIB hingga 17.30 WIB dengan waktu istirahat 1 (satu) jam.
2. Setiap kelebihan jam kerja di luar ketentuan di atas wajib didasarkan pada Surat Perintah Kerja Lembur (SPL) resmi yang disetujui atasan.

<!-- PAGE_BREAK -->

PASAL 4: UPAH, KOMPENSASI & TUNJANGAN
1. PIHAK KEDUA berhak menerima Gaji Pokok bulanan sebesar {{gaji_pokok}} ({{gaji_terbilang}}) yang dibayarkan setiap tanggal 25 melalui rekening {{rekening}}.
2. Status kewajiban perpajakan penghasilan (PPh 21) dicatat dengan kategori PTKP: {{ptkp}} dan Nomor Pokok Wajib Pajak: {{npwp}}.
3. PIHAK PERTAMA mengikutsertakan PIHAK KEDUA dalam program Jaminan Sosial Ketenagakerjaan (JKK, JKM, JHT) dan BPJS Kesehatan sesuai ketentuan perundang-undangan RI.
4. Pada saat berakhirnya jangka waktu PKWT, PIHAK KEDUA berhak atas Uang Kompensasi PKWT sesuai masa kerja aktual berdasarkan PP No. 35 Tahun 2021.

PASAL 5: TATA TERTIB, DISIPLIN & KERAHASIAAN
1. PIHAK KEDUA wajib mematuhi seluruh Peraturan Perusahaan, menjaga etika profesionalisme, serta menggunakan fasilitas inventaris kerja secara bertanggung jawab.
2. PIHAK KEDUA dilarang keras membocorkan rahasia dagang, data nasabah, maupun kode sumber perangkat lunak {{nama_perusahaan}} kepada pihak manapun baik selama masa kerja maupun setelah berakhirnya hubungan kerja.
3. Segala pelanggaran tata tertib kerja akan dikenakan tindakan disipliner berjenjang berupa Surat Peringatan (SP) hingga Pemutusan Hubungan Kerja (PHK).

PASAL 6: PENYELESAIAN PERSELISIHAN & DOMISILI HUKUM
1. Segala perselisihan yang timbul sehubungan dengan pelaksanaan perjanjian kerja ini akan diselesaikan secara musyawarah dan mufakat secara bipartit.
2. Apabila musyawarah mufakat tidak tercapai, para pihak sepakat memilih domisili hukum yang tetap di Pengadilan Hubungan Industrial (PHI) wilayah Pengadilan Negeri Jakarta Selatan.

PASAL 7: KETENTUAN PENUTUP
Surat Perjanjian Kerja Waktu Tertentu ini diterbitkan secara sah berkekuatan hukum elektronik sesuai UU ITE No. 11/2008 Pasal 5 & 11 jo PP 71/2019 dan ditandatangani secara digital oleh para pihak.`,
    showQrSignature: true,
    signeeTitle: 'VP of Human Capital',
    signeeRole: 'Pihak Pertama (Manajemen)',
    extractedPlaceholders: ['nomor_surat', 'nama_perusahaan', 'penandatangan', 'jabatan_penandatangan', 'nama', 'nik', 'nik_ktp', 'alamat_karyawan', 'jabatan', 'departemen', 'grade', 'tanggal_mulai', 'tanggal_berakhir', 'gaji_pokok', 'gaji_terbilang', 'rekening', 'ptkp', 'npwp'],
  },
  {
    id: 'tmpl-2',
    tenantId: 'tenant-ntm',
    type: 'PKWTT',
    name: 'Surat Keputusan Pengangkatan Karyawan Tetap (PKWTT)',
    numberingPattern: '{SEQ}/DIR-SK-TETAP/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT KEPUTUSAN DIREKSI
PENGANGKATAN KARYAWAN TETAP (PKWTT)
Nomor: {{nomor_surat}}

MENIMBANG:
1. Bahwa Saudara/i {{nama}} (NIK: {{nik}}) telah menyelesaikan masa percobaan (probation) dengan hasil evaluasi kinerja, integritas, dan kompetensi yang memenuhi standar kualifikasi perusahaan.
2. Bahwa dalam rangka pemenuhan formasi kebutuhan sumber daya manusia jangka panjang, dipandang perlu untuk menetapkan status kekaryawanan Saudara/i {{nama}} menjadi Karyawan Tetap.

MENGINGAT:
1. Undang-Undang No. 13 Tahun 2003 tentang Ketenagakerjaan jo UU Cipta Kerja No. 6 Tahun 2023.
2. Peraturan Pemerintah No. 35 Tahun 2021 tentang PKWT, Alih Daya, Waktu Kerja, dan Pemutusan Hubungan Kerja.
3. Peraturan Perusahaan dan Struktur Skala Upah {{nama_perusahaan}} yang berlaku.

MEMUTUSKAN:
PASAL 1: PENGANGKATAN STATUS KEKARYAWANAN
Terhitung efektif sejak tanggal {{tanggal_terbit}}, mengangkat Saudara/i {{nama}} (NIK: {{nik}}) sebagai Karyawan Tetap (PKWTT) {{nama_perusahaan}} dengan penempatan posisi {{jabatan}} pada Departemen {{departemen}} (Grade Golongan: {{grade}}).

<!-- PAGE_BREAK -->

PASAL 2: HAK REMUNERASI & FASILITAS
1. Sebagai Karyawan Tetap, Saudara/i berhak menerima Gaji Pokok bulanan sebesar {{gaji_pokok}} ({{gaji_terbilang}}) yang ditransfer ke rekening {{rekening}}.
2. Saudara/i berhak atas fasilitas jaminan sosial ketenagakerjaan (BPJS Ketenagakerjaan Program JKK, JKM, JHT, JP), asuransi kesehatan eksekutif, tunjangan hari raya keagamaan (THR), serta hak cuti tahunan sesuai regulasi.

PASAL 3: KEWAJIBAN, TANGGUNG JAWAB & KODE ETIK
1. Melaksanakan tugas dan tanggung jawab kepemimpinan dengan dedikasi prima, mematuhi seluruh Standard Operating Procedure (SOP) dan Peraturan Perusahaan yang berlaku.
2. Memegang teguh prinsip kerahasiaan informasi perusahaan dan mencegah terjadinya benturan kepentingan (conflict of interest).

PASAL 4: KETENTUAN PENUTUP
1. Surat Keputusan ini berlaku mengikat kedua belah pihak sejak tanggal ditetapkan.
2. Apabila di kemudian hari terdapat kekeliruan dalam penetapan ini, maka akan dilakukan perbaikan dan penyesuaian sebagaimana mestinya.`,
    showQrSignature: true,
    signeeTitle: 'President Director & CEO',
    signeeRole: 'Direksi Perusahaan',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'departemen', 'jabatan', 'grade', 'nama_perusahaan', 'gaji_pokok', 'gaji_terbilang', 'tanggal_terbit', 'rekening'],
  },
  {
    id: 'tmpl-3',
    tenantId: 'tenant-ntm',
    type: 'Surat Promosi',
    name: 'Surat Keputusan Promosi Jabatan & Penyesuaian Upah',
    numberingPattern: '{SEQ}/HRD-SK-PRO/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT KEPUTUSAN DIREKSI
PROMOSI JABATAN & KENAIKAN GRADE STRUKTURAL
Nomor: {{nomor_surat}}

MENIMBANG:
1. Bahwa Saudara/i {{nama}} (NIK: {{nik}}) telah membuktikan pencapaian Key Performance Indicators (KPI) dengan predikat kinerja sangat memuaskan serta menunjukkan kapasitas kepemimpinan yang unggul.
2. Bahwa untuk mendukung akselerasi transformasi bisnis dan pengembangan divisi {{departemen}}, dibutuhkan kepemimpinan struktural pada jenjang yang lebih tinggi.

MENGINGAT:
1. Anggaran Dasar dan Pedoman Jenjang Karier Karyawan {{nama_perusahaan}}.
2. Hasil Uji Kelayakan dan Kepatutan (Fit & Proper Test) Komite Remunerasi & Karier.

MEMUTUSKAN:
PASAL 1: PROMOSI JABATAN
Memberikan Promosi Jabatan kepada Saudara/i {{nama}} dari jenjang sebelumnya menjadi {{jabatan}} pada unit kerja Departemen {{departemen}} (Grade: {{grade}}) terhitung sejak tanggal {{tanggal_terbit}}.

<!-- PAGE_BREAK -->

PASAL 2: PENYESUAIAN REMUNERASI & KOMPENSASI
1. Sehubungan dengan peningkatan wewenang dan tanggung jawab jabatan baru, gaji pokok Saudara/i disesuaikan menjadi {{gaji_pokok}} ({{gaji_terbilang}}) per bulan.
2. Saudara/i berhak menerima tunjangan jabatan struktural, tunjangan komunikasi, serta fasilitas pendukung manajerial sesuai tingkatan Grade {{grade}}.

PASAL 3: WEWENANG OPERASIONAL
1. Memimpin jalannya operasional tim, menetapkan target berkala anggota unit, dan memberikan evaluasi kinerja bawahan.
2. Menyetujui pengajuan operasional dan anggaran kerja divisi sesuai batas kewenangan finansial perusahaan.

PASAL 4: PENUTUP
Keputusan ini berlaku sejak tanggal ditetapkan dengan ketentuan bahwa segala hak dan tanggung jawab baru mulai efektif dijalankan terhitung sejak tanggal penerbitan.`,
    showQrSignature: true,
    signeeTitle: 'Direktur Sumber Daya Manusia',
    signeeRole: 'Pemberi Mandat',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'tanggal_terbit', 'jabatan', 'departemen', 'grade', 'gaji_pokok', 'gaji_terbilang'],
  },
  {
    id: 'tmpl-4',
    tenantId: 'tenant-ntm',
    type: 'Surat Mutasi',
    name: 'Surat Keputusan Mutasi & Rotasi Unit Kerja',
    numberingPattern: '{SEQ}/HRD-SK-MUT/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT KEPUTUSAN MUTASI & ROTASI INTERNAL
Nomor: {{nomor_surat}}

MENIMBANG:
Kebutuhan strategis penguatan operasional organisasi dan optimalisasi kapabilitas sumber daya manusia {{nama_perusahaan}}.

MEMUTUSKAN:
PASAL 1: Terhitung mulai {{tanggal_terbit}}, memindahkan tugas (Mutasi) Saudara/i {{nama}} (NIK: {{nik}}) ke posisi {{jabatan}} pada unit kerja Departemen {{departemen}}.
PASAL 2: Penyesuaian hak akses sistem dan alokasi ruang kerja unit baru dikoordinasikan bersama Bagian Umum (GA).
PASAL 3: Seluruh proses serah terima pekerjaan wajib diselesaikan maksimal 7 (tujuh) hari kerja sejak tanggal penerbitan surat keputusan ini.`,
    showQrSignature: true,
    signeeTitle: 'VP of Human Capital',
    signeeRole: 'Pejabat Penetap',
    extractedPlaceholders: ['nomor_surat', 'nama_perusahaan', 'tanggal_terbit', 'nama', 'nik', 'jabatan', 'departemen'],
  },
  {
    id: 'tmpl-5',
    tenantId: 'tenant-ntm',
    type: 'Surat Demosi',
    name: 'Surat Keputusan Demosi & Penyesuaian Kinerja',
    numberingPattern: '{SEQ}/HRD-SK-DEM/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT KEPUTUSAN DEMOSI JABATAN
Nomor: {{nomor_surat}}

MENIMBANG:
Hasil evaluasi kinerja komprehensif serta audit kepatuhan manajerial atas Saudara/i {{nama}} (NIK: {{nik}}).

MEMUTUSKAN:
PASAL 1: Memberlakukan Demosi (penurunan jabatan) kepada Saudara/i {{nama}} menjadi {{jabatan}} pada Departemen {{departemen}} (Grade: {{grade}}).
PASAL 2: Menyesuaikan kompensasi gaji pokok menjadi {{gaji_pokok}} ({{gaji_terbilang}}) per bulan serta mencabut fasilitas tunjangan struktural sebelumnya.
PASAL 3: Mewajibkan yang bersangkutan mengikuti Program Peningkatan Kinerja (Performance Improvement Plan) selama 90 hari kalender.`,
    showQrSignature: true,
    signeeTitle: 'VP of Human Capital & Compliance',
    signeeRole: 'Pejabat Penetap Disiplin',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'jabatan', 'departemen', 'grade', 'gaji_pokok', 'gaji_terbilang'],
  },
  {
    id: 'tmpl-6',
    tenantId: 'tenant-ntm',
    type: 'Surat Penetapan Plt',
    name: 'Surat Keputusan Penetapan Pelaksana Tugas (Plt / Acting Role)',
    numberingPattern: '{SEQ}/HRD-SK-PLT/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT KEPUTUSAN PENETAPAN PELAKSANA TUGAS (PLT)
Nomor: {{nomor_surat}}

MENIMBANG:
Mengisi kekosongan kepemimpinan fungsional pada Departemen {{departemen}} guna menjamin kelancaran roda operasional perusahaan.

MEMUTUSKAN:
PASAL 1: Menunjuk Saudara/i {{nama}} (NIK: {{nik}}) di samping tugas pokoknya saat ini, untuk bertindak selaku Pelaksana Tugas (Plt) {{jabatan}}.
PASAL 2: Pelaksana Tugas diberikan hak wewenang supervisi manajerial dan approval operasional tingkat unit.
PASAL 3: Penugasan ini berlaku maksimal 6 (enam) bulan terhitung sejak {{tanggal_terbit}} sampai pejabat definitif ditetapkan.`,
    showQrSignature: true,
    signeeTitle: 'Managing Director',
    signeeRole: 'Direksi Operasional',
    extractedPlaceholders: ['nomor_surat', 'departemen', 'nama', 'nik', 'jabatan', 'tanggal_terbit'],
  },
  {
    id: 'tmpl-7',
    tenantId: 'tenant-ntm',
    type: 'Addendum PKWT',
    name: 'Addendum Perpanjangan Kontrak Kerja Waktu Tertentu',
    numberingPattern: '{SEQ}/ADD-PKWT/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `ADDENDUM PERJANJIAN KERJA WAKTU TERTENTU
Nomor: {{nomor_surat}}

Menyambung Perjanjian Kerja Waktu Tertentu sebelumnya, Manajemen {{nama_perusahaan}} dengan Saudara/i {{nama}} (NIK: {{nik}}), sepakat menyetujui:
PASAL 1: Memperpanjang jangka waktu hubungan kerja Saudara/i {{nama}} sebagai {{jabatan}} pada Departemen {{departemen}} sampai dengan tanggal {{tanggal_berakhir}}.
PASAL 2: Besaran Gaji Pokok ditetapkan sebesar {{gaji_pokok}} ({{gaji_terbilang}}) per bulan.
PASAL 3: Seluruh pasal dan ketentuan dalam perjanjian induk yang tidak diubah dalam addendum ini tetap berlaku sah dan mengikat.`,
    showQrSignature: true,
    signeeTitle: 'Head of People Operations',
    signeeRole: 'Pihak Pertama',
    extractedPlaceholders: ['nomor_surat', 'nama_perusahaan', 'nama', 'nik', 'jabatan', 'departemen', 'tanggal_berakhir', 'gaji_pokok', 'gaji_terbilang'],
  },
  {
    id: 'tmpl-8',
    tenantId: 'tenant-ntm',
    type: 'Surat Peringatan SP 1',
    name: 'Surat Peringatan Tingkat Pertama (SP-1)',
    numberingPattern: '{SEQ}/HRD-SP1/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT PERINGATAN PERTAMA (SP-1)
Nomor: {{nomor_surat}}

Diberikan kepada:
Nama: {{nama}}
NIK: {{nik}}
Jabatan: {{jabatan}}
Departemen: {{departemen}}

Berdasarkan hasil catatan presensi dan pelanggaran tata tertib kerja disipliner di lingkungan {{nama_perusahaan}}.
Melalui surat ini, Manajemen memberikan Peringatan Pertama (SP-1) agar Saudara/i segera memperbaiki kedisiplinan dan kepatuhan kerja.
Masa berlaku Surat Peringatan ini adalah 6 (enam) bulan terhitung sejak {{tanggal_terbit}}. Apabila terjadi pengulangan pelanggaran, akan ditingkatkan ke sanksi yang lebih berat sesuai UU Ketenagakerjaan.`,
    showQrSignature: true,
    signeeTitle: 'Manager Industrial Relations & Compliance',
    signeeRole: 'Bagian Kedisiplinan Karyawan',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'jabatan', 'departemen', 'nama_perusahaan', 'tanggal_terbit'],
  },
  {
    id: 'tmpl-9',
    tenantId: 'tenant-ntm',
    type: 'Surat Peringatan SP 2',
    name: 'Surat Peringatan Tingkat Kedua (SP-2)',
    numberingPattern: '{SEQ}/HRD-SP2/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT PERINGATAN KEDUA (SP-2)
Nomor: {{nomor_surat}}

Diberikan kepada:
Nama: {{nama}}
NIK: {{nik}}
Jabatan: {{jabatan}}
Departemen: {{departemen}}

Menindaklanjuti ketidakpatuhan berkelanjutan setelah diterbitkannya Surat Peringatan Pertama, Manajemen {{nama_perusahaan}} menetapkan SURAT PERINGATAN KEDUA (SP-2).
Saudara/i diwajibkan melakukan konseling bersama Human Capital dan mematuhi target perbaikan kedisiplinan. Surat Peringatan ini berlaku selama 6 (enam) bulan sejak {{tanggal_terbit}}.`,
    showQrSignature: true,
    signeeTitle: 'VP of Human Capital',
    signeeRole: 'Pejabat Penegak Disiplin',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'jabatan', 'departemen', 'nama_perusahaan', 'tanggal_terbit'],
  },
  {
    id: 'tmpl-10',
    tenantId: 'tenant-ntm',
    type: 'Surat Peringatan SP 3',
    name: 'Surat Peringatan Tingkat Ketiga / Terakhir (SP-3)',
    numberingPattern: '{SEQ}/HRD-SP3/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT PERINGATAN KETIGA / TERAKHIR (SP-3)
Nomor: {{nomor_surat}}

Diberikan kepada:
Nama: {{nama}}
NIK: {{nik}}
Jabatan: {{jabatan}}
Departemen: {{departemen}}

Diterbitkan sebagai tindakan disiplin tingkat akhir atas pelanggaran berulang terhadap Peraturan Perusahaan {{nama_perusahaan}}.
Peringatan ini berlaku 6 (enam) bulan terhitung sejak {{tanggal_terbit}}. Pelanggaran lanjutan selama masa aktif ini akan langsung berakibat Pemutusan Hubungan Kerja (PHK) sepihak sesuai ketentuan hukum yang berlaku.`,
    showQrSignature: true,
    signeeTitle: 'Director of Human Resources & Legal',
    signeeRole: 'Direksi Penegak Disiplin',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'jabatan', 'departemen', 'nama_perusahaan', 'tanggal_terbit'],
  },
  {
    id: 'tmpl-11',
    tenantId: 'tenant-ntm',
    type: 'Offering Letter',
    name: 'Surat Penawaran Kerja Resmi (Job Offering Letter)',
    numberingPattern: '{SEQ}/OL-HRD/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT PENAWARAN KERJA RESMI (OFFERING LETTER)
Nomor: {{nomor_surat}}

Kepada Yth:
Saudara/i {{nama}}

Dengan hormat,
Manajemen {{nama_perusahaan}} dengan bangga menawarkan kesempatan berkarir untuk posisi:
- Jabatan: {{jabatan}}
- Departemen: {{departemen}}
- Gaji Pokok Yang Ditawarkan: {{gaji_pokok}} ({{gaji_terbilang}})
- Perkiraan Tanggal Mulai: {{tanggal_mulai}}

Fasilitas kompensasi meliputi perlindungan asuransi kesehatan BPJS, tunjangan komunikasi, dan bonus kinerja tahunan. Penawaran ini berlaku 7 (tujuh) hari kerja sejak diterbitkan.`,
    showQrSignature: true,
    signeeTitle: 'Head of Talent Acquisition',
    signeeRole: 'Human Capital Recruitment',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nama_perusahaan', 'jabatan', 'departemen', 'gaji_pokok', 'gaji_terbilang', 'tanggal_mulai'],
  },
  {
    id: 'tmpl-12',
    tenantId: 'tenant-ntm',
    type: 'Surat Perintah Perjalanan Dinas',
    name: 'Surat Perintah Perjalanan Dinas Resmi (SPPD)',
    numberingPattern: '{SEQ}/SPPD-HRD/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT PERINTAH PERJALANAN DINAS (SPPD)
Nomor: {{nomor_surat}}

Pejabat Pemberi Perintah menugaskan kepada:
1. Nama Pelaksana: {{nama}}
2. NIK: {{nik}}
3. Jabatan: {{jabatan}}
4. Departemen: {{departemen}}

Untuk melaksanakan Perjalanan Dinas Resmi penugasan proyek dan koordinasi operasional terhitung sejak tanggal {{tanggal_terbit}}.
Seluruh biaya akomodasi, tiket perjalanan, dan uang harian (per diem) dibebankan pada pos anggaran perjalanan dinas {{nama_perusahaan}}.`,
    showQrSignature: true,
    signeeTitle: 'Head of Division / Finance Director',
    signeeRole: 'Pejabat Pemberi Mandat Perjalanan Dinas',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'jabatan', 'departemen', 'tanggal_terbit', 'nama_perusahaan'],
  },
  {
    id: 'tmpl-13',
    tenantId: 'tenant-ntm',
    type: 'Paklaring',
    name: 'Surat Keterangan Pengalaman Kerja (Certificate of Employment)',
    numberingPattern: '{SEQ}/SK-PKL/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT KETERANGAN PENGALAMAN KERJA (PAKLARING)
Nomor: {{nomor_surat}}

Manajemen {{nama_perusahaan}} menerangkan dengan sebenarnya bahwa:
Nama: {{nama}}
NIK: {{nik}}
Jabatan Terakhir: {{jabatan}}
Departemen: {{departemen}}

Telah bekerja dengan integritas dan dedikasi yang baik terhitung sejak {{tanggal_mulai}} sampai dengan {{tanggal_berakhir}}.
Perusahaan mengucapkan terima kasih dan apresiasi sebesar-besarnya atas sumbangsih tenaga dan pikiran yang telah diberikan.`,
    showQrSignature: true,
    signeeTitle: 'VP of Human Capital',
    signeeRole: 'Atas Nama Manajemen',
    extractedPlaceholders: ['nomor_surat', 'nama_perusahaan', 'nama', 'nik', 'jabatan', 'departemen', 'tanggal_mulai', 'tanggal_berakhir'],
  },
  {
    id: 'tmpl-14',
    tenantId: 'tenant-ntm',
    type: 'Surat Pemutusan Hubungan Kerja (PHK)',
    name: 'Surat Keputusan Pengakhiran Hubungan Kerja & Exit Clearance',
    numberingPattern: '{SEQ}/DIR-SK-PHK/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT KEPUTUSAN PENGAKHIRAN HUBUNGAN KERJA
Nomor: {{nomor_surat}}

MENIMBANG:
Ketentuan perundang-undangan ketenagakerjaan RI serta penyelesaian prosedur penonaktifan kerja di {{nama_perusahaan}}.

MEMUTUSKAN:
PASAL 1: Mengakhiri hubungan kerja Saudara/i {{nama}} (NIK: {{nik}}), jabatan {{jabatan}} pada Departemen {{departemen}} efektif per tanggal {{tanggal_berakhir}}.
PASAL 2: Hak kompensasi pesangon, penghargaan masa kerja, dan penggantian hak dibayarkan sesuai ketentuan PP 35/2021.
PASAL 3: Seluruh inventaris, kartu akses, dan data perusahaan wajib diserahterimakan penuh melalui Bagian Umum (GA).`,
    showQrSignature: true,
    signeeTitle: 'President Director & CEO',
    signeeRole: 'Direksi Perusahaan',
    extractedPlaceholders: ['nomor_surat', 'nama_perusahaan', 'nama', 'nik', 'jabatan', 'departemen', 'tanggal_berakhir'],
  },
  {
    id: 'tmpl-15',
    tenantId: 'tenant-ntm',
    type: 'BAST Aset',
    name: 'Berita Acara Serah Terima Aset & Inventaris Kerja (GA)',
    numberingPattern: '{SEQ}/BAST-GA/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `BERITA ACARA SERAH TERIMA ASET KERJA (BAST)
Nomor: {{nomor_surat}}

Pada tanggal {{tanggal_terbit}}, telah dilakukan serah terima fasilitas inventaris logistik antara Bagian Umum {{nama_perusahaan}} dengan:
Nama Karyawan: {{nama}}
NIK: {{nik}}
Posisi / Unit: {{jabatan}} - {{departemen}}

Karyawan bersangkutan menerima fasilitas peralatan kerja dalam kondisi baik dan berfungsi prima. Pihak penerima bertanggung jawab penuh menjaga, merawat, dan mengembalikan aset inventaris saat masa penugasan berakhir.`,
    showQrSignature: true,
    signeeTitle: 'General Affairs & Asset Lead',
    signeeRole: 'Bagian Logistik & Sarana',
    extractedPlaceholders: ['nomor_surat', 'tanggal_terbit', 'nama_perusahaan', 'nama', 'nik', 'jabatan', 'departemen'],
  },
  {
    id: 'tmpl-16',
    tenantId: 'tenant-ntm',
    type: 'Slip Gaji Karyawan',
    name: 'Bukti Resmi Pembayaran Upah & Slip Gaji Bulanan (Official Payslip)',
    numberingPattern: '{SEQ}/PAY/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `BUKTI PEMBAYARAN PENGGAJIAN RESMI (PAYSLIP VOUCHER)
Nomor: {{nomor_surat}}

Nama Karyawan: {{nama}}
NIK: {{nik}} | Status Pajak: {{ptkp}}
Jabatan: {{jabatan}} | Departemen: {{departemen}}
Rekening Transfer: {{rekening}}

KOMPONEN PENGHASILAN:
1. Gaji Pokok: {{gaji_pokok}} ({{gaji_terbilang}})
2. Tunjangan Fungsional & Lembur: Sesuai perhitungan absensi presensi
3. Potongan Wajib: PPh 21, BPJS Ketenagakerjaan (JHT, JP), BPJS Kesehatan

Dokumen ini merupakan bukti sah transfer penggajian dan dilindungi keotentikan QR validasi audit sistem NusaHR Enterprise.`,
    showQrSignature: true,
    signeeTitle: 'Payroll & Compensation Manager',
    signeeRole: 'Finance & Remuneration',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'ptkp', 'jabatan', 'departemen', 'rekening', 'gaji_pokok', 'gaji_terbilang'],
  },
  {
    id: 'tmpl-17',
    tenantId: 'tenant-ntm',
    type: 'Surat Keputusan Cuti',
    name: 'Surat Persetujuan & Pengesahan Hak Cuti Karyawan',
    numberingPattern: '{SEQ}/CUTI-HRD/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT PERSETUJUAN HAK CUTI KARYAWAN
Nomor: {{nomor_surat}}

Berdasarkan pengajuan permohonan cuti pada sistem NusaHR, manajemen memberikan persetujuan kepada:
Nama: {{nama}}
NIK: {{nik}}
Jabatan: {{jabatan}}
Departemen: {{departemen}}

Hak cuti disetujui terhitung mulai tanggal {{tanggal_terbit}}. Seluruh delegasi tugas pekerjaan selama masa cuti telah diserahterimakan kepada rekan kerja pengganti sesuai persetujuan atasan langsung.`,
    showQrSignature: true,
    signeeTitle: 'Head of People Operations',
    signeeRole: 'Human Capital Department',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'jabatan', 'departemen', 'tanggal_terbit'],
  },
  {
    id: 'tmpl-18',
    tenantId: 'tenant-ntm',
    type: 'Surat Perintah Lembur',
    name: 'Surat Perintah Kerja Lembur (Overtime Mandate)',
    numberingPattern: '{SEQ}/SPKL-HRD/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT PERINTAH KERJA LEMBUR (SPKL)
Nomor: {{nomor_surat}}

Memberikan instruksi kerja lembur dalam rangka percepatan penyelesaian target operasional kepada:
Nama: {{nama}}
NIK: {{nik}}
Jabatan: {{jabatan}}
Departemen: {{departemen}}

Kompensasi upah lembur dihitung berlandaskan PP No. 35 Tahun 2021 dan diverifikasi melalui catatan presensi sistem NusaHR.`,
    showQrSignature: true,
    signeeTitle: 'Department Head & Operational Lead',
    signeeRole: 'Pemberi Mandat Lembur',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'jabatan', 'departemen'],
  },
  {
    id: 'tmpl-19',
    tenantId: 'tenant-ntm',
    type: 'Formulir Pinjaman / Kasbon',
    name: 'Surat Persetujuan & Perjanjian Fasilitas Pinjaman Karyawan',
    numberingPattern: '{SEQ}/LOAN-HRD/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT PERSETUJUAN PINJAMAN KASBON KARYAWAN
Nomor: {{nomor_surat}}

Pihak Manajemen {{nama_perusahaan}} menyetujui permohonan fasilitas pinjaman dana internal kepada:
Nama: {{nama}}
NIK: {{nik}}
Jabatan: {{jabatan}}
Departemen: {{departemen}}

Pengembalian pinjaman dilakukan melalui skema pemotongan langsung pada slip penggajian bulanan (payroll deduction) sesuai masa tenor dan plafon yang disepakati.`,
    showQrSignature: true,
    signeeTitle: 'Finance Director & Treasury Lead',
    signeeRole: 'Komite Pembiayaan Internal',
    extractedPlaceholders: ['nomor_surat', 'nama_perusahaan', 'nama', 'nik', 'jabatan', 'departemen'],
  },
  {
    id: 'tmpl-20',
    tenantId: 'tenant-ntm',
    type: 'Perjanjian Kerahasiaan (NDA)',
    name: 'Non-Disclosure Agreement Kerahasiaan Data & Rahasia Dagang (NDA)',
    numberingPattern: '{SEQ}/LEGAL-NDA/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `PERJANJIAN KERAHASIAAN INFORMASI & DATA RAHASIA DAGANG (NDA)
Nomor: {{nomor_surat}}

Antara {{nama_perusahaan}} dengan Saudara/i {{nama}} (NIK: {{nik}}), jabatan {{jabatan}} pada Departemen {{departemen}}.
PIHAK KEDUA berjanji tidak akan menyebarluaskan, mendistribusikan, menyalin, atau memanfaatkan informasi rahasia, source code, data nasabah, maupun rahasia dagang perusahaan untuk kepentingan pribadi maupun pihak ketiga tanpa izin tertulis dari direksi perusahaan.
Pelanggaran atas ketentuan ini tunduk pada UU Rahasia Dagang dan UU ITE yang berlaku di wilayah Republik Indonesia.`,
    showQrSignature: true,
    signeeTitle: 'Chief Legal Officer & Corporate Secretary',
    signeeRole: 'Legal & Kepatuhan',
    extractedPlaceholders: ['nomor_surat', 'nama_perusahaan', 'nama', 'nik', 'jabatan', 'departemen'],
  },
  {
    id: 'tmpl-21',
    tenantId: 'tenant-ntm',
    type: 'SK Pengangkatan Tenaga Ahli',
    name: 'Surat Keputusan Pengangkatan Tenaga Ahli / Konsultan Independen',
    numberingPattern: '{SEQ}/DIR-SK-AHLI/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT KEPUTUSAN DIREKSI
PENGANGKATAN TENAGA AHLI / KONSULTAN INDEPENDEN
Nomor: {{nomor_surat}}

MENIMBANG:
1. Bahwa dalam rangka percepatan inisiatif transformasi digital, arsitektur enterprise, dan penguatan tata kelola kepatuhan hukum korporasi di {{nama_perusahaan}}, diperlukan keahlian khusus dan kepakaran independen tingkat tinggi.
2. Bahwa Saudara/i {{nama}} (NIK / No. KTP: {{nik_ktp}}) dinilai memiliki kompetensi profesional, rekam jejak industri teruji, dan reputasi keilmuan yang memenuhi syarat untuk diangkat sebagai Tenaga Ahli.

MENGINGAT:
1. Undang-Undang No. 13 Tahun 2003 tentang Ketenagakerjaan jo UU Cipta Kerja No. 6 Tahun 2023.
2. Anggaran Dasar dan Pedoman Kemitraan Profesional {{nama_perusahaan}}.

MEMUTUSKAN:
PASAL 1: PENGANGKATAN & JABATAN
Mengangkat Saudara/i {{nama}} sebagai Tenaga Ahli / Konsultan Senior pada unit kerja {{departemen}} {{nama_perusahaan}} terhitung sejak {{tanggal_mulai}} sampai dengan {{tanggal_berakhir}}.

PASAL 2: RUANG LINGKUP PENUGASAN (SCOPE OF WORK)
1. Memberikan arahan strategis, advis teknis, dan audit independen terhadap peta jalan implementasi arsitektur sistem.
2. Menyusun rekomendasi manajerial dan policy paper berkala kepada jajaran Direksi {{nama_perusahaan}}.
3. Melakukan pendampingan dan transfer knowledge kepada tim fungsional internal.

<!-- PAGE_BREAK -->

PASAL 3: HONORARIUM, RETENSI & PAJAK
1. Tenaga Ahli berhak menerima Honorarium Jasa Konsultansi sebesar {{gaji_pokok}} ({{gaji_terbilang}}) per bulan yang dibayarkan melalui transfer ke rekening {{rekening}}.
2. Pemotongan Pajak Penghasilan (PPh 21 / PPh 23 Tenaga Ahli) dilakukan langsung oleh {{nama_perusahaan}} sesuai ketentuan perpajakan Coretax DJP yang berlaku dengan NPWP: {{npwp}}.
3. Fasilitas penunjang operasional, ruang kerja konsultasi, dan akses sistem disediakan selama periode penugasan aktif.

PASAL 4: KERAHASIAAN INFORMASI & KEPEMILIKAN INTELEKTUAL
1. Seluruh dokumen kajian, arsitektur teknis, dan rekomendasi yang dihasilkan merupakan Hak Kekayaan Intelektual (HKI) milik penuh {{nama_perusahaan}}.
2. Tenaga Ahli wajib mematuhi pakta integritas dan Non-Disclosure Agreement (NDA) serta tidak membocorkan data kepada pihak ketiga tanpa persetujuan tertulis Direksi.

PASAL 5: KETENTUAN PENUTUP
Surat Keputusan ini berlaku efektif sejak tanggal ditetapkan dan ditandatangani secara sah berkekuatan hukum elektronik.`,
    showQrSignature: true,
    signeeTitle: 'President Director & CEO',
    signeeRole: 'Pemberi Mandat / Direksi',
    extractedPlaceholders: ['nomor_surat', 'nama_perusahaan', 'nama', 'nik_ktp', 'departemen', 'tanggal_mulai', 'tanggal_berakhir', 'gaji_pokok', 'gaji_terbilang', 'rekening', 'npwp'],
  },
  {
    id: 'tmpl-22',
    tenantId: 'tenant-ntm',
    type: 'Sertifikat Selesai Magang',
    name: 'Sertifikat Telah Selesai Magang (Certificate of Internship Completion)',
    numberingPattern: '{SEQ}/CERT-INT/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SERTIFIKAT KELULUSAN PROGRAM MAGANG
CERTIFICATE OF INTERNSHIP COMPLETION
Nomor Registrasi: {{nomor_surat}}

Diberikan dengan bangga kepada:
{{nama}}
Nomor Induk / NIM: {{nik}}
Institusi Pendidikan: {{institusi}}

Telah menyelesaikan secara memuaskan Program Magang Kerja Industri (Certified Internship Program) pada:
Departemen / Divisi: {{departemen}}
Posisi / Fokus Keahlian: {{jabatan}}
Periode Pelaksanaan: {{tanggal_mulai}} s/d {{tanggal_berakhir}}

HASIL EVALUASI KOMPETENSI:
1. Penguasaan Keterampilan Teknis (Hard Skills): PREDIKAT SANGAT BAIK (A)
2. Kemampuan Komunikasi & Kerjasama Tim: PREDIKAT SANGAT BAIK (A)
3. Kedisiplinan, Inisiatif & Etika Kerja: PREDIKAT SANGAT BAIK (A)
4. Proyek Akhir Magang (Capstone Project): Diterima Penuh oleh Tim Engineering

Manajemen {{nama_perusahaan}} menyampaikan penghargaan dan ucapan terima kasih atas dedikasi serta kontribusi nyata yang telah ditunjukkan selama program magang berlangsung.`,
    showQrSignature: true,
    signeeTitle: 'VP of Human Capital & Talent Development',
    signeeRole: 'Penyelenggara Program Magang',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'institusi', 'departemen', 'jabatan', 'tanggal_mulai', 'tanggal_berakhir', 'nama_perusahaan'],
  },
  {
    id: 'tmpl-23',
    tenantId: 'tenant-ntm',
    type: 'Surat Pernyataan Magang',
    name: 'Surat Pernyataan & Perjanjian Kesepakatan Program Magang (Internship Agreement)',
    numberingPattern: '{SEQ}/INT-AGR/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT PERNYATAAN KESEPAKATAN PROGRAM MAGANG
Nomor: {{nomor_surat}}

Yang bertanda tangan di bawah ini:
Nama Lengkap: {{nama}}
NIK / No. KTP: {{nik_ktp}}
Asal Kampus / Sekolah: {{institusi}}
Program Studi: {{jurusan}}
Alamat Domisili: {{alamat_karyawan}}
Nomor Kontak: {{nomor_telepon}}

Dengan ini menyatakan bersedia dan berjanji mengikatkan diri dalam Program Magang Industri di {{nama_perusahaan}} dengan ketentuan:
1. Melaksanakan pembelajaran dan praktik kerja di Departemen {{departemen}} mulai tanggal {{tanggal_mulai}} sampai {{tanggal_berakhir}}.
2. Menerima Uang Saku Transportasi & Makan bulanan sebesar {{gaji_pokok}} yang dibayarkan setiap tanggal cut-off penggajian.
3. Wajib mematuhi seluruh jam kerja operasional (08.30 - 17.30 WIB), tata tertib berpakaian rapi, dan menjaga nama baik perusahaan.
4. Menjaga kerahasiaan seluruh dokumen, data pelanggan, kode sumber aplikasi, dan rahasia dagang {{nama_perusahaan}}.
5. Menyusun laporan akhir kegiatan magang dan mempresentasikannya di hadapan Mentor Pembimbing sebelum masa magang berakhir.

Demikian Surat Pernyataan ini saya buat dengan sadar, penuh rasa tanggung jawab, dan tanpa paksaan dari pihak manapun.`,
    showQrSignature: true,
    signeeTitle: 'Head of People Operations',
    signeeRole: 'Pihak Pertama (Manajemen)',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik_ktp', 'institusi', 'jurusan', 'alamat_karyawan', 'nomor_telepon', 'nama_perusahaan', 'departemen', 'tanggal_mulai', 'tanggal_berakhir', 'gaji_pokok'],
  },
  {
    id: 'tmpl-24',
    tenantId: 'tenant-ntm',
    type: 'Slip Gaji Karyawan',
    name: 'Bukti Resmi Pembayaran Gaji Karyawan (Slip Gaji Ringkas A5)',
    numberingPattern: '{SEQ}/PAY-A5/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A5',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    defaultBody: `BUKTI TRANSFER PEMBAYARAN PENGGAJIAN (PAYSLIP)
Periode Penggajian: {{periode_gaji}} | No: {{nomor_surat}}

DATA PEGAWAI:
Nama: {{nama}} (NIK: {{nik}})
Jabatan: {{jabatan}} | Divisi: {{departemen}}
Status Pajak: {{ptkp}} | NPWP: {{npwp}}
Rekening Tujuan: {{rekening}}

RINCIAN PENERIMAAN:
1. Gaji Pokok: {{gaji_pokok}}
2. Tunjangan Tetap / Posisi: {{tunjangan_tetap}}
3. Tunjangan Transport & Makan: {{tunjangan_makan}}
4. Kompensasi Lembur Resmi: {{upah_lembur}}
TOTAL PENGHASILAN BRUTO: {{total_bruto}}

POTONGAN RESMI:
1. PPh Pasal 21 (Coretax): {{potongan_pph21}}
2. Iuran BPJS Ketenagakerjaan (JHT 2% + JP 1%): {{potongan_bpjstk}}
3. Iuran BPJS Kesehatan (1%): {{potongan_bpjskes}}
4. Potongan Pinjaman Karyawan / Kasbon: {{potongan_kasbon}}
TOTAL POTONGAN: {{total_potongan}}

GAJI BERSIH DITERIMA (TAKE HOME PAY): {{thp_bersih}}
Terbilang: {{thp_terbilang}}

Dokumen ini dicetak otomatis dari Sistem HRMS & sah menurut UU ITE No. 11/2008.`,
    showQrSignature: true,
    signeeTitle: 'Payroll & Remuneration Lead',
    signeeRole: 'Finance & Human Capital',
    extractedPlaceholders: ['periode_gaji', 'nomor_surat', 'nama', 'nik', 'jabatan', 'departemen', 'ptkp', 'npwp', 'rekening', 'gaji_pokok', 'tunjangan_tetap', 'tunjangan_makan', 'upah_lembur', 'total_bruto', 'potongan_pph21', 'potongan_bpjstk', 'potongan_bpjskes', 'potongan_kasbon', 'thp_bersih', 'thp_terbilang'],
  },
  {
    id: 'tmpl-25',
    tenantId: 'tenant-ntm',
    type: 'Pengajuan Perjalanan Dinas',
    name: 'Formulir Permohonan Pengajuan Perjalanan Dinas & Anggaran',
    numberingPattern: '{SEQ}/REQ-TRAV/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `FORMULIR PERMOHONAN PENGAJUAN PERJALANAN DINAS
Nomor Form: {{nomor_surat}}

A. IDENTITAS PEMOHON
Nama Pemohon: {{nama}}
NIK: {{nik}}
Jabatan / Departemen: {{jabatan}} - {{departemen}}
Nomor Telepon: {{nomor_telepon}}

B. RINCIAN RENCANA PERJALANAN DINAS
Kota Tujuan: {{kota_tujuan}}
Lokasi Proyek / Klien: {{nama_klien_lokasi}}
Tanggal Berangkat: {{tanggal_berangkat}}
Tanggal Kembali: {{tanggal_kembali}} (Durasi: {{durasi_hari}} Hari Kalender)
Tujuan & Urgensi Penugasan:
{{tujuan_penugasan}}

C. ESTIMASI RENCANA ANGGARAN BIAYA (RAB)
1. Tiket Transportasi (Pesawat / Kereta): {{biaya_tiket}}
2. Akomodasi Hotel / Penginapan: {{biaya_hotel}}
3. Uang Harian (Per Diem / Konsumsi / Transport Lokal): {{biaya_perdiem}}
4. Estimasi Biaya Tak Terduga (Airport Tax, Tol, Parkir): {{biaya_lainnya}}
TOTAL ESTIMASI ANGGARAN: {{total_estimasi_biaya}}
Pembebanan Pos Biaya: Cost Center Divisi {{departemen}}

D. PERSETUJUAN & OTORISASI
Pemohon bersedia mempertanggungjawabkan pengeluaran riil dan menyerahkan Laporan Hasil Perjalanan Dinas selambat-lambatnya 3 (tiga) hari kerja setelah kembali.`,
    showQrSignature: true,
    signeeTitle: 'Head of Division / VP',
    signeeRole: 'Atasan Langsung Pemohon',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'jabatan', 'departemen', 'nomor_telepon', 'kota_tujuan', 'nama_klien_lokasi', 'tanggal_berangkat', 'tanggal_kembali', 'durasi_hari', 'tujuan_penugasan', 'biaya_tiket', 'biaya_hotel', 'biaya_perdiem', 'biaya_lainnya', 'total_estimasi_biaya'],
  },
  {
    id: 'tmpl-26',
    tenantId: 'tenant-ntm',
    type: 'Rekap Presensi Karyawan',
    name: 'Lembar Rekapitulasi Presensi & Lembur Per Karyawan (Per Cut Off)',
    numberingPattern: '{SEQ}/REKAP-ATT/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `LEMBAR REKAPITULASI PRESENSI & KEHADIRAN KERJA
Periode Cut-Off: {{periode_cut_off}} | Dokumen: {{nomor_surat}}

DATA KARYAWAN:
Nama Karyawan: {{nama}}
NIK: {{nik}}
Departemen: {{departemen}}
Jabatan: {{jabatan}}
Skema Kerja: {{skema_kerja}} (WFO / Hybrid / Remote)

RINGKASAN STATISTIK KEHADIRAN:
- Total Hari Kerja Efektif: {{total_hari_kerja}} Hari
- Total Hadir Tepat Waktu: {{total_hadir}} Hari
- Total Terlambat Masuk: {{total_terlambat}} Kali (Akumulasi: {{total_menit_terlambat}} Menit)
- Total Pulang Cepat: {{total_pulang_cepat}} Kali
- Cuti Tahunan Diambil: {{total_cuti}} Hari
- Izin Sakit (Disertai Surat Dokter): {{total_sakit}} Hari
- Izin Khusus Resmi: {{total_izin}} Hari
- Mangkir / Tanpa Keterangan (Alpa): {{total_alpa}} Hari

RINCIAN JAM KERJA LEMBUR (OVERTIME):
- Lembur Hari Kerja Reguler: {{lembur_hari_kerja}} Jam
- Lembur Akhir Pekan / Hari Libur Nasional: {{lembur_hari_libur}} Jam
- Total Jam Lembur Terkonversi: {{total_jam_lembur}} Jam

CATATAN VERIFIKASI OPERASIONAL HC:
Data presensi di atas telah diverifikasi dengan mesin absensi biometrik & GPS Mobile Check-in sistem NusaHR dan siap diproses sebagai dasar perhitungan payroll penggajian.`,
    showQrSignature: true,
    signeeTitle: 'Attendance & People Operations Specialist',
    signeeRole: 'Verifikator Presensi HC',
    extractedPlaceholders: ['periode_cut_off', 'nomor_surat', 'nama', 'nik', 'departemen', 'jabatan', 'skema_kerja', 'total_hari_kerja', 'total_hadir', 'total_terlambat', 'total_menit_terlambat', 'total_pulang_cepat', 'total_cuti', 'total_sakit', 'total_izin', 'total_alpa', 'lembur_hari_kerja', 'lembur_hari_libur', 'total_jam_lembur'],
  },
  {
    id: 'tmpl-27',
    tenantId: 'tenant-ntm',
    type: 'Pengajuan Koreksi Presensi',
    name: 'Formulir Pengajuan Koreksi Jam Presensi & Kehadiran (A5)',
    numberingPattern: '{SEQ}/KOR-PRES/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A5',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    defaultBody: `FORMULIR PENGAJUAN KOREKSI JAM PRESENSI
Nomor: {{nomor_surat}}

DATA PEMOHON:
Nama: {{nama}} (NIK: {{nik}})
Divisi / Jabatan: {{departemen}} - {{jabatan}}
Tanggal Kejadian: {{tanggal_kejadian}}

KOREKSI YANG DIMOHONKAN:
- Jam Masuk Semula: {{jam_masuk_lama}} -> Dimohon Menjadi: {{jam_masuk_baru}}
- Jam Pulang Semula: {{jam_pulang_lama}} -> Dimohon Menjadi: {{jam_pulang_baru}}

ALASAN KOREKSI:
[ {{kategori_alasan}} ]
Uraian Penjelasan:
{{penjelasan_koreksi}}

Saksi Rekan Kerja / Pihak Mengetahui: {{nama_saksi}} (NIK: {{nik_saksi}})

PERSETUJUAN:
Dengan menandatangani formulir ini, Pemohon menyatakan keterangan di atas adalah benar dan dapat dipertanggungjawabkan sesuai Peraturan Perusahaan.`,
    showQrSignature: true,
    signeeTitle: 'Direct Supervisor / Manager',
    signeeRole: 'Pemberi Approval Presensi',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'departemen', 'jabatan', 'tanggal_kejadian', 'jam_masuk_lama', 'jam_masuk_baru', 'jam_pulang_lama', 'jam_pulang_baru', 'kategori_alasan', 'penjelasan_koreksi', 'nama_saksi', 'nik_saksi'],
  },
  {
    id: 'tmpl-28',
    tenantId: 'tenant-ntm',
    type: 'Pengajuan Cuti Izin Sakit',
    name: 'Formulir Permohonan Hak Cuti, Izin Kerja & Sakit (A5)',
    numberingPattern: '{SEQ}/LEAVE/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A5',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    defaultBody: `FORMULIR PENGAJUAN CUTI, IZIN & SAKIT
Nomor: {{nomor_surat}}

DATA KARYAWAN:
Nama: {{nama}} (NIK: {{nik}})
Departemen / Jabatan: {{departemen}} - {{jabatan}}
Sisa Hak Cuti Tahunan: {{sisa_cuti}} Hari

JENIS PERMOHONAN:
[ {{jenis_permohonan}} ] (Cuti Tahunan / Izin Khusus / Sakit Surat Dokter)
Tanggal Pelaksanaan: {{tanggal_mulai}} s/d {{tanggal_selesai}} ({{jumlah_hari}} Hari Kerja)
Alasan / Keterangan:
{{keterangan_cuti}}

PELIMPAHAN PEKERJAAN (HANDOVER):
Selama masa ketidakhadiran, tugas operasional mendesak dilimpahkan kepada:
Nama Pengganti: {{nama_pengganti}} (NIK: {{nik_pengganti}})
Kontak Darurat Pemohon: {{nomor_darurat}}

Formulir ini telah diverifikasi atasan langsung dan disahkan Bagian SDM.`,
    showQrSignature: true,
    signeeTitle: 'Head of People Operations',
    signeeRole: 'Human Capital Department',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'departemen', 'jabatan', 'sisa_cuti', 'jenis_permohonan', 'tanggal_mulai', 'tanggal_selesai', 'jumlah_hari', 'keterangan_cuti', 'nama_pengganti', 'nik_pengganti', 'nomor_darurat'],
  },
  {
    id: 'tmpl-29',
    tenantId: 'tenant-ntm',
    type: 'Pendaftaran BPJS e-Dabu & SIPP',
    name: 'Surat Pengantar Pendaftaran / Mutasi Kepesertaan BPJS Kesehatan (e-Dabu) & Ketenagakerjaan (SIPP)',
    numberingPattern: '{SEQ}/BPJS-MUT/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT PENGANTAR PENDAFTARAN & MUTASI KEPESERTAAN BPJS
Nomor: {{nomor_surat}}

Kepada Yth:
Kepala Kantor Cabang BPJS Kesehatan / BPJS Ketenagakerjaan
Wilayah Jakarta Selatan

Dengan hormat,
Bersama surat ini, {{nama_perusahaan}} (Kode Badan Usaha: {{kode_badan_usaha}}) mengajukan permohonan pembaruan data kepesertaan melalui kanal resmi e-Dabu / SIPP Online untuk pegawai kami:

A. DATA UTAMA PEKERJA:
Nama Lengkap: {{nama}}
Nomor KTP (NIK 16 Digit): {{nik_ktp}}
Nomor Kartu Keluarga (KK): {{no_kk}}
Nomor KPJ BPJS Ketenagakerjaan: {{nomor_bpjstk}}
Nomor Kartu BPJS Kesehatan: {{nomor_bpjskes}}
Tanggal Efektif Masuk Kerja: {{tanggal_mulai}}
Gaji Dasar Pelaporan (Upah Terlapor): {{gaji_pokok}}

B. JENIS TINDAKAN ADMINISTRASI:
[ {{jenis_tindakan_bpjs}} ]
( ) Pendaftaran Peserta Baru & Penambahan Anggota Keluarga
( ) Pengalihan / Pindah Badan Usaha dari Perusahaan Sebelumnya
( ) Penonaktifan Peserta Karena Berakhir Hubungan Kerja

Perusahaan bertanggung jawab penuh atas kebenaran data yang disampaikan dan kepatuhan pembayaran iuran tepat waktu setiap bulannya.`,
    showQrSignature: true,
    signeeTitle: 'Compensation & Benefits Specialist',
    signeeRole: 'Penanggung Jawab PIC e-Dabu & SIPP',
    extractedPlaceholders: ['nomor_surat', 'nama_perusahaan', 'kode_badan_usaha', 'nama', 'nik_ktp', 'no_kk', 'nomor_bpjstk', 'nomor_bpjskes', 'tanggal_mulai', 'gaji_pokok', 'jenis_tindakan_bpjs'],
  },
  {
    id: 'tmpl-30',
    tenantId: 'tenant-ntm',
    type: 'Bukti Potong Pajak Coretax',
    name: 'Bukti Pemotongan Pajak Penghasilan PPh Pasal 21 (Standar Coretax DJP)',
    numberingPattern: '{SEQ}/BUPOT-21/CT/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `KEMENTERIAN KEUANGAN REPUBLIK INDONESIA
DIREKTORAT JENDERAL PAJAK - SISTEM CORETAX DJP
BUKTI PEMOTONGAN PAJAK PENGHASILAN PASAL 21 BULANAN / FINAL (FORMULIR BPA1)
Nomor Bukti Potong: {{nomor_surat}}

A. IDENTITAS PEMOTONG PAJAK:
Nama Pemotong: {{nama_perusahaan}}
NPWP 16 Digit / NITKU: {{npwp_perusahaan_16}}
Alamat Terdaftar KPP: {{alamat_perusahaan}}

B. IDENTITAS PENERIMA PENGHASILAN YANG DIPOTONG:
Nama Penerima: {{nama}}
NIK (Nomor Induk Kependudukan 16 Digit): {{nik_ktp}}
NPWP 16 Digit: {{npwp_karyawan_16}}
Status PTKP: {{ptkp}} | Kode Objek Pajak: 21-100-01 (Pegawai Tetap)
Masa / Tahun Pajak: {{masa_pajak}} {{tahun_pajak}}

C. RINCIAN PERHITUNGAN PPH PASAL 21:
1. Jumlah Penghasilan Bruto: {{penghasilan_bruto}}
2. Biaya Jabatan (Maksimal Rp 500.000 / bln): {{biaya_jabatan}}
3. Iuran Pensiun / JHT yang ditanggung Pegawai: {{iuran_pensiun}}
4. Penghasilan Neto Disetahunkan: {{penghasilan_neto_tahunan}}
5. Penghasilan Tidak Kena Pajak (PTKP): {{nilai_ptkp}}
6. Penghasilan Kena Pajak (PKP): {{pkp_tahunan}}
7. Tarif Pajak Berlaku: {{tarif_pajak_persen}}
8. PPh Pasal 21 Terutang & Dipotong Masa Ini: {{pph21_terutang}}
Terbilang: {{pph21_terbilang}}

D. PERNYATAAN PEMOTONG:
Pajak yang dipotong telah disetor ke Kas Negara melalui Sistem Penerimaan Negara Terpadu Modul Coretax menggunakan Kode Billing DJP.`,
    showQrSignature: true,
    signeeTitle: 'Tax & Compliance Manager',
    signeeRole: 'Kuasa Wajib Pajak Pemotong',
    extractedPlaceholders: ['nomor_surat', 'nama_perusahaan', 'npwp_perusahaan_16', 'alamat_perusahaan', 'nama', 'nik_ktp', 'npwp_karyawan_16', 'ptkp', 'masa_pajak', 'tahun_pajak', 'penghasilan_bruto', 'biaya_jabatan', 'iuran_pensiun', 'penghasilan_neto_tahunan', 'nilai_ptkp', 'pkp_tahunan', 'tarif_pajak_persen', 'pph21_terutang', 'pph21_terbilang'],
  },
  {
    id: 'tmpl-31',
    tenantId: 'tenant-ntm',
    type: 'Pengajuan Klaim Reimbursement',
    name: 'Formulir Pengajuan Klaim Biaya Operasional & Reimbursement',
    numberingPattern: '{SEQ}/REIMB/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `FORMULIR PENGAJUAN KLAIM BIAYA (REIMBURSEMENT VOUCHER)
Nomor Voucher: {{nomor_surat}}

A. INFORMASI KARYAWAN
Nama Karyawan: {{nama}}
NIK: {{nik}}
Departemen / Divisi: {{departemen}}
Nomor Rekening Penerima: {{rekening}}

B. TABEL RINCIAN PENGELUARAN AKTUAL:
1. Biaya Transportasi, BBM & Tol Operasional: {{biaya_bbm_tol}}
2. Biaya Jamuan Klien / Rapat Bisnis Eksternal: {{biaya_entertainment}}
3. Biaya Pembelian Perlengkapan Kantor Darurat: {{biaya_perlengkapan}}
4. Klaim Rawat Jalan / Manfaat Medis Kacamata: {{biaya_kesehatan}}
5. Biaya Penunjang Lainnya: {{biaya_lainnya}}

TOTAL NOMINAL KLAIM: {{total_klaim}}
Terbilang: {{total_klaim_terbilang}}

C. KELENGKAPAN BUKTI PENDUKUNG:
Seluruh bukti kuitansi asli, struk electronic thermal, dan faktur pajak telah diperiksa keabsahannya oleh Bagian Verifikasi Keuangan.`,
    showQrSignature: true,
    signeeTitle: 'Finance & Accounting Lead',
    signeeRole: 'Pemeriksa Otorisasi Keuangan',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'departemen', 'rekening', 'biaya_bbm_tol', 'biaya_entertainment', 'biaya_perlengkapan', 'biaya_kesehatan', 'biaya_lainnya', 'total_klaim', 'total_klaim_terbilang'],
  },
  {
    id: 'tmpl-32',
    tenantId: 'tenant-ntm',
    type: 'Perjanjian Pinjaman Karyawan & Simulasi',
    name: 'Surat Perjanjian Fasilitas Pinjaman Karyawan & Simulasi Angsuran',
    numberingPattern: '{SEQ}/LOAN-AGR/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT PERJANJIAN PINJAMAN KARYAWAN & SIMULASI ANGSURAN
Nomor: {{nomor_surat}}

Pada hari ini, bertempat di kantor {{nama_perusahaan}}, dibuat kesepakatan pinjaman dana internal antara:
1. {{penandatangan}}, bertindak mewakili Manajemen {{nama_perusahaan}} selaku PIHAK PERTAMA (Pemberi Pinjaman).
2. {{nama}}, NIK: {{nik}}, Jabatan: {{jabatan}} pada Departemen {{departemen}}, selaku PIHAK KEDUA (Peminjam).

Kedua belah pihak menyepakati ketentuan pinjaman lunak sebagai berikut:
PASAL 1: PLAFON PINJAMAN & TUJUAN
PIHAK PERTAMA memberikan pinjaman kepada PIHAK KEDUA sebesar {{jumlah_pinjaman}} ({{jumlah_terbilang}}) untuk keperluan dana darurat / kesejahteraan keluarga.

PASAL 2: TENOR & JADWAL PEMOTONGAN GAJI
1. Jangka waktu pengembalian pinjaman disepakati selama {{tenor_bulan}} bulan berturut-turut.
2. Besaran angsuran pokok per bulan adalah sebesar {{angsuran_per_bulan}} ({{angsuran_terbilang}}).
3. Angsuran dipotong langsung secara otomatis dari penghasilan bulanan (Payroll Deduction) setiap tanggal 25 mulai bulan {{bulan_mulai_potong}} hingga {{bulan_selesai_potong}}.

PASAL 3: PENYELESAIAN SISA PINJAMAN
Apabila PIHAK KEDUA mengundurkan diri, di-PHK, atau berakhir masa kerjanya sebelum pinjaman lunas, sisa pokok pinjaman akan diperhitungkan langsung dari uang pesangon, kompensasi, dan hak gaji terakhir.`,
    showQrSignature: true,
    signeeTitle: 'Finance Director & Treasury Lead',
    signeeRole: 'Pihak Pertama (Manajemen)',
    extractedPlaceholders: ['nomor_surat', 'nama_perusahaan', 'penandatangan', 'nama', 'nik', 'jabatan', 'departemen', 'jumlah_pinjaman', 'jumlah_terbilang', 'tenor_bulan', 'angsuran_per_bulan', 'angsuran_terbilang', 'bulan_mulai_potong', 'bulan_selesai_potong'],
  },
  {
    id: 'tmpl-33',
    tenantId: 'tenant-ntm',
    type: 'Penilaian Kinerja KPI & OKR',
    name: 'Lembar Evaluasi Penilaian Kinerja Karyawan Real-time (KPI & OKR)',
    numberingPattern: '{SEQ}/KPI-EVAL/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `LEMBAR EVALUASI PENILAIAN KINERJA KARYAWAN (KPI & OKR)
Periode Penilaian: {{periode_penilaian}} | Dokumen: {{nomor_surat}}

IDENTITAS PEGAWAI:
Nama Karyawan: {{nama}} (NIK: {{nik}})
Jabatan & Grade: {{jabatan}} (Grade {{grade}})
Departemen: {{departemen}}
Atasan Penilai: {{nama_atasan_penilai}}

A. MATRIKS TARGET OBJECTIVE & KEY RESULTS (OKR):
1. Key Result 1 (Bobot 35%): {{kr_1_nama}} | Realisasi Capaian: {{kr_1_skor}}%
2. Key Result 2 (Bobot 35%): {{kr_2_nama}} | Realisasi Capaian: {{kr_2_skor}}%
3. Key Result 3 (Bobot 30%): {{kr_3_nama}} | Realisasi Capaian: {{kr_3_skor}}%
NILAI AKHIR OKR & TARGET KERJA: {{nilai_akhir_okr}} / 100

B. EVALUASI NILAI BUDAYA KERJA & KOMPETENSI (CORE VALUES):
- Integritas, Kepemimpinan & Inisiatif Solutif: {{nilai_integritas}}
- Kolaborasi Lintas Fungsi & Komunikasi Tim: {{nilai_kolaborasi}}

C. PREDIKAT KINERJA AKHIR:
PREDIKAT: [ {{predikat_kinerja}} ] (Exceeds Expectations / Meets Expectations)
Rekomendasi Tindak Lanjut: Berhak menerima bonus insentif tahunan dan nominasi pengembangan promosi karir berikutnya.`,
    showQrSignature: true,
    signeeTitle: 'VP of Human Capital & Performance',
    signeeRole: 'Komite Evaluasi Kinerja',
    extractedPlaceholders: ['periode_penilaian', 'nomor_surat', 'nama', 'nik', 'jabatan', 'grade', 'departemen', 'nama_atasan_penilai', 'kr_1_nama', 'kr_1_skor', 'kr_2_nama', 'kr_2_skor', 'kr_3_nama', 'kr_3_skor', 'nilai_akhir_okr', 'nilai_integritas', 'nilai_kolaborasi', 'predikat_kinerja'],
  },
  {
    id: 'tmpl-34',
    tenantId: 'tenant-ntm',
    type: 'Surat Tindakan Disiplin',
    name: 'Surat Peringatan & Tindakan Disiplin Resmi Perusahaan',
    numberingPattern: '{SEQ}/DISC/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT TINDAKAN DISIPLIN RESMI (SANCTION NOTICE)
Nomor: {{nomor_surat}}

Diberikan kepada:
Nama: {{nama}}
NIK: {{nik}}
Jabatan: {{jabatan}}
Departemen: {{departemen}}

MENIMBANG:
1. Hasil klarifikasi bipartit dan Berita Acara Pemeriksaan Pelanggaran Tata Tertib Kerja tertanggal {{tanggal_pemeriksaan}}.
2. Bahwa Saudara/i terbukti melanggar ketentuan Pasal {{pasal_pelanggaran}} Peraturan Perusahaan {{nama_perusahaan}} perihal {{uraian_pelanggaran}}.

MEMUTUSKAN:
1. Menetapkan Tindakan Disiplin berupa: [ {{tingkat_sanksi}} ].
2. Memberikan masa pembinaan disiplin selama 6 (enam) bulan terhitung sejak tanggal {{tanggal_terbit}}.
3. Apabila selama masa pembinaan yang bersangkutan melakukan pelanggaran serupa atau tindakan indisipliner lainnya, perusahaan akan menjatuhkan sanksi lanjutan yang lebih berat hingga Pemutusan Hubungan Kerja (PHK).`,
    showQrSignature: true,
    signeeTitle: 'Head of Industrial Relations & Compliance',
    signeeRole: 'Pejabat Penegak Tata Tertib',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'jabatan', 'departemen', 'tanggal_pemeriksaan', 'pasal_pelanggaran', 'nama_perusahaan', 'uraian_pelanggaran', 'tingkat_sanksi', 'tanggal_terbit'],
  },
  {
    id: 'tmpl-35',
    tenantId: 'tenant-ntm',
    type: 'Form Tiketing Internal',
    name: 'Formulir Tiket Permintaan Layanan IT & Helpdesk Internal (A5)',
    numberingPattern: '{SEQ}/TCK-IT/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A5',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    defaultBody: `TIKET PERMINTAAN LAYANAN IT & HELPDESK (SERVICE TICKET)
Nomor Tiket: {{nomor_surat}} | Prioritas: {{tingkat_urgensi}}

DATA PELAPOR:
Nama Pemohon: {{nama}} (NIK: {{nik}})
Unit Kerja / Divisi: {{departemen}}
Lokasi Meja / Lantai: {{lokasi_kerja}}

KLASIFIKASI PERMINTAAN:
[ {{kategori_layanan}} ] (Hardware / Software Bug / Akses Jaringan / Akun Email)
Uraian Kendala / Permintaan:
{{deskripsi_tiket}}

PENANGANAN TIM IT SUPPORT:
Teknisi Bertugas: {{nama_teknisi_it}}
Waktu Mulai: {{waktu_mulai}} | Estimasi Selesai (SLA): {{waktu_estimasi}}
Status Tiket: DISOLVE & VERIFIKASI USER`,
    showQrSignature: true,
    signeeTitle: 'IT Infrastructure & Support Lead',
    signeeRole: 'Helpdesk Operations',
    extractedPlaceholders: ['nomor_surat', 'tingkat_urgensi', 'nama', 'nik', 'departemen', 'lokasi_kerja', 'kategori_layanan', 'deskripsi_tiket', 'nama_teknisi_it', 'waktu_mulai', 'waktu_estimasi'],
  },
  {
    id: 'tmpl-36',
    tenantId: 'tenant-ntm',
    type: 'Peminjaman Ruang Rapat',
    name: 'Formulir Reservasi & Peminjaman Ruang Rapat / Aula Pertemuan (A5)',
    numberingPattern: '{SEQ}/REQ-ROOM/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A5',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    defaultBody: `FORMULIR RESERVASI & PEMINJAMAN RUANG RAPAT
Nomor Reservasi: {{nomor_surat}}

DATA PEMINJAM:
Nama Penanggung Jawab: {{nama}} (NIK: {{nik}})
Departemen: {{departemen}} | Telp: {{nomor_telepon}}

RINCIAN PEMINJAMAN:
Nama Ruang Rapat: {{nama_ruang_rapat}} (Kapasitas: {{kapasitas_orang}} Orang)
Hari & Tanggal: {{tanggal_rapat}}
Waktu Pemakaian: Pukul {{jam_mulai}} s/d {{jam_selesai}} WIB
Agenda / Topik Pertemuan:
{{agenda_rapat}}

FASILITAS TAMBAHAN YANG DIPERLUKAN:
[ ] Proyektor & Layar / Video Conference Zoom Room
[ ] Wireless Mic & Sound System
[ ] Layanan Konsumsi Rapat (Coffee Break & Snack)
Persetujuan GA: Disetujui & Jadwal Telah Dibukukan pada Kalender Ruangan.`,
    showQrSignature: true,
    signeeTitle: 'General Affairs Coordinator',
    signeeRole: 'Pengelola Fasilitas Ruangan',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'departemen', 'nomor_telepon', 'nama_ruang_rapat', 'kapasitas_orang', 'tanggal_rapat', 'jam_mulai', 'jam_selesai', 'agenda_rapat'],
  },
  {
    id: 'tmpl-37',
    tenantId: 'tenant-ntm',
    type: 'Peminjaman Kendaraan Operasional',
    name: 'Formulir Peminjaman Kendaraan Operasional Kantor (Mobil Dinas)',
    numberingPattern: '{SEQ}/VEH-REQ/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `FORMULIR PEMINJAMAN KENDARAAN OPERASIONAL KANTOR
Nomor Surat Jalan: {{nomor_surat}}

A. IDENTITAS PEMINJAM & DRIVER
Nama Peminjam / Penanggung Jawab: {{nama}} (NIK: {{nik}})
Departemen: {{departemen}}
Nama Pengemudi (Driver): {{nama_driver}} (No. SIM: {{nomor_sim}})

B. DATA KENDARAAN DINAS:
Jenis / Model Kendaraan: {{model_kendaraan}}
Nomor Polisi (Plat): {{nomor_polisi}}
Warna Kendaraan: {{warna_kendaraan}}

C. JADWAL & LOKASI TUJUAN PENUGASAN:
Tujuan Perjalanan Dinas: {{kota_tujuan}}
Keperluan Operasional: {{keperluan_dinas}}
Tanggal & Jam Berangkat: {{tanggal_berangkat}} Pukul {{jam_berangkat}} WIB
Rencana Tanggal Kembali: {{tanggal_kembali}} Pukul {{jam_kembali}} WIB

D. CATATAN KILOMETER & KONDISI FISIK:
- Odometer (KM) Keberangkatan: {{km_awal}} KM
- Odometer (KM) Kepulangan: {{km_akhir}} KM
- Saldo Kartu e-Toll Diserahkan: {{saldo_etoll}}
Kondisi Fisik: Bersih, kelengkapan surat STNK asli terlampir, dan siap jalan.`,
    showQrSignature: true,
    signeeTitle: 'GA Fleet & Transportation Lead',
    signeeRole: 'Pengelola Armada Kendaraan',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'departemen', 'nama_driver', 'nomor_sim', 'model_kendaraan', 'nomor_polisi', 'warna_kendaraan', 'kota_tujuan', 'keperluan_dinas', 'tanggal_berangkat', 'jam_berangkat', 'tanggal_kembali', 'jam_kembali', 'km_awal', 'km_akhir', 'saldo_etoll'],
  },
  {
    id: 'tmpl-38',
    tenantId: 'tenant-ntm',
    type: 'Permintaan ATK',
    name: 'Formulir Permintaan Alat Tulis Kantor & Logistik Kerja (ATK - A5)',
    numberingPattern: '{SEQ}/REQ-ATK/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A5',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
    defaultBody: `FORMULIR PERMINTAAN ALAT TULIS KANTOR (ATK)
Nomor Permintaan: {{nomor_surat}}

PEMOHON:
Nama: {{nama}} (NIK: {{nik}})
Departemen / Unit: {{departemen}} | Tanggal: {{tanggal_terbit}}

DAFTAR BARANG YANG DIMINTA:
1. Kertas HVS A4 80gr: {{jumlah_kertas}} Rim
2. Ballpoint / Pena Box: {{jumlah_pena}} Lusin
3. Ordner Binder Dokumen: {{jumlah_binder}} Pcs
4. Sticky Notes Post-it: {{jumlah_notes}} Pad
5. Kebutuhan Lainnya: {{kebutuhan_lainnya}}

Keterangan Penggunaan:
{{alasan_kebutuhan}}

Status Gudang GA: Barang telah disiapkan dan diserahterimakan dalam kondisi lengkap.`,
    showQrSignature: true,
    signeeTitle: 'GA Warehouse & Inventory Officer',
    signeeRole: 'Petugas Logistik GA',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'departemen', 'tanggal_terbit', 'jumlah_kertas', 'jumlah_pena', 'jumlah_binder', 'jumlah_notes', 'kebutuhan_lainnya', 'alasan_kebutuhan'],
  },
  {
    id: 'tmpl-39',
    tenantId: 'tenant-ntm',
    type: 'Purchase Order (PO)',
    name: 'Surat Pesanan Pembelian Resmi (Purchase Order / PO Barang & Jasa)',
    numberingPattern: '{SEQ}/PO-PROC/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `PURCHASE ORDER (SURAT PESANAN PEMBELIAN)
Nomor PO: {{nomor_surat}} | Tanggal PO: {{tanggal_terbit}}

KEPADA VENDOR REKANAN:
Nama Perusahaan Vendor: {{nama_vendor}}
NPWP Vendor: {{npwp_vendor}}
Alamat Vendor: {{alamat_vendor}}
Up. Kontak Person: {{pic_vendor}} (Telp: {{telepon_vendor}})

DETAIL PESANAN BARANG / JASA:
1. Item: {{item_1_nama}} | Qty: {{item_1_qty}} | Harga Satuan: {{item_1_harga}} | Subtotal: {{item_1_subtotal}}
2. Item: {{item_2_nama}} | Qty: {{item_2_qty}} | Harga Satuan: {{item_2_harga}} | Subtotal: {{item_2_subtotal}}

TOTAL SEBELUM PAJAK: {{total_sebelum_pajak}}
PPN 11%: {{nilai_ppn}}
GRAND TOTAL TAGIHAN: {{grand_total_po}}
Terbilang: {{grand_total_terbilang}}

SYARAT & KETENTUAN PEMBELIAN:
1. Batas Waktu Pengiriman: Selambat-lambatnya tanggal {{tanggal_pengiriman_maksimal}}.
2. Tempat Penyerahan: Kantor {{nama_perusahaan}} (Kondisi Franco Jakarta).
3. Syarat Pembayaran (TOP): Net 30 hari kalender setelah barang diterima lengkap bersama Faktur Pajak & Invoice resmi.`,
    showQrSignature: true,
    signeeTitle: 'Head of Procurement & Supply Chain',
    signeeRole: 'Otorisasi Pengadaan Perusahaan',
    extractedPlaceholders: ['nomor_surat', 'tanggal_terbit', 'nama_vendor', 'npwp_vendor', 'alamat_vendor', 'pic_vendor', 'telepon_vendor', 'item_1_nama', 'item_1_qty', 'item_1_harga', 'item_1_subtotal', 'item_2_nama', 'item_2_qty', 'item_2_harga', 'item_2_subtotal', 'total_sebelum_pajak', 'nilai_ppn', 'grand_total_po', 'grand_total_terbilang', 'tanggal_pengiriman_maksimal', 'nama_perusahaan'],
  },
  {
    id: 'tmpl-40',
    tenantId: 'tenant-ntm',
    type: 'Quotation Penawaran Harga',
    name: 'Surat Penawaran Harga Resmi (Official Quotation / Proposal Harga)',
    numberingPattern: '{SEQ}/QUO-SALES/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT PENAWARAN HARGA RESMI (COMMERCIAL QUOTATION)
Nomor Penawaran: {{nomor_surat}} | Tanggal: {{tanggal_terbit}}

Kepada Yth:
{{nama_klien}}
{{instansi_klien}}
{{alamat_klien}}

Dengan hormat,
Menindaklanjuti diskusi perihal kebutuhan solusi HRMS & Digital Workspace, dengan ini kami sampaikan proposal penawaran harga terbaik:

RINCIAN LISENSI & LAYANAN PROFESIONAL:
1. Lisensi Paket NusaHR Enterprise: {{harga_lisensi}}
2. Biaya Implementasi & Integrasi Sistem Coretax/e-Dabu: {{harga_implementasi}}
3. Pelatihan Pengguna (User Training & Change Management): {{harga_training}}
4. Layanan Maintenance & Dukungan Teknis 24/7 SLA 99.9%: {{harga_sla}}

TOTAL INVESTASI PENAWARAN: {{total_penawaran}}
(Harga belum termasuk PPN 11%)

KETENTUAN KOMERSIAL:
1. Masa Berlaku Penawaran: 30 (tiga puluh) hari kalender sejak tanggal diterbitkan.
2. Skema Termin Pembayaran: Down Payment (DP) 30%, Pelaksanaan UAT 40%, Go-Live 30%.
3. Waktu Pengerjaan Proyek: 60 (enam puluh) hari kalender sejak Purchase Order diterima.`,
    showQrSignature: true,
    signeeTitle: 'VP of Commercial & Enterprise Solutions',
    signeeRole: 'Pemberi Penawaran Resmi',
    extractedPlaceholders: ['nomor_surat', 'tanggal_terbit', 'nama_klien', 'instansi_klien', 'alamat_klien', 'harga_lisensi', 'harga_implementasi', 'harga_training', 'harga_sla', 'total_penawaran'],
  },
  {
    id: 'tmpl-41',
    tenantId: 'tenant-ntm',
    type: 'Kontrak Pengadaan & Termin',
    name: 'Surat Perjanjian Kontrak Pengadaan Berbasis Proyek & Jadwal Termin Pembayaran',
    numberingPattern: '{SEQ}/LEG-KTR-PROC/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'F4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT PERJANJIAN KERJA SAMA PENGADAAN BERBASIS PROYEK
Nomor Kontrak: {{nomor_surat}}

Pada hari ini, bertempat di Jakarta, para pihak yang bertanda tangan di bawah ini:
1. {{penandatangan}}, Direktur {{nama_perusahaan}}, bertindak atas nama perusahaan, selanjutnya disebut PIHAK PERTAMA (Pemberi Kerja).
2. {{nama_direktur_vendor}}, Direktur {{nama_vendor}}, berkedudukan di {{alamat_vendor}}, selanjutnya disebut PIHAK KEDUA (Penyedia Jasa).

Para pihak bersepakat mengadakan perjanjian pengadaan dengan ketentuan:
PASAL 1: LINGKUP PEKERJAAN
PIHAK PERTAMA menunjuk PIHAK KEDUA untuk melaksanakan pekerjaan {{nama_proyek}} dengan rincian deliverable sesuai Kerangka Acuan Kerja (KAK) terlampir.

PASAL 2: NILAI KONTRAK & JADWAL TERMIN PEMBAYARAN
Total nilai kontrak pengadaan ini adalah sebesar {{nilai_kontrak}} ({{nilai_terbilang}}) dengan jadwal termin pembayaran sebagai berikut:
- Termin I (Uang Muka / DP 30%): Dibayarkan setelah penandatanganan kontrak dan penyerahan Garansi Uang Muka.
- Termin II (Milestone Progres 40%): Dibayarkan setelah penyelesaian tahap integrasi dan pengujian UAT dinyatakan lulus.
- Termin III (Pelunasan 30%): Dibayarkan setelah penandatanganan Berita Acara Serah Terima (BAST) Final dan masa retensi.

<!-- PAGE_BREAK -->

PASAL 3: WAKTU PELAKSANAAN & DENDA KETERLAMBATAN
1. Seluruh pekerjaan wajib diselesaikan selambat-lambatnya dalam waktu {{durasi_hari_kerja}} hari kerja.
2. Apabila terjadi keterlambatan sepihak oleh PIHAK KEDUA, dikenakan denda sebesar 1‰ (satu permil) per hari keterlambatan dari nilai kontrak maksimal 5%.

PASAL 4: JAMINAN PEMELIHARAAN (WARRANTY) & PENYELESAIAN SENGKETA
PIHAK KEDUA memberikan jaminan garansi pemeliharaan selama 12 (dua belas) bulan terhitung sejak penandatanganan BAST Final. Segala perselisihan akan diselesaikan melalui Badan Arbitrase Nasional Indonesia (BANI).`,
    showQrSignature: true,
    signeeTitle: 'President Director & CEO',
    signeeRole: 'Pihak Pertama (Pemberi Kerja)',
    extractedPlaceholders: ['nomor_surat', 'penandatangan', 'nama_perusahaan', 'nama_direktur_vendor', 'nama_vendor', 'alamat_vendor', 'nama_proyek', 'nilai_kontrak', 'nilai_terbilang', 'durasi_hari_kerja'],
  },
  {
    id: 'tmpl-42',
    tenantId: 'tenant-ntm',
    type: 'Tagihan & Invoice Vendor',
    name: 'Lembar Verifikasi Tagihan & Invoice Vendor / Surat Perintah Bayar (SPB)',
    numberingPattern: '{SEQ}/FIN-SPB/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `SURAT PERINTAH BAYAR (SPB) & VERIFIKASI TAGIHAN VENDOR
Nomor SPB: {{nomor_surat}} | Tanggal: {{tanggal_terbit}}

DATA TAGIHAN VENDOR:
Nama Vendor Rekanan: {{nama_vendor}}
Nomor Invoice Vendor: {{nomor_invoice}}
Nomor Faktur Pajak: {{nomor_faktur_pajak}}
Nomor Purchase Order Terkait: {{nomor_po}}
Nomor BAST Penerimaan: {{nomor_bast}}

VERIFIKASI TIGA PIHAK (3-WAY MATCHING):
[ X ] Dokumen Purchase Order Asli Telah Diverifikasi
[ X ] Berita Acara Serah Terima Barang / Jasa (BAST) Sah
[ X ] Faktur Pajak Terverifikasi Valid pada DJP Coretax System

RINCIAN PERHITUNGAN PEMBAYARAN:
Nilai Tagihan Bruto: {{nilai_bruto}}
PPN 11%: {{nilai_ppn}}
Potongan PPh Pasal 23 (2% Jasa): -{{potongan_pph23}}
JUMLAH BERSIH YANG DIBAYARKAN (NET PAYABLE): {{jumlah_bersih_bayar}}
Terbilang: {{jumlah_bersih_terbilang}}

Instruksi Rekening Transfer:
Bank: {{nama_bank_vendor}} | No. Rekening: {{rekening_vendor}} | A.n: {{nama_vendor}}`,
    showQrSignature: true,
    signeeTitle: 'Finance & Treasury Director',
    signeeRole: 'Otorisator Pembayaran Keuangan',
    extractedPlaceholders: ['nomor_surat', 'tanggal_terbit', 'nama_vendor', 'nomor_invoice', 'nomor_faktur_pajak', 'nomor_po', 'nomor_bast', 'nilai_bruto', 'nilai_ppn', 'potongan_pph23', 'jumlah_bersih_bayar', 'jumlah_bersih_terbilang', 'nama_bank_vendor', 'rekening_vendor'],
  },
  {
    id: 'tmpl-43',
    tenantId: 'tenant-ntm',
    type: 'Pengajuan Pembelian Hardware',
    name: 'Formulir Pengajuan Pengadaan Perangkat Keras / Hardware / Laptop Kerja',
    numberingPattern: '{SEQ}/REQ-HW/{TENANT}/{ROMAN_MONTH}/{YEAR}',
    paperSize: 'A4',
    letterHeadTitle: 'PT NUSANTARA TEKNOLOGI MANDIRI',
    letterHeadAddress: 'Menara Palma Lantai 18, Jl. HR Rasuna Said Blok X-2 Kav. 6, Jakarta Selatan 12950',
    defaultBody: `FORMULIR PERMOHONAN PENGADAAN HARDWARE / LAPTOP KERJA
Nomor Pengajuan: {{nomor_surat}}

A. IDENTITAS PENGGUNA (USER):
Nama Karyawan: {{nama}}
NIK: {{nik}}
Departemen / Posisi: {{departemen}} - {{jabatan}}
Alasan Pengadaan: [ {{kategori_pengadaan}} ] (Pegawai Baru / Upgrade Beban Kerja / Penggantian Rusak)

B. JUSTIFIKASI TEKNIS & KEBUTUHAN KERJA:
{{justifikasi_kebutuhan}}

C. REKOMENDASI SPESIFIKASI DARI IT LEAD:
- Model Perangkat: {{model_laptop}}
- Processor: {{processor_spec}}
- Memori (RAM): {{ram_spec}}
- Penyimpanan (Storage): {{storage_spec}}
- Estimasi Biaya Pengadaan: {{estimasi_harga}}
- Ketersediaan Anggaran CAPEX: Tersedia pada Alokasi Anggaran IT Q-{{kuartal_anggaran}}

D. REKOMENDASI & OTORISASI:
Permohonan ini direkomendasikan untuk diproses pembeliannya melalui Divisi Pengadaan (Procurement).`,
    showQrSignature: true,
    signeeTitle: 'Chief Information Officer (CIO)',
    signeeRole: 'Otorisasi Infrastruktur Teknologi',
    extractedPlaceholders: ['nomor_surat', 'nama', 'nik', 'departemen', 'jabatan', 'kategori_pengadaan', 'justifikasi_kebutuhan', 'model_laptop', 'processor_spec', 'ram_spec', 'storage_spec', 'estimasi_harga', 'kuartal_anggaran'],
  },
];

export const INITIAL_MODULE_SETTINGS: ModuleSettingsConfig = {
  employee: {
    nikPrefix: 'NTM',
    probationDurationMonths: 3,
    defaultRetirementAge: 58,
    mandatoryDocs: ['KTP', 'NPWP', 'BPJS Kesehatan', 'Ijazah Terakhir'],
    flexibleNik: DEFAULT_FLEXIBLE_NIK_SETTINGS,
  },
  attendance: {
    lateGracePeriodMins: 15,
    latePenaltyPerHour: 50000,
    unpaidLeaveCutDaily: true,
    overtimeMultiplierPP35: true,
    gpsRadiusMeters: 100,
    cameraSelfieRequired: true,
  },
  payroll: {
    cutoffDate: 20,
    paydayDate: 25,
    bpjsKesEmployeeRate: 1.0,
    bpjsKesCompanyRate: 4.0,
    bpjsTkJhtEmployeeRate: 2.0,
    bpjsTkJhtCompanyRate: 3.7,
    defaultTERCategory: 'TER A',
  },
  loan: {
    maxPlafonSalaryPercent: 30,
    maxTenorMonths: 12,
    interestRatePercent: 0,
    allowMultipleActiveLoans: false,
  },
  approval: {
    defaultSlaHours: 48,
    autoEscalateOnExpiry: true,
    requireAttachment: true,
  },
  procurement: {
    minQuotesRequired: 2,
    directorApprovalThreshold: 20000000,
    ppnPercent: 11,
  },
  documents: {
    companyHeaderUrl: '',
    defaultSigneeName: 'Aditya Pratama, S.Psi',
    defaultSigneeRole: 'VP of Human Capital',
    showQrSignature: true,
    watermarkText: 'CONFIDENTIAL ENTERPRISE HRMS',
  },
};

// 22. Initial Holding Entities
export const INITIAL_ENTITIES: CompanyEntity[] = [
  {
    id: 'ent-ntm-holding',
    tenantId: 'tenant-ntm',
    name: 'PT Nusantara Teknologi Mandiri (Holding)',
    code: 'NTM-HOLDING',
    relationType: 'resmi',
    level: 'holding',
    address: 'Menara Mandiri Lt. 28, Jl. Jend. Sudirman Kav. 54-55, Senayan',
    city: 'Jakarta Selatan',
    npwp: '01.234.567.8-012.000',
    nikPattern: '{ENTITY}-{YYYY}-{SEQ:3}',
    docPrefix: 'HRD-NTM',
    status: 'Aktif',
    useDepartmentLevel: true, // Memiliki Departemen
  },
  {
    id: 'ent-ntm-digital',
    tenantId: 'tenant-ntm',
    parentEntityId: 'ent-ntm-holding',
    name: 'PT Nusantara Solusi Digital',
    code: 'NSD',
    relationType: 'resmi',
    level: 'anak',
    address: 'Cyber 2 Tower Lt. 15, Jl. HR Rasuna Said Blok X-5, Kuningan',
    city: 'Jakarta Selatan',
    npwp: '01.888.777.6-015.000',
    nikPattern: 'NSD-{YYYY}-{SEQ:3}',
    docPrefix: 'HRD-NSD',
    status: 'Aktif',
    useDepartmentLevel: true, // Memiliki Departemen
  },
  {
    id: 'ent-ntm-cloud',
    tenantId: 'tenant-ntm',
    parentEntityId: 'ent-ntm-holding',
    name: 'PT Nusantara Cloud Infrastructure',
    code: 'NCI',
    relationType: 'resmi',
    level: 'anak',
    address: 'Wisma Atlet Lt. 8, Kemayoran',
    city: 'Jakarta Pusat',
    npwp: '01.999.555.4-021.000',
    nikPattern: 'NCI-{YYYY}-{SEQ:3}',
    docPrefix: 'HRD-NCI',
    status: 'Aktif',
    useDepartmentLevel: false, // Fleksibel: Struktur Ramping / Lean (Langsung Divisi -> Posisi)
  },
  {
    id: 'ent-ntm-mitra',
    tenantId: 'tenant-ntm',
    parentEntityId: 'ent-ntm-holding',
    name: 'CV Mitra Sinergi Logistik (Afiliasi Administratif)',
    code: 'MSL',
    relationType: 'administratif',
    level: 'anak',
    address: 'Kawasan Industri Pulogadung Blok B No. 12',
    city: 'Jakarta Timur',
    npwp: '02.444.333.2-033.000',
    nikPattern: 'MSL-{YYYY}-{SEQ:3}',
    docPrefix: 'OPS-MSL',
    status: 'Aktif',
    useDepartmentLevel: false, // Fleksibel: Struktur Flat
  },
  {
    id: 'ent-ntm-cucu-1',
    tenantId: 'tenant-ntm',
    parentEntityId: 'ent-ntm-digital',
    name: 'PT Digital Solusi Finansial (Cucu Perusahaan)',
    code: 'DSF',
    relationType: 'resmi',
    level: 'cucu',
    address: 'Cyber 2 Tower Lt. 16, Kuningan',
    city: 'Jakarta Selatan',
    npwp: '03.111.222.3-018.000',
    nikPattern: 'DSF-{YYYY}-{SEQ:3}',
    docPrefix: 'FIN-DSF',
    status: 'Aktif',
    useDepartmentLevel: true,
  },
  {
    id: 'ent-ntm-cucu-2',
    tenantId: 'tenant-ntm',
    parentEntityId: 'ent-ntm-cloud',
    name: 'PT Nusantara Cyber Security (Cucu Perusahaan)',
    code: 'NCS',
    relationType: 'resmi',
    level: 'cucu',
    address: 'Wisma Atlet Lt. 9, Kemayoran',
    city: 'Jakarta Pusat',
    npwp: '03.222.333.4-022.000',
    nikPattern: 'NCS-{YYYY}-{SEQ:3}',
    docPrefix: 'SEC-NCS',
    status: 'Aktif',
    useDepartmentLevel: false, // Fleksibel: Lean Structure
  },
];

// Master Divisi Perusahaan
export const INITIAL_DIVISIONS: CompanyDivision[] = [
  {
    id: 'div-board',
    entityId: 'ent-ntm-holding',
    code: 'DIV-EXEC',
    name: 'Direksi & Executive Board',
    headEmployeeId: 'emp-10',
    headTitle: 'President Director & CEO',
    description: 'Dewan Direksi pemegang kendali strategi dan tata kelola korporasi.',
  },
  {
    id: 'div-hc',
    entityId: 'ent-ntm-holding',
    code: 'DIV-HC',
    name: 'Human Capital & Corporate Culture',
    headEmployeeId: 'emp-1',
    headTitle: 'VP of Human Capital',
    description: 'Pengelolaan talenta, kepersonaliaan, rekrutmen, dan kepatuhan ketenagakerjaan.',
  },
  {
    id: 'div-fin',
    entityId: 'ent-ntm-holding',
    code: 'DIV-FIN',
    name: 'Finance, Tax & Accounting',
    headEmployeeId: 'emp-2',
    headTitle: 'Head of Finance & Tax',
    description: 'Manajemen perbendaharaan, perpajakan PPh 21 TER, dan akuntansi korporat.',
  },
  {
    id: 'div-tech',
    entityId: 'ent-ntm-holding',
    code: 'DIV-TECH',
    name: 'Engineering & Information Technology',
    headEmployeeId: 'emp-8',
    headTitle: 'Head of Cloud & Engineering',
    description: 'Pengembangan arsitektur cloud, software engineering, DevOps, dan AI infra.',
  },
  {
    id: 'div-ga',
    entityId: 'ent-ntm-holding',
    code: 'DIV-GA',
    name: 'General Affairs & Procurement',
    headEmployeeId: 'emp-3',
    headTitle: 'GA & Procurement Manager',
    description: 'Pengelolaan aset fisik, logistik, pengadaan barang jasa, dan fasilitas kantor.',
  },
  {
    id: 'div-biz',
    entityId: 'ent-ntm-holding',
    code: 'DIV-BIZ',
    name: 'Commercial & Business Expansion',
    headEmployeeId: 'emp-5',
    headTitle: 'Director of Business Growth',
    description: 'Penjualan korporat, kemitraan strategis SaaS, dan perluasan pangsa pasar.',
  },
];

// Master Departemen (Aktif jika entitas mengaktifkan useDepartmentLevel)
export const INITIAL_DEPARTMENTS: CompanyDepartment[] = [
  {
    id: 'dept-talent',
    entityId: 'ent-ntm-holding',
    divisionId: 'div-hc',
    code: 'DEP-TA',
    name: 'Talent Acquisition & Employer Branding',
    headEmployeeId: 'emp-1',
    headTitle: 'Lead Talent Specialist',
    description: 'Sourcing kandidat, seleksi FPTK, dan onboarding karyawan baru.',
  },
  {
    id: 'dept-pay-ops',
    entityId: 'ent-ntm-holding',
    divisionId: 'div-hc',
    code: 'DEP-PAY',
    name: 'People Operations & Payroll Services',
    headEmployeeId: 'emp-1',
    headTitle: 'People Ops Lead',
    description: 'Presensi harian, kompensasi benefit, dan administrasi kepersonaliaan.',
  },
  {
    id: 'dept-tax',
    entityId: 'ent-ntm-holding',
    divisionId: 'div-fin',
    code: 'DEP-TAX',
    name: 'Corporate Tax & Treasury Compliance',
    headEmployeeId: 'emp-2',
    headTitle: 'Senior Tax Officer',
    description: 'Kepatuhan pajak TER 2024, SPT Tahunan, dan audit laporan keuangan.',
  },
  {
    id: 'dept-swe',
    entityId: 'ent-ntm-holding',
    divisionId: 'div-tech',
    code: 'DEP-SWE',
    name: 'Software Engineering & AI Systems',
    headEmployeeId: 'emp-8',
    headTitle: 'Principal Software Architect',
    description: 'Pengembangan fitur core backend, frontend, microservices, dan integrasi API.',
  },
  {
    id: 'dept-cloud-infra',
    entityId: 'ent-ntm-holding',
    divisionId: 'div-tech',
    code: 'DEP-INFRA',
    name: 'Cloud Infrastructure & DevOps Security',
    headEmployeeId: 'emp-8',
    headTitle: 'Lead DevOps Specialist',
    description: 'Manajemen server Kubernetes, disaster recovery, ISO 27001, dan CI/CD pipeline.',
  },
  {
    id: 'dept-procurement',
    entityId: 'ent-ntm-holding',
    divisionId: 'div-ga',
    code: 'DEP-PROC',
    name: 'Procurement, PO & Vendor Relation',
    headEmployeeId: 'emp-3',
    headTitle: 'Senior Procurement Specialist',
    description: 'Pelelangan vendor, penertiban PR/PO, dan kontrol anggaran pengadaan GA.',
  },
  {
    id: 'dept-assets',
    entityId: 'ent-ntm-holding',
    divisionId: 'div-ga',
    code: 'DEP-ASSET',
    name: 'Facility & Asset QR Operations',
    headEmployeeId: 'emp-3',
    headTitle: 'Asset Coordinator',
    description: 'Labeling QR code aset, pemeliharaan gedung, dan armada kendaraan dinas.',
  },
  {
    id: 'dept-sec',
    entityId: 'ent-ntm-holding',
    divisionId: 'div-board',
    code: 'DEP-SEC',
    name: 'Corporate Secretary & Governance',
    headEmployeeId: 'emp-10',
    headTitle: 'Corporate Secretary',
    description: 'Kesekretariatan korporasi, kepatuhan legal tata kelola, dan hubungan dewan komisaris.',
  },
  {
    id: 'dept-sales',
    entityId: 'ent-ntm-holding',
    divisionId: 'div-biz',
    code: 'DEP-SALES',
    name: 'Enterprise Sales & Key Accounts',
    headEmployeeId: 'emp-5',
    headTitle: 'Head of Enterprise Sales',
    description: 'Akusisi klien enterprise B2B, strategic partnership, dan ekspansi akun korporat.',
  },
];

// 23. Initial Employee Staging (Onboarding Gate)
export const INITIAL_EMPLOYEE_STAGING: EmployeeStaging[] = [
  {
    id: 'stg-1',
    tenantId: 'tenant-ntm',
    entityId: 'ent-ntm-holding',
    tempNik: 'TEMP-8912',
    candidateId: 'cand-4',
    fullName: 'Fajar Nugraha, S.Kom',
    email: 'fajar.nugraha.new@gmail.com',
    phone: '081399887711',
    position: 'DevOps & SRE Engineer',
    department: 'Engineering & Technology',
    employmentType: 'Kontrak',
    joinDate: '2026-11-01',
    basicSalary: 14000000,
    contractDocNumber: 'OFF-NTM-2026-10-092',
    status: 'In Progress',
    contractSigned: true,
    ndaSigned: true,
    docsVerified: false,
    tasks: [
      {
        id: 'stg-tsk-1',
        title: 'Penandatanganan Perjanjian Kerja (PKWT) via Digital Signature',
        category: 'Legalitas & Dokumen',
        isCompleted: true,
        completedAt: '2026-10-18T14:20:00Z',
        assignedRole: 'Candidate',
      },
      {
        id: 'stg-tsk-2',
        title: 'Penandatanganan Dokumen Non-Disclosure Agreement (NDA)',
        category: 'Legalitas & Dokumen',
        isCompleted: true,
        completedAt: '2026-10-18T14:25:00Z',
        assignedRole: 'Candidate',
      },
      {
        id: 'stg-tsk-3',
        title: 'Verifikasi KTP, NPWP, BPJS & Ijazah Asli oleh Tim HC',
        category: 'Legalitas & Dokumen',
        isCompleted: false,
        assignedRole: 'HR Admin',
      },
      {
        id: 'stg-tsk-4',
        title: 'Provisioning Akun Email Google Workspace & Slack',
        category: 'Fasilitas & IT',
        isCompleted: false,
        assignedRole: 'IT Support',
      },
      {
        id: 'stg-tsk-5',
        title: 'Pendaftaran Rekening Payroll BCA ke Sistem Keuangan',
        category: 'Payroll & Rekening',
        isCompleted: false,
        assignedRole: 'Payroll Admin',
      },
    ],
  },
];

// 24. Initial Overtime Requests
export const INITIAL_OVERTIME_REQUESTS: OvertimeRequest[] = [
  {
    id: 'ovt-1',
    tenantId: 'tenant-ntm',
    entityId: 'ent-ntm-holding',
    employeeId: 'emp-4', // Dimas Wicaksono
    date: '2026-10-15',
    startTime: '17:30',
    endTime: '21:00',
    hours: 3.5,
    reason: 'Rilis Patch v2.4 Hotfix Data Migration & Load Testing Server',
    type: 'Perintah Atasan',
    status: 'Disetujui',
    approvedBy: 'Aditya Pratama (Admin)',
    approvedHours: 3.5,
    compensationType: 'Lembur Berbayar',
    notes: 'Prioritas rilis selesai sebelum jam 21:00 malam',
  },
  {
    id: 'ovt-2',
    tenantId: 'tenant-ntm',
    entityId: 'ent-ntm-holding',
    employeeId: 'emp-3', // Bambang Sudiro
    date: '2026-10-17',
    startTime: '17:00',
    endTime: '20:00',
    hours: 3.0,
    reason: 'Stock Opname Aset Gedung Lt. 28 dan Pemasangan QR Label Baru',
    type: 'Pengajuan Karyawan',
    status: 'Disetujui',
    approvedBy: 'Aditya Pratama (Admin)',
    approvedHours: 3.0,
    compensationType: 'Lembur Berbayar',
    notes: 'Stock opname kuartal 4',
  },
  {
    id: 'ovt-3',
    tenantId: 'tenant-ntm',
    entityId: 'ent-ntm-holding',
    employeeId: 'emp-5',
    date: '2026-10-19',
    startTime: '18:00',
    endTime: '21:00',
    hours: 3.0,
    reason: 'Persiapan materi audit compliance ISO 27001',
    type: 'Pengajuan Karyawan',
    status: 'Menunggu',
    compensationType: 'Lembur Berbayar',
  },
];

// 25. Initial Reimbursement Claims
export const INITIAL_REIMBURSEMENT_CLAIMS: ReimbursementClaim[] = [
  {
    id: 'clm-1',
    tenantId: 'tenant-ntm',
    entityId: 'ent-ntm-holding',
    employeeId: 'emp-4',
    claimNumber: 'CLM-NTM-2026-10-001',
    category: 'Transportasi Dinas',
    amount: 350000,
    description: 'Grab Car antar tim ke data center IDC Duren Tiga untuk maintenance server',
    receiptDate: '2026-10-14',
    receiptNumber: 'GRB-9988210',
    status: 'Disetujui',
    processInPayroll: true,
    processedPeriod: 'Oktober 2026',
    approvedBy: 'Jessica Tanujaya (Finance)',
  },
  {
    id: 'clm-2',
    tenantId: 'tenant-ntm',
    entityId: 'ent-ntm-holding',
    employeeId: 'emp-2',
    claimNumber: 'CLM-NTM-2026-10-002',
    category: 'Kacamata',
    amount: 750000,
    description: 'Klaim tunjangan lensa kacamata kerja tahunan sesuai plafon BPJS/Perusahaan',
    receiptDate: '2026-10-08',
    receiptNumber: 'OPTIK-MEL-4432',
    status: 'Disetujui',
    processInPayroll: true,
    processedPeriod: 'Oktober 2026',
    approvedBy: 'Jessica Tanujaya (Finance)',
  },
  {
    id: 'clm-3',
    tenantId: 'tenant-ntm',
    entityId: 'ent-ntm-holding',
    employeeId: 'emp-3',
    claimNumber: 'CLM-NTM-2026-10-003',
    category: 'Pelatihan',
    amount: 1200000,
    description: 'Sertifikasi Ahli K3 Umum & Fasilitas Gedung',
    receiptDate: '2026-10-16',
    receiptNumber: 'TRAIN-K3-8871',
    status: 'Menunggu Review',
    processInPayroll: false,
  },
];

// 26. Initial Personalia Requests
export const INITIAL_PERSONALIA_REQUESTS: PersonaliaRequest[] = [
  {
    id: 'pers-req-1',
    tenantId: 'tenant-ntm',
    entityId: 'ent-ntm-holding',
    employeeId: 'emp-4',
    type: 'Promosi',
    previousPosition: 'Software Engineer',
    newPosition: 'Senior Software Engineer',
    previousSalary: 14500000,
    newSalary: 18000000,
    reason: 'Pencapaian KPI konsisten Q1-Q3 di atas 90 dan memimpin migrasi microservices',
    effectiveDate: '2026-11-01',
    status: 'Menunggu Approval',
  },
  {
    id: 'pers-req-2',
    tenantId: 'tenant-ntm',
    entityId: 'ent-ntm-holding',
    employeeId: 'emp-5',
    type: 'Mutasi',
    previousDepartment: 'Customer Operations',
    newDepartment: 'People & Culture',
    previousPosition: 'Support Specialist',
    newPosition: 'HR Operations Associate',
    mutationType: 'internal_departemen',
    reason: 'Rotasi pengembangan talenta internal sesuai latar belakang Psikologi',
    effectiveDate: '2026-11-01',
    status: 'Menunggu Approval',
  },
];

// Master Standar Jabatan (Kamus Jabatan Perusahaan)
export const INITIAL_MASTER_JOB_POSITIONS: MasterJobPosition[] = [
  {
    id: 'mjp-ceo',
    entityId: 'ent-ntm-holding',
    code: 'JAB-CEO',
    title: 'President Director & Chief Executive Officer (CEO)',
    defaultLevel: 1,
    division: 'Direksi & Executive Board',
    department: 'Executive Board',
    jobFamily: 'Eksekutif & Direksi',
    jobGrade: 'Grade 12',
    description: 'Pemimpin eksekutif tertinggi perusahaan bertanggung jawab atas arah strategis, pertumbuhan grup, dan tata kelola holding.',
    requirements: 'S2 Manajemen/Bisnis, 15+ tahun pengalaman eksekutif di industri teknologi/korporasi.',
  },
  {
    id: 'mjp-audit',
    entityId: 'ent-ntm-holding',
    code: 'JAB-AUDIT',
    title: 'Head of Internal Audit & Risk Governance',
    defaultLevel: 2,
    division: 'Direksi & Executive Board',
    department: 'Executive Board',
    jobFamily: 'Governance & Risk',
    jobGrade: 'Grade 10',
    description: 'Pengawasan kepatuhan operasional internal, audit finansial, manajemen risiko, dan tata kelola kepatuhan independen.',
    requirements: 'S1 Akuntansi/Hukum, Sertifikasi CIA/QIA/CRMA, 8+ tahun audit internal korporat.',
  },
  {
    id: 'mjp-vphc',
    entityId: 'ent-ntm-holding',
    code: 'JAB-VPHC',
    title: 'VP of Human Capital & Corporate Culture',
    defaultLevel: 2,
    division: 'Human Capital & Corporate Culture',
    department: 'People & Culture',
    jobFamily: 'People & Culture',
    jobGrade: 'Grade 10',
    description: 'Perumusan strategi manajemen talenta, pengembangan budaya organisasi, hubungan industrial, dan remunerasi terpadu.',
    requirements: 'S1/S2 Psikologi/Manajemen SDM, 10+ tahun pengalaman HR leadership di tech/holding.',
  },
  {
    id: 'mjp-headfin',
    entityId: 'ent-ntm-holding',
    code: 'JAB-HEADFIN',
    title: 'Head of Finance, Tax & Treasury Operation',
    defaultLevel: 2,
    division: 'Finance, Tax & Supply Chain Management',
    department: 'Finance & Tax',
    jobFamily: 'Finance & Accounting',
    jobGrade: 'Grade 10',
    description: 'Pengelolaan likuiditas holding, perencanaan perpajakan nasional, pelaporan keuangan audit eksternal, dan treasury.',
    requirements: 'S1 Akuntansi/Keuangan, Sertifikasi Brevet AB & Akuntan Publik (CPA), 10+ tahun.',
  },
  {
    id: 'mjp-vptech',
    entityId: 'ent-ntm-holding',
    code: 'JAB-VPTECH',
    title: 'VP of Enterprise Technology & Engineering',
    defaultLevel: 2,
    division: 'Technology, Engineering & Product Development',
    department: 'Technology & Engineering',
    jobFamily: 'Teknologi & Engineering',
    jobGrade: 'Grade 10',
    description: 'Perancangan arsitektur teknologi skala besar, roadmap produk digital, keamanan siber, dan infrastruktur cloud holding.',
    requirements: 'S1/S2 Ilmu Komputer/Teknik Informatika, 10+ tahun engineering leadership.',
  },
  {
    id: 'mjp-vpcomm',
    entityId: 'ent-ntm-holding',
    code: 'JAB-VPCOMM',
    title: 'VP of Commercial, Sales & Strategic Partnership',
    defaultLevel: 2,
    division: 'Commercial, Sales & Business Expansion',
    department: 'Commercial & Sales',
    jobFamily: 'Commercial & Sales',
    jobGrade: 'Grade 10',
    description: 'Pertumbuhan pendapatan komersial, akuisisi kemitraan strategis B2B, ekspansi pangsa pasar, dan kepuasan klien korporat.',
    requirements: 'S1 Manajemen/Bisnis/Komunikasi, 10+ tahun enterprise sales & partnership.',
  },
  {
    id: 'mjp-srops',
    entityId: 'ent-ntm-holding',
    code: 'JAB-SROPS',
    title: 'Senior People Operations & Culture Specialist',
    defaultLevel: 3,
    division: 'Human Capital & Corporate Culture',
    department: 'People & Culture',
    jobFamily: 'People & Culture',
    jobGrade: 'Grade 08',
    description: 'Eksekusi operasional personalia, automasi lifecycle karyawan, kultur kerja inklusif, dan administrasi kepegawaian.',
    requirements: 'S1 Psikologi/Hukum/SDM, 5+ tahun people operations.',
  },
  {
    id: 'mjp-srcomp',
    entityId: 'ent-ntm-holding',
    code: 'JAB-SRCOMP',
    title: 'Senior Compensation & Benefits Manager',
    defaultLevel: 3,
    division: 'Human Capital & Corporate Culture',
    department: 'People & Culture',
    jobFamily: 'People & Culture',
    jobGrade: 'Grade 09',
    description: 'Benchmarking gaji industri, struktur skala upah, insentif performa, dan pengelolaan asuransi/benefit komprehensif.',
    requirements: 'S1 Statistik/Matematika/Manajemen SDM, 6+ tahun C&B specialist.',
  },
  {
    id: 'mjp-mgrtax',
    entityId: 'ent-ntm-holding',
    code: 'JAB-MGRTAX',
    title: 'Accounting & Tax Compliance Manager',
    defaultLevel: 3,
    division: 'Finance, Tax & Supply Chain Management',
    department: 'Finance & Tax',
    jobFamily: 'Finance & Accounting',
    jobGrade: 'Grade 08',
    description: 'Rekonsiliasi fiskal tahunan, e-Faktur PPN, pemotongan PPh 21/23/Final, dan supervisi laporan audit berkala.',
    requirements: 'S1 Akuntansi, Brevet AB, 6+ tahun di akuntansi korporat/KAP.',
  },
  {
    id: 'mjp-ai-lead',
    entityId: 'ent-ntm-holding',
    code: 'JAB-AI-LEAD',
    title: 'Lead Data & AI Architect',
    defaultLevel: 3,
    division: 'Technology, Engineering & Product Development',
    department: 'Technology & Engineering',
    jobFamily: 'Teknologi & Engineering',
    jobGrade: 'Grade 09',
    description: 'Pembangunan pipa data besar (Big Data Pipelines), model AI/LLM terapan, dan platform analitik prediktif bisnis.',
    requirements: 'S1/S2 Computer Science/Data Science, 7+ tahun pengalaman data/ML engineering.',
  },
  {
    id: 'mjp-prin-eng',
    entityId: 'ent-ntm-holding',
    code: 'JAB-PRIN-ENG',
    title: 'Principal Software Engineer',
    defaultLevel: 3,
    division: 'Technology, Engineering & Product Development',
    department: 'Technology & Engineering',
    jobFamily: 'Teknologi & Engineering',
    jobGrade: 'Grade 09',
    description: 'Arsitektur microservices core, standar kode enterprise, optimasi performa backend tinggi, dan mentoring engineer.',
    requirements: 'S1 Informatika, 7+ tahun fullstack/backend cloud architecture.',
  },
  {
    id: 'mjp-srbdm',
    entityId: 'ent-ntm-holding',
    code: 'JAB-SRBDM',
    title: 'Senior Business Development Manager',
    defaultLevel: 3,
    division: 'Commercial, Sales & Business Expansion',
    department: 'Commercial & Sales',
    jobFamily: 'Commercial & Sales',
    jobGrade: 'Grade 08',
    description: 'Pengembangan peluang pasar baru lintas vertikal industri, negosiasi kontrak korporat, dan penyusunan proposal bisnis.',
    requirements: 'S1 Bisnis/Komunikasi, 6+ tahun B2B corporate sales.',
  },
  {
    id: 'mjp-devops',
    entityId: 'ent-ntm-holding',
    code: 'JAB-DEVOPS',
    title: 'DevOps & Platform Engineer',
    defaultLevel: 4,
    division: 'Technology, Engineering & Product Development',
    department: 'Technology & Engineering',
    jobFamily: 'Teknologi & Engineering',
    jobGrade: 'Grade 07',
    description: 'Manajemen klaster Kubernetes, otomatisasi CI/CD pipelines, pemantauan sistem 24/7, dan keandalan server cloud.',
    requirements: 'S1 Teknik Komputer/Informatika, 3+ tahun AWS/GCP & Docker/Kubernetes.',
  },
  {
    id: 'mjp-srta',
    entityId: 'ent-ntm-holding',
    code: 'JAB-SRTA',
    title: 'Senior Talent Acquisition Specialist',
    defaultLevel: 4,
    division: 'Human Capital & Corporate Culture',
    department: 'People & Culture',
    jobFamily: 'People & Culture',
    jobGrade: 'Grade 07',
    description: 'End-to-end recruitment profesional spesialis, employer branding kampus & LinkedIn, dan talent assessment.',
    requirements: 'S1 Psikologi/Manajemen, 3+ tahun talent sourcing & hiring.',
  },
  {
    id: 'mjp-kae',
    entityId: 'ent-ntm-holding',
    code: 'JAB-KAE',
    title: 'Key Account Executive',
    defaultLevel: 4,
    division: 'Commercial, Sales & Business Expansion',
    department: 'Commercial & Sales',
    jobFamily: 'Commercial & Sales',
    jobGrade: 'Grade 06',
    description: 'Retensi dan pemeliharaan akun klien strategis, pemenuhan SLA layanan, dan eksplorasi upselling produk.',
    requirements: 'S1 Semua Jurusan, 2+ tahun account management.',
  },
  {
    id: 'mjp-fe-eng',
    entityId: 'ent-ntm-holding',
    code: 'JAB-FE-ENG',
    title: 'Frontend Software Engineer',
    defaultLevel: 5,
    division: 'Technology, Engineering & Product Development',
    department: 'Technology & Engineering',
    jobFamily: 'Teknologi & Engineering',
    jobGrade: 'Grade 06',
    description: 'Pengembangan komponen antarmuka responsif, integrasi REST/GraphQL API, dan optimasi performa UX aplikasi web.',
    requirements: 'S1 Teknik Informatika, menguasai React/TypeScript/TailwindCSS.',
  },
  {
    id: 'mjp-ga-admin',
    entityId: 'ent-ntm-holding',
    code: 'JAB-GA-ADMIN',
    title: 'General Affairs & Office Administrator',
    defaultLevel: 5,
    division: 'Direksi & Executive Board',
    department: 'General Affairs',
    jobFamily: 'General Affairs',
    jobGrade: 'Grade 05',
    description: 'Pengelolaan operasional harian gedung kantor, inventaris aset perlengkapan, dan pengurusan vendor fasilitas.',
    requirements: 'D3/S1 Administrasi Perkantoran/Manajemen, 1-2 tahun pengalaman administrasi GA.',
  },
];

// 27. Initial Org Structure Nodes & Proposals
export const INITIAL_ORG_NODES: OrgStructureNode[] = [
  {
    id: 'org-pos-1',
    entityId: 'ent-ntm-holding',
    title: 'President Director & Chief Executive Officer (CEO)',
    division: 'Direksi & Executive Board',
    department: 'Corporate Secretary & Governance',
    currentEmployeeId: 'emp-10', // Ir. Budi Santoso, MBA
    relationType: 'struktural',
    isVacant: false,
    level: 1,
  },
  {
    id: 'org-pos-audit',
    entityId: 'ent-ntm-holding',
    title: 'Head of Internal Audit & Risk Governance',
    division: 'Direksi & Executive Board',
    department: 'Corporate Secretary & Governance',
    reportsToId: 'org-pos-1',
    relationType: 'administratif', // Garis Putus-putus (Koordinasi Administratif)
    currentEmployeeId: 'emp-2', // Jessica Tanujaya, SE
    isVacant: false,
    level: 2,
    description: 'Unit kerja pengawasan internal independen yang melapor secara koordinasi administratif & fungsional ke Direksi.',
  },
  {
    id: 'org-pos-2',
    entityId: 'ent-ntm-holding',
    title: 'VP of Human Capital & Corporate Culture',
    division: 'Human Capital & Corporate Culture',
    department: 'People Operations & Payroll Services',
    reportsToId: 'org-pos-1',
    relationType: 'struktural', // Garis Lurus Solid (Komando Struktural Resmi)
    currentEmployeeId: 'emp-1', // Aditya Pratama, S.Psi
    isVacant: false,
    level: 2,
  },
  {
    id: 'org-pos-3',
    entityId: 'ent-ntm-holding',
    title: 'Head of Finance, Tax & Treasury Operation',
    division: 'Finance, Tax & Accounting',
    department: 'Corporate Tax & Treasury Compliance',
    reportsToId: 'org-pos-1',
    relationType: 'struktural',
    currentEmployeeId: 'emp-2', // Jessica Tanujaya, SE
    isVacant: false,
    level: 2,
  },
  {
    id: 'org-pos-4',
    entityId: 'ent-ntm-holding',
    title: 'General Affairs, Asset & Procurement Manager',
    division: 'General Affairs & Procurement',
    department: 'Procurement, PO & Vendor Relation',
    reportsToId: 'org-pos-1',
    relationType: 'struktural',
    currentEmployeeId: 'emp-3', // Bambang Sudiro
    isVacant: false,
    level: 2,
  },
  {
    id: 'org-pos-5',
    entityId: 'ent-ntm-holding',
    title: 'Head of Cloud Architecture & DevOps Engineering',
    division: 'Engineering & Information Technology',
    department: 'Cloud Infrastructure & DevOps Security',
    reportsToId: 'org-pos-1',
    relationType: 'struktural',
    currentEmployeeId: 'emp-8', // Eko Prasetyo, S.T.
    isVacant: false,
    level: 2,
  },
  {
    id: 'org-pos-6',
    entityId: 'ent-ntm-holding',
    title: 'Principal Fullstack Software Engineer',
    division: 'Engineering & Information Technology',
    department: 'Software Engineering & AI Systems',
    reportsToId: 'org-pos-5',
    relationType: 'struktural',
    currentEmployeeId: 'emp-4', // Dimas Wicaksono
    isVacant: false,
    level: 3,
  },
  {
    id: 'org-pos-ai-lead',
    entityId: 'ent-ntm-holding',
    title: 'Lead Data & AI Architect',
    division: 'Engineering & Information Technology',
    department: 'Software Engineering & AI Systems',
    reportsToId: 'org-pos-5',
    relationType: 'struktural',
    isVacant: true, // Posisi Kosong (Vacant)
    level: 3,
    description: 'Posisi formasi baru dalam tahap proses rekrutmen talenta arsitektur AI & Machine Learning.',
  },
  {
    id: 'org-pos-7',
    entityId: 'ent-ntm-holding',
    title: 'Senior UI/UX & Digital Brand Specialist',
    division: 'Engineering & Information Technology',
    department: 'Software Engineering & AI Systems',
    reportsToId: 'org-pos-6',
    relationType: 'struktural',
    currentEmployeeId: 'emp-7', // Dewi Sartika, S.Kom
    isVacant: false,
    level: 3,
  },
  {
    id: 'org-pos-8',
    entityId: 'ent-ntm-holding',
    title: 'Associate Product & HC Analytics Specialist',
    division: 'Human Capital & Corporate Culture',
    department: 'Talent Acquisition & Employer Branding',
    reportsToId: 'org-pos-2',
    relationType: 'struktural',
    currentEmployeeId: 'emp-6', // Farhan Kurnia
    isVacant: false,
    level: 3,
  },
  {
    id: 'org-pos-comp-lead',
    entityId: 'ent-ntm-holding',
    title: 'Senior Compensation & Benefits Manager',
    division: 'Human Capital & Corporate Culture',
    department: 'People Operations & Payroll Services',
    reportsToId: 'org-pos-2',
    relationType: 'administratif', // Koordinasi Administratif
    isVacant: true, // Posisi Kosong (Vacant)
    level: 3,
    description: 'Formatur manajerial remunerasi & benefit holding, status saat ini vacant menunggu promosi internal.',
  },
  {
    id: 'org-pos-9',
    entityId: 'ent-ntm-holding',
    title: 'Office Operations & Inventory Specialist',
    division: 'General Affairs & Procurement',
    department: 'Facility & Asset QR Operations',
    reportsToId: 'org-pos-4',
    relationType: 'struktural',
    currentEmployeeId: 'emp-5', // Rini Anggraini
    isVacant: false,
    level: 3,
  },
  {
    id: 'org-pos-10',
    entityId: 'ent-ntm-holding',
    title: 'Building Maintenance & Logistics Fleet Officer',
    division: 'General Affairs & Procurement',
    department: 'Facility & Asset QR Operations',
    reportsToId: 'org-pos-4',
    relationType: 'struktural',
    currentEmployeeId: 'emp-9', // Ahmad Fauzi
    isVacant: false,
    level: 3,
  },
];

export const INITIAL_ORG_PROPOSALS: OrgChangeProposal[] = [
  {
    id: 'org-prop-1',
    tenantId: 'tenant-ntm',
    entityId: 'ent-ntm-holding',
    proposalTitle: 'Pembentukan Tim Baru: AI Solutions & Automation Division',
    changeType: 'Buat Posisi Baru',
    description: 'Menambahkan 1 Head of AI & 2 Machine Learning Engineers di bawah Divisi Engineering',
    effectiveDate: '2026-11-15',
    status: 'Menunggu Approval',
    proposedBy: 'Aditya Pratama (VP HC)',
    implemented: false,
  },
];

// 28. Initial Probation Evaluations
export const INITIAL_PROBATION_EVALUATIONS: ProbationEvaluation[] = [
  {
    id: 'prb-eval-1',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-5',
    supervisorId: 'emp-1',
    evaluationDate: '2026-10-10',
    technicalSkillScore: 88,
    disciplineScore: 92,
    teamworkScore: 90,
    initiativeScore: 85,
    overallScore: 89,
    recommendation: 'Lulus',
    notes: 'Kandidat menunjukkan performa kerja sangat adaptif dan lulus masa percobaan 3 bulan.',
    status: 'Menunggu Approval',
    skDocNumber: 'SK-TETAP-NTM-2026-10-019',
  },
];

// 29. Initial Contract Renewal Reviews
export const INITIAL_CONTRACT_REVIEWS: ContractRenewalReview[] = [
  {
    id: 'cnt-rev-1',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-7',
    currentContractEnd: '2026-11-15',
    recommendation: 'Perpanjang PKWT',
    newDurationMonths: 12,
    notes: 'Kontrak PKWT diperpanjang 1 tahun ke depan untuk mengawal re-branding digital and UI/UX produk.',
    status: 'Menunggu Approval',
    newContractDocNumber: 'PKWT-NTM-2026-11-044',
  },
];

// 30. Initial Company Calendar Events
export const INITIAL_CALENDAR_EVENTS: CompanyCalendarEvent[] = [
  {
    id: 'cal-1',
    tenantId: 'tenant-ntm',
    title: 'Tahun Baru Masehi 2026',
    date: '2026-01-01',
    type: 'Libur Nasional',
    deductsLeaveBucket: false,
  },
  {
    id: 'cal-2',
    tenantId: 'tenant-ntm',
    title: 'Hari Raya Idul Fitri 1447 H',
    date: '2026-03-20',
    type: 'Libur Nasional',
    deductsLeaveBucket: false,
  },
  {
    id: 'cal-3',
    tenantId: 'tenant-ntm',
    title: 'Cuti Bersama Hari Raya Idul Fitri',
    date: '2026-03-23',
    type: 'Cuti Bersama Perusahaan',
    deductsLeaveBucket: true, // Potong otomatis jatah cuti bersama
    description: 'Dipotong otomatis dari bucket 1 jatah cuti bersama',
  },
  {
    id: 'cal-4',
    tenantId: 'tenant-ntm',
    title: 'Hari Kemerdekaan Republik Indonesia',
    date: '2026-08-17',
    type: 'Libur Nasional',
    deductsLeaveBucket: false,
  },
  {
    id: 'cal-5',
    tenantId: 'tenant-ntm',
    title: 'Cuti Bersama Natal & Akhir Tahun',
    date: '2026-12-24',
    type: 'Cuti Bersama Perusahaan',
    deductsLeaveBucket: true,
  },
];

// 31. Initial Grade & Salary Ranges
export const INITIAL_GRADE_SALARY_RANGES: GradeSalaryRange[] = [
  {
    id: 'grd-5',
    tenantId: 'tenant-ntm',
    gradeCode: 'Grade 05',
    gradeName: 'Junior Staff / Support Specialist',
    minSalary: 4500000,
    midSalary: 5800000,
    maxSalary: 7200000,
    effectiveDate: '2026-01-01',
    version: 1,
    notes: 'Kualifikasi fresh graduate atau staf pendukung operasional (0-1 tahun).',
  },
  {
    id: 'grd-6',
    tenantId: 'tenant-ntm',
    gradeCode: 'Grade 06',
    gradeName: 'Associate Officer / Staff',
    minSalary: 6000000,
    midSalary: 7800000,
    maxSalary: 9600000,
    effectiveDate: '2026-01-01',
    version: 1,
    notes: 'Staf pelaksana mandiri dengan pengalaman 1-2 tahun.',
  },
  {
    id: 'grd-7',
    tenantId: 'tenant-ntm',
    gradeCode: 'Grade 07',
    gradeName: 'Senior Officer / Officer Specialist',
    minSalary: 8500000,
    midSalary: 11200000,
    maxSalary: 14000000,
    effectiveDate: '2026-01-01',
    version: 1,
    notes: 'Staf senior berpengalaman 2-4 tahun dengan kompetensi teknis solid.',
  },
  {
    id: 'grd-8',
    tenantId: 'tenant-ntm',
    gradeCode: 'Grade 08',
    gradeName: 'Senior Specialist / Expert Officer',
    minSalary: 12000000,
    midSalary: 15800000,
    maxSalary: 19500000,
    effectiveDate: '2026-01-01',
    version: 1,
    notes: 'Spesialis senior (4-7 tahun) bertindak sebagai rujukan teknis unit kerja.',
  },
  {
    id: 'grd-9',
    tenantId: 'tenant-ntm',
    gradeCode: 'Grade 09',
    gradeName: 'Lead Specialist / Assistant Manager',
    minSalary: 17000000,
    midSalary: 22000000,
    maxSalary: 27500000,
    effectiveDate: '2026-01-01',
    version: 1,
    notes: 'Team lead fungsional atau asisten manajer dengan koordinasi proyek strategis.',
  },
  {
    id: 'grd-10',
    tenantId: 'tenant-ntm',
    gradeCode: 'Grade 10',
    gradeName: 'Manager / Section Head',
    minSalary: 24000000,
    midSalary: 31000000,
    maxSalary: 38500000,
    effectiveDate: '2026-01-01',
    version: 1,
    notes: 'Pemimpin struktural level departemen/seksi dengan akuntabilitas tim & budget.',
  },
  {
    id: 'grd-11',
    tenantId: 'tenant-ntm',
    gradeCode: 'Grade 11',
    gradeName: 'Senior Manager / Department Head',
    minSalary: 33000000,
    midSalary: 42500000,
    maxSalary: 52000000,
    effectiveDate: '2026-01-01',
    version: 1,
    notes: 'Manajer senior penanggung jawab fungsi bisnis atau departemen lintas entitas.',
  },
  {
    id: 'grd-12',
    tenantId: 'tenant-ntm',
    gradeCode: 'Grade 12',
    gradeName: 'Vice President / General Manager',
    minSalary: 45000000,
    midSalary: 58500000,
    maxSalary: 72000000,
    effectiveDate: '2026-01-01',
    version: 1,
    notes: 'Pimpinan divisi utama yang menentukan strategi operasional dan revenue holding.',
  },
  {
    id: 'grd-13',
    tenantId: 'tenant-ntm',
    gradeCode: 'Grade 13',
    gradeName: 'Senior Vice President / Managing Director',
    minSalary: 60000000,
    midSalary: 78000000,
    maxSalary: 96000000,
    effectiveDate: '2026-01-01',
    version: 1,
    notes: 'Eksekutif senior setingkat direktur anak perusahaan atau deputi direksi.',
  },
  {
    id: 'grd-14',
    tenantId: 'tenant-ntm',
    gradeCode: 'Grade 14',
    gradeName: 'Executive Director / C-Level (BOD)',
    minSalary: 85000000,
    midSalary: 112000000,
    maxSalary: 145000000,
    effectiveDate: '2026-01-01',
    version: 1,
    notes: 'Jajaran direksi eksekutif pemegang amanah RUPS holding perusahaan.',
  },
];

// 32. Initial Salary Components Master
export const INITIAL_SALARY_COMPONENTS: SalaryComponentMaster[] = [
  {
    id: 'cmp-1',
    tenantId: 'tenant-ntm',
    code: 'TUNJ-JAB',
    name: 'Tunjangan Jabatan & Posisi',
    category: 'Tunjangan Tetap',
    calculationBasis: 'Nominal Tetap',
    defaultValue: 2500000,
    isTaxable: true,
    isBpjsBase: true,
    description: 'Diberikan sesuai level jabatan struktural',
  },
  {
    id: 'cmp-2',
    tenantId: 'tenant-ntm',
    code: 'TUNJ-TRANS',
    name: 'Tunjangan Transportasi & Mobilitas',
    category: 'Tunjangan Tetap',
    calculationBasis: 'Nominal Tetap',
    defaultValue: 1500000,
    isTaxable: true,
    isBpjsBase: false,
    description: 'Diberikan bulanan untuk transportasi operasional',
  },
  {
    id: 'cmp-3',
    tenantId: 'tenant-ntm',
    code: 'TUNJ-MAKAN',
    name: 'Uang Makan Harian (Disburse Bulanan)',
    category: 'Tunjangan Tidak Tetap',
    calculationBasis: 'Nominal Tetap',
    defaultValue: 1000000,
    isTaxable: true,
    isBpjsBase: false,
    description: 'Dihitung berdasarkan kehadiran kerja aktif',
  },
  {
    id: 'cmp-4',
    tenantId: 'tenant-ntm',
    code: 'ASR-KOMERSIAL',
    name: 'Asuransi Kesehatan Swasta Tambahan (Allianz)',
    category: 'Asuransi Swasta',
    calculationBasis: 'Nominal Tetap',
    defaultValue: 750000,
    isTaxable: false,
    isBpjsBase: false,
    description: 'Benefit rawat inap kamar VIP',
  },
];

export const INITIAL_EMPLOYEE_SALARY_ASSIGNMENTS: EmployeeSalaryComponentAssignment[] = [
  {
    id: 'asg-1',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-4',
    componentId: 'cmp-1',
    amount: 2500000,
    effectiveDate: '2026-01-01',
    isActive: true,
  },
  {
    id: 'asg-2',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-4',
    componentId: 'cmp-2',
    amount: 1500000,
    effectiveDate: '2026-01-01',
    isActive: true,
  },
  {
    id: 'asg-3',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-4',
    componentId: 'cmp-3',
    amount: 1000000,
    effectiveDate: '2026-01-01',
    isActive: true,
  },
];

// 33. Initial GA Facilities & Bookings
export const INITIAL_GA_ROOM_BOOKINGS: GARoomBooking[] = [
  {
    id: 'rm-bkg-1',
    tenantId: 'tenant-ntm',
    entityId: 'ent-ntm-holding',
    roomName: 'Ruang Rapat Parahyangan (VIP)',
    floorLocation: 'Lt. 28 - Sayap Barat',
    capacity: 16,
    organizerId: 'emp-1',
    meetingTitle: 'Rapat Koordinasi Mingguan Direksi & Review Q4',
    date: '2026-10-20',
    startTime: '09:00',
    endTime: '11:30',
    attendeesInternal: ['emp-1', 'emp-2', 'emp-3', 'emp-4'],
    attendeesExternal: [
      {
        name: 'Ir. Hendra Gunawan',
        organization: 'PT Bank Mandiri (Persero) Tbk',
        email: 'hendra.gunawan@bankmandiri.co.id',
        checkedIn: false,
      },
    ],
    status: 'Terkonfirmasi',
    bookingDocNumber: 'BKG-ROOM-2026-10-081',
    momNotes: 'Membahas target implementasi migrasi multi-tenant dan laporan budget audit.',
    momDocNumber: 'MOM-NTM-2026-10-041',
  },
];

export const INITIAL_GA_VEHICLE_BOOKINGS: GAVehicleBooking[] = [
  {
    id: 'veh-bkg-1',
    tenantId: 'tenant-ntm',
    entityId: 'ent-ntm-holding',
    vehicleName: 'Toyota Kijang Innova Zenix Q Hybrid',
    plateNumber: 'B 1024 PQR',
    driverType: 'Sopir Kantor',
    driverName: 'Pak Sutrisno',
    borrowerId: 'emp-4',
    purpose: 'Kunjungan dinas pengecekan server ke Tier 3 Data Center Cikarang',
    destination: 'Delta Silicon Industrial Park, Cikarang',
    startDate: '2026-10-21 08:00',
    endDate: '2026-10-21 17:00',
    startOdometer: 24150,
    status: 'Disetujui',
    formDocNumber: 'SPK-ARMADA-2026-10-019',
    nextServiceDate: '2026-12-15',
    taxExpiryDate: '2027-04-18',
  },
];

export const INITIAL_GA_SUPPLIES: GAOfficeSupply[] = [
  {
    id: 'spl-1',
    tenantId: 'tenant-ntm',
    itemCode: 'ATK-KRT-01',
    itemName: 'Kertas HVS PaperOne A4 80gr',
    category: 'Kertas & Dokumen',
    currentStock: 42,
    unit: 'Rim',
    reorderPoint: 20,
    standardReorderQty: 50,
    estimatedUnitPrice: 55000,
  },
  {
    id: 'spl-2',
    tenantId: 'tenant-ntm',
    itemCode: 'ATK-TNR-02',
    itemName: 'Toner HP LaserJet Original 85A Black',
    category: 'Tinta & Toner',
    currentStock: 4,
    unit: 'Box',
    reorderPoint: 5, // Trigger auto-reorder flag
    standardReorderQty: 10,
    estimatedUnitPrice: 950000,
  },
  {
    id: 'spl-3',
    tenantId: 'tenant-ntm',
    itemCode: 'ATK-PLP-03',
    itemName: 'Ballpoint Pilot G2 0.7mm Black (Pack isi 12)',
    category: 'Alat Tulis',
    currentStock: 25,
    unit: 'Pack',
    reorderPoint: 10,
    standardReorderQty: 20,
    estimatedUnitPrice: 180000,
  },
];

export const INITIAL_GA_SUPPLY_REQUESTS: GAOfficeSupplyRequest[] = [
  {
    id: 'spl-req-1',
    tenantId: 'tenant-ntm',
    requesterId: 'emp-2',
    department: 'Finance & Accounting',
    itemId: 'spl-1',
    qty: 5,
    reason: 'Pencetakan laporan audit pajak dan slip gaji tahunan',
    requestDate: '2026-10-18',
    status: 'Menunggu Approval',
  },
];

export const INITIAL_GA_TICKETS: GATicket[] = [
  {
    id: 'ga-tkt-1',
    tenantId: 'tenant-ntm',
    ticketNumber: 'TKT-GA-2026-10-001',
    category: 'Aset Rusak/Perawatan',
    requesterId: 'emp-4',
    title: 'Monitor Dell UltraSharp 27" Layar Bergaris Garis',
    description: 'Display kabel DP/HDMI sudah ditukar tapi garis vertikal biru tetap muncul di panel IPS.',
    priority: 'Tinggi',
    status: 'Sedang Diproses',
    assignedStaff: 'Bambang Sudiro (GA)',
    slaHours: 24,
    createdAt: '2026-10-18T09:15:00Z',
  },
  {
    id: 'ga-tkt-2',
    tenantId: 'tenant-ntm',
    ticketNumber: 'TKT-GA-2026-10-002',
    category: 'Pinjam Ruangan/Fasilitas',
    requesterId: 'emp-1',
    title: 'Pemesanan Ruang Rapat VIP Parahyangan untuk Pertemuan Bank',
    description: 'Mohon siapkan proyektor HDMI, mic wireless dan air mineral untuk 10 orang.',
    priority: 'Normal',
    status: 'Selesai',
    assignedStaff: 'Tim GA Support',
    slaHours: 12,
    createdAt: '2026-10-17T11:00:00Z',
    resolvedAt: '2026-10-17T14:00:00Z',
    resolutionNotes: 'Ruangan sudah disetting dan dicek AC serta proyektor siap pakai.',
  },
  {
    id: 'ga-tkt-3',
    tenantId: 'tenant-ntm',
    ticketNumber: 'TKT-GA-2026-10-003',
    category: 'Minta ATK/Perlengkapan',
    requesterId: 'emp-2',
    title: 'Kebutuhan Reorder Kertas A4 & Toner Printer Keuangan',
    description: 'Stok toner tinggal 1 pcs, mohon pengadaan via procurement.',
    priority: 'Normal',
    status: 'Terbuka',
    slaHours: 48,
    createdAt: '2026-10-19T08:00:00Z',
  },
];

// 34. Initial Procurement Vendor Invoices (AP)
export const INITIAL_VENDOR_INVOICES: VendorInvoice[] = [
  {
    id: 'inv-1',
    tenantId: 'tenant-ntm',
    vendorId: 'vnd-1',
    vendorName: 'PT Mitra Sukses Komputindo',
    poNumber: 'PO-2026-10-001',
    invoiceNumber: 'INV/MSK/2026/X/084',
    invoiceDate: '2026-10-12',
    dueDate: '2026-11-12',
    amount: 45000000,
    status: 'Sudah Bill',
    paidDate: '2026-10-16',
    paymentMethod: 'Bank Transfer BCA Korporat',
    taxInvoiceNumber: '010.002-26.88761234',
    notes: 'Pembayaran lunas termin 1 pengadaan 3 unit MacBook Pro',
  },
  {
    id: 'inv-2',
    tenantId: 'tenant-ntm',
    vendorId: 'vnd-2',
    vendorName: 'CV Sentosa Office Supplies',
    poNumber: 'PO-2026-10-002',
    invoiceNumber: 'INV-SOS-10-9921',
    invoiceDate: '2026-10-17',
    dueDate: '2026-11-01',
    amount: 6850000,
    status: 'Belum Bill',
    taxInvoiceNumber: '010.002-26.99120033',
    notes: 'Tagihan perlengkapan ATK & kertas kantor bulan Oktober',
  },
];

// 35. Initial Audit Log Entries
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'adt-1',
    tenantId: 'tenant-ntm',
    entityId: 'ent-ntm-holding',
    timestamp: '2026-10-18T10:15:30Z',
    actorId: 'usr-1',
    actorName: 'Aditya Pratama, S.Psi',
    actorRole: 'super_admin',
    module: 'Personalia',
    action: 'SUBMIT_PROPOSAL',
    recordId: 'pers-req-1',
    changesSummary: 'Mengajukan Promosi untuk Dimas Wicaksono (L2 → L3) Gaji Rp14.5jt → Rp18jt',
  },
  {
    id: 'adt-2',
    tenantId: 'tenant-ntm',
    entityId: 'ent-ntm-holding',
    timestamp: '2026-10-18T11:40:12Z',
    actorId: 'usr-2',
    actorName: 'Jessica Tanujaya, SE',
    actorRole: 'payroll_admin',
    module: 'Payroll',
    action: 'APPROVE_REIMBURSEMENT',
    recordId: 'clm-1',
    changesSummary: 'Menyetujui klaim transportasi dinas Rp350.000 untuk dimasukkan ke Payroll Oktober 2026',
  },
  {
    id: 'adt-3',
    tenantId: 'tenant-ntm',
    entityId: 'ent-ntm-holding',
    timestamp: '2026-10-18T14:30:00Z',
    actorId: 'usr-3',
    actorName: 'Bambang Sudiro',
    actorRole: 'ga_admin',
    module: 'GA Assets',
    action: 'RELOCATE_ASSET',
    recordId: 'reloc-1',
    changesSummary: 'Mutasi laptop MacBook Pro AST-NTM-001 dari Tim Engineering ke Ruang Server',
  },
];

// 36. Initial eNPS Survey
export const INITIAL_ENPS_SURVEY: ENpsSurvey = {
  id: 'enps-2026-q3',
  tenantId: 'tenant-ntm',
  period: 'Q3 2026',
  title: 'Survei Kepuasan & Employee Net Promoter Score Q3 2026',
  isActive: true,
  responses: [
    { id: 'enps-r-1', score: 10, department: 'Engineering & Technology', feedback: 'Budaya kerja suportif dan fleksibel', submittedAt: '2026-10-01' },
    { id: 'enps-r-2', score: 9, department: 'Finance & Accounting', feedback: 'Sistem kompensasi dan tunjangan transparan', submittedAt: '2026-10-02' },
    { id: 'enps-r-3', score: 9, department: 'People & Culture', feedback: 'Program pengembangan diri sangat baik', submittedAt: '2026-10-03' },
    { id: 'enps-r-4', score: 8, department: 'General Affairs', feedback: 'Fasilitas kerja memadai', submittedAt: '2026-10-04' },
    { id: 'enps-r-5', score: 7, department: 'Customer Operations', feedback: 'Perlu peningkatan jenjang karir', submittedAt: '2026-10-05' },
  ],
  totalResponses: 5,
  promoters: 3,
  passives: 2,
  detractors: 0,
  score: 60, // 60% NPS (Sangat Bagus)
};

// 37. Initial Pre-calculated Payroll Run (Oktober 2026) for Complete Business Flow
export const INITIAL_PAYROLL_RECORDS: PayrollRecord[] = [
  {
    id: 'pay-1',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-1',
    period: '2026-10',
    basicSalary: 28000000,
    allowances: 9500000, // Tunjangan Tetap 4.5m + Transport 1.5m + Makan 1m + Jabatan 2.5m
    overtimePay: 0,
    reimbursement: 0,
    thrBonus: 0,
    grossPay: 37500000,
    bpjsKesCompany: 400000,
    bpjsKesEmployee: 100000,
    bpjsTkCompany: 1777500,
    bpjsTkEmployee: 1054000,
    pph21TERCategory: 'TER B',
    pph21RatePercent: 12.0,
    pph21Amount: 4500000,
    loanDeduction: 0,
    lateDeduction: 0,
    totalDeductions: 5654000,
    netPay: 31846000,
    status: 'Approved',
    paidDate: '2026-10-25',
  },
  {
    id: 'pay-2',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-2',
    period: '2026-10',
    basicSalary: 15500000,
    allowances: 3000000,
    overtimePay: 350000,
    reimbursement: 850000,
    thrBonus: 0,
    grossPay: 19700000,
    bpjsKesCompany: 400000,
    bpjsKesEmployee: 100000,
    bpjsTkCompany: 1046000,
    bpjsTkEmployee: 610000,
    pph21TERCategory: 'TER A',
    pph21RatePercent: 8.0,
    pph21Amount: 1576000,
    loanDeduction: 0,
    lateDeduction: 0,
    totalDeductions: 2286000,
    netPay: 17414000,
    status: 'Approved',
    paidDate: '2026-10-25',
  },
  {
    id: 'pay-3',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-3',
    period: '2026-10',
    basicSalary: 11000000,
    allowances: 3500000,
    overtimePay: 0,
    reimbursement: 0,
    thrBonus: 0,
    grossPay: 14500000,
    bpjsKesCompany: 400000,
    bpjsKesEmployee: 100000,
    bpjsTkCompany: 919000,
    bpjsTkEmployee: 590000,
    pph21TERCategory: 'TER B',
    pph21RatePercent: 5.0,
    pph21Amount: 725000,
    loanDeduction: 0,
    lateDeduction: 50000,
    totalDeductions: 1465000,
    netPay: 13035000,
    status: 'Approved',
    paidDate: '2026-10-25',
  },
  {
    id: 'pay-4',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-4',
    period: '2026-10',
    basicSalary: 14000000,
    allowances: 3000000,
    overtimePay: 450000, // Lembur 2 jam PP 35
    reimbursement: 350000,
    thrBonus: 0,
    grossPay: 17800000,
    bpjsKesCompany: 400000,
    bpjsKesEmployee: 100000,
    bpjsTkCompany: 1046000,
    bpjsTkEmployee: 610000,
    pph21TERCategory: 'TER A',
    pph21RatePercent: 7.0,
    pph21Amount: 1246000,
    loanDeduction: 1000000, // Cicilan Kasbon Pinjaman Fleksibel
    lateDeduction: 0,
    totalDeductions: 2956000,
    netPay: 14844000,
    status: 'Approved',
    paidDate: '2026-10-25',
  },
  {
    id: 'pay-5',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-5',
    period: '2026-10',
    basicSalary: 5500000,
    allowances: 1500000,
    overtimePay: 0,
    reimbursement: 0,
    thrBonus: 0,
    grossPay: 7000000,
    bpjsKesCompany: 280000,
    bpjsKesEmployee: 70000,
    bpjsTkCompany: 483000,
    bpjsTkEmployee: 210000,
    pph21TERCategory: 'TER A',
    pph21RatePercent: 0.75,
    pph21Amount: 52500,
    loanDeduction: 0,
    lateDeduction: 0,
    totalDeductions: 332500,
    netPay: 6667500,
    status: 'Approved',
    paidDate: '2026-10-25',
  },
  {
    id: 'pay-6',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-6',
    period: '2026-10',
    basicSalary: 3500000,
    allowances: 1000000,
    overtimePay: 0,
    reimbursement: 0,
    thrBonus: 0,
    grossPay: 4500000,
    bpjsKesCompany: 180000,
    bpjsKesEmployee: 45000,
    bpjsTkCompany: 310500,
    bpjsTkEmployee: 135000,
    pph21TERCategory: 'TER A',
    pph21RatePercent: 0.0,
    pph21Amount: 0, // Di bawah PTKP
    loanDeduction: 0,
    lateDeduction: 0,
    totalDeductions: 180000,
    netPay: 4320000,
    status: 'Approved',
    paidDate: '2026-10-25',
  },
  {
    id: 'pay-7',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-7',
    period: '2026-10',
    basicSalary: 8500000,
    allowances: 2000000,
    overtimePay: 0,
    reimbursement: 450000,
    thrBonus: 0,
    grossPay: 10950000,
    bpjsKesCompany: 400000,
    bpjsKesEmployee: 85000,
    bpjsTkCompany: 759000,
    bpjsTkEmployee: 472500,
    pph21TERCategory: 'TER A',
    pph21RatePercent: 2.0,
    pph21Amount: 219000,
    loanDeduction: 0,
    lateDeduction: 75000, // Pemotongan keterlambatan
    totalDeductions: 851500,
    netPay: 10098500,
    status: 'Approved',
    paidDate: '2026-10-25',
  },
  {
    id: 'pay-9',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-9',
    period: '2026-10',
    basicSalary: 5200000,
    allowances: 1600000,
    overtimePay: 200000,
    reimbursement: 0,
    thrBonus: 0,
    grossPay: 7000000,
    bpjsKesCompany: 280000,
    bpjsKesEmployee: 70000,
    bpjsTkCompany: 483000,
    bpjsTkEmployee: 210000,
    pph21TERCategory: 'TER A',
    pph21RatePercent: 0.75,
    pph21Amount: 52500,
    loanDeduction: 0,
    lateDeduction: 100000,
    totalDeductions: 432500,
    netPay: 6567500,
    status: 'Approved',
    paidDate: '2026-10-25',
  },
  {
    id: 'pay-10',
    tenantId: 'tenant-ntm',
    employeeId: 'emp-10',
    period: '2026-10',
    basicSalary: 45000000,
    allowances: 10000000,
    overtimePay: 0,
    reimbursement: 0,
    thrBonus: 0,
    grossPay: 55000000,
    bpjsKesCompany: 480000,
    bpjsKesEmployee: 120000,
    bpjsTkCompany: 2600000,
    bpjsTkEmployee: 1100000,
    pph21TERCategory: 'TER B',
    pph21RatePercent: 19.0,
    pph21Amount: 10450000,
    loanDeduction: 0,
    lateDeduction: 0,
    totalDeductions: 11670000,
    netPay: 43330000,
    status: 'Approved',
    paidDate: '2026-10-25',
  },
];

const createInitialPerm = (
  view: boolean,
  create: boolean,
  edit: boolean,
  del: boolean,
  approve: boolean,
  exp: boolean
): OperationPermissions => ({
  view,
  create,
  edit,
  delete: del,
  approve,
  export: exp,
});

export const INITIAL_ROLE_PERMISSIONS: Record<string, OperationPermissions> = (() => {
  const perms: Record<string, OperationPermissions> = {};

  const modules = [
    'employees',
    'personalia',
    'attendance',
    'trips',
    'payroll',
    'loans',
    'approvals',
    'kpi',
    'compliance',
    'recruitment',
    'offboarding',
    'assets',
    'procurement',
    'documents',
    'audit_trail',
    'calendar',
  ];

  modules.forEach((mod) => {
    // 1. super_admin: wildcard full access
    perms[`${mod}__super_admin`] = createInitialPerm(true, true, true, true, true, true);

    // 2. hr_admin
    const hrCore = ['employees', 'personalia', 'attendance', 'trips', 'kpi', 'compliance', 'recruitment', 'offboarding', 'documents', 'approvals', 'calendar'];
    if (hrCore.includes(mod)) {
      perms[`${mod}__hr_admin`] = createInitialPerm(true, true, true, false, true, true);
    } else if (['payroll', 'loans', 'assets', 'procurement', 'audit_trail'].includes(mod)) {
      perms[`${mod}__hr_admin`] = createInitialPerm(true, false, false, false, false, true);
    } else {
      perms[`${mod}__hr_admin`] = createInitialPerm(false, false, false, false, false, false);
    }

    // 3. payroll_admin
    if (['payroll', 'loans', 'approvals'].includes(mod)) {
      perms[`${mod}__payroll_admin`] = createInitialPerm(true, true, true, false, true, true);
    } else if (['employees', 'attendance', 'documents', 'calendar'].includes(mod)) {
      perms[`${mod}__payroll_admin`] = createInitialPerm(true, false, false, false, false, false);
    } else {
      perms[`${mod}__payroll_admin`] = createInitialPerm(false, false, false, false, false, false);
    }

    // 4. ga_admin
    if (['assets', 'procurement', 'documents', 'approvals', 'calendar'].includes(mod)) {
      perms[`${mod}__ga_admin`] = createInitialPerm(true, true, true, false, true, true);
    } else if (['employees'].includes(mod)) {
      perms[`${mod}__ga_admin`] = createInitialPerm(true, false, false, false, false, false);
    } else {
      perms[`${mod}__ga_admin`] = createInitialPerm(false, false, false, false, false, false);
    }

    // 5. manager
    if (['attendance', 'trips', 'kpi', 'approvals', 'calendar'].includes(mod)) {
      perms[`${mod}__manager`] = createInitialPerm(true, true, true, false, true, true);
    } else if (['employees', 'personalia', 'loans', 'procurement'].includes(mod)) {
      perms[`${mod}__manager`] = createInitialPerm(true, true, false, false, false, false);
    } else {
      perms[`${mod}__manager`] = createInitialPerm(false, false, false, false, false, false);
    }

    // 6. employee (ESS)
    if (['attendance', 'trips', 'kpi', 'loans', 'calendar'].includes(mod)) {
      perms[`${mod}__employee`] = createInitialPerm(true, true, false, false, false, false);
    } else if (['payroll', 'documents'].includes(mod)) {
      perms[`${mod}__employee`] = createInitialPerm(true, false, false, false, false, false);
    } else {
      perms[`${mod}__employee`] = createInitialPerm(false, false, false, false, false, false);
    }
  });

  return perms;
})();


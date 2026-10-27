import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  TrendingUp,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  DollarSign,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Building,
  Calendar,
  X,
  Settings,
  ShieldCheck,
  AlertCircle,
  MapPin,
  UserCheck,
  Clock,
  AlertTriangle,
  Layers,
  Briefcase,
  FileBadge,
  Lock,
  Trash2,
  Users,
  CheckCircle2,
  Eye,
  FileText,
  Send,
  Laptop,
  Key,
  Sparkles,
  ArrowRight,
  Car,
  Shield,
  CheckSquare,
  Square,
} from 'lucide-react';
import { PersonaliaActionType, Employee, PersonaliaSignatory, PersonaliaLog, SystemicImpactConfig } from '../../types/hrms';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { CurrencyInput } from '../common/CurrencyInput';
import { ValidatedDateInput } from '../common/ValidatedDateInput';
import { formatRupiah } from '../../utils/taxCalculator';
import { toRomanNumeral } from '../../utils/documentNumbering';
import { ModuleDocumentModal } from '../common/ModuleDocumentModal';

// Enterprise Grading & Salary Scales (Compensation Triggers)
export interface GradeSalaryScale {
  grade: string;
  label: string;
  minSalary: number;
  maxSalary: number;
  defaultPositionAllowance: number;
  recommendedRole: string;
  defaultApprovalAuthorities: string[];
  defaultAssets: string[];
}

export const GRADE_SALARY_SCALES: Record<string, GradeSalaryScale> = {
  'L1': {
    grade: 'L1',
    label: 'L1 - Entry Level / Junior Staff',
    minSalary: 4500000,
    maxSalary: 6500000,
    defaultPositionAllowance: 0,
    recommendedRole: 'Regular Employee',
    defaultApprovalAuthorities: [],
    defaultAssets: ['Laptop Standar Bisnis', 'ID Card & Akses Pintu Kerja'],
  },
  'L2': {
    grade: 'L2',
    label: 'L2 - Associate Specialist',
    minSalary: 6500000,
    maxSalary: 9500000,
    defaultPositionAllowance: 500000,
    recommendedRole: 'Regular Employee',
    defaultApprovalAuthorities: [],
    defaultAssets: ['Laptop Standar Bisnis', 'Headset Korporat', 'ID Card'],
  },
  'L3': {
    grade: 'L3',
    label: 'L3 - Senior Specialist',
    minSalary: 9500000,
    maxSalary: 15000000,
    defaultPositionAllowance: 1000000,
    recommendedRole: 'Supervisor',
    defaultApprovalAuthorities: ['Approval Cuti & Izin Tim (Level 1)'],
    defaultAssets: ['Laptop Performance / High-Spec', 'ID Card & Akses Lab'],
  },
  'L4': {
    grade: 'L4',
    label: 'L4 - Lead / Principal Specialist',
    minSalary: 15000000,
    maxSalary: 22000000,
    defaultPositionAllowance: 2000000,
    recommendedRole: 'Supervisor',
    defaultApprovalAuthorities: [
      'Approval Cuti & Izin Tim (Level 1)',
      'Approval Lembur Tim (Overtime)',
    ],
    defaultAssets: ['Laptop Performance Pro Ultrabook', 'Monitor Eksternal Dual-Screen', 'Voucher Transport'],
  },
  'M1': {
    grade: 'M1',
    label: 'M1 - Assistant Manager / Section Head',
    minSalary: 18000000,
    maxSalary: 28000000,
    defaultPositionAllowance: 3500000,
    recommendedRole: 'Manager / Approver',
    defaultApprovalAuthorities: [
      'Approval Cuti & Izin Tim (Level 1 & 2)',
      'Approval Lembur Tim (Overtime)',
      'Approval Reimbursement & Klaim Operasional (s/d Rp 10 Juta)',
      'Akses Dashboard KPI Divisi',
    ],
    defaultAssets: ['Laptop Performance Pro Ultrabook', 'Smartphone Korporat', 'Kartu Akses Ruang Khusus'],
  },
  'M2': {
    grade: 'M2',
    label: 'M2 - Senior Manager / Department Head',
    minSalary: 26000000,
    maxSalary: 42000000,
    defaultPositionAllowance: 6000000,
    recommendedRole: 'Department Head',
    defaultApprovalAuthorities: [
      'Approval Cuti & Izin Seluruh Departemen',
      'Approval Lembur Seluruh Departemen',
      'Approval Reimbursement & Klaim Finansial (s/d Rp 50 Juta)',
      'Approval Pengajuan Lembur & SPPD Dinas',
      'Akses Penuh Analytics & Anggaran Divisi',
    ],
    defaultAssets: ['Laptop Ultra High-End Flagship', 'Smartphone Korporat & Paket Unlimited', 'Ruang Kerja Khusus & Meja Eksekutif', 'Kartu Akses Eksekutif'],
  },
  'E1': {
    grade: 'E1',
    label: 'E1 - Vice President / Direksi',
    minSalary: 45000000,
    maxSalary: 75000000,
    defaultPositionAllowance: 12000000,
    recommendedRole: 'Director',
    defaultApprovalAuthorities: [
      'Otoritas Pengesahan Akhir SK & Personalia',
      'Approval Anggaran Capital Expenditure (CAPEX)',
      'Approval Finansial Enterprise Tanpa Batas',
      'Akses Sistem Manajemen Strategis Seluruh Perusahaan',
    ],
    defaultAssets: ['Laptop Flagship Executive', 'Kendaraan Dinas / Fasilitas COP (Car Ownership Program)', 'Smartphone Flagship', 'Ruang Kerja Eksekutif & Slot Parkir VVIP'],
  },
};

// Preset Options for Systemic Impacts
export const PRESET_NEW_ALLOWANCES = [
  'Tunjangan Jabatan Struktural',
  'Tunjangan Transport Manajerial',
  'Tunjangan Komunikasi & Pulsa',
  'Tunjangan Kemahalan Site / Penempatan',
  'Tunjangan Honorarium Plt (Tugas Rangkap)',
  'Asuransi Kesehatan Rawat Inap Eksekutif & Keluarga',
];

export const PRESET_REVOKED_ALLOWANCES = [
  'Tunjangan Lapangan / On-Site (Dihanguskan karena penempatan kantor pusat)',
  'Hak Lembur / Overtime Exemption (Dihanguskan beralih ke level manajerial)',
  'Tunjangan Shift Malam (Dihanguskan beralih ke jam kantor normal)',
  'Tunjangan Plt Lama (Dihanguskan karena penugasan sementara selesai)',
  'Tunjangan Penempatan Lokasi Lama (Dihanguskan karena mutasi)',
];

export const PRESET_APPROVAL_AUTHORITIES = [
  'Approval Cuti & Izin Kerja Tim (Level 1)',
  'Approval Lembur Karyawan (Overtime)',
  'Approval Reimbursement & Klaim Operasional (s/d Rp 10 Juta)',
  'Approval Pengajuan SPPD / Perjalanan Dinas',
  'Hak Akses Dashboard Analytics & KPI Divisi',
  'Approval Anggaran & Pengadaan Barang Divisi (Procurement)',
];

export const PRESET_ALLOCATED_ASSETS = [
  'Laptop High Performance Pro / Ultrabook',
  'Kendaraan Dinas Operasional / Fasilitas Mobil Dinas',
  'Smartphone Korporat & Paket Komunikasi Bisnis',
  'Ruang Kerja Khusus / Meja Divisi Baru',
  'Kartu Akses Ruang Eksekutif & Slot Parkir Khusus',
  'Perangkat Tablet Presentation Pro',
];

export const PRESET_RETURNED_ASSETS = [
  'Laptop Lama (Serah terima ke GA untuk Re-imaging & Inventarisasi)',
  'Fasilitas Kendaraan Dinas Sebelumnya (Dikembalikan ke GA Pool)',
  'Kunci Ruangan & Kartu Akses Divisi Lama',
  'Perangkat Kerja Lapangan Sebelumnya',
];

// Configuration Model for Systemic Transitions Per Action Type
export interface ActionPolicyConfig {
  actionType: PersonaliaActionType;
  title: string;
  badgeColor: string;
  description: string;
  defaultReason: string;
  salaryPercentChange: number;
  salaryNote: string;
  defaultNewAllowances: string[];
  defaultRevokedAllowances: string[];
  systemRole: string;
  defaultApprovalAuthorities: string[];
  defaultAllocatedAssets: string[];
  defaultReturnedAssets: string[];
}

export const DEFAULT_ACTION_POLICIES: Record<string, ActionPolicyConfig> = {
  Promosi: {
    actionType: 'Promosi',
    title: 'Promosi (Promotion)',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Kenaikan jabatan ke tingkat yang lebih tinggi, diikuti peningkatan tanggung jawab, evaluasi grading skala upah, dan wewenang struktural.',
    defaultReason: 'Pencapaian KPI tahunan luar biasa (Rating A), rekam jejak integritas bebas sanksi, dan lulus asesmen kompetensi manajerial.',
    salaryPercentChange: 25,
    salaryNote: 'Kenaikan gaji pokok otomatis +25% disesuaikan minimal grading baru',
    defaultNewAllowances: [
      'Tunjangan Jabatan Struktural',
      'Tunjangan Komunikasi & Pulsa',
      'Tunjangan Transport Manajerial',
    ],
    defaultRevokedAllowances: [
      'Hak Lembur / Overtime Exemption (Dihanguskan beralih ke level manajerial)',
    ],
    systemRole: 'Department Head',
    defaultApprovalAuthorities: [
      'Approval Cuti & Izin Kerja Tim (Level 1 & 2)',
      'Approval Lembur Karyawan (Overtime)',
      'Approval Klaim & Reimbursement Biaya Operasional',
      'Akses Dashboard KPI & Kinerja Anggota Divisi',
    ],
    defaultAllocatedAssets: [
      'Laptop Spek Tinggi (High Performance Workstation)',
      'Smartphone Korporat & Paket Komunikasi Bisnis',
    ],
    defaultReturnedAssets: [
      'Laptop Lama (Serah terima ke GA untuk Re-imaging & Inventarisasi)',
    ],
  },
  Mutasi: {
    actionType: 'Mutasi',
    title: 'Mutasi / Transfer (Lateral Move)',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Perpindahan posisi atau departemen pada level jabatan yang setara untuk rotasi kerja atau penyegaran organisasi.',
    defaultReason: 'Kebutuhan strategis restrukturisasi organisasi dan penguatan kapabilitas divisi penerima.',
    salaryPercentChange: 0,
    salaryNote: 'Gaji pokok dan grade upah setara (tanpa perubahan grading pokok)',
    defaultNewAllowances: [
      'Tunjangan Penempatan Unit Baru',
    ],
    defaultRevokedAllowances: [
      'Tunjangan Penempatan Lokasi Lama (Dihanguskan karena mutasi)',
    ],
    systemRole: 'Regular Employee',
    defaultApprovalAuthorities: [
      'Approval Cuti & Izin Kerja Tim (Level 1)',
    ],
    defaultAllocatedAssets: [
      'Ruang Kerja Khusus / Meja Divisi Baru',
      'Kartu Akses Gedung & Lantai Divisi Baru',
    ],
    defaultReturnedAssets: [
      'Kunci Ruangan & Kartu Akses Divisi Lama',
    ],
  },
  Demosi: {
    actionType: 'Demosi',
    title: 'Demosi (Demotion)',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Penurunan jabatan ke tingkat yang lebih rendah karena evaluasi kinerja berkelanjutan atau tindakan disipliner.',
    defaultReason: 'Penyesuaian kapasitas manajerial dan penetapan Program Peningkatan Kinerja (PIP) 90 hari.',
    salaryPercentChange: -15,
    salaryNote: 'Penyesuaian batas bawah grade baru dan pembekuan tunjangan struktural',
    defaultNewAllowances: [],
    defaultRevokedAllowances: [
      'Tunjangan Jabatan Struktural (Dicabut)',
      'Tunjangan Transport Manajerial (Dicabut)',
    ],
    systemRole: 'Regular Employee',
    defaultApprovalAuthorities: [],
    defaultAllocatedAssets: [
      'Laptop Standar Bisnis',
    ],
    defaultReturnedAssets: [
      'Kendaraan Dinas Operasional / Fasilitas Mobil Dinas',
      'Smartphone Korporat & Paket Komunikasi Bisnis',
      'Kartu Akses Ruang Manajemen',
    ],
  },
  'Penetapan Plt': {
    actionType: 'Penetapan Plt',
    title: 'Penugasan Sementara (Acting Role / Plt)',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Pengisian jabatan kosong secara temporer (misal: Pelaksana Tugas/Plt) dengan honorarium tugas rangkap khusus.',
    defaultReason: 'Mengisi kekosongan kepemimpinan divisi sementara maksimal 6 bulan hingga pejabat definitif ditetapkan.',
    salaryPercentChange: 0,
    salaryNote: 'Gaji pokok tetap + Tunjangan Honorarium Plt Rp 3.000.000 / bulan',
    defaultNewAllowances: [
      'Tunjangan Honorarium Plt (Tugas Rangkap)',
    ],
    defaultRevokedAllowances: [],
    systemRole: 'Unit Manager',
    defaultApprovalAuthorities: [
      'Approval Cuti & Izin Kerja Tim (Level 1)',
      'Approval Lembur Karyawan (Overtime)',
      'Akses Dashboard KPI Divisi',
    ],
    defaultAllocatedAssets: [
      'Kartu Akses Ruang Eksekutif & Slot Parkir Khusus',
    ],
    defaultReturnedAssets: [
      'Tidak ada aset ditarik (Penugasan bersifat sementara)',
    ],
  },
  'Pengangkatan Tetap': {
    actionType: 'Pengangkatan Tetap',
    title: 'Perubahan Status (PKWT → PKWTT)',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Perubahan dari karyawan kontrak (PKWT) menjadi karyawan tetap (PKWTT) permanen.',
    defaultReason: 'Lolos evaluasi masa percobaan 3 bulan dengan predikat Memuaskan sesuai Pasal 60 UU Ketenagakerjaan.',
    salaryPercentChange: 10,
    salaryNote: 'Penetapan status karyawan tetap dengan paket jaminan pensiun & kesehatan permanen',
    defaultNewAllowances: [
      'Asuransi Kesehatan Rawat Inap Eksekutif & Keluarga',
      'Dana Pensiun Lembaga Keuangan (DPLK) Perusahaan',
    ],
    defaultRevokedAllowances: [],
    systemRole: 'Regular Employee',
    defaultApprovalAuthorities: [],
    defaultAllocatedAssets: [
      'ID Card Karyawan Tetap (PKWTT) Permanen',
      'Polis Kartu Asuransi Kesehatan Keluarga',
    ],
    defaultReturnedAssets: [
      'ID Card Probation / Magang / Kontrak Lama',
    ],
  },
};

export const PersonaliaManagement: React.FC = () => {
  const {
    employees,
    personaliaLogs,
    processPersonaliaAction,
    currentTenant,
    currentUser,
    orgNodes,
    openFilePreview,
    complianceRecords,
    kpis,
    attendance,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'log' | 'pengaturan'>('log');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCustomPos, setIsCustomPos] = useState(false);

  // Master positions extracted directly from org chart structure nodes + existing employees
  const availablePositions = React.useMemo(() => {
    const set = new Set<string>();
    orgNodes?.forEach((n) => {
      if (n.title) set.add(n.title.trim());
    });
    employees?.forEach((e) => {
      if (e.position) set.add(e.position.trim());
    });
    return Array.from(set).sort();
  }, [orgNodes, employees]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Form State
  const [targetEmpId, setTargetEmpId] = useState(employees[0]?.id || '');
  const [actionType, setActionType] = useState<PersonaliaActionType>('Promosi');
  
  // Dynamic fields
  const [newPosition, setNewPosition] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newGrade, setNewGrade] = useState('L3');
  const [newSalary, setNewSalary] = useState<number>(10000000);
  const [newPositionAllowance, setNewPositionAllowance] = useState<number>(0);
  const [newFixedAllowance, setNewFixedAllowance] = useState<number>(0);
  const [newBranchLocation, setNewBranchLocation] = useState('Kantor Pusat Jakarta');
  const [contractDurationMonths, setContractDurationMonths] = useState<number>(12);
  const [contractEndDate, setContractEndDate] = useState('2027-10-31');
  const [actingRoleExpiryDate, setActingRoleExpiryDate] = useState('2027-04-30');
  const [permanentAppointmentDate, setPermanentAppointmentDate] = useState('2026-11-01');
  const [disciplinaryLevel, setDisciplinaryLevel] = useState<'SP 1' | 'SP 2' | 'SP 3' | 'Skorsing'>('SP 1');
  const [effectiveDate, setEffectiveDate] = useState('2026-11-01');
  const [reason, setReason] = useState('');
  const [skDocNumber, setSkDocNumber] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Systemic Impact Configuration States (Compensation Triggers, IT RBAC & Asset Provisioning)
  const [newAllowances, setNewAllowances] = useState<string[]>([
    'Tunjangan Jabatan Struktural',
    'Tunjangan Komunikasi & Pulsa',
  ]);
  const [revokedAllowances, setRevokedAllowances] = useState<string[]>([]);
  const [newSystemRole, setNewSystemRole] = useState<string>('Manager / Approver');
  const [approvalAuthorities, setApprovalAuthorities] = useState<string[]>([
    'Approval Cuti & Izin Kerja Tim (Level 1)',
    'Approval Lembur Karyawan (Overtime)',
    'Approval Reimbursement & Klaim Operasional (s/d Rp 10 Juta)',
    'Hak Akses Dashboard Analytics & KPI Divisi',
  ]);
  const [allocatedAssets, setAllocatedAssets] = useState<string[]>([
    'Laptop Performance Pro / Ultrabook',
    'Smartphone Korporat & Paket Komunikasi Bisnis',
  ]);
  const [returnedAssets, setReturnedAssets] = useState<string[]>([
    'Laptop Lama (Serah terima ke GA untuk Re-imaging & Inventarisasi)',
  ]);
  const [activeImpactTab, setActiveImpactTab] = useState<'compensation' | 'it_rbac' | 'assets'>('compensation');

  // Action Policies Configuration State (Per Jenis Aksi Personalia)
  const [actionPolicies, setActionPolicies] = useState<Record<string, ActionPolicyConfig>>(DEFAULT_ACTION_POLICIES);
  const [settingsActionKey, setSettingsActionKey] = useState<string>('Promosi');
  const [settingsSubTab, setSettingsSubTab] = useState<'policy_matrix' | 'general_rules'>('policy_matrix');
  const [policySaveFeedback, setPolicySaveFeedback] = useState<string | null>(null);
  const [newAllowanceInput, setNewAllowanceInput] = useState('');
  const [revokedAllowanceInput, setRevokedAllowanceInput] = useState('');
  const [newAssetInput, setNewAssetInput] = useState('');
  const [returnedAssetInput, setNewReturnedAssetInput] = useState('');
  const [newApprovalInput, setNewApprovalInput] = useState('');

  // Settings State
  const [promosiMinMonths, setPromosiMinMonths] = useState(12);
  const [requireDirectSupervisorApproval, setRequireDirectSupervisorApproval] = useState(true);
  const [requireDirectorSignature, setRequireDirectorSignature] = useState(true);
  const [autoGenerateSK, setAutoGenerateSK] = useState(true);

  const [isPreviewKelayakanOpen, setIsPreviewKelayakanOpen] = useState(false);
  const selectedTargetEmp = employees.find((e) => e.id === targetEmpId);

  // Target Employee Eligibility Analysis (Masa Kerja, SP, KPI, Presensi)
  const tenure = React.useMemo(() => {
    if (!selectedTargetEmp?.joinDate) {
      return { years: 0, months: 0, totalMonths: 0, label: '-', joinDateFormatted: '-' };
    }
    const join = new Date(selectedTargetEmp.joinDate);
    const now = new Date();
    if (isNaN(join.getTime())) {
      return { years: 0, months: 0, totalMonths: 0, label: '-', joinDateFormatted: '-' };
    }
    let totalMonths = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
    if (now.getDate() < join.getDate()) {
      totalMonths = Math.max(0, totalMonths - 1);
    }
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    let label = '';
    if (years > 0) label += `${years} Thn `;
    label += `${months} Bln`;
    if (totalMonths === 0) label = '< 1 Bulan';

    return {
      years,
      months,
      totalMonths,
      label,
      joinDateFormatted: selectedTargetEmp.joinDate,
      isPromosiEligible: totalMonths >= promosiMinMonths,
    };
  }, [selectedTargetEmp, promosiMinMonths]);

  const empComplianceRecords = React.useMemo(() => {
    if (!selectedTargetEmp) return [];
    return complianceRecords.filter((c) => c.employeeId === selectedTargetEmp.id);
  }, [complianceRecords, selectedTargetEmp]);

  const activeSanctions = React.useMemo(() => {
    return empComplianceRecords.filter((c) => c.status === 'Aktif');
  }, [empComplianceRecords]);

  const empKpiList = React.useMemo(() => {
    if (!selectedTargetEmp) return [];
    return kpis.filter((k) => k.employeeId === selectedTargetEmp.id);
  }, [kpis, selectedTargetEmp]);

  const latestKpi = empKpiList[0];

  const empAttendanceStats = React.useMemo(() => {
    if (!selectedTargetEmp) return { presentRate: 100, lateCount: 0, absentCount: 0, totalDays: 0 };
    const records = attendance.filter((a) => a.employeeId === selectedTargetEmp.id);
    if (records.length === 0) {
      return { presentRate: 98, lateCount: 0, absentCount: 0, totalDays: 0 };
    }
    const present = records.filter((a) => a.status === 'Hadir').length;
    const late = records.filter((a) => a.lateMinutes && a.lateMinutes > 0).length;
    const absent = records.filter((a) => a.status === 'Mangkir' || a.status === 'Alpha').length;
    const rate = Math.round((present / records.length) * 100);
    return { presentRate: rate, lateCount: late, absentCount: absent, totalDays: records.length };
  }, [attendance, selectedTargetEmp]);

  const empPastPersonalia = React.useMemo(() => {
    if (!selectedTargetEmp) return [];
    return personaliaLogs.filter((l) => l.employeeId === selectedTargetEmp.id);
  }, [personaliaLogs, selectedTargetEmp]);

  // Helper to generate official SK Document Number based on action type, effective date & tenant settings
  const generateSkNumber = (type: PersonaliaActionType | string, effDate: string) => {
    const seq = String(personaliaLogs.length + 1).padStart(3, '0');
    const dateObj = effDate ? new Date(effDate) : new Date();
    const month = isNaN(dateObj.getTime()) ? new Date().getMonth() + 1 : dateObj.getMonth() + 1;
    const roman = toRomanNumeral(month);
    const year = isNaN(dateObj.getTime()) ? new Date().getFullYear() : dateObj.getFullYear();

    let prefix = 'HRD-SK-PRO';
    if (type === 'Promosi') prefix = 'HRD-SK-PRO';
    else if (type === 'Demosi') prefix = 'HRD-SK-DEM';
    else if (type === 'Mutasi') prefix = 'HRD-SK-MUT';
    else if (type === 'Rotasi Cabang') prefix = 'HRD-SK-ROT';
    else if (type === 'Penyesuaian Gaji') prefix = 'HRD-SK-SAL';
    else if (type === 'Pengangkatan Tetap') prefix = 'DIR-SK-TETAP';
    else if (type === 'Perpanjangan Kontrak') prefix = 'ADD-PKWT';
    else if (type === 'Penetapan Plt') prefix = 'HRD-SK-PLT';
    else if (type === 'Sanksi Disiplin SP') prefix = 'HRD-SK-SP';

    return `${seq}/${prefix}/${currentTenant.code}/${roman}/${year}`;
  };

  // Helper to initialize flexible approval signatories
  const initDefaultSignatories = (emp?: Employee): PersonaliaSignatory[] => {
    const hrEmp = employees.find(
      (e) =>
        e.department.toLowerCase().includes('human') ||
        e.department.toLowerCase().includes('hr') ||
        e.fullName === currentUser?.name
    );
    const creatorName = currentUser?.name || hrEmp?.fullName || 'Aditya Pratama, S.Psi';
    const creatorRole = hrEmp?.position || 'HR Operations Officer';
    const creatorId = hrEmp?.id || '';
    const creatorNik = hrEmp?.nik || '';

    const mgrEmp = employees.find(
      (e) =>
        e.id !== emp?.id &&
        (e.position.includes('Head') || e.position.includes('Manager') || e.position.includes('Lead'))
    );
    const mgrName = mgrEmp?.fullName || 'Siti Rahmawati, M.M';
    const mgrRole = mgrEmp?.position || (emp?.department ? `Head of ${emp.department}` : 'Manager Divisi');
    const mgrId = mgrEmp?.id || '';
    const mgrNik = mgrEmp?.nik || '';

    const dirEmp = employees.find((e) => e.position.includes('Director') || e.position.includes('Direktur'));
    const dirName = dirEmp?.fullName || 'Ir. Budi Santoso, MBA';
    const dirRole = dirEmp?.position || 'President Director & CEO';
    const dirId = dirEmp?.id || '';
    const dirNik = dirEmp?.nik || '';

    return [
      { id: 'sig-1', label: 'Dibuat Oleh', employeeId: creatorId, nik: creatorNik, name: creatorName, role: creatorRole },
      { id: 'sig-2', label: 'Mengetahui', employeeId: mgrId, nik: mgrNik, name: mgrName, role: mgrRole },
      { id: 'sig-3', label: 'Menyetujui', employeeId: dirId, nik: dirNik, name: dirName, role: dirRole },
    ];
  };

  // Flexible Signatories State (Default: Dibuat Oleh, Mengetahui, Menyetujui)
  const [signatories, setSignatories] = useState<PersonaliaSignatory[]>(() =>
    initDefaultSignatories(selectedTargetEmp)
  );

  const handleAddSignatory = () => {
    setSignatories((prev) => [
      ...prev,
      {
        id: `sig-${Date.now()}`,
        label: prev.some((s) => s.label.toLowerCase().includes('menyetujui')) ? 'Disetujui Oleh' : 'Menyetujui',
        employeeId: '',
        name: '',
        role: '',
      },
    ]);
  };

  const handleRemoveSignatory = (idx: number) => {
    if (signatories.length <= 1) return;
    setSignatories((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateSignatory = (idx: number, field: keyof PersonaliaSignatory, val: string) => {
    setSignatories((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s))
    );
  };

  const handleSignatoryEmployeeSelect = (idx: number, empId: string) => {
    if (empId === '__manual__') {
      setSignatories((prev) =>
        prev.map((s, i) =>
          i === idx
            ? { ...s, employeeId: '__manual__', nik: undefined, name: '', role: '' }
            : s
        )
      );
      return;
    }
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setSignatories((prev) =>
        prev.map((s, i) =>
          i === idx
            ? {
                ...s,
                employeeId: emp.id,
                nik: emp.nik,
                name: emp.fullName,
                role: `${emp.position}${emp.department ? ' · ' + emp.department : ''}`,
              }
            : s
        )
      );
    }
  };

  const applySignatoryPreset = (preset: '3-tier' | '2-tier' | '1-tier') => {
    const base = initDefaultSignatories(selectedTargetEmp);
    if (preset === '3-tier') {
      setSignatories([
        { ...base[0], label: 'Dibuat Oleh' },
        { ...base[1], label: 'Mengetahui' },
        { ...base[2], label: 'Menyetujui' },
      ]);
    } else if (preset === '2-tier') {
      setSignatories([
        { ...base[0], label: 'Dibuat Oleh' },
        { ...base[2], label: 'Disetujui Oleh' },
      ]);
    } else if (preset === '1-tier') {
      setSignatories([
        { ...base[2], label: 'Ditetapkan Oleh' },
      ]);
    }
  };

  // Populate smart defaults based on employee selection and action type
  const syncFormDefaults = (emp: Employee | undefined, type: PersonaliaActionType) => {
    if (!emp) return;
    setNewPosition(emp.position);
    setNewDepartment(emp.department);
    setNewGrade(emp.grade || 'L3');
    setNewSalary(emp.basicSalary);
    setNewPositionAllowance(emp.positionAllowance || 0);
    setNewFixedAllowance(emp.fixedAllowance || 0);
    setNewBranchLocation(emp.branchLocation || 'Kantor Pusat Jakarta');

    // Auto-generate official SK number based on system rules
    setSkDocNumber(generateSkNumber(type, effectiveDate));

    // Dynamic Policy Integration from actionPolicies Settings
    const policy = actionPolicies[type];
    if (policy) {
      setReason(policy.defaultReason);
      setNewAllowances([...policy.defaultNewAllowances]);
      setRevokedAllowances([...policy.defaultRevokedAllowances]);
      setNewSystemRole(policy.systemRole);
      setApprovalAuthorities([...policy.defaultApprovalAuthorities]);
      setAllocatedAssets([...policy.defaultAllocatedAssets]);
      setReturnedAssets([...policy.defaultReturnedAssets]);

      if (type === 'Promosi') {
        const targetGrade = emp.grade === 'L3' ? 'L4' : emp.grade === 'L2' ? 'L3' : emp.grade === 'L4' ? 'M1' : 'M2';
        const scale = GRADE_SALARY_SCALES[targetGrade] || GRADE_SALARY_SCALES['L4'];
        const calculatedSalary = Math.max(Math.round(emp.basicSalary * (1 + (policy.salaryPercentChange || 25) / 100)), scale.minSalary);
        
        setNewPosition(emp.position.startsWith('Lead') ? `Head of ${emp.department}` : `Lead ${emp.position}`);
        setNewSalary(calculatedSalary);
        setNewPositionAllowance(scale.defaultPositionAllowance || 1500000);
        setNewGrade(targetGrade);
      } else if (type === 'Demosi') {
        const targetGrade = emp.grade === 'M1' ? 'L4' : emp.grade === 'L4' ? 'L3' : 'L2';
        const scale = GRADE_SALARY_SCALES[targetGrade] || GRADE_SALARY_SCALES['L2'];
        const calculatedSalary = Math.max(Math.round(emp.basicSalary * (1 + (policy.salaryPercentChange || -15) / 100)), scale.minSalary);
        
        setNewSalary(calculatedSalary);
        setNewGrade(targetGrade);
        setNewPositionAllowance(0);
      } else if (type === 'Mutasi') {
        const otherDept = emp.department === 'Engineering' ? 'Product & Design' : emp.department === 'Finance' ? 'Operations' : 'Human Capital';
        setNewDepartment(otherDept);
        setNewPosition(`Specialist ${otherDept}`);
      } else if (type === 'Rotasi Cabang') {
        setNewBranchLocation('Cabang Surabaya - Tech Hub');
        setNewFixedAllowance((emp.fixedAllowance || 0) + 2500000);
      } else if (type === 'Penyesuaian Gaji') {
        const scale = GRADE_SALARY_SCALES[emp.grade || 'L3'];
        const adjustedSalary = Math.max(Math.round(emp.basicSalary * 1.1), scale ? scale.minSalary : emp.basicSalary);
        setNewSalary(adjustedSalary);
      } else if (type === 'Pengangkatan Tetap') {
        setPermanentAppointmentDate('2026-11-01');
      } else if (type === 'Perpanjangan Kontrak') {
        setContractDurationMonths(12);
        setContractEndDate('2027-10-31');
      } else if (type === 'Penetapan Plt') {
        setNewPosition(`Plt. Head of ${emp.department}`);
        setActingRoleExpiryDate('2027-04-30');
        setNewPositionAllowance((emp.positionAllowance || 0) + 3000000);
      }
    }
  };

  const handleSelectEmployee = (id: string) => {
    setTargetEmpId(id);
    if (formError) setFormError(null);
    const emp = employees.find((e) => e.id === id);
    syncFormDefaults(emp, actionType);
  };

  const handleActionTypeChange = (newType: PersonaliaActionType) => {
    setActionType(newType);
    if (formError) setFormError(null);
    syncFormDefaults(selectedTargetEmp, newType);
  };

  const filteredLogs = personaliaLogs.filter((log) => {
    const emp = employees.find((e) => e.id === log.employeeId);
    const matchesSearch =
      (emp?.fullName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (emp?.nik || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (log?.letterNumber || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesType = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidationErrors(true);
    setFormError(null);

    if (!targetEmpId) {
      setFormError('Pilih karyawan target yang akan diproses personalia.');
      return;
    }
    if (!effectiveDate || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
      setFormError('Format tanggal efektif tidak valid (wajib YYYY-MM-DD).');
      return;
    }

    if (!newSalary || newSalary < (currentTenant.umr || 3000000)) {
      setFormError(`Gaji pokok tidak boleh lebih kecil dari standar UMR regional (${formatRupiah(currentTenant.umr)}).`);
      return;
    }

    if (actionType === 'Promosi' || actionType === 'Demosi' || actionType === 'Mutasi' || actionType === 'Penetapan Plt') {
      if (!newPosition.trim()) {
        setFormError('Nama jabatan baru / definitif wajib diisi.');
        return;
      }
    }

    if (actionType === 'Mutasi' && !newDepartment.trim()) {
      setFormError('Departemen tujuan mutasi wajib ditentukan.');
      return;
    }

    if (actionType === 'Perpanjangan Kontrak' && !contractEndDate) {
      setFormError('Tanggal akhir masa perpanjangan kontrak wajib diisi.');
      return;
    }

    // Validation for flexible signatories
    if (!signatories || signatories.length === 0) {
      setFormError('Minimal satu kolom penandatangan / approval wajib ditentukan.');
      return;
    }
    const emptySig = signatories.find((s) => !s.label.trim() || !s.name.trim());
    if (emptySig) {
      setFormError('Semua kolom penandatangan wajib dilengkapi keterangan dan nama pejabat.');
      return;
    }

    const currentScale = GRADE_SALARY_SCALES[newGrade];
    const systemicConfig: SystemicImpactConfig = {
      gradeScaleMin: currentScale?.minSalary,
      gradeScaleMax: currentScale?.maxSalary,
      newAllowances: newAllowances.map((a) => ({ name: a, amount: 0 })),
      revokedAllowances: revokedAllowances.map((r) => ({ name: r })),
      previousSystemRole: selectedTargetEmp?.role || 'Regular Employee',
      newSystemRole,
      approvalAuthorities,
      allocatedAssets,
      returnedAssets,
    };

    processPersonaliaAction({
      employeeId: targetEmpId,
      type: actionType,
      newPosition: newPosition.trim(),
      newDepartment: newDepartment.trim(),
      newGrade,
      newSalary: Number(newSalary),
      newPositionAllowance: Number(newPositionAllowance),
      newFixedAllowance: Number(newFixedAllowance),
      newBranchLocation,
      contractDurationMonths: Number(contractDurationMonths),
      contractEndDate,
      actingRoleExpiryDate,
      permanentAppointmentDate,
      disciplinaryLevel,
      reason: reason || `Penetapan tindakan personalia resmi: ${actionType}`,
      effectiveDate,
      skDocNumber: skDocNumber.trim(),
      notes: reason,
      signatories: signatories.map((s) => ({
        id: s.id,
        label: s.label.trim(),
        employeeId: s.employeeId,
        nik: s.nik,
        name: s.name.trim(),
        role: s.role?.trim() || '-',
      })),
      status: 'Menunggu Approval',
      systemicImpact: systemicConfig,
    });

    setIsModalOpen(false);
    setReason('');
    setShowValidationErrors(false);
  };

  const handleSaveDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!targetEmpId) {
      setFormError('Pilih karyawan target untuk menyimpan draft.');
      return;
    }

    const currentScale = GRADE_SALARY_SCALES[newGrade];
    const systemicConfig: SystemicImpactConfig = {
      gradeScaleMin: currentScale?.minSalary,
      gradeScaleMax: currentScale?.maxSalary,
      newAllowances: newAllowances.map((a) => ({ name: a, amount: 0 })),
      revokedAllowances: revokedAllowances.map((r) => ({ name: r })),
      previousSystemRole: selectedTargetEmp?.role || 'Regular Employee',
      newSystemRole,
      approvalAuthorities,
      allocatedAssets,
      returnedAssets,
    };

    processPersonaliaAction({
      employeeId: targetEmpId,
      type: actionType,
      newPosition: newPosition.trim(),
      newDepartment: newDepartment.trim(),
      newGrade,
      newSalary: Number(newSalary) || 0,
      newPositionAllowance: Number(newPositionAllowance) || 0,
      newFixedAllowance: Number(newFixedAllowance) || 0,
      newBranchLocation,
      contractDurationMonths: Number(contractDurationMonths) || 12,
      contractEndDate,
      actingRoleExpiryDate,
      permanentAppointmentDate,
      disciplinaryLevel,
      reason: reason || `(Draf) Pengajuan tindakan personalia: ${actionType}`,
      effectiveDate,
      skDocNumber: skDocNumber.trim(),
      notes: reason,
      signatories: signatories.map((s) => ({
        id: s.id,
        label: s.label.trim() || 'Approval',
        employeeId: s.employeeId,
        nik: s.nik,
        name: s.name.trim() || '-',
        role: s.role?.trim() || '-',
      })),
      status: 'Draf',
      systemicImpact: systemicConfig,
    });

    setIsModalOpen(false);
    setReason('');
    setShowValidationErrors(false);
  };

  // Helper to construct Systemic Impact Grid Matrix for Form & Document Preview
  const buildSystemicImpactData = (
    emp: Employee | undefined,
    pos: string,
    dept: string,
    grd: string,
    sal: number,
    allowancesNew: string[],
    allowancesRevoked: string[],
    roleSys: string,
    approvals: string[],
    assetsAlloc: string[],
    assetsReturn: string[]
  ) => {
    return [
      {
        category: '1. Jabatan & Unit Kerja',
        before: `${emp?.position || '-'} (${emp?.department || '-'})`,
        after: `${pos || emp?.position || '-'} (${dept || emp?.department || '-'})`,
        impact: `Penetapan struktur eselon & wewenang manajerial unit kerja baru`,
      },
      {
        category: '2. Skala Gaji & Grade Upah',
        before: `${emp?.grade || 'L3'} · ${formatRupiah(emp?.basicSalary || 0)}`,
        after: `${grd} · ${formatRupiah(sal)}`,
        impact:
          sal > (emp?.basicSalary || 0)
            ? `Kenaikan upah +${(((sal - (emp?.basicSalary || 1)) / (emp?.basicSalary || 1)) * 100).toFixed(1)}% (Sesuai Skala Upah Grade ${grd})`
            : sal < (emp?.basicSalary || 0)
            ? `Penyesuaian batas upah grade ${grd}`
            : `Gaji pokok ekuivalen (Grade ${grd})`,
      },
      {
        category: '3. Prerogatif Tunjangan',
        before: `Tunjangan aktif: ${formatRupiah((emp?.positionAllowance || 0) + (emp?.fixedAllowance || 0))}`,
        after: `Baru (+): ${allowancesNew.length > 0 ? allowancesNew.join(', ') : 'Standar fungsional'}`,
        impact:
          allowancesRevoked.length > 0
            ? `Otomatis Hangus (-): ${allowancesRevoked.join(', ')}`
            : `Tidak ada tunjangan terdahulu yang dihanguskan`,
      },
      {
        category: '4. Hak Akses Sistem',
        before: `Role: ${emp?.role || 'Regular Employee'}`,
        after: `Role Baru: ${roleSys}`,
        impact:
          approvals.length > 0
            ? `Wewenang Approval: ${approvals.join('; ')}`
            : `Akses operasional self-service ESS standar`,
      },
      {
        category: '5. Manajemen Fasilitas & Aset',
        before: `Aset lama: ${assetsReturn.length > 0 ? assetsReturn.join(', ') : 'Inventaris lama'}`,
        after: `Alokasi Baru: ${assetsAlloc.length > 0 ? assetsAlloc.join(', ') : 'Fasilitas standar'}`,
        impact: `Pemicu otomatis instruksi logistik ke Bagian Umum & GA`,
      },
    ];
  };

  const buildSkDiktumParagraphs = (
    action: string,
    emp: Employee | undefined,
    pos: string,
    dept: string,
    grd: string,
    sal: number,
    effDate: string,
    rsn: string,
    allowancesNew: string[],
    allowancesRevoked: string[],
    roleSys: string,
    approvals: string[],
    assetsAlloc: string[],
    isDraft: boolean
  ) => {
    return [
      isDraft
        ? `[DRAF SURAT KEPUTUSAN DIREKSI - BELUM BERKEKUATAN HUKUM]: Rancangan keputusan ini disusun berdasarkan usulan tindakan personalia internal dan menunggu pengesahan seluruh penandatangan berwenang.`
        : `Menimbang kebutuhan konsolidasi organisasi, evaluasi kinerja profesional, serta penataan jenjang karier berkelanjutan di lingkungan ${currentTenant.name}, Direksi dengan ini menetapkan Surat Keputusan tentang ${action.toUpperCase()} atas nama karyawan yang bersangkutan.`,
      `MEMUTUSKAN & MENETAPKAN:`,
      `PASAL 1 (KEDUDUKAN & JABATAN): Menetapkan ${emp?.fullName} (NIK: ${emp?.nik}) dalam kedudukan jabatan baru sebagai "${pos}" pada Departemen ${dept} dengan Grade ${grd}, terhitung efektif sejak tanggal ${effDate}.`,
      `PASAL 2 (SKALA UPAH & PREROGATIF TUNJANGAN): Karyawan diberikan gaji pokok sebesar ${formatRupiah(sal)} per bulan sesuai standar skala upah Grade ${grd}. Diberikan hak tunjangan baru meliputi: ${allowancesNew.length > 0 ? allowancesNew.join(', ') : 'tunjangan struktural fungsional'}.${allowancesRevoked.length > 0 ? ` Terhitung sejak tanggal berlakunya SK ini, hak atas tunjangan sebelumnya (${allowancesRevoked.join(', ')}) dinyatakan otomatis berakhir dan tidak berlaku lagi.` : ''}`,
      `PASAL 3 (HAK AKSES SISTEM & WEWENANG APPROVAL): Divisi IT & Digital System mengonfigurasi pembaruan hak akses akun sistem Enterprise HRMS karyawan menjadi "${roleSys}".${approvals.length > 0 ? ` Karyawan diberikan hak wewenang persetujuan (approval authority) atas: ${approvals.join(', ')}.` : ''}`,
      `PASAL 4 (INVENTARIS & FASILITAS ASET): Bagian Umum & Logistik (GA) mengalokasikan fasilitas kerja penunjang berupa: ${assetsAlloc.length > 0 ? assetsAlloc.join(', ') : 'perangkat kerja dinas standar'}. Karyawan diwajibkan menyelesaikan serah terima aset sebelumnya dalam batas waktu 7 (tujuh) hari kerja sejak tanggal efektif SK.`,
      `Dasar Pertimbangan Manajemen: "${rsn || 'Kebutuhan strategis penguatan struktur dan pencapaian target organisasi.'}".`,
    ];
  };

  const handlePreviewDraft = () => {
    const emp = employees.find((e) => e.id === targetEmpId);
    const empName = emp?.fullName || 'Karyawan Target';
    const empNik = emp?.nik || '-';
    const empDept = newDepartment || emp?.department || 'Operasional';

    const systemicGrid = buildSystemicImpactData(
      emp,
      newPosition || emp?.position || '-',
      empDept,
      newGrade,
      newSalary,
      newAllowances,
      revokedAllowances,
      newSystemRole,
      approvalAuthorities,
      allocatedAssets,
      returnedAssets
    );

    const paragraphs = buildSkDiktumParagraphs(
      actionType,
      emp,
      newPosition || emp?.position || '-',
      empDept,
      newGrade,
      newSalary,
      effectiveDate,
      reason,
      newAllowances,
      revokedAllowances,
      newSystemRole,
      approvalAuthorities,
      allocatedAssets,
      true
    );

    openFilePreview({
      title: `[DRAF] SURAT KEPUTUSAN DIREKSI: ${actionType.toUpperCase()}`,
      documentNumber: `${skDocNumber || generateSkNumber(actionType, effectiveDate)} [DRAF]`,
      typeBadge: `DRAF SK ${actionType}`,
      date: effectiveDate,
      partyName: empName,
      partyRole: `${newPosition || emp?.position || '-'} · Divisi ${empDept} (NIK: ${empNik})`,
      statusBadge: {
        label: 'DRAF SK - BELUM DISAHKAN',
        variant: 'warning',
      },
      detailsGrid: [
        { label: 'Nomor Draf Dokumen', value: `${skDocNumber || '-'} (DRAF)` },
        { label: 'Jenis Tindakan Personalia', value: actionType },
        { label: 'Nama Karyawan Target', value: empName },
        { label: 'Nomor Induk Karyawan (NIK)', value: empNik },
        { label: 'Jabatan Saat Ini', value: emp?.position || '-' },
        { label: 'Usulan Jabatan Baru', value: newPosition || emp?.position || '-' },
        { label: 'Divisi / Unit Kerja', value: empDept },
        { label: 'Lokasi Penempatan', value: newBranchLocation },
        { label: 'Grade Golongan Baru', value: `${newGrade} (${GRADE_SALARY_SCALES[newGrade]?.label || newGrade})` },
        ...(newSalary ? [
          { label: 'Usulan Gaji Pokok Baru', value: formatRupiah(newSalary) },
          { label: 'Gaji Pokok Sebelumnya', value: formatRupiah(emp?.basicSalary || 0) },
        ] : []),
        { label: 'Hak Akses Sistem', value: newSystemRole },
        { label: 'Rencana Tanggal Efektif', value: effectiveDate },
      ],
      contentParagraphs: paragraphs,
      systemicImpactGrid: systemicGrid,
      signatories: signatories.map((s) => ({
        id: s.id,
        label: s.label || 'Approval',
        employeeId: s.employeeId,
        nik: s.nik,
        name: s.name || '(Belum Ditentukan)',
        role: s.role || '-',
      })),
      signeeName: signatories[signatories.length - 1]?.name || 'Direktur Utama',
      signeeRole: signatories[signatories.length - 1]?.role || 'President Director & CEO',
    });
  };

  const handlePreviewSK = (log: PersonaliaLog | any) => {
    const emp = employees.find((e) => e.id === log.employeeId);
    const empName = emp?.fullName || 'Karyawan';
    const empNik = emp?.nik || 'KR-001';
    const empDept = log.newDepartment || emp?.department || 'Operasional';
    const isDraft = log.status === 'Draf';
    const isWaiting = log.status === 'Menunggu Approval';

    // Flexible multi-column signatories for the official document
    const docSignatories =
      log.signatories && log.signatories.length > 0
        ? log.signatories
        : [
            {
              label: 'Dibuat Oleh',
              name: currentUser?.name || 'Aditya Pratama, S.Psi',
              role: 'HR Operations Officer',
            },
            {
              label: 'Mengetahui',
              name: 'Siti Rahmawati, M.M',
              role: `Head of ${empDept}`,
            },
            {
              label: 'Menyetujui',
              name: log.approvedBy || 'Ir. Budi Santoso, MBA',
              role: 'President Director & CEO',
            },
          ];

    const logSysImpact = log.systemicImpact;
    const logNewAllowances = logSysImpact?.newAllowances?.map((a: any) => a.name) || [
      'Tunjangan Jabatan Struktural',
      'Tunjangan Komunikasi',
    ];
    const logRevokedAllowances = logSysImpact?.revokedAllowances?.map((r: any) => r.name) || [];
    const logSystemRole = logSysImpact?.newSystemRole || (log.newGrade?.startsWith('M') ? 'Manager / Approver' : 'Supervisor');
    const logApprovals = logSysImpact?.approvalAuthorities || [
      'Approval Cuti & Izin Kerja Tim (Level 1)',
      'Approval Lembur Karyawan (Overtime)',
    ];
    const logAllocatedAssets = logSysImpact?.allocatedAssets || [
      'Laptop Performance Pro Ultrabook',
      'Smartphone Korporat',
    ];
    const logReturnedAssets = logSysImpact?.returnedAssets || [
      'Laptop Lama (Serah terima inventaris GA)',
    ];

    const systemicGrid = buildSystemicImpactData(
      emp,
      log.newPosition,
      empDept,
      log.newGrade || 'L3',
      log.newSalary,
      logNewAllowances,
      logRevokedAllowances,
      logSystemRole,
      logApprovals,
      logAllocatedAssets,
      logReturnedAssets
    );

    const paragraphs = buildSkDiktumParagraphs(
      log.type,
      emp,
      log.newPosition,
      empDept,
      log.newGrade || 'L3',
      log.newSalary,
      log.effectiveDate,
      log.reason,
      logNewAllowances,
      logRevokedAllowances,
      logSystemRole,
      logApprovals,
      logAllocatedAssets,
      isDraft
    );

    openFilePreview({
      title: `${isDraft ? '[DRAF] ' : ''}SURAT KEPUTUSAN DIREKSI: ${log.type.toUpperCase()}`,
      documentNumber: `${log.letterNumber}${isDraft ? ' [DRAF]' : ''}`,
      typeBadge: isDraft ? `DRAF SK ${log.type}` : `SK ${log.type}`,
      date: log.effectiveDate,
      partyName: empName,
      partyRole: `${log.newPosition} · Divisi ${empDept} (NIK: ${empNik})`,
      statusBadge: isDraft
        ? {
            label: 'DRAF SK - BELUM DISAHKAN',
            variant: 'warning',
          }
        : isWaiting
        ? {
            label: 'Menunggu Approval Direksi',
            variant: 'info',
          }
        : {
            label: 'Terverifikasi Sah Direksi',
            variant: 'success',
          },
      detailsGrid: [
        { label: 'Nomor Dokumen SK Resmi', value: log.letterNumber },
        { label: 'Jenis Tindakan Personalia', value: log.type },
        { label: 'Nama Karyawan', value: empName },
        { label: 'Nomor Induk Karyawan (NIK)', value: empNik },
        { label: 'Jabatan Sebelumnya', value: log.previousPosition || '-' },
        { label: 'Jabatan Baru Ditetapkan', value: log.newPosition },
        { label: 'Divisi / Unit Kerja', value: empDept },
        { label: 'Lokasi Penempatan Kerja', value: log.newBranchLocation || emp?.branchLocation || 'Kantor Pusat' },
        { label: 'Grade Golongan Baru', value: log.newGrade || '-' },
        ...(log.newSalary ? [
          { label: 'Gaji Pokok Baru Disepakati', value: formatRupiah(log.newSalary) },
          { label: 'Gaji Pokok Sebelumnya', value: formatRupiah(log.previousSalary) },
        ] : []),
        { label: 'Hak Akses Sistem', value: logSystemRole },
        { label: 'Tanggal Efektif Berlaku', value: log.effectiveDate },
      ],
      contentParagraphs: paragraphs,
      systemicImpactGrid: systemicGrid,
      signatories: docSignatories,
      signeeName: log.approvedBy || docSignatories[docSignatories.length - 1]?.name || 'Ir. Budi Santoso',
      signeeRole: docSignatories[docSignatories.length - 1]?.role || 'President Director & CEO',
    });
  };

  const renderBadge = (type: string) => {
    switch (type) {
      case 'Promosi':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
            <ArrowUpRight className="w-3 h-3" /> Promosi Jabatan
          </span>
        );
      case 'Demosi':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
            <ArrowDownRight className="w-3 h-3" /> Demosi
          </span>
        );
      case 'Mutasi':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
            <Repeat className="w-3 h-3" /> Mutasi Divisi
          </span>
        );
      case 'Rotasi Cabang':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">
            <MapPin className="w-3 h-3" /> Rotasi Cabang
          </span>
        );
      case 'Penyesuaian Gaji':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
            <DollarSign className="w-3 h-3" /> Kenaikan Gaji
          </span>
        );
      case 'Pengangkatan Tetap':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800">
            <UserCheck className="w-3 h-3" /> Pengangkatan Tetap (PKWTT)
          </span>
        );
      case 'Perpanjangan Kontrak':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> Addendum PKWT
          </span>
        );
      case 'Penetapan Plt':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-100 text-cyan-800">
            <Briefcase className="w-3 h-3" /> Pejabat Sementara (Plt)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
            <FileBadge className="w-3 h-3" /> {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Header Title & Main CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>Tindakan Personalia & Pergerakan Karier Karyawan</span>
          </h2>
          <p className="text-xs text-slate-500">
            Modul resmi pengelolaan Promosi, Demosi, Mutasi, Rotasi Cabang, Pengangkatan PKWTT, Addendum Kontrak, Plt, dan Sanksi Disiplin berlandaskan UU Ketenagakerjaan & PP 35/2021.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDocModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dokumen SK & Tindakan</span>
          </button>
          <button
            onClick={() => {
              syncFormDefaults(selectedTargetEmp, actionType);
              setSignatories(initDefaultSignatories(selectedTargetEmp));
              setSkDocNumber(generateSkNumber(actionType, effectiveDate));
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Tindakan Personalia</span>
          </button>
        </div>
      </div>

      {/* Row 2: Enterprise Tab Navigation Bar */}
      <div className="border-b border-slate-200 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar pt-1">
        <button
          onClick={() => setActiveTab('log')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'log'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Riwayat SK & Keputusan Personalia</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'log'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {personaliaLogs.length} SK
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pengaturan')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'pengaturan'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Aturan & Kebijakan Personalia</span>
        </button>
      </div>

      {activeTab === 'log' && (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">Promosi & Tetap</span>
                <span className="text-lg font-bold font-mono text-emerald-700">
                  {personaliaLogs.filter((l) => l.type === 'Promosi' || l.type === 'Pengangkatan Tetap').length}
                </span>
                <span className="text-[10px] text-slate-400 block">Karier & status tetap</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">Mutasi & Rotasi</span>
                <span className="text-lg font-bold font-mono text-indigo-700">
                  {personaliaLogs.filter((l) => l.type === 'Mutasi' || l.type === 'Rotasi Cabang').length}
                </span>
                <span className="text-[10px] text-slate-400 block">Perpindahan fungsi/site</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Repeat className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">Penyesuaian Gaji</span>
                <span className="text-lg font-bold font-mono text-blue-700">
                  {personaliaLogs.filter((l) => l.type === 'Penyesuaian Gaji').length}
                </span>
                <span className="text-[10px] text-slate-400 block">Kenaikan merit berkala</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">Addendum & Lainnya</span>
                <span className="text-lg font-bold font-mono text-amber-700">
                  {personaliaLogs.filter((l) => l.type === 'Perpanjangan Kontrak' || l.type === 'Penetapan Plt' || l.type === 'Demosi').length}
                </span>
                <span className="text-[10px] text-slate-400 block">PKWT & penugasan</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Filters & Search Toolbar - Responsive Tablet & Mobile Friendly */}
          <div className="bg-white p-3 sm:p-3.5 border border-slate-200 rounded-xl shadow-xs space-y-2.5 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
            <div className="relative w-full lg:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama karyawan, NIK, atau nomor SK..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50/70 focus:bg-white border border-slate-300 focus:border-indigo-500 rounded-lg outline-none transition-all placeholder:text-slate-400 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <div className="relative w-full sm:w-80 lg:w-80">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg py-2 px-3 bg-white font-medium text-slate-700 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="all">Semua Jenis Tindakan Personalia (8 Jenis)</option>
                  <option value="Promosi">Promosi Jabatan / Grade</option>
                  <option value="Demosi">Demosi Jabatan</option>
                  <option value="Mutasi">Mutasi Antar Departemen</option>
                  <option value="Rotasi Cabang">Rotasi Cabang / Site</option>
                  <option value="Penyesuaian Gaji">Penyesuaian Gaji Pokok</option>
                  <option value="Pengangkatan Tetap">Pengangkatan Karyawan Tetap (PKWTT)</option>
                  <option value="Perpanjangan Kontrak">Perpanjangan Kontrak (PKWT)</option>
                  <option value="Penetapan Plt">Penetapan Pejabat Sementara (Plt)</option>
                </select>
              </div>

              {(filterType !== 'all' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterType('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1 shadow-2xs shrink-0"
                  title="Reset filter"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden space-y-3">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => {
                const emp = employees.find((e) => e.id === log.employeeId);
                return (
                  <div
                    key={log.id}
                    onClick={() => handlePreviewSK(log)}
                    className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-xs space-y-3 cursor-pointer active:scale-[0.99] transition-all group"
                    title="Klik kartu untuk membaca Surat Keputusan (SK) resmi"
                  >
                    {/* Header: Employee & Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {emp?.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={emp.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                            {(emp?.fullName || 'KR')[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{emp?.fullName || 'Karyawan'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{emp?.nik} · {emp?.department}</div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
                        {log.status === 'Draf' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <FileText className="w-2.5 h-2.5" /> Draf
                          </span>
                        )}
                        {log.status === 'Menunggu Approval' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            <Clock className="w-2.5 h-2.5" /> Menunggu
                          </span>
                        )}
                        {renderBadge(log.type)}
                      </div>
                    </div>

                    {/* Position Change */}
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Perubahan Posisi / Jabatan</span>
                      {log.previousPosition !== log.newPosition ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-400 line-through text-[11px]">{log.previousPosition}</span>
                          <span className="text-indigo-600 font-bold">→</span>
                          <span className="font-bold text-slate-900 text-xs">{log.newPosition}</span>
                        </div>
                      ) : (
                        <div className="font-bold text-slate-900 text-xs">{log.newPosition}</div>
                      )}
                      {log.newDepartment && log.newDepartment !== log.previousDepartment && (
                        <div className="text-[10px] text-indigo-600 font-medium">Divisi Baru: {log.newDepartment}</div>
                      )}
                      {log.newBranchLocation && (
                        <div className="text-[10px] text-purple-600 font-medium">Lokasi: {log.newBranchLocation}</div>
                      )}
                    </div>

                    {/* Salary & Effective Date Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Gaji Pokok Baru:</span>
                        {log.newSalary ? (
                          <div>
                            <span className="font-mono font-bold text-slate-900">{formatRupiah(log.newSalary)}</span>
                            {log.newSalary > log.previousSalary && (
                              <span className="text-[10px] text-emerald-600 font-semibold block">
                                +{formatRupiah(log.newSalary - log.previousSalary)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Tanggal Efektif:</span>
                        <span className="font-mono font-semibold text-slate-800 text-[11px]">{log.effectiveDate}</span>
                        <div className="text-[10px] text-indigo-700 font-mono truncate mt-0.5">{log.letterNumber}</div>
                      </div>
                    </div>

                    {/* Signatories Flow Summary */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-100 text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1 font-medium">
                        <Users className="w-2.5 h-2.5 text-slate-400" />
                        <span>Approval:</span>
                      </span>
                      {(log.signatories && log.signatories.length > 0
                        ? log.signatories
                        : [
                            { label: 'Dibuat Oleh', name: 'HR Staff' },
                            { label: 'Mengetahui', name: 'Manager' },
                            { label: 'Menyetujui', name: log.approvedBy || 'Direktur' },
                          ]
                      ).map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 text-[10px]"
                        >
                          <strong className="text-slate-800">{s.label}:</strong> {s.name.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                Belum ada riwayat tindakan personalia yang sesuai filter.
              </div>
            )}
          </div>

          {/* TAMPILAN DESKTOP & TABLET: Menyesuaikan kolom secara responsif tanpa slide horizontal pada tablet */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Karyawan</th>
                    <th className="py-2.5 px-3 font-semibold">Jenis Tindakan</th>
                    <th className="py-2.5 px-3 font-semibold">Perubahan Jabatan / Posisi</th>
                    <th className="py-2.5 px-3 font-semibold text-right hidden lg:table-cell">Remunerasi Pokok</th>
                    <th className="py-2.5 px-3 font-semibold hidden xl:table-cell">Tanggal Efektif</th>
                    <th className="py-2.5 px-3 font-semibold hidden xl:table-cell">Nomor SK Resmi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => {
                      const emp = employees.find((e) => e.id === log.employeeId);
                      return (
                        <tr
                          key={log.id}
                          onClick={() => handlePreviewSK(log)}
                          className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                          title="Klik baris untuk membaca Surat Keputusan (SK) resmi"
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              {emp?.avatar ? (
                                <img
                                  src={emp.avatar}
                                  alt={emp.fullName}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                                  {(emp?.fullName || 'KR')[0]}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-slate-900">{emp?.fullName || 'Karyawan'}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{emp?.nik} · {emp?.department}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {renderBadge(log.type)}
                              {log.status === 'Draf' && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <FileText className="w-2.5 h-2.5" /> Draf
                                </span>
                              )}
                              {log.status === 'Menunggu Approval' && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                  <Clock className="w-2.5 h-2.5" /> Menunggu
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {log.previousPosition !== log.newPosition ? (
                              <div>
                                <div className="text-slate-400 line-through text-[10px]">{log.previousPosition}</div>
                                <div className="font-semibold text-slate-900 flex items-center gap-1">
                                  <span>→</span>
                                  <span>{log.newPosition}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="font-semibold text-slate-900">{log.newPosition}</div>
                            )}
                            {log.newDepartment && log.newDepartment !== log.previousDepartment && (
                              <span className="text-[10px] text-indigo-600 block">Divisi: {log.newDepartment}</span>
                            )}
                            {log.newBranchLocation && (
                              <span className="text-[10px] text-purple-600 block">Lokasi: {log.newBranchLocation}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right hidden lg:table-cell">
                            {log.newSalary ? (
                              <>
                                <div className="text-slate-400 line-through text-[10px]">
                                  {formatRupiah(log.previousSalary)}
                                </div>
                                <div className="font-mono font-bold text-slate-900">
                                  {formatRupiah(log.newSalary)}
                                </div>
                                {log.newSalary > log.previousSalary && (
                                  <span className="text-[10px] text-emerald-600 font-medium">
                                    +{formatRupiah(log.newSalary - log.previousSalary)}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-mono text-[11px] hidden xl:table-cell">
                            {log.effectiveDate}
                          </td>
                          <td className="py-2.5 px-3 hidden xl:table-cell">
                            <span className="font-mono text-indigo-700 font-medium bg-slate-100 px-2 py-0.5 rounded text-[10px] block truncate">
                              {log.letterNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 truncate flex items-center gap-1">
                              <Users className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {log.signatories && log.signatories.length > 0
                                  ? log.signatories.map((s) => s.label).join(' · ')
                                  : 'Dibuat · Mengetahui · Menyetujui'}
                              </span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada riwayat tindakan personalia yang sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Settings Tab */}
      {activeTab === 'pengaturan' && (
        <div className="space-y-5 max-w-5xl">
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <span>Pengaturan Matriks Transisi & Kebijakan Personalia</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi aturan baku skala kompensasi, hak akses sistem, serta logistik aset per jenis aksi personalia resmi.
              </p>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setSettingsSubTab('policy_matrix')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  settingsSubTab === 'policy_matrix'
                    ? 'bg-white text-indigo-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Matriks Transisi Per Jenis Aksi
              </button>
              <button
                type="button"
                onClick={() => setSettingsSubTab('general_rules')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  settingsSubTab === 'general_rules'
                    ? 'bg-white text-indigo-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kebijakan Umum & SK
              </button>
            </div>
          </div>

          {/* Feedback Banner */}
          {policySaveFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{policySaveFeedback}</span>
              </div>
              <button
                type="button"
                onClick={() => setPolicySaveFeedback(null)}
                className="text-emerald-600 hover:text-emerald-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* SUBTAB 1: Matriks Transisi Dampak Sistemik Per Jenis Aksi Personalia */}
          {settingsSubTab === 'policy_matrix' && (
            <div className="space-y-4">
              {/* Action Types Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { key: 'Promosi', label: 'Promosi', icon: TrendingUp },
                  { key: 'Mutasi', label: 'Mutasi / Transfer', icon: Repeat },
                  { key: 'Demosi', label: 'Demosi', icon: ArrowDownRight },
                  { key: 'Penetapan Plt', label: 'Penugasan Sementara / Plt', icon: Clock },
                  { key: 'Pengangkatan Tetap', label: 'Perubahan Status (PKWT → Tetap)', icon: Award },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = settingsActionKey === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setSettingsActionKey(item.key);
                        setPolicySaveFeedback(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Policy Editor Card for Selected Action */}
              {actionPolicies[settingsActionKey] && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
                  {/* Action Banner Title */}
                  <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${actionPolicies[settingsActionKey].badgeColor}`}>
                          {actionPolicies[settingsActionKey].actionType}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {actionPolicies[settingsActionKey].title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {actionPolicies[settingsActionKey].description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const def = DEFAULT_ACTION_POLICIES[settingsActionKey];
                          if (def) {
                            setActionPolicies((prev) => ({ ...prev, [settingsActionKey]: { ...def } }));
                            setPolicySaveFeedback(`Aturan kebijakan ${settingsActionKey} telah direset ke standar bawaan.`);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        Reset Standar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPolicySaveFeedback(`Konfigurasi Matriks Transisi untuk ${actionPolicies[settingsActionKey].title} berhasil disimpan dan langsung aktif pada formulir pengajuan SK.`);
                        }}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Simpan Pengaturan</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. Alasan / Konsideran Standar SK */}
                  <div>
                    <label className="font-bold text-slate-800 block text-xs mb-1">
                      Template Alasan / Diktum Konsideran Dokumen SK *
                    </label>
                    <textarea
                      rows={2}
                      value={actionPolicies[settingsActionKey].defaultReason}
                      onChange={(e) => {
                        const val = e.target.value;
                        setActionPolicies((prev) => ({
                          ...prev,
                          [settingsActionKey]: { ...prev[settingsActionKey], defaultReason: val },
                        }));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:border-indigo-500 bg-white"
                      placeholder="Masukkan template narasi alasan pertimbangan keputusan..."
                    />
                  </div>

                  {/* 3 Parameter Grids */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Grid 1: Kompensasi & Skala Gaji */}
                    <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-xs">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span>1. Skala Upah & Tunjangan</span>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block text-[11px] mb-1">
                          Penyesuaian Gaji Pokok (%)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={actionPolicies[settingsActionKey].salaryPercentChange}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setActionPolicies((prev) => ({
                                ...prev,
                                [settingsActionKey]: { ...prev[settingsActionKey], salaryPercentChange: val },
                              }));
                            }}
                            className="w-24 px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono font-bold bg-white"
                          />
                          <span className="text-[11px] text-slate-500 font-medium">% kenaikan/penurunan</span>
                        </div>
                      </div>

                      {/* Tunjangan Baru yang Diaktifkan */}
                      <div>
                        <label className="font-semibold text-slate-700 block text-[11px] mb-1">
                          Tunjangan Baru yang Diaktifkan (+)
                        </label>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {actionPolicies[settingsActionKey].defaultNewAllowances.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionPolicies((prev) => ({
                                    ...prev,
                                    [settingsActionKey]: {
                                      ...prev[settingsActionKey],
                                      defaultNewAllowances: prev[settingsActionKey].defaultNewAllowances.filter((_, i) => i !== idx),
                                    },
                                  }));
                                }}
                                className="text-emerald-600 hover:text-rose-600"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Tambah tunjangan baru..."
                            value={newAllowanceInput}
                            onChange={(e) => setNewAllowanceInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newAllowanceInput.trim()) {
                                e.preventDefault();
                                setActionPolicies((prev) => ({
                                  ...prev,
                                  [settingsActionKey]: {
                                    ...prev[settingsActionKey],
                                    defaultNewAllowances: [...prev[settingsActionKey].defaultNewAllowances, newAllowanceInput.trim()],
                                  },
                                }));
                                setNewAllowanceInput('');
                              }
                            }}
                            className="flex-1 px-2.5 py-1 text-[11px] border border-slate-300 rounded bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newAllowanceInput.trim()) {
                                setActionPolicies((prev) => ({
                                  ...prev,
                                  [settingsActionKey]: {
                                    ...prev[settingsActionKey],
                                    defaultNewAllowances: [...prev[settingsActionKey].defaultNewAllowances, newAllowanceInput.trim()],
                                  },
                                }));
                                setNewAllowanceInput('');
                              }
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Tunjangan yang Dihanguskan / Dicabut */}
                      <div>
                        <label className="font-semibold text-slate-700 block text-[11px] mb-1">
                          Tunjangan yang Dihanguskan (-)
                        </label>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {actionPolicies[settingsActionKey].defaultRevokedAllowances.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionPolicies((prev) => ({
                                    ...prev,
                                    [settingsActionKey]: {
                                      ...prev[settingsActionKey],
                                      defaultRevokedAllowances: prev[settingsActionKey].defaultRevokedAllowances.filter((_, i) => i !== idx),
                                    },
                                  }));
                                }}
                                className="text-rose-600 hover:text-rose-900"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Tambah tunjangan hangus..."
                            value={revokedAllowanceInput}
                            onChange={(e) => setRevokedAllowanceInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && revokedAllowanceInput.trim()) {
                                e.preventDefault();
                                setActionPolicies((prev) => ({
                                  ...prev,
                                  [settingsActionKey]: {
                                    ...prev[settingsActionKey],
                                    defaultRevokedAllowances: [...prev[settingsActionKey].defaultRevokedAllowances, revokedAllowanceInput.trim()],
                                  },
                                }));
                                setNewRevokedAllowanceInput('');
                              }
                            }}
                            className="flex-1 px-2.5 py-1 text-[11px] border border-slate-300 rounded bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (revokedAllowanceInput.trim()) {
                                setActionPolicies((prev) => ({
                                  ...prev,
                                  [settingsActionKey]: {
                                    ...prev[settingsActionKey],
                                    defaultRevokedAllowances: [...prev[settingsActionKey].defaultRevokedAllowances, revokedAllowanceInput.trim()],
                                  },
                                }));
                                setRevokedAllowanceInput('');
                              }
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Grid 2: Hak Akses Sistem */}
                    <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-xs">
                        <Key className="w-4 h-4 text-indigo-600" />
                        <span>2. Hak Akses Sistem</span>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block text-[11px] mb-1">
                          Role Akses Akun Sistem Baru *
                        </label>
                        <select
                          value={actionPolicies[settingsActionKey].systemRole}
                          onChange={(e) => {
                            const val = e.target.value;
                            setActionPolicies((prev) => ({
                              ...prev,
                              [settingsActionKey]: { ...prev[settingsActionKey], systemRole: val },
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-indigo-950 bg-white"
                        >
                          <option value="Regular Employee">Regular Employee (Self-Service ESS)</option>
                          <option value="Supervisor">Supervisor (Approver Tim Level 1)</option>
                          <option value="Unit Manager">Unit Manager (Approver Operasional)</option>
                          <option value="Department Head">Department Head (Kepala Departemen)</option>
                          <option value="Director">Director (Direksi / Pimpinan Tertinggi)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block text-[11px] mb-1">
                          Wewenang Approval Otomatis
                        </label>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {actionPolicies[settingsActionKey].defaultApprovalAuthorities.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionPolicies((prev) => ({
                                    ...prev,
                                    [settingsActionKey]: {
                                      ...prev[settingsActionKey],
                                      defaultApprovalAuthorities: prev[settingsActionKey].defaultApprovalAuthorities.filter((_, i) => i !== idx),
                                    },
                                  }));
                                }}
                                className="text-indigo-600 hover:text-rose-600"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Tambah wewenang approval..."
                            value={newApprovalInput}
                            onChange={(e) => setNewApprovalInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newApprovalInput.trim()) {
                                e.preventDefault();
                                setActionPolicies((prev) => ({
                                  ...prev,
                                  [settingsActionKey]: {
                                    ...prev[settingsActionKey],
                                    defaultApprovalAuthorities: [...prev[settingsActionKey].defaultApprovalAuthorities, newApprovalInput.trim()],
                                  },
                                }));
                                setNewApprovalInput('');
                              }
                            }}
                            className="flex-1 px-2.5 py-1 text-[11px] border border-slate-300 rounded bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newApprovalInput.trim()) {
                                setActionPolicies((prev) => ({
                                  ...prev,
                                  [settingsActionKey]: {
                                    ...prev[settingsActionKey],
                                    defaultApprovalAuthorities: [...prev[settingsActionKey].defaultApprovalAuthorities, newApprovalInput.trim()],
                                  },
                                }));
                                setNewApprovalInput('');
                              }
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Grid 3: Fasilitas & Manajemen Aset */}
                    <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-xs">
                        <Laptop className="w-4 h-4 text-amber-600" />
                        <span>3. Fasilitas & Aset Logistik</span>
                      </div>

                      {/* Alokasi Aset Baru */}
                      <div>
                        <label className="font-semibold text-slate-700 block text-[11px] mb-1">
                          Alokasi Aset Baru (GA Provisioning)
                        </label>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {actionPolicies[settingsActionKey].defaultAllocatedAssets.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionPolicies((prev) => ({
                                    ...prev,
                                    [settingsActionKey]: {
                                      ...prev[settingsActionKey],
                                      defaultAllocatedAssets: prev[settingsActionKey].defaultAllocatedAssets.filter((_, i) => i !== idx),
                                    },
                                  }));
                                }}
                                className="text-amber-600 hover:text-rose-600"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Tambah alokasi aset baru..."
                            value={newAssetInput}
                            onChange={(e) => setNewAssetInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newAssetInput.trim()) {
                                e.preventDefault();
                                setActionPolicies((prev) => ({
                                  ...prev,
                                  [settingsActionKey]: {
                                    ...prev[settingsActionKey],
                                    defaultAllocatedAssets: [...prev[settingsActionKey].defaultAllocatedAssets, newAssetInput.trim()],
                                  },
                                }));
                                setNewAssetInput('');
                              }
                            }}
                            className="flex-1 px-2.5 py-1 text-[11px] border border-slate-300 rounded bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newAssetInput.trim()) {
                                setActionPolicies((prev) => ({
                                  ...prev,
                                  [settingsActionKey]: {
                                    ...prev[settingsActionKey],
                                    defaultAllocatedAssets: [...prev[settingsActionKey].defaultAllocatedAssets, newAssetInput.trim()],
                                  },
                                }));
                                setNewAssetInput('');
                              }
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Instruksi Pengembalian Aset Lama */}
                      <div>
                        <label className="font-semibold text-slate-700 block text-[11px] mb-1">
                          Aset Lama Wajib Dikembalikan (GA Return)
                        </label>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {actionPolicies[settingsActionKey].defaultReturnedAssets.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionPolicies((prev) => ({
                                    ...prev,
                                    [settingsActionKey]: {
                                      ...prev[settingsActionKey],
                                      defaultReturnedAssets: prev[settingsActionKey].defaultReturnedAssets.filter((_, i) => i !== idx),
                                    },
                                  }));
                                }}
                                className="text-slate-500 hover:text-rose-600"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Tambah instruksi aset kembali..."
                            value={returnedAssetInput}
                            onChange={(e) => setNewReturnedAssetInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && returnedAssetInput.trim()) {
                                e.preventDefault();
                                setActionPolicies((prev) => ({
                                  ...prev,
                                  [settingsActionKey]: {
                                    ...prev[settingsActionKey],
                                    defaultReturnedAssets: [...prev[settingsActionKey].defaultReturnedAssets, returnedAssetInput.trim()],
                                  },
                                }));
                                setNewReturnedAssetInput('');
                              }
                            }}
                            className="flex-1 px-2.5 py-1 text-[11px] border border-slate-300 rounded bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (returnedAssetInput.trim()) {
                                setActionPolicies((prev) => ({
                                  ...prev,
                                  [settingsActionKey]: {
                                    ...prev[settingsActionKey],
                                    defaultReturnedAssets: [...prev[settingsActionKey].defaultReturnedAssets, returnedAssetInput.trim()],
                                  },
                                }));
                                setNewReturnedAssetInput('');
                              }
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 2: Kebijakan Umum & SK */}
          {settingsSubTab === 'general_rules' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <label className="font-semibold text-slate-800 block">
                  Masa Kerja Minimal Sebelum Promosi (Bulan)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={promosiMinMonths}
                    onChange={(e) => setPromosiMinMonths(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
                  />
                  <span className="text-slate-500">Bulan sejak tanggal bergabung (Join Date)</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      Wajib Approval Atasan Langsung & Kepala Divisi
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Pengajuan promosi atau mutasi harus diverifikasi terlebih dahulu sebelum diterbitkan SK oleh Direksi
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireDirectSupervisorApproval}
                    onChange={(e) => setRequireDirectSupervisorApproval(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      Tanda Tangan Direksi pada SK Resmi
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Sertakan nama Direktur Utama / VP Human Capital dalam QR Code tanda tangan digital
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireDirectorSignature}
                    onChange={(e) => setRequireDirectorSignature(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      Otomatisasi Penomoran Dokumen SK & Integrasi Arsip
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Setiap tindakan langsung mencatat berkas di menu Dokumen Legal Perusahaan
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoGenerateSK}
                    onChange={(e) => setAutoGenerateSK(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Form Isian Dinamis Tindakan Personalia */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
              setShowValidationErrors(false);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileBadge className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold">Pengajuan Tindakan Personalia Resmi</h3>
                  <span className="text-[11px] text-slate-400">
                    Penerbitan Surat Keputusan (SK) dan sinkronisasi profil master karyawan
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setShowValidationErrors(false);
                }}
              >
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Employee Picker */}
              <div>
                <EmployeeSelect
                  label="Pilih Karyawan Target *"
                  required
                  employees={employees}
                  value={targetEmpId}
                  onChange={handleSelectEmployee}
                />

                {/* Inline Preview Bar: Masa Kerja, SP, KPI, Status Kontrak */}
                {selectedTargetEmp && (
                  <div className="mt-2.5 p-3 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border border-slate-200 hover:border-indigo-300 rounded-xl space-y-2.5 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          <span>Pratinjau Kelayakan: {selectedTargetEmp.fullName}</span>
                        </span>
                        {activeSanctions.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5" /> Ada {activeSanctions.length} SP Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle className="w-2.5 h-2.5" /> Bebas Sanksi SP
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsPreviewKelayakanOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-400 rounded-lg text-xs font-bold shadow-2xs transition-colors shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Buka Analisis Kelayakan Lengkap</span>
                      </button>
                    </div>

                    {/* Quick 4-box metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {/* 1. Masa Kerja */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-medium">Masa Kerja</span>
                        <div className="font-bold text-slate-900 text-xs mt-0.5 flex items-center gap-1">
                          <span>{tenure.label}</span>
                          {tenure.isPromosiEligible ? (
                            <span className="text-[9px] text-emerald-600 font-semibold" title="Memenuhi masa kerja minimal promosi">✓</span>
                          ) : (
                            <span className="text-[9px] text-amber-600 font-semibold" title={`Belum memenuhi batas minimal ${promosiMinMonths} bulan`}>(&lt; {promosiMinMonths} Bln)</span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 block font-mono truncate">Join: {tenure.joinDateFormatted}</span>
                      </div>

                      {/* 2. Surat Peringatan */}
                      <div className={`p-2.5 rounded-lg border shadow-2xs ${
                        activeSanctions.length > 0
                          ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                          : 'bg-white border-slate-200/80 text-slate-900'
                      }`}>
                        <span className="text-[10px] text-slate-400 block font-medium">Surat Peringatan (SP)</span>
                        <div className="font-bold text-xs mt-0.5">
                          {activeSanctions.length > 0 ? (
                            <span className="text-rose-600 font-bold">{activeSanctions[0].level} Aktif</span>
                          ) : (
                            <span className="text-emerald-700 font-bold">0 SP Aktif</span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 block truncate">
                          {activeSanctions.length > 0 ? `Hingga ${activeSanctions[0].validUntil}` : `Total riwayat: ${empComplianceRecords.length} SP`}
                        </span>
                      </div>

                      {/* 3. KPI Kinerja */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-medium">Kinerja / KPI Terakhir</span>
                        <div className="font-bold text-slate-900 text-xs mt-0.5">
                          {latestKpi ? `${latestKpi.score}% (${latestKpi.rating || 'Baik'})` : '92% (Rating A)'}
                        </div>
                        <span className="text-[9px] text-slate-400 block truncate">
                          {latestKpi?.period || 'Semester Berjalan'}
                        </span>
                      </div>

                      {/* 4. Status Kontrak & Grade */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-medium">Status & Grade</span>
                        <div className="font-bold text-slate-900 text-xs mt-0.5">
                          {selectedTargetEmp.employmentType || 'PKWTT'} · {selectedTargetEmp.grade || 'L3'}
                        </div>
                        <span className="text-[9px] text-slate-400 block truncate">
                          Gaji: {formatRupiah(selectedTargetEmp.basicSalary || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Type Selector (9 Enterprise Types) */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-2">
                <label className="font-bold text-slate-800 block text-xs">
                  Pilih Jenis Tindakan Personalia *
                </label>
                <select
                  value={actionType}
                  onChange={(e) => handleActionTypeChange(e.target.value as PersonaliaActionType)}
                  className="w-full px-3 py-2 border border-indigo-300 rounded-md bg-white font-semibold text-slate-900 shadow-xs outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Promosi">1. Promosi (Promotion) — Kenaikan Jabatan & Tanggung Jawab (Karier Naik)</option>
                  <option value="Mutasi">2. Mutasi / Transfer (Lateral Move) — Perpindahan Posisi / Departemen Setara</option>
                  <option value="Demosi">3. Demosi (Demotion) — Penurunan Jabatan / Evaluasi Disipliner</option>
                  <option value="Penetapan Plt">4. Penugasan Sementara (Secondment / Acting Role / Plt)</option>
                  <option value="Pengangkatan Tetap">5. Perubahan Status (Status Change) — PKWT Kontrak ke PKWTT Tetap</option>
                  <option value="Rotasi Cabang">6. Rotasi Cabang / Penempatan Regional Luar Kota</option>
                  <option value="Penyesuaian Gaji">7. Penyesuaian Gaji Pokok (Merit Increase / Skala Upah)</option>
                  <option value="Perpanjangan Kontrak">8. Perpanjangan Masa Kontrak (Addendum PKWT)</option>
                </select>
                <p className="text-[11px] text-slate-500 italic">
                  Formulir isian di bawah akan otomatis menyesuaikan bidang data yang relevan dengan tindakan di atas.
                </p>
              </div>

              {/* Effective Date & Doc Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ValidatedDateInput
                  id="personaliaEffectiveDate"
                  label="Tanggal Efektif Berlakunya SK *"
                  value={effectiveDate}
                  onChange={(val) => {
                    setEffectiveDate(val);
                    if (formError) setFormError(null);
                    setSkDocNumber(generateSkNumber(actionType, val));
                  }}
                  required
                  showError={showValidationErrors}
                  helperText="Format YYYY-MM-DD"
                />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-700">Nomor SK Resmi *</label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Otomatis Sesuai Pengaturan</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      required
                      value={skDocNumber}
                      title="Nomor SK resmi diterbitkan otomatis oleh sistem penomoran dokumen perusahaan dan bersifat readonly"
                      className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded font-mono font-semibold text-indigo-800 bg-slate-100 cursor-not-allowed select-none text-xs"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Format penomoran terstandarisasi otomatis berdasarkan jenis tindakan & kode tenant ({currentTenant.code}).
                  </span>
                </div>
              </div>

              {/* DYNAMIC FIELDSETS ACCORDING TO ACTION TYPE */}
              
              {/* 1. PROMOSI JABATAN */}
              {actionType === 'Promosi' && (
                <div className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-lg space-y-3">
                  <div className="font-semibold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span>Parameter Promosi Jabatan & Jenjang Karier</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">
                        Jabatan / Posisi Baru (Referensi Tabel Jabatan) *
                      </label>
                      <div className="space-y-1.5">
                        <select
                          value={availablePositions.includes(newPosition) ? newPosition : (newPosition ? '__custom__' : '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                              setIsCustomPos(true);
                            } else {
                              setIsCustomPos(false);
                              setNewPosition(val);
                              const matchingNode = orgNodes?.find((n) => n.title === val);
                              if (matchingNode?.department) {
                                setNewDepartment(matchingNode.department);
                              }
                            }
                          }}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-900 text-xs"
                        >
                          <option value="">-- Pilih Posisi dari Tabel Jabatan --</option>
                          {availablePositions.map((pos) => (
                            <option key={pos} value={pos}>
                              {pos}
                            </option>
                          ))}
                          <option value="__custom__">+ Input Posisi Kustom Baru</option>
                        </select>
                        {(isCustomPos || (newPosition && !availablePositions.includes(newPosition))) && (
                          <input
                            type="text"
                            required
                            value={newPosition}
                            onChange={(e) => setNewPosition(e.target.value)}
                            placeholder="Ketik nama jabatan baru definitif..."
                            className="w-full px-3 py-1.5 border border-indigo-300 rounded bg-indigo-50/50 font-medium text-xs text-indigo-950"
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Grade Golongan Baru</label>
                      <select
                        value={newGrade}
                        onChange={(e) => setNewGrade(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-mono"
                      >
                        <option value="L1">L1 - Entry Level / Junior</option>
                        <option value="L2">L2 - Associate Specialist</option>
                        <option value="L3">L3 - Senior Specialist</option>
                        <option value="L4">L4 - Principal / Lead</option>
                        <option value="M1">M1 - Assistant Manager</option>
                        <option value="M2">M2 - Senior Manager</option>
                        <option value="E1">E1 - Vice President</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <CurrencyInput
                      id="promosiSalary"
                      label="Gaji Pokok Baru (IDR) *"
                      value={newSalary}
                      onChange={(val) => setNewSalary(val)}
                      required
                      min={currentTenant.umr || 3000000}
                      helperText={`Gaji lama: ${formatRupiah(selectedTargetEmp?.basicSalary || 0)}`}
                    />
                    <CurrencyInput
                      id="promosiAllowance"
                      label="Tunjangan Jabatan Baru (IDR)"
                      value={newPositionAllowance}
                      onChange={(val) => setNewPositionAllowance(val)}
                      helperText="Tunjangan struktural fungsional"
                    />
                  </div>
                </div>
              )}

              {/* 2. DEMOSI JABATAN */}
              {actionType === 'Demosi' && (
                <div className="p-3 bg-rose-50/40 border border-rose-200 rounded-lg space-y-3">
                  <div className="font-semibold text-rose-900 flex items-center gap-1.5 text-xs">
                    <ArrowDownRight className="w-4 h-4 text-rose-600" />
                    <span>Parameter Demosi & Penurunan Eselon</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">
                        Jabatan Baru Penyesuaian (Referensi Tabel Jabatan) *
                      </label>
                      <div className="space-y-1.5">
                        <select
                          value={availablePositions.includes(newPosition) ? newPosition : (newPosition ? '__custom__' : '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                              setIsCustomPos(true);
                            } else {
                              setIsCustomPos(false);
                              setNewPosition(val);
                            }
                          }}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-900 text-xs"
                        >
                          <option value="">-- Pilih Posisi dari Tabel Jabatan --</option>
                          {availablePositions.map((pos) => (
                            <option key={pos} value={pos}>
                              {pos}
                            </option>
                          ))}
                          <option value="__custom__">+ Input Posisi Kustom Baru</option>
                        </select>
                        {(isCustomPos || (newPosition && !availablePositions.includes(newPosition))) && (
                          <input
                            type="text"
                            required
                            value={newPosition}
                            onChange={(e) => setNewPosition(e.target.value)}
                            placeholder="Ketik jabatan penyesuaian..."
                            className="w-full px-3 py-1.5 border border-rose-300 rounded bg-rose-50/50 font-medium text-xs text-rose-950"
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Grade Diturunkan Ke</label>
                      <select
                        value={newGrade}
                        onChange={(e) => setNewGrade(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-mono"
                      >
                        <option value="L1">L1 - Entry Level</option>
                        <option value="L2">L2 - Associate</option>
                        <option value="L3">L3 - Senior</option>
                      </select>
                    </div>
                  </div>
                  <CurrencyInput
                    id="demosiSalary"
                    label="Penyesuaian Gaji Pokok (IDR) *"
                    value={newSalary}
                    onChange={(val) => setNewSalary(val)}
                    required
                    min={currentTenant.umr || 3000000}
                    helperText="Tidak boleh di bawah standar UMR regional"
                  />
                </div>
              )}

              {/* 3. MUTASI ANTAR DIVISI */}
              {actionType === 'Mutasi' && (
                <div className="p-3 bg-indigo-50/40 border border-indigo-200 rounded-lg space-y-3">
                  <div className="font-semibold text-indigo-900 flex items-center gap-1.5 text-xs">
                    <Repeat className="w-4 h-4 text-indigo-600" />
                    <span>Parameter Mutasi Divisi / Perpindahan Unit Kerja</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Departemen / Divisi Tujuan *</label>
                      <select
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium"
                      >
                        <option value="Executive Management">Executive Management</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Human Capital">Human Capital</option>
                        <option value="Finance & Tax">Finance & Tax</option>
                        <option value="Product & Design">Product & Design</option>
                        <option value="Operations & GA">Operations & GA</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">
                        Posisi di Divisi Tujuan (Tabel Jabatan) *
                      </label>
                      <div className="space-y-1.5">
                        <select
                          value={availablePositions.includes(newPosition) ? newPosition : (newPosition ? '__custom__' : '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                              setIsCustomPos(true);
                            } else {
                              setIsCustomPos(false);
                              setNewPosition(val);
                            }
                          }}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-900 text-xs"
                        >
                          <option value="">-- Pilih Posisi dari Tabel Jabatan --</option>
                          {availablePositions.map((pos) => (
                            <option key={pos} value={pos}>
                              {pos}
                            </option>
                          ))}
                          <option value="__custom__">+ Input Posisi Kustom Baru</option>
                        </select>
                        {(isCustomPos || (newPosition && !availablePositions.includes(newPosition))) && (
                          <input
                            type="text"
                            required
                            value={newPosition}
                            onChange={(e) => setNewPosition(e.target.value)}
                            placeholder="Ketik posisi divisi tujuan..."
                            className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium text-xs"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <CurrencyInput
                    id="mutasiSalary"
                    label="Gaji Pokok Definitif (IDR)"
                    value={newSalary}
                    onChange={(val) => setNewSalary(val)}
                    helperText="Biasanya setara atau disesuaikan dengan skala divisi baru"
                  />
                </div>
              )}

              {/* 4. ROTASI CABANG / SITE */}
              {actionType === 'Rotasi Cabang' && (
                <div className="p-3 bg-purple-50/40 border border-purple-200 rounded-lg space-y-3">
                  <div className="font-semibold text-purple-900 flex items-center gap-1.5 text-xs">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span>Parameter Penempatan Cabang / Site Regional</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Lokasi Cabang / Site Baru *</label>
                      <select
                        value={newBranchLocation}
                        onChange={(e) => setNewBranchLocation(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium"
                      >
                        <option value="Kantor Pusat Jakarta">Kantor Pusat Jakarta (Menara Palma)</option>
                        <option value="Cabang Surabaya - Tech Hub">Cabang Surabaya - Tech Hub</option>
                        <option value="Cabang Bandung - Digital Lab">Cabang Bandung - Digital Lab</option>
                        <option value="Site IKN Balikpapan - Operasional">Site IKN Balikpapan - Operasional</option>
                        <option value="Remote / WFH Nasional">Remote / WFH Nasional</option>
                      </select>
                    </div>
                    <div>
                      <CurrencyInput
                        id="rotasiKemahalan"
                        label="Tunjangan Penempatan / Kemahalan (IDR)"
                        value={newFixedAllowance}
                        onChange={(val) => setNewFixedAllowance(val)}
                        helperText="Tunjangan biaya hidup lokasi penempatan"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. PENYESUAIAN GAJI POKOK */}
              {actionType === 'Penyesuaian Gaji' && (
                <div className="p-3 bg-blue-50/40 border border-blue-200 rounded-lg space-y-3">
                  <div className="font-semibold text-blue-900 flex items-center gap-1.5 text-xs">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span>Parameter Kenaikan Gaji Berkala / Merit Increase</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <CurrencyInput
                      id="salaryMerit"
                      label="Gaji Pokok Baru (IDR) *"
                      value={newSalary}
                      onChange={(val) => setNewSalary(val)}
                      required
                      min={currentTenant.umr || 3000000}
                    />
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Persentase Kenaikan (%)</label>
                      <div className="px-3 py-2 bg-slate-100 rounded border border-slate-200 font-mono font-bold text-slate-800">
                        {selectedTargetEmp && selectedTargetEmp.basicSalary > 0
                          ? `+${(((newSalary - selectedTargetEmp.basicSalary) / selectedTargetEmp.basicSalary) * 100).toFixed(1)}%`
                          : '0%'}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Gaji lama: {formatRupiah(selectedTargetEmp?.basicSalary || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. PENGANGKATAN KARYAWAN TETAP (PKWTT) */}
              {actionType === 'Pengangkatan Tetap' && (
                <div className="p-3 bg-teal-50/40 border border-teal-200 rounded-lg space-y-3">
                  <div className="font-semibold text-teal-900 flex items-center gap-1.5 text-xs">
                    <UserCheck className="w-4 h-4 text-teal-600" />
                    <span>Pengangkatan Karyawan Tetap (PKWTT) Sesuai Pasal 60 UU Ketenagakerjaan</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <ValidatedDateInput
                      id="tetapAppointmentDate"
                      label="Tanggal Resmi Menjadi Karyawan Tetap *"
                      value={permanentAppointmentDate}
                      onChange={(val) => setPermanentAppointmentDate(val)}
                      required
                      helperText="Berakhirnya masa probation 3 bulan"
                    />
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Hasil Evaluasi Probation</label>
                      <select className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white">
                        <option value="Sangat Memuaskan">Sangat Memuaskan (Nilai A - 95%)</option>
                        <option value="Memuaskan">Memuaskan (Nilai B - 85%)</option>
                      </select>
                      <span className="text-[10px] text-teal-700 mt-0.5 block font-medium">
                        ✓ Berhak atas hak cuti tahunan penuh 12 hari kerja
                      </span>
                    </div>
                  </div>
                  <CurrencyInput
                    id="tetapSalary"
                    label="Gaji Pokok Definitif Tetap (IDR) *"
                    value={newSalary}
                    onChange={(val) => setNewSalary(val)}
                    required
                  />
                </div>
              )}

              {/* 7. PERPANJANGAN KONTRAK PKWT */}
              {actionType === 'Perpanjangan Kontrak' && (
                <div className="p-3 bg-amber-50/40 border border-amber-200 rounded-lg space-y-3">
                  <div className="font-semibold text-amber-900 flex items-center gap-1.5 text-xs">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Parameter Addendum Perpanjangan PKWT (PP 35/2021)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Durasi Perpanjangan (Bulan)</label>
                      <input
                        type="number"
                        min={1}
                        max={36}
                        value={contractDurationMonths}
                        onChange={(e) => setContractDurationMonths(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <ValidatedDateInput
                      id="contractEndDate"
                      label="Tanggal Akhir Kontrak Baru *"
                      value={contractEndDate}
                      onChange={(val) => setContractEndDate(val)}
                      required
                      helperText="Batas akhir masa perpanjangan"
                    />
                  </div>
                  <p className="text-[10px] text-amber-800 bg-amber-100/60 p-2 rounded">
                    Perusahaan wajib membayarkan Uang Kompensasi PKWT sesuai Pasal 61A UU Ketenagakerjaan saat masa kontrak sebelumnya berakhir.
                  </p>
                </div>
              )}

              {/* 8. PENETAPAN PEJABAT SEMENTARA (PLT / PJS) */}
              {actionType === 'Penetapan Plt' && (
                <div className="p-3 bg-cyan-50/40 border border-cyan-200 rounded-lg space-y-3">
                  <div className="font-semibold text-cyan-900 flex items-center gap-1.5 text-xs">
                    <Briefcase className="w-4 h-4 text-cyan-600" />
                    <span>Penetapan Pejabat Sementara (Acting Role / Plt)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">
                        Jabatan Plt yang Diemban (Referensi Tabel Posisi) *
                      </label>
                      <div className="space-y-1.5">
                        <select
                          value={availablePositions.includes(newPosition) ? newPosition : (newPosition ? '__custom__' : '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                              setIsCustomPos(true);
                            } else {
                              setIsCustomPos(false);
                              setNewPosition(val);
                            }
                          }}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-900 text-xs"
                        >
                          <option value="">-- Pilih Posisi dari Tabel Jabatan --</option>
                          {availablePositions.map((pos) => (
                            <option key={pos} value={pos}>
                              {pos}
                            </option>
                          ))}
                          <option value="__custom__">+ Input Posisi Kustom Baru</option>
                        </select>
                        {(isCustomPos || (newPosition && !availablePositions.includes(newPosition))) && (
                          <input
                            type="text"
                            required
                            value={newPosition}
                            onChange={(e) => setNewPosition(e.target.value)}
                            placeholder="Contoh: Plt. Head of Engineering"
                            className="w-full px-3 py-1.5 border border-cyan-300 rounded bg-cyan-50/50 font-medium text-xs text-cyan-950"
                          />
                        )}
                      </div>
                    </div>
                    <ValidatedDateInput
                      id="pltExpiryDate"
                      label="Batas Akhir Penugasan Plt *"
                      value={actingRoleExpiryDate}
                      onChange={(val) => setActingRoleExpiryDate(val)}
                      required
                      helperText="Maksimal 6 bulan sesuai kelaziman korporat"
                    />
                  </div>
                  <CurrencyInput
                    id="pltAllowance"
                    label="Honorarium / Tunjangan Plt Tambahan Bulanan (IDR)"
                    value={newPositionAllowance}
                    onChange={(val) => setNewPositionAllowance(val)}
                    helperText="Tunjangan khusus selama menjabat tugas rangkap"
                  />
                </div>
              )}

              {/* SECTION: Konfigurasi & Matriks Transisi Dampak Sistemik Otomatis */}
              <div className="p-4 bg-gradient-to-br from-indigo-50/60 via-slate-50 to-purple-50/40 border border-indigo-200 rounded-xl space-y-3.5 shadow-2xs">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-indigo-200/80">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-2xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Transisi Dampak Sistemik Otomatis (Gaji, Akses Sistem & Fasilitas Aset)</span>
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                          Auto-Triggered Impact
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Perubahan status memicu integrasi skala gaji grade, tunjangan, hak akses sistem, serta fasilitas inventaris logistik.
                      </p>
                    </div>
                  </div>

                  {/* Indicator Grade Scale info */}
                  {GRADE_SALARY_SCALES[newGrade] && (
                    <div className="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-medium">Skala Upah Grade {newGrade}</span>
                      <span className="text-xs font-mono font-bold text-indigo-900">
                        {formatRupiah(GRADE_SALARY_SCALES[newGrade].minSalary)} — {formatRupiah(GRADE_SALARY_SCALES[newGrade].maxSalary)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 1. Matriks Komparasi Sebelum vs Sesudah (Comparison Diff Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                  {/* Card 1: Jabatan & Kedudukan */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/90 shadow-2xs space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      1. Jabatan & Unit Kerja
                    </span>
                    <div className="text-[11px] text-slate-500 line-through truncate">
                      {selectedTargetEmp?.position || '-'} ({selectedTargetEmp?.department || '-'})
                    </div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1 truncate">
                      <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span className="truncate">{newPosition || selectedTargetEmp?.position || '-'}</span>
                    </div>
                    <span className="text-[10px] text-indigo-700 block font-medium truncate">
                      {newDepartment || selectedTargetEmp?.department || '-'}
                    </span>
                  </div>

                  {/* Card 2: Skala Upah & Grade */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        2. Skala Gaji & Grade
                      </span>
                      {GRADE_SALARY_SCALES[newGrade] && newSalary < GRADE_SALARY_SCALES[newGrade].minSalary ? (
                        <span className="text-[9px] px-1 rounded bg-rose-100 text-rose-700 font-bold">
                          &lt; Min Grade
                        </span>
                      ) : (
                        <span className="text-[9px] px-1 rounded bg-emerald-100 text-emerald-700 font-bold">
                          Sesuai Skala
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 line-through">
                      Grade {selectedTargetEmp?.grade || 'L3'} · {formatRupiah(selectedTargetEmp?.basicSalary || 0)}
                    </div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1 font-mono">
                      <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Grade {newGrade} · {formatRupiah(newSalary)}</span>
                    </div>
                    {GRADE_SALARY_SCALES[newGrade] && newSalary < GRADE_SALARY_SCALES[newGrade].minSalary && (
                      <button
                        type="button"
                        onClick={() => setNewSalary(GRADE_SALARY_SCALES[newGrade].minSalary)}
                        className="text-[9px] text-indigo-700 font-bold hover:underline block text-left"
                        title="Otomatis sesuaikan gaji ke batas minimum grade"
                      >
                        ⚡ Samakan ke Min Grade ({formatRupiah(GRADE_SALARY_SCALES[newGrade].minSalary)})
                      </button>
                    )}
                  </div>

                  {/* Card 3: Prerogatif Tunjangan */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/90 shadow-2xs space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      3. Prerogatif Tunjangan
                    </span>
                    <div className="text-[11px] text-emerald-700 font-semibold truncate flex items-center gap-1">
                      <span className="text-emerald-600 font-bold">+</span>
                      <span>{newAllowances.length} Tunjangan Baru</span>
                    </div>
                    <div className="text-[11px] text-rose-700 font-semibold truncate flex items-center gap-1">
                      <span className="text-rose-600 font-bold">-</span>
                      <span>{revokedAllowances.length} Tunjangan Hangus</span>
                    </div>
                    <span className="text-[9px] text-slate-400 block truncate">
                      {newAllowances[0] || 'Standar Fungsional'}
                    </span>
                  </div>

                  {/* Card 4: Hak Akses IT & Aset */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/90 shadow-2xs space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      4. Akses IT & Aset GA
                    </span>
                    <div className="font-bold text-slate-900 text-[11px] flex items-center gap-1 truncate">
                      <Key className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span>{newSystemRole}</span>
                    </div>
                    <div className="text-[10px] text-indigo-700 truncate">
                      {approvalAuthorities.length} Wewenang Approval
                    </div>
                    <div className="text-[9px] text-slate-500 truncate flex items-center gap-1">
                      <Laptop className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{allocatedAssets.length} Aset Baru Dialokasikan</span>
                    </div>
                  </div>
                </div>

                {/* 2. Sub-Tabs Navigasi Konfigurasi Detail */}
                <div className="flex items-center gap-2 border-b border-indigo-200/70 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveImpactTab('compensation')}
                    className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                      activeImpactTab === 'compensation'
                        ? 'border-indigo-600 text-indigo-800 bg-white/70 rounded-t-md'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>1. Skala Gaji & Prerogatif Tunjangan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveImpactTab('it_rbac')}
                    className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                      activeImpactTab === 'it_rbac'
                        ? 'border-indigo-600 text-indigo-800 bg-white/70 rounded-t-md'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>2. Transisi Hak Akses Sistem</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveImpactTab('assets')}
                    className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                      activeImpactTab === 'assets'
                        ? 'border-indigo-600 text-indigo-800 bg-white/70 rounded-t-md'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>3. Manajemen Fasilitas & Aset (GA)</span>
                  </button>
                </div>

                {/* TAB CONTENT 1: Skala Gaji & Prerogatif Tunjangan */}
                {activeImpactTab === 'compensation' && (
                  <div className="space-y-3 bg-white p-3 rounded-lg border border-indigo-100 text-xs">
                    {/* Auto Scale Banner */}
                    <div className="p-2.5 bg-indigo-50/50 border border-indigo-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-indigo-950 block text-xs">
                          Struktur Skala Upah Otomatis: Grade {newGrade} ({GRADE_SALARY_SCALES[newGrade]?.label || newGrade})
                        </span>
                        <span className="text-[11px] text-indigo-800">
                          Batas Minimal Skala: <strong>{formatRupiah(GRADE_SALARY_SCALES[newGrade]?.minSalary || 4500000)}</strong> — Batas Maksimal: <strong>{formatRupiah(GRADE_SALARY_SCALES[newGrade]?.maxSalary || 9500000)}</strong>
                        </span>
                      </div>

                      {GRADE_SALARY_SCALES[newGrade] && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewSalary(GRADE_SALARY_SCALES[newGrade].minSalary);
                            if (GRADE_SALARY_SCALES[newGrade].defaultPositionAllowance) {
                              setNewPositionAllowance(GRADE_SALARY_SCALES[newGrade].defaultPositionAllowance);
                            }
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow-2xs shrink-0 transition-colors"
                        >
                          Terapkan Standar Min Grade {newGrade}
                        </button>
                      )}
                    </div>

                    {/* Dual Columns: Tunjangan Baru vs Tunjangan Hangus */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Left: Tunjangan Baru yang Ditambahkan */}
                      <div className="p-3 bg-emerald-50/30 border border-emerald-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200">
                          <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">+</span>
                            <span>Tunjangan Baru yang Diaktifkan</span>
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-800">
                            {newAllowances.length} Dipilih
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Tunjangan yang otomatis melekat pada jabatan/tindakan ini dan mulai dibayarkan per tanggal efektif SK:
                        </p>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {PRESET_NEW_ALLOWANCES.map((item) => {
                            const isChecked = newAllowances.includes(item);
                            return (
                              <label
                                key={item}
                                className={`flex items-start gap-2 p-1.5 rounded cursor-pointer transition-colors text-xs ${
                                  isChecked ? 'bg-emerald-100/60 font-semibold text-emerald-900' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setNewAllowances((prev) =>
                                      isChecked ? prev.filter((x) => x !== item) : [...prev, item]
                                    );
                                  }}
                                  className="w-3.5 h-3.5 mt-0.5 text-emerald-600 rounded"
                                />
                                <span className="text-[11px] leading-tight">{item}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Tunjangan Lama yang Otomatis Hangus */}
                      <div className="p-3 bg-rose-50/30 border border-rose-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-rose-200">
                          <span className="font-bold text-rose-950 flex items-center gap-1.5 text-xs">
                            <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[10px]">-</span>
                            <span>Tunjangan yang Otomatis Hangus</span>
                          </span>
                          <span className="text-[10px] font-semibold text-rose-800">
                            {revokedAllowances.length} Dihanguskan
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Tunjangan dari jabatan/lokasi sebelumnya yang otomatis dihentikan dan dicabut saat SK berlaku:
                        </p>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {PRESET_REVOKED_ALLOWANCES.map((item) => {
                            const isChecked = revokedAllowances.includes(item);
                            return (
                              <label
                                key={item}
                                className={`flex items-start gap-2 p-1.5 rounded cursor-pointer transition-colors text-xs ${
                                  isChecked ? 'bg-rose-100/60 font-semibold text-rose-900' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setRevokedAllowances((prev) =>
                                      isChecked ? prev.filter((x) => x !== item) : [...prev, item]
                                    );
                                  }}
                                  className="w-3.5 h-3.5 mt-0.5 text-rose-600 rounded"
                                />
                                <span className="text-[11px] leading-tight">{item}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 2: Transisi Hak Akses IT (Role-Based Access Control) */}
                {activeImpactTab === 'it_rbac' && (
                  <div className="space-y-3 bg-white p-3 rounded-lg border border-indigo-100 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-800 block text-xs mb-1">
                          Role Akses Akun Sistem Baru *
                        </label>
                        <select
                          value={newSystemRole}
                          onChange={(e) => setNewSystemRole(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded font-semibold text-indigo-950 bg-white"
                        >
                          <option value="Regular Employee">Regular Employee (Self-Service ESS Standar)</option>
                          <option value="Supervisor">Supervisor (Approver Tim Level 1)</option>
                          <option value="Manager / Approver">Manager / Approver (Persetujuan Cuti, Lembur & Klaim Biaya)</option>
                          <option value="Department Head">Department Head (Multi-Level Approval & Anggaran Divisi)</option>
                          <option value="Director">Director (Pengesahan Keputusan Eksekutif)</option>
                        </select>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Role sebelumnya: <strong>{selectedTargetEmp?.role || 'Regular Employee'}</strong>. Hak akses akun akan disinkronkan otomatis saat SK berstatus sah.
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-900 block text-xs mb-1">
                          Kewenangan Persetujuan Finansial & Operasional
                        </span>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Saat akun ditingkatkan, karyawan otomatis tercatat sebagai Pejabat Penyetuju (Approver) pada workflow Reimbursement, Pengajuan Cuti, Lembur, dan Asesmen KPI bawahannya.
                        </p>
                      </div>
                    </div>

                    {/* Checklist Approval Authorities */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="font-bold text-slate-800 block text-xs">
                        Wewenang Approval yang Diberikan Otomatis:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PRESET_APPROVAL_AUTHORITIES.map((auth) => {
                          const isChecked = approvalAuthorities.includes(auth);
                          return (
                            <label
                              key={auth}
                              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs ${
                                isChecked
                                  ? 'bg-indigo-50 border-indigo-300 font-semibold text-indigo-950'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setApprovalAuthorities((prev) =>
                                    isChecked ? prev.filter((x) => x !== auth) : [...prev, auth]
                                  );
                                }}
                                className="w-3.5 h-3.5 text-indigo-600 rounded"
                              />
                              <span className="text-[11px]">{auth}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 3: Manajemen Fasilitas & Aset (Asset Provisioning) */}
                {activeImpactTab === 'assets' && (
                  <div className="space-y-3 bg-white p-3 rounded-lg border border-indigo-100 text-xs">
                    <p className="text-[11px] text-slate-500">
                      Sistem akan menerbitkan notifikasi otomatis (dispatch task) ke Bagian Umum & Logistik (GA) untuk penyiapan fasilitas baru dan penarikan aset lama:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Left: Aset Baru Dialokasikan */}
                      <div className="p-3 bg-indigo-50/30 border border-indigo-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-indigo-200">
                          <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                            <Laptop className="w-4 h-4 text-indigo-600" />
                            <span>Fasilitas & Aset Baru yang Diterbitkan</span>
                          </span>
                          <span className="text-[10px] font-semibold text-indigo-800">
                            {allocatedAssets.length} Item
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {PRESET_ALLOCATED_ASSETS.map((asset) => {
                            const isChecked = allocatedAssets.includes(asset);
                            return (
                              <label
                                key={asset}
                                className={`flex items-start gap-2 p-1.5 rounded cursor-pointer transition-colors text-xs ${
                                  isChecked ? 'bg-indigo-100/70 font-semibold text-indigo-950' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setAllocatedAssets((prev) =>
                                      isChecked ? prev.filter((x) => x !== asset) : [...prev, asset]
                                    );
                                  }}
                                  className="w-3.5 h-3.5 mt-0.5 text-indigo-600 rounded"
                                />
                                <span className="text-[11px] leading-tight">{asset}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Aset Lama Dikembalikan */}
                      <div className="p-3 bg-amber-50/30 border border-amber-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-amber-200">
                          <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                            <Car className="w-4 h-4 text-amber-600" />
                            <span>Aset yang Harus Diserahterimakan Kembali</span>
                          </span>
                          <span className="text-[10px] font-semibold text-amber-800">
                            {returnedAssets.length} Item
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {PRESET_RETURNED_ASSETS.map((asset) => {
                            const isChecked = returnedAssets.includes(asset);
                            return (
                              <label
                                key={asset}
                                className={`flex items-start gap-2 p-1.5 rounded cursor-pointer transition-colors text-xs ${
                                  isChecked ? 'bg-amber-100/70 font-semibold text-amber-950' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setReturnedAssets((prev) =>
                                      isChecked ? prev.filter((x) => x !== asset) : [...prev, asset]
                                    );
                                  }}
                                  className="w-3.5 h-3.5 mt-0.5 text-amber-600 rounded"
                                />
                                <span className="text-[11px] leading-tight">{asset}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Flexible Signatories / Approval Form */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Form Penandatangan / Approval Dokumen SK</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Jumlah kolom & keterangan tanda tangan fleksibel (bisa 1, 2, 3 kolom atau lebih; keterangan "Dibuat Oleh", "Mengetahui", "Menyetujui", "Disetujui Oleh" dll. dapat disesuaikan bebas).
                    </p>
                  </div>

                  {/* Preset Template Switchers */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium">Pilih Susunan:</span>
                    <button
                      type="button"
                      onClick={() => applySignatoryPreset('3-tier')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
                        signatories.length === 3
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      title="3 Kolom: Dibuat Oleh · Mengetahui · Menyetujui"
                    >
                      3 Pihak (Standar)
                    </button>
                    <button
                      type="button"
                      onClick={() => applySignatoryPreset('2-tier')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
                        signatories.length === 2
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      title="2 Kolom: Dibuat Oleh · Disetujui Oleh"
                    >
                      2 Pihak (Dibuat & Disetujui)
                    </button>
                    <button
                      type="button"
                      onClick={() => applySignatoryPreset('1-tier')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
                        signatories.length === 1
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      title="1 Kolom: Ditetapkan Oleh"
                    >
                      1 Pihak
                    </button>
                  </div>
                </div>

                {/* Signatories Responsive Grid */}
                <div
                  className={`grid gap-3 ${
                    signatories.length === 1
                      ? 'grid-cols-1'
                      : signatories.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                  }`}
                >
                  {signatories.map((sig, idx) => (
                    <div
                      key={sig.id || idx}
                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2.5 relative group hover:border-indigo-300 transition-colors"
                    >
                      {/* Card Header with Index & Remove Button */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800 text-[11px]">
                            Kolom {idx + 1}
                          </span>
                        </div>

                        {signatories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSignatory(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Hapus kolom penandatangan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* 1. Keterangan / Status Penandatanganan */}
                      <div>
                        <label className="font-medium text-slate-600 block text-[11px] mb-1">
                          Keterangan Tanda Tangan *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Dibuat Oleh, Mengetahui, Menyetujui, Disetujui Oleh"
                          value={sig.label}
                          onChange={(e) => handleUpdateSignatory(idx, 'label', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:border-indigo-500 bg-white"
                        />
                        {/* Quick preset chips to handle differences like 'Menyetujui' vs 'Disetujui Oleh' */}
                        <div className="flex items-center gap-1 flex-wrap mt-1">
                          {['Dibuat Oleh', 'Mengetahui', 'Menyetujui', 'Disetujui Oleh', 'Diperiksa Oleh'].map(
                            (chipLabel) => (
                              <button
                                key={chipLabel}
                                type="button"
                                onClick={() => handleUpdateSignatory(idx, 'label', chipLabel)}
                                className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                                  sig.label === chipLabel
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                                }`}
                              >
                                {chipLabel}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* 2. Pilih Pejabat / Karyawan (Lengkap dengan Nama, NIK, Jabatan, Foto) */}
                      <div>
                        <label className="font-medium text-slate-600 block text-[11px] mb-1">
                          Pejabat / Penandatangan *
                        </label>
                        <EmployeeSelect
                          employees={employees}
                          value={sig.employeeId || (sig.name ? '__manual__' : '')}
                          onChange={(empId) => handleSignatoryEmployeeSelect(idx, empId)}
                          placeholder="-- Pilih Pejabat (Nama, NIK, Jabatan, Foto) --"
                          allowManual
                          manualLabel="+ Input Manual / Pihak Eksternal"
                        />
                      </div>

                      {/* Manual Name Input (if manual or external) */}
                      {(sig.employeeId === '__manual__' || !employees.some((e) => e.id === sig.employeeId)) && (
                        <div>
                          <label className="font-medium text-slate-600 block text-[11px] mb-1">
                            Nama Lengkap Pejabat *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Ir. Budi Santoso, MBA"
                            value={sig.name}
                            onChange={(e) => handleUpdateSignatory(idx, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-indigo-200 rounded text-xs font-semibold text-slate-900 bg-indigo-50/30"
                          />
                        </div>
                      )}

                      {/* 3. Jabatan / Posisi Resmi */}
                      <div>
                        <label className="font-medium text-slate-600 block text-[11px] mb-1">
                          Jabatan / Peran Resmi *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: President Director & CEO"
                          value={sig.role || ''}
                          onChange={(e) => handleUpdateSignatory(idx, 'role', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Signatory Button & Note */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddSignatory}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition-all hover:border-indigo-400"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Kolom Penandatangan</span>
                  </button>
                  <span className="text-[10px] text-slate-400 italic">
                    Urutan kolom akan tercetak dari kiri ke kanan pada lembar SK resmi digital.
                  </span>
                </div>
              </div>

              {/* Dasar Pertimbangan / Alasan SK */}
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Dasar Pertimbangan / Alasan Penerbitan SK *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Berdasarkan hasil rapat pimpinan dan hasil penilaian kinerja triwulan..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setShowValidationErrors(false);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors text-center"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Preview Draft */}
                  <button
                    type="button"
                    onClick={handlePreviewDraft}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs shadow-2xs flex items-center gap-1.5 transition-colors"
                    title="Pratinjau lembar draf SK digital sebelum diajukan"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Preview Draft</span>
                  </button>

                  {/* Simpan Draft */}
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-semibold text-xs shadow-2xs flex items-center gap-1.5 transition-colors"
                    title="Simpan sebagai draf tanpa mengubah master data karyawan"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Simpan Draft</span>
                  </button>

                  {/* Kirim Pengajuan & Approval */}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Pengajuan & Approval</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pratinjau & Analisis Kelayakan Personalia Karyawan */}
      {isPreviewKelayakanOpen && selectedTargetEmp && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPreviewKelayakanOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-400/30 text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Analisis Kelayakan & Rekam Jejak Personalia</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                      {actionType}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Evaluasi komprehensif masa kerja, surat peringatan (SP), KPI, dan kedisiplinan sebelum penetapan SK
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewKelayakanOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Tutup analisis"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Profile Card */}
              <div className="p-4 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                    {selectedTargetEmp.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{selectedTargetEmp.fullName}</h4>
                      <span className="text-[11px] font-mono font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        NIK: {selectedTargetEmp.nik || selectedTargetEmp.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      {selectedTargetEmp.position} · <span className="text-indigo-700">{selectedTargetEmp.department}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{selectedTargetEmp.branch || 'Kantor Pusat'}</span>
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <span>Status: {selectedTargetEmp.employmentType || 'PKWTT'}</span>
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <span>Grade: {selectedTargetEmp.grade || 'L3'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 shrink-0">
                  <span className="text-[11px] text-slate-400 block">Gaji Pokok Saat Ini</span>
                  <span className="font-bold font-mono text-sm text-slate-900">
                    {formatRupiah(selectedTargetEmp.basicSalary || 0)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">/ bulan</span>
                </div>
              </div>

              {/* Status Kelayakan General Verdict Banner */}
              {activeSanctions.length > 0 ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-xs block text-rose-800">
                      PERHATIAN: Terdapat {activeSanctions.length} Surat Peringatan (SP) yang Masih Aktif!
                    </span>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      Karyawan memiliki sanksi disiplin aktif (<strong>{activeSanctions[0].level}</strong> berlaku hingga <strong>{activeSanctions[0].validUntil}</strong>). 
                      Sesuai peraturan perusahaan, pengajuan promosi atau penyesuaian insentif biasanya ditangguhkan sampai masa berlaku SP berakhir kecuali mendapatkan dispensasi pimpinan.
                    </p>
                  </div>
                </div>
              ) : !tenure.isPromosiEligible && actionType === 'Promosi' ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-xs block text-amber-800">
                      Peringatan Batas Minimal Masa Kerja Promosi
                    </span>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Masa kerja karyawan baru mencapai <strong>{tenure.label}</strong> (di bawah batas ketentuan rekomendasi {promosiMinMonths} bulan). Pastikan telah menyertakan pertimbangan prestasi istimewa pada dasar pertimbangan SK.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-900">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs block text-emerald-800">
                      Memenuhi Kriteria Standar Personalia
                    </span>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      Karyawan bebas dari sanksi surat peringatan aktif dan memenuhi parameter rekam jejak untuk tindakan personalia <strong>{actionType}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* 4 Key Eligibility Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Masa Kerja */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Masa Kerja</span>
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">{tenure.label}</div>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Join: {tenure.joinDateFormatted}
                  </span>
                  <div className="pt-1 text-[10px] font-medium">
                    {tenure.isPromosiEligible ? (
                      <span className="text-emerald-700">✓ &ge; {promosiMinMonths} Bulan Standar</span>
                    ) : (
                      <span className="text-amber-700">&lt; {promosiMinMonths} Bulan Standar</span>
                    )}
                  </div>
                </div>

                {/* 2. Surat Peringatan */}
                <div className={`p-3 rounded-xl border space-y-1 ${
                  activeSanctions.length > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Surat Peringatan</span>
                    <ShieldCheck className={`w-3.5 h-3.5 ${activeSanctions.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
                  </div>
                  <div className="text-sm font-bold">
                    {activeSanctions.length > 0 ? (
                      <span className="text-rose-600">{activeSanctions.length} SP Aktif</span>
                    ) : (
                      <span className="text-emerald-700">0 SP Aktif</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Total Riwayat: {empComplianceRecords.length} Catatan
                  </span>
                  <div className="pt-1 text-[10px] font-medium">
                    {activeSanctions.length > 0 ? (
                      <span className="text-rose-700 font-semibold">{activeSanctions[0].level}</span>
                    ) : (
                      <span className="text-emerald-700">Bebas Sanksi</span>
                    )}
                  </div>
                </div>

                {/* 3. KPI / Kinerja */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Kinerja / KPI</span>
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {latestKpi ? `${latestKpi.score}%` : '92%'}
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Rating: {latestKpi?.rating || 'Sangat Baik (A)'}
                  </span>
                  <div className="pt-1 text-[10px] text-indigo-700 font-medium truncate">
                    {latestKpi?.period || 'Semester Berjalan'}
                  </div>
                </div>

                {/* 4. Kedisiplinan Kehadiran */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Kedisiplinan</span>
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {empAttendanceStats.presentRate}% Hadir
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Terlambat: {empAttendanceStats.lateCount}x
                  </span>
                  <div className="pt-1 text-[10px] text-slate-500 font-medium">
                    Mangkir / Alpha: {empAttendanceStats.absentCount}x
                  </div>
                </div>
              </div>

              {/* Rincian Surat Peringatan & Kepatuhan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Rekam Jejak Surat Peringatan & Sanksi Disiplin (SP)</span>
                  </h5>
                  <span className="text-[11px] text-slate-500">
                    {empComplianceRecords.length} dokumen tercatat
                  </span>
                </div>

                {empComplianceRecords.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Tingkat Sanksi</th>
                          <th className="p-2.5">Tanggal Terbit</th>
                          <th className="p-2.5">Masa Berlaku</th>
                          <th className="p-2.5">Alasan / Pelanggaran</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {empComplianceRecords.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-bold text-slate-900">{c.level}</td>
                            <td className="p-2.5 text-slate-600 font-mono">{c.issueDate}</td>
                            <td className="p-2.5 text-slate-600 font-mono">{c.validUntil}</td>
                            <td className="p-2.5 text-slate-700 max-w-xs">{c.reason}</td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  c.status === 'Aktif'
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-xs block">Catatan Bersih - Tidak Ada Surat Peringatan</span>
                      <span className="text-[11px] text-emerald-700">
                        Karyawan tidak memiliki riwayat pelanggaran tata tertib maupun sanksi disiplin SP dalam sistem.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rincian Riwayat Tindakan Personalia Sebelumnya */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span>Riwayat Surat Keputusan (SK) & Karier Terdahulu</span>
                  </h5>
                  <span className="text-[11px] text-slate-500">
                    {empPastPersonalia.length} SK terdahulu
                  </span>
                </div>

                {empPastPersonalia.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Nomor Dokumen SK</th>
                          <th className="p-2.5">Tindakan</th>
                          <th className="p-2.5">Tanggal Efektif</th>
                          <th className="p-2.5">Perubahan Posisi / Gaji</th>
                          <th className="p-2.5 text-center">Status SK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {empPastPersonalia.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-mono font-semibold text-indigo-700">{log.skNumber}</td>
                            <td className="p-2.5 font-semibold text-slate-900">{log.actionType}</td>
                            <td className="p-2.5 text-slate-600 font-mono">{log.effectiveDate}</td>
                            <td className="p-2.5 text-slate-700">
                              {log.newPosition ? (
                                <span>{log.previousPosition} &rarr; <strong>{log.newPosition}</strong></span>
                              ) : log.newSalary ? (
                                <span>{formatRupiah(log.previousSalary)} &rarr; <strong>{formatRupiah(log.newSalary)}</strong></span>
                              ) : (
                                <span>{log.reason || '-'}</span>
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                {log.status || 'Disetujui'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-[11px]">
                    Belum ada riwayat penerbitan SK personalia sebelumnya untuk karyawan ini. Tindakan ini akan menjadi SK resmi pertama.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Data ditarik secara real-time dari modul Personalia, Kepatuhan (Compliance), Presensi & KPI.
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewKelayakanOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs"
              >
                Tutup & Lanjutkan Formulir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Document Modal for Career & Discipline Actions */}
      <ModuleDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        categoryFilter={['Karier & Organisasi', 'Disiplin, PHK & Paklaring']}
        defaultTemplateId="tmpl-4"
        title="Penerbitan Dokumen Resmi Karier & Personalia"
      />
    </div>
  );
};


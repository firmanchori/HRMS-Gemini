import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHrms } from '../../context/HrmsContext';
import {
  UserPlus,
  Briefcase,
  Plus,
  Calendar,
  CheckCircle,
  FileCheck,
  Award,
  ArrowRight,
  X,
  Star,
  Users,
  Calculator,
  CheckSquare,
  Square,
  Printer,
  Settings,
  Download,
  Search,
  FileText,
  AlertCircle,
  Sparkles,
  Globe,
  Share2,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  History,
  Archive,
  UserX,
  UserCheck,
  Layers,
  Video,
  TrendingUp,
  Check,
  BookOpen,
  Filter,
  RefreshCw,
  Clock,
  Send,
  Building,
  Building2,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  List,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  SlidersHorizontal,
  Trash2,
  User,
  Lock,
  ShieldAlert,
  Copy,
  Undo2,
  AlertTriangle,
  UploadCloud,
  Code,
  Brain,
  Binary,
  Languages,
  Sliders,
  FileCheck2,
  RotateCcw,
  Edit2,
  Laptop,
  CreditCard,
  ShieldCheck,
  CalendarCheck,
  Key,
  Zap,
} from 'lucide-react';
import {
  RecruitmentStage,
  EmploymentType,
  Candidate,
  CandidateCompetencyScore,
  CompetencyTestTypeSetting,
  PTKPStatus,
  JobRequisition,
  JobVacancy,
  JobPostingChannel,
  FptkPositionReason,
  FptkSignatory,
  OnboardingTask,
  OnboardingProcess,
  OnboardingChecklistTemplateItem,
  OnboardingTargetDepartment,
  OnboardingChecklistType,
  OnboardingActionType,
  AssignedInterviewer,
} from '../../types/hrms';
import { DEFAULT_ONBOARDING_CHECKLIST_TEMPLATES } from '../../data/initialData';
import { formatRupiah, calculatePPh21TER, calculateBPJS } from '../../utils/taxCalculator';

export const COMPANY_GRADES = [
  'Grade 1 - Staff / Pelaksana',
  'Grade 2 - Officer / Senior Staff',
  'Grade 3 - Lead / Supervisor',
  'Grade 4 - Manager / Specialist',
  'Grade 5 - Head / VP / General Manager',
  'Grade 6 - Director / C-Level',
];

export const FPTK_REASONS: FptkPositionReason[] = [
  'Posisi Baru (New Position)',
  'Penggantian Karyawan Resign',
  'Penggantian Mutasi / Dipindahkan',
  'Penggantian Promosi Jabatan',
  'Kebutuhan Proyek Khusus',
  'Penambahan Headcount',
  'Ekspansi Bisnis',
  'Lainnya',
];

export const COMPANY_EDUCATION_LEVELS = [
  'SMA / SMK Sederajat',
  'D3 - Diploma Tiga',
  'D4 / S1 - Sarjana',
  'S2 - Magister / Master',
  'S3 - Doktoral',
];

export const COMPANY_EXP_LEVELS = [
  'Fresh Graduate / Tanpa Pengalaman',
  '1 - 2 Tahun',
  '3 - 5 Tahun',
  '5 - 8 Tahun',
  '> 8 Tahun (Senior / Lead)',
];

export const SIGNATORY_ROLES = [
  'Menyetujui',
  'Mengetahui',
  'Memeriksa',
  'Mengesahkan',
  'Menyetujui (Final)',
];

// Helper konfigurasi visual badge portal pelamar (LinkedIn, Glints, JobStreet, dsb) yang rapi & tidak pecah di mobile
export const getPortalBadgeConfig = (portal?: string) => {
  const p = (portal || '').toLowerCase();
  if (p.includes('linkedin')) {
    return {
      label: 'LinkedIn',
      badgeClass: 'bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/30',
      dotClass: 'bg-[#0A66C2]',
    };
  }
  if (p.includes('jobstreet')) {
    return {
      label: 'JobStreet',
      badgeClass: 'bg-[#1C3F94]/10 text-[#1C3F94] border-[#1C3F94]/30',
      dotClass: 'bg-[#1C3F94]',
    };
  }
  if (p.includes('glints')) {
    return {
      label: 'Glints',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      dotClass: 'bg-rose-500',
    };
  }
  if (p.includes('kalibrr')) {
    return {
      label: 'Kalibrr',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      dotClass: 'bg-amber-500',
    };
  }
  if (p.includes('karir') || p.includes('website')) {
    return {
      label: 'Website Karir',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dotClass: 'bg-emerald-600',
    };
  }
  if (p.includes('email') || p.includes('mail')) {
    return {
      label: 'Direct Email',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dotClass: 'bg-indigo-600',
    };
  }
  if (p.includes('wa') || p.includes('whatsapp') || p.includes('referral') || p.includes('referensi')) {
    return {
      label: 'Referral / WA',
      badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
      dotClass: 'bg-teal-600',
    };
  }
  if (p.includes('google') || p.includes('gform') || p.includes('form')) {
    return {
      label: 'Google Form',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      dotClass: 'bg-purple-600',
    };
  }
  if (p.includes('offline') || p.includes('job fair') || p.includes('walk-in') || p.includes('walkin')) {
    return {
      label: 'Offline / Walk-In',
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
      dotClass: 'bg-amber-600',
    };
  }
  return {
    label: portal || 'Upload Manual',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500',
  };
};

import { QRCodeView } from '../common/QRCodeView';
import { CurrencyInput } from '../common/CurrencyInput';
import { ScrollableTabNav } from '../common/ScrollableTabNav';

export interface CompanyEmployeeItem {
  id: string;
  fullName: string;
  rawName: string;
  degree: string;
  nik: string;
  position: string;
  department: string;
  avatar?: string;
  initials: string;
}

export const formatEmployeeName = (fullName: string, withDegree: boolean = true) => {
  if (!fullName) return '';
  if (withDegree) return fullName;
  return fullName.split(',')[0].trim();
};

interface EmployeeSelectDropdownProps {
  employees: CompanyEmployeeItem[];
  selectedId?: string;
  withDegree?: boolean;
  onSelect: (emp: CompanyEmployeeItem) => void;
  placeholder?: string;
  disabled?: boolean;
}

const EmployeeSelectDropdown: React.FC<EmployeeSelectDropdownProps> = ({
  employees,
  selectedId,
  withDegree = true,
  onSelect,
  placeholder = '-- Pilih Karyawan (Foto, Nama, NIK, Jabatan) --',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedEmp = employees.find((e) => e.id === selectedId);

  const filteredEmployees = employees.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.fullName.toLowerCase().includes(q) ||
      e.nik.toLowerCase().includes(q) ||
      e.position.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
    );
  });

  const getDisplayName = (emp: CompanyEmployeeItem) => {
    return withDegree ? emp.fullName : emp.rawName;
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-2.5 py-2 border rounded-xl text-left flex items-center justify-between gap-2 transition-all bg-white shadow-2xs hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-600 ${
          isOpen ? 'ring-1 ring-blue-600 border-blue-600' : 'border-slate-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}
      >
        {selectedEmp ? (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Foto Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-blue-50 flex items-center justify-center">
              <img
                src={selectedEmp.avatar}
                alt={selectedEmp.rawName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-[10px] font-bold text-blue-700 font-mono">
                {selectedEmp.initials}
              </span>
            </div>

            {/* Nama & NIK + Jabatan */}
            <div className="min-w-0 flex-1 leading-tight">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-900 text-xs truncate">
                  {getDisplayName(selectedEmp)}
                </span>
                <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  {selectedEmp.nik}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                {selectedEmp.position} • <span className="text-slate-400">{selectedEmp.department}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-0.5">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <span className="truncate">{placeholder}</span>
          </div>
        )}

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Cari nama, NIK, atau jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* List Karyawan */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredEmployees.length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-xs">
                Tidak ada karyawan yang sesuai pencarian
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = emp.id === selectedId;
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      onSelect(emp);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full p-2 rounded-lg text-left flex items-center justify-between gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 text-blue-900'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-blue-100 flex items-center justify-center">
                        <img
                          src={emp.avatar}
                          alt={emp.rawName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="text-[10px] font-bold text-blue-700 font-mono">
                          {emp.initials}
                        </span>
                      </div>

                      {/* Detail */}
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">
                            {getDisplayName(emp)}
                          </span>
                          <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {emp.nik}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {emp.position} • <span className="text-slate-400">{emp.department}</span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const RecruitmentManagement: React.FC = () => {
  const {
    jobRequisitions = [],
    addJobRequisition,
    updateJobRequisition,
    vacancies = [],
    candidates = [],
    addVacancy,
    updateVacancy,
    addCandidate,
    updateCandidateStage,
    currentTenant,
    currentUser,
    employees = [],
    addOnboardingProcess,
    onboardingProcesses = [],
    onboardingChecklistTemplates = [],
    updateOnboardingTask,
    completeOnboardingProcess,
    updateOnboardingChecklistTemplates,
    addChecklistTemplateItem,
    removeChecklistTemplateItem,
    setActiveModule,
    competencyTestTypes = [],
    addCompetencyTestType,
    updateCompetencyTestType,
    deleteCompetencyTestType,
    resetCompetencyTestTypes,
    saveCandidateCompetencyScore,
    deleteCandidateCompetencyScore,
    interviewTypeSettings = [],
    addInterviewType,
    updateInterviewType,
    deleteInterviewType,
    resetInterviewTypes,
    saveCandidateInterviewEvaluation,
    deleteCandidateInterviewEvaluation,
  } = useHrms();

  const safeTenant = currentTenant || {
    id: 'tenant-ntm',
    name: 'PT Nusantara Teknologi Mandiri',
    code: 'NTM',
    city: 'Jakarta Selatan',
    umr: 5067381,
    npwp: '01.234.567.8-012.000',
    logoText: 'NTM',
    documentLogoUrl: '',
    workDaysPerWeek: 5 as const,
    standardWorkHours: 8,
    planTier: 'Enterprise' as const,
  };

  // Dynamic Company Departments & Employees for Dropdowns
  const companyDepartments = React.useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    [
      'Engineering',
      'Product & Design',
      'People & Culture',
      'Finance & Accounting',
      'Marketing & Sales',
      'Operations & Logistics',
      'General Affairs & Legal',
    ].forEach((d) => set.add(d));
    return Array.from(set);
  }, [employees]);

  const companyEmployees: CompanyEmployeeItem[] = React.useMemo(() => {
    return employees.map((e) => {
      const rawName = e.fullName.split(',')[0].trim();
      const degree = e.fullName.includes(',')
        ? e.fullName.substring(e.fullName.indexOf(',') + 1).trim()
        : '';
      const initials = rawName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join('');
      const avatarUrl =
        e.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(rawName)}&background=0284c7&color=fff&bold=true&size=80`;

      return {
        id: e.id,
        fullName: e.fullName,
        rawName,
        degree,
        nik: e.nik || 'EMP-NIK',
        position: e.position,
        department: e.department,
        avatar: avatarUrl,
        initials,
      };
    });
  }, [employees]);

  // Structural Leadership & Management Positions for Reporting Lines
  const companyPositions = React.useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.position) set.add(e.position);
    });
    [
      'Chief Executive Officer (CEO)',
      'Chief Operating Officer (COO)',
      'Chief Technology Officer (CTO)',
      'Chief Financial Officer (CFO)',
      'VP of Technology',
      'VP of Human Capital',
      'VP of Finance & Accounting',
      'Head of Engineering',
      'Engineering Manager',
      'Principal Architect',
      'Product Lead / Head of Product',
      'Head of People & Culture',
      'Finance & Accounting Manager',
      'Marketing & Growth Director',
      'Operations & Logistics Director',
      'General Affairs & Legal Manager',
    ].forEach((p) => set.add(p));
    return Array.from(set);
  }, [employees]);

  // 7 Explicit Tabs per User Architecture:
  // 1. Permintaan FPTK
  // 2. Lowongan & Sourcing
  // 3. Pipeline Seleksi (Incoming, Screening, Assessment, Interview)
  // 4. Offering (Kalkulator Offering & Kirim Offering)
  // 5. Hired / Disqualified (Penentuan diterima atau ditolak)
  // 6. On Boarding
  // 7. Talent Pool
  const [activeTab, setActiveTab] = useState<
    'fptk' | 'sourcing' | 'pipeline' | 'offering' | 'decision' | 'onboarding' | 'talent_pool'
  >('fptk');

  // Pipeline sub-view mode: Board vs Table
  const [pipelineViewMode, setPipelineViewMode] = useState<'board' | 'table'>('board');

  // Filters
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);
  const [isVacancyModalOpen, setIsVacancyModalOpen] = useState(false);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isResumeParserModalOpen, setIsResumeParserModalOpen] = useState(false);
  const [isScreeningModalOpen, setIsScreeningModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [isOfferingDocPreviewOpen, setIsOfferingDocPreviewOpen] = useState(false);
  const [offeringGateCandidate, setOfferingGateCandidate] = useState<Candidate | null>(null);
  const [isSelectOfferingCandidateModalOpen, setIsSelectOfferingCandidateModalOpen] = useState(false);

  // Active items for modals
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [activeRequisition, setActiveRequisition] = useState<JobRequisition | null>(null);

  // Retract FPTK (Pembatalan setelah approved)
  const [retractModalFptk, setRetractModalFptk] = useState<JobRequisition | null>(null);
  const [retractReason, setRetractReason] = useState('');

  // Toast feedback state
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!toastFeedback) return;
    const timer = setTimeout(() => setToastFeedback(null), 3800);
    return () => clearTimeout(timer);
  }, [toastFeedback]);

  // Rejection note state
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [candidateToDisqualify, setCandidateToDisqualify] = useState<Candidate | null>(null);

  // ===================== ONBOARDING CHECKLIST & ACTIONS STATE =====================
  const [isChecklistSettingsOpen, setIsChecklistSettingsOpen] = useState(false);
  const [selectedOnboardingProcess, setSelectedOnboardingProcess] = useState<OnboardingProcess | null>(null);
  const [selectedOnboardingTask, setSelectedOnboardingTask] = useState<OnboardingTask | null>(null);

  // Template Form State
  const [tmplTitle, setTmplTitle] = useState('');
  const [tmplCategory, setTmplCategory] = useState('Legalitas & Dokumen');
  const [tmplTargetDept, setTmplTargetDept] = useState<OnboardingTargetDepartment>('HR');
  const [tmplVerificationType, setTmplVerificationType] = useState<OnboardingChecklistType>('manual');
  const [tmplActionType, setTmplActionType] = useState<OnboardingActionType>('custom_action');
  const [tmplIsMandatory, setTmplIsMandatory] = useState(true);
  const [tmplDescription, setTmplDescription] = useState('');

  // 1. Modal Form Pengajuan ID Card ke GA
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [idCardType, setIdCardType] = useState('RFID Smart Card + Lanyard Standar NusaHR');
  const [idCardAccessRooms, setIdCardAccessRooms] = useState<string[]>([
    'Lantai Kerja (Working Area)',
    'Kantin Karyawan & Breakroom',
    'Lobby Utama & Gate Masuk',
  ]);
  const [idCardSpecialNotes, setIdCardSpecialNotes] = useState('');

  // 2. Modal Form Dossier & Verifikasi Dokumen
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [dossierKtpNumber, setDossierKtpNumber] = useState('');
  const [dossierNpwpNumber, setDossierNpwpNumber] = useState('');
  const [dossierBpjsTkNumber, setDossierBpjsTkNumber] = useState('');
  const [dossierBpjsKesNumber, setDossierBpjsKesNumber] = useState('');
  const [dossierAddressKtp, setDossierAddressKtp] = useState('');
  const [dossierEmergencyContactName, setDossierEmergencyContactName] = useState('');
  const [dossierEmergencyContactPhone, setDossierEmergencyContactPhone] = useState('');
  const [dossierEmergencyContactRelation, setDossierEmergencyContactRelation] = useState('Orang Tua');
  const [dossierVerifiedDocs, setDossierVerifiedDocs] = useState<string[]>([
    'KTP (Kartu Tanda Penduduk)',
    'Kartu Keluarga (KK)',
    'NPWP',
  ]);

  // 3. Modal Form Alokasi Laptop Kerja & Aset IT
  const [isLaptopModalOpen, setIsLaptopModalOpen] = useState(false);
  const [laptopDeviceType, setLaptopDeviceType] = useState('MacBook Pro 14" M3 Pro (18GB/512GB)');
  const [laptopSerialNo, setLaptopSerialNo] = useState('');
  const [laptopAssetTag, setLaptopAssetTag] = useState('');
  const [laptopAccessories, setLaptopAccessories] = useState<string[]>([
    'Charger Adapter 70W USB-C',
    'USB-C Multiport Hub / Dongle',
    'Laptop Sleeve NusaHR',
    'Wireless Optical Mouse',
  ]);
  const [laptopCondition, setLaptopCondition] = useState('Baru 100% (Seal Box)');
  const [laptopNotes, setLaptopNotes] = useState('');

  // 4. Modal Form Provisioning Akun-Akun Sistem & Email Korporat
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [corpEmail, setCorpEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('Nusa2026!Secure');
  const [accountSystems, setAccountSystems] = useState<string[]>([
    'NusaHR Employee Portal (Self Service)',
    'Google Workspace (Gmail & Drive Korporat)',
    'Slack Workplace NusaHR',
    'Jira & Confluence Enterprise',
  ]);
  const [notifyPersonalEmail, setNotifyPersonalEmail] = useState(true);

  // Handlers for Onboarding Action Modals
  const openIdCardModal = (process: OnboardingProcess, task: OnboardingTask) => {
    setSelectedOnboardingProcess(process);
    setSelectedOnboardingTask(task);
    if (task.actionPayload) {
      if (task.actionPayload.idCardType) setIdCardType(task.actionPayload.idCardType);
      if (task.actionPayload.idCardAccessRooms) setIdCardAccessRooms(task.actionPayload.idCardAccessRooms);
      if (task.actionPayload.idCardSpecialNotes) setIdCardSpecialNotes(task.actionPayload.idCardSpecialNotes);
    } else {
      setIdCardType('RFID Smart Card + Lanyard Standar NusaHR');
      setIdCardAccessRooms(['Lantai Kerja (Working Area)', 'Kantin Karyawan & Breakroom', 'Lobby Utama & Gate Masuk']);
      setIdCardSpecialNotes('');
    }
    setIsIdCardModalOpen(true);
  };

  const submitIdCardRequest = () => {
    if (!selectedOnboardingProcess || !selectedOnboardingTask) return;
    const ticketNo = selectedOnboardingTask.actionPayload?.idCardTicketNo || `REQ-GA-IDCARD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    updateOnboardingTask(selectedOnboardingProcess.id, selectedOnboardingTask.id, true, {
      idCardTicketNo: ticketNo,
      idCardType,
      idCardAccessRooms,
      idCardSpecialNotes,
      submittedAt: new Date().toISOString().split('T')[0],
      submittedBy: currentUser?.name || 'HR Admin',
    });
    setToastFeedback(`Pengajuan cetak ID Card untuk ${selectedOnboardingProcess.employeeName} berhasil dikirim ke GA (Tiket: ${ticketNo}). Item checklist otomatis Selesai!`);
    setIsIdCardModalOpen(false);
  };

  const openDossierModal = (process: OnboardingProcess, task: OnboardingTask) => {
    setSelectedOnboardingProcess(process);
    setSelectedOnboardingTask(task);
    if (task.actionPayload) {
      if (task.actionPayload.dossierKtpNumber) setDossierKtpNumber(task.actionPayload.dossierKtpNumber);
      if (task.actionPayload.dossierNpwpNumber) setDossierNpwpNumber(task.actionPayload.dossierNpwpNumber);
      if (task.actionPayload.dossierBpjsTkNumber) setDossierBpjsTkNumber(task.actionPayload.dossierBpjsTkNumber);
      if (task.actionPayload.dossierBpjsKesNumber) setDossierBpjsKesNumber(task.actionPayload.dossierBpjsKesNumber);
      if (task.actionPayload.dossierAddressKtp) setDossierAddressKtp(task.actionPayload.dossierAddressKtp);
      if (task.actionPayload.dossierEmergencyContactName) setDossierEmergencyContactName(task.actionPayload.dossierEmergencyContactName);
      if (task.actionPayload.dossierEmergencyContactPhone) setDossierEmergencyContactPhone(task.actionPayload.dossierEmergencyContactPhone);
      if (task.actionPayload.dossierEmergencyContactRelation) setDossierEmergencyContactRelation(task.actionPayload.dossierEmergencyContactRelation);
      if (task.actionPayload.dossierVerifiedDocs) setDossierVerifiedDocs(task.actionPayload.dossierVerifiedDocs);
    } else {
      setDossierKtpNumber('3174092408940003');
      setDossierNpwpNumber('09.234.567.8-012.000');
      setDossierBpjsTkNumber('23098172654');
      setDossierBpjsKesNumber('000192837465');
      setDossierAddressKtp('Jl. Gandaria Tengah III No. 12, Jakarta Selatan');
      setDossierEmergencyContactName('Budi Santoso');
      setDossierEmergencyContactPhone('081234567890');
      setDossierEmergencyContactRelation('Orang Tua');
      setDossierVerifiedDocs(['KTP (Kartu Tanda Penduduk)', 'Kartu Keluarga (KK)', 'NPWP', 'BPJS Ketenagakerjaan', 'BPJS Kesehatan', 'Ijazah Terakhir']);
    }
    setIsDossierModalOpen(true);
  };

  const submitDossierVerification = () => {
    if (!selectedOnboardingProcess || !selectedOnboardingTask) return;
    updateOnboardingTask(selectedOnboardingProcess.id, selectedOnboardingTask.id, true, {
      dossierKtpNumber,
      dossierNpwpNumber,
      dossierBpjsTkNumber,
      dossierBpjsKesNumber,
      dossierAddressKtp,
      dossierEmergencyContactName,
      dossierEmergencyContactPhone,
      dossierEmergencyContactRelation,
      dossierVerifiedDocs,
      verifiedAt: new Date().toISOString().split('T')[0],
      verifiedBy: currentUser?.name || 'HR Admin',
    });
    setToastFeedback(`Berkas dossier dan data pribadi ${selectedOnboardingProcess.employeeName} terverifikasi lengkap. Item checklist otomatis Selesai!`);
    setIsDossierModalOpen(false);
  };

  const openLaptopModal = (process: OnboardingProcess, task: OnboardingTask) => {
    setSelectedOnboardingProcess(process);
    setSelectedOnboardingTask(task);
    if (task.actionPayload) {
      if (task.actionPayload.laptopDeviceType) setLaptopDeviceType(task.actionPayload.laptopDeviceType);
      if (task.actionPayload.laptopSerialNo) setLaptopSerialNo(task.actionPayload.laptopSerialNo);
      if (task.actionPayload.laptopAssetTag) setLaptopAssetTag(task.actionPayload.laptopAssetTag);
      if (task.actionPayload.laptopAccessories) setLaptopAccessories(task.actionPayload.laptopAccessories);
      if (task.actionPayload.laptopCondition) setLaptopCondition(task.actionPayload.laptopCondition);
      if (task.actionPayload.laptopNotes) setLaptopNotes(task.actionPayload.laptopNotes);
    } else {
      setLaptopDeviceType('MacBook Pro 14" M3 Pro (18GB/512GB)');
      setLaptopSerialNo(`C02G${Math.floor(1000 + Math.random() * 9000)}MD6T`);
      setLaptopAssetTag(`AST-IT-2026-${Math.floor(100 + Math.random() * 900)}`);
      setLaptopAccessories(['Charger Adapter 70W USB-C', 'USB-C Multiport Hub / Dongle', 'Laptop Sleeve NusaHR', 'Wireless Optical Mouse']);
      setLaptopCondition('Baru 100% (Seal Box)');
      setLaptopNotes('Diserahkan langsung pada hari pertama kerja');
    }
    setIsLaptopModalOpen(true);
  };

  const submitLaptopAllocation = () => {
    if (!selectedOnboardingProcess || !selectedOnboardingTask) return;
    updateOnboardingTask(selectedOnboardingProcess.id, selectedOnboardingTask.id, true, {
      laptopDeviceType,
      laptopSerialNo,
      laptopAssetTag,
      laptopAccessories,
      laptopCondition,
      laptopNotes,
      allocatedAt: new Date().toISOString().split('T')[0],
      allocatedBy: currentUser?.name || 'IT Admin',
    });
    setToastFeedback(`Perangkat laptop ${laptopDeviceType} (SN: ${laptopSerialNo}) berhasil dialokasikan untuk ${selectedOnboardingProcess.employeeName}. Item checklist otomatis Selesai!`);
    setIsLaptopModalOpen(false);
  };

  const openAccountModal = (process: OnboardingProcess, task: OnboardingTask) => {
    setSelectedOnboardingProcess(process);
    setSelectedOnboardingTask(task);
    const firstName = process.employeeName.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
    const lastName = process.employeeName.toLowerCase().split(' ')[1]?.replace(/[^a-z]/g, '') || 'work';
    const suggestedEmail = `${firstName}.${lastName}@nusantara.id`;
    if (task.actionPayload) {
      if (task.actionPayload.corporateEmail) setCorpEmail(task.actionPayload.corporateEmail);
      if (task.actionPayload.temporaryPassword) setTempPassword(task.actionPayload.temporaryPassword);
      if (task.actionPayload.accountSystems) setAccountSystems(task.actionPayload.accountSystems);
      if (task.actionPayload.notifyPersonalEmail !== undefined) setNotifyPersonalEmail(task.actionPayload.notifyPersonalEmail);
    } else {
      setCorpEmail(suggestedEmail);
      setTempPassword(`Nusa${new Date().getFullYear()}!${Math.floor(100 + Math.random() * 900)}`);
      setAccountSystems(['NusaHR Employee Portal (Self Service)', 'Google Workspace (Gmail & Drive Korporat)', 'Slack Workplace NusaHR', 'Jira & Confluence Enterprise']);
      setNotifyPersonalEmail(true);
    }
    setIsAccountModalOpen(true);
  };

  const submitAccountSetup = () => {
    if (!selectedOnboardingProcess || !selectedOnboardingTask) return;
    updateOnboardingTask(selectedOnboardingProcess.id, selectedOnboardingTask.id, true, {
      corporateEmail: corpEmail,
      temporaryPassword: tempPassword,
      accountSystems,
      notifyPersonalEmail,
      provisionedAt: new Date().toISOString().split('T')[0],
      provisionedBy: currentUser?.name || 'IT Sysadmin',
    });
    setToastFeedback(`Email resmi korporat ${corpEmail} dan 4 akun sistem berhasil diaktivasi untuk ${selectedOnboardingProcess.employeeName}. Item checklist otomatis Selesai!`);
    setIsAccountModalOpen(false);
  };

  // ===================== 1. FORM FPTK (PERMINTAAN KARYAWAN BARU) =====================
  const [fptkPosition, setFptkPosition] = useState('');
  const [fptkGradeMin, setFptkGradeMin] = useState('Grade 2 - Officer / Senior Staff');
  const [fptkGradeMax, setFptkGradeMax] = useState('Grade 3 - Lead / Supervisor');
  const [fptkDept, setFptkDept] = useState(companyDepartments[0] || 'Engineering');
  const [fptkHeadcount, setFptkHeadcount] = useState(1);
  const [fptkReason, setFptkReason] = useState<string>('Posisi Baru (New Position)');
  const [fptkReplacementFor, setFptkReplacementFor] = useState('');
  const [fptkIsBudgeted, setFptkIsBudgeted] = useState<boolean>(true);
  const [fptkJustification, setFptkJustification] = useState('');
  const [fptkTargetDate, setFptkTargetDate] = useState('2026-11-15');
  const [fptkReportingDept, setFptkReportingDept] = useState(companyDepartments[0] || 'Engineering');
  const [fptkReportingTitle, setFptkReportingTitle] = useState('VP of Technology');
  const [fptkSupervisedStaff, setFptkSupervisedStaff] = useState<number>(0);
  const [fptkMainResponsibilities, setFptkMainResponsibilities] = useState('');
  const [fptkEduLevel, setFptkEduLevel] = useState('D4 / S1 - Sarjana');
  const [fptkEduMajor, setFptkEduMajor] = useState('Teknik Informatika / Sistem Informasi');
  const [fptkMinExp, setFptkMinExp] = useState('3 - 5 Tahun');
  const [fptkSkills, setFptkSkills] = useState('TypeScript, React, Node.js, PostgreSQL, Docker, CI/CD');
  const [fptkOtherRequirements, setFptkOtherRequirements] = useState('Komunikasi proaktif, problem-solving analitis, mampu bekerja mandiri & tim.');
  const [fptkRequirements, setFptkRequirements] = useState('');

  // Yang Mengajukan: Readonly pembuat form
  const requesterDisplay = currentUser?.name
    ? `${currentUser.name} (${(currentUser.role || 'HR').replace('_', ' ').toUpperCase()})`
    : 'Firman Pratama (HR Manager)';

  // Yang Menyetujui atas Pengajuan (Fleksibel Multi-Approver)
  const [fptkSignatories, setFptkSignatories] = useState<FptkSignatory[]>(() => {
    const firstEmp = employees[0];
    return [
      {
        id: 'sig-1',
        role: 'Menyetujui',
        employeeId: firstEmp?.id || 'emp-1',
        name: firstEmp ? firstEmp.fullName : 'Aditya Pratama, S.Psi',
        title: firstEmp ? firstEmp.position : 'VP of Human Capital',
        nik: firstEmp?.nik || 'NTM-2022-014',
        withDegree: true,
        status: 'Menunggu Approval',
      },
    ];
  });

  const handleAddSignatory = () => {
    const newId = `sig-${Date.now()}`;
    const defaultEmp = companyEmployees[0];
    setFptkSignatories((prev) => [
      ...prev,
      {
        id: newId,
        role: 'Mengetahui',
        employeeId: defaultEmp?.id || '',
        name: defaultEmp ? defaultEmp.fullName : 'Manager Terkait',
        title: defaultEmp?.position || 'Departemen Manager',
        nik: defaultEmp?.nik,
        avatar: defaultEmp?.avatar,
        withDegree: true,
        status: 'Menunggu Approval',
      },
    ]);
  };

  const handleUpdateSignatory = (id: string, updates: Partial<FptkSignatory>) => {
    setFptkSignatories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const handleRemoveSignatory = (id: string) => {
    if (fptkSignatories.length <= 1) {
      alert('Minimal harus ada 1 penanda tangan / pihak penyetuju.');
      return;
    }
    setFptkSignatories((prev) => prev.filter((s) => s.id !== id));
  };

  // Filter & Detail Preview FPTK
  const [fptkSearch, setFptkSearch] = useState('');
  const [fptkStatusFilter, setFptkStatusFilter] = useState<'Semua' | 'Menunggu Approval' | 'Disetujui' | 'Dicabut (Retracted)' | 'Ditolak' | 'Dibatalkan'>('Semua');
  const [fptkBudgetFilter, setFptkBudgetFilter] = useState<'Semua' | 'Budgeted' | 'Unbudgeted'>('Semua');
  const [previewFptk, setPreviewFptk] = useState<JobRequisition | null>(null);
  const [trackingFptk, setTrackingFptk] = useState<JobRequisition | null>(null);

  // ===================== 2. FORM SOURCING & JOB POSTING =====================
  const [vacTitle, setVacTitle] = useState('');
  const [vacDept, setVacDept] = useState('Engineering');
  const [vacGrade, setVacGrade] = useState('Grade 2 - Officer / Senior Staff');
  const [vacType, setVacType] = useState<EmploymentType>('Tetap');
  const [vacOpenings, setVacOpenings] = useState(1);
  const [vacExp, setVacExp] = useState('3+ Tahun');
  const [vacSalary, setVacSalary] = useState('Rp 15.000.000 - Rp 20.000.000');
  const [isSalaryMasked, setIsSalaryMasked] = useState<boolean>(true);
  const [showSalaryPublicly, setShowSalaryPublicly] = useState<boolean>(false);
  const [vacModalTab, setVacModalTab] = useState<'form' | 'preview'>('form');
  const [vacPreviewPortal, setVacPreviewPortal] = useState<'LinkedIn' | 'Jobstreet' | 'Website Karir'>('LinkedIn');
  const [vacRequirements, setVacRequirements] = useState('');
  const [vacDescription, setVacDescription] = useState('');
  const [vacChannels, setVacChannels] = useState<JobPostingChannel[]>([
    'Jobstreet',
    'LinkedIn',
    'Glints',
    'Website Karir',
  ]);
  const [vacLinkedReqId, setVacLinkedReqId] = useState<string>('');

  // ===================== 3. FORM TAMBAH PELAMAR MANUAL / INCOMING =====================
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('0812' + Math.floor(10000000 + Math.random() * 90000000));
  const [candCompany, setCandCompany] = useState('');
  const [candSalary, setCandSalary] = useState<number>(18000000);
  const [candVacancyId, setCandVacancyId] = useState(vacancies[0]?.id || '');
  const [candSource, setCandSource] = useState<string>('Website Karir Internal');
  const [uploadedCv, setUploadedCv] = useState<{ name: string; size: string } | null>(null);
  const [isExtractingCv, setIsExtractingCv] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<{
    summary: string;
    skills: string[];
    experienceYears: number;
    education: string;
    score: number;
  } | null>(null);

  const resetCandidateModal = () => {
    setCandName('');
    setCandEmail('');
    setCandPhone('0812' + Math.floor(10000000 + Math.random() * 90000000));
    setCandCompany('');
    setCandSalary(18000000);
    setCandVacancyId(selectedVacancyId !== 'all' ? selectedVacancyId : (vacancies[0]?.id || 'job-1'));
    setCandSource('Upload Manual (File CV)');
    setUploadedCv(null);
    setIsExtractingCv(false);
    setExtractedPreview(null);
  };

  // ===================== PENGATURAN JENIS TES KOMPETENSI =====================
  const [isTestSettingsModalOpen, setIsTestSettingsModalOpen] = useState(false);
  const [editingTestType, setEditingTestType] = useState<CompetencyTestTypeSetting | null>(null);
  const [isAddingTestType, setIsAddingTestType] = useState(false);
  const [testFormName, setTestFormName] = useState('');
  const [testFormCategory, setTestFormCategory] = useState<CompetencyTestTypeSetting['category']>('Hard Skill');
  const [testFormPassingGrade, setTestFormPassingGrade] = useState(75);
  const [testFormDuration, setTestFormDuration] = useState(60);
  const [testFormMethod, setTestFormMethod] = useState<CompetencyTestTypeSetting['method']>('Online Test');
  const [testFormWeight, setTestFormWeight] = useState(20);
  const [testFormDesc, setTestFormDesc] = useState('');
  const [testFormIsActive, setTestFormIsActive] = useState(true);

  // ===================== 5. FORM ASSESSMENT / TES KOMPETENSI (ADAPTIF SESUAI DROPDOWN) =====================
  const [selectedTestTypeId, setSelectedTestTypeId] = useState<string>('test-tech');
  const [evaluatorName, setEvaluatorName] = useState('Tim Asesor Kompetensi');
  const [testPassingGradeInput, setTestPassingGradeInput] = useState<number>(75);
  const [testNotesInput, setTestNotesInput] = useState('');

  // 1. Tes Teknis / Coding & Arsitektur
  const [techArchitectureScore, setTechArchitectureScore] = useState<number>(85);
  const [techAlgorithmScore, setTechAlgorithmScore] = useState<number>(88);
  const [techProblemSolvingScore, setTechProblemSolvingScore] = useState<number>(86);
  const [techExecutionMinutes, setTechExecutionMinutes] = useState<number>(65);
  const [techRepoUrl, setTechRepoUrl] = useState<string>('https://github.com/nusantara-eval/cand-sample');

  // 2. Psikotes (DISC / MBTI / Karakter)
  const [psychProfileType, setPsychProfileType] = useState<string>('D - Dominance (Tegas & Hasil-Oriented)');
  const [psychAttentionToDetail, setPsychAttentionToDetail] = useState<number>(85);
  const [psychEmotionalStability, setPsychEmotionalStability] = useState<number>(82);
  const [psychLeadership, setPsychLeadership] = useState<number>(88);
  const [psychRecommendation, setPsychRecommendation] = useState<'Disarankan' | 'Dipertimbangkan' | 'Tidak Disarankan'>('Disarankan');

  // 3. Tes Logika & Numerik (GMA / TPA)
  const [logicCorrectAnswers, setLogicCorrectAnswers] = useState<number>(42);
  const [logicTotalQuestions, setLogicTotalQuestions] = useState<number>(50);
  const [logicSyllogismScore, setLogicSyllogismScore] = useState<number>(86);
  const [logicNumericalScore, setLogicNumericalScore] = useState<number>(84);
  const [logicSpatialScore, setLogicSpatialScore] = useState<number>(88);

  // 4. Kemahiran Bahasa Inggris Bisnis
  const [langListeningScore, setLangListeningScore] = useState<number>(85);
  const [langReadingScore, setLangReadingScore] = useState<number>(88);
  const [langSpeakingScore, setLangSpeakingScore] = useState<number>(80);
  const [langWritingScore, setLangWritingScore] = useState<number>(82);
  const [langCertificateEquiv, setLangCertificateEquiv] = useState<string>('TOEFL ITP Equivalent 580 / IELTS 7.0');

  // 5. Case Study & Presentasi Bisnis
  const [caseProblemAnalysis, setCaseProblemAnalysis] = useState<number>(88);
  const [caseSolutionFeasibility, setCaseSolutionFeasibility] = useState<number>(85);
  const [casePresentationSkill, setCasePresentationSkill] = useState<number>(90);
  const [caseSlideUrl, setCaseSlideUrl] = useState<string>('https://docs.google.com/presentation/d/sample');

  // 6. Tes Praktik Kerja Langsung (Work Sample)
  const [workExecutionQuality, setWorkExecutionQuality] = useState<number>(88);
  const [workSpeedAccuracy, setWorkSpeedAccuracy] = useState<number>(85);
  const [workSopCompliance, setWorkSopCompliance] = useState<number>(92);
  const [workProofUrl, setWorkProofUrl] = useState<string>('');

  // 7. Custom / Jenis Tes Lainnya
  const [customCriteria1, setCustomCriteria1] = useState<number>(85);
  const [customCriteria2, setCustomCriteria2] = useState<number>(85);
  const [customCriteria3, setCustomCriteria3] = useState<number>(85);

  // ===================== 6. FORM INTERVIEW & SCORECARD =====================
  const [interviewDate, setInterviewDate] = useState('2026-10-24 14:00');
  const [interviewTimeEnd, setInterviewTimeEnd] = useState('15:00');
  const [interviewerName, setInterviewerName] = useState('Aditya Pratama (Head of People)');
  const [interviewPlatform, setInterviewPlatform] = useState<'Google Meet' | 'Microsoft Teams' | 'Ruang Interview Kantor'>('Google Meet');
  const [interviewMeetingLink, setInterviewMeetingLink] = useState('https://meet.google.com/xyz-ntm-hr');
  const [techRating, setTechRating] = useState<number>(5);
  const [cultureRating, setCultureRating] = useState<number>(4);
  const [commRating, setCommRating] = useState<number>(5);
  const [interviewRec, setInterviewRec] = useState<'Direkomendasikan Lolos' | 'Dipertimbangkan' | 'Tidak Direkomendasikan'>('Direkomendasikan Lolos');
  const [interviewNotes, setInterviewNotes] = useState('');

  // Enhanced Interview Sequential Workflow States
  const [interviewActiveTab, setInterviewActiveTab] = useState<'schedule' | 'interviewers' | 'scorecard' | 'recommendation'>('schedule');
  const [candidateAttendanceStatus, setCandidateAttendanceStatus] = useState<'Terkonfirmasi Hadir' | 'Menunggu Respon' | 'Minta Reschedule'>('Terkonfirmasi Hadir');
  const [assignedInterviewers, setAssignedInterviewers] = useState<AssignedInterviewer[]>([
    {
      id: 'inv-lead-user',
      name: 'Aditya Pratama, M.Psi.',
      title: 'Head of People & Organization',
      department: 'Human Resources',
      email: 'aditya.pratama@nusantara.id',
      role: 'Lead Interviewer / HRBP',
      status: 'Terkonfirmasi',
    },
  ]);
  const [searchInterviewerText, setSearchInterviewerText] = useState('');
  const [isInterviewerSelectorOpen, setIsInterviewerSelectorOpen] = useState(false);
  const [userRecommendation, setUserRecommendation] = useState<string>('Sangat Cocok / Direkomendasikan (Strong Hire)');
  const [rescheduleReason, setRescheduleReason] = useState<string>('Permintaan Kandidat (Penyesuaian Jadwal)');
  const [rescheduleNotes, setRescheduleNotes] = useState<string>('');
  const [sendInterviewNotifications, setSendInterviewNotifications] = useState<boolean>(true);

  // Dynamic Scorecard per Interview Type
  const [selectedInterviewTypeId, setSelectedInterviewTypeId] = useState<string>('int-tech');
  const [scorecardRatings, setScorecardRatings] = useState<Record<string, number>>({});
  const [isInterviewSettingsModalOpen, setIsInterviewSettingsModalOpen] = useState(false);

  // Settings State for Interview Types
  const [isAddingInterviewType, setIsAddingInterviewType] = useState(false);
  const [editingInterviewType, setEditingInterviewType] = useState<InterviewTypeSetting | null>(null);
  const [interviewFormName, setInterviewFormName] = useState('');
  const [interviewFormTargetRole, setInterviewFormTargetRole] = useState('Semua Posisi');
  const [interviewFormInterviewerRoles, setInterviewFormInterviewerRoles] = useState('User Lead / HRBP');
  const [interviewFormDesc, setInterviewFormDesc] = useState('');
  const [interviewFormCriteria, setInterviewFormCriteria] = useState<InterviewScorecardCriterion[]>([]);
  const [interviewFormIsActive, setInterviewFormIsActive] = useState(true);

  // New criterion input inside master settings
  const [newCritName, setNewCritName] = useState('');
  const [newCritDesc, setNewCritDesc] = useState('');
  const [newCritWeight, setNewCritWeight] = useState(25);

  // ===================== 7. FORM OFFERING CALCULATOR =====================
  const [offeringMode, setOfferingMode] = useState<'gross' | 'net'>('gross');
  const [targetAmount, setTargetAmount] = useState<number>(18500000);
  const [docNumber, setDocNumber] = useState('');
  const [targetJoinDate, setTargetJoinDate] = useState('2026-11-01');
  const [candidatePtkp, setCandidatePtkp] = useState<PTKPStatus>('TK/0');
  const [offeringFormError, setOfferingFormError] = useState<string | null>(null);

  const [components, setComponents] = useState({
    basicSalary: 14000000,
    fixedAllowance: 1500000,
    positionAllowance: 1000000,
    transportAllowance: 1000000,
    mealAllowance: 1000000,
    communicationAllowance: 500000,
    performanceBonus: 1000000,
    thrBonus: 14000000,
  });

  const [enabledComponents] = useState({
    fixedAllowance: true,
    positionAllowance: true,
    transportAllowance: true,
    mealAllowance: true,
    communicationAllowance: true,
    performanceBonus: false,
    thrBonus: true,
  });

  const [enabledBenefits] = useState({
    bpjsKesehatan: true,
    bpjsTkJht: true,
    bpjsTkJkkJkm: true,
    bpjsTkJp: true,
    asuransiSwasta: true,
    fasilitasLaptop: true,
  });

  // Close any active modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (retractModalFptk) setRetractModalFptk(null);
        else if (offeringGateCandidate) setOfferingGateCandidate(null);
        else if (isSelectOfferingCandidateModalOpen) setIsSelectOfferingCandidateModalOpen(false);
        else if (isOfferingDocPreviewOpen) setIsOfferingDocPreviewOpen(false);
        else if (isOfferingModalOpen) setIsOfferingModalOpen(false);
        else if (isCandidateModalOpen) setIsCandidateModalOpen(false);
        else if (isResumeParserModalOpen) setIsResumeParserModalOpen(false);
        else if (isScreeningModalOpen) setIsScreeningModalOpen(false);
        else if (isTestSettingsModalOpen) setIsTestSettingsModalOpen(false);
        else if (isInterviewSettingsModalOpen) setIsInterviewSettingsModalOpen(false);
        else if (isAssessmentModalOpen) setIsAssessmentModalOpen(false);
        else if (isInterviewModalOpen) setIsInterviewModalOpen(false);
        else if (isVacancyModalOpen) setIsVacancyModalOpen(false);
        else if (isRequisitionModalOpen) setIsRequisitionModalOpen(false);
        else if (candidateToDisqualify) setCandidateToDisqualify(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    retractModalFptk,
    offeringGateCandidate,
    isSelectOfferingCandidateModalOpen,
    isOfferingDocPreviewOpen,
    isOfferingModalOpen,
    isCandidateModalOpen,
    isResumeParserModalOpen,
    isScreeningModalOpen,
    isTestSettingsModalOpen,
    isInterviewSettingsModalOpen,
    isAssessmentModalOpen,
    isInterviewModalOpen,
    isVacancyModalOpen,
    isRequisitionModalOpen,
    candidateToDisqualify,
  ]);

  // Candidate stage filter helper
  const isCandidateInStage = (c: Candidate, stageKey: RecruitmentStage) => {
    if (stageKey === 'Incoming') return c.stage === 'Incoming' || c.stage === 'Applied';
    return c.stage === stageKey;
  };

  // 4 Core Selection Stages inside Pipeline (as requested by user)
  const selectionStages: {
    stage: RecruitmentStage;
    number: string;
    title: string;
    subtitle: string;
    badgeColor: string;
    headerAccent: string;
  }[] = [
    {
      stage: 'Incoming',
      number: '1',
      title: 'Incoming',
      subtitle: 'Lamaran Masuk & CV Parsing Otomatis',
      badgeColor: 'bg-blue-100 text-blue-900',
      headerAccent: 'border-blue-600',
    },
    {
      stage: 'Screening',
      number: '2',
      title: 'Screening',
      subtitle: 'Penyaringan Kualifikasi & Keyword Match',
      badgeColor: 'bg-sky-100 text-sky-900',
      headerAccent: 'border-sky-600',
    },
    {
      stage: 'Assessment',
      number: '3',
      title: 'Assessment',
      subtitle: 'Tes Kompetensi Teknis & Skoring',
      badgeColor: 'bg-amber-100 text-amber-900',
      headerAccent: 'border-amber-600',
    },
    {
      stage: 'Interview',
      number: '4',
      title: 'Interview (User)',
      subtitle: 'Wawancara Kalender & Scorecard',
      badgeColor: 'bg-emerald-100 text-emerald-900',
      headerAccent: 'border-emerald-600',
    },
  ];

  // Candidates filtering
  const filteredCandidates = candidates.filter((c) => {
    const matchesVacancy = selectedVacancyId === 'all' || c.jobVacancyId === selectedVacancyId;
    const matchesSearch =
      searchTerm === '' ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastCompany.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesVacancy && matchesSearch;
  });

  // Grouped candidates for 7 tabs
  const pipelineCandidates = filteredCandidates.filter(
    (c) =>
      c.stage === 'Incoming' ||
      c.stage === 'Applied' ||
      c.stage === 'Screening' ||
      c.stage === 'Assessment' ||
      c.stage === 'Interview'
  );

  const offeringCandidates = filteredCandidates.filter((c) => c.stage === 'Offered');
  const decisionCandidates = filteredCandidates.filter(
    (c) => c.stage === 'Offered' || c.stage === 'Hired' || c.stage === 'Rejected'
  );
  const hiredCandidates = filteredCandidates.filter((c) => c.stage === 'Hired');
  const talentPoolCandidates = filteredCandidates.filter((c) => c.stage === 'TalentPool' || c.stage === 'Rejected');

  // Calculation Logic for Offering Calculator
  const activeAllowances =
    (enabledComponents.fixedAllowance ? components.fixedAllowance : 0) +
    (enabledComponents.positionAllowance ? components.positionAllowance : 0) +
    (enabledComponents.transportAllowance ? components.transportAllowance : 0) +
    (enabledComponents.mealAllowance ? components.mealAllowance : 0) +
    (enabledComponents.communicationAllowance ? components.communicationAllowance : 0) +
    (enabledComponents.performanceBonus ? components.performanceBonus : 0);

  const grossMonthly =
    offeringMode === 'gross'
      ? components.basicSalary + activeAllowances
      : targetAmount + 1500000;

  const bpjsCalc = calculateBPJS(components.basicSalary);
  const bpjsEmployeeDeduction =
    (enabledBenefits.bpjsKesehatan ? bpjsCalc.bpjsKesEmployee : 0) +
    (enabledBenefits.bpjsTkJht ? bpjsCalc.breakdown.jhtEmployee : 0) +
    (enabledBenefits.bpjsTkJp ? bpjsCalc.breakdown.jpEmployee : 0);

  const terCalc = calculatePPh21TER(grossMonthly, candidatePtkp);
  const netTakeHomePay = grossMonthly - bpjsEmployeeDeduction - terCalc.taxAmount;

  // ===================== ACTION HANDLERS =====================
  const handleCreateFptk = (e: React.FormEvent, directApprove: boolean = false) => {
    e.preventDefault();
    const count = jobRequisitions.length + 1;
    const deptPrefix = fptkDept.trim().substring(0, 3).toUpperCase() || 'GEN';
    const reqNum = `FPTK/${deptPrefix}/2026/${String(count).padStart(3, '0')}`;
    const gradeLabel =
      fptkGradeMin === fptkGradeMax
        ? fptkGradeMin
        : `${fptkGradeMin.split(' - ')[0]} s/d ${fptkGradeMax.split(' - ')[0]}`;
    
    const combinedEducation = `${fptkEduLevel} - ${fptkEduMajor}`;
    const fullRequirements =
      fptkRequirements ||
      `Pendidikan: ${combinedEducation}. Pengalaman: ${fptkMinExp}. Keterampilan: ${fptkSkills}. ${fptkOtherRequirements}`;

    const finalSignatories = fptkSignatories.map((s) => ({
      ...s,
      status: directApprove ? ('Disetujui' as const) : ('Menunggu Approval' as const),
      date: directApprove ? new Date().toISOString().split('T')[0] : undefined,
    }));

    const primaryApprover = finalSignatories[finalSignatories.length - 1];

    addJobRequisition({
      reqNumber: reqNum,
      position: fptkPosition,
      grade: gradeLabel,
      gradeMin: fptkGradeMin,
      gradeMax: fptkGradeMax,
      department: fptkDept,
      headcount: Number(fptkHeadcount) || 1,
      reason: fptkReason,
      replacementFor: fptkReason.includes('Penggantian') ? fptkReplacementFor : undefined,
      isBudgeted: fptkIsBudgeted,
      justification: fptkJustification,
      targetJoinDate: fptkTargetDate,
      reportingToDepartment: fptkReportingDept,
      reportingToTitle: fptkReportingTitle,
      reportingToEmployeeId: undefined,
      supervisedStaffCount: Number(fptkSupervisedStaff) || 0,
      mainResponsibilities: fptkMainResponsibilities,
      educationLevel: fptkEduLevel,
      educationMajor: fptkEduMajor,
      educationMin: combinedEducation,
      minExperience: fptkMinExp,
      skills: fptkSkills,
      otherRequirements: fptkOtherRequirements,
      requirements: fullRequirements,
      requesterName: requesterDisplay,
      signatories: finalSignatories,
      approvedBy: directApprove ? primaryApprover?.name || 'Direksi' : undefined,
      approverTitle: directApprove ? primaryApprover?.title || 'Approver' : undefined,
      approvalDate: directApprove ? new Date().toISOString().split('T')[0] : undefined,
      approvalNotes: directApprove ? 'Disetujui langsung saat pengajuan formasi.' : undefined,
      status: directApprove ? 'Disetujui' : 'Menunggu Approval',
    });

    setIsRequisitionModalOpen(false);
    setFptkPosition('');
    setFptkJustification('');
    setFptkMainResponsibilities('');
    setFptkReplacementFor('');
    setFptkRequirements('');
    alert(
      directApprove
        ? `Permintaan Karyawan Baru (${reqNum}) berhasil disetujui & tercatat di sistem.`
        : `Permintaan Karyawan Baru (${reqNum}) berhasil diajukan dan sedang Menunggu Approval.`
    );
  };

  const handleApproveFptk = (id: string) => {
    const target = jobRequisitions.find((r) => r.id === id);
    const primaryApprover =
      target?.signatories && target.signatories.length > 0
        ? target.signatories[target.signatories.length - 1].name
        : (target?.approvedBy || 'Aditya Pratama (Head of People)');

    const updatedSignatories = target?.signatories?.map((s) => ({
      ...s,
      status: 'Disetujui' as const,
      date: new Date().toISOString().split('T')[0],
    }));

    updateJobRequisition(id, {
      status: 'Disetujui',
      approvedBy: primaryApprover,
      signatories: updatedSignatories,
      approvalDate: new Date().toISOString().split('T')[0],
      approvalNotes: 'Pengajuan formasi disetujui setelah peninjauan beban kerja dan alokasi anggaran.',
    });
    setToastFeedback('Dokumen FPTK berhasil disetujui! Posisi siap dipublikasikan.');
  };

  const handleRejectFptk = (id: string) => {
    const reason = prompt('Masukkan alasan penolakan FPTK:', 'Alokasi headcount tidak tersedia untuk kuartal ini.');
    if (reason !== null) {
      updateJobRequisition(id, {
        status: 'Ditolak',
        approvalNotes: reason,
        approvalDate: new Date().toISOString().split('T')[0],
      });
      setToastFeedback('Dokumen FPTK ditandai ditolak.');
    }
  };

  const handleCancelRequisition = (id: string) => {
    const reason = prompt(
      'Masukkan alasan pembatalan pengajuan FPTK:',
      'Dibatalkan oleh pemohon (penyesuaian kebutuhan divisi).'
    );
    if (reason !== null) {
      updateJobRequisition(id, {
        status: 'Dibatalkan',
        approvalNotes: `Dibatalkan oleh pemohon: ${reason}`,
      });
      setToastFeedback('Pengajuan FPTK berhasil dibatalkan (sebelum disetujui).');
      if (trackingFptk?.id === id) {
        setTrackingFptk(null);
      }
      if (previewFptk?.id === id) {
        setPreviewFptk(null);
      }
    }
  };

  const handleOpenRetractModal = (req: JobRequisition) => {
    setRetractModalFptk(req);
    setRetractReason('');
  };

  const handleConfirmRetract = () => {
    if (!retractModalFptk) return;
    if (!retractReason.trim()) {
      setToastFeedback('Silakan masukkan alasan pencabutan (Retract) FPTK.');
      return;
    }

    updateJobRequisition(retractModalFptk.id, {
      status: 'Dicabut (Retracted)',
      retractedAt: new Date().toISOString(),
      retractedBy: currentUser?.name || 'Direksi / HR Management',
      retractedReason: retractReason.trim(),
    });

    // Close any active vacancy tied to this FPTK
    const linkedVac = vacancies.find((v) => v.jobRequisitionId === retractModalFptk.id);
    if (linkedVac) {
      updateVacancy(linkedVac.id, {
        status: 'Ditutup',
      });
    }

    setToastFeedback(`FPTK ${retractModalFptk.reqNumber} (${retractModalFptk.position}) berhasil dicabut (Retracted).`);
    setRetractModalFptk(null);
    setRetractReason('');
  };

  const handleCvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setUploadedCv({
      name: file.name,
      size: fileSizeStr,
    });

    // If candidate name empty, extract from filename
    if (!candName) {
      const clean = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/^(cv|resume)[_\-\s]+/i, '')
        .replace(/[_\-]+/g, ' ')
        .trim();
      if (clean.length > 2) {
        setCandName(clean.replace(/\b\w/g, (l) => l.toUpperCase()));
      }
    }

    // Simulate AI & OCR parsing
    setIsExtractingCv(true);
    setTimeout(() => {
      setIsExtractingCv(false);
      setExtractedPreview({
        summary: 'Kandidat memiliki rekam jejak kerja yang kuat di bidang terkait, adaptif dengan sistem kerja agile, dan memiliki sertifikasi profesional terverifikasi.',
        skills: ['Analisis Sistem', 'Problem Solving', 'Komunikasi Efektif', 'Manajemen Waktu', 'Kolaborasi Tim'],
        experienceYears: Math.floor(2 + Math.random() * 4),
        education: 'S1 Sarjana',
        score: Math.floor(88 + Math.random() * 10),
      });
      setToastFeedback(`Berkas CV '${file.name}' berhasil diunggah & diekstrak otomatis!`);
    }, 600);
  };

  const handleSaveIncomingCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName.trim()) {
      setToastFeedback('Nama lengkap pelamar wajib diisi.');
      return;
    }

    const targetVac = vacancies.find((v) => v.id === candVacancyId) || vacancies[0];
    const newCandEmail = candEmail.trim() || `${candName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    const fileName = uploadedCv?.name || `CV_${candName.replace(/\s+/g, '_')}.pdf`;
    const fileSize = uploadedCv?.size || '1.2 MB';

    addCandidate({
      jobVacancyId: targetVac?.id || 'job-1',
      name: candName.trim(),
      email: newCandEmail,
      phone: candPhone.trim(),
      lastCompany: candCompany.trim() || 'Perusahaan Sebelumnya',
      expectedSalary: Number(candSalary) || 16000000,
      stage: 'Incoming',
      sourcePortal: (candSource as any) || 'Website Karir Internal',
      resumeParsed: true,
      cvFileName: fileName,
      cvFileSize: fileSize,
      parsedData: {
        fullName: candName.trim(),
        email: newCandEmail,
        phone: candPhone.trim(),
        currentTitle: targetVac?.title || 'Professional Specialist',
        currentCompany: candCompany.trim() || 'Previous Company',
        totalExperienceYears: extractedPreview?.experienceYears || 3,
        education: extractedPreview?.education || 'S1 Sarjana',
        university: 'Universitas Terkemuka',
        topSkills: extractedPreview?.skills || ['Problem Solving', 'Komunikasi', 'Analisis Data'],
        extractionScore: extractedPreview?.score || 94,
        parsedAt: new Date().toISOString().split('T')[0],
      },
    });

    setIsCandidateModalOpen(false);
    setToastFeedback(`Pelamar '${candName.trim()}' berhasil ditambahkan ke tahap Incoming (Parsed)!`);
    resetCandidateModal();
  };

  const handleSendApprovalReminder = (signatoryName: string, roleTitle: string) => {
    setToastFeedback(`Pengingat (Approval Reminder) berhasil dikirimkan ke ${roleTitle}: ${signatoryName}.`);
  };

  const handleBlastAllReminders = (req: JobRequisition) => {
    setToastFeedback(`Pengingat notifikasi berhasil dikirimkan ke semua pihak terkait (${req.signatories?.length || 1} pihak: Mengetahui & Menyetujui) untuk FPTK ${req.reqNumber}.`);
  };

  const handleConvertFptkToVacancy = (req: JobRequisition) => {
    setActiveRequisition(req);
    setVacTitle(req.position);
    setVacDept(req.department);
    setVacGrade(req.grade);
    setVacOpenings(req.headcount);
    setVacExp(req.minExperience || '3+ Tahun');
    setVacSalary('Rp 15.000.000 - Rp 22.000.000');

    // Auto-compose requirements from FPTK details
    let reqText = req.requirements || '';
    if (req.educationLevel || req.educationMajor || req.skills) {
      reqText = [
        `• Pendidikan: Minimal ${req.educationLevel || 'S1'} Jurusan ${req.educationMajor || 'Terkait'}`,
        `• Pengalaman Kerja: Minimal ${req.minExperience || '3+ Tahun'} di posisi setara`,
        `• Keterampilan Teknis & Keahlian: ${req.skills || 'Sesuai standar kompetensi divisi'}`,
        req.otherRequirements ? `• Persyaratan Tambahan: ${req.otherRequirements}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }
    setVacRequirements(reqText);

    // Auto-compose external job description wording
    const descText = req.mainResponsibilities
      ? `Ringkasan Tugas & Tanggung Jawab Utama:\n${req.mainResponsibilities}\n\nPosisi ini akan berkolaborasi erat dengan tim ${req.department} untuk memastikan tercapainya target operasional dan keberhasilan strategi perusahaan.`
      : `Membuka kesempatan berkarir untuk posisi ${req.position} jenjang ${req.grade} pada Departemen ${req.department}. Kebutuhan formasi: ${req.headcount} orang.`;
    setVacDescription(descText);

    setVacLinkedReqId(req.id);
    setIsSalaryMasked(true);
    setShowSalaryPublicly(false);
    setVacModalTab('form');
    setIsVacancyModalOpen(true);
  };

  const isInterviewPassed = (candidate: Candidate | null | undefined): boolean => {
    if (!candidate) return false;
    if (candidate.stage === 'Offered' || candidate.stage === 'Hired') return true;

    if (candidate.interviewEvaluations && candidate.interviewEvaluations.length > 0) {
      const latest = candidate.interviewEvaluations[candidate.interviewEvaluations.length - 1];
      return latest.recommendation === 'Direkomendasikan Lolos';
    }

    if (candidate.interviewScorecard?.recommendation) {
      return candidate.interviewScorecard.recommendation === 'Direkomendasikan Lolos';
    }

    if (
      candidate.interviewScore &&
      candidate.interviewScore >= 80 &&
      candidate.interviewNotes?.toLowerCase().includes('lolos')
    ) {
      return true;
    }

    return false;
  };

  const getInterviewStatusInfo = (candidate: Candidate | null | undefined) => {
    if (!candidate) {
      return {
        passed: false,
        statusLabel: 'Belum Ada Data',
        reason: 'Data kandidat tidak ditemukan.',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      };
    }

    const rec =
      candidate.interviewEvaluations?.[candidate.interviewEvaluations.length - 1]?.recommendation ||
      candidate.interviewScorecard?.recommendation;

    if (rec === 'Direkomendasikan Lolos') {
      return {
        passed: true,
        statusLabel: 'Lolos Wawancara (Direkomendasikan)',
        reason:
          'Kandidat telah dievaluasi oleh tim pewawancara dan dinyatakan memenuhi standar kompetensi serta budaya kerja untuk diberikan surat penawaran kerja (Offering Letter).',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    }

    if (rec === 'Dipertimbangkan') {
      return {
        passed: false,
        statusLabel: 'Dipertimbangkan (Hold / Talent Pool)',
        reason:
          'Hasil evaluasi wawancara kandidat masih berstatus "Dipertimbangkan" dan belum disetujui untuk penerbitan surat penawaran kerja resmi. Diperlukan review lanjutan oleh Hiring Manager.',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    }

    if (rec === 'Tidak Direkomendasikan') {
      return {
        passed: false,
        statusLabel: 'Tidak Direkomendasikan Lolos',
        reason:
          'Tim pewawancara / User Lead memberikan rekomendasi tidak lolos pada sesi wawancara. Dokumen penawaran kerja (Offering Letter) tidak dapat diterbitkan.',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      };
    }

    if (candidate.interviewDate) {
      return {
        passed: false,
        statusLabel: 'Wawancara Terjadwal (Belum Dinilai)',
        reason:
          'Wawancara telah dijadwalkan, namun formulir scorecard evaluasi dan rekomendasi kelulusan belum diisi oleh tim pewawancara.',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      };
    }

    return {
      passed: false,
      statusLabel: 'Belum Dilakukan Wawancara',
      reason:
        'Kandidat belum melewati tahap wawancara dengan User Lead / Tim HR. SOP rekrutmen melarang pembuatan surat penawaran kerja tanpa adanya bukti kelulusan wawancara yang sah.',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  const handleOpenOfferingModal = (candidate: Candidate) => {
    if (!isInterviewPassed(candidate)) {
      setOfferingGateCandidate(candidate);
      return;
    }
    setActiveCandidate(candidate);
    const seq = candidates.filter((c) => c.stage === 'Offered' || c.stage === 'Hired').length + 1;
    const code = safeTenant.code || 'NTM';
    setDocNumber(`${String(seq).padStart(3, '0')}/OL-HRD/${code}/X/2026`);
    const salary = candidate.offeredSalary || candidate.expectedSalary || 15000000;
    setComponents((prev) => ({
      ...prev,
      basicSalary: Math.round(salary * 0.75),
      fixedAllowance: Math.round(salary * 0.1),
    }));
    setTargetAmount(salary);
    setIsOfferingModalOpen(true);
  };

  const currentSelectedTest = React.useMemo(() => {
    return (
      competencyTestTypes.find((t) => t.id === selectedTestTypeId) ||
      competencyTestTypes[0] ||
      INITIAL_COMPETENCY_TEST_TYPES[0]
    );
  }, [competencyTestTypes, selectedTestTypeId]);

  const calculatedCompositeScore = React.useMemo(() => {
    if (!currentSelectedTest) return 85;
    const id = currentSelectedTest.id;
    const cat = currentSelectedTest.category;
    const name = currentSelectedTest.name.toLowerCase();

    if (id === 'test-tech' || cat === 'Hard Skill' || name.includes('teknis') || name.includes('coding')) {
      return Math.round(
        (Number(techArchitectureScore || 0) +
          Number(techAlgorithmScore || 0) +
          Number(techProblemSolvingScore || 0)) /
          3
      );
    }
    if (
      id === 'test-psych' ||
      cat === 'Soft Skill' ||
      name.includes('psiko') ||
      name.includes('disc') ||
      name.includes('mbti')
    ) {
      return Math.round(
        (Number(psychAttentionToDetail || 0) +
          Number(psychEmotionalStability || 0) +
          Number(psychLeadership || 0)) /
          3
      );
    }
    if (
      id === 'test-cognitive' ||
      cat === 'Kognitif & Logika' ||
      name.includes('logika') ||
      name.includes('numerik') ||
      name.includes('gma')
    ) {
      return Math.round(
        (Number(logicSyllogismScore || 0) +
          Number(logicNumericalScore || 0) +
          Number(logicSpatialScore || 0)) /
          3
      );
    }
    if (
      id === 'test-lang' ||
      cat === 'Bahasa' ||
      name.includes('bahasa') ||
      name.includes('inggris') ||
      name.includes('english')
    ) {
      return Math.round(
        (Number(langListeningScore || 0) +
          Number(langReadingScore || 0) +
          Number(langSpeakingScore || 0) +
          Number(langWritingScore || 0)) /
          4
      );
    }
    if (
      id === 'test-case' ||
      cat === 'Studi Kasus' ||
      name.includes('case') ||
      name.includes('presentasi')
    ) {
      return Math.round(
        (Number(caseProblemAnalysis || 0) +
          Number(caseSolutionFeasibility || 0) +
          Number(casePresentationSkill || 0)) /
          3
      );
    }
    if (
      id === 'test-work' ||
      cat === 'Praktik Kerja' ||
      name.includes('praktik') ||
      name.includes('work sample')
    ) {
      return Math.round(
        (Number(workExecutionQuality || 0) +
          Number(workSpeedAccuracy || 0) +
          Number(workSopCompliance || 0)) /
          3
      );
    }
    return Math.round(
      (Number(customCriteria1 || 0) +
        Number(customCriteria2 || 0) +
        Number(customCriteria3 || 0)) /
        3
    );
  }, [
    currentSelectedTest,
    techArchitectureScore,
    techAlgorithmScore,
    techProblemSolvingScore,
    psychAttentionToDetail,
    psychEmotionalStability,
    psychLeadership,
    logicSyllogismScore,
    logicNumericalScore,
    logicSpatialScore,
    langListeningScore,
    langReadingScore,
    langSpeakingScore,
    langWritingScore,
    caseProblemAnalysis,
    caseSolutionFeasibility,
    casePresentationSkill,
    workExecutionQuality,
    workSpeedAccuracy,
    workSopCompliance,
    customCriteria1,
    customCriteria2,
    customCriteria3,
  ]);

  const getTestSaveButtonConfig = (test: CompetencyTestTypeSetting | undefined) => {
    if (!test) {
      return {
        label: 'Simpan Nilai Tes Kompetensi',
        icon: Award,
        colorClass: 'bg-blue-700 hover:bg-blue-800 text-white',
      };
    }
    const id = test.id;
    const cat = test.category;
    const name = test.name.toLowerCase();

    if (id === 'test-tech' || cat === 'Hard Skill' || name.includes('teknis') || name.includes('coding')) {
      return {
        label: 'Simpan Nilai Tes Teknis & Coding',
        icon: Code,
        colorClass: 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-500/20',
      };
    }
    if (
      id === 'test-psych' ||
      cat === 'Soft Skill' ||
      name.includes('psiko') ||
      name.includes('disc') ||
      name.includes('mbti')
    ) {
      return {
        label: 'Simpan Hasil Psikotes & Kepribadian',
        icon: Brain,
        colorClass: 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-indigo-500/20',
      };
    }
    if (
      id === 'test-cognitive' ||
      cat === 'Kognitif & Logika' ||
      name.includes('logika') ||
      name.includes('numerik') ||
      name.includes('gma')
    ) {
      return {
        label: 'Simpan Skor Tes Logika & Numerik',
        icon: Binary,
        colorClass: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-500/20',
      };
    }
    if (id === 'test-lang' || cat === 'Bahasa' || name.includes('bahasa') || name.includes('inggris')) {
      return {
        label: 'Simpan Skor Kemahiran Bahasa Inggris',
        icon: Languages,
        colorClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
      };
    }
    if (id === 'test-case' || cat === 'Studi Kasus' || name.includes('case') || name.includes('presentasi')) {
      return {
        label: 'Simpan Evaluasi Case Study & Presentasi',
        icon: Briefcase,
        colorClass: 'bg-cyan-700 hover:bg-cyan-800 text-white shadow-cyan-500/20',
      };
    }
    if (id === 'test-work' || cat === 'Praktik Kerja' || name.includes('praktik')) {
      return {
        label: 'Simpan Hasil Uji Praktik Kerja Langsung',
        icon: FileCheck2,
        colorClass: 'bg-rose-700 hover:bg-rose-800 text-white shadow-rose-500/20',
      };
    }
    return {
      label: `Simpan Nilai ${test.name}`,
      icon: Award,
      colorClass: 'bg-violet-700 hover:bg-violet-800 text-white shadow-violet-500/20',
    };
  };

  const handleOpenAssessmentModal = (candidate: Candidate) => {
    setActiveCandidate(candidate);
    const defaultTest = competencyTestTypes[0] || INITIAL_COMPETENCY_TEST_TYPES[0];
    setSelectedTestTypeId(defaultTest?.id || 'test-tech');
    setEvaluatorName(currentUser?.name ? `${currentUser.name} (HR / Asesor)` : 'Tim Asesor Kompetensi');
    setTestPassingGradeInput(defaultTest?.passingGrade || 75);
    setTestNotesInput('');
    setIsAssessmentModalOpen(true);
  };

  const handleSelectTestTypeInModal = (typeId: string) => {
    setSelectedTestTypeId(typeId);
    const targetTest = competencyTestTypes.find((t) => t.id === typeId);
    if (targetTest) {
      setTestPassingGradeInput(targetTest.passingGrade);
    }
  };

  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate) return;

    const targetTest =
      competencyTestTypes.find((t) => t.id === selectedTestTypeId) ||
      competencyTestTypes[0] ||
      INITIAL_COMPETENCY_TEST_TYPES[0];
    const isPassing = calculatedCompositeScore >= testPassingGradeInput;

    let details: Record<string, any> = {};
    const id = targetTest.id;
    const cat = targetTest.category;
    const name = targetTest.name.toLowerCase();

    if (id === 'test-tech' || cat === 'Hard Skill' || name.includes('teknis')) {
      details = {
        architectureScore: techArchitectureScore,
        algorithmScore: techAlgorithmScore,
        problemSolvingScore: techProblemSolvingScore,
        executionMinutes: techExecutionMinutes,
        repoUrl: techRepoUrl,
      };
    } else if (id === 'test-psych' || cat === 'Soft Skill' || name.includes('psiko')) {
      details = {
        profileType: psychProfileType,
        attentionToDetail: psychAttentionToDetail,
        emotionalStability: psychEmotionalStability,
        leadership: psychLeadership,
        recommendation: psychRecommendation,
      };
    } else if (id === 'test-cognitive' || cat === 'Kognitif & Logika' || name.includes('logika')) {
      details = {
        correctAnswers: logicCorrectAnswers,
        totalQuestions: logicTotalQuestions,
        syllogismScore: logicSyllogismScore,
        numericalScore: logicNumericalScore,
        spatialScore: logicSpatialScore,
      };
    } else if (id === 'test-lang' || cat === 'Bahasa' || name.includes('bahasa')) {
      details = {
        listeningScore: langListeningScore,
        readingScore: langReadingScore,
        speakingScore: langSpeakingScore,
        writingScore: langWritingScore,
        certificateEquiv: langCertificateEquiv,
      };
    } else if (id === 'test-case' || cat === 'Studi Kasus' || name.includes('case')) {
      details = {
        problemAnalysis: caseProblemAnalysis,
        solutionFeasibility: caseSolutionFeasibility,
        presentationSkill: casePresentationSkill,
        slideUrl: caseSlideUrl,
      };
    } else if (id === 'test-work' || cat === 'Praktik Kerja' || name.includes('praktik')) {
      details = {
        executionQuality: workExecutionQuality,
        speedAccuracy: workSpeedAccuracy,
        sopCompliance: workSopCompliance,
        proofUrl: workProofUrl,
      };
    } else {
      details = {
        criteria1: customCriteria1,
        criteria2: customCriteria2,
        criteria3: customCriteria3,
      };
    }

    saveCandidateCompetencyScore(activeCandidate.id, {
      testTypeId: targetTest.id,
      testTypeName: targetTest.name,
      category: targetTest.category,
      score: calculatedCompositeScore,
      passingGrade: testPassingGradeInput,
      status: isPassing ? 'Lulus' : 'Tidak Lulus',
      evaluator: evaluatorName,
      notes:
        testNotesInput ||
        `Skor ${calculatedCompositeScore}/100 pada ${targetTest.name}. Hasil: ${
          isPassing ? 'Lulus Passing Grade' : 'Di Bawah Passing Grade'
        }.`,
      details,
    });

    updateCandidateStage(activeCandidate.id, 'Assessment');
    setToastFeedback(`Nilai "${targetTest.name}" berhasil disimpan untuk ${activeCandidate.name}!`);
    setTestNotesInput('');
  };

  const handleOpenAddTestType = () => {
    setEditingTestType(null);
    setTestFormName('');
    setTestFormCategory('Hard Skill');
    setTestFormPassingGrade(75);
    setTestFormDuration(60);
    setTestFormMethod('Online Test');
    setTestFormWeight(20);
    setTestFormDesc('');
    setTestFormIsActive(true);
    setIsAddingTestType(true);
  };

  const handleOpenEditTestType = (test: CompetencyTestTypeSetting) => {
    setEditingTestType(test);
    setTestFormName(test.name);
    setTestFormCategory(test.category);
    setTestFormPassingGrade(test.passingGrade);
    setTestFormDuration(test.durationMinutes);
    setTestFormMethod(test.method);
    setTestFormWeight(test.weightPercent || 15);
    setTestFormDesc(test.description || '');
    setTestFormIsActive(test.isActive);
    setIsAddingTestType(true);
  };

  const handleSaveTestTypeForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testFormName.trim()) return;

    if (editingTestType) {
      updateCompetencyTestType(editingTestType.id, {
        name: testFormName.trim(),
        category: testFormCategory,
        passingGrade: Number(testFormPassingGrade),
        durationMinutes: Number(testFormDuration),
        method: testFormMethod,
        weightPercent: Number(testFormWeight),
        description: testFormDesc.trim(),
        isActive: testFormIsActive,
      });
      setToastFeedback(`Jenis tes "${testFormName}" berhasil diperbarui!`);
    } else {
      addCompetencyTestType({
        name: testFormName.trim(),
        category: testFormCategory,
        passingGrade: Number(testFormPassingGrade),
        durationMinutes: Number(testFormDuration),
        method: testFormMethod,
        weightPercent: Number(testFormWeight),
        description: testFormDesc.trim(),
        isActive: testFormIsActive,
      });
      setToastFeedback(`Jenis tes baru "${testFormName}" berhasil ditambahkan ke katalog!`);
    }
    setIsAddingTestType(false);
    setEditingTestType(null);
  };

  const handleDeleteTestTypeAction = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus jenis tes "${name}"?`)) {
      deleteCompetencyTestType(id);
      setToastFeedback(`Jenis tes "${name}" telah dihapus.`);
    }
  };

  const handleResetTestTypesAction = () => {
    if (window.confirm('Kembalikan seluruh jenis tes kompetensi ke standar default Nusantara HRMS?')) {
      resetCompetencyTestTypes();
      setToastFeedback('Katalog jenis tes telah di-reset ke standar default.');
    }
  };

  const currentSelectedInterviewType = React.useMemo(() => {
    return (
      interviewTypeSettings.find((i) => i.id === selectedInterviewTypeId) ||
      interviewTypeSettings[0] ||
      INITIAL_INTERVIEW_TYPES[0]
    );
  }, [interviewTypeSettings, selectedInterviewTypeId]);

  const handleOpenInterviewModal = (candidate: Candidate) => {
    setActiveCandidate(candidate);
    const defaultType =
      interviewTypeSettings.find((i) => i.id === candidate.interviewTypeId) ||
      interviewTypeSettings[0] ||
      INITIAL_INTERVIEW_TYPES[0];
    const initialTypeId = defaultType?.id || 'int-tech';
    setSelectedInterviewTypeId(initialTypeId);
    setInterviewDate(candidate.interviewDate || '2026-10-24 14:00');
    setInterviewTimeEnd(candidate.interviewTimeEnd || '15:00');
    setCandidateAttendanceStatus(candidate.candidateAttendanceStatus || (candidate.interviewDate ? 'Terkonfirmasi Hadir' : 'Menunggu Respon'));

    // Smart Sequential Lifecycle Tab Selection:
    // 1. Jika sudah ada evaluasi / scorecard terisi -> Buka Tab 3 (Scorecard)
    // 2. Jika sudah ada jadwal tapi menunggu konfirmasi/hari-H -> Buka Tab 2 (Feedback Konfirmasi & Hari-H)
    // 3. Jika belum dijadwalkan -> Buka Tab 1 (Penjadwalan & Tim Panel)
    if (candidate.interviewScore || candidate.interviewScorecard?.ratings) {
      setInterviewActiveTab('scorecard');
    } else if (candidate.interviewDate) {
      setInterviewActiveTab('feedback');
    } else {
      setInterviewActiveTab('schedule');
    }

    // Setup multi-interviewers
    if (candidate.interviewers && candidate.interviewers.length > 0) {
      setAssignedInterviewers(candidate.interviewers);
      setInterviewerName(candidate.interviewers.map((i) => i.name).join(', '));
    } else {
      const defaultInterviewers: AssignedInterviewer[] = [
        {
          id: 'inv-lead-user',
          name: candidate.interviewer || (currentUser?.name ? `${currentUser.name}` : 'Aditya Pratama, M.Psi.'),
          title: 'Head of People & Organization',
          department: 'Human Resources',
          email: 'aditya.pratama@nusantara.id',
          role: 'Lead Interviewer / HRBP',
          status: 'Terkonfirmasi',
        },
        {
          id: 'inv-tech-lead',
          name: 'Budi Santoso, S.Kom.',
          title: 'Lead Technical User / Engineering',
          department: 'Technology & AI',
          email: 'budi.santoso@nusantara.id',
          role: 'User Interviewer (Departemen)',
          status: 'Terkonfirmasi',
        },
      ];
      setAssignedInterviewers(defaultInterviewers);
      setInterviewerName(defaultInterviewers.map((i) => i.name).join(', '));
    }

    setInterviewPlatform(candidate.meetingPlatform || 'Google Meet');
    setInterviewMeetingLink(candidate.meetingLink || 'https://meet.google.com/xyz-ntm-hr');
    setUserRecommendation(candidate.userRecommendation || 'Sangat Cocok / Direkomendasikan (Strong Hire)');
    setRescheduleReason(candidate.rescheduleReason || 'Permintaan Kandidat (Penyesuaian Jadwal)');
    setRescheduleNotes('');

    // Populate ratings from candidate if exists, or default each criterion to 4
    const initialRatings: Record<string, number> = {};
    if (candidate.interviewScorecard?.ratings) {
      Object.assign(initialRatings, candidate.interviewScorecard.ratings);
    }
    defaultType?.criteria.forEach((crit) => {
      if (!initialRatings[crit.id]) {
        initialRatings[crit.id] = 4;
      }
    });
    setScorecardRatings(initialRatings);

    setInterviewRec(candidate.interviewScorecard?.recommendation || 'Direkomendasikan Lolos');
    setInterviewNotes(candidate.interviewNotes || '');
    setIsInterviewModalOpen(true);
  };

  const handleSelectInterviewTypeInModal = (typeId: string) => {
    setSelectedInterviewTypeId(typeId);
    const target = interviewTypeSettings.find((i) => i.id === typeId);
    if (target) {
      setScorecardRatings((prev) => {
        const next = { ...prev };
        target.criteria.forEach((c) => {
          if (!next[c.id]) next[c.id] = 4;
        });
        return next;
      });
    }
  };

  const handleSetCriterionRating = (criterionId: string, rating: number) => {
    setScorecardRatings((prev) => ({
      ...prev,
      [criterionId]: rating,
    }));
  };

  // Add an interviewer from company employees
  const handleAddInterviewer = (emp: { id: string; name: string; title: string; department: string; email: string }) => {
    if (assignedInterviewers.some((inv) => inv.email.toLowerCase() === emp.email.toLowerCase() || inv.name === emp.name)) {
      setToastFeedback(`${emp.name} sudah terdaftar sebagai pewawancara.`);
      return;
    }
    const newInv: AssignedInterviewer = {
      id: `inv-${Date.now()}-${emp.id}`,
      employeeId: emp.id,
      name: emp.name,
      title: emp.title,
      department: emp.department,
      email: emp.email,
      role: 'Panelis User / Pewawancara',
      status: 'Terkonfirmasi',
    };
    const updated = [...assignedInterviewers, newInv];
    setAssignedInterviewers(updated);
    setInterviewerName(updated.map((i) => i.name).join(', '));
    setToastFeedback(`${emp.name} ditambahkan ke tim pewawancara.`);
    setIsInterviewerSelectorOpen(false);
  };

  // Remove an interviewer
  const handleRemoveInterviewer = (interviewerId: string) => {
    if (assignedInterviewers.length <= 1) {
      setToastFeedback('Minimal harus ada satu pewawancara yang ditugaskan.');
      return;
    }
    const updated = assignedInterviewers.filter((inv) => inv.id !== interviewerId);
    setAssignedInterviewers(updated);
    setInterviewerName(updated.map((i) => i.name).join(', '));
  };

  // Live average star calculation for current selected interview type
  const calculatedInterviewScore = React.useMemo(() => {
    if (!currentSelectedInterviewType || !currentSelectedInterviewType.criteria.length) {
      return { averageStars: 4.0, totalScore: 80 };
    }
    const criteria = currentSelectedInterviewType.criteria;
    let sum = 0;
    criteria.forEach((c) => {
      sum += (scorecardRatings[c.id] || 4);
    });
    const avgStars = Number((sum / criteria.length).toFixed(2));
    const scoreOutOf100 = Math.round((avgStars / 5) * 100);
    return { averageStars: avgStars, totalScore: scoreOutOf100 };
  }, [currentSelectedInterviewType, scorecardRatings]);

  // Objective Rule-Based Decision Matrix (Non-AI, Formulaic & Auditable)
  const systemObjectiveEvaluation = React.useMemo(() => {
    if (!activeCandidate) return null;

    // 1. Nilai Tes Asesmen / Tes Teknis (Nilai riil kandidat atau rata-rata skor kompetensi)
    const testScore = typeof activeCandidate.testScore === 'number'
      ? activeCandidate.testScore
      : (activeCandidate.competencyScores && activeCandidate.competencyScores.length > 0
          ? Math.round(activeCandidate.competencyScores.reduce((acc, c) => acc + c.score, 0) / activeCandidate.competencyScores.length)
          : 85);

    // 2. Nilai Wawancara (dari scorecard saat ini)
    const interviewScore = calculatedInterviewScore.totalScore;

    // 3. Bobot Baku Perusahaan: Tes Kemampuan (40%) + Evaluasi Wawancara Panel (60%)
    const compositeScore = Math.round((testScore * 0.40) + (interviewScore * 0.60));
    const passingGrade = 75;

    // 4. Matrix Kelulusan Objektif
    const isUserPositive =
      userRecommendation.includes('Sangat Cocok') ||
      userRecommendation.includes('Cocok') ||
      userRecommendation.includes('Strong Hire') ||
      userRecommendation.includes('Hire') ||
      interviewRec === 'Direkomendasikan Lolos';

    const isUserNegative =
      userRecommendation.includes('Kurang Cocok') ||
      userRecommendation.includes('Tidak Direkomendasikan') ||
      interviewRec === 'Tidak Direkomendasikan';

    let status: 'Sangat Direkomendasikan' | 'Dipertimbangkan' | 'Tidak Direkomendasikan' = 'Dipertimbangkan';
    let rationale = '';

    if (compositeScore >= 80 && isUserPositive) {
      status = 'Sangat Direkomendasikan';
      rationale = `Kandidat melampaui passing grade (${compositeScore}/100 [Tes: ${testScore}, Wawancara: ${interviewScore}]) dengan konsensus penilaian sangat positif dari Tim User & HR. Sangat layak untuk segera diterbitkan penawaran kerja (Offering Letter).`;
    } else if (compositeScore >= passingGrade && !isUserNegative) {
      status = 'Dipertimbangkan';
      rationale = `Kandidat memenuhi passing grade minimum (${compositeScore}/100 >= ${passingGrade}). Rekomendasi user: "${userRecommendation}". Disarankan review bersama Hiring Manager sebelum penerbitan offering.`;
    } else {
      status = 'Tidak Direkomendasikan';
      rationale = `Kandidat belum memenuhi standar objektif (${compositeScore}/100 < ${passingGrade}) atau tim user pewawancara memberikan evaluasi kurang cocok. SOP menyarankan tidak melanjutkan ke tahap offering letter.`;
    }

    return {
      testScore,
      interviewScore,
      compositeScore,
      passingGrade,
      status,
      rationale,
      isApproved: status === 'Sangat Direkomendasikan' || (status === 'Dipertimbangkan' && compositeScore >= passingGrade && !isUserNegative),
    };
  }, [activeCandidate, calculatedInterviewScore.totalScore, userRecommendation, interviewRec]);

  // Handler for Rescheduling Interview
  const handleConfirmReschedule = () => {
    if (!activeCandidate) return;

    const previousDate = activeCandidate.interviewDate || 'Belum Dijadwalkan';
    const newSchedule = `${interviewDate}`;

    const newHistoryEntry = {
      previousDate,
      newDate: newSchedule,
      reason: rescheduleReason + (rescheduleNotes ? ` - Catatan: ${rescheduleNotes}` : ''),
      requestedBy: currentUser?.name || 'HR Recruitment Specialist',
      rescheduledAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const updatedHistory = [...(activeCandidate.rescheduleHistory || []), newHistoryEntry];

    updateCandidateStage(activeCandidate.id, 'Interview', {
      interviewDate: newSchedule,
      interviewTimeEnd,
      interviewScheduleStatus: 'Jadwal Diperbarui',
      rescheduleReason,
      rescheduleHistory: updatedHistory,
      interviewers: assignedInterviewers,
      interviewer: assignedInterviewers.map((i) => i.name).join(', '),
    });

    setToastFeedback(
      `Jadwal wawancara ${activeCandidate.name} berhasil di-reschedule ke ${newSchedule} (${interviewTimeEnd} WIB)! Notifikasi dan calendar invitation baru telah dikirimkan ke kandidat dan ${assignedInterviewers.length} pewawancara.`
    );
    setInterviewActiveTab('scorecard');
  };

  const handleSaveInterview = () => {
    if (!activeCandidate || !currentSelectedInterviewType) return;

    const interviewerNames = assignedInterviewers.map((i) => i.name).join(', ');

    saveCandidateInterviewEvaluation(activeCandidate.id, {
      interviewTypeId: currentSelectedInterviewType.id,
      interviewTypeName: currentSelectedInterviewType.name,
      interviewDate,
      interviewer: interviewerNames,
      platform: interviewPlatform,
      meetingLink: interviewMeetingLink,
      scorecardRatings,
      averageStars: calculatedInterviewScore.averageStars,
      calculatedScore: calculatedInterviewScore.totalScore,
      recommendation: interviewRec,
      notes:
        interviewNotes ||
        `Scorecard wawancara "${currentSelectedInterviewType.name}": Rata-rata ${calculatedInterviewScore.averageStars} / 5.0 (${calculatedInterviewScore.totalScore}/100). Rekomendasi User: ${userRecommendation}.`,
    });

    updateCandidateStage(activeCandidate.id, 'Interview', {
      interviewDate,
      interviewTimeEnd,
      interviewer: interviewerNames,
      interviewers: assignedInterviewers,
      meetingPlatform: interviewPlatform,
      meetingLink: interviewMeetingLink,
      candidateAttendanceStatus,
      interviewScore: calculatedInterviewScore.totalScore,
      interviewNotes,
      userRecommendation,
      systemObjectiveRecommendation: systemObjectiveEvaluation ? {
        compositeScore: systemObjectiveEvaluation.compositeScore,
        testScore: systemObjectiveEvaluation.testScore,
        interviewScore: systemObjectiveEvaluation.interviewScore,
        status: systemObjectiveEvaluation.status,
        rationale: systemObjectiveEvaluation.rationale,
      } : undefined,
      interviewTypeId: currentSelectedInterviewType.id,
      interviewTypeName: currentSelectedInterviewType.name,
      interviewScorecard: {
        ratings: scorecardRatings,
        recommendation: interviewRec,
      },
    });

    setToastFeedback(
      `Scorecard wawancara "${currentSelectedInterviewType.name}" berhasil disimpan untuk ${activeCandidate.name}! Notifikasi konfirmasi terkirim ke ${assignedInterviewers.length} pewawancara.`
    );
    setIsInterviewModalOpen(false);
  };

  // Direct Transition to Offering from Interview Modal
  const handleProceedToOfferingFromInterview = () => {
    if (!activeCandidate || !currentSelectedInterviewType) return;

    const interviewerNames = assignedInterviewers.map((i) => i.name).join(', ');

    // 1. Save interview evaluation
    saveCandidateInterviewEvaluation(activeCandidate.id, {
      interviewTypeId: currentSelectedInterviewType.id,
      interviewTypeName: currentSelectedInterviewType.name,
      interviewDate,
      interviewer: interviewerNames,
      platform: interviewPlatform,
      meetingLink: interviewMeetingLink,
      scorecardRatings,
      averageStars: calculatedInterviewScore.averageStars,
      calculatedScore: calculatedInterviewScore.totalScore,
      recommendation: interviewRec,
      notes: interviewNotes || `Lulus wawancara dengan skor ${calculatedInterviewScore.totalScore}/100. Rekomendasi: ${userRecommendation}. Lanjut ke proses penawaran kerja (Offering).`,
    });

    // 2. Advance candidate to Offered stage
    updateCandidateStage(activeCandidate.id, 'Offered', {
      interviewDate,
      interviewTimeEnd,
      interviewer: interviewerNames,
      interviewers: assignedInterviewers,
      meetingPlatform: interviewPlatform,
      meetingLink: interviewMeetingLink,
      interviewScore: calculatedInterviewScore.totalScore,
      interviewNotes,
      userRecommendation,
      systemObjectiveRecommendation: systemObjectiveEvaluation ? {
        compositeScore: systemObjectiveEvaluation.compositeScore,
        testScore: systemObjectiveEvaluation.testScore,
        interviewScore: systemObjectiveEvaluation.interviewScore,
        status: systemObjectiveEvaluation.status,
        rationale: systemObjectiveEvaluation.rationale,
      } : undefined,
      interviewTypeId: currentSelectedInterviewType.id,
      interviewTypeName: currentSelectedInterviewType.name,
      interviewScorecard: {
        ratings: scorecardRatings,
        recommendation: interviewRec,
      },
    });

    setIsInterviewModalOpen(false);
    setToastFeedback(
      `Hasil wawancara ${activeCandidate.name} memenuhi syarat! Kandidat dipindahkan ke tahap Offering Letter.`
    );

    // 3. Immediately open offering modal with prefilled data
    handleOpenOfferingModal({
      ...activeCandidate,
      stage: 'Offered',
      interviewScore: calculatedInterviewScore.totalScore,
    });
  };

  // Master Interview Settings Handlers
  const handleOpenAddInterviewType = () => {
    setEditingInterviewType(null);
    setInterviewFormName('');
    setInterviewFormTargetRole('Semua Posisi');
    setInterviewFormInterviewerRoles('User Lead / HRBP');
    setInterviewFormDesc('');
    setInterviewFormCriteria([
      {
        id: `crit-${Date.now()}-1`,
        name: 'Aspek Kompetensi Utama Posisi',
        description: 'Tingkat penguasaan keahlian spesifik yang dipersyaratkan posisi ini.',
        weightPercent: 40,
      },
      {
        id: `crit-${Date.now()}-2`,
        name: 'Etos Kerja & Kolaborasi Tim',
        description: 'Sikap profesional, kemampuan bekerja dalam tim, dan inisiatif solutif.',
        weightPercent: 30,
      },
      {
        id: `crit-${Date.now()}-3`,
        name: 'Komunikasi & Adaptabilitas',
        description: 'Kejelasan bertutur dan kemampuan beradaptasi dengan budaya Nusantara.',
        weightPercent: 30,
      },
    ]);
    setInterviewFormIsActive(true);
    setIsAddingInterviewType(true);
  };

  const handleOpenEditInterviewType = (type: InterviewTypeSetting) => {
    setEditingInterviewType(type);
    setInterviewFormName(type.name);
    setInterviewFormTargetRole(type.targetRole || 'Semua Posisi');
    setInterviewFormInterviewerRoles(type.interviewerRoles || 'User Lead / HRBP');
    setInterviewFormDesc(type.description || '');
    setInterviewFormCriteria([...type.criteria]);
    setInterviewFormIsActive(type.isActive);
    setIsAddingInterviewType(true);
  };

  const handleAddCriterionToForm = () => {
    if (!newCritName.trim()) return;
    const newCrit: InterviewScorecardCriterion = {
      id: `crit-${Date.now()}`,
      name: newCritName.trim(),
      description: newCritDesc.trim() || undefined,
      weightPercent: Number(newCritWeight) || 25,
    };
    setInterviewFormCriteria((prev) => [...prev, newCrit]);
    setNewCritName('');
    setNewCritDesc('');
    setNewCritWeight(25);
  };

  const handleRemoveCriterionFromForm = (criterionId: string) => {
    setInterviewFormCriteria((prev) => prev.filter((c) => c.id !== criterionId));
  };

  const handleSaveInterviewTypeForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewFormName.trim()) return;
    if (interviewFormCriteria.length === 0) {
      alert('Mohon tambahkan minimal 1 item kriteria scorecard untuk jenis wawancara ini.');
      return;
    }

    if (editingInterviewType) {
      updateInterviewType(editingInterviewType.id, {
        name: interviewFormName.trim(),
        targetRole: interviewFormTargetRole.trim(),
        interviewerRoles: interviewFormInterviewerRoles.trim(),
        description: interviewFormDesc.trim(),
        criteria: interviewFormCriteria,
        isActive: interviewFormIsActive,
      });
      setToastFeedback(`Format wawancara "${interviewFormName}" berhasil diperbarui!`);
    } else {
      addInterviewType({
        name: interviewFormName.trim(),
        targetRole: interviewFormTargetRole.trim(),
        interviewerRoles: interviewFormInterviewerRoles.trim(),
        description: interviewFormDesc.trim(),
        criteria: interviewFormCriteria,
        isActive: interviewFormIsActive,
      });
      setToastFeedback(`Format wawancara baru "${interviewFormName}" berhasil ditambahkan!`);
    }
    setIsAddingInterviewType(false);
    setEditingInterviewType(null);
  };

  const handleDeleteInterviewTypeAction = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus format wawancara "${name}"?`)) {
      deleteInterviewType(id);
      setToastFeedback(`Format wawancara "${name}" telah dihapus.`);
    }
  };

  const handleResetInterviewTypesAction = () => {
    if (window.confirm('Kembalikan seluruh format scorecard wawancara ke standar default Nusantara HRMS?')) {
      resetInterviewTypes();
      setToastFeedback('Katalog format wawancara telah di-reset ke standar default.');
    }
  };

  const handlePromoteToOffering = (candidate: Candidate) => {
    if (!isInterviewPassed(candidate)) {
      setOfferingGateCandidate(candidate);
      return;
    }
    handleOpenOfferingModal(candidate);
  };

  const handleSendOffering = () => {
    if (!activeCandidate) return;
    setOfferingFormError(null);

    if (!isInterviewPassed(activeCandidate)) {
      setOfferingFormError('Penerbitan surat penawaran kerja ditolak: Rekam jejak kelulusan wawancara kandidat belum terverifikasi Lolos.');
      return;
    }

    if (!docNumber.trim()) {
      setOfferingFormError('Nomor dokumen offering letter resmi wajib diisi.');
      return;
    }
    if (!targetJoinDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetJoinDate)) {
      setOfferingFormError('Target tanggal mulai bekerja (join date) tidak valid (format YYYY-MM-DD).');
      return;
    }
    const tenantUmr = safeTenant.umr || 3000000;
    if (components.basicSalary < tenantUmr) {
      setOfferingFormError(`Gaji pokok penawaran minimal setara UMR ${safeTenant.city || 'DKI Jakarta'} (${formatRupiah(tenantUmr)}).`);
      return;
    }

    // Terbitkan dokumen offering (status: Draft / Baru Terbit)
    updateCandidateStage(activeCandidate.id, 'Offered', {
      offeredSalary: grossMonthly,
      offeringDocNumber: docNumber,
      offeringStatus: 'Draft',
    });
    setActiveCandidate((prev) =>
      prev
        ? {
            ...prev,
            stage: 'Offered',
            offeredSalary: grossMonthly,
            offeringDocNumber: docNumber,
            offeringStatus: 'Draft',
          }
        : null
    );
    setIsOfferingModalOpen(false);
    setIsOfferingDocPreviewOpen(true);
    setToastFeedback(`Dokumen Surat Penawaran Kerja (${docNumber}) berhasil diterbitkan! Silakan preview dan kirim ke calon karyawan.`);
  };

  const handleSendOfferingToCandidate = (candidate: Candidate) => {
    const todayStr = new Date().toISOString().split('T')[0];
    updateCandidateStage(candidate.id, 'Offered', {
      offeringStatus: 'Terkirim',
      offeringSentDate: todayStr,
    });
    setActiveCandidate((prev) =>
      prev?.id === candidate.id
        ? {
            ...prev,
            offeringStatus: 'Terkirim',
            offeringSentDate: todayStr,
          }
        : prev
    );
    setToastFeedback(
      `Surat Penawaran Kerja (${candidate.offeringDocNumber || docNumber}) berhasil dikirim ke ${candidate.email}! Menunggu respon balasan (Cocok / Nego / Tidak Cocok) dari kandidat.`
    );
  };

  const handleRecordCandidateResponse = (
    candidate: Candidate,
    response: 'Cocok' | 'Nego' | 'Tidak Cocok',
    notes?: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newStatus: Candidate['offeringStatus'] =
      response === 'Cocok' ? 'Diterima' : response === 'Nego' ? 'Negosiasi' : 'Ditolak';

    updateCandidateStage(candidate.id, 'Offered', {
      offeringStatus: newStatus,
      offeringCandidateResponse: response,
      offeringResponseNotes: notes !== undefined ? notes : candidate.offeringResponseNotes || '',
      offeringResponseDate: todayStr,
    });
    setActiveCandidate((prev) =>
      prev?.id === candidate.id
        ? {
            ...prev,
            offeringStatus: newStatus,
            offeringCandidateResponse: response,
            offeringResponseNotes: notes !== undefined ? notes : prev.offeringResponseNotes || '',
            offeringResponseDate: todayStr,
          }
        : prev
    );
    setToastFeedback(
      `Balasan calon karyawan '${response.toUpperCase()}' berhasil dicatat! Keputusan akhir (Hired / Tolak / Revisi) kini siap diproses.`
    );
  };

  const handleConfirmHired = (candidate: Candidate) => {
    const vac = vacancies.find((v) => v.id === candidate.jobVacancyId);
    const pos = vac?.title || 'Senior Specialist';
    const dept = vac?.department || 'Engineering';

    const activeTemplates =
      onboardingChecklistTemplates && onboardingChecklistTemplates.length > 0
        ? onboardingChecklistTemplates
        : DEFAULT_ONBOARDING_CHECKLIST_TEMPLATES;

    const dynamicTasks: OnboardingTask[] = activeTemplates.map((tmpl, idx) => ({
      id: `task-${tmpl.id}-${Date.now()}-${idx}`,
      title: tmpl.title,
      category: tmpl.category,
      targetDepartment: tmpl.targetDepartment,
      verificationType: tmpl.verificationType,
      actionType: tmpl.actionType,
      isMandatory: tmpl.isMandatory,
      isCompleted: false,
      assignedRole:
        tmpl.targetDepartment === 'GA'
          ? 'ga_admin'
          : tmpl.targetDepartment === 'IT'
          ? 'it_admin'
          : tmpl.targetDepartment === 'Finance'
          ? 'payroll_admin'
          : 'hr_admin',
    }));

    addOnboardingProcess({
      type: 'via_recruitment',
      candidateId: candidate.id,
      employeeName: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      position: pos,
      department: dept,
      employmentType: vac?.employmentType || 'Kontrak',
      joinDate: candidate.joinedDate || targetJoinDate || '2026-11-01',
      basicSalary: candidate.offeredSalary ? Math.round(candidate.offeredSalary * 0.75) : components.basicSalary,
      contractDocNumber: candidate.offeringDocNumber || docNumber,
      tasks: dynamicTasks,
    });

    updateCandidateStage(candidate.id, 'Hired', {
      joinedDate: candidate.joinedDate || targetJoinDate || '2026-11-01',
    });
    alert(`Keputusan Resmi: ${candidate.name} DITERIMA (HIRED)! Data ditransfer ke Tab On Boarding.`);
    setActiveTab('onboarding');
  };

  const handleConfirmDisqualified = (candidate: Candidate, reason: string) => {
    const vac = vacancies.find((v) => v.id === candidate.jobVacancyId);
    updateCandidateStage(candidate.id, 'TalentPool', {
      disqualificationReason: reason || 'Kandidat belum sesuai dengan kuota formasi saat ini. Disimpan di Talent Pool untuk masa depan.',
      talentPoolCategory: vac?.department || 'General Talent',
      talentPoolTags: candidate.parsedData?.topSkills || ['Potensial', 'Disimpan'],
    });
    setCandidateToDisqualify(null);
    setRejectionReasonInput('');
    alert(`Keputusan: ${candidate.name} DITOLAK pada posisi ini dan dipindahkan ke Tab Talent Pool.`);
  };

  const handleReengageTalent = (candidate: Candidate) => {
    updateCandidateStage(candidate.id, 'Screening', {
      screeningNotes: 'Kandidat dipanggil ulang dari Talent Pool untuk proses seleksi aktif.',
    });
    alert(`${candidate.name} berhasil diaktifkan kembali ke Tab Pipeline Seleksi (Tahap Screening)!`);
    setActiveTab('pipeline');
  };

  // ===================== SUMMARY DASHBOARD METRICS =====================
  const totalRequisitions = jobRequisitions.length;
  const pendingRequisitions = jobRequisitions.filter((r) => r.status === 'Menunggu Approval').length;
  const approvedRequisitions = jobRequisitions.filter((r) => r.status === 'Disetujui').length;
  const totalHeadcountRequested = jobRequisitions.reduce((sum, r) => sum + (r.headcount || 1), 0);

  const openVacanciesCount = vacancies.filter((v) => v.status === 'Buka').length;

  const incomingCount = candidates.filter((c) => c.stage === 'Incoming').length;
  const screeningCount = candidates.filter((c) => c.stage === 'Screening').length;
  const assessmentCount = candidates.filter((c) => c.stage === 'Assessment').length;
  const interviewCount = candidates.filter((c) => c.stage === 'Interview').length;
  const pipelineTotalCount = incomingCount + screeningCount + assessmentCount + interviewCount;

  const offeringCount = candidates.filter((c) => c.stage === 'Offered').length;
  const hiredCount = candidates.filter((c) => c.stage === 'Hired').length;
  const disqualifiedCount = candidates.filter((c) => c.stage === 'Rejected').length;
  const talentPoolCount = candidates.filter(
    (c) => c.stage === 'TalentPool' || c.stage === 'Rejected'
  ).length;

  return (
    <div className="space-y-4">
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-700" />
            <span>Manajemen Rekrutmen, Seleksi & Onboarding</span>
          </h2>
          <p className="text-xs text-slate-500">
            Tata kelola alur rekrutmen terpisah: Permintaan FPTK, Lowongan Sourcing, Pipeline Seleksi, Offering Letter, Keputusan Hired/Disqualified, On Boarding, & Talent Pool.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setIsRequisitionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Ajukan FPTK</span>
          </button>
          <button
            onClick={() => setIsCandidateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs border border-slate-300 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-700" />
            <span>+ Tambah Pelamar</span>
          </button>
        </div>
      </div>

      {/* ===================== EXECUTIVE SUMMARY DASHBOARD ===================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: FPTK */}
        <div
          onClick={() => setActiveTab('fptk')}
          className={`cursor-pointer rounded-xl p-3 border transition-all hover:shadow-xs flex flex-col justify-between ${
            activeTab === 'fptk'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">1. FPTK Kebutuhan</span>
            <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {totalHeadcountRequested} <span className="text-xs font-normal text-slate-500">Formasi</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500 flex-wrap">
              <span className="font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200/50">
                {pendingRequisitions} Pending
              </span>
              <span>•</span>
              <span className="text-slate-600">{approvedRequisitions} Disetujui</span>
            </div>
          </div>
        </div>

        {/* Card 2: Lowongan Terpublikasi (Publish) */}
        <div
          onClick={() => setActiveTab('sourcing')}
          className={`cursor-pointer rounded-xl p-3 border transition-all hover:shadow-xs flex flex-col justify-between ${
            activeTab === 'sourcing'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">2. Lowongan Terpublikasi</span>
            <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
              <Globe className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {openVacanciesCount} <span className="text-xs font-normal text-slate-500">Lowongan Aktif</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-500 truncate">
              Multi-Portal Terpublikasi
            </div>
          </div>
        </div>

        {/* Card 3: Pipeline Seleksi */}
        <div
          onClick={() => setActiveTab('pipeline')}
          className={`cursor-pointer rounded-xl p-3 border transition-all hover:shadow-xs flex flex-col justify-between ${
            activeTab === 'pipeline'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">3. Pipeline Seleksi</span>
            <div className="w-6 h-6 rounded-md bg-sky-100 flex items-center justify-center text-sky-700 shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {pipelineTotalCount} <span className="text-xs font-normal text-slate-500">Kandidat</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-mono flex-wrap">
              <span title="Incoming" className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">In:{incomingCount}</span>
              <span title="Screening" className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Sc:{screeningCount}</span>
              <span title="Assessment" className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">As:{assessmentCount}</span>
              <span title="Interview" className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-bold">Int:{interviewCount}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Offering */}
        <div
          onClick={() => setActiveTab('offering')}
          className={`cursor-pointer rounded-xl p-3 border transition-all hover:shadow-xs flex flex-col justify-between ${
            activeTab === 'offering'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">4. Offering Letter</span>
            <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Calculator className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {offeringCount} <span className="text-xs font-normal text-slate-500">Offering</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-500 truncate">
              Kalkulator THP & SK QR
            </div>
          </div>
        </div>

        {/* Card 5: Hired & Onboarding */}
        <div
          onClick={() => setActiveTab('decision')}
          className={`cursor-pointer rounded-xl p-3 border transition-all hover:shadow-xs flex flex-col justify-between ${
            activeTab === 'decision' || activeTab === 'onboarding'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">5. Hired / Onboard</span>
            <div className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-teal-800 font-mono">
              {hiredCount} <span className="text-xs font-normal text-slate-500">Hired</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
              <span>{disqualifiedCount} Ditolak</span>
              <span>•</span>
              <span className="text-teal-700 font-semibold">Orientasi</span>
            </div>
          </div>
        </div>

        {/* Card 6: Talent Pool */}
        <div
          onClick={() => setActiveTab('talent_pool')}
          className={`cursor-pointer rounded-xl p-3 border transition-all hover:shadow-xs flex flex-col justify-between ${
            activeTab === 'talent_pool'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">7. Talent Pool</span>
            <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {talentPoolCount} <span className="text-xs font-normal text-slate-500">Talenta</span>
            </div>
            <div className="mt-1 text-[10px] text-purple-700 font-medium truncate">
              Siap Re-engage
            </div>
          </div>
        </div>
      </div>

      {/* ===================== ROW 2: 7 EXPLICIT SEPARATED TABS PER USER ARCHITECTURE ===================== */}
      <ScrollableTabNav className="border-b border-slate-200" containerClassName="pt-1">
        <button
          onClick={() => setActiveTab('fptk')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'fptk'
              ? 'border-blue-700 text-blue-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>1. Permintaan FPTK</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'fptk' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {jobRequisitions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sourcing')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'sourcing'
              ? 'border-blue-700 text-blue-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>2. Lowongan & Sourcing</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'sourcing' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {vacancies.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'pipeline'
              ? 'border-blue-700 text-blue-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>3. Pipeline Seleksi</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'pipeline' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {pipelineCandidates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('offering')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'offering'
              ? 'border-blue-700 text-blue-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>4. Offering</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'offering' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {offeringCandidates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('decision')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'decision'
              ? 'border-blue-700 text-blue-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>5. Hired / Disqualified</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'decision' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {decisionCandidates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('onboarding')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'onboarding'
              ? 'border-blue-700 text-blue-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>6. On Boarding</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'onboarding' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {hiredCandidates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('talent_pool')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'talent_pool'
              ? 'border-blue-700 text-blue-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>7. Talent Pool</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'talent_pool' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {talentPoolCandidates.length}
          </span>
        </button>
      </ScrollableTabNav>

      {/* ===================== TAB 1: PERMINTAAN FPTK ===================== */}
      {activeTab === 'fptk' && (
        <div className="space-y-4">
          {/* Header Action Banner */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 border border-slate-200 rounded-xl shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-700" />
                <span>Tab 1: Formulir Permintaan Tenaga Kerja (FPTK / Job Requisition)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Otorisasi kebutuhan formasi baru: rentang grade, kualifikasi, struktur supervisi, justifikasi kebutuhan, dan approval berjenjang.
              </p>
            </div>
            <button
              onClick={() => setIsRequisitionModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Ajukan FPTK Baru</span>
            </button>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nomor FPTK, posisi jabatan, atau departemen..."
                value={fptkSearch}
                onChange={(e) => setFptkSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
              {fptkSearch && (
                <button
                  onClick={() => setFptkSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(['Semua', 'Menunggu Approval', 'Disetujui', 'Dicabut (Retracted)', 'Ditolak', 'Dibatalkan'] as const).map((st) => {
                  const count =
                    st === 'Semua'
                      ? jobRequisitions.length
                      : jobRequisitions.filter((r) => r.status === st).length;
                  return (
                    <button
                      key={st}
                      onClick={() => setFptkStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        fptkStatusFilter === st
                          ? 'bg-white text-blue-700 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Budget Filter */}
              <select
                value={fptkBudgetFilter}
                onChange={(e) => setFptkBudgetFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="Semua">Semua Anggaran</option>
                <option value="Budgeted">Budgeted (RKAP)</option>
                <option value="Unbudgeted">Unbudgeted</option>
              </select>
            </div>
          </div>

          {/* RESPONSIVE FPTK LISTING */}
          {(() => {
            const filtered = jobRequisitions.filter((req) => {
              const matchSearch =
                !fptkSearch ||
                req.position.toLowerCase().includes(fptkSearch.toLowerCase()) ||
                req.reqNumber.toLowerCase().includes(fptkSearch.toLowerCase()) ||
                req.department.toLowerCase().includes(fptkSearch.toLowerCase());
              const matchStatus = fptkStatusFilter === 'Semua' || req.status === fptkStatusFilter;
              const matchBudget =
                fptkBudgetFilter === 'Semua' ||
                (fptkBudgetFilter === 'Budgeted' ? req.isBudgeted !== false : req.isBudgeted === false);
              return matchSearch && matchStatus && matchBudget;
            });

            if (filtered.length === 0) {
              return (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-2xs">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-medium text-slate-600 text-xs">Tidak ada dokumen FPTK yang sesuai filter</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Coba sesuaikan kata kunci pencarian atau status filter di atas.
                  </p>
                </div>
              );
            }

            return (
              <>
                {/* 1. TAMPILAN MOBILE & TABLET (RESPONSIVE CARDS) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 xl:hidden">
                  {filtered.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => setPreviewFptk(req)}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer space-y-3"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{req.reqNumber}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            Diajukan: {req.createdAt} • Oleh: {req.requesterName.split(' ')[0]}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              req.isBudgeted !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            }`}
                          >
                            {req.isBudgeted !== false ? 'Budgeted' : 'Unbudgeted'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'Disetujui'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : req.status === 'Menunggu Approval'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : req.status === 'Dicabut (Retracted)'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : req.status === 'Dibatalkan'
                                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                req.status === 'Disetujui'
                                  ? 'bg-emerald-500'
                                  : req.status === 'Menunggu Approval'
                                  ? 'bg-amber-500 animate-pulse'
                                  : req.status === 'Dicabut (Retracted)'
                                  ? 'bg-amber-600'
                                  : 'bg-rose-500'
                              }`}
                            />
                            <span>{req.status}</span>
                          </span>
                        </div>
                      </div>

                      {/* Main Position Info */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{req.position}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{req.department}</span>
                          {req.reportingToTitle && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500 truncate">Lapor: {req.reportingToTitle}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Quick Specs Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-1 xl:grid-cols-3 gap-2 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Jenjang Grade</span>
                          <span className="font-semibold text-slate-800 truncate block" title={req.grade}>
                            {req.grade}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Kebutuhan</span>
                          <span className="font-bold text-slate-900">{req.headcount} Formasi</span>
                        </div>
                        <div className="col-span-2 md:col-span-1 xl:col-span-1 min-w-0">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Target Masuk</span>
                          <span className="font-mono text-slate-800">{req.targetJoinDate}</span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div
                        className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setTrackingFptk(req)}
                          className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Lacak Alur ({req.signatories?.length || 1} Pihak)</span>
                        </button>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {req.status === 'Menunggu Approval' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCancelRequisition(req.id)}
                                className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-colors flex items-center gap-1"
                                title="Batalkan & Tarik Kembali Pengajuan"
                              >
                                <XCircle className="w-3 h-3 text-rose-500" />
                                <span>Batalkan</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectFptk(req.id)}
                                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-300 transition-colors"
                              >
                                Tolak
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveFptk(req.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                <span>Setujui</span>
                              </button>
                            </>
                          )}

                          {req.status === 'Disetujui' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenRetractModal(req)}
                                className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-800 rounded-lg text-xs font-semibold border border-amber-300 flex items-center gap-1 transition-colors shadow-2xs"
                                title="Retract / Cabut Pengajuan FPTK yang Sudah Disetujui"
                              >
                                <Undo2 className="w-3 h-3 text-amber-600" />
                                <span>Retract</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConvertFptkToVacancy(req)}
                                className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                              >
                                <Globe className="w-3 h-3" />
                                <span>Sebar Lowongan →</span>
                              </button>
                            </div>
                          )}

                          {req.status === 'Dicabut (Retracted)' && (
                            <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                              <Undo2 className="w-3 h-3 text-amber-600" />
                              <span>Dicabut (Retracted)</span>
                            </span>
                          )}

                          {req.status === 'Dibatalkan' && (
                            <span className="text-[10px] text-slate-400 italic">Dibatalkan</span>
                          )}

                          {req.status === 'Ditolak' && (
                            <span className="text-[10px] text-rose-600 font-medium">Ditolak</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. TAMPILAN DESKTOP (SPACIOUS DATA TABLE DENGAN ACTION SHELF DI BAWAH ROW TANPA HEADER AKSI) */}
                <div className="hidden xl:block bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3.5 px-4 font-bold text-slate-700">No. Dokumen & Anggaran</th>
                          <th className="py-3.5 px-4 font-bold text-slate-700">Posisi & Departemen</th>
                          <th className="py-3.5 px-4 font-bold text-slate-700">Jenjang Grade</th>
                          <th className="py-3.5 px-4 font-bold text-slate-700">Formasi & Kebutuhan</th>
                          <th className="py-3.5 px-4 font-bold text-slate-700">Target Masuk</th>
                          <th className="py-3.5 px-4 font-bold text-slate-700 text-center">Status FPTK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filtered.map((req) => (
                          <React.Fragment key={req.id}>
                            {/* Baris Utama Data FPTK */}
                            <tr
                              className="hover:bg-blue-50/40 transition-colors group cursor-pointer border-t border-slate-100"
                              onClick={() => setPreviewFptk(req)}
                              title="Klik baris untuk melihat Lembar FPTK Resmi"
                            >
                              <td className="py-3.5 px-4">
                                <div className="font-mono font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                                  {req.reqNumber}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      req.isBudgeted !== false
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                    }`}
                                  >
                                    {req.isBudgeted !== false ? 'Budgeted (RKAP)' : 'Unbudgeted'}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {req.createdAt}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900 text-xs group-hover:text-blue-700 transition-colors">
                                  {req.position}
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{req.department}</span>
                                  {req.reportingToTitle && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="text-slate-400 truncate max-w-[150px]" title={`Melapor ke: ${req.reportingToTitle}`}>
                                        Lapor: {req.reportingToTitle}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/70 whitespace-nowrap">
                                  {req.grade}
                                </span>
                                {req.supervisedStaffCount !== undefined && req.supervisedStaffCount > 0 && (
                                  <span className="block text-[10px] text-slate-400 mt-1">
                                    Supervisi: {req.supervisedStaffCount} staf
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-900 flex items-center gap-1">
                                  <Users className="w-3 h-3 text-slate-400" />
                                  <span>{req.headcount} Formasi</span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  <span>{req.reason}</span>
                                  {req.replacementFor && (
                                    <span className="block text-[10px] text-slate-400 italic truncate max-w-[140px]" title={req.replacementFor}>
                                      Gantikan: {req.replacementFor}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1 text-slate-700 font-mono text-xs">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>{req.targetJoinDate}</span>
                                </div>
                                <span className="block text-[10px] text-slate-400 mt-0.5">
                                  Oleh: {req.requesterName.split(' ')[0]}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                    req.status === 'Disetujui'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : req.status === 'Menunggu Approval'
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                      : req.status === 'Dicabut (Retracted)'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : req.status === 'Dibatalkan'
                                      ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      req.status === 'Disetujui'
                                        ? 'bg-emerald-500'
                                        : req.status === 'Menunggu Approval'
                                        ? 'bg-amber-500 animate-pulse'
                                        : req.status === 'Dicabut (Retracted)'
                                        ? 'bg-amber-600'
                                        : req.status === 'Dibatalkan'
                                        ? 'bg-slate-400'
                                        : 'bg-rose-500'
                                    }`}
                                  />
                                  <span>{req.status}</span>
                                </span>
                                {req.approvedBy && req.status === 'Disetujui' && (
                                  <span className="block text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px] mx-auto">
                                    Oleh: {req.approvedBy.split(' ')[0]}
                                  </span>
                                )}
                              </td>
                            </tr>

                            {/* Baris Aksi & Retrack Otorisasi di Bawah Row (Konsep Shelf Card) */}
                            <tr className="bg-slate-50/70 border-b border-slate-200/90">
                              <td colSpan={6} className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                  {/* Left: Alur Approval & Lacak */}
                                  <div className="flex items-center gap-2 flex-wrap text-xs">
                                    <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                      <Users className="w-3.5 h-3.5 text-blue-700" />
                                      <span>Alur Otorisasi:</span>
                                    </span>

                                    {req.signatories && req.signatories.length > 0 ? (
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {req.signatories.map((sig, idx) => (
                                          <span
                                            key={sig.id}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                                              req.status === 'Disetujui'
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                                                : req.status === 'Menunggu Approval'
                                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}
                                          >
                                            <span>{idx + 1}. {sig.role}: {sig.name.split(' ')[0]}</span>
                                            {req.status === 'Disetujui' && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">1 Pejabat Penyetuju</span>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => setTrackingFptk(req)}
                                      className="ml-1 text-blue-700 hover:text-blue-900 font-semibold text-[11px] flex items-center gap-1 hover:underline"
                                    >
                                      <History className="w-3.5 h-3.5 text-blue-700" />
                                      <span>Lacak Alur ({req.signatories?.length || 1} Pihak)</span>
                                    </button>
                                  </div>

                                  {/* Right: Actions */}
                                  <div className="flex items-center gap-2">
                                    {req.status === 'Menunggu Approval' && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleCancelRequisition(req.id)}
                                          className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 flex items-center gap-1.5 transition-colors shadow-2xs"
                                          title="Batalkan & Tarik Kembali Pengajuan FPTK"
                                        >
                                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                          <span>Batalkan Pengajuan</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRejectFptk(req.id)}
                                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
                                          title="Tolak Pengajuan FPTK"
                                        >
                                          <span>Tolak</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleApproveFptk(req.id)}
                                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
                                          title="Setujui Permintaan Tenaga Kerja"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Setujui</span>
                                        </button>
                                      </>
                                    )}

                                    {req.status === 'Disetujui' && (
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenRetractModal(req)}
                                          className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-800 rounded-lg text-xs font-semibold border border-amber-300 flex items-center gap-1.5 transition-colors shadow-2xs"
                                          title="Retract / Cabut Pengajuan FPTK yang Sudah Disetujui"
                                        >
                                          <Undo2 className="w-3.5 h-3.5 text-amber-600" />
                                          <span>Retract Pengajuan</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleConvertFptkToVacancy(req)}
                                          className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                                          title="Buka Lowongan dan Sebar ke Multi-Channel"
                                        >
                                          <Globe className="w-3.5 h-3.5" />
                                          <span>Sebar Lowongan →</span>
                                        </button>
                                      </div>
                                    )}

                                    {req.status === 'Dicabut (Retracted)' && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
                                          <Undo2 className="w-3.5 h-3.5 text-amber-600" />
                                          <span>Pengajuan Dicabut (Retracted)</span>
                                        </span>
                                      </div>
                                    )}

                                    {req.status === 'Dibatalkan' && (
                                      <span className="text-[11px] text-slate-500 italic flex items-center gap-1">
                                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Pengajuan telah dibatalkan oleh pemohon</span>
                                      </span>
                                    )}

                                    {req.status === 'Ditolak' && (
                                      <span className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                                        <X className="w-3.5 h-3.5" />
                                        <span>Ditolak: {req.approvalNotes || 'Tidak disetujui'}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ===================== TAB 2: LOWONGAN & SOURCING ===================== */}
      {activeTab === 'sourcing' && (
        <div className="space-y-4">
          {/* Header Banner: Strictly Process Tab */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 border border-slate-200 rounded-xl shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Tab 2: Proses Lowongan & Multi-Portal Sourcing
                </h3>
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                  Proses Berbasis FPTK
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Semua lowongan baru wajib diajukan dan disetujui melalui formulir <strong>FPTK di Tab 1</strong>. Di bagian ini, tim HR bertugas memproses FPTK yang disetujui, mengatur masking kisaran gaji internal, menyesuaikan wording eksternal, dan menyiarkannya ke portal lowongan (Jobstreet, LinkedIn, Glints, Kalibrr, Website Karir).
              </p>
            </div>
            <button
              onClick={() => setActiveTab('fptk')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-blue-700" />
              <span>Lihat Tab Permintaan FPTK</span>
            </button>
          </div>

          {/* ===================== ANTREAN FPTK DISETUJUI SIAP PROSES ===================== */}
          {(() => {
            const approvedFptks = jobRequisitions.filter((r) => r.status === 'Disetujui');
            return (
              <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border border-blue-200/80 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Antrean FPTK Disetujui (Siap Proses Publikasi Lowongan)</span>
                        <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                          {approvedFptks.length}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Permintaan tenaga kerja yang telah disetujui pejabat berwenang dan siap disiarkan ke portal eksternal.
                      </p>
                    </div>
                  </div>
                </div>

                {approvedFptks.length === 0 ? (
                  <div className="bg-white/80 border border-dashed border-blue-200 rounded-lg p-5 text-center">
                    <FileText className="w-8 h-8 text-blue-300 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-700">Belum ada FPTK berstatus Disetujui yang menunggu proses siar.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Silakan ajukan form FPTK baru atau selesaikan proses approval di Tab 1.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {approvedFptks.map((req) => {
                      const alreadyPublished = vacancies.some((v) => v.jobRequisitionId === req.id);
                      return (
                        <div
                          key={req.id}
                          className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-1.5">
                              <div>
                                <span className="font-bold text-slate-900 text-xs block leading-tight">
                                  {req.position}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {req.reqNumber}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                  alreadyPublished
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {alreadyPublished ? '✓ Terpublikasi' : 'Siap Siar'}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-600 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{req.department}</span>
                                <span className="text-slate-300">·</span>
                                <span className="font-semibold text-blue-700">{req.headcount} Orang</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>Target: {req.targetJoinDate || 'Segera'}</span>
                                <span className="text-slate-300">·</span>
                                <span className="text-slate-500">{req.minExperience || '3+ Thn'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>Budget Gaji:</span>
                                <span className="font-mono text-slate-700 font-semibold">•••••••••• (Masked)</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              Pemohon: {req.requesterName}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenRetractModal(req)}
                                className="px-2 py-1.5 bg-white hover:bg-amber-50 text-amber-800 rounded-md text-[11px] font-semibold border border-amber-300 transition-colors shadow-2xs"
                                title="Retract / Cabut Pengajuan FPTK"
                              >
                                <Undo2 className="w-3 h-3 text-amber-600" />
                                <span>Retract</span>
                              </button>
                              <button
                                onClick={() => handleConvertFptkToVacancy(req)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-[11px] font-semibold shadow-2xs transition-colors shrink-0"
                              >
                                <Send className="w-3 h-3" />
                                <span>Proses Publikasi</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Section Heading: Daftar Lowongan Terpublikasi */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-700" />
              <span>Daftar Lowongan Terpublikasi ({vacancies.length})</span>
            </h4>
            <span className="text-[11px] text-slate-500">
              Menampilkan lowongan aktif yang telah disiarkan ke multi-portal
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {vacancies.map((vac) => {
              const vacCandidates = candidates.filter((c) => c.jobVacancyId === vac.id);
              const activeChannelsList = vac.activeChannels || ['Jobstreet', 'LinkedIn', 'Website Karir'];

              return (
                <div
                  key={vac.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{vac.title}</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="font-medium text-slate-700">{vac.department}</span>
                          <span className="text-slate-300">•</span>
                          <span>{vac.employmentType}</span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap shrink-0">
                            {vac.grade || 'Staff'}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          vac.status === 'Buka'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {vac.status === 'Buka' ? '● Aktif Tayang' : 'Ditutup'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {vac.description || 'Bertanggung jawab atas operasional dan implementasi proyek korporat.'}
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Headcount</span>
                        <span className="font-bold text-slate-800">{vac.openings} Formasi</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Pengalaman</span>
                        <span className="font-bold text-slate-800">{vac.minExperience}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Kisaran Upah</span>
                        <span className="font-bold text-slate-800">{vac.salaryRange}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-slate-700 block">
                        Kanal Penyebaran Otomatis (Job Portals):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(['Jobstreet', 'LinkedIn', 'Glints', 'Kalibrr', 'Website Karir'] as JobPostingChannel[]).map(
                          (channel) => {
                            const isBroadcasted = activeChannelsList.includes(channel);
                            return (
                              <button
                                key={channel}
                                type="button"
                                onClick={() => {
                                  const updated = isBroadcasted
                                    ? activeChannelsList.filter((c) => c !== channel)
                                    : [...activeChannelsList, channel];
                                  updateVacancy(vac.id, { activeChannels: updated });
                                }}
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                                  isBroadcasted
                                    ? 'bg-blue-50 text-blue-800 border-blue-200 font-semibold'
                                    : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                                }`}
                              >
                                {isBroadcasted ? <Check className="w-3 h-3 text-blue-600" /> : <X className="w-3 h-3" />}
                                <span>{channel}</span>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Portal Karir Internal Box */}
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200/90 rounded-lg flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-blue-900 font-bold block leading-tight">
                          Website Karir Internal Perusahaan:
                        </span>
                        <span className="font-mono text-[11px] text-blue-800 truncate block select-all">
                          {`https://karir.${(safeTenant.name || 'nusantara').toLowerCase().replace(/\s+/g, '')}.id/jobs/${vac.id}`}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `https://karir.${(safeTenant.name || 'nusantara').toLowerCase().replace(/\s+/g, '')}.id/jobs/${vac.id}`;
                        navigator.clipboard?.writeText(url);
                        setToastFeedback(`Link website karir untuk '${vac.title}' berhasil disalin ke clipboard!`);
                      }}
                      className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-md text-[11px] font-semibold flex items-center gap-1 shrink-0 shadow-2xs transition-colors"
                      title="Salin Link Website Karir"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Salin Link</span>
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      Total Masuk: <strong className="text-slate-900 font-mono">{vacCandidates.length}</strong> Pelamar
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedVacancyId(vac.id);
                          setActiveTab('pipeline');
                        }}
                        className="px-2.5 py-1 text-blue-700 hover:bg-blue-50 rounded text-xs font-semibold"
                      >
                        Buka di Pipeline Seleksi →
                      </button>
                      <button
                        onClick={() => {
                          const url = `https://karir.${(safeTenant.name || 'nusantara').toLowerCase().replace(/\s+/g, '')}.id/jobs/${vac.id}`;
                          navigator.clipboard?.writeText(url);
                          setToastFeedback(`Tautan lamaran lowongan '${vac.title}' berhasil disalin ke clipboard!`);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1"
                        title="Salin Link Karir"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Share Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: PIPELINE SELEKSI (HANYA: INCOMING, SCREENING, ASSESSMENT, INTERVIEW) ===================== */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-700" />
                <span>Tab 3: Pipeline Seleksi Pelamar</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Alur seleksi teknis: 1. Incoming (Parsing CV) ➔ 2. Screening (Keyword Match) ➔ 3. Assessment (Tes) ➔ 4. Interview (User).
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap">
              <select
                value={selectedVacancyId}
                onChange={(e) => setSelectedVacancyId(e.target.value)}
                className="py-1.5 px-3 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium text-xs shadow-2xs"
              >
                <option value="all">Semua Lowongan ({vacancies.length})</option>
                {vacancies.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari kandidat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white shadow-2xs w-44"
                />
              </div>

              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setPipelineViewMode('board')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                    pipelineViewMode === 'board' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Papan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPipelineViewMode('table')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                    pipelineViewMode === 'table' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabel</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddingTestType(false);
                  setEditingTestType(null);
                  setIsTestSettingsModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                title="Kelola Master Jenis Tes Kompetensi, Passing Grade, Bobot & Metode Uji"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Pengaturan Jenis Tes</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAddingInterviewType(false);
                  setEditingInterviewType(null);
                  setIsInterviewSettingsModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                title="Kelola Master Format Wawancara & Kriteria Scorecard 1-5 Bintang"
              >
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Pengaturan Scorecard Wawancara</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetCandidateModal();
                  setIsCandidateModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg border border-blue-600 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                title="Upload CV Pelamar Secara Manual (PDF/Word/WA/Email) langsung ke Pipeline Incoming"
              >
                <UploadCloud className="w-3.5 h-3.5 text-blue-700" />
                <span>+ Upload CV Manual (Incoming)</span>
              </button>
            </div>
          </div>

          {/* 4 Clean Columns: Incoming -> Screening -> Assessment -> Interview */}
          {pipelineViewMode === 'board' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {selectionStages.map((stg) => {
                const stageCandidates = pipelineCandidates.filter((c) => isCandidateInStage(c, stg.stage));

                return (
                  <div
                    key={stg.stage}
                    className="bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col min-h-[520px]"
                  >
                    <div className={`p-3 border-b-2 ${stg.headerAccent} bg-slate-50/80 rounded-t-xl`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center justify-center font-mono">
                            {stg.number}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{stg.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {stg.stage === 'Incoming' && (
                            <button
                              type="button"
                              onClick={() => {
                                resetCandidateModal();
                                setIsCandidateModalOpen(true);
                              }}
                              className="px-2 py-0.5 rounded bg-blue-700 hover:bg-blue-800 text-white font-semibold text-[10px] shadow-2xs flex items-center gap-1 transition-colors"
                              title="Upload File CV & Tambah Pelamar Manual"
                            >
                              <UploadCloud className="w-3 h-3" />
                              <span>+ Upload CV</span>
                            </button>
                          )}
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${stg.badgeColor}`}>
                            {stageCandidates.length}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-1 leading-tight">
                        {stg.subtitle}
                      </span>
                    </div>

                    <div className="p-2.5 space-y-2.5 flex-1 bg-slate-50/40">
                      {stageCandidates.length === 0 ? (
                        stg.stage === 'Incoming' ? (
                          <div className="h-44 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 flex flex-col items-center justify-center p-4 text-center text-slate-600 text-[11px] space-y-2.5">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">Belum Ada CV di Incoming</p>
                              <p className="text-[10px] text-slate-500 max-w-[200px] mt-0.5">
                                Upload CV (PDF/DOCX) dari Email, WhatsApp, Google Form, atau Walk-In.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                resetCandidateModal();
                                setIsCandidateModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>Upload CV Sekarang</span>
                            </button>
                          </div>
                        ) : (
                          <div className="h-32 rounded-lg border border-dashed border-slate-200 flex flex-col items-center justify-center p-3 text-center text-slate-400 text-[11px]">
                            <span>Tidak ada pelamar</span>
                          </div>
                        )
                      ) : (
                        stageCandidates.map((candidate) => {
                          const vac = vacancies.find((v) => v.id === candidate.jobVacancyId);

                          return (
                            <div
                              key={candidate.id}
                              className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs hover:shadow-xs transition-shadow space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="min-w-0 flex-1">
                                  <span className="font-bold text-slate-900 text-xs block leading-tight truncate" title={candidate.name}>
                                    {candidate.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block truncate" title={candidate.lastCompany}>
                                    {candidate.lastCompany || 'Pelamar Baru'}
                                  </span>
                                </div>
                                {candidate.sourcePortal && (() => {
                                  const pCfg = getPortalBadgeConfig(candidate.sourcePortal);
                                  return (
                                    <span
                                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs whitespace-nowrap shrink-0 ${pCfg.badgeClass}`}
                                      title={`Sumber Pelamar: ${candidate.sourcePortal}`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dotClass} shrink-0`} />
                                      <span>{pCfg.label}</span>
                                    </span>
                                  );
                                })()}
                              </div>

                              <div className="text-[11px] space-y-0.5 bg-slate-50 p-2 rounded border border-slate-100">
                                <div className="font-semibold text-blue-950 truncate">{vac?.title || 'Posisi'}</div>
                                <div className="text-slate-500 text-[10px]">
                                  Ekspektasi: <span className="font-mono font-bold text-slate-800">{formatRupiah(candidate.expectedSalary)}</span>
                                </div>
                              </div>

                              {stg.stage === 'Incoming' && (
                                <div className="space-y-1.5 pt-0.5">
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-emerald-600" />
                                      <span>AI Resume Parsed</span>
                                    </span>
                                    <span className="font-mono text-slate-600 font-bold">
                                      {candidate.parsedData?.extractionScore || 95}%
                                    </span>
                                  </div>
                                  {candidate.parsedData && (
                                    <div className="flex flex-wrap gap-1">
                                      {candidate.parsedData.topSkills.slice(0, 3).map((skill, idx) => (
                                        <span key={idx} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {stg.stage === 'Screening' && (
                                <div className="space-y-1.5 pt-0.5">
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-slate-600 font-medium">Kesesuaian Kualifikasi:</span>
                                    <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-sky-50 text-sky-800 border border-sky-200">
                                      {candidate.aiMatchScore || 85}% Match
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 line-clamp-2">
                                    {candidate.screeningNotes || 'Kualifikasi cocok dengan requirement lowongan.'}
                                  </div>
                                </div>
                              )}

                              {stg.stage === 'Assessment' && (
                                <div className="space-y-1.5 pt-0.5">
                                  {candidate.competencyScores && candidate.competencyScores.length > 0 ? (
                                    <>
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-slate-600 font-medium">
                                          {candidate.competencyScores.length} Jenis Tes Selesai
                                        </span>
                                        <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                          Rata-rata: {candidate.testScore || 0}/100
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {candidate.competencyScores.map((sc) => (
                                          <span
                                            key={sc.id}
                                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold border ${
                                              sc.status === 'Lulus'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-rose-50 text-rose-700 border-rose-200'
                                            }`}
                                            title={`${sc.testTypeName}: ${sc.score}/100 (Min: ${sc.passingGrade}) - ${sc.status}`}
                                          >
                                            {sc.testTypeName.split('/')[0].trim()}: {sc.score}
                                          </span>
                                        ))}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-slate-600 font-medium truncate max-w-[110px]">
                                        {candidate.testType || 'Tes Teknis'}
                                      </span>
                                      <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                        Skor: {candidate.testScore || 0}/100
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-[10px] font-semibold flex items-center justify-between">
                                    <span className="text-slate-500">Status Kelulusan:</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        candidate.testStatus === 'Lulus'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : candidate.testStatus === 'Tidak Lulus'
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      {candidate.testStatus || 'Belum Ditugaskan'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {stg.stage === 'Interview' && (
                                <div className="space-y-1.5 pt-0.5 text-[10px]">
                                  <div className="flex items-center justify-between font-semibold">
                                    <span className="text-slate-700 flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-500" />
                                      <span>{candidate.interviewDate?.split(' ')[0] || 'Terjadwal'}</span>
                                    </span>
                                    {candidate.interviewScore ? (
                                      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                        ★ {candidate.interviewScore}/100
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic">Belum Dinilai</span>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between text-[9px]">
                                    <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold truncate max-w-[140px]">
                                      {candidate.interviewTypeName || 'Wawancara Kompetensi'}
                                    </span>
                                    {candidate.interviewEvaluations && candidate.interviewEvaluations.length > 1 && (
                                      <span className="text-slate-500 font-mono">
                                        {candidate.interviewEvaluations.length} Sesi
                                      </span>
                                    )}
                                  </div>

                                  {candidate.interviewScorecard?.recommendation && (
                                    <div className="text-[9px]">
                                      <span
                                        className={`inline-block px-1.5 py-0.5 rounded font-bold ${
                                          candidate.interviewScorecard.recommendation === 'Direkomendasikan Lolos'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : candidate.interviewScorecard.recommendation === 'Dipertimbangkan'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-rose-100 text-rose-800'
                                        }`}
                                      >
                                        {candidate.interviewScorecard.recommendation}
                                      </span>
                                    </div>
                                  )}

                                  {candidate.meetingLink && (
                                    <a
                                      href={candidate.meetingLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-700 hover:underline flex items-center gap-1 font-medium text-[10px] pt-0.5"
                                    >
                                      <Video className="w-3 h-3 text-blue-600 shrink-0" />
                                      <span className="truncate">
                                        {candidate.meetingPlatform || 'Google Meet'}: Link Video Call
                                      </span>
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                                {stg.stage === 'Incoming' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setActiveCandidate(candidate);
                                        setIsResumeParserModalOpen(true);
                                      }}
                                      className="w-full py-1 px-2 text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded flex items-center justify-center gap-1"
                                    >
                                      <FileText className="w-3 h-3" />
                                      <span>Lihat Hasil Parsing CV</span>
                                    </button>
                                    <button
                                      onClick={() => updateCandidateStage(candidate.id, 'Screening')}
                                      className="w-full py-1 text-[10px] font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded text-center"
                                    >
                                      Loloskan ke Screening →
                                    </button>
                                  </>
                                )}

                                {stg.stage === 'Screening' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setActiveCandidate(candidate);
                                        setIsScreeningModalOpen(true);
                                      }}
                                      className="w-full py-1 text-[11px] font-semibold bg-sky-50 text-sky-800 hover:bg-sky-100 rounded flex items-center justify-center gap-1"
                                    >
                                      <Sparkles className="w-3 h-3 text-sky-600" />
                                      <span>Detail Screening AI</span>
                                    </button>
                                    <button
                                      onClick={() => updateCandidateStage(candidate.id, 'Assessment')}
                                      className="w-full py-1 text-[10px] font-semibold bg-blue-700 text-white hover:bg-blue-800 rounded text-center"
                                    >
                                      Shortlist ke Tes Kompetensi →
                                    </button>
                                  </>
                                )}

                                {stg.stage === 'Assessment' && (
                                  <>
                                    <button
                                      onClick={() => handleOpenAssessmentModal(candidate)}
                                      className="w-full py-1 text-[11px] font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded flex items-center justify-center gap-1"
                                    >
                                      <Award className="w-3 h-3 text-amber-600" />
                                      <span>Input / Evaluasi Nilai Tes</span>
                                    </button>
                                    <button
                                      onClick={() => updateCandidateStage(candidate.id, 'Interview')}
                                      className="w-full py-1 text-[10px] font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded text-center"
                                    >
                                      Loloskan ke Wawancara (User) →
                                    </button>
                                  </>
                                )}

                                {stg.stage === 'Interview' && (() => {
                                  const passed = isInterviewPassed(candidate);
                                  const statusInfo = getInterviewStatusInfo(candidate);
                                  return (
                                    <>
                                      <button
                                        onClick={() => handleOpenInterviewModal(candidate)}
                                        className="w-full py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded flex items-center justify-center gap-1 transition-colors"
                                      >
                                        <Calendar className="w-3 h-3 text-emerald-600" />
                                        <span>Scorecard & Jadwal User</span>
                                      </button>
                                      {passed ? (
                                        <button
                                          onClick={() => handlePromoteToOffering(candidate)}
                                          className="w-full py-1.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded text-center flex items-center justify-center gap-1 shadow-2xs transition-colors"
                                          title="Kandidat telah dinyatakan Lolos Wawancara. Klik untuk buat surat penawaran kerja (Offering Letter)"
                                        >
                                          <CheckCircle className="w-3 h-3 shrink-0" />
                                          <span>Lanjut ke Tahap Offering →</span>
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => setOfferingGateCandidate(candidate)}
                                          className="w-full py-1.5 text-[10px] font-semibold bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-800 border border-slate-200 hover:border-amber-300 rounded text-center flex items-center justify-center gap-1 transition-colors group/btn"
                                          title={`Offering Terkunci: ${statusInfo.statusLabel}. Klik untuk detail validasi SOP.`}
                                        >
                                          <Lock className="w-3 h-3 text-slate-400 group-hover/btn:text-amber-600 shrink-0" />
                                          <span>Offering Terkunci (Belum Lolos)</span>
                                        </button>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Pelamar</th>
                    <th className="py-3 px-4">Posisi Lowongan</th>
                    <th className="py-3 px-4">Tahap Seleksi</th>
                    <th className="py-3 px-4">Hasil / Evaluasi</th>
                    <th className="py-3 px-4">Ekspektasi Upah</th>
                    <th className="py-3 px-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pipelineCandidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <span className="text-[10px] text-slate-500">{c.lastCompany}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {vacancies.find((v) => v.id === c.jobVacancyId)?.title}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          {c.stage === 'Applied' ? 'Incoming' : c.stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {c.stage === 'Screening' && `${c.aiMatchScore || 85}% Match`}
                        {c.stage === 'Assessment' && `Skor: ${c.testScore || 0}/100`}
                        {c.stage === 'Interview' && `★ ${c.interviewScore || 90}/100`}
                        {(c.stage === 'Incoming' || c.stage === 'Applied') && 'Resume Parsed'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {formatRupiah(c.expectedSalary)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (c.stage === 'Interview') handlePromoteToOffering(c);
                            else if (c.stage === 'Assessment') handleOpenAssessmentModal(c);
                            else if (c.stage === 'Screening') {
                              setActiveCandidate(c);
                              setIsScreeningModalOpen(true);
                            } else {
                              setActiveCandidate(c);
                              setIsResumeParserModalOpen(true);
                            }
                          }}
                          className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-[11px] font-semibold"
                        >
                          Proses →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 4: OFFERING (KALKULATOR OFFERING & KIRIM OFFERING) ===================== */}
      {activeTab === 'offering' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 border border-slate-200 rounded-xl shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-700" />
                <span>Tab 4: Offering (Kalkulator Offering & Kirim Offering Resmi)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulasi gaji kotor/bersih (Gross vs Nett THP), perhitungan resmi PPh 21 TER 2024, breakdown BPJS, dan penerbitan surat penawaran resmi berkop QR.
              </p>
            </div>
            {(() => {
              const interviewPassed = pipelineCandidates.filter(
                (c) => c.stage === 'Interview' && isInterviewPassed(c)
              );
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (interviewPassed.length === 0) {
                      const firstInterviewCand = pipelineCandidates.find((c) => c.stage === 'Interview');
                      setOfferingGateCandidate(
                        firstInterviewCand || {
                          id: 'dummy',
                          tenantId: safeTenant.id || 'tenant-ntm',
                          jobVacancyId: '',
                          name: 'Kandidat Wawancara',
                          email: '',
                          phone: '',
                          lastCompany: '',
                          expectedSalary: 0,
                          stage: 'Interview',
                          appliedDate: '',
                          sourcePortal: '',
                        }
                      );
                      return;
                    }
                    if (interviewPassed.length === 1) {
                      handleOpenOfferingModal(interviewPassed[0]);
                    } else {
                      setIsSelectOfferingCandidateModalOpen(true);
                    }
                  }}
                  className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Buat Offering Baru</span>
                  {interviewPassed.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono font-bold">
                      {interviewPassed.length} Lolos
                    </span>
                  )}
                </button>
              );
            })()}
          </div>

            {/* TAMPILAN MOBILE: Adaptive Cards (< md) */}
          <div className="md:hidden space-y-3">
            {offeringCandidates.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                Belum ada kandidat di tahap Offering. Silakan promosikan kandidat yang lolos tahap Interview.
              </div>
            ) : (
              offeringCandidates.map((c) => {
                const vacancy = vacancies.find((v) => v.id === c.jobVacancyId);
                return (
                  <div
                    key={`mob-off-${c.id}`}
                    onClick={() => {
                      setActiveCandidate(c);
                      setDocNumber(c.offeringDocNumber || '001/OL-HRD/NTM/X/2026');
                      setIsOfferingDocPreviewOpen(true);
                    }}
                    className="p-4 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl shadow-xs space-y-3 cursor-pointer hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-xs truncate">
                        {c.name}
                      </span>
                      {(!c.offeringStatus || c.offeringStatus === 'Draft') ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0 whitespace-nowrap shadow-2xs">
                          <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Draft (Siap Dikirim)</span>
                        </span>
                      ) : c.offeringStatus === 'Terkirim' && !c.offeringCandidateResponse ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0 whitespace-nowrap shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
                          <span>Terkirim (Menunggu Balasan)</span>
                        </span>
                      ) : c.offeringCandidateResponse === 'Cocok' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 whitespace-nowrap shadow-2xs">
                          <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Balasan: Cocok ✓</span>
                        </span>
                      ) : c.offeringCandidateResponse === 'Nego' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0 whitespace-nowrap shadow-2xs">
                          <RefreshCw className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Balasan: Nego ⇄</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 shrink-0 whitespace-nowrap shadow-2xs">
                          <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>Balasan: Tidak Cocok ✕</span>
                        </span>
                      )}
                    </div>

                    <div className="text-slate-600 text-xs font-medium">
                      Posisi: <b className="text-slate-900">{vacancy?.title || 'Posisi Jabatan'}</b>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg space-y-1 text-xs border border-slate-100 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">No. Dokumen:</span>
                        <span className="font-bold text-indigo-700">{c.offeringDocNumber || '001/OL-HRD/NTM/X/2026'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Gaji Ditawarkan:</span>
                        <span className="font-bold text-slate-900">{formatRupiah(c.offeredSalary || c.expectedSalary)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-sans">
                        <span>Tanggal Kirim:</span>
                        <span className="font-mono">{c.offeringSentDate || (c.offeringStatus === 'Terkirim' ? '2026-10-18' : 'Belum Dikirim')}</span>
                      </div>
                    </div>

                    {/* Bottom Card Footer Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 flex-wrap">
                      {(!c.offeringStatus || c.offeringStatus === 'Draft') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendOfferingToCandidate(c);
                          }}
                          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          <span>Kirim Offering</span>
                        </button>
                      )}

                      {c.offeringStatus === 'Terkirim' && !c.offeringCandidateResponse && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-semibold">Balasan:</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRecordCandidateResponse(c, 'Cocok');
                            }}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-bold"
                          >
                            Cocok
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRecordCandidateResponse(c, 'Nego');
                            }}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-bold"
                          >
                            Nego
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRecordCandidateResponse(c, 'Tidak Cocok');
                            }}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-[11px] font-bold"
                          >
                            Tidak
                          </button>
                        </div>
                      )}

                      {c.offeringCandidateResponse === 'Cocok' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmHired(c);
                          }}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Setujui (Hired)</span>
                        </button>
                      )}

                      {c.offeringCandidateResponse === 'Nego' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCandidate(c);
                              handleOpenOfferingModal(c);
                            }}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold"
                          >
                            Revisi
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmHired(c);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold"
                          >
                            Deal (Hired)
                          </button>
                        </div>
                      )}

                      {c.offeringCandidateResponse === 'Tidak Cocok' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmDisqualified(c, 'Kandidat menyatakan Tidak Cocok / Menolak paket penawaran.');
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition-colors"
                        >
                          Tolak (Disqualified)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Table of Candidates in Offering Stage (>= md) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Kandidat</th>
                    <th className="py-3 px-4">Posisi Ditawarkan</th>
                    <th className="py-3 px-4">No. Dokumen Offering Letter</th>
                    <th className="py-3 px-4">Gaji Ditawarkan (Gross)</th>
                    <th className="py-3 px-4">Tanggal Dikirim</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap min-w-[200px]">Status Surat & Balasan</th>
                    <th className="py-3 px-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {offeringCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada kandidat di tahap Offering. Silakan promosikan kandidat yang lolos tahap Interview (User).
                      </td>
                    </tr>
                  ) : (
                    offeringCandidates.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => {
                          setActiveCandidate(c);
                          setDocNumber(c.offeringDocNumber || '001/OL-HRD/NTM/X/2026');
                          setIsOfferingDocPreviewOpen(true);
                        }}
                        className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                        title="Klik baris kandidat untuk melihat Dokumen Penawaran Kerja & Tindakan"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{c.name}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{c.email}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {vacancies.find((v) => v.id === c.jobVacancyId)?.title}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                          {c.offeringDocNumber || '001/OL-HRD/NTM/X/2026'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {formatRupiah(c.offeredSalary || c.expectedSalary)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {c.offeringSentDate || (c.offeringStatus === 'Terkirim' ? '2026-10-18' : 'Belum Dikirim')}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {(!c.offeringStatus || c.offeringStatus === 'Draft') ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs whitespace-nowrap shrink-0">
                              <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Draft (Siap Dikirim)</span>
                            </span>
                          ) : c.offeringStatus === 'Terkirim' && !c.offeringCandidateResponse ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs whitespace-nowrap shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
                              <span>Terkirim (Menunggu Balasan)</span>
                            </span>
                          ) : c.offeringCandidateResponse === 'Cocok' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs whitespace-nowrap shrink-0">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Balasan: Cocok ✓</span>
                            </span>
                          ) : c.offeringCandidateResponse === 'Nego' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs whitespace-nowrap shrink-0">
                              <RefreshCw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Balasan: Nego ⇄</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs whitespace-nowrap shrink-0">
                              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Balasan: Tidak Cocok ✕</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors ml-auto" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 5: HIRED / DISQUALIFIED (PENENTUAN DITERIMA ATAU DITOLAK) ===================== */}
      {activeTab === 'decision' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-700" />
              <span>Tab 5: Hired / Disqualified (Penentuan Diterima atau Ditolak)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Keputusan akhir calon karyawan: jika <strong>Diterima (Hired)</strong> akan masuk ke Tab On Boarding; jika <strong>Ditolak (Disqualified)</strong> dipindahkan ke Tab Talent Pool.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Section A: Menunggu Keputusan Akhir */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Kandidat Menunggu Keputusan ({offeringCandidates.length})</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Pasca-Offering Letter</span>
              </div>

              <div className="space-y-3">
                {offeringCandidates.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Semua kandidat offering telah diproses keputusannya.
                  </div>
                ) : (
                  offeringCandidates.map((cand) => (
                    <div
                      key={cand.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">{cand.name}</span>
                            {cand.offeringCandidateResponse === 'Cocok' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Cocok ✓
                              </span>
                            ) : cand.offeringCandidateResponse === 'Nego' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                Nego ⇄
                              </span>
                            ) : cand.offeringCandidateResponse === 'Tidak Cocok' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                Tidak Cocok ✕
                              </span>
                            ) : cand.offeringStatus === 'Terkirim' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                Menunggu Balasan
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                                Draft (Belum Dikirim)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {vacancies.find((v) => v.id === cand.jobVacancyId)?.title} · No: {cand.offeringDocNumber || '001/OL-HRD/NTM/X/2026'}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-blue-900 text-xs">
                          {formatRupiah(cand.offeredSalary || cand.expectedSalary)}
                        </span>
                      </div>

                      {/* Status / Quick Action for Candidate Response */}
                      {(!cand.offeringCandidateResponse && cand.offeringStatus === 'Terkirim') && (
                        <div className="p-2 bg-blue-50/70 border border-blue-200 rounded text-[11px] text-blue-900 flex items-center justify-between flex-wrap gap-1.5">
                          <span>Surat terkirim ({cand.offeringSentDate || 'Hari ini'}). Catat respon:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleRecordCandidateResponse(cand, 'Cocok')}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                            >
                              Cocok
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRecordCandidateResponse(cand, 'Nego')}
                              className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold"
                            >
                              Nego
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRecordCandidateResponse(cand, 'Tidak Cocok')}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                            >
                              Tidak
                            </button>
                          </div>
                        </div>
                      )}

                      {(!cand.offeringStatus || cand.offeringStatus === 'Draft') && (
                        <div className="p-2 bg-amber-50/70 border border-amber-200 rounded text-[11px] text-amber-900 flex items-center justify-between gap-1.5">
                          <span>Dokumen offering baru terbit dan belum dikirim ke kandidat.</span>
                          <button
                            type="button"
                            onClick={() => handleSendOfferingToCandidate(cand)}
                            className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-[10px] font-bold flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Kirim Surat</span>
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCandidate(cand);
                            setDocNumber(cand.offeringDocNumber || '001/OL-HRD/NTM/X/2026');
                            setIsOfferingDocPreviewOpen(true);
                          }}
                          className="text-[11px] text-blue-700 hover:underline font-semibold flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Buka Dokumen Offering</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setCandidateToDisqualify(cand);
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 ${
                              cand.offeringCandidateResponse === 'Tidak Cocok'
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs font-bold'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>Tolak (Disqualified)</span>
                          </button>
                          <button
                            onClick={() => handleConfirmHired(cand)}
                            disabled={!cand.offeringCandidateResponse || cand.offeringCandidateResponse === 'Tidak Cocok'}
                            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all ${
                              cand.offeringCandidateResponse === 'Cocok'
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                : cand.offeringCandidateResponse === 'Nego'
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                            title={
                              !cand.offeringCandidateResponse
                                ? 'Keputusan Hired membutuhkan konfirmasi balasan Cocok/Nego dari calon karyawan'
                                : ''
                            }
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Terima (Hired & Onboard)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Section B: Riwayat Keputusan Akhir */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Riwayat Keputusan Akhir Rekrutmen</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Hired & Disqualified</span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
                {hiredCandidates.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-emerald-950 block">{c.name}</span>
                      <span className="text-[10px] text-emerald-800">
                        DITERIMA (HIRED) · Join Date: {c.joinedDate || '2026-11-01'}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('onboarding')}
                      className="px-2 py-1 bg-emerald-700 text-white rounded text-[10px] font-semibold"
                    >
                      Lihat Onboarding →
                    </button>
                  </div>
                ))}

                {talentPoolCandidates.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{c.name}</span>
                      <span className="text-[10px] text-slate-500">
                        DISQUALIFIED ➔ Masuk ke Talent Pool
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('talent_pool')}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-[10px] font-semibold"
                    >
                      Buka Talent Pool →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 6: ON BOARDING ===================== */}
      {activeTab === 'onboarding' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-700" />
                <span>Tab 6: On Boarding & Orientasi Karyawan Baru</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pemeriksaan checklist lintas departemen (GA, IT, HR, Finance) dengan aksi otomatis (ID Card, Dossier, Laptop IT, Provisioning Akun) sebelum penerbitan NIK resmi ke Modul Personalia.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsChecklistSettingsOpen(true)}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-blue-600" />
                <span>Pengaturan Template Checklist ({onboardingChecklistTemplates.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('personalia')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
              >
                Buka Modul Personalia →
              </button>
            </div>
          </div>

          {/* Onboarding Cards Grid */}
          {onboardingProcesses.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <UserCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Belum Ada Karyawan dalam Proses Onboarding</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Kandidat yang telah resmi berstatus <strong>Hired</strong> di Tahap Keputusan (Offering) akan otomatis masuk ke daftar antrean onboarding ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {onboardingProcesses.map((process) => {
                const totalTasks = process.tasks.length;
                const completedTasks = process.tasks.filter((t) => t.isCompleted).length;
                const mandatoryTasks = process.tasks.filter((t) => t.isMandatory);
                const mandatoryRemaining = mandatoryTasks.filter((t) => !t.isCompleted).length;
                const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                const isAllMandatoryDone = mandatoryRemaining === 0;
                const isFinalized = process.status === 'Completed';

                return (
                  <div
                    key={process.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4 transition-all"
                  >
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-4 flex-wrap border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-200 shrink-0">
                          {process.employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{process.employeeName}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              ✓ {process.status === 'Completed' ? 'Resmi Bergabung (NIK Terbit)' : 'Status: Hired'}
                            </span>
                            {process.officialNik && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                                NIK: {process.officialNik}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-slate-700">{process.position}</span>
                            <span>·</span>
                            <span>{process.department}</span>
                            <span>·</span>
                            <span>{process.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Meta Info Pill */}
                      <div className="flex items-center gap-3 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Mulai Bertugas</span>
                          <span className="font-mono font-bold text-slate-800">{process.joinDate}</span>
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">No. Kontrak</span>
                          <span className="font-mono font-semibold text-blue-900">{process.contractDocNumber || '001/PKWT/NTM/2026'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span>Kelengkapan Checklist Orientasi</span>
                          <span className="text-slate-400 font-normal">({completedTasks} dari {totalTasks} tugas selesai)</span>
                        </span>
                        <span className="font-bold text-emerald-700">{progressPct}% Selesai</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Task Checklist Items */}
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-bold text-slate-800 block">
                        Daftar Penugasan Departemen & Checklist Aksi:
                      </span>
                      <div className="space-y-2">
                        {process.tasks.map((task) => {
                          const deptStyle =
                            task.targetDepartment === 'GA'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : task.targetDepartment === 'IT'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : task.targetDepartment === 'Finance'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200';

                          return (
                            <div
                              key={task.id}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 flex-wrap transition-colors ${
                                task.isCompleted
                                  ? 'bg-emerald-50/40 border-emerald-200'
                                  : 'bg-white border-slate-200 hover:bg-slate-50/70'
                              }`}
                            >
                              {/* Left: Indicator & Content */}
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="pt-0.5">
                                  {task.verificationType === 'manual' ? (
                                    <input
                                      type="checkbox"
                                      checked={task.isCompleted}
                                      onChange={() => updateOnboardingTask(process.id, task.id, !task.isCompleted)}
                                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                  ) : (
                                    <span
                                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                        task.isCompleted
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-slate-200 text-slate-600'
                                      }`}
                                    >
                                      {task.isCompleted ? '✓' : '•'}
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`text-xs font-bold ${
                                        task.isCompleted ? 'text-slate-900' : 'text-slate-800'
                                      }`}
                                    >
                                      {task.title}
                                    </span>
                                    {/* Department Badge */}
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${deptStyle}`}>
                                      Pihak: {task.targetDepartment || 'HR'}
                                    </span>
                                    {/* Verification Mode Badge */}
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                      {task.verificationType === 'automated' ? '⚡ Pemeriksaan Otomatis' : '📋 Ceklis Manual'}
                                    </span>
                                    {/* Mandatory Badge */}
                                    {task.isMandatory && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                        Wajib
                                      </span>
                                    )}
                                  </div>

                                  {/* Result Payload Preview if completed */}
                                  {task.isCompleted && task.actionPayload && (
                                    <div className="text-[11px] text-emerald-800 bg-emerald-100/60 px-2.5 py-1 rounded-md border border-emerald-200/80 inline-flex items-center gap-2 flex-wrap mt-0.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                      {task.actionType === 'id_card_request' && (
                                        <span>
                                          Tiket GA: <strong>{task.actionPayload.idCardTicketNo}</strong> · Jenis: {task.actionPayload.idCardType}
                                        </span>
                                      )}
                                      {task.actionType === 'dossier_verification' && (
                                        <span>
                                          NIK KTP: <strong>{task.actionPayload.dossierKtpNumber}</strong> · NPWP: {task.actionPayload.dossierNpwpNumber} · Kontak: {task.actionPayload.dossierEmergencyContactName}
                                        </span>
                                      )}
                                      {task.actionType === 'laptop_provisioning' && (
                                        <span>
                                          Perangkat: <strong>{task.actionPayload.laptopDeviceType}</strong> (SN: {task.actionPayload.laptopSerialNo}) · Tag: {task.actionPayload.laptopAssetTag}
                                        </span>
                                      )}
                                      {task.actionType === 'account_email_setup' && (
                                        <span>
                                          Email Resmi: <strong>{task.actionPayload.corporateEmail}</strong> · 4 Akun Sistem Aktif
                                        </span>
                                      )}
                                      {!['id_card_request', 'dossier_verification', 'laptop_provisioning', 'account_email_setup'].includes(task.actionType || '') && (
                                        <span>Telah diverifikasi dan diselesaikan pada {task.completedAt || 'hari ini'}.</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right: Action Trigger Button */}
                              <div>
                                {task.actionType === 'id_card_request' && (
                                  <button
                                    type="button"
                                    onClick={() => openIdCardModal(process, task)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer ${
                                      task.isCompleted
                                        ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                                        : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700'
                                    }`}
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>{task.isCompleted ? 'Ubah Data ID Card' : 'Form Pengajuan ID Card ke GA →'}</span>
                                  </button>
                                )}

                                {task.actionType === 'dossier_verification' && (
                                  <button
                                    type="button"
                                    onClick={() => openDossierModal(process, task)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer ${
                                      task.isCompleted
                                        ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700'
                                    }`}
                                  >
                                    <FileCheck className="w-3.5 h-3.5" />
                                    <span>{task.isCompleted ? 'Lihat/Ubah Dossier' : 'Form Verifikasi Berkas Dossier →'}</span>
                                  </button>
                                )}

                                {task.actionType === 'laptop_provisioning' && (
                                  <button
                                    type="button"
                                    onClick={() => openLaptopModal(process, task)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer ${
                                      task.isCompleted
                                        ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700'
                                    }`}
                                  >
                                    <Laptop className="w-3.5 h-3.5" />
                                    <span>{task.isCompleted ? 'Ubah Alokasi Laptop' : 'Form Alokasi Laptop Kerja IT →'}</span>
                                  </button>
                                )}

                                {task.actionType === 'account_email_setup' && (
                                  <button
                                    type="button"
                                    onClick={() => openAccountModal(process, task)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer ${
                                      task.isCompleted
                                        ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                                        : 'bg-violet-600 hover:bg-violet-700 text-white border-violet-700'
                                    }`}
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>{task.isCompleted ? 'Ubah Akun/Email' : 'Provisioning Akun & Email →'}</span>
                                  </button>
                                )}

                                {task.actionType === 'contract_signing' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateOnboardingTask(process.id, task.id, !task.isCompleted);
                                      setToastFeedback(`Status tanda tangan kontrak digital berhasil diperbarui.`);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer ${
                                      task.isCompleted
                                        ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                                    }`}
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>{task.isCompleted ? 'Batalkan TTD Kontrak' : 'Verifikasi TTD Kontrak Digital QR'}</span>
                                  </button>
                                )}

                                {task.verificationType === 'manual' && (
                                  <span className="text-[11px] text-slate-400 font-medium italic">
                                    {task.isCompleted ? 'Ceklis selesai' : 'Ceklis jika sudah beres'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card Footer: Finalize Onboarding */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-xs text-slate-500">
                        {isFinalized ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" />
                            Karyawan ini telah resmi terdaftar di database Personalia (NIK: {process.officialNik}).
                          </span>
                        ) : isAllMandatoryDone ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            Seluruh tugas wajib telah beres! Siap finalisasi untuk menerbitkan NIK resmi.
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium">
                            Masih ada <strong>{mandatoryRemaining} tugas wajib</strong> yang belum diselesaikan.
                          </span>
                        )}
                      </div>

                      {!isFinalized ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (!isAllMandatoryDone) {
                              alert(`Masih ada ${mandatoryRemaining} tugas wajib yang belum diselesaikan oleh departemen terkait!`);
                              return;
                            }
                            const createdEmp = completeOnboardingProcess(process.id);
                            if (createdEmp) {
                              setToastFeedback(`Selamat! NIK resmi ${createdEmp.nik} telah diterbitkan untuk ${createdEmp.name}. Data resmi masuk ke Modul Personalia.`);
                            }
                          }}
                          disabled={!isAllMandatoryDone}
                          className={`px-4 py-2 rounded-lg text-xs font-bold shadow-2xs flex items-center gap-2 transition-all ${
                            isAllMandatoryDone
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer hover:shadow-md'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          }`}
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Finalisasi Onboarding (Terbitkan NIK Resmi ke Personalia)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveModule('personalia')}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-2 cursor-pointer"
                        >
                          <span>Lihat di Modul Personalia →</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 7: TALENT POOL ===================== */}
      {activeTab === 'talent_pool' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 border border-slate-200 rounded-xl shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Archive className="w-4 h-4 text-blue-700" />
                <span>Tab 7: Talent Pool (Basis Data Cadangan)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kandidat yang belum lolos pada posisi saat ini disimpan di talent pool untuk kebutuhan rekrutmen masa depan tanpa perlu seleksi awal kembali.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {talentPoolCandidates.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                Belum ada kandidat di dalam basis data cadangan (Talent Pool).
              </div>
            ) : (
              talentPoolCandidates.map((cand) => (
                <div
                  key={cand.id}
                  className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{cand.name}</span>
                        <span className="text-xs text-slate-500">{cand.lastCompany}</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {cand.talentPoolCategory || 'Engineering'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                      <span className="font-semibold text-slate-700 block text-[11px]">Catatan Disqualified / Alasan:</span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {cand.disqualificationReason || 'Kandidat sangat kompeten, disimpan untuk proyek atau posisi berikutnya.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold block">Tags Keahlian:</span>
                      <div className="flex flex-wrap gap-1">
                        {(cand.talentPoolTags || ['Cloud', 'Kubernetes', 'High Potential']).map((tag, idx) => (
                          <span key={idx} className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium border border-blue-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500 text-[11px]">
                      {cand.email}
                    </span>
                    <button
                      onClick={() => handleReengageTalent(cand)}
                      className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded font-semibold text-xs flex items-center gap-1 shadow-2xs"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Hubungi Kembali</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===================== MODAL DISQUALIFY REASON ===================== */}
      {candidateToDisqualify && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setCandidateToDisqualify(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ThumbsDown className="w-4 h-4 text-rose-400" />
                <span>Penolakan & Pemindahan ke Talent Pool</span>
              </h3>
              <button onClick={() => setCandidateToDisqualify(null)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Tentukan alasan mengapa kandidat <strong>{candidateToDisqualify.name}</strong> tidak lolos. Data kandidat akan otomatis disimpan ke <strong>Tab 7: Talent Pool</strong> untuk kebutuhan posisi mendatang.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alasan Penolakan / Evaluasi:</label>
                <textarea
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Contoh: Ekspektasi gaji di atas budget formasi saat ini. Disimpan untuk level Lead Architect Q1."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCandidateToDisqualify(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDisqualified(candidateToDisqualify, rejectionReasonInput)}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-semibold shadow-2xs"
                >
                  Simpan & Pindahkan ke Talent Pool
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 1: BUAT FPTK BARU (COMPREHENSIVE MULTI-SECTION) ===================== */}
      {isRequisitionModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRequisitionModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>Pengajuan Formulir Permintaan Tenaga Kerja (FPTK)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/60">
                      Standard HR-01
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Lengkapi justifikasi, formasi grade, kualifikasi, struktur supervisi, & matriks otorisasi persetujuan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRequisitionModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={(e) => handleCreateFptk(e, false)} className="p-6 space-y-6 text-xs overflow-y-auto flex-1">
              {/* SECTION 1: POSISI, JABATAN & DEPARTEMEN */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-200 pb-2">
                  <Briefcase className="w-4 h-4 text-blue-700" />
                  <span className="text-xs uppercase tracking-wider">I. Informasi Posisi, Jabatan & Alokasi Grade</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Nama Posisi / Jabatan yang Dibutuhkan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Senior Fullstack Engineer / Finance Specialist"
                      value={fptkPosition}
                      onChange={(e) => setFptkPosition(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Departemen / Divisi Pemohon *
                    </label>
                    <select
                      required
                      value={fptkDept}
                      onChange={(e) => {
                        setFptkDept(e.target.value);
                        setFptkReportingDept(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    >
                      {companyDepartments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Opsi Grade Dari - Sampai */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                      <span>Jenjang Grade (Dari) *</span>
                      <span className="text-[10px] text-slate-400 font-normal">Level minimum</span>
                    </label>
                    <select
                      value={fptkGradeMin}
                      onChange={(e) => setFptkGradeMin(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    >
                      {COMPANY_GRADES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                      <span>Jenjang Grade (Sampai) *</span>
                      <span className="text-[10px] text-slate-400 font-normal">Level maksimum</span>
                    </label>
                    <select
                      value={fptkGradeMax}
                      onChange={(e) => setFptkGradeMax(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    >
                      {COMPANY_GRADES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Jumlah Kebutuhan (Headcount) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        required
                        value={fptkHeadcount}
                        onChange={(e) => setFptkHeadcount(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                        Orang
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Tanggal Dibutuhkan (Target Join) *
                    </label>
                    <input
                      type="date"
                      required
                      value={fptkTargetDate}
                      onChange={(e) => setFptkTargetDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Status Anggaran (Budget) *
                    </label>
                    <select
                      value={fptkIsBudgeted ? 'true' : 'false'}
                      onChange={(e) => setFptkIsBudgeted(e.target.value === 'true')}
                      className={`w-full px-3 py-2 border rounded-lg font-semibold bg-white ${
                        fptkIsBudgeted
                          ? 'border-emerald-300 text-emerald-800'
                          : 'border-amber-300 text-amber-800'
                      }`}
                    >
                      <option value="true">Dianggarkan dalam RKAP (Budgeted)</option>
                      <option value="false">Di Luar Anggaran (Unbudgeted)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: ALASAN KEBUTUHAN & JUSTIFIKASI DESKRIPTIF */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-200 pb-2">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span className="text-xs uppercase tracking-wider">II. Alasan Kebutuhan & Justifikasi Penjelasan</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Tipe / Alasan Kebutuhan Posisi *
                    </label>
                    <select
                      value={fptkReason}
                      onChange={(e) => setFptkReason(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                    >
                      {FPTK_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Nama Karyawan Sebelumnya (Jika Penggantian)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Siti Rahmawati (Resign per akhir bulan)"
                      value={fptkReplacementFor}
                      onChange={(e) => setFptkReplacementFor(e.target.value)}
                      disabled={!fptkReason.includes('Penggantian')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Justifikasi & Penjelasan Kebutuhan (Deskriptif) *</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Jelaskan beban kerja, urgensi operasional, dan dampak jika posisi tidak diisi
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Tuliskan secara deskriptif mengapa kebutuhan ini mendesak, contoh: Penambahan volume sprint 200%, migrasi cloud infrastruktur perbankan, kepatuhan audit PSAK, atau pemenuhan SLA operasional..."
                    value={fptkJustification}
                    onChange={(e) => setFptkJustification(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 3: STRUKTUR ORGANISASI, SUPERVISI & TUGAS UTAMA */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-200 pb-2">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span className="text-xs uppercase tracking-wider">III. Struktur Organisasi, Supervisi & Tugas Utama</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Bertanggung Jawab ke Divisi *
                    </label>
                    <select
                      value={fptkReportingDept}
                      onChange={(e) => setFptkReportingDept(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    >
                      {companyDepartments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Jumlah Staf yang Disupervisi
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        value={fptkSupervisedStaff}
                        onChange={(e) => setFptkSupervisedStaff(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                        placeholder="0 jika Individual Contributor"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                        Staf
                      </span>
                    </div>
                  </div>

                  {/* Bertanggung Jawab ke Atasan: Jabatan / Posisi Struktural */}
                  <div className="md:col-span-2">
                    <label className="font-semibold text-slate-700 block text-xs mb-1.5">
                      Bertanggung Jawab ke Atasan (Jabatan / Posisi) *
                    </label>
                    <div className="relative">
                      <select
                        value={fptkReportingTitle}
                        onChange={(e) => setFptkReportingTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      >
                        <option value="">-- Pilih Jabatan / Posisi Atasan Langsung --</option>
                        {companyPositions.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      * Garis pelaporan organisasi mengacu pada jabatan/posisi struktural (bukan nama personal karyawan).
                    </p>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tugas Pokok & Tanggung Jawab Utama (Job Description) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Sebutkan 3-5 tugas kunci yang akan dijalankan oleh pemegang jabatan ini sehari-hari..."
                    value={fptkMainResponsibilities}
                    onChange={(e) => setFptkMainResponsibilities(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 4: KUALIFIKASI KANDIDAT */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-200 pb-2">
                  <GraduationCap className="w-4 h-4 text-blue-700" />
                  <span className="text-xs uppercase tracking-wider">IV. Kualifikasi & Persyaratan Kandidat</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Tingkat / Strata Pendidikan *
                    </label>
                    <select
                      value={fptkEduLevel}
                      onChange={(e) => setFptkEduLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    >
                      {COMPANY_EDUCATION_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Jurusan / Bidang Studi *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Teknik Informatika / Sistem Informasi"
                      value={fptkEduMajor}
                      onChange={(e) => setFptkEduMajor(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Lama Pengalaman Kerja *
                    </label>
                    <select
                      value={fptkMinExp}
                      onChange={(e) => setFptkMinExp(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    >
                      {COMPANY_EXP_LEVELS.map((exp) => (
                        <option key={exp} value={exp}>
                          {exp}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Keterampilan Khusus (Hard/Soft Skills) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Sebutkan keahlian teknis atau spesifik, contoh: TypeScript, React, Node.js, PostgreSQL, Docker, CI/CD, Brevet A&B, PSAK..."
                    value={fptkSkills}
                    onChange={(e) => setFptkSkills(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Kualifikasi Lainnya & Sertifikasi
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Sebutkan sertifikasi profesi yang diwajibkan, kemampuan bahasa asing, atau kualifikasi pendukung lainnya..."
                    value={fptkOtherRequirements}
                    onChange={(e) => setFptkOtherRequirements(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 5: PENGAJU & PENYETUJU (FLEKSIBEL APPROVAL) */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-200 pb-2">
                  <UserCheck className="w-4 h-4 text-blue-700" />
                  <span className="text-xs uppercase tracking-wider">V. Pihak Pengaju & Otorisasi Persetujuan</span>
                </div>

                {/* Yang Mengajukan: Readonly Pembuat Dokumen */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-700 block mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Yang Mengajukan *</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Otomatis dari akun login pembuat form (Readonly)
                    </span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={requesterDisplay}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-800 font-semibold rounded-lg cursor-not-allowed text-xs"
                  />
                </div>

                {/* Yang Menyetujui atas Pengajuan (Fleksibel & Multi-Approver) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-bold text-slate-800 text-xs block">
                        Yang Menyetujui atas Pengajuan *
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Pilih karyawan penyetuju. Foto, nama, NIK, dan jabatan langsung terpasang dari sistem.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSignatory}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Penanda Tangan</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {fptkSignatories.map((sig, idx) => (
                      <div
                        key={sig.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          {/* Header / Title Role */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                              Header #{idx + 1}:
                            </span>
                            <input
                              type="text"
                              required
                              value={sig.role}
                              onChange={(e) => handleUpdateSignatory(sig.id, { role: e.target.value })}
                              list={`signatory-roles-${sig.id}`}
                              placeholder="Menyetujui / Mengetahui / Memeriksa"
                              className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-bold text-blue-900 bg-blue-50/50 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                            />
                            <datalist id={`signatory-roles-${sig.id}`}>
                              {SIGNATORY_ROLES.map((role) => (
                                <option key={role} value={role} />
                              ))}
                            </datalist>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Checkbox Gunakan Gelar */}
                            <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-slate-700 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                              <input
                                type="checkbox"
                                checked={sig.withDegree !== false}
                                onChange={(e) => {
                                  const newWithDegree = e.target.checked;
                                  const emp = companyEmployees.find((item) => item.id === sig.employeeId);
                                  handleUpdateSignatory(sig.id, {
                                    withDegree: newWithDegree,
                                    name: emp ? (newWithDegree ? emp.fullName : emp.rawName) : sig.name,
                                  });
                                }}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>Gunakan Gelar</span>
                            </label>

                            {/* Hapus Penanda Tangan */}
                            {fptkSignatories.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSignatory(sig.id)}
                                title="Hapus Penanda Tangan Ini"
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Dropdown Karyawan (Menampilkan Foto, Nama, NIK, Jabatan / Posisi) */}
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">
                            Pilih Karyawan Penyetuju (Foto, Nama, NIK, Jabatan) *
                          </label>
                          <EmployeeSelectDropdown
                            employees={companyEmployees}
                            selectedId={sig.employeeId}
                            withDegree={sig.withDegree !== false}
                            onSelect={(emp) => {
                              handleUpdateSignatory(sig.id, {
                                employeeId: emp.id,
                                name: sig.withDegree !== false ? emp.fullName : emp.rawName,
                                title: emp.position || 'Departemen Head',
                                nik: emp.nik,
                                avatar: emp.avatar,
                              });
                            }}
                            placeholder="-- Pilih karyawan penyetuju dari daftar --"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Actions: Hanya Batal dan Kirim & Menunggu Approval */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsRequisitionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-2 text-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim & Menunggu Approval</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL DETAIL FORMULIR FPTK (OFFICIAL SHEET PREVIEW) ===================== */}
      {previewFptk && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setPreviewFptk(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="px-6 py-3.5 bg-slate-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold font-mono tracking-wider">
                  LEMBAR RESMI: {previewFptk.reqNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
                <button
                  onClick={() => setPreviewFptk(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-8 space-y-6 text-xs text-slate-800 overflow-y-auto flex-1 font-sans">
              {/* Kop Dokumen Perusahaan */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-base font-extrabold uppercase tracking-tight text-slate-950">
                    {safeTenant.name || 'PT NUSANTARA TEKNOLOGI MAJU'}
                  </h1>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    HUMAN CAPITAL & TALENT ACQUISITION DIVISION • SOP-HR-REC-001
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Gedung Cyber 2 Tower Lt. 18, Jl. HR Rasuna Said, Jakarta Selatan
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      previewFptk.status === 'Disetujui'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : previewFptk.status === 'Menunggu Approval'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : previewFptk.status === 'Dicabut (Retracted)'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : previewFptk.status === 'Dibatalkan'
                        ? 'bg-slate-100 text-slate-700 border border-slate-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    Status: {previewFptk.status}
                  </span>
                  <div className="mt-1 text-[11px] font-mono text-slate-500">
                    Diajukan: {previewFptk.createdAt}
                  </div>
                </div>
              </div>

              <div className="text-center py-1">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 underline decoration-blue-600 decoration-2 underline-offset-4">
                  FORMULIR PERMINTAAN TENAGA KERJA (FPTK)
                </h2>
              </div>

              {/* Data Posisi & Grade */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-1.5 uppercase tracking-wide">
                  <Briefcase className="w-3.5 h-3.5 text-blue-700" />
                  <span>I. Informasi Posisi & Struktur Organisasi</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Nama Posisi / Jabatan</span>
                    <span className="font-bold text-slate-900 text-xs">{previewFptk.position}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Departemen / Divisi</span>
                    <span className="font-medium text-slate-800">{previewFptk.department}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Alokasi Jenjang Grade</span>
                    <span className="font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block text-[11px]">
                      {previewFptk.grade}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Jumlah Formasi</span>
                    <span className="font-bold text-slate-900 text-xs font-mono">{previewFptk.headcount} Orang</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Melapor Kepada</span>
                    <span className="font-medium text-slate-800">{previewFptk.reportingToTitle || previewFptk.department}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Divisi Atasan</span>
                    <span className="font-medium text-slate-800">{previewFptk.reportingToDepartment || previewFptk.department}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Staff Supervisi</span>
                    <span className="font-medium text-slate-800">{previewFptk.supervisedStaffCount || 0} Staf</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Status Anggaran</span>
                    <span className={`font-semibold ${previewFptk.isBudgeted !== false ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {previewFptk.isBudgeted !== false ? 'Dianggarkan (RKAP)' : 'Unbudgeted'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Justifikasi Kebutuhan */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-1.5 uppercase tracking-wide">
                  <FileText className="w-3.5 h-3.5 text-blue-700" />
                  <span>II. Tipe Kebutuhan & Justifikasi Deskriptif</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Tipe Kebutuhan</span>
                    <span className="font-semibold text-slate-900">{previewFptk.reason}</span>
                  </div>
                  {previewFptk.replacementFor && (
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">Penggantian Untuk</span>
                      <span className="font-semibold text-slate-800">{previewFptk.replacementFor}</span>
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase mb-1">
                    Uraian Penjelasan Justifikasi Kebutuhan:
                  </span>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-700 text-xs leading-relaxed italic">
                    "{previewFptk.justification || 'Kebutuhan mendesak untuk menjaga produktivitas tim dan pemenuhan target kerja.'}"
                  </div>
                </div>
              </div>

              {/* Uraian Tugas Utama */}
              {previewFptk.mainResponsibilities && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-1.5 uppercase tracking-wide">
                    <CheckSquare className="w-3.5 h-3.5 text-blue-700" />
                    <span>III. Tugas Pokok & Tanggung Jawab Utama</span>
                  </h3>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-700 text-xs leading-relaxed">
                    {previewFptk.mainResponsibilities}
                  </div>
                </div>
              )}

              {/* Kualifikasi Kandidat */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-1.5 uppercase tracking-wide">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
                  <span>IV. Kualifikasi & Persyaratan Kandidat</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Strata Pendidikan</span>
                    <span className="font-semibold text-slate-800">
                      {previewFptk.educationLevel || previewFptk.educationMin?.split(' - ')[0] || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Jurusan / Bidang Studi</span>
                    <span className="font-semibold text-slate-800">
                      {previewFptk.educationMajor || previewFptk.educationMin?.split(' - ')[1] || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Lama Pengalaman</span>
                    <span className="font-semibold text-slate-800">{previewFptk.minExperience || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Target Tanggal Masuk</span>
                    <span className="font-mono font-bold text-slate-900">{previewFptk.targetJoinDate}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase mb-1">Keterampilan Khusus</span>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium whitespace-pre-line text-xs">
                    {previewFptk.skills || previewFptk.requirements}
                  </div>
                </div>
                {previewFptk.otherRequirements && (
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase mb-0.5">Kualifikasi Tambahan</span>
                    <span className="text-slate-600">{previewFptk.otherRequirements}</span>
                  </div>
                )}
              </div>

              {/* Matriks Otorisasi Persetujuan */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-1.5 uppercase tracking-wide">
                  <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                  <span>V. Matriks Otorisasi & Persetujuan</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {/* Pemohon */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Yang Mengajukan
                    </span>
                    <div className="font-bold text-slate-900 text-sm">{previewFptk.requesterName}</div>
                    <span className="text-[10px] text-slate-400 block">Tanggal: {previewFptk.createdAt}</span>
                    <div className="pt-2 text-emerald-700 font-semibold text-[10px] flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Dokumen Resmi Diajukan</span>
                    </div>
                  </div>

                  {/* Multi-Signatories / Approvers */}
                  {previewFptk.signatories && previewFptk.signatories.length > 0 ? (
                    previewFptk.signatories.map((sig, idx) => (
                      <div key={sig.id || idx} className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                          {sig.role || 'Yang Menyetujui'}
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{sig.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{sig.title}</div>
                        {previewFptk.status === 'Disetujui' || sig.status === 'Disetujui' ? (
                          <div className="pt-2 text-emerald-700 font-semibold text-[10px] flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Telah {sig.role || 'Disetujui'} ({sig.date || previewFptk.approvalDate || previewFptk.createdAt})</span>
                          </div>
                        ) : (
                          <div className="pt-2 text-amber-700 font-semibold text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Menunggu Konfirmasi {sig.role || 'Persetujuan'}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Yang Menyetujui atas Pengajuan
                      </span>
                      <div className="font-bold text-slate-900 text-sm">
                        {previewFptk.approvedBy || 'Menunggu Persetujuan Atasan'}
                      </div>
                      {previewFptk.approvalDate && (
                        <span className="text-[10px] text-slate-400 block">
                          Tanggal Approval: {previewFptk.approvalDate}
                        </span>
                      )}
                      {previewFptk.status === 'Disetujui' ? (
                        <div className="pt-2 text-emerald-700 font-semibold text-[10px] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Telah Disetujui Penuh</span>
                        </div>
                      ) : (
                        <div className="pt-2 text-amber-700 font-semibold text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Menunggu Konfirmasi Persetujuan</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {previewFptk.approvalNotes && (
                  <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/80 text-[11px] text-emerald-900">
                    <strong>Catatan Approver:</strong> {previewFptk.approvalNotes}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewFptk(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-semibold border border-slate-200 text-xs transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const req = previewFptk;
                    setPreviewFptk(null);
                    setTrackingFptk(req);
                  }}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold border border-blue-200 text-xs transition-colors flex items-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Lacak Alur ({previewFptk.signatories?.length || 1} Pihak)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {previewFptk.status === 'Menunggu Approval' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCancelRequisition(previewFptk.id)}
                      className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 rounded-xl font-semibold border border-rose-200 text-xs transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Batalkan Pengajuan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleRejectFptk(previewFptk.id);
                        setPreviewFptk(null);
                      }}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-medium border border-slate-300 text-xs transition-colors"
                    >
                      Tolak
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleApproveFptk(previewFptk.id);
                        const primaryApprover =
                          previewFptk.signatories && previewFptk.signatories.length > 0
                            ? previewFptk.signatories[previewFptk.signatories.length - 1].name
                            : (previewFptk.approvedBy || 'Aditya Pratama (Head of People)');
                        setPreviewFptk({
                          ...previewFptk,
                          status: 'Disetujui',
                          approvedBy: primaryApprover,
                          signatories: previewFptk.signatories?.map((s) => ({
                            ...s,
                            status: 'Disetujui',
                            date: new Date().toISOString().split('T')[0],
                          })),
                        });
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Setujui Dokumen Ini</span>
                    </button>
                  </>
                )}

                {previewFptk.status === 'Disetujui' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const req = previewFptk;
                        setPreviewFptk(null);
                        handleOpenRetractModal(req);
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-amber-50 text-amber-800 rounded-xl font-semibold border border-amber-300 text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                      title="Retract / Cabut Pengajuan FPTK yang Sudah Disetujui"
                    >
                      <Undo2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Retract Pengajuan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const req = previewFptk;
                        setPreviewFptk(null);
                        handleConvertFptkToVacancy(req);
                      }}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Sebarkan Lowongan →</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL RETRACK ALUR PERSETUJUAN FPTK ===================== */}
      {trackingFptk && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTrackingFptk(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-4 sm:my-6 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">
                    Lacak Alur Persetujuan FPTK
                  </h3>
                  <span className="text-[10px] bg-blue-900/80 text-blue-200 border border-blue-700/60 font-mono px-2 py-0.5 rounded-full">
                    {trackingFptk.reqNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pantau status peninjauan ke seluruh pihak terkait (Mengetahui, Menyetujui, dll) & kirim pengingat.
                </p>
              </div>
              <button
                onClick={() => setTrackingFptk(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Posisi Dibutuhkan</span>
                  <span className="font-bold text-slate-900">{trackingFptk.position}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Departemen</span>
                  <span className="font-semibold text-slate-800">{trackingFptk.department}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Diajukan Oleh</span>
                  <span className="font-semibold text-slate-800">{trackingFptk.requesterName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Status Dokumen</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      trackingFptk.status === 'Disetujui'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : trackingFptk.status === 'Menunggu Approval'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : trackingFptk.status === 'Dicabut (Retracted)'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : trackingFptk.status === 'Dibatalkan'
                        ? 'bg-slate-100 text-slate-700 border border-slate-300'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {trackingFptk.status}
                  </span>
                </div>
              </div>

              {/* Step-by-Step Approval Track */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <Users className="w-4 h-4 text-blue-700" />
                    <span>Daftar Pihak Terkait & Verifikasi Approval</span>
                  </h4>
                  {trackingFptk.status === 'Menunggu Approval' && (
                    <button
                      type="button"
                      onClick={() => handleBlastAllReminders(trackingFptk)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>Kirim Pengingat ke Semua Pihak</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {trackingFptk.signatories && trackingFptk.signatories.length > 0 ? (
                    trackingFptk.signatories.map((sig, idx) => {
                      const isApproved = trackingFptk.status === 'Disetujui' || sig.status === 'Disetujui';
                      return (
                        <div
                          key={sig.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 flex-wrap transition-colors ${
                            isApproved
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : trackingFptk.status === 'Ditolak'
                              ? 'bg-rose-50/50 border-rose-200'
                              : 'bg-white border-slate-200 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isApproved
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {isApproved ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                              </span>
                            </div>

                            <img
                              src={
                                sig.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(sig.name)}&background=0284c7&color=fff&bold=true`
                              }
                              alt={sig.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                                  {sig.role}
                                </span>
                                <span className="font-bold text-slate-900 text-xs">{sig.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span>{sig.title || 'Pejabat Berwenang'}</span>
                                {sig.nik && <span>• NIK: {sig.nik}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : trackingFptk.status === 'Menunggu Approval'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isApproved ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-700" />
                                  <span>Telah Disetujui</span>
                                </>
                              ) : trackingFptk.status === 'Menunggu Approval' ? (
                                <>
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Menunggu Review</span>
                                </>
                              ) : (
                                <span>-</span>
                              )}
                            </span>

                            {trackingFptk.status === 'Menunggu Approval' && (
                              <button
                                type="button"
                                onClick={() => handleSendApprovalReminder(sig.name, sig.role)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                              >
                                <Send className="w-2.5 h-2.5 text-blue-600" />
                                <span>Kirim Pengingat</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
                      Alur penanda tangan menggunakan approver tunggal: {trackingFptk.approvedBy || 'Direksi'}.
                    </div>
                  )}
                </div>
              </div>

              {trackingFptk.approvalNotes && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs text-blue-950">
                  <span className="font-bold block mb-0.5">Catatan Persetujuan / Riwayat:</span>
                  <p className="text-slate-700 leading-relaxed">{trackingFptk.approvalNotes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTrackingFptk(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                {trackingFptk.status === 'Menunggu Approval' && (
                  <button
                    type="button"
                    onClick={() => handleCancelRequisition(trackingFptk.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Batalkan & Tarik Pengajuan</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const req = trackingFptk;
                    setTrackingFptk(null);
                    setPreviewFptk(req);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lihat Dokumen FPTK Lengkap →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: PROSES PUBLIKASI & SEBAR LOWONGAN ===================== */}
      {isVacancyModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsVacancyModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl sm:max-w-3xl w-full border border-slate-200 overflow-hidden my-4 sm:my-6 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">
                    Proses Publikasi & Sebar Lowongan Eksternal
                  </h3>
                  {activeRequisition && (
                    <span className="text-[10px] bg-blue-900/80 text-blue-200 border border-blue-700/60 font-mono px-2 py-0.5 rounded-full">
                      Ref FPTK: {activeRequisition.reqNumber}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Isian otomatis diadopsi dari FPTK yang disetujui. Sesuaikan wording eksternal sebelum dipublikasikan.
                </p>
              </div>
              <button
                onClick={() => setIsVacancyModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-Tabs: Form Wording vs Live Preview Share */}
            <div className="px-5 pt-3 pb-0 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVacModalTab('form')}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${
                    vacModalTab === 'form'
                      ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>1. Penyesuaian Wording & Saluran</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVacModalTab('preview')}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${
                    vacModalTab === 'preview'
                      ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>2. Preview Share Eksternal</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-mono px-1.5 py-0.2 rounded-full">
                    {vacChannels.length} Portal
                  </span>
                </button>
              </div>
              {vacModalTab === 'preview' && (
                <div className="flex items-center gap-1.5 pb-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Simulasi:</span>
                  {(['LinkedIn', 'Jobstreet', 'Website Karir'] as const).map((portal) => (
                    <button
                      key={portal}
                      type="button"
                      onClick={() => setVacPreviewPortal(portal)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        vacPreviewPortal === portal
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {portal}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {vacModalTab === 'form' ? (
                <div className="space-y-4">
                  {/* Context notice */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-blue-900 text-xs">
                    <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Integrasi Otomatis dari Dokumen FPTK</span>
                      <p className="text-[11px] text-blue-800/90 mt-0.5 leading-relaxed">
                        Data posisi, departemen, jenjang, dan uraian tugas telah terisi otomatis dari FPTK. Anda dapat memperhalus redaksi kata (wording) agar sesuai kebutuhan publikasi luar tanpa membocorkan kerahasiaan atau formasi internal.
                      </p>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Judul Posisi Lowongan Eksternal (Public Job Title) *
                    </label>
                    <input
                      type="text"
                      required
                      value={vacTitle}
                      onChange={(e) => setVacTitle(e.target.value)}
                      placeholder="Contoh: Senior Fullstack Engineer / IT Specialist"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      * Anda dapat memoles judul posisi publik (misal menambahkan spesialisasi) agar lebih menarik bagi pelamar eksternal.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Departemen / Divisi</label>
                      <input
                        type="text"
                        required
                        value={vacDept}
                        onChange={(e) => setVacDept(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Status Hubungan Kerja</label>
                      <select
                        value={vacType}
                        onChange={(e) => setVacType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Tetap">Tetap (PKWTT)</option>
                        <option value="Kontrak">Kontrak (PKWT)</option>
                        <option value="Magang">Magang</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Formasi (Kebutuhan)</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={vacOpenings}
                        onChange={(e) => setVacOpenings(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* SALARY MASKING & SHARING CONTROLS */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="font-bold text-amber-950 text-xs">
                          Kisaran Gaji & Kebijakan Kerahasiaan (Compensation Privacy)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                        Restricted Access
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 text-[11px]">
                          Kisaran Gaji Internal (dari FPTK)
                        </label>
                        <div className="relative">
                          <input
                            type={isSalaryMasked ? 'password' : 'text'}
                            value={vacSalary}
                            onChange={(e) => setVacSalary(e.target.value)}
                            className="w-full pl-3 pr-24 py-2 border border-slate-300 rounded-lg font-mono font-semibold bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                            placeholder="Rp 15.000.000 - Rp 20.000.000"
                          />
                          <button
                            type="button"
                            onClick={() => setIsSalaryMasked(!isSalaryMasked)}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            {isSalaryMasked ? (
                              <>
                                <Eye className="w-3 h-3 text-blue-600" />
                                <span>Intip</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 text-slate-600" />
                                <span>Masking</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Checkbox Opsi Range Gaji Tampil Saat Share */}
                      <div className="pt-2 sm:pt-4">
                        <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-amber-300/80 bg-white cursor-pointer hover:bg-amber-50/50 transition-colors shadow-2xs">
                          <input
                            type="checkbox"
                            checked={showSalaryPublicly}
                            onChange={(e) => setShowSalaryPublicly(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">
                              Tampilkan Kisaran Gaji di Publikasi Eksternal
                            </span>
                            <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                              {showSalaryPublicly
                                ? 'Kisaran angka gaji AKAN terlihat publik di Jobstreet/LinkedIn.'
                                : 'Gaji dirahasiakan; publik hanya melihat "Gaji Kompetitif (Confidential)".'}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Deskripsi Pekerjaan & Tanggung Jawab Eksternal *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={vacDescription}
                      onChange={(e) => setVacDescription(e.target.value)}
                      placeholder="Uraikan tanggung jawab posisi ini untuk publik..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      * Redaksi kalimat dapat disesuaikan dengan bahasa promosi karir yang menarik bagi talenta luar.
                    </p>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Kualifikasi & Persyaratan Eksternal *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={vacRequirements}
                      onChange={(e) => setVacRequirements(e.target.value)}
                      placeholder="Contoh: S1 Teknik Informatika, Min. 3 tahun pengalaman..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="font-bold text-slate-800 block text-xs">
                      Pilih Portal Siar Eksternal (Multi-Channel Broadcast):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      {(['Jobstreet', 'LinkedIn', 'Glints', 'Kalibrr', 'Website Karir'] as JobPostingChannel[]).map((ch) => (
                        <label
                          key={ch}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer ${
                            vacChannels.includes(ch)
                              ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={vacChannels.includes(ch)}
                            onChange={(e) => {
                              if (e.target.checked) setVacChannels((prev) => [...prev, ch]);
                              else setVacChannels((prev) => prev.filter((item) => item !== ch));
                            }}
                            className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                          />
                          <span>{ch}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* LIVE PREVIEW SHARE EKSTERNAL */
                <div className="space-y-4">
                  {/* Security / Compliance Badge */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-900 text-xs flex-wrap">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">Pratinjau Publikasi Eksternal (External Candidate View)</span>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          Berikut simulasi bagaimana iklan lowongan ini dilihat oleh publik di portal {vacPreviewPortal}.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300">
                      Siap Tayang
                    </span>
                  </div>

                  {/* Public Job Card Mockup */}
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-md space-y-4">
                    {/* Header: Company & Job Title */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white font-bold text-lg flex items-center justify-center shadow-md shrink-0">
                          {safeTenant.code || 'HR'}
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                            {vacTitle || 'Judul Posisi Lowongan'}
                          </h2>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <span className="font-semibold text-slate-700">{safeTenant.name}</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5 text-slate-500">
                              <MapPin className="w-3 h-3" /> Jakarta (Hybrid / On-site)
                            </span>
                            <span>·</span>
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Terverifikasi
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                        {vacPreviewPortal} Ad
                      </span>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-500" />
                        {vacType} (Full-time)
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        {vacDept}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        Pengalaman: {vacExp}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-500" />
                        Kebutuhan: {vacOpenings} Formasi
                      </span>
                    </div>

                    {/* Salary Highlight or Masked Box */}
                    <div
                      className={`p-3.5 rounded-xl border ${
                        showSalaryPublicly
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {showSalaryPublicly ? (
                            <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <span className="text-xs font-bold">
                            {showSalaryPublicly ? 'Kisaran Gaji Bulanan Ditampilkan Publik:' : 'Kompensasi & Tunjangan:'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            showSalaryPublicly
                              ? 'bg-emerald-200/80 text-emerald-900'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {showSalaryPublicly ? 'Publik' : 'Dirahasiakan'}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                        <span
                          className={`text-base font-extrabold ${
                            showSalaryPublicly ? 'text-emerald-700 font-mono' : 'text-slate-800'
                          }`}
                        >
                          {showSalaryPublicly ? vacSalary : 'Gaji Kompetitif (Confidential / Sesuai Pengalaman)'}
                        </span>
                        {showSalaryPublicly && (
                          <span className="text-xs text-emerald-600 font-medium">+ BPJS, Asuransi Kesehatan & Tunjangan</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {showSalaryPublicly
                          ? '* Angka gaji tertera akan langsung terlihat oleh semua calon pelamar eksternal.'
                          : '* Besaran penawaran akan dinegosiasikan pada tahap Offering berdasarkan hasil seleksi kompetensi.'}
                      </p>
                    </div>

                    {/* Job Description */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                        Tentang Pekerjaan & Tanggung Jawab
                      </h4>
                      <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        {vacDescription || 'Uraian pekerjaan belum ditentukan.'}
                      </p>
                    </div>

                    {/* Requirements */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                        Kualifikasi & Persyaratan Kandidat
                      </h4>
                      <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        {vacRequirements || 'Persyaratan belum ditentukan.'}
                      </div>
                    </div>

                    {/* Broadcast Channels Preview */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Share2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Akan disiarkan ke:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {vacChannels.map((ch) => (
                            <span
                              key={ch}
                              className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200"
                            >
                              {ch}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs pointer-events-none opacity-90"
                      >
                        Lamar Pekerjaan Ini (Mock CTA)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsVacancyModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
              >
                Batal
              </button>

              <div className="flex items-center gap-2">
                {vacModalTab === 'form' ? (
                  <button
                    type="button"
                    onClick={() => setVacModalTab('preview')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-300 shadow-2xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Preview Share Eksternal →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setVacModalTab('form')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 shadow-2xs transition-colors"
                  >
                    <span>← Kembali Edit Wording</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    addVacancy({
                      title: vacTitle,
                      department: vacDept,
                      employmentType: vacType,
                      grade: vacGrade,
                      openings: vacOpenings,
                      minExperience: vacExp,
                      salaryRange: showSalaryPublicly ? vacSalary : 'Gaji Kompetitif (Confidential)',
                      rawInternalSalary: vacSalary,
                      showSalaryPublicly,
                      requirements: vacRequirements,
                      description: vacDescription,
                      externalDescription: vacDescription,
                      activeChannels: vacChannels,
                      status: 'Buka',
                      jobRequisitionId: vacLinkedReqId || undefined,
                    });
                    setIsVacancyModalOpen(false);
                    alert(`Lowongan '${vacTitle}' berhasil diproses dan disebarkan ke ${vacChannels.length} portal eksternal!`);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publikasikan & Broadcast ke {vacChannels.length} Portal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: HASIL RESUME PARSING AI ===================== */}
      {isResumeParserModalOpen && activeCandidate && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsResumeParserModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Hasil Ekstraksi Resume Parsing Otomatis (AI ATS)</span>
                </h3>
                <span className="text-xs text-slate-400">Incoming Stage: Ekstraksi data penting CV pelamar</span>
              </div>
              <button onClick={() => setIsResumeParserModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Status: Berhasil Diekstrak Secara Otomatis</span>
                </div>
                <span className="font-mono font-bold text-emerald-800 text-[11px]">
                  Akurasi: {activeCandidate.parsedData?.extractionScore || 98}%
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-500 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 truncate min-w-0">
                  <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="font-medium text-slate-800 truncate">{activeCandidate.cvFileName || 'CV_Pelamar.pdf'}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span>{activeCandidate.cvFileSize || '1.2 MB'}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">Sumber:</span>
                  {(() => {
                    const pCfg = getPortalBadgeConfig(activeCandidate.sourcePortal || 'LinkedIn');
                    return (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs whitespace-nowrap ${pCfg.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dotClass}`} />
                        <span>{pCfg.label}</span>
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Nama Lengkap</span>
                    <span className="font-bold text-slate-900 text-xs">{activeCandidate.name}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Perusahaan Terakhir</span>
                    <span className="font-bold text-slate-900 text-xs">{activeCandidate.lastCompany}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Kontak Email</span>
                    <span className="font-mono text-slate-800 text-xs">{activeCandidate.email}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Nomor Telepon / WhatsApp</span>
                    <span className="font-mono text-slate-800 text-xs">{activeCandidate.phone}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 block">Pendidikan Terakhir</span>
                  <div className="font-bold text-slate-900">
                    {activeCandidate.parsedData?.education || 'S1 Teknik Informatika'}
                  </div>
                  <span className="text-[11px] text-slate-600 block">
                    {activeCandidate.parsedData?.university || 'Institut Teknologi Bandung (ITB)'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-700 block">Keahlian & Skill Teridentifikasi:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeCandidate.parsedData?.topSkills || ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'CI/CD']).map(
                      (skill, idx) => (
                        <span key={idx} className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md font-medium">
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateCandidateStage(activeCandidate.id, 'Screening');
                    setIsResumeParserModalOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-2xs"
                >
                  Loloskan ke Screening AI →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 4: SCREENING & KEYWORD MATCH ===================== */}
      {isScreeningModalOpen && activeCandidate && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsScreeningModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Screening Kualifikasi & Keyword Match</span>
                </h3>
                <span className="text-xs text-slate-400">Pencocokan syarat & shortlist</span>
              </div>
              <button onClick={() => setIsScreeningModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-sky-950 font-bold block">Skor Kesesuaian Kualifikasi (ATS Match)</span>
                  <span className="text-[11px] text-sky-700">Dihitung dari kata kunci spesifikasi lowongan</span>
                </div>
                <span className="text-xl font-bold font-mono text-sky-900">
                  {activeCandidate.aiMatchScore || 91}% Match
                </span>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-slate-700 block">Kata Kunci yang Cocok (Matched Keywords):</span>
                <div className="flex flex-wrap gap-1.5">
                  {(activeCandidate.matchedKeywords || ['Kubernetes', 'Docker', '4+ thn exp', 'AWS', 'Linux']).map((kw, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{kw}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-slate-700 block">Kriteria Belum Terdeteksi:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(activeCandidate.missingKeywords || ['Sertifikasi CKA/CKS']).map((kw, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <span className="font-semibold text-slate-800 block">Catatan Screening HR:</span>
                <p className="text-slate-600 text-xs leading-relaxed">
                  {activeCandidate.screeningNotes || 'Kualifikasi pengalaman dan keahlian kandidat sangat memenuhi standar operasional.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateCandidateStage(activeCandidate.id, 'Assessment');
                    setIsScreeningModalOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-2xs"
                >
                  Shortlist ke Tes Kompetensi →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 5: ASSESSMENT / TES KOMPETENSI ===================== */}
      {/* ===================== MODAL 5: INPUT NILAI TES KOMPETENSI & SKORING (ADAPTIF SESUAI DROPDOWN) ===================== */}
      {isAssessmentModalOpen && activeCandidate && (() => {
        const currentCandidate = candidates.find((c) => c.id === activeCandidate.id) || activeCandidate;
        const saveBtn = getTestSaveButtonConfig(currentSelectedTest);
        const SaveIcon = saveBtn.icon;
        const isPassing = calculatedCompositeScore >= testPassingGradeInput;

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAssessmentModalOpen(false);
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Input Nilai Tes Kompetensi & Skoring</span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                    <span className="font-semibold text-white">{currentCandidate.name}</span>
                    <span>•</span>
                    <span className="text-slate-400">
                      {vacancies.find((v) => v.id === currentCandidate.jobVacancyId)?.title || 'Posisi Pelamar'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTestType(false);
                      setEditingTestType(null);
                      setIsTestSettingsModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/15"
                    title="Buka Pengaturan Master Jenis Tes"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">Atur Jenis Tes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAssessmentModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveAssessment} className="p-5 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
                {/* Selector Jenis Tes */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Pilih Jenis Tes Kompetensi *</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Form penilaian & tombol simpan akan menyesuaikan jenis tes terpilih
                    </span>
                  </div>
                  <select
                    value={selectedTestTypeId}
                    onChange={(e) => handleSelectTestTypeInModal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-semibold text-xs shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {competencyTestTypes
                      .filter((t) => t.isActive !== false)
                      .map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.name} [{test.category}] — Passing Grade: {test.passingGrade} | Durasi: {test.durationMinutes} mnt
                        </option>
                      ))}
                  </select>

                  {/* Test Metadata Badges */}
                  {currentSelectedTest && (
                    <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-800 font-semibold">
                        Kategori: {currentSelectedTest.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100/70 text-purple-800 font-semibold">
                        Metode: {currentSelectedTest.method}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100/70 text-amber-800 font-semibold font-mono">
                        Standar Durasi: {currentSelectedTest.durationMinutes} Menit
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800 font-semibold font-mono">
                        Bobot Nilai: {currentSelectedTest.weightPercent || 20}%
                      </span>
                    </div>
                  )}
                </div>

                {/* ================= DYNAMIC FORM INPUTS ACCORDING TO SELECTED TEST ================= */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      {currentSelectedTest.category === 'Hard Skill' && <Code className="w-4 h-4 text-blue-600" />}
                      {currentSelectedTest.category === 'Soft Skill' && <Brain className="w-4 h-4 text-indigo-600" />}
                      {currentSelectedTest.category === 'Kognitif & Logika' && <Binary className="w-4 h-4 text-emerald-600" />}
                      {currentSelectedTest.category === 'Bahasa' && <Languages className="w-4 h-4 text-amber-600" />}
                      {currentSelectedTest.category === 'Studi Kasus' && <Briefcase className="w-4 h-4 text-cyan-600" />}
                      {currentSelectedTest.category === 'Praktik Kerja' && <FileCheck2 className="w-4 h-4 text-rose-600" />}
                      <span>Form Kriteria Penilaian: {currentSelectedTest.name}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 italic">Skala 0 - 100</span>
                  </div>

                  {/* 1. Tes Teknis / Coding & Arsitektur */}
                  {(currentSelectedTest.id === 'test-tech' ||
                    currentSelectedTest.category === 'Hard Skill' ||
                    currentSelectedTest.name.toLowerCase().includes('teknis')) && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Arsitektur & Clean Code (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={techArchitectureScore}
                            onChange={(e) => setTechArchitectureScore(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-600"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Logika Algoritma & Query (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={techAlgorithmScore}
                            onChange={(e) => setTechAlgorithmScore(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-600"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Problem Solving & Debugging (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={techProblemSolvingScore}
                            onChange={(e) => setTechProblemSolvingScore(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Durasi Pengerjaan Aktual (Menit)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={techExecutionMinutes}
                            onChange={(e) => setTechExecutionMinutes(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900"
                            placeholder="65"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Link Repository / Live Coding Sandbox
                          </label>
                          <input
                            type="url"
                            value={techRepoUrl}
                            onChange={(e) => setTechRepoUrl(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                            placeholder="https://github.com/..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Psikotes (DISC / MBTI / Karakter) */}
                  {(currentSelectedTest.id === 'test-psych' ||
                    currentSelectedTest.category === 'Soft Skill' ||
                    currentSelectedTest.name.toLowerCase().includes('psiko')) && (
                    <div className="space-y-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Profil Kepribadian Dominan (DISC / MBTI) *
                        </label>
                        <select
                          value={psychProfileType}
                          onChange={(e) => setPsychProfileType(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-900"
                        >
                          <option value="D - Dominance (Tegas, Teguh & Orientasi Hasil)">
                            D - Dominance (Tegas, Teguh & Orientasi Hasil Cepat)
                          </option>
                          <option value="I - Influence (Persuasif, Komunikatif & Antusias)">
                            I - Influence (Persuasif, Komunikatif & Antusias)
                          </option>
                          <option value="S - Steadiness (Konsisten, Sabar, Loyal & Kerjasama)">
                            S - Steadiness (Konsisten, Sabar, Loyal & Kerjasama)
                          </option>
                          <option value="C - Compliance (Analitis, Taat Prosedur & Rapi)">
                            C - Compliance (Analitis, Taat Prosedur & Rapi)
                          </option>
                          <option value="INTJ / ENTJ (Strategis & Visi Kepemimpinan Kuat)">
                            INTJ / ENTJ (Strategis & Visi Kepemimpinan Kuat)
                          </option>
                          <option value="ENFP / ENTP (Inovatif, Adaptif & Solutif Cepat)">
                            ENFP / ENTP (Inovatif, Adaptif & Solutif Cepat)
                          </option>
                          <option value="ISTJ / ISFJ (Fokus Detail, Berdedikasi & Terstruktur)">
                            ISTJ / ISFJ (Fokus Detail, Berdedikasi & Terstruktur)
                          </option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Ketelitian & Konsistensi (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={psychAttentionToDetail}
                            onChange={(e) => setPsychAttentionToDetail(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Stabilitas Emosi & Daya Tahan (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={psychEmotionalStability}
                            onChange={(e) => setPsychEmotionalStability(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Kepemimpinan & Inisiatif (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={psychLeadership}
                            onChange={(e) => setPsychLeadership(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Rekomendasi Psikologis Tim Asesor
                        </label>
                        <div className="flex gap-4">
                          {(['Disarankan', 'Dipertimbangkan', 'Tidak Disarankan'] as const).map((rec) => (
                            <label key={rec} className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name="psychRec"
                                value={rec}
                                checked={psychRecommendation === rec}
                                onChange={() => setPsychRecommendation(rec)}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="font-semibold text-slate-800">{rec}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Tes Logika & Numerik (GMA / TPA) */}
                  {(currentSelectedTest.id === 'test-cognitive' ||
                    currentSelectedTest.category === 'Kognitif & Logika' ||
                    currentSelectedTest.name.toLowerCase().includes('logika')) && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Jumlah Soal Benar</label>
                          <input
                            type="number"
                            min={0}
                            value={logicCorrectAnswers}
                            onChange={(e) => setLogicCorrectAnswers(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Total Butir Soal</label>
                          <input
                            type="number"
                            min={1}
                            value={logicTotalQuestions}
                            onChange={(e) => setLogicTotalQuestions(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-700"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Penalaran Silogisme & Deduktif (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={logicSyllogismScore}
                            onChange={(e) => setLogicSyllogismScore(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Penalaran Numerik & Grafik (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={logicNumericalScore}
                            onChange={(e) => setLogicNumericalScore(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Penalaran Spasial & Pola (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={logicSpatialScore}
                            onChange={(e) => setLogicSpatialScore(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. Kemahiran Bahasa Inggris Bisnis */}
                  {(currentSelectedTest.id === 'test-lang' ||
                    currentSelectedTest.category === 'Bahasa' ||
                    currentSelectedTest.name.toLowerCase().includes('bahasa')) && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Listening (0-100) *</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={langListeningScore}
                            onChange={(e) => setLangListeningScore(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Reading (0-100) *</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={langReadingScore}
                            onChange={(e) => setLangReadingScore(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Speaking (0-100) *</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={langSpeakingScore}
                            onChange={(e) => setLangSpeakingScore(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Writing (0-100) *</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={langWritingScore}
                            onChange={(e) => setLangWritingScore(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Ekuivalensi Sertifikasi Resmi Calon (Opsional)
                        </label>
                        <input
                          type="text"
                          value={langCertificateEquiv}
                          onChange={(e) => setLangCertificateEquiv(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                          placeholder="e.g. TOEFL ITP 580 / TOEIC 820 / IELTS Band 7.0"
                        />
                      </div>
                    </div>
                  )}

                  {/* 5. Case Study & Presentasi Bisnis */}
                  {(currentSelectedTest.id === 'test-case' ||
                    currentSelectedTest.category === 'Studi Kasus' ||
                    currentSelectedTest.name.toLowerCase().includes('case')) && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Analisis Masalah Bisnis (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={caseProblemAnalysis}
                            onChange={(e) => setCaseProblemAnalysis(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Kelayakan Solusi & ROI (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={caseSolutionFeasibility}
                            onChange={(e) => setCaseSolutionFeasibility(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Penyampaian & Tanya Jawab (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={casePresentationSkill}
                            onChange={(e) => setCasePresentationSkill(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Link Dokumen / Slide Presentasi Kandidat
                        </label>
                        <input
                          type="url"
                          value={caseSlideUrl}
                          onChange={(e) => setCaseSlideUrl(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                          placeholder="https://docs.google.com/presentation/d/..."
                        />
                      </div>
                    </div>
                  )}

                  {/* 6. Tes Praktik Kerja Langsung (Work Sample) */}
                  {(currentSelectedTest.id === 'test-work' ||
                    currentSelectedTest.category === 'Praktik Kerja' ||
                    currentSelectedTest.name.toLowerCase().includes('praktik')) && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Kualitas & Kerapian Mutu (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={workExecutionQuality}
                            onChange={(e) => setWorkExecutionQuality(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Kecepatan & Ketepatan (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={workSpeedAccuracy}
                            onChange={(e) => setWorkSpeedAccuracy(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Kepatuhan SOP & Keselamatan (0-100) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            required
                            value={workSopCompliance}
                            onChange={(e) => setWorkSopCompliance(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Bukti / Output Sampel Pekerjaan (URL / Deskripsi)
                        </label>
                        <input
                          type="text"
                          value={workProofUrl}
                          onChange={(e) => setWorkProofUrl(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                          placeholder="Link artefak kerja atau deskripsi inspeksi fisik..."
                        />
                      </div>
                    </div>
                  )}

                  {/* 7. Custom / Jenis Tes Lainnya */}
                  {currentSelectedTest.category === 'Lainnya' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Aspek Utama (0-100) *</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          required
                          value={customCriteria1}
                          onChange={(e) => setCustomCriteria1(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Pemahaman Materi (0-100) *</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          required
                          value={customCriteria2}
                          onChange={(e) => setCustomCriteria2(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Kesiapan Kerja (0-100) *</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          required
                          value={customCriteria3}
                          onChange={(e) => setCustomCriteria3(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Asesor & Passing Grade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Nama Asesor / Penguji *</label>
                    <input
                      type="text"
                      required
                      value={evaluatorName}
                      onChange={(e) => setEvaluatorName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium"
                      placeholder="Tim Asesor HR / User Lead"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Passing Grade Acuan (Dapat Disesuaikan) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={testPassingGradeInput}
                      onChange={(e) => setTestPassingGradeInput(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Catatan Evaluasi */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Catatan Evaluasi / Rekomendasi Asesor
                  </label>
                  <textarea
                    rows={2}
                    value={testNotesInput}
                    onChange={(e) => setTestNotesInput(e.target.value)}
                    placeholder="Catatan kelebihan, kekurangan, atau rekomendasi teknis untuk tahap interview..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>

                {/* Live Calculated Score Card */}
                <div className="p-3.5 bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Hasil Nilai Akhir ({currentSelectedTest.name}):
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black font-mono text-slate-900">
                        {calculatedCompositeScore}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">/ 100</span>
                      <span className="text-xs text-slate-400 font-normal">
                        (Min. Passing: {testPassingGradeInput})
                      </span>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                        isPassing
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}
                    >
                      {isPassing ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Lulus Passing Grade</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>Di Bawah Passing Grade</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Footer Buttons with DROPDOWN-SPECIFIC SAVE BUTTON */}
                <div className="pt-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAssessmentModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-center transition-colors"
                  >
                    Tutup
                  </button>

                  {/* SPECIFIC SAVE BUTTON ACCORDING TO SELECTED DROPDOWN */}
                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${saveBtn.colorClass}`}
                  >
                    <SaveIcon className="w-4 h-4" />
                    <span>{saveBtn.label}</span>
                  </button>
                </div>

                {/* ================= DAFTAR NILAI TES YANG SUDAH DIINPUT UNTUK KANDIDAT INI ================= */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                      <History className="w-4 h-4 text-blue-600" />
                      <span>Riwayat & Daftar Nilai Tes Terdaftar ({currentCandidate.competencyScores?.length || 0})</span>
                    </h4>
                    {currentCandidate.competencyScores && currentCandidate.competencyScores.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-mono font-bold text-[11px]">
                        Rata-rata Akumulatif: {currentCandidate.testScore || 0}/100
                      </span>
                    )}
                  </div>

                  {(!currentCandidate.competencyScores || currentCandidate.competencyScores.length === 0) ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
                      Belum ada nilai tes yang tersimpan untuk kandidat ini. Pilih jenis tes di atas dan klik tombol simpan khusus.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentCandidate.competencyScores.map((scoreItem) => (
                        <div
                          key={scoreItem.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">{scoreItem.testTypeName}</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {scoreItem.category}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  scoreItem.status === 'Lulus'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {scoreItem.status} (Min. {scoreItem.passingGrade})
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 truncate">
                              {scoreItem.notes || 'Nilai tersimpan dalam pipeline kandidat.'}
                            </p>

                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                              <span>Asesor: {scoreItem.evaluator || 'HR'}</span>
                              <span>•</span>
                              <span>Waktu: {scoreItem.evaluatedAt}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <span className="text-lg font-black font-mono text-slate-900 block">
                                {scoreItem.score}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">/ 100</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteCandidateCompetencyScore(currentCandidate.id, scoreItem.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Nilai Tes Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ===================== MODAL 5B: PENGATURAN MASTER JENIS TES KOMPETENSI ===================== */}
      {isTestSettingsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTestSettingsModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>Pengaturan Master Katalog Jenis Tes Kompetensi</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Atur jenis tes seleksi, passing grade acuan, durasi standar, bobot penilaian, dan metode evaluasi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTestSettingsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">
                    Katalog Aktif ({competencyTestTypes.length} Jenis Tes)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetTestTypesAction}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                    title="Kembalikan semua ke standar bawaan Nusantara HRMS"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Default</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isAddingTestType && !editingTestType) {
                        setIsAddingTestType(false);
                      } else {
                        handleOpenAddTestType();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingTestType ? 'Tutup Form' : '+ Tambah Jenis Tes'}</span>
                  </button>
                </div>
              </div>

              {/* Form Tambah / Edit Jenis Tes */}
              {isAddingTestType && (
                <form
                  onSubmit={handleSaveTestTypeForm}
                  className="p-4 bg-slate-50 border border-blue-200 rounded-xl space-y-3.5 animate-in fade-in duration-100"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{editingTestType ? `Edit Jenis Tes: ${editingTestType.name}` : 'Tambah Jenis Tes Kompetensi Baru'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingTestType(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Nama Jenis Tes *</label>
                      <input
                        type="text"
                        required
                        value={testFormName}
                        onChange={(e) => setTestFormName(e.target.value)}
                        placeholder="Contoh: Tes Teknis Mobile Flutter / Arsitektur"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Kategori Kompetensi *</label>
                      <select
                        value={testFormCategory}
                        onChange={(e) => setTestFormCategory(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                      >
                        <option value="Hard Skill">Hard Skill (Teknis & Kode)</option>
                        <option value="Soft Skill">Soft Skill (Psikotes & Karakter)</option>
                        <option value="Kognitif & Logika">Kognitif & Logika (GMA / TPA)</option>
                        <option value="Bahasa">Kemahiran Bahasa</option>
                        <option value="Studi Kasus">Studi Kasus & Presentasi</option>
                        <option value="Praktik Kerja">Praktik Kerja Langsung (Work Sample)</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Passing Grade (0-100) *</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        required
                        value={testFormPassingGrade}
                        onChange={(e) => setTestFormPassingGrade(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Durasi Standar (Menit) *</label>
                      <input
                        type="number"
                        min={5}
                        required
                        value={testFormDuration}
                        onChange={(e) => setTestFormDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Bobot Nilai (%) *</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        required
                        value={testFormWeight}
                        onChange={(e) => setTestFormWeight(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Metode Uji *</label>
                      <select
                        value={testFormMethod}
                        onChange={(e) => setTestFormMethod(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-xs"
                      >
                        <option value="Online Test">Online Test</option>
                        <option value="Live Coding / Lab">Live Coding / Lab</option>
                        <option value="Presentasi & Tanya Jawab">Presentasi & Tanya Jawab</option>
                        <option value="Tatap Muka / Praktik Langsung">Tatap Muka / Praktik</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Panduan Penilaian & Deskripsi
                    </label>
                    <textarea
                      rows={2}
                      value={testFormDesc}
                      onChange={(e) => setTestFormDesc(e.target.value)}
                      placeholder="Petunjuk instruksi atau kriteria kelulusan bagi asesor..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={testFormIsActive}
                        onChange={(e) => setTestFormIsActive(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-slate-800">Status Aktif (Tampil di Form Pilihan Asesor)</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingTestType(false)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-2xs"
                      >
                        {editingTestType ? 'Simpan Perubahan' : 'Tambahkan ke Katalog'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Master Test Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {competencyTestTypes.map((test) => (
                  <div
                    key={test.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-shadow hover:shadow-xs space-y-2.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            {test.category === 'Hard Skill' && <Code className="w-3.5 h-3.5 text-blue-600" />}
                            {test.category === 'Soft Skill' && <Brain className="w-3.5 h-3.5 text-indigo-600" />}
                            {test.category === 'Kognitif & Logika' && <Binary className="w-3.5 h-3.5 text-emerald-600" />}
                            {test.category === 'Bahasa' && <Languages className="w-3.5 h-3.5 text-amber-600" />}
                            {test.category === 'Studi Kasus' && <Briefcase className="w-3.5 h-3.5 text-cyan-600" />}
                            {test.category === 'Praktik Kerja' && <FileCheck2 className="w-3.5 h-3.5 text-rose-600" />}
                            <span>{test.name}</span>
                          </h4>
                          <span className="text-[10px] text-slate-500 block">Kategori: {test.category}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            test.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {test.isActive !== false ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-2">
                        {test.description || 'Tidak ada catatan panduan.'}
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-2.5 text-[11px] font-mono text-slate-700 border-t border-slate-100 mt-2">
                        <div>
                          <span className="text-slate-400 font-sans block text-[10px]">Passing Grade:</span>
                          <span className="font-bold text-slate-900">{test.passingGrade} / 100</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-sans block text-[10px]">Durasi Tes:</span>
                          <span className="font-bold text-slate-900">{test.durationMinutes} Menit</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-sans block text-[10px]">Bobot Nilai:</span>
                          <span className="font-bold text-slate-900">{test.weightPercent || 20}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-sans block text-[10px]">Metode Uji:</span>
                          <span className="font-sans font-semibold text-slate-800 text-[10px] truncate block">
                            {test.method}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTestType(test)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTestTypeAction(test.id, test.name)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTestSettingsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 6: INTERVIEW & SCORECARD ADAPTIF ===================== */}
      {isInterviewModalOpen && activeCandidate && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsInterviewModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                    <span>Penjadwalan & Evaluasi Wawancara Kandidat</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      Sesi Seleksi Panel
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-300">
                    <span className="font-semibold text-white">{activeCandidate.name}</span>
                    <span>·</span>
                    <span className="text-indigo-300 font-mono">
                      {activeCandidate.appliedPosition || 'Kandidat'} ({activeCandidate.vacancyCode || 'VAC'})
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingInterviewType(false);
                    setEditingInterviewType(null);
                    setIsInterviewSettingsModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-indigo-200 hover:text-white flex items-center gap-1.5 transition-colors border border-white/10"
                  title="Buka Pengaturan Master Scorecard Wawancara"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Format Master Scorecard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsInterviewModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Internal Navigation Sub-Tabs */}
            <div className="px-5 bg-slate-100 border-b border-slate-200 flex items-center gap-1 overflow-x-auto text-xs shrink-0 py-1.5">
              <button
                type="button"
                onClick={() => setInterviewActiveTab('scorecard')}
                className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  interviewActiveTab === 'scorecard'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Scorecard Penilaian ({calculatedInterviewScore.totalScore}/100)</span>
              </button>

              <button
                type="button"
                onClick={() => setInterviewActiveTab('interviewers')}
                className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  interviewActiveTab === 'interviewers'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Tim Pewawancara</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                  {assignedInterviewers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setInterviewActiveTab('reschedule')}
                className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  interviewActiveTab === 'reschedule'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                <span>Reschedule & Jadwal</span>
                {activeCandidate.rescheduleHistory && activeCandidate.rescheduleHistory.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-orange-100 text-orange-800 font-bold">
                    {activeCandidate.rescheduleHistory.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setInterviewActiveTab('recommendation')}
                className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  interviewActiveTab === 'recommendation'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Rekomendasi Objektif Sistem</span>
                {systemObjectiveEvaluation && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    systemObjectiveEvaluation.isApproved
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {systemObjectiveEvaluation.compositeScore}
                  </span>
                )}
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* TAB 1: SCORECARD PENILAIAN */}
              {interviewActiveTab === 'scorecard' && (
                <div className="space-y-4">
                  {/* Interview Type Selector Card */}
                  <div className="p-3.5 bg-gradient-to-br from-indigo-50/70 to-blue-50/50 border border-indigo-200/80 rounded-xl space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <Award className="w-4 h-4 text-indigo-600" />
                        <span>Format / Jenis Wawancara *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingInterviewType(false);
                          setEditingInterviewType(null);
                          setIsInterviewSettingsModalOpen(true);
                        }}
                        className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold underline flex items-center gap-1"
                      >
                        <span>+ Tambah / Kustomisasi Format Scorecard</span>
                      </button>
                    </div>

                    <select
                      value={selectedInterviewTypeId}
                      onChange={(e) => handleSelectInterviewTypeInModal(e.target.value)}
                      className="w-full px-3 py-2 border border-indigo-300 rounded-lg bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs text-xs"
                    >
                      {interviewTypeSettings
                        .filter((t) => t.isActive)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} — Target: {t.targetRole || 'Semua'} ({t.criteria.length} Aspek Penilaian)
                          </option>
                        ))}
                    </select>

                    {currentSelectedInterviewType && (
                      <div className="pt-1 border-t border-indigo-100 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-indigo-100/80 text-indigo-800 font-medium">
                          🎯 Target: <strong>{currentSelectedInterviewType.targetRole || 'Semua Posisi'}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-100/80 text-blue-800 font-medium">
                          👥 Rekomendasi Pewawancara: <strong>{currentSelectedInterviewType.interviewerRoles || 'User Lead'}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-100/80 text-purple-800 font-medium">
                          📋 {currentSelectedInterviewType.criteria.length} Item Kriteria Dinilai
                        </span>
                      </div>
                    )}

                    {currentSelectedInterviewType?.description && (
                      <p className="text-[11px] text-slate-600 italic bg-white/70 p-2 rounded border border-indigo-100/60">
                        💡 <strong>Panduan Sesi:</strong> {currentSelectedInterviewType.description}
                      </p>
                    )}
                  </div>

                  {/* Summary of Schedule & Panel Pewawancara */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Jadwal Sesi</span>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{interviewDate || 'Belum dijadwalkan'}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Durasi: s.d. {interviewTimeEnd} WIB</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block">Media / Lokasi</span>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                        <Video className="w-3.5 h-3.5 text-blue-600" />
                        <span>{interviewPlatform}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 truncate block font-mono">
                        {interviewMeetingLink}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 block">Pewawancara Panel ({assignedInterviewers.length})</span>
                        <button
                          type="button"
                          onClick={() => setInterviewActiveTab('interviewers')}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          Kelola
                        </button>
                      </div>
                      <div className="mt-0.5 space-y-1">
                        {assignedInterviewers.slice(0, 2).map((inv) => (
                          <div key={inv.id} className="text-[11px] text-slate-800 font-medium truncate flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate">{inv.name}</span>
                            <span className="text-[10px] text-slate-500">({inv.role.split(' ')[0]})</span>
                          </div>
                        ))}
                        {assignedInterviewers.length > 2 && (
                          <span className="text-[10px] text-indigo-600 font-medium">
                            +{assignedInterviewers.length - 2} pewawancara lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DYNAMIC SCORECARD SECTION (1 - 5 STARS) */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">
                          Scorecard Penilaian Pewawancara ({currentSelectedInterviewType?.name})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Beri rating bintang (1 - 5) untuk setiap kriteria evaluasi berikut:
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Total Rata-rata</span>
                        <span className="font-mono font-bold text-sm text-amber-600">
                          ★ {calculatedInterviewScore.averageStars} / 5.0
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {currentSelectedInterviewType?.criteria.map((crit, idx) => {
                        const currentRating = scorecardRatings[crit.id] || 4;

                        const getRatingLabel = (val: number) => {
                          switch (val) {
                            case 5:
                              return { text: '5/5 · Sangat Istimewa (Exceeds)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
                            case 4:
                              return { text: '4/5 · Baik (Meets Expectations)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
                            case 3:
                              return { text: '3/5 · Cukup (Perlu Supervisi)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
                            case 2:
                              return { text: '2/5 · Kurang Memuaskan', color: 'text-orange-700 bg-orange-50 border-orange-200' };
                            case 1:
                              return { text: '1/5 · Sangat Kurang / Tidak Sesuai', color: 'text-rose-700 bg-rose-50 border-rose-200' };
                            default:
                              return { text: `${val}/5`, color: 'text-slate-600 bg-slate-50 border-slate-200' };
                          }
                        };

                        const ratingBadge = getRatingLabel(currentRating);

                        return (
                          <div
                            key={crit.id}
                            className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 hover:border-slate-300 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                                  {idx + 1}
                                </span>
                                <span className="font-semibold text-slate-900 text-xs">{crit.name}</span>
                                {crit.weightPercent && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-medium">
                                    Bobot {crit.weightPercent}%
                                  </span>
                                )}
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${ratingBadge.color} self-start sm:self-auto`}
                              >
                                {ratingBadge.text}
                              </span>
                            </div>

                            {crit.description && (
                              <p className="text-[11px] text-slate-500 italic pl-6">{crit.description}</p>
                            )}

                            {/* Interactive 5 Stars */}
                            <div className="pl-6 flex items-center gap-1 pt-1">
                              {[1, 2, 3, 4, 5].map((starVal) => {
                                const isFilled = currentRating >= starVal;
                                return (
                                  <button
                                    key={starVal}
                                    type="button"
                                    onClick={() => handleSetCriterionRating(crit.id, starVal)}
                                    className={`w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${
                                      isFilled
                                        ? 'bg-amber-400 text-slate-950 border border-amber-500 shadow-2xs hover:scale-105'
                                        : 'bg-slate-100 text-slate-300 border border-slate-200 hover:bg-amber-100 hover:text-amber-500'
                                    }`}
                                    title={`Pilih skor ${starVal} bintang untuk ${crit.name}`}
                                  >
                                    ★
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Score Summary Calculation Card */}
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-indigo-950 block">Ringkasan Nilai Akhir Scorecard:</span>
                        <span className="text-[11px] text-indigo-700">
                          Rata-rata {calculatedInterviewScore.averageStars} / 5.0 bintang terkonversi ke sistem penilaian skala 100.
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-indigo-600 block font-semibold uppercase tracking-wider">
                            Skor HRMS
                          </span>
                          <span className="font-mono text-xl font-extrabold text-indigo-900">
                            {calculatedInterviewScore.totalScore}
                            <span className="text-xs text-indigo-500 font-normal"> / 100</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rekomendasi User & Tim Pewawancara */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Rekomendasi Tim User Pewawancara (Hiring Manager) *
                      </label>
                      <select
                        value={userRecommendation}
                        onChange={(e) => setUserRecommendation(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Sangat Cocok / Direkomendasikan (Strong Hire)">
                          🌟 Sangat Cocok / Direkomendasikan (Strong Hire)
                        </option>
                        <option value="Cocok / Direkomendasikan (Hire)">
                          ✅ Cocok / Direkomendasikan (Hire)
                        </option>
                        <option value="Cukup / Dipertimbangkan (Hold / Talent Pool)">
                          ⚠️ Cukup / Dipertimbangkan (Hold / Talent Pool)
                        </option>
                        <option value="Kurang Cocok / Perlu Kualifikasi Tambahan">
                          🔍 Kurang Cocok / Perlu Kualifikasi Tambahan
                        </option>
                        <option value="Tidak Cocok / Ditolak (No Hire)">
                          ❌ Tidak Cocok / Ditolak (No Hire)
                        </option>
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Rekomendasi langsung dari user departemen terkait kesesuaian teknis & kecocokan budaya kerja.
                      </p>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Status Kelulusan Interview (HRBP / Recruiter) *
                      </label>
                      <select
                        value={interviewRec}
                        onChange={(e) => setInterviewRec(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Direkomendasikan Lolos">
                          ✅ Direkomendasikan Lolos (Lanjut ke Tahap Offering)
                        </option>
                        <option value="Dipertimbangkan">
                          ⚠️ Dipertimbangkan (Cadangan / Simpan ke Talent Pool)
                        </option>
                        <option value="Tidak Direkomendasikan">
                          ❌ Tidak Direkomendasikan (Diskualifikasi)
                        </option>
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Status kelulusan administrasi rekrutmen untuk penentuan langkah berikutnya.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Catatan Rinci & Evaluasi Kualitatif Sesi Wawancara
                    </label>
                    <textarea
                      rows={2}
                      value={interviewNotes}
                      onChange={(e) => setInterviewNotes(e.target.value)}
                      placeholder="Tuliskan feedback kualitatif, keunggulan teknis, area pengembangan, atau catatan khusus dari tim pewawancara..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Historical Evaluations for Candidate */}
                  {activeCandidate.interviewEvaluations && activeCandidate.interviewEvaluations.length > 0 && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <span className="font-bold text-slate-800 text-xs block">
                        Riwayat Sesi Wawancara Kandidat ({activeCandidate.interviewEvaluations.length} Tersimpan):
                      </span>
                      <div className="space-y-1.5">
                        {activeCandidate.interviewEvaluations.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between text-[11px]"
                          >
                            <div>
                              <div className="font-semibold text-slate-900">
                                {ev.interviewTypeName} · {ev.interviewDate}
                              </div>
                              <div className="text-slate-500">
                                Pewawancara: {ev.interviewer} · {ev.platform} · {ev.recommendation}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                ★ {ev.averageStars} ({ev.calculatedScore}/100)
                              </span>
                              <button
                                type="button"
                                onClick={() => deleteCandidateInterviewEvaluation(activeCandidate.id, ev.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="Hapus riwayat sesi ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TIM PEWAWANCARA PANEL (MULTI-INTERVIEWER) */}
              {interviewActiveTab === 'interviewers' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-700" />
                        <span>Penugasan Tim Pewawancara Panel ({assignedInterviewers.length} Orang)</span>
                      </h4>
                      <p className="text-[11px] text-blue-800 leading-relaxed">
                        Anda dapat menugaskan beberapa pewawancara lintas divisi (misalnya Hiring Manager / Lead Engineer bersama HRBP). Semua pewawancara yang ditugaskan akan menerima undangan kalender otomatis, notifikasi email, serta akses pengisian form evaluasi.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsInterviewerSelectorOpen(!isInterviewerSelectorOpen)}
                      className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs shrink-0 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Tambah Pewawancara</span>
                    </button>
                  </div>

                  {/* Dropdown / Picker for Adding Internal Employee as Interviewer */}
                  {isInterviewerSelectorOpen && (
                    <div className="p-3 bg-white border border-blue-300 rounded-xl shadow-md space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">
                          Pilih Karyawan Internal untuk Menjadi Pewawancara:
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsInterviewerSelectorOpen(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                        {companyEmployees.map((emp) => {
                          const isAssigned = assignedInterviewers.some(
                            (inv) => inv.email.toLowerCase() === emp.email.toLowerCase() || inv.name === emp.name
                          );
                          return (
                            <div
                              key={emp.id}
                              className={`p-2.5 flex items-center justify-between text-xs transition-colors ${
                                isAssigned ? 'bg-slate-50 opacity-60' : 'hover:bg-blue-50/60'
                              }`}
                            >
                              <div>
                                <span className="font-semibold text-slate-900 block">{emp.name}</span>
                                <span className="text-[11px] text-slate-500">
                                  {emp.title} · {emp.department} ({emp.email})
                                </span>
                              </div>
                              {isAssigned ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-[10px] border border-emerald-200">
                                  Sudah Ditugaskan
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddInterviewer(emp)}
                                  className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-colors"
                                >
                                  + Tugaskan
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* List of currently assigned interviewers */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-800 text-xs block">
                      Daftar Pewawancara yang Bertugas pada Sesi Ini:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {assignedInterviewers.map((inv, index) => (
                        <div
                          key={inv.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs">{inv.name}</span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {inv.status || 'Terkonfirmasi'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 font-medium">
                                {inv.title}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {inv.department} · {inv.email}
                              </div>
                              <div className="pt-1">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                                  Peran: <strong>{inv.role}</strong>
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveInterviewer(inv.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors shrink-0"
                            title="Hapus pewawancara dari tim"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-800 space-y-1">
                    <span className="font-bold block">💡 Best Practice Penilaian Panel:</span>
                    <p>
                      Sesi wawancara yang melibatkan minimal 2 pewawancara (1 User Teknis & 1 HRBP) meningkatkan validitas penilaian hingga 78% dan mengurangi bias individu.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: RESCHEDULE JADWAL & STATUS */}
              {interviewActiveTab === 'reschedule' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-orange-50/80 border border-orange-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-orange-950 text-xs flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span>Manajemen Penjadwalan Ulang (Reschedule)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-200 text-orange-900 font-mono">
                        Status: {activeCandidate.interviewScheduleStatus || 'Jadwal Normal'}
                      </span>
                    </div>
                    <p className="text-[11px] text-orange-800 leading-relaxed">
                      Gunakan fitur ini jika kandidat atau pewawancara meminta penyesuaian jadwal. Sistem akan memperbarui waktu kalender, mencatat riwayat perubahan, dan mengirimkan notifikasi resmi kepada seluruh pihak terkait.
                    </p>
                  </div>

                  {/* Reschedule Form Inputs */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <span className="font-bold text-slate-900 text-xs block">
                      Formulir Perubahan Jadwal Wawancara:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Tanggal & Waktu Mulai Baru *
                        </label>
                        <input
                          type="text"
                          value={interviewDate}
                          onChange={(e) => setInterviewDate(e.target.value)}
                          placeholder="YYYY-MM-DD HH:mm (e.g. 2026-10-26 10:00)"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Waktu Selesai (Perkiraan) *
                        </label>
                        <input
                          type="text"
                          value={interviewTimeEnd}
                          onChange={(e) => setInterviewTimeEnd(e.target.value)}
                          placeholder="Contoh: 11:30"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Platform Wawancara</label>
                        <select
                          value={interviewPlatform}
                          onChange={(e) => setInterviewPlatform(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="Google Meet">Google Meet (Online)</option>
                          <option value="Microsoft Teams">Microsoft Teams (Online)</option>
                          <option value="Ruang Interview Kantor">Tatap Muka / Ruang Rapat Kantor (Offline)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Tautan Video Call / Ruangan Kantor
                        </label>
                        <input
                          type="text"
                          value={interviewMeetingLink}
                          onChange={(e) => setInterviewMeetingLink(e.target.value)}
                          placeholder="https://meet.google.com/xyz atau Ruang Rapat Lt. 3"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px] focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Alasan Permintaan Reschedule *
                      </label>
                      <select
                        value={rescheduleReason}
                        onChange={(e) => setRescheduleReason(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Permintaan Kandidat (Penyesuaian Jadwal / Sakit)">
                          Permintaan Kandidat (Penyesuaian Jadwal / Sakit)
                        </option>
                        <option value="Pewawancara User Berhalangan (Rapat Mendesak / Tugas Luar)">
                          Pewawancara User Berhalangan (Rapat Mendesak / Tugas Luar)
                        </option>
                        <option value="Kendala Teknis / Gangguan Jaringan Internet">
                          Kendala Teknis / Gangguan Jaringan Internet
                        </option>
                        <option value="Penambahan Anggota Tim Pewawancara Panel">
                          Penambahan Anggota Tim Pewawancara Panel
                        </option>
                        <option value="Kebutuhan Penjadwalan Ulang Internal HR">
                          Kebutuhan Penjadwalan Ulang Internal HR
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Catatan Tambahan untuk Kandidat & Pewawancara
                      </label>
                      <input
                        type="text"
                        value={rescheduleNotes}
                        onChange={(e) => setRescheduleNotes(e.target.value)}
                        placeholder="Contoh: Kandidat mengabarkan ada ujian di kampus pada jam awal, digeser ke sesi siang."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleConfirmReschedule}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Konfirmasi & Simpan Jadwal Reschedule</span>
                      </button>
                    </div>
                  </div>

                  {/* Reschedule History Log */}
                  {activeCandidate.rescheduleHistory && activeCandidate.rescheduleHistory.length > 0 && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <span className="font-bold text-slate-900 text-xs block">
                        Riwayat Perubahan Jadwal Sebelumnya ({activeCandidate.rescheduleHistory.length} Kali):
                      </span>
                      <div className="space-y-2">
                        {activeCandidate.rescheduleHistory.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">
                                Perubahan #{idx + 1}: {item.previousDate} ➔ <strong className="text-orange-700">{item.newDate}</strong>
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {item.rescheduledAt}
                              </span>
                            </div>
                            <div className="text-slate-600">
                              Alasan: <span className="font-medium">{item.reason}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Diajukan / Diperbarui oleh: {item.requestedBy}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: REKOMENDASI OBJEKTIF SISTEM & MATRIX KELULUSAN */}
              {interviewActiveTab === 'recommendation' && systemObjectiveEvaluation && (
                <div className="space-y-4">
                  {/* Explanatory Rule-based formula banner */}
                  <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-1">
                    <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-700" />
                      <span>Formula Pembobotan Kelulusan Objektif (Non-AI Audit Compliance)</span>
                    </h4>
                    <p className="text-[11px] text-indigo-800 leading-relaxed">
                      Sistem menghitung kelayakan secara formulaik dan transparan berdasarkan standar rekrutmen perusahaan: <strong>Nilai Tes Kemampuan / Asesmen Teknis (Bobot 40%)</strong> dikombinasikan dengan <strong>Nilai Scorecard Wawancara Panel (Bobot 60%)</strong> serta konfirmasi rekomendasi tim user.
                    </p>
                  </div>

                  {/* 4 Cards Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-center space-y-1 shadow-2xs">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                        1. Tes Kemampuan (40%)
                      </span>
                      <span className="font-mono text-xl font-black text-slate-900 block">
                        {systemObjectiveEvaluation.testScore}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Kontribusi: {(systemObjectiveEvaluation.testScore * 0.4).toFixed(1)} poin
                      </span>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-center space-y-1 shadow-2xs">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                        2. Wawancara Panel (60%)
                      </span>
                      <span className="font-mono text-xl font-black text-indigo-700 block">
                        {systemObjectiveEvaluation.interviewScore}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Kontribusi: {(systemObjectiveEvaluation.interviewScore * 0.6).toFixed(1)} poin
                      </span>
                    </div>

                    <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl text-center space-y-1 shadow-2xs">
                      <span className="text-[10px] text-indigo-700 uppercase tracking-wider font-bold block">
                        3. Skor Komposit Akhir
                      </span>
                      <span className="font-mono text-2xl font-black text-indigo-950 block">
                        {systemObjectiveEvaluation.compositeScore}
                        <span className="text-xs font-normal text-indigo-600"> / 100</span>
                      </span>
                      <span className="text-[10px] text-indigo-800 font-semibold">
                        Passing Grade: {systemObjectiveEvaluation.passingGrade}
                      </span>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-center space-y-1 shadow-2xs">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                        4. Rekomendasi User
                      </span>
                      <div className="font-bold text-xs text-slate-800 line-clamp-2 mt-1">
                        {userRecommendation.split('(')[0]}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-medium">
                        Tim Hiring Manager
                      </span>
                    </div>
                  </div>

                  {/* Decision Verdict Banner */}
                  <div className={`p-4 rounded-xl border space-y-2 ${
                    systemObjectiveEvaluation.status === 'Sangat Direkomendasikan'
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                      : systemObjectiveEvaluation.status === 'Dipertimbangkan'
                      ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                      : 'bg-rose-50/90 border-rose-300 text-rose-950'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {systemObjectiveEvaluation.status === 'Sangat Direkomendasikan' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : systemObjectiveEvaluation.status === 'Dipertimbangkan' ? (
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600" />
                        )}
                        <span className="font-bold text-sm">
                          Hasil Penilaian Sistem: {systemObjectiveEvaluation.status}
                        </span>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-white shadow-2xs border border-current">
                        Skor Komposit: {systemObjectiveEvaluation.compositeScore}/100
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed pl-7">
                      {systemObjectiveEvaluation.rationale}
                    </p>

                    {systemObjectiveEvaluation.isApproved && (
                      <div className="pt-2 pl-7 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleProceedToOfferingFromInterview}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Lanjutkan ke Tahap Offering Letter Langsung</span>
                        </button>
                        <span className="text-[11px] text-emerald-800 italic">
                          (Menyimpan hasil evaluasi dan membuka form penawaran gaji & PKWT)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Audit Trail & Compliance Checklist */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 text-xs block">
                      Kriteria Kelayakan SOP Rekrutmen Terpenuhi:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Nilai Tes Kemampuan: <strong>{systemObjectiveEvaluation.testScore}</strong> (Min. 70)</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Skor Scorecard Bintang: <strong>★ {calculatedInterviewScore.averageStars} / 5.0</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Pewawancara Panel Ditugaskan: <strong>{assignedInterviewers.length} Orang</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Rekomendasi User: <strong>{userRecommendation.split('(')[0]}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Scorecard: <strong>★ {calculatedInterviewScore.averageStars} ({calculatedInterviewScore.totalScore}/100)</strong></span>
                <span>·</span>
                <span>Pewawancara: <strong>{assignedInterviewers.length} Orang</strong></span>
                {systemObjectiveEvaluation && (
                  <>
                    <span>·</span>
                    <span className="text-indigo-700 font-semibold">
                      Komposit: {systemObjectiveEvaluation.compositeScore}/100
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsInterviewModalOpen(false)}
                  className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Tutup
                </button>

                {systemObjectiveEvaluation?.isApproved && (
                  <button
                    type="button"
                    onClick={handleProceedToOfferingFromInterview}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                    title="Simpan evaluasi dan langsung buka form penerbitan Offering Letter"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Lanjut ke Offering</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveInterview}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>Simpan Scorecard & Jadwal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 6B: MASTER PENGATURAN SCORECARD WAWANCARA ===================== */}
      {isInterviewSettingsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsInterviewSettingsModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Pengaturan Master Scorecard & Jenis Wawancara</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Kelola jenis wawancara (HR, Teknis, User Lead, Board), target peran, serta item kriteria scorecard evaluasi bintang (1-5).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInterviewSettingsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Bar */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Total Format Terdaftar: <strong>{interviewTypeSettings.length}</strong>
                </span>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleResetInterviewTypesAction}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium underline flex items-center gap-1"
                  title="Kembalikan semua pengaturan ke preset bawaan sistem"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>Reset ke Standar Default</span>
                </button>
              </div>

              {!isAddingInterviewType && (
                <button
                  type="button"
                  onClick={handleOpenAddInterviewType}
                  className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Format Wawancara Baru</span>
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-5 space-y-5 text-xs overflow-y-auto flex-1">
              {/* Form Tambah/Edit Jenis Wawancara */}
              {isAddingInterviewType && (
                <form
                  onSubmit={handleSaveInterviewTypeForm}
                  className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
                    <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-2">
                      <Edit2 className="w-3.5 h-3.5 text-indigo-700" />
                      <span>{editingInterviewType ? 'Edit Format Wawancara' : 'Tambah Format Wawancara Baru'}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingInterviewType(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                    >
                      Tutup Form
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Nama Format Wawancara *</label>
                      <input
                        type="text"
                        required
                        value={interviewFormName}
                        onChange={(e) => setInterviewFormName(e.target.value)}
                        placeholder="Contoh: Wawancara Teknis & Arsitektur"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Target Posisi / Peran</label>
                      <input
                        type="text"
                        value={interviewFormTargetRole}
                        onChange={(e) => setInterviewFormTargetRole(e.target.value)}
                        placeholder="Contoh: Engineering & Tech / Semua Posisi"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Role Pewawancara Disarankan</label>
                      <input
                        type="text"
                        value={interviewFormInterviewerRoles}
                        onChange={(e) => setInterviewFormInterviewerRoles(e.target.value)}
                        placeholder="Contoh: Tech Lead / VP Engineering"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Deskripsi & Petunjuk Wawancara
                    </label>
                    <textarea
                      rows={2}
                      value={interviewFormDesc}
                      onChange={(e) => setInterviewFormDesc(e.target.value)}
                      placeholder="Panduan bagi pewawancara untuk mempersiapkan sesi..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Kriteria Scorecard Builder */}
                  <div className="p-3 bg-white border border-indigo-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>Daftar Kriteria Scorecard ({interviewFormCriteria.length} Aspek):</span>
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Skala penilaian 1 - 5 bintang di form wawancara
                      </span>
                    </div>

                    {/* Criteria List */}
                    <div className="space-y-2">
                      {interviewFormCriteria.map((crit, idx) => (
                        <div
                          key={crit.id}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">
                                {idx + 1}. {crit.name}
                              </span>
                              {crit.weightPercent && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-mono font-semibold">
                                  Bobot: {crit.weightPercent}%
                                </span>
                              )}
                            </div>
                            {crit.description && (
                              <p className="text-[11px] text-slate-500 italic">{crit.description}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCriterionFromForm(crit.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors shrink-0"
                            title="Hapus kriteria ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Criterion Subform */}
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <span className="font-semibold text-slate-700 text-[11px] block">
                        + Tambahkan Item Kriteria Baru:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-6">
                          <input
                            type="text"
                            value={newCritName}
                            onChange={(e) => setNewCritName(e.target.value)}
                            placeholder="Nama kriteria (e.g. Problem Solving & Arsitektur)"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            value={newCritDesc}
                            onChange={(e) => setNewCritDesc(e.target.value)}
                            placeholder="Panduan indikator perilaku (opsional)"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            type="button"
                            onClick={handleAddCriterionToForm}
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Tambah</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={interviewFormIsActive}
                        onChange={(e) => setInterviewFormIsActive(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700 text-xs">
                        Format Wawancara Aktif (Dapat Dipilih Pewawancara)
                      </span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingInterviewType(false)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-semibold text-xs shadow-2xs"
                      >
                        {editingInterviewType ? 'Perbarui Format Wawancara' : 'Simpan Format Wawancara'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Master Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {interviewTypeSettings.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>{item.name}</span>
                          </h4>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Target: <strong>{item.targetRole || 'Semua'}</strong> · Pewawancara: {item.interviewerRoles || 'User'}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.isActive ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100">
                          {item.description}
                        </p>
                      )}

                      {/* Criteria Preview Box */}
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                          Item Kriteria Scorecard ({item.criteria.length}):
                        </span>
                        <div className="space-y-1">
                          {item.criteria.map((c, i) => (
                            <div key={c.id} className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-800 font-medium">
                                {i + 1}. {c.name}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500">
                                {c.weightPercent ? `${c.weightPercent}%` : '1-5 ★'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditInterviewType(item)}
                        className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Format & Kriteria</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteInterviewTypeAction(item.id, item.name)}
                        className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsInterviewSettingsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 7: ADVANCED OFFERING CALCULATOR ===================== */}
      {isOfferingModalOpen && activeCandidate && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOfferingModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-400" />
                  <span>Kalkulator Offering Letter & Simulasi PPh 21 TER</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {activeCandidate.name} · Nomor Dokumen: <span className="font-mono text-blue-300">{docNumber}</span>
                </span>
              </div>
              <button onClick={() => setIsOfferingModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {offeringFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{offeringFormError}</span>
                </div>
              )}

              {/* Verifikasi Status Wawancara */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span className="font-bold text-emerald-950 text-xs">Verifikasi SOP Rekrutmen:</span>
                  <span className="text-emerald-800 font-medium text-xs">
                    Kandidat telah dinyatakan <b>Lolos Wawancara</b> (User Lead / Direksi).
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Layak Diberikan Offering Letter ✓
                </span>
              </div>

              {/* Mode Switcher */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-bold text-blue-950 block">Pilih Mode Perhitungan Offering:</span>
                  <span className="text-[11px] text-blue-800">
                    Gross (Gaji Kotor) atau Net (Target Take Home Pay).
                  </span>
                </div>

                <div className="inline-flex rounded-lg border border-blue-300 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setOfferingMode('gross')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      offeringMode === 'gross' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Gaji Kotor (Gross)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferingMode('net')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      offeringMode === 'net' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Target THP (Net)
                  </button>
                </div>
              </div>

              {/* Meta Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Surat Penawaran *</label>
                  <input
                    type="text"
                    required
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Tanggal Mulai Bekerja *</label>
                  <input
                    type="date"
                    required
                    value={targetJoinDate}
                    onChange={(e) => setTargetJoinDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status Pajak PTKP Calon Karyawan</label>
                  <select
                    value={candidatePtkp}
                    onChange={(e) => setCandidatePtkp(e.target.value as PTKPStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                  >
                    <option value="TK/0">TK/0 (Lajang - Kategori TER A)</option>
                    <option value="TK/1">TK/1 (Tanggungan 1 - Kategori TER A)</option>
                    <option value="K/0">K/0 (Menikah - Kategori TER A)</option>
                    <option value="K/1">K/1 (Menikah Anak 1 - Kategori TER B)</option>
                    <option value="K/2">K/2 (Menikah Anak 2 - Kategori TER B)</option>
                  </select>
                </div>
              </div>

              {/* Salary Components */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <span className="font-bold text-slate-900 block text-xs">
                  Komponen Upah Bulanan Penawaran:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Gaji Pokok (Basic Salary) *</label>
                    <CurrencyInput
                      value={components.basicSalary}
                      onChange={(val) => setComponents((prev) => ({ ...prev, basicSalary: val }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tunjangan Tetap</label>
                    <CurrencyInput
                      value={components.fixedAllowance}
                      onChange={(val) => setComponents((prev) => ({ ...prev, fixedAllowance: val }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Tunjangan Jabatan</label>
                    <CurrencyInput
                      value={components.positionAllowance}
                      onChange={(val) => setComponents((prev) => ({ ...prev, positionAllowance: val }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Tunjangan Transport</label>
                    <CurrencyInput
                      value={components.transportAllowance}
                      onChange={(val) => setComponents((prev) => ({ ...prev, transportAllowance: val }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Tunjangan Makan</label>
                    <CurrencyInput
                      value={components.mealAllowance}
                      onChange={(val) => setComponents((prev) => ({ ...prev, mealAllowance: val }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-0.5">Tunjangan Komunikasi</label>
                    <CurrencyInput
                      value={components.communicationAllowance}
                      onChange={(val) => setComponents((prev) => ({ ...prev, communicationAllowance: val }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Calculation Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-900 text-white rounded-xl">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Gaji Kotor Bulanan (Gross)</span>
                  <span className="text-base font-bold font-mono text-white">{formatRupiah(grossMonthly)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Potongan Pajak PPh 21 TER & BPJS</span>
                  <span className="text-base font-bold font-mono text-rose-300">
                    - {formatRupiah(terCalc.taxAmount + bpjsEmployeeDeduction)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-emerald-400 font-bold block mb-0.5">Take Home Pay Bersih (Nett)</span>
                  <span className="text-base font-bold font-mono text-emerald-400">{formatRupiah(netTakeHomePay)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOfferingModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendOffering}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-2xs flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>Terbitkan Dokumen Offering Letter →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 7b: PREVIEW CETAK DOKUMEN OFFERING LETTER BER-QR ===================== */}
      {isOfferingDocPreviewOpen && activeCandidate && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOfferingDocPreviewOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold">Surat Penawaran Kerja Resmi (Job Offering Letter)</h3>
                  {(!activeCandidate.offeringStatus || activeCandidate.offeringStatus === 'Draft') && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Draft (Siap Dikirim)
                    </span>
                  )}
                  {activeCandidate.offeringStatus === 'Terkirim' && !activeCandidate.offeringCandidateResponse && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                      Terkirim · Menunggu Balasan
                    </span>
                  )}
                  {activeCandidate.offeringCandidateResponse === 'Cocok' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ✓ Balasan: Cocok
                    </span>
                  )}
                  {activeCandidate.offeringCandidateResponse === 'Nego' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      ⇄ Balasan: Nego
                    </span>
                  )}
                  {activeCandidate.offeringCandidateResponse === 'Tidak Cocok' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      ✕ Balasan: Tidak Cocok
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{activeCandidate.offeringDocNumber || docNumber}</span>
              </div>
              <button onClick={() => setIsOfferingDocPreviewOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-5 text-slate-900 font-serif leading-relaxed text-xs">
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {safeTenant.documentLogoUrl ? (
                    <img
                      src={safeTenant.documentLogoUrl}
                      alt={safeTenant.name}
                      className="w-12 h-12 rounded-lg object-contain border border-slate-200 p-0.5 bg-white shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0 font-sans">
                      {safeTenant.logoText || 'N'}
                    </div>
                  )}
                  <div>
                    <h1 className="text-base font-bold tracking-wider font-sans uppercase">
                      {safeTenant.name}
                    </h1>
                    <p className="text-[10px] text-slate-600 font-sans">
                      Menara Palma Lantai 18, Jl. HR Rasuna Said, {safeTenant.city} · Telp: (021) 555-0199
                    </p>
                    <p className="text-[10px] text-slate-500 font-sans">
                      NPWP Perusahaan: {safeTenant.npwp}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-0.5">
                <h2 className="text-sm font-bold uppercase underline tracking-wide font-sans">
                  SURAT PENAWARAN KERJA RESMI (JOB OFFERING LETTER)
                </h2>
                <div className="font-mono text-slate-600 font-semibold text-[11px]">
                  Nomor: {activeCandidate.offeringDocNumber || docNumber}
                </div>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <p>Kepada Yth. <strong>{activeCandidate.name}</strong>,</p>
                <p className="leading-normal">
                  Sehubungan dengan proses seleksi yang telah Saudara/i lalui secara kompetitif, Manajemen{' '}
                  <span className="font-semibold">{safeTenant.name}</span> dengan bangga menyampaikan penawaran kerja resmi dengan rincian sebagai berikut:
                </p>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Jabatan Ditawarkan</span>
                    <span className="col-span-2 font-bold text-slate-900">
                      {vacancies.find((v) => v.id === activeCandidate.jobVacancyId)?.title || 'Senior Specialist'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Tanggal Mulai Bertugas</span>
                    <span className="col-span-2 font-mono font-semibold text-slate-900">{targetJoinDate}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Gaji Pokok Bulanan</span>
                    <span className="col-span-2 font-mono font-bold text-slate-900">{formatRupiah(components.basicSalary)}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Total Tunjangan</span>
                    <span className="col-span-2 font-mono font-medium text-slate-800">{formatRupiah(activeAllowances)}</span>
                  </div>
                  <div className="grid grid-cols-3 pt-1 border-t border-slate-200">
                    <span className="text-slate-700 font-bold">Total Gaji Kotor (Gross)</span>
                    <span className="col-span-2 font-mono font-bold text-blue-900">
                      {formatRupiah(activeCandidate.offeredSalary || grossMonthly)}
                    </span>
                  </div>
                </div>

                <p className="leading-normal">
                  Paket penawaran ini telah mencakup kepesertaan BPJS Ketenagakerjaan (JHT, JKK, JKM, JP), BPJS Kesehatan, dan fasilitas penunjang kerja sesuai regulasi yang berlaku di Republik Indonesia.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 font-sans items-end">
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 block">Diterbitkan oleh:</span>
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-white border border-slate-200 rounded">
                      <QRCodeView
                        value={`VERIFIED_OFFERING:${activeCandidate.offeringDocNumber || docNumber}:${safeTenant.code}:${activeCandidate.name}`}
                        size={64}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Aditya Pratama, S.Psi.</div>
                      <div className="text-[10px] text-slate-500">Head of People & Culture</div>
                      <div className="text-[9px] font-mono text-emerald-700 font-semibold mt-0.5">
                        Tervalidasi Digital QR
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-[10px] text-slate-500 block">Menyetujui Penawaran:</span>
                  <div className="h-12 flex items-center justify-end">
                    <span className="text-xs text-slate-400 italic">
                      {activeCandidate.offeringCandidateResponse === 'Cocok'
                        ? '✓ Telah Ditandatangani Digital (Cocok)'
                        : '(Tanda Tangan Calon Karyawan)'}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{activeCandidate.name}</div>
                  <div className="text-[10px] text-slate-500">
                    Tanggal: {activeCandidate.offeringResponseDate || '___________________'}
                  </div>
                </div>
              </div>

              {/* ===================== ALUR STATUS PENGIRIMAN & BALASAN KANDIDAT ===================== */}
              {(!activeCandidate.offeringStatus || activeCandidate.offeringStatus === 'Draft') ? (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs font-sans">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <span className="font-bold text-blue-950 block">Dokumen Penawaran Kerja Baru Saja Diterbitkan:</span>
                      <span className="text-blue-700 text-[11px]">
                        Dokumen siap dikirimkan ke calon karyawan via Email / WhatsApp. Klik tombol <b>"Kirim Dokumen Offering"</b> di bawah untuk mengirimkan surat resmi.
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-sans">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">
                          Surat Penawaran Terkirim ke Calon Karyawan
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Terkirim ke <b>{activeCandidate.email}</b> pada {activeCandidate.offeringSentDate || 'Hari ini'}.
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                      Catat Balasan Calon Karyawan:
                    </span>
                  </div>

                  {/* 3 Opsi Balasan: Cocok, Nego, Tidak Cocok */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRecordCandidateResponse(activeCandidate, 'Cocok')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        activeCandidate.offeringCandidateResponse === 'Cocok'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-500/20 font-bold'
                          : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                          <CheckCircle className="w-4 h-4" />
                          <span>1. Cocok</span>
                        </div>
                        {activeCandidate.offeringCandidateResponse === 'Cocok' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-1">Setuju seluruh paket penawaran kerja</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRecordCandidateResponse(activeCandidate, 'Nego')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        activeCandidate.offeringCandidateResponse === 'Nego'
                          ? 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-500/20 font-bold'
                          : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                          <RefreshCw className="w-4 h-4" />
                          <span>2. Nego</span>
                        </div>
                        {activeCandidate.offeringCandidateResponse === 'Nego' && (
                          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-1">Minta negosiasi gaji / tunjangan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRecordCandidateResponse(activeCandidate, 'Tidak Cocok')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        activeCandidate.offeringCandidateResponse === 'Tidak Cocok'
                          ? 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-500/20 font-bold'
                          : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                          <XCircle className="w-4 h-4" />
                          <span>3. Tidak Cocok</span>
                        </div>
                        {activeCandidate.offeringCandidateResponse === 'Tidak Cocok' && (
                          <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-1">Menolak paket penawaran kerja</span>
                    </button>
                  </div>

                  {/* Banner feedback penjelasan status */}
                  {activeCandidate.offeringCandidateResponse === 'Cocok' && (
                    <div className="p-3 bg-emerald-100/80 border border-emerald-300 rounded-lg text-emerald-950 text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span><b>Kandidat Cocok (Setuju):</b> Calon karyawan menyetujui offering letter. Silakan klik tombol <b>Konfirmasi Terima (Hired & Onboard)</b> di bawah.</span>
                      </div>
                    </div>
                  )}

                  {activeCandidate.offeringCandidateResponse === 'Nego' && (
                    <div className="p-3 bg-amber-100/80 border border-amber-300 rounded-lg text-amber-950 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Kandidat Mengajukan Negosiasi (Nego):</span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        {activeCandidate.offeringResponseNotes || 'Kandidat mengajukan permohonan penyesuaian paket kompensasi atau fasilitas penunjang.'}
                      </p>
                      <p className="text-[11px] text-amber-900 font-medium">
                        Anda dapat memilih <b>"Revisi Paket Penawaran"</b> (menyesuaikan rincian gaji) atau <b>"Sepakati Nego & Terima"</b> atau <b>"Tolak Nego"</b>.
                      </p>
                    </div>
                  )}

                  {activeCandidate.offeringCandidateResponse === 'Tidak Cocok' && (
                    <div className="p-3 bg-rose-100/80 border border-rose-300 rounded-lg text-rose-950 text-xs flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span><b>Kandidat Tidak Cocok (Menolak Penawaran):</b> Anda dapat memproses keputusan Tolak (Disqualified) dan memindahkan berkas kandidat ke Talent Pool.</span>
                    </div>
                  )}
                </div>
              )}

              {/* ===================== FOOTER ACTIONS DENGAN FLOW KIRIM -> RESPON -> HIRED/TOLAK ===================== */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 font-sans">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOfferingDocPreviewOpen(false);
                      handleOpenOfferingModal(activeCandidate);
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center gap-1.5 text-xs transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Kalkulator & Form Offering</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 text-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Dokumen</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* KONDISI 1: Dokumen baru terbit / Draft -> Tombol KIRIM OFFERING */}
                  {(!activeCandidate.offeringStatus || activeCandidate.offeringStatus === 'Draft') && (
                    <button
                      type="button"
                      onClick={() => handleSendOfferingToCandidate(activeCandidate)}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-xs flex items-center gap-2 text-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Dokumen Offering ke Kandidat</span>
                    </button>
                  )}

                  {/* KONDISI 2: Terkirim, tapi belum ada balasan */}
                  {activeCandidate.offeringStatus === 'Terkirim' && !activeCandidate.offeringCandidateResponse && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 italic hidden sm:inline">
                        Pilih balasan (Cocok / Nego / Tidak Cocok) di atas
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSendOfferingToCandidate(activeCandidate)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 text-xs transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Ulang (Resend)</span>
                      </button>
                    </div>
                  )}

                  {/* KONDISI 3: Balasan COCOK -> Tombol DITERIMA (HIRED) AKTIF */}
                  {activeCandidate.offeringCandidateResponse === 'Cocok' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleConfirmHired(activeCandidate);
                        setIsOfferingDocPreviewOpen(false);
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 text-xs transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Konfirmasi Terima (Hired & Onboard)</span>
                    </button>
                  )}

                  {/* KONDISI 4: Balasan NEGO -> Opsi Revisi / Terima Nego / Tolak Nego */}
                  {activeCandidate.offeringCandidateResponse === 'Nego' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleConfirmDisqualified(activeCandidate, 'Negosiasi penawaran kerja tidak mencapai kesepakatan.');
                          setIsOfferingDocPreviewOpen(false);
                        }}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold flex items-center gap-1.5 text-xs transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Tolak Nego</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOfferingDocPreviewOpen(false);
                          handleOpenOfferingModal(activeCandidate);
                        }}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center gap-1.5 text-xs transition-colors shadow-2xs"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Revisi Paket Penawaran</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleConfirmHired(activeCandidate);
                          setIsOfferingDocPreviewOpen(false);
                        }}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 text-xs transition-colors shadow-2xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Sepakati Nego & Terima (Hired)</span>
                      </button>
                    </div>
                  )}

                  {/* KONDISI 5: Balasan TIDAK COCOK -> Tombol TOLAK AKTIF */}
                  {activeCandidate.offeringCandidateResponse === 'Tidak Cocok' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleConfirmDisqualified(activeCandidate, 'Kandidat menyatakan Tidak Cocok / Menolak paket penawaran kerja.');
                        setIsOfferingDocPreviewOpen(false);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 text-xs transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tolak (Disqualified / Talent Pool)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 8: TAMBAH PELAMAR & UPLOAD CV MANUAL ===================== */}
      {isCandidateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCandidateModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-blue-400" />
                  <span>Upload CV & Registrasi Pelamar Manual</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Untuk pelamar dari Email, WhatsApp, Google Form, Walk-in, atau File Offline
                </span>
              </div>
              <button onClick={() => setIsCandidateModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const defaultName = candName.trim() || 'Kandidat Baru';
                const finalFileName = uploadedCv?.name || `CV_${defaultName.replace(/\s+/g, '_')}.pdf`;
                const finalFileSize = uploadedCv?.size || '1.2 MB';

                addCandidate({
                  jobVacancyId: candVacancyId,
                  name: defaultName,
                  email: candEmail || `${defaultName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                  phone: candPhone,
                  lastCompany: candCompany || 'Perusahaan Sebelumnya',
                  expectedSalary: Number(candSalary),
                  stage: 'Incoming',
                  sourcePortal: candSource,
                  resumeParsed: true,
                  cvFileName: finalFileName,
                  cvFileSize: finalFileSize,
                  parsedData: {
                    fullName: defaultName,
                    email: candEmail || `${defaultName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                    phone: candPhone,
                    currentTitle: 'Professional Specialist',
                    currentCompany: candCompany || 'Previous Company',
                    totalExperienceYears: 3,
                    education: 'S1 Sarjana',
                    university: 'Universitas Terkemuka',
                    topSkills: ['Problem Solving', 'Communication', 'Technical Proficiency'],
                    extractionScore: 98,
                    parsedAt: new Date().toISOString().split('T')[0],
                  },
                });
                setIsCandidateModalOpen(false);
                setCandName('');
                setUploadedCv(null);
                alert(`File CV '${finalFileName}' untuk '${defaultName}' berhasil diupload & masuk ke Pipeline Incoming!`);
              }}
              className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto"
            >
              {/* UPLOAD FILE CV DROPZONE */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Dokumen CV (PDF / DOCX / DOC)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Maksimal 10 MB</span>
                </label>

                <input
                  type="file"
                  id="cv-manual-upload-input"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCvFileUpload}
                  className="hidden"
                />

                {!uploadedCv ? (
                  <label
                    htmlFor="cv-manual-upload-input"
                    className="cursor-pointer border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/70 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 transition-colors text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-800 text-xs">
                      Klik untuk Pilih File CV atau Drag & Drop ke sini
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Sistem akan otomatis mengekstrak nama dan informasi pelamar
                    </span>
                  </label>
                ) : (
                  <div className="border border-emerald-300 bg-emerald-50/60 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">
                          {uploadedCv.name}
                        </div>
                        <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium mt-0.5">
                          <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Ukuran: {uploadedCv.size} • Terbaca & Siap di-Parsing</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <label
                        htmlFor="cv-manual-upload-input"
                        className="cursor-pointer px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-[10px] font-semibold text-slate-700 transition-colors"
                      >
                        Ganti File
                      </label>
                      <button
                        type="button"
                        onClick={() => setUploadedCv(null)}
                        className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors"
                        title="Hapus File"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* DATA PELAMAR */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap Pelamar *</label>
                  <input
                    type="text"
                    required
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    placeholder="Contoh: Raditya Pratama"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Email</label>
                    <input
                      type="email"
                      value={candEmail}
                      onChange={(e) => setCandEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">No. WhatsApp / HP</label>
                    <input
                      type="text"
                      value={candPhone}
                      onChange={(e) => setCandPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Posisi Lowongan yang Dilamar *</label>
                  <select
                    value={candVacancyId}
                    onChange={(e) => setCandVacancyId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                  >
                    {vacancies.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.title} ({v.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Kanal Asal / Sumber Pelamar</label>
                    <select
                      value={candSource}
                      onChange={(e) => setCandSource(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                    >
                      <option value="Upload Manual (File CV)">📁 Upload Manual (File CV Langsung)</option>
                      <option value="Direct Email ke HR">✉️ Direct Email ke HR</option>
                      <option value="WhatsApp / Referral Karyawan">💬 WhatsApp / Referensi Internal</option>
                      <option value="Google Form / Formulir Eksternal">📋 Google Form / Formulir Eksternal</option>
                      <option value="Job Fair / Walk-in Offline">🏢 Job Fair / Walk-In Offline</option>
                      <option value="Website Karir Internal">🌐 Website Karir Internal</option>
                      <option value="LinkedIn">💼 LinkedIn</option>
                      <option value="Jobstreet">🎯 JobStreet</option>
                      <option value="Glints">🚀 Glints</option>
                      <option value="Kalibrr">⚡ Kalibrr</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Ekspektasi Gaji Bulanan (IDR)</label>
                    <input
                      type="number"
                      value={candSalary}
                      onChange={(e) => setCandSalary(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Perusahaan / Pengalaman Terakhir</label>
                  <input
                    type="text"
                    value={candCompany}
                    onChange={(e) => setCandCompany(e.target.value)}
                    placeholder="Contoh: PT Teknologi Bangsa / Startup"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Simpan & Masukkan ke Pipeline Incoming</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 9: OFFERING GATE VALIDATION (SOP WAWANCARA) ===================== */}
      {offeringGateCandidate && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOfferingGateCandidate(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                  <ShieldAlert className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Validasi SOP Penawaran Kerja (Offering)</h3>
                  <p className="text-[11px] text-amber-800 font-medium">Syarat Kelulusan Wawancara Belum Terpenuhi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOfferingGateCandidate(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs">
              {/* Candidate Info Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{offeringGateCandidate.name}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getInterviewStatusInfo(offeringGateCandidate).badgeClass}`}>
                    {getInterviewStatusInfo(offeringGateCandidate).statusLabel}
                  </span>
                </div>
                <div className="text-slate-600 text-xs">
                  Posisi Dilamar:{' '}
                  <span className="font-semibold text-slate-800">
                    {vacancies.find((v) => v.id === offeringGateCandidate.jobVacancyId)?.title || 'Posisi Jabatan'}
                  </span>
                </div>
              </div>

              {/* SOP Rule Card */}
              <div className="p-4 bg-amber-50/60 border border-amber-200/90 rounded-xl space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-slate-700 leading-relaxed">
                    <p className="font-bold text-amber-950">Aturan Ketat SOP Rekrutmen & Tata Kelola HR:</p>
                    <p>{getInterviewStatusInfo(offeringGateCandidate).reason}</p>
                  </div>
                </div>
              </div>

              {/* Guidance Checklist */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Langkah yang Diperlukan Sebelum Buat Offering:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed pl-1">
                  <li>Jadwalkan atau laksanakan sesi wawancara dengan User Lead / Direksi.</li>
                  <li>Buka Scorecard Evaluasi Wawancara di Tab Pipeline (Interview).</li>
                  <li>Pastikan Pewawancara memilih rekomendasi final: <span className="font-bold text-emerald-700">"Direkomendasikan Lolos"</span>.</li>
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setOfferingGateCandidate(null)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
              {offeringGateCandidate.id !== 'dummy' && (
                <button
                  type="button"
                  onClick={() => {
                    const cand = offeringGateCandidate;
                    setOfferingGateCandidate(null);
                    handleOpenInterviewModal(cand);
                  }}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Buka Form Wawancara & Scorecard →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 10: PILIH KANDIDAT LOLOS UNTUK OFFERING ===================== */}
      {isSelectOfferingCandidateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSelectOfferingCandidateModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Pilih Kandidat Terverifikasi Lolos Wawancara</span>
                </h3>
                <span className="text-xs text-slate-400">Siap diterbitkan Surat Penawaran Kerja Resmi</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectOfferingCandidateModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {pipelineCandidates
                .filter((c) => c.stage === 'Interview' && isInterviewPassed(c))
                .map((cand) => {
                  const vac = vacancies.find((v) => v.id === cand.jobVacancyId);
                  return (
                    <div
                      key={`sel-off-${cand.id}`}
                      onClick={() => {
                        setIsSelectOfferingCandidateModalOpen(false);
                        handleOpenOfferingModal(cand);
                      }}
                      className="p-3.5 bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700 text-xs truncate">
                          {cand.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {vac?.title || 'Posisi'} · {cand.lastCompany || 'Pekerja Mandiri'}
                        </div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Lolos Wawancara (Skor: {cand.interviewScore || 85}/100)</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-blue-700 group-hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shrink-0"
                      >
                        Pilih & Buat Offering →
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSelectOfferingCandidateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 11: PENGATURAN TEMPLATE CHECKLIST ONBOARDING ===================== */}
      {isChecklistSettingsOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsChecklistSettingsOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Pengaturan Template Checklist Onboarding</h3>
                  <p className="text-[11px] text-slate-400">Atur penugasan departemen (GA, IT, HR, Finance) & jenis aksi standar orientasi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChecklistSettingsOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Form Tambah Item Baru */}
              <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-3">
                <span className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                  <Plus className="w-4 h-4 text-blue-700" />
                  <span>Tambah Item Tugas Onboarding Baru</span>
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Judul Tugas / Checklist *</label>
                    <input
                      type="text"
                      value={newTmplTitle}
                      onChange={(e) => setNewTmplTitle(e.target.value)}
                      placeholder="Contoh: Orientasi Lapangan & Health Safety Induction"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Departemen Pelaksana</label>
                      <select
                        value={newTmplDept}
                        onChange={(e) => setNewTmplDept(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                      >
                        <option value="HR">HR (Human Resources)</option>
                        <option value="GA">GA (General Affairs)</option>
                        <option value="IT">IT (Teknologi & Sistem)</option>
                        <option value="Finance">Finance & Payroll</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Jenis Pemeriksaan</label>
                      <select
                        value={newTmplVerif}
                        onChange={(e) => setNewTmplVerif(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                      >
                        <option value="manual">📋 Ceklis Manual</option>
                        <option value="automated">⚡ Pemeriksaan Otomatis (Form Aksi)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Jenis Aksi Terkait</label>
                      <select
                        value={newTmplAction}
                        onChange={(e) => setNewTmplAction(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                      >
                        <option value="none">Tidak Ada (Ceklis Biasa)</option>
                        <option value="id_card_request">Pengajuan ID Card GA</option>
                        <option value="dossier_verification">Verifikasi Dossier</option>
                        <option value="laptop_provisioning">Alokasi Laptop IT</option>
                        <option value="account_email_setup">Provisioning Akun/Email</option>
                        <option value="contract_signing">Verifikasi TTD Kontrak</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={newTmplMandatory}
                        onChange={(e) => setNewTmplMandatory(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-xs">Wajib Selesai Sebelum Finalisasi (Mandatory)</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleAddChecklistTemplate}
                      className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambahkan Item</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Daftar Template Saat Ini */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>Daftar Template Aktif ({onboardingChecklistTemplates.length} Item)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResetChecklistTemplates}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset ke Default SOP Perusahaan</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {onboardingChecklistTemplates.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                item.targetDepartment === 'GA'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : item.targetDepartment === 'IT'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : item.targetDepartment === 'Finance'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}
                            >
                              {item.targetDepartment}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {item.verificationType === 'automated' ? '⚡ Otomatis' : '📋 Manual'}
                            </span>
                            {item.isMandatory && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                Wajib
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Kategori: {item.category} · Aksi: {item.actionType !== 'none' ? item.actionType : 'Tidak ada'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteChecklistTemplate(item.id)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        title="Hapus template ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsChecklistSettingsOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                Selesai & Simpan Pengaturan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 12: FORM PENGAJUAN ID CARD KE GA ===================== */}
      {isIdCardModalOpen && activeActionProcess && activeActionTask && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsIdCardModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Form Pengajuan ID Card & Akses ke GA</h3>
                  <p className="text-[11px] text-amber-100">General Affairs · Tiket Pencetakan Fisik & Hak Akses</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsIdCardModalOpen(false)}
                className="w-8 h-8 rounded-lg text-white/80 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Target info */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Nama Karyawan:</span>
                  <span className="font-bold text-slate-900">{activeActionProcess.employeeName}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Posisi & Departemen:</span>
                  <span>{activeActionProcess.position} · {activeActionProcess.department}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Jenis ID Card *</label>
                <select
                  value={idCardType}
                  onChange={(e) => setIdCardType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-1 focus:ring-amber-500 outline-hidden"
                >
                  <option value="RFID Smart Card (Standard Access)">RFID Smart Card (Standard Access All-in-One)</option>
                  <option value="Magnetic Stripe Badge + NFC">Magnetic Stripe Badge + NFC Dual Interface</option>
                  <option value="High-Security MIFARE Desfire EV3">High-Security MIFARE Desfire EV3 (Ruang Server/Keuangan)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Pilihan Hak Akses Fasilitas Gedung *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Pintu Lobby & Turnstile Utama',
                    'Akses Working Floor & Meeting Room',
                    'Ruang Server IT & Data Center',
                    'Lounge Eksekutif & Direksi',
                    'Kantin Perusahaan & Pantry',
                    'Akses Parkir Mobil / Motor Khusus',
                  ].map((perm) => (
                    <label
                      key={perm}
                      className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={idCardAccessZones.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setIdCardAccessZones([...idCardAccessZones, perm]);
                          } else {
                            setIdCardAccessZones(idCardAccessZones.filter((x) => x !== perm));
                          }
                        }}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-[11px] text-slate-700">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan Tambahan untuk GA</label>
                <textarea
                  rows={2}
                  value={idCardNotes}
                  onChange={(e) => setIdCardNotes(e.target.value)}
                  placeholder="Contoh: Mohon cetak nama gelar dan foto latar merah sesuai seragam korporat."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsIdCardModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitIdCard}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Pengajuan ke GA & Simpan Status</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 13: FORM VERIFIKASI BERKAS DOSSIER ===================== */}
      {isDossierModalOpen && activeActionProcess && activeActionTask && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDossierModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-blue-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Form Verifikasi Berkas Dossier Karyawan</h3>
                  <p className="text-[11px] text-blue-100">Legalitas Identitas, Pajak, BPJS & Kontak Darurat</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDossierModalOpen(false)}
                className="w-8 h-8 rounded-lg text-white/80 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Nama Karyawan:</span>
                  <span className="font-bold text-slate-900">{activeActionProcess.employeeName}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Posisi:</span>
                  <span>{activeActionProcess.position}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">No. KTP (NIK 16 Digit) *</label>
                  <input
                    type="text"
                    value={dossierKtp}
                    onChange={(e) => setDossierKtp(e.target.value)}
                    placeholder="3174xxxxxxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">No. NPWP (16 Digit) *</label>
                  <input
                    type="text"
                    value={dossierNpwp}
                    onChange={(e) => setDossierNpwp(e.target.value)}
                    placeholder="09.xxx.xxx.x-xxx.000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">No. BPJS Ketenagakerjaan</label>
                  <input
                    type="text"
                    value={dossierBpjsTk}
                    onChange={(e) => setDossierBpjsTk(e.target.value)}
                    placeholder="220xxxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">No. BPJS Kesehatan</label>
                  <input
                    type="text"
                    value={dossierBpjsKes}
                    onChange={(e) => setDossierBpjsKes(e.target.value)}
                    placeholder="0001xxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Kontak Darurat</label>
                  <input
                    type="text"
                    value={dossierEmergencyName}
                    onChange={(e) => setDossierEmergencyName(e.target.value)}
                    placeholder="Ibu/Ayah/Pasangan"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">No. Telp Darurat</label>
                  <input
                    type="text"
                    value={dossierEmergencyPhone}
                    onChange={(e) => setDossierEmergencyPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hubungan</label>
                  <select
                    value={dossierEmergencyRel}
                    onChange={(e) => setDossierEmergencyRel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                  >
                    <option value="Orang Tua">Orang Tua</option>
                    <option value="Suami/Istri">Suami/Istri</option>
                    <option value="Saudara Kandung">Saudara Kandung</option>
                    <option value="Wali">Wali</option>
                  </select>
                </div>
              </div>

              {/* Checklist Dokumen Fisik */}
              <div className="space-y-2 pt-1">
                <span className="font-semibold text-slate-800 block">Pemeriksaan Fisik Dokumen Keaslian *</span>
                <div className="space-y-1.5">
                  {[
                    'KTP & Kartu Keluarga Asli telah dicocokkan dengan salinan PDF',
                    'Ijazah Terakhir & Transkrip Akademik telah diverifikasi keasliannya',
                    'Buku Tabungan / Rekening Bank Penggajian (Payroll) telah tervalidasi',
                    'Surat Keterangan Bebas Narkoba / Hasil Medical Check-up (MCU) Lengkap',
                  ].map((docItem) => (
                    <label
                      key={docItem}
                      className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={dossierChecklist.includes(docItem)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDossierChecklist([...dossierChecklist, docItem]);
                          } else {
                            setDossierChecklist(dossierChecklist.filter((x) => x !== docItem));
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[11px] text-slate-700">{docItem}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsDossierModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitDossier}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Verifikasi & Simpan Berkas Dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 14: FORM ALOKASI LAPTOP KERJA IT ===================== */}
      {isLaptopModalOpen && activeActionProcess && activeActionTask && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLaptopModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Form Alokasi Laptop Kerja IT</h3>
                  <p className="text-[11px] text-indigo-100">IT Asset Operations · Serial Number, Tag & Aksesoris</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLaptopModalOpen(false)}
                className="w-8 h-8 rounded-lg text-white/80 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Penerima Aset:</span>
                  <span className="font-bold text-slate-900">{activeActionProcess.employeeName}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Posisi & Divisi:</span>
                  <span>{activeActionProcess.position} · {activeActionProcess.department}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pilihan Tipe Laptop / Perangkat *</label>
                <select
                  value={laptopDeviceType}
                  onChange={(e) => setLaptopDeviceType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                >
                  <option value='Apple MacBook Pro 14" M3 Pro (18GB / 512GB SSD)'>Apple MacBook Pro 14" M3 Pro (18GB / 512GB SSD)</option>
                  <option value='Lenovo ThinkPad X1 Carbon Gen 11 (Core i7 / 32GB RAM / 1TB SSD)'>Lenovo ThinkPad X1 Carbon Gen 11 (Core i7 / 32GB RAM / 1TB SSD)</option>
                  <option value='Dell Latitude 7440 Ultrabook (Core i7 / 16GB / 512GB SSD)'>Dell Latitude 7440 Ultrabook (Core i7 / 16GB / 512GB SSD)</option>
                  <option value='ASUS ExpertBook B9 OLED (Core i7 / 32GB / 1TB SSD)'>ASUS ExpertBook B9 OLED (Core i7 / 32GB / 1TB SSD)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Serial Number (S/N) *</label>
                  <input
                    type="text"
                    value={laptopSerialNo}
                    onChange={(e) => setLaptopSerialNo(e.target.value)}
                    placeholder="Contoh: C02G9012MD6R"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tag Aset IT *</label>
                  <input
                    type="text"
                    value={laptopAssetTag}
                    onChange={(e) => setLaptopAssetTag(e.target.value)}
                    placeholder="Contoh: AST-IT-2026-0891"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Aksesoris Tambahan yang Diserahkan</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Charger Adaptor USB-C 140W & Kabel Power',
                    'Mouse Wireless Ergonomic',
                    'Multiport USB-C Hub / HDMI Dongle',
                    'Tas Laptop Ransel Korporat',
                  ].map((acc) => (
                    <label
                      key={acc}
                      className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={laptopAccessories.includes(acc)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLaptopAccessories([...laptopAccessories, acc]);
                          } else {
                            setLaptopAccessories(laptopAccessories.filter((x) => x !== acc));
                          }
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] text-slate-700">{acc}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLaptopModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitLaptop}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Alokasikan Aset & Tandai Selesai</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 15: PROVISIONING AKUN-AKUN SISTEM & EMAIL ===================== */}
      {isAccountModalOpen && activeActionProcess && activeActionTask && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAccountModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-violet-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Provisioning Akun Sistem & Email Korporat</h3>
                  <p className="text-[11px] text-violet-100">IT Infrastructure · Email Resmi, SSO & Hak Akses</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="w-8 h-8 rounded-lg text-white/80 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-violet-50/70 border border-violet-200 rounded-xl space-y-1">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Nama Karyawan:</span>
                  <span className="font-bold text-slate-900">{activeActionProcess.employeeName}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Email Pribadi:</span>
                  <span>{activeActionProcess.email}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alamat Email Korporat Resmi *</label>
                <input
                  type="email"
                  value={corporateEmail}
                  onChange={(e) => setCorporateEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-violet-500 outline-hidden font-bold text-violet-900 bg-violet-50/30"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Password Sementara (First-Time Login)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempPassword}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-slate-50 text-slate-700 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(tempPassword);
                      alert('Password sementara disalin ke clipboard!');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Sistem & Platform yang Diaktivasi *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'NusaHR Employee Portal & Absensi Mobile',
                    'Google Workspace (Gmail & Drive 2TB)',
                    'Slack & Discord Corporate Workspace',
                    'Jira & Confluence Cloud Project Access',
                  ].map((sys) => (
                    <label
                      key={sys}
                      className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={provisionedSystems.includes(sys)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProvisionedSystems([...provisionedSystems, sys]);
                          } else {
                            setProvisionedSystems(provisionedSystems.filter((x) => x !== sys));
                          }
                        }}
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-[11px] text-slate-700">{sys}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitAccount}
                className="px-4 py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aktifkan Akun & Selesaikan Provisioning</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

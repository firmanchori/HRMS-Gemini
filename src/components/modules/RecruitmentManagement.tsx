import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  RecruitmentStage,
  EmploymentType,
  Candidate,
  PTKPStatus,
  JobRequisition,
  JobVacancy,
  JobPostingChannel,
  FptkPositionReason,
  FptkSignatory,
} from '../../types/hrms';
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
    updateOnboardingTask,
    setActiveModule,
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

  // Active items for modals
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [activeRequisition, setActiveRequisition] = useState<JobRequisition | null>(null);

  // Rejection note state
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [candidateToDisqualify, setCandidateToDisqualify] = useState<Candidate | null>(null);

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
  const [fptkReportingEmployeeId, setFptkReportingEmployeeId] = useState('');
  const [fptkReportingWithDegree, setFptkReportingWithDegree] = useState<boolean>(true);
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
  const [fptkStatusFilter, setFptkStatusFilter] = useState<'Semua' | 'Menunggu Approval' | 'Disetujui' | 'Ditolak'>('Semua');
  const [fptkBudgetFilter, setFptkBudgetFilter] = useState<'Semua' | 'Budgeted' | 'Unbudgeted'>('Semua');
  const [previewFptk, setPreviewFptk] = useState<JobRequisition | null>(null);

  // ===================== 2. FORM SOURCING & JOB POSTING =====================
  const [vacTitle, setVacTitle] = useState('');
  const [vacDept, setVacDept] = useState('Engineering');
  const [vacGrade, setVacGrade] = useState('Grade 2 - Officer / Senior Staff');
  const [vacType, setVacType] = useState<EmploymentType>('Tetap');
  const [vacOpenings, setVacOpenings] = useState(1);
  const [vacExp, setVacExp] = useState('3+ Tahun');
  const [vacSalary, setVacSalary] = useState('Rp 15.000.000 - Rp 20.000.000');
  const [vacRequirements, setVacRequirements] = useState('');
  const [vacDescription, setVacDescription] = useState('');
  const [vacChannels, setVacChannels] = useState<JobPostingChannel[]>([
    'Jobstreet',
    'LinkedIn',
    'Glints',
    'Website Karir',
  ]);
  const [vacLinkedReqId, setVacLinkedReqId] = useState<string>('');

  // ===================== 3. FORM TAMBAH PELAMAR MANUAL =====================
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('0812' + Math.floor(10000000 + Math.random() * 90000000));
  const [candCompany, setCandCompany] = useState('');
  const [candSalary, setCandSalary] = useState<number>(18000000);
  const [candVacancyId, setCandVacancyId] = useState(vacancies[0]?.id || '');
  const [candSource, setCandSource] = useState<JobPostingChannel>('LinkedIn');

  // ===================== 5. FORM ASSESSMENT / TES KOMPETENSI =====================
  const [testTypeInput, setTestTypeInput] = useState<NonNullable<Candidate['testType']>>('Tes Teknis / Coding');
  const [testScoreInput, setTestScoreInput] = useState<number>(85);
  const [testPassingGradeInput, setTestPassingGradeInput] = useState<number>(75);
  const [testStatusInput, setTestStatusInput] = useState<NonNullable<Candidate['testStatus']>>('Lulus');
  const [testNotesInput, setTestNotesInput] = useState('');

  // ===================== 6. FORM INTERVIEW & SCORECARD =====================
  const [interviewDate, setInterviewDate] = useState('2026-10-24 14:00');
  const [interviewerName, setInterviewerName] = useState('Aditya Pratama (Head of People)');
  const [interviewPlatform, setInterviewPlatform] = useState<'Google Meet' | 'Microsoft Teams' | 'Ruang Interview Kantor'>('Google Meet');
  const [interviewMeetingLink, setInterviewMeetingLink] = useState('https://meet.google.com/xyz-ntm-hr');
  const [techRating, setTechRating] = useState<number>(5);
  const [cultureRating, setCultureRating] = useState<number>(4);
  const [commRating, setCommRating] = useState<number>(5);
  const [interviewRec, setInterviewRec] = useState<'Direkomendasikan Lolos' | 'Dipertimbangkan' | 'Tidak Direkomendasikan'>('Direkomendasikan Lolos');
  const [interviewNotes, setInterviewNotes] = useState('');

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
      reportingToEmployeeId: fptkReportingEmployeeId,
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
    alert('Dokumen FPTK berhasil disetujui! Posisi siap disebarkan ke portal lowongan.');
  };

  const handleRejectFptk = (id: string) => {
    const reason = prompt('Masukkan alasan penolakan FPTK:', 'Alokasi headcount tidak tersedia untuk kuartal ini.');
    if (reason !== null) {
      updateJobRequisition(id, {
        status: 'Ditolak',
        approvalNotes: reason,
        approvalDate: new Date().toISOString().split('T')[0],
      });
      alert('Dokumen FPTK ditandai ditolak.');
    }
  };

  const handleConvertFptkToVacancy = (req: JobRequisition) => {
    setActiveRequisition(req);
    setVacTitle(req.position);
    setVacDept(req.department);
    setVacGrade(req.grade);
    setVacOpenings(req.headcount);
    setVacExp(req.minExperience || '3+ Tahun');
    setVacRequirements(req.requirements);
    setVacDescription(
      `Membuka lowongan untuk posisi ${req.position} jenjang ${req.grade} pada Departemen ${req.department}. Kebutuhan: ${req.headcount} orang.`
    );
    setVacLinkedReqId(req.id);
    setIsVacancyModalOpen(true);
  };

  const handleOpenOfferingModal = (candidate: Candidate) => {
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

  const handleOpenAssessmentModal = (candidate: Candidate) => {
    setActiveCandidate(candidate);
    setTestTypeInput(candidate.testType || 'Tes Teknis / Coding');
    setTestScoreInput(candidate.testScore || 85);
    setTestPassingGradeInput(candidate.testPassingGrade || 75);
    setTestStatusInput(candidate.testStatus || 'Lulus');
    setTestNotesInput(candidate.testNotes || '');
    setIsAssessmentModalOpen(true);
  };

  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate) return;
    const isPassing = Number(testScoreInput) >= Number(testPassingGradeInput);
    updateCandidateStage(activeCandidate.id, 'Assessment', {
      testType: testTypeInput,
      testScore: Number(testScoreInput),
      testPassingGrade: Number(testPassingGradeInput),
      testStatus: isPassing ? 'Lulus' : 'Tidak Lulus',
      testNotes: testNotesInput || `Skor ${testScoreInput}/100. Status: ${isPassing ? 'Lulus' : 'Tidak Lulus'}.`,
    });
    setIsAssessmentModalOpen(false);
  };

  const handleOpenInterviewModal = (candidate: Candidate) => {
    setActiveCandidate(candidate);
    setInterviewDate(candidate.interviewDate || '2026-10-24 14:00');
    setInterviewerName(candidate.interviewer || 'Aditya Pratama (Head of People)');
    setInterviewPlatform(candidate.meetingPlatform || 'Google Meet');
    setInterviewMeetingLink(candidate.meetingLink || 'https://meet.google.com/xyz-ntm-hr');
    if (candidate.interviewScorecard) {
      setTechRating(candidate.interviewScorecard.technical);
      setCultureRating(candidate.interviewScorecard.culturalFit);
      setCommRating(candidate.interviewScorecard.communication);
      setInterviewRec(candidate.interviewScorecard.recommendation);
    }
    setInterviewNotes(candidate.interviewNotes || '');
    setIsInterviewModalOpen(true);
  };

  const handleSaveInterview = () => {
    if (!activeCandidate) return;
    const avgScore = Math.round(((techRating + cultureRating + commRating) / 15) * 100);
    updateCandidateStage(activeCandidate.id, 'Interview', {
      interviewDate,
      interviewer: interviewerName,
      meetingPlatform: interviewPlatform,
      meetingLink: interviewMeetingLink,
      interviewScore: avgScore,
      interviewScorecard: {
        technical: techRating,
        culturalFit: cultureRating,
        communication: commRating,
        recommendation: interviewRec,
      },
      interviewNotes,
    });
    setIsInterviewModalOpen(false);
  };

  const handlePromoteToOffering = (candidate: Candidate) => {
    handleOpenOfferingModal(candidate);
  };

  const handleSendOffering = () => {
    if (!activeCandidate) return;
    setOfferingFormError(null);

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

    updateCandidateStage(activeCandidate.id, 'Offered', {
      offeredSalary: grossMonthly,
      offeringDocNumber: docNumber,
      offeringSentDate: new Date().toISOString().split('T')[0],
    });
    setIsOfferingModalOpen(false);
    setIsOfferingDocPreviewOpen(true);
  };

  const handleConfirmHired = (candidate: Candidate) => {
    const vac = vacancies.find((v) => v.id === candidate.jobVacancyId);
    const pos = vac?.title || 'Senior Specialist';
    const dept = vac?.department || 'Engineering';

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
      tasks: [
        { id: 't1', title: 'Verifikasi KTP, NPWP & Dokumen Ijazah', category: 'Legalitas & Dokumen', isCompleted: true, completedAt: new Date().toISOString().split('T')[0], assignedRole: 'hr_admin' },
        { id: 't2', title: 'Tanda Tangan Kontrak Digital QR (PKWT/PKWTT)', category: 'Legalitas & Dokumen', isCompleted: false, assignedRole: 'hr_admin' },
        { id: 't3', title: 'Penyediaan Laptop, Akses Akun & Email Korporat', category: 'Fasilitas & IT', isCompleted: false, assignedRole: 'ga_admin' },
        { id: 't4', title: 'Pendaftaran BPJS Ketenagakerjaan & PPh 21 TER', category: 'Payroll & Rekening', isCompleted: false, assignedRole: 'payroll_admin' },
        { id: 't5', title: 'Sesi Orientasi Budaya Kerja & Product Knowledge', category: 'Pengenalan & HR', isCompleted: false, assignedRole: 'hr_admin' },
      ],
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs border border-slate-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-700" />
            <span>+ Ajukan FPTK</span>
          </button>
          <button
            onClick={() => setIsVacancyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs border border-slate-300 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-blue-700" />
            <span>+ Sebar Lowongan</span>
          </button>
          <button
            onClick={() => setIsCandidateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
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

        {/* Card 2: Lowongan & Sourcing */}
        <div
          onClick={() => setActiveTab('sourcing')}
          className={`cursor-pointer rounded-xl p-3 border transition-all hover:shadow-xs flex flex-col justify-between ${
            activeTab === 'sourcing'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">2. Lowongan Siar</span>
            <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
              <Globe className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {openVacanciesCount} <span className="text-xs font-normal text-slate-500">Lowongan</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-500 truncate">
              5 Portal Siar Terkoneksi
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
                {(['Semua', 'Menunggu Approval', 'Disetujui', 'Ditolak'] as const).map((st) => {
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
                <div className="block lg:hidden space-y-3">
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
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                req.status === 'Disetujui'
                                  ? 'bg-emerald-500'
                                  : req.status === 'Menunggu Approval'
                                  ? 'bg-amber-500 animate-pulse'
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Jenjang Grade</span>
                          <span className="font-semibold text-slate-800">{req.grade}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Kebutuhan</span>
                          <span className="font-bold text-slate-900">{req.headcount} Formasi</span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Target Masuk</span>
                          <span className="font-mono text-slate-800">{req.targetJoinDate}</span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div
                        className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] text-slate-400 italic">
                          Ketuk kartu untuk lembar FPTK resmi
                        </span>

                        <div className="flex items-center gap-1.5">
                          {req.status === 'Menunggu Approval' && (
                            <>
                              <button
                                onClick={() => handleApproveFptk(req.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                <span>Setujui</span>
                              </button>
                              <button
                                onClick={() => handleRejectFptk(req.id)}
                                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-medium border border-rose-200 transition-colors"
                              >
                                Tolak
                              </button>
                            </>
                          )}

                          {req.status === 'Disetujui' && (
                            <button
                              onClick={() => handleConvertFptkToVacancy(req)}
                              className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <Globe className="w-3 h-3" />
                              <span>Sebar Lowongan →</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. TAMPILAN DESKTOP (SPACIOUS DATA TABLE TANPA TOMBOL DETAIL KARENA KLIK ROW) */}
                <div className="hidden lg:block bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
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
                          <th className="py-3.5 px-4 font-bold text-slate-700 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filtered.map((req) => (
                          <tr
                            key={req.id}
                            className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
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

                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/70">
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
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    req.status === 'Disetujui'
                                      ? 'bg-emerald-500'
                                      : req.status === 'Menunggu Approval'
                                      ? 'bg-amber-500 animate-pulse'
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

                            <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                {req.status === 'Menunggu Approval' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveFptk(req.id)}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1"
                                      title="Setujui Permintaan Tenaga Kerja"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Setujui</span>
                                    </button>
                                    <button
                                      onClick={() => handleRejectFptk(req.id)}
                                      className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-medium border border-rose-200 transition-colors"
                                      title="Tolak Pengajuan FPTK"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}

                                {req.status === 'Disetujui' && (
                                  <button
                                    onClick={() => handleConvertFptkToVacancy(req)}
                                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors shrink-0"
                                    title="Buka Lowongan dan Sebar ke Multi-Channel"
                                  >
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>Sebar Lowongan →</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
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
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 border border-slate-200 rounded-xl shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-700" />
                <span>Tab 2: Lowongan & Sourcing (Penyebaran Lowongan)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pembuatan deskripsi pekerjaan dan publikasi otomatis ke multi-channel: Jobstreet, LinkedIn, Glints, Kalibrr, dan Website Karir.
              </p>
            </div>
            <button
              onClick={() => setIsVacancyModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Buat Lowongan Baru</span>
            </button>
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
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{vac.department}</span>
                          <span>·</span>
                          <span className="font-medium text-slate-700">{vac.employmentType}</span>
                          <span>·</span>
                          <span className="font-semibold text-blue-700">{vac.grade || 'Staff'}</span>
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
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors ${
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
                          navigator.clipboard?.writeText(`https://nusahr.id/careers/${safeTenant.code.toLowerCase()}/${vac.id}`);
                          alert(`Tautan lamaran lowongan '${vac.title}' berhasil disalin ke clipboard!`);
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
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${stg.badgeColor}`}>
                          {stageCandidates.length}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-1 leading-tight">
                        {stg.subtitle}
                      </span>
                    </div>

                    <div className="p-2.5 space-y-2.5 flex-1 bg-slate-50/40">
                      {stageCandidates.length === 0 ? (
                        <div className="h-32 rounded-lg border border-dashed border-slate-200 flex flex-col items-center justify-center p-3 text-center text-slate-400 text-[11px]">
                          <span>Tidak ada pelamar</span>
                        </div>
                      ) : (
                        stageCandidates.map((candidate) => {
                          const vac = vacancies.find((v) => v.id === candidate.jobVacancyId);

                          return (
                            <div
                              key={candidate.id}
                              className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs hover:shadow-xs transition-shadow space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div>
                                  <span className="font-bold text-slate-900 text-xs block leading-tight">
                                    {candidate.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">
                                    {candidate.lastCompany}
                                  </span>
                                </div>
                                {candidate.sourcePortal && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                                    {candidate.sourcePortal}
                                  </span>
                                )}
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
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-slate-600 font-medium truncate max-w-[110px]">
                                      {candidate.testType || 'Tes Teknis'}
                                    </span>
                                    <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                      Skor: {candidate.testScore || 0}/100
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-semibold flex items-center gap-1">
                                    <span className="text-slate-500">Status:</span>
                                    <span className={candidate.testStatus === 'Lulus' ? 'text-emerald-700' : 'text-slate-700'}>
                                      {candidate.testStatus || 'Belum Ditugaskan'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {stg.stage === 'Interview' && (
                                <div className="space-y-1 pt-0.5 text-[10px]">
                                  <div className="flex items-center justify-between font-semibold">
                                    <span className="text-slate-700 flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-500" />
                                      <span>{candidate.interviewDate?.split(' ')[0] || 'Terjadwal'}</span>
                                    </span>
                                    {candidate.interviewScore && (
                                      <span className="text-emerald-700 font-mono font-bold">
                                        ★ {candidate.interviewScore}/100
                                      </span>
                                    )}
                                  </div>
                                  {candidate.meetingLink && (
                                    <a
                                      href={candidate.meetingLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-700 hover:underline flex items-center gap-1 font-medium text-[10px]"
                                    >
                                      <Video className="w-3 h-3 text-blue-600" />
                                      <span>Link Google Meet User</span>
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

                                {stg.stage === 'Interview' && (
                                  <>
                                    <button
                                      onClick={() => handleOpenInterviewModal(candidate)}
                                      className="w-full py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded flex items-center justify-center gap-1"
                                    >
                                      <Calendar className="w-3 h-3 text-emerald-600" />
                                      <span>Scorecard & Jadwal User</span>
                                    </button>
                                    <button
                                      onClick={() => handlePromoteToOffering(candidate)}
                                      className="w-full py-1 text-[10px] font-semibold bg-blue-700 text-white hover:bg-blue-800 rounded text-center font-bold"
                                    >
                                      Lanjut ke Tahap Offering →
                                    </button>
                                  </>
                                )}
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
                    <th className="py-3 px-4 text-right">Aksi</th>
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
            {pipelineCandidates.find((c) => c.stage === 'Interview') && (
              <button
                onClick={() => {
                  const target = pipelineCandidates.find((c) => c.stage === 'Interview');
                  if (target) handleOpenOfferingModal(target);
                }}
                className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buat Offering Baru</span>
              </button>
            )}
          </div>

          {/* Table of Candidates in Offering Stage */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Kandidat</th>
                    <th className="py-3 px-4">Posisi Ditawarkan</th>
                    <th className="py-3 px-4">No. Dokumen Offering Letter</th>
                    <th className="py-3 px-4">Gaji Ditawarkan (Gross)</th>
                    <th className="py-3 px-4">Tanggal Dikirim</th>
                    <th className="py-3 px-4 text-center">Status Surat</th>
                    <th className="py-3 px-4 text-right">Aksi Dokumen</th>
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
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{c.email}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {vacancies.find((v) => v.id === c.jobVacancyId)?.title}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-900">
                          {c.offeringDocNumber || '001/OL-HRD/NTM/X/2026'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {formatRupiah(c.offeredSalary || c.expectedSalary)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {c.offeringSentDate || '2026-10-18'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            Terkirim · Menunggu Respon
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenOfferingModal(c)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] flex items-center gap-1"
                            >
                              <Calculator className="w-3 h-3 text-blue-700" />
                              <span>Kalkulator</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveCandidate(c);
                                setDocNumber(c.offeringDocNumber || '001/OL-HRD/NTM/X/2026');
                                setIsOfferingDocPreviewOpen(true);
                              }}
                              className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded font-semibold text-[11px] flex items-center gap-1 shadow-2xs"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Lihat SK QR</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab('decision');
                              }}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold text-[11px]"
                            >
                              Keputusan →
                            </button>
                          </div>
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
                          <span className="font-bold text-slate-900 text-xs block">{cand.name}</span>
                          <span className="text-[10px] text-slate-500">
                            {vacancies.find((v) => v.id === cand.jobVacancyId)?.title}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-blue-900 text-xs">
                          {formatRupiah(cand.offeredSalary || cand.expectedSalary)}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200">
                        <button
                          onClick={() => {
                            setCandidateToDisqualify(cand);
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-xs font-semibold flex items-center gap-1"
                        >
                          <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                          <span>Tolak (Disqualified)</span>
                        </button>
                        <button
                          onClick={() => handleConfirmHired(cand)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-2xs"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Terima (Hired & Onboard)</span>
                        </button>
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
          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-700" />
                <span>Tab 6: On Boarding Karyawan Baru</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kandidat yang telah resmi berstatus <strong>Hired</strong> masuk ke checklist orientasi, pembuatan akun, dan kontrak digital.
              </p>
            </div>
            <button
              onClick={() => setActiveModule('personalia')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300"
            >
              Buka Modul Personalia →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hiredCandidates.map((cand) => {
              const vac = vacancies.find((v) => v.id === cand.jobVacancyId);
              const process = onboardingProcesses.find((p) => p.candidateId === cand.id);

              return (
                <div
                  key={cand.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{cand.name}</span>
                      <span className="text-xs text-slate-500">{vac?.title} · {vac?.department}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      ✓ Status: Hired
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Tanggal Mulai Bertugas:</span>
                      <span className="font-mono font-bold text-slate-900">{cand.joinedDate || '2026-11-01'}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Nomor Kontrak:</span>
                      <span className="font-mono text-blue-900 font-semibold">{cand.offeringDocNumber || '001/PKWT/NTM/2026'}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-slate-800 block">Checklist Orientasi & Onboarding:</span>
                    <div className="space-y-1.5 text-xs">
                      {(process?.tasks || [
                        { id: '1', title: 'Verifikasi KTP, NPWP & Dokumen Ijazah', isCompleted: true },
                        { id: '2', title: 'Tanda Tangan Kontrak Digital QR (PKWT)', isCompleted: true },
                        { id: '3', title: 'Penyediaan Laptop, Email Korporat & Akses IT', isCompleted: false },
                        { id: '4', title: 'Pendaftaran BPJS Ketenagakerjaan & PPh 21 TER', isCompleted: false },
                        { id: '5', title: 'Sesi Orientasi Budaya Kerja Perusahaan', isCompleted: false },
                      ]).map((task) => (
                        <label key={task.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={task.isCompleted}
                            onChange={() => {
                              if (process) updateOnboardingTask(process.id, task.id, !task.isCompleted);
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className={task.isCompleted ? 'line-through text-slate-400 text-[11px]' : 'text-slate-700 text-[11px] font-medium'}>
                            {task.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700 block">
                        Bertanggung Jawab ke Atasan *
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-600 font-medium select-none">
                        <input
                          type="checkbox"
                          checked={fptkReportingWithDegree}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFptkReportingWithDegree(checked);
                            const emp = companyEmployees.find((item) => item.id === fptkReportingEmployeeId);
                            if (emp) {
                              const nameToUse = checked ? emp.fullName : emp.rawName;
                              setFptkReportingTitle(`${nameToUse} (${emp.position})`);
                            }
                          }}
                          className="w-3 h-3 rounded border-slate-300 text-blue-600"
                        />
                        <span>Gunakan Gelar</span>
                      </label>
                    </div>
                    <EmployeeSelectDropdown
                      employees={companyEmployees}
                      selectedId={fptkReportingEmployeeId}
                      withDegree={fptkReportingWithDegree}
                      onSelect={(emp) => {
                        setFptkReportingEmployeeId(emp.id);
                        const nameToUse = fptkReportingWithDegree ? emp.fullName : emp.rawName;
                        setFptkReportingTitle(`${nameToUse} (${emp.position})`);
                        if (emp.department) setFptkReportingDept(emp.department);
                      }}
                      placeholder="-- Pilih Karyawan Atasan --"
                    />
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
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => setPreviewFptk(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-semibold border border-slate-200 text-xs transition-colors"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                {previewFptk.status === 'Menunggu Approval' && (
                  <>
                    <button
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
                    <button
                      onClick={() => {
                        handleRejectFptk(previewFptk.id);
                        setPreviewFptk(null);
                      }}
                      className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 rounded-xl font-medium border border-rose-200 text-xs transition-colors"
                    >
                      Tolak
                    </button>
                  </>
                )}

                {previewFptk.status === 'Disetujui' && (
                  <button
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: POSTING & SOURCING LOWONGAN BARU ===================== */}
      {isVacancyModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsVacancyModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>Sourcing & Publikasi Lowongan Multi-Portal</span>
                </h3>
                <span className="text-xs text-slate-400">Tab 2: Auto-broadcast ke portal kerja & medsos</span>
              </div>
              <button onClick={() => setIsVacancyModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addVacancy({
                  title: vacTitle,
                  department: vacDept,
                  employmentType: vacType,
                  grade: vacGrade,
                  openings: vacOpenings,
                  minExperience: vacExp,
                  salaryRange: vacSalary,
                  requirements: vacRequirements,
                  description: vacDescription,
                  activeChannels: vacChannels,
                  status: 'Buka',
                  jobRequisitionId: vacLinkedReqId || undefined,
                });
                setIsVacancyModalOpen(false);
                setVacTitle('');
                alert(`Lowongan '${vacTitle}' berhasil dipublikasikan dan disebarkan ke ${vacChannels.length} portal kerja!`);
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Judul Posisi Lowongan *</label>
                <input
                  type="text"
                  required
                  value={vacTitle}
                  onChange={(e) => setVacTitle(e.target.value)}
                  placeholder="Contoh: Senior DevOps & Site Reliability Engineer"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Departemen *</label>
                  <input
                    type="text"
                    required
                    value={vacDept}
                    onChange={(e) => setVacDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Formasi (Headcount)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={vacOpenings}
                    onChange={(e) => setVacOpenings(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kisaran Gaji</label>
                  <input
                    type="text"
                    value={vacSalary}
                    onChange={(e) => setVacSalary(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deskripsi Pekerjaan & Tanggung Jawab *</label>
                <textarea
                  rows={2}
                  required
                  value={vacDescription}
                  onChange={(e) => setVacDescription(e.target.value)}
                  placeholder="Uraikan tanggung jawab posisi ini..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kualifikasi & Requirement Spesifik *</label>
                <textarea
                  rows={2}
                  required
                  value={vacRequirements}
                  onChange={(e) => setVacRequirements(e.target.value)}
                  placeholder="Contoh: S1 Teknik Informatika, Min. 3 tahun pengalaman..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <label className="font-bold text-slate-800 block text-[11px]">
                  Pilih Channel Distribusi Publikasi Otomatis:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(['Jobstreet', 'LinkedIn', 'Glints', 'Kalibrr', 'Website Karir'] as JobPostingChannel[]).map((ch) => (
                    <label key={ch} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vacChannels.includes(ch)}
                        onChange={(e) => {
                          if (e.target.checked) setVacChannels((prev) => [...prev, ch]);
                          else setVacChannels((prev) => prev.filter((item) => item !== ch));
                        }}
                        className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                      />
                      <span className="text-slate-800 font-medium">{ch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVacancyModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-2xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publikasikan & Broadcast</span>
                </button>
              </div>
            </form>
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

              <div className="flex items-center justify-between text-slate-500 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span className="font-medium text-slate-800">{activeCandidate.cvFileName || 'CV_Pelamar.pdf'}</span>
                </div>
                <span>{activeCandidate.cvFileSize || '1.2 MB'} · Sumber: <strong>{activeCandidate.sourcePortal || 'LinkedIn'}</strong></span>
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
      {isAssessmentModalOpen && activeCandidate && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAssessmentModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Input Nilai Tes Kompetensi & Skoring</span>
                </h3>
                <span className="text-xs text-slate-400">{activeCandidate.name}</span>
              </div>
              <button onClick={() => setIsAssessmentModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSaveAssessment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Jenis Tes Kompetensi *</label>
                <select
                  value={testTypeInput}
                  onChange={(e) => setTestTypeInput(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium"
                >
                  <option value="Tes Teknis / Coding">Tes Teknis / Coding</option>
                  <option value="Psikotes (DISC / MBTI)">Psikotes (DISC / MBTI)</option>
                  <option value="Tes Logika & Numerik">Tes Logika & Numerik</option>
                  <option value="Case Study">Case Study / Studi Kasus</option>
                  <option value="Bahasa Inggris">Bahasa Inggris (TOEIC/IELTS Equivalent)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Skor Diperoleh (0 - 100) *</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={testScoreInput}
                    onChange={(e) => setTestScoreInput(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Passing Grade Minimum</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={testPassingGradeInput}
                    onChange={(e) => setTestPassingGradeInput(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan Penguji / Evaluasi Hasil Tes</label>
                <textarea
                  rows={3}
                  value={testNotesInput}
                  onChange={(e) => setTestNotesInput(e.target.value)}
                  placeholder="Kandidat sangat menguasai arsitektur cloud, penanganan incident response..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-semibold text-slate-700">Hasil Evaluasi Otomatis:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded ${
                    testScoreInput >= testPassingGradeInput
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {testScoreInput >= testPassingGradeInput ? 'Lulus Passing Grade' : 'Di Bawah Passing Grade'}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssessmentModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-2xs"
                >
                  Simpan Nilai Tes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 6: INTERVIEW & SCORECARD ===================== */}
      {isInterviewModalOpen && activeCandidate && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsInterviewModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Penjadwalan Wawancara & Scorecard Evaluasi</span>
                </h3>
                <span className="text-xs text-slate-400">{activeCandidate.name} · Tahap Interview (User)</span>
              </div>
              <button onClick={() => setIsInterviewModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tanggal & Waktu Wawancara *</label>
                  <input
                    type="text"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pewawancara (Hiring Team / User) *</label>
                  <input
                    type="text"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Platform Wawancara</label>
                  <select
                    value={interviewPlatform}
                    onChange={(e) => setInterviewPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Ruang Interview Kantor">Tatap Muka (Offline)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tautan Kalender / Meeting Link</label>
                  <input
                    type="text"
                    value={interviewMeetingLink}
                    onChange={(e) => setInterviewMeetingLink(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Scorecard Rating */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <span className="font-bold text-slate-900 block text-xs">
                  Scorecard Penilaian Pewawancara (Skala 1 - 5 Bintang):
                </span>

                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">1. Kompetensi Teknis & Pemahaman Domain:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTechRating(val)}
                        className={`w-7 h-7 rounded font-bold text-xs ${
                          techRating >= val ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">2. Kesesuaian Budaya & Sikap Kerja:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCultureRating(val)}
                        className={`w-7 h-7 rounded font-bold text-xs ${
                          cultureRating >= val ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">3. Kemampuan Komunikasi & Kepemimpinan:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCommRating(val)}
                        className={`w-7 h-7 rounded font-bold text-xs ${
                          commRating >= val ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rekomendasi Akhir Pewawancara</label>
                <select
                  value={interviewRec}
                  onChange={(e) => setInterviewRec(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
                >
                  <option value="Direkomendasikan Lolos">Direkomendasikan Lolos (Lanjut ke Offering)</option>
                  <option value="Dipertimbangkan">Dipertimbangkan (Simpan ke Talent Pool)</option>
                  <option value="Tidak Direkomendasikan">Tidak Direkomendasikan</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan Rinci & Feedback Evaluasi</label>
                <textarea
                  rows={2}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Tuliskan umpan balik performa interview..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInterviewModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveInterview}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-2xs"
                >
                  Simpan Scorecard & Jadwal
                </button>
              </div>
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
                <h3 className="text-sm font-bold">Surat Penawaran Kerja Resmi (Job Offering Letter)</h3>
                <span className="text-[11px] text-slate-400 font-mono">{docNumber}</span>
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
                  Nomor: {docNumber}
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
                    <span className="col-span-2 font-mono font-bold text-blue-900">{formatRupiah(grossMonthly)}</span>
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
                        value={`VERIFIED_OFFERING:${docNumber}:${safeTenant.code}:${activeCandidate.name}`}
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
                    <span className="text-xs text-slate-400 italic">(Tanda Tangan Calon Karyawan)</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{activeCandidate.name}</div>
                  <div className="text-[10px] text-slate-500">Tanggal: ___________________</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleConfirmHired(activeCandidate);
                    setIsOfferingDocPreviewOpen(false);
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-2xs flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Konfirmasi Terima (Hired)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 8: TAMBAH PELAMAR MANUAL ===================== */}
      {isCandidateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCandidateModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  <span>Input Data Pelamar Baru</span>
                </h3>
                <span className="text-xs text-slate-400">Masuk ke Pipeline Seleksi (Incoming)</span>
              </div>
              <button onClick={() => setIsCandidateModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addCandidate({
                  jobVacancyId: candVacancyId,
                  name: candName,
                  email: candEmail || `${candName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                  phone: candPhone,
                  lastCompany: candCompany || 'Perusahaan Sebelumnya',
                  expectedSalary: Number(candSalary),
                  stage: 'Incoming',
                  sourcePortal: candSource,
                  resumeParsed: true,
                  cvFileName: `CV_${candName.replace(/\s+/g, '_')}.pdf`,
                  cvFileSize: '1.1 MB',
                  parsedData: {
                    fullName: candName,
                    email: candEmail,
                    phone: candPhone,
                    currentTitle: 'Professional Specialist',
                    currentCompany: candCompany || 'Previous Company',
                    totalExperienceYears: 3,
                    education: 'S1 Sarjana',
                    university: 'Universitas Terkemuka',
                    topSkills: ['Problem Solving', 'Communication', 'Technical Proficiency'],
                    extractionScore: 97,
                    parsedAt: new Date().toISOString().split('T')[0],
                  },
                });
                setIsCandidateModalOpen(false);
                setCandName('');
                alert(`Pelamar '${candName}' berhasil ditambahkan ke tahap Incoming dengan status Resume Parsed!`);
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap Pelamar *</label>
                <input
                  type="text"
                  required
                  value={candName}
                  onChange={(e) => setCandName(e.target.value)}
                  placeholder="Contoh: Raditya Pratama"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={candPhone}
                    onChange={(e) => setCandPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Posisi Lowongan yang Dilamar *</label>
                <select
                  value={candVacancyId}
                  onChange={(e) => setCandVacancyId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
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
                  <label className="font-semibold text-slate-700 block mb-1">Kanal Sumber Pelamar</label>
                  <select
                    value={candSource}
                    onChange={(e) => setCandSource(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Jobstreet">Jobstreet</option>
                    <option value="Glints">Glints</option>
                    <option value="Kalibrr">Kalibrr</option>
                    <option value="Website Karir">Website Karir</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ekspektasi Gaji Bulanan (IDR)</label>
                  <input
                    type="number"
                    value={candSalary}
                    onChange={(e) => setCandSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Perusahaan Terakhir</label>
                <input
                  type="text"
                  value={candCompany}
                  onChange={(e) => setCandCompany(e.target.value)}
                  placeholder="Contoh: Tokopedia / Gojek / BUMN"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-2xs"
                >
                  Simpan Pelamar & Auto-Parse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

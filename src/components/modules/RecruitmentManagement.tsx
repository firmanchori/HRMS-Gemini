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
  ArrowLeft,
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
  HeartPulse,
  Activity,
  Bell,
  MessageSquare,
  CalendarPlus,
  UserMinus,
  FolderPlus,
  Pencil,
  Link2,
  Save,
} from 'lucide-react';
import {
  RecruitmentStage,
  EmploymentType,
  Candidate,
  CandidateAssignedTest,
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
  InterviewerChangeHistory,
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
  if (p.includes('upload') || p.includes('manual') || p.includes('cv')) {
    return {
      label: 'Upload Manual',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      dotClass: 'bg-slate-500',
    };
  }
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
    label: (portal && portal.length > 15 ? portal.slice(0, 15) + '…' : portal) || 'Upload Manual',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500',
  };
};

// Helper visual persentase & kualitas hasil parsing berkas CV pelamar
export const getCandidateParsingResult = (candidate: Candidate) => {
  const score = candidate.parsedData?.extractionScore ?? (candidate.resumeParsed ? 95 : 10);

  if (score >= 90) {
    return {
      score,
      status: 'success' as const,
      label: `Parsing Lengkap (${score}%)`,
      shortLabel: `${score}% Sukses`,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      barClass: 'bg-emerald-500',
      bgClass: 'bg-emerald-50/50 border-emerald-200',
      note: 'Semua bidang profil (kontak, pengalaman, pendidikan, keahlian) terekstraksi 100%.',
    };
  }
  if (score >= 50) {
    return {
      score,
      status: 'partial' as const,
      label: `Parsing Sebagian (${score}%)`,
      shortLabel: `${score}% Parsial`,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      barClass: 'bg-amber-500',
      bgClass: 'bg-amber-50/50 border-amber-200',
      note: 'Sebagian data berhasil diekstrak; beberapa informasi memerlukan verifikasi manual.',
    };
  }
  return {
    score,
    status: 'failed' as const,
    label: `Parsing Gagal / Minim Data (${score}%)`,
    shortLabel: `${score}% Gagal/Minim`,
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    barClass: 'bg-rose-500',
    bgClass: 'bg-rose-50/50 border-rose-200',
    note: 'Teks dokumen PDF tidak terbaca optimal atau minim konten (butuh input manual).',
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

// Master Katalog Ruangan Asesmen & Fasilitas (Default Bawaan Ruangan vs Fasilitas By Request)
const OFFLINE_ASSESSMENT_ROOM_CATALOG: Record<string, {
  name: string;
  location: string;
  capacity: string;
  defaultFacilities: string[]; // Fasilitas & Peralatan Default yang Sudah Tersedia di Ruangan
  availableRequestFacilities: string[]; // Fasilitas & Peralatan Tambahan yang Disediakan By Request
}> = {
  'Ruang Asesmen Talent Lab (Lt. 3 Gedung Pusat) — Kapasitas 8 Orang': {
    name: 'Ruang Asesmen Talent Lab',
    location: 'Lt. 3 Gedung Pusat HR & Talent',
    capacity: '8 Orang',
    defaultFacilities: [
      'AC Ruangan Dingin (22°C)',
      'Meja & Kursi Kerja Ergonomis',
      'Koneksi Wi-Fi Office High-Speed (500 Mbps)',
      'Whiteboard Kaca & Spidol Boardmarker',
      'Layar Display TV Monitor 55" / Proyektor HDMI',
      'Stop Kontak Listrik di Setiap Meja'
    ],
    availableRequestFacilities: [
      'PC Desktop Core i7 (Dual Monitor 27")',
      'Laptop Pinjaman Peserta (Windows 11 / Ubuntu)',
      'Koneksi LAN Kabel 1 Gbps Khusus Ujian CBT',
      'Alat Tulis & Papan Ujian Khusus Asesmen',
      'Kamera Pengawas / CCTV Perekam Sesi Evaluasi',
      'Sound System & Wireless Clip-on Mic'
    ]
  },
  'Lab Komputer CBT & Coding (Lt. 2) — Kapasitas 20 PC Dual Screen': {
    name: 'Lab Komputer CBT & Coding',
    location: 'Lt. 2 Gedung IT & Digital Center',
    capacity: '20 PC Dual Screen',
    defaultFacilities: [
      '20 Unit PC Desktop Intel Core i7 (RAM 32GB, Dual Monitor 27")',
      'Koneksi LAN Kabel High-Speed 1 Gbps Dedicated per PC',
      'Ruangan Ber-AC Sentral Dingin',
      'Kamera Pengawas CCTV Aktif & UPS Backup Daya 30 Menit',
      'Papan Tulis Whiteboard Besar'
    ],
    availableRequestFacilities: [
      'Akses Sandbox Internet Terisolasi (Safe Exam Browser)',
      'Pre-installed Dev Environment (Docker, VS Code, Postman, DBeaver)',
      'Headset Noise Cancelling per Peserta',
      'Dual Web Camera Proctoring per Meja',
      'Lembar Kertas Buram Scratchpad & Pulpen Resmi'
    ]
  },
  'Ruang Observasi Psikotes & FGD (Lt. 1) — Kapasitas 12 Orang + One-way Mirror': {
    name: 'Ruang Observasi Psikotes & FGD',
    location: 'Lt. 1 Gedung Assessment & People Dev',
    capacity: '12 Orang + One-way Mirror',
    defaultFacilities: [
      'One-way Mirror Glass & Ruang Observasi Khusus Asesor',
      'Meja Bundar Diskusi FGD & 12 Kursi Ergonomis',
      'Ruangan Kedap Suara & Full AC',
      'Omnidirectional Microphone & Audio Monitor Asesor'
    ],
    availableRequestFacilities: [
      'Booklet & Lembar Jawaban Psikotes Cetak Resmi (WZT, EPPS, Kraepelin)',
      'Video Recording Full HD Dual-Angle Kamera',
      'Digital Stopwatch & Timer Countdown Asesor',
      'Layar Smart TV 55" untuk Presentasi Kasus',
      'Air Mineral & Refreshment Peserta'
    ]
  },
  'Ruang Rapat Eksekutif Garuda (Lt. 4) — Kapasitas 15 Orang + Smart TV': {
    name: 'Ruang Rapat Eksekutif Garuda',
    location: 'Lt. 4 Gedung Direksi',
    capacity: '15 Orang + Smart TV',
    defaultFacilities: [
      '4K Smart TV 75" & Video Conference Bar 4K',
      'Meja Konferensi Kayu Solid & Kursi Kulit Eksekutif',
      'AC Central Dingin & Sound System Ruangan',
      'Koneksi Wi-Fi Dedicated Eksekutif'
    ],
    availableRequestFacilities: [
      'Laptop Tambahan untuk Tim Asesor User',
      'Laser Pointer & Wireless Presenter Clicker',
      'Papan Tulis Kaca Portabel',
      'Kabel Converter Multiport HDMI/Type-C'
    ]
  },
  'Ruang Studio Simulasi Teknis (Lt. Basement) — Kapasitas 6 Orang': {
    name: 'Ruang Studio Simulasi Teknis',
    location: 'Lt. Basement Sayap Barat',
    capacity: '6 Orang',
    defaultFacilities: [
      'Meja Kerja Teknis Anti-Statik (ESD Workbench)',
      'Toolset Elektronik & Multitester Dasar',
      'Exhaust Fan Sirkulasi & AC Industri',
      'Lemari Safety & Kotak P3K Lengkap'
    ],
    availableRequestFacilities: [
      'Perangkat Uji Hardware & Oscilloscope Tambahan',
      'Mikroskop Solder / Kaca Pembesar LED Meja',
      'Kacamata Pelindung & Wearpack Peserta',
      'Koneksi Stop Kontak Daya Tinggi / 3-Phase'
    ]
  }
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
    addRoomBooking,
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
  >('pipeline');

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
  const [confirmScreeningCandidate, setConfirmScreeningCandidate] = useState<Candidate | null>(null);
  const [confirmRevertToScreeningCandidate, setConfirmRevertToScreeningCandidate] = useState<Candidate | null>(null);
  const [confirmRevertToIncomingCandidate, setConfirmRevertToIncomingCandidate] = useState<Candidate | null>(null);
  const [confirmAssessmentCandidate, setConfirmAssessmentCandidate] = useState<Candidate | null>(null);
  const [confirmInterviewCandidate, setConfirmInterviewCandidate] = useState<Candidate | null>(null);
  const [confirmTalentPoolCandidate, setConfirmTalentPoolCandidate] = useState<Candidate | null>(null);
  const [talentPoolReasonInput, setTalentPoolReasonInput] = useState<string>('Kualifikasi profil dan pengalaman kandidat sangat baik, disimpan ke Talent Pool untuk prioritas formasi mendatang.');
  const [talentPoolCategoryInput, setTalentPoolCategoryInput] = useState<string>('Umum');
  const [confirmRejectCandidate, setConfirmRejectCandidate] = useState<Candidate | null>(null);
  const [rejectionSubjectInput, setRejectionSubjectInput] = useState<string>('');
  const [rejectionMessageInput, setRejectionMessageInput] = useState<string>('');
  const [rejectionChannelInput, setRejectionChannelInput] = useState<'Email' | 'WhatsApp' | 'Keduanya'>('Email');
  const [previewCvCandidate, setPreviewCvCandidate] = useState<Candidate | null>(null);

  // Manual Screening & Correction States (Penggabungan Profiling & Screening Tahap Applied)
  const [isManualScreeningMode, setIsManualScreeningMode] = useState(false);
  const [manualMatchScore, setManualMatchScore] = useState<number>(85);
  const [manualScreeningStatus, setManualScreeningStatus] = useState<'Lolos Kualifikasi' | 'Dipertimbangkan' | 'Tidak Memenuhi'>('Lolos Kualifikasi');
  const [manualMatchedKeywords, setManualMatchedKeywords] = useState<string>('');
  const [manualMissingKeywords, setManualMissingKeywords] = useState<string>('');
  const [manualScreeningNotes, setManualScreeningNotes] = useState<string>('');
  const [manualCandidateName, setManualCandidateName] = useState<string>('');
  const [manualDegree, setManualDegree] = useState<string>('S1');
  const [manualMajor, setManualMajor] = useState<string>('');
  const [manualLastCompany, setManualLastCompany] = useState<string>('');
  const [manualExpYears, setManualExpYears] = useState<number>(3);
  const [manualSkills, setManualSkills] = useState<string>('');

  // Medical Check-Up (MCU) & Change Interviewer States
  const [isMcuModalOpen, setIsMcuModalOpen] = useState(false);
  const [mcuCandidate, setMcuCandidate] = useState<Candidate | null>(null);
  const [mcuDate, setMcuDate] = useState('2026-10-27');
  const [mcuClinic, setMcuClinic] = useState('RS Siloam Semanggi / Prodia Lab');
  const [mcuPackage, setMcuPackage] = useState('Paket Standar Pra-Kerja (Darah Lengkap, Rontgen Thorax, Urin, Fisik)');
  const [mcuStatus, setMcuStatus] = useState<'Belum Dijadwalkan' | 'Dijadwalkan' | 'Menunggu Hasil Lab' | 'Fit (Lolos)' | 'Fit with Note' | 'Unfit (Gugur)'>('Dijadwalkan');
  const [mcuNotes, setMcuNotes] = useState('Pemeriksaan laboratorium pra-kerja.');
  const [isChangeInterviewerModalOpen, setIsChangeInterviewerModalOpen] = useState(false);
  const [targetInterviewerToChange, setTargetInterviewerToChange] = useState<AssignedInterviewer | null>(null);
  const [interviewerChangeAction, setInterviewerChangeAction] = useState<'Ganti Pewawancara' | 'Pewawancara Berhalangan'>('Ganti Pewawancara');
  const [replacementEmployeeId, setReplacementEmployeeId] = useState('');
  const [interviewerChangeReason, setInterviewerChangeReason] = useState('');
  const [isRescheduleModeActive, setIsRescheduleModeActive] = useState(false);
  const [selectedInterviewerForScoringId, setSelectedInterviewerForScoringId] = useState('');

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
  const [assessmentWizardStep, setAssessmentWizardStep] = useState<1 | 2 | 3>(1);
  const [globalAssessmentFormat, setGlobalAssessmentFormat] = useState<'Online' | 'Offline'>('Online');
  const [selectedAssessmentTestIds, setSelectedAssessmentTestIds] = useState<string[]>(['test-tech', 'test-psych']);
  const [assignedTestsConfig, setAssignedTestsConfig] = useState<Record<string, CandidateAssignedTest>>({});
  const [activeStep2TestId, setActiveStep2TestId] = useState<string>('test-tech');
  const [isSendingTestLink, setIsSendingTestLink] = useState<Record<string, boolean>>({});
  const [customAssessorInput, setCustomAssessorInput] = useState<Record<string, string>>({});
  const [previewSendTestConfig, setPreviewSendTestConfig] = useState<CandidateAssignedTest | null>(null);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState<Record<string, boolean>>({});
  const [copyContentSuccess, setCopyContentSuccess] = useState<Record<string, boolean>>({});

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
  const [interviewStep, setInterviewStep] = useState<1 | 2 | 3>(1);
  const [interviewFormat, setInterviewFormat] = useState<'Online' | 'Offline'>('Online');
  const [interviewDateOnly, setInterviewDateOnly] = useState('2026-10-26');
  const [interviewStartTime, setInterviewStartTime] = useState('10:00');
  const [interviewOfflineRoom, setInterviewOfflineRoom] = useState<string>('Ruang Asesmen Talent Lab (Lt. 3 Gedung Pusat) — Kapasitas 8 Orang');
  const [interviewFacilityRoomBookingId, setInterviewFacilityRoomBookingId] = useState<string>('GA-IV-2026-0814');
  const [interviewOfflineRequestedFacilities, setInterviewOfflineRequestedFacilities] = useState<string[]>([
    'Sound System & Wireless Clip-on Mic',
    'Layar Display TV Monitor 55" / Proyektor HDMI'
  ]);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [activeInterviewerScoringId, setActiveInterviewerScoringId] = useState<string>('');
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
        if (confirmRejectCandidate) setConfirmRejectCandidate(null);
        else if (confirmTalentPoolCandidate) setConfirmTalentPoolCandidate(null);
        else if (confirmRevertToScreeningCandidate) setConfirmRevertToScreeningCandidate(null);
        else if (confirmInterviewCandidate) setConfirmInterviewCandidate(null);
        else if (confirmAssessmentCandidate) setConfirmAssessmentCandidate(null);
        else if (confirmRevertToIncomingCandidate) setConfirmRevertToIncomingCandidate(null);
        else if (confirmScreeningCandidate) setConfirmScreeningCandidate(null);
        else if (previewCvCandidate) setPreviewCvCandidate(null);
        else if (retractModalFptk) setRetractModalFptk(null);
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
    confirmRejectCandidate,
    confirmTalentPoolCandidate,
    confirmRevertToScreeningCandidate,
    confirmInterviewCandidate,
    confirmAssessmentCandidate,
    confirmRevertToIncomingCandidate,
    previewCvCandidate,
    confirmScreeningCandidate,
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

  // Candidate stage filter helper (Applied menggabungkan Incoming dan Screening)
  const isCandidateInStage = (c: Candidate, stageKey: RecruitmentStage) => {
    if (stageKey === 'Applied') return c.stage === 'Applied' || c.stage === 'Incoming' || c.stage === 'Screening';
    return c.stage === stageKey;
  };

  // 4 Core Selection Stages inside Pipeline (Applied [Screening] -> Assessment -> Interview -> Medical Check-Up)
  const selectionStages: {
    stage: RecruitmentStage;
    number: string;
    title: string;
    subtitle: string;
    badgeColor: string;
    headerAccent: string;
  }[] = [
    {
      stage: 'Applied',
      number: '1',
      title: 'Applied',
      subtitle: 'Lamaran Masuk, Profiling Dokumen & Screening Kualifikasi',
      badgeColor: 'bg-blue-100 text-blue-900',
      headerAccent: 'border-blue-600',
    },
    {
      stage: 'Assessment',
      number: '2',
      title: 'Assessment',
      subtitle: 'Tes Kompetensi Teknis & Skoring',
      badgeColor: 'bg-amber-100 text-amber-900',
      headerAccent: 'border-amber-600',
    },
    {
      stage: 'Interview',
      number: '3',
      title: 'Interview (User)',
      subtitle: 'Wawancara Kalender & Scorecard',
      badgeColor: 'bg-emerald-100 text-emerald-900',
      headerAccent: 'border-emerald-600',
    },
    {
      stage: 'Medical Check-Up',
      number: '4',
      title: 'Medical Check-Up',
      subtitle: 'Pemeriksaan Kesehatan & Kelayakan Kerja',
      badgeColor: 'bg-teal-100 text-teal-900',
      headerAccent: 'border-teal-600',
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
      c.stage === 'Interview' ||
      c.stage === 'Medical Check-Up'
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

    // VALIDASI WAJIB PDF (tidak boleh format lain)
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setToastFeedback('Format file ditolak! Berkas CV wajib berformat PDF (.pdf). Dokumen non-PDF tidak diizinkan.');
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setToastFeedback('Ukuran berkas melebihi batas maksimal 10 MB!');
      e.target.value = '';
      return;
    }

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

    // Ekstraksi berkas dokumen PDF
    setIsExtractingCv(true);
    setTimeout(() => {
      setIsExtractingCv(false);
      setExtractedPreview({
        summary: 'Kandidat memiliki rekam jejak kerja yang kuat di bidang terkait, adaptif dengan sistem kerja agile, dan memiliki sertifikasi profesional terverifikasi.',
        skills: ['Analisis Sistem', 'Problem Solving', 'Komunikasi Efektif', 'Manajemen Waktu', 'Kolaborasi Tim'],
        experienceYears: Math.floor(2 + Math.random() * 4),
        education: 'S1 Sarjana',
        score: 100,
      });
      setToastFeedback(`Berkas CV PDF '${file.name}' berhasil diverifikasi & diekstrak (100%)!`);
    }, 600);
  };

  const handleTriggerCvParsing = () => {
    if (!uploadedCv && !candName.trim()) {
      setToastFeedback('Silakan pilih berkas CV terlebih dahulu untuk diparsing.');
      return;
    }
    setIsExtractingCv(true);
    setTimeout(() => {
      setIsExtractingCv(false);
      if (!candName && uploadedCv) {
        const clean = uploadedCv.name
          .replace(/\.[^/.]+$/, '')
          .replace(/^(cv|resume)[_\-\s]+/i, '')
          .replace(/[_\-]+/g, ' ')
          .trim();
        if (clean.length > 2) {
          setCandName(clean.replace(/\b\w/g, (l) => l.toUpperCase()));
        }
      }
      setExtractedPreview({
        summary: 'Kandidat memiliki rekam jejak kerja yang kuat di bidang terkait, adaptif dengan sistem kerja agile, dan memiliki sertifikasi profesional terverifikasi.',
        skills: ['Analisis Sistem', 'Problem Solving', 'Komunikasi Efektif', 'Manajemen Waktu', 'Kolaborasi Tim'],
        experienceYears: Math.floor(2 + Math.random() * 4),
        education: 'S1 Sarjana',
        score: Math.floor(88 + Math.random() * 10),
      });
      setToastFeedback(`Parsing AI CV selesai! Data pelamar berhasil diekstrak otomatis.`);
    }, 600);
  };

  const handleDownloadCv = (candidate: Candidate) => {
    const fileName = candidate.cvFileName || `CV_${candidate.name.replace(/\s+/g, '_')}.pdf`;
    const vacTitle = vacancies.find((v) => v.id === candidate.jobVacancyId)?.title || 'Posisi Lowongan';

    const content = `================================================================================
DOKUMEN RESMI KURIKULUM VITAE PELAMAR
HRMS NUSANTARA TALENT MANAGEMENT
================================================================================

Nama Lengkap          : ${candidate.name}
Nama Tertera di CV    : ${candidate.parsedData?.fullName || candidate.name}
Posisi Dilamar        : ${vacTitle}
Kanal Sumber Pelamar  : ${candidate.sourcePortal || 'LinkedIn'}
Tanggal Pengajuan     : ${candidate.appliedDate || new Date().toISOString().split('T')[0]}
Status Berkas         : Terlampir & Siap Ditinjau

--------------------------------------------------------------------------------
1. INFORMASI KONTAK PELAMAR
--------------------------------------------------------------------------------
Email Resmi           : ${candidate.email}
Nomor Telepon / WA    : ${candidate.phone}
Alamat / Domisili     : Jakarta & Wilayah Sekitarnya (WNI)

--------------------------------------------------------------------------------
2. RIWAYAT PENGALAMAN KERJA TERAKHIR
--------------------------------------------------------------------------------
Perusahaan Terakhir   : ${candidate.lastCompany || candidate.parsedData?.currentCompany || 'Perusahaan Terkait'}
Jabatan Terakhir      : ${candidate.parsedData?.currentTitle || 'Professional Specialist'}
Total Masa Pengalaman : ${candidate.parsedData?.totalExperienceYears || 3} Tahun
Tanggung Jawab Utama  :
- Bertanggung jawab atas eksekusi operasional dan pencapaian target divisi.
- Berkolaborasi dengan tim lintas divisi dan menjaga kepatuhan SOP perusahaan.
- Menerapkan metodologi kerja modern dan problem-solving berbasis data.

--------------------------------------------------------------------------------
3. PENDIDIKAN TERAKHIR
--------------------------------------------------------------------------------
Jenjang & Jurusan     : ${candidate.parsedData?.education || 'S1 Teknik Informatika'}
Perguruan Tinggi      : ${candidate.parsedData?.university || 'Perguruan Tinggi Terakreditasi'}

--------------------------------------------------------------------------------
4. KEAHLIAN & KOMPETENSI UTAMA
--------------------------------------------------------------------------------
${(candidate.parsedData?.topSkills || ['Problem Solving', 'Komunikasi Efektif', 'Analisis Data', 'Kerja Tim']).map((s, idx) => `  [${idx + 1}] ${s}`).join('\n')}

================================================================================
Dokumen ini dihasilkan secara otomatis dari Portal Sistem NusaHR.
Nama Berkas: ${fileName} (${candidate.cvFileSize || '1.2 MB'})
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.pdf') ? fileName.replace(/\.pdf$/, '.txt') : `${fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToastFeedback(`Berkas CV '${fileName}' berhasil diunduh.`);
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
      phone: candPhone.trim() || '081234567890',
      lastCompany: candCompany.trim() || 'Pelamar Baru',
      expectedSalary: Number(candSalary) || (targetVac?.maxSalary || 15000000),
      stage: 'Applied',
      sourcePortal: (candSource as any) || 'Upload Manual',
      resumeParsed: true,
      cvFileName: fileName,
      cvFileSize: fileSize,
      parsedData: {
        fullName: candName.trim(),
        email: newCandEmail,
        phone: candPhone.trim() || '081234567890',
        currentTitle: targetVac?.title || 'Professional Specialist',
        currentCompany: candCompany.trim() || 'Pelamar Baru',
        totalExperienceYears: extractedPreview?.experienceYears || 3,
        education: extractedPreview?.education || 'S1 Sarjana',
        university: 'Universitas Terkemuka',
        topSkills: extractedPreview?.skills || ['Problem Solving', 'Komunikasi', 'Analisis Data'],
        extractionScore: extractedPreview?.score || 100,
        parsedAt: new Date().toISOString().split('T')[0],
      },
    });

    setIsCandidateModalOpen(false);
    setToastFeedback(`Berkas pelamar '${candName.trim()}' berhasil disimpan ke tahap Applied (Screening)!`);
    resetCandidateModal();
  };

  // Handlers untuk Modal Gabungan: Profiling Dokumen & Screening Kualifikasi (Tahap Applied)
  const handleOpenAppliedProfilingModal = (candidate: Candidate, startWithManualMode = false) => {
    setActiveCandidate(candidate);
    setIsResumeParserModalOpen(true);
    setIsManualScreeningMode(startWithManualMode);

    const initialScore = candidate.aiMatchScore ?? ((candidate.parsedData?.extractionScore ?? 10) < 50 ? 50 : 88);
    setManualMatchScore(initialScore);
    setManualScreeningStatus(
      initialScore >= 80 ? 'Lolos Kualifikasi' : initialScore >= 60 ? 'Dipertimbangkan' : 'Tidak Memenuhi'
    );
    setManualMatchedKeywords(
      candidate.matchedKeywords && candidate.matchedKeywords.length > 0
        ? candidate.matchedKeywords.join(', ')
        : 'Komunikasi Efektif, Problem Solving, Manajemen Waktu'
    );
    setManualMissingKeywords(
      candidate.missingKeywords && candidate.missingKeywords.length > 0
        ? candidate.missingKeywords.join(', ')
        : ''
    );
    setManualScreeningNotes(
      candidate.screeningNotes || 'Evaluasi kualifikasi dan kesesuaian profil pelamar dengan spesifikasi posisi.'
    );
    setManualCandidateName(candidate.name);

    const edu = candidate.parsedData?.education || 'S1 Sarjana';
    const matchEdu = edu.match(/^(S1|S2|S3|D3|D4|SMA|SMK)\s*(.*)$/i);
    setManualDegree(matchEdu ? matchEdu[1].toUpperCase() : 'S1');
    setManualMajor(matchEdu && matchEdu[2] ? matchEdu[2] : 'Teknik Informatika / Manajemen');
    setManualLastCompany(candidate.lastCompany || candidate.parsedData?.currentCompany || 'Pelamar Baru');
    setManualExpYears(candidate.parsedData?.totalExperienceYears || 3);
    setManualSkills(candidate.parsedData?.topSkills?.join(', ') || 'Analisis Sistem, Problem Solving, Kolaborasi Tim');
  };

  const handleSaveManualScreening = () => {
    if (!activeCandidate) return;

    const updatedMatched = manualMatchedKeywords
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const updatedMissing = manualMissingKeywords
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const updatedSkills = manualSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const fullEducation = `${manualDegree} ${manualMajor}`.trim();

    const updatedCandidate: Candidate = {
      ...activeCandidate,
      name: manualCandidateName.trim() || activeCandidate.name,
      lastCompany: manualLastCompany.trim() || activeCandidate.lastCompany,
      aiMatchScore: manualMatchScore,
      matchedKeywords: updatedMatched,
      missingKeywords: updatedMissing,
      screeningNotes: manualScreeningNotes.trim(),
      isShortlisted: manualScreeningStatus === 'Lolos Kualifikasi' || manualScreeningStatus === 'Dipertimbangkan',
      parsedData: {
        fullName: manualCandidateName.trim() || (activeCandidate.parsedData?.fullName || activeCandidate.name),
        email: activeCandidate.email,
        phone: activeCandidate.phone,
        currentTitle: activeCandidate.parsedData?.currentTitle || 'Professional Specialist',
        currentCompany: manualLastCompany.trim() || 'Pelamar Baru',
        totalExperienceYears: Number(manualExpYears) || 3,
        education: fullEducation,
        university: activeCandidate.parsedData?.university || 'Universitas Terkemuka',
        topSkills: updatedSkills.length > 0 ? updatedSkills : (activeCandidate.parsedData?.topSkills || []),
        extractionScore: Math.max(activeCandidate.parsedData?.extractionScore || 10, 85),
        parsedAt: activeCandidate.parsedData?.parsedAt || new Date().toISOString().split('T')[0],
      },
    };

    updateCandidateStage(activeCandidate.id, activeCandidate.stage, updatedCandidate);
    setActiveCandidate(updatedCandidate);
    setIsManualScreeningMode(false);
    setToastFeedback(`Hasil verifikasi & koreksi screening manual untuk '${updatedCandidate.name}' berhasil disimpan!`);
  };

  const handleOpenRejectModal = (candidate: Candidate) => {
    const vac = vacancies.find((v) => v.id === candidate.jobVacancyId);
    const posTitle = vac?.title || 'Posisi Dilamar';
    setConfirmRejectCandidate(candidate);
    setRejectionSubjectInput(`Pemberitahuan Hasil Seleksi Lamaran - ${posTitle} di ${safeTenant.name}`);
    setRejectionMessageInput(
      `Yth. ${candidate.name},\n\nTerima kasih atas ketertarikan dan waktu yang Anda luangkan untuk melamar posisi ${posTitle} di ${safeTenant.name}.\n\nSetelah meninjau kualifikasi dan berkas lamaran Anda secara mendalam, kami ingin menginformasikan bahwa saat ini kami belum dapat melanjutkan proses rekrutmen Anda ke tahapan berikutnya karena kami memilih kandidat yang profilnya lebih mendekati kebutuhan spesifik formasi saat ini.\n\nProfil dan rekam jejak Anda sangat kami hargai. Kami mendoakan yang terbaik bagi kesuksesan karier Anda ke depan.\n\nSalam hangat,\nTim Talent Acquisition\n${safeTenant.name}`
    );
  };

  const handleOpenTalentPoolModal = (candidate: Candidate) => {
    const vac = vacancies.find((v) => v.id === candidate.jobVacancyId);
    setConfirmTalentPoolCandidate(candidate);
    setTalentPoolCategoryInput(vac?.department || 'General Talent');
    setTalentPoolReasonInput('Kualifikasi profil dan pengalaman kandidat sangat baik, disimpan ke Talent Pool untuk prioritas formasi mendatang.');
  };

  // Medical Check-Up (MCU) Handlers
  const handleOpenMcuModal = (candidate: Candidate) => {
    setMcuCandidate(candidate);
    setMcuDate(candidate.mcuDate || new Date().toISOString().split('T')[0]);
    setMcuClinic(candidate.mcuClinicOrHospital || 'RS Siloam Semanggi / Prodia Lab');
    setMcuPackage(candidate.mcuPackage || 'Paket Standar Pra-Kerja (Darah Lengkap, Rontgen Thorax, Urin, Fisik)');
    setMcuStatus(candidate.mcuStatus || 'Dijadwalkan');
    setMcuNotes(candidate.mcuNotes || 'Pemeriksaan laboratorium pra-kerja.');
    setIsMcuModalOpen(true);
  };

  const handleSaveMcu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mcuCandidate) return;

    const isFit = mcuStatus === 'Fit (Lolos)' || mcuStatus === 'Fit with Note';
    const decision: Candidate['mcuDecision'] = isFit
      ? 'Lolos ke Offering'
      : mcuStatus === 'Unfit (Gugur)'
      ? 'Gugur / Unfit'
      : 'Perlu Pemeriksaan Ulang';

    updateCandidateStage(mcuCandidate.id, mcuCandidate.stage, {
      mcuDate,
      mcuClinicOrHospital: mcuClinic,
      mcuPackage,
      mcuStatus,
      mcuNotes,
      mcuDecision: decision,
    });

    setToastFeedback(`Hasil Medical Check-Up untuk ${mcuCandidate.name} berhasil disimpan (${mcuStatus}).`);
    setIsMcuModalOpen(false);
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

  // Helper status tahapan evaluasi kompetensi kandidat (Tahap 1 / Tahap 2 / Tahap 3)
  const getCandidateAssessmentProgressInfo = (candidate: Candidate | null | undefined) => {
    if (!candidate) {
      return {
        step: 1,
        stepLabel: 'Tahap 1: Setup Tes',
        title: 'Menunggu Setup Tes',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        detail: 'Belum dijadwalkan / ditugaskan',
        colorClass: 'text-slate-600',
        progressBarWidth: '15%',
      };
    }

    const assigned = candidate.assignedTests || [];
    const scores = candidate.competencyScores || [];

    // Kasus 1: Belum ada tes yang di-assign dan belum ada skor
    if (assigned.length === 0 && scores.length === 0) {
      return {
        step: 1,
        stepLabel: 'Tahap 1: Setup & Penugasan',
        title: 'Menunggu Setup & Penugasan Tes',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
        detail: 'Pilih jenis tes, booking ruangan/link, dan penentuan asesor',
        colorClass: 'text-amber-700',
        progressBarWidth: '25%',
      };
    }

    // Kasus 2: Ada assignedTests atau scores
    const totalTests = assigned.length > 0 ? assigned.length : scores.length;
    const scoredCount = assigned.length > 0
      ? assigned.filter((t) => typeof t.score === 'number').length
      : scores.length;

    // Jika seluruh tes sudah dinilai -> Tahap 3: Keputusan Akhir
    if (totalTests > 0 && scoredCount === totalTests) {
      const isAllPass = assigned.length > 0
        ? assigned.every((t) => (t.score || 0) >= t.passingGrade)
        : candidate.testStatus === 'Lulus' || scores.every((s) => s.status === 'Lulus');

      return {
        step: 3,
        stepLabel: 'Tahap 3: Keputusan Akhir',
        title: isAllPass ? 'Selesai: Memenuhi Passing Grade' : 'Selesai: Di Bawah Passing Grade',
        badgeClass: isAllPass
          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
          : 'bg-rose-50 text-rose-800 border-rose-300',
        detail: `${scoredCount}/${totalTests} Tes Dinilai • Siap Diputuskan`,
        colorClass: isAllPass ? 'text-emerald-700' : 'text-rose-700',
        progressBarWidth: '100%',
      };
    }

    // Kasus 3: Sebagian sudah dinilai -> Tahap 2: Input Nilai
    if (scoredCount > 0 && scoredCount < totalTests) {
      return {
        step: 2,
        stepLabel: 'Tahap 2: Input Nilai Asesor',
        title: `Proses Penilaian (${scoredCount}/${totalTests} Selesai)`,
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
        detail: `Sisa ${totalTests - scoredCount} jenis tes menunggu penilaian asesor`,
        colorClass: 'text-indigo-700',
        progressBarWidth: '65%',
      };
    }

    // Kasus 4: Sudah di-assign tapi belum ada nilai sama sekali
    // Cek apakah pelamar sudah submit tes online
    const hasOnlineSubmit = assigned.some((t) => t.submittedUrl || t.isTokenUsed);
    if (hasOnlineSubmit) {
      return {
        step: 2,
        stepLabel: 'Tahap 2: Input Nilai Asesor',
        title: 'Hasil Tes Disubmit Pelamar',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
        detail: 'Pelamar telah mengirimkan tugas • Menunggu evaluasi asesor',
        colorClass: 'text-blue-700',
        progressBarWidth: '50%',
      };
    }

    const isOffline = assigned.some((t) => t.format === 'Offline');
    return {
      step: 1,
      stepLabel: 'Tahap 1: Setup Selesai',
      title: isOffline ? 'Ruangan & Jadwal Ter-booking' : 'Tautan Tes Aktif / Terkirim',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-300',
      detail: `${totalTests} Tes Terjadwal • Menunggu Pelaksanaan Tes`,
      colorClass: 'text-teal-700',
      progressBarWidth: '35%',
    };
  };

  const getCandidateInterviewProgressInfo = (candidate: Candidate | null | undefined) => {
    if (!candidate) {
      return {
        step: 1,
        stepLabel: 'Tahap 1: Setup Jadwal & Panel',
        title: 'Menunggu Penjadwalan & Panelis',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        detail: 'Belum dijadwalkan / ditugaskan',
        colorClass: 'text-slate-600',
        progressBarWidth: '15%',
      };
    }

    // Jika sudah ada interviewScore atau kelulusan
    if (typeof candidate.interviewScore === 'number' && candidate.interviewScore > 0) {
      const isPass = candidate.interviewScore >= 75;
      return {
        step: 3,
        stepLabel: 'Tahap 3: Keputusan Objektif',
        title: isPass ? 'Selesai: Rekomendasi Lolos' : 'Selesai: Di Bawah Standar',
        badgeClass: isPass ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300',
        detail: `Skor Wawancara: ${candidate.interviewScore}/100 • Evaluasi Panel Lengkap`,
        colorClass: isPass ? 'text-emerald-700' : 'text-rose-700',
        progressBarWidth: '100%',
      };
    }

    // Jika sudah dijadwalkan
    if (candidate.interviewDate) {
      const interviewersCount = candidate.interviewers?.length || 1;
      const evaluatedCount = candidate.interviewers?.filter(i => (i.calculatedScore || 0) > 0 && i.status !== 'Berhalangan').length || 0;
      return {
        step: 2,
        stepLabel: 'Tahap 2: Input Nilai per User',
        title: evaluatedCount > 0 ? `${evaluatedCount}/${interviewersCount} Panelis Dinilai` : 'Siap Sesi & Penilaian Panel',
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
        detail: `Jadwal: ${candidate.interviewDate} • ${interviewersCount} Panelis Bertugas`,
        colorClass: 'text-indigo-700',
        progressBarWidth: evaluatedCount > 0 ? '75%' : '50%',
      };
    }

    return {
      step: 1,
      stepLabel: 'Tahap 1: Setup Jadwal & Panel',
      title: 'Menunggu Penjadwalan & Panelis',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
      detail: 'Pilih jenis wawancara, booking GA/link, & tentukan 1-5 panelis',
      colorClass: 'text-amber-700',
      progressBarWidth: '25%',
    };
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

  // Helper generate token tes sekali pakai dengan limit waktu berlaku
  const generateNewTestToken = (candidateId: string, testTypeId: string) => {
    const cleanCand = candidateId.replace(/[^a-zA-Z0-9]/g, '').slice(-5);
    const cleanTest = testTypeId.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
    const rand = Math.random().toString(36).substring(2, 7);
    return `tst-${cleanCand}-${cleanTest}-${rand}`;
  };

  const getFutureExpirationTime = (hoursAhead: number = 24) => {
    const d = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    return d.toISOString().replace('T', ' ').substring(0, 16);
  };

  const getDefaultDescriptionForTest = (testId: string, category: string, testName: string) => {
    const nameLower = testName.toLowerCase();
    if (testId === 'test-tech' || category === 'Hard Skill' || nameLower.includes('teknis') || nameLower.includes('coding')) {
      return 'Melakukan pengujian arsitektur sistem, refactoring endpoint API kompleks, optimasi query database, dan penerapan prinsip Clean Architecture. Kandidat diminta mengidentifikasi bottleneck dan membangun solusi modular yang scalable.';
    }
    if (testId === 'test-psych' || category === 'Soft Skill' || nameLower.includes('psiko') || nameLower.includes('disc')) {
      return 'Pengisian kuesioner profil kepribadian kerja DISC & MBTI, studi kasus dinamika tim dan resolusi konflik, serta evaluasi kestabilan emosi dalam menghadapi tekanan tenggat waktu yang ketat.';
    }
    if (testId === 'test-cognitive' || category === 'Kognitif & Logika' || nameLower.includes('logika')) {
      return 'Pengerjaan 50 soal komprehensif yang mencakup penalaran logis deduktif (silogisme), interpretasi grafik & tabel numerik bisnis, serta analisis pola spasial abstrak dalam waktu terbatas.';
    }
    if (testId === 'test-lang' || category === 'Bahasa' || nameLower.includes('bahasa')) {
      return 'Uji kemahiran Bahasa Inggris profesional: penyusunan draf balasan memorandum bisnis internasional, pemahaman studi kasus laporan korporat, dan komunikasi profesional.';
    }
    if (testId === 'test-case' || category === 'Studi Kasus' || nameLower.includes('case')) {
      return 'Penyelesaian studi kasus bisnis nyata perusahaan: identifikasi inefisiensi operasional, formulasi strategi implementasi 90 hari pertama, proyeksi anggaran dan mitigasi risiko.';
    }
    return 'Pelaksanaan uji kompetensi terstandarisasi untuk mengukur keahlian praktis, pemecahan masalah, dan kesiapan operasional kandidat sesuai standar industri.';
  };

  const getDefaultExpectedOutputForTest = (testId: string, category: string, testName: string) => {
    const nameLower = testName.toLowerCase();
    if (testId === 'test-tech' || category === 'Hard Skill' || nameLower.includes('teknis') || nameLower.includes('coding')) {
      return '1. Tautan repositori publik (GitHub/GitLab) dengan commit history rapi.\n2. Dokumentasi arsitektur dan trade-off keputusan teknis pada file README.md.\n3. Unit test coverage minimal 80% beserta instruksi eksekusi pengujian.';
    }
    if (testId === 'test-case' || category === 'Studi Kasus' || nameLower.includes('case')) {
      return '1. Slide deck presentasi solusi (Link Google Slides / Canva / PDF ringkas).\n2. Dokumen kalkulasi proyeksi biaya, mitigasi risiko, dan estimasi ROI implementasi.';
    }
    if (testId === 'test-psych' || category === 'Soft Skill' || nameLower.includes('psiko')) {
      return '1. Lembar jawaban kuesioner profil kepribadian lengkap.\n2. Catatan penjelasan tertulis atas studi kasus dinamika kerja tim.';
    }
    return '1. Tautan file hasil pekerjaan (Google Drive / GitHub / Dokumen PDF publik).\n2. Ringkasan penjelasan teknis dan pendekatan penyelesaian masalah.';
  };

  const handleOpenAssessmentModal = (candidate: Candidate) => {
    setActiveCandidate(candidate);
    const targetCandidate = candidates.find((c) => c.id === candidate.id) || candidate;

    let initialConfigs: Record<string, CandidateAssignedTest> = {};
    let initialSelectedIds: string[] = [];

    if (targetCandidate.assignedTests && targetCandidate.assignedTests.length > 0) {
      targetCandidate.assignedTests.forEach((t) => {
        const token = t.testToken || generateNewTestToken(candidate.id, t.testTypeId);
        const expiresAt = t.tokenExpiresAt || getFutureExpirationTime(24);
        initialConfigs[t.testTypeId] = {
          ...t,
          testToken: token,
          tokenExpiresAt: expiresAt,
          testUrlOrRepo: t.testUrlOrRepo || `${window.location.origin}/?testToken=${token}`,
          testDescription: t.testDescription || getDefaultDescriptionForTest(t.testTypeId, t.category, t.testTypeName),
          expectedOutput: t.expectedOutput || getDefaultExpectedOutputForTest(t.testTypeId, t.category, t.testTypeName),
          offlineRoomName: t.offlineRoomName || 'Ruang Asesmen Talent Lab (Lt. 3 Gedung Pusat) — Kapasitas 6 PC + Proyektor',
          offlineTestDate: t.offlineTestDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
          offlineStartTime: t.offlineStartTime || '09:00',
          offlineEndTime: t.offlineEndTime || '11:30',
          offlineFacilities: t.offlineFacilities || ['PC Desktop Core i7', 'Koneksi LAN High-Speed (1 Gbps)', 'Dual Monitor', 'Ruangan Ber-AC', 'Alat Tulis & Kertas Kerja'],
          offlineEquipmentNotes: t.offlineEquipmentNotes || 'Pelamar wajib membawa kartu identitas KTP/SIM asli, hadir 15 menit sebelum sesi dimulai, dan mengenakan pakaian formal/rapi.',
        };
        initialSelectedIds.push(t.testTypeId);
      });
      // Sinkronkan dengan score jika ada
      if (targetCandidate.competencyScores && targetCandidate.competencyScores.length > 0) {
        targetCandidate.competencyScores.forEach((sc) => {
          if (initialConfigs[sc.testTypeId]) {
            initialConfigs[sc.testTypeId].score = sc.score;
            initialConfigs[sc.testTypeId].status = sc.status;
            initialConfigs[sc.testTypeId].passingGrade = sc.passingGrade;
            initialConfigs[sc.testTypeId].evaluationNotes = sc.notes;
          }
        });
      }
      setSelectedAssessmentTestIds(initialSelectedIds);
      setAssignedTestsConfig(initialConfigs);
      setActiveStep2TestId(initialSelectedIds[0] || 'test-tech');

      const allScored = targetCandidate.assignedTests.every((t) => t.score !== undefined);
      if (allScored) {
        setAssessmentWizardStep(3);
      } else {
        setAssessmentWizardStep(2);
      }
    } else {
      // Default: pilih 2 tes (Teknis + Psikotes)
      const test1 = competencyTestTypes.find((t) => t.id === 'test-tech') || competencyTestTypes[0] || INITIAL_COMPETENCY_TEST_TYPES[0];
      const test2 = competencyTestTypes.find((t) => t.id === 'test-psych') || competencyTestTypes[1] || INITIAL_COMPETENCY_TEST_TYPES[1];

      const token1 = generateNewTestToken(candidate.id, test1.id);
      const token2 = generateNewTestToken(candidate.id, test2.id);
      const expires = getFutureExpirationTime(24);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const defConfig1: CandidateAssignedTest = {
        id: `assigned-${Date.now()}-1`,
        testTypeId: test1.id,
        testTypeName: test1.name,
        category: test1.category,
        format: 'Online',
        durationMinutes: test1.durationMinutes || 90,
        testToken: token1,
        tokenExpiresAt: expires,
        testUrlOrRepo: `${window.location.origin}/?testToken=${token1}`,
        testDescription: getDefaultDescriptionForTest(test1.id, test1.category, test1.name),
        expectedOutput: getDefaultExpectedOutputForTest(test1.id, test1.category, test1.name),
        isTokenUsed: false,
        locationOrSandboxNotes: 'Kandidat mengerjakan live coding / sandbox repository.',
        assessorName: 'Budi Santoso (Tech Lead / User)',
        assessorRole: 'User (Divisi Terkait)',
        passingGrade: test1.passingGrade || 75,
        status: 'Belum Dinilai',
        evaluationNotes: '',
        offlineRoomName: 'Lab Komputer CBT & Coding (Lt. 2) — Kapasitas 20 PC Dual Screen',
        offlineTestDate: tomorrow,
        offlineStartTime: '09:00',
        offlineEndTime: '11:00',
        offlineFacilities: ['PC Desktop Core i7', 'Koneksi LAN High-Speed (1 Gbps)', 'Dual Monitor', 'Ruangan Ber-AC'],
        offlineEquipmentNotes: 'Pelamar wajib membawa kartu identitas KTP/SIM asli dan hadir 15 menit sebelum waktu mulai.',
      };

      const defConfig2: CandidateAssignedTest = {
        id: `assigned-${Date.now()}-2`,
        testTypeId: test2.id,
        testTypeName: test2.name,
        category: test2.category,
        format: 'Online',
        durationMinutes: test2.durationMinutes || 60,
        testToken: token2,
        tokenExpiresAt: expires,
        testUrlOrRepo: `${window.location.origin}/?testToken=${token2}`,
        testDescription: getDefaultDescriptionForTest(test2.id, test2.category, test2.name),
        expectedOutput: getDefaultExpectedOutputForTest(test2.id, test2.category, test2.name),
        isTokenUsed: false,
        locationOrSandboxNotes: 'Tes kepribadian & soft-skill online via portal psikotes.',
        assessorName: currentUser?.name ? `${currentUser.name} (HRBP)` : 'Aditya Pratama (Head of People)',
        assessorRole: 'Tim HR',
        passingGrade: test2.passingGrade || 70,
        status: 'Belum Dinilai',
        evaluationNotes: '',
        offlineRoomName: 'Ruang Observasi & Psikotes One-on-One (Lt. 1) — Suasana Tenang & Kedap Suara',
        offlineTestDate: tomorrow,
        offlineStartTime: '13:00',
        offlineEndTime: '14:30',
        offlineFacilities: ['Ruang Tenang & Kedap Suara', 'Meja Kursi Nyaman', 'Alat Tulis & Kertas Kerja', 'Air Mineral'],
        offlineEquipmentNotes: 'Membawa kartu identitas resmi dan alat tulis cadangan.',
      };

      initialConfigs[test1.id] = defConfig1;
      initialConfigs[test2.id] = defConfig2;
      initialSelectedIds = [test1.id, test2.id];

      setSelectedAssessmentTestIds(initialSelectedIds);
      setAssignedTestsConfig(initialConfigs);
      setActiveStep2TestId(test1.id);
      setAssessmentWizardStep(1);
    }

    setIsAssessmentModalOpen(true);
  };

  const handleToggleTestSelection = (testItem: CompetencyTestTypeSetting) => {
    const isSelected = selectedAssessmentTestIds.includes(testItem.id);
    if (isSelected) {
      if (selectedAssessmentTestIds.length <= 1) {
        alert('Minimal 1 jenis tes harus dipilih untuk evaluasi kompetensi!');
        return;
      }
      setSelectedAssessmentTestIds((prev) => prev.filter((id) => id !== testItem.id));
    } else {
      setSelectedAssessmentTestIds((prev) => [...prev, testItem.id]);
      if (!assignedTestsConfig[testItem.id]) {
        const isTechnical = testItem.category === 'Hard Skill' || testItem.id === 'test-tech';
        const candId = activeCandidate?.id || 'cand';
        const token = generateNewTestToken(candId, testItem.id);
        const expires = getFutureExpirationTime(24);
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        setAssignedTestsConfig((prev) => ({
          ...prev,
          [testItem.id]: {
            id: `assigned-${Date.now()}-${testItem.id}`,
            testTypeId: testItem.id,
            testTypeName: testItem.name,
            category: testItem.category,
            format: globalAssessmentFormat,
            durationMinutes: testItem.durationMinutes || 60,
            testToken: token,
            tokenExpiresAt: expires,
            testUrlOrRepo: `${window.location.origin}/?testToken=${token}`,
            testDescription: getDefaultDescriptionForTest(testItem.id, testItem.category, testItem.name),
            expectedOutput: getDefaultExpectedOutputForTest(testItem.id, testItem.category, testItem.name),
            isTokenUsed: false,
            offlineRoomName: isTechnical
              ? 'Lab Komputer CBT & Coding (Lt. 2) — Kapasitas 20 PC Dual Screen'
              : 'Ruang Asesmen Talent Lab (Lt. 3 Gedung Pusat) — Kapasitas 6 PC + Proyektor',
            offlineTestDate: tomorrow,
            offlineStartTime: '09:00',
            offlineEndTime: '11:00',
            offlineFacilities: ['PC Desktop Core i7', 'Koneksi LAN High-Speed (1 Gbps)', 'Dual Monitor', 'Ruangan Ber-AC'],
            offlineEquipmentNotes: 'Membawa kartu identitas resmi dan hadir 15 menit sebelum tes.',
            locationOrSandboxNotes:
              globalAssessmentFormat === 'Offline'
                ? 'Ruang Asesmen Talent Lab, Gd. Pusat Lt. 3'
                : 'Instruksi: Kerjakan tes sesuai alokasi waktu yang ditentukan.',
            assessorName: isTechnical
              ? 'Budi Santoso (Tech Lead / User)'
              : currentUser?.name
              ? `${currentUser.name} (HR / Asesor)`
              : 'Aditya Pratama (HR Lead)',
            assessorRole: isTechnical ? 'User (Divisi Terkait)' : 'Tim HR',
            passingGrade: testItem.passingGrade || 75,
            status: 'Belum Dinilai',
            evaluationNotes: '',
          },
        }));
      }
    }
  };

  const handleUpdateAssignedConfig = (testId: string, updates: Partial<CandidateAssignedTest>) => {
    setAssignedTestsConfig((prev) => ({
      ...prev,
      [testId]: {
        ...(prev[testId] || {}),
        ...updates,
      } as CandidateAssignedTest,
    }));
  };

  const handleRegenerateToken = (testId: string) => {
    if (!activeCandidate) return;
    const newToken = generateNewTestToken(activeCandidate.id, testId);
    const newExpires = getFutureExpirationTime(24);
    const newUrl = `${window.location.origin}/?testToken=${newToken}`;

    handleUpdateAssignedConfig(testId, {
      testToken: newToken,
      tokenExpiresAt: newExpires,
      testUrlOrRepo: newUrl,
      isTokenUsed: false,
      testStartedAt: undefined,
      submittedUrl: undefined,
      submittedNotes: undefined,
      submittedAt: undefined,
    });

    setToastFeedback('Token & tautan tes berhasil di-generate ulang! Link baru aktif 24 jam ke depan.');
  };

  const handleCopyTestLink = (testIdOrToken?: string) => {
    if (!testIdOrToken) return;
    let token = testIdOrToken;
    const cfg = assignedTestsConfig[testIdOrToken];
    if (cfg?.testToken) {
      token = cfg.testToken;
    }
    const linkUrl = `${window.location.origin}/?testToken=${token}`;
    navigator.clipboard.writeText(linkUrl);
    setCopyLinkSuccess((prev) => ({ ...prev, [testIdOrToken]: true }));
    setTimeout(() => {
      setCopyLinkSuccess((prev) => ({ ...prev, [testIdOrToken]: false }));
    }, 2500);
    setToastFeedback('Tautan halaman testing pelamar berhasil disalin ke clipboard!');
  };

  const handleCopyFullContent = (testOrConfig: any) => {
    if (!testOrConfig || !activeCandidate) return;
    const cfg: CandidateAssignedTest = typeof testOrConfig === 'string'
      ? assignedTestsConfig[testOrConfig]
      : testOrConfig;
    if (!cfg) return;

    const token = cfg.testToken || generateNewTestToken(activeCandidate.id, cfg.testTypeId);
    const linkUrl = `${window.location.origin}/?testToken=${token}`;
    const vacancyTitle = vacancies.find((v) => v.id === activeCandidate.jobVacancyId)?.title || 'Posisi Formasi';

    const fullText = `UNDANGAN & KONTEN RESMI TES KOMPETENSI NUSARAYA
Peserta: ${activeCandidate.name}
Posisi: ${vacancyTitle}
Jenis Tes: ${cfg.testTypeName} (${cfg.category})
Durasi: ${cfg.durationMinutes || 60} Menit
Passing Grade Acuan: ${cfg.passingGrade}/100
Batas Waktu Berlaku Link: ${cfg.tokenExpiresAt || '24 Jam dari penugasan'}
Asesor Penguji: ${cfg.assessorName} [${cfg.assessorRole || 'Asesor'}]

--- DESKRIPSI TES ---
${cfg.testDescription || getDefaultDescriptionForTest(cfg.testTypeId, cfg.category, cfg.testTypeName)}

--- OUTPUT YANG DIHARAPKAN (DELIVERABLES) ---
${cfg.expectedOutput || getDefaultExpectedOutputForTest(cfg.testTypeId, cfg.category, cfg.testTypeName)}

--- TAUTAN AKSES HALAMAN UJIAN (ONLINE TEST) ---
${linkUrl}

Catatan Penting: Tautan di atas hanya berlaku untuk 1 (satu) kali submit pengerjaan. Timer akan otomatis menghitung mundur setelah Anda menekan tombol 'Mulai Pengerjaan Tes'.`;

    navigator.clipboard.writeText(fullText);
    const key = cfg.testTypeId || 'content';
    setCopyContentSuccess((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyContentSuccess((prev) => ({ ...prev, [key]: false }));
    }, 2500);
    setToastFeedback('Seluruh konten instruksi & link tes berhasil disalin!');
  };

  const handleOpenTestPageInNewTab = (testIdOrToken?: string) => {
    if (!testIdOrToken) return;
    let token = testIdOrToken;
    const cfg = assignedTestsConfig[testIdOrToken];
    if (cfg?.testToken) {
      token = cfg.testToken;
    }
    window.open(`${window.location.origin}/?testToken=${token}`, '_blank');
  };

  const handleSendOnlineTestLink = (testId: string) => {
    if (!activeCandidate) return;
    const testConfig = assignedTestsConfig[testId];
    if (!testConfig) return;

    setIsSendingTestLink((prev) => ({ ...prev, [testId]: true }));
    setTimeout(() => {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      handleUpdateAssignedConfig(testId, {
        invitationSent: true,
        invitationSentAt: nowStr,
      });
      setIsSendingTestLink((prev) => ({ ...prev, [testId]: false }));
      setPreviewSendTestConfig(null);
      setToastFeedback(
        `Konten lengkap tes "${testConfig.testTypeName}" dan link ujian sekali pakai berhasil dikirimkan ke email '${activeCandidate.email}'!`
      );
    }, 500);
  };

  const handleSaveStep1Only = (silent = false) => {
    if (!activeCandidate) return false;
    if (selectedAssessmentTestIds.length === 0) {
      alert('Pilih minimal 1 jenis tes kompetensi sebelum menyimpan!');
      return false;
    }

    // Validasi semua tes memiliki nama asesor
    for (const testId of selectedAssessmentTestIds) {
      const cfg = assignedTestsConfig[testId];
      if (!cfg || !cfg.assessorName?.trim()) {
        const testName = competencyTestTypes.find((t) => t.id === testId)?.name || testId;
        alert(`Harap tentukan nama asesor untuk tes "${testName}"!`);
        return false;
      }
    }

    const assignedList: CandidateAssignedTest[] = selectedAssessmentTestIds.map((testId) => {
      return (
        assignedTestsConfig[testId] || {
          id: `assigned-${Date.now()}-${testId}`,
          testTypeId: testId,
          testTypeName: competencyTestTypes.find((t) => t.id === testId)?.name || testId,
          category: 'Hard Skill',
          format: globalAssessmentFormat,
          durationMinutes: 60,
          assessorName: 'Aditya Pratama (HRBP)',
          assessorRole: 'Tim HR',
          passingGrade: 75,
          status: 'Belum Dinilai',
        }
      );
    });

    updateCandidateStage(activeCandidate.id, 'Assessment', {
      assignedTests: assignedList,
    });

    if (!silent) {
      setToastFeedback('Setup perencanaan tes, jadwal, dan asesor berhasil disimpan!');
    }
    return true;
  };

  const handleProceedToStep2 = () => {
    const success = handleSaveStep1Only(true);
    if (!success) return;

    setActiveStep2TestId(selectedAssessmentTestIds[0] || 'test-tech');
    setAssessmentWizardStep(2);
    setToastFeedback('Lanjut ke Tahap 2: Input Nilai Hasil Tes.');
  };

  const handleSaveStep1AndProceed = handleProceedToStep2;

  const handleSaveStep2Score = (testId: string) => {
    if (!activeCandidate) return;
    const cfg = assignedTestsConfig[testId];
    if (!cfg) return;

    const currentScore = typeof cfg.score === 'number' ? cfg.score : 80;
    const passingGrade = typeof cfg.passingGrade === 'number' ? cfg.passingGrade : 75;
    const isPassing = currentScore >= passingGrade;
    const status: 'Lulus' | 'Tidak Lulus' = isPassing ? 'Lulus' : 'Tidak Lulus';

    const updatedConfig: CandidateAssignedTest = {
      ...cfg,
      score: currentScore,
      passingGrade,
      status,
      evaluatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      evaluationNotes:
        cfg.evaluationNotes ||
        `Skor ${currentScore}/100 pada ${cfg.testTypeName}. Evaluasi oleh ${cfg.assessorName} (${cfg.assessorRole || 'Asesor'}). Status: ${status}.`,
    };

    const newConfigs = {
      ...assignedTestsConfig,
      [testId]: updatedConfig,
    };
    setAssignedTestsConfig(newConfigs);

    // Simpan ke HrmsContext candidate
    const assignedList = selectedAssessmentTestIds.map((tid) => newConfigs[tid] || cfg);
    saveCandidateCompetencyScore(activeCandidate.id, {
      testTypeId: cfg.testTypeId,
      testTypeName: cfg.testTypeName,
      category: cfg.category,
      score: currentScore,
      passingGrade,
      status,
      evaluator: `${cfg.assessorName} (${cfg.assessorRole || 'Asesor'})`,
      notes: updatedConfig.evaluationNotes,
    });

    updateCandidateStage(activeCandidate.id, 'Assessment', {
      assignedTests: assignedList,
    });

    setToastFeedback(`Nilai untuk "${cfg.testTypeName}" berhasil disimpan (${currentScore}/100 - ${status})!`);
  };

  const handleProceedToStep3 = () => {
    if (!activeCandidate) return;
    const unScoredTests = selectedAssessmentTestIds.filter(
      (tid) => assignedTestsConfig[tid]?.score === undefined
    );
    if (unScoredTests.length > 0) {
      const names = unScoredTests
        .map((tid) => assignedTestsConfig[tid]?.testTypeName || tid)
        .join(', ');
      alert(`Mohon input nilai untuk seluruh tes yang diajukan sebelum melihat rekap akhir:\n- ${names}`);
      setActiveStep2TestId(unScoredTests[0]);
      return;
    }

    const assignedList = selectedAssessmentTestIds.map((tid) => assignedTestsConfig[tid]);
    const totalScore = assignedList.reduce((acc, t) => acc + (t.score || 0), 0);
    const avgScore = Math.round(totalScore / assignedList.length);
    const allPassed = assignedList.every((t) => (t.score || 0) >= t.passingGrade);

    updateCandidateStage(activeCandidate.id, 'Assessment', {
      assignedTests: assignedList,
      overallAssessmentScore: avgScore,
      overallAssessmentStatus: allPassed ? 'Lulus' : 'Tidak Lulus',
      testScore: avgScore,
      testStatus: allPassed ? 'Lulus' : 'Tidak Lulus',
    });

    setAssessmentWizardStep(3);
    setToastFeedback('Seluruh tes berhasil dinilai! Menampilkan rekapitulasi nilai akhir & opsi keputusan.');
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

    // Format & Jadwal
    setInterviewFormat(candidate.interviewFormat || 'Online');
    const fullDateStr = candidate.interviewDate || '2026-10-26 10:00';
    if (fullDateStr.includes(' ')) {
      const parts = fullDateStr.split(' ');
      setInterviewDateOnly(parts[0] || '2026-10-26');
      setInterviewStartTime(parts[1] || '10:00');
    } else {
      setInterviewDateOnly(fullDateStr);
      setInterviewStartTime(candidate.interviewStartTime || '10:00');
    }
    setInterviewDate(candidate.interviewDate || '2026-10-26 10:00');
    setInterviewTimeEnd(candidate.interviewTimeEnd || '11:30');
    setInterviewOfflineRoom(candidate.interviewFacilityRoom || 'Ruang Asesmen Talent Lab (Lt. 3 Gedung Pusat) — Kapasitas 8 Orang');
    setInterviewFacilityRoomBookingId(candidate.interviewFacilityRoomBookingId || `GA-IV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setInterviewOfflineRequestedFacilities(candidate.interviewOfflineRequestedFacilities || [
      'Sound System & Wireless Clip-on Mic',
      'Layar Display TV Monitor 55" / Proyektor HDMI'
    ]);
    setInterviewPlatform((candidate.meetingPlatform as any) || 'Google Meet');
    setInterviewMeetingLink(candidate.meetingLink || 'https://meet.google.com/xyz-ntm-hr');
    setCandidateAttendanceStatus(candidate.candidateAttendanceStatus || (candidate.interviewDate ? 'Terkonfirmasi Hadir' : 'Menunggu Respon'));

    // Step Penentuan (Tahap 1, 2, atau 3)
    if (candidate.interviewStep) {
      setInterviewStep(candidate.interviewStep);
    } else if (candidate.interviewScore) {
      setInterviewStep(3);
    } else if (candidate.interviewDate && candidate.interviewNotificationsSent) {
      setInterviewStep(2);
    } else {
      setInterviewStep(1);
    }

    // Setup multi-interviewers (1 - 5 orang)
    let currentInterviewers: AssignedInterviewer[] = [];
    if (candidate.interviewers && candidate.interviewers.length > 0) {
      currentInterviewers = candidate.interviewers.map(inv => ({
        ...inv,
        recommendation: inv.recommendation || 'Sangat cocok',
        scorecardRatings: inv.scorecardRatings || {},
        evaluationNotes: inv.evaluationNotes || '',
        calculatedScore: inv.calculatedScore || 80,
        averageStars: inv.averageStars || 4.0
      }));
    } else {
      currentInterviewers = [
        {
          id: 'inv-lead-user',
          name: candidate.interviewer || (currentUser?.name ? `${currentUser.name}` : 'Aditya Pratama, M.Psi.'),
          title: 'Head of People & Organization',
          department: 'Human Resources',
          email: 'aditya.pratama@nusantara.id',
          role: 'Lead Interviewer / HRBP',
          status: 'Terkonfirmasi',
          recommendation: 'Sangat cocok',
          scorecardRatings: {},
          evaluationNotes: 'Kandidat memiliki etos kerja profesional dan potensi kepemimpinan.',
          calculatedScore: 85,
          averageStars: 4.25
        },
        {
          id: 'inv-tech-lead',
          name: 'Budi Santoso, S.Kom.',
          title: 'Lead Technical User / Engineering',
          department: 'Technology & AI',
          email: 'budi.santoso@nusantara.id',
          role: 'User Interviewer (Departemen)',
          status: 'Terkonfirmasi',
          recommendation: 'Sangat cocok',
          scorecardRatings: {},
          evaluationNotes: 'Pemahaman problem solving dan arsitektur sistem sangat matang.',
          calculatedScore: 88,
          averageStars: 4.40
        },
      ];
    }

    // Inisialisasi rating kriteria default jika belum ada
    currentInterviewers = currentInterviewers.map(inv => {
      const ratings = { ...(inv.scorecardRatings || {}) };
      defaultType?.criteria.forEach(crit => {
        if (!ratings[crit.id]) ratings[crit.id] = 4;
      });
      return {
        ...inv,
        scorecardRatings: ratings,
      };
    });

    setAssignedInterviewers(currentInterviewers);
    setInterviewerName(currentInterviewers.map((i) => i.name).join(', '));
    if (currentInterviewers.length > 0) {
      setActiveInterviewerScoringId(currentInterviewers[0].id);
    }

    setUserRecommendation(candidate.userRecommendation || 'Sangat Cocok / Direkomendasikan (Strong Hire)');
    setRescheduleReason(candidate.rescheduleReason || 'Permintaan Kandidat (Penyesuaian Jadwal)');
    setRescheduleNotes('');
    setIsRescheduleOpen(false);

    // Initial default ratings
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

      // Update ratings for all panelists
      setAssignedInterviewers(prev => prev.map(inv => {
        const nextRatings = { ...(inv.scorecardRatings || {}) };
        target.criteria.forEach(c => {
          if (!nextRatings[c.id]) nextRatings[c.id] = 4;
        });
        return { ...inv, scorecardRatings: nextRatings };
      }));
    }
  };

  const handleSetCriterionRating = (criterionId: string, rating: number) => {
    setScorecardRatings((prev) => ({
      ...prev,
      [criterionId]: rating,
    }));
  };

  // Add an interviewer from company employees (Max 5)
  const handleAddInterviewer = (emp: CompanyEmployeeItem) => {
    if (assignedInterviewers.length >= 5) {
      setToastFeedback('Maksimal penugasan tim pewawancara adalah 5 orang.');
      return;
    }
    const empEmail = `${emp.rawName.toLowerCase().replace(/\s+/g, '.')}@nusantara.id`;
    if (assignedInterviewers.some((inv) => inv.id === emp.id || inv.name.toLowerCase() === emp.fullName.toLowerCase())) {
      setToastFeedback(`${emp.fullName} sudah terdaftar sebagai tim pewawancara.`);
      return;
    }
    const initialRatings: Record<string, number> = {};
    currentSelectedInterviewType?.criteria.forEach(c => {
      initialRatings[c.id] = 4;
    });

    const newInv: AssignedInterviewer = {
      id: emp.id || `inv-${Date.now()}`,
      employeeId: emp.id,
      name: emp.fullName,
      title: emp.position,
      department: emp.department,
      email: empEmail,
      avatar: emp.avatar,
      role: emp.department?.toLowerCase().includes('hr') || emp.department?.toLowerCase().includes('people') ? 'Lead Interviewer / HRBP' : 'Panelis User / Pewawancara',
      status: 'Terkonfirmasi',
      scorecardRatings: initialRatings,
      averageStars: 4.0,
      calculatedScore: 80,
      recommendation: 'Sangat cocok',
      evaluationNotes: '',
    };
    const updated = [...assignedInterviewers, newInv];
    setAssignedInterviewers(updated);
    setInterviewerName(updated.map((i) => i.name).join(', '));
    setToastFeedback(`${emp.fullName} (${emp.position}) ditambahkan ke tim pewawancara panel (${updated.length}/5).`);
    setIsInterviewerSelectorOpen(false);
  };

  // Remove an interviewer (Min 1)
  const handleRemoveInterviewer = (interviewerId: string) => {
    if (assignedInterviewers.length <= 1) {
      setToastFeedback('Minimal 1 orang pewawancara panel wajib ditugaskan.');
      return;
    }
    const updated = assignedInterviewers.filter((inv) => inv.id !== interviewerId);
    setAssignedInterviewers(updated);
    setInterviewerName(updated.map((i) => i.name).join(', '));
    if (activeInterviewerScoringId === interviewerId && updated.length > 0) {
      setActiveInterviewerScoringId(updated[0].id);
    }
    setToastFeedback(`Pewawancara dihapus. Tersisa ${updated.length} pewawancara.`);
  };

  // Open modal change / unable to interview
  const handleOpenChangeInterviewer = (interviewer: AssignedInterviewer) => {
    setTargetInterviewerToChange(interviewer);
    setInterviewerChangeAction('Ganti Pewawancara');
    setReplacementEmployeeId('');
    setInterviewerChangeReason('');
    setIsChangeInterviewerModalOpen(true);
  };

  // Save change interviewer or report unable
  const handleSaveInterviewerChange = () => {
    if (!targetInterviewerToChange || !activeCandidate) return;
    if (!interviewerChangeReason.trim()) {
      alert('Alasan pergantian atau ketidakhadiran pewawancara wajib diisi untuk catatan audit compliance!');
      return;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    let updatedInterviewers = [...assignedInterviewers];
    let historyEntry: InterviewerChangeHistory;

    if (interviewerChangeAction === 'Ganti Pewawancara') {
      const replacementEmp = companyEmployees.find(e => e.id === replacementEmployeeId);
      if (!replacementEmp) {
        alert('Pilih karyawan internal pengganti terlebih dahulu!');
        return;
      }
      const initialRatings: Record<string, number> = {};
      currentSelectedInterviewType?.criteria.forEach(c => {
        initialRatings[c.id] = 4;
      });

      const empEmail = `${replacementEmp.rawName.toLowerCase().replace(/\s+/g, '.')}@nusantara.id`;
      const newInv: AssignedInterviewer = {
        id: replacementEmp.id,
        employeeId: replacementEmp.id,
        name: replacementEmp.fullName,
        title: replacementEmp.position,
        department: replacementEmp.department,
        email: empEmail,
        avatar: replacementEmp.avatar,
        role: targetInterviewerToChange.role || 'Panelis User / Pewawancara',
        status: 'Terkonfirmasi',
        scorecardRatings: initialRatings,
        averageStars: 4.0,
        calculatedScore: 80,
        recommendation: 'Sangat cocok',
        evaluationNotes: '',
      };
      updatedInterviewers = updatedInterviewers.map(inv => inv.id === targetInterviewerToChange.id ? newInv : inv);
      historyEntry = {
        id: `hist-${Date.now()}`,
        timestamp,
        action: 'Ganti Pewawancara',
        previousInterviewer: `${targetInterviewerToChange.name} (${targetInterviewerToChange.title})`,
        newInterviewer: `${replacementEmp.fullName} (${replacementEmp.position})`,
        reason: interviewerChangeReason,
        recordedBy: currentUser?.name || 'HR Recruiter Specialist',
      };
      setToastFeedback(`Pewawancara ${targetInterviewerToChange.name} berhasil diganti oleh ${replacementEmp.fullName}. Histori pergantian dicatat.`);
    } else {
      updatedInterviewers = updatedInterviewers.map(inv =>
        inv.id === targetInterviewerToChange.id ? { ...inv, status: 'Berhalangan', notes: interviewerChangeReason } : inv
      );
      historyEntry = {
        id: `hist-${Date.now()}`,
        timestamp,
        action: 'Pewawancara Berhalangan',
        previousInterviewer: `${targetInterviewerToChange.name} (${targetInterviewerToChange.title})`,
        reason: interviewerChangeReason,
        recordedBy: currentUser?.name || 'HR Recruiter Specialist',
      };
      setToastFeedback(`Pewawancara ${targetInterviewerToChange.name} ditandai Berhalangan Hadir.`);
    }

    const updatedHistory = [...(activeCandidate.interviewerChangeHistory || []), historyEntry];
    setAssignedInterviewers(updatedInterviewers);
    setInterviewerName(updatedInterviewers.filter(i => i.status !== 'Berhalangan').map(i => i.name).join(', '));

    updateCandidateStage(activeCandidate.id, 'Interview', {
      interviewers: updatedInterviewers,
      interviewer: updatedInterviewers.filter(i => i.status !== 'Berhalangan').map(i => i.name).join(', '),
      interviewerChangeHistory: updatedHistory,
    });

    setActiveCandidate(prev => prev ? {
      ...prev,
      interviewers: updatedInterviewers,
      interviewerChangeHistory: updatedHistory,
    } : null);

    setIsChangeInterviewerModalOpen(false);
  };

  // Send notifications & invitations (Kalender .ics + WhatsApp + Push Notifikasi HRMS)
  const handleSendInterviewInvitations = () => {
    if (!activeCandidate) return;
    if (!interviewDateOnly || !interviewStartTime || !interviewTimeEnd) {
      alert('Mohon lengkapi tanggal dan jam mulai / selesai wawancara terlebih dahulu!');
      return;
    }
    if (interviewFormat === 'Online' && !interviewMeetingLink) {
      alert('Mohon lampirkan link meeting online (Google Meet, Zoom, atau Teams)!');
      return;
    }

    const fullSchedule = `${interviewDateOnly} ${interviewStartTime}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    updateCandidateStage(activeCandidate.id, 'Interview', {
      interviewDate: fullSchedule,
      interviewStartTime,
      interviewTimeEnd,
      interviewFormat,
      interviewFacilityRoom: interviewFormat === 'Offline' ? interviewOfflineRoom : undefined,
      interviewFacilityRoomBookingId: interviewFormat === 'Offline' ? interviewFacilityRoomBookingId : undefined,
      interviewOfflineRequestedFacilities: interviewFormat === 'Offline' ? interviewOfflineRequestedFacilities : undefined,
      meetingLink: interviewFormat === 'Online' ? interviewMeetingLink : undefined,
      meetingPlatform: interviewFormat === 'Online' ? interviewPlatform : 'Ruang Interview Kantor',
      interviewers: assignedInterviewers,
      interviewer: assignedInterviewers.map(i => i.name).join(', '),
      interviewScheduleStatus: 'Terkonfirmasi (Siap Hari-H)',
      candidateAttendanceStatus: 'Terkonfirmasi Hadir',
      interviewNotificationsSent: true,
      interviewNotificationsSentAt: nowStr,
    });

    setActiveCandidate(prev => prev ? {
      ...prev,
      interviewDate: fullSchedule,
      interviewStartTime,
      interviewTimeEnd,
      interviewFormat,
      interviewFacilityRoom: interviewFormat === 'Offline' ? interviewOfflineRoom : undefined,
      meetingLink: interviewFormat === 'Online' ? interviewMeetingLink : undefined,
      interviewScheduleStatus: 'Terkonfirmasi (Siap Hari-H)',
      interviewNotificationsSent: true,
      interviewNotificationsSentAt: nowStr,
    } : null);

    setToastFeedback(
      `Undangan wawancara berhasil dikirimkan ke ${activeCandidate.name} dan ${assignedInterviewers.length} Tim Panelis! Email kalender (.ics), notifikasi WhatsApp, dan push notifikasi HRMS telah terkirim.`
    );
  };

  // Save individual panelist rating in Tahap 2
  const handleUpdatePanelistRating = (
    interviewerId: string,
    criterionId: string,
    rating: number
  ) => {
    setAssignedInterviewers(prev => prev.map(inv => {
      if (inv.id !== interviewerId) return inv;
      const nextRatings = { ...(inv.scorecardRatings || {}), [criterionId]: rating };
      const criteria = currentSelectedInterviewType?.criteria || [];
      let sum = 0;
      criteria.forEach(c => {
        sum += (nextRatings[c.id] || 4);
      });
      const avg = criteria.length > 0 ? Number((sum / criteria.length).toFixed(2)) : 4.0;
      const score100 = Math.round((avg / 5) * 100);
      return {
        ...inv,
        scorecardRatings: nextRatings,
        averageStars: avg,
        calculatedScore: score100,
        evaluatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    }));
  };

  const handleUpdatePanelistRecommendation = (
    interviewerId: string,
    recommendation: 'Sangat cocok' | 'Dipertimbangkan' | 'Kurang cocok' | 'Tidak cocok'
  ) => {
    setAssignedInterviewers(prev => prev.map(inv => {
      if (inv.id !== interviewerId) return inv;
      return {
        ...inv,
        recommendation,
        evaluatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    }));
  };

  const handleUpdatePanelistNotes = (
    interviewerId: string,
    notes: string
  ) => {
    setAssignedInterviewers(prev => prev.map(inv => {
      if (inv.id !== interviewerId) return inv;
      return {
        ...inv,
        evaluationNotes: notes,
      };
    }));
  };

  // Live average star calculation for current selected interview type
  const calculatedInterviewScore = React.useMemo(() => {
    if (!assignedInterviewers || assignedInterviewers.length === 0) {
      return { averageStars: 4.0, totalScore: 80 };
    }
    const evaluated = assignedInterviewers.filter(i => i.calculatedScore !== undefined && i.calculatedScore > 0 && i.status !== 'Berhalangan');
    if (evaluated.length === 0) {
      return { averageStars: 4.0, totalScore: 80 };
    }
    const sumStars = evaluated.reduce((acc, curr) => acc + (curr.averageStars || 4.0), 0);
    const sumScores = evaluated.reduce((acc, curr) => acc + (curr.calculatedScore || 80), 0);
    const avgStars = Number((sumStars / evaluated.length).toFixed(2));
    const totalScore = Math.round(sumScores / evaluated.length);
    return { averageStars: avgStars, totalScore };
  }, [assignedInterviewers]);

  // Objective Rule-Based Decision Matrix (Non-AI, Formulaic & Auditable)
  const systemObjectiveEvaluation = React.useMemo(() => {
    if (!activeCandidate) return null;

    // 1. Nilai Tes Kemampuan / Asesmen Teknis
    const testScore = typeof activeCandidate.testScore === 'number'
      ? activeCandidate.testScore
      : (activeCandidate.competencyScores && activeCandidate.competencyScores.length > 0
          ? Math.round(activeCandidate.competencyScores.reduce((acc, c) => acc + c.score, 0) / activeCandidate.competencyScores.length)
          : (activeCandidate.overallAssessmentScore || 85));

    // 2. Nilai Wawancara Panel (Rata-rata dari seluruh panelis di Tahap 2)
    const interviewScore = calculatedInterviewScore.totalScore;

    // 3. Bobot Baku Perusahaan (Non-AI Compliance): Tes Kemampuan (40%) + Evaluasi Wawancara Panel (60%)
    const compositeScore = Math.round((testScore * 0.40) + (interviewScore * 0.60));
    const passingGrade = 75;

    // 4. Rekapitulasi Rekomendasi User dari seluruh panelis
    const activePanelists = assignedInterviewers.filter(i => i.status !== 'Berhalangan');
    const totalPanelists = activePanelists.length;
    const countSangatCocok = activePanelists.filter(i => i.recommendation === 'Sangat cocok').length;
    const countDipertimbangkan = activePanelists.filter(i => i.recommendation === 'Dipertimbangkan').length;
    const countKurangCocok = activePanelists.filter(i => i.recommendation === 'Kurang cocok').length;
    const countTidakCocok = activePanelists.filter(i => i.recommendation === 'Tidak cocok').length;

    const userRecSummary = [
      countSangatCocok > 0 ? `${countSangatCocok} Sangat Cocok` : null,
      countDipertimbangkan > 0 ? `${countDipertimbangkan} Dipertimbangkan` : null,
      countKurangCocok > 0 ? `${countKurangCocok} Kurang Cocok` : null,
      countTidakCocok > 0 ? `${countTidakCocok} Tidak Cocok` : null,
    ].filter(Boolean).join(', ') || 'Semua Panelis Sangat Cocok';

    let status: 'Sangat Direkomendasikan' | 'Direkomendasikan Lolos' | 'Dipertimbangkan' | 'Tidak Direkomendasikan' = 'Dipertimbangkan';
    let rationale = '';

    if (compositeScore >= 80 && countTidakCocok === 0 && countKurangCocok === 0) {
      status = 'Sangat Direkomendasikan';
      rationale = `Kandidat meraih Skor Komposit ${compositeScore}/100 (Tes Kemampuan: ${testScore}, Wawancara: ${interviewScore}), melampaui passing grade 75 dengan konsensus ${userRecSummary}. Sangat layak dan direkomendasikan langsung untuk penerbitan Offering Letter.`;
    } else if (compositeScore >= passingGrade && countTidakCocok === 0) {
      status = 'Direkomendasikan Lolos';
      rationale = `Kandidat memenuhi seluruh kriteria kelayakan rekrutmen objektif (${compositeScore}/100 >= ${passingGrade}). Konsensus tim: ${userRecSummary}. Memenuhi SOP untuk lanjut ke Offering Letter atau MCU.`;
    } else if (compositeScore >= 65 && countTidakCocok === 0) {
      status = 'Dipertimbangkan';
      rationale = `Kandidat berada pada batas pertimbangan (${compositeScore}/100) dengan rekomendasi ${userRecSummary}. Disarankan dimasukkan ke Talent Pool (cadangan) atau review bersama Head of Dept.`;
    } else {
      status = 'Tidak Direkomendasikan';
      rationale = `Kandidat belum memenuhi ambang batas minimum kelulusan SOP (${compositeScore}/100 < ${passingGrade}) atau menerima rekomendasi Tidak Cocok dari panelis user. Disarankan tidak dilanjutkan.`;
    }

    return {
      testScore,
      interviewScore,
      compositeScore,
      passingGrade,
      status,
      rationale,
      userRecSummary,
      countSangatCocok,
      countDipertimbangkan,
      countKurangCocok,
      countTidakCocok,
      isApproved: status === 'Sangat Direkomendasikan' || status === 'Direkomendasikan Lolos',
    };
  }, [activeCandidate, calculatedInterviewScore.totalScore, assignedInterviewers]);

  // Handler for Rescheduling Interview
  const handleConfirmReschedule = () => {
    if (!activeCandidate) return;

    const previousDate = activeCandidate.interviewDate || 'Belum Dijadwalkan';
    const newSchedule = `${interviewDateOnly} ${interviewStartTime}`;

    const newHistoryEntry = {
      previousDate,
      newDate: `${newSchedule} s.d. ${interviewTimeEnd} WIB`,
      reason: rescheduleReason + (rescheduleNotes ? ` - Catatan: ${rescheduleNotes}` : ''),
      requestedBy: currentUser?.name || 'HR Recruitment Specialist',
      rescheduledAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const updatedHistory = [...(activeCandidate.rescheduleHistory || []), newHistoryEntry];

    updateCandidateStage(activeCandidate.id, 'Interview', {
      interviewDate: newSchedule,
      interviewStartTime,
      interviewTimeEnd,
      interviewScheduleStatus: 'Jadwal Diperbarui',
      rescheduleReason,
      rescheduleHistory: updatedHistory,
      interviewers: assignedInterviewers,
      interviewer: assignedInterviewers.map((i) => i.name).join(', '),
    });

    setActiveCandidate(prev => prev ? {
      ...prev,
      interviewDate: newSchedule,
      interviewStartTime,
      interviewTimeEnd,
      rescheduleHistory: updatedHistory,
    } : null);

    setToastFeedback(
      `Jadwal wawancara ${activeCandidate.name} berhasil di-reschedule ke ${newSchedule} (${interviewTimeEnd} WIB)! Notifikasi dan calendar invitation baru telah dikirimkan ke kandidat dan ${assignedInterviewers.length} pewawancara.`
    );
    setIsRescheduleOpen(false);
  };

  const handleSaveInterview = () => {
    if (!activeCandidate || !currentSelectedInterviewType) return;

    const interviewerNames = assignedInterviewers.map((i) => i.name).join(', ');
    const fullDateSchedule = `${interviewDateOnly} ${interviewStartTime}`;

    saveCandidateInterviewEvaluation(activeCandidate.id, {
      interviewTypeId: currentSelectedInterviewType.id,
      interviewTypeName: currentSelectedInterviewType.name,
      interviewDate: fullDateSchedule,
      interviewer: interviewerNames,
      platform: interviewFormat === 'Online' ? interviewPlatform : 'Ruang Interview Kantor',
      meetingLink: interviewFormat === 'Online' ? interviewMeetingLink : undefined,
      scorecardRatings,
      averageStars: calculatedInterviewScore.averageStars,
      calculatedScore: calculatedInterviewScore.totalScore,
      recommendation: systemObjectiveEvaluation?.isApproved ? 'Direkomendasikan Lolos' : (systemObjectiveEvaluation?.status === 'Dipertimbangkan' ? 'Dipertimbangkan' : 'Tidak Direkomendasikan'),
      notes:
        interviewNotes ||
        `Scorecard wawancara "${currentSelectedInterviewType.name}": Rata-rata ${calculatedInterviewScore.averageStars} / 5.0 (${calculatedInterviewScore.totalScore}/100). Rekomendasi User: ${systemObjectiveEvaluation?.userRecSummary}.`,
    });

    updateCandidateStage(activeCandidate.id, 'Interview', {
      interviewDate: fullDateSchedule,
      interviewStartTime,
      interviewTimeEnd,
      interviewFormat,
      interviewFacilityRoom: interviewFormat === 'Offline' ? interviewOfflineRoom : undefined,
      interviewFacilityRoomBookingId: interviewFormat === 'Offline' ? interviewFacilityRoomBookingId : undefined,
      interviewOfflineRequestedFacilities: interviewFormat === 'Offline' ? interviewOfflineRequestedFacilities : undefined,
      interviewer: interviewerNames,
      interviewers: assignedInterviewers,
      meetingPlatform: interviewFormat === 'Online' ? interviewPlatform : 'Ruang Interview Kantor',
      meetingLink: interviewFormat === 'Online' ? interviewMeetingLink : undefined,
      candidateAttendanceStatus,
      interviewScore: calculatedInterviewScore.totalScore,
      interviewNotes,
      userRecommendation: systemObjectiveEvaluation?.userRecSummary,
      interviewStep,
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
        recommendation: systemObjectiveEvaluation?.isApproved ? 'Direkomendasikan Lolos' : 'Dipertimbangkan',
      },
    });

    setToastFeedback(
      `Data wawancara "${currentSelectedInterviewType.name}" berhasil disimpan untuk ${activeCandidate.name}!`
    );
  };

  // Direct Transition to Offering from Interview Modal
  const handleProceedToOfferingFromInterview = () => {
    if (!activeCandidate || !currentSelectedInterviewType) return;

    const interviewerNames = assignedInterviewers.map((i) => i.name).join(', ');
    const fullDateSchedule = `${interviewDateOnly} ${interviewStartTime}`;

    // 1. Save interview evaluation
    saveCandidateInterviewEvaluation(activeCandidate.id, {
      interviewTypeId: currentSelectedInterviewType.id,
      interviewTypeName: currentSelectedInterviewType.name,
      interviewDate: fullDateSchedule,
      interviewer: interviewerNames,
      platform: interviewFormat === 'Online' ? interviewPlatform : 'Ruang Interview Kantor',
      meetingLink: interviewFormat === 'Online' ? interviewMeetingLink : undefined,
      scorecardRatings,
      averageStars: calculatedInterviewScore.averageStars,
      calculatedScore: calculatedInterviewScore.totalScore,
      recommendation: 'Direkomendasikan Lolos',
      notes: interviewNotes || `Lulus wawancara dengan skor ${calculatedInterviewScore.totalScore}/100. Rekomendasi: ${systemObjectiveEvaluation?.userRecSummary}. Lanjut ke proses penawaran kerja (Offering).`,
    });

    // 2. Advance candidate to Offered stage
    updateCandidateStage(activeCandidate.id, 'Offered', {
      interviewDate: fullDateSchedule,
      interviewStartTime,
      interviewTimeEnd,
      interviewFormat,
      interviewFacilityRoom: interviewFormat === 'Offline' ? interviewOfflineRoom : undefined,
      interviewFacilityRoomBookingId: interviewFormat === 'Offline' ? interviewFacilityRoomBookingId : undefined,
      interviewer: interviewerNames,
      interviewers: assignedInterviewers,
      meetingPlatform: interviewFormat === 'Online' ? interviewPlatform : 'Ruang Interview Kantor',
      meetingLink: interviewFormat === 'Online' ? interviewMeetingLink : undefined,
      interviewScore: calculatedInterviewScore.totalScore,
      interviewNotes,
      userRecommendation: systemObjectiveEvaluation?.userRecSummary,
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
        recommendation: 'Direkomendasikan Lolos',
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
  const mcuCount = candidates.filter((c) => c.stage === 'Medical Check-Up').length;
  const pipelineTotalCount = incomingCount + screeningCount + assessmentCount + interviewCount + mcuCount;

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
            <UserPlus className="w-5 h-5 text-blue-700 shrink-0" />
            <span>Manajemen Rekrutmen, Seleksi & Onboarding</span>
          </h2>
          <p className="text-xs text-slate-500">
            Tata kelola alur rekrutmen terpisah: Permintaan FPTK, Lowongan Sourcing, Pipeline Seleksi, Offering Letter, Keputusan Hired/Disqualified, On Boarding, & Talent Pool.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setIsRequisitionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>+ Ajukan FPTK</span>
          </button>
          <button
            onClick={() => setIsCandidateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs border border-slate-300 transition-colors shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>+ Tambah Pelamar</span>
          </button>
        </div>
      </div>

      {/* ===================== ROADMAP ALUR PROSES REKRUTMEN (EXECUTIVE SUMMARY DASHBOARD) ===================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
        {/* Card 1: FPTK */}
        <div
          onClick={() => setActiveTab('fptk')}
          className={`cursor-pointer rounded-xl p-3 border transition-all hover:shadow-xs flex flex-col justify-between ${
            activeTab === 'fptk'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-1.5 mb-1.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate flex-1 min-w-0 leading-tight" title="1. FPTK Kebutuhan">
              1. FPTK Kebutuhan
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0 min-w-6 min-h-6 shadow-2xs">
              <FileCheck className="w-3.5 h-3.5 shrink-0" />
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
          <div className="flex items-start justify-between gap-1.5 mb-1.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate flex-1 min-w-0 leading-tight" title="2. Lowongan Terpublikasi">
              2. Lowongan Terpublikasi
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 min-w-6 min-h-6 shadow-2xs">
              <Globe className="w-3.5 h-3.5 shrink-0" />
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
          <div className="flex items-start justify-between gap-1.5 mb-1.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate flex-1 min-w-0 leading-tight" title="3. Pipeline Seleksi">
              3. Pipeline Seleksi
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700 shrink-0 min-w-6 min-h-6 shadow-2xs">
              <Users className="w-3.5 h-3.5 shrink-0" />
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
              <span title="Medical Check-Up" className="bg-teal-100 text-teal-800 px-1 py-0.5 rounded font-bold">MCU:{mcuCount}</span>
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
          <div className="flex items-start justify-between gap-1.5 mb-1.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate flex-1 min-w-0 leading-tight" title="4. Offering Letter">
              4. Offering Letter
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 min-w-6 min-h-6 shadow-2xs">
              <Calculator className="w-3.5 h-3.5 shrink-0" />
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
          <div className="flex items-start justify-between gap-1.5 mb-1.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate flex-1 min-w-0 leading-tight" title="5. Hired / Onboard">
              5. Hired / Onboard
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 shrink-0 min-w-6 min-h-6 shadow-2xs">
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
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
          <div className="flex items-start justify-between gap-1.5 mb-1.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate flex-1 min-w-0 leading-tight" title="6. Talent Pool">
              6. Talent Pool
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 shrink-0 min-w-6 min-h-6 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
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

                          <div className="pt-2.5 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>Pemohon:</span>
                              <span className="font-semibold text-slate-700 truncate max-w-[150px]" title={req.requesterName}>
                                {req.requesterName}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 w-full pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleOpenRetractModal(req)}
                                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white hover:bg-amber-50 text-amber-800 rounded-lg text-xs font-semibold border border-amber-300 shadow-2xs hover:shadow-xs transition-colors w-full"
                                title="Retract / Cabut Pengajuan FPTK yang Sudah Disetujui"
                              >
                                <Undo2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Retract</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConvertFptkToVacancy(req)}
                                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-lg text-xs font-semibold shadow-2xs hover:shadow-xs transition-colors w-full"
                                title="Buka Lowongan dan Sebar ke Multi-Channel"
                              >
                                <span className="truncate">Proses Publikasi</span>
                                <ArrowRight className="w-3.5 h-3.5 text-white shrink-0" />
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
                Alur seleksi teknis: 1. Incoming (Berkas CV) ➔ 2. Screening (Kualifikasi) ➔ 3. Assessment (Tes) ➔ 4. Interview (User) ➔ 5. Medical Check-Up (MCU) ➔ 6. Offering Letter.
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
                <span>+ Upload CV Manual (Applied)</span>
              </button>
            </div>
          </div>

          {/* 4 Clean Columns: Applied (Screening & Profiling) -> Assessment -> Interview -> Medical Check-Up */}
          {pipelineViewMode === 'board' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start w-full">
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
                          {stg.stage === 'Applied' && (
                            <button
                              type="button"
                              onClick={() => {
                                resetCandidateModal();
                                setIsCandidateModalOpen(true);
                              }}
                              className="px-2 py-0.5 rounded bg-blue-700 hover:bg-blue-800 text-white font-semibold text-[10px] shadow-2xs flex items-center gap-1 transition-colors"
                              title="Upload File CV PDF & Registrasi Pelamar"
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
                        stg.stage === 'Applied' ? (
                          <div className="h-44 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 flex flex-col items-center justify-center p-4 text-center text-slate-600 text-[11px] space-y-2.5">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">Belum Ada Pelamar di Applied</p>
                              <p className="text-[10px] text-slate-500 max-w-[200px] mt-0.5">
                                Upload berkas CV (PDF) untuk memulai proses profiling dan screening otomatis.
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
                              <div className="space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-bold text-slate-900 text-xs leading-snug break-words flex-1 min-w-0" title={candidate.name}>
                                    {candidate.name}
                                  </h4>
                                  {candidate.sourcePortal && (() => {
                                    const pCfg = getPortalBadgeConfig(candidate.sourcePortal);
                                    return (
                                      <span
                                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs shrink-0 ${pCfg.badgeClass}`}
                                        title={`Sumber Pelamar: ${candidate.sourcePortal}`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dotClass} shrink-0`} />
                                        <span className="max-w-[85px] truncate">{pCfg.label}</span>
                                      </span>
                                    );
                                  })()}
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]" title={candidate.lastCompany}>
                                    {candidate.lastCompany || 'Pelamar Baru'}
                                  </span>
                                  {candidate.parsedData && candidate.parsedData.totalExperienceYears >= 3 && (
                                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                      ★ Rekam Jejak Unggulan
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-[11px] space-y-0.5 bg-slate-50 p-2 rounded border border-slate-100">
                                <div className="font-semibold text-blue-950 truncate">{vac?.title || 'Posisi'}</div>
                              </div>

                              {stg.stage === 'Applied' && (() => {
                                const pResult = getCandidateParsingResult(candidate);
                                const isParsingDoubtful = pResult.score < 50;

                                return (
                                  <div className="space-y-1.5 pt-0.5">
                                    {/* 1. Box Indikator Persentase Hasil Parsing CV */}
                                    <div className={`p-2 rounded-lg border ${pResult.bgClass} space-y-1`}>
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="font-bold text-slate-800 flex items-center gap-1">
                                          <Sparkles className="w-3 h-3 text-blue-600 shrink-0" />
                                          <span>Hasil Parsing CV</span>
                                        </span>
                                        <span className={`font-mono font-bold text-[10px] px-1.5 py-0.2 rounded border ${pResult.badgeClass}`}>
                                          {pResult.label}
                                        </span>
                                      </div>
                                      {/* Progress Bar Persentase */}
                                      <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-300 ${pResult.barClass}`}
                                          style={{ width: `${pResult.score}%` }}
                                        />
                                      </div>
                                      <div className="text-[9px] text-slate-600 line-clamp-1" title={pResult.note}>
                                        {pResult.note}
                                      </div>
                                      {/* Nama file CV diletakkan langsung di bawah hasil parsing & ganti nama jadi Preview CV */}
                                      <div className="flex items-center justify-between text-[10px] bg-blue-50/70 hover:bg-blue-100/70 text-blue-900 border border-blue-200/80 px-2.5 py-1.5 rounded-lg transition-colors shadow-2xs">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewCvCandidate(candidate);
                                          }}
                                          className="font-bold flex items-center gap-1.5 hover:underline text-left group truncate min-w-0 flex-1 cursor-pointer"
                                          title="Klik untuk Pratinjau Dokumen CV (PDF)"
                                        >
                                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                                          <span className="truncate">Preview CV</span>
                                          <span className="text-[9px] text-blue-600 font-normal">({candidate.cvFileSize || 'PDF Terlampir'})</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadCv(candidate);
                                          }}
                                          className="p-1 hover:bg-blue-200 text-blue-700 rounded transition-colors shrink-0"
                                          title="Download Berkas CV (PDF)"
                                        >
                                          <Download className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* 2. Box Hasil Screening Kualifikasi & Keyword Match */}
                                    {isParsingDoubtful ? (
                                      <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1">
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="font-bold flex items-center gap-1 text-amber-800">
                                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                            <span>Screening Ragu</span>
                                          </span>
                                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                            Data Minim
                                          </span>
                                        </div>
                                        <p className="text-[9.5px] text-amber-700 leading-tight">
                                          Parsing minim sehingga screening otomatis tidak dapat dipastikan. <strong>Disarankan screening manual.</strong>
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="p-2 rounded-lg bg-sky-50/70 border border-sky-200 space-y-1 text-[10px]">
                                        <div className="flex items-center justify-between">
                                          <span className="font-semibold text-sky-950 flex items-center gap-1">
                                            <FileCheck className="w-3 h-3 text-sky-600 shrink-0" />
                                            <span>Screening Kualifikasi:</span>
                                          </span>
                                          <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-300">
                                            {candidate.aiMatchScore || 85}% Match
                                          </span>
                                        </div>
                                        <div className="text-[9.5px] text-slate-600 line-clamp-1">
                                          {candidate.screeningNotes || 'Kualifikasi cocok dengan requirement lowongan.'}
                                        </div>
                                      </div>
                                    )}

                                    {/* 4. Skills Tags */}
                                    {candidate.parsedData && candidate.parsedData.topSkills.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {candidate.parsedData.topSkills.slice(0, 3).map((skill, idx) => (
                                          <span key={idx} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

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

                              {stg.stage === 'Medical Check-Up' && (
                                <div className="space-y-1.5 pt-0.5 text-[10px]">
                                  <div className="flex items-center justify-between font-semibold">
                                    <span className="text-slate-700 flex items-center gap-1">
                                      <HeartPulse className="w-3 h-3 text-teal-600 shrink-0" />
                                      <span className="truncate max-w-[110px]" title={candidate.mcuClinicOrHospital}>
                                        {candidate.mcuClinicOrHospital || 'RS Siloam / Prodia'}
                                      </span>
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                                        candidate.mcuStatus === 'Fit (Lolos)'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : candidate.mcuStatus === 'Fit with Note'
                                          ? 'bg-amber-100 text-amber-800'
                                          : candidate.mcuStatus === 'Unfit (Gugur)'
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-teal-50 text-teal-700 border border-teal-200'
                                      }`}
                                    >
                                      {candidate.mcuStatus || 'Dijadwalkan'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>Tgl: {candidate.mcuDate || '2026-10-27'}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                                    {candidate.mcuNotes || 'Pemeriksaan laboratorium pra-kerja lengkap.'}
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                                {stg.stage === 'Applied' && (() => {
                                  const pResult = getCandidateParsingResult(candidate);
                                  const isParsingDoubtful = pResult.score < 50;

                                  return (
                                    <>
                                      {/* 1. Tombol Utama: Hasil Screening, Rincian Profiling & Scoring Keyword Match */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAppliedProfilingModal(candidate, false)}
                                        className="w-full py-2 px-2 text-[10px] font-bold bg-blue-50 text-blue-800 hover:bg-blue-100 active:bg-blue-200 border border-blue-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs group text-center"
                                        title="Buka Hasil Screening Kualifikasi, Rincian Profiling CV & Scoring Keyword Match"
                                      >
                                        <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 group-hover:rotate-12 transition-transform" />
                                        <span className="leading-tight text-center">Hasil Screening, Rincian Profiling & Scoring Keyword Match</span>
                                      </button>

                                      {/* 2. Tombol Koreksi Screening Manual */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAppliedProfilingModal(candidate, true)}
                                        className={`w-full py-1.5 px-2 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors border ${
                                          isParsingDoubtful
                                            ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white border-amber-600'
                                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-blue-700 hover:border-blue-300'
                                        }`}
                                        title="Buka form input atau koreksi hasil screening manual"
                                      >
                                        {isParsingDoubtful ? (
                                          <>
                                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                            <span>Input Screening Manual (Wajib - Data Minim)</span>
                                          </>
                                        ) : (
                                          <>
                                            <Pencil className="w-3 h-3 text-slate-500 shrink-0" />
                                            <span>Koreksi Screening Manual</span>
                                          </>
                                        )}
                                      </button>

                                      {/* 3. Dua Opsi Shortlist (Wajib ada confirm box): Ke Assessment & Ke Interview */}
                                      <div className="pt-1 border-t border-slate-100 space-y-1">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Opsi Shortlist:</span>
                                        <div className="grid grid-cols-2 gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => setConfirmAssessmentCandidate(candidate)}
                                            className="w-full py-1.5 px-1 text-[9.5px] font-bold bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded flex items-center justify-center gap-1 transition-colors shadow-2xs truncate"
                                            title="Shortlist pelamar ke proses Tes Kompetensi (Asesmen)"
                                          >
                                            <Award className="w-3 h-3 shrink-0" />
                                            <span className="truncate">Ke Assessment</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmInterviewCandidate(candidate)}
                                            className="w-full py-1.5 px-1 text-[9.5px] font-bold bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white rounded flex items-center justify-center gap-1 transition-colors shadow-2xs truncate"
                                            title="Langsung Shortlist ke Wawancara (User)"
                                          >
                                            <Video className="w-3 h-3 shrink-0" />
                                            <span className="truncate">Ke Interview</span>
                                          </button>
                                        </div>
                                      </div>

                                      {/* 4. Dibawahnya ada 2 opsi (Wajib ada confirm box): Masukan Talent Pool & Tolak */}
                                      <div className="pt-1 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenTalentPoolModal(candidate)}
                                          className="w-full py-1.5 px-1 text-[9.5px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded flex items-center justify-center gap-1 transition-colors shadow-2xs truncate"
                                          title="Pindahkan kandidat ke Talent Pool untuk kebutuhan mendatang (melalui konfirmasi)"
                                        >
                                          <FolderPlus className="w-3 h-3 text-amber-600 shrink-0" />
                                          <span className="truncate">Masukan Talent Pool</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenRejectModal(candidate)}
                                          className="w-full py-1.5 px-1 text-[9.5px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded flex items-center justify-center gap-1 transition-colors shadow-2xs truncate"
                                          title="Tolak lamaran kandidat & kirimkan pesan penolakan resmi (melalui konfirmasi)"
                                        >
                                          <UserX className="w-3 h-3 text-rose-600 shrink-0" />
                                          <span className="truncate">Tolak</span>
                                        </button>
                                      </div>
                                    </>
                                  );
                                })()}

                                {stg.stage === 'Assessment' && (() => {
                                  const pInfo = getCandidateAssessmentProgressInfo(candidate);
                                  return (
                                    <div className="space-y-1.5 pt-0.5">
                                      {/* Box Informasi Tahapan Assessment (Tahap 1 / Tahap 2 / Tahap 3) */}
                                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/90 space-y-1 text-[10px]">
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="font-bold text-slate-800 flex items-center gap-1">
                                            <Award className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                            <span>Status Tahapan:</span>
                                          </span>
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${pInfo.badgeClass}`}>
                                            {pInfo.stepLabel}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between text-slate-700 font-semibold pt-0.5">
                                          <span className="truncate text-slate-900">{pInfo.title}</span>
                                          <span className="font-mono text-indigo-700 font-bold shrink-0 ml-1">Langkah {pInfo.step}/3</span>
                                        </div>

                                        {/* Progress Bar Micro */}
                                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-0.5">
                                          <div
                                            className={`h-full transition-all duration-300 ${
                                              pInfo.step === 3
                                                ? 'bg-emerald-500'
                                                : pInfo.step === 2
                                                ? 'bg-indigo-600'
                                                : 'bg-amber-500'
                                            }`}
                                            style={{ width: pInfo.progressBarWidth }}
                                          />
                                        </div>

                                        <div className="text-[9px] text-slate-500 leading-tight pt-0.5">
                                          {pInfo.detail}
                                        </div>
                                      </div>

                                      {/* Tombol Aksi: Kelola & Proses Tes Kompetensi */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAssessmentModal(candidate)}
                                        className="w-full py-1.5 px-2 text-[11px] font-bold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                                        title="Buka modal asesmen 3 tahap: Setup & Perencanaan, Input Nilai Asesor, dan Keputusan Kelulusan"
                                      >
                                        <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <span>Kelola & Proses Tes Kompetensi</span>
                                      </button>

                                      <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setConfirmRevertToScreeningCandidate(candidate)}
                                          className="w-full py-1 px-1 text-[10px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded flex items-center justify-center gap-1 transition-colors shadow-2xs truncate"
                                          title="Kembalikan proses pelamar ke tahap Applied"
                                        >
                                          <Undo2 className="w-3 h-3 text-amber-600 shrink-0" />
                                          <span className="truncate">Ke Applied</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmInterviewCandidate(candidate)}
                                          className="w-full py-1 px-1 text-[10px] font-semibold bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded text-center transition-colors shadow-2xs truncate"
                                          title="Loloskan ke Wawancara (User) melalui konfirmasi"
                                        >
                                          Ke Wawancara →
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {stg.stage === 'Interview' && (() => {
                                  const passed = isInterviewPassed(candidate);
                                  const statusInfo = getInterviewStatusInfo(candidate);
                                  const ivInfo = getCandidateInterviewProgressInfo(candidate);
                                  return (
                                    <div className="space-y-1.5 pt-0.5">
                                      {/* Box Informasi Tahapan Wawancara (Tahap 1 / Tahap 2 / Tahap 3) */}
                                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/90 space-y-1 text-[10px]">
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="font-bold text-slate-800 flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                            <span>Status Wawancara:</span>
                                          </span>
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${ivInfo.badgeClass}`}>
                                            {ivInfo.stepLabel}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between text-slate-700 font-semibold pt-0.5">
                                          <span className="truncate text-slate-900">{ivInfo.title}</span>
                                          <span className="font-mono text-indigo-700 font-bold shrink-0 ml-1">Langkah {ivInfo.step}/3</span>
                                        </div>

                                        {/* Progress Bar Micro */}
                                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-0.5">
                                          <div
                                            className={`h-full transition-all duration-300 ${
                                              ivInfo.step === 3
                                                ? 'bg-emerald-500'
                                                : ivInfo.step === 2
                                                ? 'bg-indigo-600'
                                                : 'bg-amber-500'
                                            }`}
                                            style={{ width: ivInfo.progressBarWidth }}
                                          />
                                        </div>

                                        <div className="text-[9px] text-slate-500 leading-tight pt-0.5">
                                          {ivInfo.detail}
                                        </div>
                                      </div>

                                      {/* Tombol Aksi: Kelola & Proses Wawancara */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenInterviewModal(candidate)}
                                        className="w-full py-1.5 px-2 text-[11px] font-bold bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                                        title="Buka proses wawancara 3 tahap: Jadwal & Panel, Input Nilai per User, dan Formula Pembobotan Objektif"
                                      >
                                        <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                        <span>Kelola & Proses Wawancara</span>
                                      </button>

                                      <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setConfirmRevertToScreeningCandidate(candidate)}
                                          className="w-full py-1 px-1 text-[10px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded flex items-center justify-center gap-1 transition-colors shadow-2xs truncate"
                                          title="Kembalikan proses pelamar ke tahap Applied"
                                        >
                                          <Undo2 className="w-3 h-3 text-amber-600 shrink-0" />
                                          <span className="truncate">Ke Applied</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenInterviewModal(candidate)}
                                          className="w-full py-1 px-1 text-[10px] font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded flex items-center justify-center gap-1 transition-colors shadow-2xs truncate"
                                          title="Buka Scorecard Wawancara"
                                        >
                                          <Star className="w-3 h-3 text-amber-400 shrink-0" />
                                          <span className="truncate">Scorecard →</span>
                                        </button>
                                      </div>

                                      {passed ? (
                                        <div className="space-y-1">
                                          <button
                                            onClick={() => {
                                              updateCandidateStage(candidate.id, 'Medical Check-Up', {
                                                mcuStatus: candidate.mcuStatus || 'Dijadwalkan',
                                                mcuDate: candidate.mcuDate || new Date().toISOString().split('T')[0],
                                              });
                                              setToastFeedback(`Kandidat ${candidate.name} diloloskan ke tahap Medical Check-Up!`);
                                            }}
                                            className="w-full py-1.5 text-[10px] font-bold bg-teal-600 hover:bg-teal-700 text-white rounded text-center flex items-center justify-center gap-1 shadow-2xs transition-colors"
                                            title="Lolos wawancara. Loloskan kandidat ke tahap Medical Check-Up (MCU)."
                                          >
                                            <HeartPulse className="w-3 h-3 shrink-0" />
                                            <span>Lolos ke Medical Check-Up →</span>
                                          </button>
                                          <button
                                            onClick={() => handlePromoteToOffering(candidate)}
                                            className="w-full py-1 text-[9px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-center transition-colors"
                                            title="Lewati MCU dan langsung terbitkan Offering Letter"
                                          >
                                            Langsung ke Offering (Skip MCU)
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setOfferingGateCandidate(candidate)}
                                          className="w-full py-1.5 text-[10px] font-semibold bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-800 border border-slate-200 hover:border-amber-300 rounded text-center flex items-center justify-center gap-1 transition-colors group/btn"
                                          title={`Offering / MCU Terkunci: ${statusInfo.statusLabel}. Klik untuk detail validasi SOP.`}
                                        >
                                          <Lock className="w-3 h-3 text-slate-400 group-hover/btn:text-amber-600 shrink-0" />
                                          <span>Terkunci (Belum Lolos Interview)</span>
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}

                                {stg.stage === 'Medical Check-Up' && (() => {
                                  const isMcuFit = candidate.mcuStatus === 'Fit (Lolos)' || candidate.mcuStatus === 'Fit with Note';
                                  return (
                                    <>
                                      <button
                                        onClick={() => handleOpenMcuModal(candidate)}
                                        className="w-full py-1 text-[11px] font-semibold bg-teal-50 text-teal-800 hover:bg-teal-100 rounded flex items-center justify-center gap-1 transition-colors"
                                      >
                                        <HeartPulse className="w-3 h-3 text-teal-600" />
                                        <span>Update Hasil MCU / Lab</span>
                                      </button>
                                      {isMcuFit ? (
                                        <button
                                          onClick={() => handlePromoteToOffering(candidate)}
                                          className="w-full py-1.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded text-center flex items-center justify-center gap-1 shadow-2xs transition-colors"
                                          title="Kandidat dinyatakan Fit to Work. Lanjut ke pembuatan Offering Letter."
                                        >
                                          <CheckCircle className="w-3 h-3 shrink-0" />
                                          <span>Lanjut ke Tahap Offering →</span>
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleOpenMcuModal(candidate)}
                                          className="w-full py-1.5 text-[10px] font-semibold bg-slate-100 hover:bg-teal-50 text-slate-500 hover:text-teal-800 border border-slate-200 hover:border-teal-300 rounded text-center flex items-center justify-center gap-1 transition-colors"
                                          title={`Status MCU: ${candidate.mcuStatus || 'Dijadwalkan'}. Klik untuk input hasil tes.`}
                                        >
                                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span>Status: {candidate.mcuStatus || 'Menunggu Hasil Lab'}</span>
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
                        {c.stage === 'Medical Check-Up' && `MCU: ${c.mcuStatus || 'Dijadwalkan'}`}
                        {(c.stage === 'Incoming' || c.stage === 'Applied') && 'Resume Parsed'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (c.stage === 'Medical Check-Up') handleOpenMcuModal(c);
                            else if (c.stage === 'Interview') handlePromoteToOffering(c);
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

      {/* ===================== MODAL RETRACT / CABUT PERSETUJUAN FPTK ===================== */}
      {retractModalFptk && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRetractModalFptk(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-gradient-to-r from-amber-900 via-amber-800 to-slate-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Undo2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Cabut / Retract Pengajuan FPTK
                  </h3>
                  <p className="text-[11px] text-amber-200">
                    Membatalkan FPTK yang sudah berstatus Disetujui
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRetractModalFptk(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 text-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{retractModalFptk.position}</span>
                  <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-amber-200">
                    {retractModalFptk.reqNumber}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Departemen: <span className="font-medium text-slate-800">{retractModalFptk.department}</span> • Formasi: {retractModalFptk.headcount} Orang
                </div>
                <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                  ⚠️ Perhatian: Mencabut FPTK ini akan mengubah statusnya menjadi <strong>Dicabut (Retracted)</strong> dan secara otomatis menutup publikasi lowongan aktif yang terhubung dengan formasi ini.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Alasan Pencabutan (Retract Reason) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={retractReason}
                  onChange={(e) => setRetractReason(e.target.value)}
                  placeholder="Contoh: Perubahan strategi alokasi headcount departemen Q4 / Penundaan pembukaan formasi..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-amber-500 resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRetractModalFptk(null)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRetract}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Konfirmasi Cabut FPTK</span>
              </button>
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

      {/* ===================== MODAL 3: DOKUMEN BERKAS CV & PROFIL PELAMAR ===================== */}
      {isResumeParserModalOpen && activeCandidate && (() => {
        const eduText = activeCandidate.parsedData?.education || 'S1 Teknik Informatika';
        const matchEdu = eduText.trim().match(/^(S1|S2|S3|D3|D4|SMA|SMK)\s+(.+)$/i);
        const degreeLevel = matchEdu
          ? matchEdu[1].toUpperCase() === 'S1'
            ? 'S1 (Sarjana)'
            : matchEdu[1].toUpperCase() === 'S2'
            ? 'S2 (Magister)'
            : matchEdu[1].toUpperCase() === 'S3'
            ? 'S3 (Doktor)'
            : matchEdu[1].toUpperCase() === 'D3'
            ? 'D3 (Diploma 3)'
            : matchEdu[1].toUpperCase() === 'D4'
            ? 'D4 (Sarjana Terapan)'
            : matchEdu[1]
          : 'S1 (Sarjana)';
        const educationMajor = matchEdu ? matchEdu[2] : eduText;
        const cvCandidateName = activeCandidate.parsedData?.fullName || activeCandidate.name;
        const isNameMatched = activeCandidate.name.trim().toLowerCase() === cvCandidateName.trim().toLowerCase();

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsResumeParserModalOpen(false);
            }}
          >
            <div
              className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden my-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Rincian Profil & Hasil Screening Kualifikasi</span>
                  </h3>
                  <span className="text-xs text-slate-400">Tahap Applied: Profiling Dokumen CV, Kesesuaian Kualifikasi, Keyword Matching & Evaluasi Manual</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResumeParserModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
                {/* Indikator Status & Persentase Hasil Parsing CV */}
                {(() => {
                  const pResult = getCandidateParsingResult(activeCandidate);
                  const isParsingDoubtful = pResult.score < 50;

                  return (
                    <div className="space-y-3">
                      <div className={`p-3.5 rounded-xl border ${pResult.bgClass} space-y-2.5`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${pResult.badgeClass}`}>
                              {pResult.score}%
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 text-xs block truncate">
                                Status Ekstraksi Profil: {pResult.label}
                              </span>
                              <span className="text-[10.5px] text-slate-600 block">
                                {pResult.note}
                              </span>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${pResult.badgeClass}`}>
                            {pResult.score >= 90 ? 'Parsing Sempurna (100%)' : pResult.score >= 50 ? 'Parsing Sebagian' : 'Minim Data / Butuh Input'}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${pResult.barClass}`}
                            style={{ width: `${pResult.score}%` }}
                          />
                        </div>
                      </div>

                      {/* Alert Keraguan Sistem (Jika Parsing Gagal / Minim Data < 50%) */}
                      {isParsingDoubtful ? (
                        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                              <AlertTriangle className="w-4 h-4 text-amber-700" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-amber-950 text-xs">Peringatan: Sistem Ragu & Ekstraksi Teks CV Terkendala</h4>
                              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                                Berkas pelamar terdeteksi sebagai scan gambar atau teks minim konten ({pResult.score}%), sehingga perhitungan kecocokan kualifikasi & kata kunci sistem tidak dapat dipastikan akurasinya. <strong>Sistem wajib menyarankan Anda melakukan screening manual dan menginputkan hasil screening secara manual.</strong>
                              </p>
                            </div>
                          </div>
                          {!isManualScreeningMode && (
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => setIsManualScreeningMode(true)}
                                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Input Hasil Screening Manual Sekarang</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                          <div className="text-[11px] text-slate-600">
                            <span className="font-semibold text-slate-800">Antisipasi Pemetaan Data:</span> Apabila sistem mengekstrak sukses namun salah memetakan data entitas, Anda dapat mengoreksi secara manual.
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsManualScreeningMode(!isManualScreeningMode)}
                            className="px-3 py-1 bg-white hover:bg-slate-100 text-blue-700 border border-blue-300 rounded text-[11px] font-semibold shrink-0 shadow-2xs transition-colors flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>{isManualScreeningMode ? 'Kembali ke Preview' : 'Koreksi Screening Manual'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* File & Source Info dengan Tombol Preview & Download */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-slate-500 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{activeCandidate.cvFileName || 'CV_Pelamar.pdf'}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({activeCandidate.cvFileSize || '1.2 MB'})</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPreviewCvCandidate(activeCandidate)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold shadow-2xs transition-colors"
                      title="Buka Lembar Pratinjau Dokumen CV"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Preview CV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadCv(activeCandidate)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold shadow-2xs transition-colors"
                      title="Unduh File Berkas CV"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Download</span>
                    </button>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <span className="text-slate-500 hidden sm:inline">Sumber:</span>
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

                {/* KONDISI 1: FORM INPUT / KOREKSI SCREENING MANUAL */}
                {isManualScreeningMode ? (
                  <div className="p-4 bg-slate-50 border border-blue-200 rounded-xl space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Pencil className="w-3.5 h-3.5 text-blue-600" />
                          <span>Form Input & Koreksi Hasil Screening Manual</span>
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Silakan atur skor kualifikasi, matched keywords, dan koreksi data kandidat secara manual.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsManualScreeningMode(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                      >
                        Batal
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Skor Kesesuaian Kualifikasi: <span className="font-mono font-bold text-blue-700">{manualMatchScore}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={manualMatchScore}
                          onChange={(e) => setManualMatchScore(Number(e.target.value))}
                          className="w-full accent-blue-600"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Status Keputusan Screening:</label>
                        <select
                          value={manualScreeningStatus}
                          onChange={(e) => setManualScreeningStatus(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-xs text-slate-800"
                        >
                          <option value="Lolos Kualifikasi">Lolos Kualifikasi (Direkomendasikan)</option>
                          <option value="Dipertimbangkan">Dipertimbangkan (Perlu Tes Lanjutan)</option>
                          <option value="Tidak Memenuhi">Tidak Memenuhi Syarat</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">
                          Kata Kunci yang Cocok (Matched Keywords) <span className="text-slate-400 font-normal">(Pisahkan dengan koma)</span>:
                        </label>
                        <input
                          type="text"
                          value={manualMatchedKeywords}
                          onChange={(e) => setManualMatchedKeywords(e.target.value)}
                          placeholder="Contoh: Kubernetes, Docker, 4+ thn exp, AWS, Linux"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">
                          Kriteria Belum Terpenuhi (Missing Keywords) <span className="text-slate-400 font-normal">(Pisahkan dengan koma)</span>:
                        </label>
                        <input
                          type="text"
                          value={manualMissingKeywords}
                          onChange={(e) => setManualMissingKeywords(e.target.value)}
                          placeholder="Contoh: Sertifikasi CKA/CKS, Pengalaman Tim >5 Orang"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Catatan Evaluasi Screening HR:</label>
                        <textarea
                          rows={2}
                          value={manualScreeningNotes}
                          onChange={(e) => setManualScreeningNotes(e.target.value)}
                          placeholder="Tuliskan catatan hasil pemeriksaan manual berkas pelamar..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>

                      {/* Sub-Section Koreksi Data Profil Pelamar (Mapping Correction) */}
                      <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-800 block text-xs mb-2">
                          Koreksi Pemetaan Data Pelamar (Jika Sistem Salah Mapping Data):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10.5px] text-slate-600 block mb-0.5">Nama Lengkap Pelamar:</label>
                            <input
                              type="text"
                              value={manualCandidateName}
                              onChange={(e) => setManualCandidateName(e.target.value)}
                              className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10.5px] text-slate-600 block mb-0.5">Perusahaan Terakhir:</label>
                            <input
                              type="text"
                              value={manualLastCompany}
                              onChange={(e) => setManualLastCompany(e.target.value)}
                              className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10.5px] text-slate-600 block mb-0.5">Jenjang Pendidikan & Jurusan:</label>
                            <div className="grid grid-cols-3 gap-1.5">
                              <select
                                value={manualDegree}
                                onChange={(e) => setManualDegree(e.target.value)}
                                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                              >
                                <option value="S1">S1</option>
                                <option value="S2">S2</option>
                                <option value="S3">S3</option>
                                <option value="D3">D3</option>
                                <option value="D4">D4</option>
                                <option value="SMA">SMA</option>
                                <option value="SMK">SMK</option>
                              </select>
                              <input
                                type="text"
                                value={manualMajor}
                                onChange={(e) => setManualMajor(e.target.value)}
                                placeholder="Jurusan"
                                className="col-span-2 px-2.5 py-1 bg-white border border-slate-300 rounded text-xs"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10.5px] text-slate-600 block mb-0.5">Total Pengalaman (Tahun):</label>
                            <input
                              type="number"
                              min="0"
                              max="40"
                              value={manualExpYears}
                              onChange={(e) => setManualExpYears(Number(e.target.value))}
                              className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-[10.5px] text-slate-600 block mb-0.5">Keahlian dan Skill (Pisahkan dengan koma):</label>
                            <input
                              type="text"
                              value={manualSkills}
                              onChange={(e) => setManualSkills(e.target.value)}
                              className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setIsManualScreeningMode(false)}
                        className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveManualScreening}
                        className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Simpan Hasil Screening Manual</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // KONDISI 2: TAMPILAN TINJAUAN GABUNGAN (SCREENING KUALIFIKASI + PROFILING CV)
                  <div className="space-y-4">
                    {/* SECTION A: HASIL SCREENING KUALIFIKASI & KEYWORD MATCH */}
                    <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-sky-200/60">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-sky-600" />
                          <h4 className="font-bold text-sky-950 text-xs">Hasil Screening Kualifikasi & Keyword Match</h4>
                        </div>
                        <span className="text-base font-bold font-mono px-2 py-0.5 rounded bg-white text-sky-900 border border-sky-300 shadow-2xs">
                          {activeCandidate.aiMatchScore || 85}% Match
                        </span>
                      </div>

                      <div className="space-y-2">
                        <span className="font-semibold text-slate-700 block text-[11px]">
                          Kata Kunci yang Cocok (Matched Keywords):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(activeCandidate.matchedKeywords && activeCandidate.matchedKeywords.length > 0
                            ? activeCandidate.matchedKeywords
                            : ['Kubernetes', 'Docker', 'AWS', 'Linux']
                          ).map((kw, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>{kw}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="font-semibold text-slate-700 block text-[11px]">
                          Kriteria Belum Terdeteksi (Missing Keywords):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(activeCandidate.missingKeywords && activeCandidate.missingKeywords.length > 0
                            ? activeCandidate.missingKeywords
                            : ['Sertifikasi CKA/CKS']
                          ).map((kw, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-2.5 bg-white/90 rounded-lg border border-sky-100 space-y-0.5">
                        <span className="font-semibold text-slate-800 block text-[11px]">Catatan Screening:</span>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          {activeCandidate.screeningNotes || 'Kualifikasi pengalaman dan keahlian kandidat sangat memenuhi kriteria posisi lowongan.'}
                        </p>
                      </div>
                    </div>

                    {/* SECTION B: RINCIAN PROFILING HASIL EKSTRAKSI CV */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Rincian Profil Pelamar (Simple Profiling)</span>
                      </h4>

                      {/* 1. NAMA LENGKAP INPUT DAN NAMA LENGKAP DI CV */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nama Lengkap Input</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-slate-200 text-slate-700">Form Input</span>
                          </div>
                          <div className="font-bold text-slate-900 text-xs sm:text-[13px]">{activeCandidate.name}</div>
                        </div>

                        <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-200 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Nama Lengkap di CV</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5 ${isNameMatched ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              <Check className="w-2.5 h-2.5" />
                              <span>{isNameMatched ? 'Sesuai / Valid' : 'Variasi Nama'}</span>
                            </span>
                          </div>
                          <div className="font-bold text-blue-950 text-xs sm:text-[13px]">{cvCandidateName}</div>
                        </div>
                      </div>

                      {/* 2. PERUSAHAAN TERAKHIR */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                          <span className="text-[10px] text-slate-400 block font-medium">Perusahaan Terakhir</span>
                          <div className="font-bold text-slate-900 text-xs">
                            {activeCandidate.lastCompany || activeCandidate.parsedData?.currentCompany || 'Belum diisi'}
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                          <span className="text-[10px] text-slate-400 block font-medium">Jabatan & Pengalaman</span>
                          <div className="font-bold text-slate-900 text-xs">
                            {activeCandidate.parsedData?.currentTitle || 'Professional Specialist'} •{' '}
                            <span className="font-medium text-slate-600">{activeCandidate.parsedData?.totalExperienceYears || 3} Thn Pengalaman</span>
                          </div>
                        </div>
                      </div>

                      {/* 3. KONTAK EMAIL & NO TELEPON */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                          <span className="text-[10px] text-slate-400 block font-medium">Kontak Email</span>
                          <div className="font-mono text-slate-800 text-xs font-semibold truncate" title={activeCandidate.email}>
                            {activeCandidate.email}
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                          <span className="text-[10px] text-slate-400 block font-medium">Nomor Telepon / WhatsApp</span>
                          <div className="font-mono text-slate-800 text-xs font-semibold">
                            {activeCandidate.phone}
                          </div>
                        </div>
                      </div>

                      {/* 4. TINGKAT PENDIDIKAN TERAKHIR & JURUSAN */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                          <span className="text-[10px] text-slate-400 block font-medium">Tingkat Pendidikan Terakhir</span>
                          <div className="font-bold text-slate-900 text-xs">
                            {degreeLevel}
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                          <span className="text-[10px] text-slate-400 block font-medium">Jurusan & Perguruan Tinggi</span>
                          <div className="font-bold text-slate-900 text-xs">
                            {educationMajor}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {activeCandidate.parsedData?.university || 'Perguruan Tinggi Terakreditasi'}
                          </div>
                        </div>
                      </div>

                      {/* 5. KEAHLIAN DAN SKILL */}
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-700 block">Keahlian dan Skill Pelamar:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(activeCandidate.parsedData?.topSkills || ['Problem Solving', 'Komunikasi Efektif', 'Analisis Data', 'Kerja Tim']).map(
                            (skill, idx) => (
                              <span key={idx} className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md font-medium">
                                {skill}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Footer: Shortlist, Talent Pool, dan Tolak Sesuai Permintaan */}
                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsResumeParserModalOpen(false)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                    >
                      Tutup
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResumeParserModalOpen(false);
                        handleOpenTalentPoolModal(activeCandidate);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                      title="Pindahkan pelamar ke Talent Pool"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Masukan Talent Pool</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResumeParserModalOpen(false);
                        handleOpenRejectModal(activeCandidate);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                      title="Tolak pelamar dan kirim pesan penolakan resmi"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Tolak Pelamar</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResumeParserModalOpen(false);
                        setConfirmAssessmentCandidate(activeCandidate);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                      title="Shortlist kandidat ke tahap Tes Kompetensi (Asesmen)"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Ke Assessment</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResumeParserModalOpen(false);
                        setConfirmInterviewCandidate(activeCandidate);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                      title="Langsung Shortlist kandidat ke tahap Wawancara (User)"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Ke Interview</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================== MODAL KONFIRMASI: PINDAHKAN PROSES KE SCREENING ===================== */}
      {confirmScreeningCandidate && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmScreeningCandidate(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-800 shrink-0 shadow-2xs">
                  <ArrowRight className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-950">Konfirmasi Pindahkan Proses ke Screening</h3>
                  <span className="text-[11px] text-blue-800">Pemindahan berkas ke tahap evaluasi screening kualifikasi</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmScreeningCandidate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin memindahkan proses pelamar berikut dari antrean <span className="font-semibold text-slate-800">Incoming</span> ke tahap <span className="font-semibold text-blue-700">Screening Kualifikasi</span>?
              </p>

              {/* Ringkasan Profil Pelamar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Nama Pelamar:</span>
                  <span className="font-bold text-slate-900 text-xs">{confirmScreeningCandidate.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Posisi Dilamar:</span>
                  <span className="font-semibold text-blue-800 text-[11px]">
                    {vacancies.find((v) => v.id === confirmScreeningCandidate.jobVacancyId)?.title || 'Posisi Lowongan'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Perusahaan Terakhir:</span>
                  <span className="font-medium text-slate-800 text-[11px]">{confirmScreeningCandidate.lastCompany}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Dokumen Terlampir:</span>
                  <span className="font-mono text-slate-700 text-[11px] truncate max-w-[180px]">{confirmScreeningCandidate.cvFileName || 'CV_Pelamar.pdf'}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Pelamar akan dipindahkan ke kolom Screening untuk evaluasi kualifikasi dan kesesuaian syarat lowongan.</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmScreeningCandidate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateCandidateStage(confirmScreeningCandidate.id, 'Screening');
                    setToastFeedback(`Proses pelamar '${confirmScreeningCandidate.name}' berhasil dipindahkan ke tahap Screening!`);
                    setConfirmScreeningCandidate(null);
                    setIsResumeParserModalOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Ya, Pindahkan ke Screening</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL KONFIRMASI: KEMBALIKAN KE INCOMING ===================== */}
      {confirmRevertToIncomingCandidate && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmRevertToIncomingCandidate(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 shadow-2xs">
                  <Undo2 className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">Kembalikan Proses ke Incoming</h3>
                  <span className="text-[11px] text-amber-800">Pengembalian status berkas pelamar</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmRevertToIncomingCandidate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin mengembalikan pelamar berikut dari tahap <span className="font-semibold text-slate-800">Screening Kualifikasi</span> kembali ke antrean <span className="font-semibold text-blue-700">Incoming</span>?
              </p>

              {/* Ringkasan Profil Pelamar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Nama Pelamar:</span>
                  <span className="font-bold text-slate-900 text-xs">{confirmRevertToIncomingCandidate.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Posisi Dilamar:</span>
                  <span className="font-semibold text-blue-800 text-[11px]">
                    {vacancies.find((v) => v.id === confirmRevertToIncomingCandidate.jobVacancyId)?.title || 'Posisi Lowongan'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Perusahaan Terakhir:</span>
                  <span className="font-medium text-slate-800 text-[11px]">{confirmRevertToIncomingCandidate.lastCompany}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Berkas Dokumen:</span>
                  <span className="font-mono text-slate-700 text-[11px] truncate max-w-[180px]">{confirmRevertToIncomingCandidate.cvFileName || 'CV_Pelamar.pdf'}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Pelamar akan dikembalikan ke antrean berkas masuk (Incoming) untuk ditinjau ulang dokumen CV-nya.</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmRevertToIncomingCandidate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateCandidateStage(confirmRevertToIncomingCandidate.id, 'Incoming');
                    setToastFeedback(`Proses pelamar '${confirmRevertToIncomingCandidate.name}' berhasil dikembalikan ke antrean Incoming.`);
                    setConfirmRevertToIncomingCandidate(null);
                    setIsScreeningModalOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Ya, Kembalikan ke Incoming</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL KONFIRMASI: SHORTLIST KE TES KOMPETENSI (ASSESSMENT) ===================== */}
      {confirmAssessmentCandidate && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmAssessmentCandidate(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-800 shrink-0 shadow-2xs">
                  <Award className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-950">Shortlist ke Tes Kompetensi (Assessment)</h3>
                  <span className="text-[11px] text-blue-800">Tahap 3: Penugasan dan evaluasi tes teknis / psikotes</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmAssessmentCandidate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin memindahkan pelamar berikut ke tahap <span className="font-semibold text-blue-800">Tes Kompetensi (Assessment)</span>?
              </p>

              {/* Ringkasan Profil Pelamar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Nama Pelamar:</span>
                  <span className="font-bold text-slate-900 text-xs">{confirmAssessmentCandidate.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Posisi Dilamar:</span>
                  <span className="font-semibold text-blue-800 text-[11px]">
                    {vacancies.find((v) => v.id === confirmAssessmentCandidate.jobVacancyId)?.title || 'Posisi Lowongan'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Perusahaan Terakhir:</span>
                  <span className="font-medium text-slate-800 text-[11px]">{confirmAssessmentCandidate.lastCompany}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Kesesuaian Kualifikasi:</span>
                  <span className="font-mono font-bold text-sky-800 text-[11px] bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                    {confirmAssessmentCandidate.aiMatchScore || 88}% Match
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Kandidat akan dipindahkan ke kolom Assessment untuk penugasan tes kemampuan, psikotes, atau studi kasus divisi.</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmAssessmentCandidate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateCandidateStage(confirmAssessmentCandidate.id, 'Assessment');
                    setToastFeedback(`Pelamar '${confirmAssessmentCandidate.name}' berhasil dishortlist ke tahap Tes Kompetensi.`);
                    setConfirmAssessmentCandidate(null);
                    setIsScreeningModalOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Ya, Pindahkan ke Tes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL KONFIRMASI: SHORTLIST LANGSUNG KE WAWANCARA / INTERVIEW ===================== */}
      {confirmInterviewCandidate && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmInterviewCandidate(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-800 shrink-0 shadow-2xs">
                  <Video className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-indigo-950">Langsung ke Wawancara / Interview (User)</h3>
                  <span className="text-[11px] text-indigo-800">Tahap 4: Bypass tes dan langsung jadwalkan interview</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmInterviewCandidate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin memindahkan pelamar berikut <span className="font-semibold text-indigo-900">langsung ke tahap Wawancara / Interview (User)</span> tanpa melalui tes kompetensi?
              </p>

              {/* Ringkasan Profil Pelamar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Nama Pelamar:</span>
                  <span className="font-bold text-slate-900 text-xs">{confirmInterviewCandidate.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Posisi Dilamar:</span>
                  <span className="font-semibold text-blue-800 text-[11px]">
                    {vacancies.find((v) => v.id === confirmInterviewCandidate.jobVacancyId)?.title || 'Posisi Lowongan'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Perusahaan Terakhir:</span>
                  <span className="font-medium text-slate-800 text-[11px]">{confirmInterviewCandidate.lastCompany}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Kesesuaian Kualifikasi:</span>
                  <span className="font-mono font-bold text-sky-800 text-[11px] bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                    {confirmInterviewCandidate.aiMatchScore || 88}% Match
                  </span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-lg text-[11px] text-indigo-900 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>Kandidat akan langsung masuk antrean Wawancara untuk penetapan pewawancara, jadwal sesi, dan pengisian scorecard user.</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmInterviewCandidate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateCandidateStage(confirmInterviewCandidate.id, 'Interview');
                    setToastFeedback(`Pelamar '${confirmInterviewCandidate.name}' berhasil dishortlist langsung ke tahap Wawancara (User).`);
                    setConfirmInterviewCandidate(null);
                    setIsScreeningModalOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Ya, Langsung ke Wawancara</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL KONFIRMASI: MASUKKAN KE TALENT POOL ===================== */}
      {confirmTalentPoolCandidate && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmTalentPoolCandidate(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 shadow-2xs">
                  <FolderPlus className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">Masukan ke Talent Pool</h3>
                  <span className="text-[11px] text-amber-800">Simpan profil kandidat untuk kebutuhan formasi mendatang</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmTalentPoolCandidate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin memindahkan pelamar berikut ke <span className="font-semibold text-amber-900">Talent Pool</span>? Profil pelamar akan disimpan untuk diprioritaskan pada lowongan berikutnya.
              </p>

              {/* Ringkasan Profil Pelamar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Nama Pelamar:</span>
                  <span className="font-bold text-slate-900 text-xs">{confirmTalentPoolCandidate.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Posisi Saat Ini:</span>
                  <span className="font-semibold text-blue-800 text-[11px]">
                    {vacancies.find((v) => v.id === confirmTalentPoolCandidate.jobVacancyId)?.title || 'Posisi Lowongan'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Perusahaan Terakhir:</span>
                  <span className="font-medium text-slate-800 text-[11px]">{confirmTalentPoolCandidate.lastCompany}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kategori / Kualifikasi Talent Pool:</label>
                <input
                  type="text"
                  value={talentPoolCategoryInput}
                  onChange={(e) => setTalentPoolCategoryInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  placeholder="Contoh: Cloud Architecture / Operations"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan / Alasan Penyimpanan:</label>
                <textarea
                  rows={2}
                  value={talentPoolReasonInput}
                  onChange={(e) => setTalentPoolReasonInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  placeholder="Tuliskan catatan evaluasi kandidat..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmTalentPoolCandidate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateCandidateStage(confirmTalentPoolCandidate.id, 'TalentPool', {
                      disqualificationReason: talentPoolReasonInput,
                      talentPoolCategory: talentPoolCategoryInput,
                    });
                    setToastFeedback(`Pelamar '${confirmTalentPoolCandidate.name}' berhasil dipindahkan ke Talent Pool.`);
                    setConfirmTalentPoolCandidate(null);
                    setIsResumeParserModalOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Simpan ke Talent Pool</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL KONFIRMASI: TOLAK PELAMAR & KIRIM PESAN PENOLAKAN ===================== */}
      {confirmRejectCandidate && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmRejectCandidate(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-rose-50 border-b border-rose-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-800 shrink-0 shadow-2xs">
                  <UserX className="w-5 h-5 text-rose-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">Konfirmasi Penolakan Pelamar</h3>
                  <span className="text-[11px] text-rose-800">Wajib mengirimkan pesan penolakan resmi kepada pelamar</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmRejectCandidate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Ringkasan Profil Pelamar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Nama Pelamar:</span>
                  <span className="font-bold text-slate-900 text-xs">{confirmRejectCandidate.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Email Pelamar:</span>
                  <span className="font-mono text-blue-700 text-xs">{confirmRejectCandidate.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Posisi Dilamar:</span>
                  <span className="font-semibold text-slate-800 text-[11px]">
                    {vacancies.find((v) => v.id === confirmRejectCandidate.jobVacancyId)?.title || 'Posisi Lowongan'}
                  </span>
                </div>
              </div>

              {/* Alert Wajib Kirim Pesan */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2">
                <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Pemberitahuan Otomatis ke Pelamar (Wajib):</span>
                  <span>Sistem mewajibkan HR mengirimkan pesan penolakan yang sopan & profesional agar kandidat mendapatkan kepastian status lamarannya.</span>
                </div>
              </div>

              {/* Pilihan Kanal Notifikasi */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kanal Pengiriman Pesan:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Email', 'WhatsApp', 'Keduanya'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setRejectionChannelInput(ch)}
                      className={`py-1.5 px-2 rounded-lg font-semibold text-xs border transition-colors ${
                        rejectionChannelInput === ch
                          ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {ch === 'Email' ? '📧 Email Resmi' : ch === 'WhatsApp' ? '💬 WhatsApp' : '📧 & 💬 Keduanya'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subjek Pesan */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subjek Pesan / Email:</label>
                <input
                  type="text"
                  value={rejectionSubjectInput}
                  onChange={(e) => setRejectionSubjectInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>

              {/* Isi Pesan Penolakan */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 block">Isi Pesan Penolakan Resmi (Dapat Diedit):</label>
                  <span className="text-[10px] text-slate-400">Template Formal & Apresiatif</span>
                </div>
                <textarea
                  rows={6}
                  value={rejectionMessageInput}
                  onChange={(e) => setRejectionMessageInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed font-sans text-slate-800 bg-white"
                  placeholder="Tuliskan pesan penolakan resmi..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setConfirmRejectCandidate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateCandidateStage(confirmRejectCandidate.id, 'Rejected', {
                      disqualificationReason: rejectionSubjectInput,
                      screeningNotes: `Ditolak pada tahap seleksi awal. Pesan terkirim via ${rejectionChannelInput}: "${rejectionSubjectInput}"`,
                    });
                    setToastFeedback(
                      `Pesan penolakan berhasil dikirim ke '${confirmRejectCandidate.name}' via ${rejectionChannelInput} dan status pelamar diubah menjadi Ditolak.`
                    );
                    setConfirmRejectCandidate(null);
                    setIsResumeParserModalOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Pesan Penolakan & Tolak Pelamar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL KONFIRMASI: KEMBALIKAN KE TAHAP APPLIED ===================== */}
      {confirmRevertToScreeningCandidate && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmRevertToScreeningCandidate(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 shadow-2xs">
                  <Undo2 className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">Kembalikan ke Tahap Applied</h3>
                  <span className="text-[11px] text-amber-800">Pengembalian status proses pelamar ke evaluasi kualifikasi & profiling</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmRevertToScreeningCandidate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin mengembalikan pelamar berikut dari tahap <span className="font-semibold text-slate-800">{confirmRevertToScreeningCandidate.stage === 'Assessment' ? 'Tes Kompetensi (Assessment)' : 'Wawancara (Interview)'}</span> kembali ke tahap <span className="font-semibold text-blue-700">Applied (Screening & Profiling)</span>?
              </p>

              {/* Ringkasan Profil Pelamar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Nama Pelamar:</span>
                  <span className="font-bold text-slate-900 text-xs">{confirmRevertToScreeningCandidate.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Posisi Dilamar:</span>
                  <span className="font-semibold text-blue-800 text-[11px]">
                    {vacancies.find((v) => v.id === confirmRevertToScreeningCandidate.jobVacancyId)?.title || 'Posisi Lowongan'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Tahap Saat Ini:</span>
                  <span className="font-semibold text-amber-800 text-[11px]">
                    {confirmRevertToScreeningCandidate.stage === 'Assessment' ? 'Assessment (Tes Kompetensi)' : 'Wawancara / Interview'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Perusahaan Terakhir:</span>
                  <span className="font-medium text-slate-800 text-[11px]">{confirmRevertToScreeningCandidate.lastCompany}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Pelamar akan dikembalikan ke tahap Applied untuk ditinjau ulang kualifikasi dan profilingnya sebelum ditentukan opsi shortlist berikutnya.</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmRevertToScreeningCandidate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateCandidateStage(confirmRevertToScreeningCandidate.id, 'Applied');
                    setToastFeedback(`Proses pelamar '${confirmRevertToScreeningCandidate.name}' berhasil dikembalikan ke tahap Applied.`);
                    setConfirmRevertToScreeningCandidate(null);
                    setIsAssessmentModalOpen(false);
                    setIsInterviewModalOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Ya, Kembalikan ke Applied</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL PRATINJAU DOKUMEN CV (CV VIEWER) ===================== */}
      {previewCvCandidate && (() => {
        const vacTitle = vacancies.find((v) => v.id === previewCvCandidate.jobVacancyId)?.title || 'Posisi Lowongan';
        const eduText = previewCvCandidate.parsedData?.education || 'S1 Teknik Informatika';
        const matchEdu = eduText.trim().match(/^(S1|S2|S3|D3|D4|SMA|SMK)\s+(.+)$/i);
        const degreeLevel = matchEdu
          ? matchEdu[1].toUpperCase() === 'S1'
            ? 'S1 (Sarjana)'
            : matchEdu[1].toUpperCase() === 'S2'
            ? 'S2 (Magister)'
            : matchEdu[1].toUpperCase() === 'S3'
            ? 'S3 (Doktor)'
            : matchEdu[1].toUpperCase() === 'D3'
            ? 'D3 (Diploma 3)'
            : matchEdu[1].toUpperCase() === 'D4'
            ? 'D4 (Sarjana Terapan)'
            : matchEdu[1]
          : 'S1 (Sarjana)';
        const educationMajor = matchEdu ? matchEdu[2] : eduText;

        return (
          <div
            className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewCvCandidate(null);
            }}
          >
            <div
              className="bg-slate-100 rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-300 overflow-hidden my-4 flex flex-col max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Viewer Bar */}
              <div className="px-5 py-3.5 bg-slate-950 text-white flex items-center justify-between shrink-0 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold truncate flex items-center gap-2">
                      <span>Pratinjau Dokumen CV: {previewCvCandidate.name}</span>
                    </h3>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono truncate">
                      <span>{previewCvCandidate.cvFileName || 'CV_Pelamar.pdf'}</span>
                      <span>•</span>
                      <span>{previewCvCandidate.cvFileSize || '1.2 MB'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownloadCv(previewCvCandidate)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    title="Unduh Berkas CV ini"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                    title="Cetak Dokumen"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cetak</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewCvCandidate(null)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
                    title="Tutup Pratinjau"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Document Paper Body (Simulasi Lembar Dokumen CV Resmi) */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-200/80">
                <div className="bg-white rounded-xl shadow-md border border-slate-300 p-6 sm:p-10 max-w-2xl mx-auto space-y-6 text-slate-800 font-sans">
                  {/* Top Paper Header: Nama & Posisi */}
                  <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-blue-700 font-mono">
                        CURRICULUM VITAE / BERKAS PELAMAR
                      </div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                        {previewCvCandidate.parsedData?.fullName || previewCvCandidate.name}
                      </h1>
                      <div className="text-xs sm:text-sm font-semibold text-slate-600">
                        {previewCvCandidate.parsedData?.currentTitle || vacTitle}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200 sm:text-right shrink-0">
                      <div><span className="font-semibold text-slate-800">Email:</span> {previewCvCandidate.email}</div>
                      <div><span className="font-semibold text-slate-800">Telepon:</span> {previewCvCandidate.phone}</div>
                      <div><span className="font-semibold text-slate-800">Kanal Asal:</span> {previewCvCandidate.sourcePortal || 'Portal Rekrutmen'}</div>
                    </div>
                  </div>

                  {/* Section 1: Ringkasan Profesional */}
                  <div className="space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                      <FileText className="w-3.5 h-3.5 text-blue-700" />
                      <span>Ringkasan Profil & Kualifikasi</span>
                    </h2>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Profesional berdedikasi dengan rekam jejak kerja solid di bidang {vacTitle}. Memiliki kemampuan analisis sistem yang kuat, pengalaman kolaborasi dalam tim berkinerja tinggi, dan adaptif terhadap standar mutu operasional modern perusahaan.
                    </p>
                  </div>

                  {/* Section 2: Riwayat Pengalaman Kerja */}
                  <div className="space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                      <Briefcase className="w-3.5 h-3.5 text-blue-700" />
                      <span>Pengalaman Kerja Terakhir</span>
                    </h2>
                    <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {previewCvCandidate.parsedData?.currentTitle || 'Staff / Specialist'}
                          </div>
                          <div className="text-[11px] font-semibold text-blue-800">
                            {previewCvCandidate.lastCompany || previewCvCandidate.parsedData?.currentCompany || 'Perusahaan Terkait'}
                          </div>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 w-fit">
                          {previewCvCandidate.parsedData?.totalExperienceYears || 3} Tahun Pengalaman
                        </div>
                      </div>
                      <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1">
                        <li>Memimpin dan mengeksekusi tanggung jawab utama dengan mematuhi SOP dan target SLA divisi.</li>
                        <li>Mengoptimalkan alur kerja operasional dan berkontribusi aktif dalam inisiatif efisiensi kerja tim.</li>
                        <li>Melakukan komunikasi koordinatif dengan stakeholder internal dan mitra eksternal.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Section 3: Pendidikan Terakhir */}
                  <div className="space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
                      <span>Latar Belakang Pendidikan</span>
                    </h2>
                    <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {degreeLevel} - {educationMajor}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {previewCvCandidate.parsedData?.university || 'Perguruan Tinggi Terakreditasi'}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 w-fit">
                        Ijazah & Transkrip Terverifikasi
                      </span>
                    </div>
                  </div>

                  {/* Section 4: Keahlian & Keterampilan Utama */}
                  <div className="space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-700" />
                      <span>Keahlian & Kompetensi Utama</span>
                    </h2>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(previewCvCandidate.parsedData?.topSkills || ['Problem Solving', 'Komunikasi Efektif', 'Analisis Data', 'Kerja Tim']).map(
                        (skill, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-1 rounded-md font-medium"
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Watermark & Verification Stamp */}
                  <div className="pt-4 border-t border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Berkas resmi tersimpan dalam repositori HRMS Nusantara</span>
                    </div>
                    <div className="font-mono text-slate-400">
                      ID Dokumen: {previewCvCandidate.id} • Tgl: {previewCvCandidate.appliedDate || '2026-10-25'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Actions */}
              <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <span className="text-xs text-slate-500 truncate hidden sm:inline">
                  File: <span className="font-mono font-semibold text-slate-700">{previewCvCandidate.cvFileName || 'CV_Pelamar.pdf'}</span>
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setPreviewCvCandidate(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                  >
                    Tutup Pratinjau
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadCv(previewCvCandidate)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Berkas CV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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

              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmRevertToIncomingCandidate(activeCandidate)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-semibold text-xs transition-colors shadow-2xs"
                  title="Kembalikan pelamar ke antrean berkas masuk (Incoming)"
                >
                  <Undo2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Kembalikan ke Incoming</span>
                </button>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsScreeningModalOpen(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAssessmentCandidate(activeCandidate)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                    title="Pindahkan kandidat ke tahap Tes Kompetensi (melalui konfirmasi)"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Shortlist ke Tes (Asesmen)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmInterviewCandidate(activeCandidate)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                    title="Langsung jadwalkan ke Wawancara User (melalui konfirmasi)"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Langsung ke Wawancara (User)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 5: ALUR EVALUASI & UJI KOMPETENSI 3-TAHAP WIZARD ===================== */}
      {isAssessmentModalOpen && activeCandidate && (() => {
        const currentCandidate = candidates.find((c) => c.id === activeCandidate.id) || activeCandidate;
        const candidateVacancy = vacancies.find((v) => v.id === currentCandidate.jobVacancyId);

        // Filter pegawai HR vs Pegawai User Divisi Terkait
        const hrStaffList = employees.filter(
          (e) =>
            e.department?.toLowerCase().includes('hr') ||
            e.department?.toLowerCase().includes('people') ||
            e.department?.toLowerCase().includes('human') ||
            e.position?.toLowerCase().includes('hr') ||
            e.position?.toLowerCase().includes('recruiter') ||
            e.position?.toLowerCase().includes('talent')
        );
        const userStaffList = employees.filter((e) => !hrStaffList.some((hr) => hr.id === e.id));

        // Kalkulasi nilai rekap Tahap 3
        const assignedItems = selectedAssessmentTestIds.map(
          (tid) =>
            assignedTestsConfig[tid] || {
              id: `assigned-${tid}`,
              testTypeId: tid,
              testTypeName: competencyTestTypes.find((t) => t.id === tid)?.name || tid,
              category: 'Hard Skill',
              format: globalAssessmentFormat,
              durationMinutes: 60,
              assessorName: 'Aditya Pratama (HRBP)',
              assessorRole: 'Tim HR',
              passingGrade: 75,
              status: 'Belum Dinilai',
            }
        );

        const scoredItems = assignedItems.filter((t) => typeof t.score === 'number');
        const totalScoredSum = scoredItems.reduce((acc, t) => acc + (t.score || 0), 0);
        const compositeScore = scoredItems.length > 0 ? Math.round(totalScoredSum / scoredItems.length) : 0;
        const isAllTestsPassed =
          assignedItems.length > 0 &&
          assignedItems.every((t) => typeof t.score === 'number' && t.score >= t.passingGrade);

        // Tes aktif di Tahap 2
        const currentActiveTestConfig =
          assignedTestsConfig[activeStep2TestId] ||
          assignedItems[0] || {
            id: `assigned-${activeStep2TestId}`,
            testTypeId: activeStep2TestId,
            testTypeName: 'Tes Teknis',
            category: 'Hard Skill',
            format: 'Online',
            durationMinutes: 60,
            assessorName: 'Budi Santoso (Tech Lead / User)',
            assessorRole: 'User (Divisi Terkait)',
            passingGrade: 75,
            status: 'Belum Dinilai',
          };

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAssessmentModalOpen(false);
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal dengan Info Pelamar */}
              <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shrink-0 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300 shrink-0">
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <span>Alur Evaluasi & Uji Kompetensi Pelamar (Assessment)</span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                      <span className="font-semibold text-white">{currentCandidate.name}</span>
                      <span>•</span>
                      <span className="text-slate-400 font-medium">
                        {candidateVacancy?.title || 'Posisi Formasi'} ({candidateVacancy?.department || 'Divisi'})
                      </span>
                    </div>
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
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/15"
                    title="Buka Pengaturan Master Jenis Tes"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">Katalog Master Tes</span>
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

              {/* Stepper Wizard Indicator (3 Langkah Terpadu) */}
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
                <div className="flex items-center justify-between gap-2 max-w-3xl mx-auto">
                  {/* Step 1 */}
                  <button
                    type="button"
                    onClick={() => setAssessmentWizardStep(1)}
                    className={`flex items-center gap-2.5 text-left transition-all ${
                      assessmentWizardStep === 1
                        ? 'opacity-100 font-bold text-indigo-950'
                        : 'opacity-70 hover:opacity-100 text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                        assessmentWizardStep === 1
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-200'
                          : selectedAssessmentTestIds.length > 0
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {selectedAssessmentTestIds.length > 0 && assessmentWizardStep > 1 ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        '1'
                      )}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold leading-tight">Tahap 1</div>
                      <div className="text-[10px] text-slate-500 font-medium hidden sm:block">
                        Setup & Penugasan Tes
                      </div>
                    </div>
                  </button>

                  <div className="h-0.5 flex-1 bg-slate-200 mx-1 sm:mx-2" />

                  {/* Step 2 */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedAssessmentTestIds.length > 0) setAssessmentWizardStep(2);
                    }}
                    className={`flex items-center gap-2.5 text-left transition-all ${
                      assessmentWizardStep === 2
                        ? 'opacity-100 font-bold text-indigo-950'
                        : 'opacity-70 hover:opacity-100 text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                        assessmentWizardStep === 2
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-200'
                          : scoredItems.length === selectedAssessmentTestIds.length && selectedAssessmentTestIds.length > 0
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {scoredItems.length === selectedAssessmentTestIds.length && assessmentWizardStep > 2 ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        '2'
                      )}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold leading-tight">Tahap 2</div>
                      <div className="text-[10px] text-slate-500 font-medium hidden sm:block">
                        Input Nilai Hasil Tes
                      </div>
                    </div>
                  </button>

                  <div className="h-0.5 flex-1 bg-slate-200 mx-1 sm:mx-2" />

                  {/* Step 3 */}
                  <button
                    type="button"
                    onClick={() => {
                      if (scoredItems.length > 0) setAssessmentWizardStep(3);
                    }}
                    className={`flex items-center gap-2.5 text-left transition-all ${
                      assessmentWizardStep === 3
                        ? 'opacity-100 font-bold text-indigo-950'
                        : 'opacity-70 hover:opacity-100 text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                        assessmentWizardStep === 3
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      3
                    </div>
                    <div>
                      <div className="text-[11px] font-bold leading-tight">Tahap 3</div>
                      <div className="text-[10px] text-slate-500 font-medium hidden sm:block">
                        Hasil Nilai Akhir & Keputusan
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Body Content Wizard */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* ===================== TAHAP 1: SETUP & PENUGASAN TES ===================== */}
                {assessmentWizardStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    {/* Ringkasan Penjelasan Tahap 1 */}
                    <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-blue-950 text-xs">
                          Tahap 1: Penentuan Format, Pilihan Multi-Tes Kompetensi & Asesor Penguji
                        </h4>
                        <p className="text-blue-800 text-[11px] leading-relaxed">
                          Tentukan apakah tes dilakukan secara Online atau Offline, pilih 1 atau lebih jenis tes kompetensi, atur durasi, kriteria & catatan khusus (link repo/sandbox). Kemudian tentukan Asesor untuk masing-masing tes (bisa HR atau User terkait).
                        </p>
                      </div>
                    </div>

                    {/* 1. Format Utama Pelaksanaan Tes */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                          <Laptop className="w-4 h-4 text-indigo-600" />
                          <span>1. Format Pelaksanaan Tes *</span>
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Format default untuk tes yang ditugaskan ke kandidat
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setGlobalAssessmentFormat('Online');
                            selectedAssessmentTestIds.forEach((tid) => {
                              handleUpdateAssignedConfig(tid, { format: 'Online' });
                            });
                          }}
                          className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                            globalAssessmentFormat === 'Online'
                              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-200 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">Online Test (Remote)</span>
                            <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                              Pelamar mengerjakan tes via tautan online, sandbox, atau repositori remote.
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setGlobalAssessmentFormat('Offline');
                            selectedAssessmentTestIds.forEach((tid) => {
                              handleUpdateAssignedConfig(tid, { format: 'Offline' });
                            });
                          }}
                          className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                            globalAssessmentFormat === 'Offline'
                              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">Offline Test (On-Site Kantor)</span>
                            <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                              Tatap muka langsung di lab komputer, ruang rapat, atau area kerja operasional.
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* 2. Checklist Pilihan Jenis Tes Kompetensi (Multi-Tes) */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <label className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                            <span>2. Pilih Jenis Tes Kompetensi (Bisa Lebih Dari 1 Jenis Tes) *</span>
                          </label>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Centang jenis tes yang ingin diujikan kepada pelamar ini. Minimal 1 jenis tes.
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[11px] shrink-0 self-start sm:self-auto">
                          {selectedAssessmentTestIds.length} Tes Terpilih
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                        {competencyTestTypes.map((testItem) => {
                          const isChecked = selectedAssessmentTestIds.includes(testItem.id);
                          return (
                            <div
                              key={testItem.id}
                              onClick={() => handleToggleTestSelection(testItem)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                                isChecked
                                  ? 'bg-white border-indigo-500 ring-2 ring-indigo-200 shadow-2xs'
                                  : 'bg-white/70 border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {isChecked ? (
                                  <CheckCircle2 className="w-4 h-4 text-indigo-600 fill-indigo-50" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-slate-300" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 text-xs leading-tight">
                                  {testItem.name}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                    {testItem.category}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Min: {testItem.passingGrade}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Konfigurasi Rinci untuk Setiap Tes Terpilih */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                          <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                          <span>3. Rincian Kriteria, Durasi, Catatan/Tautan & Penentuan Asesor per Tes</span>
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          1 Jenis Tes = 1 Asesor (Bisa orang sama atau beda)
                        </span>
                      </div>

                      {selectedAssessmentTestIds.map((testId, idx) => {
                        const masterTest = competencyTestTypes.find((t) => t.id === testId);
                        const cfg =
                          assignedTestsConfig[testId] || {
                            id: `assigned-${testId}`,
                            testTypeId: testId,
                            testTypeName: masterTest?.name || testId,
                            category: masterTest?.category || 'Hard Skill',
                            format: globalAssessmentFormat,
                            durationMinutes: masterTest?.durationMinutes || 60,
                            testUrlOrRepo: 'https://github.com/nusantara-eval/code-challenge',
                            locationOrSandboxNotes: '',
                            assessorName: 'Aditya Pratama (HRBP)',
                            assessorRole: 'Tim HR',
                            passingGrade: masterTest?.passingGrade || 75,
                            status: 'Belum Dinilai',
                          };

                        const isOnline = cfg.format === 'Online';

                        return (
                          <div
                            key={testId}
                            className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-4 shadow-2xs hover:border-slate-300 transition-all"
                          >
                            {/* Header Tes Card */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                                  #{idx + 1}
                                </span>
                                <div>
                                  <h5 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                    <span>{cfg.testTypeName}</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                                      {cfg.category}
                                    </span>
                                  </h5>
                                </div>
                              </div>

                              {/* Toggle Format per Tes */}
                              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateAssignedConfig(testId, { format: 'Online' })}
                                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                                    cfg.format === 'Online'
                                      ? 'bg-white text-blue-700 shadow-2xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  Online
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateAssignedConfig(testId, { format: 'Offline' })}
                                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                                    cfg.format === 'Offline'
                                      ? 'bg-white text-emerald-700 shadow-2xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  Offline
                                </button>
                              </div>
                            </div>

                            {/* Kriteria Penilaian Sesuai Jenis Tes */}
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Kriteria Penilaian ({cfg.testTypeName}):</span>
                              </span>
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                {masterTest?.description ||
                                  'Penilaian berfokus pada ketepatan hasil kerja, metode analisis, efisiensi waktu, dan kesesuaian standar kualitas industri.'}
                              </p>
                            </div>

                            {/* Durasi & Catatan / Link Repo Sandbox */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="font-semibold text-slate-700 block mb-1 text-[11px]">
                                  Durasi Tes (Menit) *
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min={15}
                                    max={480}
                                    value={cfg.durationMinutes || 60}
                                    onChange={(e) =>
                                      handleUpdateAssignedConfig(testId, {
                                        durationMinutes: Number(e.target.value),
                                      })
                                    }
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900"
                                  />
                                  <span className="absolute right-3 top-1.5 text-slate-400 text-[11px]">
                                    menit
                                  </span>
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <label className="font-semibold text-slate-700 block mb-1 text-[11px]">
                                  Passing Grade Acuan (Dapat Disesuaikan) *
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={cfg.passingGrade || 75}
                                    onChange={(e) =>
                                      handleUpdateAssignedConfig(testId, {
                                        passingGrade: Number(e.target.value),
                                      })
                                    }
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                                  />
                                  <span className="absolute right-3 top-1.5 text-slate-400 text-[11px]">
                                    / 100
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* KONDISI TES: ONLINE VS OFFLINE LENGKAP */}
                            {isOnline ? (
                              /* ==================== KONTEN & PORTAL TES ONLINE ==================== */
                              <div className="p-4 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/90 rounded-xl space-y-3.5 shadow-2xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-blue-100">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                                    <h6 className="font-bold text-blue-950 text-xs">
                                      Konten Tes Online, Instruksi Soal & Tautan Sekali Pakai
                                    </h6>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {cfg.isTokenUsed ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                        <XCircle className="w-3 h-3 text-rose-600" />
                                        <span>Link Hangus (Sudah Disubmit)</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                        <span>Link Aktif (Sekali Pakai)</span>
                                      </span>
                                    )}
                                    {cfg.invitationSent && (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-semibold bg-blue-100/70 px-2 py-0.5 rounded">
                                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                        <span>Terkirim: {cfg.invitationSentAt?.substring(11, 16) || 'Terkirim'}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Deskripsi Tes (Apa yang diuji, studi kasus, instruksi) */}
                                <div>
                                  <label className="font-bold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                                    <span>Deskripsi & Instruksi Pengerjaan Tes *:</span>
                                    <span className="text-[10px] text-slate-500 font-normal">Akan tampil di layar portal pengerjaan pelamar</span>
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={cfg.testDescription || ''}
                                    onChange={(e) =>
                                      handleUpdateAssignedConfig(testId, {
                                        testDescription: e.target.value,
                                      })
                                    }
                                    placeholder="Jelaskan instruksi studi kasus yang harus dikerjakan pelamar..."
                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                  />
                                </div>

                                {/* Output yang Diharapkan (Deliverables) */}
                                <div>
                                  <label className="font-bold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                                    <span>Output yang Diharapkan (Deliverables) *:</span>
                                    <span className="text-[10px] text-slate-500 font-normal">Format hasil akhir yang wajib di-submit oleh pelamar</span>
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={cfg.expectedOutput || ''}
                                    onChange={(e) =>
                                      handleUpdateAssignedConfig(testId, {
                                        expectedOutput: e.target.value,
                                      })
                                    }
                                    placeholder="Contoh: Link GitHub Public, file README rancangan arsitektur, dan tautan live demo..."
                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                  />
                                </div>

                                {/* Halaman & Tautan Nyata yang Digenerate HRMS */}
                                <div className="p-3 bg-white border border-blue-200/90 rounded-lg space-y-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                      <Link2 className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Tautan Halaman Ujian Resmi HRMS (One-Time Access Link):</span>
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      Batas Berlaku: <strong className="text-slate-700">{cfg.tokenExpiresAt || '24 Jam ke Depan'}</strong>
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      readOnly
                                      value={`${window.location.origin}/?testToken=${cfg.testToken || 'token-not-generated'}`}
                                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-slate-50 text-blue-900 font-semibold select-all"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleCopyTestLink(cfg.testToken)}
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                                      title="Salin Link Halaman Ujian"
                                    >
                                      {copyLinkSuccess === cfg.testToken ? (
                                        <>
                                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                          <span className="text-emerald-700">Tersalin!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                                          <span>Copy Link</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenTestPageInNewTab(cfg.testToken)}
                                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                                      title="Buka halaman ujian langsung di tab baru (Preview)"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Buka Halaman</span>
                                    </button>
                                  </div>

                                  {/* Baris Tombol Aksi: Generate Ulang & Kirim Konten Lengkap */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => handleRegenerateToken(testId)}
                                      className="text-[11px] text-amber-800 hover:text-amber-900 font-semibold flex items-center gap-1.5 hover:underline py-1"
                                      title="Gunakan jika pelamar memerlukan tes ulang atau link lama telah kedaluwarsa/hangus"
                                    >
                                      <RotateCcw className="w-3 h-3 text-amber-600" />
                                      <span>Generate Ulang Token / Link Baru (Tes Ulang)</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setPreviewSendTestConfig(cfg)}
                                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                      <span>Kirim Konten & Link ke Pelamar</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* ==================== FORM BOOKING RUANGAN & FASILITAS OFFLINE ==================== */
                              <div className="p-4 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50 border border-emerald-200 rounded-xl space-y-3.5 shadow-2xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-emerald-100">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-emerald-700" />
                                    <h6 className="font-bold text-emerald-950 text-xs">
                                      Booking Ruangan & Fasilitas Agenda Tes On-Site (Offline)
                                    </h6>
                                  </div>
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>Terkonfirmasi Kalender HR & GA</span>
                                  </span>
                                </div>

                                {/* Dropdown Pilihan Ruangan / Fasilitas */}
                                <div>
                                  <label className="font-bold text-slate-800 block mb-1 text-[11px] flex items-center justify-between">
                                    <span>Pilih Ruangan Ujian On-Site *:</span>
                                    <span className="text-[10px] text-emerald-700 font-normal">
                                      Kapasitas & Fasilitas default otomatis dimuat
                                    </span>
                                  </label>
                                  <select
                                    value={cfg.offlineRoomName || 'Ruang Asesmen Talent Lab (Lt. 3 Gedung Pusat) — Kapasitas 8 Orang'}
                                    onChange={(e) => {
                                      const selectedRoomKey = e.target.value;
                                      const roomData = OFFLINE_ASSESSMENT_ROOM_CATALOG[selectedRoomKey];
                                      handleUpdateAssignedConfig(testId, {
                                        offlineRoomName: selectedRoomKey,
                                        offlineDefaultFacilities: roomData?.defaultFacilities || [],
                                      });
                                    }}
                                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-xs bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                                  >
                                    {Object.entries(OFFLINE_ASSESSMENT_ROOM_CATALOG).map(([key, room]) => (
                                      <option key={key} value={key}>
                                        🏢 {room.name} — {room.location} ({room.capacity})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Agenda Tanggal, Jam Mulai, dan Jam Selesai */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="font-bold text-slate-800 block mb-1 text-[11px]">
                                      Tanggal Agenda Tes *:
                                    </label>
                                    <input
                                      type="date"
                                      value={cfg.offlineTestDate || new Date().toISOString().split('T')[0]}
                                      onChange={(e) =>
                                        handleUpdateAssignedConfig(testId, {
                                          offlineTestDate: e.target.value,
                                        })
                                      }
                                      className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg text-xs bg-white text-slate-900 font-semibold"
                                    />
                                  </div>

                                  <div>
                                    <label className="font-bold text-slate-800 block mb-1 text-[11px]">
                                      Jam Mulai *:
                                    </label>
                                    <input
                                      type="time"
                                      value={cfg.offlineStartTime || '09:00'}
                                      onChange={(e) =>
                                        handleUpdateAssignedConfig(testId, {
                                          offlineStartTime: e.target.value,
                                        })
                                      }
                                      className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg text-xs bg-white text-slate-900 font-mono font-semibold"
                                    />
                                  </div>

                                  <div>
                                    <label className="font-bold text-slate-800 block mb-1 text-[11px]">
                                      Jam Selesai *:
                                    </label>
                                    <input
                                      type="time"
                                      value={cfg.offlineEndTime || '11:30'}
                                      onChange={(e) =>
                                        handleUpdateAssignedConfig(testId, {
                                          offlineEndTime: e.target.value,
                                        })
                                      }
                                      className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg text-xs bg-white text-slate-900 font-mono font-semibold"
                                    />
                                  </div>
                                </div>

                                {/* ==================== 1. FASILITAS BAWAAN (DEFAULT SUDAH ADA DI RUANGAN) ==================== */}
                                {(() => {
                                  const roomKey = cfg.offlineRoomName || 'Ruang Asesmen Talent Lab (Lt. 3 Gedung Pusat) — Kapasitas 8 Orang';
                                  const currentRoom = OFFLINE_ASSESSMENT_ROOM_CATALOG[roomKey] || OFFLINE_ASSESSMENT_ROOM_CATALOG['Ruang Asesmen Talent Lab (Lt. 3 Gedung Pusat) — Kapasitas 8 Orang'];
                                  const defaultFacs = currentRoom?.defaultFacilities || [];
                                  const availableRequestFacs = currentRoom?.availableRequestFacilities || [];
                                  const requestedFacs = cfg.offlineRequestedFacilities || [];

                                  return (
                                    <div className="space-y-3 pt-1">
                                      {/* Kotak Fasilitas Default Ruangan */}
                                      <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            <span className="font-bold text-emerald-950 text-xs">
                                              Fasilitas & Peralatan Ruangan yang Disediakan (Default Sudah Ada di Ruangan):
                                            </span>
                                          </div>
                                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            Siap Pakai & Standar Tetap
                                          </span>
                                        </div>

                                        <p className="text-[10px] text-slate-500">
                                          Fasilitas berikut sudah terpasang permanen di <strong>{currentRoom?.name}</strong> dan siap langsung digunakan tanpa perlu pengajuan terpisah ke GA:
                                        </p>

                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                          {defaultFacs.map((dfac, dfIdx) => (
                                            <span
                                              key={dfIdx}
                                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200/90 shadow-2xs"
                                            >
                                              <Check className="w-3 h-3 text-emerald-600" />
                                              <span>{dfac}</span>
                                            </span>
                                          ))}
                                        </div>
                                      </div>

                                      {/* ==================== 2. FASILITAS BY REQUEST SESUAI KEBUTUHAN ==================== */}
                                      <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1.5">
                                            <Sliders className="w-4 h-4 text-indigo-700" />
                                            <span className="font-bold text-indigo-950 text-xs">
                                              Fasilitas & Peralatan Tambahan (Disediakan By Request Sesuai Kebutuhan):
                                            </span>
                                          </div>
                                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded">
                                            {requestedFacs.length} Item Di-request
                                          </span>
                                        </div>

                                        <div className="space-y-2">
                                          <p className="text-[10px] text-slate-500">
                                            Pilih rekomendasi peralatan GA atau ketik langsung peralatan tambahan yang diperlukan:
                                          </p>

                                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                                            {availableRequestFacs.map((rfac, rfIdx) => {
                                              const isSelected = requestedFacs.includes(rfac);
                                              return (
                                                <button
                                                  key={rfIdx}
                                                  type="button"
                                                  onClick={() => {
                                                    const next = isSelected
                                                      ? requestedFacs.filter((f) => f !== rfac)
                                                      : [...requestedFacs, rfac];
                                                    handleUpdateAssignedConfig(testId, {
                                                      offlineRequestedFacilities: next,
                                                    });
                                                  }}
                                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all flex items-center gap-1.5 ${
                                                    isSelected
                                                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                                                      : 'bg-white text-slate-700 border-indigo-200 hover:border-indigo-300'
                                                  }`}
                                                >
                                                  {isSelected ? (
                                                    <Check className="w-3 h-3 text-white" />
                                                  ) : (
                                                    <Plus className="w-3 h-3 text-indigo-500" />
                                                  )}
                                                  <span>{rfac}</span>
                                                </button>
                                              );
                                            })}
                                          </div>

                                          {/* Manual Input Pemisah Koma atau Titik Koma */}
                                          <div className="pt-2 border-t border-indigo-100">
                                            <label className="text-[10px] font-bold text-indigo-900 block mb-1">
                                              Fasilitas & Peralatan Tambahan yang Diperlukan (Input manual pemisah koma ',' atau titik koma ';'):
                                            </label>
                                            <textarea
                                              rows={2}
                                              value={requestedFacs.join(', ')}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                const parsed = val
                                                  .split(/[,;]+/)
                                                  .map((s) => s.trim())
                                                  .filter(Boolean);
                                                handleUpdateAssignedConfig(testId, {
                                                  offlineRequestedFacilities: parsed,
                                                });
                                              }}
                                              placeholder="Contoh: Laptop Pinjaman Peserta, Sound System & Clip-on Mic; 2 Kabel Roll Ekstensi, Proyektor HDMI..."
                                              className="w-full px-3 py-1.5 border border-indigo-200 rounded-lg text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 font-medium"
                                            />
                                            <span className="text-[9.5px] text-slate-500 block mt-0.5">
                                              💡 Pisahkan dengan koma (,) atau titik koma (;) untuk menambah atau mengubah fasilitas tambahan GA.
                                            </span>
                                          </div>

                                          {/* Catatan Request Khusus GA / IT */}
                                          <div className="pt-1.5 border-t border-indigo-100">
                                            <label className="text-[10px] font-bold text-indigo-900 block mb-1">
                                              Catatan Kebutuhan Khusus Lainnya ke Tim GA & IT:
                                            </label>
                                            <input
                                              type="text"
                                              value={cfg.offlineRequestNotes || ''}
                                              onChange={(e) =>
                                                handleUpdateAssignedConfig(testId, {
                                                  offlineRequestNotes: e.target.value,
                                                })
                                              }
                                              placeholder="Contoh: Butuh 1 laptop cadangan dan stop kontak ekstensi 5 lubang di meja utama..."
                                              className="w-full px-3 py-1.5 border border-indigo-200 rounded-lg text-xs bg-white text-slate-900 placeholder:text-slate-400"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Catatan Perlengkapan Pelamar */}
                                <div>
                                  <label className="font-bold text-slate-800 block mb-1 text-[11px]">
                                    Petunjuk Khusus & Perlengkapan yang Wajib Dibawa Pelamar:
                                  </label>
                                  <input
                                    type="text"
                                    value={cfg.offlineEquipmentNotes || ''}
                                    onChange={(e) =>
                                      handleUpdateAssignedConfig(testId, {
                                        offlineEquipmentNotes: e.target.value,
                                      })
                                    }
                                    placeholder="Contoh: Wajib membawa kartu identitas KTP/SIM asli, hadir 15 menit lebih awal, berpakaian rapi..."
                                    className="w-full px-3 py-1.5 border border-emerald-200 rounded-lg text-xs bg-white text-slate-900"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Penentuan Asesor (1 Jenis Tes = 1 Asesor, HR atau User) */}
                            <div className="pt-2 border-t border-slate-100">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                                <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Penentuan Asesor / Penguji Tes Ini *</span>
                                </label>
                                <span className="text-[10px] text-slate-500">
                                  Bisa Asesor HR atau User Divisi Terkait
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                    Pilih dari Daftar Karyawan / Asesor (Foto, Nama, NIK, Jabatan):
                                  </label>
                                  <EmployeeSelectDropdown
                                    employees={companyEmployees}
                                    selectedId={companyEmployees.find(e => e.fullName === cfg.assessorName || `${e.fullName} (${e.position})` === cfg.assessorName)?.id}
                                    onSelect={(emp) => {
                                      const isFromHr = emp.department?.toLowerCase().includes('hr') || emp.department?.toLowerCase().includes('people');
                                      handleUpdateAssignedConfig(testId, {
                                        assessorName: emp.fullName,
                                        assessorRole: isFromHr ? 'Tim HR' : 'User (Divisi Terkait)',
                                      });
                                    }}
                                    placeholder="-- Pilih Asesor (Foto, Nama, NIK, Jabatan) --"
                                  />
                                </div>

                                <div>
                                  <label className="text-[11px] text-slate-600 block mb-1">
                                    Atau Ketik Nama & Peran Asesor Manual:
                                  </label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={cfg.assessorName || ''}
                                      onChange={(e) =>
                                        handleUpdateAssignedConfig(testId, {
                                          assessorName: e.target.value,
                                        })
                                      }
                                      placeholder="Nama Asesor / Penguji..."
                                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                                    />
                                    <select
                                      value={cfg.assessorRole || 'Tim HR'}
                                      onChange={(e) =>
                                        handleUpdateAssignedConfig(testId, {
                                          assessorRole: e.target.value,
                                        })
                                      }
                                      className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 shrink-0 font-semibold"
                                    >
                                      <option value="Tim HR">Tim HR</option>
                                      <option value="User (Divisi Terkait)">User Terkait</option>
                                      <option value="Eksternal / Vendor">Eksternal</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer Navigasi Tahap 1 */}
                    <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAssessmentModalOpen(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-center transition-colors text-xs"
                        >
                          Tutup
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRevertToScreeningCandidate(currentCandidate)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-semibold text-xs transition-colors shadow-2xs"
                        >
                          <Undo2 className="w-3.5 h-3.5 text-amber-600" />
                          <span>Kembalikan ke Screening</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleSaveStep1Only(false)}
                          className="px-4 py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border border-slate-300 hover:border-slate-400 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                          title="Simpan perencanaan tes, booking ruangan/fasilitas, dan penentuan asesor tanpa berpindah halaman"
                        >
                          <Save className="w-3.5 h-3.5 text-slate-600" />
                          <span>Simpan Setup Tes</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleProceedToStep2}
                          className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white rounded-lg font-bold text-xs shadow-md shadow-indigo-700/20 flex items-center justify-center gap-2 transition-all"
                          title="Lanjutkan ke tahap 2 untuk menginput nilai evaluasi hasil tes"
                        >
                          <span>Lanjutkan ke Input Nilai (Tahap 2)</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===================== TAHAP 2: INPUT NILAI HASIL TES ===================== */}
                {assessmentWizardStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    {/* Ringkasan Penjelasan Tahap 2 */}
                    <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-start gap-3">
                      <Award className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-indigo-950 text-xs">
                          Tahap 2: Input Nilai Hasil Tes Kompetensi ({selectedAssessmentTestIds.length} Jenis Tes Wajib Dinilai)
                        </h4>
                        <p className="text-indigo-800 text-[11px] leading-relaxed">
                          HR menginput nilai hasil tes untuk seluruh jenis tes yang diajukan pada Tahap 1. Nama Asesor terkunci sesuai dengan yang telah ditentukan pada Tahap 1. Passing grade dapat disesuaikan dan catatan evaluasi asesor wajib dicantumkan.
                        </p>
                      </div>
                    </div>

                    {/* Tab Switcher Antar Tes yang Dipilih di Tahap 1 */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
                      {selectedAssessmentTestIds.map((tid, idx) => {
                        const cfg = assignedTestsConfig[tid];
                        const isSelected = activeStep2TestId === tid;
                        const isScored = typeof cfg?.score === 'number';

                        return (
                          <button
                            key={tid}
                            type="button"
                            onClick={() => setActiveStep2TestId(tid)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <span>#{idx + 1} {cfg?.testTypeName || tid}</span>
                            {isScored ? (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : cfg.status === 'Lulus'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                Skor: {cfg.score}
                              </span>
                            ) : (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  isSelected ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                Belum Dinilai
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Form Input Penilaian untuk Tes yang Aktif */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span>{currentActiveTestConfig.testTypeName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Format: {currentActiveTestConfig.format}
                            </span>
                          </h4>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            Kategori: {currentActiveTestConfig.category} • Durasi: {currentActiveTestConfig.durationMinutes || 60} Menit
                          </span>
                        </div>

                        {currentActiveTestConfig.format === 'Online' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenTestPageInNewTab(currentActiveTestConfig.testToken)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-semibold transition-colors border border-indigo-200 shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Buka Halaman Ujian Pelamar</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* INFORMASI HASIL SUBMIT KANDIDAT / AGENDA OFFLINE */}
                      {currentActiveTestConfig.format === 'Online' ? (
                        currentActiveTestConfig.submittedUrl || currentActiveTestConfig.isTokenUsed ? (
                          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                              <span className="font-bold text-emerald-950 text-xs flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                <span>Hasil Tes Telah Disubmit oleh Pelamar ({currentActiveTestConfig.submittedAt || 'Telah Diterima'})</span>
                              </span>
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                Token Sekali Pakai Telah Hangus
                              </span>
                            </div>

                            {/* Tautan Hasil Kerja Pelamar */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                              <span className="text-[11px] font-bold text-slate-700 shrink-0">
                                Tautan Pengerjaan / Repositori:
                              </span>
                              {currentActiveTestConfig.submittedUrl ? (
                                <a
                                  href={currentActiveTestConfig.submittedUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-800 font-mono text-xs font-bold hover:bg-emerald-100 transition-colors break-all"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{currentActiveTestConfig.submittedUrl}</span>
                                </a>
                              ) : (
                                <span className="text-xs text-slate-500 italic">Disubmit via form portal langsung</span>
                              )}
                            </div>

                            {/* Catatan / Solusi Teknis Pelamar */}
                            {currentActiveTestConfig.submittedNotes && (
                              <div className="p-2.5 bg-white border border-emerald-200 rounded-lg text-xs space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                  Ringkasan Solusi / Penjelasan Teknis Pelamar:
                                </span>
                                <p className="text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                                  {currentActiveTestConfig.submittedNotes}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                              <span>Menunggu pelamar menyelesaikan dan men-submit hasil ujian dari portal online.</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyTestLink(currentActiveTestConfig.testToken)}
                              className="px-2.5 py-1 bg-white border border-blue-300 text-blue-800 rounded font-semibold text-[11px] hover:bg-blue-100 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Salin Link</span>
                            </button>
                          </div>
                        )
                      ) : (
                        /* Agenda Booking Offline dengan Default & By Request Facilities */
                        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-emerald-950">
                              <Building2 className="w-4 h-4 text-emerald-700" />
                              <span>Agenda Tes On-Site & Fasilitas Ruangan</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                              Terkonfirmasi Tim GA
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 text-[11px] pt-1 border-t border-emerald-100">
                            <div>
                              <span className="text-slate-500">Ruangan:</span>{' '}
                              <strong className="text-slate-900">{currentActiveTestConfig.offlineRoomName || 'Ruang Asesmen Talent Lab (Lt. 3)'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500">Waktu:</span>{' '}
                              <strong className="text-slate-900">
                                {currentActiveTestConfig.offlineTestDate || 'Besok'} ({currentActiveTestConfig.offlineStartTime || '09:00'} - {currentActiveTestConfig.offlineEndTime || '11:30'})
                              </strong>
                            </div>
                          </div>

                          {/* Info Fasilitas Default dan Requested */}
                          <div className="space-y-1.5 pt-1 text-[11px]">
                            {Array.isArray(currentActiveTestConfig.offlineRequestedFacilities) && currentActiveTestConfig.offlineRequestedFacilities.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                  Fasilitas Tambahan By Request:
                                </span>
                                {currentActiveTestConfig.offlineRequestedFacilities.map((rf, rIdx) => (
                                  <span key={rIdx} className="text-[10px] bg-white border border-indigo-200 text-indigo-800 px-2 py-0.5 rounded font-medium">
                                    • {rf}
                                  </span>
                                ))}
                              </div>
                            )}

                            {currentActiveTestConfig.offlineEquipmentNotes && (
                              <div className="text-[10px] text-slate-600 bg-white p-2 rounded border border-emerald-100">
                                <span className="font-bold text-slate-700">Petunjuk Perlengkapan Pelamar:</span> {currentActiveTestConfig.offlineEquipmentNotes}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 1. NAMA ASESOR / PENGUJI * (TERKUNCI DARI TAHAP 1) */}
                      <div className="p-3.5 bg-slate-100/80 border border-slate-200 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                            <Lock className="w-3.5 h-3.5 text-indigo-700" />
                            <span>Nama Asesor / Penguji * (Terkunci Sesuai Tahap 1)</span>
                          </label>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            <ShieldCheck className="w-3 h-3 text-indigo-600" />
                            <span>Terverifikasi dari Tahap 1</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={`${currentActiveTestConfig.assessorName} [${currentActiveTestConfig.assessorRole || 'Asesor'}]`}
                            className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 cursor-not-allowed select-none"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Nama asesor terkunci untuk memastikan integritas pengujian antara perencanaan Tahap 1 dan hasil evaluasi Tahap 2.
                        </p>
                      </div>

                      {/* 2. PASSING GRADE ACUAN (DAPAT DISESUAIKAN) & NILAI AKHIR */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-bold text-slate-900 block mb-1 text-xs">
                            Passing Grade Acuan (Dapat Disesuaikan) *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={currentActiveTestConfig.passingGrade || 75}
                              onChange={(e) =>
                                handleUpdateAssignedConfig(activeStep2TestId, {
                                  passingGrade: Number(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                            />
                            <span className="absolute right-3 top-2 text-slate-400 text-xs">/ 100</span>
                          </div>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Standar nilai minimum kelulusan untuk tes ini.
                          </span>
                        </div>

                        <div>
                          <label className="font-bold text-slate-900 block mb-1 text-xs">
                            Input Nilai Hasil Tes (0 - 100) *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={typeof currentActiveTestConfig.score === 'number' ? currentActiveTestConfig.score : 85}
                              onChange={(e) =>
                                handleUpdateAssignedConfig(activeStep2TestId, {
                                  score: Number(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 border border-indigo-400 rounded-lg text-xs font-mono font-black text-indigo-950 bg-indigo-50/30 ring-2 ring-indigo-100"
                            />
                            <span className="absolute right-3 top-2 text-slate-400 text-xs">/ 100</span>
                          </div>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Skor akhir evaluasi dari asesor penguji.
                          </span>
                        </div>
                      </div>

                      {/* 3. CATATAN EVALUASI / REKOMENDASI ASESOR */}
                      <div>
                        <label className="font-bold text-slate-900 block mb-1 text-xs">
                          Catatan Evaluasi / Rekomendasi Asesor *
                        </label>
                        <textarea
                          rows={3}
                          value={currentActiveTestConfig.evaluationNotes || ''}
                          onChange={(e) =>
                            handleUpdateAssignedConfig(activeStep2TestId, {
                              evaluationNotes: e.target.value,
                            })
                          }
                          placeholder={`Catatan evaluasi rinci dari asesor ${currentActiveTestConfig.assessorName} mengenai kekuatan teknis, efisiensi solusi, dan rekomendasi lanjut...`}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 leading-relaxed font-sans"
                        />
                      </div>

                      {/* Live Status Card Tes Ini */}
                      {(() => {
                        const curScore =
                          typeof currentActiveTestConfig.score === 'number'
                            ? currentActiveTestConfig.score
                            : 85;
                        const curPass = currentActiveTestConfig.passingGrade || 75;
                        const isCurPass = curScore >= curPass;

                        return (
                          <div className="p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-200 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                Status Tes Ini:
                              </span>
                              <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-xl font-black font-mono text-slate-900">
                                  {curScore}
                                </span>
                                <span className="text-xs text-slate-500 font-mono">/ 100</span>
                                <span className="text-xs text-slate-400">
                                  (Passing Grade: {curPass})
                                </span>
                              </div>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                isCurPass
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              {isCurPass ? (
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
                        );
                      })()}

                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleSaveStep2Score(activeStep2TestId)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Simpan Nilai Tes Ini</span>
                        </button>
                      </div>
                    </div>

                    {/* Footer Navigasi Tahap 2 */}
                    <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <button
                        type="button"
                        onClick={() => setAssessmentWizardStep(1)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-center transition-colors text-xs flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali ke Setup (Tahap 1)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleProceedToStep3}
                        className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white rounded-lg font-bold shadow-md shadow-indigo-700/20 flex items-center justify-center gap-2 transition-all"
                      >
                        <span>Lanjut ke Hasil Nilai Akhir (Tahap 3)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ===================== TAHAP 3: HASIL NILAI AKHIR & KEPUTUSAN ===================== */}
                {assessmentWizardStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    {/* Ringkasan Kesimpulan dari Hasil Semua Tes */}
                    <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl space-y-3 shadow-md">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                        <div>
                          <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block">
                            Rekapitulasi Kesimpulan Seluruh Tes Kompetensi
                          </span>
                          <h4 className="text-base font-bold text-white mt-0.5">
                            {currentCandidate.name} • {candidateVacancy?.title || 'Posisi Lowongan'}
                          </h4>
                        </div>

                        {/* Status Kelulusan Keseluruhan */}
                        <div className="shrink-0">
                          <span
                            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm ${
                              isAllTestsPassed
                                ? 'bg-emerald-500 text-white'
                                : 'bg-rose-500 text-white'
                            }`}
                          >
                            {isAllTestsPassed ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>LULUS SELURUH TES KOMPETENSI</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4" />
                                <span>DI BAWAH PASSING GRADE ACUAN</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Metrik Nilai Akhir */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div className="p-3 bg-white/10 rounded-lg">
                          <span className="text-[10px] text-slate-300 block">Rata-rata Skor Gabungan</span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-2xl font-black font-mono text-white">
                              {compositeScore}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">/ 100</span>
                          </div>
                        </div>

                        <div className="p-3 bg-white/10 rounded-lg">
                          <span className="text-[10px] text-slate-300 block">Jumlah Tes Terlaksana</span>
                          <div className="text-xl font-bold font-mono text-white mt-0.5">
                            {scoredItems.length} / {assignedItems.length} Tes Selesai
                          </div>
                        </div>

                        <div className="p-3 bg-white/10 rounded-lg">
                          <span className="text-[10px] text-slate-300 block">Tingkat Pemenuhan Formasi</span>
                          <div className="text-xl font-bold text-amber-300 mt-0.5">
                            {isAllTestsPassed ? '100% Memenuhi Standar' : 'Perlu Pertimbangan Khusus'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tabel Rincian Semua Tes yang Telah Diuji */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-900 text-xs flex items-center justify-between">
                        <span>Rincian Hasil Penilaian Tiap Jenis Tes</span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          1 Asesor per Jenis Tes
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] text-slate-500 font-semibold">
                              <th className="py-2.5 px-3">No</th>
                              <th className="py-2.5 px-3">Jenis Tes & Format</th>
                              <th className="py-2.5 px-3">Nama Asesor / Penguji</th>
                              <th className="py-2.5 px-3 text-center">Passing Grade</th>
                              <th className="py-2.5 px-3 text-center">Nilai Skor</th>
                              <th className="py-2.5 px-3 text-center">Status Kelulusan</th>
                              <th className="py-2.5 px-3">Catatan Evaluasi Asesor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {assignedItems.map((item, i) => {
                              const isPassing = (item.score || 0) >= item.passingGrade;
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="py-3 px-3 font-mono font-bold text-slate-500">{i + 1}</td>
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-slate-900">{item.testTypeName}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[10px] text-slate-500">{item.category}</span>
                                      <span className="text-[10px] text-slate-300">•</span>
                                      <span className="text-[10px] text-indigo-700 font-medium">{item.format}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="font-semibold text-slate-800">{item.assessorName}</div>
                                    <span className="text-[10px] text-slate-500">[{item.assessorRole || 'Asesor'}]</span>
                                  </td>
                                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">
                                    {item.passingGrade}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className="font-mono font-black text-slate-900 text-sm">
                                      {item.score ?? '-'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                        isPassing
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {isPassing ? 'Lulus' : 'Tidak Lulus'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 max-w-xs">
                                    <p className="text-[11px] text-slate-600 line-clamp-2" title={item.evaluationNotes}>
                                      {item.evaluationNotes || 'Nilai tersimpan dalam pipeline kandidat.'}
                                    </p>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* KOTAK KEPUTUSAN HASIL AKHIR (SESUAI SYARAT USER & WAJIB CONFIRM MODAL) */}
                    <div className="p-5 rounded-2xl border space-y-4 bg-slate-50 border-slate-200">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span>Keputusan Kelanjutan Proses Pelamar</span>
                        </h4>
                        <p className="text-[11px] text-slate-600">
                          {isAllTestsPassed
                            ? 'Nilai pelamar memenuhi / melampaui passing grade acuan. Anda dapat meloloskan pelamar ke tahap Wawancara (User) atau memindahkannya ke Talent Pool untuk prioritas formasi mendatang.'
                            : 'Nilai pelamar berada di bawah passing grade acuan. Rekomendasi utama adalah memindahkan pelamar ke Talent Pool atau melakukan penolakan resmi.'}
                        </p>
                      </div>

                      {/* Pilihan Aksi Bersyarat Sesuai Nilai */}
                      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                        {isAllTestsPassed ? (
                          <>
                            {/* OPSI JIKA LEBIH DARI / MEMENUHI PASSING GRADE */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsAssessmentModalOpen(false);
                                setConfirmTalentPoolCandidate(currentCandidate);
                              }}
                              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs"
                              title="Pindahkan pelamar ke Talent Pool melalui dialog konfirmasi"
                            >
                              <FolderPlus className="w-4 h-4 text-amber-700" />
                              <span>Masukan ke Talent Pool</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsAssessmentModalOpen(false);
                                setConfirmInterviewCandidate(currentCandidate);
                              }}
                              className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-700/20 flex items-center justify-center gap-2 transition-all"
                              title="Loloskan pelamar ke tahap Wawancara melalui dialog konfirmasi"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Loloskan ke Wawancara (User) →</span>
                            </button>
                          </>
                        ) : (
                          <>
                            {/* OPSI JIKA DI BAWAH PASSING GRADE */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsAssessmentModalOpen(false);
                                setConfirmRejectCandidate(currentCandidate);
                              }}
                              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs"
                              title="Tolak pelamar dan kirim pesan penolakan resmi"
                            >
                              <UserX className="w-4 h-4 text-rose-700" />
                              <span>Tolak Pelamar (Kirim Email Penolakan)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsAssessmentModalOpen(false);
                                setConfirmTalentPoolCandidate(currentCandidate);
                              }}
                              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all"
                              title="Masukan pelamar ke Talent Pool melalui dialog konfirmasi"
                            >
                              <FolderPlus className="w-4 h-4" />
                              <span>Masukan ke Talent Pool (Rekomendasi)</span>
                            </button>
                          </>
                        )}
                      </div>

                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2 text-[10px] text-slate-500">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          Sesuai SOP HR, setiap keputusan pemindahan ke Talent Pool maupun pelolosan ke Wawancara <strong>wajib melalui modal konfirmasi</strong> sebelum status pelamar diperbarui.
                        </span>
                      </div>
                    </div>

                    {/* Footer Navigasi Tahap 3 */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setAssessmentWizardStep(2)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali ke Input Nilai (Tahap 2)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAssessmentModalOpen(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================== MODAL DIALOG: PREVIEW PENGIRIMAN KONTEN & LINK TES KE PELAMAR ===================== */}
      {previewSendTestConfig && activeCandidate && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewSendTestConfig(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Dialog */}
            <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-400" />
                  <span>Kirim Konten & Link Ujian Tes Kompetensi ke Pelamar</span>
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Pratinjau konten instruksi soal, batas waktu berlaku, dan tautan sekali pakai sebelum dikirim ke email kandidat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSendTestConfig(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badan Pesan Email / Undangan Resmi */}
            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Metadata Penerima */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Nama Kandidat:</span>
                  <span className="font-bold text-slate-900">{activeCandidate.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Email Penerima:</span>
                  <span className="font-mono font-bold text-blue-700">{activeCandidate.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Posisi Lowongan:</span>
                  <span className="font-semibold text-slate-800">{activeCandidate.vacancyTitle || 'Formasi Terpilih'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Masa Berlaku Link (Sekali Pakai):</span>
                  <span className="font-bold text-emerald-700">{previewSendTestConfig.tokenExpiresAt || '24 Jam sejak dikirim'}</span>
                </div>
              </div>

              {/* Tampilan Konten Surat Resmi */}
              <div className="border border-blue-200 rounded-xl p-4 space-y-3 bg-blue-50/20">
                <div className="border-b border-blue-100 pb-2">
                  <span className="text-[10px] text-blue-700 uppercase font-black tracking-wider block">
                    Subjek Email Resmi:
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                    [Nusantara HRMS] Undangan & Instruksi Resmi Pengerjaan: {previewSendTestConfig.testTypeName}
                  </h4>
                </div>

                <div className="space-y-3 text-slate-700 leading-relaxed text-xs">
                  <p>
                    Halo <strong>{activeCandidate.name}</strong>,
                  </p>
                  <p>
                    Sebagai bagian dari tahapan seleksi kompetensi untuk posisi <strong>{activeCandidate.vacancyTitle}</strong>, Anda dijadwalkan untuk mengikuti <strong>{previewSendTestConfig.testTypeName}</strong> ({previewSendTestConfig.category}) dengan durasi pengerjaan <strong>{previewSendTestConfig.durationMinutes || 60} menit</strong>.
                  </p>

                  {/* Kotak Deskripsi Tes */}
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                    <span className="font-bold text-slate-900 text-[11px] block text-indigo-700">
                      📋 Deskripsi & Instruksi Pengerjaan Tes:
                    </span>
                    <p className="text-slate-800 text-xs whitespace-pre-wrap">
                      {previewSendTestConfig.testDescription || 'Lakukan pengujian teknis sesuai skenario yang diberikan pada portal ujian.'}
                    </p>
                  </div>

                  {/* Kotak Output yang Diharapkan */}
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                    <span className="font-bold text-slate-900 text-[11px] block text-emerald-700">
                      🎯 Output yang Diharapkan (Deliverables):
                    </span>
                    <p className="text-slate-800 text-xs whitespace-pre-wrap">
                      {previewSendTestConfig.expectedOutput || 'Submit link pengerjaan serta catatan solusi pada formulir pengumpulan portal tes.'}
                    </p>
                  </div>

                  {/* Tautan Ujian Sekali Pakai */}
                  <div className="p-3.5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl space-y-2">
                    <span className="text-[11px] text-blue-200 block font-semibold">
                      🔗 Tautan Akses Portal Ujian Resmi (One-Time Link):
                    </span>
                    <div className="p-2 bg-black/40 rounded border border-white/20 font-mono text-xs text-blue-300 break-all select-all font-bold">
                      {`${window.location.origin}/?testToken=${previewSendTestConfig.testToken}`}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Link hanya dapat digunakan 1 (satu) kali. Timer pengerjaan akan otomatis berjalan saat Anda menekan tombol "Mulai Pengerjaan Tes".
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Aksi Dialog */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyFullContent(previewSendTestConfig)}
                  className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copyContentSuccess === previewSendTestConfig.testTypeId ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Seluruh Konten Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copy Seluruh Konten & Link</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenTestPageInNewTab(previewSendTestConfig.testToken)}
                  className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  title="Buka tampilan portal pelamar di tab baru"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview Portal</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewSendTestConfig(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSendOnlineTestLink(previewSendTestConfig.testTypeId)}
                  disabled={isSendingTestLink[previewSendTestConfig.testTypeId]}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSendingTestLink[previewSendTestConfig.testTypeId]
                      ? 'Mengirim ke Pelamar...'
                      : 'Kirim Email Resmi Sekarang'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* ===================== MODAL 6: INTERVIEW & SCORECARD ADAPTIF (3 TAHAP TERPADU) ===================== */}
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
                    <span>Wawancara & Evaluasi Panel Seleksi</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      Pipeline Interview
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

            {/* Stepper Wizard Navigation: Tahap 1 -> Tahap 2 -> Tahap 3 */}
            <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto w-full">
                {/* Step 1 */}
                <button
                  type="button"
                  onClick={() => setInterviewStep(1)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    interviewStep === 1
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    interviewStep === 1 ? 'bg-white text-indigo-700' : 'bg-slate-300 text-slate-700'
                  }`}>
                    1
                  </span>
                  <span>Jadwal & Tim Panel</span>
                </button>

                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

                {/* Step 2 */}
                <button
                  type="button"
                  onClick={() => setInterviewStep(2)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    interviewStep === 2
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    interviewStep === 2 ? 'bg-white text-indigo-700' : 'bg-slate-300 text-slate-700'
                  }`}>
                    2
                  </span>
                  <span>Input Nilai per User ({assignedInterviewers.filter(i => i.status !== 'Berhalangan').length} Panelis)</span>
                </button>

                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

                {/* Step 3 */}
                <button
                  type="button"
                  onClick={() => setInterviewStep(3)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    interviewStep === 3
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    interviewStep === 3 ? 'bg-white text-indigo-700' : 'bg-slate-300 text-slate-700'
                  }`}>
                    3
                  </span>
                  <span>Hasil Akhir & Keputusan Objektif</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* ===================== TAHAP 1: JADWAL DAN PANEL ===================== */}
              {interviewStep === 1 && (
                <div className="space-y-4">
                  {/* Jenis Wawancara Master Selection */}
                  <div className="p-3.5 bg-gradient-to-br from-indigo-50/70 to-blue-50/50 border border-indigo-200/80 rounded-xl space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <Award className="w-4 h-4 text-indigo-600" />
                        <span>Jenis Wawancara *</span>
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
                        <span>+ Kelola Master Jenis Wawancara</span>
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
                            {t.name} — Target: {t.targetRole || 'Semua'} ({t.criteria.length} Aspek Kriteria Scorecard)
                          </option>
                        ))}
                    </select>

                    {currentSelectedInterviewType?.description && (
                      <p className="text-[11px] text-slate-600 italic bg-white/70 p-2 rounded border border-indigo-100/60">
                        💡 <strong>Panduan Sesi:</strong> {currentSelectedInterviewType.description}
                      </p>
                    )}
                  </div>

                  {/* Input Jadwal (Tanggal, Jam Mulai, Jam Selesai) */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span>Jadwal Wawancara & Alokasi Waktu *</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Tanggal Wawancara *
                        </label>
                        <input
                          type="date"
                          value={interviewDateOnly}
                          onChange={(e) => {
                            setInterviewDateOnly(e.target.value);
                            setInterviewDate(`${e.target.value} ${interviewStartTime}`);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Jam Mulai *
                        </label>
                        <input
                          type="time"
                          value={interviewStartTime}
                          onChange={(e) => {
                            setInterviewStartTime(e.target.value);
                            setInterviewDate(`${interviewDateOnly} ${e.target.value}`);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Jam Selesai *
                        </label>
                        <input
                          type="time"
                          value={interviewTimeEnd}
                          onChange={(e) => setInterviewTimeEnd(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Format Wawancara: Offline vs Online */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-indigo-600" />
                        <span>Format Sesi Wawancara *</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInterviewFormat('Online')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            interviewFormat === 'Online'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Online (Video Call)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInterviewFormat('Offline')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            interviewFormat === 'Offline'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Offline (Tatap Muka di Kantor)</span>
                        </button>
                      </div>
                    </div>

                    {/* JIKA ONLINE: MELAMPIRKAN LINK */}
                    {interviewFormat === 'Online' ? (
                      <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-semibold text-blue-950 block mb-1">
                              Platform Online Meeting *
                            </label>
                            <select
                              value={['Google Meet', 'Microsoft Teams', 'Zoom Meeting'].includes(interviewPlatform) ? interviewPlatform : 'Lainnya'}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'Lainnya') {
                                  setInterviewPlatform('Lainnya' as any);
                                } else {
                                  setInterviewPlatform(val as any);
                                }
                              }}
                              className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                            >
                              <option value="Google Meet">Google Meet</option>
                              <option value="Microsoft Teams">Microsoft Teams</option>
                              <option value="Zoom Meeting">Zoom Meeting</option>
                              <option value="Lainnya">Lainnya (Platform Kustom)...</option>
                            </select>
                            {(!['Google Meet', 'Microsoft Teams', 'Zoom Meeting'].includes(interviewPlatform) || interviewPlatform === 'Lainnya') && (
                              <div className="mt-2">
                                <label className="font-semibold text-blue-950 block mb-1 text-[11px]">
                                  Nama Platform Online Lainnya *
                                </label>
                                <input
                                  type="text"
                                  value={interviewPlatform === 'Lainnya' ? '' : interviewPlatform}
                                  onChange={(e) => setInterviewPlatform(e.target.value as any)}
                                  placeholder="Contoh: Cisco Webex, Lark Meeting, Skype, Discord..."
                                  className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="font-semibold text-blue-950 block mb-1">
                              Tautan / Link Online Wawancara *
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="url"
                                value={interviewMeetingLink}
                                onChange={(e) => setInterviewMeetingLink(e.target.value)}
                                placeholder="https://meet.google.com/xyz-abc atau https://zoom.us/j/123"
                                className="w-full px-3 py-2 border border-blue-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (navigator.clipboard) {
                                    navigator.clipboard.writeText(interviewMeetingLink);
                                    setToastFeedback('Link meeting berhasil disalin ke clipboard!');
                                  }
                                }}
                                className="px-2.5 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-semibold shrink-0"
                                title="Salin link meeting"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <a
                                href={interviewMeetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shrink-0"
                                title="Uji buka link meeting"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-blue-800">
                          ℹ️ Tautan ini akan dilampirkan otomatis pada email kalender (.ics) dan pesan WhatsApp ke kandidat dan seluruh panelis.
                        </p>
                      </div>
                    ) : (
                      /* JIKA OFFLINE: PILIH FASILITAS RUANGAN GA & BOOKING */
                      <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-amber-700" />
                            <span>Pilih Fasilitas Ruangan (Reference Modul GA) *</span>
                          </label>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200 text-amber-900">
                            Booking ID: {interviewFacilityRoomBookingId}
                          </span>
                        </div>

                        <select
                          value={interviewOfflineRoom}
                          onChange={(e) => setInterviewOfflineRoom(e.target.value)}
                          className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-white font-medium text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 shadow-2xs"
                        >
                          {Object.entries(OFFLINE_ASSESSMENT_ROOM_CATALOG).map(([key, room]) => (
                            <option key={key} value={key}>
                              {room.name} ({room.location}) — Kapasitas {room.capacity}
                            </option>
                          ))}
                        </select>

                        {/* Room Details & Facilities Display */}
                        {(() => {
                          const roomData = OFFLINE_ASSESSMENT_ROOM_CATALOG[interviewOfflineRoom] || OFFLINE_ASSESSMENT_ROOM_CATALOG['Ruang Asesmen Talent Lab (Lt. 3 Gedung Pusat) — Kapasitas 8 Orang'];
                          return (
                            <div className="space-y-2 pt-1 border-t border-amber-200">
                              <div className="flex items-center gap-3 text-[11px] text-amber-900 font-medium">
                                <span>📍 Lokasi: <strong>{roomData.location}</strong></span>
                                <span>·</span>
                                <span>👥 Kapasitas: <strong>{roomData.capacity}</strong></span>
                                <span>·</span>
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Ruangan Terbooking untuk {interviewDateOnly} ({interviewStartTime} - {interviewTimeEnd} WIB)</span>
                                </span>
                              </div>

                              {/* Default Available Facilities */}
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-amber-950 tracking-wider block">
                                  Fasilitas & Peralatan Default yang Sudah Tersedia di Ruangan:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {roomData.defaultFacilities.map((fac, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded bg-white border border-amber-200 text-amber-900 text-[11px] font-medium flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span>{fac}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Available By Request Facilities */}
                              <div className="space-y-1 pt-1.5">
                                <span className="text-[10px] uppercase font-bold text-amber-950 tracking-wider block">
                                  Fasilitas Tambahan yang Disediakan By Request GA:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {roomData.availableRequestFacilities.map((reqFac, idx) => {
                                    const isSelected = interviewOfflineRequestedFacilities.includes(reqFac);
                                    return (
                                      <label
                                        key={idx}
                                        className={`p-1.5 rounded-lg border flex items-center gap-2 cursor-pointer text-[11px] transition-colors ${
                                          isSelected
                                            ? 'bg-amber-100 border-amber-400 text-amber-950 font-semibold'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setInterviewOfflineRequestedFacilities([...interviewOfflineRequestedFacilities, reqFac]);
                                            } else {
                                              setInterviewOfflineRequestedFacilities(interviewOfflineRequestedFacilities.filter(f => f !== reqFac));
                                            }
                                          }}
                                          className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                                        />
                                        <span>{reqFac}</span>
                                      </label>
                                    );
                                  })}
                                </div>

                                {/* Manual Input Pemisah Koma atau Titik Koma */}
                                <div className="pt-2 border-t border-amber-200 mt-2">
                                  <label className="text-[10px] font-bold text-amber-950 block mb-1">
                                    Fasilitas & Peralatan Tambahan yang Diperlukan (Input manual pemisah koma ',' atau titik koma ';'):
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={interviewOfflineRequestedFacilities.join(', ')}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const parsed = val
                                        .split(/[,;]+/)
                                        .map((s) => s.trim())
                                        .filter(Boolean);
                                      setInterviewOfflineRequestedFacilities(parsed);
                                    }}
                                    placeholder="Contoh: Sound System & Wireless Clip-on Mic; Layar Display TV Monitor 55 Inch, Kabel LAN High-Speed..."
                                    className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-amber-500 font-medium"
                                  />
                                  <span className="text-[9.5px] text-amber-900 block mt-0.5">
                                    💡 Pisahkan dengan koma (,) atau titik koma (;) untuk request peralatan tambahan ke modul GA.
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Penugasan Tim Pewawancara (User): Min 1, Max 5 */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span>Penugasan Tim Pewawancara / Panelis (User) *</span>
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Minimal 1 orang, maksimal 5 orang. Setiap panelis dapat diubah sewaktu-waktu dengan pencatatan histori dan alasan.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsInterviewerSelectorOpen(!isInterviewerSelectorOpen)}
                        disabled={assignedInterviewers.length >= 5}
                        className={`px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs ${
                          assignedInterviewers.length >= 5
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-700 hover:bg-indigo-800 text-white'
                        }`}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Tambah Pewawancara ({assignedInterviewers.length}/5)</span>
                      </button>
                    </div>

                    {/* Picker Karyawan Internal (Foto, Nama, NIK, Jabatan) */}
                    {isInterviewerSelectorOpen && (
                      <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-300 rounded-xl space-y-2.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                            <UserPlus className="w-4 h-4 text-indigo-700" />
                            <span>Pilih Karyawan Internal untuk Menjadi Tim Pewawancara Panel:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsInterviewerSelectorOpen(false)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="bg-white p-2 rounded-xl border border-indigo-200">
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Cari & Pilih Karyawan (Foto, Nama, NIK, Jabatan):
                          </label>
                          <EmployeeSelectDropdown
                            employees={companyEmployees}
                            onSelect={(emp) => handleAddInterviewer(emp)}
                            placeholder="-- Cari Karyawan Internal (Foto, Nama, NIK, Jabatan) --"
                          />
                        </div>

                        <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white shadow-2xs">
                          {companyEmployees.map((emp) => {
                            const isAssigned = assignedInterviewers.some(
                              (inv) => inv.id === emp.id || inv.name.toLowerCase() === emp.fullName.toLowerCase()
                            );
                            return (
                              <div
                                key={emp.id}
                                className={`p-2.5 flex items-center justify-between text-xs transition-colors ${
                                  isAssigned ? 'bg-slate-50 opacity-60' : 'hover:bg-indigo-50/60'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {/* Foto Avatar / Inisial */}
                                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-indigo-50 flex items-center justify-center">
                                    {emp.avatar ? (
                                      <img src={emp.avatar} alt={emp.rawName} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[10px] font-bold text-indigo-700">{emp.initials}</span>
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-slate-900 block truncate">{emp.fullName}</span>
                                      <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                        {emp.nik}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 block truncate">
                                      {emp.position} · <strong className="text-slate-600">{emp.department}</strong>
                                    </span>
                                  </div>
                                </div>

                                {isAssigned ? (
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200 shrink-0">
                                    Sudah Ditugaskan
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAddInterviewer(emp)}
                                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-2xs shrink-0"
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

                    {/* List Assigned Interviewers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {assignedInterviewers.map((inv, index) => {
                        const isBerhalangan = inv.status === 'Berhalangan';
                        return (
                          <div
                            key={inv.id}
                            className={`p-3 rounded-xl border flex items-start justify-between gap-2 transition-all shadow-2xs ${
                              isBerhalangan
                                ? 'bg-rose-50/60 border-rose-200 opacity-75'
                                : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                                isBerhalangan
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-indigo-100 text-indigo-700'
                              }`}>
                                {index + 1}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs">{inv.name}</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${
                                    isBerhalangan
                                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                    {inv.status || 'Terkonfirmasi'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-600 font-medium">
                                  {inv.title}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {inv.department} · {inv.email}
                                </div>
                                {inv.notes && (
                                  <div className="text-[10px] text-rose-700 italic">
                                    Catatan: {inv.notes}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenChangeInterviewer(inv)}
                                className="px-2 py-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-semibold transition-colors flex items-center gap-1"
                                title="Ganti pewawancara atau tandai berhalangan hadir"
                              >
                                <RefreshCw className="w-3 h-3 text-indigo-600" />
                                <span>Ganti</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveInterviewer(inv.id)}
                                disabled={assignedInterviewers.length <= 1}
                                className={`p-1 rounded transition-colors ${
                                  assignedInterviewers.length <= 1
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title={assignedInterviewers.length <= 1 ? 'Minimal 1 pewawancara' : 'Hapus pewawancara'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Histori Pergantian Tim Pewawancara */}
                  {activeCandidate.interviewerChangeHistory && activeCandidate.interviewerChangeHistory.length > 0 && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <History className="w-4 h-4 text-slate-600" />
                        <span>Riwayat Histori Pergantian Tim Pewawancara ({activeCandidate.interviewerChangeHistory.length}):</span>
                      </span>
                      <div className="space-y-1.5">
                        {activeCandidate.interviewerChangeHistory.map((item) => (
                          <div key={item.id} className="p-2 bg-white rounded-lg border border-slate-200 text-[11px] flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-slate-800">
                                {item.action}: <span className="text-slate-600">{item.previousInterviewer}</span>
                                {item.newInterviewer && <span> ➔ <strong className="text-indigo-700">{item.newInterviewer}</strong></span>}
                              </div>
                              <div className="text-slate-500 mt-0.5">
                                Alasan: <span className="italic font-medium text-slate-700">{item.reason}</span> · Oleh: {item.recordedBy}
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0 pl-2">
                              {item.timestamp}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kirim Undangan ke Tim Penugasan dan Pelamar */}
                  <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                        <Send className="w-4 h-4 text-emerald-700" />
                        <span>Kirim Undangan ke Tim Penugasan & Pelamar</span>
                      </span>
                      <p className="text-[11px] text-emerald-800">
                        Kirim notifikasi email undangan kalender (.ics) dan WhatsApp ke kandidat & tim panelis. Termasuk push notifikasi ke aplikasi HRMS ini.
                      </p>
                      {activeCandidate.interviewNotificationsSent && (
                        <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Undangan sudah dikirimkan pada: {activeCandidate.interviewNotificationsSentAt || 'Sebelumnya'}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSendInterviewInvitations}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-2xs shrink-0 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{activeCandidate.interviewNotificationsSent ? 'Kirim Ulang Undangan' : 'Kirim Undangan Sekarang'}</span>
                    </button>
                  </div>

                  {/* Reschedule Fitur (Setelah dikirim adalah pilihan Reschedule, dengan agenda jenis wawancara yang sama) */}
                  <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-orange-950 text-xs flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span>Pilihan Reschedule Jadwal (Agenda Jenis Wawancara Tetap Sama)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsRescheduleOpen(!isRescheduleOpen)}
                        className="px-2.5 py-1 rounded bg-orange-200 hover:bg-orange-300 text-orange-900 font-semibold text-xs transition-colors"
                      >
                        {isRescheduleOpen ? 'Tutup Form Reschedule' : 'Buka Form Reschedule'}
                      </button>
                    </div>

                    {isRescheduleOpen && (
                      <div className="p-3 bg-white border border-orange-300 rounded-lg space-y-3 pt-2">
                        <p className="text-[11px] text-orange-800">
                          Agenda Wawancara Tetap: <strong>{currentSelectedInterviewType?.name}</strong>. Silakan ubah tanggal/jam dan masukkan alasan reschedule:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="font-semibold text-slate-700 block mb-1">Tanggal Baru *</label>
                            <input
                              type="date"
                              value={interviewDateOnly}
                              onChange={(e) => setInterviewDateOnly(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-700 block mb-1">Jam Mulai Baru *</label>
                            <input
                              type="time"
                              value={interviewStartTime}
                              onChange={(e) => setInterviewStartTime(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-700 block mb-1">Jam Selesai Baru *</label>
                            <input
                              type="time"
                              value={interviewTimeEnd}
                              onChange={(e) => setInterviewTimeEnd(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Alasan Reschedule *</label>
                          <select
                            value={rescheduleReason}
                            onChange={(e) => setRescheduleReason(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                          >
                            <option value="Permintaan Kandidat (Penyesuaian Jadwal / Sakit)">Permintaan Kandidat (Penyesuaian Jadwal / Sakit)</option>
                            <option value="Pewawancara User Berhalangan (Rapat Mendesak / Tugas Luar)">Pewawancara User Berhalangan (Rapat Mendesak / Tugas Luar)</option>
                            <option value="Kendala Teknis / Jaringan Internet Ruangan">Kendala Teknis / Jaringan Internet Ruangan</option>
                            <option value="Penyesuaian Ketersediaan Ruangan Kantor GA">Penyesuaian Ketersediaan Ruangan Kantor GA</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Catatan Tambahan Reschedule</label>
                          <input
                            type="text"
                            value={rescheduleNotes}
                            onChange={(e) => setRescheduleNotes(e.target.value)}
                            placeholder="Contoh: Kandidat mengkonfirmasi berhalangan pagi, digeser ke sesi siang."
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={handleConfirmReschedule}
                            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Konfirmasi & Kirim Update Reschedule</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Reschedule History List */}
                    {activeCandidate.rescheduleHistory && activeCandidate.rescheduleHistory.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-orange-200">
                        <span className="text-[10px] uppercase font-bold text-orange-950 tracking-wider block">
                          Riwayat Reschedule Sebelumnya ({activeCandidate.rescheduleHistory.length}):
                        </span>
                        {activeCandidate.rescheduleHistory.map((item, idx) => (
                          <div key={idx} className="p-1.5 bg-white rounded border border-orange-200 text-[10px] text-slate-700 flex items-center justify-between">
                            <span>#{idx + 1}: {item.previousDate} ➔ <strong>{item.newDate}</strong> ({item.reason})</span>
                            <span className="text-slate-400 font-mono">{item.rescheduledAt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===================== TAHAP 2: INPUT NILAI PER USER / PANELIS ===================== */}
              {interviewStep === 2 && (
                <div className="space-y-4">
                  {/* Panelist Selector Navigation Tabs */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>Pilih User / Tim Pewawancara untuk Input Nilai:</span>
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Setiap panelis menginput penilaian dan rekomendasinya masing-masing secara independen.
                      </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {assignedInterviewers.filter(i => i.status !== 'Berhalangan').map((inv) => {
                        const isSelected = activeInterviewerScoringId === inv.id;
                        const hasScore = inv.calculatedScore && inv.calculatedScore > 0;
                        return (
                          <button
                            key={inv.id}
                            type="button"
                            onClick={() => setActiveInterviewerScoringId(inv.id)}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all whitespace-nowrap shrink-0 ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-500 shadow-2xs ring-1 ring-indigo-500'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {inv.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <span>{inv.name}</span>
                                {hasScore ? (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                    ★ {inv.averageStars} ({inv.calculatedScore}/100)
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-100 text-amber-800">
                                    Belum Dinilai
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 block">
                                {inv.role || inv.title}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Panelist Scoring Form */}
                  {(() => {
                    const currentPanelist = assignedInterviewers.find(i => i.id === activeInterviewerScoringId) || assignedInterviewers[0];
                    if (!currentPanelist) return null;

                    const panelistRatings = currentPanelist.scorecardRatings || {};
                    const panelistCriteria = currentSelectedInterviewType?.criteria || [];

                    return (
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                          <div>
                            <span className="font-bold text-slate-900 text-sm block flex items-center gap-1.5">
                              <span>Form Evaluasi Nilai: </span>
                              <strong className="text-indigo-700">{currentPanelist.name}</strong>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                                {currentPanelist.role || currentPanelist.title}
                              </span>
                            </span>
                            <span className="text-[11px] text-slate-500 mt-0.5 block">
                              Format: <strong>{currentSelectedInterviewType?.name}</strong> · Berikan rating bintang 1 - 5 per kriteria:
                            </span>
                          </div>

                          <div className="text-right bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                            <span className="text-[10px] text-indigo-700 uppercase tracking-wider font-semibold block">
                              Skor Panelis Ini
                            </span>
                            <span className="font-mono text-base font-bold text-indigo-950">
                              ★ {currentPanelist.averageStars || 4.0} / 5.0
                              <span className="text-xs text-indigo-600 font-semibold ml-1.5">
                                ({currentPanelist.calculatedScore || 80}/100)
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Interactive Criteria Rating (1 - 5 Stars) */}
                        <div className="space-y-3">
                          {panelistCriteria.map((crit, idx) => {
                            const val = panelistRatings[crit.id] || 4;

                            const getStarLabel = (s: number) => {
                              switch (s) {
                                case 5: return { label: '5/5 · Sangat Istimewa (Exceeds)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
                                case 4: return { label: '4/5 · Baik (Meets Expectations)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
                                case 3: return { label: '3/5 · Cukup (Perlu Supervisi)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
                                case 2: return { label: '2/5 · Kurang Memuaskan', color: 'text-orange-700 bg-orange-50 border-orange-200' };
                                case 1: return { label: '1/5 · Sangat Kurang', color: 'text-rose-700 bg-rose-50 border-rose-200' };
                                default: return { label: `${s}/5`, color: 'text-slate-700 bg-slate-50 border-slate-200' };
                              }
                            };

                            const starBadge = getStarLabel(val);

                            return (
                              <div
                                key={crit.id}
                                className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg space-y-2 hover:border-slate-300 transition-colors"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                                      {idx + 1}
                                    </span>
                                    <span className="font-semibold text-slate-900 text-xs">{crit.name}</span>
                                    {crit.weightPercent && (
                                      <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 text-[10px] font-mono">
                                        Bobot {crit.weightPercent}%
                                      </span>
                                    )}
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${starBadge.color}`}>
                                    {starBadge.label}
                                  </span>
                                </div>

                                {crit.description && (
                                  <p className="text-[11px] text-slate-500 italic pl-6">{crit.description}</p>
                                )}

                                <div className="pl-6 flex items-center gap-1.5 pt-1">
                                  {[1, 2, 3, 4, 5].map((starVal) => (
                                    <button
                                      key={starVal}
                                      type="button"
                                      onClick={() => handleUpdatePanelistRating(currentPanelist.id, crit.id, starVal)}
                                      className={`w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${
                                        val >= starVal
                                          ? 'bg-amber-400 text-slate-950 border border-amber-500 shadow-2xs hover:scale-105'
                                          : 'bg-white text-slate-300 border border-slate-200 hover:bg-amber-100 hover:text-amber-500'
                                      }`}
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Rekomendasi per User (Sangat cocok, Dipertimbangkan, Kurang cocok, Tidak cocok) */}
                        <div className="p-3.5 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-200 rounded-xl space-y-2">
                          <label className="font-bold text-slate-900 text-xs block">
                            Rekomendasi Panelis {currentPanelist.name} *
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { key: 'Sangat cocok', label: '🌟 Sangat cocok', desc: 'Sangat direkomendasikan hire' },
                              { key: 'Dipertimbangkan', label: '⚠️ Dipertimbangkan', desc: 'Memenuhi syarat / Talent Pool' },
                              { key: 'Kurang cocok', label: '🔍 Kurang cocok', desc: 'Perlu kualifikasi tambahan' },
                              { key: 'Tidak cocok', label: '❌ Tidak cocok', desc: 'Tidak sesuai kriteria posisi' },
                            ].map((opt) => {
                              const isRecActive = currentPanelist.recommendation === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => handleUpdatePanelistRecommendation(currentPanelist.id, opt.key as any)}
                                  className={`p-2.5 rounded-lg border text-left transition-all ${
                                    isRecActive
                                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50/60'
                                  }`}
                                >
                                  <span className="font-bold text-xs block">{opt.label}</span>
                                  <span className={`text-[10px] block mt-0.5 ${
                                    isRecActive ? 'text-indigo-100' : 'text-slate-500'
                                  }`}>
                                    {opt.desc}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Catatan Evaluasi per User */}
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Catatan Evaluasi / Feedback Kualitatif ({currentPanelist.name}) *
                          </label>
                          <textarea
                            rows={3}
                            value={currentPanelist.evaluationNotes || ''}
                            onChange={(e) => handleUpdatePanelistNotes(currentPanelist.id, e.target.value)}
                            placeholder={`Tuliskan catatan evaluasi, kelebihan kandidat, dan catatan penting dari ${currentPanelist.name}...`}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setToastFeedback(`Nilai dan rekomendasi dari ${currentPanelist.name} berhasil tersimpan!`);
                            }}
                            className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Simpan Nilai Panelis Ini</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Summary Comparison Table of All Panelists */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-600" />
                        <span>Rekapitulasi Penilaian Seluruh Tim Pewawancara Panel:</span>
                      </span>
                      <span className="text-[11px] font-bold text-indigo-700">
                        Rata-rata Keseluruhan: ★ {calculatedInterviewScore.averageStars} / 5.0 ({calculatedInterviewScore.totalScore}/100)
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2">No</th>
                            <th className="p-2">Nama Pewawancara</th>
                            <th className="p-2">Jabatan / Role</th>
                            <th className="p-2 text-center">Bintang</th>
                            <th className="p-2 text-center">Skor (0-100)</th>
                            <th className="p-2">Rekomendasi User</th>
                            <th className="p-2">Catatan Evaluasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                          {assignedInterviewers.map((inv, idx) => (
                            <tr key={inv.id} className={inv.status === 'Berhalangan' ? 'opacity-50 bg-slate-50' : ''}>
                              <td className="p-2 font-mono font-bold text-slate-500">{idx + 1}</td>
                              <td className="p-2 font-semibold text-slate-900">{inv.name}</td>
                              <td className="p-2 text-slate-600">{inv.role || inv.title}</td>
                              <td className="p-2 text-center font-mono font-bold text-amber-600">
                                {inv.status === 'Berhalangan' ? '-' : `★ ${inv.averageStars || 4.0}`}
                              </td>
                              <td className="p-2 text-center font-mono font-bold text-indigo-900">
                                {inv.status === 'Berhalangan' ? 'Berhalangan' : `${inv.calculatedScore || 80}`}
                              </td>
                              <td className="p-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  inv.recommendation === 'Sangat cocok' ? 'bg-emerald-100 text-emerald-800' :
                                  inv.recommendation === 'Dipertimbangkan' ? 'bg-blue-100 text-blue-800' :
                                  inv.recommendation === 'Kurang cocok' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {inv.recommendation || 'Sangat cocok'}
                                </span>
                              </td>
                              <td className="p-2 text-slate-600 truncate max-w-xs" title={inv.evaluationNotes}>
                                {inv.evaluationNotes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== TAHAP 3: PEMBOBOTAN DAN KEPUTUSAN OBJEKTIF ===================== */}
              {interviewStep === 3 && systemObjectiveEvaluation && (
                <div className="space-y-4">
                  {/* Explanatory Rule-based formula banner */}
                  <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-1">
                    <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-700" />
                      <span>a. Formula Pembobotan Kelulusan Objektif (Non-AI Audit Compliance)</span>
                    </h4>
                    <p className="text-[11px] text-indigo-800 leading-relaxed">
                      Sistem menghitung kelayakan secara formulaik dan transparan berbasis standar ISO/SOP Rekrutmen Perusahaan: <strong>Hasil Tes Kemampuan / Asesmen Teknis (Bobot 40%)</strong> dikombinasikan dengan <strong>Hasil Tes Wawancara Panel (Bobot 60%)</strong> serta konsensus rekomendasi dari tim user pewawancara.
                    </p>
                  </div>

                  {/* 4 Metrics Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-center space-y-1 shadow-2xs">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                        1. Tes Kemampuan (40%)
                      </span>
                      <span className="font-mono text-2xl font-black text-slate-900 block">
                        {systemObjectiveEvaluation.testScore}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Kontribusi: {(systemObjectiveEvaluation.testScore * 0.4).toFixed(1)} poin
                      </span>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-center space-y-1 shadow-2xs">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                        2. Tes Wawancara (60%)
                      </span>
                      <span className="font-mono text-2xl font-black text-indigo-700 block">
                        {systemObjectiveEvaluation.interviewScore}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Kontribusi: {(systemObjectiveEvaluation.interviewScore * 0.6).toFixed(1)} poin
                      </span>
                    </div>

                    <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl text-center space-y-1 shadow-2xs">
                      <span className="text-[10px] text-indigo-700 uppercase tracking-wider font-bold block">
                        3. Skor Akhir (Komposit)
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
                      <div className="font-bold text-xs text-slate-900 line-clamp-2 mt-1">
                        {systemObjectiveEvaluation.userRecSummary}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-medium">
                        Konsensus Panelis User
                      </span>
                    </div>
                  </div>

                  {/* Decision Verdict Banner: b. Hasil Penilaian Sistem */}
                  <div className={`p-4 rounded-xl border space-y-2 ${
                    systemObjectiveEvaluation.status === 'Sangat Direkomendasikan'
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                      : systemObjectiveEvaluation.status === 'Direkomendasikan Lolos'
                      ? 'bg-blue-50/90 border-blue-300 text-blue-950'
                      : systemObjectiveEvaluation.status === 'Dipertimbangkan'
                      ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                      : 'bg-rose-50/90 border-rose-300 text-rose-950'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {systemObjectiveEvaluation.status === 'Sangat Direkomendasikan' || systemObjectiveEvaluation.status === 'Direkomendasikan Lolos' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : systemObjectiveEvaluation.status === 'Dipertimbangkan' ? (
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600" />
                        )}
                        <span className="font-bold text-sm">
                          b. Hasil Penilaian Sistem: {systemObjectiveEvaluation.status}
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
                        <button
                          type="button"
                          onClick={() => {
                            handleSaveInterview();
                            updateCandidateStage(activeCandidate.id, 'Medical Check-Up', {
                              mcuStatus: 'Dijadwalkan',
                              mcuDate: new Date().toISOString().split('T')[0],
                            });
                            setIsInterviewModalOpen(false);
                            setToastFeedback(`Kandidat ${activeCandidate.name} diloloskan ke tahap Medical Check-Up (MCU)!`);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <HeartPulse className="w-3.5 h-3.5" />
                          <span>Lanjutkan ke Medical Check-Up (MCU)</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* c. Kriteria Kelayakan SOP Rekrutmen */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 text-xs block">
                      c. Kriteria Kelayakan SOP Rekrutmen:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>1. Nilai Tes Kemampuan: <strong>{systemObjectiveEvaluation.testScore}</strong> (Passing grade min. 70)</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>2. Skor Tes Wawancara Panel: <strong>{systemObjectiveEvaluation.interviewScore}</strong> (Passing grade min. 75)</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>3. Tim Panelis Bertugas: <strong>{assignedInterviewers.filter(i => i.status !== 'Berhalangan').length} Orang</strong> (Ketentuan 1-5 panelis terpenuhi)</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>4. Konsensus User: <strong>{systemObjectiveEvaluation.userRecSummary}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Tahap: <strong>Langkah {interviewStep} dari 3</strong></span>
                <span>·</span>
                <span>Pewawancara: <strong>{assignedInterviewers.length} Orang</strong></span>
                {systemObjectiveEvaluation && (
                  <>
                    <span>·</span>
                    <span className="text-indigo-700 font-semibold">
                      Skor Komposit: {systemObjectiveEvaluation.compositeScore}/100
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsInterviewModalOpen(false)}
                  className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Tutup
                </button>

                {interviewStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setInterviewStep((interviewStep - 1) as any)}
                    className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali ke Tahap {interviewStep - 1}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveInterview}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Data</span>
                </button>

                {interviewStep === 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveInterview();
                      setInterviewStep(2);
                    }}
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Lanjutkan ke Input Nilai (Tahap 2)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {interviewStep === 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveInterview();
                      setInterviewStep(3);
                    }}
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Lanjutkan ke Hasil Akhir & Keputusan (Tahap 3)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {interviewStep === 3 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveInterview();
                        updateCandidateStage(activeCandidate.id, 'Medical Check-Up', {
                          mcuStatus: 'Dijadwalkan',
                          mcuDate: new Date().toISOString().split('T')[0],
                        });
                        setIsInterviewModalOpen(false);
                        setToastFeedback(`Kandidat ${activeCandidate.name} diloloskan ke tahap Medical Check-Up (MCU)!`);
                      }}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                      title="Loloskan kandidat ke pemeriksaan kesehatan Medical Check-Up"
                    >
                      <HeartPulse className="w-4 h-4" />
                      <span>Lanjut Medical Check Up</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleProceedToOfferingFromInterview}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                      title="Lanjutkan ke penerbitan surat penawaran kerja (Offering Letter)"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Lanjutkan ke Proses Offering</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL SUB-DIALOG: GANTI PANELIS / PANELIS BERHALANGAN ===================== */}
      {isChangeInterviewerModalOpen && targetInterviewerToChange && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsChangeInterviewerModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Ganti / Pewawancara Berhalangan</h4>
                  <p className="text-[11px] text-slate-300">Pencatatan resmi audit histori pergantian panelis</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangeInterviewerModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                  Pewawancara yang Mengalami Perubahan:
                </span>
                <span className="font-bold text-slate-900 text-xs block mt-0.5">
                  {targetInterviewerToChange.name}
                </span>
                <span className="text-[11px] text-slate-600 block">
                  {targetInterviewerToChange.title} · {targetInterviewerToChange.department}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1.5">
                  Jenis Tindakan *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInterviewerChangeAction('Ganti Pewawancara')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      interviewerChangeAction === 'Ganti Pewawancara'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-semibold ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold text-xs">🔄 Ganti Panelis</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Tugaskan karyawan lain</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInterviewerChangeAction('Pewawancara Berhalangan')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      interviewerChangeAction === 'Pewawancara Berhalangan'
                        ? 'bg-rose-50 border-rose-500 text-rose-950 font-semibold ring-1 ring-rose-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold text-xs">⛔ Berhalangan Hadir</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Tandai tidak bisa hadir</span>
                  </button>
                </div>
              </div>

              {interviewerChangeAction === 'Ganti Pewawancara' && (
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Pilih Karyawan Pengganti (Foto, Nama, NIK, Jabatan) *
                  </label>
                  <EmployeeSelectDropdown
                    employees={companyEmployees.filter(e => !assignedInterviewers.some(inv => inv.id === e.id))}
                    selectedId={replacementEmployeeId}
                    onSelect={(emp) => setReplacementEmployeeId(emp.id)}
                    placeholder="-- Pilih Karyawan Pengganti (Foto, Nama, NIK, Jabatan) --"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Alasan Pergantian / Berhalangan *
                </label>
                <textarea
                  rows={2}
                  value={interviewerChangeReason}
                  onChange={(e) => setInterviewerChangeReason(e.target.value)}
                  placeholder="Contoh: Rapat mendesak dengan Direksi / Tugas luar kota / Sakit..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsChangeInterviewerModalOpen(false)}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveInterviewerChange}
                className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-semibold text-xs shadow-2xs"
              >
                Simpan Perubahan & Catat Riwayat
              </button>
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

      {/* ===================== MODAL 6C: MEDICAL CHECK-UP (MCU) RECORDING & FIT EVALUATION ===================== */}
      {isMcuModalOpen && mcuCandidate && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMcuModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-teal-950 via-slate-900 to-teal-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Pencatatan & Evaluasi Medical Check-Up (MCU)</span>
                    <span className="text-[10px] bg-teal-800 text-teal-200 border border-teal-600 font-mono px-2 py-0.5 rounded-full">
                      Pra-Kerja
                    </span>
                  </h3>
                  <p className="text-xs text-teal-200 mt-0.5">
                    {mcuCandidate.name} · {vacancies.find((v) => v.id === mcuCandidate.jobVacancyId)?.title || 'Posisi Lowongan'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMcuModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveMcu} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Summary Card */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider block">Kandidat Terpilih:</span>
                  <span className="font-bold text-slate-900 text-sm">{mcuCandidate.name}</span>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    Email: {mcuCandidate.email} • WhatsApp: {mcuCandidate.phone}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Departemen Formasi</span>
                  <span className="font-semibold text-teal-900 bg-white px-2 py-0.5 rounded border border-teal-200 text-xs">
                    {vacancies.find((v) => v.id === mcuCandidate.jobVacancyId)?.department || 'Umum'}
                  </span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Klinik / Rumah Sakit / Lab Rujukan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={mcuClinic}
                    onChange={(e) => setMcuClinic(e.target.value)}
                    placeholder="Contoh: RS Siloam Semanggi / Prodia Lab"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tanggal Pemeriksaan MCU <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={mcuDate}
                    onChange={(e) => setMcuDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Paket Pemeriksaan Kesehatan Pra-Kerja
                </label>
                <select
                  value={mcuPackage}
                  onChange={(e) => setMcuPackage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs outline-hidden focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Paket Standar Pra-Kerja (Darah Lengkap, Rontgen Thorax, Urin, Fisik)">
                    Paket Standar Pra-Kerja (Darah Lengkap, Rontgen Thorax, Urin, Fisik)
                  </option>
                  <option value="Paket Eksekutif (Jantung/EKG, Kolesterol, Liver, Ginjal, Thorax)">
                    Paket Eksekutif (Jantung/EKG, Kolesterol, Liver, Ginjal, Thorax)
                  </option>
                  <option value="Paket Khusus Lapangan, Buta Warna & Skrining Narkotika">
                    Paket Khusus Lapangan, Buta Warna & Skrining Narkotika
                  </option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Hasil / Status Kelayakan Medis (Fit to Work) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { value: 'Fit (Lolos)', label: 'Fit (Lolos)', desc: 'Lolos Sehat & Siap Bekerja', badge: 'bg-emerald-50 border-emerald-300 text-emerald-800' },
                      { value: 'Fit with Note', label: 'Fit with Note', desc: 'Layak dengan Catatan Dokter', badge: 'bg-amber-50 border-amber-300 text-amber-800' },
                      { value: 'Menunggu Hasil Lab', label: 'Menunggu Lab', desc: 'Sampel Sedang Diuji', badge: 'bg-blue-50 border-blue-300 text-blue-800' },
                      { value: 'Dijadwalkan', label: 'Dijadwalkan', desc: 'Menunggu Tanggal Tes', badge: 'bg-slate-50 border-slate-300 text-slate-700' },
                      { value: 'Unfit (Gugur)', label: 'Unfit (Gugur)', desc: 'Tidak Memenuhi Standar Medis', badge: 'bg-rose-50 border-rose-300 text-rose-800' },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                        mcuStatus === opt.value
                          ? `${opt.badge} ring-2 ring-teal-500/30 font-bold`
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">{opt.label}</span>
                        <input
                          type="radio"
                          name="mcuStatus"
                          value={opt.value}
                          checked={mcuStatus === opt.value}
                          onChange={() => setMcuStatus(opt.value)}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal mt-1 leading-tight">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Catatan Evaluasi Dokter / Laboratorium
                </label>
                <textarea
                  rows={2}
                  value={mcuNotes}
                  onChange={(e) => setMcuNotes(e.target.value)}
                  placeholder="Contoh: Tekanan darah 120/80 mmHg normal, rontgen thorax normal, tes buta warna bebas, bebas zat terlarang. Dinyatakan Fit for Work."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-teal-500 resize-none"
                />
              </div>

              {/* Upload Certificate Mockup */}
              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-teal-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800 block text-xs">Dokumen Hasil Lab Terlampir</span>
                    <span className="text-[10px] text-slate-500">Hasil_MCU_{mcuCandidate.name.replace(/\s+/g, '_')}_Official.pdf (Terverifikasi)</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Terverifikasi
                </span>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsMcuModalOpen(false)}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs transition-colors"
                >
                  Tutup
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Hasil MCU</span>
                  </button>
                  {(mcuStatus === 'Fit (Lolos)' || mcuStatus === 'Fit with Note') && (
                    <button
                      type="button"
                      onClick={() => {
                        const isFit = mcuStatus === 'Fit (Lolos)' || mcuStatus === 'Fit with Note';
                        const decision: Candidate['mcuDecision'] = isFit ? 'Lolos ke Offering' : 'Perlu Pemeriksaan Ulang';
                        updateCandidateStage(mcuCandidate.id, mcuCandidate.stage, {
                          mcuDate,
                          mcuClinicOrHospital: mcuClinic,
                          mcuPackage,
                          mcuStatus,
                          mcuNotes,
                          mcuDecision: decision,
                        });
                        setIsMcuModalOpen(false);
                        handlePromoteToOffering(mcuCandidate);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Simpan & Lanjut ke Offering →</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
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
                const targetVac = vacancies.find((v) => v.id === candVacancyId) || vacancies[0];

                addCandidate({
                  jobVacancyId: candVacancyId,
                  name: defaultName,
                  email: candEmail || `${defaultName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                  phone: candPhone || '081234567890',
                  lastCompany: candCompany || 'Pelamar Baru',
                  expectedSalary: targetVac?.maxSalary || 15000000,
                  stage: 'Incoming',
                  sourcePortal: candSource || 'Upload Manual',
                  resumeParsed: true,
                  cvFileName: finalFileName,
                  cvFileSize: finalFileSize,
                  parsedData: {
                    fullName: defaultName,
                    email: candEmail || `${defaultName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                    phone: candPhone || '081234567890',
                    currentTitle: targetVac?.title || 'Professional Specialist',
                    currentCompany: candCompany || 'Pelamar Baru',
                    totalExperienceYears: 3,
                    education: 'S1 Sarjana',
                    university: 'Universitas Terkemuka',
                    topSkills: ['Problem Solving', 'Communication', 'Technical Proficiency'],
                    extractionScore: 100,
                    parsedAt: new Date().toISOString().split('T')[0],
                  },
                });
                setIsCandidateModalOpen(false);
                setCandName('');
                setUploadedCv(null);
                setToastFeedback(`File CV PDF '${finalFileName}' untuk '${defaultName}' berhasil disimpan ke Pipeline Incoming!`);
              }}
              className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto"
            >
              {/* 1. UPLOAD FILE CV DROPZONE */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Berkas CV (Wajib Format PDF) <span className="text-rose-500">*</span></span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Maksimal 10 MB</span>
                </label>

                <input
                  type="file"
                  id="cv-manual-upload-input"
                  accept=".pdf,application/pdf"
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
                      Klik untuk Pilih File PDF CV atau Drag & Drop ke sini
                    </span>
                    <span className="text-[10px] text-blue-700 font-medium">
                      Format Wajib: Hanya file PDF (.pdf) • Maksimal 10 MB
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
                          <span>Ukuran: {uploadedCv.size} • Berkas Terlampir</span>
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

              {/* DATA PELAMAR: HANYA NAMA LENGKAP, POSISI LOWONGAN, DAN KANAL ASAL/SUMBER PELAMAR */}
              <div className="pt-2 border-t border-slate-100 space-y-3.5">
                {/* 2. NAMA LENGKAP */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nama Lengkap Pelamar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    placeholder="Contoh: Raditya Pratama, S.Kom."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                {/* 3. POSISI LOWONGAN */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Posisi Lowongan yang Dilamar <span className="text-rose-500">*</span>
                  </label>
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

                {/* 4. KANAL ASAL / SUMBER PELAMAR */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Kanal Asal / Sumber Pelamar <span className="text-rose-500">*</span>
                  </label>
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
              </div>

              {/* ACTION BUTTONS: BATAL & SIMPAN */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan</span>
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

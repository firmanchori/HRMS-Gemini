import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  Users,
  UserPlus,
  ArrowUpRight,
  Search,
  Filter,
  FileText,
  Calendar,
  CheckCircle,
  Building,
  Briefcase,
  X,
  ShieldCheck,
  CreditCard,
  HeartHandshake,
  GraduationCap,
  Home,
  Phone,
  FileCheck,
  Plus,
  Edit3,
  Camera,
  CheckSquare,
  Square,
  Sparkles,
  Settings,
  AlertCircle,
  UserCheck,
  Network,
  Award,
  FileClock,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { EmploymentType, PTKPStatus, Employee, FamilyMember, EmergencyContact, OnboardingProcess } from '../../types/hrms';
import { formatRupiah, getTERCategory } from '../../utils/taxCalculator';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { CurrencyInput } from '../common/CurrencyInput';
import { ValidatedDateInput } from '../common/ValidatedDateInput';
import { validateBirthDate, validateDateString } from '../../utils/dateValidator';
import { OrgChartManagement } from './OrgChartManagement';
import { ScrollableTabNav } from '../common/ScrollableTabNav';
import { ProbationManagement } from './ProbationManagement';
import { ContractRenewalManagement } from './ContractRenewalManagement';

export const DOSSIER_TABS = [
  { id: 'kepegawaian', label: 'Kepegawaian & Posisi', shortLabel: 'Posisi', icon: Briefcase },
  { id: 'identitas', label: 'Identitas Kependudukan', shortLabel: 'KTP/KK', icon: UserCheck },
  { id: 'pajak', label: 'Pajak & Jaminan BPJS', shortLabel: 'Pajak/BPJS', icon: ShieldCheck },
  { id: 'finansial', label: 'Remunerasi & Bank', shortLabel: 'Gaji/Bank', icon: CreditCard },
  { id: 'pendidikan', label: 'Pendidikan & Kualifikasi', shortLabel: 'Pendidikan', icon: GraduationCap },
  { id: 'keluarga', label: 'Keluarga & Darurat', shortLabel: 'Keluarga', icon: HeartHandshake },
  { id: 'riwayat', label: 'Riwayat SK Karier', shortLabel: 'SK/Mutasi', icon: FileClock },
] as const;

export type DossierTabId = typeof DOSSIER_TABS[number]['id'];

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
];

export const EmployeeManagement: React.FC = () => {
  const {
    employees,
    addEmployee,
    updateEmployee,
    currentTenant,
    candidates,
    onboardingProcesses,
    addOnboardingProcess,
    updateOnboardingTask,
    completeOnboarding,
    moduleSettings,
    updateModuleSettings,
    openFilePreview,
    personaliaLogs,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'karyawan' | 'onboarding' | 'orgchart' | 'probation' | 'contracts' | 'pengaturan'>('karyawan');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');

  // Modals
  const [isOnboardingChoiceOpen, setIsOnboardingChoiceOpen] = useState(false);
  const [isRecruitmentOnboardingOpen, setIsRecruitmentOnboardingOpen] = useState(false);
  const [isDirectOnboardingOpen, setIsDirectOnboardingOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<DossierTabId>('kepegawaian');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const currentTabIndex = DOSSIER_TABS.findIndex((t) => t.id === detailModalTab);
  const handlePrevTab = () => {
    if (currentTabIndex > 0) {
      setDetailModalTab(DOSSIER_TABS[currentTabIndex - 1].id);
    }
  };
  const handleNextTab = () => {
    if (currentTabIndex < DOSSIER_TABS.length - 1) {
      setDetailModalTab(DOSSIER_TABS[currentTabIndex + 1].id);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      // Swiped left -> Next tab
      handleNextTab();
    } else if (diff < -50) {
      // Swiped right -> Previous tab
      handlePrevTab();
    }
    setTouchStartX(null);
  };

  const offeredCandidates = candidates.filter((c) => c.stage === 'Offered' || c.stage === 'Hired');
  const [selectedCandidateId, setSelectedCandidateId] = useState(offeredCandidates[0]?.id || '');

  // Direct Onboarding Form State (Pathway 2)
  const [addStep, setAddStep] = useState<1 | 2 | 3 | 4>(1);
  const [newAvatar, setNewAvatar] = useState(AVATAR_PRESETS[0]);
  const [newName, setNewName] = useState('');
  const [newNik, setNewNik] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPersonalEmail, setNewPersonalEmail] = useState('');
  const [newPhone, setNewPhone] = useState('0812' + Math.floor(10000000 + Math.random() * 90000000));
  const [newType, setNewType] = useState<EmploymentType>('Tetap');
  const [newContractDoc, setNewContractDoc] = useState('');
  const [newDept, setNewDept] = useState('Engineering');
  const [newPosition, setNewPosition] = useState('');
  const [newGrade, setNewGrade] = useState('L3');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProbationStatus, setNewProbationStatus] = useState<'Lolos' | 'Sedang Berjalan' | 'Tanpa Percobaan'>('Sedang Berjalan');

  // Identitas KTP/KK
  const [newNikKtp, setNewNikKtp] = useState('3174' + Math.floor(100000000000 + Math.random() * 900000000000));
  const [newNoKk, setNewNoKk] = useState('3174' + Math.floor(100000000000 + Math.random() * 900000000000));
  const [newBirthPlace, setNewBirthPlace] = useState('Jakarta');
  const [newBirthDate, setNewBirthDate] = useState('1995-05-20');
  const [newGender, setNewGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [newReligion, setNewReligion] = useState<any>('Islam');
  const [newMaritalStatus, setNewMaritalStatus] = useState<any>('Lajang');
  const [newKtpAddress, setNewKtpAddress] = useState('Jl. Jenderal Sudirman No. 25, Jakarta Selatan');
  const [newCurrentAddress, setNewCurrentAddress] = useState('Jl. Jenderal Sudirman No. 25, Jakarta Selatan');

  // Pajak & BPJS
  const [newNpwp, setNewNpwp] = useState('12.345.678.9-012.000');
  const [newPtkp, setNewPtkp] = useState<PTKPStatus>('TK/0');
  const [newKpp, setNewKpp] = useState('KPP Pratama Jakarta Selatan');
  const [newBpjsTk, setNewBpjsTk] = useState('24' + Math.floor(1000000000 + Math.random() * 9000000000));
  const [newBpjsKes, setNewBpjsKes] = useState('0001' + Math.floor(10000000 + Math.random() * 90000000));
  const [newFaskes, setNewFaskes] = useState('Puskesmas Kecamatan Setiabudi');

  // Gaji & Bank
  const [newBasicSalary, setNewBasicSalary] = useState<number>(10000000);
  const [newFixedAllow, setNewFixedAllow] = useState<number>(1500000);
  const [newTransportAllow, setNewTransportAllow] = useState<number>(800000);
  const [newMealAllow, setNewMealAllow] = useState<number>(700000);
  const [newPositionAllow, setNewPositionAllow] = useState<number>(500000);
  const [newBankName, setNewBankName] = useState('BCA');
  const [newBankAccount, setNewBankAccount] = useState(String(Math.floor(1000000000 + Math.random() * 9000000000)));

  // Pendidikan
  const [newDegree, setNewDegree] = useState<'SMA/SMK' | 'D3' | 'S1' | 'S2' | 'S3'>('S1');
  const [newInstitution, setNewInstitution] = useState('Universitas Indonesia');
  const [newMajor, setNewMajor] = useState('Teknik Informatika');
  const [newGradYear, setNewGradYear] = useState(2018);

  // Settings tab form state
  const [settNikPrefix, setSettNikPrefix] = useState(moduleSettings.employee.nikPrefix || 'NTM');
  const [settProbation, setSettProbation] = useState(moduleSettings.employee.probationDurationMonths || 3);
  const [settRetire, setSettRetire] = useState(moduleSettings.employee.defaultRetirementAge || 58);

  // Form Validation State
  const [formError, setFormError] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'info';
    title: string;
    description?: string;
  } | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (JPG, PNG, atau WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran foto profil maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      (emp?.fullName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (emp?.nik || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (emp?.contractDocNumber || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (emp?.nikKtp || '').includes(searchQuery || '') ||
      (emp?.position || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesType = filterType === 'all' || emp.employmentType === filterType;
    const matchesDept = filterDept === 'all' || emp.department === filterDept;
    return matchesSearch && matchesType && matchesDept;
  });

  const departments = Array.from(new Set(employees.map((e) => e.department)));

  const handlePreviewEmployeeContract = (emp: Employee) => {
    openFilePreview({
      title: `SURAT KEPUTUSAN PENGANGKATAN KARYAWAN (${emp.employmentType.toUpperCase()})`,
      documentNumber: emp.contractDocNumber || `012/HRD-SK/${emp.nik}/${new Date().getFullYear()}`,
      typeBadge: `Dokumen Legal: Perjanjian Kerja ${emp.employmentType}`,
      date: emp.contractStartDate || emp.joinDate,
      partyName: emp.fullName,
      partyRole: `${emp.position} · ${emp.department}`,
      statusBadge: {
        label: `Status Karyawan: ${emp.status}`,
        variant: 'success',
      },
      detailsGrid: [
        { label: 'Nomor Induk Karyawan (NIK)', value: emp.nik },
        { label: 'Jabatan / Posisi Kerja', value: emp.position },
        { label: 'Divisi / Departemen', value: emp.department },
        { label: 'Grade Golongan', value: emp.grade || 'M1' },
        { label: 'Status Hubungan Kerja', value: emp.employmentType },
        { label: 'Tanggal Mulai Bertugas', value: emp.joinDate },
        { label: 'Gaji Pokok Disepakati', value: formatRupiah(emp.basicSalary) },
        { label: 'Status Pajak PTKP', value: `${emp.ptkp} (${getTERCategory(emp.ptkp)})` },
        { label: 'Nomor NIK KTP', value: emp.nikKtp },
        { label: 'Nomor Kartu Keluarga (KK)', value: emp.noKk },
      ],
      contentParagraphs: [
        `Berdasarkan hasil uji kompetensi dan verifikasi administrasi kepegawaian, Manajemen ${currentTenant.name} dengan ini resmi menetapkan pengangkatan kerja atas nama ${emp.fullName} sebagai karyawan dengan skema ${emp.employmentType}.`,
        `Karyawan ditempatkan pada unit ${emp.department} dengan tugas pokok sebagai ${emp.position}, dan berhak atas seluruh benefit, asuransi BPJS Ketenagakerjaan & Kesehatan, serta remunerasi bulanan sesuai kesepakatan tertulis.`,
        `Keputusan ini memiliki kekuatan hukum yang sah dan mengikat kedua belah pihak sejak ditandatangani.`,
      ],
      signeeName: 'Aditya Pratama, S.Psi',
      signeeRole: 'VP of Human Capital & People Operation',
    });
  };

  // Handle Pathway 1: Onboarding via Rekrutmen
  const handleLaunchRecruitmentOnboarding = () => {
    const candidate = candidates.find((c) => c.id === selectedCandidateId);
    if (!candidate) return;

    const seq = employees.length + onboardingProcesses.length + 1;
    const code = currentTenant.code;
    const contractDocNumber = `${String(seq).padStart(3, '0')}/HRD-PKWT/${code}/XI/2026`;

    addOnboardingProcess({
      type: 'via_recruitment',
      candidateId: candidate.id,
      employeeName: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      position: 'Senior Specialist',
      department: 'Engineering',
      employmentType: 'Kontrak',
      joinDate: new Date().toISOString().split('T')[0],
      basicSalary: candidate.offeredSalary || candidate.expectedSalary || 15000000,
      contractDocNumber,
      tasks: [
        { id: 't1', title: 'Verifikasi Dokumen KTP, NPWP & BPJS Asli', category: 'Legalitas & Dokumen', isCompleted: true, completedAt: new Date().toISOString().split('T')[0], assignedRole: 'hr_admin' },
        { id: 't2', title: 'Penandatanganan Kontrak Kerja PKWT Digital QR', category: 'Legalitas & Dokumen', isCompleted: false, assignedRole: 'hr_admin' },
        { id: 't3', title: 'Penyediaan Laptop Kerja & Akses Sistem Email', category: 'Fasilitas & IT', isCompleted: false, assignedRole: 'ga_admin' },
        { id: 't4', title: 'Pendaftaran Rekening Payroll & Pajak TER 2024', category: 'Payroll & Rekening', isCompleted: false, assignedRole: 'payroll_admin' },
        { id: 't5', title: 'Pengenalan Tim Kerja & Budaya Perusahaan (Buddy)', category: 'Pengenalan & HR', isCompleted: false, assignedRole: 'hr_admin' },
      ],
    });

    setIsRecruitmentOnboardingOpen(false);
    setActiveTab('onboarding');
  };

  // Step navigation with strict validation and form errors
  const handleNextStep = () => {
    setFormError(null);
    if (addStep === 1) {
      if (!newName.trim()) {
        setFormError('Nama lengkap karyawan sesuai KTP wajib diisi');
        setShowValidationErrors(true);
        return;
      }
      if (!newPosition.trim()) {
        setFormError('Posisi / Jabatan kerja wajib diisi');
        setShowValidationErrors(true);
        return;
      }
      const joinCheck = validateDateString(newJoinDate);
      if (!joinCheck.isValid) {
        setFormError(`Tanggal Mulai Kerja tidak valid: ${joinCheck.errorMessage}`);
        setShowValidationErrors(true);
        return;
      }
    } else if (addStep === 2) {
      const birthCheck = validateBirthDate(newBirthDate, 17);
      if (!birthCheck.isValid) {
        setFormError(`Validasi Tanggal Lahir: ${birthCheck.errorMessage}`);
        setShowValidationErrors(true);
        return;
      }
    }
    setShowValidationErrors(false);
    setFormError(null);
    setAddStep((addStep + 1) as any);
  };

  // Handle Pathway 2: Direct Onboarding
  const handleDirectOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPosition) {
      setFormError('Nama lengkap dan posisi kerja wajib diisi!');
      setShowValidationErrors(true);
      setAddStep(1);
      return;
    }

    const joinCheck = validateDateString(newJoinDate);
    if (!joinCheck.isValid) {
      setFormError(`Tanggal Mulai Bertugas: ${joinCheck.errorMessage}`);
      setShowValidationErrors(true);
      setAddStep(1);
      return;
    }

    const birthCheck = validateBirthDate(newBirthDate, 17);
    if (!birthCheck.isValid) {
      setFormError(`Tanggal Lahir Karyawan: ${birthCheck.errorMessage}`);
      setShowValidationErrors(true);
      setAddStep(2);
      return;
    }

    if (!newBasicSalary || newBasicSalary <= 0) {
      setFormError('Gaji Pokok wajib diisi dengan angka valid di atas Rp 0!');
      setShowValidationErrors(true);
      setAddStep(4);
      return;
    }

    setFormError(null);
    setShowValidationErrors(false);

    const seq = employees.length + 1;
    const code = currentTenant.code;
    const docNo =
      newContractDoc ||
      `${String(seq).padStart(3, '0')}/HRD-${newType === 'Tetap' ? 'SK-TETAP' : 'PKWT'}/${code}/X/2026`;

    // Direct add as complete employee + create onboarding log
    const newEmp = addEmployee({
      nik: newNik || `${code}-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`,
      fullName: newName,
      avatar: newAvatar,
      email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '.')}@${code.toLowerCase()}.id`,
      personalEmail: newPersonalEmail || `${newName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      phone: newPhone,
      employmentType: newType,
      contractDocNumber: docNo,
      contractStartDate: newJoinDate,
      contractEndDate: newType === 'Kontrak' ? '2027-10-31' : undefined,
      permanentAppointmentDate: newType === 'Tetap' ? newJoinDate : undefined,
      probationStatus: newProbationStatus,
      department: newDept,
      position: newPosition,
      grade: newGrade,
      joinDate: newJoinDate,
      status: 'Aktif',
      remainingLeaveDays: 12,
      nikKtp: newNikKtp,
      noKk: newNoKk,
      birthPlace: newBirthPlace,
      birthDate: newBirthDate,
      gender: newGender,
      religion: newReligion,
      maritalStatus: newMaritalStatus,
      ktpAddress: newKtpAddress,
      currentAddress: newCurrentAddress,
      npwp: newNpwp,
      ptkp: newPtkp,
      kppPratama: newKpp,
      bpjsTkNo: newBpjsTk,
      bpjsKesNo: newBpjsKes,
      faskes1Bpjs: newFaskes,
      bankName: newBankName,
      bankAccount: newBankAccount,
      bankAccountHolder: newName,
      basicSalary: Number(newBasicSalary),
      fixedAllowance: Number(newFixedAllow),
      transportAllowance: Number(newTransportAllow),
      mealAllowance: Number(newMealAllow),
      positionAllowance: Number(newPositionAllow),
      lastEducationDegree: newDegree,
      institution: newInstitution,
      major: newMajor,
      graduationYear: Number(newGradYear),
      familyMembers: [],
      emergencyContacts: [
        {
          id: `emg-${Date.now()}`,
          fullName: 'Kontak Darurat Utama',
          relation: 'Orang Tua',
          phone: newPhone,
          address: newKtpAddress,
        },
      ],
    });

    addOnboardingProcess({
      type: 'direct',
      employeeName: newName,
      email: newEmail,
      phone: newPhone,
      position: newPosition,
      department: newDept,
      employmentType: newType,
      joinDate: newJoinDate,
      basicSalary: Number(newBasicSalary),
      contractDocNumber: docNo,
      createdEmployeeId: newEmp.id,
      tasks: [
        { id: 't1', title: 'Data Master Karyawan Terdaftar', category: 'Legalitas & Dokumen', isCompleted: true, completedAt: newJoinDate, assignedRole: 'hr_admin' },
        { id: 't2', title: 'Alokasi Fasilitas ID Card & Laptop', category: 'Fasilitas & IT', isCompleted: false, assignedRole: 'ga_admin' },
        { id: 't3', title: 'Verifikasi Buku Tabungan & Form Pajak TER 2024', category: 'Payroll & Rekening', isCompleted: true, completedAt: newJoinDate, assignedRole: 'payroll_admin' },
      ],
    });

    setIsDirectOnboardingOpen(false);
    setNewName('');
    setNewPosition('');
  };

  const handleSaveSettings = () => {
    updateModuleSettings('employee', {
      nikPrefix: settNikPrefix,
      probationDurationMonths: Number(settProbation),
      defaultRetirementAge: Number(settRetire),
    });
    setFeedbackMessage({
      type: 'success',
      title: 'Pengaturan Berhasil Disimpan',
      description: 'Konfigurasi modul master karyawan telah diperbarui dalam sistem.',
    });
  };

  return (
    <div className="space-y-5">
      {/* In-App Feedback Toast Banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between transition-all shadow-xs ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">{feedbackMessage.title}:</span>
              {feedbackMessage.description && (
                <span className="ml-1.5 text-slate-700">{feedbackMessage.description}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Row 1: Module Header & Main Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Manajemen Karyawan & Onboarding</span>
          </h2>
          <p className="text-xs text-slate-500">
            Dossier master data lengkap, alur penambahan karyawan wajib melalui proses onboarding (via rekrutmen atau langsung), dan foto profil karyawan.
          </p>
        </div>

        <button
          onClick={() => setIsOnboardingChoiceOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Tambah Karyawan (Onboarding)</span>
        </button>
      </div>

      {/* Row 2: Enterprise Tab Navigation Bar with Arrows & Mouse-Wheel Horizontal Scroll */}
      <ScrollableTabNav>
        <button
          onClick={() => setActiveTab('karyawan')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'karyawan'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Master Karyawan</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'karyawan'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {employees.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('onboarding')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'onboarding'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Proses Onboarding</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'onboarding'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {onboardingProcesses.filter((p) => p.status === 'In Progress').length} Berjalan
          </span>
        </button>

        <button
          onClick={() => setActiveTab('orgchart')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'orgchart'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Struktur Org & Tree</span>
        </button>

        <button
          onClick={() => setActiveTab('probation')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'probation'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Evaluasi Probation (H-14)</span>
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'contracts'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileClock className="w-3.5 h-3.5" />
          <span>Kontrak PKWT (H-30)</span>
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
          <span>Format NIK & Pengaturan</span>
        </button>
      </ScrollableTabNav>

      {activeTab === 'karyawan' && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar - Responsive Tablet & Mobile Friendly */}
          <div className="bg-white p-3 sm:p-3.5 border border-slate-200 rounded-xl shadow-xs space-y-2.5 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
            <div className="relative w-full lg:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama karyawan, NIK, KTP, jabatan, divisi..."
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-48 lg:w-48">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg py-2 px-3 bg-white font-medium text-slate-700 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="all">Semua Status Hubungan</option>
                  <option value="Tetap">Tetap (PKWTT)</option>
                  <option value="Kontrak">Kontrak (PKWT)</option>
                  <option value="Outsource">Outsource</option>
                  <option value="Magang">Magang (Intern)</option>
                </select>
              </div>

              <div className="relative flex-1 sm:w-48 lg:w-48">
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg py-2 px-3 bg-white font-medium text-slate-700 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="all">Semua Departemen</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {(filterType !== 'all' || filterDept !== 'all' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterType('all');
                    setFilterDept('all');
                    setSearchQuery('');
                  }}
                  className="col-span-full sm:col-span-2 lg:col-span-1 px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors font-semibold flex items-center justify-center gap-1 shadow-2xs"
                  title="Reset semua filter"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* TAMPILAN MOBILE: Card View Adaptif (< md) */}
          <div className="md:hidden space-y-3">
            {filteredEmployees.map((emp) => {
              const onb = onboardingProcesses.find(
                (o) =>
                  o.createdEmployeeId === emp.id ||
                  o.employeeName.toLowerCase() === emp.fullName.toLowerCase()
              );
              const isDone = onb?.status === 'Completed';
              const cTasks = onb?.tasks.filter((t) => t.isCompleted).length || 0;
              const tTasks = onb?.tasks.length || 0;

              return (
                <div
                  key={emp.id}
                  onClick={() => {
                    setDetailModalTab('kepegawaian');
                    setSelectedEmployee(emp);
                  }}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:border-indigo-300 transition-all cursor-pointer active:scale-[0.99] space-y-2.5"
                >
                  {/* Card Header: Avatar, Name, Employment Type */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      {emp.avatar ? (
                        <img
                          src={emp.avatar}
                          alt={emp.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                          {emp.fullName[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 text-sm leading-tight">
                          {emp.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                          <span className="font-bold text-indigo-700">{emp.nik}</span>
                          <span>·</span>
                          <span>{emp.phone}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        emp.employmentType === 'Tetap'
                          ? 'bg-emerald-100 text-emerald-800'
                          : emp.employmentType === 'Kontrak'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {emp.employmentType}
                    </span>
                  </div>

                  {/* Position & Department */}
                  <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[11px]">Jabatan & Divisi:</span>
                      <strong className="text-slate-900 text-[11px]">{emp.position}</strong>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>{emp.department}</span>
                      <span className="font-mono font-semibold text-slate-700">Grade {emp.grade || 'L3'}</span>
                    </div>
                  </div>

                  {/* Metadata Row: KTP, PTKP, Gaji */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Pajak & TER:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {emp.ptkp} ({getTERCategory(emp.ptkp)})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Gaji Pokok:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatRupiah(emp.basicSalary)}
                      </span>
                    </div>
                  </div>

                  {/* Onboarding Pill if applicable */}
                  {onb && (
                    <div className="pt-1">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          isDone
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isDone ? '✓ Onboarding Selesai' : `Onboarding Berjalan: ${cTasks}/${tTasks} Tugas`}
                      </span>
                    </div>
                  )}

                  {/* Card Action Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                      Ketuk kartu untuk melihat dossier lengkap
                    </div>

                    <div className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                      <span>Buka Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TAMPILAN TABLE: Menyesuaikan kolom secara responsif tanpa slide horizontal pada tablet */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Foto & Nama Karyawan</th>
                    <th className="py-2.5 px-3 font-semibold">Status & No. Kontrak</th>
                    <th className="py-2.5 px-3 font-semibold">Departemen & Jabatan</th>
                    <th className="py-2.5 px-3 font-semibold hidden xl:table-cell">Kependudukan (KTP/KK)</th>
                    <th className="py-2.5 px-3 font-semibold text-center hidden 2xl:table-cell">PTKP (TER 2024)</th>
                    <th className="py-2.5 px-3 font-semibold text-right hidden lg:table-cell">Gaji Pokok</th>
                    <th className="py-2.5 px-3 font-semibold text-center hidden 2xl:table-cell">Keluarga</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => {
                        setDetailModalTab('kepegawaian');
                        setSelectedEmployee(emp);
                      }}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                      title="Klik baris untuk membuka berkas dossier & dokumen kontrak karyawan"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          {emp.avatar ? (
                            <img
                              src={emp.avatar}
                              alt={emp.fullName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                              {emp.fullName[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{emp.fullName}</div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                              <span className="font-bold text-indigo-700">{emp.nik}</span>
                              <span>·</span>
                              <span>{emp.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            emp.employmentType === 'Tetap'
                              ? 'bg-emerald-100 text-emerald-800'
                              : emp.employmentType === 'Kontrak'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {emp.employmentType}
                        </span>
                        <div className="text-[10px] text-slate-600 font-mono truncate max-w-[170px] mt-0.5" title={emp.contractDocNumber}>
                          {emp.contractDocNumber}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <div className="font-semibold text-slate-800">{emp.position}</div>
                        <div className="text-[10px] text-slate-500">{emp.department} (Grade {emp.grade})</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] hidden xl:table-cell">
                        <div className="text-slate-800">KTP: {emp.nikKtp}</div>
                        <div className="text-[10px] text-slate-500">KK: {emp.noKk}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center hidden 2xl:table-cell">
                        <span className="font-mono font-bold text-slate-800">{emp.ptkp}</span>
                        <div className="text-[10px] text-indigo-700 font-mono font-semibold">
                          {getTERCategory(emp.ptkp)}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 hidden lg:table-cell">
                        {formatRupiah(emp.basicSalary)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700 hidden 2xl:table-cell">
                        {emp.familyMembers?.length || 0} Jiwa
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {emp.status}
                        </span>
                        {(() => {
                          const onb = onboardingProcesses.find(
                            (o) =>
                              o.createdEmployeeId === emp.id ||
                              o.employeeName.toLowerCase() === emp.fullName.toLowerCase()
                          );
                          if (!onb) return null;
                          const isDone = onb.status === 'Completed';
                          const cTasks = onb.tasks.filter((t) => t.isCompleted).length;
                          const tTasks = onb.tasks.length;
                          return (
                            <div className="mt-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab('onboarding');
                                }}
                                className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-colors hover:shadow-2xs ${
                                  isDone
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                }`}
                                title="Klik untuk membuka pelacakan proses onboarding"
                              >
                                {isDone ? '✓ Onboarding Selesai' : `Onb: ${cTasks}/${tTasks} Tugas`}
                              </button>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Tracker Tab */}
      {activeTab === 'onboarding' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-lg text-xs text-indigo-900 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Alur Onboarding Karyawan Terstruktur:</strong>
              Setiap karyawan yang bergabung (baik dari tahapan rekrutmen maupun direct hire) harus menyelesaikan checklist orientasi, verifikasi dokumen legalitas, alokasi aset GA, serta registrasi pajak TER 2024 & BPJS sebelum dinyatakan resmi aktif.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {onboardingProcesses.map((proc) => {
              const completedTasks = proc.tasks.filter((t) => t.isCompleted).length;
              const totalTasks = proc.tasks.length;
              const percent = Math.round((completedTasks / totalTasks) * 100);

              const linkedEmp = employees.find(
                (e) =>
                  e.id === proc.createdEmployeeId ||
                  e.fullName.toLowerCase() === proc.employeeName.toLowerCase()
              );
              const linkedCand = candidates.find((c) => c.id === proc.candidateId);

              return (
                <div key={proc.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {linkedEmp?.avatar ? (
                          <img
                            src={linkedEmp.avatar}
                            alt={proc.employeeName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                            {proc.employeeName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-sm">{proc.employeeName}</h4>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                proc.type === 'via_recruitment'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {proc.type === 'via_recruitment' ? 'Via Rekrutmen' : 'Direct Onboarding'}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-700">
                              {proc.employmentType}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5 font-medium">
                            {proc.position} · {proc.department}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                            {linkedEmp ? (
                              <>
                                <span className="font-bold text-indigo-700">NIK: {linkedEmp.nik}</span>
                                <span>·</span>
                                <span>KTP: {linkedEmp.nikKtp}</span>
                              </>
                            ) : (
                              <span className="text-purple-700 font-medium">
                                Staging Kandidat ({linkedCand?.stage || 'Tahap Seleksi'})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${
                          proc.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {proc.status === 'Completed' ? '✓ Onboarding Selesai' : 'Sedang Berjalan'}
                      </span>
                    </div>

                    {/* Metadata Summary Pill */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded border border-slate-100 text-[11px]">
                      <div>
                        <div className="text-slate-400 text-[10px]">Tgl Mulai Tugas</div>
                        <div className="font-mono font-semibold text-slate-800">{proc.joinDate}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Gaji Pokok</div>
                        <div className="font-mono font-bold text-slate-800">
                          {formatRupiah(proc.basicSalary || linkedEmp?.basicSalary || 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Pajak TER 2024</div>
                        <div className="font-mono font-semibold text-indigo-700">
                          {linkedEmp ? `${linkedEmp.ptkp} (${getTERCategory(linkedEmp.ptkp)})` : 'TK/0 (TER A)'}
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-3">
                        <div className="text-slate-400 text-[10px]">No. Dokumen Kontrak/SK</div>
                        <div className="font-mono text-slate-700 text-[10px] truncate" title={proc.contractDocNumber || linkedEmp?.contractDocNumber}>
                          {proc.contractDocNumber || linkedEmp?.contractDocNumber || 'Dibuat saat onboarding'}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>Checklist Onboarding & Fasilitas</span>
                        <span className="font-mono font-bold text-slate-800">
                          {completedTasks}/{totalTasks} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            percent === 100 ? 'bg-emerald-600' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Tasks List */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      {proc.tasks.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => updateOnboardingTask(proc.id, task.id, !task.isCompleted)}
                          className="w-full flex items-center justify-between text-left p-1.5 rounded hover:bg-slate-50 text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {task.isCompleted ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span
                              className={`truncate ${
                                task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800 font-medium'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                            {task.assignedRole}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Dossier Bridge */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      {linkedEmp ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <button
                            type="button"
                            onClick={() => {
                              setDetailModalTab('kepegawaian');
                              setSelectedEmployee(linkedEmp);
                            }}
                            className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded border border-indigo-200 transition-colors flex items-center justify-center gap-1"
                            title="Buka dossier lengkap karyawan ini di tab Master Karyawan"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Lihat Dossier Lengkap</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePreviewEmployeeContract(linkedEmp)}
                            className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded transition-colors flex items-center gap-1"
                            title="Preview Surat Keputusan Pengangkatan"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>Preview SK</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 italic py-1">
                          Kandidat akan otomatis dibuatkan akun master dan dossier setelah checklist selesai.
                        </div>
                      )}
                    </div>

                    {proc.status === 'In Progress' && percent === 100 && (
                      <button
                        type="button"
                        onClick={() => {
                          completeOnboarding(proc.id);
                          setFeedbackMessage({
                            type: 'success',
                            title: 'Onboarding Berhasil Diselesaikan',
                            description: `Seluruh checklist orientasi ${proc.employeeName} telah terpenuhi 100%. Data master karyawan telah aktif.`,
                          });
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Selesaikan Onboarding & Aktifkan Karyawan Resmi</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Pengaturan Modul Master Karyawan
            </h3>
            <p className="text-xs text-slate-500">
              Konfigurasi kode awalan NIK otomatis, durasi probation default, dan batas usia pensiun perusahaan.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Prefix Awalan NIK Karyawan
                </label>
                <input
                  type="text"
                  value={settNikPrefix}
                  onChange={(e) => setSettNikPrefix(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Format: {settNikPrefix}-YYYY-XXX</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Masa Percobaan Default (Probation)
                </label>
                <input
                  type="number"
                  min={1}
                  value={settProbation}
                  onChange={(e) => setSettProbation(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Bulan (Maks. 3 Bulan sesuai UU Cipta Kerja)</span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Batas Usia Pensiun Karyawan
              </label>
              <input
                type="number"
                value={settRetire}
                onChange={(e) => setSettRetire(Number(e.target.value))}
                className="w-32 px-3 py-1.5 border border-slate-300 rounded font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Tahun usia untuk otomatisasi notifikasi purnabakti</span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs"
              >
                Simpan Pengaturan Karyawan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 02B: Struktur Organisasi & Hierarki Tree */}
      {activeTab === 'orgchart' && <OrgChartManagement />}

      {/* 02C: Evaluasi Probation H-14 */}
      {activeTab === 'probation' && <ProbationManagement />}

      {/* 02D: Pengingat Kontrak PKWT H-30 */}
      {activeTab === 'contracts' && <ContractRenewalManagement />}

      {/* Modal: Pilihan Jalur Onboarding (Wajib Melalui Onboarding) */}
      {isOnboardingChoiceOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOnboardingChoiceOpen(false);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Pilih Alur Onboarding Karyawan Baru</h3>
                <span className="text-[11px] text-slate-400">Penambahan data wajib melalui tahapan onboarding</span>
              </div>
              <button onClick={() => setIsOnboardingChoiceOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Option 1: Via Rekrutmen */}
              <button
                onClick={() => {
                  setIsOnboardingChoiceOpen(false);
                  setIsRecruitmentOnboardingOpen(true);
                }}
                className="w-full p-4 border-2 border-indigo-200 hover:border-indigo-600 hover:bg-indigo-50/50 rounded-xl text-left transition-all group flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    1. Onboarding Melalui Rekrutmen Lengkap
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    Pilih kandidat yang telah lolos tahap wawancara dan offering letter. Data gaji, tunjangan, dan posisi otomatis terisi dari hasil seleksi.
                  </p>
                </div>
              </button>

              {/* Option 2: Direct Onboarding */}
              <button
                onClick={() => {
                  setIsOnboardingChoiceOpen(false);
                  setAddStep(1);
                  setIsDirectOnboardingOpen(true);
                }}
                className="w-full p-4 border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 rounded-xl text-left transition-all group flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    2. Onboarding Langsung (Direct Onboarding)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    Untuk karyawan baru yang masuk langsung (tanpa proses rekrutmen seperti lateral hire, transfer cabang, atau eksekutif). Isi data profil lengkap secara mandiri.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pathway 1: Via Rekrutmen */}
      {isRecruitmentOnboardingOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsRecruitmentOnboardingOpen(false);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Onboarding dari Pipeline Rekrutmen</h3>
                <span className="text-[11px] text-slate-400">Pilih kandidat berstatus Offered / Hired</span>
              </div>
              <button onClick={() => setIsRecruitmentOnboardingOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Pilih Kandidat yang Lolos *</label>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-medium text-slate-900"
                >
                  {offeredCandidates.length > 0 ? (
                    offeredCandidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — Gaji Ditawarkan: {formatRupiah(c.offeredSalary || c.expectedSalary)} ({c.stage})
                      </option>
                    ))
                  ) : (
                    <option value="">Tidak ada kandidat di tahap Offered/Hired</option>
                  )}
                </select>
              </div>

              {selectedCandidateId && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1 text-slate-700">
                  <div className="font-semibold text-slate-900">
                    {candidates.find((c) => c.id === selectedCandidateId)?.name}
                  </div>
                  <div>Email: {candidates.find((c) => c.id === selectedCandidateId)?.email}</div>
                  <div>Telepon: {candidates.find((c) => c.id === selectedCandidateId)?.phone}</div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecruitmentOnboardingOpen(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleLaunchRecruitmentOnboarding}
                  disabled={!selectedCandidateId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-semibold shadow-xs"
                >
                  Luncurkan Onboarding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pathway 2: Direct Onboarding Form */}
      {isDirectOnboardingOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDirectOnboardingOpen(false);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full h-[88vh] sm:h-[84vh] border border-slate-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold">Onboarding Langsung (Direct Onboarding Tanpa Rekrutmen)</h3>
                <span className="text-xs text-slate-400">Tahap {addStep} dari 4</span>
              </div>
              <button onClick={() => setIsDirectOnboardingOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            {/* Stepper Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs shrink-0 overflow-x-auto">
              {[
                { num: 1, label: '1. Profil & Jabatan' },
                { num: 2, label: '2. Identitas KTP/KK' },
                { num: 3, label: '3. Pajak & BPJS' },
                { num: 4, label: '4. Gaji & Rekening' },
              ].map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setAddStep(s.num as any)}
                  className={`font-semibold flex items-center gap-1.5 whitespace-nowrap ${
                    addStep === s.num ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                      addStep === s.num ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {s.num}
                  </span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleDirectOnboardingSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
                {/* Form Validation Error Notice */}
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

              {/* STEP 1: Profil & Jabatan */}
              {addStep === 1 && (
                <div className="space-y-4">
                  {/* Photo Profile File Uploader */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="font-semibold text-slate-800 block text-xs">
                      Upload Foto Profil Karyawan (Photo Profile) *
                    </label>
                    <div className="flex items-center gap-3.5 flex-wrap sm:flex-nowrap">
                      <div className="relative group shrink-0">
                        <img
                          src={newAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
                          alt="Preview Foto Karyawan"
                          className="w-14 h-14 rounded-full object-cover border-2 border-slate-300 shadow-sm"
                        />
                        <label
                          htmlFor="employee-photo-upload"
                          className="absolute inset-0 rounded-full bg-slate-950/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                          title="Klik untuk ganti foto"
                        >
                          <Camera className="w-4 h-4 text-white" />
                        </label>
                      </div>

                      <div className="flex-1 space-y-1.5 min-w-0">
                        <input
                          id="employee-photo-upload"
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor="employee-photo-upload"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                          >
                            <Camera className="w-3.5 h-3.5 text-slate-600" />
                            <span>Pilih File Foto Karyawan</span>
                          </label>
                          {newAvatar && (
                            <button
                              type="button"
                              onClick={() => setNewAvatar('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150')}
                              className="px-2 py-1 text-slate-500 hover:text-rose-600 text-xs font-medium"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Format: <strong>JPG, PNG, atau WEBP</strong> (Maks. 5 MB). Foto ini akan digunakan di dossier, kartu nama digital, dan slip gaji.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Nama Lengkap Sesuai KTP *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Raditya Pratama"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">NIK Internal (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Otomatis terisi jika kosong"
                        value={newNik}
                        onChange={(e) => setNewNik(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Email Kantor</label>
                      <input
                        type="email"
                        placeholder="nama@perusahaan.id"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Nomor Handphone / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Status Ketenagakerjaan</label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-medium"
                      >
                        <option value="Tetap">Tetap (PKWTT)</option>
                        <option value="Kontrak">Kontrak (PKWT)</option>
                        <option value="Outsource">Outsource</option>
                        <option value="Magang">Magang (Intern)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Departemen</label>
                      <input
                        type="text"
                        required
                        value={newDept}
                        onChange={(e) => setNewDept(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Posisi / Jabatan *</label>
                      <input
                        type="text"
                        required
                        placeholder="Lead Engineer"
                        value={newPosition}
                        onChange={(e) => {
                          setNewPosition(e.target.value);
                          if (formError) setFormError(null);
                        }}
                        className={`w-full px-3 py-2 border rounded font-medium ${
                          showValidationErrors && !newPosition.trim()
                            ? 'border-rose-500 bg-rose-50/20 text-rose-900'
                            : 'border-slate-300'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Validated Date Input for Join Date */}
                  <div className="pt-2 border-t border-slate-100">
                    <ValidatedDateInput
                      id="newJoinDate"
                      label="Tanggal Mulai Bertugas / Bergabung *"
                      value={newJoinDate}
                      onChange={(val) => {
                        setNewJoinDate(val);
                        if (formError) setFormError(null);
                      }}
                      required
                      showError={showValidationErrors}
                      helperText="Format YYYY-MM-DD. Tanggal resmi penempatan di entitas tenant"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Identitas KTP/KK */}
              {addStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Nomor KTP (16 Digit) *</label>
                      <input
                        type="text"
                        required
                        value={newNikKtp}
                        onChange={(e) => setNewNikKtp(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Nomor Kartu Keluarga (KK)</label>
                      <input
                        type="text"
                        value={newNoKk}
                        onChange={(e) => setNewNoKk(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Tempat Lahir</label>
                      <input
                        type="text"
                        value={newBirthPlace}
                        onChange={(e) => setNewBirthPlace(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <ValidatedDateInput
                        id="newBirthDate"
                        label="Tanggal Lahir *"
                        value={newBirthDate}
                        onChange={(val) => {
                          setNewBirthDate(val);
                          if (formError) setFormError(null);
                        }}
                        required
                        validateMode="birthDate"
                        showError={showValidationErrors}
                        helperText="Min. 17 tahun sesuai UU Ketenagakerjaan"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Jenis Kelamin</label>
                      <select
                        value={newGender}
                        onChange={(e) => setNewGender(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Alamat Sesuai KTP</label>
                    <textarea
                      rows={2}
                      value={newKtpAddress}
                      onChange={(e) => setNewKtpAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Pajak & BPJS */}
              {addStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Nomor NPWP</label>
                      <input
                        type="text"
                        value={newNpwp}
                        onChange={(e) => setNewNpwp(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Status PTKP (Ketenagakerjaan)</label>
                      <select
                        value={newPtkp}
                        onChange={(e) => setNewPtkp(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-mono font-semibold"
                      >
                        <option value="TK/0">TK/0 (Lajang tanpa tanggungan) - TER A</option>
                        <option value="TK/1">TK/1 (Lajang 1 tanggungan) - TER A</option>
                        <option value="K/0">K/0 (Menikah tanpa tanggungan) - TER A</option>
                        <option value="K/1">K/1 (Menikah 1 tanggungan) - TER B</option>
                        <option value="K/2">K/2 (Menikah 2 tanggungan) - TER B</option>
                        <option value="K/3">K/3 (Menikah 3 tanggungan) - TER C</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">No. BPJS Ketenagakerjaan (KPJ)</label>
                      <input
                        type="text"
                        value={newBpjsTk}
                        onChange={(e) => setNewBpjsTk(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">No. Kartu BPJS Kesehatan</label>
                      <input
                        type="text"
                        value={newBpjsKes}
                        onChange={(e) => setNewBpjsKes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Gaji & Rekening (dengan CurrencyInput format ribuan) */}
              {addStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <CurrencyInput
                      id="newBasicSalary"
                      label="Gaji Pokok Bulanan (IDR) *"
                      value={newBasicSalary}
                      onChange={(val) => {
                        setNewBasicSalary(val);
                        if (formError) setFormError(null);
                      }}
                      required
                      min={currentTenant.umr || 3000000}
                      showError={showValidationErrors}
                      helperText={`Standar UMR ${currentTenant.city}: ${formatRupiah(currentTenant.umr)}`}
                    />
                    <CurrencyInput
                      id="newFixedAllow"
                      label="Tunjangan Tetap (IDR)"
                      value={newFixedAllow}
                      onChange={(val) => setNewFixedAllow(val)}
                      showError={showValidationErrors}
                      helperText="Tunjangan jabatan atau keahlian"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Bank Payroll</label>
                      <select
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-medium"
                      >
                        <option value="BCA">Bank BCA</option>
                        <option value="Mandiri">Bank Mandiri</option>
                        <option value="BNI">Bank BNI</option>
                        <option value="BRI">Bank BRI</option>
                        <option value="CIMB">Bank CIMB Niaga</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Nomor Rekening Bank *</label>
                      <input
                        type="text"
                        required
                        value={newBankAccount}
                        onChange={(e) => setNewBankAccount(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              </div>

              {/* Fixed Footer Bar */}
              <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between shrink-0">
                {addStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setAddStep((addStep - 1) as any);
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs transition-colors"
                  >
                    ← Sebelumnya
                  </button>
                ) : (
                  <div></div>
                )}

                {addStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>Lanjutkan</span>
                    <span>→</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-xs shadow-xs transition-colors"
                  >
                    Simpan & Daftarkan Onboarding
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dossier Detail Karyawan Komprehensif (Multi-Tab Enterprise) */}
      {selectedEmployee && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedEmployee(null);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[90vh] sm:h-[86vh] border border-slate-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Profil Karyawan (Mobile Responsive) */}
            <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                {selectedEmployee.avatar ? (
                  <img
                    src={selectedEmployee.avatar}
                    alt={selectedEmployee.fullName}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-indigo-400 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-600 text-white font-bold text-base sm:text-lg flex items-center justify-center shrink-0">
                    {selectedEmployee.fullName[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                      {selectedEmployee.fullName}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        selectedEmployee.employmentType === 'Tetap'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}
                    >
                      {selectedEmployee.employmentType} (PKW{selectedEmployee.employmentType === 'Tetap' ? 'TT' : 'T'})
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono shrink-0">
                      Grade {selectedEmployee.grade || 'L3'}
                    </span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-400 font-mono flex items-center gap-1.5 sm:gap-2 mt-0.5 truncate">
                    <span className="text-indigo-400 font-bold">{selectedEmployee.nik}</span>
                    <span>·</span>
                    <span className="text-slate-300 truncate">{selectedEmployee.position}</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="text-slate-400 hidden sm:inline">{selectedEmployee.department}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => handlePreviewEmployeeContract(selectedEmployee)}
                  className="px-2.5 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Preview SK</span>
                </button>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dossier Enterprise Sub-Menu Tabs Navigation */}
            <ScrollableTabNav className="bg-slate-50 border-b border-slate-200" containerClassName="pt-1 px-2 sm:px-4">
              {DOSSIER_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = detailModalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDetailModalTab(tab.id)}
                    className={`pb-2.5 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
                      isActive
                        ? 'border-indigo-600 text-indigo-700 font-bold bg-white rounded-t-md shadow-2xs'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </button>
                );
              })}
            </ScrollableTabNav>

            {/* Sub-Header: Indikator Step Tab & Swipe Hint */}
            <div className="px-4 sm:px-6 py-1.5 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-[11px] font-mono text-indigo-900 shrink-0">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="text-indigo-600">Bagian {currentTabIndex + 1} dari {DOSSIER_TABS.length}:</span>
                <strong className="text-slate-900">{DOSSIER_TABS[currentTabIndex].label}</strong>
              </span>
              <span className="text-[10px] text-indigo-600 hidden sm:inline">
                Dapat digeser (swipe touch) atau tekan panah kiri / kanan
              </span>
            </div>

            {/* Modal Body Content (Ukuran Konsisten, Scroll Internal) */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs bg-slate-50/50"
            >
              {/* TAB 1: KEPEGAWAIAN & JABATAN */}
              {detailModalTab === 'kepegawaian' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      <span>Struktur Posisi & Hubungan Kerja</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Nomor Induk Karyawan (NIK)</span>
                        <strong className="font-mono text-indigo-700 text-sm">{selectedEmployee.nik}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Jabatan / Posisi Resmi</span>
                        <strong className="text-slate-900 text-xs">{selectedEmployee.position}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Divisi / Departemen</span>
                        <strong className="text-slate-800 text-xs">{selectedEmployee.department}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Grade Eselon</span>
                        <strong className="text-slate-800 font-mono text-xs">
                          {selectedEmployee.grade || 'L3'} · Eselon Operasional
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Atasan Langsung (Direct Supervisor)</span>
                        <strong className="text-indigo-800 text-xs">
                          {selectedEmployee.directSupervisor || 'Ir. Budi Santoso (President Director)'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Lokasi Kerja / Cabang</span>
                        <strong className="text-slate-900 text-xs">
                          {selectedEmployee.branchLocation || 'Kantor Pusat Jakarta (Menara Palma)'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Status Ketenagakerjaan</span>
                        <strong className="text-emerald-700 text-xs">
                          {selectedEmployee.employmentType} (PKW{selectedEmployee.employmentType === 'Tetap' ? 'TT' : 'T'})
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Tanggal Mulai Kerja (Join Date)</span>
                        <strong className="font-mono text-slate-800 text-xs">{selectedEmployee.joinDate}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Status Karyawan</span>
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                          {selectedEmployee.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>Legalitas Kontrak & Masa Percobaan</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Nomor SK / Perjanjian Kerja</span>
                        <strong className="font-mono text-slate-900 text-xs">
                          {selectedEmployee.contractDocNumber}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Status Masa Percobaan (Probation)</span>
                        <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold text-[10px]">
                          {selectedEmployee.probationStatus || 'Lolos Evaluasi'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Tanggal Pengangkatan Tetap</span>
                        <strong className="font-mono text-slate-800 text-xs">
                          {selectedEmployee.permanentAppointmentDate || (selectedEmployee.employmentType === 'Tetap' ? selectedEmployee.joinDate : '-')}
                        </strong>
                      </div>
                      {selectedEmployee.contractStartDate && (
                        <div>
                          <span className="text-slate-500 block text-[11px]">Mulai Kontrak PKWT</span>
                          <strong className="font-mono text-slate-800 text-xs">
                            {selectedEmployee.contractStartDate}
                          </strong>
                        </div>
                      )}
                      {selectedEmployee.contractEndDate && (
                        <div>
                          <span className="text-slate-500 block text-[11px]">Akhir Kontrak PKWT</span>
                          <strong className="font-mono text-amber-700 text-xs">
                            {selectedEmployee.contractEndDate}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: IDENTITAS KEPENDUDUKAN */}
              {detailModalTab === 'identitas' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>Data Kependudukan Resmi Sesuai Dukcapil KTP & KK</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <div>
                      <span className="text-slate-500 block text-[11px]">NIK KTP (16 Digit)</span>
                      <strong className="font-mono text-slate-900 text-xs tracking-wider">
                        {selectedEmployee.nikKtp}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Nomor Kartu Keluarga (KK)</span>
                      <strong className="font-mono text-slate-900 text-xs tracking-wider">
                        {selectedEmployee.noKk}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Tempat & Tanggal Lahir</span>
                      <strong className="text-slate-900 text-xs">
                        {selectedEmployee.birthPlace}, {selectedEmployee.birthDate}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Jenis Kelamin</span>
                      <strong className="text-slate-800 text-xs">{selectedEmployee.gender}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Golongan Darah</span>
                      <strong className="text-rose-700 font-bold font-mono text-xs">
                        Tipe {selectedEmployee.bloodType || 'O'} (Rhesus +)
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Agama</span>
                      <strong className="text-slate-800 text-xs">{selectedEmployee.religion}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Status Pernikahan</span>
                      <strong className="text-slate-800 text-xs">{selectedEmployee.maritalStatus}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Nomor Handphone / WhatsApp</span>
                      <strong className="font-mono text-indigo-700 text-xs">
                        {selectedEmployee.phone} {selectedEmployee.whatsApp ? `(WA: ${selectedEmployee.whatsApp})` : ''}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Email Resmi Perusahaan</span>
                      <strong className="font-mono text-slate-800 text-xs">{selectedEmployee.email}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Email Pribadi</span>
                      <strong className="font-mono text-slate-600 text-xs">
                        {selectedEmployee.personalEmail || selectedEmployee.email}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-slate-500 block text-[11px] mb-0.5">Alamat KTP Lengkap</span>
                      <p className="text-slate-800 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                        {selectedEmployee.ktpAddress} · Kode Pos: {selectedEmployee.postalCode || '12950'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px] mb-0.5">Alamat Domisili Sekarang</span>
                      <p className="text-slate-800 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                        {selectedEmployee.currentAddress || selectedEmployee.ktpAddress}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PAJAK & BPJS */}
              {detailModalTab === 'pajak' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Perpajakan PPh 21 (TER 2024) & Kepesertaan Jaminan BPJS</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <div>
                      <span className="text-slate-500 block text-[11px]">NPWP Format Baru (16 Digit)</span>
                      <strong className="font-mono text-slate-900 text-xs tracking-wider">
                        {selectedEmployee.npwp16 || selectedEmployee.npwp}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">NPWP Format Lama (15 Digit)</span>
                      <strong className="font-mono text-slate-600 text-xs">{selectedEmployee.npwp}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">KPP Pratama Terdaftar</span>
                      <strong className="text-slate-800 text-xs">
                        {selectedEmployee.kppPratama || 'KPP Pratama Jakarta Setiabudi'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Status PTKP & Tarif Efektif Rata-Rata</span>
                      <strong className="font-mono text-indigo-700 text-xs">
                        {selectedEmployee.ptkp} ({getTERCategory(selectedEmployee.ptkp)}) - PP 58/2023
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">No. BPJS Ketenagakerjaan (KPJ)</span>
                      <strong className="font-mono text-slate-900 text-xs">
                        {selectedEmployee.bpjsTkNo}
                      </strong>
                      <span className="text-[10px] text-emerald-600 block">✓ JKK, JKM, JHT, JP Aktif</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">No. Kartu BPJS Kesehatan</span>
                      <strong className="font-mono text-slate-900 text-xs">
                        {selectedEmployee.bpjsKesNo}
                      </strong>
                      <span className="text-[10px] text-emerald-600 block">✓ Ditanggung 4% Pemberi Kerja</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-slate-500 block text-[11px] mb-0.5">Fasilitas Kesehatan Tingkat 1 (Faskes BPJS)</span>
                    <strong className="text-slate-800 text-xs">
                      {selectedEmployee.faskes1Bpjs || 'Puskesmas Kecamatan Setiabudi / Klinik Kimia Farma Setiabudi'}
                    </strong>
                  </div>
                </div>
              )}

              {/* TAB 4: REMUNERASI & BANK */}
              {detailModalTab === 'finansial' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>Rincian Struktur Kompensasi & Benefit Bulanan</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-500 block text-[11px]">Gaji Pokok</span>
                        <strong className="font-mono text-emerald-700 text-sm">
                          {formatRupiah(selectedEmployee.basicSalary)}
                        </strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-500 block text-[11px]">Tunjangan Tetap</span>
                        <strong className="font-mono text-slate-900 text-sm">
                          {formatRupiah(selectedEmployee.fixedAllowance || 0)}
                        </strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-500 block text-[11px]">Tunjangan Jabatan</span>
                        <strong className="font-mono text-slate-900 text-sm">
                          {formatRupiah(selectedEmployee.positionAllowance || 0)}
                        </strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-500 block text-[11px]">Tunjangan Transport & Makan</span>
                        <strong className="font-mono text-slate-900 text-sm">
                          {formatRupiah((selectedEmployee.transportAllowance || 0) + (selectedEmployee.mealAllowance || 0))}
                        </strong>
                      </div>
                    </div>

                    <div className="p-3.5 bg-indigo-50/60 rounded-lg border border-indigo-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-indigo-950 block text-xs">Total Remunerasi Tetap Bulanan</span>
                        <span className="text-[11px] text-indigo-700">Dasar perhitungan lembur dan iuran jaminan sosial</span>
                      </div>
                      <span className="font-mono font-bold text-indigo-950 text-base">
                        {formatRupiah(
                          selectedEmployee.basicSalary +
                            (selectedEmployee.fixedAllowance || 0) +
                            (selectedEmployee.positionAllowance || 0) +
                            (selectedEmployee.transportAllowance || 0) +
                            (selectedEmployee.mealAllowance || 0)
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>Rekening Bank Payroll Karyawan</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Nama Bank Mitra</span>
                        <strong className="text-slate-900 text-xs">{selectedEmployee.bankName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Nomor Rekening Payroll</span>
                        <strong className="font-mono text-indigo-700 font-bold text-xs">
                          {selectedEmployee.bankAccount}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Nama Pemegang Rekening</span>
                        <strong className="text-slate-900 text-xs">
                          {selectedEmployee.bankAccountHolder || selectedEmployee.fullName}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PENDIDIKAN & KUALIFIKASI */}
              {detailModalTab === 'pendidikan' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>Riwayat Pendidikan Formal & Kualifikasi Akademik</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Jenjang Terakhir</span>
                      <strong className="text-indigo-700 text-xs font-bold">
                        {selectedEmployee.lastEducationDegree || 'Strata 1 (S1)'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Perguruan Tinggi / Universitas</span>
                      <strong className="text-slate-900 text-xs">
                        {selectedEmployee.institution || 'Universitas Indonesia'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Program Studi / Jurusan</span>
                      <strong className="text-slate-800 text-xs">
                        {selectedEmployee.major || 'Teknik Informatika / Manajemen'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Tahun Kelulusan</span>
                      <strong className="font-mono text-slate-800 text-xs">
                        {selectedEmployee.graduationYear || 2018}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Indeks Prestasi Kumulatif (IPK)</span>
                      <strong className="font-mono text-emerald-700 font-bold text-xs">
                        {selectedEmployee.educationGpa || '3.75'} / 4.00
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: KELUARGA & KONTAK DARURAT */}
              {detailModalTab === 'keluarga' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <HeartHandshake className="w-4 h-4 text-indigo-600" />
                      <span>Susunan Keluarga & Tanggungan BPJS Kesehatan</span>
                    </h4>
                    {selectedEmployee.familyMembers && selectedEmployee.familyMembers.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <tr>
                              <th className="py-2 px-3">Nama Anggota</th>
                              <th className="py-2 px-3">Hubungan</th>
                              <th className="py-2 px-3">NIK KTP/KIA</th>
                              <th className="py-2 px-3">Tanggal Lahir</th>
                              <th className="py-2 px-3 text-center">Tanggungan BPJS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedEmployee.familyMembers.map((fam, idx) => (
                              <tr key={idx}>
                                <td className="py-2 px-3 font-semibold text-slate-900">{fam.fullName}</td>
                                <td className="py-2 px-3 text-slate-700">{fam.relation}</td>
                                <td className="py-2 px-3 font-mono text-slate-600">{fam.nikKtp || '-'}</td>
                                <td className="py-2 px-3 font-mono text-slate-600">{fam.birthDate}</td>
                                <td className="py-2 px-3 text-center">
                                  {fam.isBpjsCovered ? (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                                      Ditanggung
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                      Mandiri
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded text-slate-500 text-center text-xs">
                        Status PTKP ({selectedEmployee.ptkp}): Karyawan belum mendaftarkan tanggungan keluarga ke HRD.
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Phone className="w-4 h-4 text-indigo-600" />
                      <span>Kontak Darurat (Emergency Contact)</span>
                    </h4>
                    {selectedEmployee.emergencyContacts && selectedEmployee.emergencyContacts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedEmployee.emergencyContacts.map((contact, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                            <div className="font-semibold text-slate-900">{contact.fullName}</div>
                            <div className="text-[11px] text-indigo-700 font-medium">{contact.relation}</div>
                            <div className="text-xs font-mono font-bold text-slate-800">{contact.phone}</div>
                            <div className="text-[11px] text-slate-500">{contact.address}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded text-slate-500 text-center text-xs">
                        Belum ada kontak darurat yang terdaftar.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: RIWAYAT PERSONALIA & SK */}
              {detailModalTab === 'riwayat' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <FileClock className="w-4 h-4 text-indigo-600" />
                    <span>Riwayat Keputusan Personalia & Surat Keputusan (SK)</span>
                  </h4>
                  {personaliaLogs.filter((l) => l.employeeId === selectedEmployee.id).length > 0 ? (
                    <div className="space-y-3">
                      {personaliaLogs
                        .filter((l) => l.employeeId === selectedEmployee.id)
                        .map((log) => (
                          <div
                            key={log.id}
                            className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                  {log.type}
                                </span>
                                <span className="font-mono font-bold text-slate-900 text-xs">
                                  {log.letterNumber}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  · Efektif: {log.effectiveDate}
                                </span>
                              </div>
                              <div className="text-xs text-slate-700">
                                {log.previousPosition !== log.newPosition ? (
                                  <span>
                                    Jabatan: <span className="line-through text-slate-400">{log.previousPosition}</span> → <strong>{log.newPosition}</strong>
                                  </span>
                                ) : (
                                  <span>Jabatan: <strong>{log.newPosition}</strong></span>
                                )}
                                {log.newSalary !== log.previousSalary && (
                                  <span className="ml-2 text-emerald-700 font-mono">
                                    (Gaji: {formatRupiah(log.newSalary)})
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 italic mt-0.5">"{log.reason}"</p>
                            </div>

                            <button
                              onClick={() =>
                                openFilePreview({
                                  title: `SURAT KEPUTUSAN ${log.type.toUpperCase()}`,
                                  documentNumber: log.letterNumber,
                                  typeBadge: `SK Personalia: ${log.type}`,
                                  date: log.effectiveDate,
                                  partyName: selectedEmployee.fullName,
                                  partyRole: log.newPosition,
                                  statusBadge: { label: 'Disetujui Direksi', variant: 'success' },
                                  detailsGrid: [
                                    { label: 'Nomor SK', value: log.letterNumber },
                                    { label: 'Karyawan', value: selectedEmployee.fullName },
                                    { label: 'NIK', value: selectedEmployee.nik },
                                    { label: 'Jabatan Ditetapkan', value: log.newPosition },
                                    { label: 'Gaji Pokok Disepakati', value: formatRupiah(log.newSalary) },
                                    { label: 'Tanggal Berlaku', value: log.effectiveDate },
                                  ],
                                  contentParagraphs: [
                                    `Berdasarkan pertimbangan rapat pimpinan dan pemenuhan kriteria ketenagakerjaan, Manajemen ${currentTenant.name} dengan ini resmi menetapkan keputusan ${log.type} atas nama ${selectedEmployee.fullName}.`,
                                    `Keputusan ini berlaku mengikat kedua belah pihak sejak tanggal ${log.effectiveDate}.`,
                                  ],
                                  signeeName: log.approvedBy || 'Ir. Budi Santoso',
                                  signeeRole: 'President Director & CEO',
                                })
                              }
                              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 flex items-center gap-1 transition-colors shrink-0"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Buka Berkas SK</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded text-slate-500 text-center text-xs">
                      Belum ada catatan mutasi/promosi tambahan setelah surat keputusan pengangkatan awal.
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer Modal (Fixed di Bawah, Tombol Slide Navigasi & Tutup) */}
            <div className="px-4 sm:px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevTab}
                  disabled={currentTabIndex === 0}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                    currentTabIndex === 0
                      ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400 bg-slate-50'
                      : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
                  }`}
                  title="Tab Sebelumnya (←)"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tab Sebelumnya</span>
                  <span className="sm:hidden">Sebelumnya</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextTab}
                  disabled={currentTabIndex === DOSSIER_TABS.length - 1}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                    currentTabIndex === DOSSIER_TABS.length - 1
                      ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400 bg-slate-50'
                      : 'border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 shadow-2xs'
                  }`}
                  title="Tab Selanjutnya (→)"
                >
                  <span className="hidden sm:inline">Tab Selanjutnya</span>
                  <span className="sm:hidden">Selanjutnya</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 hidden md:inline">
                  Tab {currentTabIndex + 1} dari {DOSSIER_TABS.length} · Berkas Resmi Terintegrasi
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedEmployee(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold text-xs shadow-xs transition-colors"
                >
                  Tutup Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

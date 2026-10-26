import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  RotateCcw,
  Trash2,
  Info,
} from 'lucide-react';
import {
  EmploymentType,
  PTKPStatus,
  Employee,
  Candidate,
  FamilyMember,
  EmergencyContact,
  OnboardingProcess,
  EmployeeEducationItem,
  EmployeeNonFormalEducationItem,
} from '../../types/hrms';
import { formatRupiah, getTERCategory } from '../../utils/taxCalculator';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { CurrencyInput } from '../common/CurrencyInput';
import { ValidatedDateInput } from '../common/ValidatedDateInput';
import { validateBirthDate, validateDateString } from '../../utils/dateValidator';
import { ScrollableTabNav } from '../common/ScrollableTabNav';
import { ProbationManagement } from './ProbationManagement';
import { ContractRenewalManagement } from './ContractRenewalManagement';
import { NikFormatSettingsTab } from './NikFormatSettingsTab';

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
    currentEntity,
    generateNextNik,
    candidates,
    vacancies,
    updateCandidateStage,
    onboardingProcesses,
    addOnboardingProcess,
    updateOnboardingTask,
    completeOnboarding,
    moduleSettings,
    updateModuleSettings,
    openFilePreview,
    personaliaLogs,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'karyawan' | 'probation' | 'contracts' | 'nikformat' | 'pengaturan'>('karyawan');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');

  // Modals
  const [isOnboardingChoiceOpen, setIsOnboardingChoiceOpen] = useState(false);
  const [isRecruitmentCandidatePickerOpen, setIsRecruitmentCandidatePickerOpen] = useState(false);
  const [isDossierFormOpen, setIsDossierFormOpen] = useState(false);
  const [dossierFormMode, setDossierFormMode] = useState<'direct' | 'recruitment'>('direct');
  const [dossierFormTab, setDossierFormTab] = useState<DossierTabId>('kepegawaian');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<DossierTabId>('kepegawaian');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [formTouchStartX, setFormTouchStartX] = useState<number | null>(null);

  // Close any active modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedEmployee) setSelectedEmployee(null);
        else if (isDossierFormOpen) setIsDossierFormOpen(false);
        else if (isRecruitmentCandidatePickerOpen) setIsRecruitmentCandidatePickerOpen(false);
        else if (isOnboardingChoiceOpen) setIsOnboardingChoiceOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEmployee, isDossierFormOpen, isRecruitmentCandidatePickerOpen, isOnboardingChoiceOpen]);

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

  // Form Dossier Tab Touch & Navigation Handlers
  const currentFormTabIndex = DOSSIER_TABS.findIndex((t) => t.id === dossierFormTab);
  const handlePrevFormTab = () => {
    if (currentFormTabIndex > 0) {
      setDossierFormTab(DOSSIER_TABS[currentFormTabIndex - 1].id);
    }
  };
  const handleNextFormTab = () => {
    if (currentFormTabIndex < DOSSIER_TABS.length - 1) {
      setDossierFormTab(DOSSIER_TABS[currentFormTabIndex + 1].id);
    }
  };
  const handleFormTouchStart = (e: React.TouchEvent) => {
    setFormTouchStartX(e.targetTouches[0].clientX);
  };
  const handleFormTouchEnd = (e: React.TouchEvent) => {
    if (formTouchStartX === null) return;
    const diff = formTouchStartX - e.changedTouches[0].clientX;
    if (diff > 50) handleNextFormTab();
    else if (diff < -50) handlePrevFormTab();
    setFormTouchStartX(null);
  };

  // Onboarding via Rekrutmen: Hanya kandidat dengan stage 'Hired' yang belum pernah ditambahkan / diproses ke master karyawan
  const availableHiredCandidates = candidates.filter((c) => {
    if (c.stage !== 'Hired') return false;
    if (c.isEmployeeCreated || c.createdEmployeeId) return false;
    const alreadyInEmployees = employees.some(
      (e) =>
        e.candidateId === c.id ||
        (e.email && e.email.toLowerCase() === c.email.toLowerCase()) ||
        (e.fullName && e.fullName.trim().toLowerCase() === c.name.trim().toLowerCase())
    );
    return !alreadyInEmployees;
  });

  const selectedCandidate =
    availableHiredCandidates.find((c) => c.id === selectedCandidateId) || availableHiredCandidates[0];
  const selectedCandidateVacancy = vacancies.find((v) => v.id === selectedCandidate?.jobVacancyId);

  useEffect(() => {
    if (
      availableHiredCandidates.length > 0 &&
      (!selectedCandidateId || !availableHiredCandidates.some((c) => c.id === selectedCandidateId))
    ) {
      setSelectedCandidateId(availableHiredCandidates[0].id);
    }
  }, [availableHiredCandidates, selectedCandidateId]);

  // Dossier Form State (Sama persis dengan Tab & Isi Dossier Karyawan)
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
  const [newDirectSupervisor, setNewDirectSupervisor] = useState('Ir. Budi Santoso (President Director)');
  const [newBranchLocation, setNewBranchLocation] = useState('Kantor Pusat Jakarta (Menara Palma)');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProbationStatus, setNewProbationStatus] = useState<'Lolos' | 'Sedang Berjalan' | 'Tanpa Percobaan'>('Sedang Berjalan');
  const [newPermanentDate, setNewPermanentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newContractStartDate, setNewContractStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newContractEndDate, setNewContractEndDate] = useState('2027-10-31');

  // Identitas KTP/KK
  const [newNikKtp, setNewNikKtp] = useState('3174' + Math.floor(100000000000 + Math.random() * 900000000000));
  const [newNoKk, setNewNoKk] = useState('3174' + Math.floor(100000000000 + Math.random() * 900000000000));
  const [newBirthPlace, setNewBirthPlace] = useState('Jakarta');
  const [newBirthDate, setNewBirthDate] = useState('1995-05-20');
  const [newGender, setNewGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [newBloodType, setNewBloodType] = useState<'A' | 'B' | 'AB' | 'O'>('O');
  const [newReligion, setNewReligion] = useState<any>('Islam');
  const [newMaritalStatus, setNewMaritalStatus] = useState<any>('Lajang');
  const [newWhatsApp, setNewWhatsApp] = useState('');
  const [newKtpAddress, setNewKtpAddress] = useState('Jl. Jenderal Sudirman No. 25, Jakarta Selatan');
  const [newPostalCode, setNewPostalCode] = useState('12950');
  const [newCurrentAddress, setNewCurrentAddress] = useState('Jl. Jenderal Sudirman No. 25, Jakarta Selatan');

  // Pajak & BPJS
  const [newNpwp, setNewNpwp] = useState('12.345.678.9-012.000');
  const [newNpwp16, setNewNpwp16] = useState('1234567890120000');
  const [newPtkp, setNewPtkp] = useState<PTKPStatus>('TK/0');
  const [newKpp, setNewKpp] = useState('KPP Pratama Jakarta Selatan');
  const [hasBpjsTk, setHasBpjsTk] = useState<boolean>(true);
  const [hasBpjsKes, setHasBpjsKes] = useState<boolean>(true);
  const [newBpjsTk, setNewBpjsTk] = useState('24' + Math.floor(1000000000 + Math.random() * 9000000000));
  const [newBpjsKes, setNewBpjsKes] = useState('0001' + Math.floor(10000000 + Math.random() * 90000000));
  const [newFaskes, setNewFaskes] = useState('Puskesmas Kecamatan Setiabudi');

  // Gaji & Bank (Kompensasi bulanan disetup melalui Menu Payroll)
  const [newBasicSalary, setNewBasicSalary] = useState<number>(0);
  const [newFixedAllow, setNewFixedAllow] = useState<number>(0);
  const [newTransportAllow, setNewTransportAllow] = useState<number>(0);
  const [newMealAllow, setNewMealAllow] = useState<number>(0);
  const [newPositionAllow, setNewPositionAllow] = useState<number>(0);
  const [newBankName, setNewBankName] = useState('BCA');
  const [newBankAccount, setNewBankAccount] = useState('');
  const [newBankAccountHolder, setNewBankAccountHolder] = useState('');

  // Pendidikan Formal & Kualifikasi Akademik
  const [newDegree, setNewDegree] = useState<'SMA/SMK' | 'D3' | 'S1' | 'S2' | 'S3'>('S1');
  const [newInstitution, setNewInstitution] = useState('Universitas Indonesia');
  const [newMajor, setNewMajor] = useState('Teknik Informatika');
  const [newGradYear, setNewGradYear] = useState(2018);
  const [newGpa, setNewGpa] = useState('3.75');
  const [formalEducations, setFormalEducations] = useState<EmployeeEducationItem[]>([
    {
      id: 'edu-1',
      degree: 'S1',
      institution: 'Universitas Indonesia',
      major: 'Teknik Informatika',
      graduationYear: 2020,
      gpa: '3.75',
      frontTitle: '',
      backTitle: 'S.Kom.',
    },
  ]);

  // Pendidikan Non Formal & Pelatihan Profesional
  const [nonFormalEducations, setNonFormalEducations] = useState<EmployeeNonFormalEducationItem[]>([
    {
      id: 'tr-1',
      trainingName: 'Scrum Master Certified & Agile Leadership',
      organizer: 'Scrum Alliance & BNSP',
      year: '2023',
      certificateNumber: 'SMC-2023-8891',
      validityType: 'Permanen',
      expiredDate: '',
    },
  ]);

  // Keluarga & Kontak Darurat
  const [newFamilyMembers, setNewFamilyMembers] = useState<FamilyMember[]>([]);
  const [newEmergencyContacts, setNewEmergencyContacts] = useState<EmergencyContact[]>([
    {
      id: `emg-1`,
      fullName: 'Kontak Darurat Utama',
      relation: 'Orang Tua',
      phone: '0812' + Math.floor(10000000 + Math.random() * 90000000),
      address: 'Jl. Jenderal Sudirman No. 25, Jakarta Selatan',
    },
  ]);

  // Riwayat SK Karier Awal
  const [newSkSignee, setNewSkSignee] = useState('Aditya Pratama, S.Psi');
  const [newSkRole, setNewSkRole] = useState('VP of Human Capital & People Operation');
  const [newSkEffectiveDate, setNewSkEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSkNotes, setNewSkNotes] = useState(
    'Pengangkatan resmi karyawan baru setelah memenuhi kualifikasi dan verifikasi administrasi kepegawaian standar perusahaan.'
  );

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

  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = setTimeout(() => setFeedbackMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [feedbackMessage]);

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

  // Helper: Reset Formulir Dosir Karyawan ke nilai awal / bersih
  const resetDossierForm = (mode: 'direct' | 'recruitment') => {
    setDossierFormMode(mode);
    setDossierFormTab('kepegawaian');
    setFormError(null);
    setShowValidationErrors(false);

    const generatedNik = generateNextNik('Tetap', currentEntity?.id);
    const today = new Date().toISOString().split('T')[0];
    const seq = employees.length + 1;
    const docNo = `${String(seq).padStart(3, '0')}/HRD-SK-TETAP/${currentTenant.code}/X/${new Date().getFullYear()}`;

    setNewAvatar(AVATAR_PRESETS[0]);
    setNewName('');
    setNewNik(generatedNik);
    setNewEmail('');
    setNewPersonalEmail('');
    setNewPhone('0812' + Math.floor(10000000 + Math.random() * 90000000));
    setNewType('Tetap');
    setNewDept('Engineering');
    setNewPosition('');
    setNewGrade('L3');
    setNewDirectSupervisor('Ir. Budi Santoso (President Director)');
    setNewBranchLocation(`Kantor Pusat ${currentTenant.city || 'Jakarta'} (Menara Palma)`);
    setNewJoinDate(today);
    setNewProbationStatus('Sedang Berjalan');
    setNewPermanentDate(today);
    setNewContractDoc(docNo);
    setNewContractStartDate(today);
    setNewContractEndDate('2027-10-31');

    // Identitas
    setNewNikKtp('3174' + Math.floor(100000000000 + Math.random() * 900000000000));
    setNewNoKk('3174' + Math.floor(100000000000 + Math.random() * 900000000000));
    setNewBirthPlace('Jakarta');
    setNewBirthDate('1996-06-15');
    setNewGender('Laki-laki');
    setNewBloodType('O');
    setNewReligion('Islam');
    setNewMaritalStatus('Lajang');
    setNewWhatsApp('');
    setNewKtpAddress('Jl. Jenderal Sudirman No. 25, Jakarta Selatan');
    setNewPostalCode('12950');
    setNewCurrentAddress('Jl. Jenderal Sudirman No. 25, Jakarta Selatan');

    // Pajak & BPJS
    setNewNpwp('12.345.678.9-012.000');
    setNewNpwp16('1234567890120000');
    setNewPtkp('TK/0');
    setNewKpp(`KPP Pratama ${currentTenant.city || 'Jakarta Selatan'}`);
    setHasBpjsTk(true);
    setHasBpjsKes(true);
    setNewBpjsTk('24' + Math.floor(1000000000 + Math.random() * 9000000000));
    setNewBpjsKes('0001' + Math.floor(10000000 + Math.random() * 90000000));
    setNewFaskes('Puskesmas Kecamatan Setiabudi');

    // Gaji & Bank - Kompensasi disetup melalui Menu Payroll
    setNewBasicSalary(0);
    setNewFixedAllow(0);
    setNewTransportAllow(0);
    setNewMealAllow(0);
    setNewPositionAllow(0);
    setNewBankName('BCA');
    setNewBankAccount('');
    setNewBankAccountHolder('');

    // Pendidikan Formal & Non Formal
    setNewDegree('S1');
    setNewInstitution('Universitas Indonesia');
    setNewMajor('Teknik Informatika');
    setNewGradYear(2020);
    setNewGpa('3.75');
    setFormalEducations([
      {
        id: `edu-${Date.now()}`,
        degree: 'S1',
        institution: 'Universitas Indonesia',
        major: 'Teknik Informatika',
        graduationYear: 2020,
        gpa: '3.75',
        frontTitle: '',
        backTitle: 'S.Kom.',
      },
    ]);
    setNonFormalEducations([
      {
        id: `tr-${Date.now()}`,
        trainingName: 'Scrum Master Certified & Agile Leadership',
        organizer: 'Scrum Alliance & BNSP',
        year: '2023',
        certificateNumber: 'SMC-2023-8891',
        validityType: 'Permanen',
        expiredDate: '',
      },
    ]);

    // Keluarga & Darurat
    setNewFamilyMembers([]);
    setNewEmergencyContacts([
      {
        id: `emg-${Date.now()}`,
        fullName: 'Kontak Darurat Utama',
        relation: 'Orang Tua',
        phone: '0812' + Math.floor(10000000 + Math.random() * 90000000),
        address: 'Jl. Jenderal Sudirman No. 25, Jakarta Selatan',
      },
    ]);

    // SK Karier
    setNewSkSignee('Aditya Pratama, S.Psi');
    setNewSkRole('VP of Human Capital & People Operation');
    setNewSkEffectiveDate(today);
    setNewSkNotes(
      'Pengangkatan resmi karyawan baru setelah memenuhi kualifikasi dan verifikasi administrasi kepegawaian standar perusahaan.'
    );
  };

  // Probation hanya berlaku untuk PKWTT (Tetap). Non-PKWTT selalu Tanpa Percobaan (PP 35/2021).
  useEffect(() => {
    if (newType !== 'Tetap') {
      setNewProbationStatus('Tanpa Percobaan');
    }
  }, [newType]);

  // Helper: Memuat data kandidat berstatus Hired langsung ke form dosir lengkap
  const loadCandidateIntoDossierForm = (cand: Candidate) => {
    resetDossierForm('recruitment');
    setSelectedCandidateId(cand.id);

    const matchedVacancy = vacancies.find((v) => v.id === cand.jobVacancyId);
    const empType: EmploymentType =
      (matchedVacancy?.employmentType as EmploymentType) ||
      (cand.offeringEmploymentStatus as EmploymentType) ||
      'Tetap';
    const dep = matchedVacancy?.department || cand.offeringUnitKerja || 'Engineering';
    const pos = matchedVacancy?.title || cand.offeringPosition || 'Senior Specialist';
    const salary = cand.offeredSalary || cand.expectedSalary || 15000000;
    const joinDt = cand.joinedDate || cand.offeringStartDate || new Date().toISOString().split('T')[0];
    const generatedNik = generateNextNik(empType, currentEntity?.id);
    const seq = employees.length + 1;
    const docNo =
      cand.offeringDocNumber ||
      `${String(seq).padStart(3, '0')}/HRD-${empType === 'Tetap' ? 'SK-TETAP' : 'PKWT'}/${currentTenant.code}/X/${new Date().getFullYear()}`;

    setNewName(cand.name);
    setNewNik(generatedNik);
    setNewEmail(cand.email);
    setNewPersonalEmail(cand.email);
    setNewPhone(cand.phone);
    setNewWhatsApp(cand.phone);
    setNewType(empType);
    setNewDept(dep);
    setNewPosition(pos);
    setNewJoinDate(joinDt);
    setNewBasicSalary(salary);
    setNewContractDoc(docNo);
    setNewContractStartDate(joinDt);
    setNewContractEndDate(empType === 'Kontrak' ? '2027-10-31' : '');
    setNewPermanentDate(empType === 'Tetap' ? joinDt : '');
    setNewProbationStatus(empType === 'Tetap' ? 'Sedang Berjalan' : 'Tanpa Percobaan');
    setNewBankAccountHolder(cand.name);

    if (cand.offeringBreakdown) {
      if (cand.offeringBreakdown.basicSalary) {
        setNewBasicSalary(cand.offeringBreakdown.basicSalary);
      }
      if (cand.offeringBreakdown.ptkp) {
        setNewPtkp(cand.offeringBreakdown.ptkp);
      }
      const fixed = cand.offeringBreakdown.allowances?.find((a: any) => a.name.toLowerCase().includes('tetap'))?.amount;
      if (fixed) setNewFixedAllow(fixed);
      const trans = cand.offeringBreakdown.allowances?.find((a: any) => a.name.toLowerCase().includes('transport'))?.amount;
      if (trans) setNewTransportAllow(trans);
      const meal = cand.offeringBreakdown.allowances?.find((a: any) => a.name.toLowerCase().includes('makan'))?.amount;
      if (meal) setNewMealAllow(meal);
      const posAll = cand.offeringBreakdown.allowances?.find((a: any) => a.name.toLowerCase().includes('jabatan'))?.amount;
      if (posAll) setNewPositionAllow(posAll);
    }

    if (cand.parsedData) {
      const inst = cand.parsedData.university || 'Universitas Indonesia';
      let deg: any = 'S1';
      let bTitle = 'S.Kom.';
      if (typeof cand.parsedData.education === 'string') {
        const eduStr = cand.parsedData.education.toUpperCase();
        if (eduStr.includes('S2')) { deg = 'S2'; bTitle = 'M.M.'; }
        else if (eduStr.includes('S3')) { deg = 'S3'; bTitle = 'Dr.'; }
        else if (eduStr.includes('D3')) { deg = 'D3'; bTitle = ''; }
        else if (eduStr.includes('SMA') || eduStr.includes('SMK')) { deg = 'SMA/SMK'; bTitle = ''; }
        else { deg = 'S1'; bTitle = 'S.Kom.'; }
      }
      setNewDegree(deg);
      setNewInstitution(inst);
      setFormalEducations([
        {
          id: `edu-${Date.now()}`,
          degree: deg,
          institution: inst,
          major: cand.parsedData.currentTitle || 'Teknik Informatika',
          graduationYear: 2020,
          gpa: '3.75',
          frontTitle: '',
          backTitle: bTitle,
        },
      ]);
    }
  };

  const handleSelectCandidateToDossier = (cand: Candidate) => {
    loadCandidateIntoDossierForm(cand);
    setIsRecruitmentCandidatePickerOpen(false);
    setIsDossierFormOpen(true);
  };

  const handleOpenDirectOnboarding = () => {
    resetDossierForm('direct');
    setSelectedCandidateId('');
    setIsOnboardingChoiceOpen(false);
    setIsDossierFormOpen(true);
  };

  // Pendidikan Formal list handlers (bisa ditambah terus, gelar hanya untuk S1/D4 sampai S3)
  const handleAddFormalEducation = () => {
    setFormalEducations([
      ...formalEducations,
      {
        id: `edu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        degree: 'S1',
        institution: '',
        major: '',
        graduationYear: new Date().getFullYear(),
        gpa: '',
        frontTitle: '',
        backTitle: '',
      },
    ]);
  };

  const handleRemoveFormalEducation = (id: string) => {
    if (formalEducations.length <= 1) {
      setFormError('Minimal harus ada 1 riwayat pendidikan formal!');
      return;
    }
    setFormalEducations(formalEducations.filter((item) => item.id !== id));
  };

  const handleUpdateFormalEducation = (id: string, field: keyof EmployeeEducationItem, val: any) => {
    setFormalEducations(
      formalEducations.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: val };
          if (field === 'degree' && ['SMA/SMK', 'D1/D2', 'D3'].includes(val)) {
            updated.frontTitle = '';
            updated.backTitle = '';
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Pendidikan Non Formal / Pelatihan Profesional list handlers
  const handleAddNonFormalEducation = () => {
    setNonFormalEducations([
      ...nonFormalEducations,
      {
        id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        trainingName: '',
        organizer: '',
        year: new Date().getFullYear(),
        validityType: 'Permanen',
        expiredDate: '',
        certificateNumber: '',
      },
    ]);
  };

  const handleRemoveNonFormalEducation = (id: string) => {
    setNonFormalEducations(nonFormalEducations.filter((item) => item.id !== id));
  };

  const handleUpdateNonFormalEducation = (id: string, field: keyof EmployeeNonFormalEducationItem, val: any) => {
    setNonFormalEducations(
      nonFormalEducations.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  // Gelar akademik kompilasi (Hanya dari S1 atau setara sampai S3)
  const eligibleEducationsForTitle = formalEducations.filter((e) =>
    ['S1', 'D4/S1', 'S2', 'S3'].includes(e.degree)
  );
  const compiledFrontTitles = Array.from(
    new Set(
      eligibleEducationsForTitle
        .map((e) => e.frontTitle?.trim())
        .filter((t): t is string => Boolean(t))
    )
  ).join(' ');
  const compiledBackTitles = Array.from(
    new Set(
      eligibleEducationsForTitle
        .map((e) => e.backTitle?.trim())
        .filter((t): t is string => Boolean(t))
    )
  ).join(', ');

  const handleApplyTitlesToName = () => {
    if (!newName.trim()) return;
    let cleanName = newName.trim();
    if (compiledFrontTitles && !cleanName.startsWith(compiledFrontTitles)) {
      cleanName = `${compiledFrontTitles} ${cleanName}`;
    }
    if (compiledBackTitles && !cleanName.includes(compiledBackTitles)) {
      cleanName = `${cleanName}, ${compiledBackTitles}`;
    }
    setNewName(cleanName);
  };

  // Family & Emergency Contact list handlers
  const handleAddFamilyMember = () => {
    setNewFamilyMembers([
      ...newFamilyMembers,
      {
        id: `fam-${Date.now()}`,
        fullName: '',
        relation: 'Anak',
        nikKtp: '',
        birthDate: '2015-01-01',
        gender: 'Laki-laki',
        isBpjsCovered: true,
      },
    ]);
  };

  const handleRemoveFamilyMember = (idx: number) => {
    setNewFamilyMembers(newFamilyMembers.filter((_, i) => i !== idx));
  };

  const handleUpdateFamilyMember = (idx: number, field: keyof FamilyMember, val: any) => {
    setNewFamilyMembers(newFamilyMembers.map((fam, i) => (i === idx ? { ...fam, [field]: val } : fam)));
  };

  const handleAddEmergencyContact = () => {
    setNewEmergencyContacts([
      ...newEmergencyContacts,
      {
        id: `emg-${Date.now()}`,
        fullName: '',
        relation: 'Kerabat',
        phone: '',
        address: '',
      },
    ]);
  };

  const handleRemoveEmergencyContact = (idx: number) => {
    setNewEmergencyContacts(newEmergencyContacts.filter((_, i) => i !== idx));
  };

  const handleUpdateEmergencyContact = (idx: number, field: keyof EmergencyContact, val: any) => {
    setNewEmergencyContacts(newEmergencyContacts.map((c, i) => (i === idx ? { ...c, [field]: val } : c)));
  };

  // Submit Handler: Simpan & Proses Tambah Data Karyawan Dosir Lengkap
  const handleSubmitDossierForm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    setShowValidationErrors(false);

    // Validasi Kepegawaian
    if (!newName.trim()) {
      setFormError('Nama lengkap karyawan sesuai KTP wajib diisi!');
      setShowValidationErrors(true);
      setDossierFormTab('kepegawaian');
      return;
    }
    if (!newPosition.trim()) {
      setFormError('Posisi / Jabatan kerja wajib diisi!');
      setShowValidationErrors(true);
      setDossierFormTab('kepegawaian');
      return;
    }
    if (!newDept.trim()) {
      setFormError('Departemen / Divisi wajib diisi!');
      setShowValidationErrors(true);
      setDossierFormTab('kepegawaian');
      return;
    }
    const joinCheck = validateDateString(newJoinDate);
    if (!joinCheck.isValid) {
      setFormError(`Tanggal Mulai Kerja tidak valid: ${joinCheck.errorMessage}`);
      setShowValidationErrors(true);
      setDossierFormTab('kepegawaian');
      return;
    }

    // Validasi Identitas
    if (!newNikKtp.trim()) {
      setFormError('Nomor NIK KTP (16 digit) wajib diisi!');
      setShowValidationErrors(true);
      setDossierFormTab('identitas');
      return;
    }
    const birthCheck = validateBirthDate(newBirthDate, 17);
    if (!birthCheck.isValid) {
      setFormError(`Validasi Tanggal Lahir: ${birthCheck.errorMessage}`);
      setShowValidationErrors(true);
      setDossierFormTab('identitas');
      return;
    }

    // Validasi Finansial
    // Rincian struktur kompensasi bulanan disetup melalui Menu Payroll.
    // Di tab ini yang wajib diisi adalah Rekening Bank Payroll.
    if (!newBankAccount.trim()) {
      setFormError('Nomor Rekening Bank Payroll wajib diisi!');
      setShowValidationErrors(true);
      setDossierFormTab('finansial');
      return;
    }

    // Simpan ke Master Karyawan
    const seq = employees.length + 1;
    const docNo =
      newContractDoc ||
      `${String(seq).padStart(3, '0')}/HRD-${newType === 'Tetap' ? 'SK-TETAP' : 'PKWT'}/${currentTenant.code}/X/${new Date().getFullYear()}`;

    const createdEmp = addEmployee({
      nik: newNik || generateNextNik(newType, currentEntity?.id),
      fullName: newName.trim(),
      avatar: newAvatar,
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '.')}@${currentTenant.code.toLowerCase()}.id`,
      personalEmail: newPersonalEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      phone: newPhone.trim(),
      employmentType: newType,
      contractDocNumber: docNo,
      contractStartDate: newContractStartDate || newJoinDate,
      contractEndDate: newType === 'Kontrak' ? newContractEndDate || '2027-10-31' : undefined,
      permanentAppointmentDate: newType === 'Tetap' ? newPermanentDate || newJoinDate : undefined,
      probationStatus: newType === 'Tetap' ? newProbationStatus : 'Tanpa Percobaan',
      department: newDept,
      position: newPosition,
      grade: newGrade || 'L3',
      directSupervisor: newDirectSupervisor || 'Ir. Budi Santoso (President Director)',
      branchLocation: newBranchLocation || `Kantor Pusat ${currentTenant.city || 'Jakarta'}`,
      joinDate: newJoinDate,
      status: 'Aktif',
      remainingLeaveDays: 12,
      candidateId: dossierFormMode === 'recruitment' && selectedCandidateId ? selectedCandidateId : undefined,
      nikKtp: newNikKtp,
      noKk: newNoKk,
      birthPlace: newBirthPlace || 'Jakarta',
      birthDate: newBirthDate,
      gender: newGender,
      bloodType: newBloodType,
      religion: newReligion,
      maritalStatus: newMaritalStatus,
      whatsApp: newWhatsApp || newPhone,
      ktpAddress: newKtpAddress,
      postalCode: newPostalCode || '12950',
      currentAddress: newCurrentAddress || newKtpAddress,
      npwp: newNpwp,
      npwp16: newNpwp16 || newNpwp,
      ptkp: newPtkp,
      kppPratama: newKpp,
      hasBpjsTk: hasBpjsTk,
      hasBpjsKes: hasBpjsKes,
      bpjsTkActionNeeded: hasBpjsTk ? 'Pengalihan' : 'Pembuatan Baru',
      bpjsKesActionNeeded: hasBpjsKes ? 'Pengalihan' : 'Pembuatan Baru',
      bpjsTkNo: hasBpjsTk ? newBpjsTk : 'BELUM_ADA',
      bpjsKesNo: hasBpjsKes ? newBpjsKes : 'BELUM_ADA',
      faskes1Bpjs: newFaskes,
      bankName: newBankName,
      bankAccount: newBankAccount,
      bankAccountHolder: newBankAccountHolder || newName,
      basicSalary: Number(newBasicSalary),
      fixedAllowance: Number(newFixedAllow || 0),
      transportAllowance: Number(newTransportAllow || 0),
      mealAllowance: Number(newMealAllow || 0),
      positionAllowance: Number(newPositionAllow || 0),
      lastEducationDegree: (formalEducations[0]?.degree as any) || newDegree,
      institution: formalEducations[0]?.institution || newInstitution,
      major: formalEducations[0]?.major || newMajor,
      graduationYear: Number(formalEducations[0]?.graduationYear || newGradYear || 2020),
      educationGpa: formalEducations[0]?.gpa || newGpa || '3.75',
      formalEducations: formalEducations,
      nonFormalEducations: nonFormalEducations,
      titlePrefix: compiledFrontTitles || undefined,
      titleSuffix: compiledBackTitles || undefined,
      familyMembers: newFamilyMembers,
      emergencyContacts: newEmergencyContacts,
    });

    // Buat juga log onboarding process untuk integritas tracking
    addOnboardingProcess({
      type: dossierFormMode === 'recruitment' ? 'via_recruitment' : 'direct',
      candidateId: dossierFormMode === 'recruitment' ? selectedCandidateId : undefined,
      employeeName: createdEmp.fullName,
      email: createdEmp.email,
      phone: createdEmp.phone,
      position: createdEmp.position,
      department: createdEmp.department,
      employmentType: createdEmp.employmentType,
      joinDate: createdEmp.joinDate,
      basicSalary: createdEmp.basicSalary,
      contractDocNumber: createdEmp.contractDocNumber,
      createdEmployeeId: createdEmp.id,
      tasks: [
        { id: 't1', title: 'Data Master & Dossier Lengkap Terverifikasi', category: 'Legalitas & Dokumen', isCompleted: true, completedAt: createdEmp.joinDate, assignedRole: 'hr_admin' },
        { id: 't2', title: 'Pemberian ID Card & Fasilitas Aset Kantor', category: 'Fasilitas & IT', isCompleted: false, assignedRole: 'ga_admin' },
        { id: 't3', title: 'Registrasi Payroll Bank & Konfigurasi Pajak TER', category: 'Payroll & Rekening', isCompleted: true, completedAt: createdEmp.joinDate, assignedRole: 'payroll_admin' },
      ],
    });

    // Tandai kandidat Hired telah diproses sebagai karyawan agar tidak muncul lagi di dropdown
    if (dossierFormMode === 'recruitment' && selectedCandidateId) {
      updateCandidateStage(selectedCandidateId, 'Hired', {
        isEmployeeCreated: true,
        createdEmployeeId: createdEmp.id,
        joinedDate: newJoinDate,
      } as any);
    }

    setIsDossierFormOpen(false);
    setSelectedCandidateId('');
    setFeedbackMessage({
      type: 'success',
      title: 'Data Karyawan Berhasil Disimpan',
      description: `${createdEmp.fullName} telah resmi terdaftar di Master Karyawan dengan NIK ${createdEmp.nik}.`,
    });
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
      {/* Floating In-App Toast Notification - Portaled to document.body, eliminating layout shifts and backdrop clipping bug */}
      {typeof document !== 'undefined' && feedbackMessage && createPortal(
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-[999999] p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-2xl max-w-md pointer-events-auto ring-1 ring-white/10 toast-floating-enter ${
            feedbackMessage.type === 'success'
              ? 'bg-slate-900 border-emerald-500/50 text-white'
              : 'bg-slate-900 border-indigo-500/50 text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle className={`w-4 h-4 shrink-0 ${feedbackMessage.type === 'success' ? 'text-emerald-400' : 'text-blue-400'}`} />
            <div>
              <span className="font-bold">{feedbackMessage.title}:</span>
              {feedbackMessage.description && (
                <span className="ml-1.5 text-slate-200">{feedbackMessage.description}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white transition-colors p-1"
            title="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>,
        document.body
      )}

      {/* Row 1: Module Header & Main Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Management Karyawan</span>
          </h2>
          <p className="text-xs text-slate-500">
            Dossier master data lengkap, alur penambahan karyawan baru melalui proses rekrutmen atau direct onboarding.
          </p>
        </div>

        <button
          onClick={() => setIsOnboardingChoiceOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Tambah Data Karyawan</span>
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
          onClick={() => setActiveTab('nikformat')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'nikformat'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Format NIK Dinamis</span>
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
          <span>Pengaturan Modul</span>
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
                              <span
                                className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                                  isDone
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                                title="Status proses onboarding karyawan"
                              >
                                {isDone ? '✓ Onboarding Selesai' : `Onb: ${cTasks}/${tTasks} Tugas`}
                              </span>
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

      {/* Dynamic NIK Format Settings Tab */}
      {activeTab === 'nikformat' && <NikFormatSettingsTab />}

      {/* Settings Tab */}
      {activeTab === 'pengaturan' && (
        <div className="space-y-6">
          <NikFormatSettingsTab />

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Pengaturan Umum Kepegawaian & Ketenagakerjaan
              </h3>
              <p className="text-xs text-slate-500">
                Konfigurasi durasi masa percobaan (probation) default dan batas usia pensiun purnabakti perusahaan.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Masa Percobaan Default (Probation)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={settProbation}
                    onChange={(e) => setSettProbation(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Bulan (Maks. 3 Bulan sesuai UU Cipta Kerja)</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Batas Usia Pensiun Karyawan
                  </label>
                  <input
                    type="number"
                    value={settRetire}
                    onChange={(e) => setSettRetire(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Tahun usia untuk otomatisasi notifikasi purnabakti</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-xs"
                >
                  Simpan Kebijakan Karyawan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 02C: Evaluasi Probation H-14 */}
      {activeTab === 'probation' && <ProbationManagement />}

      {/* 02D: Pengingat Kontrak PKWT H-30 */}
      {activeTab === 'contracts' && <ContractRenewalManagement />}

      {/* Modal: Pilihan Jalur Onboarding (Wajib Melalui Onboarding) */}
      {isOnboardingChoiceOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOnboardingChoiceOpen(false);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Pilih Alur Onboarding Karyawan Baru</h3>
                <span className="text-[11px] text-slate-400">Penambahan data karyawan melalui jalur rekrutmen atau direct onboarding</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOnboardingChoiceOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Option 1: Via Rekrutmen Lengkap */}
              <button
                type="button"
                onClick={() => {
                  setIsOnboardingChoiceOpen(false);
                  setIsRecruitmentCandidatePickerOpen(true);
                }}
                className="w-full p-4 border-2 border-indigo-200 hover:border-indigo-600 hover:bg-indigo-50/50 rounded-xl text-left transition-all group flex items-start gap-4 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
                    <h4 className="font-bold text-slate-900 text-sm">
                      1. Onboarding Melalui Rekrutmen Lengkap
                    </h4>
                    <span className="self-start sm:self-auto text-[10px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap border border-indigo-200 shrink-0">
                      Status Hired
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    Pilih kandidat yang telah resmi berstatus <strong>Hired</strong> dari alur rekrutmen. Data gaji disepakati, tunjangan, jabatan, departemen, dan kontak otomatis terisi ke form dosir lengkap.
                  </p>
                </div>
              </button>

              {/* Option 2: Direct Onboarding */}
              <button
                type="button"
                onClick={handleOpenDirectOnboarding}
                className="w-full p-4 border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 rounded-xl text-left transition-all group flex items-start gap-4 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      2. Onboarding Langsung (Direct Onboarding)
                    </h4>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      Entri Mandiri
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    Untuk karyawan baru yang masuk langsung (tanpa melalui seleksi rekrutmen). Isi formulir dosir lengkap (7 bagian: kepegawaian, identitas, pajak/BPJS, remunerasi, pendidikan, keluarga, dan SK).
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pathway 1: Pilih Kandidat Hired dari Rekrutmen */}
      {isRecruitmentCandidatePickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsRecruitmentCandidatePickerOpen(false);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Onboarding dari Pipeline Rekrutmen</h3>
                <span className="text-[11px] text-slate-400">
                  Hanya menampilkan kandidat berstatus Hired yang belum diproses Tambah Data Karyawan
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsRecruitmentCandidatePickerOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {availableHiredCandidates.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Tidak Ada Kandidat Hired yang Perlu Diproses</h4>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Semua kandidat berstatus <strong>Hired</strong> telah berhasil diproses ke Master Karyawan, atau belum ada kandidat baru yang mencapai tahap Hired di modul Rekrutmen.
                  </p>
                </div>
                <div className="pt-3 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRecruitmentCandidatePickerOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecruitmentCandidatePickerOpen(false);
                      handleOpenDirectOnboarding();
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors"
                  >
                    Gunakan Direct Onboarding
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 sm:p-6 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5 text-xs">
                    Pilih Kandidat Hired yang Akan Ditambahkan ke Master Karyawan *
                  </label>
                  <select
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-indigo-200 focus:border-indigo-600 rounded-lg text-xs font-semibold text-slate-900 bg-white shadow-2xs cursor-pointer outline-none transition-all"
                  >
                    {availableHiredCandidates.map((c) => {
                      const v = vacancies.find((vac) => vac.id === c.jobVacancyId);
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} — {v?.title || 'Posisi Rekrutmen'} ({formatRupiah(c.offeredSalary || c.expectedSalary)})
                        </option>
                      );
                    })}
                  </select>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Menampilkan {availableHiredCandidates.length} kandidat Hired yang belum tercatat di Master Karyawan.
                  </span>
                </div>

                {/* Candidate Detail Card Preview */}
                {selectedCandidate && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs shrink-0">
                          {selectedCandidate.name[0]}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{selectedCandidate.name}</h4>
                          <div className="text-xs text-indigo-700 font-medium truncate">
                            {selectedCandidateVacancy?.title || 'Posisi Rekrutmen'} ·{' '}
                            {selectedCandidateVacancy?.department || 'Engineering'}
                          </div>
                        </div>
                      </div>
                      <span className="self-start sm:self-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap shrink-0">
                        Status: Hired
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/80 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Gaji Disepakati:</span>
                        <strong className="text-slate-900 font-mono">
                          {formatRupiah(selectedCandidate.offeredSalary || selectedCandidate.expectedSalary)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Status Hubungan:</span>
                        <strong className="text-slate-900">
                          {selectedCandidateVacancy?.employmentType || 'Tetap (PKWTT)'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Email Kandidat:</span>
                        <span className="text-slate-700 font-mono text-[11px] truncate block">
                          {selectedCandidate.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Nomor WhatsApp:</span>
                        <span className="text-slate-700 font-mono text-[11px]">
                          {selectedCandidate.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRecruitmentCandidatePickerOpen(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCandidate) handleSelectCandidateToDossier(selectedCandidate);
                    }}
                    disabled={!selectedCandidate}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Lanjutkan ke Form Dosir Lengkap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Formulir Dosir Karyawan Lengkap (Digunakan untuk Direct Onboarding & Rekrutmen Lengkap) */}
      {isDossierFormOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDossierFormOpen(false);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[90vh] sm:h-[86vh] border border-slate-200 overflow-hidden flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Form Dosir Lengkap */}
            <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {dossierFormMode === 'recruitment' ? (
                    <Sparkles className="w-5 h-5" />
                  ) : (
                    <UserPlus className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                      {dossierFormMode === 'recruitment'
                        ? `Onboarding Rekrutmen: ${newName || 'Kandidat Hired'}`
                        : 'Tambah Karyawan — Direct Onboarding'}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        dossierFormMode === 'recruitment'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {dossierFormMode === 'recruitment' ? 'Pipeline Rekrutmen Hired' : 'Direct Onboarding'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block truncate">
                    Formulir dosir master data komprehensif (7 bagian sesuai dossier karyawan resmi)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDossierFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                title="Tutup Formulir"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner Khusus Mode Rekrutmen: Terhubung ke Data Kandidat */}
            {dossierFormMode === 'recruitment' && (
              <div className="bg-indigo-50/90 border-b border-indigo-100 px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="text-slate-700 truncate">
                    Data terisi otomatis dari hasil seleksi kandidat <strong>{newName}</strong> (Status: Hired)
                  </span>
                </div>
                {availableHiredCandidates.length > 1 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-slate-500 hidden sm:inline">Ganti:</span>
                    <select
                      value={selectedCandidateId}
                      onChange={(e) => {
                        const c = availableHiredCandidates.find((cand) => cand.id === e.target.value);
                        if (c) loadCandidateIntoDossierForm(c);
                      }}
                      className="text-[11px] py-1 px-2 border border-indigo-200 rounded bg-white text-indigo-900 font-medium cursor-pointer"
                    >
                      {availableHiredCandidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Enterprise Tabs Navigation (Identik dengan DOSSIER_TABS) */}
            <ScrollableTabNav className="bg-slate-50 border-b border-slate-200" containerClassName="pt-1 px-2 sm:px-4">
              {DOSSIER_TABS.map((tab, idx) => {
                const Icon = tab.icon;
                const isActive = dossierFormTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDossierFormTab(tab.id)}
                    className={`pb-2.5 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px cursor-pointer ${
                      isActive
                        ? 'border-indigo-600 text-indigo-700 font-bold bg-white rounded-t-md shadow-2xs'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </button>
                );
              })}
            </ScrollableTabNav>

            {/* Sub-Header Indikator Bagian Tab */}
            <div className="px-4 sm:px-6 py-1.5 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between text-[11px] font-mono text-indigo-900 shrink-0">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="text-indigo-600">Bagian {currentFormTabIndex + 1} dari {DOSSIER_TABS.length}:</span>
                <strong className="text-slate-900">{DOSSIER_TABS[currentFormTabIndex]?.label}</strong>
              </span>
              <span className="text-[10px] text-indigo-600 hidden sm:inline">
                Dapat digeser antar-tab atau klik tab di atas
              </span>
            </div>

            {/* Form Modal Body (Scrollable, Responsive Touch Swipe) */}
            <form onSubmit={handleSubmitDossierForm} className="flex-1 flex flex-col min-h-0">
              <div
                onTouchStart={handleFormTouchStart}
                onTouchEnd={handleFormTouchEnd}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs bg-slate-50/50"
              >
                {/* Validation Error Banner */}
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* TAB 1: KEPEGAWAIAN & POSISI */}
                {dossierFormTab === 'kepegawaian' && (
                  <div className="space-y-4">
                    {/* Photo Profile Uploader */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
                      <label className="font-semibold text-slate-800 block text-xs">
                        Upload Foto Profil Karyawan (Photo Profile) *
                      </label>
                      <div className="flex items-center gap-3.5 flex-wrap sm:flex-nowrap">
                        <div className="relative group shrink-0">
                          <img
                            src={newAvatar || AVATAR_PRESETS[0]}
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
                          <div className="flex items-center gap-2 flex-wrap">
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
                                onClick={() => setNewAvatar(AVATAR_PRESETS[0])}
                                className="px-2 py-1 text-slate-500 hover:text-rose-600 text-xs font-medium"
                              >
                                Reset Foto
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Format: JPG, PNG, atau WEBP (Maks. 5 MB). Foto ini akan digunakan di dossier, kartu nama digital, dan slip gaji.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                        <span>Struktur Jabatan & Hubungan Kerja</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="font-medium text-slate-700 block mb-1">
                            Nama Lengkap Sesuai KTP *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Dimas Anggara, S.Kom."
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className={`w-full px-3 py-2 border rounded font-medium ${
                              showValidationErrors && !newName.trim()
                                ? 'border-rose-500 bg-rose-50/30'
                                : 'border-slate-300'
                            }`}
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-slate-700 block text-xs">
                              Nomor Induk Karyawan (NIK) *
                            </label>
                            <button
                              type="button"
                              onClick={() => setNewNik(generateNextNik(newType, currentEntity?.id))}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                              title="Generate ulang NIK otomatis sesuai format pola aktif"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Generate NIK</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Otomatis terisi jika kosong"
                            value={newNik}
                            onChange={(e) => setNewNik(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-indigo-200 focus:border-indigo-600 rounded-lg font-mono font-bold text-indigo-900 bg-indigo-50/20"
                          />
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            Format penomoran otomatis untuk status {newType}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="font-medium text-slate-700 block mb-1">Email Kantor Resmi</label>
                          <input
                            type="email"
                            placeholder="nama@perusahaan.id"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-slate-700 block mb-1">Email Pribadi</label>
                          <input
                            type="email"
                            placeholder="nama@gmail.com"
                            value={newPersonalEmail}
                            onChange={(e) => setNewPersonalEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="font-medium text-slate-700 block mb-1">Nomor HP / WhatsApp *</label>
                          <input
                            type="tel"
                            required
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-slate-700 block mb-1">Status Hubungan Kerja</label>
                          <select
                            value={newType}
                            onChange={(e) => {
                              const t = e.target.value as any;
                              setNewType(t);
                              setNewNik(generateNextNik(t, currentEntity?.id));
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-medium cursor-pointer"
                          >
                            <option value="Tetap">Tetap (PKWTT)</option>
                            <option value="Kontrak">Kontrak (PKWT)</option>
                            <option value="Outsource">Outsource</option>
                            <option value="Magang">Magang (Intern)</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-medium text-slate-700 block mb-1">Grade Eselon</label>
                          <select
                            value={newGrade}
                            onChange={(e) => setNewGrade(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-medium cursor-pointer"
                          >
                            <option value="L1">L1 - Entry Level / Pelaksana</option>
                            <option value="L2">L2 - Junior Staff</option>
                            <option value="L3">L3 - Senior Specialist</option>
                            <option value="L4">L4 - Principal / Lead</option>
                            <option value="M1">M1 - Assistant Manager</option>
                            <option value="M2">M2 - Manager</option>
                            <option value="M3">M3 - Senior Manager</option>
                            <option value="D1">D1 - Director / C-Level</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="font-medium text-slate-700 block mb-1">Divisi / Departemen *</label>
                          <input
                            type="text"
                            required
                            value={newDept}
                            onChange={(e) => setNewDept(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded font-medium"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-slate-700 block mb-1">Posisi / Jabatan Resmi *</label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Senior DevOps Engineer"
                            value={newPosition}
                            onChange={(e) => setNewPosition(e.target.value)}
                            className={`w-full px-3 py-2 border rounded font-medium ${
                              showValidationErrors && !newPosition.trim()
                                ? 'border-rose-500 bg-rose-50/30'
                                : 'border-slate-300'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="font-medium text-slate-700 block mb-1">Atasan Langsung (Direct Supervisor)</label>
                          <input
                            type="text"
                            value={newDirectSupervisor}
                            onChange={(e) => setNewDirectSupervisor(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-slate-700 block mb-1">Lokasi Kerja / Cabang</label>
                          <input
                            type="text"
                            value={newBranchLocation}
                            onChange={(e) => setNewBranchLocation(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
                        <ValidatedDateInput
                          id="formNewJoinDate"
                          label="Tanggal Mulai Bertugas (Join Date) *"
                          value={newJoinDate}
                          onChange={(val) => setNewJoinDate(val)}
                          required
                          showError={showValidationErrors}
                          helperText="Format YYYY-MM-DD. Tanggal resmi aktif bertugas"
                        />

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-medium text-slate-700 block text-xs">
                              Status Evaluasi Percobaan (Probation)
                            </label>
                            {newType !== 'Tetap' && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold border border-amber-200">
                                Hanya Berlaku PKWTT
                              </span>
                            )}
                          </div>
                          <select
                            disabled={newType !== 'Tetap'}
                            value={newType === 'Tetap' ? newProbationStatus : 'Tanpa Percobaan'}
                            onChange={(e) => setNewProbationStatus(e.target.value as any)}
                            className={`w-full px-3 py-2 border rounded font-medium text-xs ${
                              newType === 'Tetap'
                                ? 'border-slate-300 bg-white cursor-pointer text-slate-900'
                                : 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <option value="Sedang Berjalan">Sedang Berjalan (Probation 3 Bulan)</option>
                            <option value="Lolos">Lolos Evaluasi (Langsung Lolos)</option>
                            <option value="Tanpa Percobaan">Tanpa Percobaan</option>
                          </select>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {newType === 'Tetap'
                              ? 'Maksimal 3 bulan masa percobaan sesuai regulasi ketenagakerjaan (PKWTT).'
                              : 'Sesuai PP 35/2021 & UU Ketenagakerjaan, masa percobaan hanya berlaku untuk PKWTT (Tetap). Non-PKWTT tidak diperkenankan ada masa percobaan.'}
                          </p>
                        </div>
                      </div>

                      {newType === 'Kontrak' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
                          <ValidatedDateInput
                            id="formContractStart"
                            label="Tanggal Mulai Kontrak PKWT"
                            value={newContractStartDate}
                            onChange={(val) => setNewContractStartDate(val)}
                          />
                          <ValidatedDateInput
                            id="formContractEnd"
                            label="Tanggal Akhir Kontrak PKWT"
                            value={newContractEndDate}
                            onChange={(val) => setNewContractEndDate(val)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: IDENTITAS KEPENDUDUKAN */}
                {dossierFormTab === 'identitas' && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      <span>Data Kependudukan Resmi Sesuai Dukcapil KTP & KK</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="font-medium text-slate-700 block mb-1">Nomor NIK KTP (16 Digit) *</label>
                        <input
                          type="text"
                          required
                          maxLength={16}
                          value={newNikKtp}
                          onChange={(e) => setNewNikKtp(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold tracking-wider"
                        />
                      </div>
                      <div>
                        <label className="font-medium text-slate-700 block mb-1">Nomor Kartu Keluarga (KK)</label>
                        <input
                          type="text"
                          maxLength={16}
                          value={newNoKk}
                          onChange={(e) => setNewNoKk(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded font-mono tracking-wider"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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
                          id="formBirthDate"
                          label="Tanggal Lahir Karyawan *"
                          value={newBirthDate}
                          onChange={(val) => setNewBirthDate(val)}
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
                          className="w-full px-3 py-2 border border-slate-300 rounded bg-white cursor-pointer"
                        >
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="font-medium text-slate-700 block mb-1">Golongan Darah</label>
                        <select
                          value={newBloodType}
                          onChange={(e) => setNewBloodType(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-mono cursor-pointer"
                        >
                          <option value="O">Tipe O (Rhesus +)</option>
                          <option value="A">Tipe A (Rhesus +)</option>
                          <option value="B">Tipe B (Rhesus +)</option>
                          <option value="AB">Tipe AB (Rhesus +)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-medium text-slate-700 block mb-1">Agama</label>
                        <select
                          value={newReligion}
                          onChange={(e) => setNewReligion(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-300 rounded bg-white cursor-pointer"
                        >
                          <option value="Islam">Islam</option>
                          <option value="Kristen">Kristen Protestan</option>
                          <option value="Katolik">Katolik</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Buddha">Buddha</option>
                          <option value="Konghucu">Konghucu</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-medium text-slate-700 block mb-1">Status Pernikahan</label>
                        <select
                          value={newMaritalStatus}
                          onChange={(e) => setNewMaritalStatus(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-300 rounded bg-white cursor-pointer"
                        >
                          <option value="Lajang">Lajang (Belum Menikah)</option>
                          <option value="Menikah">Menikah</option>
                          <option value="Cerai Hidup">Cerai Hidup</option>
                          <option value="Cerai Mati">Cerai Mati</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div className="sm:col-span-2">
                          <label className="font-medium text-slate-700 block mb-1">Alamat Sesuai KTP</label>
                          <textarea
                            rows={2}
                            value={newKtpAddress}
                            onChange={(e) => setNewKtpAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-700 block mb-1">Kode Pos</label>
                          <input
                            type="text"
                            value={newPostalCode}
                            onChange={(e) => setNewPostalCode(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-medium text-slate-700 block">Alamat Domisili Sekarang</label>
                          <button
                            type="button"
                            onClick={() => setNewCurrentAddress(newKtpAddress)}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                          >
                            Salin dari Alamat KTP
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={newCurrentAddress}
                          onChange={(e) => setNewCurrentAddress(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: PAJAK & BPJS */}
                {dossierFormTab === 'pajak' && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Perpajakan PPh 21 (TER 2024) & Kepesertaan Jaminan BPJS</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="font-medium text-slate-700 block mb-1">NPWP Format Baru (16 Digit)</label>
                        <input
                          type="text"
                          value={newNpwp16}
                          onChange={(e) => setNewNpwp16(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-medium text-slate-700 block mb-1">NPWP Format Lama (15 Digit)</label>
                        <input
                          type="text"
                          value={newNpwp}
                          onChange={(e) => setNewNpwp(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="font-medium text-slate-700 block mb-1">KPP Pratama Terdaftar</label>
                        <input
                          type="text"
                          value={newKpp}
                          onChange={(e) => setNewKpp(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="font-medium text-slate-700 block mb-1">
                          Status Pajak PTKP (TER PP 58/2023)
                        </label>
                        <select
                          value={newPtkp}
                          onChange={(e) => setNewPtkp(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-mono font-semibold cursor-pointer"
                        >
                          <option value="TK/0">TK/0 (Lajang tanpa tanggungan) - TER A</option>
                          <option value="TK/1">TK/1 (Lajang 1 tanggungan) - TER A</option>
                          <option value="TK/2">TK/2 (Lajang 2 tanggungan) - TER B</option>
                          <option value="TK/3">TK/3 (Lajang 3 tanggungan) - TER B</option>
                          <option value="K/0">K/0 (Menikah tanpa tanggungan) - TER A</option>
                          <option value="K/1">K/1 (Menikah 1 tanggungan) - TER B</option>
                          <option value="K/2">K/2 (Menikah 2 tanggungan) - TER B</option>
                          <option value="K/3">K/3 (Menikah 3 tanggungan) - TER C</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
                      {/* BPJS Ketenagakerjaan */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-800 text-xs">
                            BPJS Ketenagakerjaan (KPJ)
                          </label>
                          <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!hasBpjsTk}
                              onChange={(e) => {
                                const belumAda = e.target.checked;
                                setHasBpjsTk(!belumAda);
                                if (belumAda) setNewBpjsTk('');
                                else if (!newBpjsTk) setNewBpjsTk('24' + Math.floor(1000000000 + Math.random() * 9000000000));
                              }}
                              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="text-[11px] text-amber-700 font-bold">Belum / Tidak Ada</span>
                          </label>
                        </div>

                        {hasBpjsTk ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              placeholder="Nomor KPJ (11 digit)"
                              value={newBpjsTk}
                              onChange={(e) => setNewBpjsTk(e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                            />
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-emerald-700 font-semibold">✓ Kartu KPJ Ada</span>
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                                Status: Perlu Pengalihan / Update Perusahaan
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-900 text-[11px]">Belum Ada Kartu KPJ</span>
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px]">
                                Perlu Pembuatan Baru
                              </span>
                            </div>
                            <p className="text-[10px] text-amber-700 leading-normal">
                              Karyawan ditandai belum memiliki KPJ. HRD akan memproses <strong>pendaftaran pembuatan baru</strong> ke BPJS Ketenagakerjaan.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* BPJS Kesehatan */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-800 text-xs">
                            No. Kartu BPJS Kesehatan
                          </label>
                          <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!hasBpjsKes}
                              onChange={(e) => {
                                const belumAda = e.target.checked;
                                setHasBpjsKes(!belumAda);
                                if (belumAda) setNewBpjsKes('');
                                else if (!newBpjsKes) setNewBpjsKes('0001' + Math.floor(10000000 + Math.random() * 90000000));
                              }}
                              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="text-[11px] text-amber-700 font-bold">Belum / Tidak Ada</span>
                          </label>
                        </div>

                        {hasBpjsKes ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              placeholder="Nomor Kartu BPJS Kesehatan (13 digit)"
                              value={newBpjsKes}
                              onChange={(e) => setNewBpjsKes(e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                            />
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-emerald-700 font-semibold">✓ Kartu BPJS Ada</span>
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                                Status: Perlu Pengalihan / Update Perusahaan
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-900 text-[11px]">Belum Ada Kartu BPJS Kes</span>
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px]">
                                Perlu Pembuatan Baru
                              </span>
                            </div>
                            <p className="text-[10px] text-amber-700 leading-normal">
                              Karyawan ditandai belum memiliki kartu BPJS Kesehatan. HRD akan memproses <strong>pendaftaran pembuatan baru</strong> ke BPJS Kesehatan.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="font-medium text-slate-700 block mb-1">
                        Fasilitas Kesehatan Tingkat 1 (Faskes BPJS)
                      </label>
                      <input
                        type="text"
                        value={newFaskes}
                        onChange={(e) => setNewFaskes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded"
                        placeholder="Contoh: Puskesmas Kecamatan Setiabudi"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 4: REMUNERASI & BANK */}
                {dossierFormTab === 'finansial' && (
                  <div className="space-y-4">
                    {/* Information Banner: Setup di Menu Payroll */}
                    <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 flex items-start gap-3 shadow-2xs">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0 text-sky-700 font-bold mt-0.5">
                        <Info className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <h5 className="font-bold text-sky-950 text-sm mb-1 flex items-center gap-2">
                          <span>Struktur Remunerasi & Benefit Dikelola di Menu Payroll</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-200 text-sky-800 uppercase tracking-wider">
                            Setup di Payroll
                          </span>
                        </h5>
                        <p className="text-sky-800 leading-relaxed">
                          Rincian struktur kompensasi, gaji pokok, serta benefit bulanan karyawan baru akan disetup secara terpusat melalui <strong>Menu Payroll</strong>. 
                          Pada tab pendaftaran karyawan ini, rincian kompensasi berstatus <em>Belum Disetup (Readonly)</em>. Silakan lengkapi <strong>Input Rekening Bank Payroll Karyawan</strong> di bawah ini, lalu lakukan konfigurasi komponen payroll pada Menu Payroll setelah data karyawan tersimpan.
                        </p>
                      </div>
                    </div>

                    {/* Rincian Kompensasi & Benefit (Readonly / Status Belum Disetup) */}
                    <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                          <CreditCard className="w-4 h-4 text-slate-500" />
                          <span>Rincian Struktur Kompensasi & Benefit Bulanan</span>
                        </h4>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          Belum Disetup (Setup di Menu Payroll)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">
                            Gaji Pokok Bulanan
                          </label>
                          <div className="px-3 py-2 bg-white/80 border border-slate-200 rounded-lg text-slate-700 font-mono text-sm flex items-center justify-between shadow-2xs">
                            <span className={newBasicSalary > 0 ? 'font-bold text-slate-800' : 'text-slate-400 italic'}>
                              {newBasicSalary > 0 ? formatRupiah(newBasicSalary) : 'Rp 0 (Belum Disetup)'}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-sans font-medium">Readonly</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {newBasicSalary > 0 ? 'Nilai referensi dari penawaran rekrutmen.' : 'Akan disetup melalui Menu Payroll.'}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">
                            Tunjangan Tetap Keahlian
                          </label>
                          <div className="px-3 py-2 bg-white/80 border border-slate-200 rounded-lg text-slate-700 font-mono text-sm flex items-center justify-between shadow-2xs">
                            <span className={newFixedAllow > 0 ? 'font-bold text-slate-800' : 'text-slate-400 italic'}>
                              {newFixedAllow > 0 ? formatRupiah(newFixedAllow) : 'Rp 0 (Belum Disetup)'}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-sans font-medium">Readonly</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">Disetup melalui Menu Payroll.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Tunjangan Jabatan</label>
                          <div className="px-3 py-2 bg-white/80 border border-slate-200 rounded-lg text-slate-700 font-mono text-xs flex items-center justify-between">
                            <span className={newPositionAllow > 0 ? 'font-bold text-slate-800' : 'text-slate-400 italic'}>
                              {newPositionAllow > 0 ? formatRupiah(newPositionAllow) : 'Rp 0'}
                            </span>
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-sans">Readonly</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Tunjangan Transport</label>
                          <div className="px-3 py-2 bg-white/80 border border-slate-200 rounded-lg text-slate-700 font-mono text-xs flex items-center justify-between">
                            <span className={newTransportAllow > 0 ? 'font-bold text-slate-800' : 'text-slate-400 italic'}>
                              {newTransportAllow > 0 ? formatRupiah(newTransportAllow) : 'Rp 0'}
                            </span>
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-sans">Readonly</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Tunjangan Makan</label>
                          <div className="px-3 py-2 bg-white/80 border border-slate-200 rounded-lg text-slate-700 font-mono text-xs flex items-center justify-between">
                            <span className={newMealAllow > 0 ? 'font-bold text-slate-800' : 'text-slate-400 italic'}>
                              {newMealAllow > 0 ? formatRupiah(newMealAllow) : 'Rp 0'}
                            </span>
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-sans">Readonly</span>
                          </div>
                        </div>
                      </div>

                      {/* Info setup card */}
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-bold text-amber-950 block text-xs">
                              Rincian Kompensasi Belum Disetup
                            </span>
                            <span className="text-[11px] text-amber-800">
                              Silakan lakukan konfigurasi komponen payroll pada <strong>Menu Payroll</strong> setelah menyimpan data karyawan ini.
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded border border-amber-300 shrink-0">
                          Setup di Menu Payroll
                        </span>
                      </div>
                    </div>

                    {/* Input Rekening Bank Payroll Karyawan */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                          <CreditCard className="w-4 h-4 text-indigo-600" />
                          <span>Input Rekening Bank Payroll Karyawan</span>
                        </h4>
                        <span className="text-[11px] text-slate-500">Wajib diisi untuk proses transfer gaji</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="font-medium text-slate-700 block mb-1 text-xs">Bank Mitra Payroll *</label>
                          <select
                            value={newBankName}
                            onChange={(e) => setNewBankName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-medium cursor-pointer text-xs"
                          >
                            <option value="BCA">Bank BCA</option>
                            <option value="Mandiri">Bank Mandiri</option>
                            <option value="BNI">Bank BNI</option>
                            <option value="BRI">Bank BRI</option>
                            <option value="CIMB">Bank CIMB Niaga</option>
                            <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                            <option value="Permata">Bank Permata</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-medium text-slate-700 block mb-1 text-xs">Nomor Rekening Payroll *</label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: 1234567890"
                            value={newBankAccount}
                            onChange={(e) => setNewBankAccount(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-slate-700 block mb-1 text-xs">Nama Pemilik Rekening</label>
                          <input
                            type="text"
                            placeholder={newName ? `Contoh: ${newName}` : 'Sama dengan nama karyawan jika kosong'}
                            value={newBankAccountHolder}
                            onChange={(e) => setNewBankAccountHolder(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: PENDIDIKAN & KUALIFIKASI */}
                {dossierFormTab === 'pendidikan' && (
                  <div className="space-y-4">
                    {/* 1. Riwayat Pendidikan Formal & Kualifikasi Akademik */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                            <GraduationCap className="w-4 h-4 text-indigo-600" />
                            <span>Riwayat Pendidikan Formal & Kualifikasi Akademik</span>
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            Dapat menambahkan lebih dari 1 riwayat pendidikan formal (D3, S1, S2, S3, dsb.)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddFormalEducation}
                          className="self-start sm:self-auto px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Pendidikan Formal</span>
                        </button>
                      </div>

                      {/* Preview Gelar Akademik jika ada S1-S3 */}
                      {(compiledFrontTitles || compiledBackTitles) && (
                        <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                              Preview Nama dengan Gelar Akademik (S1 - S3)
                            </span>
                            <strong className="text-sm text-indigo-950 font-bold">
                              {compiledFrontTitles ? `${compiledFrontTitles} ` : ''}
                              {newName || 'Nama Karyawan'}
                              {compiledBackTitles ? `, ${compiledBackTitles}` : ''}
                            </strong>
                            <p className="text-[10px] text-indigo-700 mt-0.5">
                              Sesuai ketentuan, penulisan gelar pada nama hanya berlaku dari jenjang Strata 1 (S1) atau setara sampai S3.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleApplyTitlesToName}
                            className="self-start sm:self-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shrink-0 shadow-2xs transition-colors cursor-pointer"
                          >
                            Terapkan ke Nama Karyawan
                          </button>
                        </div>
                      )}

                      {/* List Formulir Pendidikan Formal */}
                      <div className="space-y-3.5">
                        {formalEducations.map((item, idx) => {
                          const isEligibleForTitle = ['S1', 'D4/S1', 'S2', 'S3'].includes(item.degree);
                          return (
                            <div
                              key={item.id}
                              className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3 relative group"
                            >
                              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <span className="font-bold text-xs text-slate-800">
                                    Pendidikan #{idx + 1}: {item.degree} — {item.institution || 'Belum diisi'}
                                  </span>
                                </div>
                                {formalEducations.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFormalEducation(item.id)}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                                    title="Hapus riwayat pendidikan ini"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="font-medium text-slate-700 block mb-1 text-xs">
                                    Jenjang Pendidikan *
                                  </label>
                                  <select
                                    value={item.degree}
                                    onChange={(e) =>
                                      handleUpdateFormalEducation(item.id, 'degree', e.target.value as any)
                                    }
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-semibold text-xs cursor-pointer"
                                  >
                                    <option value="SMA/SMK">SMA / SMK / Sederajat</option>
                                    <option value="D1/D2">Diploma 1 / Diploma 2 (D1/D2)</option>
                                    <option value="D3">Diploma 3 (D3)</option>
                                    <option value="D4/S1">Diploma 4 / Sarjana Terapan (D4/S1)</option>
                                    <option value="S1">Strata 1 (S1) / Sarjana</option>
                                    <option value="S2">Strata 2 (S2) / Magister</option>
                                    <option value="S3">Strata 3 (S3) / Doktor</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="font-medium text-slate-700 block mb-1 text-xs">
                                    Institusi / Universitas / Sekolah *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: Universitas Indonesia"
                                    value={item.institution}
                                    onChange={(e) => handleUpdateFormalEducation(item.id, 'institution', e.target.value)}
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="font-medium text-slate-700 block mb-1 text-xs">
                                    Program Studi / Jurusan *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: Teknik Informatika"
                                    value={item.major}
                                    onChange={(e) => handleUpdateFormalEducation(item.id, 'major', e.target.value)}
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="font-medium text-slate-700 block mb-1 text-xs">Tahun Kelulusan</label>
                                  <input
                                    type="number"
                                    value={item.graduationYear}
                                    onChange={(e) =>
                                      handleUpdateFormalEducation(item.id, 'graduationYear', Number(e.target.value))
                                    }
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="font-medium text-slate-700 block mb-1 text-xs">IPK / Nilai Akhir</label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: 3.75"
                                    value={item.gpa || ''}
                                    onChange={(e) => handleUpdateFormalEducation(item.id, 'gpa', e.target.value)}
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold text-emerald-700 text-xs bg-white"
                                  />
                                </div>
                              </div>

                              {/* Bagian Form Gelar Depan & Gelar Belakang (Khusus S1 atau setara sampai S3) */}
                              <div className="pt-2 border-t border-slate-200">
                                {isEligibleForTitle ? (
                                  <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                                        <Award className="w-3.5 h-3.5 text-indigo-600" />
                                        Gelar Akademik Karyawan (Khusus S1 s/d S3)
                                      </span>
                                      <span className="text-[10px] text-indigo-600 font-semibold bg-white px-2 py-0.5 rounded border border-indigo-200">
                                        Jenjang {item.degree} Memenuhi Syarat Gelar
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="font-medium text-slate-700 block mb-1 text-[11px]">
                                          Gelar Depan Nama
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="Contoh: Dr. / Ir. / Drs."
                                          value={item.frontTitle || ''}
                                          onChange={(e) =>
                                            handleUpdateFormalEducation(item.id, 'frontTitle', e.target.value)
                                          }
                                          className="w-full px-2.5 py-1.5 border border-indigo-200 rounded text-xs bg-white font-medium"
                                        />
                                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                                          Ditulis di depan nama (misal: Dr. atau Ir.)
                                        </span>
                                      </div>
                                      <div>
                                        <label className="font-medium text-slate-700 block mb-1 text-[11px]">
                                          Gelar Belakang Nama
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="Contoh: S.Kom. / S.T. / M.M. / Ph.D."
                                          value={item.backTitle || ''}
                                          onChange={(e) =>
                                            handleUpdateFormalEducation(item.id, 'backTitle', e.target.value)
                                          }
                                          className="w-full px-2.5 py-1.5 border border-indigo-200 rounded text-xs bg-white font-medium"
                                        />
                                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                                          Ditulis di belakang nama (misal: S.Kom., M.M.)
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500 text-[11px] flex items-center justify-between">
                                    <span>Gelar akademik tidak berlaku untuk jenjang {item.degree}.</span>
                                    <span className="text-[10px] bg-slate-200/80 px-2 py-0.5 rounded text-slate-600 font-medium">
                                      Gelar hanya ditulis dari jenjang S1/D4 sampai S3
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Riwayat Pendidikan Non Formal (Pelatihan Profesional / Sertifikasi) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                            <Award className="w-4 h-4 text-emerald-600" />
                            <span>Riwayat Pendidikan Non Formal & Pelatihan Profesional</span>
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            Pelatihan profesional, sertifikasi keahlian teknis/manajemen, dengan masa berlaku permanen atau expired
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddNonFormalEducation}
                          className="self-start sm:self-auto px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Pelatihan / Sertifikasi</span>
                        </button>
                      </div>

                      {nonFormalEducations.length === 0 ? (
                        <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          <p className="text-xs text-slate-500">Belum ada data pelatihan non-formal atau sertifikasi profesional.</p>
                          <button
                            type="button"
                            onClick={handleAddNonFormalEducation}
                            className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
                          >
                            + Tambah Pelatihan Profesional Sekarang
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {nonFormalEducations.map((item, idx) => (
                            <div
                              key={item.id}
                              className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3 relative group"
                            >
                              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <span className="font-bold text-xs text-slate-800">
                                    Pelatihan #{idx + 1}: {item.trainingName || 'Belum diisi'}
                                  </span>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                      item.validityType === 'Permanen'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : 'bg-amber-100 text-amber-800 border-amber-300'
                                    }`}
                                  >
                                    {item.validityType === 'Permanen' ? 'Masa Berlaku Permanen' : 'Ada Masa Berlaku'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveNonFormalEducation(item.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                                  title="Hapus pelatihan ini"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="font-medium text-slate-700 block mb-1 text-xs">
                                    Nama Pelatihan / Sertifikasi *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: Certified Scrum Master (CSM)"
                                    value={item.trainingName}
                                    onChange={(e) =>
                                      handleUpdateNonFormalEducation(item.id, 'trainingName', e.target.value)
                                    }
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white font-medium"
                                  />
                                </div>

                                <div>
                                  <label className="font-medium text-slate-700 block mb-1 text-xs">
                                    Lembaga Penyelenggara / Penerbit *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: BNSP / Scrum Alliance / Google"
                                    value={item.organizer}
                                    onChange={(e) =>
                                      handleUpdateNonFormalEducation(item.id, 'organizer', e.target.value)
                                    }
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="font-medium text-slate-700 block mb-1 text-xs">
                                    Tahun / Tanggal Perolehan
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: 2023 atau 2023-08-15"
                                    value={item.year}
                                    onChange={(e) =>
                                      handleUpdateNonFormalEducation(item.id, 'year', e.target.value)
                                    }
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white font-mono"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80">
                                <div>
                                  <label className="font-medium text-slate-700 block mb-1 text-xs">
                                    Nomor Sertifikat / Lisensi
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: CSM-2023-88912"
                                    value={item.certificateNumber || ''}
                                    onChange={(e) =>
                                      handleUpdateNonFormalEducation(item.id, 'certificateNumber', e.target.value)
                                    }
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white font-mono"
                                  />
                                </div>

                                <div>
                                  <label className="font-medium text-slate-700 block mb-1 text-xs">
                                    Sifat Masa Berlaku
                                  </label>
                                  <select
                                    value={item.validityType}
                                    onChange={(e) =>
                                      handleUpdateNonFormalEducation(item.id, 'validityType', e.target.value as any)
                                    }
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-xs font-semibold cursor-pointer"
                                  >
                                    <option value="Permanen">Permanen (Seumur Hidup / Tidak Ada Expired)</option>
                                    <option value="Memiliki Masa Berlaku">Memiliki Masa Berlaku (Ada Tanggal Expired)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="font-medium text-slate-700 block mb-1 text-xs">
                                    Tanggal Kadaluarsa (Expired Date)
                                  </label>
                                  <input
                                    type="date"
                                    disabled={item.validityType === 'Permanen'}
                                    value={item.expiredDate || ''}
                                    onChange={(e) =>
                                      handleUpdateNonFormalEducation(item.id, 'expiredDate', e.target.value)
                                    }
                                    className={`w-full px-3 py-1.5 border rounded text-xs font-mono ${
                                      item.validityType === 'Permanen'
                                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                        : 'bg-white border-slate-300 text-slate-900'
                                    }`}
                                  />
                                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                                    {item.validityType === 'Permanen'
                                      ? 'Tidak diperlukan tanggal expired'
                                      : 'Peringatan kadaluarsa akan muncul otomatis'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 6: KELUARGA & KONTAK DARURAT */}
                {dossierFormTab === 'keluarga' && (
                  <div className="space-y-4">
                    {/* Susunan Anggota Keluarga */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <HeartHandshake className="w-4 h-4 text-indigo-600" />
                          <span>Susunan Keluarga & Tanggungan BPJS</span>
                        </h4>
                        <button
                          type="button"
                          onClick={handleAddFamilyMember}
                          className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Anggota</span>
                        </button>
                      </div>

                      {newFamilyMembers.length === 0 ? (
                        <div className="p-3 bg-slate-50 rounded text-slate-500 text-center text-xs">
                          Belum ada anggota keluarga yang didaftarkan. Klik "+ Tambah Anggota" untuk mendaftarkan tanggungan BPJS.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {newFamilyMembers.map((fam, idx) => (
                            <div
                              key={fam.id || idx}
                              className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center"
                            >
                              <div className="sm:col-span-2">
                                <label className="text-[10px] text-slate-500 block">Nama Anggota</label>
                                <input
                                  type="text"
                                  value={fam.fullName}
                                  onChange={(e) => handleUpdateFamilyMember(idx, 'fullName', e.target.value)}
                                  placeholder="Nama lengkap"
                                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-medium"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 block">Hubungan</label>
                                <select
                                  value={fam.relation}
                                  onChange={(e) => handleUpdateFamilyMember(idx, 'relation', e.target.value as any)}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs cursor-pointer"
                                >
                                  <option value="Pasangan">Pasangan (Suami/Istri)</option>
                                  <option value="Anak">Anak</option>
                                  <option value="Orang Tua">Orang Tua</option>
                                  <option value="Mertua">Mertua</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 block">Tanggungan BPJS</label>
                                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 mt-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={fam.isBpjsCovered}
                                    onChange={(e) => handleUpdateFamilyMember(idx, 'isBpjsCovered', e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span>Ditanggung</span>
                                </label>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFamilyMember(idx)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Kontak Darurat (Emergency Contact) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-indigo-600" />
                          <span>Kontak Darurat (Emergency Contact)</span>
                        </h4>
                        <button
                          type="button"
                          onClick={handleAddEmergencyContact}
                          className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Kontak</span>
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {newEmergencyContacts.map((contact, idx) => (
                          <div
                            key={contact.id || idx}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
                          >
                            <div>
                              <label className="text-[10px] text-slate-500 block">Nama Kontak</label>
                              <input
                                type="text"
                                value={contact.fullName}
                                onChange={(e) => handleUpdateEmergencyContact(idx, 'fullName', e.target.value)}
                                placeholder="Nama lengkap"
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-medium"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block">Hubungan</label>
                              <select
                                value={contact.relation}
                                onChange={(e) => handleUpdateEmergencyContact(idx, 'relation', e.target.value as any)}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs cursor-pointer"
                              >
                                <option value="Orang Tua">Orang Tua</option>
                                <option value="Suami/Istri">Suami / Istri</option>
                                <option value="Saudara Kandung">Saudara Kandung</option>
                                <option value="Anak">Anak</option>
                                <option value="Kerabat">Kerabat</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block">Nomor HP / WhatsApp</label>
                              <input
                                type="tel"
                                value={contact.phone}
                                onChange={(e) => handleUpdateEmergencyContact(idx, 'phone', e.target.value)}
                                placeholder="08..."
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="text-[10px] text-slate-500 block">Alamat Singkat</label>
                                <input
                                  type="text"
                                  value={contact.address}
                                  onChange={(e) => handleUpdateEmergencyContact(idx, 'address', e.target.value)}
                                  placeholder="Kota / Alamat"
                                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                                />
                              </div>
                              {newEmergencyContacts.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEmergencyContact(idx)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded mt-3 transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 7: RIWAYAT SK KARIER & LEGALITAS */}
                {dossierFormTab === 'riwayat' && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <FileClock className="w-4 h-4 text-indigo-600" />
                      <span>Surat Keputusan (SK) Pengangkatan / Hubungan Kerja Awal</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="font-medium text-slate-700 block mb-1">
                          Nomor Dokumen SK / Kontrak Resmi *
                        </label>
                        <input
                          type="text"
                          value={newContractDoc}
                          onChange={(e) => setNewContractDoc(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold text-slate-900"
                        />
                      </div>

                      <ValidatedDateInput
                        id="formSkEffective"
                        label="Tanggal Efektif SK Berlaku *"
                        value={newSkEffectiveDate}
                        onChange={(val) => setNewSkEffectiveDate(val)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="font-medium text-slate-700 block mb-1">Pejabat Penandatangan SK</label>
                        <input
                          type="text"
                          value={newSkSignee}
                          onChange={(e) => setNewSkSignee(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="font-medium text-slate-700 block mb-1">Jabatan Pejabat Penandatangan</label>
                        <input
                          type="text"
                          value={newSkRole}
                          onChange={(e) => setNewSkRole(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-medium text-slate-700 block mb-1">
                        Catatan Legalitas / Ringkasan Keputusan Direksi
                      </label>
                      <textarea
                        rows={3}
                        value={newSkNotes}
                        onChange={(e) => setNewSkNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Footer Bar: Navigasi Antar-Tab & Tombol Simpan */}
              <div className="px-4 sm:px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevFormTab}
                    disabled={currentFormTabIndex === 0}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                      currentFormTabIndex === 0
                        ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400 bg-slate-50'
                        : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 shadow-2xs cursor-pointer'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tab Sebelumnya</span>
                    <span className="sm:hidden">Sebelumnya</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextFormTab}
                    disabled={currentFormTabIndex === DOSSIER_TABS.length - 1}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                      currentFormTabIndex === DOSSIER_TABS.length - 1
                        ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400 bg-slate-50'
                        : 'border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 shadow-2xs cursor-pointer'
                    }`}
                  >
                    <span className="hidden sm:inline">Tab Selanjutnya</span>
                    <span className="sm:hidden">Selanjutnya</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDossierFormOpen(false)}
                    className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md font-semibold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 sm:px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Simpan & Proses Tambah Data Karyawan</span>
                  </button>
                </div>
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
                        {selectedEmployee.bpjsTkNo === 'BELUM_ADA' || selectedEmployee.hasBpjsTk === false
                          ? 'Belum Memiliki Kartu'
                          : selectedEmployee.bpjsTkNo}
                      </strong>
                      {selectedEmployee.bpjsTkNo === 'BELUM_ADA' || selectedEmployee.hasBpjsTk === false ? (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold block mt-0.5">
                          Status: Perlu Pembuatan Baru
                        </span>
                      ) : (
                        <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-semibold block mt-0.5">
                          Status: Perlu Pengalihan Perusahaan
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">No. Kartu BPJS Kesehatan</span>
                      <strong className="font-mono text-slate-900 text-xs">
                        {selectedEmployee.bpjsKesNo === 'BELUM_ADA' || selectedEmployee.hasBpjsKes === false
                          ? 'Belum Memiliki Kartu'
                          : selectedEmployee.bpjsKesNo}
                      </strong>
                      {selectedEmployee.bpjsKesNo === 'BELUM_ADA' || selectedEmployee.hasBpjsKes === false ? (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold block mt-0.5">
                          Status: Perlu Pembuatan Baru
                        </span>
                      ) : (
                        <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-semibold block mt-0.5">
                          Status: Perlu Pengalihan Perusahaan
                        </span>
                      )}
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
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <span>Riwayat Pendidikan Formal & Kualifikasi Akademik</span>
                    </h4>

                    {selectedEmployee.formalEducations && selectedEmployee.formalEducations.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <tr>
                              <th className="py-2 px-3">Jenjang</th>
                              <th className="py-2 px-3">Institusi / Universitas</th>
                              <th className="py-2 px-3">Program Studi</th>
                              <th className="py-2 px-3">Tahun Lulus</th>
                              <th className="py-2 px-3">IPK / Nilai</th>
                              <th className="py-2 px-3">Gelar (Depan / Belakang)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedEmployee.formalEducations.map((edu, idx) => (
                              <tr key={idx}>
                                <td className="py-2 px-3 font-semibold text-indigo-700">{edu.degree}</td>
                                <td className="py-2 px-3 font-medium text-slate-900">{edu.institution}</td>
                                <td className="py-2 px-3 text-slate-700">{edu.major}</td>
                                <td className="py-2 px-3 font-mono text-slate-600">{edu.graduationYear}</td>
                                <td className="py-2 px-3 font-mono font-bold text-emerald-700">{edu.gpa || '-'}</td>
                                <td className="py-2 px-3">
                                  {edu.frontTitle || edu.backTitle ? (
                                    <span className="font-semibold text-slate-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                                      {edu.frontTitle ? `${edu.frontTitle} ` : ''}
                                      {edu.backTitle || ''}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
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
                    )}
                  </div>

                  {/* Riwayat Pendidikan Non Formal di Detail Modal */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>Riwayat Pendidikan Non Formal & Pelatihan Profesional</span>
                    </h4>

                    {selectedEmployee.nonFormalEducations && selectedEmployee.nonFormalEducations.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <tr>
                              <th className="py-2 px-3">Nama Pelatihan / Sertifikasi</th>
                              <th className="py-2 px-3">Lembaga Penyelenggara</th>
                              <th className="py-2 px-3">Tahun Perolehan</th>
                              <th className="py-2 px-3">No. Sertifikat</th>
                              <th className="py-2 px-3">Masa Berlaku</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedEmployee.nonFormalEducations.map((nf, idx) => (
                              <tr key={idx}>
                                <td className="py-2 px-3 font-semibold text-slate-900">{nf.trainingName}</td>
                                <td className="py-2 px-3 text-slate-700">{nf.organizer}</td>
                                <td className="py-2 px-3 font-mono text-slate-600">{nf.year}</td>
                                <td className="py-2 px-3 font-mono text-slate-600">{nf.certificateNumber || '-'}</td>
                                <td className="py-2 px-3">
                                  {nf.validityType === 'Permanen' ? (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                                      Permanen (Seumur Hidup)
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                                      Exp: {nf.expiredDate || 'Ada Masa Berlaku'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-1">
                        Belum ada riwayat pendidikan non-formal atau pelatihan profesional yang tercatat.
                      </p>
                    )}
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

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
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  RecruitmentStage,
  EmploymentType,
  Candidate,
  PTKPStatus,
  JobRequisition,
  JobVacancy,
  JobPostingChannel,
} from '../../types/hrms';
import { formatRupiah, calculatePPh21TER, calculateBPJS } from '../../utils/taxCalculator';
import { QRCodeView } from '../common/QRCodeView';
import { CurrencyInput } from '../common/CurrencyInput';
import { ScrollableTabNav } from '../common/ScrollableTabNav';

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
    addOnboardingProcess,
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

  // Main Symmetrical Operational Tabs (Clean, Standard Enterprise)
  const [activeTab, setActiveTab] = useState<
    'kanban' | 'permintaan' | 'sourcing' | 'talent_pool' | 'onboarding' | 'pengaturan'
  >('kanban');

  // Kanban view mode toggle (Board View vs Table View)
  const [kanbanViewMode, setKanbanViewMode] = useState<'board' | 'table'>('board');

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

  // ===================== 1. FORM FPTK (PERMINTAAN KARYAWAN BARU) =====================
  const [fptkPosition, setFptkPosition] = useState('');
  const [fptkGrade, setFptkGrade] = useState('Grade 2 - Officer / Senior Staff');
  const [fptkDept, setFptkDept] = useState('Engineering');
  const [fptkHeadcount, setFptkHeadcount] = useState(1);
  const [fptkReason, setFptkReason] = useState<JobRequisition['reason']>('Penambahan Headcount');
  const [fptkRequirements, setFptkRequirements] = useState('');
  const [fptkTargetDate, setFptkTargetDate] = useState('2026-11-15');
  const [fptkMinExp, setFptkMinExp] = useState('2+ Tahun');
  const [fptkEdu, setFptkEdu] = useState('S1 Teknik Informatika / Sistem Informasi');

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

  // Settings State
  const [offeringValidityDays, setOfferingValidityDays] = useState(7);
  const [requireDirectorAboveSalary, setRequireDirectorAboveSalary] = useState(25000000);

  // ===================== FILTERED CANDIDATES =====================
  const filteredCandidates = candidates.filter((c) => {
    const matchesVacancy = selectedVacancyId === 'all' || c.jobVacancyId === selectedVacancyId;
    const matchesSearch =
      searchTerm === '' ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastCompany.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesVacancy && matchesSearch;
  });

  // Helper matching candidate stages with backward-compatibility
  const isCandidateInStage = (c: Candidate, stageKey: RecruitmentStage) => {
    if (stageKey === 'Incoming') return c.stage === 'Incoming' || c.stage === 'Applied';
    return c.stage === stageKey;
  };

  // 7 Generous Horizontal Kanban Columns (Including Talent Pool for zero-fragmentation)
  const kanbanStages: {
    stage: RecruitmentStage;
    number: string;
    title: string;
    subtitle: string;
    badgeColor: string;
    headerAccent: string;
  }[] = [
    {
      stage: 'Incoming',
      number: '3',
      title: 'Incoming',
      subtitle: 'Lamaran & CV Parsing',
      badgeColor: 'bg-blue-100 text-blue-900',
      headerAccent: 'border-blue-600',
    },
    {
      stage: 'Screening',
      number: '4',
      title: 'Screening',
      subtitle: 'Keyword Match & Shortlist',
      badgeColor: 'bg-sky-100 text-sky-900',
      headerAccent: 'border-sky-600',
    },
    {
      stage: 'Assessment',
      number: '5',
      title: 'Assessment',
      subtitle: 'Tes Kompetensi & Skoring',
      badgeColor: 'bg-amber-100 text-amber-900',
      headerAccent: 'border-amber-600',
    },
    {
      stage: 'Interview',
      number: '6',
      title: 'Interview',
      subtitle: 'Kalender & Scorecard',
      badgeColor: 'bg-emerald-100 text-emerald-900',
      headerAccent: 'border-emerald-600',
    },
    {
      stage: 'Offered',
      number: '7',
      title: 'Offering',
      subtitle: 'Kalkulator THP & SK QR',
      badgeColor: 'bg-blue-100 text-blue-900',
      headerAccent: 'border-blue-700',
    },
    {
      stage: 'Hired',
      number: '8a',
      title: 'Diterima (Hired)',
      subtitle: 'Transisi ke Onboarding',
      badgeColor: 'bg-teal-100 text-teal-900',
      headerAccent: 'border-teal-600',
    },
    {
      stage: 'TalentPool',
      number: '8b',
      title: 'Talent Pool',
      subtitle: 'Basis Data Cadangan',
      badgeColor: 'bg-slate-200 text-slate-800',
      headerAccent: 'border-slate-400',
    },
  ];

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
  const handleCreateFptk = (e: React.FormEvent) => {
    e.preventDefault();
    const count = jobRequisitions.length + 1;
    const reqNum = `FPTK/${fptkDept.substring(0, 3).toUpperCase()}/2026/${String(count).padStart(3, '0')}`;
    addJobRequisition({
      reqNumber: reqNum,
      position: fptkPosition,
      grade: fptkGrade,
      department: fptkDept,
      headcount: Number(fptkHeadcount),
      reason: fptkReason,
      requirements: fptkRequirements,
      targetJoinDate: fptkTargetDate,
      minExperience: fptkMinExp,
      educationMin: fptkEdu,
      status: 'Disetujui',
      requesterName: 'Hiring Manager',
      approvedBy: 'Aditya Pratama (Head of People)',
    });
    setIsRequisitionModalOpen(false);
    setFptkPosition('');
    setFptkRequirements('');
    alert(`Permintaan Karyawan Baru (${reqNum}) berhasil disetujui & tercatat di sistem.`);
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

  const handlePushToOnboarding = (candidateToHire?: Candidate) => {
    const target = candidateToHire || activeCandidate;
    if (!target) return;

    const vac = vacancies.find((v) => v.id === target.jobVacancyId);
    const pos = vac?.title || 'Senior Specialist';
    const dept = vac?.department || 'Engineering';

    addOnboardingProcess({
      type: 'via_recruitment',
      candidateId: target.id,
      employeeName: target.name,
      email: target.email,
      phone: target.phone,
      position: pos,
      department: dept,
      employmentType: vac?.employmentType || 'Kontrak',
      joinDate: target.joinedDate || targetJoinDate || '2026-11-01',
      basicSalary: components.basicSalary,
      contractDocNumber: target.offeringDocNumber || docNumber,
      tasks: [
        { id: 't1', title: 'Verifikasi KTP, NPWP & Dokumen Ijazah', category: 'Legalitas & Dokumen', isCompleted: true, completedAt: new Date().toISOString().split('T')[0], assignedRole: 'hr_admin' },
        { id: 't2', title: 'Tanda Tangan Kontrak Digital QR (PKWT/PKWTT)', category: 'Legalitas & Dokumen', isCompleted: false, assignedRole: 'hr_admin' },
        { id: 't3', title: 'Penyediaan Laptop, Akses Akun & Email Korporat', category: 'Fasilitas & IT', isCompleted: false, assignedRole: 'ga_admin' },
        { id: 't4', title: 'Pendaftaran BPJS Ketenagakerjaan & PPh 21 TER', category: 'Payroll & Rekening', isCompleted: false, assignedRole: 'payroll_admin' },
        { id: 't5', title: 'Sesi Orientasi Budaya Kerja & Product Knowledge', category: 'Pengenalan & HR', isCompleted: false, assignedRole: 'hr_admin' },
      ],
    });

    updateCandidateStage(target.id, 'Hired', {
      joinedDate: target.joinedDate || targetJoinDate || '2026-11-01',
    });
    setIsOfferingDocPreviewOpen(false);
    alert(`Kandidat ${target.name} resmi diterima (Hired)! Berkas langsung ditransfer ke Modul Onboarding.`);
  };

  const handleMoveToTalentPool = (candidate: Candidate, reason?: string) => {
    const vac = vacancies.find((v) => v.id === candidate.jobVacancyId);
    updateCandidateStage(candidate.id, 'TalentPool', {
      disqualificationReason: reason || 'Disimpan di Talent Pool untuk kebutuhan pembukaan posisi serupa di masa depan.',
      talentPoolCategory: vac?.department || 'General Talent',
      talentPoolTags: candidate.parsedData?.topSkills || ['Potensial', 'Disimpan'],
    });
    setIsScreeningModalOpen(false);
    setIsResumeParserModalOpen(false);
    alert(`${candidate.name} telah dipindahkan ke Basis Data Cadangan (Talent Pool).`);
  };

  const handleReengageTalent = (candidate: Candidate) => {
    updateCandidateStage(candidate.id, 'Screening', {
      screeningNotes: 'Kandidat dipanggil ulang dari Talent Pool untuk proses seleksi aktif.',
    });
    alert(`${candidate.name} berhasil diaktifkan kembali ke Pipeline Seleksi Aktif (Tahap Screening)!`);
  };

  return (
    <div className="space-y-4">
      {/* ===================== ROW 1: HEADER & ACTION BUTTONS ===================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-700" />
            <span>Rekrutmen & Onboarding</span>
          </h2>
          <p className="text-xs text-slate-500">
            Siklus rekrutmen 8 tahap: Permintaan FPTK ➔ Sourcing ➔ Incoming ➔ Screening ➔ Assessment ➔ Interview ➔ Offering ➔ Onboarding & Talent Pool.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setIsRequisitionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs border border-slate-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-700" />
            <span>+ Buat FPTK</span>
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

      {/* ===================== ROW 2: MASTER 8-STAGE RECRUITMENT JOURNEY STEPPER ===================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-bold text-slate-900">Alur Standar 8 Tahap Rekrutmen:</span>
          </div>
          <span className="text-[11px] text-slate-400">Klik tahap untuk navigasi langsung</span>
        </div>

        {/* Horizontal Breadcrumb Chain with Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {/* Step 1: FPTK */}
          <button
            onClick={() => setActiveTab('permintaan')}
            className={`p-2 rounded-lg border text-left transition-all ${
              activeTab === 'permintaan'
                ? 'bg-blue-50 border-blue-600 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className="text-[10px] text-slate-500 font-semibold">Tahap 1</div>
            <div className="font-bold text-slate-900 text-xs truncate">Permintaan FPTK</div>
            <div className="text-[10px] font-mono font-bold text-blue-700 mt-0.5">
              {jobRequisitions.length} Diajukan
            </div>
          </button>

          {/* Step 2: Sourcing */}
          <button
            onClick={() => setActiveTab('sourcing')}
            className={`p-2 rounded-lg border text-left transition-all ${
              activeTab === 'sourcing'
                ? 'bg-blue-50 border-blue-600 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className="text-[10px] text-slate-500 font-semibold">Tahap 2</div>
            <div className="font-bold text-slate-900 text-xs truncate">Sourcing & Posting</div>
            <div className="text-[10px] font-mono font-bold text-blue-700 mt-0.5">
              {vacancies.length} Lowongan
            </div>
          </button>

          {/* Step 3: Incoming */}
          <button
            onClick={() => {
              setActiveTab('kanban');
              setKanbanViewMode('board');
            }}
            className={`p-2 rounded-lg border text-left transition-all ${
              activeTab === 'kanban'
                ? 'bg-blue-50/70 border-blue-400'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className="text-[10px] text-slate-500 font-semibold">Tahap 3</div>
            <div className="font-bold text-slate-900 text-xs truncate">Incoming & CV</div>
            <div className="text-[10px] font-mono font-bold text-blue-700 mt-0.5">
              {candidates.filter((c) => c.stage === 'Incoming' || c.stage === 'Applied').length} Pelamar
            </div>
          </button>

          {/* Step 4: Screening */}
          <button
            onClick={() => {
              setActiveTab('kanban');
              setKanbanViewMode('board');
            }}
            className="p-2 rounded-lg border bg-slate-50 hover:bg-slate-100 border-slate-200 text-left transition-all"
          >
            <div className="text-[10px] text-slate-500 font-semibold">Tahap 4</div>
            <div className="font-bold text-slate-900 text-xs truncate">Screening AI</div>
            <div className="text-[10px] font-mono font-bold text-sky-700 mt-0.5">
              {candidates.filter((c) => c.stage === 'Screening').length} Match
            </div>
          </button>

          {/* Step 5: Assessment */}
          <button
            onClick={() => {
              setActiveTab('kanban');
              setKanbanViewMode('board');
            }}
            className="p-2 rounded-lg border bg-slate-50 hover:bg-slate-100 border-slate-200 text-left transition-all"
          >
            <div className="text-[10px] text-slate-500 font-semibold">Tahap 5</div>
            <div className="font-bold text-slate-900 text-xs truncate">Tes Kompetensi</div>
            <div className="text-[10px] font-mono font-bold text-amber-700 mt-0.5">
              {candidates.filter((c) => c.stage === 'Assessment').length} Diuji
            </div>
          </button>

          {/* Step 6: Interview */}
          <button
            onClick={() => {
              setActiveTab('kanban');
              setKanbanViewMode('board');
            }}
            className="p-2 rounded-lg border bg-slate-50 hover:bg-slate-100 border-slate-200 text-left transition-all"
          >
            <div className="text-[10px] text-slate-500 font-semibold">Tahap 6</div>
            <div className="font-bold text-slate-900 text-xs truncate">Wawancara</div>
            <div className="text-[10px] font-mono font-bold text-emerald-700 mt-0.5">
              {candidates.filter((c) => c.stage === 'Interview').length} Jadwal
            </div>
          </button>

          {/* Step 7: Offering */}
          <button
            onClick={() => {
              setActiveTab('kanban');
              setKanbanViewMode('board');
            }}
            className="p-2 rounded-lg border bg-slate-50 hover:bg-slate-100 border-slate-200 text-left transition-all"
          >
            <div className="text-[10px] text-slate-500 font-semibold">Tahap 7</div>
            <div className="font-bold text-slate-900 text-xs truncate">Offering Letter</div>
            <div className="text-[10px] font-mono font-bold text-blue-700 mt-0.5">
              {candidates.filter((c) => c.stage === 'Offered').length} Ditawarkan
            </div>
          </button>

          {/* Step 8: Hired / Talent Pool */}
          <button
            onClick={() => setActiveTab('talent_pool')}
            className={`p-2 rounded-lg border text-left transition-all ${
              activeTab === 'talent_pool' || activeTab === 'onboarding'
                ? 'bg-blue-50 border-blue-600 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className="text-[10px] text-slate-500 font-semibold">Tahap 8</div>
            <div className="font-bold text-slate-900 text-xs truncate">Hired / Talent Pool</div>
            <div className="text-[10px] font-mono font-bold text-teal-700 mt-0.5">
              {candidates.filter((c) => c.stage === 'Hired').length} Hired · {candidates.filter((c) => c.stage === 'TalentPool').length} Pool
            </div>
          </button>
        </div>
      </div>

      {/* ===================== ROW 3: CLEAN SUB-MENU TABS (STANDARDIZED & TIDY) ===================== */}
      <ScrollableTabNav className="border-b border-slate-200" containerClassName="pt-1">
        <button
          onClick={() => setActiveTab('kanban')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'kanban'
              ? 'border-blue-700 text-blue-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Pipeline Seleksi ATS</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'kanban' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {candidates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('permintaan')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'permintaan'
              ? 'border-blue-700 text-blue-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Permintaan Karyawan (FPTK)</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'permintaan' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
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
          <span>Lowongan & Sourcing</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'sourcing' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {vacancies.length}
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
          <span>Talent Pool</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'talent_pool' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {candidates.filter((c) => c.stage === 'TalentPool').length}
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
          <span>Onboarding Tracker</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'onboarding'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {candidates.filter((c) => c.stage === 'Hired' || c.stage === 'Offered').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pengaturan')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'pengaturan'
              ? 'border-blue-700 text-blue-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Kriteria & Scoring</span>
        </button>
      </ScrollableTabNav>

      {/* ===================== TAB 1: PIPELINE SELEKSI ATS (UNIFIED HORIZONTAL KANBAN & TABLE) ===================== */}
      {activeTab === 'kanban' && (
        <div className="space-y-3.5">
          {/* Controls Bar: Filter, Search, and View Mode Switcher */}
          <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs flex-1">
              <div className="flex items-center gap-2 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-700">Filter Lowongan:</span>
              </div>
              <select
                id="recruitment-filter-posisi"
                value={selectedVacancyId}
                onChange={(e) => setSelectedVacancyId(e.target.value)}
                className="py-1.5 px-3 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden w-full sm:max-w-xs shadow-2xs"
              >
                <option value="all">Semua Lowongan Kerja ({vacancies.length})</option>
                {vacancies.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} ({v.department})
                  </option>
                ))}
              </select>

              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari pelamar, keahlian, kampus..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 shadow-2xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
              <span className="text-[11px] text-slate-500 font-medium">
                Menampilkan: <strong className="text-slate-800">{filteredCandidates.length}</strong> Kandidat
              </span>

              {/* View Mode Switcher */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setKanbanViewMode('board')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                    kanbanViewMode === 'board' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Papan Kanban Horizontal"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Papan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setKanbanViewMode('table')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                    kanbanViewMode === 'table' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tabel Ringkasan"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabel</span>
                </button>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: HORIZONTAL SCROLLING KANBAN BOARD */}
          {kanbanViewMode === 'board' ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100/60 p-3">
              <div className="flex gap-3.5 overflow-x-auto pb-4 pt-1 items-start min-w-0 scroll-smooth">
                {kanbanStages.map((stg) => {
                  const stageCandidates = filteredCandidates.filter((c) => isCandidateInStage(c, stg.stage));

                  return (
                    <div
                      key={stg.stage}
                      className="w-[295px] shrink-0 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col min-h-[500px]"
                    >
                      {/* Column Header */}
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

                      {/* Candidate Cards in Column */}
                      <div className="p-2.5 space-y-2 flex-1 bg-slate-50/40">
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
                                {/* Row 1: Candidate Name & Portal Badge */}
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

                                {/* Row 2: Target Position & Expected Salary */}
                                <div className="text-[11px] space-y-0.5 bg-slate-50 p-2 rounded border border-slate-100">
                                  <div className="font-semibold text-blue-950 truncate">
                                    {vac?.title || 'Posisi'}
                                  </div>
                                  <div className="text-slate-500 text-[10px]">
                                    Ekspektasi: <span className="font-mono font-bold text-slate-800">{formatRupiah(candidate.expectedSalary)}</span>
                                  </div>
                                </div>

                                {/* Stage-Specific Visual Highlights */}
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
                                        <span>Google Meet Link</span>
                                      </a>
                                    )}
                                  </div>
                                )}

                                {stg.stage === 'Offered' && (
                                  <div className="space-y-1 pt-0.5 text-[10px]">
                                    <div className="text-slate-600">
                                      Gaji Ditawarkan:{' '}
                                      <span className="font-mono font-bold text-slate-900">
                                        {formatRupiah(candidate.offeredSalary || candidate.expectedSalary)}
                                      </span>
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-500 truncate">
                                      SK: {candidate.offeringDocNumber || 'Draft'}
                                    </div>
                                  </div>
                                )}

                                {stg.stage === 'Hired' && (
                                  <div className="space-y-1 pt-0.5 text-[10px]">
                                    <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span>Diterima · Join: {candidate.joinedDate || '2026-11-01'}</span>
                                    </div>
                                  </div>
                                )}

                                {stg.stage === 'TalentPool' && (
                                  <div className="space-y-1 pt-0.5 text-[10px]">
                                    <span className="text-slate-500 block truncate">
                                      {candidate.disqualificationReason || 'Disimpan untuk kebutuhan masa depan'}
                                    </span>
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
                                        className="w-full py-1 px-2 text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded flex items-center justify-center gap-1 transition-colors"
                                      >
                                        <FileText className="w-3 h-3" />
                                        <span>Lihat Hasil Parsing CV</span>
                                      </button>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => updateCandidateStage(candidate.id, 'Screening')}
                                          className="flex-1 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-center transition-colors"
                                        >
                                          Lolos Screening →
                                        </button>
                                        <button
                                          onClick={() => handleMoveToTalentPool(candidate)}
                                          title="Pindahkan ke Talent Pool"
                                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                                        >
                                          <Archive className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </>
                                  )}

                                  {stg.stage === 'Screening' && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setActiveCandidate(candidate);
                                          setIsScreeningModalOpen(true);
                                        }}
                                        className="w-full py-1 text-[11px] font-semibold bg-sky-50 text-sky-800 hover:bg-sky-100 rounded flex items-center justify-center gap-1 transition-colors"
                                      >
                                        <Sparkles className="w-3 h-3 text-sky-600" />
                                        <span>Detail Screening AI</span>
                                      </button>
                                      <button
                                        onClick={() => updateCandidateStage(candidate.id, 'Assessment')}
                                        className="w-full py-1 text-[10px] font-semibold bg-blue-700 text-white hover:bg-blue-800 rounded text-center transition-colors"
                                      >
                                        Shortlist ke Tes Kompetensi →
                                      </button>
                                    </>
                                  )}

                                  {stg.stage === 'Assessment' && (
                                    <>
                                      <button
                                        onClick={() => handleOpenAssessmentModal(candidate)}
                                        className="w-full py-1 text-[11px] font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded flex items-center justify-center gap-1 transition-colors"
                                      >
                                        <Award className="w-3 h-3 text-amber-600" />
                                        <span>Input / Evaluasi Nilai Tes</span>
                                      </button>
                                      <button
                                        onClick={() => updateCandidateStage(candidate.id, 'Interview')}
                                        className="w-full py-1 text-[10px] font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded text-center transition-colors"
                                      >
                                        Loloskan ke Wawancara →
                                      </button>
                                    </>
                                  )}

                                  {stg.stage === 'Interview' && (
                                    <>
                                      <button
                                        onClick={() => handleOpenInterviewModal(candidate)}
                                        className="w-full py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded flex items-center justify-center gap-1 transition-colors"
                                      >
                                        <Calendar className="w-3 h-3 text-emerald-600" />
                                        <span>Jadwal & Scorecard</span>
                                      </button>
                                      <button
                                        onClick={() => handleOpenOfferingModal(candidate)}
                                        className="w-full py-1 text-[10px] font-semibold bg-blue-700 text-white hover:bg-blue-800 rounded text-center transition-colors"
                                      >
                                        Kalkulator Offering Letter →
                                      </button>
                                    </>
                                  )}

                                  {stg.stage === 'Offered' && (
                                    <>
                                      <button
                                        onClick={() => handleOpenOfferingModal(candidate)}
                                        className="w-full py-1 text-[11px] font-semibold bg-blue-50 text-blue-800 hover:bg-blue-100 rounded flex items-center justify-center gap-1 transition-colors"
                                      >
                                        <Calculator className="w-3 h-3" />
                                        <span>Kalkulator & SK Penawaran</span>
                                      </button>
                                      <button
                                        onClick={() => handlePushToOnboarding(candidate)}
                                        className="w-full py-1 text-[10px] font-semibold bg-emerald-700 text-white hover:bg-emerald-800 rounded text-center transition-colors"
                                      >
                                        Kandidat Terima & Hired →
                                      </button>
                                    </>
                                  )}

                                  {stg.stage === 'Hired' && (
                                    <button
                                      onClick={() => handlePushToOnboarding(candidate)}
                                      className="w-full py-1 text-[10px] font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 rounded text-center transition-colors flex items-center justify-center gap-1"
                                    >
                                      <UserPlus className="w-3 h-3 text-blue-700" />
                                      <span>Kelola Onboarding</span>
                                    </button>
                                  )}

                                  {stg.stage === 'TalentPool' && (
                                    <button
                                      onClick={() => handleReengageTalent(candidate)}
                                      className="w-full py-1 text-[10px] font-semibold bg-blue-700 text-white hover:bg-blue-800 rounded text-center transition-colors flex items-center justify-center gap-1"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      <span>Hubungi Kembali</span>
                                    </button>
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
            </div>
          ) : (
            /* VIEW MODE 2: DENSE RESPONSIVE TABLE VIEW */
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Nama Pelamar</th>
                      <th className="py-3 px-4">Posisi & Dept</th>
                      <th className="py-3 px-4">Sumber Portal</th>
                      <th className="py-3 px-4 text-center">Tahap Seleksi</th>
                      <th className="py-3 px-4">Hasil / Skor</th>
                      <th className="py-3 px-4">Ekspektasi Upah</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Tidak ada data pelamar yang sesuai dengan filter pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map((cand) => {
                        const vac = vacancies.find((v) => v.id === cand.jobVacancyId);
                        return (
                          <tr key={cand.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{cand.name}</div>
                              <span className="text-[10px] text-slate-500">{cand.lastCompany} · {cand.phone}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{vac?.title || 'Posisi'}</div>
                              <span className="text-[10px] text-slate-500">{vac?.department}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">
                                {cand.sourcePortal || 'LinkedIn'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                {cand.stage === 'Applied' ? 'Incoming' : cand.stage}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {cand.stage === 'Screening' && (
                                <span className="font-mono font-bold text-sky-800 text-[11px]">{cand.aiMatchScore || 88}% Match</span>
                              )}
                              {cand.stage === 'Assessment' && (
                                <span className="font-mono font-bold text-amber-800 text-[11px]">Skor: {cand.testScore || 0}/100</span>
                              )}
                              {cand.stage === 'Interview' && (
                                <span className="font-mono font-bold text-emerald-800 text-[11px]">★ {cand.interviewScore || 90}/100</span>
                              )}
                              {cand.stage === 'Offered' && (
                                <span className="font-mono text-blue-900 font-semibold text-[11px]">{cand.offeringDocNumber || 'Draft'}</span>
                              )}
                              {cand.stage === 'Hired' && (
                                <span className="text-emerald-700 font-bold text-[11px]">Join: {cand.joinedDate || '2026-11-01'}</span>
                              )}
                              {cand.stage === 'TalentPool' && (
                                <span className="text-slate-500 text-[11px]">Cadangan Talenta</span>
                              )}
                              {cand.stage === 'Incoming' && (
                                <span className="text-emerald-700 font-medium text-[11px]">Resume Parsed ({cand.parsedData?.extractionScore || 98}%)</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-800">
                              {formatRupiah(cand.expectedSalary)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {cand.stage === 'Incoming' && (
                                  <button
                                    onClick={() => {
                                      setActiveCandidate(cand);
                                      setIsResumeParserModalOpen(true);
                                    }}
                                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded font-semibold text-[11px]"
                                  >
                                    Parsing CV
                                  </button>
                                )}
                                {cand.stage === 'Screening' && (
                                  <button
                                    onClick={() => {
                                      setActiveCandidate(cand);
                                      setIsScreeningModalOpen(true);
                                    }}
                                    className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded font-semibold text-[11px]"
                                  >
                                    Screening
                                  </button>
                                )}
                                {cand.stage === 'Assessment' && (
                                  <button
                                    onClick={() => handleOpenAssessmentModal(cand)}
                                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-semibold text-[11px]"
                                  >
                                    Nilai Tes
                                  </button>
                                )}
                                {cand.stage === 'Interview' && (
                                  <button
                                    onClick={() => handleOpenInterviewModal(cand)}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold text-[11px]"
                                  >
                                    Scorecard
                                  </button>
                                )}
                                {cand.stage === 'Offered' && (
                                  <button
                                    onClick={() => handleOpenOfferingModal(cand)}
                                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded font-semibold text-[11px]"
                                  >
                                    Offering
                                  </button>
                                )}
                                {cand.stage === 'Hired' && (
                                  <button
                                    onClick={() => handlePushToOnboarding(cand)}
                                    className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold text-[11px]"
                                  >
                                    Onboarding
                                  </button>
                                )}
                                {cand.stage === 'TalentPool' && (
                                  <button
                                    onClick={() => handleReengageTalent(cand)}
                                    className="px-2 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded font-semibold text-[11px]"
                                  >
                                    Hubungi
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: PERMINTAAN KARYAWAN (FPTK) ===================== */}
      {activeTab === 'permintaan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 border border-slate-200 rounded-xl shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-700" />
                <span>Formulir Permintaan Tenaga Kerja (FPTK / Job Requisition)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tahap 1 inisiasi rekrutmen: Usulan formasi posisi, jenjang grade, kualifikasi requirement, dan persetujuan anggaran headcount.
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

          {/* Table FPTK */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No. Pengajuan FPTK</th>
                    <th className="py-3 px-4">Posisi & Jenjang Grade</th>
                    <th className="py-3 px-4">Departemen</th>
                    <th className="py-3 px-4 text-center">Headcount</th>
                    <th className="py-3 px-4">Alasan Kebutuhan</th>
                    <th className="py-3 px-4">Kualifikasi Requirement</th>
                    <th className="py-3 px-4">Target Join</th>
                    <th className="py-3 px-4 text-center">Status FPTK</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobRequisitions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Belum ada dokumen FPTK yang diajukan.
                      </td>
                    </tr>
                  ) : (
                    jobRequisitions.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {req.reqNumber}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Diajukan: {req.createdAt}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{req.position}</div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            {req.grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{req.department}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                          {req.headcount} Orang
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="text-[11px] font-medium">{req.reason}</span>
                          <span className="block text-[10px] text-slate-400">Oleh: {req.requesterName}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">
                          <p className="line-clamp-2 text-[11px]">{req.requirements}</p>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-800">{req.targetJoinDate}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              req.status === 'Disetujui'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : req.status === 'Menunggu Approval'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {req.status === 'Menunggu Approval' && (
                              <button
                                onClick={() => updateJobRequisition(req.id, { status: 'Disetujui' })}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                              >
                                Setujui
                              </button>
                            )}
                            {req.status === 'Disetujui' && (
                              <button
                                onClick={() => handleConvertFptkToVacancy(req)}
                                className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                              >
                                <Globe className="w-3 h-3" />
                                <span>Sebar Lowongan →</span>
                              </button>
                            )}
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

      {/* ===================== TAB 3: LOWONGAN & SOURCING ===================== */}
      {activeTab === 'sourcing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 border border-slate-200 rounded-xl shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-700" />
                <span>Distribusi Sourcing & Multi-Channel Job Posting</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tahap 2: Buat deskripsi pekerjaan, syarat kualifikasi, dan sebar otomatis ke berbagai portal kerja (Jobstreet, LinkedIn, Glints, Kalibrr, Website Karir).
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

          {/* Cards of Vacancies with Multi-Channel Controls */}
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
                        <span className="font-bold text-slate-900 text-sm block">
                          {vac.title}
                        </span>
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

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
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

                    {/* Sourcing Channels Distribution Badges */}
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

                  {/* Summary Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      Total Masuk: <strong className="text-slate-900 font-mono">{vacCandidates.length}</strong> Pelamar
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedVacancyId(vac.id);
                          setActiveTab('kanban');
                        }}
                        className="px-2.5 py-1 text-blue-700 hover:bg-blue-50 rounded text-xs font-semibold"
                      >
                        Lihat Pelamar →
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

      {/* ===================== TAB 4: TALENT POOL & CADANGAN ===================== */}
      {activeTab === 'talent_pool' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 border border-slate-200 rounded-xl shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Archive className="w-4 h-4 text-blue-700" />
                <span>Basis Data Cadangan Talenta (Talent Pool)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kandidat yang belum lolos pada posisi tertentu dipindahkan ke talent pool untuk kebutuhan rekrutmen masa depan tanpa perlu seleksi awal kembali.
              </p>
            </div>
          </div>

          {/* Talent Pool Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {candidates.filter((c) => c.stage === 'TalentPool').length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                Belum ada kandidat di dalam basis data cadangan (Talent Pool).
              </div>
            ) : (
              candidates
                .filter((c) => c.stage === 'TalentPool')
                .map((cand) => (
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
                        <span className="font-semibold text-slate-700 block text-[11px]">Catatan Evaluasi / Alasan:</span>
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

      {/* ===================== TAB 5: ONBOARDING TRACKER ===================== */}
      {activeTab === 'onboarding' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-700" />
                <span>Transisi Kandidat Diterima (Hired) ke Onboarding & Master Karyawan</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kandidat yang telah menyetujui surat penawaran kerja (Offering Letter) langsung ditransfer ke checklist orientasi, kontrak digital, dan pembuatan akun.
              </p>
            </div>
            <button
              onClick={() => setActiveModule('personalia')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300"
            >
              Buka Modul Personalia →
            </button>
          </div>

          {/* Table Candidates in Onboarding Transition */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Calon Karyawan</th>
                    <th className="py-3 px-4">Posisi & Departemen</th>
                    <th className="py-3 px-4">Nomor Offering Letter</th>
                    <th className="py-3 px-4">Gaji Penawaran (Gross)</th>
                    <th className="py-3 px-4">Tanggal Mulai (Join Date)</th>
                    <th className="py-3 px-4 text-center">Status Transisi</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.filter((c) => c.stage === 'Hired' || c.stage === 'Offered').length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada kandidat di tahap Offering atau Hired.
                      </td>
                    </tr>
                  ) : (
                    candidates
                      .filter((c) => c.stage === 'Hired' || c.stage === 'Offered')
                      .map((c) => {
                        const vac = vacancies.find((v) => v.id === c.jobVacancyId);
                        const isHired = c.stage === 'Hired';

                        return (
                          <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{c.name}</div>
                              <span className="text-[10px] text-slate-500 font-mono">{c.email}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{vac?.title || 'Posisi'}</div>
                              <span className="text-[10px] text-slate-500">{vac?.department}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-blue-900 font-semibold">
                              {c.offeringDocNumber || '001/OL-HRD/NTM/X/2026'}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-800">
                              {formatRupiah(c.offeredSalary || c.expectedSalary)}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700">
                              {c.joinedDate || '2026-11-01'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  isHired
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {isHired ? '✓ Siap Onboarding' : 'Menunggu Konfirmasi'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handlePushToOnboarding(c)}
                                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold text-xs shadow-2xs"
                              >
                                Transfer ke Onboarding →
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 6: KRITERIA & SCORING ===================== */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5 max-w-3xl">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Pengaturan Kriteria & Bobot Scoring ATS
            </h3>
            <p className="text-xs text-slate-500">
              Konfigurasi ambang batas kelulusan tes teknis, bobot penilaian wawancara, dan masa berlaku dokumen offering letter resmi.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <label className="font-semibold text-slate-800 block">
                Masa Berlaku Dokumen Offering Letter (Hari Kalender)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  value={offeringValidityDays}
                  onChange={(e) => setOfferingValidityDays(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 border border-slate-300 rounded font-mono text-slate-900 bg-white"
                />
                <span className="text-slate-500">Hari sejak tanggal penerbitan surat penawaran</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <label className="font-semibold text-slate-800 block">
                Ambang Batas Gaji Wajib Approval Direktur Utama (IDR)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={requireDirectorAboveSalary}
                  onChange={(e) => setRequireDirectorAboveSalary(Number(e.target.value))}
                  className="w-48 px-3 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900 bg-white"
                />
                <span className="text-slate-500">Gaji di atas nominal ini mewajibkan tanda tangan direksi</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <label className="font-semibold text-slate-800 block">
                Passing Grade Minimum Tes Kompetensi (0 - 100)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  defaultValue={75}
                  min={50}
                  max={100}
                  className="w-24 px-3 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900 bg-white"
                />
                <span className="text-slate-500">Kandidat dengan skor di bawah nilai ini otomatis disarankan ke Talent Pool</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => alert('Pengaturan kriteria dan scoring rekrutmen berhasil disimpan!')}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold text-xs shadow-2xs"
              >
                Simpan Konfigurasi ATS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 1: BUAT FPTK BARU ===================== */}
      {isRequisitionModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRequisitionModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-400" />
                  <span>Pengajuan Permintaan Karyawan Baru (FPTK)</span>
                </h3>
                <span className="text-xs text-slate-400">Tahap 1: Inisiasi formasi & grade posisi</span>
              </div>
              <button onClick={() => setIsRequisitionModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateFptk} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Posisi / Jabatan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Senior Backend Engineer"
                  value={fptkPosition}
                  onChange={(e) => setFptkPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jenjang Grade *</label>
                  <select
                    value={fptkGrade}
                    onChange={(e) => setFptkGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                  >
                    <option value="Grade 1 - Staff">Grade 1 - Staff</option>
                    <option value="Grade 2 - Officer / Senior Staff">Grade 2 - Officer / Senior Staff</option>
                    <option value="Grade 3 - Lead / Supervisor">Grade 3 - Lead / Supervisor</option>
                    <option value="Grade 4 - Manager / Specialist">Grade 4 - Manager / Specialist</option>
                    <option value="Grade 5 - Head / VP">Grade 5 - Head / VP</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Departemen *</label>
                  <input
                    type="text"
                    required
                    value={fptkDept}
                    onChange={(e) => setFptkDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jumlah Headcount *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={fptkHeadcount}
                    onChange={(e) => setFptkHeadcount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Alasan Kebutuhan *</label>
                  <select
                    value={fptkReason}
                    onChange={(e) => setFptkReason(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Penambahan Headcount">Penambahan Headcount</option>
                    <option value="Penggantian Karyawan Resign">Penggantian Karyawan Resign</option>
                    <option value="Proyek Baru">Proyek Baru</option>
                    <option value="Ekspansi Bisnis">Ekspansi Bisnis</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kualifikasi & Requirement Spesifik *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Sebutkan pendidikan minimal, tahun pengalaman, keahlian teknis/tools..."
                  value={fptkRequirements}
                  onChange={(e) => setFptkRequirements(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Min. Pengalaman</label>
                  <input
                    type="text"
                    value={fptkMinExp}
                    onChange={(e) => setFptkMinExp(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Tanggal Masuk</label>
                  <input
                    type="date"
                    required
                    value={fptkTargetDate}
                    onChange={(e) => setFptkTargetDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequisitionModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-2xs"
                >
                  Ajukan & Setujui FPTK
                </button>
              </div>
            </form>
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
                <span className="text-xs text-slate-400">Tahap 2: Auto-broadcast ke portal kerja & medsos</span>
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

              {/* Multi-Channel Distribution Checkboxes */}
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
                <span className="text-xs text-slate-400">Tahap 3: Ekstraksi data penting CV pelamar</span>
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

              {/* File Info */}
              <div className="flex items-center justify-between text-slate-500 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span className="font-medium text-slate-800">{activeCandidate.cvFileName || 'CV_Pelamar.pdf'}</span>
                </div>
                <span>{activeCandidate.cvFileSize || '1.2 MB'} · Sumber: <strong>{activeCandidate.sourcePortal || 'LinkedIn'}</strong></span>
              </div>

              {/* Extracted Details */}
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
                  onClick={() => handleMoveToTalentPool(activeCandidate)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Pindahkan ke Talent Pool
                </button>
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
                <span className="text-xs text-slate-400">Tahap 4: Pencocokan syarat & shortlist</span>
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
                  onClick={() => handleMoveToTalentPool(activeCandidate)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Simpan ke Talent Pool
                </button>
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
                <span className="text-xs text-slate-400">{activeCandidate.name} · Tahap 5</span>
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
                <span className="text-xs text-slate-400">{activeCandidate.name} · Tahap 6</span>
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
                  <label className="font-semibold text-slate-700 block mb-1">Pewawancara (Hiring Team) *</label>
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
              {/* Kop Dokumen */}
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

              {/* Title & Number */}
              <div className="text-center space-y-0.5">
                <h2 className="text-sm font-bold uppercase underline tracking-wide font-sans">
                  SURAT PENAWARAN KERJA RESMI (JOB OFFERING LETTER)
                </h2>
                <div className="font-mono text-slate-600 font-semibold text-[11px]">
                  Nomor: {docNumber}
                </div>
              </div>

              {/* Content */}
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

              {/* QR Verification Signatures */}
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
                  onClick={() => handlePushToOnboarding(activeCandidate)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-2xs flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Kandidat Konfirmasi & Transfer Onboarding</span>
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
                <span className="text-xs text-slate-400">Masuk ke Tahap 3 (Incoming) ATS</span>
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

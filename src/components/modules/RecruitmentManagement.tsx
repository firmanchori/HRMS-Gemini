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
  Sparkles,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { RecruitmentStage, EmploymentType, Candidate, PTKPStatus } from '../../types/hrms';
import { formatRupiah, calculatePPh21TER, calculateBPJS, getTERCategory } from '../../utils/taxCalculator';
import { QRCodeView } from '../common/QRCodeView';
import { ValidatedDateInput } from '../common/ValidatedDateInput';
import { CurrencyInput, formatThousandSeparator } from '../common/CurrencyInput';

export const RecruitmentManagement: React.FC = () => {
  const {
    vacancies,
    candidates,
    addVacancy,
    addCandidate,
    updateCandidateStage,
    currentTenant,
    addOnboardingProcess,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'kanban' | 'lowongan' | 'pengaturan'>('kanban');
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>('all');

  // Modals
  const [isVacancyModalOpen, setIsVacancyModalOpen] = useState(false);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [isOfferingDocPreviewOpen, setIsOfferingDocPreviewOpen] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [offeringFormError, setOfferingFormError] = useState<string | null>(null);
  const [showOfferingErrors, setShowOfferingErrors] = useState(false);

  // Vacancy Form State
  const [vacTitle, setVacTitle] = useState('');
  const [vacDept, setVacDept] = useState('Engineering');
  const [vacType, setVacType] = useState<EmploymentType>('Tetap');
  const [vacOpenings, setVacOpenings] = useState(1);
  const [vacExp, setVacExp] = useState('3+ Tahun');
  const [vacSalary, setVacSalary] = useState('Rp 15.000.000 - Rp 20.000.000');

  // Candidate Form State
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('0812' + Math.floor(10000000 + Math.random() * 90000000));
  const [candCompany, setCandCompany] = useState('');
  const [candSalary, setCandSalary] = useState<number>(18000000);
  const [candVacancyId, setCandVacancyId] = useState(vacancies[0]?.id || '');

  // Interview Scoring State
  const [interviewDate, setInterviewDate] = useState('2026-10-20 10:00');
  const [interviewerName, setInterviewerName] = useState('Aditya Pratama (VP HC)');
  const [interviewScore, setInterviewScore] = useState<number>(85);
  const [interviewNotes, setInterviewNotes] = useState('');

  // ===================== ADVANCED OFFERING CALCULATOR STATE =====================
  const [offeringMode, setOfferingMode] = useState<'gross' | 'net'>('gross');
  const [targetAmount, setTargetAmount] = useState<number>(18500000);
  const [docNumber, setDocNumber] = useState('');
  const [targetJoinDate, setTargetJoinDate] = useState('2026-11-01');
  const [candidatePtkp, setCandidatePtkp] = useState<PTKPStatus>('TK/0');

  // Checkable Salary Components
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

  const [enabledComponents, setEnabledComponents] = useState({
    fixedAllowance: true,
    positionAllowance: true,
    transportAllowance: true,
    mealAllowance: true,
    communicationAllowance: true,
    performanceBonus: false,
    thrBonus: true,
  });

  // Checkable Benefits
  const [enabledBenefits, setEnabledBenefits] = useState({
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

  const filteredCandidates = candidates.filter(
    (c) => selectedVacancyId === 'all' || c.jobVacancyId === selectedVacancyId
  );

  const stages: { stage: RecruitmentStage; title: string; count: number }[] = [
    { stage: 'Applied', title: 'Lamaran Masuk', count: filteredCandidates.filter((c) => c.stage === 'Applied').length },
    { stage: 'Screening', title: 'Screening CV', count: filteredCandidates.filter((c) => c.stage === 'Screening').length },
    { stage: 'Interview', title: 'Tahap Interview', count: filteredCandidates.filter((c) => c.stage === 'Interview').length },
    { stage: 'Offered', title: 'Offering Letter', count: filteredCandidates.filter((c) => c.stage === 'Offered').length },
    { stage: 'Hired', title: 'Diterima (Onboarding)', count: filteredCandidates.filter((c) => c.stage === 'Hired').length },
  ];

  // Calculation Logic for Offering Calculator
  const activeAllowances =
    (enabledComponents.fixedAllowance ? components.fixedAllowance : 0) +
    (enabledComponents.positionAllowance ? components.positionAllowance : 0) +
    (enabledComponents.transportAllowance ? components.transportAllowance : 0) +
    (enabledComponents.mealAllowance ? components.mealAllowance : 0) +
    (enabledComponents.communicationAllowance ? components.communicationAllowance : 0) +
    (enabledComponents.performanceBonus ? components.performanceBonus : 0);

  // If in gross mode:
  const grossMonthly =
    offeringMode === 'gross'
      ? components.basicSalary + activeAllowances
      : targetAmount + 1500000; // estimated gross for net target

  // BPJS Calculation
  const bpjsCalc = calculateBPJS(components.basicSalary);
  const bpjsEmployeeDeduction =
    (enabledBenefits.bpjsKesehatan ? bpjsCalc.bpjsKesEmployee : 0) +
    (enabledBenefits.bpjsTkJht ? bpjsCalc.breakdown.jhtEmployee : 0) +
    (enabledBenefits.bpjsTkJp ? bpjsCalc.breakdown.jpEmployee : 0);

  // PPh 21 TER 2024 Calculation
  const terCalc = calculatePPh21TER(grossMonthly, candidatePtkp);
  const netTakeHomePay = grossMonthly - bpjsEmployeeDeduction - terCalc.taxAmount;

  const handleOpenOfferingModal = (candidate: Candidate) => {
    setActiveCandidate(candidate);
    const seq = candidates.filter((c) => c.stage === 'Offered' || c.stage === 'Hired').length + 1;
    const code = currentTenant.code;
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

  const handleSaveInterview = () => {
    if (!activeCandidate) return;
    updateCandidateStage(activeCandidate.id, 'Interview', {
      interviewDate,
      interviewer: interviewerName,
      interviewScore: Number(interviewScore),
      interviewNotes,
    });
    setIsInterviewModalOpen(false);
  };

  const handleSendOffering = () => {
    if (!activeCandidate) return;
    setShowOfferingErrors(true);
    setOfferingFormError(null);

    if (!docNumber.trim()) {
      setOfferingFormError('Nomor dokumen offering letter resmi wajib diisi.');
      return;
    }
    if (!targetJoinDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetJoinDate)) {
      setOfferingFormError('Target tanggal mulai bekerja (join date) tidak valid (format YYYY-MM-DD).');
      return;
    }
    if (components.basicSalary < (currentTenant.umr || 3000000)) {
      setOfferingFormError(`Gaji pokok penawaran minimal setara UMR ${currentTenant.city} (${formatRupiah(currentTenant.umr)}).`);
      return;
    }

    updateCandidateStage(activeCandidate.id, 'Offered', {
      offeredSalary: grossMonthly,
      offeringDocNumber: docNumber,
    });
    setIsOfferingModalOpen(false);
    setIsOfferingDocPreviewOpen(true);
    setShowOfferingErrors(false);
  };

  const handlePushToOnboarding = () => {
    if (!activeCandidate) return;

    addOnboardingProcess({
      type: 'via_recruitment',
      candidateId: activeCandidate.id,
      employeeName: activeCandidate.name,
      email: activeCandidate.email,
      phone: activeCandidate.phone,
      position: 'Senior Engineer',
      department: 'Engineering',
      employmentType: 'Kontrak',
      joinDate: targetJoinDate,
      basicSalary: components.basicSalary,
      contractDocNumber: docNumber,
      tasks: [
        { id: 't1', title: 'Verifikasi KTP, NPWP & BPJS Asli', category: 'Legalitas & Dokumen', isCompleted: true, completedAt: new Date().toISOString().split('T')[0], assignedRole: 'hr_admin' },
        { id: 't2', title: 'Tanda Tangan Kontrak Digital QR', category: 'Legalitas & Dokumen', isCompleted: false, assignedRole: 'hr_admin' },
        { id: 't3', title: 'Penyediaan Laptop & Workstation', category: 'Fasilitas & IT', isCompleted: false, assignedRole: 'ga_admin' },
        { id: 't4', title: 'Registrasi Payroll & Pajak TER 2024', category: 'Payroll & Rekening', isCompleted: false, assignedRole: 'payroll_admin' },
      ],
    });

    updateCandidateStage(activeCandidate.id, 'Hired');
    setIsOfferingDocPreviewOpen(false);
    alert(`Offering Letter telah dikirim dan ${activeCandidate.name} dimasukkan ke Onboarding Tracker!`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <span>Rekrutmen, Kalkulator Offering Letter & Onboarding</span>
          </h2>
          <p className="text-xs text-slate-500">
            Pipeline pelamar, penilaian wawancara, kalkulator penawaran kerja (mode Gross vs Nett THP, PPh 21 TER 2024, benefit checkable), dan transisi onboarding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-3 py-1.5 rounded font-medium transition-all ${
                activeTab === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pipeline Kanban
            </button>
            <button
              onClick={() => setActiveTab('lowongan')}
              className={`px-3 py-1.5 rounded font-medium transition-all ${
                activeTab === 'lowongan'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Lowongan ({vacancies.length})
            </button>
            <button
              onClick={() => setActiveTab('pengaturan')}
              className={`px-3 py-1.5 rounded font-medium transition-all flex items-center gap-1 ${
                activeTab === 'pengaturan'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Pengaturan</span>
            </button>
          </div>

          <button
            onClick={() => setIsCandidateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pelamar</span>
          </button>
        </div>
      </div>

      {activeTab === 'kanban' && (
        <div className="space-y-4">
          {/* Vacancy Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg shadow-xs">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700">Filter Posisi:</span>
              <select
                value={selectedVacancyId}
                onChange={(e) => setSelectedVacancyId(e.target.value)}
                className="py-1 px-2.5 border border-slate-300 rounded bg-white text-slate-800 font-medium"
              >
                <option value="all">Semua Lowongan Kerja</option>
                {vacancies.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} ({v.department})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsVacancyModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Buat Lowongan Baru</span>
            </button>
          </div>

          {/* Kanban Board Columns */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-start">
            {stages.map((stg) => (
              <div key={stg.stage} className="bg-slate-100/90 rounded-xl p-3 border border-slate-200/80 min-h-[420px] flex flex-col">
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="font-bold text-slate-800 text-xs">{stg.title}</span>
                  <span className="text-[11px] font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                    {stg.count}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {filteredCandidates
                    .filter((c) => c.stage === stg.stage)
                    .map((candidate) => {
                      const vac = vacancies.find((v) => v.id === candidate.jobVacancyId);
                      return (
                        <div
                          key={candidate.id}
                          className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs hover:shadow-xs transition-shadow space-y-2"
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold text-slate-900 text-xs leading-tight">
                              {candidate.name}
                            </span>
                            {candidate.interviewScore && (
                              <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">
                                ★ {candidate.interviewScore}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <div className="text-indigo-700 font-medium truncate">{vac?.title || 'Posisi'}</div>
                            <div className="truncate">Asal: {candidate.lastCompany}</div>
                            <div className="font-mono text-slate-800 font-semibold">
                              Ekspektasi: {formatRupiah(candidate.expectedSalary)}
                            </div>
                          </div>

                          {/* Quick Action Per Stage */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            {candidate.stage === 'Applied' && (
                              <button
                                onClick={() => updateCandidateStage(candidate.id, 'Screening')}
                                className="w-full py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded"
                              >
                                Lolos Screening CV →
                              </button>
                            )}

                            {candidate.stage === 'Screening' && (
                              <button
                                onClick={() => {
                                  setActiveCandidate(candidate);
                                  setIsInterviewModalOpen(true);
                                }}
                                className="w-full py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-50 rounded flex items-center justify-center gap-1"
                              >
                                <Calendar className="w-3 h-3" />
                                <span>Nilai Interview</span>
                              </button>
                            )}

                            {candidate.stage === 'Interview' && (
                              <button
                                onClick={() => handleOpenOfferingModal(candidate)}
                                className="w-full py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded flex items-center justify-center gap-1 font-sans"
                              >
                                <Calculator className="w-3 h-3" />
                                <span>Kalkulator Offering →</span>
                              </button>
                            )}

                            {candidate.stage === 'Offered' && (
                              <button
                                onClick={() => handleOpenOfferingModal(candidate)}
                                className="w-full py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded flex items-center justify-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Lihat Offering Letter</span>
                              </button>
                            )}

                            {candidate.stage === 'Hired' && (
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded w-full text-center">
                                ✓ Dalam Onboarding
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Pengaturan Modul Rekrutmen & Offering Letter
            </h3>
            <p className="text-xs text-slate-500">
              Konfigurasi masa berlaku penawaran kerja, ambang batas persetujuan direktur, dan template standar offering letter.
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
                  className="w-24 px-3 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
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
                  className="w-48 px-3 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900"
                />
                <span className="text-slate-500">Gaji di atas nominal ini mewajibkan persetujuan direksi</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => alert('Pengaturan rekrutmen berhasil disimpan!')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs"
              >
                Simpan Pengaturan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADVANCED OFFERING CALCULATOR ===================== */}
      {isOfferingModalOpen && activeCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-400" />
                  <span>Kalkulator Offering Letter & Benefit Calon Karyawan</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {activeCandidate.name} · Nomor Dokumen: <span className="font-mono text-indigo-300">{docNumber}</span>
                </span>
              </div>
              <button onClick={() => setIsOfferingModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Form Validation Error Notice */}
              {offeringFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{offeringFormError}</span>
                </div>
              )}

              {/* Dual Mode Switcher (THP vs Nilai Kotor) */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-indigo-950 block">Pilih Mode Perhitungan Offering:</span>
                  <span className="text-[11px] text-indigo-700">
                    Tentukan apakah penawaran didasarkan pada Target Take Home Pay (Nett) atau Gaji Kotor (Gross).
                  </span>
                </div>

                <div className="inline-flex rounded-lg border border-indigo-300 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setOfferingMode('gross')}
                    className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                      offeringMode === 'gross'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-indigo-900 hover:bg-slate-50'
                    }`}
                  >
                    Mode Gaji Kotor (Gross)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferingMode('net')}
                    className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                      offeringMode === 'net'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-indigo-900 hover:bg-slate-50'
                    }`}
                  >
                    Mode Nilai THP (Nett)
                  </button>
                </div>
              </div>

              {/* General Offering Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Dokumen Resmi *</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => {
                      setDocNumber(e.target.value);
                      if (offeringFormError) setOfferingFormError(null);
                    }}
                    className={`w-full px-3 py-2 border rounded font-mono font-bold text-indigo-700 ${
                      showOfferingErrors && !docNumber.trim() ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <ValidatedDateInput
                    id="targetJoinDate"
                    label="Target Tanggal Mulai (Join Date) *"
                    value={targetJoinDate}
                    onChange={(val) => {
                      setTargetJoinDate(val);
                      if (offeringFormError) setOfferingFormError(null);
                    }}
                    required
                    showError={showOfferingErrors}
                    helperText="Format YYYY-MM-DD"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status PTKP Pajak Calon</label>
                  <select
                    value={candidatePtkp}
                    onChange={(e) => setCandidatePtkp(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-mono font-semibold"
                  >
                    <option value="TK/0">TK/0 (TER A)</option>
                    <option value="TK/1">TK/1 (TER A)</option>
                    <option value="K/0">K/0 (TER A)</option>
                    <option value="K/1">K/1 (TER B)</option>
                    <option value="K/2">K/2 (TER B)</option>
                    <option value="K/3">K/3 (TER C)</option>
                  </select>
                </div>
              </div>

              {/* Komponen Gaji Pokok & Tunjangan (Bisa Diceklis) */}
              <div className="space-y-3 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">
                    Komponen Gaji & Tunjangan (Format Ribuan & Checkable)
                  </h4>
                  <span className="text-[11px] text-slate-500">Centang komponen yang diberikan kepada calon</span>
                </div>

                <div className="space-y-2.5">
                  {/* Gaji Pokok Wajib */}
                  <div className="flex items-center justify-between bg-white p-2.5 border border-slate-200 rounded">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <strong className="text-slate-900">Gaji Pokok (Base Salary) *</strong>
                        <span className="text-[10px] text-slate-400 block">
                          Min. standar UMR {currentTenant.city}: {formatRupiah(currentTenant.umr)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-slate-500 font-bold text-xs">Rp</span>
                      <input
                        type="text"
                        value={formatThousandSeparator(components.basicSalary)}
                        onChange={(e) => {
                          const val = Number(e.target.value.replace(/\D/g, '')) || 0;
                          setComponents({ ...components, basicSalary: val });
                          if (offeringFormError) setOfferingFormError(null);
                        }}
                        className={`w-36 px-3 py-1.5 border rounded font-mono font-bold text-right ${
                          showOfferingErrors && components.basicSalary < currentTenant.umr
                            ? 'border-rose-500 bg-rose-50/20'
                            : 'border-slate-300'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Tunjangan Jabatan */}
                  <div className="flex items-center justify-between bg-white p-2.5 border border-slate-200 rounded">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabledComponents.positionAllowance}
                        onChange={(e) => setEnabledComponents({ ...enabledComponents, positionAllowance: e.target.checked })}
                        className="rounded text-indigo-600 w-4 h-4"
                      />
                      <div>
                        <strong className="text-slate-900">Tunjangan Jabatan / Posisi</strong>
                        <span className="text-[10px] text-slate-400 block">Kompensasi tanggung jawab manajerial</span>
                      </div>
                    </label>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-slate-500 font-bold text-xs">Rp</span>
                      <input
                        type="text"
                        disabled={!enabledComponents.positionAllowance}
                        value={formatThousandSeparator(components.positionAllowance)}
                        onChange={(e) => {
                          const val = Number(e.target.value.replace(/\D/g, '')) || 0;
                          setComponents({ ...components, positionAllowance: val });
                        }}
                        className="w-36 px-3 py-1.5 border border-slate-300 rounded font-mono font-semibold text-right disabled:bg-slate-100 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Tunjangan Transport & Makan */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between bg-white p-2 border border-slate-200 rounded">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enabledComponents.transportAllowance}
                          onChange={(e) => setEnabledComponents({ ...enabledComponents, transportAllowance: e.target.checked })}
                          className="rounded text-indigo-600 w-4 h-4"
                        />
                        <span className="font-semibold text-slate-800">Tunjangan Transport</span>
                      </label>
                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-[11px] text-slate-400">Rp</span>
                        <input
                          type="text"
                          disabled={!enabledComponents.transportAllowance}
                          value={formatThousandSeparator(components.transportAllowance)}
                          onChange={(e) => {
                            const val = Number(e.target.value.replace(/\D/g, '')) || 0;
                            setComponents({ ...components, transportAllowance: val });
                          }}
                          className="w-24 px-2 py-1 border border-slate-300 rounded font-mono text-right text-xs disabled:bg-slate-100 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2 border border-slate-200 rounded">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enabledComponents.mealAllowance}
                          onChange={(e) => setEnabledComponents({ ...enabledComponents, mealAllowance: e.target.checked })}
                          className="rounded text-indigo-600 w-4 h-4"
                        />
                        <span className="font-semibold text-slate-800">Tunjangan Makan</span>
                      </label>
                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-[11px] text-slate-400">Rp</span>
                        <input
                          type="text"
                          disabled={!enabledComponents.mealAllowance}
                          value={formatThousandSeparator(components.mealAllowance)}
                          onChange={(e) => {
                            const val = Number(e.target.value.replace(/\D/g, '')) || 0;
                            setComponents({ ...components, mealAllowance: val });
                          }}
                          className="w-24 px-2 py-1 border border-slate-300 rounded font-mono text-right text-xs disabled:bg-slate-100 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tunjangan Komunikasi & Bonus Kinerja */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between bg-white p-2 border border-slate-200 rounded">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enabledComponents.communicationAllowance}
                          onChange={(e) => setEnabledComponents({ ...enabledComponents, communicationAllowance: e.target.checked })}
                          className="rounded text-indigo-600 w-4 h-4"
                        />
                        <span className="font-semibold text-slate-800">Tunjangan Komunikasi</span>
                      </label>
                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-[11px] text-slate-400">Rp</span>
                        <input
                          type="text"
                          disabled={!enabledComponents.communicationAllowance}
                          value={formatThousandSeparator(components.communicationAllowance)}
                          onChange={(e) => {
                            const val = Number(e.target.value.replace(/\D/g, '')) || 0;
                            setComponents({ ...components, communicationAllowance: val });
                          }}
                          className="w-24 px-2 py-1 border border-slate-300 rounded font-mono text-right text-xs disabled:bg-slate-100 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2 border border-slate-200 rounded">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enabledComponents.performanceBonus}
                          onChange={(e) => setEnabledComponents({ ...enabledComponents, performanceBonus: e.target.checked })}
                          className="rounded text-indigo-600 w-4 h-4"
                        />
                        <span className="font-semibold text-slate-800">Bonus Kinerja KPI</span>
                      </label>
                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-[11px] text-slate-400">Rp</span>
                        <input
                          type="text"
                          disabled={!enabledComponents.performanceBonus}
                          value={formatThousandSeparator(components.performanceBonus)}
                          onChange={(e) => {
                            const val = Number(e.target.value.replace(/\D/g, '')) || 0;
                            setComponents({ ...components, performanceBonus: val });
                          }}
                          className="w-24 px-2 py-1 border border-slate-300 rounded font-mono text-right text-xs disabled:bg-slate-100 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fasilitas & Benefit Karyawan (Dapat Diceklis) */}
              <div className="space-y-3 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                <h4 className="font-bold text-slate-900 text-xs">
                  Fasilitas & Jaminan Sosial (Benefit Package)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2.5 p-2 bg-white border border-slate-200 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabledBenefits.bpjsKesehatan}
                      onChange={(e) => setEnabledBenefits({ ...enabledBenefits, bpjsKesehatan: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <strong className="text-slate-900 block">BPJS Kesehatan</strong>
                      <span className="text-[10px] text-slate-500">4% ditanggung perusahaan, 1% karyawan</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 bg-white border border-slate-200 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabledBenefits.bpjsTkJht}
                      onChange={(e) => setEnabledBenefits({ ...enabledBenefits, bpjsTkJht: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <strong className="text-slate-900 block">BPJS TK Jaminan Hari Tua (JHT)</strong>
                      <span className="text-[10px] text-slate-500">3.7% perusahaan, 2% karyawan</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 bg-white border border-slate-200 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabledBenefits.asuransiSwasta}
                      onChange={(e) => setEnabledBenefits({ ...enabledBenefits, asuransiSwasta: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <strong className="text-slate-900 block">Asuransi Rawat Inap Swasta</strong>
                      <span className="text-[10px] text-slate-500">Cover rumah sakit rekanan cashless</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 bg-white border border-slate-200 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabledBenefits.fasilitasLaptop}
                      onChange={(e) => setEnabledBenefits({ ...enabledBenefits, fasilitasLaptop: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <strong className="text-slate-900 block">Fasilitas Laptop & Perangkat GA</strong>
                      <span className="text-[10px] text-slate-500">Unit kerja disediakan tim General Affairs</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Rangkuman Simulasi Pajak TER & THP */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-slate-300">Ringkasan Kalkulasi Gaji & Pajak TER 2024</span>
                  <span className="text-[11px] font-mono bg-indigo-900/70 text-indigo-300 px-2 py-0.5 rounded">
                    Kategori: {terCalc.category} ({terCalc.ratePercent}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Gaji Kotor (Gross):</span>
                    <strong className="font-mono text-sm text-white">{formatRupiah(grossMonthly)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Potongan BPJS Karyawan:</span>
                    <strong className="font-mono text-sm text-amber-300">-{formatRupiah(bpjsEmployeeDeduction)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Potongan Pajak PPh 21 TER:</span>
                    <strong className="font-mono text-sm text-rose-300">-{formatRupiah(terCalc.taxAmount)}</strong>
                  </div>
                  <div className="p-2 bg-indigo-950/80 rounded border border-indigo-700/60">
                    <span className="text-indigo-300 block text-[10px] font-bold">ESTIMASI THP (NETT):</span>
                    <strong className="font-mono text-base text-emerald-400 font-bold">
                      {formatRupiah(netTakeHomePay)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOfferingModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendOffering}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs shadow-xs"
                >
                  Terbitkan Dokumen Offering Letter →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: PREVIEW CETAK OFFERING LETTER BER-QR ===================== */}
      {isOfferingDocPreviewOpen && activeCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Surat Penawaran Kerja Resmi (Job Offering Letter)</h3>
                <span className="text-[11px] text-slate-400 font-mono">{docNumber}</span>
              </div>
              <button onClick={() => setIsOfferingDocPreviewOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-5 text-slate-900 font-serif leading-relaxed text-xs">
              {/* Kop Surat */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <h1 className="text-base font-bold tracking-wider font-sans uppercase">
                  {currentTenant.name}
                </h1>
                <p className="text-[10px] text-slate-600 font-sans">
                  Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan · Telp: (021) 555-0199
                </p>
                <p className="text-[10px] text-slate-500 font-sans">
                  NPWP Perusahaan: {currentTenant.npwp}
                </p>
              </div>

              {/* Judul & Nomor */}
              <div className="text-center space-y-0.5">
                <h2 className="text-sm font-bold uppercase underline tracking-wide font-sans">
                  JOB OFFERING LETTER
                </h2>
                <div className="font-mono text-slate-600 font-semibold text-[11px]">
                  Nomor: {docNumber}
                </div>
              </div>

              {/* Isi Offering */}
              <div className="space-y-3 font-sans text-xs">
                <p>Kepada Yth. <strong>{activeCandidate.name}</strong>,</p>
                <p className="leading-normal">
                  Sehubungan dengan proses seleksi wawancara yang telah dilaksanakan, Manajemen{' '}
                  <span className="font-semibold">{currentTenant.name}</span> dengan bangga menyampaikan penawaran kerja resmi kepada Saudara/i dengan rincian sebagai berikut:
                </p>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5">
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Jabatan Ditawarkan</span>
                    <span className="col-span-2 font-bold text-slate-900">Senior Specialist</span>
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
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Total Upah Kotor (Gross)</span>
                    <span className="col-span-2 font-mono font-bold text-indigo-700">{formatRupiah(grossMonthly)}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Estimasi THP Bersih (Nett)</span>
                    <span className="col-span-2 font-mono font-bold text-emerald-700">{formatRupiah(netTakeHomePay)}</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600">
                  <strong className="block text-slate-900">Paket Benefit Tambahan:</strong>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {enabledBenefits.bpjsKesehatan && <li>Jaminan Kesehatan BPJS Kelas 1</li>}
                    {enabledBenefits.bpjsTkJht && <li>BPJS Ketenagakerjaan (JKK, JKM, JHT, JP)</li>}
                    {enabledBenefits.asuransiSwasta && <li>Asuransi Kesehatan Swasta Rawat Inap & Jalan</li>}
                    {enabledBenefits.fasilitasLaptop && <li>Fasilitas Laptop Kerja & Perangkat Kantor</li>}
                    <li>Hak Cuti Tahunan 12 Hari Kerja per tahun</li>
                  </ul>
                </div>
              </div>

              {/* TTD & QR Verification */}
              <div className="flex items-end justify-between pt-6 border-t border-slate-200 font-sans">
                <div className="flex items-center gap-3">
                  <QRCodeView
                    value={`https://nusahr.enterprise/verify-offering?doc=${docNumber.replace(/\//g, '-')}`}
                    size={80}
                    label="VALID OFFERING"
                    subLabel="NusaHR Seal"
                  />
                  <div className="text-[10px] text-slate-500 max-w-xs leading-tight">
                    Surat penawaran ini sah secara hukum dengan tanda tangan digital terenkripsi.
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-[11px] text-slate-500">Jakarta, {new Date().toISOString().split('T')[0]}</div>
                  <div className="font-bold text-slate-900 text-xs">Aditya Pratama, S.Psi</div>
                  <div className="text-[10px] text-slate-500">VP of Human Capital</div>
                  <div className="text-[9px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded inline-block">
                    ✓ Sah & Terverifikasi
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Offering Letter</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOfferingDocPreviewOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-semibold text-xs"
                >
                  Tutup
                </button>
                <button
                  onClick={handlePushToOnboarding}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs shadow-xs"
                >
                  Kirim & Lanjutkan ke Onboarding Karyawan →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Interview Scoring */}
      {isInterviewModalOpen && activeCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Penilaian Wawancara: {activeCandidate.name}</h3>
              <button onClick={() => setIsInterviewModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Skor Evaluasi (0 - 100) *</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={interviewScore}
                  onChange={(e) => setInterviewScore(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Catatan Evaluator *</label>
                <textarea
                  rows={3}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Keahlian teknis, kesesuaian budaya, dan rekomendasi hiring..."
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInterviewModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveInterview}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold shadow-xs"
                >
                  Simpan Penilaian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Lowongan */}
      {isVacancyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Posting Lowongan Kerja Baru</h3>
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
                  openings: vacOpenings,
                  minExperience: vacExp,
                  salaryRange: vacSalary,
                  status: 'Buka',
                });
                setIsVacancyModalOpen(false);
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div>
                <label className="font-medium text-slate-700 block mb-1">Judul Posisi *</label>
                <input
                  type="text"
                  required
                  value={vacTitle}
                  onChange={(e) => setVacTitle(e.target.value)}
                  placeholder="Contoh: Senior Backend Engineer"
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Departemen</label>
                  <input
                    type="text"
                    required
                    value={vacDept}
                    onChange={(e) => setVacDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Status Hubungan</label>
                  <select
                    value={vacType}
                    onChange={(e) => setVacType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="Tetap">Tetap</option>
                    <option value="Kontrak">Kontrak</option>
                    <option value="Outsource">Outsource</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVacancyModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold shadow-xs"
                >
                  Posting Lowongan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Pelamar */}
      {isCandidateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Input Data Pelamar Baru</h3>
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
                  stage: 'Applied',
                });
                setIsCandidateModalOpen(false);
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div>
                <label className="font-medium text-slate-700 block mb-1">Nama Pelamar *</label>
                <input
                  type="text"
                  required
                  value={candName}
                  onChange={(e) => setCandName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Posisi Lowongan yang Dilamar</label>
                <select
                  value={candVacancyId}
                  onChange={(e) => setCandVacancyId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                >
                  {vacancies.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Ekspektasi Gaji Bulanan (IDR)</label>
                <input
                  type="number"
                  value={candSalary}
                  onChange={(e) => setCandSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold shadow-xs"
                >
                  Simpan Pelamar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

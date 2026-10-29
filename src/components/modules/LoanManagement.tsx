import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  Wallet,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Calculator,
  Calendar,
  AlertTriangle,
  Settings,
  ShieldCheck,
  Percent,
  Eye,
  FileText,
  Edit3,
  Trash2,
} from 'lucide-react';
import { formatRupiah } from '../../utils/taxCalculator';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { CurrencyInput } from '../common/CurrencyInput';
import { EmployeeLoan, LoanSchemeConfig } from '../../types/hrms';
import { ModuleDocumentModal } from '../common/ModuleDocumentModal';

const DEFAULT_LOAN_SCHEMES: LoanSchemeConfig[] = [
  {
    id: 'scheme-1',
    code: 'KSB-DRT',
    name: 'Kasbon Darurat',
    description: 'Fasilitas kasbon mendesak (medis/keluarga) tanpa bunga dengan pencairan cepat.',
    isZeroInterest: true,
    interestMethod: 'Tanpa Bunga (0%)',
    interestRatePercentPerYear: 0,
    minEligibleSalary: 3500000,
    minLoanAmount: 500000,
    maxLoanAmount: 10000000,
    maxSalaryMultiple: 1,
    maxDsrPercent: 30,
    maxTenorMonths: 6,
    minTenureMonths: 3,
    eligibleEmploymentTypes: ['Tetap', 'Kontrak'],
    existingLoanRule: 'Diizinkan Pinjaman Ganda Khusus Darurat',
    adminFeeType: 'Nominal Tetap (IDR)',
    adminFeeValue: 25000,
    earlySettlementPenaltyPercent: 0,
    requireGuarantorOrCollateral: false,
    isActive: true,
  },
  {
    id: 'scheme-2',
    code: 'PNJ-FLX',
    name: 'Pinjaman Fleksibel',
    description: 'Pinjaman multiguna karyawan dengan skema bunga flat ringan per tahun.',
    isZeroInterest: false,
    interestMethod: 'Bunga Flat',
    interestRatePercentPerYear: 6,
    minEligibleSalary: 5000000,
    minLoanAmount: 2000000,
    maxLoanAmount: 35000000,
    maxSalaryMultiple: 3,
    maxDsrPercent: 30,
    maxTenorMonths: 12,
    minTenureMonths: 12,
    eligibleEmploymentTypes: ['Tetap'],
    existingLoanRule: 'Diizinkan Jika Sisa Cicilan ≤ 30% & DSR Aman',
    adminFeeType: 'Nominal Tetap (IDR)',
    adminFeeValue: 75000,
    earlySettlementPenaltyPercent: 1,
    requireGuarantorOrCollateral: false,
    isActive: true,
  },
  {
    id: 'scheme-3',
    code: 'PNJ-PND',
    name: 'Pendidikan',
    description: 'Bantuan pembiayaan pendidikan anak/studi lanjut karyawan dengan subsidi bunga 0%.',
    isZeroInterest: true,
    interestMethod: 'Tanpa Bunga (0%)',
    interestRatePercentPerYear: 0,
    minEligibleSalary: 4500000,
    minLoanAmount: 2000000,
    maxLoanAmount: 30000000,
    maxSalaryMultiple: 2.5,
    maxDsrPercent: 35,
    maxTenorMonths: 18,
    minTenureMonths: 12,
    eligibleEmploymentTypes: ['Tetap', 'Kontrak'],
    existingLoanRule: 'Diizinkan Top-Up (Potong Pelunasan Pinjaman Lama)',
    adminFeeType: 'Nominal Tetap (IDR)',
    adminFeeValue: 50000,
    earlySettlementPenaltyPercent: 0,
    requireGuarantorOrCollateral: false,
    isActive: true,
  },
];

export const LoanManagement: React.FC = () => {
  const {
    employees,
    loans,
    addLoan,
    updateLoanStatus,
    moduleSettings,
    updateModuleSettings,
    openFilePreview,
  } = useHrms();

  const handlePreviewLoan = (loan: EmployeeLoan) => {
    const emp = employees.find((e) => e.id === loan.employeeId);
    openFilePreview({
      title: `SURAT PERJANJIAN PINJAMAN KARYAWAN & SIMULASI ANGSURAN`,
      documentNumber: `PINJ-${loan.id.toUpperCase()}/${emp?.nik || '000'}`,
      typeBadge: `Pinjaman ${loan.loanType}`,
      date: '2026-10-15',
      partyName: emp?.fullName || 'Karyawan',
      partyRole: `${emp?.position || 'Staff'} · ${emp?.department || 'Operasional'}`,
      statusBadge: {
        label: loan.status === 'Aktif' ? 'Pinjaman Aktif' : loan.status === 'Lunas' ? 'Lunas Selesai' : 'Menunggu Approval',
        variant: loan.status === 'Lunas' ? 'success' : loan.status === 'Aktif' ? 'info' : 'warning',
      },
      detailsGrid: [
        { label: 'Jenis Pinjaman', value: loan.loanType },
        { label: 'Plafon Pinjaman', value: formatRupiah(loan.totalAmount) },
        { label: 'Tenor Cicilan', value: `${loan.tenorMonths} Bulan` },
        { label: 'Potongan per Bulan', value: formatRupiah(loan.monthlyInstallment) },
        { label: 'Sisa Saldo Pokok', value: formatRupiah(loan.remainingAmount) },
        { label: 'Metode Pengembalian', value: 'Pemotongan Otomatis Payroll Bulanan' },
      ],
      contentParagraphs: [
        `Persetujuan fasilitas pinjaman lunak internal perusahaan yang diberikan kepada karyawan ${emp?.fullName || '-'} (NIK: ${emp?.nik || '-'}).`,
        `Karyawan menyetujui pemotongan cicilan bulanan sebesar ${formatRupiah(loan.monthlyInstallment)} selama ${loan.tenorMonths} bulan berturut-turut dari perhitungan Take Home Pay slip gaji bulanan.`,
        `Apabila hubungan kerja berakhir sebelum pinjaman lunas, sisa saldo kewajiban akan diperhitungkan dari kompensasi pesangon atau hak akhir kerja karyawan.`,
      ],
      signeeName: 'Finance Director & HR Lead',
      signeeRole: 'Komite Pengawas Pinjaman & Dana Kesejahteraan',
    });
  };

  const [activeTab, setActiveTab] = useState<'daftar' | 'simulasi' | 'pengaturan'>('daftar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Master Skema / Jenis Pinjaman (Configurable in Sub Menu Pengaturan Plafon Pinjaman)
  const [loanSchemes, setLoanSchemes] = useState<LoanSchemeConfig[]>(() => {
    try {
      const saved = localStorage.getItem('nusahr_loan_schemes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((s: LoanSchemeConfig) => s.name !== 'Kepemilikan Aset');
          if (filtered.length > 0) return filtered;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_LOAN_SCHEMES;
  });

  const saveLoanSchemes = (nextSchemes: LoanSchemeConfig[]) => {
    setLoanSchemes(nextSchemes);
    try {
      localStorage.setItem('nusahr_loan_schemes', JSON.stringify(nextSchemes));
    } catch {
      // ignore
    }
  };

  // Modal Tambah / Edit Skema Pinjaman
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null);
  const [schemeForm, setSchemeForm] = useState<Omit<LoanSchemeConfig, 'id'>>({
    code: 'PNJ-BARU',
    name: '',
    description: '',
    isZeroInterest: true,
    interestMethod: 'Tanpa Bunga (0%)',
    interestRatePercentPerYear: 0,
    minEligibleSalary: 4000000,
    minLoanAmount: 1000000,
    maxLoanAmount: 25000000,
    maxSalaryMultiple: 3,
    maxDsrPercent: 30,
    maxTenorMonths: 12,
    minTenureMonths: 6,
    eligibleEmploymentTypes: ['Tetap', 'Kontrak'],
    existingLoanRule: 'Tidak Diizinkan (Wajib Lunas 100%)',
    adminFeeType: 'Nominal Tetap (IDR)',
    adminFeeValue: 50000,
    earlySettlementPenaltyPercent: 0,
    requireGuarantorOrCollateral: false,
    isActive: true,
  });

  // Form State
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [loanType, setLoanType] = useState<string>(loanSchemes[0]?.name || 'Kasbon Darurat');
  const [totalAmount, setTotalAmount] = useState<number>(3000000);
  const [tenorMonths, setTenorMonths] = useState<number>(6);
  const [loanReason, setLoanReason] = useState('');
  const [loanFormError, setLoanFormError] = useState<string | null>(null);

  const selectedScheme =
    loanSchemes.find((s) => s.name === loanType) || loanSchemes[0] || DEFAULT_LOAN_SCHEMES[0];
  const selectedApplicant = employees.find((e) => e.id === employeeId);
  const applicantExistingActiveLoans = loans.filter(
    (l) => l.employeeId === employeeId && l.status === 'Aktif'
  );

  // Calculate tenure in months for applicant
  const applicantTenureMonths = (() => {
    if (!selectedApplicant?.joinDate) return 12;
    const join = new Date(selectedApplicant.joinDate);
    const now = new Date();
    return Math.max(
      0,
      (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth())
    );
  })();

  // Calculate monthly interest, installment & admin fee based on selected scheme
  const schemeAdminFeeNominal =
    selectedScheme.adminFeeType === 'Persentase Plafon (%)'
      ? Math.round(totalAmount * (selectedScheme.adminFeeValue / 100))
      : selectedScheme.adminFeeValue;

  const schemeMonthlyInterest = (() => {
    if (selectedScheme.isZeroInterest || selectedScheme.interestMethod === 'Tanpa Bunga (0%)') {
      return 0;
    }
    const annualRate = selectedScheme.interestRatePercentPerYear / 100;
    if (selectedScheme.interestMethod === 'Bunga Efektif / Anuitas') {
      // Effective average monthly interest approximation
      return Math.round(((totalAmount * annualRate) / 12) * 0.6);
    }
    return Math.round((totalAmount * annualRate) / 12);
  })();

  const schemeMonthlyInstallment =
    Math.round(totalAmount / Math.max(1, tenorMonths)) + schemeMonthlyInterest;

  // Simulation State
  const [simEmployeeId, setSimEmployeeId] = useState(employees[0]?.id || '');
  const [simAmount, setSimAmount] = useState<number>(6000000);
  const [simTenor, setSimTenor] = useState<number>(6);
  const [simInterestRate, setSimInterestRate] = useState<number>(0); // 0% per annum

  // Settings State
  const [maxPlafonPercent, setMaxPlafonPercent] = useState(moduleSettings.loan.maxPlafonSalaryPercent || 30);
  const [maxTenor, setMaxTenor] = useState(moduleSettings.loan.maxTenorMonths || 12);
  const [allowMultiple, setAllowMultiple] = useState(moduleSettings.loan.allowMultipleActiveLoans || false);

  const selectedSimEmployee = employees.find((e) => e.id === simEmployeeId);
  const empSalary = selectedSimEmployee?.basicSalary || 10000000;

  // Simulation Calculations
  const simInterestMonthly = (simAmount * (simInterestRate / 100)) / 12;
  const simPrincipalMonthly = Math.round(simAmount / (simTenor || 1));
  const simTotalMonthly = simPrincipalMonthly + Math.round(simInterestMonthly);
  const dsrPercent = Math.round((simTotalMonthly / empSalary) * 100);
  const isDsrSafe = dsrPercent <= maxPlafonPercent;

  // Monthly Installment Table
  const amortizationTable = Array.from({ length: simTenor }, (_, i) => {
    const month = i + 1;
    const remaining = Math.max(0, simAmount - simPrincipalMonthly * month);
    return {
      month,
      principal: simPrincipalMonthly,
      interest: Math.round(simInterestMonthly),
      installment: simTotalMonthly,
      remaining,
    };
  });

  const totalOutstanding = loans
    .filter((l) => l.status === 'Aktif')
    .reduce((sum, l) => sum + l.remainingAmount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setLoanFormError('Pilih nama karyawan yang mengajukan pinjaman');
      return;
    }
    if (!totalAmount || totalAmount < selectedScheme.minLoanAmount) {
      setLoanFormError(
        `Nominal pinjaman minimal untuk skema ${selectedScheme.name} adalah ${formatRupiah(selectedScheme.minLoanAmount)}`
      );
      return;
    }
    if (totalAmount > selectedScheme.maxLoanAmount) {
      setLoanFormError(
        `Plafon melebihi batas maksimal skema ${selectedScheme.name} (${formatRupiah(selectedScheme.maxLoanAmount)})`
      );
      return;
    }
    if (selectedApplicant && selectedApplicant.basicSalary < selectedScheme.minEligibleSalary) {
      setLoanFormError(
        `Gaji pokok karyawan (${formatRupiah(selectedApplicant.basicSalary)}) belum memenuhi syarat minimum gaji skema ${selectedScheme.name} (${formatRupiah(selectedScheme.minEligibleSalary)})`
      );
      return;
    }
    if (applicantTenureMonths < selectedScheme.minTenureMonths) {
      setLoanFormError(
        `Masa kerja karyawan (${applicantTenureMonths} bulan) belum memenuhi syarat minimal masa kerja skema ${selectedScheme.name} (${selectedScheme.minTenureMonths} bulan)`
      );
      return;
    }
    if (
      applicantExistingActiveLoans.length > 0 &&
      selectedScheme.existingLoanRule === 'Tidak Diizinkan (Wajib Lunas 100%)'
    ) {
      setLoanFormError(
        `Karyawan masih memiliki pinjaman aktif. Aturan skema "${selectedScheme.name}" mengharuskan pinjaman sebelumnya lunas 100%.`
      );
      return;
    }

    setLoanFormError(null);
    addLoan({
      employeeId,
      loanType,
      totalAmount,
      tenorMonths,
      monthlyInstallment: schemeMonthlyInstallment,
      startDate: new Date().toISOString().split('T')[0],
      reason:
        loanReason ||
        `Pengajuan ${selectedScheme.name} (${selectedScheme.interestMethod}, Biaya Admin: ${formatRupiah(schemeAdminFeeNominal)})`,
    });

    setIsModalOpen(false);
    setLoanReason('');
    setLoanNotice(`Pengajuan "${loanType}" berhasil disimpan sesuai aturan plafon & skema!`);
    setTimeout(() => setLoanNotice(null), 4000);
  };

  const [loanNotice, setLoanNotice] = useState<string | null>(null);

  const handleApplyFromSimulation = () => {
    addLoan({
      employeeId: simEmployeeId,
      loanType: 'Pinjaman Fleksibel',
      totalAmount: simAmount,
      tenorMonths: simTenor,
      monthlyInstallment: simTotalMonthly,
      startDate: new Date().toISOString().split('T')[0],
      reason: `Pengajuan dari simulasi kalkulator (DSR: ${dsrPercent}%)`,
    });

    setLoanNotice('Pengajuan pinjaman dari hasil simulasi berhasil diajukan dan masuk ke daftar persetujuan!');
    setTimeout(() => setLoanNotice(null), 4000);
    setActiveTab('daftar');
  };

  const handleSaveSettings = () => {
    updateModuleSettings('loan', {
      maxPlafonSalaryPercent: Number(maxPlafonPercent),
      maxTenorMonths: Number(maxTenor),
      allowMultipleActiveLoans: allowMultiple,
    });
    setLoanNotice('Pengaturan Modul Pinjaman berhasil disimpan!');
    setTimeout(() => setLoanNotice(null), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Row 1: Module Header & Primary Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            <span>Manajemen Pinjaman Karyawan & Kasbon</span>
          </h2>
          <p className="text-xs text-slate-500">
            Fasilitas kasbon darurat, pinjaman lunak, kalkulator simulasi pinjaman interaktif dengan analisis Debt Service Ratio (DSR), dan autodebet payroll.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDocModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dokumen Perjanjian Pinjaman</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajukan Pinjaman Baru</span>
          </button>
        </div>
      </div>

      {/* Row 2: Enterprise Tab Navigation Bar (Not Parallel to Title) */}
      <div className="border-b border-slate-200 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar pt-1">
        <button
          onClick={() => setActiveTab('daftar')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'daftar'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Buku Pinjaman Aktif</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'daftar'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {loans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('simulasi')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'simulasi'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Kalkulator & Simulasi Pinjaman</span>
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
          <span>Pengaturan Plafon Pinjaman</span>
        </button>
      </div>

      {loanNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{loanNotice}</span>
          </div>
          <button onClick={() => setLoanNotice(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {activeTab === 'daftar' && (
        <div className="space-y-4">
          {/* Aggregate Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Total Sisa Piutang Berjalan</span>
              <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                {formatRupiah(totalOutstanding)}
              </span>
              <div className="text-[11px] text-slate-500 mt-1">
                {loans.filter((l) => l.status === 'Aktif').length} Fasilitas pinjaman aktif
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Menunggu Persetujuan HR/Finance</span>
              <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
                {loans.filter((l) => l.status === 'Menunggu Approval').length} Pengajuan
              </span>
              <div className="text-[11px] text-slate-500 mt-1">Memerlukan verifikasi batas plafon gaji</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Fasilitas Telah Lunas</span>
              <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
                {loans.filter((l) => l.status === 'Lunas').length} Selesai
              </span>
              <div className="text-[11px] text-slate-500 mt-1">Diproses melalui pemotongan payroll</div>
            </div>
          </div>

          {/* Ledger Table with Employee Details */}
          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden space-y-3">
            {loans.map((loan) => {
              const emp = employees.find((e) => e.id === loan.employeeId);
              return (
                <div
                  key={loan.id}
                  onClick={() => handlePreviewLoan(loan)}
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-xs space-y-3 cursor-pointer active:scale-[0.99] transition-all"
                >
                  {/* Top Bar: Borrower info & Status */}
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
                          {(emp?.fullName || 'K')[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{emp?.fullName || 'Karyawan'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{emp?.nik} · {emp?.position}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          loan.status === 'Aktif'
                            ? 'bg-blue-100 text-blue-800'
                            : loan.status === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {loan.status}
                      </span>
                      <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                        {loan.loanType}
                      </span>
                    </div>
                  </div>

                  {/* 4-Item Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Plafon Pinjaman:</span>
                      <strong className="text-slate-900">{formatRupiah(loan.totalAmount)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Sisa Saldo:</span>
                      <strong className="text-rose-700">{formatRupiah(loan.remainingAmount)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Cicilan / Bulan:</span>
                      <strong className="text-indigo-700">{formatRupiah(loan.monthlyInstallment)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Tenor:</span>
                      <strong className="text-slate-800">{loan.tenorMonths} Bulan</strong>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewLoan(loan);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-md border border-indigo-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Surat Perjanjian</span>
                    </button>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {loan.status === 'Menunggu Approval' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => updateLoanStatus(loan.id, 'Aktif')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors"
                          >
                            Setujui
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLoanStatus(loan.id, 'Lunas')}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-xs font-semibold transition-colors"
                          >
                            Tolak
                          </button>
                        </>
                      ) : loan.status === 'Aktif' ? (
                        <button
                          type="button"
                          onClick={() => updateLoanStatus(loan.id, 'Lunas')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors"
                        >
                          Tandai Lunas
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TAMPILAN DESKTOP: Ledger Table with Employee Details (>= md) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[750px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Peminjam</th>
                    <th className="py-2.5 px-3 font-semibold">Jenis Pinjaman</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Plafon Pinjaman</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Tenor</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Cicilan / Bulan</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Sisa Saldo</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Aksi Putusan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.map((loan) => {
                    const emp = employees.find((e) => e.id === loan.employeeId);
                    return (
                      <tr
                        key={loan.id}
                        onClick={() => handlePreviewLoan(loan)}
                        className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                        title="Klik baris untuk melihat Surat Perjanjian Pinjaman & Simulasi"
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            {emp?.avatar ? (
                              <img
                                src={emp.avatar}
                                alt={emp.fullName}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                                {(emp?.fullName || 'K')[0]}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-slate-900">{emp?.fullName || 'Karyawan'}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{emp?.nik} · {emp?.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {loan.loanType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(loan.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {loan.tenorMonths} Bulan
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-indigo-700">
                          {formatRupiah(loan.monthlyInstallment)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(loan.remainingAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              loan.status === 'Aktif'
                                ? 'bg-blue-100 text-blue-800'
                                : loan.status === 'Lunas'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {loan.status === 'Menunggu Approval' ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => updateLoanStatus(loan.id, 'Aktif')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => updateLoanStatus(loan.id, 'Lunas')}
                                className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[11px] font-semibold"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : loan.status === 'Aktif' ? (
                            <button
                              onClick={() => updateLoanStatus(loan.id, 'Lunas')}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                            >
                              Tandai Lunas
                            </button>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SIMULASI PINJAMAN INTERAKTIF ===================== */}
      {activeTab === 'simulasi' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Simulation Input Panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>Parameter Simulasi Pinjaman</span>
              </h3>

              <EmployeeSelect
                label="Pilih Karyawan yang Mengajukan"
                required
                employees={employees}
                value={simEmployeeId}
                onChange={setSimEmployeeId}
              />

              {selectedSimEmployee && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gaji Pokok Karyawan:</span>
                    <span className="font-mono font-bold text-slate-900">{formatRupiah(empSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Batas Cicilan Maks ({maxPlafonPercent}%):</span>
                    <span className="font-mono font-bold text-indigo-700">
                      {formatRupiah(Math.round(empSalary * (maxPlafonPercent / 100)))}
                    </span>
                  </div>
                </div>
              )}

              <CurrencyInput
                id="simAmount"
                label="Plafon Pinjaman yang Disimulasikan (IDR)"
                value={simAmount}
                onChange={setSimAmount}
                min={500000}
                helperText="Kalkulasi DSR (Debt Service Ratio) terhadap take-home-pay"
              />

              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-xs">
                  Jangka Waktu Tenor: <span className="text-indigo-600 font-bold">{simTenor} Bulan</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={maxTenor}
                  value={simTenor}
                  onChange={(e) => setSimTenor(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>1 Bulan</span>
                  <span>6 Bulan</span>
                  <span>12 Bulan</span>
                  <span>{maxTenor} Bulan</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-xs">
                  Suku Bunga / Biaya Layanan (% / Tahun)
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={simInterestRate}
                  onChange={(e) => setSimInterestRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Isi 0% untuk fasilitas pinjaman lunak internal perusahaan
                </span>
              </div>

              <button
                type="button"
                onClick={handleApplyFromSimulation}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs shadow-xs transition-colors"
              >
                Ajukan Pinjaman dari Simulasi Ini →
              </button>
            </div>

            {/* Simulation Result & DSR Check */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
                  <span className="text-[11px] text-slate-500 block mb-1">Estimasi Cicilan / Bulan</span>
                  <span className="text-xl font-bold font-mono text-indigo-700 tabular-nums">
                    {formatRupiah(simTotalMonthly)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Dipotong otomatis via payroll</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
                  <span className="text-[11px] text-slate-500 block mb-1">Rasio Beban Gaji (DSR)</span>
                  <span
                    className={`text-xl font-bold font-mono tabular-nums ${
                      isDsrSafe ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {dsrPercent}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {isDsrSafe ? '✓ Aman (Di bawah batas ' + maxPlafonPercent + '%)' : '⚠ Peringatan (Melebihi batas ' + maxPlafonPercent + '%)'}
                  </span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
                  <span className="text-[11px] text-slate-500 block mb-1">Total Pengembalian</span>
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {formatRupiah(simTotalMonthly * simTenor)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Pokok + Biaya Layanan</span>
                </div>
              </div>

              {/* DSR Alert Banner */}
              {!isDsrSafe && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Peringatan Debt Service Ratio (DSR):</strong> Cicilan bulanan sebesar {formatRupiah(simTotalMonthly)} menyerap {dsrPercent}% dari gaji pokok karyawan (melebihi batas aman kebijakan perusahaan yaitu {maxPlafonPercent}%). Disarankan memperpanjang tenor atau mengurangi plafon pinjaman.
                  </div>
                </div>
              )}

              {/* Amortization Table */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex justify-between items-center">
                  <span>Jadwal Amortisasi Pemotongan Payroll (Bulan ke-1 s/d {simTenor})</span>
                  <span className="text-[11px] font-normal text-slate-500 font-mono">
                    Total: {formatRupiah(simAmount)}
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 text-[11px] sticky top-0">
                      <tr>
                        <th className="py-2 px-3 font-semibold text-center">Bulan Ke-</th>
                        <th className="py-2 px-3 font-semibold text-right">Pokok Cicilan</th>
                        <th className="py-2 px-3 font-semibold text-right">Biaya/Bunga</th>
                        <th className="py-2 px-3 font-semibold text-right">Potongan Payroll</th>
                        <th className="py-2 px-3 font-semibold text-right">Sisa Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {amortizationTable.map((row) => (
                        <tr key={row.month} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 text-center text-slate-600">Bulan {row.month}</td>
                          <td className="py-1.5 px-3 text-right">{formatRupiah(row.principal)}</td>
                          <td className="py-1.5 px-3 text-right text-slate-500">{formatRupiah(row.interest)}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-indigo-700">{formatRupiah(row.installment)}</td>
                          <td className="py-1.5 px-3 text-right text-slate-800">{formatRupiah(row.remaining)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SUB MENU: PENGATURAN PLAFON PINJAMAN & SKEMA JENIS PINJAMAN ===================== */}
      {activeTab === 'pengaturan' && (
        <div className="space-y-6">
          {/* Header & Action Tambah Skema / Jenis Pinjaman */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <span>Pengaturan Plafon Pinjaman & Master Skema / Jenis Pinjaman</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur skema bunga (0% / Flat / Efektif / Margin Syariah), minimum gaji peminjam, syarat masa kerja minimal, aturan pinjaman ganda/sebelumnya, biaya admin per transaksi, dan plafon maksimal per jenis pinjaman.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingSchemeId(null);
                setSchemeForm({
                  code: `PNJ-0${loanSchemes.length + 1}`,
                  name: '',
                  description: '',
                  isZeroInterest: true,
                  interestMethod: 'Tanpa Bunga (0%)',
                  interestRatePercentPerYear: 0,
                  minEligibleSalary: 4000000,
                  minLoanAmount: 1000000,
                  maxLoanAmount: 25000000,
                  maxSalaryMultiple: 3,
                  maxDsrPercent: 30,
                  maxTenorMonths: 12,
                  minTenureMonths: 6,
                  eligibleEmploymentTypes: ['Tetap', 'Kontrak'],
                  existingLoanRule: 'Tidak Diizinkan (Wajib Lunas 100%)',
                  adminFeeType: 'Nominal Tetap (IDR)',
                  adminFeeValue: 50000,
                  earlySettlementPenaltyPercent: 0,
                  requireGuarantorOrCollateral: false,
                  isActive: true,
                });
                setIsSchemeModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Skema / Jenis Pinjaman</span>
            </button>
          </div>

          {/* Daftar Kartu Skema / Jenis Pinjaman */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loanSchemes.map((scheme) => (
              <div
                key={scheme.id}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-4 transition-all"
              >
                <div className="space-y-3">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                          {scheme.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            scheme.isZeroInterest
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {scheme.isZeroInterest
                            ? 'Bunga 0% (Tanpa Bunga)'
                            : `${scheme.interestMethod} · ${scheme.interestRatePercentPerYear}% / Thn`}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1.5">{scheme.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{scheme.description}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSchemeId(scheme.id);
                          const { id: _id, ...rest } = scheme;
                          setSchemeForm(rest);
                          setIsSchemeModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200"
                        title="Ubah Pengaturan Skema Pinjaman"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {loanSchemes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = loanSchemes.filter((s) => s.id !== scheme.id);
                            saveLoanSchemes(next);
                            setLoanNotice(`Skema pinjaman "${scheme.name}" berhasil dihapus.`);
                            setTimeout(() => setLoanNotice(null), 3500);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200"
                          title="Hapus Skema Pinjaman"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Grid Parameter Plafon, Gaji, Masa Kerja & Admin */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Min. Gaji Pokok</span>
                      <strong className="font-mono text-slate-900">{formatRupiah(scheme.minEligibleSalary)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Plafon Maksimal</span>
                      <strong className="font-mono text-indigo-700">{formatRupiah(scheme.maxLoanAmount)}</strong>
                      <span className="text-[9px] text-slate-400 block">Maks. {scheme.maxSalaryMultiple}x Gaji</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Tenor & Batas DSR</span>
                      <strong className="font-mono text-slate-900">
                        Maks. {scheme.maxTenorMonths} Bln ({scheme.maxDsrPercent}% DSR)
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Min. Masa Kerja</span>
                      <strong className="font-mono text-slate-900">≥ {scheme.minTenureMonths} Bulan</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Biaya Admin / Transaksi</span>
                      <strong className="font-mono text-emerald-700">
                        {scheme.adminFeeType === 'Nominal Tetap (IDR)'
                          ? formatRupiah(scheme.adminFeeValue)
                          : `${scheme.adminFeeValue}% Plafon`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Penalti Pelunasan Awal</span>
                      <strong className="font-mono text-slate-800">{scheme.earlySettlementPenaltyPercent}%</strong>
                    </div>
                  </div>

                  {/* Aturan Pinjaman Sebelumnya & Status Karyawan */}
                  <div className="space-y-1.5 text-[11px] bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600 font-medium">Jika Ada Pinjaman Sebelumnya:</span>
                      <span className="font-bold text-indigo-900 text-right">{scheme.existingLoanRule}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600 font-medium">Status Karyawan Berhak:</span>
                      <span className="font-semibold text-slate-800">
                        {scheme.eligibleEmploymentTypes.join(', ')}
                        {scheme.requireGuarantorOrCollateral ? ' · Wajib Agunan/Penjamin' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pengaturan Global Plafon & DSR Default */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 max-w-3xl">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Parameter Global Kalkulator DSR & Kebijakan Umum Payroll
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Batas Default DSR Gaji (%)</label>
                <input
                  type="number"
                  min={10}
                  max={60}
                  value={maxPlafonPercent}
                  onChange={(e) => setMaxPlafonPercent(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tenor Maksimal Simulasi (Bulan)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={maxTenor}
                  onChange={(e) => setMaxTenor(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="globalMultiLoan"
                  checked={allowMultiple}
                  onChange={(e) => setAllowMultiple(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="globalMultiLoan" className="font-semibold text-slate-700 cursor-pointer">
                  Aktifkan Pengecekan Multi-Pinjaman
                </label>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs"
              >
                Simpan Parameter Global
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT SKEMA JENIS PINJAMAN */}
      {isSchemeModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSchemeModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  {editingSchemeId ? 'Ubah Skema / Jenis Pinjaman' : 'Tambah Skema / Jenis Pinjaman Baru'}
                </h3>
                <span className="text-[11px] text-slate-400">
                  Konfigurasi bunga, minimum gaji, masa kerja, aturan pinjaman berjalan, dan biaya admin per transaksi
                </span>
              </div>
              <button type="button" onClick={() => setIsSchemeModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!schemeForm.name.trim()) return;
                if (editingSchemeId) {
                  const updated = loanSchemes.map((s) =>
                    s.id === editingSchemeId ? { ...schemeForm, id: editingSchemeId } : s
                  );
                  saveLoanSchemes(updated);
                  setLoanNotice(`Skema "${schemeForm.name}" berhasil diperbarui!`);
                } else {
                  const created: LoanSchemeConfig = {
                    ...schemeForm,
                    id: `scheme-${Date.now()}`,
                  };
                  saveLoanSchemes([...loanSchemes, created]);
                  setLoanNotice(`Skema jenis pinjaman baru "${schemeForm.name}" berhasil ditambahkan!`);
                }
                setIsSchemeModalOpen(false);
                setTimeout(() => setLoanNotice(null), 4000);
              }}
              className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kode Skema *</label>
                  <input
                    type="text"
                    required
                    value={schemeForm.code}
                    onChange={(e) => setSchemeForm({ ...schemeForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Nama Jenis Pinjaman *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pinjaman Darurat Medis / Pinjaman KPR Internal"
                    value={schemeForm.name}
                    onChange={(e) => setSchemeForm({ ...schemeForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deskripsi Singkat Skema</label>
                <input
                  type="text"
                  value={schemeForm.description}
                  onChange={(e) => setSchemeForm({ ...schemeForm, description: e.target.value })}
                  placeholder="Penjelasan peruntukan pinjaman..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Pengaturan Skema Bunga */}
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950">1. Skema Suku Bunga (0% / Flat / Efektif / Margin)</span>
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-indigo-800">
                    <input
                      type="checkbox"
                      checked={schemeForm.isZeroInterest}
                      onChange={(e) => {
                        const zero = e.target.checked;
                        setSchemeForm({
                          ...schemeForm,
                          isZeroInterest: zero,
                          interestMethod: zero ? 'Tanpa Bunga (0%)' : 'Bunga Flat',
                          interestRatePercentPerYear: zero ? 0 : 6,
                        });
                      }}
                      className="rounded text-indigo-600"
                    />
                    <span>Skema Bunga 0% (Tanpa Bunga)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Metode Perhitungan Bunga *</label>
                    <select
                      value={schemeForm.interestMethod}
                      onChange={(e) => {
                        const method = e.target.value as LoanSchemeConfig['interestMethod'];
                        const isZero = method === 'Tanpa Bunga (0%)';
                        setSchemeForm({
                          ...schemeForm,
                          interestMethod: method,
                          isZeroInterest: isZero,
                          interestRatePercentPerYear: isZero ? 0 : schemeForm.interestRatePercentPerYear || 6,
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                    >
                      <option value="Tanpa Bunga (0%)">Tanpa Bunga (0%)</option>
                      <option value="Bunga Flat">Bunga Flat (Tetap per Bulan)</option>
                      <option value="Bunga Efektif / Anuitas">Bunga Efektif / Anuitas (Saldo Menurun)</option>
                      <option value="Margin Syariah (Tetap)">Margin Syariah (Akad Murabahah Tetap)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Suku Bunga (% per Tahun)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={36}
                      disabled={schemeForm.isZeroInterest}
                      value={schemeForm.interestRatePercentPerYear}
                      onChange={(e) =>
                        setSchemeForm({ ...schemeForm, interestRatePercentPerYear: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Pengaturan Plafon, Minimum Gaji & Masa Kerja */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-900 block">
                  2. Syarat Minimum Gaji, Masa Kerja & Batas Plafon Pinjaman
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Minimum Gaji Bisa Meminjam (Rp) *</label>
                    <input
                      type="number"
                      min={0}
                      step={100000}
                      value={schemeForm.minEligibleSalary}
                      onChange={(e) =>
                        setSchemeForm({ ...schemeForm, minEligibleSalary: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Plafon Minimal (Rp) *</label>
                    <input
                      type="number"
                      min={100000}
                      step={100000}
                      value={schemeForm.minLoanAmount}
                      onChange={(e) => setSchemeForm({ ...schemeForm, minLoanAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Plafon Maksimal (Rp) *</label>
                    <input
                      type="number"
                      min={500000}
                      step={500000}
                      value={schemeForm.maxLoanAmount}
                      onChange={(e) => setSchemeForm({ ...schemeForm, maxLoanAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-indigo-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Min. Masa Kerja (Bln) *</label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={schemeForm.minTenureMonths}
                      onChange={(e) => setSchemeForm({ ...schemeForm, minTenureMonths: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Maks. Tenor (Bulan) *</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={schemeForm.maxTenorMonths}
                      onChange={(e) => setSchemeForm({ ...schemeForm, maxTenorMonths: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Maks. Kelipatan Gaji (x)</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0.5}
                      max={24}
                      value={schemeForm.maxSalaryMultiple}
                      onChange={(e) =>
                        setSchemeForm({ ...schemeForm, maxSalaryMultiple: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Batas DSR Gaji (%)</label>
                    <input
                      type="number"
                      min={10}
                      max={60}
                      value={schemeForm.maxDsrPercent}
                      onChange={(e) => setSchemeForm({ ...schemeForm, maxDsrPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Aturan Jika Sudah Ada Pinjaman Sebelumnya & Biaya Admin Per Transaksi */}
              <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-900 block">
                  3. Aturan Pinjaman Berjalan & Biaya Administrasi per Transaksi
                </span>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Aturan Jika Karyawan Sudah Memiliki Pinjaman Sebelumnya *
                  </label>
                  <select
                    value={schemeForm.existingLoanRule}
                    onChange={(e) =>
                      setSchemeForm({
                        ...schemeForm,
                        existingLoanRule: e.target.value as LoanSchemeConfig['existingLoanRule'],
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="Tidak Diizinkan (Wajib Lunas 100%)">
                      Tidak Diizinkan (Wajib Lunas 100% Pinjaman Sebelumnya)
                    </option>
                    <option value="Diizinkan Jika Sisa Cicilan ≤ 30% & DSR Aman">
                      Diizinkan Jika Sisa Saldo Pinjaman Lama ≤ 30% & Total DSR Gabungan Aman
                    </option>
                    <option value="Diizinkan Top-Up (Potong Pelunasan Pinjaman Lama)">
                      Diizinkan Top-Up / Refinancing (Pencairan Baru Memotong Sisa Saldo Pinjaman Lama)
                    </option>
                    <option value="Diizinkan Pinjaman Ganda Khusus Darurat">
                      Diizinkan Pinjaman Ganda Khusus Darurat (Selama Total Potongan Gaji Aman)
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tipe Biaya Admin / Transaksi *</label>
                    <select
                      value={schemeForm.adminFeeType}
                      onChange={(e) =>
                        setSchemeForm({
                          ...schemeForm,
                          adminFeeType: e.target.value as LoanSchemeConfig['adminFeeType'],
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                    >
                      <option value="Nominal Tetap (IDR)">Nominal Tetap (IDR)</option>
                      <option value="Persentase Plafon (%)">Persentase Plafon (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Nilai Biaya Admin ({schemeForm.adminFeeType === 'Nominal Tetap (IDR)' ? 'Rp' : '%'}) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={schemeForm.adminFeeValue}
                      onChange={(e) => setSchemeForm({ ...schemeForm, adminFeeValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Penalti Pelunasan Dipercepat (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step="0.5"
                      value={schemeForm.earlySettlementPenaltyPercent}
                      onChange={(e) =>
                        setSchemeForm({ ...schemeForm, earlySettlementPenaltyPercent: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700">Status Karyawan Berhak:</span>
                    {['Tetap', 'Kontrak', 'Outsource'].map((empType) => {
                      const checked = schemeForm.eligibleEmploymentTypes.includes(empType);
                      return (
                        <label key={empType} className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? schemeForm.eligibleEmploymentTypes.filter((t) => t !== empType)
                                : [...schemeForm.eligibleEmploymentTypes, empType];
                              setSchemeForm({
                                ...schemeForm,
                                eligibleEmploymentTypes: next.length > 0 ? next : ['Tetap'],
                              });
                            }}
                            className="rounded text-indigo-600"
                          />
                          <span>{empType}</span>
                        </label>
                      );
                    })}
                  </div>

                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={schemeForm.requireGuarantorOrCollateral}
                      onChange={(e) =>
                        setSchemeForm({ ...schemeForm, requireGuarantorOrCollateral: e.target.checked })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span>Wajib Penjamin Atasan / Jaminan Dokumen</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSchemeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Simpan Skema Pinjaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Form Ajukan Pinjaman */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Form Permohonan Pinjaman Karyawan</h3>
                <span className="text-[11px] text-slate-400">Verifikasi plafon, syarat masa kerja, dan jadwal autodebet payroll</span>
              </div>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {/* Form Validation Error Notice */}
              {loanFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{loanFormError}</span>
                </div>
              )}

              <EmployeeSelect
                label="Pilih Karyawan Pemohon"
                required
                employees={employees}
                value={employeeId}
                onChange={(val) => {
                  setEmployeeId(val);
                  if (loanFormError) setLoanFormError(null);
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Jenis Pinjaman *</label>
                  <select
                    value={loanType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLoanType(val);
                      const found = loanSchemes.find((s) => s.name === val);
                      if (found && tenorMonths > found.maxTenorMonths) {
                        setTenorMonths(found.maxTenorMonths);
                      }
                      if (loanFormError) setLoanFormError(null);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-medium"
                  >
                    {loanSchemes.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.isZeroInterest ? 'Bunga 0%' : `${s.interestMethod} ${s.interestRatePercentPerYear}%`})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Tenor (Maks. {selectedScheme.maxTenorMonths} Bulan) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedScheme.maxTenorMonths}
                    value={tenorMonths}
                    onChange={(e) => setTenorMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              {/* Ringkasan Aturan Skema Pinjaman Terpilih */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-1 text-[11px]">
                <div className="font-bold text-indigo-950 flex items-center justify-between">
                  <span>Ketentuan Skema: {selectedScheme.name}</span>
                  <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700">
                    {selectedScheme.interestMethod}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-slate-600 pt-1">
                  <div>• Min. Gaji: <strong>{formatRupiah(selectedScheme.minEligibleSalary)}</strong></div>
                  <div>• Min. Masa Kerja: <strong>{selectedScheme.minTenureMonths} Bulan</strong></div>
                  <div>• Plafon Maks: <strong>{formatRupiah(selectedScheme.maxLoanAmount)}</strong></div>
                  <div>• Biaya Admin: <strong>{formatRupiah(schemeAdminFeeNominal)}</strong></div>
                </div>
                <div className="text-[10px] text-indigo-800 pt-0.5">
                  • Aturan Pinjaman Berjalan: <strong>{selectedScheme.existingLoanRule}</strong>
                </div>
              </div>

              <CurrencyInput
                id="totalAmount"
                label="Plafon Pinjaman yang Dimohonkan (IDR) *"
                value={totalAmount}
                onChange={(val) => {
                  setTotalAmount(val);
                  if (loanFormError) setLoanFormError(null);
                }}
                required
                min={selectedScheme.minLoanAmount}
                helperText={`Rentang plafon skema ini: ${formatRupiah(selectedScheme.minLoanAmount)} s/d ${formatRupiah(selectedScheme.maxLoanAmount)}`}
              />

              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Estimasi Cicilan per Bulan (Pokok + Bunga):</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {formatRupiah(schemeMonthlyInstallment)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Biaya Admin per Transaksi:</span>
                  <span className="font-mono font-semibold text-slate-800">{formatRupiah(schemeAdminFeeNominal)}</span>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Alasan Permohonan</label>
                <textarea
                  rows={2}
                  value={loanReason}
                  onChange={(e) => setLoanReason(e.target.value)}
                  placeholder="Keterangan kebutuhan pembiayaan..."
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold shadow-xs"
                >
                  Ajukan Pinjaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Document Modal for Loan Agreement */}
      <ModuleDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        categoryFilter="Payroll, Pajak & BPJS"
        defaultTemplateId="tmpl-19"
        title="Penerbitan Dokumen Resmi Pinjaman Karyawan"
      />
    </div>
  );
};

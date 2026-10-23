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
} from 'lucide-react';
import { formatRupiah } from '../../utils/taxCalculator';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { CurrencyInput } from '../common/CurrencyInput';
import { EmployeeLoan } from '../../types/hrms';

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
        { label: 'Jenis Fasilitas', value: loan.loanType },
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

  // Form State
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [loanType, setLoanType] = useState<any>('Kasbon Darurat');
  const [totalAmount, setTotalAmount] = useState<number>(3000000);
  const [tenorMonths, setTenorMonths] = useState<number>(6);
  const [loanReason, setLoanReason] = useState('');
  const [loanFormError, setLoanFormError] = useState<string | null>(null);

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
    if (!totalAmount || totalAmount < 500000) {
      setLoanFormError('Nominal pinjaman minimal Rp 500.000');
      return;
    }

    setLoanFormError(null);
    const monthlyInstallment = Math.round(totalAmount / (tenorMonths || 1));
    addLoan({
      employeeId,
      loanType,
      totalAmount,
      tenorMonths,
      monthlyInstallment,
      startDate: new Date().toISOString().split('T')[0],
      reason: loanReason || 'Kebutuhan mendesak karyawan',
    });

    setIsModalOpen(false);
    setLoanReason('');
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            <span>Manajemen Pinjaman Karyawan & Kasbon</span>
          </h2>
          <p className="text-xs text-slate-500">
            Fasilitas kasbon darurat, pinjaman lunak, kalkulator simulasi pinjaman interaktif dengan analisis Debt Service Ratio (DSR), dan autodebet payroll.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          <div className="w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs whitespace-nowrap shadow-2xs">
              <button
                onClick={() => setActiveTab('daftar')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'daftar'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Buku Pinjaman ({loans.length})
              </button>
              <button
                onClick={() => setActiveTab('simulasi')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'simulasi'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Simulasi Pinjaman</span>
              </button>
              <button
                onClick={() => setActiveTab('pengaturan')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                  activeTab === 'pengaturan'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Pengaturan</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajukan Pinjaman Baru</span>
          </button>
        </div>
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

      {/* Settings Tab */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Pengaturan Kebijakan Fasilitas Pinjaman Karyawan
            </h3>
            <p className="text-xs text-slate-500">
              Konfigurasi batas maksimal cicilan terhadap gaji pokok, tenor terpanjang, dan izin pinjaman ganda.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <label className="font-semibold text-slate-800 block">
                Batas Maksimal Potongan terhadap Gaji Pokok (Debt Service Ratio / DSR %)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={10}
                  max={50}
                  value={maxPlafonPercent}
                  onChange={(e) => setMaxPlafonPercent(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 border border-slate-300 rounded font-mono text-slate-900 font-bold"
                />
                <span className="text-slate-500">% dari Gaji Pokok (Standar umum perusahaan: 30%)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <label className="font-semibold text-slate-800 block">
                Batas Tenor Pinjaman Terpanjang (Bulan)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={36}
                  value={maxTenor}
                  onChange={(e) => setMaxTenor(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 border border-slate-300 rounded font-mono text-slate-900 font-bold"
                />
                <span className="text-slate-500">Bulan masa pelunasan</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Izinkan Fasilitas Pinjaman Ganda (Multiple Active Loans)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Karyawan dapat memiliki kasbon darurat dan pinjaman reguler sekaligus asalkan DSR tidak terlampaui
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowMultiple}
                  onChange={(e) => setAllowMultiple(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs"
              >
                Simpan Kebijakan Pinjaman
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Form Ajukan Pinjaman */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Form Permohonan Pinjaman Karyawan</h3>
                <span className="text-[11px] text-slate-400">Verifikasi plafon dan jadwal autodebet payroll</span>
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
                  <label className="font-medium text-slate-700 block mb-1">Jenis Fasilitas *</label>
                  <select
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-medium"
                  >
                    <option value="Kasbon Darurat">Kasbon Darurat (Mendesak)</option>
                    <option value="Pinjaman Fleksibel">Pinjaman Fleksibel</option>
                    <option value="Pendidikan">Bantuan Pendidikan</option>
                    <option value="Kepemilikan Aset">Kepemilikan Aset (COP)</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Tenor (Bulan) *</label>
                  <input
                    type="number"
                    min={1}
                    max={maxTenor}
                    value={tenorMonths}
                    onChange={(e) => setTenorMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
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
                min={500000}
                helperText="Minimal nominal kasbon/pinjaman Rp 500.000"
              />

              <div className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center text-xs">
                <span className="text-slate-600">Estimasi Cicilan per Bulan:</span>
                <span className="font-mono font-bold text-indigo-700">
                  {formatRupiah(Math.round(totalAmount / (tenorMonths || 1)))}
                </span>
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
    </div>
  );
};

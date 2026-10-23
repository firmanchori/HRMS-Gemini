import React, { useState, useEffect } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  Calculator,
  Download,
  Printer,
  CheckCircle2,
  Send,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  X,
  CreditCard,
  Building,
  HeartPulse,
  Receipt,
  Plus,
  Filter,
  Search,
  Settings,
  ShieldAlert,
  Percent,
  TrendingDown,
  DollarSign,
  FileText,
  Clock,
} from 'lucide-react';
import { PayrollRecord, Employee } from '../../types/hrms';
import { formatRupiah, calculatePPh21TER, calculateBPJS, calculateOvertimePay } from '../../utils/taxCalculator';
import { QRCodeView } from '../common/QRCodeView';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { CurrencyInput } from '../common/CurrencyInput';
import { SalaryComponentManagement } from './SalaryComponentManagement';
import { GradeSalaryManagement } from './GradeSalaryManagement';

interface ReimbursementClaim {
  id: string;
  employeeId: string;
  type: 'Rawat Jalan (Kesehatan)' | 'Kacamata / Optik' | 'Gigi' | 'Transportasi & Bensin' | 'Komunikasi & Internet';
  amount: number;
  claimDate: string;
  receiptNumber: string;
  description: string;
  status: 'Menunggu Review' | 'Disetujui (Dibayarkan di Payroll)' | 'Ditolak';
  approvedAmount?: number;
}

const INITIAL_REIMBURSEMENTS: ReimbursementClaim[] = [
  {
    id: 'clm-001',
    employeeId: 'emp-001',
    type: 'Rawat Jalan (Kesehatan)',
    amount: 850000,
    claimDate: '2026-10-12',
    receiptNumber: 'KWT/RS-PI/8892',
    description: 'Konsultasi dokter spesialis penyakit dalam + resep obat antibiotik',
    status: 'Disetujui (Dibayarkan di Payroll)',
    approvedAmount: 850000,
  },
  {
    id: 'clm-002',
    employeeId: 'emp-002',
    type: 'Kacamata / Optik',
    amount: 1500000,
    claimDate: '2026-10-14',
    receiptNumber: 'OPT/MEL-2931',
    description: 'Plafon lensa minus & frame kacamata kerja tahunan',
    status: 'Disetujui (Dibayarkan di Payroll)',
    approvedAmount: 1500000,
  },
  {
    id: 'clm-003',
    employeeId: 'emp-003',
    type: 'Transportasi & Bensin',
    amount: 450000,
    claimDate: '2026-10-15',
    receiptNumber: 'BBM-SHELL-9912',
    description: 'BBM dinas kunjungan audit klien site Karawang',
    status: 'Menunggu Review',
  },
];

export const PayrollManagement: React.FC = () => {
  const {
    currentTenant,
    employees,
    payrollRecords,
    generatePayrollRun,
    approvePayrollRun,
    disbursePayrollRun,
    moduleSettings,
    updateModuleSettings,
    openFilePreview,
  } = useHrms();

  const handlePreviewClaim = (claim: ReimbursementClaim) => {
    const emp = employees.find((e) => e.id === claim.employeeId);
    openFilePreview({
      title: `FORM PENGAJUAN KLAIM BIAYA / REIMBURSEMENT: ${claim.type.toUpperCase()}`,
      documentNumber: claim.receiptNumber || `CLM-${claim.id}`,
      typeBadge: 'Reimbursement Medis & Operasional',
      date: claim.claimDate,
      partyName: emp?.fullName || 'Karyawan',
      partyRole: `${emp?.position || 'Staff'} · ${emp?.department || 'Operasional'}`,
      statusBadge: {
        label: claim.status,
        variant: claim.status.includes('Disetujui') ? 'success' : claim.status.includes('Ditolak') ? 'danger' : 'warning',
      },
      detailsGrid: [
        { label: 'Kategori Biaya', value: claim.type },
        { label: 'No. Kwitansi / Struk', value: claim.receiptNumber },
        { label: 'Nominal Diajukan', value: formatRupiah(claim.amount) },
        { label: 'Nominal Disetujui', value: formatRupiah(claim.approvedAmount || claim.amount) },
        { label: 'Tanggal Kwitansi', value: claim.claimDate },
        { label: 'Status Verifikasi HR', value: claim.status },
      ],
      contentParagraphs: [
        `Pengajuan klaim penggantian biaya (reimbursement) oleh ${emp?.fullName || '-'} (NIK: ${emp?.nik || '-'}) telah diajukan dengan rincian: "${claim.description}".`,
        `Kwitansi dan bukti pengeluaran sah telah diverifikasi oleh tim HR & Finance sesuai plafon benefit karyawan.`,
      ],
      attachments: [{ fileName: `Kwitansi_${claim.receiptNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, fileSize: '210 KB', fileType: 'PDF/Struk RS' }],
      signeeName: 'Finance & Payroll Department',
      signeeRole: 'Tim Pemeriksa Klaim Medis & Kas Operasional',
    });
  };

  const [activeTab, setActiveTab] = useState<'payroll' | 'reimburse' | 'thr_phk' | 'komponen' | 'golongan' | 'pengaturan'>('payroll');
  const [period, setPeriod] = useState('Oktober 2026');
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);

  // Reimbursement State
  const [claims, setClaims] = useState<ReimbursementClaim[]>(INITIAL_REIMBURSEMENTS);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimEmpId, setClaimEmpId] = useState(employees[0]?.id || '');
  const [claimType, setClaimType] = useState<ReimbursementClaim['type']>('Rawat Jalan (Kesehatan)');
  const [claimAmount, setClaimAmount] = useState<number>(500000);
  const [claimReceiptNo, setClaimReceiptNo] = useState('');
  const [claimDesc, setClaimDesc] = useState('');

  // THR & PHK Simulator State
  const [simType, setSimType] = useState<'thr' | 'phk'>('thr');
  const [simEmpId, setSimEmpId] = useState(employees[0]?.id || '');
  const [simTenureYears, setSimTenureYears] = useState(3);
  const [simTenureMonths, setSimTenureMonths] = useState(6);
  const [simPhkReason, setSimPhkReason] = useState<'Efisiensi' | 'Pailit' | 'Pensiun' | 'Pelanggaran SP3'>('Efisiensi');

  // Settings State
  const [lateCutRate, setLateCutRate] = useState(moduleSettings.attendance.latePenaltyPerHour || 50000);
  const [alphaCutPerDay, setAlphaCutPerDay] = useState(150000);
  const [enablePphTer, setEnablePphTer] = useState(true);
  const [companyBpjsKes, setCompanyBpjsKes] = useState(4.0);
  const [employeeBpjsKes, setEmployeeBpjsKes] = useState(1.0);
  const [companyBpjsTkJht, setCompanyBpjsTkJht] = useState(3.7);
  const [employeeBpjsTkJht, setEmployeeBpjsTkJht] = useState(2.0);
  const [privateInsurancePlan, setPrivateInsurancePlan] = useState('Prudential Corporate Gold (Skema Tabel Tier L1-L5)');

  // Filter records for this period
  const periodRecords = payrollRecords.filter((p) => p.period === period);

  // Auto-generate if empty on initial visit
  useEffect(() => {
    if (periodRecords.length === 0 && employees.length > 0) {
      generatePayrollRun(period);
    }
  }, [period, employees.length, periodRecords.length]);

  // Aggregate stats
  const totalGross = periodRecords.reduce((sum, r) => sum + r.grossPay, 0);
  const totalTax = periodRecords.reduce((sum, r) => sum + r.pph21Amount, 0);
  const totalBpjsCompany = periodRecords.reduce((sum, r) => sum + r.bpjsKesCompany + r.bpjsTkCompany, 0);
  const totalBpjsEmployee = periodRecords.reduce((sum, r) => sum + r.bpjsKesEmployee + r.bpjsTkEmployee, 0);
  const totalNet = periodRecords.reduce((sum, r) => sum + r.netPay, 0);

  const isApproved = periodRecords.some((r) => r.status === 'Approved');
  const isDisbursed = periodRecords.some((r) => r.status === 'Disbursed');

  const selectedEmployee = selectedPayslip
    ? employees.find((e) => e.id === selectedPayslip.employeeId)
    : null;

  // Reimbursement Actions
  const handleAddClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimEmpId || claimAmount <= 0) return;

    const newClaim: ReimbursementClaim = {
      id: `clm-${Date.now()}`,
      employeeId: claimEmpId,
      type: claimType,
      amount: Number(claimAmount),
      claimDate: new Date().toISOString().split('T')[0],
      receiptNumber: claimReceiptNo || `KWT-${Date.now().toString().slice(-6)}`,
      description: claimDesc || 'Klaim reimbursement operasional/kesehatan',
      status: 'Menunggu Review',
    };

    setClaims((prev) => [newClaim, ...prev]);
    setIsClaimModalOpen(false);
    setClaimDesc('');
    setClaimReceiptNo('');
  };

  const handleReviewClaim = (id: string, status: ReimbursementClaim['status']) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              approvedAmount: status === 'Disetujui (Dibayarkan di Payroll)' ? c.amount : 0,
            }
          : c
      )
    );
  };

  // THR / PHK Calculations
  const simEmployee = employees.find((e) => e.id === simEmpId);
  const baseSalaryForSim = simEmployee ? simEmployee.basicSalary + simEmployee.fixedAllowance : 10000000;

  // THR Formula (Permenaker 6/2016)
  const totalMonthsWorked = simTenureYears * 12 + simTenureMonths;
  const thrAmount =
    totalMonthsWorked >= 12
      ? baseSalaryForSim
      : Math.round((totalMonthsWorked / 12) * baseSalaryForSim);

  // Pesangon PHK Formula (PP 35/2021)
  // Uang Pesangon (UP)
  let upMonths = 1;
  if (simTenureYears < 1) upMonths = 1;
  else if (simTenureYears < 2) upMonths = 2;
  else if (simTenureYears < 3) upMonths = 3;
  else if (simTenureYears < 4) upMonths = 4;
  else if (simTenureYears < 5) upMonths = 5;
  else if (simTenureYears < 6) upMonths = 6;
  else if (simTenureYears < 7) upMonths = 7;
  else if (simTenureYears < 8) upMonths = 8;
  else upMonths = 9;

  // Uang Penghargaan Masa Kerja (UPMK)
  let upmkMonths = 0;
  if (simTenureYears >= 3 && simTenureYears < 6) upmkMonths = 2;
  else if (simTenureYears >= 6 && simTenureYears < 9) upmkMonths = 3;
  else if (simTenureYears >= 9 && simTenureYears < 12) upmkMonths = 4;
  else if (simTenureYears >= 12 && simTenureYears < 15) upmkMonths = 5;
  else if (simTenureYears >= 15 && simTenureYears < 18) upmkMonths = 6;
  else if (simTenureYears >= 18 && simTenureYears < 21) upmkMonths = 7;
  else if (simTenureYears >= 21 && simTenureYears < 24) upmkMonths = 8;
  else if (simTenureYears >= 24) upmkMonths = 10;

  // Faktor Pengali sesuai Alasan PHK
  let factorUP = 1.0;
  if (simPhkReason === 'Efisiensi') factorUP = 0.5;
  else if (simPhkReason === 'Pailit') factorUP = 0.5;
  else if (simPhkReason === 'Pensiun') factorUP = 1.75;
  else if (simPhkReason === 'Pelanggaran SP3') factorUP = 0.5;

  const totalPesangonUP = Math.round(upMonths * factorUP * baseSalaryForSim);
  const totalUPMK = Math.round(upmkMonths * baseSalaryForSim);
  const totalUPH = Math.round(0.15 * (totalPesangonUP + totalUPMK)); // Uang Penggantian Hak (cuti tahunan belum gugur dll)
  const totalPaketPHK = totalPesangonUP + totalUPMK + totalUPH;

  const handleSaveSettings = () => {
    updateModuleSettings('attendance', {
      latePenaltyPerHour: Number(lateCutRate),
    });
    alert('Pengaturan formula kompensasi, BPJS, dan potongan payroll berhasil disimpan!');
  };

  return (
    <div className="space-y-5">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            <span>Manajemen Penggajian & PPh 21 TER 2024</span>
          </h2>
          <p className="text-xs text-slate-500">
            Perhitungan gaji terintegrasi presensi & lembur PP 35/2021, BPJS Ketenagakerjaan & Kesehatan, PPh 21 TER (PMK 168/2023), klaim reimbursement & pesangon PHK.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="w-full lg:w-auto overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold whitespace-nowrap shadow-2xs">
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'payroll' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Payroll Bulanan & Slip
            </button>
            <button
              onClick={() => setActiveTab('reimburse')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'reimburse' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Klaim Medis & Reimburse
            </button>
            <button
              onClick={() => setActiveTab('thr_phk')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'thr_phk' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kalkulator THR & PHK
            </button>
            <button
              onClick={() => setActiveTab('komponen')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'komponen' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Komponen Tunjangan & Potongan
            </button>
            <button
              onClick={() => setActiveTab('golongan')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'golongan' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Skala Upah & Golongan
            </button>
            <button
              onClick={() => setActiveTab('pengaturan')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'pengaturan' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pengaturan Gaji & BPJS
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: RUNNING PAYROLL */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3 border border-slate-200 rounded-lg shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Periode Gaji:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-md font-semibold text-slate-800"
              >
                <option value="Oktober 2026">Oktober 2026</option>
                <option value="September 2026">September 2026</option>
                <option value="Agustus 2026">Agustus 2026</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => generatePayrollRun(period)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold transition-colors"
              >
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                <span>Hitung Ulang Presensi & Gaji</span>
              </button>

              {!isApproved && !isDisbursed && (
                <button
                  onClick={() => approvePayrollRun(period)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Setujui Payroll Direksi</span>
                </button>
              )}

              {isApproved && !isDisbursed && (
                <button
                  onClick={() => disbursePayrollRun(period)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Salurkan Gaji & Rilis Slip</span>
                </button>
              )}

              {isDisbursed && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Gaji Telah Disalurkan Bank</span>
                </span>
              )}
            </div>
          </div>

          {/* Aggregate Financial Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-[11px] font-medium text-slate-500 block">Total Gaji Bruto</span>
              <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                {formatRupiah(totalGross)}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-[11px] font-medium text-slate-500 block">PPh 21 TER Terkumpul</span>
              <span className="text-base font-bold font-mono text-indigo-700 tabular-nums">
                {formatRupiah(totalTax)}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-[11px] font-medium text-slate-500 block">Iuran BPJS (Pekerja)</span>
              <span className="text-base font-bold font-mono text-amber-700 tabular-nums">
                {formatRupiah(totalBpjsEmployee)}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-[11px] font-medium text-slate-500 block">BPJS Ditanggung Kantor</span>
              <span className="text-base font-bold font-mono text-slate-700 tabular-nums">
                {formatRupiah(totalBpjsCompany)}
              </span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-[11px] font-medium text-emerald-800 block">Total Net Disbursed</span>
              <span className="text-base font-bold font-mono text-emerald-800 tabular-nums">
                {formatRupiah(totalNet)}
              </span>
            </div>
          </div>

          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< lg) */}
          <div className="lg:hidden space-y-3">
            {periodRecords.map((rec) => {
              const emp = employees.find((e) => e.id === rec.employeeId);
              const totalDeductions = rec.pph21Amount + rec.bpjsKesEmployee + rec.bpjsTkEmployee + rec.loanDeduction;

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedPayslip(rec)}
                  className="bg-white border border-slate-200 hover:border-emerald-400 rounded-xl p-4 shadow-xs space-y-3 cursor-pointer active:scale-[0.99] transition-all"
                >
                  {/* Top Bar: Employee & THP */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={emp?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{emp?.fullName || 'Karyawan'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {emp?.nik} · {emp?.department}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-emerald-700 font-semibold uppercase block">
                        Take Home Pay
                      </span>
                      <span className="font-mono font-bold text-sm text-emerald-700">
                        {formatRupiah(rec.netPay)}
                      </span>
                    </div>
                  </div>

                  {/* 4-Column Breakdown Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Gaji Pokok:</span>
                      <strong className="text-slate-800">{formatRupiah(rec.basicSalary)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Tunjangan & Lembur:</span>
                      <strong className="text-slate-800">{formatRupiah(rec.allowances + rec.overtimePay)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        PPh 21 (TER {rec.pph21TERCategory}):
                      </span>
                      <strong className="text-indigo-700">{formatRupiah(rec.pph21Amount)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Total Potongan (BPJS/Kasbon):</span>
                      <strong className="text-rose-700">{formatRupiah(totalDeductions)}</strong>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      PTKP: {emp?.ptkp || 'TK/0'} · Tarif: {rec.pph21RatePercent}%
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPayslip(rec);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Slip Gaji</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TAMPILAN DESKTOP: High-Density Calculation Table (>= lg) */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Karyawan & NIK</th>
                    <th className="py-2.5 px-3 text-right">Gaji Pokok</th>
                    <th className="py-2.5 px-3 text-right">Tunjangan</th>
                    <th className="py-2.5 px-3 text-right">Lembur</th>
                    <th className="py-2.5 px-3 text-center">PTKP & TER</th>
                    <th className="py-2.5 px-3 text-right">PPh 21 TER</th>
                    <th className="py-2.5 px-3 text-right">BPJS Pekerja</th>
                    <th className="py-2.5 px-3 text-right">Potongan Kasbon</th>
                    <th className="py-2.5 px-3 text-right">Take Home Pay</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {periodRecords.map((rec) => {
                    const emp = employees.find((e) => e.id === rec.employeeId);
                    return (
                      <tr
                        key={rec.id}
                        onClick={() => setSelectedPayslip(rec)}
                        className="hover:bg-indigo-50/40 cursor-pointer transition-colors font-sans group"
                        title="Klik baris untuk melihat Slip Gaji Elektronik"
                      >
                        <td className="py-2.5 px-3 font-sans">
                          <div className="flex items-center gap-2">
                            <img
                              src={emp?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200"
                            />
                            <div>
                              <div className="font-semibold text-slate-900">{emp?.fullName || 'Karyawan'}</div>
                              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                <span>{emp?.nik}</span>
                                <span>·</span>
                                <span>{emp?.department}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                          {formatRupiah(rec.basicSalary)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                          {formatRupiah(rec.allowances)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                          {rec.overtimePay > 0 ? (
                            <span className="text-indigo-700 font-medium">{formatRupiah(rec.overtimePay)}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="font-bold text-slate-800 font-mono">{emp?.ptkp}</div>
                          <div className="text-[10px] text-indigo-600 font-mono">
                            {rec.pph21TERCategory} ({rec.pph21RatePercent}%)
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-medium">
                          {formatRupiah(rec.pph21Amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-800">
                          {formatRupiah(rec.bpjsKesEmployee + rec.bpjsTkEmployee)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {rec.loanDeduction > 0 ? (
                            <span className="text-rose-700 font-medium">{formatRupiah(rec.loanDeduction)}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                          {formatRupiah(rec.netPay)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setSelectedPayslip(rec)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Slip Gaji</span>
                          </button>
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

      {/* TAB 2: REIMBURSEMENT & KLAIM KESEHATAN */}
      {activeTab === 'reimburse' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 border border-slate-200 rounded-lg">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>Pengajuan & Persetujuan Klaim Kesehatan / Reimbursement</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pencairan tunjangan rawat jalan kacamata gigi dan perjalanan dinas yang otomatis masuk ke penghasilan slip gaji.
              </p>
            </div>
            <button
              onClick={() => setIsClaimModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajukan Klaim Baru</span>
            </button>
          </div>

          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden space-y-3">
            {claims.map((claim) => {
              const emp = employees.find((e) => e.id === claim.employeeId);
              return (
                <div
                  key={`mob-clm-${claim.id}`}
                  className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {claim.type}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        claim.status.includes('Disetujui')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : claim.status.includes('Ditolak')
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {claim.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <img
                      src={emp?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">{emp?.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">NIK: {emp?.nik}</div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg space-y-1.5 text-xs border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-sans">No. Kwitansi:</span>
                      <span className="font-mono font-semibold text-indigo-700">{claim.receiptNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-sans">Tanggal Klaim:</span>
                      <span className="font-mono text-slate-600">{claim.claimDate}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                      "{claim.description}"
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-sans">Nilai Klaim:</span>
                      <span className="font-mono font-bold text-base text-slate-900">
                        {formatRupiah(claim.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePreviewClaim(claim)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Preview Berkas</span>
                    </button>

                    {claim.status === 'Menunggu Review' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReviewClaim(claim.id, 'Ditolak')}
                          className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Tolak
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewClaim(claim.id, 'Disetujui (Dibayarkan di Payroll)')}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                        >
                          Setujui
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* TAMPILAN DESKTOP: Claims Table (>= md) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Karyawan</th>
                  <th className="py-2.5 px-3 font-semibold">Kategori Klaim</th>
                  <th className="py-2.5 px-3 font-semibold">No. Kwitansi & Keterangan</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Tanggal Klaim</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Nilai Pengajuan</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Tindakan HR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((claim) => {
                  const emp = employees.find((e) => e.id === claim.employeeId);
                  return (
                    <tr
                      key={claim.id}
                      onClick={() => handlePreviewClaim(claim)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                      title="Klik baris untuk melihat formulir bukti klaim resmi"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={emp?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover border"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{emp?.fullName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{emp?.nik}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800">{claim.type}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-indigo-700 font-semibold">{claim.receiptNumber}</div>
                        <div className="text-[11px] text-slate-600">{claim.description}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        {claim.claimDate}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(claim.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            claim.status.includes('Disetujui')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : claim.status.includes('Ditolak')
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {claim.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {claim.status === 'Menunggu Review' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReviewClaim(claim.id, 'Disetujui (Dibayarkan di Payroll)');
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReviewClaim(claim.id, 'Ditolak');
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Selesai Ditinjau</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: KALKULATOR THR & PHK */}
      {activeTab === 'thr_phk' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 bg-white p-5 border border-slate-200 rounded-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span>Parameter Simulasi THR / PHK</span>
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Jenis Perhitungan</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSimType('thr')}
                  className={`py-2 px-3 text-xs font-semibold rounded-md border text-center transition-colors ${
                    simType === 'thr'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  THR Keagamaan
                </button>
                <button
                  type="button"
                  onClick={() => setSimType('phk')}
                  className={`py-2 px-3 text-xs font-semibold rounded-md border text-center transition-colors ${
                    simType === 'phk'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Pesangon PHK
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Pilih Karyawan</label>
              <EmployeeSelect
                employees={employees}
                selectedEmployeeId={simEmpId}
                onSelect={(id) => setSimEmpId(id)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Masa Kerja (Tahun)</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={simTenureYears}
                  onChange={(e) => setSimTenureYears(Number(e.target.value))}
                  className="w-full p-2 text-xs border border-slate-300 rounded-md font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Sisa (Bulan)</label>
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={simTenureMonths}
                  onChange={(e) => setSimTenureMonths(Number(e.target.value))}
                  className="w-full p-2 text-xs border border-slate-300 rounded-md font-mono"
                />
              </div>
            </div>

            {simType === 'phk' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Alasan Pemutusan Hubungan Kerja</label>
                <select
                  value={simPhkReason}
                  onChange={(e) => setSimPhkReason(e.target.value as any)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-md bg-white font-medium"
                >
                  <option value="Efisiensi">Efisiensi Perusahaan (0.5x UP)</option>
                  <option value="Pailit">Perusahaan Pailit / Tutup (0.5x UP)</option>
                  <option value="Pensiun">Mencapai Usia Pensiun (1.75x UP)</option>
                  <option value="Pelanggaran SP3">Pelanggaran Disiplin SP3 (0.5x UP)</option>
                </select>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Gaji Pokok + Tunjangan Tetap:</span>
                <span className="font-mono font-bold">{formatRupiah(baseSalaryForSim)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Bulan Bekerja:</span>
                <span className="font-mono font-bold">{totalMonthsWorked} Bulan</span>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="lg:col-span-2 bg-white p-5 border border-slate-200 rounded-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {simType === 'thr'
                ? 'Rincian Hak Tunjangan Hari Raya (Permenaker No. 6/2016)'
                : 'Rincian Kompensasi & Pesangon PHK (PP No. 35/2021)'}
            </h3>

            {simType === 'thr' ? (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="text-xs text-indigo-800 font-medium">Estimasi THR Bruto:</div>
                  <div className="text-2xl font-bold font-mono text-indigo-900 mt-1">
                    {formatRupiah(thrAmount)}
                  </div>
                  <div className="text-[11px] text-indigo-700 mt-1">
                    {totalMonthsWorked >= 12
                      ? 'Masa kerja >= 12 bulan berhak atas 1 bulan upah penuh.'
                      : `Masa kerja proporsional: (${totalMonthsWorked}/12) x Upah sebulan.`}
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg space-y-2 text-xs">
                  <div className="font-semibold text-slate-800 mb-2">Ketentuan Regulasi THR Kemnaker:</div>
                  <p className="text-slate-600">
                    1. Wajib dibayarkan paling lambat 7 hari sebelum hari raya keagamaan.
                  </p>
                  <p className="text-slate-600">
                    2. Dikenakan pemotongan PPh 21 tarif pasal 17/TER akumulasi pada masa pajak pembayaran THR.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[11px] text-slate-500 block">Uang Pesangon (UP)</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {formatRupiah(totalPesangonUP)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {upMonths} bln x {factorUP}x upah
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[11px] text-slate-500 block">Uang Penghargaan (UPMK)</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {formatRupiah(totalUPMK)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{upmkMonths} bulan upah</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[11px] text-slate-500 block">Uang Penggantian Hak (UPH)</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {formatRupiah(totalUPH)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">15% x (UP + UPMK)</span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-emerald-800">Total Paket Kompensasi PHK</span>
                    <div className="text-2xl font-bold font-mono text-emerald-900 mt-0.5">
                      {formatRupiah(totalPaketPHK)}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-200 text-emerald-900 rounded font-mono">
                    PP 35/2021
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PENGATURAN PAYROLL */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white p-6 border border-slate-200 rounded-lg max-w-4xl space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>Pengaturan Komponen Penggajian, BPJS & Formula Lembur/Potongan</span>
            </h3>
            <p className="text-xs text-slate-500">
              Konfigurasi persentase iuran jaminan sosial, formula potongan keterlambatan & alpha, serta asuransi komersial swasta.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* BPJS Ketenagakerjaan */}
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <span>BPJS Ketenagakerjaan</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Jaminan Hari Tua (Perusahaan):</span>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      step="0.1"
                      value={companyBpjsTkJht}
                      onChange={(e) => setCompanyBpjsTkJht(Number(e.target.value))}
                      className="w-16 p-1 border rounded text-right"
                    />
                    <span>%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Jaminan Hari Tua (Pekerja):</span>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      step="0.1"
                      value={employeeBpjsTkJht}
                      onChange={(e) => setEmployeeBpjsTkJht(Number(e.target.value))}
                      className="w-16 p-1 border rounded text-right"
                    />
                    <span>%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>JKK & JKM (Tergantung Tingkat Risiko):</span>
                  <span className="font-mono">0.54% (Perusahaan)</span>
                </div>
              </div>
            </div>

            {/* BPJS Kesehatan */}
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>BPJS Kesehatan</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Ditanggung Perusahaan:</span>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      step="0.1"
                      value={companyBpjsKes}
                      onChange={(e) => setCompanyBpjsKes(Number(e.target.value))}
                      className="w-16 p-1 border rounded text-right"
                    />
                    <span>%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Dipotong dari Pekerja:</span>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      step="0.1"
                      value={employeeBpjsKes}
                      onChange={(e) => setEmployeeBpjsKes(Number(e.target.value))}
                      className="w-16 p-1 border rounded text-right"
                    />
                    <span>%</span>
                  </div>
                </div>
                <div className="text-slate-500 text-[11px]">
                  * Batas upah maksimal pengali BPJS Kesehatan: Rp 12.000.000 / bulan.
                </div>
              </div>
            </div>

            {/* Potongan Presensi */}
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Formula Potongan Presensi</span>
              </h4>
              <div className="space-y-3">
                <CurrencyInput
                  id="lateCutRate"
                  label="Denda Terlambat per Jam:"
                  value={lateCutRate}
                  onChange={setLateCutRate}
                  showTerbilang={false}
                  helperText="Potongan proporsional keterlambatan"
                />
                <CurrencyInput
                  id="alphaCutPerDay"
                  label="Potongan Ketidakhadiran (Alpha) per Hari:"
                  value={alphaCutPerDay}
                  onChange={setAlphaCutPerDay}
                  showTerbilang={false}
                  helperText="Potongan absensi tanpa keterangan sah"
                />
              </div>
            </div>

            {/* Asuransi Non-Pemerintah */}
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>Asuransi Non-Pemerintah (Swasta)</span>
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="text-slate-600 block mb-1">Skema Asuransi Komersial:</label>
                  <input
                    type="text"
                    value={privateInsurancePlan}
                    onChange={(e) => setPrivateInsurancePlan(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Dikelola dengan skema reimbursement kacamata/gigi atau cashless card Rumah Sakit provider.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200">
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs"
            >
              Simpan Pengaturan Payroll
            </button>
          </div>
        </div>
      )}

      {/* 07B: Master Komponen Tunjangan & Potongan */}
      {activeTab === 'komponen' && <SalaryComponentManagement />}

      {/* 07C: Struktur & Skala Upah / Rentang Gaji per Grade */}
      {activeTab === 'golongan' && <GradeSalaryManagement />}

      {/* MODAL: AJUKAN KLAIM REIMBURSEMENT */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Formulir Klaim Reimbursement Baru</h3>
              <button onClick={() => setIsClaimModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleAddClaim} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Karyawan Pemohon</label>
                <EmployeeSelect
                  employees={employees}
                  selectedEmployeeId={claimEmpId}
                  onSelect={(id) => setClaimEmpId(id)}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kategori Klaim</label>
                <select
                  value={claimType}
                  onChange={(e) => setClaimType(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-md font-medium"
                >
                  <option value="Rawat Jalan (Kesehatan)">Rawat Jalan (Kesehatan / Dokter)</option>
                  <option value="Kacamata / Optik">Kacamata / Optik</option>
                  <option value="Gigi">Perawatan Gigi</option>
                  <option value="Transportasi & Bensin">Transportasi Operasional & BBM</option>
                  <option value="Komunikasi & Internet">Tunjangan Komunikasi & Kuota</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <CurrencyInput
                  id="claimAmount"
                  label="Nilai Kwitansi (Rp) *"
                  value={claimAmount}
                  onChange={setClaimAmount}
                  required
                  min={1000}
                  helperText="Total biaya reimburse yang diajukan"
                />
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Struk / Kwitansi</label>
                  <input
                    type="text"
                    value={claimReceiptNo}
                    onChange={(e) => setClaimReceiptNo(e.target.value)}
                    placeholder="Contoh: KWT-9921"
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rincian Keperluan</label>
                <textarea
                  rows={2}
                  value={claimDesc}
                  onChange={(e) => setClaimDesc(e.target.value)}
                  placeholder="Diagnosa singkat atau rincian perjalanan dinas..."
                  className="w-full p-2 border border-slate-300 rounded-md"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Interactive Digital Payslip with QR Signature */}
      {selectedPayslip && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
            {/* Top Toolbar */}
            <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="text-xs font-semibold">Slip Gaji Elektronik Terverifikasi (PPh 21 TER 2024)</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
                <button onClick={() => setSelectedPayslip(null)}>
                  <X className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Payslip Document Body */}
            <div className="p-8 space-y-6 text-slate-800 bg-white">
              {/* Slip Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                    {currentTenant.name}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    NPWP: {currentTenant.npwp} · {currentTenant.city}
                  </p>
                  <div className="text-xs font-semibold text-indigo-700 mt-2 uppercase tracking-wide">
                    SLIP GAJI KARYAWAN · PERIODE {selectedPayslip.period}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-slate-900">
                    SLIP/{selectedPayslip.id.slice(-6).toUpperCase()}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Status: {selectedPayslip.status}
                  </div>
                </div>
              </div>

              {/* Employee Meta Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-24 text-slate-500">Nama:</span>
                    <span className="font-bold text-slate-900">{selectedEmployee.fullName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500">NIK:</span>
                    <span className="font-mono text-slate-900">{selectedEmployee.nik}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500">Jabatan:</span>
                    <span className="text-slate-900">{selectedEmployee.position}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500">Departemen:</span>
                    <span className="text-slate-900">{selectedEmployee.department}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-28 text-slate-500">Status PTKP:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedEmployee.ptkp} (Kategori TER {selectedPayslip.pph21TERCategory})
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Rekening Bank:</span>
                    <span className="font-mono text-slate-900">
                      {selectedEmployee.bankName} - {selectedEmployee.bankAccount}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">NPWP:</span>
                    <span className="font-mono text-slate-900">{selectedEmployee.npwp}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Status Kerja:</span>
                    <span className="text-slate-900">{selectedEmployee.employmentType}</span>
                  </div>
                </div>
              </div>

              {/* Earnings vs Deductions Breakdown */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                {/* Earnings */}
                <div>
                  <h4 className="font-bold text-slate-900 border-b border-slate-300 pb-1.5 mb-2 uppercase text-[11px] tracking-wider">
                    Penerimaan (Earnings)
                  </h4>
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-sans">Gaji Pokok</span>
                      <span className="font-semibold text-slate-900">
                        {formatRupiah(selectedPayslip.basicSalary)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-sans">Tunjangan Tetap & Jabatan</span>
                      <span className="text-slate-800">
                        {formatRupiah(selectedPayslip.allowances)}
                      </span>
                    </div>
                    {selectedPayslip.overtimePay > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-sans">Upah Lembur Resmi</span>
                        <span className="text-indigo-700 font-semibold">
                          {formatRupiah(selectedPayslip.overtimePay)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                      <span className="font-sans">Total Penghasilan Bruto</span>
                      <span>{formatRupiah(selectedPayslip.grossPay)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h4 className="font-bold text-slate-900 border-b border-slate-300 pb-1.5 mb-2 uppercase text-[11px] tracking-wider">
                    Potongan (Deductions)
                  </h4>
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-sans">
                        PPh 21 TER ({selectedPayslip.pph21RatePercent}%)
                      </span>
                      <span className="text-indigo-700 font-semibold">
                        {formatRupiah(selectedPayslip.pph21Amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-sans">BPJS Kesehatan (1%)</span>
                      <span className="text-slate-800">
                        {formatRupiah(selectedPayslip.bpjsKesEmployee)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-sans">BPJS TK (JHT 2% + JP 1%)</span>
                      <span className="text-slate-800">
                        {formatRupiah(selectedPayslip.bpjsTkEmployee)}
                      </span>
                    </div>
                    {selectedPayslip.loanDeduction > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-sans">Angsuran Pinjaman / Kasbon</span>
                        <span className="text-rose-700 font-semibold">
                          {formatRupiah(selectedPayslip.loanDeduction)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-rose-700">
                      <span className="font-sans">Total Potongan</span>
                      <span>
                        {formatRupiah(
                          selectedPayslip.pph21Amount +
                            selectedPayslip.bpjsKesEmployee +
                            selectedPayslip.bpjsTkEmployee +
                            selectedPayslip.loanDeduction
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay Callout */}
              <div className="p-4 bg-slate-900 text-white rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
                    Gaji Bersih Diterima (Take Home Pay)
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                    {formatRupiah(selectedPayslip.netPay)}
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-300">
                  <div>Metode Pembayaran: Bank Transfer</div>
                  <div className="font-mono text-white">Status: Berhasil Disalurkan</div>
                </div>
              </div>

              {/* Footer Verification & QR Signature */}
              <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                <div className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                  Slip gaji ini diterbitkan secara elektronik oleh sistem NusaHR Enterprise dan sah tanpa tanda tangan basah berdasarkan ketentuan UU ITE No. 11/2008 & PP 58/2023.
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] font-semibold text-slate-700">Digital Signature Valid</div>
                    <div className="text-[10px] text-slate-500">Finance & Payroll Manager</div>
                  </div>
                  <QRCodeView
                    value={`https://nusahr.id/verify/payslip/${selectedPayslip.id}?nik=${selectedEmployee.nik}`}
                    size={52}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

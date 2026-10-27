import React, { useState, useEffect, useRef } from 'react';
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
  Gift,
  Sliders,
  MessageSquare,
  Loader2,
  FileDown,
  UserMinus,
  ExternalLink,
} from 'lucide-react';
import { PayrollRecord, Employee, PTKPStatus } from '../../types/hrms';
import {
  formatRupiah,
  calculatePPh21TER,
  calculateBPJS,
  calculateOvertimePay,
  calculateAnnualPPh21Pasal17,
  calculatePesangonTax,
  calculateNonEmployeeTax,
  calculateDailyWorkerTax,
  getPTKPAmount,
  PTKP_VALUES,
  getTERCategory,
} from '../../utils/taxCalculator';
import { QRCodeView } from '../common/QRCodeView';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { CurrencyInput } from '../common/CurrencyInput';
import { SalaryComponentManagement } from './SalaryComponentManagement';
import { ScrollableTabNav } from '../common/ScrollableTabNav';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { printPagesDirectly, exportPagesToPdf } from '../../utils/documentPdfExporter';
import { openWhatsAppChat, WhatsAppTemplates } from '../../utils/whatsappHelper';
import { ModuleDocumentModal } from '../common/ModuleDocumentModal';

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

  const [activeTab, setActiveTab] = useState<'payroll' | 'reimburse' | 'thr_phk' | 'kalkulator_pajak' | 'komponen' | 'pengaturan'>('payroll');
  const [period, setPeriod] = useState('Oktober 2026');
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const payslipSheetRef = useRef<HTMLDivElement>(null);
  const [isExportingPayslip, setIsExportingPayslip] = useState(false);
  const [isPrintingPayslip, setIsPrintingPayslip] = useState(false);
  const [isPayslipWaModalOpen, setIsPayslipWaModalOpen] = useState(false);
  const [payslipWaNumber, setPayslipWaNumber] = useState('08129876543');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Reimbursement State
  const [claims, setClaims] = useState<ReimbursementClaim[]>(INITIAL_REIMBURSEMENTS);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimEmpId, setClaimEmpId] = useState(employees[0]?.id || '');
  const [claimType, setClaimType] = useState<ReimbursementClaim['type']>('Rawat Jalan (Kesehatan)');
  const [claimAmount, setClaimAmount] = useState<number>(500000);
  const [claimReceiptNo, setClaimReceiptNo] = useState('');
  const [claimDesc, setClaimDesc] = useState('');

  // THR & PHK State
  const [thrSubTab, setThrSubTab] = useState<'proses_thr' | 'proses_pesangon'>('proses_thr');
  const [thrOccasion, setThrOccasion] = useState('Hari Raya Idul Fitri 1447 H');
  const [thrPaymentDate, setThrPaymentDate] = useState('2026-03-24');
  const [thrSearchQuery, setThrSearchQuery] = useState('');
  const [paidThrEmpIds, setPaidThrEmpIds] = useState<string[]>(['emp-001']);
  const [selectedThrEmployee, setSelectedThrEmployee] = useState<Employee | null>(null);
  const [isThrSlipModalOpen, setIsThrSlipModalOpen] = useState(false);

  // Pesangon State
  const [simType, setSimType] = useState<'thr' | 'phk'>('phk');
  const [simEmpId, setSimEmpId] = useState(employees[0]?.id || '');
  const [simTenureYears, setSimTenureYears] = useState(3);
  const [simTenureMonths, setSimTenureMonths] = useState(6);
  const [simPhkReason, setSimPhkReason] = useState<'Efisiensi' | 'Pailit' | 'Pensiun' | 'Pelanggaran SP3'>('Efisiensi');

  // Kalkulator Pajak DJP State (mengacu pada kalkulator.pajak.go.id)
  const [djpTaxType, setDjpTaxType] = useState<'pegawai_tetap_bulanan' | 'pegawai_tetap_tahunan' | 'pegawai_tidak_tetap' | 'bukan_pegawai' | 'pesangon_sekaligus'>('pegawai_tetap_bulanan');
  const [djpTaxMethod, setDjpTaxMethod] = useState<'gross' | 'gross_up'>('gross');
  const [djpPtkp, setDjpPtkp] = useState<PTKPStatus>('TK/0');
  const [djpBasicSalary, setDjpBasicSalary] = useState<number>(10000000);
  const [djpFixedAllowance, setDjpFixedAllowance] = useState<number>(2500000);
  const [djpVariableAllowance, setDjpVariableAllowance] = useState<number>(1000000);
  const [djpBonusThr, setDjpBonusThr] = useState<number>(0);
  const [djpIncludeJkkJkm, setDjpIncludeJkkJkm] = useState<boolean>(true);
  const [djpIncludePensionJht, setDjpIncludePensionJht] = useState<boolean>(true);
  const [djpDailyWage, setDjpDailyWage] = useState<number>(650000);
  const [djpWorkDays, setDjpWorkDays] = useState<number>(15);
  const [djpNonEmpGross, setDjpNonEmpGross] = useState<number>(25000000);
  const [djpPesangonGross, setDjpPesangonGross] = useState<number>(125000000);

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

  const handlePrintPayslip = async () => {
    if (!payslipSheetRef.current) return;
    try {
      setIsPrintingPayslip(true);
      await printPagesDirectly([payslipSheetRef.current]);
    } catch (err) {
      console.error('Print payslip failed:', err);
      alert('Gagal memproses pencetakan fisik dokumen slip gaji.');
    } finally {
      setIsPrintingPayslip(false);
    }
  };

  const handleDownloadPayslipPdf = async () => {
    if (!payslipSheetRef.current || !selectedPayslip || !selectedEmployee) return;
    try {
      setIsExportingPayslip(true);
      const filename = `Slip_Gaji_${selectedEmployee.nik}_${selectedPayslip.period.replace(/\s+/g, '_')}.pdf`;
      await exportPagesToPdf([payslipSheetRef.current], filename);
    } catch (err) {
      console.error('Download payslip PDF failed:', err);
      alert('Gagal mengunduh berkas PDF slip gaji.');
    } finally {
      setIsExportingPayslip(false);
    }
  };

  const handleOpenPayslipWaModal = () => {
    if (selectedEmployee) {
      setPayslipWaNumber(selectedEmployee.phone || '08129876543');
    }
    setIsPayslipWaModalOpen(true);
  };

  const handleSendPayslipWhatsApp = () => {
    if (!selectedPayslip || !selectedEmployee) return;
    const msg = WhatsAppTemplates.payslip({
      employeeName: selectedEmployee.fullName,
      nik: selectedEmployee.nik,
      companyName: currentTenant.name,
      period: selectedPayslip.period,
      thpAmount: formatRupiah(selectedPayslip.netPay),
      pph21Amount: formatRupiah(selectedPayslip.pph21Amount),
      basicSalary: formatRupiah(selectedPayslip.basicSalary),
    });
    openWhatsAppChat(payslipWaNumber || selectedEmployee.phone || '08129876543', msg);
    setIsPayslipWaModalOpen(false);
  };

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
      {/* Row 1: Module Title Header */}
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-600" />
          <span>Manajemen Penggajian & PPh 21 TER 2024</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Perhitungan gaji terintegrasi presensi & lembur PP 35/2021, BPJS Ketenagakerjaan & Kesehatan, PPh 21 TER (PMK 168/2023), klaim reimbursement & pesangon PHK.
        </p>
      </div>

      {/* Row 2: Enterprise Tab Navigation Bar with Arrows & Mouse-Wheel Horizontal Scroll */}
      <ScrollableTabNav className="border-b border-slate-200" containerClassName="pt-1">
        <button
          onClick={() => setActiveTab('payroll')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'payroll'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Payroll Bulanan & Slip</span>
        </button>

        <button
          onClick={() => setActiveTab('reimburse')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'reimburse'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Klaim Medis & Reimburse</span>
        </button>

        <button
          onClick={() => setActiveTab('thr_phk')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'thr_phk'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Proses THR & Pesangon</span>
        </button>

        <button
          onClick={() => setActiveTab('kalkulator_pajak')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'kalkulator_pajak'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Kalkulator Pajak DJP</span>
        </button>

        <button
          onClick={() => setActiveTab('komponen')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'komponen'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Komponen Gaji & Tunjangan</span>
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
          <span>Pengaturan Gaji & BPJS</span>
        </button>
      </ScrollableTabNav>

      {/* TAB 1: RUNNING PAYROLL */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="bg-white p-3 sm:p-3.5 border border-slate-200 rounded-xl shadow-xs space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 shrink-0">Periode Gaji:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="Oktober 2026">Oktober 2026</option>
                <option value="September 2026">September 2026</option>
                <option value="Agustus 2026">Agustus 2026</option>
              </select>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <button
                onClick={() => generatePayrollRun(period)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
              >
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                <span>Hitung Ulang Presensi & Gaji</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDocModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                title="Buka Pusat Dokumen Resmi Payroll, Pajak Coretax & BPJS"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Dokumen Resmi Payroll & Pajak</span>
              </button>

              {!isApproved && !isDisbursed && (
                <button
                  onClick={() => approvePayrollRun(period)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Setujui Payroll Direksi</span>
                </button>
              )}

              {isApproved && !isDisbursed && (
                <button
                  onClick={() => disbursePayrollRun(period)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Salurkan Gaji & Rilis Slip</span>
                </button>
              )}

              {isDisbursed && (
                <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
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

          {/* TAMPILAN DESKTOP & TABLET: Menyesuaikan kolom secara responsif tanpa slide horizontal */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Karyawan & NIK</th>
                    <th className="py-2.5 px-3 text-right hidden xl:table-cell">Gaji Pokok</th>
                    <th className="py-2.5 px-3 text-right hidden 2xl:table-cell">Tunjangan</th>
                    <th className="py-2.5 px-3 text-right hidden 2xl:table-cell">Lembur</th>
                    <th className="py-2.5 px-3 text-center hidden xl:table-cell">PTKP & TER</th>
                    <th className="py-2.5 px-3 text-right hidden 2xl:table-cell">PPh 21 TER</th>
                    <th className="py-2.5 px-3 text-right hidden 2xl:table-cell">BPJS Pekerja</th>
                    <th className="py-2.5 px-3 text-right hidden 2xl:table-cell">Potongan Kasbon</th>
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
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800 hidden xl:table-cell">
                          {formatRupiah(rec.basicSalary)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800 hidden 2xl:table-cell">
                          {formatRupiah(rec.allowances)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800 hidden 2xl:table-cell">
                          {rec.overtimePay > 0 ? (
                            <span className="text-indigo-700 font-medium">{formatRupiah(rec.overtimePay)}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center hidden xl:table-cell">
                          <div className="font-bold text-slate-800 font-mono">{emp?.ptkp}</div>
                          <div className="text-[10px] text-indigo-600 font-mono">
                            {rec.pph21TERCategory} ({rec.pph21RatePercent}%)
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-medium hidden 2xl:table-cell">
                          {formatRupiah(rec.pph21Amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-800 hidden 2xl:table-cell">
                          {formatRupiah(rec.bpjsKesEmployee + rec.bpjsTkEmployee)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono hidden 2xl:table-cell">
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

      {/* TAB 3: PROSES THR & PESANGON */}
      {activeTab === 'thr_phk' && (
        <div className="space-y-5">
          {/* Sub Tab Navigation: Proses THR Batch vs Kompensasi Pesangon PHK */}
          <div className="bg-white p-3 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setThrSubTab('proses_thr')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  thrSubTab === 'proses_thr'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Gift className="w-3.5 h-3.5 text-indigo-600" />
                <span>Proses THR Karyawan (Batch & Slip)</span>
              </button>
              <button
                type="button"
                onClick={() => setThrSubTab('proses_pesangon')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  thrSubTab === 'proses_pesangon'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserMinus className="w-3.5 h-3.5 text-rose-600" />
                <span>Proses Hak Pesangon PHK (PP 35/2021)</span>
              </button>
            </div>

            {thrSubTab === 'proses_thr' && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500 font-medium">Hari Raya:</span>
                  <input
                    type="text"
                    value={thrOccasion}
                    onChange={(e) => setThrOccasion(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-md font-semibold text-slate-800 bg-white"
                  />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500 font-medium">Jatuh Tempo (H-7):</span>
                  <input
                    type="date"
                    value={thrPaymentDate}
                    onChange={(e) => setThrPaymentDate(e.target.value)}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-md font-mono text-slate-800 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SUB-VIEW 1: PROSES THR BATCH & SLIP */}
          {thrSubTab === 'proses_thr' && (() => {
            // Kalkulasi THR untuk semua karyawan aktif
            const activeEmployees = employees.filter((e) => e.status === 'Aktif');
            const targetPayDate = new Date(thrPaymentDate || '2026-03-24');

            const thrCalculations = activeEmployees.map((emp) => {
              const join = new Date(emp.joinDate || '2024-01-01');
              // Hitung selisih bulan kerja
              let months = (targetPayDate.getFullYear() - join.getFullYear()) * 12 + (targetPayDate.getMonth() - join.getMonth());
              if (targetPayDate.getDate() < join.getDate()) months -= 1;
              const tenureMonths = Math.max(0, months);
              const tenureYears = Math.floor(tenureMonths / 12);
              const remMonths = tenureMonths % 12;

              const baseWage = emp.basicSalary;
              let thrGross = 0;
              let formulaDesc = '';

              if (tenureMonths >= 12) {
                thrGross = baseWage;
                formulaDesc = '1x Upah Penuh (Masa Kerja ≥ 12 Bln)';
              } else if (tenureMonths >= 1) {
                thrGross = Math.round((tenureMonths / 12) * baseWage);
                formulaDesc = `Prorata (${tenureMonths}/12) x Upah`;
              } else {
                thrGross = 0;
                formulaDesc = 'Masa Kerja < 1 Bln (Tidak Berhak)';
              }

              // Pajak PPh 21 TER atas THR
              const terResult = calculatePPh21TER(thrGross, (emp.ptkpStatus as PTKPStatus) || 'TK/0');
              const thrTax = terResult.taxAmount;
              const thrNet = Math.max(0, thrGross - thrTax);
              const isPaid = paidThrEmpIds.includes(emp.id);

              return {
                employee: emp,
                tenureMonths,
                tenureYears,
                remMonths,
                baseWage,
                thrGross,
                formulaDesc,
                terCategory: terResult.category,
                terRate: terResult.ratePercent,
                thrTax,
                thrNet,
                isPaid,
              };
            });

            const filteredThr = thrCalculations.filter((t) =>
              !thrSearchQuery ||
              t.employee.fullName.toLowerCase().includes(thrSearchQuery.toLowerCase()) ||
              t.employee.nik.toLowerCase().includes(thrSearchQuery.toLowerCase()) ||
              t.employee.department.toLowerCase().includes(thrSearchQuery.toLowerCase())
            );

            const totalThrGross = thrCalculations.reduce((sum, t) => sum + t.thrGross, 0);
            const totalThrTax = thrCalculations.reduce((sum, t) => sum + t.thrTax, 0);
            const totalThrNet = thrCalculations.reduce((sum, t) => sum + t.thrNet, 0);
            const totalPaidCount = thrCalculations.filter((t) => t.isPaid).length;

            return (
              <div className="space-y-4">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <span className="text-xs text-slate-500 block mb-1">Total Karyawan Penerima</span>
                    <span className="text-2xl font-bold font-mono text-slate-900">
                      {thrCalculations.filter((t) => t.thrGross > 0).length} Orang
                    </span>
                    <div className="text-[11px] text-slate-500 mt-1">Dari {activeEmployees.length} karyawan aktif</div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <span className="text-xs text-slate-500 block mb-1">Anggaran THR Bruto</span>
                    <span className="text-xl font-bold font-mono text-indigo-700">
                      {formatRupiah(totalThrGross)}
                    </span>
                    <div className="text-[11px] text-indigo-600 mt-1">Permenaker No. 6/2016</div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <span className="text-xs text-slate-500 block mb-1">Estimasi PPh 21 TER</span>
                    <span className="text-xl font-bold font-mono text-rose-700">
                      {formatRupiah(totalThrTax)}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-1">PP 58/2023 TER Bulanan</div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <span className="text-xs text-slate-500 block mb-1">Total THR Bersih (Netto)</span>
                    <span className="text-xl font-bold font-mono text-emerald-700">
                      {formatRupiah(totalThrNet)}
                    </span>
                    <div className="text-[11px] text-emerald-600 mt-1">
                      {totalPaidCount} / {activeEmployees.length} Lunas ditransfer
                    </div>
                  </div>
                </div>

                {/* Table Control Bar */}
                <div className="bg-white p-3 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={thrSearchQuery}
                      onChange={(e) => setThrSearchQuery(e.target.value)}
                      placeholder="Cari nama, NIK, divisi karyawan..."
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = activeEmployees.map((e) => e.id);
                        setPaidThrEmpIds((prev) => (prev.length === allIds.length ? [] : allIds));
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{paidThrEmpIds.length === activeEmployees.length ? 'Batalkan Semua' : 'Tandai Semua Lunas'}</span>
                    </button>
                  </div>
                </div>

                {/* Processed THR Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Karyawan & NIK</th>
                        <th className="py-2.5 px-3">Tgl Masuk & Masa Kerja</th>
                        <th className="py-2.5 px-3 text-right">Upah Pokok</th>
                        <th className="py-2.5 px-3">Formula Regulasi</th>
                        <th className="py-2.5 px-3 text-right">THR Bruto</th>
                        <th className="py-2.5 px-3 text-right">PPh 21 TER</th>
                        <th className="py-2.5 px-3 text-right">THR Netto</th>
                        <th className="py-2.5 px-3 text-center">Status Pembayaran</th>
                        <th className="py-2.5 px-3 text-center">Aksi Dokumen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredThr.map((t) => (
                        <tr key={t.employee.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{t.employee.fullName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {t.employee.nik} · {t.employee.position}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-mono text-slate-800">{t.employee.joinDate}</div>
                            <div className="text-[10px] text-indigo-700 font-semibold">
                              {t.tenureYears > 0 ? `${t.tenureYears} Thn ` : ''}{t.remMonths} Bln
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                            {formatRupiah(t.baseWage)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[11px] text-slate-700 block">{t.formulaDesc}</span>
                            <span className="text-[10px] text-slate-400">PTKP: {t.employee.ptkpStatus || 'TK/0'}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                            {formatRupiah(t.thrGross)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                            {formatRupiah(t.thrTax)}
                            <div className="text-[9.5px] text-slate-400 font-mono">
                              {t.terCategory} ({t.terRate}%)
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-800">
                            {formatRupiah(t.thrNet)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setPaidThrEmpIds((prev) =>
                                  prev.includes(t.employee.id)
                                    ? prev.filter((id) => id !== t.employee.id)
                                    : [...prev, t.employee.id]
                                );
                              }}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                                t.isPaid
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                  : 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100'
                              }`}
                            >
                              {t.isPaid ? '✓ Lunas Ditransfer' : 'Menunggu Transfer'}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedThrEmployee(t.employee);
                                  setIsThrSlipModalOpen(true);
                                }}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Lihat & Cetak Slip THR Resmi"
                              >
                                <Eye className="w-3 h-3 text-indigo-600" />
                                <span>Slip THR</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const text = `Halo ${t.employee.fullName}, berikut rincian Tunjangan Hari Raya (THR) ${thrOccasion} Anda:\n• Masa Kerja: ${t.tenureYears} Tahun ${t.remMonths} Bulan\n• THR Bruto: ${formatRupiah(t.thrGross)}\n• Potongan PPh 21 TER: ${formatRupiah(t.thrTax)}\n• THR Bersih Diterima: ${formatRupiah(t.thrNet)}\nJatuh tempo: ${thrPaymentDate}. Terima kasih atas dedikasi Anda di ${currentTenant.name}!`;
                                  openWhatsAppChat(t.employee.phone || '08129876543', text);
                                }}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition-colors cursor-pointer"
                                title="Kirim Slip THR via WhatsApp"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* SUB-VIEW 2: PROSES HAK PESANGON PHK (PP 35/2021) */}
          {thrSubTab === 'proses_pesangon' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-1 bg-white p-5 border border-slate-200 rounded-xl space-y-4 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-rose-600" />
                  <span>Parameter Pemutusan Hubungan Kerja</span>
                </h3>

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

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Alasan Pemutusan Hubungan Kerja (PP 35/2021)</label>
                  <select
                    value={simPhkReason}
                    onChange={(e) => setSimPhkReason(e.target.value as any)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-md bg-white font-medium"
                  >
                    <option value="Efisiensi">Efisiensi Perusahaan (0.5x UP + 1x UPMK + 15% UPH)</option>
                    <option value="Pailit">Perusahaan Pailit / Merugi (0.5x UP + 1x UPMK + 15% UPH)</option>
                    <option value="Pensiun">Mencapai Usia Pensiun Normal (1.75x UP + 1x UPMK + 15% UPH)</option>
                    <option value="Pelanggaran SP3">Pelanggaran Disiplin SP3 (0.5x UP + 1x UPMK + 15% UPH)</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Gaji Pokok Karyawan:</span>
                    <span className="font-mono font-bold">{formatRupiah(baseSalaryForSim)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Masa Kerja Total:</span>
                    <span className="font-mono font-bold">{simTenureYears} Tahun {simTenureMonths} Bulan</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dasar Hukum:</span>
                    <span className="font-semibold text-indigo-700">PP No. 35 Tahun 2021</span>
                  </div>
                </div>
              </div>

              {/* Rincian Kompensasi & Pajak Pesangon PP 68/2009 */}
              <div className="lg:col-span-2 bg-white p-5 border border-slate-200 rounded-xl space-y-4 shadow-2xs">
                {(() => {
                  const pesangonTaxRes = calculatePesangonTax(totalPaketPHK);
                  const netPesangon = Math.max(0, totalPaketPHK - pesangonTaxRes.tax);

                  return (
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">
                          Rincian Kompensasi Hak Karyawan & Pajak Pesangon Final
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10.5px]">
                          PP 35/2021 & PP 68/2009
                        </span>
                      </div>

                      {/* 3 Komponen Kompensasi Pokok */}
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

                      {/* Pajak Pesangon Final PP 68/2009 Tier Breakdown */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                          <span>Potongan PPh 21 Final atas Uang Pesangon Dibayar Sekaligus (PP 68/2009)</span>
                          <span className="font-mono text-rose-700 font-bold">{formatRupiah(pesangonTaxRes.tax)}</span>
                        </div>
                        <div className="space-y-1 pt-1">
                          {pesangonTaxRes.tiers.map((t, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                              <span>• Lapisan {idx + 1} ({t.tier} tarif {t.rate}%):</span>
                              <span className="font-mono">{formatRupiah(t.taxInTier)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total Akhir Diterima */}
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-emerald-800">Total Hak Pesangon Bersih Diterima Karyawan</span>
                          <div className="text-2xl font-bold font-mono text-emerald-900 mt-0.5">
                            {formatRupiah(netPesangon)}
                          </div>
                          <div className="text-[11px] text-emerald-700 mt-0.5">
                            Bruto {formatRupiah(totalPaketPHK)} dikurangi PPh 21 Final {formatRupiah(pesangonTaxRes.tax)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              alert(`Rincian hak pesangon untuk karyawan ${employees.find((e) => e.id === simEmpId)?.fullName || 'Karyawan'} telah diteruskan ke alur Offboarding & Clearance.`);
                            }}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Kirim ke Modul Offboarding</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: KALKULATOR PAJAK DJP (MENGACU PADA https://kalkulator.pajak.go.id/) */}
      {activeTab === 'kalkulator_pajak' && (() => {
        // Objek Pajak Logic
        let grossIncomeCalc = 0;
        let taxResultDetail: any = null;

        if (djpTaxType === 'pegawai_tetap_bulanan') {
          const jkkJkm = djpIncludeJkkJkm ? Math.round(djpBasicSalary * 0.0054) : 0;
          grossIncomeCalc = djpBasicSalary + djpFixedAllowance + djpVariableAllowance + djpBonusThr + jkkJkm;
          const terCalc = calculatePPh21TER(grossIncomeCalc, djpPtkp);
          taxResultDetail = {
            gross: grossIncomeCalc,
            terCategory: terCalc.category,
            terRate: terCalc.ratePercent,
            taxAmount: terCalc.taxAmount,
            netPay: grossIncomeCalc - terCalc.taxAmount,
          };
        } else if (djpTaxType === 'pegawai_tetap_tahunan') {
          // Masa Pajak Terakhir (Desember / Pasal 17)
          const monthlyGross = djpBasicSalary + djpFixedAllowance + djpVariableAllowance;
          const annualGross = (monthlyGross * 12) + djpBonusThr;
          const annualBiayaJabatan = Math.min(6000000, Math.round(annualGross * 0.05));
          const annualPension = djpIncludePensionJht ? Math.round(djpBasicSalary * 0.03 * 12) : 0;
          const annualNetto = Math.max(0, annualGross - annualBiayaJabatan - annualPension);
          const ptkpVal = getPTKPAmount(djpPtkp);
          const pkp = Math.max(0, annualNetto - ptkpVal);
          const pasal17Res = calculateAnnualPPh21Pasal17(pkp);
          taxResultDetail = {
            annualGross,
            annualBiayaJabatan,
            annualPension,
            annualNetto,
            ptkpVal,
            pkp,
            pasal17Res,
            taxAmount: pasal17Res.tax,
            netAnnual: annualGross - pasal17Res.tax,
          };
        } else if (djpTaxType === 'pegawai_tidak_tetap') {
          const dailyRes = calculateDailyWorkerTax(djpDailyWage, djpWorkDays);
          taxResultDetail = {
            dailyWage: djpDailyWage,
            workDays: djpWorkDays,
            dailyTax: dailyRes.dailyTax,
            ratePercent: dailyRes.dailyRatePercent,
            totalGross: dailyRes.totalGross,
            taxAmount: dailyRes.totalTax,
            netPay: dailyRes.totalGross - dailyRes.totalTax,
          };
        } else if (djpTaxType === 'bukan_pegawai') {
          const nonEmpRes = calculateNonEmployeeTax(djpNonEmpGross);
          taxResultDetail = {
            gross: djpNonEmpGross,
            dpp: nonEmpRes.dpp,
            ratePercent: nonEmpRes.ratePercent,
            taxAmount: nonEmpRes.tax,
            netPay: djpNonEmpGross - nonEmpRes.tax,
          };
        } else {
          // Pesangon Sekaligus Final PP 68/2009
          const pesangonRes = calculatePesangonTax(djpPesangonGross);
          taxResultDetail = {
            gross: djpPesangonGross,
            taxAmount: pesangonRes.tax,
            tiers: pesangonRes.tiers,
            netPay: djpPesangonGross - pesangonRes.tax,
          };
        }

        return (
          <div className="space-y-5">
            {/* Official Banner Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wide">
                    Coretax DJP Online
                  </span>
                  <span className="text-xs text-indigo-200">PP No. 58/2023 & PMK No. 168/2023</span>
                </div>
                <h3 className="text-base font-extrabold tracking-tight">
                  Kalkulator Pajak Resmi PPh Pasal 21 DJP
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Simulasi perhitungan pajak resmi mengacu pada sistem administrasi perpajakan Direktorat Jenderal Pajak (kalkulator.pajak.go.id).
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="https://kalkulator.pajak.go.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Kunjungi Portal DJP Asli</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Kolom Kiri: Parameter Input Form (5 Kolom) */}
              <div className="lg:col-span-5 bg-white p-5 border border-slate-200 rounded-xl space-y-4 shadow-2xs">
                <div className="border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    1. Pengaturan Objek Pajak & Wajib Pajak
                  </h4>
                </div>

                {/* Jenis Objek Pajak */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Jenis Pemotongan Pajak PPh 21
                  </label>
                  <select
                    value={djpTaxType}
                    onChange={(e) => setDjpTaxType(e.target.value as any)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-900"
                  >
                    <option value="pegawai_tetap_bulanan">21-100-01: Pegawai Tetap (Masa Jan - Nov / TER Bulanan)</option>
                    <option value="pegawai_tetap_tahunan">21-100-01: Pegawai Tetap Masa Terakhir (Desember / Pasal 17)</option>
                    <option value="pegawai_tidak_tetap">21-100-03: Pegawai Tidak Tetap / Tenaga Lepas Harian</option>
                    <option value="bukan_pegawai">21-100-07: Bukan Pegawai (Imbalan Tenaga Ahli)</option>
                    <option value="pesangon_sekaligus">21-401-01: Pesangon Dibayarkan Sekaligus (Final PP 68/2009)</option>
                  </select>
                </div>

                {/* Skema Metode Pemotongan Gross vs Gross Up */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Skema Metode Pemotongan</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDjpTaxMethod('gross')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-colors cursor-pointer ${
                        djpTaxMethod === 'gross'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Gross (Karyawan)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDjpTaxMethod('gross_up')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-colors cursor-pointer ${
                        djpTaxMethod === 'gross_up'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Gross-Up (Tunjangan PPh)
                    </button>
                  </div>
                </div>

                {/* Status PTKP */}
                {(djpTaxType === 'pegawai_tetap_bulanan' || djpTaxType === 'pegawai_tetap_tahunan') && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">Status PTKP Karyawan</label>
                      <span className="text-[10px] font-mono font-bold text-indigo-700">
                        {getTERCategory(djpPtkp)}
                      </span>
                    </div>
                    <select
                      value={djpPtkp}
                      onChange={(e) => setDjpPtkp(e.target.value as any)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-bold text-slate-900"
                    >
                      <optgroup label="Tidak Kawin (TK)">
                        <option value="TK/0">TK/0 - Tidak Kawin Tanpa Tanggungan (Rp 54 Jt - TER A)</option>
                        <option value="TK/1">TK/1 - Tidak Kawin 1 Tanggungan (Rp 58.5 Jt - TER A)</option>
                        <option value="TK/2">TK/2 - Tidak Kawin 2 Tanggungan (Rp 63 Jt - TER B)</option>
                        <option value="TK/3">TK/3 - Tidak Kawin 3 Tanggungan (Rp 67.5 Jt - TER B)</option>
                      </optgroup>
                      <optgroup label="Kawin (K)">
                        <option value="K/0">K/0 - Kawin Tanpa Tanggungan (Rp 58.5 Jt - TER A)</option>
                        <option value="K/1">K/1 - Kawin 1 Tanggungan (Rp 63 Jt - TER B)</option>
                        <option value="K/2">K/2 - Kawin 2 Tanggungan (Rp 67.5 Jt - TER B)</option>
                        <option value="K/3">K/3 - Kawin 3 Tanggungan (Rp 72 Jt - TER C)</option>
                      </optgroup>
                    </select>
                  </div>
                )}

                {/* Input Komponen Tergantung Jenis Objek Pajak */}
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    2. Variabel Komponen Penghasilan
                  </h4>

                  {(djpTaxType === 'pegawai_tetap_bulanan' || djpTaxType === 'pegawai_tetap_tahunan') && (
                    <>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">Gaji Pokok Sebulan</label>
                        <CurrencyInput
                          value={djpBasicSalary}
                          onChange={(val) => setDjpBasicSalary(val)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Tunjangan Tetap</label>
                          <CurrencyInput
                            value={djpFixedAllowance}
                            onChange={(val) => setDjpFixedAllowance(val)}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Tunjangan Variabel / Lembur</label>
                          <CurrencyInput
                            value={djpVariableAllowance}
                            onChange={(val) => setDjpVariableAllowance(val)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">Bonus / THR / Gratifikasi</label>
                        <CurrencyInput
                          value={djpBonusThr}
                          onChange={(val) => setDjpBonusThr(val)}
                        />
                      </div>
                      <div className="space-y-1.5 pt-1 text-xs text-slate-700">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={djpIncludeJkkJkm}
                            onChange={(e) => setDjpIncludeJkkJkm(e.target.checked)}
                            className="w-3.5 h-3.5 text-indigo-600 rounded"
                          />
                          <span>Premi JKK (0.24%) & JKM (0.3%) Ditanggung Pemberi Kerja</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={djpIncludePensionJht}
                            onChange={(e) => setDjpIncludePensionJht(e.target.checked)}
                            className="w-3.5 h-3.5 text-indigo-600 rounded"
                          />
                          <span>Iuran JHT (2%) & Pensiun (1%) Ditanggung Karyawan (Pengurang)</span>
                        </label>
                      </div>
                    </>
                  )}

                  {djpTaxType === 'pegawai_tidak_tetap' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Upah Harian</label>
                          <CurrencyInput
                            value={djpDailyWage}
                            onChange={(val) => setDjpDailyWage(val)}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Jumlah Hari Kerja</label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={djpWorkDays}
                            onChange={(e) => setDjpWorkDays(Number(e.target.value))}
                            className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                          />
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
                        Ketentuan PMK 168/2023: Upah harian ≤ Rp 450.000 tarif 0%. Upah harian Rp 450.001 - Rp 2.500.000 dikenakan TER Harian 0.5%.
                      </div>
                    </>
                  )}

                  {djpTaxType === 'bukan_pegawai' && (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">Penghasilan Bruto Imbalan Jasa / Fee</label>
                      <CurrencyInput
                        value={djpNonEmpGross}
                        onChange={(val) => setDjpNonEmpGross(val)}
                      />
                      <div className="text-[11px] text-slate-500 mt-1">
                        DPP = 50% x Penghasilan Bruto. Dikenakan tarif umum Pasal 17 UU PPh.
                      </div>
                    </div>
                  )}

                  {djpTaxType === 'pesangon_sekaligus' && (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">Total Penghasilan Uang Pesangon Bruto</label>
                      <CurrencyInput
                        value={djpPesangonGross}
                        onChange={(val) => setDjpPesangonGross(val)}
                      />
                      <div className="text-[11px] text-slate-500 mt-1">
                        Sesuai PP 68/2009: 0 s/d 50 Juta (0%), 50 s/d 100 Juta (5%), 100 s/d 500 Juta (15%), &gt; 500 Juta (25%).
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Kolom Kanan: Rincian Hasil Perhitungan Resmi Coretax DJP (7 Kolom) */}
              <div className="lg:col-span-7 bg-white p-5 border border-slate-200 rounded-xl space-y-4 shadow-2xs">
                <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Hasil Perhitungan Pajak (Formulir Simulasi Coretax)
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    STATUS: VALID
                  </span>
                </div>

                {/* Display output by Tax Object */}
                {djpTaxType === 'pegawai_tetap_bulanan' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="text-[11px] text-slate-500 block">Penghasilan Bruto Sebulan</span>
                        <span className="text-sm font-bold font-mono text-slate-900">
                          {formatRupiah(taxResultDetail.gross)}
                        </span>
                      </div>
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <span className="text-[11px] text-indigo-700 block">Kategori & Tarif TER</span>
                        <span className="text-sm font-bold font-mono text-indigo-950">
                          {taxResultDetail.terCategory} ({taxResultDetail.terRate}%)
                        </span>
                      </div>
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                        <span className="text-[11px] text-rose-700 block">PPh Pasal 21 Terutang</span>
                        <span className="text-sm font-bold font-mono text-rose-900">
                          {formatRupiah(taxResultDetail.taxAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-emerald-800">Penghasilan Bersih (Take Home Pay)</span>
                        <div className="text-2xl font-bold font-mono text-emerald-950 mt-0.5">
                          {formatRupiah(taxResultDetail.netPay)}
                        </div>
                      </div>
                      {djpTaxMethod === 'gross_up' && (
                        <div className="text-right">
                          <span className="text-[11px] font-semibold text-indigo-800 block">Tunjangan Pajak (Gross-Up)</span>
                          <span className="text-sm font-bold font-mono text-indigo-900">
                            +{formatRupiah(taxResultDetail.taxAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {djpTaxType === 'pegawai_tetap_tahunan' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex justify-between">
                        <span>Penghasilan Bruto Setahun:</span>
                        <span className="font-mono font-bold">{formatRupiah(taxResultDetail.annualGross)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>• Biaya Jabatan (5% maks Rp 6 Jt):</span>
                        <span className="font-mono">-{formatRupiah(taxResultDetail.annualBiayaJabatan)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>• Iuran Pensiun / JHT Setahun:</span>
                        <span className="font-mono">-{formatRupiah(taxResultDetail.annualPension)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-slate-200 pt-1">
                        <span>Penghasilan Netto Setahun:</span>
                        <span className="font-mono text-indigo-700">{formatRupiah(taxResultDetail.annualNetto)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>• PTKP ({djpPtkp}):</span>
                        <span className="font-mono">-{formatRupiah(taxResultDetail.ptkpVal)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-slate-900">
                        <span>Penghasilan Kena Pajak (PKP):</span>
                        <span className="font-mono text-indigo-900">{formatRupiah(taxResultDetail.pkp)}</span>
                      </div>
                    </div>

                    {/* Lapisan Tarif Pasal 17 */}
                    <div className="p-3 border border-slate-200 rounded-lg space-y-1.5">
                      <span className="font-bold text-slate-800 block">Rincian Lapisan Tarif Pasal 17 UU PPh:</span>
                      {taxResultDetail.pasal17Res.tiers.map((tier: any, i: number) => (
                        <div key={i} className="flex justify-between text-[11px] text-slate-600">
                          <span>Lapisan {i + 1} ({tier.tier} - {tier.rate}%):</span>
                          <span className="font-mono">{formatRupiah(tier.taxInTier)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between">
                      <span className="font-bold text-rose-900">Total PPh 21 Setahun Terutang:</span>
                      <span className="text-xl font-bold font-mono text-rose-950">
                        {formatRupiah(taxResultDetail.taxAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {djpTaxType === 'pegawai_tidak_tetap' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="text-[11px] text-slate-500 block">Total Upah ({taxResultDetail.workDays} Hari)</span>
                        <span className="text-sm font-bold font-mono text-slate-900">
                          {formatRupiah(taxResultDetail.totalGross)}
                        </span>
                      </div>
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                        <span className="text-[11px] text-rose-700 block">PPh 21 Terutang (TER Harian {taxResultDetail.ratePercent}%)</span>
                        <span className="text-sm font-bold font-mono text-rose-900">
                          {formatRupiah(taxResultDetail.taxAmount)}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <span className="text-xs font-bold text-emerald-800 block">Upah Bersih Diterima Tenaga Kerja</span>
                      <span className="text-2xl font-bold font-mono text-emerald-950">
                        {formatRupiah(taxResultDetail.netPay)}
                      </span>
                    </div>
                  </div>
                )}

                {djpTaxType === 'bukan_pegawai' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="text-[11px] text-slate-500 block">Dasar Pengenaan Pajak (50% x Bruto)</span>
                        <span className="text-sm font-bold font-mono text-slate-900">
                          {formatRupiah(taxResultDetail.dpp)}
                        </span>
                      </div>
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                        <span className="text-[11px] text-rose-700 block">PPh 21 Terutang ({taxResultDetail.ratePercent}%)</span>
                        <span className="text-sm font-bold font-mono text-rose-900">
                          {formatRupiah(taxResultDetail.taxAmount)}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <span className="text-xs font-bold text-emerald-800 block">Imbalan Bersih Diterima</span>
                      <span className="text-2xl font-bold font-mono text-emerald-950">
                        {formatRupiah(taxResultDetail.netPay)}
                      </span>
                    </div>
                  </div>
                )}

                {djpTaxType === 'pesangon_sekaligus' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                      <span className="text-xs font-bold text-slate-800 block">Rincian Lapisan Tarif Final PP 68/2009:</span>
                      {taxResultDetail.tiers.map((t: any, i: number) => (
                        <div key={i} className="flex justify-between text-[11px] text-slate-600">
                          <span>{t.tier} ({t.rate}%):</span>
                          <span className="font-mono">{formatRupiah(t.taxInTier)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-emerald-800 block">Pesangon Bersih Diterima</span>
                        <span className="text-2xl font-bold font-mono text-emerald-950">
                          {formatRupiah(taxResultDetail.netPay)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-rose-700 font-semibold block">Total Pajak Final</span>
                        <span className="text-sm font-bold font-mono text-rose-800">
                          {formatRupiah(taxResultDetail.taxAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Print and Copy Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const summary = `SIMULASI PPh 21 RESMI DJP CORETAX\n• Objek Pajak: ${djpTaxType}\n• Skema: ${djpTaxMethod}\n• Pajak Terutang: ${formatRupiah(taxResultDetail.taxAmount)}\n• Bersih Diterima: ${formatRupiah(taxResultDetail.netPay || taxResultDetail.netAnnual)}\nSimulasi dihitung via HRMS Nusantara mengacu kalkulator.pajak.go.id`;
                      navigator.clipboard.writeText(summary);
                      alert('Ringkasan simulasi pajak DJP berhasil disalin ke clipboard!');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Salin Ringkasan
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Formulir DJP</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* MODAL: AJUKAN KLAIM REIMBURSEMENT */}
      {isClaimModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsClaimModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPayslip(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="text-xs font-semibold flex items-center gap-2">
                <span>Slip Gaji Elektronik Terverifikasi (PPh 21 TER 2024)</span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  RESMI A4
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Unduh Berkas PDF */}
                <button
                  type="button"
                  onClick={handleDownloadPayslipPdf}
                  disabled={isExportingPayslip}
                  className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center shrink-0"
                  title="Unduh Berkas Digital PDF Resmi"
                  aria-label="Unduh PDF"
                >
                  {isExportingPayslip ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                </button>

                {/* Cetak Fisik Dokumen (Pencetakan Naskah Bersih Non-window.print) */}
                <button
                  type="button"
                  onClick={handlePrintPayslip}
                  disabled={isPrintingPayslip}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center shrink-0"
                  title="Cetak Fisik Dokumen Slip Gaji (Printer)"
                  aria-label="Cetak Slip Gaji"
                >
                  {isPrintingPayslip ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )}
                </button>

                {/* Kirim WhatsApp */}
                <button
                  type="button"
                  onClick={handleOpenPayslipWaModal}
                  className="p-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center justify-center shrink-0"
                  title="Kirim Rincian Slip Gaji ke WhatsApp Karyawan"
                  aria-label="Kirim WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPayslip(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1 flex items-center justify-center shrink-0"
                  title="Tutup (Esc)"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Payslip Document Body */}
            <div ref={payslipSheetRef} className="p-8 space-y-6 text-slate-800 bg-white">
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

      {/* Modal Dialog Konfirmasi Kirim WhatsApp Slip Gaji */}
      {isPayslipWaModalOpen && selectedEmployee && selectedPayslip && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsPayslipWaModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WhatsAppIcon className="w-4 h-4 text-emerald-200" />
                <h3 className="text-sm font-bold">Kirim Rincian Slip Gaji ke WhatsApp</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPayslipWaModalOpen(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Karyawan: {selectedEmployee.fullName} ({selectedEmployee.nik})</span>
                </div>
                <div className="text-[11px] text-emerald-700">
                  Periode: {selectedPayslip.period} · THP: {formatRupiah(selectedPayslip.netPay)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Tujuan
                </label>
                <input
                  type="text"
                  value={payslipWaNumber}
                  onChange={(e) => setPayslipWaNumber(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Format nomor Indonesia: 08xx atau 628xx. Pesan mencakup rincian gaji pokok, tunjangan, potongan PPh 21 TER, take home pay, dan tautan verifikasi keabsahan.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 space-y-1 max-h-32 overflow-y-auto font-mono">
                <div className="text-slate-400 text-[10px] font-sans font-semibold uppercase">Pratinjau Pesan WA:</div>
                <p className="whitespace-pre-line leading-relaxed">
                  {WhatsAppTemplates.payslip({
                    employeeName: selectedEmployee.fullName,
                    nik: selectedEmployee.nik,
                    companyName: currentTenant.name,
                    period: selectedPayslip.period,
                    thpAmount: formatRupiah(selectedPayslip.netPay),
                    pph21Amount: formatRupiah(selectedPayslip.pph21Amount),
                    basicSalary: formatRupiah(selectedPayslip.basicSalary),
                  })}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayslipWaModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendPayslipWhatsApp}
                  className="px-4 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>Kirim WhatsApp Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Slip Tunjangan Hari Raya (THR) Resmi */}
      {isThrSlipModalOpen && selectedThrEmployee && (() => {
        const emp = selectedThrEmployee;
        const targetPayDate = new Date(thrPaymentDate || '2026-03-24');
        const join = new Date(emp.joinDate || '2024-01-01');
        let months = (targetPayDate.getFullYear() - join.getFullYear()) * 12 + (targetPayDate.getMonth() - join.getMonth());
        if (targetPayDate.getDate() < join.getDate()) months -= 1;
        const tenureMonths = Math.max(0, months);
        const tenureYears = Math.floor(tenureMonths / 12);
        const remMonths = tenureMonths % 12;

        const baseWage = emp.basicSalary;
        let thrGross = 0;
        let formulaDesc = '';
        if (tenureMonths >= 12) {
          thrGross = baseWage;
          formulaDesc = '1x Upah Pokok Penuh (Masa Kerja ≥ 12 Bulan)';
        } else if (tenureMonths >= 1) {
          thrGross = Math.round((tenureMonths / 12) * baseWage);
          formulaDesc = `Prorata (${tenureMonths}/12) x Upah Pokok`;
        } else {
          thrGross = 0;
          formulaDesc = 'Masa Kerja < 1 Bulan';
        }

        const terRes = calculatePPh21TER(thrGross, (emp.ptkpStatus as PTKPStatus) || 'TK/0');
        const thrTax = terRes.taxAmount;
        const thrNet = Math.max(0, thrGross - thrTax);
        const docNo = `THR/${currentTenant.code}/${new Date().getFullYear()}/${emp.nik.slice(-4)}`;

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsThrSlipModalOpen(false);
            }}
          >
            <div
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fadeIn my-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Slip Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span>Bukti Pembayaran Tunjangan Hari Raya (THR)</span>
                  </h3>
                  <span className="text-[10px] text-slate-300 font-mono">No: {docNo}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsThrSlipModalOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Slip Body */}
              <div className="p-5 space-y-4 text-xs">
                {/* Company Letterhead mini */}
                <div className="text-center border-b border-slate-200 pb-3">
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                    {currentTenant.name}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                    Perayaan: {thrOccasion} · Batas Pembayaran: {thrPaymentDate}
                  </p>
                </div>

                {/* Employee Info */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Nama Penerima:</span>
                    <span className="font-bold text-slate-900">{emp.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">NIK & Status:</span>
                    <span className="font-mono font-bold text-slate-800">{emp.nik} · {emp.employmentType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Jabatan / Divisi:</span>
                    <span className="text-slate-800">{emp.position} ({emp.department})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Masa Kerja Efektif:</span>
                    <span className="font-semibold text-indigo-700">
                      {tenureYears > 0 ? `${tenureYears} Tahun ` : ''}{remMonths} Bulan
                    </span>
                  </div>
                </div>

                {/* Calculation Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Komponen Remunerasi</th>
                        <th className="py-2 px-3 text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-800">Gaji Pokok Acuan</span>
                          <span className="text-[10px] text-slate-400 block">Sesuai kontrak kerja aktif</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                          {formatRupiah(baseWage)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-800">Tunjangan Hari Raya (THR) Bruto</span>
                          <span className="text-[10px] text-indigo-600 block">{formulaDesc}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">
                          {formatRupiah(thrGross)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-rose-700">Potongan PPh 21 TER ({terRes.category} {terRes.ratePercent}%)</span>
                          <span className="text-[10px] text-slate-400 block">Berdasarkan PP 58/2023 & PTKP {emp.ptkpStatus || 'TK/0'}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-rose-700">
                          -{formatRupiah(thrTax)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-emerald-50 border-t border-emerald-200 text-emerald-950 font-bold">
                      <tr>
                        <td className="py-2.5 px-3">TOTAL THR BERSIH DITERIMA (TAKE HOME)</td>
                        <td className="py-2.5 px-3 text-right font-mono text-sm font-extrabold text-emerald-800">
                          {formatRupiah(thrNet)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* QR Code Keabsahan & Signature Info */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide font-bold block">
                      Tanda Tangan Elektronik Sah
                    </span>
                    <span className="text-[11px] text-slate-700 font-semibold block">
                      Finance & Remuneration Department
                    </span>
                    <span className="text-[9.5px] text-slate-400">
                      Dokumen resmi diterbitkan secara sah dan tersertifikasi sistem HRMS.
                    </span>
                  </div>
                  <div className="p-1.5 bg-white border border-slate-200 rounded-md shrink-0 shadow-2xs">
                    <QRCodeView
                      value={`https://nusantara.id/verify/thr?doc=${encodeURIComponent(docNo)}&emp=${encodeURIComponent(emp.nik)}&amt=${thrNet}`}
                      size={54}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `Halo ${emp.fullName}, berikut ringkasan Slip THR resmi Anda:\n• Dokumen: ${docNo}\n• Masa Kerja: ${tenureYears} Thn ${remMonths} Bln\n• THR Bruto: ${formatRupiah(thrGross)}\n• Potongan PPh 21 TER: ${formatRupiah(thrTax)}\n• THR Bersih: ${formatRupiah(thrNet)}\nJatuh tempo: ${thrPaymentDate}. Selamat merayakan ${thrOccasion}!`;
                      openWhatsAppChat(emp.phone || '08129876543', text);
                    }}
                    className="px-3.5 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>Kirim WA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Slip THR</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Module Document Modal: Payroll, Pajak & BPJS */}

      <ModuleDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Pusat Dokumen Resmi Payroll, Pajak & BPJS"
        categoryFilter="Payroll, Pajak & BPJS"
        defaultTemplateId="tmpl-17"
      />
    </div>
  );
};

import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  Users,
  Clock,
  Calculator,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Building2,
  Calendar,
  Briefcase,
  Plane,
  Wallet,
  Network,
  FileText,
  ShoppingCart,
  KeyRound,
  Sparkles,
  UserPlus,
  UserCheck,
  UserX,
  FileClock,
  ArrowRight,
  CheckSquare,
  Wrench,
  Receipt,
  FileSignature,
  Hourglass,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { formatRupiah } from '../../utils/taxCalculator';

interface DashboardOverviewProps {
  onOpenMigrationWizard: () => void;
  onOpenQRScanner: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onOpenMigrationWizard,
  onOpenQRScanner,
}) => {
  const {
    currentTenant,
    employees,
    attendance,
    payrollRecords,
    assets,
    procurementOrders,
    complianceRecords,
    vacancies,
    setActiveModule,
    clockIn,
    clockOut,
    onboardingProcesses,
    offboardingRecords,
    approvalItems,
    probationEvaluations,
    contractReviews,
    assetMaintenanceTickets,
    documents,
    reimbursementClaims,
    overtimeRequests,
    leaveRequests,
  } = useHrms();

  const [essClocked, setEssClocked] = useState(false);
  const [essNote, setEssNote] = useState('');
  const [activeProcessFilter, setActiveProcessFilter] = useState<
    'all' | 'kepegawaian' | 'approval' | 'payroll' | 'ga'
  >('all');

  // Employment counts
  const totalEmployees = employees.length;
  const tetapCount = employees.filter((e) => e.employmentType === 'Tetap').length;
  const kontrakCount = employees.filter((e) => e.employmentType === 'Kontrak').length;
  const outsourceCount = employees.filter((e) => e.employmentType === 'Outsource').length;
  const magangCount = employees.filter((e) => e.employmentType === 'Magang').length;

  // Attendance stats today
  const todayStr = '2026-10-17';
  const todayAttendance = attendance.filter((a) => a.date === todayStr);
  const presentCount = todayAttendance.filter((a) => a.status === 'Hadir').length;
  const lateCount = todayAttendance.filter((a) => a.status === 'Terlambat').length;
  const leaveCount = todayAttendance.filter(
    (a) => a.status === 'Izin' || a.status === 'Sakit' || a.status === 'Cuti'
  ).length;

  // Total assets value
  const totalAssetValue = assets.reduce((sum, a) => sum + a.purchasePrice, 0);

  // In-flight counts across modules
  const inProgressOnboarding = onboardingProcesses.filter((p) => p.status === 'In Progress');
  const inProgressOffboarding = offboardingRecords.filter((o) => !o.parklaringIssued);
  const pendingApprovals = approvalItems.filter((a) => a.status === 'Menunggu');
  const pendingProbations = probationEvaluations.filter(
    (p) => p.status === 'Menunggu Approval' || p.status === 'Draft'
  );
  const pendingContracts = contractReviews.filter((c) => c.status === 'Menunggu Approval');
  const activeSanctions = complianceRecords.filter((c) => c.status === 'Aktif');
  const activeProcurements = procurementOrders.filter(
    (p) => p.status === 'Pengajuan PR' || p.status === 'PO Terbit' || p.status === 'Disetujui HR/Finance'
  );
  const openGATickets = assetMaintenanceTickets.filter(
    (t) => t.status === 'Tiket Dibuka' || t.status === 'Sedang Dikerjakan GA' || t.status === 'Menunggu Sparepart'
  );

  // Total count of all active in-flight items
  const totalActiveProcesses =
    inProgressOnboarding.length +
    inProgressOffboarding.length +
    pendingApprovals.length +
    pendingProbations.length +
    pendingContracts.length +
    activeSanctions.length +
    activeProcurements.length +
    openGATickets.length;

  // Quick clock in ESS simulation
  const handleQuickClock = () => {
    if (!employees[0]) return;
    if (!essClocked) {
      clockIn(employees[0].id, essNote || 'Presensi ESS Mandiri (Webcam GPS Valid)');
      setEssClocked(true);
    } else {
      clockOut(employees[0].id, 'Clock-out Mandiri selesai bertugas');
      setEssClocked(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Tenant Welcome & Quick KPI Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
              SaaS Multi-Tenant
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">
              Paket: <strong className="text-slate-700">{currentTenant.planTier}</strong>
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
            {currentTenant.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Wilayah: {currentTenant.city} · UMR: {formatRupiah(currentTenant.umr)} · Skema: {currentTenant.workDaysPerWeek} Hari Kerja / Minggu
          </p>
        </div>

        {/* Quick Action Ribbon */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenMigrationWizard}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-semibold transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Wizard Migrasi</span>
          </button>

          <button
            onClick={onOpenQRScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-600" />
            <span>Scan QR Aset</span>
          </button>

          <button
            onClick={() => setActiveModule('payroll')}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Jalankan Payroll</span>
          </button>
        </div>
      </div>

      {/* SECTION BARU: Pusat Proses Berjalan & Pemantauan Multi-Modul (All Modules In-Flight Hub) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Hub Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs">
                <Layers className="w-4 h-4" />
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Pusat Proses Berjalan & Pemantauan Multi-Modul
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {totalActiveProcesses} Proses Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Rangkuman terpadu alur operasional yang sedang berjalan (Onboarding, Offboarding, Antrean Approval, Evaluasi Probation & Kontrak, Payroll, Sanksi, Pengadaan & GA).
            </p>
          </div>

          {/* Module Category Filters */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
            <button
              onClick={() => setActiveProcessFilter('all')}
              className={`px-2.5 py-1.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                activeProcessFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
              }`}
            >
              Semua ({totalActiveProcesses})
            </button>
            <button
              onClick={() => setActiveProcessFilter('kepegawaian')}
              className={`px-2.5 py-1.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                activeProcessFilter === 'kepegawaian'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
              }`}
            >
              Kepegawaian ({inProgressOnboarding.length + inProgressOffboarding.length + pendingProbations.length + pendingContracts.length})
            </button>
            <button
              onClick={() => setActiveProcessFilter('approval')}
              className={`px-2.5 py-1.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                activeProcessFilter === 'approval'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
              }`}
            >
              Approval ({pendingApprovals.length})
            </button>
            <button
              onClick={() => setActiveProcessFilter('payroll')}
              className={`px-2.5 py-1.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                activeProcessFilter === 'payroll'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
              }`}
            >
              Payroll & Sanksi ({activeSanctions.length + (payrollRecords.length > 0 ? 1 : 0)})
            </button>
            <button
              onClick={() => setActiveProcessFilter('ga')}
              className={`px-2.5 py-1.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                activeProcessFilter === 'ga'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
              }`}
            >
              GA & PO ({activeProcurements.length + openGATickets.length})
            </button>
          </div>
        </div>

        {/* Process Cards Grid (Responsive Mobile Card & Multi-Column Desktop) */}
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card 1: Onboarding In-Progress */}
          {(activeProcessFilter === 'all' || activeProcessFilter === 'kepegawaian') &&
            inProgressOnboarding.map((onb) => {
              const compTasks = onb.tasks.filter((t) => t.isCompleted).length;
              const totalTasks = onb.tasks.length;
              const pct = Math.round((compTasks / (totalTasks || 1)) * 100);
              return (
                <div
                  key={onb.id}
                  className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-indigo-300 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <UserPlus className="w-3 h-3" />
                        <span>Onboarding Baru</span>
                      </span>
                      <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold border border-amber-200">
                        Sedang Berjalan
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{onb.employeeName}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {onb.position} · {onb.department}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Mulai Bergabung: <strong className="text-slate-600 font-mono">{onb.joinDate}</strong>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                        <span className="text-slate-500">Checklist Onboarding</span>
                        <span className="font-bold text-indigo-700">
                          {compTasks}/{totalTasks} Tugas ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveModule('employees')}
                    className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors w-full"
                  >
                    <span>Lanjutkan Checklist Onboarding</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

          {/* Card 2: Offboarding & Exit Clearance In-Progress */}
          {(activeProcessFilter === 'all' || activeProcessFilter === 'kepegawaian') &&
            inProgressOffboarding.map((off) => {
              const emp = employees.find((e) => e.id === off.employeeId);
              const compClearance = [
                off.handoverCompleted,
                off.assetReturned,
                off.financeCleared,
                off.parklaringIssued,
              ].filter(Boolean).length;
              return (
                <div
                  key={off.id}
                  className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-rose-300 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        <UserX className="w-3 h-3" />
                        <span>Offboarding & Pesangon</span>
                      </span>
                      <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-semibold border border-rose-200">
                        Exit Clearance
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{emp?.fullName || 'Karyawan Resign'}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {off.separationType} · Efektif: {off.effectiveDate}
                    </p>
                    <div className="text-[10px] text-slate-600 font-mono mt-1 font-semibold">
                      Kompensasi/Pesangon: {formatRupiah(off.severancePay)}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                        <span className="text-slate-500">Kepatuhan Syarat Exit</span>
                        <span className="font-bold text-rose-700">{compClearance}/4 Syarat</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all"
                          style={{ width: `${(compClearance / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveModule('offboarding')}
                    className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors w-full"
                  >
                    <span>Proses Surat Parklaring & Pesangon</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

          {/* Card 3: Evaluasi Masa Percobaan (Probation H-14) */}
          {(activeProcessFilter === 'all' || activeProcessFilter === 'kepegawaian') &&
            pendingProbations.map((prob) => {
              const emp = employees.find((e) => e.id === prob.employeeId);
              const mgr = employees.find((e) => e.id === prob.supervisorId);
              return (
                <div
                  key={prob.id}
                  className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-amber-300 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        <FileClock className="w-3 h-3" />
                        <span>Evaluasi Probation (H-14)</span>
                      </span>
                      <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                        {prob.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{emp?.fullName || 'Karyawan Percobaan'}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {emp?.position} · {emp?.department}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">
                      Tanggal Evaluasi: <strong className="font-mono text-slate-900">{prob.evaluationDate}</strong>
                    </p>
                    <div className="mt-2 text-[11px] p-2 bg-amber-50/70 border border-amber-200/80 rounded text-amber-900">
                      Rekomendasi: <strong>{prob.recommendation}</strong> · Penilai: {mgr?.fullName || 'Line Manager'}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveModule('employees')}
                    className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors w-full"
                  >
                    <span>Buka Form Penilaian Karyawan Tetap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

          {/* Card 4: Review Kontrak PKWT (H-30) */}
          {(activeProcessFilter === 'all' || activeProcessFilter === 'kepegawaian') &&
            pendingContracts.map((ctr) => {
              const emp = employees.find((e) => e.id === ctr.employeeId);
              return (
                <div
                  key={ctr.id}
                  className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-blue-300 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        <FileSignature className="w-3 h-3" />
                        <span>Review PKWT (H-30)</span>
                      </span>
                      <span className="text-[10px] font-mono text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded font-bold">
                        {ctr.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{emp?.fullName || 'Karyawan Kontrak'}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {emp?.position} · {emp?.department}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">
                      Kontrak Berakhir: <strong className="font-mono text-slate-900">{ctr.currentContractEnd}</strong>
                    </p>
                    <div className="mt-2 text-[11px] p-2 bg-blue-50/70 border border-blue-200/80 rounded text-blue-900">
                      Rekomendasi: <strong>{ctr.recommendation}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveModule('employees')}
                    className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors w-full"
                  >
                    <span>Proses SK Perpanjangan / PKWTT</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

          {/* Card 5: Pusat Approval Bertingkat (Queue Item) */}
          {(activeProcessFilter === 'all' || activeProcessFilter === 'approval') &&
            pendingApprovals.slice(0, 3).map((appr) => {
              const reqEmp = employees.find((e) => e.id === appr.requesterId);
              return (
                <div
                  key={appr.id}
                  className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-emerald-300 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Approval: {appr.category}</span>
                      </span>
                      <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold border border-amber-200">
                        Menunggu Approval
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{appr.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pengaju: <strong className="text-slate-800">{reqEmp?.fullName || appr.requesterId}</strong> ({appr.department})
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      Diajukan: {appr.submittedAt} · Batas SLA: {appr.deadlineAt}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveModule('approvals')}
                    className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors w-full"
                  >
                    <span>Review & Setujui Pengajuan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

          {/* Card 6: Kepatuhan & Sanksi SP Aktif */}
          {(activeProcessFilter === 'all' || activeProcessFilter === 'payroll') &&
            activeSanctions.map((sp) => {
              const emp = employees.find((e) => e.id === sp.employeeId);
              return (
                <div
                  key={sp.id}
                  className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-red-300 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Sanksi Disiplin: {sp.level}</span>
                      </span>
                      <span className="text-[10px] font-mono text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded font-bold">
                        Aktif Mengikat
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{emp?.fullName || 'Karyawan Disanksi'}</h4>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                      Pelanggaran: {sp.violationReason}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      Masa Berlaku s/d: <strong className="text-rose-700">{sp.validUntil}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveModule('compliance')}
                    className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-700 hover:text-rose-900 transition-colors w-full"
                  >
                    <span>Kelola Berkas Sanksi & Pembinaan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

          {/* Card 7: Pengadaan Barang & Vendor PO */}
          {(activeProcessFilter === 'all' || activeProcessFilter === 'ga') &&
            activeProcurements.map((po) => (
              <div
                key={po.id}
                className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-orange-300 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                      <ShoppingCart className="w-3 h-3" />
                      <span>Procurement: {po.prNumber}</span>
                    </span>
                    <span className="text-[10px] font-mono text-orange-800 bg-orange-100 px-1.5 py-0.5 rounded font-bold">
                      {po.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900">{po.itemName}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Vendor: <strong className="text-slate-800">{po.vendorName}</strong>
                  </p>
                  <p className="text-[10px] text-slate-600 font-mono mt-1 font-semibold">
                    Nilai Estimasi: {formatRupiah(po.estimatedCost)}
                  </p>
                </div>

                <button
                  onClick={() => setActiveModule('procurement')}
                  className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-orange-700 hover:text-orange-900 transition-colors w-full"
                >
                  <span>Pantau PO & Faktur Vendor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

          {/* Card 8: GA Perbaikan Fasilitas & Mutasi */}
          {(activeProcessFilter === 'all' || activeProcessFilter === 'ga') &&
            openGATickets.map((tkt) => (
              <div
                key={tkt.id}
                className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-cyan-300 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
                      <Wrench className="w-3 h-3" />
                      <span>Fasilitas: {tkt.ticketNumber}</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-800 bg-cyan-100 px-1.5 py-0.5 rounded font-bold">
                      {tkt.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900">{tkt.assetName}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Kendala: {tkt.description}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    Prioritas: <strong className="text-slate-700">{tkt.priority}</strong> · Dilaporkan: {tkt.reportedAt}
                  </p>
                </div>

                <button
                  onClick={() => setActiveModule('assets')}
                  className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-cyan-700 hover:text-cyan-900 transition-colors w-full"
                >
                  <span>Tindak Lanjuti Perbaikan GA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

          {/* Fallback if no processes in filtered category */}
          {totalActiveProcesses === 0 && (
            <div className="col-span-full p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-xs">
              Tidak ada proses aktif yang memerlukan tindakan saat ini. Seluruh alur kerja operasional telah selesai diproses.
            </div>
          )}
        </div>
      </div>

      {/* Enterprise Feature Quick-Access Hub */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-xl p-4 sm:p-5 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-indigo-800/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Pusat Modul & Fitur NusaHR Enterprise
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  v2026 Aktif
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80">
                Akses cepat langsung ke seluruh modul baru yang dikonfigurasikan sesuai kebutuhan perusahaan.
              </p>
            </div>
          </div>
          <span className="text-[11px] text-indigo-300/80 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md self-start sm:self-auto font-mono">
            10 Modul Terintegrasi
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Card 1: Personalia */}
          <button
            onClick={() => setActiveModule('personalia')}
            className="flex flex-col items-start p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left group hover:border-indigo-400/50"
          >
            <div className="flex items-center gap-2 mb-1.5 text-indigo-300 group-hover:text-indigo-200">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold text-white group-hover:text-indigo-200">Personalia</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              Promosi, demosi, mutasi, penyesuaian gaji, SK nomor resmi.
            </p>
          </button>

          {/* Card 2: Approval Bertingkat */}
          <button
            onClick={() => setActiveModule('approvals')}
            className="flex flex-col items-start p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left group hover:border-indigo-400/50"
          >
            <div className="flex items-center gap-2 mb-1.5 text-emerald-300 group-hover:text-emerald-200">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold text-white group-hover:text-emerald-200">Pusat Approval</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              Multi-list batch approve, delegasi pengganti, SLA batas waktu.
            </p>
          </button>

          {/* Card 3: Perjalanan Dinas */}
          <button
            onClick={() => setActiveModule('trips')}
            className="flex flex-col items-start p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left group hover:border-indigo-400/50"
          >
            <div className="flex items-center gap-2 mb-1.5 text-sky-300 group-hover:text-sky-200">
              <Plane className="w-4 h-4" />
              <span className="text-xs font-bold text-white group-hover:text-sky-200">Perjalanan Dinas</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              Pengajuan SPPD, tiket, hotel, estimasi uang saku & realisasi.
            </p>
          </button>

          {/* Card 4: Pinjaman & Kasbon */}
          <button
            onClick={() => setActiveModule('loans')}
            className="flex flex-col items-start p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left group hover:border-indigo-400/50"
          >
            <div className="flex items-center gap-2 mb-1.5 text-amber-300 group-hover:text-amber-200">
              <Wallet className="w-4 h-4" />
              <span className="text-xs font-bold text-white group-hover:text-amber-200">Simulasi Pinjaman</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              Kalkulator bunga, tenor cicilan & auto-potong payroll.
            </p>
          </button>

          {/* Card 5: Rekrutmen & Offering */}
          <button
            onClick={() => setActiveModule('recruitment')}
            className="flex flex-col items-start p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left group hover:border-indigo-400/50"
          >
            <div className="flex items-center gap-2 mb-1.5 text-purple-300 group-hover:text-purple-200">
              <UserPlus className="w-4 h-4" />
              <span className="text-xs font-bold text-white group-hover:text-purple-200">Offering Letter</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              Kalkulator Net THP / Gross + TER PPh 21 & checklist benefit.
            </p>
          </button>

          {/* Card 6: Struktur Org Tree */}
          <button
            onClick={() => setActiveModule('employees')}
            className="flex flex-col items-start p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left group hover:border-indigo-400/50"
          >
            <div className="flex items-center gap-2 mb-1.5 text-teal-300 group-hover:text-teal-200">
              <Network className="w-4 h-4" />
              <span className="text-xs font-bold text-white group-hover:text-teal-200">Struktur Org Tree</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              Bagan pohon posisi, evaluasi probation H-14, PKWT H-30.
            </p>
          </button>

          {/* Card 7: Presensi ESS/MSS */}
          <button
            onClick={() => setActiveModule('attendance')}
            className="flex flex-col items-start p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left group hover:border-indigo-400/50"
          >
            <div className="flex items-center gap-2 mb-1.5 text-rose-300 group-hover:text-rose-200">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold text-white group-hover:text-rose-200">Presensi & Shift</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              Dashboard Atasan & HR, koreksi absen, lembur, cuti & roster.
            </p>
          </button>

          {/* Card 8: Procurement */}
          <button
            onClick={() => setActiveModule('procurement')}
            className="flex flex-col items-start p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left group hover:border-indigo-400/50"
          >
            <div className="flex items-center gap-2 mb-1.5 text-orange-300 group-hover:text-orange-200">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-xs font-bold text-white group-hover:text-orange-200">Procurement & PO</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              Vendor, RFQ, PO pengadaan proyek/barang, faktur AP.
            </p>
          </button>

          {/* Card 9: GA & Aset QR */}
          <button
            onClick={() => setActiveModule('assets')}
            className="flex flex-col items-start p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left group hover:border-indigo-400/50"
          >
            <div className="flex items-center gap-2 mb-1.5 text-cyan-300 group-hover:text-cyan-200">
              <QrCode className="w-4 h-4" />
              <span className="text-xs font-bold text-white group-hover:text-cyan-200">GA & Fasilitas</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              Peminjaman ruang meeting, mutasi aset, tiket perbaikan.
            </p>
          </button>

          {/* Card 10: Dokumen Legal & DOCX */}
          <button
            onClick={() => setActiveModule('documents')}
            className="flex flex-col items-start p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left group hover:border-indigo-400/50"
          >
            <div className="flex items-center gap-2 mb-1.5 text-indigo-300 group-hover:text-indigo-200">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-bold text-white group-hover:text-indigo-200">Dokumen Legal</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              Upload template DOCX, nomor otomatis & TTD barcode QR UU ITE.
            </p>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Single-Elevation, High Density) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Karyawan Aktif</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalEmployees}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
            <span>Tetap: <strong className="text-slate-700 font-mono">{tetapCount}</strong></span>
            <span>·</span>
            <span>Kontrak: <strong className="text-slate-700 font-mono">{kontrakCount}</strong></span>
            <span>·</span>
            <span>Outsource: <strong className="text-slate-700 font-mono">{outsourceCount}</strong></span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Presensi Hari Ini</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {presentCount + lateCount} / {totalEmployees}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
            <span className="text-emerald-700 font-semibold font-mono">{presentCount} Tepat Waktu</span>
            <span>·</span>
            <span className="text-amber-700 font-semibold font-mono">{lateCount} Terlambat</span>
            <span>·</span>
            <span className="text-slate-600 font-mono">{leaveCount} Izin/Cuti</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Valuasi Aset GA</span>
            <Building2 className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums truncate">
            {formatRupiah(totalAssetValue)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            <strong className="text-slate-800 font-mono">{assets.length} Unit Aset</strong> terdaftar dengan label QR terverifikasi.
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Kepatuhan & Pengadaan</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {complianceRecords.length} SP
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {procurementOrders.filter((p) => p.status === 'PO Terbit').length} PO Pengadaan Berjalan · {vacancies.length} Lowongan
          </div>
        </div>
      </div>

      {/* 2-Column Split: Interactive ESS Quick Punch + Department Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ESS Punch Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Presensi Mandiri ESS
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono">
                Live Terminal
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Simulasi presensi karyawan mandiri (Employee Self-Service) dengan geolocation & timestamp instan.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Akun:</span>
                <span className="font-semibold text-slate-800">{employees[0]?.fullName || 'Karyawan'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Server:</span>
                <span className="font-mono text-slate-800 font-medium">08:24:19 WIB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lokasi:</span>
                <span className="text-emerald-700 font-medium">Dalam Radius Kantor Pusat (12m)</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Catatan Presensi (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: WFO Lantai 18 / Tugas Luar"
                value={essNote}
                onChange={(e) => setEssNote(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleQuickClock}
            className={`w-full mt-5 py-2.5 px-4 rounded-md text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 ${
              !essClocked
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{!essClocked ? 'Clock-In Masuk (08:24)' : 'Clock-Out Pulang'}</span>
          </button>
        </div>

        {/* Workforce Breakdown & Responsive Cards / Horizontal Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Distribusi Komposisi Tenaga Kerja
              </h3>
              <p className="text-xs text-slate-500">
                Perbandingan status hubungan kerja (PKWTT, PKWT, Outsource, Magang)
              </p>
            </div>
            <button
              onClick={() => setActiveModule('employees')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Kelola Personalia →
            </button>
          </div>

          {/* Progress bar visual */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex mb-4">
            <div
              style={{ width: `${(tetapCount / (totalEmployees || 1)) * 100}%` }}
              className="bg-indigo-600 h-full"
              title={`Tetap: ${tetapCount}`}
            />
            <div
              style={{ width: `${(kontrakCount / (totalEmployees || 1)) * 100}%` }}
              className="bg-sky-500 h-full"
              title={`Kontrak: ${kontrakCount}`}
            />
            <div
              style={{ width: `${(outsourceCount / (totalEmployees || 1)) * 100}%` }}
              className="bg-amber-500 h-full"
              title={`Outsource: ${outsourceCount}`}
            />
            <div
              style={{ width: `${(magangCount / (totalEmployees || 1)) * 100}%` }}
              className="bg-emerald-500 h-full"
              title={`Magang: ${magangCount}`}
            />
          </div>

          {/* Responsive Mobile Cards for Small Screens (< md) */}
          <div className="md:hidden space-y-2.5">
            {employees.slice(0, 4).map((emp) => (
              <div
                key={emp.id}
                onClick={() => setActiveModule('employees')}
                className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-slate-100/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{emp.fullName}</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {emp.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {emp.position} · {emp.department}
                </div>
                <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-200/60 font-mono">
                  <span className="text-slate-600 font-semibold">{emp.employmentType}</span>
                  <span className="font-bold text-slate-900">{formatRupiah(emp.basicSalary)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/Tablet Horizontal Table (>= md) */}
          <div className="hidden md:block border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[500px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Nama & NIK</th>
                  <th className="py-2.5 px-3 font-semibold">Departemen</th>
                  <th className="py-2.5 px-3 font-semibold">Tipe Kerja</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Gaji Pokok</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.slice(0, 4).map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-900">{emp.fullName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{emp.nik}</div>
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      <div>{emp.position}</div>
                      <div className="text-[10px] text-slate-500">{emp.department}</div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-slate-800 font-medium">{emp.employmentType}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-800">
                      {formatRupiah(emp.basicSalary)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-[11px] font-semibold text-emerald-700">
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};


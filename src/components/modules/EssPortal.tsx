import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  UserCheck,
  Calendar,
  Clock,
  FilePlus,
  Receipt,
  FileText,
  CheckCircle2,
  AlertCircle,
  Camera,
  Send,
  Plane,
  Wallet,
  Check,
  X,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  Info,
  MapPin,
} from 'lucide-react';
import { ScrollableTabNav } from '../common/ScrollableTabNav';
import { formatRupiah } from '../../utils/taxCalculator';
import { CurrencyInput } from '../common/CurrencyInput';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { REIMBURSEMENT_CATEGORIES, ReimbursementCategory } from '../../types/hrms';

export const EssPortal: React.FC = () => {
  const {
    employees,
    currentUser,
    calendarEvents,
    leaveRequests,
    submitLeaveRequest,
    loans,
    addLoan,
    clockIn,
    clockOut,
    moduleSettings,
    officeLocations,
    reimbursementClaims,
    addReimbursementClaim,
    overtimeRequests,
    submitOvertimeRequest,
    attendanceCorrections,
    submitAttendanceCorrection,
    businessTrips,
    submitBusinessTrip,
    payrollRecords,
    documents,
  } = useHrms();

  // Find the logged-in employee profile (fallback to first employee)
  const currentEmp =
    employees.find((e) => e.id === currentUser?.employeeId) ||
    employees[0] || {
      id: 'emp-001',
      fullName: 'Ahmad Fauzi',
      nik: 'EMP-2024-001',
      department: 'Technology & Engineering',
      position: 'Senior Software Engineer',
      salary: 14500000,
      joinDate: '2023-01-15',
      employeeStatus: 'Tetap (PKWTT)',
      annualLeaveBalance: 12,
    };

  const [activeTab, setActiveTab] = useState<'form' | 'status' | 'slip' | 'presensi'>('form');
  const [submissionCategory, setSubmissionCategory] = useState<
    'cuti' | 'lembur' | 'koreksi_presensi' | 'reimburse' | 'sppd' | 'kasbon'
  >('cuti');

  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [clockEmpId, setClockEmpId] = useState(currentEmp.id || employees[0]?.id || '');
  const [selectedClockLocationId, setSelectedClockLocationId] = useState<string>('');
  const [simulatedDistanceMeters, setSimulatedDistanceMeters] = useState<number>(18);
  const gpsRadius = moduleSettings?.attendance?.gpsRadiusMeters || 100;

  const selectedClockEmployee = employees.find((e) => e.id === clockEmpId) || currentEmp;
  const assignedClockLocations = (() => {
    const matched = officeLocations.filter(
      (loc) => loc.isActive && selectedClockEmployee?.officeLocationIds?.includes(loc.id)
    );
    if (matched.length > 0) return matched;
    return officeLocations.filter((loc) => loc.isActive).slice(0, 1);
  })();

  const activeClockLocation =
    assignedClockLocations.find((loc) => loc.id === selectedClockLocationId) ||
    assignedClockLocations[0] ||
    officeLocations[0];
  const activeLocationRadius = activeClockLocation?.radiusMeters || gpsRadius;
  const isWithinRadius = simulatedDistanceMeters <= activeLocationRadius;

  // Forms State
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Cuti Tahunan' as
      | 'Cuti Tahunan'
      | 'Sakit Tanpa Surat Dokter'
      | 'Sakit dengan Surat Dokter'
      | 'Cuti Menikah'
      | 'Cuti Melahirkan'
      | 'Izin Urusan Pribadi',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    totalDays: 1,
    reason: '',
  });

  const [overtimeForm, setOvertimeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '21:00',
    totalHours: 3,
    taskDescription: '',
  });

  const [attendanceCorrectionForm, setAttendanceCorrectionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    correctionType: 'Lupa Absen Masuk',
    actualTime: '08:30',
    reason: '',
  });

  const [reimburseForm, setReimburseForm] = useState({
    category: 'Transportasi Dinas' as ReimbursementCategory,
    amount: 150000,
    receiptNo: '',
    description: '',
  });

  const [sppdForm, setSppdForm] = useState({
    destination: 'Surabaya, Jawa Timur',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    purpose: 'Kunjungan Klien & Implementasi Server On-Premise',
    estimatedBudget: 2500000,
  });

  const [kasbonForm, setKasbonForm] = useState({
    amount: 2000000,
    tenorMonths: 3,
    reason: 'Kebutuhan darurat renovasi atap rumah',
  });

  // Local state for submitted self-service items history
  const [myRequests, setMyRequests] = useState<Array<{
    id: string;
    category: string;
    title: string;
    date: string;
    status: 'Menunggu Persetujuan Atasan' | 'Disetujui' | 'Ditolak';
    detail: string;
    amount?: number;
  }>>([
    {
      id: 'req-01',
      category: 'Cuti Tahunan',
      title: 'Permohonan Cuti Tahunan',
      date: '2026-05-12',
      status: 'Disetujui',
      detail: '2 Hari (12-13 Mei 2026) - Keperluan keluarga',
    },
    {
      id: 'req-02',
      category: 'Klaim Reimbursement',
      title: 'Transport Taksi Bandara SPPD',
      date: '2026-05-02',
      status: 'Menunggu Persetujuan Atasan',
      detail: 'Kwitansi #TX-8820 - Klaim transportasi bandara CGK',
      amount: 185000,
    },
    {
      id: 'req-03',
      category: 'Lembur',
      title: 'Lembur Deployment Release v2.4',
      date: '2026-04-28',
      status: 'Disetujui',
      detail: '3 Jam (18:00 - 21:00) - Hotfix database migration',
    },
  ]);

  // Handle Leave Submission
  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) {
      alert('Alasan cuti wajib diisi.');
      return;
    }

    submitLeaveRequest({
      employeeId: currentEmp.id,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      totalDays: Number(leaveForm.totalDays),
      reason: leaveForm.reason.trim(),
    });


    const newReq = {
      id: `req-${Date.now().toString().slice(-4)}`,
      category: leaveForm.leaveType,
      title: `Pengajuan ${leaveForm.leaveType}`,
      date: leaveForm.startDate,
      status: 'Menunggu Persetujuan Atasan' as const,
      detail: `${leaveForm.totalDays} Hari (${leaveForm.startDate} s/d ${leaveForm.endDate}) - ${leaveForm.reason}`,
    };

    setMyRequests([newReq, ...myRequests]);
    setNoticeMessage(`Permohonan ${leaveForm.leaveType} Anda berhasil diajukan ke atasan langsung.`);
    setLeaveForm({
      leaveType: 'Cuti Tahunan',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      totalDays: 1,
      reason: '',
    });
    setActiveTab('status');
  };

  // Handle Overtime Submission
  const handleSubmitOvertime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overtimeForm.taskDescription.trim()) {
      alert('Uraian tugas lembur wajib diisi.');
      return;
    }


    const newReq = {
      id: `req-${Date.now().toString().slice(-4)}`,
      category: 'Lembur',
      title: `Pengajuan Lembur (${overtimeForm.totalHours} Jam)`,
      date: overtimeForm.date,
      status: 'Menunggu Persetujuan Atasan' as const,
      detail: `${overtimeForm.date} (${overtimeForm.startTime} - ${overtimeForm.endTime}) - ${overtimeForm.taskDescription}`,
    };

    setMyRequests([newReq, ...myRequests]);
    const [startH, startM] = overtimeForm.startTime.split(':').map(Number);
    const [endH, endM] = overtimeForm.endTime.split(':').map(Number);
    const computedHours = Math.max(
      1,
      Math.round(((endH * 60 + (endM || 0) - (startH * 60 + (startM || 0))) / 60) * 10) / 10
    );
    submitOvertimeRequest({
      employeeId: currentEmp.id,
      date: overtimeForm.date,
      startTime: overtimeForm.startTime,
      endTime: overtimeForm.endTime,
      hours: computedHours || Number(overtimeForm.totalHours) || 3,
      reason: overtimeForm.taskDescription.trim(),
      type: 'Pengajuan Karyawan',
      compensationType: 'Lembur Berbayar',
    });
    setNoticeMessage('Pengajuan lembur berhasil dikirim ke atasan langsung.');
    setOvertimeForm({
      date: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '21:00',
      totalHours: 3,
      taskDescription: '',
    });
    setActiveTab('status');
  };

  // Handle Attendance Correction Submission
  const handleSubmitAttendanceCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceCorrectionForm.reason.trim()) {
      alert('Alasan koreksi presensi wajib diisi.');
      return;
    }


    const newReq = {
      id: `req-${Date.now().toString().slice(-4)}`,
      category: 'Koreksi Presensi',
      title: `Perbaikan Presensi: ${attendanceCorrectionForm.correctionType}`,
      date: attendanceCorrectionForm.date,
      status: 'Menunggu Persetujuan Atasan' as const,
      detail: `Tanggal: ${attendanceCorrectionForm.date} Jam: ${attendanceCorrectionForm.actualTime} - ${attendanceCorrectionForm.reason}`,
    };

    setMyRequests([newReq, ...myRequests]);
    const isOut =
      attendanceCorrectionForm.correctionType.toLowerCase().includes('pulang') ||
      attendanceCorrectionForm.correctionType.toLowerCase().includes('out');
    submitAttendanceCorrection({
      employeeId: currentEmp.id,
      date: attendanceCorrectionForm.date,
      type: (attendanceCorrectionForm.correctionType === 'Lupa Clock-in Masuk'
        ? 'Lupa Absen Masuk'
        : attendanceCorrectionForm.correctionType === 'Lupa Clock-out Pulang'
        ? 'Lupa Absen Pulang'
        : attendanceCorrectionForm.correctionType) as any,
      proposedClockIn: isOut ? '08:00' : attendanceCorrectionForm.actualTime,
      proposedClockOut: isOut ? attendanceCorrectionForm.actualTime : '17:00',
      reason: attendanceCorrectionForm.reason.trim(),
    });
    setNoticeMessage('Pengajuan koreksi presensi berhasil diajukan ke atasan.');
    setAttendanceCorrectionForm({
      date: new Date().toISOString().split('T')[0],
      correctionType: 'Lupa Absen Masuk',
      actualTime: '08:30',
      reason: '',
    });
    setActiveTab('status');
  };

  // Handle Reimbursement Submission
  const handleSubmitReimburse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reimburseForm.description.trim()) {
      alert('Keterangan klaim wajib diisi.');
      return;
    }


    const newReq = {
      id: `req-${Date.now().toString().slice(-4)}`,
      category: 'Klaim Reimbursement',
      title: `Klaim: ${reimburseForm.category}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Menunggu Persetujuan Atasan' as const,
      detail: `No Bukti: ${reimburseForm.receiptNo || '-'} - ${reimburseForm.description}`,
      amount: reimburseForm.amount,
    };

    setMyRequests([newReq, ...myRequests]);
    const todayStr = new Date().toISOString().split('T')[0];
    addReimbursementClaim({
      employeeId: currentEmp.id,
      category: reimburseForm.category as ReimbursementCategory,
      claimDate: todayStr,
      receiptDate: todayStr,
      receiptNumber: reimburseForm.receiptNo.trim() || `NOTA-${Date.now().toString().slice(-4)}`,
      amount: Number(reimburseForm.amount),
      description: reimburseForm.description.trim(),
      processInPayroll: true,
    });
    setNoticeMessage(`Klaim reimbursement ${formatRupiah(reimburseForm.amount)} berhasil dikirimkan.`);
    setReimburseForm({
      category: 'Transportasi Dinas' as ReimbursementCategory,
      amount: 150000,
      receiptNo: '',
      description: '',
    });
    setActiveTab('status');
  };

  // Handle Kasbon Submission
  const handleSubmitKasbon = (e: React.FormEvent) => {
    e.preventDefault();
    if (addLoan) {
      addLoan({
        employeeId: currentEmp.id,
        loanType: 'Kasbon Darurat',
        totalAmount: kasbonForm.amount,
        tenorMonths: kasbonForm.tenorMonths,
        monthlyInstallment: Math.round(kasbonForm.amount / kasbonForm.tenorMonths),
        startDate: new Date().toISOString().split('T')[0],
        reason: kasbonForm.reason,
      });
    }


    const newReq = {
      id: `req-${Date.now().toString().slice(-4)}`,
      category: 'Pinjaman & Kasbon',
      title: `Pengajuan Kasbon Karyawan`,
      date: new Date().toISOString().split('T')[0],
      status: 'Menunggu Persetujuan Atasan' as const,
      detail: `Tenor ${kasbonForm.tenorMonths} Bulan - ${kasbonForm.reason}`,
      amount: kasbonForm.amount,
    };

    setMyRequests([newReq, ...myRequests]);
    setNoticeMessage(`Pengajuan kasbon ${formatRupiah(kasbonForm.amount)} berhasil diajukan.`);
    setActiveTab('status');
  };

  const jointHolidaysCount = calendarEvents.filter((c) => c.deductsLeaveBucket).length;
  const baseLeaveBalance = (currentEmp as any).remainingLeaveDays ?? currentEmp.annualLeaveBalance ?? 12;
  const remainingLeave = Math.max(0, baseLeaveBalance - jointHolidaysCount);
  const currentMonthOvertimeHours = overtimeRequests
    .filter((o) => o.employeeId === currentEmp.id && o.status === 'Disetujui')
    .reduce((sum, o) => sum + (o.approvedHours ?? o.hours ?? 0), 0);

  const allMyLiveRequests = [
    ...leaveRequests
      .filter((l) => l.employeeId === currentEmp.id)
      .map((l) => ({
        id: l.id,
        category: l.leaveType,
        title: `Permohonan ${l.leaveType}`,
        date: l.startDate,
        status: (l.status === 'Disetujui'
          ? 'Disetujui'
          : l.status === 'Ditolak'
          ? 'Ditolak'
          : 'Menunggu Persetujuan Atasan') as 'Menunggu Persetujuan Atasan' | 'Disetujui' | 'Ditolak',
        detail: `${l.totalDays} Hari (${l.startDate} s/d ${l.endDate}) - ${l.reason}`,
        amount: undefined as number | undefined,
      })),
    ...overtimeRequests
      .filter((o) => o.employeeId === currentEmp.id)
      .map((o) => ({
        id: o.id,
        category: 'Lembur',
        title: `Pengajuan Lembur (${o.approvedHours ?? o.hours} Jam)`,
        date: o.date,
        status: (o.status === 'Disetujui'
          ? 'Disetujui'
          : o.status === 'Ditolak'
          ? 'Ditolak'
          : 'Menunggu Persetujuan Atasan') as 'Menunggu Persetujuan Atasan' | 'Disetujui' | 'Ditolak',
        detail: `${o.date} (${o.startTime} - ${o.endTime}) - ${o.reason}`,
        amount: undefined as number | undefined,
      })),
    ...attendanceCorrections
      .filter((c) => c.employeeId === currentEmp.id)
      .map((c) => ({
        id: c.id,
        category: 'Koreksi Presensi',
        title: `Perbaikan Presensi: ${c.type}`,
        date: c.date,
        status: (c.status === 'Disetujui'
          ? 'Disetujui'
          : c.status === 'Ditolak'
          ? 'Ditolak'
          : 'Menunggu Persetujuan Atasan') as 'Menunggu Persetujuan Atasan' | 'Disetujui' | 'Ditolak',
        detail: `Tanggal: ${c.date} (${c.proposedClockIn || '-'} - ${c.proposedClockOut || '-'}) - ${c.reason}`,
        amount: undefined as number | undefined,
      })),
    ...reimbursementClaims
      .filter((c) => c.employeeId === currentEmp.id)
      .map((c) => ({
        id: c.claimNumber,
        category: 'Klaim Reimbursement',
        title: `Klaim: ${c.category}`,
        date: c.receiptDate || c.claimDate || '-',
        status: (c.status === 'Disetujui' || c.status === 'Dibayar (Payroll)'
          ? 'Disetujui'
          : c.status === 'Ditolak'
          ? 'Ditolak'
          : 'Menunggu Persetujuan Atasan') as 'Menunggu Persetujuan Atasan' | 'Disetujui' | 'Ditolak',
        detail: `No Bukti: ${c.receiptNumber || '-'} - ${c.description}${c.processInPayroll ? ' (Disertakan ke Payroll)' : ''}`,
        amount: c.amount as number | undefined,
      })),
    ...businessTrips
      .filter((t) => t.employeeId === currentEmp.id)
      .map((t) => ({
        id: t.tripNumber || t.id,
        category: 'Perjalanan Dinas',
        title: `SPPD ke ${t.destinationCity}`,
        date: t.startDate,
        status: (t.status === 'Disetujui Atasan' || t.status === 'Disetujui Finance' || t.status === 'Selesai'
          ? 'Disetujui'
          : t.status === 'Ditolak'
          ? 'Ditolak'
          : 'Menunggu Persetujuan Atasan') as 'Menunggu Persetujuan Atasan' | 'Disetujui' | 'Ditolak',
        detail: `${t.totalDays} Hari (${t.startDate} s/d ${t.endDate}) - ${t.purpose}`,
        amount: t.estimatedCost as number | undefined,
      })),
    ...loans
      .filter((ln) => ln.employeeId === currentEmp.id)
      .map((ln) => ({
        id: ln.id,
        category: 'Pinjaman & Kasbon',
        title: `Pengajuan ${ln.loanType}`,
        date: ln.startDate,
        status: (ln.status === 'Aktif' || ln.status === 'Lunas'
          ? 'Disetujui'
          : ln.status === 'Ditolak'
          ? 'Ditolak'
          : 'Menunggu Persetujuan Atasan') as 'Menunggu Persetujuan Atasan' | 'Disetujui' | 'Ditolak',
        detail: `Tenor ${ln.tenorMonths} Bulan - ${ln.reason}`,
        amount: ln.totalAmount as number | undefined,
      })),
  ];

  const latestPayroll = payrollRecords
    .filter((p) => p.employeeId === currentEmp.id)
    .sort((a, b) => (b.period || '').localeCompare(a.period || ''))[0];
  const empDocuments = documents.filter((d) => d.targetEmployeeId === currentEmp.id);

  return (
    <div className="space-y-5">
      {/* Module Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200">
              Portal ESS
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              ESS (Employee Self-Service)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Layanan mandiri karyawan: Ajukan cuti, lembur, perbaikan presensi, klaim pengeluaran, slip gaji, dan cek status persetujuan secara real-time.
          </p>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
            {currentEmp.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-900 leading-tight">{currentEmp.fullName}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              {currentEmp.nik} · {currentEmp.department}
            </div>
          </div>
        </div>
      </div>

      {noticeMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
          <button onClick={() => setNoticeMessage(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* Quick Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Sisa Cuti Tersedia</div>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">{remainingLeave} Hari</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dari hak awal {currentEmp.annualLeaveBalance || 12} hari</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Cuti Bersama Terpotong</div>
          <div className="text-xl font-bold text-blue-600 mt-0.5">{jointHolidaysCount} Hari</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Bucket 1 Otomatis</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Lembur Bulan Berjalan</div>
          <div className="text-xl font-bold text-indigo-600 mt-0.5">{currentMonthOvertimeHours.toFixed(1)} Jam</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Siap dihitung di payroll</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Pengajuan Menunggu</div>
          <div className="text-xl font-bold text-amber-600 mt-0.5">
            {allMyLiveRequests.filter((r) => r.status.includes('Menunggu')).length} Berkas
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dalam proses review</div>
        </div>
      </div>

      {/* Row 2: Standard Enterprise Scrollable Tab Navigation (With Icons) */}
      <ScrollableTabNav>
        <button
          onClick={() => setActiveTab('form')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'form'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FilePlus className="w-4 h-4" />
          <span>Form Pengajuan Mandiri</span>
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'status'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Status & Riwayat Pengajuan Saya</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'status'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {allMyLiveRequests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('slip')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'slip'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Slip Gaji & Dokumen Saya</span>
        </button>

        <button
          onClick={() => setActiveTab('presensi')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'presensi'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>ESS Clock-In (GPS)</span>
        </button>
      </ScrollableTabNav>

      {/* TAB 1: FORM PENGAJUAN MANDIRI */}
      {activeTab === 'form' && (
        <div className="space-y-4">
          {/* Category Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'cuti', label: 'Pengajuan Cuti', icon: Calendar },
              { id: 'lembur', label: 'Pengajuan Lembur', icon: Clock },
              { id: 'koreksi_presensi', label: 'Perbaikan Presensi', icon: CheckCircle2 },
              { id: 'reimburse', label: 'Klaim Reimbursement', icon: Receipt },
              { id: 'sppd', label: 'Perjalanan Dinas (SPPD)', icon: Plane },
              { id: 'kasbon', label: 'Pinjaman & Kasbon', icon: Wallet },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSubmissionCategory(id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  submissionCategory === id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Form 1: Cuti */}
          {submissionCategory === 'cuti' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs max-w-2xl">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Formulir Permohonan Cuti Karyawan</h3>
              </div>

              <form onSubmit={handleSubmitLeave} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Jenis Cuti / Izin Sakit *</label>
                    <select
                      value={leaveForm.leaveType}
                      onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Cuti Tahunan">Cuti Tahunan (Sisa: {remainingLeave} hari)</option>
                      <option value="Sakit Tanpa Surat Dokter">Sakit Tanpa Surat Dokter</option>
                      <option value="Sakit dengan Surat Dokter">Sakit dengan Surat Dokter</option>
                      <option value="Cuti Menikah">Cuti Menikah (3 Hari)</option>
                      <option value="Cuti Melahirkan">Cuti Melahirkan (3 Bulan)</option>
                      <option value="Izin Urusan Pribadi">Izin Urusan Pribadi</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Total Durasi (Hari) *</label>
                    <input
                      type="number"
                      min={1}
                      max={remainingLeave || 12}
                      value={leaveForm.totalDays}
                      onChange={(e) => setLeaveForm({ ...leaveForm, totalDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tanggal Mulai Cuti *</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tanggal Selesai Cuti *</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Alasan Pengajuan Cuti *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Uraikan keperluan cuti Anda secara singkat dan jelas..."
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Permohonan Cuti</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Form 2: Lembur */}
          {submissionCategory === 'lembur' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs max-w-2xl">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Formulir Pengajuan Lembur Mandiri</h3>
              </div>

              <form onSubmit={handleSubmitOvertime} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tanggal Lembur *</label>
                    <input
                      type="date"
                      required
                      value={overtimeForm.date}
                      onChange={(e) => setOvertimeForm({ ...overtimeForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Jam Mulai *</label>
                    <input
                      type="time"
                      required
                      value={overtimeForm.startTime}
                      onChange={(e) => setOvertimeForm({ ...overtimeForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Jam Selesai *</label>
                    <input
                      type="time"
                      required
                      value={overtimeForm.endTime}
                      onChange={(e) => setOvertimeForm({ ...overtimeForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Uraian Tugas & Deliverable Output Lembur *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Jelaskan pekerjaan lembur yang diselesaikan..."
                    value={overtimeForm.taskDescription}
                    onChange={(e) => setOvertimeForm({ ...overtimeForm, taskDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ajukan Jam Lembur</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Form 3: Koreksi Presensi */}
          {submissionCategory === 'koreksi_presensi' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs max-w-2xl">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Formulir Koreksi Presensi (Lupa Clock-in / Out)</h3>
              </div>

              <form onSubmit={handleSubmitAttendanceCorrection} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tanggal Absensi *</label>
                    <input
                      type="date"
                      required
                      value={attendanceCorrectionForm.date}
                      onChange={(e) => setAttendanceCorrectionForm({ ...attendanceCorrectionForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Kategori Masalah *</label>
                    <select
                      value={attendanceCorrectionForm.correctionType}
                      onChange={(e) => setAttendanceCorrectionForm({ ...attendanceCorrectionForm, correctionType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Lupa Absen Masuk">Lupa Absen Masuk (Clock-in)</option>
                      <option value="Lupa Absen Pulang">Lupa Absen Pulang (Clock-out)</option>
                      <option value="Koreksi Jam">Koreksi Jam / Kendala GPS</option>
                      <option value="Izin Datang Terlambat">Izin Datang Terlambat</option>
                      <option value="Izin Pulang Cepat">Izin Pulang Cepat</option>
                      <option value="Lupa Clock-out Pulang">Lupa Clock-out Pulang</option>
                      <option value="Kendala GPS / Jaringan">Kendala GPS / Error Jaringan</option>
                      <option value="Dinas Luar Mendadak">Dinas Luar Mendadak</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Jam Kehadiran Sebenarnya *</label>
                    <input
                      type="time"
                      required
                      value={attendanceCorrectionForm.actualTime}
                      onChange={(e) => setAttendanceCorrectionForm({ ...attendanceCorrectionForm, actualTime: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Alasan / Bukti Pendukung *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Contoh: Menghadiri meeting pagi dengan klien di luar kantor sebelum jam 09:00..."
                    value={attendanceCorrectionForm.reason}
                    onChange={(e) => setAttendanceCorrectionForm({ ...attendanceCorrectionForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ajukan Perbaikan Presensi</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Form 4: Reimbursement */}
          {submissionCategory === 'reimburse' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs max-w-2xl">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Formulir Klaim Pengeluaran / Reimbursement</h3>
              </div>

              <form onSubmit={handleSubmitReimburse} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Kategori Biaya *</label>
                    <select
                      value={reimburseForm.category}
                       onChange={(e) => setReimburseForm({ ...reimburseForm, category: e.target.value as ReimbursementCategory })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {REIMBURSEMENT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}



                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Nominal Klaim (Rp) *</label>
                    <CurrencyInput
                      id="reimburseNominal"
                      value={reimburseForm.amount}
                      onChange={(val) => setReimburseForm({ ...reimburseForm, amount: val })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Nota / Kwitansi Bukti</label>
                  <input
                    type="text"
                    placeholder="Contoh: INV-GRAB-982312"
                    value={reimburseForm.receiptNo}
                    onChange={(e) => setReimburseForm({ ...reimburseForm, receiptNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Rincian Keperluan *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Rincian agenda atau kegiatan yang memerlukan biaya ini..."
                    value={reimburseForm.description}
                    onChange={(e) => setReimburseForm({ ...reimburseForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Klaim Reimbursement</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Form 5: SPPD */}
          {submissionCategory === 'sppd' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs max-w-2xl">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <Plane className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Formulir Pengajuan Surat Perintah Perjalanan Dinas (SPPD)</h3>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
              
    const newReq = {
                    id: `req-${Date.now().toString().slice(-4)}`,
                    category: 'Perjalanan Dinas',
                    title: `SPPD ke ${sppdForm.destination}`,
                    date: sppdForm.startDate,
                    status: 'Menunggu Persetujuan Atasan' as const,
                    detail: `${sppdForm.startDate} s/d ${sppdForm.endDate} - ${sppdForm.purpose}`,
                    amount: sppdForm.estimatedBudget,
                  };
                  setMyRequests([newReq, ...myRequests]);
                  const diffDays = Math.max(
                    1,
                    Math.round((new Date(sppdForm.endDate).getTime() - new Date(sppdForm.startDate).getTime()) / 86400000) + 1
                  );
                  submitBusinessTrip({
                    employeeId: currentEmp.id,
                    destinationCity: sppdForm.destination,
                    startDate: sppdForm.startDate,
                    endDate: sppdForm.endDate,
                    totalDays: diffDays,
                    purpose: sppdForm.purpose,
                    transportType: 'Pesawat',
                    estimatedCost: Number(sppdForm.estimatedBudget) || 0,
                    perDiemDaily: 350000,
                    accommodationCost: Math.round((Number(sppdForm.estimatedBudget) || 0) * 0.4),
                  });
                  setNoticeMessage(`Pengajuan SPPD ke ${sppdForm.destination} berhasil diajukan.`);
                  setActiveTab('status');
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kota / Lokasi Tujuan *</label>
                  <input
                    type="text"
                    required
                    value={sppdForm.destination}
                    onChange={(e) => setSppdForm({ ...sppdForm, destination: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tanggal Berangkat *</label>
                    <input
                      type="date"
                      required
                      value={sppdForm.startDate}
                      onChange={(e) => setSppdForm({ ...sppdForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tanggal Kembali *</label>
                    <input
                      type="date"
                      required
                      value={sppdForm.endDate}
                      onChange={(e) => setSppdForm({ ...sppdForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estimasi Anggaran Perjalanan (Rp)</label>
                  <CurrencyInput
                    id="sppdBudget"
                    value={sppdForm.estimatedBudget}
                    onChange={(val) => setSppdForm({ ...sppdForm, estimatedBudget: val })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tujuan & Agenda Kedinasan *</label>
                  <textarea
                    rows={3}
                    required
                    value={sppdForm.purpose}
                    onChange={(e) => setSppdForm({ ...sppdForm, purpose: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ajukan Perjalanan Dinas</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Form 6: Kasbon */}
          {submissionCategory === 'kasbon' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs max-w-2xl">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <Wallet className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Formulir Pinjaman Cepat / Kasbon Karyawan</h3>
              </div>

              <form onSubmit={handleSubmitKasbon} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Nominal Kasbon (Rp) *</label>
                    <CurrencyInput
                      id="kasbonAmount"
                      value={kasbonForm.amount}
                      onChange={(val) => setKasbonForm({ ...kasbonForm, amount: val })}
                      placeholder="0"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Maksimal 30% dari take home pay bulanan.</span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tenor Cicilan Payroll *</label>
                    <select
                      value={kasbonForm.tenorMonths}
                      onChange={(e) => setKasbonForm({ ...kasbonForm, tenorMonths: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value={1}>1 Bulan (Potong gaji bulan depan)</option>
                      <option value={2}>2 Bulan Cicilan</option>
                      <option value={3}>3 Bulan Cicilan</option>
                      <option value={6}>6 Bulan Cicilan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Alasan / Kebutuhan Mendesak *</label>
                  <textarea
                    rows={3}
                    required
                    value={kasbonForm.reason}
                    onChange={(e) => setKasbonForm({ ...kasbonForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ajukan Pinjaman Kasbon</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STATUS & RIWAYAT PENGAJUAN SAYA */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">
                Riwayat Pengajuan Mandiri & Timeline Otorisasi
              </span>
              <span className="text-[11px] text-slate-500">
                Diperbarui otomatis saat atasan atau HR memproses approval
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {allMyLiveRequests.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category}
                      </span>
                      {item.amount && (
                        <span className="font-mono font-bold text-indigo-700">
                          {formatRupiah(item.amount)}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600 text-[11px]">{item.detail}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Diajukan pada: {item.date} · ID: {item.id}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        item.status === 'Disetujui'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.status === 'Ditolak'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'Disetujui'
                            ? 'bg-emerald-600'
                            : item.status === 'Ditolak'
                            ? 'bg-rose-600'
                            : 'bg-amber-600'
                        }`}
                      ></span>
                      <span>{item.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SLIP GAJI & DOKUMEN SAYA */}
      {activeTab === 'slip' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payslip Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900 text-sm">Slip Gaji Terakhir ({latestPayroll?.period || 'Oktober 2026'})</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                  Sudah Dibayarkan
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Gaji Pokok:</span>
                  <span className="font-mono font-semibold">{formatRupiah(latestPayroll?.basicSalary ?? (currentEmp as any).basicSalary ?? (currentEmp as any).salary ?? 14500000)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tunjangan Jabatan:</span>
                  <span className="font-mono font-semibold">{formatRupiah(latestPayroll?.allowances ?? (currentEmp as any).positionAllowance ?? 2500000)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Lembur (3 Jam):</span>
                  <span className="font-mono font-semibold">{formatRupiah((latestPayroll?.overtimePay ?? 0) + (latestPayroll?.reimbursement ?? 0) || 420000)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 text-rose-600">
                  <span>Potongan BPJS & PPh 21 TER:</span>
                  <span className="font-mono font-semibold">- {formatRupiah(latestPayroll?.totalDeductions ?? 840000)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                  <span>Take Home Pay:</span>
                  <span className="font-mono text-emerald-600">
                    {formatRupiah(latestPayroll?.netPay ?? ((currentEmp as any).basicSalary || currentEmp.salary || 14500000) + 2500000 + 420000 - 840000)}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => alert(`Mengunduh Slip Gaji Elektronik April 2026 untuk ${currentEmp.fullName}`)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-2"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Unduh Slip Gaji PDF (Resmi)</span>
                </button>
              </div>
            </div>

            {/* Document Archive Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Award className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-900 text-sm">Dokumen & Surat Keputusan (SK) Saya</span>
              </div>

              <div className="space-y-2 text-xs">
                {empDocuments.map((doc) => (
                  <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{doc.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">No: {doc.documentNumber} · Terbit {doc.issueDate}</div>
                    </div>
                    <button
                      onClick={() => alert(doc.contentPreview || `Membuka dokumen ${doc.title}`)}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded text-[11px] font-semibold text-slate-700"
                    >
                      Lihat
                    </button>
                  </div>
                ))}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Surat Perjanjian Kerja (PKWTT)</div>
                    <div className="text-[10px] text-slate-400 font-mono">No: 042/HR-PKWTT/2024 · Berlaku Tetap</div>
                  </div>
                  <button
                    onClick={() => alert('Membuka pratinjau SK PKWTT')}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded text-[11px] font-semibold text-slate-700"
                  >
                    Lihat
                  </button>
                </div>

                {empDocuments.map((doc) => (
                  <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{doc.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">No: {doc.documentNumber} · Terbit {doc.issueDate}</div>
                    </div>
                    <button
                      onClick={() => alert(doc.contentPreview || `Membuka dokumen ${doc.title}`)}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded text-[11px] font-semibold text-slate-700"
                    >
                      Lihat
                    </button>
                  </div>
                ))}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">SK Promosi Senior Engineer</div>
                    <div className="text-[10px] text-slate-400 font-mono">No: SK-PRM/081/2025 · Berlaku 01 Jan 2025</div>
                  </div>
                  <button
                    onClick={() => alert('Membuka pratinjau SK Promosi')}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded text-[11px] font-semibold text-slate-700"
                  >
                    Lihat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ESS CLOCK-IN (GPS) */}
      {activeTab === 'presensi' && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-slate-900">Employee Self-Service (ESS) Clock-In (GPS)</h3>
            <p className="text-xs text-slate-500">
              Validasi Geofencing GPS mengikuti penugasan <strong>Lokasi Kantor</strong> karyawan (Radius Maks.{' '}
              <strong>{activeLocationRadius}m</strong>) & swafoto biometrik kamera.
            </p>
          </div>

          <EmployeeSelect
            label="Karyawan yang Melakukan Presensi"
            required
            employees={employees}
            value={clockEmpId}
            onChange={(id) => {
              setClockEmpId(id);
              setSelectedClockLocationId('');
              setSimulatedDistanceMeters(18);
            }}
          />

          {/* Lokasi Kantor Penugasan Karyawan */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Lokasi Kantor Penugasan ({assignedClockLocations.length} Lokasi Aktif)</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">
                Radius Maks: {activeLocationRadius} Meter
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {assignedClockLocations.map((loc) => {
                const isSelected = activeClockLocation?.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedClockLocationId(loc.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-2xs'
                        : 'bg-white/70 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 truncate">{loc.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold shrink-0">
                        {loc.radiusMeters}m
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {loc.companyName} · {loc.type}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Lat/Long: {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Simulasi Posisi GPS Karyawan — Radius ditetapkan oleh HR, tidak bisa diubah karyawan */}
            <div className="pt-2 border-t border-indigo-200/70 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-medium">
                  Deteksi Jarak GPS ke <strong>{activeClockLocation?.name}</strong>:
                </span>
                <span
                  className={`font-mono font-bold ${
                    isWithinRadius ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {simulatedDistanceMeters}m / Maks. {activeLocationRadius}m
                </span>
              </div>
              {/* Slider ini merupakan SIMULASI posisi GPS karyawan (demo prototype) — 
                  di produksi nyata posisi ini otomatis dari GPS device. 
                  Radius absensi ditetapkan oleh HR/Admin di Menu Lokasi Kantor, bukan oleh karyawan. */}
              <div className="relative">
                <input
                  type="range"
                  min={5}
                  max={Math.max(activeLocationRadius * 2, 300)}
                  value={simulatedDistanceMeters}
                  onChange={(e) => setSimulatedDistanceMeters(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5"
                  title="Simulasi posisi GPS (demo) — di produksi nyata posisi GPS terdeteksi otomatis"
                />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                <span className="shrink-0">⚙</span>
                <span>
                  <strong>Radius {activeLocationRadius}m</strong> ditetapkan oleh HR/Admin di{' '}
                  <strong>Menu Lokasi Kantor</strong>. Karyawan tidak dapat mengubah radius absensi.{' '}
                  <em>(Slider di atas hanya simulasi posisi GPS untuk keperluan demo.)</em>
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-xl text-center space-y-3">
            <div className="relative w-48 h-36 mx-auto rounded-lg overflow-hidden border-2 border-indigo-500 bg-slate-800 flex items-center justify-center">
              <Camera className="w-8 h-8 text-indigo-400" />
              <div className="absolute bottom-2 left-2 right-2 text-[10px] bg-slate-900/80 py-0.5 rounded text-indigo-300 font-mono">
                ✓ Face Recognition OK
              </div>
            </div>

            <div
              className={`text-xs font-mono flex items-center justify-center gap-1 ${
                isWithinRadius ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isWithinRadius
                  ? `Lokasi Valid: ${activeClockLocation?.name} (Jarak ${simulatedDistanceMeters}m ≤ Radius ${activeLocationRadius}m)`
                  : `Di Luar Radius: ${activeClockLocation?.name} (Jarak ${simulatedDistanceMeters}m > Radius ${activeLocationRadius}m)`}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 flex items-center justify-between">
            <span>Titik Lokasi Presensi:</span>
            <span className="text-indigo-700 font-bold">
              {activeClockLocation?.name} ({activeClockLocation?.type})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!isWithinRadius}
              onClick={() => {
                if (clockEmpId && isWithinRadius) {
                  clockIn(
                    clockEmpId,
                    `Presensi ESS di ${activeClockLocation?.name} (Jarak ${simulatedDistanceMeters}m / Radius ${activeLocationRadius}m)`
                  );
                  setNoticeMessage(
                    `Clock-in Masuk Kerja di ${activeClockLocation?.name} (Radius ${activeLocationRadius}m) berhasil tercatat!`
                  );
                }
              }}
              className={`py-3 rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 ${
                isWithinRadius
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Clock-In Masuk Kerja</span>
            </button>

            <button
              type="button"
              disabled={!isWithinRadius}
              onClick={() => {
                if (clockEmpId && isWithinRadius) {
                  clockOut(
                    clockEmpId,
                    `Clock-out ESS di ${activeClockLocation?.name} (Jarak ${simulatedDistanceMeters}m / Radius ${activeLocationRadius}m)`
                  );
                  setNoticeMessage(
                    `Clock-out Pulang Kerja di ${activeClockLocation?.name} (Radius ${activeLocationRadius}m) berhasil tercatat!`
                  );
                }
              }}
              className={`py-3 rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 ${
                isWithinRadius
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Clock-Out Pulang Kerja</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

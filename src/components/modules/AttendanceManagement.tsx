import React, { useState, useEffect } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Camera,
  MapPin,
  Check,
  X,
  Users,
  Repeat,
  AlertTriangle,
  FileText,
  DollarSign,
  Settings,
  ShieldCheck,
  UserCheck,
  Layers,
  Eye,
  Printer,
  BarChart3,
  FileCheck2,
  ChevronRight,
} from 'lucide-react';
import {
  AttendanceStatus,
  WorkShift,
  ShiftSwapRequest,
  AttendanceCorrectionRequest,
  AttendanceRecord,
  Employee,
} from '../../types/hrms';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { ValidatedDateInput } from '../common/ValidatedDateInput';
import { validateDateRange, validateDateString } from '../../utils/dateValidator';
import { formatRupiah, calculateOvertimePay } from '../../utils/taxCalculator';
import { CompanyCalendarManagement } from './CompanyCalendarManagement';
import { ScrollableTabNav } from '../common/ScrollableTabNav';
import { ModuleDocumentModal } from '../common/ModuleDocumentModal';
import { ShiftRosterManagement } from './ShiftRosterManagement';

export const AttendanceManagement: React.FC = () => {
  const {
    employees,
    attendance,
    currentTenant,
    leaveRequests,
    clockIn,
    clockOut,
    submitLeaveRequest,
    reviewLeaveRequest,
    shifts,
    shiftSwaps,
    addShiftSwapRequest,
    reviewShiftSwapRequest,
    attendanceCorrections,
    submitAttendanceCorrection,
    reviewAttendanceCorrection,
    moduleSettings,
    updateModuleSettings,
    openFilePreview,
    officeLocations,
  } = useHrms();

  const handlePreviewMonthlyAttendanceCutoff = (rec?: AttendanceRecord, employeeOverride?: Employee) => {
    const emp = employeeOverride || (rec ? employees.find((e) => e.id === rec.employeeId) : employees[0]);
    const empName = emp?.fullName || 'Karyawan';
    const empNik = emp?.nik || 'KR-2026-001';
    const empDept = emp?.department || 'Operasional';
    const empPosition = emp?.position || 'Staff';

    // Calculate actual logs for this employee from attendance state
    const empAttendance = attendance.filter((a) => a.employeeId === emp?.id);
    const presentCount = empAttendance.filter((a) => a.status === 'Hadir').length || 19;
    const lateCount = empAttendance.filter((a) => a.lateMinutes > 0 || a.status === 'Terlambat').length || 2;
    const totalLateMinutes = empAttendance.reduce((sum, a) => sum + (a.lateMinutes || 0), 0) || 25;
    const totalOvertime = empAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0) || 4.5;
    const leaveCount = empAttendance.filter((a) => ['Cuti', 'Sakit', 'Izin'].includes(a.status)).length || 1;
    const alphaCount = empAttendance.filter((a) => a.status === 'Alpa').length || 0;
    const effectiveWorkDays = 22;
    const totalPresentDays = Math.min(effectiveWorkDays, presentCount + lateCount);
    const attendanceRate = Math.round((totalPresentDays / effectiveWorkDays) * 100);

    openFilePreview({
      title: 'LEMBAR REKAPITULASI PRESENSI BULANAN (PERIODE CUT-OFF)',
      documentNumber: `REKAP-ATT/2026-10/${empNik}`,
      typeBadge: 'Rekap Presensi Bulanan (Cut-Off)',
      date: '21 Oktober 2026',
      partyName: empName,
      partyRole: `${empPosition} · Divisi ${empDept} (NIK: ${empNik})`,
      statusBadge: {
        label: 'Terverifikasi Tim Payroll HR',
        variant: 'success',
      },
      detailsGrid: [
        { label: 'Periode Cut-Off Presensi', value: '21 Sep 2026 – 20 Okt 2026' },
        { label: 'Siklus Pembukuan Gaji', value: 'Payroll Bulan Oktober 2026' },
        { label: 'Hari Kerja Efektif Perusahaan', value: `${effectiveWorkDays} Hari Kerja` },
        { label: 'Total Kehadiran Karyawan', value: `${totalPresentDays} Hari (${attendanceRate}%)` },
        { label: 'Akumulasi Keterlambatan', value: `${lateCount} Kali (${totalLateMinutes} Menit)` },
        { label: 'Akumulasi Lembur (Overtime)', value: `${totalOvertime} Jam (SPL Disetujui)` },
        { label: 'Cuti / Sakit / Izin Resmi', value: `${leaveCount} Hari Kerja` },
        { label: 'Alpa / Tanpa Keterangan', value: `${alphaCount} Hari Kerja` },
      ],
      contentParagraphs: [
        `Rekapitulasi catatan presensi selama 1 (satu) bulan penuh periode cut-off (21 September 2026 s/d 20 Oktober 2026) ini diterbitkan secara otomatis oleh sistem NusaHR Enterprise untuk unit kerja ${currentTenant?.name || 'Perusahaan'} atas nama ${empName} (NIK: ${empNik}).`,
        `Seluruh data catatan kedatangan (clock-in) dan kepulangan (clock-out) bersumber dari mesin presensi biometrik kantor serta validasi GPS Mobile Geofencing NusaHR yang telah diverifikasi dan disahkan oleh atasan langsung bersangkutan.`,
        `Ringkasan Presensi Cut-Off: Dari total ${effectiveWorkDays} hari kerja efektif, karyawan mencatatkan kehadiran sebanyak ${totalPresentDays} hari kerja (${attendanceRate}%). Akumulasi keterlambatan tercatat sebesar ${totalLateMinutes} menit dan total jam lembur yang disetujui atasan sebanyak ${totalOvertime} jam.`,
        `Berdasarkan Peraturan Perusahaan dan regulasi ketenagakerjaan PP No. 35/2021, lembar rekapitulasi presensi bulanan periode cut-off ini sah sebagai dokumen dasar penghitungan kompensasi gaji pokok, tunjangan kehadiran (attendance allowance), denda keterlambatan, dan upah lembur pada slip gaji karyawan.`,
      ],
      signeeName: 'H. Budi Santoso, S.E., M.M.',
      signeeRole: 'Head of People Operations & Payroll Compensation',
    });
  };

  const handlePreviewAttendanceRow = handlePreviewMonthlyAttendanceCutoff;

  const handlePreviewCorrection = (corr: AttendanceCorrectionRequest) => {
    const emp = employees.find((e) => e.id === corr.employeeId);
    openFilePreview({
      title: `SURAT PENGAJUAN KOREKSI PRESENSI: ${corr.type.toUpperCase()}`,
      documentNumber: `KOR-${corr.date.replace(/-/g, '')}/${emp?.nik || '000'}`,
      typeBadge: `Koreksi ${corr.type}`,
      date: corr.date,
      partyName: emp?.fullName || 'Karyawan',
      partyRole: `${emp?.position || 'Staff'} · ${emp?.department || 'Operasional'}`,
      statusBadge: {
        label: corr.status === 'Disetujui' ? 'Disetujui Atasan' : corr.status === 'Ditolak' ? 'Ditolak' : 'Menunggu Review',
        variant: corr.status === 'Disetujui' ? 'success' : corr.status === 'Ditolak' ? 'danger' : 'warning',
      },
      detailsGrid: [
        { label: 'Jenis Koreksi', value: corr.type },
        { label: 'Tanggal Kejadian', value: corr.date },
        { label: 'Jam Usulan Masuk', value: corr.proposedClockIn || '-' },
        { label: 'Jam Usulan Pulang', value: corr.proposedClockOut || '-' },
        { label: 'NIK Karyawan', value: emp?.nik || '-' },
        { label: 'Departemen', value: emp?.department || '-' },
      ],
      contentParagraphs: [
        `Dengan ini karyawan mengajukan permohonan koreksi pencatatan presensi kerja untuk jenis "${corr.type}" pada tanggal ${corr.date}.`,
        `Alasan pengajuan perbaikan: "${corr.reason}".`,
        `Karyawan menyatakan bahwa keterangan di atas dibuat dengan sebenar-benarnya untuk diperhitungkan dalam kalkulasi payroll dan absensi perusahaan.`,
      ],
      attachments: corr.attachmentUrl
        ? [{ fileName: corr.attachmentUrl, fileSize: '184 KB', fileType: 'PDF/Surat Dokter' }]
        : [{ fileName: `Surat_Keterangan_${corr.type}.pdf`, fileSize: '142 KB', fileType: 'PDF' }],
    });
  };

  const handlePreviewShiftSwap = (swap: ShiftSwapRequest) => {
    const req = employees.find((e) => e.id === swap.requesterId);
    const target = employees.find((e) => e.id === swap.targetEmployeeId);
    openFilePreview({
      title: 'FORMULIR PERMOHONAN TUKAR SHIFT KERJA',
      documentNumber: `SWAP-${swap.requestDate.replace(/-/g, '')}/${swap.id.slice(-4)}`,
      typeBadge: 'Tukar Shift',
      date: swap.requestDate,
      partyName: `${req?.fullName || 'Pemohon'} ↔ ${target?.fullName || 'Pengganti'}`,
      partyRole: `${req?.position || 'Staff'} & ${target?.position || 'Staff'}`,
      statusBadge: {
        label: swap.status,
        variant: swap.status === 'Disetujui' ? 'success' : swap.status === 'Ditolak' ? 'danger' : 'warning',
      },
      detailsGrid: [
        { label: 'Pemohon Asal', value: req?.fullName || '-' },
        { label: 'Shift Pemohon', value: `${swap.requestShiftId} (${swap.requestDate})` },
        { label: 'Rekan Pengganti', value: target?.fullName || '-' },
        { label: 'Shift Pengganti', value: `${swap.targetShiftId} (${swap.targetDate})` },
        { label: 'Alasan Penukaran', value: swap.reason },
        { label: 'Status Verifikasi', value: swap.status },
      ],
      contentParagraphs: [
        `Kedua belah pihak karyawan telah menyetujui pertukaran jadwal shift kerja operasional secara sukarela tanpa mengganggu kontinuitas layanan operasional.`,
        `Alasan pertukaran: "${swap.reason}".`,
        `Perubahan roster berlaku efektif pada tanggal ${swap.requestDate} dan ${swap.targetDate} setelah mendapatkan persetujuan Supervisor / HRD.`,
      ],
    });
  };

  const [activeTab, setActiveTab] = useState<'hr' | 'shifts' | 'koreksi' | 'calendar' | 'pengaturan'>('hr');
  const [selectedDate, setSelectedDate] = useState('2026-10-22');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isShiftSwapModalOpen, setIsShiftSwapModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [confirmCorrectionAction, setConfirmCorrectionAction] = useState<{
    item: AttendanceCorrectionRequest;
    approve: boolean;
  } | null>(null);
  const [confirmActionNotes, setConfirmActionNotes] = useState('');

  // Close any active modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmCorrectionAction) setConfirmCorrectionAction(null);
        else if (isLeaveModalOpen) setIsLeaveModalOpen(false);
        else if (isShiftSwapModalOpen) setIsShiftSwapModalOpen(false);
        else if (isCorrectionModalOpen) setIsCorrectionModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmCorrectionAction, isLeaveModalOpen, isShiftSwapModalOpen, isCorrectionModalOpen]);

  // Leave Form State
  const [leaveEmpId, setLeaveEmpId] = useState(employees[0]?.id || '');
  const [leaveType, setLeaveType] = useState<any>('Cuti Tahunan');
  const [startDate, setStartDate] = useState('2026-10-25');
  const [endDate, setEndDate] = useState('2026-10-26');
  const [leaveReason, setLeaveReason] = useState('');

  // Shift Swap Form State
  const [swapRequesterId, setSwapRequesterId] = useState(employees[0]?.id || '');
  const [swapTargetId, setSwapTargetId] = useState(employees[1]?.id || '');
  const [swapRequestDate, setSwapRequestDate] = useState('2026-10-22');
  const [swapTargetDate, setSwapTargetDate] = useState('2026-10-23');
  const [swapReason, setSwapReason] = useState('');

  // Attendance Correction State
  const [corrEmpId, setCorrEmpId] = useState(employees[0]?.id || '');
  const [corrDate, setCorrDate] = useState('2026-10-16');
  const [corrType, setCorrType] = useState<AttendanceCorrectionRequest['type']>('Lupa Absen Pulang');
  const [corrClockIn, setCorrClockIn] = useState('08:00');
  const [corrClockOut, setCorrClockOut] = useState('17:30');
  const [corrReason, setCorrReason] = useState('');

  // Form Validation Errors
  const [leaveFormError, setLeaveFormError] = useState<string | null>(null);
  const [swapFormError, setSwapFormError] = useState<string | null>(null);
  const [corrFormError, setCorrFormError] = useState<string | null>(null);

  // Settings State
  const [lateGracePeriod, setLateGracePeriod] = useState(moduleSettings.attendance.lateGracePeriodMins || 15);
  const [latePenaltyPerHour, setLatePenaltyPerHour] = useState(moduleSettings.attendance.latePenaltyPerHour || 50000);
  // Catatan: gpsRadius TIDAK diatur di sini — setiap Lokasi Kantor punya radius sendiri (Menu Lokasi Kantor)
  const [requireCamera, setRequireCamera] = useState(moduleSettings.attendance.cameraSelfieRequired ?? true);

  // Kuota & Batas Toleransi per 1 Periode Payroll / 1 Bulan
  const [maxLateMonthly, setMaxLateMonthly] = useState(moduleSettings.attendance.maxLateOccurrencesMonthly ?? 3);
  const [maxPermissionMonthly, setMaxPermissionMonthly] = useState(moduleSettings.attendance.maxPermissionDaysMonthly ?? 2);
  const [maxSickNoNoteMonthly, setMaxSickNoNoteMonthly] = useState(
    moduleSettings.attendance.maxSickWithoutDoctorNoteDaysMonthly ?? 2
  );
  const [maxSickWithNoteMonthly, setMaxSickWithNoteMonthly] = useState(
    moduleSettings.attendance.maxSickWithDoctorNoteDaysMonthly ?? 14
  );
  const [maxForgotInMonthly, setMaxForgotInMonthly] = useState(moduleSettings.attendance.maxForgotClockInMonthly ?? 2);
  const [maxForgotOutMonthly, setMaxForgotOutMonthly] = useState(moduleSettings.attendance.maxForgotClockOutMonthly ?? 2);

  // Filtered attendance for HR view
  const filteredAttendance = attendance.filter((a) => {
    const matchesDate = !selectedDate || a.date === selectedDate;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesDate && matchesStatus;
  });

  // Calculate days difference with range validation
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    if (d2 < d1) return 0;
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diff) || diff < 1 ? 0 : diff;
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveEmpId) {
      setLeaveFormError('Pilih nama karyawan yang mengajukan cuti');
      return;
    }

    const rangeCheck = validateDateRange(startDate, endDate);
    if (!rangeCheck.isValid) {
      setLeaveFormError(rangeCheck.errorMessage || 'Rentang tanggal cuti tidak valid');
      return;
    }

    setLeaveFormError(null);
    submitLeaveRequest({
      employeeId: leaveEmpId,
      leaveType,
      startDate,
      endDate,
      totalDays: calculateDays(),
      reason: leaveReason || 'Pengajuan cuti terjadwal',
    });

    setIsLeaveModalOpen(false);
    setLeaveReason('');
  };

  const handlePunchClock = () => {
    if (!clockEmpId) return;
    if (clockType === 'in') {
      clockIn(clockEmpId, clockNote || 'Presensi ESS dengan Kamera & GPS Valid');
    } else {
      clockOut(clockEmpId, clockNote || 'Clock-out Mandiri Selesai Jam Kerja');
    }
    setIsClockModalOpen(false);
    setClockNote('');
  };

  const handleShiftSwapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapRequesterId || !swapTargetId) {
      setSwapFormError('Pilih pemohon dan karyawan target pertukaran shift');
      return;
    }
    const check1 = validateDateString(swapRequestDate);
    const check2 = validateDateString(swapTargetDate);
    if (!check1.isValid || !check2.isValid) {
      setSwapFormError('Format tanggal shift tidak valid');
      return;
    }
    setSwapFormError(null);

    addShiftSwapRequest({
      requesterId: swapRequesterId,
      targetEmployeeId: swapTargetId,
      requestDate: swapRequestDate,
      targetDate: swapTargetDate,
      reason: swapReason || 'Penyesuaian jam kerja terjadwal',
    });

    setIsShiftSwapModalOpen(false);
    setSwapReason('');
  };

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrEmpId) {
      setCorrFormError('Pilih karyawan yang mengajukan koreksi');
      return;
    }
    const check = validateDateString(corrDate);
    if (!check.isValid) {
      setCorrFormError(check.errorMessage || 'Tanggal kejadian koreksi tidak valid');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (corrDate > todayStr) {
      setCorrFormError('Tanggal kejadian presensi tidak boleh di masa depan!');
      return;
    }
    setCorrFormError(null);

    submitAttendanceCorrection({
      employeeId: corrEmpId,
      date: corrDate,
      type: corrType,
      proposedClockIn: corrClockIn,
      proposedClockOut: corrClockOut,
      reason: corrReason || 'Koreksi log jam kerja mandiri',
    });

    setIsCorrectionModalOpen(false);
    setCorrReason('');
  };

  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  const handleSaveSettings = () => {
    updateModuleSettings('attendance', {
      lateGracePeriodMins: Number(lateGracePeriod),
      latePenaltyPerHour: Number(latePenaltyPerHour),
      // gpsRadiusMeters: Radius GPS tidak diatur di sini — diatur per Lokasi Kantor (Menu Lokasi Kantor)
      cameraSelfieRequired: requireCamera,
      maxLateOccurrencesMonthly: Number(maxLateMonthly),
      maxPermissionDaysMonthly: Number(maxPermissionMonthly),
      maxSickWithoutDoctorNoteDaysMonthly: Number(maxSickNoNoteMonthly),
      maxSickWithDoctorNoteDaysMonthly: Number(maxSickWithNoteMonthly),
      maxForgotClockInMonthly: Number(maxForgotInMonthly),
      maxForgotClockOutMonthly: Number(maxForgotOutMonthly),
    });
    setSettingsNotice('Pengaturan Presensi, Toleransi Bulanan & Shift berhasil diperbarui!');
    setTimeout(() => setSettingsNotice(null), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Row 1: Module Title Header & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Presensi, Roaster Shift & Manajemen Cuti</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring kehadiran Atasan & HR, jenis shift roster, pengajuan perbaikan lupa absen/keterlambatan, serta potongan denda presensi & perhitungan lembur PP 35/2021.
          </p>
        </div>

        <button
          onClick={() => setIsLeaveModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs shrink-0 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Ajukan Cuti Karyawan</span>
        </button>
      </div>

      {/* Row 2: Standard Sub-Menu Navigation Bar with Icons (Not Parallel to Title) */}
      <ScrollableTabNav className="border-b border-slate-200" containerClassName="pt-1">
        <button
          onClick={() => setActiveTab('hr')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'hr'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Dashboard HR Rekap</span>
        </button>

        <button
          onClick={() => setActiveTab('shifts')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'shifts'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Jadwal Shift & Roaster</span>
        </button>

        <button
          onClick={() => setActiveTab('koreksi')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'koreksi'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Pengajuan & Koreksi</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'calendar'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Kalender & Cuti Bersama</span>
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
          <span>Pengaturan</span>
        </button>
      </ScrollableTabNav>

      {settingsNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{settingsNotice}</span>
          </div>
          <button onClick={() => setSettingsNotice(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* ===================== TAB 1: HR DASHBOARD & REKAP ===================== */}
      {activeTab === 'hr' && (
        <div className="space-y-4">
          {/* Anomaly & Metric Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Tingkat Kehadiran Hari Ini</span>
              <span className="text-xl font-bold font-mono text-emerald-700">
                {Math.round(
                  (attendance.filter((a) => a.date === selectedDate && (a.status === 'Hadir' || a.status === 'Terlambat')).length /
                    (employees.length || 1)) *
                    100
                )}%
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Basis {employees.length} karyawan aktif</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Anomali Terlambat (&gt;15 Menit)</span>
              <span className="text-xl font-bold font-mono text-amber-700">
                {attendance.filter((a) => a.date === selectedDate && a.lateMinutes > 0).length} Orang
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Dikenakan potongan keterlambatan</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Total Jam Lembur Disetujui</span>
              <span className="text-xl font-bold font-mono text-indigo-700">
                {attendance
                  .filter((a) => a.date === selectedDate)
                  .reduce((sum, a) => sum + a.overtimeHours, 0)}{' '}
                Jam
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Rumus PP 35/2021 siap hitung</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Sedang Cuti / Sakit / Izin</span>
              <span className="text-xl font-bold font-mono text-blue-700">
                {attendance.filter((a) => a.date === selectedDate && ['Cuti', 'Sakit', 'Izin'].includes(a.status)).length} Orang
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Tercatat di sistem presensi</span>
            </div>
          </div>

          {/* Date Picker & Filter */}
          {/* Attendance Date & Filter Toolbar - Responsive Tablet & Mobile Friendly */}
          <div className="bg-white p-3 sm:p-3.5 border border-slate-200 rounded-xl shadow-xs space-y-2.5 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Tanggal:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto py-1.5 px-3 border border-slate-300 rounded-lg font-mono font-semibold text-slate-900 text-xs bg-slate-50/70 focus:bg-white outline-none focus:border-indigo-500 shadow-2xs"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <div className="relative w-full sm:w-56">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg py-2 px-3 bg-white font-medium text-slate-700 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="all">Semua Status Presensi</option>
                  <option value="Hadir">Hadir Tepat Waktu</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Izin">Izin / Sakit</option>
                  <option value="Cuti">Cuti Tahunan</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  const targetEmp = filteredAttendance[0]
                    ? employees.find((e) => e.id === filteredAttendance[0].employeeId)
                    : employees[0];
                  handlePreviewMonthlyAttendanceCutoff(filteredAttendance[0] || attendance[0], targetEmp);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
                title="Buka Lembar Rekapitulasi Presensi 1 Bulan Periode Cut-Off"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                <span>Cetak Rekap Presensi Cut-Off (1 Bln)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDocModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
                title="Buka Pusat Dokumen Resmi Presensi, Cuti, Izin & Lembur"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Dokumen Presensi & Cuti</span>
              </button>
            </div>
          </div>

          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden space-y-3">
            {filteredAttendance.map((rec) => {
              const emp = employees.find((e) => e.id === rec.employeeId);
              return (
                <div
                  key={rec.id}
                  onClick={() => handlePreviewAttendanceRow(rec)}
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-xs space-y-3 cursor-pointer active:scale-[0.99] transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {emp?.avatar ? (
                        <img src={emp.avatar} alt={emp.fullName} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                          {(emp?.fullName || 'K')[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{emp?.fullName || 'Karyawan'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{emp?.nik} · {emp?.position}</div>
                      </div>
                    </div>

                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        rec.status === 'Hadir'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.status === 'Terlambat'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>

                  {/* 4-Item Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-mono text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-sans uppercase">Jam Masuk</span>
                      <strong className="text-slate-900">{rec.clockIn || '--:--'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-sans uppercase">Jam Pulang</span>
                      <strong className="text-slate-900">{rec.clockOut || '--:--'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-sans uppercase">Terlambat</span>
                      {rec.lateMinutes > 0 ? (
                        <span className="text-rose-600 font-bold">+{rec.lateMinutes} m</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-sans uppercase">Lembur</span>
                      {rec.overtimeHours > 0 ? (
                        <span className="text-indigo-600 font-bold">{rec.overtimeHours} Jam</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </div>

                  {/* Footer Notes & Action */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                    <div className="text-slate-500 truncate max-w-[200px]">
                      {rec.notes ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{rec.notes}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Presensi Standar HR</span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                      <span>Rekap Cut-Off</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TAMPILAN DESKTOP & TABLET: Menyesuaikan kolom secara responsif tanpa slide horizontal pada tablet */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Karyawan</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold font-mono">Masuk (In)</th>
                    <th className="py-2.5 px-3 font-semibold font-mono">Pulang (Out)</th>
                    <th className="py-2.5 px-3 font-semibold text-center font-mono hidden lg:table-cell">Terlambat</th>
                    <th className="py-2.5 px-3 font-semibold text-center font-mono hidden lg:table-cell">Lembur</th>
                    <th className="py-2.5 px-3 font-semibold hidden xl:table-cell">Lokasi Presensi & Radius</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.map((rec) => {
                    const emp = employees.find((e) => e.id === rec.employeeId);
                    return (
                      <tr
                        key={rec.id}
                        onClick={() => handlePreviewMonthlyAttendanceCutoff(rec)}
                        className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                        title="Klik baris untuk melihat Lembar Catatan Presensi 1 Bulan (Periode Cut-Off)"
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            {emp?.avatar ? (
                              <img src={emp.avatar} alt={emp.fullName} className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                                {(emp?.fullName || 'K')[0]}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-slate-900">{emp?.fullName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{emp?.nik} · {emp?.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              rec.status === 'Hadir'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'Terlambat'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{rec.clockIn || '--:--'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{rec.clockOut || '--:--'}</td>
                        <td className="py-2.5 px-3 text-center font-mono hidden lg:table-cell">
                          {rec.lateMinutes > 0 ? (
                            <span className="text-rose-600 font-bold">+{rec.lateMinutes} m</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono hidden lg:table-cell">
                          {rec.overtimeHours > 0 ? (
                            <span className="text-indigo-600 font-bold">{rec.overtimeHours} Jam</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-xs hidden xl:table-cell">
                          {(() => {
                            const assignedLocs = officeLocations.filter((l) => emp?.officeLocationIds?.includes(l.id));
                            const primaryLoc = assignedLocs[0] || officeLocations[0];
                            return (
                              <div className="space-y-0.5">
                                {primaryLoc && (
                                  <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate max-w-[160px]">{primaryLoc.name}</span>
                                    <span className="font-mono text-[9px] text-indigo-900">({primaryLoc.radiusMeters}m)</span>
                                    {assignedLocs.length > 1 && (
                                      <span className="text-[9px] bg-indigo-600 text-white px-1 rounded">
                                        +{assignedLocs.length - 1}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className="text-[10px] text-slate-500 truncate">{rec.notes || '-'}</div>
                              </div>
                            );
                          })()}
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

      {/* ===================== TAB: JADWAL SHIFT & ROASTER ===================== */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Master Jam Shift & Contoh Jadwal Roaster (Satpam Outsourcing)</h3>
              <p className="text-xs text-slate-500">
                Konfigurasi rotasi jam kerja 3 regu (Pagi, Siang, Malam, Libur) untuk 6 personil Satpam Outsourcing & fasilitas tukar shift.
              </p>
            </div>
            <button
              onClick={() => setIsShiftSwapModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1 shrink-0"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Ajukan Tukar Shift</span>
            </button>
          </div>

          {/* Info Box Contoh Pola Jadwal Shift 6 Karyawan Outsourcing Satpam */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Contoh Jadwal Shift & Roaster Aktif: 6 Personil Satpam (Outsourcing - PT Garda Keamanan Pratama)</span>
              </div>
              <p className="text-indigo-800 text-[11px]">
                Pola rotasi otomatis 8 hari (2 Pagi → 2 Siang → 2 Malam → 2 Libur) terbagi dalam 3 regu sehingga pos keamanan terjaga 24 jam penuh setiap hari.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 shrink-0 text-[11px] font-semibold">
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                Regu A: Slamet & Bambang
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                Regu B: Dedi & Hendra
              </span>
              <span className="px-2.5 py-1 rounded-md bg-violet-100 text-violet-800 border border-violet-300">
                Regu C: Agus & Maman
              </span>
            </div>
          </div>

          <ShiftRosterManagement />

          {/* Shift Swaps Ledger */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
              Riwayat Permohonan Tukar Shift Antar Karyawan
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {shiftSwaps.map((swap) => {
                const req = employees.find((e) => e.id === swap.requesterId);
                const target = employees.find((e) => e.id === swap.targetEmployeeId);
                return (
                  <div
                    key={swap.id}
                    onClick={() => handlePreviewShiftSwap(swap)}
                    className="p-3 flex items-center justify-between hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {req?.fullName} ↔ {target?.fullName}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Tanggal: {swap.requestDate} tukar ke {swap.targetDate} · Alasan: {swap.reason}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {swap.status === 'Menunggu' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              reviewShiftSwapRequest(swap.id, false);
                            }}
                            className="px-2.5 py-1 text-rose-700 hover:bg-rose-100 bg-rose-50 border border-rose-200 rounded text-xs font-medium"
                          >
                            Tolak
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              reviewShiftSwapRequest(swap.id, true);
                            }}
                            className="px-2.5 py-1 text-white hover:bg-emerald-700 bg-emerald-600 rounded text-xs font-medium shadow-xs"
                          >
                            Setujui
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            swap.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {swap.status}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 5: PENGAJUAN & KOREKSI ===================== */}
      {activeTab === 'koreksi' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pengajuan Koreksi Presensi & Izin</h3>
              <p className="text-xs text-slate-500">Lupa absen masuk/pulang, permohonan izin terlambat macet, dan sakit dengan surat dokter.</p>
            </div>
            <button
              onClick={() => setIsCorrectionModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajukan Perbaikan Presensi</span>
            </button>
          </div>

          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden space-y-3">
            {attendanceCorrections.length > 0 ? (
              attendanceCorrections.map((corr) => {
                const emp = employees.find((e) => e.id === corr.employeeId);
                return (
                  <div
                    key={`mob-corr-${corr.id}`}
                    onClick={() => handlePreviewCorrection(corr)}
                    className="p-4 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl shadow-xs space-y-3 cursor-pointer hover:shadow-sm transition-all group"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200">
                        {corr.type}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          corr.status === 'Disetujui'
                            ? 'bg-emerald-100 text-emerald-800'
                            : corr.status === 'Ditolak'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {corr.status}
                      </span>
                    </div>

                    {/* Employee Profile */}
                    <div className="flex items-center gap-2.5">
                      {emp?.avatar ? (
                        <img
                          src={emp.avatar}
                          alt={emp.fullName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {(emp?.fullName || 'K')[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-xs text-slate-900">{emp?.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          NIK: {emp?.nik || '-'} · {emp?.department || 'Operasional'}
                        </div>
                      </div>
                    </div>

                    {/* Date & Time Proposal */}
                    <div className="p-2.5 bg-slate-50 rounded-lg space-y-1.5 text-xs border border-slate-100">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Tanggal Kejadian:</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-800">{corr.date}</span>
                      </div>
                      {corr.proposedClockIn && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Usulan Jam Masuk - Pulang:</span>
                          </span>
                          <span className="font-mono font-bold text-indigo-700">
                            {corr.proposedClockIn} - {corr.proposedClockOut || '--:--'}
                          </span>
                        </div>
                      )}
                      <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                        <span className="text-slate-400">Alasan: </span>
                        {corr.reason}
                      </div>
                    </div>

                    {/* Bottom Card Footer Actions */}
                    {corr.status === 'Menunggu' ? (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmCorrectionAction({ item: corr, approve: false });
                            setConfirmActionNotes('');
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition-colors"
                        >
                          Tolak
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmCorrectionAction({ item: corr, approve: true });
                            setConfirmActionNotes('');
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                        >
                          Setujui
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Klik card untuk rincian surat</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                Belum ada pengajuan koreksi presensi.
              </div>
            )}
          </div>

          {/* TAMPILAN DESKTOP: List View (>= md) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs divide-y divide-slate-100 text-xs">
            {attendanceCorrections.map((corr) => {
              const emp = employees.find((e) => e.id === corr.employeeId);
              return (
                <div
                  key={corr.id}
                  onClick={() => handlePreviewCorrection(corr)}
                  className="p-3.5 flex items-center justify-between hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                  title="Klik untuk melihat preview surat pengajuan koreksi presensi"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{emp?.fullName}</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                        {corr.type}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">{corr.date}</span>
                    </div>
                    <div className="text-slate-600">Alasan: {corr.reason}</div>
                    {corr.proposedClockIn && (
                      <div className="text-[11px] font-mono text-slate-500">
                        Usulan Jam: {corr.proposedClockIn} - {corr.proposedClockOut}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {corr.status === 'Menunggu' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmCorrectionAction({ item: corr, approve: false });
                            setConfirmActionNotes('');
                          }}
                          className="px-2.5 py-1 text-rose-700 hover:bg-rose-100 bg-rose-50 border border-rose-200 rounded text-xs font-semibold"
                        >
                          Tolak
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmCorrectionAction({ item: corr, approve: true });
                            setConfirmActionNotes('');
                          }}
                          className="px-2.5 py-1 text-white hover:bg-emerald-700 bg-emerald-600 rounded text-xs font-semibold shadow-xs"
                        >
                          Setujui
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          corr.status === 'Disetujui'
                            ? 'bg-emerald-100 text-emerald-800'
                            : corr.status === 'Ditolak'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {corr.status}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== TAB 6: PENGATURAN PRESENSI ===================== */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6 max-w-3xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Pengaturan Toleransi, Kuota Bulanan (1 Periode Payroll) & Denda Presensi
            </h3>
            <p className="text-xs text-slate-500">
              Konfigurasi batas toleransi keterlambatan, izin, sakit tanpa/dengan surat dokter, lupa absen datang/pulang dalam 1 periode payroll (1 bulan), serta denda presensi.
            </p>
          </div>

          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Toleransi Keterlambatan Bebas Denda per Hari (Menit)
                </label>
                <input
                  type="number"
                  value={lateGracePeriod}
                  onChange={(e) => setLateGracePeriod(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Keterlambatan di bawah menit ini tidak dipotong denda</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nominal Denda Terlambat per Jam (IDR)
                </label>
                <input
                  type="number"
                  value={latePenaltyPerHour}
                  onChange={(e) => setLatePenaltyPerHour(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Dipotong otomatis di payroll bulanan jika melebihi batas</span>
              </div>
            </div>

            {/* Section: Batas Toleransi Dalam 1 Periode Payroll / 1 Bulan */}
            <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-4">
              <div className="border-b border-indigo-100 pb-2">
                <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Batas Toleransi Maksimal dalam 1 Periode Payroll (1 Bulan)</span>
                </h4>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Semua parameter di bawah berlaku akumulatif dalam 1 siklus cut-off payroll bulanan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <label className="font-semibold text-slate-800 block mb-1">
                    Batas Toleransi Terlambat
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={maxLateMonthly}
                      onChange={(e) => setMaxLateMonthly(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900"
                    />
                    <span className="text-[11px] text-slate-500 font-semibold shrink-0">Kali / Bln</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Maks. frekuensi terlambat per periode payroll</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <label className="font-semibold text-slate-800 block mb-1">
                    Batas Toleransi Izin Pribadi
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={maxPermissionMonthly}
                      onChange={(e) => setMaxPermissionMonthly(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900"
                    />
                    <span className="text-[11px] text-slate-500 font-semibold shrink-0">Hari / Bln</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Maks. hari izin dalam 1 periode payroll</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <label className="font-semibold text-slate-800 block mb-1">
                    Sakit Tanpa Surat Dokter
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={maxSickNoNoteMonthly}
                      onChange={(e) => setMaxSickNoNoteMonthly(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-amber-700"
                    />
                    <span className="text-[11px] text-slate-500 font-semibold shrink-0">Hari / Bln</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Maks. sakit tanpa surat dokter per bulan</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <label className="font-semibold text-slate-800 block mb-1">
                    Sakit dengan Surat Dokter
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={maxSickWithNoteMonthly}
                      onChange={(e) => setMaxSickWithNoteMonthly(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-emerald-700"
                    />
                    <span className="text-[11px] text-slate-500 font-semibold shrink-0">Hari / Bln</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Batas verifikasi HR per periode payroll</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <label className="font-semibold text-slate-800 block mb-1">
                    Lupa Absen Datang (Clock-In)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={maxForgotInMonthly}
                      onChange={(e) => setMaxForgotInMonthly(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-indigo-700"
                    />
                    <span className="text-[11px] text-slate-500 font-semibold shrink-0">Kali / Bln</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Maks. kuota koreksi lupa absen masuk</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <label className="font-semibold text-slate-800 block mb-1">
                    Lupa Absen Pulang (Clock-Out)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={maxForgotOutMonthly}
                      onChange={(e) => setMaxForgotOutMonthly(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-indigo-700"
                    />
                    <span className="text-[11px] text-slate-500 font-semibold shrink-0">Kali / Bln</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Maks. kuota koreksi lupa absen pulang</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="reqCam"
                  checked={requireCamera}
                  onChange={(e) => setRequireCamera(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4"
                />
                <label htmlFor="reqCam" className="font-semibold text-slate-800 cursor-pointer">
                  Wajib Swafoto Kamera (Selfie Face Check) saat Clock-In & Clock-Out
                </label>
              </div>
              <span className="text-[11px] text-slate-500">
                📍 Pengaturan titik koordinat & radius geofencing GPS diatur di menu <strong>Lokasi Kantor</strong>.
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-xs"
              >
                Simpan Konfigurasi Presensi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 04C: Kalender Kerja, Libur Nasional & Cuti Bersama */}
      {activeTab === 'calendar' && <CompanyCalendarManagement />}

      {/* Modal: Pengajuan Cuti */}
      {isLeaveModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLeaveModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Form Permohonan Cuti Karyawan</h3>
              <button onClick={() => setIsLeaveModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="p-5 space-y-4 text-xs">
              {/* Form Validation Error Notice */}
              {leaveFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{leaveFormError}</span>
                </div>
              )}

              <EmployeeSelect
                label="Pilih Karyawan Pemohon"
                required
                employees={employees}
                value={leaveEmpId}
                onChange={(val) => {
                  setLeaveEmpId(val);
                  if (leaveFormError) setLeaveFormError(null);
                }}
              />

              <div>
                <label className="font-medium text-slate-700 block mb-1">Jenis Cuti / Izin Sakit *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-medium"
                >
                  <option value="Cuti Tahunan">Cuti Tahunan (Saldo 12 Hari)</option>
                  <option value="Sakit Tanpa Surat Dokter">Sakit Tanpa Surat Dokter</option>
                  <option value="Sakit dengan Surat Dokter">Sakit dengan Surat Dokter</option>
                  <option value="Cuti Menikah">Cuti Menikah (3 Hari Kerja)</option>
                  <option value="Cuti Melahirkan">Cuti Melahirkan (3 Bulan)</option>
                  <option value="Izin Urusan Pribadi">Izin Urusan Pribadi</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ValidatedDateInput
                  id="leaveStartDate"
                  label="Tanggal Mulai *"
                  value={startDate}
                  onChange={(val) => {
                    setStartDate(val);
                    if (leaveFormError) setLeaveFormError(null);
                  }}
                  required
                  helperText="Awal periode cuti"
                />
                <ValidatedDateInput
                  id="leaveEndDate"
                  label="Tanggal Selesai *"
                  value={endDate}
                  minDate={startDate}
                  onChange={(val) => {
                    setEndDate(val);
                    if (leaveFormError) setLeaveFormError(null);
                  }}
                  required
                  helperText="Akhir periode cuti"
                />
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800">
                Total Durasi: <span className="font-mono text-indigo-700">{calculateDays()} Hari Kerja</span>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Alasan Pengajuan</label>
                <textarea
                  rows={2}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Keterangan keperluan cuti..."
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold shadow-xs"
                >
                  Ajukan Cuti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tukar Shift */}
      {isShiftSwapModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsShiftSwapModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Form Permohonan Tukar Jam / Shift</h3>
              <button onClick={() => setIsShiftSwapModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleShiftSwapSubmit} className="p-5 space-y-4 text-xs">
              {/* Form Validation Error Notice */}
              {swapFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{swapFormError}</span>
                </div>
              )}

              <EmployeeSelect
                label="Karyawan Pemohon (Requester)"
                required
                employees={employees}
                value={swapRequesterId}
                onChange={(val) => {
                  setSwapRequesterId(val);
                  if (swapFormError) setSwapFormError(null);
                }}
              />

              <EmployeeSelect
                label="Karyawan Mitra Tukar (Target Partner)"
                required
                employees={employees}
                value={swapTargetId}
                onChange={(val) => {
                  setSwapTargetId(val);
                  if (swapFormError) setSwapFormError(null);
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <ValidatedDateInput
                  id="swapRequestDate"
                  label="Tanggal Shift Pemohon *"
                  value={swapRequestDate}
                  onChange={(val) => {
                    setSwapRequestDate(val);
                    if (swapFormError) setSwapFormError(null);
                  }}
                  required
                  helperText="Tanggal jadwal asli pemohon"
                />
                <ValidatedDateInput
                  id="swapTargetDate"
                  label="Tanggal Shift Target *"
                  value={swapTargetDate}
                  onChange={(val) => {
                    setSwapTargetDate(val);
                    if (swapFormError) setSwapFormError(null);
                  }}
                  required
                  helperText="Tanggal jadwal pengganti"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Alasan Pertukaran *</label>
                <textarea
                  rows={2}
                  required
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="Keterangan penyesuaian jam..."
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShiftSwapModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold shadow-xs"
                >
                  Ajukan Tukar Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Koreksi Presensi */}
      {isCorrectionModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCorrectionModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Form Koreksi Presensi / Lupa Absen</h3>
              <button onClick={() => setIsCorrectionModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="p-5 space-y-4 text-xs">
              {/* Form Validation Error Notice */}
              {corrFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{corrFormError}</span>
                </div>
              )}

              <EmployeeSelect
                label="Pilih Karyawan"
                required
                employees={employees}
                value={corrEmpId}
                onChange={(val) => {
                  setCorrEmpId(val);
                  if (corrFormError) setCorrFormError(null);
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Jenis Koreksi *</label>
                  <select
                    value={corrType}
                    onChange={(e) => setCorrType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-medium"
                  >
                    <option value="Lupa Absen Masuk">Lupa Absen Masuk</option>
                    <option value="Lupa Absen Pulang">Lupa Absen Pulang</option>
                    <option value="Izin Datang Terlambat">Izin Datang Terlambat</option>
                    <option value="Izin Pulang Cepat">Izin Pulang Cepat</option>
                    <option value="Sakit Tanpa Surat Dokter">Sakit Tanpa Surat Dokter</option>
                    <option value="Sakit dengan Surat Dokter">Sakit dengan Surat Dokter</option>
                  </select>
                </div>
                <div>
                  <ValidatedDateInput
                    id="corrDate"
                    label="Tanggal Kejadian *"
                    value={corrDate}
                    onChange={(val) => {
                      setCorrDate(val);
                      if (corrFormError) setCorrFormError(null);
                    }}
                    required
                    validateMode="pastOnly"
                    helperText="Maksimal hari ini (tidak boleh masa depan)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Usulan Jam Masuk</label>
                  <input
                    type="time"
                    value={corrClockIn}
                    onChange={(e) => setCorrClockIn(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Usulan Jam Pulang</label>
                  <input
                    type="time"
                    value={corrClockOut}
                    onChange={(e) => setCorrClockOut(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Alasan Terlewat / Izin *</label>
                <textarea
                  rows={2}
                  required
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                  placeholder="Keterangan kronologi kejadian..."
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold shadow-xs"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Approval / Reject Pengajuan & Koreksi */}
      {confirmCorrectionAction && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmCorrectionAction(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`px-5 py-4 text-white flex items-center justify-between ${
                confirmCorrectionAction.approve ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              <h3 className="text-sm font-bold flex items-center gap-2">
                {confirmCorrectionAction.approve ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span>
                  {confirmCorrectionAction.approve
                    ? 'Konfirmasi Persetujuan (Approval)'
                    : 'Konfirmasi Penolakan (Reject)'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setConfirmCorrectionAction(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {(() => {
                const emp = employees.find((e) => e.id === confirmCorrectionAction.item.employeeId);
                return (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{emp?.fullName || 'Karyawan'}</span>
                      <span className="text-[10px] font-mono text-slate-500">{emp?.nik}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Jenis Pengajuan:</span>
                      <span className="font-semibold text-indigo-700">{confirmCorrectionAction.item.type}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Tanggal Kejadian:</span>
                      <span className="font-mono font-semibold text-slate-800">{confirmCorrectionAction.item.date}</span>
                    </div>
                    {confirmCorrectionAction.item.proposedClockIn && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Usulan Jam:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {confirmCorrectionAction.item.proposedClockIn} -{' '}
                          {confirmCorrectionAction.item.proposedClockOut || '--:--'}
                        </span>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                      <span className="text-slate-400">Alasan: </span>
                      {confirmCorrectionAction.item.reason}
                    </div>
                  </div>
                );
              })()}

              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin{' '}
                <strong className={confirmCorrectionAction.approve ? 'text-emerald-700' : 'text-rose-700'}>
                  {confirmCorrectionAction.approve ? 'MENYETUJUI (Approve)' : 'MENOLAK (Reject)'}
                </strong>{' '}
                pengajuan koreksi presensi & izin di atas? Tindakan ini akan langsung tercatat pada log presensi karyawan.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Catatan Konfirmasi {confirmCorrectionAction.approve ? '(Opsional)' : '*'}
                </label>
                <textarea
                  rows={2}
                  value={confirmActionNotes}
                  onChange={(e) => setConfirmActionNotes(e.target.value)}
                  placeholder={
                    confirmCorrectionAction.approve
                      ? 'Tambahkan catatan persetujuan jika diperlukan...'
                      : 'Tuliskan alasan penolakan pengajuan...'
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmCorrectionAction(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    reviewAttendanceCorrection(confirmCorrectionAction.item.id, confirmCorrectionAction.approve);
                    setSettingsNotice(
                      `Pengajuan "${confirmCorrectionAction.item.type}" berhasil ${
                        confirmCorrectionAction.approve ? 'disetujui' : 'ditolak'
                      }.`
                    );
                    setTimeout(() => setSettingsNotice(null), 4000);
                    setConfirmCorrectionAction(null);
                    setConfirmActionNotes('');
                  }}
                  className={`px-4 py-1.5 text-white rounded-lg font-semibold shadow-xs transition-colors flex items-center gap-1.5 ${
                    confirmCorrectionAction.approve
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {confirmCorrectionAction.approve ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Ya, Setujui Pengajuan</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Ya, Tolak Pengajuan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module Document Modal: Presensi, Cuti & Lembur */}
      <ModuleDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Dokumen Resmi Presensi, Cuti & Jam Kerja Lembur"
        categoryFilter="Kehadiran, Cuti & Perjalanan Dinas"
        defaultTemplateId="tmpl-26"
      />
    </div>
  );
};

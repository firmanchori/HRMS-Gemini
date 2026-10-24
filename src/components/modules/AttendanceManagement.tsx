import React, { useState } from 'react';
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

  const [activeTab, setActiveTab] = useState<'hr' | 'manager' | 'ess' | 'shifts' | 'koreksi' | 'calendar' | 'pengaturan'>('hr');
  const [selectedDate, setSelectedDate] = useState('2026-10-22');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isClockModalOpen, setIsClockModalOpen] = useState(false);
  const [isShiftSwapModalOpen, setIsShiftSwapModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  // ESS Clock State
  const [clockEmpId, setClockEmpId] = useState(employees[0]?.id || '');
  const [clockType, setClockType] = useState<'in' | 'out'>('in');
  const [clockNote, setClockNote] = useState('');
  const [simulatedCamera, setSimulatedCamera] = useState(true);

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
  const [gpsRadius, setGpsRadius] = useState(moduleSettings.attendance.gpsRadiusMeters || 100);
  const [requireCamera, setRequireCamera] = useState(moduleSettings.attendance.cameraSelfieRequired ?? true);

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
      gpsRadiusMeters: Number(gpsRadius),
      cameraSelfieRequired: requireCamera,
    });
    setSettingsNotice('Pengaturan Presensi & Shift berhasil diperbarui!');
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
          onClick={() => setActiveTab('manager')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'manager'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Monitoring Tim Atasan</span>
        </button>

        <button
          onClick={() => setActiveTab('ess')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'ess'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>ESS Clock-In (GPS)</span>
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
          <span>Shift & Roaster</span>
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

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewMonthlyAttendanceCutoff(rec);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-md border border-indigo-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Rekap Presensi (Cut-Off)</span>
                    </button>
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
                    <th className="py-2.5 px-3 font-semibold hidden xl:table-cell">Catatan / Geotag GPS</th>
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
                        <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-xs truncate hidden xl:table-cell">{rec.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: MONITORING TIM ATASAN ===================== */}
      {activeTab === 'manager' && (
        <div className="space-y-4">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900">
            <strong>Tampilan Monitoring Manajer Tim:</strong> Pantau langsung status kehadiran bawahan langsung hari ini ({selectedDate}), berikan dispensasi keterlambatan, atau setujui lembur secara instan.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {employees.map((emp) => {
              const todayRec = attendance.find((a) => a.employeeId === emp.id && a.date === selectedDate);
              return (
                <div key={emp.id} className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {emp.avatar ? (
                        <img src={emp.avatar} alt={emp.fullName} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {emp.fullName[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{emp.fullName}</div>
                        <div className="text-[10px] text-slate-500">{emp.position}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        todayRec?.status === 'Hadir'
                          ? 'bg-emerald-100 text-emerald-800'
                          : todayRec?.status === 'Terlambat'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {todayRec?.status || 'Belum Presensi'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] p-2 bg-slate-50 rounded border border-slate-100 font-mono">
                    <div>
                      <span className="text-slate-400 block text-[9px]">JAM MASUK</span>
                      <strong className="text-slate-800">{todayRec?.clockIn || '--:--'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">JAM PULANG</span>
                      <strong className="text-slate-800">{todayRec?.clockOut || '--:--'}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: ESS CLOCK-IN WITH CAMERA & GPS ===================== */}
      {activeTab === 'ess' && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-slate-900">Employee Self-Service (ESS) Presensi Online</h3>
            <p className="text-xs text-slate-500">
              Validasi Geofencing GPS radius kantor (Maks. {gpsRadius}m) & swafoto biometrik kamera.
            </p>
          </div>

          <EmployeeSelect
            label="Karyawan yang Melakukan Presensi"
            required
            employees={employees}
            value={clockEmpId}
            onChange={setClockEmpId}
          />

          <div className="p-4 bg-slate-900 text-white rounded-xl text-center space-y-3">
            <div className="relative w-48 h-36 mx-auto rounded-lg overflow-hidden border-2 border-indigo-500 bg-slate-800 flex items-center justify-center">
              <Camera className="w-8 h-8 text-indigo-400" />
              <div className="absolute bottom-2 left-2 right-2 text-[10px] bg-slate-900/80 py-0.5 rounded text-indigo-300 font-mono">
                ✓ Face Recognition OK
              </div>
            </div>

            <div className="text-xs text-emerald-400 font-mono flex items-center justify-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Lokasi Valid: Kantor Pusat (Jarak 14 meter dari titik koordinat)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setClockType('in');
                handlePunchClock();
              }}
              className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Clock-In Masuk Kerja</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setClockType('out');
                handlePunchClock();
              }}
              className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              <span>Clock-Out Pulang Kerja</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================== TAB 4: SHIFTS & ROASTER ===================== */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Master Jam Shift & Roster Penjadwalan</h3>
              <p className="text-xs text-slate-500">Konfigurasi rotasi jam kerja operasional & fasilitas tukar shift antar karyawan.</p>
            </div>
            <button
              onClick={() => setIsShiftSwapModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Ajukan Tukar Shift</span>
            </button>
          </div>

          {/* Master Shifts Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {shifts.map((shift) => (
              <div key={shift.id} className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{shift.name}</span>
                  <span className="text-[10px] font-mono text-indigo-700 font-semibold bg-slate-100 px-1.5 py-0.2 rounded">
                    {shift.code}
                  </span>
                </div>
                <div className="text-base font-bold font-mono text-slate-800">
                  {shift.startTime} - {shift.endTime}
                </div>
                <div className="text-[10px] text-slate-400">Toleransi telat: {shift.lateToleranceMins} menit</div>
              </div>
            ))}
          </div>

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
                  <div key={swap.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {req?.fullName} ↔ {target?.fullName}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Tanggal: {swap.requestDate} tukar ke {swap.targetDate} · Alasan: {swap.reason}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        swap.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {swap.status}
                    </span>
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
                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3"
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

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePreviewCorrection(corr)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Preview Surat</span>
                      </button>

                      {corr.status === 'Menunggu' && (
                        <>
                          <button
                            type="button"
                            onClick={() => reviewAttendanceCorrection(corr.id, false)}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                          >
                            Tolak
                          </button>
                          <button
                            type="button"
                            onClick={() => reviewAttendanceCorrection(corr.id, true)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                          >
                            Setujui
                          </button>
                        </>
                      )}
                    </div>
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
                      <span className="font-bold text-slate-900">{emp?.fullName}</span>
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewCorrection(corr);
                      }}
                      className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        corr.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {corr.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== TAB 6: PENGATURAN PRESENSI ===================== */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Pengaturan Toleransi & Denda Presensi</h3>
            <p className="text-xs text-slate-500">Konfigurasi batas toleransi keterlambatan, nominal potongan, dan radius geofence GPS kantor.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Toleransi Keterlambatan Bebas Denda (Menit)
                </label>
                <input
                  type="number"
                  value={lateGracePeriod}
                  onChange={(e) => setLateGracePeriod(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Keterlambatan di bawah ini tidak dipotong denda</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nominal Denda Terlambat per Jam (IDR)
                </label>
                <input
                  type="number"
                  value={latePenaltyPerHour}
                  onChange={(e) => setLatePenaltyPerHour(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Dipotong otomatis di payroll bulanan</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Radius Geofencing GPS Kantor (Meter)
                </label>
                <input
                  type="number"
                  value={gpsRadius}
                  onChange={(e) => setGpsRadius(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Jarak maksimal presensi dari koordinat gedung</span>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="reqCam"
                  checked={requireCamera}
                  onChange={(e) => setRequireCamera(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4"
                />
                <label htmlFor="reqCam" className="font-medium text-slate-800 cursor-pointer">
                  Wajib Swafoto Kamera (Selfie Face Check)
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs"
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
                <label className="font-medium text-slate-700 block mb-1">Jenis Cuti *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-medium"
                >
                  <option value="Cuti Tahunan">Cuti Tahunan (Saldo 12 Hari)</option>
                  <option value="Cuti Sakit">Cuti Sakit (Disertai Surat Dokter)</option>
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
                    <option value="Izin Sakit Tanpa Rawat">Izin Sakit Tanpa Rawat</option>
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
    </div>
  );
};

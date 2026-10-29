import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  ShieldCheck,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Filter,
  Check,
  X,
  Search,
  UserCheck,
  ChevronRight,
  TrendingUp,
  FileText,
  Sparkles,
  Plane,
  Receipt,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import { ScrollableTabNav } from '../common/ScrollableTabNav';
import { formatRupiah } from '../../utils/taxCalculator';
import { ApprovalWorkflowItem, AttendanceRecord, Employee } from '../../types/hrms';

export const MssPortal: React.FC = () => {
  const {
    employees,
    attendance,
    currentTenant,
    currentUser,
    approvalItems,
    reviewApprovalItem,
    approvalDelegations,
    setApprovalDelegation,
    calendarEvents,
    openFilePreview,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'inbox' | 'monitoring' | 'cuti_tim' | 'delegasi'>('inbox');
  const [selectedMonitoringDate, setSelectedMonitoringDate] = useState('2026-10-22');

  const handlePreviewMonthlyAttendanceCutoff = (rec?: AttendanceRecord, employeeOverride?: Employee) => {
    const emp = employeeOverride || (rec ? employees.find((e) => e.id === rec.employeeId) : employees[0]);
    const empName = emp?.fullName || 'Karyawan';
    const empNik = emp?.nik || 'KR-2026-001';
    const empDept = emp?.department || 'Operasional';
    const empPosition = emp?.position || 'Staff';

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
        label: 'Terverifikasi Atasan & Tim HR',
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
      ],
      signeeName: currentUser.name || 'H. Budi Santoso, S.E., M.M.',
      signeeRole: 'Atasan Langsung & Head of Operations',
    });
  };
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<ApprovalWorkflowItem | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  // Delegation form state
  const [isDelegationActive, setIsDelegationActive] = useState(false);
  const [delegateToId, setDelegateToId] = useState(employees[1]?.id || '');
  const [delegationStartDate, setDelegationStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [delegationEndDate, setDelegationEndDate] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );

  // Team Subordinates: Get employees in the same department or subordinates
  const teamMembers = employees.slice(0, 8); // Demo team members
  const pendingApprovals = approvalItems.filter((item) => item.status === 'Menunggu');

  const filteredItems = pendingApprovals.filter((item) => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const requester = employees.find((e) => e.id === item.requesterId);
    const matchesSearch =
      (item?.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (requester?.fullName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (item?.department || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleApprove = (id: string, title: string) => {
    reviewApprovalItem(id, true, 'Disetujui oleh atasan langsung via MSS');
    setNoticeMessage(`Permohonan "${title}" berhasil disetujui.`);
    setSelectedItemIds((prev) => prev.filter((i) => i !== id));
  };

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    if (!rejectNotes.trim()) {
      alert('Alasan penolakan wajib diisi untuk catatan transparansi ke karyawan.');
      return;
    }

    reviewApprovalItem(rejectingItem.id, false, rejectNotes.trim());
    setNoticeMessage(`Permohonan "${rejectingItem.title}" telah ditolak dengan catatan.`);
    setRejectingItem(null);
    setRejectNotes('');
  };

  const handleBatchApprove = () => {
    if (selectedItemIds.length === 0) return;
    selectedItemIds.forEach((id) => {
      reviewApprovalItem(id, true, 'Disetujui massal via MSS Portal');
    });
    setNoticeMessage(`${selectedItemIds.length} pengajuan berhasil disetujui secara massal.`);
    setSelectedItemIds([]);
  };

  const handleToggleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.map((f) => f.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-200">
              Portal MSS
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              MSS (Manager Self-Service)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pusat kendali atasan tim: Persetujuan cuti, lembur, koreksi presensi bawahan, monitoring kehadiran langsung, serta delegasi wewenang.
          </p>
        </div>

        {/* Manager Info Badge */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl shrink-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
            MGR
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-900 leading-tight">
              {currentUser.name || 'Budi Santoso'}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Lead Manager · Divisi Operasional & Engineering
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

      {/* Team Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Total Anggota Tim</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{teamMembers.length} Orang</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Bawahan langsung</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Hadir Hari Ini</div>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">
            {teamMembers.length - 1} Orang
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tepat waktu & aktif</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Cuti / Dinas Luar</div>
          <div className="text-xl font-bold text-blue-600 mt-0.5">1 Orang</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tercatat izin sah</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Menunggu Approval Anda</div>
          <div className="text-xl font-bold text-rose-600 mt-0.5">
            {pendingApprovals.length} Berkas
          </div>
          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Perlu tindak lanjut</div>
        </div>
      </div>

      {/* Row 2: Standard Enterprise Scrollable Tab Navigation (With Icons) */}
      <ScrollableTabNav>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'inbox'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Inbox Persetujuan Tim (Pending Approval)</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'inbox'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {pendingApprovals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('monitoring')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'monitoring'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Monitoring Tim Atasan</span>
        </button>

        <button
          onClick={() => setActiveTab('cuti_tim')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'cuti_tim'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Jadwal & Saldo Cuti Tim</span>
        </button>

        <button
          onClick={() => setActiveTab('delegasi')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'delegasi'
              ? 'border-emerald-600 text-emerald-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Delegasi Wewenang Approver</span>
        </button>
      </ScrollableTabNav>

      {/* TAB 1: INBOX PERSETUJUAN TIM */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            {/* Search input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pengajuan, nama bawahan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 text-[11px] font-medium mr-1">Filter:</span>
              {[
                { id: 'all', label: 'Semua Kategori' },
                { id: 'Cuti', label: 'Cuti' },
                { id: 'Lembur', label: 'Lembur' },
                { id: 'Perbaikan Presensi', label: 'Koreksi Presensi' },
                { id: 'Perjalanan Dinas', label: 'SPPD' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    categoryFilter === c.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Batch Approve Button */}
            {selectedItemIds.length > 0 && (
              <button
                type="button"
                onClick={handleBatchApprove}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Setujui Terpilih ({selectedItemIds.length})</span>
              </button>
            )}
          </div>

          {/* Pending Approvals List Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-8">
                      <input
                        type="checkbox"
                        checked={
                          filteredItems.length > 0 &&
                          selectedItemIds.length === filteredItems.length
                        }
                        onChange={handleToggleSelectAll}
                        className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3 font-semibold">Pemohon (Bawahan)</th>
                    <th className="py-2.5 px-3 font-semibold">Kategori & Detail</th>
                    <th className="py-2.5 px-3 font-semibold">Tanggal Pengajuan</th>
                    <th className="py-2.5 px-3 font-semibold">Tingkat Approval</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Keputusan Anda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                        <span className="font-semibold block">Semua Pengajuan Tim Telah Selesai!</span>
                        <span className="text-[11px]">Tidak ada permohonan yang menunggu persetujuan Anda saat ini.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const requester = employees.find((e) => e.id === item.requesterId);
                      const isSelected = selectedItemIds.includes(item.id);

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isSelected ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOne(item.id)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">
                              {requester?.fullName || 'Karyawan Tim'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {requester?.nik || item.requesterId} · {item.department}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {item.category}
                              </span>
                              <span className="font-semibold text-slate-900">{item.title}</span>
                            </div>
                            {item.amount && (
                              <div className="text-[11px] font-mono font-bold text-emerald-600 mt-0.5">
                                Nominal: {formatRupiah(item.amount)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                            {item.submittedAt}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold">
                              Level {item.level} of {item.totalLevels}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApprove(item.id, item.title)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold shadow-xs flex items-center gap-1 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                <span>Setujui</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingItem(item);
                                  setRejectNotes('');
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 rounded text-[11px] font-bold transition-colors flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                <span>Tolak</span>
                              </button>
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
        </div>
      )}

      {/* TAB 2: MONITORING TIM ATASAN */}
      {activeTab === 'monitoring' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
            <div>
              <strong>Monitoring Tim Atasan:</strong> Pantau langsung status kehadiran bawahan langsung pada tanggal terpilih ({selectedMonitoringDate}), berikan dispensasi keterlambatan, atau klik kartu karyawan untuk melihat lembar rekapitulasi presensi cut-off.
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-semibold text-emerald-800">Tanggal:</span>
              <input
                type="date"
                value={selectedMonitoringDate}
                onChange={(e) => setSelectedMonitoringDate(e.target.value)}
                className="px-2.5 py-1.5 border border-emerald-300 rounded-lg bg-white font-mono text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {employees.map((emp) => {
              const todayRec = attendance.find((a) => a.employeeId === emp.id && a.date === selectedMonitoringDate);
              return (
                <div
                  key={emp.id}
                  onClick={() => {
                    const rec = todayRec || {
                      id: `temp-${emp.id}`,
                      tenantId: currentTenant.id,
                      employeeId: emp.id,
                      date: selectedMonitoringDate,
                      clockIn: '--:--',
                      clockOut: '--:--',
                      status: 'Hadir' as const,
                      lateMinutes: 0,
                      overtimeHours: 0,
                    };
                    handlePreviewMonthlyAttendanceCutoff(rec, emp);
                  }}
                  className="p-3.5 bg-white border border-slate-200 hover:border-emerald-400 rounded-lg shadow-xs space-y-2 cursor-pointer hover:shadow-sm transition-all group"
                  title="Klik untuk melihat Lembar Catatan Presensi Periode Cut-Off"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {emp.avatar ? (
                        <img src={emp.avatar} alt={emp.fullName} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                          {emp.fullName[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors text-xs">{emp.fullName}</div>
                        <div className="text-[10px] text-slate-500">
                          {emp.position} {emp.employmentType === 'Outsource' ? '· (Outsourcing)' : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
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
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                    </div>
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

      {/* TAB 3: MONITORING SALDO CUTI & BEBAN LEMBUR TIM */}
      {activeTab === 'cuti_tim' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">
                Transparansi Saldo Cuti & Jam Lembur Tim Bawahan
              </span>
              <span className="text-[11px] text-slate-500">
                Gunakan acuan ini saat mempertimbangkan permohonan cuti agar operasional tetap seimbang
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {teamMembers.map((emp) => (
                <div key={emp.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{emp.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{emp.nik} · {emp.position}</div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Sisa Cuti Tahunan:</span>
                      <span className="font-bold text-blue-600">{emp.annualLeaveBalance || 12} Hari</span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Total Lembur Bulan Ini:</span>
                      <span className="font-bold text-indigo-600">4.5 Jam</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => alert(`Detail riwayat absensi & cuti karyawan ${emp.fullName}`)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
                    >
                      Buka Riwayat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DELEGASI WEWENANG APPROVER */}
      {activeTab === 'delegasi' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs max-w-2xl space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Delegasi Wewenang Persetujuan (Approval Delegation)
            </h3>
          </div>

          <p className="text-slate-600 leading-relaxed">
            Jika Anda berencana cuti panjang atau melakukan perjalanan dinas ke luar kota/negeri, alihkan hak persetujuan kepada rekan manajer sejawat agar antrian permohonan tim bawahan tidak tertunda.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsDelegationActive(true);
              setNoticeMessage('Pengaturan delegasi approver berhasil diaktifkan.');
            }}
            className="space-y-3.5 pt-2"
          >
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Pilih Manajer Pengganti (Deputy Approver) *
              </label>
              <select
                value={delegateToId}
                onChange={(e) => setDelegateToId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.nik} - {e.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mulai Tanggal *</label>
                <input
                  type="date"
                  required
                  value={delegationStartDate}
                  onChange={(e) => setDelegationStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sampai Tanggal *</label>
                <input
                  type="date"
                  required
                  value={delegationEndDate}
                  onChange={(e) => setDelegationEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {isDelegationActive ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Check className="w-3.5 h-3.5" />
                  <span>Delegasi Sedang Aktif</span>
                </span>
              ) : (
                <span className="text-slate-400">Status: Tidak ada delegasi aktif</span>
              )}

              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs transition-colors"
              >
                Aktifkan Delegasi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REJECT NOTES MODAL */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-white" />
                  <span>Tolak Permohonan Tim</span>
                </h3>
                <span className="text-[11px] text-rose-100">{rejectingItem.title}</span>
              </div>
              <button
                onClick={() => setRejectingItem(null)}
                className="text-rose-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectConfirm} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Alasan Penolakan (Wajib Diisi) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Jadwal bertabrakan dengan sprint release critical / Lampiran nota tidak lengkap..."
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-rose-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Catatan ini akan dikirimkan langsung ke pemohon pada portal ESS mereka.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold shadow-xs"
                >
                  Konfirmasi Tolak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  Filter,
  Search,
  Calendar,
  UserX,
  Plus,
  Settings,
  FileText,
  X,
  ArrowRight,
  ShieldAlert,
  Eye,
  AlertCircle,
  History,
} from 'lucide-react';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { ValidatedDateInput } from '../common/ValidatedDateInput';
import { formatRupiah } from '../../utils/taxCalculator';
import { ApprovalWorkflowItem, ApprovalDelegation } from '../../types/hrms';
import { ScrollableTabNav } from '../common/ScrollableTabNav';

export const ApprovalCenter: React.FC = () => {
  const {
    employees,
    approvalItems,
    reviewApprovalItem,
    approvalDelegations,
    setApprovalDelegation,
    currentUser,
    openFilePreview,
  } = useHrms();

  const handlePreviewApprovalItem = (item: ApprovalWorkflowItem) => {
    const requester = employees.find((e) => e.id === item.requesterId);
    openFilePreview({
      title: `LEMBAR PENGAJUAN PERSETUJUAN: ${item.category.toUpperCase()}`,
      documentNumber: `REQ-${item.id.toUpperCase()}`,
      typeBadge: `Pusat Approval Tingkat ${item.level}/${item.totalLevels}`,
      date: item.submittedAt,
      partyName: requester?.fullName || 'Pemohon',
      partyRole: `${requester?.position || 'Staff'} · ${item.department}`,
      statusBadge: {
        label: item.status === 'Disetujui' ? 'Telah Disetujui' : item.status === 'Ditolak' ? 'Ditolak' : 'Menunggu Approval',
        variant: item.status === 'Disetujui' ? 'success' : item.status === 'Ditolak' ? 'danger' : 'warning',
      },
      detailsGrid: [
        { label: 'Kategori Pengajuan', value: item.category },
        { label: 'Judul Permohonan', value: item.title },
        { label: 'Pemohon', value: requester?.fullName || '-' },
        { label: 'NIK Pemohon', value: requester?.nik || '-' },
        { label: 'Tingkat Persetujuan', value: `Level ${item.level} dari ${item.totalLevels}` },
        { label: 'Nominal Terkait', value: item.amount ? formatRupiah(item.amount) : 'Non-Finansial' },
      ],
      contentParagraphs: [
        `Pengajuan "${item.title}" diajukan oleh ${requester?.fullName || '-'} pada tanggal ${item.submittedAt} melalui alur persetujuan bertingkat sistem NusaHR.`,
        `Catatan & Justifikasi Pemohon: "${item.notes || 'Permohonan telah sesuai dengan pedoman operasional dan SOP perusahaan.'}".`,
        `Dokumen ini siap ditindaklanjuti oleh pejabat berwenang atau delegasi pengganti yang sah.`,
      ],
      signeeName: currentUser.name,
      signeeRole: 'Pejabat Pemeriksa / Otoritas Approval',
    });
  };

  const [activeTab, setActiveTab] = useState<'inbox' | 'riwayat' | 'delegasi' | 'pengaturan'>('inbox');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Review Modal State
  const [selectedItem, setSelectedItem] = useState<ApprovalWorkflowItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

  // Delegation Modal State
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);
  const [principalId, setPrincipalId] = useState(employees[0]?.id || '');
  const [substituteId, setSubstituteId] = useState(employees[1]?.id || '');
  const [delegationStart, setDelegationStart] = useState('2026-10-20');
  const [delegationEnd, setDelegationEnd] = useState('2026-10-31');
  const [delegationReason, setDelegationReason] = useState('Cuti tahunan di luar kota / dinas');
  const [delegationError, setDelegationError] = useState<string | null>(null);

  // Feedback notice state
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Settings State
  const [slaHours, setSlaHours] = useState(48);
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);

  // Filtered Items
  const pendingItems = approvalItems.filter((i) => i.status === 'Menunggu');
  const historyItems = approvalItems.filter((i) => i.status !== 'Menunggu');

  const displayedItems = (activeTab === 'inbox' ? pendingItems : historyItems).filter((item) => {
    const requester = employees.find((e) => e.id === item.requesterId);
    const matchesSearch =
      (item?.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (requester?.fullName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (item?.department || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleExecuteReview = () => {
    if (!selectedItem) return;
    reviewApprovalItem(selectedItem.id, reviewAction === 'approve', reviewNotes);
    setSelectedItem(null);
    setReviewNotes('');
    setFeedbackMessage(
      `Pengajuan "${selectedItem.title}" berhasil ${reviewAction === 'approve' ? 'disetujui' : 'ditolak'}.`
    );
  };

  const handleCreateDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    setDelegationError(null);

    if (!principalId || !substituteId) {
      setDelegationError('Pilih pejabat utama dan pejabat pengganti delegasi.');
      return;
    }
    if (principalId === substituteId) {
      setDelegationError('Pejabat utama dan pengganti delegasi tidak boleh karyawan yang sama.');
      return;
    }
    if (!delegationStart || !delegationEnd) {
      setDelegationError('Tanggal mulai dan akhir delegasi wajib diisi.');
      return;
    }
    if (new Date(delegationEnd) < new Date(delegationStart)) {
      setDelegationError('Tanggal akhir delegasi tidak boleh sebelum tanggal mulai.');
      return;
    }

    setApprovalDelegation({
      principalId,
      substituteId,
      startDate: delegationStart,
      endDate: delegationEnd,
      reason: delegationReason,
      isActive: true,
    });

    setIsDelegationModalOpen(false);
    setFeedbackMessage('Delegasi approver pengganti berhasil diaktifkan.');
  };

  return (
    <div className="space-y-5">
      {/* Row 1: Module Header & Primary Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>Pusat Approval Bertingkat (Multi-tier Approval Hub)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Pusat persetujuan lintas modul: cuti, perbaikan presensi, lembur, pinjaman, SPPD, promosi, dan procurement dengan manajemen delegasi pengganti & batas waktu (SLA).
          </p>
        </div>

        <button
          onClick={() => setIsDelegationModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Atur Delegasi Approver</span>
        </button>
      </div>

      {/* Row 2: Enterprise Tab Navigation Bar (Not Parallel to Title) */}
      <ScrollableTabNav className="border-b border-slate-200" containerClassName="pt-1">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'inbox'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Kotak Masuk</span>
          {pendingItems.length > 0 && (
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
                activeTab === 'inbox'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {pendingItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('riwayat')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'riwayat'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Riwayat Putusan</span>
        </button>

        <button
          onClick={() => setActiveTab('delegasi')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'delegasi'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Pengganti Approver</span>
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
          <span>SLA & Pengaturan</span>
        </button>
      </ScrollableTabNav>

      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {(activeTab === 'inbox' || activeTab === 'riwayat') && (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Perlu Persetujuan Segera</span>
              <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
                {pendingItems.length} Pengajuan
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Memerlukan tanda tangan Anda</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Mendekati Batas SLA (24 Jam)</span>
              <span className="text-xl font-bold font-mono text-rose-700 tabular-nums">
                {pendingItems.filter((i) => i.level >= 1).length} Kritis
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Otomatis eskalasi jika lewat</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Telah Disetujui Bulan Ini</span>
              <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
                {historyItems.filter((i) => i.status === 'Disetujui').length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Semua proses operasional</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Delegasi Pengganti Aktif</span>
              <span className="text-xl font-bold font-mono text-indigo-700 tabular-nums">
                {approvalDelegations.filter((d) => d.isActive).length} Pejabat
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Menggantikan approver cuti</span>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="bg-white p-3 sm:p-3.5 border border-slate-200 rounded-xl shadow-xs space-y-2.5 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
            <div className="relative w-full lg:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari pengajuan, pemohon, atau departemen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50/70 focus:bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="all">Semua Kategori Pengajuan</option>
                <option value="Cuti">Cuti & Izin</option>
                <option value="Perbaikan Presensi">Perbaikan Presensi</option>
                <option value="Tukar Shift">Tukar Shift</option>
                <option value="Perjalanan Dinas">Perjalanan Dinas (SPPD)</option>
                <option value="Pinjaman">Pinjaman & Kasbon</option>
                <option value="Procurement PR">Procurement (PR/PO)</option>
                <option value="Promosi/Personalia">Promosi & Personalia</option>
              </select>

              {(searchQuery || categoryFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors shrink-0"
                  title="Reset Filter"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden space-y-3">
            {displayedItems.length > 0 ? (
              displayedItems.map((item) => {
                const requester = employees.find((e) => e.id === item.requesterId);
                return (
                  <div
                    key={`mob-${item.id}`}
                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3"
                  >
                    {/* Header: Category & Level */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.category === 'Cuti'
                            ? 'bg-blue-100 text-blue-800'
                            : item.category === 'Perbaikan Presensi'
                            ? 'bg-purple-100 text-purple-800'
                            : item.category === 'Pinjaman'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.category === 'Perjalanan Dinas'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
                          Tingkat {item.level}/{item.totalLevels}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'Disetujui'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'Ditolak'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h4>
                      {item.notes && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded mt-1.5 border border-slate-100">
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    {/* Requester & Meta Grid */}
                    <div className="p-2.5 bg-slate-50/80 rounded-lg space-y-1.5 border border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        {requester?.avatar ? (
                          <img
                            src={requester.avatar}
                            alt={requester.fullName}
                            className="w-5 h-5 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                            {(requester?.fullName || 'K')[0]}
                          </div>
                        )}
                        <span className="font-semibold text-slate-800">{requester?.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({requester?.nik})</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                        <span>Divisi: {item.department}</span>
                        <span className="flex items-center gap-1 font-mono text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {item.submittedAt}
                        </span>
                      </div>
                      {item.amount && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500 font-sans">Nominal Terkait:</span>
                          <span className="font-mono font-bold text-indigo-700">
                            {formatRupiah(item.amount)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePreviewApprovalItem(item)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Preview Berkas</span>
                      </button>

                      {item.status === 'Menunggu' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(item);
                              setReviewAction('reject');
                            }}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(item);
                              setReviewAction('approve');
                            }}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                Tidak ada pengajuan yang memerlukan tindakan pada saat ini.
              </div>
            )}
          </div>

          {/* TAMPILAN DESKTOP: List Row (>= md) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs divide-y divide-slate-100">
            {displayedItems.length > 0 ? (
              displayedItems.map((item) => {
                const requester = employees.find((e) => e.id === item.requesterId);
                return (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex flex-row items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.category === 'Cuti'
                              ? 'bg-blue-100 text-blue-800'
                              : item.category === 'Perbaikan Presensi'
                              ? 'bg-purple-100 text-purple-800'
                              : item.category === 'Pinjaman'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.category === 'Perjalanan Dinas'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.category}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded font-mono text-slate-600">
                          Tingkat {item.level} dari {item.totalLevels}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          {requester?.avatar ? (
                            <img
                              src={requester.avatar}
                              alt={requester.fullName}
                              className="w-5 h-5 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                              {(requester?.fullName || 'K')[0]}
                            </div>
                          )}
                          <span className="font-semibold text-slate-800">{requester?.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({requester?.nik})</span>
                        </div>
                        <span>·</span>
                        <span>Divisi: {item.department}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Diajukan: {item.submittedAt}</span>
                        </span>
                        {item.amount && (
                          <>
                            <span>·</span>
                            <span className="font-mono font-bold text-slate-900">
                              Nominal: {formatRupiah(item.amount)}
                            </span>
                          </>
                        )}
                      </div>

                      {item.notes && (
                        <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200/80 max-w-2xl">
                          Catatan: {item.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handlePreviewApprovalItem(item)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Lihat Berkas / Preview Pengajuan Resmi"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Preview</span>
                      </button>

                      {item.status === 'Menunggu' ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setReviewAction('reject');
                            }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setReviewAction('approve');
                            }}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded text-xs font-semibold ${
                            item.status === 'Disetujui'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Tidak ada pengajuan yang memerlukan tindakan pada saat ini.
              </div>
            )}
          </div>
        </>
      )}

      {/* Delegasi Pengganti Approver Tab */}
      {activeTab === 'delegasi' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Daftar Pejabat Pengganti (Substitute Approver Delegation)
              </h3>
              <p className="text-xs text-slate-500">
                Ketika atasan langsung atau manajer sedang cuti / dinas luar kota, hak approval secara otomatis dialihkan ke pejabat pengganti tanpa menghambat SLA.
              </p>
            </div>
            <button
              onClick={() => setIsDelegationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pengganti</span>
            </button>
          </div>

          {/* Delegasi Mobile Adaptive Cards */}
          <div className="md:hidden space-y-3">
            {approvalDelegations.length > 0 ? (
              approvalDelegations.map((del) => {
                const principal = employees.find((e) => e.id === del.principalId);
                const substitute = employees.find((e) => e.id === del.substituteId);
                return (
                  <div key={`del-mob-${del.id}`} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                        Delegasi Aktif
                      </span>
                      <button
                        onClick={() => setFeedbackMessage('Delegasi approver dinonaktifkan')}
                        className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded font-medium"
                      >
                        Hentikan
                      </button>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="font-semibold text-slate-900">{principal?.fullName} (Pejabat Utama)</div>
                      <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span>{substitute?.fullName} (Pengganti)</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200">
                      <div>Periode: <b>{del.startDate}</b> s/d <b>{del.endDate}</b></div>
                      <div>Alasan: {del.reason}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada delegasi approver aktif. Klik tombol "Tambah Pengganti" untuk menambahkan.
              </div>
            )}
          </div>

          {/* Delegasi Desktop List */}
          <div className="hidden md:block divide-y divide-slate-100">
            {approvalDelegations.length > 0 ? (
              approvalDelegations.map((del) => {
                const principal = employees.find((e) => e.id === del.principalId);
                const substitute = employees.find((e) => e.id === del.substituteId);
                return (
                  <div key={del.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{principal?.fullName}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-indigo-700">{substitute?.fullName} (Pengganti)</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                          Aktif
                        </span>
                      </div>
                      <div className="text-slate-500">
                        Periode: {del.startDate} s/d {del.endDate} · Alasan: {del.reason}
                      </div>
                    </div>

                    <button
                      onClick={() => setFeedbackMessage('Delegasi approver dinonaktifkan')}
                      className="px-2.5 py-1 text-slate-500 hover:text-rose-600 border border-slate-200 rounded font-medium"
                    >
                      Hentikan
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada delegasi approver aktif. Klik tombol "Tambah Pengganti" untuk menambahkan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings & SLA Tab */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Pengaturan SLA & Eskalasi Approval Bertingkat
            </h3>
            <p className="text-xs text-slate-500">
              Konfigurasi batas waktu tanggapan (Service Level Agreement) agar proses kerja tidak tertahan di salah satu tingkat approval.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <label className="font-semibold text-slate-800 block">
                Batas Waktu Tanggapan Maksimal (SLA dalam Jam)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  value={slaHours}
                  onChange={(e) => setSlaHours(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
                />
                <span className="text-slate-500">Jam (Default: 48 jam / 2 hari kerja)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Auto-Eskalasi Jika Melebihi Batas SLA
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Jika atasan tingkat 1 tidak merespons dalam batas waktu, tiket otomatis dieskalasikan ke Head of Department
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoEscalate}
                  onChange={(e) => setAutoEscalate(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Notifikasi Real-time WhatsApp & Email
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Kirim reminder langsung ke ponsel approver setiap ada tiket baru masuk
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyWhatsApp}
                  onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setFeedbackMessage('Pengaturan SLA berhasil diperbarui')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs"
              >
                Simpan Konfigurasi SLA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Putusan Review */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedItem(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  {reviewAction === 'approve' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">{selectedItem.title}</span>
              </div>
              <button onClick={() => setSelectedItem(null)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pemohon:</span>
                  <span className="font-semibold text-slate-900">
                    {employees.find((e) => e.id === selectedItem.requesterId)?.fullName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tingkat Approval:</span>
                  <span className="font-semibold text-indigo-700">
                    Level {selectedItem.level} of {selectedItem.totalLevels}
                  </span>
                </div>
                {selectedItem.amount && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nominal:</span>
                    <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedItem.amount)}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Catatan / Alasan Putusan {reviewAction === 'reject' && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  required={reviewAction === 'reject'}
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Catatan persetujuan (opsional)...'
                      : 'Tuliskan alasan penolakan untuk perbaikan pemohon...'
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReview}
                  className={`px-4 py-2 text-white rounded font-semibold shadow-xs ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Konfirmasi Putusan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delegasi Approver */}
      {isDelegationModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDelegationModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Penugasan Pejabat Pengganti (Delegasi Approver)</h3>
                <span className="text-[11px] text-slate-400">Pengalihan wewenang approval sementara</span>
              </div>
              <button onClick={() => setIsDelegationModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateDelegation} className="p-5 space-y-4 text-xs">
              {/* Form Validation Error Notice */}
              {delegationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{delegationError}</span>
                </div>
              )}

              <EmployeeSelect
                label="Pejabat Utama yang Berhalangan (Principal) *"
                required
                employees={employees}
                value={principalId}
                onChange={(val) => {
                  setPrincipalId(val);
                  if (delegationError) setDelegationError(null);
                }}
              />

              <EmployeeSelect
                label="Pejabat Pengganti yang Ditunjuk (Substitute Approver) *"
                required
                employees={employees}
                value={substituteId}
                onChange={(val) => {
                  setSubstituteId(val);
                  if (delegationError) setDelegationError(null);
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <ValidatedDateInput
                  id="delegationStart"
                  label="Mulai Tanggal *"
                  value={delegationStart}
                  onChange={(val) => {
                    setDelegationStart(val);
                    if (delegationError) setDelegationError(null);
                  }}
                  required
                  helperText="Format YYYY-MM-DD"
                />
                <ValidatedDateInput
                  id="delegationEnd"
                  label="Sampai Tanggal *"
                  value={delegationEnd}
                  minDate={delegationStart}
                  onChange={(val) => {
                    setDelegationEnd(val);
                    if (delegationError) setDelegationError(null);
                  }}
                  required
                  helperText="Format YYYY-MM-DD"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Alasan Penugasan Delegasi *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Sedang mengambil cuti tahunan / dinas luar kota..."
                  value={delegationReason}
                  onChange={(e) => {
                    setDelegationReason(e.target.value);
                    if (delegationError) setDelegationError(null);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDelegationModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold shadow-xs"
                >
                  Aktifkan Delegasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

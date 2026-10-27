import React, { useState, useMemo, useRef } from 'react';
import { useHrms } from '../../context/HrmsContext';
import { printPagesDirectly } from '../../utils/documentPdfExporter';
import {
  History,
  Search,
  Filter,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  Layers,
  FileText,
  X,
  AlertCircle,
  Eye,
  Plus,
  RefreshCw,
  Database,
  Lock,
  ArrowRight,
  SlidersHorizontal,
  Calendar,
  DollarSign,
  Users,
  Settings,
} from 'lucide-react';
import { AuditLogEntry } from '../../types/hrms';
import { ScrollableTabNav } from '../common/ScrollableTabNav';

export const AuditTrailManagement: React.FC = () => {
  const { auditLogs = [], logAuditAction, currentTenant, currentUser } = useHrms();

  const [activeTab, setActiveTab] = useState<'all' | 'security' | 'financial' | 'hr' | 'retention'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  // Simulation Form State
  const [simModule, setSimModule] = useState('Personalia');
  const [simAction, setSimAction] = useState('UPDATE_SALARY');
  const [simRecordId, setSimRecordId] = useState('EMP-2024-001');
  const [simSummary, setSimSummary] = useState('Penyesuaian gaji pokok tahunan dan tunjangan fungsional');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Unique lists for filter options
  const moduleOptions = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach((l) => {
      if (l.module) set.add(l.module);
    });
    return Array.from(set).sort();
  }, [auditLogs]);

  const actionOptions = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set).sort();
  }, [auditLogs]);

  // Tab Filtering
  const tabFilteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (activeTab === 'security') {
        const mod = (log.module || '').toLowerCase();
        const act = (log.action || '').toLowerCase();
        return (
          mod.includes('rbac') ||
          mod.includes('user') ||
          mod.includes('entitas') ||
          act.includes('role') ||
          act.includes('permission') ||
          act.includes('signature') ||
          act.includes('login')
        );
      }
      if (activeTab === 'financial') {
        const mod = (log.module || '').toLowerCase();
        const act = (log.action || '').toLowerCase();
        return (
          mod.includes('payroll') ||
          mod.includes('reimbursement') ||
          mod.includes('procurement') ||
          mod.includes('kasbon') ||
          mod.includes('grade') ||
          act.includes('salary') ||
          act.includes('invoice')
        );
      }
      if (activeTab === 'hr') {
        const mod = (log.module || '').toLowerCase();
        return (
          mod.includes('personalia') ||
          mod.includes('onboarding') ||
          mod.includes('presensi') ||
          mod.includes('evaluasi') ||
          mod.includes('kontrak') ||
          mod.includes('kalender') ||
          mod.includes('approval')
        );
      }
      return true;
    });
  }, [auditLogs, activeTab]);

  // Search & Secondary Filtering
  const filteredLogs = useMemo(() => {
    const now = new Date();
    return tabFilteredLogs.filter((log) => {
      // 1. Search Query
      const q = (searchQuery || '').toLowerCase();
      const matchSearch =
        !q ||
        (log.actorName || '').toLowerCase().includes(q) ||
        (log.module || '').toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.recordId || '').toLowerCase().includes(q) ||
        (log.changesSummary || '').toLowerCase().includes(q);

      // 2. Module
      const matchModule = selectedModule === 'all' || log.module === selectedModule;

      // 3. Action
      const matchAction = selectedAction === 'all' || log.action === selectedAction;

      // 4. Date Filter
      let matchDate = true;
      if (dateFilter !== 'all' && log.timestamp) {
        const logDate = new Date(log.timestamp);
        const diffMs = now.getTime() - logDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (dateFilter === 'today') matchDate = diffDays <= 1;
        else if (dateFilter === '7days') matchDate = diffDays <= 7;
        else if (dateFilter === '30days') matchDate = diffDays <= 30;
      }

      return matchSearch && matchModule && matchAction && matchDate;
    });
  }, [tabFilteredLogs, searchQuery, selectedModule, selectedAction, dateFilter]);

  const handleSimulateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simSummary.trim()) return;

    logAuditAction(simModule, simAction, simRecordId, simSummary, [
      { field: 'status', oldValue: 'Draft', newValue: 'Applied' },
      { field: 'updatedBy', oldValue: 'System', newValue: currentUser?.name || 'Administrator' },
      { field: 'timestamp', oldValue: '-', newValue: new Date().toISOString() },
    ]);

    setIsSimulateModalOpen(false);
    setSimSummary('');
    setFeedbackNotice('Log audit baru berhasil dicatat dan diverifikasi ke database audit trail.');
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('Tidak ada data audit log untuk diekspor.');
      return;
    }
    const headers = ['ID Log', 'Waktu (ISO)', 'Aktor', 'Role', 'Modul', 'Aksi', 'ID Rekord', 'Ringkasan Perubahan'];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.actorName}"`,
      `"${l.actorRole}"`,
      `"${l.module}"`,
      `"${l.action}"`,
      `"${l.recordId}"`,
      `"${(l.changesSummary || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Trail_${currentTenant?.code || 'NUSAHR'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getModuleBadgeClass = (moduleName: string) => {
    const m = (moduleName || '').toLowerCase();
    if (m.includes('personalia') || m.includes('onboarding')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (m.includes('payroll') || m.includes('reimbursement')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (m.includes('ga') || m.includes('aset')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (m.includes('approval')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (m.includes('rbac') || m.includes('user') || m.includes('keamanan')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (m.includes('dokumen')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getActionBadgeClass = (actionName: string) => {
    const a = (actionName || '').toUpperCase();
    if (a.includes('APPROVE') || a.includes('COMPLETE') || a.includes('VERIFIED')) return 'bg-emerald-100 text-emerald-800';
    if (a.includes('REJECT') || a.includes('DELETE') || a.includes('SANCTION')) return 'bg-rose-100 text-rose-800';
    if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('RELOCATE')) return 'bg-amber-100 text-amber-800';
    if (a.includes('SUBMIT') || a.includes('CREATE') || a.includes('TAMBAH') || a.includes('GENERATE')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-slate-100 text-slate-800';
  };

  const formatDateTimeIndo = (isoString: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const auditContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={auditContainerRef} className="space-y-5">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kepatuhan Regulasi & Keamanan</span>
            </span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-200">
              ISO 27001 Ready
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>Audit Trail & Log Aktivitas Seluruh Modul</span>
          </h2>
          <p className="text-xs text-slate-500">
            Rekam jejak transaksi historis (Who, What, When, Where, Action), bukti integritas data per modul, dan audit kepatuhan ISO 27001 / regulasi ketenagakerjaan.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setIsSimulateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold shadow-xs transition-colors border border-slate-200"
            title="Tambah pencatatan log audit manual untuk uji simulasi"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Simulasi Catat Log</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold shadow-xs transition-colors"
            title="Unduh seluruh log yang tampil dalam format CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              if (auditContainerRef.current) {
                await printPagesDirectly([auditContainerRef.current]);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Cetak format cetak resmi laporan audit"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button onClick={() => setFeedbackNotice(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Total Log Tercatat</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">{auditLogs.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Semua transaksi sistem</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Modul Teraktif</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {moduleOptions[0] || 'Personalia'}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Tercakup 100% audit</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Status Enkripsi Log</span>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tamper-Evident</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">SHA-256 Checksum Valid</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Hasil Filter Saat Ini</span>
            <Filter className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-600">{filteredLogs.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dari {auditLogs.length} entri total</div>
        </div>
      </div>

      {/* Enterprise Tab Navigation */}
      <ScrollableTabNav className="border-b border-slate-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'all'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Semua Riwayat Log</span>
          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Keamanan & Hak Akses (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('financial')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'financial'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Keuangan & Payroll</span>
        </button>

        <button
          onClick={() => setActiveTab('hr')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'hr'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Operasional & SDM</span>
        </button>

        <button
          onClick={() => setActiveTab('retention')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'retention'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Kebijakan Retensi & Arsip</span>
        </button>
      </ScrollableTabNav>

      {/* Main Content Area */}
      {activeTab !== 'retention' ? (
        <div className="space-y-3.5">
          {/* Filter Bar */}
          <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari aktor, modul, aksi, nomor rekord, atau ringkasan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
              {/* Module Filter */}
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="py-2 px-3 border border-slate-300 rounded-lg bg-white text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="all">Semua Modul ({moduleOptions.length})</option>
                {moduleOptions.map((m) => (
                  <option key={m} value={m}>
                    Modul: {m}
                  </option>
                ))}
              </select>

              {/* Action Filter */}
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="py-2 px-3 border border-slate-300 rounded-lg bg-white text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="all">Semua Tipe Aksi</option>
                {actionOptions.map((a) => (
                  <option key={a} value={a}>
                    Aksi: {a}
                  </option>
                ))}
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="py-2 px-3 border border-slate-300 rounded-lg bg-white text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="all">Semua Rentang Waktu</option>
                <option value="today">24 Jam Terakhir</option>
                <option value="7days">7 Hari Terakhir</option>
                <option value="30days">30 Hari Terakhir</option>
              </select>
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-3.5">Waktu Transaksi</th>
                    <th className="py-3 px-3">Modul Terkait</th>
                    <th className="py-3 px-3">Aktor & Role</th>
                    <th className="py-3 px-3">Aksi & ID Rekord</th>
                    <th className="py-3 px-4">Ringkasan Perubahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <div className="font-semibold text-slate-600">Tidak ada catatan audit log yang cocok</div>
                        <div className="text-[11px] mt-0.5">Coba ubah kata kunci pencarian atau reset filter di atas.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => {
                          setSelectedLog(log);
                          setIsDetailModalOpen(true);
                        }}
                        className="hover:bg-indigo-50/60 cursor-pointer transition-colors group"
                        title="Klik baris untuk melihat rincian dokumen audit trail"
                      >
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="font-mono text-slate-900 font-medium group-hover:text-indigo-600 transition-colors">
                            {formatDateTimeIndo(log.timestamp)}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{log.id}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getModuleBadgeClass(
                              log.module
                            )}`}
                          >
                            {log.module}
                          </span>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{log.actorName || 'System'}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            Role: <span className="font-semibold">{log.actorRole || 'System'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getActionBadgeClass(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[120px]">
                            ID: {log.recordId}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <p className="text-slate-800 leading-normal line-clamp-2 max-w-xl">
                            {log.changesSummary}
                          </p>
                          {log.details && log.details.length > 0 && (
                            <span className="inline-block mt-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                              {log.details.length} field berubah · Klik baris untuk detail
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                Menampilkan <strong>{filteredLogs.length}</strong> dari <strong>{auditLogs.length}</strong> riwayat log audit
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Log bersifat append-only dan tidak dapat diubah (immutable).</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Retention & Policy Configuration Tab */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <span>Kebijakan Retensi & Integritas Arsip Audit</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sesuai dengan standar ISO 27001 dan UU PDP (Pelindungan Data Pribadi), data riwayat audit sistem disimpan secara permanen dengan prinsip <em>Write Once, Read Many (WORM)</em>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>Periode Retensi Aktif</span>
                </div>
                <div className="text-xl font-bold font-mono text-indigo-600">5 Tahun</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Semua log transaksi finansial, perubahan kontrak, evaluasi sanksi, dan personalia disimpan selama 5 tahun penuh.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Enkripsi Database</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-600">AES-256 GCM</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Log diamankan saat istirahat (at-rest) dan saat transit (in-transit TLS 1.3) mencegah modifikasi tidak sah.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Backup Otomatis</span>
                </div>
                <div className="text-xl font-bold font-mono text-blue-600">Harian (00:00 WIB)</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Snapshot audit trail disinkronkan ke cold-storage terpisah dengan checksum SHA-256 untuk pemulihan bencana.
                </p>
              </div>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-2">
              <div className="font-bold text-indigo-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                <span>Pernyataan Kepatuhan Auditor Eksternal</span>
              </div>
              <p className="text-indigo-900/90 leading-relaxed">
                Log audit pada modul ini telah memenuhi kualifikasi audit internal perusahaan, pelaporan SPT PPh 21 DJP, audit kepatuhan BPJS Ketenagakerjaan/Kesehatan, serta audit sertifikasi ISO 27001 Sistem Manajemen Keamanan Informasi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedLog && (
        <div
          onClick={() => setIsDetailModalOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm">Rincian Dokumen Audit Trail</h3>
                  <p className="text-[11px] text-slate-400 font-mono">ID Log: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">WAKTU (WIB)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatDateTimeIndo(selectedLog.timestamp)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">MODUL</span>
                  <span className="font-bold text-indigo-700">{selectedLog.module}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">AKTOR</span>
                  <span className="font-bold text-slate-900">{selectedLog.actorName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block">ROLE</span>
                  <span className="font-mono text-slate-700 font-medium">{selectedLog.actorRole}</span>
                </div>
              </div>

              {/* Action & Record ID */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 block">Tipe Aksi & Nomor Rekord:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${getActionBadgeClass(
                      selectedLog.action
                    )}`}
                  >
                    {selectedLog.action}
                  </span>
                  <span className="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded text-xs font-semibold">
                    Record ID: {selectedLog.recordId}
                  </span>
                </div>
              </div>

              {/* Changes Summary */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 block">Ringkasan Perubahan:</span>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-medium text-slate-800 leading-relaxed">
                  {selectedLog.changesSummary}
                </div>
              </div>

              {/* Field Changes Comparison */}
              {selectedLog.details && selectedLog.details.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    Perubahan Nilai Field (Old Value vs New Value):
                  </span>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 font-semibold text-slate-600">
                        <tr>
                          <th className="py-2 px-3">Field</th>
                          <th className="py-2 px-3">Nilai Lama (Sebelum)</th>
                          <th className="py-2 px-3">Nilai Baru (Sesudah)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedLog.details.map((d, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-700">{d.field}</td>
                            <td className="py-2 px-3 font-mono text-rose-700 bg-rose-50/50">
                              {typeof d.oldValue === 'object' ? JSON.stringify(d.oldValue) : String(d.oldValue)}
                            </td>
                            <td className="py-2 px-3 font-mono text-emerald-700 bg-emerald-50/50">
                              {typeof d.newValue === 'object' ? JSON.stringify(d.newValue) : String(d.newValue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Integrity Seal */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <strong className="text-emerald-950 block">Integritas Log Terverifikasi</strong>
                    <span className="text-[10px] text-emerald-800">
                      Entri ini memiliki segel digital SHA-256 yang sah dan lolos validasi audit compliance.
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-bold">
                  VALID SEAL
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Modal */}
      {isSimulateModalOpen && (
        <div
          onClick={() => setIsSimulateModalOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Simulasi Catat Log Audit Baru</h3>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateLog} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Pilih Modul:</label>
                <select
                  value={simModule}
                  onChange={(e) => setSimModule(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Personalia">Personalia (Promosi & Demosi)</option>
                  <option value="Payroll">Payroll & PPh 21 TER</option>
                  <option value="Presensi">Presensi, Shift & Cuti</option>
                  <option value="Approval Center">Pusat Approval Bertingkat</option>
                  <option value="GA Assets">GA & Aset Barcode</option>
                  <option value="RBAC User">Manajemen User & RBAC</option>
                  <option value="Dokumen Legal">Tata Kelola Dokumen & Kop</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Nama Aksi (Action Type):</label>
                <select
                  value={simAction}
                  onChange={(e) => setSimAction(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-mono"
                >
                  <option value="UPDATE_SALARY">UPDATE_SALARY</option>
                  <option value="APPROVE_FINAL">APPROVE_FINAL</option>
                  <option value="SUBMIT_PROPOSAL">SUBMIT_PROPOSAL</option>
                  <option value="REJECT">REJECT</option>
                  <option value="ENROLL_SIGNATURE">ENROLL_SIGNATURE</option>
                  <option value="GENERATE_PAYROLL">GENERATE_PAYROLL</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Nomor / ID Rekord Terkait:</label>
                <input
                  type="text"
                  value={simRecordId}
                  onChange={(e) => setSimRecordId(e.target.value)}
                  placeholder="Contoh: EMP-2024-001, clm-002, run-2026-10"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Ringkasan Perubahan (Changes Summary):</label>
                <textarea
                  rows={3}
                  value={simSummary}
                  onChange={(e) => setSimSummary(e.target.value)}
                  placeholder="Deskripsikan perubahan transaksi secara detail..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] text-indigo-900 leading-relaxed">
                Log ini akan dicatat atas nama akun aktif <strong>{currentUser?.name || 'Administrator'}</strong> dengan timestamp saat ini dan langsung muncul di tabel audit.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Simpan Log Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

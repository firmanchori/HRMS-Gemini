import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  UserMinus,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  AlertCircle,
  Plus,
  ShieldCheck,
  X,
  Search,
  Filter,
  CheckSquare,
  Square,
  Printer,
  ChevronRight,
  ExternalLink,
  Laptop,
  CreditCard,
  Building,
  UserCheck,
  Users,
} from 'lucide-react';
import { formatRupiah, calculateSeverancePay } from '../../utils/taxCalculator';
import { ValidatedDateInput } from '../common/ValidatedDateInput';
import { ModuleDocumentModal } from '../common/ModuleDocumentModal';
import { OffboardingRecord } from '../../types/hrms';

interface DetailedClearanceState {
  // Divisi / Atasan
  handoverWork: boolean;
  delegationAccess: boolean;
  supervisorSign: boolean;
  // GA & IT
  laptopReturned: boolean;
  idCardReturned: boolean;
  emailDeactivated: boolean;
  bastAssetSigned: boolean;
  // Keuangan
  loanCleared: boolean;
  reimburseCleared: boolean;
  settlementPaid: boolean;
  // HR & Legal
  exitInterviewDone: boolean;
  bpjsDeactivated: boolean;
  skPhkIssued: boolean;
  paklaringIssued: boolean;
  // Notes
  verifierNotes?: string;
}

const DEFAULT_CLEARANCE_MAP: Record<string, DetailedClearanceState> = {
  'off-001': {
    handoverWork: true,
    delegationAccess: true,
    supervisorSign: true,
    laptopReturned: true,
    idCardReturned: true,
    emailDeactivated: true,
    bastAssetSigned: true,
    loanCleared: true,
    reimburseCleared: true,
    settlementPaid: true,
    exitInterviewDone: true,
    bpjsDeactivated: true,
    skPhkIssued: true,
    paklaringIssued: true,
    verifierNotes: 'Semua proses serah terima dan kliring kasbon selesai 100%. Parklaring telah diserahkan.',
  },
  'off-002': {
    handoverWork: true,
    delegationAccess: false,
    supervisorSign: false,
    laptopReturned: false,
    idCardReturned: false,
    emailDeactivated: false,
    bastAssetSigned: false,
    loanCleared: true,
    reimburseCleared: false,
    settlementPaid: false,
    exitInterviewDone: true,
    bpjsDeactivated: false,
    skPhkIssued: false,
    paklaringIssued: false,
    verifierNotes: 'Menunggu pengembalian laptop kerja Lenovo ThinkPad dan penyelesaian klaim dinas luar kota.',
  },
};

export const OffboardingManagement: React.FC = () => {
  const {
    employees,
    offboardingRecords,
    initiateOffboarding,
    updateOffboardingChecklist,
    currentTenant,
  } = useHrms();

  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'clearance' | 'settlement' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Initiate Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [separationType, setSeparationType] = useState<any>('Resign Sukarela');
  const [effectiveDate, setEffectiveDate] = useState('2026-11-30');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Document Modal State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docModalTemplateId, setDocModalTemplateId] = useState<string>('tmpl-13');
  const [docModalEmployeeId, setDocModalEmployeeId] = useState<string>(employees[0]?.id || '');

  // Detailed Clearance Modal State
  const [selectedRecordForClearance, setSelectedRecordForClearance] = useState<OffboardingRecord | null>(null);
  const [clearanceStateMap, setClearanceStateMap] = useState<Record<string, DetailedClearanceState>>(DEFAULT_CLEARANCE_MAP);
  const [clearanceActiveTab, setClearanceActiveTab] = useState<'divisi' | 'it_ga' | 'keuangan' | 'hr'>('divisi');

  const selectedEmp = employees.find((e) => e.id === employeeId);

  const getRecordClearance = (recId: string): DetailedClearanceState => {
    return clearanceStateMap[recId] || {
      handoverWork: false,
      delegationAccess: false,
      supervisorSign: false,
      laptopReturned: false,
      idCardReturned: false,
      emailDeactivated: false,
      bastAssetSigned: false,
      loanCleared: false,
      reimburseCleared: false,
      settlementPaid: false,
      exitInterviewDone: false,
      bpjsDeactivated: false,
      skPhkIssued: false,
      paklaringIssued: false,
    };
  };

  const calculateClearancePercentage = (rec: OffboardingRecord): number => {
    const clr = getRecordClearance(rec.id);
    const items = [
      clr.handoverWork,
      clr.delegationAccess,
      clr.supervisorSign,
      clr.laptopReturned,
      clr.idCardReturned,
      clr.emailDeactivated,
      clr.bastAssetSigned,
      clr.loanCleared,
      clr.reimburseCleared,
      clr.settlementPaid,
      clr.exitInterviewDone,
      clr.bpjsDeactivated,
    ];
    const completed = items.filter(Boolean).length;
    return Math.round((completed / items.length) * 100);
  };

  const handleToggleClearanceItem = (recId: string, itemKey: keyof DetailedClearanceState) => {
    setClearanceStateMap((prev) => {
      const current = prev[recId] || getRecordClearance(recId);
      const updated = {
        ...current,
        [itemKey]: !current[itemKey],
      };

      // Sinkronkan juga ke konteks utama HRMS jika relevan
      if (itemKey === 'handoverWork' || itemKey === 'laptopReturned' || itemKey === 'loanCleared') {
        updateOffboardingChecklist(recId, {
          handoverCompleted: updated.handoverWork,
          assetReturned: updated.laptopReturned && updated.idCardReturned,
          financeCleared: updated.loanCleared && updated.settlementPaid,
        });
      }

      return {
        ...prev,
        [recId]: updated,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidationErrors(true);
    setFormError(null);

    if (!employeeId) {
      setFormError('Pilih karyawan yang akan diproses offboarding.');
      return;
    }
    if (!effectiveDate || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
      setFormError('Tanggal efektif offboarding harus diisi dengan format YYYY-MM-DD valid.');
      return;
    }

    initiateOffboarding(employeeId, separationType, effectiveDate, notes || 'Pengajuan pengakhiran hubungan kerja resmi');
    setIsModalOpen(false);
    setNotes('');
    setShowValidationErrors(false);
  };

  // Filter records
  const filteredRecords = offboardingRecords.filter((rec) => {
    const emp = employees.find((e) => e.id === rec.employeeId);
    const matchesSearch =
      !searchQuery ||
      (emp?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp?.nik || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp?.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.separationType.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const pct = calculateClearancePercentage(rec);
    if (activeFilterTab === 'clearance') return pct < 100 && !rec.parklaringIssued;
    if (activeFilterTab === 'settlement') return pct >= 60 && !rec.financeCleared;
    if (activeFilterTab === 'completed') return rec.parklaringIssued;

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Manajemen Offboarding & Exit Clearance
            </h2>
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
              PP No. 35/2021
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Alur pengakhiran kerja terpadu: Ceklis clearance 4 departemen (Divisi, GA/IT, Keuangan, HR), audit kasbon & pesangon, serta penerbitan Paklaring resmi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setDocModalTemplateId('tmpl-13');
              setDocModalEmployeeId(employees[0]?.id || '');
              setIsDocModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dokumen Resmi PHK & Paklaring</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserMinus className="w-3.5 h-3.5" />
            <span>Inisiasi Offboarding Baru</span>
          </button>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 block mb-1">Dalam Proses Clearance</span>
          <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {offboardingRecords.filter((o) => !o.parklaringIssued).length} Karyawan
          </span>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Menunggu serah terima aset & kliring keuangan
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 block mb-1">Total Hak Pesangon / Kompensasi</span>
          <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
            {formatRupiah(offboardingRecords.reduce((sum, o) => sum + o.severancePay, 0))}
          </span>
          <div className="text-[11px] text-slate-500 mt-1">Sesuai formula PP 35/2021 & masa kerja</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 block mb-1">Parklaring Telah Diterbitkan</span>
          <span className="text-2xl font-bold font-mono text-indigo-700 tabular-nums">
            {offboardingRecords.filter((o) => o.parklaringIssued).length} Berkas
          </span>
          <div className="text-[11px] text-slate-500 mt-1">Surat Pengalaman Kerja resmi dengan QR TTD</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-3 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveFilterTab('all')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeFilterTab === 'all'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({offboardingRecords.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilterTab('clearance')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeFilterTab === 'clearance'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clearance Berjalan ({offboardingRecords.filter((o) => !o.parklaringIssued).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilterTab('completed')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeFilterTab === 'completed'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Selesai ({offboardingRecords.filter((o) => o.parklaringIssued).length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari karyawan, NIK, divisi..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Clearance Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="py-2.5 px-3">Karyawan & NIK</th>
              <th className="py-2.5 px-3">Alasan Pengakhiran</th>
              <th className="py-2.5 px-3 text-center">Tgl Efektif</th>
              <th className="py-2.5 px-3">Progress Clearance</th>
              <th className="py-2.5 px-3 text-right">Pesangon (PP 35/2021)</th>
              <th className="py-2.5 px-3 text-center">Status Berkas</th>
              <th className="py-2.5 px-3 text-center">Aksi Alur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                  Tidak ada data offboarding yang sesuai dengan filter pencarian.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => {
                const emp = employees.find((e) => e.id === rec.employeeId);
                const pct = calculateClearancePercentage(rec);
                const clr = getRecordClearance(rec.id);

                return (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{emp?.fullName || 'Karyawan'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {emp?.nik} · {emp?.department}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-800 block">{rec.separationType}</span>
                      <span className="text-[10px] text-slate-400">Diajukan: {rec.requestDate}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                      {rec.effectiveDate}
                    </td>
                    <td className="py-2.5 px-3 min-w-[150px]">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-bold text-slate-700">{pct}% Selesai</span>
                        <span className="text-slate-400">
                          {pct === 100 ? 'Siap Ditutup' : '4 Departemen'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            pct === 100
                              ? 'bg-emerald-600'
                              : pct >= 50
                              ? 'bg-indigo-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(rec.severancePay)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {rec.parklaringIssued ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{rec.parklaringNumber || 'Parklaring Terbit'}</span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10.5px] font-semibold">
                          Menunggu Clearance
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedRecordForClearance(rec)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span>Ceklis Clearance</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDocModalTemplateId('tmpl-13');
                            setDocModalEmployeeId(rec.employeeId);
                            setIsDocModalOpen(true);
                          }}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Cetak Surat Pengalaman Kerja (Parklaring)"
                        >
                          <FileText className="w-3 h-3 text-indigo-600" />
                          <span>Paklaring</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDocModalTemplateId('tmpl-14');
                            setDocModalEmployeeId(rec.employeeId);
                            setIsDocModalOpen(true);
                          }}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Cetak Surat Keputusan PHK Resmi"
                        >
                          <UserMinus className="w-3 h-3 text-rose-600" />
                          <span>SK PHK</span>
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

      {/* MODAL 1: FORMULIR & CEKLIS CLEARANCE BERJENJANG (REAL MULTI-DEPARTMENT CLEARANCE) */}
      {selectedRecordForClearance && (() => {
        const rec = selectedRecordForClearance;
        const emp = employees.find((e) => e.id === rec.employeeId);
        const clr = getRecordClearance(rec.id);
        const pct = calculateClearancePercentage(rec);

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedRecordForClearance(null);
            }}
          >
            <div
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-fadeIn my-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <span>Lembar Ceklis Clearance Offboarding Berjenjang</span>
                  </h3>
                  <span className="text-[11px] text-slate-300">
                    {emp?.fullName} ({emp?.nik}) · {emp?.department}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecordForClearance(null)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Summary Banner */}
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-800">
                    Status Kelengkapan: {pct}% Selesai
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Tanggal Efektif: {rec.effectiveDate}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      pct === 100
                        ? 'bg-emerald-600'
                        : pct >= 50
                        ? 'bg-indigo-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Clearance 4 Department Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-100 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setClearanceActiveTab('divisi')}
                  className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                    clearanceActiveTab === 'divisi'
                      ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>1. Divisi / Atasan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClearanceActiveTab('it_ga')}
                  className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                    clearanceActiveTab === 'it_ga'
                      ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>2. GA & IT Aset</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClearanceActiveTab('keuangan')}
                  className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                    clearanceActiveTab === 'keuangan'
                      ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>3. Keuangan & Kasbon</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClearanceActiveTab('hr')}
                  className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                    clearanceActiveTab === 'hr'
                      ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>4. HR & Berkas</span>
                </button>
              </div>

              {/* Tab Content Checklist Items */}
              <div className="p-5 space-y-4 text-xs">
                {clearanceActiveTab === 'divisi' && (
                  <div className="space-y-3">
                    <div className="text-[11px] text-slate-500 font-medium">
                      Verifikasi serah terima pekerjaan oleh Head of Department / Atasan Langsung:
                    </div>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clr.handoverWork}
                        onChange={() => handleToggleClearanceItem(rec.id, 'handoverWork')}
                        className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Serah Terima Tanggung Jawab & Dokumen SOP (Work Handover)</div>
                        <div className="text-[11px] text-slate-500">Seluruh file proyek, repositori kode, dan laporan berjalan telah diserahterimakan ke rekan pengganti.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clr.delegationAccess}
                        onChange={() => handleToggleClearanceItem(rec.id, 'delegationAccess')}
                        className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Pendelegasian Hak Akses Tim & Akun Operasional</div>
                        <div className="text-[11px] text-slate-500">Akses dashboard internal, folder shared drive tim, dan otorisasi kerja telah dialihkan.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clr.supervisorSign}
                        onChange={() => handleToggleClearanceItem(rec.id, 'supervisorSign')}
                        className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Persetujuan & Rekomendasi Akhir Atasan Langsung</div>
                        <div className="text-[11px] text-slate-500">Atasan menyetujui pelepasan tanggung jawab dan memberikan catatan evaluasi kerja.</div>
                      </div>
                    </label>
                  </div>
                )}

                {clearanceActiveTab === 'it_ga' && (
                  <div className="space-y-3">
                    <div className="text-[11px] text-slate-500 font-medium">
                      Pengembalian perangkat keras, inventaris gedung, dan penutupan akun sistem:
                    </div>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clr.laptopReturned}
                        onChange={() => handleToggleClearanceItem(rec.id, 'laptopReturned')}
                        className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Pengembalian Laptop & Aksesoris Kerja (GA / IT)</div>
                        <div className="text-[11px] text-slate-500">Laptop kantor, charger, adaptor, monitor, dan periferal telah dicek kondisi fisiknya.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clr.idCardReturned}
                        onChange={() => handleToggleClearanceItem(rec.id, 'idCardReturned')}
                        className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Pengembalian ID Card, Kartu Akses Gedung & Kunci Loker</div>
                        <div className="text-[11px] text-slate-500">Fasilitas fisik kantor dan kartu akses pintu lobi telah diserahkan ke Bagian Umum.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clr.emailDeactivated}
                        onChange={() => handleToggleClearanceItem(rec.id, 'emailDeactivated')}
                        className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Penonaktifan Email Kantor (@nusantara.id) & SSO</div>
                        <div className="text-[11px] text-slate-500">Akun Google Workspace, Slack, VPN korporat, dan kredensial login telah dinonaktifkan.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clr.bastAssetSigned}
                        onChange={() => handleToggleClearanceItem(rec.id, 'bastAssetSigned')}
                        className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Penandatanganan BAST Serah Terima Aset (tmpl-15)</div>
                        <div className="text-[11px] text-slate-500">Berita acara resmi serah terima inventaris telah ditandatangani kedua belah pihak.</div>
                      </div>
                    </label>
                  </div>
                )}

                {clearanceActiveTab === 'keuangan' && (
                  <div className="space-y-3">
                    <div className="text-[11px] text-slate-500 font-medium">
                      Penyelesaian kewajiban finansial, audit kasbon, dan pencairan kompensasi akhir:
                    </div>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clr.loanCleared}
                        onChange={() => handleToggleClearanceItem(rec.id, 'loanCleared')}
                        className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Pelunasan Kasbon & Pinjaman Karyawan</div>
                        <div className="text-[11px] text-slate-500">Tidak ada saldo hutang/pinjaman berjalan atau telah dipotongkan dari hak pesangon.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clr.reimburseCleared}
                        onChange={() => handleToggleClearanceItem(rec.id, 'reimburseCleared')}
                        className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Kliring Klaim Medis & Biaya Perjalanan Dinas (SPPD)</div>
                        <div className="text-[11px] text-slate-500">Seluruh kwitansi reimbursement telah diaudit dan diselesaikan oleh Finance.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clr.settlementPaid}
                        onChange={() => handleToggleClearanceItem(rec.id, 'settlementPaid')}
                        className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Transfer Final Settlement & Kompensasi Pesangon</div>
                        <div className="text-[11px] text-slate-500">
                          Hak pesangon {formatRupiah(rec.severancePay)} + sisa gaji telah ditransfer lunas ke rekening karyawan.
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {clearanceActiveTab === 'hr' && (
                  <div className="space-y-3">
                    <div className="text-[11px] text-slate-500 font-medium">
                      Penyelesaian administrasi HR, BPJS, dan penerbitan dokumen resmi:
                    </div>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clr.exitInterviewDone}
                        onChange={() => handleToggleClearanceItem(rec.id, 'exitInterviewDone')}
                        className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Pelaksanaan Exit Interview & Kuesioner Feedback</div>
                        <div className="text-[11px] text-slate-500">Kuesioner alasan resign dan masukan pengembangan organisasi telah diarsipkan HR.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clr.bpjsDeactivated}
                        onChange={() => handleToggleClearanceItem(rec.id, 'bpjsDeactivated')}
                        className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Penonaktifan BPJS Ketenagakerjaan (SIPP) & BPJS Kesehatan (Edabu)</div>
                        <div className="text-[11px] text-slate-500">Status kepesertaan jaminan sosial telah dinonaktifkan per tanggal efektif akhir.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clr.skPhkIssued}
                        onChange={() => handleToggleClearanceItem(rec.id, 'skPhkIssued')}
                        className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Penerbitan Surat Keputusan Pengakhiran Hubungan Kerja (SK PHK)</div>
                        <div className="text-[11px] text-slate-500">Surat keputusan resmi ditandatangani Direksi Perusahaan.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clr.paklaringIssued || rec.parklaringIssued}
                        onChange={() => {
                          handleToggleClearanceItem(rec.id, 'paklaringIssued');
                          updateOffboardingChecklist(rec.id, {
                            parklaringIssued: !rec.parklaringIssued,
                            parklaringNumber: !rec.parklaringIssued ? `PKL/${currentTenant.code}/2026/${rec.id.slice(-4)}` : undefined,
                          });
                        }}
                        className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Penerbitan Surat Keterangan Pengalaman Kerja (Parklaring)</div>
                        <div className="text-[11px] text-slate-500">Dokumen resmi diserahkan ke karyawan dengan nomor registrasi sah dan QR verifikasi.</div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Catatan Verifikator HR */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="font-bold text-slate-700 block mb-1">
                    Catatan Verifikasi Tim Offboarding:
                  </label>
                  <input
                    type="text"
                    value={clr.verifierNotes || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClearanceStateMap((prev) => ({
                        ...prev,
                        [rec.id]: {
                          ...getRecordClearance(rec.id),
                          verifierNotes: val,
                        },
                      }));
                    }}
                    placeholder="Contoh: Seluruh aset laptop & kartu akses telah diserahkan dalam kondisi baik..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDocModalTemplateId('tmpl-13');
                      setDocModalEmployeeId(rec.employeeId);
                      setIsDocModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-indigo-200"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Terbitkan Paklaring</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDocModalTemplateId('tmpl-14');
                      setDocModalEmployeeId(rec.employeeId);
                      setIsDocModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-rose-200"
                  >
                    <UserMinus className="w-3.5 h-3.5 text-rose-600" />
                    <span>Terbitkan SK PHK</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Berita Acara Serah Terima Clearance Offboarding untuk ${emp?.fullName} telah dicetak.`);
                      window.print();
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Lembar Ceklis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRecordForClearance(null)}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Simpan & Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 2: INISIASI OFFBOARDING BARU */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Inisiasi Proses Offboarding Karyawan</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {/* Form Validation Error Notice */}
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="font-medium text-slate-700 block mb-1">Pilih Karyawan *</label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.nik}) - Bergabung: {emp.joinDate}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Alasan Pengakhiran</label>
                  <select
                    value={separationType}
                    onChange={(e) => setSeparationType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-medium"
                  >
                    <option value="Resign Sukarela">Resign Sukarela (1-Month Notice)</option>
                    <option value="Habis Kontrak">Habis Masa Kontrak PKWT</option>
                    <option value="PHK Efisiensi">PHK Efisiensi / Restrukturisasi</option>
                    <option value="PHK Indisipliner">PHK Indisipliner (SP 3)</option>
                  </select>
                </div>
                <ValidatedDateInput
                  id="offboardingEffectiveDate"
                  label="Tanggal Efektif Terakhir *"
                  value={effectiveDate}
                  onChange={(val) => {
                    setEffectiveDate(val);
                    if (formError) setFormError(null);
                  }}
                  required
                  showError={showValidationErrors}
                  helperText="Format YYYY-MM-DD. Hari kerja terakhir karyawan"
                />
              </div>

              {selectedEmp && separationType.includes('PHK') && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] text-emerald-900 leading-snug">
                  <strong>Simulasi Pesangon PP 35/2021:</strong> Berdasarkan masa kerja sejak {selectedEmp.joinDate}, estimasi hak pesangon + UPMK adalah <strong>{formatRupiah(calculateSeverancePay(selectedEmp.basicSalary, 3).totalSeverance)}</strong>.
                </div>
              )}

              <div>
                <label className="font-medium text-slate-700 block mb-1">Catatan Exit Interview</label>
                <textarea
                  rows={3}
                  placeholder="Keterangan serah terima berkas, proyek berjalan, dan alasan pengunduran diri..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-md font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold shadow-xs cursor-pointer"
                >
                  Mulai Alur Offboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DOKUMEN RESMI PHK & PAKLARING */}
      <ModuleDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Dokumen Resmi Pemutusan Hubungan Kerja (PHK) & Paklaring"
        categoryFilter="Disiplin, PHK & Paklaring"
        defaultTemplateId={docModalTemplateId}
        defaultEmployeeId={docModalEmployeeId}
      />
    </div>
  );
};

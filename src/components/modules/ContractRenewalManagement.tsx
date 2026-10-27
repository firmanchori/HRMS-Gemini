import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  UserX,
  X,
  Plus,
  Search,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { ValidatedDateInput } from '../common/ValidatedDateInput';
import { CurrencyInput } from '../common/CurrencyInput';
import { formatRupiah } from '../../utils/taxCalculator';
import { ModuleDocumentModal } from '../common/ModuleDocumentModal';

export const ContractRenewalManagement: React.FC = () => {
  const {
    employees,
    contractReviews,
    submitContractReview,
    reviewContractReview,
    currentUser,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'monitoring' | 'history'>('monitoring');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [recommendation, setRecommendation] = useState<'Perpanjang PKWT' | 'Alih Status PKWTT (Tetap)' | 'Tidak Diperpanjang'>('Perpanjang PKWT');
  const [newDurationMonths, setNewDurationMonths] = useState(12);
  const [effectiveDate, setEffectiveDate] = useState('2026-12-01');
  const [newSalary, setNewSalary] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // PKWT employees
  const contractEmployees = employees.filter((e) => e.employmentType === 'Kontrak' || e.contractEndDate);

  const calculateHMinus = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate).getTime();
    const now = Date.now();
    return Math.ceil((end - now) / (1000 * 3600 * 24));
  };

  const handleOpenReview = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setNewSalary(emp.basicSalary);
    }
    setFormError(null);
    setShowValidationErrors(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidationErrors(true);
    setFormError(null);

    if (!selectedEmpId) {
      setFormError('Pilih karyawan kontrak yang akan dievaluasi.');
      return;
    }
    if (!effectiveDate || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
      setFormError('Tanggal efektif keputusan kontrak baru tidak valid (format YYYY-MM-DD).');
      return;
    }
    if (!notes.trim()) {
      setFormError('Catatan rekomendasi evaluasi wajib diisi sebagai dasar persetujuan.');
      return;
    }

    const emp = employees.find((e) => e.id === selectedEmpId);
    submitContractReview({
      employeeId: selectedEmpId,
      currentContractEnd: emp?.contractEndDate || '2026-11-30',
      recommendation,
      newDurationMonths: recommendation === 'Perpanjang PKWT' ? newDurationMonths : undefined,
      notes: `${notes.trim()}${newSalary > 0 ? ` [Usulan Gaji Baru: ${formatRupiah(newSalary)}]` : ''}`,
    });

    setIsModalOpen(false);
    setSelectedEmpId('');
    setNotes('');
    setShowValidationErrors(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200">
              Modul 12B
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Manajemen Perpanjangan Kontrak (PKWT)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring masa berakhir kontrak PKWT H-30, alur persetujuan perpanjangan, alih status tetap, atau terminasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDocModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Dokumen Resmi Kontrak & PKWT</span>
          </button>
          <button
            onClick={() => {
              setSelectedEmpId('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Review Kontrak Baru</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-2">
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'monitoring'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Monitoring Kontrak Jatuh Tempo (H-30)</span>
          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px]">
            {contractEmployees.length} Karyawan
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Riwayat Keputusan & Penerbitan Dokumen</span>
          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px]">
            {contractReviews.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Monitoring H-30 */}
      {activeTab === 'monitoring' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Daftar Karyawan PKWT Berdasarkan Sisa Masa Berlaku Kontrak
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {contractEmployees.map((emp) => {
              const diffDays = calculateHMinus(emp.contractEndDate || '2026-11-30');
              const isUrgent = diffDays !== null && diffDays <= 30 && diffDays >= 0;
              const isExpired = diffDays !== null && diffDays < 0;

              return (
                <div key={emp.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {emp.avatar ? (
                      <img src={emp.avatar} alt={emp.fullName} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {emp.fullName.charAt(0)}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{emp.fullName}</span>
                        <span className="text-xs font-mono text-slate-500">({emp.nik})</span>
                        {isUrgent && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Sisa {diffDays} Hari
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded text-[10px] font-semibold">
                            Kadaluarsa (Perlu Tindakan)
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-0.5">
                        {emp.position} • {emp.department} • No. Kontrak: {emp.contractDocNumber || '-'}
                      </div>
                      <div className="text-xs text-slate-700 mt-1">
                        Masa Berlaku: {emp.contractStartDate} s.d. <b>{emp.contractEndDate || '30 Nov 2026'}</b>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReview(emp.id)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Review & Putuskan</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {contractEmployees.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada karyawan dengan status kontrak PKWT.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: History & Approvals */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Riwayat Keputusan Review Kontrak PKWT
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {contractReviews.map((rev) => {
              const emp = employees.find((e) => e.id === rev.employeeId);

              return (
                <div key={rev.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {emp?.fullName || 'Karyawan'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rev.recommendation === 'Perpanjang PKWT'
                          ? 'bg-blue-100 text-blue-800'
                          : rev.recommendation === 'Alih Status PKWTT (Tetap)'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {rev.recommendation}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 max-w-xl">
                      Catatan: "{rev.notes}"
                    </p>

                    <div className="text-[11px] text-slate-400 mt-1">
                      Kontrak Berakhir: {rev.currentContractEnd}
                      {rev.newDurationMonths && ` • Durasi Baru: ${rev.newDurationMonths} Bulan`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {rev.status === 'Menunggu Approval' ? (
                      <>
                        <button
                          onClick={() => reviewContractReview(rev.id, true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Approve & Terbitkan SK/Kontrak
                        </button>
                        <button
                          onClick={() => reviewContractReview(rev.id, false)}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                        >
                          Tolak
                        </button>
                      </>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Telah Disetujui ({rev.status})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {contractReviews.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada review perpanjangan kontrak yang dicatat.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Form Review Kontrak */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden cursor-default"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="font-bold text-slate-900 text-sm">
                Formulir Rekomendasi Kontrak PKWT
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Form Validation Error Notice */}
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Karyawan Kontrak *
                </label>
                <EmployeeSelect
                  employees={employees}
                  selectedEmployeeId={selectedEmpId}
                  onSelect={(id) => {
                    setSelectedEmpId(id);
                    const emp = employees.find((e) => e.id === id);
                    if (emp) setNewSalary(emp.basicSalary);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Pilih karyawan PKWT..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Keputusan / Rekomendasi *
                  </label>
                  <select
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600 font-medium bg-white"
                  >
                    <option value="Perpanjang PKWT">Perpanjang PKWT (Masa Kerja Lanjut)</option>
                    <option value="Alih Status PKWTT (Tetap)">Alih Status jadi Karyawan Tetap (PKWTT)</option>
                    <option value="Tidak Diperpanjang">Tidak Diperpanjang (Lanjut ke Offboarding)</option>
                  </select>
                </div>

                <ValidatedDateInput
                  id="contractEffectiveDate"
                  label="Tanggal Efektif Berlaku *"
                  value={effectiveDate}
                  onChange={(val) => {
                    setEffectiveDate(val);
                    if (formError) setFormError(null);
                  }}
                  required
                  showError={showValidationErrors}
                  helperText="Format YYYY-MM-DD"
                />
              </div>

              {recommendation === 'Perpanjang PKWT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durasi Perpanjangan Kontrak Baru *
                  </label>
                  <select
                    value={newDurationMonths}
                    onChange={(e) => setNewDurationMonths(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600 bg-white"
                  >
                    <option value={6}>6 Bulan</option>
                    <option value={12}>12 Bulan (1 Tahun)</option>
                    <option value={24}>24 Bulan (2 Tahun)</option>
                  </select>
                </div>
              )}

              {recommendation !== 'Tidak Diperpanjang' && (
                <div>
                  <CurrencyInput
                    id="newContractSalary"
                    label="Penyesuaian Gaji Baru (Opsional, IDR)"
                    value={newSalary}
                    onChange={(val) => setNewSalary(val)}
                    showTerbilang={false}
                    helperText="Kosongkan atau biarkan sama jika tidak ada penyesuaian gaji"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Rekomendasi Evaluasi *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Alasan perpanjangan atau pertimbangan pengangkatan tetap..."
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-blue-600 ${
                    showValidationErrors && !notes.trim()
                      ? 'border-rose-500 bg-rose-50/20'
                      : 'border-slate-300'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Kirim ke Approval Direksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Document Modal: Perjanjian Kerja & Kontrak */}
      <ModuleDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Pusat Dokumen Resmi Perjanjian Kerja & Kontrak (PKWT/PKWTT/Addendum)"
        categoryFilter={['Perjanjian Kerja & Kontrak', 'Magang Industri']}
        defaultTemplateId="tmpl-1"
      />
    </div>
  );
};

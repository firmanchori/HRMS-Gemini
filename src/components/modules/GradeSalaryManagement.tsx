import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  TrendingUp,
  Plus,
  DollarSign,
  Layers,
  History,
  CheckCircle2,
  AlertCircle,
  Edit3,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { CurrencyInput } from '../common/CurrencyInput';
import { ValidatedDateInput } from '../common/ValidatedDateInput';
import { validateDateString } from '../../utils/dateValidator';

export const GradeSalaryManagement: React.FC = () => {
  const {
    gradeSalaryRanges,
    addGradeSalaryRange,
    updateGradeSalaryRange,
    currentTenant,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'table' | 'history'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [gradeForm, setGradeForm] = useState({
    gradeCode: '',
    gradeName: '',
    minSalary: 8000000,
    midSalary: 12000000,
    maxSalary: 16000000,
    effectiveDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleOpenEdit = (grade: typeof gradeSalaryRanges[0]) => {
    setEditingGradeId(grade.id);
    setFormError(null);
    setGradeForm({
      gradeCode: grade.gradeCode,
      gradeName: grade.gradeName,
      minSalary: grade.minSalary,
      midSalary: grade.midSalary,
      maxSalary: grade.maxSalary,
      effectiveDate: grade.effectiveDate,
      notes: grade.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeForm.gradeCode.trim()) {
      setFormError('Kode Grade wajib diisi');
      return;
    }
    if (!gradeForm.gradeName.trim()) {
      setFormError('Nama Posisi / Deskripsi Band wajib diisi');
      return;
    }
    const checkDate = validateDateString(gradeForm.effectiveDate);
    if (!checkDate.isValid) {
      setFormError(checkDate.errorMessage || 'Tanggal Efektif tidak valid');
      return;
    }
    if (gradeForm.minSalary <= 0) {
      setFormError('Gaji Minimum harus lebih dari Rp 0');
      return;
    }
    if (gradeForm.midSalary < gradeForm.minSalary) {
      setFormError('Gaji Midpoint tidak boleh lebih kecil dari Gaji Minimum');
      return;
    }
    if (gradeForm.maxSalary < gradeForm.midSalary) {
      setFormError('Gaji Maksimum tidak boleh lebih kecil dari Gaji Midpoint');
      return;
    }

    setFormError(null);
    if (editingGradeId) {
      updateGradeSalaryRange(editingGradeId, {
        gradeCode: gradeForm.gradeCode,
        gradeName: gradeForm.gradeName,
        minSalary: Number(gradeForm.minSalary),
        midSalary: Number(gradeForm.midSalary),
        maxSalary: Number(gradeForm.maxSalary),
        effectiveDate: gradeForm.effectiveDate,
        notes: gradeForm.notes,
      });
    } else {
      addGradeSalaryRange({
        gradeCode: gradeForm.gradeCode,
        gradeName: gradeForm.gradeName,
        minSalary: Number(gradeForm.minSalary),
        midSalary: Number(gradeForm.midSalary),
        maxSalary: Number(gradeForm.maxSalary),
        effectiveDate: gradeForm.effectiveDate,
        version: 1,
        notes: gradeForm.notes,
      });
    }

    setIsModalOpen(false);
    setEditingGradeId(null);
    setGradeForm({
      gradeCode: '',
      gradeName: '',
      minSalary: 8000000,
      midSalary: 12000000,
      maxSalary: 16000000,
      effectiveDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-200">
              Modul 07B
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Grade Jabatan & Struktur Range Gaji
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Matriks rentang gaji (Min - Mid - Max) ber-versi per tanggal efektif, dasar acuan Kalkulator Offering & Personalia
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGradeId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah / Revisi Grade Gaji</span>
        </button>
      </div>

      {/* Tabs: Sleek Horizontal Scrollable Pill Strip */}
      <div className="w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 border-b border-slate-200">
        <div className="inline-flex gap-2 whitespace-nowrap">
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'table'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tabel Range Gaji Aktif</span>
            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px]">
              {gradeSalaryRanges.length} Level
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
            <History className="w-4 h-4" />
            <span>Riwayat Versi Tabel & Tanggal Berlaku</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Grade Table */}
      {activeTab === 'table' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Struktur Skala Upah Resmi ({currentTenant.name})
              </span>
              <span className="text-[11px] text-slate-500">
                Dasar penetapan offering gaji dan analisis kesetaraan internal
              </span>
            </div>
            <span className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              UMR Wilayah Acuan: <b className="text-slate-900">Rp {currentTenant.umr.toLocaleString('id-ID')}</b>
            </span>
          </div>

          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden space-y-3">
            {gradeSalaryRanges.map((g) => {
              const spread = Math.round(((g.maxSalary - g.minSalary) / g.minSalary) * 100);
              return (
                <div
                  key={`mob-grade-${g.id}`}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3"
                >
                  {/* Header: Grade & Edit Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-mono font-bold">
                        {g.gradeCode}
                      </span>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{g.gradeName}</h4>
                        <span className="text-[10px] text-slate-400">Efektif: {g.effectiveDate}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(g)}
                      className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg text-xs font-semibold inline-flex items-center gap-1 border border-slate-200"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {g.notes && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {g.notes}
                    </p>
                  )}

                  {/* 3-Box Salary Matrix Strip */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Minimum</span>
                      <span className="font-mono font-bold text-slate-800 text-[11px]">
                        Rp {(g.minSalary / 1000000).toFixed(1)}jt
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                        {g.minSalary.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-center">
                      <span className="text-[10px] text-emerald-700 block mb-0.5 font-semibold">Median (Mid)</span>
                      <span className="font-mono font-bold text-emerald-800 text-[11px]">
                        Rp {(g.midSalary / 1000000).toFixed(1)}jt
                      </span>
                      <span className="text-[9px] text-emerald-600 block mt-0.5 font-mono">
                        {g.midSalary.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Maksimum</span>
                      <span className="font-mono font-bold text-slate-800 text-[11px]">
                        Rp {(g.maxSalary / 1000000).toFixed(1)}jt
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                        {g.maxSalary.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Spread Footer */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">Rentang Rentang (Spread):</span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-mono font-bold text-[11px] border border-indigo-200">
                      {spread}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TAMPILAN DESKTOP: Table View (>= md) */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Nama Posisi / Job Band</th>
                    <th className="py-3 px-4 text-right">Gaji Minimum</th>
                    <th className="py-3 px-4 text-right">Gaji Median (Mid)</th>
                    <th className="py-3 px-4 text-right">Gaji Maksimum</th>
                    <th className="py-3 px-4">Spread (%)</th>
                    <th className="py-3 px-4">Tanggal Efektif</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {gradeSalaryRanges.map((g) => {
                    const spread = Math.round(((g.maxSalary - g.minSalary) / g.minSalary) * 100);

                    return (
                      <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-emerald-800">
                          <span className="px-2 py-0.5 bg-emerald-100 rounded text-xs font-mono">
                            {g.gradeCode}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{g.gradeName}</div>
                          {g.notes && <div className="text-[11px] text-slate-400 mt-0.5">{g.notes}</div>}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                          Rp {g.minSalary.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                          Rp {g.midSalary.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                          Rp {g.maxSalary.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-500">
                          {spread}%
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {g.effectiveDate}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleOpenEdit(g)}
                            className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded text-xs font-medium inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
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

      {/* Tab 2: Version History */}
      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 max-w-2xl">
          <div className="font-bold text-slate-900 text-sm">
            Prinsip Versioning Struktur Skala Upah
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Setiap kali tabel grade dan range gaji diperbarui (misalnya karena penyesuaian UMR tahunan atau inflasi), versi lama tetap tersimpan sebagai arsip kepatuhan audit. Penawaran offering kerja dan kenaikan gaji historis merujuk pada versi tabel yang berlaku saat tanggal transaksi tersebut terjadi.
          </p>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 text-xs">
            <div className="p-3.5 bg-slate-50 flex items-center justify-between font-semibold text-slate-700">
              <span>Versi Tabel</span>
              <span>Tanggal Berlaku</span>
              <span>Status</span>
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <b>Versi 2.0 (Skala Upah 2026)</b>
                <div className="text-[11px] text-slate-400">Penyesuaian kenaikan grade L1-D1 pasca restrukturisasi</div>
              </div>
              <span className="font-mono text-slate-600">01 Jan 2026</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                Berlaku Aktif
              </span>
            </div>
            <div className="p-3.5 flex items-center justify-between bg-slate-50/40">
              <div>
                <b className="text-slate-600">Versi 1.0 (Skala Upah 2025)</b>
                <div className="text-[11px] text-slate-400">Struktur awal pendirian korporat</div>
              </div>
              <span className="font-mono text-slate-500">01 Jan 2025</span>
              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold text-[10px]">
                Diarsipkan
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah/Edit Grade */}
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
                {editingGradeId ? 'Edit Range Gaji Grade' : 'Tambah Grade Baru'}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="p-5 space-y-4">
              {/* Form Validation Error Notice */}
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Grade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: L4 atau M2"
                    value={gradeForm.gradeCode}
                    onChange={(e) => {
                      setGradeForm({ ...gradeForm, gradeCode: e.target.value.toUpperCase() });
                      if (formError) setFormError(null);
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-mono font-bold"
                  />
                </div>

                <ValidatedDateInput
                  id="gradeEffectiveDate"
                  label="Tanggal Efektif *"
                  value={gradeForm.effectiveDate}
                  onChange={(val) => {
                    setGradeForm({ ...gradeForm, effectiveDate: val });
                    if (formError) setFormError(null);
                  }}
                  required
                  helperText="Tanggal berlaku struktur grade"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Posisi / Deskripsi Band *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Principal Specialist / Expert"
                  value={gradeForm.gradeName}
                  onChange={(e) => {
                    setGradeForm({ ...gradeForm, gradeName: e.target.value });
                    if (formError) setFormError(null);
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-bold text-slate-800 block">Rentang Gaji Pokok (Salary Range)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <CurrencyInput
                    id="gradeMinSalary"
                    label="Gaji Minimum (Rp) *"
                    value={gradeForm.minSalary}
                    onChange={(val) => {
                      setGradeForm({ ...gradeForm, minSalary: val });
                      if (formError) setFormError(null);
                    }}
                    showTerbilang={false}
                    required
                    min={1000000}
                    helperText="Batas bawah band"
                  />
                  <CurrencyInput
                    id="gradeMidSalary"
                    label="Gaji Midpoint (Rp) *"
                    value={gradeForm.midSalary}
                    onChange={(val) => {
                      setGradeForm({ ...gradeForm, midSalary: val });
                      if (formError) setFormError(null);
                    }}
                    showTerbilang={false}
                    required
                    min={gradeForm.minSalary}
                    helperText="Target median band"
                  />
                  <CurrencyInput
                    id="gradeMaxSalary"
                    label="Gaji Maksimum (Rp) *"
                    value={gradeForm.maxSalary}
                    onChange={(val) => {
                      setGradeForm({ ...gradeForm, maxSalary: val });
                      if (formError) setFormError(null);
                    }}
                    showTerbilang={false}
                    required
                    min={gradeForm.midSalary}
                    helperText="Batas atas band"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kualifikasi / Catatan Grade
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pengalaman 8+ tahun, keahlian arsitektur sistem tingkat tinggi..."
                  value={gradeForm.notes}
                  onChange={(e) => setGradeForm({ ...gradeForm, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
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
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan Range Gaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

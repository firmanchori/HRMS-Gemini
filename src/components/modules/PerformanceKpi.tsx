import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import { Target, Award, Plus, Trash2, CheckCircle, TrendingUp, Save } from 'lucide-react';
import { KPIMetric } from '../../types/hrms';

export const PerformanceKpi: React.FC = () => {
  const { employees, kpis, saveKPIReview, currentUser } = useHrms();

  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q3');
  const [periodYear, setPeriodYear] = useState('2026');

  // Existing review or new
  const existingKpi = kpis.find(
    (k) =>
      k.employeeId === selectedEmpId &&
      k.quarter === selectedQuarter &&
      k.period === periodYear
  );

  // Dynamic Metrics for evaluation
  const [metrics, setMetrics] = useState<KPIMetric[]>(() => {
    if (existingKpi) return existingKpi.metrics;
    return [
      { id: 'm1', name: 'Pencapaian Target Kerja Utama (Core Deliverables)', target: 100, actual: 95, weight: 40, unit: '%', score: 38 },
      { id: 'm2', name: 'Kualitas & Akurasi Output Kerja', target: 90, actual: 92, weight: 30, unit: '%', score: 30.6 },
      { id: 'm3', name: 'Inisiatif & Problem Solving', target: 80, actual: 85, weight: 15, unit: 'Point', score: 15.9 },
      { id: 'm4', name: 'Kolaborasi Tim & Kedisiplinan SOP', target: 100, actual: 100, weight: 15, unit: '%', score: 15 },
    ];
  });

  const [feedback, setFeedback] = useState(existingKpi?.feedback || 'Performa sangat konsisten dan proaktif mendukung target tim.');
  const [saveToast, setSaveToast] = useState(false);

  // Update metrics dynamically
  const handleMetricChange = (idx: number, field: keyof KPIMetric, value: any) => {
    setMetrics((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      // Recalculate score
      const t = Number(copy[idx].target) || 1;
      const a = Number(copy[idx].actual) || 0;
      const w = Number(copy[idx].weight) || 0;
      copy[idx].score = Number(((a / t) * w).toFixed(1));
      return copy;
    });
  };

  const handleAddMetric = () => {
    setMetrics((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        name: 'Indikator Kinerja Baru',
        target: 100,
        actual: 0,
        weight: 10,
        unit: '%',
        score: 0,
      },
    ]);
  };

  const handleRemoveMetric = (idx: number) => {
    setMetrics((prev) => prev.filter((_, i) => i !== idx));
  };

  // Calculate live total final score
  const finalScore = Number(metrics.reduce((sum, m) => sum + (m.score || 0), 0).toFixed(1));
  const totalWeight = metrics.reduce((sum, m) => sum + (Number(m.weight) || 0), 0);

  const getGrade = (score: number) => {
    if (score >= 95) return { grade: 'A+ (Istimewa)', color: 'text-emerald-700 bg-emerald-50' };
    if (score >= 85) return { grade: 'A (Sangat Baik)', color: 'text-emerald-700 bg-emerald-50' };
    if (score >= 75) return { grade: 'B (Baik / Memenuhi Target)', color: 'text-indigo-700 bg-indigo-50' };
    if (score >= 65) return { grade: 'C (Cukup / Perlu Peningkatan)', color: 'text-amber-700 bg-amber-50' };
    return { grade: 'D (Kurang / Evaluasi Khusus)', color: 'text-rose-700 bg-rose-50' };
  };

  const gradeInfo = getGrade(finalScore);
  const selectedEmployee = employees.find((e) => e.id === selectedEmpId);

  const handleSave = () => {
    saveKPIReview({
      employeeId: selectedEmpId,
      period: periodYear,
      quarter: selectedQuarter,
      metrics,
      finalScore,
      feedback,
      reviewer: currentUser?.name || 'Administrator',
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Penilaian Kinerja Karyawan Real-time (KPI & OKR)
          </h2>
          <p className="text-xs text-slate-500">
            Perhitungan skor dinamis berbasis pembobotan target, evaluasi per kuartal, dan catatan umpan balik terstruktur.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveToast && (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" />
              Tersimpan Real-time!
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Evaluasi KPI</span>
          </button>
        </div>
      </div>

      {/* Target Selector Ribbon */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-600 block mb-1">Pilih Karyawan</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full sm:w-auto py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-md font-semibold text-slate-800"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.nik}) - {emp.position}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600 block mb-1">Kuartal Evaluasi</label>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-md text-xs font-medium w-full sm:w-auto justify-between">
              {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-3 py-1 rounded transition-colors flex-1 sm:flex-initial text-center ${
                    selectedQuarter === q
                      ? 'bg-white text-indigo-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Score Display */}
        <div className="flex items-center justify-between sm:justify-start gap-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Skor Akhir KPI (Real-time)
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {finalScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
            </div>
          </div>
          <div className={`px-2.5 py-1.5 rounded text-xs font-bold ${gradeInfo.color}`}>
            {gradeInfo.grade}
          </div>
        </div>
      </div>

      {/* Metrics Section: Adaptive Card View on Mobile/Tablet, Table on Desktop */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-800">
            Rincian Indikator Kinerja & Pembobotan ({metrics.length} Sasaran)
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className={`text-xs font-mono font-semibold ${totalWeight === 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
              Total Bobot: {totalWeight}% {totalWeight !== 100 && '(Ideal 100%)'}
            </span>
            <button
              onClick={handleAddMetric}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Indikator</span>
            </button>
          </div>
        </div>

        {/* TAMPILAN MOBILE & TABLET: Adaptive Cards (< md) */}
        <div className="md:hidden p-3 space-y-3 bg-slate-50/50">
          {metrics.map((m, idx) => (
            <div
              key={`mob-${m.id}`}
              className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3"
            >
              {/* Header: Indikator Number & Remove */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  Sasaran #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveMetric(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                  title="Hapus Indikator"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </div>

              {/* Indicator Name */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Nama Indikator / Sasaran Strategis
                </label>
                <input
                  type="text"
                  value={m.name}
                  onChange={(e) => handleMetricChange(idx, 'name', e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-500 font-medium text-slate-900"
                />
              </div>

              {/* 2x2 Numeric Inputs Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Satuan</label>
                  <input
                    type="text"
                    value={m.unit}
                    onChange={(e) => handleMetricChange(idx, 'unit', e.target.value)}
                    className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Target</label>
                  <input
                    type="number"
                    value={m.target}
                    onChange={(e) => handleMetricChange(idx, 'target', Number(e.target.value))}
                    className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-indigo-700 block mb-0.5">Realisasi (Aktual)</label>
                  <input
                    type="number"
                    value={m.actual}
                    onChange={(e) => handleMetricChange(idx, 'actual', Number(e.target.value))}
                    className="w-full text-xs px-2 py-1.5 bg-indigo-50/50 border border-indigo-300 rounded font-mono font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Bobot (%)</label>
                  <input
                    type="number"
                    value={m.weight}
                    onChange={(e) => handleMetricChange(idx, 'weight', Number(e.target.value))}
                    className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              {/* Card Footer: Live Computed Score */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 bg-slate-50/70 -mx-3.5 -mb-3.5 px-3.5 py-2 rounded-b-xl text-xs">
                <span className="text-[11px] text-slate-500">
                  Rasio: <b>{m.actual}</b> / {m.target} {m.unit}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Skor:</span>
                  <span className="font-mono font-bold text-sm text-indigo-700 px-2 py-0.5 bg-indigo-50 rounded border border-indigo-200">
                    {m.score} Poin
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* TAMPILAN DESKTOP: 7-Column Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-white border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-3 font-semibold w-1/3">Nama Indikator / Sasaran Strategis</th>
                <th className="py-2.5 px-3 font-semibold text-center w-24">Satuan</th>
                <th className="py-2.5 px-3 font-semibold text-right w-28">Target</th>
                <th className="py-2.5 px-3 font-semibold text-right w-28">Realisasi (Aktual)</th>
                <th className="py-2.5 px-3 font-semibold text-right w-24">Bobot (%)</th>
                <th className="py-2.5 px-3 font-semibold text-right w-24">Skor Tertimbang</th>
                <th className="py-2.5 px-3 font-semibold text-center w-12">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.map((m, idx) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => handleMetricChange(idx, 'name', e.target.value)}
                      className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium text-slate-900"
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <input
                      type="text"
                      value={m.unit}
                      onChange={(e) => handleMetricChange(idx, 'unit', e.target.value)}
                      className="w-16 text-center text-xs px-1.5 py-1 bg-white border border-slate-300 rounded font-mono"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      value={m.target}
                      onChange={(e) => handleMetricChange(idx, 'target', Number(e.target.value))}
                      className="w-20 text-right text-xs px-2 py-1 bg-white border border-slate-300 rounded font-mono text-slate-800"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      value={m.actual}
                      onChange={(e) => handleMetricChange(idx, 'actual', Number(e.target.value))}
                      className="w-20 text-right text-xs px-2 py-1 bg-white border border-indigo-300 rounded font-mono font-bold text-indigo-700"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      value={m.weight}
                      onChange={(e) => handleMetricChange(idx, 'weight', Number(e.target.value))}
                      className="w-16 text-right text-xs px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {m.score}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => handleRemoveMetric(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reviewer Feedback Area */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
        <label className="text-xs font-bold text-slate-900 block">
          Catatan Evaluasi Kinerja & Rencana Pengembangan Individu
        </label>
        <textarea
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Berikan umpan balik konstruktif mengenai kekuatan, area yang perlu ditingkatkan, serta rekomendasi penyesuaian gaji atau promosi jabatan..."
          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
        />
        <div className="text-[11px] text-slate-500 flex justify-between">
          <span>Evaluator: <strong>{currentUser.name}</strong></span>
          <span>Tersimpan di ledger histori kinerja {selectedEmployee?.fullName}</span>
        </div>
      </div>
    </div>
  );
};

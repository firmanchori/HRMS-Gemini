import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  UserCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Award,
  FileCheck2,
  X,
  Search,
  Filter,
  TrendingUp,
  UserX,
} from 'lucide-react';
import { EmployeeSelect } from '../common/EmployeeSelect';

export const ProbationManagement: React.FC = () => {
  const {
    employees,
    probationEvaluations,
    submitProbationEvaluation,
    reviewProbationEvaluation,
    currentUser,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'monitoring' | 'evaluations'>('monitoring');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [technicalSkillScore, setTechnicalSkillScore] = useState(85);
  const [disciplineScore, setDisciplineScore] = useState(90);
  const [teamworkScore, setTeamworkScore] = useState(88);
  const [initiativeScore, setInitiativeScore] = useState(82);
  const [recommendation, setRecommendation] = useState<'Lulus' | 'Perpanjang Probation' | 'Tidak Lulus'>('Lulus');
  const [extensionMonths, setExtensionMonths] = useState(3);
  const [notes, setNotes] = useState('');

  // Filter employees currently on probation
  const probationEmployees = employees.filter(
    (e) => e.probationStatus === 'Sedang Berjalan' || e.employmentType === 'Kontrak' || e.probationEndDate
  );

  const calculateHMinus = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((end - now) / (1000 * 3600 * 24));
    return diffDays;
  };

  const handleOpenEvaluationModal = (empId: string) => {
    setSelectedEmpId(empId);
    setIsModalOpen(true);
  };

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;

    const overallScore = Math.round(
      (technicalSkillScore * 0.35) +
      (disciplineScore * 0.25) +
      (teamworkScore * 0.20) +
      (initiativeScore * 0.20)
    );

    submitProbationEvaluation({
      employeeId: selectedEmpId,
      supervisorId: currentUser.id,
      evaluationDate: new Date().toISOString().split('T')[0],
      technicalSkillScore,
      disciplineScore,
      teamworkScore,
      initiativeScore,
      overallScore,
      recommendation,
      extensionDurationMonths: recommendation === 'Perpanjang Probation' ? extensionMonths : undefined,
      notes,
    });

    setIsModalOpen(false);
    setSelectedEmpId('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-200">
              Modul 02C
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Evaluasi Masa Percobaan (Probation)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Penilaian kinerja probation, reminder otomatis H-14 jatuh tempo, dan keputusan pengangkatan tetap atau terminasi
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
        >
          <Award className="w-4 h-4" />
          <span>Formulir Evaluasi Baru</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-2">
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'monitoring'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Monitoring Jatuh Tempo Probation</span>
          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px]">
            {probationEmployees.length} Karyawan
          </span>
        </button>

        <button
          onClick={() => setActiveTab('evaluations')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'evaluations'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Riwayat & Status Keputusan Evaluasi</span>
          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px]">
            {probationEvaluations.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Monitoring Jatuh Tempo */}
      {activeTab === 'monitoring' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Daftar Karyawan dalam Masa Percobaan (Reminder H-14 Aktif)</span>
            </div>
            <div className="text-xs text-slate-400">
              Standard Percobaan: 3 Bulan sesuai UU Ketenagakerjaan
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {probationEmployees.map((emp) => {
              const diffDays = calculateHMinus(emp.probationEndDate || '2026-11-15');
              const isUrgent = diffDays !== null && diffDays <= 14 && diffDays >= 0;
              const isExpired = diffDays !== null && diffDays < 0;

              return (
                <div key={emp.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {emp.avatar ? (
                      <img src={emp.avatar} alt={emp.fullName} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {emp.fullName.charAt(0)}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{emp.fullName}</span>
                        <span className="text-[11px] font-mono text-slate-500">({emp.nik})</span>
                        {isUrgent && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-300 rounded text-[10px] font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> H-{diffDays} Hari Lagi!
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-semibold">
                            Lewat Batas
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {emp.position} • {emp.department} • Bergabung: {emp.joinDate}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Jatuh Tempo Probation: <b>{emp.probationEndDate || '15 Nov 2026'}</b>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEvaluationModal(emp.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Input Evaluasi</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {probationEmployees.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada karyawan yang sedang dalam masa percobaan aktif.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Evaluasi & Status Keputusan */}
      {activeTab === 'evaluations' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Riwayat Evaluasi Probation & SK Kelulusan
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {probationEvaluations.map((ev) => {
              const emp = employees.find((e) => e.id === ev.employeeId);

              return (
                <div key={ev.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {emp?.fullName || 'Karyawan'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.recommendation === 'Lulus'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : ev.recommendation === 'Perpanjang Probation'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        Rekomendasi: {ev.recommendation}
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[10px] rounded">
                        Skor: {ev.overallScore} / 100
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 max-w-xl">
                      Catatan Evaluator: "{ev.notes}"
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                      <span>Teknis: <b>{ev.technicalSkillScore}</b></span>
                      <span>Disiplin: <b>{ev.disciplineScore}</b></span>
                      <span>Teamwork: <b>{ev.teamworkScore}</b></span>
                      <span>Inisiatif: <b>{ev.initiativeScore}</b></span>
                      <span>• Tanggal Evaluasi: {ev.evaluationDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {ev.status === 'Menunggu Approval' ? (
                      <>
                        <button
                          onClick={() => reviewProbationEvaluation(ev.id, true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Setujui SK Pengangkatan
                        </button>
                        <button
                          onClick={() => reviewProbationEvaluation(ev.id, false)}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                        >
                          Tolak
                        </button>
                      </>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        SK Resmi Terbit ({ev.status})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {probationEvaluations.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada evaluasi probation yang dicatat.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Form Input Evaluasi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="font-bold text-slate-900 text-sm">
                Form Penilaian Evaluasi Akhir Probation
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Karyawan yang Dievaluasi *
                </label>
                <EmployeeSelect
                  employees={employees}
                  selectedEmployeeId={selectedEmpId}
                  onSelect={(id) => setSelectedEmpId(id)}
                  placeholder="Pilih karyawan probation..."
                />
              </div>

              {/* Score Range Inputs */}
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-700">Skor Kompetensi (Skala 0 - 100)</div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>1. Kemampuan Teknis & Hasil Kerja (Bobot 35%)</span>
                    <span className="font-bold text-emerald-700">{technicalSkillScore}</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    value={technicalSkillScore}
                    onChange={(e) => setTechnicalSkillScore(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>2. Kedisiplinan & Kehadiran (Bobot 25%)</span>
                    <span className="font-bold text-emerald-700">{disciplineScore}</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    value={disciplineScore}
                    onChange={(e) => setDisciplineScore(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>3. Kerja Sama Tim & Komunikasi (Bobot 20%)</span>
                    <span className="font-bold text-emerald-700">{teamworkScore}</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    value={teamworkScore}
                    onChange={(e) => setTeamworkScore(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>4. Inisiatif & Adaptabilitas (Bobot 20%)</span>
                    <span className="font-bold text-emerald-700">{initiativeScore}</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    value={initiativeScore}
                    onChange={(e) => setInitiativeScore(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Recommendation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rekomendasi Keputusan Akhir *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecommendation('Lulus')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      recommendation === 'Lulus'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Lulus (Diangkat Tetap)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecommendation('Perpanjang Probation')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      recommendation === 'Perpanjang Probation'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Perpanjang Probation
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecommendation('Tidak Lulus')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      recommendation === 'Tidak Lulus'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Tidak Lulus (Terminasi)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Kualitatif / Alasan Evaluasi *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Catatan performa, kelebihan, dan aspek yang perlu dipertahankan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  Simpan & Teruskan ke Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

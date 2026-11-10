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
import type { ProbationEvaluationCategory } from '../../types/hrms';
import { ValidatedTextarea } from '../common/ValidatedInput';

function genCategoryId() {
  return `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
function genQuestionId() {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const ProbationManagement: React.FC = () => {
  const {
    employees,
    probationEvaluations,
    submitProbationEvaluation,
    reviewProbationEvaluation,
    currentUser,
    moduleSettings,
    probationEvaluationTemplates,
    addProbationEvaluationTemplate,
    divisions,
    departments,
    masterJobPositions,
  } = useHrms();

  // H- berapa hari sebelum jatuh tempo karyawan masuk daftar reminder — dulu hardcode 14, sekarang diatur di Pengaturan Karyawan (user, 2026-11-09).
  const reminderDaysBefore = moduleSettings.employee.probationReminderDaysBefore ?? 14;

  // Template evaluasi yang sedang berlaku hari ini — "ada masa berlaku dan
  // bisa di tambah terus" (user, 2026-11-09): dari seluruh riwayat template
  // yang pernah dibuat, yang dipakai adalah yang isActive dan tanggal hari
  // ini ada di antara validFrom..validUntil (validUntil kosong = tanpa
  // batas akhir). Kalau beberapa cocok sekaligus, pakai yang paling baru.
  const todayStr = new Date().toISOString().slice(0, 10);
  const validTemplates = [...probationEvaluationTemplates]
    .filter((t) => t.isActive && t.validFrom <= todayStr && (!t.validUntil || t.validUntil >= todayStr))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  // Template dibuat PER Divisi / Departemen / Jabatan (user, 2026-11-10) —
  // untuk satu karyawan dipilih template yang cakupannya cocok; kalau
  // beberapa cocok, yang paling spesifik menang (jabatan > departemen >
  // divisi > umum), lalu yang terbaru. Template tanpa cakupan = berlaku
  // untuk semua karyawan.
  const resolveTemplateForEmployee = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return validTemplates.find((t) => !t.divisionId && !t.departmentId && !t.positionId) || null;
    const dept = departments.find((d) => d.name === emp.department);
    const pos = masterJobPositions.find((p) => p.title === emp.position);
    const scored = validTemplates
      .map((t) => {
        if (t.positionId && t.positionId !== pos?.id) return null;
        if (t.departmentId && t.departmentId !== dept?.id) return null;
        if (t.divisionId && t.divisionId !== dept?.divisionId) return null;
        const specificity = t.positionId ? 3 : t.departmentId ? 2 : t.divisionId ? 1 : 0;
        return { t, specificity };
      })
      .filter((x): x is { t: (typeof validTemplates)[number]; specificity: number } => x !== null)
      .sort((a, b) => b.specificity - a.specificity);
    return scored[0]?.t || null;
  };
  const describeScope = (t: { divisionId?: string | null; departmentId?: string | null; positionId?: string | null }) => {
    const parts: string[] = [];
    if (t.divisionId) parts.push(`Divisi: ${divisions.find((d) => d.id === t.divisionId)?.name ?? '-'}`);
    if (t.departmentId) parts.push(`Departemen/Unit: ${departments.find((d) => d.id === t.departmentId)?.name ?? '-'}`);
    if (t.positionId) parts.push(`Jabatan: ${masterJobPositions.find((p) => p.id === t.positionId)?.title ?? '-'}`);
    return parts.length ? parts.join(' · ') : 'Semua karyawan (umum)';
  };

  const [activeTab, setActiveTab] = useState<'monitoring' | 'evaluations' | 'templates'>('monitoring');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [selectedEmpId, setSelectedEmpId] = useState('');
  // questionId (atau categoryId untuk kategori lama tanpa pertanyaan) -> skor
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>({});
  const activeTemplate = resolveTemplateForEmployee(selectedEmpId);
  const [recommendation, setRecommendation] = useState<'Lulus' | 'Perpanjang Probation' | 'Tidak Lulus'>('Lulus');
  const [extensionMonths, setExtensionMonths] = useState(3);
  const [notes, setNotes] = useState('');

  // Template Builder Form State
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateValidFrom, setNewTemplateValidFrom] = useState(todayStr);
  const [newTemplateValidUntil, setNewTemplateValidUntil] = useState('');
  const [newTemplateCategories, setNewTemplateCategories] = useState<ProbationEvaluationCategory[]>([
    { id: genCategoryId(), label: '', questions: [{ id: genQuestionId(), text: '' }] },
  ]);
  const [newTemplateDivisionId, setNewTemplateDivisionId] = useState('');
  const [newTemplateDepartmentId, setNewTemplateDepartmentId] = useState('');
  const [newTemplatePositionId, setNewTemplatePositionId] = useState('');

  const calculateHMinus = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((end - now) / (1000 * 3600 * 24));
    return diffDays;
  };

  // Hanya karyawan yang masuk jendela reminder (H- sesuai Pengaturan
  // Karyawan, termasuk yang sudah lewat jatuh tempo) yang muncul di sini —
  // bukan semua karyawan kontrak/probation tanpa memandang tanggal (user,
  // 2026-11-09: "notif atau daftar ditabel yang muncul sesuai dengan
  // pengaturan tersebut").
  const probationEmployees = employees.filter((e) => {
    if (e.probationStatus !== 'Sedang Berjalan' && e.employmentType !== 'Kontrak' && !e.probationEndDate) return false;
    const diffDays = calculateHMinus(e.probationEndDate);
    return diffDays !== null && diffDays <= reminderDaysBefore;
  });

  const initScoresFor = (empId: string) => {
    const tmpl = resolveTemplateForEmployee(empId);
    const entries: [string, number][] = [];
    (tmpl?.categories || []).forEach((c) => {
      if (c.questions?.length) c.questions.forEach((q) => entries.push([q.id, 75]));
      else entries.push([c.id, 75]);
    });
    setCategoryScores(Object.fromEntries(entries));
  };

  const handleOpenEvaluationModal = (empId: string) => {
    setSelectedEmpId(empId);
    initScoresFor(empId);
    setIsModalOpen(true);
  };

  const [evalSubmitAttempted, setEvalSubmitAttempted] = useState(false);

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    setEvalSubmitAttempted(true);
    if (!selectedEmpId || !activeTemplate || !notes.trim()) return;

    // Skor kategori = rata-rata pertanyaan miliknya sendiri; skor akhir =
    // rata-rata SEMUA pertanyaan (bukan rata-rata antar kategori), supaya
    // kategori dengan 20 pertanyaan berbobot lebih besar dari yang 10.
    const scores = activeTemplate.categories.map((c) => {
      if (c.questions?.length) {
        const questions = c.questions.map((q) => ({ questionId: q.id, text: q.text, score: categoryScores[q.id] ?? 0 }));
        return {
          categoryId: c.id,
          label: c.label,
          score: Math.round(questions.reduce((sum, q) => sum + q.score, 0) / questions.length),
          questions,
        };
      }
      return { categoryId: c.id, label: c.label, score: categoryScores[c.id] ?? 0 };
    });
    const allScores = scores.flatMap((c) => (c.questions ? c.questions.map((q) => q.score) : [c.score]));
    const overallScore = Math.round(allScores.reduce((sum, v) => sum + v, 0) / Math.max(1, allScores.length));

    submitProbationEvaluation({
      employeeId: selectedEmpId,
      supervisorId: currentUser.id,
      evaluationDate: new Date().toISOString().split('T')[0],
      templateId: activeTemplate.id,
      categoryScores: scores,
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
            Penilaian kinerja probation, reminder otomatis H-{reminderDaysBefore} jatuh tempo, dan keputusan pengangkatan tetap atau terminasi
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

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Template Evaluasi</span>
          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px]">
            {probationEvaluationTemplates.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Monitoring Jatuh Tempo */}
      {activeTab === 'monitoring' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Daftar Karyawan dalam Masa Percobaan (Reminder H-{reminderDaysBefore} Aktif)</span>
            </div>
            <div className="text-xs text-slate-400">
              Standard Percobaan: 3 Bulan sesuai UU Ketenagakerjaan
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {probationEmployees.map((emp) => {
              const diffDays = calculateHMinus(emp.probationEndDate || '2026-11-15');
              const isUrgent = diffDays !== null && diffDays <= reminderDaysBefore && diffDays >= 0;
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

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2 flex-wrap">
                      {ev.categoryScores && ev.categoryScores.length > 0 ? (
                        ev.categoryScores.map((cs) => (
                          <span key={cs.categoryId}>{cs.label}: <b>{cs.score}</b></span>
                        ))
                      ) : (
                        <>
                          <span>Teknis: <b>{ev.technicalSkillScore}</b></span>
                          <span>Disiplin: <b>{ev.disciplineScore}</b></span>
                          <span>Teamwork: <b>{ev.teamworkScore}</b></span>
                          <span>Inisiatif: <b>{ev.initiativeScore}</b></span>
                        </>
                      )}
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

      {/* Tab 3: Template Evaluasi — custom kategori/pertanyaan, masa berlaku, riwayat ditambah terus (user, 2026-11-09) */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Buat Template Evaluasi Baru</span>
              {activeTemplate && (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-semibold">
                  Template Aktif Saat Ini: {activeTemplate.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Nama Template *</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="mis. Evaluasi Probation 2027"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Berlaku Mulai *</label>
                <input
                  type="date"
                  value={newTemplateValidFrom}
                  onChange={(e) => setNewTemplateValidFrom(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Berlaku Sampai (opsional)</label>
                <input
                  type="date"
                  value={newTemplateValidUntil}
                  onChange={(e) => setNewTemplateValidUntil(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="text-[11px] font-semibold text-slate-700">Berlaku untuk (kosongkan semua = seluruh karyawan)</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Divisi</label>
                  <select
                    value={newTemplateDivisionId}
                    onChange={(e) => {
                      setNewTemplateDivisionId(e.target.value);
                      setNewTemplateDepartmentId('');
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="">Semua Divisi</option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Departemen/Unit</label>
                  <select
                    value={newTemplateDepartmentId}
                    onChange={(e) => setNewTemplateDepartmentId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="">Semua Departemen/Unit</option>
                    {departments
                      .filter((d) => !newTemplateDivisionId || d.divisionId === newTemplateDivisionId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Jabatan</label>
                  <select
                    value={newTemplatePositionId}
                    onChange={(e) => setNewTemplatePositionId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="">Semua Jabatan</option>
                    {masterJobPositions.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-slate-600 block">Kategori & Daftar Pertanyaan Penilaian *</label>
              {newTemplateCategories.map((cat, idx) => (
                <div key={cat.id} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-indigo-600 shrink-0">Kategori {idx + 1}</span>
                    <input
                      type="text"
                      value={cat.label}
                      onChange={(e) =>
                        setNewTemplateCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, label: e.target.value } : c)))
                      }
                      placeholder="mis. Kemampuan Teknis & Hasil Kerja"
                      className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setNewTemplateCategories((prev) => prev.filter((c) => c.id !== cat.id))}
                      disabled={newTemplateCategories.length <= 1}
                      title="Hapus kategori beserta pertanyaannya"
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="pl-3 border-l-2 border-indigo-100 space-y-1.5">
                    {(cat.questions || []).map((q, qIdx) => (
                      <div key={q.id} className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 w-5 shrink-0">{qIdx + 1}.</span>
                        <input
                          type="text"
                          value={q.text}
                          onChange={(e) =>
                            setNewTemplateCategories((prev) =>
                              prev.map((c) =>
                                c.id === cat.id
                                  ? { ...c, questions: (c.questions || []).map((x) => (x.id === q.id ? { ...x, text: e.target.value } : x)) }
                                  : c
                              )
                            )
                          }
                          placeholder="Tulis pertanyaan penilaian..."
                          className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewTemplateCategories((prev) =>
                              prev.map((c) => (c.id === cat.id ? { ...c, questions: (c.questions || []).filter((x) => x.id !== q.id) } : c))
                            )
                          }
                          disabled={(cat.questions || []).length <= 1}
                          className="p-1 text-rose-400 hover:bg-rose-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setNewTemplateCategories((prev) =>
                          prev.map((c) => (c.id === cat.id ? { ...c, questions: [...(c.questions || []), { id: genQuestionId(), text: '' }] } : c))
                        )
                      }
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      + Tambah Pertanyaan ({(cat.questions || []).length} pertanyaan di kategori ini)
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setNewTemplateCategories((prev) => [...prev, { id: genCategoryId(), label: '', questions: [{ id: genQuestionId(), text: '' }] }])}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                + Tambah Kategori
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={
                  !newTemplateName.trim() ||
                  !newTemplateValidFrom ||
                  newTemplateCategories.some((c) => !c.label.trim() || !(c.questions || []).length || (c.questions || []).some((q) => !q.text.trim()))
                }
                onClick={() => {
                  addProbationEvaluationTemplate({
                    name: newTemplateName.trim(),
                    categories: newTemplateCategories.map((c) => ({
                      id: c.id,
                      label: c.label.trim(),
                      questions: (c.questions || []).map((q) => ({ id: q.id, text: q.text.trim() })),
                    })),
                    divisionId: newTemplateDivisionId || null,
                    departmentId: newTemplateDepartmentId || null,
                    positionId: newTemplatePositionId || null,
                    validFrom: newTemplateValidFrom,
                    validUntil: newTemplateValidUntil || undefined,
                    isActive: true,
                  });
                  setNewTemplateName('');
                  setNewTemplateValidUntil('');
                  setNewTemplateDivisionId('');
                  setNewTemplateDepartmentId('');
                  setNewTemplatePositionId('');
                  setNewTemplateCategories([{ id: genCategoryId(), label: '', questions: [{ id: genQuestionId(), text: '' }] }]);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Simpan Template
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
              Riwayat Template Evaluasi ({probationEvaluationTemplates.length})
            </div>
            <div className="divide-y divide-slate-200">
              {[...probationEvaluationTemplates]
                .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
                .map((t) => {
                  const isCurrentlyActive = validTemplates.some((v) => v.id === t.id);
                  return (
                    <div key={t.id} className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                        {isCurrentlyActive && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">Berlaku Saat Ini</span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          Berlaku: {t.validFrom} s/d {t.validUntil || 'Tanpa Batas'}
                        </span>
                      </div>
                      <div className="text-[11px] text-indigo-700 font-semibold mt-1">{describeScope(t)}</div>
                      <div className="flex items-center gap-2 flex-wrap mt-1.5 text-[11px] text-slate-500">
                        {t.categories.map((c) => (
                          <span key={c.id} className="px-2 py-0.5 bg-slate-100 rounded">
                            {c.label}
                            {c.questions?.length ? ` (${c.questions.length} pertanyaan)` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}

              {probationEvaluationTemplates.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada Template Evaluasi — buat yang pertama di atas.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Form Input Evaluasi */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden cursor-default"
          >
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

            <form onSubmit={handleSubmitEvaluation} noValidate className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Karyawan yang Dievaluasi *
                </label>
                <EmployeeSelect
                  employees={employees}
                  selectedEmployeeId={selectedEmpId}
                  onSelect={(id) => {
                    setSelectedEmpId(id);
                    initScoresFor(id);
                  }}
                  placeholder="Pilih karyawan probation..."
                />
                {evalSubmitAttempted && !selectedEmpId && (
                  <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Karyawan wajib dipilih
                  </p>
                )}
              </div>

              {/* Score Range Inputs — kategori mengikuti template evaluasi yang sedang berlaku (Pengaturan > Template Evaluasi) */}
              {activeTemplate ? (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-700">
                    Skor Kompetensi (Skala 0 - 100) — Template: {activeTemplate.name}
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Cakupan: {describeScope(activeTemplate)}</div>
                  </div>
                  {activeTemplate.categories.map((cat, idx) => (
                    <div key={cat.id} className="space-y-2">
                      <div className="text-xs font-bold text-indigo-800 border-b border-indigo-100 pb-1">
                        {idx + 1}. {cat.label}
                        {cat.questions?.length ? <span className="font-normal text-slate-400"> — {cat.questions.length} pertanyaan</span> : null}
                      </div>
                      {(cat.questions?.length ? cat.questions : [{ id: cat.id, text: cat.label }]).map((q, qIdx) => (
                        <div key={q.id}>
                          <div className="flex justify-between gap-3 text-xs text-slate-600 mb-1">
                            <span>{cat.questions?.length ? `${idx + 1}.${qIdx + 1} ${q.text}` : 'Skor kategori'}</span>
                            <span className="font-bold text-emerald-700 shrink-0">{categoryScores[q.id] ?? 75}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={categoryScores[q.id] ?? 75}
                            onChange={(e) => setCategoryScores((prev) => ({ ...prev, [q.id]: Number(e.target.value) }))}
                            className="w-full accent-emerald-600 cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  {selectedEmpId
                    ? 'Belum ada Template Evaluasi yang berlaku untuk Divisi/Departemen/Jabatan karyawan ini. Buat dulu di tab '
                    : 'Pilih karyawan terlebih dahulu — template evaluasi menyesuaikan Divisi/Departemen/Jabatannya. Atau buat template di tab '}
                  <strong>Template Evaluasi</strong>.
                </div>
              )}

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

              <ValidatedTextarea
                label="Catatan Kualitatif / Alasan Evaluasi"
                required
                requiredLabel="Catatan evaluasi wajib diisi"
                rows={2}
                placeholder="Catatan performa, kelebihan, dan aspek yang perlu dipertahankan..."
                value={notes}
                onChange={setNotes}
                showError={evalSubmitAttempted}
              />

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
                  disabled={!activeTemplate}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
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

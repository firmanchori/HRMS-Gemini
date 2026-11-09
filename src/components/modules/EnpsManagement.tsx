import React, { useMemo, useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import { Smile, Plus, X, Users, ThumbsUp, Minus, ThumbsDown, MessageSquare, Building2 } from 'lucide-react';

const SCORE_LABELS: Record<number, string> = {
  0: 'Sangat Tidak Mungkin',
  10: 'Sangat Mungkin',
};

function scoreBucket(score: number): 'promoter' | 'passive' | 'detractor' {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

function npsLevel(score: number): { label: string; colorClass: string } {
  if (score >= 50) return { label: 'Sangat Baik', colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  if (score >= 0) return { label: 'Cukup Baik', colorClass: 'text-amber-600 bg-amber-50 border-amber-200' };
  return { label: 'Perlu Perhatian', colorClass: 'text-rose-600 bg-rose-50 border-rose-200' };
}

export const EnpsManagement: React.FC = () => {
  const { enpsSurvey, submitEnpsResponse, employees } = useHrms();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [score, setScore] = useState<number>(9);
  const [department, setDepartment] = useState('');
  const [feedback, setFeedback] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const departmentOptions = useMemo(() => {
    const fromEmployees = Array.from(new Set(employees.map((e) => e.department).filter(Boolean))) as string[];
    return fromEmployees.sort();
  }, [employees]);

  const level = npsLevel(enpsSurvey.score);
  const promoterPercent = enpsSurvey.totalResponses > 0 ? Math.round((enpsSurvey.promoters / enpsSurvey.totalResponses) * 100) : 0;
  const passivePercent = enpsSurvey.totalResponses > 0 ? Math.round((enpsSurvey.passives / enpsSurvey.totalResponses) * 100) : 0;
  const detractorPercent = enpsSurvey.totalResponses > 0 ? 100 - promoterPercent - passivePercent : 0;

  const handleOpenModal = () => {
    setScore(9);
    setDepartment(departmentOptions[0] || '');
    setFeedback('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!department.trim()) {
      setFormError('Pilih atau isi departemen responden.');
      return;
    }
    submitEnpsResponse(score, department.trim(), feedback.trim() || undefined);
    setIsModalOpen(false);
  };

  const sortedResponses = [...enpsSurvey.responses].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Smile className="w-5 h-5 text-indigo-600" />
            <span>Survei Kepuasan & Employee Net Promoter Score (eNPS)</span>
          </h2>
          <p className="text-xs text-slate-500">
            {enpsSurvey.title || 'Belum ada survei aktif'} {enpsSurvey.period ? `· Periode ${enpsSurvey.period}` : ''} — ukur seberapa besar karyawan merekomendasikan perusahaan sebagai tempat kerja.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Isi Respons Survei</span>
        </button>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-1 p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Skor eNPS Saat Ini</span>
          <span className="text-4xl font-bold font-mono text-slate-900">{enpsSurvey.score}</span>
          <span className={`mt-2 px-2.5 py-1 rounded-full text-[11px] font-bold border ${level.colorClass}`}>
            {level.label}
          </span>
          <span className="text-[11px] text-slate-400 mt-2">Dari {enpsSurvey.totalResponses} respons · Skala -100 s/d +100</span>
        </div>

        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Distribusi Responden</span>
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
            {promoterPercent > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${promoterPercent}%` }} />}
            {passivePercent > 0 && <div className="bg-amber-400 h-full" style={{ width: `${passivePercent}%` }} />}
            {detractorPercent > 0 && <div className="bg-rose-500 h-full" style={{ width: `${detractorPercent}%` }} />}
          </div>
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold font-mono text-slate-900">{enpsSurvey.promoters}</div>
                <div className="text-[10px] text-slate-500">Promoter (9-10) · {promoterPercent}%</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Minus className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold font-mono text-slate-900">{enpsSurvey.passives}</div>
                <div className="text-[10px] text-slate-500">Passive (7-8) · {passivePercent}%</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ThumbsDown className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold font-mono text-slate-900">{enpsSurvey.detractors}</div>
                <div className="text-[10px] text-slate-500">Detractor (0-6) · {detractorPercent}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Response List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Riwayat Respons ({enpsSurvey.responses.length})
          </span>
        </div>
        {sortedResponses.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Smile className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium">Belum ada respons survei. Klik "Isi Respons Survei" untuk mencatat yang pertama.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedResponses.map((r) => {
              const bucket = scoreBucket(r.score);
              const badgeClass =
                bucket === 'promoter'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : bucket === 'passive'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200';
              return (
                <div key={r.id} className="p-3.5 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold font-mono text-sm shrink-0 ${badgeClass}`}>
                    {r.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {r.department}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{r.submittedAt}</span>
                    </div>
                    {r.feedback && (
                      <p className="text-xs text-slate-600 mt-1 flex items-start gap-1.5">
                        <MessageSquare className="w-3 h-3 text-slate-300 mt-0.5 shrink-0" />
                        <span>{r.feedback}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit Response Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Isi Respons Survei eNPS</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-2">
                  Seberapa besar kemungkinan Anda merekomendasikan perusahaan ini sebagai tempat kerja? *
                </label>
                <div className="grid grid-cols-11 gap-1">
                  {Array.from({ length: 11 }, (_, n) => n).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScore(n)}
                      className={`py-2 rounded-md text-xs font-bold font-mono border transition-colors ${
                        score === n
                          ? n >= 9
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : n >= 7
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                  <span>{SCORE_LABELS[0]}</span>
                  <span>{SCORE_LABELS[10]}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Departemen/Unit Responden *</label>
                <input
                  list="enps-department-options"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Mis. Engineering & Technology"
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
                <datalist id="enps-department-options">
                  {departmentOptions.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Masukan / Feedback (Opsional)</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  placeholder="Ceritakan alasan di balik skor Anda..."
                  className="w-full p-2 border border-slate-300 rounded-md resize-none"
                />
              </div>

              {formError && <p className="text-rose-600 font-medium">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold"
                >
                  Kirim Respons
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

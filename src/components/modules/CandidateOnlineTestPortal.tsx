import React, { useState, useEffect } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  Award,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Lock,
  ShieldCheck,
  Send,
  FileText,
  Check,
  Sparkles,
  Laptop,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Calendar,
  Copy,
} from 'lucide-react';
import { CandidateAssignedTest } from '../../types/hrms';

interface CandidateOnlineTestPortalProps {
  testToken: string;
  onClosePortal?: () => void;
}

export const CandidateOnlineTestPortal: React.FC<CandidateOnlineTestPortalProps> = ({
  testToken,
  onClosePortal,
}) => {
  const { candidates, vacancies, updateCandidateStage } = useHrms();

  // Cari kandidat dan assigned test berdasarkan token
  const matchingData = React.useMemo(() => {
    for (const cand of candidates) {
      if (cand.assignedTests && cand.assignedTests.length > 0) {
        const foundTest = cand.assignedTests.find((t) => t.testToken === testToken);
        if (foundTest) {
          const vacancy = vacancies.find((v) => v.id === cand.jobVacancyId);
          return { candidate: cand, test: foundTest, vacancy };
        }
      }
    }
    return null;
  }, [candidates, testToken, vacancies]);

  const candidate = matchingData?.candidate;
  const test = matchingData?.test;
  const vacancy = matchingData?.vacancy;

  // Local state pengerjaan
  const [hasStarted, setHasStarted] = useState<boolean>(() => {
    return Boolean(test?.testStartedAt);
  });
  const [startTimeMs, setStartTimeMs] = useState<number | null>(() => {
    return test?.testStartedAt ? new Date(test.testStartedAt).getTime() : null;
  });
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const totalSec = (test?.durationMinutes || 60) * 60;
    if (test?.testStartedAt) {
      const elapsed = Math.floor((Date.now() - new Date(test.testStartedAt).getTime()) / 1000);
      return Math.max(0, totalSec - elapsed);
    }
    return totalSec;
  });

  // State submit
  const [submittedUrlInput, setSubmittedUrlInput] = useState(test?.submittedUrl || '');
  const [submittedNotesInput, setSubmittedNotesInput] = useState(test?.submittedNotes || '');
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(() => {
    return Boolean(test?.isTokenUsed || test?.submittedAt);
  });
  const [copiedLink, setCopiedLink] = useState(false);

  // Status Token
  const isExpired = React.useMemo(() => {
    if (!test?.tokenExpiresAt) return false;
    return new Date(test.tokenExpiresAt).getTime() < Date.now();
  }, [test?.tokenExpiresAt]);

  const isAlreadyUsed = Boolean(test?.isTokenUsed && !isSubmittedSuccess);

  // Timer countdown effect saat ujian aktif
  useEffect(() => {
    if (!hasStarted || isSubmittedSuccess || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, isSubmittedSuccess, remainingSeconds]);

  // Format detik ke HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const handleStartTest = () => {
    if (!candidate || !test) return;
    const nowIso = new Date().toISOString();
    setHasStarted(true);
    setStartTimeMs(Date.now());

    // Update kandidat di HrmsContext
    const updatedAssigned = (candidate.assignedTests || []).map((t) => {
      if (t.id === test.id || t.testToken === testToken) {
        return {
          ...t,
          testStartedAt: nowIso,
        };
      }
      return t;
    });

    updateCandidateStage(candidate.id, candidate.stage, {
      assignedTests: updatedAssigned,
    });
  };

  const handleSubmitTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate || !test) return;
    if (!submittedUrlInput.trim()) {
      alert('Mohon cantumkan tautan / link hasil pengerjaan tes Anda!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 16);

      const updatedAssigned = (candidate.assignedTests || []).map((t) => {
        if (t.id === test.id || t.testToken === testToken) {
          return {
            ...t,
            isTokenUsed: true,
            submittedUrl: submittedUrlInput,
            submittedNotes: submittedNotesInput,
            submittedAt: nowFormatted,
            status: 'Belum Dinilai' as const,
          };
        }
        return t;
      });

      updateCandidateStage(candidate.id, candidate.stage, {
        assignedTests: updatedAssigned,
      });

      setIsSubmitting(false);
      setIsSubmitConfirmOpen(false);
      setIsSubmittedSuccess(true);
    }, 800);
  };

  const handleCopyCurrentLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // 1. Kondisi: Token tidak ditemukan
  if (!matchingData || !test || !candidate) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <XCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Tautan Ujian Tidak Valid</h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Token ujian <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px]">{testToken}</code> tidak ditemukan dalam sistem penilaian NusaHR.
            </p>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 text-left space-y-1">
            <span className="font-semibold text-slate-300 block">Kemungkinan penyebab:</span>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
              <li>Token salah atau terpotong saat menyalin tautan.</li>
              <li>HR telah me-reset atau meng-generate ulang token ujian baru.</li>
              <li>Data pelamar telah diperbarui di sistem rekrutmen.</li>
            </ul>
          </div>
          {onClosePortal && (
            <button
              type="button"
              onClick={onClosePortal}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Kembali ke Aplikasi Utama
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Kondisi: Token Hangus (Sudah Digunakan Sebelumnya)
  if (isAlreadyUsed && !isSubmittedSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
              One-Time Link Used
            </span>
            <h2 className="text-lg font-bold text-white mt-2">Tautan Ujian Ini Sudah Digunakan</h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Halo <span className="font-semibold text-white">{candidate.name}</span>, tautan ujian <span className="font-semibold text-indigo-300">{test.testTypeName}</span> ini hanya berlaku untuk <strong>1 (satu) kali submit</strong> dan telah berhasil dikirimkan sebelumnya.
            </p>
          </div>

          <div className="p-3.5 bg-slate-900/70 rounded-xl border border-slate-700/80 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Waktu Submit:</span>
              <span className="font-mono font-semibold text-emerald-400">{test.submittedAt || 'Telah Terkirim'}</span>
            </div>
            {test.submittedUrl && (
              <div className="text-[11px]">
                <span className="text-slate-400 block mb-0.5">Tautan Terkirim:</span>
                <a
                  href={test.submittedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-indigo-400 hover:text-indigo-300 truncate block underline"
                >
                  {test.submittedUrl}
                </a>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            Jika terdapat kendala atau Anda memerlukan ujian ulang resmi, silakan hubungi Tim HR / Rekruter kami agar dapat di-generate tautan baru.
          </p>

          {onClosePortal && (
            <button
              type="button"
              onClick={onClosePortal}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Kembali ke Beranda
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Kondisi: Token Kedaluwarsa (Expired)
  if (isExpired && !test.isTokenUsed && !isSubmittedSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-rose-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase tracking-wider border border-rose-500/30">
              Expired Token
            </span>
            <h2 className="text-lg font-bold text-white mt-2">Masa Berlaku Tautan Telah Berakhir</h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Tautan ujian untuk <span className="font-semibold text-white">{candidate.name}</span> pada posisi <span className="font-semibold text-indigo-300">{vacancy?.title}</span> telah melewati batas limit waktu pengerjaan.
            </p>
          </div>

          <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-700 text-left text-xs space-y-1">
            <span className="text-[11px] text-slate-400 block">Batas Waktu Berlaku:</span>
            <span className="font-mono font-bold text-rose-400 text-xs">{test.tokenExpiresAt || 'Expired'}</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Sistem NusaHR membatasi masa aktif link demi keamanan dan kepatuhan timeline formasi. Silakan menghubungi rekruter untuk permohonan penjadwalan atau generate link baru.
          </p>

          {onClosePortal && (
            <button
              type="button"
              onClick={onClosePortal}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Tutup Portal
            </button>
          )}
        </div>
      </div>
    );
  }

  // 4. Kondisi: Berhasil Submit (Success Screen)
  if (isSubmittedSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/30">
              Submit Berhasil • Link Hangus
            </span>
            <h2 className="text-xl font-bold text-white pt-1">Hasil Ujian Anda Berhasil Dikirimkan!</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Terima kasih, <strong className="text-white">{candidate.name}</strong>. Pekerjaan Anda untuk <strong className="text-indigo-300">{test.testTypeName}</strong> telah tersimpan di sistem penilaian kami.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
              <span className="text-slate-400">Posisi Formasi:</span>
              <span className="font-bold text-white">{vacancy?.title || 'Posisi Lowongan'}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
              <span className="text-slate-400">Waktu Pengumpulan:</span>
              <span className="font-mono text-emerald-400 font-semibold">{new Date().toISOString().replace('T', ' ').substring(0, 16)}</span>
            </div>
            <div className="text-[11px] space-y-1">
              <span className="text-slate-400 block">Tautan Hasil yang Disubmit:</span>
              <a
                href={submittedUrlInput}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-indigo-400 hover:text-indigo-300 truncate block underline bg-slate-900 p-2 rounded-lg border border-slate-800"
              >
                {submittedUrlInput}
              </a>
            </div>
            {submittedNotesInput && (
              <div className="text-[11px] space-y-1 pt-1">
                <span className="text-slate-400 block">Catatan Solusi Pelamar:</span>
                <p className="text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800 whitespace-pre-line leading-relaxed">
                  {submittedNotesInput}
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300 flex items-start gap-2 text-left">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Asesor penguji (<strong className="text-white">{test.assessorName}</strong>) akan meninjau jawaban Anda. Pemberitahuan kelanjutan tahapan seleksi akan disampaikan melalui email resmi.
            </span>
          </div>

          {onClosePortal && (
            <button
              type="button"
              onClick={onClosePortal}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Kembali ke Halaman Rekrutmen HR
            </button>
          )}
        </div>
      </div>
    );
  }

  // 5. TAMPILAN UTAMA PORTAL UJIAN (GATE SCREEN vs ACTIVE TEST WORKSPACE)
  const isTimeCritical = remainingSeconds <= 300; // < 5 menit
  const isTimeWarning = remainingSeconds <= 900; // < 15 menit

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Portal Header */}
      <header className="px-6 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-600/30">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs tracking-tight">NusaHR Talent Assessment Portal</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Official Exam
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Formasi: {vacancy?.title || 'Posisi Formasi'} • Departemen: {vacancy?.department || 'Divisi'}
            </span>
          </div>
        </div>

        {/* Live Timer Countdown (Hanya tampil saat sudah mulai) */}
        {hasStarted ? (
          <div
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono transition-all ${
              isTimeCritical
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                : isTimeWarning
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-800/80 border-slate-700 text-emerald-400 shadow-inner'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <div className="flex flex-col text-right">
              <span className="text-[9px] text-slate-400 uppercase font-sans tracking-wider leading-none">
                Sisa Waktu
              </span>
              <span className="text-base font-black leading-tight tracking-wider">
                {formatTime(remainingSeconds)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Limit Berlaku Link:</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 text-[11px] font-mono border border-slate-700">
              {test.tokenExpiresAt ? `s.d. ${test.tokenExpiresAt}` : '24 Jam'}
            </span>
          </div>
        )}
      </header>

      {/* Main Body Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner Info Kandidat & Ujian */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {test.category}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">Durasi: {test.durationMinutes || 60} Menit</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">Passing Grade: {test.passingGrade}/100</span>
            </div>
            <h1 className="text-lg font-black text-white">{test.testTypeName}</h1>
            <div className="text-xs text-slate-400 flex items-center gap-2 pt-0.5">
              <span>Peserta: <strong className="text-white">{candidate.name}</strong></span>
              <span>•</span>
              <span>Email: <strong className="text-indigo-300">{candidate.email}</strong></span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-right space-y-0.5 shrink-0">
            <span className="text-[10px] text-slate-400 block">Asesor Penguji:</span>
            <span className="font-bold text-white text-xs block">{test.assessorName}</span>
            <span className="text-[10px] text-indigo-400">[{test.assessorRole || 'Asesor Terdaftar'}]</span>
          </div>
        </div>

        {/* ================= GATE SCREEN: SEBELUM KLIK MULAI ================= */}
        {!hasStarted ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-xl font-black text-white">Instruksi Pengerjaan & Verifikasi Siap Uji</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Soal, studi kasus, dan form submit pengerjaan masih terkunci. Timer berdurasi <strong className="text-white">{test.durationMinutes || 60} menit</strong> akan langsung berjalan mundur saat Anda menekan tombol di bawah.
              </p>
            </div>

            {/* Aturan Ujian */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold mb-2">
                  1
                </div>
                <h4 className="font-bold text-white text-xs">One-Time Token</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tautan ini hanya berlaku 1 kali pengerjaan dan akan hangus otomatis setelah disubmit.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold mb-2">
                  2
                </div>
                <h4 className="font-bold text-white text-xs">Hitung Mundur Otomatis</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Timer tidak dapat dijeda. Pastikan Anda berada di tempat tenang dengan koneksi stabil.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold mb-2">
                  3
                </div>
                <h4 className="font-bold text-white text-xs">Submit Tautan Solusi</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Siapkan tautan repositori (GitHub / GitLab / Drive) dan ringkasan penjelasan teknis Anda.
                </p>
              </div>
            </div>

            {/* Tombol Mulai */}
            <div className="pt-4 flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleStartTest}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Mulai Pengerjaan Tes Sekarang (Buka Soal & Timer)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <span className="text-[11px] text-slate-400">
                Limit waktu berlaku link ini: <strong className="text-amber-300">{test.tokenExpiresAt || '24 Jam dari penugasan'}</strong>
              </span>
            </div>
          </div>
        ) : (
          /* ================= ACTIVE TEST WORKSPACE: KONTEN SOAL TERBUKA & FORM SUBMIT ================= */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Banner Timer Berjalan */}
            <div className="p-4 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs">Ujian Sedang Berjalan Aktif</h3>
                  <span className="text-[11px] text-slate-300">
                    Dimulai pada {test.testStartedAt ? new Date(test.testStartedAt).toLocaleTimeString() : 'Baru saja'}. Pastikan menyelesaikan sebelum waktu habis.
                  </span>
                </div>
              </div>

              <span className="font-mono text-sm font-bold text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                {formatTime(remainingSeconds)}
              </span>
            </div>

            {/* Konten & Deskripsi Tes Nyata */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Deskripsi Tugas & Instruksi Pengujian</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">ID: {test.id}</span>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-200">
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-indigo-300 uppercase text-[11px] tracking-wider">
                    Deskripsi Soal / Kasus Teknis:
                  </h4>
                  <p className="whitespace-pre-line text-slate-300">
                    {test.testDescription ||
                      `Anda diminta untuk menyelesaikan studi kasus teknis sesuai dengan standar posisi ${vacancy?.title || 'formasi'}. Silakan periksa struktur data, rancang solusi arsitektur yang modular, bersih (clean code), dan teruji, serta tangani potensi race conditions atau edge cases.`}
                  </p>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-emerald-300 uppercase text-[11px] tracking-wider">
                    Output yang Diharapkan (Expected Deliverables):
                  </h4>
                  <p className="whitespace-pre-line text-slate-300">
                    {test.expectedOutput ||
                      `1. Tautan repositori publik (GitHub/GitLab) atau Google Drive berisi kode sumber lengkap.\n2. Dokumentasi arsitektur singkat pada README.md mengenai pendekatan teknis yang Anda pilih.\n3. Instruksi cara menjalankan program dan unit test coverage.`}
                  </p>
                </div>

                {test.testUrlOrRepo && (
                  <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-blue-200 block">Tautan Starter Kit / Sandbox:</span>
                      <span className="text-[11px] text-slate-400">Gunakan repositori/sandbox berikut sebagai acuan pengerjaan</span>
                    </div>
                    <a
                      href={test.testUrlOrRepo}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Starter Kit</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* FORM SUBMIT HASIL TES NYATA */}
            <form onSubmit={handleSubmitTest} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Form Pengumpulan / Submit Hasil Tes Pelamar</span>
                </h3>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Isikan tautan hasil pekerjaan Anda. Setelah disubmit, tautan ujian ini akan hangus dan langsung diteruskan ke tim asesor.
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-white block mb-1">
                    Tautan / Link Hasil Pengerjaan (GitHub / GitLab / Google Drive / Figma / Sandbox) *
                  </label>
                  <input
                    type="url"
                    required
                    value={submittedUrlInput}
                    onChange={(e) => setSubmittedUrlInput(e.target.value)}
                    placeholder="https://github.com/username/project-submission atau https://drive.google.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Pastikan tautan dapat diakses publik atau izin akses disetel ke "Anyone with link can view".
                  </span>
                </div>

                <div>
                  <label className="font-bold text-white block mb-1">
                    Ringkasan Solusi & Catatan Evaluasi Pelamar (Opsional tapi Direkomendasikan)
                  </label>
                  <textarea
                    rows={4}
                    value={submittedNotesInput}
                    onChange={(e) => setSubmittedNotesInput(e.target.value)}
                    placeholder="Jelaskan secara ringkas arsitektur yang Anda buat, library/alat yang dipakai, trade-off keputusan teknis, dan kendala yang dihadapi..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-500"
                  />
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Peringatan Satu Kali Pakai:</strong> Pengiriman hasil tes bersifat final. Pastikan seluruh berkas telah selesai sebelum mengklik tombol submit di bawah.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !submittedUrlInput.trim()}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengirimkan Hasil...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Kirim & Submit Hasil Tes Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-900 bg-slate-950 text-slate-500 text-[11px] text-center flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto">
        <span>© 2026 NusaHR Talent Assessment Engine. Hak Cipta Dilindungi.</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyCurrentLink}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Tersalin!' : 'Copy Link Portal Ini'}</span>
          </button>
          {onClosePortal && (
            <button
              type="button"
              onClick={onClosePortal}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Kembali ke HRMS
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

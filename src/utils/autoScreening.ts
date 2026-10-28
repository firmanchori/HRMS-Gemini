import {
  AutoScreeningResult,
  Candidate,
  ScreeningKnockoutCriterion,
  ScreeningMatchMode,
  ScreeningScoredCriterion,
} from '../types/hrms';

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Gabungkan seluruh teks profil/CV kandidat menjadi satu korpus untuk pencocokan kata kunci. */
export const buildCandidateCorpus = (c: Candidate): string => {
  const p = c.parsedData;
  const parts: (string | number | undefined)[] = [
    c.name,
    c.lastCompany,
    c.cvText,
    c.screeningNotes,
    c.cvFileName,
    p?.currentTitle,
    p?.currentCompany,
    p?.education,
    p?.university,
    p?.topSkills?.join(' '),
    p?.totalExperienceYears !== undefined ? `${p.totalExperienceYears} tahun ${p.totalExperienceYears} years` : undefined,
    c.matchedKeywords?.join(' '),
  ];
  return parts.filter((x) => x !== undefined && x !== null && String(x).trim() !== '').join(' \n ');
};

/** Cek satu kata kunci pada korpus: huruf besar/kecil diabaikan, dan batas kata dijaga agar "S1" tidak cocok dengan "S10". */
export const keywordMatches = (corpus: string, keyword: string): boolean => {
  const kw = keyword.trim();
  if (!kw) return false;
  const pattern = `(?<![\\p{L}\\p{N}])${escapeRegExp(kw).replace(/\s+/g, '\\s+')}(?![\\p{L}\\p{N}])`;
  try {
    return new RegExp(pattern, 'iu').test(corpus);
  } catch {
    return corpus.toLowerCase().includes(kw.toLowerCase());
  }
};

const evaluateKeywords = (corpus: string, keywords: string[], mode: ScreeningMatchMode) => {
  const clean = keywords.map((k) => k.trim()).filter(Boolean);
  const matched = clean.filter((k) => keywordMatches(corpus, k));
  const passed = clean.length === 0 ? true : mode === 'all' ? matched.length === clean.length : matched.length > 0;
  return { clean, matched, passed };
};

/** Pecah input teks "a, b; c" menjadi daftar kata kunci. */
export const parseKeywordInput = (raw: string): string[] =>
  raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

export const runAutoScreening = (
  candidate: Candidate,
  knockout: ScreeningKnockoutCriterion[] = [],
  scored: ScreeningScoredCriterion[] = []
): AutoScreeningResult => {
  const hasCriteria = knockout.length + scored.length > 0;
  const corpus = buildCandidateCorpus(candidate);

  const knockoutResults = knockout.map((k) => {
    const r = evaluateKeywords(corpus, k.keywords, k.matchMode);
    return {
      id: k.id,
      category: k.category,
      label: k.label,
      passed: r.passed,
      matchedKeywords: r.matched,
      requiredKeywords: r.clean,
      matchMode: k.matchMode,
    };
  });

  const totalWeight = scored.reduce((acc, s) => acc + (Number(s.weight) || 0), 0);
  const scoredResults = scored.map((s) => {
    const r = evaluateKeywords(corpus, s.keywords, s.matchMode);
    const matched = s.keywords.length > 0 && r.passed;
    return {
      id: s.id,
      label: s.label,
      weight: Number(s.weight) || 0,
      matched,
      matchedKeywords: r.matched,
      points: matched ? Number(s.weight) || 0 : 0,
    };
  });

  const earned = scoredResults.reduce((acc, s) => acc + s.points, 0);
  const totalScore = totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;
  const failedKnockouts = knockoutResults.filter((k) => !k.passed);

  return {
    hasCriteria,
    status: !hasCriteria ? 'Tanpa Kriteria' : failedKnockouts.length > 0 ? 'Gugur' : 'Lolos',
    knockoutResults,
    failedKnockouts,
    scoredResults,
    totalScore,
    totalWeight,
  };
};

/** Preset kategori kriteria gugur & contoh kata kunci (bisa diubah bebas oleh pengaju FPTK). */
export const KNOCKOUT_CATEGORY_PRESETS: { category: string; label: string; keywords: string; matchMode: ScreeningMatchMode; hint: string }[] = [
  { category: 'Sertifikasi / Lisensi Profesional', label: 'Sertifikasi / Lisensi Wajib', keywords: 'STR, Surat Tanda Registrasi', matchMode: 'any', hint: 'Perawat: STR · Driver: SIM B1/B2 · Akuntan: CPA' },
  { category: 'Lokasi & Mobilitas', label: 'Lokasi Penempatan & Kesiapan Dinas', keywords: 'Cikarang, Karawang, Bekasi', matchMode: 'any', hint: 'Lokasi penempatan atau frasa "bersedia dinas luar kota" / "willing to travel"' },
  { category: 'Pendidikan Minimal', label: 'Batasan Pendidikan Minimal', keywords: 'S1, Sarjana, D4, Magister, S2', matchMode: 'any', hint: 'Hanya D3/SMA otomatis gugur' },
  { category: 'Waktu Kerja', label: 'Kesiapan Shift / Notice Period', keywords: 'shift, 24/7, immediate, 1 month notice', matchMode: 'any', hint: 'Shift/24/7 untuk operasional; immediate/1 month notice bila butuh cepat' },
  { category: 'Lainnya', label: 'Kriteria Gugur Lainnya', keywords: '', matchMode: 'any', hint: 'Kriteria bebas sesuai kebutuhan posisi' },
];

export const newCriterionId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

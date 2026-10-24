import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  FileText,
  CheckCircle2,
  HelpCircle,
  Copy,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  Calendar,
  Hash,
  Briefcase,
  GraduationCap,
  Award,
} from 'lucide-react';
import {
  NIK_TOKEN_CATALOG,
  previewNikPattern,
  DEFAULT_FLEXIBLE_NIK_SETTINGS,
} from '../../utils/nikGenerator';
import { FlexibleNikSettings, NikPatternConfig } from '../../types/hrms';

export const NikFormatSettingsTab: React.FC = () => {
  const {
    currentTenant,
    currentEntity,
    flexibleNikSettings,
    updateFlexibleNikSettings,
    employees,
  } = useHrms();

  const [activeTypeTab, setActiveTypeTab] = useState<'permanent' | 'contract' | 'internship' | 'freelance'>('permanent');
  const [localSettings, setLocalSettings] = useState<FlexibleNikSettings>(() => ({
    permanent: { ...flexibleNikSettings.permanent },
    contract: { ...flexibleNikSettings.contract },
    internship: { ...flexibleNikSettings.internship },
    freelance: { ...(flexibleNikSettings.freelance || DEFAULT_FLEXIBLE_NIK_SETTINGS.freelance!) },
  }));

  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentConfig: NikPatternConfig = localSettings[activeTypeTab];

  const updateCurrentConfig = (updates: Partial<NikPatternConfig>) => {
    setLocalSettings((prev) => ({
      ...prev,
      [activeTypeTab]: {
        ...prev[activeTypeTab],
        ...updates,
      },
    }));
    setSaveSuccess(false);
  };

  const handleInsertToken = (token: string) => {
    const current = currentConfig.pattern || '';
    updateCurrentConfig({ pattern: `${current}${token}` });
  };

  const handleResetToDefault = () => {
    const def = DEFAULT_FLEXIBLE_NIK_SETTINGS[activeTypeTab];
    updateCurrentConfig({
      pattern: def.pattern,
      counter: def.counter,
      digitPadding: def.digitPadding,
      resetCycle: def.resetCycle,
      prefix: '',
      suffix: '',
    });
  };

  const handleSave = () => {
    updateFlexibleNikSettings(localSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Preview simulations
  const preview1 = previewNikPattern(
    currentConfig.pattern,
    activeTypeTab,
    currentEntity.code || currentTenant.code,
    currentConfig.counter || 1,
    currentConfig.digitPadding || 4
  );

  const preview2 = previewNikPattern(
    currentConfig.pattern,
    activeTypeTab,
    currentEntity.code || currentTenant.code,
    (currentConfig.counter || 1) + 1,
    currentConfig.digitPadding || 4
  );

  const preview3 = previewNikPattern(
    currentConfig.pattern,
    activeTypeTab,
    currentEntity.code || currentTenant.code,
    (currentConfig.counter || 1) + 2,
    currentConfig.digitPadding || 4
  );

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(label);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const typeMeta = [
    {
      id: 'permanent',
      label: 'Karyawan Tetap (PKWTT)',
      icon: Award,
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      activeColor: 'border-indigo-600 text-indigo-600',
      count: employees.filter((e) => (e.employmentType || '').toLowerCase().includes('tetap')).length,
    },
    {
      id: 'contract',
      label: 'Karyawan Kontrak (PKWT)',
      icon: Briefcase,
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      activeColor: 'border-emerald-600 text-emerald-600',
      count: employees.filter((e) => (e.employmentType || '').toLowerCase().includes('kontrak')).length,
    },
    {
      id: 'internship',
      label: 'Karyawan Magang (Internship)',
      icon: GraduationCap,
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
      activeColor: 'border-purple-600 text-purple-600',
      count: employees.filter((e) => (e.employmentType || '').toLowerCase().includes('magang')).length,
    },
    {
      id: 'freelance',
      label: 'Tenaga Lepas / Mitra Konsultan',
      icon: Layers,
      badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
      activeColor: 'border-amber-600 text-amber-600',
      count: employees.filter((e) => (e.employmentType || '').toLowerCase().includes('lepas') || (e.employmentType || '').toLowerCase().includes('freelance')).length,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-950/40 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full text-[11px] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Penomoran Fleksibel Standard ISO 9001
              </span>
              <span className="text-xs text-slate-300">• Entitas: <b>{currentEntity.name}</b></span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1.5">
              Pengaturan Pola & Format NIK Karyawan Dinamis
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Format Nomor Induk Karyawan (NIK) dapat dibedakan secara fleksibel antara <b>Karyawan Tetap</b>, <b>Karyawan Kontrak</b>, dan <b>Magang</b>. Pola penomoran bekerja dinamis berbasis formula token (Tahun, Kode Entitas, Nomor Urut, Bulan Romawi) menyerupai konsep tata kelola penomoran dokumen resmi.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Format NIK</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="mt-3 p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Format pola NIK berhasil disimpan dan aktif untuk pendaftaran serta onboarding karyawan baru.</span>
          </div>
        )}
      </div>

      {/* Type Selector Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
        {typeMeta.map((t) => {
          const Icon = t.icon;
          const isActive = activeTypeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTypeTab(t.id as any)}
              className={`flex-1 min-w-[200px] p-3 rounded-lg text-left transition-all border flex items-center justify-between gap-3 ${
                isActive
                  ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-200 shadow-xs'
                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className={`text-xs font-bold truncate ${isActive ? 'text-indigo-950' : 'text-slate-800'}`}>
                    {t.label}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {localSettings[t.id as keyof FlexibleNikSettings]?.pattern || 'Belum diatur'}
                  </div>
                </div>
              </div>

              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${t.badgeColor}`}>
                {t.count} Pegawai
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Configuration Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Pattern Editor & Token Catalog (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Formula Format NIK: {typeMeta.find((m) => m.id === activeTypeTab)?.label}
                </h3>
                <span className="text-[11px] text-slate-500">
                  Ketik format kustom atau klik tag token dinamis di bawah untuk menyisipkan variabel.
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[11px] font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                title="Kembalikan ke format bawaan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Bawaan</span>
              </button>
            </div>

            {/* Pattern Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Formula Pola NIK Otomatis *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={currentConfig.pattern}
                  onChange={(e) => updateCurrentConfig({ pattern: e.target.value })}
                  placeholder="Contoh: {ENTITY}-TTP/{YYYY}/{SEQ:4}"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-indigo-300 rounded-lg font-mono font-bold text-sm text-slate-900 focus:bg-white focus:outline-indigo-600 transition-all"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Gunakan kurung kurawal <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono font-bold text-[10px]">{'{TOKEN}'}</code> seperti pada penomoran dokumen resmi.
              </span>
            </div>

            {/* Token Catalog - Click to insert */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Daftar Token Variabel Dinamis (Klik untuk Sisipkan)</span>
                <span className="text-[10px] text-slate-400">{NIK_TOKEN_CATALOG.length} Token Tersedia</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {NIK_TOKEN_CATALOG.map((tok) => (
                  <button
                    key={tok.token}
                    type="button"
                    onClick={() => handleInsertToken(tok.token)}
                    className="p-2 text-left bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-lg transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <code className="text-[11px] font-mono font-bold text-indigo-700 group-hover:text-indigo-900">
                        {tok.token}
                      </code>
                      <span className="text-[10px] px-1 py-0.2 bg-white text-slate-500 rounded border border-slate-200 font-mono">
                        {tok.example}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5 truncate font-medium">
                      {tok.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sequence & Reset Settings Grid */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-indigo-600" />
                  Nomor Urut Mulai (Counter)
                </label>
                <input
                  type="number"
                  min={1}
                  value={currentConfig.counter || 1}
                  onChange={(e) => updateCurrentConfig({ counter: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-semibold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Sequence berikutnya</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Panjang Digit Padding
                </label>
                <select
                  value={currentConfig.digitPadding || 4}
                  onChange={(e) => updateCurrentConfig({ digitPadding: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-semibold bg-white"
                >
                  <option value={3}>3 Digit (001 - 999)</option>
                  <option value={4}>4 Digit (0001 - 9999)</option>
                  <option value={5}>5 Digit (00001 - 99999)</option>
                  <option value={6}>6 Digit (000001 - 999999)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Format padding angka</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Siklus Reset Nomor
                </label>
                <select
                  value={currentConfig.resetCycle || 'yearly'}
                  onChange={(e) => updateCurrentConfig({ resetCycle: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-semibold bg-white"
                >
                  <option value="yearly">Setiap Tahun Baru (1 Jan)</option>
                  <option value="monthly">Setiap Bulan Baru</option>
                  <option value="never">Tidak Pernah (Lanjut Terus)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Otomatisasi counter</span>
              </div>
            </div>

            {/* Custom Prefix & Suffix */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Prefix Tambahan (Awalan Kustom)
                </label>
                <input
                  type="text"
                  value={currentConfig.prefix || ''}
                  onChange={(e) => updateCurrentConfig({ prefix: e.target.value })}
                  placeholder="Opsional (misal: ID-)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Suffix Tambahan (Akhiran Kustom)
                </label>
                <input
                  type="text"
                  value={currentConfig.suffix || ''}
                  onChange={(e) => updateCurrentConfig({ suffix: e.target.value })}
                  placeholder="Opsional (misal: /HQ)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview Simulator (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-950 text-white p-5 rounded-xl shadow-lg border border-indigo-800/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-700/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                  Live Preview Simulator NIK
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Real-Time
              </span>
            </div>

            {/* Active Result Card */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-indigo-500/30 space-y-2">
              <span className="text-[10px] text-indigo-300 font-semibold block uppercase">
                Hasil NIK Karyawan Pertama ({typeMeta.find((m) => m.id === activeTypeTab)?.label}):
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xl sm:text-2xl font-mono font-black text-indigo-300 tracking-wider">
                  {preview1}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(preview1, 'preview1')}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  title="Salin NIK"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copiedType === 'preview1' && (
                <span className="text-[10px] text-emerald-400 block font-semibold animate-fadeIn">
                  ✓ Berhasil disalin ke clipboard!
                </span>
              )}
            </div>

            {/* Sequence Continuation Simulation */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] text-slate-300 font-semibold block">
                Simulasi Urutan Karyawan Berikutnya:
              </span>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Karyawan ke-2:</span>
                  <span className="font-bold text-emerald-300">{preview2}</span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Karyawan ke-3:</span>
                  <span className="font-bold text-indigo-200">{preview3}</span>
                </div>
              </div>
            </div>

            {/* Breakdown Explained */}
            <div className="p-3 bg-indigo-950/40 rounded-lg border border-indigo-700/30 text-[11px] text-slate-300 space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>Rasionalisasi Format:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Format ini menjamin tidak terjadi tabrakan NIK antar status kerja. NIK karyawan tetap, kontrak PKWT, dan magang memiliki identitas penomoran terpisah sehingga memudahkan pelaporan audit ketenagakerjaan dan validasi dokumen kontrak.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Terapkan Format {typeMeta.find((m) => m.id === activeTypeTab)?.label}</span>
            </button>
          </div>

          {/* Quick Info Box */}
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Kepatuhan Multi-Entitas (Holding/Anak/Cucu)</span>
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              Token <code className="bg-amber-100 text-amber-950 px-1 py-0.5 rounded font-mono font-bold">{'{ENTITY}'}</code> akan secara otomatis mengambil kode entitas di mana karyawan tersebut ditempatkan (misal <b>NTM</b> untuk Holding, <b>NSD</b> untuk Anak Digital, <b>DSF</b> untuk Cucu Finansial).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

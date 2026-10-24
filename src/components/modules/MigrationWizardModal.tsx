import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  X,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Building,
  RefreshCw,
} from 'lucide-react';
import {
  SAMPLE_EMPLOYEE_CSV,
  downloadCSV,
  parseEmployeeCSV,
} from '../../utils/csvHelper';
import { MigrationRowPreview } from '../../types/hrms';

interface MigrationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MigrationWizardModal: React.FC<MigrationWizardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentTenant, executeMigrationImport, setActiveModule } = useHrms();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Tenant config during wizard
  const [tenantCity, setTenantCity] = useState(currentTenant.city);
  const [umrValue, setUmrValue] = useState(currentTenant.umr);
  const [workDays, setWorkDays] = useState<5 | 6>(currentTenant.workDaysPerWeek);

  // File & rows
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<MigrationRowPreview[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; error: number } | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    downloadCSV(`template_migrasi_karyawan_${currentTenant.code.toLowerCase()}.csv`, SAMPLE_EMPLOYEE_CSV);
  };

  const handleLoadSampleData = () => {
    setCsvContent(SAMPLE_EMPLOYEE_CSV);
    const rows = parseEmployeeCSV(SAMPLE_EMPLOYEE_CSV);
    setParsedRows(rows);
    setStep(3);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvContent(text);
      const rows = parseEmployeeCSV(text);
      setParsedRows(rows);
      setStep(3);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    const res = executeMigrationImport(parsedRows);
    setImportResult({ success: res.successCount, error: res.errorCount });
    setStep(4);
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Setup Awal & Migrasi
              </span>
              <h2 className="text-base font-bold text-white">
                Wizard Impor Data Karyawan & Organisasi
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tenant: <span className="text-slate-200 font-semibold">{currentTenant.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
          {[
            { num: 1, title: '1. Profil Kebijakan' },
            { num: 2, title: '2. Upload Dokumen' },
            { num: 3, title: '3. Validasi Anomali' },
            { num: 4, title: '4. Selesai' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 font-medium ${
                step === s.num
                  ? 'text-indigo-600 font-semibold'
                  : step > s.num
                  ? 'text-emerald-600'
                  : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono ${
                  step === s.num
                    ? 'bg-indigo-600 text-white'
                    : step > s.num
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span>{s.title}</span>
            </div>
          ))}
        </div>

        {/* Content body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* STEP 1: Profil & Kebijakan */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Parameter Kebijakan & Regulasi Awal
                </h3>
                <p className="text-xs text-slate-600">
                  Pastikan konfigurasi ketenagakerjaan telah sesuai sebelum mengimpor database karyawan baru.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <span>Lokasi & Nilai UMR Wilayah</span>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Kota Operasional
                    </label>
                    <input
                      type="text"
                      value={tenantCity}
                      onChange={(e) => setTenantCity(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Standar UMR (IDR)
                    </label>
                    <input
                      type="number"
                      value={umrValue}
                      onChange={(e) => setUmrValue(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Digunakan sebagai batas acuan lembur dan audit upah minimum.
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    <span>Skema Hari & Jam Kerja</span>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Jumlah Hari Kerja per Minggu
                    </label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="workDays"
                          checked={workDays === 5}
                          onChange={() => setWorkDays(5)}
                          className="text-indigo-600"
                        />
                        <span>5 Hari Kerja (8 Jam/hari)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="workDays"
                          checked={workDays === 6}
                          onChange={() => setWorkDays(6)}
                          className="text-indigo-600"
                        />
                        <span>6 Hari Kerja (7 Jam/hari)</span>
                      </label>
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                    Kepatuhan Regulasi: PPh 21 TER 2024 (PP 58/2023) dan BPJS Ketenagakerjaan akan otomatis diaktifkan untuk seluruh data yang diimpor.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Upload File */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Unggah Berkas Spreadsheet Master Karyawan
                </h3>
                <p className="text-xs text-slate-600">
                  Gunakan format CSV atau Excel standar yang telah disediakan untuk memastikan struktur kolom terbaca sempurna.
                </p>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors bg-white flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                      <Download className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">
                      1. Unduh Template CSV Resmi
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Berisi kolom NIK, Nama, Email, Status Kontrak, Departemen, Jabatan, Gaji Pokok, PTKP, dan Saldo Cuti.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Template .CSV</span>
                  </button>
                </div>

                <div className="p-5 border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50/30 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">
                    2. Unggah File yang Telah Diisi
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Pilih file CSV dari komputer Anda untuk divalidasi langsung oleh sistem.
                  </p>
                  <label className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                    <span>Pilih Berkas CSV</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Fast test trigger */}
              <div className="p-4 bg-slate-100 rounded-lg flex items-center justify-between border border-slate-200">
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    Uji Cepat (Simulasi Data Nyata)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Ingin langsung melihat proses tanpa menyiapkan spreadsheet? Muat 5 data karyawan realistis Indonesia.
                  </div>
                </div>
                <button
                  onClick={handleLoadSampleData}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md transition-colors shrink-0"
                >
                  Muat Data Contoh
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Anomaly Check */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Hasil Validasi & Deteksi Anomali
                  </h3>
                  <p className="text-xs text-slate-600">
                    Pemeriksaan format NIK unik, email, kelayakan gaji positif, dan kategori PTKP.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-semibold">
                    ✓ {validCount} Siap Impor
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 font-semibold">
                      ✕ {invalidCount} Anomali
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Status</th>
                        <th className="py-2 px-3 font-semibold">NIK</th>
                        <th className="py-2 px-3 font-semibold">Nama Lengkap</th>
                        <th className="py-2 px-3 font-semibold">Departemen & Jabatan</th>
                        <th className="py-2 px-3 font-semibold">Tipe</th>
                        <th className="py-2 px-3 font-semibold text-right">Gaji Pokok</th>
                        <th className="py-2 px-3 font-semibold text-center">PTKP</th>
                        <th className="py-2 px-3 font-semibold text-center">Saldo Cuti</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((r, idx) => (
                        <tr
                          key={idx}
                          className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}
                        >
                          <td className="py-2 px-3">
                            {r.isValid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Valid</span>
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-rose-600 font-medium text-[11px]"
                                title={r.validationError}
                              >
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[90px]">{r.validationError}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono font-medium text-slate-800">
                            {r.nik}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-900">{r.nama}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{r.email}</div>
                          </td>
                          <td className="py-2 px-3">
                            <div>{r.jabatan}</div>
                            <div className="text-[10px] text-slate-500">{r.departemen}</div>
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-[11px] font-medium text-slate-700">
                              {r.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-right text-slate-800">
                            Rp {r.gajiPokok.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">{r.ptkp}</td>
                          <td className="py-2 px-3 text-center font-mono">{r.saldoCuti} Hari</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success / Completed */}
          {step === 4 && importResult && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Migrasi Data Karyawan Berhasil!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Sebanyak <strong className="text-emerald-700">{importResult.success} data karyawan</strong> telah berhasil dimasukkan ke sistem tenant {currentTenant.name}. Saldo cuti awal dan skema PPh 21 TER telah aktif.
                </p>
              </div>

              <div className="inline-flex gap-3 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    setActiveModule('employees');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
                >
                  Buka Master Karyawan
                </button>
                <button
                  onClick={() => {
                    onClose();
                    setActiveModule('payroll');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors"
                >
                  Lihat Skema Payroll
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {step > 1 && step < 4 && (
              <button
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 3 && (
              <button
                onClick={() => setStep((prev) => (prev + 1) as any)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Lanjutkan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleExecuteImport}
                disabled={validCount === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Konfirmasi & Eksekusi Impor ({validCount} Baris)</span>
              </button>
            )}

            {step === 4 && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors"
              >
                Tutup Wizard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

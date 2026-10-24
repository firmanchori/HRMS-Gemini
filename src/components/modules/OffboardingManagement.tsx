import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  UserMinus,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  AlertCircle,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react';
import { formatRupiah, calculateSeverancePay } from '../../utils/taxCalculator';
import { ValidatedDateInput } from '../common/ValidatedDateInput';

export const OffboardingManagement: React.FC = () => {
  const {
    employees,
    offboardingRecords,
    initiateOffboarding,
    updateOffboardingChecklist,
  } = useHrms();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [separationType, setSeparationType] = useState<any>('Resign Sukarela');
  const [effectiveDate, setEffectiveDate] = useState('2026-11-30');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const selectedEmp = employees.find((e) => e.id === employeeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidationErrors(true);
    setFormError(null);

    if (!employeeId) {
      setFormError('Pilih karyawan yang akan diproses offboarding.');
      return;
    }
    if (!effectiveDate || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
      setFormError('Tanggal efektif offboarding harus diisi dengan format YYYY-MM-DD valid.');
      return;
    }

    initiateOffboarding(employeeId, separationType, effectiveDate, notes || 'Pengajuan pengakhiran hubungan kerja resmi');
    setIsModalOpen(false);
    setNotes('');
    setShowValidationErrors(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Manajemen Offboarding & Kompensasi PP 35/2021
          </h2>
          <p className="text-xs text-slate-500">
            Tata kelola pemutusan hubungan kerja, clearance serah terima aset, audit pinjaman, kalkulasi pesangon/UPMK, dan penerbitan Parklaring.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
        >
          <UserMinus className="w-3.5 h-3.5" />
          <span>Inisiasi Offboarding Baru</span>
        </button>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <span className="text-xs text-slate-500 block mb-1">Dalam Proses Clearance</span>
          <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {offboardingRecords.filter((o) => !o.parklaringIssued).length} Karyawan
          </span>
          <div className="text-[11px] text-slate-500 mt-1">Menunggu serah terima aset & kliring keuangan</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <span className="text-xs text-slate-500 block mb-1">Total Hak Pesangon / Kompensasi</span>
          <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
            {formatRupiah(offboardingRecords.reduce((sum, o) => sum + o.severancePay, 0))}
          </span>
          <div className="text-[11px] text-slate-500 mt-1">Sesuai formula PP 35/2021 & masa kerja</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <span className="text-xs text-slate-500 block mb-1">Parklaring Telah Diterbitkan</span>
          <span className="text-2xl font-bold font-mono text-indigo-700 tabular-nums">
            {offboardingRecords.filter((o) => o.parklaringIssued).length} Berkas
          </span>
          <div className="text-[11px] text-slate-500 mt-1">Surat Pengalaman Kerja resmi dengan QR TTD</div>
        </div>
      </div>

      {/* Clearance Records Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="py-2.5 px-3 font-semibold">Karyawan & NIK</th>
              <th className="py-2.5 px-3 font-semibold">Jenis Pengakhiran</th>
              <th className="py-2.5 px-3 font-semibold text-center">Tanggal Efektif</th>
              <th className="py-2.5 px-3 font-semibold text-center">Handover SOP</th>
              <th className="py-2.5 px-3 font-semibold text-center">Aset Kembali</th>
              <th className="py-2.5 px-3 font-semibold text-center">Kliring Kasbon</th>
              <th className="py-2.5 px-3 font-semibold text-right">Pesangon / UPMK</th>
              <th className="py-2.5 px-3 font-semibold text-center">Surat Parklaring</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {offboardingRecords.map((rec) => {
              const emp = employees.find((e) => e.id === rec.employeeId);
              return (
                <tr key={rec.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{emp?.fullName || 'Karyawan'}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{emp?.nik} · {emp?.department}</div>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    {rec.separationType}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                    {rec.effectiveDate}
                  </td>
                  {/* Checklist Toggles */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() =>
                        updateOffboardingChecklist(rec.id, {
                          handoverCompleted: !rec.handoverCompleted,
                        })
                      }
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                        rec.handoverCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {rec.handoverCompleted ? '✓ Selesai' : 'Pending'}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() =>
                        updateOffboardingChecklist(rec.id, {
                          assetReturned: !rec.assetReturned,
                        })
                      }
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                        rec.assetReturned
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {rec.assetReturned ? '✓ Dikembalikan' : 'Pending'}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() =>
                        updateOffboardingChecklist(rec.id, {
                          financeCleared: !rec.financeCleared,
                        })
                      }
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                        rec.financeCleared
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {rec.financeCleared ? '✓ Kliring OK' : 'Pending'}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(rec.severancePay)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {!rec.parklaringIssued ? (
                      <button
                        onClick={() =>
                          updateOffboardingChecklist(rec.id, {
                            parklaringIssued: true,
                          })
                        }
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold shadow-xs"
                      >
                        Terbitkan Parklaring
                      </button>
                    ) : (
                      <div className="text-emerald-700 font-semibold text-[11px]">
                        ✓ {rec.parklaringNumber}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: Inisiasi Offboarding */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Inisiasi Proses Offboarding Karyawan</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {/* Form Validation Error Notice */}
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="font-medium text-slate-700 block mb-1">Pilih Karyawan *</label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.nik}) - Bergabung: {emp.joinDate}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Alasan Pengakhiran</label>
                  <select
                    value={separationType}
                    onChange={(e) => setSeparationType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-medium"
                  >
                    <option value="Resign Sukarela">Resign Sukarela (1-Month Notice)</option>
                    <option value="Habis Kontrak">Habis Masa Kontrak PKWT</option>
                    <option value="PHK Efisiensi">PHK Efisiensi / Restrukturisasi</option>
                    <option value="PHK Indisipliner">PHK Indisipliner (SP 3)</option>
                  </select>
                </div>
                <ValidatedDateInput
                  id="offboardingEffectiveDate"
                  label="Tanggal Efektif Terakhir *"
                  value={effectiveDate}
                  onChange={(val) => {
                    setEffectiveDate(val);
                    if (formError) setFormError(null);
                  }}
                  required
                  showError={showValidationErrors}
                  helperText="Format YYYY-MM-DD. Hari kerja terakhir karyawan"
                />
              </div>

              {selectedEmp && separationType.includes('PHK') && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] text-emerald-900 leading-snug">
                  <strong>Simulasi Pesangon PP 35/2021:</strong> Berdasarkan masa kerja sejak {selectedEmp.joinDate}, estimasi hak pesangon + UPMK adalah <strong>{formatRupiah(calculateSeverancePay(selectedEmp.basicSalary, 3).totalSeverance)}</strong>.
                </div>
              )}

              <div>
                <label className="font-medium text-slate-700 block mb-1">Catatan Exit Interview</label>
                <textarea
                  rows={3}
                  placeholder="Keterangan serah terima berkas, proyek berjalan, dan alasan pengunduran diri..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-md font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold shadow-xs"
                >
                  Mulai Alur Offboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  DollarSign,
  Plus,
  Layers,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Search,
  Filter,
  X,
  CreditCard,
} from 'lucide-react';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { CurrencyInput } from '../common/CurrencyInput';
import { ValidatedDateInput } from '../common/ValidatedDateInput';

export const SalaryComponentManagement: React.FC = () => {
  const {
    salaryComponents,
    addSalaryComponent,
    employeeSalaryAssignments,
    assignSalaryComponent,
    employees,
    currentTenant,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'master' | 'assignments'>('master');
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [compFormError, setCompFormError] = useState<string | null>(null);
  const [assignFormError, setAssignFormError] = useState<string | null>(null);

  // Form State Master Component
  const [compForm, setCompForm] = useState({
    code: '',
    name: '',
    category: 'Tunjangan Tetap' as const,
    calculationBasis: 'Nominal Tetap' as const,
    defaultValue: 1000000,
    isTaxable: true,
    isBpjsBase: false,
    description: '',
  });

  // Form State Assignment
  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    componentId: '',
    amount: 1000000,
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const handleCreateComponent = (e: React.FormEvent) => {
    e.preventDefault();
    setCompFormError(null);

    if (!compForm.code.trim()) {
      setCompFormError('Kode komponen gaji wajib diisi.');
      return;
    }
    if (!compForm.name.trim()) {
      setCompFormError('Nama komponen gaji wajib diisi.');
      return;
    }
    if (compForm.defaultValue < 0) {
      setCompFormError('Nilai standar komponen tidak boleh negatif.');
      return;
    }

    addSalaryComponent({
      code: compForm.code.trim().toUpperCase(),
      name: compForm.name.trim(),
      category: compForm.category,
      calculationBasis: compForm.calculationBasis,
      defaultValue: Number(compForm.defaultValue),
      isTaxable: compForm.isTaxable,
      isBpjsBase: compForm.isBpjsBase,
      description: compForm.description,
    });

    setIsCompModalOpen(false);
    setCompForm({
      code: '',
      name: '',
      category: 'Tunjangan Tetap',
      calculationBasis: 'Nominal Tetap',
      defaultValue: 1000000,
      isTaxable: true,
      isBpjsBase: false,
      description: '',
    });
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignFormError(null);

    if (!assignForm.employeeId) {
      setAssignFormError('Pilih karyawan penerima tunjangan khusus.');
      return;
    }
    if (!assignForm.componentId) {
      setAssignFormError('Pilih komponen gaji yang akan dialokasikan.');
      return;
    }
    if (!assignForm.effectiveDate || !/^\d{4}-\d{2}-\d{2}$/.test(assignForm.effectiveDate)) {
      setAssignFormError('Tanggal efektif tidak valid (format YYYY-MM-DD).');
      return;
    }

    assignSalaryComponent({
      employeeId: assignForm.employeeId,
      componentId: assignForm.componentId,
      amount: Number(assignForm.amount),
      effectiveDate: assignForm.effectiveDate,
      isActive: true,
    });

    setIsAssignModalOpen(false);
    setAssignForm({
      employeeId: '',
      componentId: '',
      amount: 1000000,
      effectiveDate: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200">
              Modul 07C
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Master Komponen Gaji & Benefit Karyawan
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Definisi master tunjangan, asuransi, potongan, dan penetapan perorangan karyawan yang dibaca mesin Payroll
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'master' ? (
            <button
              onClick={() => setIsCompModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Master Komponen</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tetapkan ke Karyawan</span>
            </button>
          )}
        </div>
      </div>

      {/* Touch-Scrollable Tabs */}
      <div className="w-full overflow-x-auto no-scrollbar border-b border-slate-200 pb-1">
        <div className="inline-flex gap-2 whitespace-nowrap">
          <button
            onClick={() => setActiveTab('master')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'master'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Master Komponen ({salaryComponents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'assignments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Penetapan Komponen per Karyawan ({employeeSalaryAssignments.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Master Komponen */}
      {activeTab === 'master' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Daftar Komponen Gaji & Benefit Aktif Perusahaan
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Mendukung Tunjangan Tetap/Tidak Tetap, Asuransi Swasta, dan Potongan
            </span>
          </div>

          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden p-3 space-y-3 bg-slate-50/50">
            {salaryComponents.map((c) => (
              <div
                key={`mob-comp-${c.id}`}
                className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {c.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    c.category === 'Tunjangan Tetap'
                      ? 'bg-blue-100 text-blue-800'
                      : c.category === 'Tunjangan Tidak Tetap'
                      ? 'bg-indigo-100 text-indigo-800'
                      : c.category === 'Asuransi Swasta'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {c.category}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-900">{c.name}</h4>
                  {c.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{c.description}</p>
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg space-y-1.5 text-xs border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Nilai Default:</span>
                    <span className="font-mono font-bold text-slate-900">
                      Rp {c.defaultValue.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Basis Hitung:</span>
                    <span className="font-medium text-slate-700">{c.calculationBasis}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">PPh 21:</span>
                      {c.isTaxable ? (
                        <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 font-semibold rounded">
                          Kena Pajak
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded">
                          Non-Pajak
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">BPJS Base:</span>
                      {c.isBpjsBase ? (
                        <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 font-semibold rounded">
                          Ya
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded">
                          Tidak
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TAMPILAN DESKTOP: Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Komponen</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Basis Hitung</th>
                  <th className="py-3 px-4 text-right">Nilai Default</th>
                  <th className="py-3 px-4 text-center">Objek Pajak (PPh21)</th>
                  <th className="py-3 px-4 text-center">Basis Hitung BPJS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {salaryComponents.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {c.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      {c.description && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{c.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        c.category === 'Tunjangan Tetap'
                          ? 'bg-blue-100 text-blue-800'
                          : c.category === 'Tunjangan Tidak Tetap'
                          ? 'bg-indigo-100 text-indigo-800'
                          : c.category === 'Asuransi Swasta'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.calculationBasis}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                      Rp {c.defaultValue.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.isTaxable ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold text-[10px] rounded">
                          Ya (Kena PPh)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded">
                          Tidak
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.isBpjsBase ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold text-[10px] rounded">
                          Ya (Basis BPJS)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded">
                          Tidak
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Penetapan per Karyawan */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Penetapan Komponen Khusus per Karyawan (Individual Override)
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {employeeSalaryAssignments.map((asg) => {
              const emp = employees.find((e) => e.id === asg.employeeId);
              const comp = salaryComponents.find((c) => c.id === asg.componentId);

              return (
                <div key={asg.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                      {emp?.fullName?.charAt(0) || 'K'}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {emp?.fullName || 'Karyawan'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {emp?.position} • Komponen: <b>{comp?.name || 'Komponen'}</b> ({comp?.code})
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Berlaku Efektif: {asg.effectiveDate}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-indigo-700">
                      Rp {asg.amount.toLocaleString('id-ID')}
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold">
                      Aktif di Payroll
                    </span>
                  </div>
                </div>
              );
            })}

            {employeeSalaryAssignments.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada penetapan komponen khusus individual. Komponen default master diterapkan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Tambah Master Komponen */}
      {isCompModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="font-bold text-slate-900 text-sm">
                Tambah Master Komponen Gaji
              </div>
              <button
                onClick={() => setIsCompModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComponent} className="p-5 space-y-4">
              {/* Form Validation Error Notice */}
              {compFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{compFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Komponen *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="TUNJ-KOMUNIKASI"
                    value={compForm.code}
                    onChange={(e) => {
                      setCompForm({ ...compForm, code: e.target.value.toUpperCase() });
                      if (compFormError) setCompFormError(null);
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:outline-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Komponen *
                  </label>
                  <select
                    value={compForm.category}
                    onChange={(e) => setCompForm({ ...compForm, category: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-600"
                  >
                    <option value="Tunjangan Tetap">Tunjangan Tetap</option>
                    <option value="Tunjangan Tidak Tetap">Tunjangan Tidak Tetap</option>
                    <option value="Asuransi Pemerintah">Asuransi Pemerintah</option>
                    <option value="Asuransi Swasta">Asuransi Swasta Tambahan</option>
                    <option value="Potongan">Potongan Khusus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Komponen *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tunjangan Internet & Pulsa"
                  value={compForm.name}
                  onChange={(e) => {
                    setCompForm({ ...compForm, name: e.target.value });
                    if (compFormError) setCompFormError(null);
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Basis Hitung
                  </label>
                  <select
                    value={compForm.calculationBasis}
                    onChange={(e) => setCompForm({ ...compForm, calculationBasis: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-600"
                  >
                    <option value="Nominal Tetap">Nominal Tetap (Rp)</option>
                    <option value="Persen Gaji Pokok">% dari Gaji Pokok</option>
                  </select>
                </div>

                <div>
                  {compForm.calculationBasis === 'Nominal Tetap' ? (
                    <CurrencyInput
                      id="compDefaultValue"
                      label="Nilai Standar (Rp) *"
                      value={compForm.defaultValue}
                      onChange={(val) => {
                        setCompForm({ ...compForm, defaultValue: val });
                        if (compFormError) setCompFormError(null);
                      }}
                      showTerbilang={false}
                      required
                      min={0}
                      helperText="Default per bulan"
                    />
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Persentase Gaji Pokok (%) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={compForm.defaultValue}
                        onChange={(e) => setCompForm({ ...compForm, defaultValue: Number(e.target.value) })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-indigo-600"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isTaxable"
                    checked={compForm.isTaxable}
                    onChange={(e) => setCompForm({ ...compForm, isTaxable: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="isTaxable" className="text-xs text-slate-700 cursor-pointer">
                    Merupakan Objek Pajak PPh 21 TER
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isBpjsBase"
                    checked={compForm.isBpjsBase}
                    onChange={(e) => setCompForm({ ...compForm, isBpjsBase: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="isBpjsBase" className="text-xs text-slate-700 cursor-pointer">
                    Masuk sebagai basis perhitungan upah BPJS
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uraian Ketentuan
                </label>
                <textarea
                  rows={2}
                  placeholder="Kriteria pemberian dan kebijakan perusahaan..."
                  value={compForm.description}
                  onChange={(e) => setCompForm({ ...compForm, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCompModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan Komponen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tetapkan Komponen ke Karyawan */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="font-bold text-slate-900 text-sm">
                Penetapan Komponen Khusus ke Karyawan
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-5 space-y-4">
              {/* Form Validation Error Notice */}
              {assignFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{assignFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Karyawan *
                </label>
                <EmployeeSelect
                  employees={employees}
                  selectedEmployeeId={assignForm.employeeId}
                  onSelect={(id) => {
                    setAssignForm({ ...assignForm, employeeId: id });
                    if (assignFormError) setAssignFormError(null);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Komponen Gaji / Benefit *
                </label>
                <select
                  required
                  value={assignForm.componentId}
                  onChange={(e) => {
                    const c = salaryComponents.find((sc) => sc.id === e.target.value);
                    setAssignForm({
                      ...assignForm,
                      componentId: e.target.value,
                      amount: c ? c.defaultValue : assignForm.amount,
                    });
                    if (assignFormError) setAssignFormError(null);
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-600"
                >
                  <option value="">-- Pilih Komponen --</option>
                  {salaryComponents.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name} ({sc.category}) - Default: Rp {sc.defaultValue.toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <CurrencyInput
                  id="assignAmount"
                  label="Nominal Khusus (Rp) *"
                  value={assignForm.amount}
                  onChange={(val) => {
                    setAssignForm({ ...assignForm, amount: val });
                    if (assignFormError) setAssignFormError(null);
                  }}
                  showTerbilang={false}
                  required
                  min={0}
                  helperText="Nilai spesifik karyawan"
                />

                <ValidatedDateInput
                  id="assignEffectiveDate"
                  label="Tanggal Efektif Berlaku *"
                  value={assignForm.effectiveDate}
                  onChange={(val) => {
                    setAssignForm({ ...assignForm, effectiveDate: val });
                    if (assignFormError) setAssignFormError(null);
                  }}
                  required
                  helperText="Mulai terhitung di payroll"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Penetapan ini akan menggantikan nilai default master komponen khusus untuk karyawan yang dipilih dan langsung terhitung pada Payroll Run berikutnya.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan Penetapan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

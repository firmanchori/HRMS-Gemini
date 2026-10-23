import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  Calendar,
  Plus,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { ValidatedDateInput } from '../common/ValidatedDateInput';

export const CompanyCalendarManagement: React.FC = () => {
  const {
    calendarEvents,
    addCalendarEvent,
    employees,
    currentTenant,
    entities,
    currentEntityId,
    setCurrentEntityId,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'calendar' | 'leave_buckets' | 'carryover'>('calendar');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // New Event Form State
  const [eventForm, setEventForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Cuti Bersama Perusahaan' as 'Libur Nasional' | 'Cuti Bersama Perusahaan',
    deductsLeaveBucket: true,
    description: '',
  });

  // Settings State for Carry Over
  const [carryOverRules, setCarryOverRules] = useState({
    maxCarryOverDays: 6,
    expiryMonth: 3, // Maret
    annualLeaveAccrualMonths: 12,
    autoDeductJointHolidays: true,
  });

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidationErrors(true);
    setFormError(null);

    if (!eventForm.title.trim()) {
      setFormError('Nama hari libur / cuti bersama wajib diisi.');
      return;
    }
    if (!eventForm.date || !/^\d{4}-\d{2}-\d{2}$/.test(eventForm.date)) {
      setFormError('Tanggal tidak valid (format wajib YYYY-MM-DD).');
      return;
    }

    addCalendarEvent({
      entityId: currentEntityId,
      title: eventForm.title.trim(),
      date: eventForm.date,
      type: eventForm.type,
      deductsLeaveBucket: eventForm.deductsLeaveBucket,
      description: eventForm.description,
    });

    setIsEventModalOpen(false);
    setShowValidationErrors(false);
    setEventForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      type: 'Cuti Bersama Perusahaan',
      deductsLeaveBucket: true,
      description: '',
    });
  };

  const jointHolidaysCount = calendarEvents.filter((c) => c.deductsLeaveBucket).length;
  const publicHolidaysCount = calendarEvents.filter((c) => c.type === 'Libur Nasional').length;

  const [calendarNotice, setCalendarNotice] = useState<string | null>(null);
  const [balanceSearch, setBalanceSearch] = useState('');

  const filteredEmployeesForBalance = employees.filter((e) =>
    e.fullName.toLowerCase().includes(balanceSearch.toLowerCase()) ||
    e.nik.toLowerCase().includes(balanceSearch.toLowerCase()) ||
    e.department.toLowerCase().includes(balanceSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200">
              Modul 04B
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Kalender Perusahaan & Manajemen Saldo Cuti
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sumber kebenaran hari libur nasional, jadwal cuti bersama perusahaan, dan pemisahan 2 bucket saldo cuti
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEventModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tanggal Kalender</span>
          </button>
        </div>
      </div>

      {calendarNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{calendarNotice}</span>
          </div>
          <button onClick={() => setCalendarNotice(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* Touch-Scrollable Tabs */}
      <div className="w-full overflow-x-auto no-scrollbar border-b border-slate-200 pb-1">
        <div className="inline-flex gap-2 whitespace-nowrap">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'calendar'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Jadwal Kalender Tahunan</span>
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px]">
              {calendarEvents.length} Event
            </span>
          </button>

          <button
            onClick={() => setActiveTab('leave_buckets')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'leave_buckets'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Konsep 2 Bucket Saldo Cuti</span>
          </button>

          <button
            onClick={() => setActiveTab('carryover')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'carryover'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Aturan Carry-Over & Batas Hangus</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Calendar Events */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Total Libur Nasional 2026</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{publicHolidaysCount} Hari</div>
              <div className="text-[11px] text-slate-400 mt-1">Tidak memotong jatah saldo cuti karyawan</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Jadwal Cuti Bersama Perusahaan</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{jointHolidaysCount} Hari</div>
              <div className="text-[11px] text-blue-600 font-medium mt-1">Otomatis memotong Bucket 1 (Cuti Bersama)</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Sinkronisasi Payroll</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">Aktif Otomatis</div>
              <div className="text-[11px] text-slate-400 mt-1">Hari libur & cuti bersama tidak dihitung alpa</div>
            </div>
          </div>

          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden space-y-3">
            {calendarEvents.map((evt) => (
              <div
                key={`mob-cal-${evt.id}`}
                className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    evt.deductsLeaveBucket
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {evt.type}
                  </span>
                  {evt.deductsLeaveBucket ? (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-semibold">
                      Potong Bucket 1
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-semibold">
                      Libur Resmi
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold text-xs shrink-0 ${
                    evt.deductsLeaveBucket
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}>
                    <span className="text-sm leading-none">{new Date(evt.date).getDate()}</span>
                    <span className="text-[9px] uppercase font-semibold">
                      {new Date(evt.date).toLocaleString('id-ID', { month: 'short' })}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{evt.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tanggal: <b>{evt.date}</b> {evt.description ? `• ${evt.description}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TAMPILAN DESKTOP: List View (>= md) */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Daftar Tanggal Libur & Cuti Bersama Resmi
              </span>
            </div>

            <div className="divide-y divide-slate-200">
              {calendarEvents.map((evt) => (
                <div key={evt.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold text-xs shrink-0 ${
                      evt.deductsLeaveBucket
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-rose-100 text-rose-700 border border-rose-200'
                    }`}>
                      <span>{new Date(evt.date).getDate()}</span>
                      <span className="text-[9px] uppercase font-semibold">
                        {new Date(evt.date).toLocaleString('id-ID', { month: 'short' })}
                      </span>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                        <span>{evt.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          evt.deductsLeaveBucket
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {evt.type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Tanggal: <b>{evt.date}</b> {evt.description ? `• ${evt.description}` : ''}
                      </div>
                    </div>
                  </div>

                  <div>
                    {evt.deductsLeaveBucket ? (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-medium">
                        Potong Bucket 1
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-medium">
                        Libur Nasional Resmi
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 2 Bucket Saldo Cuti */}
      {activeTab === 'leave_buckets' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Prinsip 2 Bucket Saldo Cuti (Sesuai Regulasi Ketenagakerjaan & PRD)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Di NusaHR, saldo cuti tidak disatukan dalam satu angka flat yang rawan ambigu. Sistem membagi hak cuti menjadi dua penampung (bucket) yang berjalan secara independen:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/50 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <div className="font-bold text-blue-900 text-sm">
                    Bucket 1: Jatah Cuti Bersama
                  </div>
                </div>
                <ul className="text-xs text-blue-800 space-y-1.5 list-disc list-inside">
                  <li>Dimiliki secara otomatis oleh <b>seluruh karyawan sejak hari pertama bekerja</b> (termasuk probation/baru).</li>
                  <li>Otomatis dipotong setiap kali tanggal cuti bersama perusahaan tiba tanpa perlu karyawan mengajukan secara manual.</li>
                  <li>Jika karyawan baru bergabung di tengah tahun, jatah cuti bersama diberikan proporsional dengan sisa cuti bersama di tahun berjalan.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <div className="font-bold text-indigo-900 text-sm">
                    Bucket 2: Jatah Cuti Tahunan Reguler
                  </div>
                </div>
                <ul className="text-xs text-indigo-800 space-y-1.5 list-disc list-inside">
                  <li>Hanya aktif dan terbit setelah karyawan <b>genap 1 tahun masa kerja (12 bulan)</b>.</li>
                  <li>Besaran standar: 12 hari per tahun untuk kebutuhan pribadi karyawan.</li>
                  <li>Jika saldo Bucket 2 tidak mencukupi saat mengajukan cuti tahunan, pengajuan akan auto-reject kecuali memilih skema Unpaid Leave (cuti tanpa bayar).</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Live Leave Balance Breakdown per Employee */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">
                  Monitoring Saldo Cuti 2-Bucket per Karyawan
                </h4>
                <p className="text-[11px] text-slate-500">
                  Transparansi kuota Bucket 1 (Cuti Bersama) & Bucket 2 (Cuti Tahunan Pribadi)
                </p>
              </div>
              <input
                type="text"
                placeholder="Cari nama / NIK karyawan..."
                value={balanceSearch}
                onChange={(e) => setBalanceSearch(e.target.value)}
                className="w-full sm:w-64 text-xs px-3 py-1.5 border border-slate-300 rounded-md outline-none focus:border-indigo-500"
              />
            </div>

            {/* Mobile & Tablet Adaptive Cards (< md) */}
            <div className="md:hidden p-3 space-y-3 bg-slate-50/50">
              {filteredEmployeesForBalance.map((emp) => {
                const b1 = jointHolidaysCount;
                const b2 = emp.leaveBalance;
                return (
                  <div key={`bal-mob-${emp.id}`} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-900">{emp.fullName}</div>
                      <span className="text-[10px] font-mono text-slate-500">NIK: {emp.nik}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{emp.position} · {emp.department}</div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center font-mono">
                      <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <span className="text-[9px] text-blue-700 block font-sans font-semibold">Bucket 1 (Cuti Bersama)</span>
                        <span className="text-sm font-bold text-blue-900">{b1} Hari</span>
                      </div>
                      <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                        <span className="text-[9px] text-indigo-700 block font-sans font-semibold">Bucket 2 (Tahunan)</span>
                        <span className="text-sm font-bold text-indigo-900">{b2} Hari</span>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                        <span className="text-[9px] text-emerald-700 block font-sans font-semibold">Total Tersedia</span>
                        <span className="text-sm font-bold text-emerald-900">{b1 + b2} Hari</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Karyawan</th>
                    <th className="py-2.5 px-4">Jabatan & Departemen</th>
                    <th className="py-2.5 px-4 text-center">Bucket 1 (Cuti Bersama)</th>
                    <th className="py-2.5 px-4 text-center">Bucket 2 (Cuti Pribadi)</th>
                    <th className="py-2.5 px-4 text-center">Total Hak Cuti Aktif</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployeesForBalance.map((emp) => {
                    const b1 = jointHolidaysCount;
                    const b2 = emp.leaveBalance;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {emp.fullName}
                          <span className="text-[10px] text-slate-400 font-mono block">({emp.nik})</span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          {emp.position} · {emp.department}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-blue-700">
                          {b1} Hari
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-indigo-700">
                          {b2} Hari
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-700">
                          {b1 + b2} Hari
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Aktif
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Carry Over Rules */}
      {activeTab === 'carryover' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 max-w-2xl">
          <div className="font-bold text-slate-900 text-sm">
            Konfigurasi Akhir Tahun: Carry-Over Saldo & Batas Waktu Hangus
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maksimal Hari Saldo Cuti yang Boleh Dibawa ke Tahun Berikutnya
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={carryOverRules.maxCarryOverDays}
                  onChange={(e) => setCarryOverRules({ ...carryOverRules, maxCarryOverDays: Number(e.target.value) })}
                  className="w-28 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                />
                <span className="text-xs text-slate-500">Hari (Kelebihan saldo akan hangus per 31 Desember)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batas Akhir Pemakaian Saldo Carry-Over
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={carryOverRules.expiryMonth}
                  onChange={(e) => setCarryOverRules({ ...carryOverRules, expiryMonth: Number(e.target.value) })}
                  className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                >
                  <option value={3}>31 Maret Tahun Berikutnya (3 Bulan)</option>
                  <option value={6}>30 Juni Tahun Berikutnya (6 Bulan)</option>
                  <option value={12}>Sepanjang Tahun Berikutnya</option>
                </select>
                <span className="text-xs text-slate-500">Sisa saldo hangus otomatis bila lewat batas</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pengaturan ini berlaku otomatis untuk seluruh entitas di bawah tenant <b>{currentTenant.name}</b>.</span>
            </div>

            <button
              onClick={() => {
                setCalendarNotice('Aturan carry-over dan batas hangus saldo cuti berhasil diperbarui!');
                setTimeout(() => setCalendarNotice(null), 4000);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Simpan Aturan Saldo Cuti
            </button>
          </div>
        </div>
      )}

      {/* Modal: Tambah Tanggal Libur/Cuti Bersama */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="font-bold text-slate-900 text-sm">
                Tambah Tanggal Libur / Cuti Bersama
              </div>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-5 space-y-4">
              {/* Form Validation Error Notice */}
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Hari Libur / Cuti Bersama *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cuti Bersama Hari Raya Waisak"
                  value={eventForm.title}
                  onChange={(e) => {
                    setEventForm({ ...eventForm, title: e.target.value });
                    if (formError) setFormError(null);
                  }}
                  className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-blue-600 ${
                    showValidationErrors && !eventForm.title.trim()
                      ? 'border-rose-500 bg-rose-50/20'
                      : 'border-slate-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ValidatedDateInput
                  id="calendarEventDate"
                  label="Tanggal *"
                  value={eventForm.date}
                  onChange={(val) => {
                    setEventForm({ ...eventForm, date: val });
                    if (formError) setFormError(null);
                  }}
                  required
                  showError={showValidationErrors}
                  helperText="Format YYYY-MM-DD"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Hari Libur
                  </label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => {
                      const t = e.target.value as any;
                      setEventForm({
                        ...eventForm,
                        type: t,
                        deductsLeaveBucket: t === 'Cuti Bersama Perusahaan',
                      });
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                  >
                    <option value="Cuti Bersama Perusahaan">Cuti Bersama Perusahaan</option>
                    <option value="Libur Nasional">Libur Nasional Resmi</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="deductBucket"
                  checked={eventForm.deductsLeaveBucket}
                  onChange={(e) => setEventForm({ ...eventForm, deductsLeaveBucket: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="deductBucket" className="text-xs text-slate-700 cursor-pointer font-medium">
                  Potong otomatis dari Bucket 1 (Jatah Cuti Bersama)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan SKB 3 Menteri atau memo internal direksi..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan ke Kalender
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CalendarDays,
  Grid3X3,
  ListOrdered,
  Sparkles,
  Info,
} from 'lucide-react';
import { ValidatedDateInput } from '../common/ValidatedDateInput';
import { ScrollableTabNav } from '../common/ScrollableTabNav';

export const CompanyCalendarManagement: React.FC = () => {
  const {
    calendarEvents,
    addCalendarEvent,
    employees,
    currentTenant,
    entities,
    currentEntityId,
    setCurrentEntityId,
    leaveRequests,
    submitLeaveRequest,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'calendar_view' | 'event_list' | 'leave_buckets' | 'carryover'>('calendar_view');
  const [calendarMode, setCalendarMode] = useState<'month' | 'year'>('month');
  
  // Current calendar viewing date
  const today = new Date();
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth()); // 0-11

  // Day Click Modal State
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [dayModalTab, setDayModalTab] = useState<'event' | 'leave'>('event');

  // Quick Add Event Form State
  const [eventForm, setEventForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Cuti Bersama' as 'Cuti Bersama' | 'Libur Nasional' | 'Event' | 'Libur Perusahaan',
    deductsLeaveBucket: true,
    description: '',
  });

  // Day Modal Leave Form State
  const [dayLeaveForm, setDayLeaveForm] = useState({
    employeeId: employees[0]?.id || '',
    leaveType: 'Cuti Tahunan' as
      | 'Cuti Tahunan'
      | 'Sakit Tanpa Surat Dokter'
      | 'Sakit dengan Surat Dokter'
      | 'Cuti Menikah'
      | 'Cuti Melahirkan'
      | 'Izin Urusan Pribadi',
    totalDays: 1,
    reason: '',
  });

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [calendarNotice, setCalendarNotice] = useState<string | null>(null);
  const [balanceSearch, setBalanceSearch] = useState('');

  // Close any active modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEventModalOpen) setIsEventModalOpen(false);
        else if (isDayModalOpen) setIsDayModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEventModalOpen, isDayModalOpen]);

  // Settings State for Carry Over
  const [carryOverRules, setCarryOverRules] = useState({
    maxCarryOverDays: 6,
    expiryMonth: 3, // Maret
    annualLeaveAccrualMonths: 12,
    autoDeductJointHolidays: true,
  });

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // Open day modal upon clicking a calendar date cell
  const handleDayCellClick = (dateStr: string) => {
    setSelectedDayDate(dateStr);
    setEventForm((prev) => ({ ...prev, date: dateStr }));
    if (!dayLeaveForm.employeeId && employees.length > 0) {
      setDayLeaveForm((prev) => ({ ...prev, employeeId: employees[0].id }));
    }
    setFormError(null);
    setIsDayModalOpen(true);
  };

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
    setIsDayModalOpen(false);
    setShowValidationErrors(false);
    setCalendarNotice(`Berhasil menambahkan "${eventForm.title}" pada ${eventForm.date}`);
    setEventForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      type: 'Cuti Bersama',
      deductsLeaveBucket: true,
      description: '',
    });
  };

  const handleAddEmployeeLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayDate) return;
    if (!dayLeaveForm.employeeId) {
      setFormError('Pilih karyawan terlebih dahulu.');
      return;
    }
    if (!dayLeaveForm.reason.trim()) {
      setFormError('Alasan cuti wajib diisi.');
      return;
    }

    const emp = employees.find((x) => x.id === dayLeaveForm.employeeId);

    // Calculate end date
    const startD = new Date(selectedDayDate);
    const endD = new Date(startD);
    endD.setDate(startD.getDate() + (Number(dayLeaveForm.totalDays) - 1));
    const endDateStr = endD.toISOString().split('T')[0];

    submitLeaveRequest({
      employeeId: dayLeaveForm.employeeId,
      leaveType: dayLeaveForm.leaveType,
      startDate: selectedDayDate,
      endDate: endDateStr,
      totalDays: Number(dayLeaveForm.totalDays),
      reason: dayLeaveForm.reason.trim(),
    });

    setIsDayModalOpen(false);
    setCalendarNotice(`Pengajuan cuti untuk ${emp?.fullName || 'karyawan'} tanggal ${selectedDayDate} berhasil disimpan.`);
    setDayLeaveForm({
      employeeId: employees[0]?.id || '',
      leaveType: 'Cuti Tahunan',
      totalDays: 1,
      reason: '',
    });
  };

  // Helper to format date string YYYY-MM-DD
  const formatYmd = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Get events and leaves on a specific date
  const getDayAgenda = (dateStr: string) => {
    const holidays = calendarEvents.filter((c) => c.date === dateStr);
    const leaves = leaveRequests.filter((l) => {
      return dateStr >= l.startDate && dateStr <= l.endDate;
    });
    return { holidays, leaves };
  };

  const jointHolidaysCount = calendarEvents.filter((c) => c.deductsLeaveBucket).length;
  const publicHolidaysCount = calendarEvents.filter((c) => c.type === 'Libur Nasional').length;

  const filteredEmployeesForBalance = (employees || []).filter((e) =>
    (e?.fullName || '').toLowerCase().includes((balanceSearch || '').toLowerCase()) ||
    (e?.nik || '').toLowerCase().includes((balanceSearch || '').toLowerCase()) ||
    (e?.department || '').toLowerCase().includes((balanceSearch || '').toLowerCase())
  );

  // Month Grid Calculation
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sun
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthTotalDays = new Date(viewYear, viewMonth, 0).getDate();

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
            Sumber kebenaran hari libur nasional, jadwal cuti bersama perusahaan, kalender interaktif bulanan/tahunan, dan pemisahan 2 bucket saldo cuti
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEventForm((prev) => ({
                ...prev,
                date: new Date().toISOString().split('T')[0],
              }));
              setIsEventModalOpen(true);
            }}
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

      {/* Row 2: Standard Enterprise Scrollable Tab Navigation (With Icons) */}
      <ScrollableTabNav>
        <button
          onClick={() => setActiveTab('calendar_view')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'calendar_view'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Kalender Interaktif (Bulanan & Tahunan)</span>
        </button>

        <button
          onClick={() => setActiveTab('event_list')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'event_list'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Daftar Event & Hari Libur</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'event_list'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {calendarEvents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('leave_buckets')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'leave_buckets'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Konsep 2 Bucket Saldo Cuti</span>
        </button>

        <button
          onClick={() => setActiveTab('carryover')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'carryover'
              ? 'border-amber-600 text-amber-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Aturan Carry-Over & Batas Hangus</span>
        </button>
      </ScrollableTabNav>

      {/* TAB 1: KALENDER INTERAKTIF (BULANAN & TAHUNAN DENGAN KLIK CELL) */}
      {activeTab === 'calendar_view' && (
        <div className="space-y-4">
          {/* Calendar Control Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setCalendarMode('month')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  calendarMode === 'month'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Tampilan Bulanan</span>
              </button>
              <button
                onClick={() => setCalendarMode('year')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  calendarMode === 'year'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>Tampilan Tahunan (12 Bulan)</span>
              </button>
            </div>

            {/* Month & Year Navigation */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center min-w-[170px]">
                <span className="text-sm font-bold text-slate-900">
                  {monthNames[viewMonth]} {viewYear}
                </span>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleJumpToToday}
                className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors ml-1"
              >
                Hari Ini
              </button>
            </div>

            {/* Quick Year Selector */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-slate-500 font-medium">Tahun:</span>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
              >
                {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Helper Banner */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <b>Kalender Interaktif:</b> Klik langsung pada tanggal mana pun di kalender untuk menambahkan <b>Hari Libur Nasional</b>, <b>Cuti Bersama</b>, atau <b>Input Data Cuti Karyawan</b>.
              </span>
            </div>
            {/* Color Legend */}
            <div className="hidden lg:flex items-center gap-3 shrink-0 text-[11px] font-medium">
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Libur Nasional
              </span>
              <span className="flex items-center gap-1 text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Cuti Bersama
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Cuti Karyawan
              </span>
            </div>
          </div>

          {/* MONTHLY GRID VIEW */}
          {calendarMode === 'month' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Day Name Headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-700">
                {dayNames.map((day, idx) => (
                  <div
                    key={day}
                    className={`py-2.5 border-r border-slate-100 last:border-r-0 ${
                      idx === 0 ? 'text-rose-600 bg-rose-50/50' : ''
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 auto-rows-[minmax(96px,_auto)] divide-x divide-y divide-slate-100">
                {/* Previous month filler cells */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => {
                  const dayNum = prevMonthTotalDays - firstDayOfMonth + i + 1;
                  return (
                    <div
                      key={`prev-${i}`}
                      className="p-2 bg-slate-50/60 text-slate-300 text-xs min-h-[96px] cursor-not-allowed select-none"
                    >
                      <span className="font-semibold">{dayNum}</span>
                    </div>
                  );
                })}

                {/* Current month days */}
                {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = formatYmd(viewYear, viewMonth, dayNum);
                  const isSun = (firstDayOfMonth + i) % 7 === 0;
                  const isCurrentDay =
                    today.getFullYear() === viewYear &&
                    today.getMonth() === viewMonth &&
                    today.getDate() === dayNum;

                  const { holidays, leaves } = getDayAgenda(dateStr);
                  const hasEvents = holidays.length > 0 || leaves.length > 0;

                  return (
                    <div
                      key={`day-${dayNum}`}
                      onClick={() => handleDayCellClick(dateStr)}
                      className={`group relative p-2 min-h-[96px] transition-colors cursor-pointer flex flex-col justify-between ${
                        isCurrentDay
                          ? 'bg-blue-50/40 ring-1 ring-blue-400 inset-0'
                          : isSun
                          ? 'bg-rose-50/20 hover:bg-rose-50/60'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Day Number Header */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isCurrentDay
                              ? 'bg-blue-600 text-white shadow-xs'
                              : isSun
                              ? 'text-rose-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {dayNum}
                        </span>

                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-blue-600 font-semibold flex items-center gap-0.5 bg-blue-100 px-1.5 py-0.5 rounded">
                          <Plus className="w-2.5 h-2.5" />
                          <span>Input</span>
                        </span>
                      </div>

                      {/* Event and Leave Badges */}
                      <div className="space-y-1 flex-1 overflow-hidden">
                        {holidays.map((h) => (
                          <div
                            key={h.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate border ${
                              h.type === 'Libur Nasional'
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                            title={`${h.title} (${h.type})`}
                          >
                            {h.title}
                          </div>
                        ))}

                        {leaves.slice(0, 2).map((l) => {
                          const emp = employees.find((e) => e.id === l.employeeId);
                          return (
                            <div
                              key={l.id}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"
                              title={`Cuti: ${emp?.fullName || l.employeeId} - ${l.leaveType}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                              <span className="truncate">{emp?.fullName || 'Karyawan'}: {l.leaveType}</span>
                            </div>
                          );
                        })}

                        {leaves.length > 2 && (
                          <div className="text-[10px] font-bold text-slate-500 pl-1">
                            +{leaves.length - 2} cuti lainnya
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* YEARLY VIEW (12 MONTHS GRID) */}
          {calendarMode === 'year' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {monthNames.map((mName, mIdx) => {
                const mFirstDay = new Date(viewYear, mIdx, 1).getDay();
                const mTotalDays = new Date(viewYear, mIdx + 1, 0).getDate();

                return (
                  <div
                    key={mName}
                    className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs hover:border-blue-300 transition-all flex flex-col"
                  >
                    {/* Month Header Card */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <span className="font-bold text-xs text-slate-900">{mName}</span>
                      <button
                        onClick={() => {
                          setViewMonth(mIdx);
                          setCalendarMode('month');
                        }}
                        className="text-[10px] font-semibold text-blue-600 hover:underline"
                      >
                        Buka Detail →
                      </button>
                    </div>

                    {/* Mini Day Names */}
                    <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400 mb-1">
                      {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
                        <div key={i} className={i === 0 ? 'text-rose-500' : ''}>
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Mini Day Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
                      {Array.from({ length: mFirstDay }).map((_, f) => (
                        <div key={`m-fill-${f}`} className="p-0.5"></div>
                      ))}

                      {Array.from({ length: mTotalDays }).map((_, d) => {
                        const dayNum = d + 1;
                        const dateStr = formatYmd(viewYear, mIdx, dayNum);
                        const { holidays, leaves } = getDayAgenda(dateStr);
                        const hasHolidays = holidays.length > 0;
                        const hasLeaves = leaves.length > 0;
                        const isSunday = (mFirstDay + d) % 7 === 0;

                        return (
                          <div
                            key={`m-day-${dayNum}`}
                            onClick={() => handleDayCellClick(dateStr)}
                            className={`p-1 rounded cursor-pointer transition-colors relative font-semibold ${
                              hasHolidays
                                ? holidays[0].type === 'Libur Nasional'
                                  ? 'bg-rose-500 text-white font-bold'
                                  : 'bg-blue-500 text-white font-bold'
                                : hasLeaves
                                ? 'bg-emerald-100 text-emerald-800'
                                : isSunday
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                            title={`${dateStr}: ${holidays.map((h) => h.title).join(', ')}`}
                          >
                            <span>{dayNum}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DAFTAR EVENT & HARI LIBUR RESMI */}
      {activeTab === 'event_list' && (
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
                const b2 = emp.remainingLeaveDays || 0;
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
                    const b2 = emp.remainingLeaveDays || 0;
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
        <div
          onClick={() => setIsEventModalOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden cursor-default"
          >
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
                    Kategori
                  </label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => {
                      const t = e.target.value as any;
                      setEventForm({
                        ...eventForm,
                        type: t,
                        deductsLeaveBucket: t === 'Cuti Bersama',
                      });
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                  >
                    <option value="Cuti Bersama">Cuti Bersama</option>
                    <option value="Libur Nasional">Libur Nasional</option>
                    <option value="Event">Event</option>
                    <option value="Libur Perusahaan">Libur Perusahaan</option>
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

      {/* DAY CLICK MODAL (Input Event / Cuti via Klik Kalender) */}
      {isDayModalOpen && selectedDayDate && (
        <div
          onClick={() => setIsDayModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fadeIn cursor-default"
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Agenda & Input Data Tanggal: {selectedDayDate}</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  {new Date(selectedDayDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsDayModalOpen(false);
                  setFormError(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Existing agenda on this day */}
            {(() => {
              const { holidays, leaves } = getDayAgenda(selectedDayDate);
              if (holidays.length > 0 || leaves.length > 0) {
                return (
                  <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-2">
                    <span className="font-bold text-slate-700 block">Jadwal pada tanggal ini:</span>
                    <div className="space-y-1">
                      {holidays.map((h) => (
                        <div
                          key={h.id}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                            h.type === 'Libur Nasional'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          <div>
                            <span className="font-bold">{h.title}</span>
                            <span className="ml-2 text-[10px] uppercase font-semibold">({h.type})</span>
                          </div>
                          {h.deductsLeaveBucket && (
                            <span className="text-[10px] font-medium bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                              Potong Bucket 1
                            </span>
                          )}
                        </div>
                      ))}

                      {leaves.map((l) => {
                        const emp = employees.find((e) => e.id === l.employeeId);
                        return (
                          <div
                            key={l.id}
                            className="p-2 rounded-lg border bg-emerald-50 text-emerald-800 border-emerald-200 text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold">{emp?.fullName || l.employeeId}</span>
                              <span className="text-slate-500 font-normal"> · {l.leaveType}</span>
                              <div className="text-[10px] text-emerald-700 italic mt-0.5">"{l.reason}"</div>
                            </div>
                            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                              {l.totalDays} Hari ({l.status})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return (
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Belum ada jadwal hari libur atau cuti tercatat pada tanggal ini.</span>
                </div>
              );
            })()}

            {/* Sub-tab selection inside modal */}
            <div className="flex border-b border-slate-200 bg-white px-5 pt-3">
              <button
                type="button"
                onClick={() => setDayModalTab('event')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  dayModalTab === 'event'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Hari Libur / Cuti Bersama</span>
              </button>
              <button
                type="button"
                onClick={() => setDayModalTab('leave')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  dayModalTab === 'leave'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>+ Input Data Cuti Karyawan</span>
              </button>
            </div>

            {formError && (
              <div className="m-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            {/* Action 1: Add Holiday / Cuti Bersama */}
            {dayModalTab === 'event' && (
              <form onSubmit={handleAddEvent} className="p-5 space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Hari Libur / Cuti Bersama *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Libur Pilkada Serentak / Event Perusahaan"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={selectedDayDate}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kategori
                    </label>
                    <select
                      value={eventForm.type}
                      onChange={(e) => {
                        const t = e.target.value as any;
                        setEventForm({
                          ...eventForm,
                          type: t,
                          deductsLeaveBucket: t === 'Cuti Bersama',
                        });
                      }}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                    >
                      <option value="Cuti Bersama">Cuti Bersama</option>
                      <option value="Libur Nasional">Libur Nasional</option>
                      <option value="Event">Event</option>
                      <option value="Libur Perusahaan">Libur Perusahaan</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="dayDeductBucket"
                    checked={eventForm.deductsLeaveBucket}
                    onChange={(e) => setEventForm({ ...eventForm, deductsLeaveBucket: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="dayDeductBucket" className="text-xs text-slate-700 cursor-pointer font-medium">
                    Otomatis potong Bucket 1 (Jatah Cuti Bersama Seluruh Karyawan)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    placeholder="Keterangan tambahan..."
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-blue-600"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsDayModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Simpan Hari Libur
                  </button>
                </div>
              </form>
            )}

            {/* Action 2: Input Employee Leave */}
            {dayModalTab === 'leave' && (
              <form onSubmit={handleAddEmployeeLeave} className="p-5 space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Karyawan *
                  </label>
                  <select
                    value={dayLeaveForm.employeeId}
                    onChange={(e) => setDayLeaveForm({ ...dayLeaveForm, employeeId: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600 font-medium"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.nik} - {emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jenis Cuti / Izin Sakit *
                    </label>
                    <select
                      value={dayLeaveForm.leaveType}
                      onChange={(e) => setDayLeaveForm({ ...dayLeaveForm, leaveType: e.target.value as any })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    >
                      <option value="Cuti Tahunan">Cuti Tahunan (Bucket 2)</option>
                      <option value="Sakit Tanpa Surat Dokter">Sakit Tanpa Surat Dokter</option>
                      <option value="Sakit dengan Surat Dokter">Sakit dengan Surat Dokter</option>
                      <option value="Cuti Menikah">Cuti Menikah</option>
                      <option value="Cuti Melahirkan">Cuti Melahirkan</option>
                      <option value="Izin Urusan Pribadi">Izin Urusan Pribadi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Durasi (Hari) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={dayLeaveForm.totalDays}
                      onChange={(e) => setDayLeaveForm({ ...dayLeaveForm, totalDays: Number(e.target.value) })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alasan / Keperluan Cuti *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Contoh: Acara keluarga di luar kota / Istirahat sakit flu..."
                    value={dayLeaveForm.reason}
                    onChange={(e) => setDayLeaveForm({ ...dayLeaveForm, reason: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsDayModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Simpan Permohonan Cuti
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

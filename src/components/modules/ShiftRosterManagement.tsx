import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eraser,
  Moon,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useHrms } from '../../context/HrmsContext';
import { ROSTER_OFF_ID, WorkShift } from '../../types/hrms';

// ---------- util tanggal (lokal, tanpa pergeseran UTC) ----------
const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDateStr = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};
const startOfWeek = (d: Date) => {
  const c = new Date(d);
  const dow = (c.getDay() + 6) % 7; // Senin = 0
  c.setDate(c.getDate() - dow);
  return c;
};
const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const toMin = (hhmm: string) => {
  const [h, m] = (hhmm || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// ---------- warna shift (kelas statis agar aman untuk Tailwind) ----------
const SHIFT_COLORS: Record<string, { cell: string; chip: string; dot: string }> = {
  indigo: { cell: 'bg-indigo-100 text-indigo-800 border-indigo-300', chip: 'bg-indigo-600 text-white', dot: 'bg-indigo-500' },
  emerald: { cell: 'bg-emerald-100 text-emerald-800 border-emerald-300', chip: 'bg-emerald-600 text-white', dot: 'bg-emerald-500' },
  amber: { cell: 'bg-amber-100 text-amber-800 border-amber-300', chip: 'bg-amber-500 text-white', dot: 'bg-amber-500' },
  rose: { cell: 'bg-rose-100 text-rose-800 border-rose-300', chip: 'bg-rose-600 text-white', dot: 'bg-rose-500' },
  sky: { cell: 'bg-sky-100 text-sky-800 border-sky-300', chip: 'bg-sky-600 text-white', dot: 'bg-sky-500' },
  violet: { cell: 'bg-violet-100 text-violet-800 border-violet-300', chip: 'bg-violet-600 text-white', dot: 'bg-violet-500' },
  teal: { cell: 'bg-teal-100 text-teal-800 border-teal-300', chip: 'bg-teal-600 text-white', dot: 'bg-teal-500' },
  orange: { cell: 'bg-orange-100 text-orange-800 border-orange-300', chip: 'bg-orange-500 text-white', dot: 'bg-orange-500' },
  slate: { cell: 'bg-slate-200 text-slate-800 border-slate-400', chip: 'bg-slate-700 text-white', dot: 'bg-slate-600' },
  fuchsia: { cell: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300', chip: 'bg-fuchsia-600 text-white', dot: 'bg-fuchsia-500' },
};
const colorOf = (c?: string) => SHIFT_COLORS[c || ''] || SHIFT_COLORS.slate;

type Brush = string | 'ERASE'; // id shift, 'OFF', atau 'ERASE'

interface ShiftFormState {
  id?: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  lateToleranceMins: number;
  breakMins: number;
  color: string;
  isActive: boolean;
}

const EMPTY_FORM: ShiftFormState = {
  name: '',
  code: '',
  startTime: '08:00',
  endTime: '17:00',
  lateToleranceMins: 15,
  breakMins: 60,
  color: 'indigo',
  isActive: true,
};

const shiftDurationMins = (s: Pick<WorkShift, 'startTime' | 'endTime'>) => {
  const a = toMin(s.startTime);
  const b = toMin(s.endTime);
  return b > a ? b - a : b + 1440 - a;
};
const isOvernight = (s: Pick<WorkShift, 'startTime' | 'endTime'>) => toMin(s.endTime) <= toMin(s.startTime);

// Huruf roster: P = Pagi, S = Siang, M = Malam, L = Libur
const letterOfShift = (s?: WorkShift): 'P' | 'S' | 'M' => {
  if (!s) return 'P';
  const key = `${s.name} ${s.code}`.toUpperCase();
  if (key.includes('PAGI')) return 'P';
  if (key.includes('SIANG') || key.includes('SORE')) return 'S';
  if (key.includes('MALAM')) return 'M';
  if (s.isNightShift) return 'M';
  const h = Math.floor(toMin(s.startTime) / 60);
  if (h >= 4 && h < 11) return 'P';
  if (h >= 11 && h < 18) return 'S';
  return 'M';
};
const LETTER_STYLE: Record<string, string> = {
  P: 'bg-amber-100 text-amber-800 border-amber-300',
  S: 'bg-sky-100 text-sky-800 border-sky-300',
  M: 'bg-violet-100 text-violet-800 border-violet-300',
  L: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const ShiftRosterManagement: React.FC = () => {
  const { employees, shifts, schedules, addShift, updateShift, deleteShift, upsertSchedules, clearSchedules, currentTenant, updateEmployee } = useHrms();

  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [deptFilter, setDeptFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [brush, setBrush] = useState<Brush>('');
  const [notice, setNotice] = useState<string | null>(null);
  const [shiftForm, setShiftForm] = useState<ShiftFormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [staffOpen, setStaffOpen] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const paintingRef = useRef(false);

  const activeShifts = useMemo(() => shifts.filter((s) => s.isActive !== false), [shifts]);
  const shiftById = useMemo(() => new Map(shifts.map((s) => [s.id, s])), [shifts]);

  // Brush default = shift aktif pertama
  useEffect(() => {
    if (!brush && activeShifts[0]) setBrush(activeShifts[0].id);
    if (brush && brush !== ROSTER_OFF_ID && brush !== 'ERASE' && !shiftById.has(brush)) {
      setBrush(activeShifts[0]?.id || ROSTER_OFF_ID);
    }
  }, [brush, activeShifts, shiftById]);

  useEffect(() => {
    const up = () => {
      paintingRef.current = false;
    };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  // ---------- periode ----------
  const days = useMemo(() => {
    if (mode === 'week') {
      const s = startOfWeek(anchor);
      return Array.from({ length: 7 }, (_, i) => addDays(s, i));
    }
    const y = anchor.getFullYear();
    const m = anchor.getMonth();
    const count = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => new Date(y, m, i + 1));
  }, [mode, anchor]);
  const dateFrom = toDateStr(days[0]);
  const dateTo = toDateStr(days[days.length - 1]);
  const todayStr = toDateStr(new Date());

  const periodLabel =
    mode === 'week'
      ? `${days[0].getDate()} ${MONTH_NAMES[days[0].getMonth()].slice(0, 3)} – ${days[6].getDate()} ${MONTH_NAMES[days[6].getMonth()].slice(0, 3)} ${days[6].getFullYear()}`
      : `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;

  const shiftPeriod = (dir: -1 | 1) => {
    if (mode === 'week') setAnchor(addDays(anchor, dir * 7));
    else setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1));
  };

  // ---------- data roster ----------
  const scheduleMap = useMemo(() => {
    const m = new Map<string, string>();
    schedules.forEach((s) => m.set(`${s.employeeId}|${s.date}`, s.shiftId));
    return m;
  }, [schedules]);

  const departments = useMemo(() => ['Semua', ...Array.from(new Set(employees.map((e) => e.department).filter(Boolean)))], [employees]);

  const activeEmployees = useMemo(() => employees.filter((e) => !(e as any).status || (e as any).status === 'Aktif'), [employees]);
  const shiftWorkerCount = useMemo(() => activeEmployees.filter((e) => (e as any).isShiftWorker).length, [activeEmployees]);

  // Roster hanya berlaku untuk karyawan shift
  const visibleEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if ((e as any).status && (e as any).status !== 'Aktif') return false;
      if (!(e as any).isShiftWorker) return false;
      if (deptFilter !== 'Semua' && e.department !== deptFilter) return false;
      if (q && !(`${e.fullName} ${e.nik}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [employees, deptFilter, search]);

  // ---------- validasi roster per karyawan ----------
  const issuesByEmployee = useMemo(() => {
    const result = new Map<string, Map<string, string[]>>();
    const lookbackStart = toDateStr(addDays(days[0], -7));
    const allDays: string[] = [];
    for (let d = parseDateStr(lookbackStart); toDateStr(d) <= dateTo; d = addDays(d, 1)) allDays.push(toDateStr(d));

    visibleEmployees.forEach((emp) => {
      const issues = new Map<string, string[]>();
      const push = (date: string, msg: string) => {
        if (date < dateFrom) return;
        issues.set(date, [...(issues.get(date) || []), msg]);
      };
      let streak = 0;
      allDays.forEach((date, idx) => {
        const sid = scheduleMap.get(`${emp.id}|${date}`);
        const sh = sid && sid !== ROSTER_OFF_ID ? shiftById.get(sid) : undefined;
        if (sh) {
          streak += 1;
          if (streak > 6) push(date, `Kerja ${streak} hari berturut-turut tanpa libur`);
          // jeda istirahat antar shift
          const prevDate = idx > 0 ? allDays[idx - 1] : undefined;
          const prevSid = prevDate ? scheduleMap.get(`${emp.id}|${prevDate}`) : undefined;
          const prevSh = prevSid && prevSid !== ROSTER_OFF_ID ? shiftById.get(prevSid) : undefined;
          if (prevSh) {
            const prevEndAbs = isOvernight(prevSh) ? toMin(prevSh.endTime) + 1440 : toMin(prevSh.endTime);
            const gapMin = 1440 + toMin(sh.startTime) - prevEndAbs;
            if (gapMin < 11 * 60) push(date, `Jeda istirahat hanya ${(gapMin / 60).toFixed(1)} jam dari shift sebelumnya (min. 11 jam)`);
          }
        } else if (sid === ROSTER_OFF_ID) {
          streak = 0;
        } else {
          streak = 0;
        }
      });
      result.set(emp.id, issues);
    });
    return result;
  }, [visibleEmployees, days, dateFrom, dateTo, scheduleMap, shiftById]);

  const totalIssues = useMemo(() => {
    let n = 0;
    issuesByEmployee.forEach((m) => m.forEach((arr) => (n += arr.length)));
    return n;
  }, [issuesByEmployee]);

  // ---------- ringkasan & cakupan ----------
  const coverage = useMemo(() => {
    return days.map((d) => {
      const date = toDateStr(d);
      const perShift: Record<string, number> = {};
      let working = 0;
      let off = 0;
      let empty = 0;
      visibleEmployees.forEach((e) => {
        const sid = scheduleMap.get(`${e.id}|${date}`);
        if (!sid) empty += 1;
        else if (sid === ROSTER_OFF_ID) off += 1;
        else {
          working += 1;
          perShift[sid] = (perShift[sid] || 0) + 1;
        }
      });
      return { date, working, off, empty, perShift };
    });
  }, [days, visibleEmployees, scheduleMap]);

  const rowSummary = (empId: string) => {
    let work = 0;
    let off = 0;
    let mins = 0;
    days.forEach((d) => {
      const sid = scheduleMap.get(`${empId}|${toDateStr(d)}`);
      if (!sid) return;
      if (sid === ROSTER_OFF_ID) off += 1;
      else {
        const sh = shiftById.get(sid);
        if (sh) {
          work += 1;
          mins += shiftDurationMins(sh) - (sh.breakMins || 0);
        }
      }
    });
    return { work, off, hours: Math.round((mins / 60) * 10) / 10 };
  };

  // ---------- aksi roster ----------
  const applyBrush = (empId: string, date: string) => {
    if (!brush) return;
    upsertSchedules([{ employeeId: empId, date, shiftId: brush === 'ERASE' ? null : brush }]);
  };

  const fillRow = (empId: string) => {
    if (!brush) return;
    upsertSchedules(days.map((d) => ({ employeeId: empId, date: toDateStr(d), shiftId: brush === 'ERASE' ? null : brush })));
  };

  const handleFillPattern = () => {
    if (!brush || brush === 'ERASE' || brush === ROSTER_OFF_ID) {
      setNotice('Pilih sebuah shift kerja pada palet kuas terlebih dahulu.');
      return;
    }
    const items = visibleEmployees.flatMap((e) =>
      days.map((d) => {
        const weekend = d.getDay() === 0 || d.getDay() === 6;
        return { employeeId: e.id, date: toDateStr(d), shiftId: weekend ? ROSTER_OFF_ID : brush };
      })
    );
    upsertSchedules(items);
    setNotice(`Pola Senin–Jumat (${shiftById.get(brush)?.code}) & Sabtu–Minggu libur diterapkan ke ${visibleEmployees.length} karyawan.`);
  };

  const handleCopyPrevious = () => {
    const shiftDays = mode === 'week' ? 7 : 0;
    const items: { employeeId: string; date: string; shiftId: string | null }[] = [];
    visibleEmployees.forEach((e) => {
      days.forEach((d) => {
        let src: Date;
        if (mode === 'week') src = addDays(d, -shiftDays);
        else {
          const prevMonthLast = new Date(d.getFullYear(), d.getMonth(), 0).getDate();
          src = new Date(d.getFullYear(), d.getMonth() - 1, Math.min(d.getDate(), prevMonthLast));
        }
        const sid = scheduleMap.get(`${e.id}|${toDateStr(src)}`);
        if (sid) items.push({ employeeId: e.id, date: toDateStr(d), shiftId: sid });
      });
    });
    if (items.length === 0) {
      setNotice('Tidak ada roster pada periode sebelumnya untuk disalin.');
      return;
    }
    upsertSchedules(items);
    setNotice(`${items.length} entri roster disalin dari ${mode === 'week' ? 'minggu' : 'bulan'} sebelumnya.`);
  };

  const handleClearPeriod = () => {
    if (!window.confirm(`Kosongkan roster ${visibleEmployees.length} karyawan pada periode ${periodLabel}?`)) return;
    clearSchedules(visibleEmployees.map((e) => e.id), dateFrom, dateTo);
    setNotice('Roster periode ini dikosongkan.');
  };

  const handleExportCsv = () => {
    const header = ['NIK', 'Nama', 'Departemen', ...days.map((d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${DAY_NAMES[(d.getDay() + 6) % 7]}`), 'Hari Kerja', 'Libur', 'Jam Kerja'];
    const rows = visibleEmployees.map((e) => {
      const sum = rowSummary(e.id);
      return [
        e.nik,
        e.fullName,
        e.department,
        ...days.map((d) => {
          const sid = scheduleMap.get(`${e.id}|${toDateStr(d)}`);
          return !sid ? '' : sid === ROSTER_OFF_ID ? 'OFF' : shiftById.get(sid)?.code || '';
        }),
        sum.work,
        sum.off,
        sum.hours,
      ];
    });
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roster-${currentTenant?.code || 'tenant'}-${dateFrom}_${dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ---------- master shift ----------
  const openNewShift = () => {
    setFormError(null);
    setShiftForm({ ...EMPTY_FORM });
  };
  const openEditShift = (s: WorkShift) => {
    setFormError(null);
    setShiftForm({
      id: s.id,
      name: s.name,
      code: s.code,
      startTime: s.startTime,
      endTime: s.endTime,
      lateToleranceMins: s.lateToleranceMins,
      breakMins: s.breakMins ?? 60,
      color: s.color,
      isActive: s.isActive !== false,
    });
  };
  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftForm) return;
    const name = shiftForm.name.trim();
    const code = shiftForm.code.trim().toUpperCase();
    if (!name || !code) {
      setFormError('Nama dan kode shift wajib diisi.');
      return;
    }
    if (shifts.some((s) => s.code.toUpperCase() === code && s.id !== shiftForm.id)) {
      setFormError(`Kode shift "${code}" sudah dipakai.`);
      return;
    }
    if (toMin(shiftForm.startTime) === toMin(shiftForm.endTime)) {
      setFormError('Jam mulai dan jam selesai tidak boleh sama.');
      return;
    }
    const night = isOvernight(shiftForm);
    const payload = {
      name,
      code,
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      color: shiftForm.color,
      isNightShift: night,
      lateToleranceMins: Math.max(0, Number(shiftForm.lateToleranceMins) || 0),
      breakMins: Math.max(0, Number(shiftForm.breakMins) || 0),
      isActive: shiftForm.isActive,
    };
    if (shiftForm.id) updateShift(shiftForm.id, payload);
    else addShift(payload);
    setShiftForm(null);
    setNotice(`Shift ${code} disimpan.`);
  };
  const handleDeleteShift = (s: WorkShift) => {
    const used = schedules.filter((x) => x.shiftId === s.id).length;
    const msg = used > 0
      ? `Shift ${s.code} dipakai pada ${used} entri roster. Menghapusnya juga menghapus entri tersebut. Lanjutkan?`
      : `Hapus shift ${s.code}?`;
    if (window.confirm(msg)) deleteShift(s.id);
  };

  const cellW = mode === 'week' ? 'min-w-[88px]' : 'min-w-[34px]';

  return (
    <div className="space-y-4">
      {notice && (
        <div className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg text-xs font-medium">{notice}</div>
      )}

      {/* ===== MASTER SHIFT ===== */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Master Shift</h4>
            <p className="text-[11px] text-slate-500">Atur jam kerja, istirahat, toleransi, dan warna. Shift lintas hari terdeteksi otomatis.</p>
          </div>
          <button
            type="button"
            onClick={openNewShift}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Shift
          </button>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {shifts.map((s) => {
            const c = colorOf(s.color);
            const used = schedules.filter((x) => x.shiftId === s.id).length;
            const netHours = Math.round(((shiftDurationMins(s) - (s.breakMins || 0)) / 60) * 10) / 10;
            return (
              <div key={s.id} className={`p-3 border rounded-lg space-y-1.5 ${s.isActive === false ? 'opacity-60 bg-slate-50' : 'bg-white'} border-slate-200`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-xs truncate">{s.name}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${c.chip}`}>{s.code}</span>
                </div>
                <div className="text-base font-bold font-mono text-slate-800 flex items-center gap-1.5">
                  {s.startTime} – {s.endTime}
                  {isOvernight(s) && <Moon className="w-3.5 h-3.5 text-slate-500" />}
                </div>
                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <div>Efektif {netHours} jam · istirahat {s.breakMins ?? 0} mnt</div>
                  <div>Toleransi telat {s.lateToleranceMins} mnt · dipakai {used}× di roster</div>
                  {isOvernight(s) && <div className="text-slate-600 font-semibold">Lintas hari (selesai esok hari)</div>}
                  {s.isActive === false && <div className="text-amber-700 font-semibold">Nonaktif</div>}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => openEditShift(s)}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => updateShift(s.id, { isActive: s.isActive === false })}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                  >
                    {s.isActive === false ? 'Aktifkan' : 'Nonaktifkan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteShift(s)}
                    className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                    title="Hapus shift"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          {shifts.length === 0 && <div className="text-xs text-slate-400 italic col-span-full">Belum ada shift. Tambahkan shift pertama.</div>}
        </div>
      </div>

      {/* ===== ROSTER ===== */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="p-3 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900">Roster Penjadwalan</h4>
              <span className="text-[11px] text-slate-500">{visibleEmployees.length} karyawan</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
                {(['week', 'month'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`px-2.5 py-1 rounded-md ${mode === m ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'}`}
                  >
                    {m === 'week' ? 'Mingguan' : 'Bulanan'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => shiftPeriod(-1)} className="p-1.5 hover:bg-slate-100 rounded border border-slate-200" title="Periode sebelumnya">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-800 min-w-[150px] text-center">{periodLabel}</span>
                <button type="button" onClick={() => shiftPeriod(1)} className="p-1.5 hover:bg-slate-100 rounded border border-slate-200" title="Periode berikutnya">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setAnchor(new Date())} className="px-2 py-1 text-[11px] font-semibold border border-slate-200 rounded hover:bg-slate-100">
                  Hari ini
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white">
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'Semua' ? 'Semua Departemen' : d}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / NIK…"
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white w-44"
            />
            <div className="flex-1" />
            <button type="button" onClick={() => setStaffOpen(true)} className="px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Karyawan Shift ({shiftWorkerCount})
            </button>
            <button type="button" onClick={handleFillPattern} className="px-2.5 py-1.5 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg flex items-center gap-1" title="Isi Senin–Jumat dengan shift kuas terpilih, Sabtu–Minggu libur">
              <Sparkles className="w-3.5 h-3.5" /> Isi Pola Sen–Jum
            </button>
            <button type="button" onClick={handleCopyPrevious} className="px-2.5 py-1.5 text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg flex items-center gap-1">
              <Copy className="w-3.5 h-3.5" /> Salin {mode === 'week' ? 'Minggu' : 'Bulan'} Lalu
            </button>
            <button type="button" onClick={handleClearPeriod} className="px-2.5 py-1.5 text-[11px] font-semibold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-1">
              <Eraser className="w-3.5 h-3.5" /> Kosongkan
            </button>
            <button type="button" onClick={handleExportCsv} className="px-2.5 py-1.5 text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>

          {/* Palet kuas */}
          <div className="flex items-center gap-1.5 flex-wrap p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-bold text-slate-600 mr-1">Kuas:</span>
            {activeShifts.map((s) => {
              const c = colorOf(s.color);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setBrush(s.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-all ${c.cell} ${brush === s.id ? 'ring-2 ring-offset-1 ring-indigo-500 scale-105' : 'opacity-80 hover:opacity-100'}`}
                  title={`${s.name} ${s.startTime}–${s.endTime}`}
                >
                  {s.code} <span className="font-mono font-normal">{s.startTime}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setBrush(ROSTER_OFF_ID)}
              className={`px-2 py-1 rounded-md text-[11px] font-bold border bg-white text-slate-600 border-slate-300 ${brush === ROSTER_OFF_ID ? 'ring-2 ring-offset-1 ring-indigo-500' : ''}`}
            >
              LIBUR
            </button>
            <button
              type="button"
              onClick={() => setBrush('ERASE')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold border bg-white text-rose-600 border-rose-200 flex items-center gap-1 ${brush === 'ERASE' ? 'ring-2 ring-offset-1 ring-rose-400' : ''}`}
            >
              <Eraser className="w-3 h-3" /> Hapus
            </button>
            <span className="text-[10px] text-slate-400 ml-auto">Klik atau seret pada sel untuk mengisi</span>
          </div>

          {totalIssues > 0 && (
            <div className="p-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              {totalIssues} peringatan pada periode ini (kerja &gt; 6 hari berturut-turut atau jeda istirahat &lt; 11 jam). Arahkan kursor ke sel bertanda ⚠.
            </div>
          )}
        </div>

        <div className="overflow-x-auto select-none">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="sticky left-0 z-10 bg-slate-50 text-left px-3 py-2 min-w-[190px] border-b border-r border-slate-200 font-semibold">Karyawan</th>
                {days.map((d) => {
                  const date = toDateStr(d);
                  const weekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <th
                      key={date}
                      className={`${cellW} px-1 py-1.5 text-center border-b border-slate-200 font-semibold ${weekend ? 'bg-rose-50/70 text-rose-700' : ''} ${date === todayStr ? 'ring-1 ring-inset ring-indigo-400' : ''}`}
                    >
                      <div className="text-[10px]">{DAY_NAMES[(d.getDay() + 6) % 7]}</div>
                      <div className="text-[11px] font-bold">{d.getDate()}</div>
                    </th>
                  );
                })}
                <th className="px-2 py-2 text-center border-b border-l border-slate-200 font-semibold min-w-[84px]">Kerja / Libur / Jam</th>
              </tr>
            </thead>
            <tbody>
              {visibleEmployees.map((emp) => {
                const sum = rowSummary(emp.id);
                const empIssues = issuesByEmployee.get(emp.id);
                return (
                  <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="sticky left-0 z-10 bg-white px-3 py-1.5 border-r border-slate-200">
                      <div className="flex items-center justify-between gap-1">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{emp.fullName}</div>
                          <div className="text-[10px] text-slate-400 truncate">{emp.nik} · {emp.department}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => fillRow(emp.id)}
                          className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-50 rounded border border-indigo-200"
                          title="Isi seluruh periode karyawan ini dengan kuas terpilih"
                        >
                          Isi
                        </button>
                      </div>
                    </td>
                    {days.map((d) => {
                      const date = toDateStr(d);
                      const sid = scheduleMap.get(`${emp.id}|${date}`);
                      const sh = sid && sid !== ROSTER_OFF_ID ? shiftById.get(sid) : undefined;
                      const weekend = d.getDay() === 0 || d.getDay() === 6;
                      const issues = empIssues?.get(date);
                      let cls = 'bg-transparent text-slate-300 border-dashed border-slate-200 hover:bg-slate-100';
                      let label = '·';
                      if (sid === ROSTER_OFF_ID) {
                        cls = 'bg-slate-100 text-slate-500 border-slate-200';
                        label = 'OFF';
                      } else if (sh) {
                        cls = colorOf(sh.color).cell;
                        label = sh.code;
                      } else if (sid) {
                        cls = 'bg-rose-50 text-rose-500 border-rose-200';
                        label = '?';
                      }
                      return (
                        <td key={date} className={`p-0.5 ${weekend ? 'bg-rose-50/30' : ''}`}>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              paintingRef.current = true;
                              applyBrush(emp.id, date);
                            }}
                            onMouseEnter={() => {
                              if (paintingRef.current) applyBrush(emp.id, date);
                            }}
                            title={
                              (sh ? `${sh.name} (${sh.startTime}–${sh.endTime})` : sid === ROSTER_OFF_ID ? 'Libur' : 'Belum dijadwalkan') +
                              (issues ? `\n⚠ ${issues.join('\n⚠ ')}` : '')
                            }
                            className={`relative w-full ${mode === 'week' ? 'h-10' : 'h-8'} border rounded text-[10px] font-bold leading-tight transition-colors ${cls} ${issues ? 'ring-2 ring-amber-400' : ''}`}
                          >
                            {mode === 'week' && sh ? (
                              <>
                                <div>{label}</div>
                                <div className="font-mono font-normal text-[9px] opacity-80">{sh.startTime}–{sh.endTime}</div>
                              </>
                            ) : (
                              label
                            )}
                            {issues && <span className="absolute -top-1 -right-1 text-[9px]">⚠</span>}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-2 py-1.5 text-center border-l border-slate-200 font-mono text-[11px] text-slate-700">
                      {sum.work} / {sum.off} / {sum.hours}j
                    </td>
                  </tr>
                );
              })}
              {visibleEmployees.length === 0 && (
                <tr>
                  <td colSpan={days.length + 2} className="p-6 text-center text-xs text-slate-400 italic">
                    {shiftWorkerCount === 0 ? 'Belum ada karyawan shift. Klik "Karyawan Shift" untuk menentukan siapa saja yang masuk roster.' : 'Tidak ada karyawan shift yang cocok dengan filter.'}
                  </td>
                </tr>
              )}
            </tbody>
            {visibleEmployees.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 text-[10px] text-slate-600">
                  <td className="sticky left-0 z-10 bg-slate-50 px-3 py-1.5 border-r border-slate-200 font-bold">Cakupan (bekerja / libur / kosong)</td>
                  {coverage.map((c) => (
                    <td key={c.date} className="px-0.5 py-1 text-center font-mono" title={Object.entries(c.perShift).map(([id, n]) => `${shiftById.get(id)?.code}: ${n}`).join('\n') || 'Tidak ada yang bekerja'}>
                      <div className="font-bold text-emerald-700">{c.working}</div>
                      <div className="text-slate-500">{c.off}/{c.empty}</div>
                    </td>
                  ))}
                  <td className="border-l border-slate-200" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ===== TABEL DAFTAR ROSTER P / S / M / L ===== */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Daftar Roster Karyawan Shift — {periodLabel}</h4>
            <p className="text-[11px] text-slate-500">Khusus karyawan shift. Kode: P = Pagi, S = Siang, M = Malam, L = Libur.</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            {(['P', 'S', 'M', 'L'] as const).map((l) => (
              <span key={l} className={`px-2 py-0.5 rounded border ${LETTER_STYLE[l]}`}>{l} = {l === 'P' ? 'Pagi' : l === 'S' ? 'Siang' : l === 'M' ? 'Malam' : 'Libur'}</span>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="px-2 py-2 text-center border-b border-r border-slate-200 w-10">No</th>
                <th className="sticky left-0 z-10 bg-slate-50 text-left px-3 py-2 min-w-[180px] border-b border-r border-slate-200">Nama</th>
                <th className="px-2 py-2 text-left border-b border-r border-slate-200 min-w-[110px]">Departemen</th>
                {days.map((d) => {
                  const weekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <th key={toDateStr(d)} className={`px-1 py-1 text-center border-b border-slate-200 min-w-[26px] ${weekend ? 'bg-rose-50 text-rose-700' : ''}`}>
                      <div className="text-[9px] font-medium">{DAY_NAMES[(d.getDay() + 6) % 7]}</div>
                      <div className="text-[11px] font-bold">{d.getDate()}</div>
                    </th>
                  );
                })}
                {(['P', 'S', 'M', 'L'] as const).map((l) => (
                  <th key={l} className={`px-2 py-2 text-center border-b border-l border-slate-200 w-9 ${LETTER_STYLE[l]}`}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleEmployees.map((emp, idx) => {
                const tot = { P: 0, S: 0, M: 0, L: 0 };
                const cells = days.map((d) => {
                  const date = toDateStr(d);
                  const sid = scheduleMap.get(`${emp.id}|${date}`);
                  let letter: '' | 'P' | 'S' | 'M' | 'L' = '';
                  if (sid === ROSTER_OFF_ID) letter = 'L';
                  else if (sid && shiftById.has(sid)) letter = letterOfShift(shiftById.get(sid));
                  if (letter) tot[letter]++;
                  return (
                    <td key={date} className="p-0.5 text-center">
                      <div className={`h-6 flex items-center justify-center rounded border text-[11px] font-bold ${letter ? LETTER_STYLE[letter] : 'border-dashed border-slate-200 text-slate-300'}`}>{letter || '·'}</div>
                    </td>
                  );
                });
                return (
                  <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-2 py-1.5 text-center border-r border-slate-200 text-slate-500">{idx + 1}</td>
                    <td className="sticky left-0 z-10 bg-white px-3 py-1.5 border-r border-slate-200 font-semibold text-slate-900">{emp.fullName}</td>
                    <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600">{emp.department}</td>
                    {cells}
                    {(['P', 'S', 'M', 'L'] as const).map((l) => (
                      <td key={l} className="px-2 py-1.5 text-center border-l border-slate-200 font-mono font-bold text-slate-700">{tot[l]}</td>
                    ))}
                  </tr>
                );
              })}
              {visibleEmployees.length === 0 && (
                <tr>
                  <td colSpan={days.length + 7} className="p-6 text-center text-xs text-slate-400 italic">Belum ada karyawan shift pada daftar ini.</td>
                </tr>
              )}
            </tbody>
            {visibleEmployees.length > 0 && (
              <tfoot>
                {(['P', 'S', 'M', 'L'] as const).map((l) => (
                  <tr key={l} className="bg-slate-50 text-[10px]">
                    <td colSpan={3} className="sticky left-0 bg-slate-50 px-3 py-1 text-right font-bold text-slate-600 border-r border-slate-200">Jumlah {l}</td>
                    {days.map((d) => {
                      const date = toDateStr(d);
                      const n = visibleEmployees.filter((emp) => {
                        const sid = scheduleMap.get(`${emp.id}|${date}`);
                        if (!sid) return false;
                        if (sid === ROSTER_OFF_ID) return l === 'L';
                        return l !== 'L' && letterOfShift(shiftById.get(sid)) === l;
                      }).length;
                      return <td key={date} className="text-center font-mono font-semibold text-slate-700">{n}</td>;
                    })}
                    <td colSpan={4} className="border-l border-slate-200" />
                  </tr>
                ))}
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ===== MODAL KARYAWAN SHIFT ===== */}
      {staffOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setStaffOpen(false); }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Karyawan Shift</h4>
                <p className="text-[11px] text-slate-500">Hanya karyawan yang dicentang yang muncul di roster.</p>
              </div>
              <button type="button" onClick={() => setStaffOpen(false)} className="p-1 hover:bg-slate-100 rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-3 border-b border-slate-100">
              <input value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} placeholder="Cari nama / NIK…" className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs" />
            </div>
            <div className="overflow-y-auto divide-y divide-slate-100">
              {activeEmployees
                .filter((e) => `${e.fullName} ${e.nik} ${e.department}`.toLowerCase().includes(staffSearch.trim().toLowerCase()))
                .map((e) => (
                  <label key={e.id} className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={!!e.isShiftWorker} onChange={(ev) => updateEmployee(e.id, { isShiftWorker: ev.target.checked })} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-slate-900 truncate">{e.fullName}</span>
                      <span className="block text-[10px] text-slate-400 truncate">{e.nik} · {e.department}</span>
                    </span>
                  </label>
                ))}
            </div>
            <div className="p-3 border-t border-slate-200 flex justify-end">
              <button type="button" onClick={() => setStaffOpen(false)} className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg">Selesai</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL SHIFT ===== */}
      {shiftForm && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShiftForm(null);
          }}
        >
          <form onSubmit={handleSaveShift} className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden text-xs">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">{shiftForm.id ? 'Ubah Shift' : 'Tambah Shift Baru'}</h3>
              <button type="button" onClick={() => setShiftForm(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {formError && <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded">{formError}</div>}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Nama Shift *</label>
                  <input value={shiftForm.name} onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg" placeholder="Shift Pagi" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kode *</label>
                  <input value={shiftForm.code} onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value.toUpperCase() })} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono" placeholder="PAGI" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jam Mulai</label>
                  <input type="time" value={shiftForm.startTime} onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jam Selesai</label>
                  <input type="time" value={shiftForm.endTime} onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono" />
                </div>
              </div>
              {isOvernight(shiftForm) && toMin(shiftForm.startTime) !== toMin(shiftForm.endTime) && (
                <div className="p-2 bg-slate-100 border border-slate-200 rounded text-slate-700 flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5" /> Terdeteksi shift lintas hari (selesai keesokan harinya).
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Istirahat (menit)</label>
                  <input type="number" min={0} value={shiftForm.breakMins} onChange={(e) => setShiftForm({ ...shiftForm, breakMins: Number(e.target.value) })} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Toleransi Telat (menit)</label>
                  <input type="number" min={0} value={shiftForm.lateToleranceMins} onChange={(e) => setShiftForm({ ...shiftForm, lateToleranceMins: Number(e.target.value) })} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Warna</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(SHIFT_COLORS).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setShiftForm({ ...shiftForm, color: c })}
                      className={`w-6 h-6 rounded-full ${SHIFT_COLORS[c].dot} ${shiftForm.color === c ? 'ring-2 ring-offset-2 ring-slate-800' : ''}`}
                      title={c}
                    />
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 font-semibold text-slate-700">
                <input type="checkbox" checked={shiftForm.isActive} onChange={(e) => setShiftForm({ ...shiftForm, isActive: e.target.checked })} />
                Aktif (tampil di palet roster)
              </label>
              <div className="text-[11px] text-slate-500">
                Jam efektif: {Math.round(((shiftDurationMins(shiftForm) - (Number(shiftForm.breakMins) || 0)) / 60) * 10) / 10} jam
              </div>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" onClick={() => setShiftForm(null)} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700">
                Batal
              </button>
              <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { employeeApi, EmployeeApiError, type ApprovalItem } from './api';
import { ValidatedInput } from '../components/common/ValidatedInput';
import { readAttachment } from '../shared/attachment';

/**
 * The employee portal's request, document, team and approval screens. Everything here talks to /api/employee/*; the server creates each
 * request together with its approval item (approver = my real manager), so these forms only describe what is being asked.
 */

const rupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
const msg = (err: unknown, fallback: string) => (err instanceof EmployeeApiError || err instanceof Error ? err.message : fallback);

const STATUS_STYLE: Record<string, string> = {
  Menunggu: 'bg-amber-50 text-amber-700 border-amber-200',
  'Menunggu Approval': 'bg-amber-50 text-amber-700 border-amber-200',
  'Menunggu Review': 'bg-amber-50 text-amber-700 border-amber-200',
  Disetujui: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Disetujui Finance': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Aktif: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Selesai: 'bg-slate-100 text-slate-700 border-slate-200',
  Lunas: 'bg-slate-100 text-slate-700 border-slate-200',
  Ditolak: 'bg-rose-50 text-rose-700 border-rose-200',
};
const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${STATUS_STYLE[status] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>{status}</span>
);

// ------------------------------------------------------------------ generic form ---------------------------------------------------------

type Field = {
  key: string;
  label: string;
  type: 'text' | 'date' | 'time' | 'number' | 'textarea' | 'select' | 'file';
  options?: { value: string; label: string }[];
  required?: boolean;
  validate?: (v: string) => string | null;
  placeholder?: string;
};

const RequestForm: React.FC<{ fields: Field[]; submitLabel: string; onSubmit: (values: Record<string, string>) => Promise<void> }> = ({ fields, submitLabel, onSubmit }) => {
  const empty = () => Object.fromEntries(fields.map((f) => [f.key, f.type === 'select' && f.options?.length ? '' : '']));
  const [values, setValues] = useState<Record<string, string>>(empty);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});

  const fieldError = (f: Field): string | null => {
    const v = values[f.key] ?? '';
    if (f.required && !v.trim()) return `${f.label} wajib diisi`;
    if (v && f.validate) return f.validate(v);
    return null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    setError(null);
    if (fields.some((f) => fieldError(f))) return;
    setBusy(true);
    try {
      await onSubmit(values);
      setValues(empty());
      setFileNames({});
      setAttempted(false);
    } catch (err) {
      setError(msg(err, 'Gagal mengirim pengajuan.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      {error && <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-2 font-semibold">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((f) => {
          const err = attempted ? fieldError(f) : null;
          const wide = f.type === 'textarea' ? 'sm:col-span-2' : '';
          if (f.type === 'select') {
            return (
              <div key={f.key} className={wide}>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">{f.label}{f.required ? ' *' : ''}</label>
                <select value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white ${err ? 'border-rose-400' : 'border-slate-300'}`}>
                  <option value="">-- Pilih --</option>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {err && <div className="text-[11px] text-rose-600 mt-1">{err}</div>}
              </div>
            );
          }
          if (f.type === 'textarea') {
            return (
              <div key={f.key} className={wide}>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">{f.label}{f.required ? ' *' : ''}</label>
                <textarea rows={2} value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} placeholder={f.placeholder} className={`w-full px-2.5 py-1.5 border rounded-lg text-xs ${err ? 'border-rose-400' : 'border-slate-300'}`} />
                {err && <div className="text-[11px] text-rose-600 mt-1">{err}</div>}
              </div>
            );
          }
          if (f.type === 'file') {
            return (
              <div key={f.key} className={wide}>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">{f.label}{f.required ? ' *' : ''}</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className={`w-full text-xs border rounded-lg p-1.5 ${err ? 'border-rose-400' : 'border-slate-300'}`}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return setValues({ ...values, [f.key]: '' });
                    try {
                      const url = await readAttachment(file);
                      setValues({ ...values, [f.key]: url });
                      setFileNames({ ...fileNames, [f.key]: file.name });
                      setError(null);
                    } catch (er) {
                      setValues({ ...values, [f.key]: '' });
                      setError(msg(er, 'Lampiran tidak valid.'));
                      e.target.value = '';
                    }
                  }}
                />
                {fileNames[f.key] && <div className="text-[11px] text-emerald-700 mt-1">{fileNames[f.key]}</div>}
                {err && <div className="text-[11px] text-rose-600 mt-1">{err}</div>}
              </div>
            );
          }
          return (
            <ValidatedInput
              key={f.key}
              label={f.label}
              type={f.type}
              required={f.required}
              requiredLabel={`${f.label} wajib diisi`}
              validate={f.validate}
              showError={attempted}
              value={values[f.key]}
              onChange={(v) => setValues({ ...values, [f.key]: v })}
              placeholder={f.placeholder}
              className="text-xs"
            />
          );
        })}
      </div>
      <button type="submit" disabled={busy} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50">{busy ? 'Mengirim...' : submitLabel}</button>
    </form>
  );
};

function useList<T = Record<string, unknown>>(loader: () => Promise<T[]>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = () => loader().then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  return { rows, loading, reload };
}

const ListBox: React.FC<{ title: string; loading: boolean; empty: string; children: React.ReactNode; count: number }> = ({ title, loading, empty, children, count }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4">
    <h3 className="font-bold text-xs text-slate-800 mb-2">{title}</h3>
    {loading ? <div className="text-xs text-slate-400">Memuat...</div> : count === 0 ? <div className="text-xs text-slate-400">{empty}</div> : <div className="space-y-1.5">{children}</div>}
  </div>
);
const Row: React.FC<{ left: React.ReactNode; right?: React.ReactNode; status: string }> = ({ left, right, status }) => (
  <div className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-1.5">
    <div className="min-w-0">{left}</div>
    <div className="flex items-center gap-2 shrink-0">{right}<StatusBadge status={status} /></div>
  </div>
);

const num = (v: string) => Number(v);
const isTime = (v: string) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? null : 'Format jam HH:MM');
const positive = (v: string) => (Number(v) > 0 ? null : 'Harus lebih dari 0');
const nonNegative = (v: string) => (Number(v) >= 0 && v !== '' ? null : 'Tidak boleh negatif');

// ------------------------------------------------------------------ Pengajuan ------------------------------------------------------------

type Section = 'lembur' | 'koreksi' | 'tukar' | 'pinjaman' | 'sppd' | 'reimburse';
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'lembur', label: 'Lembur' },
  { id: 'koreksi', label: 'Koreksi Presensi' },
  { id: 'tukar', label: 'Tukar Shift' },
  { id: 'pinjaman', label: 'Pinjaman' },
  { id: 'sppd', label: 'Perjalanan Dinas' },
  { id: 'reimburse', label: 'Reimbursement' },
];

export const RequestsTab: React.FC<{ canCreateAttendance: boolean }> = ({ canCreateAttendance }) => {
  const [section, setSection] = useState<Section>('lembur');
  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto">
        {SECTIONS.map((s) => (
          <button key={s.id} onClick={() => setSection(s.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border ${section === s.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>{s.label}</button>
        ))}
      </div>
      {section === 'lembur' && (canCreateAttendance ? <OvertimeSection /> : <NoAccess />)}
      {section === 'koreksi' && (canCreateAttendance ? <CorrectionSection /> : <NoAccess />)}
      {section === 'tukar' && (canCreateAttendance ? <SwapSection /> : <NoAccess />)}
      {section === 'pinjaman' && <LoanSection />}
      {section === 'sppd' && <TripSection />}
      {section === 'reimburse' && <ReimburseSection />}
    </div>
  );
};
const NoAccess = () => <div className="text-xs text-slate-500 bg-white border border-slate-200 rounded-xl p-4">Akun Anda belum memiliki izin untuk jenis pengajuan ini. Hubungi HR.</div>;

type Req = Record<string, any>;

const OvertimeSection: React.FC = () => {
  const { rows, loading, reload } = useList<Req>(() => employeeApi.list<Req>('overtime'));
  return (
    <>
      <RequestForm
        submitLabel="Ajukan Lembur"
        fields={[
          { key: 'date', label: 'Tanggal', type: 'date', required: true },
          { key: 'startTime', label: 'Jam Mulai', type: 'time', required: true, validate: isTime },
          { key: 'endTime', label: 'Jam Selesai', type: 'time', required: true, validate: isTime },
          { key: 'hours', label: 'Jumlah Jam (bulat, 1–12)', type: 'number', required: true, validate: (v) => (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 12 ? null : 'Isi 1–12 jam bulat') },
          { key: 'reason', label: 'Alasan', type: 'textarea', required: true },
        ]}
        onSubmit={async (v) => { await employeeApi.submit('overtime', { ...v, hours: num(v.hours) }); await reload(); }}
      />
      <ListBox title="Lembur Saya" loading={loading} count={rows.length} empty="Belum ada pengajuan lembur.">
        {rows.map((r) => <Row key={r.id} status={r.status} left={<><div className="font-semibold">{r.date}</div><div className="text-slate-500">{r.startTime}–{r.endTime} · {r.hours} jam</div></>} />)}
      </ListBox>
    </>
  );
};

const CorrectionSection: React.FC = () => {
  const { rows, loading, reload } = useList<Req>(() => employeeApi.list<Req>('corrections'));
  return (
    <>
      <RequestForm
        submitLabel="Ajukan Koreksi"
        fields={[
          { key: 'date', label: 'Tanggal Kejadian', type: 'date', required: true },
          { key: 'type', label: 'Jenis Koreksi', type: 'select', required: true, options: ['Lupa Clock-in', 'Lupa Clock-out', 'Salah Jam Masuk/Pulang', 'Gangguan Sistem/GPS'].map((x) => ({ value: x, label: x })) },
          { key: 'proposedClockIn', label: 'Jam Masuk yang Benar', type: 'time', validate: isTime },
          { key: 'proposedClockOut', label: 'Jam Pulang yang Benar', type: 'time', validate: isTime },
          { key: 'reason', label: 'Alasan', type: 'textarea', required: true },
          { key: 'attachmentUrl', label: 'Bukti (opsional)', type: 'file' },
        ]}
        onSubmit={async (v) => {
          if (!v.proposedClockIn && !v.proposedClockOut) throw new Error('Isi minimal salah satu jam yang diusulkan.');
          await employeeApi.submit('corrections', { ...v, proposedClockIn: v.proposedClockIn || null, proposedClockOut: v.proposedClockOut || null, attachmentUrl: v.attachmentUrl || null });
          await reload();
        }}
      />
      <ListBox title="Koreksi Saya" loading={loading} count={rows.length} empty="Belum ada pengajuan koreksi.">
        {rows.map((r) => <Row key={r.id} status={r.status} left={<><div className="font-semibold">{r.date} · {r.type}</div><div className="text-slate-500">{r.proposedClockIn ?? '-'} → {r.proposedClockOut ?? '-'}</div></>} />)}
      </ListBox>
    </>
  );
};

const SwapSection: React.FC = () => {
  const { rows, loading, reload } = useList<Req>(() => employeeApi.list<Req>('shift-swaps'));
  const [colleagues, setColleagues] = useState<{ id: string; fullName: string }[]>([]);
  useEffect(() => { employeeApi.list<{ id: string; fullName: string }>('colleagues').then(setColleagues).catch(() => setColleagues([])); }, []);
  return (
    <>
      {colleagues.length === 0 && <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">Tukar shift dilakukan dengan rekan satu atasan. Anda belum memiliki rekan satu atasan yang terdaftar.</div>}
      <RequestForm
        submitLabel="Ajukan Tukar Shift"
        fields={[
          { key: 'targetEmployeeId', label: 'Tukar dengan', type: 'select', required: true, options: colleagues.map((c) => ({ value: c.id, label: c.fullName })) },
          { key: 'requestDate', label: 'Tanggal Shift Saya', type: 'date', required: true },
          { key: 'targetDate', label: 'Tanggal Shift Rekan', type: 'date', required: true },
          { key: 'reason', label: 'Alasan', type: 'textarea', required: true },
        ]}
        onSubmit={async (v) => { await employeeApi.submit('shift-swaps', v); await reload(); }}
      />
      <ListBox title="Tukar Shift Saya" loading={loading} count={rows.length} empty="Belum ada pengajuan tukar shift.">
        {rows.map((r) => <Row key={r.id} status={r.status} left={<><div className="font-semibold">{r.requestDate} ⇄ {r.targetDate}</div><div className="text-slate-500">{r.reason}</div></>} />)}
      </ListBox>
    </>
  );
};

const LoanSection: React.FC = () => {
  const { rows, loading, reload } = useList<Req>(() => employeeApi.list<Req>('loans'));
  return (
    <>
      <RequestForm
        submitLabel="Ajukan Pinjaman"
        fields={[
          { key: 'loanType', label: 'Jenis Pinjaman', type: 'select', required: true, options: ['Kasbon Darurat', 'Pinjaman Lunak Karyawan', 'Pinjaman Pendidikan'].map((x) => ({ value: x, label: x })) },
          { key: 'totalAmount', label: 'Total Pinjaman (Rp)', type: 'number', required: true, validate: positive },
          { key: 'tenorMonths', label: 'Tenor (bulan)', type: 'number', required: true, validate: positive },
          { key: 'monthlyInstallment', label: 'Cicilan per Bulan (Rp)', type: 'number', required: true, validate: positive },
          { key: 'startDate', label: 'Mulai Potongan', type: 'date', required: true },
          { key: 'reason', label: 'Keperluan', type: 'textarea', required: true },
        ]}
        onSubmit={async (v) => { await employeeApi.submit('loans', { ...v, totalAmount: num(v.totalAmount), tenorMonths: num(v.tenorMonths), monthlyInstallment: num(v.monthlyInstallment) }); await reload(); }}
      />
      <ListBox title="Pinjaman Saya" loading={loading} count={rows.length} empty="Belum ada pinjaman.">
        {rows.map((r) => <Row key={r.id} status={r.status} left={<><div className="font-semibold">{r.loanType} · {rupiah(r.totalAmount)}</div><div className="text-slate-500">{r.tenorMonths} bln × {rupiah(r.monthlyInstallment)} · sisa {rupiah(r.remainingAmount)}</div></>} />)}
      </ListBox>
    </>
  );
};

const TripSection: React.FC = () => {
  const { rows, loading, reload } = useList<Req>(() => employeeApi.list<Req>('trips'));
  return (
    <>
      <RequestForm
        submitLabel="Ajukan SPPD"
        fields={[
          { key: 'destinationCity', label: 'Kota Tujuan', type: 'text', required: true },
          { key: 'startDate', label: 'Berangkat', type: 'date', required: true },
          { key: 'endDate', label: 'Kembali', type: 'date', required: true },
          { key: 'totalDays', label: 'Jumlah Hari', type: 'number', required: true, validate: positive },
          { key: 'transportType', label: 'Transportasi', type: 'select', required: true, options: ['Pesawat', 'Kereta Api', 'Mobil Operasional', 'Travel'].map((x) => ({ value: x, label: x })) },
          { key: 'estimatedCost', label: 'Estimasi Total Biaya (Rp)', type: 'number', required: true, validate: nonNegative },
          { key: 'perDiemDaily', label: 'Uang Harian per Hari (Rp)', type: 'number', required: true, validate: nonNegative },
          { key: 'accommodationCost', label: 'Akomodasi (Rp)', type: 'number', required: true, validate: nonNegative },
          { key: 'purpose', label: 'Tujuan Perjalanan', type: 'textarea', required: true },
        ]}
        onSubmit={async (v) => { await employeeApi.submit('trips', { ...v, totalDays: num(v.totalDays), estimatedCost: num(v.estimatedCost), perDiemDaily: num(v.perDiemDaily), accommodationCost: num(v.accommodationCost) }); await reload(); }}
      />
      <ListBox title="SPPD Saya" loading={loading} count={rows.length} empty="Belum ada perjalanan dinas.">
        {rows.map((r) => <Row key={r.id} status={r.status} left={<><div className="font-semibold">{r.tripNumber} · {r.destinationCity}</div><div className="text-slate-500">{r.startDate} s/d {r.endDate} · {rupiah(r.estimatedCost)}</div></>} />)}
      </ListBox>
    </>
  );
};

const ReimburseSection: React.FC = () => {
  const { rows, loading, reload } = useList<Req>(() => employeeApi.getReimbursements() as Promise<Req[]>);
  return (
    <>
      <RequestForm
        submitLabel="Ajukan Klaim"
        fields={[
          { key: 'category', label: 'Kategori', type: 'select', required: true, options: ['Kesehatan / Rawat Jalan', 'Kacamata / Optik', 'Perawatan Gigi', 'Transportasi Dinas', 'Makan Lembur / Klien', 'Komunikasi & Internet', 'Pelatihan & Sertifikasi', 'Lainnya'].map((x) => ({ value: x, label: x })) },
          { key: 'amount', label: 'Nominal (Rp)', type: 'number', required: true, validate: positive },
          { key: 'receiptDate', label: 'Tanggal Kwitansi', type: 'date', required: true },
          { key: 'receiptNumber', label: 'No. Kwitansi', type: 'text' },
          { key: 'description', label: 'Keterangan', type: 'textarea', required: true },
          { key: 'proofUrl', label: 'Bukti Kwitansi (foto/PDF)', type: 'file', required: true },
        ]}
        onSubmit={async (v) => { await employeeApi.submitReimbursement({ ...v, amount: num(v.amount), receiptNumber: v.receiptNumber || null }); await reload(); }}
      />
      <ListBox title="Klaim Saya" loading={loading} count={rows.length} empty="Belum ada klaim.">
        {rows.map((r) => <Row key={r.id} status={r.status} left={<><div className="font-semibold">{r.claimNumber} · {r.category}</div><div className="text-slate-500">{rupiah(r.amount)}{r.processedPeriod ? ` · dibayar ${r.processedPeriod}` : ''}</div></>} />)}
      </ListBox>
    </>
  );
};

// ------------------------------------------------------------------ Dokumen --------------------------------------------------------------

export const DocsTab: React.FC = () => {
  const { rows, loading } = useList<Req>(() => employeeApi.list<Req>('my-documents'));
  return (
    <ListBox title="Dokumen Resmi Saya" loading={loading} count={rows.length} empty="Belum ada dokumen resmi yang diterbitkan untuk Anda.">
      {rows.map((d) => (
        <div key={d.id} className="text-xs border-b border-slate-100 pb-1.5">
          <div className="font-semibold">{d.title}</div>
          <div className="text-slate-500">{d.documentNumber} · terbit {d.issueDate}</div>
          {d.qrVerificationUrl && <a href={d.qrVerificationUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline text-[11px]">Verifikasi keaslian dokumen</a>}
        </div>
      ))}
    </ListBox>
  );
};

// ------------------------------------------------------------------ Tim & Approval -------------------------------------------------------

type TeamMember = { id: string; fullName: string; position: string | null; today: { clockIn: string | null; clockOut: string | null; status: string; lateMinutes: number } | null; upcomingLeave: { leaveType: string; startDate: string; endDate: string; totalDays: number }[] };

export const TeamApprovalTab: React.FC = () => {
  const items = useList<ApprovalItem>(() => employeeApi.getApprovalItems());
  const team = useList<TeamMember>(() => employeeApi.list<TeamMember>('team'));
  const delegations = useList<Req>(() => employeeApi.list<Req>('delegations'));
  const [colleagues, setColleagues] = useState<{ id: string; fullName: string }[]>([]);
  useEffect(() => { employeeApi.list<{ id: string; fullName: string }>('colleagues').then(setColleagues).catch(() => setColleagues([])); }, []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<ApprovalItem | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pending = items.rows.filter((i) => i.status === 'Menunggu' || i.status === 'Eskalasi Terlambat');
  const done = items.rows.filter((i) => i.status === 'Disetujui' || i.status === 'Ditolak');

  async function decide(item: ApprovalItem, decision: 'Disetujui' | 'Ditolak', why?: string) {
    setBusyId(item.id);
    setActionError(null);
    try {
      await employeeApi.decideApproval(item.id, decision, why);
      setRejecting(null);
      setReason('');
      await items.reload();
    } catch (err) {
      setActionError(msg(err, 'Gagal memproses keputusan.'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {actionError && <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-2 font-semibold">{actionError}</div>}
      <ListBox title="Menunggu Keputusan Saya" loading={items.loading} count={pending.length} empty="Tidak ada pengajuan yang menunggu.">
        {pending.map((i) => (
          <div key={i.id} className="border border-slate-200 rounded-lg p-2.5 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold">{i.title}</div>
                <div className="text-slate-500">{i.category} · tahap {i.level}/{i.totalLevels}{i.deadlineAt ? ` · batas ${new Date(i.deadlineAt).toLocaleDateString('id-ID')}` : ''}</div>
                {i.notes && <div className="text-slate-500 mt-0.5">{i.notes}</div>}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button disabled={busyId === i.id} onClick={() => decide(i, 'Disetujui')} className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold disabled:opacity-50 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Setujui</button>
                <button disabled={busyId === i.id} onClick={() => { setRejecting(i); setReason(''); setReasonError(null); }} className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-semibold disabled:opacity-50 inline-flex items-center gap-1"><XCircle className="w-3 h-3" />Tolak</button>
              </div>
            </div>
          </div>
        ))}
      </ListBox>

      <ListBox title="Tim Saya Hari Ini" loading={team.loading} count={team.rows.length} empty="Anda tidak memiliki bawahan langsung.">
        {team.rows.map((m) => (
          <div key={m.id} className="text-xs border-b border-slate-100 pb-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{m.fullName}{m.position ? <span className="text-slate-400 font-normal"> · {m.position}</span> : null}</span>
              <span className={m.today ? 'text-emerald-700' : 'text-slate-400'}>{m.today ? `${m.today.clockIn ?? '-'} — ${m.today.clockOut ?? '-'}${m.today.lateMinutes ? ` (telat ${m.today.lateMinutes} mnt)` : ''}` : 'Belum presensi'}</span>
            </div>
            {m.upcomingLeave.map((l, k) => <div key={k} className="text-[11px] text-slate-500 inline-flex items-center gap-1"><Clock className="w-3 h-3" />{l.leaveType}: {l.startDate} s/d {l.endDate} ({l.totalDays} hari)</div>)}
          </div>
        ))}
      </ListBox>

      <div className="space-y-2">
        <RequestForm
          submitLabel="Delegasikan Persetujuan"
          fields={[
            { key: 'substituteId', label: 'Pengganti', type: 'select', required: true, options: colleagues.map((c) => ({ value: c.id, label: c.fullName })) },
            { key: 'startDate', label: 'Mulai', type: 'date', required: true },
            { key: 'endDate', label: 'Sampai', type: 'date', required: true },
            { key: 'reason', label: 'Alasan (opsional)', type: 'text' },
          ]}
          onSubmit={async (v) => { await employeeApi.submit('delegations', { ...v, reason: v.reason || undefined }); await delegations.reload(); }}
        />
        <ListBox title="Delegasi Saya" loading={delegations.loading} count={delegations.rows.filter((d) => d.isActive).length} empty="Tidak ada delegasi aktif.">
          {delegations.rows.filter((d) => d.isActive).map((d) => (
            <div key={d.id} className="flex items-center justify-between text-xs border-b border-slate-100 pb-1.5">
              <span>{colleagues.find((c) => c.id === d.substituteId)?.fullName ?? 'Pengganti'} · {String(d.startDate).slice(0, 10)} s/d {String(d.endDate).slice(0, 10)}</span>
              <button onClick={async () => { await employeeApi.removeDelegation(d.id).catch(() => undefined); await delegations.reload(); }} className="px-2 py-0.5 border border-rose-200 text-rose-700 rounded text-[11px]">Cabut</button>
            </div>
          ))}
        </ListBox>
      </div>

      {done.length > 0 && (
        <ListBox title="Riwayat Keputusan" loading={false} count={done.length} empty="">
          {done.slice(0, 20).map((i) => <Row key={i.id} status={i.status} left={<><div className="font-semibold">{i.title}</div><div className="text-slate-500">{i.category}</div></>} />)}
        </ListBox>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setRejecting(null)}>
          <div className="bg-white rounded-xl p-5 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-sm">Tolak: {rejecting.title}</h3>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan penolakan (wajib)" className={`w-full px-2.5 py-1.5 border rounded-lg text-xs ${reasonError ? 'border-rose-400' : 'border-slate-300'}`} />
            {reasonError && <div className="text-[11px] text-rose-600">{reasonError}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejecting(null)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold">Batal</button>
              <button
                onClick={() => (reason.trim().length < 3 ? setReasonError('Alasan penolakan wajib diisi (min. 3 karakter).') : decide(rejecting, 'Ditolak', reason.trim()))}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold"
              >Ya, Tolak</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

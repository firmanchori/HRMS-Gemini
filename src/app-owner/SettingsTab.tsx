import React, { useEffect, useState } from "react";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Mail, Server, Landmark, Plus, X } from "lucide-react";
import { api, ApiError, type EmailConfig, type EmailConfigInput, type BankAccount } from "./api";
import { ConfirmButton } from "./ConfirmButton";

type FormState = EmailConfigInput;

function BankAccountForm({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [form, setForm] = useState({ bankName: "", accountNumber: "", accountHolderName: "", isActive: true });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-indigo-600";
  const labelClass = "font-semibold text-slate-700 block mb-1 text-xs";
  function FieldError({ field }: { field: string }) {
    return fieldErrors[field] ? <p className="text-[11px] text-rose-600 mt-1">{fieldErrors[field]}</p> : null;
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.bankName.trim()) errs.bankName = "Nama bank wajib diisi.";
    if (!form.accountNumber.trim()) errs.accountNumber = "Nomor rekening wajib diisi.";
    if (!form.accountHolderName.trim()) errs.accountHolderName = "Nama pemilik rekening wajib diisi.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setError(null);
    setSaving(true);
    try {
      await api.createBankAccount(form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah rekening");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-4 mb-3 space-y-3">
      {error && <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-2">{error}</div>}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Nama Bank</label>
          <input value={form.bankName} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))} placeholder="BCA" className={inputClass} />
          <FieldError field="bankName" />
        </div>
        <div>
          <label className={labelClass}>No. Rekening</label>
          <input value={form.accountNumber} onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))} className={`${inputClass} font-mono`} />
          <FieldError field="accountNumber" />
        </div>
        <div>
          <label className={labelClass}>Nama Pemilik Rekening</label>
          <input value={form.accountHolderName} onChange={(e) => setForm((f) => ({ ...f, accountHolderName: e.target.value }))} className={inputClass} />
          <FieldError field="accountHolderName" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3.5 py-2 disabled:opacity-60">
          {saving ? "Menyimpan..." : "Tambah Rekening"}
        </button>
        <button type="button" onClick={onClose} className="text-xs font-semibold text-slate-500 px-3 py-2">
          Batal
        </button>
      </div>
    </form>
  );
}

function BankAccountsSection() {
  const [rows, setRows] = useState<BankAccount[]>([]);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    setRows(await api.listBankAccounts());
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(a: BankAccount) {
    await api.updateBankAccount(a.id, { isActive: !a.isActive });
    await load();
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-indigo-600" />
          <span>Rekening Transfer</span>
        </h2>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="text-xs font-semibold flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg px-3 py-2 shrink-0"
        >
          {showNew ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showNew ? "Tutup" : "Rekening Baru"}
        </button>
      </div>
      <p className="text-xs text-slate-500 mb-3">Rekening di bawah ini akan ditampilkan ke pendaftar saat mereka diminta transfer.</p>
      {showNew && <BankAccountForm onCreated={load} onClose={() => setShowNew(false)} />}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide">
            <tr>
              <th className="text-left px-3 py-2">Bank</th>
              <th className="text-left px-3 py-2">No. Rekening</th>
              <th className="text-left px-3 py-2">Pemilik</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold text-slate-900">{a.bankName}</td>
                <td className="px-3 py-2 font-mono text-slate-700">{a.accountNumber}</td>
                <td className="px-3 py-2 text-slate-500">{a.accountHolderName}</td>
                <td className="px-3 py-2">
                  <ConfirmButton
                    label={a.isActive ? "Aktif" : "Nonaktif"}
                    confirmTitle={a.isActive ? "Nonaktifkan Rekening Ini?" : "Aktifkan Rekening Ini?"}
                    confirmMessage={
                      a.isActive
                        ? `Rekening ${a.bankName} tidak akan lagi ditampilkan sebagai tujuan transfer ke pendaftar.`
                        : `Rekening ${a.bankName} akan kembali ditampilkan sebagai tujuan transfer ke pendaftar.`
                    }
                    danger={a.isActive}
                    onConfirm={() => toggleActive(a)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      a.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-400">
                  Belum ada rekening transfer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SettingsTab() {
  const [current, setCurrent] = useState<EmailConfig | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    const data = await api.getEmailConfig();
    setCurrent(data);
    setForm({
      provider: data.provider,
      fromName: data.fromName,
      fromEmail: data.fromEmail,
      isActive: data.isActive,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpUsername: data.smtpUsername,
      smtpSecure: data.smtpSecure,
    });
  }

  useEffect(() => {
    load();
  }, []);

  if (!current || !form) return <div className="text-xs text-slate-400">Memuat...</div>;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form!.fromName.trim()) errs.fromName = "Nama pengirim wajib diisi.";
    if (!form!.fromEmail.trim()) errs.fromEmail = "Alamat email pengirim wajib diisi.";
    if (form!.provider === "resend") {
      if (!current!.hasResendKey && !form!.resendApiKey) errs.resendApiKey = "API Key Resend wajib diisi.";
    } else {
      if (!form!.smtpHost) errs.smtpHost = "SMTP host wajib diisi.";
      if (!form!.smtpUsername) errs.smtpUsername = "Username SMTP wajib diisi.";
      if (!current!.hasSmtpPassword && !form!.smtpPassword) errs.smtpPassword = "Password SMTP wajib diisi.";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setNotice(null);
    setSaving(true);
    try {
      await api.updateEmailConfig(form);
      setNotice({ type: "ok", text: "Pengaturan email pengiriman berhasil disimpan dan aktif digunakan." });
      await load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof ApiError ? err.message : "Gagal menyimpan pengaturan" });
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-indigo-600";
  const labelClass = "font-semibold text-slate-700 block mb-1 text-xs";
  function FieldError({ field }: { field: string }) {
    return fieldErrors[field] ? <p className="text-[11px] text-rose-600 mt-1">{fieldErrors[field]}</p> : null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <BankAccountsSection />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            <span>Pengaturan Email Pengiriman</span>
          </h2>
        </div>
      </div>

      {current.usingEnvFallback && (
        <div className="mb-4 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Belum ada konfigurasi tersimpan — sistem masih memakai <code className="bg-amber-100 px-1 rounded">RESEND_API_KEY</code> dari env
            server sebagai fallback sementara. Simpan pengaturan di bawah untuk menggantinya dengan konfigurasi yang
            bisa Anda ubah kapan saja di sini.
          </span>
        </div>
      )}

      {notice && (
        <div
          className={`mb-4 flex items-start gap-2 text-xs rounded-lg p-3 border ${
            notice.type === "ok" ? "text-emerald-800 bg-emerald-50 border-emerald-200" : "text-rose-800 bg-rose-50 border-rose-200"
          }`}
        >
          {notice.type === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{notice.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div>
          <label className={labelClass}>Mailer Service</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => update("provider", "resend")}
              className={`flex-1 text-xs font-semibold px-3 py-2 rounded-lg border ${
                form.provider === "resend" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-300 text-slate-600"
              }`}
            >
              Resend (API Key)
            </button>
            <button
              type="button"
              onClick={() => update("provider", "smtp")}
              className={`flex-1 text-xs font-semibold px-3 py-2 rounded-lg border flex items-center justify-center gap-1.5 ${
                form.provider === "smtp" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-300 text-slate-600"
              }`}
            >
              <Server className="w-3.5 h-3.5" /> SMTP Server (Google Workspace, Office 365, dll)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Nama Pengirim</label>
            <input
              required
              value={form.fromName}
              onChange={(e) => update("fromName", e.target.value)}
              placeholder="NusaHR"
              className={inputClass}
            />
            <FieldError field="fromName" />
          </div>
          <div>
            <label className={labelClass}>Alamat Email Pengirim</label>
            <input
              required
              type="email"
              value={form.fromEmail}
              onChange={(e) => update("fromEmail", e.target.value)}
              placeholder="noreply@perusahaan.com"
              className={inputClass}
            />
            <FieldError field="fromEmail" />
          </div>
        </div>

        {form.provider === "resend" ? (
          <div>
            <label className={labelClass}>
              API Key Resend {current.hasResendKey && <span className="text-emerald-600 font-normal">(tersimpan, kosongkan jika tidak ingin mengganti)</span>}
            </label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={form.resendApiKey ?? ""}
                onChange={(e) => update("resendApiKey", e.target.value)}
                placeholder={current.hasResendKey ? "••••••••••••" : "re_xxxxxxxxxxxx"}
                className={`${inputClass} pr-9 font-mono`}
              />
              <button type="button" onClick={() => setShowSecret((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <FieldError field="resendApiKey" />
          </div>
        ) : (
          <div className="space-y-3 border-t border-slate-100 pt-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelClass}>SMTP Host</label>
                <input
                  required
                  value={form.smtpHost ?? ""}
                  onChange={(e) => update("smtpHost", e.target.value)}
                  placeholder="smtp.gmail.com"
                  className={inputClass}
                />
                <FieldError field="smtpHost" />
              </div>
              <div>
                <label className={labelClass}>Port</label>
                <input
                  required
                  type="number"
                  value={form.smtpPort ?? 587}
                  onChange={(e) => update("smtpPort", Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Username (Alamat Email)</label>
              <input
                required
                value={form.smtpUsername ?? ""}
                onChange={(e) => update("smtpUsername", e.target.value)}
                placeholder="hr@perusahaan.com"
                className={inputClass}
              />
              <FieldError field="smtpUsername" />
            </div>
            <div>
              <label className={labelClass}>
                Password / App Password{" "}
                {current.hasSmtpPassword && <span className="text-emerald-600 font-normal">(tersimpan, kosongkan jika tidak ingin mengganti)</span>}
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={form.smtpPassword ?? ""}
                  onChange={(e) => update("smtpPassword", e.target.value)}
                  placeholder={current.hasSmtpPassword ? "••••••••••••" : "App Password / Token Khusus"}
                  className={`${inputClass} pr-9 font-mono`}
                />
                <button type="button" onClick={() => setShowSecret((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <FieldError field="smtpPassword" />
              <p className="text-[10px] text-slate-400 mt-1">
                Untuk Gmail/Google Workspace &amp; Office 365, gunakan App Password, bukan password login biasa.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={form.smtpSecure ?? true} onChange={(e) => update("smtpSecure", e.target.checked)} />
              Gunakan koneksi aman (TLS/SSL)
            </label>
          </div>
        )}

        <label className="flex items-center gap-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
          <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
          Aktifkan konfigurasi ini (jika dimatikan, sistem kembali memakai env fallback)
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </form>
    </div>
  );
}

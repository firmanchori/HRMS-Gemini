import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { api, ApiError, type BankAccount } from "./api";
import { ConfirmButton } from "./ConfirmButton";

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

function BankAccountDetailModal({ account, onClose, onChanged }: { account: BankAccount; onClose: () => void; onChanged: () => void }) {
  async function toggleActive() {
    await api.updateBankAccount(account.id, { isActive: !account.isActive });
    onChanged();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="font-bold text-sm">{account.bankName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">No. Rekening</span>
              <span className="font-mono font-semibold text-slate-700">{account.accountNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Nama Pemilik</span>
              <span className="font-semibold text-slate-700">{account.accountHolderName}</span>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <ConfirmButton
              label={account.isActive ? "Nonaktifkan Rekening" : "Aktifkan Rekening"}
              confirmTitle={account.isActive ? "Nonaktifkan Rekening Ini?" : "Aktifkan Rekening Ini?"}
              confirmMessage={
                account.isActive
                  ? `Rekening ${account.bankName} tidak akan lagi ditampilkan sebagai tujuan transfer ke pendaftar.`
                  : `Rekening ${account.bankName} akan kembali ditampilkan sebagai tujuan transfer ke pendaftar.`
              }
              danger={account.isActive}
              onConfirm={toggleActive}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md ${
                account.isActive ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BankAccountsTab() {
  const [rows, setRows] = useState<BankAccount[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [detailAccount, setDetailAccount] = useState<BankAccount | null>(null);

  async function load() {
    const accounts = await api.listBankAccounts();
    setRows(accounts);
    if (detailAccount) setDetailAccount(accounts.find((a) => a.id === detailAccount.id) ?? null);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500">Rekening di bawah ini akan ditampilkan ke pendaftar saat mereka diminta transfer pembayaran.</p>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="text-xs font-semibold flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg px-3 py-2 shrink-0"
        >
          {showNew ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showNew ? "Tutup" : "Rekening Baru"}
        </button>
      </div>

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
              <tr key={a.id} onClick={() => setDetailAccount(a)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                <td className="px-3 py-2 font-semibold text-slate-900">{a.bankName}</td>
                <td className="px-3 py-2 font-mono text-slate-700">{a.accountNumber}</td>
                <td className="px-3 py-2 text-slate-500">{a.accountHolderName}</td>
                <td className="px-3 py-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      a.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {a.isActive ? "Aktif" : "Nonaktif"}
                  </span>
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

      {detailAccount && <BankAccountDetailModal account={detailAccount} onClose={() => setDetailAccount(null)} onChanged={load} />}
    </div>
  );
}

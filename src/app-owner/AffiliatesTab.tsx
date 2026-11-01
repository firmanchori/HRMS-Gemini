import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { api, ApiError, type Affiliate, type Plan, type AffiliateUsage } from "./api";
import { ConfirmButton } from "./ConfirmButton";
import { NumberInput } from "./NumberInput";

function AffiliateForm({ plans, onCreated, onClose }: { plans: Plan[]; onCreated: () => void; onClose: () => void }) {
  const [form, setForm] = useState({ planId: plans[0]?.id ?? "", code: "", affiliateName: "", customerDiscountPercent: 10, commissionPercent: 5 });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = "Kode affiliate wajib diisi.";
    if (!form.affiliateName.trim()) errs.affiliateName = "Nama affiliate wajib diisi.";
    if (form.customerDiscountPercent < 0 || form.customerDiscountPercent > 100) errs.customerDiscountPercent = "Harus antara 0-100%.";
    if (form.commissionPercent < 0 || form.commissionPercent > 100) errs.commissionPercent = "Harus antara 0-100%.";
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
      await api.createAffiliate(form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat affiliate");
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
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-4 space-y-3">
      {error && <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-2">{error}</div>}
      <div>
        <label className={labelClass}>Berlaku untuk Paket</label>
        <select required value={form.planId} onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))} className={`${inputClass} bg-white`}>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — Rp {p.priceIdr.toLocaleString("id-ID")}/bulan
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Kode Affiliate</label>
          <input
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="MITRA01"
            className={`${inputClass} font-mono uppercase`}
          />
          <FieldError field="code" />
        </div>
        <div>
          <label className={labelClass}>Nama Affiliate</label>
          <input value={form.affiliateName} onChange={(e) => setForm((f) => ({ ...f, affiliateName: e.target.value }))} placeholder="Nama mitra/referrer" className={inputClass} />
          <FieldError field="affiliateName" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Diskon untuk Pelanggan (%)</label>
          <NumberInput min={0} max={100} value={form.customerDiscountPercent} onChange={(v) => setForm((f) => ({ ...f, customerDiscountPercent: v }))} className={inputClass} />
          <FieldError field="customerDiscountPercent" />
        </div>
        <div>
          <label className={labelClass}>Komisi untuk Affiliate (%)</label>
          <NumberInput min={0} max={100} value={form.commissionPercent} onChange={(v) => setForm((f) => ({ ...f, commissionPercent: v }))} className={inputClass} />
          <FieldError field="commissionPercent" />
        </div>
      </div>
      <p className="text-[10px] text-slate-400">
        Komisi dihitung dari jumlah yang benar-benar dibayar pelanggan (setelah diskon), bukan dari harga normal.
      </p>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3.5 py-2 disabled:opacity-60">
          {saving ? "Menyimpan..." : "Buat Kode Affiliate"}
        </button>
        <button type="button" onClick={onClose} className="text-xs font-semibold text-slate-500 px-3 py-2">
          Batal
        </button>
      </div>
    </form>
  );
}

function AffiliateDetailModal({ affiliate, planName, onClose, onChanged }: { affiliate: Affiliate; planName: string; onClose: () => void; onChanged: () => void }) {
  const [usages, setUsages] = useState<AffiliateUsage[]>([]);

  useEffect(() => {
    api.getAffiliateUsages(affiliate.id).then(setUsages);
  }, [affiliate.id]);

  const totalCommission = usages.reduce((sum, u) => sum + u.commissionIdr, 0);

  async function toggleActive() {
    await api.updateAffiliate(affiliate.id, { isActive: !affiliate.isActive });
    onChanged();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0">
          <div>
            <h3 className="font-bold text-sm font-mono">{affiliate.code}</h3>
            <p className="text-xs text-slate-300">{affiliate.affiliateName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Berlaku untuk Paket</span>
              <span className="font-semibold text-slate-700">{planName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Dipakai</span>
              <span className="font-semibold text-slate-700">{affiliate.usedCount}x</span>
            </div>
            <div>
              <span className="text-slate-400 block">Diskon Pelanggan</span>
              <span className="font-semibold text-slate-700">{affiliate.customerDiscountPercent}%</span>
            </div>
            <div>
              <span className="text-slate-400 block">Komisi Affiliate</span>
              <span className="font-semibold text-slate-700">{affiliate.commissionPercent}%</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <ConfirmButton
              label={affiliate.isActive ? "Nonaktifkan Affiliate" : "Aktifkan Affiliate"}
              confirmTitle={affiliate.isActive ? "Nonaktifkan Affiliate Ini?" : "Aktifkan Affiliate Ini?"}
              confirmMessage={
                affiliate.isActive
                  ? `Kode affiliate "${affiliate.code}" tidak akan bisa dipakai lagi oleh pendaftar baru.`
                  : `Kode affiliate "${affiliate.code}" akan bisa dipakai kembali oleh pendaftar.`
              }
              danger={affiliate.isActive}
              onConfirm={toggleActive}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md ${
                affiliate.isActive ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            />
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Riwayat Pemakaian</h4>
            {usages.map((u) => (
              <div key={u.id} className="flex justify-between text-xs border-t border-slate-100 py-1.5">
                <span className="text-slate-500">{new Date(u.createdAt).toLocaleDateString("id-ID")}</span>
                <span className="text-slate-700">Dibayar Rp {u.amountPaidIdr.toLocaleString("id-ID")}</span>
                <span className="font-semibold text-emerald-700">Komisi Rp {u.commissionIdr.toLocaleString("id-ID")}</span>
              </div>
            ))}
            {usages.length === 0 && <p className="text-[11px] text-slate-400 py-2">Belum ada pemakaian.</p>}
            <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-200 mt-1">
              <span>Total Komisi Belum Dibayar</span>
              <span className="text-emerald-700">Rp {totalCommission.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AffiliatesTab() {
  const [rows, setRows] = useState<Affiliate[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [detailAffiliate, setDetailAffiliate] = useState<Affiliate | null>(null);

  async function load() {
    const [affiliates, planRows] = await Promise.all([api.listAffiliates(), api.listPlansAppOwner()]);
    setRows(affiliates);
    setPlans(planRows);
    if (detailAffiliate) setDetailAffiliate(affiliates.find((a) => a.id === detailAffiliate.id) ?? null);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => setShowNew((v) => !v)}
          className="text-xs font-semibold flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg px-3 py-2 shrink-0"
        >
          {showNew ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showNew ? "Tutup" : "Affiliate Baru"}
        </button>
      </div>

      {showNew && <AffiliateForm plans={plans} onCreated={load} onClose={() => setShowNew(false)} />}

      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide">
            <tr>
              <th className="text-left px-3 py-2">Kode</th>
              <th className="text-left px-3 py-2">Affiliate</th>
              <th className="text-left px-3 py-2">Paket</th>
              <th className="text-left px-3 py-2">Diskon Pelanggan</th>
              <th className="text-left px-3 py-2">Komisi</th>
              <th className="text-left px-3 py-2">Dipakai</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} onClick={() => setDetailAffiliate(a)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                <td className="px-3 py-2 font-mono font-semibold text-indigo-700">{a.code}</td>
                <td className="px-3 py-2 text-slate-700">{a.affiliateName}</td>
                <td className="px-3 py-2 text-slate-500">{plans.find((p) => p.id === a.planId)?.name ?? "-"}</td>
                <td className="px-3 py-2 text-slate-700">{a.customerDiscountPercent}%</td>
                <td className="px-3 py-2 text-slate-700">{a.commissionPercent}%</td>
                <td className="px-3 py-2 text-slate-500">{a.usedCount}</td>
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
                <td colSpan={7} className="px-3 py-6 text-center text-xs text-slate-400">
                  Belum ada kode affiliate.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detailAffiliate && (
        <AffiliateDetailModal
          affiliate={detailAffiliate}
          planName={plans.find((p) => p.id === detailAffiliate.planId)?.name ?? "-"}
          onClose={() => setDetailAffiliate(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

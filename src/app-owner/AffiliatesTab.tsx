import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { api, ApiError, type Affiliate, type Plan, type AffiliateUsage } from "./api";
import { ConfirmButton } from "./ConfirmButton";

function AffiliateForm({ plans, onCreated, onClose }: { plans: Plan[]; onCreated: () => void; onClose: () => void }) {
  const [form, setForm] = useState({ planId: plans[0]?.id ?? "", code: "", affiliateName: "", customerDiscountPercent: 10, commissionPercent: 5 });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
            required
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="MITRA01"
            className={`${inputClass} font-mono uppercase`}
          />
        </div>
        <div>
          <label className={labelClass}>Nama Affiliate</label>
          <input required value={form.affiliateName} onChange={(e) => setForm((f) => ({ ...f, affiliateName: e.target.value }))} placeholder="Nama mitra/referrer" className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Diskon untuk Pelanggan (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            required
            value={form.customerDiscountPercent}
            onChange={(e) => setForm((f) => ({ ...f, customerDiscountPercent: Number(e.target.value) }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Komisi untuk Affiliate (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            required
            value={form.commissionPercent}
            onChange={(e) => setForm((f) => ({ ...f, commissionPercent: Number(e.target.value) }))}
            className={inputClass}
          />
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

function UsagePanel({ affiliate, onClose }: { affiliate: Affiliate; onClose: () => void }) {
  const [usages, setUsages] = useState<AffiliateUsage[]>([]);

  useEffect(() => {
    api.getAffiliateUsages(affiliate.id).then(setUsages);
  }, [affiliate.id]);

  const totalCommission = usages.reduce((sum, u) => sum + u.commissionIdr, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-700">Riwayat Pemakaian — {affiliate.affiliateName}</h4>
        <button onClick={onClose}>
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
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
  );
}

export function AffiliatesTab() {
  const [rows, setRows] = useState<Affiliate[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [usageFor, setUsageFor] = useState<Affiliate | null>(null);

  async function load() {
    setRows(await api.listAffiliates());
    setPlans(await api.listPlansAppOwner());
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(a: Affiliate) {
    await api.updateAffiliate(a.id, { isActive: !a.isActive });
    await load();
  }

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
      {usageFor && <UsagePanel affiliate={usageFor} onClose={() => setUsageFor(null)} />}

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
              <th className="text-left px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-mono font-semibold text-indigo-700">{a.code}</td>
                <td className="px-3 py-2 text-slate-700">{a.affiliateName}</td>
                <td className="px-3 py-2 text-slate-500">{plans.find((p) => p.id === a.planId)?.name ?? "-"}</td>
                <td className="px-3 py-2 text-slate-700">{a.customerDiscountPercent}%</td>
                <td className="px-3 py-2 text-slate-700">{a.commissionPercent}%</td>
                <td className="px-3 py-2 text-slate-500">{a.usedCount}</td>
                <td className="px-3 py-2">
                  <ConfirmButton
                    label={a.isActive ? "Aktif" : "Nonaktif"}
                    confirmTitle={a.isActive ? "Nonaktifkan Affiliate Ini?" : "Aktifkan Affiliate Ini?"}
                    confirmMessage={
                      a.isActive
                        ? `Kode affiliate "${a.code}" tidak akan bisa dipakai lagi oleh pendaftar baru.`
                        : `Kode affiliate "${a.code}" akan bisa dipakai kembali oleh pendaftar.`
                    }
                    danger={a.isActive}
                    onConfirm={() => toggleActive(a)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      a.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  />
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => setUsageFor(a)} className="text-[11px] font-semibold text-indigo-700">
                    Riwayat
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-xs text-slate-400">
                  Belum ada kode affiliate.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { ValidatedDateInput } from "../components/common/ValidatedDateInput";
import { api, ApiError, type Promotion, type Plan } from "./api";
import { ConfirmButton } from "./ConfirmButton";

function PromoForm({ plans, onCreated, onClose }: { plans: Plan[]; onCreated: () => void; onClose: () => void }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    planId: plans[0]?.id ?? "",
    code: "",
    name: "",
    discountPercent: 10,
    validFrom: today,
    validUntil: today,
    maxUses: "" as string | number,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.createPromotion({
        planId: form.planId,
        code: form.code,
        name: form.name,
        discountPercent: form.discountPercent,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        maxUses: form.maxUses === "" ? null : Number(form.maxUses),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat promo");
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
        <p className="text-[10px] text-slate-400 mt-1">Promo ini hanya bisa dipakai untuk paket yang dipilih di atas, bukan paket lain.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Kode Promo</label>
          <input
            required
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="LAUNCH2026"
            className={`${inputClass} font-mono uppercase`}
          />
        </div>
        <div>
          <label className={labelClass}>Nama Promo</label>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Promo Peluncuran" className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Diskon (%)</label>
          <input
            type="number"
            min={1}
            max={100}
            required
            value={form.discountPercent}
            onChange={(e) => setForm((f) => ({ ...f, discountPercent: Number(e.target.value) }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Maks. Pemakaian</label>
          <input
            type="number"
            min={1}
            placeholder="Tanpa batas"
            value={form.maxUses}
            onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ValidatedDateInput label="Berlaku Dari" value={form.validFrom} onChange={(v) => setForm((f) => ({ ...f, validFrom: v }))} required />
        <ValidatedDateInput label="Berlaku Sampai" value={form.validUntil} onChange={(v) => setForm((f) => ({ ...f, validUntil: v }))} required minDate={form.validFrom} />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3.5 py-2 disabled:opacity-60">
          {saving ? "Menyimpan..." : "Buat Promo"}
        </button>
        <button type="button" onClick={onClose} className="text-xs font-semibold text-slate-500 px-3 py-2">
          Batal
        </button>
      </div>
    </form>
  );
}

export function PromotionsTab() {
  const [rows, setRows] = useState<Promotion[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    setRows(await api.listPromotions());
    setPlans(await api.listPlansAppOwner());
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(p: Promotion) {
    await api.updatePromotion(p.id, { isActive: !p.isActive });
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
          {showNew ? "Tutup" : "Promo Baru"}
        </button>
      </div>

      {showNew && <PromoForm plans={plans} onCreated={load} onClose={() => setShowNew(false)} />}

      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide">
            <tr>
              <th className="text-left px-3 py-2">Kode</th>
              <th className="text-left px-3 py-2">Paket</th>
              <th className="text-left px-3 py-2">Nama</th>
              <th className="text-left px-3 py-2">Diskon</th>
              <th className="text-left px-3 py-2">Berlaku</th>
              <th className="text-left px-3 py-2">Pemakaian</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-mono font-semibold text-indigo-700">{p.code}</td>
                <td className="px-3 py-2 text-slate-500">{plans.find((pl) => pl.id === p.planId)?.name ?? "-"}</td>
                <td className="px-3 py-2 text-slate-700">{p.name}</td>
                <td className="px-3 py-2 text-slate-700">{p.discountPercent}%</td>
                <td className="px-3 py-2 text-slate-500 text-xs">
                  {new Date(p.validFrom).toLocaleDateString("id-ID")} – {new Date(p.validUntil).toLocaleDateString("id-ID")}
                </td>
                <td className="px-3 py-2 text-slate-500">
                  {p.usedCount}
                  {p.maxUses ? ` / ${p.maxUses}` : ""}
                </td>
                <td className="px-3 py-2">
                  <ConfirmButton
                    label={p.isActive ? "Aktif" : "Nonaktif"}
                    confirmTitle={p.isActive ? "Nonaktifkan Promo Ini?" : "Aktifkan Promo Ini?"}
                    confirmMessage={
                      p.isActive
                        ? `Kode promo "${p.code}" tidak akan bisa dipakai lagi oleh pendaftar baru.`
                        : `Kode promo "${p.code}" akan bisa dipakai kembali oleh pendaftar.`
                    }
                    danger={p.isActive}
                    onConfirm={() => toggleActive(p)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      p.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-xs text-slate-400">
                  Belum ada kode promo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

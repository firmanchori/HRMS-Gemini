import React, { useEffect, useState } from "react";
import { Plus, X, Eye, Pencil, Trash2 } from "lucide-react";
import { api, ApiError, type Plan, type ModuleCatalogEntry, type PlanDetail, type DiscountScheme, type DiscountTier } from "./api";
import { ConfirmButton } from "./ConfirmButton";

const EMPTY_FORM = {
  name: "",
  allowsMultiEntity: false,
  maxEmployees: 50,
  maxEntities: 1,
  enabledModules: [] as string[],
  durationDays: 30,
  permanentDiscountPercent: 0,
  permanentDiscountReason: "",
  displayIncludesUserPricing: false,
  displayIncludesEntityPricing: false,
};

function PlanForm({
  catalog,
  existing,
  onSaved,
  onClose,
}: {
  catalog: ModuleCatalogEntry[];
  existing: Plan | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(
    existing
      ? {
          name: existing.name,
          allowsMultiEntity: existing.allowsMultiEntity,
          maxEmployees: existing.maxEmployees,
          maxEntities: existing.maxEntities,
          enabledModules: existing.enabledModules,
          durationDays: existing.durationDays,
          permanentDiscountPercent: existing.permanentDiscountPercent,
          permanentDiscountReason: existing.permanentDiscountReason ?? "",
          displayIncludesUserPricing: existing.displayIncludesUserPricing,
          displayIncludesEntityPricing: existing.displayIncludesEntityPricing,
        }
      : EMPTY_FORM
  );
  const [referencePreview, setReferencePreview] = useState(existing?.referenceMonthlyPriceIdr ?? 0);
  const [breakdown, setBreakdown] = useState<{ baseTotal: number; perUserTotal: number; perEntityTotal: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (form.enabledModules.length === 0) {
      setReferencePreview(0);
      setBreakdown([]);
      return;
    }
    api
      .calculatePricing({ moduleCodes: form.enabledModules, maxEntities: form.maxEntities, maxUsers: form.maxEmployees, durationDays: 30, discountPercent: 0 })
      .then((b) => {
        setReferencePreview(b.subtotalPerCycle);
        setBreakdown(b.perModule);
      })
      .catch(() => {
        setReferencePreview(0);
        setBreakdown([]);
      });
  }, [form.enabledModules, form.maxEntities, form.maxEmployees]);

  const salePricePreview = Math.round(referencePreview * (1 - form.permanentDiscountPercent / 100));
  const markdownRatio = referencePreview > 0 ? salePricePreview / referencePreview : 1;
  const displayReferencePreview = breakdown.reduce(
    (sum, m) => sum + m.baseTotal + (form.displayIncludesUserPricing ? m.perUserTotal : 0) + (form.displayIncludesEntityPricing ? m.perEntityTotal : 0),
    0
  );
  const displayPricePreview = Math.round(displayReferencePreview * markdownRatio);

  function toggleModule(code: string) {
    setForm((f) => ({
      ...f,
      enabledModules: f.enabledModules.includes(code) ? f.enabledModules.filter((m) => m !== code) : [...f.enabledModules, code],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.enabledModules.length === 0) return setError("Pilih minimal satu modul");
    if (form.permanentDiscountPercent > 0 && !form.permanentDiscountReason.trim()) {
      return setError("Alasan diskon permanen wajib diisi jika persentase > 0");
    }
    setError(null);
    setSaving(true);
    try {
      const payload = { ...form, permanentDiscountReason: form.permanentDiscountReason || undefined };
      if (existing) await api.updatePlan(existing.id, payload);
      else await api.createPlan({ ...payload, allowsMultiEntity: form.maxEntities > 1 });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan paket");
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
        <label className={labelClass}>Nama Paket</label>
        <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Starter / Professional / Enterprise" className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Maks. Karyawan</label>
          <input
            type="number"
            min={1}
            required
            value={form.maxEmployees}
            onChange={(e) => setForm((f) => ({ ...f, maxEmployees: Number(e.target.value) }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Maks. Entitas</label>
          <input
            type="number"
            min={1}
            required
            value={form.maxEntities}
            onChange={(e) => setForm((f) => ({ ...f, maxEntities: Number(e.target.value) }))}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={`${labelClass} mb-1.5`}>Modul yang Disertakan</label>
        <div className="grid grid-cols-2 gap-1.5">
          {catalog.map((c) => (
            <label key={c.code} className="flex items-center gap-2 text-xs border border-slate-200 rounded-md px-2.5 py-1.5">
              <input type="checkbox" checked={form.enabledModules.includes(c.code)} onChange={() => toggleModule(c.code)} />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-500">Harga Referensi (dari modul terpilih)</span>
          <span className="font-mono font-semibold text-slate-700">Rp {referencePreview.toLocaleString("id-ID")}/bulan</span>
        </div>
        {form.permanentDiscountPercent > 0 && (
          <div className="flex justify-between font-bold text-indigo-700 pt-1 border-t border-slate-200">
            <span>Harga Jual (setelah diskon permanen {form.permanentDiscountPercent}%)</span>
            <span className="font-mono">Rp {salePricePreview.toLocaleString("id-ID")}/bulan</span>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 pt-3">
        <label className={`${labelClass} mb-1.5`}>Harga yang Ditampilkan ke Calon Tenant</label>
        <p className="text-[10px] text-slate-400 mb-2">
          Secara default harga yang ditampilkan ke calon tenant hanya harga paket/modul, tanpa hitungan jumlah user atau entitas.
        </p>
        <div className="flex gap-4 mb-2">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={form.displayIncludesUserPricing}
              onChange={(e) => setForm((f) => ({ ...f, displayIncludesUserPricing: e.target.checked }))}
            />
            Sertakan hitungan per user
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={form.displayIncludesEntityPricing}
              onChange={(e) => setForm((f) => ({ ...f, displayIncludesEntityPricing: e.target.checked }))}
            />
            Sertakan hitungan per entitas
          </label>
        </div>
        <div className="flex justify-between text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
          <span className="text-emerald-800">Harga yang akan tampil di website &amp; halaman daftar</span>
          <span className="font-mono font-bold text-emerald-900">Rp {displayPricePreview.toLocaleString("id-ID")}/bulan</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
        <div>
          <label className={labelClass}>Diskon Permanen (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={form.permanentDiscountPercent}
            onChange={(e) => setForm((f) => ({ ...f, permanentDiscountPercent: Number(e.target.value) }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Alasan (wajib jika diskon &gt; 0)</label>
          <input
            value={form.permanentDiscountReason}
            onChange={(e) => setForm((f) => ({ ...f, permanentDiscountReason: e.target.value }))}
            placeholder="Instruksi marketing Q4 2026"
            className={inputClass}
          />
        </div>
      </div>
      <p className="text-[10px] text-slate-400">
        Berbeda dari skema diskon durasi/promo/affiliate — ini markdown tetap pada harga jual paket itu sendiri, selalu aktif,
        dan wajib punya alasan tercatat.
      </p>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3.5 py-2 disabled:opacity-60">
          {saving ? "Menyimpan..." : existing ? "Simpan Perubahan" : "Buat Paket"}
        </button>
        <button type="button" onClick={onClose} className="text-xs font-semibold text-slate-500 px-3 py-2">
          Batal
        </button>
      </div>
    </form>
  );
}

function SchemeEditor({ planId, schemes, onChanged }: { planId: string; schemes: DiscountScheme[]; onChanged: () => void }) {
  const [showNew, setShowNew] = useState(false);
  const [newScheme, setNewScheme] = useState<{ schemeType: DiscountScheme["schemeType"]; label: string; tiers: DiscountTier[] }>({
    schemeType: "duration_months",
    label: "",
    tiers: [{ minValue: 12, discountPercent: 10 }],
  });

  function updateTier(idx: number, field: keyof DiscountTier, value: number) {
    setNewScheme((s) => ({ ...s, tiers: s.tiers.map((t, i) => (i === idx ? { ...t, [field]: value } : t)) }));
  }

  async function createScheme() {
    await api.createScheme(planId, newScheme);
    setShowNew(false);
    setNewScheme({ schemeType: "duration_months", label: "", tiers: [{ minValue: 12, discountPercent: 10 }] });
    onChanged();
  }

  async function toggleActive(s: DiscountScheme) {
    await api.updateScheme(s.id, { isActive: !s.isActive });
    onChanged();
  }

  const typeLabels: Record<DiscountScheme["schemeType"], string> = {
    duration_months: "Durasi (bulan)",
    user_count: "Jumlah User",
    entity_count: "Jumlah Entitas",
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-700">Skema Diskon</h4>
        <button onClick={() => setShowNew((v) => !v)} className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
          {showNew ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />} Skema Baru
        </button>
      </div>

      {schemes.map((s) => (
        <div key={s.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md px-3 py-2 mb-1.5 text-xs">
          <div>
            <span className="font-semibold text-slate-700">{s.label}</span>{" "}
            <span className="text-slate-400">({typeLabels[s.schemeType]})</span>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {s.tiers.map((t) => `≥${t.minValue} → ${t.discountPercent}%`).join(" · ")}
            </div>
          </div>
          <ConfirmButton
            label={s.isActive ? "Aktif" : "Nonaktif"}
            confirmTitle={s.isActive ? "Nonaktifkan Skema Diskon Ini?" : "Aktifkan Skema Diskon Ini?"}
            confirmMessage={
              s.isActive
                ? `Skema "${s.label}" tidak akan lagi dipakai untuk menghitung diskon pendaftar.`
                : `Skema "${s.label}" akan kembali dipakai untuk menghitung diskon pendaftar.`
            }
            danger={s.isActive}
            onConfirm={() => toggleActive(s)}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
              s.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
            }`}
          />
        </div>
      ))}
      {schemes.length === 0 && !showNew && <p className="text-[11px] text-slate-400">Belum ada skema diskon untuk paket ini.</p>}

      {showNew && (
        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newScheme.schemeType}
              onChange={(e) => setNewScheme((s) => ({ ...s, schemeType: e.target.value as DiscountScheme["schemeType"] }))}
              className="text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white"
            >
              <option value="duration_months">Durasi (bulan)</option>
              <option value="user_count">Jumlah User</option>
              <option value="entity_count">Jumlah Entitas</option>
            </select>
            <input
              placeholder="Label (misal: Diskon Tahunan)"
              value={newScheme.label}
              onChange={(e) => setNewScheme((s) => ({ ...s, label: e.target.value }))}
              className="text-xs border border-slate-300 rounded-md px-2 py-1.5"
            />
          </div>
          {newScheme.tiers.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Minimal</span>
              <input
                type="number"
                value={t.minValue}
                onChange={(e) => updateTier(i, "minValue", Number(e.target.value))}
                className="w-20 text-xs border border-slate-300 rounded-md px-2 py-1"
              />
              <span className="text-[11px] text-slate-500">→ diskon</span>
              <input
                type="number"
                value={t.discountPercent}
                onChange={(e) => updateTier(i, "discountPercent", Number(e.target.value))}
                className="w-16 text-xs border border-slate-300 rounded-md px-2 py-1"
              />
              <span className="text-[11px] text-slate-500">%</span>
              {newScheme.tiers.length > 1 && (
                <button type="button" onClick={() => setNewScheme((s) => ({ ...s, tiers: s.tiers.filter((_, idx) => idx !== i) }))}>
                  <Trash2 className="w-3 h-3 text-rose-500" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setNewScheme((s) => ({ ...s, tiers: [...s.tiers, { minValue: 1, discountPercent: 0 }] }))}
            className="text-[11px] font-semibold text-indigo-700"
          >
            + Tambah Tingkatan
          </button>
          <div>
            <button onClick={createScheme} disabled={!newScheme.label.trim()} className="text-xs font-semibold bg-slate-900 text-white rounded-md px-3 py-1.5 disabled:opacity-50">
              Simpan Skema
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanDetailPanel({ planId, onClose }: { planId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<PlanDetail | null>(null);

  async function load() {
    setDetail(await api.getPlanDetail(planId));
  }

  useEffect(() => {
    load();
  }, [planId]);

  if (!detail) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 text-sm">Detail Paket: {detail.plan.name}</h3>
        <button onClick={onClose}>
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
      <table className="w-full text-xs mb-4">
        <thead className="text-slate-500">
          <tr>
            <th className="text-left py-1">Modul</th>
            <th className="text-right py-1">Dasar</th>
            <th className="text-right py-1">Per User × {detail.plan.maxEmployees}</th>
            <th className="text-right py-1">Per Entitas × {detail.plan.maxEntities}</th>
            <th className="text-right py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {detail.perModule.map((m) => (
            <tr key={m.code} className="border-t border-slate-100">
              <td className="py-1.5 text-slate-700">{detail.modules.find((mm) => mm.code === m.code)?.name ?? m.code}</td>
              <td className="py-1.5 text-right font-mono text-slate-500">{m.baseTotal.toLocaleString("id-ID")}</td>
              <td className="py-1.5 text-right font-mono text-slate-500">{m.perUserTotal.toLocaleString("id-ID")}</td>
              <td className="py-1.5 text-right font-mono text-slate-500">{m.perEntityTotal.toLocaleString("id-ID")}</td>
              <td className="py-1.5 text-right font-mono font-semibold text-slate-800">{m.moduleTotal.toLocaleString("id-ID")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <SchemeEditor planId={planId} schemes={detail.schemes} onChanged={load} />
    </div>
  );
}

export function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [catalog, setCatalog] = useState<ModuleCatalogEntry[]>([]);
  const [showForm, setShowForm] = useState<"new" | string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  async function load() {
    setPlans(await api.listPlansAppOwner());
    setCatalog(await api.getModuleCatalog());
  }

  useEffect(() => {
    load();
  }, []);

  const presets = plans.filter((p) => !p.isCustom);
  const customPlans = plans.filter((p) => p.isCustom);
  const editingPlan = typeof showForm === "string" ? presets.find((p) => p.id === showForm) ?? null : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowForm(showForm === "new" ? null : "new")}
          className="text-xs font-semibold flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg px-3 py-2 shrink-0"
        >
          {showForm === "new" ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm === "new" ? "Tutup" : "Paket Baru"}
        </button>
      </div>

      {showForm === "new" && <PlanForm catalog={catalog} existing={null} onSaved={load} onClose={() => setShowForm(null)} />}
      {editingPlan && <PlanForm catalog={catalog} existing={editingPlan} onSaved={load} onClose={() => setShowForm(null)} />}
      {detailId && <PlanDetailPanel planId={detailId} onClose={() => setDetailId(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {presets.map((p) => (
          <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-2">Harga Penuh (Maks. Karyawan &amp; Entitas)</p>
            <p className="text-lg font-extrabold text-indigo-700">
              Rp {p.priceIdr.toLocaleString("id-ID")} <span className="text-xs font-medium text-slate-400">/bulan</span>
            </p>
            {p.permanentDiscountPercent > 0 && (
              <p className="text-[11px] text-rose-600">
                <span className="line-through text-slate-400 mr-1">Rp {p.referenceMonthlyPriceIdr.toLocaleString("id-ID")}</span>
                diskon {p.permanentDiscountPercent}%
              </p>
            )}
            <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mt-2">Harga Tampilan Publik</p>
            <p className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1 mt-0.5">
              Rp {p.displayPriceIdr.toLocaleString("id-ID")} <span className="font-medium text-emerald-600">/bulan</span>
            </p>
            <div className="text-xs text-slate-500 space-y-0.5 mt-2">
              <div>Maks {p.maxEmployees} karyawan</div>
              <div>Maks {p.maxEntities} entitas</div>
              <div>{p.enabledModules.includes("*") ? "Semua modul" : `${p.enabledModules.length} modul`}</div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setDetailId(detailId === p.id ? null : p.id)}
                className="text-[11px] font-semibold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md px-2.5 py-1.5"
              >
                <Eye className="w-3 h-3" /> Detail
              </button>
              <button
                onClick={() => setShowForm(showForm === p.id ? null : p.id)}
                className="text-[11px] font-semibold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md px-2.5 py-1.5"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
            </div>
          </div>
        ))}
        {presets.length === 0 && <div className="text-xs text-slate-400">Belum ada paket siap pakai.</div>}
      </div>

      {customPlans.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-700 mb-2">Paket Custom Tenant (riwayat, bukan template)</h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide">
                <tr>
                  <th className="text-left px-3 py-2">Nama</th>
                  <th className="text-left px-3 py-2">Total Kontrak</th>
                  <th className="text-left px-3 py-2">Durasi</th>
                  <th className="text-left px-3 py-2">Diskon</th>
                </tr>
              </thead>
              <tbody>
                {customPlans.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-700">{p.name}</td>
                    <td className="px-3 py-2 font-mono text-slate-700">Rp {p.priceIdr.toLocaleString("id-ID")}</td>
                    <td className="px-3 py-2 text-slate-500">{Math.round(p.durationDays / 30)} bulan</td>
                    <td className="px-3 py-2 text-slate-500">{p.discountPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

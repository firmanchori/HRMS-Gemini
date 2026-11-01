import React, { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { api, ApiError, type ModuleRow, type Plan, type PricingBreakdown, type SubscriptionTotal } from "./api";
import { PlanDetailModal } from "./PlanDetailModal";

const APP_BASE_DOMAIN = import.meta.env.VITE_APP_BASE_DOMAIN || "localhost:3000";

const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-indigo-600";
const labelClass = "block text-xs font-semibold text-slate-700 mb-1";
const selectAllOnFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

export function RegisterTenantTab({ onCreated }: { onCreated?: () => void } = {}) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [detailPlan, setDetailPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [common, setCommon] = useState({ tenantName: "", subdomain: "", adminName: "", adminEmail: "", adminPassword: "" });
  const [planId, setPlanId] = useState("");
  const [presetMonths, setPresetMonths] = useState(12);
  const [presetUsers, setPresetUsers] = useState(10);
  const [presetEntities, setPresetEntities] = useState(1);
  const [presetEstimate, setPresetEstimate] = useState<SubscriptionTotal | null>(null);
  const [custom, setCustom] = useState({ moduleCodes: [] as string[], maxEntities: 1, maxUsers: 10, durationMonths: 12, discountPercent: 0 });
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);

  useEffect(() => {
    api.getPlans().then((p) => {
      setPlans(p);
      if (p[0]) {
        setPlanId(p[0].id);
        setPresetUsers(Math.min(10, p[0].maxEmployees));
        setPresetEntities(Math.min(1, p[0].maxEntities));
      }
    });
    api.listModules().then(setModules);
  }, []);

  const selectedPlan = plans.find((p) => p.id === planId) ?? null;

  useEffect(() => {
    if (mode !== "custom" || custom.moduleCodes.length === 0) {
      setPricing(null);
      return;
    }
    api.calculatePricing({ ...custom, durationDays: custom.durationMonths * 30 }).then(setPricing).catch(() => setPricing(null));
  }, [mode, custom]);

  useEffect(() => {
    if (mode !== "preset" || !planId) {
      setPresetEstimate(null);
      return;
    }
    api
      .calculateSubscription({ planId, totalMonths: presetMonths, actualUsers: presetUsers, actualEntities: presetEntities })
      .then(setPresetEstimate)
      .catch(() => setPresetEstimate(null));
  }, [mode, planId, presetMonths, presetUsers, presetEntities]);

  function toggleModule(code: string) {
    setCustom((c) => ({
      ...c,
      moduleCodes: c.moduleCodes.includes(code) ? c.moduleCodes.filter((m) => m !== code) : [...c.moduleCodes, code],
    }));
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!common.tenantName) errs.tenantName = "Nama perusahaan wajib diisi.";
    if (!common.subdomain) errs.subdomain = "Subdomain wajib diisi.";
    if (!common.adminName) errs.adminName = "Nama admin wajib diisi.";
    if (!common.adminEmail) errs.adminEmail = "Email admin wajib diisi.";
    if (common.adminPassword.length < 8) errs.adminPassword = "Password minimal 8 karakter.";
    if (mode === "preset") {
      if (selectedPlan && presetUsers > selectedPlan.maxEmployees) errs.presetUsers = `Maksimal ${selectedPlan.maxEmployees} karyawan untuk paket ini.`;
      if (selectedPlan && presetEntities > selectedPlan.maxEntities) errs.presetEntities = `Maksimal ${selectedPlan.maxEntities} entitas untuk paket ini.`;
    } else if (custom.moduleCodes.length === 0) {
      errs.moduleCodes = "Pilih minimal satu modul.";
    }
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
    setLoading(true);
    try {
      const res =
        mode === "preset"
          ? await api.createTenantPreset({ mode: "preset", planId, totalMonths: presetMonths, ...common })
          : await api.createTenantCustom({
              mode: "custom",
              moduleCodes: custom.moduleCodes,
              maxEntities: custom.maxEntities,
              maxUsers: custom.maxUsers,
              durationDays: custom.durationMonths * 30,
              discountPercent: custom.discountPercent,
              ...common,
            });
      setSuccess(`Tenant "${common.tenantName}" (${res.subdomain}) berhasil dibuat & langsung aktif.`);
      onCreated?.();
      setCommon({ tenantName: "", subdomain: "", adminName: "", adminEmail: "", adminPassword: "" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat tenant");
    } finally {
      setLoading(false);
    }
  }

  function FieldError({ field }: { field: string }) {
    return fieldErrors[field] ? <p className="text-[11px] text-rose-600 mt-1">{fieldErrors[field]}</p> : null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {success && (
        <div className="mb-4 flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("preset")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-md ${mode === "preset" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}
        >
          Paket Siap Pakai
        </button>
        <button
          onClick={() => setMode("custom")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-md ${mode === "custom" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}
        >
          Custom (Pilih Modul Sendiri)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        {error && <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-2.5">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Nama Perusahaan</label>
            <input required value={common.tenantName} onChange={(e) => setCommon((c) => ({ ...c, tenantName: e.target.value }))} className={inputClass} />
            <FieldError field="tenantName" />
          </div>
          <div>
            <label className={labelClass}>Subdomain</label>
            <div className="flex items-center rounded-lg border border-slate-300 focus-within:outline focus-within:outline-indigo-600">
              <input
                required
                value={common.subdomain}
                onChange={(e) => setCommon((c) => ({ ...c, subdomain: e.target.value.toLowerCase() }))}
                className="flex-1 py-2 px-3 text-xs font-medium outline-none rounded-l-lg"
                placeholder="namaperusahaan"
              />
              <span className="px-3 text-xs text-slate-400 font-mono">.{APP_BASE_DOMAIN}</span>
            </div>
            <FieldError field="subdomain" />
          </div>
          <div>
            <label className={labelClass}>Nama Admin</label>
            <input required value={common.adminName} onChange={(e) => setCommon((c) => ({ ...c, adminName: e.target.value }))} className={inputClass} />
            <FieldError field="adminName" />
          </div>
          <div>
            <label className={labelClass}>Email Admin</label>
            <input required type="email" value={common.adminEmail} onChange={(e) => setCommon((c) => ({ ...c, adminEmail: e.target.value }))} className={inputClass} />
            <FieldError field="adminEmail" />
          </div>
          <div>
            <label className={labelClass}>Password Admin</label>
            <input required type="password" minLength={8} value={common.adminPassword} onChange={(e) => setCommon((c) => ({ ...c, adminPassword: e.target.value }))} className={inputClass} />
            <FieldError field="adminPassword" />
          </div>
        </div>

        {mode === "preset" ? (
          <div className="space-y-3 border-t border-slate-100 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Paket</label>
                <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={inputClass}>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — Rp {p.displayPriceIdr.toLocaleString("id-ID")}/bulan
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Total Bulan Berlangganan</label>
                <input type="number" min={1} max={120} value={presetMonths} onFocus={selectAllOnFocus} onChange={(e) => setPresetMonths(Number(e.target.value))} className={inputClass} />
              </div>
            </div>

            {selectedPlan && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-semibold text-slate-600">Paket ini mencakup:</p>
                  <button type="button" onClick={() => setDetailPlan(selectedPlan)} className="text-[11px] font-semibold text-indigo-700">
                    Lihat Detail Modul &amp; Harga
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPlan.enabledModules.map((code) => (
                    <span key={code} className="text-[11px] bg-white border border-slate-200 rounded-full px-2.5 py-1 text-slate-700">
                      {modules.find((m) => m.code === code)?.name ?? code}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Jumlah Karyawan</label>
                <input
                  type="number"
                  min={1}
                  max={selectedPlan?.maxEmployees}
                  value={presetUsers}
                  onFocus={selectAllOnFocus}
                  onChange={(e) => setPresetUsers(Number(e.target.value))}
                  className={inputClass}
                />
                {selectedPlan && <p className="text-[10px] text-slate-400 mt-1">Maks. {selectedPlan.maxEmployees} untuk paket ini.</p>}
                <FieldError field="presetUsers" />
              </div>
              <div>
                <label className={labelClass}>Jumlah Entitas/Cabang</label>
                <input
                  type="number"
                  min={1}
                  max={selectedPlan?.maxEntities}
                  value={presetEntities}
                  onFocus={selectAllOnFocus}
                  onChange={(e) => setPresetEntities(Number(e.target.value))}
                  className={inputClass}
                />
                {selectedPlan && <p className="text-[10px] text-slate-400 mt-1">Maks. {selectedPlan.maxEntities} untuk paket ini.</p>}
                <FieldError field="presetEntities" />
              </div>
            </div>

            {presetEstimate && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>
                    Rp {presetEstimate.monthlyPriceIdr.toLocaleString("id-ID")}/bulan × {presetEstimate.totalMonths} bulan
                  </span>
                  <span>Rp {presetEstimate.baseTotalIdr.toLocaleString("id-ID")}</span>
                </div>
                {presetEstimate.appliedDiscountPercent > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>Diskon komitmen durasi ({presetEstimate.appliedDiscountPercent}%)</span>
                    <span>- Rp {presetEstimate.discountAmountIdr.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-indigo-900 text-sm pt-1 border-t border-indigo-200">
                  <span>Estimasi Total</span>
                  <span>Rp {presetEstimate.finalTotalIdr.toLocaleString("id-ID")}</span>
                </div>
                <p className="text-[10px] text-slate-500 pt-1">
                  Hanya referensi — tenant dibuat langsung Aktif tanpa proses pembayaran/verifikasi di jalur ini.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 border-t border-slate-100 pt-3">
            <div>
              <label className={`${labelClass} mb-1.5`}>Pilih Modul</label>
              <div className="grid grid-cols-2 gap-1.5">
                {modules.map((m) => (
                  <label key={m.code} className="flex items-center gap-2 text-xs border border-slate-200 rounded-md px-2.5 py-1.5">
                    <input type="checkbox" checked={custom.moduleCodes.includes(m.code)} onChange={() => toggleModule(m.code)} />
                    {m.name}
                  </label>
                ))}
              </div>
              <FieldError field="moduleCodes" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>Maks. Entitas</label>
                <input
                  type="number"
                  min={1}
                  value={custom.maxEntities}
                  onFocus={selectAllOnFocus}
                  onChange={(e) => setCustom((c) => ({ ...c, maxEntities: Number(e.target.value) }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Maks. User</label>
                <input
                  type="number"
                  min={1}
                  value={custom.maxUsers}
                  onFocus={selectAllOnFocus}
                  onChange={(e) => setCustom((c) => ({ ...c, maxUsers: Number(e.target.value) }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Durasi (bulan)</label>
                <input
                  type="number"
                  min={1}
                  value={custom.durationMonths}
                  onFocus={selectAllOnFocus}
                  onChange={(e) => setCustom((c) => ({ ...c, durationMonths: Number(e.target.value) }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Diskon Manual (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={custom.discountPercent}
                  onFocus={selectAllOnFocus}
                  onChange={(e) => setCustom((c) => ({ ...c, discountPercent: Number(e.target.value) }))}
                  className={inputClass}
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Kode promo/affiliate tidak berlaku di sini — keduanya terikat ke paket siap pakai yang sudah ada, bukan paket custom baru.
            </p>
            {pricing && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between"><span>Subtotal ({pricing.cycles} bulan)</span><span>Rp {pricing.subtotal.toLocaleString("id-ID")}</span></div>
                <div className="flex justify-between text-rose-700"><span>Diskon</span><span>- Rp {pricing.discountAmount.toLocaleString("id-ID")}</span></div>
                <div className="flex justify-between font-bold text-indigo-900 text-sm pt-1 border-t border-indigo-200"><span>Total</span><span>Rp {pricing.finalPriceIdr.toLocaleString("id-ID")}</span></div>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-bold disabled:opacity-60"
        >
          {loading ? "Membuat Tenant..." : "Buat & Aktifkan Tenant"}
        </button>
      </form>

      {detailPlan && <PlanDetailModal plan={detailPlan} onClose={() => setDetailPlan(null)} />}
    </div>
  );
}

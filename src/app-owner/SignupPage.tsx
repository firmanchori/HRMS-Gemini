import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Copy } from "lucide-react";
import { api, ApiError, type Plan, type SubscriptionTotal, type BankAccount } from "./api";

const APP_BASE_DOMAIN = import.meta.env.VITE_APP_BASE_DOMAIN || "localhost:3000";
const STEPS = ["Data Perusahaan", "Paket & Kebutuhan", "Pembayaran"];

export function SignupPage() {
  const [step, setStep] = useState(0);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [moduleNames, setModuleNames] = useState<{ code: string; name: string }[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [form, setForm] = useState({
    tenantName: "",
    subdomain: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    planId: "",
    totalMonths: 12,
    actualUsers: 10,
    actualEntities: 1,
    bankAccountId: "",
    referenceNumber: "",
    note: "",
    promoCode: "",
    affiliateCode: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ subdomain: string } | null>(null);
  const [estimate, setEstimate] = useState<SubscriptionTotal | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  useEffect(() => {
    api.getPlans().then((p) => {
      setPlans(p);
      const preselected = new URLSearchParams(window.location.search).get("plan");
      const chosen = p.find((pl) => pl.id === preselected) ?? p[0];
      if (chosen) setForm((f) => ({ ...f, planId: chosen.id, actualUsers: Math.min(f.actualUsers, chosen.maxEmployees), actualEntities: Math.min(f.actualEntities, chosen.maxEntities) }));
    });
    api.getPublicModules().then(setModuleNames);
    api.getPublicBankAccounts().then((rows) => {
      setBankAccounts(rows);
      if (rows[0]) setForm((f) => ({ ...f, bankAccountId: rows[0].id }));
    });
  }, []);

  const selectedPlan = plans.find((p) => p.id === form.planId) ?? null;
  const selectedBank = bankAccounts.find((b) => b.id === form.bankAccountId) ?? null;

  useEffect(() => {
    if (!form.planId || !form.totalMonths) return;
    const timer = setTimeout(() => {
      api
        .calculateSubscription({
          planId: form.planId,
          totalMonths: form.totalMonths,
          promoCode: form.promoCode || undefined,
          affiliateCode: form.affiliateCode || undefined,
          actualUsers: form.actualUsers,
          actualEntities: form.actualEntities,
        })
        .then((res) => {
          setEstimate(res);
          setEstimateError(null);
        })
        .catch((err) => {
          setEstimate(null);
          setEstimateError(err instanceof ApiError ? err.message : "Gagal menghitung estimasi");
        });
    }, 400); // small debounce so typing a promo code doesn't fire a request per keystroke
    return () => clearTimeout(timer);
  }, [form.planId, form.totalMonths, form.promoCode, form.affiliateCode, form.actualUsers, form.actualEntities]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep(s: number): Record<string, string> {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!form.tenantName) errs.tenantName = "Nama perusahaan wajib diisi.";
      if (!form.subdomain) errs.subdomain = "Subdomain wajib diisi.";
      if (!form.adminName) errs.adminName = "Nama admin wajib diisi.";
      if (!form.adminEmail) errs.adminEmail = "Email admin wajib diisi.";
      if (form.adminPassword.length < 8) errs.adminPassword = "Password minimal 8 karakter.";
    }
    if (s === 1) {
      if (!form.planId) errs.planId = "Pilih paket terlebih dahulu.";
      if (selectedPlan && form.actualUsers > selectedPlan.maxEmployees) errs.actualUsers = `Maksimal ${selectedPlan.maxEmployees} karyawan untuk paket ini.`;
      if (selectedPlan && form.actualEntities > selectedPlan.maxEntities) errs.actualEntities = `Maksimal ${selectedPlan.maxEntities} entitas untuk paket ini.`;
    }
    if (s === 2) {
      if (!form.bankAccountId) errs.bankAccountId = "Pilih rekening tujuan transfer.";
      if (!form.referenceNumber) errs.referenceNumber = "Isi nomor referensi transfer.";
    }
    return errs;
  }

  function goNext() {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setError(null);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function goBack() {
    setError(null);
    setFieldErrors({});
    setStep((s) => Math.max(0, s - 1));
  }

  function cancel() {
    window.location.href = "/";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Enter key submits the nearest <form> regardless of which step is showing —
    // only actually call the API on the last step, otherwise just advance.
    if (step < STEPS.length - 1) return goNext();

    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setError(null);
    setLoading(true);
    try {
      const res = await api.signup({
        ...form,
        promoCode: form.promoCode || undefined,
        affiliateCode: form.affiliateCode || undefined,
      });
      setResult({ subdomain: res.subdomain });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mendaftar, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-center p-8">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <h1 className="font-bold text-slate-900 mb-1">Pendaftaran Diterima</h1>
          <p className="text-sm text-slate-600 mb-3">
            Alamat tenant Anda: <br />
            <span className="font-mono text-indigo-700">{result.subdomain}.{APP_BASE_DOMAIN}</span>
          </p>
          <p className="text-xs text-slate-500 mb-5">
            Cek email Anda — akun akan aktif setelah pembayaran diverifikasi oleh tim kami.
          </p>
          <a href="/" className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 text-sm font-bold">
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  const inputClass = "w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1";
  const selectAllOnFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();
  function FieldError({ field }: { field: string }) {
    return fieldErrors[field] ? <p className="text-[11px] text-rose-600 mt-1">{fieldErrors[field]}</p> : null;
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 p-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 bg-slate-900 text-white border-b border-slate-800">
          <h1 className="font-extrabold text-base">Daftarkan Perusahaan Anda</h1>
          <div className="flex items-center gap-2 mt-3">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    i <= step ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-[11px] font-semibold ${i <= step ? "text-white" : "text-slate-500"}`}>{label}</span>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-slate-700" />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-3.5 min-h-[360px]">
          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 0 && (
            <>
              <div>
                <label className={labelClass}>Nama Perusahaan</label>
                <input required value={form.tenantName} onChange={(e) => update("tenantName", e.target.value)} className={inputClass} placeholder="PT Contoh Sejahtera" />
                <FieldError field="tenantName" />
              </div>
              <div>
                <label className={labelClass}>Subdomain</label>
                <div className="flex items-center rounded-md border border-slate-300 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
                  <input
                    required
                    value={form.subdomain}
                    onChange={(e) => update("subdomain", e.target.value.toLowerCase())}
                    className="flex-1 py-2 px-3 text-sm outline-none rounded-l-md"
                    placeholder="namaperusahaan"
                  />
                  <span className="px-3 text-xs text-slate-400 font-mono">.{APP_BASE_DOMAIN}</span>
                </div>
                <FieldError field="subdomain" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Nama Admin</label>
                  <input required value={form.adminName} onChange={(e) => update("adminName", e.target.value)} className={inputClass} />
                  <FieldError field="adminName" />
                </div>
                <div>
                  <label className={labelClass}>Email Admin</label>
                  <input required type="email" value={form.adminEmail} onChange={(e) => update("adminEmail", e.target.value)} className={inputClass} />
                  <FieldError field="adminEmail" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Password Admin (min. 8 karakter)</label>
                <input required type="password" minLength={8} value={form.adminPassword} onChange={(e) => update("adminPassword", e.target.value)} className={inputClass} />
                <FieldError field="adminPassword" />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Paket</label>
                  <select value={form.planId} onChange={(e) => update("planId", e.target.value)} className={inputClass}>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — mulai Rp {p.displayPriceIdr.toLocaleString("id-ID")}/bulan
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Total Bulan Berlangganan</label>
                  <input required type="number" min={1} max={120} value={form.totalMonths} onFocus={selectAllOnFocus} onChange={(e) => update("totalMonths", Number(e.target.value))} className={inputClass} />
                </div>
              </div>

              {selectedPlan && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-slate-600 mb-1.5">Paket ini mencakup:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPlan.enabledModules.map((code) => (
                      <span key={code} className="text-[11px] bg-white border border-slate-200 rounded-full px-2.5 py-1 text-slate-700">
                        {moduleNames.find((m) => m.code === code)?.name ?? code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Jumlah Karyawan Saat Ini</label>
                  <input required type="number" min={1} max={selectedPlan?.maxEmployees} value={form.actualUsers} onFocus={selectAllOnFocus} onChange={(e) => update("actualUsers", Number(e.target.value))} className={inputClass} />
                  {selectedPlan && <p className="text-[10px] text-slate-400 mt-1">Maks. {selectedPlan.maxEmployees} karyawan untuk paket ini.</p>}
                  <FieldError field="actualUsers" />
                </div>
                <div>
                  <label className={labelClass}>Jumlah Entitas/Cabang</label>
                  <input required type="number" min={1} max={selectedPlan?.maxEntities} value={form.actualEntities} onFocus={selectAllOnFocus} onChange={(e) => update("actualEntities", Number(e.target.value))} className={inputClass} />
                  {selectedPlan && <p className="text-[10px] text-slate-400 mt-1">Maks. {selectedPlan.maxEntities} entitas untuk paket ini.</p>}
                  <FieldError field="actualEntities" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 -mt-1">Harga final Anda mengikuti jumlah karyawan &amp; entitas di atas.</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Kode Promo (opsional)</label>
                  <input value={form.promoCode} onChange={(e) => update("promoCode", e.target.value.toUpperCase())} placeholder="HEMAT15" className={`${inputClass} font-mono uppercase`} />
                </div>
                <div>
                  <label className={labelClass}>Kode Affiliate (opsional)</label>
                  <input value={form.affiliateCode} onChange={(e) => update("affiliateCode", e.target.value.toUpperCase())} placeholder="MITRA01" className={`${inputClass} font-mono uppercase`} />
                </div>
              </div>

              {estimateError && <p className="text-[11px] text-rose-600">{estimateError}</p>}
              {estimate && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>
                      Rp {estimate.monthlyPriceIdr.toLocaleString("id-ID")}/bulan × {estimate.totalMonths} bulan
                    </span>
                    <span>Rp {estimate.baseTotalIdr.toLocaleString("id-ID")}</span>
                  </div>
                  {estimate.appliedDiscountPercent > 0 && (
                    <div className="flex justify-between text-rose-700">
                      <span>Diskon terbaik yang berlaku ({estimate.appliedDiscountPercent}%)</span>
                      <span>- Rp {estimate.discountAmountIdr.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-indigo-900 text-sm pt-1 border-t border-indigo-200">
                    <span>Total yang Harus Ditransfer</span>
                    <span>Rp {estimate.finalTotalIdr.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Transfer ke Salah Satu Rekening Berikut</p>
                <div className="space-y-2">
                  {bankAccounts.map((b) => (
                    <label
                      key={b.id}
                      className={`flex items-center justify-between border rounded-lg px-3 py-2.5 cursor-pointer ${
                        form.bankAccountId === b.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input type="radio" name="bankAccountId" checked={form.bankAccountId === b.id} onChange={() => update("bankAccountId", b.id)} />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{b.bankName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{b.accountNumber} — a.n. {b.accountHolderName}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          navigator.clipboard?.writeText(b.accountNumber);
                        }}
                        className="text-slate-400 hover:text-indigo-600"
                        title="Salin nomor rekening"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </label>
                  ))}
                  {bankAccounts.length === 0 && <p className="text-xs text-slate-400">Belum ada rekening tujuan tersedia, hubungi tim kami.</p>}
                </div>
                <FieldError field="bankAccountId" />
              </div>

              {estimate && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs flex justify-between font-bold text-indigo-900">
                  <span>Total yang Harus Ditransfer</span>
                  <span>Rp {estimate.finalTotalIdr.toLocaleString("id-ID")}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>No. Referensi Transfer Anda</label>
                  <input required value={form.referenceNumber} onChange={(e) => update("referenceNumber", e.target.value)} className={inputClass} placeholder="Nomor transaksi dari bukti transfer Anda" />
                  <FieldError field="referenceNumber" />
                </div>
                <div>
                  <label className={labelClass}>Catatan (opsional)</label>
                  <input value={form.note} onChange={(e) => update("note", e.target.value)} className={inputClass} />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Setelah mengisi nomor referensi, tim kami akan memverifikasi transfer Anda ke rekening {selectedBank?.bankName ?? "yang dipilih"} dan mengaktifkan akun Anda.
              </p>
            </>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button type="button" onClick={cancel} className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-3 py-2">
              Batal
            </button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button type="button" onClick={goBack} className="text-xs font-semibold text-slate-600 border border-slate-300 rounded-md px-4 py-2 flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={goNext} className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-2 flex items-center gap-1.5">
                  Lanjut <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-2 flex items-center gap-1.5 disabled:opacity-60">
                  {loading ? "Mendaftarkan..." : <>Daftar Sekarang <ArrowRight className="w-3.5 h-3.5" /></>}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

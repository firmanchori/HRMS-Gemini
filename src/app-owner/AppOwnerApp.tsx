import React, { useEffect, useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Building2,
  UserPlus,
  BadgeCheck,
  Package,
  Tag,
  Inbox as InboxIcon,
  Settings as SettingsIcon,
  ScrollText,
  LayoutDashboard,
  LogOut,
  X,
  ExternalLink,
} from "lucide-react";
import { ScrollableTabNav } from "../components/common/ScrollableTabNav";
import { api, ApiError, type Me, type TenantRow, type Inquiry, type AuditLogRow, type Plan, type BankAccount, type PlanChangePreview, type PlanChangeDirection } from "./api";
import { DashboardTab } from "./DashboardTab";
import { PaymentVerificationTab } from "./PaymentVerificationTab";
import { ModulesTab } from "./ModulesTab";
import { PlansTab } from "./PlansTab";
import { PromotionsTab } from "./PromotionsTab";
import { AffiliatesTab } from "./AffiliatesTab";
import { RegisterTenantTab } from "./RegisterTenantTab";
import { SettingsTab } from "./SettingsTab";
import { ConfirmButton } from "./ConfirmButton";

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
        Jika email itu terdaftar, tautan reset password sudah dikirim. Cek kotak masuk Anda.
        <button onClick={onBack} className="block mt-2 text-indigo-600 font-semibold">
          Kembali ke halaman masuk
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs text-slate-500">Masukkan email Anda, kami kirim tautan untuk mengatur ulang password.</p>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@perusahaan.com"
        className="w-full rounded-md border border-slate-300 py-2 px-3 text-xs focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold disabled:opacity-60"
      >
        {loading ? "Mengirim..." : "Kirim Tautan Reset"}
      </button>
      <button type="button" onClick={onBack} className="w-full text-xs text-slate-500">
        Batal
      </button>
    </form>
  );
}

function LoginView({ onLoggedIn }: { onLoggedIn: (me: Me) => void }) {
  const [email, setEmail] = useState("owner@nusahr.local");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const me = await api.login(email, password);
      onLoggedIn(me);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Gagal masuk, coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-slate-950 p-4 sm:p-6 text-slate-100 font-sans select-none relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 relative z-10 animate-fadeIn">
        <div className="px-6 py-6 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-700 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
                N
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight leading-none text-white">NusaHR Enterprise</h1>
              </div>
            </div>
            <span className="text-[10px] bg-slate-800 text-blue-300 px-2.5 py-0.8 rounded-full font-mono border border-slate-700">
              v2026.1
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {showForgot ? (
            <ForgotPasswordForm onBack={() => setShowForgot(false)} />
          ) : (
          <>
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Gagal Masuk:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-md shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Kata Sandi <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-md shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-9 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="w-full text-center text-[11px] text-indigo-600 hover:underline"
            >
              Lupa Sandi?
            </button>
          </form>
          </>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>ISO 27001 Certified Security</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">256-Bit SSL/TLS</span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TenantRow["status"] }) {
  const styles: Record<TenantRow["status"], string> = {
    PendingPayment: "bg-amber-50 text-amber-700 border-amber-200",
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Suspended: "bg-rose-50 text-rose-700 border-rose-200",
    Expired: "bg-slate-100 text-slate-600 border-slate-200",
    Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  };
  const labels: Record<TenantRow["status"], string> = {
    PendingPayment: "Menunggu Pembayaran",
    Active: "Aktif",
    Suspended: "Ditangguhkan",
    Expired: "Kedaluwarsa",
    Cancelled: "Dibatalkan",
  };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${styles[status]}`}>{labels[status]}</span>;
}

const APP_BASE_DOMAIN = import.meta.env.VITE_APP_BASE_DOMAIN || "localhost:3000";

function PlanChangeSection({ tenant, onChanged }: { tenant: TenantRow; onChanged: () => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [bankAccountsList, setBankAccountsList] = useState<BankAccount[]>([]);
  const [planId, setPlanId] = useState("");
  const [actualUsers, setActualUsers] = useState(10);
  const [actualEntities, setActualEntities] = useState(1);
  const [bankAccountId, setBankAccountId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [preview, setPreview] = useState<PlanChangePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api.listPlansAppOwner().then((rows) => {
      const presets = rows.filter((p) => !p.isCustom);
      setPlans(presets);
      if (presets[0]) setPlanId(presets[0].id);
    });
    api.getPublicBankAccounts().then((rows) => {
      setBankAccountsList(rows);
      if (rows[0]) setBankAccountId(rows[0].id);
    });
  }, []);

  const selectedPlan = plans.find((p) => p.id === planId) ?? null;

  useEffect(() => {
    if (!planId) return;
    const timer = setTimeout(() => {
      api
        .previewPlanChange(tenant.id, { planId, actualUsers, actualEntities })
        .then((res) => {
          setPreview(res);
          setPreviewError(null);
        })
        .catch((err) => {
          setPreview(null);
          setPreviewError(err instanceof ApiError ? err.message : "Gagal menghitung perubahan paket");
        });
    }, 350);
    return () => clearTimeout(timer);
  }, [tenant.id, planId, actualUsers, actualEntities]);

  async function apply() {
    setNotice(null);
    await api.changeTenantPlan(tenant.id, {
      planId,
      actualUsers,
      actualEntities,
      bankAccountId: preview?.direction === "upgrade" ? bankAccountId : undefined,
      referenceNumber: preview?.direction === "upgrade" ? referenceNumber : undefined,
    });
    setNotice(
      preview?.direction === "downgrade"
        ? `Paket diubah. Kredit Rp ${preview.proratedAmountIdr.toLocaleString("id-ID")} tercatat untuk ${tenant.name}.`
        : `Paket diubah ke ${selectedPlan?.name}.`
    );
    onChanged();
  }

  const directionLabel: Record<PlanChangeDirection, string> = { upgrade: "Upgrade", downgrade: "Downgrade", same: "Tidak berubah" };

  return (
    <div className="border-t border-slate-100 pt-3">
      <p className="text-xs font-semibold text-slate-700 mb-2">Ubah Paket</p>
      {notice && <div className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg p-2.5 mb-2">{notice}</div>}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium focus:outline-indigo-600">
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div />
        <div>
          <input
            type="number"
            min={1}
            max={selectedPlan?.maxEmployees}
            value={actualUsers}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setActualUsers(Number(e.target.value))}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium focus:outline-indigo-600"
            placeholder="Jumlah karyawan"
          />
          {selectedPlan && <p className="text-[10px] text-slate-400 mt-1">Maks. {selectedPlan.maxEmployees} karyawan.</p>}
        </div>
        <div>
          <input
            type="number"
            min={1}
            max={selectedPlan?.maxEntities}
            value={actualEntities}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setActualEntities(Number(e.target.value))}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium focus:outline-indigo-600"
            placeholder="Jumlah entitas"
          />
          {selectedPlan && <p className="text-[10px] text-slate-400 mt-1">Maks. {selectedPlan.maxEntities} entitas.</p>}
        </div>
      </div>

      {previewError && <p className="text-[11px] text-rose-600 mb-2">{previewError}</p>}
      {preview && preview.direction !== "same" && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1 mb-2">
          <div className="flex justify-between">
            <span>Harga lama</span>
            <span>Rp {preview.oldMonthlyPriceIdr.toLocaleString("id-ID")}/bulan</span>
          </div>
          <div className="flex justify-between">
            <span>Harga baru</span>
            <span>Rp {preview.newMonthlyPriceIdr.toLocaleString("id-ID")}/bulan</span>
          </div>
          <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
            <span>{directionLabel[preview.direction]} — sisa {preview.remainingDays} hari siklus ini</span>
            <span className={preview.direction === "upgrade" ? "text-rose-700" : "text-emerald-700"}>
              {preview.direction === "upgrade" ? "Tagihan tambahan" : "Kredit"}: Rp {preview.proratedAmountIdr.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      )}

      {preview?.direction === "upgrade" && (
        <div className="space-y-2 mb-2">
          <p className="text-[11px] text-slate-500">
            Ada biaya tambahan untuk upgrade ini — isi bukti transfer yang sudah diterima dari tenant.
          </p>
          <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium focus:outline-indigo-600">
            {bankAccountsList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bankName} — {b.accountNumber}
              </option>
            ))}
          </select>
          <input
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="Nomor referensi transfer"
            className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium focus:outline-indigo-600"
          />
        </div>
      )}

      <ConfirmButton
        disabled={!preview || preview.direction === "same" || (preview.direction === "upgrade" && (!bankAccountId || !referenceNumber))}
        label="Terapkan Perubahan Paket"
        confirmTitle={`${preview ? directionLabel[preview.direction] : ""} Paket Tenant Ini?`}
        confirmMessage={
          preview?.direction === "upgrade"
            ? `${tenant.name} akan langsung pindah ke paket ${selectedPlan?.name}. Tagihan tambahan Rp ${preview.proratedAmountIdr.toLocaleString("id-ID")} akan tercatat sebagai sudah dibayar sesuai bukti transfer ini.`
            : `${tenant.name} akan langsung pindah ke paket ${selectedPlan?.name}. Kredit Rp ${preview?.proratedAmountIdr.toLocaleString("id-ID")} akan tercatat untuk tenant ini.`
        }
        onConfirm={apply}
        className="text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md px-3 py-1.5 disabled:opacity-60"
      />
    </div>
  );
}

function TenantDetailModal({ tenant, onClose, onChanged }: { tenant: TenantRow; onClose: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");

  async function run(action: () => Promise<unknown>, successMsg: string) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      setNotice(successMsg);
      onChanged();
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  async function submitEmailChange() {
    await run(() => api.changeAdminEmail(tenant.id, newEmail), `Email admin ${tenant.name} diubah ke ${newEmail}.`);
    setNewEmail("");
  }

  return (
    <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">{tenant.name}</h3>
            <a
              href={`//${tenant.subdomain}.${APP_BASE_DOMAIN}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-indigo-300 hover:text-indigo-200 flex items-center gap-1 mt-0.5"
            >
              {tenant.subdomain}.{APP_BASE_DOMAIN} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {notice && <div className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg p-2.5">{notice}</div>}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Status</span>
              <StatusBadge status={tenant.status} />
            </div>
            <div>
              <span className="text-slate-400 block">Paket</span>
              <span className="font-semibold text-slate-700">{tenant.planName ?? "-"}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Berlaku Sampai</span>
              <span className="font-semibold text-slate-700">{tenant.expiresAt ? new Date(tenant.expiresAt).toLocaleDateString("id-ID") : "-"}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Jumlah User</span>
              <span className="font-semibold text-slate-700">{tenant.userCount}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-700 mb-2">Status Tenant</p>
            <div className="flex gap-1.5 flex-wrap">
              {tenant.status === "PendingPayment" && (
                <ConfirmButton
                  disabled={busy}
                  label="Aktifkan"
                  confirmTitle="Aktifkan Tenant Ini?"
                  confirmMessage={`${tenant.name} akan diaktifkan dan admin tenant bisa langsung masuk ke sistem.`}
                  onConfirm={() => run(() => api.activateTenant(tenant.id), `${tenant.name} diaktifkan.`)}
                  className="text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-2.5 py-1.5 disabled:opacity-60"
                />
              )}
              {tenant.status === "Active" && (
                <>
                  <ConfirmButton
                    disabled={busy}
                    label="Perpanjang 30 Hari"
                    confirmTitle="Perpanjang Masa Aktif?"
                    confirmMessage={`Masa aktif ${tenant.name} akan ditambah 30 hari dari tanggal berakhirnya saat ini.`}
                    onConfirm={() => run(() => api.extendTenant(tenant.id, 30), `${tenant.name} diperpanjang 30 hari.`)}
                    className="text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-2.5 py-1.5 disabled:opacity-60"
                  />
                  <ConfirmButton
                    disabled={busy}
                    label="Tangguhkan"
                    confirmTitle="Tangguhkan Tenant Ini?"
                    confirmMessage={`${tenant.name} tidak akan bisa mengakses sistem sampai Anda mengaktifkannya kembali.`}
                    confirmLabel="Ya, Tangguhkan"
                    danger
                    onConfirm={() => run(() => api.suspendTenant(tenant.id), `${tenant.name} ditangguhkan.`)}
                    className="text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md px-2.5 py-1.5 disabled:opacity-60"
                  />
                </>
              )}
              {tenant.status === "Suspended" && (
                <ConfirmButton
                  disabled={busy}
                  label="Aktifkan Kembali"
                  confirmTitle="Aktifkan Kembali Tenant Ini?"
                  confirmMessage={`${tenant.name} akan bisa mengakses sistem kembali seperti biasa.`}
                  onConfirm={() => run(() => api.reactivateTenant(tenant.id), `${tenant.name} diaktifkan kembali.`)}
                  className="text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-2.5 py-1.5 disabled:opacity-60"
                />
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-700 mb-2">Akun Admin Tenant</p>
            <ConfirmButton
              disabled={busy}
              label="Reset Password Admin"
              confirmTitle="Kirim Email Reset Password?"
              confirmMessage={`Admin tenant ${tenant.name} akan menerima email untuk mengatur ulang password mereka.`}
              onConfirm={() => run(() => api.resetAdminPassword(tenant.id), `Email reset password dikirim ke admin ${tenant.name}.`)}
              className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md px-2.5 py-1.5 disabled:opacity-60 mb-3"
            />
            <div className="flex items-start gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email admin baru"
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium focus:outline-indigo-600"
              />
              <ConfirmButton
                disabled={busy || !newEmail}
                label="Ubah Email"
                confirmTitle="Ubah Email Admin?"
                confirmMessage={`Email login admin ${tenant.name} akan diubah menjadi "${newEmail}". Admin lama tidak lagi bisa masuk dengan email sebelumnya.`}
                onConfirm={submitEmailChange}
                className="text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md px-2.5 py-1.5 disabled:opacity-60 shrink-0"
              />
            </div>
          </div>

          <PlanChangeSection tenant={tenant} onChanged={onChanged} />
        </div>
      </div>
    </div>
  );
}

function TenantsTab() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [detailTenant, setDetailTenant] = useState<TenantRow | null>(null);

  async function load() {
    const rows = await api.listTenants();
    setTenants(rows);
    if (detailTenant) setDetailTenant(rows.find((t) => t.id === detailTenant.id) ?? null);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Tenant</th>
              <th className="text-left px-4 py-2.5 font-semibold">Subdomain</th>
              <th className="text-left px-4 py-2.5 font-semibold">Paket</th>
              <th className="text-left px-4 py-2.5 font-semibold">Status</th>
              <th className="text-left px-4 py-2.5 font-semibold">Berlaku Sampai</th>
              <th className="text-left px-4 py-2.5 font-semibold">User</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} onClick={() => setDetailTenant(t)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-2.5 font-semibold text-slate-800">{t.name}</td>
                <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">
                  <a
                    href={`//${t.subdomain}.${APP_BASE_DOMAIN}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 hover:text-indigo-600"
                  >
                    {t.subdomain} <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
                <td className="px-4 py-2.5 text-slate-500">{t.planName ?? "-"}</td>
                <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-2.5 text-slate-500">
                  {t.expiresAt ? new Date(t.expiresAt).toLocaleDateString("id-ID") : "-"}
                </td>
                <td className="px-4 py-2.5 text-slate-500">{t.userCount}</td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                  Belum ada tenant terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detailTenant && <TenantDetailModal tenant={detailTenant} onClose={() => setDetailTenant(null)} onChanged={load} />}
    </div>
  );
}

function InboxTab() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof api.getInquiry>> | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    setInquiries(await api.listInbox());
  }

  useEffect(() => {
    load();
  }, []);

  async function openInquiry(id: string) {
    setSelected(id);
    setDetail(await api.getInquiry(id));
  }

  async function sendReply() {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      await api.replyInquiry(selected, replyText);
      setReplyText("");
      await openInquiry(selected);
      await load();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs md:col-span-1">
        {inquiries.map((i) => (
          <button
            key={i.id}
            onClick={() => openInquiry(i.id)}
            className={`w-full text-left px-3 py-2.5 border-b border-slate-100 text-sm ${
              selected === i.id ? "bg-indigo-50" : "hover:bg-slate-50"
            }`}
          >
            <div className="font-semibold text-slate-800">{i.subject}</div>
            <div className="text-[11px] text-slate-500">
              {i.name} &middot; {i.status}
            </div>
          </button>
        ))}
        {inquiries.length === 0 && <div className="p-4 text-xs text-slate-400">Belum ada pertanyaan.</div>}
      </div>
      <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs md:col-span-2">
        {!detail && <div className="text-xs text-slate-400">Pilih pertanyaan di sebelah kiri.</div>}
        {detail && (
          <div>
            <div className="text-sm font-bold text-slate-800">{detail.subject}</div>
            <div className="text-[11px] text-slate-500 mb-3">
              {detail.name} ({detail.email})
            </div>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 mb-3">{detail.message}</p>
            {detail.replies.map((r) => (
              <p key={r.id} className="text-sm text-slate-700 bg-indigo-50 rounded-lg p-3 mb-2">
                {r.body}
              </p>
            ))}
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tulis balasan..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm mt-2 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              rows={3}
            />
            <button
              onClick={sendReply}
              disabled={sending || !replyText.trim()}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1.5 text-xs font-bold disabled:opacity-60"
            >
              {sending ? "Mengirim..." : "Kirim Balasan"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditLogTab() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);

  useEffect(() => {
    api.getAuditLog().then(setRows);
  }, []);

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide">
          <tr>
            <th className="text-left px-3 py-2.5">Waktu</th>
            <th className="text-left px-3 py-2.5">Aksi</th>
            <th className="text-left px-3 py-2.5">Tenant</th>
            <th className="text-left px-3 py-2.5">Oleh</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="px-3 py-2 text-slate-500 text-xs">{new Date(r.createdAt).toLocaleString("id-ID")}</td>
              <td className="px-3 py-2 font-mono text-xs text-indigo-700">{r.action}</td>
              <td className="px-3 py-2 text-xs text-slate-600">{r.tenantName ?? "-"}</td>
              <td className="px-3 py-2 text-xs text-slate-600">{r.actorName ?? "Sistem"}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-400">
                Belum ada aktivitas tercatat.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

type TabKey =
  | "dashboard"
  | "tenants"
  | "register"
  | "verifications"
  | "modules"
  | "plans"
  | "promotions"
  | "affiliates"
  | "inbox"
  | "settings"
  | "audit";

export function AppOwnerApp() {
  const [me, setMe] = useState<Me | null>(null);
  const [tab, setTab] = useState<TabKey>("dashboard");

  if (!me) return <LoginView onLoggedIn={setMe} />;

  const TABS: { key: TabKey; label: string; icon: typeof Building2 }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "tenants", label: "Tenant", icon: Building2 },
    { key: "register", label: "Daftarkan Tenant", icon: UserPlus },
    { key: "verifications", label: "Verifikasi Pembayaran", icon: BadgeCheck },
    { key: "plans", label: "Kelola Paket", icon: Package },
    { key: "modules", label: "Modul & Harga", icon: SettingsIcon },
    { key: "promotions", label: "Promo & Diskon", icon: Tag },
    { key: "affiliates", label: "Affiliate", icon: UserPlus },
    { key: "inbox", label: "Inbox", icon: InboxIcon },
    { key: "settings", label: "Pengaturan Email", icon: Mail },
    { key: "audit", label: "Log Aktivitas", icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Matches the real app's top bar exactly (src/components/layout/Header.tsx): h-14, white, bottom border — not a dark banner (that's only for the pre-login screen). */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
            N
          </div>
          <h1 className="text-sm font-bold text-slate-900 truncate">App Owner</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-500 hidden sm:inline">{me.name}</span>
          <button
            onClick={async () => {
              await api.logout();
              setMe(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      <div className="px-4 sm:px-6 pt-4">
        <ScrollableTabNav activeKey={tab}>
          {TABS.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`pb-3 pt-2 px-3 text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 border-b-2 -mb-px whitespace-nowrap ${
                tab === item.key
                  ? "border-slate-900 text-slate-950 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </ScrollableTabNav>
      </div>

      <main className="p-4 sm:p-6">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "tenants" && <TenantsTab />}
        {tab === "register" && <RegisterTenantTab />}
        {tab === "verifications" && <PaymentVerificationTab />}
        {tab === "plans" && <PlansTab />}
        {tab === "modules" && <ModulesTab />}
        {tab === "promotions" && <PromotionsTab />}
        {tab === "affiliates" && <AffiliatesTab />}
        {tab === "inbox" && <InboxTab />}
        {tab === "settings" && <SettingsTab />}
        {tab === "audit" && <AuditLogTab />}
      </main>
    </div>
  );
}

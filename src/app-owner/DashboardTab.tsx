import React, { useEffect, useState } from "react";
import { Building2, Users, Wallet, Inbox as InboxIcon, Clock } from "lucide-react";
import { api, type DashboardSummary } from "./api";

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof Building2; label: string; value: string; tone: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${tone}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xl font-extrabold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

export function DashboardTab() {
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api.getDashboard().then(setData);
  }, []);

  if (!data) return <div className="text-xs text-slate-400">Memuat ringkasan...</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <StatCard icon={Building2} label="Total Tenant" value={data.tenants.total} tone="bg-slate-100 text-slate-700" />
      <StatCard icon={Building2} label="Tenant Aktif" value={data.tenants.active} tone="bg-emerald-100 text-emerald-700" />
      <StatCard icon={Clock} label="Menunggu Bayar" value={data.tenants.pendingPayment} tone="bg-amber-100 text-amber-700" />
      <StatCard icon={Building2} label="Ditangguhkan" value={data.tenants.suspended} tone="bg-rose-100 text-rose-700" />
      <StatCard icon={Users} label="Admin Tenant" value={data.tenantAdminUsers} tone="bg-indigo-100 text-indigo-700" />
      <StatCard
        icon={Wallet}
        label="Est. Revenue/Bulan"
        value={`Rp ${Number(data.estimatedMonthlyRevenueIdr).toLocaleString("id-ID")}`}
        tone="bg-blue-100 text-blue-700"
      />
      <StatCard icon={Clock} label="Verifikasi Tertunda" value={data.pendingPaymentVerifications} tone="bg-amber-100 text-amber-700" />
      <StatCard icon={InboxIcon} label="Pesan Baru" value={data.newContactInquiries} tone="bg-indigo-100 text-indigo-700" />
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { api, type Plan } from "./api";
import { PlanDetailModal } from "./PlanDetailModal";

export function PublicWebsite() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [moduleNames, setModuleNames] = useState<{ code: string; name: string }[]>([]);
  const [detailPlan, setDetailPlan] = useState<Plan | null>(null);

  useEffect(() => {
    api.getPlans().then(setPlans);
    api.getPublicModules().then(setModuleNames);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white text-slate-900">
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 sm:px-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm">N</div>
          <span className="font-extrabold text-sm tracking-tight">NusaHR Enterprise</span>
        </div>
        <nav className="flex items-center gap-5 text-sm font-semibold text-slate-600">
          <a href="#paket" className="hover:text-slate-900">Paket</a>
          <a href="/contact" className="hover:text-slate-900">Hubungi Kami</a>
          <a
            href="/signup"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-2 text-sm font-bold flex items-center gap-1.5"
          >
            Daftar Sekarang <ArrowRight className="w-4 h-4" />
          </a>
        </nav>
      </header>

      <section className="px-6 sm:px-10 py-16 sm:py-24 max-w-5xl mx-auto text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Kelola HR Perusahaan Anda dalam Satu Sistem
        </h1>
        <p className="mt-4 text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
          Absensi, payroll, cuti, SPPD, hingga aset perusahaan — satu platform untuk seluruh tim HR &amp; GA Anda.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-3 text-sm font-bold flex items-center gap-2">
            Mulai Sekarang <ArrowRight className="w-4 h-4" />
          </a>
          <a href="/contact" className="border border-slate-300 hover:bg-slate-50 rounded-lg px-6 py-3 text-sm font-bold text-slate-700">
            Hubungi Tim Kami
          </a>
        </div>
      </section>

      <section id="paket" className="px-6 sm:px-10 py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-center text-slate-900 mb-2">Pilih Paket yang Sesuai</h2>
          <p className="text-center text-slate-500 text-sm mb-10">Harga akan disesuaikan dengan jumlah karyawan &amp; entitas Anda saat mendaftar.</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {plans.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col">
                <h3 className="font-bold text-lg text-slate-900">{p.name}</h3>
                <p className="mt-1 text-2xl font-extrabold text-indigo-700">
                  Rp {p.displayPriceIdr.toLocaleString("id-ID")}
                  <span className="text-sm font-semibold text-slate-400">/bulan</span>
                </p>
                <p className="text-xs text-slate-400 mb-4">Harga final mengikuti jumlah karyawan &amp; entitas perusahaan Anda.</p>
                <ul className="space-y-1.5 text-sm text-slate-600 flex-1">
                  {p.enabledModules.map((code) => (
                    <li key={code} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {moduleNames.find((m) => m.code === code)?.name ?? code}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailPlan(p)}
                    className="text-center border border-slate-300 hover:bg-slate-50 rounded-lg py-2.5 text-sm font-bold text-slate-700"
                  >
                    Lihat Detail Modul &amp; Fitur
                  </button>
                  <a
                    href={`/signup?plan=${p.id}`}
                    className="text-center bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2.5 text-sm font-bold"
                  >
                    Pilih Paket Ini
                  </a>
                </div>
              </div>
            ))}
            {plans.length === 0 && <p className="text-sm text-slate-400 col-span-3 text-center py-8">Belum ada paket tersedia saat ini.</p>}
          </div>
        </div>
      </section>

      <footer className="px-6 sm:px-10 py-8 border-t border-slate-200 text-xs text-slate-400">
        <span>&copy; {new Date().getFullYear()} NusaHR Enterprise</span>
      </footer>

      {detailPlan && (
        <PlanDetailModal
          plan={detailPlan}
          onClose={() => setDetailPlan(null)}
          footer={
            <a href={`/signup?plan=${detailPlan.id}`} className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 text-sm font-bold">
              Pilih Paket Ini
            </a>
          }
        />
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { api, type Plan, type ModuleFeatureEntry } from "./api";

/**
 * Full module+feature(+marketing description) breakdown for a plan — shared
 * by the public website, the signup flow, and App Owner's "Daftarkan
 * Tenant" so every surface shows the exact same detail ("Standar juga
 * sama"). `footer` lets each caller swap the bottom action (signup CTA on
 * the public site vs. nothing extra inside the admin flow, since it's
 * already mid-form there).
 */
export function PlanDetailModal({ plan, onClose, footer }: { plan: Plan; onClose: () => void; footer?: React.ReactNode }) {
  const [features, setFeatures] = useState<ModuleFeatureEntry[] | null>(null);

  useEffect(() => {
    setFeatures(null);
    api.getPlanFeatures(plan.id).then(setFeatures);
  }, [plan.id]);

  return (
    <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between sticky top-0">
          <div>
            <h3 className="font-extrabold text-lg">{plan.name}</h3>
            <p className="text-sm text-slate-300 mt-0.5">
              Rp {plan.displayPriceIdr.toLocaleString("id-ID")}<span className="text-xs text-slate-400">/bulan, mulai dari</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">Rincian seluruh modul dan fitur di dalamnya pada paket ini:</p>
          {features === null && <p className="text-sm text-slate-400 py-6 text-center">Memuat detail...</p>}
          {features?.map((m) => (
            <div key={m.code} className="border border-slate-200 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 text-sm mb-1">{m.label}</h4>
              {m.description && <p className="text-xs text-slate-500 mb-2">{m.description}</p>}
              {m.features.length > 0 ? (
                <ul className="grid sm:grid-cols-2 gap-1.5">
                  {m.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">Modul inti — tidak memiliki sub-bagian terpisah.</p>
              )}
            </div>
          ))}
        </div>
        {footer && <div className="px-6 py-4 border-t border-slate-200 sticky bottom-0 bg-white">{footer}</div>}
      </div>
    </div>
  );
}

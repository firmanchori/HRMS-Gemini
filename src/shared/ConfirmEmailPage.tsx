import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { authApi, AuthApiError } from "./authApi";

export function ConfirmEmailPage({ token }: { token: string }) {
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .confirmEmail(token)
      .then(() => setState("done"))
      .catch((err) => {
        setError(err instanceof AuthApiError ? err.message : "Gagal mengonfirmasi email.");
        setState("error");
      });
  }, [token]);

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 bg-slate-900 text-white border-b border-slate-800">
          <h1 className="font-extrabold text-base">Konfirmasi Email</h1>
        </div>
        <div className="p-6 text-sm">
          {state === "loading" && (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Memproses konfirmasi...
            </div>
          )}
          {state === "done" && (
            <div className="flex items-start gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Email baru Anda berhasil dikonfirmasi dan sudah aktif untuk digunakan masuk.</span>
            </div>
          )}
          {state === "error" && (
            <div className="flex items-start gap-2 text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

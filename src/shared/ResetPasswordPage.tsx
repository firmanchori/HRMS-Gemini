import React, { useState } from "react";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { authApi, AuthApiError } from "./authApi";
import { ValidatedInput } from "../components/common/ValidatedInput";

/** Consumes the token from the password-reset email link — works for both App Owner and tenant admin (same token mechanism, backend tells them apart by subdomain). */
export function ResetPasswordPage({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    setError(null);
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    if (password !== confirm) return setError("Konfirmasi password tidak cocok.");
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : "Gagal mengatur ulang password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 bg-slate-900 text-white border-b border-slate-800">
          <h1 className="font-extrabold text-base">Atur Ulang Password</h1>
        </div>
        <div className="p-6">
          {done ? (
            <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Password berhasil diubah. Silakan masuk kembali menggunakan password baru Anda.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              {error && (
                <div className="flex items-start gap-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <ValidatedInput
                label="Password Baru"
                type="password"
                required
                requiredLabel="Password minimal 8 karakter."
                validate={(val) => (val.length > 0 && val.length < 8 ? "Password minimal 8 karakter." : null)}
                showError={submitAttempted}
                icon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={setPassword}
              />
              <ValidatedInput
                label="Konfirmasi Password"
                type="password"
                required
                requiredLabel="Konfirmasi password wajib diisi."
                validate={(val) => (val.length > 0 && val !== password ? "Konfirmasi password tidak cocok." : null)}
                showError={submitAttempted}
                icon={<Lock className="w-4 h-4" />}
                value={confirm}
                onChange={setConfirm}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-bold disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Simpan Password Baru"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

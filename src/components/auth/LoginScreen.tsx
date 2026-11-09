import React, { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, FlaskConical, KeyRound } from 'lucide-react';
import { authApi, AuthApiError, type DevAccount } from '../../shared/authApi';

interface LoginScreenProps {
  onLoginSuccess: (user: { id: string; name: string; email: string }, role?: string) => void;
  onSwitchToEmployeeLogin?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onSwitchToEmployeeLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [devAccounts, setDevAccounts] = useState<DevAccount[]>([]);
  // Set only after the password step comes back with { mfaRequired: true } — switches the form to the code-entry step instead of finishing login.
  const [awaitingMfaCode, setAwaitingMfaCode] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  useEffect(() => {
    // Dev/test convenience only — the backend returns 404 outside development, so this silently does nothing in production.
    authApi
      .listDevAccounts()
      .then(setDevAccounts)
      .catch(() => setDevAccounts([]));
  }, []);

  function fillFromDevAccount(account: DevAccount) {
    setEmail(account.email);
    // Only overwrite the password field when we actually know it — otherwise
    // leave whatever the user already typed so they can fill it in themselves.
    if (account.password) setPassword(account.password);
    setErrorMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = await authApi.login(email, password);
      if ('mfaRequired' in result) {
        setAwaitingMfaCode(true);
        return;
      }
      // The real backend only issues one role for this context (tenant_admin);
      // mapped to the mock RBAC's full-access role until per-employee accounts exist.
      onLoginSuccess(result, 'super_admin');
    } catch (err) {
      setErrorMessage(err instanceof AuthApiError ? err.message : 'Gagal masuk, coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyMfa(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const user = await authApi.verifyMfaLogin(mfaCode);
      onLoginSuccess(user, 'super_admin');
    } catch (err) {
      setErrorMessage(err instanceof AuthApiError ? err.message : 'Gagal memverifikasi kode.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-slate-950 p-4 sm:p-6 text-slate-100 font-sans select-none relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 relative z-10 animate-fadeIn">
        {/* Top Brand Banner */}
        <div className="px-6 py-6 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-700 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
              N
            </div>
            <h1 className="font-extrabold text-base tracking-tight leading-none text-white">
              NusaHR Enterprise
            </h1>
          </div>
          <p className="text-xs text-slate-300 leading-snug">
            Masuk dengan akun email perusahaan Anda untuk mengakses seluruh modul kepegawaian, payroll, dan approval.
          </p>
        </div>

        {/* Login Form Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Gagal Masuk:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {awaitingMfaCode ? (
            <form onSubmit={handleVerifyMfa} className="space-y-3.5">
              <p className="text-xs text-slate-600 leading-snug">
                Masukkan kode 6 digit dari aplikasi autentikator Anda, atau salah satu kode cadangan Anda.
              </p>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Kode Verifikasi <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition-colors font-mono tracking-widest"
                    placeholder="123456"
                  />
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
                    <span>Verifikasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setAwaitingMfaCode(false); setMfaCode(''); setErrorMessage(null); }}
                className="w-full text-center text-[11px] text-slate-500 hover:text-slate-700"
              >
                Kembali ke login
              </button>
            </form>
          ) : (
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
                  type={showPassword ? 'text' : 'password'}
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
          </form>
          )}

          {!awaitingMfaCode && devAccounts.length > 0 && (
            <div className="pt-3 border-t border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                <FlaskConical className="w-3 h-3" /> Akun Uji Coba (klik untuk isi otomatis)
              </span>
              <div className="space-y-1.5">
                {devAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillFromDevAccount(acc)}
                    className={`w-full text-left p-2 rounded-lg border text-[11px] transition-all ${
                      email === acc.email
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{acc.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono uppercase">{acc.role}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                      {acc.email} &middot; {acc.password ?? 'password tidak diketahui'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!awaitingMfaCode && onSwitchToEmployeeLogin && (
            <button
              type="button"
              onClick={onSwitchToEmployeeLogin}
              className="w-full text-center text-[11px] text-slate-500 hover:text-slate-700 pt-1"
            >
              Masuk sebagai Karyawan (ESS/MSS)
            </button>
          )}
        </div>

        {/* Footer Security Badges */}
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
};

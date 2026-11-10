import React, { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, FlaskConical, KeyRound } from 'lucide-react';
import { authApi, AuthApiError, type DevAccount } from '../../shared/authApi';
import { ValidatedInput } from '../common/ValidatedInput';

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
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [mfaSubmitAttempted, setMfaSubmitAttempted] = useState(false);

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
    setSubmitAttempted(true);
    if (!email.trim() || !password.trim()) return;
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
    setMfaSubmitAttempted(true);
    if (!mfaCode.trim()) return;
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
            <form onSubmit={handleVerifyMfa} noValidate className="space-y-3.5">
              <p className="text-xs text-slate-600 leading-snug">
                Masukkan kode 6 digit dari aplikasi autentikator Anda, atau salah satu kode cadangan Anda.
              </p>
              <ValidatedInput
                label="Kode Verifikasi"
                required
                requiredLabel="Kode verifikasi wajib diisi"
                autoFocus
                value={mfaCode}
                onChange={setMfaCode}
                showError={mfaSubmitAttempted}
                icon={<KeyRound className="w-4 h-4" />}
                placeholder="123456"
                className="font-mono tracking-widest"
              />

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
          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            <ValidatedInput
              label="Email"
              type="email"
              required
              requiredLabel="Email wajib diisi"
              validate={(v) => (v.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Format email tidak valid' : null)}
              value={email}
              onChange={setEmail}
              showError={submitAttempted}
              icon={<Mail className="w-4 h-4" />}
            />

            <ValidatedInput
              label="Kata Sandi"
              type={showPassword ? 'text' : 'password'}
              required
              requiredLabel="Kata sandi wajib diisi"
              value={password}
              onChange={setPassword}
              showError={submitAttempted}
              icon={<Lock className="w-4 h-4" />}
              className="font-mono"
              rightElement={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

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
            <span>Data Terenkripsi & Sesi Aman</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">HTTPS/TLS</span>
        </div>
      </div>
    </div>
  );
};

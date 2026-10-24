import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (userEmail: string, role?: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('aditya.hr@nusantara.id');
  const [password, setPassword] = useState('Admin@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Quick Account Presets
  const DEMO_ACCOUNTS = [
    {
      label: 'Super Admin / HR Director',
      email: 'aditya.hr@nusantara.id',
      role: 'super_admin',
      dept: 'People & Culture',
    },
    {
      label: 'Payroll & Tax Lead',
      email: 'jessica.payroll@nusantara.id',
      role: 'payroll_admin',
      dept: 'Finance & Compensation',
    },
    {
      label: 'General Affairs Lead',
      email: 'bambang.ga@nusantara.id',
      role: 'ga_admin',
      dept: 'General Affairs & Procurement',
    },
    {
      label: 'Employee ESS (Staf)',
      email: 'dimas.w@nusantara.id',
      role: 'employee',
      dept: 'Technology & Engineering',
    },
  ];

  const handleSelectPreset = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword('Admin@2026');
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validations
    if (!email || !email.trim()) {
      setErrorMessage('Alamat email perusahaan wajib diisi.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Format email perusahaan tidak valid (contoh: nama@perusahaan.co.id).');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage('Kata sandi wajib diisi minimal 4 karakter.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching demo account to propagate role if matching
      const matched = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());

      if (rememberMe) {
        localStorage.setItem('nusahr_auth_session', JSON.stringify({ email, role: matched?.role || 'super_admin' }));
      }

      setIsLoading(false);
      onLoginSuccess(email, matched?.role);
    }, 450);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-slate-950 p-4 sm:p-6 text-slate-100 font-sans select-none relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 relative z-10 animate-fadeIn">
        {/* Top Brand Banner */}
        <div className="px-6 py-6 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-700 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
                N
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight leading-none text-white">
                  NusaHR Enterprise
                </h1>
                <span className="text-[10px] text-blue-300 font-mono">
                  Multi-Tenant Corporate Portal
                </span>
              </div>
            </div>

            <span className="text-[10px] bg-slate-800 text-blue-300 px-2.5 py-0.8 rounded-full font-mono border border-slate-700">
              v2026.1
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-snug">
            Masuk dengan akun email resmi perusahaan Anda untuk mengakses seluruh modul kepegawaian, payroll, dan approval.
          </p>
        </div>

        {/* Login Form Body */}
        <div className="p-6 space-y-4">
          {/* Error Message Box */}
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
            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Email Resmi Perusahaan <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-md shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="nama.lengkap@perusahaan.co.id"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">Terenkripsi SHA-256</span>
              </div>
              <div className="relative rounded-md shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
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

            {/* Remember & Options */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>Ingat Sesi di Perangkat Ini</span>
              </label>

              <span className="text-[11px] text-indigo-600 hover:underline cursor-pointer">
                Lupa Sandi?
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard NusaHR</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="pt-3 border-t border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Akun Demonstrasi Cepat (1-Klik):
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectPreset(acc)}
                  className={`text-left p-2 rounded-lg border text-[11px] transition-all ${
                    email === acc.email
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                  }`}
                >
                  <div className="truncate font-semibold text-slate-900">{acc.label}</div>
                  <div className="text-[9px] text-slate-500 truncate font-mono mt-0.5">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>
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

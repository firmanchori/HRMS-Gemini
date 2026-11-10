import React, { useEffect, useState } from 'react';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight, LogOut, User, Clock, CalendarDays, CheckSquare, ArrowLeft, KeyRound } from 'lucide-react';
import { employeeApi, EmployeeApiError, type EmployeeProfile, type AttendanceRecord, type LeaveRequest } from './api';
import { ValidatedInput } from '../components/common/ValidatedInput';
import { ValidatedDateInput } from '../components/common/ValidatedDateInput';

/**
 * Minimal, real ESS/MSS portal backed by server/routes/employee.ts — the
 * core flows only (profil, presensi, cuti, approval atasan), built
 * separately from the large existing EssPortal.tsx/MssPortal.tsx mock
 * components rather than retrofitting them. Those still run under the
 * tenant_admin session with a client-side "view as" persona switch; this
 * is the first real, server-enforced ESS/MSS surface, wiring it is the
 * natural next phase (user, 2026-11-09 RBAC enforcement scope: "inti
 * dulu").
 */
export const EmployeeApp: React.FC<{ onSwitchToAdminLogin: () => void }> = ({ onSwitchToAdminLogin }) => {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);

  useEffect(() => {
    employeeApi
      .me()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setIsCheckingSession(false));
  }, []);

  if (isCheckingSession) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      </div>
    );
  }

  if (!profile) {
    return <EmployeeLoginScreen onLoginSuccess={(p) => setProfile(p)} onSwitchToAdminLogin={onSwitchToAdminLogin} />;
  }

  return <EmployeeDashboard profile={profile} onLogout={() => { employeeApi.logout().catch(() => {}); setProfile(null); }} />;
};

const EmployeeLoginScreen: React.FC<{ onLoginSuccess: (profile: EmployeeProfile) => void; onSwitchToAdminLogin: () => void }> = ({ onLoginSuccess, onSwitchToAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  // Set only after the password step comes back with { mfaRequired: true } — mirrors LoginScreen.tsx's admin-side MFA step.
  const [awaitingMfaCode, setAwaitingMfaCode] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSubmitAttempted, setMfaSubmitAttempted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!email.trim() || !password.trim()) return;
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = await employeeApi.login(email, password);
      if ('mfaRequired' in result) {
        setAwaitingMfaCode(true);
        return;
      }
      const profile = await employeeApi.me();
      onLoginSuccess(profile);
    } catch (err) {
      setErrorMessage(err instanceof EmployeeApiError ? err.message : 'Gagal masuk, coba lagi.');
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
      await employeeApi.verifyMfaLogin(mfaCode);
      const profile = await employeeApi.me();
      onLoginSuccess(profile);
    } catch (err) {
      setErrorMessage(err instanceof EmployeeApiError ? err.message : 'Gagal memverifikasi kode.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-slate-950 p-4 sm:p-6 text-slate-100 font-sans select-none relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 relative z-10 animate-fadeIn">
        <div className="px-6 py-6 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-extrabold flex items-center justify-center text-base shadow-sm">N</div>
            <h1 className="font-extrabold text-base tracking-tight leading-none text-white">NusaHR — Portal Karyawan</h1>
          </div>
          <p className="text-xs text-slate-300 leading-snug">Masuk dengan akun karyawan untuk mengakses presensi, cuti, dan persetujuan.</p>
        </div>

        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
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
              <button type="submit" disabled={isLoading} className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2">
                {isLoading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Verifikasi</span><ArrowRight className="w-4 h-4" /></>}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAwaitingMfaCode(false);
                  setMfaCode('');
                  setErrorMessage(null);
                }}
                className="w-full flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500 hover:text-slate-700 pt-1"
              >
                <ArrowLeft className="w-3 h-3" /> Kembali ke Login
              </button>
            </form>
          ) : (
            <>
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
                    <button type="button" onClick={() => setShowPassword((p) => !p)} className="text-slate-400 hover:text-slate-600" tabIndex={-1}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                <button type="submit" disabled={isLoading} className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2">
                  {isLoading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Masuk</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <button type="button" onClick={onSwitchToAdminLogin} className="w-full flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500 hover:text-slate-700 pt-1">
                <ArrowLeft className="w-3 h-3" /> Masuk sebagai Admin Tenant
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

type Tab = 'profil' | 'presensi' | 'cuti' | 'approval';

const EmployeeDashboard: React.FC<{ profile: EmployeeProfile; onLogout: () => void }> = ({ profile, onLogout }) => {
  const canApprove = profile.permissions.attendance.approve;
  const [tab, setTab] = useState<Tab>('profil');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profil', label: 'Profil', icon: <User className="w-4 h-4" /> },
    { id: 'presensi', label: 'Presensi', icon: <Clock className="w-4 h-4" /> },
    { id: 'cuti', label: 'Cuti', icon: <CalendarDays className="w-4 h-4" /> },
    ...(canApprove ? [{ id: 'approval' as Tab, label: 'Approval Tim', icon: <CheckSquare className="w-4 h-4" /> }] : []),
  ];

  return (
    <div className="min-h-screen w-screen bg-slate-50 text-slate-900 font-sans text-[13px]">
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-extrabold flex items-center justify-center text-sm">N</div>
          <div>
            <div className="font-bold text-sm leading-none">{profile.employee.fullName}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{profile.roleKey === 'manager' ? 'Manager (MSS)' : 'Staff (ESS)'}</div>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600">
          <LogOut className="w-3.5 h-3.5" /> Keluar
        </button>
      </header>

      <nav className="bg-white border-b border-slate-200 px-4 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      <main className="p-4 max-w-3xl mx-auto">
        {tab === 'profil' && <ProfilTab profile={profile} />}
        {tab === 'presensi' && <PresensiTab canCreate={profile.permissions.attendance.create} />}
        {tab === 'cuti' && <CutiTab canCreate={profile.permissions.attendance.create} />}
        {tab === 'approval' && canApprove && <ApprovalTab />}
      </main>
    </div>
  );
};

const ProfilTab: React.FC<{ profile: EmployeeProfile }> = ({ profile }) => (
  <div className="space-y-4">
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <h2 className="font-bold text-sm text-slate-800">Data Diri</h2>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div><span className="text-slate-400 block">Nama Lengkap</span><span className="font-semibold">{profile.employee.fullName}</span></div>
        <div><span className="text-slate-400 block">NIK</span><span className="font-semibold font-mono">{profile.employee.nik}</span></div>
        <div><span className="text-slate-400 block">Email</span><span className="font-semibold">{profile.employee.email || '-'}</span></div>
        <div><span className="text-slate-400 block">Telepon</span><span className="font-semibold">{profile.employee.phone || '-'}</span></div>
        <div><span className="text-slate-400 block">Status Kepegawaian</span><span className="font-semibold">{profile.employee.employmentType}</span></div>
        <div><span className="text-slate-400 block">Status</span><span className="font-semibold">{profile.employee.status}</span></div>
      </div>
    </div>
    <EmployeeMfaCard />
  </div>
);

/**
 * Self-service MFA enrollment for employee accounts — same real
 * server/routes/employee.ts's /mfa/* endpoints and UI contract as
 * Header.tsx's admin-side MFA card (security review, user 2026-11-10:
 * "MFA untuk karyawan").
 */
const EmployeeMfaCard: React.FC = () => {
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string } | null>(null);
  const [mfaConfirmCode, setMfaConfirmCode] = useState('');
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[] | null>(null);
  const [mfaDisablePassword, setMfaDisablePassword] = useState('');
  const [showMfaDisableForm, setShowMfaDisableForm] = useState(false);

  useEffect(() => {
    employeeApi.mfaStatus().then((s) => setMfaEnabled(s.enabled)).catch(() => setMfaEnabled(null));
  }, []);

  const handleStartMfaSetup = async () => {
    setMfaError(null);
    setMfaLoading(true);
    try {
      setMfaSetupData(await employeeApi.mfaSetup());
    } catch (err) {
      setMfaError(err instanceof EmployeeApiError ? err.message : 'Gagal memulai pengaturan MFA.');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleConfirmMfaSetup = async () => {
    setMfaError(null);
    setMfaLoading(true);
    try {
      const result = await employeeApi.mfaConfirm(mfaConfirmCode);
      setMfaBackupCodes(result.backupCodes);
      setMfaEnabled(true);
      setMfaSetupData(null);
      setMfaConfirmCode('');
    } catch (err) {
      setMfaError(err instanceof EmployeeApiError ? err.message : 'Kode verifikasi salah.');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    setMfaError(null);
    setMfaLoading(true);
    try {
      await employeeApi.mfaDisable(mfaDisablePassword);
      setMfaEnabled(false);
      setShowMfaDisableForm(false);
      setMfaDisablePassword('');
      setMfaBackupCodes(null);
    } catch (err) {
      setMfaError(err instanceof EmployeeApiError ? err.message : 'Password salah.');
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-sm text-slate-800">Verifikasi Dua Langkah (2FA)</h2>
          <div className="text-xs font-semibold mt-0.5">
            {mfaEnabled === null ? (
              <span className="text-slate-400">Memuat...</span>
            ) : mfaEnabled ? (
              <span className="text-emerald-700">Aktif</span>
            ) : (
              <span className="text-slate-500">Tidak Aktif</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Gunakan aplikasi autentikator (Google Authenticator, Authy, dll) untuk lapisan keamanan tambahan saat login.
          </div>
        </div>
      </div>

      {mfaError && <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1.5">{mfaError}</div>}

      {mfaBackupCodes && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1.5">
          <div className="font-semibold">Simpan kode cadangan ini — hanya ditampilkan sekali:</div>
          <div className="grid grid-cols-2 gap-1 font-mono">
            {mfaBackupCodes.map((c) => <span key={c}>{c}</span>)}
          </div>
        </div>
      )}

      {mfaEnabled === false && !mfaSetupData && (
        <button type="button" onClick={handleStartMfaSetup} disabled={mfaLoading} className="text-xs font-semibold text-indigo-600 hover:underline disabled:opacity-50">
          Aktifkan 2FA
        </button>
      )}

      {mfaSetupData && (
        <div className="space-y-2 border-t border-slate-200 pt-2.5">
          <img src={mfaSetupData.qrCodeDataUrl} alt="QR kode 2FA" className="w-32 h-32 border border-slate-200 rounded-lg" />
          <div className="text-[11px] text-slate-500">
            Pindai dengan aplikasi autentikator, atau masukkan manual: <span className="font-mono">{mfaSetupData.secret}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={mfaConfirmCode}
              onChange={(e) => setMfaConfirmCode(e.target.value)}
              placeholder="Kode 6 digit"
              className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
            />
            <button
              type="button"
              onClick={handleConfirmMfaSetup}
              disabled={mfaLoading || mfaConfirmCode.length < 6}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              Konfirmasi
            </button>
          </div>
        </div>
      )}

      {mfaEnabled === true && !showMfaDisableForm && (
        <button type="button" onClick={() => setShowMfaDisableForm(true)} className="text-xs font-semibold text-rose-600 hover:underline">
          Matikan 2FA
        </button>
      )}

      {showMfaDisableForm && (
        <div className="flex items-center gap-2 border-t border-slate-200 pt-2.5">
          <input
            type="password"
            value={mfaDisablePassword}
            onChange={(e) => setMfaDisablePassword(e.target.value)}
            placeholder="Konfirmasi dengan kata sandi"
            className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
          />
          <button
            type="button"
            onClick={handleDisableMfa}
            disabled={mfaLoading || !mfaDisablePassword}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
          >
            Matikan
          </button>
        </div>
      )}
    </div>
  );
};

const PresensiTab: React.FC<{ canCreate: boolean }> = ({ canCreate }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClocking, setIsClocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find((r) => r.date === today);

  const load = () => employeeApi.getAttendance().then(setRecords).catch(() => {}).finally(() => setIsLoading(false));
  useEffect(() => { load(); }, []);

  async function handleClock(type: 'in' | 'out') {
    setErrorMessage(null);
    setIsClocking(true);
    try {
      const coords = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Perangkat ini tidak mendukung GPS.'));
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => reject(new Error(`Gagal mendapatkan lokasi GPS: ${err.message}`)),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
      if (type === 'in') {
        const check = await employeeApi.checkClockIn(coords.lat, coords.lng);
        const workType = check.insideRadius && check.allowedWorkTypes.includes('WFO') ? 'WFO' : check.allowedWorkTypes[0];
        if (!workType) throw new Error('Tidak ada opsi kehadiran yang diizinkan untuk akun Anda.');
        await employeeApi.clockIn(coords.lat, coords.lng, workType);
      } else {
        await employeeApi.clockOut(coords.lat, coords.lng);
      }
      load();
    } catch (err) {
      setErrorMessage(err instanceof EmployeeApiError || err instanceof Error ? err.message : 'Gagal mencatat presensi.');
    } finally {
      setIsClocking(false);
    }
  }

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h2 className="font-bold text-sm text-slate-800">Presensi Hari Ini</h2>
          {errorMessage && <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1.5">{errorMessage}</div>}
          <div className="flex items-center gap-3 text-xs">
            <span>Clock In: <span className="font-mono font-semibold">{todayRecord?.clockIn ?? '-'}</span></span>
            <span>Clock Out: <span className="font-mono font-semibold">{todayRecord?.clockOut ?? '-'}</span></span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleClock('in')} disabled={isClocking || Boolean(todayRecord?.clockIn)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50">Clock In</button>
            <button onClick={() => handleClock('out')} disabled={isClocking || !todayRecord?.clockIn || Boolean(todayRecord?.clockOut)} className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50">Clock Out</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-bold text-sm text-slate-800 mb-3">Riwayat Presensi</h2>
        {isLoading ? <div className="text-xs text-slate-400">Memuat...</div> : records.length === 0 ? <div className="text-xs text-slate-400">Belum ada data presensi.</div> : (
          <div className="space-y-1.5">
            {[...records].reverse().map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs border-b border-slate-100 pb-1.5">
                <span className="font-semibold">{r.date}</span>
                <span className="text-slate-500">{r.clockIn ?? '-'} — {r.clockOut ?? '-'}</span>
                <span className="text-slate-500">{r.workType ?? '-'}</span>
                <span className="font-medium text-emerald-700">{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const LEAVE_TYPES = ['Cuti Tahunan', 'Sakit Tanpa Surat Dokter', 'Sakit dengan Surat Dokter', 'Cuti Menikah', 'Cuti Melahirkan', 'Izin Urusan Pribadi'];

const CutiTab: React.FC<{ canCreate: boolean }> = ({ canCreate }) => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ leaveType: LEAVE_TYPES[0], startDate: '', endDate: '', reason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = () => employeeApi.getLeave().then(setRequests).catch(() => {}).finally(() => setIsLoading(false));
  useEffect(() => { load(); }, []);

  const [submitAttempted, setSubmitAttempted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!form.startDate || !form.endDate) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const days = Math.max(1, Math.round((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000) + 1);
      await employeeApi.submitLeave({ ...form, totalDays: days });
      setForm({ leaveType: LEAVE_TYPES[0], startDate: '', endDate: '', reason: '' });
      setSubmitAttempted(false);
      load();
    } catch (err) {
      setErrorMessage(err instanceof EmployeeApiError ? err.message : 'Gagal mengajukan cuti.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {canCreate && (
        <form onSubmit={handleSubmit} noValidate className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h2 className="font-bold text-sm text-slate-800">Ajukan Cuti</h2>
          {errorMessage && <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1.5">{errorMessage}</div>}
          <select value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs">
            {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <ValidatedDateInput required showError={submitAttempted} value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} maxDate={form.endDate || undefined} />
            <ValidatedDateInput required showError={submitAttempted} value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} minDate={form.startDate || undefined} />
          </div>
          <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Alasan (opsional)" className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs" rows={2} />
          <button type="submit" disabled={isSubmitting} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50">Ajukan</button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-bold text-sm text-slate-800 mb-3">Riwayat Pengajuan Cuti</h2>
        {isLoading ? <div className="text-xs text-slate-400">Memuat...</div> : requests.length === 0 ? <div className="text-xs text-slate-400">Belum ada pengajuan cuti.</div> : (
          <div className="space-y-1.5">
            {[...requests].reverse().map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs border-b border-slate-100 pb-1.5">
                <span className="font-semibold">{r.leaveType}</span>
                <span className="text-slate-500">{r.startDate} s/d {r.endDate} ({r.totalDays} hari)</span>
                <span className={`font-medium ${r.status === 'Disetujui' ? 'text-emerald-700' : r.status === 'Ditolak' ? 'text-rose-700' : 'text-amber-700'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ApprovalTab: React.FC = () => {
  const [queue, setQueue] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => employeeApi.getApprovalQueue().then(setQueue).catch(() => {}).finally(() => setIsLoading(false));
  useEffect(() => { load(); }, []);

  async function decide(id: string, decision: 'Disetujui' | 'Ditolak') {
    setBusyId(id);
    try {
      await employeeApi.decideLeave(id, decision);
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h2 className="font-bold text-sm text-slate-800 mb-3">Pengajuan Cuti Tim — Menunggu Persetujuan</h2>
      {isLoading ? <div className="text-xs text-slate-400">Memuat...</div> : queue.length === 0 ? <div className="text-xs text-slate-400">Tidak ada pengajuan menunggu.</div> : (
        <div className="space-y-2">
          {queue.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-xs border border-slate-200 rounded-lg p-2.5">
              <div>
                <div className="font-semibold">{r.leaveType}</div>
                <div className="text-slate-500">{r.startDate} s/d {r.endDate} ({r.totalDays} hari){r.reason ? ` — ${r.reason}` : ''}</div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => decide(r.id, 'Disetujui')} disabled={busyId === r.id} className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold disabled:opacity-50">Setujui</button>
                <button onClick={() => decide(r.id, 'Ditolak')} disabled={busyId === r.id} className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-semibold disabled:opacity-50">Tolak</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

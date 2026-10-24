import React, { useState, useRef, useEffect } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  Building2,
  ShieldCheck,
  UploadCloud,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Check,
  User,
  Settings,
  ChevronDown,
  ChevronRight,
  UserCheck,
  History,
  HelpCircle,
  X,
  CheckCircle,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Briefcase,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../../types/hrms';
import { GlobalSearchBar } from './GlobalSearchBar';

interface HeaderProps {
  onOpenMigrationWizard: () => void;
  onToggleSidebar?: () => void;
  onToggleMobileSidebar?: () => void;
  isDesktopCollapsed?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMigrationWizard,
  onToggleSidebar,
  onToggleMobileSidebar,
  isDesktopCollapsed = false,
  onLogout,
}) => {
  const {
    tenants,
    currentTenant,
    setCurrentTenantId,
    entities,
    currentEntityId,
    setCurrentEntityId,
    currentUser,
    setCurrentUserRole,
    roles = [],
    resetToSampleFlowData,
    employees = [],
    setActiveModule,
  } = useHrms();

  const [flowResetSuccess, setFlowResetSuccess] = useState(false);

  // Profile Dropdown & Modal States
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<'info' | 'security' | 'preferences'>('info');

  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else if (onToggleMobileSidebar) {
      onToggleMobileSidebar();
    }
  };

  const roleLabels: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    hr_admin: 'HR Director',
    payroll_admin: 'Payroll Lead',
    ga_admin: 'GA Manager',
    manager: 'Line Manager (Atasan)',
    employee: 'Employee (ESS)',
  };

  const currentEntity = entities.find((e) => e.id === currentEntityId) || entities[0];

  // Match corresponding employee for rich photo avatar
  const currentEmployee =
    employees.find((e) => e.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
    employees.find((e) => e.fullName?.toLowerCase() === currentUser.name?.toLowerCase()) ||
    employees.find((e) => e.id === currentUser.employeeId) ||
    employees[0];

  const userAvatarUrl = currentEmployee?.avatar || currentUser.avatarUrl;

  // Profile Form Edit State
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profilePhone, setProfilePhone] = useState(currentEmployee?.phone || '0812-9876-5432');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyBrowser, setNotifyBrowser] = useState(false);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSavedToast(true);
    setTimeout(() => {
      setProfileSavedToast(false);
      setIsProfileModalOpen(false);
    }, 1500);
  };

  const handleConfirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    setIsProfileDropdownOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      localStorage.setItem('nusahr_is_logged_out', 'true');
      window.location.reload();
    }
  };

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-4 lg:px-5 flex items-center justify-between gap-2 md:gap-3 shrink-0 z-20 min-w-0">
        {/* Zone 1: Sidebar Toggle & Global Search Bar (No Title in Top Menu) */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <button
            onClick={handleToggle}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0 flex items-center justify-center border border-slate-200 shadow-2xs"
            aria-label={isDesktopCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
            title={isDesktopCollapsed ? 'Perluas Sidebar (Ctrl+B)' : 'Perkecil Sidebar (Ctrl+B)'}
          >
            {isDesktopCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-slate-800" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Global Search Bar immediately next to toggle */}
          <GlobalSearchBar />
        </div>

        {/* Zone 2: Entity Tree Switcher, Quick Actions & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Compact Entity Tree Switcher (No bulky outer text, tree-indented in dropdown) */}
          {entities.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 transition-colors shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <select
                value={currentEntityId}
                onChange={(e) => setCurrentEntityId(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer text-xs max-w-[110px] sm:max-w-[140px] md:max-w-[160px] lg:max-w-[220px] xl:max-w-[280px] truncate"
                title="Pilih Entitas Aktif"
              >
                {(() => {
                  const result: { ent: typeof entities[0]; prefix: string }[] = [];
                  const traverse = (parentId?: string, depth: number = 0) => {
                    const children = entities.filter((e) =>
                      (!parentId && (!e.parentEntityId || !entities.some((p) => p.id === e.parentEntityId))) ||
                      (parentId && e.parentEntityId === parentId)
                    );
                    for (const child of children) {
                      const prefix = depth === 0 ? '🏢 ' : depth === 1 ? '  ↳ 🏭 ' : '    ↳ 🏪 ';
                      result.push({ ent: child, prefix });
                      traverse(child.id, depth + 1);
                    }
                  };
                  traverse(undefined, 0);
                  const list = result.length > 0 ? result : entities.map((e) => ({ ent: e, prefix: '🏢 ' }));
                  return list.map(({ ent, prefix }) => (
                    <option key={ent.id} value={ent.id}>
                      {prefix}{ent.name} ({ent.code})
                    </option>
                  ));
                })()}
              </select>
            </div>
          )}

          {/* Setup & Migrasi Action Button (Curated Dark Slate) */}
          <button
            onClick={onOpenMigrationWizard}
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            title="Wizard Setup Organisasi & Migrasi Data"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Setup & Migrasi</span>
          </button>

          {/* Reload Flow Demo Data (Compact) */}
          <button
            onClick={() => {
              resetToSampleFlowData();
              setFlowResetSuccess(true);
              setTimeout(() => setFlowResetSuccess(false), 2500);
            }}
            className={`flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-2xs shrink-0 ${
              flowResetSuccess
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
            title="Muat ulang seluruh data contoh flow proses bisnis (10 Karyawan, Presensi, Payroll, Kasbon, SPPD)"
          >
            {flowResetSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-50" />
                <span className="hidden xl:inline text-[11px] font-bold">Siap</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden xl:inline text-[11px] font-semibold">Reset Data</span>
              </>
            )}
          </button>

          {/* Role Switcher for Testing RBAC (Compact, shown on desktop lg+) */}
          <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs shadow-2xs shrink-0" title="Simulasi Hak Akses Pengguna (RBAC)">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-700 shrink-0" />
            <select
              value={currentUser.role}
              onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
              className="bg-transparent border-none outline-none font-semibold text-slate-800 cursor-pointer text-[11px] max-w-[85px] lg:max-w-[125px] truncate"
            >
              {roles && roles.length > 0 ? (
                roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))
              ) : (
                <>
                  <option value="super_admin">Super Admin</option>
                  <option value="hr_admin">HR Admin</option>
                  <option value="payroll_admin">Payroll Admin</option>
                  <option value="ga_admin">GA Admin</option>
                  <option value="manager">Manager (MSS)</option>
                  <option value="employee">Employee (ESS)</option>
                </>
              )}
            </select>
          </div>

          {/* Interactive Photo Profile Trigger with Dropdown */}
          <div ref={profileDropdownRef} className="relative pl-1 sm:border-l sm:border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
              className={`flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl border transition-all cursor-pointer group select-none shadow-2xs ${
                isProfileDropdownOpen
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-2 ring-indigo-200'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
              title="Menu Profil Akun & Pengaturan"
              aria-expanded={isProfileDropdownOpen}
            >
              <div className="relative shrink-0">
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={currentUser.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-300 ring-2 ring-slate-100 group-hover:ring-indigo-300 transition-all"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs border border-white/20">
                    {currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                )}
                {/* Online status indicator dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
              </div>

              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors max-w-[100px] lg:max-w-[130px] truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate max-w-[100px] lg:max-w-[130px]">
                  {roleLabels[currentUser.role] || currentUser.role}
                </div>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isProfileDropdownOpen ? 'rotate-180 text-indigo-600' : 'group-hover:text-slate-600'
                }`}
              />
            </button>

            {/* DROPDOWN MENU */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 text-slate-800">
                {/* 1. Header Profile Banner */}
                <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center gap-3 relative z-10">
                    <div className="relative shrink-0">
                      {userAvatarUrl ? (
                        <img
                          src={userAvatarUrl}
                          alt={currentUser.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white/80 shadow-md"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-base font-bold flex items-center justify-center border-2 border-white/80 shadow-md">
                          {currentUser.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-xs" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                        <span>{currentUser.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono truncate">{currentUser.email}</div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-300 font-medium truncate">
                        <Building2 className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate">{currentEntity.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Role Pill */}
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs relative z-10">
                    <span className="text-[10px] text-slate-400">Hak Akses:</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-semibold">
                      <ShieldCheck className="w-3 h-3 text-indigo-400" />
                      <span>{roleLabels[currentUser.role] || currentUser.role}</span>
                    </span>
                  </div>
                </div>

                {/* 2. Menu Navigation Items */}
                <div className="p-2 space-y-1 text-xs">
                  {/* Option A: Pengaturan Profil */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 hover:text-indigo-600 group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 group-hover:text-indigo-600">Pengaturan Profil</div>
                      <div className="text-[11px] text-slate-400 truncate">Kelola data diri, kontak & kata sandi</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 shrink-0" />
                  </button>

                  {/* Option B: Portal Mandiri ESS / MSS */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setActiveModule(
                        currentUser.role === 'manager' || currentUser.role === 'super_admin' ? 'mss' : 'ess'
                      );
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 hover:text-emerald-700 group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 group-hover:text-emerald-700">
                        {currentUser.role === 'manager' || currentUser.role === 'super_admin'
                          ? 'Portal MSS (Manager)'
                          : 'Portal ESS (Karyawan)'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">Pengajuan cuti, presensi & slip gaji</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 shrink-0" />
                  </button>

                  {/* Option C: Log Aktivitas & Audit Trail */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setActiveModule('audit');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 hover:text-amber-700 group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <History className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 group-hover:text-amber-700">Log Aktivitas & Audit</div>
                      <div className="text-[11px] text-slate-400 truncate">Rekam jejak login & transaksi sistem</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-700 shrink-0" />
                  </button>

                  {/* Option D: Simulasi Peran (Role Switcher inside Dropdown) */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/90 my-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Ganti Simulasi Peran:</span>
                      </span>
                      <span className="text-[10px] text-indigo-600 font-mono">Live Demo</span>
                    </div>
                    <select
                      value={currentUser.role}
                      onChange={(e) => {
                        setCurrentUserRole(e.target.value as UserRole);
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer outline-none focus:border-indigo-500 shadow-2xs"
                    >
                      {roles && roles.length > 0 ? (
                        roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="super_admin">Super Admin</option>
                          <option value="hr_admin">HR Director</option>
                          <option value="payroll_admin">Payroll Lead</option>
                          <option value="ga_admin">GA Manager</option>
                          <option value="manager">Line Manager (Atasan)</option>
                          <option value="employee">Employee (ESS)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Option E: Pintasan Keyboard & Bantuan */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsHelpModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 group text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">Panduan & Pintasan</div>
                        <div className="text-[11px] text-slate-400">Keyboard shortcuts & bantuan</div>
                      </div>
                    </div>
                    <kbd className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      ⌘K
                    </kbd>
                  </button>
                </div>

                {/* 3. Footer Logout Action */}
                <div className="p-2 border-t border-slate-100 bg-slate-50/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsLogoutConfirmOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-semibold transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-rose-700">Keluar / Log Out</div>
                      <div className="text-[10px] text-rose-500 truncate">Akhiri sesi akun di perangkat ini</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MODAL 1: PENGATURAN PROFIL & AKUN PENGGUNA               */}
      {/* ======================================================== */}
      {isProfileModalOpen && (
        <div
          onClick={() => setIsProfileModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Header Modal */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm">Pengaturan Profil & Akun Pengguna</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 shrink-0 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setProfileTab('info')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                  profileTab === 'info'
                    ? 'border-indigo-600 text-indigo-600 font-bold bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Data Pribadi & Kepegawaian</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileTab('security')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                  profileTab === 'security'
                    ? 'border-indigo-600 text-indigo-600 font-bold bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Keamanan & Sandi</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileTab('preferences')}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                  profileTab === 'preferences'
                    ? 'border-indigo-600 text-indigo-600 font-bold bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Preferensi Notifikasi</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProfile} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {profileSavedToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 flex items-center gap-2 animate-in zoom-in-95">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-xs">Perubahan data profil berhasil disimpan!</span>
                </div>
              )}

              {/* TAB 1: DATA PRIBADI */}
              {profileTab === 'info' && (
                <div className="space-y-3.5">
                  {/* Photo Preview & Upload */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
                    <div className="relative shrink-0">
                      {userAvatarUrl ? (
                        <img
                          src={userAvatarUrl}
                          alt={profileName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-indigo-600 text-white font-bold text-xl flex items-center justify-center">
                          {profileName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800 text-sm">{profileName}</div>
                      <div className="text-slate-500 text-xs font-mono">{profileEmail}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Format foto profil tersinkronisasi otomatis dengan basis data Master Karyawan.
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap *</label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Email Perusahaan *</label>
                      <input
                        type="email"
                        required
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Nomor Telepon / WhatsApp</label>
                      <input
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">NIK Karyawan (Tersinkron)</label>
                      <input
                        type="text"
                        disabled
                        value={currentEmployee?.nik || 'NTM-EMP-001'}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Unit / Departemen:</span>
                      <span className="font-bold text-slate-800">{currentEmployee?.department || 'Executive Board'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Entitas Perusahaan:</span>
                      <span className="font-bold text-slate-800">{currentEntity.name}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: KEAMANAN & SANDI */}
              {profileTab === 'security' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Autentikasi Dua Faktor (2FA) dan Audit Keamanan Enterprise aktif untuk akun ini.</span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Kata Sandi Saat Ini</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Masukkan kata sandi lama..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Kata Sandi Baru</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 8 karakter..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Konfirmasi Kata Sandi Baru</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
                    <div className="font-semibold text-slate-700">Informasi Sesi Terakhir:</div>
                    <div>• Perangkat: macOS Desktop • Browser: Chrome Enterprise</div>
                    <div>• Waktu Login: Hari ini, {new Date().toLocaleTimeString('id-ID')} WIB</div>
                  </div>
                </div>
              )}

              {/* TAB 3: PREFERENSI & NOTIFIKASI */}
              {profileTab === 'preferences' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="font-semibold text-slate-800 text-xs">Notifikasi Email</div>
                        <div className="text-[11px] text-slate-500">
                          Kirimkan rekap mingguan, notifikasi approval cuti, dan slip gaji ke email.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                    </label>

                    <hr className="border-slate-200" />

                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="font-semibold text-slate-800 text-xs">Pemberitahuan WhatsApp Otomatis</div>
                        <div className="text-[11px] text-slate-500">
                          Kirimkan notifikasi instan untuk pengingat shift kerja dan status persetujuan SPPD.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyWhatsapp}
                        onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                    </label>

                    <hr className="border-slate-200" />

                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="font-semibold text-slate-800 text-xs">Push Notification Browser</div>
                        <div className="text-[11px] text-slate-500">
                          Tampilkan alert pop-up desktop saat ada permohonan baru yang membutuhkan tindakan.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyBrowser}
                        onChange={(e) => setNotifyBrowser(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xs transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: KONFIRMASI LOG OUT DARI AKUN                    */}
      {/* ======================================================== */}
      {isLogoutConfirmOpen && (
        <div
          onClick={() => setIsLogoutConfirmOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-5 text-center animate-in zoom-in-95"
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3.5">
              <LogOut className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-slate-900 text-base mb-1">Konfirmasi Keluar Akun</h3>
            <p className="text-slate-600 text-xs leading-relaxed mb-4">
              Apakah Anda yakin ingin keluar dari akun <b className="text-slate-900">{currentUser.name}</b>? Sesi kerja aktif Anda akan diakhiri dan dialihkan ke portal masuk perusahaan.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Ya, Keluar Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: PANDUAN PINTASAN & SHORTCUT SISTEM              */}
      {/* ======================================================== */}
      {isHelpModalOpen && (
        <div
          onClick={() => setIsHelpModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-5 animate-in zoom-in-95 text-slate-800"
          >
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Pintasan Keyboard & Panduan Sistem</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span>Buka Command Palette & Pencarian Global</span>
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-700 shadow-2xs">
                  Ctrl / ⌘ + K
                </kbd>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span>Perluas / Sembunyikan Sidebar Menu</span>
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-700 shadow-2xs">
                  Ctrl / ⌘ + B
                </kbd>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span>Tutup Modal / Popup Aktif</span>
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-700 shadow-2xs">
                  ESC
                </kbd>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

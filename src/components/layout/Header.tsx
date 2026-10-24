import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import { Building2, ShieldCheck, UploadCloud, Network, LogOut, PanelLeftClose, PanelLeftOpen, RotateCcw, Check } from 'lucide-react';
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
  } = useHrms();

  const [flowResetSuccess, setFlowResetSuccess] = useState(false);

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

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-4 lg:px-5 flex items-center justify-between gap-3 shrink-0 z-20 min-w-0">
      {/* Zone 1: Sidebar Toggle & Global Search Bar (No Title in Top Menu) */}
      <div className="flex items-center gap-2.5 min-w-0">
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
      <div className="flex items-center gap-2 shrink-0">
        {/* Compact Entity Tree Switcher (No bulky outer text, tree-indented in dropdown) */}
        {entities.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 transition-colors shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <select
              value={currentEntityId}
              onChange={(e) => setCurrentEntityId(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer text-xs max-w-[120px] sm:max-w-[160px] md:max-w-[200px] truncate"
              title="Pilih Entitas Aktif"
            >
              {entities.map((ent) => {
                const prefix =
                  ent.level === 'holding'
                    ? '🏢 '
                    : ent.level === 'anak'
                    ? '  ↳ 🏭 '
                    : '    ↳ 🏪 ';
                return (
                  <option key={ent.id} value={ent.id}>
                    {prefix}{ent.name} ({ent.code})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Setup & Migrasi Action Button (Curated Dark Slate) */}
        <button
          onClick={onOpenMigrationWizard}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
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
              <span className="hidden lg:inline text-[11px] font-bold">Siap</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden lg:inline text-[11px] font-semibold">Reset Data</span>
            </>
          )}
        </button>

        {/* Role Switcher for Testing RBAC (Compact) */}
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs shadow-2xs shrink-0" title="Simulasi Hak Akses Pengguna (RBAC)">
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

        {/* User Profile Info */}
        <div className="flex items-center gap-1.5 pl-1.5 sm:border-l sm:border-slate-200 shrink-0">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
            {currentUser.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="hidden 2xl:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-500">
              {roles.find((r) => r.id === currentUser.role)?.label || roleLabels[currentUser.role] || currentUser.role}
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
              title="Keluar / Logout Akun Perusahaan"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

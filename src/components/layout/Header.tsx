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
    activeModule,
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

  const getBreadcrumbTitle = (mod: string) => {
    switch (mod) {
      case 'dashboard':
        return 'Ringkasan Dashboard';
      case 'employees':
        return 'Manajemen Karyawan';
      case 'personalia':
        return 'Personalia (Promosi & Demosi)';
      case 'attendance':
        return 'Presensi, Shift & Cuti';
      case 'trips':
        return 'Perjalanan Dinas (SPPD)';
      case 'approvals':
        return 'Pusat Approval Bertingkat';
      case 'payroll':
        return 'Payroll & PPh 21 TER 2024';
      case 'loans':
        return 'Pinjaman Karyawan & Simulasi';
      case 'kpi':
        return 'Penilaian Kinerja (KPI Real-time)';
      case 'compliance':
        return 'Kepatuhan & Sanksi (SP/PHK)';
      case 'recruitment':
        return 'Rekrutmen & Offering Letter';
      case 'offboarding':
        return 'Offboarding & Pesangon PP 35/2021';
      case 'assets':
        return 'GA, Aset QR & Perbaikan';
      case 'procurement':
        return 'Pengadaan, PO & Vendor (Procurement)';
      case 'documents':
        return 'Tata Kelola Dokumen Legal & TTD QR';
      case 'rbac':
        return 'Manajemen User & Hak Akses RBAC (Admin)';
      case 'tenants':
        return 'Manajemen Multi-Tenant (Apps Owner)';
      default:
        return 'NusaHR Portal';
    }
  };

  return (
    <header className="h-13 bg-white border-b border-slate-200 px-2 sm:px-4 lg:px-5 flex items-center justify-between gap-1.5 sm:gap-3 shrink-0 z-20">
      {/* Zone 1: Sidebar Toggle & Breadcrumb Context */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
        {/* Responsive Sidebar Toggle Button (Panel icon, NO burger icon) */}
        <button
          onClick={handleToggle}
          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-md transition-colors shrink-0 flex items-center justify-center border border-slate-200"
          aria-label={isDesktopCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
          title={isDesktopCollapsed ? 'Perluas Sidebar (Ctrl+B)' : 'Perkecil Sidebar (Ctrl+B)'}
        >
          {isDesktopCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-indigo-600" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-600" />
          )}
        </button>

        <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 sm:px-2 py-0.5 rounded shrink-0">
          {currentTenant.code}
        </span>
        <span className="text-slate-300 hidden sm:inline shrink-0">/</span>
        <h1 className="text-xs sm:text-sm font-semibold text-slate-800 truncate max-w-[90px] sm:max-w-[130px] md:max-w-[180px] lg:max-w-none">
          {getBreadcrumbTitle(activeModule)}
        </h1>
      </div>

      {/* Zone 1.5: Global Search Bar */}
      <div className="mx-1 sm:mx-2 shrink-0">
        <GlobalSearchBar />
      </div>

      {/* Zone 2: Multi-Tenant Switcher, Entity Tree Switcher & Quick Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Holding / Anak / Cucu Entity Selector */}
        {entities.length > 0 && (
          <div className="hidden xl:flex items-center">
            <div
              className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-200/80 rounded-md text-xs font-medium text-indigo-900 transition-colors"
              title="Pilih Entitas Aktif (Holding, Sub Holding, atau Cucu Perusahaan)"
            >
              <Network className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Entitas:</span>
              <select
                value={currentEntityId}
                onChange={(e) => setCurrentEntityId(e.target.value)}
                className="bg-transparent border-none outline-none font-semibold text-indigo-950 cursor-pointer text-xs max-w-[120px] truncate"
              >
                {entities.map((ent) => {
                  const prefix =
                    ent.level === 'holding'
                      ? '🏢 [Holding]'
                      : ent.level === 'anak'
                      ? '↳ 🏭 [Anak]'
                      : '  ↳ 🏪 [Cucu]';
                  return (
                    <option key={ent.id} value={ent.id}>
                      {prefix} {ent.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}

        {/* Tenant Selector (SaaS Apps Owner / Client Switcher) */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-700 transition-colors">
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={currentTenant.id}
              onChange={(e) => setCurrentTenantId(e.target.value)}
              className="bg-transparent border-none outline-none font-medium text-slate-800 cursor-pointer text-[11px] sm:text-xs max-w-[75px] sm:max-w-[110px] md:max-w-[120px] truncate"
              title="Pilih Tenant Platform SaaS"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sample Business Flow Reload Button (Compact on Tablet) */}
        <button
          onClick={() => {
            resetToSampleFlowData();
            setFlowResetSuccess(true);
            setTimeout(() => setFlowResetSuccess(false), 2500);
          }}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-xs font-semibold border transition-all shadow-xs shrink-0 ${
            flowResetSuccess
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
          }`}
          title="Muat ulang seluruh data contoh dan flow proses bisnis (10 Karyawan, Presensi, Approval, Payroll PPh21, SPPD, Offboarding, Kasbon)"
        >
          {flowResetSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-50" />
              <span className="hidden xl:inline font-bold">Flow Siap!</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden xl:inline font-bold">Flow Contoh (PT Nusantara)</span>
              <span className="hidden md:inline xl:hidden font-semibold">Flow Contoh</span>
            </>
          )}
        </button>

        {/* Migration Wizard Trigger */}
        <button
          onClick={onOpenMigrationWizard}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition-colors shadow-xs shrink-0"
          title="Wizard Setup & Migrasi"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Setup & Migrasi</span>
        </button>

        {/* Role Switcher for Testing RBAC */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="text-slate-500 hidden xl:inline">Peran:</span>
          <select
            value={currentUser.role}
            onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
            className="bg-transparent border-none outline-none font-semibold text-slate-800 cursor-pointer text-[11px] sm:text-xs"
          >
            <option value="super_admin">Super Admin</option>
            <option value="hr_admin">HR Admin</option>
            <option value="payroll_admin">Payroll Admin</option>
            <option value="ga_admin">GA Admin</option>
            <option value="employee">Employee (ESS)</option>
          </select>
        </div>

        {/* User Profile Info */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 sm:border-l sm:border-slate-200 shrink-0">
          <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
            {currentUser.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="hidden 2xl:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-500">{roleLabels[currentUser.role]}</div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors shrink-0"
              title="Keluar / Logout Akun Perusahaan"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

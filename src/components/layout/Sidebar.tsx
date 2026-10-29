import React from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calculator,
  Wallet,
  Target,
  AlertTriangle,
  UserPlus,
  UserMinus,
  QrCode,
  ShoppingCart,
  FileText,
  Building,
  UploadCloud,
  ChevronRight,
  TrendingUp,
  Plane,
  ShieldCheck,
  KeyRound,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  UserCheck,
  History,
  Network,
  BarChart3,
  MapPin,
} from 'lucide-react';

interface SidebarProps {
  onOpenMigrationWizard: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isDesktopCollapsed?: boolean;
  onToggleDesktopCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenMigrationWizard,
  isMobileOpen = false,
  onCloseMobile,
  isDesktopCollapsed = false,
  onToggleDesktopCollapse,
}) => {
  const { activeModule, setActiveModule, currentTenant, employees, officeLocations } = useHrms();

  const navigationGroups = [
    {
      title: 'PORTAL MANDIRI (SELF-SERVICE)',
      items: [
        { id: 'ess', label: 'ESS (Employee Self-Service)', icon: UserCheck },
        { id: 'mss', label: 'MSS (Manager Self-Service)', icon: ShieldCheck },
      ],
    },
    {
      title: 'OPERASIONAL & PERSONALIA',
      items: [
        { id: 'dashboard', label: 'Ringkasan Dashboard', icon: LayoutDashboard },
        { id: 'organization', label: 'Struktur Organisasi', icon: Network },
        {
          id: 'office_locations',
          label: 'Lokasi Kantor',
          icon: MapPin,
          badge: officeLocations.length,
        },
        { id: 'recruitment', label: 'Rekrutmen & Onboarding', icon: UserPlus },
        {
          id: 'employees',
          label: 'Management Karyawan',
          icon: Users,
          badge: employees.length,
        },
        { id: 'personalia', label: 'Personalia', icon: TrendingUp },
        { id: 'attendance', label: 'Presensi', icon: Clock },
        { id: 'trips', label: 'Perjalanan Dinas', icon: Plane },
        { id: 'approvals', label: 'Approval', icon: ShieldCheck },
      ],
    },
    {
      title: 'PUSAT LAPORAN & ANALISIS',
      items: [
        { id: 'reports', label: 'Laporan & Analisis', icon: BarChart3, badge: 'New' },
      ],
    },
    {
      title: 'KOMPENSASI & KEUANGAN',
      items: [
        { id: 'payroll', label: 'Payroll', icon: Calculator },
        { id: 'loans', label: 'Pinjaman', icon: Wallet },
      ],
    },
    {
      title: 'TALENTA & KEPATUHAN',
      items: [
        { id: 'kpi', label: 'Penilaian (KPI & OKR)', icon: Target },
        { id: 'compliance', label: 'Kepatuhan & Sanksi SP/PHK', icon: AlertTriangle },
        { id: 'offboarding', label: 'Offboarding', icon: UserMinus },
      ],
    },
    {
      title: 'GENERAL AFFAIRS & PENGADAAN',
      items: [
        { id: 'assets', label: 'General Affair', icon: QrCode },
        { id: 'procurement', label: 'Procurement', icon: ShoppingCart },
        { id: 'documents', label: 'Manajemen Dokumen', icon: FileText },
      ],
    },
    {
      title: 'ADMINISTRASI & SAAS OWNER',
      items: [
        { id: 'rbac', label: 'Management User', icon: KeyRound },
        { id: 'audit', label: 'Audit Trail & Log Aktivitas', icon: History },
        { id: 'tenants', label: 'Manajemen Tenant', icon: Building },
      ],
    },
  ];

  const handleSelectModule = (id: string) => {
    setActiveModule(id);
    onCloseMobile?.();
  };

  const handleOpenWizard = () => {
    onOpenMigrationWizard();
    onCloseMobile?.();
  };

  const renderSidebarInner = (isMobileView = false, isCollapsed = false) => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Zone */}
      <div
        className={`h-13 flex items-center border-b border-slate-800 shrink-0 ${
          isCollapsed ? 'flex-col justify-center gap-1.5 py-2' : 'justify-between px-3.5'
        }`}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} truncate`}>
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
            N
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <div className="font-bold text-white text-xs tracking-tight leading-none truncate">
                NusaHR Enterprise
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">
                Multi-Tenant SaaS
              </div>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        {isMobileView && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Tutup Menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Desktop Collapse / Expand Button */}
        {!isMobileView && onToggleDesktopCollapse && (
          <button
            onClick={onToggleDesktopCollapse}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title={isCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
            aria-label={isCollapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Migration Quick Banner */}
      {!isCollapsed ? (
        <div className="p-2.5 mx-3 my-2 bg-slate-800/80 rounded-lg border border-slate-700/60 shrink-0">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span className="font-semibold text-white text-[11px]">Setup & Migrasi</span>
            <span className="text-[9px] bg-indigo-900/60 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
              v2026
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-snug mb-2">
            Import data master karyawan via spreadsheet.
          </p>
          <button
            onClick={handleOpenWizard}
            className="w-full flex items-center justify-center gap-1.5 py-1 px-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium rounded transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Wizard Migrasi</span>
          </button>
        </div>
      ) : (
        <div className="py-2 flex justify-center border-b border-slate-800/80">
          <button
            onClick={handleOpenWizard}
            className="w-9 h-9 flex items-center justify-center text-indigo-300 hover:text-white bg-slate-800/80 hover:bg-indigo-600 rounded-lg transition-colors"
            title="Wizard Setup & Migrasi Data"
          >
            <UploadCloud className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Nav List */}
      <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-1.5 py-2 space-y-1' : 'px-2.5 py-2 space-y-3'}`}>
        {navigationGroups.map((group, groupIdx) => (
          <div key={group.title}>
            {!isCollapsed ? (
              <div className="px-2 text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {group.title}
              </div>
            ) : (
              groupIdx > 0 && <div className="border-t border-slate-800/80 my-2 mx-1.5" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectModule(item.id)}
                    title={item.label}
                    className={`relative flex items-center ${
                      isCollapsed
                        ? 'w-9 h-9 mx-auto justify-center rounded-lg'
                        : 'w-full justify-between px-2.5 py-1.5 rounded-md text-xs'
                    } font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-400 ring-2 ring-slate-900" />
                    )}

                    {!isCollapsed && item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          isActive ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Tenant Info */}
      <div
        className={`p-2.5 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-400 flex items-center shrink-0 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!isCollapsed ? (
          <>
            <div className="truncate">
              <div className="text-white font-medium text-xs truncate">{currentTenant.name}</div>
              <div className="text-[10px] text-slate-400">
                UMR: Rp {currentTenant.umr.toLocaleString('id-ID')}
              </div>
            </div>
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
              {currentTenant.planTier}
            </span>
          </>
        ) : (
          <div
            className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 font-bold text-xs"
            title={`${currentTenant.name} (${currentTenant.planTier}) - UMR Rp ${currentTenant.umr.toLocaleString('id-ID')}`}
          >
            {currentTenant.code.slice(0, 2)}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent / Collapsible Sidebar (w-14 when hidden into icon-rail, w-60 when expanded) */}
      <aside
        className={`hidden lg:flex ${
          isDesktopCollapsed ? 'w-14' : 'w-60'
        } transition-all duration-200 bg-slate-900 text-slate-300 flex-col shrink-0 select-none border-r border-slate-800 h-full`}
      >
        {renderSidebarInner(false, isDesktopCollapsed)}
      </aside>

      {/* Mobile & Tablet Drawer Modal */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fadeIn">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Slide-out Sidebar Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slideRight">
            {renderSidebarInner(true, false)}
          </div>
        </div>
      )}
    </>
  );
};

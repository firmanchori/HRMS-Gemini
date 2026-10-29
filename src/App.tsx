import React, { useState, useEffect } from 'react';
import { HrmsProvider, useHrms } from './context/HrmsContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MigrationWizardModal } from './components/modules/MigrationWizardModal';
import { DashboardOverview } from './components/modules/DashboardOverview';
import { OrganizationManagement } from './components/modules/OrganizationManagement';
import { OfficeLocationManagement } from './components/modules/OfficeLocationManagement';
import { EmployeeManagement } from './components/modules/EmployeeManagement';
import { AttendanceManagement } from './components/modules/AttendanceManagement';
import { PayrollManagement } from './components/modules/PayrollManagement';
import { LoanManagement } from './components/modules/LoanManagement';
import { PerformanceKpi } from './components/modules/PerformanceKpi';
import { ComplianceManagement } from './components/modules/ComplianceManagement';
import { RecruitmentManagement } from './components/modules/RecruitmentManagement';
import { OffboardingManagement } from './components/modules/OffboardingManagement';
import { GaAssetManagement } from './components/modules/GaAssetManagement';
import { ProcurementManagement } from './components/modules/ProcurementManagement';
import { DocumentManagement } from './components/modules/DocumentManagement';
import { PersonaliaManagement } from './components/modules/PersonaliaManagement';
import { BusinessTripManagement } from './components/modules/BusinessTripManagement';
import { ApprovalCenter } from './components/modules/ApprovalCenter';
import { RbacManagement } from './components/modules/RbacManagement';
import { TenantManagement } from './components/modules/TenantManagement';
import { EssPortal } from './components/modules/EssPortal';
import { MssPortal } from './components/modules/MssPortal';
import { AuditTrailManagement } from './components/modules/AuditTrailManagement';
import { ReportsManagement } from './components/modules/ReportsManagement';
import { UniversalFilePreviewModal } from './components/common/UniversalFilePreviewModal';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { CandidateOnlineTestPortal } from './components/modules/CandidateOnlineTestPortal';
import { LoginScreen } from './components/auth/LoginScreen';
import { UserRole } from './types/hrms';

const MainLayout: React.FC = () => {
  const { activeModule, setActiveModule, setCurrentUserRole } = useHrms();

  // Deteksi jika link tes online pelamar sedang dibuka via URL query param (?testToken=...)
  const [portalToken, setPortalToken] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('testToken') || params.get('token');
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('nusahr_is_logged_out') !== 'true';
  });
  const [isMigrationWizardOpen, setIsMigrationWizardOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B: Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (window.innerWidth < 1024) {
          setIsMobileSidebarOpen((prev) => !prev);
        } else {
          setIsDesktopCollapsed((prev) => !prev);
        }
      }
      // Ctrl/Cmd + K: Toggle Command Palette
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Escape: Close active modals
      else if (e.key === 'Escape') {
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
          return;
        }
        if (isMigrationWizardOpen) {
          setIsMigrationWizardOpen(false);
          return;
        }
        if (isMobileSidebarOpen) {
          setIsMobileSidebarOpen(false);
          return;
        }

        // Universal safety net: find topmost modal in the DOM and trigger its close button or backdrop
        const modalBackdrops = document.querySelectorAll<HTMLElement>('.fixed.inset-0');
        if (modalBackdrops.length > 0) {
          const topBackdrop = modalBackdrops[modalBackdrops.length - 1];
          const buttons = Array.from(topBackdrop.querySelectorAll<HTMLButtonElement>('button'));
          const closeBtn = buttons.find((btn) =>
            btn.querySelector('.lucide-x') ||
            btn.getAttribute('aria-label')?.toLowerCase().includes('close') ||
            btn.innerText?.trim().toLowerCase() === 'tutup' ||
            btn.innerText?.trim().toLowerCase() === 'batal'
          );
          if (closeBtn) {
            closeBtn.click();
          } else {
            topBackdrop.click();
          }
        }
      }
    };

    const handleOpenPalette = () => setIsCommandPaletteOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenPalette);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenPalette);
    };
  }, [isCommandPaletteOpen, isMigrationWizardOpen, isMobileSidebarOpen]);

  const renderModuleView = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <DashboardOverview
            onOpenMigrationWizard={() => setIsMigrationWizardOpen(true)}
            onOpenQRScanner={() => setActiveModule('assets')}
          />
        );
      case 'organization':
        return <OrganizationManagement />;
      case 'office_locations':
        return <OfficeLocationManagement />;
      case 'employees':
        return <EmployeeManagement />;
      case 'personalia':
        return <PersonaliaManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'trips':
        return <BusinessTripManagement />;
      case 'approvals':
        return <ApprovalCenter />;
      case 'payroll':
        return <PayrollManagement />;
      case 'loans':
        return <LoanManagement />;
      case 'kpi':
        return <PerformanceKpi />;
      case 'compliance':
        return <ComplianceManagement />;
      case 'recruitment':
        return <RecruitmentManagement />;
      case 'offboarding':
        return <OffboardingManagement />;
      case 'assets':
        return <GaAssetManagement />;
      case 'procurement':
        return <ProcurementManagement />;
      case 'documents':
        return <DocumentManagement />;
      case 'ess':
        return <EssPortal />;
      case 'mss':
        return <MssPortal />;
      case 'rbac':
        return <RbacManagement />;
      case 'audit':
        return <AuditTrailManagement />;
      case 'reports':
        return <ReportsManagement />;
      case 'tenants':
        return <TenantManagement />;
      default:
        return (
          <DashboardOverview
            onOpenMigrationWizard={() => setIsMigrationWizardOpen(true)}
            onOpenQRScanner={() => setActiveModule('assets')}
          />
        );
    }
  };

  // Jika URL membawa token tes online kandidat, buka langsung portal pengerjaan ujian
  if (portalToken) {
    return (
      <CandidateOnlineTestPortal
        testToken={portalToken}
        onClosePortal={() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setPortalToken(null);
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={(email, role) => {
          localStorage.removeItem('nusahr_is_logged_out');
          if (role) {
            setCurrentUserRole(role as UserRole);
          }
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900 text-[13px] antialiased">
      {/* Sidebar Navigation (Desktop Collapsible & Mobile/Tablet Drawer) */}
      <Sidebar
        onOpenMigrationWizard={() => setIsMigrationWizardOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleDesktopCollapse={() => setIsDesktopCollapsed((prev) => !prev)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenMigrationWizard={() => setIsMigrationWizardOpen(true)}
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setIsMobileSidebarOpen((prev) => !prev);
            } else {
              setIsDesktopCollapsed((prev) => !prev);
            }
          }}
          isDesktopCollapsed={isDesktopCollapsed}
          onLogout={() => {
            localStorage.setItem('nusahr_is_logged_out', 'true');
            setIsAuthenticated(false);
          }}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-6 bg-slate-50/70">
          <div className="max-w-[1600px] mx-auto">{renderModuleView()}</div>
        </main>
      </div>

      {/* Interactive Setup & Migration Wizard Modal */}
      <MigrationWizardModal
        isOpen={isMigrationWizardOpen}
        onClose={() => setIsMigrationWizardOpen(false)}
      />

      {/* Universal Document & File Preview Modal for Row Clicks */}
      <UniversalFilePreviewModal />

      {/* Global Command Palette (Ctrl/Cmd + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onToggleSidebar={() => {
          if (window.innerWidth < 1024) {
            setIsMobileSidebarOpen((prev) => !prev);
          } else {
            setIsDesktopCollapsed((prev) => !prev);
          }
        }}
        onOpenMigrationWizard={() => setIsMigrationWizardOpen(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <HrmsProvider>
      <MainLayout />
    </HrmsProvider>
  );
}

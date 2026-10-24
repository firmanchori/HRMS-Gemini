import React, { useState, useEffect } from 'react';
import { HrmsProvider, useHrms } from './context/HrmsContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MigrationWizardModal } from './components/modules/MigrationWizardModal';
import { DashboardOverview } from './components/modules/DashboardOverview';
import { OrganizationManagement } from './components/modules/OrganizationManagement';
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
import { UniversalFilePreviewModal } from './components/common/UniversalFilePreviewModal';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { UserRole } from './types/hrms';

const MainLayout: React.FC = () => {
  const { activeModule, setActiveModule, setCurrentUserRole } = useHrms();
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
    };

    const handleOpenPalette = () => setIsCommandPaletteOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenPalette);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenPalette);
    };
  }, []);

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

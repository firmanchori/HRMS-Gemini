import React, { useState, useMemo, useRef } from 'react';
import { useHrms } from '../../context/HrmsContext';
import { printPagesDirectly } from '../../utils/documentPdfExporter';
import {
  BarChart3,
  Users,
  UserPlus,
  Network,
  Building2,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  Briefcase,
  FileText,
  Sparkles,
  PieChart,
  HelpCircle,
  Layers,
  Award,
  ShieldCheck,
  ChevronRight,
  Eye,
  Check,
  X,
  TrendingUp,
  AlertCircle,
  Laptop,
  Mail,
  HeartPulse,
  UserCheck,
} from 'lucide-react';

export const ReportsManagement: React.FC = () => {
  const {
    candidates,
    jobRequisitions,
    vacancies,
    onboardingProcesses,
    employees,
    departments,
    divisions,
    masterJobPositions,
    entities,
    currentTenant,
  } = useHrms();

  // Active Report Tab
  const [activeTab, setActiveTab] = useState<'recruitment' | 'onboarding' | 'organization' | 'summary'>('recruitment');

  // Filter States
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Format IDR Helper
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // -------------------------------------------------------------
  // 1. REKRUTMEN ANALYTICS CALCULATIONS
  // -------------------------------------------------------------
  const recruitmentData = useMemo(() => {
    const totalApplicants = candidates.length;
    const hiredCandidates = candidates.filter((c) => c.stage === 'Hired');
    const rejectedCandidates = candidates.filter((c) => c.stage === 'Rejected');
    const inProgressCandidates = candidates.filter(
      (c) => c.stage !== 'Hired' && c.stage !== 'Rejected'
    );

    // Source Breakdown (Berapa pendaftar dan dari mana saja sumbernya)
    const sourceCounts: Record<string, { total: number; hired: number; rejected: number }> = {};
    candidates.forEach((c) => {
      const src = c.sourcePortal || 'Website Karir Perusahaan';
      if (!sourceCounts[src]) {
        sourceCounts[src] = { total: 0, hired: 0, rejected: 0 };
      }
      sourceCounts[src].total += 1;
      if (c.stage === 'Hired') sourceCounts[src].hired += 1;
      if (c.stage === 'Rejected') sourceCounts[src].rejected += 1;
    });

    const sourceBreakdown = Object.entries(sourceCounts)
      .map(([source, stats]) => ({
        source,
        total: stats.total,
        hired: stats.hired,
        rejected: stats.rejected,
        percent: totalApplicants > 0 ? Math.round((stats.total / totalApplicants) * 100) : 0,
        hireRate: stats.total > 0 ? Math.round((stats.hired / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Stage Funnel Breakdown
    const stageCounts = {
      Applied: candidates.filter((c) => c.stage === 'Applied' || c.stage === 'Incoming').length,
      Screening: candidates.filter((c) => c.stage === 'Screening').length,
      Assessment: candidates.filter((c) => c.stage === 'Assessment').length,
      Interview: candidates.filter((c) => c.stage === 'Interview').length,
      Mcu: candidates.filter((c) => c.stage === 'Medical Check-Up').length,
      Offering: candidates.filter((c) => c.stage === 'Offered').length,
      Hired: hiredCandidates.length,
      Rejected: rejectedCandidates.length,
    };

    // FPTK (Job Requisitions) Stats
    const totalFptk = jobRequisitions.length;
    const approvedFptk = jobRequisitions.filter((r) => r.status === 'Approved');
    const pendingFptk = jobRequisitions.filter((r) => r.status === 'Submitted' || r.status === 'Review');
    const rejectedFptk = jobRequisitions.filter((r) => r.status === 'Rejected');
    const draftFptk = jobRequisitions.filter((r) => r.status === 'Draft');

    // FPTK per Department
    const fptkByDept: Record<string, { total: number; approved: number; pending: number; rejected: number }> = {};
    jobRequisitions.forEach((r) => {
      const d = r.department || 'Umum';
      if (!fptkByDept[d]) {
        fptkByDept[d] = { total: 0, approved: 0, pending: 0, rejected: 0 };
      }
      fptkByDept[d].total += 1;
      if (r.status === 'Approved') fptkByDept[d].approved += 1;
      if (r.status === 'Submitted' || r.status === 'Review') fptkByDept[d].pending += 1;
      if (r.status === 'Rejected') fptkByDept[d].rejected += 1;
    });

    const conversionRate = totalApplicants > 0 ? ((hiredCandidates.length / totalApplicants) * 100).toFixed(1) : '0';

    return {
      totalApplicants,
      hiredCount: hiredCandidates.length,
      rejectedCount: rejectedCandidates.length,
      inProgressCount: inProgressCandidates.length,
      conversionRate,
      sourceBreakdown,
      stageCounts,
      totalFptk,
      approvedFptk: approvedFptk.length,
      pendingFptk: pendingFptk.length,
      rejectedFptk: rejectedFptk.length,
      draftFptk: draftFptk.length,
      fptkByDept,
    };
  }, [candidates, jobRequisitions]);

  // -------------------------------------------------------------
  // 2. ONBOARDING ANALYTICS CALCULATIONS
  // -------------------------------------------------------------
  const onboardingData = useMemo(() => {
    const totalOnboarding = onboardingProcesses.length;
    const completed = onboardingProcesses.filter((p) => p.status === 'Completed').length;
    const inProgress = onboardingProcesses.filter((p) => p.status === 'In Progress').length;

    // Breakdown Sumber Onboarding: Dari Hasil Rekrutmen vs Direct Entry
    const viaRecruitment = onboardingProcesses.filter((p) => p.source === 'recruitment').length;
    const viaDirect = onboardingProcesses.filter((p) => p.source === 'direct').length;

    // Average Checklist Completion
    let totalTasksCount = 0;
    let completedTasksCount = 0;
    let verifiedDossiers = 0;
    let allocatedLaptops = 0;
    let requestedIdCards = 0;
    let setupAccounts = 0;

    onboardingProcesses.forEach((p) => {
      const tasks = p.tasks || [];
      totalTasksCount += tasks.length;
      completedTasksCount += tasks.filter((t) => t.isCompleted).length;

      // Check specific onboarding milestones
      tasks.forEach((t) => {
        if (t.isCompleted) {
          if (t.actionType === 'dossier_verification' || t.title.toLowerCase().includes('berkas')) verifiedDossiers += 1;
          if (t.actionType === 'laptop_allocation' || t.title.toLowerCase().includes('laptop')) allocatedLaptops += 1;
          if (t.actionType === 'id_card_request' || t.title.toLowerCase().includes('id card')) requestedIdCards += 1;
          if (t.actionType === 'account_setup' || t.title.toLowerCase().includes('akun') || t.title.toLowerCase().includes('email')) setupAccounts += 1;
        }
      });
    });

    const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
    const finalizationRate = totalOnboarding > 0 ? Math.round((completed / totalOnboarding) * 100) : 0;

    return {
      totalOnboarding,
      completed,
      inProgress,
      viaRecruitment,
      viaDirect,
      completionRate,
      finalizationRate,
      verifiedDossiers,
      allocatedLaptops,
      requestedIdCards,
      setupAccounts,
    };
  }, [onboardingProcesses]);

  // -------------------------------------------------------------
  // 3. STRUKTUR ORGANISASI ANALYTICS CALCULATIONS
  // -------------------------------------------------------------
  const orgData = useMemo(() => {
    const totalEmployees = employees.length;
    const totalEntities = entities.length;
    const totalDivisions = divisions.length;
    const totalDepartments = departments.length;
    const totalPositions = masterJobPositions.length;

    // Total target headcount vs Headcount aktual terisi
    let totalTargetHeadcount = 0;
    let filledPositions = 0;
    let vacantPositions = 0;

    masterJobPositions.forEach((pos) => {
      const target = pos.targetHeadcount || 1;
      totalTargetHeadcount += target;
      if (pos.currentEmployeeId || (pos.currentHeadcount && pos.currentHeadcount > 0)) {
        filledPositions += pos.currentHeadcount || 1;
      } else {
        vacantPositions += 1;
      }
    });

    const occupancyRate = totalTargetHeadcount > 0 ? Math.round((totalEmployees / totalTargetHeadcount) * 100) : 100;

    // Distribution by Department
    const deptDistribution: Record<string, { count: number; permanent: number; contract: number; intern: number }> = {};
    employees.forEach((emp) => {
      const d = emp.department || 'Umum';
      if (!deptDistribution[d]) {
        deptDistribution[d] = { count: 0, permanent: 0, contract: 0, intern: 0 };
      }
      deptDistribution[d].count += 1;
      const status = (emp.employmentStatus || '').toLowerCase();
      if (status.includes('tetap') || status.includes('permanent') || status.includes('pkwtt')) {
        deptDistribution[d].permanent += 1;
      } else if (status.includes('magang') || status.includes('intern')) {
        deptDistribution[d].intern += 1;
      } else {
        deptDistribution[d].contract += 1;
      }
    });

    // Employment Status Summary
    const permanentCount = employees.filter((e) =>
      (e.employmentStatus || '').toLowerCase().includes('tetap') ||
      (e.employmentStatus || '').toLowerCase().includes('pkwtt')
    ).length;
    const contractCount = employees.filter((e) =>
      (e.employmentStatus || '').toLowerCase().includes('kontrak') ||
      (e.employmentStatus || '').toLowerCase().includes('pkwt')
    ).length;
    const internCount = employees.filter((e) =>
      (e.employmentStatus || '').toLowerCase().includes('magang') ||
      (e.employmentStatus || '').toLowerCase().includes('intern')
    ).length;

    return {
      totalEmployees,
      totalEntities,
      totalDivisions,
      totalDepartments,
      totalPositions,
      totalTargetHeadcount,
      filledPositions,
      vacantPositions,
      occupancyRate,
      deptDistribution,
      permanentCount,
      contractCount,
      internCount,
    };
  }, [employees, entities, divisions, departments, masterJobPositions]);

  // -------------------------------------------------------------
  // EXPORT HANDLERS
  // -------------------------------------------------------------
  const handleExportRecruitmentCsv = () => {
    const headers = [
      'Nama Kandidat',
      'Email',
      'No Telepon',
      'Posisi Lowongan',
      'Departemen',
      'Sumber Pelamar',
      'Tahapan Saat Ini',
      'Skor Screening',
      'Skor Tes',
      'Skor Wawancara',
      'Status MCU',
      'Status Akhir',
    ];

    const rows = candidates.map((c) => {
      const vac = vacancies.find((v) => v.id === c.jobVacancyId);
      return [
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.phone || '-'}"`,
        `"${vac?.title || '-'}"`,
        `"${vac?.department || '-'}"`,
        `"${c.sourcePortal || 'Website Karir'}"`,
        `"${c.stage}"`,
        `"${c.aiMatchScore || 85}%"`,
        `"${c.testScore || 0}"`,
        `"${c.interviewScore || 0}"`,
        `"${c.mcuStatus || '-'}"`,
        `"${c.stage === 'Hired' ? 'Diterima' : c.stage === 'Rejected' ? 'Ditolak' : 'Dalam Proses'}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Rekrutmen_${currentTenant?.code || 'NUSAHR'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportFptkCsv = () => {
    const headers = [
      'No FPTK',
      'Judul Posisi',
      'Departemen',
      'Jumlah Dibutuhkan',
      'Alasan Pengajuan',
      'Level Jabatan',
      'Status FPTK',
      'Target Tanggal Masuk',
      'Tanggal Pengajuan',
    ];

    const rows = jobRequisitions.map((r) => [
      `"${r.requisitionNumber || r.id}"`,
      `"${r.title}"`,
      `"${r.department}"`,
      `"${r.requiredCount || 1}"`,
      `"${r.reason || '-'}"`,
      `"${r.targetLevel || '-'}"`,
      `"${r.status}"`,
      `"${r.targetStartDate || '-'}"`,
      `"${r.createdAt || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Pengajuan_Karyawan_FPTK_${currentTenant?.code || 'NUSAHR'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportOnboardingCsv = () => {
    const headers = [
      'Nama Karyawan',
      'NIK Temp / Final',
      'Posisi',
      'Departemen',
      'Sumber Onboarding',
      'Tanggal Mulai (Join)',
      'Status Onboarding',
      'Checklist Selesai',
      'Total Checklist',
      'Persentase',
    ];

    const rows = onboardingProcesses.map((p) => {
      const completedTasks = (p.tasks || []).filter((t) => t.isCompleted).length;
      const totalTasks = (p.tasks || []).length;
      const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return [
        `"${p.employeeName}"`,
        `"${p.employeeNik || '-'}"`,
        `"${p.position}"`,
        `"${p.department}"`,
        `"${p.source === 'recruitment' ? 'Rekrutmen' : 'Direct Entry'}"`,
        `"${p.joinDate || '-'}"`,
        `"${p.status}"`,
        `"${completedTasks}"`,
        `"${totalTasks}"`,
        `"${pct}%"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Onboarding_${currentTenant?.code || 'NUSAHR'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportOrganizationCsv = () => {
    const headers = [
      'Nama Posisi / Jabatan',
      'Departemen',
      'Divisi',
      'Grade Level',
      'Target Formasi',
      'Headcount Aktual',
      'Status Formasi',
      'Pemegang Jabatan',
    ];

    const rows = masterJobPositions.map((pos) => {
      const emp = employees.find((e) => e.id === pos.currentEmployeeId);
      const isFilled = !!pos.currentEmployeeId || (pos.currentHeadcount && pos.currentHeadcount > 0);
      return [
        `"${pos.title}"`,
        `"${pos.department || '-'}"`,
        `"${pos.division || '-'}"`,
        `"${pos.gradeLevel || '-'}"`,
        `"${pos.targetHeadcount || 1}"`,
        `"${pos.currentHeadcount || (isFilled ? 1 : 0)}"`,
        `"${isFilled ? 'Terisi (Occupied)' : 'Kosong (Vacant)'}"`,
        `"${emp ? emp.name : isFilled ? 'Terisi' : 'Belum Ditugaskan'}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Struktur_Organisasi_${currentTenant?.code || 'NUSAHR'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportsContainerRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    if (!reportsContainerRef.current) return;
    try {
      await printPagesDirectly([reportsContainerRef.current]);
    } catch (err) {
      console.error('Print report failed:', err);
    }
  };

  return (
    <div ref={reportsContainerRef} className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full print:p-0">
      {/* ===================== HEADER UTAMA ===================== */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Pusat Laporan & Analitik</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Analytics Hub
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kompilasi laporan komprehensif, metrik rasio seleksi, alur onboarding, dan formasi organisasi.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Semua Periode (All Time)</option>
              <option value="month">Bulan Ini (Oktober 2026)</option>
              <option value="quarter">Kuartal 4 (Q4 2026)</option>
              <option value="year">Tahun Berjalan (2026)</option>
            </select>
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Cetak Laporan ke PDF / Printer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Cetak Dokumen</span>
          </button>

          {/* Export Dropdown Button based on active tab */}
          {activeTab === 'recruitment' && (
            <button
              type="button"
              onClick={handleExportRecruitmentCsv}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Unduh Data Rekrutmen ke File CSV (Excel)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Pelamar</span>
            </button>
          )}

          {activeTab === 'onboarding' && (
            <button
              type="button"
              onClick={handleExportOnboardingCsv}
              className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Unduh Data Onboarding ke File CSV (Excel)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Onboarding</span>
            </button>
          )}

          {activeTab === 'organization' && (
            <button
              type="button"
              onClick={handleExportOrganizationCsv}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Unduh Data Formasi Organisasi ke File CSV (Excel)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Formasi</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================== NAVIGASI TAB MODUL LAPORAN ===================== */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('recruitment')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'recruitment'
              ? 'border-blue-700 text-blue-800 bg-white shadow-2xs rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <UserPlus className="w-4 h-4 text-blue-600" />
          <span>1. Laporan Rekrutmen & Pelamar</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
            {candidates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('onboarding')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'onboarding'
              ? 'border-indigo-700 text-indigo-800 bg-white shadow-2xs rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>2. Laporan Onboarding</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
            {onboardingProcesses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('organization')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'organization'
              ? 'border-emerald-700 text-emerald-800 bg-white shadow-2xs rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <Network className="w-4 h-4 text-emerald-600" />
          <span>3. Laporan Struktur Organisasi</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
            {masterJobPositions.length} Posisi
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'summary'
              ? 'border-amber-700 text-amber-800 bg-white shadow-2xs rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <PieChart className="w-4 h-4 text-amber-600" />
          <span>4. Ringkasan Eksekutif & AI Insight</span>
        </button>
      </div>

      {/* ===================== TAB 1: LAPORAN REKRUTMEN & PELAMAR ===================== */}
      {activeTab === 'recruitment' && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Pendaftar Masuk
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{recruitmentData.totalApplicants}</span>
                <span className="text-xs text-blue-600 font-semibold">Semua Sumber</span>
              </div>
              <p className="text-[10px] text-slate-400">Total kandidat terdata di pipeline</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Pelamar Diterima (Hired)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600">{recruitmentData.hiredCount}</span>
                <span className="text-xs text-emerald-700 font-semibold">({recruitmentData.conversionRate}%)</span>
              </div>
              <p className="text-[10px] text-slate-400">Telah lulus seluruh tahapan seleksi</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Pelamar Ditolak (Gugur)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-600">{recruitmentData.rejectedCount}</span>
                <span className="text-xs text-slate-400 font-semibold">Tidak memenuhi kualifikasi</span>
              </div>
              <p className="text-[10px] text-slate-400">Disaring di tahap screening/ujian/interview</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Pengajuan Karyawan (FPTK)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-700">{recruitmentData.totalFptk}</span>
                <span className="text-xs text-emerald-600 font-semibold">
                  {recruitmentData.approvedFptk} Disetujui
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {recruitmentData.pendingFptk} Menunggu · {recruitmentData.rejectedFptk} Ditolak
              </p>
            </div>
          </div>

          {/* 2 Kolom: Laporan Sumber Pelamar & Funnel Konversi Tahapan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Laporan Sumber Pelamar (Berapa Pendaftar dari Mana Saja Sumbernya) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-blue-600" />
                    <span>Laporan Sumber Pendaftar (Applicant Channels)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sebaran asal pelamar dan efektivitas portal dalam menyumbang kandidat diterima.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {recruitmentData.sourceBreakdown.map((src, sIdx) => (
                  <div key={sIdx} className="space-y-1.5 p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        <span className="font-bold text-slate-800">{src.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{src.total} Pelamar</span>
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                          {src.percent}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${src.percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      <span>Diterima: <strong className="text-emerald-700">{src.hired} orang</strong></span>
                      <span>Ditolak: <strong className="text-rose-700">{src.rejected} orang</strong></span>
                      <span>Tingkat Sukses: <strong className="text-slate-800">{src.hireRate}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Laporan Funnel Konversi Tahapan Seleksi */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Laporan Alur Seleksi & Drop-off (Funnel)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Perjalanan pelamar dari pendaftaran hingga diterbitkan offering letter dan diterima kerja.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: '1. Lamaran Masuk (Incoming/Applied)', count: recruitmentData.stageCounts.Applied, color: 'bg-blue-600' },
                  { label: '2. Screening CV & Profiling', count: recruitmentData.stageCounts.Screening, color: 'bg-indigo-600' },
                  { label: '3. Assessment & Tes Kemampuan', count: recruitmentData.stageCounts.Assessment, color: 'bg-purple-600' },
                  { label: '4. Wawancara (Interview User/HR)', count: recruitmentData.stageCounts.Interview, color: 'bg-amber-600' },
                  { label: '5. Medical Check-Up (MCU)', count: recruitmentData.stageCounts.Mcu, color: 'bg-teal-600' },
                  { label: '6. Offering Letter & Kesepakatan', count: recruitmentData.stageCounts.Offering, color: 'bg-emerald-600' },
                  { label: '7. Diterima Kerja (Hired & Onboarding)', count: recruitmentData.stageCounts.Hired, color: 'bg-emerald-700' },
                ].map((stg, idx) => {
                  const pct = recruitmentData.totalApplicants > 0
                    ? Math.round((stg.count / recruitmentData.totalApplicants) * 100)
                    : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{stg.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{stg.count} kandidat</span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stg.color}`}
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Laporan Pengajuan Karyawan Baru (FPTK / Job Requisitions) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-700" />
                  <span>Laporan Pengajuan Karyawan Baru (FPTK - Form Permintaan Tenaga Kerja)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Analisis permohonan penambahan formasi: berapa yang disetujui, menunggu persetujuan, dan ditolak.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportFptkCsv}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV FPTK</span>
              </button>
            </div>

            {/* Matriks Status FPTK */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Disetujui (Approved)</span>
                <span className="text-xl font-black text-emerald-900">{recruitmentData.approvedFptk}</span>
                <p className="text-[10px] text-emerald-700">Diteruskan menjadi lowongan aktif</p>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Menunggu Approval (Pending)</span>
                <span className="text-xl font-black text-amber-900">{recruitmentData.pendingFptk}</span>
                <p className="text-[10px] text-amber-700">Dalam proses review BOD & HR</p>
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-rose-800 uppercase block">Ditolak (Rejected)</span>
                <span className="text-xl font-black text-rose-900">{recruitmentData.rejectedFptk}</span>
                <p className="text-[10px] text-rose-700">Tidak disetujui / formasi berlebih</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Konsep (Draft)</span>
                <span className="text-xl font-black text-slate-800">{recruitmentData.draftFptk}</span>
                <p className="text-[10px] text-slate-500">Belum diajukan oleh user departemen</p>
              </div>
            </div>

            {/* Tabel FPTK per Departemen */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Departemen Pemohon</th>
                    <th className="py-2.5 px-3 text-center">Total Pengajuan</th>
                    <th className="py-2.5 px-3 text-center">Disetujui</th>
                    <th className="py-2.5 px-3 text-center">Menunggu Review</th>
                    <th className="py-2.5 px-3 text-center">Ditolak</th>
                    <th className="py-2.5 px-3 text-center">Rasio Persetujuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(recruitmentData.fptkByDept).map(([dept, stats], dIdx) => {
                    const rate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
                    return (
                      <tr key={dIdx} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{dept}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800">{stats.total}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-emerald-700">{stats.approved}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-amber-700">{stats.pending}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-rose-700">{stats.rejected}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            rate >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: LAPORAN ONBOARDING ===================== */}
      {activeTab === 'onboarding' && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Karyawan Onboarding
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{onboardingData.totalOnboarding}</span>
                <span className="text-xs text-indigo-600 font-semibold">Semua Jalur</span>
              </div>
              <p className="text-[10px] text-slate-400">Dalam proses orientasi dan verifikasi</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Onboarding Selesai (Final)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600">{onboardingData.completed}</span>
                <span className="text-xs text-emerald-700 font-semibold">({onboardingData.finalizationRate}%)</span>
              </div>
              <p className="text-[10px] text-slate-400">100% tervalidasi & terbit NIK aktif</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Sedang Berjalan (In Progress)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-600">{onboardingData.inProgress}</span>
                <span className="text-xs text-amber-700 font-semibold">Checklist aktif</span>
              </div>
              <p className="text-[10px] text-slate-400">Dalam pemenuhan berkas & aset</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Penyelesaian Checklist
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-700">{onboardingData.completionRate}%</span>
                <span className="text-xs text-slate-500">Rata-rata</span>
              </div>
              <p className="text-[10px] text-slate-400">Tingkat kepatuhan kelengkapan task</p>
            </div>
          </div>

          {/* Rincian Verifikasi 4 Pilar Onboarding */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Status Pemenuhan 4 Pilar Onboarding (Dossier, IT, GA & Akun)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Verifikasi Berkas Dossier</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                    {onboardingData.verifiedDossiers} Karyawan
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  KTP, NPWP, BPJS Ketenagakerjaan & Kesehatan, Rekening Gaji, dan Kontak Darurat.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Alokasi Laptop Kerja IT</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                    {onboardingData.allocatedLaptops} Terdistribusi
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Nomor seri, barcode aset IT, spesifikasi perangkat, dan penandatanganan BAST.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pengajuan ID Card GA</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                    {onboardingData.requestedIdCards} Kartu
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Cetak kartu tanda pengenal, nomor kartu RFID, dan akses pintu gedung kantor.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-600" />
                    <span>Provisioning Akun & Email</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                    {onboardingData.setupAccounts} Akun
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Email korporat (@nusahr.id), ERP, SSO sistem, dan notifikasi ke email pribadi.
                </p>
              </div>
            </div>
          </div>

          {/* Tabel Log Onboarding Karyawan */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Daftar Karyawan Baru dalam Alur Onboarding</h3>
              <span className="text-xs text-slate-500 font-semibold">
                Total {onboardingProcesses.length} Karyawan
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Nama Karyawan</th>
                    <th className="py-2.5 px-3">Posisi & Departemen</th>
                    <th className="py-2.5 px-3">Jalur Masuk</th>
                    <th className="py-2.5 px-3">Tanggal Join</th>
                    <th className="py-2.5 px-3">Status Checklist</th>
                    <th className="py-2.5 px-3 text-center">Status Onboarding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {onboardingProcesses.map((p) => {
                    const completedTasks = (p.tasks || []).filter((t) => t.isCompleted).length;
                    const totalTasks = (p.tasks || []).length;
                    const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{p.employeeName}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-slate-800 block">{p.position}</span>
                          <span className="text-[10px] text-slate-500">{p.department}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.source === 'recruitment' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {p.source === 'recruitment' ? 'Rekrutmen' : 'Direct Entry'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{p.joinDate || '2026-10-25'}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{completedTasks}/{totalTasks} Task</span>
                            <span className="text-[10px] font-semibold text-slate-500">({pct}%)</span>
                          </div>
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            p.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status === 'Completed' ? 'Selesai (Aktif)' : 'Sedang Berjalan'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: LAPORAN STRUKTUR ORGANISASI ===================== */}
      {activeTab === 'organization' && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Karyawan Aktif
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{orgData.totalEmployees}</span>
                <span className="text-xs text-emerald-600 font-semibold">Headcount Aktual</span>
              </div>
              <p className="text-[10px] text-slate-400">Terdaftar di seluruh entitas & departemen</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Formasi Jabatan
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-700">{orgData.totalPositions}</span>
                <span className="text-xs text-blue-600 font-semibold">Master Jabatan</span>
              </div>
              <p className="text-[10px] text-slate-400">
                {orgData.totalDivisions} Divisi · {orgData.totalDepartments} Departemen
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Okupansi Formasi Jabatan
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600">{orgData.occupancyRate}%</span>
                <span className="text-xs text-slate-500 font-semibold">Terisi</span>
              </div>
              <p className="text-[10px] text-slate-400">{orgData.vacantPositions} Formasi Masih Kosong (Vacant)</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Entitas Perusahaan (Holding)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-purple-700">{orgData.totalEntities}</span>
                <span className="text-xs text-purple-600 font-semibold">PT / Unit</span>
              </div>
              <p className="text-[10px] text-slate-400">Holding & entitas anak perusahaan aktif</p>
            </div>
          </div>

          {/* Distribusi Headcount per Departemen */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Sebaran Headcount & Status Karyawan per Departemen</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Komposisi karyawan tetap (PKWTT), kontrak (PKWT), dan magang di masing-masing departemen.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Departemen</th>
                    <th className="py-2.5 px-3 text-center">Headcount Karyawan</th>
                    <th className="py-2.5 px-3 text-center">Karyawan Tetap</th>
                    <th className="py-2.5 px-3 text-center">Karyawan Kontrak</th>
                    <th className="py-2.5 px-3 text-center">Magang (Intern)</th>
                    <th className="py-2.5 px-3 text-center">Porsi (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(orgData.deptDistribution).map(([dept, stats], dIdx) => {
                    const pct = orgData.totalEmployees > 0 ? Math.round((stats.count / orgData.totalEmployees) * 100) : 0;
                    return (
                      <tr key={dIdx} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{dept}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900">{stats.count} orang</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-emerald-700">{stats.permanent}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-blue-700">{stats.contract}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-amber-700">{stats.intern}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800">
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formasi Jabatan: Okupansi Terisi vs Vacant */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Network className="w-4 h-4 text-blue-600" />
                  <span>Daftar Formasi Jabatan & Okupansi (Kamus Jabatan)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitoring posisi yang sudah terisi pemegang jabatan vs posisi yang masih kosong (vacant).
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Nama Posisi / Jabatan</th>
                    <th className="py-2.5 px-3">Departemen & Divisi</th>
                    <th className="py-2.5 px-3">Grade Level</th>
                    <th className="py-2.5 px-3 text-center">Target Formasi</th>
                    <th className="py-2.5 px-3 text-center">Status Okupansi</th>
                    <th className="py-2.5 px-3">Pemegang Jabatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {masterJobPositions.map((pos) => {
                    const emp = employees.find((e) => e.id === pos.currentEmployeeId);
                    const isFilled = !!pos.currentEmployeeId || (pos.currentHeadcount && pos.currentHeadcount > 0);

                    return (
                      <tr key={pos.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{pos.title}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {pos.department || 'Umum'} · <span className="text-slate-400">{pos.division || 'Operasional'}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{pos.gradeLevel || 'Staff'}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900">{pos.targetHeadcount || 1} orang</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            isFilled
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {isFilled ? 'Terisi (Occupied)' : 'Kosong (Vacant)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {emp ? (
                            <span className="font-semibold text-blue-900">{emp.name}</span>
                          ) : isFilled ? (
                            <span className="text-slate-700">Karyawan Ditugaskan</span>
                          ) : (
                            <span className="text-slate-400 italic">Perlu Rekrutmen Baru</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 4: RINGKASAN EKSEKUTIF & AI INSIGHT ===================== */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Executive Overview Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Laporan Eksekutif & AI Talent Intelligence
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">
                Analitik Kinerja SDM, Efisiensi Saluran Rekrutmen & Beban Organisasi
              </h3>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                Berdasarkan data terkini dari seluruh pendaftar, alur seleksi, proses onboarding, dan formasi jabatan,
                sistem mendeteksi tren strategis untuk mengoptimalkan perencanaan tenaga kerja (Workforce Planning).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white/10 p-3 rounded-xl border border-white/15 space-y-1">
                <span className="text-[10px] text-slate-300 uppercase block font-semibold">Saluran Perekrutan Terbaik</span>
                <p className="text-sm font-bold text-emerald-300">
                  {recruitmentData.sourceBreakdown[0]?.source || 'Portal Karir'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Menyumbang {recruitmentData.sourceBreakdown[0]?.percent || 0}% pelamar dengan rasio lolos tertinggi.
                </p>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/15 space-y-1">
                <span className="text-[10px] text-slate-300 uppercase block font-semibold">Efisiensi Onboarding</span>
                <p className="text-sm font-bold text-blue-300">
                  {onboardingData.finalizationRate}% Tingkat Finalisasi
                </p>
                <p className="text-[10px] text-slate-400">
                  Karyawan baru menyelesaikan checklist verifikasi dalam rata-rata 3 hari kerja.
                </p>
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/15 space-y-1">
                <span className="text-[10px] text-slate-300 uppercase block font-semibold">Kapasitas Formasi Organisasi</span>
                <p className="text-sm font-bold text-amber-300">
                  {orgData.occupancyRate}% Formasi Terisi
                </p>
                <p className="text-[10px] text-slate-400">
                  Tersisa {orgData.vacantPositions} formasi jabatan yang perlu dibuka rekrutmennya.
                </p>
              </div>
            </div>
          </div>

          {/* RoadMap Laporan Modul Selanjutnya (Extensible Architecture) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Integrasi Laporan Modul HRMS Selanjutnya
              </h4>
            </div>
            <p className="text-xs text-slate-600">
              Menu Laporan ini dirancang terintegrasi dan otomatis bertambah seiring penyelesaian alur modul berikutnya:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 opacity-75">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Laporan Payroll & PPh 21</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-600">
                    Modul Berikutnya
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Akumulasi gaji bruto/netto, rekap TER PPh 21, BPJS TK & Kes, serta rekapitulasi slip gaji.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 opacity-75">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Laporan Presensi & Cuti</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-600">
                    Modul Berikutnya
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Rekap kehadiran bulanan, keterlambatan, lembur, dan utilisasi saldo hak cuti tahunan.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 opacity-75">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Laporan Kinerja & KPI</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-600">
                    Modul Berikutnya
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Evaluasi pencapaian target individual & tim, distribusi kurva kinerja, dan matriks talenta.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

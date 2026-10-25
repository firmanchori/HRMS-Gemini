import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  Search,
  X,
  LayoutDashboard,
  Users,
  TrendingUp,
  Clock,
  Plane,
  ShieldCheck,
  Calculator,
  Wallet,
  Target,
  AlertTriangle,
  UserPlus,
  UserMinus,
  QrCode,
  ShoppingCart,
  FileText,
  KeyRound,
  Building,
  UploadCloud,
  RotateCcw,
  PanelLeft,
  ArrowRight,
  Sparkles,
  Command,
  CornerDownLeft,
  User,
  Box,
  Check,
  Building2,
  History,
  Network,
  BarChart3,
} from 'lucide-react';
import { Employee, GAAsset, OfficialDocument, UserRole } from '../../types/hrms';

export type CommandCategory = 'all' | 'modules' | 'employees' | 'assets' | 'documents' | 'actions';

interface ModuleDefinition {
  id: string;
  name: string;
  group: string;
  description: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const ALL_MODULES: ModuleDefinition[] = [
  {
    id: 'dashboard',
    name: 'Ringkasan Dashboard',
    group: 'Operasional & Personalia',
    description: 'Statistik eksekutif, KPI utama, proses aktif, dan ringkasan operasional lintas modul',
    keywords: ['dashboard', 'home', 'ringkasan', 'beranda', 'kpi', 'grafik', 'ikhtisar', 'overview'],
    icon: LayoutDashboard,
  },
  {
    id: 'organization',
    name: 'Struktur Organisasi & Tree',
    group: 'Operasional & Personalia',
    description: 'Bagan organisasi interaktif, relasi korporasi Holding/Anak/Cucu, pengaturan Divisi & Departemen fleksibel',
    keywords: ['organisasi', 'struktur', 'tree', 'bagan', 'holding', 'anak perusahaan', 'cucu perusahaan', 'divisi', 'departemen', 'jabatan', 'posisi'],
    icon: Network,
  },
  {
    id: 'reports',
    name: 'Pusat Laporan & Analitik',
    group: 'Laporan & Analitik',
    description: 'Kompilasi laporan terpadu: rekrutmen, rasio pelamar, alur onboarding, dan formasi struktur organisasi',
    keywords: ['laporan', 'report', 'analitik', 'analytics', 'rekrutmen', 'onboarding', 'organisasi', 'fptk', 'pendaftar', 'pelamar', 'headcount'],
    icon: BarChart3,
  },
  {
    id: 'employees',
    name: 'Management Karyawan',
    group: 'Operasional & Personalia',
    description: 'Database karyawan, dosier digital lengkap, riwayat karir, dan data NIK/KTP',
    keywords: ['karyawan', 'pegawai', 'employee', 'dosier', 'nik', 'ktp', 'kontrak', 'staff', 'personel'],
    icon: Users,
  },
  {
    id: 'personalia',
    name: 'Personalia (Promosi & Demosi)',
    group: 'Operasional & Personalia',
    description: 'Manajemen pergerakan karir, promosi jabatan, rotasi, demosi, dan mutasi',
    keywords: ['personalia', 'promosi', 'demosi', 'mutasi', 'rotasi', 'karir', 'jabatan', 'grade'],
    icon: TrendingUp,
  },
  {
    id: 'attendance',
    name: 'Presensi, Shift & Cuti',
    group: 'Operasional & Personalia',
    description: 'Pencatatan kehadiran, geofencing, shift roster, tukar shift, lembur, dan cuti',
    keywords: ['presensi', 'absensi', 'kehadiran', 'shift', 'cuti', 'leave', 'lembur', 'overtime', 'clock in', 'absen'],
    icon: Clock,
  },
  {
    id: 'trips',
    name: 'Perjalanan Dinas (SPPD)',
    group: 'Operasional & Personalia',
    description: 'Pengajuan surat perintah perjalanan dinas, estimasi biaya, akomodasi, dan reimbursement',
    keywords: ['sppd', 'perjalanan dinas', 'dinas', 'travel', 'tiket', 'hotel', 'uang saku', 'reimbursement'],
    icon: Plane,
  },
  {
    id: 'approvals',
    name: 'Pusat Approval Bertingkat',
    group: 'Operasional & Personalia',
    description: 'Pusat persetujuan cuti, lembur, SPPD, pembelian, kasbon, dan pendelegasian wewenang',
    keywords: ['approval', 'persetujuan', 'verifikasi', 'delegasi', 'atasan', 'approve', 'reject'],
    icon: ShieldCheck,
  },
  {
    id: 'payroll',
    name: 'Payroll & PPh 21 TER 2024',
    group: 'Kompensasi & Keuangan',
    description: 'Penggajian otomatis, perhitungan tarif efektif rata-rata (TER), BPJS, dan slip gaji',
    keywords: ['payroll', 'gaji', 'pph 21', 'ter 2024', 'pajak', 'slip gaji', 'bpjs', 'tunjangan', 'thr', 'take home pay'],
    icon: Calculator,
  },
  {
    id: 'loans',
    name: 'Pinjaman & Kasbon Karyawan',
    group: 'Kompensasi & Keuangan',
    description: 'Simulasi plafon kasbon, jadwal angsuran, approval pinjaman, dan potong gaji otomatis',
    keywords: ['pinjaman', 'kasbon', 'loan', 'angsuran', 'cicilan', 'bunga', 'potong gaji', 'keuangan'],
    icon: Wallet,
  },
  {
    id: 'kpi',
    name: 'Penilaian Kinerja (KPI Real-time)',
    group: 'Talenta & Kepatuhan',
    description: 'Target kinerja karyawan, tracking OKR kuartalan, evaluasi berkala, dan scoring',
    keywords: ['kpi', 'kinerja', 'performance', 'okr', 'penilaian', 'evaluasi', 'target', 'bobot'],
    icon: Target,
  },
  {
    id: 'compliance',
    name: 'Kepatuhan & Sanksi (SP/PHK)',
    group: 'Talenta & Kepatuhan',
    description: 'Pemberian Surat Peringatan (SP 1/2/3), audit kepatuhan, dan catatan indisipliner',
    keywords: ['kepatuhan', 'sanksi', 'sp', 'surat peringatan', 'indisipliner', 'pelanggaran', 'phk', 'teguran'],
    icon: AlertTriangle,
  },
  {
    id: 'recruitment',
    name: 'Rekrutmen & Onboarding',
    group: 'Operasional & Personalia',
    description: 'Pemasangan lowongan, screening kandidat, penjadwalan interview, offering letter, dan alur onboarding',
    keywords: ['rekrutmen', 'recruitment', 'onboarding', 'lowongan', 'job', 'kandidat', 'pelamar', 'interview', 'offering letter', 'hiring'],
    icon: UserPlus,
  },
  {
    id: 'offboarding',
    name: 'Offboarding & Pesangon PP 35/2021',
    group: 'Talenta & Kepatuhan',
    description: 'Proses pengunduran diri/PHK, kalkulator kompensasi pesangon, dan exit clearance',
    keywords: ['offboarding', 'pesangon', 'pp 35', 'phk', 'resign', 'exit interview', 'clearance', 'kompensasi'],
    icon: UserMinus,
  },
  {
    id: 'assets',
    name: 'GA, Aset QR & Perbaikan',
    group: 'General Affairs & Pengadaan',
    description: 'Inventarisasi aset fisik dengan QR code, riwayat servis/maintenance, dan peminjaman fasilitas',
    keywords: ['aset', 'asset', 'ga', 'general affairs', 'inventaris', 'qr code', 'servis', 'maintenance', 'ruangan', 'kendaraan'],
    icon: QrCode,
  },
  {
    id: 'procurement',
    name: 'Pengadaan, PO & Vendor',
    group: 'General Affairs & Pengadaan',
    description: 'Purchase Requisition (PR), Purchase Order (PO), direktori vendor, dan invoice barang/jasa',
    keywords: ['pengadaan', 'procurement', 'po', 'pr', 'vendor', 'supplier', 'invoice', 'pembelian', 'order'],
    icon: ShoppingCart,
  },
  {
    id: 'documents',
    name: 'Tata Kelola Dokumen Legal & QR',
    group: 'General Affairs & Pengadaan',
    description: 'Format kop surat, penomoran otomatis, upload template DOCX, dan Tanda Tangan QR tervalidasi',
    keywords: ['dokumen', 'surat', 'legal', 'kop surat', 'template', 'docx', 'ttd qr', 'penomoran', 'sk', 'kontrak'],
    icon: FileText,
  },
  {
    id: 'rbac',
    name: 'Manajemen User & Hak Akses (RBAC)',
    group: 'Administrasi & SaaS Owner',
    description: 'Konfigurasi akun login, role matrix, permission per modul, dan audit log keamanan',
    keywords: ['rbac', 'user', 'role', 'hak akses', 'admin', 'keamanan', 'permission', 'akun', 'password', 'audit'],
    icon: KeyRound,
  },
  {
    id: 'audit',
    name: 'Audit Trail & Log Aktivitas',
    group: 'Administrasi & SaaS Owner',
    description: 'Pencatatan riwayat transaksi seluruh modul, rekam jejak aksi pengguna, dan audit kepatuhan regulasi',
    keywords: ['audit', 'audit trail', 'log', 'aktivitas', 'history', 'riwayat', 'jejak', 'keamanan', 'iso 27001'],
    icon: History,
  },
  {
    id: 'tenants',
    name: 'Manajemen Multi-Tenant',
    group: 'Administrasi & SaaS Owner',
    description: 'Pengaturan client tenant SaaS, hirarki entitas holding-anak-cucu, dan kuota subscription',
    keywords: ['tenant', 'multi-tenant', 'saas', 'holding', 'anak perusahaan', 'klien', 'perusahaan', 'entitas'],
    icon: Building,
  },
];

// Subsequence & Token Fuzzy Matcher
function calculateFuzzyScore(query: string, ...targetStrings: (string | undefined)[]): number {
  if (!query) return 0;
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  let maxScore = 0;
  const qTokens = q.split(/\s+/).filter(Boolean);

  for (const text of targetStrings) {
    if (!text) continue;
    const t = text.toLowerCase();

    // 1. Exact match bonus
    if (t === q) {
      maxScore = Math.max(maxScore, 100);
      continue;
    }

    // 2. Starts with query
    if (t.startsWith(q)) {
      maxScore = Math.max(maxScore, 85);
      continue;
    }

    // 3. Substring match
    const subIdx = t.indexOf(q);
    if (subIdx !== -1) {
      maxScore = Math.max(maxScore, 70 - Math.min(subIdx, 20));
      continue;
    }

    // 4. Token matches (all tokens present)
    const allTokensFound = qTokens.every((tok) => t.includes(tok));
    if (allTokensFound && qTokens.length > 1) {
      maxScore = Math.max(maxScore, 65);
      continue;
    }

    // 5. Fuzzy character subsequence match
    let qIdx = 0;
    let seqScore = 0;
    for (let i = 0; i < t.length && qIdx < q.length; i++) {
      if (t[i] === q[qIdx]) {
        qIdx++;
        seqScore += 2;
      }
    }
    if (qIdx === q.length) {
      maxScore = Math.max(maxScore, 40 + seqScore);
    }
  }

  return maxScore;
}

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleSidebar?: () => void;
  onOpenMigrationWizard?: () => void;
  initialQuery?: string;
}

interface PaletteItem {
  id: string;
  category: 'modules' | 'employees' | 'assets' | 'documents' | 'actions';
  groupTitle: string;
  title: string;
  subtitle: string;
  codeOrTag?: string;
  badge?: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  score: number;
  onSelect: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onToggleSidebar,
  onOpenMigrationWizard,
  initialQuery = '',
}) => {
  const {
    employees,
    assets,
    documents,
    setActiveModule,
    openFilePreview,
    resetToSampleFlowData,
    currentTenant,
    currentUser,
    setCurrentUserRole,
    roles = [],
  } = useHrms();

  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<CommandCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync initialQuery when opened
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedIndex(0);
      setActiveFilter('all');
      setActionFeedback(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialQuery]);

  // System Action definitions
  const systemActions: PaletteItem[] = useMemo(() => {
    const actions: PaletteItem[] = [
      {
        id: 'action-toggle-sidebar',
        category: 'actions',
        groupTitle: 'Aksi Sistem & Tampilan',
        title: 'Perkecil / Perluas Sidebar (Toggle Sidebar)',
        subtitle: 'Alihkan visibilitas sidebar samping untuk memperluas ruang kerja',
        shortcut: 'Ctrl+B',
        badge: 'Tampilan',
        icon: PanelLeft,
        score: 0,
        onSelect: () => {
          onToggleSidebar?.();
          onClose();
        },
      },
      {
        id: 'action-migration-wizard',
        category: 'actions',
        groupTitle: 'Aksi Sistem & Tampilan',
        title: 'Buka Wizard Setup & Migrasi Data',
        subtitle: 'Impor massal data master karyawan & inventaris aset dari file Excel / CSV',
        shortcut: 'Setup',
        badge: 'Setup',
        icon: UploadCloud,
        score: 0,
        onSelect: () => {
          onOpenMigrationWizard?.();
          onClose();
        },
      },
      {
        id: 'action-reset-flow',
        category: 'actions',
        groupTitle: 'Aksi Sistem & Tampilan',
        title: 'Muat Ulang Data Contoh Proses Bisnis (PT Nusantara Jaya)',
        subtitle: 'Pulihkan 10 profil karyawan lengkap, presensi, SPPD, kasbon, dan approval bertingkat',
        shortcut: 'Flow',
        badge: 'Data Sample',
        icon: RotateCcw,
        score: 0,
        onSelect: () => {
          resetToSampleFlowData();
          setActionFeedback('Data proses bisnis contoh berhasil dimuat ulang!');
          setTimeout(() => {
            setActionFeedback(null);
            onClose();
          }, 1000);
        },
      },
      ...roles.map((r) => ({
        id: `action-role-${r.id}`,
        category: 'actions' as const,
        groupTitle: 'Ganti Peran Pengguna (RBAC Testing)',
        title: `Beralih ke Peran: ${r.label}`,
        subtitle: r.description,
        badge: currentUser.role === r.id ? 'Aktif' : 'Pilih',
        icon: ShieldCheck,
        score: 0,
        onSelect: () => {
          setCurrentUserRole(r.id);
          setActionFeedback(`Peran berhasil diubah ke ${r.label}`);
          setTimeout(() => {
            setActionFeedback(null);
            onClose();
          }, 800);
        },
      })),
    ];

    return actions;
  }, [
    roles,
    currentUser.role,
    onToggleSidebar,
    onOpenMigrationWizard,
    resetToSampleFlowData,
    setCurrentUserRole,
    onClose,
  ]);

  // Build items based on query & categories
  const filteredItems = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const result: PaletteItem[] = [];

    // 1. MODULES
    for (const mod of ALL_MODULES) {
      let score = 0;
      if (q) {
        score = calculateFuzzyScore(
          q,
          mod.name,
          mod.description,
          mod.group,
          ...mod.keywords
        );
      } else {
        score = 80; // default baseline score for modules
      }

      if (score > 0 || !q) {
        result.push({
          id: `mod-${mod.id}`,
          category: 'modules',
          groupTitle: `Navigasi Modul · ${mod.group}`,
          title: mod.name,
          subtitle: mod.description,
          badge: 'Modul',
          icon: mod.icon,
          score: score + 10, // give modules strong relevance
          onSelect: () => {
            setActiveModule(mod.id);
            onClose();
          },
        });
      }
    }

    // 2. SYSTEM ACTIONS
    for (const act of systemActions) {
      let score = 0;
      if (q) {
        score = calculateFuzzyScore(
          q,
          act.title,
          act.subtitle,
          act.groupTitle,
          act.badge,
          act.shortcut
        );
      } else {
        score = 60;
      }

      if (score > 0 || !q) {
        result.push({
          ...act,
          score,
        });
      }
    }

    // 3. EMPLOYEES
    for (const emp of employees) {
      let score = 0;
      if (q) {
        score = calculateFuzzyScore(
          q,
          emp.fullName,
          emp.nik,
          emp.position,
          emp.department,
          emp.nikKtp,
          emp.contractDocNumber,
          emp.email,
          emp.phone
        );
      } else {
        score = 50;
      }

      // If no query, only show first 4 sample employees
      if (q ? score > 0 : employees.indexOf(emp) < 4) {
        result.push({
          id: `emp-${emp.id}`,
          category: 'employees',
          groupTitle: 'Database Karyawan',
          title: emp.fullName,
          subtitle: `${emp.position} · ${emp.department} (Grade ${emp.grade || 'L3'})`,
          codeOrTag: emp.nik,
          badge: emp.employmentType,
          icon: User,
          score: score + 8,
          onSelect: () => {
            setActiveModule('employees');
            onClose();
          },
        });
      }
    }

    // 4. GA ASSETS
    for (const asset of assets) {
      let score = 0;
      if (q) {
        score = calculateFuzzyScore(
          q,
          asset.name,
          asset.assetCode,
          asset.category,
          asset.building,
          asset.room,
          asset.condition
        );
      } else {
        score = 45;
      }

      if (q ? score > 0 : assets.indexOf(asset) < 4) {
        result.push({
          id: `asset-${asset.id}`,
          category: 'assets',
          groupTitle: 'Inventaris & Aset GA',
          title: asset.name,
          subtitle: `${asset.category} · ${asset.building} (${asset.room})`,
          codeOrTag: asset.assetCode,
          badge: asset.condition,
          icon: Box,
          score,
          onSelect: () => {
            setActiveModule('assets');
            onClose();
          },
        });
      }
    }

    // 5. OFFICIAL DOCUMENTS
    for (const doc of documents) {
      let score = 0;
      if (q) {
        score = calculateFuzzyScore(
          q,
          doc.title,
          doc.documentNumber,
          doc.type,
          doc.signeeName,
          doc.signeeRole
        );
      } else {
        score = 40;
      }

      if (q ? score > 0 : documents.indexOf(doc) < 4) {
        result.push({
          id: `doc-${doc.id}`,
          category: 'documents',
          groupTitle: 'Dokumen Legal & Penomoran',
          title: doc.title,
          subtitle: `Tertanda: ${doc.signeeName} (${doc.signeeRole}) · Terbit: ${doc.issueDate}`,
          codeOrTag: doc.documentNumber,
          badge: doc.type,
          icon: FileText,
          score,
          onSelect: () => {
            setActiveModule('documents');
            openFilePreview({
              title: doc.title,
              documentNumber: doc.documentNumber,
              typeBadge: `Dokumen Legal: ${doc.type}`,
              date: doc.issueDate,
              partyName: doc.signeeName,
              partyRole: doc.signeeRole,
              contentParagraphs: [doc.contentPreview],
              rawHtmlOrBody: doc.renderedHtml,
              qrPayload: doc.qrVerificationUrl,
            });
            onClose();
          },
        });
      }
    }

    // Filter by active category if not 'all'
    let filtered = result;
    if (activeFilter !== 'all') {
      filtered = result.filter((item) => item.category === activeFilter);
    }

    // If search query is present, sort strictly by relevance score descending
    if (q) {
      filtered.sort((a, b) => b.score - a.score);
      return filtered.slice(0, 30);
    }

    // Default when query is empty: Group logically
    return filtered.slice(0, 25);
  }, [
    query,
    activeFilter,
    systemActions,
    employees,
    assets,
    documents,
    setActiveModule,
    openFilePreview,
    onClose,
  ]);

  // Group items by category for clean sectioning
  const groupedSections = useMemo(() => {
    const groups: { [key: string]: PaletteItem[] } = {};
    for (const item of filteredItems) {
      const g = item.groupTitle;
      if (!groups[g]) {
        groups[g] = [];
      }
      groups[g].push(item);
    }
    return groups;
  }, [filteredItems]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeFilter]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation within the modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      // Cycle category filter
      const categories: CommandCategory[] = ['all', 'modules', 'employees', 'assets', 'documents', 'actions'];
      const nextIdx = (categories.indexOf(activeFilter) + 1) % categories.length;
      setActiveFilter(categories[nextIdx]);
      return;
    }

    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) {
        current.onSelect();
      }
    }
  };

  if (!isOpen) return null;

  // Counts for tabs
  const moduleCount = filteredItems.filter((i) => i.category === 'modules').length;
  const empCount = filteredItems.filter((i) => i.category === 'employees').length;
  const assetCount = filteredItems.filter((i) => i.category === 'assets').length;
  const docCount = filteredItems.filter((i) => i.category === 'documents').length;
  const actionCount = filteredItems.filter((i) => i.category === 'actions').length;

  let flatIndexCounter = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Top Input Bar */}
        <div className="p-3 sm:p-3.5 border-b border-slate-200/90 flex items-center gap-2.5 bg-slate-50/50">
          <Search className="w-5 h-5 text-indigo-600 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nama modul, karyawan, aset, dokumen, atau perintah... (Ctrl+K)"
            className="w-full bg-transparent text-sm sm:text-base outline-none text-slate-900 placeholder:text-slate-400 font-medium"
            autoComplete="off"
            spellCheck={false}
          />

          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              title="Bersihkan"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="hidden sm:flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md border border-slate-200 transition-colors shrink-0"
            title="Tutup Command Palette (Esc)"
          >
            <span>Esc</span>
          </button>
        </div>

        {/* Action Feedback Banner (if user triggers quick action like reload) */}
        {actionFeedback && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top duration-150">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{actionFeedback}</span>
            </div>
            <Sparkles className="w-4 h-4 text-emerald-200" />
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Semua</span>
            <span
              className={`text-[10px] px-1 py-0.2 rounded-full ${
                activeFilter === 'all' ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {filteredItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('modules')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'modules'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Modul</span>
            <span
              className={`text-[10px] px-1 py-0.2 rounded-full ${
                activeFilter === 'modules' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {moduleCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('employees')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'employees'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Karyawan</span>
            <span
              className={`text-[10px] px-1 py-0.2 rounded-full ${
                activeFilter === 'employees' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {empCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('assets')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'assets'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Aset GA</span>
            <span
              className={`text-[10px] px-1 py-0.2 rounded-full ${
                activeFilter === 'assets' ? 'bg-cyan-700 text-cyan-100' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {assetCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('documents')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'documents'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Dokumen</span>
            <span
              className={`text-[10px] px-1 py-0.2 rounded-full ${
                activeFilter === 'documents' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {docCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('actions')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'actions'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aksi Cepat</span>
            <span
              className={`text-[10px] px-1 py-0.2 rounded-full ${
                activeFilter === 'actions' ? 'bg-amber-700 text-amber-100' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {actionCount}
            </span>
          </button>
        </div>

        {/* Scrollable Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs p-1">
          {filteredItems.length === 0 ? (
            <div className="p-10 text-center text-slate-500 space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <p className="font-semibold text-slate-800 text-sm">Tidak ada hasil ditemukan</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Kata kunci &quot;{query}&quot; tidak cocok dengan modul, karyawan, aset, atau dokumen. Coba kata kunci lain atau pilih tab filter di atas.
              </p>
            </div>
          ) : (
            Object.entries(groupedSections).map(([groupTitle, items]) => (
              <div key={groupTitle} className="py-1">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>{groupTitle}</span>
                  <span className="text-[10px] font-normal text-slate-400 font-mono">
                    {items.length} item
                  </span>
                </div>

                <div className="space-y-0.5">
                  {items.map((item) => {
                    const currentIndex = flatIndexCounter++;
                    const isSelected = selectedIndex === currentIndex;
                    const ItemIcon = item.icon;

                    return (
                      <button
                        key={item.id}
                        data-index={currentIndex}
                        onClick={item.onSelect}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={`w-full px-3 py-2.5 rounded-xl text-left flex items-start gap-3 transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/90 border border-indigo-200/80 shadow-2xs'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        {/* Leading Category Icon */}
                        <div className="mt-0.5 shrink-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                              item.category === 'modules'
                                ? isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-indigo-100 text-indigo-700'
                                : item.category === 'employees'
                                ? isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-indigo-100 text-indigo-700'
                                : item.category === 'assets'
                                ? isSelected
                                  ? 'bg-cyan-600 text-white'
                                  : 'bg-cyan-100 text-cyan-700'
                                : item.category === 'documents'
                                ? isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-100 text-emerald-700'
                                : isSelected
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <ItemIcon className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Text and Metadata */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 truncate">
                              <span
                                className={`font-semibold text-xs truncate ${
                                  isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'
                                }`}
                              >
                                {item.title}
                              </span>

                              {item.badge && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                    item.category === 'modules'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : item.category === 'employees'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : item.category === 'assets'
                                      ? 'bg-cyan-100 text-cyan-800'
                                      : item.category === 'documents'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>

                            {/* Shortcut badge or tag code */}
                            {item.shortcut ? (
                              <kbd className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                {item.shortcut}
                              </kbd>
                            ) : item.codeOrTag ? (
                              <span className="text-[10px] font-mono font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                {item.codeOrTag}
                              </span>
                            ) : null}
                          </div>

                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>

                        {/* Trailing action indicator */}
                        <div className="self-center shrink-0 pl-1 text-slate-400">
                          {isSelected ? (
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                              <span className="hidden sm:inline">Pilih</span>
                              <CornerDownLeft className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Bar with Keyboard Cheatsheet */}
        <div className="px-3 sm:px-4 py-2.5 bg-slate-50/90 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200 shadow-2xs text-[10px]">
                ↑↓
              </kbd>
              <span className="text-slate-600">Navigasi</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200 shadow-2xs text-[10px]">
                ↵
              </kbd>
              <span className="text-slate-600">Buka</span>
            </span>

            <span className="hidden sm:flex items-center gap-1">
              <kbd className="font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200 shadow-2xs text-[10px]">
                Tab
              </kbd>
              <span className="text-slate-600">Ganti Kategori</span>
            </span>

            <span className="hidden md:flex items-center gap-1">
              <kbd className="font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200 shadow-2xs text-[10px]">
                Ctrl+B
              </kbd>
              <span className="text-slate-600">Sidebar</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span className="font-medium text-slate-600">{currentTenant.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

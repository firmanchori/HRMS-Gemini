import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  Building2,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Globe,
  DollarSign,
  Calendar,
  CreditCard,
  Sliders,
  ExternalLink,
  X,
  Server,
  Network,
  GitBranch,
  Layers,
  ChevronDown,
  ChevronRight,
  FileText,
  UserCheck,
  ArrowRight,
  Sparkles,
  Share2,
} from 'lucide-react';
import { formatRupiah } from '../../utils/taxCalculator';
import { CurrencyInput } from '../common/CurrencyInput';
import { Tenant, CompanyEntity } from '../../types/hrms';

export const TenantManagement: React.FC = () => {
  const {
    tenants,
    currentTenant,
    setCurrentTenantId,
    entities,
    currentEntityId,
    setCurrentEntityId,
    addEntity,
    employees,
    openFilePreview,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'tree' | 'list' | 'matrix'>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'holding' | 'anak' | 'cucu'>('all');

  // Modal Add Tenant (SaaS Platform Client)
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [tenantNpwp, setTenantNpwp] = useState('01.234.567.8-000.000');
  const [tenantCity, setTenantCity] = useState('Jakarta Selatan');
  const [tenantUmr, setTenantUmr] = useState<number>(5067381);
  const [planTier, setPlanTier] = useState<Tenant['planTier']>('Enterprise');
  const [workDays, setWorkDays] = useState<5 | 6>(5);
  const [tenantFormError, setTenantFormError] = useState<string | null>(null);

  // Modal Add Entity (Holding / Anak / Cucu Tree)
  const [isAddEntityModalOpen, setIsAddEntityModalOpen] = useState(false);
  const [newEntityParentId, setNewEntityParentId] = useState<string>('');
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityCode, setNewEntityCode] = useState('');
  const [newEntityLevel, setNewEntityLevel] = useState<'anak' | 'cucu'>('anak');
  const [newEntityRelation, setNewEntityRelation] = useState<'resmi' | 'administratif'>('resmi');
  const [newEntityCity, setNewEntityCity] = useState('Jakarta Selatan');
  const [newEntityAddress, setNewEntityAddress] = useState('');
  const [newEntityNpwp, setNewEntityNpwp] = useState('01.999.888.7-000.000');
  const [newEntityNikPattern, setNewEntityNikPattern] = useState('{ENTITY}-{YYYY}-{SEQ:3}');
  const [newEntityDocPrefix, setNewEntityDocPrefix] = useState('HRD-');

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim()) {
      setTenantFormError('Nama legal perusahaan tenant wajib diisi');
      return;
    }
    if (!tenantCode.trim()) {
      setTenantFormError('Kode singkatan tenant wajib diisi');
      return;
    }
    if (!tenantCity.trim()) {
      setTenantFormError('Kota domisili tenant wajib diisi');
      return;
    }
    if (!tenantUmr || tenantUmr <= 0) {
      setTenantFormError('Nominal UMR regional wajib diisi dan di atas Rp 0');
      return;
    }

    setTenantFormError(null);
    alert(`Perusahaan Tenant "${tenantName}" (${tenantCode}) berhasil didaftarkan ke platform SaaS!`);
    setIsAddTenantModalOpen(false);
    setTenantName('');
    setTenantCode('');
  };

  const handleCreateEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName || !newEntityCode) return;

    addEntity({
      name: newEntityName,
      code: newEntityCode.toUpperCase(),
      level: newEntityLevel,
      parentEntityId: newEntityParentId || undefined,
      relationType: newEntityRelation,
      address: newEntityAddress || `Kawasan Bisnis ${newEntityCity}`,
      city: newEntityCity,
      npwp: newEntityNpwp,
      nikPattern: newEntityNikPattern || `${newEntityCode.toUpperCase()}-{YYYY}-{SEQ:3}`,
      docPrefix: newEntityDocPrefix || `HRD-${newEntityCode.toUpperCase()}`,
      status: 'Aktif',
    });

    setIsAddEntityModalOpen(false);
    setNewEntityName('');
    setNewEntityCode('');
  };

  const handlePreviewEntityDoc = (entity: CompanyEntity) => {
    const levelLabel =
      entity.level === 'holding'
        ? 'HOLDING UTAMA'
        : entity.level === 'anak'
        ? 'SUB HOLDING / ANAK PERUSAHAAN'
        : 'CUCU PERUSAHAAN';
    const parentEnt = entities.find((e) => e.id === entity.parentEntityId);

    openFilePreview({
      title: `Profil Legal & Akta Pendirian: ${entity.name}`,
      documentNumber: `AKTA-${entity.code}/NOTARIS/2026/042`,
      typeBadge: `Badan Hukum ${levelLabel}`,
      date: '10 Januari 2026',
      partyName: entity.name,
      partyRole: `Entitas Bisnis (${entity.city})`,
      statusBadge: {
        label: 'Terverifikasi Sah Kemenkumham RI',
        variant: 'success',
      },
      detailsGrid: [
        { label: 'Level Korporasi', value: levelLabel },
        { label: 'Kode Singkatan', value: entity.code },
        {
          label: 'Entitas Induk (Parent)',
          value: parentEnt ? parentEnt.name : 'Tidak Ada (Holding Utama)',
        },
        {
          label: 'Jenis Hubungan Saham',
          value:
            entity.relationType === 'resmi'
              ? 'Konsolidasi Kepemilikan Mayoritas (>50%)'
              : 'Afiliasi Kerjasama Administratif',
        },
        { label: 'Nomor Pokok Wajib Pajak (NPWP)', value: entity.npwp },
        { label: 'Format Penomoran NIK Karyawan', value: entity.nikPattern },
        { label: 'Prefix Dokumen Resmi', value: entity.docPrefix },
        { label: 'Domisili & Kantor Operasional', value: `${entity.address}, ${entity.city}` },
      ],
      contentParagraphs: [
        `Berdasarkan Akta Notaris No. 42 Tanggal 10 Januari 2026 dan Keputusan Menteri Hukum dan HAM RI, perseroan dengan nama ${entity.name} telah sah tercatat sebagai badan usaha di wilayah hukum Republik Indonesia.`,
        `Entitas ini beroperasi dalam ekosistem korporasi NusaHR Enterprise di bawah naungan ${currentTenant.name}, dengan struktur tingkatan ${levelLabel}. Seluruh kebijakan kepersonaliaan, presensi, penggajian PPh 21 TER, serta penomoran NIK terisolasi namun dapat dikonsolidasikan oleh Direksi Holding.`,
        `Segala bentuk mutasi karyawan antar-anak dan cucu perusahaan wajib menyertakan SK Mutasi Antar-Entitas resmi yang diverifikasi oleh VP of Human Capital Holding.`,
      ],
      signeeName: 'Prof. Dr. Hendra Wijaya, S.H., LL.M.',
      signeeRole: 'Notaris & Pejabat Pembuat Akta Tanah (PPAT)',
    });
  };

  const handlePreviewTenant = (tenant: Tenant) => {
    openFilePreview({
      title: `Perjanjian Lisensi SaaS Multi-Tenant: ${tenant.name}`,
      documentNumber: `SaaS-LIC/${tenant.code}/2026/088`,
      typeBadge: `Kontrak Berlangganan ${tenant.planTier}`,
      date: '01 Januari 2026',
      partyName: tenant.name,
      partyRole: `Tenant Enterprise (${tenant.city})`,
      statusBadge: {
        label: 'Lisensi SaaS Aktif',
        variant: 'success',
      },
      detailsGrid: [
        { label: 'Paket Lisensi', value: tenant.planTier },
        { label: 'Kode Tenant', value: tenant.code },
        { label: 'Basis UMR Pajak', value: formatRupiah(tenant.umr) },
        { label: 'NPWP Perusahaan', value: tenant.npwp },
        { label: 'Hari Kerja', value: `${tenant.workDaysPerWeek} Hari / Minggu` },
        { label: 'Jam Kerja Standar', value: `${tenant.standardWorkHours} Jam / Hari` },
        { label: 'Database Segmentasi', value: 'Isolasi Partisi Schema Terpisah' },
        { label: 'SLA Cloud Server', value: '99.98% High Availability' },
      ],
      contentParagraphs: [
        `Perjanjian Lisensi Perangkat Lunak Layanan (Software-as-a-Service) NusaHR Enterprise antara Platform Owner dan ${tenant.name}.`,
        `Tenant berhak mengakses seluruh modul HRMS terintegrasi, termasuk modul Multi-Holding (Anak dan Cucu Perusahaan), Presensi GPS, PPh 21 TER 2024, E-Sign QR Code, dan Portal Karyawan ESS.`,
        `Seluruh data karyawan dan data finansial dienkripsi pada rest dan in-transit dengan standar keamanan ISO 27001.`,
      ],
      signeeName: 'Ir. Faisal Akbar, M.Sc.',
      signeeRole: 'Chief Executive Officer (Platform Owner)',
    });
  };

  // Group entities into hierarchy
  const holdingEntity = entities.find((e) => e.level === 'holding') || entities[0];
  const anakEntities = entities.filter(
    (e) => e.level === 'anak' && (!holdingEntity || e.parentEntityId === holdingEntity.id)
  );

  const getCucuForAnak = (anakId: string) => {
    return entities.filter((e) => e.level === 'cucu' && e.parentEntityId === anakId);
  };

  // Filtered entities for search
  const filteredEntities = entities.filter((ent) => {
    const matchesSearch =
      ent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || ent.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <Network className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Manajemen Tenant & Struktur Hirarki Perusahaan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Pengelolaan struktur konglomerasi multi-entitas 3 tingkatan (<strong>Holding</strong>,{' '}
            <strong>Sub Holding / Anak Perusahaan</strong>, dan <strong>Cucu Perusahaan</strong>)
            dengan isolasi NIK, kop dokumen, dan basis pajak regional, serta pengelolaan Tenant SaaS.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {activeTab === 'tree' ? (
            <button
              onClick={() => {
                setNewEntityParentId(holdingEntity?.id || '');
                setNewEntityLevel('anak');
                setIsAddEntityModalOpen(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Anak / Cucu Perusahaan</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddTenantModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Daftarkan Tenant Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-medium">
        <button
          onClick={() => setActiveTab('tree')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'tree'
              ? 'border-indigo-600 text-indigo-700 font-bold bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <GitBranch className="w-4 h-4 text-indigo-600" />
          <span>Struktur Tree Hirarki (Holding → Anak → Cucu)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-mono">
            {entities.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'list'
              ? 'border-indigo-600 text-indigo-700 font-bold bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4 text-slate-500" />
          <span>Daftar Tenant Platform SaaS</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
            {tenants.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'border-indigo-600 text-indigo-700 font-bold bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4 text-slate-500" />
          <span>Konsolidasi Holding & Transfer Karyawan</span>
        </button>
      </div>

      {/* Aggregate Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-[11px] text-slate-500 block mb-1">Entitas Holding Utama</span>
          <span className="text-lg font-bold font-mono text-purple-700 tabular-nums">
            {entities.filter((e) => e.level === 'holding').length} Induk
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Pengendali Konglomerasi</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-[11px] text-slate-500 block mb-1">Sub Holding / Anak Perusahaan</span>
          <span className="text-lg font-bold font-mono text-indigo-700 tabular-nums">
            {entities.filter((e) => e.level === 'anak').length} Entitas
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Subsidiaries Terkonsolidasi</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-[11px] text-slate-500 block mb-1">Cucu Perusahaan (Sub-Subsidiary)</span>
          <span className="text-lg font-bold font-mono text-emerald-700 tabular-nums">
            {entities.filter((e) => e.level === 'cucu').length} Unit
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Operating Entity Level 3</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-[11px] text-slate-500 block mb-1">Total Headcount Group</span>
          <span className="text-lg font-bold font-mono text-blue-700 tabular-nums">
            {employees.length} Karyawan
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Tercatat di Seluruh Entitas</span>
        </div>
      </div>

      {/* TAB 1: TREE STRUCTURE (HOLDING - ANAK - CUCU) */}
      {activeTab === 'tree' && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-200/80 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">
                  Visual Tree Arsitektur Multi-Tier Konglomerasi
                </h4>
                <p className="text-slate-600 text-[11px]">
                  Klik pada baris atau kartu entitas mana saja untuk membuka{' '}
                  <span className="font-semibold text-indigo-700">
                    Preview Akta Legal & Dokumen Resmi
                  </span>
                  . Anda juga dapat langsung beralih workspace aktif per entitas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <span className="text-[11px] font-semibold text-slate-600">Workspace Saat Ini:</span>
              <span className="px-2.5 py-1 bg-indigo-600 text-white font-bold text-xs rounded-md shadow-xs font-mono">
                {currentEntityId ? entities.find((e) => e.id === currentEntityId)?.code : 'HOLDING'}
              </span>
            </div>
          </div>

          {/* Hierarchical Tree Container */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-6 space-y-6">
            {/* LEVEL 1: HOLDING UTAMA */}
            {holdingEntity && (
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                    TINGKAT 1: HOLDING UTAMA (PERUSAHAAN INDUK)
                  </span>
                </div>

                {/* Holding Card */}
                <div
                  onClick={() => handlePreviewEntityDoc(holdingEntity)}
                  className={`cursor-pointer p-4 sm:p-5 bg-white border-2 rounded-xl shadow-xs transition-all hover:shadow-md ${
                    currentEntityId === holdingEntity.id
                      ? 'border-purple-600 ring-2 ring-purple-500/20'
                      : 'border-purple-200 hover:border-purple-400'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-700 text-white font-extrabold flex items-center justify-center text-base shadow-sm shrink-0">
                        🏢
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                            {holdingEntity.name}
                          </h3>
                          <span className="text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">
                            {holdingEntity.code}
                          </span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                            Saham Pengendali Utama 100%
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>📍 {holdingEntity.city}</span>
                          <span>·</span>
                          <span className="font-mono">NPWP: {holdingEntity.npwp}</span>
                          <span>·</span>
                          <span className="font-mono text-purple-700">
                            Pola NIK: {holdingEntity.nikPattern}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewEntityDoc(holdingEntity);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md transition-colors flex items-center gap-1"
                        title="Preview Dokumen Akta & Legal"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Preview Legal</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewEntityParentId(holdingEntity.id);
                          setNewEntityLevel('anak');
                          setIsAddEntityModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-md transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Anak</span>
                      </button>

                      {currentEntityId !== holdingEntity.id ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentEntityId(holdingEntity.id);
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                        >
                          Pilih Workspace
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-md">
                          ✓ Aktif
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vertical Connector Line from Holding to Anak */}
                {anakEntities.length > 0 && (
                  <div className="w-0.5 h-6 bg-indigo-300 mx-auto my-1" />
                )}
              </div>
            )}

            {/* LEVEL 2 & 3: SUB HOLDING (ANAK) & CUCU PERUSAHAAN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                  TINGKAT 2: SUB HOLDING / ANAK PERUSAHAAN (SUBSIDIARIES)
                </span>
                <span className="text-[11px] text-slate-500">
                  {anakEntities.length} Anak Perusahaan Terdaftar
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {anakEntities.map((anak) => {
                  const cucuList = getCucuForAnak(anak.id);
                  const isCurrentAnak = currentEntityId === anak.id;

                  return (
                    <div
                      key={anak.id}
                      className="border border-indigo-100 bg-white/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-4"
                    >
                      {/* Anak Perusahaan Card */}
                      <div
                        onClick={() => handlePreviewEntityDoc(anak)}
                        className={`cursor-pointer p-4 bg-slate-50/70 border rounded-lg transition-all hover:bg-slate-50 ${
                          isCurrentAnak
                            ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                              🏭
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-slate-900 text-sm">
                                  {anak.name}
                                </h4>
                                <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.2 rounded">
                                  {anak.code}
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                    anak.relationType === 'resmi'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {anak.relationType === 'resmi'
                                    ? 'Saham Konsolidasi >50%'
                                    : 'Afiliasi Administratif'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                <span>📍 {anak.city}</span>
                                <span>·</span>
                                <span className="font-mono">NPWP: {anak.npwp}</span>
                                <span>·</span>
                                <span className="font-mono text-indigo-700">
                                  Format NIK: {anak.nikPattern}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewEntityDoc(anak);
                              }}
                              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded transition-colors flex items-center gap-1"
                              title="Preview Dokumen Legal"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Preview Legal</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewEntityParentId(anak.id);
                                setNewEntityLevel('cucu');
                                setIsAddEntityModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Tambah Cucu</span>
                            </button>

                            {currentEntityId !== anak.id ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentEntityId(anak.id);
                                }}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded shadow-xs transition-colors"
                              >
                                Pilih Workspace
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded">
                                ✓ Aktif
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* LEVEL 3: CUCU PERUSAHAAN (SUB-SUBSIDIARIES UNDER THIS ANAK) */}
                      {cucuList.length > 0 && (
                        <div className="pl-4 sm:pl-8 border-l-2 border-indigo-200 space-y-2 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ↳ TINGKAT 3: CUCU PERUSAHAAN (UNDER {anak.code})
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {cucuList.length} Operating Entity
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {cucuList.map((cucu) => {
                              const isCurrentCucu = currentEntityId === cucu.id;

                              return (
                                <div
                                  key={cucu.id}
                                  onClick={() => handlePreviewEntityDoc(cucu)}
                                  className={`cursor-pointer p-3.5 bg-white border rounded-lg transition-all hover:shadow-xs ${
                                    isCurrentCucu
                                      ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                                      : 'border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-md bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                                        🏪
                                      </div>
                                      <div>
                                        <h5 className="font-bold text-slate-900 text-xs leading-snug">
                                          {cucu.name}
                                        </h5>
                                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                          {cucu.code}
                                        </span>
                                      </div>
                                    </div>

                                    {isCurrentCucu && (
                                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                        Aktif
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                                    <div>📍 {cucu.city}</div>
                                    <div className="font-mono text-[10px]">NPWP: {cucu.npwp}</div>
                                    <div className="font-mono text-[10px] text-emerald-700">
                                      Prefix NIK: {cucu.nikPattern}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreviewEntityDoc(cucu);
                                      }}
                                      className="text-[11px] font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1"
                                    >
                                      <FileText className="w-3 h-3 text-slate-400" />
                                      <span>Akta Legal</span>
                                    </button>

                                    {currentEntityId !== cucu.id ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCurrentEntityId(cucu.id);
                                        }}
                                        className="px-2 py-0.8 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold rounded shadow-xs"
                                      >
                                        Pilih Workspace
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-emerald-700 font-semibold">
                                        ✓ Digunakan
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAFTAR TENANT SAAS PLATFORM (APPS OWNER PORTAL) */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama tenant, kode, atau kota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800"
              />
            </div>
            <span className="text-xs text-slate-500 self-end sm:self-auto">
              Menampilkan {filteredTenants.length} dari {tenants.length} Tenant Klien
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTenants.map((tenant) => {
              const isSelected = tenant.id === currentTenant.id;
              return (
                <div
                  key={tenant.id}
                  onClick={() => handlePreviewTenant(tenant)}
                  className={`cursor-pointer p-5 bg-white border rounded-xl shadow-xs transition-all relative overflow-hidden ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                      WORKSPACE SAAS AKTIF
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {tenant.code}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">
                          {tenant.name}
                        </h3>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-indigo-700 font-semibold">
                            {tenant.code}
                          </span>
                          <span>·</span>
                          <span>{tenant.city}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs my-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Paket SaaS</span>
                      <span className="font-semibold text-slate-800">{tenant.planTier}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        UMR Regional (Basis Upah & Pajak)
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatRupiah(tenant.umr)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Hari Kerja Mingguan</span>
                      <span className="font-medium text-slate-800">
                        {tenant.workDaysPerWeek} Hari / Minggu ({tenant.standardWorkHours} Jam/Hari)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">NPWP Perusahaan</span>
                      <span className="font-mono text-slate-700">{tenant.npwp}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewTenant(tenant);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Preview Kontrak Lisensi</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {!isSelected ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentTenantId(tenant.id);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs transition-colors"
                        >
                          Beralih ke Tenant Ini
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium text-xs">Sedang Digunakan</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MATRIKS KONSOLIDASI & TRANSFER KARYAWAN */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Matriks Entitas Terdaftar & Aturan Mutasi Group
                </h3>
                <p className="text-xs text-slate-500">
                  Ringkasan seluruh unit anak dan cucu perusahaan yang tergabung dalam konsolidasi
                  Holding. Klik setiap baris untuk mem-preview dokumen legal entitas.
                </p>
              </div>
            </div>

            {/* Entity Summary Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-y border-slate-200">
                    <th className="py-2.5 px-3 font-semibold">Tingkat</th>
                    <th className="py-2.5 px-3 font-semibold">Nama Entitas Legal</th>
                    <th className="py-2.5 px-3 font-semibold">Kode</th>
                    <th className="py-2.5 px-3 font-semibold">Entitas Induk (Parent)</th>
                    <th className="py-2.5 px-3 font-semibold">Hubungan Saham</th>
                    <th className="py-2.5 px-3 font-semibold">Domisili Kota</th>
                    <th className="py-2.5 px-3 font-semibold">Format NIK</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entities.map((ent) => {
                    const parent = entities.find((p) => p.id === ent.parentEntityId);
                    return (
                      <tr
                        key={ent.id}
                        onClick={() => handlePreviewEntityDoc(ent)}
                        className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ent.level === 'holding'
                                ? 'bg-purple-100 text-purple-800'
                                : ent.level === 'anak'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {ent.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {ent.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          {ent.code}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {parent ? parent.name : '— (Induk Holding)'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              ent.relationType === 'resmi'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {ent.relationType === 'resmi' ? 'Resmi (Konsolidasi)' : 'Administratif'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{ent.city}</td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                          {ent.nikPattern}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewEntityDoc(ent);
                            }}
                            className="px-2 py-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded font-semibold text-xs"
                          >
                            Preview Legal
                          </button>
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

      {/* Modal Add Entity (Holding, Sub Holding / Anak, Cucu Perusahaan) */}
      {isAddEntityModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-400" />
                  <span>
                    Daftarkan {newEntityLevel === 'anak' ? 'Anak Perusahaan' : 'Cucu Perusahaan'} Baru
                  </span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Struktur multi-tier konglomerasi Holding NusaHR
                </span>
              </div>
              <button onClick={() => setIsAddEntityModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateEntity} className="p-5 space-y-4 text-xs">
              {/* Parent Selector */}
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Entitas Induk (Parent Entity) *
                </label>
                <select
                  value={newEntityParentId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setNewEntityParentId(selId);
                    const selEnt = entities.find((ent) => ent.id === selId);
                    if (selEnt && selEnt.level === 'holding') {
                      setNewEntityLevel('anak');
                    } else {
                      setNewEntityLevel('cucu');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium bg-white"
                  required
                >
                  <option value="">Pilih Entitas Induk...</option>
                  {entities
                    .filter((e) => e.level !== 'cucu')
                    .map((ent) => (
                      <option key={ent.id} value={ent.id}>
                        {ent.level === 'holding' ? '🏢 [Holding]' : '🏭 [Anak]'} {ent.name} (
                        {ent.code})
                      </option>
                    ))}
                </select>
              </div>

              {/* Tingkat & Hubungan Saham */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Tingkatan Entitas (Level)
                  </label>
                  <select
                    value={newEntityLevel}
                    onChange={(e) => setNewEntityLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-semibold bg-white"
                  >
                    <option value="anak">Sub Holding / Anak Perusahaan</option>
                    <option value="cucu">Cucu Perusahaan</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Hubungan Saham</label>
                  <select
                    value={newEntityRelation}
                    onChange={(e) => setNewEntityRelation(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-semibold bg-white"
                  >
                    <option value="resmi">Resmi (Konsolidasi Saham Lebih dari 50%)</option>
                    <option value="administratif">Afiliasi Administratif / Kerjasama</option>
                  </select>
                </div>
              </div>

              {/* Nama & Kode */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-medium text-slate-700 block mb-1">
                    Nama Legal Perusahaan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PT Nusantara Finansial Global"
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-medium"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Kode Singkat *</label>
                  <input
                    type="text"
                    required
                    placeholder="NFG"
                    value={newEntityCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setNewEntityCode(val);
                      setNewEntityNikPattern(`${val}-{YYYY}-{SEQ:3}`);
                      setNewEntityDocPrefix(`HRD-${val}`);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
              </div>

              {/* Kota & NPWP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Domisili Kota *</label>
                  <input
                    type="text"
                    required
                    value={newEntityCity}
                    onChange={(e) => setNewEntityCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">NPWP Badan</label>
                  <input
                    type="text"
                    value={newEntityNpwp}
                    onChange={(e) => setNewEntityNpwp(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              {/* Pola NIK & Prefix Dokumen */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Format Pola NIK Karyawan
                  </label>
                  <input
                    type="text"
                    value={newEntityNikPattern}
                    onChange={(e) => setNewEntityNikPattern(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Prefix Nomor Dokumen
                  </label>
                  <input
                    type="text"
                    value={newEntityDocPrefix}
                    onChange={(e) => setNewEntityDocPrefix(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Alamat Kantor Operasional
                </label>
                <input
                  type="text"
                  placeholder="Gedung Cyber Lt. 5, Jl. Rasuna Said"
                  value={newEntityAddress}
                  onChange={(e) => setNewEntityAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEntityModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold shadow-xs"
                >
                  Simpan Entitas ke Tree
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Tenant (SaaS Client Provisioning) */}
      {isAddTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  Daftarkan Perusahaan Klien Baru (Tenant Provisioning)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Penyediaan partisi ruang data multi-tenant
                </span>
              </div>
              <button onClick={() => setIsAddTenantModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="p-5 space-y-4 text-xs">
              {/* Form Validation Error Notice */}
              {tenantFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{tenantFormError}</span>
                </div>
              )}

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Nama Legal Perusahaan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Surya Niaga Gemilang"
                  value={tenantName}
                  onChange={(e) => {
                    setTenantName(e.target.value);
                    if (tenantFormError) setTenantFormError(null);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Kode Singkatan (Prefix NIK & Dokumen) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="SNG"
                    value={tenantCode}
                    onChange={(e) => {
                      setTenantCode(e.target.value.toUpperCase());
                      if (tenantFormError) setTenantFormError(null);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Paket Berlangganan</label>
                  <select
                    value={planTier}
                    onChange={(e) => setPlanTier(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-semibold"
                  >
                    <option value="Enterprise">Enterprise (Full Features)</option>
                    <option value="Scale">Scale (Up to 250 Employees)</option>
                    <option value="Starter">Starter (Up to 50 Employees)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Kota Domisili / Cabang *
                  </label>
                  <input
                    type="text"
                    required
                    value={tenantCity}
                    onChange={(e) => {
                      setTenantCity(e.target.value);
                      if (tenantFormError) setTenantFormError(null);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <CurrencyInput
                    id="tenantUmr"
                    label="Nominal UMR Regional (IDR) *"
                    value={tenantUmr}
                    onChange={(val) => {
                      setTenantUmr(val);
                      if (tenantFormError) setTenantFormError(null);
                    }}
                    required
                    min={2000000}
                    helperText="Ketentuan upah minimum regional kota/daerah"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Skema Hari Kerja</label>
                  <select
                    value={workDays}
                    onChange={(e) => setWorkDays(Number(e.target.value) as 5 | 6)}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value={5}>5 Hari Kerja (8 Jam/Hari)</option>
                    <option value={6}>6 Hari Kerja (7 Jam/Hari)</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    NPWP Badan Perusahaan
                  </label>
                  <input
                    type="text"
                    value={tenantNpwp}
                    onChange={(e) => setTenantNpwp(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTenantModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold shadow-xs"
                >
                  Provisioning Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

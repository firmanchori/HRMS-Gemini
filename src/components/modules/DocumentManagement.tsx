import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHrms } from '../../context/HrmsContext';
import {
  FileText,
  Plus,
  Printer,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Eye,
  X,
  FileCheck2,
  Settings,
  Edit3,
  Building,
  Building2,
  Save,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Upload,
  FileUp,
  Download,
  Copy,
  Check,
  HelpCircle,
  FileCode,
  Trash2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  FileSpreadsheet,
  User,
  Layout,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Minus,
  ChevronDown,
  Scissors,
  Users,
  Briefcase,
  Award,
  GraduationCap,
  Clock,
  Coins,
  ShieldAlert,
  Package,
  FolderKanban,
  LayoutGrid,
} from 'lucide-react';
import { OfficialDocument, DocumentType, DocumentTemplateConfig, Employee } from '../../types/hrms';
import { QRCodeView } from '../common/QRCodeView';
import { OfficialMultiPageDocumentSheet, DocumentSignatory } from '../common/OfficialMultiPageDocumentSheet';
import { EmployeeSelect } from '../common/EmployeeSelect';
import {
  parseDocxFile,
  interpolateDocxTemplate,
  evaluateNumberingFormula,
  KNOWN_VARIABLE_DESCRIPTIONS,
  SAMPLE_DOCX_PRESETS,
  ParsedDocxResult,
  NUMBERING_TOKEN_REGISTRY,
  NUMBERING_TOKEN_REGISTRY as NUMBERING_TOKENS,
  NumberingTokenInfo,
  getPresetSignatoryForDocType,
  DocumentSignatoryPreset,
} from '../../utils/docxTemplateHelper';
import { formatRupiah, getTERCategory } from '../../utils/taxCalculator';
import { ScrollableTabNav } from '../common/ScrollableTabNav';

export const ALL_DOCUMENT_TYPES: { type: DocumentType | string; label: string; category: string }[] = [
  { type: 'PKWT', label: 'PKWT (Perjanjian Kerja Waktu Tertentu)', category: 'Kontrak Kerja' },
  { type: 'PKWTT', label: 'PKWTT (Karyawan Tetap)', category: 'Kontrak Kerja' },
  { type: 'Surat Promosi', label: 'Surat Promosi Jabatan & Kenaikan Grade', category: 'Karier & Personalia' },
  { type: 'Surat Mutasi', label: 'Surat Mutasi / Rotasi Kerja Antar Unit', category: 'Karier & Personalia' },
  { type: 'Surat Demosi', label: 'Surat Demosi Jabatan & Penyesuaian', category: 'Karier & Personalia' },
  { type: 'Surat Penugasan Sementara (Plt)', label: 'Penugasan Sementara (Plt / Acting Role)', category: 'Karier & Personalia' },
  { type: 'Addendum PKWT', label: 'Addendum Perpanjangan / Perubahan PKWT', category: 'Kontrak Kerja' },
  { type: 'Surat Peringatan Pertama (SP1)', label: 'Surat Peringatan Pertama (SP1)', category: 'Disipliner' },
  { type: 'Surat Peringatan Kedua (SP2)', label: 'Surat Peringatan Kedua (SP2)', category: 'Disipliner' },
  { type: 'Surat Peringatan Ketiga (SP3)', label: 'Surat Peringatan Ketiga (SP3 / Terakhir)', category: 'Disipliner' },
  { type: 'Parklaring', label: 'Parklaring (Surat Pengalaman Kerja)', category: 'Arsip & Keterangan' },
  { type: 'Surat Pemutusan Hubungan Kerja (PHK)', label: 'Pemutusan Hubungan Kerja (PHK Resmi)', category: 'Disipliner' },
  { type: 'BAST Aset', label: 'BAST (Serah Terima Fasilitas & Aset)', category: 'Operasional & GA' },
  { type: 'Offering Letter', label: 'Offering Letter Rekrutmen', category: 'Rekrutmen' },
  { type: 'Surat Tugas Dinas', label: 'Surat Perintah Perjalanan Dinas (SPPD)', category: 'Operasional & GA' },
  { type: 'Surat Izin Cuti', label: 'Surat Izin Cuti & Istirahat Resmi', category: 'Operasional & GA' },
  { type: 'Surat Perintah Lembur (SPL)', label: 'Surat Perintah Lembur (SPL)', category: 'Operasional & GA' },
  { type: 'Slip Gaji Resmi', label: 'Slip Gaji & Bukti Penghasilan Resmi', category: 'Payroll & Remunerasi' },
  { type: 'Surat Pinjaman Karyawan', label: 'Surat Pinjaman / Kasbon Karyawan', category: 'Payroll & Remunerasi' },
  { type: 'Non-Disclosure Agreement (NDA)', label: 'Non-Disclosure Agreement (NDA Kerahasiaan)', category: 'Legal & Kepatuhan' },
];

export type TemplateCategory =
  | 'Perjanjian Kerja & Kontrak'
  | 'Karier & Organisasi'
  | 'Magang Industri'
  | 'Kehadiran, Cuti & Perjalanan Dinas'
  | 'Payroll, Pajak & BPJS'
  | 'Disiplin, PHK & Paklaring'
  | 'Pengadaan, Aset & Umum (GA)';

export const TEMPLATE_CATEGORIES: {
  id: TemplateCategory;
  label: string;
  badgeColor: string;
  description: string;
}[] = [
  {
    id: 'Perjanjian Kerja & Kontrak',
    label: 'Perjanjian Kerja & Kontrak',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'PKWT, PKWTT, Addendum, Offering Letter, Non-Disclosure Agreement (NDA), dan SK Tenaga Ahli.',
  },
  {
    id: 'Karier & Organisasi',
    label: 'Karier & Organisasi',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Promosi, Mutasi, Demosi, Penetapan Plt, dan Evaluasi Kinerja Karyawan (KPI & OKR).',
  },
  {
    id: 'Magang Industri',
    label: 'Magang Industri',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Sertifikat Kelulusan Magang dan Surat Pernyataan Kesepakatan Program Magang Kerja.',
  },
  {
    id: 'Kehadiran, Cuti & Perjalanan Dinas',
    label: 'Kehadiran, Cuti & Dinas',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'SPPD, Rekap Presensi Cut-off, Formulir Izin/Cuti/Sakit, Koreksi Presensi, dan Surat Lembur (SPKL).',
  },
  {
    id: 'Payroll, Pajak & BPJS',
    label: 'Payroll, Pajak & BPJS',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    description: 'Slip Gaji (A4/A5), Pendaftaran BPJS e-Dabu & SIPP, Bukti Potong Pajak Coretax, Klaim Biaya, dan Pinjaman Karyawan.',
  },
  {
    id: 'Disiplin, PHK & Paklaring',
    label: 'Disiplin, PHK & Paklaring',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Surat Peringatan (SP 1/2/3), Sanksi Disiplin Resmi, SK PHK, dan Surat Pengalaman Kerja (Parklaring).',
  },
  {
    id: 'Pengadaan, Aset & Umum (GA)',
    label: 'Pengadaan, Aset & GA',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    description: 'BAST Aset, Form Tiketing IT, Peminjaman Ruang & Mobil Dinas, ATK, Purchase Order (PO), Quotation, Kontrak Vendor, dan Hardware.',
  },
];

export const getTemplateCategory = (tmpl: { type?: string; name?: string }): TemplateCategory => {
  const norm = `${tmpl.type || ''} ${tmpl.name || ''}`.toLowerCase();

  if (norm.includes('magang') || norm.includes('intern')) {
    return 'Magang Industri';
  }
  if (
    norm.includes('pkwt') ||
    norm.includes('pkwtt') ||
    norm.includes('kontrak kerja') ||
    norm.includes('offering') ||
    norm.includes('nda') ||
    norm.includes('kerahasiaan') ||
    norm.includes('tenaga ahli') ||
    norm.includes('konsultan')
  ) {
    return 'Perjanjian Kerja & Kontrak';
  }
  if (
    norm.includes('promosi') ||
    norm.includes('mutasi') ||
    norm.includes('demosi') ||
    norm.includes('plt') ||
    norm.includes('acting') ||
    norm.includes('kpi') ||
    norm.includes('okr') ||
    norm.includes('kinerja')
  ) {
    return 'Karier & Organisasi';
  }
  if (
    norm.includes('sppd') ||
    norm.includes('perjalanan dinas') ||
    norm.includes('presensi') ||
    norm.includes('cuti') ||
    norm.includes('lembur') ||
    norm.includes('izin') ||
    norm.includes('sakit') ||
    norm.includes('kehadiran')
  ) {
    return 'Kehadiran, Cuti & Perjalanan Dinas';
  }
  if (
    norm.includes('gaji') ||
    norm.includes('payslip') ||
    norm.includes('payroll') ||
    norm.includes('bpjs') ||
    norm.includes('edabu') ||
    norm.includes('e-dabu') ||
    norm.includes('sipp') ||
    norm.includes('pajak') ||
    norm.includes('coretax') ||
    norm.includes('bupot') ||
    norm.includes('klaim') ||
    norm.includes('reimburse') ||
    norm.includes('pinjaman') ||
    norm.includes('kasbon') ||
    norm.includes('angsuran')
  ) {
    return 'Payroll, Pajak & BPJS';
  }
  if (
    norm.includes('peringatan') ||
    norm.includes('sp-') ||
    norm.includes('sp 1') ||
    norm.includes('sp 2') ||
    norm.includes('sp 3') ||
    norm.includes('disiplin') ||
    norm.includes('phk') ||
    norm.includes('pengakhiran') ||
    norm.includes('paklaring') ||
    norm.includes('parklaring') ||
    norm.includes('pengalaman kerja')
  ) {
    return 'Disiplin, PHK & Paklaring';
  }
  return 'Pengadaan, Aset & Umum (GA)';
};

export const renderCategoryIcon = (cat: TemplateCategory | string, className = 'w-4 h-4') => {
  switch (cat) {
    case 'Perjanjian Kerja & Kontrak':
      return <Briefcase className={className} />;
    case 'Karier & Organisasi':
      return <Award className={className} />;
    case 'Magang Industri':
      return <GraduationCap className={className} />;
    case 'Kehadiran, Cuti & Perjalanan Dinas':
      return <Clock className={className} />;
    case 'Payroll, Pajak & BPJS':
      return <Coins className={className} />;
    case 'Disiplin, PHK & Paklaring':
      return <ShieldAlert className={className} />;
    case 'Pengadaan, Aset & Umum (GA)':
    default:
      return <Package className={className} />;
  }
};

export const extractPlaceholdersFromText = (text: string): string[] => {
  const matches = text.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g);
  if (!matches) return ['nama', 'nik', 'jabatan', 'departemen', 'gaji_pokok', 'nomor_surat', 'tanggal_terbit'];
  const unique = Array.from(new Set(matches.map((m) => m.replace(/[\{\}]/g, '').trim())));
  return unique.length > 0 ? unique : ['nama', 'nik', 'jabatan', 'departemen', 'gaji_pokok', 'nomor_surat', 'tanggal_terbit'];
};

export const DocumentManagement: React.FC = () => {
  const {
    documents,
    employees,
    createOfficialDocument,
    currentTenant,
    currentUser,
    documentTemplates,
    addDocumentTemplate,
    updateDocumentTemplate,
    deleteDocumentTemplate,
    moduleSettings,
    updateModuleSettings,
    updateTenant,
    updateTenantBranding,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'arsip' | 'studio' | 'templates' | 'daftar_tag' | 'pengaturan'>('arsip');
  const [selectedDoc, setSelectedDoc] = useState<OfficialDocument | null>(null);
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');

  // Studio Side-by-Side State
  const [studioSelectedTemplateId, setStudioSelectedTemplateId] = useState<string>(documentTemplates[0]?.id || '');
  const [studioTemplateName, setStudioTemplateName] = useState(documentTemplates[0]?.name || '');
  const [studioTemplateType, setStudioTemplateType] = useState<DocumentType>((documentTemplates[0]?.type as DocumentType) || 'PKWT');
  const [studioNumberingPattern, setStudioNumberingPattern] = useState(documentTemplates[0]?.numberingPattern || '{SEQ}/HRD-PKWT/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}');
  const [studioCompanyName, setStudioCompanyName] = useState(documentTemplates[0]?.letterHeadTitle || currentTenant.name);
  const [studioCompanyAddress, setStudioCompanyAddress] = useState(documentTemplates[0]?.letterHeadAddress || currentTenant.address || 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan');
  const [studioCompanyPhone, setStudioCompanyPhone] = useState(documentTemplates[0]?.letterHeadPhone || '+62 21 5566 7788');
  const [studioCompanyEmail, setStudioCompanyEmail] = useState(documentTemplates[0]?.letterHeadEmail || 'legal.hr@nusantara.id');
  const [studioCompanyNpwp, setStudioCompanyNpwp] = useState(documentTemplates[0]?.letterHeadNpwp || currentTenant.npwp || '01.999.888.7-011.000');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  // Studio Signee State Sesuai Jenis Dokumen (Seperti di Personalia)
  const initialPreset = getPresetSignatoryForDocType(documentTemplates[0]?.type || 'PKWT', employees);
  const [studioSigneeEmployeeId, setStudioSigneeEmployeeId] = useState<string>(initialPreset.matchedEmployeeId || '');
  const [studioSigneeName, setStudioSigneeName] = useState(
    documentTemplates[0]?.signeeTitle && !documentTemplates[0]?.signeeTitle.toLowerCase().includes('director') && !documentTemplates[0]?.signeeTitle.toLowerCase().includes('vp') && !documentTemplates[0]?.signeeTitle.toLowerCase().includes('head')
      ? documentTemplates[0]?.signeeTitle
      : initialPreset.preferredName
  );
  const [studioSigneeRole, setStudioSigneeRole] = useState(documentTemplates[0]?.signeeRole || initialPreset.preferredRole);
  const [studioSigneeDocRole, setStudioSigneeDocRole] = useState(initialPreset.documentRoleLabel);
  const [studioBodyText, setStudioBodyText] = useState(documentTemplates[0]?.defaultBody || '');
  const [studioFooterText, setStudioFooterText] = useState(documentTemplates[0]?.footerText || 'Dokumen ini sah dan berkekuatan hukum tetap menurut UU ITE No. 11/2008.');
  const [studioShowLetterhead, setStudioShowLetterhead] = useState(true);
  const [studioShowQrSignature, setStudioShowQrSignature] = useState(true);
  const [studioShowQrValidation, setStudioShowQrValidation] = useState(true);
  // Pengaturan Ukuran Kertas Studio (A4, F4, atau A5)
  const [studioPaperSize, setStudioPaperSize] = useState<'A4' | 'F4' | 'A5'>('A4');
  // Pengaturan Kop Surat (Header) & Footer Studio Side-by-Side
  const [studioLetterheadStyle, setStudioLetterheadStyle] = useState<'double' | 'bold' | 'single' | 'none'>('double');
  const [studioLetterheadAlign, setStudioLetterheadAlign] = useState<'left' | 'center' | 'right'>('left');
  const [studioLetterheadMode, setStudioLetterheadMode] = useState<'structured' | 'freetext'>('structured');
  const [studioLetterheadFreeText, setStudioLetterheadFreeText] = useState<string>('');
  const [studioCustomLogoUrl, setStudioCustomLogoUrl] = useState<string>('');
  const [studioRunningHeaderText, setStudioRunningHeaderText] = useState<string>('');
  const [studioPageNumFormat, setStudioPageNumFormat] = useState<'standard' | 'simple' | 'slash' | 'none'>('standard');
  const [studioFooterAlign, setStudioFooterAlign] = useState<'split' | 'center' | 'right'>('split');
  const [studioShowFooterBorder, setStudioShowFooterBorder] = useState<boolean>(true);
  const [studioQrValidationPlacement, setStudioQrValidationPlacement] = useState<'all_pages' | 'last_page'>('all_pages');
  const [studioConfigSection, setStudioConfigSection] = useState<'naskah' | 'kop' | 'footer'>('naskah');

  // Pejabat Penandatangan Dokumen / Simulasi TTD (Fleksibel & Eksternal seperti di Personalia)
  const [studioSignatories, setStudioSignatories] = useState<DocumentSignatory[]>([
    {
      id: 'sig-1',
      label: 'Pihak Pertama (Perusahaan)',
      employeeId: initialPreset.matchedEmployeeId || (employees[0]?.id || ''),
      name: initialPreset.preferredName || currentUser.name,
      role: initialPreset.preferredRole || 'VP of Human Capital',
      isExternal: false,
    },
    {
      id: 'sig-2',
      label: 'Pihak Kedua (Karyawan / Pihak Terkait)',
      employeeId: employees[1]?.id || '',
      name: employees[1]?.fullName || 'Karyawan yang Bersangkutan',
      role: employees[1]?.position || 'Karyawan',
      isExternal: false,
    },
  ]);

  const applyStudioSignatoryPreset = (type: '1-tier' | '2-tier' | '3-tier') => {
    if (type === '1-tier') {
      setStudioSignatories([
        {
          id: `sig-${Date.now()}-1`,
          label: 'Ditetapkan Oleh',
          employeeId: studioSignatories[0]?.employeeId || employees[0]?.id || '',
          name: studioSignatories[0]?.name || currentUser.name,
          role: studioSignatories[0]?.role || 'VP of Human Capital',
          isExternal: false,
        },
      ]);
    } else if (type === '2-tier') {
      setStudioSignatories([
        {
          id: `sig-${Date.now()}-1`,
          label: 'Pihak Pertama (Perusahaan)',
          employeeId: studioSignatories[0]?.employeeId || employees[0]?.id || '',
          name: studioSignatories[0]?.name || currentUser.name,
          role: studioSignatories[0]?.role || 'VP of Human Capital',
          isExternal: false,
        },
        {
          id: `sig-${Date.now()}-2`,
          label: 'Pihak Kedua (Karyawan / Mitra)',
          employeeId: employees[1]?.id || '',
          name: employees[1]?.fullName || 'Pihak Kedua / Rekanan',
          role: employees[1]?.position || 'Karyawan',
          isExternal: false,
        },
      ]);
    } else if (type === '3-tier') {
      setStudioSignatories([
        {
          id: `sig-${Date.now()}-1`,
          label: 'Dibuat Oleh',
          employeeId: currentUser?.id || employees[0]?.id || '',
          name: currentUser.name || 'HR Specialist',
          role: 'Human Capital Operations',
          isExternal: false,
        },
        {
          id: `sig-${Date.now()}-2`,
          label: 'Mengetahui',
          employeeId: '',
          name: 'Head of Legal & Compliance',
          role: 'Vice President of Legal',
          isExternal: false,
        },
        {
          id: `sig-${Date.now()}-3`,
          label: 'Menyetujui',
          employeeId: '',
          name: 'President Director & CEO',
          role: 'Direktur Utama',
          isExternal: false,
        },
      ]);
    }
  };

  const handleAddStudioSignatory = () => {
    setStudioSignatories((prev) => [
      ...prev,
      {
        id: `sig-${Date.now()}-${prev.length + 1}`,
        label: `Pihak ${prev.length + 1}`,
        employeeId: '',
        name: '',
        role: '',
        isExternal: false,
      },
    ]);
  };

  const handleRemoveStudioSignatory = (index: number) => {
    if (studioSignatories.length <= 1) return;
    setStudioSignatories((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateStudioSignatory = (index: number, field: keyof DocumentSignatory, val: any) => {
    setStudioSignatories((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleStudioSignatoryEmployeeSelect = (index: number, empId: string) => {
    if (empId === '__manual__') {
      setStudioSignatories((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          employeeId: '__manual__',
          isExternal: true,
        };
        return updated;
      });
      return;
    }

    const selectedEmp = employees.find((e) => e.id === empId);
    if (selectedEmp) {
      setStudioSignatories((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          employeeId: selectedEmp.id,
          name: selectedEmp.fullName,
          role: selectedEmp.position,
          nik: selectedEmp.nik,
          isExternal: false,
        };
        return updated;
      });
    }
  };

  const [studioPlaceholders, setStudioPlaceholders] = useState<string[]>(() => {
    return documentTemplates[0]?.extractedPlaceholders || extractPlaceholdersFromText(documentTemplates[0]?.defaultBody || '');
  });
  const [studioNewTagInput, setStudioNewTagInput] = useState('');
  const [studioSimulatedEmpId, setStudioSimulatedEmpId] = useState(employees[0]?.id || '');
  const [studioHighlightTags, setStudioHighlightTags] = useState(false);
  const [isUnderlineMenuOpen, setIsUnderlineMenuOpen] = useState(false);

  const studioTextareaRef = useRef<HTMLTextAreaElement>(null);
  const underlineDropdownRef = useRef<HTMLDivElement>(null);
  const studioReplaceInputRef = useRef<HTMLInputElement>(null);
  const templateReplaceInputRef = useRef<HTMLInputElement>(null);
  const templateToReplaceIdRef = useRef<string>('');

  // State Filter & Pengelompokan Tab Template Dokumen
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('all');
  const [templateViewMode, setTemplateViewMode] = useState<'grouped' | 'grid'>('grouped');

  // State Filter Dropdown di Tab Studio Side-by-Side
  const [studioTemplateCategoryFilter, setStudioTemplateCategoryFilter] = useState<string>('all');
  const [studioTemplateSearchQuery, setStudioTemplateSearchQuery] = useState<string>('');

  // State Tag Selector di Tab Studio Side-by-Side
  const [studioTagSourceMode, setStudioTagSourceMode] = useState<'template' | 'all'>('template');
  const [studioTagCategoryFilter, setStudioTagCategoryFilter] = useState<string>('all');
  const [studioTagSearchQuery, setStudioTagSearchQuery] = useState<string>('');

  // State Sub-Filter Kategori Variabel DOCX di Tab 4
  const [docxVarCategoryFilter, setDocxVarCategoryFilter] = useState<string>('all');

  // Close Underline Menu on Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (underlineDropdownRef.current && !underlineDropdownRef.current.contains(event.target as Node)) {
        setIsUnderlineMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Studio Basic Document Formatting Handler (Bold, Italic, Underlines, Alignment, dll)
  const handleStudioApplyFormat = (
    openTag: string,
    closeTag: string,
    defaultPlaceholder: string = 'teks'
  ) => {
    const textarea = studioTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = studioBodyText;

    const selectedText = currentText.substring(start, end);
    const textToWrap = selectedText || defaultPlaceholder;

    const replacement = `${openTag}${textToWrap}${closeTag}`;
    const newText = currentText.substring(0, start) + replacement + currentText.substring(end);

    setStudioBodyText(newText);

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start, start + replacement.length);
      } else {
        textarea.setSelectionRange(start + openTag.length, start + openTag.length + textToWrap.length);
      }
    }, 10);
  };

  // Branding states for Kop Surat Logo & App Favicon
  const [docLogoInput, setDocLogoInput] = useState(currentTenant.documentLogoUrl || '');
  const [appFaviconInput, setAppFaviconInput] = useState(currentTenant.appFaviconUrl || '');
  const [brandingSaved, setBrandingSaved] = useState(false);

  // Simulator states for Tab Daftar Tag
  const [testNumberingFormula, setTestNumberingFormula] = useState('{SEQ}/HRD-PKWT/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}');
  const [simulatedEmployeeId, setSimulatedEmployeeId] = useState(employees[0]?.id || '');
  const [tagCategoryFilter, setTagCategoryFilter] = useState<'all' | 'docx_vars' | 'numbering'>('all');

  // In-App Notification Toast
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'info' | 'error';
    title: string;
    description?: string;
  } | null>(null);

  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = setTimeout(() => setFeedbackMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [feedbackMessage]);

  // Generate Document State (Dengan Pejabat Penandatangan Spesifik Sesuai Template)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(documentTemplates[0]?.id || '');
  const [targetEmployeeId, setTargetEmployeeId] = useState(employees[0]?.id || '');
  const [customDocTitle, setCustomDocTitle] = useState('');
  const [customAdditionalNotes, setCustomAdditionalNotes] = useState('');
  const [generateSigneeEmployeeId, setGenerateSigneeEmployeeId] = useState<string>(initialPreset.matchedEmployeeId || '');
  const [generateSigneeName, setGenerateSigneeName] = useState(
    documentTemplates[0]?.signeeTitle && !documentTemplates[0]?.signeeTitle.toLowerCase().includes('director') && !documentTemplates[0]?.signeeTitle.toLowerCase().includes('vp') && !documentTemplates[0]?.signeeTitle.toLowerCase().includes('head')
      ? documentTemplates[0]?.signeeTitle
      : initialPreset.preferredName
  );
  const [generateSigneeRole, setGenerateSigneeRole] = useState(documentTemplates[0]?.signeeRole || initialPreset.preferredRole);

  // DOCX Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsingDocx, setIsParsingDocx] = useState(false);
  const [parsedDocx, setParsedDocx] = useState<ParsedDocxResult | null>(null);
  const [uploadDocType, setUploadDocType] = useState<string>('PKWT');
  const [uploadDocTitle, setUploadDocTitle] = useState('');
  const [uploadNumberingPattern, setUploadNumberingPattern] = useState('{SEQ}/HRD-PKWT/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}');
  const [uploadKopPosition, setUploadKopPosition] = useState<'top' | 'none' | 'embedded'>('top');
  const [uploadQrPosition, setUploadQrPosition] = useState<'bottom-right' | 'bottom-left' | 'inline' | 'none'>('bottom-right');
  const [uploadCompanyName, setUploadCompanyName] = useState(currentTenant.name);
  const [uploadCompanyAddress, setUploadCompanyAddress] = useState(currentTenant.address || 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan');
  const [uploadCompanyNpwp, setUploadCompanyNpwp] = useState(currentTenant.npwp || '01.999.888.7-011.000');
  const [uploadSigneeTitle, setUploadSigneeTitle] = useState('VP of Human Capital');
  const [uploadSigneeRole, setUploadSigneeRole] = useState('Pihak Pertama (Manajemen)');
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  // Token Glossary Modal & Token Search State
  const [isTokenGlossaryModalOpen, setIsTokenGlossaryModalOpen] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');
  const [tokenGlossaryTab, setTokenGlossaryTab] = useState<'numbering' | 'body_vars'>('numbering');

  // Insert token into active numbering pattern
  const handleInsertToken = (token: string, target: 'upload' | 'standard') => {
    if (target === 'upload') {
      setUploadNumberingPattern((prev) => {
        if (!prev) return token;
        return prev.endsWith('/') ? `${prev}${token}` : `${prev}/${token}`;
      });
    } else {
      setEditNumberingFormat((prev) => {
        if (!prev) return token;
        return prev.endsWith('/') ? `${prev}${token}` : `${prev}/${token}`;
      });
    }
    setFeedbackMessage({
      type: 'success',
      title: `Token ${token} Disisipkan`,
      description: `Token telah ditambahkan ke dalam formula penomoran dokumen.`,
    });
  };

  const handleCopyAnyToken = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVariable(text);
    setFeedbackMessage({
      type: 'info',
      title: `Token ${text} Berhasil Disalin`,
      description: `Format tag untuk ${label} tersimpan di clipboard.`,
    });
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  // Standard Template Editor State
  const [editingTemplateId, setEditingTemplateId] = useState<string>(documentTemplates[0]?.id || '');
  const activeTemplate = documentTemplates.find((t) => t.id === editingTemplateId) || documentTemplates[0];

  const [editNumberingFormat, setEditNumberingFormat] = useState(activeTemplate?.numberingPattern || '{SEQ}/HR-PKWT/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}');
  const [editCompanyName, setEditCompanyName] = useState(activeTemplate?.letterHeadTitle || currentTenant.name);
  const [editCompanyAddress, setEditCompanyAddress] = useState(activeTemplate?.letterHeadAddress || 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan');
  const [editCompanyPhone, setEditCompanyPhone] = useState(activeTemplate?.letterHeadPhone || '+62 21 5566 7788');
  const [editCompanyEmail, setEditCompanyEmail] = useState(activeTemplate?.letterHeadEmail || 'legal.hr@nusantara.id');
  const [editCompanyNpwp, setEditCompanyNpwp] = useState(activeTemplate?.letterHeadNpwp || currentTenant.npwp);
  const [editTitleFormat, setEditTitleFormat] = useState(activeTemplate?.name || 'SURAT PERJANJIAN KERJA WAKTU TERTENTU (PKWT)');
  const [editBodyTemplate, setEditBodyTemplate] = useState(activeTemplate?.defaultBody || '');
  const [editFooterText, setEditFooterText] = useState(activeTemplate?.footerText || 'Dokumen ini sah dan berkekuatan hukum tetap menurut UU ITE No. 11/2008.');
  const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false);
  const [editSigneeTitle, setEditSigneeTitle] = useState(activeTemplate?.signeeTitle || currentUser.name);
  const [editSigneeRole, setEditSigneeRole] = useState(activeTemplate?.signeeRole || 'VP of Human Capital');

  // Settings State
  const [defaultSigneeRole, setDefaultSigneeRole] = useState(moduleSettings.documents?.defaultSigneeRole || 'VP of Human Capital');
  const [enableWatermark, setEnableWatermark] = useState(moduleSettings.documents?.showQrSignature ?? true);

  // Handle Drag & Drop / File Select for DOCX
  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      setFeedbackMessage({
        type: 'error',
        title: 'Format File Tidak Didukung',
        description: 'Mohon unggah file dengan format Microsoft Word (.docx).',
      });
      return;
    }

    try {
      setIsParsingDocx(true);
      const result = await parseDocxFile(file);
      setParsedDocx(result);

      // Auto-populate title and type
      const suggestedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setUploadDocTitle(suggestedTitle);

      if (file.name.toLowerCase().includes('pkwt')) {
        setUploadDocType('PKWT');
        setUploadNumberingPattern('{SEQ}/HRD-PKWT/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}');
      } else if (file.name.toLowerCase().includes('tetap') || file.name.toLowerCase().includes('pkwtt')) {
        setUploadDocType('PKWTT');
        setUploadNumberingPattern('{SEQ}/HRD-SK-TETAP/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}');
      } else if (file.name.toLowerCase().includes('sp') || file.name.toLowerCase().includes('peringatan')) {
        setUploadDocType('Surat Peringatan');
        setUploadNumberingPattern('{SEQ}/HRD-SP/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}');
      } else if (file.name.toLowerCase().includes('parklaring') || file.name.toLowerCase().includes('pengalaman')) {
        setUploadDocType('Parklaring');
        setUploadNumberingPattern('{SEQ}/HRD-PARKLARING/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}');
      } else if (file.name.toLowerCase().includes('bast') || file.name.toLowerCase().includes('aset')) {
        setUploadDocType('BAST Aset');
        setUploadNumberingPattern('{SEQ}/BAST-GA/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}');
      }

      setFeedbackMessage({
        type: 'success',
        title: 'File DOCX Berhasil Diproses',
        description: `Template "${file.name}" (${result.fileSize}) berhasil diekstrak dengan ${result.placeholders.length} variabel dinamis terdeteksi.`,
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        title: 'Gagal Membaca File DOCX',
        description: err.message || 'Pastikan file docx tidak terenkripsi atau korup.',
      });
    } finally {
      setIsParsingDocx(false);
    }
  };

  // Load Preset Sample Template
  const handleLoadSamplePreset = (preset: (typeof SAMPLE_DOCX_PRESETS)[0]) => {
    setParsedDocx({
      html: `<div class="whitespace-pre-line">${preset.rawText}</div>`,
      rawText: preset.rawText,
      placeholders: ['nama', 'nik', 'nik_ktp', 'jabatan', 'departemen', 'grade', 'gaji_pokok', 'gaji_terbilang', 'nomor_surat', 'nama_perusahaan', 'alamat_perusahaan', 'penandatangan', 'jabatan_penandatangan', 'tanggal_terbit', 'tanggal_mulai', 'tanggal_berakhir'],
      fileName: preset.fileName,
      fileSize: preset.fileSize,
    });
    setUploadDocType(preset.type);
    setUploadDocTitle(preset.title);
    setUploadNumberingPattern(preset.numberingPattern);
    setUploadKopPosition(preset.kopPosition);
    setUploadQrPosition(preset.qrPosition);

    setFeedbackMessage({
      type: 'info',
      title: 'Template Contoh Dimuat',
      description: `Format "${preset.title}" siap dikonfigurasi dan disimpan ke koleksi template.`,
    });
  };

  // Save parsed DOCX as DocumentTemplateConfig
  const handleSaveUploadedDocxTemplate = () => {
    if (!parsedDocx) {
      setFeedbackMessage({
        type: 'error',
        title: 'Belum Ada File DOCX',
        description: 'Silakan unggah file DOCX terlebih dahulu atau pilih salah satu template contoh.',
      });
      return;
    }

    const newTemplate = addDocumentTemplate({
      type: uploadDocType as any,
      name: uploadDocTitle || parsedDocx.fileName,
      numberingPattern: uploadNumberingPattern,
      letterHeadTitle: uploadCompanyName,
      letterHeadAddress: uploadCompanyAddress,
      letterHeadNpwp: uploadCompanyNpwp,
      defaultBody: parsedDocx.rawText,
      showQrSignature: uploadQrPosition !== 'none',
      signeeTitle: uploadSigneeTitle,
      signeeRole: uploadSigneeRole,
      sourceType: 'uploaded_docx',
      fileName: parsedDocx.fileName,
      fileSize: parsedDocx.fileSize,
      uploadedAt: new Date().toISOString().split('T')[0],
      rawHtmlTemplate: parsedDocx.html,
      extractedPlaceholders: parsedDocx.placeholders,
      kopPosition: uploadKopPosition,
      qrPosition: uploadQrPosition,
    });

    setSelectedTemplateId(newTemplate.id);

    setFeedbackMessage({
      type: 'success',
      title: 'Template DOCX Berhasil Disimpan',
      description: `Template "${newTemplate.name}" kini dapat langsung digunakan saat menerbitkan surat resmi di tab Arsip.`,
    });

    setActiveTab('arsip');
  };

  // Copy Variable Token to Clipboard
  const handleCopyVariable = (variableName: string) => {
    const text = `{{${variableName}}}`;
    navigator.clipboard.writeText(text);
    setCopiedVariable(variableName);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  // Open Edit Template Modal
  const handleOpenEditTemplate = (tmpl: DocumentTemplateConfig) => {
    setEditingTemplateId(tmpl.id);
    setEditNumberingFormat(tmpl.numberingPattern);
    setEditCompanyName(tmpl.letterHeadTitle || currentTenant.name);
    setEditCompanyAddress(tmpl.letterHeadAddress || currentTenant.address || 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan');
    setEditTitleFormat(tmpl.name);
    setEditBodyTemplate(tmpl.defaultBody || '');
    setEditCompanyPhone(tmpl.letterHeadPhone || '+62 21 5566 7788');
    setEditCompanyEmail(tmpl.letterHeadEmail || 'legal.hr@nusantara.id');
    setEditCompanyNpwp(tmpl.letterHeadNpwp || currentTenant.npwp);
    setEditFooterText(tmpl.footerText || 'Dokumen ini sah dan berkekuatan hukum tetap menurut UU ITE No. 11/2008.');
    setEditSigneeTitle(tmpl.signeeTitle || currentUser.name);
    setEditSigneeRole(tmpl.signeeRole || defaultSigneeRole);
    setIsEditTemplateModalOpen(true);
  };

  const handleSelectTemplateForEdit = (tmpl: DocumentTemplateConfig) => {
    handleOpenEditTemplate(tmpl);
  };

  const handleSaveStandardTemplate = () => {
    if (!editingTemplateId) return;

    updateDocumentTemplate(editingTemplateId, {
      numberingPattern: editNumberingFormat,
      name: editTitleFormat,
      letterHeadTitle: editCompanyName,
      letterHeadAddress: editCompanyAddress,
      letterHeadPhone: editCompanyPhone,
      letterHeadEmail: editCompanyEmail,
      letterHeadNpwp: editCompanyNpwp,
      defaultBody: editBodyTemplate,
      footerText: editFooterText,
      signeeTitle: editSigneeTitle,
      signeeRole: editSigneeRole,
    });

    setIsEditTemplateModalOpen(false);

    setFeedbackMessage({
      type: 'success',
      title: 'Template Berhasil Diperbarui',
      description: `Perubahan klausul, pejabat, dan formula template "${editTitleFormat}" telah tersimpan.`,
    });
  };

  // Generate Document Execution
  const handleGenerateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployeeId) return;

    const tmpl = documentTemplates.find((t) => t.id === selectedTemplateId) || documentTemplates[0];
    const targetEmp = employees.find((e) => e.id === targetEmployeeId);
    if (!targetEmp) return;

    // Calculate dynamic sequence number
    const seq = documents.length + 1;
    const documentNumber = evaluateNumberingFormula(
      tmpl?.numberingPattern || '{SEQ}/HRD-DOC/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}',
      seq,
      currentTenant.code,
      new Date()
    );

    const title = customDocTitle || tmpl?.name || `Surat Keputusan ${tmpl?.type}: ${targetEmp.fullName}`;

    // Interpolate placeholders
    const rawContent = customAdditionalNotes || tmpl?.defaultBody || '';
    const resolvedContent = interpolateDocxTemplate(rawContent, {
      employee: targetEmp,
      tenant: currentTenant,
      documentNumber,
      signeeName: generateSigneeName || currentUser.name,
      signeeRole: generateSigneeRole || defaultSigneeRole,
    });

    const isFromDocx = tmpl?.sourceType === 'uploaded_docx';

    const newDoc = createOfficialDocument({
      type: tmpl?.type || 'PKWT',
      templateId: tmpl?.id,
      title,
      targetEmployeeId: targetEmp.id,
      signeeName: generateSigneeName || currentUser.name,
      signeeRole: generateSigneeRole || defaultSigneeRole,
      contentPreview: resolvedContent,
      isFromDocxTemplate: isFromDocx,
      customDocumentNumber: documentNumber,
    });

    setIsGenerateModalOpen(false);
    setSelectedDoc(newDoc);
    setCustomDocTitle('');
    setCustomAdditionalNotes('');

    setFeedbackMessage({
      type: 'success',
      title: 'Surat Keputusan Resmi Berhasil Diterbitkan',
      description: `Dokumen "${title}" (${documentNumber}) ditandatangani oleh ${generateSigneeName} (${generateSigneeRole}).`,
    });
  };

  const handleSaveSettings = () => {
    updateModuleSettings('documents', {
      defaultSigneeRole,
      showQrSignature: enableWatermark,
    });
    setFeedbackMessage({
      type: 'success',
      title: 'Pengaturan Legal Disimpan',
      description: 'Pejabat penanda tangan dan stempel QR digital telah diperbarui.',
    });
  };

  // Handler Memuat Template ke Studio Side-by-Side
  const handleLoadTemplateIntoStudio = (tmpl: DocumentTemplateConfig) => {
    setStudioSelectedTemplateId(tmpl.id);
    setStudioTemplateName(tmpl.name);
    setStudioTemplateType(tmpl.type as DocumentType);
    setStudioNumberingPattern(tmpl.numberingPattern);
    setStudioCompanyName(tmpl.letterHeadTitle || currentTenant.name);
    setStudioCompanyAddress(tmpl.letterHeadAddress || currentTenant.address || 'Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan');
    setStudioCompanyPhone(tmpl.letterHeadPhone || '+62 21 5566 7788');
    setStudioCompanyEmail(tmpl.letterHeadEmail || 'legal.hr@nusantara.id');
    setStudioCompanyNpwp(tmpl.letterHeadNpwp || currentTenant.npwp || '01.999.888.7-011.000');

    // Cek preset rekomendasi penandatangan sesuai jenis dokumen ini (Seperti di Personalia)
    const preset = getPresetSignatoryForDocType(tmpl.type || tmpl.name, employees);
    const signeeNameToUse = tmpl.signeeTitle && !tmpl.signeeTitle.toLowerCase().includes('director') && !tmpl.signeeTitle.toLowerCase().includes('vp') && !tmpl.signeeTitle.toLowerCase().includes('head')
      ? tmpl.signeeTitle
      : preset.preferredName;
    const signeeRoleToUse = tmpl.signeeRole || preset.preferredRole;

    setStudioSigneeName(signeeNameToUse);
    setStudioSigneeRole(signeeRoleToUse);
    setStudioSigneeDocRole(preset.documentRoleLabel);
    setStudioSigneeEmployeeId(preset.matchedEmployeeId || '__manual__');

    // Inisialisasi simulasi penandatangan sesuai template
    setStudioSignatories([
      {
        id: `sig-1`,
        label: 'Pihak Pertama (Perusahaan)',
        employeeId: preset.matchedEmployeeId || (employees[0]?.id || ''),
        name: signeeNameToUse,
        role: signeeRoleToUse,
        isExternal: false,
      },
      {
        id: `sig-2`,
        label: 'Pihak Kedua (Karyawan / Mitra)',
        employeeId: employees[1]?.id || '',
        name: employees[1]?.fullName || 'Pihak Kedua / Rekanan Terkait',
        role: employees[1]?.position || 'Karyawan',
        isExternal: false,
      },
    ]);

    setStudioBodyText(tmpl.defaultBody || '');
    setStudioFooterText(tmpl.footerText || 'Dokumen ini sah dan berkekuatan hukum tetap menurut UU ITE No. 11/2008.');
    setStudioPaperSize((tmpl.paperSize as any) || 'A4');
    setStudioShowLetterhead(tmpl.kopPosition !== 'none');
    setStudioShowQrSignature(tmpl.showQrSignature ?? true);
    setStudioShowQrValidation(tmpl.qrPosition !== 'none');

    const foundPlaceholders = tmpl.extractedPlaceholders && tmpl.extractedPlaceholders.length > 0
      ? tmpl.extractedPlaceholders
      : extractPlaceholdersFromText(tmpl.defaultBody || '');
    setStudioPlaceholders(foundPlaceholders);

    setActiveTab('studio');
    setFeedbackMessage({
      type: 'info',
      title: `Studio Dibuka: ${tmpl.name}`,
      description: 'Editor teks & live preview lembar resmi kini berdampingan.',
    });
  };

  // Handler Ganti Template di Studio Dropdown
  const handleStudioChangeTemplate = (tmplId: string) => {
    const tmpl = documentTemplates.find((t) => t.id === tmplId);
    if (tmpl) {
      handleLoadTemplateIntoStudio(tmpl);
    }
  };

  // Handler Pilih Pejabat Penandatangan di Studio (via EmployeeSelect)
  const handleStudioSigneeEmployeeSelect = (empId: string) => {
    setStudioSigneeEmployeeId(empId);
    if (empId === '__manual__') return;
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setStudioSigneeName(emp.fullName);
      setStudioSigneeRole(emp.position);
      setFeedbackMessage({
        type: 'info',
        title: 'Pejabat Penandatangan Terpilih',
        description: `${emp.fullName} (${emp.position}) ditetapkan sebagai penandatangan dokumen.`,
      });
    }
  };

  // Handler Terapkan Rekomendasi Pejabat Sesuai Dokumen di Studio
  const handleApplyRecommendedSignatory = () => {
    const preset = getPresetSignatoryForDocType(studioTemplateType || studioTemplateName, employees);
    setStudioSigneeName(preset.preferredName);
    setStudioSigneeRole(preset.preferredRole);
    setStudioSigneeDocRole(preset.documentRoleLabel);
    setStudioSigneeEmployeeId(preset.matchedEmployeeId || '__manual__');
    setFeedbackMessage({
      type: 'success',
      title: 'Rekomendasi Pejabat Diterapkan',
      description: `${preset.preferredName} (${preset.preferredRole}) telah diterapkan untuk jenis dokumen ${studioTemplateType}.`,
    });
  };

  // Handler Ganti Template di Modal Terbitkan Dokumen Baru
  const handleSelectTemplateForGenerate = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = documentTemplates.find((t) => t.id === tmplId);
    if (tmpl) {
      const preset = getPresetSignatoryForDocType(tmpl.type || tmpl.name, employees);
      const signeeNameToUse = tmpl.signeeTitle && !tmpl.signeeTitle.toLowerCase().includes('director') && !tmpl.signeeTitle.toLowerCase().includes('vp') && !tmpl.signeeTitle.toLowerCase().includes('head')
        ? tmpl.signeeTitle
        : preset.preferredName;
      setGenerateSigneeName(signeeNameToUse);
      setGenerateSigneeRole(tmpl.signeeRole || preset.preferredRole);
      setGenerateSigneeEmployeeId(preset.matchedEmployeeId || '__manual__');
    }
  };

  // Handler Pilih Pejabat di Modal Terbitkan Dokumen Baru
  const handleGenerateSigneeSelect = (empId: string) => {
    setGenerateSigneeEmployeeId(empId);
    if (empId === '__manual__') return;
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setGenerateSigneeName(emp.fullName);
      setGenerateSigneeRole(emp.position);
    }
  };

  // Handler Simpan Perubahan Template dari Studio
  const handleSaveStudioTemplate = () => {
    if (!studioSelectedTemplateId) return;

    updateDocumentTemplate(studioSelectedTemplateId, {
      name: studioTemplateName,
      type: studioTemplateType,
      paperSize: studioPaperSize,
      numberingPattern: studioNumberingPattern,
      letterHeadTitle: studioCompanyName,
      letterHeadAddress: studioCompanyAddress,
      letterHeadPhone: studioCompanyPhone,
      letterHeadEmail: studioCompanyEmail,
      letterHeadNpwp: studioCompanyNpwp,
      signeeTitle: studioSigneeName,
      signeeRole: studioSigneeRole,
      defaultBody: studioBodyText,
      footerText: studioFooterText,
      kopPosition: studioShowLetterhead ? 'top' : 'none',
      showQrSignature: studioShowQrSignature,
      qrPosition: studioShowQrValidation ? 'bottom-right' : 'none',
      extractedPlaceholders: studioPlaceholders,
    });

    setFeedbackMessage({
      type: 'success',
      title: 'Perubahan Template Disimpan',
      description: `Konfigurasi template "${studioTemplateName}" telah diperbarui dan aktif di seluruh sistem.`,
    });
  };

  // Handler Tambah Tag Baru ke Studio
  const handleAddTagToStudio = () => {
    const cleanTag = studioNewTagInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanTag) return;
    if (!studioPlaceholders.includes(cleanTag)) {
      setStudioPlaceholders((prev) => [...prev, cleanTag]);
    }
    setStudioNewTagInput('');
    setFeedbackMessage({
      type: 'success',
      title: `Tag {{${cleanTag}}} Ditambahkan`,
      description: 'Tag baru telah dimasukkan ke daftar tag aktif template ini.',
    });
  };

  // Handler Hapus Tag dari Studio
  const handleRemoveTagFromStudio = (tagToRemove: string) => {
    setStudioPlaceholders((prev) => prev.filter((t) => t !== tagToRemove));
    setFeedbackMessage({
      type: 'info',
      title: `Tag {{${tagToRemove}}} Dihapus`,
      description: 'Tag telah dikeluarkan dari daftar tag aktif.',
    });
  };

  // Handler Sisipkan Tag ke Cursor Textarea Studio
  const handleInsertTagToStudioTextarea = (tag: string) => {
    const tagToInsert = `{{${tag}}}`;
    const textarea = studioTextareaRef.current;
    if (!textarea) {
      setStudioBodyText((prev) => `${prev} ${tagToInsert}`);
    } else {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = studioBodyText;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      setStudioBodyText(`${before}${tagToInsert}${after}`);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tagToInsert.length, start + tagToInsert.length);
      }, 50);
    }
    setFeedbackMessage({
      type: 'info',
      title: `Tag ${tagToInsert} Disisipkan`,
      description: 'Tag telah disisipkan ke posisi kursor teks dokumen.',
    });
  };

  // Handler Sisipkan Pemisah Halaman Fisik (Page Break)
  const handleInsertPageBreak = () => {
    const pageBreakTag = '\n\n<!-- PAGE_BREAK -->\n\n';
    const textarea = studioTextareaRef.current;
    if (!textarea) {
      setStudioBodyText((prev) => `${prev}${pageBreakTag}`);
    } else {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = studioBodyText;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      setStudioBodyText(`${before}${pageBreakTag}${after}`);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + pageBreakTag.length, start + pageBreakTag.length);
      }, 50);
    }
    setFeedbackMessage({
      type: 'info',
      title: 'Pemisah Halaman Disisipkan',
      description: 'Penanda lembar baru <!-- PAGE_BREAK --> berhasil ditambahkan.',
    });
  };

  // Handler Replace File DOCX di Studio
  const handleStudioReplaceDocx = async (file: File) => {
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      setFeedbackMessage({
        type: 'error',
        title: 'Format File Tidak Didukung',
        description: 'Mohon unggah berkas berekstensi Microsoft Word (.docx).',
      });
      return;
    }

    try {
      setIsParsingDocx(true);
      const result = await parseDocxFile(file);
      setStudioBodyText(result.rawText);
      if (result.placeholders && result.placeholders.length > 0) {
        setStudioPlaceholders(Array.from(new Set([...studioPlaceholders, ...result.placeholders])));
      }
      setFeedbackMessage({
        type: 'success',
        title: 'Isi Template Berhasil Direplace (.docx)',
        description: `Teks dan ${result.placeholders.length} variabel dari "${file.name}" telah diekstrak ke Studio.`,
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        title: 'Gagal Membaca File DOCX',
        description: err.message || 'Pastikan berkas DOCX valid dan tidak terenkripsi.',
      });
    } finally {
      setIsParsingDocx(false);
    }
  };

  const handleStudioReplaceWithDocx = handleStudioReplaceDocx;
  const handleSaveStudioChanges = handleSaveStudioTemplate;
  const handleStudioApplyPresetSignee = handleApplyRecommendedSignatory;
  const handleStudioSigneeSelect = handleStudioSigneeEmployeeSelect;
  const handleStudioInsertTag = handleInsertTagToStudioTextarea;
  const handleStudioAddNewTag = handleAddTagToStudio;

  // Handler Replace Existing Template dari Tab Templates
  const handleTriggerReplaceExistingTemplate = (tmplId: string) => {
    templateToReplaceIdRef.current = tmplId;
    templateReplaceInputRef.current?.click();
  };

  const handleExecuteReplaceExistingTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetId = templateToReplaceIdRef.current;
    if (!targetId) return;

    try {
      setIsParsingDocx(true);
      const result = await parseDocxFile(file);
      updateDocumentTemplate(targetId, {
        defaultBody: result.rawText,
        extractedPlaceholders: result.placeholders,
        fileName: file.name,
        fileSize: result.fileSize,
        sourceType: 'uploaded_docx',
      });

      const updated = documentTemplates.find((t) => t.id === targetId);
      if (updated) {
        handleLoadTemplateIntoStudio({
          ...updated,
          defaultBody: result.rawText,
          extractedPlaceholders: result.placeholders,
        });
      }

      setFeedbackMessage({
        type: 'success',
        title: 'Template Berhasil Direplace (.docx)',
        description: `Template telah diperbarui dengan file "${file.name}" dan dibuka di Studio Side-by-Side.`,
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        title: 'Gagal Memproses File DOCX',
        description: err.message || 'File tidak dapat diproses.',
      });
    } finally {
      setIsParsingDocx(false);
      if (templateReplaceInputRef.current) templateReplaceInputRef.current.value = '';
    }
  };

  // Enhanced Filter Dokumen
  const filteredDocs = documents.filter((d) => {
    const emp = employees.find((e) => e.id === d.targetEmployeeId);
    const matchesSearch =
      d.documentNumber.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      d.title.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      d.type.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      (emp && emp.fullName.toLowerCase().includes(searchDocQuery.toLowerCase())) ||
      (emp && emp.nik.toLowerCase().includes(searchDocQuery.toLowerCase()));

    const matchesType = docTypeFilter === 'all' || d.type === docTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-5">
      {/* Floating In-App Toast Notification - Portaled to document.body, eliminating layout shifts and backdrop clipping bug */}
      {typeof document !== 'undefined' && feedbackMessage && createPortal(
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-[999999] p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-2xl max-w-md pointer-events-auto ring-1 ring-white/10 toast-floating-enter ${
            feedbackMessage.type === 'success'
              ? 'bg-slate-900 border-emerald-500/50 text-white'
              : feedbackMessage.type === 'error'
              ? 'bg-slate-900 border-rose-500/50 text-white'
              : 'bg-slate-900 border-indigo-500/50 text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {feedbackMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {feedbackMessage.type === 'info' && <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />}
            <div>
              <span className="font-bold">{feedbackMessage.title}:</span>
              {feedbackMessage.description && (
                <span className="ml-1.5 text-slate-200">{feedbackMessage.description}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white transition-colors p-1"
            title="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>,
        document.body
      )}

      {/* Row 1: Header Title & Main Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Tata Kelola Dokumen Legal, Format Kop & Penomoran QR</span>
          </h2>
          <p className="text-xs text-slate-500">
            Dukung upload template dokumen dari file Microsoft Word (.docx), ekstraksi variabel otomatis, format kop surat resmi, penomoran berstandar hukum, dan verifikasi QR UU ITE.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('daftar_tag')}
            className={`flex items-center gap-1.5 px-3 py-2 font-bold rounded-md border text-xs transition-colors shadow-2xs ${
              activeTab === 'daftar_tag'
                ? 'bg-indigo-600 text-white border-indigo-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Buka Menu Daftar Tag Variabel DOCX & Token Formula Lengkap"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Kamus Tag & Token</span>
          </button>
        </div>
      </div>

      {/* Row 2: Standard Sub-Menu Navigation Bar with Icons (Not Parallel to Title) */}
      <ScrollableTabNav className="border-b border-slate-200" containerClassName="pt-1">
        <button
          onClick={() => setActiveTab('arsip')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'arsip'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Arsip Dokumen</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'arsip'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {documents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('studio')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'studio'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Studio Side-by-Side</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'templates'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Template Dokumen</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'templates'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {documentTemplates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('daftar_tag')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'daftar_tag'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Daftar Tag & Token Formula</span>
        </button>

        <button
          onClick={() => setActiveTab('pengaturan')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'pengaturan'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Pengaturan Legal & Logo</span>
        </button>
      </ScrollableTabNav>

      {/* TAB 1: ARSIP DOKUMEN TERBIT */}
      {activeTab === 'arsip' && (
        <div className="space-y-4">
          {/* Filter Bar & Quick Actions */}
          <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nomor dokumen, judul surat, nama karyawan, NIK..."
                  value={searchDocQuery}
                  onChange={(e) => setSearchDocQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50/70 focus:bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800 placeholder-slate-400"
                />
                {searchDocQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchDocQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    title="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Jenis Dokumen Dropdown */}
              <div className="sm:w-56 shrink-0">
                <select
                  value={docTypeFilter}
                  onChange={(e) => setDocTypeFilter(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-slate-50/70 focus:bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700"
                >
                  <option value="all">Semua Jenis Dokumen ({documents.length})</option>
                  {ALL_DOCUMENT_TYPES.map((dt) => (
                    <option key={dt.type} value={dt.type}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Counter info */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Menampilkan <strong className="text-slate-800">{filteredDocs.length}</strong> dari <strong className="text-slate-800">{documents.length}</strong> dokumen resmi diterbitkan.
            </span>
            {(searchDocQuery || docTypeFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchDocQuery('');
                  setDocTypeFilter('all');
                }}
                className="text-indigo-600 hover:text-indigo-800 font-semibold underline text-[11px]"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden space-y-3">
            {filteredDocs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Tidak ada dokumen yang sesuai dengan pencarian atau filter.</p>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const emp = employees.find((e) => e.id === doc.targetEmployeeId);
                const tmpl = documentTemplates.find((t) => t.id === doc.templateId);
                const isDocx = doc.isFromDocxTemplate || tmpl?.sourceType === 'uploaded_docx';

                return (
                  <div
                    key={doc.id}
                    className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-xs transition-all space-y-3"
                  >
                    {/* Card Header: Doc Number & Type Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-indigo-700">
                            {doc.documentNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyAnyToken(doc.documentNumber, 'Nomor Surat')}
                            className="p-1 text-slate-400 hover:text-indigo-600"
                            title="Salin nomor surat"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs mt-1 leading-snug">
                          {doc.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {doc.type}
                        </span>
                        {isDocx && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                            DOCX
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Signee Details & Status */}
                    <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 flex items-center justify-between gap-2 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Penanda Tangan:</span>
                        <div className="font-semibold text-slate-900 truncate">{doc.signeeName}</div>
                        <div className="text-[10px] text-slate-500 truncate">{doc.signeeRole}</div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{doc.status}</span>
                      </span>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{doc.issueDate}</span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Klik untuk Pratinjau & Cetak
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* TAMPILAN DESKTOP: Clean & Well-Structured Data Table (>= md) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px] border-collapse">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold select-none">
                  <tr>
                    <th className="py-3 px-4 w-72">Nomor Surat & Tanggal Terbit</th>
                    <th className="py-3 px-4 min-w-[280px]">Jenis & Judul Dokumen Resmi</th>
                    <th className="py-3 px-4 w-64">Pejabat Penanda Tangan</th>
                    <th className="py-3 px-4 w-44 text-center">Status Keabsahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">Tidak ada arsip dokumen resmi yang sesuai.</p>
                        <p className="text-[11px] text-slate-400 mt-1">Coba ubah kata kunci pencarian atau ganti filter jenis dokumen.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => {
                      const tmpl = documentTemplates.find((t) => t.id === doc.templateId);
                      const isDocx = doc.isFromDocxTemplate || tmpl?.sourceType === 'uploaded_docx';

                      return (
                        <tr
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className="hover:bg-indigo-50/60 transition-colors cursor-pointer group"
                          title="Klik baris untuk membuka pratinjau, unduh PDF/Word, dan cetak dokumen"
                        >
                          {/* 1. Nomor Surat & Tanggal */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-indigo-900 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-200/70 tracking-tight text-[11px]">
                                {doc.documentNumber}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyAnyToken(doc.documentNumber, 'Nomor Surat');
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-600 opacity-60 group-hover:opacity-100 transition-opacity"
                                title="Salin nomor surat ini"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{doc.issueDate}</span>
                            </div>
                          </td>

                          {/* 2. Jenis & Judul Dokumen */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="font-bold text-slate-900 text-xs leading-snug group-hover:text-indigo-700 transition-colors">
                              {doc.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {doc.type}
                              </span>
                              {isDocx ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                                  <FileCode className="w-2.5 h-2.5" />
                                  <span>DOCX</span>
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">
                                  Sistem HR
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Penanda Tangan */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="font-semibold text-slate-900 leading-tight truncate">{doc.signeeName}</div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                              <QrCode className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{doc.signeeRole}</span>
                            </div>
                          </td>

                          {/* 4. Status Keabsahan & Hint */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{doc.status}</span>
                            </span>
                            <div className="text-[9px] text-indigo-600 font-semibold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              Klik untuk Pratinjau
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs for DOCX Replacement */}
      <input
        ref={studioReplaceInputRef}
        type="file"
        accept=".docx,.doc"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleStudioReplaceDocx(e.target.files[0]);
          }
        }}
      />
      <input
        ref={templateReplaceInputRef}
        type="file"
        accept=".docx,.doc"
        className="hidden"
        onChange={handleExecuteReplaceExistingTemplate}
      />

            {/* TAB 2: STUDIO SIDE-BY-SIDE (EDITOR KIRI, LIVE PREVIEW KANAN) */}
      {activeTab === 'studio' && (
        <div className="space-y-4">
          {/* Studio Top Control Bar with Category & Search Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 flex-wrap">
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800">Pilih Template Naskah:</span>
              </div>

              {/* Filter Kategori Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={studioTemplateCategoryFilter}
                  onChange={(e) => setStudioTemplateCategoryFilter(e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all">Semua Kategori ({documentTemplates.length})</option>
                  {TEMPLATE_CATEGORIES.map((cat) => {
                    const count = documentTemplates.filter((t) => getTemplateCategory(t) === cat.id).length;
                    return (
                      <option key={cat.id} value={cat.id}>
                        {cat.label} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Filter Search Input */}
              <div className="relative shrink-0 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studioTemplateSearchQuery}
                  onChange={(e) => setStudioTemplateSearchQuery(e.target.value)}
                  placeholder="Cari naskah / tipe..."
                  className="w-full pl-8 pr-6 py-1 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all"
                />
                {studioTemplateSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudioTemplateSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Main Template Select with Optgroups */}
              {(() => {
                const studioFilteredTemplates = documentTemplates.filter((t) => {
                  const matchesCat =
                    studioTemplateCategoryFilter === 'all' ||
                    getTemplateCategory(t) === studioTemplateCategoryFilter;
                  const matchesQuery =
                    !studioTemplateSearchQuery ||
                    t.name.toLowerCase().includes(studioTemplateSearchQuery.toLowerCase()) ||
                    t.type.toLowerCase().includes(studioTemplateSearchQuery.toLowerCase());
                  return matchesCat && matchesQuery;
                });

                return (
                  <div className="flex items-center gap-1.5 flex-1 min-w-[260px] max-w-lg">
                    <select
                      value={studioSelectedTemplateId}
                      onChange={(e) => {
                        const tmpl = documentTemplates.find((t) => t.id === e.target.value);
                        if (tmpl) handleLoadTemplateIntoStudio(tmpl);
                      }}
                      className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none"
                    >
                      {studioFilteredTemplates.length === 0 ? (
                        <option value="" disabled>
                          Tidak ada template yang cocok
                        </option>
                      ) : studioTemplateCategoryFilter !== 'all' ? (
                        studioFilteredTemplates.map((t, idx) => (
                          <option key={t.id} value={t.id}>
                            {idx + 1}. {t.name} ({t.type})
                          </option>
                        ))
                      ) : (
                        TEMPLATE_CATEGORIES.map((cat) => {
                          const inCat = studioFilteredTemplates.filter(
                            (t) => getTemplateCategory(t) === cat.id
                          );
                          if (inCat.length === 0) return null;
                          return (
                            <optgroup key={cat.id} label={`${cat.label} (${inCat.length})`}>
                              {inCat.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name} ({t.type})
                                </option>
                              ))}
                            </optgroup>
                          );
                        })
                      )}
                    </select>
                    {(studioTemplateCategoryFilter !== 'all' || studioTemplateSearchQuery) && (
                      <button
                        type="button"
                        onClick={() => {
                          setStudioTemplateCategoryFilter('all');
                          setStudioTemplateSearchQuery('');
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs shrink-0 cursor-pointer"
                        title="Reset filter dropdown"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                ref={studioReplaceInputRef}
                type="file"
                accept=".docx,.doc"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleStudioReplaceWithDocx(e.target.files[0]);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => studioReplaceInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors flex items-center gap-1.5"
                title="Ganti isi template ini dengan file Word (.docx) baru"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Replace dengan DOCX</span>
              </button>
              <button
                type="button"
                onClick={handleSaveStudioChanges}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Template</span>
              </button>
            </div>
          </div>

          {/* Studio Grid: 2 Kolom Side-by-Side (50% Kiri Editor, 50% Kanan Live Preview A4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* KOLOM KIRI: EDITOR NASKAH, FORMULA, PEJABAT & TAG TOOLS (5 dari 12 kolom) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Selector Bagian Konfigurasi Studio (Naskah, Kop Surat, Footer) */}
              <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setStudioConfigSection('naskah')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    studioConfigSection === 'naskah'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>1. Naskah & TTD</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudioConfigSection('kop')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    studioConfigSection === 'kop'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>2. Kop Surat (Header)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudioConfigSection('footer')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    studioConfigSection === 'footer'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>3. Footer & Lembar</span>
                </button>
              </div>

              {/* SECTION 1: NASKAH, FORMULA & PEJABAT PENANDATANGAN */}
              {studioConfigSection === 'naskah' && (
                <>
                  {/* Box 1: Info Judul & Pola Penomoran */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                      <span>Identitas & Formula Surat</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                        {studioTemplateType}
                      </span>
                    </h4>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Judul Resmi Dokumen
                      </label>
                      <input
                        type="text"
                        value={studioTemplateName}
                        onChange={(e) => setStudioTemplateName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Formula Penomoran Otomatis
                        </label>
                        <span className="text-[10px] text-slate-400">Gunakan {'{TOKEN}'}</span>
                      </div>
                      <input
                        type="text"
                        value={studioNumberingPattern}
                        onChange={(e) => setStudioNumberingPattern(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold text-xs text-indigo-700 bg-indigo-50/30"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {NUMBERING_TOKENS.slice(0, 5).map(t => (
                          <button
                            key={t.token}
                            type="button"
                            onClick={() => {
                              setStudioNumberingPattern(prev => prev.endsWith('/') ? `${prev}${t.token}` : `${prev}/${t.token}`);
                            }}
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-100 hover:bg-indigo-100 text-slate-700 border border-slate-200"
                            title={t.description}
                          >
                            {t.token}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Box 2: Simulasi Tanda Tangan Dokumen / Approval Fleksibel (Konsep Personalia & Eksternal) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span>Simulasi Tanda Tangan Dokumen (Penandatangan / Approval)</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Jumlah kolom & label fleksibel (bisa 1, 2, atau 3 kolom). Pejabat dapat dari internal maupun pihak eksternal.
                        </p>
                      </div>

                      {/* Preset Switcher Susunan */}
                      <div className="flex items-center gap-1 shrink-0 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium">Susunan:</span>
                        <button
                          type="button"
                          onClick={() => applyStudioSignatoryPreset('3-tier')}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                            studioSignatories.length === 3
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                          title="3 Kolom: Dibuat Oleh · Mengetahui · Menyetujui (Standar SK)"
                        >
                          3 Pihak
                        </button>
                        <button
                          type="button"
                          onClick={() => applyStudioSignatoryPreset('2-tier')}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                            studioSignatories.length === 2
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                          title="2 Kolom: Pihak Pertama & Pihak Kedua (Kontrak/BAST/NDA)"
                        >
                          2 Pihak
                        </button>
                        <button
                          type="button"
                          onClick={() => applyStudioSignatoryPreset('1-tier')}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                            studioSignatories.length === 1
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                          title="1 Kolom: Ditetapkan Oleh (Tunggal)"
                        >
                          1 Pihak
                        </button>
                      </div>
                    </div>

                    {/* Signatories List Cards */}
                    <div className="space-y-3">
                      {studioSignatories.map((sig, idx) => (
                        <div
                          key={sig.id || idx}
                          className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2.5 relative group hover:border-indigo-300 transition-colors"
                        >
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-slate-800 text-[11px]">
                                Kolom {idx + 1}
                              </span>
                              {sig.isExternal && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                                  Pihak Eksternal
                                </span>
                              )}
                            </div>

                            {studioSignatories.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveStudioSignatory(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Hapus kolom penandatangan ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* 1. Keterangan / Label Tanda Tangan */}
                          <div>
                            <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                              Keterangan Tanda Tangan *
                            </label>
                            <input
                              type="text"
                              value={sig.label}
                              onChange={(e) => handleUpdateStudioSignatory(idx, 'label', e.target.value)}
                              placeholder="Contoh: Pihak Pertama, Pihak Kedua, Dibuat Oleh, Menyetujui"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-900 bg-white"
                            />
                            <div className="flex flex-wrap gap-1 mt-1">
                              {['Pihak Pertama', 'Pihak Kedua', 'Dibuat Oleh', 'Mengetahui', 'Menyetujui', 'Disetujui Oleh'].map((chip) => (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => handleUpdateStudioSignatory(idx, 'label', chip)}
                                  className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                    sig.label === chip
                                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                                  }`}
                                >
                                  {chip}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 2. Pilih Pejabat atau Input Eksternal */}
                          <div>
                            <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                              Pejabat / Penandatangan *
                            </label>
                            <EmployeeSelect
                              employees={employees}
                              value={sig.employeeId || (sig.name ? '__manual__' : '')}
                              onChange={(empId) => handleStudioSignatoryEmployeeSelect(idx, empId)}
                              placeholder="-- Pilih Pejabat Internal / Input Eksternal --"
                              allowManual
                              manualLabel="+ Input Manual / Pihak Eksternal"
                            />
                          </div>

                          {/* Manual Name & External Org (Jika Manual / Eksternal) */}
                          {(sig.employeeId === '__manual__' || sig.isExternal || !employees.some(e => e.id === sig.employeeId)) && (
                            <div className="p-2.5 bg-indigo-50/40 rounded border border-indigo-100 space-y-2">
                              <div>
                                <label className="text-[10px] font-semibold text-indigo-900 block mb-0.5">
                                  Nama Lengkap Pejabat (Internal / Eksternal) *
                                </label>
                                <input
                                  type="text"
                                  value={sig.name}
                                  onChange={(e) => handleUpdateStudioSignatory(idx, 'name', e.target.value)}
                                  placeholder="Contoh: Ir. Budi Santoso, MBA"
                                  className="w-full px-2.5 py-1.5 border border-indigo-200 rounded text-xs font-semibold text-slate-900 bg-white"
                                />
                              </div>
                              <label className="flex items-center gap-1.5 text-[10px] text-slate-700 font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!sig.isExternal}
                                  onChange={(e) => handleUpdateStudioSignatory(idx, 'isExternal', e.target.checked)}
                                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                                />
                                <span>Tandai sebagai Pihak Eksternal (Mitra / Rekanan / Notaris / Vendor)</span>
                              </label>
                            </div>
                          )}

                          {/* 3. Jabatan / Peran Resmi */}
                          <div>
                            <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                              Jabatan / Peran Resmi *
                            </label>
                            <input
                              type="text"
                              value={sig.role || ''}
                              onChange={(e) => handleUpdateStudioSignatory(idx, 'role', e.target.value)}
                              placeholder="Contoh: President Director & CEO / Kuasa Hukum / Direktur PT Mitra"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tombol Tambah Kolom Penandatangan */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleAddStudioSignatory}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition-all hover:border-indigo-400 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Kolom Penandatangan</span>
                      </button>
                    </div>
                  </div>

                  {/* Box 3: Editor Teks Klausul Naskah */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Naskah & Klausul Baku</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={studioHighlightTags}
                            onChange={(e) => setStudioHighlightTags(e.target.checked)}
                            className="w-3 h-3 text-indigo-600 rounded"
                          />
                          <span>Sorot Tag</span>
                        </label>
                      </div>
                    </div>

                    {/* Quick Insert Variable Tag Bar (Daftar Token Lengkap Sesuai Template Dokumen) */}
                    <div className="space-y-2 p-2.5 bg-slate-50/90 rounded-xl border border-slate-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-700 font-bold flex items-center gap-1">
                            <Layers className="w-3 h-3 text-indigo-600" />
                            <span>Variabel Token:</span>
                          </span>
                          <div className="inline-flex rounded-md bg-white border border-slate-200 p-0.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setStudioTagSourceMode('template')}
                              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                                studioTagSourceMode === 'template'
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Naskah Ini ({studioPlaceholders.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudioTagSourceMode('all')}
                              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                                studioTagSourceMode === 'all'
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Semua Token ({Object.keys(KNOWN_VARIABLE_DESCRIPTIONS).length})
                            </button>
                          </div>
                        </div>

                        {/* Search & Category Filter for Tags in Studio */}
                        {studioTagSourceMode === 'all' && (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={studioTagCategoryFilter}
                              onChange={(e) => setStudioTagCategoryFilter(e.target.value)}
                              className="text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer max-w-[130px]"
                            >
                              <option value="all">Semua Kategori</option>
                              {Array.from(new Set(Object.values(KNOWN_VARIABLE_DESCRIPTIONS).map((v) => v.category).filter(Boolean))).map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={studioTagSearchQuery}
                              onChange={(e) => setStudioTagSearchQuery(e.target.value)}
                              placeholder="Cari tag..."
                              className="w-24 text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>

                      {/* Tag List Buttons */}
                      {(() => {
                        let tagsToDisplay: string[] = [];
                        if (studioTagSourceMode === 'template') {
                          tagsToDisplay = studioPlaceholders;
                        } else {
                          tagsToDisplay = Object.keys(KNOWN_VARIABLE_DESCRIPTIONS).filter((key) => {
                            const meta = KNOWN_VARIABLE_DESCRIPTIONS[key];
                            const matchesCat = studioTagCategoryFilter === 'all' || meta.category === studioTagCategoryFilter;
                            const matchesQuery = !studioTagSearchQuery || key.toLowerCase().includes(studioTagSearchQuery.toLowerCase()) || meta.label.toLowerCase().includes(studioTagSearchQuery.toLowerCase());
                            return matchesCat && matchesQuery;
                          });
                        }

                        return (
                          <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 bg-white rounded-lg border border-slate-200 scrollbar-thin">
                            {tagsToDisplay.length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic p-1">
                                Tidak ada tag yang cocok dengan filter pencarian.
                              </span>
                            ) : (
                              tagsToDisplay.map((tag) => {
                                const meta = KNOWN_VARIABLE_DESCRIPTIONS[tag];
                                const tooltip = meta
                                  ? `{{${tag}}} : ${meta.label}\nContoh: ${meta.example}\nKategori: ${meta.category || '-'}`
                                  : `Sisipkan {{${tag}}}`;

                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                      handleStudioInsertTag(tag);
                                      if (!studioPlaceholders.includes(tag)) {
                                        setStudioPlaceholders((prev) => [...prev, tag]);
                                      }
                                    }}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-700 border border-slate-200 transition-colors shadow-2xs cursor-pointer group"
                                    title={tooltip}
                                  >
                                    <span className="text-slate-400 font-sans group-hover:text-indigo-500">+</span> {`{{${tag}}}`}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        );
                      })()}

                      {/* Add Custom Tag Inline */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <input
                          type="text"
                          placeholder="Tambah tag kustom baru (contoh: lokasi_kerja)..."
                          value={studioNewTagInput}
                          onChange={(e) => setStudioNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleStudioAddNewTag();
                            }
                          }}
                          className="flex-1 px-2.5 py-1 border border-slate-300 rounded text-[11px] bg-white focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleStudioAddNewTag}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold border border-slate-300 cursor-pointer"
                        >
                          + Tag
                        </button>
                      </div>
                    </div>

                    {/* Textarea Naskah & Toolbar Basic Editing Dokumen */}
                    <div className="space-y-0">
                      {/* TOOLBAR BASIC EDITING DOKUMEN RESMI (BOLD, ITALIC, UNDERLINES, ALIGNMENT, DLL) */}
                      <div className="bg-slate-100 border border-slate-300 rounded-t-lg p-2 flex flex-wrap items-center gap-1.5 text-slate-700 shadow-2xs">
                        {/* Kelompok 1: Font Styling (Bold, Italic, Strikethrough) */}
                        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-md border border-slate-200 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleStudioApplyFormat('<b>', '</b>', 'teks tebal')}
                            className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Tebal / Bold"
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStudioApplyFormat('<i>', '</i>', 'teks miring')}
                            className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Miring / Italic"
                          >
                            <Italic className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStudioApplyFormat('<s style="text-decoration: line-through;">', '</s>', 'teks coret')}
                            className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Coret / Strikethrough"
                          >
                            <Strikethrough className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Kelompok 2: Underline & Jenis-jenis Garis Bawah (Solid, Double, Dashed, Dotted, Wavy) */}
                        <div className="relative inline-block text-left" ref={underlineDropdownRef}>
                          <div className="flex items-center bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleStudioApplyFormat('<u>', '</u>', 'teks garis bawah')}
                              className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 transition-colors flex items-center gap-0.5 cursor-pointer"
                              title="Garis Bawah Tunggal (Solid Baku)"
                            >
                              <Underline className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsUnderlineMenuOpen(!isUnderlineMenuOpen)}
                              className="px-1 py-1.5 hover:bg-slate-100 hover:text-indigo-600 border-l border-slate-200 transition-colors cursor-pointer"
                              title="Pilih Ragam Jenis Garis Bawah (Ganda, Putus-putus, Titik, Bergelombang)"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Dropdown Menu Ragam Jenis Garis Bawah */}
                          {isUnderlineMenuOpen && (
                            <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-300 rounded-xl shadow-xl py-1.5 z-40 text-xs">
                              <div className="px-3 py-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                Pilih Ragam Garis Bawah:
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  handleStudioApplyFormat('<u style="text-decoration: underline; text-underline-offset: 2.5px;">', '</u>', 'garis bawah tunggal');
                                  setIsUnderlineMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between cursor-pointer transition-colors"
                              >
                                <span>1. Tunggal / Solid (Standar)</span>
                                <span style={{ textDecoration: 'underline', textUnderlineOffset: '2.5px' }} className="font-serif text-[11px] font-bold">Contoh</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleStudioApplyFormat('<u style="text-decoration: underline double; text-underline-offset: 3px;">', '</u>', 'garis bawah ganda');
                                  setIsUnderlineMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between cursor-pointer transition-colors"
                              >
                                <span>2. Ganda / Double</span>
                                <span style={{ textDecoration: 'underline double', textUnderlineOffset: '3px' }} className="font-serif text-[11px] font-bold">Contoh</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleStudioApplyFormat('<u style="text-decoration: underline dashed; text-underline-offset: 3px;">', '</u>', 'garis bawah putus');
                                  setIsUnderlineMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between cursor-pointer transition-colors"
                              >
                                <span>3. Putus-Putus / Dashed</span>
                                <span style={{ textDecoration: 'underline dashed', textUnderlineOffset: '3px' }} className="font-serif text-[11px] font-bold">Contoh</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleStudioApplyFormat('<u style="text-decoration: underline dotted; text-underline-offset: 3px;">', '</u>', 'garis bawah titik');
                                  setIsUnderlineMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between cursor-pointer transition-colors"
                              >
                                <span>4. Titik-Titik / Dotted</span>
                                <span style={{ textDecoration: 'underline dotted', textUnderlineOffset: '3px' }} className="font-serif text-[11px] font-bold">Contoh</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleStudioApplyFormat('<u style="text-decoration: underline wavy; text-underline-offset: 3px;">', '</u>', 'garis bergelombang');
                                  setIsUnderlineMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between cursor-pointer transition-colors"
                              >
                                <span>5. Bergelombang / Wavy</span>
                                <span style={{ textDecoration: 'underline wavy', textUnderlineOffset: '3px' }} className="font-serif text-[11px] font-bold">Contoh</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Kelompok 3: Perataan Teks (Alignment: Kiri, Tengah, Kanan, Justify) */}
                        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-md border border-slate-200 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleStudioApplyFormat('<div style="text-align: left;">', '</div>', 'Teks rata kiri')}
                            className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Rata Kiri (Align Left)"
                          >
                            <AlignLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStudioApplyFormat('<div style="text-align: center;">', '</div>', 'Teks rata tengah')}
                            className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Rata Tengah (Align Center)"
                          >
                            <AlignCenter className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStudioApplyFormat('<div style="text-align: right;">', '</div>', 'Teks rata kanan')}
                            className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Rata Kanan (Align Right)"
                          >
                            <AlignRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStudioApplyFormat('<div style="text-align: justify;">', '</div>', 'Teks rata kiri-kanan')}
                            className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Rata Kiri-Kanan (Align Justify)"
                          >
                            <AlignJustify className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Kelompok 4: Judul BAB & Pasal Perjanjian Resmi */}
                        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-md border border-slate-200 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleStudioApplyFormat('\n<div style="text-align: center; font-weight: bold; margin-top: 14px; margin-bottom: 4px; text-transform: uppercase;">', '</div>\n', 'BAB I - KETENTUAN UMUM')}
                            className="px-2 py-1 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors text-[10px] font-bold cursor-pointer"
                            title="Format Judul BAB Resmi (Tengah & Tebal)"
                          >
                            BAB
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStudioApplyFormat('\n<div style="text-align: center; font-weight: bold; margin-top: 10px; margin-bottom: 2px;">', '</div>\n', 'Pasal 1 - Ruang Lingkup')}
                            className="px-2 py-1 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors text-[10px] font-bold cursor-pointer"
                            title="Format Judul Pasal Resmi (Tengah & Tebal)"
                          >
                            Pasal
                          </button>
                        </div>

                        {/* Kelompok 5: Poin Daftar, Pembatas Garis & Pemisah Halaman Fisik */}
                        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-md border border-slate-200 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleStudioApplyFormat('\n• ', '', 'Poin butir klausul')}
                            className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Daftar Butir (Bullet List)"
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStudioApplyFormat('\n1. ', '', 'Poin bernomor')}
                            className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Daftar Angka (Numbered List)"
                          >
                            <ListOrdered className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStudioApplyFormat('\n<hr style="border: 0; border-top: 1.5px solid #0f172a; margin: 14px 0;" />\n', '', '')}
                            className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Garis Horisontal Pemisah"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStudioApplyFormat('\n[PAGE_BREAK]\n', '', '')}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition-colors flex items-center gap-1 font-bold text-[10px] border border-indigo-200 cursor-pointer"
                            title="Sisipkan Batas Halaman Fisik A4 Baru ([PAGE_BREAK])"
                          >
                            <Scissors className="w-3 h-3 text-indigo-600" />
                            <span>Halaman Baru</span>
                          </button>
                        </div>
                      </div>

                      <textarea
                        ref={studioTextareaRef}
                        rows={12}
                        value={studioBodyText}
                        onChange={(e) => setStudioBodyText(e.target.value)}
                        className="w-full p-3 border border-slate-300 border-t-0 rounded-b-lg font-mono text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                        placeholder="Ketik isi naskah dokumen dengan {{variabel_dinamis}} atau gunakan tombol format di atas..."
                      />
                    </div>
                  </div>
                </>
              )}

              {/* SECTION 2: PENGATURAN KOP SURAT RESMI (HEADER) */}
              {studioConfigSection === 'kop' && (
                <div className="space-y-4">
                  {/* Card 1: Toggle & Gaya Garis Pembatas Kop */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-bold text-slate-900">Kop Surat Resmi (Halaman 1)</h4>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={studioShowLetterhead}
                          onChange={(e) => setStudioShowLetterhead(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span>Tampilkan Kop</span>
                      </label>
                    </div>

                    {/* Pilihan Gaya Garis Pembatas */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                        Gaya Garis Pembatas Kop (Border Line):
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'double', label: 'Garis Ganda (Resmi)', preview: 'border-b-4 border-double border-slate-900' },
                          { id: 'bold', label: 'Garis Tebal', preview: 'border-b-2 border-slate-900' },
                          { id: 'single', label: 'Garis Tipis', preview: 'border-b border-slate-400' },
                          { id: 'none', label: 'Tanpa Garis', preview: 'border-b border-dashed border-slate-200' },
                        ].map((styleOpt) => (
                          <button
                            key={styleOpt.id}
                            type="button"
                            onClick={() => setStudioLetterheadStyle(styleOpt.id as any)}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                              studioLetterheadStyle === styleOpt.id
                                ? 'bg-indigo-50/50 border-indigo-600 text-indigo-900 shadow-2xs ring-1 ring-indigo-600'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <span className="text-[10px] font-bold block mb-1">{styleOpt.label}</span>
                            <div className={`w-full h-1 ${styleOpt.preview}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pilihan Perataan Kop (Alignment) */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                        Tata Letak & Perataan Kop Surat:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setStudioLetterheadAlign('left')}
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                            studioLetterheadAlign === 'left'
                              ? 'bg-indigo-50/50 border-indigo-600 text-indigo-900 shadow-2xs ring-1 ring-indigo-600 font-bold'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <AlignLeft className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="text-[10px] font-bold">Rata Kiri</span>
                          </div>
                          <span className="text-slate-500 text-[9px] line-clamp-1">Logo di kiri, teks di samping</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudioLetterheadAlign('center')}
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                            studioLetterheadAlign === 'center'
                              ? 'bg-indigo-50/50 border-indigo-600 text-indigo-900 shadow-2xs ring-1 ring-indigo-600 font-bold'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <AlignCenter className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="text-[10px] font-bold">Rata Tengah</span>
                          </div>
                          <span className="text-slate-500 text-[9px] line-clamp-1">Logo di atas, teks di tengah</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudioLetterheadAlign('right')}
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                            studioLetterheadAlign === 'right'
                              ? 'bg-indigo-50/50 border-indigo-600 text-indigo-900 shadow-2xs ring-1 ring-indigo-600 font-bold'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <AlignRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="text-[10px] font-bold">Rata Kanan</span>
                          </div>
                          <span className="text-slate-500 text-[9px] line-clamp-1">Logo di kanan, teks ke kanan</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Mode Format Kop Surat (Terstruktur vs Teks Bebas / Free Text) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-bold text-slate-900">
                        Format Teks Kop Surat
                      </h4>
                      {/* Mode Switcher */}
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setStudioLetterheadMode('structured')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            studioLetterheadMode === 'structured'
                              ? 'bg-white text-indigo-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Form Terstruktur
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudioLetterheadMode('freetext')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            studioLetterheadMode === 'freetext'
                              ? 'bg-white text-indigo-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Teks Bebas (Free Text)
                        </button>
                      </div>
                    </div>

                    {/* JIKA MODE FREE TEXT (Teks Bebas Tanpa Title Bawaan) */}
                    {studioLetterheadMode === 'freetext' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-slate-700 block">
                            Naskah Kop Surat Bebas (Tanpa Title / Label Bawaan)
                          </label>
                          <span className="text-[10px] text-slate-400">Mendukung multi-baris</span>
                        </div>
                        <textarea
                          rows={5}
                          value={studioLetterheadFreeText}
                          onChange={(e) => setStudioLetterheadFreeText(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white font-serif leading-relaxed"
                          placeholder={`PT NUSANTARA TEKNOLOGI MANDIRI\nMenara Palma Lt. 18, Jl. HR Rasuna Said, Jakarta Selatan\nHotline: 021-55667788 · info@nusantara.id\nIzin Operasional No: AHU-001234.AH.01.01.TAHUN 2024`}
                        />
                        <p className="text-[10px] text-slate-500 leading-snug">
                          Ketik teks kop surat apa adanya tanpa title bawaan seperti "Telp:" atau "Email:". Teks akan tercetak sesuai perataan (kiri, tengah, kanan).
                        </p>
                      </div>
                    ) : (
                      /* JIKA MODE FORM TERSTRUKTUR (Hanya menampilkan field yang diisi) */
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                          Catatan: Field yang dikosongkan (seperti Nomor Telepon, Email, Alamat, atau NPWP) tidak akan memunculkan judul label maupun nilainya di lembar dokumen.
                        </p>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                            Nama Perusahaan / Instansi
                          </label>
                          <input
                            type="text"
                            value={studioCompanyName}
                            onChange={(e) => setStudioCompanyName(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-900 bg-white"
                            placeholder="Contoh: PT Nusantara Teknologi Mandiri"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                            Alamat Lengkap Perusahaan
                          </label>
                          <textarea
                            rows={2}
                            value={studioCompanyAddress}
                            onChange={(e) => setStudioCompanyAddress(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white leading-relaxed"
                            placeholder="Kosongkan jika tidak ingin mencetak alamat..."
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                              Nomor Telepon
                            </label>
                            <input
                              type="text"
                              value={studioCompanyPhone}
                              onChange={(e) => setStudioCompanyPhone(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white"
                              placeholder="Kosongkan jika tidak ada..."
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                              Alamat Email Resmi
                            </label>
                            <input
                              type="text"
                              value={studioCompanyEmail}
                              onChange={(e) => setStudioCompanyEmail(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white"
                              placeholder="Kosongkan jika tidak ada..."
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                            NPWP Perusahaan
                          </label>
                          <input
                            type="text"
                            value={studioCompanyNpwp}
                            onChange={(e) => setStudioCompanyNpwp(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono text-slate-800 bg-white"
                            placeholder="Kosongkan jika tidak ada..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Logo Kop Kustom */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-semibold text-slate-600">
                          URL Logo Kop Kustom (Opsional)
                        </label>
                        {studioCustomLogoUrl && (
                          <button
                            type="button"
                            onClick={() => setStudioCustomLogoUrl('')}
                            className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                          >
                            Reset ke Logo Perusahaan
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={studioCustomLogoUrl}
                        onChange={(e) => setStudioCustomLogoUrl(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white"
                        placeholder="https://... (kosongkan untuk menggunakan logo tenant default)"
                      />
                    </div>
                  </div>

                  {/* Card 3: Running Header Halaman Lanjutan */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                      <span>Running Header (Halaman 2 ke Atas)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        Multi-Page
                      </span>
                    </h4>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Teks Judul di Header Halaman Lanjutan
                      </label>
                      <input
                        type="text"
                        value={studioRunningHeaderText}
                        onChange={(e) => setStudioRunningHeaderText(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white"
                        placeholder="Kosongkan untuk otomatis menggunakan Judul Dokumen"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Secara otomatis disandingkan dengan Nomor Dokumen di sisi kanan atas lembar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: PENGATURAN FOOTER & LEMBAR RESMI */}
              {studioConfigSection === 'footer' && (
                <div className="space-y-4">
                  {/* Card 1: Catatan Kaki Legal */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Catatan Kaki Resmi (Footer Legal Notice)</span>
                      </h4>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Teks Catatan Kaki / Legal Statement
                      </label>
                      <textarea
                        rows={2}
                        value={studioFooterText}
                        onChange={(e) => setStudioFooterText(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white leading-relaxed"
                        placeholder="Teks keterangan legal di bagian paling bawah lembar..."
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] text-slate-400 font-medium self-center mr-1">Preset:</span>
                        <button
                          type="button"
                          onClick={() => setStudioFooterText('Dokumen ini sah dan berkekuatan hukum tetap menurut UU ITE No. 11/2008.')}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded text-[10px] border border-slate-200 cursor-pointer"
                        >
                          UU ITE Resmi
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudioFooterText('STRICTLY CONFIDENTIAL - Dokumen internal rahasia PT Nusantara Teknologi Mandiri.')}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded text-[10px] border border-slate-200 cursor-pointer"
                        >
                          Confidential
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudioFooterText(`${studioCompanyName} · Dokumen Resmi Terotentikasi HR & Legal Division`)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded text-[10px] border border-slate-200 cursor-pointer"
                        >
                          Divisi HR
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Format Nomor Halaman & Tata Letak Footer */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                      Format Nomor Halaman & Tata Letak
                    </h4>

                    {/* Format Nomor Halaman */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                        Format Penomoran Halaman:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'standard', label: 'Halaman X dari Y', desc: 'Standar resmi surat keputusan dinas' },
                          { id: 'slash', label: 'X / Y', desc: 'Contoh: 1 / 3 (Gaya korporat ringkas)' },
                          { id: 'simple', label: 'Hal. X', desc: 'Hanya menampilkan nomor halaman aktif' },
                          { id: 'none', label: 'Sembunyikan', desc: 'Tanpa nomor halaman pada dokumen' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setStudioPageNumFormat(opt.id as any)}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                              studioPageNumFormat === opt.id
                                ? 'bg-indigo-50/50 border-indigo-600 text-indigo-900 shadow-2xs ring-1 ring-indigo-600'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <span className="text-[10px] font-bold block">{opt.label}</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Perataan Footer */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                        Tata Letak Posisi Footer:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'split', label: 'Kiri & Kanan', desc: 'Teks di kiri, nomor di kanan' },
                          { id: 'center', label: 'Rata Tengah', desc: 'Semua elemen di tengah' },
                          { id: 'right', label: 'Rata Kanan', desc: 'Nomor halaman di kanan' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setStudioFooterAlign(opt.id as any)}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                              studioFooterAlign === opt.id
                                ? 'bg-indigo-50/50 border-indigo-600 text-indigo-900 shadow-2xs ring-1 ring-indigo-600'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <span className="text-[10px] font-bold block">{opt.label}</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Garis Batas Footer */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="text-[11px] text-slate-700 flex items-center gap-2 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={studioShowFooterBorder}
                          onChange={(e) => setStudioShowFooterBorder(e.target.checked)}
                          className="w-3.5 h-3.5 text-indigo-600 rounded"
                        />
                        <span>Tampilkan Garis Batas Pemisah Footer (Border Top)</span>
                      </label>
                    </div>
                  </div>

                  {/* Card 3: Pilihan Format Ukuran Kertas Fisik (A4 / F4) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                      <span>Ukuran Lembar Dokumen Fisik</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                        Standar Indonesia
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setStudioPaperSize('A4')}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          studioPaperSize === 'A4'
                            ? 'bg-indigo-50/50 border-indigo-600 text-indigo-900 shadow-2xs ring-1 ring-indigo-600'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">Kertas A4</span>
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                            210 × 297 mm
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug">
                          Standar ISO korporat, perjanjian kerja (PKWT/PKWTT), dan laporan umum.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudioPaperSize('F4')}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          studioPaperSize === 'F4'
                            ? 'bg-indigo-50/50 border-indigo-600 text-indigo-900 shadow-2xs ring-1 ring-indigo-600'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">Kertas F4 / Folio</span>
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                            215 × 330 mm
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug">
                          Standar naskah dinas ketenagakerjaan, kontrak pengadaan, dan dokumen legal RI.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudioPaperSize('A5')}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          studioPaperSize === 'A5'
                            ? 'bg-indigo-50/50 border-indigo-600 text-indigo-900 shadow-2xs ring-1 ring-indigo-600'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">Kertas A5</span>
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                            148 × 210 mm
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug">
                          Format ringkas voucher slip gaji, pengajuan cuti/izin, tiket IT & ATK.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Card 4: Keabsahan Hukum & Tanda Tangan Elektronik */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Keabsahan & Tanda Tangan Digital</span>
                    </h4>

                    <div className="space-y-3">
                      <label className="text-[11px] text-slate-700 flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={studioShowQrSignature}
                          onChange={(e) => setStudioShowQrSignature(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <div>
                          <span className="font-bold block text-slate-800">QR Digital Signature Para Pihak</span>
                          <span className="text-[10px] text-slate-500 block">Menampilkan QR Code otentikasi pejabat & para pihak pada kolom tanda tangan</span>
                        </div>
                      </label>

                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                        <label className="text-[11px] text-slate-700 flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={studioShowQrValidation}
                            onChange={(e) => setStudioShowQrValidation(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <div>
                            <span className="font-bold block text-slate-800">Stempel Sertifikasi Keabsahan UU ITE di Footer</span>
                            <span className="text-[10px] text-slate-500 block">Menampilkan stempel resmi & QR verifikasi pembuktian hukum UU ITE No. 11/2008 pada area footer</span>
                          </div>
                        </label>

                        {/* Opsi Penempatan Stempel UU ITE: Semua Halaman vs Halaman Terakhir */}
                        {studioShowQrValidation && (
                          <div className="pt-2 border-t border-slate-200 pl-6 space-y-1.5">
                            <label className="text-[10px] font-semibold text-slate-600 block">
                              Posisi Tampil Stempel Sertifikasi UU ITE di Footer:
                            </label>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-800">
                                <input
                                  type="radio"
                                  name="qrValidationPlacement"
                                  checked={studioQrValidationPlacement === 'all_pages'}
                                  onChange={() => setStudioQrValidationPlacement('all_pages')}
                                  className="w-3.5 h-3.5 text-indigo-600"
                                />
                                <span>Semua Halaman</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-800">
                                <input
                                  type="radio"
                                  name="qrValidationPlacement"
                                  checked={studioQrValidationPlacement === 'last_page'}
                                  onChange={() => setStudioQrValidationPlacement('last_page')}
                                  className="w-3.5 h-3.5 text-indigo-600"
                                />
                                <span>Halaman Terakhir Saja</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* KOLOM KANAN: LIVE PREVIEW DOKUMEN MULTI-HALAMAN REAL (Sticky Saat Scroll) */}
            <div className="lg:col-span-7 space-y-3 lg:sticky lg:top-2 self-start z-10">
              {/* Live Preview Top Controls (Simulasikan Pegawai DIHILANGKAN, Ditambahkan Badge/Toggle Kertas) */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Live Preview Dokumen Fisik ({studioPaperSize}):
                  </span>
                </div>
                {/* Opsi Pilih Kertas Cepat A4 / F4 / A5 */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setStudioPaperSize('A4')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      studioPaperSize === 'A4'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    A4 (210 × 297 mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudioPaperSize('F4')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      studioPaperSize === 'F4'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    F4 / Folio (215 × 330 mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudioPaperSize('A5')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      studioPaperSize === 'A5'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    A5 (148 × 210 mm)
                  </button>
                </div>
              </div>

              {/* Naskah Dinas Live Preview Render dengan Batasan Panjang (max-h) & Scroll */}
              {(() => {
                const fallbackSimulatedEmployee: Employee = (employees && employees[0]) ? employees[0] : ({
                  id: 'simulated-emp',
                  tenantId: currentTenant?.id || 'tenant-001',
                  nik: 'NTM-2024-001',
                  fullName: 'Ahmad Fauzi, S.Kom.',
                  email: 'ahmad.fauzi@nusantara.id',
                  phone: '081298765432',
                  employmentType: 'Kontrak',
                  contractDocNumber: '001/PKWT/2024',
                  contractStartDate: '2023-01-10',
                  probationStatus: 'Lolos',
                  department: 'Teknologi & Informasi',
                  position: 'Senior Software Engineer',
                  grade: 'L4',
                  joinDate: '2023-01-10',
                  status: 'Aktif',
                  remainingLeaveDays: 12,
                  basicSalary: 12500000,
                } as Employee);
                const simulatedEmployee = (employees && employees.length > 0)
                  ? (employees.find(e => e.id === studioSimulatedEmpId) || employees[0])
                  : fallbackSimulatedEmployee;
                const simulatedDocNumber = evaluateNumberingFormula(
                  studioNumberingPattern,
                  documents.length + 1,
                  currentTenant.code,
                  new Date()
                );
                const resolvedContent = interpolateDocxTemplate(studioBodyText, {
                  employee: simulatedEmployee,
                  tenant: currentTenant,
                  documentNumber: simulatedDocNumber,
                  signeeName: studioSigneeName,
                  signeeRole: studioSigneeRole,
                });

                const previewDocObj: OfficialDocument = {
                  id: `studio-live-preview`,
                  tenantId: currentTenant?.id || 'tenant-001',
                  type: studioTemplateType,
                  title: studioTemplateName,
                  documentNumber: simulatedDocNumber,
                  issueDate: new Date().toISOString().split('T')[0],
                  targetEmployeeId: simulatedEmployee.id,
                  signeeName: studioSigneeName,
                  signeeRole: studioSigneeRole,
                  status: 'Resmi Diterbitkan',
                  contentPreview: resolvedContent,
                  qrVerificationUrl: `https://nusantara.id/verify/${simulatedDocNumber}?status=valid`,
                  templateId: studioSelectedTemplateId,
                };

                return (
                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-md bg-slate-200 p-2 sm:p-4 max-h-[calc(100vh-140px)] overflow-y-auto">
                    <OfficialMultiPageDocumentSheet
                      title={previewDocObj.title}
                      documentNumber={previewDocObj.documentNumber}
                      content={previewDocObj.contentPreview}
                      employee={simulatedEmployee}
                      tenant={currentTenant}
                      signeeName={studioSigneeName}
                      signeeRole={studioSigneeRole}
                      issueDate={previewDocObj.issueDate}
                      footerText={studioFooterText}
                      showLetterhead={studioShowLetterhead}
                      showQrSignature={studioShowQrSignature}
                      showQrValidation={studioShowQrValidation}
                      highlightTags={studioHighlightTags}
                      paperSize={studioPaperSize}
                      letterheadCompanyName={studioCompanyName}
                      letterheadAddress={studioCompanyAddress}
                      letterheadPhone={studioCompanyPhone}
                      letterheadEmail={studioCompanyEmail}
                      letterheadNpwp={studioCompanyNpwp}
                      letterheadStyle={studioLetterheadStyle}
                      letterheadAlign={studioLetterheadAlign}
                      letterheadMode={studioLetterheadMode}
                      letterheadFreeText={studioLetterheadFreeText}
                      letterheadCustomLogoUrl={studioCustomLogoUrl}
                      runningHeaderText={studioRunningHeaderText}
                      pageNumberFormat={studioPageNumFormat}
                      footerAlign={studioFooterAlign}
                      showFooterBorder={studioShowFooterBorder}
                      qrValidationPlacement={studioQrValidationPlacement}
                      signatories={studioSignatories}
                      onSuccessNotice={(t, d) => {
                        setFeedbackMessage({
                          title: t,
                          description: d,
                          type: 'success',
                        });
                      }}
                    />
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEMPLATE DOKUMEN SISTEM */}
      {activeTab === 'templates' && (() => {
        const filteredTemplates = documentTemplates.filter((tmpl) => {
          const matchesQuery =
            !templateSearchQuery ||
            tmpl.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
            tmpl.type.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
            tmpl.numberingPattern.toLowerCase().includes(templateSearchQuery.toLowerCase());
          const matchesCat =
            templateCategoryFilter === 'all' || getTemplateCategory(tmpl) === templateCategoryFilter;
          return matchesQuery && matchesCat;
        });

        const renderTemplateCard = (tmpl: DocumentTemplateConfig, displayIdx: number) => {
          const isDocx = tmpl.sourceType === 'uploaded_docx';
          const placeholderCount = tmpl.extractedPlaceholders?.length || extractPlaceholdersFromText(tmpl.defaultBody || '').length;
          const catId = getTemplateCategory(tmpl);
          const catObj = TEMPLATE_CATEGORIES.find((c) => c.id === catId);

          return (
            <div
              key={tmpl.id}
              className="bg-white border border-slate-200 hover:border-indigo-400 rounded-xl p-4 shadow-xs transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2.5">
                {/* Header: Number & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-indigo-100 text-slate-700 group-hover:text-indigo-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {displayIdx + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${catObj?.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {renderCategoryIcon(catId, 'w-2.5 h-2.5')}
                      <span className="truncate max-w-[120px]">{catObj?.label || catId}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {tmpl.paperSize || 'A4'}
                    </span>
                    {isDocx ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                        DOCX
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">
                        Sistem
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    {tmpl.type}
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                    {tmpl.name}
                  </h4>
                </div>

                {/* Numbering Formula */}
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-mono text-slate-600 truncate">
                  <span className="text-slate-400 block text-[9px]">Pola Penomoran:</span>
                  <span className="font-bold text-indigo-700">{tmpl.numberingPattern}</span>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                  <span>{placeholderCount} Tag Variabel</span>
                  <span>Kop: {tmpl.kopPosition !== 'none' ? 'Aktif' : 'Nonaktif'}</span>
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleLoadTemplateIntoStudio(tmpl)}
                  className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Buka dan edit template ini di Studio Side-by-Side (Editor Kiri & Live Preview Kanan)"
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Buka di Studio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const simulatedEmployee = employees[0];
                    const simulatedDocNumber = evaluateNumberingFormula(
                      tmpl.numberingPattern,
                      documents.length + 1,
                      currentTenant.code,
                      new Date()
                    );
                    const resolvedContent = interpolateDocxTemplate(tmpl.defaultBody || '', {
                      employee: simulatedEmployee,
                      tenant: currentTenant,
                      documentNumber: simulatedDocNumber,
                      signeeName: currentUser.name,
                      signeeRole: defaultSigneeRole,
                    });

                    setSelectedDoc({
                      id: `preview-${tmpl.id}`,
                      tenantId: currentTenant?.id || 'tenant-001',
                      type: tmpl.type as DocumentType,
                      title: tmpl.name,
                      documentNumber: simulatedDocNumber,
                      issueDate: new Date().toISOString().split('T')[0],
                      targetEmployeeId: simulatedEmployee?.id || 'EMP-DEFAULT',
                      signeeName: currentUser.name,
                      signeeRole: defaultSigneeRole,
                      status: 'Resmi Diterbitkan',
                      contentPreview: resolvedContent,
                      qrVerificationUrl: `https://nusantara.id/verify/${simulatedDocNumber}?status=valid`,
                      templateId: tmpl.id,
                    });
                  }}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                  title="Pratinjau lembar surat"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerReplaceExistingTemplate(tmpl.id)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                  title="Replace isi template dengan file Word (.docx) baru"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                </button>

                {isDocx && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteDocumentTemplate(tmpl.id);
                      setFeedbackMessage({
                        type: 'info',
                        title: 'Template Dihapus',
                        description: `Template "${tmpl.name}" telah dihapus.`,
                      });
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                    title="Hapus template kustom ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-5">
            {/* Top Banner Information (Dynamic total based on data) */}
            <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                    <FileCheck2 className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Koleksi {documentTemplates.length} Template Dokumen Resmi Sistem
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                  Seluruh {documentTemplates.length} template dokumen dinas dan korporat resmi telah dikelompokkan berdasarkan kategori operasional HR, Legal, General Affairs, dan Payroll. Naskah, kop surat, formula penomoran, dan tanda tangan dapat disimulasikan dan disunting melalui Studio Side-by-Side.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <span className="px-3 py-1.5 bg-indigo-50 text-indigo-800 rounded-lg text-xs font-bold border border-indigo-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {filteredTemplates.length} dari {documentTemplates.length} Template
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Bar Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    placeholder="Cari nama dokumen, tipe, atau pola penomoran (misal: PKWT, SPPD, Slip Gaji, BPJS, Magang)..."
                    className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 hover:bg-white focus:bg-white transition-all"
                  />
                  {templateSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTemplateSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      title="Hapus pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Dropdown & View Mode Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <select
                      value={templateCategoryFilter}
                      onChange={(e) => setTemplateCategoryFilter(e.target.value)}
                      className="text-xs font-semibold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="all">Semua Kategori ({documentTemplates.length})</option>
                      {TEMPLATE_CATEGORIES.map((cat) => {
                        const count = documentTemplates.filter((t) => getTemplateCategory(t) === cat.id).length;
                        return (
                          <option key={cat.id} value={cat.id}>
                            {cat.label} ({count})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Mode Tampilan: Per Kategori vs Grid */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => setTemplateViewMode('grouped')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        templateViewMode === 'grouped'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Kelompokkan naskah berdasarkan kategori dokumen"
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Per Kategori</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateViewMode('grid')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        templateViewMode === 'grid'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Tampilkan seluruh kartu template dalam satu grid"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Semua Grid</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Quick Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-[11px] scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setTemplateCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-full font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    templateCategoryFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>Semua</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    templateCategoryFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {documentTemplates.length}
                  </span>
                </button>
                {TEMPLATE_CATEGORIES.map((cat) => {
                  const catCount = documentTemplates.filter((t) => getTemplateCategory(t) === cat.id).length;
                  const isSelected = templateCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTemplateCategoryFilter(isSelected ? 'all' : cat.id)}
                      className={`px-2.5 py-1 rounded-full font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {renderCategoryIcon(cat.id, 'w-3 h-3')}
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {catCount}
                      </span>
                    </button>
                  );
                })}
                {(templateSearchQuery || templateCategoryFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateSearchQuery('');
                      setTemplateCategoryFilter('all');
                    }}
                    className="px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-full font-bold text-[10px] flex items-center gap-1 shrink-0 ml-auto cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>
            </div>

            {/* Empty State when 0 filtered */}
            {filteredTemplates.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Tidak ada template dokumen yang cocok</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tidak ditemukan template untuk kata kunci "{templateSearchQuery}" {templateCategoryFilter !== 'all' ? `pada kategori "${templateCategoryFilter}"` : ''}. Silakan coba kata kunci lain atau reset filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTemplateSearchQuery('');
                    setTemplateCategoryFilter('all');
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            ) : templateViewMode === 'grouped' ? (
              /* VIEW MODE 1: PENGELOMPOKAN BERDASARKAN KATEGORI */
              <div className="space-y-8">
                {TEMPLATE_CATEGORIES.map((cat) => {
                  if (templateCategoryFilter !== 'all' && templateCategoryFilter !== cat.id) {
                    return null;
                  }
                  const templatesInCat = filteredTemplates.filter(
                    (t) => getTemplateCategory(t) === cat.id
                  );
                  if (templatesInCat.length === 0) return null;

                  return (
                    <div key={cat.id} className="space-y-3">
                      {/* Category Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-lg border flex items-center justify-center ${cat.badgeColor}`}>
                            {renderCategoryIcon(cat.id, 'w-4 h-4')}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm">
                                {cat.label}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {templatesInCat.length} Dokumen
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {cat.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Grid Kartu Template dalam Kategori Ini */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {templatesInCat.map((tmpl, idx) =>
                          renderTemplateCard(tmpl, idx)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* VIEW MODE 2: SEMUA GRID TERUNIFIKASI */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTemplates.map((tmpl, idx) =>
                  renderTemplateCard(tmpl, idx)
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 4: DAFTAR TAG VARIABEL DINAMIS WORD (.DOCX) & TOKEN FORMULA */}
      {activeTab === 'daftar_tag' && (
        <div className="space-y-6">
          {/* Top Banner Information */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50 via-white to-indigo-50/60 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-indigo-950">
                  Daftar Lengkap Tag Variabel Dinamis Isi Dokumen Word (.docx) & Token Formula Penomoran
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  Gunakan tag kurung kurawal ganda <code className="bg-indigo-100 text-indigo-900 font-mono font-bold px-1.5 py-0.5 rounded">{'{{variabel}}'}</code> di dalam dokumen Microsoft Word (.docx), dan token kurung kurawal tunggal <code className="bg-indigo-100 text-indigo-900 font-mono font-bold px-1.5 py-0.5 rounded">{'{TOKEN}'}</code> pada pola formula penomoran otomatis surat keputusan resmi dan kontrak kerja perusahaan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-800 font-bold font-mono text-[11px] border border-indigo-200">
                {NUMBERING_TOKEN_REGISTRY.length} Token Penomoran
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold font-mono text-[11px] border border-emerald-200">
                {Object.keys(KNOWN_VARIABLE_DESCRIPTIONS).length} Variabel DOCX
              </span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tokenSearchQuery}
                onChange={(e) => setTokenSearchQuery(e.target.value)}
                placeholder="Cari nama tag, token, atau fungsi (contoh: roman, bulan, tahun, sequence, gaji, nama, jabatan, nik)..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all placeholder:text-slate-400 font-medium"
              />
              {tokenSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTokenSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setTagCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  tagCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Tag & Token ({NUMBERING_TOKEN_REGISTRY.length + Object.keys(KNOWN_VARIABLE_DESCRIPTIONS).length})
              </button>
              <button
                type="button"
                onClick={() => setTagCategoryFilter('numbering')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  tagCategoryFilter === 'numbering'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Token Penomoran ({NUMBERING_TOKEN_REGISTRY.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTagCategoryFilter('docx_vars')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  tagCategoryFilter === 'docx_vars'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Variabel Isi Word DOCX ({Object.keys(KNOWN_VARIABLE_DESCRIPTIONS).length})</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: TOKEN FORMULA PENOMORAN SURAT */}
          {(tagCategoryFilter === 'all' || tagCategoryFilter === 'numbering') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>1. Token Pola Penomoran Surat Resmi (Formula Otomatis)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Token ini digunakan pada isian formula pola nomor surat di tab <strong>Upload Template DOCX</strong> dan <strong>Kop & Pola Penomoran</strong>.
                  </p>
                </div>
                <span className="text-[11px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                  {NUMBERING_TOKEN_REGISTRY.length} Token Tersedia
                </span>
              </div>

              {/* Interactive Formula Simulator */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Uji Coba & Simulasi Formula Penomoran Real-Time:</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Ketik atau klik token di bawah</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                  <div className="lg:col-span-7">
                    <input
                      type="text"
                      value={testNumberingFormula}
                      onChange={(e) => setTestNumberingFormula(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-indigo-500 rounded font-mono font-bold text-indigo-700 text-xs shadow-2xs outline-none"
                      placeholder="Masukkan formula, contoh: {SEQ}/HRD-PKWT/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}"
                    />
                  </div>
                  <div className="lg:col-span-5 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs flex items-center justify-between">
                    <div className="truncate pr-2">
                      <span className="text-[10px] text-emerald-700 font-bold block uppercase tracking-wider">
                        Hasil Simulasi Nomor Surat:
                      </span>
                      <span className="font-mono font-bold text-emerald-950 text-xs truncate block">
                        {evaluateNumberingFormula(testNumberingFormula, documents.length + 1, currentTenant.code, new Date(), {
                          deptCode: 'HRD',
                          docType: 'PKWT',
                          companyName: currentTenant.name,
                        })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyAnyToken(
                        evaluateNumberingFormula(testNumberingFormula, documents.length + 1, currentTenant.code, new Date(), {
                          deptCode: 'HRD',
                          docType: 'PKWT',
                          companyName: currentTenant.name,
                        }),
                        'Hasil Nomor Surat'
                      )}
                      className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-semibold text-[10px] shrink-0 transition-colors"
                    >
                      Salin Nomor
                    </button>
                  </div>
                </div>

                {/* Quick Append Pill Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-semibold text-slate-600 mr-1">Klik untuk menambahkan token ke simulator:</span>
                  {NUMBERING_TOKEN_REGISTRY.map((t) => (
                    <button
                      key={t.token}
                      type="button"
                      onClick={() => {
                        setTestNumberingFormula((prev) => (prev ? `${prev}/${t.token}` : t.token));
                      }}
                      className="px-2 py-0.5 text-[11px] font-mono font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded shadow-2xs transition-colors flex items-center gap-1"
                      title={`Tambahkan ${t.token} (${t.label})`}
                    >
                      <span>{t.token}</span>
                      <span className="text-[9px] text-slate-400 font-normal">({t.example})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* TAMPILAN MOBILE & TABLET: Adaptive Card Grid (< lg) */}
              <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
                {NUMBERING_TOKEN_REGISTRY.filter((t) => {
                  if (!tokenSearchQuery) return true;
                  const q = tokenSearchQuery.toLowerCase();
                  return (
                    t.token.toLowerCase().includes(q) ||
                    t.label.toLowerCase().includes(q) ||
                    t.description.toLowerCase().includes(q) ||
                    t.category.toLowerCase().includes(q)
                  );
                }).map((item) => {
                  const isCopied = copiedVariable === item.token;
                  return (
                    <div
                      key={item.token}
                      onClick={() => handleCopyAnyToken(item.token, item.label)}
                      className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-3.5 shadow-2xs space-y-2.5 cursor-pointer active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {item.token}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </div>

                      <div>
                        <div className="font-bold text-slate-900 text-xs">{item.label}</div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <div className="flex items-center gap-1 font-mono">
                          <span className="text-[10px] text-slate-400">Contoh:</span>
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {item.example}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyAnyToken(item.token, item.label);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded transition-colors"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TAMPILAN DESKTOP: Table of Numbering Tokens (>= lg) */}
              <div className="hidden lg:block overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Token Sintaks</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Label & Arti</th>
                      <th className="py-2.5 px-3">Format / Nilai Riil</th>
                      <th className="py-2.5 px-3">Keterangan Standar Regulasi</th>
                      <th className="py-2.5 px-3 text-center">Aksi Salin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {NUMBERING_TOKEN_REGISTRY.filter((t) => {
                      if (!tokenSearchQuery) return true;
                      const q = tokenSearchQuery.toLowerCase();
                      return (
                        t.token.toLowerCase().includes(q) ||
                        t.label.toLowerCase().includes(q) ||
                        t.description.toLowerCase().includes(q) ||
                        t.category.toLowerCase().includes(q)
                      );
                    }).map((item) => {
                      const isCopied = copiedVariable === item.token;
                      return (
                        <tr key={item.token} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                            <span className="bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                              {item.token}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {item.label}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                              {item.example}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px] leading-relaxed max-w-sm">
                            {item.description}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleCopyAnyToken(item.token, item.label)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 rounded border border-indigo-200 transition-colors"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700 font-bold">Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Salin Tag</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 2: TAG VARIABEL DINAMIS ISI DOKUMEN WORD (.DOCX) */}
          {(tagCategoryFilter === 'all' || tagCategoryFilter === 'docx_vars') && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>2. Daftar Tag Variabel Dinamis Isi Dokumen Word (.docx)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gunakan kurung kurawal ganda seperti <code className="font-mono font-bold text-emerald-700">{'{{nama}}'}</code> pada file Word Anda. Sistem akan mengganti variabel ini secara otomatis dengan data karyawan riil.
                  </p>
                </div>
                <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  {Object.keys(KNOWN_VARIABLE_DESCRIPTIONS).length} Variabel Dinamis
                </span>
              </div>

              {/* Employee Preview Selector */}
              <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-semibold text-indigo-950">
                    Pilih Karyawan Contoh untuk Simulasi Penggantian Variabel:
                  </span>
                </div>
                <select
                  value={simulatedEmployeeId}
                  onChange={(e) => setSimulatedEmployeeId(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-800 text-xs shadow-2xs outline-none"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.nik} · {emp.position})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter Pills for DOCX Variables */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setDocxVarCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                    docxVarCategoryFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({Object.keys(KNOWN_VARIABLE_DESCRIPTIONS).length})
                </button>
                {Array.from(new Set(Object.values(KNOWN_VARIABLE_DESCRIPTIONS).map((v) => v.category).filter(Boolean))).map((cat) => {
                  const count = Object.values(KNOWN_VARIABLE_DESCRIPTIONS).filter((v) => v.category === cat).length;
                  const isSelected = docxVarCategoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setDocxVarCategoryFilter(isSelected ? 'all' : cat!)}
                      className={`px-2.5 py-1 rounded-full font-semibold transition-all shrink-0 cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {/* TAMPILAN MOBILE & TABLET: Adaptive Card Grid (< lg) */}
              <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(KNOWN_VARIABLE_DESCRIPTIONS).filter(([key, val]) => {
                  const matchesCat = docxVarCategoryFilter === 'all' || val.category === docxVarCategoryFilter;
                  if (!matchesCat) return false;
                  if (!tokenSearchQuery) return true;
                  const q = tokenSearchQuery.toLowerCase();
                  return key.toLowerCase().includes(q) || val.label.toLowerCase().includes(q) || val.example.toLowerCase().includes(q) || (val.category || '').toLowerCase().includes(q);
                }).map(([key, val]) => {
                  const tagText = `{{${key}}}`;
                  const isCopied = copiedVariable === tagText;
                  const activeEmp = employees.find((e) => e.id === simulatedEmployeeId) || employees[0];

                  let simVal = val.example;
                  if (activeEmp) {
                    switch (key) {
                      case 'nama': simVal = activeEmp.fullName; break;
                      case 'nik': simVal = activeEmp.nik; break;
                      case 'nik_ktp': simVal = activeEmp.nikKtp || '3174081205930002'; break;
                      case 'no_kk': simVal = activeEmp.noKk || '3174080101150006'; break;
                      case 'jabatan': simVal = activeEmp.position; break;
                      case 'departemen': simVal = activeEmp.department; break;
                      case 'grade': simVal = activeEmp.grade || 'L3'; break;
                      case 'gaji_pokok': simVal = formatRupiah(activeEmp.basicSalary || 15000000); break;
                      case 'gaji_terbilang': simVal = `${angkaKeTerbilang(activeEmp.basicSalary || 15000000)} Rupiah`; break;
                      case 'status_kerja': simVal = activeEmp.employmentType || 'PKWT (Kontrak)'; break;
                      case 'tanggal_mulai': simVal = activeEmp.joinDate || '01 Januari 2026'; break;
                      case 'alamat_karyawan': simVal = activeEmp.ktpAddress || activeEmp.currentAddress || 'Jl. Sudirman No. 10, Jakarta'; break;
                      case 'ptkp': simVal = `${activeEmp.ptkp || 'TK/0'} (TER ${getTERCategory(activeEmp.ptkp || 'TK/0')})`; break;
                      case 'npwp': simVal = activeEmp.npwp || '12.345.678.9-012.000'; break;
                      case 'nomor_surat': simVal = evaluateNumberingFormula('{SEQ}/HRD-PKWT/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}', 1, currentTenant.code); break;
                      case 'nama_perusahaan': simVal = currentTenant.name; break;
                      case 'alamat_perusahaan': simVal = currentTenant.address || 'Gedung Menara Palma Lt. 18, Jakarta'; break;
                      default: simVal = val.example;
                    }
                  }

                  return (
                    <div
                      key={key}
                      onClick={() => handleCopyAnyToken(tagText, val.label)}
                      className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-3.5 shadow-2xs space-y-2 cursor-pointer active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {tagText}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {val.category || 'Umum'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyAnyToken(tagText, val.label);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 rounded transition-colors"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="font-semibold text-slate-900 text-xs">{val.label}</div>

                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>Simulasi Nilai Riil:</span>
                          <span className="font-mono text-slate-400">Pola: {val.example}</span>
                        </div>
                        <div className="font-mono font-bold text-slate-800 truncate">
                          {simVal}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TAMPILAN DESKTOP: Table of DOCX Variables (>= lg) */}
              <div className="hidden lg:block overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Tag Variabel Word</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Keterangan Data</th>
                      <th className="py-2.5 px-3">Nilai Riil Karyawan Terpilih</th>
                      <th className="py-2.5 px-3">Format Output</th>
                      <th className="py-2.5 px-3 text-center">Aksi Salin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {Object.entries(KNOWN_VARIABLE_DESCRIPTIONS).filter(([key, val]) => {
                      const matchesCat = docxVarCategoryFilter === 'all' || val.category === docxVarCategoryFilter;
                      if (!matchesCat) return false;
                      if (!tokenSearchQuery) return true;
                      const q = tokenSearchQuery.toLowerCase();
                      return key.toLowerCase().includes(q) || val.label.toLowerCase().includes(q) || val.example.toLowerCase().includes(q) || (val.category || '').toLowerCase().includes(q);
                    }).map(([key, val]) => {
                      const tagText = `{{${key}}}`;
                      const isCopied = copiedVariable === tagText;
                      const activeEmp = employees.find((e) => e.id === simulatedEmployeeId) || employees[0];

                      // Dynamic simulation value for the selected employee
                      let simVal = val.example;
                      if (activeEmp) {
                        switch (key) {
                          case 'nama':
                            simVal = activeEmp.fullName;
                            break;
                          case 'nik':
                            simVal = activeEmp.nik;
                            break;
                          case 'nik_ktp':
                            simVal = activeEmp.nikKtp || '3174081205930002';
                            break;
                          case 'no_kk':
                            simVal = activeEmp.noKk || '3174080101150006';
                            break;
                          case 'jabatan':
                            simVal = activeEmp.position;
                            break;
                          case 'departemen':
                            simVal = activeEmp.department;
                            break;
                          case 'grade':
                            simVal = activeEmp.grade || 'L3';
                            break;
                          case 'gaji_pokok':
                            simVal = formatRupiah(activeEmp.basicSalary || 15000000);
                            break;
                          case 'gaji_terbilang':
                            simVal = `${angkaKeTerbilang(activeEmp.basicSalary || 15000000)} Rupiah`;
                            break;
                          case 'status_kerja':
                            simVal = activeEmp.employmentType || 'PKWT (Kontrak)';
                            break;
                          case 'tanggal_mulai':
                            simVal = activeEmp.joinDate || '01 Januari 2026';
                            break;
                          case 'alamat_karyawan':
                            simVal = activeEmp.ktpAddress || activeEmp.currentAddress || 'Jl. Sudirman No. 10, Jakarta';
                            break;
                          case 'ptkp':
                            simVal = `${activeEmp.ptkp || 'TK/0'} (TER ${getTERCategory(activeEmp.ptkp || 'TK/0')})`;
                            break;
                          case 'npwp':
                            simVal = activeEmp.npwp || '12.345.678.9-012.000';
                            break;
                          case 'nomor_surat':
                            simVal = evaluateNumberingFormula('{SEQ}/HRD-PKWT/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}', 1, currentTenant.code);
                            break;
                          case 'nama_perusahaan':
                            simVal = currentTenant.name;
                            break;
                          case 'alamat_perusahaan':
                            simVal = currentTenant.address || 'Gedung Menara Palma Lt. 18, Jakarta';
                            break;
                          default:
                            simVal = val.example;
                        }
                      }

                      return (
                        <tr key={key} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                            <span className="bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                              {tagText}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {val.category || 'Umum'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {val.label}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800 text-[11px] whitespace-nowrap">
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              {simVal}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] font-mono">
                            {val.example}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleCopyAnyToken(tagText, val.label)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 rounded border border-emerald-200 transition-colors cursor-pointer"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700 font-bold">Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Salin Tag</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 3: CONTOH DRAF SURAT PKWT BAKU SIAP PAKAI */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  <span>3. Contoh Naskah Format Word (.docx) Baku Siap Tempel</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Salin cuplikan klausul di bawah ini dan tempelkan langsung ke dokumen Microsoft Word (.docx) Anda sebelum diunggah.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const sampleText = `SURAT PERJANJIAN KERJA WAKTU TERTENTU (PKWT)
Nomor: {{nomor_surat}}

Pada hari ini, {{tanggal_terbit}}, bertempat di {{alamat_perusahaan}}, para pihak yang bertanda tangan di bawah ini:
1. {{nama_perusahaan}}, diwakili oleh {{penandatangan}} selaku {{jabatan_penandatangan}} (selanjutnya disebut PIHAK PERTAMA).
2. Nama: {{nama}}, NIK: {{nik}}, No. KTP: {{nik_ktp}}, Alamat: {{alamat_karyawan}} (selanjutnya disebut PIHAK KEDUA).

PASAL 1: KETENTUAN TUGAS & JABATAN
PIHAK KEDUA disepakati bertugas sebagai {{jabatan}} pada Departemen {{departemen}} (Grade: {{grade}}).

PASAL 2: MASA BERLAKU PERJANJIAN
Perjanjian kerja ini mulai berlaku terhitung sejak tanggal {{tanggal_mulai}} sampai dengan tanggal {{tanggal_berakhir}}.

PASAL 3: KOMPENSASI & PENGGAJIAN
PIHAK PERTAMA memberikan upah pokok bulanan sebesar {{gaji_pokok}} ({{gaji_terbilang}}) dengan status perpajakan {{ptkp}}.

PIHAK PERTAMA,                                     PIHAK KEDUA,
{{nama_perusahaan}}

( {{penandatangan}} )                               ( {{nama}} )
{{jabatan_penandatangan}}

{{qr_code}}`;
                  navigator.clipboard.writeText(sampleText);
                  setFeedbackMessage({
                    type: 'success',
                    title: 'Draf Template Word Berhasil Disalin',
                    description: 'Format siap ditempel langsung ke Microsoft Word (.docx).',
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Seluruh Draf Naskah Word</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800">
{`SURAT PERJANJIAN KERJA WAKTU TERTENTU (PKWT)
Nomor: {{nomor_surat}}

Pada hari ini, {{tanggal_terbit}}, bertempat di {{alamat_perusahaan}}, para pihak yang bertanda tangan di bawah ini:
1. {{nama_perusahaan}}, diwakili oleh {{penandatangan}} selaku {{jabatan_penandatangan}} (PIHAK PERTAMA).
2. Nama: {{nama}}, NIK: {{nik}}, No. KTP: {{nik_ktp}}, Alamat: {{alamat_karyawan}} (PIHAK KEDUA).

PASAL 1: KETENTUAN TUGAS & JABATAN
PIHAK KEDUA disepakati bertugas sebagai {{jabatan}} pada Departemen {{departemen}} (Grade: {{grade}}).

PASAL 2: MASA BERLAKU PERJANJIAN
Perjanjian kerja ini berlaku sejak tanggal {{tanggal_mulai}} sampai dengan {{tanggal_berakhir}}.

PASAL 3: KOMPENSASI & PENGGAJIAN
PIHAK PERTAMA memberikan upah pokok sebesar {{gaji_pokok}} ({{gaji_terbilang}}) dengan status pajak {{ptkp}}.

{{qr_code}}`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 5: PENGATURAN LEGAL, LOGO DOKUMEN & APP FAVICON */}
      {activeTab === 'pengaturan' && (
        <div className="space-y-6 max-w-3xl">
          {/* Section 1: Logo Kop Dokumen & App Favicon */}
          <div className="bg-white p-6 border border-slate-200 rounded-xl space-y-5 text-xs shadow-xs">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>Pengaturan Logo Dokumen Resmi & App Favicon</span>
              </h3>
              <p className="text-xs text-slate-500">
                Kelola logo yang tercetak pada Kop Surat Resmi (SK, Surat Promosi/Demosi, Kontrak Kerja, Slip Gaji) dan icon browser favicon.
              </p>
            </div>

            {/* Sub-section: Logo Dokumen Resmi */}
            <div className="space-y-3 p-4 bg-slate-50/80 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <label className="font-bold text-slate-800 block text-xs">
                    Logo Kop Dokumen Resmi (Untuk SK, Kontrak & Slip Gaji)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Rekomendasi format PNG transparan atau SVG resolusi tinggi minimal 200x200 px.
                  </p>
                </div>
                {docLogoInput ? (
                  <img
                    src={docLogoInput}
                    alt="Preview Logo Dokumen"
                    className="w-14 h-14 rounded-lg object-contain bg-white border border-slate-200 p-1 shadow-2xs shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-indigo-700 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-2xs">
                    {currentTenant.logoText || 'N'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Masukkan URL gambar logo (https://... atau data:image/...)"
                  value={docLogoInput}
                  onChange={(e) => setDocLogoInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs bg-white text-slate-900"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-500 font-medium">Pilih Preset Logo:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDocLogoInput('https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop')
                    }
                    className="px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[11px] text-slate-700"
                  >
                    Tech Corporate (Blue)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDocLogoInput('https://images.unsplash.com/photo-1516876437184-593fda40c7ce?w=200&h=200&fit=crop')
                    }
                    className="px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[11px] text-slate-700"
                  >
                    Logistics Holding (Navy)
                  </button>
                  <label className="cursor-pointer px-2.5 py-0.5 rounded border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[11px] text-indigo-700 font-semibold">
                    <span>Unggah File Gambar...</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (reader.result) setDocLogoInput(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Preview Kop Surat Mini */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-2">
                  Preview Tampilan Kop Surat Resmi
                </span>
                <div className="border-b-2 border-slate-900 pb-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {docLogoInput ? (
                      <img
                        src={docLogoInput}
                        alt="Logo Preview"
                        className="w-10 h-10 rounded object-contain border border-slate-200 p-0.5"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-indigo-700 text-white font-bold text-sm flex items-center justify-center">
                        {currentTenant.logoText || 'N'}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wide text-slate-900">
                        {currentTenant.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Gedung Menara Palma Lantai 18, {currentTenant.city} · NPWP: {currentTenant.npwp}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Kop Resmi Sah
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-section: App Favicon */}
            <div className="space-y-3 p-4 bg-slate-50/80 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <label className="font-bold text-slate-800 block text-xs">
                    App Favicon (Icon Tab Browser & PWA)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Icon ukuran persegi (32x32 atau 64x64 px) yang muncul di samping judul tab browser.
                  </p>
                </div>
                {appFaviconInput ? (
                  <img
                    src={appFaviconInput}
                    alt="Favicon Preview"
                    className="w-8 h-8 rounded-md object-contain bg-white border border-slate-200 p-0.5 shadow-2xs shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {currentTenant.code[0] || 'N'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Masukkan URL favicon browser (https://... atau data:image/...)"
                  value={appFaviconInput}
                  onChange={(e) => setAppFaviconInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs bg-white text-slate-900"
                />

                {/* Simulated Browser Tab */}
                <div className="p-2.5 bg-slate-900 rounded-lg flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">Simulasi Tab Browser:</span>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-t-md text-slate-800 text-[11px] font-medium shadow-xs">
                    {appFaviconInput ? (
                      <img src={appFaviconInput} alt="" className="w-4 h-4 rounded-xs object-contain" />
                    ) : (
                      <div className="w-4 h-4 rounded-xs bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                        N
                      </div>
                    )}
                    <span>{currentTenant.name} - NusaHR Portal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Tata Kelola Legal & QR Watermark */}
          <div className="bg-white p-6 border border-slate-200 rounded-xl space-y-4 text-xs shadow-xs">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Tata Kelola Pejabat Penanda Tangan & QR UU ITE</span>
              </h3>
              <p className="text-xs text-slate-500">
                Konfigurasi penanda tangan default dan verifikasi hash digital UU ITE No. 11/2008.
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Jabatan Penanda Tangan Default
              </label>
              <input
                type="text"
                value={defaultSigneeRole}
                onChange={(e) => setDefaultSigneeRole(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-semibold text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="qrCheck"
                checked={enableWatermark}
                onChange={(e) => setEnableWatermark(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="qrCheck" className="text-slate-700 font-medium cursor-pointer">
                Sematkan Watermark QR Hash Verification otomatis pada setiap halaman PDF
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              {brandingSaved && (
                <span className="text-emerald-700 font-semibold text-xs animate-in zoom-in-50">
                  ✓ Pengaturan legal, logo dokumen resmi, dan favicon berhasil disimpan!
                </span>
              )}
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    updateTenantBranding(docLogoInput, appFaviconInput);
                    handleSaveSettings();
                    setBrandingSaved(true);
                    setTimeout(() => setBrandingSaved(false), 3000);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs text-xs transition-colors"
                >
                  Simpan Seluruh Pengaturan & Branding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TEMPLATE DOKUMEN RESMI */}
      {isEditTemplateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditTemplateModalOpen(false);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Edit Template Naskah Dinas & Klausul</h3>
                  <p className="text-[11px] text-slate-300">
                    Menyesuaikan naskah hukum, rumus penomoran, kop surat, dan penandatangan dokumen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditTemplateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveStandardTemplate();
              }}
              className="p-5 space-y-5 overflow-y-auto text-xs"
            >
              {/* Bagian 1: Judul Dokumen & Klasifikasi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-800 block mb-1">
                    Nama / Judul Resmi Naskah Dinas *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitleFormat}
                    onChange={(e) => setEditTitleFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Klasifikasi Dokumen
                  </label>
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-bold text-indigo-700">
                    {activeTemplate?.type || 'Dokumen Resmi'}
                  </div>
                </div>
              </div>

              {/* Bagian 2: Pola Penomoran Otomatis */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 block text-xs">
                    Formula Pola Penomoran Dokumen *
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Token otomatis: {'{SEQ}'}, {'{TENANT_CODE}'}, {'{ROMAN_MONTH}'}, {'{YEAR}'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={editNumberingFormat}
                  onChange={(e) => setEditNumberingFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-indigo-300 rounded-lg font-mono font-bold text-xs text-indigo-900 bg-white shadow-2xs"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold">Sisipkan Token:</span>
                  {NUMBERING_TOKENS.map((t) => (
                    <button
                      key={t.token}
                      type="button"
                      onClick={() => {
                        setEditNumberingFormat((prev) =>
                          prev.endsWith('/') ? `${prev}${t.token}` : `${prev}/${t.token}`
                        );
                      }}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                      title={t.description}
                    >
                      {t.token}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-slate-600 flex items-center gap-2 pt-0.5">
                  <span className="font-semibold text-slate-500">Contoh Hasil Nomor:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {evaluateNumberingFormula(editNumberingFormat, 1, currentTenant.code, new Date())}
                  </span>
                </div>
              </div>

              {/* Bagian 3: Pejabat Penandatangan Resmi */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Pejabat Penandatangan Template Ini</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Pejabat yang namanya tercetak di atas QR Terotentikasi Digital
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Nama Lengkap Pejabat *
                    </label>
                    <input
                      type="text"
                      required
                      value={editSigneeTitle}
                      onChange={(e) => setEditSigneeTitle(e.target.value)}
                      placeholder="Contoh: Ir. Budi Santoso, MBA"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Jabatan / Peran Pejabat *
                    </label>
                    <input
                      type="text"
                      required
                      value={editSigneeRole}
                      onChange={(e) => setEditSigneeRole(e.target.value)}
                      placeholder="Contoh: President Director & CEO"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 4: Kop Surat Perusahaan */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Kop Surat Resmi Perusahaan</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                      Nama Badan Usaha / PT *
                    </label>
                    <input
                      type="text"
                      required
                      value={editCompanyName}
                      onChange={(e) => setEditCompanyName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-900 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                      Alamat Kantor Resmi
                    </label>
                    <input
                      type="text"
                      value={editCompanyAddress}
                      onChange={(e) => setEditCompanyAddress(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                      Nomor Telepon
                    </label>
                    <input
                      type="text"
                      value={editCompanyPhone}
                      onChange={(e) => setEditCompanyPhone(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                      Email Legal / HR
                    </label>
                    <input
                      type="email"
                      value={editCompanyEmail}
                      onChange={(e) => setEditCompanyEmail(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 5: Isi Naskah Baku Klausul & Variabel Dinamis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 block text-xs">
                    Isi Naskah Baku & Klausul Hukum *
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Klik tag variabel di bawah untuk menyisipkan ke naskah
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 p-2 bg-slate-50 rounded-lg border border-slate-200 max-h-24 overflow-y-auto">
                  {[
                    'nama',
                    'nik',
                    'jabatan',
                    'departemen',
                    'divisi',
                    'lokasi_kerja',
                    'gaji_pokok',
                    'tanggal_mulai',
                    'nomor_surat',
                    'nama_perusahaan',
                    'nama_penandatangan',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setEditBodyTemplate((prev) => `${prev} {{${tag}}}`)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-white hover:bg-indigo-100 text-indigo-700 border border-slate-200 transition-colors shadow-2xs"
                      title={`Sisipkan {{${tag}}}`}
                    >
                      {`{{${tag}}}`}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={10}
                  required
                  value={editBodyTemplate}
                  onChange={(e) => setEditBodyTemplate(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="Ketik teks klausul surat dengan {{tag_variabel}}..."
                />
              </div>

              {/* Bagian 6: Catatan Kaki / UU ITE */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Catatan Kaki Legalitas / Keabsahan UU ITE
                </label>
                <input
                  type="text"
                  value={editFooterText}
                  onChange={(e) => setEditFooterText(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 text-xs bg-white"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditTemplateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW DOKUMEN RESMI & CETAK PDF MULTI-HALAMAN REAL */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedDoc(null);
            }
          }}
        >
          <div
            className="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-300 overflow-hidden my-4 flex flex-col max-h-[94vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between no-print shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold">
                  Naskah Dokumen Resmi Terotentikasi QR UU ITE (Format Kertas A4 Standar)
                </h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                title="Tutup Pratinjau"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Content Canvas Multi-Halaman Real A4 */}
            <div className="p-4 sm:p-6 bg-slate-200/90 overflow-y-auto flex justify-center">
              {(() => {
                const targetEmp = employees.find((e) => e.id === selectedDoc.targetEmployeeId) || employees[0];
                return (
                  <OfficialMultiPageDocumentSheet
                    title={selectedDoc.title}
                    documentNumber={selectedDoc.documentNumber}
                    content={selectedDoc.contentPreview}
                    tenant={currentTenant}
                    employee={targetEmp}
                    signeeName={selectedDoc.signeeName}
                    signeeRole={selectedDoc.signeeRole}
                    issueDate={selectedDoc.issueDate}
                    showLetterhead={true}
                    showQrSignature={true}
                    showQrValidation={true}
                    onSuccessNotice={(title, desc) => {
                      setFeedbackMessage({
                        title,
                        description: desc,
                        type: 'success',
                      });
                    }}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {/* MODAL 3: KATALOG LENGKAP DAFTAR TAG & TOKEN PENOMORAN / VARIABEL */}
      {isTokenGlossaryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsTokenGlossaryModalOpen(false);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Katalog Lengkap Daftar Tag / Token Dokumen & Penomoran
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gunakan token ini dalam formula penomoran otomatis atau variabel dinamis template Microsoft Word (.docx).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTokenGlossaryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Tabs Switcher */}
            <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tokenSearchQuery}
                  onChange={(e) => setTokenSearchQuery(e.target.value)}
                  placeholder="Cari tag, token, atau fungsi (contoh: roman, bulan, tahun, sequence, nama, gaji)..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                />
                {tokenSearchQuery && (
                  <button
                    onClick={() => setTokenSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setTokenGlossaryTab('numbering')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    tokenGlossaryTab === 'numbering'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Token Pola Penomoran ({NUMBERING_TOKEN_REGISTRY.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTokenGlossaryTab('body_vars')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    tokenGlossaryTab === 'body_vars'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Variabel Isi DOCX ({Object.keys(KNOWN_VARIABLE_DESCRIPTIONS).length})</span>
                </button>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-xs">
              {tokenGlossaryTab === 'numbering' ? (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-indigo-950">
                    <div className="text-xs">
                      <strong className="font-bold text-indigo-900">Format Standar Surat Resmi di Indonesia:</strong>
                      <p className="text-[11px] text-indigo-800 mt-0.5">
                        Format baku instansi/perusahaan: <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono font-bold text-indigo-900">{'{SEQ}'}/HRD-PKWT/{'{TENANT_CODE}'}/{'{ROMAN_MONTH}'}/{'{YEAR}'}</code>
                      </p>
                    </div>
                    <div className="text-xs font-mono font-bold text-indigo-900 bg-white px-2.5 py-1.5 rounded border border-indigo-200 shadow-2xs">
                      Contoh: 001/HRD-PKWT/NTM/X/2026
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Token Sintaks</th>
                          <th className="py-2.5 px-3">Kategori</th>
                          <th className="py-2.5 px-3">Label & Arti</th>
                          <th className="py-2.5 px-3">Penjelasan Standar</th>
                          <th className="py-2.5 px-3">Nilai Saat Ini</th>
                          <th className="py-2.5 px-3 text-center">Aksi Cepat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {NUMBERING_TOKEN_REGISTRY.filter((t) => {
                          if (!tokenSearchQuery) return true;
                          const q = tokenSearchQuery.toLowerCase();
                          return (
                            t.token.toLowerCase().includes(q) ||
                            t.label.toLowerCase().includes(q) ||
                            t.description.toLowerCase().includes(q) ||
                            t.category.toLowerCase().includes(q)
                          );
                        }).map((item) => {
                          const isCopied = copiedVariable === item.token;
                          return (
                            <tr key={item.token} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                                <span className="bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                                  {item.token}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {item.category}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900">
                                {item.label}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-xs leading-relaxed">
                                {item.description}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                                <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                                  {item.example}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleInsertToken(item.token, 'standard')}
                                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded border border-indigo-200 transition-colors text-[11px]"
                                    title="Sisipkan ke pola penomoran yang sedang diedit"
                                  >
                                    + Sisipkan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyAnyToken(item.token, item.label)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 rounded border border-slate-200 transition-colors"
                                    title="Salin token ini"
                                  >
                                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-950 text-xs">
                    <strong className="font-bold text-amber-900 block mb-0.5">
                      Cara Menggunakan Variabel di Dalam File Word (.docx):
                    </strong>
                    Tuliskan variabel di dalam dokumen Word Anda menggunakan kurung kurawal ganda seperti <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-900">{'{{nama}}'}</code>, <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-900">{'{{jabatan}}'}</code>, atau <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-900">{'{{gaji_pokok}}'}</code>. Sistem akan otomatis mengganti variabel ini dengan data riil karyawan saat Anda menerbitkan surat keputusan.
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Tag Variabel Word</th>
                          <th className="py-2.5 px-3">Kategori</th>
                          <th className="py-2.5 px-3">Keterangan Data</th>
                          <th className="py-2.5 px-3">Contoh Data Riil</th>
                          <th className="py-2.5 px-3 text-center">Salin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {Object.entries(KNOWN_VARIABLE_DESCRIPTIONS).filter(([key, val]) => {
                          if (!tokenSearchQuery) return true;
                          const q = tokenSearchQuery.toLowerCase();
                          return key.toLowerCase().includes(q) || val.label.toLowerCase().includes(q) || val.example.toLowerCase().includes(q) || (val.category || '').toLowerCase().includes(q);
                        }).map(([key, val]) => {
                          const tagText = `{{${key}}}`;
                          const isCopied = copiedVariable === tagText;
                          return (
                            <tr key={key} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                                <span className="bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                                  {tagText}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  {val.category || 'Umum'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                {val.label}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                                {val.example}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleCopyAnyToken(tagText, val.label)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 rounded border border-indigo-200 transition-colors"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-700 font-bold">Tersalin!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Salin</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">
                Total {NUMBERING_TOKEN_REGISTRY.length} Token Penomoran & {Object.keys(KNOWN_VARIABLE_DESCRIPTIONS).length} Variabel Template Aktif
              </span>
              <button
                type="button"
                onClick={() => setIsTokenGlossaryModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

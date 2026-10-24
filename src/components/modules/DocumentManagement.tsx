import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { OfficialDocument, DocumentType, DocumentTemplateConfig, Employee } from '../../types/hrms';
import { QRCodeView } from '../common/QRCodeView';
import { EmployeeSelect } from '../common/EmployeeSelect';
import {
  parseDocxFile,
  interpolateDocxTemplate,
  evaluateNumberingFormula,
  KNOWN_VARIABLE_DESCRIPTIONS,
  SAMPLE_DOCX_PRESETS,
  ParsedDocxResult,
  NUMBERING_TOKEN_REGISTRY,
  NumberingTokenInfo,
} from '../../utils/docxTemplateHelper';
import { formatRupiah, getTERCategory } from '../../utils/taxCalculator';
import { ScrollableTabNav } from '../common/ScrollableTabNav';

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

  const [activeTab, setActiveTab] = useState<'arsip' | 'upload_docx' | 'templates' | 'daftar_tag' | 'pengaturan'>('arsip');
  const [selectedDoc, setSelectedDoc] = useState<OfficialDocument | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [searchDocQuery, setSearchDocQuery] = useState('');

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

  // Generate Document State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(documentTemplates[0]?.id || '');
  const [targetEmployeeId, setTargetEmployeeId] = useState(employees[0]?.id || '');
  const [customDocTitle, setCustomDocTitle] = useState('');
  const [customAdditionalNotes, setCustomAdditionalNotes] = useState('');

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

  // Sync template fields when changing template in editor tab
  const handleSelectTemplateForEdit = (tmpl: DocumentTemplateConfig) => {
    setEditingTemplateId(tmpl.id);
    setEditNumberingFormat(tmpl.numberingPattern);
    setEditCompanyName(tmpl.letterHeadTitle);
    setEditCompanyAddress(tmpl.letterHeadAddress);
    setEditTitleFormat(tmpl.name);
    setEditBodyTemplate(tmpl.defaultBody);
    setEditCompanyPhone(tmpl.letterHeadPhone || '+62 21 5566 7788');
    setEditCompanyEmail(tmpl.letterHeadEmail || 'legal.hr@nusantara.id');
    setEditCompanyNpwp(tmpl.letterHeadNpwp || currentTenant.npwp);
    setEditFooterText(tmpl.footerText || 'Dokumen ini sah dan berkekuatan hukum tetap menurut UU ITE No. 11/2008.');
  };

  const handleSaveStandardTemplate = () => {
    if (!activeTemplate) return;

    updateDocumentTemplate(activeTemplate.id, {
      numberingPattern: editNumberingFormat,
      name: editTitleFormat,
      letterHeadTitle: editCompanyName,
      letterHeadAddress: editCompanyAddress,
      letterHeadPhone: editCompanyPhone,
      letterHeadEmail: editCompanyEmail,
      letterHeadNpwp: editCompanyNpwp,
      defaultBody: editBodyTemplate,
      footerText: editFooterText,
    });

    setFeedbackMessage({
      type: 'success',
      title: 'Template Berhasil Diperbarui',
      description: `Perubahan kop surat dan klausul template "${editTitleFormat}" telah tersimpan.`,
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
      signeeName: currentUser.name,
      signeeRole: defaultSigneeRole,
    });

    const isFromDocx = tmpl?.sourceType === 'uploaded_docx';

    const newDoc = createOfficialDocument({
      type: tmpl?.type || 'PKWT',
      templateId: tmpl?.id,
      title,
      targetEmployeeId: targetEmp.id,
      signeeName: currentUser.name,
      signeeRole: defaultSigneeRole,
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
      description: `Dokumen "${title}" (${documentNumber}) berhasil di-generate dengan Tanda Tangan QR terenkripsi.`,
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

  const filteredDocs = documents.filter(
    (d) =>
      d.documentNumber.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      d.title.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      d.type.toLowerCase().includes(searchDocQuery.toLowerCase())
  );

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
          <button
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Terbitkan Dokumen Baru</span>
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
          onClick={() => setActiveTab('upload_docx')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'upload_docx'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileUp className="w-3.5 h-3.5" />
          <span>Upload Template DOCX</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'templates'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Kop & Pola Penomoran</span>
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
          <div className="bg-white p-3 sm:p-3.5 border border-slate-200 rounded-xl shadow-xs space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nomor dokumen, judul surat, nama..."
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('upload_docx')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors shrink-0"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>+ Upload Template DOCX</span>
              </button>
              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Terbitkan Dokumen Baru</span>
              </button>
            </div>
          </div>

          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden space-y-3">
            {filteredDocs.map((doc) => {
              const emp = employees.find((e) => e.id === doc.targetEmployeeId);
              const tmpl = documentTemplates.find((t) => t.id === doc.templateId);
              const isDocx = doc.isFromDocxTemplate || tmpl?.sourceType === 'uploaded_docx';

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-xs transition-all cursor-pointer active:scale-[0.99] space-y-3"
                >
                  {/* Card Header: Doc Number & Type Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-indigo-700 block">
                        {doc.documentNumber}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs mt-0.5 leading-snug">
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

                  {/* Employee & Signee Details */}
                  <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Penerima Dokumen:</span>
                      <div className="font-semibold text-slate-900 truncate">
                        {emp?.fullName || 'Pihak Terkait'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{emp?.nik}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Penanda Tangan:</span>
                      <div className="font-semibold text-slate-900 truncate">{doc.signeeName}</div>
                      <div className="text-[10px] text-slate-500 truncate">{doc.signeeRole}</div>
                    </div>
                  </div>

                  {/* Card Footer: Date */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.issueDate}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      Klik baris untuk preview
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TAMPILAN DESKTOP: Full Data Table (>= md) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[750px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Nomor Surat Resmi</th>
                    <th className="py-2.5 px-3 font-semibold">Jenis & Judul Dokumen</th>
                    <th className="py-2.5 px-3 font-semibold">Sumber Template</th>
                    <th className="py-2.5 px-3 font-semibold">Karyawan Penerima</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Tanggal Terbit</th>
                    <th className="py-2.5 px-3 font-semibold">Penanda Tangan</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => {
                    const emp = employees.find((e) => e.id === doc.targetEmployeeId);
                    const tmpl = documentTemplates.find((t) => t.id === doc.templateId);
                    const isDocx = doc.isFromDocxTemplate || tmpl?.sourceType === 'uploaded_docx';

                    return (
                      <tr
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                        title="Klik baris untuk mem-preview dokumen resmi legal & verifikasi QR"
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {doc.documentNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{doc.title}</div>
                          <div className="text-[10px] text-indigo-700 font-medium">{doc.type}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          {isDocx ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              <FileCode className="w-3 h-3 text-blue-600" />
                              <span>File DOCX</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              <span>Sistem HR</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {emp ? (
                            <div className="flex items-center gap-1.5">
                              {emp.avatar ? (
                                <img src={emp.avatar} alt="" className="w-5 h-5 rounded-full object-cover border" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                                  {emp.fullName.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-slate-900 leading-tight">{emp.fullName}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{emp.nik}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">Pihak Terkait</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {doc.issueDate}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{doc.signeeName}</div>
                          <div className="text-[10px] text-slate-400">{doc.signeeRole}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {doc.status}
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

      {/* TAB 2: UPLOAD & KELOLA TEMPLATE DOCX */}
      {activeTab === 'upload_docx' && (
        <div className="space-y-6">
          {/* Top Banner Information */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-sm font-bold text-indigo-900">
                Pusat Tata Kelola Template Dokumen DOCX (Microsoft Word):
              </strong>
              <p className="leading-relaxed">
                Anda dapat mengunggah file template berformat <code>.docx</code> standar perusahaan. Gunakan variabel dinamis bertanda kurung kurawal ganda seperti <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono font-bold text-indigo-900">{'{{nama}}'}</code>, <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono font-bold text-indigo-900">{'{{nik}}'}</code>, <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono font-bold text-indigo-900">{'{{jabatan}}'}</code>, dan <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono font-bold text-indigo-900">{'{{gaji_pokok}}'}</code>. Sistem akan otomatis mengisi data karyawan riil, menambahkan nomor surat resmi berformula, dan menyematkan stempel Tanda Tangan QR UU ITE.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Upload Dropzone & Configuration Form */}
            <div className="lg:col-span-7 space-y-5">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-indigo-300 hover:border-indigo-600 bg-white hover:bg-indigo-50/40 rounded-xl p-8 text-center cursor-pointer transition-all group shadow-xs space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.doc"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <FileUp className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isParsingDocx ? 'Sedang Membaca & Mengekstrak File DOCX...' : 'Klik atau Tarik File Template DOCX ke Sini'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Mendukung format Microsoft Word (.docx). Ekstraksi variabel, klausul hukum, dan format tabel berjalan 100% lokal di peramban.
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-200">
                  <Upload className="w-3 h-3" />
                  <span>Pilih File Dari Komputer</span>
                </div>
              </div>

              {/* Sample Templates Quick-Load Library */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    <span>Atau Pilih Dari Template Contoh Baku Indonesia:</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Siap pakai & teruji regulasi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SAMPLE_DOCX_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-3 rounded-lg border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 transition-all flex flex-col justify-between space-y-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 leading-tight">{preset.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{preset.fileName} ({preset.fileSize})</div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800">
                          {preset.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleLoadSamplePreset(preset)}
                          className="px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-white rounded border border-indigo-200 transition-colors"
                        >
                          Gunakan Format Ini
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uploaded File Config Form */}
              {parsedDocx && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Konfigurasi Template: {parsedDocx.fileName}</span>
                      </h4>
                      <span className="text-slate-500 text-[11px]">
                        Ukuran File: {parsedDocx.fileSize} · Ditemukan {parsedDocx.placeholders.length} Variabel Dinamis
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveUploadedDocxTemplate}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold shadow-xs transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Template Ini</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Judul Template Dokumen *</label>
                      <input
                        type="text"
                        value={uploadDocTitle}
                        onChange={(e) => setUploadDocTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded font-semibold text-slate-900"
                        placeholder="Contoh: Perjanjian Kerja Waktu Tertentu 2026"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Kategori / Jenis Dokumen *</label>
                      <select
                        value={uploadDocType}
                        onChange={(e) => setUploadDocType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-semibold text-slate-900"
                      >
                        <option value="PKWT">PKWT (Perjanjian Kerja Waktu Tertentu)</option>
                        <option value="PKWTT">PKWTT (Karyawan Tetap)</option>
                        <option value="Surat Promosi">Surat Promosi & Penyesuaian Jabatan</option>
                        <option value="Surat Peringatan">Surat Peringatan Disiplin (SP)</option>
                        <option value="Parklaring">Parklaring (Surat Pengalaman Kerja)</option>
                        <option value="BAST Aset">BAST (Serah Terima Fasilitas & Aset)</option>
                        <option value="Offering Letter">Offering Letter Rekrutmen</option>
                        <option value="Surat Tugas Dinas">Surat Perintah Perjalanan Dinas (SPPD)</option>
                      </select>
                    </div>
                  </div>

                  {/* Formula Penomoran */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Formula Pola Penomoran Dokumen Otomatis *
                    </label>
                    <input
                      type="text"
                      value={uploadNumberingPattern}
                      onChange={(e) => setUploadNumberingPattern(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold text-indigo-700"
                    />
                    {/* Live Simulation Result */}
                    <div className="mt-2 p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-[11px] text-indigo-700 font-semibold block">
                          Simulasi Nomor Surat Riil Berikutnya:
                        </span>
                        <span className="font-mono font-bold text-sm text-indigo-950 tracking-tight">
                          {evaluateNumberingFormula(uploadNumberingPattern, documents.length + 1, currentTenant.code, new Date(), {
                            deptCode: 'HRD',
                            docType: uploadDocType,
                            companyName: currentTenant.name,
                          })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTokenGlossaryModalOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-100/70 px-2.5 py-1.5 rounded border border-indigo-300 transition-colors shrink-0 shadow-2xs"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Kamus Lengkap Tag ({NUMBERING_TOKEN_REGISTRY.length})</span>
                      </button>
                    </div>

                    {/* Prominent Token Quick-Picker Grid */}
                    <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Daftar Tag / Token Tersedia (Klik untuk Menambahkan ke Pola):</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Otomatis berformat hukum RI</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-1">
                        {NUMBERING_TOKEN_REGISTRY.map((t) => {
                          const isCopied = copiedVariable === t.token;
                          return (
                            <div
                              key={t.token}
                              className="group flex items-center justify-between p-1.5 bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded text-left transition-all"
                            >
                              <button
                                type="button"
                                onClick={() => handleInsertToken(t.token, 'upload')}
                                className="flex-1 min-w-0 pr-1 text-left"
                                title={`Klik untuk sisipkan ${t.token} (${t.description})`}
                              >
                                <div className="font-mono font-bold text-[11px] text-indigo-700 truncate">
                                  {t.token}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate flex items-center justify-between">
                                  <span>{t.label}</span>
                                  <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1 py-0.2 rounded text-[9px]">
                                    {t.example}
                                  </span>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyAnyToken(t.token, t.label)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded shrink-0"
                                title="Salin tag ini"
                              >
                                {isCopied ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Kop Surat & QR Layout */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <label className="font-semibold text-slate-800 block mb-1">Format Kop Surat (Header)</label>
                      <select
                        value={uploadKopPosition}
                        onChange={(e) => setUploadKopPosition(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-xs font-medium"
                      >
                        <option value="top">Kop Resmi Sistem (Rekomendasi - Nama, Logo & Garis Ganda)</option>
                        <option value="embedded">Kop Sudah Ada di Dalam File DOCX</option>
                        <option value="none">Tanpa Kop (Dokumen Internal)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-800 block mb-1">Posisi Stempel Tanda Tangan QR</label>
                      <select
                        value={uploadQrPosition}
                        onChange={(e) => setUploadQrPosition(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-xs font-medium"
                      >
                        <option value="bottom-right">Kanan Bawah (Standar Surat Resmi Indonesia)</option>
                        <option value="bottom-left">Kiri Bawah (Multi-pihak)</option>
                        <option value="inline">Inline (Pada tag {'{{qr_code}}'})</option>
                        <option value="none">Tanpa Tanda Tangan QR</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Placeholders Inspector & Live Document Preview */}
            <div className="lg:col-span-5 space-y-5">
              {/* Variable Inspector / Glossary */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-slate-900 text-xs">Pendeteksi Variabel Dinamis</h4>
                  </div>
                  <span className="text-[10px] text-slate-400">Klik token untuk menyalin</span>
                </div>

                {parsedDocx && parsedDocx.placeholders.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-[11px] text-slate-600">
                      Variabel terdeteksi di dalam file DOCX Anda:
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                      {parsedDocx.placeholders.map((ph) => {
                        const info = KNOWN_VARIABLE_DESCRIPTIONS[ph];
                        const isCopied = copiedVariable === ph;
                        return (
                          <button
                            key={ph}
                            type="button"
                            onClick={() => handleCopyVariable(ph)}
                            className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded border transition-all ${
                              isCopied
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                                : info
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100'
                                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                            title={info ? `${info.label} (Contoh: ${info.example})` : 'Variabel Kustom'}
                          >
                            <span>{`{{${ph}}}`}</span>
                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 opacity-50" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded text-center text-xs text-slate-500">
                    Belum ada file DOCX yang diunggah. Silakan unggah file atau gunakan template contoh.
                  </div>
                )}

                {/* Legend list of available tokens */}
                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                  <span className="font-semibold text-slate-700 block">Daftar Tag Standar Sistem:</span>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600 font-mono">
                    <div>{'{{nama}}'} : Nama Karyawan</div>
                    <div>{'{{nik}}'} : NIK Internal</div>
                    <div>{'{{nik_ktp}}'} : KTP 16 Digit</div>
                    <div>{'{{jabatan}}'} : Posisi Kerja</div>
                    <div>{'{{departemen}}'} : Divisi</div>
                    <div>{'{{gaji_pokok}}'} : Gaji Bulanan</div>
                    <div>{'{{tanggal_mulai}}'} : Tgl Mulai</div>
                    <div>{'{{nomor_surat}}'} : No. SK Resmi</div>
                  </div>
                </div>
              </div>

              {/* Text Preview extracted from DOCX */}
              {parsedDocx && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Cuplikan Isi Teks Ekstraksi DOCX:</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {parsedDocx.rawText.length} karakter
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto p-3 bg-slate-50 rounded border border-slate-100 text-[11px] font-mono text-slate-700 whitespace-pre-line leading-relaxed">
                    {parsedDocx.rawText.slice(0, 1200)}
                    {parsedDocx.rawText.length > 1200 && '... [teks dipotong untuk preview]'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KOP & POLA PENOMORAN STANDARD */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* List of Templates */}
          <div className="bg-white p-4 border border-slate-200 rounded-lg space-y-2 shadow-xs">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Daftar Template Tersedia ({documentTemplates.length}):
            </span>
            {documentTemplates.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleSelectTemplateForEdit(tmpl)}
                className={`w-full text-left p-2.5 rounded-md text-xs font-medium border transition-colors ${
                  editingTemplateId === tmpl.id
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold truncate">{tmpl.name}</div>
                  {tmpl.sourceType === 'uploaded_docx' && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100 text-blue-800 shrink-0 font-semibold">
                      DOCX
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                  Pola: {tmpl.numberingPattern}
                </div>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setActiveTab('upload_docx')}
              className="w-full mt-3 py-2 px-3 border border-dashed border-indigo-300 hover:border-indigo-600 rounded text-xs font-semibold text-indigo-600 hover:bg-indigo-50/50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Upload Template DOCX Baru</span>
            </button>
          </div>

          {/* Form Editor */}
          <div className="lg:col-span-2 bg-white p-5 border border-slate-200 rounded-lg space-y-4 text-xs shadow-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Konfigurasi Kop Surat & Format: {activeTemplate?.name}
                </h3>
                <span className="text-[11px] text-slate-500">
                  Atur format kop resmi perusahaan dan formula penomoran dokumen otomatis.
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeTemplate?.sourceType === 'uploaded_docx' && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteDocumentTemplate(activeTemplate.id);
                      setFeedbackMessage({
                        type: 'info',
                        title: 'Template Dihapus',
                        description: `Template "${activeTemplate.name}" telah dihapus.`,
                      });
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition-colors"
                    title="Hapus template ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={handleSaveStandardTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>

            {/* Kop Surat Fields */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kop Surat Resmi (Header Perusahaan)</span>
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1">Nama Perusahaan / Organisasi</label>
                  <input
                    type="text"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-semibold bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">NPWP Lembaga</label>
                  <input
                    type="text"
                    value={editCompanyNpwp}
                    onChange={(e) => setEditCompanyNpwp(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Alamat Gedung & Domisili</label>
                <input
                  type="text"
                  value={editCompanyAddress}
                  onChange={(e) => setEditCompanyAddress(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1">Telepon</label>
                  <input
                    type="text"
                    value={editCompanyPhone}
                    onChange={(e) => setEditCompanyPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Email Resmi Legal</label>
                  <input
                    type="text"
                    value={editCompanyEmail}
                    onChange={(e) => setEditCompanyEmail(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Pola Penomoran */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Formula Pola Penomoran Otomatis
              </label>
              <input
                type="text"
                value={editNumberingFormat}
                onChange={(e) => setEditNumberingFormat(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-mono font-bold text-indigo-700"
              />
              {/* Live Simulation Result */}
              <div className="mt-2 p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-indigo-700 font-semibold block">
                    Simulasi Format Nomor Template Ini:
                  </span>
                  <span className="font-mono font-bold text-sm text-indigo-950 tracking-tight">
                    {evaluateNumberingFormula(editNumberingFormat, documents.length + 1, currentTenant.code, new Date(), {
                      deptCode: 'HRD',
                      docType: activeTemplate?.type || 'SK',
                      companyName: editCompanyName || currentTenant.name,
                    })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTokenGlossaryModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-100/70 px-2.5 py-1.5 rounded border border-indigo-300 transition-colors shrink-0 shadow-2xs"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Kamus Lengkap Tag ({NUMBERING_TOKEN_REGISTRY.length})</span>
                </button>
              </div>

              {/* Prominent Token Quick-Picker Grid */}
              <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Daftar Tag / Token Tersedia (Klik untuk Menambahkan ke Pola):</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Otomatis berformat hukum RI</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-1">
                  {NUMBERING_TOKEN_REGISTRY.map((t) => {
                    const isCopied = copiedVariable === t.token;
                    return (
                      <div
                        key={t.token}
                        className="group flex items-center justify-between p-1.5 bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded text-left transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => handleInsertToken(t.token, 'standard')}
                          className="flex-1 min-w-0 pr-1 text-left"
                          title={`Klik untuk sisipkan ${t.token} (${t.description})`}
                        >
                          <div className="font-mono font-bold text-[11px] text-indigo-700 truncate">
                            {t.token}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate flex items-center justify-between">
                            <span>{t.label}</span>
                            <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1 py-0.2 rounded text-[9px]">
                              {t.example}
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyAnyToken(t.token, t.label)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded shrink-0"
                          title="Salin tag ini"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Judul & Isi Format */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Judul Dokumen Resmi</label>
              <input
                type="text"
                value={editTitleFormat}
                onChange={(e) => setEditTitleFormat(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-bold uppercase"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Isi Template Klausul / Kontrak
              </label>
              <textarea
                rows={5}
                value={editBodyTemplate}
                onChange={(e) => setEditBodyTemplate(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded font-mono text-[11px] leading-relaxed"
              />
              <div className="text-[10px] text-slate-500 mt-1">
                Gunakan variabel dinamis seperti: {'{{nama}}'}, {'{{nik}}'}, {'{{jabatan}}'}, {'{{departemen}}'}, {'{{gaji_pokok}}'}, {'{{tanggal}}'}.
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Catatan Kaki (Footer)</label>
              <input
                type="text"
                value={editFooterText}
                onChange={(e) => setEditFooterText(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>
          </div>
        </div>
      )}

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

              {/* TAMPILAN MOBILE & TABLET: Adaptive Card Grid (< lg) */}
              <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(KNOWN_VARIABLE_DESCRIPTIONS).filter(([key, val]) => {
                  if (!tokenSearchQuery) return true;
                  const q = tokenSearchQuery.toLowerCase();
                  return key.toLowerCase().includes(q) || val.label.toLowerCase().includes(q) || val.example.toLowerCase().includes(q);
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
                      case 'jabatan': simVal = activeEmp.position; break;
                      case 'departemen': simVal = activeEmp.department; break;
                      case 'grade': simVal = activeEmp.grade || 'L3'; break;
                      case 'gaji_pokok': simVal = formatRupiah(activeEmp.basicSalary || 15000000); break;
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
                        <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {tagText}
                        </span>
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
                      <th className="py-2.5 px-3">Keterangan Data</th>
                      <th className="py-2.5 px-3">Nilai Riil Karyawan Terpilih</th>
                      <th className="py-2.5 px-3">Format Output</th>
                      <th className="py-2.5 px-3 text-center">Aksi Salin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {Object.entries(KNOWN_VARIABLE_DESCRIPTIONS).filter(([key, val]) => {
                      if (!tokenSearchQuery) return true;
                      const q = tokenSearchQuery.toLowerCase();
                      return key.toLowerCase().includes(q) || val.label.toLowerCase().includes(q) || val.example.toLowerCase().includes(q);
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
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 rounded border border-emerald-200 transition-colors"
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

      {/* MODAL: TERBITKAN DOKUMEN BARU (DARI TEMPLATE / DOCX) */}
      {isGenerateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsGenerateModalOpen(false);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Terbitkan Dokumen Resmi / Surat Keputusan</h3>
                <span className="text-[11px] text-slate-400">Pilih template standar atau template DOCX yang telah diunggah</span>
              </div>
              <button onClick={() => setIsGenerateModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleGenerateDocument} className="p-5 space-y-4 text-xs">
              {/* Template Picker */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1">Pilih Template Dokumen Acuan *</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded font-semibold bg-white text-slate-900"
                >
                  <optgroup label="Template Dokumen dari File DOCX">
                    {documentTemplates
                      .filter((t) => t.sourceType === 'uploaded_docx')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          📄 {t.name} ({t.fileName || 'DOCX Upload'})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Template Dokumen Sistem Bawaan">
                    {documentTemplates
                      .filter((t) => t.sourceType !== 'uploaded_docx')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          📋 {t.name} ({t.type})
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* Target Employee Selection */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1">Pilih Karyawan Penerima Dokumen *</label>
                <EmployeeSelect
                  employees={employees}
                  selectedEmployeeId={targetEmployeeId}
                  onSelect={(id) => setTargetEmployeeId(id)}
                />
              </div>

              {/* Custom Title Override */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Judul Dokumen Resmi (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Otomatis mengikuti judul template jika dikosongkan..."
                  value={customDocTitle}
                  onChange={(e) => setCustomDocTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-medium"
                />
              </div>

              {/* Special Note / Custom Clause */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Klausul Tambahan / Keterangan Khusus
                </label>
                <textarea
                  rows={3}
                  value={customAdditionalNotes}
                  onChange={(e) => setCustomAdditionalNotes(e.target.value)}
                  placeholder="Kosongkan untuk menggunakan seluruh isi baku dari template yang dipilih..."
                  className="w-full p-2 border border-slate-300 rounded text-xs leading-relaxed"
                />
              </div>

              {/* Numbering Preview */}
              {(() => {
                const tmpl = documentTemplates.find((t) => t.id === selectedTemplateId);
                const nextNo = evaluateNumberingFormula(
                  tmpl?.numberingPattern || '{SEQ}/HRD-DOC/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}',
                  documents.length + 1,
                  currentTenant.code
                );
                return (
                  <div className="p-3 bg-indigo-50/60 rounded border border-indigo-200 text-indigo-900 text-[11px] flex items-center justify-between">
                    <div>
                      <span className="font-bold block">Nomor Dokumen Otomatis:</span>
                      <span className="font-mono text-indigo-800 font-semibold">{nextNo}</span>
                    </div>
                    <div className="text-right text-[10px] text-indigo-700">
                      Formula: {tmpl?.numberingPattern}
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Generate Nomor & Tanda Tangan QR</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW DOKUMEN RESMI & CETAK PDF */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedDoc(null);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold">Surat Keputusan Elektronik Terverifikasi QR UU ITE</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                  title="Cetak Fisik Dokumen (Printer)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                  title="Unduh Naskah Dokumen Format PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
                <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Content Canvas */}
            <div className="p-8 space-y-6 text-slate-900 bg-white text-xs overflow-y-auto print:p-0">
              {/* Kop Surat Resmi */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-3">
                  {currentTenant.documentLogoUrl ? (
                    <img
                      src={currentTenant.documentLogoUrl}
                      alt={currentTenant.name}
                      className="w-12 h-12 rounded-lg object-contain border border-slate-200 p-0.5 bg-white shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0 font-sans">
                      {currentTenant.logoText || 'N'}
                    </div>
                  )}
                  <div>
                    <h1 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                      {currentTenant.name}
                    </h1>
                    <p className="text-[11px] text-slate-600">
                      {currentTenant.address || `Gedung Menara Palma Lantai 18, Jl. HR Rasuna Said, ${currentTenant.city} 12950`}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Telp: +62 21 5566 7788 · Email: legal.hr@nusantara.id · NPWP: {currentTenant.npwp || '01.999.888.7-011.000'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Judul & Nomor Surat */}
              <div className="text-center space-y-1">
                <div className="font-bold text-sm tracking-wide text-slate-900 uppercase underline">
                  {selectedDoc.title}
                </div>
                <div className="font-mono text-xs font-bold text-indigo-700">
                  Nomor: {selectedDoc.documentNumber}
                </div>
              </div>

              {/* Isi Surat */}
              <div className="space-y-3 leading-relaxed text-slate-800 whitespace-pre-line text-justify border-y border-slate-100 py-4 font-serif text-[12px]">
                {selectedDoc.contentPreview}
              </div>

              {/* Tanda Tangan & QR Verification */}
              <div className="flex justify-between items-end pt-4">
                <div className="text-[10px] text-slate-400 max-w-sm leading-normal">
                  <strong className="block text-slate-600 mb-0.5">Kekuatan Hukum Dokumen Elektronik:</strong>
                  Dokumen ini telah ditandatangani secara elektronik bersertifikat digital dan memiliki kekuatan hukum pembuktian yang sah sesuai UU ITE No. 11 Tahun 2008 Pasal 5 & 11 jo PP 71/2019.
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Jakarta, {selectedDoc.issueDate}</div>
                    <div className="text-[11px] font-bold text-slate-900 mt-1">{selectedDoc.signeeName}</div>
                    <div className="text-[10px] text-slate-600">{selectedDoc.signeeRole}</div>
                  </div>
                  <QRCodeView
                    value={selectedDoc.qrVerificationUrl}
                    size={68}
                  />
                </div>
              </div>
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
                                    onClick={() => handleInsertToken(item.token, activeTab === 'upload_docx' ? 'upload' : 'standard')}
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
                          <th className="py-2.5 px-3">Keterangan Data</th>
                          <th className="py-2.5 px-3">Contoh Data Riil</th>
                          <th className="py-2.5 px-3 text-center">Salin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {Object.entries(KNOWN_VARIABLE_DESCRIPTIONS).filter(([key, val]) => {
                          if (!tokenSearchQuery) return true;
                          const q = tokenSearchQuery.toLowerCase();
                          return key.toLowerCase().includes(q) || val.label.toLowerCase().includes(q) || val.example.toLowerCase().includes(q);
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

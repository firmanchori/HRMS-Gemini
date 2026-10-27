import React, { useState, useMemo, useEffect } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  FileText,
  X,
  CheckCircle2,
  Printer,
  Download,
  Search,
  Sparkles,
  User,
  Building,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import { EmployeeSelect } from './EmployeeSelect';
import { OfficialMultiPageDocumentSheet } from './OfficialMultiPageDocumentSheet';
import {
  TemplateCategory,
  TEMPLATE_CATEGORIES,
  getTemplateCategory,
  renderCategoryIcon,
} from '../../utils/documentCategoryHelper';
import {
  interpolateDocxTemplate,
  evaluateNumberingFormula,
  KNOWN_VARIABLE_DESCRIPTIONS,
} from '../../utils/docxTemplateHelper';
import { DocumentTemplateConfig, OfficialDocument } from '../../types/hrms';

export interface ModuleDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  categoryFilter?: TemplateCategory | TemplateCategory[];
  defaultTemplateId?: string;
  defaultEmployeeId?: string;
  initialVariables?: Record<string, string>;
  onDocumentCreated?: (doc: OfficialDocument) => void;
}

export const ModuleDocumentModal: React.FC<ModuleDocumentModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <ModuleDocumentModalContent {...props} />;
};

const ModuleDocumentModalContent: React.FC<ModuleDocumentModalProps> = ({
  isOpen: _isOpen,
  onClose,
  title = 'Pusat Penerbitan Dokumen Resmi Berbasis Template',
  categoryFilter,
  defaultTemplateId,
  defaultEmployeeId,
  initialVariables = {},
  onDocumentCreated,
}) => {
  const {
    currentTenant,
    employees,
    documentTemplates,
    createOfficialDocument,
    documents,
  } = useHrms();

  const initialVarsRef = React.useRef(initialVariables);
  initialVarsRef.current = initialVariables;

  // Normalize allowed categories stably
  const allowedCategories = useMemo<TemplateCategory[]>(() => {
    if (!categoryFilter) return TEMPLATE_CATEGORIES.map((c) => c.id);
    return Array.isArray(categoryFilter) ? categoryFilter : [categoryFilter];
  }, [JSON.stringify(categoryFilter)]);

  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>(() => {
    if (allowedCategories.length === 1) return allowedCategories[0];
    return 'all';
  });

  const [templateSearch, setTemplateSearch] = useState('');

  // Filter available templates based on allowedCategories, activeCategory & templateSearch
  const availableTemplates = useMemo(() => {
    return documentTemplates.filter((tmpl) => {
      const cat = getTemplateCategory(tmpl);
      const matchesAllowed = allowedCategories.includes(cat);
      if (!matchesAllowed) return false;

      const matchesActiveCat = activeCategory === 'all' || cat === activeCategory;
      if (!matchesActiveCat) return false;

      if (templateSearch.trim()) {
        const q = templateSearch.toLowerCase();
        const matchesQuery =
          tmpl.name.toLowerCase().includes(q) ||
          tmpl.type.toLowerCase().includes(q) ||
          cat.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [documentTemplates, allowedCategories, activeCategory, templateSearch]);

  // Selected template state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    if (defaultTemplateId && documentTemplates.some((t) => t.id === defaultTemplateId)) {
      return defaultTemplateId;
    }
    return availableTemplates[0]?.id || documentTemplates[0]?.id || '';
  });

  // Ensure selectedTemplateId is valid when availableTemplates change
  useEffect(() => {
    if (availableTemplates.length > 0 && !availableTemplates.some((t) => t.id === selectedTemplateId)) {
      setSelectedTemplateId(availableTemplates[0].id);
    }
  }, [availableTemplates.length, selectedTemplateId]);

  const activeTemplate = useMemo(() => {
    return documentTemplates.find((t) => t.id === selectedTemplateId) || availableTemplates[0] || documentTemplates[0];
  }, [documentTemplates, selectedTemplateId, availableTemplates]);

  // Target Employee State
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>(() => {
    if (defaultEmployeeId && employees.some((e) => e.id === defaultEmployeeId)) {
      return defaultEmployeeId;
    }
    return employees[0]?.id || '';
  });

  const targetEmployee = useMemo(() => {
    return employees.find((e) => e.id === targetEmployeeId) || employees[0];
  }, [employees, targetEmployeeId]);

  // Document Number & Signatory State
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [signeeName, setSigneeName] = useState<string>(activeTemplate?.signeeTitle || 'Aditya Pratama, S.Psi');
  const [signeeRole, setSigneeRole] = useState<string>(activeTemplate?.signeeRole || 'VP of Human Capital');
  const [issueDate, setIssueDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Custom Variable Form Values
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ title: string; desc: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update document number and variables when template or employee changes
  useEffect(() => {
    if (!activeTemplate) return;
    const seq = (documents.length + 1).toString().padStart(3, '0');
    const autoNumber = evaluateNumberingFormula(
      activeTemplate.numberingPattern || '{SEQ}/HRD/{TENANT_CODE}/{ROMAN_MONTH}/{YEAR}',
      seq,
      currentTenant?.code || 'NTM',
      activeTemplate.type
    );
    setDocumentNumber(autoNumber);
    setSigneeName(activeTemplate.signeeTitle || 'Aditya Pratama, S.Psi');
    setSigneeRole(activeTemplate.signeeRole || 'Pihak Manajemen');

    // Populate initial variables
    const initialMap: Record<string, string> = { ...initialVarsRef.current };
    if (activeTemplate.extractedPlaceholders) {
      activeTemplate.extractedPlaceholders.forEach((key) => {
        if (!initialMap[key] && initialVarsRef.current[key]) {
          initialMap[key] = initialVarsRef.current[key];
        }
      });
    }
    setCustomVariables(initialMap);
  }, [activeTemplate?.id, currentTenant?.code, documents.length]);

  // Rendered document body
  const renderedContent = useMemo(() => {
    if (!activeTemplate) return '';
    let body = activeTemplate.defaultBody || '';

    // Standard interpolation from employee & tenant
    body = interpolateDocxTemplate(body, {
      employee: targetEmployee,
      tenant: currentTenant,
      documentNumber,
      signeeName,
      signeeRole,
      issueDate,
    });

    // Custom variable overrides
    Object.entries(customVariables).forEach(([key, val]) => {
      if (val) {
        const regex1 = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        const regex2 = new RegExp(`\\{${key}\\}`, 'gi');
        body = body.replace(regex1, val).replace(regex2, val);
      }
    });

    return body;
  }, [activeTemplate, targetEmployee, currentTenant, documentNumber, signeeName, signeeRole, issueDate, customVariables]);

  // Handle Create & Publish to Archive
  const handlePublishDocument = () => {
    if (!activeTemplate || !targetEmployee) return;

    try {
      setIsSubmitting(true);
      const newDoc = createOfficialDocument({
        type: activeTemplate.type as any,
        templateId: activeTemplate.id,
        title: activeTemplate.name,
        targetEmployeeId: targetEmployee.id,
        signeeName,
        signeeRole,
        contentPreview: renderedContent,
        customDocumentNumber: documentNumber,
        isFromDocxTemplate: activeTemplate.sourceType === 'uploaded_docx',
      });

      setFeedback({
        title: 'Dokumen Berhasil Diterbitkan',
        desc: `Dokumen ${newDoc.documentNumber} telah tersimpan dan terarsip resmi di Sub Menu Arsip Dokumen.`,
        type: 'success',
      });

      if (onDocumentCreated) {
        onDocumentCreated(newDoc);
      }

      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1600);
    } catch (e: any) {
      console.error(e);
      setFeedback({
        title: 'Gagal Menerbitkan Dokumen',
        desc: e?.message || 'Terjadi kesalahan sistem saat menyimpan dokumen.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[96vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white">{title}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-semibold">
                  {availableTemplates.length} Template Siap Pakai
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Pilih template dokumen resmi, sesuaikan data penerima, terbitkan langsung ke sub menu Arsip Dokumen atau cetak fisik.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 border-b shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                <strong>{feedback.title}:</strong> {feedback.desc}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body: 2 Kolom (Konfigurasi Kiri, Live Preview Kanan) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0 bg-slate-50">
          {/* Kolom Kiri: Pilihan Template, Karyawan & Variabel */}
          <div className="lg:col-span-5 border-r border-slate-200 bg-white p-4 sm:p-5 overflow-y-auto space-y-4">
            {/* Filter Kategori Tab / Pills (jika ada lebih dari 1 kategori yang diizinkan) */}
            {allowedCategories.length > 1 && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Kategori Template ({allowedCategories.length}):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      activeCategory === 'all'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua ({documentTemplates.filter((t) => allowedCategories.includes(getTemplateCategory(t))).length})
                  </button>
                  {allowedCategories.map((catId) => {
                    const catObj = TEMPLATE_CATEGORIES.find((c) => c.id === catId);
                    const count = documentTemplates.filter((t) => getTemplateCategory(t) === catId).length;
                    return (
                      <button
                        key={catId}
                        type="button"
                        onClick={() => setActiveCategory(catId)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          activeCategory === catId
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {renderCategoryIcon(catId, 'w-3 h-3')}
                        <span>{catObj?.label || catId}</span>
                        <span className="opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pilihan Template Dokumen */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pilih Template Naskah ({availableTemplates.length}):</span>
                </label>
              </div>

              {/* Search template input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari dari template yang tersedia..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              {/* Template list scroll container */}
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {availableTemplates.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Tidak ada template yang cocok dengan pencarian.
                  </div>
                ) : (
                  availableTemplates.map((tmpl) => {
                    const isSelected = tmpl.id === selectedTemplateId;
                    const cat = getTemplateCategory(tmpl);
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(tmpl.id)}
                        className={`w-full text-left p-2.5 transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600 text-indigo-950 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs truncate font-semibold">{tmpl.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono font-medium">
                              {tmpl.type}
                            </span>
                            <span className="text-[9.5px] text-slate-400">·</span>
                            <span className="text-[9.5px] text-slate-500 truncate">{cat}</span>
                          </div>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold shrink-0">
                          {tmpl.paperSize || 'A4'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Target Karyawan */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pihak Penerima / Karyawan Target:</span>
              </label>
              <EmployeeSelect
                employees={employees}
                selectedEmployeeId={targetEmployeeId}
                onChange={setTargetEmployeeId}
                className="w-full"
              />
              {targetEmployee && (
                <div className="text-[10px] text-slate-500 grid grid-cols-2 gap-1 pt-1 border-t border-slate-200/60 mt-1">
                  <span>NIK: <strong className="text-slate-700">{targetEmployee.nik}</strong></span>
                  <span>Jabatan: <strong className="text-slate-700">{targetEmployee.position}</strong></span>
                  <span>Departemen: <strong className="text-slate-700">{targetEmployee.department}</strong></span>
                  <span>Status: <strong className="text-slate-700">{targetEmployee.employmentType}</strong></span>
                </div>
              )}
            </div>

            {/* Metadata Penomoran & Penandatangan */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Nomor Surat & Pejabat Penandatangan:</span>
              </label>

              <div className="space-y-1.5">
                <div>
                  <span className="text-[10px] font-semibold text-slate-600 block">Nomor Dokumen:</span>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-600 block">Nama Pejabat:</span>
                    <input
                      type="text"
                      value={signeeName}
                      onChange={(e) => setSigneeName(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-600 block">Jabatan Pejabat:</span>
                    <input
                      type="text"
                      value={signeeRole}
                      onChange={(e) => setSigneeRole(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Variables Fields (Jika ada placeholder khusus di template) */}
            {activeTemplate?.extractedPlaceholders && activeTemplate.extractedPlaceholders.length > 0 && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Variabel & Nilai Naskah:</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {activeTemplate.extractedPlaceholders.length} Tag
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {activeTemplate.extractedPlaceholders.map((placeholder) => {
                    const meta = KNOWN_VARIABLE_DESCRIPTIONS[placeholder.toLowerCase()];
                    const label = meta?.label || placeholder;
                    const currentValue = customVariables[placeholder] || '';

                    return (
                      <div key={placeholder} className="grid grid-cols-3 gap-1.5 items-center">
                        <label className="text-[10px] font-medium text-slate-600 truncate col-span-1" title={label}>
                          {label}
                        </label>
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) =>
                            setCustomVariables((prev) => ({
                              ...prev,
                              [placeholder]: e.target.value,
                            }))
                          }
                          placeholder={meta?.example || `Nilai {{${placeholder}}}`}
                          className="col-span-2 px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-800 placeholder-slate-400 font-mono"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Bar (Bawah Kolom Kiri) */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePublishDocument}
                disabled={isSubmitting || !activeTemplate}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terbitkan ke Arsip Dokumen</span>
              </button>
            </div>
          </div>

          {/* Kolom Kanan: Pratinjau Lembar Fisik Dokumen Multi-Halaman */}
          <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-200/80 overflow-y-auto flex flex-col items-center">
            <div className="w-full max-w-2xl mb-3 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pratinjau Lembar Dokumen Resmi ({activeTemplate?.paperSize || 'A4'})</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Dokumen akan tersimpan permanen di <strong>Sub Menu Arsip Dokumen</strong>
              </span>
            </div>

            {/* Official Multi Page Document Sheet Live Canvas */}
            <div className="w-full flex justify-center">
              <OfficialMultiPageDocumentSheet
                title={activeTemplate?.name || 'Dokumen Resmi'}
                documentNumber={documentNumber}
                content={renderedContent}
                tenant={currentTenant}
                employee={targetEmployee}
                signeeName={signeeName}
                signeeRole={signeeRole}
                issueDate={issueDate}
                paperSize={activeTemplate?.paperSize || 'A4'}
                showLetterhead={true}
                showQrSignature={true}
                showQrValidation={true}
                onSuccessNotice={(t, d) => setFeedback({ title: t, desc: d, type: 'success' })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

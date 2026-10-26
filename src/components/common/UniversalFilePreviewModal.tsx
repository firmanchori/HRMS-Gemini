import React, { useRef, useState, useEffect } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  X,
  Printer,
  Download,
  FileText,
  ShieldCheck,
  Building,
  Calendar,
  User,
  Paperclip,
  CheckCircle2,
  Share2,
  FileDown,
} from 'lucide-react';
import { QRCodeView } from './QRCodeView';
import { exportElementToPdf } from '../../utils/pdfExport';
import { openWhatsAppChat } from '../../utils/whatsappHelper';

export const UniversalFilePreviewModal: React.FC = () => {
  const { activePreviewItem, closeFilePreview, currentTenant } = useHrms();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activePreviewItem) {
        closeFilePreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePreviewItem, closeFilePreview]);

  if (!activePreviewItem) return null;

  const {
    title,
    documentNumber = 'DOC-HRMS-2026/001',
    typeBadge = 'Dokumen Resmi',
    date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    partyName,
    partyRole,
    statusBadge = { label: 'Terverifikasi Sah', variant: 'success' },
    detailsGrid,
    contentParagraphs,
    rawHtmlOrBody,
    qrPayload,
    signeeName = 'H. Budi Santoso, S.E., M.M.',
    signeeRole = 'Direktur Sumber Daya Manusia & Operasional',
    attachments,
  } = activePreviewItem;

  const qrData =
    qrPayload ||
    JSON.stringify({
      docNo: documentNumber,
      title,
      tenant: currentTenant.name,
      verifiedAt: date,
      status: 'VERIFIED_LEGAL_AUTHENTIC',
      system: 'NusaHR Enterprise v2026',
    });

  const getStatusBadgeStyle = (variant?: string) => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'info':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'success':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${documentNumber.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    const textContent = `
========================================================================
${currentTenant.name.toUpperCase()}
NPWP: ${currentTenant.npwp}
KOTA: ${currentTenant.city}
========================================================================
DOKUMEN RESMI: ${title.toUpperCase()}
Nomor: ${documentNumber}
Tanggal: ${date}
Pihak Terkait: ${partyName || '-'} (${partyRole || '-'})
Status: ${statusBadge.label}
------------------------------------------------------------------------
${contentParagraphs?.join('\n\n') || rawHtmlOrBody || 'Dokumen resmi tercatat pada sistem NusaHR Enterprise.'}
------------------------------------------------------------------------
Tertanda Sah Secara Digital:
${signeeName}
${signeeRole}
Verifikasi Hash QR: ${qrData}
========================================================================
    `.trim();

    const element = document.createElement('a');
    const file = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportPdf = async () => {
    if (!sheetRef.current) return;
    setIsExporting(true);
    try {
      const cleanDocNo = documentNumber.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      await exportElementToPdf(sheetRef.current, {
        fileName: `[NusaHR]_${cleanTitle}_${cleanDocNo}.pdf`,
        title,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareWhatsApp = () => {
    const targetPhone = '08129876543';
    const message = `*DOKUMEN RESMI NUSAHR ENTERPRISE*
*${currentTenant.name.toUpperCase()}*

📄 *Dokumen:* *${title}*
🔖 *Nomor:* ${documentNumber}
📅 *Tanggal:* ${date}
👤 *Pihak Terkait:* ${partyName || '-'} (${partyRole || '-'})
⚖️ *Status Legal:* *${statusBadge.label}*

✅ *Tertanda Sah Digital:*
${signeeName} (${signeeRole})

_Dokumen ini diverifikasi secara sah melalui sistem NusaHR Enterprise v2026._`;
    openWhatsAppChat(targetPhone, message);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeFilePreview();
        }
      }}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh] sm:h-[86vh] print:h-auto print:max-h-none print:shadow-none print:border-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2.5 truncate">
            <span className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <FileText className="w-4 h-4" />
            </span>
            <div className="truncate">
              <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
                <span>Preview Dokumen & Berkas Resmi</span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 font-mono">
                  {typeBadge}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono truncate">
                {documentNumber}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* WhatsApp Icon Button (Official WhatsApp Brand Icon) */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              title="Kirim Dokumen ke WhatsApp"
              aria-label="Kirim Dokumen ke WhatsApp"
              className="p-2 sm:p-2.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center justify-center shrink-0"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967c-.273-.099-.471-.148-.67.15c-.197.297-.767.966-.94 1.164c-.173.199-.347.223-.644.075c-.297-.15-1.255-.463-2.39-1.475c-.883-.788-1.48-1.761-1.653-2.059c-.173-.297-.018-.458.13-.606c.134-.133.298-.347.446-.52s.198-.298.298-.497c.099-.198.05-.371-.025-.52s-.669-1.612-.916-2.207c-.242-.579-.487-.5-.669-.51a13 13 0 0 0-.57-.01c-.198 0-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074s2.096 3.2 5.077 4.487c.709.306 1.262.489 1.694.625c.712.227 1.36.195 1.871.118c.571-.085 1.758-.719 2.006-1.413s.248-1.289.173-1.413c-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214l-3.741.982l.998-3.648l-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884c2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413" />
              </svg>
            </button>

            {/* Print Icon Button */}
            <button
              type="button"
              onClick={handlePrint}
              title="Cetak Dokumen Fisik (Ctrl+P)"
              aria-label="Cetak Dokumen Fisik"
              className="p-2 sm:p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center justify-center shrink-0 border border-slate-700"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Direct PDF Download Icon Button */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              title="Unduh Berkas Binary PDF Resmi"
              aria-label="Unduh Berkas Binary PDF Resmi"
              className="p-2 sm:p-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-60"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 text-slate-900" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={closeFilePreview}
              title="Tutup Preview (Esc)"
              aria-label="Tutup Preview"
              className="p-2 sm:p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 bg-slate-50 print:bg-white print:p-0">
          <div
            ref={sheetRef}
            className="max-w-3xl mx-auto bg-white p-6 sm:p-10 border border-slate-200 rounded-lg shadow-xs print:border-none print:shadow-none print:p-0"
          >
            {/* Kop Surat Resmi Standard Indonesia */}
            <div className="border-b-2 border-slate-900 pb-3 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {currentTenant.documentLogoUrl ? (
                    <img
                      src={currentTenant.documentLogoUrl}
                      alt={currentTenant.name}
                      className="w-12 h-12 rounded-lg object-contain border border-slate-200 p-0.5 bg-white shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                      {currentTenant.logoText || 'N'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight uppercase leading-tight">
                      {currentTenant.name}
                    </h2>
                    <p className="text-xs text-slate-600 leading-snug">
                      Gedung Menara Nusa Lantai 18-20, Kawasan Pusat Bisnis, {currentTenant.city}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      NPWP: {currentTenant.npwp} · Telp: (021) 5088-7700 · Web: https://nusahr.id
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md border ${getStatusBadgeStyle(statusBadge.variant)}`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{statusBadge.label}</span>
                  </span>
                </div>
              </div>
              <div className="mt-3 border-t border-slate-400/80" />
            </div>

            {/* Document Title & Reference Number */}
            <div className="text-center my-6">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 uppercase tracking-wide">
                {title}
              </h1>
              <div className="text-xs font-semibold text-slate-700 font-mono mt-1">
                Nomor: <span className="text-indigo-900">{documentNumber}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Tanggal Diterbitkan: {date}
              </div>
            </div>

            {/* Target Party Card */}
            {(partyName || partyRole) && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 sm:p-4 mb-6 text-xs text-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pihak yang Dituju / Bersangkutan:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Nama Lengkap / Entitas:</span>{' '}
                    <strong className="text-slate-900">{partyName || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Jabatan / Departemen:</span>{' '}
                    <span className="text-slate-800">{partyRole || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Details Grid (e.g. Finance, Dates, Routes, Assets) */}
            {detailsGrid && detailsGrid.length > 0 && (
              <div className="mb-6 border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-200">
                  Rincian & Ketetapan Dokumen
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-xs">
                  <div className="divide-y divide-slate-100">
                    {detailsGrid.slice(0, Math.ceil(detailsGrid.length / 2)).map((item, idx) => (
                      <div key={idx} className="flex justify-between p-2.5 px-3">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-semibold text-slate-900 font-mono text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {detailsGrid.slice(Math.ceil(detailsGrid.length / 2)).map((item, idx) => (
                      <div key={idx} className="flex justify-between p-2.5 px-3">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-semibold text-slate-900 font-mono text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Document Body Paragraphs */}
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed space-y-3.5 mb-8">
              {contentParagraphs && contentParagraphs.length > 0 ? (
                contentParagraphs.map((paragraph, idx) => (
                  <p key={idx} className="text-justify leading-relaxed">
                    {paragraph}
                  </p>
                ))
              ) : rawHtmlOrBody ? (
                <div className="whitespace-pre-line text-justify leading-relaxed">
                  {rawHtmlOrBody}
                </div>
              ) : (
                <p className="text-justify leading-relaxed">
                  Dokumen ini diterbitkan oleh manajemen {currentTenant.name} sebagai ketetapan sah dan mengikat sesuai peraturan perusahaan serta ketentuan ketenagakerjaan Republik Indonesia yang berlaku. Segala hak, kewajiban, serta konsekuensi yang tercantum telah disepakati oleh seluruh pihak terkait.
                </p>
              )}
            </div>

            {/* Attachments List */}
            {attachments && attachments.length > 0 && (
              <div className="mb-6 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Lampiran Dokumen Pendukung ({attachments.length}):</span>
                </div>
                <div className="space-y-1.5">
                  {attachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs bg-white p-2 rounded border border-indigo-100 text-slate-700"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-medium truncate">{att.fileName}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0">
                        {att.fileSize || '120 KB'} · {att.fileType || 'PDF/JPG'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legal Signature & QR Verification Section */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
                {/* QR Code Verification Stamp */}
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-lg shrink-0">
                  <QRCodeView value={qrData} size={72} />
                  <div className="text-[10px] text-slate-600 max-w-[210px] leading-tight">
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>TEROTENTIKASI DIGITAL</span>
                    </div>
                    <p className="mt-0.5 text-slate-500">
                      Pindai QR untuk memvalidasi integritas dokumen pada blockchain/ledger NusaHR.
                    </p>
                    <p className="mt-1 font-mono text-[9px] text-slate-400">
                      ID: {documentNumber}
                    </p>
                  </div>
                </div>

                {/* Signee Official Signature */}
                <div className="text-center sm:text-right shrink-0">
                  <div className="text-xs text-slate-600">
                    Ditetapkan di {currentTenant.city}, {date}
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5">
                    {currentTenant.name}
                  </div>
                  <div className="h-14 flex items-center justify-center sm:justify-end my-1">
                    <span className="font-serif italic text-indigo-900/60 text-lg select-none px-4 py-1 border-b border-dashed border-indigo-300">
                      {signeeName}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 underline">
                    {signeeName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {signeeRole}
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Footer Note */}
            <div className="mt-8 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono print:text-slate-600">
              Dokumen ini sah dan memiliki kekuatan hukum penuh sesuai UU ITE Republik Indonesia No. 11/2008 & PP No. 71/2019. Dicetak otomatis dari platform NusaHR Enterprise.
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-100 border-t border-slate-200 text-xs shrink-0 print:hidden">
          <span className="text-slate-500 flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="truncate">Status File: Siap diunduh / dicetak dalam format resmi A4</span>
          </span>
          <button
            onClick={closeFilePreview}
            className="px-4 py-1.5 rounded-md font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            Tutup Preview
          </button>
        </div>
      </div>
    </div>
  );
};

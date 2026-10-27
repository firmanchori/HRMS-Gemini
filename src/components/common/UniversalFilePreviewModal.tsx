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
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { QRCodeView } from './QRCodeView';
import { WhatsAppIcon } from './WhatsAppIcon';
import { exportElementToPdf } from '../../utils/pdfExport';
import { openWhatsAppChat } from '../../utils/whatsappHelper';
import { printPagesDirectly } from '../../utils/documentPdfExporter';

export const UniversalFilePreviewModal: React.FC = () => {
  const { activePreviewItem, closeFilePreview, currentTenant } = useHrms();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waPhoneNumber, setWaPhoneNumber] = useState('08129876543');

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
    signatories,
    attachments,
    systemicImpactGrid,
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

  const handlePrint = async () => {
    if (!sheetRef.current) return;
    try {
      setIsPrinting(true);
      await printPagesDirectly([sheetRef.current]);
    } catch (err: any) {
      console.error('Print failed:', err);
      alert('Gagal memproses pencetakan dokumen resmi.');
    } finally {
      setIsPrinting(false);
    }
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
${
  signatories && signatories.length > 0
    ? signatories.map((s) => `[${s.label.toUpperCase()}]\n${s.name} - ${s.role || '-'}`).join('\n\n')
    : `${signeeName}\n${signeeRole}`
}
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

  const handleExecuteSendWhatsApp = () => {
    const message = `*DOKUMEN RESMI - ${currentTenant.name.toUpperCase()}*

Yth. *${partyName || 'Bapak/Ibu'}*,
Berikut pemberitahuan naskah resmi yang telah diterbitkan:

📄 *Dokumen:* *${title}*
🔖 *Nomor Surat:* ${documentNumber}
📅 *Tanggal:* ${date}
👤 *Pihak Terkait:* ${partyName || '-'} (${partyRole || '-'})
⚖️ *Status Legal:* *${statusBadge.label}*

✍️ *Tertanda Sah Digital:*
${signeeName} (${signeeRole})

Dokumen ini sah menurut hukum ketenagakerjaan dan UU ITE Republik Indonesia.

Terima kasih,
*Human Capital & Legal*
${currentTenant.name}`;

    openWhatsAppChat(waPhoneNumber, message);
    setIsWaModalOpen(false);
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

          <div className="flex items-center gap-2 shrink-0">
            {/* Direct PDF Download Button */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              title="Unduh Berkas Binary PDF Resmi"
              aria-label="Download PDF"
              className="p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0 disabled:opacity-60 flex items-center justify-center"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
            </button>

            {/* Print Button (Pencetakan Naskah Bersih Non-window.print) */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              title="Cetak Naskah Dokumen Fisik A4"
              aria-label="Cetak Dokumen"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0 border border-slate-700 disabled:opacity-60 flex items-center justify-center"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
            </button>

            {/* WhatsApp Button */}
            <button
              type="button"
              onClick={() => setIsWaModalOpen(true)}
              title="Kirim Dokumen ke WhatsApp"
              aria-label="Kirim WhatsApp"
              className="p-2 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0 flex items-center justify-center"
            >
              <WhatsAppIcon className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={closeFilePreview}
              title="Tutup Preview (Esc)"
              aria-label="Tutup Preview"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 ml-1 flex items-center justify-center"
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

            {/* Target Party Card - 1 Kolom */}
            {(partyName || partyRole) && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 sm:p-4 mb-6 text-xs text-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pihak yang Dituju / Bersangkutan:</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-baseline">
                    <span className="text-slate-500 w-44 shrink-0 font-medium">Nama Lengkap / Entitas</span>
                    <span className="hidden sm:inline text-slate-400 mr-2 font-mono">:</span>
                    <strong className="text-slate-900">{partyName || '-'}</strong>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline">
                    <span className="text-slate-500 w-44 shrink-0 font-medium">Jabatan / Departemen</span>
                    <span className="hidden sm:inline text-slate-400 mr-2 font-mono">:</span>
                    <span className="text-slate-800 font-semibold">{partyRole || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Details Grid - 2 Kolom (Kolom 1: Judul, Kolom 2: : Isian) */}
            {detailsGrid && detailsGrid.length > 0 && (
              <div className="mb-6 border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200">
                  Rincian & Ketetapan Dokumen
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <tbody className="divide-y divide-slate-100">
                      {detailsGrid.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3.5 text-slate-600 font-medium w-2/5 sm:w-1/3 bg-slate-50/40">
                            {item.label}
                          </td>
                          <td className="py-2.5 px-3.5 font-semibold text-slate-900 font-mono">
                            <span className="text-slate-400 mr-2 font-normal font-sans">:</span>
                            {item.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

            {/* Matriks Transisi Dampak Sistemik, Akses Sistem & Fasilitas Aset */}
            {systemicImpactGrid && systemicImpactGrid.length > 0 && (
              <div className="mb-8 border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                {/* Clean Title without icon and without tag */}
                <div className="bg-slate-100 px-3.5 py-2.5 border-b border-slate-200 font-bold text-slate-800 text-xs">
                  Matriks Transisi Dampak Sistemik, Akses Sistem & Fasilitas Aset
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Kategori Transisi</th>
                        <th className="p-2.5">Sebelumnya</th>
                        <th className="p-2.5">Ketetapan Baru</th>
                        <th className="p-2.5">Dampak Sistemik & Eksekusi Otomatis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {systemicImpactGrid.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-2.5 font-bold text-slate-800 whitespace-nowrap bg-slate-50/40">
                            {row.category}
                          </td>
                          <td className="p-2.5 text-slate-600 font-medium">{row.before}</td>
                          <td className="p-2.5 text-slate-900 font-semibold">{row.after}</td>
                          <td className="p-2.5 text-indigo-700 font-medium">{row.impact}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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

            {/* Legal Signature & Individual QR Digital Signature Section */}
            <div className="mt-8 pt-6 border-t border-slate-200 space-y-6">
              {/* City, Date & Tenant Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Tempat & Tanggal Penetapan:</span>
                  <span className="font-bold text-slate-800 ml-1.5 font-sans">
                    {currentTenant.city}, {date}
                  </span>
                </div>
                <div className="text-slate-600 font-semibold text-right">
                  {currentTenant.name}
                </div>
              </div>

              {signatories && signatories.length > 0 ? (
                /* Multi-Column Signatories: Every employee has an individual QR digital signature between label and name */
                <div
                  className={`grid gap-4 ${
                    signatories.length === 1
                      ? 'grid-cols-1 max-w-xs mx-auto sm:ml-auto'
                      : signatories.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : signatories.length === 3
                      ? 'grid-cols-1 sm:grid-cols-3'
                      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
                  }`}
                >
                  {signatories.map((sig, sIdx) => {
                    const individualSignerQR = JSON.stringify({
                      type: 'INDIVIDUAL_DIGITAL_SIGNATURE',
                      tenant: currentTenant.name,
                      signerName: sig.name || 'Pejabat',
                      signerNik: sig.nik || '-',
                      signerRole: sig.role || '-',
                      actionLabel: sig.label,
                      docNumber: documentNumber,
                      signedDate: date,
                      hash: `DS-${(sig.name || '').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()}-${(sIdx + 1) * 7392}`,
                      status: 'TEROTENTIKASI_DIGITAL',
                    });

                    return (
                      <div
                        key={sig.id || sIdx}
                        className="text-center p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col justify-between items-center print:bg-white shadow-2xs"
                      >
                        {/* 1. Atas: Keterangan Tanda Tangan */}
                        <div className="w-full pb-1.5 mb-1 border-b border-slate-200/60">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                            {sig.label || 'Menyetujui'}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {currentTenant.name}
                          </div>
                        </div>

                        {/* 2. Tengah (Di Atas Nama): QR TTD TEROTENTIKASI DIGITAL PEGAWAI */}
                        <div className="my-2 flex flex-col items-center">
                          <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs hover:scale-105 transition-transform">
                            <QRCodeView value={individualSignerQR} size={68} showBorder={false} />
                          </div>
                          <div className="mt-1.5 inline-flex items-center gap-1 text-[8px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                            <span>TEROTENTIKASI DIGITAL</span>
                          </div>
                        </div>

                        {/* 3. Bawah: Nama, NIK & Jabatan */}
                        <div className="w-full pt-1.5 border-t border-slate-200/60">
                          <div className="text-xs font-bold text-slate-900 underline underline-offset-2 truncate" title={sig.name}>
                            {sig.name || '-'}
                          </div>
                          {sig.nik && (
                            <div className="text-[9px] font-mono text-slate-500 font-medium mt-0.5">
                              NIK: {sig.nik}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 truncate mt-0.5 font-medium" title={sig.role}>
                            {sig.role || '-'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Single Signee Fallback */
                <div className="flex justify-end">
                  <div className="text-center p-4 bg-slate-50/70 rounded-xl border border-slate-200 w-64 flex flex-col items-center print:bg-white">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                      Menyetujui & Menetapkan
                    </div>
                    <div className="text-[9px] text-slate-400 mb-2">
                      {currentTenant.name}
                    </div>

                    {/* QR TTD Pegawai */}
                    <div className="my-1.5 flex flex-col items-center">
                      <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
                        <QRCodeView
                          value={JSON.stringify({
                            type: 'INDIVIDUAL_DIGITAL_SIGNATURE',
                            signerName: signeeName,
                            signerRole: signeeRole,
                            docNumber: documentNumber,
                            date,
                            status: 'TEROTENTIKASI_DIGITAL',
                          })}
                          size={64}
                          showBorder={false}
                        />
                      </div>
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[8px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        <span>TEROTENTIKASI DIGITAL</span>
                      </div>
                    </div>

                    <div className="w-full pt-1.5 border-t border-slate-200/60 mt-1">
                      <div className="text-xs font-bold text-slate-900 underline underline-offset-2">
                        {signeeName}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {signeeRole}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Khusus Validasi Keaslian & Integritas Dokumen (Document Authenticity QR) */}
              <div className="mt-6 p-3 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3.5 print:bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs shrink-0">
                    <QRCodeView value={qrData} size={64} showBorder={false} />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>QR VALIDASI KEASLIAN DOKUMEN RESMI</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Pindai QR ini untuk memvalidasi keabsahan dokumen, riwayat persetujuan, dan integritas hash pada sistem NusaHR Enterprise.
                    </p>
                    <div className="text-[9px] font-mono text-slate-400">
                      ID Dokumen: <span className="text-indigo-700 font-bold">{documentNumber}</span> · Ditetapkan di {currentTenant.city}, {date}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 hidden sm:block border-l border-slate-200 pl-4">
                  <div className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{currentTenant.name}</div>
                  <div className="text-[9px] text-slate-400">Dokumen Digital Terakreditasi</div>
                  <div className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Dokumen Sah & Terdaftar</span>
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

      {/* MODAL KONFIRMASI PENGIRIMAN WHATSAPP */}
      {isWaModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsWaModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden p-5 space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Kirim ke WhatsApp</h4>
                  <p className="text-[11px] text-slate-500">Pesan resmi & nomor surat sah</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700 block">Nomor WhatsApp Penerima:</label>
              <input
                type="text"
                value={waPhoneNumber}
                onChange={(e) => setWaPhoneNumber(e.target.value)}
                placeholder="Contoh: 08129876543 atau 628129876543"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Penerima: <strong>{partyName || 'Karyawan'}</strong> ({partyRole || '-'})
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1 font-mono">
              <div className="font-bold text-slate-800 font-sans">Naskah Resmi:</div>
              <div className="truncate text-emerald-800 font-bold">{title}</div>
              <div className="text-[10px] text-slate-500 truncate">{documentNumber}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsWaModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteSendWhatsApp}
                className="px-4 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                <span>Buka WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

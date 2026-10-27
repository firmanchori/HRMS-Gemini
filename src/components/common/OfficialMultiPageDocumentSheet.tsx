import React, { useRef, useState } from 'react';
import { Download, FileText, Printer, CheckCircle2, QrCode, ShieldCheck, Loader2, X } from 'lucide-react';
import { QRCodeView } from './QRCodeView';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Tenant, Employee } from '../../types/hrms';
import {
  splitDocumentIntoPages,
  exportPagesToPdf,
  printPagesDirectly,
  exportDocumentToRealDocx,
  generateRealQrDataUrl,
} from '../../utils/documentPdfExporter';
import { openWhatsAppChat } from '../../utils/whatsappHelper';

export interface DocumentSignatory {
  id?: string;
  label: string; // e.g. 'Pihak Pertama', 'Pihak Kedua', 'Dibuat Oleh', 'Mengetahui', 'Menyetujui', 'Disetujui Oleh'
  employeeId?: string;
  nik?: string;
  name: string;
  role?: string;
  isExternal?: boolean;
  externalOrg?: string;
  date?: string;
}

interface OfficialMultiPageDocumentSheetProps {
  title: string;
  documentNumber: string;
  content: string;
  tenant: Tenant;
  employee: Employee;
  signeeName: string;
  signeeRole: string;
  issueDate?: string;
  footerText?: string;
  showLetterhead?: boolean;
  showQrSignature?: boolean;
  showQrValidation?: boolean;
  highlightTags?: boolean;
  onSuccessNotice?: (title: string, desc: string) => void;
  // Pengaturan Kertas (A4, F4, atau A5)
  paperSize?: 'A4' | 'F4' | 'A5';
  // Pengaturan Kop Surat (Header)
  letterheadCompanyName?: string;
  letterheadAddress?: string;
  letterheadPhone?: string;
  letterheadEmail?: string;
  letterheadNpwp?: string;
  letterheadStyle?: 'double' | 'bold' | 'single' | 'none';
  letterheadAlign?: 'left' | 'center' | 'right';
  letterheadLogoAlign?: 'left' | 'center' | 'right';
  letterheadMode?: 'structured' | 'freetext';
  letterheadFreeText?: string;
  letterheadCustomLogoUrl?: string;
  runningHeaderText?: string;
  // Pengaturan Footer & Keabsahan
  pageNumberFormat?: 'standard' | 'simple' | 'slash' | 'none';
  footerAlign?: 'split' | 'center' | 'right';
  showFooterBorder?: boolean;
  qrValidationPlacement?: 'all_pages' | 'last_page';
  // Simulasi Tanda Tangan Fleksibel
  signatories?: DocumentSignatory[];
  // Editor WYSIWYG Langsung di Naskah Preview (MS Word Style)
  isEditable?: boolean;
  onContentChange?: (contentHtml: string) => void;
  editorRef?: React.RefObject<HTMLDivElement | null>;
}

const parseDocumentContentToHtml = (content: string, highlightTags: boolean = false): string => {
  if (!content) return '';

  let html = content;

  // Highlight {{tags}} if enabled
  if (highlightTags) {
    html = html.replace(
      /\{\{([a-zA-Z0-9_-]+)\}\}/g,
      '<mark class="bg-amber-200 text-amber-900 px-1 py-0.5 rounded font-mono font-bold text-[10.5px] border border-amber-300">{{$1}}</mark>'
    );
  }

  // Convert basic markdown
  // **bold**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  // *italic*
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<i>$1</i>');

  // Convert custom alignment tags if user prefers BBCode style or HTML
  html = html.replace(/\[align=(left|center|right|justify)\]([\s\S]*?)\[\/align\]/gi, (_match, align, inner) => {
    return `<div style="text-align: ${align};">${inner}</div>`;
  });

  // Preserve linebreaks outside of div/p/h1-h6/hr tags
  html = html.replace(/([^>\r\n])\n/g, '$1<br/>');

  // Clean up any extraneous <br/> tags around table elements
  html = html.replace(/<br\s*\/?>\s*(<\/?(table|thead|tbody|tr|th|td))/gi, '$1');
  html = html.replace(/(<\/?(table|thead|tbody|tr|th|td)[^>]*>)\s*<br\s*\/?>/gi, '$1');

  return html;
};

export const OfficialMultiPageDocumentSheet: React.FC<OfficialMultiPageDocumentSheetProps> = ({
  title,
  documentNumber,
  content,
  tenant,
  employee,
  signeeName,
  signeeRole,
  issueDate,
  footerText,
  showLetterhead = true,
  showQrSignature = true,
  showQrValidation = true,
  highlightTags = false,
  onSuccessNotice,
  paperSize = 'A4',
  letterheadCompanyName,
  letterheadAddress,
  letterheadPhone,
  letterheadEmail,
  letterheadNpwp,
  letterheadStyle = 'double',
  letterheadAlign = 'left',
  letterheadLogoAlign = 'left',
  letterheadMode = 'structured',
  letterheadFreeText = '',
  letterheadCustomLogoUrl,
  runningHeaderText,
  pageNumberFormat = 'standard',
  footerAlign = 'split',
  showFooterBorder = true,
  qrValidationPlacement = 'all_pages',
  signatories,
  isEditable = false,
  onContentChange,
  editorRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waPhoneNumber, setWaPhoneNumber] = useState(employee?.phone || '08129876543');

  const pages = splitDocumentIntoPages(content);
  const totalPages = pages.length;

  const todayFormatted = issueDate || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isF4 = paperSize === 'F4';
  const isA5 = paperSize === 'A5';
  const sheetWidth = isA5 ? '148mm' : isF4 ? '215mm' : '210mm';
  const sheetMinHeight = isA5 ? '210mm' : isF4 ? '330mm' : '297mm';
  const sheetPadding = isA5 ? '14mm 12mm 14mm 12mm' : isF4 ? '25mm 20mm 25mm 25mm' : '20mm 20mm 20mm 20mm';

  // Nilai Efektif Kop Surat & Identitas Perusahaan
  // Jika string kosong atau hanya spasi, jangan tampilkan nilai / labelnya
  const effectiveCompanyName = (letterheadCompanyName !== undefined ? letterheadCompanyName : tenant?.name || 'PT Nusantara Teknologi Mandiri')?.trim();
  const effectiveAddress = (letterheadAddress !== undefined ? letterheadAddress : tenant?.address || '')?.trim();
  const effectivePhone = (letterheadPhone !== undefined ? letterheadPhone : '')?.trim();
  const effectiveEmail = (letterheadEmail !== undefined ? letterheadEmail : '')?.trim();
  const effectiveNpwp = (letterheadNpwp !== undefined ? letterheadNpwp : (tenant?.npwp || ''))?.trim();
  const effectiveLogoUrl = letterheadCustomLogoUrl || tenant?.documentLogoUrl;

  // Bangun baris kontak dinamis tanpa label kosong
  const contactParts: string[] = [];
  if (effectivePhone) contactParts.push(`Telp: ${effectivePhone}`);
  if (effectiveEmail) contactParts.push(`Email: ${effectiveEmail}`);
  if (effectiveNpwp) contactParts.push(`NPWP: ${effectiveNpwp}`);
  const effectiveContactLine = contactParts.join(' · ');

  // URL verifikasi QR asli
  const signeeAuthUrl = `https://nusantara.id/verify/signee?doc=${encodeURIComponent(documentNumber || '')}&signer=${encodeURIComponent(signeeName || '')}`;
  const employeeAuthUrl = `https://nusantara.id/verify/employee?doc=${encodeURIComponent(documentNumber || '')}&nik=${encodeURIComponent(employee?.nik || 'NIK')}&name=${encodeURIComponent(employee?.fullName || 'Karyawan')}`;
  const docVerifyUrl = `https://nusantara.id/verify/doc/${encodeURIComponent(documentNumber || '')}?status=verified_ite`;

  // Handler Download PDF Murni dengan Library jsPDF + html2canvas
  const handleDownloadRealPdf = async () => {
    if (!containerRef.current) return;

    try {
      setIsExportingPdf(true);
      const pageElements = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>('[data-page-sheet="true"]')
      );

      if (pageElements.length === 0) {
        alert('Tidak ada lembar halaman dokumen yang ditemukan.');
        return;
      }

      const safeFilename = `${documentNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_${title.slice(0, 30).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      await exportPagesToPdf(
        pageElements,
        safeFilename,
        (statusText) => {
          setExportProgressText(statusText);
        },
        paperSize
      );

      onSuccessNotice?.(
        'PDF Dokumen Resmi Berhasil Diunduh',
        `Berkas "${safeFilename}" (${totalPages} halaman ${paperSize}) telah digenerate dengan resolusi tinggi.`
      );
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert(`Gagal men-generate PDF: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsExportingPdf(false);
      setExportProgressText('');
    }
  };

  // Handler Download DOCX Murni
  const handleDownloadRealDocx = async () => {
    try {
      const qrDataUrl = await generateRealQrDataUrl(docVerifyUrl, { size: 160 });

      exportDocumentToRealDocx({
        title,
        documentNumber,
        pages,
        tenant,
        employee,
        signeeName,
        signeeRole,
        qrDataUrl,
        issueDate: todayFormatted,
        footerText,
      });

      onSuccessNotice?.(
        'Dokumen Word (.doc/.docx) Berhasil Diunduh',
        `Berkas dokumen Microsoft Word terformat multi-halaman siap diedit secara offline.`
      );
    } catch (err: any) {
      console.error('Error exporting Word:', err);
      alert('Gagal mengekspor dokumen Word.');
    }
  };

  // Handler Cetak Bersih Dokumen PDF Asli (Bukan window.print layar browser)
  const handleDirectPrintDoc = async () => {
    if (!containerRef.current) return;
    try {
      setIsExportingPdf(true);
      const pageElements = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>('[data-page-sheet="true"]')
      );
      if (pageElements.length === 0) {
        alert('Tidak ada lembar halaman dokumen yang ditemukan untuk dicetak.');
        return;
      }
      await printPagesDirectly(
        pageElements,
        (statusText) => {
          setExportProgressText(statusText);
        },
        paperSize
      );
    } catch (err: any) {
      console.error('Error printing document:', err);
      alert(`Gagal mencetak dokumen: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsExportingPdf(false);
      setExportProgressText('');
    }
  };

  // Handler Kirim Pesan & Tautan Dokumen Resmi via WhatsApp
  const handleSendWhatsApp = () => {
    const empName = employee?.fullName || 'Karyawan';
    const empNik = employee?.nik || '-';
    const message = `*PEMBERITAHUAN DOKUMEN RESMI - ${(tenant?.name || 'PERUSAHAAN').toUpperCase()}*

Yth. *${empName}* (NIK: ${empNik}),
Berikut kami sampaikan dokumen resmi Anda yang telah diterbitkan dan tersertifikasi digital:

📄 *Jenis Dokumen:* ${title}
🔖 *Nomor Surat:* ${documentNumber}
📅 *Tanggal Terbit:* ${todayFormatted}
✍️ *Penandatangan:* ${signeeName} (${signeeRole})

🔍 *Tautan Verifikasi Keabsahan UU ITE:*
${docVerifyUrl}

Dokumen ini memiliki kekuatan hukum sah dan mengikat menurut UU ITE Republik Indonesia.

Terima kasih,
*Human Capital & Legal Directorate*
${tenant?.name || 'Perusahaan'}`;

    openWhatsAppChat(waPhoneNumber, message);
    setIsWaModalOpen(false);
    onSuccessNotice?.(
      'Dokumen Terkirim ke WhatsApp',
      `Tautan verifikasi dan naskah resmi diteruskan ke WhatsApp ${empName} (${waPhoneNumber}).`
    );
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Floating Action Bar */}
      <div
        style={{ maxWidth: sheetWidth }}
        className="w-full bg-white border border-slate-300 rounded-xl p-3 mb-5 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs no-print"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
            {totalPages}
          </div>
          <div>
            <div className="font-bold text-slate-900">
              Dokumen Resmi Multi-Halaman: {totalPages} Lembar {paperSize}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Dimensi Baku: {isF4 ? '215mm × 330mm (F4 / Folio)' : '210mm × 297mm (A4)'} · Margin: 25mm (2.5 cm)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Download PDF Asli */}
          <button
            type="button"
            disabled={isExportingPdf}
            onClick={handleDownloadRealPdf}
            className="p-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title={`Download PDF resmi multi-halaman ${paperSize} resolusi tinggi 300 DPI`}
            aria-label="Download PDF"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>

          {/* Cetak Fisik Dokumen Murni (Bukan window.print layar) */}
          <button
            type="button"
            disabled={isExportingPdf}
            onClick={handleDirectPrintDoc}
            className="p-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg transition-colors cursor-pointer shadow-xs border border-slate-800 flex items-center justify-center shrink-0"
            title={`Cetak lembar naskah dokumen ${paperSize} resmi ke printer fisik`}
            aria-label="Cetak Dokumen"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Kirim WhatsApp */}
          <button
            type="button"
            onClick={() => setIsWaModalOpen(true)}
            className="p-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title="Kirim pesan resmi dan tautan dokumen ini ke nomor WhatsApp karyawan"
            aria-label="Kirim WhatsApp"
          >
            <WhatsAppIcon className="w-4 h-4" />
          </button>

          {/* Download DOCX Asli */}
          <button
            type="button"
            onClick={handleDownloadRealDocx}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-blue-600 rounded-lg border border-slate-300 transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title="Download file Microsoft Word (.docx/.doc) dengan tabel dan QR Code tertanam"
            aria-label="Download Word"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workspace Pages Canvas */}
      <div ref={containerRef} className="w-full flex flex-col items-center gap-8 print:gap-0">
        {pages.map((pageContent, idx) => {
          const isFirstPage = idx === 0;
          const isLastPage = idx === pages.length - 1;
          const pageNum = idx + 1;

          return (
            <div key={`page-${pageNum}`} className="flex flex-col items-center">
              {/* Page Number Label on Screen Canvas */}
              <div
                style={{ maxWidth: sheetWidth }}
                className="w-full flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2 px-2 no-print"
              >
                <span>Lembar Kertas {paperSize} Fisik ({isF4 ? '215mm × 330mm' : '210mm × 297mm'})</span>
                <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                  Halaman {pageNum} dari {totalPages}
                </span>
              </div>

              {/* Physical Sheet Container (A4 atau F4) */}
              <div
                data-page-sheet="true"
                data-page-index={idx}
                className="bg-white text-slate-900 border border-slate-300 shadow-2xl rounded-xs flex flex-col justify-between font-serif relative overflow-hidden select-text print:shadow-none print:border-none print:m-0 print:rounded-none"
                style={{
                  width: sheetWidth,
                  minHeight: sheetMinHeight,
                  height: 'auto',
                  padding: sheetPadding,
                  boxSizing: 'border-box',
                  pageBreakAfter: idx < totalPages - 1 ? 'always' : 'auto',
                }}
              >
                {/* Bagian Atas Lembar */}
                <div className="space-y-4">
                  {/* Halaman 1: Kop Surat Resmi Perusahaan */}
                  {isFirstPage ? (
                    showLetterhead && (
                      <div
                        className={`pb-3 font-sans ${
                          letterheadStyle === 'double'
                            ? 'border-b-4 border-double border-slate-900'
                            : letterheadStyle === 'bold'
                            ? 'border-b-2 border-slate-900'
                            : letterheadStyle === 'single'
                            ? 'border-b border-slate-400'
                            : ''
                        }`}
                      >
                        {/* KOP SURAT BERBASIS PENGATURAN TERPISAH: PERATAAN TEKS (letterheadAlign) & POSISI LOGO (letterheadLogoAlign) */}
                        {(() => {
                          const logoNode = (
                            effectiveLogoUrl ? (
                              <img
                                src={effectiveLogoUrl}
                                alt={effectiveCompanyName || 'Logo'}
                                className="w-14 h-14 rounded object-contain border border-slate-200 p-0.5 bg-white shrink-0 shadow-2xs"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded bg-indigo-700 text-white flex items-center justify-center font-bold text-2xl shadow-xs shrink-0">
                                {tenant.logoText || 'N'}
                              </div>
                            )
                          );

                          const textNode = (
                            letterheadMode === 'freetext' && letterheadFreeText ? (
                              <div className={`text-[11px] text-slate-800 leading-snug whitespace-pre-line ${
                                letterheadAlign === 'center' ? 'text-center' : letterheadAlign === 'right' ? 'text-right' : 'text-left'
                              }`}>
                                {letterheadFreeText}
                              </div>
                            ) : (
                              <div className={
                                letterheadAlign === 'center' ? 'text-center' : letterheadAlign === 'right' ? 'text-right' : 'text-left'
                              }>
                                {effectiveCompanyName && (
                                  <h1 className="text-base font-extrabold text-slate-900 uppercase tracking-wider leading-tight">
                                    {effectiveCompanyName}
                                  </h1>
                                )}
                                {effectiveAddress && (
                                  <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                                    {effectiveAddress}
                                  </p>
                                )}
                                {effectiveContactLine && (
                                  <p className="text-[9.5px] text-slate-500 font-mono mt-0.5">
                                    {effectiveContactLine}
                                  </p>
                                )}
                              </div>
                            )
                          );

                          // KASUS 1: LOGO DI TENGAH (Logo di atas di tengah, teks di bawahnya)
                          if (letterheadLogoAlign === 'center') {
                            return (
                              <div className="flex flex-col items-center text-center gap-2">
                                {logoNode}
                                <div className={`w-full ${
                                  letterheadAlign === 'center' ? 'text-center' : letterheadAlign === 'right' ? 'text-right' : 'text-left'
                                }`}>
                                  {textNode}
                                </div>
                              </div>
                            );
                          }

                          // KASUS 2: LOGO DI KANAN
                          if (letterheadLogoAlign === 'right') {
                            if (letterheadAlign === 'center') {
                              return (
                                <div className="grid grid-cols-[56px_1fr_56px] items-center gap-4">
                                  <div className="w-14 shrink-0" aria-hidden="true" />
                                  <div className="text-center min-w-0">{textNode}</div>
                                  <div className="flex justify-end shrink-0">{logoNode}</div>
                                </div>
                              );
                            }
                            if (letterheadAlign === 'left') {
                              return (
                                <div className="flex items-center justify-between gap-4 text-left">
                                  <div className="flex-1 min-w-0 text-left">{textNode}</div>
                                  <div className="shrink-0">{logoNode}</div>
                                </div>
                              );
                            }
                            // letterheadAlign === 'right'
                            return (
                              <div className="flex items-center justify-end gap-3.5 text-right">
                                <div className="flex-1 min-w-0 text-right">{textNode}</div>
                                <div className="shrink-0">{logoNode}</div>
                              </div>
                            );
                          }

                          // KASUS 3: LOGO DI KIRI (Default)
                          if (letterheadAlign === 'center') {
                            // Format resmi standar: Logo di tepi kiri, teks simetris di tengah
                            return (
                              <div className="grid grid-cols-[56px_1fr_56px] items-center gap-4">
                                <div className="flex justify-start shrink-0">{logoNode}</div>
                                <div className="text-center min-w-0">{textNode}</div>
                                <div className="w-14 shrink-0" aria-hidden="true" />
                              </div>
                            );
                          }
                          if (letterheadAlign === 'right') {
                            return (
                              <div className="flex items-center justify-between gap-4 text-right">
                                <div className="shrink-0">{logoNode}</div>
                                <div className="flex-1 min-w-0 text-right">{textNode}</div>
                              </div>
                            );
                          }
                          // letterheadAlign === 'left'
                          return (
                            <div className="flex items-center gap-3.5 text-left">
                              <div className="shrink-0">{logoNode}</div>
                              <div className="flex-1 min-w-0 text-left">{textNode}</div>
                            </div>
                          );
                        })()}
                      </div>
                    )
                  ) : (
                    /* Halaman Lanjutan: Running Header Naskah Dinas */
                    <div className="border-b border-slate-300 pb-2 flex items-center justify-between text-[10px] font-sans text-slate-500">
                      <span className="font-semibold text-slate-700 uppercase tracking-tight truncate max-w-sm">
                        {runningHeaderText || title}
                      </span>
                      <span className="font-mono font-bold text-indigo-700">
                        No: {documentNumber}
                      </span>
                    </div>
                  )}

                  {/* Judul & Nomor Dokumen di Halaman 1 */}
                  {isFirstPage && (
                    <div className="text-center space-y-1 pt-2">
                      <div className="font-bold text-sm tracking-wide text-slate-900 uppercase underline">
                        {title}
                      </div>
                      <div className="font-sans text-xs font-bold text-indigo-700 tracking-tight">
                        Nomor: {documentNumber}
                      </div>
                    </div>
                  )}

                  {/* Isi Naskah Halaman Ini (Mendukung Rich-Text Formatting HTML, Visual Table, & Token Drag-n-Drop) */}
                  {isEditable ? (
                    <div
                      ref={idx === 0 ? (editorRef as any) : undefined}
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onInput={(e) => {
                        if (totalPages <= 1) {
                          onContentChange?.(e.currentTarget.innerHTML);
                        } else {
                          const updated = [...pages];
                          updated[idx] = e.currentTarget.innerHTML;
                          onContentChange?.(updated.join('\n\n[PAGE_BREAK]\n\n'));
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const token = e.dataTransfer.getData('application/token') || e.dataTransfer.getData('text/plain');
                        if (token) {
                          const textToInsert = token.startsWith('{{') ? token : `{{${token}}}`;
                          if (document.caretRangeFromPoint) {
                            const range = document.caretRangeFromPoint(e.clientX, e.clientY);
                            if (range) {
                              const sel = window.getSelection();
                              sel?.removeAllRanges();
                              sel?.addRange(range);
                            }
                          } else if ((document as any).caretPositionFromPoint) {
                            const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
                            if (pos) {
                              const range = document.createRange();
                              range.setStart(pos.offsetNode, pos.offset);
                              range.collapse(true);
                              const sel = window.getSelection();
                              sel?.removeAllRanges();
                              sel?.addRange(range);
                            }
                          }
                          document.execCommand('insertText', false, textToInsert);
                          if (totalPages <= 1) {
                            onContentChange?.(e.currentTarget.innerHTML);
                          } else {
                            const updated = [...pages];
                            updated[idx] = e.currentTarget.innerHTML;
                            onContentChange?.(updated.join('\n\n[PAGE_BREAK]\n\n'));
                          }
                        }
                      }}
                      className="text-[11.5px] leading-relaxed text-slate-800 py-2 document-sheet-body outline-none focus:ring-2 focus:ring-indigo-400/40 p-2.5 min-h-[420px] cursor-text rounded-lg border border-dashed border-indigo-200 bg-white shadow-2xs hover:border-indigo-400 transition-colors"
                      style={{ wordBreak: 'break-word' }}
                      dangerouslySetInnerHTML={{ __html: parseDocumentContentToHtml(pageContent, highlightTags) }}
                    />
                  ) : (
                    <div
                      className={`text-[11.5px] leading-relaxed text-slate-800 py-2 document-sheet-body ${
                        highlightTags ? 'selection:bg-amber-200' : ''
                      }`}
                      style={{ wordBreak: 'break-word' }}
                      dangerouslySetInnerHTML={{ __html: parseDocumentContentToHtml(pageContent, highlightTags) }}
                    />
                  )}
                </div>

                {/* Bagian Bawah Lembar: Kolom TTD di Halaman Terakhir atau Running Footer */}
                <div className="pt-6 font-sans space-y-3">
                  {isLastPage && (
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      {/* Tanggal & Judul Pengesahan */}
                      <div className="text-center text-[10.5px] text-slate-600 italic mb-2">
                        Demikian surat ketetapan ini dibuat untuk dipergunakan sebagaimana mestinya dengan penuh tanggung jawab.
                      </div>

                      {/* KOLOM TANDA TANGAN (Simulasi TTD Fleksibel / Personalia Concept) */}
                      {signatories && signatories.length > 0 ? (
                        <div
                          className={`grid gap-4 items-start ${
                            signatories.length === 1
                              ? 'grid-cols-1 max-w-xs mx-auto'
                              : signatories.length === 2
                              ? 'grid-cols-2'
                              : signatories.length === 3
                              ? 'grid-cols-3'
                              : 'grid-cols-2 sm:grid-cols-4'
                          }`}
                        >
                          {signatories.map((sig, sIdx) => {
                            const authUrl = `https://nusantara.id/verify/signatory?doc=${encodeURIComponent(documentNumber || '')}&signer=${encodeURIComponent(sig.name || '')}&role=${encodeURIComponent(sig.role || '')}`;
                            return (
                              <div key={sig.id || sIdx} className="text-center flex flex-col items-center">
                                <div className="text-[9.5px] text-slate-500 font-semibold mb-0.5">
                                  {sig.label || `Pihak ${sIdx + 1}`}
                                </div>
                                <div className="text-[10px] font-bold text-slate-900 mb-1 line-clamp-1">
                                  {sig.role || 'Pejabat Penandatangan'}
                                </div>

                                {showQrSignature ? (
                                  <div className="my-1 flex flex-col items-center">
                                    <QRCodeView value={authUrl} size={56} showBorder={false} />
                                    <span className="text-[7.5px] font-mono font-bold text-emerald-700 uppercase tracking-widest mt-1">
                                      [QR Terotentikasi]
                                    </span>
                                  </div>
                                ) : (
                                  <div className="h-14 flex items-center justify-center text-slate-300 text-[10px] italic">
                                    (Tanda Tangan & Cap)
                                  </div>
                                )}

                                <div className="text-[11px] font-bold text-slate-900 underline mt-1">
                                  {sig.name || 'Nama Pejabat'}
                                </div>
                                <div className="text-[8.5px] text-slate-500 font-mono mt-0.5">
                                  {sig.isExternal ? (
                                    <span className="text-amber-700 font-bold">[Pihak Eksternal]</span>
                                  ) : sig.nik ? (
                                    `NIK: ${sig.nik}`
                                  ) : (
                                    effectiveCompanyName || 'Perusahaan'
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Fallback 2 Kolom Standar */
                        <div className="grid grid-cols-2 gap-6 items-start">
                          {/* Pihak Pertama: Perusahaan */}
                          <div className="text-center flex flex-col items-center">
                            <div className="text-[10px] text-slate-400 mb-0.5">Pihak Pertama (Manajemen):</div>
                            <div className="text-[11px] font-bold text-slate-900 mb-1.5">{signeeRole}</div>

                            {showQrSignature ? (
                              <div className="my-1 flex flex-col items-center">
                                <QRCodeView value={signeeAuthUrl} size={64} showBorder={false} />
                                <span className="text-[8px] font-mono font-bold text-emerald-700 uppercase tracking-widest mt-1">
                                  [QR Terotentikasi Digital]
                                </span>
                              </div>
                            ) : (
                              <div className="h-16 flex items-center justify-center text-slate-300 text-[10px] italic">
                                (Tanda Tangan Basah & Cap)
                              </div>
                            )}

                            <div className="text-xs font-bold text-slate-900 underline mt-1">
                              {signeeName}
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono">
                              ID: SIGN-MGT-{tenant.code || 'NTM'}
                            </div>
                          </div>

                          {/* Pihak Kedua: Karyawan yang Bersangkutan */}
                          <div className="text-center flex flex-col items-center">
                            <div className="text-[10px] text-slate-400 mb-0.5">Jakarta, {todayFormatted}</div>
                            <div className="text-[11px] font-bold text-slate-900 mb-1.5">Pihak Kedua (Karyawan):</div>

                            {showQrSignature ? (
                              <div className="my-1 flex flex-col items-center">
                                <QRCodeView value={employeeAuthUrl} size={64} showBorder={false} />
                                <span className="text-[8px] font-mono font-bold text-indigo-700 uppercase tracking-widest mt-1">
                                  [QR Digital Karyawan]
                                </span>
                              </div>
                            ) : (
                              <div className="h-16 flex items-center justify-center text-slate-300 text-[10px] italic">
                                (Tanda Tangan Karyawan)
                              </div>
                            )}

                            <div className="text-xs font-bold text-slate-900 underline mt-1">
                              {employee?.fullName || 'Karyawan Bersangkutan'}
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono">
                              NIK: {employee?.nik || '-'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEMPEL SERTIFIKASI KEABSAHAN UU ITE DI FOOTER (Semua Halaman atau Halaman Terakhir Saja) */}
                  {showQrValidation && (qrValidationPlacement === 'all_pages' || isLastPage) && (
                    <div className="pt-2">
                      <div className="p-2 bg-slate-50/90 rounded border border-slate-200/90 flex items-center gap-2.5">
                        <QRCodeView value={docVerifyUrl} size={36} showBorder={false} />
                        <div className="text-[8.5px] text-slate-500 leading-snug text-left">
                          <strong className="text-slate-800 font-bold block flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>SERTIFIKASI KEABSAHAN ELEKTRONIK (UU ITE NO. 11/2008 & PP 71/2019)</span>
                          </strong>
                          Dokumen elektronik ini sah, memiliki kekuatan hukum pembuktian resmi, dan keasliannya dapat divalidasi dengan memindai kode QR verifikasi melalui kamera perangkat bergerak.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Running Footer Nomor Halaman Resmi di Setiap Halaman */}
                  <div
                    className={`${showFooterBorder ? 'border-t border-slate-200' : ''} pt-2 flex items-center ${
                      footerAlign === 'center'
                        ? 'justify-center text-center gap-4'
                        : footerAlign === 'right'
                        ? 'justify-end text-right'
                        : 'justify-between'
                    } text-[9px] text-slate-400`}
                  >
                    {footerAlign !== 'right' && (
                      <span className="truncate max-w-[120mm]">
                        {footerText || `${effectiveCompanyName} · Dokumen Resmi Terotentikasi Sistem HR`}
                      </span>
                    )}
                    {pageNumberFormat !== 'none' && (
                      <span className="font-mono font-bold text-slate-600 shrink-0">
                        {pageNumberFormat === 'slash'
                          ? `${pageNum} / ${totalPages}`
                          : pageNumberFormat === 'simple'
                          ? `Hal. ${pageNum}`
                          : `Halaman ${pageNum} dari ${totalPages}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL KONFIRMASI PENGIRIMAN WHATSAPP */}
      {isWaModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 no-print"
          onClick={() => setIsWaModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Kirim ke WhatsApp</h4>
                  <p className="text-[11px] text-slate-500">Pesan resmi & tautan verifikasi</p>
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
                Penerima: <strong>{employee?.fullName || 'Karyawan'}</strong> ({employee?.nik || '-'} - {employee?.position || 'Staff'})
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
                onClick={handleSendWhatsApp}
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

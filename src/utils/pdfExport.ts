import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  fileName?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Exports an HTML element directly to high-quality PDF binary and downloads it.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<void> {
  const { fileName = 'dokumen_nusahr.pdf', orientation = 'portrait' } = options;

  try {
    // Render the element with html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution (Retina)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate ratio to fit A4
    const ratio = Math.min(pdfWidth / (canvasWidth / 2.83465), pdfHeight / (canvasHeight / 2.83465));
    const renderWidth = (canvasWidth / 2.83465) * ratio;
    const renderHeight = (canvasHeight / 2.83465) * ratio;
    const xOffset = (pdfWidth - renderWidth) / 2;
    const yOffset = 10;

    pdf.addImage(imgData, 'PNG', Math.max(0, xOffset), yOffset, renderWidth, renderHeight);
    pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  } catch (err) {
    console.error('Gagal mengekspor PDF secara otomatis:', err);
    throw err;
  }
}

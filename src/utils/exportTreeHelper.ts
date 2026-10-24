import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Capture an element as a high-resolution PNG image and trigger browser download
 */
export async function exportElementToPng(element: HTMLElement, fileName: string = 'diagram.png'): Promise<boolean> {
  try {
    // Clone or preserve background
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#f8fafc', // Clean slate-50 background
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imgData;
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Failed to export element as PNG:', error);
    return false;
  }
}

/**
 * Capture an element and export as a multi-page or landscape PDF
 */
export async function exportElementToPdf(element: HTMLElement, fileName: string = 'diagram.pdf'): Promise<boolean> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#f8fafc',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Landscape orientation if width > height
    const orientation = imgWidth > imgHeight ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [imgWidth, imgHeight],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
    return true;
  } catch (error) {
    console.error('Failed to export element as PDF:', error);
    return false;
  }
}

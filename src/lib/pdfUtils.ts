/**
 * Secure PDF generation utilities
 * Replaces html2pdf.js (which has critical vulnerabilities) with browser-native PDF generation
 */

/**
 * HTML escape utility to prevent XSS in generated HTML
 */
export const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
};

/**
 * Opens a new window with the HTML content and triggers the print dialog
 * which can be used to save as PDF via the browser's native PDF print functionality
 */
export const printToPdf = (htmlContent: string, filename?: string): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error("Please allow popups to print/download the report");
  }

  // Add print-specific styling and auto-trigger print
  const enhancedHtml = htmlContent.replace(
    '</head>',
    `<style>
      @media print {
        @page { margin: 10mm; }
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      }
    </style>
    ${filename ? `<title>${escapeHtml(filename)}</title>` : ''}
    </head>`
  );

  printWindow.document.write(enhancedHtml);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.print();
  };
};

/**
 * Creates and downloads a Blob as a file
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Generates a PDF by opening a print dialog
 * This uses the browser's native "Save as PDF" capability
 * which is more secure than html2pdf.js
 */
export const generatePdfFromHtml = async (
  htmlContent: string,
  filename: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      printToPdf(htmlContent, filename);
      // Since we can't detect when the print dialog closes,
      // we resolve immediately after opening
      setTimeout(resolve, 500);
    } catch (error) {
      reject(error);
    }
  });
};

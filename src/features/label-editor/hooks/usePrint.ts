/**
 * Print hook for the Label Editor
 * Handles printing labels and test papers with exact scale
 */

import { useCallback, useState } from 'react';
import { LabelElement, LabelSize, PrintSettings, SampleData } from '../types';
import { mmToPx } from '../utils/unitConversion';

interface UsePrintOptions {
  elements: LabelElement[];
  labelSize: LabelSize;
  sampleData?: SampleData | null;
}

interface UsePrintReturn {
  printLabel: () => void;
  printTestPaper: (settings?: Partial<PrintSettings>) => void;
  generatePrintHTML: (isTestPaper?: boolean, settings?: Partial<PrintSettings>) => string;
  isPrinting: boolean;
  printError: string | null;
}

export const usePrint = ({ elements, labelSize, sampleData }: UsePrintOptions): UsePrintReturn => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  // Replace variables in element content with actual data
  const replaceVariables = useCallback((content: string): string => {
    if (!sampleData) return content;

    return content
      .replace(/\{\{ArabicName\}\}/g, sampleData.ArabicName || '')
      .replace(/\{\{EnglishName\}\}/g, sampleData.EnglishName || '')
      .replace(/\{\{SupplierCode\}\}/g, sampleData.SupplierCode || '')
      .replace(/\{\{Price25\}\}/g, `$${sampleData.Price25 || '0.00'}`)
      .replace(/\{\{Price50\}\}/g, `$${sampleData.Price50 || '0.00'}`)
      .replace(/\{\{Price100\}\}/g, `$${sampleData.Price100 || '0.00'}`)
      .replace(/\{\{QRValue\}\}/g, sampleData.QRValue || '')
      .replace(/\{\{BarcodeValue\}\}/g, sampleData.BarcodeValue || '')
      .replace(/\{\{CurrentDate\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{CurrentTime\}\}/g, new Date().toLocaleTimeString())
      .replace(/\{\{CreatedDate\}\}/g, sampleData.CreatedDate || new Date().toLocaleDateString())
      .replace(/\{\{ExpiryDate\}\}/g, sampleData.ExpiryDate || '')
      .replace(/\{\{SampleId\}\}/g, sampleData.id || '')
      .replace(/\{\{BatchNumber\}\}/g, sampleData.BatchNumber || '');
  }, [sampleData]);

  // Generate CSS for exact scale printing
  const generatePrintCSS = useCallback((isTestPaper: boolean = false, settings?: Partial<PrintSettings>) => {
    const printSettings: PrintSettings = {
      paperSize: 'A4',
      orientation: 'portrait',
      margin: 0,
      ...settings,
    };

    let pageSize = '';
    if (printSettings.paperSize === 'A4') {
      pageSize = '210mm 297mm';
    } else if (printSettings.paperSize === 'A3') {
      pageSize = '297mm 420mm';
    } else if (printSettings.paperSize === 'Letter') {
      pageSize = '8.5in 11in';
    } else if (printSettings.customSize) {
      pageSize = `${printSettings.customSize.width}mm ${printSettings.customSize.height}mm`;
    }

    return `
      @page {
        size: ${pageSize};
        margin: ${printSettings.margin}mm;
        orientation: ${printSettings.orientation};
      }
      
      @media print {
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }
        
        .print-container {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .label-container {
          width: ${labelSize.width}mm;
          height: ${labelSize.height}mm;
          position: relative;
          border: ${isTestPaper ? '2px dashed #000' : 'none'};
          background: white;
          page-break-after: always;
          transform: scale(1);
          transform-origin: top left;
        }
        
        .test-paper-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        
        .test-paper-grid::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #000;
        }
        
        .test-paper-grid::after {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          bottom: 0;
          width: 1px;
          background: #000;
        }
        
        .test-paper-marks {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        
        .test-paper-marks::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: #000;
        }
        
        .test-paper-marks::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 1px;
          background: #000;
        }
        
        .element {
          position: absolute;
          transform-origin: top left;
        }
        
        .element-text {
          font-family: inherit;
          white-space: nowrap;
          overflow: hidden;
        }
        
        .element-shape {
          border: 1px solid #000;
        }
        
        .element-shape.circle {
          border-radius: 50%;
        }
        
        .element-barcode {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
        
        .element-qr {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
        
        .print-tip {
          position: fixed;
          top: 10px;
          right: 10px;
          background: #ff6b6b;
          color: white;
          padding: 10px;
          border-radius: 5px;
          font-size: 14px;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        .no-print {
          display: none !important;
        }
      }
    `;
  }, [labelSize]);

  // Generate HTML for a single label
  const generateLabelHTML = useCallback((elements: LabelElement[]): string => {
    return elements
      .filter(element => element.visible)
      .map(element => {
        const content = replaceVariables(element.content);
        const x = mmToPx(element.x);
        const y = mmToPx(element.y);
        const width = mmToPx(element.width);
        const height = mmToPx(element.height);
        const rotation = element.rotation;

        let elementHTML = '';

        switch (element.type) {
          case 'text':
            elementHTML = `
              <div class="element element-text" style="
                left: ${x}px;
                top: ${y}px;
                width: ${width}px;
                height: ${height}px;
                transform: rotate(${rotation}deg);
                font-size: ${element.style.fontSize ? mmToPx(element.style.fontSize) : 12}px;
                font-family: ${element.style.fontFamily || 'Arial'};
                font-weight: ${element.style.fontWeight || 'normal'};
                font-style: ${element.style.fontStyle || 'normal'};
                color: ${element.style.color || '#000000'};
                text-align: ${element.style.textAlign || 'left'};
                direction: ${element.style.direction || 'ltr'};
                opacity: ${element.style.opacity || 1};
              ">${content}</div>
            `;
            break;

          case 'shape':
            if (element.content === 'circle') {
              elementHTML = `
                <div class="element element-shape circle" style="
                  left: ${x}px;
                  top: ${y}px;
                  width: ${width}px;
                  height: ${height}px;
                  transform: rotate(${rotation}deg);
                  background-color: ${element.style.backgroundColor || 'transparent'};
                  border-color: ${element.style.borderColor || '#000000'};
                  border-width: ${element.style.borderWidth ? mmToPx(element.style.borderWidth) : 0}px;
                  opacity: ${element.style.opacity || 1};
                "></div>
              `;
            } else {
              elementHTML = `
                <div class="element element-shape" style="
                  left: ${x}px;
                  top: ${y}px;
                  width: ${width}px;
                  height: ${height}px;
                  transform: rotate(${rotation}deg);
                  background-color: ${element.style.backgroundColor || 'transparent'};
                  border-color: ${element.style.borderColor || '#000000'};
                  border-width: ${element.style.borderWidth ? mmToPx(element.style.borderWidth) : 0}px;
                  border-radius: ${element.style.borderRadius ? mmToPx(element.style.borderRadius) : 0}px;
                  opacity: ${element.style.opacity || 1};
                "></div>
              `;
            }
            break;

          case 'barcode':
            elementHTML = `
              <div class="element element-barcode" style="
                left: ${x}px;
                top: ${y}px;
                width: ${width}px;
                height: ${height}px;
                transform: rotate(${rotation}deg);
                background-color: ${element.style.backgroundColor || '#ffffff'};
                border: 1px solid ${element.style.borderColor || '#000000'};
                opacity: ${element.style.opacity || 1};
              ">
                <div style="
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 8px;
                  color: #666;
                ">Barcode: ${content}</div>
              </div>
            `;
            break;

          case 'qr':
            elementHTML = `
              <div class="element element-qr" style="
                left: ${x}px;
                top: ${y}px;
                width: ${width}px;
                height: ${height}px;
                transform: rotate(${rotation}deg);
                background-color: ${element.style.backgroundColor || '#ffffff'};
                border: 1px solid ${element.style.borderColor || '#000000'};
                opacity: ${element.style.opacity || 1};
              ">
                <div style="
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 8px;
                  color: #666;
                ">QR: ${content}</div>
              </div>
            `;
            break;

          case 'table':
            // Generate table HTML based on content (e.g., "table-3" for 3 rows)
            const rowCount = parseInt(element.content.replace('table-', '')) || 3;
            const cellPadding = element.style.cellPadding ? mmToPx(element.style.cellPadding) : 2;
            
            elementHTML = `
              <div class="element" style="
                left: ${x}px;
                top: ${y}px;
                width: ${width}px;
                height: ${height}px;
                transform: rotate(${rotation}deg);
                background-color: ${element.style.backgroundColor || '#ffffff'};
                border: 1px solid ${element.style.borderColor || '#000000'};
                opacity: ${element.style.opacity || 1};
              ">
                <table style="
                  width: 100%;
                  height: 100%;
                  border-collapse: collapse;
                  font-size: 8px;
                ">
                  ${Array.from({ length: rowCount }, (_, i) => `
                    <tr>
                      <td style="
                        border: 1px solid #000;
                        padding: ${cellPadding}px;
                        text-align: center;
                        vertical-align: middle;
                      ">25g</td>
                      <td style="
                        border: 1px solid #000;
                        padding: ${cellPadding}px;
                        text-align: center;
                        vertical-align: middle;
                      ">50g</td>
                      <td style="
                        border: 1px solid #000;
                        padding: ${cellPadding}px;
                        text-align: center;
                        vertical-align: middle;
                      ">100g</td>
                    </tr>
                  `).join('')}
                </table>
              </div>
            `;
            break;

          default:
            elementHTML = `
              <div class="element" style="
                left: ${x}px;
                top: ${y}px;
                width: ${width}px;
                height: ${height}px;
                transform: rotate(${rotation}deg);
                background-color: ${element.style.backgroundColor || 'transparent'};
                border: 1px solid ${element.style.borderColor || '#000000'};
                opacity: ${element.style.opacity || 1};
              ">${content}</div>
            `;
        }

        return elementHTML;
      })
      .join('');
  }, [replaceVariables]);

  // Generate complete print HTML
  const generatePrintHTML = useCallback((isTestPaper: boolean = false, settings?: Partial<PrintSettings>): string => {
    const elementsHTML = generateLabelHTML(elements);
    const css = generatePrintCSS(isTestPaper, settings);

    if (isTestPaper) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Test Paper - ${labelSize.width}mm × ${labelSize.height}mm</title>
          <style>${css}</style>
        </head>
        <body>
          <div class="print-container">
            <div class="label-container">
              <div class="test-paper-grid"></div>
              <div class="test-paper-marks"></div>
              ${elementsHTML}
            </div>
          </div>
          <div class="print-tip no-print">
            Make sure to disable "Fit to page" in your browser's print dialog for accurate sizing.
          </div>
        </body>
        </html>
      `;
    } else {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Label Print - ${labelSize.width}mm × ${labelSize.height}mm</title>
          <style>${css}</style>
        </head>
        <body>
          <div class="print-container">
            <div class="label-container">
              ${elementsHTML}
            </div>
          </div>
          <div class="print-tip no-print">
            Make sure to disable "Fit to page" in your browser's print dialog for accurate sizing.
          </div>
        </body>
        </html>
      `;
    }
  }, [elements, labelSize, generateLabelHTML, generatePrintCSS]);

  // Print label
  const printLabel = useCallback(() => {
    try {
      setIsPrinting(true);
      setPrintError(null);

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window. Please check your popup blocker.');
      }

      const printHTML = generatePrintHTML(false);
      printWindow.document.write(printHTML);
      printWindow.document.close();

      // Wait for content to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          setIsPrinting(false);
        }, 100);
      };
    } catch (error) {
      setPrintError(error instanceof Error ? error.message : 'Print failed');
      setIsPrinting(false);
    }
  }, [generatePrintHTML]);

  // Print test paper
  const printTestPaper = useCallback((settings?: Partial<PrintSettings>) => {
    try {
      setIsPrinting(true);
      setPrintError(null);

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window. Please check your popup blocker.');
      }

      const printHTML = generatePrintHTML(true, settings);
      printWindow.document.write(printHTML);
      printWindow.document.close();

      // Wait for content to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          setIsPrinting(false);
        }, 100);
      };
    } catch (error) {
      setPrintError(error instanceof Error ? error.message : 'Print failed');
      setIsPrinting(false);
    }
  }, [generatePrintHTML]);

  return {
    printLabel,
    printTestPaper,
    generatePrintHTML,
    isPrinting,
    printError,
  };
};

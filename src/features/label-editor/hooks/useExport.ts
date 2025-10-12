/**
 * Export hook for the Label Editor
 * Handles PNG, SVG, and PDF export functionality
 */

import { useCallback, useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { LabelElement, LabelSize, ExportSettings, SampleData } from '../types';
import { mmToPx, pxToMm } from '../utils/unitConversion';

interface UseExportOptions {
  elements: LabelElement[];
  labelSize: LabelSize;
  sampleData?: SampleData | null;
}

interface UseExportReturn {
  exportPNG: (settings?: Partial<ExportSettings>) => Promise<Blob>;
  exportSVG: (settings?: Partial<ExportSettings>) => Promise<Blob>;
  exportPDF: (settings?: Partial<ExportSettings>) => Promise<Blob>;
  isExporting: boolean;
  exportError: string | null;
}

export const useExport = ({ elements, labelSize, sampleData }: UseExportOptions): UseExportReturn => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

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

  // Create canvas for rendering
  const createCanvas = useCallback((settings: ExportSettings) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to create canvas context');

    // Set canvas size based on resolution
    const scale = settings.resolution / 300; // 300 DPI is our base resolution
    canvas.width = mmToPx(labelSize.width) * scale;
    canvas.height = mmToPx(labelSize.height) * scale;

    // Scale context for high resolution
    ctx.scale(scale, scale);

    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, mmToPx(labelSize.width), mmToPx(labelSize.height));

    return { canvas, ctx, scale };
  }, [labelSize]);

  // Render element to canvas
  const renderElementToCanvas = useCallback((
    ctx: CanvasRenderingContext2D,
    element: LabelElement,
    scale: number
  ) => {
    if (!element.visible) return;

    const content = replaceVariables(element.content);
    const x = mmToPx(element.x);
    const y = mmToPx(element.y);
    const width = mmToPx(element.width);
    const height = mmToPx(element.height);
    const rotation = element.rotation;

    ctx.save();
    ctx.globalAlpha = element.style.opacity || 1;

    // Apply rotation
    if (rotation !== 0) {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    switch (element.type) {
      case 'text':
        ctx.font = `${element.style.fontWeight || 'normal'} ${element.style.fontStyle || 'normal'} ${mmToPx(element.style.fontSize || 12)}px ${element.style.fontFamily || 'Arial'}`;
        ctx.fillStyle = element.style.color || '#000000';
        ctx.textAlign = element.style.textAlign as CanvasTextAlign || 'left';
        ctx.textBaseline = 'top';
        
        // Handle RTL text
        if (element.style.direction === 'rtl') {
          ctx.direction = 'rtl';
        }
        
        ctx.fillText(content, x, y);
        break;

      case 'shape':
        if (element.style.backgroundColor) {
          ctx.fillStyle = element.style.backgroundColor;
          if (element.content === 'circle') {
            ctx.beginPath();
            ctx.arc(x + width / 2, y + height / 2, width / 2, 0, 2 * Math.PI);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, width, height);
          }
        }
        
        if (element.style.borderWidth && element.style.borderColor) {
          ctx.strokeStyle = element.style.borderColor;
          ctx.lineWidth = mmToPx(element.style.borderWidth);
          if (element.content === 'circle') {
            ctx.beginPath();
            ctx.arc(x + width / 2, y + height / 2, width / 2, 0, 2 * Math.PI);
            ctx.stroke();
          } else {
            const borderRadius = element.style.borderRadius ? mmToPx(element.style.borderRadius) : 0;
            if (borderRadius > 0) {
              ctx.beginPath();
              ctx.roundRect(x, y, width, height, borderRadius);
              ctx.stroke();
            } else {
              ctx.strokeRect(x, y, width, height);
            }
          }
        }
        break;

      case 'barcode':
        // Draw barcode placeholder
        ctx.fillStyle = element.style.backgroundColor || '#ffffff';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = element.style.borderColor || '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        // Draw barcode pattern
        ctx.fillStyle = '#000000';
        const barWidth = width / 20; // Simple barcode pattern
        for (let i = 0; i < 20; i++) {
          if (i % 2 === 0) {
            ctx.fillRect(x + i * barWidth, y, barWidth, height);
          }
        }
        
        // Add text
        ctx.fillStyle = '#000000';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(content, x + width / 2, y + height - 2);
        break;

      case 'qr':
        // Draw QR code placeholder
        ctx.fillStyle = element.style.backgroundColor || '#ffffff';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = element.style.borderColor || '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        // Draw QR pattern
        ctx.fillStyle = '#000000';
        const qrSize = Math.min(width, height);
        const cellSize = qrSize / 25; // 25x25 QR grid
        for (let i = 0; i < 25; i++) {
          for (let j = 0; j < 25; j++) {
            if ((i + j) % 3 === 0) {
              ctx.fillRect(x + i * cellSize, y + j * cellSize, cellSize, cellSize);
            }
          }
        }
        break;

      case 'table':
        // Draw table
        const rowCount = parseInt(element.content.replace('table-', '')) || 3;
        const cellHeight = height / rowCount;
        const cellWidth = width / 3; // 3 columns for pricing table
        
        // Draw table background
        ctx.fillStyle = element.style.backgroundColor || '#ffffff';
        ctx.fillRect(x, y, width, height);
        
        // Draw borders
        ctx.strokeStyle = element.style.borderColor || '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        // Draw vertical lines
        for (let i = 1; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * cellWidth, y);
          ctx.lineTo(x + i * cellWidth, y + height);
          ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let i = 1; i < rowCount; i++) {
          ctx.beginPath();
          ctx.moveTo(x, y + i * cellHeight);
          ctx.lineTo(x + width, y + i * cellHeight);
          ctx.stroke();
        }
        
        // Draw cell content
        ctx.fillStyle = '#000000';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const headers = ['25g', '50g', '100g'];
        for (let i = 0; i < rowCount; i++) {
          for (let j = 0; j < 3; j++) {
            const cellX = x + j * cellWidth + cellWidth / 2;
            const cellY = y + i * cellHeight + cellHeight / 2;
            ctx.fillText(headers[j], cellX, cellY);
          }
        }
        break;

      default:
        // Generic element
        ctx.fillStyle = element.style.backgroundColor || 'transparent';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = element.style.borderColor || '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    ctx.restore();
  }, [replaceVariables]);

  // Export to PNG
  const exportPNG = useCallback(async (settings?: Partial<ExportSettings>): Promise<Blob> => {
    try {
      setIsExporting(true);
      setExportError(null);

      const exportSettings: ExportSettings = {
        format: 'png',
        resolution: 300,
        quality: 1,
        includeBleed: false,
        includeGuides: false,
        ...settings,
      };

      const { canvas, ctx, scale } = createCanvas(exportSettings);

      // Render all elements
      elements.forEach(element => {
        renderElementToCanvas(ctx, element, scale);
      });

      // Convert to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        }, 'image/png', exportSettings.quality);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PNG export failed';
      setExportError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [elements, createCanvas, renderElementToCanvas]);

  // Export to SVG
  const exportSVG = useCallback(async (settings?: Partial<ExportSettings>): Promise<Blob> => {
    try {
      setIsExporting(true);
      setExportError(null);

      const exportSettings: ExportSettings = {
        format: 'svg',
        resolution: 300,
        quality: 1,
        includeBleed: false,
        includeGuides: false,
        ...settings,
      };

      const scale = exportSettings.resolution / 300;
      const width = mmToPx(labelSize.width) * scale;
      const height = mmToPx(labelSize.height) * scale;

      let svgContent = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="white"/>
      `;

      elements.forEach(element => {
        if (!element.visible) return;

        const content = replaceVariables(element.content);
        const x = mmToPx(element.x) * scale;
        const y = mmToPx(element.y) * scale;
        const width = mmToPx(element.width) * scale;
        const height = mmToPx(element.height) * scale;
        const rotation = element.rotation;

        let elementSVG = '';

        switch (element.type) {
          case 'text':
            elementSVG = `
              <text x="${x}" y="${y + (element.style.fontSize ? mmToPx(element.style.fontSize) * scale : 12)}" 
                    font-family="${element.style.fontFamily || 'Arial'}" 
                    font-size="${element.style.fontSize ? mmToPx(element.style.fontSize) * scale : 12}" 
                    font-weight="${element.style.fontWeight || 'normal'}" 
                    fill="${element.style.color || '#000000'}" 
                    text-anchor="${element.style.textAlign === 'center' ? 'middle' : element.style.textAlign === 'right' ? 'end' : 'start'}"
                    transform="rotate(${rotation} ${x} ${y})">${content}</text>
            `;
            break;

          case 'shape':
            if (element.content === 'circle') {
              elementSVG = `
                <circle cx="${x + width / 2}" cy="${y + height / 2}" r="${width / 2}" 
                        fill="${element.style.backgroundColor || 'transparent'}" 
                        stroke="${element.style.borderColor || '#000000'}" 
                        stroke-width="${element.style.borderWidth ? mmToPx(element.style.borderWidth) * scale : 0}"/>
              `;
            } else {
              elementSVG = `
                <rect x="${x}" y="${y}" width="${width}" height="${height}" 
                      fill="${element.style.backgroundColor || 'transparent'}" 
                      stroke="${element.style.borderColor || '#000000'}" 
                      stroke-width="${element.style.borderWidth ? mmToPx(element.style.borderWidth) * scale : 0}"
                      rx="${element.style.borderRadius ? mmToPx(element.style.borderRadius) * scale : 0}"/>
              `;
            }
            break;

          default:
            elementSVG = `
              <rect x="${x}" y="${y}" width="${width}" height="${height}" 
                    fill="${element.style.backgroundColor || 'transparent'}" 
                    stroke="${element.style.borderColor || '#000000'}" 
                    stroke-width="1"/>
            `;
        }

        svgContent += elementSVG;
      });

      svgContent += '</svg>';

      return new Blob([svgContent], { type: 'image/svg+xml' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SVG export failed';
      setExportError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [elements, labelSize, replaceVariables]);

  // Export to PDF
  const exportPDF = useCallback(async (settings?: Partial<ExportSettings>): Promise<Blob> => {
    try {
      setIsExporting(true);
      setExportError(null);

      const exportSettings: ExportSettings = {
        format: 'pdf',
        resolution: 300,
        quality: 1,
        includeBleed: false,
        includeGuides: false,
        ...settings,
      };

      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([mmToPx(labelSize.width), mmToPx(labelSize.height)]);

      // Set background
      page.drawRectangle({
        x: 0,
        y: 0,
        width: mmToPx(labelSize.width),
        height: mmToPx(labelSize.height),
        color: rgb(1, 1, 1), // White
      });

      // Load font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Render elements
      for (const element of elements) {
        if (!element.visible) continue;

        const content = replaceVariables(element.content);
        const x = mmToPx(element.x);
        const y = mmToPx(labelSize.height) - mmToPx(element.y) - mmToPx(element.height); // PDF coordinates are bottom-up
        const width = mmToPx(element.width);
        const height = mmToPx(element.height);

        switch (element.type) {
          case 'text':
            page.drawText(content, {
              x,
              y,
              size: element.style.fontSize ? mmToPx(element.style.fontSize) : 12,
              font,
              color: element.style.color ? 
                rgb(
                  parseInt(element.style.color.slice(1, 3), 16) / 255,
                  parseInt(element.style.color.slice(3, 5), 16) / 255,
                  parseInt(element.style.color.slice(5, 7), 16) / 255
                ) : rgb(0, 0, 0),
            });
            break;

          case 'shape':
            if (element.content === 'circle') {
              page.drawCircle({
                x: x + width / 2,
                y: y + height / 2,
                size: width / 2,
                borderColor: element.style.borderColor ? 
                  rgb(
                    parseInt(element.style.borderColor.slice(1, 3), 16) / 255,
                    parseInt(element.style.borderColor.slice(3, 5), 16) / 255,
                    parseInt(element.style.borderColor.slice(5, 7), 16) / 255
                  ) : rgb(0, 0, 0),
                borderWidth: element.style.borderWidth ? mmToPx(element.style.borderWidth) : 0,
                color: element.style.backgroundColor ? 
                  rgb(
                    parseInt(element.style.backgroundColor.slice(1, 3), 16) / 255,
                    parseInt(element.style.backgroundColor.slice(3, 5), 16) / 255,
                    parseInt(element.style.backgroundColor.slice(5, 7), 16) / 255
                  ) : rgb(1, 1, 1),
              });
            } else {
              page.drawRectangle({
                x,
                y,
                width,
                height,
                borderColor: element.style.borderColor ? 
                  rgb(
                    parseInt(element.style.borderColor.slice(1, 3), 16) / 255,
                    parseInt(element.style.borderColor.slice(3, 5), 16) / 255,
                    parseInt(element.style.borderColor.slice(5, 7), 16) / 255
                  ) : rgb(0, 0, 0),
                borderWidth: element.style.borderWidth ? mmToPx(element.style.borderWidth) : 0,
                color: element.style.backgroundColor ? 
                  rgb(
                    parseInt(element.style.backgroundColor.slice(1, 3), 16) / 255,
                    parseInt(element.style.backgroundColor.slice(3, 5), 16) / 255,
                    parseInt(element.style.backgroundColor.slice(5, 7), 16) / 255
                  ) : rgb(1, 1, 1),
              });
            }
            break;

          default:
            // Generic element
            page.drawRectangle({
              x,
              y,
              width,
              height,
              borderColor: rgb(0, 0, 0),
              borderWidth: 1,
            });
        }
      }

      // Generate PDF bytes
      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PDF export failed';
      setExportError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [elements, labelSize, replaceVariables]);

  return {
    exportPNG,
    exportSVG,
    exportPDF,
    isExporting,
    exportError,
  };
};

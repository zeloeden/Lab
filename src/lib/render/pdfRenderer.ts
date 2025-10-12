import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { EnhancedLabelTemplate, EnhancedLabelElement, EnhancedTextElement, EnhancedImageElement, EnhancedShapeElement, EnhancedBarcodeElement, EnhancedQRElement, EnhancedTableElement } from '@/lib/label-model';
import { mmToIn } from '@/lib/units';

export async function renderTemplateToPDF(template: EnhancedLabelTemplate): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([
    mmToIn(template.size.width) * 72,
    mmToIn(template.size.height) * 72
  ]);

  const drawText = async (el: EnhancedTextElement) => {
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontSizePt = (el.fontSize || 12) * 2.83465; // mm->pt approx
    page.drawText(el.content || '', {
      x: mmToIn(el.x) * 72,
      y: mmToIn(template.size.height - el.y - el.h) * 72,
      size: fontSizePt,
      font,
      color: rgb(0, 0, 0)
    });
  };

  const drawShape = async (el: EnhancedShapeElement) => {
    const x = mmToIn(el.x) * 72;
    const y = mmToIn(template.size.height - el.y - el.h) * 72;
    const w = mmToIn(el.w) * 72;
    const h = mmToIn(el.h) * 72;
    const stroke = el.stroke ? hexToRgb(el.stroke) : { r: 0, g: 0, b: 0 };
    const fill = el.fill ? hexToRgb(el.fill) : null;
    if (fill) page.drawRectangle({ x, y, width: w, height: h, color: rgb(fill.r, fill.g, fill.b) });
    page.drawRectangle({ x, y, width: w, height: h, borderColor: rgb(stroke.r, stroke.g, stroke.b) });
  };

  for (const el of template.elements) {
    if (el.type === 'text') await drawText(el as EnhancedTextElement);
    if (el.type === 'shape') await drawShape(el as EnhancedShapeElement);
    // Skip complex elements for now
  }

  return await pdf.save();
}

function hexToRgb(hex: string) {
  const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!res) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(res[1], 16) / 255,
    g: parseInt(res[2], 16) / 255,
    b: parseInt(res[3], 16) / 255
  };
}

// Simplified PDF renderer - only basic functionality

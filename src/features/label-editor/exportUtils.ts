import { PDFDocument } from "pdf-lib";
import type { fabric as FabricNS } from "fabric";

export const mm2px = (mm: number, dpi = 300) => Math.round((mm * dpi) / 25.4);

export function downloadDataURL(dataURL: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = filename;
  a.click();
}

export async function exportPNG(canvas: any, filename: string) {
  const data = canvas.toDataURL({ format: "png", multiplier: 1 });
  downloadDataURL(data, filename.endsWith(".png") ? filename : `${filename}.png`);
}

export async function exportSVG(canvas: any, filename: string) {
  const svg = canvas.toSVG();
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  downloadDataURL(url, filename.endsWith(".svg") ? filename : `${filename}.svg`);
  URL.revokeObjectURL(url);
}

export async function exportPDF(canvas: any, wmm: number, hmm: number, filename: string) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([wmm, hmm].map((mm) => (mm / 25.4) * 72));
  const png = canvas.toDataURL({ format: "png", multiplier: 1 });
  const img = await pdf.embedPng(png);
  page.drawImage(img, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
  const bytes = await pdf.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  downloadDataURL(url, filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  URL.revokeObjectURL(url);
}

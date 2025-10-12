// Lightweight PDF helpers using pdfjs-dist
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf';

try {
  // Let bundler resolve worker; fallback path is fine for Vite/Webpack
  // @ts-ignore
  GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
} catch {
  // If your bundler already inlines a worker, you can ignore this
}

export type PDFFileLike = File & { type: 'application/pdf' };

async function loadPdf(file: PDFFileLike) {
  const ab = await file.arrayBuffer();
  const task = getDocument({ data: ab });
  const pdf = await task.promise;
  return pdf;
}

export async function getPdfPageCount(file: PDFFileLike): Promise<number> {
  const pdf = await loadPdf(file);
  return pdf.numPages;
}

export async function rasterizePdfPageToDataURL(
  file: PDFFileLike,
  pageNumber: number,
  maxWidth = 1600
): Promise<string> {
  const pdf = await loadPdf(file);
  const page = await pdf.getPage(pageNumber);
  const vp = page.getViewport({ scale: 1 });

  let scale = 1;
  if (vp.width > maxWidth) scale = maxWidth / vp.width;

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({ canvasContext: ctx as any, viewport }).promise;
  return canvas.toDataURL('image/png');
}

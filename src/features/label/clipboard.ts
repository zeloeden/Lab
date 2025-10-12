import { fabric } from 'fabric';
import type { PDFFileLike } from './pdf';
import { rasterizePdfPageToDataURL } from './pdf';

export function isImageUrl(s?: string) {
  if (!s) return false;
  try {
    const u = new URL(s);
    return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(u.pathname);
  } catch { return false; }
}

export function extractSVG(html?: string): string | null {
  if (!html) return null;
  const start = html.indexOf('<svg'); if (start === -1) return null;
  const end = html.indexOf('</svg>'); if (end === -1) return null;
  return html.slice(start, end + 6);
}

export async function addImageFromFile(c: fabric.Canvas, file: File, left=20, top=20) {
  const dataUrl: string = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
  fabric.Image.fromURL(dataUrl, (img) => {
    img.set({ left, top });
    const maxW = (c.getWidth() || 0) - 40;
    if ((img.getScaledWidth?.() ?? img.width ?? 0) > maxW) img.scaleToWidth(maxW);
    c.add(img); c.setActiveObject(img); c.requestRenderAll();
  }, { crossOrigin: 'anonymous' });
}

export function importImageFromUrl(c: fabric.Canvas, url: string, left=20, top=20) {
  fabric.Image.fromURL(url, (img) => {
    img.set({ left, top });
    const maxW = (c.getWidth() || 0) - 40;
    if ((img.getScaledWidth?.() ?? img.width ?? 0) > maxW) img.scaleToWidth(maxW);
    c.add(img); c.setActiveObject(img); c.requestRenderAll();
  }, { crossOrigin: 'anonymous' });
}

export function importSVGString(c: fabric.Canvas, svg: string, left=20, top=20) {
  fabric.loadSVGFromString(svg, (objects, options) => {
    const group = fabric.util.groupSVGElements(objects, options);
    group.set({ left, top, selectable: true });
    c.add(group); c.setActiveObject(group); c.requestRenderAll();
  });
}

// Callback to ask UI which format to paste when both are available
export type PasteDecision = 'svg'|'image'|'cancel';
export type PasteOptions = {
  svg?: string;
  imageFile?: File;
  imageUrl?: string;
  plainText?: string;
};

type SetupOpts = {
  container: HTMLElement;
  canvas: fabric.Canvas;
  onPasteOptions?: (opts: PasteOptions) => Promise<PasteDecision>;
  onPickPdfPage?: (file: PDFFileLike) => Promise<number | 'cancel'>; // NEW
};

export function setupClipboardAndDnD({ container, canvas, onPasteOptions, onPickPdfPage }: SetupOpts) {
  const onPaste = async (e: ClipboardEvent) => {
    // Let inputs handle their own paste
    const target = e.target as HTMLElement | null;
    const isEditable = target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      (target as any).isContentEditable
    );
    if (isEditable) return;

    const dt = e.clipboardData; if (!dt) return;

    // Collect candidates
    let imageFile: File | undefined;
    for (const item of Array.from(dt.items)) {
      if (item.kind === 'file') {
        const f = item.getAsFile();
        if (f && (f.type.startsWith('image/') || f.type === 'application/pdf')) {
          imageFile = f;
          break;
        }
      }
    }

    const html = dt.getData('text/html');
    const text = dt.getData('text/plain').trim();
    const svg = extractSVG(html) || (text.startsWith('<svg') ? text : undefined);
    const imgUrl = isImageUrl(text) ? text : undefined;

    // If PDF on clipboard → ask for page, then rasterize
    if (imageFile && imageFile.type === 'application/pdf') {
      e.preventDefault();
      let page = 1;
      if (onPickPdfPage) {
        const chosen = await onPickPdfPage(imageFile as PDFFileLike);
        if (chosen === 'cancel') return;
        page = chosen || 1;
      }
      try {
        const dataUrl = await rasterizePdfPageToDataURL(imageFile as PDFFileLike, page);
        fabric.Image.fromURL(dataUrl, (img) => {
          img.set({ left: 20, top: 20 });
          const maxW = (canvas.getWidth() || 0) - 40;
          if ((img.getScaledWidth?.() ?? img.width ?? 0) > maxW) img.scaleToWidth(maxW);
          canvas.add(img); canvas.setActiveObject(img); canvas.requestRenderAll();
        });
      } catch (err) {
        console.error('PDF import failed', err);
      }
      return;
    }

    // Both vector and raster available → ask UI
    if (onPasteOptions && (svg && (imageFile || imgUrl))) {
      e.preventDefault();
      const decision = await onPasteOptions({ svg, imageFile, imageUrl: imgUrl, plainText: text });
      if (decision === 'svg') {
        importSVGString(canvas, svg!);
      } else if (decision === 'image') {
        if (imageFile) await addImageFromFile(canvas, imageFile);
        else if (imgUrl) importImageFromUrl(canvas, imgUrl);
      }
      return;
    }

    // Prefer vector if present
    if (svg) {
      e.preventDefault();
      importSVGString(canvas, svg);
      return;
    }

    // Image file from clipboard
    if (imageFile && imageFile.type.startsWith('image/')) {
      e.preventDefault();
      await addImageFromFile(canvas, imageFile);
      return;
    }

    // Image URL
    if (imgUrl) {
      e.preventDefault();
      importImageFromUrl(canvas, imgUrl);
      return;
    }

    // Our Fabric JSON (optional)
    if (text.startsWith('{') && text.includes('"objects"')) {
      try {
        const json = JSON.parse(text);
        e.preventDefault();
        fabric.util.enlivenObjects(json.objects, (objs) => {
          const group = new fabric.Group(objs as any, { left: 20, top: 20 });
          canvas.add(group); canvas.setActiveObject(group); canvas.requestRenderAll();
        });
        return;
      } catch { /* ignore invalid JSON */ }
    }
  };

  const prevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };

  const onDrop = async (e: DragEvent) => {
    prevent(e);
    const files = e.dataTransfer?.files; if (!files?.length) return;
    const file = files[0];

    if (file.type === 'application/pdf') {
      let page = 1;
      if (onPickPdfPage) {
        const chosen = await onPickPdfPage(file as PDFFileLike);
        if (chosen === 'cancel') return;
        page = chosen || 1;
      }
      try {
        const dataUrl = await rasterizePdfPageToDataURL(file as PDFFileLike, page);
        fabric.Image.fromURL(dataUrl, (img) => {
          img.set({ left: e.offsetX ?? 20, top: e.offsetY ?? 20 });
          const maxW = (canvas.getWidth() || 0) - 40;
          if ((img.getScaledWidth?.() ?? img.width ?? 0) > maxW) img.scaleToWidth(maxW);
          canvas.add(img); canvas.setActiveObject(img); canvas.requestRenderAll();
        });
      } catch (err) { console.error('PDF import failed', err); }
      return;
    }

    if (/image\/(png|jpeg|jpg|webp|gif|bmp|svg\+xml)/i.test(file.type)) {
      if (file.type.includes('svg')) {
        const text = await file.text();
        importSVGString(canvas, text, e.offsetX ?? 20, e.offsetY ?? 20);
      } else {
        await addImageFromFile(canvas, file, e.offsetX ?? 20, e.offsetY ?? 20);
      }
    }
  };

  container.addEventListener('paste', onPaste as any);
  container.addEventListener('dragover', prevent);
  container.addEventListener('dragenter', prevent);
  container.addEventListener('drop', onDrop as any);

  return () => {
    container.removeEventListener('paste', onPaste as any);
    container.removeEventListener('dragover', prevent);
    container.removeEventListener('dragenter', prevent);
    container.removeEventListener('drop', onDrop as any);
  };
}

// Copy selection as SVG + PNG
export async function copySelectionToClipboard(c: fabric.Canvas) {
  const active = c.getActiveObject();
  if (!active) return;
  const svg = (active as any).toSVG ? (active as any).toSVG() : '';

  const b = active.getBoundingRect(true, true);
  const dataURL = c.toDataURL({
    format: 'png', left: b.left, top: b.top, width: b.width, height: b.height, multiplier: 2,
  });

  try {
    const items:any[] = [];
    if (svg) items.push(new ClipboardItem({ 'image/svg+xml': new Blob([svg], { type: 'image/svg+xml' }) }));
    if (dataURL) {
      const bin = await (await fetch(dataURL)).blob();
      items.push(new ClipboardItem({ 'image/png': bin }));
    }
    if (items.length) { await (navigator as any).clipboard.write(items); return; }
  } catch {}
  if (svg) await navigator.clipboard.writeText(svg);
}
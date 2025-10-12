import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { useEditorStore } from "./store";
import { exportPNG, exportPDF, exportSVG, mm2px } from "./exportUtils";
import { saveTemplateLocal, listTemplatesLocal, getTemplateLocal, deleteTemplateLocal } from "./templateService";

type AnyObj = fabric.Object;

const useFabricInit = () => {
  const hostRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const { meta, commit } = useEditorStore();

  useEffect(() => {
    const w = mm2px(meta.wmm, meta.dpi);
    const h = mm2px(meta.hmm, meta.dpi);
    const c = new fabric.Canvas(hostRef.current!, {
      backgroundColor: "#fff",
      selection: true,
      preserveObjectStacking: true,
    });
    c.setWidth(w);
    c.setHeight(h);

    // safe area
    const safe = new fabric.Rect({
      left: mm2px(meta.safeMM, meta.dpi),
      top: mm2px(meta.safeMM, meta.dpi),
      width: w - mm2px(meta.safeMM * 2, meta.dpi),
      height: h - mm2px(meta.safeMM * 2, meta.dpi),
      fill: "rgba(0,0,0,0)",
      stroke: "#e5e7eb",
      strokeDashArray: [4, 4],
      selectable: false,
      evented: false,
      name: "__safe__",
    });
    c.add(safe).sendToBack(safe);

    const commitJSON = () => commit(JSON.stringify(c.toJSON()));
    c.on("object:added", commitJSON);
    c.on("object:modified", commitJSON);
    c.on("object:removed", commitJSON);
    c.on("selection:updated", () => c.requestRenderAll());

    canvasRef.current = c;
    commit(JSON.stringify(c.toJSON()));

    return () => {
      c.dispose();
      canvasRef.current = null;
    };
  }, [meta.wmm, meta.hmm, meta.safeMM, meta.dpi]);

  return { hostRef, canvasRef };
};

export default function LabelEditor() {
  const { meta, setMeta, undo, redo, commit } = useEditorStore();
  const { hostRef, canvasRef } = useFabricInit();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [printerId] = useState<string>("LabelPrinter");
  const [templateName, setTemplateName] = useState<string>("");
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
  const [samples] = useState<Array<{ id: string; label: string; data: Record<string, string> }>>([
    {
      id: 'sample-1',
      label: 'Sample A',
      data: {
        ArabicName: 'اسم المنتج أ',
        EnglishName: 'Product A',
        SupplierCode: 'SUP-A',
        Price25: '30',
        Price50: '32',
        Price100: '35',
        QR: 'https://nbs.iq/a',
        Barcode: '123456789012',
      },
    },
    {
      id: 'sample-2',
      label: 'Sample B',
      data: {
        ArabicName: 'اسم المنتج ب',
        EnglishName: 'Product B',
        SupplierCode: 'SUP-B',
        Price25: '28',
        Price50: '30',
        Price100: '33',
        QR: 'https://nbs.iq/b',
        Barcode: '987654321098',
      },
    },
  ]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('sample-1');

  const addText = () => {
    const c = canvasRef.current!;
    const t = new fabric.IText("نص عربي / English", {
      left: 20, top: 20, fill: "#111", fontSize: 16, fontFamily: "Tahoma, Arial",
      textAlign: "right", direction: "rtl" as any,
    });
    c.add(t).setActiveObject(t); c.requestRenderAll();
  };
  const addRect = () => {
    const c = canvasRef.current!;
    const r = new fabric.Rect({ left: 40, top: 40, width: 140, height: 70, rx: 6, ry: 6,
      fill: "rgba(59,130,246,0.08)", stroke: "#3b82f6", strokeWidth: 1 });
    c.add(r).setActiveObject(r); c.requestRenderAll();
  };
  const addCircle = () => {
    const c = canvasRef.current!;
    const o = new fabric.Circle({ left: 60, top: 60, radius: 28,
      fill: "rgba(16,185,129,0.1)", stroke: "#10b981", strokeWidth: 1 });
    c.add(o).setActiveObject(o); c.requestRenderAll();
  };
  const addLine = () => {
    const c = canvasRef.current!;
    const l = new fabric.Line([10, 10, 160, 10], { stroke: "#111827", strokeWidth: 1 });
    c.add(l).setActiveObject(l); c.requestRenderAll();
  };
  const triggerImage = () => fileInputRef.current?.click();
  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const c = canvasRef.current!;
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      fabric.Image.fromURL(reader.result as string, (img) => {
        const maxW = c.getWidth()! * 0.7;
        if (img.width! > maxW) img.scaleToWidth(maxW);
        img.set({ left: 30, top: 30 });
        c.add(img).setActiveObject(img); c.requestRenderAll();
      });
    };
    reader.readAsDataURL(file);
    (e.target as HTMLInputElement).value = "";
  };
  const addBarcode = (value = "{{Barcode}}") => {
    const c = canvasRef.current!;
    const tmp = document.createElement("canvas");
    JsBarcode(tmp, value, { format: "CODE128", displayValue: false, margin: 6, height: 40, width: 1.5 });
    const dataURL = tmp.toDataURL("image/png");
    fabric.Image.fromURL(dataURL, (img) => {
      img.set({ left: 20, top: 20 });
      ;(img as any).nbsType = 'barcode';
      ;(img as any).nbsRaw = value;
      const maxW = c.getWidth()! - 40;
      if ((img.getScaledWidth() ?? img.width!) > maxW) img.scaleToWidth(maxW);
      c.add(img).setActiveObject(img); c.requestRenderAll();
    });
  };
  const addQR = async (value = "{{QR}}") => {
    const c = canvasRef.current!;
    const dataURL = await QRCode.toDataURL(value, { margin: 1, width: 140, errorCorrectionLevel: "M" });
    fabric.Image.fromURL(dataURL, (img) => { img.set({ left: 20, top: 80 }); c.add(img).setActiveObject(img); c.requestRenderAll(); });
    // Note: store metadata on the added image after it appears
    const objs = c.getObjects();
    const last = objs[objs.length - 1] as any;
    if (last && last.type === 'image') { last.nbsType = 'qr'; last.nbsRaw = value; }
  };
  const addPriceTable = (rows = [
    { qty: 25, price: "30" }, { qty: 50, price: "32" }, { qty: 100, price: "35" },
  ]) => {
    const c = canvasRef.current!;
    const padding = 6, rowH = 22; const items: fabric.Object[] = [];
    const header = new fabric.Text("Prices", { fontSize: 12, fontWeight: "bold", fill: "#111", left: 0, top: 0 });
    items.push(header);
    rows.forEach((r, i) => {
      const y = 18 + i * rowH;
      const bg = new fabric.Rect({ left: 0, top: y - 14, width: 120, height: rowH, rx: 4, ry: 4,
        fill: i % 2 ? "#e5e7eb" : "#f3f4f6", stroke: "#d1d5db", strokeWidth: 1 });
      const t1 = new fabric.Text(`${r.qty}`, { left: padding, top: y - 8, fontSize: 12, fill: "#111" });
      const t2 = new fabric.Text(`${r.price}`, { left: 120 - padding - 24, top: y - 8, fontSize: 12, fill: "#111" });
      items.push(bg, t1, t2);
    });
    const grp = new fabric.Group(items, { left: 180, top: 20, name: "PriceTable" });
    c.add(grp).setActiveObject(grp); c.requestRenderAll();
  };

  const [layers, setLayers] = useState<AnyObj[]>([]);
  const refreshLayers = () => {
    const c = canvasRef.current!;
    const arr = c.getObjects().filter(o => (o as any).name !== "__safe__");
    setLayers(arr.reverse());
  };
  useEffect(() => {
    const c = canvasRef.current!;
    if (!c) return;
    const rerun = () => refreshLayers();
    c.on("object:added", rerun);
    c.on("object:removed", rerun);
    c.on("object:modified", rerun);
    refreshLayers();
    return () => { c.off("object:added", rerun); c.off("object:removed", rerun); c.off("object:modified", rerun); };
  }, [canvasRef.current]);

  const onUndo = () => { const c = canvasRef.current!; const json = undo(); if (json) c.loadFromJSON(json, () => c.renderAll()); };
  const onRedo = () => { const c = canvasRef.current!; const json = redo(); if (json) c.loadFromJSON(json, () => c.renderAll()); };

  const doExportPNG = () => exportPNG(canvasRef.current!, `label_${meta.wmm}x${meta.hmm}.png`);
  const doExportPDF = () => exportPDF(canvasRef.current!, meta.wmm, meta.hmm, `label_${meta.wmm}x${meta.hmm}.pdf`);
  const doExportSVG = () => exportSVG(canvasRef.current!, `label_${meta.wmm}x${meta.hmm}.svg`);

  // Data binding
  const resolveTokens = (text: string, data: Record<string, string>) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, k) => (data[k] ?? ''));

  const applyPreviewData = async () => {
    const c = canvasRef.current!;
    const picked = samples.find(s => s.id === selectedSampleId)?.data || {};
    // Update text elements
    c.getObjects().forEach((o: any) => {
      if (o.type === 'i-text' || o.type === 'textbox' || o.type === 'text') {
        const original = o.text as string;
        o.text = resolveTokens(original, picked);
      }
    });
    // Regenerate barcode/QR images with replaced values
    for (const o of c.getObjects() as any[]) {
      if (o.nbsType === 'barcode') {
        const raw = o.nbsRaw as string;
        const val = resolveTokens(raw, picked) || '000000000000';
        const tmp = document.createElement('canvas');
        JsBarcode(tmp, val, { format: 'CODE128', displayValue: false, margin: 6, height: 40, width: 1.5 });
        const dataURL = tmp.toDataURL('image/png');
        const { left, top, scaleX, scaleY } = o;
        await new Promise<void>((res) => fabric.Image.fromURL(dataURL, (img) => {
          (img as any).nbsType = 'barcode'; (img as any).nbsRaw = raw;
          img.set({ left, top, scaleX, scaleY });
          c.remove(o); c.add(img); res();
        }));
      }
      if (o.nbsType === 'qr') {
        const raw = o.nbsRaw as string;
        const val = resolveTokens(raw, picked) || '';
        const dataURL = await QRCode.toDataURL(val || ' ', { margin: 1, width: 140, errorCorrectionLevel: 'M' });
        const { left, top, scaleX, scaleY } = o;
        await new Promise<void>((res) => fabric.Image.fromURL(dataURL, (img) => {
          (img as any).nbsType = 'qr'; (img as any).nbsRaw = raw;
          img.set({ left, top, scaleX, scaleY });
          c.remove(o); c.add(img); res();
        }));
      }
    }
    c.requestRenderAll();
    commit(JSON.stringify(c.toJSON()));
  };

  // Templates
  const refreshTemplates = async () => {
    const list = await listTemplatesLocal(printerId);
    setTemplates(list.map((t) => ({ id: t.id, name: t.name })));
  };

  useEffect(() => {
    refreshTemplates();
  }, []);

  const onSaveTemplate = async () => {
    const c = canvasRef.current!;
    const name = templateName.trim() || `Template_${new Date().toISOString().slice(0,19)}`;
    const id = `${printerId}:${name}`;
    await saveTemplateLocal({
      id,
      printerId,
      name,
      json: JSON.stringify(c.toJSON()),
      meta,
      updatedAt: Date.now(),
    });
    await refreshTemplates();
  };

  const onOpenTemplate = async (id: string) => {
    const rec = await getTemplateLocal(id);
    if (!rec) return;
    const c = canvasRef.current!;
    c.loadFromJSON(rec.json, () => c.renderAll());
  };

  const onDeleteTemplate = async (id: string) => {
    await deleteTemplateLocal(id);
    await refreshTemplates();
  };

  // Printing helpers
  const openPrintWindow = (html: string) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.onload = () => setTimeout(() => w.print(), 100);
  };

  const onPrintLabel = () => {
    const c = canvasRef.current!;
    const dataURL = c.toDataURL({ format: "png", multiplier: 1 });
    const css = `@page { size: ${meta.wmm}mm ${meta.hmm}mm; margin: 0 }`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0;padding:0"><img src="${dataURL}" style="width:${meta.wmm}mm;height:${meta.hmm}mm"/></body></html>`;
    openPrintWindow(html);
  };

  const onPrintTestPaper = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:0}</style></head><body style="margin:0;padding:0">`
      + `<svg width="210mm" height="297mm" viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg">`
      + `<rect x="10" y="10" width="${meta.wmm}" height="${meta.hmm}" fill="none" stroke="#111" stroke-dasharray="2,2"/>`
      + `<line x1="${10 + meta.wmm/2}" y1="10" x2="${10 + meta.wmm/2}" y2="${10 + meta.hmm}" stroke="#999"/>`
      + `<line x1="10" y1="${10 + meta.hmm/2}" x2="${10 + meta.wmm}" y2="${10 + meta.hmm/2}" stroke="#999"/>`
      + `</svg>`
      + `</body></html>`;
    openPrintWindow(html);
  };

  return (
    <div className="flex gap-4">
      <div className="w-64 space-y-3">
        <div className="p-3 border rounded-lg">
          <div className="font-semibold mb-2">Tools</div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn" onClick={addText}>Text</button>
            <button className="btn" onClick={() => fileInputRef.current?.click()}>Image</button>
            <button className="btn" onClick={addRect}>Rect</button>
            <button className="btn" onClick={addCircle}>Circle</button>
            <button className="btn" onClick={addLine}>Line</button>
            <button className="btn" onClick={() => addBarcode()}>Barcode</button>
            <button className="btn" onClick={() => addQR()}>QR</button>
            <button className="btn" onClick={() => addPriceTable()}>Table</button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage}/>
        </div>

        <div className="p-3 border rounded-lg">
          <div className="font-semibold mb-2">Label Size</div>
          <div className="flex items-center gap-2">
            <input type="number" value={meta.wmm} onChange={(e)=>setMeta({wmm:+e.target.value})} className="input"/>
            <span>mm ×</span>
            <input type="number" value={meta.hmm} onChange={(e)=>setMeta({hmm:+e.target.value})} className="input"/>
            <span>mm</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span>Safe</span>
            <input type="number" value={meta.safeMM} onChange={(e)=>setMeta({safeMM:+e.target.value})} className="input w-20"/>
            <span>mm</span>
          </div>
        <div className="mt-3">
          <div className="font-semibold mb-2">Preview Data</div>
          <select className="input w-full" value={selectedSampleId} onChange={(e)=>setSelectedSampleId(e.target.value)}>
            {samples.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button className="btn w-full mt-2" onClick={applyPreviewData}>Apply Data</button>
        </div>
        </div>

        <div className="p-3 border rounded-lg">
          <div className="grid gap-2">
            <button className="btn" onClick={onUndo}>Undo</button>
            <button className="btn" onClick={onRedo}>Redo</button>
            <button className="btn" onClick={doExportPNG}>Export PNG</button>
            <button className="btn" onClick={doExportPDF}>Export PDF</button>
            <button className="btn" onClick={doExportSVG}>Export SVG</button>
          <div className="h-px bg-gray-200 my-1" />
          <div className="flex gap-2 items-center">
            <input className="input flex-1" placeholder="Template name" value={templateName} onChange={(e)=>setTemplateName(e.target.value)} />
            <button className="btn" onClick={onSaveTemplate}>Save</button>
          </div>
          <div className="space-y-1 max-h-32 overflow-auto border rounded p-1">
            {templates.map(t => (
              <div key={t.id} className="flex items-center justify-between text-sm px-2 py-1 hover:bg-gray-50 rounded">
                <span className="truncate">{t.name}</span>
                <span className="flex gap-2">
                  <button className="btn-xs" onClick={()=>onOpenTemplate(t.id)}>Open</button>
                  <button className="btn-xs" onClick={()=>onDeleteTemplate(t.id)}>Delete</button>
                </span>
              </div>
            ))}
            {!templates.length && <div className="text-xs text-gray-500 px-2">No templates</div>}
          </div>
          <button className="btn" onClick={refreshTemplates}>Refresh Templates</button>
          <div className="h-px bg-gray-200 my-1" />
          <button className="btn" onClick={onPrintLabel}>Print Label</button>
          <button className="btn" onClick={onPrintTestPaper}>Print Test Paper</button>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-2 bg-white">
        <canvas ref={hostRef} />
      </div>

      <div className="w-64 space-y-3">
        <div className="p-3 border rounded-lg">
          <div className="font-semibold mb-2">Layers</div>
          <div className="space-y-1">
            {layers.map((o, i) => (
              <div key={i} className="flex items-center justify-between border px-2 py-1 rounded">
                <span className="truncate">{o.type}</span>
                <div className="flex gap-2">
                  <button className="btn-xs" onClick={() => { o.set("visible", !o.visible); canvasRef.current!.requestRenderAll(); }}>
                    {o.visible ? "Hide" : "Show"}
                  </button>
                  <button className="btn-xs" onClick={() => { o.set("lockMovementX", !o.lockMovementX); o.set("lockMovementY", !o.lockMovementY); }}>
                    {o.lockMovementX ? "Unlock" : "Lock"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="font-semibold mb-2">Inspector</div>
          <p>Select an element to edit its properties (extend as needed).</p>
        </div>
      </div>
    </div>
  );
}

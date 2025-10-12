import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fabric } from 'fabric';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { v4 as uuid } from 'uuid';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Copy, Trash2, Printer, Download, Layers, Image as ImageIcon, Type, QrCode, Barcode, Square, Circle, ScanSearch } from 'lucide-react';
import { setupClipboardAndDnD, copySelectionToClipboard } from '@/features/label/clipboard';
import type { PasteDecision, PasteOptions } from '@/features/label/clipboard';
import { PasteOptionsDialog } from '@/features/label/PasteOptionsDialog';
import { PdfPagePickerDialog } from '@/features/label/PdfPagePickerDialog';
import type { PDFFileLike } from '@/features/label/pdf';
import { vectorizeActiveImage } from '@/features/label/vectorize';

let svc: any = null;
try { svc = require('@/services/labelTemplateService').labelTemplateService; } catch {}

type Unit = 'mm'|'px';
type Category = 'formula'|'sample'|'rawMaterial'|'finishedGood'|'generic';
type VarSource = 'manual'|'formula'|'sample'|'rawMaterial'|'finishedGood';

type VarDef = {
  key: string;
  label: string;
  source: VarSource;
  fieldPath?: string;
  required?: boolean;
  sampleValue?: string;
  format?: string;
};

type BaseEl = {
  id: string;
  type: 'text'|'barcode'|'qr'|'image'|'rect'|'circle'|'line';
  x: number; y: number; w?: number; h?: number; r?: number;
  rotate?: number; color?: string; bg?: string; stroke?: string; strokeW?: number;
  bind?: { varKey?: string; fallback?: string };
};

type TextEl = BaseEl & { type: 'text'; text?: string; font?: string; size?: number; bold?: boolean; italic?: boolean; align?: 'left'|'center'|'right'; };
type BarcodeEl = BaseEl & { type: 'barcode'; symbology: 'CODE128'|'EAN13'|'EAN8'|'UPC'|'CODE39'; value?: string; showValue?: boolean; };
type QREl = BaseEl & { type: 'qr'; value?: string; ecc?: 'L'|'M'|'Q'|'H'; };
type ImgEl = BaseEl & { type: 'image'; src?: string; };
type RectEl = BaseEl & { type: 'rect'; rx?: number; ry?: number; };
type CircleEl = BaseEl & { type: 'circle'; radius?: number; };
type LineEl = BaseEl & { type: 'line'; x2?: number; y2?: number; };

type LabelElement = TextEl | BarcodeEl | QREl | ImgEl | RectEl | CircleEl | LineEl;

type LabelTemplate = {
  id: string;
  name: string;
  category: Category;
  size: { width: number; height: number; unit: Unit; dpi: number };
  variables: VarDef[];
  elements: LabelElement[];
  createdBy?: string;
  updatedAt: number;
};

const storageKey = 'label-templates-v3';
const localStore = {
  getAll(): LabelTemplate[] { const raw = localStorage.getItem(storageKey); if (!raw) return []; try { return JSON.parse(raw); } catch { return []; } },
  save(tpl: LabelTemplate) { const all = localStore.getAll(); const i = all.findIndex(t=>t.id===tpl.id); if (i>=0) all[i]=tpl; else all.push(tpl); localStorage.setItem(storageKey, JSON.stringify(all)); },
  delete(id: string) { const all = localStore.getAll().filter(t=>t.id!==id); localStorage.setItem(storageKey, JSON.stringify(all)); },
};

function svcOrLocal(){
  if (svc) {
    return {
      getTemplates: () => svc.getTemplates?.() ?? [],
      getTemplate: (id:string) => svc.getTemplate?.(id),
      saveTemplate: (tpl:LabelTemplate)=> svc.saveTemplate?.(tpl) ?? localStore.save(tpl),
      deleteTemplate: (id:string)=> svc.deleteTemplate?.(id) ?? localStore.delete(id),
      createTemplate: (name:string)=>{ const tpl=createEmptyTemplate(name); svc.saveTemplate?.(tpl); return tpl; }
    };
  }
  return {
    getTemplates: () => localStore.getAll(),
    getTemplate: (id:string) => localStore.getAll().find(t=>t.id===id),
    saveTemplate: (tpl:LabelTemplate) => localStore.save(tpl),
    deleteTemplate: (id:string) => localStore.delete(id),
    createTemplate: (name:string)=>{ const tpl=createEmptyTemplate(name); localStore.save(tpl); return tpl; }
  };
}

const DPI = 300;
const mm2px = (mm:number) => Math.round((mm * DPI) / 25.4);

function createEmptyTemplate(name:string): LabelTemplate {
  return { id: uuid(), name, category:'generic', size:{ width:50, height:30, unit:'mm', dpi:DPI }, variables:[], elements:[], createdBy:'operator', updatedAt: Date.now() };
}

function get(obj:any, path?:string):any { if (!path) return undefined; return path.split('.').reduce((acc,k)=> (acc?acc[k]:undefined), obj); }

function applyFormat(v:any, fmt?:string):string { if (v==null) return ''; if (!fmt) return String(v); if (fmt==='upper') return String(v).toUpperCase(); if (fmt==='lower') return String(v).toLowerCase(); const m=/^date:(.+)$/.exec(fmt); if (m){ const d=new Date(v); const pad=(n:number)=>String(n).padStart(2,'0'); const p=m[1]; return p.replace(/yyyy/g,String(d.getFullYear())).replace(/MM/g,pad(d.getMonth()+1)).replace(/dd/g,pad(d.getDate())).replace(/HH/g,pad(d.getHours())).replace(/mm/g,pad(d.getMinutes())).replace(/ss/g,pad(d.getSeconds())); } return String(v); }

function evalVar(vars:VarDef[], bind: LabelElement['bind'], record?:any){ if (!bind?.varKey) return undefined; const v=vars.find(v=>v.key===bind.varKey); if (!v) return bind.fallback ?? ''; const raw = v.source==='manual' ? (v.sampleValue ?? bind.fallback ?? '') : (record ? get(record, v.fieldPath) : (v.sampleValue ?? bind.fallback ?? '')); return applyFormat(raw ?? bind.fallback ?? '', v.format); }

function useFabricCanvas(widthMM:number, heightMM:number){
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const hostRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(()=>{
    const w=mm2px(widthMM); const h=mm2px(heightMM);
    const c=new fabric.Canvas(hostRef.current as HTMLCanvasElement,{ backgroundColor:'#fff', preserveObjectStacking:true, selection:true });
    c.setWidth(w); c.setHeight(h);
    const safe=new fabric.Rect({ left:mm2px(1.5), top:mm2px(1.5), width:w-mm2px(3), height:h-mm2px(3), fill:'rgba(0,0,0,0)', stroke:'#e5e7eb', strokeDashArray:[4,4], selectable:false, evented:false });
    c.add(safe); c.sendToBack(safe);
    canvasRef.current=c; return ()=>{ c.dispose(); canvasRef.current=null; };
  },[widthMM,heightMM]);
  return { canvasRef, hostRef };
}

function renderElement(c:fabric.Canvas, el:LabelElement, vars:VarDef[], record?:any){
  const common:any = { left: el.x, top: el.y, angle: el.rotate ?? 0 };
  if (el.type==='text'){
    const content = el.bind?.varKey ? (evalVar(vars, el.bind, record) ?? '') : (el as TextEl).text ?? '';
    const t = new fabric.IText(content||'', { ...common, fill: el.color || '#111', fontSize:(el as TextEl).size ?? 14, fontFamily:(el as TextEl).font || 'Arial', fontWeight:(el as TextEl).bold ? 'bold':'normal', fontStyle:(el as TextEl).italic ? 'italic':'normal', textAlign:(el as TextEl).align ?? 'left', editable:false });
    c.add(t); return t;
  }
  if (el.type==='barcode'){
    const value = el.bind?.varKey ? (evalVar(vars, el.bind, record) ?? '') : (el as BarcodeEl).value ?? '';
    const tmp=document.createElement('canvas');
    try{ JsBarcode(tmp, value || ' ', { format:(el as BarcodeEl).symbology || 'CODE128', displayValue:(el as BarcodeEl).showValue ?? false, margin:5, height: el.h ?? 40, width:2 }); } catch {}
    const url = tmp.toDataURL('image/png');
    return fabric.Image.fromURL(url, (img)=>{ img.set({ ...common }); if (el.w) img.scaleToWidth(el.w); c.add(img); c.requestRenderAll(); }) as unknown as fabric.Image;
  }
  if (el.type==='qr'){
    const value = el.bind?.varKey ? (evalVar(vars, el.bind, record) ?? '') : (el as QREl).value ?? '';
    return QRCode.toDataURL(value || ' ', { width: el.w ?? 120, margin:1, errorCorrectionLevel: (el as QREl).ecc ?? 'M' }).then(url=>{ fabric.Image.fromURL(url, (img)=>{ img.set({ ...common }); if (el.w) img.scaleToWidth(el.w); c.add(img); c.requestRenderAll(); }); });
  }
  if (el.type==='image'){
    const src=(el as ImgEl).src || '';
    return fabric.Image.fromURL(src, (img)=>{ img.set({ ...common }); if (el.w) img.scaleToWidth(el.w); c.add(img); c.requestRenderAll(); }) as unknown as fabric.Image;
  }
  if (el.type==='rect'){
    const r=new fabric.Rect({ ...common, width: el.w ?? 120, height: el.h ?? 60, fill: el.bg ?? 'rgba(0,0,0,0)', stroke: el.stroke ?? '#111', strokeWidth: el.strokeW ?? 1, rx:(el as RectEl).rx ?? 4, ry:(el as RectEl).ry ?? 4 }); c.add(r); return r;
  }
  if (el.type==='circle'){
    const r=new fabric.Circle({ ...common, radius:(el as CircleEl).radius ?? 24, fill: el.bg ?? 'rgba(0,0,0,0)', stroke: el.stroke ?? '#111', strokeWidth: el.strokeW ?? 1 }); c.add(r); return r;
  }
  if (el.type==='line'){
    const L=el as LineEl; const line=new fabric.Line([el.x, el.y, (L.x2 ?? el.x + (el.w ?? 100)), (L.y2 ?? el.y)], { stroke: el.stroke ?? '#111', strokeWidth: el.strokeW ?? 1 }); c.add(line); return line;
  }
}

export default function LabelStudio(){
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pasteOpen, setPasteOpen] = useState(false);
  const pasteResolveRef = useRef<(v:PasteDecision)=>void>();
  function showPasteOptions(): Promise<PasteDecision> {
    return new Promise((res)=>{ pasteResolveRef.current = res; setPasteOpen(true); });
  }

  // PDF Page Picker
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState<PDFFileLike | null>(null);
  const pdfResolveRef = useRef<(n:number|'cancel')=>void>();
  function askPdfPage(file: PDFFileLike): Promise<number|'cancel'> {
    setPdfFile(file);
    setPdfOpen(true);
    return new Promise((res)=>{ pdfResolveRef.current = res; });
  }
  const api = useMemo(()=> svcOrLocal(), []);
  const [templates, setTemplates] = useState<LabelTemplate[]>(()=> api.getTemplates() || []);
  const [currentId, setCurrentId] = useState<string>(()=> templates[0]?.id ?? '');
  const current = useMemo(()=> templates.find(t=>t.id===currentId) || templates[0] || createEmptyTemplate('New Template'), [templates, currentId]);
  const [activeTab, setActiveTab] = useState<'design'|'variables'|'preview'|'print'>('design');
  const [recordJSON, setRecordJSON] = useState<string>('{}');
  const record = useMemo(()=> { try { return JSON.parse(recordJSON); } catch { return {}; } }, [recordJSON]);
  const { canvasRef, hostRef } = useFabricCanvas(current.size.width, current.size.height);

  useEffect(()=>{ const c=canvasRef.current; if (!c) return; c.getObjects().forEach(o=>{ if ((o as any).selectable !== false) c.remove(o); }); current.elements.forEach(el=>{ renderElement(c, el, current.variables, record); }); }, [currentId, activeTab, recordJSON, current.size.width, current.size.height]);

  useEffect(()=>{
    if (!containerRef.current || !canvasRef.current) return;
    const cleanup = setupClipboardAndDnD({
      container: containerRef.current,
      canvas: canvasRef.current,
      onPasteOptions: async (_opts: PasteOptions) => {
        const choice = await showPasteOptions();
        return choice;
      },
      onPickPdfPage: async (file) => {
        const n = await askPdfPage(file);
        return n;
      }
    });
    return cleanup;
  }, [containerRef, canvasRef]);

  useEffect(()=>{
    const onKey = (e: KeyboardEvent)=>{
      const t = e.target as HTMLElement | null;
      const isEditable = t && (t.tagName==='INPUT' || t.tagName==='TEXTAREA' || (t as any).isContentEditable);
      if (isEditable) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='c'){
        if (canvasRef.current){ e.preventDefault(); copySelectionToClipboard(canvasRef.current); }
      }
    };
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, []);

  function persist(next: Partial<LabelTemplate>){ const merged = { ...current, ...next, updatedAt: Date.now() } as LabelTemplate; api.saveTemplate(merged); setTemplates(prev=>{ const i=prev.findIndex(t=>t.id===merged.id); if (i>=0){ const copy=[...prev]; copy[i]=merged; return copy; } return [...prev, merged]; }); }

  function addElement(kind: LabelElement['type']){
    const base: BaseEl = { id: uuid(), type: kind as any, x:20, y:20, color:'#111' };
    const el: LabelElement = kind==='text' ? ({ ...base, type:'text', text:'Text', size:14, font:'Arial', align:'left' } as TextEl)
      : kind==='barcode' ? ({ ...base, type:'barcode', symbology:'CODE128', value:'1234567890', h:40 } as BarcodeEl)
      : kind==='qr' ? ({ ...base, type:'qr', value:'https://example.com', w:120 } as QREl)
      : kind==='image' ? ({ ...base, type:'image', src:'https://via.placeholder.com/120', w:120 } as ImgEl)
      : kind==='rect' ? ({ ...base, type:'rect', w:120, h:60, stroke:'#111', strokeW:1, bg:'rgba(0,0,0,0)', rx:4, ry:4 } as RectEl)
      : kind==='circle' ? ({ ...base, type:'circle', radius:24, stroke:'#111', strokeW:1, bg:'rgba(0,0,0,0)' } as CircleEl)
      : ({ ...base, type:'line', w:100, h:1, stroke:'#111', strokeW:1 } as LineEl);
    persist({ elements: [...current.elements, el] });
  }

  function addVariable(){ const v:VarDef={ key:`var_${current.variables.length+1}`, label:'Variable', source:'manual', sampleValue:'Sample' }; persist({ variables:[...current.variables, v] }); }
  function updateVariable(i:number, patch:Partial<VarDef>){ const vs=[...current.variables]; vs[i] = { ...vs[i], ...patch }; persist({ variables: vs }); }
  function deleteVariable(i:number){ const vs=current.variables.slice(); vs.splice(i,1); persist({ variables: vs }); }

  function newTemplate(){ const t=api.createTemplate('New Template'); setTemplates(api.getTemplates()); setCurrentId(t.id); }
  function cloneTemplate(){ const t={ ...current, id: uuid(), name: `${current.name} (Copy)`, updatedAt: Date.now() }; api.saveTemplate(t); setTemplates(api.getTemplates()); setCurrentId(t.id); }
  function deleteTemplate(){ if (!confirm('Delete this template?')) return; api.deleteTemplate(current.id); const rest=api.getTemplates(); setTemplates(rest); setCurrentId(rest[0]?.id ?? ''); }

  function exportPNG(){ const c=canvasRef.current; if (!c) return; const data=c.toDataURL({ format:'png', multiplier:1 }); const a=document.createElement('a'); a.href=data; a.download=`${current.name}.png`; a.click(); }

  const [batchCount, setBatchCount] = useState<number>(1);
  function printBatch(){ const imgs:string[]=[]; const cv=document.createElement('canvas'); cv.width=mm2px(current.size.width); cv.height=mm2px(current.size.height); const fc=new fabric.Canvas(cv,{ backgroundColor:'#fff', preserveObjectStacking:true }); const doOne=async()=>{ fc.clear(); for (const el of current.elements) await renderElement(fc, el, current.variables, record); imgs.push(fc.toDataURL({ format:'png', multiplier:1 })); }; (async()=>{ for (let i=0;i<batchCount;i++) await doOne(); const win=window.open('','PRINT','height=600,width=800'); if (!win) return; win.document.write('<html><head><title>Print</title></head><body>'); imgs.forEach(src=>{ win!.document.write(`<img src="${src}" style="page-break-inside:avoid;margin:4mm;display:block;" />`); }); win.document.write('</body></html>'); win.document.close(); win.focus(); win.print(); })(); }

  return (
    <div ref={containerRef} className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={current.id} onValueChange={setCurrentId}>
            <SelectTrigger className="w-[280px]"><SelectValue placeholder="Select template" /></SelectTrigger>
            <SelectContent>
              {templates.map(t=> <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input className="w-[280px]" value={current.name} onChange={e=>persist({ name:e.target.value })} />
          <Select value={current.category} onValueChange={(v:Category)=>persist({ category:v })}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="generic">Generic</SelectItem>
              <SelectItem value="formula">Formula</SelectItem>
              <SelectItem value="sample">Sample</SelectItem>
              <SelectItem value="rawMaterial">Raw Material</SelectItem>
              <SelectItem value="finishedGood">Finished Good</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input type="number" className="w-24" value={current.size.width} onChange={e=>persist({ size:{...current.size, width:Number(e.target.value)} })} />
            <span>×</span>
            <Input type="number" className="w-24" value={current.size.height} onChange={e=>persist({ size:{...current.size, height:Number(e.target.value)} })} />
            <Badge variant="outline" className="ml-1">mm @ {current.size.dpi} DPI</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={newTemplate}><Plus className="h-4 w-4 mr-1" />New</Button>
          <Button variant="outline" onClick={cloneTemplate}><Copy className="h-4 w-4 mr-1" />Clone</Button>
          <Button variant="destructive" onClick={deleteTemplate}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
          <Button onClick={()=>persist({})}><Save className="h-4 w-4 mr-1" />Save</Button>
          <Button variant="outline" onClick={()=> canvasRef.current && copySelectionToClipboard(canvasRef.current)}><Copy className="h-4 w-4 mr-1" />Copy Selection</Button>
          <Button variant="outline" onClick={() => canvasRef.current && vectorizeActiveImage(canvasRef.current)}>Vectorize Selection (beta)</Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-2">
          <CardHeader><CardTitle>Tools</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={()=>addElement('text')}><Type className="h-4 w-4 mr-1" />Text</Button>
              <Button variant="outline" onClick={()=>addElement('image')}><ImageIcon className="h-4 w-4 mr-1" />Image</Button>
              <Button variant="outline" onClick={()=>addElement('rect')}><Square className="h-4 w-4 mr-1" />Rect</Button>
              <Button variant="outline" onClick={()=>addElement('circle')}><Circle className="h-4 w-4 mr-1" />Circle</Button>
              <Button variant="outline" onClick={()=>addElement('line')}><Layers className="h-4 w-4 mr-1" />Line</Button>
              <Button variant="outline" onClick={()=>addElement('barcode')}><Barcode className="h-4 w-4 mr-1" />Barcode</Button>
              <Button variant="outline" onClick={()=>addElement('qr')}><QrCode className="h-4 w-4 mr-1" />QR</Button>
            </div>
            <div className="pt-2 border-t">
              <Button className="w-full" variant="outline" onClick={exportPNG}><Download className="h-4 w-4 mr-1" />Export PNG</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-6">
          <CardHeader><CardTitle>Canvas</CardTitle></CardHeader>
          <CardContent>
            <div className="border rounded-lg p-2 bg-white inline-block">
              <canvas ref={hostRef as any} />
            </div>
            <div className="text-xs text-gray-500 mt-2">Size: {current.size.width}×{current.size.height} mm ({mm2px(current.size.width)}×{mm2px(current.size.height)} px)</div>
          </CardContent>
        </Card>

        <Card className="col-span-4">
          <CardHeader><CardTitle>Data & Preview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v:any)=>setActiveTab(v)}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="design">Variables</TabsTrigger>
                <TabsTrigger value="preview">Record Preview</TabsTrigger>
                <TabsTrigger value="print">Print</TabsTrigger>
              </TabsList>

              <TabsContent value="design" className="space-y-3">
                <div className="flex justify-between items-center">
                  <Button variant="outline" onClick={addVariable}><Plus className="h-4 w-4 mr-1" />Add Variable</Button>
                  <Badge variant="outline">{current.variables.length} vars</Badge>
                </div>
                {current.variables.length===0 ? (
                  <div className="text-sm text-gray-600">No variables yet. Add variables and bind elements to them (text/barcode/QR can bind).</div>
                ) : current.variables.map((v,i)=> (
                  <div key={v.key} className="p-2 rounded border space-y-2">
                    <div className="flex gap-2">
                      <Input className="w-40" value={v.key} onChange={e=>updateVariable(i,{key:e.target.value})} placeholder="key" />
                      <Input className="flex-1" value={v.label} onChange={e=>updateVariable(i,{label:e.target.value})} placeholder="label" />
                      <Select value={v.source} onValueChange={(val:VarSource)=>updateVariable(i,{source:val})}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="formula">Formula</SelectItem>
                          <SelectItem value="sample">Sample</SelectItem>
                          <SelectItem value="rawMaterial">Raw Material</SelectItem>
                          <SelectItem value="finishedGood">Finished Good</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="destructive" onClick={()=>deleteVariable(i)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={v.fieldPath ?? ''} onChange={e=>updateVariable(i,{fieldPath:e.target.value})} placeholder="field path (e.g. lotNumber)" />
                      <Input value={v.sampleValue ?? ''} onChange={e=>updateVariable(i,{sampleValue:e.target.value})} placeholder="sample value / preview" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={v.format ?? ''} onChange={e=>updateVariable(i,{format:e.target.value})} placeholder="format (upper, lower, date:yyyy-MM-dd)" />
                      <div className="text-xs text-gray-500 flex items-center gap-1"><ScanSearch className="h-3 w-3" /> Bind elements to this key in the element props (text/barcode/QR).</div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="preview" className="space-y-2">
                <div className="text-sm">Paste/enter a single preview record (JSON). Variables with non-manual sources will read from it.</div>
                <textarea className="w-full h-40 border rounded p-2 font-mono text-xs" value={recordJSON} onChange={e=>setRecordJSON(e.target.value)} />
                <div className="text-xs text-gray-600">Example: {"{ \"lotNumber\": \"A123\", \"formula\": { \"name\": \"Gel 2%\" } }"}</div>
              </TabsContent>

              <TabsContent value="print" className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input type="number" className="w-24" value={batchCount} onChange={e=>setBatchCount(Number(e.target.value))} />
                  <Button onClick={printBatch}><Printer className="h-4 w-4 mr-1" />Print {batchCount}</Button>
                </div>
                <div className="text-xs text-gray-500">For true label printers (ZPL/EPL/TSPL) we can add on-device drivers later. Today uses canvas → image → system print dialog.</div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <PasteOptionsDialog
        open={pasteOpen}
        onPick={(choice)=>{ setPasteOpen(false); pasteResolveRef.current?.(choice); }}
        onCancel={()=>{ setPasteOpen(false); pasteResolveRef.current?.('cancel'); }}
      />

      <PdfPagePickerDialog
        open={pdfOpen}
        file={pdfFile}
        onPick={(page)=>{ setPdfOpen(false); pdfResolveRef.current?.(page); }}
        onCancel={()=>{ setPdfOpen(false); pdfResolveRef.current?.('cancel'); }}
      />
    </div>
  );
}

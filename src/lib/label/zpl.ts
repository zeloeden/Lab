export type VarDef = { key: string; label: string; source: string; fieldPath?: string; format?: string };
export type LabelElement = any;
export type LabelTemplate = {
  id: string;
  name: string;
  size: { width: number; height: number; unit: 'mm'|'px'; dpi: number };
  variables: VarDef[];
  elements: LabelElement[];
};

const dotsPerMM = 12; // 300dpi
const mmToDots = (mm:number) => Math.round(mm * dotsPerMM);

export function toZPL(tpl: LabelTemplate, record?: any){
  const mm = (n:number)=> (tpl.size.unit==='px' ? Math.round((n/ tpl.size.dpi) * 25.4) : n);
  let out = '^XA\n';
  // size not strictly needed for ZPL; most printers use label setup
  for (const el of tpl.elements){
    const x = mmToDots(mm(el.x));
    const y = mmToDots(mm(el.y));
    out += `^FO${x},${y}`;
    if (el.type === 'text'){
      const h = mmToDots(5); // approx
      const v = (el.text || '').toString();
      out += `^A0N,${h},${h}^FD${sanitize(v)}^FS\n`;
    } else if (el.type === 'barcode'){
      const h = mmToDots(20);
      const v = (el.value || '').toString();
      out += `^BCN,${h},N,N,N^FD${sanitize(v)}^FS\n`;
    } else if (el.type === 'qr'){
      const v = (el.value || '').toString();
      out += `^BQN,2,10^FDLA,${sanitize(v)}^FS\n`;
    } else if (el.type === 'rect'){
      const w = mmToDots(mm(el.w||10));
      const h = mmToDots(mm(el.h||10));
      const th = Math.max(1, mmToDots(0.2));
      out += `^GB${w},${h},${th},B,0^FS\n`;
    } else if (el.type === 'line'){
      const w = mmToDots(mm(el.w||10));
      const th = Math.max(1, mmToDots(0.2));
      out += `^GB${w},0,${th},B,0^FS\n`;
    }
  }
  out += '^XZ';
  return out;
}

function sanitize(s:string){ return s.replace(/\^/g,'').replace(/~/g,'-'); }



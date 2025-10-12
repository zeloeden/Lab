import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type Bind = { varKey?: string; fallback?: string };

type CommonProps = {
  id: string;
  type: 'text'|'barcode'|'qr'|'image'|'rect'|'circle'|'line';
  x: number; y: number; w?: number; h?: number;
  rotate?: number; color?: string; bg?: string; stroke?: string; strokeW?: number;
  bind?: Bind;
  // type-specific
  text?: string; font?: string; size?: number; bold?: boolean; italic?: boolean; align?: 'left'|'center'|'right';
  symbology?: 'CODE128'|'EAN13'|'EAN8'|'UPC'|'CODE39'; showValue?: boolean; value?: string;
  ecc?: 'L'|'M'|'Q'|'H'; src?: string;
};

export type InspectorProps = {
  selected: CommonProps | null;
  variables: { key: string; label: string }[];
  readOnly?: boolean;
  onChange: (patch: Partial<CommonProps>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

export const ElementInspector: React.FC<InspectorProps> = ({ selected, variables, readOnly, onChange, onDelete, onDuplicate }) => {
  if (!selected) return <div className="text-sm text-gray-600">Select an element on the canvas to edit its properties.</div>;

  const disabled = !!readOnly;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Input disabled={disabled} type="number" value={selected.x} onChange={e=>onChange({ x: Number(e.target.value) })} placeholder="x" />
        <Input disabled={disabled} type="number" value={selected.y} onChange={e=>onChange({ y: Number(e.target.value) })} placeholder="y" />
        <Input disabled={disabled} type="number" value={selected.rotate ?? 0} onChange={e=>onChange({ rotate: Number(e.target.value) })} placeholder="rot" />
      </div>
      {['text','barcode','qr','image','rect','circle','line'].includes(selected.type) && (
        <div className="grid grid-cols-2 gap-2">
          <Input disabled={disabled} value={selected.color ?? ''} onChange={e=>onChange({ color: e.target.value })} placeholder="color (#111)" />
          <Input disabled={disabled} value={selected.stroke ?? ''} onChange={e=>onChange({ stroke: e.target.value })} placeholder="stroke" />
          <Input disabled={disabled} type="number" value={selected.strokeW ?? 1} onChange={e=>onChange({ strokeW: Number(e.target.value) })} placeholder="strokeW" />
          <Input disabled={disabled} value={selected.bg ?? ''} onChange={e=>onChange({ bg: e.target.value })} placeholder="bg rgba" />
        </div>
      )}
      {selected.type === 'text' && (
        <div className="space-y-2">
          <Input disabled={disabled} value={selected.text ?? ''} onChange={e=>onChange({ text: e.target.value })} placeholder="text" />
          <div className="grid grid-cols-3 gap-2">
            <Input disabled={disabled} value={selected.font ?? 'Arial'} onChange={e=>onChange({ font: e.target.value })} placeholder="font" />
            <Input disabled={disabled} type="number" value={selected.size ?? 14} onChange={e=>onChange({ size: Number(e.target.value) })} placeholder="size" />
            <Select disabled={disabled} value={selected.align ?? 'left'} onValueChange={(v:any)=>onChange({ align: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">left</SelectItem>
                <SelectItem value="center">center</SelectItem>
                <SelectItem value="right">right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      {selected.type === 'barcode' && (
        <div className="space-y-2">
          <Select disabled={disabled} value={selected.symbology ?? 'CODE128'} onValueChange={(v:any)=>onChange({ symbology: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CODE128">CODE128</SelectItem>
              <SelectItem value="EAN13">EAN13</SelectItem>
              <SelectItem value="EAN8">EAN8</SelectItem>
              <SelectItem value="UPC">UPC</SelectItem>
              <SelectItem value="CODE39">CODE39</SelectItem>
            </SelectContent>
          </Select>
          <Input disabled={disabled} value={selected.value ?? ''} onChange={e=>onChange({ value: e.target.value })} placeholder="value" />
        </div>
      )}
      {selected.type === 'qr' && (
        <div className="space-y-2">
          <Select disabled={disabled} value={selected.ecc ?? 'M'} onValueChange={(v:any)=>onChange({ ecc: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="L">L</SelectItem>
              <SelectItem value="M">M</SelectItem>
              <SelectItem value="Q">Q</SelectItem>
              <SelectItem value="H">H</SelectItem>
            </SelectContent>
          </Select>
          <Input disabled={disabled} value={selected.value ?? ''} onChange={e=>onChange({ value: e.target.value })} placeholder="value" />
        </div>
      )}
      {selected.type === 'image' && (
        <Input disabled={disabled} value={selected.src ?? ''} onChange={e=>onChange({ src: e.target.value })} placeholder="image URL" />
      )}
      {/* Bindings */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500">Binding</div>
        <div className="grid grid-cols-2 gap-2">
          <Select disabled={disabled} value={selected.bind?.varKey ?? ''} onValueChange={(v:any)=>onChange({ bind: { ...(selected.bind||{}), varKey: v } })}>
            <SelectTrigger><SelectValue placeholder="var key" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">(none)</SelectItem>
              {variables.map(v=> <SelectItem key={v.key} value={v.key}>{v.key}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input disabled={disabled} value={selected.bind?.fallback ?? ''} onChange={e=>onChange({ bind: { ...(selected.bind||{}), fallback: e.target.value } })} placeholder="fallback" />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button disabled={disabled} variant="outline" onClick={onDuplicate}>Duplicate</Button>
        <Button disabled={disabled} variant="destructive" onClick={onDelete}>Delete</Button>
      </div>
    </div>
  );
};



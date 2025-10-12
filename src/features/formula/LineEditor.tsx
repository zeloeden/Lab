import { useMemo, useState } from 'react';
import { LineForm, LineFormT, resolveGrams, toleranceAbsG, validateLine } from './LineSchema';

export function LineEditor({
  initial,
  batchTotalG,
  onSave,
  onCancel,
}: {
  initial: Partial<LineFormT>;
  batchTotalG?: number;
  onSave: (line: LineFormT & { resolvedGrams: number; tolAbsG: number }) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<LineFormT>(
    LineForm.parse({
      sequence: 1,
      ingredientId: '',
      codeMode: 'plain',
      qtyMode: 'grams',
      tolerancePct: 0.5,
      toleranceMinAbsG: 0.010,
      allowedSymbologies: ['any'],
      ...initial,
    })
  );

  function upd<K extends keyof LineFormT>(k: K, v: LineFormT[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  const grams = useMemo(() => resolveGrams(form, batchTotalG), [form, batchTotalG]);
  const tolAbs = useMemo(
    () => (grams !== undefined ? toleranceAbsG(grams, form.tolerancePct, form.toleranceMinAbsG) : undefined),
    [grams, form.tolerancePct, form.toleranceMinAbsG]
  );
  const v = validateLine(form, batchTotalG);

  return (
    <div className="space-y-3 p-4 border rounded-2xl">
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col">
          <span>Sequence</span>
          <input type="number" className="input" value={form.sequence}
            onChange={e=>upd('sequence', parseInt(e.target.value||'0',10))}/>
        </label>

        <label className="flex flex-col">
          <span>Ingredient ID</span>
          <input className="input" value={form.ingredientId}
            onChange={e=>upd('ingredientId', e.target.value)}/>
        </label>

        <label className="flex flex-col">
          <span>Symbology Filter</span>
          <select className="input" value={form.allowedSymbologies[0] ?? 'any'}
            onChange={e=>upd('allowedSymbologies', [e.target.value as any])}>
            <option value="any">Any</option>
            <option value="qr">QR</option>
            <option value="code128">Code128</option>
            <option value="ean">EAN</option>
            <option value="datamatrix">DataMatrix</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="flex items-center gap-2">
          <input type="radio" checked={form.codeMode==='plain'} onChange={()=>upd('codeMode','plain')}/> Plain
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={form.codeMode==='gs1'} onChange={()=>upd('codeMode','gs1')}/> GS1
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={form.codeMode==='kv'} onChange={()=>upd('codeMode','kv')}/> Key=Value
        </label>
      </div>

      {form.codeMode==='gs1' ? (
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col">
            <span>GTIN (AI 01)</span>
            <input className="input" value={form.gtin ?? ''} onChange={e=>upd('gtin', e.target.value)}/>
          </label>
          <label className="flex flex-col col-span-2">
            <span>Code Aliases (comma-sep, optional)</span>
            <input className="input" value={(form.codeAliases ?? []).join(',')}
              onChange={e=>upd('codeAliases', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}/>
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col">
            <span>Code Value</span>
            <input className="input" value={form.codeValue ?? ''} onChange={e=>upd('codeValue', e.target.value)}/>
          </label>
          <label className="flex flex-col col-span-2">
            <span>Code Aliases (comma-sep, optional)</span>
            <input className="input" value={(form.codeAliases ?? []).join(',')}
              onChange={e=>upd('codeAliases', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}/>
          </label>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <label className="flex items-center gap-2">
          <input type="radio" checked={form.qtyMode==='grams'} onChange={()=>upd('qtyMode','grams')}/> Grams
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={form.qtyMode==='percent'} onChange={()=>upd('qtyMode','percent')}/> % of Batch
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={form.qtyMode==='volume'} onChange={()=>upd('qtyMode','volume')}/> Volume × Density
        </label>
      </div>

      {form.qtyMode==='grams' && (
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col">
            <span>Target (g)</span>
            <input type="number" step="0.001" className="input" value={form.targetQtyG ?? ''}
              onChange={e=>upd('targetQtyG', Number(e.target.value))}/>
          </label>
        </div>
      )}
      {form.qtyMode==='percent' && (
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col">
            <span>% of Batch</span>
            <input type="number" step="0.001" className="input" value={form.percentOfBatch ?? ''}
              onChange={e=>upd('percentOfBatch', Number(e.target.value))}/>
          </label>
          <div className="flex flex-col">
            <span>Batch Total (g)</span>
            <input className="input" value={batchTotalG ?? ''} readOnly />
          </div>
        </div>
      )}
      {form.qtyMode==='volume' && (
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col">
            <span>Volume (mL)</span>
            <input type="number" step="0.001" className="input" value={form.targetVolumeMl ?? ''}
              onChange={e=>upd('targetVolumeMl', Number(e.target.value))}/>
          </label>
          <label className="flex flex-col">
            <span>Density (g/mL)</span>
            <input type="number" step="0.001" className="input" value={form.density_g_per_ml ?? ''}
              onChange={e=>upd('density_g_per_ml', Number(e.target.value))}/>
          </label>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col">
          <span>Tolerance %</span>
          <input type="number" step="0.01" className="input" value={form.tolerancePct}
            onChange={e=>upd('tolerancePct', Number(e.target.value))}/>
        </label>
        <label className="flex flex-col">
          <span>Tolerance Min (g)</span>
          <input type="number" step="0.001" className="input" value={form.toleranceMinAbsG}
            onChange={e=>upd('toleranceMinAbsG', Number(e.target.value))}/>
        </label>
        <div className="flex flex-col">
          <span>Resolved Grams</span>
          <input className="input" readOnly value={grams !== undefined ? grams.toFixed(3) : '—'} />
        </div>
      </div>

      {tolAbs !== undefined && (
        <div className="text-sm text-gray-600">
          Tolerance Abs (g): <b>{tolAbs.toFixed(3)}</b> (max of % and min abs)
        </div>
      )}

      {!v.ok && (
        <ul className="list-disc ml-5 text-red-600">
          {v.issues.map((msg, i)=><li key={i}>{msg}</li>)}
        </ul>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <button className="px-3 py-1 border rounded" onClick={onCancel}>Cancel</button>}
        <button
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          disabled={!v.ok || grams===undefined}
          onClick={()=> onSave({ ...form, resolvedGrams: grams!, tolAbsG: tolAbs! })}
        >
          Save Line
        </button>
      </div>
    </div>
  );
}



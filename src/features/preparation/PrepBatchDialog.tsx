import { useEffect, useMemo, useState } from 'react';
import { buildStepsDefFromFormula, OverrideBatch } from '@/lib/data/buildStepsDef';

export type PrepUnit = 'g'|'kg'|'ml'|'L';

export function PrepBatchDialog({
  open,
  formula,
  getRawMaterial,
  onCancel,
  onConfirm
}:{
  open: boolean;
  formula: any;
  getRawMaterial: (id:string)=>any | undefined;
  onCancel: () => void;
  onConfirm: (size:number, unit:PrepUnit) => void;
}) {
  const [size,setSize] = useState<number>(100);
  const [unit,setUnit] = useState<PrepUnit>('g');
  const [error,setError] = useState<string|null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setPreview([]);
      return;
    }
    
    (async () => {
      try {
        setError(null);
        const overrideBatch: OverrideBatch = { size, unit };
        const steps = await buildStepsDefFromFormula(formula, { getRawMaterial, overrideBatch });
        setPreview(steps);
      } catch (e:any) {
        setError(e?.message ?? String(e));
        setPreview([]);
      }
    })();
  }, [open, formula, getRawMaterial, size, unit]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-2xl w-[680px] space-y-3">
        <div className="text-lg font-semibold">Preparation Size</div>

        <div className="grid grid-cols-3 gap-2">
          <label className="col-span-2 flex flex-col">
            <span>Amount</span>
            <input className="border rounded px-2 py-1" type="number" step="0.001"
              value={size} onChange={e=>setSize(Number(e.target.value))}/>
          </label>
          <label className="flex flex-col">
            <span>Unit</span>
            <select className="border rounded px-2 py-1" value={unit} onChange={e=>setUnit(e.target.value as any)}>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">mL</option>
              <option value="L">L</option>
            </select>
          </label>
        </div>

        {error ? (
          <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        ) : (
          <div className="max-h-72 overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Seq</th>
                  <th className="text-left p-2">Ingredient</th>
                  <th className="text-left p-2">Target (g)</th>
                  <th className="text-left p-2">Tolerance</th>
                  <th className="text-left p-2">Scan Code</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((s:any)=>(
                  <tr key={s.sequence} className="border-t">
                    <td className="p-2">{s.sequence}</td>
                    <td className="p-2">{s.displayName || s.ingredientId}</td>
                    <td className="p-2">{s.targetQtyG.toFixed(3)} g</td>
                    <td className="p-2">±{Math.max(s.targetQtyG*(s.tolerancePct/100), s.toleranceMinAbsG).toFixed(3)} g</td>
                    <td className="p-2">{s.parser==='gs1' ? `(01) ${s.code}` : s.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 border rounded" onClick={onCancel}>Cancel</button>
          <button
            className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
            disabled={!!error}
            onClick={()=> onConfirm(size, unit)}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}




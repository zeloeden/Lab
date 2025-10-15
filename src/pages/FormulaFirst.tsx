import { useEffect, useMemo, useState } from 'react';
import { CodeInput } from '@/components/CodeInput';
import { PrepBatchDialog } from '@/features/preparation/PrepBatchDialog';
import { Wizard as PreparationWizard } from '@/features/preparation/Wizard';
import { buildStepsDefFromFormula } from '@/lib/data/buildStepsDef';
import { resolveScanToPreparationRoute } from '@/services/scanResolver.client';
import { useAuth } from '@/contexts/AuthContext';


type Formula = any;

export default function FormulaFirst(){
  const { user } = useAuth();
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [selected, setSelected] = useState<Formula|null>(null);
  const [batch, setBatch] = useState<{ size:number; unit:'g'|'kg'|'ml'|'L' }|null>(null);
  const [prepOpen, setPrepOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [stepsDef, setStepsDef] = useState<any[]>([]);
  const [error, setError] = useState<string|null>(null);
  const [scanCtx, setScanCtx] = useState<{ sampleId?:string; ordinal?:number }|null>(null);

  useEffect(()=>{
    try {
      const raw = localStorage.getItem('nbslims_formulas');
      setFormulas(raw ? JSON.parse(raw) : []);
    } catch { setFormulas([]); }
    // If navigated here with a search param q=F=...;S=...;N=..., resolve automatically
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams.get('q');
      if (q) tryResolveFormulaFromQRText(q);
      // Also accept legacy QR payloads that are data URLs with embedded JSON
      // If the query contains a data URL, try to parse the inner text
    } catch {}
  },[]);

  function tryResolveFormulaFromQRText(text:string){
    const res = resolveScanToPreparationRoute(text);
    if ((res as any).ok) { window.location.href = (res as any).route; return true; }
    setError((res as any).msg || 'Scan not recognized'); return false;
  }

  const header = useMemo(()=>{
    if (!selected) return 'Scan formula QR to begin';
    const parts:string[] = [`Formula: ${selected.name}`];
    if (scanCtx?.ordinal) parts.push(`(#${scanCtx.ordinal})`);
    if (scanCtx?.sampleId) parts.push(`for Sample ${scanCtx.sampleId}`);
    if (scanCtx?.sampleId && selected.sampleId && scanCtx.sampleId !== selected.sampleId){
      parts.push('[QR sample mismatch]');
    }
    return parts.join(' ');
  }, [selected, scanCtx]);

  useEffect(()=>{
    if (!selected || !batch) return;
    try {
      setError(null);
      const rmMap = new Map<string, any>();
      try {
        const raw = localStorage.getItem('nbslims_raw_materials');
        if (raw) JSON.parse(raw).forEach((rm: any)=> rmMap.set(rm.id, rm));
      } catch {}
      const getRawMaterial = (id: string) => rmMap.get(id);
      const steps = buildStepsDefFromFormula(selected as any, { getRawMaterial, overrideBatch: batch });
      setStepsDef(steps);
      setShowWizard(true);
    } catch (e:any) {
      setError(e?.message || 'Unable to build preparation steps');
      setShowWizard(false);
    }
  }, [selected, batch]);

  return (
    <div className="p-4 space-y-4">
      <div className="text-xl font-semibold">Formula First</div>
      <div className="text-gray-600">{header}</div>
      {scanCtx?.sampleId && selected?.sampleId && scanCtx.sampleId !== selected.sampleId && (
        <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">Warning: QR indicates Sample {scanCtx.sampleId}, but formula belongs to Sample {selected.sampleId}.</div>
      )}

      {!selected && (
        <div className="space-y-3">
          <div className="text-sm text-gray-700">Scan the formula QR or enter its code:</div>
          <CodeInput
            requiredCodeValue={''}
            altCodeValues={[]}
            allowedSymbologies={['any']}
            parser={'plain'}
            onPass={({ text })=>{ tryResolveFormulaFromQRText(text); }}
            onFail={()=>{}}
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      )}

      {selected && !batch && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">Ready: {selected.name}</div>
            <button className="px-3 py-1 rounded bg-black text-white" onClick={()=> setPrepOpen(true)}>Set Batch Size</button>
          </div>
          <PrepBatchDialog
            open={prepOpen}
            formula={selected}
            getRawMaterial={(id:string)=>{
              try { const raw = localStorage.getItem('nbslims_raw_materials'); if (!raw) return undefined; const arr = JSON.parse(raw); return arr.find((r:any)=> r.id===id); } catch { return undefined; }
            }}
            onCancel={()=> setPrepOpen(false)}
            onConfirm={(size, unit)=>{ setPrepOpen(false); setBatch({ size, unit }); }}
          />
        </div>
      )}

      {showWizard && selected && batch && stepsDef.length>0 && (
        <div className="mt-2">
          <PreparationWizard
            formula={{ id: selected.id, name: selected.name }}
            stepsDef={stepsDef}
            operator={user?.fullName || user?.id || 'operator'}
          />
        </div>
      )}
    </div>
  );
}



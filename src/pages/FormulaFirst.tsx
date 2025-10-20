import { useEffect, useMemo, useState, useRef } from 'react';
import { CodeInput } from '@/components/CodeInput';
import { PrepBatchDialog } from '@/features/preparation/PrepBatchDialog';
import { Wizard as PreparationWizard } from '@/features/preparation/Wizard';
import { buildStepsDefFromFormula } from '@/lib/data/buildStepsDef';
import { resolveScanToPreparationRoute } from '@/services/scanResolver.client';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { parseQR, normalizeScan } from '@/lib/qr';
import { getFormulaByAny, listFormulaCodes } from '@/services/formulas';
import { db } from '@/lib/db';
import { startOrResumeForFormula } from '@/services/sessions';
import { NotFoundFormula } from '@/components/NotFoundFormula';


type Formula = any;

export default function FormulaFirst(){
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  
  // Read and normalize query param (accept both 'q' and 'code')
  const rawParam = (sp.get('q') ?? sp.get('code') ?? '').trim();
  const normalized = normalizeScan(rawParam);
  const auto = sp.get('auto') || '';
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [selected, setSelected] = useState<Formula|null>(null);
  const [batch, setBatch] = useState<{ size:number; unit:'g'|'kg'|'ml'|'L' }|null>(null);
  const [prepOpen, setPrepOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [stepsDef, setStepsDef] = useState<any[]>([]);
  const [error, setError] = useState<string|null>(null);
  const [scanCtx, setScanCtx] = useState<{ sampleId?:string; ordinal?:number }|null>(null);
  const [currentFormula, setCurrentFormula] = useState<Formula|null>(null);

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

  // Parse QR and extract candidate key
  const parsed = useMemo(() => {
    if (!normalized) return null;
    const result = parseQR(normalized);
    console.debug('[formula-first] normalized=', normalized, 'parsed=', result);
    return result;
  }, [normalized]);
  
  const candidateKey = useMemo(() => {
    if (!parsed) return '';
    return parsed.formulaId ?? parsed.formulaCode ?? normalized;
  }, [parsed, normalized]);

  // Query formula using new centralized lookup
  const formulaByCode = useQuery({
    queryKey: ['formulaByCode', candidateKey],
    queryFn: () => getFormulaByAny(candidateKey),
    enabled: !!candidateKey,
  });

  const didAutoRef = useRef(false);
  useEffect(()=>{
    console.debug('[formula-first]', { 
      candidateKey, 
      isLoading: formulaByCode.isLoading, 
      hasData: !!formulaByCode.data,
      auto 
    });
    
    if (!candidateKey) return;
    if (!formulaByCode.data || !(formulaByCode.data as any).id) return;
    
    if (auto === 'start' && !didAutoRef.current){
      didAutoRef.current = true;
      const defaultAmount = Number(sp.get('amount') ?? 100);
      const defaultUnit   = (sp.get('unit') ?? 'g') as 'g'|'kg'|'ml'|'L';
      
      (async () => {
        try {
          // Smart routing: start new session OR resume/test last one
          const formula = formulaByCode.data as any;
          const { mode, session } = await startOrResumeForFormula({
            id: formula.id,
            code: formula.internalCode || formula.id,
            internalCode: formula.internalCode,
            name: formula.name,
            steps: formula.ingredients || []
          });
          
          console.debug('[prep-start]', mode, session.id, 'sessionFormula:', session.formulaCode);
          
          sp.delete('auto');
          setSp(sp, { replace: true });
          
          if (mode === 'prep') {
            // Open modal instead of navigating to a route
            setCurrentFormula(formula);
            setSelected(formula);
            setPrepOpen(true); // Open batch size dialog
          } else {
            // Resume test management for the latest session of that formula
            navigate(`/test-management?sessionId=${session.id}`, { replace: true });
          }
        } catch (e: any) {
          console.error('[formula-first] session routing failed:', e);
          setError(e?.message || 'Failed to start preparation');
          sp.delete('auto'); setSp(sp, { replace: true });
        }
      })();
    } else if (!auto && !prepOpen) {
      // Legacy behavior: open modal instead of navigating
      setCurrentFormula(formulaByCode.data as any);
      setSelected(formulaByCode.data as any);
      setPrepOpen(true);
    }
  }, [candidateKey, formulaByCode.data, formulaByCode.isLoading, auto, sp, navigate, prepOpen]);

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
    (async () => {
      try {
        setError(null);
        const rmMap = new Map<string, any>();
        try {
          const raw = localStorage.getItem('nbslims_raw_materials');
          if (raw) JSON.parse(raw).forEach((rm: any)=> rmMap.set(rm.id, rm));
        } catch {}
        const getRawMaterial = (id: string) => rmMap.get(id);
        const steps = await buildStepsDefFromFormula(selected as any, { getRawMaterial, overrideBatch: batch });
        setStepsDef(steps);
        setShowWizard(true);
      } catch (e:any) {
        setError(e?.message || 'Unable to build preparation steps');
        setShowWizard(false);
      }
    })();
  }, [selected, batch]);

  // Early return check AFTER all hooks
  if (candidateKey && formulaByCode.isSuccess && !formulaByCode.data) {
    return <NotFoundFormula code={candidateKey} />;
  }

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
             onCancel={()=> {
               setPrepOpen(false);
               setSelected(null);
               setBatch(null);
               setError(null);
               // Navigate to formulas page
               navigate('/formulas', { replace: true });
               // Show toast
               import('sonner').then(({ toast }) => {
                 toast.info('Cancelled');
               });
             }}
             onConfirm={(size, unit)=>{ setPrepOpen(false); setBatch({ size, unit }); }}
           />
        </div>
      )}

      {/* Guided Preparation Wizard (Modal-based) */}
      {showWizard && selected && batch && stepsDef.length>0 && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowWizard(false);
              setBatch(null);
              import('sonner').then(({ toast }) => {
                toast.info('Cancelled');
              });
            }
          }}
          tabIndex={-1}
        >
          <div className="bg-white rounded-2xl w-[95vw] h-[90vh] max-w-6xl overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Guided Preparation: {selected.name}</div>
                <div className="text-sm text-gray-600">Preparing {batch.size} {batch.unit} batch</div>
              </div>
              <button 
                onClick={() => { 
                  setShowWizard(false); 
                  setBatch(null);
                  import('sonner').then(({ toast }) => {
                    toast.info('Cancelled');
                  });
                }}
                className="text-gray-500 hover:text-gray-700 p-2 text-2xl leading-none"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <PreparationWizard
                formula={{ id: selected.id, name: selected.name }}
                stepsDef={stepsDef}
                operator={user?.fullName || user?.id || 'operator'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



import { create } from 'zustand';
import { db } from '@/lib/db';
import { validateSampleIntegrity } from '@/lib/sampleGuards';

type Status = 'idle'|'scanning'|'taring'|'weighing'|'failed'|'locked_failed'|'done';
export interface StepCtx { id:string; sequence:number; ingredientId:string; requiredCodeValue:string; altCodeValues?:string[]; allowedSymbologies?: ('any'|'qr'|'code128'|'ean'|'datamatrix')[]; parser?: 'plain'|'gs1'|'kv'; targetQtyG:number; toleranceAbsG:number; }

interface State {
  sessionId?:string; attemptNo:number; status:Status; steps:StepCtx[]; idx:number; codeUnlocked:boolean;
  start:(formulaId:string, steps:StepCtx[], operator:string)=>Promise<void>;
  unlockStep:()=>void;
  markFailed:(reason:string, hard:boolean)=>Promise<void>;
  confirmStep:(capturedG:number)=>Promise<void>;
  supervisorOverride:(supervisor:string, reason:string)=>Promise<void>;
  overrideAndRestart:(supervisor:string, reason:string)=>Promise<void>;
}

export const useWizard = create<State>((set,get)=>({
  attemptNo:0, status:'idle', steps:[], idx:0, codeUnlocked:false,
  start: async (formulaId, steps, operator) => {
    const attemptNo = (await db.sessions.where('formulaId').equals(formulaId).count()) + 1;
    const sessionId = crypto.randomUUID();
    await db.sessions.add({ id:sessionId, formulaId, attemptNo, status:'in_progress', operator, startedAt:Date.now() });
    await db.events.add({ sessionId, ts:Date.now(), user:operator, action:'SESSION_START', payload:{ formulaId, attemptNo }});
    for (const s of steps){
      await db.steps.add({ id:s.id, sessionId, sequence:s.sequence, ingredientId:s.ingredientId, requiredCodeValue:s.requiredCodeValue, altCodeValues:s.altCodeValues, allowedSymbologies:s.allowedSymbologies, parser:s.parser ?? 'plain', targetQtyG:s.targetQtyG, toleranceAbsG:s.toleranceAbsG, status:'pending' });
    }
    set({ sessionId, attemptNo, steps, idx:0, status:'scanning', codeUnlocked:false });
  },
  unlockStep: () => set({ codeUnlocked:true, status:'taring' }),
  markFailed: async (reason, hard) => {
    const { sessionId } = get(); if (!sessionId) return;
    await db.sessions.update(sessionId, { status: hard?'locked_failed':'failed', endedAt: Date.now() });
    await db.events.add({ sessionId, ts:Date.now(), user:'operator', action: hard?'HARD_STOP':'FAIL', payload:{ reason } });
    set({ status: hard?'locked_failed':'failed' });
  },
  confirmStep: async (capturedG) => {
    const { sessionId, steps, idx } = get(); if (!sessionId) return;
    const step = steps[idx];
    const within = Math.abs(capturedG - step.targetQtyG) <= step.toleranceAbsG;
    if (!within) return get().markFailed('OUT_OF_TOLERANCE', false);
    await db.events.add({ sessionId, ts:Date.now(), user:'operator', action:'STEP_OK', payload:{ step:step.sequence, capturedG } });
    // persist capture on the step
    try { await db.steps.update(step.id, { capturedQtyG: capturedG, status:'ok', capturedAt: Date.now() }); } catch {}
    const nextIdx = idx+1;
    if (nextIdx >= steps.length) {
      await db.sessions.update(sessionId, { status:'completed', endedAt:Date.now() });
      set({ status:'done' });
      try {
        // Upsert a Sample (FORMULA, actual) for this preparation session in localStorage
        const raw = localStorage.getItem('nbslims_enhanced_samples');
        const samples = raw ? JSON.parse(raw) : [];
        const session = await db.sessions.get(sessionId as any);
        const existing = samples.find((s:any)=> s.preparationSessionId === sessionId);
        const stepsRows = await db.steps.where('sessionId').equals(sessionId).toArray();
        const to4 = (n:number|undefined) => n === undefined ? undefined : parseFloat(Number(n).toFixed(4));
        const traces = stepsRows.map((r:any)=>({ id: crypto.randomUUID(), sampleId: '', rmId: r.ingredientId, lotId: r.lotId ?? undefined, qtyPlanned: to4(r.targetQtyG), qtyActual: to4(r.capturedQtyG), uom: 'g' }));
        if (existing){
          existing.source = 'FORMULA'; existing.traceability = 'actual'; existing.status = 'Untested';
          existing.preparationSessionId = sessionId; existing.formulaVersionId = session?.formulaVersionId || session?.formulaId; existing.formulaId = session?.formulaId; existing.formulaVersionLabel = existing.formulaVersionLabel || 'unversioned'; existing.updatedAt = new Date();
          existing.materialTrace = traces;
        } else {
          samples.unshift({ id: `sample-${Date.now()}`, sampleNo: (samples.length+1), itemNameEN: (session?.formulaId || 'Formula'), supplierId: '', status: 'Untested', createdAt: new Date(), updatedAt: new Date(), source: 'FORMULA', traceability: 'actual', preparationSessionId: sessionId, formulaVersionId: session?.formulaVersionId || session?.formulaId, formulaId: session?.formulaId, formulaVersionLabel: 'unversioned', materialTrace: traces });
        }
        // Integrity enforcement for FORMULA samples
        const latest = existing || samples[0];
        if (latest && latest.source === 'FORMULA'){
          latest.traceability = 'actual';
          if (!latest.preparationSessionId) latest.preparationSessionId = sessionId;
        }
        // Central guard validation
        if (latest) {
          validateSampleIntegrity(latest);
        }
        localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(samples));
        const newId = existing?.id || samples[0].id;
        try { (await import('@/lib/telemetry')).telemetry.emit('prep.completed.sampleUpserted', { sampleId: newId, preparationSessionId: sessionId, created: !existing, source:'FORMULA', traceability:'actual' }); } catch {}
        try { (await import('@/features/preparations/costing')).computeAndAttachSampleCost(newId); } catch {}
        window.dispatchEvent(new CustomEvent('sampleCreated', { detail: { sampleId: newId } }));
        // Auto-navigate to Samples and highlight
        try { window.location.href = `/samples?highlightByPrep=${encodeURIComponent(sessionId)}`; } catch {}
      } catch {}
    }
    else set({ idx:nextIdx, status:'scanning', codeUnlocked:false });
  },
  supervisorOverride: async (supervisor, reason) => {
    const { sessionId } = get(); if (!sessionId) return;
    await db.events.add({ sessionId, ts:Date.now(), user:supervisor, action:'HARD_STOP_OVERRIDE', payload:{ reason } });
    set({ status:'failed' });
  },
  overrideAndRestart: async (supervisor, reason) => {
    const { sessionId, steps } = get(); if (!sessionId) return;
    await db.events.add({ sessionId, ts:Date.now(), user:supervisor, action:'HARD_STOP_OVERRIDE', payload:{ reason } });
    const last = await db.sessions.get(sessionId);
    if (!last) return;
    await get().start(last.formulaId, steps, supervisor);
    set({ status:'scanning' });
  }
}));




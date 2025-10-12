import { useMemo, useState, useEffect } from 'react';
import { useWizard } from '@/features/preparation/useWizard';
import { CodeInput } from '@/components/CodeInput';
import { WeighPanel } from '@/components/WeighPanel';
import { db } from '@/lib/db';
import { SupervisorOverride } from '@/features/preparation/SupervisorOverride';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function Wizard(props: {
  formula: { id:string; name:string };
  stepsDef: Array<{
    sequence: number;
    ingredientId: string;
    code: string;
    altCodes?: string[];
    allowedSymbologies?: ('any'|'qr'|'code128'|'ean'|'datamatrix')[];
    parser?: 'plain'|'gs1'|'kv';
    targetQtyG: number;
    tolerancePct?: number;
    toleranceMinAbsG?: number;
  }>;
  operator: string;
}) {
  const { formula, stepsDef, operator } = props;
  const w = useWizard();

  const steps = useMemo(()=> stepsDef.map(s => ({
    id: crypto.randomUUID(),
    sequence: s.sequence,
    ingredientId: s.ingredientId,
    requiredCodeValue: s.code,
    altCodeValues: s.altCodes,
    allowedSymbologies: s.allowedSymbologies ?? ['any'],
    parser: s.parser ?? 'plain',
    targetQtyG: s.targetQtyG,
    toleranceAbsG: Math.max(s.targetQtyG * (s.tolerancePct ?? 0.5)/100, s.toleranceMinAbsG ?? 0.010),
  })), [stepsDef]);

  if (!w.sessionId && w.status === 'idle') {
    w.start(formula.id, steps, operator);
  }

  const step = w.steps[w.idx];

  function handleHardStop(valueG:number){
    w.markFailed('OVER_DISPENSE', true);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{formula.name} — Attempt #{w.attemptNo}</h2>

      {w.status==='locked_failed' && (
        <>
          <div className="p-3 rounded bg-red-100 text-red-800">HARD STOP: Supervisor override required.</div>
          <SupervisorOverride
            open={true}
            onApprove={async (reason, supervisor)=>{
              await w.overrideAndRestart(supervisor, reason);
            }}
          />
        </>
      )}
      {w.status==='failed' && (
        <div className="p-3 rounded bg-yellow-100 text-yellow-800">
          Failed: out of tolerance. Session reset to step 1 is required.
        </div>
      )}

      {step && (
        <div className="p-4 rounded-2xl border space-y-4">
          <div>Step {step.sequence}: <b>{step.ingredientId}</b></div>

          <CodeInput
            requiredCodeValue={step.requiredCodeValue}
            altCodeValues={step.altCodeValues}
            allowedSymbologies={step.allowedSymbologies}
            parser={step.parser}
            onPass={()=> w.unlockStep()}
            onFail={()=>{}}
          />

          <WeighPanel
            targetG={step.targetQtyG}
            tolAbsG={step.toleranceAbsG}
            autoTare
            enabled={w.codeUnlocked}
            onHardStop={handleHardStop}
            onConfirm={(captured)=> w.confirmStep(captured)}
          />
        </div>
      )}

      {w.status==='done' && (
        <FinishPrompt sessionId={w.sessionId!} formulaId={formula.id} formulaName={formula.name} />
      )}
    </div>
  );
}

function FinishPrompt({ sessionId, formulaId, formulaName }:{ sessionId: string; formulaId: string; formulaName: string }) {
  const [choice, setChoice] = useState<'now'|'later'|null>(null);
  const [min, setMin] = useState<number[]>([5,15,30]);
  const [sample, setSample] = useState<any>(null);
  const { user, hasPermission } = useAuth();
  const canViewCost = (user?.role === 'Admin' || (user as any)?.role === 'Owner' || hasPermission('purchasing','view_costs'));

  useEffect(() => {
    // Load the associated sample for cost display
    const loadSample = async () => {
      try {
        const raw = localStorage.getItem('nbslims_enhanced_samples');
        const list = raw ? JSON.parse(raw) : [];
        const found = list.find((s: any) => s.preparationSessionId === sessionId);
        setSample(found);
      } catch {}
    };
    loadSample();
  }, [sessionId]);

  async function scheduleLater(){
    const dueAt = Date.now() + 30*60*1000;
    const id = crypto.randomUUID();
    await db.tests.add({ id, type:'formula', linkId: sessionId, startAt: Date.now(), dueAt, remindOffsets: min, status:'scheduled' });
    alert('Scheduled test with local reminders');
  }

  return (
    <div className="p-4 rounded-xl border space-y-3">
      <div className="font-semibold">Preparation complete. Test now or later?</div>
      <div className="flex gap-2">
        <button className="px-3 py-1 border rounded" onClick={()=> setChoice('now')}>Test Now</button>
        <button className="px-3 py-1 border rounded" onClick={()=> setChoice('later')}>Test Later</button>
      </div>
      
      {canViewCost && sample && (
        <Card>
          <CardHeader>
            <CardTitle>Cost (admin)</CardTitle>
            {sample.costComputedAt && (
              <CardDescription>Cost as of {new Date(sample.costComputedAt).toLocaleString()}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {sample.materialTrace?.length ? (
              <div className="space-y-2">
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2">Raw Material</th>
                        <th className="text-left p-2">Qty (g)</th>
                        <th className="text-left p-2">Unit Cost</th>
                        <th className="text-left p-2">Line Cost</th>
                        <th className="text-left p-2">Lot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sample.materialTrace.map((r: any) => (
                        <tr key={r.id} className="border-t">
                          <td className="p-2 font-mono">{r.rmId}</td>
                          <td className="p-2">{(r.qtyActual ?? 0).toFixed(4)}</td>
                          <td className="p-2">{r.unitCost !== undefined ? (r.unitCost).toFixed(2) : <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800">No price</span>}</td>
                          <td className="p-2">{r.lineCost !== undefined ? (r.lineCost).toFixed(2) : '-'}</td>
                          <td className="p-2">{r.lotId || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {!sample.costComputedAt && 'No cost snapshot. Recompute now.'}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-semibold">Total: {sample.costTotal !== undefined ? (sample.costTotal).toFixed(2) : '-'} {sample.currency || ''}</div>
                    <button className="px-3 py-1 border rounded" onClick={async () => {
                      try {
                        const { computeAndAttachSampleCost } = await import('@/features/preparations/costing');
                        await computeAndAttachSampleCost(sample.id);
                        const raw = localStorage.getItem('nbslims_enhanced_samples');
                        const list = raw ? JSON.parse(raw) : [];
                        setSample(list.find((s: any) => s.id === sample.id));
                        const { telemetry } = await import('@/lib/telemetry');
                        telemetry.emit('cost.sample.recomputed', {
                          sampleId: sample.id,
                          preparationSessionId: sessionId,
                          currency: (list.find((s: any) => s.id === sample.id)?.currency) || 'USD',
                          costTotal: (list.find((s: any) => s.id === sample.id)?.costTotal) || 0,
                          rowsPriced: (list.find((s: any) => s.id === sample.id)?.materialTrace || []).filter((r: any) => r.lineCost !== undefined).length,
                          rowsMissingPrice: (list.find((s: any) => s.id === sample.id)?.materialTrace || []).filter((r: any) => r.lineCost === undefined).length
                        });
                      } catch {}
                    }}>Recompute cost snapshot</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">No cost snapshot.</div>
            )}
          </CardContent>
        </Card>
      )}
      {choice==='later' && (
        <div className="space-y-2">
          <div>Remind before due (minutes):</div>
          <div className="flex gap-2">
            {[5,15,30,60,120].map(v=>(
              <label key={v} className="flex items-center gap-1">
                <input type="checkbox" checked={min.includes(v)} onChange={e=>{
                  if (e.target.checked) setMin([...min, v]); else setMin(min.filter(x=>x!==v));
                }} />
                {v}
              </label>
            ))}
          </div>
          <button className="px-3 py-1 rounded bg-black text-white" onClick={scheduleLater}>Save Schedule</button>
        </div>
      )}
      {choice==='now' && (
        <div className="space-y-2">
          <div>This created a Formula Sample (Actual) and marked it Untested.</div>
          <a href={`/samples?highlightByPrep=${encodeURIComponent(sessionId)}`} className="text-blue-600 underline">
            View sample and Start Formula Sample Test
          </a>
        </div>
      )}
    </div>
  );
}




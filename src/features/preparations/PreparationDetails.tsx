import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { telemetry } from '@/lib/telemetry';

export function PreparationDetails({ id, layout }:{ id: string; layout: 'drawer'|'full' }){
  const [session, setSession] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [sample, setSample] = useState<any>(null);
  const { user, hasPermission } = useAuth();
  const canViewCost = (user?.role === 'Admin' || (user as any)?.role === 'Owner' || hasPermission('purchasing','view_costs'));

  useEffect(()=>{
    let mounted = true;
    (async()=>{
      try {
        const s = await db.sessions.get(id);
        const st = await db.steps.where('sessionId').equals(id).sortBy('sequence');
        if (!mounted) return;
        setSession(s);
        setSteps(st);
        // find associated sample for snapshot cost
        try {
          const raw = localStorage.getItem('nbslims_enhanced_samples');
          const list = raw ? JSON.parse(raw) : [];
          const found = list.find((s:any)=> s.preparationSessionId === id) || null;
          setSample(found);
          // Emit telemetry when cost panel is viewed
          if (found && canViewCost) {
            telemetry.emit('prep.view.costPanel', { preparationSessionId: id, sampleId: found.id });
          }
        } catch {}
      } catch {}
    })();
    return ()=>{ mounted = false; };
  }, [id, canViewCost]);

  const variance = (t:number|undefined, a:number|undefined) => {
    if (t === undefined || a === undefined) return '—';
    const v = (a - t);
    return `${v >= 0 ? '+' : ''}${v.toFixed(4)} g`;
  };

  const containerClass = layout === 'drawer' ? 'space-y-4' : 'p-4 space-y-4';

  if (!id) return <div className={containerClass}>Invalid preparation id</div>;
  if (!session) return <div className={containerClass}>Loading…</div>;

  return (
    <div className={containerClass}>
      <Card>
        <CardHeader>
          <CardTitle>Preparation {id}</CardTitle>
          <CardDescription>
            Formula: <span className="font-mono">{session.formulaVersionId || session.formulaId}</span> • Operator: {session.operator || '—'} • Started: {session.startedAt ? new Date(session.startedAt).toLocaleString() : '—'} • Ended: {session.endedAt ? new Date(session.endedAt).toLocaleString() : '—'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Seq</th>
                  <th className="text-left p-2">Ingredient</th>
                  <th className="text-left p-2">Target (g)</th>
                  <th className="text-left p-2">Actual (g)</th>
                  <th className="text-left p-2">Δ</th>
                  <th className="text-left p-2">Lot</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((s:any)=> (
                  <tr key={s.id} className="border-t">
                    <td className="p-2">{s.sequence}</td>
                    <td className="p-2 font-mono">{s.ingredientId}</td>
                    <td className="p-2">{(s.targetQtyG ?? 0).toFixed(4)}</td>
                    <td className="p-2">{(s.capturedQtyG ?? 0).toFixed(4)}</td>
                    <td className="p-2">{variance(s.targetQtyG, s.capturedQtyG)}</td>
                    <td className="p-2">{s.lotId || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {canViewCost && (
        <Card>
          <CardHeader>
            <CardTitle>Cost (admin)</CardTitle>
            {sample?.costComputedAt && (
              <CardDescription>Cost as of {new Date(sample.costComputedAt).toLocaleString()}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {sample?.materialTrace?.length ? (
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
                      {sample.materialTrace.map((r:any)=> (
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
                    <div className="font-semibold">Total: {sample.costTotal !== undefined ? (sample.costTotal).toFixed(2) : '-' } {sample.currency || ''}</div>
                    <button className="px-3 py-1 border rounded" onClick={async()=>{
                      try { const { computeAndAttachSampleCost } = await import('@/features/preparations/costing'); await computeAndAttachSampleCost(sample.id); const raw = localStorage.getItem('nbslims_enhanced_samples'); const list = raw ? JSON.parse(raw) : []; setSample(list.find((s:any)=> s.id===sample.id)); const { telemetry } = await import('@/lib/telemetry'); telemetry.emit('cost.sample.recomputed', { sampleId: sample.id, preparationSessionId: id, currency: (list.find((s:any)=> s.id===sample.id)?.currency)||'USD', costTotal: (list.find((s:any)=> s.id===sample.id)?.costTotal)||0, rowsPriced: (list.find((s:any)=> s.id===sample.id)?.materialTrace||[]).filter((r:any)=> r.lineCost!==undefined).length, rowsMissingPrice: (list.find((s:any)=> s.id===sample.id)?.materialTrace||[]).filter((r:any)=> r.lineCost===undefined).length }); } catch {}
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
    </div>
  );
}



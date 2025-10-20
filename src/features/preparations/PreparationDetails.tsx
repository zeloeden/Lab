import React, { useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { telemetry } from '@/lib/telemetry';

export function PreparationDetails({ id, layout, defaultOpen, onOpenChange }:{ id: string; layout: 'drawer'|'full'; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void }){
  const [sample, setSample] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const canViewCost = (user?.role === 'Admin' || (user as any)?.role === 'Owner' || hasPermission('purchasing','view_costs'));
  const qc = useQueryClient();
  const cacheKey = ['session', id]; // <-- CHANGED: use 'session' to match wrapper

  console.debug('[prep-details-inner] id', id, 'defaultOpen?', !!defaultOpen);

  // Query with retry - use 'session' key to match wrapper's cache
  const prepQ = useQuery({
    queryKey: cacheKey, // <-- CHANGED: use same key as wrapper
    queryFn: async () => {
      if (!id) return null;
      const s = await db.sessions.get(id);
      const st = await db.steps.where('sessionId').equals(id).sortBy('sequence');
      
      // Find associated sample for snapshot cost
      try {
        const raw = localStorage.getItem('nbslims_enhanced_samples');
        const list = raw ? JSON.parse(raw) : [];
        const found = list.find((sample:any)=> sample.preparationSessionId === id) || null;
        setSample(found);
        // Emit telemetry when cost panel is viewed
        if (found && canViewCost) {
          telemetry.emit('prep.view.costPanel', { preparationSessionId: id, sampleId: found.id });
        }
      } catch {}
      
      return { session: s, steps: st };
    },
    initialData: () => (qc.getQueryData(cacheKey) as any) ?? null, // <-- CHANGED: use cache
    enabled: !!id,
    retry: 2,           // Brief backoff
    retryDelay: 250,
    staleTime: 5_000,
  });

  const variance = (t:number|undefined, a:number|undefined) => {
    if (t === undefined || a === undefined) return '—';
    const v = (a - t);
    return `${v >= 0 ? '+' : ''}${v.toFixed(4)} g`;
  };
  
  // Helper to get ingredient display name from UUID
  const getIngredientName = (ingredientId: string): string => {
    try {
      // Check enhanced samples (localStorage)
      const samplesRaw = localStorage.getItem('nbslims_enhanced_samples');
      if (samplesRaw) {
        const samples = JSON.parse(samplesRaw);
        const found = samples.find((s: any) => s.id === ingredientId);
        if (found) return found.itemNameEN || found.name || ingredientId;
      }
      
      // Check raw materials (localStorage)
      const rawMaterialsRaw = localStorage.getItem('nbslims_raw_materials');
      if (rawMaterialsRaw) {
        const materials = JSON.parse(rawMaterialsRaw);
        const found = materials.find((m: any) => m.id === ingredientId);
        if (found) return found.name || found.itemNameEN || ingredientId;
      }
    } catch (error) {
      console.error('Error looking up ingredient name:', error);
    }
    
    // Fallback to ID
    return ingredientId;
  };

  const containerClass = layout === 'drawer' ? 'space-y-4' : 'p-4 space-y-4';

  if (!id) return <div className={containerClass}>Invalid preparation id</div>;
  
  // Handle loading state
  if (prepQ.isLoading) return <div className={containerClass}>Loading…</div>;
  
  // Handle error state
  if (prepQ.isError) {
    console.error('[prep] failed', prepQ.error);
    return <div className={containerClass + ' text-red-600'}>Preparation failed to load.</div>;
  }
  
  // Safety redirect: support /preparations/:id?f=<formulaCode> legacy
  const f = searchParams.get('f');
  if (prepQ.isSuccess && (!prepQ.data || !prepQ.data.session)) {
    if (f) {
      navigate(`/formula-first?code=${encodeURIComponent(f)}&auto=start`, { replace: true });
      return null;
    }
    return <div className={containerClass}>Preparation not found.</div>;
  }

  const session = prepQ.data.session;
  const steps = prepQ.data.steps;

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
                    <td className="p-2">{getIngredientName(s.ingredientId)}</td>
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



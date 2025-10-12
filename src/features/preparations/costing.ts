export async function computeAndAttachSampleCost(sampleId: string) {
  try {
    const raw = localStorage.getItem('nbslims_enhanced_samples');
    const samples = raw ? JSON.parse(raw) : [];
    const sample = samples.find((s:any)=> s.id===sampleId);
    if (!sample) return;
    const trace = Array.isArray(sample.materialTrace) ? sample.materialTrace : [];
    const currency = (sample.currency) || 'USD';
    let total = 0;
    let rowsPriced = 0;
    let rowsMissingPrice = 0;
    for (const r of trace){
      const price = await getActiveRMPrice(r.rmId, { currency });
      if (!price){ r.unitCost = undefined; r.lineCost = undefined; rowsMissingPrice++; continue; }
      r.unitCost = price.perGram;
      r.currency = currency;
      r.lineCost = round2((r.qtyActual ?? 0) * r.unitCost);
      if (r.lineCost){ total += r.lineCost; rowsPriced++; }
    }
    sample.costTotal = round2(total);
    sample.currency = currency;
    sample.costComputedAt = new Date().toISOString();
    localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(samples));
    try { (await import('@/lib/telemetry')).telemetry.emit('cost.sample.computed', { sampleId, preparationSessionId: sample.preparationSessionId, currency, costTotal: sample.costTotal, rowsPriced, rowsMissingPrice }); } catch {}
  } catch {}
}

function round2(n:number){ return Math.round(n*100)/100; }

async function getActiveRMPrice(rmId:string, { currency }:{ currency:string }): Promise<{ perGram:number }|null> {
  try {
    const raw = localStorage.getItem('nbslims_raw_materials');
    const rms = raw ? JSON.parse(raw) : [];
    const rm = rms.find((r:any)=> r.id===rmId);
    if (!rm) return null;
    // Assume rm.price is per kg → convert to per gram if present
    if (typeof rm.price === 'number'){ return { perGram: rm.price / 1000 }; }
    return null;
  } catch { return null; }
}



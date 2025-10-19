// LocalStorage-only resolver. Normalizes a scanned code, resolves a Formula,
// finds an in_progress PreparationSession (or creates one), and returns a route.

type Formula = any; type Sample = any; type PrepSession = any;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sanitize = (s: string) => s.replace(/[\r\n\t]/g, '').trim();

function parseKvQR(s: string) {
  if (!s.includes('=')) return null as null | {F?: string; S?: string; N?: string};
  const parts = s.split(/[;,*]/);
  const out: any = {};
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k && v) out[k.toUpperCase()] = v.trim();
  }
  return out;
}

function parseFormulaBarcode(s: string) {
  const m = /^FORMULA-([A-Za-z0-9_-]+)(?:-[A-Za-z]+)?$/.exec(s.toUpperCase());
  return m ? m[1] : null;
}

function ls<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function save<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)); }

function pickFormulaBySample(sampleId: string, formulas: Formula[]): Formula | null {
  const fam = formulas.filter(f => f.sampleId === sampleId);
  if (fam.length === 0) return null;
  return fam.find(f => f.status === 'Approved')
      || fam.sort((a:any,b:any)=>new Date(b.updatedAt||b.createdAt||0).getTime()-new Date(a.updatedAt||a.createdAt||0).getTime())[0];
}

function findOrCreatePrepSession(formulaId: string): PrepSession {
  const sessions: PrepSession[] = ls('nbslims_preparations', []);
  let sess = sessions.find(s => s.formulaId === formulaId && s.status === 'in_progress');
  if (sess) return sess;
  const attemptNo = (sessions.filter(s => s.formulaId === formulaId)
                           .map(s => s.attemptNo)
                           .reduce((m:number,n:number)=>Math.max(m,n), 0) || 0) + 1;
  sess = {
    id: crypto.randomUUID(),
    formulaId, attemptNo,
    operator: 'operator',
    status: 'in_progress',
    startedAt: new Date().toISOString()
  };
  sessions.push(sess);
  save('nbslims_preparations', sessions);
  return sess;
}

export function resolveScanToPreparationRoute(scanRaw: string): { ok: true; route: string } | { ok: false; msg: string } {
  const code = sanitize(scanRaw);
  const formulas: Formula[] = ls('nbslims_formulas', []);
  const samples:  Sample[]  = ls('nbslims_enhanced_samples', []);

  // Helper to generate formula-first route (preparations are now modal-based)
  const formulaRoute = (formulaId: string) => {
    const formula = formulas.find(x => x.id === formulaId);
    if (!formula) return null;
    // Use internalCode or id as the code parameter
    const code = formula.internalCode || formula.id;
    return `/formula-first?code=${encodeURIComponent(code)}&auto=start`;
  };

  // 1) QR KV
  const kv = parseKvQR(code);
  if (kv?.F && UUID_RE.test(kv.F)) {
    const route = formulaRoute(kv.F);
    if (route) return { ok: true, route };
  }

  // 2) Raw UUID
  if (UUID_RE.test(code)) {
    const route = formulaRoute(code);
    if (route) return { ok: true, route };
  }

  // 3) Barcode with internalCode
  const internal = parseFormulaBarcode(code);
  if (internal) {
    const f = formulas.find(x => (x.internalCode||'').toUpperCase() === internal.toUpperCase());
    if (f) {
      const route = formulaRoute(f.id);
      if (route) return { ok: true, route };
    }
  }

  // 4) Sample code: S:<code> or plain code
  const sm = /^S:(.+)$/i.exec(code);
  const sampleCode = sm ? sm[1].trim() : code;
  const sample = samples.find((s:any) => (s.sampleId||s.sampleCode||'').toUpperCase() === sampleCode.toUpperCase());
  if (sample) {
    const f = pickFormulaBySample(sample.id, formulas);
    if (f) {
      const route = formulaRoute(f.id);
      if (route) return { ok: true, route };
    }
  }

  return { ok: false, msg: 'Formula not found for scanned code' };
}



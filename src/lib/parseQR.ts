export type QRParsed =
  | { type: 'prep'; id: string; extras?: { formulaCode?: string; sampleId?: string; raw: string } }
  | { type: 'formulaCode'; code: string; extras?: { raw: string } }
  | { type: 'sample'; id: string; extras?: { raw: string } };

export function parseQR(input: string): QRParsed | null {
  const raw = (input || '').trim();
  if (!raw) return null;

  // 1) URL forms
  try {
    const u = new URL(raw);
    const p = u.pathname.toLowerCase();
    const segs = p.split('/').filter(Boolean);
    if (segs[0] === 'preparations' && segs[1]) {
      const code = u.searchParams.get('code') || u.searchParams.get('q') || u.searchParams.get('formula') || undefined;
      return { type: 'prep', id: segs[1], extras: { formulaCode: code, raw } };
    }
    const qpPrep = u.searchParams.get('prep') || u.searchParams.get('prepId');
    if (qpPrep) return { type: 'prep', id: qpPrep, extras: { raw } };

    const qpCode = u.searchParams.get('code') || u.searchParams.get('q') || u.searchParams.get('formula');
    if (qpCode) return { type: 'formulaCode', code: qpCode.trim(), extras: { raw } };

    const qpSample = u.searchParams.get('sample') || u.searchParams.get('s');
    if (qpSample) return { type: 'sample', id: qpSample.trim(), extras: { raw } };
  } catch { /* not a URL */ }

  // 2) Composite tokens like "F=<guid>;sample-..." → parse all tokens
  const fEq = raw.match(/(?:^|[;,\s])F\s*=\s*([A-Za-z0-9._:-]+)/i)?.[1];
  const fCo = raw.match(/(?:^|[;,\s])F\s*:\s*([A-Za-z0-9._:-]+)/i)?.[1];

  // 3) PREP / P tokens
  const prep = raw.match(/(?:^|[;,\s])(prep|preparation|P)\s*[:=-]\s*([A-Za-z0-9-]+)/i)?.[2];

  // 4) SAMPLE tokens
  const samp = raw.match(/(?:^|[;,\s])S\s*[:=-]\s*([A-Za-z0-9._:-]+)/i)?.[1];

  if (prep) return { type: 'prep', id: prep, extras: { formulaCode: fEq ?? fCo, sampleId: samp, raw } };
  if (fEq || fCo) return { type: 'formulaCode', code: (fEq ?? fCo)!, extras: { raw } };
  if (samp) return { type: 'sample', id: samp, extras: { raw } };

  // Default: treat whole string as formula code
  return { type: 'formulaCode', code: raw, extras: { raw } };
}



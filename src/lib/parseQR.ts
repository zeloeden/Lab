export type QRParsed =
  | { type: 'prep'; id: string }
  | { type: 'formulaCode'; code: string }
  | { type: 'sample'; id: string };

export function parseQR(input: string): QRParsed | null {
  const raw = (input || '').trim();
  if (!raw) return null;

  // 1) URL forms
  try {
    const u = new URL(raw);
    const p = u.pathname.toLowerCase();
    const segs = p.split('/').filter(Boolean);
    if (segs[0] === 'preparations' && segs[1]) {
      return { type: 'prep', id: segs[1] };
    }
    const qpPrep = u.searchParams.get('prep') || u.searchParams.get('prepId');
    if (qpPrep) return { type: 'prep', id: qpPrep };

    const qpCode = u.searchParams.get('code') || u.searchParams.get('q') || u.searchParams.get('formula');
    if (qpCode) return { type: 'formulaCode', code: qpCode.trim() };
  } catch { /* not a URL */ }

  // 2) Composite tokens like "F=<guid>;sample-..." → prefer F= first
  const fEq = raw.match(/(?:^|[;,.\s])F\s*=\s*([A-Za-z0-9._:-]+)/i);
  if (fEq?.[1]) return { type: 'formulaCode', code: fEq[1] };

  // 3) Token "F:CODE"
  const fColon = raw.match(/(?:^|[;,.\s])F\s*:\s*([A-Za-z0-9._:-]+)/i);
  if (fColon?.[1]) return { type: 'formulaCode', code: fColon[1] };

  // 4) prep tokens: "prep:ID", "preparation-<id>", "P:<id>"
  const prepTok = raw.match(/(?:^|[;,.\s])(prep|preparation|P)\s*[:=-]\s*([A-Za-z0-9-]+)/i);
  if (prepTok?.[2]) return { type: 'prep', id: prepTok[2] };

  // 5) sample tokens
  const sTok = raw.match(/(?:^|[;,.\s])S\s*[:=-]\s*([A-Za-z0-9._:-]+)/i);
  if (sTok?.[1]) return { type: 'sample', id: sTok[1] };

  // 6) Otherwise treat the whole string as a formula code
  return { type: 'formulaCode', code: raw };
}



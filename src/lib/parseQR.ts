export type QRParsed =
  | { type: 'prep'; id: string }
  | { type: 'formulaCode'; code: string };

export function parseQR(raw: string): QRParsed | null {
  const text = (raw || '').trim();

  // Try URL forms first
  try {
    const u = new URL(text);
    // e.g. https://app/preparations/123
    const path = u.pathname.toLowerCase();
    const segs = path.split('/').filter(Boolean);
    if (segs[0] === 'preparations' && segs[1]) {
      return { type: 'prep', id: segs[1] };
    }
    const qpPrep = u.searchParams.get('prep') || u.searchParams.get('prepId');
    if (qpPrep) return { type: 'prep', id: qpPrep };
    const qpFormula = u.searchParams.get('code') || u.searchParams.get('formula');
    if (qpFormula) return { type: 'formulaCode', code: qpFormula };
  } catch {
    // not a URL, continue
  }

  // Plain tokens like "prep:123", "preparation-ABC", "PREP 987"
  const m = text.match(/(?:^|\b)(?:prep|preparation)[-:\s]?([A-Za-z0-9_-]+)/i);
  if (m?.[1]) return { type: 'prep', id: m[1] };

  // Otherwise treat whole text as a formula code
  if (text) return { type: 'formulaCode', code: text };

  return null;
}



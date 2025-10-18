export type QR =
  | { type: 'sample'; code: string; extras?: Record<string, string> }
  | { type: 'formula'; code: string; extras?: Record<string, string> }
  | { type: 'prep'; id: string; extras?: Record<string, string> };

export function decodeQR(raw0: string): QR | null {
  const raw = (raw0 ?? '').trim();
  if (!raw) return null;

  // Try URL-style first
  try {
    const u = new URL(raw);
    const segs = u.pathname.split('/').filter(Boolean).map(s => s.trim());
    const q = Object.fromEntries(u.searchParams.entries());
    const head = (segs[0] || '').toLowerCase();
    const val = segs[1];

    if (head === 'f' && val) return { type: 'formula', code: val, extras: q };
    if (head === 's' && val) return { type: 'sample', code: val, extras: q };
    if (head === 'p' && val) return { type: 'prep', id: val, extras: q };

    if (head === 'formulas' && val) return { type: 'formula', code: val, extras: q };
    if (head === 'samples' && val) return { type: 'sample', code: val, extras: q };
    if (head === 'preparations' && val) return { type: 'prep', id: val, extras: q };
  } catch { /* not a URL */ }

  // Legacy prefixes like S:, F=, P:, SAMPLE:, FORMULA:, PREP:
  const pref = raw.match(/^(S|F|P|SAMPLE|FORMULA|PREP)\s*[:=]\s*(.+)$/i);
  if (pref) {
    const kind = pref[1].toUpperCase();
    const val = pref[2].trim();
    if (kind === 'S' || kind === 'SAMPLE') return { type: 'sample', code: val };
    if (kind === 'F' || kind === 'FORMULA') return { type: 'formula', code: val };
    if (kind === 'P' || kind === 'PREP') return { type: 'prep', id: val };
  }

  // UUID-ish → prep
  if (/^[0-9a-f-]{20,}$/i.test(raw)) return { type: 'prep', id: raw };

  // Fallback: treat as sample code by default
  return { type: 'sample', code: raw };
}

export function normalizeForSearch(raw: string): string {
  const qr = decodeQR(raw);
  if (!qr) return '';
  return qr.type === 'prep' ? qr.id : qr.code;
}


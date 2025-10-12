export type GS1 = { gtin?: string; lot?: string; serial?: string; exp?: string };

export function parseGS1(text: string): GS1 {
  const out: GS1 = {};
  const gtin = text.match(/\(01\)\s*([0-9]{14})/);
  if (gtin) out.gtin = gtin[1];
  const lot = text.match(/\(10\)\s*([^\(\)]+?)(?=\(|$)/);
  if (lot) out.lot = lot[1].trim();
  const ser = text.match(/\(21\)\s*([^\(\)]+?)(?=\(|$)/);
  if (ser) out.serial = ser[1].trim();
  const exp = text.match(/\(17\)\s*([0-9]{6})/);
  if (exp) out.exp = exp[1];
  return out;
}

export function normalize(s: string) {
  return s.trim().replace(/\s+/g,'').toUpperCase();
}



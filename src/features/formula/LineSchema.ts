import { z } from 'zod';

export const Symbologies = z.enum(['any','qr','code128','ean','datamatrix']);
export type Symbology = z.infer<typeof Symbologies>;

export const CodeMode = z.enum(['plain','gs1','kv']);
export type CodeModeT = z.infer<typeof CodeMode>;

export const QtyMode = z.enum(['grams','percent','volume']);
export type QtyModeT = z.infer<typeof QtyMode>;

export const LineForm = z.object({
  id: z.string().optional(),
  sequence: z.number().int().min(1),
  ingredientId: z.string().min(1),
  ingredientName: z.string().optional(),

  // codes
  codeMode: CodeMode.default('plain'),
  codeValue: z.string().optional(),  // plain/kv
  gtin: z.string().optional(),       // gs1
  codeAliases: z.array(z.string()).optional(),
  allowedSymbologies: z.array(Symbologies).default(['any']),

  // quantities (only one mode required)
  qtyMode: QtyMode.default('grams'),
  targetQtyG: z.number().positive().optional(),         // grams
  percentOfBatch: z.number().positive().max(100).optional(), // percent
  targetVolumeMl: z.number().positive().optional(),     // volume
  density_g_per_ml: z.number().positive().optional(),   // needed when volume mode

  // tolerances
  tolerancePct: z.number().min(0).max(5).default(0.5),
  toleranceMinAbsG: z.number().min(0).max(5).default(0.010),
});

export type LineFormT = z.infer<typeof LineForm>;

export function resolveGrams(line: LineFormT, batchTotalG?: number): number | undefined {
  if (line.qtyMode === 'grams') return line.targetQtyG;
  if (line.qtyMode === 'percent' && batchTotalG) return (line.percentOfBatch! / 100) * batchTotalG;
  if (line.qtyMode === 'volume' && line.targetVolumeMl && line.density_g_per_ml) {
    return line.targetVolumeMl * line.density_g_per_ml;
  }
  return undefined;
}

export function toleranceAbsG(targetQtyG: number, pct = 0.5, minAbs = 0.010) {
  return Math.max(targetQtyG * (pct / 100), minAbs);
}

export function validateLine(line: LineFormT, batchTotalG?: number) {
  const issues: string[] = [];

  // code presence
  if (line.codeMode === 'gs1') {
    if (!line.gtin) issues.push('GTIN is required for GS1 mode.');
  } else if (line.codeMode === 'plain' || line.codeMode === 'kv') {
    if (!line.codeValue) issues.push('Code value is required for plain/kv mode.');
  }

  // grams resolvable
  const g = resolveGrams(line, batchTotalG);
  if (g === undefined) {
    issues.push('Grams not resolvable: provide targetQtyG OR (percentOfBatch + batchTotalG) OR (targetVolumeMl + density_g_per_ml).');
  }

  return { ok: issues.length === 0, issues, grams: g };
}



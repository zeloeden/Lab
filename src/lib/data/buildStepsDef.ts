import { DataMapping } from '@/config/dataMapping';

type Allowed = 'any'|'qr'|'code128'|'ean'|'datamatrix';
type Parser  = 'plain'|'gs1'|'kv';

type IngredientInput = Record<string, any>;
type FormulaInput = { ingredients: IngredientInput[] } & Record<string, any>;

type BuildOpts = {
  getRawMaterial?: (id: string) => { id:string; density?: number } | undefined;
};

export type OverrideBatch = { size: number; unit: 'g'|'kg'|'ml'|'L' };

function firstKey(obj: any, candidates?: string[]) {
  if (!obj || !candidates) return undefined;
  for (const k of candidates) if (k in obj) return k;
  return undefined;
}
function val<T=any>(obj:any, candidates?:string[]): T|undefined {
  const k = firstKey(obj, candidates);
  return k ? (obj[k] as T) : undefined;
}
function must<T=any>(obj:any, candidates?:string[], label='field'): T {
  const v = val<T>(obj, candidates);
  if (v === undefined) throw new Error(`Missing ${label}. Tried keys: ${candidates?.join(', ')}`);
  return v;
}
function toNumber(v:any): number|undefined {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
const absTol = (g: number, pct = 0.5, minAbs = 0.010) => Math.max(g * (pct/100), minAbs);

export function buildStepsDefFromFormula(selectedFormula: FormulaInput, opts: BuildOpts & { overrideBatch?: OverrideBatch } = {}) {
  console.log(`[DEBUG] buildStepsDefFromFormula called with formula: ${selectedFormula.name}, overrideBatch:`, opts.overrideBatch);
  const F = DataMapping.formula;
  const I = DataMapping.ingredient;

  // Batch mass inference (safe fallbacks)
  let batchTotalG = toNumber(val(selectedFormula, F.batchTotalG));
  // Prefer operator-entered prep size; formulas do not carry size/unit
  const ob = opts.overrideBatch;
  const size = ob?.size;
  const unit = ob?.unit as string | undefined;
  if (size === undefined || !unit) {
    throw new Error(`Batch size is required in Preparation.`);
  }
  if (batchTotalG === undefined) {
    if (unit === 'g') batchTotalG = size;
    else if (unit === 'kg') batchTotalG = size * 1000;
    // For ml/L we do per-line mass using density; leave batchTotalG undefined here
    console.log(`[DEBUG] Calculated batchTotalG: ${size} ${unit} = ${batchTotalG}g`);
  }

  const ingredients: IngredientInput[] = selectedFormula.ingredients || [];
  const steps = ingredients
    .slice()
    .sort((a,b)=>{
      const sa = toNumber(val(a, I.sequence));
      const sb = toNumber(val(b, I.sequence));
      // If no explicit sequence, keep original order by returning 0
      if (sa === undefined || sb === undefined) return 0;
      return sa - sb;
    })
    .map((ing, idx) => {
      const ingredientId = must<string>(ing, I.id, 'ingredient id');
      const rawMaterialId = (ing as any).rawMaterialId as string | undefined;

      const gtin = val<string>(ing, I.gtin);
      const codeValue = val<string>(ing, I.codeValue);
      const codeAliases = (val<string[]>(ing, I.codeAliases) ?? []).filter(Boolean);
      const allowedSymbologies = (val<Allowed[]>(ing, I.allowedSymbologies) ?? ['any']) as Allowed[];

      let code: string;
      let parser: Parser = 'plain';
      if (gtin) { code = String(gtin); parser = 'gs1'; }
      else if (codeValue) { code = String(codeValue); }
      else {
        // Fallback to RM:<rawMaterialId> or ingredientId
        const fallbackId = rawMaterialId || ingredientId;
        code = `RM:${fallbackId}`;
        parser = 'plain';
      }

      const gDirect = toNumber(val(ing, I.targetQtyG));
      const volMl   = toNumber(val(ing, I.targetVolumeMl));
      const pct     = toNumber(val(ing, I.percentOfBatch));
      const density = toNumber(val(ing, I.density_g_per_ml));

      let targetQtyG: number | undefined = gDirect;
      if (targetQtyG === undefined && pct !== undefined && batchTotalG !== undefined) {
        targetQtyG = (pct/100) * batchTotalG;
        console.log(`[DEBUG] Calculated targetQtyG for ${ingredientId}: ${pct}% of ${batchTotalG}g = ${targetQtyG}g`);
      }
      if (targetQtyG === undefined && volMl !== undefined && density !== undefined) {
        targetQtyG = volMl * density;
      }
      // If still undefined and percent + batch is volumetric → per-line density fallback
      if (targetQtyG === undefined && pct !== undefined && batchTotalG === undefined) {
        if (unit && (unit === 'ml' || unit === 'L')) {
          const batchMl = unit === 'ml' ? size : size * 1000;
          let rho = density;
          if (rho === undefined && rawMaterialId && typeof opts.getRawMaterial === 'function') {
            const rm = opts.getRawMaterial(rawMaterialId);
            rho = toNumber(rm?.density);
          }
          if (rho === undefined) {
            const name = val<string>(ing, I.name) ?? ingredientId;
            throw new Error(`Missing density for raw material '${rawMaterialId ?? ingredientId}' on line '${name}' to convert ml→g.`);
          }
          targetQtyG = (pct/100) * batchMl * (rho as number);
        }
      }
      if (targetQtyG === undefined) {
        throw new Error(`Ingredient ${ingredientId} lacks grams: set targetQtyG, or (percentOfBatch+batchTotalG), or (targetVolumeMl+density).`);
      }

      const tolPct = toNumber(val(ing, I.tolerancePct)) ?? 0.5;
      const tolMin = toNumber(val(ing, I.toleranceMinAbsG)) ?? 0.010;

      // Resolve display name and additional alt codes from inventory (raw material or sample)
      let displayName: string = ingredientId;
      if (rawMaterialId && typeof opts.getRawMaterial === 'function') {
        const rm:any = opts.getRawMaterial(rawMaterialId);
        if (rm) {
          displayName = (rm?.itemNameEN || rm?.itemNameAR || rm?.name || rawMaterialId);
          // If the item is a Sample record with a short sampleId/code, accept S:<sampleId> as an alternate code
          const sampleCode = rm?.sampleId || rm?.id?.startsWith?.('sample-') ? rm?.sampleId : undefined;
          if (sampleCode) {
            codeAliases.push(`S:${String(sampleCode)}`);
          }
        }
      }

      const step = {
        sequence: toNumber(val(ing, I.sequence)) ?? (idx + 1),
        ingredientId,
        rawMaterialId,
        displayName,
        code,
        altCodes: Array.from(new Set(codeAliases)),
        allowedSymbologies,
        parser,
        targetQtyG,
        tolerancePct: tolPct,
        toleranceMinAbsG: tolMin,
      };
      console.log(`[DEBUG] Final step for ${ingredientId}: targetQtyG = ${targetQtyG}g`);
      return step;
    });

  if (process.env.NODE_ENV !== 'production') {
    console.info('[AutoMap] Built stepsDef with', steps.length, 'items', {
      batchTotalG,
      sample: steps[0]
    });
  }

  return steps;
}



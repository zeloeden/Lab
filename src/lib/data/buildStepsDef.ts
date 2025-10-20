import { DataMapping } from '@/config/dataMapping';
import { db } from '@/lib/db';
import { buildScanAliases } from '@/lib/scan/registry';

type Allowed = 'any'|'qr'|'code128'|'ean'|'datamatrix';
type Parser  = 'plain'|'gs1'|'kv';

type IngredientInput = Record<string, any>;
type FormulaInput = { ingredients: IngredientInput[] } & Record<string, any>;

type BuildOpts = {
  getRawMaterial?: (id: string) => { id:string; density?: number; name?: string; itemNameEN?: string; itemNameAR?: string } | undefined;
};

export type OverrideBatch = { size: number; unit: 'g'|'kg'|'ml'|'L' };

/**
 * Get code from sample, trying multiple common property names
 */
function getMaybeCode(sample: any): string | undefined {
  return (
    sample?.code ??
    sample?.sampleCode ??
    sample?.materialCode ??
    sample?.sku ??
    sample?.externalCode ??
    undefined
  );
}

/**
 * Get barcode list from sample, handling different property names and formats
 */
function getBarcodeList(sample: any): string[] {
  const raw = sample?.barcodes ?? sample?.barcodeList ?? sample?.barcode ?? [];
  return Array.isArray(raw) ? raw : (raw ? [String(raw)] : []);
}

/**
 * Build all valid scan aliases for a sample/raw material
 * Includes RM:sample-xxx, S:CODE, CODE, sample-xxx, and barcodes
 */
function buildValidCodes(sample: any, rawMaterialId?: string): string[] {
  const out = new Set<string>();
  
  // Add canonical scan code if present
  if (sample?.scanCode) {
    out.add(String(sample.scanCode));
  }
  
  // Add sample ID variations (sample-xxx, RM:sample-xxx)
  if (sample?.id) {
    const sampleIdStr = String(sample.id).replace(/^sample-/, '');
    out.add(`sample-${sampleIdStr}`);
    out.add(`RM:sample-${sampleIdStr}`);
  }
  
  // Add code variations (S:CODE, CODE) - tolerant to different property names
  const code = getMaybeCode(sample);
  if (code) {
    out.add(`S:${code}`);
    out.add(String(code));
  }
  
  // Add raw material ID variations if different from sample
  if (rawMaterialId && rawMaterialId !== sample?.id) {
    const rmIdStr = String(rawMaterialId).replace(/^sample-/, '');
    out.add(`sample-${rmIdStr}`);
    out.add(`RM:sample-${rmIdStr}`);
    out.add(`RM:${rawMaterialId}`);
  }
  
  // Add any attached barcodes - tolerant to different property names
  for (const barcode of getBarcodeList(sample)) {
    if (barcode && String(barcode).trim()) {
      out.add(String(barcode).trim());
    }
  }
  
  // Return de-duplicated array
  return Array.from(out).filter(Boolean);
}

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

export async function buildStepsDefFromFormula(selectedFormula: FormulaInput, opts: BuildOpts & { overrideBatch?: OverrideBatch } = {}) {
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
  const sortedIngredients = ingredients
    .slice()
    .sort((a,b)=>{
      const sa = toNumber(val(a, I.sequence));
      const sb = toNumber(val(b, I.sequence));
      // If no explicit sequence, keep original order by returning 0
      if (sa === undefined || sb === undefined) return 0;
      return sa - sb;
    });
  
  const steps = await Promise.all(sortedIngredients.map(async (ing, idx) => {
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

      // Resolve display name, sample data, and build all valid scan codes
      // Priority: 1) embedded rawMaterial.itemNameEN, 2) getRawMaterial lookup, 3) sample DB lookup, 4) raw material ID, 5) ingredient ID
      let displayName: string = ingredientId;
      let sample: any = null;
      let validCodes: string[] = [];
      
      // First check if the ingredient has an embedded rawMaterial object (FormulaIngredient.rawMaterial)
      const embeddedRM = (ing as any)?.rawMaterial;
      if (embeddedRM) {
        displayName = embeddedRM?.itemNameEN || embeddedRM?.itemNameAR || embeddedRM?.name || displayName;
        sample = embeddedRM;
        console.log(`[DEBUG] Using embedded rawMaterial for ${ingredientId}: ${displayName}`);
      }
      // Try getRawMaterial lookup
      else if (rawMaterialId && typeof opts.getRawMaterial === 'function') {
        const rm:any = opts.getRawMaterial(rawMaterialId);
        console.log(`[DEBUG] getRawMaterial(${rawMaterialId}) returned:`, rm);
        if (rm) {
          displayName = (rm?.itemNameEN || rm?.itemNameAR || rm?.name || rawMaterialId);
          sample = rm;
          console.log(`[DEBUG] Resolved displayName for ${ingredientId}: ${displayName}`);
        }
      }
      
      // Try localStorage lookup for samples (samples are not in Dexie yet)
      if (!sample && rawMaterialId) {
        try {
          const stored = localStorage.getItem('nbslims_enhanced_samples');
          if (stored) {
            const samples = JSON.parse(stored);
            // Try as sample ID
            let found = samples.find((s: any) => s.id === rawMaterialId);
            if (found) {
              sample = found;
              displayName = found.itemNameEN || found.itemNameAR || found.name || displayName;
              console.log(`[DEBUG] Found sample by ID ${rawMaterialId}: ${displayName}`);
            } else {
              // Try by sample code
              found = samples.find((s: any) => s.code === rawMaterialId);
              if (found) {
                sample = found;
                displayName = found.itemNameEN || found.itemNameAR || found.name || displayName;
                console.log(`[DEBUG] Found sample by code ${rawMaterialId}: ${displayName}`);
              }
            }
          }
        } catch (err) {
          console.warn(`[DEBUG] Sample lookup failed for ${rawMaterialId}:`, err);
        }
      }
      
      // Build all valid scan codes using the registry (single source of truth)
      validCodes = buildScanAliases(sample);
      
      // If no sample found, fall back to building from raw material ID and explicit aliases
      if (validCodes.length === 0) {
        validCodes = buildValidCodes(sample, rawMaterialId);
        
        // Add any explicitly defined code aliases
        if (codeAliases.length > 0) {
          validCodes.push(...codeAliases);
        }
        
        // Add the canonical code
        if (code && !validCodes.includes(code)) {
          validCodes.push(code);
        }
        
        // De-duplicate
        validCodes = Array.from(new Set(validCodes.filter(Boolean)));
      }
      
      console.log(`[DEBUG] Built validCodes for ${displayName}:`, validCodes);

      const step = {
        sequence: toNumber(val(ing, I.sequence)) ?? (idx + 1),
        ingredientId,
        rawMaterialId,
        displayName,
        code,
        altCodes: validCodes, // Now includes all scan aliases
        allowedSymbologies,
        parser,
        targetQtyG,
        tolerancePct: tolPct,
        toleranceMinAbsG: tolMin,
        material: sample, // Include material for registry-based validation
      };
      console.log(`[DEBUG] Final step for ${displayName}: targetQtyG = ${targetQtyG}g, validCodes:`, validCodes);
      return step;
    }));

  if (process.env.NODE_ENV !== 'production') {
    console.info('[AutoMap] Built stepsDef with', steps.length, 'items', {
      batchTotalG,
      sample: steps[0]
    });
  }

  return steps;
}



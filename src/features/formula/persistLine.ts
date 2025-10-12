import { DataMapping } from '@/config/dataMapping';
import { LineFormT } from './LineSchema';

function setFirst(obj:any, keys:string[]|undefined, value:any){
  if (!keys || !keys.length) return;
  const k = keys[0]; obj[k] = value;
}

export function persistLineToModel(dst: any, line: LineFormT & { resolvedGrams: number }) {
  const I = DataMapping.ingredient;

  // identity/sequence
  setFirst(dst, I.sequence, line.sequence as any);
  setFirst(dst, I.id, line.ingredientId);

  // codes
  if (line.codeMode === 'gs1') {
    setFirst(dst, I.gtin, line.gtin);
  } else {
    setFirst(dst, I.codeValue, line.codeValue);
  }
  setFirst(dst, I.codeAliases, line.codeAliases);
  setFirst(dst, I.allowedSymbologies, line.allowedSymbologies);

  // quantities (store grams; if you store percent/volume too, set them as entered)
  setFirst(dst, I.targetQtyG, line.resolvedGrams);
  if (line.qtyMode === 'percent') setFirst(dst, I.percentOfBatch, line.percentOfBatch);
  if (line.qtyMode === 'volume') {
    setFirst(dst, I.targetVolumeMl, line.targetVolumeMl);
    setFirst(dst, I.density_g_per_ml, line.density_g_per_ml);
  }

  // tolerances
  setFirst(dst, I.tolerancePct, line.tolerancePct);
  setFirst(dst, I.toleranceMinAbsG, line.toleranceMinAbsG);

  return dst;
}



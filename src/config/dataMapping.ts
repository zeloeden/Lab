export const DataMapping = {
  formula: {
    // No explicit total grams field found in repo
    batchTotalG: [],
  },
  ingredient: {
    // Found in FormulaIngredient
    sequence: [],
    id: ['id'],
    name: [],

    // Codes: no per-ingredient codes found (GTIN/barcode fields absent)
    codeValue: [],
    gtin: [],
    codeAliases: [],
    allowedSymbologies: [],

    // Quantities: only percentage exists on lines
    targetQtyG: [],
    targetVolumeMl: [],
    percentOfBatch: ['percentage'],

    // Density on RawMaterial (not on line) → leave unmapped here
    density_g_per_ml: [],

    // Tolerances: not present
    tolerancePct: [],
    toleranceMinAbsG: [],
  },
};



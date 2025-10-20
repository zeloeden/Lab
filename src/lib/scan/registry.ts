/**
 * Centralized Scan Registry - Single Source of Truth
 * 
 * Features:
 * - Normalizes any scan format into canonical tokens
 * - Builds comprehensive alias lists for each material
 * - Maintains reverse lookup index for instant validation
 * - Learns new tokens automatically
 * - Future-proof against format changes
 */

export type ScanToken = string;

/**
 * Get all raw materials from localStorage
 * Supports both raw materials and samples
 */
function getAllRawMaterials(): any[] {
  const materials: any[] = [];
  
  // Load raw materials
  try {
    const stored = localStorage.getItem('nbslims_raw_materials');
    if (stored) {
      materials.push(...JSON.parse(stored));
    }
  } catch (e) {
    console.warn('[ScanRegistry] Failed to load raw materials:', e);
  }
  
  // Load samples (they can also be scanned)
  try {
    const stored = localStorage.getItem('nbslims_enhanced_samples');
    if (stored) {
      materials.push(...JSON.parse(stored));
    }
  } catch (e) {
    console.warn('[ScanRegistry] Failed to load samples:', e);
  }
  
  return materials;
}

/**
 * Normalize any scanned string into a stable token.
 * 
 * Supports:
 * - RM:sample-<id>
 * - sample-<id>
 * - S:<code> or plain <code>
 * - Full payloads like: NBS:RM;id=...;code=...;ver=1;ts=...
 * - Key=Value lists separated by ';' or '|'
 */
export function normalizeScan(raw: string): ScanToken {
  let s = (raw ?? '').trim();
  
  if (!s) return '';

  // If it's a payload e.g. NBS:RM;id=...;code=...
  if (/[:;=]/.test(s)) {
    const parts = s.split(/[;|]/).map(p => p.trim());
    const kv: Record<string, string> = {};
    for (const p of parts) {
      const m = p.match(/^([^:=]+)[:=](.+)$/);
      if (m) kv[m[1].toLowerCase()] = m[2];
    }
    // Prefer a true canonical ID if present (remove any existing 'sample-' prefix)
    if (kv.id) {
      const cleanId = String(kv.id).replace(/^sample-/, '').toLowerCase(); // Convert to lowercase for consistency
      return `RM:sample-${cleanId}`;
    }
    if (kv.code) return `S:${kv.code}`;
    // Fall back to the raw payload
    return s;
  }

  // Known forms (convert UUIDs to lowercase for consistency)
  const m1 = s.match(/^RM:sample-([A-Za-z0-9_-]+)$/i);
  if (m1) return `RM:sample-${m1[1].toLowerCase()}`;

  const m2 = s.match(/^sample-([A-Za-z0-9_-]+)$/i);
  if (m2) return `sample-${m2[1].toLowerCase()}`;

  const m3 = s.match(/^S:([A-Za-z0-9._-]+)$/i);
  if (m3) return `S:${m3[1]}`;

  // Plain code/barcode
  return s;
}

/**
 * Build the complete alias list for a material/sample record.
 * Includes all known IDs, codes, barcodes, and persisted aliases.
 */
export function buildScanAliases(sample: any): ScanToken[] {
  if (!sample) return [];
  
  const out = new Set<ScanToken>();

  // Canonical forms based on id/code
  const id = sample?.id ?? sample?.sampleId ?? sample?.uuid;
  if (id) {
    // Remove existing 'sample-' prefix if present to avoid double prefix
    // Convert to lowercase for case-insensitive matching
    const cleanId = String(id).replace(/^sample-/, '').toLowerCase();
    out.add(`RM:sample-${cleanId}`);
    out.add(`sample-${cleanId}`);
  }
  
  const code = 
    sample?.code ?? 
    sample?.sampleCode ?? 
    sample?.materialCode ?? 
    sample?.sku ?? 
    sample?.externalCode;
  if (code) {
    out.add(`S:${code}`);
    out.add(String(code));
  }

  // Any barcode lists we already store
  const rawBarcodes = sample?.barcodes ?? sample?.barcodeList ?? sample?.barcode ?? [];
  (Array.isArray(rawBarcodes) ? rawBarcodes : [rawBarcodes]).forEach((b: any) => {
    if (b) out.add(String(b));
  });

  // Persisted/known aliases (learned over time)
  const persisted = sample?.scanAliases ?? [];
  (Array.isArray(persisted) ? persisted : [persisted]).forEach((t: any) => {
    if (!t) return;
    out.add(normalizeScan(String(t)));
  });

  return Array.from(out).filter(Boolean);
}

/**
 * Reverse-lookup index by token -> materialId
 * Built once and kept in memory for fast lookups
 */
let tokenIndex: Map<ScanToken, string> | null = null;
let lastRebuildTime = 0;

/**
 * Rebuild the scan index from all materials
 * Call this on app boot and whenever materials change
 */
export function rebuildScanIndex() {
  console.log('[ScanRegistry] Rebuilding scan index...');
  tokenIndex = new Map();
  const all = getAllRawMaterials();
  
  let totalTokens = 0;
  for (const s of all) {
    const id = s?.id ?? s?.sampleId ?? s?.uuid;
    if (!id) continue;
    
    const aliases = buildScanAliases(s);
    for (const t of aliases) {
      tokenIndex!.set(t, String(id));
      totalTokens++;
    }
  }
  
  lastRebuildTime = Date.now();
  console.log(`[ScanRegistry] Index built: ${all.length} materials, ${totalTokens} tokens`);
}

/**
 * Resolve a scanned token to a material ID
 * Returns undefined if token is not recognized
 */
export function resolveTokenToMaterialId(token: string): string | undefined {
  if (!tokenIndex) rebuildScanIndex();
  return tokenIndex!.get(normalizeScan(token));
}

/**
 * Check if a token belongs to a specific material
 * Uses both direct alias matching and reverse lookup for robustness
 */
export function tokenMatchesMaterial(token: string, material: any): boolean {
  if (!material) {
    console.log('[ScanRegistry] tokenMatchesMaterial: no material provided');
    return false;
  }
  
  const norm = normalizeScan(token);
  const aliases = buildScanAliases(material).map(normalizeScan);
  
  console.log('[ScanRegistry] tokenMatchesMaterial check:', {
    token,
    normalized: norm,
    materialId: material?.id,
    materialName: material?.itemNameEN || material?.name,
    materialCode: material?.code || material?.customIdNo,
    aliasCount: aliases.length,
    aliases: aliases, // Show ALL aliases
  });
  
  // Direct match in aliases
  if (aliases.includes(norm)) {
    console.log('[ScanRegistry] ✅ Direct alias match!');
    return true;
  }

  // Robust fallback: reverse-lookup must resolve to this material's id
  const id = material?.id ?? material?.sampleId ?? material?.uuid;
  const resolved = resolveTokenToMaterialId(norm);
  
  console.log('[ScanRegistry] Fallback check:', {
    materialId: id,
    resolvedId: resolved,
    match: Boolean(id && resolved && String(id) === String(resolved)),
  });
  
  return Boolean(id && resolved && String(id) === String(resolved));
}

/**
 * Persist a new token to a material's scanAliases
 * This "learns" new scan formats over time
 */
export async function persistTokenIfNew(material: any, token: string): Promise<void> {
  if (!material) return;
  
  const norm = normalizeScan(token);
  const aliases = new Set(buildScanAliases(material));
  
  // Already known
  if (aliases.has(norm)) return;
  
  console.log(`[ScanRegistry] Learning new token for ${material.id || material.name}: ${norm}`);
  
  // Add to scanAliases array
  const existingAliases = material.scanAliases || [];
  const updated = {
    ...material,
    scanAliases: [...existingAliases, norm],
    updatedAt: new Date().toISOString()
  };
  
  // Save back to localStorage
  try {
    // Determine which storage key to use
    const isRawMaterial = !material.id?.startsWith('sample-');
    const storageKey = isRawMaterial ? 'nbslims_raw_materials' : 'nbslims_enhanced_samples';
    
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const items = JSON.parse(stored);
      const idx = items.findIndex((m: any) => 
        (m.id === material.id) || 
        (m.sampleId === material.sampleId) ||
        (m.uuid === material.uuid)
      );
      
      if (idx >= 0) {
        items[idx] = updated;
        localStorage.setItem(storageKey, JSON.stringify(items));
        console.log(`[ScanRegistry] Token persisted to ${storageKey}`);
        
        // Rebuild index to include new token
        rebuildScanIndex();
      }
    }
  } catch (e) {
    console.error('[ScanRegistry] Failed to persist token:', e);
  }
}

/**
 * Get index statistics for debugging
 */
export function getScanIndexStats() {
  if (!tokenIndex) rebuildScanIndex();
  
  return {
    tokenCount: tokenIndex!.size,
    lastRebuildTime,
    age: Date.now() - lastRebuildTime,
  };
}


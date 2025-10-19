/**
 * Unified QR code parsing for the Lab Management System
 * Handles formula codes, UUIDs, sample codes, and key-value pairs
 */

export type ParsedQR = {
  kind: 'formula' | 'sample' | 'unknown';
  raw: string;
  formulaId?: string;        // UUID
  formulaCode?: string;      // Internal code like NBS001
  sampleCode?: string;       // e.g., sample-... or RM:sample-...
  extras: Record<string, string>;
};

/**
 * Normalize scanned input by removing garbage characters and standardizing format
 */
export function normalizeScan(input: string): string {
  if (!input) return '';
  
  // Unicode normalize (NFKC = compatibility composition)
  let clean = input.normalize('NFKC');
  
  // Remove zero-width and RTL marks
  clean = clean.replace(/[\u200e\u200f\ufeff\u061c\u202a-\u202e]/g, '');
  
  // Replace Arabic semicolon and other RTL punctuation with ASCII
  clean = clean.replace(/[؛]/g, ';');
  clean = clean.replace(/[،]/g, ',');
  
  // Collapse multiple whitespace to single space
  clean = clean.replace(/\s+/g, ' ');
  
  // Trim
  clean = clean.trim();
  
  return clean;
}

/**
 * Check if string is a valid UUID v4
 */
export function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Check if string matches formula code pattern (e.g., NBS001, PRM00936)
 */
export function isFormulaCode(str: string): boolean {
  return /^[A-Z]{2,4}\d{3,}$/i.test(str);
}

/**
 * Parse QR code into structured data
 */
export function parseQR(input: string): ParsedQR {
  const raw = input;
  const normalized = normalizeScan(input);
  
  const result: ParsedQR = {
    kind: 'unknown',
    raw,
    extras: {}
  };
  
  if (!normalized) {
    return result;
  }
  
  // Split into tokens by semicolon, comma, pipe, or whitespace
  const tokens = normalized.split(/[;,|\s]+/).filter(Boolean);
  
  if (tokens.length === 0) {
    return result;
  }
  
  // Check first token
  const first = tokens[0];
  
  // 1. Check if first token is a UUID (formula ID)
  if (isUuid(first)) {
    result.kind = 'formula';
    result.formulaId = first;
  }
  // 2. Check if first token is a formula code (NBS001, PRM00936, etc.)
  else if (isFormulaCode(first)) {
    result.kind = 'formula';
    result.formulaCode = first;
  }
  // 3. Check if it starts with sample prefix
  else if (/^(sample-|RM:)/i.test(first)) {
    result.kind = 'sample';
    result.sampleCode = first;
  }
  
  // Parse all tokens for key=value pairs
  for (const token of tokens) {
    const match = token.match(/^([A-Z]+)\s*[:=]\s*(.+)$/i);
    if (match) {
      const [, key, value] = match;
      const keyUpper = key.toUpperCase();
      
      // Special handling for known keys
      if (keyUpper === 'F') {
        // Formula code
        if (isUuid(value)) {
          result.kind = 'formula';
          result.formulaId = value;
        } else {
          result.kind = 'formula';
          result.formulaCode = value;
        }
      } else if (keyUpper === 'S') {
        // Sample code
        result.sampleCode = value;
        result.extras['S'] = value;
      } else if (keyUpper === 'N') {
        // Sequence/ordinal number
        result.extras['N'] = value;
      } else {
        // Store other key-value pairs
        result.extras[keyUpper] = value;
      }
    }
  }
  
  // If we found sample info but already identified as formula, keep formula as primary
  // (formula is the driver for preparations)
  
  return result;
}

/**
 * Normalize a search query for consistent matching
 * (Alias for normalizeScan for search contexts)
 */
export function normalizeForSearch(query: string): string {
  return normalizeScan(query);
}

/**
 * Decode QR code (compatibility with existing codebase)
 * Maps to old decodeQR function signature
 */
export function decodeQR(raw: string): { type: 'prep' | 'formula' | 'sample'; id?: string; code?: string; extras?: Record<string, any> } | null {
  const parsed = parseQR(raw);
  
  if (parsed.kind === 'unknown') {
    return null;
  }
  
  if (parsed.kind === 'formula') {
    return {
      type: 'formula',
      code: parsed.formulaCode || parsed.formulaId || '',
      extras: parsed.extras
    };
  }
  
  if (parsed.kind === 'sample') {
    return {
      type: 'sample',
      code: parsed.sampleCode || '',
      extras: parsed.extras
    };
  }
  
  return null;
}

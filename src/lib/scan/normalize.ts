/**
 * Scan normalization and validation utilities
 * Handles keyboard-wedge garbage, casing, and various formats
 */

/**
 * Simplified normalization for validCodes matching
 * Preserves format structure while cleaning the input
 */
export function normalizeScan(raw: string): string {
  const s = (raw ?? '').trim();
  
  // RM:sample-xxx pattern
  const m1 = s.match(/^RM:sample-([A-Za-z0-9_-]+)$/i);
  if (m1) return `RM:sample-${m1[1]}`;
  
  // S:CODE pattern
  const m2 = s.match(/^S:([A-Za-z0-9._-]+)$/i);
  if (m2) return `S:${m2[1]}`;
  
  // sample-xxx pattern
  const m3 = s.match(/^sample-([A-Za-z0-9_-]+)$/i);
  if (m3) return `sample-${m3[1]}`;
  
  // Plain code or barcode
  return s;
}

/**
 * Normalize scanned input for comparison
 * Removes garbage characters, normalizes casing and format
 */
export function normalizeScanInput(input: string): string {
  if (!input) return '';
  
  let clean = input;
  
  // Remove leading/trailing keyboard-wedge noise
  clean = clean.replace(/^[;:%\s]+|[\r\n]+$/g, '');
  
  // Trim
  clean = clean.trim();
  
  // Remove all whitespace
  clean = clean.replace(/\s+/g, '');
  
  // Remove other common garbage
  clean = clean.replace(/[}÷]/g, '');
  
  // Normalize to uppercase for comparison
  clean = clean.toUpperCase();
  
  // Normalize RM prefix patterns
  // Convert S= or RM=SAMPLE- to standard RM:sample- format
  if (/^S=/i.test(clean)) {
    // S=12345 → RM:sample-12345
    const code = clean.substring(2);
    if (code && !/^sample-/i.test(code)) {
      clean = `RM:SAMPLE-${code}`;
    } else {
      clean = `RM:${code}`;
    }
  } else if (/^RM=SAMPLE-/i.test(clean)) {
    // RM=SAMPLE-12345 → RM:sample-12345
    clean = clean.replace(/^RM=/i, 'RM:');
  }
  
  return clean;
}

/**
 * Extract the naked code portion (digits/letters only)
 * e.g., "RM:sample-1760768282441" → "1760768282441"
 */
export function extractNakedCode(code: string): string {
  // Match the last sequence of digits and letters
  const match = code.match(/([A-Z0-9]+)$/i);
  return match ? match[1].toUpperCase() : '';
}

/**
 * Check if a scanned code matches the required step code
 * Handles multiple formats and aliases
 */
export function isScanMatch(
  scanned: string,
  stepRequired: string,
  rmCode: string,
  altCodes: string[] = []
): boolean {
  // First try simple normalization (preserves structure)
  const s = normalizeScan(scanned);
  const req = normalizeScan(stepRequired);
  const rm = normalizeScan(rmCode);
  
  // Direct match with required code
  if (s === req) return true;
  
  // Direct match with RM code
  if (s === rm) return true;
  
  // Match against alt codes using simple normalization
  const normalizedAltCodes = altCodes.map(c => normalizeScan(c));
  if (normalizedAltCodes.some(alt => s === alt)) return true;
  
  // Fallback to more aggressive normalization
  const sAgressive = normalizeScanInput(scanned);
  const reqAgressive = normalizeScanInput(stepRequired);
  const rmAgressive = normalizeScanInput(rmCode);
  
  if (sAgressive === reqAgressive || sAgressive === rmAgressive) return true;
  
  const agressiveAltCodes = altCodes.map(c => normalizeScanInput(c));
  if (agressiveAltCodes.some(alt => sAgressive === alt)) return true;
  
  // Extract naked codes and compare
  const sNaked = extractNakedCode(sAgressive);
  const reqNaked = extractNakedCode(reqAgressive);
  const rmNaked = extractNakedCode(rmAgressive);
  
  // Naked code matches
  if (sNaked && (sNaked === reqNaked || sNaked === rmNaked)) return true;
  
  // Check if naked code matches any alt code
  if (sNaked && agressiveAltCodes.some(alt => {
    const altNaked = extractNakedCode(alt);
    return altNaked && sNaked === altNaked;
  })) return true;
  
  // Try parsing as QR code format
  // Handle F=code, S=code patterns
  const qrMatch = sAgressive.match(/^([FS])[:=](.+)$/i);
  if (qrMatch) {
    const [, type, code] = qrMatch;
    const normalizedCode = type === 'S' ? `RM:SAMPLE-${code}` : code;
    if (normalizeScanInput(normalizedCode) === rmAgressive || normalizeScanInput(normalizedCode) === reqAgressive) {
      return true;
    }
    // Check naked match
    const codeNaked = extractNakedCode(code);
    if (codeNaked && (codeNaked === rmNaked || codeNaked === reqNaked)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Format a raw material code for display
 */
export function formatRMCode(code: string): string {
  if (!code) return '';
  
  // If it's already formatted nicely, return as-is
  if (/^RM:sample-\d+$/i.test(code)) {
    return code;
  }
  
  // If it's just digits, format as RM:sample-<digits>
  if (/^\d+$/.test(code)) {
    return `RM:sample-${code}`;
  }
  
  return code;
}


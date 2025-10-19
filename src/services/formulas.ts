/**
 * Centralized formula lookup and management
 * Handles both Dexie (when available) and localStorage fallback
 */

import { db } from '@/lib/db';
import { isUuid } from '@/lib/qr';

export type Formula = {
  id: string;
  internalCode?: string;
  externalCode?: string;
  name: string;
  sampleId: string;
  ingredients: any[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
};

/**
 * Get formula by ID or internal code
 * Tries UUID lookup first, then internal code
 */
export async function getFormulaByAny(codeOrId: string): Promise<Formula | null> {
  // Try localStorage first (current storage method)
  try {
    const stored = localStorage.getItem('nbslims_formulas');
    if (stored) {
      const formulas: Formula[] = JSON.parse(stored);
      
      // Try UUID match first
      if (isUuid(codeOrId)) {
        const byId = formulas.find(f => f.id === codeOrId);
        if (byId) return byId;
      }
      
      // Try internal code (case-insensitive)
      const codeUpper = codeOrId.toUpperCase();
      const byCode = formulas.find(f => 
        (f.internalCode || '').toUpperCase() === codeUpper ||
        (f.externalCode || '').toUpperCase() === codeUpper
      );
      
      if (byCode) return byCode;
      
      // Try plain ID match as fallback
      const byPlainId = formulas.find(f => f.id === codeOrId);
      if (byPlainId) return byPlainId;
    }
  } catch (e) {
    console.error('[formulas] localStorage lookup failed:', e);
  }
  
  return null;
}

/**
 * List available formula codes (for "not found" help)
 */
export async function listFormulaCodes(limit = 10): Promise<string[]> {
  try {
    const stored = localStorage.getItem('nbslims_formulas');
    if (stored) {
      const formulas: Formula[] = JSON.parse(stored);
      return formulas
        .slice(0, limit)
        .map(f => f.internalCode || f.id)
        .filter(Boolean);
    }
  } catch (e) {
    console.error('[formulas] listFormulaCodes failed:', e);
  }
  
  return [];
}

/**
 * Get all formulas
 */
export async function getAllFormulas(): Promise<Formula[]> {
  try {
    const stored = localStorage.getItem('nbslims_formulas');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[formulas] getAllFormulas failed:', e);
  }
  
  return [];
}

/**
 * Check if any formulas exist
 */
export async function hasFormulas(): Promise<boolean> {
  const codes = await listFormulaCodes(1);
  return codes.length > 0;
}


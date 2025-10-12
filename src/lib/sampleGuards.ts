import { Sample } from './types';
import { toast } from 'sonner';

/**
 * Central runtime guard for Sample save/update operations.
 * Enforces business rules for FORMULA samples.
 */
export function validateSampleIntegrity(sample: Sample): void {
  if (sample.source === 'FORMULA') {
    if (sample.traceability !== 'actual') {
      const msg = 'FORMULA samples must be actual';
      console.assert(false, msg);
      toast.error('Formula Samples are created automatically from a completed preparation.');
      throw new Error(msg);
    }
    
    if (!sample.preparationSessionId) {
      const msg = 'FORMULA samples require preparationSessionId';
      console.assert(false, msg);
      toast.error('Formula Samples are created automatically from a completed preparation.');
      throw new Error(msg);
    }
  }
}

/**
 * Route/action guard to block manual FORMULA sample creation.
 * Call this before any manual sample creation UI.
 */
export function guardManualFormulaCreation(): void {
  toast.error('Formula Samples are created automatically from a completed preparation.');
  throw new Error('Manual FORMULA sample creation is not allowed');
}

/**
 * ScanIndexKeeper - Maintains the scan registry index
 * 
 * This component:
 * - Rebuilds the scan index on app boot
 * - Listens for raw material changes and rebuilds
 * - Runs in the background without rendering anything
 */

import { useEffect } from 'react';
import { rebuildScanIndex } from '@/lib/scan/registry';

export function ScanIndexKeeper() {
  useEffect(() => {
    console.log('[ScanIndexKeeper] Component mounted!');
    console.log('[ScanIndexKeeper] Initializing scan registry...');
    
    // Build index on mount
    try {
      rebuildScanIndex();
      console.log('[ScanIndexKeeper] Index build complete!');
    } catch (err) {
      console.error('[ScanIndexKeeper] Failed to build index:', err);
    }
    
    // Listen for storage events (when materials change in other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nbslims_raw_materials' || e.key === 'nbslims_enhanced_samples') {
        console.log('[ScanIndexKeeper] Materials changed, rebuilding index...');
        rebuildScanIndex();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom events (when materials change in this tab)
    const handleMaterialUpdate = () => {
      console.log('[ScanIndexKeeper] Material updated, rebuilding index...');
      setTimeout(() => rebuildScanIndex(), 100); // Slight delay to ensure save completes
    };
    
    window.addEventListener('materialUpdated', handleMaterialUpdate);
    window.addEventListener('sampleUpdated', handleMaterialUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('materialUpdated', handleMaterialUpdate);
      window.removeEventListener('sampleUpdated', handleMaterialUpdate);
    };
  }, []);
  
  return null; // No UI
}


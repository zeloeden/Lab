import { db } from '@/lib/database';
import { Sample } from '@/lib/types';
import { barcodeGenerator, generateSampleBarcode } from '@/lib/barcodeUtils';
import { auditService } from '@/lib/auditService';

export const sampleService = {
  async getAllSamples(): Promise<Sample[]> {
    try {
      return await db.samples.orderBy('createdAt').reverse().toArray();
    } catch (error) {
      console.error('Error fetching samples:', error);
      throw new Error('Failed to fetch samples');
    }
  },

  async getSampleById(id: string): Promise<Sample | undefined> {
    try {
      return await db.samples.get(id);
    } catch (error) {
      console.error('Error fetching sample:', error);
      throw new Error('Failed to fetch sample');
    }
  },

  async getSampleByNumber(sampleNo: number): Promise<Sample | undefined> {
    try {
      return await db.samples.where('sampleNo').equals(sampleNo).first();
    } catch (error) {
      console.error('Error fetching sample by number:', error);
      throw new Error('Failed to fetch sample by number');
    }
  },

  async createSample(sampleData: Omit<Sample, 'id' | 'sampleNo' | 'createdAt' | 'updatedAt' | 'barcode'>): Promise<Sample> {
    try {
      // Generate next sample number
      const lastSample = await db.samples.orderBy('sampleNo').reverse().first();
      const nextSampleNo = lastSample ? lastSample.sampleNo + 1 : 1;

      // Check if sample number already exists
      const existingSample = await this.getSampleByNumber(nextSampleNo);
      if (existingSample) {
        throw new Error(`Sample number ${nextSampleNo} already exists`);
      }

      // Generate barcode
      const barcode = generateSampleBarcode(nextSampleNo, sampleData.patchNumber);

      const newSample: Sample = {
        ...sampleData,
        id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sampleNo: nextSampleNo,
        barcode,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.samples.add(newSample);
      
      // Log the creation
      await auditService.logSampleCreation(newSample.id, newSample);
      
      return newSample;
    } catch (error) {
      console.error('Error creating sample:', error);
      throw new Error('Failed to create sample');
    }
  },

  async updateSample(id: string, updates: Partial<Omit<Sample, 'id' | 'sampleNo' | 'createdAt'>>): Promise<Sample> {
    try {
      const existingSample = await this.getSampleById(id);
      if (!existingSample) {
        throw new Error('Sample not found');
      }

      const updatedSample: Sample = {
        ...existingSample,
        ...updates,
        updatedAt: new Date()
      };

      await db.samples.update(id, updatedSample);
      
      // Log the update
      await auditService.logSampleUpdate(id, existingSample, updatedSample);
      
      return updatedSample;
    } catch (error) {
      console.error('Error updating sample:', error);
      throw new Error('Failed to update sample');
    }
  },

  async deleteSample(id: string): Promise<void> {
    try {
      const existingSample = await this.getSampleById(id);
      if (!existingSample) {
        throw new Error('Sample not found');
      }

      // Check if sample has associated tests
      const associatedTests = await db.tests.where('sampleId').equals(id).toArray();
      if (associatedTests.length > 0) {
        throw new Error('Cannot delete sample with associated tests');
      }

      await db.samples.delete(id);
      
      // Log the deletion
      await auditService.logSampleDeletion(id, existingSample);
    } catch (error) {
      console.error('Error deleting sample:', error);
      throw new Error('Failed to delete sample');
    }
  },

  async getSamplesBySupplier(supplierId: string): Promise<Sample[]> {
    try {
      return await db.samples.where('supplierId').equals(supplierId).toArray();
    } catch (error) {
      console.error('Error fetching samples by supplier:', error);
      throw new Error('Failed to fetch samples by supplier');
    }
  },

  async getSamplesByStatus(status: Sample['status']): Promise<Sample[]> {
    try {
      return await db.samples.where('status').equals(status).toArray();
    } catch (error) {
      console.error('Error fetching samples by status:', error);
      throw new Error('Failed to fetch samples by status');
    }
  },

  async searchSamples(query: string): Promise<Sample[]> {
    try {
      const allSamples = await this.getAllSamples();
      const lowercaseQuery = query.toLowerCase();
      
      return allSamples.filter(sample => 
        sample.itemNameEN.toLowerCase().includes(lowercaseQuery) ||
        sample.itemNameAR.toLowerCase().includes(lowercaseQuery) ||
        sample.sampleNo.toString().includes(query) ||
        sample.batchNumber?.toLowerCase().includes(lowercaseQuery) ||
        sample.patchNumber?.toLowerCase().includes(lowercaseQuery) ||
        sample.supplierCode?.toLowerCase().includes(lowercaseQuery) ||
        sample.barcode?.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Error searching samples:', error);
      throw new Error('Failed to search samples');
    }
  },

  // New methods for patch number functionality
  async getSamplesByPatchNumber(patchNumber: string): Promise<Sample[]> {
    try {
      // Prefer enhanced localStorage store if present (UI operates on this store)
      const stored = localStorage.getItem('nbslims_enhanced_samples');
      if (stored) {
        const all: Sample[] = JSON.parse(stored);
        const normalized = String(patchNumber).trim().toLowerCase();
        const filtered = all.filter((s: any) => String(s.patchNumber || '').trim().toLowerCase() === normalized);
        return filtered as unknown as Sample[];
      }

      // Fallback to IndexedDB repository if localStorage not available
      const samples = await db.getSamplesByPatchNumber(patchNumber);
      await auditService.logSearch(patchNumber, samples.length, 'sample');
      return samples;
    } catch (error) {
      console.error('Error fetching samples by patch number:', error);
      throw new Error('Failed to fetch samples by patch number');
    }
  },

  // New methods for barcode functionality
  async searchSampleByBarcode(barcode: string): Promise<Sample | null> {
    try {
      const sample = await db.searchSampleByBarcode(barcode);
      
      // Log the search activity
      await auditService.logSearch(barcode, sample ? 1 : 0, 'sample');
      
      return sample;
    } catch (error) {
      console.error('Error searching sample by barcode:', error);
      throw new Error('Failed to search sample by barcode');
    }
  },

  async generateBarcodeForSample(sampleId: string): Promise<string> {
    try {
      const sample = await this.getSampleById(sampleId);
      if (!sample) {
        throw new Error('Sample not found');
      }

      const barcode = await db.generateBarcode(sampleId, sample.sampleNo);
      
      // Update sample with barcode
      await this.updateSample(sampleId, { barcode });
      
      return barcode;
    } catch (error) {
      console.error('Error generating barcode for sample:', error);
      throw new Error('Failed to generate barcode for sample');
    }
  },

  async getSamplesBySupplierCode(supplierCode: string): Promise<Sample[]> {
    try {
      return await db.samples.where('supplierCode').equals(supplierCode).toArray();
    } catch (error) {
      console.error('Error fetching samples by supplier code:', error);
      throw new Error('Failed to fetch samples by supplier code');
    }
  },

  async updateSampleStatus(id: string, status: Sample['status'], notes?: string): Promise<Sample> {
    try {
      const updates: Partial<Sample> = { status };
      if (notes) {
        updates.notes = notes;
      }
      return await this.updateSample(id, updates);
    } catch (error) {
      console.error('Error updating sample status:', error);
      throw new Error('Failed to update sample status');
    }
  },

  async getSamplesCount(): Promise<number> {
    try {
      return await db.samples.count();
    } catch (error) {
      console.error('Error getting samples count:', error);
      return 0;
    }
  },

  async getSamplesCountByStatus(status: Sample['status']): Promise<number> {
    try {
      return await db.samples.where('status').equals(status).count();
    } catch (error) {
      console.error('Error getting samples count by status:', error);
      return 0;
    }
  },

  async getRecentSamples(limit: number = 10): Promise<Sample[]> {
    try {
      return await db.samples.orderBy('createdAt').reverse().limit(limit).toArray();
    } catch (error) {
      console.error('Error fetching recent samples:', error);
      throw new Error('Failed to fetch recent samples');
    }
  },

  async bulkCreateSamples(samplesData: Omit<Sample, 'id' | 'sampleNo' | 'createdAt' | 'updatedAt'>[]): Promise<Sample[]> {
    try {
      const createdSamples: Sample[] = [];
      
      for (const sampleData of samplesData) {
        const sample = await this.createSample(sampleData);
        createdSamples.push(sample);
      }
      
      return createdSamples;
    } catch (error) {
      console.error('Error bulk creating samples:', error);
      throw new Error('Failed to bulk create samples');
    }
  },

  async exportSamples(): Promise<Sample[]> {
    try {
      return await this.getAllSamples();
    } catch (error) {
      console.error('Error exporting samples:', error);
      throw new Error('Failed to export samples');
    }
  },

  async clearAllSamples(): Promise<void> {
    try {
      // Check if there are any associated tests
      const testsCount = await db.tests.count();
      if (testsCount > 0) {
        throw new Error('Cannot clear samples while tests exist. Delete tests first.');
      }
      
      await db.samples.clear();
    } catch (error) {
      console.error('Error clearing samples:', error);
      throw new Error('Failed to clear samples');
    }
  }
};
import { CompanySettings, StorageLocation } from '@/lib/types';

class CompanyService {
  private static instance: CompanyService;
  private companies: CompanySettings[] = [];
  private rackOccupancy: Map<string, number> = new Map();

  public static getInstance(): CompanyService {
    if (!CompanyService.instance) {
      CompanyService.instance = new CompanyService();
    }
    return CompanyService.instance;
  }

  constructor() {
    this.initializeRackOccupancy();
    this.loadCompanies();
  }

  private initializeRackOccupancy() {
    // Initialize rack occupancy for all racks (A1-A10, B1-B10, C1-C10, D1-D10)
    const racks = ['A', 'B', 'C', 'D'];
    racks.forEach(letter => {
      for (let i = 1; i <= 10; i++) {
        this.rackOccupancy.set(`${letter}${i}`, 0);
      }
    });
  }

  private loadCompanies() {
    const stored = localStorage.getItem('nbslims_companies');
    if (stored) {
      this.companies = JSON.parse(stored);
    } else {
      // Initialize with default companies
      this.companies = [
        {
          id: 'expressions',
          name: 'Expressions',
          initials: 'EXP',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'givaudan',
          name: 'Givaudan',
          initials: 'G',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      this.saveCompanies();
    }
  }

  private saveCompanies() {
    localStorage.setItem('nbslims_companies', JSON.stringify(this.companies));
  }

  private loadRackOccupancy() {
    const stored = localStorage.getItem('nbslims_rack_occupancy');
    if (stored) {
      this.rackOccupancy = new Map(JSON.parse(stored));
    }
  }

  private saveRackOccupancy() {
    localStorage.setItem('nbslims_rack_occupancy', JSON.stringify(Array.from(this.rackOccupancy.entries())));
  }

  // Company Management
  async getCompanies(): Promise<CompanySettings[]> {
    return [...this.companies];
  }

  async getCompanyById(id: string): Promise<CompanySettings | null> {
    return this.companies.find(c => c.id === id) || null;
  }

  async getCompanyByInitials(initials: string): Promise<CompanySettings | null> {
    return this.companies.find(c => c.initials === initials) || null;
  }

  async createCompany(company: Omit<CompanySettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompanySettings> {
    const newCompany: CompanySettings = {
      ...company,
      id: `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.companies.push(newCompany);
    this.saveCompanies();
    return newCompany;
  }

  async updateCompany(id: string, updates: Partial<CompanySettings>): Promise<CompanySettings | null> {
    const index = this.companies.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.companies[index] = {
      ...this.companies[index],
      ...updates,
      updatedAt: new Date()
    };
    
    this.saveCompanies();
    return this.companies[index];
  }

  async deleteCompany(id: string): Promise<boolean> {
    const index = this.companies.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.companies.splice(index, 1);
    this.saveCompanies();
    return true;
  }

  // Rack Management
  getAvailableRacks(): string[] {
    const racks: string[] = [];
    const letters = ['A', 'B', 'C', 'D'];
    
    letters.forEach(letter => {
      for (let i = 1; i <= 10; i++) {
        const rackNumber = `${letter}${i}`;
        const occupancy = this.rackOccupancy.get(rackNumber) || 0;
        if (occupancy < 450) {
          racks.push(rackNumber);
        }
      }
    });
    
    return racks;
  }

  getRackOccupancy(rackNumber: string): number {
    return this.rackOccupancy.get(rackNumber) || 0;
  }

  getNextPositionInRack(rackNumber: string): number {
    const currentOccupancy = this.getRackOccupancy(rackNumber);
    return currentOccupancy + 1;
  }

  // Sample Number Generation with uniqueness validation
  async generateUniqueSampleNumber(companyInitials: string): Promise<string> {
    const existingSamples = await this.getAllSampleNumbers();
    const companyPattern = new RegExp(`^${companyInitials}(\\d+)$`);
    
    // Find all existing sample numbers for this company
    const existingNumbers = existingSamples
      .filter(sampleId => companyPattern.test(sampleId))
      .map(sampleId => {
        const match = sampleId.match(companyPattern);
        return match ? parseInt(match[1], 10) : 0;
      })
      .sort((a, b) => a - b);
    
    // Find the next available number
    let nextNumber = 1;
    for (const num of existingNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }
    
    return `${companyInitials}${nextNumber.toString().padStart(3, '0')}`;
  }

  // Legacy method for backward compatibility
  generateSampleNumber(rackNumber: string, companyInitials: string): string {
    const nextPosition = this.getNextPositionInRack(rackNumber);
    return `${companyInitials}${nextPosition.toString().padStart(3, '0')}`;
  }

  // Validate sample number uniqueness
  async validateSampleNumberUniqueness(sampleId: string, excludeId?: string): Promise<{ isUnique: boolean; suggestion?: string }> {
    const existingSamples = await this.getAllSampleNumbers(excludeId);
    const isUnique = !existingSamples.includes(sampleId);
    
    if (isUnique) {
      return { isUnique: true };
    }
    
    // Extract company prefix and generate a unique suggestion
    const match = sampleId.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const [, prefix, number] = match;
      const suggestion = await this.generateUniqueSampleNumber(prefix);
      return { isUnique: false, suggestion };
    }
    
    return { isUnique: false };
  }

  // Get all existing sample numbers from all sources
  private async getAllSampleNumbers(excludeId?: string): Promise<string[]> {
    const sampleNumbers: string[] = [];
    
    try {
      // Get from enhanced samples (localStorage)
      const enhancedSamples = localStorage.getItem('nbslims_enhanced_samples');
      if (enhancedSamples) {
        const samples = JSON.parse(enhancedSamples);
        samples.forEach((sample: any) => {
          if (sample.sampleId && (!excludeId || sample.id !== excludeId)) {
            sampleNumbers.push(sample.sampleId);
          }
          if (sample.customIdNo && (!excludeId || sample.id !== excludeId)) {
            sampleNumbers.push(sample.customIdNo);
          }
        });
      }
      
      // Get from IndexedDB if available
      if (window.indexedDB) {
        const dbName = 'NBSLIMSDatabase';
        const request = indexedDB.open(dbName);
        
        await new Promise((resolve, reject) => {
          request.onsuccess = () => {
            const db = request.result;
            if (db.objectStoreNames.contains('samples')) {
              const transaction = db.transaction(['samples'], 'readonly');
              const store = transaction.objectStore('samples');
              const getAllRequest = store.getAll();
              
              getAllRequest.onsuccess = () => {
                getAllRequest.result.forEach((sample: any) => {
                  if (sample.customIdNo && (!excludeId || sample.id !== excludeId)) {
                    sampleNumbers.push(sample.customIdNo);
                  }
                });
                resolve(null);
              };
              
              getAllRequest.onerror = () => resolve(null);
            } else {
              resolve(null);
            }
          };
          
          request.onerror = () => resolve(null);
        });
      }
    } catch (error) {
      console.error('Error getting existing sample numbers:', error);
    }
    
    return [...new Set(sampleNumbers)]; // Remove duplicates
  }

  // Storage Location Management
  async assignStorageLocation(rackNumber: string, companyInitials: string): Promise<StorageLocation> {
    const position = this.getNextPositionInRack(rackNumber);
    
    // Update rack occupancy
    this.rackOccupancy.set(rackNumber, position);
    this.saveRackOccupancy();

    return {
      rackNumber,
      position,
      notes: `Position ${position} in rack ${rackNumber}`
    };
  }

  // Get rack statistics
  getRackStatistics() {
    const stats: Record<string, { total: number; available: number; occupancy: number }> = {};
    
    this.rackOccupancy.forEach((occupancy, rackNumber) => {
      stats[rackNumber] = {
        total: 450,
        available: 450 - occupancy,
        occupancy: Math.round((occupancy / 450) * 100)
      };
    });

    return stats;
  }

  // Reset rack occupancy (for testing)
  resetRackOccupancy() {
    this.initializeRackOccupancy();
    this.saveRackOccupancy();
  }
}

export const companyService = CompanyService.getInstance();


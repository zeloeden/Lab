// Service for managing custom user-defined data (brands, concepts, etc.)

interface CustomDataStorage {
  perfumeBrands: string[];
  concepts: string[];
  brandedAsOptions: string[];
  lastUpdated: Date;
}

class CustomDataService {
  private static instance: CustomDataService;
  private storageKey = 'nbslims_custom_data';

  private constructor() {}

  public static getInstance(): CustomDataService {
    if (!CustomDataService.instance) {
      CustomDataService.instance = new CustomDataService();
    }
    return CustomDataService.instance;
  }

  private getCustomData(): CustomDataStorage {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored, (key, value) => {
          if (key === 'lastUpdated' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        });
      }
    } catch (error) {
      console.error('Error loading custom data:', error);
    }

    // Return default structure
    return {
      perfumeBrands: [],
      concepts: [],
      brandedAsOptions: [],
      lastUpdated: new Date()
    };
  }

  private saveCustomData(data: CustomDataStorage): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        ...data,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Error saving custom data:', error);
    }
  }

  // Perfume Brands Management
  public getCustomPerfumeBrands(): string[] {
    return this.getCustomData().perfumeBrands;
  }

  public addCustomPerfumeBrand(brand: string): boolean {
    if (!brand.trim()) return false;
    
    const data = this.getCustomData();
    const trimmedBrand = brand.trim();
    
    if (!data.perfumeBrands.includes(trimmedBrand)) {
      data.perfumeBrands.push(trimmedBrand);
      data.perfumeBrands.sort();
      this.saveCustomData(data);
      return true;
    }
    return false;
  }

  public removeCustomPerfumeBrand(brand: string): boolean {
    const data = this.getCustomData();
    const index = data.perfumeBrands.indexOf(brand);
    
    if (index > -1) {
      data.perfumeBrands.splice(index, 1);
      this.saveCustomData(data);
      return true;
    }
    return false;
  }

  // Concepts Management
  public getCustomConcepts(): string[] {
    return this.getCustomData().concepts;
  }

  public addCustomConcept(concept: string): boolean {
    if (!concept.trim()) return false;
    
    const data = this.getCustomData();
    const trimmedConcept = concept.trim();
    
    if (!data.concepts.includes(trimmedConcept)) {
      data.concepts.push(trimmedConcept);
      data.concepts.sort();
      this.saveCustomData(data);
      return true;
    }
    return false;
  }

  public removeCustomConcept(concept: string): boolean {
    const data = this.getCustomData();
    const index = data.concepts.indexOf(concept);
    
    if (index > -1) {
      data.concepts.splice(index, 1);
      this.saveCustomData(data);
      return true;
    }
    return false;
  }

  // Branded As Options Management
  public getCustomBrandedAsOptions(): string[] {
    return this.getCustomData().brandedAsOptions;
  }
  
  // Alias for addCustomBrandedAsOption for clarity
  public addCustomBrand(brand: string): boolean {
    return this.addCustomBrandedAsOption(brand);
  }

  public addCustomBrandedAsOption(option: string): boolean {
    if (!option.trim()) return false;
    
    const data = this.getCustomData();
    const trimmedOption = option.trim();
    
    if (!data.brandedAsOptions.includes(trimmedOption)) {
      data.brandedAsOptions.push(trimmedOption);
      data.brandedAsOptions.sort();
      this.saveCustomData(data);
      return true;
    }
    return false;
  }

  public removeCustomBrandedAsOption(option: string): boolean {
    const data = this.getCustomData();
    const index = data.brandedAsOptions.indexOf(option);
    
    if (index > -1) {
      data.brandedAsOptions.splice(index, 1);
      this.saveCustomData(data);
      return true;
    }
    return false;
  }

  // Get all data for export/backup
  public getAllCustomData(): CustomDataStorage {
    return this.getCustomData();
  }

  // Import custom data
  public importCustomData(data: Partial<CustomDataStorage>): boolean {
    try {
      const currentData = this.getCustomData();
      const mergedData = {
        ...currentData,
        ...data,
        lastUpdated: new Date()
      };
      this.saveCustomData(mergedData);
      return true;
    } catch (error) {
      console.error('Error importing custom data:', error);
      return false;
    }
  }

  // Clear all custom data
  public clearAllCustomData(): void {
    localStorage.removeItem(this.storageKey);
  }
}

export const customDataService = CustomDataService.getInstance();

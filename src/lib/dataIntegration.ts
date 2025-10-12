/**
 * Data integration system for CSV/Excel import and validation
 */

export interface DataField {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'url' | 'phone';
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => boolean;
  };
  transform?: (value: any) => any;
  description?: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'csv' | 'excel' | 'json' | 'api';
  fields: DataField[];
  data: Record<string, any>[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportResult {
  success: boolean;
  data: Record<string, any>[];
  errors: ImportError[];
  warnings: ImportWarning[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
  };
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value: any;
}

export interface ImportWarning {
  row: number;
  field: string;
  message: string;
  value: any;
}

export class DataIntegrationManager {
  private dataSources: DataSource[] = [];
  private listeners: Array<(sources: DataSource[]) => void> = [];

  /**
   * Parse CSV data
   */
  parseCSV(csvText: string, delimiter: string = ','): Record<string, any>[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
    const data: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
      const row: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }

    return data;
  }

  /**
   * Parse Excel data (simplified - would need xlsx library in real implementation)
   */
  parseExcel(excelData: ArrayBuffer): Record<string, any>[] {
    // This is a placeholder - in a real implementation, you'd use a library like xlsx
    // For now, we'll assume the data is already converted to JSON format
    try {
      const text = new TextDecoder().decode(excelData);
      return JSON.parse(text);
    } catch (error) {
      console.error('Excel parsing failed:', error);
      return [];
    }
  }

  /**
   * Import data from file
   */
  async importData(
    file: File,
    fieldMappings: Record<string, string>,
    validationRules: DataField[]
  ): Promise<ImportResult> {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    let data: Record<string, any>[] = [];

    try {
      // Parse file based on type
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const csvText = await file.text();
        data = this.parseCSV(csvText);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.name.endsWith('.xlsx')) {
        const arrayBuffer = await file.arrayBuffer();
        data = this.parseExcel(arrayBuffer);
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const jsonText = await file.text();
        data = JSON.parse(jsonText);
      } else {
        throw new Error('Unsupported file type');
      }

      // Map fields
      const mappedData = this.mapFields(data, fieldMappings);

      // Validate data
      const validationResult = this.validateData(mappedData, validationRules);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);

      // Transform data
      const transformedData = this.transformData(mappedData, validationRules);

      // Check for duplicates
      const duplicateCount = this.findDuplicates(transformedData).length;

      return {
        success: errors.length === 0,
        data: transformedData,
        errors,
        warnings,
        stats: {
          totalRows: data.length,
          validRows: transformedData.length - duplicateCount,
          invalidRows: errors.length,
          duplicateRows: duplicateCount
        }
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [{
          row: 0,
          field: 'file',
          message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          value: file.name
        }],
        warnings: [],
        stats: {
          totalRows: 0,
          validRows: 0,
          invalidRows: 1,
          duplicateRows: 0
        }
      };
    }
  }

  /**
   * Map fields from source to target
   */
  private mapFields(data: Record<string, any>[], fieldMappings: Record<string, string>): Record<string, any>[] {
    return data.map(row => {
      const mappedRow: Record<string, any> = {};
      Object.entries(fieldMappings).forEach(([targetField, sourceField]) => {
        mappedRow[targetField] = row[sourceField] || '';
      });
      return mappedRow;
    });
  }

  /**
   * Validate data against rules
   */
  private validateData(data: Record<string, any>[], rules: DataField[]): {
    errors: ImportError[];
    warnings: ImportWarning[];
  } {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    data.forEach((row, rowIndex) => {
      rules.forEach(field => {
        const value = row[field.name];
        const validation = field.validation;

        // Check required fields
        if (field.required && (value === undefined || value === null || value === '')) {
          errors.push({
            row: rowIndex + 1,
            field: field.name,
            message: `${field.name} is required`,
            value
          });
          return;
        }

        // Skip validation if value is empty and not required
        if (!value && !field.required) return;

        // Type validation
        if (field.type === 'number' && isNaN(Number(value))) {
          errors.push({
            row: rowIndex + 1,
            field: field.name,
            message: `${field.name} must be a number`,
            value
          });
        }

        if (field.type === 'date' && isNaN(Date.parse(value))) {
          errors.push({
            row: rowIndex + 1,
            field: field.name,
            message: `${field.name} must be a valid date`,
            value
          });
        }

        if (field.type === 'boolean' && !['true', 'false', '1', '0', 'yes', 'no'].includes(String(value).toLowerCase())) {
          warnings.push({
            row: rowIndex + 1,
            field: field.name,
            message: `${field.name} should be a boolean value`,
            value
          });
        }

        if (field.type === 'email' && !this.isValidEmail(value)) {
          errors.push({
            row: rowIndex + 1,
            field: field.name,
            message: `${field.name} must be a valid email`,
            value
          });
        }

        if (field.type === 'url' && !this.isValidUrl(value)) {
          errors.push({
            row: rowIndex + 1,
            field: field.name,
            message: `${field.name} must be a valid URL`,
            value
          });
        }

        if (field.type === 'phone' && !this.isValidPhone(value)) {
          warnings.push({
            row: rowIndex + 1,
            field: field.name,
            message: `${field.name} should be a valid phone number`,
            value
          });
        }

        // Custom validation rules
        if (validation) {
          if (validation.min !== undefined && Number(value) < validation.min) {
            errors.push({
              row: rowIndex + 1,
              field: field.name,
              message: `${field.name} must be at least ${validation.min}`,
              value
            });
          }

          if (validation.max !== undefined && Number(value) > validation.max) {
            errors.push({
              row: rowIndex + 1,
              field: field.name,
              message: `${field.name} must be at most ${validation.max}`,
              value
            });
          }

          if (validation.pattern && !new RegExp(validation.pattern).test(String(value))) {
            errors.push({
              row: rowIndex + 1,
              field: field.name,
              message: `${field.name} format is invalid`,
              value
            });
          }

          if (validation.custom && !validation.custom(value)) {
            errors.push({
              row: rowIndex + 1,
              field: field.name,
              message: `${field.name} failed custom validation`,
              value
            });
          }
        }
      });
    });

    return { errors, warnings };
  }

  /**
   * Transform data using field transformations
   */
  private transformData(data: Record<string, any>[], rules: DataField[]): Record<string, any>[] {
    return data.map(row => {
      const transformedRow: Record<string, any> = {};
      
      rules.forEach(field => {
        let value = row[field.name];
        
        if (field.transform) {
          try {
            value = field.transform(value);
          } catch (error) {
            console.warn(`Transform failed for field ${field.name}:`, error);
          }
        }
        
        transformedRow[field.name] = value;
      });
      
      return transformedRow;
    });
  }

  /**
   * Find duplicate rows
   */
  private findDuplicates(data: Record<string, any>[]): number[] {
    const seen = new Set<string>();
    const duplicates: number[] = [];
    
    data.forEach((row, index) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) {
        duplicates.push(index);
      } else {
        seen.add(key);
      }
    });
    
    return duplicates;
  }

  /**
   * Validation helpers
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Save data source
   */
  saveDataSource(source: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'>): DataSource {
    const newSource: DataSource = {
      ...source,
      id: `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.dataSources.push(newSource);
    this.notifyListeners();
    return newSource;
  }

  /**
   * Get data source by ID
   */
  getDataSource(id: string): DataSource | undefined {
    return this.dataSources.find(source => source.id === id);
  }

  /**
   * Get all data sources
   */
  getAllDataSources(): DataSource[] {
    return [...this.dataSources];
  }

  /**
   * Update data source
   */
  updateDataSource(id: string, updates: Partial<DataSource>): boolean {
    const index = this.dataSources.findIndex(source => source.id === id);
    if (index === -1) return false;

    this.dataSources[index] = {
      ...this.dataSources[index],
      ...updates,
      updatedAt: new Date()
    };

    this.notifyListeners();
    return true;
  }

  /**
   * Delete data source
   */
  deleteDataSource(id: string): boolean {
    const index = this.dataSources.findIndex(source => source.id === id);
    if (index === -1) return false;

    this.dataSources.splice(index, 1);
    this.notifyListeners();
    return true;
  }

  /**
   * Subscribe to data source changes
   */
  subscribe(listener: (sources: DataSource[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.dataSources));
  }

  /**
   * Export data source as CSV
   */
  exportAsCSV(sourceId: string): string {
    const source = this.getDataSource(sourceId);
    if (!source) return '';

    const headers = source.fields.map(field => field.name);
    const csvRows = [headers.join(',')];

    source.data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Export data source as JSON
   */
  exportAsJSON(sourceId: string): string {
    const source = this.getDataSource(sourceId);
    if (!source) return '';

    return JSON.stringify(source, null, 2);
  }
}

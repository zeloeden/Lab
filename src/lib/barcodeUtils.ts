// Barcode and QR Code utilities for NBS LIMS

export interface BarcodeConfig {
  width: number;
  height: number;
  format: 'CODE128' | 'CODE39' | 'EAN13' | 'QR';
  displayValue?: boolean;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
}

export class BarcodeGenerator {
  private static instance: BarcodeGenerator;
  
  public static getInstance(): BarcodeGenerator {
    if (!BarcodeGenerator.instance) {
      BarcodeGenerator.instance = new BarcodeGenerator();
    }
    return BarcodeGenerator.instance;
  }

  /**
   * Generate a barcode string for a sample
   */
  generateBarcodeString(sampleNo: number, patchNumber?: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const patch = patchNumber ? patchNumber.slice(-3) : '000';
    return `NBS${sampleNo.toString().padStart(6, '0')}${patch}${timestamp}`;
  }

  /**
   * Generate QR code data URL
   */
  async generateQRCode(data: string, size: number = 200): Promise<string> {
    try {
      // For now, we'll create a simple text-based QR representation
      // In a real implementation, you'd use a QR code library like 'qrcode'
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Simple QR-like pattern (placeholder)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, size, size);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, 10, size - 20, size - 20);
      
      ctx.fillStyle = '#000000';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(data.slice(0, 20), size / 2, size / 2);
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  /**
   * Generate barcode data URL (Code128 style)
   */
  async generateBarcode(data: string, config: BarcodeConfig = {
    width: 300,
    height: 100,
    format: 'CODE128',
    displayValue: true,
    fontSize: 14
  }): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = config.width;
      canvas.height = config.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Simple barcode pattern (placeholder)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, config.width, config.height);
      
      ctx.fillStyle = '#000000';
      const barWidth = 2;
      const startX = 20;
      let x = startX;
      
      // Generate barcode pattern
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        const pattern = this.getBarcodePattern(char);
        
        for (let j = 0; j < pattern.length; j++) {
          if (pattern[j] === '1') {
            ctx.fillRect(x, 10, barWidth, config.height - 30);
          }
          x += barWidth;
        }
      }
      
      // Add text below barcode
      if (config.displayValue) {
        ctx.fillStyle = '#000000';
        ctx.font = `${config.fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(data, config.width / 2, config.height - 5);
      }
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating barcode:', error);
      throw error;
    }
  }

  /**
   * Get barcode pattern for a character (simplified Code128)
   */
  private getBarcodePattern(charCode: number): string {
    // Simplified pattern - in real implementation, use proper Code128 patterns
    const patterns: { [key: number]: string } = {
      0: '11011001100',
      1: '11001101100',
      2: '11001100110',
      3: '10010011000',
      4: '10010001100',
      5: '10001001100',
      6: '10011001000',
      7: '10011000100',
      8: '10001100100',
      9: '11001001000'
    };
    
    return patterns[charCode % 10] || '11011001100';
  }

  /**
   * Validate barcode format
   */
  validateBarcode(barcode: string): boolean {
    const pattern = /^NBS\d{6}\d{3}\d{6}$/;
    return pattern.test(barcode);
  }

  /**
   * Extract sample number from barcode
   */
  extractSampleNumber(barcode: string): number | null {
    if (!this.validateBarcode(barcode)) return null;
    
    const match = barcode.match(/^NBS(\d{6})/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Extract patch number from barcode
   */
  extractPatchNumber(barcode: string): string | null {
    if (!this.validateBarcode(barcode)) return null;
    
    const match = barcode.match(/^NBS\d{6}(\d{3})/);
    return match ? match[1] : null;
  }
}

// Export singleton instance
export const barcodeGenerator = BarcodeGenerator.getInstance();

// Utility functions
export const generateSampleBarcode = (sampleNo: number, patchNumber?: string): string => {
  return barcodeGenerator.generateBarcodeString(sampleNo, patchNumber);
};

export const validateSampleBarcode = (barcode: string): boolean => {
  return barcodeGenerator.validateBarcode(barcode);
};

export const extractSampleInfo = (barcode: string): { sampleNo: number | null; patchNumber: string | null } => {
  return {
    sampleNo: barcodeGenerator.extractSampleNumber(barcode),
    patchNumber: barcodeGenerator.extractPatchNumber(barcode)
  };
};

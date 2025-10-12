import QRCode from 'qrcode';
import { barcodeGenerator } from './barcodeUtils';
import { Formula } from './formula-types';

export interface FormulaQRData {
  formulaId: string;
  internalCode: string;
  name: string;
  status: string;
  totalCost: number;
  createdAt: string;
  qrId: string;
  url: string;
}

export interface FormulaQRResult {
  qrId: string;
  qrData: string;
  qrImageBase64: string;
  barcode: string;
  barcodeImage: string;
  timestamp: Date;
}

class FormulaQRBarcodeGenerator {
  private static instance: FormulaQRBarcodeGenerator;
  private qrRegistry: Map<string, FormulaQRResult> = new Map();

  private constructor() {
    this.loadQRRegistry();
  }

  public static getInstance(): FormulaQRBarcodeGenerator {
    if (!FormulaQRBarcodeGenerator.instance) {
      FormulaQRBarcodeGenerator.instance = new FormulaQRBarcodeGenerator();
    }
    return FormulaQRBarcodeGenerator.instance;
  }

  private loadQRRegistry() {
    try {
      const stored = localStorage.getItem('nbslims_formula_qr_registry');
      if (stored) {
        const data = JSON.parse(stored);
        this.qrRegistry = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Error loading formula QR registry:', error);
    }
  }

  private saveQRRegistry() {
    try {
      const data = Object.fromEntries(this.qrRegistry);
      localStorage.setItem('nbslims_formula_qr_registry', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving formula QR registry:', error);
    }
  }

  /**
   * Generate QR code and barcode for a formula
   */
  public async generateFormulaQRBarcode(formula: Formula): Promise<FormulaQRResult> {
    // Create unique QR ID
    const qrId = `FORMULA-QR-${formula.internalCode}-${Date.now()}`;
    
    // Check if QR already exists for this formula
    const existingQR = this.qrRegistry.get(formula.id);
    if (existingQR) {
      return existingQR;
    }

    // Create comprehensive QR data
    const qrDataObject: FormulaQRData = {
      formulaId: formula.id,
      internalCode: formula.internalCode,
      name: formula.name,
      status: formula.status,
      totalCost: formula.totalCost,
      createdAt: formula.createdAt.toISOString(),
      qrId: qrId,
      url: `${window.location.origin}/formulas/${formula.id}`
    };

    // Convert to compact string format
    const qrDataString = JSON.stringify(qrDataObject);

    try {
      // Generate QR code image
      const qrImageBase64 = await QRCode.toDataURL(qrDataString, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      // Generate barcode string
      const barcodeString = this.generateFormulaBarcodeString(formula);

      // Generate barcode image
      const barcodeImage = await barcodeGenerator.generateBarcode(barcodeString, {
        width: 300,
        height: 100,
        format: 'CODE128',
        displayValue: true,
        fontSize: 12
      });

      const qrResult: FormulaQRResult = {
        qrId,
        qrData: qrDataString,
        qrImageBase64,
        barcode: barcodeString,
        barcodeImage,
        timestamp: new Date()
      };

      // Store in registry
      this.qrRegistry.set(formula.id, qrResult);
      this.saveQRRegistry();

      return qrResult;
    } catch (error) {
      console.error('Error generating formula QR/barcode:', error);
      throw new Error('Failed to generate QR code and barcode');
    }
  }

  /**
   * Generate barcode string for formula
   */
  private generateFormulaBarcodeString(formula: Formula): string {
    // New Format: FORMULA-{internalCode}-{status}
    const statusCode = formula.status.charAt(0).toUpperCase();
    return `FORMULA-${formula.internalCode}-${statusCode}`;
  }

  /**
   * Get QR code and barcode for a formula
   */
  public getFormulaQRBarcode(formulaId: string): FormulaQRResult | null {
    return this.qrRegistry.get(formulaId) || null;
  }

  /**
   * Update QR code and barcode for a formula
   */
  public async updateFormulaQRBarcode(formula: Formula): Promise<FormulaQRResult> {
    // Remove old QR if exists
    this.qrRegistry.delete(formula.id);

    // Generate new QR and barcode
    return await this.generateFormulaQRBarcode(formula);
  }

  /**
   * Get all formula QR codes and barcodes
   */
  public getAllFormulaQRCodes(): FormulaQRResult[] {
    return Array.from(this.qrRegistry.values());
  }

  /**
   * Delete QR code and barcode for a formula
   */
  public deleteFormulaQR(formulaId: string): boolean {
    const deleted = this.qrRegistry.delete(formulaId);
    if (deleted) {
      this.saveQRRegistry();
    }
    return deleted;
  }

  /**
   * Generate simple QR for quick use
   */
  public async generateSimpleFormulaQR(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        width: 150,
        margin: 1,
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error('Error generating simple formula QR:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Validate barcode format
   */
  public validateFormulaBarcode(barcode: string): boolean {
    const patternNew = /^FORMULA-[A-Z0-9]+-[A-Z]$/;
    const patternOld = /^FORMULA-[A-Z0-9]+-\d+[A-Z]+-[A-Z]$/;
    return patternNew.test(barcode) || patternOld.test(barcode);
  }

  /**
   * Extract formula info from barcode
   */
  public extractFormulaInfo(barcode: string): {
    internalCode: string | null;
    status: string | null;
  } | null {
    if (!this.validateFormulaBarcode(barcode)) return null;
    // New format
    const mNew = barcode.match(/^FORMULA-([A-Z0-9]+)-([A-Z])$/);
    if (mNew) return { internalCode: mNew[1], status: mNew[2] };
    // Old format fallback
    const mOld = barcode.match(/^FORMULA-([A-Z0-9]+)-(\d+)([A-Z]+)-([A-Z])$/);
    if (mOld) return { internalCode: mOld[1], status: mOld[4] };
    return null;
  }
}

export const formulaQRBarcodeGenerator = FormulaQRBarcodeGenerator.getInstance();

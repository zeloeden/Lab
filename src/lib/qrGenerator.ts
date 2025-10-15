import QRCode from 'qrcode';

export interface SampleQRData {
  sampleId: string;
  sampleNo: number;
  itemNameEN: string;
  itemNameAR?: string;
  supplierId: string;
  supplierCode?: string;
  batchNumber?: string;
  storageLocation?: {
    rackArea?: string;
    rackNumber?: string;
    position?: number;
  };
  createdAt: Date;
  customIdNo?: string;
}

export interface QRCodeResult {
  qrId: string;
  qrData: string;
  qrImageBase64: string;
  timestamp: Date;
}

class QRGenerator {
  private static instance: QRGenerator;
  private qrRegistry: Map<string, QRCodeResult> = new Map();

  private constructor() {
    this.loadQRRegistry();
  }

  public static getInstance(): QRGenerator {
    if (!QRGenerator.instance) {
      QRGenerator.instance = new QRGenerator();
    }
    return QRGenerator.instance;
  }

  private loadQRRegistry() {
    try {
      const stored = localStorage.getItem('nbslims_qr_registry');
      if (stored) {
        const data = JSON.parse(stored);
        this.qrRegistry = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Error loading QR registry:', error);
    }
  }

  private saveQRRegistry() {
    try {
      const data = Object.fromEntries(this.qrRegistry);
      localStorage.setItem('nbslims_qr_registry', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving QR registry:', error);
    }
  }

  /**
   * Generate a unique QR code for a sample
   */
  public async generateSampleQR(sampleData: SampleQRData): Promise<QRCodeResult> {
    // Compact, stable payload: S=<sampleId>
    const qrId = `S:${sampleData.sampleId}`;
    
    // Check if QR already exists for this sample
    const existingQR = Array.from(this.qrRegistry.values())
      .find(qr => qr.qrData.includes(sampleData.sampleId) || qr.qrData.includes(sampleData.customIdNo || ''));
    
    if (existingQR) {
      return existingQR;
    }

    // Minimal content for scanning; no URLs/verbose JSON
    const qrDataString = qrId;

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

      const qrResult: QRCodeResult = {
        qrId,
        qrData: qrDataString,
        qrImageBase64,
        timestamp: new Date()
      };

      // Store in registry
      this.qrRegistry.set(qrId, qrResult);
      this.saveQRRegistry();

      return qrResult;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Get QR code for a sample
   */
  public getSampleQR(sampleId: string): QRCodeResult | null {
    const qrResult = Array.from(this.qrRegistry.values())
      .find(qr => qr.qrData.includes(sampleId));
    return qrResult || null;
  }

  /**
   * Update QR code for a sample
   */
  public async updateSampleQR(sampleData: SampleQRData): Promise<QRCodeResult> {
    // Remove old QR if exists
    const oldQR = this.getSampleQR(sampleData.sampleId);
    if (oldQR) {
      this.qrRegistry.delete(oldQR.qrId);
    }

    // Generate new QR
    return await this.generateSampleQR(sampleData);
  }

  /**
   * Get all QR codes
   */
  public getAllQRCodes(): QRCodeResult[] {
    return Array.from(this.qrRegistry.values());
  }

  /**
   * Delete QR code
   */
  public deleteQR(qrId: string): boolean {
    const deleted = this.qrRegistry.delete(qrId);
    if (deleted) {
      this.saveQRRegistry();
    }
    return deleted;
  }

  /**
   * Validate QR uniqueness
   */
  public isQRUnique(qrData: string): boolean {
    return !Array.from(this.qrRegistry.values())
      .some(qr => qr.qrData === qrData);
  }

  /**
   * Generate simple QR for quick use
   */
  public async generateSimpleQR(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        width: 150,
        margin: 1,
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error('Error generating simple QR:', error);
      throw new Error('Failed to generate QR code');
    }
  }
}

export const qrGenerator = QRGenerator.getInstance();

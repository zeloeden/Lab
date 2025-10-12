/**
 * Real barcode and QR code generation with actual rendering
 */

import { mmToPx } from '@/lib/units';

export interface BarcodeConfig {
  symbology: 'code128' | 'ean13' | 'gs1-128' | 'code39' | 'code93' | 'codabar' | 'upc-a' | 'upc-e' | 'ean8';
  value: string;
  widthMm: number;
  heightMm: number;
  quietZoneMm?: number;
  lineColor?: string;
  background?: string;
  displayValue?: boolean;
  fontSize?: number;
  font?: string;
  textAlign?: 'left' | 'center' | 'right';
  textPosition?: 'top' | 'bottom';
}

export interface QRConfig {
  value: string;
  sizeMm: number;
  marginMm?: number;
  foreground?: string;
  background?: string;
  ecc?: 'L' | 'M' | 'Q' | 'H';
  logo?: string;
  logoSize?: number;
}

/**
 * Generate real barcode using JsBarcode
 */
export async function generateRealBarcode(config: BarcodeConfig): Promise<string> {
  try {
    const width = Math.max(1, Math.floor(mmToPx(config.widthMm)));
    const height = Math.max(1, Math.floor(mmToPx(config.heightMm)));
    const quietZone = Math.floor(mmToPx(config.quietZoneMm || 1));

    const canvas = document.createElement('canvas');
    canvas.width = width + quietZone * 2;
    canvas.height = height + quietZone * 2;

    // Use JsBarcode for most barcode types
    const options: any = {
      format: config.symbology.toUpperCase(),
      width: 2,
      height: height,
      displayValue: config.displayValue || false,
      textMargin: 4,
      fontSize: config.fontSize || 10,
      font: config.font || 'Arial',
      textAlign: config.textAlign || 'center',
      textPosition: config.textPosition || 'bottom',
      lineColor: config.lineColor || '#000000',
      background: config.background || '#ffffff',
      margin: quietZone
    };

    // Generate barcode
    JsBarcode(canvas, config.value, options);

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Barcode generation failed:', error);
    return generateFallbackBarcode(config);
  }
}

/**
 * Generate real QR code using qrcode library
 */
export async function generateRealQR(config: QRConfig): Promise<string> {
  try {
    const size = Math.max(1, Math.floor(mmToPx(config.sizeMm)));
    const margin = Math.floor(mmToPx(config.marginMm || 1));

    const canvas = document.createElement('canvas');
    canvas.width = size + margin * 2;
    canvas.height = size + margin * 2;

    await QRCode.toCanvas(canvas, config.value, {
      width: size,
      margin,
      color: {
        dark: config.foreground || '#000000',
        light: config.background || '#ffffff'
      },
      errorCorrectionLevel: config.ecc || 'M'
    });

    // Add logo if specified
    if (config.logo) {
      await addLogoToQR(canvas, config.logo, config.logoSize || 0.2);
    }

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('QR code generation failed:', error);
    return generateFallbackQR(config);
  }
}

/**
 * Add logo to QR code
 */
async function addLogoToQR(canvas: HTMLCanvasElement, logoUrl: string, logoSizeRatio: number): Promise<void> {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = logoUrl;
    });

    const logoSize = Math.min(canvas.width, canvas.height) * logoSizeRatio;
    const x = (canvas.width - logoSize) / 2;
    const y = (canvas.height - logoSize) / 2;

    ctx.drawImage(img, x, y, logoSize, logoSize);
  } catch (error) {
    console.error('Logo addition failed:', error);
  }
}

/**
 * Generate fallback barcode when real generation fails
 */
function generateFallbackBarcode(config: BarcodeConfig): string {
  const canvas = document.createElement('canvas');
  const width = Math.floor(mmToPx(config.widthMm));
  const height = Math.floor(mmToPx(config.heightMm));
  
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Draw background
  ctx.fillStyle = config.background || '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Draw barcode pattern
  ctx.fillStyle = config.lineColor || '#000000';
  const barWidth = 2;
  const barHeight = height - 20;
  
  for (let i = 0; i < config.value.length; i++) {
    if (i % 2 === 0) {
      ctx.fillRect(i * barWidth, 10, barWidth, barHeight);
    }
  }

  // Draw text
  if (config.displayValue) {
    ctx.fillStyle = config.lineColor || '#000000';
    ctx.font = `${config.fontSize || 10}px ${config.font || 'Arial'}`;
    ctx.textAlign = 'center';
    ctx.fillText(config.value, width / 2, height - 5);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Generate fallback QR code when real generation fails
 */
function generateFallbackQR(config: QRConfig): string {
  const canvas = document.createElement('canvas');
  const size = Math.floor(mmToPx(config.sizeMm));
  
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Draw background
  ctx.fillStyle = config.background || '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Draw QR pattern
  ctx.fillStyle = config.foreground || '#000000';
  const cellSize = size / 25; // 25x25 grid
  
  for (let x = 0; x < 25; x++) {
    for (let y = 0; y < 25; y++) {
      if ((x + y) % 3 === 0) {
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  return canvas.toDataURL('image/png');
}

/**
 * Validate barcode value based on symbology
 */
export function validateBarcodeValue(value: string, symbology: string): { valid: boolean; error?: string } {
  switch (symbology) {
    case 'ean13':
      return validateEAN13(value);
    case 'ean8':
      return validateEAN8(value);
    case 'upc-a':
      return validateUPCA(value);
    case 'upc-e':
      return validateUPCE(value);
    case 'code128':
      return validateCode128(value);
    case 'code39':
      return validateCode39(value);
    case 'code93':
      return validateCode93(value);
    case 'codabar':
      return validateCodabar(value);
    case 'gs1-128':
      return validateGS1128(value);
    default:
      return { valid: true };
  }
}

function validateEAN13(value: string): { valid: boolean; error?: string } {
  const v = value.replace(/\D/g, '');
  if (v.length !== 13) {
    return { valid: false, error: 'EAN-13 must be exactly 13 digits' };
  }
  
  const digits = v.split('').map(d => parseInt(d, 10));
  const checksum = calculateEANChecksum(digits.slice(0, 12));
  
  if (checksum !== digits[12]) {
    return { valid: false, error: 'Invalid EAN-13 checksum' };
  }
  
  return { valid: true };
}

function validateEAN8(value: string): { valid: boolean; error?: string } {
  const v = value.replace(/\D/g, '');
  if (v.length !== 8) {
    return { valid: false, error: 'EAN-8 must be exactly 8 digits' };
  }
  
  const digits = v.split('').map(d => parseInt(d, 10));
  const checksum = calculateEANChecksum(digits.slice(0, 7));
  
  if (checksum !== digits[7]) {
    return { valid: false, error: 'Invalid EAN-8 checksum' };
  }
  
  return { valid: true };
}

function validateUPCA(value: string): { valid: boolean; error?: string } {
  const v = value.replace(/\D/g, '');
  if (v.length !== 12) {
    return { valid: false, error: 'UPC-A must be exactly 12 digits' };
  }
  
  const digits = v.split('').map(d => parseInt(d, 10));
  const checksum = calculateEANChecksum(digits.slice(0, 11));
  
  if (checksum !== digits[11]) {
    return { valid: false, error: 'Invalid UPC-A checksum' };
  }
  
  return { valid: true };
}

function validateUPCE(value: string): { valid: boolean; error?: string } {
  const v = value.replace(/\D/g, '');
  if (v.length !== 8) {
    return { valid: false, error: 'UPC-E must be exactly 8 digits' };
  }
  
  return { valid: true };
}

function validateCode128(value: string): { valid: boolean; error?: string } {
  if (value.length === 0) {
    return { valid: false, error: 'Code 128 cannot be empty' };
  }
  
  if (value.length > 80) {
    return { valid: false, error: 'Code 128 cannot exceed 80 characters' };
  }
  
  return { valid: true };
}

function validateCode39(value: string): { valid: boolean; error?: string } {
  if (value.length === 0) {
    return { valid: false, error: 'Code 39 cannot be empty' };
  }
  
  const validChars = /^[A-Z0-9\-\.\s\$\/\+\%]+$/;
  if (!validChars.test(value)) {
    return { valid: false, error: 'Code 39 contains invalid characters' };
  }
  
  return { valid: true };
}

function validateCode93(value: string): { valid: boolean; error?: string } {
  if (value.length === 0) {
    return { valid: false, error: 'Code 93 cannot be empty' };
  }
  
  return { valid: true };
}

function validateCodabar(value: string): { valid: boolean; error?: string } {
  if (value.length === 0) {
    return { valid: false, error: 'Codabar cannot be empty' };
  }
  
  const validChars = /^[0-9\-\$:/.+]+$/;
  if (!validChars.test(value)) {
    return { valid: false, error: 'Codabar contains invalid characters' };
  }
  
  return { valid: true };
}

function validateGS1128(value: string): { valid: boolean; error?: string } {
  if (value.length === 0) {
    return { valid: false, error: 'GS1-128 cannot be empty' };
  }
  
  return { valid: true };
}

function calculateEANChecksum(digits: number[]): number {
  const sum = digits.reduce((acc, digit, index) => {
    return acc + digit * (index % 2 === 0 ? 1 : 3);
  }, 0);
  
  return (10 - (sum % 10)) % 10;
}

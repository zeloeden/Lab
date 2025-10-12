import JsBarcode from 'jsbarcode';
// @ts-ignore - bwip-js has no default types
import bwipjs from 'bwip-js';
import QRCode from 'qrcode';
import { mmToPx } from '@/lib/units';

// Install required packages if not already installed
// npm install jsbarcode qrcode bwip-js

export type Symbology = 'code128' | 'ean13' | 'gs1-128';

export interface BarcodeInput {
  symbology: Symbology;
  value: string;
  widthMm: number;
  heightMm: number;
  quietZoneMm?: number;
  lineColor?: string;
  background?: string;
  displayValue?: boolean;
  fontSize?: number;
  font?: string;
}

export async function generateBarcodeCanvas(input: BarcodeInput): Promise<HTMLCanvasElement> {
  const width = Math.max(1, Math.floor(mmToPx(input.widthMm)));
  const height = Math.max(1, Math.floor(mmToPx(input.heightMm)));
  const quiet = Math.floor(mmToPx(input.quietZoneMm ?? 1));

  const canvas = document.createElement('canvas');
  canvas.width = width + quiet * 2;
  canvas.height = height + quiet * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // background
  ctx.fillStyle = input.background || '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const opts: any = {
    format: input.symbology === 'ean13' ? 'EAN13' : 'CODE128',
    lineColor: input.lineColor || '#000000',
    background: input.background || '#ffffff',
    width: 2,
    height: height,
    displayValue: !!input.displayValue,
    textMargin: 4,
    fontSize: input.fontSize ?? 12,
    font: input.font ?? 'Arial',
    margin: 0
  };

  try {
    if (input.symbology === 'gs1-128') {
      // Use bwip-js for GS1-128
      const bwCanvas = document.createElement('canvas');
      bwCanvas.width = width;
      bwCanvas.height = height;
      await new Promise<void>((resolve, reject) => {
        try {
          bwipjs.toCanvas(bwCanvas, {
            bcid: 'gs1-128',
            text: input.value,
            scale: 2,
            height: height,
            includetext: !!input.displayValue,
            textxalign: 'center',
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
      ctx.drawImage(bwCanvas, quiet, quiet);
      return canvas;
    } else {
      // Use JsBarcode for Code128 / EAN-13
      const inner = document.createElement('canvas');
      inner.width = width;
      inner.height = height;
      JsBarcode(inner, input.value, opts);
      ctx.drawImage(inner, quiet, quiet);
      return canvas;
    }
  } catch (_err) {
    // Fallback: render placeholder box
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(quiet, quiet, width, height);
    return canvas;
  }
}

export interface QRInput {
  value: string;
  sizeMm: number;
  marginMm?: number;
  foreground?: string;
  background?: string;
  ecc?: 'L' | 'M' | 'Q' | 'H';
}

export async function generateQRCanvas(input: QRInput): Promise<HTMLCanvasElement> {
  const size = Math.max(1, Math.floor(mmToPx(input.sizeMm)));
  const margin = Math.floor(mmToPx(input.marginMm ?? 1));
  const canvas = document.createElement('canvas');
  canvas.width = size + margin * 2;
  canvas.height = size + margin * 2;
  await QRCode.toCanvas(canvas, input.value, {
    width: size,
    margin,
    color: {
      dark: input.foreground || '#000000',
      light: input.background || '#ffffff'
    },
    errorCorrectionLevel: input.ecc || 'M'
  });
  return canvas;
}

export function validateEAN13(value: string): boolean {
  const v = value.replace(/\D/g, '');
  if (v.length !== 13) return false;
  const digits = v.split('').map(d => parseInt(d, 10));
  const checksum = (arr: number[]) => {
    const sum = arr.slice(0, 12).reduce((acc, d, idx) => acc + d * (idx % 2 === 0 ? 1 : 3), 0);
    return (10 - (sum % 10)) % 10;
  };
  return checksum(digits) === digits[12];
}



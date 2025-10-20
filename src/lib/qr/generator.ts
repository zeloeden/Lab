/**
 * Unified QR/Barcode Generator for NBS LIMS
 * 
 * Generates consistent, self-contained QR codes for all materials
 * Format: NBS:RM;id=xxx;code=xxx;name=xxx;ver=1
 */

import QRCode from 'qrcode';

export type MaterialQRData = {
  id: string;
  code?: string;
  name?: string;
  type?: 'sample' | 'raw_material' | 'formula';
  batchNo?: string;
};

/**
 * Generate unified QR payload for a material
 * This format is recognized by the scan registry everywhere in the system
 */
export function buildMaterialQRPayload(data: MaterialQRData): string {
  const parts = ['NBS:RM'];
  
  // Always include ID (required)
  const cleanId = String(data.id).replace(/^sample-/, '');
  parts.push(`id=${cleanId}`);
  
  // Add code if available
  if (data.code) {
    parts.push(`code=${data.code}`);
  }
  
  // Add name for human readability
  if (data.name) {
    // Escape semicolons in name
    const safeName = data.name.replace(/;/g, ',');
    parts.push(`name=${safeName}`);
  }
  
  // Add type if specified
  if (data.type) {
    parts.push(`type=${data.type}`);
  }
  
  // Add batch number if applicable
  if (data.batchNo) {
    parts.push(`batch=${data.batchNo}`);
  }
  
  // Version for future compatibility
  parts.push('ver=1');
  
  return parts.join(';');
}

/**
 * Generate QR code image as base64 data URL
 */
export async function generateQRCode(payload: string): Promise<string> {
  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
    });
  } catch (err) {
    console.error('[QRGenerator] Failed to generate QR code:', err);
    throw err;
  }
}

/**
 * Generate barcode-friendly linear code (Code 128)
 * For samples, use: S-{sampleId}
 * For formulas, use: F-{formulaId}
 */
export function generateBarcodeValue(data: MaterialQRData): string {
  const cleanId = String(data.id).replace(/^sample-/, '').substring(0, 12);
  
  if (data.type === 'formula') {
    return `F-${cleanId}`;
  }
  
  // For samples and raw materials
  return `S-${cleanId}`;
}

/**
 * All-in-one: Generate QR code and barcode for a material
 */
export async function generateMaterialCodes(material: {
  id: string;
  code?: string;
  name?: string;
  itemNameEN?: string;
  itemNameAR?: string;
  type?: 'sample' | 'raw_material';
}): Promise<{
  qrPayload: string;
  qrImage: string;
  barcode: string;
}> {
  const data: MaterialQRData = {
    id: material.id,
    code: material.code,
    name: material.name || material.itemNameEN || material.itemNameAR,
    type: material.type || 'sample',
  };
  
  const payload = buildMaterialQRPayload(data);
  const qrImage = await generateQRCode(payload);
  const barcode = generateBarcodeValue(data);
  
  console.log(`[QRGenerator] Generated codes for ${data.name || data.id}:`, {
    payload,
    barcode,
  });
  
  return {
    qrPayload: payload,
    qrImage,
    barcode,
  };
}

/**
 * Parse a QR payload back into data
 * Handles both uppercase and lowercase field names for backwards compatibility
 */
export function parseQRPayload(payload: string): MaterialQRData | null {
  try {
    // Case-insensitive check for NBS prefix
    if (!payload.toUpperCase().startsWith('NBS:')) return null;
    
    const parts = payload.split(';');
    const data: any = {};
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key && value) {
        // Convert keys to lowercase for consistent access
        data[key.toLowerCase()] = value;
      }
    }
    
    if (!data.id) return null;
    
    return {
      id: `sample-${data.id}`,
      code: data.code,
      name: data.name,
      type: data.type as any,
      batchNo: data.batch,
    };
  } catch (err) {
    console.error('[QRGenerator] Failed to parse QR payload:', err);
    return null;
  }
}


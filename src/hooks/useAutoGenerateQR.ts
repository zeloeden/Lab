/**
 * Hook to automatically generate QR and barcode when creating/editing samples
 */

import { useEffect, useState } from 'react';
import { generateMaterialCodes } from '@/lib/qr/generator';

export function useAutoGenerateQR(material: {
  id?: string;
  code?: string;
  name?: string;
  itemNameEN?: string;
  itemNameAR?: string;
  type?: 'sample' | 'raw_material';
} | null) {
  const [qrData, setQrData] = useState<{
    qrPayload: string;
    qrImage: string;
    barcode: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!material?.id) {
      setQrData(null);
      return;
    }

    setIsGenerating(true);
    generateMaterialCodes(material)
      .then(setQrData)
      .catch((err) => {
        console.error('[useAutoGenerateQR] Failed to generate codes:', err);
        setQrData(null);
      })
      .finally(() => setIsGenerating(false));
  }, [material?.id, material?.code, material?.name, material?.itemNameEN]);

  return { qrData, isGenerating };
}


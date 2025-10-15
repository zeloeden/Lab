import { Sample } from '@/lib/types';
import { Formula } from '@/lib/formula-types';
import { qrGenerator } from '@/lib/qrGenerator';
import { formulaQRBarcodeGenerator } from '@/lib/formulaQRBarcode';
import { v4 as uuidv4 } from 'uuid';

export const initializeSampleData = () => {
  // Check if data already exists
  const existingSamples = localStorage.getItem('nbslims_enhanced_samples');
  const existingFormulas = localStorage.getItem('nbslims_formulas');
  
  if (existingSamples && existingFormulas) {
    return; // Data already exists
  }
  
  // Create 4 raw materials (including 3 colors)
  const rawMaterials: Sample[] = [
    { id: 'rm-rose', sampleNo: 1001, itemNameEN: 'Rose Absolute', supplierId: 'supplier-1', patchNumber: 'RM-001', status: 'Accepted', approved: true, isRawMaterial: true, storageLocation: { rackNumber: 'A1', position: 1 }, pricing: { basePrice: 500, currency: 'USD', scalingPrices: [] }, dateOfSample: new Date('2024-01-15'), createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15'), createdBy: 'system', updatedBy: 'system' } as any,
    { id: 'color-red', sampleNo: 1101, itemNameEN: 'Color Red', supplierId: 'supplier-1', patchNumber: 'CL-RED', status: 'Accepted', approved: true, isRawMaterial: true, storageLocation: { rackNumber: 'C1', position: 1 }, pricing: { basePrice: 5, currency: 'USD', scalingPrices: [] }, dateOfSample: new Date('2024-01-10'), createdAt: new Date('2024-01-10'), updatedAt: new Date('2024-01-10'), createdBy: 'system', updatedBy: 'system', colorCode: '#FF0000', type: 'color' } as any,
    { id: 'color-blue', sampleNo: 1102, itemNameEN: 'Color Blue', supplierId: 'supplier-1', patchNumber: 'CL-BLU', status: 'Accepted', approved: true, isRawMaterial: true, storageLocation: { rackNumber: 'C1', position: 2 }, pricing: { basePrice: 5, currency: 'USD', scalingPrices: [] }, dateOfSample: new Date('2024-01-11'), createdAt: new Date('2024-01-11'), updatedAt: new Date('2024-01-11'), createdBy: 'system', updatedBy: 'system', colorCode: '#0057FF', type: 'color' } as any,
    { id: 'color-yellow', sampleNo: 1103, itemNameEN: 'Color Yellow', supplierId: 'supplier-1', patchNumber: 'CL-YLW', status: 'Accepted', approved: true, isRawMaterial: true, storageLocation: { rackNumber: 'C1', position: 3 }, pricing: { basePrice: 5, currency: 'USD', scalingPrices: [] }, dateOfSample: new Date('2024-01-12'), createdAt: new Date('2024-01-12'), updatedAt: new Date('2024-01-12'), createdBy: 'system', updatedBy: 'system', colorCode: '#FFC300', type: 'color' } as any
  ];
  
  // Create 4 primary samples for formulas
  const primarySamples: Sample[] = [
    {
      id: 'sample-1',
      sampleNo: 2001,
      itemNameEN: 'Oriental Night Base',
      sampleId: 'EXP001',
      itemNameAR: 'قاعدة الليلة الشرقية',
      supplierId: 'supplier-1',
      patchNumber: 'PS-001',
      status: 'Accepted',
      approved: true,
      isRawMaterial: false,
      storageLocation: { rackNumber: 'B1', position: 1 },
      pricing: { basePrice: 150, currency: 'USD', scalingPrices: [] },
      dateOfSample: new Date('2024-01-22'),
      createdAt: new Date('2024-01-22'),
      updatedAt: new Date('2024-01-22'),
      createdBy: 'system',
      updatedBy: 'system',
      brandedAs: {
        brand: 'Luxury Scents',
        price: 150,
        suggestedPrice: 450,
        currency: 'USD',
        notes: 'Premium oriental fragrance collection',
        brandedBy: 'system',
        brandedAt: new Date('2024-01-23')
      }
    },
    {
      id: 'sample-2',
      sampleNo: 2002,
      itemNameEN: 'Fresh Citrus Blend',
      sampleId: 'EXP002',
      itemNameAR: 'مزيج الحمضيات المنعش',
      supplierId: 'supplier-2',
      patchNumber: 'PS-002',
      status: 'Accepted',
      approved: true,
      isRawMaterial: false,
      storageLocation: { rackNumber: 'B1', position: 2 },
      pricing: { basePrice: 100, currency: 'USD', scalingPrices: [] },
      dateOfSample: new Date('2024-01-23'),
      createdAt: new Date('2024-01-23'),
      updatedAt: new Date('2024-01-23'),
      createdBy: 'system',
      updatedBy: 'system'
    },
    {
      id: 'sample-3',
      sampleNo: 2003,
      itemNameEN: 'Marine Accord',
      sampleId: 'EXP003',
      supplierId: 'supplier-3',
      patchNumber: 'PS-003',
      status: 'Accepted',
      approved: true,
      isRawMaterial: false,
      storageLocation: { rackNumber: 'B1', position: 3 },
      pricing: { basePrice: 80, currency: 'USD', scalingPrices: [] },
      dateOfSample: new Date('2024-01-24'),
      createdAt: new Date('2024-01-24'),
      updatedAt: new Date('2024-01-24'),
      createdBy: 'system',
      updatedBy: 'system'
    },
    {
      id: 'sample-4',
      sampleNo: 2004,
      itemNameEN: 'Green Herb Note',
      sampleId: 'EXP004',
      supplierId: 'supplier-4',
      patchNumber: 'PS-004',
      status: 'Accepted',
      approved: true,
      isRawMaterial: false,
      storageLocation: { rackNumber: 'B1', position: 4 },
      pricing: { basePrice: 60, currency: 'USD', scalingPrices: [] },
      dateOfSample: new Date('2024-01-25'),
      createdAt: new Date('2024-01-25'),
      updatedAt: new Date('2024-01-25'),
      createdBy: 'system',
      updatedBy: 'system'
    }
  ];
  
  // Create 4 formulas
  const formulas: Formula[] = [
    {
      id: 'formula-1',
      name: 'Midnight Rose EDP',
      sampleId: 'sample-1',
      ingredients: [
        {
          id: 'ing-1',
          rawMaterialId: 'sample-1',
          percentage: 15,
          notes: 'Primary base note'
        },
        {
          id: 'ing-2',
          rawMaterialId: 'raw-1', // Rose Absolute
          percentage: 25,
          notes: 'Main floral note'
        },
        {
          id: 'ing-3',
          rawMaterialId: 'raw-2', // Jasmine Oil
          percentage: 10,
          notes: 'Supporting floral'
        },
        {
          id: 'ing-4',
          rawMaterialId: 'raw-4', // Sandalwood
          percentage: 15,
          notes: 'Woody base'
        },
        {
          id: 'ing-5',
          rawMaterialId: 'raw-5', // Amber
          percentage: 10,
          notes: 'Warmth and depth'
        },
        {
          id: 'ing-6',
          rawMaterialId: 'raw-6', // Musk
          percentage: 5,
          notes: 'Longevity enhancer'
        },
        {
          id: 'ing-7',
          rawMaterialId: 'raw-7', // Alcohol
          percentage: 20,
          notes: 'Carrier'
        }
      ],
      totalPercentage: 100,
      totalCost: 285,
      costPerUnit: 2.85,
      batchSize: 100,
      batchUnit: 'ml',
      status: 'Approved',
      notes: 'A luxurious oriental floral fragrance with rose and jasmine at its heart, supported by warm woody and ambery base notes.',
      createdBy: 'system',
      createdAt: new Date('2024-01-24'),
      updatedAt: new Date('2024-01-25'),
      approvedBy: 'system',
      approvedAt: new Date('2024-01-25'),
      productId: 'product-1',
      productName: 'Midnight Rose EDP - Formula Product',
      productCode: 'FP-001'
    },
    {
      id: 'formula-2',
      name: 'Summer Breeze EDT',
      sampleId: 'sample-2',
      ingredients: [
        {
          id: 'ing-8',
          rawMaterialId: 'sample-2',
          percentage: 20,
          notes: 'Citrus base'
        },
        {
          id: 'ing-9',
          rawMaterialId: 'raw-3', // Bergamot
          percentage: 30,
          notes: 'Top citrus note'
        },
        {
          id: 'ing-10',
          rawMaterialId: 'raw-2', // Jasmine
          percentage: 5,
          notes: 'Floral heart'
        },
        {
          id: 'ing-11',
          rawMaterialId: 'raw-6', // Musk
          percentage: 5,
          notes: 'Light musk base'
        },
        {
          id: 'ing-12',
          rawMaterialId: 'raw-7', // Alcohol
          percentage: 40,
          notes: 'EDT concentration'
        }
      ],
      totalPercentage: 100,
      totalCost: 98,
      costPerUnit: 0.98,
      batchSize: 100,
      batchUnit: 'ml',
      status: 'Testing',
      notes: 'A fresh, light fragrance perfect for summer days. Dominated by citrus notes with a subtle floral heart.',
      createdBy: 'system',
      createdAt: new Date('2024-01-26'),
      updatedAt: new Date('2024-01-26')
    },
    {
      id: 'formula-3',
      name: 'Ocean Mist EDT',
      sampleId: 'sample-3',
      ingredients: [
        { id: 'ing-13', rawMaterialId: 'sample-3', percentage: 25 },
        { id: 'ing-14', rawMaterialId: 'rm-rose', percentage: 10 },
        { id: 'ing-15', rawMaterialId: 'color-blue', percentage: 0.2 },
        { id: 'ing-16', rawMaterialId: 'color-yellow', percentage: 0.1 },
        { id: 'ing-17', rawMaterialId: 'color-red', percentage: 0.05 },
        { id: 'ing-18', rawMaterialId: 'sample-2', percentage: 20 }
      ],
      totalPercentage: 100,
      totalCost: 120,
      costPerUnit: 1.2,
      batchSize: 100,
      batchUnit: 'ml',
      status: 'Testing',
      createdBy: 'system', createdAt: new Date('2024-01-27'), updatedAt: new Date('2024-01-27')
    },
    {
      id: 'formula-4',
      name: 'Herbal Forest EDP',
      sampleId: 'sample-4',
      ingredients: [
        { id: 'ing-19', rawMaterialId: 'sample-4', percentage: 20 },
        { id: 'ing-20', rawMaterialId: 'rm-rose', percentage: 5 },
        { id: 'ing-21', rawMaterialId: 'color-yellow', percentage: 0.15 },
        { id: 'ing-22', rawMaterialId: 'color-blue', percentage: 0.05 }
      ],
      totalPercentage: 100,
      totalCost: 90,
      costPerUnit: 0.9,
      batchSize: 100,
      batchUnit: 'ml',
      status: 'Draft',
      createdBy: 'system', createdAt: new Date('2024-01-28'), updatedAt: new Date('2024-01-28')
    }
  ];
  
  // Save to localStorage
  // Generate compact QRs
  const allSamples = [...rawMaterials, ...primarySamples];
  // Write base data immediately so UI can load without waiting for QR generation
  try {
    localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(allSamples));
    localStorage.setItem('nbslims_formulas', JSON.stringify(formulas));
    // Clear QR registries to avoid stale entries
    localStorage.removeItem('nbslims_qr_registry');
    localStorage.removeItem('nbslims_formula_qr_registry');
  } catch {}
  (async ()=>{
    try {
      for (let i=0;i<allSamples.length;i++){
        const s = allSamples[i] as any;
        const res = await qrGenerator.generateSampleQR({ sampleId: s.sampleId || s.id, sampleNo: s.sampleNo || i+1, itemNameEN: s.itemNameEN || '', supplierId: s.supplierId || '', createdAt: new Date(s.createdAt || Date.now()) });
        s.qrCode = res.qrId; s.qrImageBase64 = res.qrImageBase64;
      }
      for (let i=0;i<formulas.length;i++){
        const f = formulas[i] as any; const r = await formulaQRBarcodeGenerator.generateFormulaQRBarcode(f as any);
        f.qrCode = r.qrImageBase64; f.barcode = r.barcode; f.barcodeImage = r.barcodeImage;
      }
    } catch {}
    localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(allSamples));
    localStorage.setItem('nbslims_formulas', JSON.stringify(formulas));
  })();
  
  // Trigger update events
  window.dispatchEvent(new CustomEvent('samplesInitialized'));
  window.dispatchEvent(new CustomEvent('formulasInitialized'));
  
  console.log('Sample data initialized successfully');
  console.log('Created:', {
    rawMaterials: rawMaterials.length,
    primarySamples: primarySamples.length,
    formulas: formulas.length
  });
  
  return {
    samples: allSamples,
    formulas
  };
};

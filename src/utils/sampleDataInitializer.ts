import { Sample } from '@/lib/types';
import { Formula } from '@/lib/formula-types';
import { v4 as uuidv4 } from 'uuid';

export const initializeSampleData = () => {
  // Check if data already exists
  const existingSamples = localStorage.getItem('nbslims_enhanced_samples');
  const existingFormulas = localStorage.getItem('nbslims_formulas');
  
  if (existingSamples && existingFormulas) {
    return; // Data already exists
  }
  
  // Create sample raw materials
  const rawMaterials: Sample[] = [
    {
      id: 'raw-1',
      sampleNo: 1001,
      itemNameEN: 'Rose Absolute',
      itemNameAR: 'مطلق الورد',
      supplierId: 'supplier-1',
      patchNumber: 'RM-001',
      status: 'Accepted',
      approved: true,
      isRawMaterial: true,
      storageLocation: { rackNumber: 'A1', position: 1 },
      pricing: { basePrice: 500, currency: 'USD', scalingPrices: [] },
      dateOfSample: new Date('2024-01-15'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      createdBy: 'system',
      updatedBy: 'system'
    },
    {
      id: 'raw-2',
      sampleNo: 1002,
      itemNameEN: 'Jasmine Oil',
      itemNameAR: 'زيت الياسمين',
      supplierId: 'supplier-1',
      patchNumber: 'RM-002',
      status: 'Accepted',
      approved: true,
      isRawMaterial: true,
      storageLocation: { rackNumber: 'A1', position: 2 },
      pricing: { basePrice: 450, currency: 'USD', scalingPrices: [] },
      dateOfSample: new Date('2024-01-16'),
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
      createdBy: 'system',
      updatedBy: 'system'
    },
    {
      id: 'raw-3',
      sampleNo: 1003,
      itemNameEN: 'Bergamot Essential Oil',
      itemNameAR: 'زيت البرغموت الأساسي',
      supplierId: 'supplier-2',
      patchNumber: 'RM-003',
      status: 'Accepted',
      approved: true,
      isRawMaterial: true,
      storageLocation: { rackNumber: 'A1', position: 3 },
      pricing: { basePrice: 120, currency: 'USD', scalingPrices: [] },
      dateOfSample: new Date('2024-01-17'),
      createdAt: new Date('2024-01-17'),
      updatedAt: new Date('2024-01-17'),
      createdBy: 'system',
      updatedBy: 'system'
    },
    {
      id: 'raw-4',
      sampleNo: 1004,
      itemNameEN: 'Sandalwood Oil',
      itemNameAR: 'زيت خشب الصندل',
      supplierId: 'supplier-2',
      patchNumber: 'RM-004',
      status: 'Accepted',
      approved: true,
      isRawMaterial: true,
      storageLocation: { rackNumber: 'A1', position: 4 },
      pricing: { basePrice: 800, currency: 'USD', scalingPrices: [] },
      dateOfSample: new Date('2024-01-18'),
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-18'),
      createdBy: 'system',
      updatedBy: 'system'
    },
    {
      id: 'raw-5',
      sampleNo: 1005,
      itemNameEN: 'Amber Resin',
      itemNameAR: 'راتنج العنبر',
      supplierId: 'supplier-3',
      patchNumber: 'RM-005',
      status: 'Accepted',
      approved: true,
      isRawMaterial: true,
      storageLocation: { rackNumber: 'A1', position: 5 },
      pricing: { basePrice: 200, currency: 'USD', scalingPrices: [] },
      dateOfSample: new Date('2024-01-19'),
      createdAt: new Date('2024-01-19'),
      updatedAt: new Date('2024-01-19'),
      createdBy: 'system',
      updatedBy: 'system'
    },
    {
      id: 'raw-6',
      sampleNo: 1006,
      itemNameEN: 'Musk Essence',
      itemNameAR: 'جوهر المسك',
      supplierId: 'supplier-3',
      patchNumber: 'RM-006',
      status: 'Accepted',
      approved: true,
      isRawMaterial: true,
      storageLocation: { rackNumber: 'A2', position: 1 },
      pricing: { basePrice: 350, currency: 'USD', scalingPrices: [] },
      dateOfSample: new Date('2024-01-20'),
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
      createdBy: 'system',
      updatedBy: 'system'
    },
    {
      id: 'raw-7',
      sampleNo: 1007,
      itemNameEN: 'Perfumer\'s Alcohol',
      itemNameAR: 'كحول العطار',
      supplierId: 'supplier-1',
      patchNumber: 'RM-007',
      status: 'Accepted',
      approved: true,
      isRawMaterial: true,
      storageLocation: { rackNumber: 'A2', position: 2 },
      pricing: { basePrice: 20, currency: 'USD', scalingPrices: [] },
      dateOfSample: new Date('2024-01-21'),
      createdAt: new Date('2024-01-21'),
      updatedAt: new Date('2024-01-21'),
      createdBy: 'system',
      updatedBy: 'system'
    }
  ];
  
  // Create primary samples for formulas
  const primarySamples: Sample[] = [
    {
      id: 'sample-1',
      sampleNo: 2001,
      itemNameEN: 'Oriental Night Base',
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
    }
  ];
  
  // Create formulas
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
    }
  ];
  
  // Save to localStorage
  const allSamples = [...rawMaterials, ...primarySamples];
  localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(allSamples));
  localStorage.setItem('nbslims_formulas', JSON.stringify(formulas));
  
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

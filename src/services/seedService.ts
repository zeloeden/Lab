/**
 * Seed Service - Comprehensive Data Generation for Testing
 * Fills the entire system with realistic test data
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { customerService } from './customerService';
import { companyService } from './companyService';
import { barcodeGenerator } from '@/lib/barcodeUtils';
import { qrGenerator } from '@/lib/qrGenerator';

// Sample names for fragrance samples
const FRAGRANCE_NAMES_EN = [
  'Lavender Dream', 'Ocean Breeze', 'Rose Garden', 'Sandalwood Musk',
  'Vanilla Paradise', 'Citrus Burst', 'Amber Nights', 'Jasmine Bloom',
  'Cedar Forest', 'Patchouli Earth', 'Mint Fresh', 'Bergamot Sunrise',
  'Oud Royale', 'White Tea Serenity', 'Coconut Beach', 'Cinnamon Spice',
  'Magnolia Spring', 'Leather & Tobacco', 'Green Apple', 'Blackcurrant',
  'Peony Petals', 'Musk AL Tahara', 'Frankincense Gold', 'Myrrh Ancient',
  'Ginger Zest', 'Tonka Bean', 'Fig Leaf', 'Honey Nectar',
  'Violet Dreams', 'Iris Elegance', 'Neroli Blossom', 'Ylang Ylang'
];

const FRAGRANCE_NAMES_AR = [
  'حلم اللافندر', 'نسيم المحيط', 'حديقة الورد', 'مسك خشب الصندل',
  'جنة الفانيليا', 'انفجار الحمضيات', 'ليالي العنبر', 'زهرة الياسمين',
  'غابة الأرز', 'أرض الباتشولي', 'نعناع منعش', 'شروق البرغموت',
  'عود ملكي', 'صفاء الشاي الأبيض', 'شاطئ جوز الهند', 'توابل القرفة',
  'ربيع الماغنوليا', 'جلد وتبغ', 'تفاح أخضر', 'كشمش أسود',
  'بتلات الفاوانيا', 'مسك الطهارة', 'ذهب اللبان', 'مر قديم',
  'حماس الزنجبيل', 'حبة التونكا', 'ورق التين', 'رحيق العسل',
  'أحلام البنفسج', 'أناقة السوسن', 'زهر النيرولي', 'يلانج يلانج'
];

const RAW_MATERIAL_NAMES = [
  'Ethanol 96%', 'Dipropylene Glycol', 'Isopropyl Myristate', 'Benzyl Alcohol',
  'Linalool', 'Limonene', 'Citronellol', 'Geraniol', 'Alpha-Pinene',
  'Beta-Caryophyllene', 'Eugenol', 'Coumarin', 'Vanillin', 'Hedione',
  'Iso E Super', 'Ambroxan', 'Galaxolide', 'Cashmeran', 'Tonalid',
  'Ethyl Vanillin', 'Methyl Ionone', 'Rose Oxide', 'Cedrol', 'Vetiverol'
];

const SUPPLIER_NAMES = [
  { name: 'Givaudan', code: 'GIV', country: 'Switzerland' },
  { name: 'Firmenich', code: 'FIR', country: 'Switzerland' },
  { name: 'IFF (International Flavors & Fragrances)', code: 'IFF', country: 'USA' },
  { name: 'Symrise', code: 'SYM', country: 'Germany' },
  { name: 'Mane', code: 'MAN', country: 'France' },
  { name: 'Takasago', code: 'TAK', country: 'Japan' },
  { name: 'Robertet', code: 'ROB', country: 'France' },
  { name: 'Sensient', code: 'SEN', country: 'USA' }
];

const CUSTOMER_NAMES = [
  { name: 'Perfume Palace Dubai', code: 'PPD', country: 'UAE' },
  { name: 'Scent & Co London', code: 'SCL', country: 'UK' },
  { name: 'Aroma Traders NYC', code: 'ATN', country: 'USA' },
  { name: 'Fragrance House Paris', code: 'FHP', country: 'France' },
  { name: 'Oriental Perfumes Riyadh', code: 'OPR', country: 'Saudi Arabia' },
  { name: 'Singapore Scent Hub', code: 'SSH', country: 'Singapore' }
];

const FORMULAS_DATA = [
  { code: 'NBS001', name: 'Summer Breeze Formula', purpose: 'EDP' },
  { code: 'NBS002', name: 'Winter Musk Formula', purpose: 'EDT' },
  { code: 'NBS003', name: 'Oriental Night Formula', purpose: 'Perfume Oil' },
  { code: 'NBS004', name: 'Fresh Citrus Formula', purpose: 'Body Spray' },
  { code: 'NBS005', name: 'Floral Garden Formula', purpose: 'EDP' }
];

export const seedService = {
  /**
   * Generate all seed data for the system
   */
  async seedAll() {
    console.log('🌱 Starting comprehensive system seed...');
    
    try {
      // 1. Seed Companies
      await this.seedCompanies();
      
      // 2. Seed Suppliers
      await this.seedSuppliers();
      
      // 3. Seed Customers
      await this.seedCustomers();
      
      // 4. Seed Raw Materials
      await this.seedRawMaterials();
      
      // 5. Seed Samples
      await this.seedSamples();
      
      // 6. Seed Formulas
      await this.seedFormulas();
      
      // 7. Seed Tests
      await this.seedTests();
      
      // 8. Seed Tasks
      await this.seedTasks();
      
      // 9. Seed Purchase Orders
      await this.seedPurchaseOrders();
      
      console.log('✅ Seed completed successfully!');
      return { success: true, message: 'All data seeded successfully' };
    } catch (error) {
      console.error('❌ Seed failed:', error);
      return { success: false, message: `Seed failed: ${error}` };
    }
  },

  /**
   * Clear all data from the system
   */
  async clearAll() {
    console.log('🗑️ Clearing all data...');
    
    try {
      // Clear IndexedDB (only tables that exist in db.ts)
      try {
        if (db.samples) await db.samples.clear();
      } catch (e) {
        console.warn('Could not clear samples table:', e);
      }
      try {
        if (db.tests) await db.tests.clear();
      } catch (e) {
        console.warn('Could not clear tests table:', e);
      }
      try {
        if (db.sessions) await db.sessions.clear();
      } catch (e) {
        console.warn('Could not clear sessions table:', e);
      }
      try {
        if (db.steps) await db.steps.clear();
      } catch (e) {
        console.warn('Could not clear steps table:', e);
      }
      try {
        if (db.events) await db.events.clear();
      } catch (e) {
        console.warn('Could not clear events table:', e);
      }
      try {
        if (db.outbox) await db.outbox.clear();
      } catch (e) {
        console.warn('Could not clear outbox table:', e);
      }
      
      // Clear localStorage
      localStorage.removeItem('nbslims_enhanced_samples');
      localStorage.removeItem('nbslims_suppliers');
      localStorage.removeItem('nbslims_customers');
      localStorage.removeItem('nbslims_companies');
      localStorage.removeItem('nbslims_tasks');
      localStorage.removeItem('nbslims_purchase_orders');
      localStorage.removeItem('nbslims_requested_items');
      localStorage.removeItem('nbslims_raw_materials');
      localStorage.removeItem('nbslims_formulas'); // Formulas are in localStorage, not IndexedDB
      
      console.log('✅ All data cleared!');
      return { success: true, message: 'All data cleared successfully' };
    } catch (error) {
      console.error('❌ Clear failed:', error);
      return { success: false, message: `Clear failed: ${error}` };
    }
  },

  async seedCompanies() {
    console.log('📦 Seeding companies...');
    const companies = [
      { name: 'NBS Laboratory', initials: 'NBS' },
      { name: 'Scent Innovations', initials: 'SI' },
      { name: 'Aroma Tech', initials: 'AT' }
    ];
    
    for (const company of companies) {
      await companyService.createCompany({
        name: company.name,
        initials: company.initials
      });
    }
  },

  async seedSuppliers() {
    console.log('🏢 Seeding suppliers...');
    const suppliers = SUPPLIER_NAMES.map(sup => ({
      id: uuidv4(),
      name: sup.name,
      code: sup.code,
      contactInfo: {
        email: `contact@${sup.code.toLowerCase()}.com`,
        phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
        contactPerson: `${sup.code} Representative`
      },
      address: {
        street: `${Math.floor(Math.random() * 999) + 1} Main Street`,
        city: sup.country === 'USA' ? 'New York' : 
              sup.country === 'UK' ? 'London' : 
              sup.country === 'Switzerland' ? 'Geneva' : 'Paris',
        country: sup.country
      },
      scalingEnabled: true,
      notes: `Premium supplier of fragrance materials from ${sup.country}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    localStorage.setItem('nbslims_suppliers', JSON.stringify(suppliers));
  },

  async seedCustomers() {
    console.log('👥 Seeding customers...');
    const customers = CUSTOMER_NAMES.map(cust => ({
      id: uuidv4(),
      name: cust.name,
      code: cust.code,
      email: `orders@${cust.code.toLowerCase()}.com`,
      phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
      address: `${Math.floor(Math.random() * 999) + 1} Commerce Plaza`,
      country: cust.country,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    localStorage.setItem('nbslims_customers', JSON.stringify(customers));
  },

  async seedRawMaterials() {
    console.log('🧪 Seeding raw materials...');
    const suppliers = JSON.parse(localStorage.getItem('nbslims_suppliers') || '[]');
    
    const rawMaterials = RAW_MATERIAL_NAMES.map((name, idx) => {
      const supplier = suppliers[idx % suppliers.length];
      const id = `rm-${Date.now()}-${idx}`;
      const sampleNo = 1000 + idx;
      
      return {
        id,
        sampleNo,
        name: name, // Primary name field for RawMaterials page
        itemNameEN: name,
        itemNameAR: `مادة خام ${idx + 1}`,
        supplierId: supplier?.id || '',
        supplierCode: `${supplier?.code || 'SUP'}${String(idx + 1).padStart(6, '0')}`,
        barcode: barcodeGenerator.generateBarcodeString(sampleNo),
        qrCode: `RM:${id}`,
        dateOfSample: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        itemGroup: 'Raw Material',
        status: 'Tested',
        approved: true,
        storageLocation: {
          rackNumber: `R${Math.floor(Math.random() * 10) + 1}`,
          position: Math.floor(Math.random() * 50) + 1,
          notes: 'Temperature controlled storage'
        },
        customIdNo: `RM${String(idx + 1).padStart(4, '0')}`,
        pricing: {
          basePrice: Math.floor(Math.random() * 500) + 50,
          currency: 'USD',
          scalingPrices: [
            { quantity: 25, price: Math.floor(Math.random() * 400) + 40, enabled: true },
            { quantity: 50, price: Math.floor(Math.random() * 350) + 35, enabled: true },
            { quantity: 100, price: Math.floor(Math.random() * 300) + 30, enabled: true },
            { quantity: 200, price: Math.floor(Math.random() * 250) + 25, enabled: true },
            { quantity: 250, price: Math.floor(Math.random() * 225) + 23, enabled: true },
            { quantity: 500, price: Math.floor(Math.random() * 200) + 20, enabled: true },
            { quantity: 1000, price: Math.floor(Math.random() * 150) + 15, enabled: true }
          ]
        },
        isRawMaterial: true,
        createdBy: 'seed-system',
        updatedBy: 'seed-system',
        createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      };
    });
    
    localStorage.setItem('nbslims_raw_materials', JSON.stringify(rawMaterials));
  },

  async seedSamples() {
    console.log('🧴 Seeding samples...');
    const suppliers = JSON.parse(localStorage.getItem('nbslims_suppliers') || '[]');
    const customers = JSON.parse(localStorage.getItem('nbslims_customers') || '[]');
    
    const samples = FRAGRANCE_NAMES_EN.map((nameEN, idx) => {
      const supplier = suppliers[idx % suppliers.length];
      const customer = customers[idx % customers.length];
      const id = `sample-${Date.now()}-${idx}`;
      const sampleNo = 2000 + idx;
      const dateOfSample = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
      
      return {
        id,
        sampleNo,
        itemNameEN: nameEN,
        itemNameAR: FRAGRANCE_NAMES_AR[idx],
        supplierId: supplier?.id || '',
        customerId: customer?.id || '',
        customerSampleNumber: `${customer?.code || 'CUST'}-${String(idx + 1).padStart(5, '0')}`,
        patchNumber: `PATCH-${new Date(dateOfSample).getFullYear()}-${String(Math.floor(idx / 3) + 1).padStart(3, '0')}`,
        supplierCode: `${supplier?.code || 'SUP'}${String(idx + 1).padStart(6, '0')}`,
        barcode: barcodeGenerator.generateBarcodeString(sampleNo),
        qrCode: `S:${id}`,
        dateOfSample,
        itemGroup: ['Floral', 'Woody', 'Fresh', 'Oriental', 'Citrus'][idx % 5],
        status: ['Tested', 'Untested', 'In Progress'][idx % 3] as any,
        approved: idx % 3 === 0,
        storageLocation: {
          rackNumber: `A${Math.floor(idx / 10) + 1}`,
          position: (idx % 10) + 1,
          notes: `Storage rack in section ${String.fromCharCode(65 + Math.floor(idx / 10))}`
        },
        customIdNo: `SAM${String(idx + 1).padStart(5, '0')}`,
        pricing: {
          basePrice: Math.floor(Math.random() * 200) + 50,
          currency: 'USD',
          scalingPrices: [
            { quantity: 25, price: Math.floor(Math.random() * 180) + 45, enabled: true },
            { quantity: 50, price: Math.floor(Math.random() * 160) + 40, enabled: true },
            { quantity: 100, price: Math.floor(Math.random() * 140) + 35, enabled: true },
            { quantity: 200, price: Math.floor(Math.random() * 120) + 30, enabled: true },
            { quantity: 250, price: Math.floor(Math.random() * 110) + 28, enabled: true },
            { quantity: 500, price: Math.floor(Math.random() * 100) + 25, enabled: true },
            { quantity: 1000, price: Math.floor(Math.random() * 80) + 20, enabled: true }
          ]
        },
        shipment: {
          carrier: ['DHL', 'FedEx', 'UPS', 'Aramex'][idx % 4],
          airWaybill: `AWB${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
          shipmentNotes: 'Handle with care - Fragile materials',
          originCountry: supplier?.address?.country || 'USA'
        },
        ledger: {
          mainBrand: ['Chanel No. 5', 'Dior Sauvage', 'Tom Ford Oud Wood', 'Creed Aventus'][idx % 4],
          relatedNames: [`Related Brand ${idx + 1}`, `Alt Brand ${idx + 2}`],
          sampleResult: ['Accepted', 'Pending', 'Testing'][idx % 3] as any,
          customerSampleNo: `${customer?.code || 'CUST'}-${String(idx + 1).padStart(5, '0')}`,
          dpgPercentage: Math.floor(Math.random() * 30) + 70,
          priorityLevel: ['Low', 'Medium', 'High'][idx % 3] as any,
          concept: ['Fresh & Clean', 'Warm & Woody', 'Floral & Romantic', 'Bold & Spicy'][idx % 4],
          ingredients: {
            topNotes: ['Bergamot', 'Lemon', 'Mandarin'].slice(0, (idx % 3) + 1),
            middleNotes: ['Rose', 'Jasmine', 'Lavender'].slice(0, (idx % 3) + 1),
            baseNotes: ['Musk', 'Amber', 'Vanilla'].slice(0, (idx % 3) + 1)
          }
        },
        createdBy: 'seed-system',
        updatedBy: 'seed-system',
        createdAt: new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      };
    });
    
    localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(samples));
    
    // Also add to IndexedDB
    for (const sample of samples.slice(0, 10)) {
      try {
        await db.samples.add(sample as any);
      } catch (e) {
        console.warn('Sample already exists in DB:', sample.id);
      }
    }
  },

  async seedFormulas() {
    console.log('🧪 Seeding formulas...');
    const rawMaterials = JSON.parse(localStorage.getItem('nbslims_raw_materials') || '[]');
    
    const formulas = FORMULAS_DATA.map((formula, idx) => {
      const numIngredients = Math.floor(Math.random() * 5) + 3;
      const ingredients = [];
      
      for (let i = 0; i < numIngredients; i++) {
        const rm = rawMaterials[i % rawMaterials.length];
        ingredients.push({
          id: uuidv4(),
          rawMaterialId: rm?.id || '',
          rawMaterialName: rm?.itemNameEN || `Material ${i + 1}`,
          percentage: Math.floor(Math.random() * 20) + 5,
          notes: `Ingredient note ${i + 1}`
        });
      }
      
      return {
        id: uuidv4(),
        internalCode: formula.code,
        name: formula.name,
        purpose: formula.purpose,
        description: `A carefully crafted ${formula.purpose} formula with ${numIngredients} premium ingredients`,
        ingredients,
        status: ['draft', 'active', 'archived'][idx % 3] as any,
        version: 1,
        notes: `Formula ${formula.code} - Version 1.0`,
        createdBy: 'seed-system',
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      };
    });
    
    // Save formulas to localStorage (not IndexedDB)
    localStorage.setItem('nbslims_formulas', JSON.stringify(formulas));
  },

  async seedTests() {
    console.log('🔬 Seeding tests...');
    const samples = JSON.parse(localStorage.getItem('nbslims_enhanced_samples') || '[]');
    
    const tests = samples.slice(0, 15).map((sample: any, idx: number) => ({
      id: uuidv4(),
      sampleId: sample.id,
      sampleName: sample.itemNameEN,
      testType: ['Stability', 'pH Level', 'Viscosity', 'Color Analysis', 'Fragrance Intensity'][idx % 5],
      status: ['completed', 'in-progress', 'pending'][idx % 3] as any,
      assignedTo: ['Lab Tech 1', 'Lab Tech 2', 'Lab Tech 3'][idx % 3],
      startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      completionDate: idx % 3 === 0 ? new Date() : null,
      results: idx % 3 === 0 ? {
        passed: idx % 2 === 0,
        notes: `Test completed with ${idx % 2 === 0 ? 'passing' : 'failing'} results`,
        measurements: {
          value: Math.floor(Math.random() * 100),
          unit: ['pH', 'cP', 'L*a*b*'][idx % 3]
        }
      } : null,
      priority: ['low', 'medium', 'high'][idx % 3] as any,
      notes: `Test ${idx + 1} for sample ${sample.itemNameEN}`,
      createdAt: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    }));
    
    for (const test of tests) {
      try {
        await db.tests.add(test as any);
      } catch (e) {
        console.warn('Test already exists:', test.id);
      }
    }
  },

  async seedTasks() {
    console.log('📋 Seeding tasks...');
    const tasks = [
      { title: 'Review new sample submissions', priority: 'high', status: 'in-progress' },
      { title: 'Complete stability tests for Batch 034', priority: 'high', status: 'pending' },
      { title: 'Update formula NBS001 with new supplier data', priority: 'medium', status: 'pending' },
      { title: 'Prepare quarterly inventory report', priority: 'medium', status: 'in-progress' },
      { title: 'Order new lab equipment', priority: 'low', status: 'pending' },
      { title: 'Train new staff on QR scanning system', priority: 'low', status: 'completed' },
      { title: 'Review customer feedback on recent batches', priority: 'medium', status: 'pending' },
      { title: 'Update storage rack labels', priority: 'low', status: 'completed' }
    ].map((task, idx) => ({
      id: uuidv4(),
      ...task,
      description: `${task.title} - Detailed description for task ${idx + 1}`,
      assignedTo: ['User 1', 'User 2', 'User 3'][idx % 3],
      dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    }));
    
    localStorage.setItem('nbslims_tasks', JSON.stringify(tasks));
  },

  async seedPurchaseOrders() {
    console.log('🛒 Seeding purchase orders...');
    const suppliers = JSON.parse(localStorage.getItem('nbslims_suppliers') || '[]');
    const rawMaterials = JSON.parse(localStorage.getItem('nbslims_raw_materials') || '[]');
    
    const purchaseOrders = suppliers.slice(0, 5).map((supplier: any, idx: number) => {
      const numItems = Math.floor(Math.random() * 4) + 2;
      const items = [];
      
      for (let i = 0; i < numItems; i++) {
        const rm = rawMaterials[(idx * numItems + i) % rawMaterials.length];
        const quantity = Math.floor(Math.random() * 50) + 10;
        const unitPrice = Math.floor(Math.random() * 100) + 20;
        
        items.push({
          id: uuidv4(),
          materialId: rm?.id || '',
          materialName: rm?.itemNameEN || `Material ${i + 1}`,
          quantity,
          unit: 'kg',
          unitPrice,
          totalPrice: quantity * unitPrice
        });
      }
      
      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
      
      return {
        id: uuidv4(),
        poNumber: `PO-${new Date().getFullYear()}-${String(idx + 1).padStart(4, '0')}`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        orderDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        expectedDelivery: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        status: ['pending', 'approved', 'shipped', 'delivered'][idx % 4],
        items,
        totalAmount,
        currency: 'USD',
        notes: `Purchase order ${idx + 1} for ${supplier.name}`,
        createdBy: 'seed-system',
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      };
    });
    
    localStorage.setItem('nbslims_purchase_orders', JSON.stringify(purchaseOrders));
  }
};


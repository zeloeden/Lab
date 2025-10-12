import Dexie, { Table } from 'dexie';
import { 
  Sample, 
  Supplier, 
  Test, 
  User, 
  RequestedItem, 
  Task, 
  AuditLog,
  UserActivity,
  BarcodeData
} from './types';

export class NBSLIMSDatabase extends Dexie {
  samples!: Table<Sample>;
  suppliers!: Table<Supplier>;
  tests!: Table<Test>;
  users!: Table<User>;
  requestedItems!: Table<RequestedItem>;
  tasks!: Table<Task>;
  auditLogs!: Table<AuditLog>;
  userActivities!: Table<UserActivity>;
  barcodes!: Table<BarcodeData>;

  constructor() {
    super('NBSLIMSDatabase');
    
    this.version(1).stores({
      samples: 'id, sampleNo, itemNameEN, itemNameAR, supplierId, status, approved, createdAt',
      suppliers: 'id, name, code, scalingEnabled, createdAt',
      tests: 'id, sampleId, useType, result, approved, date, createdAt',
      users: 'id, email, name, role, createdAt',
      requestedItems: 'id, itemName, sampleId, status, priority, date, createdAt',
      tasks: 'id, title, status, priority, assignees, dueDate, createdAt',
      auditLogs: 'id, entityType, entityId, action, userId, timestamp'
    });

    // Version 2: Add new fields for patch number, barcode, supplier code, and enhanced tracking
    this.version(2).stores({
      samples: 'id, sampleNo, itemNameEN, itemNameAR, supplierId, status, approved, createdAt, patchNumber, supplierCode, barcode',
      suppliers: 'id, name, code, scalingEnabled, createdAt',
      tests: 'id, sampleId, useType, result, approved, date, createdAt',
      users: 'id, email, name, role, createdAt',
      requestedItems: 'id, itemName, sampleId, status, priority, date, createdAt',
      tasks: 'id, title, status, priority, assignees, dueDate, createdAt',
      auditLogs: 'id, entityType, entityId, action, userId, timestamp, userName, userRole, severity',
      userActivities: 'id, userId, action, entityType, entityId, timestamp, sessionId',
      barcodes: 'id, sampleId, sampleNo, barcode, qrCode, generatedAt'
    });

    // Initialize with seed data
    this.on('ready', async () => {
      try {
        await this.initializeSeedData();
      } catch (error) {
        console.warn('Failed to initialize seed data:', error);
      }
    });
  }

  // Critical: Sample numbering rule - ALWAYS max(existing) + 1
  async getNextSampleNumber(): Promise<number> {
    try {
      const maxSample = await this.samples
        .orderBy('sampleNo')
        .reverse()
        .first();
      
      return maxSample ? maxSample.sampleNo + 1 : 1;
    } catch (error) {
      console.error('Error getting next sample number:', error);
      return 1;
    }
  }

  // Get samples by patch number
  async getSamplesByPatchNumber(patchNumber: string): Promise<Sample[]> {
    try {
      return await this.samples
        .where('patchNumber')
        .equals(patchNumber)
        .toArray();
    } catch (error) {
      console.error('Error getting samples by patch number:', error);
      return [];
    }
  }

  // Search samples by barcode/QR code
  async searchSampleByBarcode(barcode: string): Promise<Sample | null> {
    try {
      return await this.samples
        .where('barcode')
        .equals(barcode)
        .first() || null;
    } catch (error) {
      console.error('Error searching sample by barcode:', error);
      return null;
    }
  }

  // Generate barcode for sample
  async generateBarcode(sampleId: string, sampleNo: number): Promise<string> {
    try {
      // Generate a unique barcode using sample number and timestamp
      const timestamp = Date.now().toString().slice(-6);
      const barcode = `NBS${sampleNo.toString().padStart(6, '0')}${timestamp}`;
      
      // Store barcode data
      await this.barcodes.add({
        id: `barcode-${sampleId}`,
        sampleId,
        sampleNo,
        barcode,
        qrCode: barcode, // Same as barcode for simplicity
        generatedAt: new Date(),
        generatedBy: 'system'
      });

      return barcode;
    } catch (error) {
      console.error('Error generating barcode:', error);
      throw error;
    }
  }

  // Get user activities
  async getUserActivities(userId?: string, limit: number = 100): Promise<UserActivity[]> {
    try {
      let query = this.userActivities.orderBy('timestamp').reverse();
      
      if (userId) {
        query = query.filter(activity => activity.userId === userId);
      }
      
      return await query.limit(limit).toArray();
    } catch (error) {
      console.error('Error getting user activities:', error);
      return [];
    }
  }

  // Log user activity
  async logUserActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>): Promise<void> {
    try {
      await this.userActivities.add({
        ...activity,
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  }

  private async initializeSeedData(): Promise<void> {
    try {
      // Check if data already exists
      const supplierCount = await this.suppliers.count();
      const userCount = await this.users.count();
      
      if (supplierCount === 0) {
        // Add default suppliers
        await this.suppliers.bulkAdd([
          {
            id: 'supplier-1',
            name: 'Givaudan',
            code: 'GIV001',
            contactInfo: {
              email: 'contact@givaudan.com',
              phone: '+1-555-0001',
              contactPerson: 'John Smith'
            },
            address: {
              street: '123 Fragrance Ave',
              city: 'New York',
              country: 'USA',
              postalCode: '10001'
            },
            scalingEnabled: true, // As specified in requirements
            notes: 'Premium fragrance supplier with scaling capabilities',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'supplier-2',
            name: 'Expressions',
            code: 'EXP001',
            contactInfo: {
              email: 'info@expressions.com',
              phone: '+1-555-0002',
              contactPerson: 'Jane Doe'
            },
            address: {
              street: '456 Aroma Street',
              city: 'Los Angeles',
              country: 'USA',
              postalCode: '90001'
            },
            scalingEnabled: false, // As specified in requirements
            notes: 'Standard fragrance supplier without scaling',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
        console.log('✅ Suppliers initialized');
      }

      if (userCount === 0) {
        // Add default users for testing
        await this.users.bulkAdd([
          {
            id: 'user-admin',
            email: 'admin@nbslims.com',
            name: 'System Administrator',
            role: 'Admin',
            permissions: [],
            preferences: {
              language: 'en',
              theme: 'light',
              timezone: 'UTC'
            },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'user-lablead',
            email: 'lablead@nbslims.com',
            name: 'Lab Lead',
            role: 'LabLead',
            permissions: [],
            preferences: {
              language: 'en',
              theme: 'light',
              timezone: 'UTC'
            },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'user-tech',
            email: 'tech@nbslims.com',
            name: 'Lab Technician',
            role: 'Technician',
            permissions: [],
            preferences: {
              language: 'en',
              theme: 'light',
              timezone: 'UTC'
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
        console.log('✅ Users initialized');
      }

      // Add some sample data for demonstration (only in development)
      const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_ENABLE_SAMPLE_DATA === 'true';
      const sampleCount = await this.samples.count();
      if (sampleCount === 0 && isDevelopment) {
        const nextSampleNo = await this.getNextSampleNumber();
        await this.samples.bulkAdd([
          {
            id: 'sample-demo-1',
            sampleNo: nextSampleNo,
            itemNameEN: 'Rose Essential Oil',
            itemNameAR: 'زيت الورد الأساسي',
            supplierId: 'supplier-1',
            batchNumber: 'ROSE-2024-001',
            dateOfSample: new Date(),
            purpose: 'Personal Use',
            status: 'Pending',
            approved: false,
            storageLocation: {
              cabinetNo: 'A1',
              trayNo: 'T001',
              refrigeratorShelf: 'R1-S1'
            },
            pricing: {
              basePrice: 150.00,
              currency: 'USD',
              scalingPrices: [
                { tier: '25KG', price: 140.00 },
                { tier: '50KG', price: 130.00 },
                { tier: '100KG', price: 120.00 }
              ]
            },
            createdBy: 'user-admin',
            updatedBy: 'user-admin',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'sample-demo-2',
            sampleNo: nextSampleNo + 1,
            itemNameEN: 'Lavender Extract',
            itemNameAR: 'مستخلص اللافندر',
            supplierId: 'supplier-2',
            batchNumber: 'LAV-2024-001',
            dateOfSample: new Date(),
            purpose: 'Industrial',
            status: 'Accepted',
            approved: true,
            storageLocation: {
              cabinetNo: 'B2',
              trayNo: 'T002',
              refrigeratorShelf: 'R2-S1'
            },
            pricing: {
              basePrice: 85.00,
              currency: 'USD'
            },
            createdBy: 'user-lablead',
            updatedBy: 'user-lablead',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
        console.log('✅ Sample data initialized');
      }

    } catch (error) {
      console.error('Error initializing seed data:', error);
      // Don't throw error to prevent app from breaking
    }
  }
}

// Create and export database instance
export const db = new NBSLIMSDatabase();

// Initialize database connection
export const initializeDatabase = async (): Promise<void> => {
  try {
    await db.open();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Export for use in components
export default db;
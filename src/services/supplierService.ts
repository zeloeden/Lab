import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/database';
import { Supplier, AuditAction } from '@/lib/types';

export class SupplierService {
  async createSupplier(data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Supplier> {
    const supplier: Supplier = {
      id: uuidv4(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.suppliers.add(supplier);
    
    // Log audit trail
    await this.logAudit('CREATE', supplier, userId);
    
    return supplier;
  }

  async updateSupplier(id: string, updates: Partial<Supplier>, userId: string): Promise<Supplier> {
    const existingSupplier = await db.suppliers.get(id);
    if (!existingSupplier) {
      throw new Error('Supplier not found');
    }

    const updatedSupplier = {
      ...existingSupplier,
      ...updates,
      updatedAt: new Date()
    };

    await db.suppliers.update(id, updatedSupplier);
    
    // Log audit trail
    await this.logAudit('UPDATE', updatedSupplier, userId, existingSupplier);
    
    return updatedSupplier;
  }

  async getSupplier(id: string): Promise<Supplier | null> {
    return await db.suppliers.get(id) || null;
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return await db.suppliers.orderBy('name').toArray();
  }

  async getSupplierByName(name: string): Promise<Supplier | null> {
    return await db.suppliers.where('name').equals(name).first() || null;
  }

  async deleteSupplier(id: string, userId: string): Promise<void> {
    const supplier = await db.suppliers.get(id);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Check if supplier has associated samples
    const associatedSamples = await db.samples.where('supplierId').equals(id).count();
    if (associatedSamples > 0) {
      throw new Error('Cannot delete supplier with associated samples');
    }

    await db.suppliers.delete(id);
    
    // Log audit trail
    await this.logAudit('DELETE', supplier, userId);
  }

  async toggleScaling(id: string, enabled: boolean, userId: string): Promise<Supplier> {
    return await this.updateSupplier(id, { scalingEnabled: enabled }, userId);
  }

  async searchSuppliers(query: string): Promise<Supplier[]> {
    const lowerQuery = query.toLowerCase();
    return await db.suppliers
      .filter(supplier => 
        supplier.name.toLowerCase().includes(lowerQuery) ||
        supplier.code?.toLowerCase().includes(lowerQuery) ||
        supplier.contactInfo.email?.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  }

  private async logAudit(action: AuditAction, supplier: Supplier, userId: string, oldValues?: Supplier): Promise<void> {
    await db.auditLogs.add({
      id: uuidv4(),
      entityType: 'Supplier',
      entityId: supplier.id,
      action,
      oldValues: oldValues ? { ...oldValues } : undefined,
      newValues: { ...supplier },
      userId,
      timestamp: new Date()
    });
  }
}

export const supplierService = new SupplierService();
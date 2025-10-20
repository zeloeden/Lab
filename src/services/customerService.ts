/**
 * Customer Service
 * Manages customer data and operations
 */

export interface Customer {
  id: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  contactPerson?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

const STORAGE_KEY = 'nbslims_customers';

class CustomerService {
  /**
   * Get all customers
   */
  getCustomers(): Customer[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const customers = JSON.parse(stored);
      return customers.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading customers:', error);
      return [];
    }
  }

  /**
   * Get customer by ID
   */
  getCustomerById(id: string): Customer | null {
    const customers = this.getCustomers();
    return customers.find(c => c.id === id) || null;
  }

  /**
   * Save customers to localStorage
   */
  private saveCustomers(customers: Customer[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
      
      // Emit storage event for cross-tab sync
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(customers),
        storageArea: localStorage
      }));
    } catch (error) {
      console.error('Error saving customers:', error);
      throw error;
    }
  }

  /**
   * Add a new customer
   */
  addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer {
    const customers = this.getCustomers();
    
    const newCustomer: Customer = {
      ...customerData,
      id: `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    customers.push(newCustomer);
    this.saveCustomers(customers);
    
    return newCustomer;
  }

  /**
   * Update an existing customer
   */
  updateCustomer(id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt'>>): Customer | null {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    
    if (index === -1) {
      return null;
    }

    const updatedCustomer: Customer = {
      ...customers[index],
      ...updates,
      id: customers[index].id,
      createdAt: customers[index].createdAt,
      updatedAt: new Date()
    };

    customers[index] = updatedCustomer;
    this.saveCustomers(customers);
    
    return updatedCustomer;
  }

  /**
   * Delete a customer
   */
  deleteCustomer(id: string): boolean {
    const customers = this.getCustomers();
    const filtered = customers.filter(c => c.id !== id);
    
    if (filtered.length === customers.length) {
      return false; // Customer not found
    }

    this.saveCustomers(filtered);
    return true;
  }

  /**
   * Search customers by name or code
   */
  searchCustomers(query: string): Customer[] {
    const customers = this.getCustomers();
    const lowerQuery = query.toLowerCase();
    
    return customers.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.code?.toLowerCase().includes(lowerQuery) ||
      c.email?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Initialize with sample customers if empty
   */
  initializeSampleData(): void {
    const existing = this.getCustomers();
    if (existing.length > 0) return;

    const sampleCustomers: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'ABC Trading Co.',
        code: 'CUST001',
        email: 'contact@abctrading.com',
        phone: '+1-555-0101',
        country: 'USA',
        contactPerson: 'John Smith',
        notes: 'Regular customer - monthly orders'
      },
      {
        name: 'XYZ Industries',
        code: 'CUST002',
        email: 'orders@xyzind.com',
        phone: '+44-20-1234-5678',
        country: 'UK',
        contactPerson: 'Jane Doe',
        notes: 'VIP customer - priority service'
      },
      {
        name: 'Global Perfumes LLC',
        code: 'CUST003',
        email: 'info@globalperfumes.com',
        phone: '+971-4-123-4567',
        country: 'UAE',
        contactPerson: 'Ahmed Al-Mansoori',
        notes: 'Large volume orders'
      }
    ];

    sampleCustomers.forEach(customer => this.addCustomer(customer));
    console.log('Sample customers initialized');
  }
}

export const customerService = new CustomerService();


import { RequestedItem, RequestState } from '@/lib/types';

class RequestedItemsService {
  private storageKey = 'nbslims_requested_items';

  async getAllItems(): Promise<RequestedItem[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const items = JSON.parse(stored);
      // Convert date strings back to Date objects
      return items.map((item: any) => ({
        ...item,
        requestedAt: new Date(item.requestedAt),
        lastUpdatedAt: new Date(item.lastUpdatedAt),
        orderedAt: item.orderedAt ? new Date(item.orderedAt) : undefined,
        history: item.history.map((h: any) => ({
          ...h,
          at: new Date(h.at)
        }))
      }));
    } catch (error) {
      console.error('Error loading requested items:', error);
      return [];
    }
  }

  async createItem(item: Omit<RequestedItem, 'id'>): Promise<RequestedItem> {
    const newItem: RequestedItem = {
      ...item,
      id: `request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    const items = await this.getAllItems();
    const updatedItems = [newItem, ...items];
    await this.saveItems(updatedItems);
    
    return newItem;
  }

  async updateItem(id: string, updates: Partial<RequestedItem>): Promise<RequestedItem> {
    const items = await this.getAllItems();
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      throw new Error('Item not found');
    }
    
    const updatedItem = {
      ...items[itemIndex],
      ...updates,
      lastUpdatedAt: new Date()
    };
    
    items[itemIndex] = updatedItem;
    await this.saveItems(items);
    
    return updatedItem;
  }

  async moveItem(id: string, newState: RequestState, userId: string): Promise<RequestedItem> {
    const items = await this.getAllItems();
    const item = items.find(item => item.id === id);
    
    if (!item) {
      throw new Error('Item not found');
    }
    
    const now = new Date();
    const updatedItem = {
      ...item,
      state: newState,
      lastUpdatedAt: now,
      lastUpdatedBy: userId,
      history: [
        ...item.history,
        {
          at: now,
          by: userId,
          from: item.state,
          to: newState,
          note: `Moved to ${newState}`
        }
      ]
    };
    
    const itemIndex = items.findIndex(item => item.id === id);
    items[itemIndex] = updatedItem;
    await this.saveItems(items);
    
    return updatedItem;
  }

  async deleteItem(id: string): Promise<void> {
    const items = await this.getAllItems();
    const filteredItems = items.filter(item => item.id !== id);
    await this.saveItems(filteredItems);
  }

  private async saveItems(items: RequestedItem[]): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving requested items:', error);
      throw error;
    }
  }

  // Mock data for development
  async seedMockData(): Promise<void> {
    const existingItems = await this.getAllItems();
    if (existingItems.length > 0) return;

    const mockItems: RequestedItem[] = [
      {
        id: 'mock-1',
        sampleId: 'sample-1',
        supplierId: 'supplier-1',
        quantity: 100,
        unit: 'ml',
        priority: 'high',
        state: 'requested',
        requestedBy: 'user-1',
        requestedAt: new Date(Date.now() - 86400000), // 1 day ago
        lastUpdatedBy: 'user-1',
        lastUpdatedAt: new Date(Date.now() - 86400000),
        notes: 'Urgent request for testing',
        history: [{
          at: new Date(Date.now() - 86400000),
          by: 'user-1',
          to: 'requested',
          note: 'Item requested'
        }]
      },
      {
        id: 'mock-2',
        sampleId: 'sample-2',
        supplierId: 'supplier-2',
        quantity: 50,
        unit: 'g',
        priority: 'medium',
        state: 'to-be-ordered',
        requestedBy: 'user-2',
        requestedAt: new Date(Date.now() - 172800000), // 2 days ago
        lastUpdatedBy: 'user-2',
        lastUpdatedAt: new Date(Date.now() - 3600000), // 1 hour ago
        notes: 'Ready for ordering',
        history: [
          {
            at: new Date(Date.now() - 172800000),
            by: 'user-2',
            to: 'requested',
            note: 'Item requested'
          },
          {
            at: new Date(Date.now() - 3600000),
            by: 'user-2',
            from: 'requested',
            to: 'to-be-ordered',
            note: 'Moved to to-be-ordered'
          }
        ]
      },
      {
        id: 'mock-3',
        sampleId: 'sample-3',
        supplierId: 'supplier-1',
        quantity: 25,
        unit: 'kg',
        priority: 'low',
        state: 'ordered',
        requestedBy: 'user-3',
        requestedAt: new Date(Date.now() - 259200000), // 3 days ago
        lastUpdatedBy: 'admin-1',
        lastUpdatedAt: new Date(Date.now() - 7200000), // 2 hours ago
        poNumber: 'PO-2024-001',
        orderedAt: new Date(Date.now() - 7200000),
        notes: 'Order placed with supplier',
        history: [
          {
            at: new Date(Date.now() - 259200000),
            by: 'user-3',
            to: 'requested',
            note: 'Item requested'
          },
          {
            at: new Date(Date.now() - 144000000),
            by: 'user-3',
            from: 'requested',
            to: 'to-be-ordered',
            note: 'Moved to to-be-ordered'
          },
          {
            at: new Date(Date.now() - 7200000),
            by: 'admin-1',
            from: 'to-be-ordered',
            to: 'ordered',
            note: 'Order placed - PO-2024-001'
          }
        ]
      }
    ];

    await this.saveItems(mockItems);
  }
}

export const requestedItemsService = new RequestedItemsService();

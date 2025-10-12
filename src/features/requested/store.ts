import { create } from 'zustand';
import { RequestedItem, RequestState, ItemPriority, ItemUnit } from '@/lib/types';

interface RequestedItemsState {
  items: RequestedItem[];
  selectedItem: RequestedItem | null;
  isDrawerOpen: boolean;
  isLoading: boolean;
  
  // Actions
  setItems: (items: RequestedItem[]) => void;
  addItem: (item: RequestedItem) => void;
  updateItem: (id: string, updates: Partial<RequestedItem>) => void;
  moveItem: (id: string, newState: RequestState, userId: string) => void;
  deleteItem: (id: string) => void;
  setSelectedItem: (item: RequestedItem | null) => void;
  setDrawerOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  
  // Computed getters
  getItemsByState: (state: RequestState) => RequestedItem[];
  getItemsBySupplier: (state: RequestState, supplierId: string) => RequestedItem[];
  getSuppliersInState: (state: RequestState) => string[];
}

export const useRequestedItemsStore = create<RequestedItemsState>((set, get) => ({
  items: [],
  selectedItem: null,
  isDrawerOpen: false,
  isLoading: false,

  setItems: (items) => set({ items }),
  
  addItem: (item) => set((state) => ({ 
    items: [item, ...state.items] 
  })),
  
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map(item => 
      item.id === id 
        ? { 
            ...item, 
            ...updates, 
            lastUpdatedAt: new Date(),
            lastUpdatedBy: updates.lastUpdatedBy || item.lastUpdatedBy
          }
        : item
    )
  })),
  
  moveItem: (id, newState, userId) => set((state) => ({
    items: state.items.map(item => {
      if (item.id === id) {
        const now = new Date();
        return {
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
      }
      return item;
    })
  })),
  
  deleteItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),
  
  setSelectedItem: (item) => set({ selectedItem: item }),
  
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),
  
  setLoading: (loading) => set({ isLoading: loading }),

  getItemsByState: (state) => {
    return get().items.filter(item => item.state === state);
  },
  
  getItemsBySupplier: (state, supplierId) => {
    return get().items.filter(item => 
      item.state === state && item.supplierId === supplierId
    );
  },
  
  getSuppliersInState: (state) => {
    const items = get().getItemsByState(state);
    const supplierIds = [...new Set(items.map(item => item.supplierId))];
    return supplierIds;
  }
}));

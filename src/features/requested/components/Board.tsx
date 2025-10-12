import React, { useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { RequestedItem, RequestState } from '@/lib/types';
import { Column } from './Column';
import { ItemDrawer } from './Drawer';
import { useRequestedItemsStore } from '../store';
import { requestedItemsService } from '../service';
import { useAuth } from '@/contexts/AuthContext';

interface BoardProps {
  samples: { id: string; itemNameEN: string }[];
  suppliers: { id: string; name: string }[];
}

const stateConfig = {
  requested: { title: 'Requested', color: 'blue' },
  'to-be-ordered': { title: 'To Be Ordered', color: 'orange' },
  ordered: { title: 'Ordered', color: 'green' }
};

export const RequestedItemsBoard: React.FC<BoardProps> = ({
  samples,
  suppliers
}) => {
  const { user } = useAuth();
  const {
    items,
    selectedItem,
    isDrawerOpen,
    setItems,
    setSelectedItem,
    setDrawerOpen,
    setLoading,
    getItemsByState,
    getSuppliersInState,
    moveItem
  } = useRequestedItemsStore();

  const [draggedItem, setDraggedItem] = React.useState<RequestedItem | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await requestedItemsService.seedMockData(); // Seed mock data for development
        const items = await requestedItemsService.getAllItems();
        setItems(items);
      } catch (error) {
        console.error('Error loading requested items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setItems, setLoading]);

  const handleDragStart = (event: DragStartEvent) => {
    const item = items.find(item => item.id === event.active.id);
    setDraggedItem(item || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedItem(null);

    if (!over || !active) return;

    const itemId = active.id as string;
    const newState = over.id as RequestState;
    const item = items.find(item => item.id === itemId);

    if (!item || item.state === newState) return;

    // Check permissions for moving to 'ordered' state
    if (newState === 'ordered' && !user?.role?.includes('Admin') && !user?.role?.includes('Lab Lead')) {
      console.warn('Insufficient permissions to move item to ordered state');
      return;
    }

    // Validate state transitions
    const validTransitions: Record<RequestState, RequestState[]> = {
      requested: ['to-be-ordered'],
      'to-be-ordered': ['requested', 'ordered'],
      ordered: [] // Terminal state
    };

    if (!validTransitions[item.state].includes(newState)) {
      console.warn(`Invalid state transition from ${item.state} to ${newState}`);
      return;
    }

    try {
      await requestedItemsService.moveItem(itemId, newState, user?.id || 'unknown');
      moveItem(itemId, newState, user?.id || 'unknown');
    } catch (error) {
      console.error('Error moving item:', error);
    }
  };

  const handleItemClick = (item: RequestedItem) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const handleCreatePODraft = (supplierId: string) => {
    // Placeholder for PO creation
    console.log('Create PO draft for supplier:', supplierId);
  };

  const handleViewSupplier = (supplierId: string) => {
    // Placeholder for supplier view
    console.log('View supplier:', supplierId);
  };

  const getSampleName = (sampleId: string) => {
    const sample = samples.find(s => s.id === sampleId);
    return sample?.itemNameEN || `Sample #${sampleId}`;
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || `Supplier #${supplierId}`;
  };

  const columns: RequestState[] = ['requested', 'to-be-ordered', 'ordered'];

  return (
    <div className="h-full">
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-full overflow-x-auto pb-4">
          {columns.map(state => {
            const stateItems = getItemsByState(state);
            const supplierIds = getSuppliersInState(state);
            const suppliersInState = supplierIds.map(id => ({
              id,
              name: getSupplierName(id)
            }));

            return (
              <Column
                key={state}
                state={state}
                title={stateConfig[state].title}
                items={stateItems}
                suppliers={suppliersInState}
                onItemClick={handleItemClick}
                onCreatePODraft={handleCreatePODraft}
                onViewSupplier={handleViewSupplier}
              />
            );
          })}
        </div>

        <DragOverlay>
          {draggedItem ? (
            <div className="opacity-50">
              {/* Render a preview of the dragged item */}
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
                <div className="font-medium text-sm">{getSampleName(draggedItem.sampleId)}</div>
                <div className="text-xs text-gray-500">{getSupplierName(draggedItem.supplierId)}</div>
                <div className="text-xs text-gray-500">{draggedItem.quantity} {draggedItem.unit}</div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ItemDrawer
        item={selectedItem}
        isOpen={isDrawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedItem(null);
        }}
        sampleName={selectedItem ? getSampleName(selectedItem.sampleId) : undefined}
        supplierName={selectedItem ? getSupplierName(selectedItem.supplierId) : undefined}
      />
    </div>
  );
};

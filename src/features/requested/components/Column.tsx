import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { RequestedItem, RequestState } from '@/lib/types';
import { GroupHeader } from './GroupHeader';
import { RequestedItemCard } from './Card';
import { useRequestedItemsStore } from '../store';

interface ColumnProps {
  state: RequestState;
  title: string;
  items: RequestedItem[];
  suppliers: { id: string; name: string }[];
  onItemClick: (item: RequestedItem) => void;
  onCreatePODraft?: (supplierId: string) => void;
  onViewSupplier?: (supplierId: string) => void;
}

const stateConfig = {
  requested: {
    color: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20',
    headerColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  'to-be-ordered': {
    color: 'border-orange-200 bg-orange-50 dark:bg-orange-950/20',
    headerColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  ordered: {
    color: 'border-green-200 bg-green-50 dark:bg-green-950/20',
    headerColor: 'bg-green-100 dark:bg-green-900/30'
  }
};

export const Column: React.FC<ColumnProps> = ({
  state,
  title,
  items,
  suppliers,
  onItemClick,
  onCreatePODraft,
  onViewSupplier
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: state,
  });

  const config = stateConfig[state];

  return (
    <div className="flex-1 min-w-80">
      {/* Column Header */}
      <div className={`p-4 rounded-t-lg ${config.headerColor}`}>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {items.length} items
        </p>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={`min-h-96 p-3 space-y-3 rounded-b-lg border-2 border-dashed transition-colors ${
          isOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30' : config.color
        }`}
      >
        {suppliers.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p className="text-sm">No items in this column</p>
          </div>
        ) : (
          suppliers.map(supplier => {
            const supplierItems = items.filter(item => item.supplierId === supplier.id);
            
            return (
              <div key={supplier.id} className="space-y-2">
                <GroupHeader
                  supplierId={supplier.id}
                  supplierName={supplier.name}
                  itemCount={supplierItems.length}
                  onCreatePODraft={() => onCreatePODraft?.(supplier.id)}
                  onViewSupplier={() => onViewSupplier?.(supplier.id)}
                />
                
                <div className="space-y-2">
                  {supplierItems.map(item => (
                    <RequestedItemCard
                      key={item.id}
                      item={item}
                      sampleName={`Sample #${item.sampleId}`} // This would come from samples data
                      supplierName={supplier.name}
                      onClick={() => onItemClick(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

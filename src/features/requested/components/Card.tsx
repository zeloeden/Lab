import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { RequestedItem, ItemPriority } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Package, User, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CardProps {
  item: RequestedItem;
  sampleName?: string;
  supplierName?: string;
  onClick: () => void;
}

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-800', icon: null },
  medium: { color: 'bg-blue-100 text-blue-800', icon: null },
  high: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  critical: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
};

export const RequestedItemCard: React.FC<CardProps> = ({
  item,
  sampleName = 'Unknown Sample',
  supplierName = 'Unknown Supplier',
  onClick
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });

  const priority = priorityConfig[item.priority];
  const PriorityIcon = priority.icon;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500 ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Sample Name */}
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
              {sampleName}
            </h4>
            <Badge 
              variant="secondary" 
              className={`text-xs ${priority.color}`}
            >
              {PriorityIcon && <PriorityIcon className="h-3 w-3 mr-1" />}
              {item.priority}
            </Badge>
          </div>

          {/* Supplier */}
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <User className="h-3 w-3" />
            <span className="truncate">{supplierName}</span>
          </div>

          {/* Quantity & Unit */}
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Package className="h-3 w-3" />
            <span>{item.quantity} {item.unit}</span>
          </div>

          {/* Last Updated */}
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              {formatDistanceToNow(item.lastUpdatedAt, { addSuffix: true })}
            </span>
          </div>

          {/* Notes preview */}
          {item.notes && (
            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {item.notes}
            </div>
          )}

          {/* PO Number for ordered items */}
          {item.state === 'ordered' && item.poNumber && (
            <div className="text-xs font-mono text-green-600 dark:text-green-400">
              PO: {item.poNumber}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

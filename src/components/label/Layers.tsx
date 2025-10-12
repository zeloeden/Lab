/**
 * Layers panel for managing element hierarchy
 */

import React, { useState } from 'react';
import { EnhancedLabelElement } from '@/lib/label-model';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Move, 
  Trash2, 
  Copy,
  Layers as LayersIcon,
  ChevronUp,
  ChevronDown,
  MoreVertical
} from 'lucide-react';

interface LayersProps {
  elements: EnhancedLabelElement[];
  selectedElementId?: string;
  onSelectElement: (elementId: string) => void;
  onUpdateElement: (elementId: string, updates: Partial<EnhancedLabelElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement: (elementId: string) => void;
  onMoveElement: (elementId: string, direction: 'up' | 'down') => void;
}

export const Layers: React.FC<LayersProps> = ({
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveElement
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group elements by type
  const groupedElements = elements.reduce((groups, element) => {
    const type = element.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(element);
    return groups;
  }, {} as Record<string, EnhancedLabelElement[]>);

  // Sort elements by z-index
  const sortedElements = elements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  const toggleGroup = (groupType: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupType)) {
      newExpanded.delete(groupType);
    } else {
      newExpanded.add(groupType);
    }
    setExpandedGroups(newExpanded);
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text': return 'T';
      case 'image': return '🖼️';
      case 'barcode': return '📊';
      case 'qr': return '🔲';
      case 'shape': return '⬜';
      case 'table': return '📋';
      default: return '?';
    }
  };

  const getElementColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'image': return 'bg-green-100 text-green-800';
      case 'barcode': return 'bg-purple-100 text-purple-800';
      case 'qr': return 'bg-orange-100 text-orange-800';
      case 'shape': return 'bg-gray-100 text-gray-800';
      case 'table': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <LayersIcon className="h-4 w-4" />
          Layers ({elements.length})
        </h3>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {Object.entries(groupedElements).map(([type, typeElements]) => (
          <Card key={type} className="overflow-hidden">
            <CardHeader 
              className="pb-2 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleGroup(type)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize">{type}s</span>
                  <Badge variant="secondary" className="text-xs">
                    {typeElements.length}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm">
                  {expandedGroups.has(type) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            {expandedGroups.has(type) && (
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {typeElements
                    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                    .map((element) => (
                      <LayerItem
                        key={element.id}
                        element={element}
                        isSelected={selectedElementId === element.id}
                        onSelect={() => onSelectElement(element.id)}
                        onUpdate={(updates) => onUpdateElement(element.id, updates)}
                        onDelete={() => onDeleteElement(element.id)}
                        onDuplicate={() => onDuplicateElement(element.id)}
                        onMoveUp={() => onMoveElement(element.id, 'up')}
                        onMoveDown={() => onMoveElement(element.id, 'down')}
                        getElementIcon={getElementIcon}
                        getElementColor={getElementColor}
                      />
                    ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {elements.length === 0 && (
        <div className="text-center py-8">
          <LayersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No elements added yet</p>
        </div>
      )}
    </div>
  );
};

interface LayerItemProps {
  element: EnhancedLabelElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<EnhancedLabelElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  getElementIcon: (type: string) => string;
  getElementColor: (type: string) => string;
}

const LayerItem: React.FC<LayerItemProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  getElementIcon,
  getElementColor
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`p-2 rounded border cursor-pointer transition-colors ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-6 h-6 rounded text-xs flex items-center justify-center ${getElementColor(element.type)}`}>
            {getElementIcon(element.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {element.name || element.id}
            </div>
            <div className="text-xs text-gray-500">
              {element.type} • {Math.round(element.x)}, {Math.round(element.y)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Visibility toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ visible: !element.visible });
            }}
            className="h-6 w-6 p-0"
          >
            {element.visible ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
          </Button>
          
          {/* Lock toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ locked: !element.locked });
            }}
            className="h-6 w-6 p-0"
          >
            {element.locked ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Unlock className="h-3 w-3" />
            )}
          </Button>
          
          {/* Actions menu */}
          {showActions && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp();
                }}
                className="h-6 w-6 p-0"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown();
                }}
                className="h-6 w-6 p-0"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

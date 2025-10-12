/**
 * Layers Panel component for the Label Editor
 * Provides layer management, visibility, locking, and ordering
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  GripVertical, 
  Copy, 
  Trash2, 
  Edit3,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Filter
} from 'lucide-react';
import { LabelElement } from '../types';

interface LayersPanelProps {
  elements: LabelElement[];
  selectedElements: string[];
  onElementSelect: (elementId: string, multiSelect?: boolean) => void;
  onElementUpdate: (element: LabelElement) => void;
  onElementDelete: (elementId: string) => void;
  onElementDuplicate: (elementId: string) => void;
  onElementReorder: (elementId: string, newIndex: number) => void;
  onElementRename: (elementId: string, newName: string) => void;
  onToggleVisibility: (elementId: string) => void;
  onToggleLock: (elementId: string) => void;
  onBringToFront: (elementId: string) => void;
  onSendToBack: (elementId: string) => void;
  onBringForward: (elementId: string) => void;
  onSendBackward: (elementId: string) => void;
  className?: string;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  elements,
  selectedElements,
  onElementSelect,
  onElementUpdate,
  onElementDelete,
  onElementDuplicate,
  onElementReorder,
  onElementRename,
  onToggleVisibility,
  onToggleLock,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  className = '',
}) => {
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [filter, setFilter] = useState('');
  const [showHidden, setShowHidden] = useState(true);

  // Sort elements by zIndex (top to bottom)
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  // Filter elements
  const filteredElements = sortedElements.filter(element => {
    if (!showHidden && !element.visible) return false;
    if (filter && !element.content.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const handleElementClick = (elementId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      onElementSelect(elementId, true);
    } else {
      onElementSelect(elementId, false);
    }
  };

  const handleRenameStart = (element: LabelElement) => {
    setEditingElement(element.id);
    setEditingName(element.content);
  };

  const handleRenameSave = () => {
    if (editingElement && editingName.trim()) {
      onElementRename(editingElement, editingName.trim());
    }
    setEditingElement(null);
    setEditingName('');
  };

  const handleRenameCancel = () => {
    setEditingElement(null);
    setEditingName('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleRenameSave();
    } else if (event.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const getElementIcon = (element: LabelElement) => {
    switch (element.type) {
      case 'text':
        return 'T';
      case 'image':
        return 'I';
      case 'shape':
        return element.content === 'circle' ? '○' : '□';
      case 'line':
        return '—';
      case 'barcode':
        return '|||';
      case 'qr':
        return '◊';
      case 'table':
        return '⊞';
      case 'variable':
        return 'V';
      default:
        return '?';
    }
  };

  const getElementTypeColor = (element: LabelElement) => {
    switch (element.type) {
      case 'text':
        return 'bg-blue-100 text-blue-800';
      case 'image':
        return 'bg-green-100 text-green-800';
      case 'shape':
        return 'bg-purple-100 text-purple-800';
      case 'line':
        return 'bg-gray-100 text-gray-800';
      case 'barcode':
        return 'bg-orange-100 text-orange-800';
      case 'qr':
        return 'bg-indigo-100 text-indigo-800';
      case 'table':
        return 'bg-pink-100 text-pink-800';
      case 'variable':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isSelected = (elementId: string) => selectedElements.includes(elementId);
  const isTopLayer = (element: LabelElement) => element.zIndex === Math.max(...elements.map(el => el.zIndex));
  const isBottomLayer = (element: LabelElement) => element.zIndex === Math.min(...elements.map(el => el.zIndex));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            Layers
            <Badge variant="secondary" className="text-xs">
              {elements.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter layers..."
                className="h-8 text-xs pr-8"
              />
              <Filter className="absolute right-2 top-2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Show/Hide Options */}
          <div className="flex items-center gap-2">
            <Button
              variant={showHidden ? "default" : "outline"}
              size="sm"
              onClick={() => setShowHidden(!showHidden)}
              className="h-6 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Show Hidden
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Layers List */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {filteredElements.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {filter ? 'No layers match the filter' : 'No layers'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredElements.map((element, index) => (
                  <div
                    key={element.id}
                    className={`group flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer ${
                      isSelected(element.id) ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                    onClick={(e) => handleElementClick(element.id, e)}
                  >
                    {/* Drag Handle */}
                    <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    {/* Element Icon */}
                    <div className={`flex-shrink-0 w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${getElementTypeColor(element)}`}>
                      {getElementIcon(element)}
                    </div>

                    {/* Element Name */}
                    <div className="flex-1 min-w-0">
                      {editingElement === element.id ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={handleRenameSave}
                          className="h-6 text-xs"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs truncate">{element.content || 'Untitled'}</span>
                          {element.groupId && (
                            <Badge variant="outline" className="text-xs">Group</Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Layer Position Indicators */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {isTopLayer(element) && (
                        <Badge variant="outline" className="text-xs">Top</Badge>
                      )}
                      {isBottomLayer(element) && (
                        <Badge variant="outline" className="text-xs">Bottom</Badge>
                      )}
                    </div>

                    {/* Visibility Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(element.id);
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    >
                      {element.visible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                    </Button>

                    {/* Lock Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLock(element.id);
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    >
                      {element.locked ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <Unlock className="h-3 w-3" />
                      )}
                    </Button>

                    {/* Actions Menu */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                        
                        {/* Dropdown Menu would go here */}
                        <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-md shadow-lg z-10 hidden">
                          <div className="py-1">
                            <button
                              className="flex items-center gap-2 px-3 py-1 text-xs hover:bg-gray-100 w-full text-left"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameStart(element);
                              }}
                            >
                              <Edit3 className="h-3 w-3" />
                              Rename
                            </button>
                            <button
                              className="flex items-center gap-2 px-3 py-1 text-xs hover:bg-gray-100 w-full text-left"
                              onClick={(e) => {
                                e.stopPropagation();
                                onElementDuplicate(element.id);
                              }}
                            >
                              <Copy className="h-3 w-3" />
                              Duplicate
                            </button>
                            <Separator className="my-1" />
                            <button
                              className="flex items-center gap-2 px-3 py-1 text-xs hover:bg-gray-100 w-full text-left"
                              onClick={(e) => {
                                e.stopPropagation();
                                onBringToFront(element.id);
                              }}
                            >
                              <ArrowUp className="h-3 w-3" />
                              Bring to Front
                            </button>
                            <button
                              className="flex items-center gap-2 px-3 py-1 text-xs hover:bg-gray-100 w-full text-left"
                              onClick={(e) => {
                                e.stopPropagation();
                                onBringForward(element.id);
                              }}
                            >
                              <ArrowUp className="h-3 w-3" />
                              Bring Forward
                            </button>
                            <button
                              className="flex items-center gap-2 px-3 py-1 text-xs hover:bg-gray-100 w-full text-left"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSendBackward(element.id);
                              }}
                            >
                              <ArrowDown className="h-3 w-3" />
                              Send Backward
                            </button>
                            <button
                              className="flex items-center gap-2 px-3 py-1 text-xs hover:bg-gray-100 w-full text-left"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSendToBack(element.id);
                              }}
                            >
                              <ArrowDown className="h-3 w-3" />
                              Send to Back
                            </button>
                            <Separator className="my-1" />
                            <button
                              className="flex items-center gap-2 px-3 py-1 text-xs hover:bg-red-100 text-red-600 w-full text-left"
                              onClick={(e) => {
                                e.stopPropagation();
                                onElementDelete(element.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Layer Actions */}
      {selectedElements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Layer Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-gray-600 mb-2">
              {selectedElements.length} layer{selectedElements.length > 1 ? 's' : ''} selected
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedElements.forEach(id => onElementDuplicate(id))}
                className="justify-start"
              >
                <Copy className="h-3 w-3 mr-2" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedElements.forEach(id => onElementDelete(id))}
                className="justify-start text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </Button>
            </div>

            <Separator />

            <div className="space-y-1">
              <div className="text-xs font-semibold">Layer Order</div>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedElements.forEach(id => onBringToFront(id))}
                  className="justify-start"
                >
                  <ArrowUp className="h-3 w-3 mr-1" />
                  To Front
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedElements.forEach(id => onSendToBack(id))}
                  className="justify-start"
                >
                  <ArrowDown className="h-3 w-3 mr-1" />
                  To Back
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <div className="text-xs font-semibold">Visibility & Lock</div>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedElements.forEach(id => onToggleVisibility(id))}
                  className="justify-start"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Toggle Visibility
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedElements.forEach(id => onToggleLock(id))}
                  className="justify-start"
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Toggle Lock
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

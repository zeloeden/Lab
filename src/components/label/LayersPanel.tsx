/**
 * Layers panel for label editor
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  Copy, 
  MoveUp, 
  MoveDown,
  Layers,
  Search
} from 'lucide-react';
import { EnhancedLabelElement } from '@/lib/label-model';

interface LayersPanelProps {
  elements: EnhancedLabelElement[];
  selectedElementId?: string;
  onElementSelect: (elementId: string) => void;
  onElementUpdate: (elementId: string, updates: Partial<EnhancedLabelElement>) => void;
  onElementDelete: (elementId: string) => void;
  onElementDuplicate: (elementId: string) => void;
  onElementMove: (elementId: string, direction: 'up' | 'down') => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  elements,
  selectedElementId,
  onElementSelect,
  onElementUpdate,
  onElementDelete,
  onElementDuplicate,
  onElementMove
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showHidden, setShowHidden] = useState(true);

  // Sort elements by zIndex (highest first)
  const sortedElements = Array.isArray(elements) ? [...elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)) : [];

  const filteredElements = sortedElements.filter(element => {
    const matchesSearch = element.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         element.type.toLowerCase().includes(searchTerm.toLowerCase());
    const isVisible = showHidden || element.visible !== false;
    return matchesSearch && isVisible;
  });

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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Layers className="h-4 w-4" />
          Layers ({elements.length})
        </CardTitle>
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search layers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={showHidden ? "default" : "outline"}
              size="sm"
              onClick={() => setShowHidden(!showHidden)}
              className="h-7 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Show Hidden
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {filteredElements.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {searchTerm ? 'No layers match your search' : 'No layers yet'}
            </div>
          ) : (
            filteredElements.map((element, index) => (
              <div
                key={element.id}
                className={`p-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedElementId === element.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => onElementSelect(element.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold ${getElementColor(element.type)}`}>
                      {getElementIcon(element.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {element.name || `${element.type} ${index + 1}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {element.type} • {Math.round(element.x)}×{Math.round(element.y)} • {Math.round(element.w)}×{Math.round(element.h)}mm
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {/* Visibility toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onElementUpdate(element.id, { visible: !element.visible });
                      }}
                    >
                      {element.visible !== false ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-gray-400" />
                      )}
                    </Button>

                    {/* Lock toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onElementUpdate(element.id, { locked: !element.locked });
                      }}
                    >
                      {element.locked ? (
                        <Lock className="h-3 w-3 text-red-500" />
                      ) : (
                        <Unlock className="h-3 w-3 text-gray-400" />
                      )}
                    </Button>

                    {/* Actions dropdown */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onElementMove(element.id, 'up');
                        }}
                        disabled={index === 0}
                      >
                        <MoveUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onElementMove(element.id, 'down');
                        }}
                        disabled={index === filteredElements.length - 1}
                      >
                        <MoveDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onElementDuplicate(element.id);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onElementDelete(element.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

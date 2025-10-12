/**
 * Tools Panel component for the Label Editor
 * Provides tools for creating and manipulating elements
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Type, 
  Image, 
  Square, 
  Circle, 
  Minus,
  QrCode, 
  BarChart3, 
  Table,
  Variable,
  MousePointer,
  Hand,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  MoreVertical,
  Group,
  Ungroup,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';
import { LabelElement, ToolType, DEFAULT_LABEL_SIZE } from '../types';
import { mmToPx } from '../utils/unitConversion';

interface ToolsPanelProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onAddElement: (type: LabelElement['type'], content?: string) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onGroupSelected: () => void;
  onUngroupSelected: () => void;
  onAlignSelected: (alignment: string) => void;
  onDistributeSelected: (direction: 'horizontal' | 'vertical') => void;
  onFlipSelected: (direction: 'horizontal' | 'vertical') => void;
  onRotateSelected: (angle: number) => void;
  onToggleVisibility: (elementId: string) => void;
  onToggleLock: (elementId: string) => void;
  selectedElements: string[];
  elements: LabelElement[];
  className?: string;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  activeTool,
  onToolChange,
  onAddElement,
  onDuplicateSelected,
  onDeleteSelected,
  onGroupSelected,
  onUngroupSelected,
  onAlignSelected,
  onDistributeSelected,
  onFlipSelected,
  onRotateSelected,
  onToggleVisibility,
  onToggleLock,
  selectedElements,
  elements,
  className = '',
}) => {
  const [barcodeValue, setBarcodeValue] = useState('');
  const [barcodeType, setBarcodeType] = useState<'code128' | 'ean13' | 'ean8' | 'upc'>('code128');
  const [qrValue, setQrValue] = useState('');
  const [tableRows, setTableRows] = useState(3);

  const tools: Array<{ type: ToolType; name: string; icon: React.ReactNode; shortcut?: string }> = [
    { type: 'select', name: 'Select', icon: <MousePointer className="h-4 w-4" />, shortcut: 'V' },
    { type: 'text', name: 'Text', icon: <Type className="h-4 w-4" />, shortcut: 'T' },
    { type: 'image', name: 'Image', icon: <Image className="h-4 w-4" />, shortcut: 'I' },
    { type: 'shape', name: 'Shape', icon: <Square className="h-4 w-4" />, shortcut: 'R' },
    { type: 'line', name: 'Line', icon: <Minus className="h-4 w-4" />, shortcut: 'L' },
    { type: 'barcode', name: 'Barcode', icon: <BarChart3 className="h-4 w-4" />, shortcut: 'B' },
    { type: 'qr', name: 'QR Code', icon: <QrCode className="h-4 w-4" />, shortcut: 'Q' },
    { type: 'table', name: 'Table', icon: <Table className="h-4 w-4" />, shortcut: 'Tab' },
    { type: 'variable', name: 'Variable', icon: <Variable className="h-4 w-4" />, shortcut: 'V' },
  ];

  const handleAddText = () => {
    onAddElement('text', 'New Text');
  };

  const handleAddShape = (shapeType: 'rectangle' | 'circle') => {
    onAddElement('shape', shapeType);
  };

  const handleAddLine = () => {
    onAddElement('line', 'line');
  };

  const handleAddBarcode = () => {
    if (barcodeValue.trim()) {
      onAddElement('barcode', barcodeValue);
      setBarcodeValue('');
    }
  };

  const handleAddQR = () => {
    if (qrValue.trim()) {
      onAddElement('qr', qrValue);
      setQrValue('');
    }
  };

  const handleAddTable = () => {
    onAddElement('table', `table-${tableRows}`);
  };

  const handleAddVariable = () => {
    onAddElement('variable', '{{Variable}}');
  };

  const canGroup = selectedElements.length > 1;
  const canUngroup = selectedElements.length === 1 && elements.find(el => el.id === selectedElements[0])?.groupId;
  const canAlign = selectedElements.length > 1;
  const canDistribute = selectedElements.length > 2;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {tools.map((tool) => (
              <Button
                key={tool.type}
                variant={activeTool === tool.type ? "default" : "outline"}
                size="sm"
                onClick={() => onToolChange(tool.type)}
                className="flex items-center gap-2 justify-start"
                title={`${tool.name} (${tool.shortcut})`}
              >
                {tool.icon}
                <span className="text-xs">{tool.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Element Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add Elements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Text */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Text</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddText}
              className="w-full justify-start"
            >
              <Type className="h-4 w-4 mr-2" />
              Add Text
            </Button>
          </div>

          {/* Shapes */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Shapes</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddShape('rectangle')}
                className="justify-start"
              >
                <Square className="h-4 w-4 mr-2" />
                Rectangle
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddShape('circle')}
                className="justify-start"
              >
                <Circle className="h-4 w-4 mr-2" />
                Circle
              </Button>
            </div>
          </div>

          {/* Line */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Line</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddLine}
              className="w-full justify-start"
            >
              <Minus className="h-4 w-4 mr-2" />
              Add Line
            </Button>
          </div>

          {/* Barcode */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Barcode</Label>
            <div className="space-y-2">
              <Select value={barcodeType} onValueChange={(value: any) => setBarcodeType(value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="code128">Code 128</SelectItem>
                  <SelectItem value="ean13">EAN-13</SelectItem>
                  <SelectItem value="ean8">EAN-8</SelectItem>
                  <SelectItem value="upc">UPC-A</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  value={barcodeValue}
                  onChange={(e) => setBarcodeValue(e.target.value)}
                  placeholder="Enter value"
                  className="h-8 text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddBarcode}
                  disabled={!barcodeValue.trim()}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">QR Code</Label>
            <div className="flex gap-2">
              <Input
                value={qrValue}
                onChange={(e) => setQrValue(e.target.value)}
                placeholder="Enter value"
                className="h-8 text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddQR}
                disabled={!qrValue.trim()}
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Table</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Label className="text-xs self-center">Rows:</Label>
                <Input
                  type="number"
                  value={tableRows}
                  onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-8 text-xs w-16"
                  min="1"
                  max="10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTable}
                className="w-full justify-start"
              >
                <Table className="h-4 w-4 mr-2" />
                Add Table
              </Button>
            </div>
          </div>

          {/* Variable */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Variable</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddVariable}
              className="w-full justify-start"
            >
              <Variable className="h-4 w-4 mr-2" />
              Add Variable
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selection Actions */}
      {selectedElements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selection Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-gray-600 mb-2">
              {selectedElements.length} element{selectedElements.length > 1 ? 's' : ''} selected
            </div>

            {/* Basic Actions */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDuplicateSelected}
                  className="justify-start"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDeleteSelected}
                  className="justify-start text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            <Separator />

            {/* Grouping */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Grouping</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGroupSelected}
                  disabled={!canGroup}
                  className="justify-start"
                >
                  <Group className="h-4 w-4 mr-2" />
                  Group
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUngroupSelected}
                  disabled={!canUngroup}
                  className="justify-start"
                >
                  <Ungroup className="h-4 w-4 mr-2" />
                  Ungroup
                </Button>
              </div>
            </div>

            <Separator />

            {/* Alignment */}
            {canAlign && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Alignment</Label>
                <div className="space-y-1">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAlignSelected('left')}
                      className="flex-1"
                    >
                      <AlignLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAlignSelected('center')}
                      className="flex-1"
                    >
                      <AlignCenter className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAlignSelected('right')}
                      className="flex-1"
                    >
                      <AlignRight className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAlignSelected('justify')}
                      className="flex-1"
                    >
                      <AlignJustify className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAlignSelected('top')}
                      className="flex-1"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAlignSelected('middle')}
                      className="flex-1"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAlignSelected('bottom')}
                      className="flex-1"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Distribution */}
            {canDistribute && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Distribution</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDistributeSelected('horizontal')}
                    className="justify-start"
                  >
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Horizontal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDistributeSelected('vertical')}
                    className="justify-start"
                  >
                    <MoreVertical className="h-4 w-4 mr-2" />
                    Vertical
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Transform */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Transform</Label>
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onFlipSelected('horizontal')}
                    className="justify-start"
                  >
                    <FlipHorizontal className="h-3 w-3 mr-1" />
                    Flip H
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onFlipSelected('vertical')}
                    className="justify-start"
                  >
                    <FlipVertical className="h-3 w-3 mr-1" />
                    Flip V
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRotateSelected(90)}
                    className="justify-start"
                  >
                    <RotateCw className="h-3 w-3 mr-1" />
                    90°
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRotateSelected(180)}
                    className="justify-start"
                  >
                    <RotateCw className="h-3 w-3 mr-1" />
                    180°
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRotateSelected(270)}
                    className="justify-start"
                  >
                    <RotateCw className="h-3 w-3 mr-1" />
                    270°
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Element Visibility & Lock */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Element Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {elements.map((element) => (
            <div
              key={element.id}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-50"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleVisibility(element.id)}
                className="h-6 w-6 p-0"
              >
                {element.visible ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleLock(element.id)}
                className="h-6 w-6 p-0"
              >
                {element.locked ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
              </Button>
              <span className="text-xs flex-1 truncate">
                {element.type}: {element.content.substring(0, 15)}...
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Inspector panel for element properties
 */

import React, { useState, useEffect } from 'react';
import { EnhancedLabelElement, EnhancedTextElement, EnhancedImageElement, EnhancedBarcodeElement, EnhancedQRElement, EnhancedShapeElement, EnhancedTableElement, TextStyle } from '@/lib/label-model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Type, 
  Image, 
  QrCode, 
  BarChart3,
  Square,
  Table,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RotateCw,
  Move,
  Resize,
  Layers
} from 'lucide-react';

interface InspectorProps {
  element: EnhancedLabelElement | null;
  template: any;
  onUpdate: (element: EnhancedLabelElement) => void;
  onDelete: () => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  element,
  template,
  onUpdate,
  onDelete
}) => {
  const [localElement, setLocalElement] = useState<EnhancedLabelElement | null>(null);

  useEffect(() => {
    setLocalElement(element);
  }, [element]);

  if (!localElement) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Select an element to view properties</p>
        </div>
      </div>
    );
  }

  const updateElement = (updates: Partial<EnhancedLabelElement>) => {
    const updated = { ...localElement, ...updates };
    setLocalElement(updated);
    onUpdate(updated);
  };

  const updateNestedProperty = (path: string, value: any) => {
    const keys = path.split('.');
    const updated = { ...localElement };
    let current: any = updated;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setLocalElement(updated);
    onUpdate(updated);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Element Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{localElement.type}</Badge>
          <span className="text-sm font-medium">{localElement.name || localElement.id}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateElement({ visible: !localElement.visible })}
          >
            {localElement.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateElement({ locked: !localElement.locked })}
          >
            {localElement.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="position" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="position">Position</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="position" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Position & Size</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="x" className="text-xs">X Position</Label>
                  <Input
                    id="x"
                    type="number"
                    value={localElement.x}
                    onChange={(e) => updateElement({ x: parseFloat(e.target.value) || 0 })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="y" className="text-xs">Y Position</Label>
                  <Input
                    id="y"
                    type="number"
                    value={localElement.y}
                    onChange={(e) => updateElement({ y: parseFloat(e.target.value) || 0 })}
                    className="text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="w" className="text-xs">Width</Label>
                  <Input
                    id="w"
                    type="number"
                    value={localElement.w}
                    onChange={(e) => updateElement({ w: parseFloat(e.target.value) || 0 })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="h" className="text-xs">Height</Label>
                  <Input
                    id="h"
                    type="number"
                    value={localElement.h}
                    onChange={(e) => updateElement({ h: parseFloat(e.target.value) || 0 })}
                    className="text-xs"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="rotation" className="text-xs">Rotation</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[localElement.rotation || 0]}
                    onValueChange={([value]) => updateElement({ rotation: value })}
                    min={-180}
                    max={180}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    id="rotation"
                    type="number"
                    value={localElement.rotation || 0}
                    onChange={(e) => updateElement({ rotation: parseFloat(e.target.value) || 0 })}
                    className="w-16 text-xs"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="opacity" className="text-xs">Opacity</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[localElement.opacity || 1]}
                    onValueChange={([value]) => updateElement({ opacity: value })}
                    min={0}
                    max={1}
                    step={0.01}
                    className="flex-1"
                  />
                  <Input
                    id="opacity"
                    type="number"
                    value={localElement.opacity || 1}
                    onChange={(e) => updateElement({ opacity: parseFloat(e.target.value) || 1 })}
                    className="w-16 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Constraints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="resizable" className="text-xs">Resizable</Label>
                <Switch
                  id="resizable"
                  checked={localElement.constraints?.resizable ?? true}
                  onCheckedChange={(checked) => updateNestedProperty('constraints.resizable', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="movable" className="text-xs">Movable</Label>
                <Switch
                  id="movable"
                  checked={localElement.constraints?.movable ?? true}
                  onCheckedChange={(checked) => updateNestedProperty('constraints.movable', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="rotatable" className="text-xs">Rotatable</Label>
                <Switch
                  id="rotatable"
                  checked={localElement.constraints?.rotatable ?? true}
                  onCheckedChange={(checked) => updateNestedProperty('constraints.rotatable', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="selectable" className="text-xs">Selectable</Label>
                <Switch
                  id="selectable"
                  checked={localElement.constraints?.selectable ?? true}
                  onCheckedChange={(checked) => updateNestedProperty('constraints.selectable', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="style" className="space-y-4">
          {localElement.type === 'text' && (
            <TextStyleInspector element={localElement as EnhancedTextElement} onUpdate={updateElement} />
          )}
          {localElement.type === 'image' && (
            <ImageStyleInspector element={localElement as EnhancedImageElement} onUpdate={updateElement} />
          )}
          {localElement.type === 'barcode' && (
            <BarcodeStyleInspector element={localElement as EnhancedBarcodeElement} onUpdate={updateElement} />
          )}
          {localElement.type === 'qr' && (
            <QRStyleInspector element={localElement as EnhancedQRElement} onUpdate={updateElement} />
          )}
          {localElement.type === 'shape' && (
            <ShapeStyleInspector element={localElement as EnhancedShapeElement} onUpdate={updateElement} />
          )}
          {localElement.type === 'table' && (
            <TableStyleInspector element={localElement as EnhancedTableElement} onUpdate={updateElement} />
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Data Binding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="dataField" className="text-xs">Field</Label>
                <Input
                  id="dataField"
                  value={localElement.dataBinding?.field || ''}
                  onChange={(e) => updateNestedProperty('dataBinding.field', e.target.value)}
                  placeholder="e.g., productName"
                  className="text-xs"
                />
              </div>
              <div>
                <Label htmlFor="dataFormat" className="text-xs">Format</Label>
                <Input
                  id="dataFormat"
                  value={localElement.dataBinding?.format || ''}
                  onChange={(e) => updateNestedProperty('dataBinding.format', e.target.value)}
                  placeholder="e.g., {0:C} for currency"
                  className="text-xs"
                />
              </div>
              <div>
                <Label htmlFor="dataDefault" className="text-xs">Default Value</Label>
                <Input
                  id="dataDefault"
                  value={localElement.dataBinding?.defaultValue || ''}
                  onChange={(e) => updateNestedProperty('dataBinding.defaultValue', e.target.value)}
                  placeholder="Fallback value"
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Text Style Inspector
const TextStyleInspector: React.FC<{ element: EnhancedTextElement; onUpdate: (element: EnhancedTextElement) => void }> = ({
  element,
  onUpdate
}) => {
  const updateElement = (updates: Partial<EnhancedTextElement>) => {
    onUpdate({ ...element, ...updates });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Text Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="content" className="text-xs">Content</Label>
            <Input
              id="content"
              value={element.content}
              onChange={(e) => updateElement({ content: e.target.value })}
              placeholder="Enter text or use {{variable}}"
              className="text-xs"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="rtl" className="text-xs">Right-to-Left</Label>
            <Switch
              id="rtl"
              checked={element.rtl || false}
              onCheckedChange={(checked) => updateElement({ rtl: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Typography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="fontFamily" className="text-xs">Font Family</Label>
              <Select
                value={element.fontFamily || 'Arial'}
                onValueChange={(value) => updateElement({ fontFamily: value })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fontSize" className="text-xs">Font Size</Label>
              <Input
                id="fontSize"
                type="number"
                value={element.fontSize || 12}
                onChange={(e) => updateElement({ fontSize: parseFloat(e.target.value) || 12 })}
                className="text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="fontWeight" className="text-xs">Weight</Label>
              <Select
                value={element.fontWeight || 'normal'}
                onValueChange={(value) => updateElement({ fontWeight: value })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="300">300</SelectItem>
                  <SelectItem value="400">400</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="600">600</SelectItem>
                  <SelectItem value="700">700</SelectItem>
                  <SelectItem value="800">800</SelectItem>
                  <SelectItem value="900">900</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fontStyle" className="text-xs">Style</Label>
              <Select
                value={element.fontStyle || 'normal'}
                onValueChange={(value) => updateElement({ fontStyle: value })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="italic">Italic</SelectItem>
                  <SelectItem value="oblique">Oblique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="color" className="text-xs">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={element.color || '#000000'}
                onChange={(e) => updateElement({ color: e.target.value })}
                className="w-12 h-8 p-1"
              />
              <Input
                value={element.color || '#000000'}
                onChange={(e) => updateElement({ color: e.target.value })}
                className="text-xs flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Alignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="textAlign" className="text-xs">Horizontal</Label>
            <div className="flex gap-1 mt-1">
              <Button
                variant={element.textAlign === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateElement({ textAlign: 'left' })}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={element.textAlign === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateElement({ textAlign: 'center' })}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant={element.textAlign === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateElement({ textAlign: 'right' })}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
              <Button
                variant={element.textAlign === 'justify' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateElement({ textAlign: 'justify' })}
              >
                <AlignJustify className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="verticalAlign" className="text-xs">Vertical</Label>
            <Select
              value={element.verticalAlign || 'top'}
              onValueChange={(value) => updateElement({ verticalAlign: value as any })}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="middle">Middle</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Image Style Inspector
const ImageStyleInspector: React.FC<{ element: EnhancedImageElement; onUpdate: (element: EnhancedImageElement) => void }> = ({
  element,
  onUpdate
}) => {
  const updateElement = (updates: Partial<EnhancedImageElement>) => {
    onUpdate({ ...element, ...updates });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Image Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="src" className="text-xs">URL</Label>
            <Input
              id="src"
              value={element.src}
              onChange={(e) => updateElement({ src: e.target.value })}
              placeholder="https://example.com/image.png"
              className="text-xs"
            />
          </div>
          <div>
            <Label htmlFor="alt" className="text-xs">Alt Text</Label>
            <Input
              id="alt"
              value={element.alt || ''}
              onChange={(e) => updateElement({ alt: e.target.value })}
              placeholder="Description of image"
              className="text-xs"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Display Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="fit" className="text-xs">Fit Mode</Label>
            <Select
              value={element.fit || 'contain'}
              onValueChange={(value) => updateElement({ fit: value as any })}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="fill">Fill</SelectItem>
                <SelectItem value="scale-down">Scale Down</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="position" className="text-xs">Position</Label>
            <Select
              value={element.position || 'center'}
              onValueChange={(value) => updateElement({ position: value as any })}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="top-left">Top Left</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Barcode Style Inspector
const BarcodeStyleInspector: React.FC<{ element: EnhancedBarcodeElement; onUpdate: (element: EnhancedBarcodeElement) => void }> = ({
  element,
  onUpdate
}) => {
  const updateElement = (updates: Partial<EnhancedBarcodeElement>) => {
    onUpdate({ ...element, ...updates });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Barcode Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="value" className="text-xs">Value</Label>
            <Input
              id="value"
              value={element.value}
              onChange={(e) => updateElement({ value: e.target.value })}
              placeholder="Enter value or use {{variable}}"
              className="text-xs"
            />
          </div>
          <div>
            <Label htmlFor="symbology" className="text-xs">Symbology</Label>
            <Select
              value={element.symbology}
              onValueChange={(value) => updateElement({ symbology: value as any })}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="code128">Code 128</SelectItem>
                <SelectItem value="code39">Code 39</SelectItem>
                <SelectItem value="code93">Code 93</SelectItem>
                <SelectItem value="ean13">EAN-13</SelectItem>
                <SelectItem value="ean8">EAN-8</SelectItem>
                <SelectItem value="upc-a">UPC-A</SelectItem>
                <SelectItem value="upc-e">UPC-E</SelectItem>
                <SelectItem value="codabar">Codabar</SelectItem>
                <SelectItem value="gs1-128">GS1-128</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="displayValue" className="text-xs">Show Text</Label>
            <Switch
              id="displayValue"
              checked={element.displayValue || false}
              onCheckedChange={(checked) => updateElement({ displayValue: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// QR Style Inspector
const QRStyleInspector: React.FC<{ element: EnhancedQRElement; onUpdate: (element: EnhancedQRElement) => void }> = ({
  element,
  onUpdate
}) => {
  const updateElement = (updates: Partial<EnhancedQRElement>) => {
    onUpdate({ ...element, ...updates });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">QR Code Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="value" className="text-xs">Value</Label>
            <Input
              id="value"
              value={element.value}
              onChange={(e) => updateElement({ value: e.target.value })}
              placeholder="Enter value or use {{variable}}"
              className="text-xs"
            />
          </div>
          <div>
            <Label htmlFor="ecc" className="text-xs">Error Correction</Label>
            <Select
              value={element.ecc || 'M'}
              onValueChange={(value) => updateElement({ ecc: value as any })}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Low (7%)</SelectItem>
                <SelectItem value="M">Medium (15%)</SelectItem>
                <SelectItem value="Q">Quartile (25%)</SelectItem>
                <SelectItem value="H">High (30%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Shape Style Inspector
const ShapeStyleInspector: React.FC<{ element: EnhancedShapeElement; onUpdate: (element: EnhancedShapeElement) => void }> = ({
  element,
  onUpdate
}) => {
  const updateElement = (updates: Partial<EnhancedShapeElement>) => {
    onUpdate({ ...element, ...updates });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Shape Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="shape" className="text-xs">Shape</Label>
            <Select
              value={element.shape}
              onValueChange={(value) => updateElement({ shape: value as any })}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangle">Rectangle</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="ellipse">Ellipse</SelectItem>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="path">Path</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fill" className="text-xs">Fill Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="fill"
                type="color"
                value={element.fill || '#000000'}
                onChange={(e) => updateElement({ fill: e.target.value })}
                className="w-12 h-8 p-1"
              />
              <Input
                value={element.fill || '#000000'}
                onChange={(e) => updateElement({ fill: e.target.value })}
                className="text-xs flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="stroke" className="text-xs">Stroke Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="stroke"
                type="color"
                value={element.stroke || '#000000'}
                onChange={(e) => updateElement({ stroke: e.target.value })}
                className="w-12 h-8 p-1"
              />
              <Input
                value={element.stroke || '#000000'}
                onChange={(e) => updateElement({ stroke: e.target.value })}
                className="text-xs flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="strokeWidth" className="text-xs">Stroke Width</Label>
            <Input
              id="strokeWidth"
              type="number"
              value={element.strokeWidth || 1}
              onChange={(e) => updateElement({ strokeWidth: parseFloat(e.target.value) || 1 })}
              className="text-xs"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Table Style Inspector
const TableStyleInspector: React.FC<{ element: EnhancedTableElement; onUpdate: (element: EnhancedTableElement) => void }> = ({
  element,
  onUpdate
}) => {
  const updateElement = (updates: Partial<EnhancedTableElement>) => {
    onUpdate({ ...element, ...updates });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Table Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="dataSource" className="text-xs">Data Source</Label>
            <Input
              id="dataSource"
              value={element.dataSource}
              onChange={(e) => updateElement({ dataSource: e.target.value })}
              placeholder="e.g., items"
              className="text-xs"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showHeader" className="text-xs">Show Header</Label>
            <Switch
              id="showHeader"
              checked={element.showHeader || false}
              onCheckedChange={(checked) => updateElement({ showHeader: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showBorders" className="text-xs">Show Borders</Label>
            <Switch
              id="showBorders"
              checked={element.showBorders || false}
              onCheckedChange={(checked) => updateElement({ showBorders: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

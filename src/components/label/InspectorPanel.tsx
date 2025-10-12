/**
 * Inspector panel for label editor element properties
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Type, 
  Image, 
  BarChart3, 
  QrCode, 
  Square, 
  Table,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';
import { EnhancedLabelElement, EnhancedTextElement, EnhancedBarcodeElement, EnhancedQRElement } from '@/lib/label-model';
import { textStyleManager } from '@/lib/textStyles';
import { validateEAN13 } from '@/lib/render/barcode';
import { toPx, fromPx } from '@/lib/units';

interface InspectorPanelProps {
  selectedElement: EnhancedLabelElement | null;
  onElementUpdate: (updates: Partial<EnhancedLabelElement>) => void;
  templateUnit: 'mm' | 'px' | 'in';
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedElement,
  onElementUpdate,
  templateUnit
}) => {
  const [localElement, setLocalElement] = useState<EnhancedLabelElement | null>(null);
  const [barcodeError, setBarcodeError] = useState<string>('');

  useEffect(() => {
    setLocalElement(selectedElement);
    setBarcodeError('');
  }, [selectedElement]);

  if (!localElement) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <Type className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Select an element to edit properties</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleUpdate = (updates: Partial<EnhancedLabelElement>) => {
    const newElement = { ...localElement, ...updates };
    setLocalElement(newElement);
    onElementUpdate(updates);
  };

  const handleTextStylePreset = (presetId: string) => {
    if (localElement.type !== 'text') return;
    const preset = textStyleManager.getPreset(presetId);
    if (preset) {
      handleUpdate(preset.style);
    }
  };

  const handleBarcodeValidation = (value: string, symbology: string) => {
    if (symbology === 'ean13') {
      if (value && !validateEAN13(value)) {
        setBarcodeError('Invalid EAN-13 checksum');
      } else {
        setBarcodeError('');
      }
    } else {
      setBarcodeError('');
    }
  };

  const formatValue = (value: number, unit: string) => {
    return Math.round(value * 100) / 100;
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'barcode': return <BarChart3 className="h-4 w-4" />;
      case 'qr': return <QrCode className="h-4 w-4" />;
      case 'shape': return <Square className="h-4 w-4" />;
      case 'table': return <Table className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getElementIcon(localElement.type)}
          {localElement.name || `${localElement.type} Element`}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {localElement.type}
          </Badge>
          {localElement.locked && (
            <Badge variant="destructive" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs defaultValue="position" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="position" className="text-xs">Position</TabsTrigger>
            <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
            <TabsTrigger value="data" className="text-xs">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="position" className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">X ({templateUnit})</Label>
                <Input
                  type="number"
                  value={formatValue(localElement.x, templateUnit)}
                  onChange={(e) => handleUpdate({ x: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-xs"
                  step="0.1"
                />
              </div>
              <div>
                <Label className="text-xs">Y ({templateUnit})</Label>
                <Input
                  type="number"
                  value={formatValue(localElement.y, templateUnit)}
                  onChange={(e) => handleUpdate({ y: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-xs"
                  step="0.1"
                />
              </div>
              <div>
                <Label className="text-xs">Width ({templateUnit})</Label>
                <Input
                  type="number"
                  value={formatValue(localElement.w, templateUnit)}
                  onChange={(e) => handleUpdate({ w: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-xs"
                  step="0.1"
                />
              </div>
              <div>
                <Label className="text-xs">Height ({templateUnit})</Label>
                <Input
                  type="number"
                  value={formatValue(localElement.h, templateUnit)}
                  onChange={(e) => handleUpdate({ h: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-xs"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Rotation (°)</Label>
              <Input
                type="number"
                value={localElement.rotation || 0}
                onChange={(e) => handleUpdate({ rotation: parseFloat(e.target.value) || 0 })}
                className="h-8 text-xs"
                step="1"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Visible</Label>
                <Switch
                  checked={localElement.visible !== false}
                  onCheckedChange={(checked) => handleUpdate({ visible: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Locked</Label>
                <Switch
                  checked={!!localElement.locked}
                  onCheckedChange={(checked) => handleUpdate({ locked: checked })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style" className="p-4 space-y-4">
            {localElement.type === 'text' && (
              <>
                <div>
                  <Label className="text-xs">Text Style Preset</Label>
                  <Select onValueChange={handleTextStylePreset}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Choose preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {textStyleManager.getAllPresets().map(preset => (
                        <SelectItem key={preset.id} value={preset.id} className="text-xs">
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Content</Label>
                  <Input
                    value={(localElement as EnhancedTextElement).content || ''}
                    onChange={(e) => handleUpdate({ content: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="Enter text content"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Font Family</Label>
                    <Select
                      value={(localElement as EnhancedTextElement).fontFamily || 'Arial'}
                      onValueChange={(value) => handleUpdate({ fontFamily: value })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial" className="text-xs">Arial</SelectItem>
                        <SelectItem value="Helvetica" className="text-xs">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman" className="text-xs">Times New Roman</SelectItem>
                        <SelectItem value="Courier New" className="text-xs">Courier New</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Font Size (mm)</Label>
                    <Input
                      type="number"
                      value={(localElement as EnhancedTextElement).fontSize || 10}
                      onChange={(e) => handleUpdate({ fontSize: parseFloat(e.target.value) || 10 })}
                      className="h-8 text-xs"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Font Weight</Label>
                    <Select
                      value={(localElement as EnhancedTextElement).fontWeight || 'normal'}
                      onValueChange={(value) => handleUpdate({ fontWeight: value })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                        <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                        <SelectItem value="100" className="text-xs">100</SelectItem>
                        <SelectItem value="200" className="text-xs">200</SelectItem>
                        <SelectItem value="300" className="text-xs">300</SelectItem>
                        <SelectItem value="400" className="text-xs">400</SelectItem>
                        <SelectItem value="500" className="text-xs">500</SelectItem>
                        <SelectItem value="600" className="text-xs">600</SelectItem>
                        <SelectItem value="700" className="text-xs">700</SelectItem>
                        <SelectItem value="800" className="text-xs">800</SelectItem>
                        <SelectItem value="900" className="text-xs">900</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Text Align</Label>
                    <Select
                      value={(localElement as EnhancedTextElement).textAlign || 'left'}
                      onValueChange={(value) => handleUpdate({ textAlign: value as any })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left" className="text-xs">Left</SelectItem>
                        <SelectItem value="center" className="text-xs">Center</SelectItem>
                        <SelectItem value="right" className="text-xs">Right</SelectItem>
                        <SelectItem value="justify" className="text-xs">Justify</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Color</Label>
                  <Input
                    type="color"
                    value={(localElement as EnhancedTextElement).color || '#000000'}
                    onChange={(e) => handleUpdate({ color: e.target.value })}
                    className="h-8 w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">RTL (Right-to-Left)</Label>
                  <Switch
                    checked={!!(localElement as EnhancedTextElement).rtl}
                    onCheckedChange={(checked) => handleUpdate({ rtl: checked })}
                  />
                </div>
              </>
            )}

            {localElement.type === 'barcode' && (
              <>
                <div>
                  <Label className="text-xs">Symbology</Label>
                  <Select
                    value={(localElement as EnhancedBarcodeElement).symbology || 'code128'}
                    onValueChange={(value) => handleUpdate({ symbology: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code128" className="text-xs">Code 128</SelectItem>
                      <SelectItem value="ean13" className="text-xs">EAN-13</SelectItem>
                      <SelectItem value="gs1-128" className="text-xs">GS1-128</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={(localElement as EnhancedBarcodeElement).value || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleUpdate({ value });
                      handleBarcodeValidation(value, (localElement as EnhancedBarcodeElement).symbology || 'code128');
                    }}
                    className="h-8 text-xs"
                    placeholder="Enter barcode value"
                  />
                  {barcodeError && (
                    <p className="text-xs text-red-500 mt-1">{barcodeError}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Display Value</Label>
                  <Switch
                    checked={!!(localElement as EnhancedBarcodeElement).displayValue}
                    onCheckedChange={(checked) => handleUpdate({ displayValue: checked })}
                  />
                </div>
              </>
            )}

            {localElement.type === 'qr' && (
              <>
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={(localElement as EnhancedQRElement).value || ''}
                    onChange={(e) => handleUpdate({ value: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="Enter QR code value"
                  />
                </div>

                <div>
                  <Label className="text-xs">Error Correction</Label>
                  <Select
                    value={(localElement as EnhancedQRElement).ecc || 'M'}
                    onValueChange={(value) => handleUpdate({ ecc: value as any })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L" className="text-xs">L (Low ~7%)</SelectItem>
                      <SelectItem value="M" className="text-xs">M (Medium ~15%)</SelectItem>
                      <SelectItem value="Q" className="text-xs">Q (Quartile ~25%)</SelectItem>
                      <SelectItem value="H" className="text-xs">H (High ~30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="data" className="p-4 space-y-4">
            <div>
              <Label className="text-xs">Element Name</Label>
              <Input
                value={localElement.name || ''}
                onChange={(e) => handleUpdate({ name: e.target.value })}
                className="h-8 text-xs"
                placeholder="Enter element name"
              />
            </div>

            <div>
              <Label className="text-xs">Data Binding</Label>
              <Input
                value={localElement.dataBinding?.field || ''}
                onChange={(e) => handleUpdate({ 
                  dataBinding: { 
                    ...localElement.dataBinding, 
                    field: e.target.value 
                  } 
                })}
                className="h-8 text-xs"
                placeholder="e.g., {{productName}}"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Z-Index</Label>
              <Input
                type="number"
                value={localElement.zIndex || 0}
                onChange={(e) => handleUpdate({ zIndex: parseInt(e.target.value) || 0 })}
                className="h-8 w-20 text-xs"
                step="1"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Opacity</Label>
              <Input
                type="number"
                value={Math.round((localElement.opacity || 1) * 100)}
                onChange={(e) => handleUpdate({ opacity: (parseInt(e.target.value) || 100) / 100 })}
                className="h-8 w-20 text-xs"
                step="1"
                min="0"
                max="100"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

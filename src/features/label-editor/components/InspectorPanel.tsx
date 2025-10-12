/**
 * Inspector Panel component for the Label Editor
 * Provides detailed property editing for selected elements
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  RotateCw,
  Palette,
  Eye,
  Lock,
  Unlock,
  Copy,
  Trash2
} from 'lucide-react';
import { LabelElement, ElementStyle, DEFAULT_FONT_FAMILIES, BARCODE_TYPES, QR_ERROR_CORRECTION_LEVELS } from '../types';
import { mmToPx, pxToMm, formatWithUnit, getDisplayUnit } from '../utils/unitConversion';

interface InspectorPanelProps {
  selectedElement: LabelElement | null;
  onElementUpdate: (element: LabelElement) => void;
  onDuplicateElement: (elementId: string) => void;
  onDeleteElement: (elementId: string) => void;
  className?: string;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedElement,
  onElementUpdate,
  onDuplicateElement,
  onDeleteElement,
  className = '',
}) => {
  const [localElement, setLocalElement] = useState<LabelElement | null>(null);

  useEffect(() => {
    setLocalElement(selectedElement);
  }, [selectedElement]);

  if (!localElement) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-sm text-gray-500">Select an element to edit its properties</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const updateElement = (updates: Partial<LabelElement>) => {
    const updatedElement = { ...localElement, ...updates };
    setLocalElement(updatedElement);
    onElementUpdate(updatedElement);
  };

  const updateStyle = (styleUpdates: Partial<ElementStyle>) => {
    updateElement({
      style: { ...localElement.style, ...styleUpdates }
    });
  };

  const handlePositionChange = (field: 'x' | 'y', value: string) => {
    const numValue = parseFloat(value) || 0;
    updateElement({ [field]: numValue });
  };

  const handleSizeChange = (field: 'width' | 'height', value: string) => {
    const numValue = parseFloat(value) || 0;
    updateElement({ [field]: numValue });
  };

  const handleRotationChange = (value: number) => {
    updateElement({ rotation: value });
  };

  const handleContentChange = (value: string) => {
    updateElement({ content: value });
  };

  const handleFontSizeChange = (value: string) => {
    const numValue = parseFloat(value) || 12;
    updateStyle({ fontSize: numValue });
  };

  const handleColorChange = (field: 'color' | 'backgroundColor' | 'borderColor', value: string) => {
    updateStyle({ [field]: value });
  };

  const handleBorderWidthChange = (value: number) => {
    updateStyle({ borderWidth: value });
  };

  const handleBorderRadiusChange = (value: number) => {
    updateStyle({ borderRadius: value });
  };

  const handleOpacityChange = (value: number) => {
    updateStyle({ opacity: value / 100 });
  };

  const handleTextAlignChange = (value: 'left' | 'center' | 'right' | 'justify') => {
    updateStyle({ textAlign: value });
  };

  const handleFontWeightChange = (value: string) => {
    updateStyle({ fontWeight: value as any });
  };

  const handleFontStyleChange = (value: string) => {
    updateStyle({ fontStyle: value as any });
  };

  const handleTextDecorationChange = (value: string) => {
    updateStyle({ textDecoration: value as any });
  };

  const handleDirectionChange = (value: 'ltr' | 'rtl') => {
    updateStyle({ direction: value });
  };

  const handleBarcodeTypeChange = (value: string) => {
    updateStyle({ barcodeType: value as any });
  };

  const handleQRCorrectionChange = (value: string) => {
    updateStyle({ errorCorrectionLevel: value as any });
  };

  const handleQuietZoneChange = (value: number) => {
    updateStyle({ quietZone: value });
  };

  const handleScaleChange = (value: number) => {
    updateStyle({ scale: value });
  };

  const handleCellPaddingChange = (value: number) => {
    updateStyle({ cellPadding: value });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Element Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            Properties
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDuplicateElement(localElement.id)}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteElement(localElement.id)}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{localElement.type}</Badge>
              <Badge variant="secondary">
                {localElement.visible ? 'Visible' : 'Hidden'}
              </Badge>
              <Badge variant="secondary">
                {localElement.locked ? 'Locked' : 'Unlocked'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="position" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="position">Position</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Position Tab */}
        <TabsContent value="position" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Position & Size</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">X Position</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={localElement.x}
                      onChange={(e) => handlePositionChange('x', e.target.value)}
                      className="h-8 text-xs"
                      step="0.1"
                    />
                    <Badge variant="outline" className="text-xs">mm</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Y Position</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={localElement.y}
                      onChange={(e) => handlePositionChange('y', e.target.value)}
                      className="h-8 text-xs"
                      step="0.1"
                    />
                    <Badge variant="outline" className="text-xs">mm</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Width</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={localElement.width}
                      onChange={(e) => handleSizeChange('width', e.target.value)}
                      className="h-8 text-xs"
                      step="0.1"
                      min="0.1"
                    />
                    <Badge variant="outline" className="text-xs">mm</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Height</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={localElement.height}
                      onChange={(e) => handleSizeChange('height', e.target.value)}
                      className="h-8 text-xs"
                      step="0.1"
                      min="0.1"
                    />
                    <Badge variant="outline" className="text-xs">mm</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Rotation</Label>
                <div className="space-y-2">
                  <Slider
                    value={[localElement.rotation]}
                    onValueChange={(value) => handleRotationChange(value[0])}
                    min={-180}
                    max={180}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>-180°</span>
                    <span className="font-medium">{localElement.rotation}°</span>
                    <span>180°</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Colors & Effects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Text Color */}
              {localElement.type === 'text' && (
                <div className="space-y-2">
                  <Label className="text-xs">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={localElement.style.color || '#000000'}
                      onChange={(e) => handleColorChange('color', e.target.value)}
                      className="h-8 w-16"
                    />
                    <Input
                      value={localElement.style.color || '#000000'}
                      onChange={(e) => handleColorChange('color', e.target.value)}
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                </div>
              )}

              {/* Background Color */}
              {(localElement.type === 'shape' || localElement.type === 'table') && (
                <div className="space-y-2">
                  <Label className="text-xs">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={localElement.style.backgroundColor || '#ffffff'}
                      onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                      className="h-8 w-16"
                    />
                    <Input
                      value={localElement.style.backgroundColor || '#ffffff'}
                      onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                </div>
              )}

              {/* Border */}
              {(localElement.type === 'shape' || localElement.type === 'table') && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">Border Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={localElement.style.borderColor || '#000000'}
                        onChange={(e) => handleColorChange('borderColor', e.target.value)}
                        className="h-8 w-16"
                      />
                      <Input
                        value={localElement.style.borderColor || '#000000'}
                        onChange={(e) => handleColorChange('borderColor', e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Border Width</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[localElement.style.borderWidth || 0]}
                        onValueChange={(value) => handleBorderWidthChange(value[0])}
                        min={0}
                        max={5}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="text-xs text-center text-gray-600">
                        {formatWithUnit(localElement.style.borderWidth || 0, 'mm')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Border Radius</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[localElement.style.borderRadius || 0]}
                        onValueChange={(value) => handleBorderRadiusChange(value[0])}
                        min={0}
                        max={10}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="text-xs text-center text-gray-600">
                        {formatWithUnit(localElement.style.borderRadius || 0, 'mm')}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Opacity */}
              <div className="space-y-2">
                <Label className="text-xs">Opacity</Label>
                <div className="space-y-2">
                  <Slider
                    value={[(localElement.style.opacity || 1) * 100]}
                    onValueChange={(value) => handleOpacityChange(value[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-center text-gray-600">
                    {Math.round((localElement.style.opacity || 1) * 100)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Text Tab */}
        <TabsContent value="text" className="space-y-4">
          {localElement.type === 'text' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-xs">Text Content</Label>
                    <Input
                      value={localElement.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="h-8 text-xs"
                      placeholder="Enter text content"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Typography</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Font Size</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={localElement.style.fontSize || 12}
                          onChange={(e) => handleFontSizeChange(e.target.value)}
                          className="h-8 text-xs"
                          step="0.1"
                          min="1"
                        />
                        <Badge variant="outline" className="text-xs">pt</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Font Family</Label>
                      <Select
                        value={localElement.style.fontFamily || 'Arial'}
                        onValueChange={(value) => updateStyle({ fontFamily: value })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DEFAULT_FONT_FAMILIES.map(font => (
                            <SelectItem key={font} value={font}>
                              {font}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Font Weight</Label>
                    <Select
                      value={localElement.style.fontWeight || 'normal'}
                      onValueChange={handleFontWeightChange}
                    >
                      <SelectTrigger className="h-8 text-xs">
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

                  <div className="space-y-2">
                    <Label className="text-xs">Font Style</Label>
                    <Select
                      value={localElement.style.fontStyle || 'normal'}
                      onValueChange={handleFontStyleChange}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="italic">Italic</SelectItem>
                        <SelectItem value="oblique">Oblique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Text Decoration</Label>
                    <Select
                      value={localElement.style.textDecoration || 'none'}
                      onValueChange={handleTextDecorationChange}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="underline">Underline</SelectItem>
                        <SelectItem value="line-through">Line Through</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Text Alignment</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={localElement.style.textAlign === 'left' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleTextAlignChange('left')}
                        className="justify-start"
                      >
                        <AlignLeft className="h-3 w-3 mr-2" />
                        Left
                      </Button>
                      <Button
                        variant={localElement.style.textAlign === 'center' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleTextAlignChange('center')}
                        className="justify-start"
                      >
                        <AlignCenter className="h-3 w-3 mr-2" />
                        Center
                      </Button>
                      <Button
                        variant={localElement.style.textAlign === 'right' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleTextAlignChange('right')}
                        className="justify-start"
                      >
                        <AlignRight className="h-3 w-3 mr-2" />
                        Right
                      </Button>
                      <Button
                        variant={localElement.style.textAlign === 'justify' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleTextAlignChange('justify')}
                        className="justify-start"
                      >
                        <AlignJustify className="h-3 w-3 mr-2" />
                        Justify
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Text Direction</Label>
                    <Select
                      value={localElement.style.direction || 'ltr'}
                      onValueChange={handleDirectionChange}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ltr">Left to Right</SelectItem>
                        <SelectItem value="rtl">Right to Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          {/* Barcode Settings */}
          {localElement.type === 'barcode' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Barcode Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Barcode Type</Label>
                  <Select
                    value={localElement.style.barcodeType || 'code128'}
                    onValueChange={handleBarcodeTypeChange}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BARCODE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Quiet Zone</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[localElement.style.quietZone || 0]}
                      onValueChange={(value) => handleQuietZoneChange(value[0])}
                      min={0}
                      max={5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="text-xs text-center text-gray-600">
                      {formatWithUnit(localElement.style.quietZone || 0, 'mm')}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Scale</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[localElement.style.scale || 1]}
                      onValueChange={(value) => handleScaleChange(value[0])}
                      min={0.1}
                      max={5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="text-xs text-center text-gray-600">
                      {localElement.style.scale || 1}x
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code Settings */}
          {localElement.type === 'qr' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">QR Code Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Error Correction Level</Label>
                  <Select
                    value={localElement.style.errorCorrectionLevel || 'M'}
                    onValueChange={handleQRCorrectionChange}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QR_ERROR_CORRECTION_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Quiet Zone</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[localElement.style.quietZone || 0]}
                      onValueChange={(value) => handleQuietZoneChange(value[0])}
                      min={0}
                      max={5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="text-xs text-center text-gray-600">
                      {formatWithUnit(localElement.style.quietZone || 0, 'mm')}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Scale</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[localElement.style.scale || 1]}
                      onValueChange={(value) => handleScaleChange(value[0])}
                      min={0.1}
                      max={5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="text-xs text-center text-gray-600">
                      {localElement.style.scale || 1}x
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table Settings */}
          {localElement.type === 'table' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Table Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Cell Padding</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[localElement.style.cellPadding || 1]}
                      onValueChange={(value) => handleCellPaddingChange(value[0])}
                      min={0}
                      max={5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="text-xs text-center text-gray-600">
                      {formatWithUnit(localElement.style.cellPadding || 1, 'mm')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

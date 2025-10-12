import React, { useState, useEffect, useRef } from 'react';
import { LabelTemplate, LabelElement, TextStyle, Unit, Dpi } from '@/lib/label-model';
import { labelTemplateService } from '@/services/labelTemplateService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Download, 
  Upload, 
  Copy, 
  Trash2, 
  Plus, 
  Settings, 
  Type, 
  Image, 
  QrCode, 
  BarChart3,
  Square,
  Table,
  Eye,
  Edit3
} from 'lucide-react';

interface LabelEditorProps {
  templateId?: string;
  onSave?: (template: LabelTemplate) => void;
  onClose?: () => void;
}

export const LabelEditor: React.FC<LabelEditorProps> = ({
  templateId,
  onSave,
  onClose
}) => {
  const [template, setTemplate] = useState<LabelTemplate | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load template on mount
  useEffect(() => {
    if (templateId) {
      const loadedTemplate = labelTemplateService.getTemplate(templateId);
      if (loadedTemplate) {
        setTemplate(loadedTemplate);
      }
    } else {
      // Create new template
      const newTemplate = labelTemplateService.createTemplate('New Label Template');
      setTemplate(newTemplate);
    }
  }, [templateId]);

  // Save template
  const handleSave = () => {
    if (!template) return;
    
    try {
      labelTemplateService.saveTemplate(template);
      onSave?.(template);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  // Add new element
  const addElement = (type: LabelElement['type']) => {
    if (!template) return;

    const newElement: LabelElement = {
      id: `${type}_${Date.now()}`,
      type,
      x: 10,
      y: 10,
      w: 50,
      h: 20,
      ...(type === 'text' && { content: 'New Text', styleKey: 'default' }),
      ...(type === 'barcode' && { symbology: 'code128', value: '{{barcode}}' }),
      ...(type === 'qr' && { value: '{{qrCode}}', ecc: 'M' }),
      ...(type === 'image' && { src: '', alt: 'Image' }),
      ...(type === 'shape' && { shape: 'rectangle', fill: '#000000' }),
      ...(type === 'table' && { 
        dataSource: 'items', 
        columns: [{ header: 'Name', field: 'name', width: 30 }] 
      })
    };

    setTemplate({
      ...template,
      elements: [...template.elements, newElement]
    });
  };

  // Update element
  const updateElement = (elementId: string, updates: Partial<LabelElement>) => {
    if (!template) return;

    setTemplate({
      ...template,
      elements: template.elements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      )
    });
  };

  // Delete element
  const deleteElement = (elementId: string) => {
    if (!template) return;

    setTemplate({
      ...template,
      elements: template.elements.filter(el => el.id !== elementId)
    });
    setSelectedElement(null);
  };

  // Update template size
  const updateSize = (field: 'width' | 'height' | 'unit' | 'dpi', value: any) => {
    if (!template) return;

    setTemplate({
      ...template,
      size: {
        ...template.size,
        [field]: value
      }
    });
  };

  // Render canvas
  const renderCanvas = () => {
    if (!template || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size based on template
    const pixelSize = {
      width: (template.size.width * template.size.dpi) / 25.4, // mm to pixels
      height: (template.size.height * template.size.dpi) / 25.4
    };

    canvas.width = pixelSize.width;
    canvas.height = pixelSize.height;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw elements
    template.elements.forEach(element => {
      drawElement(ctx, element, template.size.dpi);
    });
  };

  // Draw individual element
  const drawElement = (ctx: CanvasRenderingContext2D, element: LabelElement, dpi: Dpi) => {
    const scale = dpi / 25.4; // mm to pixels
    const x = element.x * scale;
    const y = element.y * scale;
    const w = element.w * scale;
    const h = element.h * scale;

    ctx.save();

    if (element.rotation) {
      ctx.translate(x + w/2, y + h/2);
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.translate(-w/2, -h/2);
    }

    switch (element.type) {
      case 'text':
        drawTextElement(ctx, element, x, y, w, h);
        break;
      case 'barcode':
        drawBarcodeElement(ctx, element, x, y, w, h);
        break;
      case 'qr':
        drawQRElement(ctx, element, x, y, w, h);
        break;
      case 'image':
        drawImageElement(ctx, element, x, y, w, h);
        break;
      case 'shape':
        drawShapeElement(ctx, element, x, y, w, h);
        break;
      case 'table':
        drawTableElement(ctx, element, x, y, w, h);
        break;
    }

    ctx.restore();
  };

  const drawTextElement = (ctx: CanvasRenderingContext2D, element: any, x: number, y: number, w: number, h: number) => {
    const style = template?.styles?.[element.styleKey || 'default'] || {};
    
    ctx.font = `${style.fontWeight || 'normal'} ${style.fontSize || 12}px ${style.fontFamily || 'Arial'}`;
    ctx.fillStyle = style.color || '#000000';
    ctx.textAlign = style.textAlign || 'left';
    ctx.textBaseline = 'top';

    // Handle RTL
    if (element.rtl) {
      ctx.direction = 'rtl';
    }

    ctx.fillText(element.content, x, y);
  };

  const drawBarcodeElement = (ctx: CanvasRenderingContext2D, element: any, x: number, y: number, w: number, h: number) => {
    // Simple barcode representation
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, w, h * 0.8);
    
    if (element.options?.showText) {
      ctx.font = '10px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(element.value, x + w/2, y + h - 5);
    }
  };

  const drawQRElement = (ctx: CanvasRenderingContext2D, element: any, x: number, y: number, w: number, h: number) => {
    // Simple QR code representation
    const size = Math.min(w, h);
    const cellSize = size / 25; // 25x25 grid
    
    ctx.fillStyle = '#000000';
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(x + i * cellSize, y + j * cellSize, cellSize, cellSize);
        }
      }
    }
  };

  const drawImageElement = (ctx: CanvasRenderingContext2D, element: any, x: number, y: number, w: number, h: number) => {
    if (!element.src) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, x, y, w, h);
    };
    img.src = element.src;
  };

  const drawShapeElement = (ctx: CanvasRenderingContext2D, element: any, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = element.fill || '#000000';
    ctx.strokeStyle = element.stroke || '#000000';
    ctx.lineWidth = element.strokeWidth || 1;

    switch (element.shape) {
      case 'rectangle':
        ctx.fillRect(x, y, w, h);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(x + w/2, y + h/2, Math.min(w, h)/2, 0, 2 * Math.PI);
        ctx.fill();
        break;
      case 'line':
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.stroke();
        break;
    }
  };

  const drawTableElement = (ctx: CanvasRenderingContext2D, element: any, x: number, y: number, w: number, h: number) => {
    const rowHeight = element.rowHeight || 20;
    const colWidths = element.columns.map((col: any) => col.width);
    const totalWidth = colWidths.reduce((sum: number, width: number) => sum + width, 0);
    
    // Draw table grid
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    
    let currentX = x;
    element.columns.forEach((col: any, index: number) => {
      ctx.strokeRect(currentX, y, colWidths[index], rowHeight);
      currentX += colWidths[index];
    });
  };

  // Re-render canvas when template changes
  useEffect(() => {
    renderCanvas();
  }, [template]);

  if (!template) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Tools */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Label Editor</h2>
          <p className="text-sm text-gray-600">{template.name}</p>
        </div>

        <Tabs defaultValue="elements" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="elements">Elements</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
          </TabsList>

          <TabsContent value="elements" className="p-4 space-y-4">
            <div>
              <h3 className="font-medium mb-3">Add Elements</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addElement('text')}
                  className="flex items-center gap-2"
                >
                  <Type className="h-4 w-4" />
                  Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addElement('image')}
                  className="flex items-center gap-2"
                >
                  <Image className="h-4 w-4" />
                  Image
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addElement('barcode')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Barcode
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addElement('qr')}
                  className="flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  QR Code
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addElement('shape')}
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Shape
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addElement('table')}
                  className="flex items-center gap-2"
                >
                  <Table className="h-4 w-4" />
                  Table
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-3">Elements ({template.elements.length})</h3>
              <div className="space-y-2">
                {template.elements.map((element) => (
                  <div
                    key={element.id}
                    className={`p-2 border rounded cursor-pointer ${
                      selectedElement === element.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedElement(element.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {element.type}
                        </Badge>
                        <span className="text-sm">
                          {element.type === 'text' ? element.content : element.id}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(element.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="properties" className="p-4 space-y-4">
            <div>
              <h3 className="font-medium mb-3">Template Size</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="width">Width</Label>
                    <Input
                      id="width"
                      type="number"
                      value={template.size.width}
                      onChange={(e) => updateSize('width', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      type="number"
                      value={template.size.height}
                      onChange={(e) => updateSize('height', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={template.size.unit}
                      onValueChange={(value: Unit) => updateSize('unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mm">mm</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dpi">DPI</Label>
                    <Select
                      value={template.size.dpi.toString()}
                      onValueChange={(value) => updateSize('dpi', parseInt(value) as Dpi)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="203">203</SelectItem>
                        <SelectItem value="300">300</SelectItem>
                        <SelectItem value="600">600</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {selectedElement && (
              <div>
                <h3 className="font-medium mb-3">Element Properties</h3>
                <ElementProperties
                  element={template.elements.find(el => el.id === selectedElement)!}
                  onUpdate={(updates) => updateElement(selectedElement, updates)}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Center - Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {template.size.width}×{template.size.height} {template.size.unit}
            </Badge>
            <Badge variant="outline">
              {template.size.dpi} DPI
            </Badge>
          </div>
        </div>

        <div className="flex-1 p-4 flex items-center justify-center bg-gray-100">
          <div className="bg-white border border-gray-300 shadow-lg">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Element Properties Component
interface ElementPropertiesProps {
  element: LabelElement;
  onUpdate: (updates: Partial<LabelElement>) => void;
}

const ElementProperties: React.FC<ElementPropertiesProps> = ({ element, onUpdate }) => {
  const updateField = (field: string, value: any) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="x">X Position</Label>
          <Input
            id="x"
            type="number"
            value={element.x}
            onChange={(e) => updateField('x', parseFloat(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="y">Y Position</Label>
          <Input
            id="y"
            type="number"
            value={element.y}
            onChange={(e) => updateField('y', parseFloat(e.target.value))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="w">Width</Label>
          <Input
            id="w"
            type="number"
            value={element.w}
            onChange={(e) => updateField('w', parseFloat(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="h">Height</Label>
          <Input
            id="h"
            type="number"
            value={element.h}
            onChange={(e) => updateField('h', parseFloat(e.target.value))}
          />
        </div>
      </div>

      {element.type === 'text' && (
        <div>
          <Label htmlFor="content">Content</Label>
          <Input
            id="content"
            value={element.content}
            onChange={(e) => updateField('content', e.target.value)}
            placeholder="Enter text or use {{variable}}"
          />
        </div>
      )}

      {element.type === 'barcode' && (
        <div>
          <Label htmlFor="value">Value</Label>
          <Input
            id="value"
            value={element.value}
            onChange={(e) => updateField('value', e.target.value)}
            placeholder="Enter value or use {{variable}}"
          />
        </div>
      )}

      {element.type === 'qr' && (
        <div>
          <Label htmlFor="value">Value</Label>
          <Input
            id="value"
            value={element.value}
            onChange={(e) => updateField('value', e.target.value)}
            placeholder="Enter value or use {{variable}}"
          />
        </div>
      )}
    </div>
  );
};

export default LabelEditor;
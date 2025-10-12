import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Type, 
  Image, 
  Square, 
  Circle, 
  Move, 
  RotateCw, 
  Palette, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Bold,
  Italic,
  Underline,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Save,
  Download,
  Upload,
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Grid,
  Minus,
  Plus,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Maximize,
  Minimize,
  MousePointer,
  Hand,
  Zap,
  Star,
  Heart,
  Triangle,
  Hexagon
} from 'lucide-react';
import { toast } from 'sonner';

interface LabelElement {
  id: string;
  type: 'text' | 'image' | 'qr' | 'barcode' | 'shape' | 'line' | 'gradient';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content: string;
  style: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
    textAlign?: 'left' | 'center' | 'right';
    gradient?: {
      type: 'linear' | 'radial';
      colors: string[];
      direction?: number;
    };
    shadow?: {
      offsetX: number;
      offsetY: number;
      blur: number;
      color: string;
    };
    pattern?: 'solid' | 'dots' | 'stripes' | 'grid';
  };
  visible: boolean;
  locked: boolean;
  zIndex: number;
  flippedH?: boolean;
  flippedV?: boolean;
  groupId?: string;
}

interface AdvancedLabelEditorProps {
  sample?: any;
  onSave: (labelData: any) => void;
  onCancel: () => void;
}

export const AdvancedLabelEditor: React.FC<AdvancedLabelEditorProps> = ({
  sample,
  onSave,
  onCancel
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<LabelElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [gridVisible, setGridVisible] = useState(true);
  const [labelSize, setLabelSize] = useState({ width: 200, height: 120 }); // 50mm x 30mm at 96 DPI
  const [history, setHistory] = useState<LabelElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Canvas dimensions (50mm x 30mm at 96 DPI ≈ 189x113 pixels)
  const CANVAS_WIDTH = 200;
  const CANVAS_HEIGHT = 120;

  useEffect(() => {
    if (sample) {
      // Initialize with sample data
      const initialElements: LabelElement[] = [
        {
          id: 'sample-name-ar',
          type: 'text',
          x: 10,
          y: 10,
          width: 180,
          height: 20,
          rotation: 0,
          content: sample.itemNameAR || 'اسم العينة',
          style: {
            fontSize: 12,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#000000',
            textAlign: 'right'
          },
          visible: true,
          locked: false,
          zIndex: 1
        },
        {
          id: 'sample-name-en',
          type: 'text',
          x: 10,
          y: 35,
          width: 120,
          height: 16,
          rotation: 0,
          content: sample.itemNameEN || 'Sample Name',
          style: {
            fontSize: 10,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            color: '#333333',
            textAlign: 'left'
          },
          visible: true,
          locked: false,
          zIndex: 2
        },
        {
          id: 'sample-id',
          type: 'text',
          x: 10,
          y: 55,
          width: 80,
          height: 14,
          rotation: 0,
          content: sample.customIdNo || sample.sampleId || 'ID',
          style: {
            fontSize: 8,
            fontFamily: 'Courier New',
            fontWeight: 'bold',
            color: '#000000',
            textAlign: 'left'
          },
          visible: true,
          locked: false,
          zIndex: 3
        },
        {
          id: 'qr-code',
          type: 'qr',
          x: 140,
          y: 35,
          width: 50,
          height: 50,
          rotation: 0,
          content: `Sample: ${sample.customIdNo || sample.sampleId}\nLocation: ${sample.storageLocation?.rackArea || 'N/A'}\nDate: ${new Date().toLocaleDateString()}`,
          style: {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#CCCCCC'
          },
          visible: true,
          locked: false,
          zIndex: 4
        }
      ];
      setElements(initialElements);
      addToHistory(initialElements);
    }
  }, [sample]);

  const addToHistory = (newElements: LabelElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newElements)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  const addTextElement = () => {
    const newElement: LabelElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: 20,
      y: 20,
      width: 100,
      height: 20,
      rotation: 0,
      content: 'New Text',
      style: {
        fontSize: 12,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left'
      },
      visible: true,
      locked: false,
      zIndex: elements.length + 1
    };
    
    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedElement(newElement.id);
    addToHistory(newElements);
  };

  const addQRCode = () => {
    const qrContent = sample ? 
      `Sample: ${sample.customIdNo || sample.sampleId}\nLocation: ${sample.storageLocation?.rackArea || 'N/A'}\nDate: ${new Date().toLocaleDateString()}` :
      'QR Code Content';
      
    const newElement: LabelElement = {
      id: `qr-${Date.now()}`,
      type: 'qr',
      x: 150,
      y: 20,
      width: 40,
      height: 40,
      rotation: 0,
      content: qrContent,
      style: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#000000'
      },
      visible: true,
      locked: false,
      zIndex: elements.length + 1
    };
    
    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedElement(newElement.id);
    addToHistory(newElements);
  };

  const addShape = (shapeType: 'rectangle' | 'circle') => {
    const newElement: LabelElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      x: 30,
      y: 30,
      width: shapeType === 'circle' ? 40 : 60,
      height: 40,
      rotation: 0,
      content: shapeType,
      style: {
        backgroundColor: '#E5E5E5',
        borderColor: '#CCCCCC',
        borderWidth: 1,
        borderRadius: shapeType === 'circle' ? 50 : 4,
        opacity: 1
      },
      visible: true,
      locked: false,
      zIndex: elements.length + 1
    };
    
    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedElement(newElement.id);
    addToHistory(newElements);
  };

  const updateElement = (id: string, updates: Partial<LabelElement>) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(newElements);
    addToHistory(newElements);
  };

  const deleteElement = (id: string) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    setSelectedElement(null);
    addToHistory(newElements);
  };

  const duplicateElement = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: `${element.type}-${Date.now()}`,
        x: element.x + 10,
        y: element.y + 10,
        zIndex: elements.length + 1
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
      setSelectedElement(newElement.id);
      addToHistory(newElements);
    }
  };

  const getSelectedElement = () => {
    return elements.find(el => el.id === selectedElement);
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid if visible
    if (gridVisible) {
      ctx.strokeStyle = '#E5E5E5';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= canvas.width; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw elements
    elements
      .sort((a, b) => a.zIndex - b.zIndex)
      .forEach(element => {
        if (!element.visible) return;

        ctx.save();
        ctx.globalAlpha = element.style.opacity || 1;

        // Apply transformations
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);

        switch (element.type) {
          case 'text':
            ctx.font = `${element.style.fontWeight || 'normal'} ${element.style.fontStyle || 'normal'} ${element.style.fontSize || 12}px ${element.style.fontFamily || 'Arial'}`;
            ctx.fillStyle = element.style.color || '#000000';
            ctx.textAlign = element.style.textAlign || 'left';
            ctx.fillText(element.content, element.x, element.y + (element.style.fontSize || 12));
            break;

          case 'shape':
            if (element.style.backgroundColor) {
              ctx.fillStyle = element.style.backgroundColor;
              if (element.content === 'circle') {
                ctx.beginPath();
                ctx.arc(centerX, centerY, element.width / 2, 0, 2 * Math.PI);
                ctx.fill();
              } else {
                ctx.fillRect(element.x, element.y, element.width, element.height);
              }
            }
            
            if (element.style.borderWidth && element.style.borderColor) {
              ctx.strokeStyle = element.style.borderColor;
              ctx.lineWidth = element.style.borderWidth;
              if (element.content === 'circle') {
                ctx.beginPath();
                ctx.arc(centerX, centerY, element.width / 2, 0, 2 * Math.PI);
                ctx.stroke();
              } else {
                ctx.strokeRect(element.x, element.y, element.width, element.height);
              }
            }
            break;

          case 'qr':
            // Draw placeholder for QR code
            ctx.fillStyle = element.style.backgroundColor || '#FFFFFF';
            ctx.fillRect(element.x, element.y, element.width, element.height);
            ctx.strokeStyle = element.style.borderColor || '#000000';
            ctx.lineWidth = element.style.borderWidth || 1;
            ctx.strokeRect(element.x, element.y, element.width, element.height);
            
            // Draw QR pattern placeholder
            ctx.fillStyle = '#000000';
            for (let i = 0; i < element.width; i += 4) {
              for (let j = 0; j < element.height; j += 4) {
                if ((i + j) % 8 === 0) {
                  ctx.fillRect(element.x + i, element.y + j, 2, 2);
                }
              }
            }
            break;
        }

        // Draw selection border
        if (selectedElement === element.id) {
          ctx.strokeStyle = '#007AFF';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4);
          ctx.setLineDash([]);
        }

        ctx.restore();
      });
  };

  useEffect(() => {
    renderCanvas();
  }, [elements, selectedElement, gridVisible]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked element (top to bottom)
    const clickedElement = elements
      .sort((a, b) => b.zIndex - a.zIndex)
      .find(el => 
        x >= el.x && x <= el.x + el.width &&
        y >= el.y && y <= el.y + el.height &&
        el.visible
      );

    setSelectedElement(clickedElement?.id || null);
  };

  const selectedEl = getSelectedElement();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen max-h-[90vh]">
      {/* Toolbar */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Add Elements */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Add Elements</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addTextElement}
                  className="flex items-center gap-1"
                >
                  <Type className="h-3 w-3" />
                  Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addQRCode}
                  className="flex items-center gap-1"
                >
                  <Square className="h-3 w-3" />
                  QR
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addShape('rectangle')}
                  className="flex items-center gap-1"
                >
                  <Square className="h-3 w-3" />
                  Rect
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addShape('circle')}
                  className="flex items-center gap-1"
                >
                  <Circle className="h-3 w-3" />
                  Circle
                </Button>
              </div>
            </div>

            <Separator />

            {/* History Controls */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">History</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="flex-1"
                >
                  <Undo className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="flex-1"
                >
                  <Redo className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* View Controls */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">View</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Zoom:</Label>
                  <div className="flex-1">
                    <Slider
                      value={[zoom]}
                      onValueChange={(value) => setZoom(value[0])}
                      min={50}
                      max={200}
                      step={10}
                      className="w-full"
                    />
                  </div>
                  <span className="text-xs w-10">{zoom}%</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGridVisible(!gridVisible)}
                  className="w-full flex items-center gap-1"
                >
                  <Grid className="h-3 w-3" />
                  {gridVisible ? 'Hide' : 'Show'} Grid
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layers Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Layers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {elements
              .sort((a, b) => b.zIndex - a.zIndex)
              .map(element => (
                <div
                  key={element.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                    selectedElement === element.id ? 'bg-blue-100' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedElement(element.id)}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateElement(element.id, { visible: !element.visible });
                    }}
                    className="h-6 w-6 p-0"
                  >
                    {element.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </Button>
                  <span className="text-xs flex-1 truncate">
                    {element.type}: {element.content.substring(0, 15)}...
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateElement(element.id);
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
                      deleteElement(element.id);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Canvas Area */}
      <div className="lg:col-span-2 flex flex-col items-center justify-center bg-gray-100 rounded-lg p-4">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="mb-2 text-center">
            <Badge variant="outline">50mm × 30mm Label</Badge>
          </div>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleCanvasClick}
            className="border border-gray-300 cursor-crosshair"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center',
              imageRendering: 'pixelated'
            }}
          />
        </div>
      </div>

      {/* Properties Panel */}
      <div className="lg:col-span-1 space-y-4">
        {selectedEl ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Position & Size */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Position & Size</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">X</Label>
                    <Input
                      type="number"
                      value={selectedEl.x}
                      onChange={(e) => updateElement(selectedEl.id, { x: parseInt(e.target.value) || 0 })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Y</Label>
                    <Input
                      type="number"
                      value={selectedEl.y}
                      onChange={(e) => updateElement(selectedEl.id, { y: parseInt(e.target.value) || 0 })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Width</Label>
                    <Input
                      type="number"
                      value={selectedEl.width}
                      onChange={(e) => updateElement(selectedEl.id, { width: parseInt(e.target.value) || 1 })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Height</Label>
                    <Input
                      type="number"
                      value={selectedEl.height}
                      onChange={(e) => updateElement(selectedEl.id, { height: parseInt(e.target.value) || 1 })}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              {(selectedEl.type === 'text' || selectedEl.type === 'qr') && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Content</Label>
                  <Input
                    value={selectedEl.content}
                    onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                    className="h-7 text-xs"
                    placeholder="Enter content"
                  />
                </div>
              )}

              {/* Text Styling */}
              {selectedEl.type === 'text' && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Text Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Font Size</Label>
                      <Input
                        type="number"
                        value={selectedEl.style.fontSize || 12}
                        onChange={(e) => updateElement(selectedEl.id, { 
                          style: { ...selectedEl.style, fontSize: parseInt(e.target.value) || 12 }
                        })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Color</Label>
                      <Input
                        type="color"
                        value={selectedEl.style.color || '#000000'}
                        onChange={(e) => updateElement(selectedEl.id, { 
                          style: { ...selectedEl.style, color: e.target.value }
                        })}
                        className="h-7"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Font Family</Label>
                    <Select
                      value={selectedEl.style.fontFamily || 'Arial'}
                      onValueChange={(value) => updateElement(selectedEl.id, { 
                        style: { ...selectedEl.style, fontFamily: value }
                      })}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant={selectedEl.style.fontWeight === 'bold' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateElement(selectedEl.id, { 
                        style: { 
                          ...selectedEl.style, 
                          fontWeight: selectedEl.style.fontWeight === 'bold' ? 'normal' : 'bold' 
                        }
                      })}
                      className="flex-1"
                    >
                      <Bold className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={selectedEl.style.fontStyle === 'italic' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateElement(selectedEl.id, { 
                        style: { 
                          ...selectedEl.style, 
                          fontStyle: selectedEl.style.fontStyle === 'italic' ? 'normal' : 'italic' 
                        }
                      })}
                      className="flex-1"
                    >
                      <Italic className="h-3 w-3" />
                    </Button>
                  </div>

                  <div>
                    <Label className="text-xs">Text Align</Label>
                    <div className="flex gap-1">
                      <Button
                        variant={selectedEl.style.textAlign === 'left' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElement(selectedEl.id, { 
                          style: { ...selectedEl.style, textAlign: 'left' }
                        })}
                        className="flex-1"
                      >
                        <AlignLeft className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={selectedEl.style.textAlign === 'center' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElement(selectedEl.id, { 
                          style: { ...selectedEl.style, textAlign: 'center' }
                        })}
                        className="flex-1"
                      >
                        <AlignCenter className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={selectedEl.style.textAlign === 'right' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElement(selectedEl.id, { 
                          style: { ...selectedEl.style, textAlign: 'right' }
                        })}
                        className="flex-1"
                      >
                        <AlignRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Shape/QR Styling */}
              {(selectedEl.type === 'shape' || selectedEl.type === 'qr') && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Fill Color</Label>
                      <Input
                        type="color"
                        value={selectedEl.style.backgroundColor || '#E5E5E5'}
                        onChange={(e) => updateElement(selectedEl.id, { 
                          style: { ...selectedEl.style, backgroundColor: e.target.value }
                        })}
                        className="h-7"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Border Color</Label>
                      <Input
                        type="color"
                        value={selectedEl.style.borderColor || '#CCCCCC'}
                        onChange={(e) => updateElement(selectedEl.id, { 
                          style: { ...selectedEl.style, borderColor: e.target.value }
                        })}
                        className="h-7"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Border Width</Label>
                    <Slider
                      value={[selectedEl.style.borderWidth || 1]}
                      onValueChange={(value) => updateElement(selectedEl.id, { 
                        style: { ...selectedEl.style, borderWidth: value[0] }
                      })}
                      min={0}
                      max={5}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Transform */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Transform</Label>
                <div>
                  <Label className="text-xs">Rotation</Label>
                  <Slider
                    value={[selectedEl.rotation]}
                    onValueChange={(value) => updateElement(selectedEl.id, { rotation: value[0] })}
                    min={-180}
                    max={180}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-xs text-center">{selectedEl.rotation}°</div>
                </div>
                <div>
                  <Label className="text-xs">Opacity</Label>
                  <Slider
                    value={[(selectedEl.style.opacity || 1) * 100]}
                    onValueChange={(value) => updateElement(selectedEl.id, { 
                      style: { ...selectedEl.style, opacity: value[0] / 100 }
                    })}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-xs text-center">{Math.round((selectedEl.style.opacity || 1) * 100)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-sm text-gray-500">Select an element to edit its properties</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              const labelData = {
                elements,
                size: labelSize,
                sample: sample
              };
              onSave(labelData);
              toast.success('Label saved successfully');
            }}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Label
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

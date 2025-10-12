/**
 * Professional label editor with Fabric.js integration
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { EnhancedLabelTemplate, EnhancedLabelElement, Unit, Dpi, createElement } from '@/lib/label-model';
import { toPx, fromPx, convertUnit, getLabelDimensions, getSafeArea, getBleedArea } from '@/lib/units';
import { renderTemplateToPDF } from '@/lib/render/pdfRenderer';
import { renderTemplateToPNG } from '@/lib/render/pngRenderer';
import { substituteVariables, createSampleContext, extractVariableNames } from '@/lib/variableParser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LayersPanel } from './LayersPanel';
import { InspectorPanel } from './InspectorPanel';
import { Rulers } from './Rulers';
import { Guides } from './Guides';
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
  Edit3,
  Grid3X3,
  Ruler,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  Move,
  RotateCw,
  Square as SquareIcon,
  Circle,
  Minus,
  Layers,
  Palette
} from 'lucide-react';

interface LabelEditorProps {
  template?: EnhancedLabelTemplate;
  onSave?: (template: EnhancedLabelTemplate) => void;
  onClose?: () => void;
}

export const LabelEditor: React.FC<LabelEditorProps> = ({
  template,
  onSave,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<EnhancedLabelTemplate | null>(template || null);
  const [selectedElement, setSelectedElement] = useState<fabric.Object | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [showBleedArea, setShowBleedArea] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(1); // mm
  const [zoom, setZoom] = useState(1);
  const [panning, setPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'elements' | 'layers' | 'tools'>('elements');
  const [variableContext, setVariableContext] = useState(createSampleContext());
  const [showVariables, setShowVariables] = useState(false);
  const [guides, setGuides] = useState<Array<{id: string; position: number; axis: 'x' | 'y'}>>([]);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || !currentTemplate) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: getLabelDimensions(currentTemplate.size.width, currentTemplate.size.height, currentTemplate.size.unit).width,
      height: getLabelDimensions(currentTemplate.size.width, currentTemplate.size.height, currentTemplate.size.unit).height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      skipTargetFind: false,
      skipOffscreen: false,
      allowTouchScrolling: true,
      enableRetinaScaling: true,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });

    fabricCanvasRef.current = canvas;

    // Set up event listeners
    setupCanvasEvents(canvas);

    // Load template elements
    loadTemplateElements(canvas, currentTemplate);

    // Set up guides and grid
    setupGuidesAndGrid(canvas, currentTemplate);

    return () => {
      canvas.dispose();
    };
  }, [currentTemplate]);

  // Update canvas when template changes
  useEffect(() => {
    if (!fabricCanvasRef.current || !currentTemplate) return;

    const canvas = fabricCanvasRef.current;
    const { width, height } = getLabelDimensions(currentTemplate.size.width, currentTemplate.size.height, currentTemplate.size.unit);
    
    canvas.setDimensions({ width, height });
    loadTemplateElements(canvas, currentTemplate);
    setupGuidesAndGrid(canvas, currentTemplate);
  }, [currentTemplate]);

  // Set up canvas event listeners
  const setupCanvasEvents = (canvas: fabric.Canvas) => {
    // Selection events
    canvas.on('selection:created', (e) => {
      const obj = e.selected?.[0] || null;
      setSelectedElement(obj);
      setSelectedElementId(obj?.data?.elementId || null);
    });

    canvas.on('selection:updated', (e) => {
      const obj = e.selected?.[0] || null;
      setSelectedElement(obj);
      setSelectedElementId(obj?.data?.elementId || null);
    });

    canvas.on('selection:cleared', () => {
      setSelectedElement(null);
      setSelectedElementId(null);
    });

    // Object events
    canvas.on('object:modified', (e) => {
      if (e.target) {
        updateElementFromFabric(e.target);
      }
    });

    canvas.on('object:moving', (e) => {
      if (snapToGrid && e.target) {
        snapObjectToGrid(e.target);
      }
    });

    canvas.on('object:scaling', (e) => {
      if (snapToGrid && e.target) {
        snapObjectToGrid(e.target);
      }
    });

    // Pan events
    canvas.on('mouse:down', (e) => {
      if (e.e.altKey || e.e.ctrlKey) {
        setPanning(true);
        setLastPanPoint({ x: e.e.clientX, y: e.e.clientY });
        canvas.selection = false;
      }
    });

    canvas.on('mouse:move', (e) => {
      if (panning) {
        const deltaX = e.e.clientX - lastPanPoint.x;
        const deltaY = e.e.clientY - lastPanPoint.y;
        canvas.relativePan({ x: deltaX, y: deltaY });
        setLastPanPoint({ x: e.e.clientX, y: e.e.clientY });
      }
    });

    canvas.on('mouse:up', () => {
      setPanning(false);
      canvas.selection = true;
    });

    // Zoom events
    canvas.on('mouse:wheel', (e) => {
      const delta = e.e.deltaY;
      const zoomFactor = 0.1;
      const newZoom = Math.max(0.1, Math.min(5, zoom + (delta > 0 ? -zoomFactor : zoomFactor)));
      setZoom(newZoom);
      canvas.setZoom(newZoom);
      e.e.preventDefault();
    });
  };

  // Load template elements into Fabric.js canvas
  const loadTemplateElements = (canvas: fabric.Canvas, template: EnhancedLabelTemplate) => {
    canvas.clear();
    
    template.elements.forEach((element) => {
      const fabricObject = createFabricObject(element, template);
      if (fabricObject) {
        canvas.add(fabricObject);
      }
    });

    canvas.renderAll();
  };

  // Create Fabric.js object from label element
  const createFabricObject = (element: EnhancedLabelElement, template: EnhancedLabelTemplate): fabric.Object | null => {
    const { width, height } = getLabelDimensions(template.size.width, template.size.height, template.size.unit);
    const scale = width / template.size.width; // Scale factor for mm to pixels

    const x = toPx(element.x, template.size.unit);
    const y = toPx(element.y, template.size.unit);
    const w = toPx(element.w, template.size.unit);
    const h = toPx(element.h, template.size.unit);

    switch (element.type) {
      case 'text':
        return createTextObject(element, x, y, w, h);
      case 'image':
        return createImageObject(element, x, y, w, h);
      case 'barcode':
        return createBarcodeObject(element, x, y, w, h);
      case 'qr':
        return createQRObject(element, x, y, w, h);
      case 'shape':
        return createShapeObject(element, x, y, w, h);
      case 'table':
        return createTableObject(element, x, y, w, h);
      default:
        return null;
    }
  };

  // Create text object
  const createTextObject = (element: EnhancedTextElement, x: number, y: number, w: number, h: number): fabric.Text => {
    // Substitute variables in content
    const content = substituteVariables(element.content || '', variableContext);
    
    const text = new fabric.Text(content, {
      left: x,
      top: y,
      width: w,
      height: h,
      fontSize: toPx(element.fontSize || 12, 'mm'),
      fontFamily: element.fontFamily || 'Arial',
      fontWeight: element.fontWeight || 'normal',
      fontStyle: element.fontStyle || 'normal',
      fill: element.color || '#000000',
      textAlign: element.textAlign || 'left',
      charSpacing: element.letterSpacing || 0,
      lineHeight: element.lineHeight || 1.2,
      textDecoration: element.textDecoration || 'none',
      textTransform: element.textTransform || 'none',
      opacity: element.opacity || 1,
      selectable: !element.locked,
      evented: !element.locked,
      lockMovementX: element.locked,
      lockMovementY: element.locked,
      lockRotation: element.locked,
      lockScalingX: element.locked,
      lockScalingY: element.locked,
      lockSkewingX: element.locked,
      lockSkewingY: element.locked,
      data: { elementId: element.id, elementType: element.type }
    });

    if (element.rotation) {
      text.set('angle', element.rotation);
    }

    return text;
  };

  // Create image object
  const createImageObject = (element: EnhancedImageElement, x: number, y: number, w: number, h: number): fabric.Image => {
    const img = new fabric.Image(element.src, {
      left: x,
      top: y,
      width: w,
      height: h,
      opacity: element.opacity || 1,
      selectable: !element.locked,
      evented: !element.locked,
      lockMovementX: element.locked,
      lockMovementY: element.locked,
      lockRotation: element.locked,
      lockScalingX: element.locked,
      lockScalingY: element.locked,
      data: { elementId: element.id, elementType: element.type }
    });

    if (element.rotation) {
      img.set('angle', element.rotation);
    }

    return img;
  };

  // Create barcode object
  const createBarcodeObject = (element: EnhancedBarcodeElement, x: number, y: number, w: number, h: number): fabric.Rect => {
    // Substitute variables in barcode value
    const value = substituteVariables(element.value || '', variableContext);
    
    // For now, create a placeholder rectangle with the substituted value
    // In a real implementation, you'd generate the actual barcode image
    const rect = new fabric.Rect({
      left: x,
      top: y,
      width: w,
      height: h,
      fill: '#f0f0f0',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: !element.locked,
      evented: !element.locked,
      data: { elementId: element.id, elementType: element.type, barcodeValue: value }
    });

    return rect;
  };

  // Create QR code object
  const createQRObject = (element: EnhancedQRElement, x: number, y: number, w: number, h: number): fabric.Rect => {
    // Substitute variables in QR value
    const value = substituteVariables(element.value || '', variableContext);
    
    // For now, create a placeholder rectangle with the substituted value
    // In a real implementation, you'd generate the actual QR code image
    const rect = new fabric.Rect({
      left: x,
      top: y,
      width: w,
      height: h,
      fill: '#f0f0f0',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: !element.locked,
      evented: !element.locked,
      data: { elementId: element.id, elementType: element.type, qrValue: value }
    });

    return rect;
  };

  // Create shape object
  const createShapeObject = (element: EnhancedShapeElement, x: number, y: number, w: number, h: number): fabric.Object => {
    switch (element.shape) {
      case 'rectangle':
        return new fabric.Rect({
          left: x,
          top: y,
          width: w,
          height: h,
          fill: element.fill || '#000000',
          stroke: element.stroke || '#000000',
          strokeWidth: toPx(element.strokeWidth || 1, 'mm'),
          rx: element.cornerRadius ? toPx(element.cornerRadius, 'mm') : 0,
          ry: element.cornerRadius ? toPx(element.cornerRadius, 'mm') : 0,
          selectable: !element.locked,
          evented: !element.locked,
          data: { elementId: element.id, elementType: element.type }
        });
      case 'circle':
        const radius = Math.min(w, h) / 2;
        return new fabric.Circle({
          left: x + w / 2 - radius,
          top: y + h / 2 - radius,
          radius: radius,
          fill: element.fill || '#000000',
          stroke: element.stroke || '#000000',
          strokeWidth: toPx(element.strokeWidth || 1, 'mm'),
          selectable: !element.locked,
          evented: !element.locked,
          data: { elementId: element.id, elementType: element.type }
        });
      case 'line':
        return new fabric.Line([0, 0, w, h], {
          left: x,
          top: y,
          stroke: element.stroke || '#000000',
          strokeWidth: toPx(element.strokeWidth || 1, 'mm'),
          selectable: !element.locked,
          evented: !element.locked,
          data: { elementId: element.id, elementType: element.type }
        });
      default:
        return new fabric.Rect({
          left: x,
          top: y,
          width: w,
          height: h,
          fill: element.fill || '#000000',
          selectable: !element.locked,
          evented: !element.locked,
          data: { elementId: element.id, elementType: element.type }
        });
    }
  };

  // Create table object
  const createTableObject = (element: EnhancedTableElement, x: number, y: number, w: number, h: number): fabric.Rect => {
    // For now, create a placeholder rectangle
    // In a real implementation, you'd create a more complex table object
    const rect = new fabric.Rect({
      left: x,
      top: y,
      width: w,
      height: h,
      fill: '#f8f9fa',
      stroke: '#dee2e6',
      strokeWidth: 1,
      selectable: !element.locked,
      evented: !element.locked,
      data: { elementId: element.id, elementType: element.type }
    });

    return rect;
  };

  // Set up guides and grid
  const setupGuidesAndGrid = (canvas: fabric.Canvas, template: EnhancedLabelTemplate) => {
    if (!showGrid && !showGuides && !showSafeArea && !showBleedArea) return;

    const { width, height } = getLabelDimensions(template.size.width, template.size.height, template.size.unit);
    const gridSizePx = toPx(gridSize, template.size.unit);

    // Clear existing guides
    canvas.getObjects().forEach(obj => {
      if (obj.data?.isGuide) {
        canvas.remove(obj);
      }
    });

    // Draw grid
    if (showGrid) {
      for (let x = 0; x <= width; x += gridSizePx) {
        const line = new fabric.Line([x, 0, x, height], {
          stroke: '#e0e0e0',
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
          data: { isGuide: true }
        });
        canvas.add(line);
      }

      for (let y = 0; y <= height; y += gridSizePx) {
        const line = new fabric.Line([0, y, width, y], {
          stroke: '#e0e0e0',
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
          data: { isGuide: true }
        });
        canvas.add(line);
      }
    }

    // Draw safe area
    if (showSafeArea && template.margins?.safe) {
      const safeArea = getSafeArea(template.size.width, template.size.height, template.size.unit, template.margins.safe);
      const rect = new fabric.Rect({
        left: safeArea.x,
        top: safeArea.y,
        width: safeArea.width,
        height: safeArea.height,
        fill: 'transparent',
        stroke: '#ff6b6b',
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        data: { isGuide: true }
      });
      canvas.add(rect);
    }

    // Draw bleed area
    if (showBleedArea && template.margins?.bleed) {
      const bleedArea = getBleedArea(template.size.width, template.size.height, template.size.unit, template.margins.bleed);
      const rect = new fabric.Rect({
        left: bleedArea.x,
        top: bleedArea.y,
        width: bleedArea.width,
        height: bleedArea.height,
        fill: 'transparent',
        stroke: '#4ecdc4',
        strokeWidth: 1,
        strokeDashArray: [3, 3],
        selectable: false,
        evented: false,
        data: { isGuide: true }
      });
      canvas.add(rect);
    }

    canvas.renderAll();
  };

  // Snap object to grid
  const snapObjectToGrid = (obj: fabric.Object) => {
    if (!currentTemplate) return;

    const gridSizePx = toPx(gridSize, currentTemplate.size.unit);
    const left = Math.round(obj.left! / gridSizePx) * gridSizePx;
    const top = Math.round(obj.top! / gridSizePx) * gridSizePx;
    
    obj.set({ left, top });
  };

  // Update element from Fabric.js object
  const updateElementFromFabric = (obj: fabric.Object) => {
    if (!currentTemplate || !obj.data) return;

    const elementId = obj.data.elementId;
    const element = currentTemplate.elements.find(el => el.id === elementId);
    if (!element) return;

    // Update element properties
    element.x = fromPx(obj.left!, currentTemplate.size.unit);
    element.y = fromPx(obj.top!, currentTemplate.size.unit);
    element.w = fromPx(obj.width! * obj.scaleX!, currentTemplate.size.unit);
    element.h = fromPx(obj.height! * obj.scaleY!, currentTemplate.size.unit);
    element.rotation = obj.angle || 0;
    element.opacity = obj.opacity || 1;

    // Update template
    setCurrentTemplate({ ...currentTemplate });
  };

  // Add new element
  const addElement = (type: EnhancedLabelElement['type']) => {
    if (!currentTemplate) return;

    const newElement = createElement(type);
    const fabricObject = createFabricObject(newElement, currentTemplate);
    
    if (fabricObject && fabricCanvasRef.current) {
      fabricCanvasRef.current.add(fabricObject);
      fabricCanvasRef.current.setActiveObject(fabricObject);
      fabricCanvasRef.current.renderAll();
    }

    // Update template
    const updatedTemplate = {
      ...currentTemplate,
      elements: [...currentTemplate.elements, newElement]
    };
    setCurrentTemplate(updatedTemplate);
  };

  // Update element from inspector
  const handleElementUpdate = (updates: Partial<EnhancedLabelElement>) => {
    if (!currentTemplate || !selectedElementId) return;

    const elementIndex = currentTemplate.elements.findIndex(el => el.id === selectedElementId);
    if (elementIndex === -1) return;

    const updatedElement = { ...currentTemplate.elements[elementIndex], ...updates };
    const updatedElements = [...currentTemplate.elements];
    updatedElements[elementIndex] = updatedElement;

    setCurrentTemplate({
      ...currentTemplate,
      elements: updatedElements
    });

    // Update fabric object
    const fabricObj = fabricCanvasRef.current?.getObjects().find(obj => obj.data?.elementId === selectedElementId);
    if (fabricObj) {
      // Update fabric object properties based on element updates
      if (updates.x !== undefined) fabricObj.set('left', toPx(updates.x, currentTemplate.size.unit));
      if (updates.y !== undefined) fabricObj.set('top', toPx(updates.y, currentTemplate.size.unit));
      if (updates.w !== undefined) fabricObj.set('width', toPx(updates.w, currentTemplate.size.unit));
      if (updates.h !== undefined) fabricObj.set('height', toPx(updates.h, currentTemplate.size.unit));
      if (updates.rotation !== undefined) fabricObj.set('angle', updates.rotation);
      if (updates.opacity !== undefined) fabricObj.set('opacity', updates.opacity);
      if (updates.visible !== undefined) fabricObj.set('visible', updates.visible);
      if (updates.locked !== undefined) {
        fabricObj.set('selectable', !updates.locked);
        fabricObj.set('evented', !updates.locked);
        fabricObj.set('lockMovementX', updates.locked);
        fabricObj.set('lockMovementY', updates.locked);
        fabricObj.set('lockRotation', updates.locked);
        fabricObj.set('lockScalingX', updates.locked);
        fabricObj.set('lockScalingY', updates.locked);
      }

      fabricCanvasRef.current?.renderAll();
    }
  };

  // Handle element selection from layers panel
  const handleElementSelect = (elementId: string) => {
    const fabricObj = fabricCanvasRef.current?.getObjects().find(obj => obj.data?.elementId === elementId);
    if (fabricObj) {
      fabricCanvasRef.current?.setActiveObject(fabricObj);
      fabricCanvasRef.current?.renderAll();
    }
  };

  // Handle element deletion from layers panel
  const handleElementDelete = (elementId: string) => {
    if (!currentTemplate) return;

    const fabricObj = fabricCanvasRef.current?.getObjects().find(obj => obj.data?.elementId === elementId);
    if (fabricObj) {
      fabricCanvasRef.current?.remove(fabricObj);
      fabricCanvasRef.current?.renderAll();
    }

    setCurrentTemplate({
      ...currentTemplate,
      elements: currentTemplate.elements.filter(el => el.id !== elementId)
    });

    if (selectedElementId === elementId) {
      setSelectedElement(null);
      setSelectedElementId(null);
    }
  };

  // Handle element duplication
  const handleElementDuplicate = (elementId: string) => {
    if (!currentTemplate) return;

    const element = currentTemplate.elements.find(el => el.id === elementId);
    if (!element) return;

    const duplicatedElement = {
      ...element,
      id: `${element.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: element.x + 5,
      y: element.y + 5,
      name: `${element.name || element.type} Copy`
    };

    const fabricObject = createFabricObject(duplicatedElement, currentTemplate);
    if (fabricObject && fabricCanvasRef.current) {
      fabricCanvasRef.current.add(fabricObject);
      fabricCanvasRef.current.setActiveObject(fabricObject);
      fabricCanvasRef.current.renderAll();
    }

    setCurrentTemplate({
      ...currentTemplate,
      elements: [...currentTemplate.elements, duplicatedElement]
    });
  };

  // Handle element move up/down
  const handleElementMove = (elementId: string, direction: 'up' | 'down') => {
    if (!currentTemplate) return;

    const elementIndex = currentTemplate.elements.findIndex(el => el.id === elementId);
    if (elementIndex === -1) return;

    const newIndex = direction === 'up' ? elementIndex - 1 : elementIndex + 1;
    if (newIndex < 0 || newIndex >= currentTemplate.elements.length) return;

    const updatedElements = [...currentTemplate.elements];
    const [movedElement] = updatedElements.splice(elementIndex, 1);
    updatedElements.splice(newIndex, 0, movedElement);

    // Update zIndex based on new position
    updatedElements.forEach((el, index) => {
      el.zIndex = updatedElements.length - index;
    });

    setCurrentTemplate({
      ...currentTemplate,
      elements: updatedElements
    });

    // Re-render canvas with new order
    loadTemplateElements(fabricCanvasRef.current!, currentTemplate);
  };

  // Handle ruler click to add guides
  const handleRulerClick = (position: number, axis: 'x' | 'y') => {
    const newGuide = {
      id: `guide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position,
      axis
    };
    setGuides(prev => [...prev, newGuide]);
  };

  // Handle guide movement
  const handleGuideMove = (guideId: string, position: number) => {
    setGuides(prev => 
      prev.map(guide => 
        guide.id === guideId ? { ...guide, position } : guide
      )
    );
  };

  // Handle guide deletion
  const handleGuideDelete = (guideId: string) => {
    setGuides(prev => prev.filter(guide => guide.id !== guideId));
  };

  // Delete selected element
  const deleteSelectedElement = () => {
    if (!fabricCanvasRef.current || !selectedElement) return;

    fabricCanvasRef.current.remove(selectedElement);
    fabricCanvasRef.current.renderAll();

    // Update template
    if (currentTemplate && selectedElement.data) {
      const elementId = selectedElement.data.elementId;
      setCurrentTemplate({
        ...currentTemplate,
        elements: currentTemplate.elements.filter(el => el.id !== elementId)
      });
    }

    setSelectedElement(null);
  };

  // Align elements
  const alignElements = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!fabricCanvasRef.current) return;

    const activeObjects = fabricCanvasRef.current.getActiveObjects();
    if (activeObjects.length < 2) return;

    const canvas = fabricCanvasRef.current;
    
    switch (alignment) {
      case 'left':
        const leftMost = Math.min(...activeObjects.map(obj => obj.left!));
        activeObjects.forEach(obj => obj.set('left', leftMost));
        break;
      case 'center':
        const centerX = canvas.getCenter().x;
        activeObjects.forEach(obj => obj.set('left', centerX - obj.width! / 2));
        break;
      case 'right':
        const rightMost = Math.max(...activeObjects.map(obj => obj.left! + obj.width!));
        activeObjects.forEach(obj => obj.set('left', rightMost - obj.width!));
        break;
      case 'top':
        const topMost = Math.min(...activeObjects.map(obj => obj.top!));
        activeObjects.forEach(obj => obj.set('top', topMost));
        break;
      case 'middle':
        const centerY = canvas.getCenter().y;
        activeObjects.forEach(obj => obj.set('top', centerY - obj.height! / 2));
        break;
      case 'bottom':
        const bottomMost = Math.max(...activeObjects.map(obj => obj.top! + obj.height!));
        activeObjects.forEach(obj => obj.set('top', bottomMost - obj.height!));
        break;
    }

    canvas.renderAll();
  };

  // Distribute elements
  const distributeElements = (direction: 'horizontal' | 'vertical') => {
    if (!fabricCanvasRef.current) return;

    const activeObjects = fabricCanvasRef.current.getActiveObjects();
    if (activeObjects.length < 3) return;

    const canvas = fabricCanvasRef.current;
    
    if (direction === 'horizontal') {
      activeObjects.sort((a, b) => a.left! - b.left!);
      const totalWidth = activeObjects[activeObjects.length - 1].left! - activeObjects[0].left!;
      const spacing = totalWidth / (activeObjects.length - 1);
      
      for (let i = 1; i < activeObjects.length - 1; i++) {
        activeObjects[i].set('left', activeObjects[0].left! + spacing * i);
      }
    } else {
      activeObjects.sort((a, b) => a.top! - b.top!);
      const totalHeight = activeObjects[activeObjects.length - 1].top! - activeObjects[0].top!;
      const spacing = totalHeight / (activeObjects.length - 1);
      
      for (let i = 1; i < activeObjects.length - 1; i++) {
        activeObjects[i].set('top', activeObjects[0].top! + spacing * i);
      }
    }

    canvas.renderAll();
  };

  // Save template
  const handleSave = () => {
    if (!currentTemplate) return;
    
    onSave?.(currentTemplate);
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!currentTemplate) return;
    
    try {
      setIsLoading(true);
      const pdfBytes = await renderTemplateToPDF(currentTemplate);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTemplate.name || 'label'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Export to PNG
  const handleExportPNG = async () => {
    if (!currentTemplate) return;
    
    try {
      setIsLoading(true);
      const dataUrl = await renderTemplateToPNG(currentTemplate);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${currentTemplate.name || 'label'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export PNG:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentTemplate) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Tools */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Label Editor</h2>
          <p className="text-sm text-gray-600">{currentTemplate.name}</p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="elements">Elements</TabsTrigger>
            <TabsTrigger value="layers">Layers</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
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
              <h3 className="font-medium mb-3">Elements ({currentTemplate.elements.length})</h3>
              <div className="space-y-2">
                {currentTemplate.elements.map((element) => (
                  <div
                    key={element.id}
                    className={`p-2 border rounded cursor-pointer ${
                      selectedElement?.data?.elementId === element.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      const obj = fabricCanvasRef.current?.getObjects().find(o => o.data?.elementId === element.id);
                      if (obj) {
                        fabricCanvasRef.current?.setActiveObject(obj);
                        fabricCanvasRef.current?.renderAll();
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {element.type}
                        </Badge>
                        <span className="text-sm">
                          {element.name || element.id}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const obj = fabricCanvasRef.current?.getObjects().find(o => o.data?.elementId === element.id);
                          if (obj) {
                            fabricCanvasRef.current?.remove(obj);
                            fabricCanvasRef.current?.renderAll();
                            setCurrentTemplate({
                              ...currentTemplate,
                              elements: currentTemplate.elements.filter(el => el.id !== element.id)
                            });
                          }
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

          <TabsContent value="layers" className="p-0">
            <LayersPanel
              elements={currentTemplate.elements}
              selectedElementId={selectedElementId}
              onElementSelect={handleElementSelect}
              onElementUpdate={handleElementUpdate}
              onElementDelete={handleElementDelete}
              onElementDuplicate={handleElementDuplicate}
              onElementMove={handleElementMove}
            />
          </TabsContent>

          <TabsContent value="tools" className="p-4 space-y-4">
            <div>
              <h3 className="font-medium mb-3">View Options</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Grid</span>
                  <Button
                    variant={showGrid ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rulers</span>
                  <Button
                    variant={showRulers ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowRulers(!showRulers)}
                  >
                    <Ruler className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Guides</span>
                  <Button
                    variant={showGuides ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowGuides(!showGuides)}
                  >
                    <SquareIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Safe Area</span>
                  <Button
                    variant={showSafeArea ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowSafeArea(!showSafeArea)}
                  >
                    <SquareIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bleed Area</span>
                  <Button
                    variant={showBleedArea ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowBleedArea(!showBleedArea)}
                  >
                    <Circle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Snap to Grid</span>
                  <Button
                    variant={snapToGrid ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSnapToGrid(!snapToGrid)}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-3">Alignment</h3>
              <div className="grid grid-cols-3 gap-1">
                <Button variant="outline" size="sm" onClick={() => alignElements('left')}>
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => alignElements('center')}>
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => alignElements('right')}>
                  <AlignRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => alignElements('top')}>
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => alignElements('middle')}>
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => alignElements('bottom')}>
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Distribution</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => distributeElements('horizontal')}>
                  <AlignHorizontalSpaceBetween className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => distributeElements('vertical')}>
                  <AlignVerticalSpaceBetween className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-3">Guides ({guides.length})</h3>
              <div className="space-y-2">
                <div className="text-xs text-gray-600">
                  Click rulers to add guides, double-click guides to delete
                </div>
                {guides.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {guides.map(guide => (
                      <div key={guide.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                        <span className="font-mono">
                          {guide.axis.toUpperCase()}: {Math.round(guide.position * 100) / 100}{currentTemplate?.size.unit}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={() => handleGuideDelete(guide.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    if (currentTemplate) {
                      handleRulerClick(currentTemplate.size.width / 2, 'x');
                      handleRulerClick(currentTemplate.size.height / 2, 'y');
                    }
                  }}
                >
                  Add Center Guides
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-3">Variables</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Variables</span>
                  <Button
                    variant={showVariables ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowVariables(!showVariables)}
                  >
                    <Type className="h-4 w-4" />
                  </Button>
                </div>
                {showVariables && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {Object.entries(variableContext).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-gray-600">{key}:</span>
                        <span className="text-gray-800">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Center - Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={handleSave} className="flex items-center gap-2" disabled={isLoading}>
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={handleExportPDF}
              disabled={isLoading}
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={handleExportPNG}
              disabled={isLoading}
            >
              <Download className="h-4 w-4" />
              Export PNG
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {currentTemplate.size.width}×{currentTemplate.size.height} {currentTemplate.size.unit}
            </Badge>
            <Badge variant="outline">
              {currentTemplate.size.dpi} DPI
            </Badge>
            <Badge variant="outline">
              {Math.round(zoom * 100)}%
            </Badge>
          </div>
        </div>

        <div className="flex-1 p-4 flex items-center justify-center bg-gray-100 overflow-hidden">
          <div className="relative bg-white border border-gray-300 shadow-lg">
            {/* Rulers and Guides */}
            <Rulers
              width={currentTemplate.size.width}
              height={currentTemplate.size.height}
              unit={currentTemplate.size.unit}
              zoom={zoom}
              showRulers={showRulers}
              gridSize={gridSize}
              showGrid={showGrid}
              onRulerClick={handleRulerClick}
            />
            <Guides
              width={currentTemplate.size.width}
              height={currentTemplate.size.height}
              unit={currentTemplate.size.unit}
              zoom={zoom}
              showGuides={showGuides}
              safeArea={currentTemplate.margins?.safe ? getSafeArea(
                currentTemplate.size.width, 
                currentTemplate.size.height, 
                currentTemplate.size.unit, 
                currentTemplate.margins.safe
              ) : undefined}
              bleedArea={currentTemplate.margins?.bleed ? getBleedArea(
                currentTemplate.size.width, 
                currentTemplate.size.height, 
                currentTemplate.size.unit, 
                currentTemplate.margins.bleed
              ) : undefined}
              onGuideMove={handleGuideMove}
              onGuideDelete={handleGuideDelete}
            />
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full relative z-10"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar - Inspector */}
      <div className="w-80 bg-white border-l border-gray-200">
        <InspectorPanel
          selectedElement={selectedElementId ? currentTemplate.elements.find(el => el.id === selectedElementId) || null : null}
          onElementUpdate={handleElementUpdate}
          templateUnit={currentTemplate.size.unit}
        />
      </div>
    </div>
  );
};


/**
 * Enhanced Label Editor with Phase 2 features
 * Extends the base Editor with advanced functionality
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { EnhancedLabelTemplate, EnhancedLabelElement, Unit, Dpi, createElement } from '@/lib/label-model';
import { toPx, fromPx, convertUnit, getLabelDimensions, getSafeArea, getBleedArea } from '@/lib/units';
import { renderTemplateToPDF } from '@/lib/render/pdfRenderer';
import { renderTemplateToPNG } from '@/lib/render/pngRenderer';
import { substituteVariables, createSampleContext, extractVariableNames } from '@/lib/variableParser';
import { UndoRedoManager, UndoRedoShortcuts, ActionDescriptions } from '@/lib/undoRedo';
import { MultiSelectManager } from '@/lib/multiSelect';
import { ClipboardManager, ClipboardShortcuts } from '@/lib/clipboard';
import { DataIntegrationManager } from '@/lib/dataIntegration';
import { generateRealBarcode, generateRealQR } from '@/lib/render/realBarcode';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LayersPanel } from './LayersPanel';
import { InspectorPanel } from './InspectorPanel';
import { Rulers } from './Rulers';
import { Guides } from './Guides';
import { ZoomControls } from './ZoomControls';
import { RichTextEditor } from './RichTextEditor';
import { PrintPreview } from './PrintPreview';
import { 
  Save, Download, Upload, Copy, Trash2, Plus, Settings, Type, Image, QrCode, BarChart3,
  Square, Table, Eye, Edit3, Grid3X3, Ruler, Lock, Unlock, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, AlignHorizontalSpaceBetween, AlignVerticalSpaceBetween, Move, RotateCw,
  Square as SquareIcon, Circle, Minus, Layers, Palette, Undo, Redo, Group, Ungroup,
  MousePointer, Hand, Printer, FileText, Database, Search, Filter, SortAsc, SortDesc
} from 'lucide-react';

interface LabelEditorPhase2Props {
  template?: EnhancedLabelTemplate;
  onSave?: (template: EnhancedLabelTemplate) => void;
  onClose?: () => void;
}

export const LabelEditorPhase2: React.FC<LabelEditorPhase2Props> = ({
  template,
  onSave,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  
  // Phase 2 State
  const [currentTemplate, setCurrentTemplate] = useState<EnhancedLabelTemplate | null>(template || null);
  const [selectedElement, setSelectedElement] = useState<fabric.Object | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // View State
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
  
  // UI State
  const [activeTab, setActiveTab] = useState<'elements' | 'layers' | 'tools' | 'data'>('elements');
  const [variableContext, setVariableContext] = useState(createSampleContext());
  const [showVariables, setShowVariables] = useState(false);
  const [guides, setGuides] = useState<Array<{id: string; position: number; axis: 'x' | 'y'}>>([]);
  
  // Phase 2 Features
  const [showRichTextEditor, setShowRichTextEditor] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showDataImport, setShowDataImport] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [workspaceLayout, setWorkspaceLayout] = useState<'default' | 'compact' | 'expanded'>('default');
  
  // Phase 2 Managers
  const undoRedoManager = useRef(new UndoRedoManager());
  const multiSelectManager = useRef(new MultiSelectManager());
  const clipboardManager = useRef(new ClipboardManager());
  const dataIntegrationManager = useRef(new DataIntegrationManager());

  // Initialize managers
  useEffect(() => {
    // Setup keyboard shortcuts
    const undoRedoShortcuts = new UndoRedoShortcuts(
      undoRedoManager.current,
      handleUndo,
      handleRedo
    );
    
    const clipboardShortcuts = new ClipboardShortcuts(
      clipboardManager.current,
      handleCopy,
      handleCut,
      handlePaste
    );

    const cleanupUndoRedo = undoRedoShortcuts.setup();
    const cleanupClipboard = clipboardShortcuts.setup();

    return () => {
      cleanupUndoRedo();
      cleanupClipboard();
    };
  }, []);

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
      enablePointerEvents: true,
      fireRightClick: true,
      fireMiddleClick: true,
      stopContextMenu: false,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      enableRetinaScaling: true,
      devicePixelRatio: window.devicePixelRatio || 1
    });

    fabricCanvasRef.current = canvas;
    setupCanvasEvents(canvas);
    loadTemplateElements(canvas);
    setupGuidesAndGrid(canvas);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [currentTemplate]);

  // Phase 2 Event Handlers
  const handleUndo = useCallback(() => {
    const newTemplate = undoRedoManager.current.undo();
    if (newTemplate) {
      setCurrentTemplate(newTemplate);
      loadTemplateElements(fabricCanvasRef.current!);
    }
  }, []);

  const handleRedo = useCallback(() => {
    const newTemplate = undoRedoManager.current.redo();
    if (newTemplate) {
      setCurrentTemplate(newTemplate);
      loadTemplateElements(fabricCanvasRef.current!);
    }
  }, []);

  const handleCopy = useCallback(() => {
    if (!currentTemplate || !selectedElementId) return;
    
    const selectedElements = currentTemplate.elements.filter(el => 
      multiSelectManager.current.isSelected(el.id)
    );
    
    if (selectedElements.length > 0) {
      clipboardManager.current.copy(selectedElements, currentTemplate.id);
    }
  }, [currentTemplate, selectedElementId]);

  const handleCut = useCallback(() => {
    if (!currentTemplate || !selectedElementId) return;
    
    const selectedElements = currentTemplate.elements.filter(el => 
      multiSelectManager.current.isSelected(el.id)
    );
    
    if (selectedElements.length > 0) {
      clipboardManager.current.cut(selectedElements, currentTemplate.id);
      // Remove elements from template
      const newTemplate = {
        ...currentTemplate,
        elements: currentTemplate.elements.filter(el => 
          !multiSelectManager.current.isSelected(el.id)
        )
      };
      setCurrentTemplate(newTemplate);
      undoRedoManager.current.saveState(newTemplate, ActionDescriptions.cut('elements'), 'cut');
    }
  }, [currentTemplate, selectedElementId]);

  const handlePaste = useCallback(() => {
    if (!currentTemplate) return;
    
    const pastedElements = clipboardManager.current.paste({
      offsetX: 10,
      offsetY: 10,
      duplicateIds: true
    });
    
    if (pastedElements) {
      const newTemplate = {
        ...currentTemplate,
        elements: [...currentTemplate.elements, ...pastedElements]
      };
      setCurrentTemplate(newTemplate);
      undoRedoManager.current.saveState(newTemplate, ActionDescriptions.paste('elements'), 'create');
      loadTemplateElements(fabricCanvasRef.current!);
    }
  }, [currentTemplate]);

  const handleMultiSelect = useCallback((elementIds: string[]) => {
    multiSelectManager.current.selectElements(elementIds);
  }, []);

  const handleGroup = useCallback(() => {
    const selectedIds = multiSelectManager.current.getSelectedElementIds();
    if (selectedIds.length < 2) return;
    
    const group = multiSelectManager.current.createGroup(`Group ${selectedIds.length} elements`);
    if (group) {
      undoRedoManager.current.saveState(
        currentTemplate!,
        ActionDescriptions.group(selectedIds.length),
        'group',
        selectedIds
      );
    }
  }, [currentTemplate]);

  const handleUngroup = useCallback(() => {
    const selectedIds = multiSelectManager.current.getSelectedElementIds();
    if (selectedIds.length !== 1) return;
    
    const group = multiSelectManager.current.getGroups().find(g => g.id === selectedIds[0]);
    if (group) {
      multiSelectManager.current.ungroupGroup(group.id);
      undoRedoManager.current.saveState(
        currentTemplate!,
        ActionDescriptions.ungroup(group.elementIds.length),
        'ungroup',
        group.elementIds
      );
    }
  }, [currentTemplate]);

  const handleDataImport = useCallback(async (file: File) => {
    const fieldMappings = {
      'sampleName': 'itemNameEN',
      'sampleNo': 'sampleNo',
      'supplierCode': 'supplierCode',
      'date': 'date',
      'time': 'time'
    };

    const validationRules = [
      { name: 'sampleName', type: 'string' as const, required: true },
      { name: 'sampleNo', type: 'string' as const, required: true },
      { name: 'supplierCode', type: 'string' as const, required: false },
      { name: 'date', type: 'date' as const, required: false },
      { name: 'time', type: 'string' as const, required: false }
    ];

    const result = await dataIntegrationManager.current.importData(file, fieldMappings, validationRules);
    
    if (result.success) {
      // Update variable context with imported data
      setVariableContext(prev => ({
        ...prev,
        ...result.data[0]
      }));
    }
    
    return result;
  }, []);

  // Canvas setup functions (simplified for brevity)
  const setupCanvasEvents = (canvas: fabric.Canvas) => {
    // Selection events
    canvas.on('selection:created', (e) => {
      if (e.selected && e.selected.length > 0) {
        const element = e.selected[0] as any;
        setSelectedElement(element);
        setSelectedElementId(element.id);
        multiSelectManager.current.selectElement(element.id);
      }
    });

    canvas.on('selection:updated', (e) => {
      if (e.selected && e.selected.length > 0) {
        const elementIds = e.selected.map((obj: any) => obj.id);
        multiSelectManager.current.selectElements(elementIds);
      }
    });

    canvas.on('selection:cleared', () => {
      setSelectedElement(null);
      setSelectedElementId(null);
      multiSelectManager.current.clearSelection();
    });

    // Object modification events
    canvas.on('object:modified', (e) => {
      if (e.target) {
        updateElementFromFabric(e.target as any);
      }
    });
  };

  const loadTemplateElements = (canvas: fabric.Canvas) => {
    if (!currentTemplate) return;
    
    canvas.clear();
    
    currentTemplate.elements.forEach(element => {
      const fabricObject = createFabricObject(element);
      if (fabricObject) {
        canvas.add(fabricObject);
      }
    });
    
    canvas.renderAll();
  };

  const createFabricObject = (element: EnhancedLabelElement): fabric.Object | null => {
    const x = toPx(element.x, element.unit || currentTemplate!.size.unit);
    const y = toPx(element.y, element.unit || currentTemplate!.size.unit);
    const w = toPx(element.w, element.unit || currentTemplate!.size.unit);
    const h = toPx(element.h, element.unit || currentTemplate!.size.unit);

    switch (element.type) {
      case 'text':
        return createTextObject(element as any, x, y, w, h);
      case 'image':
        return createImageObject(element as any, x, y, w, h);
      case 'barcode':
        return createBarcodeObject(element as any, x, y, w, h);
      case 'qr':
        return createQRObject(element as any, x, y, w, h);
      case 'shape':
        return createShapeObject(element as any, x, y, w, h);
      default:
        return null;
    }
  };

  const createTextObject = (element: any, x: number, y: number, w: number, h: number): fabric.Text => {
    const content = substituteVariables(element.content, variableContext);
    
    return new fabric.Text(content, {
      left: x,
      top: y,
      width: w,
      height: h,
      fontSize: element.fontSize || 12,
      fontFamily: element.fontFamily || 'Arial',
      fill: element.color || '#000000',
      textAlign: element.textAlign || 'left',
      id: element.id,
      selectable: true,
      evented: true
    });
  };

  const createBarcodeObject = async (element: any, x: number, y: number, w: number, h: number): Promise<fabric.Image | null> => {
    try {
      const value = substituteVariables(element.value, variableContext);
      const barcodeDataUrl = await generateRealBarcode({
        symbology: element.symbology || 'code128',
        value,
        widthMm: w,
        heightMm: h,
        quietZoneMm: element.quietZone || 1,
        lineColor: element.foreground || '#000000',
        background: element.background || '#ffffff',
        displayValue: element.displayValue || false
      });

      return new Promise((resolve) => {
        fabric.Image.fromURL(barcodeDataUrl, (img) => {
          img.set({
            left: x,
            top: y,
            width: w,
            height: h,
            id: element.id,
            selectable: true,
            evented: true
          });
          resolve(img);
        });
      });
    } catch (error) {
      console.error('Barcode generation failed:', error);
      return null;
    }
  };

  const createQRObject = async (element: any, x: number, y: number, w: number, h: number): Promise<fabric.Image | null> => {
    try {
      const value = substituteVariables(element.value, variableContext);
      const qrDataUrl = await generateRealQR({
        value,
        sizeMm: Math.min(w, h),
        marginMm: element.margin || 1,
        foreground: element.foreground || '#000000',
        background: element.background || '#ffffff',
        ecc: element.ecc || 'M'
      });

      return new Promise((resolve) => {
        fabric.Image.fromURL(qrDataUrl, (img) => {
          img.set({
            left: x,
            top: y,
            width: w,
            height: h,
            id: element.id,
            selectable: true,
            evented: true
          });
          resolve(img);
        });
      });
    } catch (error) {
      console.error('QR generation failed:', error);
      return null;
    }
  };

  const createImageObject = (element: any, x: number, y: number, w: number, h: number): fabric.Image | null => {
    // Simplified - would load actual image
    return null;
  };

  const createShapeObject = (element: any, x: number, y: number, w: number, h: number): fabric.Rect | null => {
    return new fabric.Rect({
      left: x,
      top: y,
      width: w,
      height: h,
      fill: element.fill || '#000000',
      stroke: element.stroke || 'transparent',
      strokeWidth: element.strokeWidth || 0,
      id: element.id,
      selectable: true,
      evented: true
    });
  };

  const updateElementFromFabric = (fabricObject: fabric.Object) => {
    if (!currentTemplate || !fabricObject.id) return;

    const element = currentTemplate.elements.find(el => el.id === fabricObject.id);
    if (!element) return;

    const newElement = {
      ...element,
      x: fromPx(fabricObject.left || 0, currentTemplate.size.unit),
      y: fromPx(fabricObject.top || 0, currentTemplate.size.unit),
      w: fromPx(fabricObject.width || 0, currentTemplate.size.unit),
      h: fromPx(fabricObject.height || 0, currentTemplate.size.unit),
      rotation: fabricObject.angle || 0,
      opacity: fabricObject.opacity || 1
    };

    const newTemplate = {
      ...currentTemplate,
      elements: currentTemplate.elements.map(el => 
        el.id === element.id ? newElement : el
      )
    };

    setCurrentTemplate(newTemplate);
  };

  const setupGuidesAndGrid = (canvas: fabric.Canvas) => {
    // Setup guides and grid (simplified)
  };

  if (!currentTemplate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-2xl mb-4">📄</div>
          <h3 className="text-lg font-semibold mb-2">No Template Loaded</h3>
          <p className="text-gray-600">Please load a template to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'dark' : ''}`}>
      {/* Phase 2 Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-white border-b border-gray-200">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={!undoRedoManager.current.canUndo()}
            className="h-8 w-8 p-0"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={!undoRedoManager.current.canRedo()}
            className="h-8 w-8 p-0"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Copy/Paste */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!selectedElementId}
            className="h-8 w-8 p-0"
            title="Copy"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCut}
            disabled={!selectedElementId}
            className="h-8 w-8 p-0"
            title="Cut"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePaste}
            disabled={!clipboardManager.current.hasData()}
            className="h-8 w-8 p-0"
            title="Paste"
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Grouping */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGroup}
            disabled={multiSelectManager.current.getSelectionCount() < 2}
            className="h-8 w-8 p-0"
            title="Group"
          >
            <Group className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUngroup}
            disabled={multiSelectManager.current.getSelectionCount() !== 1}
            className="h-8 w-8 p-0"
            title="Ungroup"
          >
            <Ungroup className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Phase 2 Features */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRichTextEditor(true)}
            disabled={selectedElement?.type !== 'text'}
            className="h-8 px-2 text-xs"
            title="Rich Text Editor"
          >
            <Type className="h-4 w-4 mr-1" />
            Rich Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrintPreview(true)}
            className="h-8 px-2 text-xs"
            title="Print Preview"
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDataImport(true)}
            className="h-8 px-2 text-xs"
            title="Import Data"
          >
            <Database className="h-4 w-4 mr-1" />
            Data
          </Button>
        </div>

        <div className="flex-1" />

        {/* Save/Close */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSave?.(currentTemplate)}
            className="h-8 px-2 text-xs"
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 px-2 text-xs"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Zoom Controls */}
      <ZoomControls
        zoom={zoom}
        minZoom={0.25}
        maxZoom={4}
        onZoomChange={setZoom}
        onZoomIn={() => setZoom(Math.min(4, zoom + 0.25))}
        onZoomOut={() => setZoom(Math.max(0.25, zoom - 0.25))}
        onZoomToFit={() => setZoom(1)}
        onZoomToSelection={() => setZoom(1)}
        onZoomToActualSize={() => setZoom(1)}
        onResetView={() => setZoom(1)}
        onPanToggle={() => setPanning(!panning)}
        showGrid={showGrid}
        onGridToggle={() => setShowGrid(!showGrid)}
        showRulers={showRulers}
        onRulersToggle={() => setShowRulers(!showRulers)}
        showGuides={showGuides}
        onGuidesToggle={() => setShowGuides(!showGuides)}
        showSafeArea={showSafeArea}
        onSafeAreaToggle={() => setShowSafeArea(!showSafeArea)}
        showBleedArea={showBleedArea}
        onBleedAreaToggle={() => setShowBleedArea(!showBleedArea)}
        isPanning={panning}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Elements/Layers */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="elements">Elements</TabsTrigger>
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
            </TabsList>

            <TabsContent value="elements" className="p-4">
              <div className="space-y-2">
                <h3 className="font-medium mb-3">Add Elements</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-12 flex flex-col items-center gap-1">
                    <Type className="h-4 w-4" />
                    <span className="text-xs">Text</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-12 flex flex-col items-center gap-1">
                    <Image className="h-4 w-4" />
                    <span className="text-xs">Image</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-12 flex flex-col items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs">Barcode</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-12 flex flex-col items-center gap-1">
                    <QrCode className="h-4 w-4" />
                    <span className="text-xs">QR Code</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-12 flex flex-col items-center gap-1">
                    <Square className="h-4 w-4" />
                    <span className="text-xs">Shape</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-12 flex flex-col items-center gap-1">
                    <Table className="h-4 w-4" />
                    <span className="text-xs">Table</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layers" className="flex-1">
              <LayersPanel
                elements={currentTemplate.elements}
                selectedElementId={selectedElementId}
                onElementSelect={setSelectedElementId}
                onElementUpdate={(updates) => {
                  // Handle element updates
                }}
                onElementDelete={(id) => {
                  // Handle element deletion
                }}
                onElementDuplicate={(id) => {
                  // Handle element duplication
                }}
                onElementMove={(id, direction) => {
                  // Handle element reordering
                }}
              />
            </TabsContent>

            <TabsContent value="tools" className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">View Options</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Grid</span>
                      <Button
                        variant={showGrid ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowGrid(!showGrid)}
                        className="h-6 w-6 p-0"
                      >
                        {showGrid ? <Eye className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rulers</span>
                      <Button
                        variant={showRulers ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowRulers(!showRulers)}
                        className="h-6 w-6 p-0"
                      >
                        {showRulers ? <Eye className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Guides</span>
                      <Button
                        variant={showGuides ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowGuides(!showGuides)}
                        className="h-6 w-6 p-0"
                      >
                        {showGuides ? <Eye className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">Data Sources</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDataImport(true)}
                      className="w-full"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVariables(!showVariables)}
                      className="w-full"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Variables
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas Area */}
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
              onRulerClick={(position, axis) => {
                // Handle ruler click
              }}
            />
            <Guides
              width={currentTemplate.size.width}
              height={currentTemplate.size.height}
              unit={currentTemplate.size.unit}
              zoom={zoom}
              showGuides={showGuides}
              guides={guides}
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
              onGuideMove={(id, position) => {
                // Handle guide move
              }}
              onGuideDelete={(id) => {
                // Handle guide delete
              }}
            />
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full relative z-10"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>

        {/* Right Panel - Inspector */}
        <div className="w-80 border-l border-gray-200">
          <InspectorPanel
            selectedElement={currentTemplate.elements.find(el => el.id === selectedElementId) || null}
            onElementUpdate={(updates) => {
              // Handle element updates
            }}
            templateUnit={currentTemplate.size.unit}
          />
        </div>
      </div>

      {/* Phase 2 Modals */}
      {showRichTextEditor && (
        <RichTextEditor
          content=""
          style={{
            fontFamily: 'Arial',
            fontSize: 12,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
            color: '#000000',
            backgroundColor: 'transparent',
            letterSpacing: 0,
            lineHeight: 1.2,
            textTransform: 'none'
          }}
          onContentChange={(content) => {
            // Handle content change
          }}
          onStyleChange={(style) => {
            // Handle style change
          }}
          onClose={() => setShowRichTextEditor(false)}
          isVisible={showRichTextEditor}
        />
      )}

      {showPrintPreview && (
        <PrintPreview
          template={currentTemplate}
          onClose={() => setShowPrintPreview(false)}
          sampleData={[variableContext]}
        />
      )}
    </div>
  );
};

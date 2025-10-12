/**
 * Main Label Editor component
 * Integrates all sub-components and provides the complete label editing experience
 */

import React, { useEffect, useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Download, 
  Printer, 
  FileText, 
  Eye, 
  EyeOff,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Settings,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Components
import { Canvas } from './Canvas';
import { ToolsPanel } from './ToolsPanel';
import { InspectorPanel } from './InspectorPanel';
import { LayersPanel } from './LayersPanel';
import { DataBinding } from './DataBinding';

// Hooks
import { useCanvasStore } from '../hooks/useCanvasStore';
import { usePrint } from '../hooks/usePrint';
import { useExport } from '../hooks/useExport';

// Types
import { LabelElement, SampleData, LabelSize, DEFAULT_LABEL_SIZE } from '../types';

interface LabelEditorProps {
  sampleData?: SampleData | null;
  availableSamples?: SampleData[];
  initialElements?: LabelElement[];
  labelSize?: LabelSize;
  onSave?: (elements: LabelElement[], labelSize: LabelSize) => void;
  onCancel?: () => void;
  className?: string;
}

export const LabelEditor: React.FC<LabelEditorProps> = ({
  sampleData,
  availableSamples = [],
  initialElements = [],
  labelSize = DEFAULT_LABEL_SIZE,
  onSave,
  onCancel,
  className = '',
}) => {
  // Canvas store
  const {
    elements,
    selectedElements,
    canvasState,
    activeTool,
    setElements,
    setSelectedElements,
    setCanvasState,
    setActiveTool,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    toggleVisibility,
    toggleLock,
    alignElements,
    distributeElements,
    flipElements,
    rotateElements,
    groupElements,
    ungroupElements,
    copyToClipboard,
    pasteFromClipboard,
    canPaste,
  } = useCanvasStore();

  // Print and export hooks
  const { printLabel, printTestPaper, isPrinting, printError } = usePrint({
    elements,
    labelSize,
    sampleData,
  });

  const { exportPNG, exportSVG, exportPDF, isExporting, exportError } = useExport({
    elements,
    labelSize,
    sampleData,
  });

  // Local state
  const [selectedElement, setSelectedElement] = useState<LabelElement | null>(null);
  const [showDataBinding, setShowDataBinding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize elements
  useEffect(() => {
    if (initialElements.length > 0) {
      setElements(initialElements);
    }
  }, [initialElements, setElements]);

  // Update selected element when selection changes
  useEffect(() => {
    if (selectedElements.length === 1) {
      const element = elements.find(el => el.id === selectedElements[0]);
      setSelectedElement(element || null);
    } else {
      setSelectedElement(null);
    }
  }, [selectedElements, elements]);

  // Handle element creation
  const handleAddElement = useCallback((type: LabelElement['type'], content?: string) => {
    const newElement: LabelElement = {
      id: `${type}-${Date.now()}`,
      type,
      x: 10, // Default position
      y: 10,
      width: type === 'text' ? 50 : type === 'shape' ? 30 : 40,
      height: type === 'text' ? 15 : type === 'shape' ? 30 : 40,
      rotation: 0,
      content: content || getDefaultContent(type),
      style: getDefaultStyle(type),
      visible: true,
      locked: false,
      zIndex: elements.length + 1,
    };

    addElement(newElement);
    setSelectedElements([newElement.id]);
    addToHistory();
  }, [addElement, setSelectedElements, addToHistory, elements.length]);

  // Get default content for element type
  const getDefaultContent = (type: LabelElement['type']): string => {
    switch (type) {
      case 'text':
        return 'New Text';
      case 'shape':
        return 'rectangle';
      case 'line':
        return 'line';
      case 'barcode':
        return '123456789012';
      case 'qr':
        return 'QR Code Content';
      case 'table':
        return 'table-3';
      case 'variable':
        return '{{Variable}}';
      default:
        return '';
    }
  };

  // Get default style for element type
  const getDefaultStyle = (type: LabelElement['type']) => {
    switch (type) {
      case 'text':
        return {
          fontSize: 12,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          color: '#000000',
          textAlign: 'left' as const,
        };
      case 'shape':
        return {
          backgroundColor: '#f0f0f0',
          borderColor: '#000000',
          borderWidth: 1,
        };
      case 'barcode':
        return {
          backgroundColor: '#ffffff',
          borderColor: '#000000',
          borderWidth: 1,
          barcodeType: 'code128' as const,
        };
      case 'qr':
        return {
          backgroundColor: '#ffffff',
          borderColor: '#000000',
          borderWidth: 1,
          errorCorrectionLevel: 'M' as const,
        };
      case 'table':
        return {
          backgroundColor: '#ffffff',
          borderColor: '#000000',
          borderWidth: 1,
          cellPadding: 1,
        };
      default:
        return {};
    }
  };

  // Handle element updates
  const handleElementUpdate = useCallback((element: LabelElement) => {
    updateElement(element.id, element);
  }, [updateElement]);

  // Handle element selection
  const handleElementSelect = useCallback((elementId: string, multiSelect = false) => {
    if (multiSelect) {
      if (selectedElements.includes(elementId)) {
        setSelectedElements(selectedElements.filter(id => id !== elementId));
      } else {
        setSelectedElements([...selectedElements, elementId]);
      }
    } else {
      setSelectedElements([elementId]);
    }
  }, [selectedElements, setSelectedElements]);

  // Handle element deletion
  const handleElementDelete = useCallback((elementId: string) => {
    deleteElement(elementId);
    setSelectedElements(selectedElements.filter(id => id !== elementId));
    addToHistory();
  }, [deleteElement, selectedElements, setSelectedElements, addToHistory]);

  // Handle element duplication
  const handleElementDuplicate = useCallback((elementId: string) => {
    duplicateElement(elementId);
    addToHistory();
  }, [duplicateElement, addToHistory]);

  // Handle alignment
  const handleAlignElements = useCallback((alignment: string) => {
    if (selectedElements.length > 1) {
      alignElements(selectedElements, alignment);
      addToHistory();
    }
  }, [selectedElements, alignElements, addToHistory]);

  // Handle distribution
  const handleDistributeElements = useCallback((direction: 'horizontal' | 'vertical') => {
    if (selectedElements.length > 2) {
      distributeElements(selectedElements, direction);
      addToHistory();
    }
  }, [selectedElements, distributeElements, addToHistory]);

  // Handle flipping
  const handleFlipElements = useCallback((direction: 'horizontal' | 'vertical') => {
    if (selectedElements.length > 0) {
      flipElements(selectedElements, direction);
      addToHistory();
    }
  }, [selectedElements, flipElements, addToHistory]);

  // Handle rotation
  const handleRotateElements = useCallback((angle: number) => {
    if (selectedElements.length > 0) {
      rotateElements(selectedElements, angle);
      addToHistory();
    }
  }, [selectedElements, rotateElements, addToHistory]);

  // Handle grouping
  const handleGroupElements = useCallback(() => {
    if (selectedElements.length > 1) {
      groupElements(selectedElements);
      addToHistory();
    }
  }, [selectedElements, groupElements, addToHistory]);

  // Handle ungrouping
  const handleUngroupElements = useCallback(() => {
    if (selectedElements.length === 1) {
      const element = elements.find(el => el.id === selectedElements[0]);
      if (element?.groupId) {
        ungroupElements(element.groupId);
        addToHistory();
      }
    }
  }, [selectedElements, elements, ungroupElements, addToHistory]);

  // Handle layer operations
  const handleBringToFront = useCallback((elementId: string) => {
    bringToFront(elementId);
    addToHistory();
  }, [bringToFront, addToHistory]);

  const handleSendToBack = useCallback((elementId: string) => {
    sendToBack(elementId);
    addToHistory();
  }, [sendToBack, addToHistory]);

  const handleBringForward = useCallback((elementId: string) => {
    bringForward(elementId);
    addToHistory();
  }, [bringForward, addToHistory]);

  const handleSendBackward = useCallback((elementId: string) => {
    sendBackward(elementId);
    addToHistory();
  }, [sendBackward, addToHistory]);

  // Handle visibility and locking
  const handleToggleVisibility = useCallback((elementId: string) => {
    toggleVisibility(elementId);
    addToHistory();
  }, [toggleVisibility, addToHistory]);

  const handleToggleLock = useCallback((elementId: string) => {
    toggleLock(elementId);
    addToHistory();
  }, [toggleLock, addToHistory]);

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(elements, labelSize);
      toast.success('Label saved successfully');
    }
  }, [elements, labelSize, onSave]);

  // Handle export
  const handleExport = useCallback(async (format: 'png' | 'svg' | 'pdf') => {
    try {
      let blob: Blob;
      switch (format) {
        case 'png':
          blob = await exportPNG();
          break;
        case 'svg':
          blob = await exportSVG();
          break;
        case 'pdf':
          blob = await exportPDF();
          break;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `label-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} exported successfully`);
    } catch (error) {
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [exportPNG, exportSVG, exportPDF]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              if (canRedo()) redo();
            } else {
              if (canUndo()) undo();
            }
            break;
          case 'y':
            event.preventDefault();
            if (canRedo()) redo();
            break;
          case 's':
            event.preventDefault();
            handleSave();
            break;
          case 'c':
            event.preventDefault();
            if (selectedElements.length > 0) {
              const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));
              copyToClipboard(selectedElementsData);
            }
            break;
          case 'v':
            event.preventDefault();
            if (canPaste()) {
              pasteFromClipboard();
              addToHistory();
            }
            break;
        }
      } else {
        switch (event.key) {
          case 'Delete':
          case 'Backspace':
            if (selectedElements.length > 0) {
              selectedElements.forEach(id => handleElementDelete(id));
            }
            break;
          case 'Escape':
            setSelectedElements([]);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, handleSave, selectedElements, elements, copyToClipboard, canPaste, pasteFromClipboard, addToHistory, handleElementDelete, setSelectedElements]);

  return (
    <div className={`h-screen flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Label Editor</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={!canUndo()}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={!canRedo()}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDataBinding(!showDataBinding)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Data Binding
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="outline"
            size="sm"
            onClick={printLabel}
            disabled={isPrinting}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('png')}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tools */}
        <div className="w-80 border-r bg-gray-50 overflow-y-auto">
          <div className="p-4">
            <ToolsPanel
              activeTool={activeTool}
              onToolChange={setActiveTool}
              onAddElement={handleAddElement}
              onDuplicateSelected={() => selectedElements.forEach(id => handleElementDuplicate(id))}
              onDeleteSelected={() => selectedElements.forEach(id => handleElementDelete(id))}
              onGroupSelected={handleGroupElements}
              onUngroupSelected={handleUngroupElements}
              onAlignSelected={handleAlignElements}
              onDistributeSelected={handleDistributeElements}
              onFlipSelected={handleFlipElements}
              onRotateSelected={handleRotateElements}
              onToggleVisibility={handleToggleVisibility}
              onToggleLock={handleToggleLock}
              selectedElements={selectedElements}
              elements={elements}
            />
          </div>
        </div>

        {/* Center Panel - Canvas */}
        <div className="flex-1 flex flex-col">
          <Canvas
            elements={elements}
            selectedElements={selectedElements}
            onElementsChange={setElements}
            onSelectionChange={setSelectedElements}
            onElementUpdate={handleElementUpdate}
            labelSize={labelSize}
            canvasState={canvasState}
            onCanvasStateChange={setCanvasState}
            className="flex-1 p-4"
          />
        </div>

        {/* Right Panel - Inspector and Layers */}
        <div className="w-80 border-l bg-gray-50 overflow-y-auto">
          <div className="p-4 space-y-4">
            <Tabs defaultValue="inspector" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="inspector">Inspector</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
              </TabsList>
              
              <TabsContent value="inspector">
                <InspectorPanel
                  selectedElement={selectedElement}
                  onElementUpdate={handleElementUpdate}
                  onDuplicateElement={handleElementDuplicate}
                  onDeleteElement={handleElementDelete}
                />
              </TabsContent>
              
              <TabsContent value="layers">
                <LayersPanel
                  elements={elements}
                  selectedElements={selectedElements}
                  onElementSelect={handleElementSelect}
                  onElementUpdate={handleElementUpdate}
                  onElementDelete={handleElementDelete}
                  onElementDuplicate={handleElementDuplicate}
                  onElementReorder={() => {}} // TODO: Implement reordering
                  onElementRename={() => {}} // TODO: Implement renaming
                  onToggleVisibility={handleToggleVisibility}
                  onToggleLock={handleToggleLock}
                  onBringToFront={handleBringToFront}
                  onSendToBack={handleSendToBack}
                  onBringForward={handleBringForward}
                  onSendBackward={handleSendBackward}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Data Binding Panel */}
      {showDataBinding && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Data Binding</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDataBinding(false)}
              >
                Close
              </Button>
            </div>
            <DataBinding
              elements={elements}
              sampleData={sampleData}
              availableSamples={availableSamples}
              onSampleDataChange={() => {}} // TODO: Implement sample data change
              onElementsUpdate={setElements}
            />
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Settings</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                Close
              </Button>
            </div>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">Label Size</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Width (mm)</label>
                      <input
                        type="number"
                        value={labelSize.width}
                        onChange={(e) => setCanvasState({ labelSize: { ...labelSize, width: parseFloat(e.target.value) || 50 } })}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Height (mm)</label>
                      <input
                        type="number"
                        value={labelSize.height}
                        onChange={(e) => setCanvasState({ labelSize: { ...labelSize, height: parseFloat(e.target.value) || 30 } })}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {printError && (
        <div className="absolute bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Print Error: {printError}
        </div>
      )}
      {exportError && (
        <div className="absolute bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Export Error: {exportError}
        </div>
      )}
    </div>
  );
};

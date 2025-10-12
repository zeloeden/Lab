/**
 * Fallback Canvas component for the Label Editor
 * Simple HTML5 canvas implementation when Fabric.js is not available
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Grid, 
  Ruler, 
  Eye, 
  EyeOff,
  Hand,
  MousePointer,
  Maximize,
  Minimize
} from 'lucide-react';
import { LabelElement, LabelSize, CanvasState, DEFAULT_LABEL_SIZE, DPI, MM_TO_PX } from '../types';
import { mmToPx, pxToMm } from '../utils/unitConversion';

interface CanvasFallbackProps {
  elements: LabelElement[];
  selectedElements: string[];
  onElementsChange: (elements: LabelElement[]) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  onElementUpdate: (element: LabelElement) => void;
  labelSize?: LabelSize;
  canvasState: CanvasState;
  onCanvasStateChange: (state: Partial<CanvasState>) => void;
  className?: string;
}

export const CanvasFallback: React.FC<CanvasFallbackProps> = ({
  elements,
  selectedElements,
  onElementsChange,
  onSelectionChange,
  onElementUpdate,
  labelSize = DEFAULT_LABEL_SIZE,
  canvasState,
  onCanvasStateChange,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffsetPx, setDragOffsetPx] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Canvas dimensions in pixels
  const canvasWidth = mmToPx(labelSize.width);
  const canvasHeight = mmToPx(labelSize.height);
  const rulerSize = 20; // pixels

  // Render canvas
  const renderCanvas = useCallback(() => {
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
    if (canvasState.gridVisible) {
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

    // Draw elements (convert mm → px)
    elements
      .sort((a, b) => a.zIndex - b.zIndex)
      .forEach(element => {
        if (!element.visible) return;

        ctx.save();
        ctx.globalAlpha = (element.style && element.style.opacity) || 1;

        // Apply transformations
        const elX = mmToPx(element.x);
        const elY = mmToPx(element.y);
        const elW = mmToPx(element.width);
        const elH = mmToPx(element.height);
        const centerX = elX + elW / 2;
        const centerY = elY + elH / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);

        switch (element.type) {
          case 'text':
            ctx.font = `${(element.style && element.style.fontWeight) || 'normal'} ${(element.style && element.style.fontStyle) || 'normal'} ${(element.style && element.style.fontSize) || 12}px ${(element.style && element.style.fontFamily) || 'Arial'}`;
            ctx.fillStyle = (element.style && element.style.color) || '#000000';
            ctx.textAlign = ((element.style && element.style.textAlign) as CanvasTextAlign) || 'left';
            ctx.fillText(element.content, elX, elY + ((element.style && element.style.fontSize) || 12));
            break;

          case 'shape':
            if (element.style && element.style.backgroundColor) {
              ctx.fillStyle = element.style.backgroundColor;
              if (element.content === 'circle') {
                ctx.beginPath();
                ctx.arc(centerX, centerY, elW / 2, 0, 2 * Math.PI);
                ctx.fill();
              } else {
                ctx.fillRect(elX, elY, elW, elH);
              }
            }
            
            if (element.style && element.style.borderWidth && element.style.borderColor) {
              ctx.strokeStyle = element.style.borderColor;
              ctx.lineWidth = element.style.borderWidth;
              if (element.content === 'circle') {
                ctx.beginPath();
                ctx.arc(centerX, centerY, elW / 2, 0, 2 * Math.PI);
                ctx.stroke();
              } else {
                ctx.strokeRect(elX, elY, elW, elH);
              }
            }
            break;

          case 'qr':
            // Draw placeholder for QR code
            ctx.fillStyle = (element.style && element.style.backgroundColor) || '#FFFFFF';
            ctx.fillRect(elX, elY, elW, elH);
            ctx.strokeStyle = (element.style && element.style.borderColor) || '#000000';
            ctx.lineWidth = (element.style && element.style.borderWidth) || 1;
            ctx.strokeRect(elX, elY, elW, elH);
            
            // Draw QR pattern placeholder
            ctx.fillStyle = '#000000';
            for (let i = 0; i < elW; i += 4) {
              for (let j = 0; j < elH; j += 4) {
                if ((i + j) % 8 === 0) {
                  ctx.fillRect(elX + i, elY + j, 2, 2);
                }
              }
            }
            break;

          case 'barcode':
            // Draw barcode placeholder
            ctx.fillStyle = (element.style && element.style.backgroundColor) || '#FFFFFF';
            ctx.fillRect(elX, elY, elW, elH);
            ctx.strokeStyle = (element.style && element.style.borderColor) || '#000000';
            ctx.lineWidth = (element.style && element.style.borderWidth) || 1;
            ctx.strokeRect(elX, elY, elW, elH);
            
            // Draw barcode pattern
            ctx.fillStyle = '#000000';
            const barWidth = elW / 20;
            for (let i = 0; i < 20; i++) {
              if (i % 2 === 0) {
                ctx.fillRect(elX + i * barWidth, elY, barWidth, elH);
              }
            }
            break;

          case 'table':
            // Draw table
            const rowCount = parseInt(element.content.replace('table-', '')) || 3;
            const cellHeight = elH / rowCount;
            const cellWidth = elW / 3;
            
            // Draw table background
            ctx.fillStyle = (element.style && element.style.backgroundColor) || '#ffffff';
            ctx.fillRect(elX, elY, elW, elH);
            
            // Draw borders
            ctx.strokeStyle = (element.style && element.style.borderColor) || '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(elX, elY, elW, elH);
            
            // Draw vertical lines
            for (let i = 1; i < 3; i++) {
              ctx.beginPath();
              ctx.moveTo(elX + i * cellWidth, elY);
              ctx.lineTo(elX + i * cellWidth, elY + elH);
              ctx.stroke();
            }
            
            // Draw horizontal lines
            for (let i = 1; i < rowCount; i++) {
              ctx.beginPath();
              ctx.moveTo(elX, elY + i * cellHeight);
              ctx.lineTo(elX + elW, elY + i * cellHeight);
              ctx.stroke();
            }
            
            // Draw cell content
            ctx.fillStyle = '#000000';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const headers = ['25g', '50g', '100g'];
            for (let i = 0; i < rowCount; i++) {
              for (let j = 0; j < 3; j++) {
                const cellX = elX + j * cellWidth + cellWidth / 2;
                const cellY = elY + i * cellHeight + cellHeight / 2;
                ctx.fillText(headers[j], cellX, cellY);
              }
            }
            break;

          default:
            // Generic element
            ctx.fillStyle = (element.style && element.style.backgroundColor) || 'transparent';
            ctx.fillRect(elX, elY, elW, elH);
            ctx.strokeStyle = (element.style && element.style.borderColor) || '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(elX, elY, elW, elH);
        }

        // Draw selection border
        if (selectedElements.includes(element.id)) {
          ctx.strokeStyle = '#007AFF';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(elX - 2, elY - 2, elW + 4, elH + 4);
          ctx.setLineDash([]);
        }

        ctx.restore();
      });
  }, [elements, selectedElements, canvasState.gridVisible, labelSize]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const hitTest = (xPx: number, yPx: number) => {
    // Find topmost element under point (px coordinates)
    return elements
      .sort((a, b) => b.zIndex - a.zIndex)
      .find(el => 
        xPx >= mmToPx(el.x) && xPx <= mmToPx(el.x + el.width) &&
        yPx >= mmToPx(el.y) && yPx <= mmToPx(el.y + el.height) &&
        el.visible
      ) || null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedElement = hitTest(x, y);

    if (clickedElement) {
      onSelectionChange([clickedElement.id]);
    } else {
      onSelectionChange([]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const target = hitTest(x, y);
    if (target) {
      onSelectionChange([target.id]);
      setDraggingId(target.id);
      setDragOffsetPx({ x: x - mmToPx(target.x), y: y - mmToPx(target.y) });
    } else {
      setDraggingId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newXmm = pxToMm(x - dragOffsetPx.x);
    const newYmm = pxToMm(y - dragOffsetPx.y);
    const updated = elements.map(el => el.id === draggingId ? { ...el, x: newXmm, y: newYmm } : el);
    onElementsChange(updated);
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const handleZoomIn = () => {
    onCanvasStateChange({ zoom: Math.min(canvasState.zoom + 25, 800) });
  };

  const handleZoomOut = () => {
    onCanvasStateChange({ zoom: Math.max(canvasState.zoom - 25, 50) });
  };

  const handleZoomFit = () => {
    onCanvasStateChange({ zoom: 100, panX: 0, panY: 0 });
  };

  const toggleGrid = () => {
    onCanvasStateChange({ gridVisible: !canvasState.gridVisible });
  };

  const toggleRulers = () => {
    onCanvasStateChange({ rulersVisible: !canvasState.rulersVisible });
  };

  const toggleGuides = () => {
    onCanvasStateChange({ guidesVisible: !canvasState.guidesVisible });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Canvas Controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          disabled={canvasState.zoom <= 50}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          disabled={canvasState.zoom >= 800}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomFit}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant={canvasState.gridVisible ? "default" : "outline"}
          size="sm"
          onClick={toggleGrid}
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={canvasState.rulersVisible ? "default" : "outline"}
          size="sm"
          onClick={toggleRulers}
        >
          <Ruler className="h-4 w-4" />
        </Button>
        <Button
          variant={canvasState.guidesVisible ? "default" : "outline"}
          size="sm"
          onClick={toggleGuides}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-2 left-2 z-10">
        <Badge variant="secondary">
          {canvasState.zoom}%
        </Badge>
      </div>

      {/* Canvas container */}
      <div className="relative bg-white border border-gray-300 rounded-lg overflow-hidden">
        {/* Canvas area */}
        <div className="relative">
          {/* Label outline */}
          <div
            className="absolute border-2 border-dashed border-gray-400 bg-white"
            style={{
              width: canvasWidth,
              height: canvasHeight,
            }}
          >
            {/* Bleed area */}
            {labelSize.bleed && labelSize.bleed > 0 && (
              <div
                className="absolute border border-red-300 bg-red-50 opacity-30"
                style={{
                  top: -mmToPx(labelSize.bleed),
                  left: -mmToPx(labelSize.bleed),
                  width: canvasWidth + 2 * mmToPx(labelSize.bleed),
                  height: canvasHeight + 2 * mmToPx(labelSize.bleed),
                }}
              />
            )}
            
            {/* Safe area */}
            {labelSize.safeArea && labelSize.safeArea > 0 && (
              <div
                className="absolute border border-green-300 bg-green-50 opacity-20"
                style={{
                  top: mmToPx(labelSize.safeArea),
                  left: mmToPx(labelSize.safeArea),
                  width: canvasWidth - 2 * mmToPx(labelSize.safeArea),
                  height: canvasHeight - 2 * mmToPx(labelSize.safeArea),
                }}
              />
            )}
          </div>
          
          {/* HTML5 Canvas */}
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="absolute top-0 left-0 cursor-crosshair"
            style={{
              transform: `scale(${canvasState.zoom / 100}) translate(${canvasState.panX}px, ${canvasState.panY}px)`,
              transformOrigin: 'top left',
            }}
          />
        </div>
      </div>

      {/* Canvas info */}
      <div className="mt-2 text-center">
        <Badge variant="outline">
          {labelSize.width}mm × {labelSize.height}mm @ {DPI} DPI
        </Badge>
      </div>
    </div>
  );
};

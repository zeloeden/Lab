/**
 * Rulers component for label editor
 */

import React, { useEffect, useRef, useState } from 'react';
import { toPx, fromPx } from '@/lib/units';

interface RulersProps {
  width: number;
  height: number;
  unit: 'mm' | 'px' | 'in';
  zoom: number;
  showRulers: boolean;
  gridSize: number;
  showGrid: boolean;
  onRulerClick?: (position: number, axis: 'x' | 'y') => void;
}

export const Rulers: React.FC<RulersProps> = ({
  width,
  height,
  unit,
  zoom,
  showRulers,
  gridSize,
  showGrid,
  onRulerClick
}) => {
  const horizontalRulerRef = useRef<HTMLCanvasElement>(null);
  const verticalRulerRef = useRef<HTMLCanvasElement>(null);
  const [rulerSize, setRulerSize] = useState(20);

  useEffect(() => {
    if (!showRulers) return;

    const drawRuler = (
      canvas: HTMLCanvasElement,
      isHorizontal: boolean,
      rulerWidth: number,
      rulerHeight: number
    ) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = rulerWidth;
      canvas.height = rulerHeight;

      // Clear canvas
      ctx.clearRect(0, 0, rulerWidth, rulerHeight);

      // Set up drawing context
      ctx.font = '10px Arial';
      ctx.fillStyle = '#666';
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 0.5;

      const pixelWidth = toPx(width, unit);
      const pixelHeight = toPx(height, unit);
      const gridSizePx = toPx(gridSize, unit);

      if (isHorizontal) {
        // Draw horizontal ruler
        const scaledWidth = pixelWidth * zoom;
        const step = Math.max(1, Math.floor(gridSizePx * zoom / 10));
        
        // Draw background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, scaledWidth, rulerHeight);

        // Draw border
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, scaledWidth, rulerHeight);

        // Draw tick marks and labels
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        
        for (let i = 0; i <= scaledWidth; i += step) {
          const value = fromPx(i / zoom, unit);
          const x = i;
          
          // Draw tick mark
          ctx.beginPath();
          ctx.moveTo(x, rulerHeight - 8);
          ctx.lineTo(x, rulerHeight);
          ctx.stroke();

          // Draw label for major ticks
          if (i % (step * 5) === 0) {
            const label = formatValue(value, unit);
            ctx.fillText(label, x + 2, rulerHeight - 2);
          }
        }

        // Draw center line
        const centerX = scaledWidth / 2;
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, rulerHeight);
        ctx.stroke();
        ctx.setLineDash([]);

      } else {
        // Draw vertical ruler
        const scaledHeight = pixelHeight * zoom;
        const step = Math.max(1, Math.floor(gridSizePx * zoom / 10));
        
        // Draw background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, rulerWidth, scaledHeight);

        // Draw border
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, rulerWidth, scaledHeight);

        // Draw tick marks and labels
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        
        for (let i = 0; i <= scaledHeight; i += step) {
          const value = fromPx(i / zoom, unit);
          const y = i;
          
          // Draw tick mark
          ctx.beginPath();
          ctx.moveTo(rulerWidth - 8, y);
          ctx.lineTo(rulerWidth, y);
          ctx.stroke();

          // Draw label for major ticks
          if (i % (step * 5) === 0) {
            const label = formatValue(value, unit);
            ctx.save();
            ctx.translate(rulerWidth - 2, y + 4);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(label, 0, 0);
            ctx.restore();
          }
        }

        // Draw center line
        const centerY = scaledHeight / 2;
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(rulerWidth, centerY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };

    if (horizontalRulerRef.current) {
      const pixelWidth = toPx(width, unit);
      drawRuler(horizontalRulerRef.current, true, pixelWidth * zoom, rulerSize);
    }

    if (verticalRulerRef.current) {
      const pixelHeight = toPx(height, unit);
      drawRuler(verticalRulerRef.current, false, rulerSize, pixelHeight * zoom);
    }
  }, [width, height, unit, zoom, showRulers, gridSize]);

  const formatValue = (value: number, unit: string): string => {
    const rounded = Math.round(value * 100) / 100;
    return `${rounded}${unit}`;
  };

  const handleRulerClick = (event: React.MouseEvent, axis: 'x' | 'y') => {
    if (!onRulerClick) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const position = axis === 'x' 
      ? (event.clientX - rect.left) / zoom
      : (event.clientY - rect.top) / zoom;
    
    onRulerClick(position, axis);
  };

  if (!showRulers) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Horizontal Ruler */}
      <div 
        className="absolute top-0 left-0 pointer-events-auto"
        style={{ 
          left: `${rulerSize}px`,
          width: `${toPx(width, unit) * zoom}px`,
          height: `${rulerSize}px`
        }}
      >
        <canvas
          ref={horizontalRulerRef}
          className="w-full h-full cursor-crosshair"
          onClick={(e) => handleRulerClick(e, 'x')}
        />
      </div>

      {/* Vertical Ruler */}
      <div 
        className="absolute top-0 left-0 pointer-events-auto"
        style={{ 
          width: `${rulerSize}px`,
          height: `${toPx(height, unit) * zoom}px`
        }}
      >
        <canvas
          ref={verticalRulerRef}
          className="w-full h-full cursor-crosshair"
          onClick={(e) => handleRulerClick(e, 'y')}
        />
      </div>

      {/* Corner */}
      <div 
        className="absolute top-0 left-0 bg-gray-100 border-r border-b border-gray-300"
        style={{ 
          width: `${rulerSize}px`,
          height: `${rulerSize}px`
        }}
      />
    </div>
  );
};

/**
 * Guides component for label editor
 */

import React, { useState, useEffect, useRef } from 'react';
import { toPx, fromPx } from '@/lib/units';

interface Guide {
  id: string;
  position: number;
  axis: 'x' | 'y';
  color: string;
  isDragging: boolean;
}

interface GuidesProps {
  width: number;
  height: number;
  unit: 'mm' | 'px' | 'in';
  zoom: number;
  showGuides: boolean;
  safeArea?: { x: number; y: number; width: number; height: number };
  bleedArea?: { x: number; y: number; width: number; height: number };
  onGuideMove?: (guideId: string, position: number) => void;
  onGuideDelete?: (guideId: string) => void;
}

export const Guides: React.FC<GuidesProps> = ({
  width,
  height,
  unit,
  zoom,
  showGuides,
  safeArea,
  bleedArea,
  onGuideMove,
  onGuideDelete
}) => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [draggedGuide, setDraggedGuide] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add default guides
  useEffect(() => {
    if (!showGuides || !containerRef.current) return;

    const defaultGuides: Guide[] = [
      {
        id: 'center-x',
        position: width / 2,
        axis: 'x',
        color: '#ff6b6b',
        isDragging: false
      },
      {
        id: 'center-y',
        position: height / 2,
        axis: 'y',
        color: '#ff6b6b',
        isDragging: false
      }
    ];

    setGuides(defaultGuides);
  }, [width, height, showGuides]);

  const addGuide = (position: number, axis: 'x' | 'y') => {
    const newGuide: Guide = {
      id: `guide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position,
      axis,
      color: '#4ecdc4',
      isDragging: false
    };

    setGuides(prev => [...prev, newGuide]);
  };

  const updateGuide = (guideId: string, position: number) => {
    setGuides(prev => 
      prev.map(guide => 
        guide.id === guideId 
          ? { ...guide, position: Math.max(0, Math.min(position, guide.axis === 'x' ? width : height)) }
          : guide
      )
    );
    onGuideMove?.(guideId, position);
  };

  const deleteGuide = (guideId: string) => {
    setGuides(prev => prev.filter(guide => guide.id !== guideId));
    onGuideDelete?.(guideId);
  };

  const handleMouseDown = (e: React.MouseEvent, guideId: string) => {
    e.preventDefault();
    setDraggedGuide(guideId);
    setGuides(prev => 
      prev.map(guide => 
        guide.id === guideId ? { ...guide, isDragging: true } : guide
      )
    );
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedGuide || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const guide = guides.find(g => g.id === draggedGuide);
    if (!guide) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const position = guide.axis === 'x' 
      ? fromPx(mouseX / zoom, unit)
      : fromPx(mouseY / zoom, unit);

    updateGuide(draggedGuide, position);
  };

  const handleMouseUp = () => {
    if (draggedGuide) {
      setGuides(prev => 
        prev.map(guide => 
          guide.id === draggedGuide ? { ...guide, isDragging: false } : guide
        )
      );
      setDraggedGuide(null);
    }
  };

  const handleDoubleClick = (guideId: string) => {
    deleteGuide(guideId);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.detail === 2) { // Double click
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Determine which axis to add guide to based on click position
      const centerX = (toPx(width, unit) * zoom) / 2;
      const centerY = (toPx(height, unit) * zoom) / 2;
      
      if (Math.abs(mouseX - centerX) < Math.abs(mouseY - centerY)) {
        // Closer to vertical center, add horizontal guide
        addGuide(fromPx(mouseY / zoom, unit), 'y');
      } else {
        // Closer to horizontal center, add vertical guide
        addGuide(fromPx(mouseX / zoom, unit), 'x');
      }
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => handleMouseUp();
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggedGuide && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const guide = guides.find(g => g.id === draggedGuide);
        if (!guide) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const position = guide.axis === 'x' 
          ? fromPx(mouseX / zoom, unit)
          : fromPx(mouseY / zoom, unit);

        updateGuide(draggedGuide, position);
      }
    };

    if (draggedGuide) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedGuide, guides, zoom, unit]);

  if (!showGuides) {
    return <div className="absolute inset-0 pointer-events-none" />;
  }

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-auto"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {/* Safe Area */}
      {safeArea && (
        <div
          className="absolute border-2 border-red-500 border-dashed opacity-50"
          style={{
            left: `${toPx(safeArea.x, unit) * zoom}px`,
            top: `${toPx(safeArea.y, unit) * zoom}px`,
            width: `${toPx(safeArea.width, unit) * zoom}px`,
            height: `${toPx(safeArea.height, unit) * zoom}px`,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Bleed Area */}
      {bleedArea && (
        <div
          className="absolute border-2 border-blue-500 border-dashed opacity-50"
          style={{
            left: `${toPx(bleedArea.x, unit) * zoom}px`,
            top: `${toPx(bleedArea.y, unit) * zoom}px`,
            width: `${toPx(bleedArea.width, unit) * zoom}px`,
            height: `${toPx(bleedArea.height, unit) * zoom}px`,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Guides */}
      {containerRef.current && guides.map(guide => {
        const position = toPx(guide.position, unit) * zoom;
        const isVertical = guide.axis === 'x';
        
        return (
          <div
            key={guide.id}
            className={`absolute cursor-move select-none ${
              isVertical ? 'w-0.5 h-full' : 'h-0.5 w-full'
            } ${guide.isDragging ? 'opacity-75' : 'opacity-100'}`}
            style={{
              left: isVertical ? `${position}px` : '0',
              top: isVertical ? '0' : `${position}px`,
              backgroundColor: guide.color,
              zIndex: 10
            }}
            onMouseDown={(e) => handleMouseDown(e, guide.id)}
            onDoubleClick={() => handleDoubleClick(guide.id)}
          >
            {/* Guide label */}
            <div
              className={`absolute bg-white border border-gray-300 px-1 py-0.5 text-xs font-mono ${
                isVertical ? 'left-1 top-0' : 'left-0 -top-6'
              }`}
              style={{ fontSize: '10px' }}
            >
              {Math.round(guide.position * 100) / 100}{unit}
            </div>
          </div>
        );
      })}
    </div>
  );
};

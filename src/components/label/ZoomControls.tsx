/**
 * Advanced zoom and navigation controls for label editor
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCcw, 
  Move, 
  Search,
  Eye,
  EyeOff,
  Grid3X3,
  Ruler,
  Square
} from 'lucide-react';

interface ZoomControlsProps {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  onZoomChange: (zoom: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
  onZoomToSelection: () => void;
  onZoomToActualSize: () => void;
  onResetView: () => void;
  onPanToggle: () => void;
  showGrid: boolean;
  onGridToggle: () => void;
  showRulers: boolean;
  onRulersToggle: () => void;
  showGuides: boolean;
  onGuidesToggle: () => void;
  showSafeArea: boolean;
  onSafeAreaToggle: () => void;
  showBleedArea: boolean;
  onBleedAreaToggle: () => void;
  isPanning: boolean;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  minZoom,
  maxZoom,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onZoomToSelection,
  onZoomToActualSize,
  onResetView,
  onPanToggle,
  showGrid,
  onGridToggle,
  showRulers,
  onRulersToggle,
  showGuides,
  onGuidesToggle,
  showSafeArea,
  onSafeAreaToggle,
  showBleedArea,
  onBleedAreaToggle,
  isPanning
}) => {
  const [zoomInput, setZoomInput] = useState(Math.round(zoom * 100));
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setZoomInput(Math.round(zoom * 100));
  }, [zoom]);

  const handleZoomSliderChange = (value: number[]) => {
    const newZoom = value[0] / 100;
    onZoomChange(newZoom);
  };

  const handleZoomInputChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= minZoom * 100 && numValue <= maxZoom * 100) {
      setZoomInput(numValue);
      onZoomChange(numValue / 100);
    }
  };

  const handleZoomInputBlur = () => {
    setZoomInput(Math.round(zoom * 100));
  };

  const zoomPresets = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1 },
    { label: '125%', value: 1.25 },
    { label: '150%', value: 1.5 },
    { label: '200%', value: 2 },
    { label: '400%', value: 4 }
  ];

  return (
    <div className="flex items-center gap-2 p-2 bg-white border-b border-gray-200">
      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomOut}
          disabled={zoom <= minZoom}
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 min-w-[120px]">
          <Slider
            value={[zoom * 100]}
            onValueChange={handleZoomSliderChange}
            min={minZoom * 100}
            max={maxZoom * 100}
            step={1}
            className="w-16"
          />
          <div className="flex items-center gap-1">
            <Input
              value={zoomInput}
              onChange={(e) => setZoomInput(parseInt(e.target.value) || 0)}
              onBlur={handleZoomInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleZoomInputBlur();
                }
              }}
              className="w-12 h-8 text-xs text-center"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onZoomIn}
          disabled={zoom >= maxZoom}
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Quick Zoom Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomToFit}
          className="h-8 px-2 text-xs"
        >
          Fit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomToSelection}
          className="h-8 px-2 text-xs"
        >
          Selection
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomToActualSize}
          className="h-8 px-2 text-xs"
        >
          100%
        </Button>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* View Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant={isPanning ? "default" : "outline"}
          size="sm"
          onClick={onPanToggle}
          className="h-8 w-8 p-0"
          title="Pan Mode"
        >
          <Move className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetView}
          className="h-8 w-8 p-0"
          title="Reset View"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Display Options */}
      <div className="flex items-center gap-1">
        <Button
          variant={showGrid ? "default" : "outline"}
          size="sm"
          onClick={onGridToggle}
          className="h-8 w-8 p-0"
          title="Toggle Grid"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button
          variant={showRulers ? "default" : "outline"}
          size="sm"
          onClick={onRulersToggle}
          className="h-8 w-8 p-0"
          title="Toggle Rulers"
        >
          <Ruler className="h-4 w-4" />
        </Button>
        <Button
          variant={showGuides ? "default" : "outline"}
          size="sm"
          onClick={onGuidesToggle}
          className="h-8 w-8 p-0"
          title="Toggle Guides"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Area Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant={showSafeArea ? "default" : "outline"}
          size="sm"
          onClick={onSafeAreaToggle}
          className="h-8 px-2 text-xs"
          title="Toggle Safe Area"
        >
          Safe
        </Button>
        <Button
          variant={showBleedArea ? "default" : "outline"}
          size="sm"
          onClick={onBleedAreaToggle}
          className="h-8 px-2 text-xs"
          title="Toggle Bleed Area"
        >
          Bleed
        </Button>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Advanced Controls Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="h-8 px-2 text-xs"
      >
        <Search className="h-4 w-4 mr-1" />
        Advanced
      </Button>

      {/* Advanced Controls Panel */}
      {showAdvanced && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg p-4 z-50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Zoom Presets</Label>
              <div className="grid grid-cols-4 gap-1">
                {zoomPresets.map(preset => (
                  <Button
                    key={preset.label}
                    variant={Math.abs(zoom - preset.value) < 0.01 ? "default" : "outline"}
                    size="sm"
                    onClick={() => onZoomChange(preset.value)}
                    className="h-8 text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">View Options</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Grid</span>
                  <Button
                    variant={showGrid ? "default" : "outline"}
                    size="sm"
                    onClick={onGridToggle}
                    className="h-6 w-6 p-0"
                  >
                    {showGrid ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rulers</span>
                  <Button
                    variant={showRulers ? "default" : "outline"}
                    size="sm"
                    onClick={onRulersToggle}
                    className="h-6 w-6 p-0"
                  >
                    {showRulers ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Guides</span>
                  <Button
                    variant={showGuides ? "default" : "outline"}
                    size="sm"
                    onClick={onGuidesToggle}
                    className="h-6 w-6 p-0"
                  >
                    {showGuides ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

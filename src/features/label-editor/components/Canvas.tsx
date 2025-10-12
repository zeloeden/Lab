/**
 * Canvas component for the Label Editor
 * Handles fabric.js canvas setup, rulers, guides, and zoom/pan functionality
 */

import React from 'react';
import { CanvasFallback } from './CanvasFallback';
import { LabelElement, LabelSize, CanvasState, DEFAULT_LABEL_SIZE } from '../types';

interface CanvasProps {
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

export const Canvas: React.FC<CanvasProps> = (props) => {
  // For now, use the fallback implementation
  // This can be enhanced later to use Fabric.js when it's properly configured
  return <CanvasFallback {...props} />;
};
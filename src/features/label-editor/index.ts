/**
 * Label Editor Feature
 * Main export file for the Label Editor module
 */

// Main component (new location)
export { default as LabelEditor } from './LabelEditor';

// Sub-components
export { Canvas } from './components/Canvas';
export { ToolsPanel } from './components/ToolsPanel';
export { InspectorPanel } from './components/InspectorPanel';
export { LayersPanel } from './components/LayersPanel';
export { DataBinding } from './components/DataBinding';
export { VariablesPicker } from './components/VariablesPicker';

// Hooks
export { useCanvasStore } from './hooks/useCanvasStore';
export { usePrint } from './hooks/usePrint';
export { useExport } from './hooks/useExport';

// Types
export type {
  LabelElement,
  ElementStyle,
  LabelTemplate,
  LabelSize,
  CanvasState,
  HistoryState,
  SampleData,
  PrintSettings,
  ExportSettings,
  ToolType,
  FabricText,
  FabricImage,
  FabricRect,
  FabricCircle,
  FabricLine,
  FabricGroup,
} from './types';

// Utils
export {
  mmToPx,
  pxToMm,
  ptToPx,
  pxToPt,
  mmToPt,
  ptToMm,
  roundTo,
  mmToPxRounded,
  pxToMmRounded,
  formatWithUnit,
  parseValueWithUnit,
  convertUnit,
  getDisplayUnit,
  validateValue,
} from './utils/unitConversion';

export {
  createFabricText,
  createFabricImage,
  createFabricRect,
  createFabricCircle,
  createFabricLine,
  createFabricGroup,
  updateFabricObject,
  fabricObjectToElement,
  applyShadow,
  applyGradient,
  createFabricCanvas,
} from './utils/fabricUtils';

// Constants
export {
  DEFAULT_LABEL_SIZE,
  DPI,
  MM_TO_PX,
  PX_TO_MM,
  DEFAULT_FONT_FAMILIES,
  BARCODE_TYPES,
  QR_ERROR_CORRECTION_LEVELS,
} from './types';

import * as fabric from 'fabric';

// Label Editor Types
export interface LabelElement {
  id: string;
  type: 'text' | 'image' | 'qr' | 'barcode' | 'shape' | 'line' | 'table' | 'variable';
  x: number; // in mm
  y: number; // in mm
  width: number; // in mm
  height: number; // in mm
  rotation: number; // in degrees
  content: string;
  style: ElementStyle;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  groupId?: string;
  fabricObject?: any;
}

export interface ElementStyle {
  // Text styles
  fontSize?: number; // in pt
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  letterSpacing?: number; // in pt
  lineHeight?: number; // multiplier
  direction?: 'ltr' | 'rtl';
  
  // Colors and fills
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number; // in mm
  borderRadius?: number; // in mm
  opacity?: number; // 0-1
  
  // Effects
  shadow?: ShadowStyle;
  gradient?: GradientStyle;
  pattern?: PatternStyle;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light' | 'color-dodge' | 'color-burn' | 'darken' | 'lighten' | 'difference' | 'exclusion';
  
  // Barcode/QR specific
  barcodeType?: 'code128' | 'ean13' | 'ean8' | 'upc';
  quietZone?: number; // in mm
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  scale?: number;
  
  // Table specific
  cellPadding?: number; // in mm
  headerStyle?: ElementStyle;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface ShadowStyle {
  offsetX: number; // in mm
  offsetY: number; // in mm
  blur: number; // in mm
  color: string;
  spread?: number; // in mm
}

export interface GradientStyle {
  type: 'linear' | 'radial';
  colors: Array<{ color: string; position: number }>;
  angle?: number; // for linear gradients
  centerX?: number; // for radial gradients
  centerY?: number; // for radial gradients
}

export interface PatternStyle {
  type: 'solid' | 'dots' | 'stripes' | 'grid';
  color?: string;
  backgroundColor?: string;
  size?: number; // in mm
}

export interface LabelTemplate {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  elements: LabelElement[];
  size: LabelSize;
  printerId: string;
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string; // base64 image
}

export interface LabelSize {
  width: number; // in mm
  height: number; // in mm
  bleed?: number; // in mm
  safeArea?: number; // in mm
}

export interface CanvasState {
  zoom: number; // percentage
  panX: number; // in pixels
  panY: number; // in pixels
  gridVisible: boolean;
  rulersVisible: boolean;
  guidesVisible: boolean;
  snapToGrid: boolean;
  snapToGuides: boolean;
  snapToMargins: boolean;
  selectedElements: string[];
  clipboard: LabelElement[];
}

export interface HistoryState {
  past: LabelElement[][];
  present: LabelElement[];
  future: LabelElement[];
}

export interface SampleData {
  id: string;
  ArabicName: string;
  EnglishName: string;
  SupplierCode: string;
  Price25: number;
  Price50: number;
  Price100: number;
  QRValue: string;
  BarcodeValue: string;
  ExtraFields: Record<string, any>;
}

export interface PrintSettings {
  paperSize: 'A4' | 'A3' | 'Letter' | 'Custom';
  customSize?: { width: number; height: number }; // in mm
  orientation: 'portrait' | 'landscape';
  margin: number; // in mm
  multiUp?: {
    rows: number;
    cols: number;
    spacing: number; // in mm
  };
}

export interface ExportSettings {
  format: 'png' | 'svg' | 'pdf';
  resolution: number; // DPI
  quality: number; // 0-1 for PNG
  includeBleed: boolean;
  includeGuides: boolean;
}

// Fabric.js extensions - simplified for compatibility
export interface FabricText {
  elementId?: string;
  [key: string]: any;
}

export interface FabricImage {
  elementId?: string;
  [key: string]: any;
}

export interface FabricRect {
  elementId?: string;
  [key: string]: any;
}

export interface FabricCircle {
  elementId?: string;
  [key: string]: any;
}

export interface FabricLine {
  elementId?: string;
  [key: string]: any;
}

export interface FabricGroup {
  elementId?: string;
  [key: string]: any;
}

// Tool types
export type ToolType = 'select' | 'text' | 'image' | 'shape' | 'line' | 'barcode' | 'qr' | 'table' | 'variable';

export interface Tool {
  type: ToolType;
  name: string;
  icon: string;
  cursor: string;
  active: boolean;
}

// Event types
export interface CanvasEvent {
  type: 'selection' | 'object:added' | 'object:removed' | 'object:modified' | 'object:moving' | 'object:scaling' | 'object:rotating';
  target?: any;
  selected?: any[];
}

// API types
export interface TemplateApiResponse {
  success: boolean;
  data?: LabelTemplate | LabelTemplate[];
  error?: string;
}

export interface SaveTemplateRequest {
  name: string;
  description?: string;
  tags: string[];
  elements: LabelElement[];
  size: LabelSize;
  printerId: string;
}

export interface UpdateTemplateRequest extends SaveTemplateRequest {
  id: string;
}

// Constants
export const DEFAULT_LABEL_SIZE: LabelSize = {
  width: 50, // mm
  height: 30, // mm
  bleed: 2, // mm
  safeArea: 1.5 // mm
};

export const DPI = 300; // Dots per inch for print
export const MM_TO_PX = DPI / 25.4; // Convert mm to pixels at 300 DPI
export const PX_TO_MM = 25.4 / DPI; // Convert pixels to mm at 300 DPI

export const DEFAULT_FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Calibri',
  'Arial Unicode MS', // For Arabic support
  'Noto Sans Arabic' // For Arabic support
];

export const BARCODE_TYPES = [
  { value: 'code128', label: 'Code 128' },
  { value: 'ean13', label: 'EAN-13' },
  { value: 'ean8', label: 'EAN-8' },
  { value: 'upc', label: 'UPC-A' }
] as const;

export const QR_ERROR_CORRECTION_LEVELS = [
  { value: 'L', label: 'Low (7%)' },
  { value: 'M', label: 'Medium (15%)' },
  { value: 'Q', label: 'Quartile (25%)' },
  { value: 'H', label: 'High (30%)' }
] as const;

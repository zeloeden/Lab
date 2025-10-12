/**
 * Label template data model with comprehensive type definitions
 */

// Define core types locally to avoid circular dependencies
export type Unit = 'mm' | 'px' | 'in';
export type Dpi = 203 | 300 | 600;

// Re-export types from label-types for convenience
export type { LabelTemplate, LabelElement, BaseElement, TextElement, ImageElement, BarcodeElement, QRElement, ShapeElement, TableElement, TextStyle } from './label-types';

/**
 * Enhanced label template with additional metadata
 */
export interface EnhancedLabelTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  size: {
    width: number;
    height: number;
    unit: Unit;
    dpi: Dpi;
  };
  margins?: {
    safe?: number;
    bleed?: number;
    unit: Unit;
  };
  elements: EnhancedLabelElement[];
  styles?: Record<string, TextStyle>;
  variables?: string[];
  repeaters?: RepeaterConfig[];
  version: number;
  isLocked?: boolean;
  isPublic?: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  lastUsedAt?: Date;
  usageCount?: number;
}

/**
 * Enhanced label element with additional properties
 */
export type EnhancedLabelElement =
  | EnhancedTextElement
  | EnhancedImageElement
  | EnhancedBarcodeElement
  | EnhancedQRElement
  | EnhancedShapeElement
  | EnhancedTableElement;

export interface EnhancedBaseElement {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number; // mm
  rotation?: number;
  locked?: boolean;
  visible?: boolean;
  zIndex?: number;
  opacity?: number;
  name?: string;
  groupId?: string;
  dataBinding?: DataBinding;
  animation?: AnimationConfig;
  constraints?: ElementConstraints;
}

export interface EnhancedTextElement extends EnhancedBaseElement {
  type: 'text';
  content: string;
  styleKey?: string;
  rtl?: boolean;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number;
  wordSpacing?: number;
  textDecoration?: 'none' | 'underline' | 'line-through' | 'overline';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  color?: string;
  backgroundColor?: string;
  padding?: { top: number; right: number; bottom: number; left: number };
  border?: BorderConfig;
  shadow?: ShadowConfig;
  maxLines?: number;
  overflow?: 'visible' | 'hidden' | 'ellipsis';
}

export interface EnhancedImageElement extends EnhancedBaseElement {
  type: 'image';
  src: string;
  alt?: string;
  fit?: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity?: number;
  filters?: ImageFilters;
  crop?: CropConfig;
}

export interface EnhancedBarcodeElement extends EnhancedBaseElement {
  type: 'barcode';
  symbology: 'code128' | 'ean13' | 'gs1-128' | 'code39' | 'code93' | 'codabar' | 'upc-a' | 'upc-e' | 'ean8' | 'ean13';
  value: string;
  options?: BarcodeOptions;
  displayValue?: boolean;
  displayValuePosition?: 'top' | 'bottom';
  displayValueFontSize?: number;
  displayValueFontFamily?: string;
  quietZone?: number;
  background?: string;
  foreground?: string;
}

export interface EnhancedQRElement extends EnhancedBaseElement {
  type: 'qr';
  value: string;
  ecc?: 'L' | 'M' | 'Q' | 'H';
  size?: number;
  margin?: number;
  background?: string;
  foreground?: string;
  logo?: string;
  logoSize?: number;
  logoMargin?: number;
}

export interface EnhancedShapeElement extends EnhancedBaseElement {
  type: 'shape';
  shape: 'rectangle' | 'circle' | 'ellipse' | 'line' | 'polygon' | 'path';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDashArray?: number[];
  strokeLineCap?: 'butt' | 'round' | 'square';
  strokeLineJoin?: 'miter' | 'round' | 'bevel';
  points?: Array<{ x: number; y: number }>;
  path?: string; // SVG path for custom shapes
  cornerRadius?: number; // for rectangles
  startAngle?: number; // for arcs
  endAngle?: number; // for arcs
}

export interface EnhancedTableElement extends EnhancedBaseElement {
  type: 'table';
  dataSource: string;
  columns: TableColumn[];
  rowHeight?: number;
  headerHeight?: number;
  headerStyle?: string;
  cellStyle?: string;
  alternateRowStyle?: string;
  border?: BorderConfig;
  padding?: { top: number; right: number; bottom: number; left: number };
  showHeader?: boolean;
  showBorders?: boolean;
  alternatingRows?: boolean;
  sortable?: boolean;
  filterable?: boolean;
}

/**
 * Supporting interfaces
 */
export interface DataBinding {
  field: string;
  format?: string;
  defaultValue?: string;
  validation?: ValidationRule[];
  transform?: string; // JavaScript expression
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message?: string;
  validator?: string; // JavaScript function
}

export interface AnimationConfig {
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'custom';
  duration: number;
  delay?: number;
  easing?: string;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  iterationCount?: number | 'infinite';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface ElementConstraints {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
  lockAspectRatio?: boolean;
  resizable?: boolean;
  movable?: boolean;
  rotatable?: boolean;
  selectable?: boolean;
}

export interface BorderConfig {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset';
  color: string;
  radius?: number;
}

export interface ShadowConfig {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset?: boolean;
}

export interface ImageFilters {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number;
  grayscale?: boolean;
  sepia?: boolean;
  invert?: boolean;
}

export interface CropConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BarcodeOptions {
  width?: number;
  height?: number;
  margin?: number;
  displayValue?: boolean;
  fontSize?: number;
  font?: string;
  textAlign?: 'left' | 'center' | 'right';
  textPosition?: 'bottom' | 'top';
  textMargin?: number;
  background?: string;
  lineColor?: string;
  format?: string;
}

export interface TableColumn {
  id: string;
  header: string;
  field: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  formatter?: string; // JavaScript function
  style?: string;
}

export interface RepeaterConfig {
  id: string;
  name: string;
  dataSource: string;
  template: string; // Element ID to repeat
  direction: 'horizontal' | 'vertical' | 'grid';
  spacing: number;
  maxItems?: number;
  wrap?: boolean;
  align?: 'start' | 'center' | 'end' | 'stretch';
}

/**
 * Template metadata for management
 */
export interface TemplateMetadata {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  thumbnail?: string;
  preview?: string;
  isPublic: boolean;
  isLocked: boolean;
  version: number;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  lastUsedAt?: Date;
  usageCount: number;
  elementCount: number;
  variableCount: number;
  styleCount: number;
  fileSize: number;
}

/**
 * Template statistics
 */
export interface TemplateStats {
  elementCount: number;
  variableCount: number;
  styleCount: number;
  repeaterCount: number;
  lastModified: Date;
  usageCount: number;
  fileSize: number;
}

/**
 * Print job configuration
 */
export interface PrintJob {
  id: string;
  templateId: string;
  data: Record<string, any>[];
  copies: number;
  printer?: string;
  settings: PrintSettings;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface PrintSettings {
  dpi: Dpi;
  colorMode: 'monochrome' | 'color';
  paperSize: string;
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  scaling: number;
  quality: 'draft' | 'normal' | 'high';
}

/**
 * Asset management
 */
export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'font' | 'icon' | 'template';
  mimeType: string;
  size: number;
  url: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt: Date;
  createdBy: string;
}

/**
 * User preferences
 */
export interface UserPreferences {
  defaultUnit: Unit;
  defaultDpi: Dpi;
  gridSize: number;
  snapToGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  showSafeArea: boolean;
  showBleedArea: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  shortcuts: Record<string, string>;
}

/**
 * Validation schemas
 */
export const validateTemplate = (template: EnhancedLabelTemplate): string[] => {
  const errors: string[] = [];
  
  if (!template.name?.trim()) {
    errors.push('Template name is required');
  }
  
  if (!template.size?.width || template.size.width <= 0) {
    errors.push('Template width must be greater than 0');
  }
  
  if (!template.size?.height || template.size.height <= 0) {
    errors.push('Template height must be greater than 0');
  }
  
  if (!template.elements || template.elements.length === 0) {
    errors.push('Template must have at least one element');
  }
  
  // Validate elements
  template.elements?.forEach((element, index) => {
    if (!element.id) {
      errors.push(`Element ${index + 1} is missing an ID`);
    }
    
    if (element.x < 0 || element.y < 0) {
      errors.push(`Element ${element.id} has invalid position`);
    }
    
    if (element.w <= 0 || element.h <= 0) {
      errors.push(`Element ${element.id} has invalid dimensions`);
    }
  });
  
  return errors;
};

/**
 * Parse template variables from content
 */
export const parseTemplateVariables = (content: string): string[] => {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    variables.push(match[1]);
  }
  
  return [...new Set(variables)]; // Remove duplicates
};

/**
 * Template factory functions
 */
export const createEmptyTemplate = (name: string): EnhancedLabelTemplate => {
  const now = new Date();
  return {
    id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    size: { width: 100, height: 50, unit: 'mm', dpi: 300 },
    margins: { safe: 2, bleed: 1, unit: 'mm' },
    elements: [],
    styles: {},
    variables: [],
    repeaters: [],
    version: 1,
    isLocked: false,
    isPublic: false,
    createdAt: now,
    createdBy: 'system',
    updatedAt: now,
    updatedBy: 'system',
    usageCount: 0
  };
};

export const createElement = (type: EnhancedLabelElement['type'], id?: string): EnhancedLabelElement => {
  const elementId = id || `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const baseElement: EnhancedBaseElement = {
    id: elementId,
    type,
    x: 10,
    y: 10,
    w: 50,
    h: 20,
    rotation: 0,
    locked: false,
    visible: true,
    zIndex: 0,
    opacity: 1,
    name: `New ${type}`,
    constraints: {
      resizable: true,
      movable: true,
      rotatable: true,
      selectable: true
    }
  };

  switch (type) {
    case 'text':
      return {
        ...baseElement,
        type: 'text',
        content: 'New Text',
        styleKey: 'default',
        rtl: false,
        textAlign: 'left',
        verticalAlign: 'top',
        lineHeight: 1.2,
        letterSpacing: 0,
        wordSpacing: 0,
        textDecoration: 'none',
        textTransform: 'none',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        maxLines: 0,
        overflow: 'visible'
      } as EnhancedTextElement;

    case 'image':
      return {
        ...baseElement,
        type: 'image',
        src: '',
        alt: 'Image',
        fit: 'contain',
        position: 'center',
        opacity: 1
      } as EnhancedImageElement;

    case 'barcode':
      return {
        ...baseElement,
        type: 'barcode',
        symbology: 'code128',
        value: '{{barcode}}',
        displayValue: true,
        displayValuePosition: 'bottom',
        displayValueFontSize: 10,
        displayValueFontFamily: 'Arial',
        quietZone: 10,
        background: '#ffffff',
        foreground: '#000000'
      } as EnhancedBarcodeElement;

    case 'qr':
      return {
        ...baseElement,
        type: 'qr',
        value: '{{qrCode}}',
        ecc: 'M',
        size: 100,
        margin: 4,
        background: '#ffffff',
        foreground: '#000000'
      } as EnhancedQRElement;

    case 'shape':
      return {
        ...baseElement,
        type: 'shape',
        shape: 'rectangle',
        fill: '#000000',
        stroke: '#000000',
        strokeWidth: 1,
        strokeLineCap: 'butt',
        strokeLineJoin: 'miter',
        cornerRadius: 0
      } as EnhancedShapeElement;

    case 'table':
      return {
        ...baseElement,
        type: 'table',
        dataSource: 'items',
        columns: [
          { id: 'col1', header: 'Column 1', field: 'field1', width: 50, align: 'left' }
        ],
        rowHeight: 20,
        headerHeight: 25,
        showHeader: true,
        showBorders: true,
        alternatingRows: false,
        sortable: false,
        filterable: false
      } as EnhancedTableElement;

    default:
      throw new Error(`Unknown element type: ${type}`);
  }
};

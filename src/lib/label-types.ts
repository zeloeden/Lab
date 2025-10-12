// Label Template System Types
export type Unit = 'mm' | 'px' | 'in';
export type Dpi = 203 | 300 | 600;

export interface LabelTemplate {
  id: string;
  name: string;
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
  elements: LabelElement[];
  styles?: Record<string, TextStyle>;
  variables?: string[];
  version: number;
  isLocked?: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

export type LabelElement =
  | TextElement
  | ImageElement
  | BarcodeElement
  | QRElement
  | ShapeElement
  | TableElement;

export interface BaseElement {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number; // mm
  rotation?: number;
  locked?: boolean;
  zIndex?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string; // supports {{field}}
  styleKey?: string; // reference to saved style
  rtl?: boolean;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt?: string;
  fit?: 'contain' | 'cover' | 'fill' | 'scale-down';
  opacity?: number;
}

export interface BarcodeElement extends BaseElement {
  type: 'barcode';
  symbology: 'code128' | 'ean13' | 'gs1-128';
  value: string; // supports {{field}}
  options?: { 
    showText?: boolean; 
    quietZone?: number;
    height?: number;
  };
}

export interface QRElement extends BaseElement {
  type: 'qr';
  value: string; // supports {{field}}
  ecc?: 'L' | 'M' | 'Q' | 'H';
  size?: number;
  margin?: number;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shape: 'rectangle' | 'circle' | 'line' | 'polygon';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  points?: Array<{ x: number; y: number }>; // for polygon
}

export interface TableElement extends BaseElement {
  type: 'table';
  dataSource: string; // e.g. items[]
  columns: Array<{ 
    header: string; 
    field: string; 
    width: number; 
  }>; // mm widths
  rowHeight?: number;
  headerStyle?: string;
  cellStyle?: string;
}

export interface TextStyle {
  fontFamily?: string;
  fontSize?: number; // pt
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic' | 'oblique';
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: 'none' | 'underline' | 'line-through';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

// Template presets
export const TEMPLATE_PRESETS: Partial<LabelTemplate>[] = [
  {
    name: 'Standard Address Label',
    size: { width: 100, height: 50, unit: 'mm', dpi: 300 },
    margins: { safe: 2, bleed: 1, unit: 'mm' },
    elements: [
      {
        id: 'company-name',
        type: 'text',
        x: 5,
        y: 5,
        w: 90,
        h: 10,
        content: '{{companyName}}',
        styleKey: 'header'
      },
      {
        id: 'address',
        type: 'text',
        x: 5,
        y: 15,
        w: 90,
        h: 30,
        content: '{{address}}',
        styleKey: 'body'
      }
    ],
    styles: {
      header: {
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'left'
      },
      body: {
        fontFamily: 'Arial',
        fontSize: 10,
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left'
      }
    }
  },
  {
    name: 'Product Label with Barcode',
    size: { width: 80, height: 40, unit: 'mm', dpi: 300 },
    margins: { safe: 2, bleed: 1, unit: 'mm' },
    elements: [
      {
        id: 'product-name',
        type: 'text',
        x: 5,
        y: 5,
        w: 50,
        h: 8,
        content: '{{productName}}',
        styleKey: 'product'
      },
      {
        id: 'barcode',
        type: 'barcode',
        x: 5,
        y: 15,
        w: 50,
        h: 20,
        symbology: 'code128',
        value: '{{barcode}}',
        options: { showText: true, height: 15 }
      },
      {
        id: 'price',
        type: 'text',
        x: 60,
        y: 5,
        w: 15,
        h: 8,
        content: '{{price}}',
        styleKey: 'price'
      }
    ],
    styles: {
      product: {
        fontFamily: 'Arial',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'left'
      },
      price: {
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#e74c3c',
        textAlign: 'right'
      }
    }
  }
];

// Utility functions
export const convertUnits = (value: number, from: Unit, to: Unit): number => {
  if (from === to) return value;
  
  const mmToInch = 0.0393701;
  const inchToMm = 25.4;
  
  if (from === 'mm' && to === 'in') {
    return value * mmToInch;
  } else if (from === 'in' && to === 'mm') {
    return value * inchToMm;
  }
  
  return value;
};

export const calculatePixelDimensions = (
  width: number, 
  height: number, 
  unit: Unit, 
  dpi: Dpi
): { width: number; height: number } => {
  const widthInInches = unit === 'mm' ? width * 0.0393701 : width;
  const heightInInches = unit === 'mm' ? height * 0.0393701 : height;
  
  return {
    width: Math.round(widthInInches * dpi),
    height: Math.round(heightInInches * dpi)
  };
};

export const parseTemplateVariables = (content: string): string[] => {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    variables.push(match[1]);
  }
  
  return [...new Set(variables)]; // Remove duplicates
};

export const createDefaultTemplate = (name: string): LabelTemplate => {
  const now = new Date();
  return {
    id: `template_${Date.now()}`,
    name,
    size: { width: 100, height: 50, unit: 'mm', dpi: 300 },
    margins: { safe: 2, bleed: 1, unit: 'mm' },
    elements: [],
    styles: {},
    variables: [],
    version: 1,
    isLocked: false,
    createdAt: now,
    createdBy: 'system',
    updatedAt: now,
    updatedBy: 'system'
  };
};

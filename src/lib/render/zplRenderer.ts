/**
 * ZPL (Zebra Programming Language) renderer for label templates
 * Converts label templates to ZPL commands for thermal printers
 */

import { EnhancedLabelTemplate, EnhancedLabelElement, Unit, Dpi } from '../label-model';
import { toPx, fromPx, convertUnit } from '../units';

export interface ZPLRenderOptions {
  dpi?: Dpi;
  printDensity?: number; // 0-15
  printSpeed?: number; // 1-14 inches per second
  darkness?: number; // -30 to +30
  printMode?: 'tear-off' | 'cut' | 'peel-off';
  homePosition?: { x: number; y: number };
  printPosition?: { x: number; y: number };
}

export interface ZPLRenderResult {
  zpl: string;
  labelCount: number;
  renderTime: number;
}

export class ZPLRenderer {
  private options: ZPLRenderOptions;

  constructor(options: ZPLRenderOptions = {}) {
    this.options = {
      dpi: 203, // Default thermal printer DPI
      printDensity: 8,
      printSpeed: 2,
      darkness: 0,
      printMode: 'tear-off',
      homePosition: { x: 0, y: 0 },
      printPosition: { x: 0, y: 0 },
      ...options
    };
  }

  /**
   * Render template to ZPL
   */
  renderTemplate(template: EnhancedLabelTemplate, data?: Record<string, any>): ZPLRenderResult {
    const startTime = Date.now();
    
    try {
      let zpl = '';
      
      // Start ZPL command
      zpl += '^XA\n'; // Start format
      
      // Set print density and speed
      zpl += `^PR${this.options.printSpeed},${this.options.printDensity}\n`;
      
      // Set darkness
      if (this.options.darkness !== 0) {
        zpl += `^PW${this.options.darkness}\n`;
      }
      
      // Set home position
      const homeX = this.convertToZPLUnits(this.options.homePosition!.x, template.size.unit);
      const homeY = this.convertToZPLUnits(this.options.homePosition!.y, template.size.unit);
      zpl += `^LH${homeX},${homeY}\n`;
      
      // Set print position
      const printX = this.convertToZPLUnits(this.options.printPosition!.x, template.size.unit);
      const printY = this.convertToZPLUnits(this.options.printPosition!.y, template.size.unit);
      zpl += `^FO${printX},${printY}\n`;
      
      // Render elements
      zpl += this.renderElements(template.elements, data, template);
      
      // End ZPL command
      zpl += '^XZ\n'; // End format
      
      const renderTime = Date.now() - startTime;

      return {
        zpl,
        labelCount: 1,
        renderTime
      };
    } catch (error) {
      throw new Error(`ZPL rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Render multiple labels as a batch
   */
  renderBatch(template: EnhancedLabelTemplate, dataArray: Record<string, any>[]): ZPLRenderResult {
    const startTime = Date.now();
    
    try {
      let zpl = '';
      
      // Start ZPL command
      zpl += '^XA\n';
      
      // Set print density and speed
      zpl += `^PR${this.options.printSpeed},${this.options.printDensity}\n`;
      
      // Set darkness
      if (this.options.darkness !== 0) {
        zpl += `^PW${this.options.darkness}\n`;
      }
      
      // Render each label
      for (let i = 0; i < dataArray.length; i++) {
        const data = dataArray[i];
        
        // Set home position for each label
        const homeX = this.convertToZPLUnits(this.options.homePosition!.x, template.size.unit);
        const homeY = this.convertToZPLUnits(this.options.homePosition!.y + (i * template.size.height), template.size.unit);
        zpl += `^LH${homeX},${homeY}\n`;
        
        // Set print position
        const printX = this.convertToZPLUnits(this.options.printPosition!.x, template.size.unit);
        const printY = this.convertToZPLUnits(this.options.printPosition!.y, template.size.unit);
        zpl += `^FO${printX},${printY}\n`;
        
        // Render elements
        zpl += this.renderElements(template.elements, data, template);
        
        // Add print command for each label
        zpl += '^PQ1\n'; // Print quantity 1
      }
      
      // End ZPL command
      zpl += '^XZ\n';
      
      const renderTime = Date.now() - startTime;

      return {
        zpl,
        labelCount: dataArray.length,
        renderTime
      };
    } catch (error) {
      throw new Error(`ZPL batch rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert units to ZPL dots (203 DPI)
   */
  private convertToZPLUnits(value: number, unit: Unit): number {
    // Convert to inches first, then to dots at 203 DPI
    const inches = convertUnit(value, unit, 'in');
    return Math.round(inches * 203);
  }

  /**
   * Render all elements
   */
  private renderElements(
    elements: EnhancedLabelElement[],
    data: Record<string, any> = {},
    template: EnhancedLabelTemplate
  ): string {
    let zpl = '';
    
    // Sort elements by z-index
    const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    for (const element of sortedElements) {
      if (!element.visible) continue;

      try {
        zpl += this.renderElement(element, data, template);
      } catch (error) {
        console.warn(`Failed to render element ${element.id}:`, error);
      }
    }
    
    return zpl;
  }

  /**
   * Render individual element
   */
  private renderElement(
    element: EnhancedLabelElement,
    data: Record<string, any>,
    template: EnhancedLabelTemplate
  ): string {
    // Convert element position and size to ZPL dots
    const x = this.convertToZPLUnits(element.x, template.size.unit);
    const y = this.convertToZPLUnits(element.y, template.size.unit);
    const w = this.convertToZPLUnits(element.w, template.size.unit);
    const h = this.convertToZPLUnits(element.h, template.size.unit);

    switch (element.type) {
      case 'text':
        return this.renderTextElement(element, data, template, x, y, w, h);
      case 'image':
        return this.renderImageElement(element, data, template, x, y, w, h);
      case 'barcode':
        return this.renderBarcodeElement(element, data, template, x, y, w, h);
      case 'qr':
        return this.renderQRElement(element, data, template, x, y, w, h);
      case 'shape':
        return this.renderShapeElement(element, data, template, x, y, w, h);
      case 'table':
        return this.renderTableElement(element, data, template, x, y, w, h);
      default:
        return '';
    }
  }

  /**
   * Render text element
   */
  private renderTextElement(
    element: EnhancedTextElement,
    data: Record<string, any>,
    template: EnhancedLabelTemplate,
    x: number,
    y: number,
    w: number,
    h: number
  ): string {
    // Get text content with variable substitution
    const content = this.substituteVariables(element.content, data);
    
    // Get style
    const style = this.getTextStyle(element, template);
    
    // Calculate font size in ZPL units
    const fontSize = this.convertToZPLUnits(style.fontSize || 12, 'mm');
    
    // Map font family to ZPL font
    const zplFont = this.getZPLFont(style.fontFamily || 'Arial', style.fontWeight || 'normal');
    
    // Map text alignment
    const alignment = this.getZPLAlignment(element.textAlign || 'left');
    
    // Escape special characters
    const escapedContent = this.escapeZPLString(content);
    
    return `^FO${x},${y}^A${zplFont}N,${fontSize},${fontSize}^${alignment}${escapedContent}^FS\n`;
  }

  /**
   * Render image element
   */
  private renderImageElement(
    element: EnhancedImageElement,
    data: Record<string, any>,
    template: EnhancedLabelTemplate,
    x: number,
    y: number,
    w: number,
    h: number
  ): string {
    if (!element.src) return '';
    
    // For ZPL, we need to convert the image to a bitmap format
    // This is a simplified version - in practice, you'd need to:
    // 1. Load the image
    // 2. Convert to grayscale
    // 3. Convert to ZPL bitmap format
    // 4. Store as a field or include inline
    
    return `^FO${x},${y}^GFA,${w * h / 8},${w * h / 8},${w / 8},${this.getImageBitmap(element.src)}^FS\n`;
  }

  /**
   * Render barcode element
   */
  private renderBarcodeElement(
    element: EnhancedBarcodeElement,
    data: Record<string, any>,
    template: EnhancedLabelTemplate,
    x: number,
    y: number,
    w: number,
    h: number
  ): string {
    // Get barcode value with variable substitution
    const value = this.substituteVariables(element.value, data);
    
    // Map symbology to ZPL format
    const zplSymbology = this.getZPLSymbology(element.symbology);
    
    // Calculate barcode height in ZPL units
    const barcodeHeight = this.convertToZPLUnits(h, template.size.unit);
    
    // Escape special characters
    const escapedValue = this.escapeZPLString(value);
    
    let zpl = `^FO${x},${y}^B${zplSymbology}N,${barcodeHeight},Y,N,N^FD${escapedValue}^FS\n`;
    
    // Add human readable text if requested
    if (element.displayValue && element.options?.displayValue) {
      const textY = element.displayValuePosition === 'top' ? y - 20 : y + barcodeHeight + 5;
      const fontSize = this.convertToZPLUnits(element.displayValueFontSize || 10, 'mm');
      zpl += `^FO${x},${textY}^A0N,${fontSize},${fontSize}^FD${escapedValue}^FS\n`;
    }
    
    return zpl;
  }

  /**
   * Render QR code element
   */
  private renderQRElement(
    element: EnhancedQRElement,
    data: Record<string, any>,
    template: EnhancedLabelTemplate,
    x: number,
    y: number,
    w: number,
    h: number
  ): string {
    // Get QR value with variable substitution
    const value = this.substituteVariables(element.value, data);
    
    // Calculate QR code size
    const qrSize = Math.min(w, h);
    const zplSize = this.convertToZPLUnits(qrSize, template.size.unit);
    
    // Map error correction level
    const eccLevel = this.getZPLECCLevel(element.ecc || 'M');
    
    // Escape special characters
    const escapedValue = this.escapeZPLString(value);
    
    return `^FO${x},${y}^BQN,2,${eccLevel},${zplSize}^FDQA,${escapedValue}^FS\n`;
  }

  /**
   * Render shape element
   */
  private renderShapeElement(
    element: EnhancedShapeElement,
    data: Record<string, any>,
    template: EnhancedLabelTemplate,
    x: number,
    y: number,
    w: number,
    h: number
  ): string {
    switch (element.shape) {
      case 'rectangle':
        return this.renderRectangle(x, y, w, h, element);
      case 'circle':
        return this.renderCircle(x, y, w, h, element);
      case 'line':
        return this.renderLine(x, y, w, h, element);
      default:
        return '';
    }
  }

  /**
   * Render table element
   */
  private renderTableElement(
    element: EnhancedTableElement,
    data: Record<string, any>,
    template: EnhancedLabelTemplate,
    x: number,
    y: number,
    w: number,
    h: number
  ): string {
    // Get table data
    const tableData = this.getTableData(element, data);
    
    if (!tableData || tableData.length === 0) return '';

    let zpl = '';
    const rowHeight = this.convertToZPLUnits(element.rowHeight || 20, template.size.unit);
    const headerHeight = this.convertToZPLUnits(element.headerHeight || 25, template.size.unit);
    
    // Calculate column widths
    const totalWidth = element.columns.reduce((sum, col) => sum + col.width, 0);
    const columnWidths = element.columns.map(col => (col.width / totalWidth) * w);
    
    let currentY = y;
    
    // Draw header
    if (element.showHeader) {
      zpl += this.drawTableRow(element.columns, tableData[0] || {}, x, currentY, columnWidths, headerHeight, true, template);
      currentY += headerHeight;
    }
    
    // Draw rows
    for (let i = 0; i < tableData.length && currentY + rowHeight <= y + h; i++) {
      zpl += this.drawTableRow(element.columns, tableData[i], x, currentY, columnWidths, rowHeight, false, template);
      currentY += rowHeight;
    }
    
    return zpl;
  }

  /**
   * Helper methods
   */
  private substituteVariables(text: string, data: Record<string, any>): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, field) => {
      const value = this.getNestedValue(data, field);
      return value !== undefined ? String(value) : match;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private getTextStyle(element: EnhancedTextElement, template: EnhancedLabelTemplate): any {
    const styleKey = element.styleKey || 'default';
    const templateStyle = template.styles?.[styleKey] || {};
    
    return {
      fontFamily: element.fontFamily || templateStyle.fontFamily || 'Arial',
      fontSize: element.fontSize || templateStyle.fontSize || 12,
      fontWeight: element.fontWeight || templateStyle.fontWeight || 'normal',
      fontStyle: element.fontStyle || templateStyle.fontStyle || 'normal',
      color: element.color || templateStyle.color || '#000000'
    };
  }

  private getZPLFont(fontFamily: string, fontWeight: string): string {
    // Map common fonts to ZPL fonts
    const fontMap: Record<string, string> = {
      'Arial': '0',
      'Helvetica': '0',
      'Times': '1',
      'Times New Roman': '1',
      'Courier': '2',
      'Courier New': '2'
    };
    
    return fontMap[fontFamily] || '0';
  }

  private getZPLAlignment(align: string): string {
    switch (align) {
      case 'center': return 'C';
      case 'right': return 'R';
      default: return 'L';
    }
  }

  private getZPLSymbology(symbology: string): string {
    const symbologyMap: Record<string, string> = {
      'code128': 'C',
      'code39': '3',
      'code93': '9',
      'ean13': 'E',
      'ean8': 'E8',
      'upc-a': 'B',
      'upc-e': 'B',
      'codabar': 'K',
      'gs1-128': 'C'
    };
    
    return symbologyMap[symbology] || 'C';
  }

  private getZPLECCLevel(ecc: string): string {
    switch (ecc) {
      case 'L': return '1';
      case 'M': return '2';
      case 'Q': return '3';
      case 'H': return '4';
      default: return '2';
    }
  }

  private escapeZPLString(str: string): string {
    return str
      .replace(/\^/g, '^22')
      .replace(/~/g, '^7E')
      .replace(/\r/g, '^0D')
      .replace(/\n/g, '^0A');
  }

  private getImageBitmap(src: string): string {
    // This would convert an image to ZPL bitmap format
    // For now, return a placeholder
    return 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
  }

  private renderRectangle(
    x: number,
    y: number,
    w: number,
    h: number,
    element: EnhancedShapeElement
  ): string {
    // ZPL doesn't have a direct rectangle command, so we use a box
    return `^FO${x},${y}^GB${w},${h},${this.convertToZPLUnits(element.strokeWidth || 1, 'mm')},${this.getZPLColor(element.fill || '#000000')}^FS\n`;
  }

  private renderCircle(
    x: number,
    y: number,
    w: number,
    h: number,
    element: EnhancedShapeElement
  ): string {
    // ZPL doesn't have a direct circle command, so we use a box with rounded corners
    const radius = Math.min(w, h) / 2;
    return `^FO${x},${y}^GB${w},${h},${this.convertToZPLUnits(element.strokeWidth || 1, 'mm')},${this.getZPLColor(element.fill || '#000000')},${radius}^FS\n`;
  }

  private renderLine(
    x: number,
    y: number,
    w: number,
    h: number,
    element: EnhancedShapeElement
  ): string {
    // ZPL doesn't have a direct line command, so we use a thin box
    const thickness = this.convertToZPLUnits(element.strokeWidth || 1, 'mm');
    return `^FO${x},${y}^GB${w},${thickness},${thickness},${this.getZPLColor(element.stroke || '#000000')}^FS\n`;
  }

  private getZPLColor(color: string): string {
    // ZPL uses B for black, W for white
    if (color.toLowerCase() === '#ffffff' || color.toLowerCase() === 'white') {
      return 'W';
    }
    return 'B';
  }

  private getTableData(element: EnhancedTableElement, data: Record<string, any>): Record<string, any>[] {
    const dataSource = this.getNestedValue(data, element.dataSource);
    return Array.isArray(dataSource) ? dataSource : [];
  }

  private drawTableRow(
    columns: any[],
    rowData: Record<string, any>,
    x: number,
    y: number,
    columnWidths: number[],
    height: number,
    isHeader: boolean,
    template: EnhancedLabelTemplate
  ): string {
    let zpl = '';
    let currentX = x;
    
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const width = columnWidths[i];
      const value = isHeader ? column.header : (rowData[column.field] || '');
      
      // Draw cell border
      zpl += `^FO${currentX},${y}^GB${width},${height},1,B^FS\n`;
      
      // Draw cell text
      const fontSize = this.convertToZPLUnits(10, 'mm');
      const escapedValue = this.escapeZPLString(String(value));
      zpl += `^FO${currentX + 2},${y + 2}^A0N,${fontSize},${fontSize}^FD${escapedValue}^FS\n`;
      
      currentX += width;
    }
    
    return zpl;
  }
}

import { EnhancedLabelTemplate, EnhancedTextElement, EnhancedShapeElement } from '@/lib/label-model';
import { mmToPx } from '@/lib/units';

export async function renderTemplateToPNG(template: EnhancedLabelTemplate): Promise<string> {
  const width = Math.floor(mmToPx(template.size.width));
  const height = Math.floor(mmToPx(template.size.height));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  for (const el of template.elements) {
    switch (el.type) {
      case 'text':
        drawText(ctx, el as EnhancedTextElement);
        break;
      case 'shape':
        drawShape(ctx, el as EnhancedShapeElement);
        break;
      // Skip complex elements for now
    }
  }
  return canvas.toDataURL('image/png');
}

function drawText(ctx: CanvasRenderingContext2D, el: EnhancedTextElement) {
  const x = Math.floor(mmToPx(el.x));
  const y = Math.floor(mmToPx(el.y + el.h));
  ctx.fillStyle = el.color || '#000';
  const px = Math.max(1, Math.floor(mmToPx(el.fontSize || 12) / 3));
  ctx.font = `${el.fontWeight || 'normal'} ${px}px ${el.fontFamily || 'Arial'}`;
  ctx.textAlign = (el.textAlign as CanvasTextAlign) || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(el.content || '', x, y);
}

function drawShape(ctx: CanvasRenderingContext2D, el: EnhancedShapeElement) {
  const x = Math.floor(mmToPx(el.x));
  const y = Math.floor(mmToPx(el.y));
  const w = Math.floor(mmToPx(el.w));
  const h = Math.floor(mmToPx(el.h));
  ctx.strokeStyle = el.stroke || '#000';
  ctx.fillStyle = el.fill || 'transparent';
  ctx.lineWidth = Math.max(1, Math.floor(mmToPx(el.strokeWidth || 1) / 3));
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  if (el.fill) ctx.fill();
  ctx.stroke();
}

// Simplified PNG renderer - only basic functionality

export interface PNGRenderOptions {
  dpi?: Dpi;
  backgroundColor?: string;
  quality?: number; // 0-1
  antialias?: boolean;
  scale?: number;
}

export interface PNGRenderResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  renderTime: number;
}

export class PNGRenderer {
  private options: PNGRenderOptions;

  constructor(options: PNGRenderOptions = {}) {
    this.options = {
      dpi: 300,
      backgroundColor: '#ffffff',
      quality: 1,
      antialias: true,
      scale: 1,
      ...options
    };
  }

  /**
   * Render template to PNG
   */
  async renderTemplate(template: EnhancedLabelTemplate, data?: Record<string, any>): Promise<PNGRenderResult> {
    const startTime = Date.now();
    
    try {
      // Calculate canvas dimensions
      const { width, height } = this.calculateCanvasDimensions(template);
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Configure canvas
      this.configureCanvas(ctx, width, height);
      
      // Render background
      this.renderBackground(ctx, width, height);
      
      // Render elements
      await this.renderElements(ctx, template.elements, data, template, width, height);
      
      // Convert to PNG
      const dataUrl = canvas.toDataURL('image/png', this.options.quality);
      const blob = await this.canvasToBlob(canvas, 'image/png', this.options.quality);
      
      const renderTime = Date.now() - startTime;

      return {
        dataUrl,
        blob,
        width,
        height,
        renderTime
      };
    } catch (error) {
      throw new Error(`PNG rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Render multiple labels as a grid
   */
  async renderGrid(
    template: EnhancedLabelTemplate, 
    dataArray: Record<string, any>[], 
    columns: number = 3
  ): Promise<PNGRenderResult> {
    const startTime = Date.now();
    
    try {
      // Calculate single label dimensions
      const { width: labelWidth, height: labelHeight } = this.calculateCanvasDimensions(template);
      
      // Calculate grid dimensions
      const rows = Math.ceil(dataArray.length / columns);
      const gridWidth = labelWidth * columns;
      const gridHeight = labelHeight * rows;
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = gridWidth;
      canvas.height = gridHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Configure canvas
      this.configureCanvas(ctx, gridWidth, gridHeight);
      
      // Render background
      this.renderBackground(ctx, gridWidth, gridHeight);
      
      // Render each label
      for (let i = 0; i < dataArray.length; i++) {
        const row = Math.floor(i / columns);
        const col = i % columns;
        const x = col * labelWidth;
        const y = row * labelHeight;
        
        // Create temporary canvas for single label
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = labelWidth;
        labelCanvas.height = labelHeight;
        const labelCtx = labelCanvas.getContext('2d');
        
        if (labelCtx) {
          this.configureCanvas(labelCtx, labelWidth, labelHeight);
          this.renderBackground(labelCtx, labelWidth, labelHeight);
          await this.renderElements(labelCtx, template.elements, dataArray[i], template, labelWidth, labelHeight);
          
          // Draw label onto grid
          ctx.drawImage(labelCanvas, x, y);
        }
      }
      
      // Convert to PNG
      const dataUrl = canvas.toDataURL('image/png', this.options.quality);
      const blob = await this.canvasToBlob(canvas, 'image/png', this.options.quality);
      
      const renderTime = Date.now() - startTime;

      return {
        dataUrl,
        blob,
        width: gridWidth,
        height: gridHeight,
        renderTime
      };
    } catch (error) {
      throw new Error(`PNG grid rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate canvas dimensions in pixels
   */
  private calculateCanvasDimensions(template: EnhancedLabelTemplate): { width: number; height: number } {
    const scale = this.options.scale || 1;
    const dpi = this.options.dpi || 300;
    
    // Convert template dimensions to pixels
    const width = toPx(template.size.width, template.size.unit) * scale;
    const height = toPx(template.size.height, template.size.unit) * scale;
    
    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * Configure canvas context
   */
  private configureCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Set canvas size
    ctx.canvas.width = width;
    ctx.canvas.height = height;
    
    // Enable antialiasing
    if (this.options.antialias) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
    
    // Set default font
    ctx.font = '12px Arial';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
  }

  /**
   * Render background
   */
  private renderBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = this.options.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * Render all elements
   */
  private async renderElements(
    ctx: CanvasRenderingContext2D,
    elements: EnhancedLabelElement[],
    data: Record<string, any>,
    template: EnhancedLabelTemplate,
    canvasWidth: number,
    canvasHeight: number
  ): Promise<void> {
    // Sort elements by z-index
    const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    for (const element of sortedElements) {
      if (!element.visible) continue;

      try {
        await this.renderElement(ctx, element, data, template, canvasWidth, canvasHeight);
      } catch (error) {
        console.warn(`Failed to render element ${element.id}:`, error);
      }
    }
  }

  /**
   * Render individual element
   */
  private async renderElement(
    ctx: CanvasRenderingContext2D,
    element: EnhancedLabelElement,
    data: Record<string, any>,
    template: EnhancedLabelTemplate,
    canvasWidth: number,
    canvasHeight: number
  ): Promise<void> {
    const scale = this.options.scale || 1;
    
    // Convert element position and size to pixels
    const x = toPx(element.x, template.size.unit) * scale;
    const y = toPx(element.y, template.size.unit) * scale;
    const w = toPx(element.w, template.size.unit) * scale;
    const h = toPx(element.h, template.size.unit) * scale;

    // Save context state
    ctx.save();

    // Apply opacity
    if (element.opacity && element.opacity < 1) {
      ctx.globalAlpha = element.opacity;
    }

    // Apply rotation
    if (element.rotation) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((element.rotation * Math.PI) / 180);
      ctx.translate(-w / 2, -h / 2);
    }

    switch (element.type) {
      case 'text':
        await this.renderTextElement(ctx, element, data, template, 0, 0, w, h, scale);
        break;
      case 'image':
        await this.renderImageElement(ctx, element, data, template, 0, 0, w, h, scale);
        break;
      case 'barcode':
        await this.renderBarcodeElement(ctx, element, data, template, 0, 0, w, h, scale);
        break;
      case 'qr':
        await this.renderQRElement(ctx, element, data, template, 0, 0, w, h, scale);
        break;
      case 'shape':
        await this.renderShapeElement(ctx, element, data, template, 0, 0, w, h, scale);
        break;
      case 'table':
        await this.renderTableElement(ctx, element, data, template, 0, 0, w, h, scale);
        break;
    }

    // Restore context state
    ctx.restore();
  }

  /**
   * Render text element
   */
  private async renderTextElement(
    ctx: CanvasRenderingContext2D,
    element: EnhancedTextElement,
    data: Record<string, any>,
    template: EnhancedLabelTemplate,
    x: number,
    y: number,
    w: number,
    h: number,
    scale: number
  ): Promise<void> {
    // Get text content with variable substitution
    const content = this.substituteVariables(element.content, data);
    
    // Get style
    const style = this.getTextStyle(element, template);
    
    // Set font properties
    const fontSize = toPx(style.fontSize || 12, 'mm') * scale;
    ctx.font = `${style.fontStyle || 'normal'} ${style.fontWeight || 'normal'} ${fontSize}px ${style.fontFamily || 'Arial'}`;
    ctx.fillStyle = style.color || '#000000';
    ctx.textAlign = this.getTextAlign(element.textAlign || 'left');
    ctx.textBaseline = this.getTextBaseline(element.verticalAlign || 'top');
    
    // Handle RTL
    if (element.rtl) {
      ctx.direction = 'rtl';
    }
    
    // Calculate text position
    const padding = element.padding || { top: 0, right: 0, bottom: 0, left: 0 };
    const textX = x + toPx(padding.left, 'mm') * scale;
    const textY = y + toPx(padding.top, 'mm') * scale;
    
    // Handle text wrapping
    const lines = this.wrapText(ctx, content, w - toPx(padding.left + padding.right, 'mm') * scale);
    
    // Draw text lines
    const lineHeight = fontSize * (element.lineHeight || 1.2);
    lines.forEach((line, index) => {
      if (element.maxLines && index >= element.maxLines) return;
      
      const lineY = textY + (index * lineHeight);
      if (lineY + lineHeight <= y + h) {
        ctx.fillText(line, textX, lineY);
      }
    });
  }

  /**
   * Render image element
   */
  private async renderImageElement(
    ctx: CanvasRenderingContext2D,
    element: EnhancedImageElement,
    data: Record<string, any>,
    template: EnhancedLabelTemplate,
    x: number,
    y: number,
    w: number,
    h: number,
    scale: number
  ): Promise<void> {
    if (!element.src) return;

    try {
      // Load image
      const img = await this.loadImage(element.src);
      
      // Calculate image dimensions based on fit mode
      const { width: imgWidth, height: imgHeight } = img;
      const { width: finalWidth, height: finalHeight } = this.calculateImageDimensions(
        imgWidth, imgHeight, w, h, element.fit || 'contain'
      );
      
      // Calculate position
      const finalX = x + (w - finalWidth) / 2;
      const finalY = y + (h - finalHeight) / 2;
      
      // Draw image
      ctx.drawImage(img, finalX, finalY, finalWidth, finalHeight);
    } catch (error) {
      console.warn(`Failed to load image ${element.src}:`, error);
    }
  }

  /**
   * Render barcode element
   */
  private async renderBarcodeElement(
    ctx: CanvasRenderingContext2D,
    element: EnhancedBarcodeElement,
    data: Record<string, any>,
    template: EnhancedLabelTemplate,
    x: number,
    y: number,
    w: number,
    h: number,
    scale: number
  ): Promise<void> {
    // Get barcode value with variable substitution
    const value = this.substituteVariables(element.value, data);
    
    try {
      // Generate barcode image
      const barcodeImage = await this.generateBarcode(value, element.symbology, w, h, element.options);
      
      // Draw barcode
      ctx.drawImage(barcodeImage, x, y, w, h);
      
      // Draw value text if requested
      if (element.displayValue && element.options?.displayValue) {
        const fontSize = toPx(element.displayValueFontSize || 10, 'mm') * scale;
        ctx.font = `${fontSize}px ${element.displayValueFontFamily || 'Arial'}`;
        ctx.fillStyle = element.foreground || '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const textY = element.displayValuePosition === 'top' ? y - fontSize - 5 : y + h + 5;
        
        ctx.fillText(value, x + w / 2, textY);
      }
    } catch (error) {
      console.warn(`Failed to generate barcode:`, error);
    }
  }

  /**
   * Render QR code element
   */
  private async renderQRElement(
    ctx: CanvasRenderingContext2D,
    element: EnhancedQRElement,
    data: Record<string, any>,
    template: EnhancedLabelTemplate,
    x: number,
    y: number,
    w: number,
    h: number,
    scale: number
  ): Promise<void> {
    // Get QR value with variable substitution
    const value = this.substituteVariables(element.value, data);
    
    try {
      // Generate QR code image
      const qrImage = await this.generateQRCode(value, w, h, element);
      
      // Draw QR code
      ctx.drawImage(qrImage, x, y, w, h);
    } catch (error) {
      console.warn(`Failed to generate QR code:`, error);
    }
  }

  /**
   * Render shape element
   */
  private async renderShapeElement(
    ctx: CanvasRenderingContext2D,
    element: EnhancedShapeElement,
    data: Record<string, any>,
    template: EnhancedLabelTemplate,
    x: number,
    y: number,
    w: number,
    h: number,
    scale: number
  ): Promise<void> {
    const fillColor = element.fill || '#000000';
    const strokeColor = element.stroke || '#000000';
    const strokeWidth = toPx(element.strokeWidth || 1, 'mm') * scale;

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    switch (element.shape) {
      case 'rectangle':
        if (element.cornerRadius) {
          this.drawRoundedRect(ctx, x, y, w, h, toPx(element.cornerRadius, 'mm') * scale);
        } else {
          ctx.fillRect(x, y, w, h);
        }
        break;
        
      case 'circle':
        const radius = Math.min(w, h) / 2;
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        break;
        
      case 'line':
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.stroke();
        break;
        
      case 'polygon':
        if (element.points && element.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(x + element.points[0].x * scale, y + element.points[0].y * scale);
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(x + element.points[i].x * scale, y + element.points[i].y * scale);
          }
          ctx.closePath();
          ctx.fill();
        }
        break;
    }
  }

  /**
   * Render table element
   */
  private async renderTableElement(
    ctx: CanvasRenderingContext2D,
    element: EnhancedTableElement,
    data: Record<string, any>,
    template: EnhancedLabelTemplate,
    x: number,
    y: number,
    w: number,
    h: number,
    scale: number
  ): Promise<void> {
    // Get table data
    const tableData = this.getTableData(element, data);
    
    if (!tableData || tableData.length === 0) return;

    const rowHeight = toPx(element.rowHeight || 20, 'mm') * scale;
    const headerHeight = toPx(element.headerHeight || 25, 'mm') * scale;
    
    // Calculate column widths
    const totalWidth = element.columns.reduce((sum, col) => sum + col.width, 0);
    const columnWidths = element.columns.map(col => (col.width / totalWidth) * w);
    
    let currentY = y;
    
    // Draw header
    if (element.showHeader) {
      this.drawTableRow(ctx, element.columns, tableData[0] || {}, x, currentY, columnWidths, headerHeight, true, scale);
      currentY += headerHeight;
    }
    
    // Draw rows
    for (let i = 0; i < tableData.length && currentY + rowHeight <= y + h; i++) {
      this.drawTableRow(ctx, element.columns, tableData[i], x, currentY, columnWidths, rowHeight, false, scale);
      currentY += rowHeight;
    }
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

  private getTextAlign(align: string): CanvasTextAlign {
    switch (align) {
      case 'center': return 'center';
      case 'right': return 'right';
      case 'justify': return 'left'; // Canvas doesn't support justify
      default: return 'left';
    }
  }

  private getTextBaseline(align: string): CanvasTextBaseline {
    switch (align) {
      case 'middle': return 'middle';
      case 'bottom': return 'bottom';
      default: return 'top';
    }
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  private calculateImageDimensions(
    imgWidth: number,
    imgHeight: number,
    containerWidth: number,
    containerHeight: number,
    fit: string
  ): { width: number; height: number } {
    const aspectRatio = imgWidth / imgHeight;
    const containerAspectRatio = containerWidth / containerHeight;
    
    switch (fit) {
      case 'contain':
        if (aspectRatio > containerAspectRatio) {
          return { width: containerWidth, height: containerWidth / aspectRatio };
        } else {
          return { width: containerHeight * aspectRatio, height: containerHeight };
        }
      case 'cover':
        if (aspectRatio > containerAspectRatio) {
          return { width: containerHeight * aspectRatio, height: containerHeight };
        } else {
          return { width: containerWidth, height: containerWidth / aspectRatio };
        }
      case 'fill':
        return { width: containerWidth, height: containerHeight };
      case 'scale-down':
        const contain = this.calculateImageDimensions(imgWidth, imgHeight, containerWidth, containerHeight, 'contain');
        return imgWidth > containerWidth || imgHeight > containerHeight ? contain : { width: imgWidth, height: imgHeight };
      default:
        return { width: imgWidth, height: imgHeight };
    }
  }

  private async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  private async generateBarcode(
    value: string,
    symbology: string,
    width: number,
    height: number,
    options?: any
  ): Promise<HTMLImageElement> {
    // This would integrate with jsbarcode or bwip-js
    // For now, return a placeholder
    throw new Error('Barcode generation not implemented');
  }

  private async generateQRCode(
    value: string,
    width: number,
    height: number,
    element: EnhancedQRElement
  ): Promise<HTMLImageElement> {
    // This would integrate with qrcode library
    // For now, return a placeholder
    throw new Error('QR code generation not implemented');
  }

  private getTableData(element: EnhancedTableElement, data: Record<string, any>): Record<string, any>[] {
    const dataSource = this.getNestedValue(data, element.dataSource);
    return Array.isArray(dataSource) ? dataSource : [];
  }

  private drawTableRow(
    ctx: CanvasRenderingContext2D,
    columns: any[],
    rowData: Record<string, any>,
    x: number,
    y: number,
    columnWidths: number[],
    height: number,
    isHeader: boolean,
    scale: number
  ): void {
    let currentX = x;
    
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const width = columnWidths[i];
      const value = isHeader ? column.header : (rowData[column.field] || '');
      
      // Draw cell border
      ctx.strokeRect(currentX, y, width, height);
      
      // Draw cell text
      ctx.fillText(String(value), currentX + 2, y + height / 2 + 4);
      
      currentX += width;
    }
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  private async canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        type,
        quality
      );
    });
  }
}

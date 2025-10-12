/**
 * Copy/Paste system for label editor
 */

import { EnhancedLabelElement } from './label-model';

export interface ClipboardData {
  elements: EnhancedLabelElement[];
  timestamp: number;
  sourceTemplateId?: string;
}

export interface PasteOptions {
  offsetX?: number;
  offsetY?: number;
  duplicateIds?: boolean;
  maintainRelations?: boolean;
}

export class ClipboardManager {
  private clipboard: ClipboardData | null = null;
  private listeners: Array<(data: ClipboardData | null) => void> = [];

  /**
   * Copy elements to clipboard
   */
  copy(elements: EnhancedLabelElement[], sourceTemplateId?: string): void {
    this.clipboard = {
      elements: this.deepClone(elements),
      timestamp: Date.now(),
      sourceTemplateId
    };
    this.notifyListeners();
  }

  /**
   * Cut elements to clipboard (copy and mark for deletion)
   */
  cut(elements: EnhancedLabelElement[], sourceTemplateId?: string): void {
    this.copy(elements, sourceTemplateId);
  }

  /**
   * Paste elements from clipboard
   */
  paste(options: PasteOptions = {}): EnhancedLabelElement[] | null {
    if (!this.clipboard) return null;

    const {
      offsetX = 10,
      offsetY = 10,
      duplicateIds = true,
      maintainRelations = true
    } = options;

    const pastedElements = this.deepClone(this.clipboard.elements);

    // Generate new IDs if needed
    if (duplicateIds) {
      pastedElements.forEach(element => {
        element.id = `${element.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        element.name = `${element.name || element.type} Copy`;
      });
    }

    // Apply offset
    pastedElements.forEach(element => {
      element.x += offsetX;
      element.y += offsetY;
    });

    // Update z-index to bring to front
    const maxZIndex = Math.max(...pastedElements.map(el => el.zIndex || 0));
    pastedElements.forEach((element, index) => {
      element.zIndex = (maxZIndex || 0) + index + 1;
    });

    return pastedElements;
  }

  /**
   * Check if clipboard has data
   */
  hasData(): boolean {
    return this.clipboard !== null;
  }

  /**
   * Get clipboard data
   */
  getData(): ClipboardData | null {
    return this.clipboard;
  }

  /**
   * Clear clipboard
   */
  clear(): void {
    this.clipboard = null;
    this.notifyListeners();
  }

  /**
   * Get clipboard age in milliseconds
   */
  getAge(): number {
    if (!this.clipboard) return 0;
    return Date.now() - this.clipboard.timestamp;
  }

  /**
   * Check if clipboard data is fresh (less than 5 minutes old)
   */
  isFresh(): boolean {
    return this.getAge() < 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Subscribe to clipboard changes
   */
  subscribe(listener: (data: ClipboardData | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners of clipboard changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.clipboard));
  }

  /**
   * Deep clone elements
   */
  private deepClone(elements: EnhancedLabelElement[]): EnhancedLabelElement[] {
    return JSON.parse(JSON.stringify(elements));
  }

  /**
   * Export clipboard data as JSON
   */
  export(): string | null {
    if (!this.clipboard) return null;
    return JSON.stringify(this.clipboard, null, 2);
  }

  /**
   * Import clipboard data from JSON
   */
  import(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData) as ClipboardData;
      if (data.elements && Array.isArray(data.elements)) {
        this.clipboard = data;
        this.notifyListeners();
        return true;
      }
    } catch (error) {
      console.error('Failed to import clipboard data:', error);
    }
    return false;
  }

  /**
   * Get clipboard statistics
   */
  getStats(): {
    hasData: boolean;
    elementCount: number;
    age: number;
    isFresh: boolean;
    sourceTemplateId?: string;
  } {
    return {
      hasData: this.hasData(),
      elementCount: this.clipboard?.elements.length || 0,
      age: this.getAge(),
      isFresh: this.isFresh(),
      sourceTemplateId: this.clipboard?.sourceTemplateId
    };
  }
}

/**
 * Keyboard shortcuts for copy/paste
 */
export class ClipboardShortcuts {
  private manager: ClipboardManager;
  private onCopy: () => void;
  private onCut: () => void;
  private onPaste: () => void;

  constructor(
    manager: ClipboardManager,
    onCopy: () => void,
    onCut: () => void,
    onPaste: () => void
  ) {
    this.manager = manager;
    this.onCopy = onCopy;
    this.onCut = onCut;
    this.onPaste = onPaste;
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'c':
          // Copy
          event.preventDefault();
          this.onCopy();
          return true;
        case 'x':
          // Cut
          event.preventDefault();
          this.onCut();
          return true;
        case 'v':
          // Paste
          event.preventDefault();
          if (this.manager.hasData()) {
            this.onPaste();
            return true;
          }
          break;
      }
    }

    return false;
  }

  /**
   * Setup keyboard listeners
   */
  setup(): () => void {
    const handleKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }
}

/**
 * Copy/paste utilities
 */
export class ClipboardUtils {
  /**
   * Duplicate elements with offset
   */
  static duplicateElements(
    elements: EnhancedLabelElement[],
    offsetX: number = 10,
    offsetY: number = 10
  ): EnhancedLabelElement[] {
    return elements.map(element => ({
      ...element,
      id: `${element.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${element.name || element.type} Copy`,
      x: element.x + offsetX,
      y: element.y + offsetY,
      zIndex: (element.zIndex || 0) + 1
    }));
  }

  /**
   * Create elements from template
   */
  static createFromTemplate(
    template: EnhancedLabelElement,
    count: number,
    spacing: number = 10
  ): EnhancedLabelElement[] {
    const elements: EnhancedLabelElement[] = [];
    
    for (let i = 0; i < count; i++) {
      elements.push({
        ...template,
        id: `${template.type}_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${template.name || template.type} ${i + 1}`,
        x: template.x + (i * spacing),
        y: template.y + (i * spacing),
        zIndex: (template.zIndex || 0) + i
      });
    }

    return elements;
  }

  /**
   * Merge clipboard data
   */
  static mergeClipboardData(
    existing: ClipboardData,
    additional: ClipboardData
  ): ClipboardData {
    return {
      elements: [...existing.elements, ...additional.elements],
      timestamp: Math.max(existing.timestamp, additional.timestamp),
      sourceTemplateId: existing.sourceTemplateId || additional.sourceTemplateId
    };
  }

  /**
   * Filter elements by type
   */
  static filterByType(
    elements: EnhancedLabelElement[],
    types: string[]
  ): EnhancedLabelElement[] {
    return elements.filter(element => types.includes(element.type));
  }

  /**
   * Sort elements by z-index
   */
  static sortByZIndex(elements: EnhancedLabelElement[]): EnhancedLabelElement[] {
    return [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }
}

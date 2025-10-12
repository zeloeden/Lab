/**
 * Undo/Redo system for label editor
 */

import { EnhancedLabelTemplate, EnhancedLabelElement } from './label-model';

export interface HistoryState {
  id: string;
  timestamp: number;
  template: EnhancedLabelTemplate;
  description: string;
  action: 'create' | 'update' | 'delete' | 'move' | 'style' | 'group' | 'ungroup';
  elementIds?: string[];
}

export class UndoRedoManager {
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  constructor(maxHistorySize: number = 50) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Save a new state to history
   */
  saveState(
    template: EnhancedLabelTemplate,
    description: string,
    action: HistoryState['action'],
    elementIds?: string[]
  ): void {
    // Remove any states after current index (when branching from history)
    this.history = this.history.slice(0, this.currentIndex + 1);

    const newState: HistoryState = {
      id: `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      template: this.deepClone(template),
      description,
      action,
      elementIds
    };

    this.history.push(newState);
    this.currentIndex = this.history.length - 1;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  /**
   * Undo to previous state
   */
  undo(): EnhancedLabelTemplate | null {
    if (!this.canUndo()) return null;

    this.currentIndex--;
    return this.deepClone(this.history[this.currentIndex].template);
  }

  /**
   * Redo to next state
   */
  redo(): EnhancedLabelTemplate | null {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    return this.deepClone(this.history[this.currentIndex].template);
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get current state
   */
  getCurrentState(): HistoryState | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
      return null;
    }
    return this.history[this.currentIndex];
  }

  /**
   * Get history for display
   */
  getHistory(): HistoryState[] {
    return [...this.history];
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get undo description
   */
  getUndoDescription(): string | null {
    if (!this.canUndo()) return null;
    return this.history[this.currentIndex - 1]?.description || 'Undo';
  }

  /**
   * Get redo description
   */
  getRedoDescription(): string | null {
    if (!this.canRedo()) return null;
    return this.history[this.currentIndex + 1]?.description || 'Redo';
  }

  /**
   * Deep clone template to avoid reference issues
   */
  private deepClone(template: EnhancedLabelTemplate): EnhancedLabelTemplate {
    return JSON.parse(JSON.stringify(template));
  }

  /**
   * Get history statistics
   */
  getStats(): {
    totalStates: number;
    currentIndex: number;
    canUndo: boolean;
    canRedo: boolean;
    memoryUsage: number;
  } {
    return {
      totalStates: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      memoryUsage: JSON.stringify(this.history).length
    };
  }
}

/**
 * Keyboard shortcuts for undo/redo
 */
export class UndoRedoShortcuts {
  private manager: UndoRedoManager;
  private onUndo: () => void;
  private onRedo: () => void;

  constructor(
    manager: UndoRedoManager,
    onUndo: () => void,
    onRedo: () => void
  ) {
    this.manager = manager;
    this.onUndo = onUndo;
    this.onRedo = onRedo;
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    // Check for Ctrl+Z (undo) or Ctrl+Y (redo)
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z' && !event.shiftKey) {
        // Undo
        event.preventDefault();
        if (this.manager.canUndo()) {
          this.onUndo();
          return true;
        }
      } else if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
        // Redo
        event.preventDefault();
        if (this.manager.canRedo()) {
          this.onRedo();
          return true;
        }
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
 * Action descriptions for different operations
 */
export const ActionDescriptions = {
  create: (elementType: string) => `Create ${elementType}`,
  update: (elementType: string, property?: string) => 
    property ? `Update ${elementType} ${property}` : `Update ${elementType}`,
  delete: (elementType: string) => `Delete ${elementType}`,
  move: (elementType: string) => `Move ${elementType}`,
  style: (elementType: string, property?: string) => 
    property ? `Style ${elementType} ${property}` : `Style ${elementType}`,
  group: (count: number) => `Group ${count} elements`,
  ungroup: (count: number) => `Ungroup ${count} elements`,
  duplicate: (elementType: string) => `Duplicate ${elementType}`,
  align: (alignment: string) => `Align ${alignment}`,
  distribute: (direction: string) => `Distribute ${direction}`,
  resize: (elementType: string) => `Resize ${elementType}`,
  rotate: (elementType: string) => `Rotate ${elementType}`,
  lock: (elementType: string) => `Lock ${elementType}`,
  unlock: (elementType: string) => `Unlock ${elementType}`,
  show: (elementType: string) => `Show ${elementType}`,
  hide: (elementType: string) => `Hide ${elementType}`,
  reorder: (elementType: string) => `Reorder ${elementType}`,
  copy: (elementType: string) => `Copy ${elementType}`,
  paste: (elementType: string) => `Paste ${elementType}`,
  cut: (elementType: string) => `Cut ${elementType}`,
  select: (count: number) => `Select ${count} elements`,
  deselect: () => `Deselect all`,
  zoom: (level: number) => `Zoom to ${level}%`,
  pan: () => `Pan canvas`,
  grid: (enabled: boolean) => enabled ? `Enable grid` : `Disable grid`,
  snap: (enabled: boolean) => enabled ? `Enable snap` : `Disable snap`,
  guides: (enabled: boolean) => enabled ? `Show guides` : `Hide guides`,
  rulers: (enabled: boolean) => enabled ? `Show rulers` : `Hide rulers`
};

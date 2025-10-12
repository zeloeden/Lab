/**
 * Multi-select and grouping system for label editor
 */

import { EnhancedLabelElement } from './label-model';

export interface SelectionGroup {
  id: string;
  name: string;
  elementIds: string[];
  locked: boolean;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MultiSelectState {
  selectedElementIds: string[];
  groups: SelectionGroup[];
  activeGroupId?: string;
}

export class MultiSelectManager {
  private state: MultiSelectState = {
    selectedElementIds: [],
    groups: []
  };
  private listeners: Array<(state: MultiSelectState) => void> = [];

  /**
   * Select single element
   */
  selectElement(elementId: string): void {
    this.state.selectedElementIds = [elementId];
    this.notifyListeners();
  }

  /**
   * Toggle element selection
   */
  toggleElement(elementId: string): void {
    const index = this.state.selectedElementIds.indexOf(elementId);
    if (index > -1) {
      this.state.selectedElementIds.splice(index, 1);
    } else {
      this.state.selectedElementIds.push(elementId);
    }
    this.notifyListeners();
  }

  /**
   * Select multiple elements
   */
  selectElements(elementIds: string[]): void {
    this.state.selectedElementIds = [...elementIds];
    this.notifyListeners();
  }

  /**
   * Add element to selection
   */
  addToSelection(elementId: string): void {
    if (!this.state.selectedElementIds.includes(elementId)) {
      this.state.selectedElementIds.push(elementId);
      this.notifyListeners();
    }
  }

  /**
   * Remove element from selection
   */
  removeFromSelection(elementId: string): void {
    const index = this.state.selectedElementIds.indexOf(elementId);
    if (index > -1) {
      this.state.selectedElementIds.splice(index, 1);
      this.notifyListeners();
    }
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.state.selectedElementIds = [];
    this.notifyListeners();
  }

  /**
   * Select all elements
   */
  selectAll(elementIds: string[]): void {
    this.state.selectedElementIds = [...elementIds];
    this.notifyListeners();
  }

  /**
   * Invert selection
   */
  invertSelection(allElementIds: string[]): void {
    const selected = new Set(this.state.selectedElementIds);
    this.state.selectedElementIds = allElementIds.filter(id => !selected.has(id));
    this.notifyListeners();
  }

  /**
   * Check if element is selected
   */
  isSelected(elementId: string): boolean {
    return this.state.selectedElementIds.includes(elementId);
  }

  /**
   * Get selected element IDs
   */
  getSelectedElementIds(): string[] {
    return [...this.state.selectedElementIds];
  }

  /**
   * Get selection count
   */
  getSelectionCount(): number {
    return this.state.selectedElementIds.length;
  }

  /**
   * Check if multiple elements are selected
   */
  isMultiSelect(): boolean {
    return this.state.selectedElementIds.length > 1;
  }

  /**
   * Create group from selected elements
   */
  createGroup(name: string): SelectionGroup | null {
    if (this.state.selectedElementIds.length < 2) {
      return null;
    }

    const group: SelectionGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      elementIds: [...this.state.selectedElementIds],
      locked: false,
      visible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.state.groups.push(group);
    this.state.activeGroupId = group.id;
    this.notifyListeners();

    return group;
  }

  /**
   * Ungroup selected group
   */
  ungroupGroup(groupId: string): boolean {
    const groupIndex = this.state.groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return false;

    this.state.groups.splice(groupIndex, 1);
    if (this.state.activeGroupId === groupId) {
      this.state.activeGroupId = undefined;
    }
    this.notifyListeners();

    return true;
  }

  /**
   * Add elements to group
   */
  addToGroup(groupId: string, elementIds: string[]): boolean {
    const group = this.state.groups.find(g => g.id === groupId);
    if (!group) return false;

    const newElementIds = elementIds.filter(id => !group.elementIds.includes(id));
    group.elementIds.push(...newElementIds);
    group.updatedAt = new Date();
    this.notifyListeners();

    return true;
  }

  /**
   * Remove elements from group
   */
  removeFromGroup(groupId: string, elementIds: string[]): boolean {
    const group = this.state.groups.find(g => g.id === groupId);
    if (!group) return false;

    group.elementIds = group.elementIds.filter(id => !elementIds.includes(id));
    group.updatedAt = new Date();
    this.notifyListeners();

    return true;
  }

  /**
   * Get group by ID
   */
  getGroup(groupId: string): SelectionGroup | undefined {
    return this.state.groups.find(g => g.id === groupId);
  }

  /**
   * Get all groups
   */
  getGroups(): SelectionGroup[] {
    return [...this.state.groups];
  }

  /**
   * Get groups containing element
   */
  getGroupsForElement(elementId: string): SelectionGroup[] {
    return this.state.groups.filter(g => g.elementIds.includes(elementId));
  }

  /**
   * Update group properties
   */
  updateGroup(groupId: string, updates: Partial<SelectionGroup>): boolean {
    const group = this.state.groups.find(g => g.id === groupId);
    if (!group) return false;

    Object.assign(group, updates);
    group.updatedAt = new Date();
    this.notifyListeners();

    return true;
  }

  /**
   * Select group elements
   */
  selectGroup(groupId: string): boolean {
    const group = this.state.groups.find(g => g.id === groupId);
    if (!group) return false;

    this.state.selectedElementIds = [...group.elementIds];
    this.state.activeGroupId = groupId;
    this.notifyListeners();

    return true;
  }

  /**
   * Lock/unlock group
   */
  toggleGroupLock(groupId: string): boolean {
    const group = this.state.groups.find(g => g.id === groupId);
    if (!group) return false;

    group.locked = !group.locked;
    group.updatedAt = new Date();
    this.notifyListeners();

    return true;
  }

  /**
   * Show/hide group
   */
  toggleGroupVisibility(groupId: string): boolean {
    const group = this.state.groups.find(g => g.id === groupId);
    if (!group) return false;

    group.visible = !group.visible;
    group.updatedAt = new Date();
    this.notifyListeners();

    return true;
  }

  /**
   * Delete group
   */
  deleteGroup(groupId: string): boolean {
    const groupIndex = this.state.groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return false;

    this.state.groups.splice(groupIndex, 1);
    if (this.state.activeGroupId === groupId) {
      this.state.activeGroupId = undefined;
    }
    this.notifyListeners();

    return true;
  }

  /**
   * Get current state
   */
  getState(): MultiSelectState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: MultiSelectState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Clear all groups and selection
   */
  clearAll(): void {
    this.state = {
      selectedElementIds: [],
      groups: [],
      activeGroupId: undefined
    };
    this.notifyListeners();
  }

  /**
   * Get selection bounds for alignment
   */
  getSelectionBounds(elements: EnhancedLabelElement[]): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  } | null {
    const selectedElements = elements.filter(el => 
      this.state.selectedElementIds.includes(el.id)
    );

    if (selectedElements.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedElements.forEach(el => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.w);
      maxY = Math.max(maxY, el.y + el.h);
    });

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  }
}

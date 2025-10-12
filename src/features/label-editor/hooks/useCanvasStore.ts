/**
 * Canvas Store hook using Zustand for state management
 * Handles canvas state, elements, history, and undo/redo functionality
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { LabelElement, CanvasState, HistoryState, LabelSize, DEFAULT_LABEL_SIZE } from '../types';

interface CanvasStore {
  // Canvas state
  canvasState: CanvasState;
  setCanvasState: (state: Partial<CanvasState>) => void;
  
  // Elements
  elements: LabelElement[];
  setElements: (elements: LabelElement[]) => void;
  addElement: (element: LabelElement) => void;
  updateElement: (id: string, updates: Partial<LabelElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  
  // Selection
  selectedElements: string[];
  setSelectedElements: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  
  // History
  history: HistoryState;
  addToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Label settings
  labelSize: LabelSize;
  setLabelSize: (size: LabelSize) => void;
  
  // Active tool
  activeTool: string;
  setActiveTool: (tool: string) => void;
  
  // Clipboard
  clipboard: LabelElement[];
  copyToClipboard: (elements: LabelElement[]) => void;
  pasteFromClipboard: () => void;
  canPaste: () => boolean;
  
  // Groups
  groupElements: (elementIds: string[]) => void;
  ungroupElements: (groupId: string) => void;
  
  // Alignment and distribution
  alignElements: (elementIds: string[], alignment: string) => void;
  distributeElements: (elementIds: string[], direction: 'horizontal' | 'vertical') => void;
  
  // Transform
  flipElements: (elementIds: string[], direction: 'horizontal' | 'vertical') => void;
  rotateElements: (elementIds: string[], angle: number) => void;
  
  // Layer ordering
  bringToFront: (elementId: string) => void;
  sendToBack: (elementId: string) => void;
  bringForward: (elementId: string) => void;
  sendBackward: (elementId: string) => void;
  
  // Visibility and locking
  toggleVisibility: (elementId: string) => void;
  toggleLock: (elementId: string) => void;
  
  // Reset
  reset: () => void;
}

const initialCanvasState: CanvasState = {
  zoom: 100,
  panX: 0,
  panY: 0,
  gridVisible: true,
  rulersVisible: true,
  guidesVisible: true,
  snapToGrid: true,
  snapToGuides: true,
  snapToMargins: true,
  selectedElements: [],
  clipboard: [],
};

const initialHistory: HistoryState = {
  past: [],
  present: [],
  future: [],
};

export const useCanvasStore = create<CanvasStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    canvasState: initialCanvasState,
    elements: [],
    selectedElements: [],
    history: initialHistory,
    labelSize: DEFAULT_LABEL_SIZE,
    activeTool: 'select',
    clipboard: [],

    // Canvas state management
    setCanvasState: (state) =>
      set((store) => ({
        canvasState: { ...store.canvasState, ...state },
      })),

    // Elements management
    setElements: (elements) =>
      set((store) => {
        const newState = { ...store, elements };
        return newState;
      }),

    addElement: (element) =>
      set((store) => {
        const newElements = [...store.elements, element];
        return { elements: newElements };
      }),

    updateElement: (id, updates) =>
      set((store) => {
        const newElements = store.elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        );
        return { elements: newElements };
      }),

    deleteElement: (id) =>
      set((store) => {
        const newElements = store.elements.filter((el) => el.id !== id);
        const newSelected = store.selectedElements.filter((selectedId) => selectedId !== id);
        return {
          elements: newElements,
          selectedElements: newSelected,
        };
      }),

    duplicateElement: (id) =>
      set((store) => {
        const element = store.elements.find((el) => el.id === id);
        if (!element) return store;

        const duplicatedElement: LabelElement = {
          ...element,
          id: `${element.type}-${Date.now()}`,
          x: element.x + 5, // Offset by 5mm
          y: element.y + 5,
          zIndex: Math.max(...store.elements.map((el) => el.zIndex)) + 1,
        };

        return {
          elements: [...store.elements, duplicatedElement],
        };
      }),

    // Selection management
    setSelectedElements: (ids) =>
      set({ selectedElements: ids }),

    addToSelection: (id) =>
      set((store) => ({
        selectedElements: [...store.selectedElements, id],
      })),

    removeFromSelection: (id) =>
      set((store) => ({
        selectedElements: store.selectedElements.filter((selectedId) => selectedId !== id),
      })),

    clearSelection: () =>
      set({ selectedElements: [] }),

    // History management
    addToHistory: () =>
      set((store) => {
        const { past, present } = store.history;
        const newPast = [...past, present];
        const newPresent = [...store.elements];
        
        // Limit history to 50 states
        const limitedPast = newPast.slice(-50);
        
        return {
          history: {
            past: limitedPast,
            present: newPresent,
            future: [],
          },
        };
      }),

    undo: () =>
      set((store) => {
        const { past, present, future } = store.history;
        if (past.length === 0) return store;

        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        const newFuture = [present, ...future];

        return {
          elements: previous,
          history: {
            past: newPast,
            present: previous,
            future: newFuture,
          },
        };
      }),

    redo: () =>
      set((store) => {
        const { past, present, future } = store.history;
        if (future.length === 0) return store;

        const next = future[0];
        const newPast = [...past, present];
        const newFuture = future.slice(1);

        return {
          elements: next,
          history: {
            past: newPast,
            present: next,
            future: newFuture,
          },
        };
      }),

    canUndo: () => {
      const { history } = get();
      return history.past.length > 0;
    },

    canRedo: () => {
      const { history } = get();
      return history.future.length > 0;
    },

    // Label settings
    setLabelSize: (size) =>
      set({ labelSize: size }),

    // Active tool
    setActiveTool: (tool) =>
      set({ activeTool: tool }),

    // Clipboard management
    copyToClipboard: (elements) =>
      set({ clipboard: elements }),

    pasteFromClipboard: () =>
      set((store) => {
        if (store.clipboard.length === 0) return store;

        const pastedElements = store.clipboard.map((element) => ({
          ...element,
          id: `${element.type}-${Date.now()}-${Math.random()}`,
          x: element.x + 5, // Offset by 5mm
          y: element.y + 5,
          zIndex: Math.max(...store.elements.map((el) => el.zIndex)) + 1,
        }));

        return {
          elements: [...store.elements, ...pastedElements],
          selectedElements: pastedElements.map((el) => el.id),
        };
      }),

    canPaste: () => {
      const { clipboard } = get();
      return clipboard.length > 0;
    },

    // Group management
    groupElements: (elementIds) =>
      set((store) => {
        const groupId = `group-${Date.now()}`;
        const newElements = store.elements.map((element) =>
          elementIds.includes(element.id)
            ? { ...element, groupId }
            : element
        );
        return { elements: newElements };
      }),

    ungroupElements: (groupId) =>
      set((store) => {
        const newElements = store.elements.map((element) =>
          element.groupId === groupId
            ? { ...element, groupId: undefined }
            : element
        );
        return { elements: newElements };
      }),

    // Alignment and distribution
    alignElements: (elementIds, alignment) =>
      set((store) => {
        const elements = store.elements.filter((el) => elementIds.includes(el.id));
        if (elements.length < 2) return store;

        const bounds = {
          left: Math.min(...elements.map((el) => el.x)),
          right: Math.max(...elements.map((el) => el.x + el.width)),
          top: Math.min(...elements.map((el) => el.y)),
          bottom: Math.max(...elements.map((el) => el.y + el.height)),
        };

        const newElements = store.elements.map((element) => {
          if (!elementIds.includes(element.id)) return element;

          let newX = element.x;
          let newY = element.y;

          switch (alignment) {
            case 'left':
              newX = bounds.left;
              break;
            case 'center':
              newX = bounds.left + (bounds.right - bounds.left) / 2 - element.width / 2;
              break;
            case 'right':
              newX = bounds.right - element.width;
              break;
            case 'top':
              newY = bounds.top;
              break;
            case 'middle':
              newY = bounds.top + (bounds.bottom - bounds.top) / 2 - element.height / 2;
              break;
            case 'bottom':
              newY = bounds.bottom - element.height;
              break;
          }

          return { ...element, x: newX, y: newY };
        });

        return { elements: newElements };
      }),

    distributeElements: (elementIds, direction) =>
      set((store) => {
        const elements = store.elements.filter((el) => elementIds.includes(el.id));
        if (elements.length < 3) return store;

        const sortedElements = [...elements].sort((a, b) => {
          if (direction === 'horizontal') {
            return a.x - b.x;
          } else {
            return a.y - b.y;
          }
        });

        const totalSpace = direction === 'horizontal'
          ? Math.max(...sortedElements.map((el) => el.x + el.width)) - Math.min(...sortedElements.map((el) => el.x))
          : Math.max(...sortedElements.map((el) => el.y + el.height)) - Math.min(...sortedElements.map((el) => el.y));

        const spacing = totalSpace / (sortedElements.length - 1);

        const newElements = store.elements.map((element) => {
          if (!elementIds.includes(element.id)) return element;

          const index = sortedElements.findIndex((el) => el.id === element.id);
          if (index === -1) return element;

          let newX = element.x;
          let newY = element.y;

          if (direction === 'horizontal') {
            newX = Math.min(...sortedElements.map((el) => el.x)) + index * spacing;
          } else {
            newY = Math.min(...sortedElements.map((el) => el.y)) + index * spacing;
          }

          return { ...element, x: newX, y: newY };
        });

        return { elements: newElements };
      }),

    // Transform operations
    flipElements: (elementIds, direction) =>
      set((store) => {
        const newElements = store.elements.map((element) => {
          if (!elementIds.includes(element.id)) return element;

          if (direction === 'horizontal') {
            return { ...element, flippedH: !element.flippedH };
          } else {
            return { ...element, flippedV: !element.flippedV };
          }
        });

        return { elements: newElements };
      }),

    rotateElements: (elementIds, angle) =>
      set((store) => {
        const newElements = store.elements.map((element) => {
          if (!elementIds.includes(element.id)) return element;

          return { ...element, rotation: (element.rotation + angle) % 360 };
        });

        return { elements: newElements };
      }),

    // Layer ordering
    bringToFront: (elementId) =>
      set((store) => {
        const maxZIndex = Math.max(...store.elements.map((el) => el.zIndex));
        const newElements = store.elements.map((element) =>
          element.id === elementId
            ? { ...element, zIndex: maxZIndex + 1 }
            : element
        );
        return { elements: newElements };
      }),

    sendToBack: (elementId) =>
      set((store) => {
        const minZIndex = Math.min(...store.elements.map((el) => el.zIndex));
        const newElements = store.elements.map((element) =>
          element.id === elementId
            ? { ...element, zIndex: minZIndex - 1 }
            : element
        );
        return { elements: newElements };
      }),

    bringForward: (elementId) =>
      set((store) => {
        const element = store.elements.find((el) => el.id === elementId);
        if (!element) return store;

        const nextElement = store.elements
          .filter((el) => el.zIndex > element.zIndex)
          .sort((a, b) => a.zIndex - b.zIndex)[0];

        if (!nextElement) return store;

        const newElements = store.elements.map((el) => {
          if (el.id === elementId) {
            return { ...el, zIndex: nextElement.zIndex };
          } else if (el.id === nextElement.id) {
            return { ...el, zIndex: element.zIndex };
          }
          return el;
        });

        return { elements: newElements };
      }),

    sendBackward: (elementId) =>
      set((store) => {
        const element = store.elements.find((el) => el.id === elementId);
        if (!element) return store;

        const prevElement = store.elements
          .filter((el) => el.zIndex < element.zIndex)
          .sort((a, b) => b.zIndex - a.zIndex)[0];

        if (!prevElement) return store;

        const newElements = store.elements.map((el) => {
          if (el.id === elementId) {
            return { ...el, zIndex: prevElement.zIndex };
          } else if (el.id === prevElement.id) {
            return { ...el, zIndex: element.zIndex };
          }
          return el;
        });

        return { elements: newElements };
      }),

    // Visibility and locking
    toggleVisibility: (elementId) =>
      set((store) => {
        const newElements = store.elements.map((element) =>
          element.id === elementId
            ? { ...element, visible: !element.visible }
            : element
        );
        return { elements: newElements };
      }),

    toggleLock: (elementId) =>
      set((store) => {
        const newElements = store.elements.map((element) =>
          element.id === elementId
            ? { ...element, locked: !element.locked }
            : element
        );
        return { elements: newElements };
      }),

    // Reset
    reset: () =>
      set({
        canvasState: initialCanvasState,
        elements: [],
        selectedElements: [],
        history: initialHistory,
        labelSize: DEFAULT_LABEL_SIZE,
        activeTool: 'select',
        clipboard: [],
      }),
  }))
);

// Auto-save to history when elements change
useCanvasStore.subscribe(
  (state) => state.elements,
  (elements, previousElements) => {
    if (elements !== previousElements && elements.length > 0) {
      // Debounce history updates
      setTimeout(() => {
        useCanvasStore.getState().addToHistory();
      }, 100);
    }
  }
);

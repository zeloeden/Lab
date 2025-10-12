/**
 * Fabric.js utility functions for the Label Editor
 * Simplified implementation for compatibility
 */

import { LabelElement, ElementStyle, FabricText, FabricImage, FabricRect, FabricCircle, FabricLine, FabricGroup } from '../types';
import { mmToPx, pxToMm } from './unitConversion';

/**
 * Create a fabric text object from a LabelElement
 * @param element - Label element
 * @returns Fabric text object
 */
export const createFabricText = (element: LabelElement): FabricText => {
  // Simplified implementation - return a basic object
  return {
    elementId: element.id,
    type: 'text',
    left: mmToPx(element.x),
    top: mmToPx(element.y),
    width: mmToPx(element.width),
    height: mmToPx(element.height),
    angle: element.rotation,
    opacity: element.style.opacity || 1,
    visible: element.visible,
    selectable: !element.locked,
    evented: !element.locked,
  } as FabricText;
};

/**
 * Create a fabric image object from a LabelElement
 * @param element - Label element
 * @param imageElement - HTML image element
 * @returns Fabric image object
 */
export const createFabricImage = (element: LabelElement, imageElement: HTMLImageElement): FabricImage => {
  return {
    elementId: element.id,
    type: 'image',
    left: mmToPx(element.x),
    top: mmToPx(element.y),
    width: mmToPx(element.width),
    height: mmToPx(element.height),
    angle: element.rotation,
    opacity: element.style.opacity || 1,
    visible: element.visible,
    selectable: !element.locked,
    evented: !element.locked,
  } as FabricImage;
};

/**
 * Create a fabric rectangle object from a LabelElement
 * @param element - Label element
 * @returns Fabric rectangle object
 */
export const createFabricRect = (element: LabelElement): FabricRect => {
  return {
    elementId: element.id,
    type: 'rect',
    left: mmToPx(element.x),
    top: mmToPx(element.y),
    width: mmToPx(element.width),
    height: mmToPx(element.height),
    angle: element.rotation,
    fill: element.style.backgroundColor || 'transparent',
    stroke: element.style.borderColor || 'transparent',
    strokeWidth: element.style.borderWidth ? mmToPx(element.style.borderWidth) : 0,
    opacity: element.style.opacity || 1,
    visible: element.visible,
    selectable: !element.locked,
    evented: !element.locked,
  } as FabricRect;
};

/**
 * Create a fabric circle object from a LabelElement
 * @param element - Label element
 * @returns Fabric circle object
 */
export const createFabricCircle = (element: LabelElement): FabricCircle => {
  const radius = Math.min(mmToPx(element.width), mmToPx(element.height)) / 2;
  return {
    elementId: element.id,
    type: 'circle',
    left: mmToPx(element.x),
    top: mmToPx(element.y),
    radius,
    angle: element.rotation,
    fill: element.style.backgroundColor || 'transparent',
    stroke: element.style.borderColor || 'transparent',
    strokeWidth: element.style.borderWidth ? mmToPx(element.style.borderWidth) : 0,
    opacity: element.style.opacity || 1,
    visible: element.visible,
    selectable: !element.locked,
    evented: !element.locked,
  } as FabricCircle;
};

/**
 * Create a fabric line object from a LabelElement
 * @param element - Label element
 * @returns Fabric line object
 */
export const createFabricLine = (element: LabelElement): FabricLine => {
  return {
    elementId: element.id,
    type: 'line',
    left: mmToPx(element.x),
    top: mmToPx(element.y),
    width: mmToPx(element.width),
    height: mmToPx(element.height),
    angle: element.rotation,
    stroke: element.style.color || '#000000',
    strokeWidth: element.style.borderWidth ? mmToPx(element.style.borderWidth) : 1,
    opacity: element.style.opacity || 1,
    visible: element.visible,
    selectable: !element.locked,
    evented: !element.locked,
  } as FabricLine;
};

/**
 * Create a fabric group object from multiple elements
 * @param elements - Array of label elements
 * @param groupId - Group identifier
 * @returns Fabric group object
 */
export const createFabricGroup = (elements: LabelElement[], groupId: string): FabricGroup => {
  return {
    elementId: groupId,
    type: 'group',
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    angle: 0,
    opacity: 1,
    visible: true,
    selectable: true,
    evented: true,
  } as FabricGroup;
};

/**
 * Update a fabric object with new element properties
 * @param fabricObject - Fabric object to update
 * @param element - Updated label element
 */
export const updateFabricObject = (fabricObject: any, element: LabelElement): void => {
  // Simplified implementation
  if (fabricObject) {
    fabricObject.left = mmToPx(element.x);
    fabricObject.top = mmToPx(element.y);
    fabricObject.angle = element.rotation;
    fabricObject.opacity = element.style.opacity || 1;
    fabricObject.visible = element.visible;
    fabricObject.selectable = !element.locked;
    fabricObject.evented = !element.locked;
  }
};

/**
 * Convert a fabric object back to a LabelElement
 * @param fabricObject - Fabric object
 * @param elementId - Element ID
 * @returns Label element
 */
export const fabricObjectToElement = (fabricObject: any, elementId: string): LabelElement => {
  return {
    id: elementId,
    type: 'text',
    x: pxToMm(fabricObject.left || 0),
    y: pxToMm(fabricObject.top || 0),
    width: pxToMm(fabricObject.width || 0),
    height: pxToMm(fabricObject.height || 0),
    rotation: fabricObject.angle || 0,
    content: '',
    style: {
      opacity: fabricObject.opacity || 1,
    },
    visible: fabricObject.visible !== false,
    locked: !fabricObject.selectable,
    zIndex: 1,
  };
};

/**
 * Apply shadow effect to a fabric object
 * @param fabricObject - Fabric object
 * @param shadow - Shadow style
 */
export const applyShadow = (fabricObject: any, shadow: ElementStyle['shadow']): void => {
  if (!shadow || !fabricObject) return;
  // Simplified implementation
  fabricObject.shadow = {
    color: shadow.color,
    blur: mmToPx(shadow.blur),
    offsetX: mmToPx(shadow.offsetX),
    offsetY: mmToPx(shadow.offsetY),
  };
};

/**
 * Apply gradient fill to a fabric object
 * @param fabricObject - Fabric object
 * @param gradient - Gradient style
 */
export const applyGradient = (fabricObject: any, gradient: ElementStyle['gradient']): void => {
  if (!gradient || !fabricObject) return;
  // Simplified implementation
  fabricObject.fill = gradient.colors[0]?.color || '#000000';
};

/**
 * Create a fabric canvas with proper configuration
 * @param canvasElement - HTML canvas element
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @returns Fabric canvas instance
 */
export const createFabricCanvas = (canvasElement: HTMLCanvasElement, width: number, height: number): any => {
  // Simplified implementation - return a basic object
  return {
    width,
    height,
    backgroundColor: '#ffffff',
    selection: true,
    preserveObjectStacking: true,
    renderOnAddRemove: true,
    skipTargetFind: false,
    skipOffscreen: false,
    getObjects: () => [],
    add: () => {},
    remove: () => {},
    renderAll: () => {},
    setZoom: () => {},
    getActiveObject: () => null,
    setActiveObject: () => {},
    discardActiveObject: () => {},
    dispose: () => {},
    on: () => {},
  };
};
/**
 * Unit conversion utilities for label templates
 * Fixed DPI of 300 for consistent pixel calculations
 */

export const DPI = 300;
export const MM_PER_INCH = 25.4;

export type Unit = 'mm' | 'px' | 'in';

/**
 * Convert millimeters to pixels at 300 DPI
 */
export const mmToPx = (mm: number): number => {
  return (mm * DPI) / MM_PER_INCH;
};

/**
 * Convert pixels to millimeters at 300 DPI
 */
export const pxToMm = (px: number): number => {
  return (px * MM_PER_INCH) / DPI;
};

/**
 * Convert inches to pixels at 300 DPI
 */
export const inToPx = (inches: number): number => {
  return inches * DPI;
};

/**
 * Convert pixels to inches at 300 DPI
 */
export const pxToIn = (px: number): number => {
  return px / DPI;
};

/**
 * Convert millimeters to inches
 */
export const mmToIn = (mm: number): number => {
  return mm / MM_PER_INCH;
};

/**
 * Convert inches to millimeters
 */
export const inToMm = (inches: number): number => {
  return inches * MM_PER_INCH;
};

/**
 * Convert any unit to pixels
 */
export const toPx = (value: number, unit: Unit): number => {
  switch (unit) {
    case 'px':
      return value;
    case 'mm':
      return mmToPx(value);
    case 'in':
      return inToPx(value);
    default:
      return value;
  }
};

/**
 * Convert pixels to any unit
 */
export const fromPx = (px: number, unit: Unit): number => {
  switch (unit) {
    case 'px':
      return px;
    case 'mm':
      return pxToMm(px);
    case 'in':
      return pxToIn(px);
    default:
      return px;
  }
};

/**
 * Round to specified decimal places
 */
export const round = (value: number, decimals: number = 2): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Snap value to grid
 */
export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Convert between units
 */
export const convertUnit = (value: number, from: Unit, to: Unit): number => {
  if (from === to) return value;
  
  const px = toPx(value, from);
  return fromPx(px, to);
};

/**
 * Calculate label dimensions in pixels
 */
export const getLabelDimensions = (width: number, height: number, unit: Unit) => {
  return {
    width: toPx(width, unit),
    height: toPx(height, unit),
    widthMm: convertUnit(width, unit, 'mm'),
    heightMm: convertUnit(height, unit, 'mm'),
    widthIn: convertUnit(width, unit, 'in'),
    heightIn: convertUnit(height, unit, 'in')
  };
};

/**
 * Calculate safe area dimensions
 */
export const getSafeArea = (width: number, height: number, unit: Unit, safeMargin: number = 2) => {
  const dimensions = getLabelDimensions(width, height, unit);
  const safeMarginPx = toPx(safeMargin, 'mm');
  
  return {
    x: safeMarginPx,
    y: safeMarginPx,
    width: dimensions.width - (safeMarginPx * 2),
    height: dimensions.height - (safeMarginPx * 2)
  };
};

/**
 * Calculate bleed area dimensions
 */
export const getBleedArea = (width: number, height: number, unit: Unit, bleedMargin: number = 1) => {
  const dimensions = getLabelDimensions(width, height, unit);
  const bleedMarginPx = toPx(bleedMargin, 'mm');
  
  return {
    x: -bleedMarginPx,
    y: -bleedMarginPx,
    width: dimensions.width + (bleedMarginPx * 2),
    height: dimensions.height + (bleedMarginPx * 2)
  };
};

/**
 * Format value with unit
 */
export const formatWithUnit = (value: number, unit: Unit, decimals: number = 2): string => {
  return `${round(value, decimals)}${unit}`;
};

/**
 * Parse value with unit from string
 */
export const parseWithUnit = (str: string): { value: number; unit: Unit } => {
  const match = str.match(/^([\d.]+)(mm|px|in)$/i);
  if (!match) {
    throw new Error(`Invalid unit format: ${str}`);
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase() as Unit;
  
  return { value, unit };
};

/**
 * Get optimal zoom level for canvas
 */
export const getOptimalZoom = (canvasWidth: number, canvasHeight: number, containerWidth: number, containerHeight: number): number => {
  const scaleX = containerWidth / canvasWidth;
  const scaleY = containerHeight / canvasHeight;
  return Math.min(scaleX, scaleY, 1) * 0.9; // 90% of container to leave some padding
};

/**
 * Calculate grid size in pixels for given unit
 */
export const getGridSize = (unit: Unit, gridSize: number = 1): number => {
  return toPx(gridSize, unit);
};

/**
 * Unit conversion utilities for the Label Editor
 * Handles conversion between mm, pixels, and points at 300 DPI
 */

import { DPI, MM_TO_PX, PX_TO_MM } from '../types';

/**
 * Convert millimeters to pixels at 300 DPI
 * @param mm - Value in millimeters
 * @returns Value in pixels
 */
export const mmToPx = (mm: number): number => {
  return mm * MM_TO_PX;
};

/**
 * Convert pixels to millimeters at 300 DPI
 * @param px - Value in pixels
 * @returns Value in millimeters
 */
export const pxToMm = (px: number): number => {
  return px * PX_TO_MM;
};

/**
 * Convert points to pixels (1 point = 1/72 inch)
 * @param pt - Value in points
 * @returns Value in pixels
 */
export const ptToPx = (pt: number): number => {
  return (pt * DPI) / 72;
};

/**
 * Convert pixels to points
 * @param px - Value in pixels
 * @returns Value in points
 */
export const pxToPt = (px: number): number => {
  return (px * 72) / DPI;
};

/**
 * Convert millimeters to points
 * @param mm - Value in millimeters
 * @returns Value in points
 */
export const mmToPt = (mm: number): number => {
  return (mm * 72) / 25.4;
};

/**
 * Convert points to millimeters
 * @param pt - Value in points
 * @returns Value in millimeters
 */
export const ptToMm = (pt: number): number => {
  return (pt * 25.4) / 72;
};

/**
 * Round to a specific number of decimal places
 * @param value - Value to round
 * @param decimals - Number of decimal places
 * @returns Rounded value
 */
export const roundTo = (value: number, decimals: number = 2): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Convert mm to px and round to nearest pixel
 * @param mm - Value in millimeters
 * @returns Value in pixels rounded to nearest integer
 */
export const mmToPxRounded = (mm: number): number => {
  return Math.round(mmToPx(mm));
};

/**
 * Convert px to mm and round to 2 decimal places
 * @param px - Value in pixels
 * @returns Value in millimeters rounded to 2 decimal places
 */
export const pxToMmRounded = (px: number): number => {
  return roundTo(pxToMm(px), 2);
};

/**
 * Format a value with unit for display
 * @param value - Numeric value
 * @param unit - Unit string
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export const formatWithUnit = (value: number, unit: string, decimals: number = 2): string => {
  return `${roundTo(value, decimals)} ${unit}`;
};

/**
 * Parse a value with unit from string
 * @param str - String like "50mm" or "100px"
 * @returns Object with value and unit
 */
export const parseValueWithUnit = (str: string): { value: number; unit: string } => {
  const match = str.match(/^([\d.]+)\s*(mm|px|pt)?$/i);
  if (match) {
    return {
      value: parseFloat(match[1]),
      unit: match[2]?.toLowerCase() || 'mm'
    };
  }
  return { value: 0, unit: 'mm' };
};

/**
 * Convert between different units
 * @param value - Numeric value
 * @param fromUnit - Source unit
 * @param toUnit - Target unit
 * @returns Converted value
 */
export const convertUnit = (value: number, fromUnit: string, toUnit: string): number => {
  if (fromUnit === toUnit) return value;
  
  // Convert to mm first
  let mmValue: number;
  switch (fromUnit.toLowerCase()) {
    case 'mm':
      mmValue = value;
      break;
    case 'px':
      mmValue = pxToMm(value);
      break;
    case 'pt':
      mmValue = ptToMm(value);
      break;
    default:
      mmValue = value;
  }
  
  // Convert from mm to target unit
  switch (toUnit.toLowerCase()) {
    case 'mm':
      return mmValue;
    case 'px':
      return mmToPx(mmValue);
    case 'pt':
      return mmToPt(mmValue);
    default:
      return mmValue;
  }
};

/**
 * Get the appropriate unit for display based on context
 * @param context - Context like 'fontSize', 'position', 'size'
 * @returns Unit string
 */
export const getDisplayUnit = (context: 'fontSize' | 'position' | 'size' | 'border'): string => {
  switch (context) {
    case 'fontSize':
      return 'pt';
    case 'position':
    case 'size':
    case 'border':
      return 'mm';
    default:
      return 'mm';
  }
};

/**
 * Validate that a value is within reasonable bounds for a given unit
 * @param value - Value to validate
 * @param unit - Unit of the value
 * @param context - Context for validation
 * @returns True if value is valid
 */
export const validateValue = (value: number, unit: string, context: string): boolean => {
  const mmValue = convertUnit(value, unit, 'mm');
  
  switch (context) {
    case 'fontSize':
      return mmValue >= 0.5 && mmValue <= 100; // 0.5mm to 100mm
    case 'position':
      return mmValue >= -1000 && mmValue <= 1000; // -1000mm to 1000mm
    case 'size':
      return mmValue > 0 && mmValue <= 1000; // 0mm to 1000mm
    case 'border':
      return mmValue >= 0 && mmValue <= 50; // 0mm to 50mm
    default:
      return true;
  }
};

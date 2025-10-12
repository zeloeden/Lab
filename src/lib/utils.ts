import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely formats a date value, handling invalid dates gracefully
 */
export function formatDate(date: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Safely formats a date with time, handling invalid dates gracefully
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Safely converts a date to locale string, handling invalid dates gracefully
 */
export function safeToLocaleString(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    return dateObj.toLocaleString();
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Safely converts a date to locale date string, handling invalid dates gracefully
 */
export function safeToLocaleDateString(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    return dateObj.toLocaleDateString();
  } catch (error) {
    return 'Invalid date';
  }
}

// Finished Goods helpers and settings persistence
export type FinishedGoodsSettings = {
  codeFormat: string; // e.g., FG-{YYYY}-{####}
  locationRackPrefix: string; // e.g., FG
  startPosition: number; // default position
  useSupplierIndex: boolean; // include supplier code in codeFormat when available
};

export type FinishedGoodsState = {
  lastCodeCounter: number;
  lastYear: number;
  lastPosition: number;
};

const FG_SETTINGS_KEY = 'nbslims_finished_goods_settings';
const FG_STATE_KEY = 'nbslims_finished_goods_state';

export function getFinishedGoodsSettings(): FinishedGoodsSettings {
  const raw = localStorage.getItem(FG_SETTINGS_KEY);
  if (raw) return JSON.parse(raw);
  const defaults: FinishedGoodsSettings = {
    codeFormat: 'FG-{YYYY}-{####}',
    locationRackPrefix: 'FG',
    startPosition: 1,
    useSupplierIndex: false,
  };
  localStorage.setItem(FG_SETTINGS_KEY, JSON.stringify(defaults));
  return defaults;
}

export function saveFinishedGoodsSettings(settings: FinishedGoodsSettings) {
  localStorage.setItem(FG_SETTINGS_KEY, JSON.stringify(settings));
}

export function getFinishedGoodsState(): FinishedGoodsState {
  const raw = localStorage.getItem(FG_STATE_KEY);
  if (raw) return JSON.parse(raw);
  const now = new Date();
  const state: FinishedGoodsState = { lastCodeCounter: 0, lastYear: now.getFullYear(), lastPosition: 0 };
  localStorage.setItem(FG_STATE_KEY, JSON.stringify(state));
  return state;
}

export function saveFinishedGoodsState(state: FinishedGoodsState) {
  localStorage.setItem(FG_STATE_KEY, JSON.stringify(state));
}

export function generateFinishedGoodsCode(): string {
  // New scheme: NBS00, NBS01, ...
  const state = getFinishedGoodsState();
  state.lastCodeCounter += 1;
  saveFinishedGoodsState(state);
  const counter = String(state.lastCodeCounter).padStart(2, '0');
  return `NBS${counter}`;
}

export function nextFinishedGoodsLocation(): { rackNumber: string; position: number } {
  const settings = getFinishedGoodsSettings();
  const state = getFinishedGoodsState();
  const position = state.lastPosition > 0 ? state.lastPosition + 1 : settings.startPosition;
  saveFinishedGoodsState({ ...state, lastPosition: position });
  return { rackNumber: settings.locationRackPrefix, position };
}

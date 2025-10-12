/**
 * Text styles presets and management for label editor
 */

import { TextStyle } from './label-model';

export interface TextStylePreset {
  id: string;
  name: string;
  description?: string;
  style: TextStyle;
  category: 'heading' | 'body' | 'caption' | 'label' | 'custom';
  isDefault?: boolean;
}

export const defaultTextStyles: TextStylePreset[] = [
  {
    id: 'heading-large',
    name: 'Heading Large',
    description: 'Large heading text',
    category: 'heading',
    style: {
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: 0,
      textDecoration: 'none',
      textTransform: 'none'
    }
  },
  {
    id: 'heading-medium',
    name: 'Heading Medium',
    description: 'Medium heading text',
    category: 'heading',
    style: {
      fontFamily: 'Arial',
      fontSize: 14,
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: 0,
      textDecoration: 'none',
      textTransform: 'none'
    }
  },
  {
    id: 'heading-small',
    name: 'Heading Small',
    description: 'Small heading text',
    category: 'heading',
    style: {
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: 0,
      textDecoration: 'none',
      textTransform: 'none'
    }
  },
  {
    id: 'body-regular',
    name: 'Body Regular',
    description: 'Regular body text',
    category: 'body',
    isDefault: true,
    style: {
      fontFamily: 'Arial',
      fontSize: 10,
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'left',
      lineHeight: 1.4,
      letterSpacing: 0,
      textDecoration: 'none',
      textTransform: 'none'
    }
  },
  {
    id: 'body-small',
    name: 'Body Small',
    description: 'Small body text',
    category: 'body',
    style: {
      fontFamily: 'Arial',
      fontSize: 8,
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'left',
      lineHeight: 1.3,
      letterSpacing: 0,
      textDecoration: 'none',
      textTransform: 'none'
    }
  },
  {
    id: 'caption',
    name: 'Caption',
    description: 'Caption text',
    category: 'caption',
    style: {
      fontFamily: 'Arial',
      fontSize: 7,
      fontWeight: 'normal',
      color: '#666666',
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: 0,
      textDecoration: 'none',
      textTransform: 'none'
    }
  },
  {
    id: 'label-bold',
    name: 'Label Bold',
    description: 'Bold label text',
    category: 'label',
    style: {
      fontFamily: 'Arial',
      fontSize: 9,
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: 0,
      textDecoration: 'none',
      textTransform: 'uppercase'
    }
  },
  {
    id: 'barcode-text',
    name: 'Barcode Text',
    description: 'Text below barcodes',
    category: 'label',
    style: {
      fontFamily: 'Arial',
      fontSize: 8,
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'center',
      lineHeight: 1.1,
      letterSpacing: 0,
      textDecoration: 'none',
      textTransform: 'none'
    }
  }
];

export class TextStyleManager {
  private presets: TextStylePreset[] = [...defaultTextStyles];
  private customPresets: TextStylePreset[] = [];

  constructor() {
    this.loadCustomPresets();
  }

  getAllPresets(): TextStylePreset[] {
    return [...this.presets, ...this.customPresets];
  }

  getPresetsByCategory(category: TextStylePreset['category']): TextStylePreset[] {
    return this.getAllPresets().filter(preset => preset.category === category);
  }

  getPreset(id: string): TextStylePreset | undefined {
    return this.getAllPresets().find(preset => preset.id === id);
  }

  getDefaultPreset(): TextStylePreset | undefined {
    return this.getAllPresets().find(preset => preset.isDefault);
  }

  saveCustomPreset(preset: Omit<TextStylePreset, 'id'>): TextStylePreset {
    const newPreset: TextStylePreset = {
      ...preset,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: preset.category || 'custom'
    };

    this.customPresets.push(newPreset);
    this.saveCustomPresets();
    return newPreset;
  }

  updateCustomPreset(id: string, updates: Partial<TextStylePreset>): boolean {
    const index = this.customPresets.findIndex(preset => preset.id === id);
    if (index === -1) return false;

    this.customPresets[index] = { ...this.customPresets[index], ...updates };
    this.saveCustomPresets();
    return true;
  }

  deleteCustomPreset(id: string): boolean {
    const index = this.customPresets.findIndex(preset => preset.id === id);
    if (index === -1) return false;

    this.customPresets.splice(index, 1);
    this.saveCustomPresets();
    return true;
  }

  applyPresetToElement(element: any, presetId: string): void {
    const preset = this.getPreset(presetId);
    if (!preset) return;

    Object.assign(element, preset.style);
  }

  createPresetFromElement(element: any, name: string, category: TextStylePreset['category'] = 'custom'): TextStylePreset {
    const style: TextStyle = {
      fontFamily: element.fontFamily || 'Arial',
      fontSize: element.fontSize || 10,
      fontWeight: element.fontWeight || 'normal',
      color: element.color || '#000000',
      textAlign: element.textAlign || 'left',
      lineHeight: element.lineHeight || 1.2,
      letterSpacing: element.letterSpacing || 0,
      textDecoration: element.textDecoration || 'none',
      textTransform: element.textTransform || 'none'
    };

    return this.saveCustomPreset({
      name,
      category,
      style
    });
  }

  private loadCustomPresets(): void {
    try {
      const stored = localStorage.getItem('nbslims_text_styles');
      if (stored) {
        this.customPresets = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load custom text styles:', error);
      this.customPresets = [];
    }
  }

  private saveCustomPresets(): void {
    try {
      localStorage.setItem('nbslims_text_styles', JSON.stringify(this.customPresets));
    } catch (error) {
      console.error('Failed to save custom text styles:', error);
    }
  }
}

export const textStyleManager = new TextStyleManager();

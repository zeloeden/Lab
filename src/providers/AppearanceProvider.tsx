import React, { createContext, useContext, useEffect, useState } from 'react';

export type SectionFill = 'headers' | 'vivid';
export type HeaderPattern = 'none' | 'brandTiles' | 'brandDense' | 'brandRows';
export type PatternIntensity = 0 | 1 | 2 | 3;
export type Variant = 'turquoise' | 'indigo' | 'emerald' | 'sky' | 'neutral';

export interface PerSectionVariant {
  basicInfo?: Variant;
  patchSupplier?: Variant;
  storage?: Variant;
  pricing?: Variant;
  [key: string]: Variant | undefined;
}

export interface AppearanceSettings {
  sectionFill: SectionFill;
  headerPattern: HeaderPattern;
  headerPatternIntensity: PatternIntensity;
  headerWatermark: boolean;
  perSectionVariant: PerSectionVariant;
}

interface AppearanceContextValue extends AppearanceSettings {
  setAppearance: (patch: Partial<AppearanceSettings>) => void;
  // Legacy support
  setSectionFill: (value: SectionFill) => void;
}

const defaultSettings: AppearanceSettings = {
  sectionFill: 'headers',
  headerPattern: 'none',
  headerPatternIntensity: 1,
  headerWatermark: false,
  perSectionVariant: {
    basicInfo: 'turquoise',
    patchSupplier: 'indigo',
    storage: 'sky',
    pricing: 'emerald',
  }
};

const STORAGE_KEY = 'nbs:appearance';

const loadSettings = (): AppearanceSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Force disable watermark for all users (migration)
      return { ...defaultSettings, ...parsed, headerWatermark: false };
    }
  } catch (error) {
    console.warn('Failed to load appearance settings:', error);
  }
  return defaultSettings;
};

const saveSettings = (settings: AppearanceSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save appearance settings:', error);
  }
};

const AppearanceContext = createContext<AppearanceContextValue>({
  ...defaultSettings,
  setAppearance: () => {},
  setSectionFill: () => {},
});

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppearanceSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const setAppearance = (patch: Partial<AppearanceSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  };

  const setSectionFill = (value: SectionFill) => {
    setAppearance({ sectionFill: value });
  };

  const value: AppearanceContextValue = {
    ...settings,
    setAppearance,
    setSectionFill,
  };

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => useContext(AppearanceContext);


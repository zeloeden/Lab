import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  actualTheme: 'light' | 'dark'; // The actual theme being applied
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  colors: ThemeColors;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  turquoise: string;
}

const lightColors: ThemeColors = {
  primary: '#0891b2', // Turquoise
  secondary: '#1f2937', // Dark gray
  accent: '#06b6d4', // Cyan
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  turquoise: '#0891b2'
};

const darkColors: ThemeColors = {
  primary: '#06b6d4', // Lighter turquoise for dark mode
  secondary: '#f8fafc', // Light gray
  accent: '#0891b2', // Turquoise
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  border: '#334155',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  turquoise: '#06b6d4'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // Get the actual theme based on system preference
  const getActualTheme = (themePreference: 'light' | 'dark' | 'system'): 'light' | 'dark' => {
    if (themePreference === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themePreference;
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('nbslims_theme') as 'light' | 'dark' | 'system';
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      setThemeState('system');
    }
  }, []);

  useEffect(() => {
    const newActualTheme = getActualTheme(theme);
    setActualTheme(newActualTheme);
  }, [theme]);

  useEffect(() => {
    // Update document class for Tailwind dark mode
    if (actualTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [actualTheme]);

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const newActualTheme = getActualTheme(theme);
        setActualTheme(newActualTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    localStorage.setItem('nbslims_theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = actualTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const colors = actualTheme === 'light' ? lightColors : darkColors;

  const value = {
    theme,
    actualTheme,
    setTheme,
    toggleTheme,
    colors
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
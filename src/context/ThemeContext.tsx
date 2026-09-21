import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Theme } from '../types';
import { settingsService } from '../services/settingsService';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  isLight: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  accentColor: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'ks_portfolio_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      // If no saved preference exists, check Admin's configured default public theme
      const adminDefault = settingsService.getSettings().defaultTheme;
      if (adminDefault === 'dark' || adminDefault === 'light') {
        return adminDefault;
      }
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  const [accentColor, setAccentColor] = useState<string>(() => {
    try {
      return settingsService.getSettings().accentColor || '#10b981';
    } catch {
      return '#10b981';
    }
  });

  // Apply theme attributes to document and root CSS variables
  const applyTheme = useCallback((currentTheme: Theme, currentAccent: string) => {
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-theme', currentTheme);
    body.setAttribute('data-theme', currentTheme);

    if (currentTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
    }

    // Apply primary brand color variables
    root.style.setProperty('--accent', currentAccent);
    root.style.setProperty('--border-focus', currentAccent);
  }, []);

  useEffect(() => {
    applyTheme(theme, accentColor);
  }, [theme, accentColor, applyTheme]);

  // Keep accent in sync if updated in settings
  useEffect(() => {
    const syncSettings = () => {
      try {
        const s = settingsService.getSettings();
        if (s.accentColor && s.accentColor !== accentColor) {
          setAccentColor(s.accentColor);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', syncSettings);
    return () => window.removeEventListener('storage', syncSettings);
  }, [accentColor]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }
    applyTheme(newTheme, accentColor);
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        isLight,
        setTheme,
        toggleTheme,
        accentColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

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
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'ks_portfolio_theme';

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num) || clean.length !== 6) {
    return { r: 16, g: 185, b: 129 }; // Default emerald
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Helper to apply dynamic accent variables to root DOM element
export function applyAccentColorToDOM(color: string, targetTheme?: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const currentTheme: Theme =
    targetTheme ||
    (root.getAttribute('data-theme') === 'light' || root.classList.contains('light') ? 'light' : 'dark');

  // When theme is dark, use default emerald #10b981 unless a custom non-default accent was configured
  // When theme is light, use soft green #16a34a unless a custom non-default accent was configured
  let effectiveColor = color;
  if (!effectiveColor || effectiveColor === '#16a34a' || effectiveColor === '#10b981') {
    effectiveColor = currentTheme === 'light' ? '#16a34a' : '#10b981';
  }

  const { r, g, b } = hexToRgb(effectiveColor);

  // In dark theme with emerald accent, contrast text is deep forest-green #022013
  // In light theme with soft green accent, contrast text is clean white #ffffff
  let contrastText: string;
  if (currentTheme === 'dark') {
    contrastText = effectiveColor === '#10b981' ? '#022013' : ((0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#022013' : '#ffffff');
  } else {
    contrastText = effectiveColor === '#16a34a' ? '#ffffff' : ((0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#022013' : '#ffffff');
  }

  // Hover color: vibrant emerald #05df72 for dark mode, subtle deep #15803d for light mode
  let hoverHex: string;
  if (currentTheme === 'dark') {
    hoverHex = effectiveColor === '#10b981'
      ? '#05df72'
      : `#${Math.min(255, Math.round(r * 1.15)).toString(16).padStart(2, '0')}${Math.min(255, Math.round(g * 1.15)).toString(16).padStart(2, '0')}${Math.min(255, Math.round(b * 1.15)).toString(16).padStart(2, '0')}`;
  } else {
    hoverHex = effectiveColor === '#16a34a'
      ? '#15803d'
      : `#${Math.max(0, Math.round(r * 0.88)).toString(16).padStart(2, '0')}${Math.max(0, Math.round(g * 0.88)).toString(16).padStart(2, '0')}${Math.max(0, Math.round(b * 0.88)).toString(16).padStart(2, '0')}`;
  }

  root.style.setProperty('--primary-accent', effectiveColor);
  root.style.setProperty('--accent', effectiveColor);
  root.style.setProperty('--border-focus', effectiveColor);
  root.style.setProperty('--primary-accent-hover', hoverHex);
  root.style.setProperty('--primary-accent-glow', currentTheme === 'dark' ? `rgba(${r}, ${g}, ${b}, 0.28)` : `rgba(${r}, ${g}, ${b}, 0.12)`);
  root.style.setProperty('--primary-accent-muted', currentTheme === 'dark' ? `rgba(${r}, ${g}, ${b}, 0.15)` : `rgba(${r}, ${g}, ${b}, 0.08)`);
  root.style.setProperty('--primary-accent-contrast', contrastText);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      const adminDefault = settingsService.getSettings().defaultTheme;
      if (adminDefault === 'dark' || adminDefault === 'light') {
        return adminDefault;
      }
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  const [accentColor, setAccentColorState] = useState<string>(() => {
    try {
      const initial = settingsService.getSettings().accentColor || '#10b981';
      return initial;
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

    applyAccentColorToDOM(currentAccent, currentTheme);
  }, []);

  const setAccentColor = useCallback((newColor: string) => {
    setAccentColorState(newColor);
    applyAccentColorToDOM(newColor, theme);
  }, [theme]);

  useEffect(() => {
    applyTheme(theme, accentColor);
  }, [theme, accentColor, applyTheme]);

  // Initial cloud fetch to sync latest settings without flicker
  useEffect(() => {
    let isMounted = true;
    async function syncFromCloud() {
      try {
        const latest = await settingsService.getSettingsAsync();
        if (isMounted && latest) {
          if (latest.accentColor) {
            setAccentColorState(latest.accentColor);
            applyAccentColorToDOM(latest.accentColor);
          }
          if (latest.defaultTheme && !localStorage.getItem(THEME_STORAGE_KEY)) {
            setThemeState(latest.defaultTheme);
          }
        }
      } catch (err) {
        console.warn('Theme cloud sync notice:', err);
      }
    }
    syncFromCloud();
    return () => {
      isMounted = false;
    };
  }, []);

  // Keep accent in sync if updated in settings from another window/tab
  useEffect(() => {
    const syncSettings = () => {
      try {
        const s = settingsService.getSettings();
        if (s.accentColor && s.accentColor !== accentColor) {
          setAccentColorState(s.accentColor);
          applyAccentColorToDOM(s.accentColor);
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
        setAccentColor,
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

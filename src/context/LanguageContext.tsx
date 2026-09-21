import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';
import { en } from '../locales/en';
import { bn } from '../locales/bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (path: string) => string;
  localized: (enVal?: string, bnVal?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('selectedLanguage');
      return (saved === 'bn' || saved === 'en') ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('selectedLanguage', lang);
      document.documentElement.setAttribute('lang', lang);
      if (lang === 'bn') {
        document.documentElement.classList.add('font-bangla');
      } else {
        document.documentElement.classList.remove('font-bangla');
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    if (language === 'bn') {
      document.documentElement.classList.add('font-bangla');
    } else {
      document.documentElement.classList.remove('font-bangla');
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  // Nested translation lookup
  const t = (path: string): string => {
    const keys = path.split('.');
    const dict = language === 'bn' ? bn : en;
    const fallbackDict = en;

    let current: any = dict;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        current = undefined;
        break;
      }
    }

    if (current !== undefined && typeof current === 'string') {
      return current;
    }

    // fallback to English
    let fallback: any = fallbackDict;
    for (const key of keys) {
      if (fallback && typeof fallback === 'object' && key in fallback) {
        fallback = fallback[key];
      } else {
        return path;
      }
    }

    return typeof fallback === 'string' ? fallback : path;
  };

  // Reusable CMS localization fallback helper
  const localized = (enVal?: string, bnVal?: string): string => {
    const cleanEn = (enVal || '').trim();
    const cleanBn = (bnVal || '').trim();

    if (language === 'bn') {
      return cleanBn || cleanEn;
    }
    return cleanEn || cleanBn;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, localized }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

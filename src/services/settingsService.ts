import { SiteSettings } from '../types';
import { initialSiteSettings } from '../data/seedData';
import { getItem, setItem } from './storage';

const STORAGE_KEY = 'ks_portfolio_settings';

export const settingsService = {
  getSettings(): SiteSettings {
    return getItem<SiteSettings>(STORAGE_KEY, initialSiteSettings);
  },

  updateSettings(updated: Partial<SiteSettings>): SiteSettings {
    const current = this.getSettings();
    const merged = { ...current, ...updated };
    setItem(STORAGE_KEY, merged);
    return merged;
  },

  reset(): SiteSettings {
    setItem(STORAGE_KEY, initialSiteSettings);
    return initialSiteSettings;
  },
};

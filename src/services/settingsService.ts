import { SiteSettings } from '../types';
import { initialSiteSettings } from '../data/seedData';
import { getItem, setItem } from './storage';
import {
  supabase,
  isSupabaseConfigured,
  siteSettingsToDb,
  siteSettingsFromDb,
} from '../lib/supabaseClient';

const STORAGE_KEY = 'ks_portfolio_settings';

export const settingsService = {
  getSettings(): SiteSettings {
    const stored = getItem<SiteSettings>(STORAGE_KEY, initialSiteSettings);
    return { ...initialSiteSettings, ...(stored || {}) };
  },

  async getSettingsAsync(): Promise<SiteSettings> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();

        if (!error && data) {
          const settings = { ...initialSiteSettings, ...siteSettingsFromDb(data) };
          setItem(STORAGE_KEY, settings);
          return settings;
        }
      } catch (err) {
        console.warn('Supabase getSettingsAsync error:', err);
      }
    }
    return this.getSettings();
  },

  async updateSettings(updated: Partial<SiteSettings>): Promise<SiteSettings> {
    const current = this.getSettings();
    const merged = { ...current, ...updated };
    setItem(STORAGE_KEY, merged);

    if (isSupabaseConfigured()) {
      try {
        const dbPayload = siteSettingsToDb(merged);
        await supabase.from('site_settings').upsert(dbPayload);
      } catch (err) {
        console.error('Supabase updateSettings error:', err);
      }
    }

    return merged;
  },

  async reset(): Promise<SiteSettings> {
    setItem(STORAGE_KEY, initialSiteSettings);

    if (isSupabaseConfigured()) {
      try {
        const dbPayload = siteSettingsToDb(initialSiteSettings);
        await supabase.from('site_settings').upsert(dbPayload);
      } catch (err) {
        console.error('Supabase reset settings error:', err);
      }
    }

    return initialSiteSettings;
  },
};

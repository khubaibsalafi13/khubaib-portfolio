import { SiteContent } from '../types';
import { initialSiteContent } from '../data/seedData';
import { getItem, setItem } from './storage';
import {
  supabase,
  isSupabaseConfigured,
  siteContentToDb,
  siteContentFromDb,
} from '../lib/supabaseClient';

const STORAGE_KEY = 'ks_portfolio_content';

export const contentService = {
  getContent(): SiteContent {
    return getItem<SiteContent>(STORAGE_KEY, initialSiteContent);
  },

  async getContentAsync(): Promise<SiteContent> {
    if (isSupabaseConfigured()) {
      try {
        console.info('[Public Hero] Supabase content request started');
        const { data, error } = await supabase
          .from('site_content')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();

        if (error) {
          console.warn('[Public Hero] Supabase site_content query error:', error.message);
        }

        if (!error && data) {
          console.info('[Public Hero] Supabase content received');
          const content = siteContentFromDb(data);
          console.info('[Public Hero] database hero URL:', content.heroPersonalImage);
          setItem(STORAGE_KEY, content);
          return content;
        }
      } catch (err) {
        console.warn('[Public Hero] Supabase getContentAsync network error:', err);
      }
    } else {
      console.warn('[Public Hero] Supabase is not configured; serving fallback content.');
    }
    return this.getContent();
  },

  async updateContent(updated: Partial<SiteContent>): Promise<SiteContent> {
    const current = this.getContent();
    const merged = { ...current, ...updated };
    setItem(STORAGE_KEY, merged);

    if (isSupabaseConfigured()) {
      const dbPayload = siteContentToDb(merged);
      const { error } = await supabase.from('site_content').upsert(dbPayload);
      if (error) {
        console.error('[ContentService] Supabase updateContent error:', error);
        throw new Error(`Database save failed: ${error.message} (${error.code || 'DB_ERROR'})`);
      }
      console.info('[ContentService] Supabase site_content upsert succeeded.');
    }

    return merged;
  },

  async resetToDefault(): Promise<SiteContent> {
    setItem(STORAGE_KEY, initialSiteContent);

    if (isSupabaseConfigured()) {
      try {
        const dbPayload = siteContentToDb(initialSiteContent);
        await supabase.from('site_content').upsert(dbPayload);
      } catch (err) {
        console.error('Supabase resetToDefault error:', err);
      }
    }

    return initialSiteContent;
  },
};

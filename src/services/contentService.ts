import { SiteContent } from '../types';
import { initialSiteContent } from '../data/seedData';
import { getItem, setItem } from './storage';

const STORAGE_KEY = 'ks_portfolio_content';

export const contentService = {
  getContent(): SiteContent {
    return getItem<SiteContent>(STORAGE_KEY, initialSiteContent);
  },

  updateContent(updated: Partial<SiteContent>): SiteContent {
    const current = this.getContent();
    const merged = { ...current, ...updated };
    setItem(STORAGE_KEY, merged);
    return merged;
  },

  resetToDefault(): SiteContent {
    setItem(STORAGE_KEY, initialSiteContent);
    return initialSiteContent;
  },
};

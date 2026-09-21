import { ClientLogo } from '../types';
import { initialClientLogos } from '../data/seedData';
import { getItem, setItem } from './storage';

const STORAGE_KEY = 'ks_portfolio_client_logos';

export const clientLogoService = {
  getAll(): ClientLogo[] {
    return getItem<ClientLogo[]>(STORAGE_KEY, initialClientLogos).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getPublished(): ClientLogo[] {
    return this.getAll().filter((l) => l.published);
  },

  save(logo: Partial<ClientLogo> & { companyName: string; logoImage: string }): ClientLogo {
    const all = this.getAll();
    let updated: ClientLogo;

    if (logo.id) {
      const idx = all.findIndex((l) => l.id === logo.id);
      if (idx >= 0) {
        updated = {
          ...all[idx],
          ...logo,
          updatedAt: new Date().toISOString(),
        } as ClientLogo;
        all[idx] = updated;
      } else {
        throw new Error('Client logo not found');
      }
    } else {
      const id = 'logo-' + Date.now();
      updated = {
        id,
        companyName: logo.companyName,
        logoImage: logo.logoImage,
        websiteUrl: logo.websiteUrl || '',
        altTextEn: logo.altTextEn || logo.companyName + ' logo',
        altTextBn: logo.altTextBn || logo.companyName + ' লোগো',
        sortOrder: logo.sortOrder ?? all.length + 1,
        published: logo.published ?? true,
        createdAt: new Date().toISOString(),
      };
      all.push(updated);
    }

    setItem(STORAGE_KEY, all);
    return updated;
  },

  delete(id: string): void {
    const all = this.getAll().filter((l) => l.id !== id);
    setItem(STORAGE_KEY, all);
  },

  reorder(logos: ClientLogo[]): void {
    const updated = logos.map((l, i) => ({ ...l, sortOrder: i + 1 }));
    setItem(STORAGE_KEY, updated);
  },
};

import { Service } from '../types';
import { initialServices } from '../data/seedData';
import { getItem, setItem } from './storage';

const STORAGE_KEY = 'ks_portfolio_services';

export const servicesService = {
  getAll(): Service[] {
    return getItem<Service[]>(STORAGE_KEY, initialServices).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getPublished(): Service[] {
    return this.getAll().filter((s) => s.published);
  },

  save(service: Partial<Service> & { titleEn: string }): Service {
    const all = this.getAll();
    let updated: Service;

    if (service.id) {
      const idx = all.findIndex((s) => s.id === service.id);
      if (idx >= 0) {
        updated = { ...all[idx], ...service } as Service;
        all[idx] = updated;
      } else {
        throw new Error('Service not found');
      }
    } else {
      const id = 'srv-' + Date.now();
      const slug = service.slug || service.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      updated = {
        id,
        slug,
        titleEn: service.titleEn,
        titleBn: service.titleBn || service.titleEn,
        descriptionEn: service.descriptionEn || '',
        descriptionBn: service.descriptionBn || '',
        sortOrder: service.sortOrder ?? all.length + 1,
        published: service.published ?? true,
      };
      all.push(updated);
    }

    setItem(STORAGE_KEY, all);
    return updated;
  },

  delete(id: string): void {
    const all = this.getAll().filter((s) => s.id !== id);
    setItem(STORAGE_KEY, all);
  },

  reorder(services: Service[]): void {
    const updated = services.map((s, i) => ({ ...s, sortOrder: i + 1 }));
    setItem(STORAGE_KEY, updated);
  },
};

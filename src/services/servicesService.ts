import { Service } from '../types';
import { initialServices } from '../data/seedData';
import { getItem, setItem } from './storage';
import {
  supabase,
  isSupabaseConfigured,
  serviceToDb,
  serviceFromDb,
} from '../lib/supabaseClient';

const STORAGE_KEY = 'ks_portfolio_services';

export const servicesService = {
  getAll(): Service[] {
    return getItem<Service[]>(STORAGE_KEY, initialServices).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async getAllAsync(): Promise<Service[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!error && data) {
          const list = data.map(serviceFromDb);
          setItem(STORAGE_KEY, list);
          return list;
        }
      } catch (err) {
        console.warn('Supabase services fetch error:', err);
      }
    }
    return this.getAll();
  },

  getPublished(): Service[] {
    return this.getAll().filter((s) => s.published);
  },

  async getPublishedAsync(): Promise<Service[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('published', true)
          .order('sort_order', { ascending: true });

        if (!error && data) {
          return data.map(serviceFromDb);
        }
      } catch (err) {
        console.warn('Supabase getPublishedAsync services error:', err);
      }
    }
    return this.getPublished();
  },

  async save(service: Partial<Service> & { titleEn: string }): Promise<Service> {
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

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('services').upsert(serviceToDb(updated));
      } catch (err) {
        console.error('Supabase service save error:', err);
      }
    }

    return updated;
  },

  async delete(id: string): Promise<void> {
    const all = this.getAll().filter((s) => s.id !== id);
    setItem(STORAGE_KEY, all);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('services').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase service delete error:', err);
      }
    }
  },

  async reorder(services: Service[]): Promise<void> {
    const updated = services.map((s, i) => ({ ...s, sortOrder: i + 1 }));
    setItem(STORAGE_KEY, updated);

    if (isSupabaseConfigured()) {
      try {
        for (const s of updated) {
          await supabase.from('services').update({ sort_order: s.sortOrder }).eq('id', s.id);
        }
      } catch (err) {
        console.error('Supabase services reorder error:', err);
      }
    }
  },
};

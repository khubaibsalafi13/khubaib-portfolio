import { ClientLogo } from '../types';
import { initialClientLogos } from '../data/seedData';
import { getItem, setItem } from './storage';
import {
  supabase,
  isSupabaseConfigured,
  clientLogoToDb,
  clientLogoFromDb,
} from '../lib/supabaseClient';

const STORAGE_KEY = 'ks_portfolio_client_logos';

export const clientLogoService = {
  getAll(): ClientLogo[] {
    return getItem<ClientLogo[]>(STORAGE_KEY, initialClientLogos).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async getAllAsync(): Promise<ClientLogo[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('client_logos')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!error && data) {
          const list = data.map(clientLogoFromDb);
          setItem(STORAGE_KEY, list);
          return list;
        }
      } catch (err) {
        console.warn('Supabase client logos fetch error:', err);
      }
    }
    return this.getAll();
  },

  getPublished(): ClientLogo[] {
    return this.getAll().filter((l) => l.published);
  },

  async getPublishedAsync(): Promise<ClientLogo[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('client_logos')
          .select('*')
          .eq('published', true)
          .order('sort_order', { ascending: true });

        if (!error && data) {
          return data.map(clientLogoFromDb);
        }
      } catch (err) {
        console.warn('Supabase getPublishedAsync client logos error:', err);
      }
    }
    return this.getPublished();
  },

  async save(logo: Partial<ClientLogo> & { companyName: string; logoImage: string }): Promise<ClientLogo> {
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

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('client_logos').upsert(clientLogoToDb(updated));
      } catch (err) {
        console.error('Supabase client logo save error:', err);
      }
    }

    return updated;
  },

  async delete(id: string): Promise<void> {
    const all = this.getAll().filter((l) => l.id !== id);
    setItem(STORAGE_KEY, all);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('client_logos').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase client logo delete error:', err);
      }
    }
  },

  async reorder(logos: ClientLogo[]): Promise<void> {
    const updated = logos.map((l, i) => ({ ...l, sortOrder: i + 1 }));
    setItem(STORAGE_KEY, updated);

    if (isSupabaseConfigured()) {
      try {
        for (const l of updated) {
          await supabase.from('client_logos').update({ sort_order: l.sortOrder }).eq('id', l.id);
        }
      } catch (err) {
        console.error('Supabase client logos reorder error:', err);
      }
    }
  },
};

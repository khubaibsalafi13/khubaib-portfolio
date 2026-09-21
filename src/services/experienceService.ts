import { Experience } from '../types';
import { initialExperience } from '../data/seedData';
import { getItem, setItem } from './storage';
import {
  supabase,
  isSupabaseConfigured,
  experienceToDb,
  experienceFromDb,
} from '../lib/supabaseClient';

const STORAGE_KEY = 'ks_portfolio_experience';

export const experienceService = {
  getAll(): Experience[] {
    return getItem<Experience[]>(STORAGE_KEY, initialExperience).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async getAllAsync(): Promise<Experience[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('experience')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!error && data) {
          const list = data.map(experienceFromDb);
          setItem(STORAGE_KEY, list);
          return list;
        }
      } catch (err) {
        console.warn('Supabase experience fetch error:', err);
      }
    }
    return this.getAll();
  },

  async save(exp: Partial<Experience> & { company: string; period: string }): Promise<Experience> {
    const all = this.getAll();
    let updated: Experience;

    if (exp.id) {
      const idx = all.findIndex((e) => e.id === exp.id);
      if (idx >= 0) {
        updated = { ...all[idx], ...exp } as Experience;
        all[idx] = updated;
      } else {
        throw new Error('Experience record not found');
      }
    } else {
      const id = 'exp-' + Date.now();
      updated = {
        id,
        company: exp.company,
        roleEn: exp.roleEn || '',
        roleBn: exp.roleBn || '',
        period: exp.period,
        responsibilitiesEn: exp.responsibilitiesEn || [],
        responsibilitiesBn: exp.responsibilitiesBn || [],
        sortOrder: exp.sortOrder ?? all.length + 1,
      };
      all.push(updated);
    }

    setItem(STORAGE_KEY, all);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('experience').upsert(experienceToDb(updated));
      } catch (err) {
        console.error('Supabase experience save error:', err);
      }
    }

    return updated;
  },

  async delete(id: string): Promise<void> {
    const all = this.getAll().filter((e) => e.id !== id);
    setItem(STORAGE_KEY, all);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('experience').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase experience delete error:', err);
      }
    }
  },

  async reorder(items: Experience[]): Promise<void> {
    const updated = items.map((e, i) => ({ ...e, sortOrder: i + 1 }));
    setItem(STORAGE_KEY, updated);

    if (isSupabaseConfigured()) {
      try {
        for (const e of updated) {
          await supabase.from('experience').update({ sort_order: e.sortOrder }).eq('id', e.id);
        }
      } catch (err) {
        console.error('Supabase experience reorder error:', err);
      }
    }
  },
};

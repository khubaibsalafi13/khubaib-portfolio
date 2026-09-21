import { Education } from '../types';
import { initialEducation } from '../data/seedData';
import { getItem, setItem } from './storage';
import {
  supabase,
  isSupabaseConfigured,
  educationToDb,
  educationFromDb,
} from '../lib/supabaseClient';

const STORAGE_KEY = 'ks_portfolio_education';

export const educationService = {
  getAll(): Education[] {
    return getItem<Education[]>(STORAGE_KEY, initialEducation).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async getAllAsync(): Promise<Education[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('education')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!error && data) {
          const list = data.map(educationFromDb);
          setItem(STORAGE_KEY, list);
          return list;
        }
      } catch (err) {
        console.warn('Supabase education fetch error:', err);
      }
    }
    return this.getAll();
  },

  async save(edu: Partial<Education> & { degreeEn: string; institutionEn: string; period: string }): Promise<Education> {
    const all = this.getAll();
    let updated: Education;

    if (edu.id) {
      const idx = all.findIndex((e) => e.id === edu.id);
      if (idx >= 0) {
        updated = { ...all[idx], ...edu } as Education;
        all[idx] = updated;
      } else {
        throw new Error('Education record not found');
      }
    } else {
      const id = 'edu-' + Date.now();
      updated = {
        id,
        degreeEn: edu.degreeEn,
        degreeBn: edu.degreeBn || edu.degreeEn,
        institutionEn: edu.institutionEn,
        institutionBn: edu.institutionBn || edu.institutionEn,
        period: edu.period,
        sortOrder: edu.sortOrder ?? all.length + 1,
      };
      all.push(updated);
    }

    setItem(STORAGE_KEY, all);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('education').upsert(educationToDb(updated));
      } catch (err) {
        console.error('Supabase education save error:', err);
      }
    }

    return updated;
  },

  async delete(id: string): Promise<void> {
    const all = this.getAll().filter((e) => e.id !== id);
    setItem(STORAGE_KEY, all);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('education').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase education delete error:', err);
      }
    }
  },

  async reorder(items: Education[]): Promise<void> {
    const updated = items.map((e, i) => ({ ...e, sortOrder: i + 1 }));
    setItem(STORAGE_KEY, updated);

    if (isSupabaseConfigured()) {
      try {
        for (const e of updated) {
          await supabase.from('education').update({ sort_order: e.sortOrder }).eq('id', e.id);
        }
      } catch (err) {
        console.error('Supabase education reorder error:', err);
      }
    }
  },
};

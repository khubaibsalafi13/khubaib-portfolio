import { Category } from '../types';
import { initialCategories } from '../data/seedData';
import { getItem, setItem } from './storage';
import {
  supabase,
  isSupabaseConfigured,
  categoryToDb,
  categoryFromDb,
} from '../lib/supabaseClient';

const STORAGE_KEY = 'ks_portfolio_categories';

export const categoryService = {
  getAll(): Category[] {
    return getItem<Category[]>(STORAGE_KEY, initialCategories).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async getAllAsync(): Promise<Category[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!error && data) {
          const list = data.map(categoryFromDb);
          setItem(STORAGE_KEY, list);
          return list;
        }
      } catch (err) {
        console.warn('Supabase categories fetch error:', err);
      }
    }
    return this.getAll();
  },

  async save(category: Partial<Category> & { nameEn: string }): Promise<Category> {
    const all = this.getAll();
    let updated: Category;

    if (category.id) {
      const idx = all.findIndex((c) => c.id === category.id);
      if (idx >= 0) {
        updated = { ...all[idx], ...category } as Category;
        all[idx] = updated;
      } else {
        throw new Error('Category not found');
      }
    } else {
      const id = 'cat-' + Date.now();
      const slug = category.slug || category.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      updated = {
        id,
        slug,
        nameEn: category.nameEn,
        nameBn: category.nameBn || category.nameEn,
        sortOrder: category.sortOrder ?? all.length + 1,
      };
      all.push(updated);
    }

    setItem(STORAGE_KEY, all);

    if (isSupabaseConfigured()) {
      try {
        const dbPayload = categoryToDb(updated);
        await supabase.from('categories').upsert(dbPayload);
      } catch (err) {
        console.error('Supabase category save error:', err);
      }
    }

    return updated;
  },

  async delete(id: string): Promise<void> {
    const all = this.getAll().filter((c) => c.id !== id);
    setItem(STORAGE_KEY, all);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase category delete error:', err);
      }
    }
  },

  async reorder(categories: Category[]): Promise<void> {
    const updated = categories.map((c, i) => ({ ...c, sortOrder: i + 1 }));
    setItem(STORAGE_KEY, updated);

    if (isSupabaseConfigured()) {
      try {
        for (const c of updated) {
          await supabase.from('categories').update({ sort_order: c.sortOrder }).eq('id', c.id);
        }
      } catch (err) {
        console.error('Supabase category reorder error:', err);
      }
    }
  },
};

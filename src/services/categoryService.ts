import { Category } from '../types';
import { initialCategories } from '../data/seedData';
import { getItem, setItem } from './storage';

const STORAGE_KEY = 'ks_portfolio_categories';

export const categoryService = {
  getAll(): Category[] {
    return getItem<Category[]>(STORAGE_KEY, initialCategories).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  save(category: Partial<Category> & { nameEn: string }): Category {
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
    return updated;
  },

  delete(id: string): void {
    const all = this.getAll().filter((c) => c.id !== id);
    setItem(STORAGE_KEY, all);
  },

  reorder(categories: Category[]): void {
    const updated = categories.map((c, i) => ({ ...c, sortOrder: i + 1 }));
    setItem(STORAGE_KEY, updated);
  },
};

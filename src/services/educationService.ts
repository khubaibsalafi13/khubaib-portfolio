import { Education } from '../types';
import { initialEducation } from '../data/seedData';
import { getItem, setItem } from './storage';

const STORAGE_KEY = 'ks_portfolio_education';

export const educationService = {
  getAll(): Education[] {
    return getItem<Education[]>(STORAGE_KEY, initialEducation).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  save(edu: Partial<Education> & { degreeEn: string; institutionEn: string; period: string }): Education {
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
    return updated;
  },

  delete(id: string): void {
    const all = this.getAll().filter((e) => e.id !== id);
    setItem(STORAGE_KEY, all);
  },

  reorder(items: Education[]): void {
    const updated = items.map((e, i) => ({ ...e, sortOrder: i + 1 }));
    setItem(STORAGE_KEY, updated);
  },
};

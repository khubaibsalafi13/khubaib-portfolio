import { Experience } from '../types';
import { initialExperience } from '../data/seedData';
import { getItem, setItem } from './storage';

const STORAGE_KEY = 'ks_portfolio_experience';

export const experienceService = {
  getAll(): Experience[] {
    return getItem<Experience[]>(STORAGE_KEY, initialExperience).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  save(exp: Partial<Experience> & { company: string; period: string }): Experience {
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
    return updated;
  },

  delete(id: string): void {
    const all = this.getAll().filter((e) => e.id !== id);
    setItem(STORAGE_KEY, all);
  },

  reorder(items: Experience[]): void {
    const updated = items.map((e, i) => ({ ...e, sortOrder: i + 1 }));
    setItem(STORAGE_KEY, updated);
  },
};

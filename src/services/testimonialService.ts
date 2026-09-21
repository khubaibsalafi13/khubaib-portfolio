import { Testimonial } from '../types';
import { initialTestimonials } from '../data/seedData';
import { getItem, setItem } from './storage';

const STORAGE_KEY = 'ks_portfolio_testimonials';

export const testimonialService = {
  getAll(): Testimonial[] {
    return getItem<Testimonial[]>(STORAGE_KEY, initialTestimonials).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getPublished(): Testimonial[] {
    return this.getAll().filter((t) => t.published);
  },

  save(testimonial: Partial<Testimonial> & { clientName: string; reviewTextEn: string }): Testimonial {
    const all = this.getAll();
    let updated: Testimonial;

    let rating = testimonial.rating;
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      rating = Math.max(1, Math.min(5, rating));
    }

    if (testimonial.id) {
      const idx = all.findIndex((t) => t.id === testimonial.id);
      if (idx >= 0) {
        updated = {
          ...all[idx],
          ...testimonial,
          rating,
          updatedAt: new Date().toISOString(),
        } as Testimonial;
        all[idx] = updated;
      } else {
        throw new Error('Testimonial not found');
      }
    } else {
      const id = 'test-' + Date.now();
      updated = {
        id,
        clientName: testimonial.clientName,
        company: testimonial.company || '',
        role: testimonial.role || '',
        reviewTextEn: testimonial.reviewTextEn,
        reviewTextBn: testimonial.reviewTextBn || testimonial.reviewTextEn,
        rating,
        avatarImage: testimonial.avatarImage || '',
        serviceOrCategory: testimonial.serviceOrCategory || '',
        date: testimonial.date || new Date().toISOString().split('T')[0],
        sortOrder: testimonial.sortOrder ?? all.length + 1,
        published: testimonial.published ?? true,
        featured: testimonial.featured ?? false,
        createdAt: new Date().toISOString(),
      };
      all.push(updated);
    }

    setItem(STORAGE_KEY, all);
    return updated;
  },

  delete(id: string): void {
    const all = this.getAll().filter((t) => t.id !== id);
    setItem(STORAGE_KEY, all);
  },

  reorder(testimonials: Testimonial[]): void {
    const updated = testimonials.map((t, i) => ({ ...t, sortOrder: i + 1 }));
    setItem(STORAGE_KEY, updated);
  },
};

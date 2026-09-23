import { Testimonial } from '../types';
import { initialTestimonials } from '../data/seedData';
import { getItem, setItem } from './storage';
import {
  supabase,
  isSupabaseConfigured,
  testimonialToDb,
  testimonialFromDb,
} from '../lib/supabaseClient';

const STORAGE_KEY = 'ks_portfolio_testimonials';

export const testimonialService = {
  getAll(): Testimonial[] {
    return getItem<Testimonial[]>(STORAGE_KEY, initialTestimonials).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getTestimonials(): Testimonial[] {
    return this.getAll();
  },

  async getAllAsync(): Promise<Testimonial[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!error && data) {
          const list = data.map(testimonialFromDb);
          setItem(STORAGE_KEY, list);
          return list;
        }
      } catch (err) {
        console.warn('Supabase testimonials fetch error:', err);
      }
    }
    return this.getAll();
  },

  getPublished(): Testimonial[] {
    return this.getAll().filter((t) => t.published);
  },

  getPublishedTestimonials(): Testimonial[] {
    return this.getPublished();
  },

  async getPublishedAsync(): Promise<Testimonial[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('published', true)
          .order('sort_order', { ascending: true });

        if (!error && data) {
          return data.map(testimonialFromDb);
        }
      } catch (err) {
        console.warn('Supabase getPublishedAsync testimonials error:', err);
      }
    }
    return this.getPublished();
  },

  async createTestimonial(testimonial: Omit<Testimonial, 'id' | 'createdAt'>): Promise<Testimonial> {
    return this.save(testimonial);
  },

  async updateTestimonial(id: string, updates: Partial<Testimonial>): Promise<Testimonial> {
    return this.save({ ...updates, id } as any);
  },

  async save(testimonial: Partial<Testimonial> & { clientName: string; reviewTextEn: string }): Promise<Testimonial> {
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
          source: testimonial.source !== undefined ? testimonial.source : (all[idx].source || 'admin'),
          submissionId: testimonial.submissionId !== undefined ? testimonial.submissionId : all[idx].submissionId,
          updatedAt: new Date().toISOString(),
        } as Testimonial;
        all[idx] = updated;
      } else {
        // When an ID is provided for a new testimonial or item not yet cached in localStorage
        const id = testimonial.id;
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
          source: testimonial.source || 'admin',
          submissionId: testimonial.submissionId !== undefined ? testimonial.submissionId : null,
          createdAt: testimonial.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        all.push(updated);
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
        source: testimonial.source || 'admin',
        submissionId: testimonial.submissionId !== undefined ? testimonial.submissionId : null,
        createdAt: new Date().toISOString(),
      };
      all.push(updated);
    }

    setItem(STORAGE_KEY, all);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('testimonials-updated'));
    }

    if (isSupabaseConfigured()) {
      const dbPayload = testimonialToDb(updated);
      const { error } = await supabase.from('testimonials').upsert(dbPayload);
      if (error) {
        console.error('Supabase testimonial save error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }
    }

    return updated;
  },

  async delete(id: string): Promise<void> {
    const all = this.getAll().filter((t) => t.id !== id);
    setItem(STORAGE_KEY, all);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('testimonials-updated'));
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('testimonials').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase testimonial delete error:', err);
      }
    }
  },

  async reorder(testimonials: Testimonial[]): Promise<void> {
    const updated = testimonials.map((t, i) => ({ ...t, sortOrder: i + 1 }));
    setItem(STORAGE_KEY, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('testimonials-updated'));
    }

    if (isSupabaseConfigured()) {
      try {
        for (const t of updated) {
          await supabase.from('testimonials').update({ sort_order: t.sortOrder }).eq('id', t.id);
        }
      } catch (err) {
        console.error('Supabase testimonials reorder error:', err);
      }
    }
  },
};

import { Consultation, ConsultationStatus } from '../types';
import { getItem, setItem } from './storage';
import {
  supabase,
  isSupabaseConfigured,
  consultationToDb,
  consultationFromDb,
} from '../lib/supabaseClient';

const STORAGE_KEY = 'ks_portfolio_consultations';

export const consultationService = {
  getAll(): Consultation[] {
    return getItem<Consultation[]>(STORAGE_KEY, []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getAllAsync(): Promise<Consultation[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('consultations')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const list = data.map(consultationFromDb);
          setItem(STORAGE_KEY, list);
          return list;
        } else if (error) {
          console.warn('Supabase fetch consultations error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase consultations fetch exception:', err);
      }
    }
    return this.getAll();
  },

  getByStatus(status: ConsultationStatus): Consultation[] {
    return this.getAll().filter((c) => c.status === status);
  },

  async submit(data: {
    fullName: string;
    email: string;
    company?: string;
    service: string;
    budget?: string;
    timeline?: string;
    message: string;
  }): Promise<Consultation> {
    const all = this.getAll();
    const newConsultation: Consultation = {
      id: 'cons-' + Date.now(),
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      company: data.company?.trim(),
      service: data.service,
      budget: data.budget?.trim(),
      timeline: data.timeline?.trim(),
      message: data.message.trim(),
      status: 'New',
      createdAt: new Date().toISOString(),
    };

    all.unshift(newConsultation);
    setItem(STORAGE_KEY, all);

    // Insert directly into Supabase (allowed for public users via RLS policy)
    if (isSupabaseConfigured()) {
      try {
        const dbPayload = consultationToDb(newConsultation);
        const { error } = await supabase.from('consultations').insert([dbPayload]);
        if (error) {
          console.error('Supabase consultation insert error:', error.message);
        }
      } catch (err) {
        console.error('Supabase consultation submit exception:', err);
      }
    }

    return newConsultation;
  },

  async updateStatus(id: string, status: ConsultationStatus): Promise<Consultation> {
    const all = this.getAll();
    const idx = all.findIndex((c) => c.id === id);
    if (idx < 0) {
      throw new Error('Consultation request not found');
    }
    all[idx].status = status;
    setItem(STORAGE_KEY, all);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('consultations')
          .update({ status })
          .eq('id', id);
        if (error) console.error('Supabase updateStatus error:', error.message);
      } catch (err) {
        console.error('Supabase updateStatus exception:', err);
      }
    }

    return all[idx];
  },

  async delete(id: string): Promise<void> {
    const all = this.getAll().filter((c) => c.id !== id);
    setItem(STORAGE_KEY, all);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('consultations').delete().eq('id', id);
        if (error) console.error('Supabase delete consultation error:', error.message);
      } catch (err) {
        console.error('Supabase delete consultation exception:', err);
      }
    }
  },

  getStats() {
    const all = this.getAll();
    return {
      total: all.length,
      newCount: all.filter((c) => c.status === 'New').length,
      reviewedCount: all.filter((c) => c.status === 'Reviewed').length,
      contactedCount: all.filter((c) => c.status === 'Contacted').length,
      completedCount: all.filter((c) => c.status === 'Completed').length,
      archivedCount: all.filter((c) => c.status === 'Archived').length,
    };
  },
};

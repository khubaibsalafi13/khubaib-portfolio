import { Consultation, ConsultationStatus } from '../types';
import { getItem, setItem } from './storage';

const STORAGE_KEY = 'ks_portfolio_consultations';

export const consultationService = {
  getAll(): Consultation[] {
    return getItem<Consultation[]>(STORAGE_KEY, []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getByStatus(status: ConsultationStatus): Consultation[] {
    return this.getAll().filter((c) => c.status === status);
  },

  submit(data: {
    fullName: string;
    email: string;
    company?: string;
    service: string;
    budget?: string;
    timeline?: string;
    message: string;
  }): Consultation {
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
    return newConsultation;
  },

  updateStatus(id: string, status: ConsultationStatus): Consultation {
    const all = this.getAll();
    const idx = all.findIndex((c) => c.id === id);
    if (idx < 0) {
      throw new Error('Consultation request not found');
    }
    all[idx].status = status;
    setItem(STORAGE_KEY, all);
    return all[idx];
  },

  delete(id: string): void {
    const all = this.getAll().filter((c) => c.id !== id);
    setItem(STORAGE_KEY, all);
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

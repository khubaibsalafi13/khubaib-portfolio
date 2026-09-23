import { TestimonialSubmission, Testimonial } from '../types';
import { getItem, setItem } from './storage';
import { testimonialService } from './testimonialService';
import {
  supabase,
  isSupabaseConfigured,
} from '../lib/supabaseClient';

const SUBMISSIONS_STORAGE_KEY = 'ks_portfolio_testimonial_submissions';
const COOLDOWN_KEY = 'ks_review_submit_cooldown';

// Helper to notify listeners across the application
export const notifySubmissionsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('testimonial-submissions-updated'));
  }
};

export interface CreateSubmissionInput {
  clientName: string;
  company?: string;
  role?: string;
  service?: string;
  rating: number;
  reviewText: string;
  submissionLanguage: 'en' | 'bn';
  clientImage?: string;
  email: string;
  consent: boolean;
  honeypot?: string; // Hidden spam-catcher field
}

export interface ApproveSubmissionEdits {
  clientName?: string;
  company?: string;
  role?: string;
  service?: string;
  rating?: number;
  reviewTextEn?: string;
  reviewTextBn?: string;
  avatarImage?: string;
}

export const testimonialSubmissionService = {
  /**
   * Retrieves all visitor submissions (private moderation data).
   */
  getAll(): TestimonialSubmission[] {
    const list = getItem<TestimonialSubmission[]>(SUBMISSIONS_STORAGE_KEY, []);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Retrieves all pending submissions awaiting admin review.
   */
  getPending(): TestimonialSubmission[] {
    return this.getAll().filter((s) => s.status === 'pending');
  },

  /**
   * Quick count of pending submissions for the Admin badge.
   */
  getPendingCount(): number {
    return this.getPending().length;
  },

  /**
   * Retrieves a single submission by ID.
   */
  getById(id: string): TestimonialSubmission | undefined {
    return this.getAll().find((s) => s.id === id);
  },

  /**
   * Submits a new visitor review.
   * Includes spam prevention (honeypot, cooldown, validation).
   * Does NOT auto-publish!
   */
  async createSubmission(input: CreateSubmissionInput): Promise<TestimonialSubmission> {
    // 1. Anti-spam honeypot detection
    if (input.honeypot && input.honeypot.trim().length > 0) {
      console.warn('[Anti-Spam] Honeypot triggered. Silently dropping bot submission.');
      // Return a simulated success to confuse automated bots
      return {
        id: 'sub-bot-' + Date.now(),
        clientName: input.clientName,
        rating: input.rating,
        reviewText: input.reviewText,
        submissionLanguage: input.submissionLanguage,
        email: input.email,
        consent: true,
        source: 'visitor',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }

    // 2. Client-side cooldown (protects against repeated accidental clicks)
    if (typeof window !== 'undefined') {
      const lastSubmit = localStorage.getItem(COOLDOWN_KEY);
      if (lastSubmit) {
        const diff = Date.now() - parseInt(lastSubmit, 10);
        if (diff < 4000) {
          throw new Error('Please wait a moment before submitting again.');
        }
      }
      localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
    }

    // 3. Validation
    const name = (input.clientName || '').trim();
    if (!name) {
      throw new Error('Please provide your name.');
    }

    const email = (input.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('Please provide a valid email address for verification.');
    }

    const review = (input.reviewText || '').trim();
    if (!review || review.length < 5) {
      throw new Error('Please share a genuine review (at least 5 characters).');
    }

    const rating = Math.max(1, Math.min(5, Math.round(Number(input.rating) || 5)));

    if (!input.consent) {
      throw new Error('You must accept the consent checkbox to submit your review.');
    }

    const submissionLanguage = input.submissionLanguage === 'bn' ? 'bn' : 'en';

    // 4. Create submission record
    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSubmission: TestimonialSubmission = {
      id,
      clientName: name,
      company: (input.company || '').trim(),
      role: (input.role || '').trim(),
      service: (input.service || '').trim(),
      rating,
      reviewText: review,
      submissionLanguage,
      clientImage: input.clientImage || '',
      email, // PRIVATE: Stored only in private moderation storage
      consent: true,
      source: 'visitor',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const all = this.getAll();
    all.unshift(newSubmission);
    setItem(SUBMISSIONS_STORAGE_KEY, all);

    // Ready for future Supabase testimonial_submissions table
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('testimonial_submissions').insert({
          id: newSubmission.id,
          client_name: newSubmission.clientName,
          company: newSubmission.company,
          role: newSubmission.role,
          service: newSubmission.service,
          rating: newSubmission.rating,
          review_text: newSubmission.reviewText,
          submission_language: newSubmission.submissionLanguage,
          client_image: newSubmission.clientImage,
          email: newSubmission.email,
          consent: newSubmission.consent,
          status: newSubmission.status,
          created_at: newSubmission.createdAt,
        });
      } catch (err) {
        console.warn('Supabase testimonial_submissions insert error:', err);
      }
    }

    notifySubmissionsChanged();
    return newSubmission;
  },

  /**
   * Updates moderation data (e.g. edit before approval).
   */
  async updateSubmission(id: string, updates: Partial<TestimonialSubmission>): Promise<TestimonialSubmission> {
    const all = this.getAll();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new Error('Submission not found');
    }

    const updated: TestimonialSubmission = {
      ...all[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    all[idx] = updated;
    setItem(SUBMISSIONS_STORAGE_KEY, all);
    notifySubmissionsChanged();
    return updated;
  },

  /**
   * Approves a visitor review and publishes it into the public testimonials table.
   * Maps only PUBLIC-SAFE fields! NEVER passes visitor email into public data.
   */
  async approveSubmission(
    id: string,
    edits?: ApproveSubmissionEdits
  ): Promise<{ submission: TestimonialSubmission; testimonial: Testimonial }> {
    const submission = this.getById(id);
    if (!submission) {
      throw new Error('Submission not found');
    }

    // Determine English and Bangla review text with fallback
    let reviewEn = '';
    let reviewBn = '';

    if (submission.submissionLanguage === 'bn') {
      reviewBn = edits?.reviewTextBn?.trim() || submission.reviewText;
      reviewEn = edits?.reviewTextEn?.trim() || submission.reviewText; // Fallback so English viewers also see content
    } else {
      reviewEn = edits?.reviewTextEn?.trim() || submission.reviewText;
      reviewBn = edits?.reviewTextBn?.trim() || submission.reviewText; // Fallback so Bangla viewers also see content
    }

    // Check if a public testimonial already exists for this submission
    const existingPublic = testimonialService.getAll().find((t) => t.submissionId === id);

    // Prepare public-safe data
    const publicData = {
      id: existingPublic?.id, // Keep existing ID if re-approving
      clientName: edits?.clientName?.trim() || submission.clientName,
      company: edits?.company !== undefined ? edits.company.trim() : submission.company || '',
      role: edits?.role !== undefined ? edits.role.trim() : submission.role || '',
      serviceOrCategory: edits?.service !== undefined ? edits.service.trim() : submission.service || '',
      rating: edits?.rating !== undefined ? edits.rating : submission.rating,
      reviewTextEn: reviewEn,
      reviewTextBn: reviewBn,
      avatarImage: edits?.avatarImage !== undefined ? edits.avatarImage : submission.clientImage || '',
      date: new Date().toISOString().split('T')[0],
      published: true,
      featured: false, // Per specification: default featured = false
      source: 'visitor' as const,
      submissionId: id,
    };

    // Save into public testimonials
    const savedTestimonial = await testimonialService.save(publicData);

    // Update submission status to approved
    const updatedSubmission = await this.updateSubmission(id, {
      status: 'approved',
      clientName: publicData.clientName,
      company: publicData.company,
      role: publicData.role,
      service: publicData.serviceOrCategory,
      rating: publicData.rating,
      clientImage: publicData.avatarImage,
    });

    notifySubmissionsChanged();
    return { submission: updatedSubmission, testimonial: savedTestimonial };
  },

  /**
   * Rejects a submission. The review will NOT appear publicly.
   */
  async rejectSubmission(id: string): Promise<TestimonialSubmission> {
    const submission = this.getById(id);
    if (!submission) {
      throw new Error('Submission not found');
    }

    // If there was a previously published public testimonial for this submission, unpublish or remove it
    const publicList = testimonialService.getAll();
    const linked = publicList.find((t) => t.submissionId === id);
    if (linked) {
      await testimonialService.save({ ...linked, published: false });
    }

    const updated = await this.updateSubmission(id, { status: 'rejected' });
    notifySubmissionsChanged();
    return updated;
  },

  /**
   * Deletes a submission from the moderation queue.
   */
  async deleteSubmission(id: string): Promise<void> {
    const all = this.getAll().filter((s) => s.id !== id);
    setItem(SUBMISSIONS_STORAGE_KEY, all);

    // If an associated public testimonial exists, clean it up or unpublish
    const publicList = testimonialService.getAll();
    const linked = publicList.find((t) => t.submissionId === id);
    if (linked) {
      await testimonialService.delete(linked.id);
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('testimonial_submissions').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase testimonial_submissions delete error:', err);
      }
    }

    notifySubmissionsChanged();
  },
};

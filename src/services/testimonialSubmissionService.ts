import { TestimonialSubmission, Testimonial } from '../types';
import { testimonialService } from './testimonialService';
import {
  supabase,
  isSupabaseConfigured,
  testimonialSubmissionToDb,
  testimonialSubmissionFromDb,
  testimonialFromDb,
} from '../lib/supabaseClient';

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
  serviceOrCategory?: string;
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

// In-memory cache for fast synchronous access by sidebar badges and initial UI renders
let memoryCache: TestimonialSubmission[] = [];

const updateCacheItem = (item: TestimonialSubmission) => {
  const idx = memoryCache.findIndex((s) => s.id === item.id);
  if (idx >= 0) {
    memoryCache[idx] = item;
  } else {
    memoryCache.unshift(item);
  }
};

const removeFromCache = (id: string) => {
  memoryCache = memoryCache.filter((s) => s.id !== id);
};

export const testimonialSubmissionService = {
  /**
   * Synchronous cached list of all submissions.
   */
  getAll(): TestimonialSubmission[] {
    return [...memoryCache];
  },

  /**
   * Synchronous cached pending submissions.
   */
  getPending(): TestimonialSubmission[] {
    return memoryCache.filter((s) => s.status === 'pending');
  },

  /**
   * Quick count of pending submissions for Admin badge indicators.
   */
  getPendingCount(): number {
    return this.getPending().length;
  },

  /**
   * Synchronous cached lookup by ID.
   */
  getById(id: string): TestimonialSubmission | undefined {
    return memoryCache.find((s) => s.id === id);
  },

  /**
   * Asynchronously retrieves all visitor submissions directly from Supabase.
   */
  async getAllSubmissions(): Promise<TestimonialSubmission[]> {
    if (!isSupabaseConfigured()) {
      return [...memoryCache];
    }
    const { data, error } = await supabase
      .from('testimonial_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Failed to load testimonial submissions from Supabase:', error);
      return [...memoryCache];
    }

    const list = (data || []).map(testimonialSubmissionFromDb);
    memoryCache = list;
    return list;
  },

  /**
   * Asynchronously retrieves pending submissions directly from Supabase.
   */
  async getPendingSubmissions(): Promise<TestimonialSubmission[]> {
    if (!isSupabaseConfigured()) {
      return this.getPending();
    }
    const { data, error } = await supabase
      .from('testimonial_submissions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Failed to load pending submissions from Supabase:', error);
      return this.getPending();
    }

    return (data || []).map(testimonialSubmissionFromDb);
  },

  /**
   * Asynchronously retrieves rejected submissions directly from Supabase.
   */
  async getRejectedSubmissions(): Promise<TestimonialSubmission[]> {
    if (!isSupabaseConfigured()) {
      return memoryCache.filter((s) => s.status === 'rejected');
    }
    const { data, error } = await supabase
      .from('testimonial_submissions')
      .select('*')
      .eq('status', 'rejected')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Failed to load rejected submissions from Supabase:', error);
      return memoryCache.filter((s) => s.status === 'rejected');
    }

    return (data || []).map(testimonialSubmissionFromDb);
  },

  /**
   * Asynchronously retrieves a single submission by ID directly from Supabase.
   */
  async getSubmissionById(id: string): Promise<TestimonialSubmission | null> {
    if (!isSupabaseConfigured()) {
      return this.getById(id) || null;
    }
    const { data, error } = await supabase
      .from('testimonial_submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn('Failed to load submission by ID from Supabase:', error);
      return this.getById(id) || null;
    }

    return data ? testimonialSubmissionFromDb(data) : null;
  },

  /**
   * Submits a new visitor review to public.testimonial_submissions.
   *
   * In accordance with requirements:
   * - Sends ONLY visitor-allowed fields (no status, reviewed_at, reviewed_by).
   * - Database uses default status = 'pending'.
   * - Does NOT insert anything into public.testimonials.
   * - Includes honeypot, cooldown, and input validation.
   * - Catches raw database errors and surfaces a friendly message.
   */
  async createSubmission(input: CreateSubmissionInput): Promise<TestimonialSubmission> {
    // 1. Anti-spam honeypot detection (bots filling hidden fields)
    if (input.honeypot && input.honeypot.trim().length > 0) {
      console.warn('[Anti-Spam] Honeypot triggered. Silently dropping submission.');
      // Return simulated success to avoid alerting automated scrapers
      return {
        id: `sub-bot-${Date.now()}`,
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

    // 2. Client-side cooldown (prevents rapid double-clicks and repeated bursts)
    if (typeof window !== 'undefined') {
      const lastSubmit = localStorage.getItem(COOLDOWN_KEY);
      if (lastSubmit) {
        const diff = Date.now() - parseInt(lastSubmit, 10);
        if (diff < 3500) {
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
      throw new Error('Please provide a valid email address.');
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
    const serviceVal = (input.serviceOrCategory || input.service || '').trim();

    // 4. Send ONLY visitor-allowed fields (no id, status, reviewed_at, reviewed_by, created_at, updated_at)
    // Database defaults handle those fields.
    const visitorPayload = {
      client_name: name,
      company: input.company ? input.company.trim() : null,
      role: input.role ? input.role.trim() : null,
      service_or_category: serviceVal || null,
      rating,
      review_text: review,
      submission_language: submissionLanguage,
      client_image: input.clientImage || null,
      email,
      consent: input.consent === true,
    };

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('testimonial_submissions')
        .insert(visitorPayload);

      if (error) {
        console.error('Visitor testimonial submission failed:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw new Error('Unable to submit your review at this time. Please try again in a few moments.');
      }

      notifySubmissionsChanged();
      return {
        id: '',
        clientName: name,
        company: visitorPayload.company || '',
        role: visitorPayload.role || '',
        serviceOrCategory: serviceVal,
        service: serviceVal,
        rating,
        reviewText: review,
        submissionLanguage,
        clientImage: input.clientImage || '',
        email,
        consent: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }

    // Fallback in-memory representation if not configured
    const simulatedId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : '00000000-0000-4000-8000-' + Date.now().toString().slice(-12);

    const simulated: TestimonialSubmission = {
      id: simulatedId,
      clientName: name,
      company: visitorPayload.company || '',
      role: visitorPayload.role || '',
      serviceOrCategory: serviceVal,
      service: serviceVal,
      rating,
      reviewText: review,
      submissionLanguage,
      clientImage: input.clientImage || '',
      email,
      consent: true,
      status: 'pending',
      source: 'visitor',
      createdAt: new Date().toISOString(),
    };
    updateCacheItem(simulated);
    notifySubmissionsChanged();
    return simulated;
  },

  /**
   * Updates moderation data (e.g. edit before approval).
   */
  async updateSubmission(id: string, updates: Partial<TestimonialSubmission>): Promise<TestimonialSubmission> {
    if (isSupabaseConfigured()) {
      const dbUpdates = testimonialSubmissionToDb(updates);
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('testimonial_submissions')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase testimonial_submissions update error:', error);
        throw new Error(error.message);
      }

      const updated = testimonialSubmissionFromDb(data);
      updateCacheItem(updated);
      notifySubmissionsChanged();
      return updated;
    }

    const existing = this.getById(id);
    if (!existing) throw new Error('Submission not found.');
    const updated: TestimonialSubmission = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    updateCacheItem(updated);
    notifySubmissionsChanged();
    return updated;
  },

  /**
   * Approves a visitor review and creates a public testimonial.
   *
   * Enforces:
   * 1. Idempotency against double-clicks and existing public testimonials.
   * 2. Safe language fallback for review_text_en (NOT NULL in database).
   * 3. Public-safe fields only (NEVER copies email, consent, or reviewed_by).
   * 4. Updates submission status = 'approved', reviewed_at, reviewed_by ONLY after
   *    the public testimonial has been successfully created.
   */
  async approveSubmission(
    id: string,
    edits?: ApproveSubmissionEdits
  ): Promise<{ submission: TestimonialSubmission; testimonial: Testimonial }> {
    const submission = await this.getSubmissionById(id);
    if (!submission) {
      throw new Error('Testimonial submission not found');
    }

    // 1. Idempotency check: verify whether a public testimonial already exists with this submissionId
    // Concepts: Check by submission_id = submission.id, NOT id = submission.id
    let existingPublic: Testimonial | null = null;
    if (isSupabaseConfigured()) {
      const { data: existingRows, error: lookupError } = await supabase
        .from('testimonials')
        .select('*')
        .eq('submission_id', id);

      if (lookupError) {
        console.error('Supabase error checking existing public testimonial by submission_id:', {
          code: lookupError.code,
          message: lookupError.message,
          details: lookupError.details,
          hint: lookupError.hint,
        });
      } else if (existingRows && existingRows.length > 0) {
        existingPublic = testimonialFromDb(existingRows[0]);
      }
    } else {
      existingPublic = testimonialService.getAll().find((t) => t.submissionId === id) || null;
    }

    // If already approved and already has public testimonial, return it safely without duplicating
    if (submission.status === 'approved' && existingPublic) {
      return { submission, testimonial: existingPublic };
    }

    // 2. Language mapping on approval
    // If submission was in Bangla and no English translation was provided by Admin,
    // use the submitted Bangla review as a safe fallback value for review_text_en
    // because testimonials.review_text_en is NOT NULL in the database.
    let reviewEn = '';
    let reviewBn = '';

    if (submission.submissionLanguage === 'bn') {
      reviewBn = edits?.reviewTextBn?.trim() || submission.reviewText;
      reviewEn = edits?.reviewTextEn?.trim() || submission.reviewText; // Safe NOT NULL fallback
    } else {
      reviewEn = edits?.reviewTextEn?.trim() || submission.reviewText;
      reviewBn = edits?.reviewTextBn?.trim() || '';
    }

    // 3. Prepare public-safe testimonial payload (NO email, NO consent, NO reviewed_by)
    // Generate new testimonial ID matching existing testimonialService architecture ('test-' + timestamp)
    // or reuse existing public testimonial's ID if updating
    const testimonialId = existingPublic?.id || ('test-' + Date.now());

    const publicData: Partial<Testimonial> & { clientName: string; reviewTextEn: string } = {
      id: testimonialId,
      clientName: edits?.clientName?.trim() || submission.clientName,
      company: edits?.company !== undefined ? edits.company.trim() : (submission.company || ''),
      role: edits?.role !== undefined ? edits.role.trim() : (submission.role || ''),
      serviceOrCategory: edits?.service !== undefined ? edits.service.trim() : (submission.serviceOrCategory || submission.service || ''),
      rating: edits?.rating !== undefined ? edits.rating : submission.rating,
      reviewTextEn: reviewEn,
      reviewTextBn: reviewBn,
      avatarImage: edits?.avatarImage !== undefined ? edits.avatarImage : (submission.clientImage || ''),
      date: new Date().toISOString().split('T')[0],
      published: true,
      featured: false, // Default featured = false
      source: 'visitor',
      submissionId: id, // FOREIGN KEY -> public.testimonial_submissions.id
    };

    // 4. Save public testimonial first
    const savedTestimonial = await testimonialService.save(publicData);

    // 5. Update submission status to 'approved' ONLY AFTER public testimonial succeeded
    let adminUserId: string | null = null;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.id) {
        adminUserId = sessionData.session.user.id;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          adminUserId = userData.user.id;
        }
      }
    } catch {}

    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const { data: updatedSubData, error: subError } = await supabase
        .from('testimonial_submissions')
        .update({
          status: 'approved',
          reviewed_at: now,
          reviewed_by: adminUserId,
          updated_at: now,
          client_name: publicData.clientName,
          company: publicData.company,
          role: publicData.role,
          service_or_category: publicData.serviceOrCategory,
          rating: publicData.rating,
          client_image: publicData.avatarImage,
        })
        .eq('id', id)
        .select()
        .single();

      if (subError) {
        console.error('Error updating submission record after approval:', {
          code: subError.code,
          message: subError.message,
          details: subError.details,
          hint: subError.hint,
        });
        throw new Error(`Failed to update submission status: ${subError.message}`);
      }

      const updatedSubmission = updatedSubData
        ? testimonialSubmissionFromDb(updatedSubData)
        : {
            ...submission,
            status: 'approved' as const,
            reviewedAt: now,
            reviewedBy: adminUserId,
            updatedAt: now,
          };

      updateCacheItem(updatedSubmission);
      notifySubmissionsChanged();
      return { submission: updatedSubmission, testimonial: savedTestimonial };
    }

    const updatedSubmission: TestimonialSubmission = {
      ...submission,
      status: 'approved',
      reviewedAt: now,
      reviewedBy: adminUserId,
      updatedAt: now,
    };
    updateCacheItem(updatedSubmission);
    notifySubmissionsChanged();
    return { submission: updatedSubmission, testimonial: savedTestimonial };
  },

  /**
   * Rejects a submission. The review will NOT appear publicly.
   */
  async rejectSubmission(id: string): Promise<TestimonialSubmission> {
    const submission = await this.getSubmissionById(id);
    if (!submission) {
      throw new Error('Submission not found');
    }

    let adminUserId: string | null = null;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.id) {
        adminUserId = sessionData.session.user.id;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          adminUserId = userData.user.id;
        }
      }
    } catch {}

    const now = new Date().toISOString();

    // If an associated public testimonial existed previously, unpublish it
    if (isSupabaseConfigured()) {
      const { data: linkedRows } = await supabase
        .from('testimonials')
        .select('*')
        .eq('submission_id', id);

      if (linkedRows && linkedRows.length > 0) {
        for (const row of linkedRows) {
          const t = testimonialFromDb(row);
          await testimonialService.save({
            ...t,
            clientName: t.clientName,
            reviewTextEn: t.reviewTextEn,
            published: false,
          });
        }
      }

      const { data, error } = await supabase
        .from('testimonial_submissions')
        .update({
          status: 'rejected',
          reviewed_at: now,
          reviewed_by: adminUserId,
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error rejecting submission:', error);
        throw new Error(error.message);
      }

      const updated = testimonialSubmissionFromDb(data);
      updateCacheItem(updated);
      notifySubmissionsChanged();
      return updated;
    }

    const linked = testimonialService.getAll().find((t) => t.submissionId === id);
    if (linked) {
      await testimonialService.save({
        ...linked,
        clientName: linked.clientName,
        reviewTextEn: linked.reviewTextEn,
        published: false,
      });
    }

    const updated: TestimonialSubmission = {
      ...submission,
      status: 'rejected',
      reviewedAt: now,
      reviewedBy: adminUserId,
      updatedAt: now,
    };
    updateCacheItem(updated);
    notifySubmissionsChanged();
    return updated;
  },

  /**
   * Deletes a submission from the private moderation table.
   *
   * In accordance with requirements:
   * Removes only that private submission.
   * Does not silently delete unrelated public testimonials.
   */
  async deleteSubmission(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('testimonial_submissions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting submission from Supabase:', error);
        throw new Error(error.message);
      }
    }

    removeFromCache(id);
    notifySubmissionsChanged();
  },
};

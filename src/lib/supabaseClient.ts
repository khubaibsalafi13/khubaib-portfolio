import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Project,
  Category,
  Service,
  Experience,
  Education,
  ClientLogo,
  Testimonial,
  TestimonialSubmission,
  Consultation,
  SiteContent,
  SiteSettings,
  ThumbnailAspectRatio,
} from '../types';

export const getSupabaseUrl = (): string => {
  // 1. Primary: Production environment variable (statically replaced by Vite/Vercel bundler)
  const envUrl = (
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();

  if (
    envUrl &&
    envUrl.startsWith('http') &&
    !envUrl.includes('your-project-id') &&
    !envUrl.includes('placeholder')
  ) {
    return envUrl;
  }

  // 2. Optional fallback: Admin Settings / dev override in localStorage
  try {
    const local = localStorage.getItem('ks_supabase_url');
    if (
      local &&
      local.trim().length > 0 &&
      local.trim().startsWith('http') &&
      !local.includes('your-project-id')
    ) {
      return local.trim();
    }
  } catch {
    // ignore
  }

  return '';
};

export const getSupabaseAnonKey = (): string => {
  // 1. Primary: Production environment variable (statically replaced by Vite/Vercel bundler)
  const envKey = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (
    envKey &&
    !envKey.includes('your-anon-key') &&
    !envKey.includes('placeholder')
  ) {
    return envKey;
  }

  // 2. Optional fallback: Admin Settings / dev override in localStorage
  try {
    const local = localStorage.getItem('ks_supabase_anon_key');
    if (
      local &&
      local.trim().length > 0 &&
      !local.includes('your-anon-key')
    ) {
      return local.trim();
    }
  } catch {
    // ignore
  }

  return '';
};

let hasWarnedMissingConfig = false;

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const configured = Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    !url.includes('your-project-id') &&
    !url.includes('placeholder') &&
    !key.includes('your-anon-key') &&
    !key.includes('placeholder')
  );

  if (!configured && !hasWarnedMissingConfig) {
    console.warn(
      '[Supabase] Production Supabase environment variables are missing or unconfigured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Public requests will serve local fallback content.'
    );
    hasWarnedMissingConfig = true;
  }

  return configured;
};

let activeClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export const getActiveSupabaseClient = (): SupabaseClient => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const configured = isSupabaseConfigured();

  const targetUrl = configured ? url : 'https://placeholder.supabase.co';
  const targetKey = configured ? key : 'placeholder-anon-key';

  if (!activeClient || lastUrl !== targetUrl || lastKey !== targetKey) {
    activeClient = createClient(targetUrl, targetKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    lastUrl = targetUrl;
    lastKey = targetKey;
  }
  return activeClient;
};

// Proxy to guarantee all imports of 'supabase' transparently use the live client with active credentials
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getActiveSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

// Helper to update custom runtime credentials from admin settings
export const setRuntimeSupabaseConfig = (url: string, anonKey: string): void => {
  if (url && anonKey) {
    localStorage.setItem('ks_supabase_url', url.trim());
    localStorage.setItem('ks_supabase_anon_key', anonKey.trim());
  } else {
    localStorage.removeItem('ks_supabase_url');
    localStorage.removeItem('ks_supabase_anon_key');
  }
  // Reset cached instance so next access initializes with updated credentials
  activeClient = null;
  lastUrl = '';
  lastKey = '';
};

export const getSupabaseConfig = () => {
  return {
    url: getSupabaseUrl(),
    anonKey: getSupabaseAnonKey(),
    isConfigured: isSupabaseConfigured(),
  };
};

// ==============================================================================
// TYPE MAPPERS (PostgreSQL snake_case <-> TypeScript camelCase)
// ==============================================================================

export const projectToDb = (project: Partial<Project>): Record<string, any> => {
  const dbRecord: Record<string, any> = {};
  if (project.id !== undefined) dbRecord.id = project.id;
  if (project.slug !== undefined) dbRecord.slug = project.slug;
  if (project.titleEn !== undefined) dbRecord.title_en = project.titleEn;
  if (project.titleBn !== undefined) dbRecord.title_bn = project.titleBn;
  if (project.shortDescriptionEn !== undefined) dbRecord.short_description_en = project.shortDescriptionEn;
  if (project.shortDescriptionBn !== undefined) dbRecord.short_description_bn = project.shortDescriptionBn;
  if (project.overviewEn !== undefined) dbRecord.overview_en = project.overviewEn;
  if (project.overviewBn !== undefined) dbRecord.overview_bn = project.overviewBn;
  if (project.conceptEn !== undefined) dbRecord.concept_en = project.conceptEn;
  if (project.conceptBn !== undefined) dbRecord.concept_bn = project.conceptBn;
  if (project.roleEn !== undefined) dbRecord.role_en = project.roleEn;
  if (project.roleBn !== undefined) dbRecord.role_bn = project.roleBn;
  if (project.client !== undefined) dbRecord.client = project.client;
  if (project.year !== undefined) dbRecord.year = project.year;
  if (project.category !== undefined) dbRecord.category = project.category;
  if (project.coverImage !== undefined) dbRecord.cover_image = project.coverImage;
  if (project.thumbnailAspectRatio !== undefined) dbRecord.thumbnail_aspect_ratio = project.thumbnailAspectRatio;
  if (project.galleryImages !== undefined) dbRecord.gallery_images = project.galleryImages;
  if (project.featured !== undefined) dbRecord.featured = project.featured;
  if (project.heroFeatured !== undefined) dbRecord.hero_featured = project.heroFeatured;
  if (project.published !== undefined) dbRecord.published = project.published;
  if (project.sortOrder !== undefined) dbRecord.sort_order = project.sortOrder;
  if (project.updatedAt !== undefined) dbRecord.updated_at = project.updatedAt;
  return dbRecord;
};

export const projectFromDb = (row: any): Project => {
  return {
    id: row.id,
    slug: row.slug,
    titleEn: row.title_en || '',
    titleBn: row.title_bn || '',
    shortDescriptionEn: row.short_description_en || '',
    shortDescriptionBn: row.short_description_bn || '',
    overviewEn: row.overview_en || '',
    overviewBn: row.overview_bn || '',
    conceptEn: row.concept_en || '',
    conceptBn: row.concept_bn || '',
    roleEn: row.role_en || '',
    roleBn: row.role_bn || '',
    client: row.client || '',
    year: row.year || '',
    category: row.category || '',
    coverImage: row.cover_image || '',
    thumbnailAspectRatio: (row.thumbnail_aspect_ratio as ThumbnailAspectRatio) || 'square',
    galleryImages: Array.isArray(row.gallery_images) ? row.gallery_images : [],
    featured: Boolean(row.featured),
    heroFeatured: Boolean(row.hero_featured),
    published: Boolean(row.published),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at,
  };
};

export const categoryToDb = (c: Partial<Category>): Record<string, any> => {
  const db: Record<string, any> = {};
  if (c.id !== undefined) db.id = c.id;
  if (c.slug !== undefined) db.slug = c.slug;
  if (c.nameEn !== undefined) db.name_en = c.nameEn;
  if (c.nameBn !== undefined) db.name_bn = c.nameBn;
  if (c.sortOrder !== undefined) db.sort_order = c.sortOrder;
  return db;
};

export const categoryFromDb = (row: any): Category => ({
  id: row.id,
  slug: row.slug,
  nameEn: row.name_en,
  nameBn: row.name_bn || row.name_en,
  sortOrder: Number(row.sort_order ?? 0),
});

export const serviceToDb = (s: Partial<Service>): Record<string, any> => {
  const db: Record<string, any> = {};
  if (s.id !== undefined) db.id = s.id;
  if (s.slug !== undefined) db.slug = s.slug;
  if (s.titleEn !== undefined) db.title_en = s.titleEn;
  if (s.titleBn !== undefined) db.title_bn = s.titleBn;
  if (s.descriptionEn !== undefined) db.description_en = s.descriptionEn;
  if (s.descriptionBn !== undefined) db.description_bn = s.descriptionBn;
  if (s.sortOrder !== undefined) db.sort_order = s.sortOrder;
  if (s.published !== undefined) db.published = s.published;
  return db;
};

export const serviceFromDb = (row: any): Service => ({
  id: row.id,
  slug: row.slug,
  titleEn: row.title_en,
  titleBn: row.title_bn || row.title_en,
  descriptionEn: row.description_en || '',
  descriptionBn: row.description_bn || '',
  sortOrder: Number(row.sort_order ?? 0),
  published: Boolean(row.published),
});

export const experienceToDb = (e: Partial<Experience>): Record<string, any> => {
  const db: Record<string, any> = {};
  if (e.id !== undefined) db.id = e.id;
  if (e.company !== undefined) db.company = e.company;
  if (e.roleEn !== undefined) db.role_en = e.roleEn;
  if (e.roleBn !== undefined) db.role_bn = e.roleBn;
  if (e.period !== undefined) db.period = e.period;
  if (e.responsibilitiesEn !== undefined) db.responsibilities_en = e.responsibilitiesEn;
  if (e.responsibilitiesBn !== undefined) db.responsibilities_bn = e.responsibilitiesBn;
  if (e.sortOrder !== undefined) db.sort_order = e.sortOrder;
  return db;
};

export const experienceFromDb = (row: any): Experience => ({
  id: row.id,
  company: row.company,
  roleEn: row.role_en,
  roleBn: row.role_bn || '',
  period: row.period,
  responsibilitiesEn: Array.isArray(row.responsibilities_en) ? row.responsibilities_en : [],
  responsibilitiesBn: Array.isArray(row.responsibilities_bn) ? row.responsibilities_bn : [],
  sortOrder: Number(row.sort_order ?? 0),
});

export const educationToDb = (edu: Partial<Education>): Record<string, any> => {
  const db: Record<string, any> = {};
  if (edu.id !== undefined) db.id = edu.id;
  if (edu.degreeEn !== undefined) db.degree_en = edu.degreeEn;
  if (edu.degreeBn !== undefined) db.degree_bn = edu.degreeBn;
  if (edu.institutionEn !== undefined) db.institution_en = edu.institutionEn;
  if (edu.institutionBn !== undefined) db.institution_bn = edu.institutionBn;
  if (edu.period !== undefined) db.period = edu.period;
  if (edu.sortOrder !== undefined) db.sort_order = edu.sortOrder;
  return db;
};

export const educationFromDb = (row: any): Education => ({
  id: row.id,
  degreeEn: row.degree_en,
  degreeBn: row.degree_bn || row.degree_en,
  institutionEn: row.institution_en,
  institutionBn: row.institution_bn || row.institution_en,
  period: row.period,
  sortOrder: Number(row.sort_order ?? 0),
});

export const clientLogoToDb = (l: Partial<ClientLogo>): Record<string, any> => {
  const db: Record<string, any> = {};
  if (l.id !== undefined) db.id = l.id;
  if (l.companyName !== undefined) db.company_name = l.companyName;
  if (l.logoImage !== undefined) db.logo_image = l.logoImage;
  if (l.websiteUrl !== undefined) db.website_url = l.websiteUrl;
  if (l.altTextEn !== undefined) db.alt_text_en = l.altTextEn;
  if (l.altTextBn !== undefined) db.alt_text_bn = l.altTextBn;
  if (l.sortOrder !== undefined) db.sort_order = l.sortOrder;
  if (l.published !== undefined) db.published = l.published;
  return db;
};

export const clientLogoFromDb = (row: any): ClientLogo => ({
  id: row.id,
  companyName: row.company_name,
  logoImage: row.logo_image,
  websiteUrl: row.website_url || '',
  altTextEn: row.alt_text_en || '',
  altTextBn: row.alt_text_bn || '',
  sortOrder: Number(row.sort_order ?? 0),
  published: Boolean(row.published),
  createdAt: row.created_at || new Date().toISOString(),
  updatedAt: row.updated_at,
});

export const testimonialToDb = (t: Partial<Testimonial>): Record<string, any> => {
  const db: Record<string, any> = {};
  if (t.id !== undefined) db.id = t.id;
  if (t.clientName !== undefined) db.client_name = t.clientName;
  if (t.company !== undefined) db.company = t.company;
  if (t.role !== undefined) db.role = t.role;
  if (t.reviewTextEn !== undefined) db.review_text_en = t.reviewTextEn;
  if (t.reviewTextBn !== undefined) db.review_text_bn = t.reviewTextBn;
  if (t.rating !== undefined) db.rating = t.rating;
  if (t.avatarImage !== undefined) db.avatar_image = t.avatarImage;
  if (t.serviceOrCategory !== undefined) db.service_or_category = t.serviceOrCategory;
  if (t.date !== undefined) db.date = t.date;
  if (t.sortOrder !== undefined) db.sort_order = t.sortOrder;
  if (t.published !== undefined) db.published = t.published;
  if (t.featured !== undefined) db.featured = t.featured;
  if (t.source !== undefined) db.source = t.source || 'admin';
  if (t.submissionId !== undefined) db.submission_id = t.submissionId ? t.submissionId : null;
  return db;
};

export const testimonialFromDb = (row: any): Testimonial => ({
  id: row.id,
  clientName: row.client_name,
  company: row.company || '',
  role: row.role || '',
  reviewTextEn: row.review_text_en,
  reviewTextBn: row.review_text_bn || row.review_text_en,
  rating: Number(row.rating ?? 5),
  avatarImage: row.avatar_image || '',
  serviceOrCategory: row.service_or_category || '',
  date: row.date || '',
  sortOrder: Number(row.sort_order ?? 0),
  published: Boolean(row.published),
  featured: Boolean(row.featured),
  source: row.source === 'visitor' ? 'visitor' : 'admin',
  submissionId: row.submission_id,
  createdAt: row.created_at || new Date().toISOString(),
  updatedAt: row.updated_at,
});

export const testimonialSubmissionToDb = (s: Partial<TestimonialSubmission>): Record<string, any> => {
  const db: Record<string, any> = {};
  if (s.id !== undefined) db.id = s.id;
  if (s.clientName !== undefined) db.client_name = s.clientName;
  if (s.company !== undefined) db.company = s.company;
  if (s.role !== undefined) db.role = s.role;
  if (s.serviceOrCategory !== undefined) db.service_or_category = s.serviceOrCategory;
  else if (s.service !== undefined) db.service_or_category = s.service;
  if (s.rating !== undefined) db.rating = s.rating;
  if (s.reviewText !== undefined) db.review_text = s.reviewText;
  if (s.submissionLanguage !== undefined) db.submission_language = s.submissionLanguage;
  if (s.clientImage !== undefined) db.client_image = s.clientImage;
  if (s.email !== undefined) db.email = s.email;
  if (s.consent !== undefined) db.consent = s.consent;
  if (s.status !== undefined) db.status = s.status;
  if (s.reviewedAt !== undefined) db.reviewed_at = s.reviewedAt;
  if (s.reviewedBy !== undefined) db.reviewed_by = s.reviewedBy ? s.reviewedBy : null;
  if (s.createdAt !== undefined) db.created_at = s.createdAt;
  if (s.updatedAt !== undefined) db.updated_at = s.updatedAt;
  return db;
};

export const testimonialSubmissionFromDb = (row: any): TestimonialSubmission => ({
  id: row.id,
  clientName: row.client_name,
  company: row.company || '',
  role: row.role || '',
  serviceOrCategory: row.service_or_category || '',
  service: row.service_or_category || '',
  rating: Number(row.rating ?? 5),
  reviewText: row.review_text,
  submissionLanguage: row.submission_language === 'bn' ? 'bn' : 'en',
  clientImage: row.client_image || '',
  email: row.email,
  consent: Boolean(row.consent),
  status: (row.status as any) || 'pending',
  reviewedAt: row.reviewed_at,
  reviewedBy: row.reviewed_by,
  source: 'visitor',
  createdAt: row.created_at || new Date().toISOString(),
  updatedAt: row.updated_at,
});

export const consultationToDb = (c: Partial<Consultation>): Record<string, any> => {
  const db: Record<string, any> = {};
  if (c.id !== undefined) db.id = c.id;
  if (c.fullName !== undefined) db.full_name = c.fullName;
  if (c.email !== undefined) db.email = c.email;
  if (c.company !== undefined) db.company = c.company;
  if (c.service !== undefined) db.service = c.service;
  if (c.budget !== undefined) db.budget = c.budget;
  if (c.timeline !== undefined) db.timeline = c.timeline;
  if (c.message !== undefined) db.message = c.message;
  if (c.status !== undefined) db.status = c.status;
  return db;
};

export const consultationFromDb = (row: any): Consultation => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  company: row.company || '',
  service: row.service,
  budget: row.budget || '',
  timeline: row.timeline || '',
  message: row.message,
  status: row.status as any,
  createdAt: row.created_at || new Date().toISOString(),
});

export const siteContentToDb = (c: Partial<SiteContent>): Record<string, any> => {
  const db: Record<string, any> = { id: 'default' };
  if (c.announcementEn !== undefined) db.announcement_en = c.announcementEn;
  if (c.announcementBn !== undefined) db.announcement_bn = c.announcementBn;
  if (c.heroEyebrowEn !== undefined) db.hero_eyebrow_en = c.heroEyebrowEn;
  if (c.heroEyebrowBn !== undefined) db.hero_eyebrow_bn = c.heroEyebrowBn;
  if (c.heroTitleEn !== undefined) db.hero_title_en = c.heroTitleEn;
  if (c.heroTitleBn !== undefined) db.hero_title_bn = c.heroTitleBn;
  if (c.heroDescriptionEn !== undefined) db.hero_description_en = c.heroDescriptionEn;
  if (c.heroDescriptionBn !== undefined) db.hero_description_bn = c.heroDescriptionBn;
  if (c.heroPersonalImage !== undefined) db.hero_personal_image = c.heroPersonalImage;
  if (c.heroPersonalImageTagEn !== undefined) db.hero_personal_image_tag_en = c.heroPersonalImageTagEn;
  if (c.heroPersonalImageTagBn !== undefined) db.hero_personal_image_tag_bn = c.heroPersonalImageTagBn;
  if (c.primaryCtaEn !== undefined) db.primary_cta_en = c.primaryCtaEn;
  if (c.primaryCtaBn !== undefined) db.primary_cta_bn = c.primaryCtaBn;
  if (c.secondaryCtaEn !== undefined) db.secondary_cta_en = c.secondaryCtaEn;
  if (c.secondaryCtaBn !== undefined) db.secondary_cta_bn = c.secondaryCtaBn;
  if (c.aboutTitleEn !== undefined) db.about_title_en = c.aboutTitleEn;
  if (c.aboutTitleBn !== undefined) db.about_title_bn = c.aboutTitleBn;
  if (c.aboutDescriptionEn !== undefined) db.about_description_en = c.aboutDescriptionEn;
  if (c.aboutDescriptionBn !== undefined) db.about_description_bn = c.aboutDescriptionBn;
  if (c.selectedWorkTitleEn !== undefined) db.selected_work_title_en = c.selectedWorkTitleEn;
  if (c.selectedWorkTitleBn !== undefined) db.selected_work_title_bn = c.selectedWorkTitleBn;
  if (c.clientLogosTitleEn !== undefined) db.client_logos_title_en = c.clientLogosTitleEn;
  if (c.clientLogosTitleBn !== undefined) db.client_logos_title_bn = c.clientLogosTitleBn;
  if (c.testimonialsTitleEn !== undefined) db.testimonials_title_en = c.testimonialsTitleEn;
  if (c.testimonialsTitleBn !== undefined) db.testimonials_title_bn = c.testimonialsTitleBn;
  if (c.consultationCtaTitleEn !== undefined) db.consultation_cta_title_en = c.consultationCtaTitleEn;
  if (c.consultationCtaTitleBn !== undefined) db.consultation_cta_title_bn = c.consultationCtaTitleBn;
  if (c.consultationCtaDescEn !== undefined) db.consultation_cta_desc_en = c.consultationCtaDescEn;
  if (c.consultationCtaDescBn !== undefined) db.consultation_cta_desc_bn = c.consultationCtaDescBn;
  if (c.finalCtaTitleEn !== undefined) db.final_cta_title_en = c.finalCtaTitleEn;
  if (c.finalCtaTitleBn !== undefined) db.final_cta_title_bn = c.finalCtaTitleBn;
  if (c.finalCtaDescEn !== undefined) db.final_cta_desc_en = c.finalCtaDescEn;
  if (c.finalCtaDescBn !== undefined) db.final_cta_desc_bn = c.finalCtaDescBn;
  return db;
};

export const siteContentFromDb = (row: any): SiteContent => ({
  announcementEn: row.announcement_en || '',
  announcementBn: row.announcement_bn || '',
  heroEyebrowEn: row.hero_eyebrow_en || '',
  heroEyebrowBn: row.hero_eyebrow_bn || '',
  heroTitleEn: row.hero_title_en || '',
  heroTitleBn: row.hero_title_bn || '',
  heroDescriptionEn: row.hero_description_en || '',
  heroDescriptionBn: row.hero_description_bn || '',
  heroPersonalImage: row.hero_personal_image || '',
  heroPersonalImageTagEn: row.hero_personal_image_tag_en || '',
  heroPersonalImageTagBn: row.hero_personal_image_tag_bn || '',
  primaryCtaEn: row.primary_cta_en || '',
  primaryCtaBn: row.primary_cta_bn || '',
  secondaryCtaEn: row.secondary_cta_en || '',
  secondaryCtaBn: row.secondary_cta_bn || '',
  aboutTitleEn: row.about_title_en || '',
  aboutTitleBn: row.about_title_bn || '',
  aboutDescriptionEn: row.about_description_en || '',
  aboutDescriptionBn: row.about_description_bn || '',
  selectedWorkTitleEn: row.selected_work_title_en || '',
  selectedWorkTitleBn: row.selected_work_title_bn || '',
  clientLogosTitleEn: row.client_logos_title_en || '',
  clientLogosTitleBn: row.client_logos_title_bn || '',
  testimonialsTitleEn: row.testimonials_title_en || '',
  testimonialsTitleBn: row.testimonials_title_bn || '',
  consultationCtaTitleEn: row.consultation_cta_title_en || '',
  consultationCtaTitleBn: row.consultation_cta_title_bn || '',
  consultationCtaDescEn: row.consultation_cta_desc_en || '',
  consultationCtaDescBn: row.consultation_cta_desc_bn || '',
  finalCtaTitleEn: row.final_cta_title_en || '',
  finalCtaTitleBn: row.final_cta_title_bn || '',
  finalCtaDescEn: row.final_cta_desc_en || '',
  finalCtaDescBn: row.final_cta_desc_bn || '',
});

export const siteSettingsToDb = (s: Partial<SiteSettings>): Record<string, any> => {
  const db: Record<string, any> = { id: 'default' };
  if (s.siteName !== undefined) db.site_name = s.siteName;
  if (s.seoTitleEn !== undefined) db.seo_title_en = s.seoTitleEn;
  if (s.seoTitleBn !== undefined) db.seo_title_bn = s.seoTitleBn;
  if (s.seoDescriptionEn !== undefined) db.seo_description_en = s.seoDescriptionEn;
  if (s.seoDescriptionBn !== undefined) db.seo_description_bn = s.seoDescriptionBn;
  if (s.behanceUrl !== undefined) db.behance_url = s.behanceUrl;
  if (s.email !== undefined) db.email = s.email;
  if (s.instagramUrl !== undefined) db.instagram_url = s.instagramUrl;
  if (s.linkedinUrl !== undefined) db.linkedin_url = s.linkedinUrl;
  if (s.footerTextEn !== undefined) db.footer_text_en = s.footerTextEn;
  if (s.footerTextBn !== undefined) db.footer_text_bn = s.footerTextBn;
  if (s.accentColor !== undefined) {
    db.accent_color = s.accentColor;
  }
  if (s.defaultTheme !== undefined) db.default_theme = s.defaultTheme;
  if (s.cursorGlowSize !== undefined) db.cursor_glow_size = s.cursorGlowSize;
  if (s.logoMarqueeSpeed !== undefined) db.logo_marquee_speed = s.logoMarqueeSpeed;
  if (s.carouselAutoplay !== undefined) db.carousel_autoplay = s.carouselAutoplay;
  if (s.carouselInterval !== undefined) db.carousel_interval = s.carouselInterval;
  if (s.testimonialsDisplayMode !== undefined) db.testimonials_display_mode = s.testimonialsDisplayMode;
  return db;
};

export const siteSettingsFromDb = (row: any): SiteSettings => ({
  siteName: row.site_name || 'Khubaib Salafi',
  seoTitleEn: row.seo_title_en || '',
  seoTitleBn: row.seo_title_bn || '',
  seoDescriptionEn: row.seo_description_en || '',
  seoDescriptionBn: row.seo_description_bn || '',
  behanceUrl: row.behance_url || '',
  email: row.email || '',
  instagramUrl: row.instagram_url || '',
  linkedinUrl: row.linkedin_url || '',
  footerTextEn: row.footer_text_en || '',
  footerTextBn: row.footer_text_bn || '',
  accentColor: row.primary_accent_color || row.accent_color || '#10b981',
  defaultTheme: (row.default_theme as any) || 'dark',
  cursorGlowSize: (row.cursor_glow_size as any) || 'small',
  logoMarqueeSpeed: Number(row.logo_marquee_speed ?? 25),
  carouselAutoplay: Boolean(row.carousel_autoplay ?? true),
  carouselInterval: Number(row.carousel_interval ?? 6),
  testimonialsDisplayMode: (row.testimonials_display_mode as any) || 'grid',
});

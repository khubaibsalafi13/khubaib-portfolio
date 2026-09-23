export type Language = 'en' | 'bn';

export interface ProjectImage {
  id: string;
  url: string;
  captionEn?: string;
  captionBn?: string;
  altTextEn?: string;
  altTextBn?: string;
  sortOrder: number;
}

export interface Project {
  id: string;
  slug: string;
  titleEn: string;
  titleBn: string;
  shortDescriptionEn: string;
  shortDescriptionBn: string;
  overviewEn: string;
  overviewBn: string;
  conceptEn: string;
  conceptBn: string;
  roleEn: string;
  roleBn: string;
  client: string;
  year: string;
  category: string; // or category slug/name
  coverImage: string;
  galleryImages: ProjectImage[];
  featured: boolean;
  heroFeatured: boolean;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  sortOrder: number;
}

export interface Service {
  id: string;
  slug: string;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  sortOrder: number;
  published: boolean;
}

export type ServiceItem = Service;

export interface Experience {
  id: string;
  company: string;
  roleEn: string;
  roleBn: string;
  period: string;
  responsibilitiesEn: string[];
  responsibilitiesBn: string[];
  sortOrder: number;
}

export interface Education {
  id: string;
  degreeEn: string;
  degreeBn: string;
  institutionEn: string;
  institutionBn: string;
  period: string;
  sortOrder: number;
}

export interface ClientLogo {
  id: string;
  companyName: string;
  logoImage: string;
  websiteUrl?: string;
  altTextEn: string;
  altTextBn: string;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type TestimonialSource = 'admin' | 'visitor';

export interface Testimonial {
  id: string;
  clientName: string;
  company: string;
  role: string;
  reviewTextEn: string;
  reviewTextBn: string;
  rating?: number; // 1 - 5
  avatarImage?: string;
  serviceOrCategory?: string;
  date?: string;
  sortOrder: number;
  published: boolean;
  featured: boolean;
  source?: TestimonialSource;
  submissionId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type SubmissionLanguage = 'en' | 'bn';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface TestimonialSubmission {
  id: string;
  clientName: string;
  company?: string;
  role?: string;
  serviceOrCategory?: string;
  service?: string; // backwards compatibility alias
  rating: number; // 1 - 5
  reviewText: string;
  submissionLanguage: SubmissionLanguage;
  clientImage?: string;
  email: string; // PRIVATE moderation data - never exposed in public testimonials
  consent: boolean;
  status: SubmissionStatus;
  reviewedAt?: string;
  reviewedBy?: string | null;
  source?: 'visitor';
  createdAt: string;
  updatedAt?: string;
}

export type ConsultationStatus = 'New' | 'Reviewed' | 'Contacted' | 'Completed' | 'Archived';

export interface Consultation {
  id: string;
  fullName: string;
  email: string;
  company?: string;
  service: string;
  budget?: string;
  timeline?: string;
  message: string;
  status: ConsultationStatus;
  createdAt: string;
}

export type ConsultationRequest = Consultation;

export interface SiteContent {
  announcementEn: string;
  announcementBn: string;
  heroEyebrowEn: string;
  heroEyebrowBn: string;
  heroTitleEn: string;
  heroTitleBn: string;
  heroDescriptionEn: string;
  heroDescriptionBn: string;
  heroPersonalImage?: string;
  heroPersonalImageTagEn?: string;
  heroPersonalImageTagBn?: string;
  primaryCtaEn: string;
  primaryCtaBn: string;
  secondaryCtaEn: string;
  secondaryCtaBn: string;
  aboutTitleEn: string;
  aboutTitleBn: string;
  aboutDescriptionEn: string;
  aboutDescriptionBn: string;
  selectedWorkTitleEn: string;
  selectedWorkTitleBn: string;
  clientLogosTitleEn: string;
  clientLogosTitleBn: string;
  testimonialsTitleEn: string;
  testimonialsTitleBn: string;
  consultationCtaTitleEn: string;
  consultationCtaTitleBn: string;
  consultationCtaDescEn: string;
  consultationCtaDescBn: string;
  finalCtaTitleEn: string;
  finalCtaTitleBn: string;
  finalCtaDescEn: string;
  finalCtaDescBn: string;
}

export type Theme = 'dark' | 'light';

export interface SiteSettings {
  siteName: string;
  seoTitleEn: string;
  seoTitleBn: string;
  seoDescriptionEn: string;
  seoDescriptionBn: string;
  behanceUrl: string;
  email?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  footerTextEn: string;
  footerTextBn: string;
  accentColor: string;
  defaultTheme?: 'dark' | 'light';
  cursorGlowSize?: 'small' | 'medium' | 'large';
  logoMarqueeSpeed: number; // seconds
  carouselAutoplay: boolean;
  carouselInterval: number; // seconds
  testimonialsDisplayMode: 'grid' | 'carousel';
}

export interface AdminUser {
  username: string;
  isAuthenticated: boolean;
  token?: string;
}

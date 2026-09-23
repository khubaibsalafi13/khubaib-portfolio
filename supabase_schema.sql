-- ==============================================================================
-- KHUBAIB SALAFI PORTFOLIO - SUPABASE POSTGRESQL SCHEMA & INITIAL SEED DATA
-- ==============================================================================
-- This schema provisions all necessary PostgreSQL tables, Row Level Security (RLS)
-- policies, triggers, and pre-filled seed data for the portfolio and admin management.
-- Run this SQL in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query).
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLES DEFINITIONS
-- ==============================================================================

-- 2.1 CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_bn TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.2 PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title_en TEXT NOT NULL,
    title_bn TEXT,
    short_description_en TEXT,
    short_description_bn TEXT,
    overview_en TEXT,
    overview_bn TEXT,
    concept_en TEXT,
    concept_bn TEXT,
    role_en TEXT,
    role_bn TEXT,
    client TEXT,
    year TEXT,
    category TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    gallery_images JSONB DEFAULT '[]'::jsonb NOT NULL,
    featured BOOLEAN DEFAULT true NOT NULL,
    hero_featured BOOLEAN DEFAULT false NOT NULL,
    published BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.3 SERVICES (DISCIPLINES)
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title_en TEXT NOT NULL,
    title_bn TEXT,
    description_en TEXT,
    description_bn TEXT,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    published BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.4 EXPERIENCE
CREATE TABLE IF NOT EXISTS public.experience (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    role_en TEXT NOT NULL,
    role_bn TEXT,
    period TEXT NOT NULL,
    responsibilities_en JSONB DEFAULT '[]'::jsonb NOT NULL,
    responsibilities_bn JSONB DEFAULT '[]'::jsonb NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.5 EDUCATION
CREATE TABLE IF NOT EXISTS public.education (
    id TEXT PRIMARY KEY,
    degree_en TEXT NOT NULL,
    degree_bn TEXT,
    institution_en TEXT NOT NULL,
    institution_bn TEXT,
    period TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.6 CLIENT LOGOS
CREATE TABLE IF NOT EXISTS public.client_logos (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    logo_image TEXT NOT NULL,
    website_url TEXT,
    alt_text_en TEXT,
    alt_text_bn TEXT,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    published BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.7 TESTIMONIAL SUBMISSIONS (VISITOR REVIEWS FOR MODERATION)
CREATE TABLE IF NOT EXISTS public.testimonial_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL CHECK (char_length(trim(client_name)) > 0),
    company TEXT,
    role TEXT,
    service_or_category TEXT,
    rating INTEGER DEFAULT 5 NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL CHECK (char_length(trim(review_text)) > 0),
    submission_language TEXT DEFAULT 'en' NOT NULL CHECK (submission_language IN ('en', 'bn')),
    client_image TEXT,
    email TEXT NOT NULL CHECK (char_length(trim(email)) > 0),
    consent BOOLEAN DEFAULT false NOT NULL CHECK (consent = true),
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.8 TESTIMONIALS
CREATE TABLE IF NOT EXISTS public.testimonials (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    company TEXT,
    role TEXT,
    review_text_en TEXT NOT NULL,
    review_text_bn TEXT,
    rating INTEGER DEFAULT 5,
    avatar_image TEXT,
    service_or_category TEXT,
    date TEXT,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    published BOOLEAN DEFAULT true NOT NULL,
    featured BOOLEAN DEFAULT false NOT NULL,
    source TEXT DEFAULT 'admin' NOT NULL,
    submission_id UUID,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT fk_testimonials_submission FOREIGN KEY (submission_id) REFERENCES public.testimonial_submissions(id) ON DELETE SET NULL,
    CONSTRAINT uq_testimonials_submission_id UNIQUE (submission_id)
);

-- 2.9 CONSULTATIONS (INQUIRIES / CONTACT MESSAGES)
-- Note: An asynchronous Supabase Database Webhook triggers the 'send-consultation-notification'
-- Edge Function on INSERT into this table to dispatch notification emails via Resend.
-- Email delivery is non-blocking and independent from client-side row persistence.
CREATE TABLE IF NOT EXISTS public.consultations (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    service TEXT NOT NULL,
    budget TEXT,
    timeline TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'New' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.10 SITE CONTENT (BILINGUAL HOMEPAGE & EDITORIAL COPY)
CREATE TABLE IF NOT EXISTS public.site_content (
    id TEXT PRIMARY KEY DEFAULT 'default',
    announcement_en TEXT,
    announcement_bn TEXT,
    hero_eyebrow_en TEXT,
    hero_eyebrow_bn TEXT,
    hero_title_en TEXT,
    hero_title_bn TEXT,
    hero_description_en TEXT,
    hero_description_bn TEXT,
    hero_personal_image TEXT,
    hero_personal_image_tag_en TEXT,
    hero_personal_image_tag_bn TEXT,
    primary_cta_en TEXT,
    primary_cta_bn TEXT,
    secondary_cta_en TEXT,
    secondary_cta_bn TEXT,
    about_title_en TEXT,
    about_title_bn TEXT,
    about_description_en TEXT,
    about_description_bn TEXT,
    selected_work_title_en TEXT,
    selected_work_title_bn TEXT,
    client_logos_title_en TEXT,
    client_logos_title_bn TEXT,
    testimonials_title_en TEXT,
    testimonials_title_bn TEXT,
    consultation_cta_title_en TEXT,
    consultation_cta_title_bn TEXT,
    consultation_cta_desc_en TEXT,
    consultation_cta_desc_bn TEXT,
    final_cta_title_en TEXT,
    final_cta_title_bn TEXT,
    final_cta_desc_en TEXT,
    final_cta_desc_bn TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.11 SITE SETTINGS (BRAND COLOR, THEME, SEO, SOCIAL LINKS)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    site_name TEXT NOT NULL DEFAULT 'Khubaib Salafi',
    seo_title_en TEXT,
    seo_title_bn TEXT,
    seo_description_en TEXT,
    seo_description_bn TEXT,
    behance_url TEXT,
    email TEXT,
    instagram_url TEXT,
    linkedin_url TEXT,
    footer_text_en TEXT,
    footer_text_bn TEXT,
    accent_color TEXT DEFAULT '#10b981',
    default_theme TEXT DEFAULT 'dark',
    cursor_glow_size TEXT DEFAULT 'small',
    logo_marquee_speed INTEGER DEFAULT 25,
    carousel_autoplay BOOLEAN DEFAULT true,
    carousel_interval INTEGER DEFAULT 6,
    testimonials_display_mode TEXT DEFAULT 'grid',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Requirements:
-- * Public SELECT (read) access for visitors on portfolio content.
-- * Authenticated-only (INSERT, UPDATE, DELETE) access for the Admin.
-- * For consultations: Public can INSERT inquiries; Authenticated Admin can SELECT, UPDATE, DELETE.

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
    DROP POLICY IF EXISTS "Admin full access on categories" ON public.categories;
    
    DROP POLICY IF EXISTS "Public can view projects" ON public.projects;
    DROP POLICY IF EXISTS "Admin full access on projects" ON public.projects;
    
    DROP POLICY IF EXISTS "Public can view services" ON public.services;
    DROP POLICY IF EXISTS "Admin full access on services" ON public.services;
    
    DROP POLICY IF EXISTS "Public can view experience" ON public.experience;
    DROP POLICY IF EXISTS "Admin full access on experience" ON public.experience;
    
    DROP POLICY IF EXISTS "Public can view education" ON public.education;
    DROP POLICY IF EXISTS "Admin full access on education" ON public.education;
    
    DROP POLICY IF EXISTS "Public can view client logos" ON public.client_logos;
    DROP POLICY IF EXISTS "Admin full access on client logos" ON public.client_logos;
    
    DROP POLICY IF EXISTS "Public can view testimonials" ON public.testimonials;
    DROP POLICY IF EXISTS "Public can view published testimonials" ON public.testimonials;
    DROP POLICY IF EXISTS "Admin full access on testimonials" ON public.testimonials;
    
    DROP POLICY IF EXISTS "Public can submit testimonial review" ON public.testimonial_submissions;
    DROP POLICY IF EXISTS "Admin full access on testimonial submissions" ON public.testimonial_submissions;
    
    DROP POLICY IF EXISTS "Public can submit consultations" ON public.consultations;
    DROP POLICY IF EXISTS "Admin full access on consultations" ON public.consultations;
    
    DROP POLICY IF EXISTS "Public can view site content" ON public.site_content;
    DROP POLICY IF EXISTS "Admin full access on site content" ON public.site_content;
    
    DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
    DROP POLICY IF EXISTS "Admin full access on site settings" ON public.site_settings;
END $$;

-- 3.1 CATEGORIES POLICIES
CREATE POLICY "Public can view categories" 
    ON public.categories FOR SELECT 
    USING (true);

CREATE POLICY "Admin full access on categories" 
    ON public.categories FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 3.2 PROJECTS POLICIES
CREATE POLICY "Public can view projects" 
    ON public.projects FOR SELECT 
    USING (true);

CREATE POLICY "Admin full access on projects" 
    ON public.projects FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 3.3 SERVICES POLICIES
CREATE POLICY "Public can view services" 
    ON public.services FOR SELECT 
    USING (true);

CREATE POLICY "Admin full access on services" 
    ON public.services FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 3.4 EXPERIENCE POLICIES
CREATE POLICY "Public can view experience" 
    ON public.experience FOR SELECT 
    USING (true);

CREATE POLICY "Admin full access on experience" 
    ON public.experience FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 3.5 EDUCATION POLICIES
CREATE POLICY "Public can view education" 
    ON public.education FOR SELECT 
    USING (true);

CREATE POLICY "Admin full access on education" 
    ON public.education FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 3.6 CLIENT LOGOS POLICIES
CREATE POLICY "Public can view client logos" 
    ON public.client_logos FOR SELECT 
    USING (true);

CREATE POLICY "Admin full access on client logos" 
    ON public.client_logos FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 3.7 TESTIMONIALS POLICIES
-- Public visitors can only view published testimonials:
CREATE POLICY "Public can view published testimonials" 
    ON public.testimonials FOR SELECT 
    USING (published = true);

CREATE POLICY "Admin full access on testimonials" 
    ON public.testimonials FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 3.8 TESTIMONIAL SUBMISSIONS POLICIES & GRANTS (Visitor Review Moderation)
-- Anonymous visitors can insert a new pending testimonial review:
CREATE POLICY "Public can submit testimonial review" 
    ON public.testimonial_submissions FOR INSERT 
    WITH CHECK (status = 'pending');

-- Authenticated Admin has full access to moderate, approve, edit, and delete submissions:
CREATE POLICY "Admin full access on testimonial submissions" 
    ON public.testimonial_submissions FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- API Column-Level Grants (Restricts anon to inserting public review fields only; no SELECT/UPDATE/DELETE; no INSERT on id, status, reviewed_at, reviewed_by, created_at, updated_at):
REVOKE ALL ON public.testimonial_submissions FROM PUBLIC, anon;

GRANT INSERT (
    client_name,
    company,
    role,
    service_or_category,
    rating,
    review_text,
    submission_language,
    client_image,
    email,
    consent
) ON public.testimonial_submissions TO anon;

GRANT ALL ON public.testimonial_submissions TO authenticated;
GRANT ALL ON public.testimonial_submissions TO service_role;

-- 3.9 CONSULTATIONS POLICIES (Contact Inquiries)
-- Anyone can submit a consultation message:
CREATE POLICY "Public can submit consultations" 
    ON public.consultations FOR INSERT 
    WITH CHECK (true);

-- Only authenticated administrator can read, update status, and delete consultations:
CREATE POLICY "Admin full access on consultations" 
    ON public.consultations FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 3.9 SITE CONTENT POLICIES
CREATE POLICY "Public can view site content" 
    ON public.site_content FOR SELECT 
    USING (true);

CREATE POLICY "Admin full access on site content" 
    ON public.site_content FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 3.10 SITE SETTINGS POLICIES
CREATE POLICY "Public can view site settings" 
    ON public.site_settings FOR SELECT 
    USING (true);

CREATE POLICY "Admin full access on site settings" 
    ON public.site_settings FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- ==============================================================================
-- 4. PRE-FILLED SEED DATA
-- ==============================================================================

-- 4.1 CATEGORIES SEED
INSERT INTO public.categories (id, slug, name_en, name_bn, sort_order)
VALUES 
    ('cat-1', 'brand-identity', 'Brand Identity', 'ব্র্যান্ড আইডেন্টিটি', 1),
    ('cat-2', 'graphic-design', 'Graphic Design', 'গ্রাফিক ডিজাইন', 2),
    ('cat-3', 'digital-design', 'Digital Design', 'ডিজিটাল ডিজাইন', 3),
    ('cat-4', 'ui-web-design', 'UI / Web Design', 'ইউআই / ওয়েব ডিজাইন', 4)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    name_en = EXCLUDED.name_en,
    name_bn = EXCLUDED.name_bn,
    sort_order = EXCLUDED.sort_order;

-- 4.2 SERVICES SEED
INSERT INTO public.services (id, slug, title_en, title_bn, description_en, description_bn, sort_order, published)
VALUES
    ('srv-1', 'brand-identity', 'Brand Identity', 'ব্র্যান্ড আইডেন্টিটি', 'Crafting distinctive brand marks, comprehensive logo systems, color palettes, and brand guidelines that communicate purpose.', 'স্বতন্ত্র ব্র্যান্ড মার্ক, পূর্ণাঙ্গ লোগো সিস্টেম, কালার প্যালেট এবং উদ্দেশ্যপূর্ণ ব্র্যান্ড নির্দেশিকা তৈরি।', 1, true),
    ('srv-2', 'graphic-design', 'Graphic Design', 'গ্রাফিক ডিজাইন', 'High-impact print & digital graphics including publication design, posters, marketing collateral, and cultural typography projects.', 'প্রকাশনা, পোস্টার, মার্কেটিং ম্যাটেরিয়াল ও সাংস্কৃতিক টাইপোগ্রাফিসহ উচ্চমানসম্পন্ন প্রিন্ট ও ডিজিটাল গ্রাফিক্স।', 2, true),
    ('srv-3', 'digital-design', 'Digital Design', 'ডিজিটাল ডিজাইন', 'Modern digital assets, social media design systems, presentation decks, and visual communication materials optimized for screens.', 'স্ক্রিন অপ্টিমাইজড আধুনিক ডিজিটাল অ্যাসেট, সোশ্যাল মিডিয়া ডিজাইন সিস্টেম এবং প্রেজেন্টেশন ডেক।', 3, true),
    ('srv-4', 'ui-web-design', 'UI / Web Design', 'ইউআই / ওয়েব ডিজাইন', 'Aesthetic and usable user interface concepts, web design layouts, and digital prototypes with disciplined hierarchy and typography.', 'সুশৃঙ্খল হায়ারার্কি ও মার্জিত টাইপোগ্রাফির সমন্বয়ে দৃষ্টিনন্দন ইউজার ইন্টারফেস ও ওয়েব ডিজাইন কনসেপ্ট।', 4, true)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    title_en = EXCLUDED.title_en,
    title_bn = EXCLUDED.title_bn,
    description_en = EXCLUDED.description_en,
    description_bn = EXCLUDED.description_bn,
    sort_order = EXCLUDED.sort_order,
    published = EXCLUDED.published;

-- 4.3 PROJECTS SEED
INSERT INTO public.projects (
    id, slug, title_en, title_bn, short_description_en, short_description_bn,
    overview_en, overview_bn, concept_en, concept_bn, role_en, role_bn,
    client, year, category, cover_image, gallery_images, featured, hero_featured, published, sort_order
)
VALUES
    (
        'proj-1',
        'mailsonic-brand-identity',
        'MailSonic Brand Identity',
        'মেইলসনিক ব্র্যান্ড আইডেন্টিটি',
        'Complete visual identity, logo system, and brand collateral for an email communication platform.',
        'ইমেইল কমিউনিকেশন প্ল্যাটফর্মের জন্য সম্পূর্ণ ভিজ্যুয়াল আইডেন্টিটি, লোগো সিস্টেম এবং ব্র্যান্ড ম্যাটেরিয়াল।',
        'MailSonic required a clean, modern, and trustworthy brand identity reflecting agility and seamless connectivity in digital messaging. The design system centers around dynamic sound-wave glyphs integrated with email iconography.',
        'মেইলসনিক একটি পরিষ্কার, আধুনিক এবং নির্ভরযোগ্য ব্র্যান্ড আইডেন্টিটি চেয়েছিল যা ডিজিটাল মেসেজিংয়ে ক্ষিপ্রতা ও নিরবচ্ছিন্ন যোগাযোগকে প্রতিফলিত করে। ডিজাইন সিস্টেমে সাউন্ড-ওয়েভ ও ইমেইল আইকনোগ্রাফির সমন্বয় তৈরি করা হয়েছে।',
        'Merging sonic frequency waves with an aerodynamic envelope geometry to symbolize rapid communication.',
        'দ্রুত যোগাযোগের প্রতীক হিসেবে সাউন্ড ফ্রিকোয়েন্সি ওয়েভ এবং অ্যারোডাইনামিক এনভেলপ জ্যামিতির অনন্য মেলবন্ধন।',
        'Lead Brand Identity Designer',
        'প্রধান ব্র্যান্ড আইডেন্টিটি ডিজাইনার',
        'MailSonic',
        '2024',
        'Brand Identity',
        'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1400&q=80',
        '[
            {"id": "img-1-1", "url": "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=1200&q=80", "captionEn": "Color system and typography hierarchy guide", "captionBn": "কালার সিস্টেম এবং টাইপোগ্রাফি নির্দেশিকা", "altTextEn": "MailSonic brand guidelines book", "altTextBn": "মেইলসনিক ব্র্যান্ড নির্দেশিকা বই", "sortOrder": 1},
            {"id": "img-1-2", "url": "https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&w=1200&q=80", "captionEn": "Digital presentation deck and stationery layouts", "captionBn": "ডিজিটাল প্রেজেন্টেশন এবং স্টেশনারি লেআউট", "altTextEn": "MailSonic stationery design", "altTextBn": "মেইলসনিক স্টেশনারি ডিজাইন", "sortOrder": 2}
        ]'::jsonb,
        true,
        true,
        true,
        1
    ),
    (
        'proj-2',
        '2025-ramadan-bangla-calendar',
        '2025 Ramadan Bangla Calendar',
        '২০২৫ রমাদান বাংলা ক্যালেন্ডার',
        'Cultural print and digital schedule calendar combining traditional Islamic geometric patterns with clean Bengali typography.',
        'ঐতিহ্যবাহী ইসলামিক জ্যামিতিক প্যাটার্ন এবং স্পষ্ট বাংলা টাইপোগ্রাফির সমন্বয়ে প্রস্তুতকৃত সাংস্কৃতিক প্রিন্ট ও ডিজিটাল ক্যালেন্ডার।',
        'Designed with attention to daily prayer times, Sehri and Iftar schedules, and elegant Bengali glyphs. Balanced color harmony optimized for both high-resolution printing and mobile screen viewing.',
        'দৈনিক প্রার্থনার সময়সূচি, সেহরি ও ইফতারের সময় এবং দৃষ্টিনন্দন বাংলা অক্ষরের প্রতি বিশেষ যত্ন নিয়ে নকশা করা হয়েছে। হাই-রেজ্যুলেশন প্রিন্ট ও মোবাইল স্ক্রিন উভয়ের জন্য রঙের সামঞ্জস্য রক্ষা করা হয়েছে।',
        'Sacred architectural arches blended with minimalist modern date grids.',
        'ঐতিহ্যবাহী স্থাপত্য শৈলী এবং আধুনিক মিনিমালিস্ট গ্রিডের সমন্বিত রূপ।',
        'Graphic & Typography Designer',
        'গ্রাফিক ও টাইপোগ্রাফি ডিজাইনার',
        'Community Publication',
        '2025',
        'Graphic / Calendar Design',
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1400&q=80',
        '[
            {"id": "img-2-1", "url": "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=1200&q=80", "captionEn": "Monthly view with custom typography details", "captionBn": "কাস্টম টাইপোগ্রাফি বিবরণসহ মাসিক ক্যালেন্ডার ভিউ", "altTextEn": "Ramadan Calendar typography sample", "altTextBn": "রমাদান ক্যালেন্ডার টাইপোগ্রাফি নমুনা", "sortOrder": 1}
        ]'::jsonb,
        true,
        false,
        true,
        2
    ),
    (
        'proj-3',
        'custom-wallpaper-art',
        'Custom Wallpaper Art',
        'কাস্টম ওয়ালপেপার আর্ট',
        'A series of abstract algorithmic wallpapers exploring dynamic lighting, spatial depth, and fluid geometry.',
        'ডায়নামিক আলো, গভীরতা এবং তরল জ্যামিতির সমন্বয়ে তৈরি অ্যাবস্ট্রাক্ট ওয়ালপেপারের একটি সিরিজ।',
        'Exploratory art series focused on ambient desktop and smartphone aesthetics. Uses high dynamic range contrasts and disciplined color spectrums to create serene visual environments.',
        'ডেস্কটপ ও স্মার্টফোনের জন্য নান্দনিক ওয়ালপেপার এক্সপ্লোরেশন। সুনির্দিষ্ট কালার স্পেকট্রাম ও আলোর গভীরতার মাধ্যমে শান্ত ও মনোমুগ্ধকর ভিজ্যুয়াল পরিবেশ তৈরি করা হয়েছে।',
        'Atmospheric optical refraction inspired by aurora borealis and mineral crystallizations.',
        'প্রাকৃতিক আলোর প্রতিফলন এবং খনিজ স্ফটিকের জ্যামিতি দ্বারা অনুপ্রাণিত বায়ুমণ্ডলীয় ডিজাইন।',
        'Digital Visual Artist',
        'ডিজিটাল ভিজ্যুয়াল আর্টিস্ট',
        'Personal Project',
        '2024',
        'Digital Art',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=80',
        '[
            {"id": "img-3-1", "url": "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80", "captionEn": "Mobile lockscreen wallpaper edition", "captionBn": "মোবাইল লকস্ক্রিন ওয়ালপেপার সংস্করণ", "altTextEn": "Mobile wallpaper artwork preview", "altTextBn": "মোবাইল ওয়ালপেপার আর্টওয়ার্ক প্রিভিউ", "sortOrder": 1}
        ]'::jsonb,
        true,
        false,
        true,
        3
    ),
    (
        'proj-4',
        'nexus-digital-workspace-ui',
        'Nexus Digital Workspace UI',
        'নেক্সাস ডিজিটাল ওয়ার্কস্পেস ইউআই',
        'Modern, dark-themed collaborative dashboard UI crafted for agile creative agencies and remote studios.',
        'ক্রিয়েটিভ এজেন্সি এবং রিমোট স্টুডিওর জন্য আধুনিক ডার্ক-থিমযুক্ত কোলাবোরেটিভ ড্যাশবোর্ড ইউআই।',
        'A comprehensive UI system featuring kanban boards, asset version timelines, and streamlined team analytics. Emphasizes dark mode contrast, zero-clutter typography, and focused workflow interactions.',
        'কানবান বোর্ড, ফাইল ভার্সন টাইমলাইন এবং টিম অ্যানালিটিক্স সম্বলিত পূর্ণাঙ্গ ইউআই সিস্টেম। ডার্ক মোড কনট্রাস্ট এবং ক্লাটার-মুক্ত টাইপোগ্রাফির ওপর বিশেষ জোর দেওয়া হয়েছে।',
        'High-density utilitarian interface wrapped in a soothing, eye-safe midnight aesthetic.',
        'দীর্ঘক্ষণ কাজ করার উপযোগী স্বাচ্ছন্দ্যময় ও চোখ-বান্ধব মিডনাইট ইন্টারফেস।',
        'UI / Concept Designer',
        'ইউআই / কনসেপ্ট ডিজাইনার',
        'Nexus Software',
        '2024',
        'UI / Web Design',
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1400&q=80',
        '[
            {"id": "img-4-1", "url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80", "captionEn": "Dashboard metrics and live feed module", "captionBn": "ড্যাশবোর্ড মেট্রিক্স এবং লাইভ ফিড মডিউল", "altTextEn": "Dashboard interface screenshot", "altTextBn": "ড্যাশবোর্ড ইন্টারফেস স্ক্রিনশট", "sortOrder": 1}
        ]'::jsonb,
        false,
        false,
        true,
        4
    )
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    title_en = EXCLUDED.title_en,
    title_bn = EXCLUDED.title_bn,
    short_description_en = EXCLUDED.short_description_en,
    short_description_bn = EXCLUDED.short_description_bn,
    overview_en = EXCLUDED.overview_en,
    overview_bn = EXCLUDED.overview_bn,
    concept_en = EXCLUDED.concept_en,
    concept_bn = EXCLUDED.concept_bn,
    role_en = EXCLUDED.role_en,
    role_bn = EXCLUDED.role_bn,
    client = EXCLUDED.client,
    year = EXCLUDED.year,
    category = EXCLUDED.category,
    cover_image = EXCLUDED.cover_image,
    gallery_images = EXCLUDED.gallery_images,
    featured = EXCLUDED.featured,
    hero_featured = EXCLUDED.hero_featured,
    published = EXCLUDED.published,
    sort_order = EXCLUDED.sort_order;

-- 4.4 EXPERIENCE SEED
INSERT INTO public.experience (
    id, company, role_en, role_bn, period, responsibilities_en, responsibilities_bn, sort_order
)
VALUES
    (
        'exp-1',
        'Kaaruj',
        'Freelance Graphic Designer',
        'ফ্রিল্যান্স গ্রাফিক ডিজাইনার',
        '2024 - Present',
        '[
            "Designing cohesive brand identities, logo systems, and visual guidelines for diverse clients.",
            "Crafting high-impact print collateral, social media design packages, and marketing visuals.",
            "Collaborating directly with business founders to translate business goals into memorable visual assets."
        ]'::jsonb,
        '[
            "বিভিন্ন ক্লায়েন্টের জন্য সুসংহত ব্র্যান্ড আইডেন্টিটি, লোগো সিস্টেম এবং ভিজ্যুয়াল গাইডলাইন তৈরি।",
            "প্রভাবশালী প্রিন্ট ম্যাটেরিয়াল, সোশ্যাল মিডিয়া ডিজাইন প্যাকেজ এবং মার্কেটিং ভিজ্যুয়াল তৈরি।",
            "ক্লায়েন্টদের ব্যবসায়িক লক্ষ্যকে স্মরণীয় ভিজ্যুয়াল আর্টে রূপান্তর করতে নিবিড় যোগাযোগ ও কাজ পরিচালনা।"
        ]'::jsonb,
        1
    ),
    (
        'exp-2',
        'Global Tech Solution',
        'Graphic Designer (Intern)',
        'গ্রাফিক ডিজাইনার (ইন্টার্ন)',
        '2024',
        '[
            "Assisted in creating promotional banners, internal presentation decks, and vector illustrations.",
            "Maintained strict brand compliance across digital publications and external corporate materials.",
            "Coordinated with the frontend development team on digital asset exports and icon optimization."
        ]'::jsonb,
        '[
            "প্রমোশনাল ব্যানার, ইন্টারনাল প্রেজেন্টেশন ডেক এবং ভেক্টর ইলাস্ট্রেশন তৈরিতে সহায়তা।",
            "ডিজিটাল প্রকাশনা এবং বাহ্যিক কর্পোরেট সামগ্রী জুড়ে ব্র্যান্ডের নিয়ম কঠোরভাবে বজায় রাখা।",
            "ডিজিটাল অ্যাসেট এক্সপোর্ট ও আইকন অপ্টিমাইজেশনে ফ্রন্টএন্ড ডেভেলপারদের সাথে সমন্বয়।"
        ]'::jsonb,
        2
    )
ON CONFLICT (id) DO UPDATE SET
    company = EXCLUDED.company,
    role_en = EXCLUDED.role_en,
    role_bn = EXCLUDED.role_bn,
    period = EXCLUDED.period,
    responsibilities_en = EXCLUDED.responsibilities_en,
    responsibilities_bn = EXCLUDED.responsibilities_bn,
    sort_order = EXCLUDED.sort_order;

-- 4.5 EDUCATION SEED
INSERT INTO public.education (
    id, degree_en, degree_bn, institution_en, institution_bn, period, sort_order
)
VALUES
    (
        'edu-1',
        'Diploma in Computer Technology',
        'ডিপ্লোমা ইন কম্পিউটার টেকনোলজি',
        'F.K Polytechnic Institute',
        'এফ.কে পলিটেকনিক ইনস্টিটিউট',
        '2019 - 2024',
        1
    ),
    (
        'edu-2',
        'Secondary School Certificate (SSC)',
        'মাধ্যমিক স্কুল সার্টিফিকেট (এসএসসি)',
        'Rupnagar Government Secondary School',
        'রূপনগর সরকারি মাধ্যমিক বিদ্যালয়',
        '2019',
        2
    )
ON CONFLICT (id) DO UPDATE SET
    degree_en = EXCLUDED.degree_en,
    degree_bn = EXCLUDED.degree_bn,
    institution_en = EXCLUDED.institution_en,
    institution_bn = EXCLUDED.institution_bn,
    period = EXCLUDED.period,
    sort_order = EXCLUDED.sort_order;

-- 4.6 SITE CONTENT SEED
INSERT INTO public.site_content (
    id, announcement_en, announcement_bn, hero_eyebrow_en, hero_eyebrow_bn,
    hero_title_en, hero_title_bn, hero_description_en, hero_description_bn,
    hero_personal_image, hero_personal_image_tag_en, hero_personal_image_tag_bn,
    primary_cta_en, primary_cta_bn, secondary_cta_en, secondary_cta_bn,
    about_title_en, about_title_bn, about_description_en, about_description_bn,
    selected_work_title_en, selected_work_title_bn,
    client_logos_title_en, client_logos_title_bn,
    testimonials_title_en, testimonials_title_bn,
    consultation_cta_title_en, consultation_cta_title_bn,
    consultation_cta_desc_en, consultation_cta_desc_bn,
    final_cta_title_en, final_cta_title_bn,
    final_cta_desc_en, final_cta_desc_bn
)
VALUES (
    'default',
    'Available for selected creative projects.',
    'নির্বাচিত ক্রিয়েটিভ প্রজেক্টে কাজের জন্য উপলভ্য।',
    'GRAPHIC DESIGNER',
    'গ্রাফিক ডিজাইনার',
    'Creating distinctive visual experiences.',
    'অনন্য ও অর্থবহ ভিজ্যুয়াল অভিজ্ঞতা সৃষ্টি।',
    'Creating thoughtful visual solutions across brand identity, graphic design, digital design and UI / Web Design.',
    'ব্র্যান্ড আইডেন্টিটি, গ্রাফিক ডিজাইন, ডিজিটাল ডিজাইন এবং ইউআই/ওয়েব ডিজাইনের মাধ্যমে সুচিন্তিত ভিজ্যুয়াল সল্যুশন তৈরি করছি।',
    '/assets/khubaib_portrait.jpg',
    'Khubaib Salafi // Visual Designer',
    'খুবাইব সালাফী // ভিজ্যুয়াল ডিজাইনার',
    'VIEW MY WORK',
    'আমার কাজ দেখুন',
    'REQUEST CONSULTATION',
    'পরামর্শের অনুরোধ',
    'About Khubaib Salafi',
    'খুবাইব সালাফী সম্পর্কে',
    'Khubaib Salafi is a dedicated graphic designer with hands-on expertise in brand identity, visual communication, digital design, and UI/web concepts. Focused on clarity, aesthetic proportion, and meaningful visual storytelling.',
    'খুবাইব সালাফী একজন নিবেদিতপ্রাণ গ্রাফিক ডিজাইনার যিনি ব্র্যান্ড আইডেন্টিটি, ভিজ্যুয়াল কমিউনিকেশন, ডিজিটাল ডিজাইন এবং ইউআই/ওয়েব কনসেপ্টে অভিজ্ঞ। স্পষ্টতা, নান্দনিক অনুপাত এবং অর্থবহ ভিজ্যুয়াল গল্প বলায় বিশ্বাসী।',
    'SELECTED WORK',
    'নির্বাচিত কাজসমূহ',
    'BRANDS I HAVE WORKED WITH',
    'যাদের সাথে কাজ করেছি',
    'CLIENT TESTIMONIALS',
    'ক্লায়েন্টদের মতামত',
    'Have a project in mind?',
    'মনে কি কোনো প্রজেক্টের পরিকল্পনা আছে?',
    'Let''s create something meaningful together.',
    'চলুন একসাথে অর্থবহ ও দৃষ্টিনন্দন কিছু সৃষ্টি করি।',
    'LET''S CREATE SOMETHING DISTINCTIVE.',
    'চলুন অনন্য কিছু সৃষ্টি করি।',
    'Start a conversation about your next visual project.',
    'আপনার পরবর্তী ভিজ্যুয়াল প্রজেক্ট নিয়ে আলোচনা শুরু করুন।'
)
ON CONFLICT (id) DO UPDATE SET
    announcement_en = EXCLUDED.announcement_en,
    announcement_bn = EXCLUDED.announcement_bn,
    hero_eyebrow_en = EXCLUDED.hero_eyebrow_en,
    hero_eyebrow_bn = EXCLUDED.hero_eyebrow_bn,
    hero_title_en = EXCLUDED.hero_title_en,
    hero_title_bn = EXCLUDED.hero_title_bn,
    hero_description_en = EXCLUDED.hero_description_en,
    hero_description_bn = EXCLUDED.hero_description_bn,
    hero_personal_image = EXCLUDED.hero_personal_image,
    hero_personal_image_tag_en = EXCLUDED.hero_personal_image_tag_en,
    hero_personal_image_tag_bn = EXCLUDED.hero_personal_image_tag_bn,
    primary_cta_en = EXCLUDED.primary_cta_en,
    primary_cta_bn = EXCLUDED.primary_cta_bn,
    secondary_cta_en = EXCLUDED.secondary_cta_en,
    secondary_cta_bn = EXCLUDED.secondary_cta_bn,
    about_title_en = EXCLUDED.about_title_en,
    about_title_bn = EXCLUDED.about_title_bn,
    about_description_en = EXCLUDED.about_description_en,
    about_description_bn = EXCLUDED.about_description_bn,
    selected_work_title_en = EXCLUDED.selected_work_title_en,
    selected_work_title_bn = EXCLUDED.selected_work_title_bn,
    client_logos_title_en = EXCLUDED.client_logos_title_en,
    client_logos_title_bn = EXCLUDED.client_logos_title_bn,
    testimonials_title_en = EXCLUDED.testimonials_title_en,
    testimonials_title_bn = EXCLUDED.testimonials_title_bn,
    consultation_cta_title_en = EXCLUDED.consultation_cta_title_en,
    consultation_cta_title_bn = EXCLUDED.consultation_cta_title_bn,
    consultation_cta_desc_en = EXCLUDED.consultation_cta_desc_en,
    consultation_cta_desc_bn = EXCLUDED.consultation_cta_desc_bn,
    final_cta_title_en = EXCLUDED.final_cta_title_en,
    final_cta_title_bn = EXCLUDED.final_cta_title_bn,
    final_cta_desc_en = EXCLUDED.final_cta_desc_en,
    final_cta_desc_bn = EXCLUDED.final_cta_desc_bn;

-- 4.7 SITE SETTINGS SEED
INSERT INTO public.site_settings (
    id, site_name, seo_title_en, seo_title_bn,
    seo_description_en, seo_description_bn,
    behance_url, email, instagram_url, linkedin_url,
    footer_text_en, footer_text_bn,
    accent_color, default_theme, cursor_glow_size,
    logo_marquee_speed, carousel_autoplay, carousel_interval,
    testimonials_display_mode
)
VALUES (
    'default',
    'Khubaib Salafi',
    'Khubaib Salafi - Graphic Designer Portfolio',
    'খুবাইব সালাফী - গ্রাফিক ডিজাইনার পোর্টফোলিও',
    'Portfolio of Khubaib Salafi, graphic designer specializing in Brand Identity, Graphic Design, Digital Design, and UI/Web Design.',
    'খুবাইব সালাফীর পোর্টফোলিও - ব্র্যান্ড আইডেন্টিটি, গ্রাফিক ডিজাইন, ডিজিটাল ডিজাইন ও ইউআই/ওয়েব ডিজাইন বিশেষজ্ঞ।',
    'https://www.behance.net/khubaibsalafi13',
    'mdjudan13@gmail.com',
    '',
    '',
    'Khubaib Salafi. Designed with precision and craft.',
    'খুবাইব সালাফী। পরিমিতি ও নিষ্ঠার সাথে নির্মিত।',
    '#10b981',
    'dark',
    'small',
    25,
    true,
    6,
    'grid'
)
ON CONFLICT (id) DO UPDATE SET
    site_name = EXCLUDED.site_name,
    seo_title_en = EXCLUDED.seo_title_en,
    seo_title_bn = EXCLUDED.seo_title_bn,
    seo_description_en = EXCLUDED.seo_description_en,
    seo_description_bn = EXCLUDED.seo_description_bn,
    behance_url = EXCLUDED.behance_url,
    email = EXCLUDED.email,
    instagram_url = EXCLUDED.instagram_url,
    linkedin_url = EXCLUDED.linkedin_url,
    footer_text_en = EXCLUDED.footer_text_en,
    footer_text_bn = EXCLUDED.footer_text_bn,
    accent_color = EXCLUDED.accent_color,
    default_theme = EXCLUDED.default_theme,
    cursor_glow_size = EXCLUDED.cursor_glow_size,
    logo_marquee_speed = EXCLUDED.logo_marquee_speed,
    carousel_autoplay = EXCLUDED.carousel_autoplay,
    carousel_interval = EXCLUDED.carousel_interval,
    testimonials_display_mode = EXCLUDED.testimonials_display_mode;

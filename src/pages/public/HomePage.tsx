import React, { useState, useEffect } from 'react';
import { AnnouncementBar } from '../../components/public/AnnouncementBar';
import { Hero } from '../../components/public/Hero';
import { ExpertiseMarquee } from '../../components/public/ExpertiseMarquee';
import { ProjectCarousel } from '../../components/public/ProjectCarousel';
import { AllWork } from '../../components/public/AllWork';
import { ServicesSection } from '../../components/public/ServicesSection';
import { ClientLogoMarquee } from '../../components/public/ClientLogoMarquee';
import { AboutSection } from '../../components/public/AboutSection';
import { ExperienceEducation } from '../../components/public/ExperienceEducation';
import { TestimonialsSection } from '../../components/public/TestimonialsSection';
import { ConsultationSection } from '../../components/public/ConsultationSection';
import { FinalCta } from '../../components/public/FinalCta';
import { Footer } from '../../components/public/Footer';

import { projectService } from '../../services/projectService';
import { contentService } from '../../services/contentService';
import { categoryService } from '../../services/categoryService';
import { servicesService } from '../../services/servicesService';
import { clientLogoService } from '../../services/clientLogoService';
import { testimonialService } from '../../services/testimonialService';
import { experienceService } from '../../services/experienceService';
import { educationService } from '../../services/educationService';
import { settingsService } from '../../services/settingsService';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { refreshScroll } from '../../lib/scrollUtils';
import {
  Project,
  Category,
  Service,
  Experience,
  Education,
  ClientLogo,
  Testimonial,
  SiteContent,
  SiteSettings,
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';

export const HomePage: React.FC = () => {
  const { localized, t } = useLanguage();
  // Initial state from cached data for fast paint
  const [content, setContent] = useState<SiteContent>(() => contentService.getContent());
  const [settings, setSettings] = useState<SiteSettings>(() => settingsService.getSettings());
  
  // Dedicated hydration state for Carousel (Selected Work)
  const [featuredHydrated, setFeaturedHydrated] = useState(false);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>(() => {
    const list = projectService.getFeatured();
    return list;
  });

  // Dedicated hydration state for AllWork portfolio grid
  const [projectsHydrated, setProjectsHydrated] = useState(false);
  const [projects, setProjects] = useState<Project[]>(() => {
    const list = projectService.getPublished();
    console.info('[Projects] initial source:', isSupabaseConfigured() ? 'pending_live_hydration' : 'fallback');
    return list;
  });

  const [heroProject, setHeroProject] = useState<Project | undefined>(() => projectService.getHeroFeatured());
  const [categories, setCategories] = useState<Category[]>(() => categoryService.getAll());
  const [services, setServices] = useState<Service[]>(() => servicesService.getPublished());
  const [experience, setExperience] = useState<Experience[]>(() => experienceService.getAll());
  const [education, setEducation] = useState<Education[]>(() => educationService.getAll());
  const [clientLogos, setClientLogos] = useState<ClientLogo[]>(() => clientLogoService.getPublished());
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => testimonialService.getPublished());

  // Dynamic Supabase data hydration on mount (Instant parallel prioritized pathways)
  useEffect(() => {
    let isMounted = true;

    // Helper: Trigger immediate browser download & decode of the active cover image
    const preloadCoverImage = (coverUrl?: string) => {
      if (!coverUrl || coverUrl.includes('images.unsplash.com')) return;
      try {
        if (coverUrl.startsWith('http')) {
          const existing = document.querySelector(`link[rel="preload"][href="${coverUrl}"]`);
          if (!existing) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = coverUrl;
            link.setAttribute('fetchpriority', 'high');
            document.head.appendChild(link);
          }
        }
        const img = new Image();
        img.decoding = 'async';
        img.src = coverUrl;
      } catch (err) {
        console.warn('Cover image preload exception:', err);
      }
    };

    // 1. FAST PATH: Hydrate Hero & Site Content immediately without waiting for secondary tables
    contentService
      .getContentAsync()
      .then((latestContent) => {
        if (isMounted && latestContent) {
          setContent(latestContent);
        }
      })
      .catch((err) => console.warn('Error hydrating SiteContent:', err));

    // 2. Hydrate global site settings
    settingsService
      .getSettingsAsync()
      .then((latestSettings) => {
        if (isMounted && latestSettings) {
          setSettings(latestSettings);
        }
      })
      .catch((err) => console.warn('Error hydrating SiteSettings:', err));

    // 3A. FAST-TRACK CAROUSEL: Fetch primary active featured project immediately
    // Enables active slide mounting and early cover image preloading before any scroll
    projectService
      .getFirstFeaturedForHomeAsync()
      .then((firstFeatured) => {
        if (isMounted && firstFeatured) {
          console.info('[Projects] early active featured available:', firstFeatured.slug);
          setFeaturedProjects((prev) => {
            if (prev.length <= 1 || !prev.some((p) => p.id === firstFeatured.id)) {
              return [firstFeatured];
            }
            return prev;
          });
          setFeaturedHydrated(true);
          setHeroProject(firstFeatured);
          preloadCoverImage(firstFeatured.coverImage);
        }
      })
      .catch((err) => console.warn('Error hydrating first featured project:', err));

    // 3B. CAROUSEL DATASET: Fetch full featured projects list for carousel navigation
    projectService
      .getFeaturedForHomeAsync()
      .then((latestFeatured) => {
        if (isMounted) {
          if (latestFeatured && latestFeatured.length > 0) {
            setFeaturedProjects(latestFeatured);
            setFeaturedHydrated(true);
            const hero = latestFeatured.find((p) => p.heroFeatured) || latestFeatured[0];
            setHeroProject(hero);
            preloadCoverImage(latestFeatured[0]?.coverImage);
          } else if (!isSupabaseConfigured()) {
            setFeaturedHydrated(true);
          }
        }
      })
      .catch((err) => console.warn('Error hydrating Featured Projects:', err));

    // 3C. ALL-WORK GRID: Hydrate published projects for the AllWork portfolio section
    projectService
      .getPublishedForHomeAsync()
      .then((latestProjects) => {
        if (isMounted) {
          if (latestProjects && latestProjects.length > 0) {
            setProjects(latestProjects);
            setProjectsHydrated(true);
          } else if (!isSupabaseConfigured()) {
            setProjectsHydrated(true);
          }
        }
      })
      .catch((err) => console.warn('Error hydrating AllWork Projects:', err));

    // 4. Hydrate remaining secondary datasets
    Promise.all([
      categoryService.getAllAsync(),
      servicesService.getPublishedAsync(),
      experienceService.getAllAsync(),
      educationService.getAllAsync(),
      clientLogoService.getPublishedAsync(),
      testimonialService.getPublishedAsync(),
    ])
      .then(([
        latestCategories,
        latestServices,
        latestExperience,
        latestEducation,
        latestLogos,
        latestTestimonials,
      ]) => {
        if (isMounted) {
          if (latestCategories) setCategories(latestCategories);
          if (latestServices) setServices(latestServices);
          if (latestExperience) setExperience(latestExperience);
          if (latestEducation) setEducation(latestEducation);
          if (latestLogos) setClientLogos(latestLogos);
          if (latestTestimonials) setTestimonials(latestTestimonials);

          refreshScroll();
        }
      })
      .catch((err) => console.warn('Error hydrating secondary datasets:', err));

    const handleTestimonialsUpdate = () => {
      setTestimonials(testimonialService.getPublished());
      refreshScroll();
    };
    window.addEventListener('testimonials-updated', handleTestimonialsUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('testimonials-updated', handleTestimonialsUpdate);
    };
  }, []);

  return (
    <>
      {/* 01. Thin Announcement Bar with header offset */}
      <div className="pt-16 sm:pt-20">
        <AnnouncementBar content={content} />
      </div>

      <main className="flex-1">
        {/* 03. Hero Section (Visual Left, Typography Right) */}
        <Hero content={content} heroProject={heroProject} />

        {/* 04. Expertise Scrolling Marquee */}
        <ExpertiseMarquee />

        {/* 05 & 06. Featured Project Carousel (Center dominant, left/right partial) */}
        <div className="pt-20 sm:pt-32 pb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
            {/* Dark theme: restored original tech/editorial kicker; Light theme: minimal dot kicker */}
            <div className="dark:inline-flex hidden items-center justify-center gap-2 mb-3">
              <span className="font-mono text-xs text-[var(--accent)] tracking-widest uppercase">// SPOTLIGHT</span>
            </div>
            <div className="dark:hidden inline-flex items-center justify-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                {t('work.sectionTitle')}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--text-heading)] tracking-tight">
              {content.selectedWorkTitleEn || 'SELECTED WORK'}
            </h2>
          </div>
          <ProjectCarousel
            projects={featuredProjects.length > 0 ? featuredProjects : projects}
            isHydrated={featuredHydrated}
            autoplay={settings.carouselAutoplay}
            intervalSeconds={settings.carouselInterval}
          />
        </div>

        {/* 07. All Projects with Category Filters */}
        <AllWork
          projects={projects}
          categories={categories}
          isHydrated={projectsHydrated}
        />

        {/* 08. Testimonials (Auto-hides if no published reviews) */}
        <TestimonialsSection
          testimonials={testimonials}
          titleEn={content.testimonialsTitleEn}
          titleBn={content.testimonialsTitleBn}
        />

        {/* 09. Services / Expertise */}
        <ServicesSection services={services} />

        {/* 10. Client Logo Marquee (Auto-hides if no published logos) */}
        <ClientLogoMarquee
          logos={clientLogos}
          titleEn={content.clientLogosTitleEn}
          titleBn={content.clientLogosTitleBn}
          speed={settings.logoMarqueeSpeed}
        />

        {/* 11. About Section */}
        <AboutSection content={content} />

        {/* 12. Experience & Education with stats-like credibility band */}
        <ExperienceEducation experience={experience} education={education} />

        {/* 13. Consultation CTA & Form */}
        <ConsultationSection content={content} />

        {/* 16. Large Final CTA */}
        <FinalCta content={content} />
      </main>

      {/* 17. Footer */}
      <Footer settings={settings} />
    </>
  );
};

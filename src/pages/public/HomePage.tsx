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

export const HomePage: React.FC = () => {
  // Initial state from cached data for fast paint
  const [content, setContent] = useState<SiteContent>(() => contentService.getContent());
  const [settings, setSettings] = useState<SiteSettings>(() => settingsService.getSettings());
  const [projects, setProjects] = useState<Project[]>(() => projectService.getPublished());
  const [heroProject, setHeroProject] = useState<Project | undefined>(() => projectService.getHeroFeatured());
  const [categories, setCategories] = useState<Category[]>(() => categoryService.getAll());
  const [services, setServices] = useState<Service[]>(() => servicesService.getPublished());
  const [experience, setExperience] = useState<Experience[]>(() => experienceService.getAll());
  const [education, setEducation] = useState<Education[]>(() => educationService.getAll());
  const [clientLogos, setClientLogos] = useState<ClientLogo[]>(() => clientLogoService.getPublished());
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => testimonialService.getPublished());

  // Dynamic Supabase data hydration on mount
  useEffect(() => {
    let isMounted = true;

    async function loadSupabaseData() {
      try {
        const [
          latestContent,
          latestSettings,
          latestProjects,
          latestHeroProject,
          latestCategories,
          latestServices,
          latestExperience,
          latestEducation,
          latestLogos,
          latestTestimonials,
        ] = await Promise.all([
          contentService.getContentAsync(),
          settingsService.getSettingsAsync(),
          projectService.getPublishedAsync(),
          projectService.getHeroFeaturedAsync(),
          categoryService.getAllAsync(),
          servicesService.getPublishedAsync(),
          experienceService.getAllAsync(),
          educationService.getAllAsync(),
          clientLogoService.getPublishedAsync(),
          testimonialService.getPublishedAsync(),
        ]);

        if (isMounted) {
          if (latestContent) setContent(latestContent);
          if (latestSettings) setSettings(latestSettings);
          if (latestProjects) setProjects(latestProjects);
          if (latestHeroProject) setHeroProject(latestHeroProject);
          if (latestCategories) setCategories(latestCategories);
          if (latestServices) setServices(latestServices);
          if (latestExperience) setExperience(latestExperience);
          if (latestEducation) setEducation(latestEducation);
          if (latestLogos) setClientLogos(latestLogos);
          if (latestTestimonials) setTestimonials(latestTestimonials);

          refreshScroll();
        }
      } catch (err) {
        console.warn('Error loading dynamic Supabase data in HomePage:', err);
      }
    }

    loadSupabaseData();

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
        <div className="pt-16 sm:pt-24 pb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-6">
            <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-[0.25em] block mb-2 font-semibold">
              // SPOTLIGHT
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-heading)] tracking-tight">
              {content.selectedWorkTitleEn || 'SELECTED WORK'}
            </h2>
          </div>
          <ProjectCarousel
            projects={projects}
            autoplay={settings.carouselAutoplay}
            intervalSeconds={settings.carouselInterval}
          />
        </div>

        {/* 07. All Projects with Category Filters */}
        <AllWork projects={projects} categories={categories} />

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

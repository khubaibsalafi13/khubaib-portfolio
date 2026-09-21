import React, { useMemo } from 'react';
import { AnnouncementBar } from '../../components/public/AnnouncementBar';
import { Header } from '../../components/public/Header';
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
import { CursorGlow } from '../../components/public/CursorGlow';

import { projectService } from '../../services/projectService';
import { contentService } from '../../services/contentService';
import { categoryService } from '../../services/categoryService';
import { servicesService } from '../../services/servicesService';
import { clientLogoService } from '../../services/clientLogoService';
import { testimonialService } from '../../services/testimonialService';
import { experienceService } from '../../services/experienceService';
import { educationService } from '../../services/educationService';
import { settingsService } from '../../services/settingsService';

export const HomePage: React.FC = () => {
  // Fetch real/localStorage service data
  const content = useMemo(() => contentService.getContent(), []);
  const settings = useMemo(() => settingsService.getSettings(), []);
  const projects = useMemo(() => projectService.getPublished(), []);
  const heroProject = useMemo(() => projectService.getHeroFeatured(), []);
  const categories = useMemo(() => categoryService.getAll(), []);
  const services = useMemo(() => servicesService.getPublished(), []);
  const experience = useMemo(() => experienceService.getAll(), []);
  const education = useMemo(() => educationService.getAll(), []);
  const clientLogos = useMemo(() => clientLogoService.getPublished(), []);
  const testimonials = useMemo(() => testimonialService.getPublished(), []);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col justify-between selection:bg-[var(--selection-bg)] selection:text-[var(--selection-text)] transition-colors duration-200 relative">
      {/* Brand-colored cursor glow (adapts opacity to theme, disabled on touch) */}
      <CursorGlow />

      {/* 01. Thin Announcement Bar */}
      <AnnouncementBar content={content} />

      {/* 02. Sticky Main Header with Animated Navigation & Theme Toggle */}
      <Header />

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

        {/* 08. Services / Expertise */}
        <ServicesSection services={services} />

        {/* 09. Client Logo Marquee (Auto-hides if no published logos) */}
        <ClientLogoMarquee
          logos={clientLogos}
          titleEn={content.clientLogosTitleEn}
          titleBn={content.clientLogosTitleBn}
        />

        {/* 10. About Section */}
        <AboutSection content={content} />

        {/* 11 & 12. Experience & Education with stats-like credibility band */}
        <ExperienceEducation experience={experience} education={education} />

        {/* 13. Testimonials (Auto-hides if no published reviews) */}
        <TestimonialsSection
          testimonials={testimonials}
          titleEn={content.testimonialsTitleEn}
          titleBn={content.testimonialsTitleBn}
        />

        {/* 14 & 15. Consultation CTA & Form */}
        <ConsultationSection content={content} />

        {/* 16. Large Final CTA */}
        <FinalCta content={content} />
      </main>

      {/* 17. Footer */}
      <Footer settings={settings} />
    </div>
  );
};

import React from 'react';
import { Palette, PenTool, Monitor, Layout } from 'lucide-react';
import { Service } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface ServicesSectionProps {
  services: Service[];
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ services }) => {
  const { localized, t } = useLanguage();

  const getServiceIcon = (slug: string) => {
    switch (slug) {
      case 'brand-identity':
        return <Palette className="w-5 h-5 text-[var(--accent)]" />;
      case 'graphic-design':
        return <PenTool className="w-5 h-5 text-[var(--accent)]" />;
      case 'digital-design':
        return <Monitor className="w-5 h-5 text-[var(--accent)]" />;
      case 'ui-web-design':
        return <Layout className="w-5 h-5 text-[var(--accent)]" />;
      default:
        return <Palette className="w-5 h-5 text-[var(--accent)]" />;
    }
  };

  return (
    <section
      id="services"
      className="py-24 sm:py-36 relative transition-colors"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-16 sm:mb-20">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              {t('services.sectionTitle')}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text-heading)] tracking-tight mb-4">
            {t('services.sectionTitle')}
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
            {t('services.subtitle')}
          </p>
        </div>

        {/* Airy Editorial Disciplines Grid - Unboxed & Minimalist */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {services.map((service, index) => (
            <div
              key={service.id}
              className="group flex flex-col justify-between pt-6 border-t border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="text-sm font-semibold tracking-wider text-[var(--accent)]">
                    0{index + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-[var(--bg-surface)] text-[var(--accent)] flex items-center justify-center transition-colors group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-contrast)] shadow-sm">
                    {getServiceIcon(service.slug)}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-[var(--text-heading)] group-hover:text-[var(--accent)] transition-colors mb-3">
                  {localized(service.titleEn, service.titleBn)}
                </h3>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {localized(service.descriptionEn, service.descriptionBn)}
                </p>
              </div>

              <div className="pt-8 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span className="w-1 h-1 rounded-full bg-[var(--accent)] opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="tracking-wider uppercase font-medium">Discipline</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

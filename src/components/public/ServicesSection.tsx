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
      className="py-20 sm:py-28 relative bg-[var(--bg-card-subtle)]/40 border-t border-[var(--border-subtle)] transition-colors"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--code-tag-bg)] border border-[var(--code-tag-border)] text-[var(--code-tag-text)] text-xs font-mono tracking-widest uppercase mb-3 font-semibold">
            <span>// SERVICES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-heading)] tracking-tight mb-4">
            {t('services.sectionTitle')}
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
            {t('services.subtitle')}
          </p>
        </div>

        {/* 4 Clean Disciplines Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {services.map((service, index) => (
            <div
              key={service.id}
              className="group relative rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] hover:border-[var(--accent)] p-6 flex flex-col justify-between transition-colors duration-300 shadow-[var(--card-shadow)] hover:shadow-xl hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-medium)] group-hover:border-[var(--accent)] transition-colors shadow-sm">
                    {getServiceIcon(service.slug)}
                  </div>
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-heading)] group-hover:text-[var(--accent)] transition-colors mb-3">
                  {localized(service.titleEn, service.titleBn)}
                </h3>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {localized(service.descriptionEn, service.descriptionBn)}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span className="uppercase tracking-wider">Discipline</span>
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]/40 group-hover:bg-[var(--accent)] transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

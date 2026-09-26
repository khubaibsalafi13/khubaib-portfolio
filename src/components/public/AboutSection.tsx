import React from 'react';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SiteContent } from '../../types';
import { smoothScrollTo } from '../../lib/scrollUtils';

interface AboutSectionProps {
  content: SiteContent;
}

// Official Behance Mark Icon
const BehanceIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-4.044 0-6.173-2.686-6.173-6.257 0-3.834 2.478-6.284 6.134-6.284 3.738 0 5.868 2.502 5.868 6.577 0 .428-.052.923-.098 1.229h-9.762c.074 1.761 1.282 3.111 3.515 3.111 1.42 0 2.41-.659 2.871-1.376h2.746zm-7.669-4.757h5.811c-.085-1.579-.955-2.686-2.825-2.686-1.76 0-2.82 1.077-2.986 2.686zm-8.877-3.243c.961 0 1.726-.261 2.228-.755.452-.444.693-1.07.693-1.804 0-.829-.313-1.479-.904-1.879-.623-.42-1.554-.606-2.766-.606h-5.431v14.044h5.922c1.425 0 2.545-.331 3.241-.958.749-.675 1.149-1.678 1.149-2.898 0-1.223-.464-2.185-1.341-2.784.975-.626 1.458-1.55 1.458-2.682 0-.258-.027-.514-.079-.76-.237-.899-.861-1.547-1.829-1.884-.668-.233-1.472-.345-2.341-.345v-.002zm-3.349-4.148h2.365c1.473 0 2.28.608 2.28 1.714 0 1.157-.849 1.764-2.383 1.764h-2.262v-3.478zm0 5.485h2.646c1.649 0 2.531.671 2.531 1.905 0 1.281-.926 1.954-2.607 1.954h-2.57v-3.859z" />
  </svg>
);

export const AboutSection: React.FC<AboutSectionProps> = ({ content }) => {
  const { localized, t } = useLanguage();

  const title = localized(content.aboutTitleEn, content.aboutTitleBn);
  const description = localized(content.aboutDescriptionEn, content.aboutDescriptionBn);

  const capabilities = [
    'Brand Guidelines & Logo Architecture',
    'High-Conversion Marketing & Social Collateral',
    'Custom Vector Illustration & Digital Art',
    'Typography, Arabic / Bangla Cultural Design',
    'UI Wireframing & Design System Foundations',
  ];

  const tools = [
    'Adobe Photoshop',
    'Adobe Illustrator',
    'Canva Pro',
    'Figma',
  ];

  return (
    <section id="about" className="py-24 sm:py-36 relative transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20 items-start">
          
          {/* Left Column: Editorial Information & Statement */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                ABOUT
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text-heading)] tracking-tight leading-[1.15] mb-6">
              {title}
            </h2>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
              {description}
            </p>

            {/* Core Capabilities Checklist */}
            <div className="space-y-3.5 mb-10">
              {capabilities.map((cap, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span className="text-sm text-[var(--text-primary)] font-medium">{cap}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-[var(--border-subtle)]">
              <a
                href="#consultation"
                onClick={(e) => {
                  e.preventDefault();
                  smoothScrollTo('#consultation', true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all shadow-sm cursor-pointer hover:-translate-y-0.5 active:scale-98"
              >
                <span>{t('about.contactButton')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://www.behance.net/khubaibsalafi13"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] border border-[var(--border-medium)] hover:border-[var(--accent)] bg-[var(--bg-card)] transition-all duration-200 shadow-sm cursor-pointer hover:-translate-y-0.5"
              >
                <BehanceIcon className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors shrink-0" />
                <span>Behance Profile</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
              </a>
            </div>
          </div>

          {/* Right Column: Unboxed Editorial Profile & Tools Column */}
          <div className="lg:col-span-5 space-y-8 pt-4 lg:pt-8">
            <div className="border-t border-[var(--border-subtle)] pt-6">
              <span className="text-xs font-semibold text-[var(--accent)] tracking-[0.16em] uppercase block mb-2">
                PRACTITIONER PROFILE
              </span>
              <h3 className="text-2xl font-bold text-[var(--text-heading)] mb-1">
                Khubaib Salafi
              </h3>
              <p className="text-sm text-[var(--text-muted)]">
                Graphic & Visual Designer · Based in Bangladesh
              </p>
            </div>

            {/* Design Software Stack */}
            <div className="border-t border-[var(--border-subtle)] pt-6">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-4">
                Core Toolset
              </span>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool) => (
                  <span
                    key={tool}
                    className="px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] font-medium transition-colors hover:text-[var(--accent)]"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* Working Philosophy */}
            <div className="border-t border-[var(--border-subtle)] pt-6 text-sm text-[var(--text-secondary)] leading-relaxed">
              <p className="italic text-[var(--text-muted)]">
                "Every mark, margin, and color choice must fulfill an optical and communicative objective."
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

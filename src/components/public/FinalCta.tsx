import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SiteContent } from '../../types';
import { smoothScrollTo } from '../../lib/scrollUtils';

interface FinalCtaProps {
  content: SiteContent;
}

export const FinalCta: React.FC<FinalCtaProps> = ({ content }) => {
  const { localized } = useLanguage();

  const title = localized(content.finalCtaTitleEn, content.finalCtaTitleBn);
  const desc = localized(content.finalCtaDescEn, content.finalCtaDescBn);

  return (
    <section id="final-cta" className="py-20 sm:py-32 relative transition-colors border-t border-[var(--border-subtle)] overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Dark Theme: Outlined premium CTA panel container; Light Theme: open/unboxed */}
        <div className="relative overflow-hidden public-panel rounded-3xl py-14 sm:py-20 md:py-24 px-5 sm:px-10 md:px-12">
          {/* Soft emerald aura */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[240px] sm:h-[300px] blur-[100px] sm:blur-[120px] rounded-full pointer-events-none"
            style={{
              backgroundColor: 'var(--accent)',
              opacity: 'var(--blur-opacity)',
            }}
          />

          <div className="relative z-10 max-w-2xl mx-auto">
            {/* Dark theme: original tech comment kicker; Light theme: editorial dot kicker */}
            <div className="dark:inline-flex hidden items-center justify-center gap-2 mb-4">
              <span className="font-mono text-xs text-[var(--accent)] tracking-widest uppercase">
                // COLLABORATION
              </span>
            </div>
            <div className="dark:hidden inline-flex items-center justify-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                {localized('COLLABORATION', 'সহযোগিতা')}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--text-heading)] tracking-tight leading-[1.12] mb-6">
              {title}
            </h2>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] mb-10 max-w-xl mx-auto leading-relaxed font-normal">
              {desc}
            </p>

            <a
              id="final-cta-action-btn"
              href="#consultation-form"
              onClick={(e) => {
                e.preventDefault();
                smoothScrollTo('#consultation-form', true);
              }}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer hover:-translate-y-0.5 active:scale-98"
            >
              <span>{localized('START A PROJECT', 'প্রজেক্ট শুরু করুন')}</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SiteContent } from '../../types';

interface FinalCtaProps {
  content: SiteContent;
}

export const FinalCta: React.FC<FinalCtaProps> = ({ content }) => {
  const { localized } = useLanguage();

  const title = localized(content.finalCtaTitleEn, content.finalCtaTitleBn);
  const desc = localized(content.finalCtaDescEn, content.finalCtaDescBn);

  return (
    <section className="py-20 sm:py-28 relative transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="relative rounded-3xl bg-[var(--bg-card)] border border-[var(--border-medium)] p-8 sm:p-14 lg:p-16 text-center shadow-[var(--card-shadow)] overflow-hidden transition-colors">
          {/* Radial soft emerald aura */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] blur-[100px] rounded-full pointer-events-none"
            style={{
              backgroundColor: 'var(--accent)',
              opacity: 'var(--blur-opacity)',
            }}
          />
          <div className="absolute inset-0 bg-subtle-grid pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--code-tag-bg)] border border-[var(--code-tag-border)] text-[var(--code-tag-text)] text-xs font-mono tracking-widest uppercase mb-6 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>COLLABORATION</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--text-heading)] tracking-tight leading-[1.12] mb-5">
              {title}
            </h2>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] mb-8 max-w-xl mx-auto leading-relaxed">
              {desc}
            </p>

            <a
              href="#consultation-form"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('consultation-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-[0_0_24px_var(--accent-glow)] cursor-pointer"
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

import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Sparkles, User, ArrowDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SiteContent, Project } from '../../types';

interface HeroProps {
  content: SiteContent;
  heroProject?: Project;
}

export const Hero: React.FC<HeroProps> = ({ content }) => {
  const { localized } = useLanguage();

  const eyebrow = localized(content.heroEyebrowEn, content.heroEyebrowBn);
  const headline = localized(content.heroTitleEn, content.heroTitleBn);
  const description = localized(content.heroDescriptionEn, content.heroDescriptionBn);
  const primaryCta = localized(content.primaryCtaEn, content.primaryCtaBn);
  const secondaryCta = localized(content.secondaryCtaEn, content.secondaryCtaBn);

  const personalTag = localized(
    content.heroPersonalImageTagEn || 'Visual Designer & Art Director',
    content.heroPersonalImageTagBn || 'ভিজ্যুয়াল ডিজাইনার ও আর্ট ডিরেক্টর'
  );

  const disciplines = [
    { en: 'Brand Identity', bn: 'ব্র্যান্ড আইডেন্টিটি' },
    { en: 'Graphic Design', bn: 'গ্রাফিক ডিজাইন' },
    { en: 'Digital Design', bn: 'ডিজিটাল ডিজাইন' },
    { en: 'UI / Web Design', bn: 'ইউআই / ওয়েব ডিজাইন' },
  ];

  return (
    <section
      id="hero"
      className="relative min-h-[85vh] sm:min-h-[88vh] flex items-center justify-center pt-8 pb-16 sm:pb-24 overflow-hidden"
    >
      {/* Ambient background glow and grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[750px] h-[380px] blur-[110px] rounded-full transition-all duration-700"
          style={{
            backgroundColor: 'var(--accent)',
            opacity: 'var(--blur-opacity)',
          }}
        />
        <div className="absolute inset-0 bg-subtle-grid" />
      </div>

      {/* Subtle oversized background display text */}
      <div
        aria-hidden="true"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 select-none pointer-events-none opacity-[0.03] text-[18vw] font-extrabold tracking-tighter text-[var(--text-primary)] whitespace-nowrap z-0"
      >
        KHUBAIB
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* LEFT: Dedicated Hero Personal Image Showcase Frame */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 order-2 lg:order-1 flex justify-center"
          >
            <div
              id="hero-personal-visual-card"
              className="group relative w-full max-w-md sm:max-w-lg aspect-[4/4.6] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] p-3 shadow-2xl shadow-[var(--card-shadow)] transition-all duration-500 hover:border-[var(--accent)]"
            >
              {/* Outer decorative corner crosshairs */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-[var(--accent)] opacity-80" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-[var(--accent)] opacity-80" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-[var(--accent)] opacity-80" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-[var(--accent)] opacity-80" />

              {/* Inner card frame */}
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-[var(--bg-card-subtle)] flex flex-col border border-[var(--border-subtle)]">
                {/* Visual Top Bar */}
                <div className="px-3.5 py-2.5 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]" />
                    <span className="tracking-wider uppercase text-[var(--text-secondary)] font-semibold">
                      KHUBAIB SALAFI
                    </span>
                  </div>
                  <span className="text-[var(--text-muted)] font-mono text-[10px] tracking-wider uppercase">
                    DESIGNER PROFILE
                  </span>
                </div>

                {/* Main Visual: Personal Photo or Architectural Fallback */}
                {content.heroPersonalImage ? (
                  <div className="relative flex-1 overflow-hidden">
                    <img
                      src={content.heroPersonalImage}
                      alt="Khubaib Salafi - Graphic Designer Portrait"
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    {/* Subtle gradient overlay for typographic legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card-subtle)] via-transparent to-transparent opacity-90" />

                    {/* Floating role pill */}
                    <div className="absolute top-3 left-3 bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-medium)] px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wider text-[var(--accent)] uppercase font-semibold shadow-sm">
                      GRAPHIC & BRAND DESIGNER
                    </div>

                    {/* Bottom identity panel */}
                    <div className="absolute bottom-3 left-3 right-3 p-3.5 rounded-lg bg-[var(--bg-card)]/92 backdrop-blur-md border border-[var(--border-medium)] shadow-md">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-[var(--text-heading)] tracking-wide">
                            {localized('Khubaib Salafi', 'খুবাইব সালাফী')}
                          </h4>
                          <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mt-0.5 font-medium">
                            {personalTag}
                          </p>
                        </div>
                        <a
                          href="#about"
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-medium)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] transition-colors shrink-0 cursor-pointer"
                          title="About Khubaib Salafi"
                          aria-label="View biography"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Fallback Architectural Placeholder */
                  <div className="relative flex-1 flex flex-col items-center justify-center p-6 text-center bg-subtle-grid">
                    <div className="w-20 h-20 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-medium)] flex items-center justify-center text-[var(--accent)] shadow-inner mb-4">
                      <User className="w-9 h-9 opacity-80" />
                    </div>
                    <h4 className="text-base font-bold text-[var(--text-heading)] mb-1">
                      {localized('Khubaib Salafi', 'খুবাইব সালাফী')}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] max-w-xs font-mono">
                      {personalTag}
                    </p>
                    <span className="mt-4 px-3 py-1 rounded-full bg-[var(--code-tag-bg)] border border-[var(--code-tag-border)] text-[var(--code-tag-text)] text-[10px] font-mono uppercase tracking-wider">
                      AVAILABLE FOR SELECTED WORK
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Typography & Modern Action Section */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 order-1 lg:order-2 flex flex-col justify-center"
          >
            {/* Eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-[var(--code-tag-bg)] border border-[var(--code-tag-border)] text-[var(--code-tag-text)] text-xs font-mono tracking-widest uppercase mb-5 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{eyebrow}</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              id="hero-headline"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-[var(--text-heading)] leading-[1.12] mb-5"
            >
              {headline}
            </motion.h1>

            {/* Supporting Description */}
            <motion.p
              id="hero-description"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed mb-8 max-w-xl font-normal"
            >
              {description}
            </motion.p>

            {/* CTA Buttons with refined hover micro-interactions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center gap-3.5 mb-10"
            >
              <motion.a
                id="hero-primary-cta"
                href="#work"
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase bg-[var(--accent)] text-[var(--accent-contrast)] border border-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-[0_0_20px_var(--accent-glow)] cursor-pointer"
              >
                <span>{primaryCta}</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </motion.a>

              <motion.a
                id="hero-secondary-cta"
                href="#consultation"
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('consultation')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase bg-[var(--bg-card)] text-[var(--text-primary)] hover:text-[var(--accent)] border border-[var(--border-medium)] hover:border-[var(--accent)] transition-all duration-200 cursor-pointer shadow-sm"
              >
                <span>{secondaryCta}</span>
              </motion.a>
            </motion.div>

            {/* Compact Metadata Row */}
            <motion.div
              id="hero-meta-row"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.48 }}
              className="pt-6 border-t border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {disciplines.map((item, idx) => (
                <div key={idx} className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-[var(--accent)] text-xs mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">0{idx + 1}</span>
                  </div>
                  <span className="text-xs sm:text-[13px] font-medium text-[var(--text-primary)]">
                    {localized(item.en, item.bn)}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

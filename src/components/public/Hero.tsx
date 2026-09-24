import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, Sparkles, User, ArrowDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SiteContent, Project } from '../../types';
import { smoothScrollTo } from '../../lib/scrollUtils';

interface HeroProps {
  content: SiteContent;
  heroProject?: Project;
}

export const Hero: React.FC<HeroProps> = ({ content }) => {
  const { localized } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const hasLiveImage = Boolean(
    content.heroPersonalImage &&
    content.heroPersonalImage.trim() !== '' &&
    content.heroPersonalImage !== '/assets/khubaib_portrait.jpg'
  );

  useEffect(() => {
    if (!hasLiveImage) {
      setImageLoaded(false);
      return;
    }
    if (imageRef.current?.complete) {
      setImageLoaded(true);
    } else {
      setImageLoaded(false);
    }
  }, [content.heroPersonalImage, hasLiveImage]);

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
          <div className="lg:col-span-6 order-2 lg:order-1 flex justify-center">
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

                {/* Main Visual: Branded Placeholder Frame with Live Image Fade-in */}
                <div className="relative flex-1 overflow-hidden bg-[var(--bg-card-subtle)]">
                  {/* Lightweight branded placeholder while image decodes or loads */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-card)] flex flex-col items-center justify-center transition-opacity duration-300 pointer-events-none z-0 ${
                      imageLoaded ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)] font-mono text-xs font-bold animate-pulse mb-2">
                      KS
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                      {hasLiveImage ? 'Loading Visual...' : 'Designer Profile'}
                    </span>
                  </div>

                  {hasLiveImage && (
                    <img
                      ref={imageRef}
                      src={content.heroPersonalImage}
                      alt="Khubaib Salafi - Graphic Designer Portrait"
                      loading="eager"
                      // @ts-ignore fetchPriority is supported in modern browsers
                      fetchPriority="high"
                      decoding="async"
                      onLoad={() => setImageLoaded(true)}
                      className={`w-full h-full object-cover object-center transition-all duration-300 ease-out group-hover:scale-105 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  )}
                  {/* Subtle gradient overlay for typographic legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card-subtle)] via-transparent to-transparent opacity-90 pointer-events-none z-10" />

                  {/* Floating role pill */}
                  <div className="absolute top-3 left-3 bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-medium)] px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wider text-[var(--accent)] uppercase font-semibold shadow-sm z-10">
                    GRAPHIC & BRAND DESIGNER
                  </div>

                  {/* Bottom identity panel */}
                  <div className="absolute bottom-3 left-3 right-3 p-3.5 rounded-lg bg-[var(--bg-card)]/92 backdrop-blur-md border border-[var(--border-medium)] shadow-md z-10">
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
                          smoothScrollTo('#about', true);
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
              </div>
            </div>
          </div>

          {/* RIGHT: Typography & Modern Action Section */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col justify-center">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-[var(--code-tag-bg)] border border-[var(--code-tag-border)] text-[var(--code-tag-text)] text-xs font-mono tracking-widest uppercase mb-5 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{eyebrow}</span>
            </div>

            {/* Headline */}
            <h1
              id="hero-headline"
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-[var(--text-heading)] leading-[1.12] mb-5"
            >
              {headline}
            </h1>

            {/* Supporting Description */}
            <p
              id="hero-description"
              className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed mb-8 max-w-xl font-normal"
            >
              {description}
            </p>

            {/* CTA Buttons */}
            <div id="hero-cta-group" className="flex flex-wrap items-center gap-3.5 mb-10">
              <a
                id="hero-primary-cta"
                href="#work"
                onClick={(e) => {
                  e.preventDefault();
                  smoothScrollTo('#work', true);
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase bg-[var(--accent)] text-[var(--accent-contrast)] border border-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-[0_0_20px_var(--accent-glow)] cursor-pointer hover:-translate-y-0.5 active:scale-98"
              >
                <span>{primaryCta}</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              <a
                id="hero-secondary-cta"
                href="#consultation"
                onClick={(e) => {
                  e.preventDefault();
                  smoothScrollTo('#consultation', true);
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase bg-[var(--bg-card)] text-[var(--text-primary)] hover:text-[var(--accent)] border border-[var(--border-medium)] hover:border-[var(--accent)] transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5 active:scale-98"
              >
                <span>{secondaryCta}</span>
              </a>
            </div>

            {/* Compact Metadata Row */}
            <div
              id="hero-meta-row"
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
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

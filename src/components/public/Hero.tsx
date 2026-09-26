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
    content.heroPersonalImage.trim() !== ''
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
      className="relative min-h-[85vh] sm:min-h-[88vh] flex items-center justify-center pt-8 sm:pt-12 pb-20 sm:pb-28 overflow-hidden"
    >
      {/* Soft ambient aura */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[750px] h-[380px] blur-[140px] rounded-full transition-all duration-700"
          style={{
            backgroundColor: 'var(--accent)',
            opacity: 'var(--blur-opacity)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT: Clean Frameless Personal Portrait Showcase */}
          <div className="lg:col-span-5 order-2 lg:order-1 flex justify-center">
            <div
              id="hero-personal-visual-card"
              className="group relative w-full max-w-sm sm:max-w-md aspect-[4/5] rounded-3xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--card-shadow)] transition-all duration-500 hover:shadow-xl hover:border-[var(--border-hover)]"
            >
              {/* Lightweight branded placeholder while image decodes or loads */}
              <div
                className={`absolute inset-0 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-card)] flex flex-col items-center justify-center transition-opacity duration-300 pointer-events-none z-0 ${
                  imageLoaded ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)] font-mono text-sm font-bold mb-2 shadow-sm">
                  KS
                </div>
                <span className="text-[11px] text-[var(--text-muted)] tracking-wider">
                  {hasLiveImage ? 'Loading...' : 'Visual Designer'}
                </span>
              </div>

              {hasLiveImage && (
                <img
                  ref={imageRef}
                  src={content.heroPersonalImage}
                  alt="Khubaib Salafi - Visual Designer"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-[1.02] ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}

              {/* Minimal graceful bottom caption overlay */}
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[var(--bg-card)]/90 via-[var(--bg-card)]/40 to-transparent backdrop-blur-[2px]">
                <p className="text-sm font-semibold text-[var(--text-heading)]">
                  {localized('Khubaib Salafi', 'খুবাইব সালাফী')}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {personalTag}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Typography & Editorial Actions */}
          <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col justify-center">
            {/* Kicker: Dark theme preserves original monospace kicker; Light theme uses minimal dot kicker */}
            <div className="dark:flex hidden items-center gap-2 mb-4">
              <span className="font-mono text-xs text-[var(--accent)] tracking-widest uppercase">
                // {eyebrow}
              </span>
            </div>
            <div className="dark:hidden flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                {eyebrow}
              </span>
            </div>

            {/* Headline */}
            <h1
              id="hero-headline"
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-[var(--text-heading)] leading-[1.12] mb-6"
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

            {/* Minimal Editorial CTA Buttons */}
            <div id="hero-cta-group" className="flex flex-wrap items-center gap-3.5 mb-12">
              <a
                id="hero-primary-cta"
                href="#work"
                onClick={(e) => {
                  e.preventDefault();
                  smoothScrollTo('#work', true);
                }}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer hover:-translate-y-0.5 active:scale-98"
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
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase text-[var(--text-primary)] hover:text-[var(--accent)] border border-[var(--border-medium)] hover:border-[var(--accent)] bg-[var(--bg-card)] transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5 active:scale-98"
              >
                <span>{secondaryCta}</span>
              </a>
            </div>

            {/* Clean unboxed discipline separators */}
            <div
              id="hero-meta-row"
              className="pt-6 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--text-muted)]"
            >
              {disciplines.map((item, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-[var(--border-medium)] select-none">·</span>}
                  <span className="font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                    {localized(item.en, item.bn)}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

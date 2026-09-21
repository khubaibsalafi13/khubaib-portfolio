import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const ExpertiseMarquee: React.FC = () => {
  const { t } = useLanguage();

  const baseItems = [
    { id: '01', label: t('marquee.items.0') || 'BRAND IDENTITY' },
    { id: '02', label: t('marquee.items.1') || 'GRAPHIC DESIGN' },
    { id: '03', label: t('marquee.items.2') || 'DIGITAL DESIGN' },
    { id: '04', label: t('marquee.items.3') || 'UI / WEB DESIGN' },
    { id: '05', label: t('marquee.items.4') || 'VISUAL COMMUNICATION' },
  ];

  // Repeat items for a continuous, seamless infinite loop
  const repeated = [
    ...baseItems,
    ...baseItems,
    ...baseItems,
    ...baseItems,
    ...baseItems,
    ...baseItems,
  ];

  return (
    <section
      id="expertise-marquee"
      className="relative w-full overflow-hidden bg-[var(--bg-card-subtle)] border-y border-[var(--border-subtle)] py-5 sm:py-6 md:py-7 lg:py-8 select-none transition-colors z-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]"
      aria-label="Design Disciplines Marquee"
    >
      {/* Subtle ambient brand color glow */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,var(--primary-accent-glow),transparent_75%)] opacity-25 pointer-events-none"
        aria-hidden="true"
      />

      {/* Left and right soft edge fade masks */}
      <div
        className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 md:w-44 bg-gradient-to-r from-[var(--bg-page)] via-[var(--bg-card-subtle)] to-transparent z-10 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 md:w-44 bg-gradient-to-l from-[var(--bg-page)] via-[var(--bg-card-subtle)] to-transparent z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Infinite scrolling marquee track */}
      <div className="flex w-max items-center animate-marquee hover:[animation-play-state:paused] will-change-transform">
        {repeated.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="group inline-flex items-center gap-3 sm:gap-4 md:gap-6 px-4 sm:px-6 md:px-8 cursor-default"
          >
            {/* Subtle index number with dynamic accent */}
            <span className="font-mono text-[10px] sm:text-xs md:text-sm font-semibold tracking-wider text-[var(--accent)] opacity-50 group-hover:opacity-100 transition-opacity">
              {item.id}
            </span>

            {/* Disciplines label with refined editorial typography */}
            <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold uppercase tracking-[0.14em] sm:tracking-[0.18em] text-[var(--text-secondary)] group-hover:text-[var(--text-heading)] transition-colors whitespace-nowrap">
              {item.label}
            </span>

            {/* Separator dot with brand glow & hover scale */}
            <span
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--primary-accent-glow)] group-hover:scale-125 transition-transform shrink-0 ml-1 sm:ml-2"
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </section>
  );
};


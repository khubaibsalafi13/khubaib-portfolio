import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const ExpertiseMarquee: React.FC = () => {
  const { t } = useLanguage();

  const items = [
    t('marquee.items.0') || 'BRAND IDENTITY',
    t('marquee.items.1') || 'GRAPHIC DESIGN',
    t('marquee.items.2') || 'DIGITAL DESIGN',
    t('marquee.items.3') || 'UI / WEB DESIGN',
    t('marquee.items.4') || 'VISUAL COMMUNICATION',
  ];

  // Repeat items to ensure smooth continuous marquee loop
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div
      id="expertise-marquee"
      className="relative w-full overflow-hidden bg-[var(--bg-card-subtle)] border-y border-[var(--border-subtle)] py-3.5 select-none transition-colors"
      aria-label="Design Disciplines Marquee"
    >
      {/* Left/right subtle fade gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[var(--bg-card-subtle)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[var(--bg-card-subtle)] to-transparent z-10 pointer-events-none" />

      <div className="flex w-max items-center animate-marquee hover:[animation-play-state:paused]">
        {repeated.map((item, index) => (
          <div key={index} className="flex items-center gap-6 px-4">
            <span className="text-xs font-mono tracking-[0.22em] text-[var(--text-secondary)] uppercase font-semibold whitespace-nowrap">
              {item}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent-glow)]" />
          </div>
        ))}
      </div>
    </div>
  );
};

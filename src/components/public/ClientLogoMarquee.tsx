import React from 'react';
import { ClientLogo } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface ClientLogoMarqueeProps {
  logos: ClientLogo[];
  titleEn?: string;
  titleBn?: string;
}

export const ClientLogoMarquee: React.FC<ClientLogoMarqueeProps> = ({
  logos,
  titleEn = 'BRANDS I HAVE WORKED WITH',
  titleBn = 'যাদের সাথে কাজ করেছি',
}) => {
  const { localized } = useLanguage();
  const { isDark } = useTheme();

  // If no published logos exist, hide the section completely as per instructions
  if (!logos || logos.length === 0) {
    return null;
  }

  const title = localized(titleEn, titleBn);

  // Duplicate for seamless right-to-left marquee loop
  const repeatedLogos = [...logos, ...logos, ...logos, ...logos];

  return (
    <section id="clients" className="py-16 sm:py-20 relative overflow-hidden bg-[var(--bg-card-subtle)] border-y border-[var(--border-subtle)] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
        <span className="text-xs font-mono tracking-[0.2em] text-[var(--text-muted)] uppercase">
          // {title}
        </span>
      </div>

      {/* Infinite right-to-left scrolling logo rail */}
      <div className="relative w-full overflow-hidden select-none">
        {/* Left/Right gradient fades */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[var(--bg-card-subtle)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[var(--bg-card-subtle)] to-transparent z-10 pointer-events-none" />

        <div className="flex w-max items-center animate-marquee hover:[animation-play-state:paused]">
          {repeatedLogos.map((logo, idx) => (
            <div
              key={`${logo.id}-${idx}`}
              className="flex items-center justify-center px-8 sm:px-12 py-3"
            >
              {logo.websiteUrl ? (
                <a
                  href={logo.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block transition-opacity duration-300 opacity-60 hover:opacity-100"
                >
                  <img
                    src={logo.logoImage}
                    alt={localized(logo.altTextEn, logo.altTextBn) || logo.companyName}
                    className={`h-8 sm:h-10 w-auto object-contain transition-all duration-300 ${
                      isDark
                        ? 'filter grayscale invert brightness-125 group-hover:filter-none'
                        : 'filter grayscale contrast-125 group-hover:filter-none'
                    }`}
                  />
                </a>
              ) : (
                <div className="opacity-60 hover:opacity-100 transition-opacity duration-300">
                  <img
                    src={logo.logoImage}
                    alt={localized(logo.altTextEn, logo.altTextBn) || logo.companyName}
                    className={`h-8 sm:h-10 w-auto object-contain transition-all duration-300 ${
                      isDark
                        ? 'filter grayscale invert brightness-125'
                        : 'filter grayscale contrast-125'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

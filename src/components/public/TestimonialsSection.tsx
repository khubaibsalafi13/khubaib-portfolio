import React from 'react';
import { motion } from 'motion/react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { Testimonial } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
  titleEn?: string;
  titleBn?: string;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  testimonials,
  titleEn = 'CLIENT TESTIMONIALS',
  titleBn = 'ক্লায়েন্টদের মতামত',
}) => {
  const { localized, t } = useLanguage();

  // If no published testimonials exist, hide the section entirely
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const title = localized(titleEn, titleBn);

  return (
    <section id="testimonials" className="py-20 sm:py-28 relative bg-[var(--bg-card-subtle)]/40 border-t border-[var(--border-subtle)] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--code-tag-bg)] border border-[var(--code-tag-border)] text-[var(--code-tag-text)] text-xs font-mono tracking-widest uppercase mb-3 font-semibold">
            <span>// ENDORSEMENTS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-heading)] tracking-tight">
            {title}
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {testimonials.map((test, index) => {
            const reviewText = localized(test.reviewTextEn, test.reviewTextBn);
            const ratingCount = Math.max(1, Math.min(5, test.rating ?? 5));

            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl p-[1px] overflow-hidden transition-all duration-300 shadow-[var(--card-shadow)] hover:shadow-2xl"
              >
                {/* Static subtle base border */}
                <div className="absolute inset-0 rounded-2xl border border-[var(--border-subtle)] pointer-events-none z-10" />

                {/* Continuously Moving Dynamic Brand-Color Edge Beam */}
                <div
                  className="absolute -inset-[100%] pointer-events-none opacity-45 dark:opacity-70 group-hover:opacity-100 transition-opacity duration-500 animate-border-beam"
                  style={{
                    background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 290deg, var(--primary-accent, #10b981) 330deg, transparent 360deg)`,
                  }}
                  aria-hidden="true"
                />

                {/* Inner Card Body */}
                <div className="relative z-20 w-full h-full rounded-[15px] bg-[var(--bg-card)] p-6 sm:p-7 flex flex-col justify-between transition-colors">
                  {/* Top: Star rating & Quote icon */}
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      {/* Rating Stars with One-by-One Staggered Entrance Animation & Refined Gold Color */}
                      <div className="flex items-center gap-1.5" aria-label={`${ratingCount} out of 5 stars`}>
                        {Array.from({ length: 5 }).map((_, starIdx) => {
                          const isFilled = starIdx < ratingCount;
                          return (
                            <motion.span
                              key={starIdx}
                              initial={{ opacity: 0, scale: 0.3, y: 4 }}
                              whileInView={{ opacity: 1, scale: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{
                                duration: 0.35,
                                ease: [0.22, 1, 0.36, 1],
                                delay: (index * 0.1) + (starIdx * 0.08) + 0.15,
                              }}
                              className="inline-flex"
                            >
                              <Star
                                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors ${
                                  isFilled
                                    ? 'fill-[#FFC83D] text-[#FFC83D] drop-shadow-[0_1px_3px_rgba(255,200,61,0.25)]'
                                    : 'fill-transparent text-[var(--border-medium)] opacity-35'
                                }`}
                              />
                            </motion.span>
                          );
                        })}
                      </div>

                      <div className="p-2 rounded-lg bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--border-medium)] shadow-sm">
                        <Quote className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Review Quote Text */}
                    <blockquote className="text-sm sm:text-[15px] text-[var(--text-secondary)] leading-relaxed mb-6 font-normal italic">
                      "{reviewText}"
                    </blockquote>
                  </div>

                  {/* Bottom: Client Profile & Metadata */}
                  <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center gap-3.5">
                    {test.avatarImage ? (
                      <img
                        src={test.avatarImage}
                        alt={test.clientName}
                        className="w-11 h-11 rounded-full object-cover border border-[var(--border-medium)] shadow-sm bg-[var(--bg-surface)] shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[var(--bg-surface)] border border-[var(--border-medium)] flex items-center justify-center text-sm font-bold text-[var(--accent)] font-mono shadow-sm shrink-0">
                        {test.clientName ? test.clientName.trim().charAt(0).toUpperCase() : 'C'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-[var(--text-heading)] truncate">
                          {test.clientName}
                        </span>
                        <span title={t('testimonials.verified')} className="inline-flex">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        {[test.role, test.company].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};


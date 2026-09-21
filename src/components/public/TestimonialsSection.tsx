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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--code-tag-bg)] border border-[var(--code-tag-border)] text-[var(--code-tag-text)] text-xs font-mono tracking-widest uppercase mb-3 font-semibold">
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

            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] hover:border-[var(--accent)] p-6 sm:p-7 flex flex-col justify-between transition-colors duration-300 shadow-[var(--card-shadow)] hover:shadow-xl"
              >
                {/* Top: Star rating & Quote icon */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    {/* Stars */}
                    {test.rating ? (
                      <div className="flex items-center gap-1 text-[var(--accent)]">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-4 h-4 ${
                              idx < test.rating!
                                ? 'fill-[var(--accent)] text-[var(--accent)]'
                                : 'text-[var(--border-medium)]'
                            }`}
                          />
                        ))}
                      </div>
                    ) : (
                      <div />
                    )}

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
                      className="w-10 h-10 rounded-full object-cover border border-[var(--border-medium)]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border-medium)] flex items-center justify-center text-sm font-bold text-[var(--accent)]">
                      {test.clientName.charAt(0).toUpperCase()}
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
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {[test.role, test.company].filter(Boolean).join(' • ')}
                    </p>
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

import React, { useState, useRef } from 'react';
import { Star, Quote, CheckCircle2, MessageSquarePlus } from 'lucide-react';
import { Testimonial } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ReviewSubmissionModal } from './ReviewSubmissionModal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);

  const title = localized(titleEn, titleBn);
  const hasTestimonials = testimonials && testimonials.length > 0;

  return (
    <section
      id="testimonials"
      className="py-20 sm:py-28 relative bg-[var(--bg-card-subtle)]/40 border-t border-[var(--border-subtle)] transition-colors"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Leave a Review CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--code-tag-bg)] border border-[var(--code-tag-border)] text-[var(--code-tag-text)] text-xs font-mono tracking-widest uppercase mb-3 font-semibold">
              <span>// ENDORSEMENTS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-heading)] tracking-tight">
              {title}
            </h2>
          </div>

          {/* Public "LEAVE A REVIEW" CTA */}
          <button
            ref={triggerBtnRef}
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] hover:text-[var(--accent)] border border-[var(--border-medium)] hover:border-[var(--accent)] transition-all duration-200 cursor-pointer shadow-sm shrink-0 self-start sm:self-auto hover:-translate-y-0.5 active:scale-98"
          >
            <MessageSquarePlus className="w-4 h-4 text-[var(--accent)]" />
            <span>{localized('LEAVE A REVIEW', 'রিভিউ দিন')}</span>
          </button>
        </div>

        {/* Testimonials Grid or Empty Invitation */}
        {!hasTestimonials ? (
          <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-[var(--border-medium)] bg-[var(--bg-card)]/50 max-w-lg mx-auto">
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {localized(
                'Have we collaborated on a creative project? Share your genuine feedback and experience.',
                'আমরা কি কোনো ক্রিয়েটিভ প্রজেক্টে একসাথে কাজ করেছি? আপনার অভিজ্ঞতা ও মূল্যবান মতামত জানান।'
              )}
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--accent)] hover:brightness-110 text-black transition-all active:scale-98 cursor-pointer shadow-md"
            >
              <MessageSquarePlus className="w-4 h-4 text-black" />
              <span>{localized('SHARE YOUR EXPERIENCE', 'অভিজ্ঞতা শেয়ার করুন')}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {testimonials.map((test, index) => {
              // Automatic bilingual fallback: if localized text is missing in current language, falls back to available language
              const reviewText = localized(test.reviewTextEn, test.reviewTextBn) || test.reviewTextEn || test.reviewTextBn;
              const ratingCount = Math.max(1, Math.min(5, test.rating ?? 5));

              return (
                <div
                  key={test.id}
                  className="group relative rounded-2xl p-[1.5px] overflow-hidden transition-all duration-300 shadow-[var(--card-shadow)] hover:shadow-2xl hover:-translate-y-1 isolate"
                >
                  {/* 1. Outer Bloom Layer - soft halo following the moving segment */}
                  <div
                    className="absolute -inset-[150%] pointer-events-none opacity-40 dark:opacity-70 group-hover:opacity-95 transition-opacity duration-500 animate-border-beam-bloom z-0"
                    style={{
                      background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 290deg, var(--primary-accent, #10b981) 325deg, var(--primary-accent, #10b981) 345deg, transparent 360deg)`,
                      filter: 'blur(10px)',
                      animationDelay: `${-(index * 1.8)}s`,
                    }}
                    aria-hidden="true"
                  />

                  {/* 2. Sharp Core Edge Beam - bright focused Brand Color segment */}
                  <div
                    className="absolute -inset-[150%] pointer-events-none opacity-65 dark:opacity-90 group-hover:opacity-100 transition-opacity duration-500 animate-border-beam z-0"
                    style={{
                      background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 285deg, var(--primary-accent, #10b981) 325deg, var(--primary-accent, #10b981) 345deg, transparent 360deg)`,
                      animationDelay: `${-(index * 1.8)}s`,
                    }}
                    aria-hidden="true"
                  />

                  {/* 3. Static subtle base border */}
                  <div className="absolute inset-0 rounded-2xl border border-[var(--border-subtle)] pointer-events-none z-10" />

                  {/* 4. Inner Card Body */}
                  <div className="relative z-20 w-full h-full rounded-[14.5px] bg-[var(--bg-card)] p-6 sm:p-7 flex flex-col justify-between transition-colors">
                    {/* Top: Star rating & Quote icon */}
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        {/* Rating Stars (Yellow #FFC83D) */}
                        <div className="flex items-center gap-1.5" aria-label={`${ratingCount} out of 5 stars`}>
                          {Array.from({ length: 5 }).map((_, starIdx) => {
                            const isFilled = starIdx < ratingCount;
                            return (
                              <span key={starIdx} className="inline-flex">
                                <Star
                                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors ${
                                    isFilled
                                      ? 'fill-[#FFC83D] text-[#FFC83D] drop-shadow-[0_1px_3px_rgba(255,200,61,0.25)]'
                                      : 'fill-transparent text-[var(--border-medium)] opacity-35'
                                  }`}
                                />
                              </span>
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
                          {[test.role, test.company].filter(Boolean).join(' • ') || test.company}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Portal-based Review Submission Modal */}
      <ReviewSubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        triggerRef={triggerBtnRef}
      />
    </section>
  );
};

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Star, Quote, CheckCircle2, MessageSquarePlus, X, Sparkles } from 'lucide-react';
import { Testimonial } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ReviewSubmissionModal } from './ReviewSubmissionModal';
import { gsap, ScrollTrigger } from '../../lib/gsap';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
  titleEn?: string;
  titleBn?: string;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  testimonials,
  titleEn = 'What They’re Saying',
  titleBn = 'ক্লায়েন্টদের মূল্যায়ন',
}) => {
  const { localized } = useLanguage();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [readMoreItem, setReadMoreItem] = useState<Testimonial | null>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);

  // Filter only published testimonials from Supabase
  const publishedList = useMemo(() => {
    return (testimonials || [])
      .filter((t) => t.published !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [testimonials]);

  // Distribute into 3 editorial columns for desktop
  const { colLeft, colCenter, colRight } = useMemo(() => {
    const left: Testimonial[] = [];
    const center: Testimonial[] = [];
    const right: Testimonial[] = [];

    publishedList.forEach((item, idx) => {
      if (idx % 3 === 0) left.push(item);
      else if (idx % 3 === 1) center.push(item);
      else right.push(item);
    });

    return { colLeft: left, colCenter: center, colRight: right };
  }, [publishedList]);

  // Animation DOM Refs
  const sectionRef = useRef<HTMLElement>(null);
  const colLeftRef = useRef<HTMLDivElement>(null);
  const colCenterRef = useRef<HTMLDivElement>(null);
  const colRightRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  // GSAP: Staggered Entrance & Subtle Column Parallax (No Flip, No Timers, No Card Swapping)
  useEffect(() => {
    if (!sectionRef.current || publishedList.length === 0) return;

    const isReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (isReducedMotion) {
        gsap.set('.testimonial-card-el', { opacity: 1, y: 0, scale: 1 });
        return;
      }

      // ==========================================
      // 1 & 2. STAGGERED ENTRANCE WITH DIRECTIONAL VARIATION
      // ==========================================
      // Desktop columns entrance with subtle directional variation:
      // Column 1: y: 28px -> 0
      // Column 2: y: 40px -> 0
      // Column 3: y: 24px -> 0
      const leftCards = colLeftRef.current?.querySelectorAll('.testimonial-card-el');
      const centerCards = colCenterRef.current?.querySelectorAll('.testimonial-card-el');
      const rightCards = colRightRef.current?.querySelectorAll('.testimonial-card-el');

      if (leftCards && leftCards.length > 0) {
        gsap.fromTo(
          leftCards,
          { opacity: 0, y: 28, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: colLeftRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }

      if (centerCards && centerCards.length > 0) {
        gsap.fromTo(
          centerCards,
          { opacity: 0, y: 40, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.85,
            stagger: 0.1,
            delay: 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: colCenterRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }

      if (rightCards && rightCards.length > 0) {
        gsap.fromTo(
          rightCards,
          { opacity: 0, y: 24, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.1,
            delay: 0.16,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: colRightRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }

      // Mobile/Tablet entrance (simple staggered fade & rise)
      const mobileCards = mobileContainerRef.current?.querySelectorAll('.testimonial-card-el');
      if (mobileCards && mobileCards.length > 0) {
        gsap.fromTo(
          mobileCards,
          { opacity: 0, y: 24, scale: 0.985 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.75,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: mobileContainerRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }

      // ==========================================
      // 3 & 4. SUBTLE COLUMN PARALLAX (DESKTOP ONLY)
      // ==========================================
      // Moves columns as groups by just 10px–18px total across scroll.
      // Cards stay in original DOM order. No permanent changes.
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        if (colLeftRef.current) {
          gsap.to(colLeftRef.current, {
            y: -16,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2,
            },
          });
        }

        if (colCenterRef.current) {
          gsap.to(colCenterRef.current, {
            y: 12,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2,
            },
          });
        }

        if (colRightRef.current) {
          gsap.to(colRightRef.current, {
            y: -12,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2,
            },
          });
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [publishedList.length]);

  const hasTestimonials = publishedList.length > 0;
  const sectionTitle = localized(titleEn, titleBn);

  // Renders a single testimonial card with refined hover lift, photo reveal & border glow
  const renderCard = (test: Testimonial, index: number, isFeaturedDirect = false) => {
    const reviewText =
      localized(test.reviewTextEn, test.reviewTextBn) ||
      test.reviewTextEn ||
      test.reviewTextBn;
    const ratingCount = Math.max(1, Math.min(5, test.rating ?? 5));
    const isFeatured = test.featured === true;
    const hasPhoto = Boolean(test.avatarImage && test.avatarImage.trim().length > 0);

    // Truncation for long reviews
    const isLongReview = (reviewText || '').length > 210;
    const displayExcerpt =
      isLongReview && !readMoreItem
        ? `${reviewText.slice(0, 195).trim()}...`
        : reviewText;

    return (
      <div
        key={test.id}
        className={`testimonial-card-el group relative rounded-2xl p-[1.5px] overflow-hidden transition-all duration-500 ease-out shadow-[var(--card-shadow)] hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.01] isolate cursor-default ${
          isFeatured ? 'ring-1 ring-[var(--accent)]/35' : ''
        }`}
      >
        {/* Animated Brand Color Conic Edge Glow: selectively visible on featured cards or activated on hover */}
        <div
          className={`absolute -inset-[150%] pointer-events-none transition-opacity duration-500 animate-border-beam-bloom z-0 ${
            isFeatured
              ? 'opacity-40 dark:opacity-75 group-hover:opacity-95'
              : 'opacity-0 group-hover:opacity-90'
          }`}
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 290deg, var(--primary-accent, #10b981) 325deg, var(--primary-accent, #10b981) 345deg, transparent 360deg)`,
            filter: 'blur(10px)',
            animationDelay: `${-(index * 1.5)}s`,
          }}
          aria-hidden="true"
        />

        <div
          className={`absolute -inset-[150%] pointer-events-none transition-opacity duration-500 animate-border-beam z-0 ${
            isFeatured
              ? 'opacity-65 dark:opacity-90 group-hover:opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          }`}
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 285deg, var(--primary-accent, #10b981) 325deg, var(--primary-accent, #10b981) 345deg, transparent 360deg)`,
            animationDelay: `${-(index * 1.5)}s`,
          }}
          aria-hidden="true"
        />

        {/* Static subtle base border */}
        <div className="absolute inset-0 rounded-2xl border border-[var(--border-subtle)] group-hover:border-[var(--border-hover)] transition-colors pointer-events-none z-10" />

        {/* Desktop Hover Client Photo Reveal (Featured cards subtly visible by default as visual anchors) */}
        {hasPhoto && (
          <div
            className={`hidden sm:block absolute inset-0 z-10 pointer-events-none transition-opacity duration-600 ease-out overflow-hidden rounded-[14.5px] ${
              isFeatured
                ? 'opacity-25 dark:opacity-35 group-hover:opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            }`}
            aria-hidden="true"
          >
            <img
              src={test.avatarImage}
              alt=""
              className="w-full h-full object-cover object-center scale-104 group-hover:scale-100 transition-transform duration-600 ease-out"
            />
            {/* Subtle dark / Brand Color tinted gradient scrim to preserve typography readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-[var(--bg-card)]/92 to-[var(--bg-card)]/45 transition-colors" />
          </div>
        )}

        {/* Card Body */}
        <div className="relative z-20 w-full h-full rounded-[14.5px] bg-[var(--bg-card)] p-6 sm:p-7 flex flex-col justify-between transition-colors">
          <div>
            {/* Top Bar: Yellow Stars & Quote/Anchor Badge */}
            <div className="flex items-center justify-between mb-4">
              {/* Rating Stars: Yellow #FFC83D */}
              <div
                className="flex items-center gap-1.5"
                aria-label={`${ratingCount} out of 5 stars`}
              >
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

              {/* Top-Right Badge: Featured status or Quote Icon */}
              <div className="flex items-center gap-2">
                {isFeatured && (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-medium)]">
                    Featured
                  </span>
                )}
                <div className="p-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--border-medium)] shadow-sm">
                  <Quote className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Review Text */}
            <blockquote className="text-sm sm:text-[15px] text-[var(--text-secondary)] leading-relaxed mb-4 font-normal italic">
              "{displayExcerpt}"
            </blockquote>

            {/* Read More button if text was truncated */}
            {isLongReview && (
              <button
                type="button"
                onClick={() => setReadMoreItem(test)}
                className="text-xs font-semibold text-[var(--accent)] hover:underline mb-4 cursor-pointer inline-flex items-center gap-1"
              >
                <span>{localized('Read more', 'আরও পড়ুন')}</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            )}
          </div>

          {/* Bottom: Client Profile Metadata */}
          <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center gap-3.5 mt-2">
            {/* Client Avatar / Photo */}
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
                <span
                  title={localized('Verified Client Endorsement', 'যাচাইকৃত ক্লায়েন্ট')}
                  className="inline-flex"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                {[test.role, test.company].filter(Boolean).join(' • ') ||
                  test.serviceOrCategory ||
                  test.company ||
                  localized('Collaborator', 'সহযোগী')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="py-20 sm:py-28 relative bg-[var(--bg-card-subtle)]/35 border-t border-[var(--border-subtle)] transition-colors overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header: Left Introduction & Right Leave a Review CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--code-tag-bg)] border border-[var(--code-tag-border)] text-[var(--code-tag-text)] text-xs font-mono tracking-widest uppercase mb-3 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>// {localized('CLIENT TESTIMONIALS', 'ক্লায়েন্টদের মতামত')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-heading)] tracking-tight">
              {sectionTitle}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
              {localized(
                'Honest reflections from founders, creative directors, and collaborators across digital products, visual systems, and brand craft.',
                'ডিজিটাল প্রোডাক্ট, ভিজ্যুয়াল সিস্টেম এবং ব্র্যান্ডিং নিয়ে ক্লায়েন্ট ও সহকর্মীদের খাঁটি অভিজ্ঞতা ও মতামত।'
              )}
            </p>
          </div>

          {/* Right Action: Leave a Review Button */}
          <div className="shrink-0 self-start sm:self-end">
            <button
              ref={triggerBtnRef}
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] hover:text-[var(--accent)] border border-[var(--border-medium)] hover:border-[var(--accent)] transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5 active:scale-98"
            >
              <MessageSquarePlus className="w-4 h-4 text-[var(--accent)]" />
              <span>{localized('LEAVE A REVIEW', 'রিভিউ দিন')}</span>
            </button>
          </div>
        </div>

        {/* Empty State / Invitation to submit review */}
        {!hasTestimonials ? (
          <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-[var(--border-medium)] bg-[var(--bg-card)]/50 max-w-lg mx-auto">
            <Quote className="w-8 h-8 text-[var(--accent)] mx-auto mb-3 opacity-60" />
            <p className="text-sm text-[var(--text-secondary)] mb-5">
              {localized(
                'Have we collaborated on a creative project? Share your genuine feedback and experience.',
                'আমরা কি কোনো ক্রিয়েটিভ প্রজেক্টে একসাথে কাজ করেছি? আপনার অভিজ্ঞতা ও মূল্যবান মতামত জানান।'
              )}
            </p>
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--accent)] hover:brightness-110 text-[var(--accent-contrast)] transition-all active:scale-98 cursor-pointer shadow-md"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>{localized('SHARE YOUR EXPERIENCE', 'অভিজ্ঞতা শেয়ার করুন')}</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Editorial Masonry with Subtle Column Parallax (lg: 3 columns) */}
            <div className="hidden lg:grid lg:grid-cols-3 lg:gap-7 items-start">
              {/* Left Column */}
              <div ref={colLeftRef} className="flex flex-col gap-7">
                {colLeft.map((test, index) => renderCard(test, index * 3))}
              </div>

              {/* Center Column */}
              <div ref={colCenterRef} className="flex flex-col gap-7">
                {colCenter.map((test, index) => renderCard(test, index * 3 + 1))}
              </div>

              {/* Right Column */}
              <div ref={colRightRef} className="flex flex-col gap-7">
                {colRight.map((test, index) => renderCard(test, index * 3 + 2))}
              </div>
            </div>

            {/* Mobile & Tablet Layout (Simple, stable flow without parallax) */}
            <div
              ref={mobileContainerRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-6 items-start"
            >
              {publishedList.map((test, index) => renderCard(test, index, test.featured))}
            </div>
          </>
        )}
      </div>

      {/* Accessible Read More Modal for long reviews */}
      {readMoreItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="read-more-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setReadMoreItem(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-[var(--bg-card)] border border-[var(--border-medium)] p-6 sm:p-8 shadow-2xl shadow-black/60 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setReadMoreItem(null)}
              className="absolute top-4 right-4 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
              aria-label="Close review"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header: Rating & Source */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, starIdx) => {
                  const isFilled = starIdx < Math.max(1, Math.min(5, readMoreItem.rating ?? 5));
                  return (
                    <Star
                      key={starIdx}
                      className={`w-4 h-4 ${
                        isFilled
                          ? 'fill-[#FFC83D] text-[#FFC83D] drop-shadow-[0_1px_3px_rgba(255,200,61,0.25)]'
                          : 'fill-transparent text-[var(--border-medium)] opacity-35'
                      }`}
                    />
                  );
                })}
              </div>
              {readMoreItem.featured && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-medium)] ml-2">
                  Featured
                </span>
              )}
            </div>

            {/* Complete Full Review Text */}
            <blockquote className="text-base sm:text-lg text-[var(--text-primary)] leading-relaxed mb-6 font-normal italic max-h-[60vh] overflow-y-auto pr-1">
              "
              {localized(readMoreItem.reviewTextEn, readMoreItem.reviewTextBn) ||
                readMoreItem.reviewTextEn ||
                readMoreItem.reviewTextBn}
              "
            </blockquote>

            {/* Client Profile */}
            <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center gap-3.5">
              {readMoreItem.avatarImage ? (
                <img
                  src={readMoreItem.avatarImage}
                  alt={readMoreItem.clientName}
                  className="w-12 h-12 rounded-full object-cover border border-[var(--border-medium)] shadow-sm bg-[var(--bg-surface)] shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border-medium)] flex items-center justify-center text-base font-bold text-[var(--accent)] font-mono shadow-sm shrink-0">
                  {readMoreItem.clientName
                    ? readMoreItem.clientName.trim().charAt(0).toUpperCase()
                    : 'C'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 id="read-more-title" className="text-base font-semibold text-[var(--text-heading)] truncate">
                    {readMoreItem.clientName}
                  </h3>
                  <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] truncate mt-0.5">
                  {[readMoreItem.role, readMoreItem.company].filter(Boolean).join(' • ') ||
                    readMoreItem.serviceOrCategory ||
                    readMoreItem.company}
                </p>
                {readMoreItem.date && (
                  <p className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
                    {readMoreItem.date}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portal-based Review Submission Modal */}
      <ReviewSubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        triggerRef={triggerBtnRef}
      />
    </section>
  );
};

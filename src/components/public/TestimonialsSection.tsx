import React, { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import { Star, Quote, CheckCircle2, MessageSquarePlus, X, Sparkles } from 'lucide-react';
import { Testimonial } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ReviewSubmissionModal } from './ReviewSubmissionModal';
import { gsap, ScrollTrigger, Flip } from '../../lib/gsap';

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
  const { localized, language } = useLanguage();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [readMoreItem, setReadMoreItem] = useState<Testimonial | null>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);

  // Filter only published testimonials
  const publishedList = useMemo(() => {
    return (testimonials || [])
      .filter((t) => t.published !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [testimonials]);

  // Determine active slots count for the wall (between 6 and 9 cards)
  const maxActiveSlots = useMemo(() => {
    if (publishedList.length <= 6) return publishedList.length;
    if (publishedList.length <= 9) return publishedList.length;
    return 8; // Optimal 8-slot editorial layout for larger pools
  }, [publishedList.length]);

  // Active cards currently displayed on the editorial wall
  const [activeCards, setActiveCards] = useState<Testimonial[]>([]);

  // Track hover and focus to prevent moving cards being read
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Cooldown tracker for recently hovered/interacted cards
  const recentlyInteractedRef = useRef<Map<string, number>>(new Map());

  // Refs for GSAP & Flip
  const sectionRef = useRef<HTMLElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const flipPendingRef = useRef<boolean>(false);
  const flipStateRef = useRef<any>(null);
  const cardElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const shuffleTimerRef = useRef<any>(null);
  const poolRotateTimerRef = useRef<any>(null);
  const isReducedMotionRef = useRef<boolean>(false);
  const isMobileRef = useRef<boolean>(false);
  const poolIndexRef = useRef<number>(0);

  // Check reduced motion and screen width
  useEffect(() => {
    const checkMotionAndScreen = () => {
      isReducedMotionRef.current =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      isMobileRef.current = typeof window !== 'undefined' && window.innerWidth < 768;
    };
    checkMotionAndScreen();
    window.addEventListener('resize', checkMotionAndScreen);
    return () => window.removeEventListener('resize', checkMotionAndScreen);
  }, []);

  // Initialize or synchronize active cards when publishedList changes
  useEffect(() => {
    if (publishedList.length === 0) {
      setActiveCards([]);
      return;
    }

    setActiveCards((prev) => {
      if (prev.length === 0) {
        // First initialization: place featured cards in prominent anchor slots (e.g. slot 0 and slot 4)
        const featured = publishedList.filter((t) => t.featured);
        const nonFeatured = publishedList.filter((t) => !t.featured);
        const initial: Testimonial[] = [];

        // Distribute featured items strategically
        let fIdx = 0;
        let nfIdx = 0;
        for (let i = 0; i < maxActiveSlots; i++) {
          if ((i === 0 || i === 4) && fIdx < featured.length) {
            initial.push(featured[fIdx++]);
          } else if (nfIdx < nonFeatured.length) {
            initial.push(nonFeatured[nfIdx++]);
          } else if (fIdx < featured.length) {
            initial.push(featured[fIdx++]);
          } else {
            break;
          }
        }
        return initial;
      }

      // Preserve existing active cards if still published; replace any that were deleted
      const valid = prev.filter((p) => publishedList.some((t) => t.id === p.id));
      const pool = publishedList.filter((t) => !valid.some((v) => v.id === t.id));

      while (valid.length < maxActiveSlots && pool.length > 0) {
        valid.push(pool.shift()!);
      }
      return valid.slice(0, maxActiveSlots);
    });
  }, [publishedList, maxActiveSlots]);

  // Clean up recently interacted items older than 12 seconds
  const markInteraction = useCallback((id: string) => {
    recentlyInteractedRef.current.set(id, Date.now() + 12000);
  }, []);

  const isCardFrozen = useCallback(
    (card: Testimonial) => {
      if (card.id === hoveredId) return true;
      if (card.id === focusedId) return true;
      if (readMoreItem?.id === card.id) return true;
      const until = recentlyInteractedRef.current.get(card.id);
      if (until && Date.now() < until) return true;
      return false;
    },
    [hoveredId, focusedId, readMoreItem]
  );

  // Initial GSAP viewport entrance animation
  useEffect(() => {
    if (!wallRef.current || activeCards.length === 0) return;

    const cards = wallRef.current.querySelectorAll('.testimonial-wall-card');
    if (cards.length === 0) return;

    if (isReducedMotionRef.current) {
      gsap.set(cards, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 28,
          scale: 0.985,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.75,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: wallRef.current,
            start: 'top 85%',
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [activeCards.length]);

  // Execute Flip animation after DOM update
  useLayoutEffect(() => {
    if (flipPendingRef.current && flipStateRef.current && wallRef.current) {
      flipPendingRef.current = false;
      const state = flipStateRef.current;
      flipStateRef.current = null;

      Flip.from(state, {
        duration: 1.05,
        ease: 'power3.inOut',
        scale: true,
        absolute: false,
        onComplete: () => {
          // Softly refresh ScrollTrigger if Smoother is running
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
          }
        },
      });
    }
  }, [activeCards]);

  // 12. Main Living-Wall Effect: Distant Slot Shuffling with GSAP Flip
  useEffect(() => {
    // Shuffling must NEVER run on mobile or if reduced motion is requested
    if (isReducedMotionRef.current || isMobileRef.current) return;
    if (activeCards.length < 4) return;

    const scheduleNextShuffle = () => {
      // Random interval between 9.5 and 13.5 seconds
      const delay = Math.floor(Math.random() * 4000) + 9500;

      shuffleTimerRef.current = setTimeout(() => {
        // Pause if tab is hidden or user has modal open
        if (document.visibilityState === 'hidden' || readMoreItem !== null) {
          scheduleNextShuffle();
          return;
        }

        // Identify cards eligible to move
        // Keep the top featured anchor (index 0) mostly stable
        const eligibleIndices: number[] = [];
        activeCards.forEach((card, idx) => {
          // Index 0 is a permanent visual anchor
          if (idx === 0 && card.featured) return;
          if (!isCardFrozen(card)) {
            eligibleIndices.push(idx);
          }
        });

        // We need at least 2 distant eligible cards to perform a shuffle
        if (eligibleIndices.length >= 2 && wallRef.current) {
          // Choose 2 distant indices
          // Pick a random eligible index i
          const randA = Math.floor(Math.random() * eligibleIndices.length);
          const idxA = eligibleIndices[randA];

          // Pick a second eligible index that is not adjacent (meaningful distance across slots/columns)
          const distantCandidates = eligibleIndices.filter(
            (idx) => Math.abs(idx - idxA) >= 2 || (idxA % 3 !== idx % 3 && Math.abs(idx - idxA) >= 1)
          );

          const idxB =
            distantCandidates.length > 0
              ? distantCandidates[Math.floor(Math.random() * distantCandidates.length)]
              : eligibleIndices[(randA + 1) % eligibleIndices.length];

          if (idxA !== idxB) {
            // Capture Flip state before DOM reorder
            const cards = wallRef.current.querySelectorAll('.testimonial-wall-card');
            flipStateRef.current = Flip.getState(cards);
            flipPendingRef.current = true;

            // Reorder cards in state
            setActiveCards((prev) => {
              const next = [...prev];
              const temp = next[idxA];
              next[idxA] = next[idxB];
              next[idxB] = temp;
              return next;
            });
          }
        }

        scheduleNextShuffle();
      }, delay);
    };

    scheduleNextShuffle();

    return () => {
      if (shuffleTimerRef.current) clearTimeout(shuffleTimerRef.current);
    };
  }, [activeCards, isCardFrozen, readMoreItem]);

  // 21. Optional Content Pool Rotation:
  // If there are more published testimonials than active slots,
  // occasionally replace ONE inactive card with another from the pool.
  // This runs on a separate, non-overlapping beat from the position shuffle!
  useEffect(() => {
    if (isReducedMotionRef.current || isMobileRef.current) return;
    if (publishedList.length <= activeCards.length) return;

    const schedulePoolRotation = () => {
      // Offset timer: 14 to 18 seconds
      const delay = Math.floor(Math.random() * 4000) + 14000;

      poolRotateTimerRef.current = setTimeout(() => {
        if (document.visibilityState === 'hidden' || readMoreItem !== null) {
          schedulePoolRotation();
          return;
        }

        // Available items in content pool
        const pool = publishedList.filter((p) => !activeCards.some((a) => a.id === p.id));
        if (pool.length === 0) {
          schedulePoolRotation();
          return;
        }

        // Pick next item from pool in round-robin fashion
        const nextTestimonial = pool[poolIndexRef.current % pool.length];
        poolIndexRef.current += 1;

        // Find an inactive candidate slot (exclude anchors, hovered, focused, recently interacted)
        const eligibleSlotIndices: number[] = [];
        activeCards.forEach((card, idx) => {
          if (idx === 0 && card.featured) return; // Keep anchor
          if (!isCardFrozen(card)) {
            eligibleSlotIndices.push(idx);
          }
        });

        if (eligibleSlotIndices.length > 0) {
          // Select one random eligible slot to crossfade
          const targetSlot =
            eligibleSlotIndices[Math.floor(Math.random() * eligibleSlotIndices.length)];
          const targetCard = activeCards[targetSlot];
          const el = cardElementsRef.current.get(targetCard.id);

          if (el) {
            // Soft crossfade: opacity 1 -> 0.35, y: 0 -> 4px
            gsap.to(el, {
              opacity: 0.35,
              y: 4,
              duration: 0.4,
              ease: 'power2.in',
              onComplete: () => {
                setActiveCards((prev) => {
                  const updated = [...prev];
                  updated[targetSlot] = nextTestimonial;
                  return updated;
                });
                // Fade back up to 1
                gsap.to(el, {
                  opacity: 1,
                  y: 0,
                  duration: 0.5,
                  ease: 'power2.out',
                });
              },
            });
          }
        }

        schedulePoolRotation();
      }, delay);
    };

    schedulePoolRotation();

    return () => {
      if (poolRotateTimerRef.current) clearTimeout(poolRotateTimerRef.current);
    };
  }, [publishedList, activeCards, isCardFrozen, readMoreItem]);

  // Track card elements for precise tweening
  const setCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      cardElementsRef.current.set(id, el);
    } else {
      cardElementsRef.current.delete(id);
    }
  }, []);

  const hasTestimonials = publishedList.length > 0;
  const sectionTitle = localized(titleEn, titleBn);

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
          /* Editorial Masonry Wall Layout */
          <div
            ref={wallRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-start"
          >
            {activeCards.map((test, index) => {
              const reviewText =
                localized(test.reviewTextEn, test.reviewTextBn) ||
                test.reviewTextEn ||
                test.reviewTextBn;
              const ratingCount = Math.max(1, Math.min(5, test.rating ?? 5));
              const isFeatured = test.featured === true;
              const hasPhoto = Boolean(test.avatarImage && test.avatarImage.trim().length > 0);
              const isHovered = hoveredId === test.id;
              const isAnchor = index === 0 && isFeatured;

              // Truncation check
              const isLongReview = (reviewText || '').length > 210;
              const displayExcerpt =
                isLongReview && !readMoreItem
                  ? `${reviewText.slice(0, 195).trim()}...`
                  : reviewText;

              return (
                <div
                  key={test.id}
                  data-flip-id={test.id}
                  ref={(el) => setCardRef(test.id, el)}
                  onMouseEnter={() => {
                    setHoveredId(test.id);
                    markInteraction(test.id);
                  }}
                  onMouseLeave={() => {
                    setHoveredId(null);
                    markInteraction(test.id);
                  }}
                  onFocus={() => {
                    setFocusedId(test.id);
                    markInteraction(test.id);
                  }}
                  onBlur={() => {
                    setFocusedId(null);
                    markInteraction(test.id);
                  }}
                  className={`testimonial-wall-card group relative rounded-2xl p-[1.5px] overflow-hidden transition-all duration-300 shadow-[var(--card-shadow)] hover:shadow-2xl hover:-translate-y-1 isolate cursor-default ${
                    isFeatured ? 'ring-1 ring-[var(--accent)]/30' : ''
                  }`}
                >
                  {/* Moving Conic Edge Glow: selectively visible on featured cards or when hovered/focused */}
                  <div
                    className={`absolute -inset-[150%] pointer-events-none transition-opacity duration-500 animate-border-beam-bloom z-0 ${
                      isFeatured || isHovered
                        ? 'opacity-40 dark:opacity-75 group-hover:opacity-95'
                        : 'opacity-0'
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
                      isFeatured || isHovered
                        ? 'opacity-65 dark:opacity-90 group-hover:opacity-100'
                        : 'opacity-0'
                    }`}
                    style={{
                      background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 285deg, var(--primary-accent, #10b981) 325deg, var(--primary-accent, #10b981) 345deg, transparent 360deg)`,
                      animationDelay: `${-(index * 1.5)}s`,
                    }}
                    aria-hidden="true"
                  />

                  {/* Static subtle base border */}
                  <div className="absolute inset-0 rounded-2xl border border-[var(--border-subtle)] pointer-events-none z-10" />

                  {/* Desktop Hover Client Photo Backdrop Reveal */}
                  {hasPhoto && (
                    <div
                      className="hidden sm:block absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out overflow-hidden rounded-[14.5px]"
                      aria-hidden="true"
                    >
                      <img
                        src={test.avatarImage}
                        alt=""
                        className="w-full h-full object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-700 ease-out"
                      />
                      {/* Gradient Scrim for high-contrast typography preservation */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-[var(--bg-card)]/92 to-[var(--bg-card)]/40 transition-colors" />
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

                        {/* Top-Right Badge: Anchor / Featured or Quote Icon */}
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
                          onClick={() => {
                            setReadMoreItem(test);
                            markInteraction(test.id);
                          }}
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
            })}
          </div>
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

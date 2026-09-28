import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight, Tag, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Project } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { gsap, Observer } from '../../lib/gsap';

interface ProjectCarouselProps {
  projects: Project[];
  isHydrated?: boolean;
  autoplay?: boolean;
  intervalSeconds?: number;
}

/**
 * Calculates cyclic shortest distance between any card index and the active index.
 * Returns values like -1 (prev), 0 (active), 1 (next), etc.
 */
function getDistance(index: number, current: number, total: number): number {
  if (total <= 1) return 0;
  let diff = (index - current) % total;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

export const ProjectCarousel: React.FC<ProjectCarouselProps> = ({
  projects,
  isHydrated = false,
  autoplay = true,
  intervalSeconds = 6,
}) => {
  const { localized, t } = useLanguage();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [activeImageLoaded, setActiveImageLoaded] = useState(false);

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const activeImgRef = useRef<HTMLImageElement | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstHydrationRef = useRef(true);

  const total = projects.length;

  // Validate or reset currentIndex upon receiving live Supabase projects
  useEffect(() => {
    if (isHydrated && total > 0) {
      if (isFirstHydrationRef.current) {
        isFirstHydrationRef.current = false;
        setCurrentIndex(0);
        console.info('[Carousel] live dataset ready, count:', total);
      } else if (currentIndex >= total) {
        setCurrentIndex(0);
      }
    }
  }, [isHydrated, total]);

  // Compute transform configuration for a given relative distance
  const getTransformConfig = useCallback((diff: number) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

    if (diff === 0) {
      return {
        xPercent: 0,
        scale: 1,
        opacity: 1,
        zIndex: 30,
        filter: 'brightness(1) blur(0px)',
        pointerEvents: 'auto' as const,
      };
    }

    if (diff === -1) {
      // PREVIOUS (Left side)
      return {
        xPercent: isMobile ? -108 : isTablet ? -72 : -62,
        scale: isMobile ? 0.88 : 0.85,
        opacity: isMobile ? 0 : 0.45,
        zIndex: 20,
        filter: 'brightness(0.6)',
        pointerEvents: isMobile ? ('none' as const) : ('auto' as const),
      };
    }

    if (diff === 1) {
      // NEXT (Right side)
      return {
        xPercent: isMobile ? 108 : isTablet ? 72 : 62,
        scale: isMobile ? 0.88 : 0.85,
        opacity: isMobile ? 0 : 0.45,
        zIndex: 20,
        filter: 'brightness(0.6)',
        pointerEvents: isMobile ? ('none' as const) : ('auto' as const),
      };
    }

    // Queued / hidden cards beyond direct neighbors
    const direction = diff > 0 ? 1 : -1;
    return {
      xPercent: direction * (isMobile ? 140 : 120),
      scale: 0.75,
      opacity: 0,
      zIndex: 10,
      filter: 'brightness(0.4)',
      pointerEvents: 'none' as const,
    };
  }, []);

  // GSAP animation engine: smoothly interpolates positions, scale, opacity, and depth
  const animateCards = useCallback((newIndex: number) => {
    if (!stageRef.current) return;
    const isReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = isReduced ? 0.01 : 0.75;

    cardRefs.current.forEach((el, idx) => {
      if (!el) return;
      const diff = getDistance(idx, newIndex, total);
      const target = getTransformConfig(diff);

      // Instant layer ordering prevents z-index jumping during continuous motion
      if (diff === 0) {
        gsap.set(el, { zIndex: 30 });
      } else if (Math.abs(diff) === 1) {
        gsap.set(el, { zIndex: 20 });
      } else {
        gsap.set(el, { zIndex: 10 });
      }

      gsap.to(el, {
        xPercent: target.xPercent,
        scale: target.scale,
        opacity: target.opacity,
        filter: target.filter,
        duration,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
    });
  }, [total, getTransformConfig]);

  // Unified slide changer with animation lock
  const changeSlide = useCallback((direction: 'next' | 'prev' | number) => {
    if (isTransitioningRef.current || total <= 1) return;
    isTransitioningRef.current = true;

    setCurrentIndex((prev) => {
      let nextIdx: number;
      if (typeof direction === 'number') {
        nextIdx = (direction + total) % total;
      } else if (direction === 'next') {
        nextIdx = (prev + 1) % total;
      } else {
        nextIdx = (prev - 1 + total) % total;
      }

      animateCards(nextIdx);
      return nextIdx;
    });

    resetAutoplayTimer();

    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 760);
  }, [total, animateCards]);

  const prevSlide = useCallback(() => changeSlide('prev'), [changeSlide]);
  const nextSlide = useCallback(() => changeSlide('next'), [changeSlide]);
  const goToSlide = useCallback((idx: number) => changeSlide(idx), [changeSlide]);

  const resetAutoplayTimer = () => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  };

  // Set initial transforms on cards
  useEffect(() => {
    if (!stageRef.current || total === 0) return;
    cardRefs.current.forEach((el, idx) => {
      if (!el) return;
      const diff = getDistance(idx, currentIndex, total);
      const target = getTransformConfig(diff);
      gsap.set(el, {
        xPercent: target.xPercent,
        scale: target.scale,
        opacity: target.opacity,
        zIndex: target.zIndex,
        filter: target.filter,
      });
    });
  }, [isHydrated, total, getTransformConfig]);

  // Window resize handler to adapt transforms responsively
  useEffect(() => {
    const handleResize = () => {
      animateCards(currentIndex);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex, animateCards]);

  // Autoplay management
  useEffect(() => {
    if (!isHydrated || !autoplay || isHovered || total <= 1) {
      resetAutoplayTimer();
      return;
    }

    autoplayTimerRef.current = setInterval(() => {
      if (!isTransitioningRef.current) {
        nextSlide();
      }
    }, intervalSeconds * 1000);

    return () => resetAutoplayTimer();
  }, [isHydrated, autoplay, intervalSeconds, isHovered, total, nextSlide]);

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevSlide, nextSlide]);

  // GSAP Observer Integration: horizontal swipe without trapping vertical scrolling
  useEffect(() => {
    if (!isHydrated || !carouselRef.current || total <= 1) return;

    let gestureCooldown = false;

    const observer = Observer.create({
      target: carouselRef.current,
      type: 'touch,pointer',
      tolerance: 28,
      preventDefault: false, // CRITICAL: Never lock or hijack vertical page scroll
      onLeft: () => {
        if (!isTransitioningRef.current && !gestureCooldown) {
          gestureCooldown = true;
          nextSlide();
          setTimeout(() => {
            gestureCooldown = false;
          }, 600);
        }
      },
      onRight: () => {
        if (!isTransitioningRef.current && !gestureCooldown) {
          gestureCooldown = true;
          prevSlide();
          setTimeout(() => {
            gestureCooldown = false;
          }, 600);
        }
      },
    });

    return () => {
      observer.kill();
    };
  }, [isHydrated, total, nextSlide, prevSlide]);

  // Preload adjacent images
  const activeProject = projects[currentIndex];
  const prevProject = projects[(currentIndex - 1 + total) % total];
  const nextProject = projects[(currentIndex + 1) % total];

  useEffect(() => {
    if (!isHydrated || total <= 1) return;

    const preload = (url?: string) => {
      if (!url || url.startsWith('data:') || url.includes('images.unsplash.com')) return;
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    };

    const prevImg = prevProject?.carouselImage || prevProject?.coverImage;
    const nextImg = nextProject?.carouselImage || nextProject?.coverImage;
    preload(prevImg);
    preload(nextImg);
  }, [isHydrated, currentIndex, total, prevProject, nextProject]);

  // Track active image loaded state
  const activeCover = activeProject?.carouselImage || activeProject?.coverImage;
  useEffect(() => {
    if (!isHydrated || !activeCover) {
      setActiveImageLoaded(false);
      return;
    }
    if (activeImgRef.current?.complete && (activeImgRef.current?.naturalWidth || 0) > 0) {
      setActiveImageLoaded(true);
    } else {
      setActiveImageLoaded(false);
    }
  }, [isHydrated, currentIndex, activeCover]);

  // Card click handler: clicking side cards activates them, clicking active card opens detail
  const handleCardClick = (e: React.MouseEvent, index: number, slug: string) => {
    const diff = getDistance(index, currentIndex, total);
    if (diff !== 0) {
      e.preventDefault();
      e.stopPropagation();
      goToSlide(index);
    } else {
      // Active card clicked: navigate to project case study
      navigate(`/work/${slug}`);
    }
  };

  // Skeleton placeholder before live Supabase data arrives
  if (!isHydrated || total === 0) {
    return (
      <div
        id="featured-project-carousel"
        className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 sm:mb-28 select-none"
      >
        <div className="relative overflow-hidden transition-colors">
          <div className="relative z-10 flex items-center justify-between pb-5 mb-8 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-xs font-semibold tracking-[0.2em] text-[var(--accent)] uppercase">
                FEATURED SPOTLIGHT
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] flex items-center justify-center opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </div>
              <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] flex items-center justify-center opacity-40">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="relative w-full h-[440px] sm:h-[500px] md:h-[560px] flex items-center justify-center overflow-hidden">
            <div className="relative w-full md:w-[72%] lg:w-[66%] h-full rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden shadow-[var(--card-shadow)] flex flex-col items-center justify-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)] font-mono text-base font-bold animate-pulse mb-3">
                KS
              </div>
              <span className="text-xs text-[var(--text-muted)] tracking-wider">
                Loading Featured Showcase...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={carouselRef}
      id="featured-project-carousel"
      className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 sm:mb-28 select-none touch-pan-y"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden transition-colors">
        {/* Header Bar */}
        <div className="relative z-10 flex items-center justify-between pb-5 mb-8 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--accent)] uppercase font-mono">
              {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              id="carousel-prev-btn"
              type="button"
              onClick={prevSlide}
              aria-label="Previous project"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[var(--bg-card)] hover:bg-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent-contrast)] border border-[var(--border-medium)] hover:border-[var(--accent)] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="carousel-next-btn"
              type="button"
              onClick={nextSlide}
              aria-label="Next project"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[var(--bg-card)] hover:bg-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent-contrast)] border border-[var(--border-medium)] hover:border-[var(--accent)] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Layered Reference Deck Stage */}
        <div
          ref={stageRef}
          className="relative w-full h-[440px] sm:h-[500px] md:h-[560px] overflow-hidden"
        >
          {projects.map((proj, idx) => {
            const diff = getDistance(idx, currentIndex, total);
            const isActive = diff === 0;
            const isNeighbor = Math.abs(diff) === 1;
            const imageSource = proj.carouselImage || proj.coverImage;

            return (
              <div
                key={proj.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(idx, el);
                  else cardRefs.current.delete(idx);
                }}
                onClick={(e) => handleCardClick(e, idx, proj.slug)}
                className={`group absolute top-0 left-0 right-0 mx-auto w-[92%] sm:w-[82%] md:w-[72%] lg:w-[66%] xl:w-[64%] h-full rounded-3xl overflow-hidden transition-[box-shadow,border-color] duration-500 bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] dark:border-[#17462b] dark:hover:border-[#10b981] ${
                  isActive
                    ? 'shadow-[var(--card-shadow)] dark:shadow-[0_0_40px_rgba(16,185,129,0.18)] cursor-pointer'
                    : isNeighbor
                    ? 'cursor-pointer hover:opacity-75'
                    : 'pointer-events-none'
                }`}
                style={{ willChange: 'transform, opacity' }}
              >
                {/* Background Image Container */}
                <div className="absolute inset-0 overflow-hidden z-0 bg-[var(--bg-card-subtle)]">
                  {/* Subtle loader placeholder */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-card)] flex items-center justify-center pointer-events-none z-0 transition-opacity duration-300 ${
                      isActive && activeImageLoaded ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)] font-mono text-xs font-bold animate-pulse">
                      KS
                    </div>
                  </div>

                  {imageSource && (
                    <img
                      ref={isActive ? activeImgRef : undefined}
                      src={imageSource}
                      alt={localized(proj.titleEn, proj.titleBn)}
                      loading={isActive ? 'eager' : 'lazy'}
                      fetchPriority={isActive ? 'high' : 'auto'}
                      decoding="async"
                      onLoad={() => {
                        if (isActive) setActiveImageLoaded(true);
                      }}
                      onError={() => {
                        if (isActive) setActiveImageLoaded(true);
                      }}
                      className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 relative z-0 ${
                        isActive && activeImageLoaded ? 'opacity-100' : 'opacity-90'
                      }`}
                    />
                  )}

                  {/* Contrast Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20 pointer-events-none z-10" />

                  {/* Darkening Veil for Side Cards */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-black/45 group-hover:bg-black/25 transition-colors duration-300 pointer-events-none z-15" />
                  )}
                </div>

                {/* Top Meta Header */}
                <div className="relative z-20 flex items-center justify-between gap-3 p-5 sm:p-7 md:p-8 mb-auto">
                  <div className="inline-flex items-center gap-2 dark:bg-[#082014]/90 dark:border-[#17462b] dark:text-[#a7f3d0] dark:shadow-[0_0_12px_rgba(16,185,129,0.2)] bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs text-white/95 tracking-wider uppercase font-semibold border border-white/10">
                    <Tag className="w-3.5 h-3.5 text-[var(--accent)] dark:inline hidden" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] dark:hidden inline" />
                    <span>{proj.category}</span>
                  </div>

                  <div className="hidden sm:inline-flex items-center gap-1.5 dark:bg-[#082014]/90 dark:border-[#17462b] dark:text-[#8ba394] bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs text-white/80 border border-white/10 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-[var(--accent)] dark:inline hidden" />
                    <span>{proj.year}</span>
                  </div>
                </div>

                {/* Bottom Content Area */}
                <div className="relative z-20 p-5 sm:p-7 md:p-8 pt-0 mt-auto">
                  <h3 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2 sm:mb-2.5 line-clamp-2">
                    {localized(proj.titleEn, proj.titleBn)}
                  </h3>

                  {/* Description: Hidden on mobile to prioritize artwork clarity, visible on sm+ */}
                  <p className="hidden sm:block text-sm sm:text-base text-white/85 line-clamp-2 max-w-2xl mb-6 leading-relaxed font-normal">
                    {localized(proj.shortDescriptionEn, proj.shortDescriptionBn)}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 sm:mt-0">
                    <Link
                      to={`/work/${proj.slug}`}
                      onClick={(e) => {
                        if (!isActive) {
                          e.preventDefault();
                          goToSlide(idx);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer hover:-translate-y-0.5 active:scale-98 min-h-[44px]"
                    >
                      <span>{t('work.viewProject')}</span>
                      <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>

                    {proj.roleEn && (
                      <span className="hidden sm:inline-block text-xs text-white/80 border-l border-white/20 pl-3 py-1 font-medium">
                        {localized(proj.roleEn, proj.roleBn)}
                      </span>
                    )}

                    {!isActive && (
                      <span className="text-[11px] font-mono text-[var(--accent)] uppercase tracking-wider bg-black/60 px-3 py-1 rounded-full border border-[var(--accent)]/30">
                        {diff === -1 ? '← Click to View' : 'Click to View →'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Control & Active Project Bar */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-[var(--border-subtle)]">
          {/* Pagination Indicators */}
          <div className="flex items-center gap-2 order-2 sm:order-1">
            {projects.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer min-h-[24px] min-w-[12px] flex items-center justify-center ${
                  currentIndex === idx
                    ? 'w-8 h-2 bg-[var(--accent)] shadow-sm'
                    : 'w-2 h-2 bg-[var(--border-medium)] hover:bg-[var(--border-hover)]'
                }`}
              >
                <span className="sr-only">Slide {idx + 1}</span>
              </button>
            ))}
          </div>

          {/* Main Direct Action CTA Connected to Active Project */}
          <Link
            id="carousel-main-view-project-btn"
            to={`/work/${activeProject.slug}`}
            className="order-1 sm:order-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group active:scale-95 min-h-[44px]"
          >
            <span>{localized('VIEW CASE STUDY', 'কেস স্টাডি দেখুন')}</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          {/* Active Project Meta Info */}
          <div className="order-3 hidden md:flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
            <span className="text-[var(--text-secondary)] font-medium">
              {localized(activeProject.titleEn, activeProject.titleBn)}
            </span>
            <span>·</span>
            <span>{activeProject.year}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

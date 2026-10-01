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
  title?: string;
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
  title = 'SELECTED WORK',
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
      // PREVIOUS (Left side) - 18-22% visibility, well-balanced brightness
      return {
        xPercent: isMobile ? -108 : isTablet ? -66 : -58,
        scale: isMobile ? 0.88 : 0.86,
        opacity: isMobile ? 0 : 0.52,
        zIndex: 20,
        filter: 'brightness(0.68)',
        pointerEvents: isMobile ? ('none' as const) : ('auto' as const),
      };
    }

    if (diff === 1) {
      // NEXT (Right side) - 18-22% visibility, well-balanced brightness
      return {
        xPercent: isMobile ? 108 : isTablet ? 66 : 58,
        scale: isMobile ? 0.88 : 0.86,
        opacity: isMobile ? 0 : 0.52,
        zIndex: 20,
        filter: 'brightness(0.68)',
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
        className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8 select-none"
      >
        <div className="relative overflow-hidden transition-colors">
          {/* Combined Section Header & Controls Row */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 mb-5 sm:mb-7 md:mb-8 border-b border-[var(--border-subtle)]">
            <div>
              <div className="dark:flex hidden items-center gap-2 mb-1.5 sm:mb-2">
                <span className="font-mono text-xs text-[var(--accent)] tracking-widest uppercase">// SPOTLIGHT</span>
              </div>
              <div className="dark:hidden flex items-center gap-2 mb-1.5 sm:mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                  {t('work.sectionTitle')}
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--text-heading)] tracking-tight">
                {title}
              </h2>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-1 sm:pt-0 shrink-0">
              <span className="font-mono text-xs sm:text-sm text-[var(--text-muted)] tracking-wider">01 / --</span>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] flex items-center justify-center opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </div>
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] flex items-center justify-center opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
          {/* Layered Reference Deck Stage with True 16:10 Desktop / 16:9 Mobile Frame */}
          <div className="relative w-full overflow-hidden">
            <div className="w-[92%] sm:w-[74%] md:w-[64%] lg:w-[66%] xl:w-[66%] mx-auto aspect-[16/9] sm:aspect-[16/10] rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden shadow-[var(--card-shadow)] flex flex-col items-center justify-center p-6 sm:p-8">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)] font-mono text-sm font-bold animate-pulse mb-2.5">
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
      className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8 select-none touch-pan-y"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden transition-colors">
        {/* Combined Section Header & Controls Row */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 mb-5 sm:mb-7 md:mb-8 border-b border-[var(--border-subtle)]">
          {/* Left: Section Title */}
          <div>
            <div className="dark:flex hidden items-center gap-2 mb-1.5 sm:mb-2">
              <span className="font-mono text-xs text-[var(--accent)] tracking-widest uppercase">// SPOTLIGHT</span>
            </div>
            <div className="dark:hidden flex items-center gap-2 mb-1.5 sm:mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                {t('work.sectionTitle')}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--text-heading)] tracking-tight">
              {title}
            </h2>
          </div>

          {/* Right: Counter + Navigation Arrows aligned in the same row */}
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-1 sm:pt-0 shrink-0">
            <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-semibold text-[var(--text-muted)]">
              <span className="text-[var(--accent)] font-bold">
                {String(currentIndex + 1).padStart(2, '0')}
              </span>
              <span>/</span>
              <span>{String(total).padStart(2, '0')}</span>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                id="carousel-prev-btn"
                type="button"
                onClick={prevSlide}
                aria-label="Previous project"
                className="w-10 h-10 sm:w-11 sm:h-11 min-w-[40px] min-h-[40px] rounded-full bg-[var(--bg-card)] hover:bg-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent-contrast)] border border-[var(--border-medium)] hover:border-[var(--accent)] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="carousel-next-btn"
                type="button"
                onClick={nextSlide}
                aria-label="Next project"
                className="w-10 h-10 sm:w-11 sm:h-11 min-w-[40px] min-h-[40px] rounded-full bg-[var(--bg-card)] hover:bg-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent-contrast)] border border-[var(--border-medium)] hover:border-[var(--accent)] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Layered Reference Deck Stage with True 16:10 Desktop / 16:9 Mobile Frame */}
        <div
          ref={stageRef}
          className="relative w-full overflow-hidden"
        >
          {/* Natural responsive stage sizer matching the active card's responsive width and ratio */}
          <div
            className="w-[92%] sm:w-[74%] md:w-[64%] lg:w-[66%] xl:w-[66%] mx-auto aspect-[16/9] sm:aspect-[16/10] pointer-events-none invisible"
            aria-hidden="true"
          />

          {projects.map((proj, idx) => {
            const diff = getDistance(idx, currentIndex, total);
            const isActive = diff === 0;
            const isNeighbor = Math.abs(diff) === 1;
            const rawImageSource =
              proj.carouselImage && typeof proj.carouselImage === 'string' && proj.carouselImage.trim() !== ''
                ? proj.carouselImage
                : proj.coverImage && typeof proj.coverImage === 'string' && proj.coverImage.trim() !== ''
                ? proj.coverImage
                : null;
            const imageSource = rawImageSource;

            return (
              <div
                key={proj.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(idx, el);
                  else cardRefs.current.delete(idx);
                }}
                onClick={(e) => handleCardClick(e, idx, proj.slug)}
                className={`group absolute inset-0 top-0 left-0 right-0 mx-auto w-[92%] sm:w-[74%] md:w-[64%] lg:w-[66%] xl:w-[66%] h-full aspect-[16/9] sm:aspect-[16/10] rounded-2xl sm:rounded-3xl overflow-hidden transition-[box-shadow,border-color] duration-500 bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] dark:border-[#17462b] dark:hover:border-[#10b981] flex flex-col justify-between ${
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
                <div className="relative z-20 flex items-center justify-between gap-3 p-4 sm:p-5 md:p-6 shrink-0">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 dark:bg-[#082014]/90 dark:border-[#17462b] dark:text-[#a7f3d0] dark:shadow-[0_0_12px_rgba(16,185,129,0.2)] bg-black/50 backdrop-blur-md px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs text-white/95 tracking-wider uppercase font-semibold border border-white/10">
                    <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--accent)] dark:inline hidden" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] dark:hidden inline" />
                    <span>{proj.category}</span>
                  </div>

                  <div className="hidden sm:inline-flex items-center gap-1.5 dark:bg-[#082014]/90 dark:border-[#17462b] dark:text-[#8ba394] bg-black/50 backdrop-blur-md px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs text-white/80 border border-white/10 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-[var(--accent)] dark:inline hidden" />
                    <span>{proj.year}</span>
                  </div>
                </div>

                {/* Bottom Content Area */}
                <div className="relative z-20 p-4 sm:p-5 md:p-6 pt-0 mt-auto">
                  <h3 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-tight mb-1.5 sm:mb-2.5 line-clamp-1 sm:line-clamp-2">
                    {localized(proj.titleEn, proj.titleBn)}
                  </h3>

                  {/* Description: Hidden on mobile to prioritize artwork clarity, visible on sm+ */}
                  <p className="hidden sm:block text-xs sm:text-sm text-white/85 line-clamp-2 max-w-xl mb-3.5 sm:mb-4.5 leading-relaxed font-normal">
                    {localized(proj.shortDescriptionEn, proj.shortDescriptionBn)}
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
                    {proj.roleEn && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-white/90 bg-black/40 backdrop-blur-md border border-white/10 font-medium">
                        {localized(proj.roleEn, proj.roleBn)}
                      </span>
                    )}

                    {!isActive && (
                      <span className="text-[10px] sm:text-[11px] font-mono text-[var(--accent)] uppercase tracking-wider bg-black/60 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-[var(--accent)]/30">
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
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 sm:mt-7 pt-4 sm:pt-5 border-t border-[var(--border-subtle)]">
          {/* Segmented Progress Indicators */}
          <div className="flex items-center gap-1.5 order-2 sm:order-1" role="tablist" aria-label="Project slide navigation">
            {projects.map((p, idx) => {
              const isActive = currentIndex === idx;
              return (
                <button
                  key={p.id}
                  onClick={() => goToSlide(idx)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Go to slide ${idx + 1}`}
                  className="min-h-[32px] py-2 px-1 cursor-pointer flex items-center justify-center group focus:outline-none"
                >
                  <span
                    className={`h-[3px] rounded-full transition-all duration-300 ease-out motion-reduce:transition-none block ${
                      isActive
                        ? 'w-8 bg-[var(--accent)] opacity-100 shadow-[0_0_8px_var(--accent)]'
                        : 'w-3 bg-[#c2d9cb] dark:bg-[#175233] opacity-40 group-hover:opacity-75 group-hover:w-4'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Main Direct Action CTA Connected to Active Project - Single Focal CTA */}
          {activeProject && (
            <Link
              id="carousel-main-view-project-btn"
              to={`/work/${activeProject.slug}`}
              className="order-1 sm:order-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group active:scale-95 min-h-[44px]"
            >
              <span>{t('work.viewProject')}</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          )}

          {/* Active Project Meta Info */}
          {activeProject && (
            <div className="order-3 hidden md:flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
              <span className="text-[var(--text-secondary)] font-medium">
                {localized(activeProject.titleEn, activeProject.titleBn)}
              </span>
              <span>·</span>
              <span>{activeProject.year}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

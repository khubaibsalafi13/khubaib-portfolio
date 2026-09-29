import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
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
      } else if (currentIndex >= total) {
        setCurrentIndex(0);
      }
    }
  }, [isHydrated, total]);

  // Compute transform configuration for clean editorial presentation
  const getTransformConfig = useCallback((diff: number) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const isTablet = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024;

    if (diff === 0) {
      return {
        xPercent: 0,
        scale: 1,
        opacity: 1,
        zIndex: 30,
        pointerEvents: 'auto' as const,
      };
    }

    if (diff === -1) {
      // PREVIOUS (Left side peek: visible, clean preview without heavy black veil)
      return {
        xPercent: isMobile ? -104 : isTablet ? -82 : -86,
        scale: isMobile ? 0.88 : 0.90,
        opacity: isMobile ? 0.25 : 0.62,
        zIndex: 20,
        pointerEvents: 'auto' as const,
      };
    }

    if (diff === 1) {
      // NEXT (Right side peek: visible, clean preview without heavy black veil)
      return {
        xPercent: isMobile ? 104 : isTablet ? 82 : 86,
        scale: isMobile ? 0.88 : 0.90,
        opacity: isMobile ? 0.25 : 0.62,
        zIndex: 20,
        pointerEvents: 'auto' as const,
      };
    }

    // Queued / hidden cards beyond direct neighbors
    const direction = diff > 0 ? 1 : -1;
    return {
      xPercent: direction * (isMobile ? 130 : 120),
      scale: 0.80,
      opacity: 0,
      zIndex: 10,
      pointerEvents: 'none' as const,
    };
  }, []);

  // GSAP animation engine: clean translation & subtle scale
  const animateCards = useCallback((newIndex: number) => {
    if (!stageRef.current) return;
    const isReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = isReduced ? 0.01 : 0.70;

    cardRefs.current.forEach((el, idx) => {
      if (!el) return;
      const diff = getDistance(idx, newIndex, total);
      const target = getTransformConfig(diff);

      // Layer ordering
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
    }, 720);
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

  // GSAP Observer: horizontal swipe without trapping vertical scrolling
  useEffect(() => {
    if (!isHydrated || !carouselRef.current || total <= 1) return;

    let gestureCooldown = false;

    const observer = Observer.create({
      target: carouselRef.current,
      type: 'touch,pointer',
      tolerance: 28,
      preventDefault: false, // Preserves native vertical page scrolling
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

  // Card click handler: clicking side cards activates them; clicking active card opens detail
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

  // Skeleton placeholder before live data arrives
  if (!isHydrated || total === 0) {
    return (
      <div
        id="featured-project-carousel"
        className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-24 select-none"
      >
        <div className="relative overflow-hidden transition-colors">
          <div className="relative z-10 flex items-center justify-between pb-4 mb-6 border-b border-[var(--border-subtle)]">
            <span className="font-mono text-xs text-[var(--text-muted)] tracking-wider">01 / --</span>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] opacity-40" />
              <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] opacity-40" />
            </div>
          </div>
          <div className="relative w-full h-[210px] sm:h-[280px] md:h-[320px] lg:h-[400px] flex items-center justify-center overflow-hidden">
            <div className="w-[88%] sm:w-[76%] md:w-[62%] lg:w-[58%] aspect-[16/9] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={carouselRef}
      id="featured-project-carousel"
      className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-24 select-none touch-pan-y"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden transition-colors">
        {/* Top Control Bar: Counter on left, Arrows on right */}
        <div className="relative z-10 flex items-center justify-between pb-4 mb-6 border-b border-[var(--border-subtle)]">
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
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-[var(--bg-card)] hover:bg-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent-contrast)] border border-[var(--border-medium)] hover:border-[var(--accent)] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="carousel-next-btn"
              type="button"
              onClick={nextSlide}
              aria-label="Next project"
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-[var(--bg-card)] hover:bg-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent-contrast)] border border-[var(--border-medium)] hover:border-[var(--accent)] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Visual Stage: Dominant 16:9 Central Artwork + Visible Side Previews */}
        <div
          ref={stageRef}
          className="relative w-full h-[210px] sm:h-[280px] md:h-[320px] lg:h-[400px] overflow-hidden"
        >
          {projects.map((proj, idx) => {
            const diff = getDistance(idx, currentIndex, total);
            const isActive = diff === 0;
            const isNeighbor = Math.abs(diff) === 1;
            // Admin-managed Dedicated Carousel Visual with fallback to Cover Image
            const imageSource = proj.carouselImage || proj.coverImage;

            return (
              <div
                key={proj.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(idx, el);
                  else cardRefs.current.delete(idx);
                }}
                onClick={(e) => handleCardClick(e, idx, proj.slug)}
                className={`group absolute top-1/2 -translate-y-1/2 left-0 right-0 mx-auto w-[88%] sm:w-[76%] md:w-[62%] lg:w-[58%] aspect-[16/9] rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-subtle)] dark:border-[#17462b] transition-colors duration-300 ${
                  isActive
                    ? 'cursor-pointer shadow-md'
                    : isNeighbor
                    ? 'cursor-pointer hover:opacity-80'
                    : 'pointer-events-none'
                }`}
                style={{ willChange: 'transform, opacity' }}
                title={isActive ? localized(proj.titleEn, proj.titleBn) : localized('Click to center', 'কেন্দ্রে আনতে ক্লিক করুন')}
              >
                {/* Background Image Container - 100% PURE ARTWORK, NO WEBSITE TEXT OVERLAYS */}
                <div className="relative w-full h-full overflow-hidden bg-[var(--bg-card-subtle)]">
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
                      className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 ${
                        isActive && activeImageLoaded ? 'opacity-100' : 'opacity-90'
                      }`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Project Information Below Image: Clean, compact hierarchy with ONE clear CTA */}
        {activeProject && (
          <div className="relative z-10 mt-6 sm:mt-8 max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            {/* Title & Category/Year */}
            <div className="space-y-1">
              <Link
                to={`/work/${activeProject.slug}`}
                className="group inline-block focus:outline-none"
              >
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--text-heading)] tracking-tight group-hover:text-[var(--accent)] transition-colors">
                  {localized(activeProject.titleEn, activeProject.titleBn)}
                </h3>
              </Link>
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                <span className="uppercase tracking-wider font-semibold text-[var(--accent)]">
                  {activeProject.category}
                </span>
                {activeProject.year && (
                  <>
                    <span className="text-[var(--border-hover)]">/</span>
                    <span>{activeProject.year}</span>
                  </>
                )}
              </div>
            </div>

            {/* ONLY ONE CTA */}
            <div>
              <Link
                id="carousel-view-project-btn"
                to={`/work/${activeProject.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group active:scale-95 min-h-[44px]"
              >
                <span>{t('work.viewProject')}</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Pagination Dots */}
        <div className="relative z-10 flex items-center justify-center gap-2 mt-6">
          {projects.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer min-h-[24px] min-w-[12px] flex items-center justify-center ${
                currentIndex === idx
                  ? 'w-7 h-2 bg-[var(--accent)]'
                  : 'w-2 h-2 bg-[var(--border-medium)] hover:bg-[var(--border-hover)]'
              }`}
            >
              <span className="sr-only">Slide {idx + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

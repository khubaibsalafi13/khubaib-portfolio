import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowUpRight, Tag, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Project } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Observer } from '../../lib/gsap';

interface ProjectCarouselProps {
  projects: Project[];
  isHydrated?: boolean;
  autoplay?: boolean;
  intervalSeconds?: number;
}

export const ProjectCarousel: React.FC<ProjectCarouselProps> = ({
  projects,
  isHydrated = false,
  autoplay = true,
  intervalSeconds = 6,
}) => {
  const { localized, t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [activeImageLoaded, setActiveImageLoaded] = useState(false);
  
  const carouselRef = useRef<HTMLDivElement | null>(null);
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
        const activeCover = projects[0]?.coverImage || '';
        const preview = activeCover.length > 50 ? activeCover.substring(0, 50) + '...' : activeCover;
        console.info('[Carousel] active image:', preview);
      } else if (currentIndex >= total) {
        setCurrentIndex(0);
      }
    }
  }, [isHydrated, total]);

  // Unified transition dispatcher with transition lock to prevent rapid skipped states
  const changeSlide = (direction: 'next' | 'prev' | number) => {
    if (isTransitioningRef.current || total <= 1) return;
    isTransitioningRef.current = true;

    setCurrentIndex((prev) => {
      if (typeof direction === 'number') {
        return (direction + total) % total;
      } else if (direction === 'next') {
        return (prev + 1) % total;
      } else {
        return (prev - 1 + total) % total;
      }
    });

    // Reset autoplay timer whenever user interacts
    resetAutoplayTimer();

    // Release lock after animation finishes
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 480);
  };

  const prevSlide = () => changeSlide('prev');
  const nextSlide = () => changeSlide('next');
  const goToSlide = (idx: number) => changeSlide(idx);

  const resetAutoplayTimer = () => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  };

  // Autoplay management (only active after live hydration)
  useEffect(() => {
    if (!isHydrated || !autoplay || isHovered || total <= 1) {
      resetAutoplayTimer();
      return;
    }

    autoplayTimerRef.current = setInterval(() => {
      if (!isTransitioningRef.current) {
        changeSlide('next');
      }
    }, intervalSeconds * 1000);

    return () => resetAutoplayTimer();
  }, [isHydrated, autoplay, intervalSeconds, isHovered, total]);

  // GSAP Observer Integration for deliberate horizontal gestures without scroll-trapping
  useEffect(() => {
    if (!isHydrated || !carouselRef.current || total <= 1) return;

    let accumulatedDeltaX = 0;
    let gestureCooldown = false;

    const observer = Observer.create({
      target: carouselRef.current,
      type: 'wheel,touch,pointer',
      tolerance: 25,
      preventDefault: false, // CRITICAL: Never hijack vertical page scrolling!

      // Horizontal touch/pointer swipe gestures
      onLeft: () => {
        if (!isTransitioningRef.current && !gestureCooldown) {
          gestureCooldown = true;
          nextSlide();
          setTimeout(() => {
            gestureCooldown = false;
          }, 480);
        }
      },
      onRight: () => {
        if (!isTransitioningRef.current && !gestureCooldown) {
          gestureCooldown = true;
          prevSlide();
          setTimeout(() => {
            gestureCooldown = false;
          }, 480);
        }
      },

      // Intentional horizontal wheel/trackpad gestures
      onWheel: (self) => {
        const absX = Math.abs(self.deltaX);
        const absY = Math.abs(self.deltaY);

        // If gesture is vertical (page scrolling), ignore completely to let page scroll naturally
        if (absY >= absX) {
          accumulatedDeltaX = 0;
          return;
        }

        // Only react to clear, deliberate horizontal gestures
        accumulatedDeltaX += self.deltaX;

        if (Math.abs(accumulatedDeltaX) > 35 && !isTransitioningRef.current && !gestureCooldown) {
          gestureCooldown = true;
          if (accumulatedDeltaX > 0) {
            nextSlide();
          } else {
            prevSlide();
          }
          accumulatedDeltaX = 0;
          setTimeout(() => {
            gestureCooldown = false;
            accumulatedDeltaX = 0;
          }, 480);
        }
      },
    });

    return () => {
      observer.kill();
    };
  }, [isHydrated, total]);

  // Preload ONLY adjacent previous and next slide images upon index change (never preload all)
  // CRITICAL: MUST ONLY RUN AFTER LIVE SUPABASE PROJECT DATA IS HYDRATED
  const activeProject = projects[currentIndex];
  const prevProject = projects[(currentIndex - 1 + total) % total];
  const nextProject = projects[(currentIndex + 1) % total];

  useEffect(() => {
    if (!isHydrated || total <= 1) return;

    const preloadAdjacent = (url?: string) => {
      if (!url || url.startsWith('data:') || url.includes('images.unsplash.com')) return;
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    };

    preloadAdjacent(prevProject?.coverImage);
    preloadAdjacent(nextProject?.coverImage);
  }, [isHydrated, currentIndex, total, prevProject?.coverImage, nextProject?.coverImage]);

  // Synchronize image loaded state for active slide
  useEffect(() => {
    if (!isHydrated || !activeProject?.coverImage) {
      setActiveImageLoaded(false);
      return;
    }
    if (activeImgRef.current?.complete && (activeImgRef.current?.naturalWidth || 0) > 0) {
      setActiveImageLoaded(true);
    } else {
      setActiveImageLoaded(false);
    }
  }, [isHydrated, currentIndex, activeProject?.coverImage]);

  // Render branded matching enclosure placeholder before live Supabase data arrives
  if (!isHydrated || total === 0) {
    return (
      <div
        id="featured-project-carousel"
        className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 sm:mb-28 select-none"
      >
        <div className="relative overflow-hidden transition-colors">
          {/* Header Bar */}
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

          {/* 3-Slide Carousel Viewport with Identical Frame Dimensions */}
          <div className="relative w-full h-[460px] sm:h-[500px] md:h-[540px] flex items-center justify-center overflow-hidden">
            <div className="relative w-full lg:w-[72%] xl:w-[70%] h-full z-20 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden shadow-[var(--card-shadow)] flex flex-col items-center justify-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)] font-mono text-base font-bold animate-pulse mb-3">
                KS
              </div>
              <span className="text-xs text-[var(--text-muted)] tracking-wider">
                Loading Featured Showcase...
              </span>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <div className="w-7 h-1.5 bg-[var(--accent)]/40 rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-[var(--border-medium)] rounded-full" />
              <div className="w-1.5 h-1.5 bg-[var(--border-medium)] rounded-full" />
            </div>

            <div className="order-1 sm:order-2 inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
              <span>EXPLORE SPOTLIGHT</span>
            </div>

            <div className="order-3 hidden md:flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span>Selected Portfolio</span>
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
      {/* Outer Showcase Container */}
      <div className="relative overflow-hidden transition-colors">
        
        <div className="relative z-10 flex items-center justify-between pb-5 mb-8 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--accent)] uppercase">
              {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
          </div>

          {/* Nav Controls */}
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

        {/* 3-Slide Carousel Viewport */}
        <div className="relative w-full h-[430px] sm:h-[490px] md:h-[540px] flex items-center justify-center overflow-hidden">
          
          {/* LEFT SLIDE: Partially visible previous project */}
          {total > 1 && (
            <div
              onClick={prevSlide}
              className="hidden lg:block absolute left-[-15%] xl:left-[-12%] w-[45%] h-[82%] rounded-3xl overflow-hidden bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] opacity-35 hover:opacity-60 scale-90 cursor-pointer transition-all duration-500 z-10 filter blur-[0.5px]"
            >
              {prevProject?.coverImage && isHydrated && (
                <img
                  src={prevProject.coverImage}
                  alt={localized(prevProject.titleEn, prevProject.titleBn)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-card)]/90 via-[var(--bg-card)]/50 to-transparent" />
              <div className="absolute bottom-6 left-8 right-8">
                <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider block mb-1">
                  {prevProject.category}
                </span>
                <p className="text-sm font-semibold text-[var(--text-heading)] truncate">
                  {localized(prevProject.titleEn, prevProject.titleBn)}
                </p>
              </div>
            </div>
          )}

          {/* CENTER SLIDE: Large Dominant Active Project */}
          <div className="relative w-full lg:w-[72%] xl:w-[70%] h-full z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeProject.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="group relative w-full h-full rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] dark:border-[#17462b] dark:hover:border-[#10b981] overflow-hidden shadow-[var(--card-shadow)] dark:shadow-[0_0_35px_rgba(16,185,129,0.12)] transition-all duration-500 flex flex-col justify-between p-5 sm:p-8 md:p-10"
              >
                {/* Background Cover Image with Hover Zoom & Instant Prioritization */}
                <div className="absolute inset-0 overflow-hidden z-0 bg-[var(--bg-card-subtle)]">
                  {/* Lightweight branded placeholder while image is ready */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-card)] flex items-center justify-center pointer-events-none z-0 transition-opacity duration-300 ${
                      activeImageLoaded ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)] font-mono text-xs font-bold animate-pulse">
                      KS
                    </div>
                  </div>

                  {activeProject?.coverImage && isHydrated && (
                    <img
                      ref={activeImgRef}
                      key={activeProject.id + activeProject.coverImage}
                      src={activeProject.coverImage}
                      alt={localized(activeProject.titleEn, activeProject.titleBn)}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      onLoad={() => setActiveImageLoaded(true)}
                      onError={() => setActiveImageLoaded(true)}
                      className={`w-full h-full object-cover object-center transition-all duration-300 ease-out group-hover:scale-105 relative z-0 ${
                        activeImageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  )}
                  {/* Backdrop Gradient for maximum contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 pointer-events-none z-10" />
                </div>

                {/* Top Editorial Meta: Dark theme restores original pill badges with Tag & Calendar; Light theme uses minimal dot kicker */}
                <div className="relative z-10 flex items-center justify-between gap-3 mb-auto">
                  <div className="inline-flex items-center gap-2 dark:bg-[#082014]/90 dark:border-[#17462b] dark:text-[#a7f3d0] dark:shadow-[0_0_12px_rgba(16,185,129,0.2)] bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs text-white/90 tracking-wider uppercase font-medium border border-white/10">
                    <Tag className="w-3.5 h-3.5 text-[var(--accent)] dark:inline hidden" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] dark:hidden inline" />
                    <span>{activeProject.category}</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 dark:bg-[#082014]/90 dark:border-[#17462b] dark:text-[#8ba394] bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-white/80 border border-white/10">
                    <Calendar className="w-3.5 h-3.5 text-[var(--accent)] dark:inline hidden" />
                    <span>{activeProject.year}</span>
                  </div>
                </div>

                {/* Bottom Content Panel */}
                <div className="relative z-10 pt-6">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2.5">
                    {localized(activeProject.titleEn, activeProject.titleBn)}
                  </h3>

                  <p className="text-sm sm:text-base text-white/90 line-clamp-2 max-w-2xl mb-6 leading-relaxed font-normal">
                    {localized(activeProject.shortDescriptionEn, activeProject.shortDescriptionBn)}
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <Link
                      to={`/work/${activeProject.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer hover:-translate-y-0.5 active:scale-98"
                    >
                      <span>{t('work.viewProject')}</span>
                      <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>

                    {activeProject.roleEn && (
                      <span className="text-xs text-white/80 border-l border-white/20 pl-3 py-1 font-medium">
                        {localized(activeProject.roleEn, activeProject.roleBn)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT SLIDE: Partially visible next project */}
          {total > 1 && (
            <div
              onClick={nextSlide}
              className="hidden lg:block absolute right-[-15%] xl:right-[-12%] w-[45%] h-[82%] rounded-2xl overflow-hidden bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] opacity-35 hover:opacity-60 scale-90 cursor-pointer transition-all duration-500 z-10 filter blur-[0.5px]"
            >
              {nextProject?.coverImage && isHydrated && (
                <img
                  src={nextProject.coverImage}
                  alt={localized(nextProject.titleEn, nextProject.titleBn)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-l from-[var(--bg-card)]/90 via-[var(--bg-card)]/50 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6 text-right">
                <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-wider block mb-1">
                  {nextProject.category}
                </span>
                <p className="text-sm font-semibold text-[var(--text-heading)] truncate">
                  {localized(nextProject.titleEn, nextProject.titleBn)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control & Dedicated Active Project CTA Bar */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-[var(--border-subtle)]">
          {/* Pagination Indicators */}
          <div className="flex items-center gap-2 order-2 sm:order-1">
            {projects.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-7 h-1.5 bg-[var(--accent)]'
                    : 'w-1.5 h-1.5 bg-[var(--border-medium)] hover:bg-[var(--border-hover)]'
                }`}
              />
            ))}
          </div>

          {/* Prominent Main Carousel CTA Button Connected to Active Project */}
          <Link
            id="carousel-main-view-project-btn"
            to={`/work/${activeProject.slug}`}
            className="order-1 sm:order-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group active:scale-95"
          >
            <span>{localized('VIEW CASE STUDY', 'কেস স্টাডি দেখুন')}</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          {/* Active project metadata tag */}
          <div className="order-3 hidden md:flex items-center gap-2 text-xs text-[var(--text-muted)]">
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

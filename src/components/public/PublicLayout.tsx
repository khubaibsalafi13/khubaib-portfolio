import React, { useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { gsap, ScrollTrigger, ScrollSmoother } from '../../lib/gsap';
import { Header } from './Header';
import { CursorGlow } from './CursorGlow';
import { smoothScrollTo, refreshScroll } from '../../lib/scrollUtils';

export const PublicLayout: React.FC = () => {
  const location = useLocation();

  useLayoutEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Destroy any stale instance first
    const existing = ScrollSmoother.get();
    if (existing) {
      existing.kill();
    }

    let smoother: any = null;

    if (!prefersReducedMotion) {
      smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: 0.9, // Restrained premium smoothing (0.8 - 1.0 range)
        effects: true,
        smoothTouch: 0.1, // Close to native touch on mobile devices
        normalizeScroll: false,
        ignoreMobileResize: true,
      });
    }

    // Refresh triggers once smoother is initialized
    ScrollTrigger.refresh();

    return () => {
      if (smoother) {
        smoother.kill();
      }
      ScrollTrigger.getAll().forEach((st) => {
        // Only kill ScrollTriggers associated with public smoother
        if (st.vars.id === 'public-smoother-trigger') {
          st.kill();
        }
      });
    };
  }, []);

  // Handle route change scroll positioning and hash targets
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const targetId = hash.replace('#', '');
      const timer = setTimeout(() => {
        smoothScrollTo('#' + targetId, true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      const smoother = ScrollSmoother.get();
      if (smoother) {
        smoother.scrollTo(0, false);
      } else {
        window.scrollTo(0, 0);
      }
    }

    refreshScroll();
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] selection:bg-[var(--selection-bg)] selection:text-[var(--selection-text)] transition-colors duration-200">
      {/* Brand-colored cursor glow (independent of ScrollSmoother) */}
      <CursorGlow />

      {/* Stable fixed Header (outside smooth-wrapper so transforms do not affect it) */}
      <Header />

      {/* Official GSAP ScrollSmoother Structure for Public Website */}
      <div id="smooth-wrapper" className="w-full min-h-screen overflow-hidden">
        <div id="smooth-content" className="w-full min-h-screen flex flex-col justify-between">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

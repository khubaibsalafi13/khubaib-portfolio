import React, { useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { gsap, ScrollTrigger, ScrollSmoother } from '../../lib/gsap';
import { Header } from './Header';
import { CursorGlow } from './CursorGlow';
import { smoothScrollTo, refreshScroll } from '../../lib/scrollUtils';

/**
 * Removes any leftover inline styles applied by GSAP ScrollSmoother,
 * guaranteeing clean, direct native browser scrolling on mobile/touch devices.
 */
function resetSmootherInlineStyles() {
  const wrapper = document.getElementById('smooth-wrapper');
  const content = document.getElementById('smooth-content');
  if (wrapper) {
    wrapper.style.removeProperty('position');
    wrapper.style.removeProperty('height');
    wrapper.style.removeProperty('width');
    wrapper.style.removeProperty('top');
    wrapper.style.removeProperty('left');
    wrapper.style.removeProperty('overflow');
    wrapper.style.removeProperty('box-sizing');
  }
  if (content) {
    content.style.removeProperty('transform');
    content.style.removeProperty('width');
    content.style.removeProperty('will-change');
    content.style.removeProperty('overflow');
  }
}

export const PublicLayout: React.FC = () => {
  const location = useLocation();

  useLayoutEffect(() => {
    // 1. Ensure no duplicate or stale ScrollSmoother instance exists
    const existing = ScrollSmoother.get();
    if (existing) {
      existing.kill();
    }
    resetSmootherInlineStyles();

    // 2. Setup responsive context via gsap.matchMedia
    const mm = gsap.matchMedia();

    // DESKTOP / fine pointer devices:
    // Active only when viewport >= 1024px AND using a fine pointer (mouse / trackpad)
    mm.add(
      {
        isDesktop: '(min-width: 1024px) and (pointer: fine)',
        prefersReduced: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { isDesktop, prefersReduced } = context.conditions as {
          isDesktop: boolean;
          prefersReduced: boolean;
        };

        // MOBILE / touch devices / reduced-motion:
        // Completely disable ScrollSmoother and use native browser scrolling.
        // Never use smoothTouch. Ensure no transformed catch-up or leftover styles.
        if (!isDesktop || prefersReduced || ScrollTrigger.isTouch === 1) {
          const active = ScrollSmoother.get();
          if (active) {
            active.kill();
          }
          resetSmootherInlineStyles();
          ScrollTrigger.refresh();
          return;
        }

        // Kill any duplicate before creating a fresh instance
        const prev = ScrollSmoother.get();
        if (prev) {
          prev.kill();
        }
        resetSmootherInlineStyles();

        // Create ScrollSmoother exclusively for Desktop / fine pointer devices
        const smoother = ScrollSmoother.create({
          wrapper: '#smooth-wrapper',
          content: '#smooth-content',
          smooth: 0.9, // Restrained premium smoothing (0.8 - 1.0 range)
          effects: true,
          smoothTouch: false, // Explicitly disabled: do NOT use smoothTouch
          normalizeScroll: false,
          ignoreMobileResize: true,
        });

        ScrollTrigger.refresh();

        return () => {
          if (smoother) {
            smoother.kill();
          }
          resetSmootherInlineStyles();
          ScrollTrigger.refresh();
        };
      }
    );

    ScrollTrigger.refresh();

    return () => {
      mm.revert();
      const finalCheck = ScrollSmoother.get();
      if (finalCheck) {
        finalCheck.kill();
      }
      resetSmootherInlineStyles();
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

      {/* GSAP ScrollSmoother Structure:
          - Desktop / fine pointer: ScrollSmoother automatically manages wrapper & content transforms.
          - Mobile / touch devices: ScrollSmoother is completely disabled, wrapper is neutral
            without overflow-hidden, delivering direct, unhindered native touch scrolling. */}
      <div id="smooth-wrapper" className="w-full min-h-screen">
        <div id="smooth-content" className="w-full min-h-screen flex flex-col justify-between">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

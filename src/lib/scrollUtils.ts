import { ScrollSmoother, ScrollTrigger } from './gsap';

/**
 * Smoothly scrolls to a selector, ID, or DOM element.
 * Uses ScrollSmoother if active on desktop fine-pointer devices,
 * or standard native window smooth scrolling on mobile/touch devices.
 */
export function smoothScrollTo(target: string | HTMLElement, smooth: boolean = true) {
  if (typeof window === 'undefined') return;

  const smoother = ScrollSmoother.get();
  if (smoother) {
    smoother.scrollTo(target, smooth, 'top 84px');
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el) {
      // Header offset compensation with generous breathing room below sticky header (~20px extra)
      const header = document.querySelector('header');
      const headerHeight = header ? header.getBoundingClientRect().height : 72;
      const breathingRoom = 20;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - (headerHeight + breathingRoom);

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }
}

/**
 * Refreshes ScrollTrigger and ScrollSmoother calculations after dynamic content/layout changes.
 */
export function refreshScroll() {
  if (typeof window === 'undefined') return;
  // Use requestAnimationFrame to ensure DOM layout has rendered
  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
}

import { gsap, ScrollSmoother, ScrollTrigger } from './gsap';

/**
 * Smoothly scrolls to a selector, ID, or DOM element using ScrollSmoother if active,
 * or standard smooth scrolling as fallback.
 */
export function smoothScrollTo(target: string | HTMLElement, smooth: boolean = true) {
  if (typeof window === 'undefined') return;

  const smoother = ScrollSmoother.get();
  if (smoother) {
    smoother.scrollTo(target, smooth, 'top top');
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el) {
      el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
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

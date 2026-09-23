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
    smoother.scrollTo(target, smooth, 'top top');
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el) {
      // Header offset compensation for fixed navigation bar (~72px)
      const header = document.querySelector('header');
      const headerHeight = header ? header.getBoundingClientRect().height : 72;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

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

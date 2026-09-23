import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { Observer } from 'gsap/Observer';
import { Flip } from 'gsap/Flip';
import { useGSAP } from '@gsap/react';

// Register plugins once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, Observer, Flip);
}

export { gsap, ScrollTrigger, ScrollSmoother, Observer, Flip, useGSAP };

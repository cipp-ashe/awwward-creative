/**
 * useLenis Hook
 * 
 * Initializes Lenis smooth scrolling with proper GSAP ScrollTrigger integration.
 * Uses GSAP's ticker for RAF coordination to ensure scroll sync.
 * Respects reduced-motion preferences by disabling smooth scrolling.
 * 
 * @returns React ref containing the Lenis instance (null if reduced motion)
 * 
 * @example
 * const lenisRef = useLenis();
 * 
 * // Scroll to element (if Lenis active)
 * lenisRef.current?.scrollTo('#section-id');
 * 
 * // Stop scrolling
 * lenisRef.current?.stop();
 */

import { useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { EASING_FN } from '@/constants/animation';
import { useMotionConfigSafe } from '@/contexts/MotionConfigContext';

export const useLenis = () => {
  const lenisRef = useRef<Lenis | null>(null);
  const { isReducedMotion } = useMotionConfigSafe();

  // Initialize Lenis instance with GSAP integration
  useEffect(() => {
    if (isReducedMotion) {
      lenisRef.current = null;
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: EASING_FN.easeOutExpo,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    // Critical: Sync Lenis scroll position to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Use GSAP's ticker for unified RAF loop (prevents timing conflicts)
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);

    // Disable GSAP's internal lag smoothing (Lenis handles smoothing)
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isReducedMotion]);

  return lenisRef;
};

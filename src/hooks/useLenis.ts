/**
 * useLenis Hook
 * 
 * Initializes Lenis smooth scrolling with optimized settings.
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
import { EASING_FN } from '@/constants/animation';
import { useMotionConfigSafe } from '@/contexts/MotionConfigContext';

export const useLenis = () => {
  const lenisRef = useRef<Lenis | null>(null);
  const { isReducedMotion } = useMotionConfigSafe();

  useEffect(() => {
    // Skip smooth scrolling if reduced motion preferred
    // This eliminates the RAF loop entirely for a11y
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

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isReducedMotion]);

  return lenisRef;
};

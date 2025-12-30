/**
 * useLenis Hook
 * 
 * Initializes Lenis smooth scrolling with optimized settings.
 * Provides access to the Lenis instance for programmatic control.
 * 
 * @returns React ref containing the Lenis instance
 * 
 * @example
 * const lenisRef = useLenis();
 * 
 * // Scroll to element
 * lenisRef.current?.scrollTo('#section-id');
 * 
 * // Stop scrolling
 * lenisRef.current?.stop();
 */

import { useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import { EASING_FN } from '@/constants/animation';

export const useLenis = () => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
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
    };
  }, []);

  return lenisRef;
};

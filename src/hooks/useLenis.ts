/**
 * useLenis Hook
 * 
 * Initializes Lenis smooth scrolling with optimized settings.
 * Uses central ticker for RAF coordination.
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
import { useTicker } from './useTicker';

export const useLenis = () => {
  const lenisRef = useRef<Lenis | null>(null);
  const { isReducedMotion } = useMotionConfigSafe();

  // Initialize Lenis instance
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

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isReducedMotion]);

  // Use central ticker instead of standalone RAF
  useTicker(() => {
    lenisRef.current?.raf(performance.now());
  }, !isReducedMotion && lenisRef.current !== null);

  return lenisRef;
};

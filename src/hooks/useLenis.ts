/**
 * useLenis Hook
 * 
 * Initializes Lenis smooth scrolling with proper GSAP ScrollTrigger integration.
 * Uses GSAP's ticker for RAF coordination to ensure scroll sync.
 * Respects reduced-motion preferences by disabling smooth scrolling.
 * 
 * ## Critical Integration Points
 * - Syncs Lenis scroll position to GSAP ScrollTrigger via lenis.on('scroll', ScrollTrigger.update)
 * - Uses GSAP ticker (not custom RAF) for unified timing authority
 * - Stores and restores gsap.ticker.lagSmoothing on cleanup to prevent state leaks
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

// GSAP default lagSmoothing values for restoration
const GSAP_DEFAULT_LAG_SMOOTHING = { threshold: 500, adjustedLag: 33 };

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

    // Critical: Register Lenis as ScrollTrigger's scroller proxy
    // This ensures pin calculations use Lenis's virtual scroll position,
    // preventing pin drift and start/end miscalculations on complex layouts
    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (arguments.length && value !== undefined) {
          lenis.scrollTo(value, { immediate: true });
        }
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight
        };
      },
    });

    // Sync Lenis scroll position to GSAP ScrollTrigger
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
      
      // CRITICAL: Restore GSAP default lagSmoothing to prevent state leaks
      // Without this, other routes/pages would inherit disabled lag smoothing
      gsap.ticker.lagSmoothing(
        GSAP_DEFAULT_LAG_SMOOTHING.threshold,
        GSAP_DEFAULT_LAG_SMOOTHING.adjustedLag
      );
      
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isReducedMotion]);

  return lenisRef;
};

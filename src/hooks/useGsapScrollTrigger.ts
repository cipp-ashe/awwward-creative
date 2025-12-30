/**
 * useGsapScrollTrigger Hook
 * 
 * Initializes GSAP ScrollTrigger and provides access to gsap and ScrollTrigger.
 * Handles cleanup of all ScrollTrigger instances on unmount.
 * 
 * @example
 * const { gsap, ScrollTrigger } = useGsapScrollTrigger();
 */

import { useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

export const useGsapScrollTrigger = () => {
  useEffect(() => {
    // Refresh ScrollTrigger after all elements are rendered
    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return { gsap, ScrollTrigger };
};

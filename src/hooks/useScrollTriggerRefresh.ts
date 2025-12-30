import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Refreshes ScrollTrigger calculations after fonts load.
 * 
 * Font loading can cause layout shifts that invalidate ScrollTrigger's
 * pin position calculations. This hook ensures triggers are recalculated
 * once all fonts are ready.
 * 
 * @example
 * // Call once in your main layout component
 * useScrollTriggerRefresh();
 */
export const useScrollTriggerRefresh = (): void => {
  useEffect(() => {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
  }, []);
};

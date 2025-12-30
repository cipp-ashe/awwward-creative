/**
 * useCursorVisibility Hook
 * 
 * Manages global cursor visibility state at the app shell level.
 * This centralizes cursor management to prevent:
 * - State leaks across routes
 * - Conflicts from multiple components trying to control cursor
 * - Broken state on resize/media changes
 * 
 * ## Responsibility
 * - Hides native cursor on desktop non-touch devices
 * - Restores cursor on cleanup
 * - Responds to viewport changes (desktop ↔ mobile)
 * - Respects reduced-motion preferences
 * 
 * @example
 * // Call once in App.tsx or root layout
 * useCursorVisibility();
 */

import { useEffect } from 'react';
import { useMotionConfigSafe } from '@/contexts/MotionConfigContext';

export const useCursorVisibility = () => {
  const { shouldAnimate } = useMotionConfigSafe();

  useEffect(() => {
    // Skip cursor manipulation if animations are disabled
    if (!shouldAnimate) return;

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const updateCursor = (isDesktop: boolean) => {
      if (isDesktop && !isTouchDevice) {
        document.body.style.cursor = 'none';
      } else {
        document.body.style.cursor = 'auto';
      }
    };

    // Initial state
    updateCursor(mediaQuery.matches);

    // Listen for viewport changes
    const handleChange = (e: MediaQueryListEvent) => {
      updateCursor(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      // CRITICAL: Always restore cursor on cleanup
      document.body.style.cursor = 'auto';
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [shouldAnimate]);
};

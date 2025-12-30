/**
 * useScrollTriggerRefresh Hook
 * 
 * Comprehensive layout coordination for GSAP ScrollTrigger.
 * Ensures scroll calculations remain accurate after any layout mutation.
 * 
 * ## Triggers Handled
 * - Font loading (causes text reflow)
 * - Window resize (viewport changes)
 * - Content resize (dynamic content, images loading)
 * - Manual refresh (for programmatic layout changes)
 * 
 * ## Invariants
 * - ScrollTrigger.refresh() is debounced to prevent thrashing
 * - Multiple rapid triggers coalesce into single refresh
 * - Cleanup is guaranteed on unmount
 * 
 * ## Debouncing Strategy
 * - Resize events: 150ms debounce (frequent, needs batching)
 * - Content mutations: 100ms debounce (less frequent)
 * - Font loading: immediate (one-time, critical)
 * 
 * @param options - Configuration for refresh behavior
 * @returns Object with manual refresh trigger
 * 
 * @example
 * // Basic usage - call once in main layout
 * useScrollTriggerRefresh();
 * 
 * // With manual refresh for dynamic content
 * const { refresh } = useScrollTriggerRefresh();
 * useEffect(() => {
 *   loadDynamicContent().then(refresh);
 * }, []);
 * 
 * @module hooks/useScrollTriggerRefresh
 */

import { useEffect, useRef, useCallback } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

// ============================================================================
// TYPES
// ============================================================================

interface UseScrollTriggerRefreshOptions {
  /** 
   * Debounce delay for resize events in ms.
   * @default 150 
   */
  resizeDebounce?: number;
  
  /** 
   * Debounce delay for content mutations in ms.
   * @default 100 
   */
  contentDebounce?: number;
  
  /** 
   * Enable ResizeObserver for content changes.
   * @default true 
   */
  observeContent?: boolean;
  
  /** 
   * CSS selector for content container to observe.
   * @default 'main' 
   */
  contentSelector?: string;
  
  /**
   * Enable window resize listener.
   * @default true
   */
  observeResize?: boolean;
}

interface UseScrollTriggerRefreshReturn {
  /** Manually trigger a ScrollTrigger refresh (debounced) */
  refresh: () => void;
  /** Force immediate refresh without debounce */
  refreshImmediate: () => void;
}

// ============================================================================
// DEBOUNCE UTILITY
// ============================================================================

/**
 * Creates a debounced function that delays invoking func until after
 * wait milliseconds have elapsed since the last time it was invoked.
 */
const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
};

// ============================================================================
// HOOK
// ============================================================================

export const useScrollTriggerRefresh = (
  options: UseScrollTriggerRefreshOptions = {}
): UseScrollTriggerRefreshReturn => {
  const {
    resizeDebounce = 150,
    contentDebounce = 100,
    observeContent = true,
    contentSelector = 'main',
    observeResize = true,
  } = options;

  // Track debounced functions for cleanup
  const resizeHandlerRef = useRef<ReturnType<typeof debounce> | null>(null);
  const contentHandlerRef = useRef<ReturnType<typeof debounce> | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  // Immediate refresh (no debounce)
  const refreshImmediate = useCallback(() => {
    ScrollTrigger.refresh();
  }, []);

  // Debounced refresh for manual calls
  const refresh = useCallback(() => {
    if (contentHandlerRef.current) {
      contentHandlerRef.current();
    } else {
      // Fallback if hook not fully initialized
      ScrollTrigger.refresh();
    }
  }, []);

  useEffect(() => {
    // ========================================================================
    // 1. FONT LOADING - Immediate refresh when fonts ready
    // ========================================================================
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });

    // ========================================================================
    // 2. WINDOW RESIZE - Debounced refresh on viewport changes
    // ========================================================================
    if (observeResize) {
      const debouncedResize = debounce(() => {
        ScrollTrigger.refresh();
      }, resizeDebounce);
      
      resizeHandlerRef.current = debouncedResize;
      window.addEventListener('resize', debouncedResize);
    }

    // ========================================================================
    // 3. CONTENT RESIZE - ResizeObserver for dynamic content
    // ========================================================================
    if (observeContent && typeof ResizeObserver !== 'undefined') {
      const debouncedContent = debounce(() => {
        ScrollTrigger.refresh();
      }, contentDebounce);
      
      contentHandlerRef.current = debouncedContent;
      
      const observer = new ResizeObserver((entries) => {
        // Only refresh if size actually changed (not just observed)
        for (const entry of entries) {
          if (entry.contentRect.height > 0) {
            debouncedContent();
            break; // One refresh is enough
          }
        }
      });
      
      observerRef.current = observer;
      
      // Observe main content container
      const contentElement = document.querySelector(contentSelector);
      if (contentElement) {
        observer.observe(contentElement);
      }
    }

    // ========================================================================
    // 4. ORIENTATION CHANGE - Mobile-specific refresh
    // ========================================================================
    const handleOrientationChange = () => {
      // Orientation change needs a slight delay for layout to settle
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);

    // ========================================================================
    // CLEANUP
    // ========================================================================
    return () => {
      // Cancel pending debounced calls
      resizeHandlerRef.current?.cancel();
      contentHandlerRef.current?.cancel();
      
      // Remove event listeners
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
      }
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      // Disconnect ResizeObserver
      observerRef.current?.disconnect();
    };
  }, [resizeDebounce, contentDebounce, observeContent, contentSelector, observeResize]);

  return { refresh, refreshImmediate };
};

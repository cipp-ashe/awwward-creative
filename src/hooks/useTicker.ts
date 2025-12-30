/**
 * useTicker Hook
 * 
 * Unified animation frame coordinator that wraps GSAP's ticker.
 * This ensures a SINGLE time authority across the entire application:
 * - Lenis smooth scroll
 * - Custom cursor interpolation
 * - Particle systems
 * - All GSAP animations
 * 
 * ## Why GSAP Ticker?
 * GSAP's ticker is already the timing authority for all scroll-linked animations.
 * Using a separate RAF loop creates timing conflicts and micro-jank.
 * This wrapper provides the same API but delegates to GSAP's ticker.
 * 
 * ## Benefits
 * - Single RAF loop for entire app
 * - Automatic sync with GSAP animations
 * - Consistent deltaTime across all systems
 * - Respects reduced-motion preferences
 * 
 * @example
 * const tickerRef = useTicker((deltaTime, elapsedTime) => {
 *   position.x += velocity * deltaTime;
 * });
 * 
 * tickerRef.current?.pause();
 * tickerRef.current?.resume();
 */

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useMotionConfigSafe } from '@/contexts/MotionConfigContext';

// ============================================================================
// TYPES
// ============================================================================

/** Callback signature for ticker subscribers */
export type TickerCallback = (deltaTime: number, elapsedTime: number) => void;

/** Control interface returned to subscribers */
export interface TickerHandle {
  /** Temporarily pause this callback */
  pause: () => void;
  /** Resume this callback */
  resume: () => void;
  /** Check if paused */
  isPaused: () => boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Subscribe to the GSAP animation ticker.
 * 
 * @param callback - Function called each frame with deltaTime (seconds) and elapsedTime (seconds)
 * @param enabled - Whether this subscription is active (default: true)
 * @returns Ref containing control handle (pause/resume)
 */
export const useTicker = (
  callback: TickerCallback,
  enabled: boolean = true
): React.RefObject<TickerHandle | null> => {
  const handleRef = useRef<TickerHandle | null>(null);
  const callbackRef = useRef(callback);
  const isPausedRef = useRef(false);
  const elapsedRef = useRef(0);
  const { isReducedMotion } = useMotionConfigSafe();

  // Keep callback ref updated without re-subscribing
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Skip if disabled or reduced motion
    if (!enabled || isReducedMotion) {
      handleRef.current = null;
      return;
    }

    // Reset state
    isPausedRef.current = false;
    elapsedRef.current = 0;

    // GSAP ticker callback
    // time: elapsed time in seconds from GSAP
    // deltaTime: time since last tick in seconds
    const gsapCallback = (time: number, deltaTime: number) => {
      if (isPausedRef.current) return;
      
      // Convert deltaTime from ms to seconds and cap at 100ms to prevent huge jumps
      const dt = Math.min(deltaTime / 1000, 0.1);
      elapsedRef.current += dt;
      
      try {
        callbackRef.current(dt, elapsedRef.current);
      } catch (e) {
        console.error('[useTicker] Callback error:', e);
      }
    };

    gsap.ticker.add(gsapCallback);

    handleRef.current = {
      pause: () => { isPausedRef.current = true; },
      resume: () => { isPausedRef.current = false; },
      isPaused: () => isPausedRef.current,
    };

    return () => {
      gsap.ticker.remove(gsapCallback);
      handleRef.current = null;
    };
  }, [enabled, isReducedMotion]);

  return handleRef;
};

/**
 * @deprecated Use useTicker hook instead
 * Legacy export for backwards compatibility
 */
export const getTickerInstance = () => {
  console.warn('[useTicker] getTickerInstance is deprecated. Use useTicker hook instead.');
  return null;
};

/**
 * useTicker Hook
 * 
 * Animation frame coordinator that wraps GSAP's ticker for React components.
 * 
 * ## Time Authority Model
 * This hook provides a React-friendly interface to GSAP's ticker, which serves
 * as the timing authority for scroll-linked animations. Note that WebGL (R3F)
 * maintains its own render loop - this is intentional, as 3D rendering has
 * different frame budget requirements than DOM animations.
 * 
 * Systems using GSAP ticker (via this hook):
 * - Lenis smooth scroll
 * - Custom cursor interpolation
 * - Any scroll-linked GSAP animations
 * 
 * Systems with independent loops:
 * - React Three Fiber (WebGL) - uses its own RAF for 3D rendering
 * 
 * ## DeltaTime Contract
 * GSAP's ticker provides deltaTime in MILLISECONDS (confirmed via source).
 * This hook converts to seconds for consumer convenience.
 * 
 * @example
 * const tickerRef = useTicker((deltaTime, elapsedTime) => {
 *   // deltaTime is in seconds (0.016 at 60fps)
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

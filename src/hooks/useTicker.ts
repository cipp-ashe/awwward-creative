/**
 * useTicker Hook
 * 
 * Central animation frame coordinator that consolidates all RAF loops
 * into a single, coordinated requestAnimationFrame loop.
 * 
 * ## Benefits
 * - Single RAF loop reduces CPU overhead
 * - Coordinated read/write cycles prevent layout thrashing
 * - Automatic pause when document is hidden (Page Visibility API)
 * - Consistent delta time for frame-rate independent animations
 * 
 * ## Architecture
 * Uses a singleton pattern - all subscribers share one RAF loop.
 * Callbacks execute in registration order (FIFO).
 * 
 * @example
 * // Subscribe to ticker
 * const tickerRef = useTicker((deltaTime, elapsedTime) => {
 *   // Animation logic here
 *   position.x += velocity * deltaTime;
 * });
 * 
 * // Pause/resume
 * tickerRef.current?.pause();
 * tickerRef.current?.resume();
 * 
 * @module hooks/useTicker
 */

import { useEffect, useRef, useCallback } from 'react';
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

interface Subscriber {
  callback: TickerCallback;
  paused: boolean;
  id: number;
}

// ============================================================================
// SINGLETON TICKER
// ============================================================================

class Ticker {
  private subscribers: Map<number, Subscriber> = new Map();
  private rafId: number | null = null;
  private lastTime: number = 0;
  private elapsedTime: number = 0;
  private isRunning: boolean = false;
  private nextId: number = 0;
  private isPaused: boolean = false;

  constructor() {
    // Auto-pause on visibility change
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  };

  private tick = (currentTime: number) => {
    if (this.isPaused) return;

    // Calculate delta (cap at 100ms to prevent huge jumps after tab switch)
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    this.elapsedTime += deltaTime;

    // Execute all active subscribers
    this.subscribers.forEach((sub) => {
      if (!sub.paused) {
        try {
          sub.callback(deltaTime, this.elapsedTime);
        } catch (e) {
          console.error('[Ticker] Subscriber error:', e);
        }
      }
    });

    // Continue loop if we have subscribers
    if (this.subscribers.size > 0 && !this.isPaused) {
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.isRunning = false;
    }
  };

  private startLoop() {
    if (this.isRunning || this.isPaused) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private stopLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isRunning = false;
  }

  subscribe(callback: TickerCallback): { id: number; handle: TickerHandle } {
    const id = this.nextId++;
    this.subscribers.set(id, { callback, paused: false, id });

    // Start loop if this is first subscriber
    if (this.subscribers.size === 1) {
      this.startLoop();
    }

    const handle: TickerHandle = {
      pause: () => {
        const sub = this.subscribers.get(id);
        if (sub) sub.paused = true;
      },
      resume: () => {
        const sub = this.subscribers.get(id);
        if (sub) sub.paused = false;
      },
      isPaused: () => this.subscribers.get(id)?.paused ?? true,
    };

    return { id, handle };
  }

  unsubscribe(id: number) {
    this.subscribers.delete(id);
    
    // Stop loop if no more subscribers
    if (this.subscribers.size === 0) {
      this.stopLoop();
    }
  }

  pause() {
    this.isPaused = true;
    this.stopLoop();
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    if (this.subscribers.size > 0) {
      this.startLoop();
    }
  }

  /** Get active subscriber count (for debugging) */
  getSubscriberCount(): number {
    return this.subscribers.size;
  }

  destroy() {
    this.stopLoop();
    this.subscribers.clear();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
}

// Singleton instance
let tickerInstance: Ticker | null = null;

const getTicker = (): Ticker => {
  if (!tickerInstance) {
    tickerInstance = new Ticker();
  }
  return tickerInstance;
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Subscribe to the central animation ticker.
 * 
 * @param callback - Function called each frame with deltaTime and elapsedTime
 * @param enabled - Whether this subscription is active (default: true)
 * @returns Ref containing control handle (pause/resume)
 */
export const useTicker = (
  callback: TickerCallback,
  enabled: boolean = true
): React.RefObject<TickerHandle | null> => {
  const handleRef = useRef<TickerHandle | null>(null);
  const callbackRef = useRef(callback);
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

    const ticker = getTicker();
    const { id, handle } = ticker.subscribe((dt, et) => {
      callbackRef.current(dt, et);
    });

    handleRef.current = handle;

    return () => {
      ticker.unsubscribe(id);
      handleRef.current = null;
    };
  }, [enabled, isReducedMotion]);

  return handleRef;
};

/**
 * Get the raw ticker instance for advanced use cases.
 * Prefer useTicker hook for most cases.
 */
export const getTickerInstance = getTicker;

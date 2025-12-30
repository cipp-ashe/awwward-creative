/**
 * Animation Runtime Configuration
 * 
 * Single source of truth for animation system initialization.
 * This module centralizes:
 * - GSAP plugin registration (already in gsap.ts)
 * - Global animation defaults
 * - Development debugging tools
 * - Future: Motion budget enforcement
 * 
 * ## Architecture Decision
 * GSAP registration is kept in gsap.ts for import-time execution.
 * This module provides runtime configuration and debugging utilities.
 * 
 * @example
 * // In main.tsx or App.tsx
 * import { initAnimationRuntime } from '@/lib/animation-runtime';
 * initAnimationRuntime();
 */

import { gsap, ScrollTrigger } from '@/lib/gsap';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface AnimationRuntimeConfig {
  /** Enable ScrollTrigger markers in development */
  enableMarkers: boolean;
  /** Default animation duration */
  defaultDuration: number;
  /** Default easing */
  defaultEase: string;
}

const DEFAULT_CONFIG: AnimationRuntimeConfig = {
  enableMarkers: false,
  defaultDuration: 0.6,
  defaultEase: 'power2.out',
};

// ============================================================================
// INITIALIZATION
// ============================================================================

let isInitialized = false;

/**
 * Initialize the animation runtime with global defaults.
 * Safe to call multiple times - subsequent calls are no-ops.
 * 
 * @param config - Optional configuration overrides
 */
export const initAnimationRuntime = (config: Partial<AnimationRuntimeConfig> = {}) => {
  if (isInitialized) {
    console.debug('[AnimationRuntime] Already initialized, skipping');
    return;
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Set GSAP global defaults
  gsap.defaults({
    ease: finalConfig.defaultEase,
    duration: finalConfig.defaultDuration,
  });

  // Configure ScrollTrigger defaults
  ScrollTrigger.defaults({
    // Only enable markers in dev mode if explicitly requested
    markers: import.meta.env.DEV && finalConfig.enableMarkers,
  });

  // Normalize scroll behavior across browsers
  ScrollTrigger.normalizeScroll(true);

  isInitialized = true;
  console.debug('[AnimationRuntime] Initialized with config:', finalConfig);
};

// ============================================================================
// DEBUGGING UTILITIES
// ============================================================================

/**
 * Get current animation system status.
 * Useful for debugging timing issues.
 */
export const getAnimationStatus = () => {
  return {
    scrollTriggerCount: ScrollTrigger.getAll().length,
    gsapTimeScale: gsap.globalTimeline.timeScale(),
    isInitialized,
  };
};

/**
 * Log all active ScrollTrigger instances.
 * Call from browser console: window.__logScrollTriggers?.()
 */
export const logScrollTriggers = () => {
  const triggers = ScrollTrigger.getAll();
  console.group(`[AnimationRuntime] ${triggers.length} active ScrollTriggers`);
  triggers.forEach((trigger, i) => {
    console.log(`${i}: trigger=${trigger.trigger}, start=${trigger.start}, end=${trigger.end}`);
  });
  console.groupEnd();
  return triggers;
};

// Expose to window for debugging in dev mode
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __logScrollTriggers: typeof logScrollTriggers }).__logScrollTriggers = logScrollTriggers;
  (window as unknown as { __getAnimationStatus: typeof getAnimationStatus }).__getAnimationStatus = getAnimationStatus;
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Full cleanup of animation runtime.
 * Use when unmounting the entire app or in tests.
 * 
 * WARNING: This kills ALL ScrollTriggers globally.
 * For component-level cleanup, use gsap.context().revert()
 */
export const destroyAnimationRuntime = () => {
  ScrollTrigger.killAll();
  gsap.killTweensOf('*');
  isInitialized = false;
  console.debug('[AnimationRuntime] Destroyed');
};

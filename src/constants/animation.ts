/**
 * Animation Constants
 * 
 * Centralized animation configuration for consistent motion across the app.
 * All easing curves and durations are defined here to eliminate magic numbers.
 */

// ============================================================================
// EASING CURVES
// ============================================================================

/**
 * CSS cubic-bezier easing functions.
 * Use with CSS transitions and Tailwind classes.
 */
export const EASING = {
  /** Smooth deceleration - primary easing for most animations */
  smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** Overshoot bounce - for playful interactions */
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  /** Standard ease-out */
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  /** Standard ease-in */
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Standard ease-in-out */
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/**
 * Easing as arrays for Framer Motion.
 * Use with `transition={{ ease: EASING_ARRAY.smooth }}`
 */
export const EASING_ARRAY = {
  smooth: [0.16, 1, 0.3, 1] as const,
  bounce: [0.34, 1.56, 0.64, 1] as const,
  out: [0, 0, 0.2, 1] as const,
  in: [0.4, 0, 1, 1] as const,
  inOut: [0.4, 0, 0.2, 1] as const,
} as const;

/**
 * Mathematical easing functions for JS animations.
 * Use with GSAP, requestAnimationFrame, or custom interpolation.
 */
export const EASING_FN = {
  linear: (t: number): number => t,
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => 1 - (1 - t) * (1 - t),
  easeInOutQuad: (t: number): number => 
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number): number => 
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
  easeOutExpo: (t: number): number => 
    t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  /** Elastic overshoot - for playful reveals */
  elastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
} as const;

// ============================================================================
// DURATIONS
// ============================================================================

/**
 * Standard duration values in seconds.
 * Use with GSAP and Framer Motion.
 */
export const DURATION = {
  /** Micro interactions - 150ms */
  instant: 0.15,
  /** Fast transitions - 300ms */
  fast: 0.3,
  /** Standard transitions - 600ms */
  normal: 0.6,
  /** Slow, dramatic reveals - 1200ms */
  slow: 1.2,
  /** Extra slow for hero animations - 1800ms */
  xslow: 1.8,
} as const;

/**
 * Duration values in milliseconds.
 * Use with setTimeout, CSS, and Tailwind.
 */
export const DURATION_MS = {
  instant: 150,
  fast: 300,
  normal: 600,
  slow: 1200,
  xslow: 1800,
} as const;

// ============================================================================
// STAGGER & DELAYS
// ============================================================================

/**
 * Stagger values for sequential animations.
 */
export const STAGGER = {
  /** Tight stagger for lists - 50ms */
  tight: 0.05,
  /** Standard stagger - 100ms */
  normal: 0.1,
  /** Wide stagger for dramatic effect - 200ms */
  wide: 0.2,
} as const;

/**
 * Standard delay values for animation orchestration.
 */
export const DELAY = {
  /** No delay */
  none: 0,
  /** Micro delay - 100ms */
  micro: 0.1,
  /** Short delay - 300ms */
  short: 0.3,
  /** Medium delay - 500ms */
  medium: 0.5,
  /** Long delay - 1000ms */
  long: 1,
} as const;

// ============================================================================
// SCROLL TRIGGER DEFAULTS
// ============================================================================

/**
 * Default ScrollTrigger configuration values.
 */
export const SCROLL_TRIGGER = {
  /** Default start position */
  start: 'top 80%',
  /** Default end position */
  end: 'bottom 20%',
  /** Toggle actions for reveal animations */
  toggleActions: 'play none none reverse',
} as const;

// ============================================================================
// PRELOADER
// ============================================================================

/**
 * Preloader timing configuration.
 */
export const PRELOADER = {
  /** Minimum display time in ms */
  minDuration: 2000,
  /** Exit animation duration in ms */
  exitDuration: 800,
  /** Progress interpolation factor (0-1) */
  lerpFactor: 0.08,
} as const;

// ============================================================================
// CURSOR
// ============================================================================

/**
 * Custom cursor configuration.
 */
export const CURSOR = {
  /** Lerp factor for smooth following */
  lerpFactor: 0.15,
  /** Scale when hovering interactive elements */
  hoverScale: 1.5,
} as const;

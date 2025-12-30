/**
 * Animation Type Definitions
 */

/**
 * Easing function type - takes progress (0-1) and returns eased value (0-1)
 */
export type EasingFunction = (t: number) => number;

/**
 * CSS cubic-bezier values as a tuple
 */
export type CubicBezier = readonly [number, number, number, number];

/**
 * Animation configuration for Framer Motion
 */
export interface MotionConfig {
  duration?: number;
  delay?: number;
  ease?: CubicBezier | string;
  repeat?: number;
  repeatType?: 'loop' | 'reverse' | 'mirror';
}

/**
 * Scroll-triggered animation configuration
 */
export interface ScrollAnimationConfig {
  /** Start position (e.g., "top 80%") */
  start?: string;
  /** End position (e.g., "bottom 20%") */
  end?: string;
  /** Whether to scrub animation with scroll */
  scrub?: boolean | number;
  /** Toggle actions string */
  toggleActions?: string;
  /** Whether to pin the element */
  pin?: boolean;
  /** Enable debug markers */
  markers?: boolean;
}

/**
 * Reveal animation variants
 */
export interface RevealVariants {
  hidden: {
    opacity?: number;
    y?: number;
    x?: number;
    scale?: number;
    rotate?: number;
  };
  visible: {
    opacity?: number;
    y?: number;
    x?: number;
    scale?: number;
    rotate?: number;
    transition?: MotionConfig;
  };
}

/**
 * Stagger children configuration
 */
export interface StaggerConfig {
  staggerChildren?: number;
  delayChildren?: number;
  staggerDirection?: 1 | -1;
}

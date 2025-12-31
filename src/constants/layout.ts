/**
 * Layout Constants
 * 
 * Centralized layout configuration for consistent spacing and structure.
 * 
 * NOTE: Z-index scale has been migrated to tailwind.config.ts as z-* tokens.
 * Use Tailwind classes (z-nav, z-modal, z-cursor, etc.) instead of JS constants.
 */

// ============================================================================
// BREAKPOINTS
// ============================================================================

/**
 * Breakpoint values in pixels.
 * Matches Tailwind defaults.
 */
export const BREAKPOINT = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1400,
} as const;

// ============================================================================
// SPACING SCALE
// ============================================================================

/**
 * Modular spacing scale for consistent rhythm.
 * Matches existing gap usage patterns.
 * Use these via Tailwind: gap-section-*, p-section-*, m-section-*
 */
export const SPACING = {
  /** 12px (gap-3) - micro spacing */
  '2xs': '0.75rem',
  /** 16px (gap-4) - tight inline elements */
  xs: '1rem',
  /** 24px (gap-6) - related items */
  sm: '1.5rem',
  /** 32px (gap-8) - component spacing */
  md: '2rem',
  /** 48px (gap-12) - section internal */
  lg: '3rem',
  /** 96px (gap-24) - section separation */
  xl: '6rem',
} as const;

// ============================================================================
// VIEWPORT
// ============================================================================

/**
 * Viewport-related thresholds.
 */
export const VIEWPORT = {
  /** Mobile breakpoint for touch detection */
  mobileMax: BREAKPOINT.md - 1,
  /** Intersection Observer threshold for reveals */
  revealThreshold: 0.1,
} as const;

// ============================================================================
// CONTENT WIDTH
// ============================================================================

/**
 * Standardized content width tokens.
 * Use these instead of arbitrary max-w-* values for consistent layouts.
 */
export const CONTENT_WIDTH = {
  /** Narrow width for reading content (672px / 42rem) */
  narrow: '42rem',
  /** Default section width (1024px / 64rem) */
  default: '64rem',
  /** Wide content width (1280px / 80rem) */
  wide: '80rem',
  /** Maximum content width (1400px / 87.5rem) */
  max: '87.5rem',
} as const;

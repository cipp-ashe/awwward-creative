/**
 * Layout Constants
 * 
 * Centralized layout configuration for consistent spacing and structure.
 */

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

/**
 * Z-index scale for layering elements.
 * Use these instead of arbitrary z-index values.
 */
export const Z_INDEX = {
  /** Below default content */
  below: -1,
  /** Default layer */
  base: 0,
  /** Floating elements */
  float: 10,
  /** Fixed navigation */
  nav: 100,
  /** Dropdowns and popovers */
  dropdown: 200,
  /** Modal backdrops */
  modalBackdrop: 300,
  /** Modal content */
  modal: 400,
  /** Toast notifications */
  toast: 500,
  /** Preloader overlay */
  preloader: 9000,
  /** Custom cursor */
  cursor: 10000,
  /** Grain overlay (always on top) */
  grain: 9999,
} as const;

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
// SPACING
// ============================================================================

/**
 * Section-level spacing values.
 */
export const SECTION = {
  /** Padding for section content */
  paddingY: 'clamp(4rem, 10vh, 8rem)',
  /** Maximum content width */
  maxWidth: '1400px',
  /** Horizontal padding */
  paddingX: {
    mobile: '1.5rem',  // 24px
    desktop: '3rem',   // 48px
  },
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

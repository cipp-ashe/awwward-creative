/**
 * @fileoverview Custom hooks barrel export.
 * 
 * Provides centralized access to all application hooks.
 * Import hooks from this file for cleaner imports.
 * 
 * @example
 * import { useLenis, useTicker, useSmoothValue } from '@/hooks';
 * 
 * @module hooks
 */

// ============================================================================
// ANIMATION & MOTION
// ============================================================================

/** Animation frame coordinator wrapping GSAP ticker */
export { useTicker } from './useTicker';
export type { TickerCallback, TickerHandle } from './useTicker';

/** Damped value interpolation for smooth animations */
export { useSmoothValue, useSmoothVec2 } from './useSmoothValue';

/** Smooth scrolling with Lenis */
export { useLenis } from './useLenis';

/** Custom cursor tracking with lerp */
export { useCursor } from './useCursor';

/** Centralized cursor visibility management */
export { useCursorVisibility } from './useCursorVisibility';

// ============================================================================
// SCROLL & LAYOUT
// ============================================================================

/** GSAP ScrollTrigger initialization */
export { useScrollTriggerInit } from './useScrollTriggerInit';

/** Comprehensive ScrollTrigger refresh coordination */
export { useScrollTriggerRefresh } from './useScrollTriggerRefresh';

// ============================================================================
// LOADING & VISIBILITY
// ============================================================================

/** Preloader state management */
export { usePreloaderState } from './usePreloaderState';

/** WebGL visibility and mounting control */
export { useWebGLVisibility } from './useWebGLVisibility';

/** Asset loading with progress tracking */
export { default as useAssetLoader } from './useAssetLoader';

// ============================================================================
// UTILITIES
// ============================================================================

/** Mobile device detection */
export { useIsMobile } from './useMobile';

/** Toast notifications */
export { useToast } from './useToast';

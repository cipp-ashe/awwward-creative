/**
 * MotionConfigContext
 * 
 * Single source of truth for motion preferences across the application.
 * Provides centralized control for reduced-motion accessibility compliance.
 * 
 * ## Invariants
 * - `isReducedMotion` reflects the system preference in real-time
 * - All animation systems must respect this context
 * - Changes propagate immediately to all consumers
 * 
 * ## Usage
 * ```tsx
 * // In App.tsx - wrap entire application
 * <MotionConfigProvider>
 *   <App />
 * </MotionConfigProvider>
 * 
 * // In components
 * const { isReducedMotion, shouldAnimate } = useMotionConfig();
 * if (!shouldAnimate) return <StaticVersion />;
 * ```
 * 
 * @module contexts/MotionConfigContext
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface MotionConfigContextType {
  /** True when user prefers reduced motion */
  isReducedMotion: boolean;
  /** Inverse of isReducedMotion for cleaner conditionals */
  shouldAnimate: boolean;
  /** Scale factor (0-1) for animation intensity. 0 = no motion, 1 = full motion */
  motionScale: number;
}

interface MotionConfigProviderProps {
  children: ReactNode;
  /** Force a specific motion state (for testing) */
  forceReducedMotion?: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const MotionConfigContext = createContext<MotionConfigContextType | null>(null);

// ============================================================================
// MEDIA QUERY
// ============================================================================

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Safely check reduced motion preference.
 * Returns false during SSR or if matchMedia unavailable.
 */
const getReducedMotionPreference = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (!window.matchMedia) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
};

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * Provider component that monitors system motion preferences.
 * 
 * Place at the root of your app, above any animation consumers.
 * Automatically updates when user changes system preferences.
 */
export const MotionConfigProvider = ({ 
  children, 
  forceReducedMotion 
}: MotionConfigProviderProps) => {
  const [isReducedMotion, setIsReducedMotion] = useState(() => 
    forceReducedMotion ?? getReducedMotionPreference()
  );

  useEffect(() => {
    // Skip listener if force override is active
    if (forceReducedMotion !== undefined) {
      setIsReducedMotion(forceReducedMotion);
      return;
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    
    // Set initial value
    setIsReducedMotion(mediaQuery.matches);

    // Listen for changes (user can toggle in system preferences)
    const handleChange = (event: MediaQueryListEvent) => {
      setIsReducedMotion(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [forceReducedMotion]);

  const value: MotionConfigContextType = {
    isReducedMotion,
    shouldAnimate: !isReducedMotion,
    motionScale: isReducedMotion ? 0 : 1,
  };

  return (
    <MotionConfigContext.Provider value={value}>
      {children}
    </MotionConfigContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Access motion configuration from context.
 * 
 * @throws Error if used outside MotionConfigProvider
 * 
 * @example
 * const { isReducedMotion, shouldAnimate, motionScale } = useMotionConfig();
 * 
 * // Skip animation entirely
 * if (!shouldAnimate) return <StaticContent />;
 * 
 * // Scale animation intensity
 * const animationDuration = baseDuration * motionScale;
 */
export const useMotionConfig = (): MotionConfigContextType => {
  const context = useContext(MotionConfigContext);
  
  if (!context) {
    throw new Error(
      'useMotionConfig must be used within a MotionConfigProvider. ' +
      'Wrap your app with <MotionConfigProvider> in App.tsx.'
    );
  }
  
  return context;
};

/**
 * Safe version that returns defaults if outside provider.
 * Use for components that may render outside the provider tree.
 */
export const useMotionConfigSafe = (): MotionConfigContextType => {
  const context = useContext(MotionConfigContext);
  
  return context ?? {
    isReducedMotion: getReducedMotionPreference(),
    shouldAnimate: !getReducedMotionPreference(),
    motionScale: getReducedMotionPreference() ? 0 : 1,
  };
};

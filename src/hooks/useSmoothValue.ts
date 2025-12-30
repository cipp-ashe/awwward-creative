/**
 * useSmoothValue Hook
 * 
 * Provides damped/interpolated values using the central ticker.
 * Prevents visual chaos from rapid input changes (scroll, mouse).
 * 
 * ## Use Cases
 * - Smoothing scroll progress before passing to shaders
 * - Damping mouse position for subtle hover effects
 * - Creating "weighted" transitions that feel organic
 * 
 * ## Algorithm
 * Uses exponential smoothing: `current += (target - current) * factor`
 * Factor is frame-rate independent via deltaTime normalization.
 * 
 * @param targetValue - The raw input value to smooth
 * @param options - Smoothing configuration
 * @returns Smoothed value that gradually approaches target
 * 
 * @example
 * // Smooth scroll progress for WebGL
 * const smoothedScroll = useSmoothValue(scrollProgress, { 
 *   smoothing: 0.08,   // Lower = smoother but laggier
 *   threshold: 0.001   // Stop updating when close enough
 * });
 * 
 * // Different smoothing for different speeds
 * const adaptiveScroll = useSmoothValue(scrollProgress, {
 *   smoothing: isScrollingFast ? 0.15 : 0.06
 * });
 * 
 * @module hooks/useSmoothValue
 */

import { useRef, useState, useCallback } from 'react';
import { useTicker } from './useTicker';
import { useMotionConfigSafe } from '@/contexts/MotionConfigContext';

// ============================================================================
// TYPES
// ============================================================================

interface SmoothValueOptions {
  /** 
   * Smoothing factor (0-1). 
   * Lower = smoother but laggier. Higher = more responsive but less smooth.
   * @default 0.08 
   */
  smoothing?: number;
  
  /** 
   * Stop updating when difference is below this threshold.
   * Prevents unnecessary updates when value has settled.
   * @default 0.0001 
   */
  threshold?: number;
  
  /** 
   * Initial value before first target is received.
   * @default 0 
   */
  initialValue?: number;
}

// ============================================================================
// HOOK
// ============================================================================

export const useSmoothValue = (
  targetValue: number,
  options: SmoothValueOptions = {}
): number => {
  const { 
    smoothing = 0.08, 
    threshold = 0.0001,
    initialValue = 0 
  } = options;
  
  const [smoothedValue, setSmoothedValue] = useState(initialValue);
  const currentRef = useRef(initialValue);
  const targetRef = useRef(targetValue);
  const { isReducedMotion } = useMotionConfigSafe();
  
  // Keep target ref updated
  targetRef.current = targetValue;
  
  // If reduced motion, return target directly (no smoothing)
  if (isReducedMotion) {
    return targetValue;
  }
  
  // Use central ticker for frame-rate independent smoothing
  useTicker((deltaTime) => {
    const target = targetRef.current;
    const current = currentRef.current;
    const diff = Math.abs(target - current);
    
    // Skip update if within threshold (value has settled)
    if (diff < threshold) {
      if (current !== target) {
        currentRef.current = target;
        setSmoothedValue(target);
      }
      return;
    }
    
    // Frame-rate independent smoothing
    // Normalize to 60fps baseline: factor * (deltaTime / (1/60))
    const normalizedFactor = 1 - Math.pow(1 - smoothing, deltaTime * 60);
    const newValue = current + (target - current) * normalizedFactor;
    
    currentRef.current = newValue;
    setSmoothedValue(newValue);
  }, true);
  
  return smoothedValue;
};

// ============================================================================
// VECTOR VARIANT
// ============================================================================

interface Vec2 {
  x: number;
  y: number;
}

interface SmoothVec2Options extends SmoothValueOptions {}

/**
 * Smooths a 2D vector (e.g., mouse position).
 * Same algorithm as useSmoothValue but for { x, y } objects.
 */
export const useSmoothVec2 = (
  targetValue: Vec2,
  options: SmoothVec2Options = {}
): Vec2 => {
  const { 
    smoothing = 0.08, 
    threshold = 0.0001,
    initialValue = 0 
  } = options;
  
  const [smoothedValue, setSmoothedValue] = useState<Vec2>({ 
    x: initialValue, 
    y: initialValue 
  });
  const currentRef = useRef<Vec2>({ x: initialValue, y: initialValue });
  const targetRef = useRef<Vec2>(targetValue);
  const { isReducedMotion } = useMotionConfigSafe();
  
  // Keep target ref updated
  targetRef.current = targetValue;
  
  // If reduced motion, return target directly
  if (isReducedMotion) {
    return targetValue;
  }
  
  useTicker((deltaTime) => {
    const target = targetRef.current;
    const current = currentRef.current;
    const diffX = Math.abs(target.x - current.x);
    const diffY = Math.abs(target.y - current.y);
    
    // Skip if both components settled
    if (diffX < threshold && diffY < threshold) {
      if (current.x !== target.x || current.y !== target.y) {
        currentRef.current = { ...target };
        setSmoothedValue({ ...target });
      }
      return;
    }
    
    // Frame-rate independent smoothing
    const normalizedFactor = 1 - Math.pow(1 - smoothing, deltaTime * 60);
    
    const newX = current.x + (target.x - current.x) * normalizedFactor;
    const newY = current.y + (target.y - current.y) * normalizedFactor;
    
    currentRef.current = { x: newX, y: newY };
    setSmoothedValue({ x: newX, y: newY });
  }, true);
  
  return smoothedValue;
};

/**
 * useCursor Hook
 * 
 * Provides smooth cursor tracking with lerp interpolation.
 * Uses central ticker for RAF coordination.
 * Detects hover states on interactive elements.
 * Respects reduced-motion by using direct position (no lerp).
 * 
 * @returns Object containing cursor position and hover state
 * 
 * @example
 * const { position, isHovering } = useCursor();
 * // position.x, position.y are lerp-interpolated screen coordinates
 * // isHovering is true when over links/buttons
 */

import { useEffect, useRef, useState } from 'react';
import { lerp } from '@/lib/math';
import { CURSOR } from '@/constants/animation';
import { useMotionConfigSafe } from '@/contexts/MotionConfigContext';
import { useTicker } from './useTicker';

interface CursorPosition {
  x: number;
  y: number;
}

export const useCursor = () => {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const targetRef = useRef<CursorPosition>({ x: 0, y: 0 });
  const currentRef = useRef<CursorPosition>({ x: 0, y: 0 });
  
  const { isReducedMotion } = useMotionConfigSafe();

  // Event listeners for mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      
      // If reduced motion, update position directly (no lerp animation)
      if (isReducedMotion) {
        currentRef.current = { ...targetRef.current };
        setPosition({ ...targetRef.current });
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = () => {
      setIsHovering(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [isReducedMotion]);

  // Use central ticker for smooth lerp animation
  useTicker(() => {
    currentRef.current.x = lerp(currentRef.current.x, targetRef.current.x, CURSOR.lerpFactor);
    currentRef.current.y = lerp(currentRef.current.y, targetRef.current.y, CURSOR.lerpFactor);
    setPosition({ ...currentRef.current });
  }, !isReducedMotion);

  return { position, isHovering };
};
